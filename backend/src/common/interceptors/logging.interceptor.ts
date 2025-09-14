import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, body, query, params, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const ip = request.ip || request.connection.remoteAddress;

    const startTime = Date.now();

    // Log incoming request
    this.logger.log(
      `📥 Incoming Request: ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`,
    );

    if (Object.keys(body || {}).length > 0) {
      // Don't log sensitive information
      const sanitizedBody = this.sanitizeBody(body);
      this.logger.debug(`Request Body: ${JSON.stringify(sanitizedBody)}`);
    }

    if (Object.keys(query || {}).length > 0) {
      this.logger.debug(`Query Params: ${JSON.stringify(query)}`);
    }

    if (Object.keys(params || {}).length > 0) {
      this.logger.debug(`Route Params: ${JSON.stringify(params)}`);
    }

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log(
          `📤 Outgoing Response: ${method} ${url} - Status: ${response.statusCode} - Duration: ${duration}ms`,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logger.error(
          `❌ Error Response: ${method} ${url} - Status: ${error.status || 500} - Duration: ${duration}ms`,
          error.stack,
        );
        return throwError(() => error);
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = [
      'password',
      'confirmPassword',
      'currentPassword',
      'newPassword',
      'token',
      'refreshToken',
      'accessToken',
      'authorization',
      'secret',
      'key',
      'apiKey',
      'creditCard',
      'ssn',
      'socialSecurityNumber',
    ];

    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '*'.repeat(8);
      }
    }

    return sanitized;
  }
}