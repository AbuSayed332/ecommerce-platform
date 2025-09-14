import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
  Max,
  ValidateNested,
  ArrayMaxSize,
  IsMongoId,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { ProductStatus } from '../../../database/schemas/product.schema';

export class ProductVariantDto {
  @ApiProperty({ example: 'SKU-RED-XL' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  sku: string;

  @ApiProperty({ example: 1999 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: { color: 'red', size: 'XL' } })
  @IsOptional()
  attributes?: Record<string, any>;
}

export class ProductDimensionsDto {
  @ApiPropertyOptional({ example: 1.5, description: 'Weight in kg' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ example: 30, description: 'Width in cm' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @ApiPropertyOptional({ example: 40, description: 'Height in cm' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @ApiPropertyOptional({ example: 2, description: 'Depth in cm' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  depth?: number;
}

export class SeoDataDto {
  @ApiPropertyOptional({ example: 'Buy Red T-Shirt - Brand' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({ example: 'High quality red t-shirt made of cotton...' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiPropertyOptional({ example: ['t-shirt', 'red', 'cotton'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  keywords?: string[];
}

// This is the main DTO class that was missing
export class CreateProductDto {
  @ApiProperty({ example: 'Premium Cotton T-Shirt' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({ example: 'High-quality cotton t-shirt perfect for everyday wear.' })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  description: string;

  @ApiPropertyOptional({ example: 'This premium cotton t-shirt is crafted from 100% organic cotton...' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }) => value?.trim())
  longDescription?: string;

  @ApiProperty({ example: 29.99 })
  @IsNumber()
  @Min(0.01)
  @Max(999999.99)
  price: number;

  @ApiPropertyOptional({ example: 39.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  comparePrice?: number;

  @ApiPropertyOptional({ example: 15.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  costPrice?: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  @Max(999999)
  stock: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  minStock?: number;

  @ApiPropertyOptional({ example: 'TSH-001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sku?: string;

  @ApiPropertyOptional({ example: '1234567890123' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  barcode?: string;

  @ApiPropertyOptional({ example: ['image1.jpg', 'image2.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  images?: string[];

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId({ message: 'Category must be a valid MongoDB ObjectId' })
  category: Types.ObjectId;

  @ApiPropertyOptional({ example: ['507f1f77bcf86cd799439012'] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @ArrayMaxSize(5)
  subcategories?: Types.ObjectId[];

  @ApiPropertyOptional({ enum: ProductStatus, example: ProductStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isDigital?: boolean;

  @ApiPropertyOptional({ example: ['clothing', 't-shirt', 'cotton'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  tags?: string[];

  @ApiPropertyOptional({ type: [ProductVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  @ArrayMaxSize(50)
  variants?: ProductVariantDto[];

  @ApiPropertyOptional({ type: ProductDimensionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductDimensionsDto)
  dimensions?: ProductDimensionsDto;

  @ApiPropertyOptional({ type: SeoDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SeoDataDto)
  seo?: SeoDataDto;

  @ApiPropertyOptional({ example: ['color', 'size', 'material'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  attributes?: string[];
}