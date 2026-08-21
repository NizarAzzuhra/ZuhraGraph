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

  const midtransClientKey = process.env.MIDTRANS_CLIENT_KEY || "";

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D2D2D] font-sans selection:bg-[#E07A5F] selection:text-white pb-24">
      {/* Load Midtrans Script */}
      <MidtransSnap clientKey={midtransClientKey} />
      
      {/* Navigation Bar */}
      <nav className="w-full py-6 px-8 flex justify-between items-center border-b border-[#2D2D2D]/10 bg-[#FDFBF7] sticky top-0 z-10">
        <div className="font-bold text-xl tracking-tighter">ZUHRA GRAPH.</div>
        <div className="flex gap-6 items-center text-sm font-medium">
          <Link href="/" className="hover:text-[#E07A5F] transition-colors">Home</Link>
          <Link href="/packages" className="text-[#E07A5F]">Commissions</Link>
          <Link href="/testSession" className="hover:text-[#E07A5F] transition-colors">My Dashboard</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 mt-16 flex flex-col md:flex-row gap-16">
        
        {/* Left Column: Package Info */}
        <div className="flex-1 md:w-1/2">
          <Link href="/packages" className="inline-flex items-center text-sm font-semibold text-[#2D2D2D]/60 hover:text-[#E07A5F] mb-8 transition-colors">
            <span className="mr-2">←</span> Back to Packages
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6 leading-tight">
            {pkg.name}
          </h1>
          
          <div className="inline-block bg-[#F4F4F5] px-4 py-2 rounded-full text-sm font-medium mb-8">
            {pkg.slot} Commission Slots Available
          </div>

          <div className="prose prose-zinc max-w-none text-[#2D2D2D]/80 leading-relaxed">
            <h3 className="text-lg font-semibold text-[#2D2D2D] mb-3">Package Description</h3>
            <p className="whitespace-pre-wrap">{pkg.description || "No specific details provided for this package. Please include your detailed requests in the brief."}</p>
          </div>
          
          <div className="mt-12 p-6 bg-white border border-[#2D2D2D]/10 rounded-2xl shadow-sm">
            <h3 className="text-sm font-semibold tracking-wider text-[#2D2D2D]/60 mb-2">BASE PRICE</h3>
            <div className="text-3xl font-bold">
              Rp {Number(pkg.price).toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-[#2D2D2D]/50 mt-2">
              Price may increase depending on complexity requested in the brief.
            </p>
          </div>
        </div>

        {/* Right Column: Checkout Form */}
        <div className="flex-1 md:w-1/2">
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-[#2D2D2D]/5 border border-[#2D2D2D]/10 sticky top-32">
            <h2 className="text-2xl font-semibold tracking-tight border-b border-[#2D2D2D]/10 pb-4">
              Start Your Commission
            </h2>
            
            <CheckoutForm packageData={pkg} />
          </div>
        </div>

      </main>
    </div>
  );
}
