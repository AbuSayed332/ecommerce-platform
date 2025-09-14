import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ApplyCouponDto {
  @ApiProperty({
    description: 'Coupon code to apply',
    example: 'SAVE20',
  })
  @IsString()
  @IsNotEmpty()
  couponCode: string;
}