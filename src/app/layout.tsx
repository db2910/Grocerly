import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grocerly - Fresh Local Groceries",
  description: "Fresh groceries from local markets, delivered to you.",
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
