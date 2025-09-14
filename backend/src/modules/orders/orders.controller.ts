import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto, OrderQueryDto } from './dto';
import { OrderResponseInterface, OrdersListResponse, OrderStatsResponse } from './interfaces';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole, User } from '../../database/schemas/user.schema';
import { ParseObjectIdPipe } from '../../common/pipes';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid order data or insufficient stock' })
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser('_id') customerId: Types.ObjectId,
  ): Promise<OrderResponseInterface> {
    return this.ordersService.create(createOrderDto, customerId);
  }

  @Get()
  @ApiOperation({ summary: 'Get orders with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async findAll(
    @Query() queryDto: OrderQueryDto,
    @CurrentUser() currentUser: User,
  ): Promise<OrdersListResponse> {
    return this.ordersService.findAll(queryDto, currentUser);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get order statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(): Promise<OrderStatsResponse> {
    return this.ordersService.getStats();
  }

  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Get order by order number' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findByOrderNumber(
    @Param('orderNumber') orderNumber: string,
    @CurrentUser() currentUser: User,
  ): Promise<OrderResponseInterface> {
    return this.ordersService.findByOrderNumber(orderNumber, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findOne(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser() currentUser: User,
  ): Promise<OrderResponseInterface> {
    return this.ordersService.findById(id, currentUser);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update order by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateOrderDto: UpdateOrderDto,
    @CurrentUser() currentUser: User,
  ): Promise<OrderResponseInterface> {
    return this.ordersService.update(id, updateOrderDto, currentUser);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel order with current status' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async cancel(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body('reason') reason: string,
    @CurrentUser() currentUser: User,
  ): Promise<OrderResponseInterface> {
    return this.ordersService.cancel(id, reason, currentUser);
  }
}