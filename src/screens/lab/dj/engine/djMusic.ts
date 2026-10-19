/**
 * djMusic — the DJ Systems Lab's ORIGINAL practice music, synthesised in the
 * app (no recordings exist; owner brief 2026-10-18). Pure TypeScript, no
 * React Native; deterministic (seeded), so every learner hears the same
 * tracks and test/djMusic.test.ts can pin them.
 *
 * THREE TRACKS, each 72 bars of 4/4 in 8-bar phrases:
 *
 *   NIGHT FERRY   122 BPM · A minor · house — a quiet, dynamic master
 *                 (peaks −6 dBFS): offbeat bass, electric-piano stabs, a
 *                 pentatonic hook in the drop.
 *   GLASS HARBOUR 126 BPM · D minor · deep house — a LOUD master (peaks
 *                 −0.3 dBFS, soft-clipped), rolling 16th bass, side-chained
 *                 pads, a plucked arpeggio. Its file starts with 0.38 s of
 *                 silence before beat 1, so first-beat placement is real.
 *   SLOW ORBIT    100 BPM · E minor · downtempo broken beat — the TEMPO
 *                 CONTRAST: 22 % slower than Night Ferry, outside a ±8 %
 *                 tempo fader.
 *
 * ARRANGEMENT (bar numbers 1-based, the same map for every track):
 *   1–8 INTRO (drums) · 9–16 INTRO + bass · 17–32 MAIN · 33–40 BREAKDOWN
 *   (no kick; the riser builds over 39–40) · 41–56 DROP (everything + the
 *   hook) · 57–72 OUTRO: 16 bars that mirror the intro — 57–64 drums + bass,
 *   65–72 DRUMS ONLY (thinning to kick and hats from 69), so a mix out has
 *   room (audio review 2026-10-18 #17). Phrase starts: 1, 9, 17, 25, 33, 41,
 *   49, 57, 65 — the places a DJ starts and ends a blend. A crash marks the
 *   "one" of bars 17, 41 and 57; a tom fill ends bars 16, 32, 48, 56 and 64.
 *
 * THE ENGINE IS A SEQUENCER. Each part is a bank of short one-shot clips
 * (a kick, a hat, one bass note, one chord stab …) synthesised once per
 * track and cached; a bar is a list of EVENTS (clip, beat, gain, pan). Any
 * window of track time is assembled by placing the events that overlap it,
 * so a deck can start anywhere, loop, jump and change tempo with no
 * pre-rendered track in memory. The four STEMS (drums, bass, chords, lead)
 * are summed separately inside the engine and are available to later
 * lessons.
 *
 * MASTER of each track: sum → ÷ raw peak → (loud track: tanh soft clip) →
 * × target peak. tanh is monotonic, so the post-master peak is EXACTLY the
 * target and the overview's min/max map through the same function — the
 * waveform is the real audio's min/max, never a drawing of one.
 */
import { SR, addSaw, addSine, addSquare, biquadInPlace, bqState, rng, svfBandpassInPlace, svfLowpassInPlace } from './djDsp.ts';
import { rbj } from '../../../../features/ear/earDsp.ts';
import { BEATS_PER_BAR, type Grid } from '../model/djTime.ts';
import { TRACK_DATA } from './djTrackData.ts';

export type TrackId = 'nightFerry' | 'glassHarbour' | 'slowOrbit';
export const TRACK_IDS: readonly TrackId[] = ['nightFerry', 'glassHarbour', 'slowOrbit'];
export type StemId = 'drums' | 'bass' | 'chords' | 'lead';
export const STEM_IDS: readonly StemId[] = ['drums', 'bass', 'chords', 'lead'];

export type SectionName = 'INTRO' | 'MAIN' | 'BREAKDOWN' | 'DROP' | 'OUTRO';
export type Section = { name: SectionName; startBar: number; bars: number };

/** 0-based bar ranges. */
export const SECTIONS: readonly Section[] = [
  { name: 'INTRO', startBar: 0, bars: 16 },
  { name: 'MAIN', startBar: 16, bars: 16 },
  { name: 'BREAKDOWN', startBar: 32, bars: 8 },
  { name: 'DROP', startBar: 40, bars: 16 },
  { name: 'OUTRO', startBar: 56, bars: 16 },
];
export const TRACK_BARS = 72;
/** 0-based bar where the outro drops to DRUMS ONLY (bass and music out). */
export const OUTRO_DRUMS_ONLY = 64;
/** 0-based bar where the drums-only outro thins to kick and hats. */
export const OUTRO_THIN = 68;

export type TrackDef = {
  id: TrackId;
  title: string;
  /** Practice-track credit line (the lab's own music). */
  artist: string;
  style: string;
  bpm: number;
  key: string;
  /** Silence before beat 1 in the file. */
  leadInSec: number;
  /** The master's peak, dBFS. */
  peakDb: number;
  /** Soft-clip drive of a loud master (0 = none). */
  drive: number;
};

export const TRACKS: Record<TrackId, TrackDef> = {
  nightFerry: { id: 'nightFerry', title: 'Night Ferry', artist: 'AP&E practice track', style: 'House', bpm: 122, key: 'A minor', leadInSec: 0.12, peakDb: -6, drive: 0 },
  glassHarbour: { id: 'glassHarbour', title: 'Glass Harbour', artist: 'AP&E practice track', style: 'Deep house', bpm: 126, key: 'D minor', leadInSec: 0.38, peakDb: -0.3, drive: 1.4 },
  slowOrbit: { id: 'slowOrbit', title: 'Slow Orbit', artist: 'AP&E practice track', style: 'Downtempo', bpm: 100, key: 'E minor', leadInSec: 0.05, peakDb: -3, drive: 0 },
};

/** The TRUE grid: where the synthesiser put the beats. */
export const trueGrid = (id: TrackId): Grid => ({ bpm: TRACKS[id].bpm, firstBeatSec: TRACKS[id].leadInSec });

export const barSec = (id: TrackId): number => (BEATS_PER_BAR * 60) / TRACKS[id].bpm;
/** The whole file's length (lead-in + 72 bars + a 1 s tail). */
export const trackSeconds = (id: TrackId): number => TRACKS[id].leadInSec + TRACK_BARS * barSec(id) + 1;

export function sectionAtBar(bar0: number): Section {
  for (const s of SECTIONS) if (bar0 >= s.startBar && bar0 < s.startBar + s.bars) return s;
  return SECTIONS[SECTIONS.length - 1];
}

/* ── clips ────────────────────────────────────────────────────────────── */

/** A one-shot: mono (r undefined → panned at placement) or stereo. */
export type Clip = { l: Float32Array; r?: Float32Array };

const midiHz = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);
const cents = (c: number): number => Math.pow(2, c / 1200);

