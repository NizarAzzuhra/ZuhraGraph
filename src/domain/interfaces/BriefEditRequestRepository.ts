import { BriefEditRequest } from '../entities/BriefEditRequest';

export interface BriefEditRequestRepository {
  findById(id: string): Promise<BriefEditRequest | null>;
  save(request: BriefEditRequest): Promise<void>;
  findAllByOrderId(orderId: string): Promise<BriefEditRequest[]>;
  findPendingByOrderId(orderId: string): Promise<BriefEditRequest | null>;
}
