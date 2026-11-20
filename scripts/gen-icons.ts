// Renders the launcher icons, the splash mark and the web favicon from the brand mark (src/ui/brand.ts).
// Run: bun scripts/gen-icons.ts   (writes into assets/images; uses sharp, which ships with the Expo CLI)
import sharp from 'sharp';

import { BRAND, MARK, SPLASH_TILE } from '../src/ui/brand';

const OUT = new URL('../assets/images/', import.meta.url);
const B = BRAND, M = MARK;

// Flat sticker style: solid fills and thick ink outlines only. No gradients: shading and shine are solid shapes.
const defs = `<clipPath id="cup"><path d="${M.cup}"/></clipPath><clipPath id="round"><rect width="512" height="512" rx="112"/></clipPath>`;

/**
 * The shack behind the drink, in 512-unit icon space: sky, sun with a halo, a cloud, the striped scalloped awning
 * (the game's signature) and the wooden counter the cup stands on. Awning and counter run far past the edges so the
 * Android background layer can be zoomed out without showing their ends.
 */
const STRIPE = 64, AWN = 66; // stripe width; awning bottom edge (scallops hang below it)
const scallops = Array.from({ length: 22 }, (_, i) => -640 + i * STRIPE);
const scene = `
  <rect x="-1024" y="-1024" width="2560" height="2560" fill="${B.sky}"/>
  <circle cx="430" cy="150" r="72" fill="${B.halo}"/>
  <circle cx="430" cy="150" r="48" fill="${B.sun}" stroke="${B.ink}" stroke-width="10"/>
  <path transform="translate(-28 -34) scale(.9)" d="M60 196 a24 24 0 0 1 40 -18 a30 30 0 0 1 54 6 a20 20 0 0 1 14 34 H70 a20 20 0 0 1 -10 -22 Z" fill="${B.cloud}" stroke="${B.ink}" stroke-width="9" stroke-linejoin="round"/>
  <g stroke="${B.ink}" stroke-width="10" stroke-linejoin="round">
    ${scallops.map((x, i) => `<path d="M${x} -1024 H${x + STRIPE} V${AWN} A${STRIPE / 2} ${STRIPE / 2 - 6} 0 0 1 ${x} ${AWN} Z" fill="${i % 2 ? B.cream : B.awning}"/>`).join('')}
  </g>
  <rect x="-1024" y="430" width="2560" height="1200" fill="${B.wood}" stroke="${B.ink}" stroke-width="10"/>
  <rect x="-1024" y="435" width="2560" height="22" fill="${B.woodLip}"/>
  <path d="M-1024 457 H1536" stroke="${B.ink}" stroke-width="6"/>
  <g stroke="${B.woodLine}" stroke-width="8" stroke-linecap="round">
    <path d="M-1024 505 H1536"/><path d="M60 457 V505 M300 505 V560 M440 457 V505 M150 560 V620"/>
  </g>`;

/** a four-point ice glint */
const glint = (x: number, y: number, s: number) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -10 C1.5 -2 2 -1.5 10 0 C2 1.5 1.5 2 0 10 C-1.5 2 -2 1.5 -10 0 C-2 -1.5 -1.5 -2 0 -10 Z" fill="${B.cream}" stroke="${B.ink}" stroke-width="2.5" stroke-linejoin="round"/>`;
const glints = glint(444, 300, 2) + glint(64, 236, 1.4);

/** speed streaks: cream bars with an ink outline, sticker-style */
const streaks = M.streaks.map(d => `<path d="${d}" stroke="${B.ink}" stroke-width="30" stroke-linecap="round"/><path d="${d}" stroke="${B.cream}" stroke-width="16" stroke-linecap="round"/>`).join('');

const straw = (line: string) => `
  <path d="${M.straw}" stroke="${line}" stroke-width="34" stroke-linecap="round"/>
  <path d="${M.straw}" stroke="${B.berry}" stroke-width="20" stroke-linecap="round"/>
  <path d="${M.strawStripes}" stroke="${B.cream}" stroke-width="20"/>`;

const dome = `
  <path d="${M.dome}" fill="${B.ink}" stroke="${B.ink}" stroke-width="20" stroke-linejoin="round"/>
  <path d="${M.dome}" fill="${B.mango}"/>
  <path d="${M.domeInner}" fill="${B.berry}"/>
  ${M.domeShine.map((d, i) => `<path d="${d}" stroke="#FFEBBE" stroke-width="${i ? 10 : 12}" stroke-linecap="round" fill="none"/>`).join('')}`;

