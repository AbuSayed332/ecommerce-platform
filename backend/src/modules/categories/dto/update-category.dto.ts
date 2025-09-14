import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';
import { IsOptional, IsString, IsMongoId, IsNumber, IsBoolean, MaxLength } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  // ensure slug is declared so service can safely assign it
  @IsOptional()
  @IsString()
  @MaxLength(150)
  slug?: string;

  // parentCategory and other fields are inherited from PartialType(CreateCategoryDto),
  // so they remain optional. If you need to override types, you can redeclare here.
  @IsOptional()
  @IsMongoId()
  parentCategory?: Types.ObjectId;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
