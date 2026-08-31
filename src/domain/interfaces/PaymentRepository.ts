import { Payment } from '../entities/Payment';
import { Order } from '../entities/Order';export interface PaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment | null>;
  findAllByOrderId(orderId: string): Promise<Payment[]>;
  save(payment: Payment): Promise<void>;
  saveWithOrder?(payment: Payment, order: Order): Promise<void>;
}
