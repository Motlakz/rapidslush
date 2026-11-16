/// <reference types="bun" />
// Which screen shapes Rapid Slush can actually play on, checked against the stage fit rule rather than assumed.
// Sizes are points/dp. iPhone Duo pixel sizes are Apple's App Store screenshot specs (inner 2853×2007 px, outer
// 2034×1398 px, developer.apple.com/help/app-store-connect/reference/screenshot-specifications/). Apple hasn't published
// the scale factor, so @3x is assumed (the smaller, stricter point size); replace once the point sizes are documented.
import { describe, expect, test } from 'bun:test';

import { MIN_PLAYABLE_SCALE, WORLD_H, layoutStage as fitStage } from '../layout';

const none = { top: 0, right: 0, bottom: 0, left: 0 };
const notchLandscape = { top: 0, right: 59, bottom: 21, left: 59 };

type Case = [name: string, w: number, h: number, ins: typeof none, playable: boolean];
const DEVICES: Case[] = [
  ['iPhone 16, landscape (notch insets)', 852, 393, notchLandscape, true],
  ['iPhone 16 Pro Max, landscape (notch insets)', 956, 440, { top: 0, right: 62, bottom: 21, left: 62 }, true],
  ['iPhone SE, landscape', 667, 375, none, true],
  ['iPhone 16, portrait', 393, 852, { top: 59, right: 0, bottom: 34, left: 0 }, false],
  ['Pixel 8, landscape', 915, 412, none, true],
  ['Pixel 8, portrait', 412, 915, none, false],
  ['iPad mini, portrait', 744, 1133, none, true],
  ['iPad Pro 13, portrait', 1032, 1376, none, true],
  ['iPad 11, landscape', 1194, 834, none, true],
  ['iPad Split View 2/3', 790, 834, none, true],
  ['iPad Split View 1/2', 590, 834, none, false],
  ['iPad Slide Over / Split 1/3', 320, 834, none, false],
  ['Galaxy Tab S9, landscape', 1280, 800, none, true],
  ['Galaxy Tab S9, portrait', 800, 1280, none, true],
  ['iPhone Duo inner, landscape', 951, 669, none, true],
  ['iPhone Duo inner, portrait', 669, 951, none, true],
  ['iPhone Duo outer, landscape', 678, 466, none, true],
  ['iPhone Duo outer, portrait', 466, 678, none, false],
  ['Android / Google TV (960×540 dp)', 960, 540, none, true],
  ['Laptop browser 1366×768', 1366, 768, none, true],
];

describe('stage fit', () => {
  for (const [name, w, h, ins, playable] of DEVICES) {
    test(`${name}: ${playable ? 'playable' : 'shows the notice'}`, () => {
      const f = fitStage(w, h, ins);
      expect(f.playable).toBe(playable);
      if (!playable) return;
      // the stage takes the screen's shape, notch strips included: no letterbox bars (Apple's iPhone Duo HIG for games)
      expect(f.fill).toBeGreaterThan(0.99);
      // world inside the stage
      expect(f.ox).toBeGreaterThanOrEqual(0);
      expect(f.oy + WORLD_H).toBeLessThanOrEqual(f.SH + 0.01);
      // interactive content inside the safe area: HUD row below the status bar, buttons above the home indicator,
      // HUD panels (40 units in from the safe edge in the original design) clear of the notch
      expect(f.hudY).toBeGreaterThanOrEqual(f.safe.top - 0.01);
      expect(f.ctrlY + 618 + 82).toBeLessThanOrEqual(f.SH - f.safe.bottom + 0.01);
      expect(f.SW - f.safe.left - f.safe.right).toBeGreaterThanOrEqual(1180); // room for the HUD's three groups
    });
  }

  test('the threshold sits where the smallest text and buttons stay usable', () => {
    expect(12 * MIN_PLAYABLE_SCALE).toBeGreaterThanOrEqual(6);   // smallest stage text, in pt
    expect(82 * MIN_PLAYABLE_SCALE).toBeGreaterThanOrEqual(40);  // tap button height, in pt (≈44pt guideline)
  });

  test('unfolding mid-round re-shapes the stage around the same world, bigger', () => {
    const closed = fitStage(678, 466), open = fitStage(951, 669); // iPhone Duo outer → inner
    expect(open.scale).toBeGreaterThan(closed.scale);
    expect(open.fill).toBeGreaterThan(0.99);
    expect(closed.fill).toBeGreaterThan(0.99);
  });

  test('HUD and controls drift toward the screen edges on tall stages, but stay near the action', () => {
    const tall = fitStage(669, 951); // iPhone Duo inner, portrait
    expect(tall.hudY).toBeGreaterThan(0);                      // HUD moved up with the stage...
    expect(tall.oy - tall.hudY).toBeLessThanOrEqual(120);      // ...but no more than 120 units above the world
    expect(tall.ctrlY - tall.oy).toBeLessThanOrEqual(160);     // controls likewise below it
  });
});
