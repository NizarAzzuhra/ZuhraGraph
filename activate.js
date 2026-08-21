require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  await prisma.package.update({
    where: { id: '96bcda9e-9685-4e7b-bf56-946fcab89f62' },
    data: {
      status: 'ACTIVE',
      deletedAt: null
    }
  });
  console.log("Re-activated the first package");
}

run().catch(console.error).finally(() => process.exit(0));
