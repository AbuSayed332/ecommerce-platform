import { Injectable, Logger } from '@nestjs/common';

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  path?: string;
  content?: Buffer | string;
  contentType?: string;
}

@Injectable()
export class EmailUtil {
  private readonly logger = new Logger(EmailUtil.name);

  /**
   * Generate welcome email template
   */
  static generateWelcomeEmail(firstName: string, verificationLink?: string): EmailTemplate {
    const subject = 'Welcome to Our Store!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome, ${firstName}!</h1>
        <p>Thank you for joining our store. We're excited to have you as a customer.</p>
        ${verificationLink ? `
          <div style="margin: 20px 0;">
            <p>Please verify your email address by clicking the button below:</p>
            <a href="${verificationLink}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email
            </a>
          </div>
        ` : ''}
        <p>Happy shopping!</p>
        <p style="color: #666; font-size: 14px;">The Store Team</p>
      </div>
    `;
    
    return { subject, html };
  }

  /**
   * Generate password reset email template
   */
  static generatePasswordResetEmail(firstName: string, resetLink: string): EmailTemplate {
    const subject = 'Reset Your Password';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Reset Your Password</h1>
        <p>Hi ${firstName},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="margin: 20px 0;">
          <a href="${resetLink}" 
             style="background-color: #dc3545; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p style="color: #666; font-size: 14px;">The Store Team</p>
      </div>
    `;
    
    return { subject, html };
  }

  /**
   * Generate order confirmation email template
   */
  static generateOrderConfirmationEmail(
    firstName: string,
    orderNumber: string,
    orderTotal: number,
    orderItems: any[],
  ): EmailTemplate {
    const subject = `Order Confirmation #${orderNumber}`;
    const itemsHtml = orderItems.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Order Confirmation</h1>
        <p>Hi ${firstName},</p>
        <p>Thank you for your order! Your order #${orderNumber} has been confirmed.</p>
        
        <h2 style="color: #333;">Order Details:</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
              <th style="padding: 12px 8px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
              <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 12px 8px; font-weight: bold; text-align: right;">Total:</td>
              <td style="padding: 12px 8px; font-weight: bold; text-align: right;">$${orderTotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        
        <p>We'll send you another email when your order ships.</p>
        <p style="color: #666; font-size: 14px;">The Store Team</p>
      </div>
    `;
    
    return { subject, html };
  }

  /**
   * Generate order status update email template
   */
  static generateOrderStatusEmail(
    firstName: string,
    orderNumber: string,
    status: string,
    trackingNumber?: string,
  ): EmailTemplate {
    const subject = `Order #${orderNumber} - ${status}`;
    let statusMessage = '';
    let statusColor = '#007bff';

    switch (status.toLowerCase()) {
      case 'confirmed':
        statusMessage = 'Your order has been confirmed and is being prepared.';
        statusColor = '#28a745';
        break;
      case 'processing':
        statusMessage = 'Your order is currently being processed.';
        statusColor = '#ffc107';
        break;
      case 'shipped':
        statusMessage = 'Your order has been shipped and is on its way!';
        statusColor = '#17a2b8';
        break;
      case 'delivered':
        statusMessage = 'Your order has been delivered. Enjoy your purchase!';
        statusColor = '#28a745';
        break;
      case 'cancelled':
        statusMessage = 'Your order has been cancelled. If you have any questions, please contact us.';
        statusColor = '#dc3545';
        break;
      default:
        statusMessage = `Your order status has been updated to: ${status}`;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Order Status Update</h1>
        <p>Hi ${firstName},</p>
        
        <div style="background-color: ${statusColor}; color: white; padding: 16px; border-radius: 5px; margin: 20px 0;">
          <h2 style="margin: 0; color: white;">Order #${orderNumber}</h2>
          <p style="margin: 8px 0 0 0; color: white;">${statusMessage}</p>
        </div>
        
        ${trackingNumber ? `
          <div style="margin: 20px 0;">
            <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
            <p>You can track your package using this tracking number.</p>
          </div>
        ` : ''}
        
        <p>Thank you for your business!</p>
        <p style="color: #666; font-size: 14px;">The Store Team</p>
      </div>
    `;
    
    return { subject, html };
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Extract domain from email
   */
  static extractDomain(email: string): string {
    return email.split('@')[1] || '';
  }

  /**
   * Sanitize email for display
   */
  static sanitizeEmailForDisplay(email: string): string {
    const [username, domain] = email.split('@');
    if (!username || !domain) return email;
    
    const maskedUsername = username.length > 2 
      ? username.substring(0, 2) + '*'.repeat(username.length - 2)
      : username;
    
    return `${maskedUsername}@${domain}`;
  }
}