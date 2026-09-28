import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageService } from "../../../application/services/PackageService";
import { PrismaPackageRepository } from "../../../infrastructure/repositories/PrismaPackageRepository";
import CheckoutForm from "./CheckoutForm";
import MidtransSnap from "../../../components/MidtransSnap";
import { prisma } from "@/lib/prisma";

import { ACTIVE_COMMISSION_STATUSES } from "../../../domain/entities/Order";

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

  // Cek ketersediaan slot antrean aktif
  const activeOrdersCount = await prisma.order.count({
    where: {
      packageId: pkg.id,
      status: { in: ACTIVE_COMMISSION_STATUSES as any },
    },
  });

  const remainingSlots = Math.max(0, pkg.maxActiveSlots - activeOrdersCount);
  const isCommissionOpen = pkg.isAcceptingOrders && remainingSlots > 0;

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
    isAcceptingOrders: pkg.isAcceptingOrders,
    maxActiveSlots: pkg.maxActiveSlots,
    remainingSlots,
    isOpen: isCommissionOpen
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

          {/* Heading Utama */}
          <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-gray-900">
            Ceritakan tentang proyek Anda
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            Berikan detail dan referensi yang kami perlukan untuk membuat commission Anda.
          </p>

          {/* Tampilan Jika Komisi Ditutup / Slot Penuh */}
          {!isCommissionOpen ? (
            <div className="bg-white border border-[#E8E0D5] rounded-2xl p-8 sm:p-12 shadow-sm text-center max-w-2xl mx-auto my-8">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-3xl">block</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Komisi Sedang Ditutup
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {!pkg.isAcceptingOrders 
                  ? "Artist saat ini sedang tidak menerima pesanan baru untuk paket ini." 
                  : `Antrean untuk paket ini sedang penuh (${activeOrdersCount} dari maksimal ${pkg.maxActiveSlots} pesanan aktif). Silakan coba lagi nanti setelah slot pesanan tersedia kembali.`}
              </p>
              <div className="flex justify-center gap-4">
                <Link
                  href="/packages"
                  className="bg-[#9D4B36] hover:bg-[#853E2C] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  Lihat Paket Lainnya
                </Link>
              </div>
            </div>
          ) : (
            /* Komponen Form Pemesanan jika Komisi Dibuka */
            <CheckoutForm packageData={packageData} />
          )}

        </div>
      </main>
    </>
  );
}
