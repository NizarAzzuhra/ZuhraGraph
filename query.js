const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findUnique({
    where: { id: 'd98a9209-aada-4721-8696-fa98870f4fd5' },
    include: { payment: true, payments: true }
  });
  console.log(JSON.stringify(order, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
