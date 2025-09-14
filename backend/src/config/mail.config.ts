import { registerAs } from '@nestjs/config';
import { MailerOptions } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter.js';
import * as path from 'path';

export interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  defaults: {
    from: string;
    replyTo: string;
  };
  preview: boolean;
  template: {
    dir: string;
    adapter: any;
    options: {
      strict: boolean;
    };
  };
}

export const mailConfig = registerAs('mail', (): MailConfig => {
  const host = process.env.MAIL_HOST;
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASSWORD;

  // Allow mail to be optional in development
  if (process.env.NODE_ENV === 'production' && (!host || !user || !pass)) {
    throw new Error('MAIL_HOST, MAIL_USER, and MAIL_PASSWORD must be defined in production');
  }

  return {
    host: host || 'localhost',
    port: parseInt(process.env.MAIL_PORT || '587'),
    secure: process.env.MAIL_SECURE === 'true' || parseInt(process.env.MAIL_PORT || '587') === 465,
    auth: {
      user: user || '',
      pass: pass || '',
    },
    defaults: {
      from: process.env.MAIL_FROM || 'noreply@example.com',
      replyTo: process.env.MAIL_REPLY_TO || process.env.MAIL_FROM || 'noreply@example.com',
    },
    preview: process.env.NODE_ENV === 'development',
    template: {
      dir: path.join(process.cwd(), 'src/templates/email'),
      adapter: new HandlebarsAdapter(),
      options: {
        strict: true,
      },
    },
  };
});

// Mailer module configuration
export const getMailerConfig = (): MailerOptions => {
  const config = mailConfig();
  
  // Return mock configuration if mail is not configured
  if (!config.auth.user && process.env.NODE_ENV !== 'production') {
    return {
      transport: {
        jsonTransport: true,
      },
      defaults: config.defaults,
      template: config.template,
    };
  }

  return {
    transport: {
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 10,
    },
    defaults: config.defaults,
    preview: config.preview,
    template: config.template,
  };
};

// Email templates configuration
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  EMAIL_VERIFICATION: 'email-verification',
  PASSWORD_RESET: 'password-reset',
  ORDER_CONFIRMATION: 'order-confirmation',
  ORDER_STATUS_UPDATE: 'order-status-update',
  NEWSLETTER: 'newsletter',
  PROMOTIONAL: 'promotional',
  INVOICE: 'invoice',
} as const;