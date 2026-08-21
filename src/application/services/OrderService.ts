import { Order } from '../../domain/entities/Order';
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
    const amount = pkg.price;

    // 1. Create domain entity (Status starts as PENDING implicitly in constructor)
    const order = new Order(uuidv4(), buyerId, packageId, amount, brief);
    
    // 2. Transition status to AWAITING_PAYMENT
    order.submit();

    // 3. Persist entity
    await this.orderRepository.save(order);

    // 4. Create Payment domain entity
    const payment = new Payment(uuidv4(), order.id, amount, 'PENDING', null);

    // 5. Save Payment
    await this.paymentRepository.save(payment);

    // 6. Initiate payment
    const paymentInfo = await this.paymentGateway.initiatePayment(order.id, amount, buyerInfo);

    // 7. Send notification
    await this.notificationService.sendNotification(buyerId, 'ORDER_CREATED', `Order ${order.id} created. Please complete payment.`);

    return { order, paymentInfo };
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
}
