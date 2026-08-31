import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") as string;
    const maxActiveSlots = formData.get("maxActiveSlots") as string;
    const image = formData.get("image") as File | null;

    if (!name || !price) {
      return NextResponse.json({ error: "Name and Price are required" }, { status: 400 });
    }

    let imageUrl = null;

    if (image && image.size > 0) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create unique filename
      const ext = path.extname(image.name) || '.jpg';
      const filename = `${uuidv4()}${ext}`;
      const uploadDir = path.join(process.cwd(), "public/uploads/packages");
      const filePath = path.join(uploadDir, filename);

      // Ensure directory exists
      await mkdir(uploadDir, { recursive: true });

      // Save file
      await writeFile(filePath, buffer);
      
      // The public URL path
      imageUrl = `/uploads/packages/${filename}`;
    }

    const newPackage = await prisma.package.create({
      data: {
        name,
        description,
        price: Number(price),
        maxActiveSlots: Number(maxActiveSlots || 3),
        isAcceptingOrders: true,
        imageUrl,
      },
    });

    revalidatePath("/packages");

    return NextResponse.json(newPackage, { status: 201 });
  } catch (error: any) {
    console.error("CREATE PACKAGE ERROR:", error);
    return NextResponse.json({ error: "Failed to create package." }, { status: 500 });
  }
}
