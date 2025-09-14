import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { CreatePaymentDto } from './dto';
import { PaymentResponse, PaymentStrategy } from './interfaces';
import { StripeStrategy } from './strategies/stripe.strategy';
import { PayPalStrategy } from './strategies/paypal.strategy';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private strategies: Map<string, PaymentStrategy> = new Map();

  constructor(
    private readonly stripeStrategy: StripeStrategy,
    private readonly paypalStrategy: PayPalStrategy,
  ) {
    this.strategies.set('stripe', this.stripeStrategy);
    this.strategies.set('paypal', this.paypalStrategy);
  }

  async createPayment(createPaymentDto: CreatePaymentDto): Promise<PaymentResponse> {
    const strategy = this.getStrategy(createPaymentDto.provider);
    
    try {
      const result = await strategy.createPayment(createPaymentDto);
      this.logger.log(`Payment created with ${createPaymentDto.provider}: ${result.paymentId}`);
      return result;
    } catch (error) {
      this.logger.error(`Payment creation failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Payment creation failed: ${error.message}`);
    }
  }

  async getPaymentStatus(paymentId: string, provider: string): Promise<PaymentResponse> {
    const strategy = this.getStrategy(provider);
    
    try {
      return await strategy.getPaymentStatus(paymentId);
    } catch (error) {
      this.logger.error(`Failed to get payment status: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to get payment status: ${error.message}`);
    }
  }

  async refundPayment(
    paymentId: string,
    provider: string,
    amount?: number,
  ): Promise<PaymentResponse> {
    const strategy = this.getStrategy(provider);
    
    try {
      const result = await strategy.refundPayment(paymentId, amount);
      this.logger.log(`Refund processed for payment ${paymentId}`);
      return result;
    } catch (error) {
      this.logger.error(`Refund failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Refund failed: ${error.message}`);
    }
  }

  async handleWebhook(provider: string, payload: any, signature?: string): Promise<void> {
    const strategy = this.getStrategy(provider);
    
    try {
      await strategy.handleWebhook(payload, signature);
      this.logger.log(`Webhook processed for ${provider}`);
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Webhook processing failed: ${error.message}`);
    }
  }

  private getStrategy(provider: string): PaymentStrategy {
    const strategy = this.strategies.get(provider.toLowerCase());
    if (!strategy) {
      throw new BadRequestException(`Payment provider ${provider} not supported`);
    }
    return strategy;
  }
}