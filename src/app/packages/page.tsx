import React from 'react';
import Link from 'next/link';
import { PackageService } from "../../application/services/PackageService";
import { PrismaPackageRepository } from "../../infrastructure/repositories/PrismaPackageRepository";

export const dynamic = 'force-dynamic';

export default async function PackagesPage() {
  const packageRepository = new PrismaPackageRepository();
  const packageService = new PackageService(packageRepository);
  
  // Get packages with calculated availability
  const activePackages = await packageService.getPackagesWithAvailability();

  // Hardcode the images from the HTML design based on the package name
  const getPackageImage = (name: string) => {
    if (name.includes('Anime')) {
      return "https://lh3.googleusercontent.com/aida-public/AB6AXuAeWytWq_Xx_30SrVmTbRbDZh5mvpuPOfbyKOeXLDVRcxuVO9nwaNLlHRZrbF2aA8R76Evhq6mWAHXHaCWYSWhxS-Hq_znDXUwzIXii9_Vd081gzZhzMZSgSD8Pp5WQ-Irv1tcUfp7aMcUJTSPR0is8TqzqswJml43YcThADd-CJqncozCSTLHgv8jfZLWkrw-mKPNHCeqc9dLmGyjqmBav6TzCvQOL6C8A0N3dUhWtShCsf3Sy3BjLNA";
    }
    return "https://lh3.googleusercontent.com/aida-public/AB6AXuDNheLr_DxcEhq2dGhtPBV8EUeqz80ztyvCR_tzPeN1D9nb0iNGkIfQodvUJ5AqYc3oMqu7npE454MN4azctaaH3Hm2LctM68xB3RDkaREY5BRE5h34_s0_j3EdqvyYV9hM-oe4nZR5CD8Kwxo2Nt_F8-K9Y6l4VmD8cIbCPFmmiidaquYuxKmsfbk4rJN7Y_ETgyWYgPgMVnPSJGEPkGyM208k_6T7OKDPDdOdJWAs3Ds1eeoZ04Rnsw";
  };

  const getPackageFeatures = (name: string) => {
    if (name.includes('Anime')) {
      return [
        "1 Fully rendered character",
        "High-res source file (.PSD)",
        "Commercial use license option"
      ];
    }
    return [
      "Custom 3D typography/scene",
      "Multiple lighting variations",
      "4K resolution output"
    ];
  };

  return (
    <>
      <section className="w-full px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)] py-16 md:py-32 max-w-[var(--spacing-container-max)] mx-auto border-b border-[#E8E0D5]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-[var(--spacing-gutter)]">
          <div className="md:col-span-8 md:col-start-3 text-center flex flex-col gap-8 items-center">
            <span className="text-label-md font-label-md uppercase tracking-widest text-[#9D4B36] border border-[#E8E0D5] px-4 py-2 rounded-full bg-[#FFFFFF]">
              Open for Commissions
            </span>
            <h1 className="text-4xl md:text-[64px] font-display-lg text-[#1F1C18] leading-tight font-bold">
              Bespoke Digital Artworks
            </h1>
            <p className="text-lg font-body-lg text-[#7A7067] max-w-2xl mx-auto">
              Elevate your digital presence with custom-crafted graphics. I specialize in highly detailed Anime illustrations and immersive Cinema 4D designs, tailored meticulously to your vision.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)] py-[var(--spacing-section-gap)] max-w-[var(--spacing-container-max)] mx-auto">
        <h2 className="text-3xl md:text-[32px] font-headline-lg font-semibold mb-16 text-center text-[#1F1C18]">
          Available Packages
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
          {activePackages.length === 0 ? (
            <div className="col-span-2 text-center text-[#7A7067]">No active packages currently available.</div>
          ) : (
            activePackages.map((pkg) => (
              <div key={pkg.id} className="bg-[#FFFFFF] border border-[#E8E0D5] p-8 md:p-12 flex flex-col gap-8 group hover:border-[#9D4B36] transition-colors duration-300 rounded-2xl relative overflow-hidden">
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                  {pkg.isOpen ? (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full shadow-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        COMMISSION OPEN ({pkg.remainingSlots} of {pkg.maxActiveSlots} Slots Available)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-[#FDF5F3] border border-[#F4E3DF] text-[#9D4B36] px-3 py-1.5 rounded-full shadow-sm">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#9D4B36]"></span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        COMMISSION CLOSED ({pkg.isAcceptingOrders ? 'Queue Full' : 'Unavailable'})
                      </span>
                    </div>
                  )}
                </div>

                <div className="w-full h-auto max-h-[300px] flex items-center justify-center bg-[#F4EFEA] overflow-hidden border border-[#E8E0D5] relative rounded-xl">
                  <img 
                    className="w-full h-full max-h-[300px] object-contain group-hover:scale-105 transition-transform duration-700 ease-in-out" 
                    alt={pkg.name} 
                    src={pkg.imageUrl || getPackageImage(pkg.name)} 
                  />
                  <div className="absolute inset-0 bg-[#1F1C18] opacity-10 group-hover:opacity-0 transition-opacity pointer-events-none"></div>
                </div>
                
                <div className="flex-grow">
                  <h3 className="text-2xl font-bold mb-2 text-[#1F1C18]">{pkg.name}</h3>
                  <p className="text-base text-[#7A7067] mb-6">
                    {pkg.description}
                  </p>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-label-md text-[#1F1C18] mb-3 uppercase tracking-wider font-semibold">
                        What you get
                      </h4>
                      <ul className="space-y-2 text-base text-[#7A7067]">
                        {getPackageFeatures(pkg.name).map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-[#9D4B36] text-sm mt-1">check</span> 
                            {feat}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#E8E0D5] mt-auto">
                  <p className="text-2xl font-bold text-[#1F1C18] mb-6">
                    Starting at Rp {pkg.price.toLocaleString('id-ID')}
                  </p>
                  
                  {pkg.isOpen ? (
                    <Link 
                      href={`/packages/${pkg.id}`}
                      className="flex items-center justify-center w-full bg-[#9D4B36] hover:bg-[#853E2C] text-white px-6 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 shadow-sm"
                    >
                      Pesan Sekarang
                    </Link>
                  ) : (
                    <button 
                      disabled
                      className="flex items-center justify-center w-full bg-[#F4EFEA] text-[#7A7067] border border-[#E8E0D5] px-6 py-4 rounded-xl text-sm font-bold uppercase tracking-wider cursor-not-allowed opacity-80"
                    >
                      Pesanan Ditutup
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
