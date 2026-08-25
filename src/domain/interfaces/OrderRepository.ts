import { Order } from '../entities/Order';

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
  findAllByBuyerId(buyerId: string): Promise<Order[]>;
  findListByBuyerId(buyerId: string): Promise<import('./OrderSummaryDTO').OrderSummaryDTO[]>;
  findAllList(): Promise<import('./OrderSummaryDTO').OrderSummaryDTO[]>;
}
