/**
 * Mixing lab — SESSION SYNTHESIS + OFFLINE MIX RENDERER (owner GO 2026-09-11).
 *
 * The house audio pattern (Ear Training precedent): render real PCM offline
 * in JS from earDsp primitives, encode WAV, play via expo-audio. Nothing is
 * faked — the learner's fader/pan/mute/polarity decisions are applied as real
 * gain math and the SUM is what they hear. Live-while-playing faders would
 * need native work; "decide → render → listen → compare" is the deliberate
 * listening loop the lab teaches anyway.
 *
 * The session is an HONEST synthesized 8-track groove (A-minor, 96 BPM,
 * 4 bars ≈ 10 s): the LEAD and BGV parts are synth stand-ins for vocals and
 * are labeled as such on-screen (no fake vocals). Real rights-cleared stems
 * drop in later as a pure asset swap — manifest in
 * docs/APE_MIXING_LAB_ASSETS_2026_09_11.md.
 *
 * All synthesis is DETERMINISTIC (seeded) so every learner hears the same
 * session and the test suite can pin measurements.
 */
import {
  SR,
  applyBiquad,
  classicWave,
  compress,
  fadeEdges,
  gainDb as dspGainDb,
  highpass,
  lowpass,
  makeRng,
  peakEq,
  reverb,
  rmsDb,
  sine,
  whiteNoise,
  type Mono,
  type ReverbSpace,
  type Stereo,
} from '../../../../features/ear/earDsp.ts'; // explicit .ts: node test runner (careerfinder/scoring precedent)
import { TRACK_IDS, type TrackId } from '../engine/mixModel.ts';

export const BPM = 96;
export const BARS = 4;
export const BEAT_S = 60 / BPM;
export const LOOP_S = BARS * 4 * BEAT_S; // = 10 s
const N = Math.round(LOOP_S * SR);

/* ── tiny sequencing helpers ─────────────────────────────────────────────── */

const zeros = () => new Float32Array(N);

/** Add `clip` into `out` starting at `atSec` (clipped to the loop). */
function place(out: Mono, clip: Mono, atSec: number, gain = 1): void {
  const start = Math.round(atSec * SR);
  const n = Math.min(clip.length, out.length - start);
  for (let i = 0; i < n; i++) out[start + i] += clip[i] * gain;
}

/** Exponential decay envelope applied in place. */
function decay(x: Mono, tau: number): Mono {
  for (let i = 0; i < x.length; i++) x[i] *= Math.exp(-i / (tau * SR));
  return x;
}

/** Linear attack (seconds) applied in place. */
function attack(x: Mono, sec: number): Mono {
  const n = Math.min(x.length, Math.round(sec * SR));
  for (let i = 0; i < n; i++) x[i] *= i / n;
  return x;
}

const NOTE: Record<string, number> = {
  C2: 65.41, E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0,
  C3: 130.81, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25,
};

/** A-minor progression, one chord per bar: Am → F → C → G. */
const CHORDS: { root: string; triad: string[] }[] = [
  { root: 'A2', triad: ['A3', 'C4', 'E4'] },
  { root: 'F2', triad: ['F3', 'A3', 'C4'] },
  { root: 'C2', triad: ['C3', 'E3', 'G3'] },
  { root: 'G2', triad: ['G3', 'B3', 'D4'] },
];

/* ── the eight stems ─────────────────────────────────────────────────────── */

function synthKick(): Mono {
  const out = zeros();
  // Pitch-swept sine thump: 90 → 45 Hz, 180 ms.
  const hit = (() => {
    const n = Math.round(0.18 * SR);
    const x = new Float32Array(n);
    let phase = 0;
    for (let i = 0; i < n; i++) {
      const f = 90 - (45 * i) / n;
      phase += (2 * Math.PI * f) / SR;
      x[i] = Math.sin(phase);
    }
    return decay(x, 0.06);
  })();
  for (let bar = 0; bar < BARS; bar++) {
    const t0 = bar * 4 * BEAT_S;
    place(out, hit, t0);
    place(out, hit, t0 + 2 * BEAT_S);
    if (bar % 2 === 1) place(out, hit, t0 + 3.5 * BEAT_S, 0.7); // pickup
  }
  return out;
}

