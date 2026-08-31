import 'dotenv/config';
import { OrderService } from './src/application/services/OrderService';
import { PaymentService } from './src/application/services/PaymentService';
import { PrismaOrderRepository } from './src/infrastructure/repositories/PrismaOrderRepository';
import { PrismaPackageRepository } from './src/infrastructure/repositories/PrismaPackageRepository';
import { PrismaPaymentRepository } from './src/infrastructure/repositories/PrismaPaymentRepository';
import { MidtransPaymentGateway } from './src/infrastructure/payment/MidtransPaymentGateway';
import { prisma } from './src/lib/prisma';

class MockNotificationService {
  async sendNotification(userId: string, type: string, content: string) {}
  async markAsRead(notificationId: string) {}
}

const orderRepository = new PrismaOrderRepository();
const packageRepository = new PrismaPackageRepository();
const paymentRepository = new PrismaPaymentRepository();
const paymentGateway = new MidtransPaymentGateway();
const notificationService = new MockNotificationService();

const orderService = new OrderService(
  orderRepository,
  packageRepository,
  paymentRepository,
  paymentGateway,
  notificationService
);

const paymentService = new PaymentService(paymentRepository, paymentGateway, orderRepository);

async function main() {
  const orderId = 'd98a9209-aada-4721-8696-fa98870f4fd5';

  // 3. API ORDER LIST
  console.log('\n--- 3. API ORDER LIST ---');
  try {
    const orders = await orderRepository.findListByBuyerId('128f6fd4-3b61-40f5-ad41-026405ccd13e');
    const orderInList = orders.find((o: any) => o.id === orderId);
    console.log(JSON.stringify(orderInList, null, 2));
  } catch (err: any) {
    console.error('Error fetching order list:', err.message);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
