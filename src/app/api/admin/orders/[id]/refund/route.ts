import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminApi } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MidtransPaymentGateway } from '@/infrastructure/payment/MidtransPaymentGateway';
import { PrismaNotificationService } from '@/infrastructure/services/PrismaNotificationService';

const paymentGateway = new MidtransPaymentGateway();
const notificationService = new PrismaNotificationService();

const REFUNDABLE_STATUSES = [
  'PAID',
  'CONFIRMED',
  'PROCESSING',
  'ARTWORK_UPLOADED',
  'WAITING_BUYER_CONFIRMATION',
  'REVISION_REQUESTED',
  'PROCESSING_REVISION'
];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAdminApi();
    if (error) return error;

    const adminId = (session?.user as any)?.id;
    const { id: orderId } = await params;

    const body = await req.json().catch(() => ({}));
    const reason = body?.reason || 'Pembatalan & refund oleh Admin';

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: { orderBy: { createdAt: 'desc' } },
        buyer: true,
        package: true,
      }
    });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    // Validasi status kelayakan refund
    if (!REFUNDABLE_STATUSES.includes(order.status)) {
      if (order.status === 'CANCELLED') {
        return NextResponse.json({ success: false, message: 'Pesanan ini sudah berstatus CANCELLED.' }, { status: 400 });
      }
      if (order.status === 'COMPLETED') {
        return NextResponse.json({ success: false, message: 'Pesanan yang sudah selesai (COMPLETED) tidak dapat di-refund.' }, { status: 400 });
      }
      if (order.status === 'PENDING' || order.status === 'AWAITING_PAYMENT') {
        return NextResponse.json({ success: false, message: 'Pesanan belum dibayar, tidak ada dana yang dapat di-refund.' }, { status: 400 });
      }
      return NextResponse.json({ success: false, message: `Pesanan dengan status ${order.status} tidak dapat di-refund.` }, { status: 400 });
    }

    const payment = order.payments.find(p => p.status === 'SUCCESS') || order.payments[0];
    if (!payment) {
      return NextResponse.json({ success: false, message: 'Data pembayaran untuk pesanan ini tidak ditemukan.' }, { status: 400 });
    }

    // Parameter refund untuk Midtrans API
    const refundAmount = Math.round(Number(payment.amount || order.totalAmount));
    const refundParam = {
      refund_key: `refund-${order.id.slice(0, 8)}-${Date.now()}`,
      amount: refundAmount,
      reason: reason
    };

    // Identifikasi ID transaksi yang dikenali oleh Midtrans
    const candidates = [payment.transactionId, payment.id, order.id].filter(Boolean) as string[];
    let refundResult: any = null;
    let midtransError: any = null;

    for (const candidateId of candidates) {
      try {
        refundResult = await paymentGateway.refundPayment(candidateId, refundParam);
        if (refundResult) {
          break;
        }
      } catch (err: any) {
        midtransError = err;
        // Jika 404 pada ID ini, coba kandidat ID berikutnya
        if (err.httpStatusCode === 404 || err.httpStatusCode === '404' || (err.message && err.message.includes('404'))) {
          continue;
        }
        // Jika error non-404 (misal 412 metode pembayaran tidak mendukung refund), hentikan loop
        break;
      }
    }

    if (!refundResult) {
      let errorMsg = midtransError?.ApiResponse?.status_message || midtransError?.message || 'Midtrans menolak permintaan refund.';
      if (typeof errorMsg === 'string' && errorMsg.includes('API response:')) {
        try {
          const jsonPart = errorMsg.split('API response:')[1]?.trim();
          if (jsonPart) {
            const parsed = JSON.parse(jsonPart);
            if (parsed.status_message) {
              errorMsg = parsed.status_message;
            }
          }
        } catch (_) {}
      }

      console.error(`Midtrans refund failed for order ${orderId}:`, midtransError);
      return NextResponse.json({
        success: false,
        message: `Gagal memproses refund di Midtrans: ${errorMsg}. Metode pembayaran ini mungkin tidak mendukung pengembalian dana otomatis via API.`
      }, { status: 400 });
    }

    // Jika refund berhasil di Midtrans, perbarui database dalam transaksi Prisma
    await prisma.$transaction(async (tx) => {
      // 1. Update status Order menjadi CANCELLED
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' }
      });

      // 2. Update status Payment menjadi REFUNDED
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED' }
      });

      // 3. Catat ke OrderStatusHistory
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'CANCELLED'
        }
      });

      // 4. Catat ke AuditLog
      await tx.auditLog.create({
        data: {
          userId: adminId,
          activityType: 'ORDER_REFUNDED',
          entityType: 'ORDER',
          entityId: order.id,
          detail: `Pesanan #${order.id} berhasil di-refund sebesar Rp ${refundAmount.toLocaleString('id-ID')}. Alasan: ${reason}`
        }
      });
    });

    // Kirim notifikasi ke klien
    try {
      await notificationService.sendNotification(
        order.buyerId,
        'SYSTEM',
        `Pesanan #${order.id} telah dibatalkan dan pengembalian dana (refund) sebesar Rp ${refundAmount.toLocaleString('id-ID')} telah diproses.`
      );
    } catch (notifErr) {
      console.error('Failed to send refund notification:', notifErr);
    }

    // Bersihkan cache Next.js untuk halaman admin dan klien
    revalidatePath(`/admin/orders/${order.id}`);
    revalidatePath('/admin/orders');
    revalidatePath('/admin');
    revalidatePath(`/orders/${order.id}`);
    revalidatePath('/orders');

    return NextResponse.json({
      success: true,
      message: `Pesanan #${order.id} berhasil dibatalkan dan dana sebesar Rp ${refundAmount.toLocaleString('id-ID')} telah di-refund via Midtrans.`,
      data: {
        orderId: order.id,
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED',
        refundDetail: refundResult
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Admin order refund error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}
