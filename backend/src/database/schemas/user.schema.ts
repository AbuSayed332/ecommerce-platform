import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User extends Document {
  @Prop({ required: true, trim: true, maxlength: 50 })
  firstName: string;

  @Prop({ required: true, trim: true, maxlength: 50 })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: false, minlength: 6 })
  password?: string;

  @Prop({ trim: true, maxlength: 15 })
  phone?: string;

  @Prop({ default: null })
  picture?: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: null })
  emailVerificationToken?: string;

  @Prop({ default: null })
  passwordResetToken?: string;

  @Prop({ default: null })
  passwordResetExpires?: Date;

  @Prop({ default: Date.now })
  lastLogin?: Date;

  @Prop({ type: String, required: false })
  provider?: string;

  @Prop({ type: String, required: false })
  providerId?: string;

  @Prop({
    type: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true },
      isDefault: { type: Boolean, default: false },
    },
  })
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
  }[];

  @Prop({ default: null })
  dateOfBirth?: Date;

  @Prop({ type: String, enum: ['male', 'female', 'other'] })
  gender?: string;

  @Prop({ default: [] })
  preferences?: string[];

  @Prop({ default: 0 })
  loyaltyPoints: number;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});