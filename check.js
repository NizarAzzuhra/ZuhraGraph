require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const order = await prisma.order.findUnique({
    where: { id: 'ebcc3a1a-a7d2-4ac9-bef2-a631fc8856e7' },
    include: { payments: true }
  });
  console.log(JSON.stringify(order, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
