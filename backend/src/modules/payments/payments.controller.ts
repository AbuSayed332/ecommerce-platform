import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  Get,
  Param,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, PaymentWebhookDto } from './dto';
import { PaymentResponse } from './interfaces';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponse> {
    return this.paymentsService.createPayment(createPaymentDto);
  }

  @Get('status/:paymentId')
  async getPaymentStatus(
    @Param('paymentId') paymentId: string,
    @Query('provider') provider: string,
  ): Promise<PaymentResponse> {
    return this.paymentsService.getPaymentStatus(paymentId, provider);
  }

  @Post('refund')
  async refundPayment(
    @Body() body: { paymentId: string; provider: string; amount?: number },
  ): Promise<PaymentResponse> {
    return this.paymentsService.refundPayment(
      body.paymentId,
      body.provider,
      body.amount,
    );
  }

  @Post('webhook/stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Body() body: any,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    await this.paymentsService.handleWebhook('stripe', body, signature);
    return { received: true };
  }

  @Post('webhook/paypal')
  @HttpCode(HttpStatus.OK)
  async handlePayPalWebhook(
    @Body() webhookDto: PaymentWebhookDto,
  ): Promise<{ received: boolean }> {
    await this.paymentsService.handleWebhook('paypal', webhookDto);
    return { received: true };
  }
}