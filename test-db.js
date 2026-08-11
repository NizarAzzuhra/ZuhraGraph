require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const result = await prisma.$queryRawUnsafe(`SELECT schema_name FROM information_schema.schemata`);
    console.log("Schemas:", result);

    // Also try to query a table
    const users = await prisma.$queryRawUnsafe(`SELECT * FROM "users" LIMIT 1`);
    console.log("Users:", users);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
