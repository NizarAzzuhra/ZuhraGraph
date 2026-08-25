import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- STARTING ZUHRAGRAPH E2E TEST ---');

  // 1. Setup Test Data
  console.log('\n[1] Setting up Test Data...');
  
  let package1 = await prisma.package.findFirst({ where: { name: 'Test Package E2E' }});
  if (!package1) {
    package1 = await prisma.package.create({
      data: {
        name: 'Test Package E2E',
        description: 'Package for E2E testing',
        price: 150000,
        status: 'ACTIVE',
        slot: 10
      }
    });
  }
  
  const passwordHash = await bcrypt.hash('password123', 10);
  
  let buyer = await prisma.user.findUnique({ where: { email: 'buyer@test.com' }});
  if (!buyer) {
    buyer = await prisma.user.create({
      data: {
        name: 'Test Buyer',
        email: 'buyer@test.com',
        passwordHash,
        role: 'BUYER'
      }
    });
  }

  let admin = await prisma.user.findUnique({ where: { email: 'admin@test.com' }});
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: 'Test Admin',
        email: 'admin@test.com',
        passwordHash,
        role: 'ADMIN'
      }
    });
  }

  console.log(`Test Packages: ${package1.id}`);
  console.log(`Test Buyer: ${buyer.id}`);
  
  // 3. Testing Order Creation (Service Level)
  console.log('\n[2] Testing Order Creation Validation...');
  const { OrderService } = await import('./src/application/services/OrderService.js');
  const { PrismaOrderRepository } = await import('./src/infrastructure/repositories/PrismaOrderRepository.js');
  const { PrismaPackageRepository } = await import('./src/infrastructure/repositories/PrismaPackageRepository.js');
  const { PrismaPaymentRepository } = await import('./src/infrastructure/repositories/PrismaPaymentRepository.js');
  const { MidtransPaymentGateway } = await import('./src/infrastructure/payment/MidtransPaymentGateway.js');
  
  const orderRepo = new PrismaOrderRepository();
  const pkgRepo = new PrismaPackageRepository();
  const payRepo = new PrismaPaymentRepository();
  const mockNotification = { sendNotification: async () => {}, markAsRead: async () => {} };
  
  const orderService = new OrderService(orderRepo, pkgRepo, payRepo, new MidtransPaymentGateway(), mockNotification);

  try {
    await orderService.createOrder(buyer.id, package1.id, '', {});
    console.error('FAIL: Expected error for empty brief, but order was created.');
  } catch (e: any) {
    console.log('PASS: Empty brief rejected - ' + e.message);
  }

  try {
    await orderService.createOrder(buyer.id, 'invalid-id', 'Test brief', {});
    console.error('FAIL: Expected error for invalid package.');
  } catch (e: any) {
    console.log('PASS: Invalid package rejected - ' + e.message);
  }

  console.log('\n[3] Testing Valid Order Creation...');
  let createdOrder;
  try {
    createdOrder = await orderService.createOrder(buyer.id, package1.id, 'This is a valid test brief for the commission.', {});
    console.log('PASS: Valid order created successfully. ID: ' + createdOrder.order.id);
    
    const dbOrder = await prisma.order.findUnique({ where: { id: createdOrder.order.id }, include: { payments: true }});
    if (dbOrder && dbOrder.status === 'AWAITING_PAYMENT' && Number(dbOrder.totalAmount) === 150000) {
      console.log('PASS: Order database state is correct.');
    } else {
      console.error('FAIL: Order database state is incorrect.', dbOrder);
    }
  } catch (e: any) {
    console.error('FAIL: Valid order creation threw error - ' + e.message);
  }

  console.log('\n[4] Testing Double Submission...');
  try {
     const p1 = orderService.createOrder(buyer.id, package1.id, 'Double submit test 1', {});
     const p2 = orderService.createOrder(buyer.id, package1.id, 'Double submit test 2', {});
     await Promise.all([p1, p2]);
     console.log('WARN: Double submission allowed. May need idempotency handling.');
  } catch(e) {
     console.log('PASS: Double submission handled or threw error (or concurrent modification handled).');
  }

  console.log('\n[5] Testing Brief Edit...');
  const { BriefEditService } = await import('./src/application/services/BriefEditService.js');
  const { PrismaBriefEditRequestRepository } = await import('./src/infrastructure/repositories/PrismaBriefEditRequestRepository.js');
  const briefEditService = new BriefEditService(orderRepo, new PrismaBriefEditRequestRepository(), mockNotification);

  if (createdOrder) {
    try {
      const { request: editReq, directUpdate } = await briefEditService.requestBriefEdit(buyer.id, createdOrder.order.id, 'New proposed brief content');
      console.log('PASS: Brief edit request created successfully. Direct update: ' + directUpdate);
      
      if (editReq) {
        await briefEditService.decideBriefEdit(editReq.id, true, 'Approved by admin');
        console.log('PASS: Brief edit request approved.');
      }
      
      const updatedOrder = await prisma.order.findUnique({ where: { id: createdOrder.order.id } });
      if (updatedOrder?.brief === 'New proposed brief content') {
         console.log('PASS: Order brief updated correctly after approval.');
      } else {
         console.error('FAIL: Order brief not updated after approval.');
      }
    } catch(e: any) {
      console.error('FAIL: Brief edit flow error - ' + e.message);
    }
  }

  console.log('\n--- E2E TEST COMPLETED ---');
}

main()
  .catch(e => {
    console.error('Test script crashed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
