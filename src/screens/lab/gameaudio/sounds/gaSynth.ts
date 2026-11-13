/**
 * gaSynth — the Game Audio lab's ORIGINAL sounds, made in the app (owner
 * decision 2026-11-12: "sounds made inside the app now; my recordings can
 * replace them later"). Pure TypeScript on Float32Array, no React Native,
 * deterministic (seeded): every learner hears the same door, and
 * test/gameAudioSounds.test.ts pins what each sound is.
 *
 * These are SYNTHESISED sounds and the lab says so once, on its first page.
 * None is presented as a recording of a real object.
 *
 * Every sound is a small physical RECIPE, not a tone:
 *   footstep   a heel contact then a ball-of-foot contact; the SURFACE is the
 *              recipe (wood = a heel click on hollow board modes, stone = a
 *              short hard click, gravel = many small grains); the four takes
 *              of a surface differ in mode tuning, timing and level, as real
 *              steps do
 *   door       OPENING: two latch clicks, a stick-slip hinge creak, the
 *              leaf's thud. CLOSING (its own take): the leaf meets the frame
 *              first, then the latch drops home
 *   rattle     a loose latch settling (a bouncing run of metal pings) — the
 *              SECONDARY detail the lesson layers after the door
 *   generator  HUM: harmonics of a 50 Hz firing rate up to 2 kHz with a slow
 *              roughness; AIR: band noise from the cooling fan. Two loops,
 *              so the lab can move them separately with SPEED
 *   fountain   droplets and small splashes, in clusters, over a soft narrow
 *              bed of falling water (the droplets ARE the sound: a steady
 *              hiss alone reads as a fan). 24 kHz
 *   ambience   ROOM: low room rumble and a faint mains hum; YARD: wind whose
 *              color drifts, two gusts of different size in each pass.
 *              Stereo, 24 kHz (nothing in them reaches above 10 kHz)
 *   birds      three short calls, one-shots: the courtyard's SPOT sounds.
 *              They are not in the wind bed, so nothing repeats on its clock
 *   bad loop   the yard wind cut with NO loop preparation: its level jumps
 *              at the join — the fault lesson 10 lets the learner hear
 *   impact     a crate dropped: the floor's low thud under the box's own
 *              wood (a body mode and three knock modes), a crack, and a
 *              lighter second knock as it settles; DEBRIS is the scatter
 *              that follows it
 *   alarm      a two-tone beeper on the generator (an overheat warning)
 *   interface  a rising two-note confirm and a falling deny
 *   voice      the app's wordless stand-in voice (dj/engine/djVoice): the
 *              rhythm and pitch movement of speech, no words. It holds the
 *              place of lines the owner will record
 *   music      three layers of one 4-bar phrase at 96 BPM (A minor: Am F C
 *              G, a bar each) written to be layered, and a stinger. Every
 *              layer is rendered into a RING, so tails wrap and the loop
 *              boundary is seamless by construction. The stinger is a
 *              half-beat noise swell into an open-fifth hit (A and E, no
 *              third), so it agrees with every bar it can land on
 *   room       an impulse response (decaying noise, about 1.1 s) for the
 *              shared reverb, at 48 kHz
 *
 * Loops are seamless by construction: periodic content uses whole cycles,
 * noise content is cross-faded tail-into-head (equal power).
 */
import { SR, applyBiquad, brownNoise, makeRng, pinkNoise, rbj, whiteNoise, type Mono } from '../../../../features/ear/earDsp.ts';
import { voiceBuf, voiceSpans } from '../../dj/engine/djVoice.ts';

export { SR };
/** Sample rate of the ambience beds and the fountain (see the header). The
 *  reverb impulse is at 48 kHz (roomImpulse). */
export const SR_BED = 24_000;

export type GaSound = { sr: number; ch: Float32Array[] };

const TAU = Math.PI * 2;
const dbToLin = (db: number) => Math.pow(10, db / 20);

/* ── small kit ──────────────────────────────────────────────────────────── */

const buf = (seconds: number, sr = SR) => new Float32Array(Math.max(1, Math.round(seconds * sr)));

/** Add a damped sine ("a struck mode") at t0. `wrap` writes into a ring. */
function mode(out: Float32Array, sr: number, t0: number, hz: number, amp: number, decayS: number, wrap = false, phase = 0): void {
  const n0 = Math.round(t0 * sr);
  const len = Math.round(decayS * 7 * sr);
  const w = (TAU * hz) / sr;
  const k = Math.exp(-1 / (decayS * sr));
  let e = amp;
  const N = out.length;
  for (let i = 0; i < len; i++) {
    let j = n0 + i;
    if (j >= N) {
      if (!wrap) break;
      j %= N;
    }
    // a 1 ms attack keeps a struck mode from starting as a step
    const a = i < sr * 0.001 ? i / (sr * 0.001) : 1;
    out[j] += Math.sin(w * i + phase) * e * a;
    e *= k;
  }
}

/** A sine whose pitch glides f0 → f1, with attack / decay. Ring-aware. */
function glide(out: Float32Array, sr: number, t0: number, dur: number, f0: number, f1: number, amp: number, attackS: number, decayS: number, wrap = false): void {
  const n0 = Math.round(t0 * sr);
  const len = Math.round(dur * sr);
  const N = out.length;
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    const f = f0 + (f1 - f0) * (i / len);
    ph += (TAU * f) / sr;
    const env = Math.min(1, t / attackS) * Math.exp(-Math.max(0, t - attackS) / decayS) * Math.min(1, (len - i) / (sr * 0.004));
    let j = n0 + i;
    if (j >= N) {
      if (!wrap) break;
      j %= N;
    }
    out[j] += Math.sin(ph) * amp * env;
  }
}

