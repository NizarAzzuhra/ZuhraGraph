import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { OrderService } from "@/application/services/OrderService";
import { PrismaOrderRepository } from "@/infrastructure/repositories/PrismaOrderRepository";
import { PrismaPackageRepository } from "@/infrastructure/repositories/PrismaPackageRepository";
import { PrismaPaymentRepository } from "@/infrastructure/repositories/PrismaPaymentRepository";
import { MidtransPaymentGateway } from "@/infrastructure/payment/MidtransPaymentGateway";
import { PrismaNotificationService } from "@/infrastructure/services/PrismaNotificationService";
import { OrderStatus } from "@/domain/entities/Order";

const orderRepository = new PrismaOrderRepository();
const packageRepository = new PrismaPackageRepository();
const paymentRepository = new PrismaPaymentRepository();
const paymentGateway = new MidtransPaymentGateway();
const notificationService = new PrismaNotificationService();

const orderService = new OrderService(
  orderRepository,
  packageRepository,
  paymentRepository,
  paymentGateway,
  notificationService
);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAdminApi();
    if (error) return error;

    const adminId = (session?.user as any)?.id;
    const { id } = await context.params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ success: false, message: "Status is required." }, { status: 400 });
    }

    const updatedOrder = await orderService.updateOrderStatus(id, status as OrderStatus, adminId);

    return NextResponse.json({
      success: true,
      message: `Status pesanan berhasil diubah menjadi ${status}.`,
      data: updatedOrder,
    }, { status: 200 });
  } catch (error: any) {
    console.error("ORDER STATUS UPDATE ERROR:", error);
    const isValidationError = error.message?.includes("Transisi status tidak valid") || error.message?.includes("not found");
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memperbarui status pesanan." },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
