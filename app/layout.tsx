import type { Metadata } from "next";
import "./globals.css";
import { DriftingGridBackground } from './components/DriftingGridBackground';
import { ToolHeader } from './components/ToolHeader';


export const metadata = {
  title: 'Flash Juice',
  description: "Create a fast-paced (sped up) version of any chosen song.",
  icons: { icon: '/favicon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="relative min-h-full flex flex-col">
        <DriftingGridBackground />
        <div className="relative z-10 flex flex-col min-h-full">
          <ToolHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
