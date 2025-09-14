export interface CartItemProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
  category: string;
  stock: number;
}

export interface CartItem {
  product: CartItemProduct;
  quantity: number;
  price: number;
  totalPrice: number;
  selectedVariants: Record<string, string>;
}

export interface AppliedCoupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
}

export interface CartResponse {
  id: string;
  userId: string;
  __v?: number;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  appliedCoupon?: AppliedCoupon | null;
  lastModified: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartSummary {
  itemCount: number;
  totalQuantity: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  appliedCoupon?: {
    code: string;
    discountValue: number;
  };
}
