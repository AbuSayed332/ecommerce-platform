import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Document } from 'mongoose';
import { Order, OrderStatus, PaymentStatus, PaymentMethod } from '../../database/schemas/order.schema';
import { Product } from '../../database/schemas/product.schema';
import { User, UserRole } from '../../database/schemas/user.schema';
import { Coupon } from '../../database/schemas/coupon.schema';
import { CreateOrderDto, UpdateOrderDto, OrderQueryDto } from './dto';
import { OrderResponseInterface, OrdersListResponse, OrderStatsResponse } from './interfaces';

type MOrder = Order & Document;
type MProduct = Product & Document;
type MUser = User & Document;
type MCoupon = Coupon & Document;

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<MOrder>,
    @InjectModel(Product.name) private productModel: Model<MProduct>,
    @InjectModel(User.name) private userModel: Model<MUser>,
    @InjectModel(Coupon.name) private couponModel: Model<MCoupon>,
  ) {}

  async create(
    createOrderDto: CreateOrderDto,
    customerId: Types.ObjectId,
  ): Promise<OrderResponseInterface> {
    const { items, subtotal, tax, shipping, discount, total, appliedCoupon } =
      await this.calculateOrderTotals(createOrderDto.items, createOrderDto.couponCode);

    await this.validateAndReserveStock(createOrderDto.items);

    const orderNumber = await this.generateOrderNumber();

    const billingAddress = createOrderDto.billingAddress || createOrderDto.shippingAddress;

    const order = new this.orderModel({
      orderNumber,
      customer: customerId,
      items,
      subtotal,
      tax,
      shipping,
      discount,
      total,
      shippingAddress: createOrderDto.shippingAddress,
      billingAddress,
      paymentMethod: createOrderDto.paymentMethod,
      appliedCoupon: appliedCoupon?._id,
      notes: createOrderDto.notes,
      statusHistory: [
        {
          status: OrderStatus.PENDING,
          timestamp: new Date(),
          note: 'Order created',
        },
      ],
    });

    await order.save();

    if (appliedCoupon) {
      await this.updateCouponUsage(appliedCoupon._id, customerId);
    }

    const populated = await this.populateOrder(order);
    return this.formatOrderResponse(populated);
  }

  async findAll(
    queryDto: OrderQueryDto,
    currentUser: MUser,
  ): Promise<OrdersListResponse> {
    const {
      page = 1,
      limit = 10,
      orderNumber,
      customer,
      status,
      paymentStatus,
      paymentMethod,
      dateFrom,
      dateTo,
      minTotal,
      maxTotal,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    const filter: any = {};

    // Role-based filtering
    if (currentUser.role === UserRole.CUSTOMER) {
      filter.customer = currentUser._id;
    } else if (customer) {
      filter.customer = customer;
    }

    if (orderNumber) filter.orderNumber = { $regex: orderNumber, $options: 'i' };
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = dateFrom;
      if (dateTo) filter.createdAt.$lte = dateTo;
    }

    if (minTotal !== undefined || maxTotal !== undefined) {
      filter.total = {};
      if (minTotal !== undefined) filter.total.$gte = minTotal;
      if (maxTotal !== undefined) filter.total.$lte = maxTotal;
    }

    const skip = (page - 1) * limit;
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [orders, total, summary] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('customer', 'firstName lastName email')
        .populate('items.product', 'name slug images price')
        .populate('appliedCoupon', 'code name value type')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.orderModel.countDocuments(filter).exec(),
      this.getOrderSummary(filter),
    ]);

    return {
      orders: (orders as any[]).map(o => this.formatOrderResponse(o)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
      summary,
    };
  }

  async findById(id: string | Types.ObjectId, currentUser: MUser): Promise<OrderResponseInterface> {
    const order = await this.orderModel
      .findById(id)
      .populate('customer', 'firstName lastName email')
      .populate('items.product', 'name slug images price')
      .populate('appliedCoupon', 'code name value type')
      .lean();

    if (!order) throw new NotFoundException('Order not found');

    if (
      currentUser.role === UserRole.CUSTOMER &&
      String((order as any).customer._id) !== String(currentUser._id)
    ) {
      throw new ForbiddenException('You can only view your own orders');
    }

    return this.formatOrderResponse(order);
  }

  async findByOrderNumber(
    orderNumber: string,
    currentUser: MUser,
  ): Promise<OrderResponseInterface> {
    const order = await this.orderModel
      .findOne({ orderNumber })
      .populate('customer', 'firstName lastName email')
      .populate('items.product', 'name slug images price')
      .populate('appliedCoupon', 'code name value type')
      .lean();

    if (!order) throw new NotFoundException('Order not found');

    if (
      currentUser.role === UserRole.CUSTOMER &&
      String((order as any).customer._id) !== String(currentUser._id)
    ) {
      throw new ForbiddenException('You can only view your own orders');
    }

    return this.formatOrderResponse(order);
  }

  async update(
    id: string | Types.ObjectId,
    updateOrderDto: UpdateOrderDto,
    currentUser: MUser,
  ): Promise<OrderResponseInterface> {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update orders');
    }

    if (updateOrderDto.status) {
      this.validateStatusTransition(order.status, updateOrderDto.status);
    }

    if (updateOrderDto.status && updateOrderDto.status !== order.status) {
      order.statusHistory.push({
        status: updateOrderDto.status,
        timestamp: new Date(),
        note: `Status changed to ${updateOrderDto.status}`,
      });

      await this.handleStatusTransition(order, updateOrderDto.status);
    }

    Object.assign(order, updateOrderDto);
    await order.save();

    const populated = await this.populateOrder(order);
    return this.formatOrderResponse(populated);
  }

  async cancel(
    id: string | Types.ObjectId,
    reason: string,
    currentUser: MUser,
  ): Promise<OrderResponseInterface> {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    if (
      currentUser.role === UserRole.CUSTOMER &&
      String(order.customer) !== String(currentUser._id)
    ) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException(`Cannot cancel order with status: ${order.status}`);
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancellationReason = reason;

    order.statusHistory.push({
      status: OrderStatus.CANCELLED,
      timestamp: new Date(),
      note: `Order cancelled: ${reason}`,
    });

    await this.restoreStock(order.items);
    await order.save();

    const populated = await this.populateOrder(order);
    return this.formatOrderResponse(populated);
  }

  async getStats(): Promise<OrderStatsResponse> {
    const [generalStats, statusStats, paymentStatusStats, paymentMethodStats] = await Promise.all([
      this.orderModel.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$total' },
            averageOrderValue: { $avg: '$total' },
            recentOrders: {
              $sum: {
                $cond: [
                  { $gte: ['$createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      this.getOrderCountByStatus(),
      this.getOrderCountByPaymentStatus(),
      this.getOrderCountByPaymentMethod(),
    ]);

    const stats = (generalStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      recentOrders: 0,
    }) as any;

    return {
      ...stats,
      ordersByStatus: statusStats,
      ordersByPaymentStatus: paymentStatusStats,
      ordersByPaymentMethod: paymentMethodStats,
      pendingOrders: statusStats[OrderStatus.PENDING] || 0,
      completedOrders: statusStats[OrderStatus.DELIVERED] || 0,
      cancelledOrders: statusStats[OrderStatus.CANCELLED] || 0,
      refundedOrders: statusStats[OrderStatus.REFUNDED] || 0,
    } as OrderStatsResponse;
  }

  private async calculateOrderTotals(
    orderItems: any[],
    couponCode?: string,
  ): Promise<{
    items: any[];
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
    appliedCoupon?: any;
  }> {
    const productIds = orderItems.map(item => item.product);
    const products = await this.productModel.find({ _id: { $in: productIds } });

    if (products.length !== orderItems.length) {
      throw new BadRequestException('One or more products not found');
    }

    const items = orderItems.map(orderItem => {
      const product = products.find(p => String(p._id) === String(orderItem.product));
      if (!product) throw new BadRequestException(`Product ${orderItem.product} not found`);

      const price = product.price;
      const total = price * orderItem.quantity;

      return {
        product: product._id,
        name: product.name,
        quantity: orderItem.quantity,
        price,
        total,
        selectedVariants: orderItem.selectedVariants || {},
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.08;
    const shipping = subtotal > 100 ? 0 : 10;

    let discount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      appliedCoupon = await this.validateCoupon(couponCode, subtotal);
      if (appliedCoupon) discount = this.calculateDiscount(appliedCoupon, subtotal);
    }

    const total = subtotal + tax + shipping - discount;

    return { items, subtotal, tax, shipping, discount, total, appliedCoupon };
  }

  private async validateAndReserveStock(orderItems: any[]): Promise<void> {
    for (const item of orderItems) {
      const product = await this.productModel.findById(item.product);
      if (!product) throw new BadRequestException(`Product ${item.product} not found`);

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        );
      }

      product.stock -= item.quantity;
      product.soldCount += item.quantity;
      await product.save();
    }
  }

  private async restoreStock(orderItems: any[]): Promise<void> {
    for (const item of orderItems) {
      const product = await this.productModel.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        product.soldCount = Math.max(0, product.soldCount - item.quantity);
        await product.save();
      }
    }
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const startOfDay = new Date(year, date.getMonth(), date.getDate());
    const endOfDay = new Date(year, date.getMonth(), date.getDate() + 1);

    const todayOrderCount = await this.orderModel.countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    }).exec();

    const sequenceNumber = String(todayOrderCount + 1).padStart(4, '0');

    return `ORD-${year}${month}${day}-${sequenceNumber}`;
  }

  private async validateCoupon(code: string, orderTotal: number): Promise<any> {
    const coupon = await this.couponModel.findOne({
      code,
      isPublic: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    if (!coupon) throw new BadRequestException('Invalid or expired coupon');

    if (coupon.minimumOrderValue && orderTotal < coupon.minimumOrderValue) {
      throw new BadRequestException(
        `Minimum order amount of ${coupon.minimumOrderValue} required for this coupon`,
      );
    }

    return coupon;
  }

  private calculateDiscount(coupon: any, subtotal: number): number {
    let discount = 0;
    switch (coupon.type) {
      case 'percentage':
        discount = (subtotal * coupon.value) / 100;
        break;
      case 'fixed_amount':
        discount = coupon.value;
        break;
      case 'free_shipping':
        discount = 10;
        break;
      default:
        discount = 0;
    }

    if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
      discount = coupon.maximumDiscount;
    }

    return Math.min(discount, subtotal);
  }

  private async updateCouponUsage(couponId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
    await this.couponModel.findByIdAndUpdate(couponId, {
      $inc: { usageCount: 1 },
      $push: { usedBy: userId },
    }).exec();
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private async handleStatusTransition(order: any, newStatus: OrderStatus): Promise<void> {
    switch (newStatus) {
      case OrderStatus.SHIPPED:
        order.shipping = { ...(order.shipping || {}), shippedAt: new Date() };
        break;
      case OrderStatus.DELIVERED:
        order.shipping = { ...(order.shipping || {}), deliveredAt: new Date() };
        break;
      case OrderStatus.REFUNDED:
        order.refundedAt = new Date();
        await this.restoreStock(order.items);
        break;
    }
  }

  private async getOrderSummary(filter: any): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    const summary = await this.orderModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
        },
      },
    ]);

    const result = summary[0] || { totalOrders: 0, totalRevenue: 0 };

    return {
      ...result,
      averageOrderValue: result.totalOrders > 0 ? result.totalRevenue / result.totalOrders : 0,
    };
  }

  private async getOrderCountByStatus(): Promise<Record<OrderStatus, number>> {
    const statusCounts = await this.orderModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const result: Record<OrderStatus, number> = {} as any;
    Object.values(OrderStatus).forEach((s: OrderStatus) => (result[s] = 0));
    statusCounts.forEach(item => {
      result[item._id] = item.count;
    });
    return result;
  }

  private async getOrderCountByPaymentStatus(): Promise<Record<PaymentStatus, number>> {
    const paymentStatusCounts = await this.orderModel.aggregate([
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
    ]);

    const result: Record<PaymentStatus, number> = {} as any;
    Object.values(PaymentStatus).forEach((s: PaymentStatus) => (result[s] = 0));
    paymentStatusCounts.forEach(item => {
      result[item._id] = item.count;
    });
    return result;
  }

  private async getOrderCountByPaymentMethod(): Promise<Record<any, number>> {
    const paymentMethodCounts = await this.orderModel.aggregate([
      { $group: { _id: '$paymentMethod', count: { $sum: 1 } } },
    ]);

    const result: Record<any, number> = {};
    paymentMethodCounts.forEach(item => {
      result[item._id] = item.count;
    });
    return result;
  }

  private async populateOrder(order: any) {
    return this.orderModel.populate(order, [
      { path: 'customer', select: 'firstName lastName email' },
      { path: 'items.product', select: 'name slug images price' },
      { path: 'appliedCoupon', select: 'code name value type' },
    ]);
  }

