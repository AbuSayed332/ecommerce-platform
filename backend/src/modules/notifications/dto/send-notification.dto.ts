import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsUUID,
  IsNotEmpty,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}

export enum NotificationType {
  ORDER_CONFIRMATION = 'order_confirmation',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  SHIPMENT_UPDATE = 'shipment_update',
  PROMOTIONAL = 'promotional',
  REMINDER = 'reminder',
  SECURITY_ALERT = 'security_alert',
  SYSTEM_UPDATE = 'system_update',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export class NotificationDataDto {
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsObject()
  customData?: Record<string, any>;
}

export class SendNotificationDto {
  @IsUUID()
  @IsNotEmpty()
  recipient: string;

  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationDataDto)
  data?: NotificationDataDto;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  templateId?: string; // For using predefined templates

  @IsOptional()
  @IsObject()
  templateVariables?: Record<string, any>; // Variables for template rendering
}

export class BulkNotificationDto {
  @IsUUID(4, { each: true })
  recipients: string[];

  @ValidateNested()
  @Type(() => SendNotificationDto)
  notification: Omit<SendNotificationDto, 'recipient'>;
}

export class ScheduleNotificationDto extends SendNotificationDto {
  @IsString()
  @IsNotEmpty()
  scheduledAt: string; // ISO date string

  @IsOptional()
  @IsString()
  timezone?: string;
}