function synthSnare(rng: () => number): Mono {
  const out = zeros();
  const hit = (() => {
    const body = decay(sine(190, 0.12), 0.03);
    const rattle = decay(applyBiquad(whiteNoise(0.16, rng), highpass(1800, 0.8)), 0.045);
    const x = new Float32Array(Math.round(0.16 * SR));
    for (let i = 0; i < x.length; i++) x[i] = (body[i] ?? 0) * 0.7 + rattle[i] * 0.8;
    return x;
  })();
  for (let bar = 0; bar < BARS; bar++) {
    const t0 = bar * 4 * BEAT_S;
    place(out, hit, t0 + BEAT_S);
    place(out, hit, t0 + 3 * BEAT_S);
  }
  return out;
}

function synthPerc(rng: () => number): Mono {
  const out = zeros();
  const tick = decay(applyBiquad(whiteNoise(0.05, rng), highpass(6000, 0.7)), 0.012);
  const open = decay(applyBiquad(whiteNoise(0.12, rng), highpass(5000, 0.7)), 0.05);
  for (let bar = 0; bar < BARS; bar++) {
    const t0 = bar * 4 * BEAT_S;
    for (let e = 0; e < 8; e++) place(out, e === 7 ? open : tick, t0 + e * (BEAT_S / 2), e % 2 === 0 ? 0.9 : 0.55);
  }
  return out;
}

function synthBass(): Mono {
  const out = zeros();
  for (let bar = 0; bar < BARS; bar++) {
    const f = NOTE[CHORDS[bar].root];
    const t0 = bar * 4 * BEAT_S;
    // Root on 1 and 3, octave push on 2&: a simple pocket line.
    for (const [at, freq, len] of [
      [0, f, 0.9], [1.5 * BEAT_S, f, 0.4], [2 * BEAT_S, f, 0.9], [3 * BEAT_S, f * 2, 0.45],
    ] as const) {
      const note = attack(decay(applyBiquad(classicWave('saw', freq, len), lowpass(500, 0.9)), 0.5), 0.008);
      place(out, fadeEdges(note, 6), t0 + at, 0.9);
    }
  }
  return out;
}

function synthGtr(): Mono {
  const out = zeros();
  for (let bar = 0; bar < BARS; bar++) {
    const t0 = bar * 4 * BEAT_S;
    const triad = CHORDS[bar].triad.map((n) => NOTE[n] ?? NOTE.A3);
    // Off-beat plucked comp stabs (skank feel): the 8ths between beats.
    for (let e = 1; e < 8; e += 2) {
      const stab = zeros0(Math.round(0.22 * SR));
      for (const f of triad) {
        const s = attack(decay(classicWave('saw', f * 2, 0.22), 0.05), 0.003);
        for (let i = 0; i < stab.length; i++) stab[i] += s[i] / triad.length;
      }
      place(out, fadeEdges(applyBiquad(stab, peakEq(2200, 3, 1.2)), 4), t0 + e * (BEAT_S / 2), 0.8);
    }
  }
  return applyBiquad(applyBiquad(out, highpass(160, 0.7)), lowpass(4200, 0.8));
}

function zeros0(n: number): Float32Array {
  return new Float32Array(n);
}

function synthKeys(): Mono {
  const out = zeros();
  for (let bar = 0; bar < BARS; bar++) {
    const t0 = bar * 4 * BEAT_S;
    const chord = zeros0(Math.round(4 * BEAT_S * SR));
    for (const n of CHORDS[bar].triad) {
      const f = NOTE[n] ?? NOTE.A3;
      const v = classicWave('saw', f, 4 * BEAT_S);
      const v2 = classicWave('saw', f * 1.005, 4 * BEAT_S); // slow detune shimmer
      for (let i = 0; i < chord.length; i++) chord[i] += (v[i] + v2[i]) / (2 * CHORDS[bar].triad.length);
    }
    place(out, fadeEdges(attack(applyBiquad(chord, lowpass(1800, 0.7)), 0.12), 20), t0, 0.8);
  }
  return out;
}