function env(n: number, f: (t: number) => number): Float32Array {
  const e = new Float32Array(n);
  for (let i = 0; i < n; i++) e[i] = f(i / SR);
  return e;
}
function mulInPlace(x: Float32Array, e: Float32Array): void {
  for (let i = 0; i < x.length; i++) x[i] *= e[i];
}
function noise(n: number, seed: number): Float32Array {
  const r = rng(seed);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = r() * 2 - 1;
  return x;
}
function hp(x: Float32Array, hz: number, q = 0.707): void {
  biquadInPlace(x, rbj(hz, q, 0, 'highpass'), bqState());
}
function softSat(x: Float32Array, drive: number): void {
  const k = Math.tanh(drive);
  for (let i = 0; i < x.length; i++) x[i] = Math.tanh(drive * x[i]) / k;
}
/** A short linear fade at the end, so no clip ends on a click. */
function tailFade(x: Float32Array, ms = 6): void {
  const n = Math.min(x.length, Math.round((ms / 1000) * SR));
  for (let i = 0; i < n; i++) x[x.length - 1 - i] *= i / n;
}

/** Kick: a pitch-swept sine body + a short click, gently saturated. */
function kickClip(fStart: number, fEnd: number, decay: number): Clip {
  const n = Math.round(0.5 * SR);
  const x = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = fEnd + (fStart - fEnd) * Math.exp(-t / 0.032);
    ph += (2 * Math.PI * f) / SR;
    const a = t < 0.008 ? 1 : Math.exp(-(t - 0.008) / decay);
    x[i] = Math.sin(ph) * a;
  }
  const click = noise(Math.round(0.004 * SR), 11);
  hp(click, 2500);
  for (let i = 0; i < click.length; i++) x[i] += click[i] * 0.35 * (1 - i / click.length);
  softSat(x, 1.6);
  tailFade(x);
  return { l: x };
}

/** Clap: four noise bursts and a short tail through a band-pass. */
function clapClip(seed: number): Clip {
  const n = Math.round(0.42 * SR);
  const mk = (s: number) => {
    const x = noise(n, s);
    svfBandpassInPlace(x, () => 1900, 0.8);
    hp(x, 700);
    const bursts = [0, 0.009, 0.018, 0.029];
    const e = env(n, (t) => {
      let a = 0;
      for (const b of bursts) if (t >= b) a = Math.max(a, Math.exp(-(t - b) / 0.0045));
      if (t >= 0.029) a = Math.max(a, 0.55 * Math.exp(-(t - 0.029) / 0.085));
      return a;
    });
    mulInPlace(x, e);
    tailFade(x);
    return x;
  };
  return { l: mk(seed), r: mk(seed + 7) };
}

/** Metallic hat source: six square partials (the classic drum-machine
 *  cluster) plus noise, high-passed. */
function hatSource(n: number, seed: number, base = 1.7): Float32Array {
  const x = noise(n, seed);
  for (let i = 0; i < n; i++) x[i] *= 0.55;
  for (const f of [205.3, 304.4, 369.6, 522.7, 540.0, 800.0]) addSquare(x, f * base, 0.09);
  hp(x, 5200);
  hp(x, 6800);
  return x;
}
function hatClip(open: boolean, seed: number): Clip {
  const n = Math.round((open ? 0.42 : 0.09) * SR);
  const x = hatSource(n, seed);
  mulInPlace(x, env(n, (t) => Math.min(1, t / 0.0008) * Math.exp(-t / (open ? 0.12 : 0.017))));
  tailFade(x);
  return { l: x };
}
function rideClip(seed: number): Clip {
  const n = Math.round(0.9 * SR);
  const x = noise(n, seed);
  for (let i = 0; i < n; i++) x[i] *= 0.3;
  for (const f of [412, 607, 861, 1055, 1384, 2210]) addSine(x, f * 2, 0.12);
  hp(x, 3200);
  mulInPlace(x, env(n, (t) => Math.min(1, t / 0.001) * (0.35 * Math.exp(-t / 0.02) + 0.65 * Math.exp(-t / 0.38))));
  tailFade(x);
  return { l: x };
}
function shakerClip(seed: number): Clip {
  const n = Math.round(0.12 * SR);
  const x = noise(n, seed);
  svfBandpassInPlace(x, () => 6200, 1.4);
  mulInPlace(x, env(n, (t) => Math.min(1, t / 0.007) * Math.exp(-t / 0.034)));
  tailFade(x);
  return { l: x };
}
function crashClip(seed: number): Clip {
  const n = Math.round(2.2 * SR);
  const mk = (s: number) => {
    const x = noise(n, s);
    for (const f of [520, 790, 1130, 1660, 2380, 3170]) addSine(x, f, 0.06);
    hp(x, 3000);
    mulInPlace(x, env(n, (t) => Math.min(1, t / 0.002) * Math.exp(-t / 0.95)));
    tailFade(x, 30);
    return x;
  };
  return { l: mk(seed), r: mk(seed + 3) };
}
/** A tuned tom for the phrase-end fills. */
function tomClip(hz: number): Clip {
  const n = Math.round(0.32 * SR);
  const x = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * hz * (1 + 0.5 * Math.exp(-t / 0.03))) / SR;
    x[i] = Math.sin(ph) * Math.exp(-t / 0.16);
  }
  softSat(x, 1.3);
  tailFade(x);
  return { l: x };
}
/** The breakdown riser: noise through a band-pass sweeping up over `sec`. */
function riserClip(sec: number, seed: number): Clip {
  const n = Math.round(sec * SR);
  const mk = (s: number) => {
    const x = noise(n, s);
    svfBandpassInPlace(x, (i) => 300 * Math.pow(9000 / 300, i / n), 2.2);
    mulInPlace(x, env(n, (t) => Math.pow(t / sec, 2)));
    tailFade(x, 12);
    return x;
  };
  return { l: mk(seed), r: mk(seed + 5) };
}

/** Bass note: two detuned saws + a sub sine, a plucked low-pass envelope. */
function bassClip(midi: number, lenSec: number, bright: number, decay: number): Clip {
  const n = Math.round((lenSec + 0.03) * SR);
  const f = midiHz(midi);
  const x = new Float32Array(n);
  addSaw(x, f * cents(-7), 0.42);
  addSaw(x, f * cents(7), 0.42, 0.37);
  addSine(x, f, 0.55);
  svfLowpassInPlace(x, (i) => 150 + bright * Math.exp(-i / SR / decay), 1.05);
  const rel = Math.round(0.025 * SR);
  const g = Math.round(lenSec * SR);
  mulInPlace(x, env(n, (t) => Math.min(1, t / 0.002)));
  for (let i = g; i < n; i++) x[i] *= Math.max(0, 1 - (i - g) / rel);
  softSat(x, 1.25);
  tailFade(x, 3);
  return { l: x };
}

