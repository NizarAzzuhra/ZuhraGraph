import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageService } from "../../../application/services/PackageService";
import { PrismaPackageRepository } from "../../../infrastructure/repositories/PrismaPackageRepository";
import CheckoutForm from "./CheckoutForm";
import MidtransSnap from "../../../components/MidtransSnap";

// Initialize service
const packageRepository = new PrismaPackageRepository();
const packageService = new PackageService(packageRepository);

export default async function PackageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const packageId = resolvedParams.id;
  
  const pkg = await packageService.getPackageById(packageId);

  if (!pkg || pkg.status !== 'ACTIVE') {
    notFound();
  }

  // Convert domain entity (class instance) to a plain serializable object
  // to prevent Next.js Server-to-Client serialization errors.
  const packageData = {
    id: pkg.id,
    name: pkg.name,
    description: pkg.description ?? "",
    price: Number(pkg.price),
    status: pkg.status,
    slot: Number(pkg.slot),
    imageUrl: pkg.imageUrl ?? "",
  };

  const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

  return (
    <>
      {/* Load Midtrans Script */}
      <MidtransSnap clientKey={midtransClientKey} />

      <main className="min-h-screen bg-[#FAF6F0] text-[#1F1C18] antialiased font-sans pb-20">
        <div className="max-w-6xl mx-auto px-6 pt-12">
          
          {/* Breadcrumb */}
          <div className="text-sm text-gray-500 mb-8 flex items-center space-x-2">
            <Link href="/packages" className="hover:text-[var(--color-primary)] transition-colors">Paket</Link>
            <span className="text-gray-400">&gt;</span>
            <Link href={`/packages/${packageData.id}`} className="hover:text-[var(--color-primary)] transition-colors">{packageData.name}</Link>
            <span className="text-gray-400">&gt;</span>
            <span className="text-[var(--color-primary)] font-medium">Pesanan</span>
          </div>

          {/* Heading Utama yang Seharusnya Besar */}
          <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-gray-900">
            Ceritakan tentang proyek Anda
          </h1>
          <p className="text-gray-600 mb-12 text-lg">
            Berikan detail dan referensi yang kami perlukan untuk membuat commission Anda.
          </p>

          {/* Komponen Form yang sudah diperbarui */}
          <CheckoutForm packageData={packageData} />

        </div>
      </main>
    </>
  );
}
