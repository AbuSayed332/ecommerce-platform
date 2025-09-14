import { Types } from 'mongoose';
import { ProductStatus } from '../../../database/schemas/product.schema';

export interface ProductAttributeResponse {
  name: string;
  values: string[];
}

export interface ProductVariantValueResponse {
  value: string;
  priceModifier: number;
  stockModifier: number;
}

export interface ProductVariantResponse {
  name: string;
  values: ProductVariantValueResponse[];
}

export interface ProductDimensionsResponse {
  weight: number;
  length: number;
  width: number;
  height: number;
}

export interface SeoDataResponse {
  title: string;
  description: string;
  keywords: string[];
}

export interface CategoryResponse {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  image?: string;
}

export interface VendorResponse {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ProductResponseInterface {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  stock: number;
  minStock?: number;
  sku?: string;
  barcode?: string;
  images: string[];
  category: CategoryResponse;
  subcategories?: CategoryResponse[];
  vendor: VendorResponse;
  status: ProductStatus;
  isActive: boolean;
  isFeatured: boolean;
  isDigital: boolean;
  averageRating: number;
  reviewCount: number;
  viewCount: number;
  soldCount: number;
  tags?: string[];
  attributes?: ProductAttributeResponse[];
  variants?: ProductVariantResponse[];
  dimensions?: ProductDimensionsResponse;
  seo?: SeoDataResponse;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductsListResponse {
  products: ProductResponseInterface[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    categories: CategoryResponse[];
    priceRange: {
      min: number;
      max: number;
    };
    availableTags: string[];
  };
}

export interface ProductStatsResponse {
  totalProducts: number;
  activeProducts: number;
  featuredProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  averagePrice: number;
  totalValue: number;
}