/** Lead line — the vocal's synth stand-in (labeled honestly on-screen). */
function synthLead(): Mono {
  const out = zeros();
  // One phrase per bar, call-and-answer: A C B A | F A G F | E G E C | G B A G
  const phrases = [
    ['A4', 'C5', 'B4', 'A4'], ['F4', 'A4', 'G4', 'F4'], ['E4', 'G4', 'E4', 'C4'], ['G4', 'B4', 'A4', 'G4'],
  ];
  for (let bar = 0; bar < BARS; bar++) {
    const t0 = bar * 4 * BEAT_S;
    phrases[bar].forEach((n, i) => {
      const f = NOTE[n];
      const len = i === 3 ? 1.4 * BEAT_S : 0.75 * BEAT_S;
      const nSamp = Math.round(len * SR);
      const x = new Float32Array(nSamp);
      let phase = 0;
      for (let s = 0; s < nSamp; s++) {
        const vib = 1 + 0.006 * Math.sin((2 * Math.PI * 5.2 * s) / SR); // gentle vibrato
        phase += (2 * Math.PI * f * vib) / SR;
        x[s] = Math.sin(phase) * 0.7 + Math.sin(2 * phase) * 0.22 + Math.sin(3 * phase) * 0.08;
      }
      place(out, fadeEdges(attack(decay(x, len * 0.9), 0.02), 8), t0 + i * BEAT_S, 0.85);
    });
  }
  return applyBiquad(out, peakEq(2600, 2.5, 1.1)); // presence
}

/** Backing pad — stand-in for backing vocals: soft sustained thirds. */
function synthBgv(): Mono {
  const out = zeros();
  for (let bar = 0; bar < BARS; bar++) {
    const t0 = bar * 4 * BEAT_S;
    const [a, b] = [CHORDS[bar].triad[1], CHORDS[bar].triad[2]];
    const chord = zeros0(Math.round(4 * BEAT_S * SR));
    for (const n of [a, b]) {
      const f = NOTE[n] ?? NOTE.C4;
      const v = sine(f, 4 * BEAT_S);
      const v2 = sine(f * 1.007, 4 * BEAT_S);
      for (let i = 0; i < chord.length; i++) chord[i] += (v[i] * 0.6 + v2[i] * 0.4) / 2;
    }
    place(out, fadeEdges(attack(applyBiquad(chord, lowpass(2400, 0.7)), 0.25), 30), t0, 0.55);
  }
  return out;
}

/* ── stem cache ──────────────────────────────────────────────────────────── */

/** The eight rendered stems, memoized.
 *
 *  NOT a growing cache (memory review 2026-09-11): the key space is the eight
 *  fixed TRACK_IDS, so the high-water mark is a CONSTANT
 *  8 × LOOP_S × SR × 4 B = 8 × 10 s × 48 kHz × 4 B ≈ 15.4 MB. Nothing
 *  accumulates, so an LRU or byte cap would have nothing to evict — the bound
 *  is structural.
 *
 *  It lives for as long as a mixing lab is on screen and is dropped when the
 *  last one leaves (owner ruling 2026-09-11) — see retainSessionStems below,
 *  which both lab screens hold.
 *
 *  It used to be resident for the life of the process, and that was forced
 *  rather than chosen: cold sessionStems() measured 7.1 s of blocked JS,
 *  because earDsp.classicWave summed every partial for every sample — a 65 Hz
 *  bass root is 366 of them across 480 k samples — so releasing on unmount
 *  would have turned every RE-entry into the same long "RENDERING…" wait as the
 *  first. The wavetable rewrite of classicWave brought the same cold render to
 *  ~350 ms on desktop V8 (renderMix() off the warm cache is ~25 ms for
 *  comparison). Hermes has no JIT, so budget several times that on the phone —
 *  still well inside the rendering state the lab already shows, and it is paid
 *  on the next PLAY rather than on entry, because nothing synthesizes until the
 *  learner presses something. */
