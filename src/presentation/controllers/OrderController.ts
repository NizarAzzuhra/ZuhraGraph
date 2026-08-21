import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { OrderService } from '../../application/services/OrderService';
import { PrismaOrderRepository } from '../../infrastructure/repositories/PrismaOrderRepository';
import { PrismaPackageRepository } from '../../infrastructure/repositories/PrismaPackageRepository';
import { PrismaPaymentRepository } from '../../infrastructure/repositories/PrismaPaymentRepository';
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
const packageRepository = new PrismaPackageRepository();
const paymentRepository = new PrismaPaymentRepository();
const paymentGateway = new MidtransPaymentGateway();
const notificationService = new MockNotificationService();

const orderService = new OrderService(orderRepository, packageRepository, paymentRepository, paymentGateway, notificationService);

const createOrderSchema = z.object({
  packageId: z.string().uuid("Invalid package ID"),
  brief: z.string().min(1, "Brief commission is required and cannot be empty"),
  buyerInfo: z.any().optional()
});

export class OrderController {
  static async createOrder(req: Request) {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session || !session.user || !(session.user as any).id) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      }
      
      const buyerId = (session.user as any).id;

      const body = await req.json();
      
      const validationResult = createOrderSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json({ 
          success: false, 
          message: 'Invalid request data', 
          errors: validationResult.error.issues 
        }, { status: 400 });
      }

      const { packageId, brief, buyerInfo } = validationResult.data;

      const result = await orderService.createOrder(buyerId, packageId, brief, buyerInfo);
      
      return NextResponse.json({
        success: true,
        data: result
      }, { status: 201 });
    } catch (error: any) {
      if (error.message === 'Package not found') {
        return NextResponse.json({ success: false, message: error.message }, { status: 404 });
      }
      if (error.message === 'Package is not active') {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
      }
      return NextResponse.json({
        success: false,
        message: error.message || 'Internal Server Error'
      }, { status: 500 });
    }
  }
}
