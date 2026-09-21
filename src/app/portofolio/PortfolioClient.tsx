'use client';

import React, { useState } from 'react';

const DEFAULT_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuDVeT0A64lRS9hXwFoRWbRp6_r9a_HFxQcMD9YznauNqCEDzjcttDTBtjiT7Fy-SI6rguH2lXk_HJRbDFx0EIWDkrexUUa7RphXybaV4ubw_eIpWikObWZ58XBSYC6dq-WhiF1UgtIh7PsMK-JExsTyrJMP-b2lcSXZgpUHi8fLsPkI0V7wEIX5rDXpeew6bJThmrUlacsJJjD6GhxVhJX7zGlhd7o-qrc06xal5Wl9DVoAuV3PCAF76A";

export default function PortfolioClient({ initialPortfolios }: { initialPortfolios: any[] }) {
  const [visibleCount, setVisibleCount] = useState(6); // Menampilkan 6 item pertama

  const visiblePortfolios = initialPortfolios.slice(0, visibleCount);
  const hasMore = visibleCount < initialPortfolios.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 6); // Menampilkan tambahan 6 item tiap kali klik
  };

  const col1 = visiblePortfolios.filter((_, idx) => idx % 3 === 0);
  const col2 = visiblePortfolios.filter((_, idx) => idx % 3 === 1);
  const col3 = visiblePortfolios.filter((_, idx) => idx % 3 === 2);

  const renderPortfolioItem = (item: any) => (
    <div key={item.id} className="relative group overflow-hidden bg-neutral-100 rounded-xl shadow-sm">
      <img 
        src={item.imageUrl || DEFAULT_IMAGE} 
        alt={item.title} 
        className="w-full h-auto object-cover block group-hover:scale-105 transition-transform duration-300" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary)] to-transparent opacity-0 group-hover:opacity-90 transition-opacity duration-300 flex flex-col justify-end p-6">
        <span className="text-white text-xs font-label-md uppercase mb-2 tracking-widest">{item.category || 'Uncategorized'}</span>
        <h3 className="text-white text-2xl font-headline-md font-semibold">{item.title}</h3>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[var(--spacing-container-max)] mx-auto px-6 md:px-[var(--spacing-gutter)] py-[var(--spacing-section-gap)]">
      
      {/* Portfolio Header */}
      <section className="mb-[var(--spacing-section-gap)] max-w-3xl">
        <h1 className="text-4xl md:text-[64px] font-display-lg-mobile md:font-display-lg text-[var(--color-primary)] mb-6 font-bold tracking-tight">
          Arsip Portofolio
        </h1>
        <p className="text-lg font-body-lg text-[var(--color-secondary)] max-w-2xl leading-relaxed">
          Koleksi lengkap hasil karya seni digital, desain karakter, dan proyek kreatif.
        </p>
      </section>

      {/* Asymmetric Masonry Grid */}
      {initialPortfolios.length === 0 ? (
        <div className="text-center text-[#7A7067] py-12">Belum ada karya yang diunggah.</div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-6">
          <div className="flex flex-col gap-6">
            {col1.map(renderPortfolioItem)}
          </div>
          <div className="flex flex-col gap-6">
            {col2.map(renderPortfolioItem)}
          </div>
          <div className="flex flex-col gap-6">
            {col3.map(renderPortfolioItem)}
          </div>
        </section>
      )}

      {/* Load More Action */}
      {hasMore && (
        <div className="mt-20 flex justify-center">
          <button 
            onClick={handleLoadMore}
            className="bg-transparent border border-[var(--color-primary)] text-[var(--color-primary)] text-sm font-label-md px-8 py-4 rounded hover:bg-[#fceae6] hover:border-transparent transition-all duration-300 uppercase tracking-wider"
          >
            TAMPILKAN LEBIH BANYAK
          </button>
        </div>
      )}
    </div>
  );
}
