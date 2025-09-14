import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { ProductStatus } from '../../../database/schemas/product.schema';

export class ProductQueryDto {
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

  @ApiPropertyOptional({ example: 'cotton t-shirt', description: 'Search term' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', description: 'Category ID' })
  @IsOptional()
  @IsMongoId()
  category?: Types.ObjectId;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439012', description: 'Vendor ID' })
  @IsOptional()
  @IsMongoId()
  vendor?: Types.ObjectId;

  @ApiPropertyOptional({ example: 10.00, description: 'Minimum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 500.00, description: 'Maximum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ example: true, description: 'Filter by stock availability' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  inStock?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Filter featured products' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Filter active products' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: ProductStatus, description: 'Product status' })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ 
    example: ['clothing', 't-shirt'], 
    description: 'Filter by tags (comma-separated)' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(tag => tag.trim());
    }
    return value;
  })
  tags?: string[];

  @ApiPropertyOptional({ 
    example: 'price', 
    enum: ['name', 'price', 'createdAt', 'averageRating', 'soldCount', 'viewCount'],
    description: 'Sort field'
  })
  @IsOptional()
  @IsString()
  @IsEnum(['name', 'price', 'createdAt', 'averageRating', 'soldCount', 'viewCount'])
  sortBy?: 'name' | 'price' | 'createdAt' | 'averageRating' | 'soldCount' | 'viewCount';

  @ApiPropertyOptional({ example: 'asc', enum: ['asc', 'desc'], description: 'Sort order' })
  @IsOptional()
  @IsString()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ example: 4.0, description: 'Minimum rating filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ example: ['color', 'size'], description: 'Filter by attributes' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attributes?: string[];
}
