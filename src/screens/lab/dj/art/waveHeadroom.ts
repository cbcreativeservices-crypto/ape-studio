/**
 * waveHeadroom — the waveform's headroom scaling (pure; tests reach it): the
 * gain that puts a track's 99th-percentile |peak| at 80 % of a lane's
 * half-height. The colour still reads the true level (waves.ts).
 */
/**
 * Kick onsets from the low band's envelope (columns): a column where the low
 * band jumps well above where it was a moment before and is the local peak —
 * the attack of a kick, read from the real audio. Pure.
 */
export function lowOnsets(low: ArrayLike<number>): number[] {
  const out: number[] = [];
  let max = 0;
  for (let i = 0; i < low.length; i++) if (low[i] > max) max = low[i];
  const floor = max * 0.35;
  for (let c = 2; c < low.length - 2; c++) {
    const v = low[c];
    if (v < floor) continue;
    const before = Math.min(low[c - 1], low[c - 2]);
    if (v < before * 1.3 + max * 0.05) continue;
    if (v < low[c + 1] || v < low[c + 2]) continue;
    if (out.length && c - out[out.length - 1] < 5) continue;
    out.push(c);
  }
  return out;
}

export function headroomGain(hi: ArrayLike<number>, lo: ArrayLike<number>): number {
  const n = hi.length;
  if (!n) return 1;
  const a: number[] = new Array(n);
  for (let i = 0; i < n; i++) a[i] = Math.max(Math.abs(hi[i]), Math.abs(lo[i]));
  a.sort((x, y) => x - y);
  const p99 = a[Math.min(n - 1, Math.floor(n * 0.99))];
  return p99 > 1e-3 ? Math.min(6, 0.8 / p99) : 1;
}
