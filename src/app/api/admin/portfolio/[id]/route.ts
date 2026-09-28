import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { CloudinaryStorageService } from "@/infrastructure/storage/CloudinaryStorageService";

const storageService = new CloudinaryStorageService();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdminApi();
    if (error) return error;

    const { id } = await context.params;
    const formData = await request.formData();
    
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const image = formData.get("image") as File | null;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    let imageUrl;

    if (image && image.name && image.size > 0) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadResult = await storageService.uploadImage(buffer, "portfolio");
      imageUrl = uploadResult.url;
    }

    const updateData: any = { 
      title, 
      description,
      category 
    };
    
    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    const updatedPortfolio = await prisma.portfolio.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/portfolio");
    revalidatePath("/portofolio");
    revalidatePath("/portfolio");
    return NextResponse.json(updatedPortfolio);
  } catch (error: any) {
    console.error("EDIT PORTFOLIO ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update portfolio item." },
      { status: 500 }
    );
  }
}

export const PUT = PATCH;

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdminApi();
    if (error) return error;

    const { id } = await context.params;

    await prisma.portfolio.delete({
      where: { id },
    });

    revalidatePath("/admin/portfolio");
    revalidatePath("/portofolio");
    revalidatePath("/portfolio");
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE PORTFOLIO ERROR:", error);
    return NextResponse.json({ error: "Failed to delete portfolio item." }, { status: 500 });
  }
}
