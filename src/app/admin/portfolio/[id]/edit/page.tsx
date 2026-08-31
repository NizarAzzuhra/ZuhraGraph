import { prisma } from "@/lib/prisma";
import EditPortfolioForm from "@/components/admin/EditPortfolioForm";
import { notFound } from "next/navigation";

export default async function EditPortfolioPage(props: { params: Promise<{ id: string }> }) {
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
