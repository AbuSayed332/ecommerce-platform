import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import bull from 'bull';
import { SendNotificationDto } from './dto';
import {
  Notification,
  NotificationResponse,
  NotificationListResponse,
  NotificationStatsResponse,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  NotificationPreferences,
  NotificationPriority,
} from './interfaces';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { PushNotificationService } from './services/push-notification.service';
import { InAppNotificationService } from './services/in-app-notification.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private notifications: Map<string, Notification> = new Map();
  private userPreferences: Map<string, NotificationPreferences> = new Map();

  constructor(
    @InjectQueue('notifications') private notificationQueue: bull.Queue,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly pushNotificationService: PushNotificationService,
    private readonly inAppNotificationService: InAppNotificationService,
  ) {}

  async sendNotification(sendNotificationDto: SendNotificationDto): Promise<NotificationResponse> {
    try {
      const notification = await this.createNotification(sendNotificationDto);
      
      const userPreferences = await this.getUserNotificationPreferences(
        sendNotificationDto.recipient,
      );
      
      if (!this.shouldSendNotification(notification, userPreferences.data)) {
        notification.status = NotificationStatus.BLOCKED;
        notification.metadata = {
          ...notification.metadata,
          blockReason: 'User preferences',
        };
        
        this.notifications.set(notification.id, notification);
        
        return {
          success: false,
          data: notification,
          message: 'Notification blocked by user preferences',
        };
      }

      await this.notificationQueue.add('send-notification', notification, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

      notification.status = NotificationStatus.QUEUED;
      this.notifications.set(notification.id, notification);

      this.logger.log(`Notification queued: ${notification.id}`);

      return {
        success: true,
        data: notification,
        message: 'Notification queued successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendBulkNotifications(
    recipients: string[],
    notificationData: Omit<SendNotificationDto, 'recipient'>,
  ): Promise<NotificationResponse[]> {
    const results: NotificationResponse[] = [];

    for (const recipient of recipients) {
      try {
        const result = await this.sendNotification({
          ...notificationData,
          recipient,
        });
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to send notification to ${recipient}: ${error.message}`);
        results.push({
          success: false,
          data: null,
          message: error.message,
        });
      }
    }

    this.logger.log(`Bulk notifications sent to ${recipients.length} recipients`);

    return results;
  }

  async scheduleNotification(
    notification: SendNotificationDto,
    scheduledAt: Date,
    timezone?: string,
  ): Promise<NotificationResponse> {
    try {
      const notificationData = await this.createNotification(notification);
      notificationData.scheduledAt = scheduledAt;
      notificationData.status = NotificationStatus.SCHEDULED;

      const delay = scheduledAt.getTime() - Date.now();

      if (delay <= 0) {
        throw new BadRequestException('Scheduled time must be in the future');
      }

      await this.notificationQueue.add('send-notification', notificationData, {
        delay,
        attempts: 3,
      });

      this.notifications.set(notificationData.id, notificationData);

      this.logger.log(`Notification scheduled: ${notificationData.id} for ${scheduledAt}`);

      return {
        success: true,
        data: notificationData,
        message: 'Notification scheduled successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to schedule notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getNotifications(filters: {
    page: number;
    limit: number;
    userId?: string;
    channel?: string;
    type?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<NotificationListResponse> {
    try {
      let notifications = Array.from(this.notifications.values());

      if (filters.userId) {
        notifications = notifications.filter((n) => n.recipient === filters.userId);
      }

      if (filters.channel) {
        notifications = notifications.filter((n) => n.channel === filters.channel);
      }

      if (filters.type) {
        notifications = notifications.filter((n) => n.type === filters.type);
      }

      if (filters.status) {
        notifications = notifications.filter((n) => n.status === filters.status);
      }

      // if (filters.startDate) {
      //   notifications = notifications.filter(
      //     (n) => new Date(n.createdAt) >= filters.startDate,
      //   );
      // }
      // if (filters.endDate) {
      //   notifications = notifications.filter(
      //     (n) => new Date(n.createdAt) <= filters.endDate,
      //   );
      // }

      notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = notifications.length;
      const startIndex = (filters.page - 1) * filters.limit;
      const endIndex = startIndex + filters.limit;
      const paginatedNotifications = notifications.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedNotifications,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get notifications: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUserNotifications(
    userId: string,
    options: {
      page: number;
      limit: number;
      unreadOnly: boolean;
    },
  ): Promise<NotificationListResponse> {
    const filters = {
      ...options,
      userId,
      status: options.unreadOnly ? NotificationStatus.DELIVERED : undefined,
    };

    return this.getNotifications(filters);
  }

  async getNotificationById(id: string): Promise<NotificationResponse> {
    const notification = this.notifications.get(id);

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return {
      success: true,
      data: notification,
    };
  }

  async markAsRead(id: string, userId?: string): Promise<NotificationResponse> {
    const notification = this.notifications.get(id);

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    if (userId && notification.recipient !== userId) {
      throw new BadRequestException('Cannot mark notification as read for different user');
    }

    notification.readAt = new Date();
    notification.status = NotificationStatus.READ;
    notification.updatedAt = new Date();

    this.notifications.set(id, notification);

    this.logger.log(`Notification marked as read: ${id}`);

    return {
      success: true,
      data: notification,
      message: 'Notification marked as read',
    };
  }

  async markAllAsRead(userId: string): Promise<{ success: boolean; markedCount: number }> {
    const userNotifications = Array.from(this.notifications.values()).filter(
      (n) => n.recipient === userId && n.status === NotificationStatus.DELIVERED,
    );

    let markedCount = 0;
    for (const notification of userNotifications) {
      notification.readAt = new Date();
      notification.status = NotificationStatus.READ;
      notification.updatedAt = new Date();
      this.notifications.set(notification.id, notification);
      markedCount++;
    }

    this.logger.log(`Marked ${markedCount} notifications as read for user ${userId}`);

    return {
      success: true,
      markedCount,
    };
  }

  async deleteNotification(id: string): Promise<void> {
    const notification = this.notifications.get(id);

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    this.notifications.delete(id);

    this.logger.log(`Notification deleted: ${id}`);
  }

  async getNotificationStats(options: {
    startDate?: Date;
    endDate?: Date;
    groupBy: 'day' | 'week' | 'month';
  }): Promise<NotificationStatsResponse> {
    const notifications = Array.from(this.notifications.values());
    
    let filteredNotifications = notifications;
    // if (options.startDate) {
    //   filteredNotifications = filteredNotifications.filter(
    //     (n) => new Date(n.createdAt) >= options.startDate,
    //   );
    // }
    // if (options.endDate) {
    //   filteredNotifications = filteredNotifications.filter(
    //     (n) => new Date(n.createdAt) <= options.endDate,
    //   );
    // }

    const stats = {
      total: filteredNotifications.length,
      byStatus: this.groupByField(filteredNotifications, 'status'),
      byChannel: this.groupByField(filteredNotifications, 'channel'),
      byType: this.groupByField(filteredNotifications, 'type'),
      deliveryRate: this.calculateDeliveryRate(filteredNotifications),
      readRate: this.calculateReadRate(filteredNotifications),
      timeline: this.generateTimeline(filteredNotifications, options.groupBy),
    };

    return {
      success: true,
      data: stats,
    };
  }

  async getUserNotificationPreferences(userId: string): Promise<{
    success: boolean;
    data: NotificationPreferences;
  }> {
    const preferences = this.userPreferences.get(userId) || this.getDefaultPreferences();

    return {
      success: true,
      data: preferences,
    };
  }

  async updateUserNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>,
  ): Promise<{ success: boolean; data: NotificationPreferences }> {
    const currentPreferences = this.userPreferences.get(userId) || this.getDefaultPreferences();
    
    const updatedPreferences = {
      ...currentPreferences,
      ...preferences,
      updatedAt: new Date(),
    };

    this.userPreferences.set(userId, updatedPreferences);

    this.logger.log(`Updated notification preferences for user ${userId}`);

    return {
      success: true,
      data: updatedPreferences,
    };
  }

  async testNotificationChannel(channel: string, testData: any) {
    try {
      let result;

      switch (channel) {
        case NotificationChannel.EMAIL:
          result = await this.emailService.sendTestEmail(testData);
          break;
        case NotificationChannel.SMS:
          result = await this.smsService.sendTestSms(testData);
          break;
        case NotificationChannel.PUSH:
          result = await this.pushNotificationService.sendTestPush(testData);
          break;
        case NotificationChannel.IN_APP:
          result = await this.inAppNotificationService.sendTestInApp(testData);
          break;
        default:
          throw new BadRequestException(`Unsupported channel: ${channel}`);
      }

      return {
        success: true,
        message: `Test notification sent via ${channel}`,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to test ${channel} channel: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async createNotification(dto: SendNotificationDto): Promise<Notification> {
    const notification: Notification = {
      id: this.generateId(),
      recipient: dto.recipient,
      channel: dto.channel,
      type: dto.type,
      title: dto.title,
      content: dto.content,
      data: dto.data || {},
      priority: dto.priority || NotificationPriority.NORMAL,
      status: NotificationStatus.CREATED,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: dto.metadata || {},
    };
    return notification;
  }

  private shouldSendNotification(
    notification: Notification,
    preferences: NotificationPreferences,
  ): boolean {
    if (!preferences.enabled) {
      return false;
    }

    const channelEnabled = preferences.channels[notification.channel];
    if (channelEnabled === false) {
      return false;
    }

    const typeEnabled = preferences.types[notification.type];
    if (typeEnabled === false) {
      return false;
    }

    if (preferences.quietHours.enabled) {
      const now = new Date();
      const currentHour = now.getHours();
      
      if (
        currentHour >= preferences.quietHours.startHour ||
        currentHour < preferences.quietHours.endHour
      ) {
        return false;
      }
    }

    return true;
  }

  private groupByField(notifications: Notification[], field: keyof Notification) {
    return notifications.reduce((acc, notification) => {
      const key = notification[field] as string;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateDeliveryRate(notifications: Notification[]): number {
    if (notifications.length === 0) return 0;
    
    const delivered = notifications.filter(
      (n) => n.status === NotificationStatus.DELIVERED || n.status === NotificationStatus.READ,
    ).length;
    
    return Math.round((delivered / notifications.length) * 100);
  }

  private calculateReadRate(notifications: Notification[]): number {
    const deliveredNotifications = notifications.filter(
      (n) => n.status === NotificationStatus.DELIVERED || n.status === NotificationStatus.READ,
    );
    
    if (deliveredNotifications.length === 0) return 0;
    
    const read = notifications.filter((n) => n.status === NotificationStatus.READ).length;
    
    return Math.round((read / deliveredNotifications.length) * 100);
  }

  private generateTimeline(notifications: Notification[], groupBy: string) {
    return notifications.reduce((acc, notification) => {
      const date = new Date(notification.createdAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: true,
      channels: {
        [NotificationChannel.EMAIL]: true,
        [NotificationChannel.SMS]: true,
        [NotificationChannel.PUSH]: true,
        [NotificationChannel.IN_APP]: true,
      },
      types: {
        [NotificationType.ORDER_CONFIRMATION]: true,
        [NotificationType.PAYMENT_SUCCESS]: true,
        [NotificationType.PAYMENT_FAILED]: true,
        [NotificationType.SHIPMENT_UPDATE]: true,
        [NotificationType.PROMOTIONAL]: false,
        [NotificationType.REMINDER]: true,
        [NotificationType.SECURITY_ALERT]: true,
        [NotificationType.SYSTEM_UPDATE]: true,
      },
      quietHours: {
        enabled: false,
        startHour: 22,
        endHour: 8,
      },
      frequency: {
        promotional: 'weekly',
        reminders: 'daily',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}