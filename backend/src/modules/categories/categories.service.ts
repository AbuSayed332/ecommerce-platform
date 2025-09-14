import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Document } from 'mongoose';
import { Category } from '../../database/schemas/category.schema';
import { Product } from '../../database/schemas/product.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  CategoryResponseInterface,
  CategoriesListResponse,
  CategoryTreeResponse,
} from './interfaces';

export interface CategoryQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  parentCategory?: Types.ObjectId | 'null';
  sortBy?: 'name' | 'createdAt' | 'sortOrder' | 'productCount';
  sortOrder?: 'asc' | 'desc';
}

type MCategory = Category & Document;
type MProduct = Product & Document;

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<MCategory>,
    @InjectModel(Product.name) private productModel: Model<MProduct>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseInterface> {
    const existingCategory = await this.categoryModel.findOne({ name: createCategoryDto.name }).exec();
    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    if (createCategoryDto.parentCategory) {
      const parentCategory = await this.categoryModel.findById(createCategoryDto.parentCategory).exec();
      if (!parentCategory) {
        throw new BadRequestException('Parent category not found');
      }

      // Prevent nesting deeper than 2 levels
      if (parentCategory.parentCategory) {
        throw new BadRequestException('Cannot create more than 2 levels of categories');
      }
    }

    const slug = await this.generateUniqueSlug(createCategoryDto.name);
    const sortOrder = createCategoryDto.sortOrder ?? (await this.getNextSortOrder());

    const category = new this.categoryModel({
      ...createCategoryDto,
      slug,
      sortOrder,
    });

    await category.save();

    const populated = await this.populateCategory(category);
    const productCount = await this.getProductCount(category?.id);
    return this.formatCategoryResponse({ ...populated, productCount });
  }

  async findAll(options: CategoryQueryOptions = {}): Promise<CategoriesListResponse> {
    const {
      page,
      limit,
      search,
      isActive,
      parentCategory,
      sortBy = 'sortOrder',
      sortOrder = 'asc',
    } = options;

    const filter: any = {};
    if (typeof isActive === 'boolean') filter.isActive = isActive;

    if (parentCategory === 'null') {
      filter.parentCategory = null;
    } else if (parentCategory) {
      filter.parentCategory = parentCategory;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    let query = this.categoryModel.find(filter).sort(sort);
    let total = 0;

    if (page && limit) {
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
      total = await this.categoryModel.countDocuments(filter).exec();
    }

    const categories = await query.populate('parentCategory', 'name slug image').lean().exec();

    const categoriesWithCount = await Promise.all(
      categories.map(async (category: any) => {
        const productCount = await this.getProductCount(category.id);
        return this.formatCategoryResponse({ ...category, productCount });
      }),
    );

    const response: CategoriesListResponse = { categories: categoriesWithCount };

    if (page && limit) {
      response.pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      };
    }

    return response;
  }

  async findById(id: string): Promise<CategoryResponseInterface> {
    const category = await this.categoryModel
      .findById(id)
      .populate('parentCategory', 'name slug image')
      .lean()
      .exec();

    if (!category) throw new NotFoundException('Category not found');

    const productCount = await this.getProductCount(id);
    return this.formatCategoryResponse({ ...category, productCount });
  }

  async findBySlug(slug: string): Promise<CategoryResponseInterface> {
    const category = await this.categoryModel
      .findOne({ slug, isActive: true })
      .populate('parentCategory', 'name slug image')
      .lean()
      .exec();

    if (!category?.id) throw new NotFoundException('Category not found');

    const productCount = await this.getProductCount(category?.id);
    return this.formatCategoryResponse({ ...category, productCount });
  }

  async getCategoryTree(): Promise<CategoryTreeResponse[]> {
    const categories = await this.categoryModel.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean().exec();
    const categoryIds = categories.map(cat => cat.id);
    const productCounts = await this.getProductCountsForMultiple(categoryIds);

    const categoryMap = new Map<string, CategoryTreeResponse>();
    const rootCategories: CategoryTreeResponse[] = [];

    categories.forEach((category: any) => {
      const treeCategory: CategoryTreeResponse = {
        _id: category._id,
        name: category.name,
        slug: category.slug,
        image: category.image,
        isActive: category.isActive,
        sortOrder: category.sortOrder,
        productCount: productCounts.get(String(category._id)) ?? 0,
        children: [],
      };
      categoryMap.set(String(category._id), treeCategory);
    });

    categories.forEach((category: any) => {
      const treeCategory = categoryMap.get(String(category.id));
      if (category.parentCategory) {
        const parent = categoryMap.get(String(category.parentCategory));
        if (parent && treeCategory) parent.children.push(treeCategory);
      } else {
        rootCategories.push(categoryMap.get(String(category.id))!);
      }
    });

    return rootCategories;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryResponseInterface> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) throw new NotFoundException('Category not found');

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryModel.findOne({
        name: updateCategoryDto.name,
        _id: { $ne: id },
      }).exec();

      if (existingCategory) throw new ConflictException('Category with this name already exists');

      // assign slug (UpdateCategoryDto declares slug?: string so this is safe)
      updateCategoryDto.slug = await this.generateUniqueSlug(updateCategoryDto.name);
    }

    if (updateCategoryDto.parentCategory) {
      const parentCategory = await this.categoryModel.findById(updateCategoryDto.parentCategory).exec();
      if (!parentCategory) throw new BadRequestException('Parent category not found');

      if (String(updateCategoryDto.parentCategory) === String(id)) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      if (parentCategory.parentCategory) {
        throw new BadRequestException('Cannot create more than 2 levels of categories');
      }

      const hasChildren = await this.categoryModel.findOne({ parentCategory: id }).exec();
      if (hasChildren) throw new BadRequestException('Cannot set parent for category that has children');
    }

    Object.assign(category, updateCategoryDto);
    await category.save();

    const populated = await this.populateCategory(category);
    const productCount = await this.getProductCount(id);
    return this.formatCategoryResponse({ ...populated, productCount });
  }

  async remove(id: string): Promise<void> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) throw new NotFoundException('Category not found');

    const productCount = await this.getProductCount(id);
    if (productCount > 0) {
      throw new BadRequestException(`Cannot delete category with ${productCount} products. Move or delete products first.`);
    }

    const hasChildren = await this.categoryModel.findOne({ parentCategory: id }).exec();
    if (hasChildren) throw new BadRequestException('Cannot delete category that has subcategories. Delete subcategories first.');

    await this.categoryModel.findByIdAndDelete(id).exec();
  }

  async getStats(): Promise<any /* CategoryStatsResponse */> {
    const [stats, productStats] = await Promise.all([
      this.categoryModel.aggregate([
        {
          $group: {
            _id: null,
            totalCategories: { $sum: 1 },
            activeCategories: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
            parentCategories: { $sum: { $cond: [{ $eq: ['$parentCategory', null] }, 1, 0] } },
            subcategories: { $sum: { $cond: [{ $ne: ['$parentCategory', null] }, 1, 0] } },
          },
        },
      ]).exec(),
      this.productModel.aggregate([
        {
          $group: {
            _id: '$category',
            productCount: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            categoriesWithProducts: { $sum: 1 },
            totalProducts: { $sum: '$productCount' },
          },
        },
      ]).exec(),
    ]);

    const categoryStats = stats?.[0] ?? { totalCategories: 0, activeCategories: 0, parentCategories: 0, subcategories: 0 };
    const productStatsResult = productStats?.[0] ?? { categoriesWithProducts: 0, totalProducts: 0 };

    return {
      ...categoryStats,
      categoriesWithProducts: productStatsResult.categoriesWithProducts,
      averageProductsPerCategory:
        categoryStats.totalCategories > 0 ? productStatsResult.totalProducts / categoryStats.totalCategories : 0,
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
      if (excludeId) filter._id = { $ne: excludeId };

      const existingCategory = await this.categoryModel.findOne(filter).exec();
      if (!existingCategory) break;

      slug = `${baseSlug}-${counter++}`;
    }

    return slug;
  }

  private async getNextSortOrder(): Promise<number> {
    const lastCategory = await this.categoryModel.findOne().sort({ sortOrder: -1 }).select('sortOrder').lean().exec();
    return lastCategory ? (lastCategory as any).sortOrder + 1 : 1;
  }

  private async getProductCount(categoryId:string ): Promise<number> {
    return this.productModel.countDocuments({
      $or: [{ category: categoryId }, { subcategories: categoryId }],
    }).exec();
  }

  private async getProductCountsForMultiple(categoryIds: string[]): Promise<Map<string, number>> {
    if (!categoryIds || categoryIds.length === 0) return new Map();

    const counts = await this.productModel.aggregate([
      {
        $match: {
          $or: [{ category: { $in: categoryIds } }, { subcategories: { $in: categoryIds } }],
        },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]).exec();

    const countMap = new Map<string, number>();
    counts.forEach((item: any) => {
      if (item._id) countMap.set(String(item._id), item.count);
    });

    return countMap;
  }

  private async populateCategory(category: any) {
    return this.categoryModel.populate(category, {
      path: 'parentCategory',
      select: 'name slug image',
    });
  }

  private formatCategoryResponse(category: any): CategoryResponseInterface {
    return {
      _id: category._id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      parentCategory: category.parentCategory,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      seo: category.seo,
      attributes: category.attributes || [],
      productCount: category.productCount || 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
