import {
  IsArray,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsMongoId,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { PaymentMethod } from '../../../database/schemas/order.schema';

class OrderItemDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Product ID' })
  @IsMongoId({ message: 'Product must be a valid MongoDB ObjectId' })
  product: Types.ObjectId;

  @ApiProperty({ example: 2, description: 'Quantity of the product' })
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(1000, { message: 'Quantity cannot exceed 1000' })
  quantity: number;

  @ApiPropertyOptional({ 
    example: { size: 'L', color: 'red' }, 
    description: 'Selected product variants' 
  })
  @IsOptional()
  selectedVariants?: Record<string, string>;
}

class OrderAddressDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ example: '123 Main Street, Apt 4B' })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  street: string;

  @ApiProperty({ example: 'New York' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  city: string;

  @ApiProperty({ example: 'NY' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  state: string;

  @ApiProperty({ example: '10001' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Transform(({ value }) => value?.trim())
  zipCode: string;

  @ApiProperty({ example: 'United States' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  country: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto], description: 'Array of order items' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Order must contain at least one item' })
  @ArrayMaxSize(50, { message: 'Order cannot contain more than 50 items' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ type: OrderAddressDto, description: 'Shipping address' })
  @ValidateNested()
  @Type(() => OrderAddressDto)
  shippingAddress: OrderAddressDto;

  @ApiPropertyOptional({ type: OrderAddressDto, description: 'Billing address (optional, uses shipping if not provided)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderAddressDto)
  billingAddress?: OrderAddressDto;

  @ApiProperty({ enum: PaymentMethod, description: 'Payment method' })
  @IsEnum(PaymentMethod, { message: 'Invalid payment method' })
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 'SAVE10', description: 'Coupon code' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Transform(({ value }) => value?.toUpperCase().trim())
  couponCode?: string;

  @ApiPropertyOptional({ example: 'Please deliver after 5 PM', description: 'Special delivery instructions' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  notes?: string;
}
