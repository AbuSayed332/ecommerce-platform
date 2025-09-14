import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CouponDocument = Coupon & Document;

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Schema({
  timestamps: true,
  collection: 'coupons',
})
export class Coupon extends Document {
  @Prop({ required: true, unique: true, uppercase: true })
  code: string;

  @Prop({ required: true, enum: DiscountType })
  discountType: DiscountType;

  @Prop({ required: true, min: 0 })
  discountValue: number;

  @Prop({ min: 0, default: null })
  maxDiscountAmount?: number;

  @Prop({ min: 0, default: null })
  minimumOrderValue?: number;

  @Prop({ min: 0, default: null })
  usageLimit?: number;

  @Prop({ default: 0, min: 0 })
  usedCount: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
// Indexes
CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ expiresAt: 1 });
CouponSchema.index({ isActive: 1 });