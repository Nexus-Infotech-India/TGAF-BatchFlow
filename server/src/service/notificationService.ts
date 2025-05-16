import { PrismaClient, NotificationType } from '../generated/prisma';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

interface NotificationData {
    userId: string;
    batchId: string;
    message: string;
    type: NotificationType; // Use the enum instead of string
}

export class NotificationService {
    /**
     * Create a notification for a user.
     * @param data - Notification data including userId, batchId, message, and type.
     */
    async createNotification(data: NotificationData): Promise<void> {
        try {
            await prisma.notification.create({
                data: {
                    id: uuidv4(),
                    userId: data.userId,
                    batchId: data.batchId,
                    message: data.message,
                    type: data.type,
                    createdAt: new Date(),
                },
            });
        } catch (error) {
            console.error('Error creating notification:', error);
            throw new Error('Failed to create notification');
        }
    }

    /**
     * Get notifications for a specific user.
     * @param userId - The ID of the user.
     */
    async getNotificationsForUser(userId: string): Promise<any[]> {
        try {
            return await prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw new Error('Failed to fetch notifications');
        }
    }
}

export default new NotificationService();