/** A burst of filtered noise with an exponential decay. Ring-aware. */
function burst(
  out: Float32Array,
  sr: number,
  rng: () => number,
  t0: number,
  decayS: number,
  amp: number,
  band: { lo?: number; hi?: number },
  wrap = false,
): void {
  const len = Math.round(decayS * 7 * sr);
  let x: Mono = new Float32Array(len);
  for (let i = 0; i < len; i++) x[i] = rng() * 2 - 1;
  if (band.lo) x = applyAt(x, sr, band.lo, 'highpass');
  if (band.hi) x = applyAt(x, sr, band.hi, 'lowpass');
  const k = Math.exp(-1 / (decayS * sr));
  let e = amp;
  const n0 = Math.round(t0 * sr);
  const N = out.length;
  for (let i = 0; i < len; i++) {
    let j = n0 + i;
    if (j >= N) {
      if (!wrap) break;
      j %= N;
    }
    const a = i < sr * 0.0005 ? i / (sr * 0.0005) : 1;
    out[j] += x[i] * e * a;
    e *= k;
  }
}

/** earDsp's biquads are designed for 48 kHz; scale the corner for another
 *  rate so the filter lands where it is asked. */
function applyAt(x: Mono, sr: number, hz: number, type: 'lowpass' | 'highpass', q = 0.707): Mono {
  const f = Math.min((hz * SR) / sr, SR * 0.45);
  return applyBiquad(x, rbj(f, q, 0, type));
}

function peak(x: Float32Array): number {
  let p = 0;
  for (let i = 0; i < x.length; i++) {
    const a = x[i] < 0 ? -x[i] : x[i];
    if (a > p) p = a;
  }
  return p;
}
function toPeak(x: Float32Array, target: number): Float32Array {
  const p = peak(x);
  if (p > 0) {
    const g = target / p;
    for (let i = 0; i < x.length; i++) x[i] *= g;
  }
  return x;
}
/** Short fades so a one-shot never starts or ends on a step. */
function edges(x: Float32Array, sr: number, inMs = 1, outMs = 12): Float32Array {
  const a = Math.min(x.length, Math.round((inMs / 1000) * sr));
  const b = Math.min(x.length, Math.round((outMs / 1000) * sr));
  for (let i = 0; i < a; i++) x[i] *= i / a;
  for (let i = 0; i < b; i++) x[x.length - 1 - i] *= i / b;
  return x;
}
/** Make a noise texture loop: render `loopS + fadeS`, then lay the tail over
 *  the head with an equal-power cross-fade. The result is `loopS` long. */
function seamless(x: Float32Array, sr: number, loopS: number, fadeS: number): Float32Array {
  const N = Math.round(loopS * sr);
  const F = Math.round(fadeS * sr);
  const out = x.slice(0, N);
  for (let i = 0; i < F; i++) {
    const p = i / F;
    out[i] = x[i] * Math.sin((p * Math.PI) / 2) + x[N + i] * Math.cos((p * Math.PI) / 2);
  }
  return out;
}
/** Filter a RING: the loop is run through twice and the second pass kept, so
 *  the filter's memory at sample 0 is the memory it has at the loop's end —
 *  the join stays seamless. */
function ringFilter(x: Float32Array, c: ReturnType<typeof rbj>): Float32Array {
  const N = x.length;
  const twice = new Float32Array(N * 2);
  twice.set(x, 0);
  twice.set(x, N);
  return Float32Array.from(applyBiquad(twice, c).subarray(N));
}
/** A slow random wander in 0…1 (smoothed noise), for restless levels. */
function wander(len: number, sr: number, rng: () => number, rateHz: number): Float32Array {
  const out = new Float32Array(len);
  const step = Math.max(1, Math.round(sr / rateHz));
  let a = rng();
  let b = rng();
  for (let i = 0; i < len; i++) {
    const k = i % step;
    if (k === 0 && i > 0) {
      a = b;
      b = rng();
    }
    const p = k / step;
    const s = p * p * (3 - 2 * p);
    out[i] = a + (b - a) * s;
  }
  return out;
}

/* ── footsteps ──────────────────────────────────────────────────────────── */

export const GA_SURFACES = ['wood', 'stone', 'gravel'] as const;
export type GaSurface = (typeof GA_SURFACES)[number];
export const FOOTSTEP_TAKES = 4;
/** A wood floor under a hard sole: [Hz, level, decay s]. The hollow low mode
 *  is 6 dB under where it was (alone it read as a soft drum, audit 2 F10);
 *  the panel modes up to about 1.3 kHz are what a small speaker can play. */
const WOOD_MODES = [
  [92, 0.5, 0.06],
  [178, 0.5, 0.045],
  [305, 0.4, 0.034],
  [410, 0.42, 0.028],
  [640, 0.3, 0.02],
  [905, 0.27, 0.015],
  [1340, 0.13, 0.009],
] as const;
/** The heel click's level against the board modes (1.5 before check E, +10 dB). */
const WOOD_CLICK = 1.5 * Math.pow(10, 10 / 20);

