import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { OrderService } from '../../../../application/services/OrderService';
import { PaymentService } from '../../../../application/services/PaymentService';
import { PrismaOrderRepository } from '../../../../infrastructure/repositories/PrismaOrderRepository';
import { PrismaPackageRepository } from '../../../../infrastructure/repositories/PrismaPackageRepository';
import { PrismaPaymentRepository } from '../../../../infrastructure/repositories/PrismaPaymentRepository';
import { MidtransPaymentGateway } from '../../../../infrastructure/payment/MidtransPaymentGateway';
import { RevisionService } from '../../../../application/services/RevisionService';
import { PrismaRevisionRequestRepository } from '../../../../infrastructure/repositories/PrismaRevisionRequestRepository';

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

const paymentService = new PaymentService(paymentRepository, paymentGateway);

const revisionRequestRepository = new PrismaRevisionRequestRepository();
const revisionService = new RevisionService(
  orderRepository,
  revisionRequestRepository,
  paymentRepository,
  paymentGateway,
  notificationService
);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const buyerId = (session.user as any).id;
    const { id: orderId } = await params;

    const orderDetails = await orderService.getOrderDetails(orderId, buyerId);
    const payment = await paymentService.getPaymentByOrderId(orderId);

    // Retrieve brief edits, revisions, and artwork versions directly via Prisma for response enrichment
    const { prisma } = await import('../../../../lib/prisma');
    const briefEditRequests = await prisma.briefEditRequest.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' }
    });
    const revisionRequests = await prisma.revisionRequest.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' }
    });
    const artworkVersions = await prisma.artworkVersion.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...orderDetails,
        briefEditRequests,
        revisionRequests,
        artworkVersions
      },
      payment: payment
    }, { status: 200 });

  } catch (error: any) {
    if (error.message === 'Order not found' || error.message === 'Package associated with order not found') {
      return NextResponse.json({ success: false, message: error.message }, { status: 404 });
    }
    if (error.message === 'Unauthorized access to order') {
      return NextResponse.json({ success: false, message: error.message }, { status: 403 });
    }
    console.error('Fetch order error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal Server Error'
    }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 });
    }

    const { id: orderId } = await params;
    const { action } = await req.json();

    if (action === 'confirm') {
      await orderService.confirmOrder(orderId);
    } else if (action === 'startProcessing') {
      await orderService.startProcessing(orderId);
    } else if (action === 'startRevision') {
      await revisionService.startRevision(orderId);
    } else {
      return NextResponse.json({ success: false, message: 'Aksi tidak dikenal.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Aksi ${action} berhasil dijalankan.`
    }, { status: 200 });

  } catch (error: any) {
    console.error('PATCH order action error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal Server Error'
    }, { status: 400 });
  }
}
