import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-primary/10 bg-white dark:bg-background-dark py-12 px-6 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-primary mb-6 w-fit">
              <Image 
                  src="/logo.jpeg" 
                  alt="Grocerly Logo" 
                  width={48} 
                  height={48} 
                  className="rounded-full object-cover border-2 border-primary/20"
              />
              <h2 className="text-xl font-bold tracking-tight">Grocerly</h2>
            </Link>
            <p className="max-w-xs text-slate-500 leading-relaxed">
              Connecting you with the freshest produce from local markets in Rwanda. Quality guaranteed from farm to table.
            </p>
          </div>
          <div>
            <h4 className="mb-6 font-bold uppercase tracking-wider text-xs text-slate-400">Shop</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link className="text-slate-600 hover:text-primary" href="/shop?category=fruits-veggies">Fruits &amp; Vegetables</Link></li>
              <li><Link className="text-slate-600 hover:text-primary" href="/shop?category=meat-fish">Meat &amp; Fish</Link></li>
              <li><Link className="text-slate-600 hover:text-primary" href="/shop?category=dairy-eggs">Dairy &amp; Eggs</Link></li>
              <li><Link className="text-slate-600 hover:text-primary" href="/shop?category=grains-staples">Grains &amp; Staples</Link></li>
              <li><Link className="text-slate-600 hover:text-primary" href="/shop?category=cooking-essentials">Cooking Essentials</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-6 font-bold uppercase tracking-wider text-xs text-slate-400">Support</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link className="text-slate-600 hover:text-primary" href="/about-us">About Us</Link></li>
              <li><Link className="text-slate-600 hover:text-primary" href="/contact-us">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between border-t border-primary/10 pt-8 text-sm text-slate-400">
          <p>© {new Date().getFullYear()} Grocerly Rwanda. All rights reserved.</p>
          <div className="mt-4 flex gap-6 md:mt-0">
            <Link className="hover:text-primary" href="#">Privacy Policy</Link>
            <Link className="hover:text-primary" href="#">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