/** Electric-piano voice (two-operator FM with a "tine"), one note. */
function epNote(out: Float32Array, midi: number, gate: number, amp: number, release: number): void {
  const f = midiHz(midi);
  const w = 2 * Math.PI * f;
  const n = out.length;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const idx = 2.6 * Math.exp(-t / 0.22);
    const a = Math.min(1, t / 0.003) * Math.exp(-t / 1.1) * (t > gate ? Math.exp(-(t - gate) / release) : 1);
    const tine = 0.12 * Math.sin(14 * w * t) * Math.exp(-t / 0.03);
    out[i] += amp * a * (Math.sin(w * t + idx * Math.sin(w * t)) + tine);
  }
}
function stabClip(notes: readonly number[], gateSec: number, seed: number): Clip {
  const n = Math.round((gateSec + 0.42) * SR);
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  notes.forEach((m, k) => {
    const v = new Float32Array(n);
    epNote(v, m, gateSec, 0.32, 0.09);
    const p = notes.length > 1 ? -0.35 + (0.7 * k) / (notes.length - 1) : 0;
    const gl = Math.cos(((p + 1) * Math.PI) / 4);
    const gr = Math.sin(((p + 1) * Math.PI) / 4);
    for (let i = 0; i < n; i++) {
      l[i] += v[i] * gl;
      r[i] += v[i] * gr;
    }
  });
  void seed;
  tailFade(l);
  tailFade(r);
  return { l, r };
}
/** Pad chord: three detuned saws per note, a slow-moving low-pass, wide. */
function padClip(notes: readonly number[], lenSec: number, cutoff: number): Clip {
  const n = Math.round((lenSec + 0.6) * SR);
  const mk = (detunes: number[], phase: number) => {
    const x = new Float32Array(n);
    notes.forEach((m, k) => {
      for (const d of detunes) addSaw(x, midiHz(m) * cents(d), 0.075, phase + k * 0.21 + d * 0.01);
    });
    svfLowpassInPlace(x, (i) => cutoff + 0.45 * cutoff * Math.sin((2 * Math.PI * 0.18 * i) / SR + phase), 0.85);
    mulInPlace(x, env(n, (t) => Math.min(1, t / 0.32) * (t > lenSec ? Math.exp(-(t - lenSec) / 0.22) : 1)));
    tailFade(x, 20);
    return x;
  };
  return { l: mk([-11, 0, 9], 0), r: mk([-8, 2, 12], 1.3) };
}
/** Lead pluck: saw + square through a fast low-pass envelope. */
function pluckClip(midi: number, bright: number, decay: number): Clip {
  const n = Math.round(0.62 * SR);
  const f = midiHz(midi);
  const x = new Float32Array(n);
  addSaw(x, f, 0.3);
  addSquare(x, f * cents(5), 0.12);
  svfLowpassInPlace(x, (i) => 450 + bright * Math.exp(-i / SR / 0.1), 1.5);
  mulInPlace(x, env(n, (t) => Math.min(1, t / 0.002) * Math.exp(-t / decay)));
  tailFade(x, 10);
  return { l: x };
}
/** A soft flute-like lead for the downtempo track. */
function fluteClip(midi: number, lenSec: number): Clip {
  const n = Math.round((lenSec + 0.25) * SR);
  const f = midiHz(midi);
  const x = new Float32Array(n);
  const breath = noise(n, midi);
  svfBandpassInPlace(breath, () => f * 2, 3);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const vib = 1 + 0.004 * Math.sin(2 * Math.PI * 5.2 * t) * Math.min(1, t / 0.4);
    x[i] = 0.32 * Math.sin(2 * Math.PI * f * vib * t) + 0.08 * Math.sin(4 * Math.PI * f * vib * t) + 0.05 * breath[i];
  }
  mulInPlace(x, env(n, (t) => Math.min(1, t / 0.06) * (t > lenSec ? Math.exp(-(t - lenSec) / 0.08) : 1)));
  tailFade(x, 10);
  return { l: x };
}

/* ── the songs: chords, parts, bar events ─────────────────────────────── */

export type Ev = { stem: StemId; clip: string; beat: number; gain: number; pan: number };

type Song = {
  /** One entry per bar of the 4-bar cycle. */
  roots: readonly number[];
  chords: readonly (readonly number[])[];
  /** The clip bank: each clip is built on first use (and by preloadBank). */
  bank: () => Record<string, () => Clip>;
  /** The events of 0-based bar `bar`. */
  events: (bar: number) => Ev[];
};

