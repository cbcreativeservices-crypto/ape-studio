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
 *  line). Velocity ramp: red → orange → yellow → green → blue.
 *
 *  GREEN is deliberately WIDE (owner 2026-08-07): the "good/healthy" operating
 *  range should dominate the middle of the scale, so moderate levels read green
 *  instead of jumping straight to yellow. Yellow is trimmed to a thin
 *  "getting hot" band near the top; orange/red stay reserved for hot → clipping.
 *  Two green stops hold a solid green plateau across the whole moderate band. */
export const LOUDNESS_STOPS: ReadonlyArray<{ pos: number; color: string }> = [
  { pos: 0, color: '#ff5f4e' }, // full scale — red
  { pos: 0.14, color: '#e6902f' }, // orange — only the hot top
  { pos: 0.3, color: '#e8c341' }, // yellow — a thin "getting hot" band
  { pos: 0.48, color: '#3fae52' }, // green — the healthy range's upper edge
  { pos: 0.72, color: '#3fae52' }, // green — lower edge (blue holds below this)
  { pos: 1, color: MIDLINE_BLUE }, // silence / mid line — MIDI-0 blue (wider blue floor)
];

/**
 * EVENLY-SPACED stops for 2-D FIELDS and gradients (owner 2026-08-28).
 *
 * `LOUDNESS_STOPS` is tuned for METERS: it holds a deliberately WIDE green
 * plateau (two identical green stops) so the "healthy operating range"
 * dominates the middle of a meter — that ruling stands and meters keep it.
 *
 * But a spatial field inherited that same spacing, and the result was not a
 * gradient: red→green was crushed into the top third, then a QUARTER of the
 * ramp was flat green with no change at all, and blue only began past 0.72 —
 * so a distance field went red→green almost immediately and then sat green
 * across the whole screen. Owner: "This is not a gradient, it is skewed, it
 * must show a gradient that doesn't need interpretation."
 *
 * These stops are perfectly even, so equal steps in level are equal steps in
 * colour. Same hue ORDER and the same meaning (blue = quiet, red = loud) — only
 * the spacing differs, because a meter judges a level while a field maps one.
 */
export const FIELD_STOPS: ReadonlyArray<{ pos: number; color: string }> = [
  { pos: 0, color: '#ff5f4e' }, // full scale — red
  { pos: 0.25, color: '#e6902f' }, // orange
  { pos: 0.5, color: '#e8c341' }, // yellow
  { pos: 0.75, color: '#3fae52' }, // green
  { pos: 1, color: MIDLINE_BLUE }, // silence — MIDI-0 blue
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
  return sampleStops(LOUDNESS_STOPS, l);
}

/** Field/gradient colour for a loudness fraction — the EVEN ramp (FIELD_STOPS).
 *  Use for 2-D heat fields and gradients; `levelColor` stays for meters. */
export function fieldLevelColor(l: number): string {
  return sampleStops(FIELD_STOPS, l);
}

/** Shared stop interpolation: `l` 0=silence … 1=full scale. */
function sampleStops(s: ReadonlyArray<{ pos: number; color: string }>, l: number): string {
  const loud = Math.max(0, Math.min(1, l));
  const pos = 1 - loud; // ramps are indexed by pos (0 loud … 1 silence)
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
 * Colour a dB LEVEL readout on the amplitude ramp (owner 2026-08-12): at/below
 * `minDb` reads blue (quiet), at/above `maxDb` reads red (loud) — so a NUMERIC
 * level readout carries the same blue→red language as the meters and displays.
 * Default −60…0 dBFS window matches the meters' scale. Non-finite (silence / no
 * data) → MIDI-0 blue. Louder = redder, quieter = bluer.
 */
export function levelColorForDb(db: number | null | undefined, minDb = -60, maxDb = 0): string {
  if (db == null || !Number.isFinite(db)) return MIDLINE_BLUE;
  const frac = (db - minDb) / (maxDb - minDb);
  return levelColor(Math.max(0, Math.min(1, frac)));
}

/**
 * Colour an ACOUSTIC level readout (dBA / dBC SPL, not dBFS) on the amplitude
 * ramp. SPL lives on a completely different scale from the −60…0 dBFS window
 * `levelColorForDb` defaults to, so a dBA number passed to that would peg red
 * always. This window is anchored to HEARING SAFETY rather than to a converter:
 * 40 dBA (a quiet room) reads blue, and the ramp is set so the 85 dBA NIOSH
 * action level has already climbed into the hot orange/yellow band — the colour
 * warns before the number has to be read.
 */
export const SPL_DBA_MIN = 40;
export const SPL_DBA_MAX = 100;
export function splColorForDba(db: number | null | undefined): string {
  return levelColorForDb(db, SPL_DBA_MIN, SPL_DBA_MAX);
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
  // EVEN ramp (FIELD_STOPS), not the meter ramp: a heat field must read as a
  // gradient, with equal steps in level giving equal steps in colour.
  const [r, g, b] = hexToRgb(fieldLevelColor(t)); // blue(quiet) → red(loud)
  // BLUE FADES TO BLACK AT ZERO SIGNAL (owner 2026-08-28). This used to floor
  // the brightness at 0.22, so true silence still rendered as a lit deep-navy —
  // a 2-D field or spectrogram showed a wall of blue where there was NO signal.
  // Now the bottom 10% of the ramp fades all the way out: t=0 is black, and
  // blue re-emerges as soon as there is anything to show. Matches how a
  // professional spectrogram reads (black floor), and it means "dark = nothing
  // there" is honest rather than decorative.
  const k = Math.min(1, t / 0.1);
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

/**
 * Gradient colours for a level-encoding BAR (owner ruling 2026-08-16): a bar whose
 * SIZE encodes a level must show the RAMP climbing from silence (blue) up to the
 * level's colour — the peak colour belongs only at the TIP, not filling the whole
 * bar. Returns a colour list for `expo-linear-gradient`'s `colors` prop, ordered
 * base(blue) → tip(colour(level)). For a horizontal bar map base→tip left→right;
 * for a vertical bar, base→tip bottom→top.
 */
export function rampColors(level: number, steps = 6): [string, string, ...string[]] {
  const L = Math.max(0, Math.min(1, level));
  const c = Array.from({ length: steps }, (_, i) => levelColor((i / (steps - 1)) * L));
  return c as [string, string, ...string[]];
}

/** Symmetric ramp for a zero-centred (bipolar) bar: blue at the mid line, climbing
 *  to the peak colour at BOTH tips. Ordered tip → centre → tip. */
export function rampColorsSymmetric(level: number, half = 3): [string, string, ...string[]] {
  const up = rampColors(level, half); // blue … colour(level)
  return [...up.slice().reverse(), ...up.slice(1)] as [string, string, ...string[]];
}
