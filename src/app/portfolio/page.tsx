import React from 'react';
import Link from 'next/link';

const portfolioItems = [
  {
    id: 1,
    title: "Neon Shadows",
    category: "3D Render",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDVeT0A64lRS9hXwFoRWbRp6_r9a_HFxQcMD9YznauNqCEDzjcttDTBtjiT7Fy-SI6rguH2lXk_HJRbDFx0EIWDkrexUUa7RphXybaV4ubw_eIpWikObWZ58XBSYC6dq-WhiF1UgtIh7PsMK-JExsTyrJMP-b2lcSXZgpUHi8fLsPkI0V7wEIX5rDXpeew6bJThmrUlacsJJjD6GhxVhJX7zGlhd7o-qrc06xal5Wl9DVoAuV3PCAF76A",
  },
  {
    id: 2,
    title: "Crimson Canopy",
    category: "Anime",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCN2vBE1KdrTFLADQYG2rGSC1GUU8iARjnHhlNYsk8P8qAxTw0kdN_bwXeuVOYDL05-mC8P7W3EbSHUo5bDSGpL-ADVCTRp_5bd6dLF4T-XqHVQJKLgUo-x1YcDIMX831kZ6KB-c5u83MtGN_DJMrilXhbNCJZZ31g-3_RokW2sGomocSkpIqnWkDjwzlxSYXWglngoC8bxps8fHo_mtQPRYJjjhiZn4MIy9-YI9yDxFR2nh9TSBw7YUA",
  },
  {
    id: 3,
    title: "The Monolith",
    category: "Concept Art",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAAo793lC2cS58NfaFiPW42o4vPzae5JMmonCETnalfq7hlXFphmcehwN7PG5d2pqJ_V8y4ZbPP40R9K-QvEPt7YeqPJ3lWnCWZBJFg1x43whxxBIjN4bwvFmtwX8clYZL1eapGR-CGpzK1MBrp5KJP61mFuIAbePHL9YX_62zgbchZa_cpLEeXRapWv8E45D7gDR2ax6TGR62XQL4aQcxpj04O459K47pPuurXv-nkd-YR0xFxyYofsw",
  },
  {
    id: 4,
    title: "Mechanical Bloom",
    category: "3D Render",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCPvs5GC2OqJt0nAySjz_ISaKsECuL9PrX1o6_pSwuHQL76SNcV3ydNqdIDfurHpExO9SCYIROGLoSJ2oof4wub-fsflKcRwHrW7E_LyNUopOG7g_uL-53ByZxfF6WY9czmV6IoIUfcp3TmhG-kuLPBR1ODXfgJQphQZBSUd5q363St2W8ZjZ7kzUj5Hmix92CKERCGBqD27fYx5dY4Khhf4SuABrtlvuA6oVRbi4icLb3C6HESJUvnag",
  },
  {
    id: 5,
    title: "Visage",
    category: "Anime",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKlkXsOem-y-7DST0WUwoMjikNhZOHtBPecGXzczU3A-H0euAjjzh6-ki_b8f5kx669sto28BZ3PxbL2Kmsh0VfYIYb8qvqSw8R-CfS2y9pq8x_6TwLZg5MFsqBqwuCIkCY6I4vhLKdZ-eqSCWHcVaOR8gKYEvnQHD5aeKYH_knYCLXnKIj4RKgM7UawrJ7wGmGLjs7-WsUsXrVmxHhfF6EZ-AsEryF__VqWAflxxDTciWaeZ0mkuXZA",
  },
  {
    id: 6,
    title: "Aero Zenith",
    category: "Concept Art",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDf55eHU_Ql0ApGs9CYg9-5TE_qGK13CIGQg8aM84feyI_jh-gfdKNA2S5ZNCTR9UuMg7nktlht0higZCdB0Gw0D3JY2AkXLg-AgCdHTkn7jQTqQvOUBKylmPNhHlJDmOU5SpOQ5ziOtHwHA5-krUurDuqmoe9lNA6lzDnykEIq-kUOShNCUtcu8fNam0AOFa-E9xUIOCYB_gE6gm2T7NA5Z3Yg0a5YR0nvcoBsgkJwZwKWR6r_MAgEwA",
  }
];

export default function PortfolioPage() {
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

      {/* Categories / Filters */}
      <section className="mb-12 flex flex-wrap gap-4 items-center">
        <button className="px-4 py-2 bg-[#f6e4e0] text-[var(--color-primary)] text-sm font-label-md rounded uppercase tracking-wider border border-transparent hover:border-[var(--color-border-line)] transition-all">All</button>
        <button className="px-4 py-2 bg-transparent text-[var(--color-secondary)] text-sm font-label-md rounded uppercase tracking-wider border border-[var(--color-border-line)] hover:bg-[#f6e4e0] hover:text-[var(--color-primary)] transition-all">Anime</button>
        <button className="px-4 py-2 bg-transparent text-[var(--color-secondary)] text-sm font-label-md rounded uppercase tracking-wider border border-[var(--color-border-line)] hover:bg-[#f6e4e0] hover:text-[var(--color-primary)] transition-all">3D Render</button>
        <button className="px-4 py-2 bg-transparent text-[var(--color-secondary)] text-sm font-label-md rounded uppercase tracking-wider border border-[var(--color-border-line)] hover:bg-[#f6e4e0] hover:text-[var(--color-primary)] transition-all">Concept Art</button>
      </section>

      {/* Asymmetric Masonry Grid */}
      <section className="columns-1 md:columns-2 lg:columns-3 gap-6 w-full space-y-6">
        {portfolioItems.map(item => (
          <div key={item.id} className="break-inside-avoid relative group overflow-hidden border border-[var(--color-border-line)] bg-white rounded-md shadow-sm">
            <img 
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" 
              alt={item.title} 
              src={item.image} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary)] to-transparent opacity-0 group-hover:opacity-90 transition-opacity duration-300 flex flex-col justify-end p-6">
              <span className="text-white text-xs font-label-md uppercase mb-2 tracking-widest">{item.category}</span>
              <h3 className="text-white text-2xl font-headline-md font-semibold">{item.title}</h3>
            </div>
          </div>
        ))}
      </section>

      {/* Load More Action */}
      <div className="mt-20 flex justify-center">
        <button className="bg-transparent border border-[var(--color-primary)] text-[var(--color-primary)] text-sm font-label-md px-8 py-4 rounded hover:bg-[#fceae6] hover:border-transparent transition-all duration-300 uppercase tracking-wider">
          Load More Archives
        </button>
      </div>
    </div>
  );
}
