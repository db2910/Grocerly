import Link from "next/link";
import Image from "next/image";
import { Carrot, EggFried, Wheat, Beef, Flame } from "lucide-react";
import React from "react";
import { fetchCategories } from "@/lib/supabase/db";

// Map category SLUGS to Lucide icons and descriptions
const CATEGORY_ICONS: Record<string, { icon: React.ElementType; desc: string }> = {
  "fruits-veggies":     { icon: Carrot,   desc: "Farm Fresh" },
  "meat-fish":          { icon: Beef,     desc: "Premium Cuts" },
  "dairy-eggs":         { icon: EggFried, desc: "Natural Pastures" },
  "grains-staples":     { icon: Wheat,    desc: "Kitchen Staples" },
  "cooking-essentials": { icon: Flame,    desc: "Kitchen Essentials" },
};

export default async function Home() {
  const categories = await fetchCategories();
  return (
    <>
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 w-full">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex flex-col gap-8 flex-1">
            <div className="flex flex-col gap-4">
              <span className="text-primary font-bold tracking-widest text-xs uppercase bg-primary/10 w-fit px-3 py-1 rounded-full">
                Fresh &amp; Local
              </span>
              <h1 className="text-slate-900 dark:text-slate-100 text-5xl md:text-7xl font-black leading-tight tracking-tight">
                Fresh groceries from local markets,{" "}
                <span className="text-primary">delivered to you.</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl leading-relaxed max-w-xl">
                Experience the finest seasonal produce and artisanal goods from
                your favorite local vendors, delivered straight to your doorstep
                with care.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/shop" className="flex-1 min-w-[140px] cursor-pointer items-center justify-center rounded-xl h-14 px-6 bg-primary text-white text-base font-bold hover:scale-[1.02] transition-transform shadow-xl shadow-primary/30 flex">
                Start Your Order
              </Link>
              <Link href="/weekly-basket" className="flex-1 min-w-[140px] cursor-pointer items-center justify-center rounded-xl h-14 px-6 border-2 border-primary/20 text-primary text-base font-bold hover:bg-primary/5 transition-colors flex">
                Browse Basket
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full relative overflow-hidden rounded-2xl">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-primary/20 rounded-full blur-3xl"></div>
            <div
              className="relative w-full aspect-square md:aspect-[4/3] bg-center bg-no-repeat bg-cover rounded-2xl shadow-2xl overflow-hidden"
              style={{
                backgroundImage:
                  'url("https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000")',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Shop by Category */}
      <section className="bg-white dark:bg-background-dark/50 py-16 w-full">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-slate-900 dark:text-slate-100 text-3xl font-bold tracking-tight">
                Shop by Category
              </h2>
              <p className="text-slate-500 mt-2">
                The freshest picks from our partner producers
              </p>
            </div>
            <Link
              className="text-primary font-semibold flex items-center gap-1 hover:underline"
              href="/shop"
            >
              View all{" "}
              <span className="material-symbols-outlined">chevron_right</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {categories.map((cat) => {
              const meta = CATEGORY_ICONS[cat.slug];
              const Icon = meta?.icon;
              return (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className="group cursor-pointer flex flex-col items-center gap-4 p-6 rounded-2xl bg-background-light dark:bg-background-dark border border-transparent hover:border-primary/20 transition-all hover:shadow-lg"
                >
                  <div className="bg-white dark:bg-slate-800 shadow-sm aspect-square rounded-full w-20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {Icon ? (
                      <Icon className="w-10 h-10 text-primary" strokeWidth={1.5} />
                    ) : (
                      <span className="material-symbols-outlined text-3xl text-primary">{cat.icon}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="text-slate-900 dark:text-slate-100 font-bold">
                      {cat.name}
                    </h3>
                    <p className="text-slate-500 text-xs">{meta?.desc ?? ""}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="flex flex-col gap-6 text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-slate-900 dark:text-slate-100 text-4xl font-bold tracking-tight">
            Why Choose Grocerly?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            We connect you with the best local producers to ensure quality and
            sustainability in every bite.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Locally Sourced",
              icon: "storefront",
              desc: "Supporting local farmers and small businesses in your community with every purchase.",
            },
            {
              title: "Eco-Friendly",
              icon: "eco",
              desc: "Plastic-free packaging and carbon-neutral delivery options to protect our planet.",
            },
            {
              title: "Fast Delivery",
              icon: "bolt",
              desc: "Get your groceries delivered fresh within 2 hours of ordering from your local market.",
            },
          ].map((prop) => (
            <div
              key={prop.title}
              className="flex flex-col gap-6 p-8 rounded-2xl bg-white dark:bg-background-dark border border-primary/5 hover:border-primary/20 transition-all shadow-xl shadow-slate-200/50 dark:shadow-none"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-primary">
                  {prop.icon}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-slate-900 dark:text-slate-100 text-xl font-bold">
                  {prop.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {prop.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Promo Section */}
      <section className="max-w-7xl mx-auto px-6 pb-24 w-full">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 md:px-20 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="relative z-10 flex flex-col gap-6 max-w-xl text-white">
            <h2 className="text-4xl md:text-5xl font-black">
              Join our Weekly Basket program
            </h2>
            <p className="text-white/80 text-lg">
              Save 15% on your monthly groceries and get exclusive access to
              seasonal items and artisan specials.
            </p>
            <Link href="/weekly-basket" className="bg-white text-primary px-8 py-4 rounded-xl font-bold w-fit hover:scale-105 transition-transform block text-center">
              Learn More
            </Link>
          </div>
          <div className="relative z-10 hidden lg:block">
            <div className="w-80 h-80 bg-white/20 rounded-full flex items-center justify-center blur-2xl absolute -top-10 -right-10"></div>
            <div className="w-64 aspect-[3/4] bg-white rounded-2xl shadow-2xl rotate-6 p-4 flex flex-col gap-4">
              <div
                className="w-full aspect-square bg-slate-100 rounded-lg bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&q=80&w=400')",
                }}
              ></div>
              <div className="flex flex-col gap-1">
                <div className="h-4 w-2/3 bg-slate-200 rounded"></div>
                <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
              </div>
              <div className="mt-auto flex justify-between items-center">
                <div className="h-6 w-12 bg-primary/20 rounded"></div>
                <div className="h-8 w-8 bg-primary rounded-full"></div>
              </div>
            </div>
          </div>
          {/* Background Pattern Decor */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none"></div>
        </div>
      </section>
    </>
  );
}
