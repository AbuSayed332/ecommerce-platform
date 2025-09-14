import { CreatePaymentDto } from '../dto';
import { PaymentResponse } from './payment-response.interface';

export interface PaymentStrategy {
  createPayment(paymentDto: CreatePaymentDto): Promise<PaymentResponse>;
  getPaymentStatus(paymentId: string): Promise<PaymentResponse>;
  refundPayment(paymentId: string, amount?: number): Promise<PaymentResponse>;
  handleWebhook(payload: any, signature?: string): Promise<void>;
}