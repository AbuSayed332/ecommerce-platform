import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsObject,
  IsEmail,
  Min,
  IsNotEmpty,
} from 'class-validator';

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  CAD = 'CAD',
}

export class CreatePaymentDto {
  @IsNumber()
  @Min(0.5)
  amount: number;

  @IsEnum(Currency)
  currency: Currency;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  successUrl?: string;

  @IsString()
  @IsOptional()
  cancelUrl?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}