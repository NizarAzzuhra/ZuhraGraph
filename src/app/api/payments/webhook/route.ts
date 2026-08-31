import { NextResponse } from 'next/server';
import { MidtransPaymentGateway } from '../../../../infrastructure/payment/MidtransPaymentGateway';
import { PrismaOrderRepository } from '../../../../infrastructure/repositories/PrismaOrderRepository';
import { PrismaPaymentRepository } from '../../../../infrastructure/repositories/PrismaPaymentRepository';
import { PrismaPackageRepository } from '../../../../infrastructure/repositories/PrismaPackageRepository';
import { OrderService } from '../../../../application/services/OrderService';
import { PaymentService } from '../../../../application/services/PaymentService';

// Mock Notification Service since real one is not yet implemented
class RealNotificationService {
  async sendNotification(userId: string, type: string, content: string) {
    try {
      const { prisma } = await import('../../../../lib/prisma');
      await prisma.notification.create({
        data: {
          userId,
          type: (['ORDER_CREATED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'ORDER_CONFIRMED', 'ARTWORK_UPLOADED', 'REVISION_REQUESTED', 'ORDER_COMPLETED', 'REVIEW_SUBMITTED', 'SYSTEM'].includes(type) ? type : 'SYSTEM') as any,
          content,
          status: 'UNREAD',
        }
      });
    } catch(e) { console.error("Notif Error:", e) }
  }
  async markAsRead(notificationId: string) {}
}

const paymentGateway = new MidtransPaymentGateway();
const orderRepository = new PrismaOrderRepository();
const paymentRepository = new PrismaPaymentRepository();
const packageRepository = new PrismaPackageRepository();
const notificationService = new RealNotificationService();

const orderService = new OrderService(
  orderRepository,
  packageRepository,
  paymentRepository,
  paymentGateway,
  notificationService
);

const paymentService = new PaymentService(
  paymentRepository,
  paymentGateway,
  orderRepository
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Verify Signature
    const signature = body.signature_key;
    if (!signature || !paymentGateway.verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 403 });
    }

    // 2. Validate Data
    const { order_id, transaction_status, gross_amount, transaction_id, fraud_status } = body;

    if (!order_id || !transaction_status || !gross_amount) {
      return NextResponse.json({ success: false, message: 'Malformed payload' }, { status: 400 });
    }

    // 3. Find Order and Payment
    let payment = await paymentRepository.findById(order_id);
    let order: any = null;

    if (payment) {
      // Strategy B: payload.order_id is Payment.id
      order = await orderRepository.findById(payment.orderId);
    } else {
      // Legacy Strategy A Fallback: payload.order_id is Order.id
      order = await orderRepository.findById(order_id);
      if (order) {
        payment = await paymentRepository.findByOrderId(order.id);
      }
    }

    if (!payment || !order) {
      return NextResponse.json({ success: false, message: 'Order or Payment not found' }, { status: 404 });
    }

    // 4. Validate Amount
    const payloadAmount = parseFloat(gross_amount);
    if (payloadAmount !== payment.amount) {
      console.warn(`Amount mismatch for order ${order_id}: payload ${payloadAmount}, db ${payment.amount}`);
      return NextResponse.json({ success: false, message: 'Amount mismatch' }, { status: 400 });
    }

    // 5. Map Status
    let mappedStatus: string | null = null;
    const statusLower = transaction_status.toLowerCase();
    
    if (statusLower === 'settlement') {
      mappedStatus = 'SUCCESS';
    } else if (statusLower === 'capture') {
      if (fraud_status === 'challenge') {
        mappedStatus = 'PENDING';
      } else if (fraud_status === 'accept') {
        mappedStatus = 'SUCCESS';
      }
    } else if (statusLower === 'cancel' || statusLower === 'deny' || statusLower === 'failure') {
      mappedStatus = 'FAILED';
    } else if (statusLower === 'expire') {
      mappedStatus = 'EXPIRED';
    } else if (statusLower === 'refund' || statusLower === 'partial_refund') {
      mappedStatus = 'REFUNDED';
    } else if (statusLower === 'pending') {
      mappedStatus = 'PENDING';
    }

    if (!mappedStatus) {
      console.warn(`Unknown transaction status: ${transaction_status} for order ${order_id}`);
      return NextResponse.json({ success: true, message: 'Unknown status ignored' }, { status: 200 });
    }

    if (mappedStatus === 'REFUNDED') {
      console.warn(`Refund status received for order ${order_id} but refund is not fully supported yet.`);
      return NextResponse.json({ success: true, message: 'Refund status acknowledged but ignored' }, { status: 200 });
    }