const cup = (line: string, inside: string) => `
  <path d="${M.cup}" fill="${line}" stroke="${line}" stroke-width="24" stroke-linejoin="round"/>
  <g clip-path="url(#cup)">${inside}<path d="${M.shine}" fill="#fff" opacity=".45"/><circle cx="${M.shineDot.cx}" cy="${M.shineDot.cy}" r="${M.shineDot.r}" fill="#fff" opacity=".45"/></g>
  <rect x="${M.rim.x}" y="${M.rim.y}" width="${M.rim.w}" height="${M.rim.h}" rx="${M.rim.r}" fill="${B.cream}" stroke="${line}" stroke-width="12"/>`;

const layers = M.layers.map(l => `<path d="${l.d}" fill="${l.fill}"/>`).join('')
  + M.seams.map(s => `<path d="${s.d}" stroke="${s.stroke}" stroke-width="7" fill="none"/>`).join('');

const cherry = `
  <path d="${M.stem}" stroke="${B.ink}" stroke-width="16" stroke-linecap="round" fill="none"/>
  <path d="${M.stem}" stroke="${B.stem}" stroke-width="7" stroke-linecap="round" fill="none"/>
  <circle cx="${M.cherry.cx}" cy="${M.cherry.cy}" r="${M.cherry.r}" fill="${B.cherry}" stroke="${B.ink}" stroke-width="10"/>
  <circle cx="${M.cherryShine.cx}" cy="${M.cherryShine.cy}" r="${M.cherryShine.r}" fill="#FFC2CF"/>`;

/** the full drink, in mark space */
const drink = `${straw(B.ink)}${dome}${cup(B.ink, layers)}${cherry}`;

const svg = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs>${defs}</defs>${body}</svg>`;

/** the drink standing on the counter, with a flat shadow; `s` scales the whole icon scene about the centre */
const drinkOnCounter = `<ellipse cx="256" cy="436" rx="96" ry="12" fill="${B.woodLine}"/>
  <g transform="translate(256 272) scale(.76) translate(-256 -250)">${streaks}${drink}</g>`;
const zoom = (s: number, body: string) => `<g transform="translate(256 256) scale(${s}) translate(-256 -256)">${body}</g>`;
/** Android shows the inner 72 of 108 dp of each layer (2/3); zoom the scene out so the same picture fits that window */
const SAFE = 0.72;

const files: Record<string, { body: string; size: number }> = {
  // iOS / Play store icon: full bleed, the stores round the corners
  'icon.png': { body: scene + glints + drinkOnCounter, size: 1024 },
  // Android adaptive icon: background = the shack, foreground = the drink, both zoomed into the safe window
  'android-icon-background.png': { body: zoom(SAFE, scene + glints), size: 1024 },
  'android-icon-foreground.png': { body: zoom(SAFE, drinkOnCounter), size: 1024 },
  // themed (Material You) icon: alpha only, so a solid silhouette of the drink
  'android-icon-monochrome.png': {
    body: `<mask id="gap"><rect width="512" height="512" fill="#fff"/>
        <circle cx="${M.cherry.cx}" cy="${M.cherry.cy}" r="${M.cherry.r + 16}" fill="#000"/></mask>
      <g transform="translate(256 256) scale(.58) translate(-256 -247)" fill="#fff" stroke="#fff">
        <g mask="url(#gap)">
          <path d="${M.straw}" stroke-width="34" stroke-linecap="round"/>
          <path d="${M.dome}" stroke-width="20" stroke-linejoin="round"/>
          <path d="${M.cup}" stroke-width="24" stroke-linejoin="round"/>
        </g>
        <path d="${M.stem}" stroke-width="16" stroke-linecap="round" fill="none"/>
        <circle cx="${M.cherry.cx}" cy="${M.cherry.cy}" r="${M.cherry.r + 5}" stroke="none"/>
      </g>`,
    size: 432,
  },
  // the splash: the empty cup on the stage colour; the loading screen fills it in the same spot
  'splash-icon.png': {
    // the app icon itself as a rounded, ink-outlined tile with a flat shadow, centred on the sky-blue splash
    body: (() => {
      const t = 512 * SPLASH_TILE, o = (512 - t) / 2, k = SPLASH_TILE;
      return `<g transform="translate(${o} ${o}) scale(${k})">
        <rect x="0" y="22" width="512" height="512" rx="112" fill="#8FCFE6"/>
        <g clip-path="url(#round)">${scene}${glints}${drinkOnCounter}</g>
        <rect width="512" height="512" rx="112" fill="none" stroke="${B.ink}" stroke-width="16"/>
      </g>`;
    })(),
    size: 1024,
  },
  'favicon.png': { body: `<g clip-path="url(#round)">${scene}${drinkOnCounter}</g>`, size: 48 },
};

for (const [name, { body, size }] of Object.entries(files)) {
  const src = svg(body);
  await sharp(Buffer.from(src), { density: (72 * size) / 512 }).resize(size, size).png().toFile(new URL(name, OUT).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
  console.log('wrote', name, size);
}
