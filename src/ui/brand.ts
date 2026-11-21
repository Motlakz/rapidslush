// The Rapid Slush mark: a layered slush cup with a straw, a slush dome and a cherry, in front of the beach shack. One
// geometry (512-unit space, from the website's favicon) drives the launcher icons and splash (scripts/gen-icons.ts)
// and the loading screen (ui/Loading.tsx), so the launcher, the splash and the first frame of the game all match.

export const MARK = {
  /** cup body, tapered like the game's plastic cup */
  cup: 'M159 186 L190 444 Q192 460 208 460 L304 460 Q320 460 322 444 L353 186 Z',
  /** the inside of the cup: where the slush fills, bottom (460) to rim (186) */
  fillTop: 186,
  fillBottom: 460,
  /** flavour layers, top to bottom; each runs to the bottom of the cup */
  layers: [
    { d: 'M140 180 H380 V470 H140 Z', fill: '#FF6B8A' },
    { d: 'M140 278 C190 258 222 296 256 280 C292 262 324 298 380 276 V470 H140 Z', fill: '#A78BFA' },
    { d: 'M140 366 C186 348 224 384 260 368 C296 352 330 384 380 364 V470 H140 Z', fill: '#45C6F2' },
  ],
  seams: [
    { d: 'M140 278 C190 258 222 296 256 280 C292 262 324 298 380 276', stroke: '#DED4FE' },
    { d: 'M140 366 C186 348 224 384 260 368 C296 352 330 384 380 364', stroke: '#C4EDFC' },
  ],
  straw: 'M262 150 L338 34',
  strawStripes: 'M276 128 L300 92 M312 73 L330 46',
  /**
   * The loading screen's fuller straw: longer and half again as wide (ink 50, body 34), with four candy bands.
   * It sits on the hero-sized cup; the launcher icon keeps the slimmer straw above. The cup crossfades in over the
   * icon tile, so the two never have to line up.
   */
  strawFull: 'M252 170 L340 24',
  strawFullStripes: 'M257.5 160.9 L268.5 142.6 M279.5 124.4 L290.5 106.1 M301.5 87.9 L312.5 69.6 M323.5 51.4 L334.5 33.1',
  dome: 'M146 196 C140 136 196 104 236 118 C256 92 306 96 322 128 C362 128 380 170 366 196 Z',
  domeInner: 'M152 196 C152 162 186 146 214 152 C232 132 276 136 290 158 C320 152 352 170 360 196 Z',
  domeShine: ['M188 140 C202 124 222 122 236 130', 'M296 136 C312 136 328 144 334 156'],
  stem: 'M296 92 C292 74 280 60 262 54',
  /** flat glass highlight: a slanted strip and a dot inside the left wall (no gradients anywhere in the mark) */
  shine: 'M180 212 L198 212 L220 404 L204 404 Z',
  shineDot: { cx: 214, cy: 426, r: 8 },
  cherry: { cx: 296, cy: 114, r: 26 },
  cherryShine: { cx: 287, cy: 105, r: 7 },
  rim: { x: 142, y: 172, w: 228, h: 30, r: 15 },
  streaks: ['M54 250 H120', 'M78 310 H138', 'M40 370 H128'],
  /** visual centre of cup + straw + cherry, for centring the mark on its own */
  center: { x: 256, y: 247 },
} as const;

export const BRAND = {
  ink: '#17152A', // outlines on the sky; also the splash / stage background
  cream: '#FFF9F1',
  berry: '#FF6B8A',
  cherry: '#D93D63',
  stem: '#6E9F2B',
  mango: '#FFC857',
  /** the shack scene behind the icon, all flat fills: sky, sun + halo, awning stripes, wooden counter */
  sky: '#BDEBFA',
  halo: '#E2F7FD',
  sun: '#FFD66E',
  cloud: '#FFFFFF',
  awning: '#FF6B8A',
  wood: '#F2A65A',
  woodLip: '#FFC27A',
  woodLine: '#D9893F',
  /** the empty glass on the sky-blue splash/loader, and its ink outline */
  glass: '#EAF8FD',
  glassLine: '#17152A',
} as const;

/**
 * The splash and loading screen draw the mark on a square of this many dp, cup centred, scaled so the whole mark
 * sits inside the inner circle Android 12+ crops splash icons to.
 */
export const SPLASH_DP = 240;
/** the splash shows the app icon as a rounded tile this share of the square wide: inside Android 12+'s circle crop */
export const SPLASH_TILE = 0.52;
export const SPLASH_MARK_SCALE = 0.62;
export const splashTransform = `translate(256 256) scale(${SPLASH_MARK_SCALE}) translate(${-MARK.center.x} ${-MARK.center.y})`;