export function footstep(surface: GaSurface, take: number): GaSound {
  const rng = makeRng(7100 + GA_SURFACES.indexOf(surface) * 97 + take * 13);
  const j = (spread: number) => 1 + (rng() * 2 - 1) * spread;
  const out = buf(0.36);
  const toeAt = 0.085 * j(0.3);
  const heel = dbToLin(-1.5 * rng());
  const toe = 0.55 * dbToLin(-2 * rng());
  if (surface === 'wood') {
    // each take lands on a slightly different part of the board: the modes
    // shift together (the board) and a little apart (where the foot fell)
    const board = j(0.14);
    for (const [hz, amp, d] of WOOD_MODES) {
      mode(out, SR, 0, hz * board * j(0.07), amp * heel * j(0.25), d * j(0.2));
      mode(out, SR, toeAt, hz * 1.32 * board * j(0.07), amp * toe * j(0.25), d * 0.8 * j(0.2));
    }
    // the heel CLICK: the sole's hard edge meeting the board. Raised 10 dB
    // (check E, problem 11): it was 25 dB under the step's total, and on a
    // small speaker the wood step was still the dark, quiet one.
    burst(out, SR, rng, 0, 0.005, WOOD_CLICK * heel, { lo: 1500, hi: 4000 });
    burst(out, SR, rng, 0, 0.004, 0.3 * heel, { hi: 1500 });
    burst(out, SR, rng, toeAt, 0.007, 0.4 * WOOD_CLICK * toe, { lo: 1100, hi: 3200 });
  } else if (surface === 'stone') {
    burst(out, SR, rng, 0, 0.011, 1.0 * heel, { lo: 1400 * j(0.1), hi: 5200 });
    mode(out, SR, 0, 150 * j(0.08), 0.5 * heel, 0.012);
    // the heel's own short "tock" on a hard slab
    mode(out, SR, 0, 950 * j(0.08), 0.34 * heel, 0.008);
    mode(out, SR, 0, 1650 * j(0.08), 0.24 * heel, 0.006);
    mode(out, SR, 0, 2300 * j(0.08), 0.18 * heel, 0.004);
    burst(out, SR, rng, toeAt, 0.016, 0.5 * toe, { lo: 2600, hi: 9000 });
    mode(out, SR, toeAt, 190 * j(0.08), 0.22 * toe, 0.01);
  } else {
    const grains = 9 + Math.floor(rng() * 5);
    for (let g = 0; g < grains; g++) {
      const first = g < grains / 2;
      const t = (first ? 0 : toeAt) + rng() * 0.07;
      const lo = 900 + rng() * 2200;
      burst(out, SR, rng, t, 0.004 + rng() * 0.006, (first ? heel : toe) * (0.35 + rng() * 0.55), { lo, hi: lo * 2.6 });
    }
    mode(out, SR, 0, 85 * j(0.1), 0.3 * heel, 0.02);
  }
  if (surface === 'stone') {
    // Stone is nearly all click (a very high crest), so at the same peak it
    // was the quietest surface by far (audit 2 F10). The click's first
    // millisecond is rounded off and the take trimmed up, so the three
    // surfaces sit together.
    toPeak(out, 1);
    const k = 1.4;
    const norm = Math.tanh(k);
    for (let i = 0; i < out.length; i++) out[i] = Math.tanh(out[i] * k) / norm;
    return { sr: SR, ch: [edges(toPeak(out, 0.88), SR)] };
  }
  // the click now sets wood's peak, so the take is set a little hotter to
  // keep its loudness with the other surfaces
  return { sr: SR, ch: [edges(toPeak(out, surface === 'wood' ? 0.86 : 0.7), SR)] };
}

/* ── door and its secondary rattle ──────────────────────────────────────── */

export function door(): GaSound {
  const rng = makeRng(4201);
  const out = buf(1.15);
  for (const t of [0, 0.072]) {
    for (const [hz, a] of [[2100, 0.5], [3400, 0.35], [5150, 0.22]] as const) mode(out, SR, t, hz, a * (t ? 0.7 : 1), 0.006);
    burst(out, SR, rng, t, 0.003, 0.35, { lo: 2500 });
  }
  // the hinge: stick-slip friction is a train of pulses whose spacing jitters
  const creak = buf(0.62);
  let ph = 0;
  for (let i = 0; i < creak.length; i++) {
    const p = i / creak.length;
    const f = 150 + 120 * Math.sin(p * Math.PI) + 26 * Math.sin(p * 31) + (rng() - 0.5) * 16;
    ph += f / SR;
    const saw = 2 * (ph - Math.floor(ph)) - 1;
    creak[i] = saw * Math.sin(p * Math.PI) ** 1.5;
  }
  let c: Mono = applyAt(creak, SR, 520, 'highpass');
  c = applyBiquad(c, rbj(1300, 2.2, 9, 'peak'));
  c = applyAt(c, SR, 3200, 'lowpass');
  toPeak(c, 0.32);
  const at = Math.round(0.16 * SR);
  for (let i = 0; i < c.length && at + i < out.length; i++) out[at + i] += c[i];
  for (const [hz, a, d] of [[78, 0.9, 0.06], [131, 0.5, 0.045], [240, 0.2, 0.03]] as const) mode(out, SR, 0.84, hz, a, d);
  burst(out, SR, rng, 0.84, 0.008, 0.25, { hi: 900 });
  return { sr: SR, ch: [edges(toPeak(out, 0.7), SR)] };
}

/** The door CLOSING, its own take (audit 2 F13): the leaf meets the frame
 *  first (a thud with the frame's knock in it), THEN the latch drops home. */
export function doorClose(): GaSound {
  const rng = makeRng(4203);
  const out = buf(0.62);
  // a short push of air before the leaf lands
  burst(out, SR, rng, 0, 0.03, 0.05, { lo: 300, hi: 1400 });
  const hit = 0.09;
  for (const [hz, a, d] of [[78, 0.9, 0.06], [131, 0.5, 0.045], [240, 0.3, 0.03]] as const) mode(out, SR, hit, hz, a, d);
  // the frame: what a small speaker still plays of a door shutting
  for (const [hz, a, d] of [[345, 0.6, 0.03], [530, 0.45, 0.024], [870, 0.24, 0.016]] as const) mode(out, SR, hit + 0.002, hz, a, d);
  burst(out, SR, rng, hit, 0.008, 0.3, { hi: 900 });
  burst(out, SR, rng, hit, 0.006, 0.22, { lo: 900, hi: 3200 });
  // the latch rides over the strike plate and snaps in, a moment later
  const latch = hit + 0.058;
  for (const [t, k] of [[latch, 1], [latch + 0.046, 0.55]] as const) {
    for (const [hz, a] of [[2100, 0.5], [3400, 0.35], [5150, 0.22]] as const) mode(out, SR, t, hz, a * k, 0.006);
    burst(out, SR, rng, t, 0.003, 0.35 * k, { lo: 2500 });
  }
  return { sr: SR, ch: [edges(toPeak(out, 0.7), SR)] };
}

