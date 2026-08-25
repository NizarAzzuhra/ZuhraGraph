import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { PaymentService } from '../../../../../application/services/PaymentService';
import { PrismaPaymentRepository } from '../../../../../infrastructure/repositories/PrismaPaymentRepository';
import { MidtransPaymentGateway } from '../../../../../infrastructure/payment/MidtransPaymentGateway';
import { PrismaOrderRepository } from '../../../../../infrastructure/repositories/PrismaOrderRepository';

const orderRepository = new PrismaOrderRepository();
const paymentRepository = new PrismaPaymentRepository();
const paymentGateway = new MidtransPaymentGateway();
const paymentService = new PaymentService(paymentRepository, paymentGateway);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const buyerId = (session.user as any).id;
    const { id: orderId } = await params;

    // Verify order belongs to user
    const order = await orderRepository.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }
    
    if (order.buyerId !== buyerId) {
      return NextResponse.json({ success: false, message: 'Unauthorized access to order' }, { status: 403 });
    }

    // Call service to retry payment
    const buyerInfo = {
      first_name: session?.user?.name || "Buyer",
      email: session?.user?.email || "buyer@example.com",
    };

    const paymentInfo = await paymentService.retryPayment(orderId, buyerInfo);
    
    return NextResponse.json({
      success: true,
      data: paymentInfo,
      paymentError: !paymentInfo
    }, { status: 200 });

  } catch (error: any) {
    if (error.message === 'Payment not found') {
      return NextResponse.json({ success: false, message: error.message }, { status: 404 });
    }
    if (error.message === 'Payment is no longer pending and cannot be retried.') {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    console.error('Retry payment error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal Server Error'
    }, { status: 500 });
  }
}
