/**
 * THE SPATIAL KIT — Lab 6 group 6 (F10 Spatial and Specialist Field Pickup;
 * the channel-map drill is shared with Lab 7's broadcast lessons). Pure: no
 * React, so the tests reach it (test/mikingLab6Spatial.test.ts).
 *
 * Research: docs/labs/miking/spatial_field/SOURCES.md and GEOMETRY_PROPOSAL.md
 * (the A-format drill, the destination check, Double M/S). Internal record
 * only — learner text names no product or source (owner ruling 2026-10-04).
 *
 *   A-FORMAT      four capsule tracks of a first-order Ambisonic mic, in the
 *                 order its manual prints (this lab's example order FLU, FRD,
 *                 BLD, BRU — a generic convention; a real mic's manual rules).
 *                 AMBEO-REC: "recorded separately on four tracks using
 *                 identical microphone preamplifiers"; "Set the same gain for
 *                 each of the four channels".
 *   A → B         the textbook first-order sums (W, X, Y, Z) — a SIMPLIFIED
 *                 PICTURE: a real converter also corrects each capsule's
 *                 response and spacing, which is why the mic's own converter
 *                 is used. Capsules are drawn as cardioids (a simplification).
 *   CONVENTIONS   FuMa: W, X, Y, Z, with W 3 dB down; ambiX: W, Y, Z, X
 *                 (ACN order, SN3D) — SOURCES #8 (CONFIRMED as standard).
 *   THE DRILL     a track in the wrong slot, a gain not matched or not
 *                 linked, a full-range channel sent to the LFE bus, an output
 *                 convention not chosen: each is caught, and the decoded
 *                 direction SHOWS what it does to a source.
 *   DOUBLE M/S    L = Mf + S, R = Mf − S, Ls = Mb + S, Rs = Mb − S with the
 *                 figure-8's positive side to the LEFT (UA-MS for the M/S
 *                 matrix; the rear pair is the same matrix on the rear Mid).
 *   DESTINATIONS  headphones, a five-speaker layout, stereo, mono — what each
 *                 capture gives and loses (words; no level is claimed).
 *
 * Ambisonic axes (this file only): x FORWARD, y LEFT, z UP (the convention
 * the B-format channels are named in).
 */

const DEG = Math.PI / 180;
export type V3 = { x: number; y: number; z: number };
const v = (x: number, y: number, z: number): V3 => ({ x, y, z });
const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const unit = (a: V3): V3 => {
  const l = Math.sqrt(dot(a, a)) || 1;
  return v(a.x / l, a.y / l, a.z / l);
};

/* ── A-FORMAT ── */

export type ATrack = 'FLU' | 'FRD' | 'BLD' | 'BRU';
/** The lab's example capsule order (track 1 … 4). A real mic's manual rules. */
export const A_ORDER: readonly ATrack[] = ['FLU', 'FRD', 'BLD', 'BRU'];
export const A_WORDS: Readonly<Record<ATrack, string>> = {
  FLU: 'front-left-up',
  FRD: 'front-right-down',
  BLD: 'back-left-down',
  BRU: 'back-right-up',
};
/** Each capsule's outward direction (x forward, y left, z up). */
export const TETRA: Readonly<Record<ATrack, V3>> = {
  FLU: unit(v(1, 1, 1)),
  FRD: unit(v(1, -1, -1)),
  BLD: unit(v(-1, 1, -1)),
  BRU: unit(v(-1, -1, 1)),
};

/** A source direction from an azimuth (deg, + to the LEFT, 0 = front) and an
 *  elevation (deg, + up). */
export function dirFrom(azDeg: number, elDeg = 0): V3 {
  const a = azDeg * DEG;
  const e = elDeg * DEG;
  return v(Math.cos(a) * Math.cos(e), Math.sin(a) * Math.cos(e), Math.sin(e));
}

/** What each capsule hears from a source in direction s (a cardioid: a
 *  simplified picture), as raw A-format signals. */
export function aSignals(s: V3): Record<ATrack, number> {
  const u = unit(s);
  const g = (t: ATrack) => 0.5 + 0.5 * dot(TETRA[t], u);
  return { FLU: g('FLU'), FRD: g('FRD'), BLD: g('BLD'), BRU: g('BRU') };
}

export type BFormat = { W: number; X: number; Y: number; Z: number };
/** The textbook first-order A → B sums (a simplified picture: no capsule
 *  correction filters). The converter ASSUMES the tracks are in A_ORDER. */
export function aToB(a: Record<ATrack, number>): BFormat {
  return {
    W: (a.FLU + a.FRD + a.BLD + a.BRU) / 2,
    X: a.FLU + a.FRD - a.BLD - a.BRU,
    Y: a.FLU - a.FRD + a.BLD - a.BRU,
    Z: a.FLU - a.FRD - a.BLD + a.BRU,
  };
}
/** The direction a B-format field points to (deg): azimuth + LEFT, elevation + UP. */
export function bDirection(b: BFormat): { az: number; el: number } {
  return { az: Math.atan2(b.Y, b.X) / DEG, el: Math.atan2(b.Z, Math.hypot(b.X, b.Y)) / DEG };
}

