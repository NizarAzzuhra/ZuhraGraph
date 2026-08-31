const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const id = '8b664be3-b809-47d5-bc1d-3f9e2e794d43';

  // Check if it has orders
  const ordersCount = await prisma.order.count({
    where: { packageId: id },
  });

  if (ordersCount > 0) {
    console.log(`Cannot delete package because it has ${ordersCount} orders.`);
    return;
  }

  // Delete it
  await prisma.package.delete({
    where: { id },
  });

  console.log(`Successfully deleted Test Package E2E (${id})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
