import { Types } from 'mongoose';
import { UserRole, UserStatus } from '../../database/schemas/user.schema';

export interface IUser {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  lastLogin?: Date;
  address?: IAddress[];
  dateOfBirth?: Date;
  gender?: string;
  preferences?: string[];
  loyaltyPoints: number;
  createdAt: Date;
  updatedAt: Date;
  fullName: string;
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface IUserProfile {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: IAddress[];
  preferences?: string[];
  loyaltyPoints: number;
  fullName: string;
}

export interface IUserStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  loyaltyPoints: number;
  lastOrderDate?: Date;
  registrationDate: Date;
}

export interface ICreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

export interface IUpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: IAddress[];
  preferences?: string[];
}

export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}