import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { OrderService } from '../../../../../application/services/OrderService';
import { PrismaOrderRepository } from '../../../../../infrastructure/repositories/PrismaOrderRepository';
import { PrismaPackageRepository } from '../../../../../infrastructure/repositories/PrismaPackageRepository';
import { PrismaPaymentRepository } from '../../../../../infrastructure/repositories/PrismaPaymentRepository';
import { MidtransPaymentGateway } from '../../../../../infrastructure/payment/MidtransPaymentGateway';
import { PrismaNotificationService } from '../../../../../infrastructure/services/PrismaNotificationService';

const orderRepository = new PrismaOrderRepository();
const packageRepository = new PrismaPackageRepository();
const paymentRepository = new PrismaPaymentRepository();
const paymentGateway = new MidtransPaymentGateway();
const notificationService = new PrismaNotificationService();

const orderService = new OrderService(
  orderRepository,
  packageRepository,
  paymentRepository,
  paymentGateway,
  notificationService
);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id: orderId } = await params;
    
    // We can directly call completeOrder, since it will update the status to COMPLETED.
    // The buyer is completing the order after they receive the artwork.
    const order = await orderRepository.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    // Verify buyer ownership
    if (order.buyerId !== (session.user as any).id) {
      return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 });
    }

    await orderService.completeOrder(orderId);

    // Revalidate paths for admin and client pages
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/orders');
    revalidatePath('/admin');
    revalidatePath(`/orders/${orderId}`);

    return NextResponse.json({
      success: true,
      message: 'Pesanan berhasil diselesaikan. Terima kasih!'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Complete order error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal Server Error'
    }, { status: 400 });
  }
}
