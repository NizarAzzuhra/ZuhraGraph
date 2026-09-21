import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

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

      const uploadDir = path.join(process.cwd(), "public", "uploads", "portfolio");
      await mkdir(uploadDir, { recursive: true });

      const safeFilename = image.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFilename = `${Date.now()}-${safeFilename}`;
      const filepath = path.join(uploadDir, uniqueFilename);
      
      await writeFile(filepath, buffer);
      imageUrl = `/uploads/portfolio/${uniqueFilename}`;
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

    revalidatePath("/portfolio");
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE PORTFOLIO ERROR:", error);
    return NextResponse.json({ error: "Failed to delete portfolio item." }, { status: 500 });
  }
}
