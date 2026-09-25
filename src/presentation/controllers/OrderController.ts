import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { OrderService } from '../../application/services/OrderService';
import { PrismaOrderRepository } from '../../infrastructure/repositories/PrismaOrderRepository';
import { PrismaPackageRepository } from '../../infrastructure/repositories/PrismaPackageRepository';
import { PrismaPaymentRepository } from '../../infrastructure/repositories/PrismaPaymentRepository';
import { MidtransPaymentGateway } from '../../infrastructure/payment/MidtransPaymentGateway';

// In a real DI setup (like InversifyJS or NestJS), these would be injected automatically.
// For Next.js App Router, we manually wire them up in the controller or a DI container file.
import { PrismaNotificationService } from '../../infrastructure/services/PrismaNotificationService';

const orderRepository = new PrismaOrderRepository();
const packageRepository = new PrismaPackageRepository();
const paymentRepository = new PrismaPaymentRepository();
const paymentGateway = new MidtransPaymentGateway();
const notificationService = new PrismaNotificationService();

const orderService = new OrderService(orderRepository, packageRepository, paymentRepository, paymentGateway, notificationService);

export const createOrderSchema = z.object({
  packageId: z.string().uuid("Invalid package ID"),
  brief: z.string().refine((val) => {
    try {
      const parsed = JSON.parse(val);
      if (!parsed.description || parsed.description.trim() === '') return false;
      if (parsed.description.length > 1000) return false;
      // Referensi aset/desain (characterReferences, designReferences, additionalReferences) bersifat opsional
      if (parsed.characterReferences !== undefined && !Array.isArray(parsed.characterReferences)) return false;
      if (parsed.designReferences !== undefined && !Array.isArray(parsed.designReferences)) return false;
      if (parsed.additionalReferences !== undefined && !Array.isArray(parsed.additionalReferences)) return false;
      return true;
    } catch {
      return false;
    }
  }, "Format brief tidak valid. Pastikan deskripsi proyek terisi dan tidak melebihi 1000 karakter."),
  termsAccepted: z.boolean().refine(val => val === true, "Persetujuan Ketentuan Layanan wajib diberikan."),
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
      if (
        error.message === 'Package is not active' ||
        error.message?.includes('Komisi untuk paket ini sedang ditutup') ||
        error.message?.includes('Antrean komisi untuk paket ini sedang penuh') ||
        error.message?.includes('Duplicate order') ||
        error.message === 'Brief cannot be empty'
      ) {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
      }
      return NextResponse.json({
        success: false,
        message: error.message || 'Internal Server Error'
      }, { status: 500 });
    }
  }

  static async getOrders(req: Request) {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session || !session.user || !(session.user as any).id) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      }

      const role = (session.user as any).role;
      const userId = (session.user as any).id;

      let orders;
      if (role === 'ADMIN') {
        orders = await orderService.getAllOrders();
      } else {
        orders = await orderService.getBuyerOrders(userId);
      }

      return NextResponse.json({
        success: true,
        data: orders
      }, { status: 200 });
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        message: error.message || 'Internal Server Error'
      }, { status: 500 });
    }
  }
}
