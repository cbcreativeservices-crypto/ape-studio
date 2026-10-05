/**
 * HOW IT SOUNDS for the brass family — the radiation picture's numbers
 * (pure; the drawing is BrassSoundArt.BellRadiation). ILLUSTRATIVE shapes of
 * the measured trend (trumpet/SOURCES.md §0.2, trombone/SOURCES.md §b):
 * near-even all round low down (a trombone stays within −6 dB everywhere up
 * to 400 Hz), the front winning from about 500 Hz, a beam along the axis
 * from about 1 kHz up — narrower for a larger bell (the bass trombone
 * "scaled to lower frequencies due to the larger bell"). No dB scale is
 * drawn or claimed: the words name only "stronger / weaker".
 */
export type Band = 'low' | 'mid' | 'high';

/** Relative strength (0–1) at `deg` off the bell's axis, for a bell of `d` mm, in a band. */
export function lobe(band: Band, deg: number, d: number): number {
  const c = Math.cos((deg * Math.PI) / 180);
  const k = Math.sqrt(d / 123);
  if (band === 'low') return 0.84 + 0.16 * c;
  if (band === 'mid') return Math.max(0.2, Math.pow((1 + c) / 2, 0.9 * k));
  return Math.max(0.05, Math.pow((1 + c) / 2, 4.2 * k));
}

export function lobeWords(r: number): string {
  return r >= 0.8 ? 'ABOUT AS STRONG' : r >= 0.5 ? 'A LITTLE WEAKER' : r >= 0.2 ? 'CLEARLY WEAKER' : 'MUCH WEAKER';
}
