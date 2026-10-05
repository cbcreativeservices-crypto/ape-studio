/**
 * THE BRASS FAMILY — trumpet, flugelhorn, tenor and bass trombone (charter
 * §2 layer 1). One parameter row each, in FRAME H, the horn's own frame
 * (docs/labs/miking/trumpet/GEOMETRY_PROPOSAL.md §1, the brass family's
 * frame Bb):
 *
 *   origin H0 = the centre of the bell RIM's plane; +x along the bell axis,
 *   OUT of the bell (the way it fires); +y down; +z to the player's right.
 *   Millimetres. A horn played with its bell dipped is turned about z into
 *   the lesson frame (brassPosture.ts), which stays level with the floor.
 *
 * Every number is a `Dim` with its provenance (the INTERNAL record — the
 * learner never sees a source): the bell diameters, bores and tube lengths
 * from the makers and the measurement paper (trumpet/, flugelhorn/,
 * trombone/, bass_trombone/ SOURCES.md); the slide positions DERIVED by
 * equal temperament on the sourced 2.7 m tube (trombone/SOURCES.md §c).
 * Everything the drawing needs that no source gives — overall lengths, the
 * flare's length, where the valves and the slide sit, the slide's tube
 * spacing — is a DRAWING DEFAULT (`placeholder: true`), listed in each
 * lesson's `unknowns`.
 *
 * Pure: no React, no Skia. The art, the solids and the tests read these.
 */
import type { Dim, Provenance } from '../../../engine/model/types.ts';

export type HornId = 'trumpet' | 'flugelhorn' | 'tenor' | 'bass';
export type HornKind = 'valved' | 'slide';

const S = (mm: number, src: string, quote: string): Dim => ({ mm, prov: { kind: 'sourced', src, quote } });
const T = (mm: number, src: string, note: string): Dim => ({ mm, prov: { kind: 'trial', src, note } });
/** A drawing default: no source gives it (the proposal's value where it has one). */
export const dd = (mm: number, needed: string): Dim => ({ mm, prov: { kind: 'unknown', needed }, placeholder: true });
const DER = (mm: number, how: string): Dim => ({ mm, prov: { kind: 'illustrative', reason: how } });

/** Equal temperament, A4 = 440 Hz (PHYS-ET). */
export const et = (semisFromA4: number) => 440 * Math.pow(2, semisFromA4 / 12);

export type BrassSpec = {
  id: HornId;
  kind: HornKind;
  name: string;
  /** The bell's rim diameter. */
  bell: Dim;
  /** The bore (the tube's inside diameter at the valves or the slide). */
  bore: Dim;
  /** The whole tube, unwound (open: no valve pressed, slide closed). */
  tube: Dim | null;
  /** Mouthpiece cup → bell rim, along the bell axis (valved horns). */
  overall: Dim;
  /** The bell's flare: rim back to where the tube starts to widen. */
  flare: Dim;
  /** The bell dipped below level in the usual hold (deg; flugelhorn). */
  dip: Dim;
  /** The lowest note this lesson draws, and the source's highest (Hz). */
  lowest: { hz: number; name: string; prov: Provenance };
  /** A pickup mute's reach beyond the rim, where a source gives one. */
  pickupMute?: Dim;
};

export type SlideSpec = {
  /** Mouthpiece → the slide's crook at 1st position (closed). */
  closed: Dim;
  /** The two slide tubes' spacing. */
  spacing: Dim;
  /** The slide's tube plane, below the bell axis. */
  below: Dim;
  /** The slide's tube plane, to the player's right of the bell axis. */
  right: Dim;
  /** The crook at 1st position sits this far IN FRONT of the bell rim. */
  ahead: Dim;
  /** Bell rim → the tuning-slide crook (the bell section). */
  bellSection: Dim;
};

const YTR = 'Y-YTR2330';
const YFH = 'Y-YFH631G';

