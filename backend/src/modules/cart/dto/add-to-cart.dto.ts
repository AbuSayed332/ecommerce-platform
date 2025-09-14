import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsPositive,
  Min,
  IsMongoId,
  IsOptional,
  IsObject,
} from 'class-validator';

export class AddToCartDto {
  @ApiProperty({
    description: 'Product ID to add to cart',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsMongoId({ message: 'Please provide a valid product ID' })
  productId: string;

  @ApiProperty({
    description: 'Quantity of the product',
    example: 2,
    minimum: 1,
  })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @IsPositive({ message: 'Quantity must be positive' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @ApiProperty({
    description: 'Selected product variants (e.g., size, color)',
    example: { size: 'M', color: 'red' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  selectedVariants?: Record<string, string>;
}
