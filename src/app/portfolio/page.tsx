import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DEFAULT_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuDVeT0A64lRS9hXwFoRWbRp6_r9a_HFxQcMD9YznauNqCEDzjcttDTBtjiT7Fy-SI6rguH2lXk_HJRbDFx0EIWDkrexUUa7RphXybaV4ubw_eIpWikObWZ58XBSYC6dq-WhiF1UgtIh7PsMK-JExsTyrJMP-b2lcSXZgpUHi8fLsPkI0V7wEIX5rDXpeew6bJThmrUlacsJJjD6GhxVhJX7zGlhd7o-qrc06xal5Wl9DVoAuV3PCAF76A";

export default async function PortfolioPage() {
  const portfolios = await prisma.portfolio.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="w-full max-w-[var(--spacing-container-max)] mx-auto px-6 md:px-[var(--spacing-gutter)] py-[var(--spacing-section-gap)]">
      
      {/* Portfolio Header */}
      <section className="mb-[var(--spacing-section-gap)] max-w-3xl">
        <h1 className="text-4xl md:text-[64px] font-display-lg-mobile md:font-display-lg text-[var(--color-primary)] mb-6 font-bold tracking-tight">
          Selected Works
        </h1>
        <p className="text-lg font-body-lg text-[var(--color-secondary)] max-w-2xl leading-relaxed">
          A curated collection of digital art, ranging from vibrant anime illustrations to evocative 3D conceptual renders. Explore the intersection of storytelling and technical craft.
        </p>
      </section>

      {/* Asymmetric Masonry Grid */}
      <section className="columns-1 md:columns-2 lg:columns-3 gap-6 w-full space-y-6">
        {portfolios.length === 0 ? (
          <div className="col-span-full text-center text-[#7A7067] py-12">Belum ada karya yang diunggah.</div>
        ) : (
          portfolios.map(item => (
            <div key={item.id} className="break-inside-avoid relative group overflow-hidden border border-[var(--color-border-line)] bg-white rounded-md shadow-sm">
              <img 
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" 
                alt={item.title} 
                src={item.imageUrl || DEFAULT_IMAGE} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary)] to-transparent opacity-0 group-hover:opacity-90 transition-opacity duration-300 flex flex-col justify-end p-6">
                <span className="text-white text-xs font-label-md uppercase mb-2 tracking-widest">{item.category || 'Uncategorized'}</span>
                <h3 className="text-white text-2xl font-headline-md font-semibold">{item.title}</h3>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Load More Action */}
      {portfolios.length > 0 && (
        <div className="mt-20 flex justify-center">
          <button className="bg-transparent border border-[var(--color-primary)] text-[var(--color-primary)] text-sm font-label-md px-8 py-4 rounded hover:bg-[#fceae6] hover:border-transparent transition-all duration-300 uppercase tracking-wider">
            Load More Archives
          </button>
        </div>
      )}
    </div>
  );
}
