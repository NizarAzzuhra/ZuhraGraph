import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { Order } from '../../domain/entities/Order';
import { OrderRepository } from '../../domain/interfaces/OrderRepository';
import { OrderStatus } from '../../domain/entities/Order';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured.');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

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
}