/* ── the DRILL ── */

/** The recording as the learner set it up: which capsule's signal sits on
 *  each track (1 … 4), each track's gain (dB), whether the gains are linked,
 *  the output convention, and whether a field channel feeds the LFE bus. */
export type DrillState = {
  tracks: readonly ATrack[];
  gains: readonly number[];
  linked: boolean;
  format: 'fuma' | 'ambix' | null;
  lfe: boolean;
};
export const DRILL_START: DrillState = { tracks: ['FRD', 'FLU', 'BLD', 'BRU'], gains: [0, 0, 0, 0], linked: false, format: null, lfe: true };
export const DRILL_GOOD: DrillState = { tracks: [...A_ORDER], gains: [0, 0, 0, 0], linked: true, format: 'ambix', lfe: false };

export type DrillProblem = 'order' | 'gainMatch' | 'unlinked' | 'format' | 'lfe';
/** Gains within this many dB count as matched (the lab's tolerance). */
export const GAIN_MATCH_DB = 0.5;

/** Everything wrong with a drill state, in the order a careful setup checks it. */
export function drillProblems(s: DrillState): DrillProblem[] {
  const out: DrillProblem[] = [];
  if (s.tracks.length !== 4 || s.tracks.some((t, i) => t !== A_ORDER[i])) out.push('order');
  if (Math.max(...s.gains) - Math.min(...s.gains) > GAIN_MATCH_DB) out.push('gainMatch');
  if (!s.linked) out.push('unlinked');
  if (!s.format) out.push('format');
  if (s.lfe) out.push('lfe');
  return out;
}
/** The tracks that are not where the converter expects them (1-based). */
export function wrongTracks(s: DrillState): number[] {
  return s.tracks.map((t, i) => (t === A_ORDER[i] ? 0 : i + 1)).filter((n) => n > 0);
}

/** Where a source ACTUALLY lands after the conversion, given the drill state
 *  (the converter reads track k as capsule A_ORDER[k], each track at its
 *  gain): a track in the wrong slot or an unmatched gain moves the image. */
export function decodedDirection(s: DrillState, src: V3): { az: number; el: number } {
  const real = aSignals(src);
  const lin = (db: number) => 10 ** (db / 20);
  const asRead = { FLU: 0, FRD: 0, BLD: 0, BRU: 0 } as Record<ATrack, number>;
  A_ORDER.forEach((slot, k) => {
    asRead[slot] = real[s.tracks[k] ?? slot] * lin(s.gains[k] ?? 0);
  });
  return bDirection(aToB(asRead));
}

/** Angle between two directions given as (az, el), deg. */
export function directionError(a: { az: number; el: number }, b: { az: number; el: number }): number {
  const da = dirFrom(a.az, a.el);
  const db = dirFrom(b.az, b.el);
  return Math.acos(Math.max(-1, Math.min(1, dot(da, db)))) / DEG;
}

/* ── B-FORMAT CONVENTIONS ── */

export type BChannel = 'W' | 'X' | 'Y' | 'Z';
export const B_ORDER: Readonly<Record<'fuma' | 'ambix', readonly BChannel[]>> = {
  fuma: ['W', 'X', 'Y', 'Z'],
  ambix: ['W', 'Y', 'Z', 'X'],
};
/** W's scaling relative to the other channels at first order (dB): FuMa
 *  carries W 3 dB down; ambiX (SN3D) does not. */
export const W_SCALE_DB: Readonly<Record<'fuma' | 'ambix', number>> = { fuma: -3, ambix: 0 };

/** The four channels a convention writes (W scaled as it specifies). */
export function writeB(b: BFormat, fmt: 'fuma' | 'ambix'): number[] {
  const w = b.W * 10 ** (W_SCALE_DB[fmt] / 20);
  const m: Record<BChannel, number> = { W: w, X: b.X, Y: b.Y, Z: b.Z };
  return B_ORDER[fmt].map((c) => m[c]);
}
/** The field a player builds when it READS four channels as `fmt`. */
export function readB(ch: readonly number[], fmt: 'fuma' | 'ambix'): BFormat {
  const m: Record<BChannel, number> = { W: 0, X: 0, Y: 0, Z: 0 };
  B_ORDER[fmt].forEach((c, k) => {
    m[c] = ch[k] ?? 0;
  });
  return { W: m.W / 10 ** (W_SCALE_DB[fmt] / 20), X: m.X, Y: m.Y, Z: m.Z };
}
/** Written one way, read another: where the source appears. */
export function misread(src: V3, written: 'fuma' | 'ambix', readAs: 'fuma' | 'ambix'): { az: number; el: number } {
  return bDirection(readB(writeB(aToB(aSignals(src)), written), readAs));
}

/* ── DOUBLE M/S ── */

