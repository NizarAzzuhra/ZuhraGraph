export type RevisionStatus = 'PENDING' | 'APPROVED_FREE' | 'REQUIRES_PAYMENT' | 'APPROVED_PAID' | 'REJECTED';
export type RevisionClassification = 'ARTIST_ERROR' | 'MINOR_REVISION' | 'SCOPE_CHANGE';
export type BuyerDecision = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export class RevisionRequest {
  public readonly id: string;
  public readonly orderId: string;
  public readonly revisionCount: number;
  public readonly description: string;
  protected status: RevisionStatus;
  public extraFee: number;
  public classification: RevisionClassification | null;
  public readonly requester: 'BUYER' | 'ADMIN';
  public reason: string | null;
  public buyerDecision: BuyerDecision | null;
  public readonly artworkVersionId: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(
    id: string,
    orderId: string,
    revisionCount: number,
    description: string,
    status: RevisionStatus = 'PENDING',
    extraFee: number = 0,
    classification: RevisionClassification | null = null,
    requester: 'BUYER' | 'ADMIN' = 'BUYER',
    reason: string | null = null,
    buyerDecision: BuyerDecision | null = null,
    artworkVersionId: string | null = null,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    this.id = id;
    this.orderId = orderId;
    this.revisionCount = revisionCount;
    this.description = description;
    this.status = status;
    this.extraFee = extraFee;
    this.classification = classification;
    this.requester = requester;
    this.reason = reason;
    this.buyerDecision = buyerDecision;
    this.artworkVersionId = artworkVersionId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public getStatus(): RevisionStatus {
    return this.status;
  }

  public setStatus(status: RevisionStatus): void {
    this.status = status;
  }

  public approve(
    classification: RevisionClassification,
    extraFee: number,
    revisionCount: number,
    reason?: string
  ): void {
    if (this.status !== 'PENDING') {
      throw new Error('Hanya permintaan revisi berstatus PENDING yang dapat diproses.');
    }
    
    // Paksa extraFee = 0 jika ARTIST_ERROR di level domain entity
    const effectiveFee = classification === 'ARTIST_ERROR' ? 0 : extraFee;

    this.classification = classification;
    this.extraFee = effectiveFee;
    this.reason = reason || null;

    if (effectiveFee > 0) {
      this.status = 'REQUIRES_PAYMENT';
      this.buyerDecision = 'PENDING';
    } else {
      this.status = 'APPROVED_FREE';
      this.buyerDecision = null;
    }
  }

  public reject(reason: string): void {
    if (this.status !== 'PENDING') {
      throw new Error('Hanya permintaan revisi berstatus PENDING yang dapat ditolak.');
    }
    if (!reason.trim()) {
      throw new Error('Alasan penolakan wajib diisi.');
    }
    this.status = 'REJECTED';
    this.reason = reason;
  }

  public acceptPaidRevision(): void {
    if (this.status !== 'REQUIRES_PAYMENT') {
      throw new Error('Permintaan revisi tidak dalam status menunggu pembayaran.');
    }
    this.status = 'APPROVED_PAID';
    this.buyerDecision = 'ACCEPTED';
  }

  public declinePaidRevision(): void {
    if (this.status !== 'REQUIRES_PAYMENT') {
      throw new Error('Permintaan revisi tidak dalam status menunggu pembayaran.');
    }
    this.status = 'REJECTED';
    this.buyerDecision = 'DECLINED';
  }
}
