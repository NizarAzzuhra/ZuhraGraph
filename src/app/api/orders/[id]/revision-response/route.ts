import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { RevisionService } from '@/application/services/RevisionService';
import { PrismaOrderRepository } from '@/infrastructure/repositories/PrismaOrderRepository';
import { PrismaRevisionRequestRepository } from '@/infrastructure/repositories/PrismaRevisionRequestRepository';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { MidtransPaymentGateway } from '@/infrastructure/payment/MidtransPaymentGateway';
import { PrismaNotificationService } from '@/infrastructure/services/PrismaNotificationService';

const orderRepository = new PrismaOrderRepository();
const revisionRequestRepository = new PrismaRevisionRequestRepository();
const paymentRepository = new PrismaPaymentRepository();
const paymentGateway = new MidtransPaymentGateway();
const notificationService = new PrismaNotificationService();

const revisionService = new RevisionService(
  orderRepository,
  revisionRequestRepository,
  notificationService,
  paymentRepository,
  paymentGateway
);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const buyerId = (session.user as any).id;
    const { id: orderId } = await params;
    const { requestId, accept } = await req.json();

    if (!requestId || accept === undefined) {
      return NextResponse.json({ success: false, message: 'Invalid payload.' }, { status: 400 });
    }

    const buyerInfo = {
      first_name: (session.user as any).name || 'Buyer',
      email: (session.user as any).email || 'buyer@example.com'
    };

    const result = await revisionService.respondToPaidRevision(requestId, buyerId, accept, buyerInfo);

    // Revalidate paths for admin and client pages
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/orders');
    revalidatePath('/admin');
    revalidatePath(`/orders/${orderId}`);

    return NextResponse.json({
      success: true,
      message: accept ? 'Revisi berbayar disetujui.' : 'Revisi berbayar dibatalkan.',
      data: result
    }, { status: 200 });

  } catch (error: any) {
    console.error('Respond revision error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal Server Error'
    }, { status: error.message.includes('tidak ditemukan') ? 404 : 400 });
  }
}
