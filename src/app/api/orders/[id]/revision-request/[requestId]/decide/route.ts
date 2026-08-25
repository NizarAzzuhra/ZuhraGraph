import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../auth/[...nextauth]/route';
import { RevisionService } from '../../../../../../../application/services/RevisionService';
import { PrismaOrderRepository } from '../../../../../../../infrastructure/repositories/PrismaOrderRepository';
import { PrismaRevisionRequestRepository } from '../../../../../../../infrastructure/repositories/PrismaRevisionRequestRepository';
import { PrismaPaymentRepository } from '../../../../../../../infrastructure/repositories/PrismaPaymentRepository';
import { MidtransPaymentGateway } from '../../../../../../../infrastructure/payment/MidtransPaymentGateway';

// Mock Notification Service since real one is not yet implemented
class MockNotificationService {
  async sendNotification(userId: string, type: string, content: string) {
    console.log(`Notification to ${userId}: [${type}] ${content}`);
  }
  async markAsRead(notificationId: string) {}
}

const orderRepository = new PrismaOrderRepository();
const revisionRequestRepository = new PrismaRevisionRequestRepository();
const paymentRepository = new PrismaPaymentRepository();
const paymentGateway = new MidtransPaymentGateway();
const notificationService = new MockNotificationService();

const revisionService = new RevisionService(
  orderRepository,
  revisionRequestRepository,
  paymentRepository,
  paymentGateway,
  notificationService
);

export async function POST(req: Request, { params }: { params: Promise<{ id: string; requestId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Akses ditolak. Hanya Admin/Artist yang dapat memproses permintaan ini.' }, { status: 403 });
    }

    const { requestId } = await params;
    const { approve, classification, extraFee, reason } = await req.json();

    if (approve === undefined) {
      return NextResponse.json({ success: false, message: 'Status keputusan (approve) wajib diberikan.' }, { status: 400 });
    }

    if (approve) {
      if (!classification || !['CORRECTION', 'REVISION', 'SCOPE_CHANGE'].includes(classification)) {
        return NextResponse.json({ success: false, message: 'Klasifikasi revisi tidak valid.' }, { status: 400 });
      }

      if (extraFee === undefined || extraFee < 0) {
        return NextResponse.json({ success: false, message: 'Biaya tambahan wajib diisi minimal 0.' }, { status: 400 });
      }
    }

    const result = await revisionService.decideRevision(requestId, approve, {
      classification,
      extraFee: extraFee || 0,
      reason
    });

    return NextResponse.json({
      success: true,
      message: approve ? 'Permintaan revisi berhasil disetujui.' : 'Permintaan revisi telah ditolak.',
      data: result.request,
      paymentInfo: result.paymentInfo
    }, { status: 200 });

  } catch (error: any) {
    console.error('Decide revision error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal Server Error'
    }, { status: error.message.includes('tidak ditemukan') ? 404 : 400 });
  }
}
