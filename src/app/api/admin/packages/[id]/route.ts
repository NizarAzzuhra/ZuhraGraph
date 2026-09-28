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

    // 1. Await params for Next.js 15+
    const { id } = await context.params;

    // 2. Parse FormData
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = Number(formData.get("price"));
    const maxActiveSlots = Number(formData.get("maxActiveSlots"));
    
    // File can be null or a File object
    const image = formData.get("image") as File | null;
    const featuresRaw = formData.get("features") as string;

    let imageUrl;

    // 3. Handle File Upload Safely via Cloudinary
    if (image && image.name && image.size > 0) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadResult = await storageService.uploadImage(buffer, "packages");
      imageUrl = uploadResult.url;
    }

    // 4. Prepare Update Object
    const updateData: any = { 
      name, 
      description, 
      price, 
      maxActiveSlots 
    };
    
    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    if (featuresRaw !== null) {
      try {
        const parsed = JSON.parse(featuresRaw);
        if (Array.isArray(parsed)) {
          const filteredFeatures = parsed.filter((f: string) => typeof f === 'string' && f.trim() !== '');
          updateData.features = {
            set: filteredFeatures
          };
        }
      } catch (e) {
        console.warn("Failed to parse features JSON");
      }
    }

    // 5. Update Database
    const updatedPackage = await prisma.package.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/packages");
    revalidatePath(`/packages/${id}`);
    revalidatePath("/admin/packages");

    return NextResponse.json(updatedPackage);
  } catch (error: any) {
    console.error("EDIT PACKAGE ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui paket komisi." },
      { status: 500 }
    );
  }
}

// Alias PUT to PATCH for compatibility
export const PUT = PATCH;

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdminApi();
    if (error) return error;

    const { id } = await context.params;

    // Gracefully handle constraints: check if package is used in any orders
    const ordersCount = await prisma.order.count({ where: { packageId: id } });
    if (ordersCount > 0) {
      return NextResponse.json(
        { error: "Gagal menghapus: Paket ini sedang digunakan oleh pesanan klien. Silakan Tutup Komisi sebagai gantinya." },
        { status: 400 }
      );
    }

    await prisma.package.delete({
      where: { id },
    });

    revalidatePath("/packages");
    revalidatePath(`/packages/${id}`);
    revalidatePath("/admin/packages");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE PACKAGE ERROR:", error);
    return NextResponse.json({ error: "Gagal menghapus paket dari database." }, { status: 500 });
  }
}
