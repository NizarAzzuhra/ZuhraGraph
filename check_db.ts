import { prisma } from './src/lib/prisma';

async function main() {
  const id1 = '9006461e-39f3-46e9-b230-075a0369ea45';
  const id2 = 'cfa16e04-6c07-4cb5-973f-8078c1ab97c7';
  
  const o1 = await prisma.order.findUnique({ where: { id: id1 }, include: { payments: true } });
  const o2 = await prisma.order.findUnique({ where: { id: id2 }, include: { payments: true } });
  const p1 = await prisma.payment.findUnique({ where: { id: id1 } });
  const p2 = await prisma.payment.findUnique({ where: { id: id2 } });
  
  console.log("=== DB RESULT ===");
  console.log(JSON.stringify({ Order_9006: o1, Order_cfa1: o2, Payment_9006: p1, Payment_cfa1: p2 }, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
