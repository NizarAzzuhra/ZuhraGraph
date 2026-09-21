import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PaymentService } from '@/application/services/PaymentService';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { MidtransPaymentGateway } from '@/infrastructure/payment/MidtransPaymentGateway';
import { PrismaOrderRepository } from '@/infrastructure/repositories/PrismaOrderRepository';
import { PrismaRevisionRequestRepository } from '@/infrastructure/repositories/PrismaRevisionRequestRepository';

const paymentRepository = new PrismaPaymentRepository();
const paymentGateway = new MidtransPaymentGateway();
const orderRepository = new PrismaOrderRepository();
const revisionRequestRepository = new PrismaRevisionRequestRepository();
const paymentService = new PaymentService(paymentRepository, paymentGateway, orderRepository);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { order_id } = await req.json();
    if (!order_id) {
      return NextResponse.json({ success: false, message: 'Missing order_id' }, { status: 400 });
    }

    // Midtrans `order_id` is actually our `payment.id`
    const payment = await paymentRepository.findById(order_id);
    if (!payment) {
      return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 });
    }

    const order = await orderRepository.findById(payment.orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    if (order.buyerId !== userId && userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Anda tidak memiliki akses ke pembayaran revisi ini.' },
        { status: 403 }
      );
    }

    // Force sync status with Midtrans
    const currentStatus = await paymentService.getPaymentStatus(payment.id);

    if (currentStatus === 'SUCCESS') {
      // Find the associated RevisionRequest that is awaiting payment
      const requests = await revisionRequestRepository.findAllByOrderId(payment.orderId);
      const pendingPaidRevision = requests.find(r => 
        r.getStatus() === 'REQUIRES_PAYMENT' && Number(r.extraFee) === Number(payment.amount)
      );

      if (pendingPaidRevision) {
        pendingPaidRevision.acceptPaidRevision(); // Sets status to APPROVED_PAID and buyerDecision to ACCEPTED
        await revisionRequestRepository.save(pendingPaidRevision);
      }
    }

    return NextResponse.json({
      success: true,
      status: currentStatus,
      message: 'Revision payment synced'
    });

  } catch (error: any) {
    console.error('Revision sync payment error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal Server Error'
    }, { status: 500 });
  }
}