export function doorRattle(): GaSound {
  const rng = makeRng(4207);
  const out = buf(0.62);
  let t = 0;
  let gap = 0.085;
  let amp = 0.8;
  for (let i = 0; i < 9; i++) {
    const f = 1900 + rng() * 2400;
    mode(out, SR, t, f, amp, 0.018 + rng() * 0.014);
    mode(out, SR, t, f * 1.48, amp * 0.5, 0.012);
    burst(out, SR, rng, t, 0.0025, amp * 0.3, { lo: 3000 });
    t += gap;
    gap *= 0.74;
    amp *= 0.78;
  }
  return { sr: SR, ch: [edges(toPeak(out, 0.5), SR)] };
}

/* ── the generator: two loops ───────────────────────────────────────────── */

export const GEN_HUM_S = 2;
export const GEN_AIR_S = 3;
/** 50 Hz × 40 = 2 kHz: the hum's highest partial. */
export const GEN_HUM_PARTIALS = 40;
/** The set's casing and exhaust ring broadly around 480 Hz: the partials
 *  there are lifted by up to this much (linear, added to 1). That band is
 *  what passes the wall's 900 Hz filter AND what a small speaker can play. */
const GEN_HUM_BODY = 1.8;

export function generatorHum(): GaSound {
  const N = Math.round(GEN_HUM_S * SR);
  const out = new Float32Array(N);
  const rng = makeRng(5301);
  // every partial is a whole number of cycles in the loop → seamless.
  // Forty partials (to 2 kHz) at a slow roll-off: with fourteen at 1/k the
  // hum was nearly all below 60 Hz, and a phone speaker had almost nothing
  // of it to play (audit 2 F6c).
  for (let k = 1; k <= GEN_HUM_PARTIALS; k++) {
    const hz = 50 * k;
    const amp = ((k % 2 ? 1 : 0.62) / Math.pow(k, 0.8)) * (1 + GEN_HUM_BODY * Math.exp(-(Math.log2(hz / 480) ** 2) / (2 * 0.6 * 0.6)));
    const ph = rng() * TAU;
    const w = (TAU * hz) / SR;
    for (let i = 0; i < N; i++) out[i] += Math.sin(w * i + ph) * amp;
  }
  // firing roughness: 12.5 Hz and 25 Hz (25 and 50 whole cycles in 2 s)
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    out[i] *= 1 + 0.16 * Math.sin(TAU * 12.5 * t) + 0.07 * Math.sin(TAU * 25 * t + 1.1);
  }
  const rumble = seamless(applyAt(brownNoise(GEN_HUM_S + 0.4, rng), SR, 160, 'lowpass'), SR, GEN_HUM_S, 0.4);
  toPeak(rumble, 0.25);
  toPeak(out, 0.6);
  for (let i = 0; i < N; i++) out[i] += rumble[i];
  // Forty partials peak higher than fourteen did for the same loudness: the
  // peak is set so the hum's RMS is what it was (-14.5 dBFS), only brighter.
  return { sr: SR, ch: [toPeak(out, 0.68)] };
}

export function generatorAir(): GaSound {
  const rng = makeRng(5311);
  let x: Mono = pinkNoise(GEN_AIR_S + 0.5, rng);
  x = applyAt(x, SR, 700, 'highpass');
  x = applyBiquad(x, rbj(1800, 0.9, 6, 'peak'));
  x = applyAt(x, SR, 5200, 'lowpass');
  const w = wander(x.length, SR, rng, 3);
  for (let i = 0; i < x.length; i++) x[i] *= 0.82 + 0.18 * w[i];
  return { sr: SR, ch: [toPeak(seamless(x, SR, GEN_AIR_S, 0.5), 0.5)] };
}

/* ── the fountain (a local emitter) ─────────────────────────────────────── */

export const FOUNTAIN_S = 8;
/** A small fountain (audit 2 F11, F14). What says "water" is the DROPLETS: a
 *  drop entering water rings a bubble, a short tone that rises as it shrinks,
 *  and drops come in runs. Under them is the soft, narrow noise of the
 *  falling sheet, 8 dB under where it was (it alone read as a fan), and a
 *  few low splashes. 8 s, so a pass does not repeat inside one breath; it is
 *  rendered at 24 kHz (nothing in it reaches 6 kHz), so it costs no more
 *  than the old 4 s file. Droplets are written into the RING: none is cut or
 *  faded by the loop join. */
export function fountain(): GaSound {
  const rng = makeRng(6101);
  const sr = SR_BED;
  const N = Math.round(FOUNTAIN_S * sr);
  const fade = 0.6;
  let bed: Mono = whiteNoise(FOUNTAIN_S + fade, rng).slice(0, N + Math.round(fade * sr));
  bed = applyAt(bed, sr, 1500, 'highpass');
  bed = applyAt(bed, sr, 5000, 'lowpass');
  const w = wander(bed.length, sr, rng, 5);
  for (let i = 0; i < bed.length; i++) bed[i] *= 0.6 + 0.4 * w[i];
  const out = toPeak(seamless(Float32Array.from(bed), sr, FOUNTAIN_S, fade), 0.11);
  // small bubbles, many and short: the water's sparkle
  for (let b = 0; b < 640; b++) {
    const f = 1500 + rng() * 3300;
    const dur = 0.008 + rng() * 0.01;
    glide(out, sr, rng() * FOUNTAIN_S, dur, f, f * (1.1 + rng() * 0.2), 0.035 + rng() * 0.06, 0.001, dur * 0.3, true);
  }
  // the DROPS a listener picks out: lower, longer, each rising as its bubble
  // closes, and they come in runs (one stream breaking up)
  const drop = (t: number, f: number, amp: number) => {
    const dur = 0.03 + rng() * 0.05;
    glide(out, sr, t % FOUNTAIN_S, dur, f, f * (1.18 + rng() * 0.35), amp, 0.002, dur * 0.22, true);
  };
  for (let c = 0; c < 30; c++) {
    let t = rng() * FOUNTAIN_S;
    const base = 520 + rng() * 1100;
    const n = 2 + Math.floor(rng() * 4);
    const level = 0.17 + rng() * 0.17;
    for (let k = 0; k < n; k++) {
      drop(t, base * (0.8 + rng() * 0.5), level * (0.55 + rng() * 0.45));
      t += 0.03 + rng() * 0.07;
    }
  }
  for (let d = 0; d < 40; d++) drop(rng() * FOUNTAIN_S, 600 + rng() * 1300, 0.12 + rng() * 0.16);
  // low splashes: water landing on water
  for (let k = 0; k < 22; k++) burst(out, sr, rng, rng() * FOUNTAIN_S, 0.03 + rng() * 0.03, 0.2 + rng() * 0.14, { lo: 300, hi: 800 }, true);
  return { sr, ch: [toPeak(out, 0.5)] };
}

