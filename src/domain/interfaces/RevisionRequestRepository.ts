import { RevisionRequest } from '../entities/RevisionRequest';

export interface RevisionRequestRepository {
  findById(id: string): Promise<RevisionRequest | null>;
  save(request: RevisionRequest): Promise<void>;
  findAllByOrderId(orderId: string): Promise<RevisionRequest[]>;
  findPendingByOrderId(orderId: string): Promise<RevisionRequest | null>;
}
