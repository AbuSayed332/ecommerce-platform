import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document; // Add this line

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
}

@Schema({
  timestamps: true,
  collection: 'products',
})
export class Product extends Document {
  @Prop({ required: true, trim: true, maxlength: 200 })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  slug: string;

  @Prop({ required: true, maxlength: 1000 })
  description: string;

  @Prop({ maxlength: 5000 })
  longDescription?: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ min: 0, default: 0 })
  comparePrice?: number;

  @Prop({ min: 0, default: 0 })
  costPrice?: number;

  @Prop({ required: true, min: 0 })
  stock: number;

  @Prop({ min: 0, default: 1 })
  minStock?: number;

  @Prop({ default: null })
  sku?: string;

  @Prop({ default: null })
  barcode?: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'Category', default: [] })
  subcategories?: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  vendor: Types.ObjectId;

  @Prop({ type: String, enum: ProductStatus, default: ProductStatus.ACTIVE })
  status: ProductStatus;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: false })
  isDigital: boolean;

  @Prop({ min: 0, max: 5, default: 0 })
  averageRating: number;

  @Prop({ min: 0, default: 0 })
  reviewCount: number;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  soldCount: number;

  @Prop({ default: [] })
  tags?: string[];

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        values: [{ type: String, required: true }],
      },
    ],
    default: [],
  })
  attributes?: {
    name: string;
    values: string[];
  }[];

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        values: [
          {
            value: { type: String, required: true },
            priceModifier: { type: Number, default: 0 },
            stockModifier: { type: Number, default: 0 },
          },
        ],
      },
    ],
    default: [],
  })
  variants?: {
    name: string;
    values: {
      value: string;
      priceModifier: number;
      stockModifier: number;
    }[];
  }[];

  @Prop({
    type: {
      weight: { type: Number, min: 0 },
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
    },
  })
  dimensions?: {
    weight: number;
    length: number;
    width: number;
    height: number;
  };

  @Prop({
    type: {
      title: { type: String, maxlength: 60 },
      description: { type: String, maxlength: 160 },
      keywords: [{ type: String }],
    },
  })
  seo?: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Indexes
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ vendor: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ averageRating: -1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ soldCount: -1 });