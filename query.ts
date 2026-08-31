import 'dotenv/config';
import { prisma } from './src/lib/prisma';

async function main() {
  const orderId = 'ebcc3a1a-a7d2-4ac9-bef2-a631fc8856e7';
  const order = await prisma.order.findUnique({
    where: { id: orderId }
  });
  console.log('--- ORDER ---');
  console.log(`ID: ${order?.id}`);
  console.log(`Status: ${order?.status}`);

  const payments = await prisma.payment.findMany({
    where: { orderId: orderId },
    orderBy: { createdAt: 'desc' }
  });

  console.log('\n--- PAYMENTS ---');
  for (const p of payments) {
    console.log(`id: ${p.id}`);
    console.log(`orderId: ${p.orderId}`);
    console.log(`status: ${p.status}`);
    console.log(`token: ${p.token ? p.token.substring(0, 8) + '...' : 'null'}`);
    console.log(`transactionId: ${p.transactionId}`);
    console.log(`createdAt: ${p.createdAt}`);
    console.log(`updatedAt: ${p.updatedAt}`);
    console.log('---');
  }
}

main().catch(console.error);