private formatOrderResponse(order: any): OrderResponseInterface {
  // Defensive guards
  const items = (order.items || []).map((item: any) => ({
    product: {
      _id: item.product?._id ?? item.product,
      name: item.product?.name ?? item.name ?? '',
      slug: item.product?.slug,
      image: item.product?.images?.[0],
      price: item.product?.price ?? item.price,
    },
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    total: item.total,
    selectedVariants: item.selectedVariants || {},
  }));

  // Determine shippingCost vs shipping metadata (support multiple stored shapes)
  let shippingCost: number | undefined;
  let shippingMeta: any | undefined;

  if (typeof order.shipping === 'number') {
    shippingCost = order.shipping;
  } else if (order.shipping && typeof order.shipping === 'object') {
    shippingMeta = order.shipping;
    // If there's a cost inside the object, prefer that
    if (typeof order.shipping.cost === 'number') {
      shippingCost = order.shipping.cost;
    }
  }

  // fallback to explicit shippingCost field if present
  if (shippingCost === undefined && typeof order.shippingCost === 'number') {
    shippingCost = order.shippingCost;
  }

  return {
    _id: order._id,
    orderNumber: order.orderNumber,
    customer: {
      _id: order.customer?._id ?? order.customer,
      firstName: order.customer?.firstName ?? '',
      lastName: order.customer?.lastName ?? '',
      email: order.customer?.email ?? '',
    },
    items,
    subtotal: order.subtotal ?? 0,
    tax: order.tax ?? 0,
    shipping: shippingCost ?? 0,         // numeric shipping cost (matches OrderResponseInterface if you use 'shipping')
    discount: order.discount ?? 0,
    total: order.total ?? 0,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    paymentId: order.paymentId,
    transactionId: order.transactionId,
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddress,
    appliedCoupon: order.appliedCoupon
      ? {
          _id: order.appliedCoupon._id,
          code: order.appliedCoupon.code,
          name: order.appliedCoupon.name,
          value: order.appliedCoupon.value,
          type: order.appliedCoupon.type,
        }
      : undefined,
    notes: order.notes,
    statusHistory: order.statusHistory || [],
    // include shipping metadata under a different name to avoid conflict
    shippingInfo: shippingMeta ?? order.shippingInfo ?? undefined,
    cancelledAt: order.cancelledAt,
    cancellationReason: order.cancellationReason,
    refundedAt: order.refundedAt,
    refundAmount: order.refundAmount,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  } as any;
}

}
