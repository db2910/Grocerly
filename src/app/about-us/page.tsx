import Link from "next/link";

const STEPS = [
  {
    num: "01",
    icon: "storefront",
    title: "Browse Products",
    desc: "Explore fresh groceries from local Kigali markets. Filter by category, market, or price.",
  },
  {
    num: "02",
    icon: "add_shopping_cart",
    title: "Add to Cart",
    desc: "Select items and quantities you need. Your cart updates instantly.",
  },
  {
    num: "03",
    icon: "chat",
    title: "Send via WhatsApp",
    desc: "Confirm your order and delivery address in one tap through WhatsApp.",
  },
  {
    num: "04",
    icon: "local_shipping",
    title: "We Deliver",
    desc: "Our team shops at the market and delivers straight to your doorstep — same day.",
  },
];

const BENEFITS = [
  {
    icon: "eco",
    title: "Always Fresh",
    desc: "We source directly from local markets every morning, guaranteeing peak freshness.",
  },
  {
    icon: "schedule",
    title: "Saves You Time",
    desc: "Skip the traffic and queues. Order in minutes, receive at home.",
  },
  {
    icon: "verified",
    title: "Reliable Service",
    desc: "Hundreds of orders delivered weekly with consistent quality and punctuality.",
  },
  {
    icon: "volunteer_activism",
    title: "Supports Local",
    desc: "Every purchase goes directly to Rwandan farmers and market vendors.",
  },
];

export default function AboutUs() {
  return (
    <div className="flex flex-col w-full flex-1">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 py-24 px-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
          <span className="text-primary font-bold tracking-widest text-xs uppercase bg-primary/10 w-fit px-3 py-1 rounded-full">
            Our Story
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            Fresh groceries from local markets,{" "}
            <span className="text-primary">delivered to your home.</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
            Grocerly was built to bridge the gap between Rwanda's vibrant local markets
            and busy families who deserve fresh food without the hassle.
          </p>
          <Link
            href="/shop"
            className="mt-2 flex items-center gap-2 bg-primary text-white font-bold px-8 py-4 rounded-xl hover:scale-[1.02] transition-transform shadow-xl shadow-primary/30"
          >
            <span className="material-symbols-outlined">storefront</span>
            Start Shopping
          </Link>
        </div>
      </section>

      {/* Who We Are */}
      <section className="max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-primary font-bold tracking-widest text-xs uppercase bg-primary/10 w-fit px-3 py-1 rounded-full block mb-6">
              Who We Are
            </span>
            <h2 className="text-3xl md:text-4xl font-black mb-6 text-slate-900 dark:text-slate-100 tracking-tight">
              Kigali's local grocery delivery service
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Founded in Kigali, Grocerly started as a small initiative to help local market vendors
              reach more customers. We partner with Kimironko, Nyabugogo, Gikondo and other major
              markets to bring you the best produce — sourced fresh every morning.
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We deliver thousands of orders weekly, connecting families with trusted local farmers
              and ensuring that money spent stays in the Rwandan economy.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-6">
              {[
                { value: "5,000+", label: "Orders Delivered" },
                { value: "3", label: "Major Markets" },
                { value: "100+", label: "Local Vendors" },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-4 bg-primary/5 rounded-2xl">
                  <p className="text-2xl font-black text-primary">{stat.value}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div
            className="aspect-[4/3] rounded-3xl bg-cover bg-center shadow-2xl overflow-hidden"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000")',
            }}
          >
            <div className="w-full h-full bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white dark:bg-slate-900/50 py-20 w-full">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-primary font-bold tracking-widest text-xs uppercase bg-primary/10 w-fit px-3 py-1 rounded-full inline-block mb-4">
              How It Works
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              From market to your door in 4 steps
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative flex flex-col gap-5 p-8 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-transparent hover:border-primary/20 hover:shadow-lg transition-all">
                <span className="text-5xl font-black text-primary/10 absolute top-6 right-6">{step.num}</span>
                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                  <span className="material-symbols-outlined text-xl">{step.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="text-center mb-14">
          <span className="text-primary font-bold tracking-widest text-xs uppercase bg-primary/10 w-fit px-3 py-1 rounded-full inline-block mb-4">
            Why Grocerly
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Built around your convenience
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex flex-col gap-4 p-8 rounded-3xl bg-white dark:bg-slate-800 border border-primary/5 hover:border-primary/20 hover:shadow-xl transition-all shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-primary">{b.icon}</span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{b.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="w-full py-20 px-6 bg-primary">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
          <span className="material-symbols-outlined text-5xl text-white/60">eco</span>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
            Our mission is to make fresh, locally-sourced food accessible to every household in Rwanda.
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            We believe that good food shouldn't be a luxury. By eliminating the hassle of
            market trips, we free up your time while directly supporting the farmers and vendors
            who feed our communities.
          </p>
          <Link
            href="/shop"
            className="mt-4 bg-white text-primary font-bold px-8 py-4 rounded-xl hover:scale-105 transition-transform shadow-xl"
          >
            Start Shopping Now
          </Link>
        </div>
      </section>

    </div>
  );
}
