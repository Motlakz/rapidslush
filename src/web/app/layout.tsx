import type { Metadata, Viewport } from 'next';
import { Caprasimo, Lexend_Deca, Quicksand } from 'next/font/google';

import { site } from '@/lib/site';

// The game's own faces: Caprasimo for headings and buttons, Quicksand for reading, Lexend Deca for numbers.
const display = Caprasimo({ weight: '400', subsets: ['latin'], variable: '--rs-display', display: 'swap' });
const text = Quicksand({ weight: ['500', '600', '700'], subsets: ['latin'], variable: '--rs-text', display: 'swap' });
const num = Lexend_Deca({ weight: ['400', '500'], subsets: ['latin'], variable: '--rs-num', display: 'swap' });

export const metadata: Metadata = {
  title: { default: `${site.name}: a slushy arcade game for Android`, template: `%s | ${site.name}` },
  description:
    'Rapid Slush is a free-to-play arcade game: hold a tap, let go on the line and serve the order before the belt moves. 130 levels on two machines.',
  icons: { icon: '/favicon.svg', apple: '/apple-touch-icon.png' },
  openGraph: { type: 'website', siteName: site.name, images: [{ url: '/share.jpg', width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image' },
  // canonical: set once the domain exists
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#fff6e5' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${text.variable} ${num.variable}`}>
      <head>
        <link rel="stylesheet" href="/site.css" />
        <noscript>
          {/* without JS there is no loader and no scroll motion: show everything */}
          <style>{`.loader { display: none !important; } .io { opacity: 1 !important; }`}</style>
        </noscript>
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
