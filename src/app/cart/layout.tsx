import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Cart',
  description: 'Review your fresh groceries before checking out.',
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
