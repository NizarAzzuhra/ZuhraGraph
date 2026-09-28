import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PaymentService } from '@/application/services/PaymentService';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { MidtransPaymentGateway } from '@/infrastructure/payment/MidtransPaymentGateway';
import { PrismaOrderRepository } from '@/infrastructure/repositories/PrismaOrderRepository';

const paymentRepository = new PrismaPaymentRepository();
const paymentGateway = new MidtransPaymentGateway();
const orderRepository = new PrismaOrderRepository();
const paymentService = new PaymentService(paymentRepository, paymentGateway, orderRepository);

async function handleSync(params: Promise<{ id: string }>) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const { id: orderId } = await params;

    const order = await orderRepository.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    if (order.buyerId !== userId && userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Anda tidak memiliki akses ke pesanan ini.' },
        { status: 403 }
      );
    }
    
    const result = await paymentService.syncPaymentStatusByOrderId(orderId);

    // Revalidate paths for admin and client pages
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/orders');
    revalidatePath('/admin');
    revalidatePath(`/orders/${orderId}`);

    return NextResponse.json({
      success: result.success,
      status: result.paymentStatus,
      orderStatus: result.orderStatus,
      transactionStatus: result.transactionStatus,
      message: result.message
    }, { status: 200 });

  } catch (error: any) {
    console.error('Sync payment error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleSync(params);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleSync(params);
}
