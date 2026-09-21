import React from 'react';
import Link from 'next/link';
import { PackageService } from "../application/services/PackageService";
import { PrismaPackageRepository } from "../infrastructure/repositories/PrismaPackageRepository";
import { prisma } from "../lib/prisma";

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const packageRepository = new PrismaPackageRepository();
  const packageService = new PackageService(packageRepository);
  
  // Fetch actual packages for the homepage Commission Packages section
  const packages = await packageService.getAllPackages();
  const activePackages = packages.filter(p => p.status === 'ACTIVE');

  // Fetch portfolios directly using Prisma
  const portfolios = await prisma.portfolio.findMany({
    where: {
      status: 'ACTIVE',
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 4,
  });

  const col1 = portfolios.filter((_, idx) => idx % 3 === 0);
  const col2 = portfolios.filter((_, idx) => idx % 3 === 1);
  const col3 = portfolios.filter((_, idx) => idx % 3 === 2);

  const renderPortfolioItem = (item: any) => (
    <div 
      key={item.id} 
      className="bg-[var(--color-surface)] border border-[var(--color-border-line)] p-4 flex flex-col h-fit rounded transition-shadow hover:shadow-sm"
    >
      {/* Gambar menyesuaikan rasio aslinya */}
      <div className="w-full mb-4 overflow-hidden rounded">
        {item.imageUrl ? (
          <img 
            className="w-full h-auto object-contain block" 
            alt={item.title} 
            src={item.imageUrl} 
          />
        ) : (
          <div className="w-full h-48 bg-neutral-100 flex items-center justify-center text-neutral-400 text-sm">
            No Image
          </div>
        )}
      </div>

      {/* Info teks pas di bawah foto */}
      <div className="flex justify-between items-start gap-3 mt-auto">
        <div>
          <h3 className="text-lg font-headline-md font-semibold text-[var(--color-primary)] leading-snug">{item.title}</h3>
          <p className="text-sm font-body-md text-[var(--color-secondary)] mt-0.5">{item.description}</p>
        </div>
        {item.category && (
          <span className="text-xs font-label-md uppercase bg-[var(--color-background)] px-2.5 py-1 rounded text-[var(--color-secondary)] shrink-0 font-medium">
            {item.category}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Hero Section */}
      <section className="max-w-[var(--spacing-container-max)] mx-auto px-6 md:px-[var(--spacing-gutter)] pt-24 pb-[var(--spacing-section-gap)]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-[var(--spacing-gutter)] items-center">
          <div className="md:col-span-5 z-10 relative">
            <h1 className="text-5xl md:text-[64px] font-display-lg text-[var(--color-primary)] mb-6 leading-[1.1] font-bold tracking-tight">
              Wujudkan Ide Kreatif Anda<br />Menjadi Nyata.
            </h1>
            <p className="text-lg font-body-lg text-[var(--color-secondary)] mb-10 max-w-md leading-[1.6]">
              Layanan komisi seni digital premium dengan perhatian detail yang presisi. Mengubah konsep imajinasi Anda menjadi karya visual yang memukau.
            </p>
            <Link 
              href="/packages"
              className="inline-flex items-center justify-center bg-[var(--color-accent)] text-white px-8 py-3 rounded text-sm font-label-md hover:bg-[var(--color-accent-hover)] transition-colors duration-200"
            >
              Mulai Pesanan
            </Link>
          </div>
          <div className="md:col-span-7 relative mt-12 md:mt-0">
            <div className="relative w-full h-[600px] border border-[var(--color-border-line)] bg-[var(--color-surface)] p-4 flex items-center justify-center">
              <img 
                className="w-full h-full object-cover" 
                alt="Main Hero Art" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqJC64d4i78frwSYEW2oZlHZxxagVs6r3GrAHrwjbhpibRiutTF8uXaZmH_PgPSLLyWDrXkId2eNCtBGoNhtxzZi_bVDxYBZ0eakeX6wazRQkQeF0qs5kvthEm4LXHtI-yxNpQ4di1Ds5K-yqTrVW1hPTHiPOj2gOqzQp5aFsHmN9FhlIZdxQRzH3-JlLhJNEhKc5qbabOft_Lhxz_u5pwifgClJbbNG5Kc-ZPSo7cnzmNvWYbgacsxA" 
              />
            </div>
            <div className="absolute -bottom-8 -left-8 w-64 h-64 border border-[var(--color-border-line)] bg-[var(--color-surface)] p-2 hidden md:block">
              <img 
                className="w-full h-full object-cover" 
                alt="Secondary Hero Art" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAEUOqj3ts6rxZH4zIWUm3U9Gsp9CNFGIogzf-P9vabsh0B6wpZBnVLNS7kU1_Hd-IlsaDTy7D7oJbUTuv5BT5uvFOwDiBkt39UkV16aPHZ9_yYWngXWw-hoZrhL0dJUkMG95Arf8AmD1uSvL141Nz35okDz_hVkzTjgeYpyPEFJFsBIN-FbefmFpWBwF7E8Qeh-avjG3NeLT5l4DYh8gcNOg-k_0D5YN_c3qbDswN0wXC7slPJEo6zA" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Gallery Section */}
      <section id="portfolio" className="max-w-[var(--spacing-container-max)] mx-auto px-6 md:px-[var(--spacing-gutter)] py-[var(--spacing-section-gap)] border-t border-[var(--color-border-line)]">
        <div className="mb-12">
          <span className="text-sm font-label-md uppercase tracking-widest text-[var(--color-secondary)] mb-2 block">Karya Pilihan</span>
          <h2 className="text-3xl md:text-[32px] font-headline-lg font-semibold text-[var(--color-primary)]">Portofolio Kurasi</h2>
        </div>
        
        {/* Grid dinamis yang pas membungkus kartu foto */}
        {portfolios.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            <div className="flex flex-col gap-6">
              {col1.map(renderPortfolioItem)}
            </div>
            <div className="flex flex-col gap-6">
              {col2.map(renderPortfolioItem)}
            </div>
            <div className="flex flex-col gap-6">
              {col3.map(renderPortfolioItem)}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-[var(--color-secondary)] border border-[var(--color-border-line)]">
            Belum ada karya yang diunggah ke portofolio.
          </div>
        )}
        
        <div className="mt-12 text-center">
          <Link href="/portofolio" className="inline-block border border-[var(--color-primary)] text-[var(--color-primary)] px-8 py-3 rounded text-sm font-label-md hover:bg-[var(--color-primary)] hover:text-white transition-colors duration-200">
            Lihat Semua Portofolio
          </Link>
        </div>
      </section>

      {/* Commission Packages */}
      <section id="commission" className="max-w-[var(--spacing-container-max)] mx-auto px-6 md:px-[var(--spacing-gutter)] py-[var(--spacing-section-gap)] border-t border-[var(--color-border-line)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <span className="text-sm font-label-md uppercase tracking-widest text-[var(--color-secondary)] mb-2 block">LAYANAN</span>
            <h2 className="text-3xl md:text-[32px] font-headline-lg font-semibold text-[var(--color-primary)] mb-6 leading-tight">
              Paket<br />Komisi
            </h2>
            <p className="text-base font-body-md text-[var(--color-secondary)] leading-relaxed">
              Penetapan harga transparan untuk karya seni digital berkualitas. Setiap paket mencakup sesi konsultasi langsung dan kuota revisi terstruktur.
            </p>
          </div>
          
          <div className="md:col-span-3">
            <div className="flex flex-col border-t border-[var(--color-border-line)]">
              {activePackages.length === 0 ? (
                <div className="py-8 text-[var(--color-secondary)]">No active packages currently available.</div>
              ) : (
                activePackages.map((pkg) => (
                  <div key={pkg.id} className="py-8 border-b border-[var(--color-border-line)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:bg-[#FCFAF7] transition-colors p-4 -mx-4 relative overflow-hidden">
                    <div className="absolute left-0 top-0 h-full w-1 bg-transparent group-hover:bg-[var(--color-accent)] transition-colors"></div>
                    <div className="flex-1 pl-4 md:pl-0">
                      <h3 className="text-xl md:text-2xl font-headline-md font-semibold text-[var(--color-primary)] mb-2">{pkg.name}</h3>
                      <p className="text-base font-body-md text-[var(--color-secondary)] max-w-lg leading-relaxed">
                        {pkg.description || "Detailed digital art commission."}
                      </p>
                      <ul className="mt-4 flex flex-wrap gap-4 text-xs font-caption text-[var(--color-secondary)]">
                        <li className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] group-hover:text-[var(--color-accent)] transition-colors">check</span> Kualitas Tinggi
                        </li>
                        <li className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] group-hover:text-[var(--color-accent)] transition-colors">check</span> Tersisa {pkg.slot} Slot
                        </li>
                      </ul>
                    </div>
                    <div className="text-left md:text-right flex flex-col items-start md:items-end gap-4 min-w-[150px]">
                      <span className="text-xl md:text-2xl font-headline-md font-semibold text-[var(--color-primary)]">
                        Rp {Number(pkg.price).toLocaleString('id-ID')}
                      </span>
                      <Link href={`/packages/${pkg.id}`} className="inline-block border border-[var(--color-primary)] text-[var(--color-primary)] px-6 py-2 rounded text-sm font-label-md hover:bg-[var(--color-primary)] hover:text-white transition-colors duration-200">
                        Pesan Sekarang
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
