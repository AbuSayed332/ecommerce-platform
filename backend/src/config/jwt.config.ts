import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export interface JwtConfig {
  secret: string;
  refreshSecret: string;
  expiresIn: string;
  refreshExpiresIn: string;
  algorithm: string;
  issuer: string;
  audience: string;
}

export const jwtConfig = registerAs('jwt', (): JwtConfig => {
  const secret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!secret || !refreshSecret) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET environment variables must be defined');
  }

  // Validate secret strength
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  if (refreshSecret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long');
  }

  return {
    secret,
    refreshSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    algorithm: 'HS256',
    issuer: process.env.APP_NAME || 'Ecommerce API',
    audience: process.env.FRONTEND_URL || 'http://localhost:3000',
  };
});

// JWT module configuration
export const getJwtConfig = (): JwtModuleOptions => {
  const config = jwtConfig();
  return {
    secret: config.secret,
    signOptions: {
      expiresIn: config.expiresIn,
      issuer: config.issuer,
      audience: config.audience,
      algorithm: config.algorithm as any,
    },
  };
};

// JWT constants
export const JWT_CONSTANTS = {
  ACCESS_TOKEN_HEADER: 'authorization',
  REFRESH_TOKEN_HEADER: 'x-refresh-token',
  TOKEN_TYPE: 'Bearer',
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};