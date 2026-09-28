'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

export interface PackageItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  status: string;
  slot: number;
  maxActiveSlots: number;
  isAcceptingOrders: boolean;
  imageUrl?: string | null;
  features: string[];
  activeOrdersCount: number;
  remainingSlots: number;
  isOpen: boolean;
}

interface PackagesClientProps {
  initialPackages: PackageItem[];
}

export default function PackagesClient({ initialPackages }: PackagesClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback image based on package name
  const getPackageImage = (name: string) => {
    if (name.includes('Anime')) {
      return "https://lh3.googleusercontent.com/aida-public/AB6AXuAeWytWq_Xx_30SrVmTbRbDZh5mvpuPOfbyKOeXLDVRcxuVO9nwaNLlHRZrbF2aA8R76Evhq6mWAHXHaCWYSWhxS-Hq_znDXUwzIXii9_Vd081gzZhzMZSgSD8Pp5WQ-Irv1tcUfp7aMcUJTSPR0is8TqzqswJml43YcThADd-CJqncozCSTLHgv8jfZLWkrw-mKPNHCeqc9dLmGyjqmBav6TzCvQOL6C8A0N3dUhWtShCsf3Sy3BjLNA";
    }
    return "https://lh3.googleusercontent.com/aida-public/AB6AXuDNheLr_DxcEhq2dGhtPBV8EUeqz80ztyvCR_tzPeN1D9nb0iNGkIfQodvUJ5AqYc3oMqu7npE454MN4azctaaH3Hm2LctM68xB3RDkaREY5BRE5h34_s0_j3EdqvyYV9hM-oe4nZR5CD8Kwxo2Nt_F8-K9Y6l4VmD8cIbCPFmmiidaquYuxKmsfbk4rJN7Y_ETgyWYgPgMVnPSJGEPkGyM208k_6T7OKDPDdOdJWAs3Ds1eeoZ04Rnsw";
  };

  // Function to get default features if none exist for backward compatibility
  const getDefaultFeatures = (name: string) => {
    if (name.includes('Anime')) {
      return [
        "1 Karakter full render",
        "File sumber resolusi tinggi (.PSD)",
        "Opsi lisensi komersial"
      ];
    }
    return [
      "Tipografi/pemandangan 3D kustom",
      "Beragam variasi pencahayaan",
      "Output resolusi 4K"
    ];
  };

  // Real-time filtering logic
  const filteredPackages = useMemo(() => {
    if (!searchQuery.trim()) return initialPackages;
    const query = searchQuery.toLowerCase().trim();

    return initialPackages.filter((pkg) => {
      const matchName = pkg.name?.toLowerCase().includes(query) ?? false;
      const matchDesc = pkg.description?.toLowerCase().includes(query) ?? false;
      const featureList = (pkg.features && pkg.features.length > 0)
        ? pkg.features
        : getDefaultFeatures(pkg.name);
      const matchFeatures = featureList.some((feat: string) =>
        feat.toLowerCase().includes(query)
      );

      return matchName || matchDesc || matchFeatures;
    });
  }, [initialPackages, searchQuery]);

  return (
    <section className="w-full px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)] pt-12 pb-[var(--spacing-section-gap)] max-w-[var(--spacing-container-max)] mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-[32px] font-headline-lg font-semibold text-[#1F1C18] mb-3">
          Paket Layanan Tersedia
        </h1>
        <p className="text-base md:text-lg text-[#7A7067] max-w-xl mx-auto">
          Pilih paket komisi seni digital yang sesuai dengan kebutuhan dan visi kreatif Anda.
        </p>
      </div>

      {/* Search Bar */}
      <div className="w-full max-w-lg mx-auto mb-10">
        <div className="relative flex items-center">
          <div className="absolute left-4 pointer-events-none text-[#7A7067] flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-5 h-5 text-[#7A7067]" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari paket, gaya desain, atau fitur..."
            className="w-full bg-[#FFFFFF] border border-[#DDD7CE] focus:border-[#9D4B36] focus:ring-2 focus:ring-[#9D4B36]/20 text-[#1F1C18] text-sm md:text-base rounded-xl pl-11 pr-11 py-3.5 shadow-xs outline-none transition-all placeholder:text-[#A89F91]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3.5 p-1 text-[#7A7067] hover:text-[#1F1C18] hover:bg-[#F4EFEA] rounded-lg transition-colors cursor-pointer"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-4 h-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Package Grid or Empty State */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
        {initialPackages.length === 0 ? (
          <div className="col-span-1 lg:col-span-2 text-center text-[#7A7067] py-16">
            Belum ada paket komisi yang tersedia saat ini.
          </div>
        ) : filteredPackages.length === 0 ? (
          /* Empty Search State */
          <div className="col-span-1 lg:col-span-2 py-16 px-6 text-center flex flex-col items-center justify-center bg-white border border-[#E8E0D5] rounded-2xl shadow-xs">
            <div className="w-16 h-16 mb-4 rounded-full bg-[#F4EFEA] flex items-center justify-center text-[#9D4B36]">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-8 h-8 text-[#9D4B36]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-[#1F1C18] mb-2">
              Paket tidak ditemukan
            </h3>
            <p className="text-base text-[#7A7067] max-w-md mb-6 leading-relaxed">
              Tidak ada paket komisi yang sesuai dengan kata kunci &apos;{searchQuery}&apos;. Coba gunakan kata kunci lain.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-2 bg-[#9D4B36] hover:bg-[#853E2C] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 shadow-sm cursor-pointer"
            >
              Reset Pencarian
            </button>
          </div>
        ) : (
          filteredPackages.map((pkg) => (
            <div 
              key={pkg.id} 
              className="bg-[#FFFFFF] border border-[#E8E0D5] p-8 md:p-12 flex flex-col h-full gap-8 group hover:border-[#9D4B36] transition-colors duration-300 rounded-2xl relative overflow-hidden"
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4 z-10">
                {pkg.isOpen ? (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      KOMISI DIBUKA (TERSEDIA {pkg.remainingSlots} DARI {pkg.maxActiveSlots} SLOT)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-[#FDF5F3] border border-[#F4E3DF] text-[#9D4B36] px-3 py-1.5 rounded-full shadow-sm">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#9D4B36]"></span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      SLOT PENUH ({pkg.isAcceptingOrders ? 'Antrean Penuh' : 'Tidak Tersedia'})
                    </span>
                  </div>
                )}
              </div>

              {/* Package Image */}
              <div className="w-full h-auto max-h-[300px] flex items-center justify-center bg-[#F4EFEA] overflow-hidden border border-[#E8E0D5] relative rounded-xl">
                <img 
                  className="w-full h-full max-h-[300px] object-contain group-hover:scale-105 transition-transform duration-700 ease-in-out" 
                  alt={pkg.name} 
                  src={pkg.imageUrl || getPackageImage(pkg.name)} 
                />
                <div className="absolute inset-0 bg-[#1F1C18] opacity-10 group-hover:opacity-0 transition-opacity pointer-events-none"></div>
              </div>
              
              {/* Package Content */}
              <div className="flex-grow">
                <h3 className="text-2xl font-bold mb-2 text-[#1F1C18]">{pkg.name}</h3>
                <p className="text-base text-[#7A7067] mb-6">
                  {pkg.description}
                </p>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-label-md text-[#1F1C18] mb-3 uppercase tracking-wider font-semibold">
                      YANG ANDA DAPATKAN
                    </h4>
                    <ul className="space-y-2 text-base text-[#7A7067] max-h-48 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      {(pkg.features && pkg.features.length > 0 ? pkg.features : getDefaultFeatures(pkg.name)).map((feat: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 w-full">
                          <span className="material-symbols-outlined text-[#9D4B36] text-sm mt-1 shrink-0">check</span> 
                          <span className="break-words overflow-hidden text-ellipsis w-full">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Package Footer */}
              <div className="pt-6 border-t border-[#E8E0D5] mt-auto">
                <p className="text-2xl font-bold text-[#1F1C18] mb-6">
                  Mulai dari Rp {pkg.price.toLocaleString('id-ID')}
                </p>
                
                {pkg.isOpen ? (
                  <Link 
                    href={`/packages/${pkg.id}`}
                    className="flex items-center justify-center w-full bg-[#9D4B36] hover:bg-[#853E2C] text-white px-6 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 shadow-sm"
                  >
                    Pilih Paket
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
  );
}
