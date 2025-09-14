import { NotificationChannel, NotificationType, NotificationPriority } from '../dto/index';

export interface Notification {
  id: string;
  recipient: string;
  channel: NotificationChannel;
  type: NotificationType;
  title: string;
  content: string;
  data: Record<string, any>;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: Date;
  updatedAt: Date;
  scheduledAt?: Date;
  sentAt?: Date;
  readAt?: Date;
  metadata: Record<string, any>;
  failureReason?: string;
  retryCount?: number;
}

export enum NotificationStatus {
  CREATED = 'created',
  QUEUED = 'queued',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  BLOCKED = 'blocked',
}

export interface NotificationResponse {
  success: boolean;
  data: Notification | null;
  message?: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NotificationStatsResponse {
  success: boolean;
  data: {
    total: number;
    byStatus: Record<string, number>;
    byChannel: Record<string, number>;
    byType: Record<string, number>;
    deliveryRate: number;
    readRate: number;
    timeline: Record<string, number>;
  };
}

export interface NotificationPreferences {
  enabled: boolean;
  channels: Record<NotificationChannel, boolean>;
  types: Record<NotificationType, boolean>;
  quietHours: {
    enabled: boolean;
    startHour: number;
    endHour: number;
  };
  frequency: {
    promotional: 'immediate' | 'daily' | 'weekly' | 'monthly';
    reminders: 'immediate' | 'daily' | 'weekly';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string; // For email
  title: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deliveredAt: Date;
  metadata?: Record<string, any>;
}

// Service interfaces for different notification channels
export interface EmailNotificationData extends Notification {
  to: string;
  subject: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface SmsNotificationData extends Notification {
  to: string;
  message: string;
}

export interface PushNotificationData extends Notification {
  deviceToken: string;
  badge?: number;
  sound?: string;
  category?: string;
}

export interface InAppNotificationData extends Notification {
  userId: string;
  actionUrl?: string;
  imageUrl?: string;
}