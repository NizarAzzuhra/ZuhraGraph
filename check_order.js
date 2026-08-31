require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const orderId = '8f9b98ac-9889-4a32-92d6-3a1a61612f3b';
  
  const order = await prisma.order.findUnique({ 
    where: { id: orderId }, 
    include: { payments: true } 
  });
  
  console.log(JSON.stringify({ Order: order }, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
