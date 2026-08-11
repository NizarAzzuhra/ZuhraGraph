export type OrderStatus =
  | 'PENDING'
  | 'AWAITING_PAYMENT'
  | 'PAID'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'ARTWORK_UPLOADED'
  | 'WAITING_BUYER_CONFIRMATION'
  | 'REVISION_REQUESTED'
  | 'PROCESSING_REVISION'
  | 'COMPLETED'
  | 'CANCELLED';

export class Order {
  public readonly id: string;
  public readonly buyerId: string;
  public readonly packageId: string;
  protected status: OrderStatus;
  public totalAmount: number;
  public readonly brief: string;
  public readonly createdAt: Date;

  constructor(
    id: string,
    buyerId: string,
    packageId: string,
    totalAmount: number,
    brief: string,
    status: OrderStatus = 'PENDING',
    createdAt: Date = new Date()
  ) {
    this.id = id;
    this.buyerId = buyerId;
    this.packageId = packageId;
    this.totalAmount = totalAmount;
    this.brief = brief;
    this.status = status;
    this.createdAt = createdAt;
  }

  public getStatus(): OrderStatus {
    return this.status;
  }

  public submit(): void {
    if (this.status !== 'PENDING') {
      throw new Error('Only pending orders can be submitted.');
    }
    this.status = 'AWAITING_PAYMENT';
  }

  public markAsPaid(): void {
    if (this.status !== 'AWAITING_PAYMENT') {
      throw new Error('Order must be in AWAITING_PAYMENT state to be marked as paid.');
    }
    this.status = 'PAID';
  }

  public confirm(): void {
    if (this.status !== 'PAID') {
      throw new Error('Order must be paid before confirmation.');
    }
    this.status = 'CONFIRMED';
  }

  public startProcessing(): void {
    if (this.status !== 'CONFIRMED') {
      throw new Error('Order must be confirmed before processing can start.');
    }
    this.status = 'PROCESSING';
  }

  public uploadArtwork(): void {
    if (this.status !== 'PROCESSING' && this.status !== 'PROCESSING_REVISION') {
      throw new Error('Order must be in processing state to upload artwork.');
    }
    this.status = 'ARTWORK_UPLOADED';
  }

  public requestBuyerConfirmation(): void {
    if (this.status !== 'ARTWORK_UPLOADED') {
      throw new Error('Artwork must be uploaded before requesting buyer confirmation.');
    }
    this.status = 'WAITING_BUYER_CONFIRMATION';
  }

  public requestRevision(): void {
    if (this.status !== 'WAITING_BUYER_CONFIRMATION') {
      throw new Error('Order must be waiting for buyer confirmation to request a revision.');
    }
    this.status = 'REVISION_REQUESTED';
  }

  public startRevision(): void {
    if (this.status !== 'REVISION_REQUESTED') {
      throw new Error('Order must have a revision requested before starting a revision.');
    }
    this.status = 'PROCESSING_REVISION';
  }

  public complete(): void {
    if (this.status !== 'WAITING_BUYER_CONFIRMATION') {
      throw new Error('Order must be waiting for buyer confirmation to be completed.');
    }
    this.status = 'COMPLETED';
  }

  public cancel(): void {
    if (this.status === 'COMPLETED') {
      throw new Error('Cannot cancel a completed order.');
    }
    if (this.status === 'CANCELLED') {
      throw new Error('Order is already cancelled.');
    }
    this.status = 'CANCELLED';
  }
}
