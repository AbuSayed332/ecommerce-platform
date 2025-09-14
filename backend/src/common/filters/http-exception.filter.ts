import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  success: boolean;
  message: string;
  error?: string;
  errors?: any;
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  stack?: string;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Log the error
    this.logger.error(
      `HTTP Exception: ${request.method} ${request.url} - Status: ${status}`,
      exception.stack,
    );

    // Build error response
    const errorResponse: ErrorResponse = {
      success: false,
      message: this.getErrorMessage(exceptionResponse),
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    // Add additional error details if available
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;
      
      if (responseObj.error) {
        errorResponse.error = responseObj.error;
      }
      
      if (responseObj.errors) {
        errorResponse.errors = responseObj.errors;
      }
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = exception.stack;
    }

    response.status(status).json(errorResponse);
  }

  private getErrorMessage(exceptionResponse: any): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      if (exceptionResponse.message) {
        return Array.isArray(exceptionResponse.message)
          ? exceptionResponse.message[0]
          : exceptionResponse.message;
      }
      
      if (exceptionResponse.error) {
        return exceptionResponse.error;
      }
    }

    return 'An error occurred';
  }
}