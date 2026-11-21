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
    'Rapid Slush is a free arcade game with nothing to buy: hold a tap, let go on the line and serve the order before the belt moves. 130 levels on two machines.',
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
        {/* Hold the hero's words and picture back from the first paint so its entrance never flashes.
            CandyMotion lifts this; the timeout shows everything if the script never runs. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "if(!matchMedia('(prefers-reduced-motion: reduce)').matches){var d=document.documentElement;d.classList.add('enter');setTimeout(function(){d.classList.remove('enter')},2500)}",
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
