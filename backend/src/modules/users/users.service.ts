// import {
//   Injectable,
//   NotFoundException,
//   ConflictException,
//   BadRequestException,
//   ForbiddenException,
// } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model, Types } from 'mongoose';
// import { User, UserRole, UserStatus } from '../../database/schemas/user.schema';
// import { Order } from '../../database/schemas/order.schema';
// import { CreateUserDto, UpdateUserDto, UpdateProfileDto } from './dto';
// import { UserResponseInterface, UserProfileResponse, UserStatsResponse } from './interfaces';
// import { PasswordUtil } from '../../common/utils';

// export interface UserQueryOptions {
//   page?: number;
//   limit?: number;
//   role?: UserRole;
//   status?: UserStatus;
//   search?: string;
//   sortBy?: 'createdAt' | 'firstName' | 'lastName' | 'email' | 'lastLogin';
//   sortOrder?: 'asc' | 'desc';
//   isEmailVerified?: boolean;
// }

// @Injectable()
// export class UsersService {
//   constructor(
//     @InjectModel(User.name) private userModel: Model<User>,
//     @InjectModel(Order.name) private orderModel: Model<Order>,
//   ) {}

//   async create(createUserDto: CreateUserDto): Promise<UserResponseInterface> {
//     // Check if user already exists
//     const existingUser = await this.userModel.findOne({
//       email: createUserDto.email,
//     });

//     if (existingUser) {
//       throw new ConflictException('User with this email already exists');
//     }

//     // Hash password
//     const hashedPassword = await PasswordUtil.hashPassword(createUserDto.password);

//     // Create user
//     const user = new this.userModel({
//       ...createUserDto,
//       password: hashedPassword,
//     });

//     await user.save();
//     return this.formatUserResponse(user);
//   }

//   async findAll(options: UserQueryOptions = {}) {
//     const {
//       page = 1,
//       limit = 10,
//       role,
//       status,
//       search,
//       sortBy = 'createdAt',
//       sortOrder = 'desc',
//       isEmailVerified,
//     } = options;

//     const filter: any = {};

//     // Apply filters
//     if (role) filter.role = role;
//     if (status) filter.status = status;
//     if (typeof isEmailVerified === 'boolean') filter.isEmailVerified = isEmailVerified;

//     // Search in firstName, lastName, email
//     if (search) {
//       filter.$or = [
//         { firstName: { $regex: search, $options: 'i' } },
//         { lastName: { $regex: search, $options: 'i' } },
//         { email: { $regex: search, $options: 'i' } },
//       ];
//     }

//     const skip = (page - 1) * limit;
//     const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

//     const [users, total] = await Promise.all([
//       this.userModel
//         .find(filter)
//         .select('-password -emailVerificationToken -passwordResetToken')
//         .sort(sort)
//         .skip(skip)
//         .limit(limit)
//         .lean(),
//       this.userModel.countDocuments(filter),
//     ]);

//     return {
//       users: users.map(user => this.formatUserResponse(user)),
//       pagination: {
//         page,
//         limit,
//         total,
//         pages: Math.ceil(total / limit),
//         hasNext: skip + limit < total,
//         hasPrev: page > 1,
//       },
//     };
//   }

//   async findById(id: Types.ObjectId): Promise<UserResponseInterface> {
//     const user = await this.userModel
//       .findById(id)
//       .select('-password -emailVerificationToken -passwordResetToken')
//       .lean();

//     if (!user) {
//       throw new NotFoundException('User not found');
//     }

//     return this.formatUserResponse(user);
//   }

//   async findByEmail(email: string): Promise<User | null> {
//     return this.userModel.findOne({ email }).lean();
//   }

//   async getProfile(userId: Types.ObjectId): Promise<UserProfileResponse> {
//     const user = await this.userModel
//       .findById(userId)
//       .select('-password -emailVerificationToken -passwordResetToken')
//       .lean();

//     if (!user) {
//       throw new NotFoundException('User not found');
//     }

