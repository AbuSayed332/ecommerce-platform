import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { AddToWishlistDto } from './dto';
import { WishlistResponse } from './interfaces';
import { Wishlist } from './../../database/schemas/wishlist.schema';

interface PaginationOptions {
  page: number;
  limit: number;
}

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name) private wishlistModel: Model<Wishlist>,
  ) {}

  async create(addToWishlistDto: AddToWishlistDto): Promise<WishlistResponse> {
    // If this is set as default, ensure no other default exists for this user
    if (addToWishlistDto.isDefault) {
      await this.wishlistModel.updateMany(
        { user: addToWishlistDto.user, isDefault: true },
        { isDefault: false },
      );
    }

    const wishlist = new this.wishlistModel({
      ...addToWishlistDto,
      lastModified: new Date(),
    });

    const savedWishlist = await wishlist.save();
    return this.populateWishlist(savedWishlist);
  }

  async getUserWishlists(
    userId: Types.ObjectId,
    includeProducts: boolean = false,
  ): Promise<WishlistResponse[]> {
    const query = this.wishlistModel.find({ user: userId }).sort({ lastModified: -1 });
    
    if (includeProducts) {
      query.populate('products', 'name price images');
    }

    const wishlists = await query.exec();
    return wishlists.map(wishlist => this.formatWishlistResponse(wishlist));
  }

  async getUserDefaultWishlist(
    userId: Types.ObjectId,
    includeProducts: boolean = false,
  ): Promise<WishlistResponse> {
    let wishlist = await this.wishlistModel.findOne({ user: userId, isDefault: true });

    // If no default wishlist exists, create one
    if (!wishlist) {
     const wishlist = await this.create({
        user: userId,
        name: 'My Wishlist',
        isDefault: true,
        isPublic: false,
      });
    }

    if (includeProducts) {
      await Wishlist.populate('products', 'name price images');
    }

    return this.formatWishlistResponse(wishlist);
  }

  async getPublicWishlists(
    options: PaginationOptions,
    includeProducts: boolean = false,
  ): Promise<WishlistResponse[]> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const query = this.wishlistModel
      .find({ isPublic: true })
      .sort({ lastModified: -1 })
      .skip(skip)
      .limit(limit);

    if (includeProducts) {
      query.populate('products', 'name price images');
    }

    const wishlists = await query.exec();
    return wishlists.map(wishlist => this.formatWishlistResponse(wishlist));
  }

  async findOne(
    id: Types.ObjectId,
    includeProducts: boolean = false,
  ): Promise<WishlistResponse> {
    const query = this.wishlistModel.findById(id);
    
    if (includeProducts) {
      query.populate('products', 'name price images');
    }

    const wishlist = await query.exec();
    
    if (!wishlist) {
      throw new NotFoundException(`Wishlist with ID ${id} not found`);
    }

    return this.formatWishlistResponse(wishlist);
  }

  async update(
    id: Types.ObjectId,
    updateData: Partial<AddToWishlistDto>,
  ): Promise<WishlistResponse> {
    // If setting as default, remove default from other user wishlists
    if (updateData.isDefault && updateData.user) {
      await this.wishlistModel.updateMany(
        { user: updateData.user, isDefault: true, _id: { $ne: id } },
        { isDefault: false },
      );
    }

    const wishlist = await this.wishlistModel.findByIdAndUpdate(
      id,
      { ...updateData, lastModified: new Date() },
      { new: true, runValidators: true },
    );

    if (!wishlist) {
      throw new NotFoundException(`Wishlist with ID ${id} not found`);
    }

    return this.formatWishlistResponse(wishlist);
  }

  async addProduct(
    wishlistId: Types.ObjectId,
    productId: Types.ObjectId,
  ): Promise<WishlistResponse> {
    const wishlist = await this.wishlistModel.findById(wishlistId);
    
    if (!wishlist) {
      throw new NotFoundException(`Wishlist with ID ${wishlistId} not found`);
    }

    // Check if product is already in wishlist
    if (wishlist.products.includes(productId)) {
      throw new BadRequestException('Product is already in the wishlist');
    }

    wishlist.products.push(productId);
    wishlist.lastModified = new Date();
    
    await wishlist.save();
    return this.formatWishlistResponse(wishlist);
  }

  async removeProduct(
    wishlistId: Types.ObjectId,
    productId: Types.ObjectId,
  ): Promise<WishlistResponse> {
    const wishlist = await this.wishlistModel.findById(wishlistId);
    
    if (!wishlist) {
      throw new NotFoundException(`Wishlist with ID ${wishlistId} not found`);
    }

    wishlist.products = wishlist.products.filter(id => !id.equals(productId));
    wishlist.lastModified = new Date();
    
    await wishlist.save();
    return this.formatWishlistResponse(wishlist);
  }

  async togglePublic(id: Types.ObjectId): Promise<WishlistResponse> {
    const wishlist = await this.wishlistModel.findById(id);
    
    if (!wishlist) {
      throw new NotFoundException(`Wishlist with ID ${id} not found`);
    }

    wishlist.isPublic = !wishlist.isPublic;
    wishlist.lastModified = new Date();
    
    await wishlist.save();
    return this.formatWishlistResponse(wishlist);
  }

  async remove(id: Types.ObjectId): Promise<void> {
    const result = await this.wishlistModel.findByIdAndDelete(id);
    
    if (!result) {
      throw new NotFoundException(`Wishlist with ID ${id} not found`);
    }
  }

  private async populateWishlist(wishlist: Wishlist): Promise<WishlistResponse> {
    await wishlist.populate('products', 'name price images');
    return this.formatWishlistResponse(wishlist);
  }

  private formatWishlistResponse(wishlist: any): WishlistResponse {
    return {
      id: wishlist._id.toString(),
      user: wishlist.user.toString(),
      name: wishlist.name,
      description: wishlist.description,
      products: wishlist.products?.map((product: any) => 
        typeof product === 'object' ? product : product.toString()
      ) || [],
      isPublic: wishlist.isPublic,
      isDefault: wishlist.isDefault,
      lastModified: wishlist.lastModified,
      createdAt: wishlist.createdAt,
      updatedAt: wishlist.updatedAt,
    };
  }
}