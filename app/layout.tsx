import type { Metadata } from "next";
import "./globals.css";

export const metadata = {
  title: 'Flash Juice',
  description: 'Sped-Up & Slowed+Reverb Generator',
  icons: { icon: '/favicon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
