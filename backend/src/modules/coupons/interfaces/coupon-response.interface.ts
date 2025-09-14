export interface CouponResponse {
  success: boolean;
  data: Coupon;
  message?: string;
}

export interface CouponListResponse {
  success: boolean;
  data: Coupon[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CouponValidationResult {
  isValid: boolean;
  message: string;
  coupon?: Coupon;
  discountAmount?: number;
  finalAmount?: number;
  applicableProducts?: string[];
  excludedProducts?: string[];
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  maxOrderAmount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  usageCount: number;
  startsAt?: Date;
  expiresAt?: Date;
  status: CouponStatus;
  userId?: string;
  stackable: boolean;
  applicableCategories?: string[];
  excludedCategories?: string[];
  applicableProducts?: string[];
  excludedProducts?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

export enum CouponStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  EXHAUSTED = 'exhausted',
}

export enum CouponType {
  GENERAL = 'general',
  FIRST_ORDER = 'first_order',
  LOYALTY = 'loyalty',
  SEASONAL = 'seasonal',
  USER_SPECIFIC = 'user_specific',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_SHIPPING = 'free_shipping',
}

export interface CouponUsageStats {
  couponId: string;
  code: string;
  usageCount: number;
  usageLimit?: number;
  remainingUses?: number;
  usagePercentage?: number;
  status: CouponStatus;
  createdAt: Date;
  lastUsedAt?: Date;
}