export const TRUMPET: BrassSpec = {
  id: 'trumpet',
  kind: 'valved',
  name: 'trumpet',
  bell: S(123, YTR, '123mm (4-7/8")'),
  bore: S(11.65, YTR, 'ML 11.65mm (0.459")'),
  tube: S(1400, 'PL-2010', 'the total length is approximately 1.4 m'),
  overall: dd(480, 'the trumpet’s length, mouthpiece cup to bell rim (proposal drawing default)'),
  flare: dd(200, 'the trumpet bell’s flare length (proposal drawing default)'),
  dip: DER(0, 'the bell drawn level (proposal §4: horizontal; it may dip for soft playing)'),
  lowest: { hz: et(-17), name: 'E3', prov: { kind: 'sourced', src: 'DPA-TABLE', quote: 'E (165 Hz) / D³ (1175 Hz)' } },
};

export const FLUGELHORN: BrassSpec = {
  id: 'flugelhorn',
  kind: 'valved',
  name: 'flugelhorn',
  bell: S(151.8, YFH, '151.8mm (6")'),
  bore: S(11, YFH, 'M 11mm (0.433")'),
  tube: null,
  overall: T(340, 'MET-FH', 'Length: 34 cm (a 19th-century instrument, used as a drawing size)'),
  flare: dd(280, 'the flugelhorn’s flare: "longer than in a trumpet" (UNSW-BRASS) — 280 is a drawing default'),
  dip: dd(10, 'the flugelhorn’s bell dipped 10° in the usual hold (proposal: 10–20°, a drawing default)'),
  lowest: { hz: et(-17), name: 'E3', prov: { kind: 'illustrative', reason: 'drawn as the trumpet’s written range; no flugelhorn row in DPA-TABLE' } },
  pickupMute: S(35, 'Y-PM', '*Pickup Mute for flugelhorn protrudes 3-4 cm from the bell.'),
};

export const TENOR: BrassSpec = {
  id: 'tenor',
  kind: 'slide',
  name: 'tenor trombone',
  bell: S(204.4, 'Y-YSL354', '204.4mm（8\'\'）'),
  bore: dd(13.3, 'the tenor trombone’s bore (not read from a source: a drawing default)'),
  tube: S(2700, 'Y-HUB-TBN', 'the same size in terms of total length (both are 2.7 meters)'),
  overall: dd(1150, 'the trombone’s closed length, crook to tuning slide (drawing default)'),
  flare: dd(420, 'the trombone bell’s flare length (drawing default)'),
  dip: DER(0, 'the bell drawn level'),
  lowest: { hz: et(-41), name: 'E2', prov: { kind: 'sourced', src: 'DPA-TABLE', quote: 'Trombone | E (82.4 Hz) / C² (523 Hz)' } },
};

export const BASS_TB: BrassSpec = {
  id: 'bass',
  kind: 'slide',
  name: 'bass trombone',
  bell: S(241.3, 'Y-YBL830', '9 1/2" (conv. 241.3 mm)'),
  bore: S(14.3, 'Y-YBL830', 'Large: .563" (conv. 14.3 mm)'),
  tube: S(2700, 'Y-HUB-TBN', 'the same size in terms of total length (both are 2.7 meters)'),
  overall: dd(1150, 'the bass trombone’s closed length (drawing default, as the tenor)'),
  flare: dd(460, 'the bass trombone bell’s flare length (drawing default)'),
  dip: DER(0, 'the bell drawn level'),
  lowest: { hz: et(-41), name: 'E2', prov: { kind: 'illustrative', reason: 'the open slide’s 7th position, as the tenor; the valves go lower — the part decides (L11)' } },
};

export const BRASS: Record<HornId, BrassSpec> = { trumpet: TRUMPET, flugelhorn: FLUGELHORN, tenor: TENOR, bass: BASS_TB };

