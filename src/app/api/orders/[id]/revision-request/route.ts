import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { RevisionService } from '../../../../../application/services/RevisionService';
import { PrismaOrderRepository } from '../../../../../infrastructure/repositories/PrismaOrderRepository';
import { PrismaRevisionRequestRepository } from '../../../../../infrastructure/repositories/PrismaRevisionRequestRepository';

import { PrismaNotificationService } from '../../../../../infrastructure/services/PrismaNotificationService';

const orderRepository = new PrismaOrderRepository();
const revisionRequestRepository = new PrismaRevisionRequestRepository();
const notificationService = new PrismaNotificationService();

const revisionService = new RevisionService(
  orderRepository,
  revisionRequestRepository,
  notificationService
);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const buyerId = (session.user as any).id;
    const { id: orderId } = await params;

    const { description, artworkVersionId } = await req.json();

    if (!description || !description.trim()) {
      return NextResponse.json({ success: false, message: 'Deskripsi revisi wajib diisi.' }, { status: 400 });
    }

    if (!artworkVersionId || !artworkVersionId.trim()) {
      return NextResponse.json({ success: false, message: 'ID versi artwork wajib disertakan.' }, { status: 400 });
    }

    const request = await revisionService.requestRevision(buyerId, orderId, description, artworkVersionId);

    return NextResponse.json({
      success: true,
      message: 'Permintaan revisi berhasil diajukan.',
      data: request
    }, { status: 200 });

  } catch (error: any) {
    console.error('Request revision error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal Server Error'
    }, { status: error.message.includes('tidak ditemukan') ? 404 : 400 });
  }
}
