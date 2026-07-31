/**
 * Level / loudness colour standard (owner 2026-07-31).
 *
 * The SINGLE source of truth for how amplitude/level maps to colour anywhere a
 * student sees it — waveforms, level bars, per-sample bars, MIDI velocity, etc.
 * It is the exact ramp used by the SPL tool's VU LED level meter
 * (PeakAvgMeterView in src/screens/lab/meter/vizMeters.tsx): loud → quiet is
 *   red → orange → yellow → green → deep green.
 *
 * Keeping ONE ramp means "louder is redder" reads identically across every tool
 * and every lab, so the colour itself teaches level.
 */

/** Loud → quiet stops, matching the LED meter's vertical gradient exactly.
 *  `pos` 0 = loudest (top of a bar), 1 = quietest (bottom). */
export const LOUDNESS_STOPS: ReadonlyArray<{ pos: number; color: string }> = [
  { pos: 0, color: '#ff5f4e' }, // full scale — red
  { pos: 0.1, color: '#e6902f' }, // orange
  { pos: 0.3, color: '#e8c341' }, // yellow
  { pos: 0.55, color: '#4ea84e' }, // green
  { pos: 1, color: '#3f8f3f' }, // silence — deep green
];

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Colour for a loudness fraction `l` (0 = silence/quiet, 1 = full scale/loud),
 *  interpolated along the canonical ramp. */
export function levelColor(l: number): string {
  const loud = Math.max(0, Math.min(1, l));
  const pos = 1 - loud; // ramp is indexed by pos (0 loud … 1 quiet)
  const s = LOUDNESS_STOPS;
  for (let i = 1; i < s.length; i++) {
    if (pos <= s[i].pos) {
      const a = s[i - 1];
      const b = s[i];
      const t = (pos - a.pos) / (b.pos - a.pos || 1);
      const [ar, ag, ab] = hexToRgb(a.color);
      const [br, bg, bb] = hexToRgb(b.color);
      return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
    }
  }
  return s[s.length - 1].color;
}

/**
 * SVG gradient stops for a zero-centred waveform: symmetric about the middle so
 * amplitude MAGNITUDE drives the colour (loud excursions red at top AND bottom,
 * quiet centre deep green). `offset` runs 0 (top edge, +full scale) → 0.5
 * (centre, zero) → 1 (bottom edge, −full scale). Map the gradient axis to the
 * pixels of ±full scale (userSpaceOnUse) so the colour tracks true level
 * regardless of vertical zoom.
 */
export const WAVE_LEVEL_STOPS: ReadonlyArray<{ offset: number; color: string }> = (() => {
  // Sample the magnitude ramp at symmetric offsets. m = |1 − 2·offset|.
  const offsets = [0, 0.05, 0.15, 0.275, 0.5, 0.725, 0.85, 0.95, 1];
  return offsets.map((offset) => ({ offset, color: levelColor(Math.abs(1 - 2 * offset)) }));
})();
