// Colour helpers for blended drinks (Blend Station): the jar, its stream and the cups it fills.
import { FLAVOURS as FL, type Round } from '@/engine';

/** Average of flavour colours, for a blend in the jar or the cup. */
export function mixFlavours(fis: number[]): { color: string; deep: string; light: string } {
  if (!fis.length) return FL[0];
  const avg = (k: 'color' | 'deep' | 'light') => {
    const rgb = [0, 0, 0];
    for (const fi of fis) {
      const h = FL[fi][k];
      for (let j = 0; j < 3; j++) rgb[j] += parseInt(h.slice(1 + j * 2, 3 + j * 2), 16) / fis.length;
    }
    return '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  };
  return { color: avg('color'), deep: avg('deep'), light: avg('light') };
}

/** The flavours in a blend cup (by what was poured), as flavour indexes. */
export const cupFlavours = (r: Round, vol: number[]) => vol.flatMap((v, i) => (v > 0.5 && i < r.L.taps ? [r.L.flavours[i]] : []));
