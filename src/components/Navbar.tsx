"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from './ui/Button';

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const notificationRef = React.useRef<HTMLDivElement>(null);
  const profileRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (status !== 'authenticated') return;
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        if (data.success) {
          setUnreadCount(data.unreadCount || 0);
          setNotifications(data.data || []);
        }
      } catch (e) {}
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [status]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'PATCH' });
      if (res.ok) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })));
      }
    } catch (e) {}
  };

  const isActive = (path: string) => {
    if (path === '/' && pathname !== '/') return false;
    return pathname.startsWith(path);
  };

  const navLinkClass = (path: string) => `
    text-sm font-semibold transition-colors duration-200
    ${isActive(path) 
      ? 'text-[var(--color-primary)] border-b-2 border-[#B85C45] pb-1' 
      : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
    }
  `;

  return (
    <nav suppressHydrationWarning className="fixed top-0 left-0 right-0 w-full z-50 bg-[#F5F1EA] border-b border-[#DDD7CE]">
      <div className="w-full max-w-[var(--spacing-container-max)] mx-auto px-6 md:px-[var(--spacing-gutter)] h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-bold text-[var(--color-primary)]">
          ZuhraGraph
        </Link>
        <div className="hidden md:flex gap-6 items-center pt-1">
          <Link href="/" className={navLinkClass('/')}>Beranda</Link>
          <Link href="/portofolio" className={navLinkClass('/portofolio')}>Portofolio</Link>
          <Link href="/packages" className={navLinkClass('/packages')}>Paket</Link>
          <Link href="/faq" className={navLinkClass('/faq')}>FAQ</Link>
          {mounted && status === 'authenticated' && session?.user && (session.user as any).role === 'ADMIN' && (
            <Link href="/admin/orders" className={navLinkClass('/admin/orders')}>Dasbor Pesanan</Link>
          )}
          {mounted && status === 'authenticated' && session?.user && (session.user as any).role !== 'ADMIN' && (
            <Link href="/orders" className={navLinkClass('/orders')}>Pesanan Saya</Link>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {!mounted || status === 'loading' ? (
          <div className="hidden md:flex items-center gap-4 w-[140px] h-9"></div>
        ) : status === 'authenticated' ? (
          <>
            <div className="relative hidden md:block" ref={notificationRef}>
              <button 
                type="button" 
                aria-label="Notifications"
                onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                className="relative cursor-pointer p-1 text-[var(--color-secondary)] hover:text-[var(--color-primary)] focus:outline-none"
              >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              {notificationDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-[#DDD7CE] shadow-lg rounded py-2 z-[99] max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-[#DDD7CE] flex justify-between items-center">
                    <h3 className="font-bold text-[var(--color-primary)] text-sm">Notifikasi</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs text-[#B85C45] hover:underline">
                        Tandai Semua Dibaca
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-[var(--color-secondary)]">
                      Belum ada notifikasi
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map((notif) => (
                        <Link 
                          key={notif.id}
                          href={notif.link || ((session.user as any).role === 'ADMIN' ? '/admin/orders' : '/orders')}
                          onClick={() => setNotificationDropdownOpen(false)}
                          className={`px-4 py-3 border-b border-[#DDD7CE] last:border-b-0 hover:bg-gray-50 transition-colors block ${notif.status === 'UNREAD' ? 'bg-orange-50' : ''}`}
                        >
                          <p className="text-sm text-[var(--color-primary)] leading-tight">{notif.content}</p>
                          <p className="text-xs text-[var(--color-secondary)] mt-1.5">{new Date(notif.createdAt).toLocaleDateString()}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="relative hidden md:block" ref={profileRef}>
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 text-[var(--color-secondary)] hover:text-[var(--color-primary)] focus:outline-none"
              >
                <span className="material-symbols-outlined">account_circle</span>
              </button>
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#DDD7CE] shadow-lg rounded py-1 z-[99]">
                  <div className="px-4 py-2 border-b border-[#DDD7CE] text-sm">
                    <p className="font-bold truncate text-[var(--color-primary)]">{session.user?.name}</p>
                    <p className="text-[var(--color-secondary)] truncate">{session.user?.email}</p>
                  </div>
                  <button 
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    Keluar
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors">
              Masuk
            </Link>
            <Button variant="primary" size="sm" onClick={() => router.push('/packages')}>
              Pesan Sekarang
            </Button>
          </div>
        )}

        <button 
          className="md:hidden text-[var(--color-primary)] focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-20 left-0 w-full bg-[#F5F1EA] border-b border-[#DDD7CE] p-4 flex flex-col gap-4 shadow-lg md:hidden z-40">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className={navLinkClass('/')}>Beranda</Link>
          <Link href="/portofolio" onClick={() => setMobileMenuOpen(false)} className={navLinkClass('/portofolio')}>Portofolio</Link>
          <Link href="/packages" onClick={() => setMobileMenuOpen(false)} className={navLinkClass('/packages')}>Paket</Link>
          <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className={navLinkClass('/faq')}>FAQ</Link>
          {!mounted || status === 'loading' ? (
            <div className="flex flex-col gap-4 mt-2 pt-4 border-t border-[#DDD7CE]">
              <div className="w-full h-8"></div>
            </div>
          ) : status === 'authenticated' ? (
            <>
              {session?.user && (session.user as any).role === 'ADMIN' ? (
                <Link href="/admin/orders" onClick={() => setMobileMenuOpen(false)} className={navLinkClass('/admin/orders')}>Dasbor Pesanan</Link>
              ) : (
                <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className={navLinkClass('/orders')}>Pesanan Saya</Link>
              )}
              <button 
                onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                className="text-left text-sm font-semibold text-red-600 hover:text-red-700 mt-2"
              >
                Keluar
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-4 mt-2 pt-4 border-t border-[#DDD7CE]">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-[var(--color-primary)]">
                Masuk
              </Link>
              <Button 
                variant="primary" 
                size="sm" 
                className="w-full" 
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push('/packages');
                }}
              >
                Pesan Sekarang
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
