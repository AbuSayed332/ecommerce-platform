import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto';
import { WishlistResponse } from './interfaces';
import { Types } from 'mongoose';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() addToWishlistDto: AddToWishlistDto): Promise<WishlistResponse> {
    return this.wishlistService.create(addToWishlistDto);
  }

  @Get('user/:userId')
  async getUserWishlists(
    @Param('userId') userId: string,
    @Query('includeProducts') includeProducts?: boolean,
  ): Promise<WishlistResponse[]> {
    return this.wishlistService.getUserWishlists(new Types.ObjectId(userId), includeProducts);
  }

  @Get('user/:userId/default')
  async getUserDefaultWishlist(
    @Param('userId') userId: string,
    @Query('includeProducts') includeProducts?: boolean,
  ): Promise<WishlistResponse> {
    return this.wishlistService.getUserDefaultWishlist(new Types.ObjectId(userId), includeProducts);
  }

  @Get('public')
  async getPublicWishlists(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('includeProducts') includeProducts?: boolean,
  ): Promise<WishlistResponse[]> {
    return this.wishlistService.getPublicWishlists({ page, limit }, includeProducts);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('includeProducts') includeProducts?: boolean,
  ): Promise<WishlistResponse> {
    return this.wishlistService.findOne(new Types.ObjectId(id), includeProducts);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<AddToWishlistDto>,
  ): Promise<WishlistResponse> {
    return this.wishlistService.update(new Types.ObjectId(id), updateData);
  }

  @Post(':id/products/:productId')
  async addProduct(
    @Param('id') wishlistId: string,
    @Param('productId') productId: string,
  ): Promise<WishlistResponse> {
    return this.wishlistService.addProduct(
      new Types.ObjectId(wishlistId),
      new Types.ObjectId(productId),
    );
  }

  @Delete(':id/products/:productId')
  async removeProduct(
    @Param('id') wishlistId: string,
    @Param('productId') productId: string,
  ): Promise<WishlistResponse> {
    return this.wishlistService.removeProduct(
      new Types.ObjectId(wishlistId),
      new Types.ObjectId(productId),
    );
  }

  @Post(':id/toggle-public')
  async togglePublic(@Param('id') id: string): Promise<WishlistResponse> {
    return this.wishlistService.togglePublic(new Types.ObjectId(id));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.wishlistService.remove(new Types.ObjectId(id));
  }
}
