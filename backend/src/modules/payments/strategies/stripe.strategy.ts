import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentStrategy } from '../interfaces/payment-strategy.interface';
import { CreatePaymentDto } from '../dto';
import { PaymentResponse, PaymentStatus } from '../interfaces';

@Injectable()
export class StripeStrategy implements PaymentStrategy {
  private readonly logger = new Logger(StripeStrategy.name);
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-08-27.basil',
    });
  }

  async createPayment(paymentDto: CreatePaymentDto): Promise<PaymentResponse> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(paymentDto.amount * 100), // Convert to cents
        currency: paymentDto.currency.toLowerCase(),
        description: paymentDto.description,
        customer: paymentDto.customerId,
        receipt_email: paymentDto.customerEmail,
        metadata: paymentDto.metadata || {},
      });

      return {
        success: true,
        paymentId: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        // todo: handle undefined case
        clientSecret: paymentIntent.client_secret || '',
        providerResponse: paymentIntent,
      };
    } catch (error) {
      this.logger.error('Stripe payment creation failed', error);
      return {
        success: false,
        paymentId: '',
        status: PaymentStatus.FAILED,
        message: error.message,
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);

      return {
        success: true,
        paymentId: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        providerResponse: paymentIntent,
      };
    } catch (error) {
      this.logger.error('Failed to retrieve Stripe payment status', error);
      throw error;
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<PaymentResponse> {
    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: paymentId,
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      const refund = await this.stripe.refunds.create(refundData);

      return {
        success: true,
        paymentId: refund.payment_intent as string,
        status: PaymentStatus.REFUNDED,
        amount: refund.amount / 100,
        currency: refund.currency?.toUpperCase(),
        providerResponse: refund,
      };
    } catch (error) {
      this.logger.error('Stripe refund failed', error);
      throw error;
    }
  }

  async handleWebhook(payload: any, signature: string): Promise<void> {
    const endpointSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    
    if (!endpointSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        endpointSecret,
      );

      this.logger.log(`Received Stripe webhook: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        // Add more event types as needed
        default:
          this.logger.warn(`Unhandled Stripe webhook event: ${event.type}`);
      }
    } catch (error) {
      this.logger.error('Stripe webhook verification failed', error);
      throw error;
    }
  }

  private mapStripeStatus(stripeStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'requires_payment_method': PaymentStatus.PENDING,
      'requires_confirmation': PaymentStatus.PENDING,
      'requires_action': PaymentStatus.PENDING,
      'processing': PaymentStatus.PROCESSING,
      'requires_capture': PaymentStatus.PROCESSING,
      'succeeded': PaymentStatus.COMPLETED,
      'canceled': PaymentStatus.CANCELLED,
    };

    return statusMap[stripeStatus] || PaymentStatus.FAILED;
  }

  private async handlePaymentSuccess(paymentIntent: any): Promise<void> {
    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);
    // Add your business logic here (update database, send notifications, etc.)
  }

  private async handlePaymentFailed(paymentIntent: any): Promise<void> {
    this.logger.log(`Payment failed: ${paymentIntent.id}`);
    // Add your business logic here
  }
}