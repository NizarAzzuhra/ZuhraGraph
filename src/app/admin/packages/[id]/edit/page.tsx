import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/auth";
import EditPackageForm from "@/components/admin/EditPackageForm";
import { notFound } from "next/navigation";

export default async function EditPackagePage(props: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
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
    features: pkg.features,
  };

  return <EditPackageForm initialData={initialData} />;
}
