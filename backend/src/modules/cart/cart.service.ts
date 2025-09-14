import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document, Types } from 'mongoose';
import { Cart, CartDocument } from '../../database/schemas/cart.schema';
import { Product, ProductDocument } from '../../database/schemas/product.schema';
import { Coupon, CouponDocument } from '../../database/schemas/coupon.schema';
import { CartResponse, CartItem, CartSummary } from './interfaces/cart-response.interface';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from '../cart/dto/update-cart.dto';

interface AppliedCoupon {
  id: string;
  code: string;
  discountAmount: number;
}

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
  ) {}

  async getCart(userId: string): Promise<CartResponse> {
    let cart = await this.cartModel.findOne({ user: userId }).exec() as CartDocument;
    
    if (!cart) {
      cart = await this.createEmptyCart(userId);
    }

    return this.formatCartResponse(cart);
  }

  
  async getCartSummary(userId: string): Promise<CartSummary> {
    const cart = await this.cartModel.findOne({ user: userId }).exec();

    if (!cart) {
      // Option 1: Return a default CartSummary
      return {
        itemCount: 0,
        totalQuantity: 0,
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0,
      };

      // Option 2: Throw a NotFoundException (if you want to indicate an error)
      // throw new NotFoundException('Cart not found');
    }

    let discountValue = 0;
    if (cart.appliedCoupon) {
        const coupon = await this.couponModel.findById(cart.appliedCoupon).exec();
        if(coupon) {
            discountValue = coupon.discountValue;
        }
    }

    const cartSummary: CartSummary = {
      itemCount: cart.items.length,
      totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: cart.subtotal,
      tax: cart.tax,
      shipping: cart.shipping,
      discount: cart.discount,
      total: cart.total,
      appliedCoupon: cart.appliedCoupon ? {
        code: (cart.appliedCoupon as any).code, // Assuming coupon has a 'code' property
        discountValue: discountValue, // Assuming coupon has a 'discountValue' property
      } : undefined,
    };

    return cartSummary;
  }


  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<CartResponse> {
    const { productId, quantity, selectedVariants } = addToCartDto;
    
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let cart = await this.cartModel.findOne({ user: userId }).exec() as CartDocument;
    if (!cart) {
      cart = await this.createEmptyCart(userId);
    }

    // Find existing item index
    const existingItemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      const existingItem = cart.items[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      
      if (product.stock < newQuantity) {
        throw new BadRequestException('Insufficient stock');
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = product.price;
    } else {
      // Add new item
      if (product.stock < quantity) {
        throw new BadRequestException('Insufficient stock');
      }

      cart.items.push({
        product: new Types.ObjectId(productId),
        quantity,
        price: product.price,
        selectedVariants: new Map(Object.entries(selectedVariants || {})),
      });
    }

    cart.updatedAt = new Date();
    await cart.save();

    return this.formatCartResponse(cart);
  }

  async removeFromCart(userId: string, productId: string): Promise<CartResponse> {
    const cart = await this.cartModel.findOne({ user: userId }).exec();
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const itemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Item not found in cart');
    }

    cart.items.splice(itemIndex, 1);
    cart.updatedAt = new Date();
    await cart.save();

    return this.formatCartResponse(cart);
  }

  async updateCartItem(userId: string, productId: string, updateDto: UpdateCartDto): Promise<CartResponse> {
    const cart = await this.cartModel.findOne({ user: userId }).exec();
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const itemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Item not found in cart');
    }

    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < updateDto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    cart.items[itemIndex].quantity = updateDto.quantity;
    cart.items[itemIndex].price = product.price;
    cart.updatedAt = new Date();
    await cart.save();

    return this.formatCartResponse(cart);
  }

  async applyCoupon(userId: string, couponCode: string): Promise<CartResponse> {
    const cart = await this.cartModel.findOne({ user: userId }).exec();
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const coupon = await this.couponModel.findOne({ 
      code: couponCode,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).exec();

    if (!coupon) {
      throw new NotFoundException('Invalid or expired coupon');
    }

    // Remove existing coupon if any
    if (cart.appliedCoupon && 
        (cart.appliedCoupon as any)._id?.toString() === coupon._id?.toString()) {
      throw new BadRequestException('Coupon already applied');
    }

    cart.appliedCoupon = coupon._id as any;
    cart.updatedAt = new Date();
    await cart.save();

    return this.formatCartResponse(cart);
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartModel.findOneAndUpdate(
      { user: userId },
      { 
        items: [],
        appliedCoupon: null,
        updatedAt: new Date()
      }
    ).exec();
  }

  private async createEmptyCart(userId: string): Promise<CartDocument> {
    const cart = new this.cartModel({
      user: new Types.ObjectId(userId),
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return await cart.save();
  }

  private async formatCartResponse(cart: CartDocument): Promise<CartResponse> {
    const validItems: any[] = [];
    
    // Populate product details for each item
    for (const item of cart.items) {
      const product = await this.productModel.findById(item.product).exec();
      if (product) {
        validItems.push({
          product: {
            id: product._id?.toString(),
            name: product.name,
            price: product.price,
            images: product.images || [],
            category: product.category,
            stock: product.stock,
          },
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.quantity * item.price,
          selectedVariants: Object.fromEntries(item.selectedVariants || new Map()),
        });
      }
    }

    return {
      id: cart._id?.toString() || '',
      userId: cart.user.toString(),
      items: validItems,
      subtotal: validItems.reduce((sum, item) => sum + item.totalPrice, 0),
      total: cart.total,
      tax: cart.tax,
      shipping: cart.shipping,
      discount: cart.discount,
      __v: cart.__v,
      lastModified: cart?.lastModified || new Date(),
      // itemCount: validItems.length,
      // totalItems: validItems.reduce((sum, item) => sum + item.quantity, 0),
      // appliedCoupon: cart?.appliedCoupon ? {
      //   id: (cart.appliedCoupon as any)._id?.toString(),
      //   code: (cart.appliedCoupon as any).code,
      //   discountAmount: (cart.appliedCoupon as any).discountAmount,
      // } as AppliedCoupon : undefined,
      appliedCoupon: null,
      expiresAt: cart?.expiresAt,
      // createdAt: cart?.
      createdAt: new Date(),
      updatedAt: cart.updatedAt || new Date(),
    };
  }
}