function nightFerrySong(): Song {
  const roots = [33, 29, 36, 31];
  const chords = [
    [57, 60, 64, 67],
    [57, 60, 64, 65],
    [55, 60, 62, 64],
    [55, 59, 62, 64],
  ];
  const hookA = [[76, 0, 0.5], [74, 0.75, 0.5], [72, 1.5, 0.5], [69, 2.25, 0.75], [72, 3, 0.5]] as const;
  const hookB = [[74, 0, 0.5], [76, 0.5, 0.5], [79, 1.5, 0.75], [76, 2.5, 0.5], [74, 3.25, 0.5]] as const;
  const hookC = [[74, 0, 0.5], [76, 0.5, 0.5], [72, 1.5, 0.75], [69, 2.5, 1]] as const;
  const bpm = 122;
  const beat = 60 / bpm;
  const bank = (): Record<string, () => Clip> => {
    const b: Record<string, () => Clip> = {
      kick: () => kickClip(135, 49, 0.27),
      clap: () => clapClip(21),
      hatC: () => hatClip(false, 31),
      hatO: () => hatClip(true, 37),
      shaker: () => shakerClip(41),
      crash: () => crashClip(51),
      tomH: () => tomClip(196),
      tomM: () => tomClip(147),
      tomL: () => tomClip(110),
      riser: () => riserClip(2 * 4 * beat, 61),
    };
    roots.forEach((r, k) => {
      b[`bass${k}`] = () => bassClip(r, 0.42 * beat, 1500, 0.07);
      b[`bassOct${k}`] = () => bassClip(r + 12, 0.24 * beat, 1700, 0.05);
      b[`bassFifth${k}`] = () => bassClip(r + 7, 0.2 * beat, 1500, 0.05);
      b[`stab${k}`] = () => stabClip(chords[k], 0.32 * beat, k);
      b[`pad${k}`] = () => padClip(chords[k].map((m) => m - 12).concat([chords[k][0]]), 4 * beat, 1100);
    });
    for (const m of new Set([...hookA, ...hookB, ...hookC].map((h) => h[0]))) b[`lead${m}`] = () => pluckClip(m, 3600, 0.34);
    return b;
  };
  const events = (bar: number): Ev[] => {
    const s = sectionAtBar(bar).name;
    const k = bar % 4;
    const ev: Ev[] = [];
    const kick = s !== 'BREAKDOWN';
    const fullDrums = s === 'MAIN' || s === 'DROP' || (s === 'INTRO' && bar >= 8) || (s === 'OUTRO' && bar < OUTRO_THIN);
    if (kick) for (let q = 0; q < 4; q++) ev.push({ stem: 'drums', clip: 'kick', beat: q, gain: 0.75, pan: 0 });
    if (fullDrums || s === 'BREAKDOWN') {
      if (s !== 'BREAKDOWN' || bar >= 36) for (const q of [1, 3]) ev.push({ stem: 'drums', clip: 'clap', beat: q, gain: s === 'BREAKDOWN' ? 0.5 : 0.75, pan: 0 });
    }
    for (let q = 0; q < 16; q++) {
      const accent = q % 2 === 0 ? 1.0 : 0.6;
      if (s !== 'BREAKDOWN' || bar >= 34) ev.push({ stem: 'drums', clip: 'hatC', beat: q / 4, gain: accent * (s === 'INTRO' && bar < 4 ? 0.6 : 1), pan: 0.12 });
      ev.push({ stem: 'drums', clip: 'shaker', beat: q / 4 + 0.01, gain: (q % 4 === 2 ? 0.55 : 0.32) * (s === 'BREAKDOWN' ? 0.6 : 1), pan: -0.25 });
    }
    if (fullDrums) for (const q of [0.5, 1.5, 2.5, 3.5]) ev.push({ stem: 'drums', clip: 'hatO', beat: q, gain: 0.62, pan: 0.18 });
    if (bar === 16 || bar === 40 || bar === 56) ev.push({ stem: 'drums', clip: 'crash', beat: 0, gain: 0.32, pan: 0 });
    if (bar === 15 || bar === 31 || bar === 47 || bar === 55 || bar === 63) {
      [['tomH', 3], ['tomH', 3.25], ['tomM', 3.5], ['tomL', 3.75]].forEach(([c, q]) => ev.push({ stem: 'drums', clip: c as string, beat: q as number, gain: 0.42, pan: c === 'tomH' ? 0.3 : c === 'tomL' ? -0.3 : 0 }));
    }
    if (bar === 38) ev.push({ stem: 'drums', clip: 'riser', beat: 0, gain: 0.3, pan: 0 });
    const bass = (s === 'INTRO' && bar >= 8) || s === 'MAIN' || s === 'DROP' || (s === 'OUTRO' && bar < OUTRO_DRUMS_ONLY);
    if (bass) {
      for (const q of [0.5, 1.5, 2.5]) ev.push({ stem: 'bass', clip: `bass${k}`, beat: q, gain: 0.8, pan: 0 });
      ev.push({ stem: 'bass', clip: `bassOct${k}`, beat: 3.5, gain: 0.62, pan: 0 });
      ev.push({ stem: 'bass', clip: `bassFifth${k}`, beat: 3.75, gain: 0.58, pan: 0 });
    }
    if (s === 'MAIN' || s === 'DROP') {
      ev.push({ stem: 'chords', clip: `stab${k}`, beat: 0.5, gain: 1.5, pan: 0 });
      ev.push({ stem: 'chords', clip: `stab${k}`, beat: 1.75, gain: 1.0, pan: 0 });
      ev.push({ stem: 'chords', clip: `stab${k}`, beat: 3, gain: 1.25, pan: 0 });
    }
    if (s === 'BREAKDOWN') ev.push({ stem: 'chords', clip: `pad${k}`, beat: 0, gain: 1.6, pan: 0 });
    if (s === 'DROP' || (s === 'BREAKDOWN' && bar >= 36)) {
      const hook = k === 0 || k === 2 ? hookA : k === 1 ? hookB : hookC;
      const g = s === 'BREAKDOWN' ? 0.75 : 0.9;
      for (const [m, q] of hook) {
        ev.push({ stem: 'lead', clip: `lead${m}`, beat: q, gain: g, pan: 0 });
        ev.push({ stem: 'lead', clip: `lead${m}`, beat: q + 0.75, gain: g * 0.36, pan: -0.55 });
        ev.push({ stem: 'lead', clip: `lead${m}`, beat: q + 1.5, gain: g * 0.14, pan: 0.55 });
      }
    }
    return ev;
  };
  return { roots, chords, bank, events };
}

function glassHarbourSong(): Song {
  const roots = [38, 34, 31, 33];
  const chords = [
    [53, 57, 60, 64],
    [53, 57, 60, 62],
    [53, 58, 62, 65],
    [55, 57, 62, 64],
  ];
  const bpm = 126;
  const beat = 60 / bpm;
  const arp = [0, 2, 1, 3, 2, 1, 3, 0];
  const bank = (): Record<string, () => Clip> => {
    const b: Record<string, () => Clip> = {
      kick: () => kickClip(158, 46, 0.3),
      clap: () => clapClip(121),
      hatC: () => hatClip(false, 131),
      ride: () => rideClip(137),
      shaker: () => shakerClip(141),
      crash: () => crashClip(151),
      tomH: () => tomClip(220),
      tomM: () => tomClip(165),
      tomL: () => tomClip(123),
      riser: () => riserClip(2 * 4 * beat, 161),
    };
    roots.forEach((r, k) => {
      b[`bass${k}`] = () => bassClip(r, 0.2 * beat, 900, 0.05);
      b[`bassOct${k}`] = () => bassClip(r + 12, 0.16 * beat, 1100, 0.04);
      b[`bassFifth${k}`] = () => bassClip(r + 7, 0.16 * beat, 900, 0.04);
      b[`pad${k}`] = () => padClip(chords[k], 4 * beat, 1500);
      chords[k].forEach((m) => {
        b[`arp${m + 12}`] = () => pluckClip(m + 12, 5200, 0.18);
      });
    });
    return b;
  };
  const events = (bar: number): Ev[] => {
    const s = sectionAtBar(bar).name;
    const k = bar % 4;
    const ev: Ev[] = [];
    const kick = s !== 'BREAKDOWN';
    if (kick) for (let q = 0; q < 4; q++) ev.push({ stem: 'drums', clip: 'kick', beat: q, gain: 0.8, pan: 0 });
    const full = s === 'MAIN' || s === 'DROP' || (s === 'INTRO' && bar >= 8) || (s === 'OUTRO' && bar < OUTRO_THIN);
    if (full || (s === 'BREAKDOWN' && bar >= 36)) for (const q of [1, 3]) ev.push({ stem: 'drums', clip: 'clap', beat: q, gain: 0.7, pan: 0 });
    for (let q = 0; q < 16; q++) {
      if (s !== 'BREAKDOWN') ev.push({ stem: 'drums', clip: 'hatC', beat: q / 4, gain: q % 2 === 1 ? 0.8 : 0.5, pan: -0.15 });
      if (full) ev.push({ stem: 'drums', clip: 'shaker', beat: q / 4 + 0.012, gain: q % 4 === 3 ? 0.48 : 0.27, pan: 0.3 });
    }
    if (s !== 'BREAKDOWN') for (const q of [0.5, 1.5, 2.5, 3.5]) ev.push({ stem: 'drums', clip: 'ride', beat: q, gain: 0.55, pan: 0.2 });
    if (bar === 16 || bar === 40 || bar === 56) ev.push({ stem: 'drums', clip: 'crash', beat: 0, gain: 0.3, pan: 0 });
    if (bar === 15 || bar === 31 || bar === 47 || bar === 55 || bar === 63) {
      [['tomH', 3], ['tomM', 3.25], ['tomM', 3.5], ['tomL', 3.75]].forEach(([c, q]) => ev.push({ stem: 'drums', clip: c as string, beat: q as number, gain: 0.4, pan: 0 }));
    }
    if (bar === 38) ev.push({ stem: 'drums', clip: 'riser', beat: 0, gain: 0.28, pan: 0 });
    const bass = (s === 'INTRO' && bar >= 8) || s === 'MAIN' || s === 'DROP' || (s === 'OUTRO' && bar < OUTRO_DRUMS_ONLY);
    if (bass) {
      for (const q of [0.5, 1.5, 2.5, 3.5]) {
        ev.push({ stem: 'bass', clip: `bass${k}`, beat: q, gain: 0.78, pan: 0 });
        ev.push({ stem: 'bass', clip: q === 3.5 ? `bassFifth${k}` : `bassOct${k}`, beat: q + 0.25, gain: 0.52, pan: 0 });
      }
    }
    if (s === 'MAIN' || s === 'DROP' || s === 'BREAKDOWN') ev.push({ stem: 'chords', clip: `pad${k}`, beat: 0, gain: s === 'BREAKDOWN' ? 1.15 : 0.92, pan: 0 });
    if (s === 'DROP' || (s === 'BREAKDOWN' && bar >= 34)) {
      const g = s === 'BREAKDOWN' ? 0.45 : 0.62;
      arp.forEach((ix, j) => {
        const m = chords[k][ix] + 12;
        ev.push({ stem: 'lead', clip: `arp${m}`, beat: j * 0.5, gain: g, pan: j % 2 === 0 ? -0.3 : 0.3 });
        ev.push({ stem: 'lead', clip: `arp${m}`, beat: j * 0.5 + 0.75, gain: g * 0.3, pan: j % 2 === 0 ? 0.5 : -0.5 });
      });
    }
    return ev;
  };
  return { roots, chords, bank, events };
}

