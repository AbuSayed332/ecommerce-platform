import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsPositive,
  Min,
  IsOptional,
  IsObject,
} from 'class-validator';

export class UpdateCartDto {
  @ApiProperty({
    description: 'Index of the cart item to update',
    example: 0,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Item index must be a number' })
  @Min(0, { message: 'Item index must be at least 0' })
  itemIndex: number;

  @ApiProperty({
    description: 'New quantity for the cart item',
    example: 3,
    minimum: 1,
  })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @IsPositive({ message: 'Quantity must be positive' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @ApiProperty({
    description: 'Selected product variants (e.g., size, color)',
    example: { size: 'L', color: 'blue' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  selectedVariants?: Record<string, string>;
}