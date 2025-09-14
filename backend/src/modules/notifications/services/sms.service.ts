import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsNotificationData, NotificationDeliveryResult } from '../interfaces';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private configService: ConfigService) {}

  async sendSms(notificationData: SmsNotificationData): Promise<NotificationDeliveryResult> {
    try {
      // Example using Twilio - replace with your preferred SMS provider
      const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
      const fromNumber = this.configService.get<string>('TWILIO_FROM_NUMBER');

      if (!accountSid || !authToken || !fromNumber) {
        throw new Error('SMS service not configured');
      }

      // Mock implementation - replace with actual Twilio client
      const result = await this.mockSmsProvider({
        to: notificationData.to,
        from: fromNumber,
        body: `${notificationData.title}\n\n${notificationData.content}`,
      });

      this.logger.log(`SMS sent successfully: ${result.sid}`);

      return {
        success: true,
        messageId: result.sid,
        deliveredAt: new Date(),
        metadata: { status: result.status },
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
        deliveredAt: new Date(),
      };
    }
  }

  async sendTestSms(testData: { to: string; message: string }) {
    try {
      const result = await this.mockSmsProvider({
        to: testData.to,
        from: this.configService.get<string>('TWILIO_FROM_NUMBER') || 'YOUR_DEFAULT_FROM_NUMBER',
        body: `[TEST] ${testData.message}`,
      });
      return { success: true, messageId: result.sid };
    } catch (error) {
      throw error;
    }
  }

  private async mockSmsProvider(data: { to: string; from: string; body: string }) {
    // Mock implementation - replace with actual SMS provider client
    return {
      sid: `SM${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      status: 'queued',
    };
  }
}