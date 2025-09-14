import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object, {
      whitelist: true, // Remove non-whitelisted properties
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Transform input to match DTO types
      dismissDefaultMessages: false,
      validationError: {
        target: false,
        value: false,
      },
    });

    if (errors.length > 0) {
      const errorMessages = this.buildErrorMessages(errors);
      throw new BadRequestException({
        success: false,
        message: 'Validation failed',
        errors: errorMessages,
        timestamp: new Date().toISOString(),
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private buildErrorMessages(errors: any[]): any[] {
    return errors.map((error) => {
      const { property, value, constraints, children } = error;
      
      if (children && children.length > 0) {
        // Handle nested validation errors
        return {
          field: property,
          value,
          errors: this.buildErrorMessages(children),
        };
      }

      return {
        field: property,
        value,
        errors: constraints ? Object.values(constraints) : [],
      };
    });
  }
}