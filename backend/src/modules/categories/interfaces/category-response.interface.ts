import { Types } from 'mongoose';

export interface CategorySeoResponse {
  title: string;
  description: string;
  keywords: string[];
}

export interface CategoryResponseInterface {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentCategory?: CategoryResponseInterface;
  children?: CategoryResponseInterface[];
  isActive: boolean;
  sortOrder: number;
  seo?: CategorySeoResponse;
  attributes?: string[];
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoriesListResponse {
  categories: CategoryResponseInterface[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CategoryTreeResponse {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
  children: CategoryTreeResponse[];
}

export interface CategoryStatsResponse {
  totalCategories: number;
  activeCategories: number;
  parentCategories: number;
  subcategories: number;
  categoriesWithProducts: number;
  averageProductsPerCategory: number;
}