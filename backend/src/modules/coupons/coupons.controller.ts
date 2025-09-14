import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, ValidateCouponDto } from './dto';
import { CouponResponse, CouponValidationResult, CouponListResponse } from './interfaces';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCoupon(
    @Body(ValidationPipe) createCouponDto: CreateCouponDto,
  ): Promise<CouponResponse> {
    return this.couponsService.createCoupon(createCouponDto);
  }

  @Get()
  async getAllCoupons(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ): Promise<CouponListResponse> {
    return this.couponsService.getAllCoupons({
      page,
      limit,
      status,
      type,
      search,
    });
  }

  @Get(':id')
  async getCouponById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CouponResponse> {
    return this.couponsService.getCouponById(id);
  }

  @Get('code/:code')
  async getCouponByCode(@Param('code') code: string): Promise<CouponResponse> {
    return this.couponsService.getCouponByCode(code);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateCoupon(
    @Body(ValidationPipe) validateCouponDto: ValidateCouponDto,
  ): Promise<CouponValidationResult> {
    return this.couponsService.validateCoupon(validateCouponDto);
  }

  @Post(':id/apply')
  @HttpCode(HttpStatus.OK)
  async applyCoupon(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { orderAmount: number; userId?: string },
  ): Promise<CouponValidationResult> {
    return this.couponsService.applyCoupon(id, body.orderAmount, body.userId);
  }

  @Put(':id')
  async updateCoupon(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateCouponDto: Partial<CreateCouponDto>,
  ): Promise<CouponResponse> {
    return this.couponsService.updateCoupon(id, updateCouponDto);
  }

  @Put(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivateCoupon(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CouponResponse> {
    return this.couponsService.deactivateCoupon(id);
  }

  @Put(':id/activate')
  @HttpCode(HttpStatus.OK)
  async activateCoupon(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CouponResponse> {
    return this.couponsService.activateCoupon(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCoupon(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.couponsService.deleteCoupon(id);
  }

  @Get(':id/usage-stats')
  async getCouponUsageStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.couponsService.getCouponUsageStats(id);
  }

  @Post('bulk-create')
  @HttpCode(HttpStatus.CREATED)
  async bulkCreateCoupons(
    @Body() body: { template: CreateCouponDto; quantity: number },
  ): Promise<CouponResponse[]> {
    return this.couponsService.bulkCreateCoupons(body.template, body.quantity);
  }
}