import { registerAs } from '@nestjs/config';

export interface WebSocketConfig {
  port: number;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  transports: string[];
  allowEIO3: boolean;
  pingTimeout: number;
  pingInterval: number;
  upgradeTimeout: number;
  maxHttpBufferSize: number;
  namespace: {
    orders: string;
    notifications: string;
    chat: string;
    admin: string;
  };
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
}

export const websocketConfig = registerAs('websocket', (): WebSocketConfig => {
  const corsOrigin = process.env.WS_CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000';
  
  const config: WebSocketConfig = {
    port: parseInt(process.env.WS_PORT || '3001'),
    cors: {
      origin: corsOrigin.includes(',') ? corsOrigin.split(',') : corsOrigin,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '60000'),
    pingInterval: parseInt(process.env.WS_PING_INTERVAL || '25000'),
    upgradeTimeout: parseInt(process.env.WS_UPGRADE_TIMEOUT || '10000'),
    maxHttpBufferSize: parseInt(process.env.WS_MAX_BUFFER_SIZE || '1048576'), // 1MB
    namespace: {
      orders: '/orders',
      notifications: '/notifications',
      chat: '/chat',
      admin: '/admin',
    },
  };

  // Add Redis configuration if available (for scaling WebSocket across multiple instances)
  if (process.env.REDIS_URL) {
    const redisUrl = new URL(process.env.REDIS_URL);
    config.redis = {
      host: redisUrl.hostname,
      port: parseInt(redisUrl.port) || 6379,
      password: redisUrl.password || undefined,
    };
  }

  return config;
});

// WebSocket events
export const WS_EVENTS = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // Order events
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  ORDER_STATUS_CHANGED: 'order:status:changed',
  ORDER_PAYMENT_UPDATED: 'order:payment:updated',
  
  // Product events
  PRODUCT_STOCK_LOW: 'product:stock:low',
  PRODUCT_OUT_OF_STOCK: 'product:out:of:stock',
  
  // User events
  USER_REGISTERED: 'user:registered',
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  
  // Notification events
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',
  
  // Chat events
  MESSAGE_NEW: 'chat:message:new',
  MESSAGE_TYPING: 'chat:typing',
  MESSAGE_READ: 'chat:message:read',
  
  // Admin events
  ADMIN_USER_ACTION: 'admin:user:action',
  ADMIN_SYSTEM_ALERT: 'admin:system:alert',
  ADMIN_ANALYTICS_UPDATE: 'admin:analytics:update',
} as const;

// WebSocket middleware configuration
export const WS_MIDDLEWARE = {
  RATE_LIMIT: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each socket to 100 requests per windowMs
  },
  AUTH_TIMEOUT: 30000, // 30 seconds to authenticate
  MAX_LISTENERS: 10, // maximum event listeners per socket
} as const;