import { NextResponse } from 'next/server';
import { MidtransPaymentGateway } from '../../../../infrastructure/payment/MidtransPaymentGateway';
import { PrismaOrderRepository } from '../../../../infrastructure/repositories/PrismaOrderRepository';
import { PrismaPaymentRepository } from '../../../../infrastructure/repositories/PrismaPaymentRepository';
import { PrismaPackageRepository } from '../../../../infrastructure/repositories/PrismaPackageRepository';
import { OrderService } from '../../../../application/services/OrderService';
import { PaymentService } from '../../../../application/services/PaymentService';

// Mock Notification Service since real one is not yet implemented
class MockNotificationService {
  async sendNotification(userId: string, type: string, content: string) {
    console.log(`Notification to ${userId}: [${type}] ${content}`);
  }
  async markAsRead(notificationId: string) {}
}

const paymentGateway = new MidtransPaymentGateway();
const orderRepository = new PrismaOrderRepository();
const paymentRepository = new PrismaPaymentRepository();
const packageRepository = new PrismaPackageRepository();
const notificationService = new MockNotificationService();

const orderService = new OrderService(
  orderRepository,
  packageRepository,
  paymentRepository,
  paymentGateway,
  notificationService
);

const paymentService = new PaymentService(
  paymentRepository,
  paymentGateway
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
    const order = await orderRepository.findById(order_id);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const payment = await paymentRepository.findByOrderId(order_id);
    if (!payment) {
      return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 });
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
      
      if (currentPaymentStatus !== 'SUCCESS') {
        await paymentService.markPaymentAsSuccessful(payment.id, transaction_id);
      }
      
      if (order.getStatus() === 'AWAITING_PAYMENT') {
        await orderService.handlePaymentSuccess(order.id, transaction_id);
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
