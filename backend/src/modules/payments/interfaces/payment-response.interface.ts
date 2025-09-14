export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  status: PaymentStatus;
  amount?: number;
  currency?: string;
  checkoutUrl?: string;
  clientSecret?: string;
  message?: string;
  metadata?: Record<string, any>;
  providerResponse?: any;
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}