/* ── the courtyard's spot sounds: three bird calls ──────────────────────── */

export const BIRD_CALLS = 3;
/** One of three short bird calls (0 … 2), a one-shot. They were six fixed
 *  notes inside the wind loop, the same every 10.0 s (audit 2 F14); as
 *  separate one-shots the game decides when and where each one sounds.
 *  Authored QUIET (peak 0.12): a call sits under speech at event gain 1.
 *    0  two rising whistles          1  three notes, the middle one highest
 *    2  a fast trill of falling chirps */
export function birdCall(kind: number): GaSound {
  const k = ((Math.round(kind) % BIRD_CALLS) + BIRD_CALLS) % BIRD_CALLS;
  const out = buf(k === 2 ? 0.5 : k === 1 ? 0.56 : 0.4);
  // a whistle and its faint octave: a pure sine reads as a test tone
  const whistle = (t: number, dur: number, f0: number, f1: number, amp: number) => {
    glide(out, SR, t, dur, f0, f1, amp, 0.008, dur * 0.55);
    glide(out, SR, t, dur, f0 * 2, f1 * 2, amp * 0.1, 0.008, dur * 0.4);
  };
  if (k === 0) {
    whistle(0, 0.09, 3100, 3780, 1);
    whistle(0.22, 0.1, 3500, 4270, 0.9);
  } else if (k === 1) {
    whistle(0, 0.09, 2700, 3290, 0.9);
    whistle(0.18, 0.09, 3300, 4030, 1);
    whistle(0.36, 0.11, 2950, 3600, 0.8);
  } else {
    for (let n = 0; n < 10; n++) {
      const swell = Math.sin(((n + 0.5) / 10) * Math.PI);
      whistle(n * 0.044, 0.03, 4500 - n * 25, 3400 - n * 25, 0.35 + 0.65 * swell);
    }
  }
  return { sr: SR, ch: [edges(toPeak(out, 0.12), SR, 1, 8)] };
}

/* ── ambience beds (stereo, 24 kHz) ─────────────────────────────────────── */

export const AMB_ROOM_S = 8;
export const AMB_YARD_S = 10;

function roomSide(seed: number): Float32Array {
  const rng = makeRng(seed);
  const total = AMB_ROOM_S + 1;
  let x: Mono = brownNoise(total, rng).slice(0, Math.round(total * SR_BED));
  x = applyAt(x, SR_BED, 420, 'lowpass');
  x = applyAt(x, SR_BED, 35, 'highpass');
  toPeak(x, 0.42);
  const air = applyAt(applyAt(pinkNoise(total, rng).slice(0, x.length), SR_BED, 1200, 'highpass'), SR_BED, 5000, 'lowpass');
  toPeak(air, 0.06);
  for (let i = 0; i < x.length; i++) x[i] += air[i];
  return seamless(x, SR_BED, AMB_ROOM_S, 1);
}
export function ambienceRoom(): GaSound {
  const l = roomSide(8101);
  const r = roomSide(8102);
  // a faint mains hum, the same in both ears: 100 Hz and 200 Hz (whole cycles)
  for (let i = 0; i < l.length; i++) {
    const h = 0.035 * Math.sin((TAU * 100 * i) / SR_BED) + 0.012 * Math.sin((TAU * 200 * i) / SR_BED + 0.7);
    l[i] += h;
    r[i] += h;
  }
  const p = Math.max(peak(l), peak(r));
  const g = 0.4 / p;
  for (let i = 0; i < l.length; i++) {
    l[i] *= g;
    r[i] *= g;
  }
  return { sr: SR_BED, ch: [l, r] };
}

/** Wind: pink noise through a band whose centre drifts, under a gusting
 *  level. `prepared` = cross-faded into a loop; false = the raw cut. */
function windSide(seed: number, gust: Float32Array, prepared: boolean): Float32Array {
  const rng = makeRng(seed);
  const total = AMB_YARD_S + 1.5;
  const n = Math.round(total * SR_BED);
  const src = pinkNoise(total, rng);
  const out = new Float32Array(n);
  // a state-variable band-pass with a wandering centre
  const drift = wander(n, SR_BED, makeRng(seed + 5), 0.35);
  let lp = 0;
  let bp = 0;
  for (let i = 0; i < n; i++) {
    const fc = 260 + 620 * drift[i] * (0.5 + 0.5 * gust[i]);
    const f = 2 * Math.sin((Math.PI * fc) / SR_BED);
    const hp = src[i] - lp - 0.9 * bp;
    bp += f * hp;
    lp += f * bp;
    out[i] = bp * (0.1 + 0.9 * gust[i]);
  }
  return prepared ? seamless(out, SR_BED, AMB_YARD_S, 1.5) : out.slice(0, Math.round(AMB_YARD_S * SR_BED));
}
/** The prepared bed's gusts: [center s, half-width s, size]. Two of
 *  DIFFERENT size and spacing in each 10 s pass, with a lull at the join, so
 *  the loop does not read as one swell on a clock (audit 2 F14). */
