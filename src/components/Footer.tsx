import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full py-[var(--spacing-section-gap)] px-6 md:px-[var(--spacing-gutter)] max-w-[var(--spacing-container-max)] mx-auto flex flex-col md:flex-row justify-between gap-8 border-t border-[var(--color-border-line)] bg-[var(--color-surface)]">
      <div>
        <span className="text-headline-md font-headline-md font-bold text-[var(--color-primary)] block mb-2">
          ZuhraGraph
        </span>
        <p className="text-body-md font-body-md text-[var(--color-secondary)] max-w-xs">
          © {new Date().getFullYear()} ZuhraGraph. All rights reserved. Premium Digital Art Commissions.
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-6 md:gap-12">
        <Link href="#" className="text-sm font-label-md text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors duration-300 outline-none focus:text-[var(--color-primary)]">
          About the Artist
        </Link>
        <Link href="#" className="text-sm font-label-md text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors duration-300 outline-none focus:text-[var(--color-primary)]">
          Privacy Policy
        </Link>
        <Link href="#" className="text-sm font-label-md text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors duration-300 outline-none focus:text-[var(--color-primary)]">
          Terms of Service
        </Link>
        <Link href="#" className="text-sm font-label-md text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors duration-300 outline-none focus:text-[var(--color-primary)]">
          Contact
        </Link>
      </div>
    </footer>
  );
}
