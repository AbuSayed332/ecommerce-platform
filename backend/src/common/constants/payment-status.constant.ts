export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
} as const;

export const PAYMENT_METHOD = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  PAYPAL: 'paypal',
  STRIPE: 'stripe',
  CASH_ON_DELIVERY: 'cash_on_delivery',
  BANK_TRANSFER: 'bank_transfer',
} as const;

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PENDING]: 'Payment Pending',
  [PAYMENT_STATUS.PAID]: 'Payment Completed',
  [PAYMENT_STATUS.FAILED]: 'Payment Failed',
  [PAYMENT_STATUS.REFUNDED]: 'Payment Refunded',
  [PAYMENT_STATUS.PARTIALLY_REFUNDED]: 'Partially Refunded',
} as const;

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHOD.CREDIT_CARD]: 'Credit Card',
  [PAYMENT_METHOD.DEBIT_CARD]: 'Debit Card',
  [PAYMENT_METHOD.PAYPAL]: 'PayPal',
  [PAYMENT_METHOD.STRIPE]: 'Stripe',
  [PAYMENT_METHOD.CASH_ON_DELIVERY]: 'Cash on Delivery',
  [PAYMENT_METHOD.BANK_TRANSFER]: 'Bank Transfer',
} as const;

export const ONLINE_PAYMENT_METHODS = [
  PAYMENT_METHOD.CREDIT_CARD,
  PAYMENT_METHOD.DEBIT_CARD,
  PAYMENT_METHOD.PAYPAL,
  PAYMENT_METHOD.STRIPE,
  PAYMENT_METHOD.BANK_TRANSFER,
] as const;

export const OFFLINE_PAYMENT_METHODS = [
  PAYMENT_METHOD.CASH_ON_DELIVERY,
] as const; 