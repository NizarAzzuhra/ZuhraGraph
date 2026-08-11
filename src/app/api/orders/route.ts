import { OrderController } from '../../../presentation/controllers/OrderController';

export async function POST(req: Request) {
  return OrderController.createOrder(req);
}
