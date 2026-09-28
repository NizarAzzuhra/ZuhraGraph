import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminApi } from '@/lib/auth';
import { RevisionService } from '../../../../../../../application/services/RevisionService';
import { PrismaOrderRepository } from '../../../../../../../infrastructure/repositories/PrismaOrderRepository';
import { PrismaRevisionRequestRepository } from '../../../../../../../infrastructure/repositories/PrismaRevisionRequestRepository';
import { prisma } from '@/lib/prisma';

class RealNotificationService {
  async sendNotification(userId: string, type: string, content: string) {
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: (['ORDER_CREATED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'ORDER_CONFIRMED', 'ARTWORK_UPLOADED', 'REVISION_REQUESTED', 'ORDER_COMPLETED', 'REVIEW_SUBMITTED', 'SYSTEM'].includes(type) ? type : 'SYSTEM') as any,
          content,
          status: 'UNREAD',
        }
      });
    } catch(e) { console.error("Notif Error:", e) }
  }
  async markAsRead(notificationId: string) {
    try {
      await prisma.notification.update({ where: { id: notificationId }, data: { status: 'READ' } });
    } catch(e) { console.error("Notif Error:", e) }
  }
}

const orderRepository = new PrismaOrderRepository();
const revisionRequestRepository = new PrismaRevisionRequestRepository();
const notificationService = new RealNotificationService();

const revisionService = new RevisionService(
  orderRepository,
  revisionRequestRepository,
  notificationService
);

export async function POST(req: Request, { params }: { params: Promise<{ id: string; requestId: string }> }) {
  try {
    const { error } = await requireAdminApi();
    if (error) return error;

    const { id, requestId } = await params;
    const payload = await req.json();
    console.log("APPROVE REVISION PAYLOAD:", payload);
    const { approve, classification, extraFee, reason } = payload;

    if (approve === undefined) {
      return NextResponse.json({ success: false, message: 'Status keputusan (approve) wajib diberikan.' }, { status: 400 });
    }

    let parsedExtraFee = parseInt(extraFee as any, 10) || 0;

    if (approve) {
      if (!classification || !['ARTIST_ERROR', 'MINOR_REVISION', 'SCOPE_CHANGE'].includes(classification)) {
        return NextResponse.json({ success: false, message: 'Klasifikasi revisi tidak valid.' }, { status: 400 });
      }

      // Paksa extraFee = 0 di level route/backend jika ARTIST_ERROR
      if (classification === 'ARTIST_ERROR') {
        parsedExtraFee = 0;
      }

      if (parsedExtraFee < 0) {
        return NextResponse.json({ success: false, message: 'Biaya tambahan wajib diisi minimal 0.' }, { status: 400 });
      }
    }

    const result = await revisionService.decideRevision(requestId, approve, {
      classification,
      extraFee: parsedExtraFee,
      reason
    });

    // Revalidate paths for admin and client pages
    revalidatePath(`/admin/orders/${id}`);
    revalidatePath('/admin/orders');
    revalidatePath('/admin');
    revalidatePath(`/orders/${id}`);

    return NextResponse.json({
      success: true,
      message: approve ? 'Permintaan revisi berhasil disetujui.' : 'Permintaan revisi telah ditolak.',
      data: result.request
    }, { status: 200 });

  } catch (error: any) {
    console.error('APPROVE REVISION ERROR:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal Server Error'
    }, { status: error.message?.includes('tidak ditemukan') ? 404 : 400 });
  }
}
