import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CartDocument = Cart & Document & {
  updatedAt?: Date;
};

@Schema({
  timestamps: true,
  collection: 'carts',
})
export class Cart extends Document {
  __v?: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({
    type: [
      {
        product: { type: Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
        selectedVariants: {
          type: Map,
          of: String,
          default: new Map(),
        },
      },
    ],
    default: [],
  })
  items: {
    product: Types.ObjectId;
    quantity: number;
    price: number;
    selectedVariants: Map<string, string>;
  }[];

  @Prop({ min: 0, default: 0 })
  subtotal: number;

  @Prop({ min: 0, default: 0 })
  tax: number;

  @Prop({ min: 0, default: 0 })
  shipping: number;

  @Prop({ min: 0, default: 0 })
  discount: number;

  @Prop({ min: 0, default: 0 })
  total: number;

  @Prop({ type: Types.ObjectId, ref: 'Coupon', default: null })
  appliedCoupon?: Types.ObjectId;

  @Prop({ default: Date.now })
  lastModified: Date;

  @Prop({ default: null })
  expiresAt?: Date;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

// Indexes
CartSchema.index({ user: 1 }, { unique: true });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
CartSchema.index({ lastModified: 1 });