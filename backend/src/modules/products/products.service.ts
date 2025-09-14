import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, SortOrder } from 'mongoose';
import { Product, ProductStatus } from '../../database/schemas/product.schema';
import { Category } from '../../database/schemas/category.schema';
import { User, UserRole } from '../../database/schemas/user.schema';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';
import { ProductResponseInterface } from './interfaces';
import { ProductsListResponse } from './interfaces/product-response.interface';

export interface ProductStatsResponse {
  totalProducts: number;
  activeProducts: number;
  featuredProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  averagePrice: number;
  totalValue: number;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    vendorId: Types.ObjectId,
  ): Promise<ProductResponseInterface> {
    // Validate category exists
    const category = await this.categoryModel.findById(createProductDto.category);
    if (!category) {
      throw new BadRequestException('Category not found');
    }

    // Validate subcategories if provided
    if (createProductDto.subcategories?.length) {
      const subcategories = await this.categoryModel.find({
        _id: { $in: createProductDto.subcategories },
      });
      if (subcategories.length !== createProductDto.subcategories.length) {
        throw new BadRequestException('One or more subcategories not found');
      }
    }

    // Generate unique slug
    const slug = await this.generateUniqueSlug(createProductDto.name);

    // Create product
    const product = new this.productModel({
      ...createProductDto,
      slug,
      vendor: vendorId,
    });

    await product.save();
    return this.formatProductResponse(await this.populateProduct(product));
  }

  async findAll(queryDto: ProductQueryDto): Promise<ProductsListResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      vendor,
      minPrice,
      maxPrice,
      inStock,
      isFeatured,
      isActive = true,
      status,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minRating,
    } = queryDto;

    // Build filter
    const filter: any = { isActive };

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (vendor) filter.vendor = vendor;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured;
    if (minRating) filter.averageRating = { $gte: minRating };

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    // Stock filter
    if (inStock !== undefined) {
      filter.stock = inStock ? { $gt: 0 } : 0;
    }

    // Tags filter
    if (tags?.length) {
      filter.tags = { $in: tags };
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sort: { [key: string]: SortOrder } = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Get products and total count
    const [products, total, filters] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('category', 'name slug image')
        .populate('subcategories', 'name slug image')
        .populate('vendor', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.productModel.countDocuments(filter),
      this.getFilters(),
    ]);

    return {
      products: products.map(product => this.formatProductResponse(product)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
      filters,
    };
  }

  async findById(id: Types.ObjectId): Promise<ProductResponseInterface> {
    const product = await this.productModel
      .findById(id)
      .populate('category', 'name slug image')
      .populate('subcategories', 'name slug image')
      .populate('vendor', 'firstName lastName email')
      .lean();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Increment view count
    await this.productModel.findByIdAndUpdate(id, {
      $inc: { viewCount: 1 },
    });

    return this.formatProductResponse(product);
  }

  async findBySlug(slug: string): Promise<ProductResponseInterface> {
    const product = await this.productModel
      .findOne({ slug, isActive: true })
      .populate('category', 'name slug image')
      .populate('subcategories', 'name slug image')
      .populate('vendor', 'firstName lastName email')
      .lean();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Increment view count
    await this.productModel.findOneAndUpdate(
      { slug },
      { $inc: { viewCount: 1 } },
    );

    return this.formatProductResponse(product);
  }

  async update(
    id: Types.ObjectId,
    updateProductDto: UpdateProductDto,
    currentUser: User,
  ): Promise<ProductResponseInterface> {
    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check permissions
    if (
      currentUser.role !== UserRole.ADMIN &&
      product.vendor.toString() !== (currentUser._id as Types.ObjectId).toString()
    ) {
      throw new ForbiddenException('You can only update your own products');
    }

    // Validate category if being updated
    if (updateProductDto.category) {
      const category = await this.categoryModel.findById(updateProductDto.category);
      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    // Update slug if name is being changed
    if (updateProductDto.name && updateProductDto.name !== product.name) {
      updateProductDto.slug = await this.generateUniqueSlug(updateProductDto.name, id);
    }

    // Update product
    Object.assign(product, updateProductDto);
    await product.save();

    return this.formatProductResponse(await this.populateProduct(product));
  }

  async remove(id: Types.ObjectId, currentUser: User): Promise<void> {
    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check permissions
    if (
      currentUser.role !== UserRole.ADMIN &&
      product.vendor.toString() !== (currentUser._id as Types.ObjectId).toString()
    ) {
      throw new ForbiddenException('You can only delete your own products');
    }

    // Soft delete by setting status to inactive
    product.isActive = false;
    product.status = ProductStatus.DISCONTINUED;
    await product.save();
  }

  async updateStock(id: Types.ObjectId, quantity: number): Promise<void> {
    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const newStock = product.stock + quantity;

    if (newStock < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    product.stock = newStock;

    // Update status based on stock
    if (newStock === 0) {
      product.status = ProductStatus.OUT_OF_STOCK;
    } else if (newStock <= (product.minStock || 0)) {
      // You might want to emit a low stock event here
    } else if (product.status === ProductStatus.OUT_OF_STOCK) {
      product.status = ProductStatus.ACTIVE;
    }

    await product.save();
  }

  async updateRating(id: Types.ObjectId, rating: number): Promise<void> {
    // This would typically be called from the reviews service
    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Calculate new average rating and review count
    // This is a simplified version - in reality, you'd aggregate from reviews
    const totalRatingPoints = product.averageRating * product.reviewCount + rating;
    product.reviewCount += 1;
    product.averageRating = totalRatingPoints / product.reviewCount;

    await product.save();
  }

  async getStats(): Promise<ProductStatsResponse> {
    const stats = await this.productModel.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
          featuredProducts: {
            $sum: { $cond: [{ $eq: ['$isFeatured', true] }, 1, 0] },
          },
          outOfStockProducts: {
            $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] },
          },
          lowStockProducts: {
            $sum: { $cond: [{ $lte: ['$stock', '$minStock'] }, 1, 0] },
          },
          averagePrice: { $avg: '$price' },
          totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
        },
      },
    ]);

    return stats[0] || {
      totalProducts: 0,
      activeProducts: 0,
      featuredProducts: 0,
      outOfStockProducts: 0,
      lowStockProducts: 0,
      averagePrice: 0,
      totalValue: 0,
    };
  }

  private async generateUniqueSlug(name: string, excludeId?: Types.ObjectId): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const filter: any = { slug };
      if (excludeId) {
        filter._id = { $ne: excludeId };
      }

      const existingProduct = await this.productModel.findOne(filter);
      if (!existingProduct) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  private async populateProduct(product: any) {
    return this.productModel.populate(product, [
      { path: 'category', select: 'name slug image' },
      { path: 'subcategories', select: 'name slug image' },
      { path: 'vendor', select: 'firstName lastName email' },
    ]);
  }

  private async getFilters() {
    const [categories, priceRange, tags] = await Promise.all([
      this.categoryModel.find({ isActive: true }).select('name slug image').lean(),
      this.productModel.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            min: { $min: '$price' },
            max: { $max: '$price' },
          },
        },
      ]),
      this.productModel.distinct('tags', { isActive: true }),
    ]);

    // Map categories to CategoryResponse type and ensure _id is a string
    const mappedCategories = categories.map((cat: any) => ({
      _id: cat._id.toString(),
      name: cat.name,
      slug: cat.slug,
      image: cat.image,
    }));

    return {
      categories: mappedCategories,
      priceRange: priceRange[0] || { min: 0, max: 0 },
      availableTags: tags.filter(Boolean),
    };
  }

  private formatProductResponse(product: any): ProductResponseInterface {
    return {
      _id: product._id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      longDescription: product.longDescription,
      price: product.price,
      comparePrice: product.comparePrice,
      costPrice: product.costPrice,
      stock: product.stock,
      minStock: product.minStock,
      sku: product.sku,
      barcode: product.barcode,
      images: product.images || [],
      category: product.category,
      subcategories: product.subcategories || [],
      vendor: product.vendor,
      status: product.status,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      isDigital: product.isDigital,
      averageRating: product.averageRating,
      reviewCount: product.reviewCount,
      viewCount: product.viewCount,
      soldCount: product.soldCount,
      tags: product.tags || [],
      attributes: product.attributes || [],
      variants: product.variants || [],
      dimensions: product.dimensions,
      seo: product.seo,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}