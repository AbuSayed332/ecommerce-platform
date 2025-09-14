import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  CASH_ON_DELIVERY = 'cash_on_delivery',
  BANK_TRANSFER = 'bank_transfer',
}

@Schema({
  timestamps: true,
  collection: 'orders',
})
export class Order extends Document {
  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customer: Types.ObjectId;

  @Prop({
    type: [
      {
        product: { type: Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
        selectedVariants: {
          type: Map,
          of: String,
          default: new Map(),
        },
      },
    ],
    required: true,
  })
  items: {
    product: Types.ObjectId;
    name: string;
    quantity: number;
    price: number;
    total: number;
    selectedVariants: Map<string, string>;
  }[];

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ min: 0, default: 0 })
  tax: number;

  @Prop({ min: 0, default: 0 })
  shipping: number;

  @Prop({
    type: {
      carrier: { type: String },
      trackingNumber: { type: String },
      estimatedDelivery: { type: Date },
      shippedAt: { type: Date },
      deliveredAt: { type: Date },
    },
    default: null,
  })
  shippingDetails?: {
    carrier?: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
    shippedAt?: Date;
    deliveredAt?: Date;
  };

  @Prop({ min: 0, default: 0 })
  discount: number;

  @Prop({ required: true, min: 0 })
  total: number;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop({ type: String, enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod;

  @Prop({ default: null })
  paymentId?: string;

  @Prop({ default: null })
  transactionId?: string;

  @Prop({
    type: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    required: true,
  })
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @Prop({
    type: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
  })
  billingAddress?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @Prop({ type: Types.ObjectId, ref: 'Coupon', default: null })
  appliedCoupon?: Types.ObjectId;

  @Prop({ maxlength: 500 })
  notes?: string;

  @Prop({
    type: [
      {
        status: { type: String, enum: OrderStatus, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, maxlength: 200 },
      },
    ],
    default: [],
  })
  statusHistory: {
    status: OrderStatus;
    timestamp: Date;
    note?: string;
  }[];

  @Prop({
    type: {
      carrier: { type: String },
      trackingNumber: { type: String },
      estimatedDelivery: { type: Date },
      shippedAt: { type: Date },
      deliveredAt: { type: Date },
    },
  })
  shippingInfo?: {
    carrier?: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
    shippedAt?: Date;
    deliveredAt?: Date;
  };

  @Prop({ default: null })
  cancelledAt?: Date;

  @Prop({ maxlength: 500 })
  cancellationReason?: string;

  @Prop({ default: null })
  refundedAt?: Date;

  @Prop({ min: 0, default: 0 })
  refundAmount?: number;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ customer: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ total: 1 });