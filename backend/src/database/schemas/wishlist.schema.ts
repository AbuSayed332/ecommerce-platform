import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'wishlists',
})
export class Wishlist extends Document {
  static populate(arg0: string, arg1: string) {
    throw new Error('Method not implemented.');
  }
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 100, default: 'My Wishlist' })
  name: string;

  @Prop({ trim: true, maxlength: 500 })
  description?: string;

  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  products: Types.ObjectId[];

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: Date.now })
  lastModified: Date;
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);

// Indexes
WishlistSchema.index({ user: 1 });
WishlistSchema.index({ user: 1, isDefault: 1 });
WishlistSchema.index({ isPublic: 1 });
WishlistSchema.index({ lastModified: -1 });