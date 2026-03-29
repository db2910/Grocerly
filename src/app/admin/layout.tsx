"use client";

import Link from "next/link";
import Image from "next/image";
import { useAdminStore } from "@/lib/store/adminStore";
import { Bell, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pendingOrdersCount = useAdminStore((state) => state.getPendingOrdersCount());
  const pathname = usePathname();
  const router = useRouter();

  // Login page gets no shell — render it standalone
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Admin Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-800 border-b border-primary/10 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            className="md:hidden p-2 -ml-2 text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
             {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Link href="/admin/dashboard" className="flex items-center gap-3 text-primary shrink-0">
            <Image 
              src="/logo.jpeg" 
              alt="Grocerly Admin" 
              width={40} 
              height={40} 
              className="rounded-xl object-cover border-2 border-primary/20"
            />
            <div className="hidden sm:block">
              <h2 className="text-slate-900 dark:text-slate-100 text-lg font-black leading-tight tracking-tight">
                Grocerly
              </h2>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none">Admin Panel</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-xl w-64 border border-slate-200 dark:border-slate-700">
            <Search size={18} className="text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search admin..." 
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400"
            />
          </div>
          
          <Link href="/admin/dashboard" className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors group">
            <Bell size={24} />
            {pendingOrdersCount > 0 && (
              <span className="absolute top-0 right-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white font-black border-2 border-white dark:border-slate-800 shadow-sm group-hover:scale-110 transition-transform">
                {pendingOrdersCount}
              </span>
            )}
          </Link>
          
          <div className="h-9 w-9 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary font-bold shadow-sm">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Log Out"
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          absolute md:static top-0 left-0 h-full z-40 bg-white dark:bg-slate-800 border-r border-primary/10 
          w-64 flex flex-col shrink-0 transition-transform duration-300 shadow-xl md:shadow-none
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="p-6 overflow-y-auto w-full">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Management</p>
            <nav className="flex flex-col gap-2 w-full">
               <SidebarLink href="/admin/dashboard" icon="dashboard" label="Dashboard" currentPath={pathname} onClick={() => setIsMobileMenuOpen(false)} />
               <SidebarLink href="/admin/orders" icon="shopping_bag" label="Orders" currentPath={pathname} onClick={() => setIsMobileMenuOpen(false)} />
               <SidebarLink href="/admin/products" icon="inventory_2" label="Products" currentPath={pathname} onClick={() => setIsMobileMenuOpen(false)} />
               <SidebarLink href="/admin/weekly-basket" icon="shopping_basket" label="Weekly Basket" currentPath={pathname} onClick={() => setIsMobileMenuOpen(false)} />
               <SidebarLink href="/admin/markets" icon="storefront" label="Markets" currentPath={pathname} onClick={() => setIsMobileMenuOpen(false)} />
               <SidebarLink href="/admin/customers" icon="group" label="Customers" currentPath={pathname} onClick={() => setIsMobileMenuOpen(false)} />
               <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-6 w-full">
                 <SidebarLink href="/admin/reports" icon="bar_chart" label="Reports" currentPath={pathname} onClick={() => setIsMobileMenuOpen(false)} />
               </div>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}

function SidebarLink({ 
  href, 
  icon, 
  label, 
  currentPath,
  onClick
}: { 
  href: string; 
  icon: string; 
  label: string; 
  currentPath: string;
  onClick?: () => void;
}) {
  const isActive = currentPath === href || currentPath.startsWith(`${href}/`);
  
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 font-bold rounded-xl transition-colors w-full ${
        isActive 
          ? 'bg-primary/10 text-primary' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-primary/5'
      }`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      {label}
    </Link>
  );
}
