const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const pkg = await prisma.package.findFirst({
    where: {
      name: {
        contains: 'test e2e',
        mode: 'insensitive',
      },
    },
  });

  if (!pkg) {
    console.log('No package found matching "test e2e"');
    return;
  }

  const ordersCount = await prisma.order.count({
    where: { packageId: pkg.id },
  });

  if (ordersCount > 0) {
    console.log(`Cannot delete package "${pkg.name}" (${pkg.id}) because it has ${ordersCount} orders.`);
    return;
  }

  await prisma.package.delete({
    where: { id: pkg.id },
  });

  console.log(`Successfully deleted package: "${pkg.name}" (${pkg.id})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
