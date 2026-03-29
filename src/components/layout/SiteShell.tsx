'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Toaster } from 'sonner';

/**
 * SiteShell renders the Navbar + Footer + Toaster only for store-facing
 * pages. Admin pages (/admin/*) get a clean, isolated experience with none
 * of those shopping-related UI elements.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    // Clean standalone admin experience — no shopping UI
    return (
      <>
        {children}
        <Toaster
          position="bottom-right"
          richColors
          duration={2500}
          toastOptions={{ classNames: { toast: 'font-display' } }}
        />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
      <Toaster
        position="bottom-right"
        richColors
        duration={2500}
        toastOptions={{ classNames: { toast: 'font-display' } }}
      />
    </>
  );
}