function slowOrbitSong(): Song {
  const roots = [28, 36, 33, 35];
  const chords = [
    [55, 59, 62, 66],
    [55, 59, 62, 64],
    [55, 59, 60, 64],
    [57, 59, 64, 66],
  ];
  const bpm = 100;
  const beat = 60 / bpm;
  const melody = [[71, 0, 1.5], [74, 1.5, 1], [71, 2.5, 1.5], [69, 0, 1], [67, 1, 1], [66, 2, 2]] as const;
  const bank = (): Record<string, () => Clip> => {
    const b: Record<string, () => Clip> = {
      kick: () => kickClip(120, 52, 0.22),
      clap: () => clapClip(221),
      hatC: () => hatClip(false, 231),
      hatO: () => hatClip(true, 237),
      shaker: () => shakerClip(241),
      crash: () => crashClip(251),
      tomH: () => tomClip(185),
      tomM: () => tomClip(139),
      tomL: () => tomClip(104),
      riser: () => riserClip(2 * 4 * beat, 261),
    };
    roots.forEach((r, k) => {
      b[`bass${k}`] = () => bassClip(r + 12, 1.4 * beat, 700, 0.18);
      b[`bassFifth${k}`] = () => bassClip(r + 19, 0.9 * beat, 700, 0.14);
      b[`rhodes${k}`] = () => stabClip(chords[k], 1.7 * beat, k + 10);
      b[`pad${k}`] = () => padClip(chords[k], 4 * beat, 900);
    });
    for (const [m, , len] of melody) b[`flute${m}_${len}`] = () => fluteClip(m, len * beat);
    return b;
  };
  const events = (bar: number): Ev[] => {
    const s = sectionAtBar(bar).name;
    const k = bar % 4;
    const ev: Ev[] = [];
    const kick = s !== 'BREAKDOWN';
    if (kick) for (const q of [0, 1.75, 2.5]) ev.push({ stem: 'drums', clip: 'kick', beat: q, gain: q === 0 ? 0.9 : 0.72, pan: 0 });
    const full = s === 'MAIN' || s === 'DROP' || (s === 'INTRO' && bar >= 8) || (s === 'OUTRO' && bar < OUTRO_THIN);
    if (full) for (const q of [1, 3]) ev.push({ stem: 'drums', clip: 'clap', beat: q, gain: 0.75, pan: 0 });
    for (let q = 0; q < 8; q++) {
      const swing = q % 2 === 1 ? 0.08 : 0;
      if (s !== 'BREAKDOWN') ev.push({ stem: 'drums', clip: q === 7 ? 'hatO' : 'hatC', beat: q / 2 + swing, gain: q % 2 === 0 ? 0.8 : 0.55, pan: 0.15 });
      if (full) ev.push({ stem: 'drums', clip: 'shaker', beat: q / 2 + 0.25 + swing, gain: 0.3, pan: -0.3 });
    }
    if (bar === 16 || bar === 40 || bar === 56) ev.push({ stem: 'drums', clip: 'crash', beat: 0, gain: 0.3, pan: 0 });
    if (bar === 15 || bar === 31 || bar === 47 || bar === 55 || bar === 63) {
      [['tomH', 3], ['tomM', 3.33], ['tomL', 3.66]].forEach(([c, q]) => ev.push({ stem: 'drums', clip: c as string, beat: q as number, gain: 0.42, pan: 0 }));
    }
    if (bar === 38) ev.push({ stem: 'drums', clip: 'riser', beat: 0, gain: 0.26, pan: 0 });
    const bass = (s === 'INTRO' && bar >= 8) || s === 'MAIN' || s === 'DROP' || (s === 'OUTRO' && bar < OUTRO_DRUMS_ONLY);
    if (bass) {
      ev.push({ stem: 'bass', clip: `bass${k}`, beat: 0, gain: 0.6, pan: 0 });
      ev.push({ stem: 'bass', clip: `bassFifth${k}`, beat: 2.5, gain: 0.48, pan: 0 });
    }
    if (s === 'MAIN' || s === 'DROP') {
      ev.push({ stem: 'chords', clip: `rhodes${k}`, beat: 0, gain: 1.0, pan: 0 });
      ev.push({ stem: 'chords', clip: `rhodes${k}`, beat: 2.5, gain: 0.72, pan: 0 });
    }
    if (s === 'BREAKDOWN') ev.push({ stem: 'chords', clip: `pad${k}`, beat: 0, gain: 1.0, pan: 0 });
    if (s === 'DROP' || (s === 'BREAKDOWN' && bar >= 36)) {
      const half = bar % 2 === 0 ? melody.slice(0, 3) : melody.slice(3);
      for (const [m, q, len] of half) ev.push({ stem: 'lead', clip: `flute${m}_${len}`, beat: q, gain: 0.5, pan: 0.1 });
    }
    return ev;
  };
  return { roots, chords, bank, events };
}

