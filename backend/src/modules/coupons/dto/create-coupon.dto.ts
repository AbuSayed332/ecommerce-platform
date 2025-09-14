import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDate,
  IsUUID,
  Min,
  Max,
  IsNotEmpty,
  ValidateIf,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum CouponType {
  GENERAL = 'general',
  FIRST_ORDER = 'first_order',
  LOYALTY = 'loyalty',
  SEASONAL = 'seasonal',
  USER_SPECIFIC = 'user_specific',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_SHIPPING = 'free_shipping',
}

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  @Transform(({ value }) => value?.toUpperCase())
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsEnum(CouponType)
  type: CouponType;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsNumber()
  @Min(0)
  @ValidateIf((o) => o.discountType === DiscountType.PERCENTAGE)
  @Max(100)
  discountValue: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxDiscountAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minOrderAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxOrderAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  usageLimit?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  usageLimitPerUser?: number;

  @IsDate()
  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  startsAt?: Date;

  @IsDate()
  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  expiresAt?: Date;

  @IsUUID()
  @IsOptional()
  userId?: string; // For user-specific coupons

  @IsBoolean()
  @IsOptional()
  stackable?: boolean = false;

  @IsString({ each: true })
  @IsOptional()
  applicableCategories?: string[]; // Product categories this coupon applies to

  @IsString({ each: true })
  @IsOptional()
  excludedCategories?: string[]; // Product categories this coupon excludes

  @IsString({ each: true })
  @IsOptional()
  applicableProducts?: string[]; // Specific product IDs

  @IsString({ each: true })
  @IsOptional()
  excludedProducts?: string[]; // Excluded product IDs
}