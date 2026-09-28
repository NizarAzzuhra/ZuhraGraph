import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full bg-[#FAF6F0] border-t border-[#E8E0D5]">
      <div className="w-full py-8 md:py-12 px-6 md:px-[var(--spacing-gutter)] max-w-[var(--spacing-container-max)] mx-auto flex flex-col md:flex-row justify-between gap-8">
      <div>
        <span className="text-headline-md font-headline-md font-bold text-[var(--color-primary)] block mb-2">
          ZuhraGraph
        </span>
        <p className="text-body-md font-body-md text-[var(--color-secondary)] max-w-xs">
          © {new Date().getFullYear()} ZuhraGraph. All rights reserved. Premium Digital Art Commissions.
        </p>
      </div>
      <div className="flex flex-wrap md:flex-row gap-6 md:gap-12 items-center">
        <Link href="/portofolio" className="text-sm font-label-md text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors duration-300 outline-none focus:text-[var(--color-primary)]">
          Portofolio
        </Link>
        <Link href="/packages" className="text-sm font-label-md text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors duration-300 outline-none focus:text-[var(--color-primary)]">
          Paket Komisi
        </Link>
        <Link href="/faq" className="text-sm font-label-md text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors duration-300 outline-none focus:text-[var(--color-primary)]">
          FAQ & Panduan
        </Link>
        <a 
          href="https://mail.google.com/mail/?view=cm&fs=1&to=nizarazzuhra@gmail.com&su=Tanya%20Layanan%20Komisi%20-%20ZuhraGraph" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-sm font-label-md text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors duration-300 outline-none focus:text-[var(--color-primary)]"
        >
          Hubungi Artis
        </a>
      </div>
      </div>
    </footer>
  );
}
