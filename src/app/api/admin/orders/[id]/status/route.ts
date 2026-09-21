import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdminApi();
    if (error) return error;

    // Await params properly for Next.js 15+
    const { id } = await context.params;

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required." }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: { buyer: true },
    });

    // Create Notification for the Buyer
    await prisma.notification.create({
      data: {
        userId: updatedOrder.buyerId,
        type: 'SYSTEM',
        content: `Pesanan Anda (ID: ...${id.slice(-8)}) kini dalam status: ${status.replace(/_/g, " ")}.`,
        status: 'UNREAD',
      },
    });

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error: any) {
    console.error("ORDER STATUS UPDATE ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update order status." },
      { status: 500 }
    );
  }
}
