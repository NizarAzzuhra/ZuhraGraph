export type RevisionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type RevisionClassification = 'CORRECTION' | 'REVISION' | 'SCOPE_CHANGE';

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
    this.artworkVersionId = artworkVersionId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public getStatus(): RevisionStatus {
    return this.status;
  }

  public approve(
    classification: RevisionClassification,
    extraFee: number,
    revisionCount: number,
    reason?: string
  ): void {
    if (this.status !== 'PENDING') {
      throw new Error('Hanya permintaan revisi berstatus PENDING yang dapat disetujui.');
    }
    this.status = 'APPROVED';
    this.classification = classification;
    this.extraFee = extraFee;
    // For corrections, revision count should be 0.
    this.reason = reason || null;
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
}
