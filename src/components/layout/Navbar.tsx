"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { ShoppingBasket, Menu, X, Search, FileText } from "lucide-react";
import { CustomOrderModal } from "@/components/CustomOrderModal";

export function Navbar() {
  const items = useCartStore((state) => state.items);
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/shop?q=${encodeURIComponent(q)}`);
    } else {
      router.push('/shop');
    }
    setIsMobileMenuOpen(false);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    // Clear URL param immediately when user erases the query
    if (!val.trim()) {
      router.push('/shop');
    }
  };

  return (
    <>
    <header className="flex flex-col border-b border-primary/10 bg-white/80 backdrop-blur-md sticky top-0 z-50 dark:bg-background-dark/80 transition-all">
      <div className="flex items-center justify-between px-6 md:px-20 py-4 relative">
        {/* Left Side: Logo */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2 text-primary shrink-0">
             <Image 
                src="/logo.jpeg" 
                alt="Grocerly Logo" 
                width={48} 
                height={48} 
                className="rounded-full object-cover border-2 border-primary/20"
             />
            <h2 className="text-slate-900 dark:text-slate-100 text-2xl font-black leading-tight tracking-tight">
              Grocerly
            </h2>
          </Link>
        </div>

        {/* Center: Desktop Links */}
        <nav className="hidden lg:flex absolute left-[40%] -translate-x-1/2 items-center space-x-10">
          <Link href="/shop" className="text-slate-700 dark:text-slate-300 text-sm font-semibold hover:text-primary transition-colors">
            Shop
          </Link>
          <Link href="/weekly-basket" className="text-slate-700 dark:text-slate-300 text-sm font-semibold hover:text-primary transition-colors">
            Weekly Basket
          </Link>
        </nav>

        {/* Right Side: Search, Cart & Mobile Toggle */}
        <div className="flex flex-1 justify-end gap-6 items-center">
          <form onSubmit={handleSearch} className="hidden lg:flex flex-col min-w-40 !h-11 max-w-64 w-full">
            <div className="flex w-full flex-1 items-stretch rounded-xl h-full shadow-sm">
              <button
                type="submit"
                className="text-primary/60 flex border-none bg-primary/5 items-center justify-center pl-4 rounded-l-xl hover:text-primary transition-colors"
              >
                <Search size={18} />
              </button>
              <input
                className="flex w-full min-w-0 flex-1 border-none bg-primary/5 focus:ring-0 h-full placeholder:text-primary/40 px-4 rounded-r-xl text-sm outline-none"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </form>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsCustomModalOpen(true)}
              className="hidden lg:flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-xl text-sm font-bold transition-colors"
            >
              <FileText size={16} />
              Custom Order
            </button>
            <Link href="/cart" className="relative group hover:-translate-y-0.5 transition-transform flex items-center justify-center p-2 rounded-full hover:bg-primary/5">
              <ShoppingBasket size={24} className="text-slate-700 dark:text-slate-300" strokeWidth={2.5} />
              {cartItemCount > 0 && (
                <span className="absolute 0 top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold group-hover:scale-110 transition-transform">
                  {cartItemCount}
                </span>
              )}
            </Link>
            
            {/* Mobile Menu Toggle Button */}
            <button 
              className="md:hidden flex items-center justify-center p-2 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <nav className="md:hidden flex flex-col items-center bg-white dark:bg-slate-900 border-t border-primary/10 py-4 gap-1 shadow-lg animate-in slide-in-from-top-2">
           <Link href="/shop" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center py-3 text-slate-700 dark:text-slate-300 font-bold hover:bg-primary/5 hover:text-primary transition-colors">
             Shop
           </Link>
           <Link href="/weekly-basket" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center py-3 text-slate-700 dark:text-slate-300 font-bold hover:bg-primary/5 hover:text-primary transition-colors">
             Weekly Basket
           </Link>
           <button onClick={() => { setIsMobileMenuOpen(false); setIsCustomModalOpen(true); }} className="w-full text-center py-3 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
             Custom Order
           </button>

           {/* Secondary links */}
           <div className="w-full border-t border-slate-100 dark:border-slate-800 my-2" />
           <Link href="/about-us" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center py-3 text-slate-500 dark:text-slate-400 text-sm font-semibold hover:bg-primary/5 hover:text-primary transition-colors">
             About Us
           </Link>
           <Link href="/contact-us" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center py-3 text-slate-500 dark:text-slate-400 text-sm font-semibold hover:bg-primary/5 hover:text-primary transition-colors">
             Contact Us
           </Link>

           {/* Mobile Search */}
           <form onSubmit={handleSearch} className="w-full px-6 py-2 mt-2">
             <div className="flex w-full items-stretch rounded-xl h-11 shadow-sm border border-slate-200 dark:border-slate-800">
                <button type="submit" className="text-primary/60 flex border-none bg-primary/5 items-center justify-center pl-4 rounded-l-xl hover:text-primary transition-colors">
                  <Search size={18} />
                </button>
                <input
                  className="flex w-full min-w-0 flex-1 border-none bg-primary/5 focus:ring-0 h-full placeholder:text-primary/40 px-4 rounded-r-xl text-sm outline-none"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
             </div>
           </form>
        </nav>
      )}
    </header>
    
    <CustomOrderModal 
      isOpen={isCustomModalOpen} 
      onClose={() => setIsCustomModalOpen(false)} 
    />
    </>
  );
}
