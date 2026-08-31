import { prisma } from '../../lib/prisma';
import { Order } from '../../domain/entities/Order';
import { OrderRepository } from '../../domain/interfaces/OrderRepository';
import { OrderStatus } from '../../domain/entities/Order';
import { OrderSummaryDTO } from '../../domain/interfaces/OrderSummaryDTO';
import { PaymentStatus } from '../../domain/entities/Payment';

export class PrismaOrderRepository implements OrderRepository {
  public async findById(id: string): Promise<Order | null> {
    const data = await prisma.order.findUnique({
      where: { id },
    });

    if (!data) {
      return null;
    }

    return new Order(
      data.id,
      data.buyerId,
      data.packageId,
      data.totalAmount.toNumber(),
      data.brief,
      data.status as OrderStatus,
      data.createdAt
    );
  }

  public async save(order: Order): Promise<void> {
    await prisma.order.upsert({
      where: {
        id: order.id,
      },

      update: {
        status: order.getStatus(),
        totalAmount: order.totalAmount,
        brief: order.brief,
      },

      create: {
        id: order.id,
        buyerId: order.buyerId,
        packageId: order.packageId,
        status: order.getStatus(),
        totalAmount: order.totalAmount,
        brief: order.brief,
        createdAt: order.createdAt,
      },
    });
  }

  public async findAllByBuyerId(buyerId: string): Promise<Order[]> {
    const data = await prisma.order.findMany({
      where: {
        buyerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return data.map(
      (d) =>
        new Order(
          d.id,
          d.buyerId,
          d.packageId,
          d.totalAmount.toNumber(),
          d.brief,
          d.status as OrderStatus,
          d.createdAt
        )
    );
  }

  private mapToSummaryDTO(data: any): OrderSummaryDTO {
    return {
      id: data.id,
      packageId: data.packageId,
      packageName: data.package.name,
      buyerName: data.buyer.name,
      buyerEmail: data.buyer.email,
      totalAmount: data.totalAmount.toNumber(),
      status: data.status as OrderStatus,
      paymentStatus: data.payments && data.payments.length > 0 
        ? data.payments[0].status as PaymentStatus 
        : null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  public async findListByBuyerId(buyerId: string): Promise<OrderSummaryDTO[]> {
    const data = await prisma.order.findMany({
      where: { buyerId },
      include: {
        package: { select: { name: true } },
        buyer: { select: { name: true, email: true } },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return data.map(this.mapToSummaryDTO);
  }

  public async findAllList(): Promise<OrderSummaryDTO[]> {
    const data = await prisma.order.findMany({
      include: {
        package: { select: { name: true } },
        buyer: { select: { name: true, email: true } },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true }
        },
        revisionRequests: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return data.map((d: any) => ({
      ...this.mapToSummaryDTO(d),
      revisionRequests: d.revisionRequests
    }));
  }

  public async findAllForAdmin(): Promise<any[]> {
    const data = await prisma.order.findMany({
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        package: { select: { name: true, price: true } },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return data;
  }

  public async addArtwork(orderId: string, url: string, revisionNumber: number): Promise<void> {
    await prisma.$transaction([
      prisma.artworkVersion.create({
        data: {
          orderId,
          url,
          revisionNumber
        }
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'ARTWORK_UPLOADED' }
      })
    ]);
  }

  public async getArtworkCount(orderId: string): Promise<number> {
    return prisma.artworkVersion.count({
      where: { orderId }
    });
  }
}