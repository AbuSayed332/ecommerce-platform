import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || '';

    // Log incoming request
    this.logger.log(
      `📥 ${method} ${originalUrl} - IP: ${ip} - User-Agent: ${userAgent}`,
    );

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: BufferEncoding | (() => void), cb?: (() => void)): Response {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      const contentLength = res.get('content-length') || 0;

      // Determine log level based on status code
      const logLevel = statusCode >= 400 ? 'error' : 'log';
      const emoji = statusCode >= 500 ? '💥' : statusCode >= 400 ? '⚠️' : '✅';

      Logger.prototype[logLevel].call(
        Logger.prototype,
        `${emoji} ${method} ${originalUrl} - Status: ${statusCode} - Duration: ${duration}ms - Size: ${contentLength}b`,
        LoggerMiddleware.name,
      );

      // Call originalEnd with correct arguments and return its result
      // Handle all overloads
      if (typeof encoding === 'function') {
        return originalEnd.call(res, chunk, encoding);
      } else if (typeof cb === 'function') {
        return originalEnd.call(res, chunk, encoding, cb);
      } else if (typeof chunk !== 'undefined') {
        return originalEnd.call(res, chunk, encoding);
      } else {
        return originalEnd.call(res);
      }
    } as typeof res.end;

    next();
  }
}