const SONGS: Record<TrackId, () => Song> = { nightFerry: nightFerrySong, glassHarbour: glassHarbourSong, slowOrbit: slowOrbitSong };

/* ── per-track cache: songs, banks, the master's raw peak ─────────────── */

type Prepared = { song: Song; make: Record<string, () => Clip>; bank: Record<string, Clip>; rawPeak: number | null; overview: TrackOverview | null };
const cache = new Map<TrackId, Prepared>();

function prepared(id: TrackId): Prepared {
  let p = cache.get(id);
  if (!p) {
    const song = SONGS[id]();
    p = { song, make: song.bank(), bank: {}, rawPeak: STORED_PEAK[id] ?? null, overview: null };
    cache.set(id, p);
  }
  return p;
}

/** Drop every cached bank (leaving the lab releases the memory). */
export function releaseTracks(): void {
  cache.clear();
}

/** The events of a 0-based bar (for tests and the stems view). */
export function barEvents(id: TrackId, bar: number): Ev[] {
  if (bar < 0 || bar >= TRACK_BARS) return [];
  return prepared(id).song.events(bar);
}

/** A clip, built on first use. */
function clipOf(p: Prepared, key: string): Clip | undefined {
  const hit = p.bank[key];
  if (hit) return hit;
  const mk = p.make[key];
  if (!mk) return undefined;
  const c = mk();
  p.bank[key] = c;
  return c;
}

/**
 * Build a track's whole clip bank ahead of play, one clip per `breath` (a
 * phone's JS thread stays free between clips). A deck shows LOADING until
 * this lands; a render that runs first simply builds what it needs.
 */
export async function preloadBank(id: TrackId, breath?: () => Promise<void>): Promise<void> {
  const p = prepared(id);
  for (const key of Object.keys(p.make)) {
    if (!p.bank[key]) {
      clipOf(p, key);
      if (breath) await breath();
    }
  }
}

export function bankReady(id: TrackId): boolean {
  const p = cache.get(id);
  return !!p && Object.keys(p.make).every((k) => !!p.bank[k]);
}

/** How far back an earlier bar's clip can still sound: the crash (2.2 s) or
 *  the two-bar riser, whichever is longer. */
const maxTailSec = (id: TrackId): number => Math.max(2.3, 2 * barSec(id) + 0.1);

/** The side-chain duck on the chords in kick sections (the house "pump"). */
function duckAt(beatPhase: number, beatSec: number): number {
  return 1 - 0.55 * Math.exp(-(beatPhase * beatSec) / 0.11);
}

export type StereoBuf = { l: Float32Array; r: Float32Array };
export type RawWindow = { mix: StereoBuf; stems?: Record<StemId, StereoBuf> };

/**
 * Assemble track time [t0, t0 + n/SR) of track `id` at the native rate — the
 * RAW sum (before the master stage). `withStems` also returns each stem.
 */
export function assembleRaw(id: TrackId, t0: number, n: number, withStems = false): RawWindow {
  const p = prepared(id);
  const def = TRACKS[id];
  const bs = barSec(id);
  const beatSec = 60 / def.bpm;
  const mix = { l: new Float32Array(n), r: new Float32Array(n) };
  const stems = withStems ? (Object.fromEntries(STEM_IDS.map((s) => [s, { l: new Float32Array(n), r: new Float32Array(n) }])) as Record<StemId, StereoBuf>) : undefined;
  // The chords stem is summed alone first so the side-chain duck can shape it.
  const chords = { l: new Float32Array(n), r: new Float32Array(n) };
  const t1 = t0 + n / SR;
  const tail = maxTailSec(id);
  const firstBar = Math.max(0, Math.floor((t0 - tail - def.leadInSec) / bs));
  const lastBar = Math.min(TRACK_BARS - 1, Math.floor((t1 - def.leadInSec) / bs));
  for (let bar = firstBar; bar <= lastBar; bar++) {
    for (const e of p.song.events(bar)) {
      const clip = clipOf(p, e.clip);
      if (!clip) continue;
      const te = def.leadInSec + bar * bs + e.beat * beatSec;
      const startIdx = Math.round((te - t0) * SR);
      const len = clip.l.length;
      if (startIdx >= n || startIdx + len <= 0) continue;
      const a = Math.max(0, -startIdx);
      const b = Math.min(len, n - startIdx);
      let gl: number;
      let gr: number;
      if (clip.r) {
        gl = e.gain;
        gr = e.gain;
      } else {
        gl = e.gain * Math.cos(((e.pan + 1) * Math.PI) / 4) * Math.SQRT2;
        gr = e.gain * Math.sin(((e.pan + 1) * Math.PI) / 4) * Math.SQRT2;
      }
      const cl = clip.l;
      const cr = clip.r ?? clip.l;
      const tgt = e.stem === 'chords' ? chords : mix;
      const tl = tgt.l;
      const tr = tgt.r;
      for (let i = a; i < b; i++) {
        const o = startIdx + i;
        tl[o] += cl[i] * gl;
        tr[o] += cr[i] * gr;
      }
      if (stems && e.stem !== 'chords') {
        const st = stems[e.stem];
        for (let i = a; i < b; i++) {
          const o = startIdx + i;
          st.l[o] += cl[i] * gl;
          st.r[o] += cr[i] * gr;
        }
      }
    }
  }
  // Duck the chords on every beat of a section that has a kick. The beat
  // count advances per sample; the section is looked up once per bar.
  const dBeat = 1 / (beatSec * SR);
  let beat = (t0 - def.leadInSec) / beatSec;
  let curBar = Number.NaN;
  let ducks = false;
  for (let i = 0; i < n; i++, beat += dBeat) {
    let g = 1;
    if (beat >= 0) {
      const bar = Math.floor(beat / BEATS_PER_BAR);
      if (bar !== curBar) {
        curBar = bar;
        ducks = bar < TRACK_BARS && sectionAtBar(bar).name !== 'BREAKDOWN';
      }
      if (ducks) g = duckAt(beat - Math.floor(beat), beatSec);
    }
    const l = chords.l[i] * g;
    const r = chords.r[i] * g;
    mix.l[i] += l;
    mix.r[i] += r;
    if (stems) {
      stems.chords.l[i] = l;
      stems.chords.r[i] = r;
    }
  }
  return { mix, stems };
}

/** The master's transfer: raw → output (monotonic and odd). */
export function masterCurve(id: TrackId, rawPeak: number): (x: number) => number {
  const def = TRACKS[id];
  const out = Math.pow(10, def.peakDb / 20);
  const inv = 1 / Math.max(1e-9, rawPeak);
  if (def.drive > 0) {
    const k = Math.tanh(def.drive);
    return (x) => (Math.tanh(def.drive * x * inv) / k) * out;
  }
  return (x) => x * inv * out;
}

/* ── the overview (real min/max) and the raw peak ─────────────────────── */

