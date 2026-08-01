/**
 * Amplitude colour standard (owner 2026-07-31).
 *
 * The SINGLE source of truth for how amplitude maps to colour anywhere a student
 * sees amplitude DRAWN (not a text readout) — waveforms (smooth curves OR
 * per-sample bar excursions), level meters, standing displays, etc.
 *
 * The ramp is the MIDI NOTE-VELOCITY scheme: silence is velocity 0 = BLUE at the
 * zero/mid line, and as amplitude grows away from the mid line the colour climbs
 * blue → green → yellow → orange → red (louder = redder). Keeping ONE ramp means
 * amplitude reads identically across every tool and every lab, so the colour
 * itself teaches level. The mid line (0 amplitude) is ALWAYS drawn MIDI-0 blue
 * (`MIDLINE_BLUE`).
 */

/** MIDI-0 (silence) blue — the colour of every amplitude mid/zero line and the
 *  centre of every waveform. */
export const MIDLINE_BLUE = '#2f74ff';

/** Loud → quiet stops. `pos` 0 = loudest (full scale), 1 = silence (the mid
 *  line). Velocity ramp: red → orange → yellow → green → blue. */
export const LOUDNESS_STOPS: ReadonlyArray<{ pos: number; color: string }> = [
  { pos: 0, color: '#ff5f4e' }, // full scale — red
  { pos: 0.26, color: '#e6902f' }, // orange
  { pos: 0.48, color: '#e8c341' }, // yellow
  { pos: 0.72, color: '#3fae52' }, // green
  { pos: 1, color: MIDLINE_BLUE }, // silence / mid line — MIDI-0 blue
];

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Colour for a loudness fraction `l` (0 = silence/mid line, 1 = full scale/loud),
 *  interpolated along the canonical velocity ramp. `levelColor(0)` is
 *  `MIDLINE_BLUE`. */
export function levelColor(l: number): string {
  const loud = Math.max(0, Math.min(1, l));
  const pos = 1 - loud; // ramp is indexed by pos (0 loud … 1 silence)
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
 * Heat-map / spectrogram colour for a LEVEL fraction `t01` (0 = silence,
 * 1 = loudest). The single app-wide amplitude ramp — MIDI-0 blue (quiet) →
 * green → yellow → orange → red (loud) — with the very bottom darkened toward
 * deep navy so silence reads as background on a 2-D field, not a wall of blue.
 * ONE ramp means every heat map, spectrogram, meter and waveform speaks the
 * same colours, so "red = loud, blue = quiet" transfers between labs (owner
 * 2026-08-02: unify ALL app heat maps on this).
 */
export function heatColor(t01: number): string {
  const t = Math.max(0, Math.min(1, t01));
  const [r, g, b] = hexToRgb(levelColor(t)); // blue(quiet) → red(loud)
  const k = 0.22 + 0.78 * Math.min(1, t / 0.1); // deep-navy floor at silence → full ramp
  return rgbToHex(r * k, g * k, b * k);
}

/**
 * SVG gradient stops for a zero-centred waveform: symmetric about the middle so
 * amplitude MAGNITUDE drives the colour — MIDI-0 blue at the centre (zero line),
 * climbing through green/yellow/orange to red at ±full scale (top AND bottom).
 * `offset` runs 0 (top edge, +full scale) → 0.5 (centre, zero) → 1 (bottom edge,
 * −full scale). Map the gradient axis to the pixels of ±full scale
 * (userSpaceOnUse) so the colour tracks true level regardless of vertical zoom.
 */
export const WAVE_LEVEL_STOPS: ReadonlyArray<{ offset: number; color: string }> = (() => {
  // Sample the magnitude ramp at symmetric offsets. m = |1 − 2·offset|.
  const offsets = [0, 0.06, 0.16, 0.28, 0.4, 0.5, 0.6, 0.72, 0.84, 0.94, 1];
  return offsets.map((offset) => ({ offset, color: levelColor(Math.abs(1 - 2 * offset)) }));
})();
