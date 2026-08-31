require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const orderId = '917ff8b6-99f9-4758-b809-33bec783927f';
  const paymentId = 'f589fdd1-3574-4b78-b0ef-99e9b815e03d';
  
  const order = await prisma.order.findUnique({ 
    where: { id: orderId }
  });
  
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId }
  });
  
  if (order) {
    console.log("Order Status: " + order.status);
    console.log("Order CreatedAt: " + order.createdAt);
    console.log("Order UpdatedAt: " + order.updatedAt);
  } else {
    console.log("Order not found.");
  }
  
  if (payment) {
    console.log("Payment ID: " + payment.id);
    console.log("Payment Status: " + payment.status);
    console.log("Transaction ID: " + payment.transactionId);
    console.log("Payment CreatedAt: " + payment.createdAt);
    console.log("Payment UpdatedAt: " + payment.updatedAt);
  } else {
    console.log("Payment not found.");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
