"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useCartStore } from "@/store/cartStore";
import { fetchWeeklyBaskets, DbWeeklyBasket } from "@/lib/supabase/db";

export default function WeeklyBasketPage() {
  const [baskets, setBaskets] = useState<DbWeeklyBasket[]>([]);
  const [loading, setLoading] = useState(true);
  const addBasket = useCartStore((s) => s.addBasket);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchWeeklyBaskets();
      setBaskets(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleAddToCart = (basketId: string) => {
    const basket = baskets.find((b) => b.id === basketId);
    if (!basket) return;

    addBasket({
      id: basket.id,
      name: basket.name,
      total_price: basket.total_price,
      items: basket.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        price_at_time: item.price_at_time,
      })),
    });

    toast.success(`"${basket.name}" added to cart`, {
      description: `${basket.items.length} items • ${basket.total_price.toLocaleString()} RWF`,
      action: { label: "View Cart", onClick: () => (window.location.href = "/cart") },
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 lg:px-20 py-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-amber-500 px-8 py-16 md:px-20 flex flex-col items-center text-center gap-6 text-white mb-16 shadow-lg shadow-amber-500/20">
        <span className="material-symbols-outlined text-6xl opacity-80 mb-2">local_florist</span>
        <h1 className="text-4xl md:text-6xl font-black">Weekly Fresh Basket</h1>
        <p className="max-w-2xl text-lg text-white/90">
          Curated weekly by our team. Get the best of the season's harvest with special discounts compared to buying individually.
        </p>
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-600/40 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
      </div>

      {/* Benefits */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {[
          { icon: "savings", title: "Save up to 20%", desc: "Bulk discount automatically applied." },
          { icon: "nutrition", title: "Peak Season Quality", desc: "Only the best in-season produce makes the cut." },
          { icon: "volunteer_activism", title: "Support Local", desc: "Directly supports Rwandan farming families." },
        ].map((b) => (
          <div key={b.title} className="flex flex-col items-center text-center gap-4 bg-primary/5 p-8 rounded-2xl">
            <span className="material-symbols-outlined text-4xl text-primary">{b.icon}</span>
            <h3 className="font-bold text-xl">{b.title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>

      {/* Active Baskets */}
      {baskets.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl">
          <span className="material-symbols-outlined text-6xl text-slate-300 block mb-4">shopping_basket</span>
          <h2 className="text-2xl font-black text-slate-700 mb-2">No baskets available this week</h2>
          <p className="text-slate-500">Check back on Monday for our updated weekly selections.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {baskets.map((basket) => (
            <div key={basket.id} className="rounded-3xl border border-primary/10 overflow-hidden shadow-sm bg-white dark:bg-slate-900">
              {/* Basket Header */}
              <div className="px-8 py-8 bg-gradient-to-r from-primary/5 to-amber-50 dark:from-primary/10 dark:to-slate-800 border-b border-primary/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-primary text-3xl">shopping_basket</span>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">{basket.name}</h2>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 max-w-xl">{basket.description}</p>
                  <p className="text-xs font-bold text-primary mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    {basket.week_label || "Active this week"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Basket Price</p>
                    <p className="text-4xl font-black text-primary">{basket.total_price.toLocaleString()} <span className="text-lg font-bold text-slate-500">RWF</span></p>
                  </div>
                  <button
                    onClick={() => handleAddToCart(basket.id)}
                    className="flex items-center gap-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold px-8 py-4 rounded-2xl hover:scale-[1.02] transition-transform shadow-xl text-base whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined">shopping_bag</span>
                    Add Basket to Cart
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="p-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-5">What's inside</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {basket.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl group hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary">inventory_2</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{item.name}</p>
                        <p className="text-xs text-slate-500">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{(item.price_at_time * item.quantity).toLocaleString()} RWF</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="px-8 pb-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-primary/5 pt-6">
                <p className="text-sm text-slate-500">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{basket.items.length} items</span> • Total value:{" "}
                  <span className="font-bold">{basket.total_price.toLocaleString()} RWF</span>
                </p>
                <div className="flex items-center gap-4">
                  <Link href="/cart" className="text-sm font-bold text-primary hover:underline">
                    View Cart →
                  </Link>
                  <button
                    onClick={() => handleAddToCart(basket.id)}
                    className="flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-md text-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
