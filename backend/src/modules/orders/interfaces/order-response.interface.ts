import { Types } from 'mongoose';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../../../database/schemas/order.schema';

export interface OrderItemResponse {
  product: {
    _id: Types.ObjectId;
    name: string;
    slug: string;
    image?: string;
    price: number;
  };
  name: string;
  quantity: number;
  price: number;
  total: number;
  selectedVariants: Record<string, string>;
}

export interface OrderAddressResponse {
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

export interface OrderStatusHistoryResponse {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
}

export interface OrderShippingResponse {
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export interface CouponResponse {
  _id: Types.ObjectId;
  code: string;
  name: string;
  value: number;
  type: string;
}

export interface CustomerResponse {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
}

// export interface OrderResponseInterface {
//   _id: Types.ObjectId;
//   orderNumber: string;
//   customer: CustomerResponse;
//   items: OrderItemResponse[];
//   subtotal: number;
//   tax: number;
//   shipping: number;
//   discount: number;
//   total: number;
//   status: OrderStatus;
//   paymentStatus: PaymentStatus;
//   paymentMethod: PaymentMethod;
//   paymentId?: string;
//   transactionId?: string;
//   shippingAddress: OrderAddressResponse;
//   billingAddress?: OrderAddressResponse;
//   appliedCoupon?: CouponResponse;
//   notes?: string;
//   statusHistory: OrderStatusHistoryResponse[];
//   shipping?: OrderShippingResponse;
//   cancelledAt?: Date;
//   cancellationReason?: string;
//   refundedAt?: Date;
//   refundAmount?: number;
//   createdAt: Date;
//   updatedAt: Date;
// }

export interface OrderResponseInterface {
  _id: Types.ObjectId;
  orderNumber: string;
  customer: CustomerResponse;
  items: OrderItemResponse[];
  subtotal: number;
  tax: number;
  shippingCost: number;                      // renamed
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentId?: string;
  transactionId?: string;
  shippingAddress: OrderAddressResponse;
  billingAddress?: OrderAddressResponse;
  appliedCoupon?: CouponResponse;
  notes?: string;
  statusHistory: OrderStatusHistoryResponse[];
  shipping?: OrderShippingResponse;          // shipping metadata
  cancelledAt?: Date;
  cancellationReason?: string;
  refundedAt?: Date;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrdersListResponse {
  orders: OrderResponseInterface[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  summary: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
}

export interface OrderStatsResponse {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByPaymentStatus: Record<PaymentStatus, number>;
  ordersByPaymentMethod: Record<PaymentMethod, number>;
  recentOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
}