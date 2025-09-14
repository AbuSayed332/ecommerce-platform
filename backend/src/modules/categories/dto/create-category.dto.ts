import { IsString, IsOptional, MaxLength, IsBoolean, IsMongoId, IsNumber } from 'class-validator';
import { Types } from 'mongoose';

export class CreateCategoryDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsMongoId()
  parentCategory?: Types.ObjectId;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  seo?: any;

  @IsOptional()
  attributes?: any[];
}
