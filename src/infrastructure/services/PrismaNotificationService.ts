import { prisma } from '@/lib/prisma';

export class PrismaNotificationService {
  async sendNotification(userId: string, type: string, content: string, link?: string): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: (['ORDER_CREATED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'ORDER_CONFIRMED', 'ARTWORK_UPLOADED', 'REVISION_REQUESTED', 'ORDER_COMPLETED', 'REVIEW_SUBMITTED', 'SYSTEM'].includes(type) ? type : 'SYSTEM') as any,
          content,
          link,
          status: 'UNREAD',
        }
      });
    } catch(e) { 
      console.error("PrismaNotificationService Error:", e);
    }
  }

  async sendToAdmins(type: string, content: string, link?: string): Promise<void> {
    try {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      const notifications = admins.map(admin => ({
        userId: admin.id,
        type: (['ORDER_CREATED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'ORDER_CONFIRMED', 'ARTWORK_UPLOADED', 'REVISION_REQUESTED', 'ORDER_COMPLETED', 'REVIEW_SUBMITTED', 'SYSTEM'].includes(type) ? type : 'SYSTEM') as any,
        content,
        link,
        status: 'UNREAD' as const,
      }));
      
      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications });
      }
    } catch(e) {
      console.error("PrismaNotificationService sendToAdmins Error:", e);
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await prisma.notification.update({ 
        where: { id: notificationId }, 
        data: { status: 'READ' } 
      });
    } catch(e) { 
      console.error("PrismaNotificationService Error:", e);
    }
  }
}
