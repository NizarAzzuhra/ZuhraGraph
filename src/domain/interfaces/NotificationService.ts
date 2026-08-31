export interface NotificationService {
  sendNotification(userId: string, type: string, content: string, link?: string): Promise<void>;
  sendToAdmins?(type: string, content: string, link?: string): Promise<void>;
  markAsRead(notificationId: string): Promise<void>;
}
