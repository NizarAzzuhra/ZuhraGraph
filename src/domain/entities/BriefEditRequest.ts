export type BriefEditStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export class BriefEditRequest {
  public readonly id: string;
  public readonly orderId: string;
  public readonly proposedBrief: string;
  protected status: BriefEditStatus;
  public reason: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(
    id: string,
    orderId: string,
    proposedBrief: string,
    status: BriefEditStatus = 'PENDING',
    reason: string | null = null,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    this.id = id;
    this.orderId = orderId;
    this.proposedBrief = proposedBrief;
    this.status = status;
    this.reason = reason;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public getStatus(): BriefEditStatus {
    return this.status;
  }

  public approve(reason?: string): void {
    if (this.status !== 'PENDING') {
      throw new Error('Hanya permintaan brief edit berstatus PENDING yang dapat disetujui.');
    }
    this.status = 'APPROVED';
    this.reason = reason || null;
  }

  public reject(reason: string): void {
    if (this.status !== 'PENDING') {
      throw new Error('Hanya permintaan brief edit berstatus PENDING yang dapat ditolak.');
    }
    if (!reason.trim()) {
      throw new Error('Alasan penolakan wajib diisi.');
    }
    this.status = 'REJECTED';
    this.reason = reason;
  }
}
