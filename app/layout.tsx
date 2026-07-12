import type { Metadata } from "next";
import "./globals.css";
import { DriftingGridBackground } from './components/DriftingGridBackground';
import { ToolHeader } from './components/ToolHeader';


export const metadata = {
  title: 'Flash Juice',
  description: "Create a fast-paced (sped up) version of any chosen song.",
      icons: [
    { rel: 'icon', url: '/favicon-v2.ico' },
    { rel: 'icon', url: '/favicon-48-v2.png', sizes: '48x48', type: 'image/png' },
    { rel: 'icon', url: '/favicon-32-v2.png', sizes: '32x32', type: 'image/png' },
    { rel: 'icon', url: '/favicon-192-v2.png', sizes: '192x192', type: 'image/png' },
    { rel: 'icon', url: '/favicon-512-v2.png', sizes: '512x512', type: 'image/png' },
    { rel: 'apple-touch-icon', url: '/favicon-512-v2.png', sizes: '512x512', type: 'image/png' },
  ],

    { rel: 'icon', url: '/favicon-48-v2.png', sizes: '48x48', type: 'image/png' },
    { rel: 'icon', url: '/favicon-32-v2.png', sizes: '32x32', type: 'image/png' },
    { rel: 'icon', url: '/favicon-192-v2.png', sizes: '192x192', type: 'image/png' },
    { rel: 'icon', url: '/favicon-512-v2.png', sizes: '512x512', type: 'image/png' },
    { rel: 'apple-touch-icon', url: '/favicon-512-v2.png', sizes: '512x512', type: 'image/png' },
  ],
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
