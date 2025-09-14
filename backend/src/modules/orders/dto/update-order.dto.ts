import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  IsDate,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, PaymentStatus } from '../../../database/schemas/order.schema';

/* Small DTO for shipping updates */
class OrderShippingUpdateDto {
  @ApiPropertyOptional({ example: 'FedEx' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  carrier?: string;

  @ApiPropertyOptional({ example: '1Z999AA1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  trackingNumber?: string;

  @ApiPropertyOptional({ example: '2024-01-15T00:00:00.000Z' })
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  estimatedDelivery?: Date;
}

/*
  IMPORTANT:
  1. Omit 'items' from CreateOrderDto first, then make the result Partial.
  2. Use `as const` for the tuple typed keys for OmitType.
*/
export class UpdateOrderDto extends PartialType(
  OmitType(CreateOrderDto, ['items'] as const),
) {
  @ApiPropertyOptional({ enum: OrderStatus, description: 'Order status' })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ enum: PaymentStatus, description: 'Payment status' })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ example: 'pi_1234567890', description: 'Payment ID from payment provider' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  paymentId?: string;

  @ApiPropertyOptional({ example: 'txn_1234567890', description: 'Transaction ID' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  transactionId?: string;

  @ApiPropertyOptional({ type: OrderShippingUpdateDto, description: 'Shipping information' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderShippingUpdateDto)
  shipping?: OrderShippingUpdateDto;

  @ApiPropertyOptional({ example: 'Customer requested cancellation', description: 'Cancellation reason' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancellationReason?: string;

  @ApiPropertyOptional({ example: 50.0, description: 'Refund amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;
}
