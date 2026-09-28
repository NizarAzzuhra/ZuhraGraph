import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/auth";
import EditPortfolioForm from "@/components/admin/EditPortfolioForm";
import { notFound } from "next/navigation";

export default async function EditPortfolioPage(props: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await props.params;

  const portfolio = await prisma.portfolio.findUnique({
    where: { id },
  });

  if (!portfolio) {
    notFound();
  }

  const initialData = {
    id: portfolio.id,
    title: portfolio.title,
    description: portfolio.description,
    category: portfolio.category,
    imageUrl: portfolio.imageUrl,
  };

  return <EditPortfolioForm initialData={initialData} />;
}
