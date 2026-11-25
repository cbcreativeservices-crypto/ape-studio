/**
 * ▶ SWEEP THE SHAPE's timing (pure, node-tested).
 *
 * A short envelope is swept slowed for visibility (×4, at least 1.6 s, the
 * slow-down capped at a 4 s sweep). A long one is swept in REAL TIME, never
 * faster (owner 2026-11-25, fix-first round 2): the old 4 s cap swept a
 * 6000 ms shape 1.5× and a 10 319 ms shape 2.6× too fast while the note said
 * "about real time". The note is computed from the same two numbers, so it
 * can only say what the playhead does.
 */
export function envelopeSweep(totalMs: number): { sweepMs: number; label: string } {
  const total = Math.max(1, totalMs);
  const sweepMs = Math.round(Math.max(1600, total, Math.min(4000, total * 4)));
  const slow = sweepMs / total;
  const label = slow >= 1.5 ? `×${slow < 10 ? slow.toFixed(1) : slow.toFixed(0)} slower than real time` : 'about real time';
  return { sweepMs, label };
}
