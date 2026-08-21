/**
 * LED-meter colour customization (Academy MEMBER feature, owner 2026-08-20 rule
 * — see [[customization-member-rule]]). The tools' LED (the SPL screen's Skia
 * PeakAvgMeterView peak fill) normally uses the app-wide loudness ramp
 * (LOUDNESS_STOPS). Members may override it with EITHER a preset colour SCHEME
 * (a designed multi-stop gradient) OR a single FLAT colour. Owner chose BOTH.
 *
 * Persisted as ONE string at `ape:tools:ledScheme` via useToolColorPref:
 *   null            → default (the loudness ramp)
 *   a scheme id     → that scheme's gradient  (e.g. 'vu', 'amber')
 *   a '#rrggbb' hex → a flat single-colour fill
 *
 * Stops are oriented the SAME as LOUDNESS_STOPS for the vertical LED bar:
 * pos 0 = TOP of the bar (loudest) … pos 1 = BOTTOM (quietest / silence).
 * This is the owner-authorized member exception to the amplitude-ramp
 * governance in [[integrity-and-governance]]; it applies to the TOOLS' LED
 * only, never the Dashboard/enrollment progress-bar LEDs.
 */
import { LOUDNESS_STOPS } from './levelColor';
import { useToolColorPref } from './waveColorPref';

export type LedStop = { pos: number; color: string };
export type LedScheme = { id: string; label: string; stops: readonly LedStop[] };

/** Preset LED colour schemes I seeded (owner refines later with example images).
 *  'classic' is the default loudness ramp and is represented by `null`, so it is
 *  NOT listed here — these are the member-selectable ALTERNATIVES. */
export const LED_SCHEMES: readonly LedScheme[] = [
  {
    // Traditional console/VU meter: a long green body, a yellow shoulder, and a
    // red top — the meter face most engineers already read at a glance.
    id: 'vu',
    label: 'VU',
    stops: [
      { pos: 0, color: '#ff3b30' }, // top — red
      { pos: 0.12, color: '#ff3b30' },
      { pos: 0.2, color: '#ffcc00' }, // amber shoulder
      { pos: 0.34, color: '#ffcc00' },
      { pos: 0.46, color: '#33d17a' }, // green body
      { pos: 1, color: '#33d17a' },
    ],
  },
  {
    // Vintage warm monochrome — bright gold at the top falling to deep amber.
    id: 'amber',
    label: 'Amber',
    stops: [
      { pos: 0, color: '#ffe7a1' },
      { pos: 0.5, color: '#ffb020' },
      { pos: 1, color: '#7a4a10' },
    ],
  },
  {
    // Cool studio monochrome — bright cyan at the top down to a deep studio blue.
    id: 'blue',
    label: 'Blue',
    stops: [
      { pos: 0, color: '#9fe8ff' },
      { pos: 0.5, color: '#3b9dff' },
      { pos: 1, color: '#123a7a' },
    ],
  },
  {
    // Minimalist white — bright white at the top fading to a dim grey floor.
    id: 'mono',
    label: 'Mono',
    stops: [
      { pos: 0, color: '#ffffff' },
      { pos: 0.5, color: '#c8ccd4' },
      { pos: 1, color: '#5a5e68' },
    ],
  },
];

/** The resolved LED fill: EITHER a flat single colour OR a stop list to gradient. */
export type LedFill = { flat: string } | { stops: readonly LedStop[] };

const isHex = (s: string) => /^#[0-9a-fA-F]{3,8}$/.test(s);

/** Decode the stored pref (null | scheme id | '#hex') into a paint instruction.
 *  Unknown/legacy values fall back to the default loudness ramp. */
export function resolveLedFill(pref: string | null | undefined): LedFill {
  if (pref) {
    if (isHex(pref)) return { flat: pref };
    const scheme = LED_SCHEMES.find((s) => s.id === pref);
    if (scheme) return { stops: scheme.stops };
  }
  return { stops: LOUDNESS_STOPS };
}

/** Member LED colour/scheme pref: [pref, setPref]; null = the default ramp. */
export function useLedColorPref(): [string | null, (c: string | null) => void] {
  return useToolColorPref('ape:tools:ledScheme');
}