export const YARD_GUSTS = [
  [2.7, 2.4, 1],
  [7.2, 1.6, 0.4],
] as const;
function yard(prepared: boolean): GaSound {
  const n = Math.round((AMB_YARD_S + 1.5) * SR_BED);
  const gust = new Float32Array(n);
  if (prepared) {
    // periodic in the loop length, so the cross-fade joins like with like
    const flutter = wander(n, SR_BED, makeRng(8203), 1.3);
    for (let i = 0; i < n; i++) {
      const t = (i / SR_BED) % AMB_YARD_S;
      let g = 0.13;
      for (const [at, half, size] of YARD_GUSTS) {
        const d = Math.abs(t - at) / half;
        if (d < 1) g += size * (0.5 + 0.5 * Math.cos(Math.PI * d)) ** 1.4;
      }
      gust[i] = Math.min(1, g * (0.86 + 0.14 * flutter[i]));
    }
  } else {
    // the unprepared cut ends in a gust and begins in a lull
    for (let i = 0; i < n; i++) {
      const p = Math.min(1, i / (AMB_YARD_S * SR_BED));
      gust[i] = p * p;
    }
  }
  const l = windSide(8201, gust, prepared);
  const r = windSide(8202, gust, prepared);
  const N = l.length;
  // No birds in here: they are one-shots of their own (birdCall), posted by
  // the game at its own times and places.
  const p = Math.max(peak(l), peak(r));
  const g = 0.45 / p;
  for (let i = 0; i < N; i++) {
    l[i] *= g;
    r[i] *= g;
  }
  return { sr: SR_BED, ch: [l, r] };
}
export const ambienceYard = (): GaSound => yard(true);
/** The same wind cut with no loop preparation (lesson 10's fault). */
export const ambienceYardUnprepared = (): GaSound => yard(false);

/* ── impact, debris, alarm, interface ───────────────────────────────────── */

/** A wooden crate's knock: [Hz, level, decay s] (inharmonic, as a box is). */
const CRATE_KNOCK = [
  [420, 1.25, 0.055],
  [765, 0.9, 0.045],
  [1180, 0.55, 0.04],
] as const;
export function crateImpact(): GaSound {
  const rng = makeRng(9101);
  const out = buf(0.7);
  // the floor's thud
  for (const [hz, a, d] of [[68, 1, 0.07], [112, 0.6, 0.05], [163, 0.35, 0.035]] as const) mode(out, SR, 0, hz, a, d);
  // the crate's own wood: a body mode and three knock modes, 8 dB up and
  // longer than they were. With the thud alone on top it read as a kick drum
  // and a small speaker lost most of it (audit 2 F10).
  mode(out, SR, 0.002, 250, 0.7, 0.05);
  for (const [hz, a, d] of CRATE_KNOCK) mode(out, SR, 0.004, hz, a, d);
  burst(out, SR, rng, 0, 0.005, 0.6, { lo: 1800, hi: 7000 });
  // it lands on one edge and settles onto the other: a lighter second knock
  const settle = 0.092;
  mode(out, SR, settle, 74, 0.28, 0.05);
  mode(out, SR, settle, 268, 0.22, 0.04);
  for (const [hz, a, d] of CRATE_KNOCK) mode(out, SR, settle + 0.003, hz * 1.08, a * 0.34, d * 0.75);
  burst(out, SR, rng, settle, 0.004, 0.18, { lo: 1800, hi: 6000 });
  return { sr: SR, ch: [edges(toPeak(out, 0.8), SR)] };
}
export function crateDebris(): GaSound {
  const rng = makeRng(9107);
  const out = buf(0.85);
  for (let i = 0; i < 9; i++) {
    const t = Math.pow(rng(), 0.7) * 0.6;
    const f = 850 + rng() * 1700;
    const a = (0.25 + rng() * 0.6) * (1 - t);
    mode(out, SR, t, f, a, 0.008 + rng() * 0.01);
    mode(out, SR, t, f * 1.9, a * 0.4, 0.005);
    burst(out, SR, rng, t, 0.003, a * 0.3, { lo: 2000 });
  }
  return { sr: SR, ch: [edges(toPeak(out, 0.45), SR)] };
}

export const ALARM_S = 1;
export function alarm(): GaSound {
  const out = buf(ALARM_S);
  const tone = (t0: number, dur: number, hz: number) => {
    const n0 = Math.round(t0 * SR);
    const len = Math.round(dur * SR);
    for (let i = 0; i < len; i++) {
      const env = Math.min(1, i / (SR * 0.004), (len - i) / (SR * 0.006));
      const w = (TAU * hz * i) / SR;
      out[n0 + i] += (Math.sin(w) + 0.32 * Math.sin(3 * w) + 0.12 * Math.sin(5 * w)) * env;
    }
  };
  tone(0.0, 0.2, 1975.5);
  tone(0.25, 0.2, 1568);
  return { sr: SR, ch: [toPeak(out, 0.5)] };
}

export function uiConfirm(): GaSound {
  const out = buf(0.24);
  glide(out, SR, 0, 0.09, 880, 880, 0.6, 0.004, 0.035);
  glide(out, SR, 0.085, 0.14, 1318.5, 1318.5, 0.6, 0.004, 0.05);
  glide(out, SR, 0.085, 0.14, 2637, 2637, 0.12, 0.004, 0.03);
  return { sr: SR, ch: [edges(toPeak(out, 0.45), SR)] };
}
export function uiDeny(): GaSound {
  const out = buf(0.3);
  glide(out, SR, 0, 0.11, 392, 392, 0.6, 0.004, 0.05);
  glide(out, SR, 0, 0.11, 784, 784, 0.15, 0.004, 0.03);
  glide(out, SR, 0.1, 0.18, 311.1, 293.7, 0.6, 0.004, 0.07);
  glide(out, SR, 0.1, 0.18, 622.2, 587.4, 0.15, 0.004, 0.04);
  return { sr: SR, ch: [edges(toPeak(out, 0.45), SR)] };
}

