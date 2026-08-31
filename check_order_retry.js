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
  
  if (order) {
    console.log("Order Status: " + order.status);
    console.log("Order UpdatedAt: " + order.updatedAt);
    
    order.payments.forEach((payment, index) => {
      console.log("Payment [" + index + "] ID: " + payment.id);
      console.log("Payment Status: " + payment.status);
      console.log("Transaction ID: " + payment.transactionId);
      console.log("Payment UpdatedAt: " + payment.updatedAt);
    });
  } else {
    console.log("Order not found.");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
