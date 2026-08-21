"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from './ui/Button';

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && pathname !== '/') return false;
    return pathname.startsWith(path);
  };

  const navLinkClass = (path: string) => `
    text-label-md font-label-md transition-colors duration-200
    ${isActive(path) 
      ? 'text-[var(--color-primary)] font-bold border-b-2 border-[var(--color-accent)] pb-1' 
      : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
    }
  `;

  return (
    <nav className="sticky top-0 z-50 flex justify-between items-center w-full px-6 md:px-[var(--spacing-gutter)] max-w-[var(--spacing-container-max)] mx-auto h-20 bg-[var(--color-background)]">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-headline-md font-headline-md font-bold text-[var(--color-primary)]">
          ZuhraGraph
        </Link>
        <div className="hidden md:flex gap-6 items-center pt-1">
          <Link href="/" className={navLinkClass('/')}>Home</Link>
          <Link href="/portfolio" className={navLinkClass('/portfolio')}>Portfolio</Link>
          <Link href="/packages" className={navLinkClass('/packages')}>Commission</Link>
          <Link href="/faq" className={navLinkClass('/faq')}>FAQ</Link>
          {status === 'authenticated' && (
            <Link href="/orders" className={navLinkClass('/orders')}>Orders</Link>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {status === 'authenticated' ? (
          <>
            <button className="text-[var(--color-secondary)] hover:text-[var(--color-primary)] focus:outline-none">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="relative hidden md:block">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 text-[var(--color-secondary)] hover:text-[var(--color-primary)] focus:outline-none"
              >
                <span className="material-symbols-outlined">account_circle</span>
              </button>
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[var(--color-border-line)] shadow-lg rounded py-1 z-50">
                  <div className="px-4 py-2 border-b border-[var(--color-border-line)] text-sm">
                    <p className="font-bold truncate text-[var(--color-primary)]">{session.user?.name}</p>
                    <p className="text-[var(--color-secondary)] truncate">{session.user?.email}</p>
                  </div>
                  <Link href="/profile" className="block px-4 py-2 text-sm text-[var(--color-primary)] hover:bg-[var(--color-surface)]">Profile</Link>
                  <button 
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-[var(--color-surface)]"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-label-md font-label-md text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors">
              Login
            </Link>
            <Link href="/packages">
              <Button variant="primary" size="sm">Commission Now</Button>
            </Link>
          </div>
        )}

        <button 
          className="md:hidden text-[var(--color-primary)] focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-20 left-0 w-full bg-[var(--color-background)] border-b border-[var(--color-border-line)] p-4 flex flex-col gap-4 shadow-lg md:hidden z-40">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className={navLinkClass('/')}>Home</Link>
          <Link href="/portfolio" onClick={() => setMobileMenuOpen(false)} className={navLinkClass('/portfolio')}>Portfolio</Link>
          <Link href="/packages" onClick={() => setMobileMenuOpen(false)} className={navLinkClass('/packages')}>Commission</Link>
          <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className={navLinkClass('/faq')}>FAQ</Link>
          
          {status === 'authenticated' ? (
            <>
              <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className={navLinkClass('/orders')}>Orders</Link>
              <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className={navLinkClass('/profile')}>Profile</Link>
              <button 
                onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                className="text-left text-label-md font-label-md text-red-600 hover:text-red-700 mt-2"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-4 mt-2 pt-4 border-t border-[var(--color-border-line)]">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-label-md font-label-md text-[var(--color-primary)]">
                Login
              </Link>
              <Link href="/packages" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="sm" className="w-full">Commission Now</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
