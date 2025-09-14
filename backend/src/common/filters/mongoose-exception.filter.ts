import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { MongoError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';

interface MongoErrorResponse {
  success: boolean;
  message: string;
  error?: string;
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  stack?: string;
}

@Catch(MongoError, MongooseError)
export class MongooseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MongooseExceptionFilter.name);

  catch(exception: MongoError | MongooseError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';

    // Handle specific MongoDB/Mongoose errors
    if (exception instanceof MongoError) {
      const mongoError = this.handleMongoError(exception);
      status = mongoError.status;
      message = mongoError.message;
    } else if (exception instanceof MongooseError.ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = this.handleValidationError(exception);
    } else if (exception instanceof MongooseError.CastError) {
      status = HttpStatus.BAD_REQUEST;
      message = `Invalid ${exception.path}: ${exception.value}`;
    } else if (exception instanceof MongooseError.DocumentNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = 'Document not found';
    }

    // Log the error
    this.logger.error(
      `Database Exception: ${request.method} ${request.url} - Status: ${status} - Message: ${message}`,
      exception.stack,
    );

    const errorResponse: MongoErrorResponse = {
      success: false,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = exception.stack;
      errorResponse.error = exception.name;
    }

    response.status(status).json(errorResponse);
  }

  private handleMongoError(error: MongoError): { status: number; message: string } {
    switch (error.code) {
      case 11000: // Duplicate key error
        const field = this.extractDuplicateField(error.message);
        return {
          status: HttpStatus.CONFLICT,
          message: `${field} already exists`,
        };
      case 11001: // Duplicate key error (alternative code)
        return {
          status: HttpStatus.CONFLICT,
          message: 'Duplicate entry found',
        };
      case 2: // Bad value
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid data provided',
        };
      case 5: // Graph contains a cycle
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Circular reference detected',
        };
      case 50: // Exceeded time limit
        return {
          status: HttpStatus.REQUEST_TIMEOUT,
          message: 'Database operation timed out',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database operation failed',
        };
    }
  }

  private handleValidationError(error: MongooseError.ValidationError): string {
    const errors = Object.values(error.errors).map((err: any) => {
      if (err instanceof MongooseError.ValidatorError) {
        return `${err.path}: ${err.message}`;
      }
      if (err instanceof MongooseError.CastError) {
        return `${err.path}: Invalid value '${err.value}'`;
      }
      return err.message;
    });

    return `Validation failed: ${errors.join(', ')}`;
  }

  private extractDuplicateField(errorMessage: string): string {
    // Extract field name from duplicate key error message
    const match = errorMessage.match(/index: (\w+)_/);
    if (match && match[1]) {
      return match[1];
    }

    // Fallback: try to extract from the key pattern
    const keyMatch = errorMessage.match(/{ (\w+): /);
    if (keyMatch && keyMatch[1]) {
      return keyMatch[1];
    }

    return 'Field';
  }
}