import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

import { CartService } from './cart.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  AddToCartDto,
  UpdateCartDto,
 
} from './dto';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get user cart' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cart retrieved successfully',
  })
  async getCart(@CurrentUser() user: any) {
    try {
      const cart = await this.cartService.getCart(user.id);
      return {
        success: true,
        message: 'Cart retrieved successfully',
        data: cart,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get cart summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cart summary retrieved successfully',
  })
  async getCartSummary(@CurrentUser() user: any) {
    try {
      const summary = await this.cartService.getCartSummary(user.id);
      return {
        success: true,
        message: 'Cart summary retrieved successfully',
        data: summary,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Item added to cart successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request - validation failed',
  })
  @ApiBody({ type: AddToCartDto })
  async addToCart(
    @CurrentUser() user: any,
    @Body(ValidationPipe) addToCartDto: AddToCartDto,
  ) {
    try {
      const cart = await this.cartService.addToCart(user.id, addToCartDto);
      return {
        success: true,
        message: 'Item added to cart successfully',
        data: cart,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put('items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cart item updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cart item not found',
  })
  @ApiBody({ type: UpdateCartDto })
  async updateCartItem(
    @CurrentUser() user: any,
    @Body(ValidationPipe) updateCartDto: UpdateCartDto,
  ) {
    try {
      // todo: need to be sure that we are sending productId not itemIndex
      const cart = await this.cartService.updateCartItem(user.id, updateCartDto.itemIndex?.toString(), updateCartDto);
      return {
        success: true,
        message: 'Cart item updated successfully',
        data: cart,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item removed from cart successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cart item not found',
  })
  async removeFromCart(
    @CurrentUser() user: any,
    @Param('itemId') itemId: any,
  ) {
    try {
      const cart = await this.cartService.removeFromCart(user.id, itemId);
      return {
        success: true,
        message: 'Item removed from cart successfully',
        data: cart,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cart cleared successfully',
  })
  async clearCart(@CurrentUser() user: any) {
    try {
      const cart = await this.cartService.clearCart(user.id);
      return {
        success: true,
        message: 'Cart cleared successfully',
        data: cart,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}