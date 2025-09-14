import { ConfigModule } from '@nestjs/config';
import { databaseConfig } from './database.config';
import { jwtConfig } from './jwt.config';
import { mailConfig } from './mail.config';
import { uploadConfig } from './upload.config';
import { websocketConfig } from './websocket.config';

export const configModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: [
    '.env.local',
    `.env.${process.env.NODE_ENV}`,
    '.env',
  ],
  load: [
    databaseConfig,
    jwtConfig,
    mailConfig,
    uploadConfig,
    websocketConfig,
  ],
  cache: true,
  expandVariables: true,
});

// Export individual configs
export { databaseConfig } from './database.config';
export { jwtConfig } from './jwt.config';
export { mailConfig } from './mail.config';
export { uploadConfig } from './upload.config';
export { websocketConfig } from './websocket.config';

// Export validation schema for environment variables
export const validationSchema = {
  // App
  NODE_ENV: {
    default: 'development',
    enum: ['development', 'production', 'test', 'staging'],
  },
  PORT: {
    default: 3000,
    type: 'number',
  },
  APP_NAME: {
    default: 'Ecommerce API',
  },
  APP_VERSION: {
    default: '1.0.0',
  },
  API_PREFIX: {
    default: 'api',
  },
  FRONTEND_URL: {
    default: 'http://localhost:3000',
  },
  ALLOWED_ORIGINS: {
    default: 'http://localhost:3000,http://localhost:3001',
  },

  // Database
  MONGODB_URI: {
    required: true,
  },
  DATABASE_NAME: {
    default: 'ecommerce',
  },

  // JWT
  JWT_SECRET: {
    required: true,
  },
  JWT_REFRESH_SECRET: {
    required: true,
  },
  JWT_EXPIRES_IN: {
    default: '15m',
  },
  JWT_REFRESH_EXPIRES_IN: {
    default: '7d',
  },

  // Email
  MAIL_HOST: {
    required: false,
  },
  MAIL_PORT: {
    default: 587,
    type: 'number',
  },
  MAIL_USER: {
    required: false,
  },
  MAIL_PASSWORD: {
    required: false,
  },
  MAIL_FROM: {
    default: 'noreply@example.com',
  },

  // File Upload
  UPLOAD_DEST: {
    default: './uploads',
  },
  MAX_FILE_SIZE: {
    default: 5242880, // 5MB
    type: 'number',
  },

  // WebSocket
  WS_PORT: {
    default: 3001,
    type: 'number',
  },
  WS_CORS_ORIGIN: {
    default: 'http://localhost:3000',
  },

  // External Services
  STRIPE_SECRET_KEY: {
    required: false,
  },
  STRIPE_PUBLISHABLE_KEY: {
    required: false,
  },
  PAYPAL_CLIENT_ID: {
    required: false,
  },
  PAYPAL_CLIENT_SECRET: {
    required: false,
  },
  REDIS_URL: {
    required: false,
  },
  CLOUDINARY_CLOUD_NAME: {
    required: false,
  },
  CLOUDINARY_API_KEY: {
    required: false,
  },
  CLOUDINARY_API_SECRET: {
    required: false,
  },
};
