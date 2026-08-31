import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const unreadCount = notifications.filter((n: any) => n.status === 'UNREAD').length;

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount
    }, { status: 200 });

  } catch (error: any) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal Server Error'
    }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    await prisma.notification.updateMany({
      where: { userId, status: 'UNREAD' },
      data: { status: 'READ' }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Mark notifications read error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
