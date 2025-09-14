import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  IsNotEmpty,
  IsArray,
} from 'class-validator';

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @Min(0)
  orderAmount: number;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  productIds?: string[]; // Products in the order

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  categories?: string[]; // Categories of products in the order

  @IsString()
  @IsOptional()
  currency?: string = 'USD';
}

export class ApplyCouponDto extends ValidateCouponDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;
}