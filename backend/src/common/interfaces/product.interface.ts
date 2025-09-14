import { Types } from 'mongoose';
import { ProductStatus } from '../../database/schemas/product.schema';
import { IUser } from './user.interface';

export interface IProduct {
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
  category: Types.ObjectId | ICategory;
  subcategories?: Types.ObjectId[] | ICategory[];
  vendor: Types.ObjectId | IUser;
  status: ProductStatus;
  isActive: boolean;
  isFeatured: boolean;
  isDigital: boolean;
  averageRating: number;
  reviewCount: number;
  viewCount: number;
  soldCount: number;
  tags?: string[];
  attributes?: IProductAttribute[];
  variants?: IProductVariant[];
  dimensions?: IProductDimensions;
  seo?: ISeoData;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentCategory?: Types.ObjectId | ICategory;
  isActive: boolean;
  sortOrder: number;
  seo?: ISeoData;
  attributes?: string[];
}

export interface IProductAttribute {
  name: string;
  values: string[];
}

export interface IProductVariant {
  name: string;
  values: IProductVariantValue[];
}

export interface IProductVariantValue {
  value: string;
  priceModifier: number;
  stockModifier: number;
}

export interface IProductDimensions {
  weight: number;
  length: number;
  width: number;
  height: number;
}

export interface ISeoData {
  title: string;
  description: string;
  keywords: string[];
}

export interface IProductFilter {
  category?: Types.ObjectId | string;
  vendor?: Types.ObjectId | string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  status?: ProductStatus;
  tags?: string[];
  search?: string;
}

export interface IProductSort {
  field: 'name' | 'price' | 'createdAt' | 'averageRating' | 'soldCount' | 'viewCount';
  order: 'asc' | 'desc';
}

export interface IPagination {
  page: number;
  limit: number;
  skip: number;
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}