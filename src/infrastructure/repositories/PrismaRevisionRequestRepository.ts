import { prisma } from '../../lib/prisma';
import { RevisionRequest, RevisionStatus, RevisionClassification, BuyerDecision } from '../../domain/entities/RevisionRequest';
import { RevisionRequestRepository } from '../../domain/interfaces/RevisionRequestRepository';

export class PrismaRevisionRequestRepository implements RevisionRequestRepository {
  public async findById(id: string): Promise<RevisionRequest | null> {
    const data = await prisma.revisionRequest.findUnique({
      where: { id },
    });

    if (!data) {
      return null;
    }

    return new RevisionRequest(
      data.id,
      data.orderId,
      data.revisionCount,
      data.description,
      data.status as RevisionStatus,
      data.extraFee.toNumber(),
      data.classification as RevisionClassification | null,
      data.requester as 'BUYER' | 'ADMIN',
      data.reason,
      data.buyerDecision as BuyerDecision | null,
      data.artworkVersionId,
      data.createdAt,
      data.updatedAt
    );
  }

  public async save(request: RevisionRequest): Promise<void> {
    await prisma.revisionRequest.upsert({
      where: { id: request.id },
      update: {
        status: request.getStatus(),
        extraFee: request.extraFee,
        classification: request.classification,
        reason: request.reason,
        buyerDecision: request.buyerDecision,
      },
      create: {
        id: request.id,
        orderId: request.orderId,
        revisionCount: request.revisionCount,
        description: request.description,
        status: request.getStatus(),
        extraFee: request.extraFee,
        classification: request.classification,
        requester: request.requester,
        reason: request.reason,
        buyerDecision: request.buyerDecision,
        artworkVersionId: request.artworkVersionId,
        createdAt: request.createdAt,
      },
    });
  }

  public async findAllByOrderId(orderId: string): Promise<RevisionRequest[]> {
    const list = await prisma.revisionRequest.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return list.map(
      (data) =>
        new RevisionRequest(
          data.id,
          data.orderId,
          data.revisionCount,
          data.description,
          data.status as RevisionStatus,
          data.extraFee.toNumber(),
          data.classification as RevisionClassification | null,
          data.requester as 'BUYER' | 'ADMIN',
          data.reason,
          data.buyerDecision as BuyerDecision | null,
          data.artworkVersionId,
          data.createdAt,
          data.updatedAt
        )
    );
  }

  public async findPendingByOrderId(orderId: string): Promise<RevisionRequest | null> {
    const data = await prisma.revisionRequest.findFirst({
      where: {
        orderId,
        status: 'PENDING',
      },
    });

    if (!data) {
      return null;
    }

    return new RevisionRequest(
      data.id,
      data.orderId,
      data.revisionCount,
      data.description,
      data.status as RevisionStatus,
      data.extraFee.toNumber(),
      data.classification as RevisionClassification | null,
      data.requester as 'BUYER' | 'ADMIN',
      data.reason,
      data.buyerDecision as BuyerDecision | null,
      data.artworkVersionId,
      data.createdAt,
      data.updatedAt
    );
  }
}
