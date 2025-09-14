import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;
    const allowedOrigins = this.getAllowedOrigins();

    // Set CORS headers
    if (origin && this.isOriginAllowed(origin, allowedOrigins)) {
      res.header('Access-Control-Allow-Origin', origin);
    } else if (!origin && process.env.NODE_ENV === 'development') {
      // Allow requests with no origin (mobile apps, Postman, etc.) in development
      res.header('Access-Control-Allow-Origin', '*');
    }

    res.header('Access-Control-Allow-Credentials', 'true');
    res.header(
      'Access-Control-Allow-Methods',
      'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    );
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma',
    );
    res.header(
      'Access-Control-Expose-Headers',
      'Authorization, X-Total-Count, X-Page-Count',
    );

    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
      return res.sendStatus(204);
    }

    next();
  }

  private getAllowedOrigins(): string[] {
    const origins = process.env.ALLOWED_ORIGINS || '';
    
    if (!origins) {
      return process.env.NODE_ENV === 'development' 
        ? ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000']
        : [];
    }

    return origins.split(',').map(origin => origin.trim());
  }

  private isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
    if (allowedOrigins.includes('*')) {
      return true;
    }

    return allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        // Handle wildcard subdomains like *.example.com
        const regex = new RegExp(
          allowedOrigin.replace(/\*/g, '.*').replace(/\./g, '\\.'),
        );
        return regex.test(origin);
      }
      return allowedOrigin === origin;
    });
  }
}