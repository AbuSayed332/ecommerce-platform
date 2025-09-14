import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { PushNotificationService } from './services/push-notification.service';
import { InAppNotificationService } from './services/in-app-notification.service';
import { NotificationProcessor } from './processors/notification.processor';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    EmailService,
    SmsService,
    PushNotificationService,
    InAppNotificationService,
    NotificationProcessor,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}