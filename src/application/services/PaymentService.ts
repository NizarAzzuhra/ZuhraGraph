import { PaymentRepository } from '../../domain/interfaces/PaymentRepository';
import { PaymentGateway } from '../../domain/interfaces/PaymentGateway';
import { Payment, PaymentStatus } from '../../domain/entities/Payment';

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
}