//     const stats = await this.getUserStats(userId);

//     return {
//       ...this.formatUserResponse(user),
//       stats,
//     };
//   }

//   async update(
//     id: Types.ObjectId,
//     updateUserDto: UpdateUserDto,
//     currentUser: User,
//   ): Promise<UserResponseInterface> {
//     const user = await this.userModel.findById(id);

//     if (!user) {
//       throw new NotFoundException('User not found');
//     }

//     // Check permissions
//     if (currentUser.role !== UserRole.ADMIN && currentUser._id.toString() !== id.toString()) {
//       throw new ForbiddenException('You can only update your own profile');
//     }

//     // Admin-only fields
//     if (currentUser.role !== UserRole.ADMIN) {
//       delete updateUserDto.status;
//       delete updateUserDto.role;
//       delete updateUserDto.isEmailVerified;
//       delete updateUserDto.loyaltyPoints;
//     }

//     // Update user
//     Object.assign(user, updateUserDto);
//     await user.save();

//     return this.formatUserResponse(user);
//   }

//   async updateProfile(
//     userId: Types.ObjectId,
//     updateProfileDto: UpdateProfileDto,
//   ): Promise<UserResponseInterface> {
//     const user = await this.userModel.findById(userId);

//     if (!user) {
//       throw new NotFoundException('User not found');
//     }

//     // Handle password change
//     if (updateProfileDto.newPassword) {
//       if (!updateProfileDto.currentPassword) {
//         throw new BadRequestException('Current password is required to change password');
//       }

//       const isCurrentPasswordValid = await PasswordUtil.comparePassword(
//         updateProfileDto.currentPassword,
//         user.password,
//       );

//       if (!isCurrentPasswordValid) {
//         throw new BadRequestException('Current password is incorrect');
//       }

//       updateProfileDto.password = await PasswordUtil.hashPassword(updateProfileDto.newPassword);
//       delete updateProfileDto.newPassword;
//       delete updateProfileDto.currentPassword;
//     }

//     // Update user profile
//     Object.assign(user, updateProfileDto);
//     await user.save();

//     return this.formatUserResponse(user);
//   }

//   async remove(id: Types.ObjectId, currentUser: User): Promise<void> {
//     if (currentUser.role !== UserRole.ADMIN) {
//       throw new ForbiddenException('Only admins can delete users');
//     }

//     const user = await this.userModel.findById(id);

//     if (!user) {
//       throw new NotFoundException('User not found');
//     }

//     // Prevent deleting admin users
//     if (user.role === UserRole.ADMIN && currentUser._id.toString() !== id.toString()) {
//       throw new ForbiddenException('Cannot delete other admin users');
//     }

//     // Soft delete by updating status
//     user.status = UserStatus.INACTIVE;
//     await user.save();
//   }

//   async verifyEmail(userId: Types.ObjectId): Promise<void> {
//     const user = await this.userModel.findById(userId);

//     if (!user) {
//       throw new NotFoundException('User not found');
//     }

//     user.isEmailVerified = true;
//     user.emailVerificationToken = undefined;
//     await user.save();
//   }

//   async updateLastLogin(userId: Types.ObjectId): Promise<void> {
//     await this.userModel.findByIdAndUpdate(userId, {
//       lastLogin: new Date(),
//     });
//   }

//   async addLoyaltyPoints(userId: Types.ObjectId, points: number): Promise<void> {
//     await this.userModel.findByIdAndUpdate(userId, {
//       $inc: { loyaltyPoints: points },
//     });
//   }

//   async getUserStats(userId: Types.ObjectId): Promise<UserStatsResponse> {
//     const user = await this.userModel.findById(userId);
    
//     if (!user) {
//       throw new NotFoundException('User not found');
//     }

