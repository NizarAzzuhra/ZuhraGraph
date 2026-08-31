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
  const paymentId = '676b90a3-00d6-4e43-ae5d-3f189331e85f';
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

  console.log('--- BEFORE UPDATE ---');
  console.log(`Payment ID: ${payment.id}`);
  console.log(`Order ID: ${payment.orderId}`);
  console.log(`Payment Status: ${payment.status}`);
  console.log(`Payment Amount: ${payment.amount}`);
  console.log(`Payment Token: ${payment.token}`);
  console.log(`Payment updatedAt: ${payment.updatedAt.toISOString()}`);
  console.log(`Payment Count for Order: ${order.payments.length}`);
  console.log(`Order Status: ${order.status}`);

  // 3. Subtract 24 hours from updatedAt
  const newUpdatedAt = new Date(originalUpdatedAt.getTime() - 24 * 60 * 60 * 1000);

  // Perform update
  await prisma.payment.update({
    where: { id: paymentId },
    data: { updatedAt: newUpdatedAt }
  });

  // Verify
  const updatedPayment = await prisma.payment.findUnique({
    where: { id: paymentId }
  });

  console.log('\n--- AFTER UPDATE ---');
  console.log(`Original updatedAt: ${originalUpdatedAt.toISOString()}`);
  console.log(`Test updatedAt: ${updatedPayment?.updatedAt.toISOString()}`);
  console.log(`Payment status: ${updatedPayment?.status}`);
  console.log(`Payment count: ${order.payments.length}`);
  console.log(`Order status: ${order.status}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
