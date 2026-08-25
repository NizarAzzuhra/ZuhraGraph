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
  };

  const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

  return (
    <>
      {/* Load Midtrans Script */}
      <MidtransSnap clientKey={midtransClientKey} />
      
      {/* Mobile Header (Simplified for task-focused flow) */}
      <header className="md:hidden sticky top-0 z-50 bg-surface/90 backdrop-blur-md px-margin-mobile py-4 flex items-center justify-between border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <Link href="/packages" className="p-2 -ml-2 text-on-surface rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
          </Link>
          <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Komisi / Brief</span>
        </div>
        <span className="text-body-md font-body-md font-semibold text-on-surface">Pesanan</span>
      </header>

      <main className="flex-grow px-margin-mobile md:px-gutter max-w-container-max mx-auto w-full py-8 md:py-margin-desktop flex flex-col gap-8 pb-32 md:pb-margin-desktop">
        
        <div className="mb-12">
          <div className="flex items-center gap-2 text-caption font-caption text-on-surface-variant mb-6">
            <Link href="/packages" className="hover:text-primary transition-colors">Paket</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <Link href={`/packages#${packageData.id}`} className="hover:text-primary transition-colors">{packageData.name}</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface font-medium">Pesanan</span>
          </div>
          <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg-mobile md:font-display-lg text-on-surface mb-4">
            Ceritakan tentang proyek Anda
          </h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant max-w-3xl">
            Berikan detail dan referensi yang kami perlukan untuk membuat commission Anda.
          </p>
        </div>

        <CheckoutForm packageData={packageData} />
      </main>
    </>
  );
}
