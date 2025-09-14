import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { CreateCouponDto, ValidateCouponDto } from './dto';
import {
  CouponResponse,
  CouponValidationResult,
  CouponListResponse,
  CouponStatus,
  CouponType,
  DiscountType,
} from './interfaces';

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);
  private coupons: Map<string, any> = new Map(); // In-memory storage, replace with database

  async createCoupon(createCouponDto: CreateCouponDto): Promise<CouponResponse> {
    try {
      // Check if coupon code already exists
      const existingCoupon = Array.from(this.coupons.values()).find(
        (coupon) => coupon.code === createCouponDto.code,
      );

      if (existingCoupon) {
        throw new ConflictException(`Coupon with code ${createCouponDto.code} already exists`);
      }

      // Validate discount configuration
      this.validateDiscountConfiguration(createCouponDto);

      const coupon = {
        id: this.generateId(),
        ...createCouponDto,
        status: CouponStatus.ACTIVE,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.coupons.set(coupon.id, coupon);

      this.logger.log(`Coupon created: ${coupon.code} (${coupon.id})`);

      return {
        success: true,

        data: {
    ...coupon,
    stackable: coupon.stackable ?? false, // Use nullish coalescing operator
  },
        message: 'Coupon created successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to create coupon: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAllCoupons(filters: {
    page: number;
    limit: number;
    status?: string;
    type?: string;
    search?: string;
  }): Promise<CouponListResponse> {
    try {
      let coupons = Array.from(this.coupons.values());

      // Apply filters
      if (filters.status) {
        coupons = coupons.filter((coupon) => coupon.status === filters.status);
      }

      if (filters.type) {
        coupons = coupons.filter((coupon) => coupon.type === filters.type);
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        coupons = coupons.filter(
          (coupon) =>
            coupon.code.toLowerCase().includes(searchTerm) ||
            coupon.name.toLowerCase().includes(searchTerm) ||
            coupon.description?.toLowerCase().includes(searchTerm),
        );
      }

      // Sort by creation date (newest first)
      coupons.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Pagination
      const total = coupons.length;
      const startIndex = (filters.page - 1) * filters.limit;
      const endIndex = startIndex + filters.limit;
      const paginatedCoupons = coupons.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedCoupons,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get coupons: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getCouponById(id: string): Promise<CouponResponse> {
    const coupon = this.coupons.get(id);

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    return {
      success: true,
      data: coupon,
    };
  }

  async getCouponByCode(code: string): Promise<CouponResponse> {
    const coupon = Array.from(this.coupons.values()).find(
      (coupon) => coupon.code === code,
    );

    if (!coupon) {
      throw new NotFoundException(`Coupon with code ${code} not found`);
    }

    return {
      success: true,
      data: coupon,
    };
  }

  async validateCoupon(validateCouponDto: ValidateCouponDto): Promise<CouponValidationResult> {
    try {
      const coupon = Array.from(this.coupons.values()).find(
        (coupon) => coupon.code === validateCouponDto.code,
      );

      if (!coupon) {
        return {
          isValid: false,
          message: 'Coupon not found',
        };
      }

      const validation = this.performCouponValidation(
        coupon,
        validateCouponDto.orderAmount,
        validateCouponDto.userId,
      );

      if (validation.isValid) {
        const discount = this.calculateDiscount(coupon, validateCouponDto.orderAmount);
        return {
          ...validation,
          coupon: coupon,
          discountAmount: discount.discountAmount,
          finalAmount: discount.finalAmount,
        };
      }

      return validation;
    } catch (error) {
      this.logger.error(`Failed to validate coupon: ${error.message}`, error.stack);
      throw error;
    }
  }

  async applyCoupon(
    id: string,
    orderAmount: number,
    userId?: string,
  ): Promise<CouponValidationResult> {
    const coupon = this.coupons.get(id);

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    const validation = this.performCouponValidation(coupon, orderAmount, userId);

    if (!validation.isValid) {
      throw new BadRequestException(validation.message);
    }

    // Increment usage count
    coupon.usageCount += 1;
    coupon.updatedAt = new Date();

    // If usage limit reached, deactivate coupon
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      coupon.status = CouponStatus.EXHAUSTED;
    }

    this.coupons.set(id, coupon);

    const discount = this.calculateDiscount(coupon, orderAmount);

    this.logger.log(`Coupon applied: ${coupon.code} for user ${userId || 'anonymous'}`);

    return {
      isValid: true,
      message: 'Coupon applied successfully',
      coupon: coupon,
      discountAmount: discount.discountAmount,
      finalAmount: discount.finalAmount,
    };
  }

  async updateCoupon(
    id: string,
    updateCouponDto: Partial<CreateCouponDto>,
  ): Promise<CouponResponse> {
    const coupon = this.coupons.get(id);

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    // Validate discount configuration if being updated
    if (updateCouponDto.discountType || updateCouponDto.discountValue) {
      const updatedCoupon = { ...coupon, ...updateCouponDto };
      this.validateDiscountConfiguration(updatedCoupon);
    }

    // Check for duplicate code if code is being updated
    if (updateCouponDto.code && updateCouponDto.code !== coupon.code) {
      const existingCoupon = Array.from(this.coupons.values()).find(
        (c) => c.code === updateCouponDto.code && c.id !== id,
      );

      if (existingCoupon) {
        throw new ConflictException(`Coupon with code ${updateCouponDto.code} already exists`);
      }
    }

    const updatedCoupon = {
      ...coupon,
      ...updateCouponDto,
      updatedAt: new Date(),
    };

    this.coupons.set(id, updatedCoupon);

    this.logger.log(`Coupon updated: ${updatedCoupon.code} (${id})`);

    return {
      success: true,
      data: updatedCoupon,
      message: 'Coupon updated successfully',
    };
  }

  async deactivateCoupon(id: string): Promise<CouponResponse> {
    const coupon = this.coupons.get(id);

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    coupon.status = CouponStatus.INACTIVE;
    coupon.updatedAt = new Date();

    this.coupons.set(id, coupon);

    this.logger.log(`Coupon deactivated: ${coupon.code} (${id})`);

    return {
      success: true,
      data: coupon,
      message: 'Coupon deactivated successfully',
    };
  }

  async activateCoupon(id: string): Promise<CouponResponse> {
    const coupon = this.coupons.get(id);

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    coupon.status = CouponStatus.ACTIVE;
    coupon.updatedAt = new Date();

    this.coupons.set(id, coupon);

    this.logger.log(`Coupon activated: ${coupon.code} (${id})`);

    return {
      success: true,
      data: coupon,
      message: 'Coupon activated successfully',
    };
  }

  async deleteCoupon(id: string): Promise<void> {
    const coupon = this.coupons.get(id);

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    this.coupons.delete(id);

    this.logger.log(`Coupon deleted: ${coupon.code} (${id})`);
  }

  async getCouponUsageStats(id: string) {
    const coupon = this.coupons.get(id);

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    return {
      success: true,
      data: {
        couponId: id,
        code: coupon.code,
        usageCount: coupon.usageCount,
        usageLimit: coupon.usageLimit,
        remainingUses: coupon.usageLimit ? coupon.usageLimit - coupon.usageCount : null,
        usagePercentage: coupon.usageLimit 
          ? Math.round((coupon.usageCount / coupon.usageLimit) * 100) 
          : null,
        status: coupon.status,
        createdAt: coupon.createdAt,
        lastUsedAt: coupon.lastUsedAt || null,
      },
    };
  }

  async bulkCreateCoupons(
    template: CreateCouponDto,
    quantity: number,
  ): Promise<CouponResponse[]> {
    if (quantity > 1000) {
      throw new BadRequestException('Cannot create more than 1000 coupons at once');
    }

    const coupons: CouponResponse[] = [];

    for (let i = 0; i < quantity; i++) {
      const uniqueCode = `${template.code}_${this.generateRandomString(6)}`;
      
      const couponDto: CreateCouponDto = {
        ...template,
        code: uniqueCode,
      };

      try {
        const coupon = await this.createCoupon(couponDto);
        coupons.push(coupon);
      } catch (error) {
        this.logger.warn(`Failed to create bulk coupon ${i + 1}: ${error.message}`);
      }
    }

    this.logger.log(`Bulk created ${coupons.length} coupons`);

    return coupons;
  }

  // Private helper methods
  private performCouponValidation(
    coupon: any,
    orderAmount: number,
    userId?: string,
  ): CouponValidationResult {
    // Check if coupon is active
    if (coupon.status !== CouponStatus.ACTIVE) {
      return {
        isValid: false,
        message: 'Coupon is not active',
      };
    }

    // Check expiration date
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return {
        isValid: false,
        message: 'Coupon has expired',
      };
    }

    // Check start date
    if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) {
      return {
        isValid: false,
        message: 'Coupon is not yet valid',
      };
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return {
        isValid: false,
        message: 'Coupon usage limit exceeded',
      };
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return {
        isValid: false,
        message: `Minimum order amount of ${coupon.minOrderAmount} required`,
      };
    }

    // Check maximum order amount
    if (coupon.maxOrderAmount && orderAmount > coupon.maxOrderAmount) {
      return {
        isValid: false,
        message: `Maximum order amount of ${coupon.maxOrderAmount} exceeded`,
      };
    }

    // Check user-specific coupon
    if (coupon.userId && coupon.userId !== userId) {
      return {
        isValid: false,
        message: 'Coupon is not valid for this user',
      };
    }

    return {
      isValid: true,
      message: 'Coupon is valid',
    };
  }

  private calculateDiscount(coupon: any, orderAmount: number) {
    let discountAmount = 0;

    switch (coupon.discountType) {
      case DiscountType.PERCENTAGE:
        discountAmount = (orderAmount * coupon.discountValue) / 100;
        break;
      case DiscountType.FIXED_AMOUNT:
        discountAmount = coupon.discountValue;
        break;
      case DiscountType.FREE_SHIPPING:
        discountAmount = coupon.discountValue || 0; // Shipping cost
        break;
    }

    // Apply maximum discount limit
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }

    // Ensure discount doesn't exceed order amount
    if (discountAmount > orderAmount) {
      discountAmount = orderAmount;
    }

    return {
      discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
      finalAmount: Math.round((orderAmount - discountAmount) * 100) / 100,
    };
  }

  private validateDiscountConfiguration(couponData: any): void {
    if (!couponData.discountType || !couponData.discountValue) {
      throw new BadRequestException('Discount type and value are required');
    }

    if (couponData.discountType === DiscountType.PERCENTAGE) {
      if (couponData.discountValue <= 0 || couponData.discountValue > 100) {
        throw new BadRequestException('Percentage discount must be between 1 and 100');
      }
    } else if (couponData.discountType === DiscountType.FIXED_AMOUNT) {
      if (couponData.discountValue <= 0) {
        throw new BadRequestException('Fixed amount discount must be greater than 0');
      }
    }

    if (couponData.minOrderAmount && couponData.maxOrderAmount) {
      if (couponData.minOrderAmount >= couponData.maxOrderAmount) {
        throw new BadRequestException('Minimum order amount must be less than maximum order amount');
      }
    }
  }

  private generateId(): string {
    return `coupon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}