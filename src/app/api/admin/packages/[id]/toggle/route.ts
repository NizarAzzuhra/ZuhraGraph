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

    // AWAIT THE PARAMS FIRST (Next.js 15+ requirement)
    const { id } = await context.params;

    const body = await request.json();
    const { isAcceptingOrders, maxActiveSlots } = body;

    const updateData: any = {};
    if (isAcceptingOrders !== undefined) updateData.isAcceptingOrders = isAcceptingOrders;
    if (maxActiveSlots !== undefined) updateData.maxActiveSlots = maxActiveSlots;

    const updatedPackage = await prisma.package.update({
      where: { id: id },
      data: updateData,
    });

    return NextResponse.json(updatedPackage, { status: 200 });
  } catch (error: any) {
    console.error("TOGGLE ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui status komisi di database." },
      { status: 500 }
    );
  }
}
