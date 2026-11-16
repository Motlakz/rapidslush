import type { Metadata, Viewport } from 'next';
import { Caprasimo, Lexend_Deca, Quicksand } from 'next/font/google';

import Script from 'next/script';

import { site } from '@/lib/site';

// The game's own faces (the client's brand, in place of the taste skill's dealt pairing):
// Caprasimo for headings and buttons, Quicksand for reading, Lexend Deca for numbers.
const display = Caprasimo({ weight: '400', subsets: ['latin'], variable: '--rs-display', display: 'swap' });
const text = Quicksand({ weight: ['400', '500', '600'], subsets: ['latin'], variable: '--rs-text', display: 'swap' });
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

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#17152a' };

// The guard the kit's motion layer needs before the first paint (its entrances show finished if motion.js is late).
const GUARDS = "document.documentElement.classList.add('m-enter');setTimeout(()=>document.documentElement.classList.add('m-enter-done'),700)";

// The palette start.mjs printed for the game's own colours (brand: ground #17152A, ink cream, accent berry), kept as
// printed; the font tokens point at the brand faces above.
const PALETTE = `:root {
  --p-bg: #17152a; --p-surface: #201e33; --p-ink: #fff9f1; --p-muted: #8c8992;
  --p-accent: #ff6b8a; --p-accent-ink: #17152a; --p-action: #ff6b8a; --p-action-ink: #17152a;
  --p-inv-bg: #fff9f1; --p-inv-surface: #ece7e2; --p-inv-ink: #17152a; --p-inv-muted: #656270;
  --p-inv-accent: #17152a; --p-inv-accent-ink: #fff9f1; --p-inv-action: #17152a; --p-inv-action-ink: #fff9f1;
  --font-display: var(--rs-display), system-ui, sans-serif;
  --font-text: var(--rs-text), system-ui, sans-serif;
  --font-mono: var(--rs-num), ui-monospace, Menlo, Consolas, monospace;
  --display-weight: 400;
  --display-tracking: -0.01em;
  --display-tracking-xl: -0.015em;
  --ly-scale: 0.98;
}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-type="software"
      data-radius="soft"
      data-buttons="block"
      data-motion=""
      suppressHydrationWarning
      className={`${display.variable} ${text.variable} ${num.variable}`}
    >
      <head>
        <meta name="page-type" content="software" />
        <meta name="site-kind" content="gaming" />
        <link rel="stylesheet" href="/assets/system.css" />
        <link rel="stylesheet" href="/assets/ui/cards.css" />
        <link rel="stylesheet" href="/assets/motion/motion.css" />
        <link rel="stylesheet" href="/assets/layout/layout.css" />
        <style dangerouslySetInnerHTML={{ __html: PALETTE }} />
        <link rel="stylesheet" href="/site.css" />
        <script dangerouslySetInnerHTML={{ __html: GUARDS }} />
      </head>
      <body suppressHydrationWarning>
        {children}
        {/* the kit rewrites parts of the DOM (scene words, the moment canvas, the phone sheet), so it runs after React
            has hydrated the server HTML, never racing it */}
        <Script type="module" src="/assets/system.js" strategy="afterInteractive" />
        <Script type="module" src="/assets/motion/motion.js" strategy="afterInteractive" />
        <Script type="module" src="/assets/layout/layout.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
