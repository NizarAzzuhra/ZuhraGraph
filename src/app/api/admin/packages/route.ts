import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { CloudinaryStorageService } from "@/infrastructure/storage/CloudinaryStorageService";

const storageService = new CloudinaryStorageService();

export async function POST(request: Request) {
  try {
    const { error } = await requireAdminApi();
    if (error) return error;

    const formData = await request.formData();
    
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") as string;
    const maxActiveSlots = formData.get("maxActiveSlots") as string;
    const image = formData.get("image") as File | null;
    const featuresRaw = formData.get("features") as string;

    if (!name || !price) {
      return NextResponse.json({ error: "Name and Price are required" }, { status: 400 });
    }

    let imageUrl = null;

    if (image && image.size > 0) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadResult = await storageService.uploadImage(buffer, "packages");
      imageUrl = uploadResult.url;
    }

    let features: string[] = [];
    if (featuresRaw) {
      try {
        const parsed = JSON.parse(featuresRaw);
        if (Array.isArray(parsed)) {
          features = parsed.filter((f: string) => f.trim() !== '');
        }
      } catch (e) {
        console.warn("Failed to parse features JSON");
      }
    }

    const newPackage = await prisma.package.create({
      data: {
        name,
        description,
        price: Number(price),
        maxActiveSlots: Number(maxActiveSlots || 3),
        isAcceptingOrders: true,
        imageUrl,
        features,
      },
    });

    revalidatePath("/packages");
    revalidatePath("/admin/packages");

    return NextResponse.json(newPackage, { status: 201 });
  } catch (error: any) {
    console.error("CREATE PACKAGE ERROR:", error);
    return NextResponse.json({ error: "Failed to create package." }, { status: 500 });
  }
}
