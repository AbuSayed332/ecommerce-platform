import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailNotificationData, NotificationDeliveryResult } from '../interfaces';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailConfig = {
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    };

    this.transporter = nodemailer.createTransporter(emailConfig);
  }

  async sendEmail(notificationData: EmailNotificationData): Promise<NotificationDeliveryResult> {
    try {
      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM', 'noreply@yourapp.com'),
        to: notificationData.to,
        subject: notificationData.title,
        text: notificationData.content,
        html: this.generateHtmlContent(notificationData),
        attachments: notificationData.attachments || [],
      };

      const result = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email sent successfully: ${result.messageId}`);

      return {
        success: true,
        messageId: result.messageId,
        deliveredAt: new Date(),
        metadata: { response: result.response },
      };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
        deliveredAt: new Date(),
      };
    }
  }

  async sendTestEmail(testData: { to: string; subject: string; content: string }) {
    try {
      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM'),
        to: testData.to,
        subject: `[TEST] ${testData.subject}`,
        text: testData.content,
        html: `<p>${testData.content}</p>`,
      };

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      throw error;
    }
  }

  private generateHtmlContent(data: EmailNotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${data.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background-color: #f8f9fa; padding: 10px; text-align: center; font-size: 12px; }
            .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${data.title}</h1>
            </div>
            <div class="content">
              <p>${data.content}</p>
              ${data.data.actionUrl ? `<p><a href="${data.data.actionUrl}" class="button">Take Action</a></p>` : ''}
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}