import { Order, OrderStatus } from '../../domain/entities/Order';
import { OrderRepository } from '../../domain/interfaces/OrderRepository';
import { PaymentGateway } from '../../domain/interfaces/PaymentGateway';
import { NotificationService } from '../../domain/interfaces/NotificationService';
import { PackageRepository } from '../../domain/interfaces/PackageRepository';
import { Payment } from '../../domain/entities/Payment';
import { PaymentRepository } from '../../domain/interfaces/PaymentRepository';
import { v4 as uuidv4 } from 'uuid';

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
    const pkg = await this.packageRepository.findById(packageId);
    if (!pkg) {
      throw new Error('Package not found');
    }
    if (pkg.status !== 'ACTIVE') {
      throw new Error('Package is not active');
    }
    if (!brief || brief.trim() === '') {
      throw new Error('Brief cannot be empty');
    }

    // Anti-double submission check (10 seconds window)
    const tenSecondsAgo = new Date(Date.now() - 10000);
    const recentOrders = await this.orderRepository.findAllByBuyerId(buyerId);
    if (recentOrders && recentOrders.length > 0) {
      const duplicate = recentOrders.find((o: any) => o.packageId === packageId && o.createdAt >= tenSecondsAgo);
      if (duplicate) {
        throw new Error('Duplicate order detected. Please wait a moment before creating another order.');
      }
    }

    const amount = pkg.price;

    // 1. Create domain entity (Status starts as PENDING implicitly in constructor)
    const order = new Order(uuidv4(), buyerId, packageId, amount, brief);
    
    // 2. Transition status to AWAITING_PAYMENT
    order.submit();

    // 3. Persist entity
    await this.orderRepository.save(order);

    // 4. Create Payment domain entity and save BEFORE Midtrans call
    const payment = new Payment(uuidv4(), order.id, amount, 'PENDING', null);
    await this.paymentRepository.save(payment);

    // 5. Initiate payment using Payment.id as Midtrans order_id
    let paymentInfo = null;
    let paymentError = false;
    try {
      paymentInfo = await this.paymentGateway.initiatePayment(payment.id, amount, buyerInfo, order.id);
      
      // 6. Set token and Save Payment again if successful
      payment.setToken(paymentInfo.token);
      await this.paymentRepository.save(payment);
    } catch (error) {
      console.error('Midtrans initiation failed during create order:', error);
      paymentError = true;
      // Order and Payment are already saved. We return partial success.
    }

    // 7. Send notification
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
      await this.notificationService.sendToAdmins('ORDER_COMPLETED', `Pesanan #${order.id} telah diterima dan diselesaikan oleh buyer`, `/admin/orders/${order.id}`);
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

  public async updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    order.adminUpdateStatus(status);
    await this.orderRepository.save(order);
    
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
