import { IsString, IsObject, IsOptional } from 'class-validator';

export class PaymentWebhookDto {
  @IsString()
  id: string;

  @IsString()
  event_type: string;

  @IsObject()
  resource: any;

  @IsString()
  @IsOptional()
  resource_type?: string;

  @IsObject()
  @IsOptional()
  summary?: any;

  @IsString()
  @IsOptional()
  create_time?: string;
}