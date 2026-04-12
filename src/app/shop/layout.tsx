import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse our wide selection of fresh local groceries from Kigali markets.',
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
