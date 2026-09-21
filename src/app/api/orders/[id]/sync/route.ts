import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PaymentService } from '../../../../../application/services/PaymentService';
import { PrismaPaymentRepository } from '../../../../../infrastructure/repositories/PrismaPaymentRepository';
import { MidtransPaymentGateway } from '../../../../../infrastructure/payment/MidtransPaymentGateway';
import { PrismaOrderRepository } from '../../../../../infrastructure/repositories/PrismaOrderRepository';

const paymentRepository = new PrismaPaymentRepository();
const paymentGateway = new MidtransPaymentGateway();
const orderRepository = new PrismaOrderRepository();

const paymentService = new PaymentService(paymentRepository, paymentGateway, orderRepository);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    
    const payment = await paymentService.getPaymentByOrderId(orderId);
    
    if (!payment) {
       return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 });
    }

    const currentStatus = await paymentService.getPaymentStatus(payment.id);

    return NextResponse.json({
      success: true,
      status: currentStatus,
      message: 'Payment status synced'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Sync payment error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal Server Error'
    }, { status: 500 });
  }
}
