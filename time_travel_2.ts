import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const paymentId = '992e8009-9022-4b89-a3bb-8da279b1ea8c';
  const orderId = 'ebcc3a1a-a7d2-4ac9-bef2-a631fc8856e7';

  // 1. Get current state
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId }
  });

  if (!payment) throw new Error('Payment not found');

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true }
  });

  if (!order) throw new Error('Order not found');

  const originalUpdatedAt = payment.updatedAt;
  const paymentCount = order.payments.length;

  console.log('--- PRE-CHECK ---');
  console.log(`Payment ID: ${payment.id}`);
  console.log(`Order ID: ${payment.orderId}`);
  console.log(`Payment Status: ${payment.status}`);
  console.log(`Payment Amount: ${payment.amount}`);
  console.log(`Payment Token: ${payment.token}`);
  console.log(`Payment createdAt: ${payment.createdAt.toISOString()}`);
  console.log(`Payment updatedAt: ${payment.updatedAt.toISOString()}`);
  console.log(`Order ID: ${order.id}`);
  console.log(`Order Status: ${order.status}`);
  console.log(`Payment Count for Order: ${paymentCount}`);

  if (payment.status !== 'PENDING') {
    throw new Error('Payment is not PENDING. Aborting.');
  }

  // 2. Controlled Time-Travel
  const newUpdatedAt = new Date(originalUpdatedAt.getTime() - 24 * 60 * 60 * 1000);

  await prisma.payment.update({
    where: { id: paymentId },
    data: { updatedAt: newUpdatedAt }
  });

  const updatedPayment = await prisma.payment.findUnique({
    where: { id: paymentId }
  });

  console.log('\n--- CONTROLLED TIME-TRAVEL #2 ---');
  console.log(`Payment ID: ${payment.id}`);
  console.log(`Original updatedAt: ${originalUpdatedAt.toISOString()}`);
  console.log(`Test updatedAt: ${updatedPayment?.updatedAt.toISOString()}`);
  console.log(`Payment status: ${updatedPayment?.status}`);
  console.log(`Order status: ${order.status}`);
  console.log(`Payment count: ${paymentCount}`);
  console.log(`Ready for manual retry: YES`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
