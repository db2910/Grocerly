'use client';

import Link from "next/link";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { CategoryFilter } from "@/components/shop/CategoryFilter";
import { SortDropdown, SortOption } from "@/components/shop/SortDropdown";
import { fetchProducts, fetchCategories, DbProduct, DbCategory, Product } from "@/lib/supabase/db";
// MarketFilter import kept but hidden — re-enable when vendor/market feature launches
// import { MarketFilter } from "@/components/shop/MarketFilter";

// Convert a DbProduct from Supabase into the Product shape expected by ProductCard
function toProduct(p: DbProduct): Product {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    unit: p.unit,
    imageUrl: p.image_url ?? '',
    source: p.source ?? '',
    marketName: p.markets?.name ?? '',
    categoryId: p.categories?.slug ?? p.category_id ?? '',
    isFresh: p.is_fresh,
    isSale: p.is_sale,
    variants: p.variants,
  };
}

function ShopContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const urlQuery = searchParams.get('q') ?? '';

  const [products, setProducts] = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Local search state — initialised from URL param, but updates live as user types
  const [searchInput, setSearchInput] = useState(urlQuery);

  // Sync when navigating to /shop?q=... from the Navbar
  useEffect(() => {
    setSearchInput(urlQuery);
  }, [urlQuery]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(24);
  }, [selectedCategoryId, searchInput, sortBy]);

  // Fetch all data from Supabase on mount
  useEffect(() => {
    async function load() {
      setLoading(true);
      const [cats, prods] = await Promise.all([
        fetchCategories(),
        fetchProducts(),
      ]);
      setCategories(cats);
      setProducts(prods);
      setLoading(false);
    }
    load();
  }, []);

  // Handle URL category parameter — match by slug
  useEffect(() => {
    if (categoryParam && categories.length > 0) {
      const cat =
        categories.find(c => c.slug === categoryParam) ||
        categories.find(c => c.name.toLowerCase() === categoryParam.toLowerCase());
      setSelectedCategoryId(cat ? cat.slug : null);
    }
  }, [categoryParam, categories]);

  // Filter and sort
  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategoryId) {
      result = result.filter(p => p.categories?.slug === selectedCategoryId);
    }

    if (searchInput) {
      const q = searchInput.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.source ?? '').toLowerCase().includes(q)
      );
    }

    // Ensure only active products are shown on the shop page
    result = result.filter(p => p.is_active);

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':  return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'name-asc':   return a.name.localeCompare(b.name);
        case 'name-desc':  return b.name.localeCompare(a.name);
        default: return 0;
      }
    });
  }, [products, selectedCategoryId, searchInput, sortBy]);

  // Map DbCategory → shape expected by CategoryFilter
  const categoryFilterItems = categories.map(c => ({ id: c.slug, name: c.name, icon: c.icon ?? '' }));

  const activeCategory = categories.find(c => c.slug === selectedCategoryId);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 lg:px-20 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500 font-medium">
        <Link className="hover:text-primary transition-colors" href="/">Home</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-slate-900 dark:text-slate-100">Shop</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Sidebar Filters — Desktop Only */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-28 space-y-8">
            <CategoryFilter
              categories={categoryFilterItems}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
            />
          </div>
        </aside>

        {/* Product Content */}
        <div className="flex-1">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {searchInput
                  ? <>Results for <span className="text-primary">&ldquo;{searchInput}&rdquo;</span></>
                  : activeCategory ? activeCategory.name : "All Groceries"}
              </h1>
              <p className="mt-2 text-slate-500 font-medium">
                Showing {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''}
                {searchInput && (
                  <button onClick={() => setSearchInput('')} className="ml-3 text-primary text-sm font-bold hover:underline">Clear search ✕</button>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-auto">
              {/* Inline search on shop page for live filtering */}
              <div className="relative hidden sm:flex items-center">
                <span className="absolute left-3 text-slate-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/></svg>
                </span>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search products..."
                  className="pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 w-48"
                />
                {searchInput && (
                  <button onClick={() => setSearchInput('')} className="absolute right-3 text-slate-400 hover:text-slate-600">✕</button>
                )}
              </div>
              <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Sort by:</span>
              <SortDropdown sortBy={sortBy} onSortChange={setSortBy} />
            </div>
          </div>


          {/* Product Grid */}
          {filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredProducts.slice(0, visibleCount).map(p => (
                  <ProductCard key={p.id} product={toProduct(p)} />
                ))}
              </div>
              {visibleCount < filteredProducts.length && (
                <div className="mt-12 flex justify-center">
                  <button
                    onClick={() => setVisibleCount(v => v + 24)}
                    className="bg-white dark:bg-slate-800 border-2 border-primary text-primary font-bold py-3 px-10 rounded-xl hover:bg-primary/5 active:scale-95 transition-all"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">search_off</span>
              <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">No products found</h3>
              <p className="text-slate-500 max-w-sm">
                We couldn't find any products matching your current filters. Try selecting a different category or market location.
              </p>
              <button
                onClick={() => { setSelectedCategoryId(null); }}
                className="mt-6 font-semibold text-primary hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Filter Button */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="lg:hidden fixed bottom-8 right-6 z-[60] flex items-center gap-2 bg-primary text-white px-5 py-3.5 rounded-2xl font-black shadow-xl shadow-primary/40 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-[20px]">tune</span>
        Categories
      </button>

      {/* Mobile Category Drawer (Bottom Sheet) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />
          
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-800 rounded-t-[32px] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 italic">Categories</h2>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-50 dark:bg-slate-700"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              <CategoryFilter
                categories={categoryFilterItems}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={(id) => {
                  setSelectedCategoryId(id);
                  setIsDrawerOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Shop() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center py-20">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
