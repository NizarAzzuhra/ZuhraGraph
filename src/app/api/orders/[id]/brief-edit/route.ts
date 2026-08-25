import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { BriefEditService } from '../../../../../application/services/BriefEditService';
import { PrismaOrderRepository } from '../../../../../infrastructure/repositories/PrismaOrderRepository';
import { PrismaBriefEditRequestRepository } from '../../../../../infrastructure/repositories/PrismaBriefEditRequestRepository';

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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const buyerId = (session.user as any).id;
    const { id: orderId } = await params;

    const { proposedBrief } = await req.json();

    if (!proposedBrief || !proposedBrief.trim()) {
      return NextResponse.json({ success: false, message: 'Brief baru tidak boleh kosong.' }, { status: 400 });
    }

    if (proposedBrief.length > 1000) {
      return NextResponse.json({ success: false, message: 'Brief tidak boleh lebih dari 1000 karakter.' }, { status: 400 });
    }

    const result = await briefEditService.requestBriefEdit(buyerId, orderId, proposedBrief);

    return NextResponse.json({
      success: true,
      message: result.directUpdate ? 'Brief pesanan berhasil diperbarui secara langsung.' : 'Permintaan perubahan brief berhasil diajukan.',
      directUpdate: result.directUpdate,
      data: result.request
    }, { status: 200 });

  } catch (error: any) {
    console.error('Request brief edit error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal Server Error'
    }, { status: error.message.includes('tidak ditemukan') ? 404 : 400 });
  }
}