let stemsCache: Record<TrackId, Mono> | null = null;

/** Render (once) and return the eight session stems, RMS-aligned to −20 dB so
 *  "every fader at 0" is the honest unmixed wall the static-mix page starts
 *  from. Deterministic: same on every device, pinned by the test suite. */
export function sessionStems(): Record<TrackId, Mono> {
  if (stemsCache) return stemsCache;
  const rng = makeRng(20260911);
  const raw: Record<TrackId, Mono> = {
    kick: synthKick(),
    snare: synthSnare(rng),
    perc: synthPerc(rng),
    bass: synthBass(),
    gtr: synthGtr(),
    keys: synthKeys(),
    lead: synthLead(),
    bgv: synthBgv(),
  };
  for (const id of TRACK_IDS) {
    let x = dspGainDb(raw[id], -20 - rmsDb(raw[id]));
    // Peak-safe: spiky stems (snare crest factor) may exceed unity at −20 dB
    // RMS — cap the peak at 0.95 and accept the lower loudness honestly.
    let peak = 0;
    for (let i = 0; i < x.length; i++) if (Math.abs(x[i]) > peak) peak = Math.abs(x[i]);
    if (peak > 0.95) x = dspGainDb(x, 20 * Math.log10(0.95 / peak));
    raw[id] = x;
  }
  stemsCache = raw;
  return raw;
}

/** Drop the memoized stems (~15.4 MB of Float32Array). Wired to the mixing lab
 *  screens through retainSessionStems() below — call this directly only from a
 *  test or a deliberate one-off.
 *
 *  Safe to call at ANY time, because nothing outside this module ever retains a
 *  stem buffer:
 *   • renderMix() is the only consumer. It reads `stems[id]` (or a
 *     `.subarray(0, n)` VIEW of it) inside one synchronous pass and sums the
 *     samples into freshly allocated L/R arrays; `RenderedMix.stereo` is always
 *     those new arrays, never the cached buffer or a view of it.
 *   • renderMix() is synchronous end to end, so a release can never interleave
 *     with a render in progress on JS's single thread.
 *   • The playback chain downstream (EarClipPlayer.load) receives
 *     `mix.stereo`, i.e. the rendered sum — it never sees a stem.
 *  Re-synthesis after a release is byte-identical: sessionStems() seeds its own
 *  makeRng(20260911) on every call, so nothing the learner hears or that the
 *  test suite pins changes — only the timing of the (one-off) synthesis. */
export function releaseSessionStems(): void {
  stemsCache = null;
}

/** How many mixing-lab screens are currently mounted. See retainSessionStems. */
let stemHolders = 0;

/**
 * Hold the stems for as long as a mixing lab is on screen, and drop them when
 * the last one leaves. Call on mount, call the returned function on unmount:
 *
 *     useEffect(retainSessionStems, []);
 *
 * WHY A COUNT AND NOT JUST A RELEASE ON UNMOUNT. There is ONE cache and TWO
 * screens (Beginning and Advanced). A bare release would let either screen's
 * exit throw away stems the OTHER one is still using, so leaving one lab would
 * silently cost the other a full re-render on its next play. That is only
 * reachable if both are on the stack at once, which today's navigation does not
 * do — but the failure would be a mystery stall in a screen the user never
 * left, and the counter costs eight lines.
 *
 * SAFE AGAINST AN IN-FLIGHT RENDER, and this is the part worth checking before
 * trusting it: the lab's renderAll() is async and breathes between variants, so
 * a release genuinely CAN land mid-render. It cannot do damage, on two counts.
 * Every await in that loop is followed immediately by its liveness guard, so a
 * resumption after an unmount returns before it can reach renderMix() again.
 * And renderMix() itself is synchronous and copies what it needs into freshly
 * allocated output, so even a release between two renders only means the next
 * sessionStems() re-synthesizes — never that a live render loses its buffers.
 *
 * The re-render is byte-identical (sessionStems re-seeds makeRng(20260911) on
 * every call) and cost ~350 ms on desktop V8 after the 2026-09-11 wavetable
 * rewrite of earDsp.classicWave. Before that it was 7.1 s, which is why this
 * was not wired until the owner asked for it.
 */
