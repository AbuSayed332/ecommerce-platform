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
import { ProductsService, ProductStatsResponse } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';
import { ProductResponseInterface } from './interfaces';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser, Public } from '../../common/decorators';
import { UserRole, User } from '../../database/schemas/user.schema';
import { ParseObjectIdPipe } from '../../common/pipes';
import { ProductsListResponse } from './interfaces/product-response.interface';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid product data' })
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser('_id') vendorId: Types.ObjectId,
  ): Promise<ProductResponseInterface> {
    return this.productsService.create(createProductDto, vendorId);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all products with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async findAll(@Query() queryDto: ProductQueryDto): Promise<ProductsListResponse> {
    return this.productsService.findAll(queryDto);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get product statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(): Promise<ProductStatsResponse> {
    return this.productsService.getStats();
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Get product by slug' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findBySlug(@Param('slug') slug: string): Promise<ProductResponseInterface> {
    return this.productsService.findBySlug(slug);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ): Promise<ProductResponseInterface> {
    return this.productsService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product by ID' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() currentUser: User,
  ): Promise<ProductResponseInterface> {
    return this.productsService.update(id, updateProductDto, currentUser);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete product by ID' })
  @ApiResponse({ status: 204, description: 'Product deleted successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.productsService.remove(id, currentUser);
  }

  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update product stock' })
  @ApiResponse({ status: 204, description: 'Stock updated successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient stock' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateStock(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body('quantity') quantity: number,
  ): Promise<void> {
    return this.productsService.updateStock(id, quantity);
  }
}