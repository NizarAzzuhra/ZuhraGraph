import React from 'react';
import Link from 'next/link';
import { PackageService } from "../../application/services/PackageService";
import { PrismaPackageRepository } from "../../infrastructure/repositories/PrismaPackageRepository";

export const dynamic = 'force-dynamic';

export default async function PackagesPage() {
  const packageRepository = new PrismaPackageRepository();
  const packageService = new PackageService(packageRepository);
  
  const packages = await packageService.getAllPackages();
  const activePackages = packages.filter(p => p.status === 'ACTIVE');

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
      <section className="w-full px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)] py-16 md:py-32 max-w-[var(--spacing-container-max)] mx-auto border-b border-[var(--color-border-line)]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-[var(--spacing-gutter)]">
          <div className="md:col-span-8 md:col-start-3 text-center flex flex-col gap-8 items-center">
            <span className="text-label-md font-label-md uppercase tracking-widest text-[var(--color-accent)] border border-[var(--color-border-line)] px-4 py-2 rounded-full bg-white">
              Open for Commissions
            </span>
            <h1 className="text-4xl md:text-[64px] font-display-lg text-[var(--color-primary)] leading-tight font-bold">
              Bespoke Digital Artworks
            </h1>
            <p className="text-lg font-body-lg text-[var(--color-secondary)] max-w-2xl mx-auto">
              Elevate your digital presence with custom-crafted graphics. I specialize in highly detailed Anime illustrations and immersive Cinema 4D designs, tailored meticulously to your vision.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)] py-[var(--spacing-section-gap)] max-w-[var(--spacing-container-max)] mx-auto">
        <h2 className="text-3xl md:text-[32px] font-headline-lg font-semibold mb-16 text-center text-[var(--color-primary)]">
          Available Packages
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
          {activePackages.length === 0 ? (
            <div className="col-span-2 text-center text-[var(--color-secondary)]">No active packages currently available.</div>
          ) : (
            activePackages.map((pkg) => (
              <div key={pkg.id} className="bg-white border border-[var(--color-border-line)] p-8 md:p-12 flex flex-col gap-8 group hover:border-[var(--color-accent)] transition-colors duration-300">
                <div className="aspect-video w-full bg-[#f0dfdb] overflow-hidden border border-[var(--color-border-line)] relative">
                  <img 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" 
                    alt={pkg.name} 
                    src={getPackageImage(pkg.name)} 
                  />
                  <div className="absolute inset-0 bg-[var(--color-surface)] opacity-10 group-hover:opacity-0 transition-opacity"></div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-2xl font-headline-md font-semibold mb-2 text-[var(--color-primary)]">{pkg.name}</h3>
                  <p className="text-base font-body-md text-[var(--color-secondary)] mb-6">
                    {pkg.description}
                  </p>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-label-md text-[var(--color-primary)] mb-3 uppercase tracking-wider font-semibold">
                        What you get
                      </h4>
                      <ul className="space-y-2 text-base font-body-md text-[var(--color-secondary)]">
                        {getPackageFeatures(pkg.name).map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-[var(--color-accent)] text-sm mt-1">check</span> 
                            {feat}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-[var(--color-border-line)] mt-auto">
                  <p className="text-2xl font-headline-md text-[var(--color-primary)] mb-6 font-semibold">
                    Starting at Rp {Number(pkg.price).toLocaleString('id-ID')}
                  </p>
                  <Link 
                    href={`/packages/${pkg.id}`}
                    className="block w-full text-center bg-white border border-[var(--color-primary)] text-[var(--color-primary)] px-6 py-4 rounded text-sm font-label-md hover:bg-[#994530] hover:text-white hover:border-[#994530] transition-all duration-300"
                  >
                    Inquire {pkg.name.replace('GFX', '').trim()}
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