export function retainSessionStems(): () => void {
  stemHolders++;
  let released = false;
  return () => {
    // Idempotent: React may run a cleanup more than once (StrictMode's
    // mount/unmount/mount in development), and a double decrement would drop
    // the count below the number of live screens.
    if (released) return;
    released = true;
    stemHolders = Math.max(0, stemHolders - 1);
    if (stemHolders === 0) releaseSessionStems();
  };
}

/* ── the mix renderer ────────────────────────────────────────────────────── */

export interface TrackSettings {
  faderDb: number; // −60…+12; −60 treated as −∞
  pan: number; // −100…+100
  mute: boolean;
  polarity: boolean; // true = inverted (Ø)
  clipGainDb: number;
  /** Optional high-pass (sections 6/8): 0/undefined = off. */
  hpHz?: number;
  /** Optional corrective peak cut/boost (section 8): one band. */
  eq?: { hz: number; gainDb: number; q?: number };
  /** Optional insert compressor (section 9) — earDsp's envelope model.
   *  AML extensions (2026-09-11): `sidechainFrom` keys the envelope from
   *  ANOTHER track's audio (ducking — deliberately NOT loudness-matched, the
   *  dip is the point); `parallelBlendDb` mixes the compressed copy under
   *  the untouched dry path (New-York style) instead of replacing it. */
  comp?: {
    thresholdDb: number;
    ratio: number;
    attackMs: number;
    releaseMs: number;
    makeupDb?: number;
    sidechainFrom?: TrackId;
    parallelBlendDb?: number;
  };
  /** Send level (dB) into the SHARED reverb return (section 10); undefined =
   *  no send. Post-fader, like a default DAW send. */
  verbSendDb?: number;
  /** Verse→chorus volume ride (section 12): dB offsets for each half of the
   *  loop (bars 1–2 = "verse", bars 3–4 = "chorus"), 60 ms crossfade. */
  auto?: { verseDb: number; chorusDb: number };
}

/** The shared ambience return (section 10): one reverb everyone sends into. */
export interface SharedVerb {
  space: ReverbSpace;
  returnDb: number;
}

export type MixSettings = Partial<Record<TrackId, Partial<TrackSettings>>>;

export const FLAT: TrackSettings = { faderDb: 0, pan: 0, mute: false, polarity: false, clipGainDb: 0 };

const db2lin = (db: number) => Math.pow(10, db / 20);

export interface RenderedMix {
  stereo: Stereo;
  peakDb: number;
  rmsDb: number;
}

/** Sidechain compressor: earDsp's envelope model, but the gain computer
 *  listens to `key` while the gain applies to `x`. NO loudness matching —
 *  ducking's audible dip is the lesson (unlike the insert compressor, which
 *  earDsp deliberately RMS-matches). */
function compressKeyed(x: Mono, key: Mono, ratio: number, thresholdDb: number, attackMs: number, releaseMs: number): Mono {
  const out = new Float32Array(x.length);
  const atk = Math.exp(-1 / ((attackMs / 1000) * SR));
  const rel = Math.exp(-1 / ((releaseMs / 1000) * SR));
  let env = 0;
  for (let i = 0; i < x.length; i++) {
    const a = Math.abs(key[i] ?? 0);
    env = a > env ? atk * env + (1 - atk) * a : rel * env + (1 - rel) * a;
    const envDb = 20 * Math.log10(Math.max(env, 1e-9));
    const over = envDb - thresholdDb;
    const g = over > 0 ? Math.pow(10, (-over * (1 - 1 / ratio)) / 20) : 1;
    out[i] = x[i] * g;
  }
  return out;
}

/** The verse→chorus ride curve: bars 1–2 at verseDb, bars 3–4 at chorusDb,
 *  60 ms crossfade at the boundary. Applied in place. */