/** The trombone's slide (trombone/GEOMETRY_PROPOSAL.md §1–§2; all drawing defaults). */
export const SLIDE: SlideSpec = {
  closed: dd(700, 'the closed slide, mouthpiece to crook (proposal drawing default)'),
  spacing: dd(70, 'the slide’s tube spacing (proposal drawing default)'),
  below: dd(120, 'the slide below the bell axis in side view (proposal drawing default)'),
  right: dd(130, 'the slide to the player’s right of the bell axis (drawing default: just past the bell’s edge)'),
  ahead: dd(250, 'the crook at 1st position, ahead of the bell rim (proposal drawing default)'),
  bellSection: dd(650, 'the bell section, rim to tuning slide (proposal drawing default)'),
};

/**
 * The slide's travel to position n (1…7), DERIVED: each position lowers the
 * pitch one semitone and the slide adds tube on both legs, so
 * s_n = (L/2)·(2^((n−1)/12) − 1) on the sourced L = 2.7 m
 * (trombone/SOURCES.md §c: 0, 80.3, 165.3, 255.4, 350.9, 452.0, 559.2).
 * Approximate: real positions are found by ear and feel.
 */
export function slideTravel(n: number, L = 2700): number {
  return (L / 2) * (Math.pow(2, (n - 1) / 12) - 1);
}
export const SLIDE_POSITIONS: readonly number[] = [1, 2, 3, 4, 5, 6, 7].map((n) => slideTravel(n));
export const SLIDE_7TH = SLIDE_POSITIONS[6];

/** Tube a valve adds to lower the pitch k semitones (ideal, DERIVED). */
export function addedTube(L: number, semis: number): number {
  return L * (Math.pow(2, semis / 12) - 1);
}

/** A trumpet's three valves and what each lowers (semitones; standard). */
export const VALVES: readonly { id: string; label: string; semis: number }[] = [
  { id: 'open', label: 'OPEN', semis: 0 },
  { id: 'v2', label: 'VALVE 2', semis: 1 },
  { id: 'v1', label: 'VALVE 1', semis: 2 },
  { id: 'v12', label: 'VALVES 1+2', semis: 3 },
  { id: 'v23', label: 'VALVES 2+3', semis: 4 },
  { id: 'v13', label: 'VALVES 1+3', semis: 5 },
  { id: 'v123', label: 'ALL THREE', semis: 6 },
];

/** A bass trombone's valve attachments (Y-TBN-PLAY3, YBL-830 "Key of Bb/F/Gb/D"). */
export const ATTACH: readonly { id: string; label: string; semis: number; words: string }[] = [
  { id: 'open', label: 'OPEN (B♭)', semis: 0, words: 'No valve: the slide has its seven positions.' },
  { id: 'f', label: 'F VALVE', semis: 5, words: 'The F valve adds a loop of tube: the pitch falls a fourth, and the slide now has six positions over its whole length.' },
  { id: 'gb', label: 'G♭ VALVE', semis: 4, words: 'The second valve on this kind of horn adds a shorter loop: the pitch falls a major third.' },
  { id: 'd', label: 'BOTH (D)', semis: 8, words: 'Both valves together add both loops: the pitch falls a minor sixth, for the lowest notes.' },
];

/**
 * The bell's radius at x (frame H; −flare ≤ x ≤ 0): the tube's radius back
 * at the flare's start, widening ever faster to the rim (a drawing profile,
 * not a measured one — no source gives a bell's curve).
 */
export function bellRadius(s: BrassSpec, x: number): number {
  const R = s.bell.mm / 2;
  const rt = s.bore.mm / 2 + 1.2;
  const F = s.flare.mm;
  if (x <= -F) return rt;
  if (x >= 0) return R;
  const t = (x + F) / F; // 0 at the flare's start, 1 at the rim
  return rt + (R - rt) * Math.pow(t, 3.4);
}

/** The bell's outline as (x, r) pairs from the flare's start to the rim. */
export function bellProfile(s: BrassSpec, n = 40): [number, number][] {
  const F = s.flare.mm;
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    // More points near the rim, where the curve turns fastest.
    const u = 1 - Math.pow(1 - i / n, 1.8);
    const x = -F + F * u;
    out.push([x, bellRadius(s, x)]);
  }
  return out;
}