export type TrackOverview = {
  /** Columns per beat of the TRUE grid's tempo (time base: seconds). */
  colSec: number;
  /** Per column, master-stage output: most positive and most negative
   *  sample of the mono fold (L+R)/2. */
  hi: Float32Array;
  lo: Float32Array;
  /** Per column, peak |sample| over both channels (0..1), for the level
   *  colour ramp and the meters' sanity tests. */
  peak: Float32Array;
  /** Per column, the RMS of the mono fold AFTER the master curve (0..1): the
   *  body of the sound, drawn as the waveform's solid core. */
  rms: Float32Array;
  /** Per column, the peak of the DRUMS' low band (the drum part's mono fold
   *  through the master curve and two one-pole low-passes at 140 Hz; 0..1):
   *  the kick, drawn as the waveform's kick tint and tick row. */
  low: Float32Array;
  seconds: number;
};

/** The low band's corner for the waveform's kick tint (Hz). */
export const OVERVIEW_LOW_HZ = 140;

/** Columns per second of the stored overview (≈ 16 per beat at 122 BPM). */
export const OVERVIEW_COLS_PER_SEC = 32;

/**
 * Analyse a whole track: assemble it bar by bar, find the raw peak, and
 * build the overview through the master curve. `breath` (optional) is
 * awaited between bars so a phone's JS thread stays responsive.
 */
export async function analyseTrack(id: TrackId, breath?: () => Promise<void>): Promise<TrackOverview> {
  const p = prepared(id);
  if (p.overview && p.rawPeak != null) return p.overview;
  const total = trackSeconds(id);
  const cols = Math.ceil(total * OVERVIEW_COLS_PER_SEC);
  const hiRaw = new Float32Array(cols).fill(-Infinity);
  const loRaw = new Float32Array(cols).fill(Infinity);
  const pkRaw = new Float32Array(cols);
  const chunkSec = barSec(id);
  const chunkN = Math.round(chunkSec * SR);
  let rawPeak = 0;
  for (let t0 = 0; t0 < total; t0 += chunkSec) {
    const n = Math.min(chunkN, Math.round((total - t0) * SR));
    if (n <= 0) break;
    const { mix } = assembleRaw(id, t0, n);
    const base = Math.round(t0 * SR);
    const perCol = SR / OVERVIEW_COLS_PER_SEC;
    for (let i = 0; i < n; i++) {
      const l = mix.l[i];
      const r = mix.r[i];
      const m = (l + r) / 2;
      const c = Math.min(cols - 1, Math.floor((base + i) / perCol));
      if (m > hiRaw[c]) hiRaw[c] = m;
      if (m < loRaw[c]) loRaw[c] = m;
      const a = Math.abs(l) > Math.abs(r) ? Math.abs(l) : Math.abs(r);
      if (a > pkRaw[c]) pkRaw[c] = a;
      if (a > rawPeak) rawPeak = a;
    }
    if (breath) await breath();
  }
  const f = masterCurve(id, rawPeak);
  const hi = new Float32Array(cols);
  const lo = new Float32Array(cols);
  const peak = new Float32Array(cols);
  for (let c = 0; c < cols; c++) {
    hi[c] = Number.isFinite(hiRaw[c]) ? f(hiRaw[c]) : 0;
    lo[c] = Number.isFinite(loRaw[c]) ? f(loRaw[c]) : 0;
    peak[c] = f(pkRaw[c]);
  }
  // A second pass over the same audio, through the master curve now that it
  // is known: each column's RMS and its low band's peak (drawing data only —
  // the sound itself is never touched here).
  const ss = new Float64Array(cols);
  const nn = new Float64Array(cols);
  const low = new Float32Array(cols);
  const a = 1 - Math.exp((-2 * Math.PI * OVERVIEW_LOW_HZ) / SR);
  let z1 = 0;
  let z2 = 0;
  for (let t0 = 0; t0 < total; t0 += chunkSec) {
    const n = Math.min(chunkN, Math.round((total - t0) * SR));
    if (n <= 0) break;
    const { mix, stems } = assembleRaw(id, t0, n, true);
    const drums = stems!.drums;
    const base = Math.round(t0 * SR);
    const perCol = SR / OVERVIEW_COLS_PER_SEC;
    for (let i = 0; i < n; i++) {
      const m = f((mix.l[i] + mix.r[i]) / 2);
      const c = Math.min(cols - 1, Math.floor((base + i) / perCol));
      ss[c] += m * m;
      nn[c] += 1;
      const dk = f((drums.l[i] + drums.r[i]) / 2);
      z1 += a * (dk - z1);
      z2 += a * (z1 - z2);
      const al = z2 < 0 ? -z2 : z2;
      if (al > low[c]) low[c] = al;
    }
    if (breath) await breath();
  }
  const rms = new Float32Array(cols);
  for (let c = 0; c < cols; c++) rms[c] = nn[c] > 0 ? Math.sqrt(ss[c] / nn[c]) : 0;
  p.rawPeak = rawPeak;
  p.overview = { colSec: 1 / OVERVIEW_COLS_PER_SEC, hi, lo, peak, rms, low, seconds: total };
  return p.overview;
}

/** Synchronous analysis (tests, and a deck that must play before the async
 *  pass has landed). With no `breath`, analyseTrack's body never awaits, so
 *  it has run to completion — and set the cache — by the time it returns. */
export function analyseTrackSync(id: TrackId): TrackOverview {
  const p = prepared(id);
  if (!(p.overview && p.rawPeak != null)) void analyseTrack(id);
  return p.overview as TrackOverview;
}

/** The master stage's raw peak (shipped, or analysed this session). */
export function rawPeakOf(id: TrackId): number | null {
  return prepared(id).rawPeak;
}

export function isAnalysed(id: TrackId): boolean {
  const p = cache.get(id);
  return !!p && p.overview != null && p.rawPeak != null;
}

/* ── the shipped analysis (scripts/djTrackData.mjs writes djTrackData.ts) ─ */

const STORED_PEAK: Partial<Record<TrackId, number>> = Object.fromEntries(Object.entries(TRACK_DATA).map(([k, v]) => [k, v.rawPeak]));

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
export function bytesToB64(b: Uint8Array): string {
  let out = '';
  for (let i = 0; i < b.length; i += 3) {
    const x = b[i];
    const y = i + 1 < b.length ? b[i + 1] : 0;
    const z = i + 2 < b.length ? b[i + 2] : 0;
    out += B64[x >> 2] + B64[((x & 3) << 4) | (y >> 4)];
    out += i + 1 < b.length ? B64[((y & 15) << 2) | (z >> 6)] : '=';
    out += i + 2 < b.length ? B64[z & 63] : '=';
  }
  return out;
}
export function b64ToBytes(s: string): Uint8Array {
  const clean = s.replace(/=+$/, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = B64.indexOf(clean[i]);
    const b = B64.indexOf(clean[i + 1]);
    const c = i + 2 < clean.length ? B64.indexOf(clean[i + 2]) : 0;
    const d = i + 3 < clean.length ? B64.indexOf(clean[i + 3]) : 0;
    if (o < out.length) out[o++] = (a << 2) | (b >> 4);
    if (o < out.length) out[o++] = ((b & 15) << 4) | (c >> 2);
    if (o < out.length) out[o++] = ((c & 3) << 6) | d;
  }
  return out;
}

