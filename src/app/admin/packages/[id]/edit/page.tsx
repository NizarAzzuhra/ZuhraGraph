import { prisma } from "@/lib/prisma";
import EditPackageForm from "@/components/admin/EditPackageForm";
import { notFound } from "next/navigation";

export default async function EditPackagePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const pkg = await prisma.package.findUnique({
    where: { id },
  });

  if (!pkg) {
    notFound();
  }

  const initialData = {
    id: pkg.id,
    name: pkg.name,
    description: pkg.description,
    price: Number(pkg.price),
    maxActiveSlots: pkg.maxActiveSlots,
    imageUrl: pkg.imageUrl,
  };

  return <EditPackageForm initialData={initialData} />;
}
