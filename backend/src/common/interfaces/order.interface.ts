import { Types } from 'mongoose';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../../database/schemas/order.schema';
import { IUser } from './user.interface';
import { IProduct } from './product.interface';

export interface IOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  customer: Types.ObjectId | IUser;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentId?: string;
  transactionId?: string;
  shippingAddress: IOrderAddress;
  billingAddress?: IOrderAddress;
  appliedCoupon?: Types.ObjectId | ICoupon;
  notes?: string;
  statusHistory: IOrderStatusHistory[];
  shippingDetails?: IOrderShipping;
  cancelledAt?: Date;
  cancellationReason?: string;
  refundedAt?: Date;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItem {
  product: Types.ObjectId | IProduct;
  name: string;
  quantity: number;
  price: number;
  total: number;
  selectedVariants: Map<string, string>;
}

export interface IOrderAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface IOrderStatusHistory {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
}

export interface IOrderShipping {
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export interface ICoupon {
  _id: Types.ObjectId;
  code: string;
  name: string;
  description?: string;
  type: string;
  value: number;
  minimumAmount?: number;
  maximumDiscount?: number;
  startDate: Date;
  endDate: Date;
  usageLimit?: number;
  usageCount: number;
}

export interface IOrderFilter {
  customer?: Types.ObjectId | string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  dateFrom?: Date;
  dateTo?: Date;
  minTotal?: number;
  maxTotal?: number;
}

export interface IOrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

export interface ICreateOrderRequest {
  items: {
    product: Types.ObjectId;
    quantity: number;
    selectedVariants?: Record<string, string>;
  }[];
  shippingAddress: IOrderAddress;
  billingAddress?: IOrderAddress;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  notes?: string;
}

export interface IUpdateOrderStatusRequest {
  status: OrderStatus;
  note?: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: Date;
}