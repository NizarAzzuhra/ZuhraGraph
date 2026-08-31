import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { OrderService } from '../../../../application/services/OrderService';
import { PrismaOrderRepository } from '../../../../infrastructure/repositories/PrismaOrderRepository';
import { PrismaPackageRepository } from '../../../../infrastructure/repositories/PrismaPackageRepository';
import { PrismaPaymentRepository } from '../../../../infrastructure/repositories/PrismaPaymentRepository';
import { MidtransPaymentGateway } from '../../../../infrastructure/payment/MidtransPaymentGateway';

export const dynamic = 'force-dynamic';

// Mock Notification Service since real one is not yet implemented
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

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const orders = await orderService.getAllOrdersForAdmin();

    return NextResponse.json({
      success: true,
      data: orders
    }, { status: 200 });

  } catch (error: any) {
    console.error('Fetch all orders admin error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal Server Error'
    }, { status: 500 });
  }
}
