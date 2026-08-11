export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'REFUNDED';

export class Payment {
  public readonly id: string;
  public readonly orderId: string;
  public readonly amount: number;
  protected status: PaymentStatus;
  private transactionId: string | null;

  constructor(
    id: string,
    orderId: string,
    amount: number,
    status: PaymentStatus = 'PENDING',
    transactionId: string | null = null
  ) {
    this.id = id;
    this.orderId = orderId;
    this.amount = amount;
    this.status = status;
    this.transactionId = transactionId;
  }

  public getStatus(): PaymentStatus {
    return this.status;
  }

  public getTransactionId(): string | null {
    return this.transactionId;
  }

  public markAsSuccess(transactionId: string): void {
    if (this.status === 'SUCCESS') {
      throw new Error('Payment is already successful.');
    }
    this.status = 'SUCCESS';
    this.transactionId = transactionId;
  }

  public markAsFailed(): void {
    this.status = 'FAILED';
  }

  public markAsExpired(): void {
    if (this.status === 'SUCCESS') {
      throw new Error('Cannot expire a successful payment.');
    }
    this.status = 'EXPIRED';
  }

  public refund(): void {
    if (this.status !== 'SUCCESS') {
      throw new Error('Cannot refund a non-successful payment.');
    }
    this.status = 'REFUNDED';
  }
}
