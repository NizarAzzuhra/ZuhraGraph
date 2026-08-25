import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../auth/[...nextauth]/route';
import { BriefEditService } from '../../../../../../../application/services/BriefEditService';
import { PrismaOrderRepository } from '../../../../../../../infrastructure/repositories/PrismaOrderRepository';
import { PrismaBriefEditRequestRepository } from '../../../../../../../infrastructure/repositories/PrismaBriefEditRequestRepository';

// Mock Notification Service since real one is not yet implemented
class MockNotificationService {
  async sendNotification(userId: string, type: string, content: string) {
    console.log(`Notification to ${userId}: [${type}] ${content}`);
  }
  async markAsRead(notificationId: string) {}
}

const orderRepository = new PrismaOrderRepository();
const briefEditRequestRepository = new PrismaBriefEditRequestRepository();
const notificationService = new MockNotificationService();
const briefEditService = new BriefEditService(orderRepository, briefEditRequestRepository, notificationService);

export async function POST(req: Request, { params }: { params: Promise<{ id: string; requestId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Authorization check: Only Admin/Artist role can approve/reject brief edits
    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Akses ditolak. Hanya Admin yang dapat memproses permintaan ini.' }, { status: 403 });
    }

    const { requestId } = await params;
    const { approve, reason } = await req.json();

    if (approve === undefined) {
      return NextResponse.json({ success: false, message: 'Status keputusan (approve) wajib diberikan.' }, { status: 400 });
    }

    const request = await briefEditService.decideBriefEdit(requestId, approve, reason);

    return NextResponse.json({
      success: true,
      message: approve ? 'Perubahan brief berhasil disetujui.' : 'Perubahan brief telah ditolak.',
      data: request
    }, { status: 200 });

  } catch (error: any) {
    console.error('Decide brief edit error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal Server Error'
    }, { status: error.message.includes('tidak ditemukan') ? 404 : 400 });
  }
}
