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
import * as categoriesService from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import {
  CategoryResponseInterface,
  CategoriesListResponse,
  CategoryTreeResponse,
  CategoryStatsResponse,
} from './interfaces';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, Public } from '../../common/decorators';
import { UserRole } from '../../database/schemas/user.schema';
import { ParseObjectIdPipe } from '../../common/pipes';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: categoriesService.CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 409, description: 'Category name already exists' })
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryResponseInterface> {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all categories with optional filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async findAll(@Query() query: categoriesService.CategoryQueryOptions): Promise<CategoriesListResponse> {
    return this.categoriesService.findAll(query);
  }

  @Get('tree')
  @Public()
  @ApiOperation({ summary: 'Get category tree structure' })
  @ApiResponse({ status: 200, description: 'Category tree retrieved successfully' })
  async getCategoryTree(): Promise<CategoryTreeResponse[]> {
    return this.categoriesService.getCategoryTree();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get category statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(): Promise<CategoryStatsResponse> {
    return this.categoriesService.getStats();
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Get category by slug' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findBySlug(@Param('slug') slug: string): Promise<CategoryResponseInterface> {
    return this.categoriesService.findBySlug(slug);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<CategoryResponseInterface> {
    return this.categoriesService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Category name already exists' })
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseInterface> {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete category by ID (Admin only)' })
  @ApiResponse({ status: 204, description: 'Category deleted successfully' })
  @ApiResponse({ status: 400, description: 'Category has products or subcategories' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async remove(@Param('id', ParseObjectIdPipe) id: string): Promise<void> {
    return this.categoriesService.remove(id);
  }
}