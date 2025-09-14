import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'categories',
})
export class Category extends Document {
  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  slug: string;

  @Prop({ trim: true, maxlength: 500 })
  description?: string;

  @Prop({ default: null })
  image?: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  parentCategory?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0, min: 0 })
  sortOrder: number;

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

  @Prop({ default: [] })
  attributes?: string[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Indexes
CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ name: 1 });
CategorySchema.index({ parentCategory: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ sortOrder: 1 });