/** The overview quantised for shipping: hi/lo as signed bytes (×127), the
 *  per-column peak as an unsigned byte (×255). */
export function quantiseOverview(o: TrackOverview): { cols: number; hi: string; lo: string; peak: string; rms: string; low: string } {
  const n = o.hi.length;
  const q = (v: number, k: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v * k)));
  const hi = new Uint8Array(n);
  const lo = new Uint8Array(n);
  const pk = new Uint8Array(n);
  const rm = new Uint8Array(n);
  const lw = new Uint8Array(n);
  for (let c = 0; c < n; c++) {
    hi[c] = q(o.hi[c], 127, -127, 127) & 255;
    lo[c] = q(o.lo[c], 127, -127, 127) & 255;
    pk[c] = q(o.peak[c], 255, 0, 255);
    rm[c] = q(o.rms[c], 255, 0, 255);
    lw[c] = q(o.low[c], 255, 0, 255);
  }
  return { cols: n, hi: bytesToB64(hi), lo: bytesToB64(lo), peak: bytesToB64(pk), rms: bytesToB64(rm), low: bytesToB64(lw) };
}

function decodeStored(id: TrackId): TrackOverview | null {
  const d = TRACK_DATA[id];
  if (!d) return null;
  const s8 = (b: number) => (b > 127 ? b - 256 : b) / 127;
  const hiB = b64ToBytes(d.hi);
  const loB = b64ToBytes(d.lo);
  const pkB = b64ToBytes(d.peak);
  const rmB = b64ToBytes(d.rms);
  const lwB = b64ToBytes(d.low);
  const hi = new Float32Array(d.cols);
  const lo = new Float32Array(d.cols);
  const peak = new Float32Array(d.cols);
  const rms = new Float32Array(d.cols);
  const low = new Float32Array(d.cols);
  for (let c = 0; c < d.cols; c++) {
    hi[c] = s8(hiB[c]);
    lo[c] = s8(loB[c]);
    peak[c] = pkB[c] / 255;
    rms[c] = rmB[c] / 255;
    low[c] = lwB[c] / 255;
  }
  return { colSec: 1 / OVERVIEW_COLS_PER_SEC, hi, lo, peak, rms, low, seconds: trackSeconds(id) };
}

/**
 * The track's overview: the analysis computed this session, else the shipped
 * one (the SAME computation, run ahead of time and pinned equal by
 * test/djMusic.test.ts — never a drawing).
 */
export function overviewOf(id: TrackId): TrackOverview | null {
  const p = cache.get(id);
  if (p?.overview) return p.overview;
  const stored = storedOverviews.get(id) ?? decodeStored(id);
  if (stored) storedOverviews.set(id, stored);
  return stored;
}
const storedOverviews = new Map<TrackId, TrackOverview>();

/**
 * The track's OUTPUT (master stage applied) for track time [t0, t0 + n/SR):
 * what a player's line output carries before the mixer. Analyses first if
 * needed (synchronously).
 */
export function trackWindow(id: TrackId, t0: number, n: number, withStems = false): RawWindow {
  const p = prepared(id);
  if (p.rawPeak == null) analyseTrackSync(id);
  // (rawPeak is shipped in djTrackData.ts, so this analysis runs only in a
  // build whose data has not been regenerated yet.)
  const f = masterCurve(id, p.rawPeak ?? 1);
  const w = assembleRaw(id, t0, n, withStems);
  const apply = (b: StereoBuf) => {
    for (let i = 0; i < b.l.length; i++) {
      b.l[i] = f(b.l[i]);
      b.r[i] = f(b.r[i]);
    }
  };
  apply(w.mix);
  if (w.stems) {
    // Stems take the same LINEAR part of the master (a soft clip is not
    // separable; the loud track's stems are its pre-clip parts, scaled).
    const g = f(1e-4) / 1e-4;
    for (const s of STEM_IDS) {
      const b = w.stems[s];
      for (let i = 0; i < b.l.length; i++) {
        b.l[i] *= g;
        b.r[i] *= g;
      }
    }
  }
  return w;
}

/* ── one-shot samples for the sampler pads (Screen 12) ────────────────── */

export type SampleId = 'chordHit' | 'percFill' | 'sweep' | 'bassDrop';
export const SAMPLE_IDS: readonly SampleId[] = ['chordHit', 'percFill', 'sweep', 'bassDrop'];
export const SAMPLE_NAMES: Record<SampleId, string> = { chordHit: 'CHORD HIT', percFill: 'PERC FILL', sweep: 'SWEEP', bassDrop: 'SUB DROP' };

const sampleCache = new Map<SampleId, StereoBuf>();

/** A sampler pad's sound (synthesised; level ≈ −9 dBFS peak). */
export function sampleBuf(id: SampleId): StereoBuf {
  const hit = sampleCache.get(id);
  if (hit) return hit;
  let c: Clip;
  if (id === 'chordHit') c = stabClip([57, 60, 64, 69, 72], 0.4, 3);
  else if (id === 'sweep') c = riserClip(1.6, 77);
  else if (id === 'bassDrop') {
    const n = Math.round(1.4 * SR);
    const x = new Float32Array(n);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      ph += (2 * Math.PI * (40 + 70 * Math.exp(-t / 0.35))) / SR;
      x[i] = Math.sin(ph) * Math.exp(-t / 0.6);
    }
    softSat(x, 1.4);
    tailFade(x, 20);
    c = { l: x };
  } else {
    const n = Math.round(0.9 * SR);
    const x = new Float32Array(n);
    const hits: [number, number][] = [[0, 260], [0.12, 220], [0.24, 196], [0.36, 165], [0.48, 147], [0.6, 123]];
    for (const [at, hz] of hits) {
      const t = tomClip(hz).l;
      const s = Math.round(at * SR);
      for (let i = 0; i < t.length && s + i < n; i++) x[s + i] += t[i] * 0.6;
    }
    tailFade(x, 10);
    c = { l: x };
  }
  const r = c.r ?? c.l;
  let pk = 0;
  for (let i = 0; i < c.l.length; i++) pk = Math.max(pk, Math.abs(c.l[i]), Math.abs(r[i]));
  const g = Math.pow(10, -9 / 20) / Math.max(1e-9, pk);
  const out = { l: new Float32Array(c.l.length), r: new Float32Array(c.l.length) };
  for (let i = 0; i < c.l.length; i++) {
    out.l[i] = c.l[i] * g;
    out.r[i] = r[i] * g;
  }
  sampleCache.set(id, out);
  return out;
}