/* ── the stand-in voice ─────────────────────────────────────────────────── */

export type GaVoiceLine = 'greeting' | 'greetingLong' | 'warning' | 'warningLong' | 'chat';

/** Cuts of the wordless stand-in phrase. `greetingLong` is the SAME line as
 *  a longer take (the lesson's second-language duration); `warning` is the
 *  phrase's short last part and `warningLong` its longer take; `chat` is
 *  band-limited like a headset. */
export function voiceLine(line: GaVoiceLine): GaSound {
  const v = voiceBuf();
  const spans = voiceSpans();
  const cut = (t0: number, t1: number, rate: number): Float32Array => {
    const a = Math.max(0, Math.round((t0 - 0.03) * SR));
    const b = Math.min(v.length, Math.round((t1 + 0.12) * SR));
    const len = Math.floor((b - a) / rate);
    const out = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const x = a + i * rate;
      const k = Math.floor(x);
      const f = x - k;
      out[i] = v[k] * (1 - f) + (k + 1 < v.length ? v[k + 1] : 0) * f;
    }
    return edges(out, SR, 4, 30);
  };
  const third = Math.max(1, Math.floor(spans.length / 3));
  const first = spans[0].t0;
  const endA = spans[Math.min(spans.length - 1, third * 2 - 1)].t1;
  const lastStart = spans[Math.min(spans.length - 1, third * 2)].t0;
  const end = spans[spans.length - 1].t1;
  let x: Float32Array;
  if (line === 'greeting') x = cut(first, endA, 1);
  else if (line === 'greetingLong') x = cut(first, endA, 0.84);
  else if (line === 'warning') x = cut(lastStart, end, 0.94);
  else if (line === 'warningLong') x = cut(lastStart, end, 0.8);
  else {
    let c: Mono = cut(first, endA, 1.05);
    c = applyAt(c, SR, 320, 'highpass');
    c = applyAt(c, SR, 3300, 'lowpass');
    x = c;
  }
  return { sr: SR, ch: [toPeak(x, 0.6)] };
}

/* ── music: three layers of one phrase, and a stinger ───────────────────── */

export const MUSIC_BPM = 96;
export const MUSIC_BEATS_PER_BAR = 4;
export const MUSIC_BARS = 4;
export const MUSIC_BEAT_S = 60 / MUSIC_BPM;
export const MUSIC_BAR_S = MUSIC_BEAT_S * MUSIC_BEATS_PER_BAR;
export const MUSIC_LOOP_S = MUSIC_BAR_S * MUSIC_BARS;
export const MUSIC_LAYERS = ['calm', 'pulse', 'drive'] as const;
export type GaMusicLayer = (typeof MUSIC_LAYERS)[number];

const A2 = 110;
const semi = (n: number) => A2 * Math.pow(2, n / 12);
/** Am · F · C · G — root and triad, in semitones above A2. */
const CHORDS: { root: number; tones: number[] }[] = [
  { root: 0, tones: [12, 15, 19] }, // A  C  E
  { root: -4, tones: [8, 12, 15] }, // F  A  C
  { root: 3, tones: [10, 15, 19] }, // G  C  E  (C major, first inversion voicing)
  { root: -2, tones: [10, 14, 17] }, // G  B  D
];

/** A band-limited saw-like note (a few harmonics), ring-written. */
function note(out: Float32Array, t0: number, dur: number, hz: number, amp: number, attack: number, release: number, harmonics: number, bright: number): void {
  const N = out.length;
  const n0 = Math.round(t0 * SR);
  const len = Math.round((dur + release) * SR);
  const amps: number[] = [];
  for (let h = 1; h <= harmonics; h++) amps.push(Math.pow(h, -bright) * (hz * h < 9000 ? 1 : 0));
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = t < attack ? t / attack : t < dur ? 1 : Math.exp(-(t - dur) / (release / 4));
    let s = 0;
    const w = (TAU * hz * i) / SR;
    for (let h = 0; h < amps.length; h++) s += Math.sin(w * (h + 1)) * amps[h];
    out[(n0 + i) % N] += s * amp * env;
  }
}

export function musicLayer(layer: GaMusicLayer): GaSound {
  const N = Math.round(MUSIC_LOOP_S * SR);
  const out = new Float32Array(N);
  const rng = makeRng(3300 + MUSIC_LAYERS.indexOf(layer));
  const B = MUSIC_BEAT_S;
  for (let bar = 0; bar < MUSIC_BARS; bar++) {
    const c = CHORDS[bar];
    const t = bar * MUSIC_BAR_S;
    if (layer === 'calm') {
      // a slow pad, two slightly detuned voices per chord tone
      for (const st of c.tones) {
        note(out, t, MUSIC_BAR_S - 0.2, semi(st) * 1.003, 0.1, 0.5, 1.1, 5, 1.6);
        note(out, t, MUSIC_BAR_S - 0.2, semi(st) * 0.997, 0.1, 0.5, 1.1, 5, 1.6);
      }
      // a soft bell on each beat, walking the chord
      for (let b = 0; b < 4; b++) {
        const st = c.tones[[0, 2, 1, 2][b]] + 12;
        mode(out, SR, t + b * B, semi(st), 0.11, 0.16, true);
        mode(out, SR, t + b * B, semi(st) * 2.01, 0.035, 0.07, true);
      }
    } else if (layer === 'pulse') {
      for (let e = 0; e < 8; e++) {
        const up = e === 3 || e === 7;
        note(out, t + e * (B / 2), 0.2, semi(c.root + (up ? 12 : 0)), 0.3, 0.006, 0.12, 6, 1.3);
        if (e % 2 === 1) burst(out, SR, rng, t + e * (B / 2), 0.012, 0.16, { lo: 7000 }, true);
      }
      for (let s = 0; s < 16; s++) burst(out, SR, rng, t + s * (B / 4), 0.006, s % 4 === 2 ? 0.07 : 0.035, { lo: 5000, hi: 11000 }, true);
    } else {
      const kicks = bar % 2 ? [0, 2, 3.5] : [0, 2];
      for (const k of kicks) {
        glide(out, SR, t + k * B, 0.2, 125, 46, 0.7, 0.002, 0.07, true);
        burst(out, SR, rng, t + k * B, 0.002, 0.25, { lo: 1500 }, true);
      }
      for (const s of [1, 3]) {
        burst(out, SR, rng, t + s * B, 0.03, 0.38, { lo: 1100, hi: 8000 }, true);
        mode(out, SR, t + s * B, 190, 0.3, 0.03, true);
      }
      // a short stabbing line on the off-beats
      const line = [c.tones[2] + 12, c.tones[1] + 12, c.tones[2] + 12, c.tones[0] + 24];
      for (let e = 0; e < 4; e++) note(out, t + (e + 0.5) * B, 0.11, semi(line[e]), 0.085, 0.004, 0.09, 7, 1.1);
    }
  }
  let x: Float32Array = out;
  if (layer === 'calm') x = ringFilter(x, rbj(1400, 0.707, 0, 'lowpass'));
  if (layer === 'pulse') x = ringFilter(x, rbj(40, 0.707, 0, 'highpass'));
  return { sr: SR, ch: [toPeak(x, layer === 'calm' ? 0.34 : layer === 'pulse' ? 0.36 : 0.42)] };
}

