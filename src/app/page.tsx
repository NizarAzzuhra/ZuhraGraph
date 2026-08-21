import React from 'react';
import Link from 'next/link';
import { PackageService } from "../application/services/PackageService";
import { PrismaPackageRepository } from "../infrastructure/repositories/PrismaPackageRepository";

// Data-driven Portfolio (Constraint 7)
const portfolioItems = [
  {
    id: 1,
    title: "Metropolis Noir",
    description: "Concept Art, 2024",
    category: "Environment",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDjWbrA-7uF1YxAO2seGVB_csI1aQE35ORZ_GheWqQ3AEVGaf6aoT04e7Rvn4LCmJKukY3-HgcTUpptu8Jz_4oufUAFizmG7Gctu-Hx-PNacMqQD1K5xQqxu3LtMszGl7bwNiwD9sK-5qIHbJwBe-xNaOIe1iyIMnKRpGnp4i2cMkD8IIr5ib8k9OtXbVbSjBXXn_dLPfrSCn0cSncKUoWt95H3dM7MN4sk3MXZRgjtHPt0k2kPoDV76w",
    span: "md:col-span-8",
    imageHeight: "h-[500px]"
  },
  {
    id: 2,
    title: "Architectural Fashion",
    description: "Character Design",
    category: "",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAyLHrqw2LUEEkcghsjknt7dspJwLhxDt9k7L1JIyVK4nrenO4sUdslvZON3yRdwgb4tD5i0y_OExHgwqchmWtjiluCNz-bJKNgAZqPkyy2eZnKVAowJ7DVAn0S6B18EVhSs7MGAvlF8xVHuWBif3s9cAi9dEi96y-o9JULZd8Su_DJ5t5Lw8feloK9y_SgAL7WVC189r1yeOYpnJhKV9k2LuF82nvQ5cT6nXdYcgoR6hxsJOR4JkFg6w",
    span: "md:col-span-4",
    flexCol: true,
    imageHeight: "h-[300px] md:h-full"
  },
  {
    id: 3,
    title: "Geometric Study I",
    description: "Abstract",
    category: "",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC0z0-inicZtuKgO_lRXGQmERN_z8J3nXo26PqpliuIlMCH1Kfl_-h8bJcvp6wH35H_RZ2quliSQUB1yufqsgVEHSltYF8GcJjKPCDb3KSTrUPYpzzlNePmUgb7WOJ6fTC92QdNBIBZSCLmaySsSoigAxOuGn8UhCd0d7s_HfF37ldDKGTJZaX56FZpzl7O1EP0PfIwnYF4oDhijwOOXpY_OjsrHTLKFRfLtHHfXEz0XBSkks1ATEewAA",
    span: "md:col-span-4",
    imageHeight: "h-[300px]"
  },
  {
    id: 4,
    title: "Silent Horizon",
    description: "Illustration",
    category: "",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBha1j73KNHyzFIvKLvqAeJQugXX85W_DERMRUxf72PAQCigqkkQygD9tGyzNENL_t7rLmhXKuBz3W4-fwq_svKOrtdr5tfkyfaXxIIRFC7ZQj2ofIEwx5Yno22iH1NKT6WP2_VwSraTss50KsPIeyCKzptWFVRq3gpAPEwZ07gq90vtPI34sGOV7zGgsOcQvJ20AvqfRrc9WPxJRnGIg4bwscSe6XDLqxE3KSxFBxkpawHYo-9dXyseQ",
    span: "md:col-span-8",
    imageHeight: "h-[300px]"
  }
];

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const packageRepository = new PrismaPackageRepository();
  const packageService = new PackageService(packageRepository);
  
  // Fetch actual packages for the homepage Commission Packages section
  const packages = await packageService.getAllPackages();
  const activePackages = packages.filter(p => p.status === 'ACTIVE');

  return (
    <>
      {/* Hero Section */}
      <section className="max-w-[var(--spacing-container-max)] mx-auto px-6 md:px-[var(--spacing-gutter)] pt-24 pb-[var(--spacing-section-gap)]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-[var(--spacing-gutter)] items-center">
          <div className="md:col-span-5 z-10 relative">
            <h1 className="text-5xl md:text-[64px] font-display-lg text-[var(--color-primary)] mb-6 leading-[1.1] font-bold tracking-tight">
              Bring Your<br />Ideas to Life.
            </h1>
            <p className="text-lg font-body-lg text-[var(--color-secondary)] mb-10 max-w-md leading-[1.6]">
              Premium digital art commissions crafted with meticulous attention to detail. Transforming concepts into compelling visual narratives.
            </p>
            <Link 
              href="/packages"
              className="inline-flex items-center justify-center bg-[var(--color-accent)] text-white px-8 py-3 rounded text-sm font-label-md hover:bg-[var(--color-accent-hover)] transition-colors duration-200"
            >
              Start a Project
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

      {/* Portfolio Gallery */}
      <section id="portfolio" className="max-w-[var(--spacing-container-max)] mx-auto px-6 md:px-[var(--spacing-gutter)] py-[var(--spacing-section-gap)] border-t border-[var(--color-border-line)]">
        <div className="mb-16">
          <span className="text-sm font-label-md uppercase tracking-widest text-[var(--color-secondary)] mb-2 block">Selected Works</span>
          <h2 className="text-3xl md:text-[32px] font-headline-lg font-semibold text-[var(--color-primary)]">Curated Portfolio</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {portfolioItems.map(item => (
            <div key={item.id} className={`${item.span} bg-[var(--color-surface)] border border-[var(--color-border-line)] p-4 ${item.flexCol ? 'flex flex-col' : ''}`}>
              <div className={`w-full relative mb-4 ${item.imageHeight} ${item.flexCol ? 'flex-grow' : ''}`}>
                <img className="w-full h-full object-cover" alt={item.title} src={item.image} />
              </div>
              <div className={`flex justify-between items-end ${item.flexCol ? 'mt-auto' : ''}`}>
                <div>
                  <h3 className="text-xl md:text-2xl font-headline-md font-semibold text-[var(--color-primary)]">{item.title}</h3>
                  <p className="text-base font-body-md text-[var(--color-secondary)]">{item.description}</p>
                </div>
                {item.category && (
                  <span className="text-xs font-label-md uppercase bg-[var(--color-background)] px-3 py-1 rounded text-[var(--color-secondary)]">
                    {item.category}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <Link href="/portfolio" className="inline-block border border-[var(--color-primary)] text-[var(--color-primary)] px-8 py-3 rounded text-sm font-label-md hover:bg-[var(--color-primary)] hover:text-white transition-colors duration-200">
            View Full Archive
          </Link>
        </div>
      </section>

      {/* Commission Packages */}
      <section id="commission" className="max-w-[var(--spacing-container-max)] mx-auto px-6 md:px-[var(--spacing-gutter)] py-[var(--spacing-section-gap)] border-t border-[var(--color-border-line)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <span className="text-sm font-label-md uppercase tracking-widest text-[var(--color-secondary)] mb-2 block">Services</span>
            <h2 className="text-3xl md:text-[32px] font-headline-lg font-semibold text-[var(--color-primary)] mb-6 leading-tight">
              Commission<br />Packages
            </h2>
            <p className="text-base font-body-md text-[var(--color-secondary)] leading-relaxed">
              Transparent pricing for premium digital artwork. Each package includes dedicated consultation and revision rounds.
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
                          <span className="material-symbols-outlined text-[16px] group-hover:text-[var(--color-accent)] transition-colors">check</span> High Quality
                        </li>
                        <li className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] group-hover:text-[var(--color-accent)] transition-colors">check</span> {pkg.slot} Slots Left
                        </li>
                      </ul>
                    </div>
                    <div className="text-left md:text-right flex flex-col items-start md:items-end gap-4 min-w-[150px]">
                      <span className="text-xl md:text-2xl font-headline-md font-semibold text-[var(--color-primary)]">
                        Rp {Number(pkg.price).toLocaleString('id-ID')}
                      </span>
                      <Link href={`/packages/${pkg.id}`} className="inline-block border border-[var(--color-primary)] text-[var(--color-primary)] px-6 py-2 rounded text-sm font-label-md hover:bg-[var(--color-primary)] hover:text-white transition-colors duration-200">
                        Inquire
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
