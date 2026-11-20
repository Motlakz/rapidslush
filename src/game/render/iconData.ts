// Flavour icon set: one drawn fruit per flavour on a 24×24 grid, flat two-tone with a bold ink outline (the same
// sticker language as the app icon, see ui/brand.ts). Plain SVG path strings with no Skia import, so the game draws
// them through Skia (./icons) and the loading screen draws the same data with react-native-svg.
//
// Parts: body (flavour colour, ink outline), leaf (green, ink outline), stems (ink strokes), detail (strokes in the
// flavour's light tint over the body: seeds, segments, shine).

export interface IconSpec { body: string; leaf?: string; stems?: string; detail?: string }

/** an SVG circle as a path */
const o = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;

export const FLAVOUR_ICONS: Record<string, IconSpec> = {
  // strawberry: heart-shaped berry, star calyx, seeds
  berry: {
    body: 'M12 21.6C8 20.6 4.6 15.6 4.8 11.6C5 8.8 7.4 7.4 9.6 8C10.6 8.2 11.4 8.6 12 8.6C12.6 8.6 13.4 8.2 14.4 8C16.6 7.4 19 8.8 19.2 11.6C19.4 15.6 16 20.6 12 21.6Z',
    leaf: 'M12 9.4L9.4 10.2L10 8.2L7 7.4L9.8 6.4L9 4.4L12 5.8L15 4.4L14.2 6.4L17 7.4L14 8.2L14.6 10.2Z',
    stems: 'M12 5.8V2.6',
    detail: [[8.6, 12.4], [12, 12.6], [15.4, 12.4], [10.2, 15.6], [13.8, 15.6], [12, 18.4]].map(([x, y]) => o(x, y, 0.5)).join(''),
  },
  // raspberry for Blue Razz: a cluster of drupelets (each one outlined), leafy cap
  razz: {
    body: o(9, 11.2, 2.7) + o(12, 10.6, 2.7) + o(15, 11.2, 2.7) + o(8.6, 14.8, 2.7) + o(12, 14.4, 2.7) + o(15.4, 14.8, 2.7) + o(10.2, 18.2, 2.6) + o(13.8, 18.2, 2.6),
    leaf: 'M12 8.6C10.4 9 8.4 8.6 7.2 7.2C8.8 6.2 10.6 6.4 12 7.4C13.4 6.4 15.2 6.2 16.8 7.2C15.6 8.6 13.6 9 12 8.6Z',
    stems: 'M12 7.4V3.4',
    detail: 'M7.6 10.6a1.4 1.4 0 0 1 1-1M11 13.6a1.4 1.4 0 0 1 1-1M7.2 14.2a1.4 1.4 0 0 1 1-1',
  },
  // lime wheel with a leaf
  lime: {
    body: o(11.4, 12.6, 8.8),
    leaf: 'M16.6 5.2C17.4 2.8 20 1.6 22.4 2.2C22 4.6 19.4 6 16.6 5.2Z',
    detail: o(11.4, 12.6, 6.4) + 'M11.4 6.2V19M5.9 9.4L16.9 15.8M5.9 15.8L16.9 9.4',
  },
  // mango: plump kidney shape, curled stalk, long leaf
  mango: {
    body: 'M7.4 9.2C9.2 5.6 14.4 4.8 17.4 7.8C20.6 11 20 17 16 19.8C12.6 22.2 7.4 21.4 5.4 17.8C3.8 14.8 5.6 12.6 7.4 9.2Z',
    stems: 'M12.6 6C12.8 4.6 13.4 3.6 14.4 2.8',
    leaf: 'M13 4.8C11.2 2.8 8.2 2.4 5.8 3.6C7.6 5.8 10.6 6.2 13 4.8Z',
    detail: 'M8.4 14C8.6 12 9.8 10.4 11.4 9.8',
  },
  // grape bunch: six grapes, stalk, leaf to the left
  grape: {
    body: o(8, 9.6, 2.9) + o(12, 9.2, 2.9) + o(16, 9.6, 2.9) + o(10, 14, 2.9) + o(14, 14, 2.9) + o(12, 18.6, 2.8),
    stems: 'M12 6.4V2.6',
    leaf: 'M12 4.4C10.6 2.2 7.6 1.8 5.4 3.2C7.2 5.2 10 5.6 12 4.4Z',
    detail: 'M6.6 8.8a1.6 1.6 0 0 1 1.2-0.9M10.6 8.4a1.6 1.6 0 0 1 1.2-0.9M8.6 13.2a1.6 1.6 0 0 1 1.2-0.9',
  },
  // cola: a glass bottle with a cap and a label band
  cola: {
    body: 'M10 3H14V6.4C14 8 16.4 9 16.4 11.8V19.6C16.4 20.8 15.6 21.6 14.4 21.6H9.6C8.4 21.6 7.6 20.8 7.6 19.6V11.8C7.6 9 10 8 10 6.4Z',
    stems: 'M9.6 4.6H14.4',
    detail: 'M7.6 13.4H16.4M7.6 17.4H16.4M9.8 10.4v1.4',
  },
};

export const LEAF = '#6CBF4E';
