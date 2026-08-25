import { OrderStatus } from '../entities/Order';
import { PaymentStatus } from '../entities/Payment';

export interface OrderSummaryDTO {
  id: string;
  packageId: string;
  packageName: string;
  buyerName: string;
  buyerEmail: string;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus | null;
  createdAt: Date;
  updatedAt: Date;
}
