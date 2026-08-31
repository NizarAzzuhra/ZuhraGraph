"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { name: "Overview", href: "/admin", icon: "dashboard" },
    { name: "Orders", href: "/admin/orders", icon: "shopping_cart" },
    { name: "Packages & Queue", href: "/admin/packages", icon: "inventory_2" },
    { name: "Portfolio", href: "/admin/portfolio", icon: "photo_library" },
  ];

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-[#fff8f6] text-[#221a17] antialiased">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#fff8f6] border-r border-[#dbc1bb] flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-[#dbc1bb] flex flex-col items-start justify-center">
          <span className="text-sm font-bold tracking-widest text-[#99442f] uppercase">
            Admin Panel
          </span>
        </div>
        <nav className="flex-1 py-4 flex flex-col">
          {navLinks.map((link) => {
            // Exact match for overview, prefix match for others
            const isActive = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
            
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center px-6 py-4 text-sm font-semibold transition-colors ${isActive ? "bg-[#fceae6] text-[#99442f] border-r-2 border-[#99442f]" : "text-[#605e5b] hover:text-[#99442f] hover:bg-[#fceae6]/50"}`}
              >
                <span className="material-symbols-outlined mr-4 text-[22px]">
                  {link.icon}
                </span>
                {link.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Scrollable Content */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
