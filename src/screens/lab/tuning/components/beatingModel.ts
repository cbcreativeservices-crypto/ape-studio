/**
 * The Tuning Lab's "Beating Model" traces (ch4), pure so a node test can run
 * them (owner 2026-11-25, audit B4).
 *
 * The drawing used to fit exactly 1.5 beats on screen for any gap of 1 Hz or
 * more (window = 1.5 / d s), so 2 Hz and 16 Hz, Equal and Pythagorean, drew
 * byte-identical pictures. Now the window is ONE fixed span of time,
 * BEAT_WINDOW_S, so the number of swells on screen is the beat rate × that
 * span: a third twice as far from 5/4 (twice the Hz gap) shows twice as many
 * swells. The two partials themselves are drawn slowed (at least 12 cycles
 * across the box, always at least 3 per swell so the envelope stays an
 * envelope); the ENVELOPE is drawn at the true beat rate |cos(π·d·t)|.
 */
export const BEAT_WINDOW_S = 0.5;

export type BeatTraces = { p1: string; p2: string; env: string; beatsShown: number };

export function beatingTraces(diffHz: number, W: number, H: number): BeatTraces {
  const d = Math.abs(diffHz);
  const windowS = BEAT_WINDOW_S;
  const beatsShown = d * windowS;
  // Drawn (slowed) partial cycles across the box: ≥ 12, and ≥ 3 per swell.
  const cycles = Math.max(12, Math.ceil(3 * beatsShown));
  // ≥ 10 points per drawn cycle, never fewer than the old 170.
  const n = Math.max(170, cycles * 10);
  const pts1: string[] = [];
  const pts2: string[] = [];
  const env: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * windowS;
    const xx = 6 + (i / n) * (W - 12);
    const p1 = Math.sin((2 * Math.PI * cycles * t) / windowS);
    const p2 = Math.sin(2 * Math.PI * ((cycles * t) / windowS + d * t));
    pts1.push(`${xx.toFixed(1)},${(H / 2 - p1 * 14).toFixed(1)}`);
    pts2.push(`${xx.toFixed(1)},${(H / 2 - p2 * 14).toFixed(1)}`);
    const e = Math.abs(Math.cos(Math.PI * d * t));
    env.push(`${xx.toFixed(1)},${(H / 2 - e * 34).toFixed(1)}`);
  }
  return { p1: pts1.join(' '), p2: pts2.join(' '), env: env.join(' '), beatsShown };
}
