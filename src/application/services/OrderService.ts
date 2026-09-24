import { Order, OrderStatus, ACTIVE_COMMISSION_STATUSES } from '../../domain/entities/Order';
import { OrderRepository } from '../../domain/interfaces/OrderRepository';
import { PaymentGateway } from '../../domain/interfaces/PaymentGateway';
import { NotificationService } from '../../domain/interfaces/NotificationService';
import { PackageRepository } from '../../domain/interfaces/PackageRepository';
import { Payment } from '../../domain/entities/Payment';
import { PaymentRepository } from '../../domain/interfaces/PaymentRepository';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../lib/prisma';

export class OrderService {
  // Dependency Injection via constructor
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly packageRepository: PackageRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly notificationService: NotificationService
  ) {}

  public async createOrder(buyerId: string, packageId: string, brief: string, buyerInfo: any) {
    if (!brief || brief.trim() === '') {
      throw new Error('Brief cannot be empty');
    }

    // Eksekusi pemeriksaan slot dan pembuatan pesanan dalam satu transaksi atomik
    const { order, payment } = await prisma.$transaction(async (tx) => {
      const pkgData = await tx.package.findFirst({
        where: { id: packageId, deletedAt: null }
      });

      if (!pkgData) {
        throw new Error('Package not found');
      }
      if (pkgData.status !== 'ACTIVE') {
        throw new Error('Package is not active');
      }
      if (!pkgData.isAcceptingOrders) {
        throw new Error('Komisi untuk paket ini sedang ditutup oleh artist.');
      }

      // Cek ketersediaan antrean/slot aktif di dalam transaksi
      const activeOrdersCount = await tx.order.count({
        where: {
          packageId: pkgData.id,
          status: { in: ACTIVE_COMMISSION_STATUSES as any },
        },
      });

      if (activeOrdersCount >= pkgData.maxActiveSlots) {
        throw new Error('Antrean komisi untuk paket ini sedang penuh.');
      }

      // Anti-double submission check (10 seconds window) di dalam transaksi
      const tenSecondsAgo = new Date(Date.now() - 10000);
      const duplicate = await tx.order.findFirst({
        where: {
          buyerId,
          packageId,
          createdAt: { gte: tenSecondsAgo }
        }
      });
      if (duplicate) {
        throw new Error('Duplicate order detected. Please wait a moment before creating another order.');
      }

      const amount = pkgData.price.toNumber();
      const orderId = uuidv4();
      const paymentId = uuidv4();

      // Buat data pesanan
      const newOrderRecord = await tx.order.create({
        data: {
          id: orderId,
          buyerId,
          packageId,
          status: 'AWAITING_PAYMENT',
          totalAmount: amount,
          brief,
        }
      });

      // Buat data pembayaran
      const newPaymentRecord = await tx.payment.create({
        data: {
          id: paymentId,
          orderId,
          amount,
          status: 'PENDING',
        }
      });

      const orderEntity = new Order(
        newOrderRecord.id,
        newOrderRecord.buyerId,
        newOrderRecord.packageId,
        Number(newOrderRecord.totalAmount),
        newOrderRecord.brief,
        newOrderRecord.status as OrderStatus,
        newOrderRecord.createdAt
      );

      const paymentEntity = new Payment(
        newPaymentRecord.id,
        newPaymentRecord.orderId,
        Number(newPaymentRecord.amount),
        newPaymentRecord.status as any,
        null
      );

      return { order: orderEntity, payment: paymentEntity };
    });

    // Inisiasi pembayaran ke Midtrans di luar transaksi database
    let paymentInfo = null;
    let paymentError = false;
    try {
      paymentInfo = await this.paymentGateway.initiatePayment(payment.id, payment.amount, buyerInfo, order.id);
      payment.setToken(paymentInfo.token);
      await this.paymentRepository.save(payment);
    } catch (error) {
      console.error('Midtrans initiation failed during create order:', error);
      paymentError = true;
    }

    // Kirim notifikasi
    await this.notificationService.sendNotification(buyerId, 'ORDER_CREATED', `Order ${order.id} created. Please complete payment.`);
    if (this.notificationService.sendToAdmins) {
      await this.notificationService.sendToAdmins('ORDER_CREATED', `Pesanan baru masuk dari ${buyerInfo?.name || 'Buyer'}`, `/admin/orders/${order.id}`);
    }

    return { order, paymentInfo, paymentError };
  }

  public async handlePaymentSuccess(orderId: string, transactionId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.markAsPaid();
    await this.orderRepository.save(order);
    
    await this.notificationService.sendNotification(order.buyerId, 'PAYMENT_SUCCESS', `Payment for order ${order.id} was successful.`);
  }

  public async confirmOrder(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.confirm();
    await this.orderRepository.save(order);
    
    await this.notificationService.sendNotification(order.buyerId, 'ORDER_CONFIRMED', `Order ${order.id} has been confirmed.`);
    
    return order;
  }

  public async startProcessing(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.startProcessing();
    await this.orderRepository.save(order);
    
    return order;
  }

  public async requestBuyerConfirmation(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.requestBuyerConfirmation();
    await this.orderRepository.save(order);
    
    return order;
  }

  public async completeOrder(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.complete();
    await this.orderRepository.save(order);
    
    await this.notificationService.sendNotification(order.buyerId, 'ORDER_COMPLETED', `Order ${order.id} has been completed.`);
    if (this.notificationService.sendToAdmins) {
      try {
        const buyer = await prisma.user.findUnique({ where: { id: order.buyerId } });
        const buyerName = buyer?.name || 'Klien';
        await this.notificationService.sendToAdmins('ORDER_COMPLETED', `Klien ${buyerName} telah menyetujui hasil akhir pesanan #${order.id}.`, `/admin/orders/${order.id}`);
      } catch (e) {
        console.error("Failed to fetch buyer for notification", e);
        await this.notificationService.sendToAdmins('ORDER_COMPLETED', `Klien telah menyetujui hasil akhir pesanan #${order.id}.`, `/admin/orders/${order.id}`);
      }
    }
    
    return order;
  }

  public async cancelOrder(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.cancel();
    await this.orderRepository.save(order);
    
    return order;
  }

  public async getOrderDetails(orderId: string, buyerId: string, userRole?: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.buyerId !== buyerId && userRole !== 'ADMIN') {
      throw new Error('Unauthorized access to order');
    }

    const packageData = await this.packageRepository.findById(order.packageId);
    if (!packageData) {
      throw new Error('Package associated with order not found');
    }

    return {
      order,
      package: packageData
    };
  }

  public async getBuyerOrders(buyerId: string) {
    return this.orderRepository.findListByBuyerId(buyerId);
  }

  public async getAllOrders() {
    return this.orderRepository.findAllList();
  }

  public async getAllOrdersForAdmin() {
    return this.orderRepository.findAllForAdmin();
  }

  public async updateOrderStatus(orderId: string, status: OrderStatus, adminId?: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    const previousStatus = order.getStatus();
    order.adminUpdateStatus(status);
    await this.orderRepository.save(order);

    // Record to OrderStatusHistory
    try {
      await prisma.orderStatusHistory.create({
        data: {
          id: uuidv4(),
          orderId: order.id,
          status: status as any,
        }
      });
    } catch (e) {
      console.error('Failed to log order status history:', e);
    }

    // Record audit log with admin ID, previous status, and new status
    try {
      await prisma.auditLog.create({
        data: {
          id: uuidv4(),
          userId: adminId || null,
          activityType: 'ORDER_STATUS_CHANGED',
          entityType: 'Order',
          entityId: order.id,
          detail: JSON.stringify({
            fromStatus: previousStatus,
            toStatus: status,
            changedByAdminId: adminId || 'SYSTEM',
            changedAt: new Date().toISOString()
          })
        }
      });
    } catch (e) {
      console.error('Failed to log audit log for order status change:', e);
    }

    // Send notification to buyer
    await this.notificationService.sendNotification(
      order.buyerId,
      'SYSTEM',
      `Pesanan Anda (ID: ...${order.id.slice(-8)}) kini dalam status: ${status.replace(/_/g, ' ')}.`
    );
    
    return order;
  }

  public async submitArtwork(orderId: string, url: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.uploadArtwork(); // Validates state transition

    const count = await this.orderRepository.getArtworkCount(orderId);
    await this.orderRepository.addArtwork(orderId, url, count);

    await this.notificationService.sendNotification(order.buyerId, 'ARTWORK_UPLOADED', `Artwork for order ${order.id} has been uploaded.`);
    
    return order;
  }
}