//     // Get order statistics
//     const orderStats = await this.orderModel.aggregate([
//       { $match: { customer: userId } },
//       {
//         $group: {
//           _id: null,
//           totalOrders: { $sum: 1 },
//           totalSpent: { $sum: '$total' },
//           lastOrderDate: { $max: '$createdAt' },
//         },
//       },
//     ]);

//     const stats = orderStats[0] || {
//       totalOrders: 0,
//       totalSpent: 0,
//       lastOrderDate: null,
//     };

//     return {
//       totalOrders: stats.totalOrders,
//       totalSpent: stats.totalSpent,
//       averageOrderValue: stats.totalOrders > 0 ? stats.totalSpent / stats.totalOrders : 0,
//       lastOrderDate: stats.lastOrderDate,
//       memberSince: user.createdAt,
//     };
//   }

//   private formatUserResponse(user: any): UserResponseInterface {
//     const { password, emailVerificationToken, passwordResetToken, ...userResponse } = user;
    
//     return {
//       ...userResponse,
//       _id: user._id || user.id,
//       fullName: `${user.firstName} ${user.lastName}`,
//     };
//   }
// }

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Document, SortOrder } from 'mongoose';
import { User, UserRole, UserStatus } from '../../database/schemas/user.schema';
import { Order } from '../../database/schemas/order.schema';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto } from './dto';
import { UserResponseInterface } from './interfaces';

export interface UserStatsResponse {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  memberSince: Date;
}
import { PasswordUtil } from '../../common/utils';
import { UserProfileResponse } from './interfaces/user-response.interface';

export interface UserQueryOptions {
  page?: number;
  limit?: number;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  sortBy?: 'createdAt' | 'firstName' | 'lastName' | 'email' | 'lastLogin';
  sortOrder?: 'asc' | 'desc';
  isEmailVerified?: boolean;
}

