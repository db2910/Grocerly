import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://grocerly-sigma.vercel.app'),
  title: {
    template: "%s | Grocerly",
    default: "Grocerly - Fresh Local Groceries",
  },
  description: "Fresh groceries from local markets, delivered to you in Kigali.",
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: "Grocerly - Fresh Local Groceries",
    description: "Fresh groceries from local markets, delivered to you in Kigali.",
    siteName: "Grocerly",
    images: [
      {
        url: "/logo.jpeg",
        width: 800,
        height: 800,
        alt: "Grocerly Logo",
      }
    ],
    locale: "en_RW",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grocerly - Fresh Local Groceries",
    description: "Fresh groceries from local markets, delivered to you in Kigali.",
    images: ["/logo.jpeg"],
  },
};

import { SiteShell } from "@/components/layout/SiteShell";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${workSans.variable} font-display relative flex min-h-screen flex-col overflow-x-hidden`}>
        <SiteShell>
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