/** The decode with the figure-8's positive side to the LEFT (`sideSign` −1
 *  = the positive side marked the wrong way round). `width` scales the Side. */
export function dmsDecode(mf: number, s: number, mb: number, opts: { width?: number; sideSign?: 1 | -1 } = {}): { L: number; R: number; Ls: number; Rs: number } {
  const k = (opts.width ?? 1) * (opts.sideSign ?? 1);
  return { L: mf + k * s, R: mf - k * s, Ls: mb + k * s, Rs: mb - k * s };
}
/** The three raw tracks of a Double M/S for a source at azimuth `azDeg`
 *  (+ left): two ideal cardioids and an ideal figure-8 (a simplified picture). */
export function dmsTracks(azDeg: number): { mf: number; s: number; mb: number } {
  const c = Math.cos(azDeg * DEG);
  return { mf: 0.5 + 0.5 * c, s: Math.sin(azDeg * DEG), mb: 0.5 - 0.5 * c };
}

/* ── DESTINATIONS ── */

export type Destination = 'headphones' | 'surround5' | 'stereo' | 'mono';
export type Capture = 'binaural' | 'foa' | 'dms' | 'surround50';
export const DESTINATIONS: readonly Destination[] = ['headphones', 'surround5', 'stereo', 'mono'];
export const DEST_WORDS: Readonly<Record<Destination, { label: string; short: string; blurb: string }>> = {
  headphones: { label: 'Headphones', short: 'PHONES', blurb: 'One listener, a fixed point of view (or a turnable one with head tracking and a scene that supports it).' },
  surround5: { label: 'A five-speaker layout', short: '5.0 / 5.1', blurb: 'Left, centre and right in front, two surrounds behind; “.1” is a separate low-frequency effects channel in delivery, not a sixth microphone.' },
  stereo: { label: 'Stereo', short: 'STEREO', blurb: 'Two loudspeakers or a normal stream — the most common destination.' },
  mono: { label: 'Mono', short: 'MONO', blurb: 'One channel — a phone speaker, a radio, a summed feed. Every capture should survive it.' },
};
/** How each capture reaches each destination — 'native' (made for it),
 *  'render' (through a decoder or renderer chosen for it), 'downmix' (a mix
 *  down that must be checked by ear) — and what to check. */
export const ROUTES: Readonly<Record<Capture, Readonly<Record<Destination, { how: 'native' | 'render' | 'downmix'; words: string }>>>> = {
  binaural: {
    headphones: { how: 'native', words: 'Made for it: listen on the headphones it is for. A fixed head gives a fixed point of view.' },
    surround5: { how: 'render', words: 'Not made for it. Some heads and processes translate; test the exact head and the exact system.' },
    stereo: { how: 'downmix', words: 'Plays on two speakers, but the head’s cues may colour or narrow it; compare with a plain stereo pair.' },
    mono: { how: 'downmix', words: 'Sum the two ears and listen for colour: record a separate mono or stereo if the job needs one.' },
  },
  foa: {
    headphones: { how: 'render', words: 'Convert A to B with the mic’s own converter, then a binaural renderer — it can turn with the listener’s head.' },
    surround5: { how: 'render', words: 'Convert, then decode to the five-speaker layout with a decoder set for it.' },
    stereo: { how: 'render', words: 'Convert, then decode to stereo. Raw A-format is not stereo: never play the four tracks as channels.' },
    mono: { how: 'render', words: 'The W channel (or a decoded mono) — check it; never sum the four raw capsule tracks.' },
  },
  dms: {
    headphones: { how: 'render', words: 'Decode to front and rear, then a binaural renderer, or a stereo decode for a plain headphone mix.' },
    surround5: { how: 'render', words: 'Decode front L/R and rear Ls/Rs from the three tracks; a centre can come from the front Mid.' },
    stereo: { how: 'render', words: 'Front Mid ± Side: an ordinary M/S stereo decode, the width set in the matrix.' },
    mono: { how: 'downmix', words: 'The front Mid alone — the Side cancels in mono, as in any M/S pair.' },
  },
  surround50: {
    headphones: { how: 'render', words: 'Through a binaural renderer of the five-speaker layout — or monitor it on speakers.' },
    surround5: { how: 'native', words: 'Made for it: one mic per loudspeaker, mapped L, C, R, Ls, Rs. Read the channel map.' },
    stereo: { how: 'downmix', words: 'A downmix of five spaced mics: listen for colour from the different arrival times.' },
    mono: { how: 'downmix', words: 'The hardest test for spaced mics: their arrival times differ, so some pitches cancel. Check it by ear.' },
  },
};

/* ── the walker (F10's moving source, scrubbed by a finger — never a loop) ── */

/** A point a share `t` (0 … 1) along a straight walk a → b. */
export function along<T extends { x: number; y: number; z: number }>(a: T, b: T, t: number): { x: number; y: number; z: number } {
  const k = Math.max(0, Math.min(1, t));
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k };
}
