import { PaymentRepository } from '../../domain/interfaces/PaymentRepository';
import { PaymentGateway } from '../../domain/interfaces/PaymentGateway';
import { Payment, PaymentStatus } from '../../domain/entities/Payment';
import { v4 as uuidv4 } from 'uuid';

export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentGateway: PaymentGateway
  ) {}

  public async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const payment = await this.paymentRepository.findById(paymentId);
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    const transactionId = payment.getTransactionId();
    if (transactionId && payment.getStatus() === 'PENDING') {
      try {
        const gatewayStatus = await this.paymentGateway.getPaymentStatus(transactionId);
        const mappedStatus = this.mapGatewayStatus(gatewayStatus);

        if (mappedStatus !== payment.getStatus()) {
          switch (mappedStatus) {
            case 'SUCCESS':
              payment.markAsSuccess(transactionId);
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
          await this.paymentRepository.save(payment);
        }
      } catch (error) {
        console.error('Failed to sync payment status from gateway:', error);
      }
    }

    return payment.getStatus();
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

  private mapGatewayStatus(gatewayStatus: string): PaymentStatus {
    switch (gatewayStatus.toLowerCase()) {
      case 'settlement':
      case 'capture':
        return 'SUCCESS';
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
      const existingToken = activePayment.getToken();
      if (existingToken && activePayment.updatedAt) {
        const tokenAge = Date.now() - activePayment.updatedAt.getTime();
        const isExpired = tokenAge > 23 * 60 * 60 * 1000;
        
        if (!isExpired) {
          return { token: existingToken };
        } else {
          activePayment.markAsExpired();
          await this.paymentRepository.save(activePayment);
        }
      } else if (!existingToken) {
        // Token is null, which means previous initiation timed out.
        // Reconciliation check:
        try {
          await this.paymentGateway.getPaymentStatus(activePayment.id);
          // Midtrans found the transaction. Since we lost the token, we can't resume the UI.
          activePayment.markAsFailed();
          await this.paymentRepository.save(activePayment);
        } catch (error: any) {
          // Typically a 404 from Midtrans, meaning it was never created successfully.
          activePayment.markAsFailed();
          await this.paymentRepository.save(activePayment);
        }
      }
    }

    // Create a new Payment attempt
    const newPayment = new Payment(uuidv4(), orderId, activePayment.amount, 'PENDING', null);
    await this.paymentRepository.save(newPayment);

    try {
      const paymentInfo = await this.paymentGateway.initiatePayment(newPayment.id, newPayment.amount, buyerInfo);
      newPayment.setToken(paymentInfo.token);
      await this.paymentRepository.save(newPayment);
      return paymentInfo;
    } catch (error) {
      console.error('Midtrans initiation failed during retry:', error);
      return null;
    }
  }
}
