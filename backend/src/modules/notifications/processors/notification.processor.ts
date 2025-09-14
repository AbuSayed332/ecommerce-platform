import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { Notification, NotificationChannel, NotificationStatus } from '../interfaces';
import { EmailService } from '../services/email.service';
import { SmsService } from '../services/sms.service';
import { PushNotificationService } from '../services/push-notification.service';
import { InAppNotificationService } from '../services/in-app-notification.service';

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly pushNotificationService: PushNotificationService,
    private readonly inAppNotificationService: InAppNotificationService,
  ) {}

  @Process('send-notification')
  async handleSendNotification(job: Job<Notification>) {
    const notification = job.data;

    try {
      this.logger.log(`Processing notification: ${notification.id}`);

      // Update status to sending
      notification.status = NotificationStatus.SENDING;

      let result;

      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          result = await this.emailService.sendEmail({
            ...notification,
            to: notification.recipient,
            subject: notification.title,
          });
          break;

        case NotificationChannel.SMS:
          result = await this.smsService.sendSms({
            ...notification,
            to: notification.recipient,
            message: notification.content,
          });
          break;

        case NotificationChannel.PUSH:
          // In real implementation, you'd get device token from user preferences
          result = await this.pushNotificationService.sendPushNotification(
            notification.data.deviceToken || 'mock-token', // token
            notification.title, // title
            notification.content, // body
            notification.data // data
          );
          break;

        case NotificationChannel.IN_APP:
          result = await this.inAppNotificationService.sendInAppNotification({
            ...notification,
            userId: notification.recipient,
          });
          break;

        default:
          throw new Error(`Unsupported notification channel: ${notification.channel}`);
      }

      if (result.success) {
        notification.status = NotificationStatus.DELIVERED;
        notification.sentAt = new Date();
        notification.metadata = {
          ...notification.metadata,
          messageId: result.messageId,
        };
        this.logger.log(`Notification sent successfully: ${notification.id}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      notification.status = NotificationStatus.FAILED;
      notification.failureReason = error.message;
      notification.retryCount = (notification.retryCount || 0) + 1;

      this.logger.error(
        `Failed to send notification ${notification.id}: ${error.message}`,
        error.stack,
      );

      // Re-queue for retry if not exceeded max attempts
      if (notification.retryCount < 3) {
        throw error; // This will trigger Bull's retry mechanism
      }
    } finally {
      notification.updatedAt = new Date();
      // In real implementation, save notification status to database
    }
  }
}