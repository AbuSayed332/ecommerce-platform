import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({
  timestamps: true,
  collection: 'reviews',
})
export class Review extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  order: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true, trim: true, maxlength: 100 })
  title: string;

  @Prop({ required: true, trim: true, maxlength: 1000 })
  comment: string;

  @Prop({ type: [String], default: [] })
  images?: string[];

  @Prop({ type: String, enum: ReviewStatus, default: ReviewStatus.PENDING })
  status: ReviewStatus;

  @Prop({ default: 0 })
  helpfulCount: number;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  helpfulUsers: Types.ObjectId[];

  @Prop({ default: false })
  isVerifiedPurchase: boolean;

  @Prop({
    type: {
      user: { type: Types.ObjectId, ref: 'User' },
      comment: { type: String, maxlength: 500 },
      createdAt: { type: Date, default: Date.now },
    },
  })
  vendorResponse?: {
    user: Types.ObjectId;
    comment: string;
    createdAt: Date;
  };
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Indexes
ReviewSchema.index({ product: 1 });
ReviewSchema.index({ user: 1 });
ReviewSchema.index({ order: 1 });
ReviewSchema.index({ status: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ createdAt: -1 });
ReviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });
