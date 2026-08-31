import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { id: orderId } = await params;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ success: false, message: 'File artwork wajib disertakan.' }, { status: 400 });
    }

    // Save the file securely to public/uploads/artworks/
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "artworks");
    await mkdir(uploadDir, { recursive: true });

    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = `${Date.now()}-${safeFilename}`;
    const filepath = path.join(uploadDir, uniqueFilename);

    await writeFile(filepath, buffer);
    const artworkUrl = `/uploads/artworks/${uniqueFilename}`;

    // Get order to determine current revision number
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { artworkVersions: { orderBy: { revisionNumber: 'desc' }, take: 1 } }
    });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order tidak ditemukan' }, { status: 404 });
    }

    const nextRevisionNumber = order.artworkVersions.length > 0 ? order.artworkVersions[0].revisionNumber + 1 : 0;

    // Create a new record in the ArtworkVersion table
    const newArtworkVersion = await prisma.artworkVersion.create({
      data: {
        orderId,
        url: artworkUrl,
        revisionNumber: nextRevisionNumber
      }
    });

    // Automatically update the order status
    const newStatus = order.status === 'PROCESSING_REVISION' ? 'WAITING_BUYER_CONFIRMATION' : 'ARTWORK_UPLOADED';
    
    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus as any }
    });

    // Create a Notification record for the client
    await prisma.notification.create({
      data: {
        userId: order.buyerId,
        type: 'ARTWORK_UPLOADED',
        content: `Artwork pesanan Anda (ID: ...${orderId.slice(-8)}) telah dikirim oleh Admin!`,
        status: 'UNREAD'
      }
    });

    // Call revalidatePath for both admin and client order pages
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath(`/orders/${orderId}`);

    return NextResponse.json({
      success: true,
      message: 'Artwork berhasil diunggah',
      data: newArtworkVersion
    }, { status: 201 });

  } catch (error: any) {
    console.error('Upload artwork admin error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}
