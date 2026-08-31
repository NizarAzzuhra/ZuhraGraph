import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    const portfolios = await prisma.portfolio.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(portfolios);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch portfolio" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;
    const image = formData.get("image") as File | null;

    let imageUrl = null;

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

    const newPortfolio = await prisma.portfolio.create({
      data: {
        title,
        category,
        description,
        imageUrl,
      },
    });

    revalidatePath("/admin/portfolio");
    revalidatePath("/portofolio");
    revalidatePath("/portfolio");

    return NextResponse.json(newPortfolio, { status: 201 });
  } catch (error: any) {
    console.error("PORTFOLIO ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat portofolio." },
      { status: 500 }
    );
  }
}
