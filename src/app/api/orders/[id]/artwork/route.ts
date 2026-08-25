import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { PrismaOrderRepository } from '../../../../../infrastructure/repositories/PrismaOrderRepository';
import { prisma } from '../../../../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

const orderRepository = new PrismaOrderRepository();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Akses ditolak. Hanya Admin/Artist yang dapat mengunggah hasil desain.' }, { status: 403 });
    }

    const { id: orderId } = await params;
    const { url } = await req.json();

    if (!url || !url.trim()) {
      return NextResponse.json({ success: false, message: 'URL artwork wajib diisi.' }, { status: 400 });
    }

    const order = await orderRepository.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    order.uploadArtwork();
    order.requestBuyerConfirmation();

    const existingCount = await prisma.artworkVersion.count({
      where: { orderId }
    });

    const artworkVersion = await prisma.artworkVersion.create({
      data: {
        id: uuidv4(),
        orderId,
        url,
        revisionNumber: existingCount
      }
    });

    await orderRepository.save(order);

    // Send notification
    await prisma.notification.create({
      data: {
        id: uuidv4(),
        userId: order.buyerId,
        type: 'ARTWORK_UPLOADED',
        content: `Desain baru telah diunggah untuk pesanan ${order.id}. Silakan periksa dan konfirmasi.`
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Desain berhasil diunggah.',
      data: artworkVersion
    }, { status: 200 });

  } catch (error: any) {
    console.error('Upload artwork error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal Server Error'
    }, { status: 400 });
  }
}
