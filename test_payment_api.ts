require('dotenv').config();
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

import { PaymentService } from './src/application/services/PaymentService';
import { MidtransPaymentGateway } from './src/infrastructure/payment/MidtransPaymentGateway';
import { Payment, PaymentStatus } from './src/domain/entities/Payment';
import { PaymentRepository } from './src/domain/interfaces/PaymentRepository';
import { PrismaOrderRepository } from './src/infrastructure/repositories/PrismaOrderRepository';

class CustomPaymentRepository implements PaymentRepository {
  public async findById(id: string): Promise<Payment | null> {
    const data = await prisma.payment.findUnique({
      where: { id },
    });
    if (!data) return null;
    return new Payment(data.id, data.orderId, Number(data.amount), data.status as PaymentStatus, data.transactionId, data.token, data.updatedAt);
  }

  public async findByOrderId(orderId: string): Promise<Payment | null> {
    const data = await prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    if (!data) return null;
    return new Payment(data.id, data.orderId, Number(data.amount), data.status as PaymentStatus, data.transactionId, data.token, data.updatedAt);
  }

  public async findAllByOrderId(orderId: string): Promise<Payment[]> {
    const data = await prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: any) => new Payment(d.id, d.orderId, Number(d.amount), d.status as PaymentStatus, d.transactionId, d.token, d.updatedAt));
  }

  public async save(payment: Payment): Promise<void> {
    await prisma.payment.upsert({
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
  }
}

async function main() {
  const paymentRepository = new CustomPaymentRepository();
  const paymentGateway = new MidtransPaymentGateway();
  const orderRepository = new PrismaOrderRepository();
const paymentService = new PaymentService(paymentRepository, paymentGateway, orderRepository);

  const orderId = 'ebcc3a1a-a7d2-4ac9-bef2-a631fc8856e7';
  const buyerInfo = {
    first_name: "Zuhra",
    email: "zuhragraph@gmail.com",
  };

  try {
    console.log(`Testing Payment Initiation for Order: ${orderId}`);
    const result = await paymentService.retryPayment(orderId, buyerInfo);
    
    console.log("--- RESULT ---");
    console.log(JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.error("--- ERROR ---");
    console.error(err.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
