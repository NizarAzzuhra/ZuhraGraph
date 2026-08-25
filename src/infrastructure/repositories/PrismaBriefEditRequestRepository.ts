import { prisma } from '../../lib/prisma';
import { BriefEditRequest, BriefEditStatus } from '../../domain/entities/BriefEditRequest';
import { BriefEditRequestRepository } from '../../domain/interfaces/BriefEditRequestRepository';

export class PrismaBriefEditRequestRepository implements BriefEditRequestRepository {
  public async findById(id: string): Promise<BriefEditRequest | null> {
    const data = await prisma.briefEditRequest.findUnique({
      where: { id },
    });

    if (!data) {
      return null;
    }

    return new BriefEditRequest(
      data.id,
      data.orderId,
      data.proposedBrief,
      data.status as BriefEditStatus,
      data.reason,
      data.createdAt,
      data.updatedAt
    );
  }

  public async save(request: BriefEditRequest): Promise<void> {
    await prisma.briefEditRequest.upsert({
      where: { id: request.id },
      update: {
        status: request.getStatus(),
        reason: request.reason,
      },
      create: {
        id: request.id,
        orderId: request.orderId,
        proposedBrief: request.proposedBrief,
        status: request.getStatus(),
        reason: request.reason,
        createdAt: request.createdAt,
      },
    });
  }

  public async findAllByOrderId(orderId: string): Promise<BriefEditRequest[]> {
    const list = await prisma.briefEditRequest.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return list.map(
      (data) =>
        new BriefEditRequest(
          data.id,
          data.orderId,
          data.proposedBrief,
          data.status as BriefEditStatus,
          data.reason,
          data.createdAt,
          data.updatedAt
        )
    );
  }

  public async findPendingByOrderId(orderId: string): Promise<BriefEditRequest | null> {
    const data = await prisma.briefEditRequest.findFirst({
      where: {
        orderId,
        status: 'PENDING',
      },
    });

    if (!data) {
      return null;
    }

    return new BriefEditRequest(
      data.id,
      data.orderId,
      data.proposedBrief,
      data.status as BriefEditStatus,
      data.reason,
      data.createdAt,
      data.updatedAt
    );
  }
}