    // 6. Idempotency Check & Transitions
    const currentPaymentStatus = payment.getStatus();

    // Prevent status regression: if payment is already SUCCESS, ignore non-SUCCESS/REFUNDED webhooks
    if (currentPaymentStatus === 'SUCCESS' && mappedStatus !== 'SUCCESS') {
      console.info(`Status regression prevented for order ${order_id}. Webhook mapped status: ${mappedStatus}.`);
      return NextResponse.json({ success: true, message: 'Payment already finalized; notification ignored' }, { status: 200 });
    }

    if (mappedStatus === 'SUCCESS') {
      if (currentPaymentStatus === 'SUCCESS' && order.getStatus() === 'PAID') {
        return NextResponse.json({ success: true, message: 'Idempotent success' }, { status: 200 });
      }
      
      if (!transaction_id) {
        console.warn(`Missing transaction_id for SUCCESS payment on order ${order_id}`);
        return NextResponse.json({ success: false, message: 'Missing transaction_id' }, { status: 400 });
      }
      
      const isPaymentUpdateNeeded = currentPaymentStatus !== 'SUCCESS';
      const isOrderUpdateNeeded = order.getStatus() === 'AWAITING_PAYMENT';
      
      const { prisma } = await import('../../../../lib/prisma');

      // Check if this payment is for a RevisionRequest
      const revisionRequest = await prisma.revisionRequest.findFirst({
        where: {
          orderId: order.id,
          status: 'REQUIRES_PAYMENT',
          buyerDecision: 'ACCEPTED',
          extraFee: payment.amount,
        }
      });
      const isRevisionUpdateNeeded = !!revisionRequest;
      
      if (isPaymentUpdateNeeded || isOrderUpdateNeeded || isRevisionUpdateNeeded) {
        if (isPaymentUpdateNeeded) payment.markAsSuccess(transaction_id);
        if (isOrderUpdateNeeded) order.markAsPaid();
        
        await prisma.$transaction(async (tx) => {
          if (isPaymentUpdateNeeded) {
            await tx.payment.upsert({
              where: { id: payment.id },
              update: { status: payment.getStatus(), transactionId: payment.getTransactionId(), token: payment.getToken() },
              create: { id: payment.id, orderId: payment.orderId, amount: payment.amount, status: payment.getStatus(), transactionId: payment.getTransactionId(), token: payment.getToken() }
            });
          }
          if (isOrderUpdateNeeded) {
            await tx.order.upsert({
              where: { id: order.id },
              update: { status: order.getStatus(), totalAmount: order.totalAmount, brief: order.brief },
              create: { id: order.id, buyerId: order.buyerId, packageId: order.packageId, totalAmount: order.totalAmount, brief: order.brief, status: order.getStatus(), createdAt: order.createdAt }
            });
          }
          if (isRevisionUpdateNeeded && revisionRequest) {
            await tx.revisionRequest.update({
              where: { id: revisionRequest.id },
              data: { status: 'APPROVED_PAID' }
            });
          }
        });
        
        if (isOrderUpdateNeeded) {
          await notificationService.sendNotification(order.buyerId, 'PAYMENT_SUCCESS', `Payment for order ${order.id} was successful.`);
        }

        if (isRevisionUpdateNeeded) {
          await notificationService.sendNotification(order.buyerId, 'SYSTEM', `Pembayaran untuk revisi pesanan ${order.id} berhasil.`);
          // Notify admins
          try {
            const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
            for (const admin of admins) {
              await notificationService.sendNotification(admin.id, 'SYSTEM', `Pembeli telah membayar revisi untuk pesanan ${order.id}. Siap dikerjakan.`);
            }
          } catch(e) {
            console.error("Failed to notify admins", e);
          }
        }
      }
      
    } else if (mappedStatus === 'FAILED') {
      if (currentPaymentStatus === 'FAILED') {
        return NextResponse.json({ success: true, message: 'Idempotent failed' }, { status: 200 });
      }
      
      await paymentService.markPaymentAsFailed(payment.id);
      await notificationService.sendNotification(order.buyerId, 'PAYMENT_FAILED', `Payment for order ${order.id} has failed.`);
      
    } else if (mappedStatus === 'EXPIRED') {
      if (currentPaymentStatus === 'EXPIRED') {
        return NextResponse.json({ success: true, message: 'Idempotent expired' }, { status: 200 });
      }
      
      await paymentService.expirePayment(payment.id);
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