function applyRide(x: Mono, verseDb: number, chorusDb: number): Mono {
  const split = Math.round((LOOP_S / 2) * SR);
  const fade = Math.round(0.06 * SR);
  const gv = db2lin(verseDb);
  const gc = db2lin(chorusDb);
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    const t = i < split - fade ? 0 : i >= split ? 1 : (i - (split - fade)) / fade;
    out[i] = x[i] * (gv + (gc - gv) * t);
  }
  return out;
}

/** Sum the session through the learner's settings — REAL gain math, the same
 *  channel model the routing engine describes. The signal order per channel is
 *  the lab's own lesson: clip gain → inserts (HP → EQ → comp) → fader ride →
 *  pan → sum; post-fader sends feed ONE shared reverb return (section 10).
 *  `masterDb` trims the mix bus. */
export function renderMix(
  settings: MixSettings,
  masterDb = 0,
  opts?: {
    mono?: boolean;
    sharedVerb?: SharedVerb;
    /** Post-sum M/S width: 0 = mono, 1 = as mixed, >1 = wider (AML imaging). */
    masterWidth?: number;
    /** Stereo-LINKED bus compressor on the summed mix (AML): one gain
     *  computer fed by max(|L|,|R|) drives both channels — the shared
     *  envelope that makes bus compression "glue" (and that per-track
     *  compression cannot reproduce). No auto-matching; use matchTo. */
    busComp?: { thresholdDb: number; ratio: number; attackMs: number; releaseMs: number };
    /** Soft saturation on the summed mix (AML harmonic pages), drive in dB. */
    busDriveDb?: number;
    /** Render only the first `seconds` of the loop. MEASUREMENT-ONLY escape
     *  hatch: the AML null test renders FOUR mixes back to back, and on a
     *  phone four full 10 s renders in one JS tick froze the app (owner
     *  device report 2026-09-11). Residue/null math is a per-sample
     *  property, so a shorter window proves it identically. Playback
     *  variants never pass this — the audible loop stays 10 s. */
    seconds?: number;
  },
): RenderedMix {
  const n = opts?.seconds ? Math.max(1, Math.min(N, Math.round(opts.seconds * SR))) : N;
  const stems = sessionStems();
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const verbBus = opts?.sharedVerb ? new Float32Array(n) : null;
  for (const id of TRACK_IDS) {
    const s = { ...FLAT, ...(settings[id] ?? {}) };
    if (s.mute || s.faderDb <= -60) continue;
    let x: Mono = n === N ? stems[id] : stems[id].subarray(0, n);
    // Inserts, in channel order.
    if (s.clipGainDb) x = dspGainDb(x, s.clipGainDb);
    if (s.hpHz && s.hpHz > 0) x = applyBiquad(x, highpass(s.hpHz, 0.71));
    if (s.eq) x = applyBiquad(x, peakEq(s.eq.hz, s.eq.gainDb, s.eq.q ?? 1.4));
    if (s.comp) {
      const dry = s.comp.parallelBlendDb != null ? x : null;
      if (s.comp.sidechainFrom) {
        x = compressKeyed(x, stems[s.comp.sidechainFrom], s.comp.ratio, s.comp.thresholdDb, s.comp.attackMs, s.comp.releaseMs);
      } else {
        x = compress(x, s.comp.ratio, s.comp.thresholdDb, s.comp.attackMs, s.comp.releaseMs);
      }
      if (s.comp.makeupDb) x = dspGainDb(x, s.comp.makeupDb);
      if (dry) {
        // Parallel: dry stays whole; the squashed copy rides underneath.
        const wet = dspGainDb(x, s.comp.parallelBlendDb!);
        const mixed = new Float32Array(dry.length);
        for (let i = 0; i < dry.length; i++) mixed[i] = dry[i] + wet[i];
        x = mixed;
      }
    }
    // Fader (+ ride), then the post-fader world: pan and sends.
    if (s.auto) x = applyRide(x, s.auto.verseDb, s.auto.chorusDb);
    const g = db2lin(s.faderDb) * (s.polarity ? -1 : 1);
    const p = Math.max(-100, Math.min(100, s.pan)) / 100;
    const a = ((p + 1) / 2) * (Math.PI / 2);
    const gl = Math.cos(a) * Math.SQRT2 * 0.5 * g;
    const gr = Math.sin(a) * Math.SQRT2 * 0.5 * g;
    for (let i = 0; i < n; i++) {
      L[i] += x[i] * gl;
      R[i] += x[i] * gr;
    }
    if (verbBus && s.verbSendDb != null) {
      const sg = db2lin(s.faderDb + s.verbSendDb) * (s.polarity ? -1 : 1);
      for (let i = 0; i < n; i++) verbBus[i] += x[i] * sg;
    }
  }
  if (verbBus && opts?.sharedVerb) {
    // ONE shared ambience: everyone's sends through the same space — the
    // "one room glues the band" lesson. 100% wet on the return.
    const wet = dspGainDb(reverb(verbBus, opts.sharedVerb.space, undefined, 0.5, 1), opts.sharedVerb.returnDb);
    for (let i = 0; i < n; i++) {
      L[i] += wet[i] * 0.5;
      R[i] += wet[i] * 0.5;
    }
  }
  if (opts?.busComp) {
    const { thresholdDb, ratio, attackMs, releaseMs } = opts.busComp;
    const atk = Math.exp(-1 / ((attackMs / 1000) * SR));
    const rel = Math.exp(-1 / ((releaseMs / 1000) * SR));
    let env = 0;
    for (let i = 0; i < n; i++) {
      const a = Math.max(Math.abs(L[i]), Math.abs(R[i]));
      env = a > env ? atk * env + (1 - atk) * a : rel * env + (1 - rel) * a;
      const envDb = 20 * Math.log10(Math.max(env, 1e-9));
      const over = envDb - thresholdDb;
      const g = over > 0 ? Math.pow(10, (-over * (1 - 1 / ratio)) / 20) : 1;
      L[i] *= g;
      R[i] *= g;
    }
  }
  if (opts?.busDriveDb != null && opts.busDriveDb !== 0) {
    // tanh soft clip with drive, unity small-signal gain (÷d) — colour and
    // peak taming, not a level change.
    const d = db2lin(opts.busDriveDb);
    for (let i = 0; i < n; i++) {
      L[i] = Math.tanh(L[i] * d) / d;
      R[i] = Math.tanh(R[i] * d) / d;
    }
  }
  if (opts?.masterWidth != null && opts.masterWidth !== 1) {
    // M/S width on the summed bus: S scaled, M untouched — the imaging pages'
    // truth (width 0 collapses to mono; wide S dies in a mono fold).
    const w = Math.max(0, opts.masterWidth);
    for (let i = 0; i < n; i++) {
      const m = (L[i] + R[i]) / 2;
      const sd = ((L[i] - R[i]) / 2) * w;
      L[i] = m + sd;
      R[i] = m - sd;
    }
  }
  const mg = db2lin(masterDb);
  let peak = 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    L[i] *= mg;
    R[i] *= mg;
    if (opts?.mono) {
      const m = (L[i] + R[i]) / 2;
      L[i] = m;
      R[i] = m;
    }
    const aL = Math.abs(L[i]);
    const aR = Math.abs(R[i]);
    if (aL > peak) peak = aL;
    if (aR > peak) peak = aR;
    sum += L[i] * L[i] + R[i] * R[i];
  }
  return {
    stereo: { l: L, r: R },
    peakDb: 20 * Math.log10(Math.max(peak, 1e-9)),
    rmsDb: 10 * Math.log10(Math.max(sum / (2 * n), 1e-18)),
  };
}

/** Gain (dB) to apply to B so it plays at A's loudness — the level-matched
 *  comparison rule (§ honesty: never A/B at different loudness). */
export function matchGainDb(a: RenderedMix, b: RenderedMix): number {
  return a.rmsDb - b.rmsDb;
}
