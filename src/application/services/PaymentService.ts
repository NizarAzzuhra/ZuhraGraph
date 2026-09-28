import { PaymentRepository } from '../../domain/interfaces/PaymentRepository';
import { PaymentGateway } from '../../domain/interfaces/PaymentGateway';
import { Payment, PaymentStatus } from '../../domain/entities/Payment';
import crypto from 'crypto';
import { OrderRepository } from '../../domain/interfaces/OrderRepository';

export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly orderRepository?: OrderRepository
  ) { }

  public async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const payment = await this.paymentRepository.findById(paymentId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    const lookupId = payment.getTransactionId() || payment.id;
    if (lookupId && payment.getStatus() === 'PENDING') {
      try {
        const gatewayRes = await this.paymentGateway.getPaymentStatus(lookupId);
        const mappedStatus = this.mapGatewayStatus(gatewayRes.transaction_status, gatewayRes.fraud_status);

        if (mappedStatus !== payment.getStatus()) {
          switch (mappedStatus) {
            case 'SUCCESS':
              if (!gatewayRes.transaction_id) {
                console.warn(`Missing transaction_id from gateway for payment ${payment.id}`);
              }
              payment.markAsSuccess(gatewayRes.transaction_id || lookupId);
              break;
            case 'FAILED':
              payment.markAsFailed();
              break;
            case 'EXPIRED':
              payment.markAsExpired();
              break;
            case 'REFUNDED':
              payment.refund();
              break;
          }

          if (mappedStatus === 'SUCCESS' && this.orderRepository) {
            const order = await this.orderRepository.findById(payment.orderId);
            if (order && (order.getStatus() === 'AWAITING_PAYMENT' || order.getStatus() === 'PENDING')) {
              if (order.getStatus() === 'PENDING') {
                order.submit();
              }
              order.markAsPaid();
              if (this.paymentRepository.saveWithOrder) {
                await this.paymentRepository.saveWithOrder(payment, order);
              } else {
                await this.paymentRepository.save(payment);
                await this.orderRepository.save(order);
              }
            } else {
              await this.paymentRepository.save(payment);
            }
          } else {
            await this.paymentRepository.save(payment);
          }
        }
      } catch (error) {
        console.error('Failed to sync payment status from gateway:', error);
      }
    }

    return payment.getStatus();
  }

  public async syncPaymentStatusByOrderId(orderId: string): Promise<{
    success: boolean;
    orderStatus: string;
    paymentStatus: PaymentStatus;
    transactionStatus?: string;
    message: string;
  }> {
    const order = await this.orderRepository?.findById(orderId);
    if (!order) {
      throw new Error('Pesanan tidak ditemukan');
    }

    const payment = await this.paymentRepository.findByOrderId(orderId);

    // If order is already PAID or further down the workflow, return current status
    if (order.getStatus() !== 'AWAITING_PAYMENT' && order.getStatus() !== 'PENDING') {
      return {
        success: true,
        orderStatus: order.getStatus(),
        paymentStatus: payment ? payment.getStatus() : 'SUCCESS',
        message: `Pesanan sudah berstatus ${order.getStatus()}`
      };
    }

    if (!payment) {
      return {
        success: false,
        orderStatus: order.getStatus(),
        paymentStatus: 'PENDING',
        message: 'Data pembayaran belum tersedia untuk pesanan ini'
      };
    }

    // Try multiple possible candidate identifiers (transactionId, payment.id, or orderId)
    const candidates = [payment.getTransactionId(), payment.id, orderId].filter(Boolean) as string[];
    let gatewayRes: { transaction_status: string; transaction_id: string; fraud_status?: string } | null = null;

    for (const candidateId of candidates) {
      try {
        const res = await this.paymentGateway.getPaymentStatus(candidateId);
        if (res && res.transaction_status) {
          gatewayRes = res;
          break;
        }
      } catch (err: any) {
        if (err.message === 'Midtrans_404') {
          continue;
        }
        console.warn(`Gateway status check failed for candidate ${candidateId}:`, err);
      }
    }

    if (!gatewayRes) {
      return {
        success: true,
        orderStatus: order.getStatus(),
        paymentStatus: payment.getStatus(),
        message: 'Transaksi belum ditemukan di Midtrans atau masih dalam proses'
      };
    }

    const mappedStatus = this.mapGatewayStatus(gatewayRes.transaction_status, gatewayRes.fraud_status);

    if (mappedStatus === 'SUCCESS') {
      if (payment.getStatus() !== 'SUCCESS') {
        payment.markAsSuccess(gatewayRes.transaction_id || payment.getTransactionId() || payment.id);
      }
      if (order.getStatus() === 'PENDING') {
        order.submit();
      }
      if (order.getStatus() === 'AWAITING_PAYMENT') {
        order.markAsPaid();
      }

      if (this.paymentRepository.saveWithOrder) {
        await this.paymentRepository.saveWithOrder(payment, order);
      } else {
        await this.paymentRepository.save(payment);
        if (this.orderRepository) {
          await this.orderRepository.save(order);
        }
      }

      // Check revision requests
      try {
        const { prisma } = await import('../../lib/prisma');
        const pendingRevision = await prisma.revisionRequest.findFirst({
          where: {
            orderId: order.id,
            status: 'REQUIRES_PAYMENT',
            buyerDecision: 'ACCEPTED'
          }
        });
        if (pendingRevision) {
          await prisma.revisionRequest.update({
            where: { id: pendingRevision.id },
            data: { status: 'APPROVED_PAID' }
          });
        }

        // Notification
        const { PrismaNotificationService } = await import('../../infrastructure/services/PrismaNotificationService');
        const notificationService = new PrismaNotificationService();
        await notificationService.sendNotification(order.buyerId, 'PAYMENT_SUCCESS', `Pembayaran untuk pesanan ${order.id} berhasil dikonfirmasi.`);
        
        const buyer = await prisma.user.findUnique({ where: { id: order.buyerId } });
        const buyerName = buyer?.name || 'Klien';
        await notificationService.sendToAdmins('PAYMENT_SUCCESS', `Pesanan #${order.id} dari ${buyerName} telah dibayar dan siap diproses.`, `/admin/orders/${order.id}`);
      } catch (e) {
        console.error('Failed to handle post-payment tasks (revision/notification):', e);
      }

      return {
        success: true,
        orderStatus: 'PAID',
        paymentStatus: 'SUCCESS',
        transactionStatus: gatewayRes.transaction_status,
        message: 'Pembayaran berhasil diverifikasi dan pesanan diperbarui menjadi PAID.'
      };
    } else if (mappedStatus === 'FAILED') {
      if (payment.getStatus() === 'PENDING') {
        payment.markAsFailed();
        await this.paymentRepository.save(payment);
      }
      return {
        success: true,
        orderStatus: order.getStatus(),
        paymentStatus: 'FAILED',
        transactionStatus: gatewayRes.transaction_status,
        message: 'Pembayaran gagal.'
      };
    } else if (mappedStatus === 'EXPIRED') {
      if (payment.getStatus() === 'PENDING') {
        payment.markAsExpired();
        await this.paymentRepository.save(payment);
      }
      return {
        success: true,
        orderStatus: order.getStatus(),
        paymentStatus: 'EXPIRED',
        transactionStatus: gatewayRes.transaction_status,
        message: 'Pembayaran telah kadaluarsa.'
      };
    } else {
      return {
        success: true,
        orderStatus: order.getStatus(),
        paymentStatus: payment.getStatus(),
        transactionStatus: gatewayRes.transaction_status,
        message: 'Pembayaran masih berstatus pending di gateway.'
      };
    }
  }

  public async markPaymentAsSuccessful(paymentId: string, transactionId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    payment.markAsSuccess(transactionId);
    await this.paymentRepository.save(payment);

    return payment;
  }

  public async markPaymentAsFailed(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    payment.markAsFailed();
    await this.paymentRepository.save(payment);

    return payment;
  }

  public async expirePayment(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    payment.markAsExpired();
    await this.paymentRepository.save(payment);

    return payment;
  }

  private mapGatewayStatus(gatewayStatus: string, fraudStatus?: string): PaymentStatus {
    switch (gatewayStatus.toLowerCase()) {
      case 'settlement':
        return 'SUCCESS';
      case 'capture':
        return (!fraudStatus || fraudStatus.toLowerCase() === 'accept') ? 'SUCCESS' : 'PENDING';
      case 'deny':
      case 'cancel':
      case 'failure':
        return 'FAILED';
      case 'expire':
        return 'EXPIRED';
      case 'refund':
      case 'partial_refund':
        return 'REFUNDED';
      case 'pending':
      default:
        return 'PENDING';
    }
  }

  public async getPaymentByOrderId(orderId: string): Promise<Payment | null> {
    return this.paymentRepository.findByOrderId(orderId);
  }

  public async retryPayment(orderId: string, buyerInfo: any): Promise<{ token: string, redirectUrl?: string } | null> {
    const existingPayments = await this.paymentRepository.findAllByOrderId(orderId);
    if (!existingPayments || existingPayments.length === 0) {
      throw new Error('Payment not found');
    }

    const activePayment = existingPayments[0];
    const status = activePayment.getStatus();

    if (status === 'SUCCESS') {
      throw new Error('Payment is already successful and cannot be retried.');
    }

    if (status === 'PENDING') {
      let isMidtransUsable = false;

      try {
        // Panggil Midtrans getPaymentStatus(Payment.id) sebagai source of truth
        const gatewayRes = await this.paymentGateway.getPaymentStatus(activePayment.id);
        const mappedStatus = this.mapGatewayStatus(gatewayRes.transaction_status);

        if (mappedStatus === 'PENDING') {
          const existingToken = activePayment.getToken();
          if (existingToken) {
            // Midtrans pending dan kita punya token -> pertahankan PENDING, return token lama
            isMidtransUsable = true;
          } else {
            // Midtrans pending tapi kita tidak punya token (e.g. koneksi putus saat create token dulu)
            // Karena tidak mungkin mendapatkan token mentah dari Midtrans lagi, terpaksa kita fail-kan payment ini.
            activePayment.markAsFailed();
            await this.paymentRepository.save(activePayment);
          }
        } else if (mappedStatus === 'SUCCESS') {
          // Midtrans = settlement/capture -> update Payment SUCCESS, jangan buat payment baru, lempar error.
          if (!gatewayRes.transaction_id) {
            console.warn(`Missing transaction_id from gateway for payment ${activePayment.id}`);
          }
          activePayment.markAsSuccess(gatewayRes.transaction_id || activePayment.getTransactionId() || activePayment.id);

          if (this.orderRepository) {
            const order = await this.orderRepository.findById(activePayment.orderId);
            if (order && order.getStatus() === 'AWAITING_PAYMENT') {
              order.markAsPaid();
              if (this.paymentRepository.saveWithOrder) {
                await this.paymentRepository.saveWithOrder(activePayment, order);
              } else {
                await this.paymentRepository.save(activePayment);
                await this.orderRepository.save(order);
              }
            } else {
              await this.paymentRepository.save(activePayment);
            }
          } else {
            await this.paymentRepository.save(activePayment);
          }
          throw new Error('Payment is already successful and cannot be retried.');
        } else {
          // Midtrans = expire/cancel/deny -> update Payment menjadi EXPIRED/FAILED
          activePayment.markAsExpired();
          await this.paymentRepository.save(activePayment);
        }
      } catch (error: any) {
        // Jika request status Midtrans timeout / network error -> return HTTP 503 (akan dilempar ke atas)
        if (error.message === 'Midtrans_Network_Error') {
          throw new Error('Midtrans_Network_Error');
        }
        // Jika Midtrans = 404 (transaksi tidak ditemukan) -> Payment lama ditandai FAILED
        if (error.message === 'Midtrans_404') {
          activePayment.markAsFailed();
          await this.paymentRepository.save(activePayment);
        } else if (error.message === 'Payment is already successful and cannot be retried.') {
          throw error;
        }
      }

      if (isMidtransUsable) {
        return { token: activePayment.getToken() as string };
      }
    }

    // Create a new Payment attempt
    const newPayment = new Payment(crypto.randomUUID(), orderId, activePayment.amount, 'PENDING', null);
    await this.paymentRepository.save(newPayment);

    try {
      const paymentInfo = await this.paymentGateway.initiatePayment(newPayment.id, newPayment.amount, buyerInfo, orderId);
      newPayment.setToken(paymentInfo.token);
      await this.paymentRepository.save(newPayment);
      return paymentInfo;
    } catch (error) {
      console.error('Midtrans initiation failed during retry:', error);
      return null;
    }
  }
}
