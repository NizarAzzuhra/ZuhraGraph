import { prisma } from '../../lib/prisma';
import { Payment, PaymentStatus } from '../../domain/entities/Payment';
import { PaymentRepository } from '../../domain/interfaces/PaymentRepository';
import { Order } from '../../domain/entities/Order';
export class PrismaPaymentRepository implements PaymentRepository {
  public async findById(id: string): Promise<Payment | null> {
    const data = await prisma.payment.findUnique({
      where: { id },
    });

    if (!data) {
      return null;
    }

    return new Payment(
      data.id,
      data.orderId,
      data.amount.toNumber(),
      data.status as PaymentStatus,
      data.transactionId,
      data.token,
      data.updatedAt
    );
  }

  public async findByOrderId(orderId: string): Promise<Payment | null> {
    const data = await prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    if (!data) {
      return null;
    }

    return new Payment(
      data.id,
      data.orderId,
      data.amount.toNumber(),
      data.status as PaymentStatus,
      data.transactionId,
      data.token,
      data.updatedAt
    );
  }

  public async findAllByOrderId(orderId: string): Promise<Payment[]> {
    const data = await prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return data.map(d => new Payment(
      d.id,
      d.orderId,
      d.amount.toNumber(),
      d.status as PaymentStatus,
      d.transactionId,
      d.token,
      d.updatedAt
    ));
  }

  public async save(payment: Payment): Promise<void> {
    await prisma.payment.upsert({
      where: {
        id: payment.id,
      },
      update: {
        status: payment.getStatus(),
        transactionId: payment.getTransactionId(),
        token: payment.getToken(),
      },
      create: {
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        status: payment.getStatus(),
        transactionId: payment.getTransactionId(),
        token: payment.getToken(),
      },
    });
  }

  public async saveWithOrder(payment: Payment, order: Order): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.payment.upsert({
        where: { id: payment.id },
        update: {
          status: payment.getStatus(),
          transactionId: payment.getTransactionId(),
          token: payment.getToken(),
        },
        create: {
          id: payment.id,
          orderId: payment.orderId,
          amount: payment.amount,
          status: payment.getStatus(),
          transactionId: payment.getTransactionId(),
          token: payment.getToken(),
        },
      });

      await tx.order.upsert({
        where: { id: order.id },
        update: {
          status: order.getStatus(),
          totalAmount: order.totalAmount,
          brief: order.brief,
        },
        create: {
          id: order.id,
          buyerId: order.buyerId,
          packageId: order.packageId,
          totalAmount: order.totalAmount,
          brief: order.brief,
          status: order.getStatus(),
          createdAt: order.createdAt,
        },
      });

      if (order.getStatus() === 'PAID') {
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: 'PAID',
          },
        });
      }
    });
  }
}