/** Seconds from the stinger file's first sample to its HIT: exactly half a
 *  beat (0.3125 s at 96 BPM). The engine is told this `lead` and starts the
 *  file that much BEFORE the line, so the hit lands on the line (audit 2 F9). */
export const MUSIC_STINGER_LEAD_S = MUSIC_BEAT_S / 2;
export const MUSIC_STINGER_S = 2.4;

/** "Something just happened": a half-beat swell of noise (no pitch, so it
 *  agrees with any bar), then the hit: an open fifth, A and E with no third.
 *  Over the four bars that reads Am, F major 7, C6 and G6/9: never a
 *  semitone against the chord. (It was E major into A minor, 420 ms in: off
 *  the grid, and G sharp against three bars of four.) */
export function musicStinger(): GaSound {
  const rng = makeRng(3390);
  const out = buf(MUSIC_STINGER_S);
  const hit = MUSIC_STINGER_LEAD_S;
  const ring = new Float32Array(out.length * 2);
  for (const st of [0, 7, 12, 19, 24, 31]) note(ring, hit, 0.55, semi(st), st === 31 ? 0.07 : 0.12, 0.004, 1.3, 9, 1.05);
  out.set(ring.subarray(0, out.length));
  burst(out, SR, rng, hit, 0.22, 0.2, { lo: 5000 });
  glide(out, SR, hit, 0.3, 110, 55, 0.5, 0.003, 0.12);
  let x: Mono = Float32Array.from(applyBiquad(out, rbj(4200, 0.707, 0, 'lowpass')));
  // the pickup: band noise rising into the line, gone 6 ms before the hit
  const n = Math.round(hit * SR);
  let sw: Mono = new Float32Array(n);
  for (let i = 0; i < n; i++) sw[i] = rng() * 2 - 1;
  sw = applyAt(applyAt(sw, SR, 1800, 'highpass'), SR, 1800, 'highpass');
  sw = applyAt(sw, SR, 7000, 'lowpass');
  const gap = Math.round(0.006 * SR);
  for (let i = 0; i < n; i++) {
    const p = i / n;
    x[i] += sw[i] * 0.5 * p ** 2.2 * Math.min(1, (n - i) / gap);
  }
  return { sr: SR, ch: [edges(toPeak(x, 0.6), SR, 1, 60)] };
}

/* ── the room: a reverb impulse response ────────────────────────────────── */

export const ROOM_RT60_S = 1.1;
/** The room impulse, at 48 kHz (check E, problem 9). At 24 kHz it had to be
 *  upsampled on every 48 kHz device, and straight-line steps left images of
 *  its 3 to 6 kHz content at 18 to 21 kHz (−22 dB re the wet total). At the
 *  rate most devices run at, nothing is converted; a 44.1 kHz device steps
 *  DOWN, far from anything in it. */
export function roomImpulse(): GaSound {
  const side = (seed: number): Float32Array => {
    const rng = makeRng(seed);
    const n = Math.round(1.5 * SR);
    let x: Mono = new Float32Array(n);
    // −60 dB at RT60: amplitude e^(−6.908 t / RT60)
    for (let i = 0; i < n; i++) x[i] = (rng() * 2 - 1) * Math.exp((-6.908 * (i / SR)) / ROOM_RT60_S);
    x = applyAt(x, SR, 5200, 'lowpass');
    x = applyAt(x, SR, 140, 'highpass');
    // a few early reflections in the first 40 ms
    for (let k = 0; k < 5; k++) x[Math.round((0.006 + rng() * 0.034) * SR)] += (rng() > 0.5 ? 1 : -1) * (0.5 - k * 0.07);
    // band-limited as the 24 kHz take was: nothing of the room above about
    // 11 kHz (the early reflections are single samples, so without this the
    // 48 kHz take would ring brighter than the one it replaces)
    for (let k = 0; k < 4; k++) x = applyAt(x, SR, 10000, 'lowpass');
    const pre = Math.round(0.004 * SR);
    const out = new Float32Array(n);
    for (let i = pre; i < n; i++) out[i] = x[i - pre];
    return edges(out, SR, 0, 80);
  };
  const l = side(2601);
  const r = side(2602);
  const p = Math.max(peak(l), peak(r));
  for (let i = 0; i < l.length; i++) {
    l[i] /= p * 2.2;
    r[i] /= p * 2.2;
  }
  return { sr: SR, ch: [l, r] };
}
