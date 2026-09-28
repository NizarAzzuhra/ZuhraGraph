import { NextResponse } from 'next/server';
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

async function syncHandler(orderId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  if (!orderId) {
    return NextResponse.json({ success: false, message: 'Parameter orderId wajib diisi.' }, { status: 400 });
  }

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

  return NextResponse.json({
    success: result.success,
    status: result.paymentStatus,
    orderStatus: result.orderStatus,
    transactionStatus: result.transactionStatus,
    message: result.message
  }, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = body?.orderId || body?.id;
    return await syncHandler(orderId);
  } catch (error: any) {
    console.error('Payments sync error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId') || searchParams.get('id') || '';
    return await syncHandler(orderId);
  } catch (error: any) {
    console.error('Payments sync error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
