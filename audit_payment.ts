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
  const orderId = 'ebcc3a1a-a7d2-4ac9-bef2-a631fc8856e7';

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true }
  });

  if (!order) throw new Error('Order not found');

  console.log('--- AUDIT RESULT ---');
  console.log(`Order Status: ${order.status}`);
  console.log(`Total Payments: ${order.payments.length}`);
  
  order.payments.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  
  order.payments.forEach((p, idx) => {
    console.log(`\nPayment [${idx + 1}]`);
    console.log(`- id: ${p.id}`);
    console.log(`- status: ${p.status}`);
    console.log(`- amount: ${p.amount}`);
    console.log(`- token: ${p.token}`);
    console.log(`- createdAt: ${p.createdAt.toISOString()}`);
    console.log(`- updatedAt: ${p.updatedAt.toISOString()}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
