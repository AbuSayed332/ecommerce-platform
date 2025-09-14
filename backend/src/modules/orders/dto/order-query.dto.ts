import {
  IsOptional,
  IsString,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsDate,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../../../database/schemas/order.schema';

export class OrderQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'ORD-12345', description: 'Search by order number' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim().toUpperCase())
  orderNumber?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', description: 'Filter by customer ID' })
  @IsOptional()
  @IsMongoId()
  customer?: Types.ObjectId;

  @ApiPropertyOptional({ enum: OrderStatus, description: 'Filter by order status' })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ enum: PaymentStatus, description: 'Filter by payment status' })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ enum: PaymentMethod, description: 'Filter by payment method' })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z', description: 'Filter orders from this date' })
  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  @IsDate()
  dateFrom?: Date;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59.999Z', description: 'Filter orders until this date' })
  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  @IsDate()
  dateTo?: Date;

  @ApiPropertyOptional({ example: 50.00, description: 'Minimum order total' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minTotal?: number;

  @ApiPropertyOptional({ example: 500.00, description: 'Maximum order total' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxTotal?: number;

  @ApiPropertyOptional({ 
    example: 'createdAt', 
    enum: ['createdAt', 'total', 'orderNumber', 'status'],
    description: 'Sort field' 
  })
  @IsOptional()
  @IsString()
  @IsEnum(['createdAt', 'total', 'orderNumber', 'status'])
  sortBy?: 'createdAt' | 'total' | 'orderNumber' | 'status';

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'], description: 'Sort order' })
  @IsOptional()
  @IsString()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}