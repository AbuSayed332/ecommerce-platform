import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStrategy } from '../interfaces/payment-strategy.interface';
import { CreatePaymentDto } from '../dto';
import { PaymentResponse, PaymentStatus } from '../interfaces';

@Injectable()
export class PayPalStrategy implements PaymentStrategy {
  private readonly logger = new Logger(PayPalStrategy.name);
  private readonly baseUrl: string;
  private accessToken: string;
  private tokenExpiresAt: number;

  constructor(private configService: ConfigService) {
    const environment = this.configService.get<string>('PAYPAL_ENVIRONMENT', 'sandbox');
    this.baseUrl = environment === 'production' 
      ? 'https://api.paypal.com' 
      : 'https://api.sandbox.paypal.com';
  }

  async createPayment(paymentDto: CreatePaymentDto): Promise<PaymentResponse> {
    try {
      await this.ensureAccessToken();

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: paymentDto.currency,
            value: paymentDto.amount.toFixed(2),
          },
          description: paymentDto.description,
        }],
        application_context: {
          return_url: paymentDto.successUrl || 'https://your-app.com/success',
          cancel_url: paymentDto.cancelUrl || 'https://your-app.com/cancel',
        },
      };

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(orderData),
      });

      const order = await response.json();

      if (!response.ok) {
        throw new Error(`PayPal API error: ${order.error_description || order.message}`);
      }

      const approvalUrl = order.links?.find((link: any) => link.rel === 'approve')?.href;

      return {
        success: true,
        paymentId: order.id,
        status: this.mapPayPalStatus(order.status),
        amount: paymentDto.amount,
        currency: paymentDto.currency,
        checkoutUrl: approvalUrl,
        providerResponse: order,
      };
    } catch (error) {
      this.logger.error('PayPal payment creation failed', error);
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
      await this.ensureAccessToken();

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      const order = await response.json();

      if (!response.ok) {
        throw new Error(`PayPal API error: ${order.error_description || order.message}`);
      }

      return {
        success: true,
        paymentId: order.id,
        status: this.mapPayPalStatus(order.status),
        amount: parseFloat(order.purchase_units[0]?.amount?.value || '0'),
        currency: order.purchase_units[0]?.amount?.currency_code,
        providerResponse: order,
      };
    } catch (error) {
      this.logger.error('Failed to retrieve PayPal payment status', error);
      throw error;
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<PaymentResponse> {
    try {
      await this.ensureAccessToken();

      // First, get the capture ID from the order
      const orderResponse = await fetch(`${this.baseUrl}/v2/checkout/orders/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      const order = await orderResponse.json();
      const captureId = order.purchase_units[0]?.payments?.captures?.[0]?.id;

      if (!captureId) {
        throw new Error('No capture found for this payment');
      }

      const refundData: any = {};
      if (amount) {
        refundData.amount = {
          value: amount.toFixed(2),
          currency_code: order.purchase_units[0].amount.currency_code,
        };
      }

      const response = await fetch(`${this.baseUrl}/v2/payments/captures/${captureId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(refundData),
      });

      const refund = await response.json();

      if (!response.ok) {
        throw new Error(`PayPal refund error: ${refund.error_description || refund.message}`);
      }

      return {
        success: true,
        paymentId: paymentId,
        status: PaymentStatus.REFUNDED,
        amount: parseFloat(refund.amount?.value || '0'),
        currency: refund.amount?.currency_code,
        providerResponse: refund,
      };
    } catch (error) {
      this.logger.error('PayPal refund failed', error);
      throw error;
    }
  }

  async handleWebhook(payload: any): Promise<void> {
    try {
      this.logger.log(`Received PayPal webhook: ${payload.event_type}`);

      switch (payload.event_type) {
        case 'CHECKOUT.ORDER.APPROVED':
          await this.handleOrderApproved(payload.resource);
          break;
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handlePaymentCompleted(payload.resource);
          break;
        // Add more event types as needed
        default:
          this.logger.warn(`Unhandled PayPal webhook event: ${payload.event_type}`);
      }
    } catch (error) {
      this.logger.error('PayPal webhook processing failed', error);
      throw error;
    }
  }

  private async ensureAccessToken(): Promise<void> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return;
    }

    const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials are not configured');
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to get PayPal access token: ${data.error_description}`);
    }

    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early
  }

  private mapPayPalStatus(paypalStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'CREATED': PaymentStatus.PENDING,
      'SAVED': PaymentStatus.PENDING,
      'APPROVED': PaymentStatus.PROCESSING,
      'VOIDED': PaymentStatus.CANCELLED,
      'COMPLETED': PaymentStatus.COMPLETED,
      'PAYER_ACTION_REQUIRED': PaymentStatus.PENDING,
    };

    return statusMap[paypalStatus] || PaymentStatus.FAILED;
  }

  private async handleOrderApproved(resource: any): Promise<void> {
    this.logger.log(`PayPal order approved: ${resource.id}`);
    // Add your business logic here
  }

  private async handlePaymentCompleted(resource: any): Promise<void> {
    this.logger.log(`PayPal payment completed: ${resource.id}`);
    // Add your business logic here
  }
}