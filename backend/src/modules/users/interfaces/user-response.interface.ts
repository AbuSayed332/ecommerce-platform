import { Types } from 'mongoose';
import { UserRole, UserStatus } from '../../../database/schemas/user.schema';

export interface UserResponseInterface {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  lastLogin?: Date;
  address?: AddressResponse[];
  dateOfBirth?: Date;
  gender?: string;
  preferences?: string[];
  loyaltyPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddressResponse {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface UserProfileResponse extends UserResponseInterface {
  stats: UserStatsResponse;
}

export interface UserStatsResponse {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  memberSince: Date;
}

export interface UsersListResponse {
  users: UserResponseInterface[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
