export interface NotificationService {
  sendNotification(userId: string, type: string, content: string): Promise<void>;
  markAsRead(notificationId: string): Promise<void>;
}