type MongooseUser = User & Document;
type MongooseOrder = Order & Document;

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<MongooseUser>,
    @InjectModel(Order.name) private orderModel: Model<MongooseOrder>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseInterface> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await PasswordUtil.hashPassword(createUserDto.password);

    // Create user
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    await user.save();
    return this.formatUserResponse(user);
  }

  async findAll(options: UserQueryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      role,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isEmailVerified,
    } = options;

    const filter: any = {};

    // Apply filters
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (typeof isEmailVerified === 'boolean') filter.isEmailVerified = isEmailVerified;

    // Search in firstName, lastName, email
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sort: { [key: string]: SortOrder } = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password -emailVerificationToken -passwordResetToken')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(), // using lean for performance — results are plain objects
      this.userModel.countDocuments(filter),
    ]);

    return {
      users: users.map((u: any) => this.formatUserResponse(u)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  // Accept string or ObjectId to be flexible
  async findById(id: string | Types.ObjectId): Promise<UserResponseInterface> {
    const user = await this.userModel
      .findById(id)
      .select('-password -emailVerificationToken -passwordResetToken')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.formatUserResponse(user);
  }

  // Return the document form (not lean) so callers who rely on instance methods still work.
  async findByEmail(email: string): Promise<MongooseUser | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async getProfile(userId: string | Types.ObjectId): Promise<UserProfileResponse> {
    const user = await this.userModel
      .findById(userId)
      .select('-password -emailVerificationToken -passwordResetToken')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const stats = await this.getUserStats(userId);

    return {
      ...this.formatUserResponse(user),
      stats,
    };
  }

  async update(
    id: string | Types.ObjectId,
    updateUserDto: UpdateUserDto,
    currentUser: MongooseUser,
  ): Promise<UserResponseInterface> {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check permissions
    if (
      currentUser.role !== UserRole.ADMIN &&
      ((currentUser._id as Types.ObjectId | string).toString() !== id.toString())
    ) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Admin-only fields
    if (currentUser.role !== UserRole.ADMIN) {
      // remove admin only fields if present on DTO
      // using `delete` is fine here because DTO is a plain object at runtime
      // tslint:disable-next-line: no-dynamic-delete
      delete (updateUserDto as any).status;
      // tslint:disable-next-line: no-dynamic-delete
      delete (updateUserDto as any).role;
      // tslint:disable-next-line: no-dynamic-delete
      delete (updateUserDto as any).isEmailVerified;
      // tslint:disable-next-line: no-dynamic-delete
      delete (updateUserDto as any).loyaltyPoints;
    }

    // Update user
    Object.assign(user, updateUserDto);
    await user.save();

    // Return sanitized response
    return this.formatUserResponse(user);
  }

  async updateProfile(
    userId: string | Types.ObjectId,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseInterface> {
    const user = await this.userModel.findById(userId).select('+password');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Handle password change
    if ((updateProfileDto as any).newPassword) {
      // Case 1: User already has a password and wants to change it
      if (user.password) {
        if (!(updateProfileDto as any).currentPassword) {
          throw new BadRequestException('Current password is required to change your password.');
        }

        const isCurrentPasswordValid = await PasswordUtil.comparePassword(
          (updateProfileDto as any).currentPassword,
          user.password,
        );

        if (!isCurrentPasswordValid) {
          throw new BadRequestException('Current password is incorrect.');
        }
      }
      // Case 2: User (likely OAuth) is setting a password for the first time.
      else if ((updateProfileDto as any).currentPassword) {
        throw new BadRequestException(
          'You are setting a password for the first time, current password should not be provided.',
        );
      }

      // If all checks pass, hash and set the new password.
      user.password = await PasswordUtil.hashPassword((updateProfileDto as any).newPassword);
      delete (updateProfileDto as any).newPassword;
      delete (updateProfileDto as any).currentPassword;
    }

    // Update user profile (merge safe props)
    Object.assign(user, updateProfileDto);
    await user.save();

    return this.formatUserResponse(user);
  }

  async remove(id: string | Types.ObjectId, currentUser: MongooseUser): Promise<void> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete users');
    }

    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent deleting admin users (unless self-delete)
    if (
      user.role === UserRole.ADMIN &&
      (currentUser._id as Types.ObjectId | string).toString() !== id.toString()
    ) {
      throw new ForbiddenException('Cannot delete other admin users');
    }

    // Soft delete by updating status
    user.status = UserStatus.INACTIVE;
    await user.save();
  }

  async verifyEmail(userId: string | Types.ObjectId): Promise<void> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isEmailVerified = true;
    // remove token
    (user as any).emailVerificationToken = undefined;
    await user.save();
  }

  async updateLastLogin(userId: string | Types.ObjectId): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      lastLogin: new Date(),
    }).exec();
  }

  async addLoyaltyPoints(userId: string | Types.ObjectId, points: number): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $inc: { loyaltyPoints: points },
    }).exec();
  }

  async getUserStats(userId: string | Types.ObjectId): Promise<UserStatsResponse> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get order statistics
    const orderStats = await this.orderModel.aggregate([
      { $match: { customer: new Types.ObjectId(userId) } }, // ensure correct ObjectId type for aggregation match
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          lastOrderDate: { $max: '$createdAt' },
        },
      },
    ]);

    const stats = orderStats[0] || {
      totalOrders: 0,
      totalSpent: 0,
      lastOrderDate: undefined,
    };

    return {
      totalOrders: stats.totalOrders,
      totalSpent: stats.totalSpent,
      averageOrderValue: stats.totalOrders > 0 ? stats.totalSpent / stats.totalOrders : 0,
      lastOrderDate: stats.lastOrderDate,
      memberSince: (user as any).createdAt,
    } as UserStatsResponse;
  }

  private formatUserResponse(user: any): UserResponseInterface {
    // Accept either a Mongoose Document or a plain object from .lean()
    const u = user?.toObject ? user.toObject() : user;

    // Remove sensitive fields if present
    const { password, emailVerificationToken, passwordResetToken, ...rest } = u || {};

    return {
      ...rest,
      _id: u._id || u.id,
      fullName: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
    } as UserResponseInterface;
  }
}
