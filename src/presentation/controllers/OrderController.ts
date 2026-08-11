import { NextResponse } from 'next/server';
import { OrderService } from '../../application/services/OrderService';
import { PrismaOrderRepository } from '../../infrastructure/repositories/PrismaOrderRepository';
import { MidtransPaymentGateway } from '../../infrastructure/payment/MidtransPaymentGateway';

// In a real DI setup (like InversifyJS or NestJS), these would be injected automatically.
// For Next.js App Router, we manually wire them up in the controller or a DI container file.
class MockNotificationService {
  async sendNotification(userId: string, type: string, content: string) {
    console.log(`Notification to ${userId}: [${type}] ${content}`);
  }
  async markAsRead(notificationId: string) {}
}

const orderRepository = new PrismaOrderRepository();
const paymentGateway = new MidtransPaymentGateway();
const notificationService = new MockNotificationService();

const orderService = new OrderService(orderRepository, paymentGateway, notificationService);

export class OrderController {
  static async createOrder(req: Request) {
    try {
      const body = await req.json();
      // Basic validation should be here (e.g., using Zod)
      const { buyerId, packageId, amount, brief, buyerInfo } = body;
      
      if (!buyerId || !packageId || !amount) {
        return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
      }

      if (!brief || typeof brief !== 'string' || brief.trim().length === 0) {
        return NextResponse.json({ success: false, message: 'Brief commission is required and cannot be empty' }, { status: 400 });
      }

      const result = await orderService.createOrder(buyerId, packageId, amount, brief, buyerInfo);
      
      return NextResponse.json({
        success: true,
        data: result
      }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        message: error.message || 'Internal Server Error'
      }, { status: 500 });
    }
  }
}
