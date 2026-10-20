/**
 * djEventRender — the EVENT RIG's signal path (screens 19–24), built ON the
 * Stage 1 booth render (djRender.renderBooth), never beside it: one booth
 * state, one render, one set of meters. Pure TypeScript; pinned by
 * test/djEvent.test.ts (with test/djRecord.test.ts and
 * test/djCapstone.test.ts). Model in docs/labs/dj/MODEL.md §13–§19.
 *
 *   renderBooth(…, { inject, keep })
 *     inject: a laptop on CH 1 / CH 2's USB input, a drum machine in CH 2's
 *             LINE inputs, a ground-loop hum on a laptop's USB — they go
 *             through trim, EQ, filter, channel meter, cue and fader like
 *             any source
 *     keep:   the MIX BUS (after its own clip) and the CUE BUS come back
 *   the MIC channel (djVoice at the capsule)
 *     × sensitivity → INPUT STAGE (overloads before the gain knob)
 *     × GAIN → PREAMP CLIP ── MIC meter tap (before LEVEL)
 *     × LEVEL × ON  (+ a capped, quiet stand-in RING when the loop ≥ 0 dB)
 *   TALKOVER: a voice-keyed dip of the music (attack 15 ms, release 450 ms)
 *   PROGRAM = music × dip + mic                 (MASTER always has the mic)
 *     ├→ MASTER knob → MASTER CLIP ── MASTER meters → the PA / the venue
 *     ├→ BOOTH = music × dip + mic·(MIC → BOOTH) → BOOTH knob → BOOTH CLIP
 *     ├→ REC OUT = music × dip + mic·(MIC → REC), fixed level, own clip
 *     └→ PHONES master side (before the MASTER knob), blended with the CUE bus
 *   THE ROOM: the booth's own powered PA (Stage 1 cables) or the VENUE's
 *     system: DJ L / DJ R inputs → (an unbalanced run hums) → the ENGINEER's
 *     gain → the processor's crossover (LR4, 100 Hz: tops above, a MONO sub
 *     below) → the floor centre (tops + subs). Capstone: PA L on another
 *     circuit hums.
 *   THE RECORDER: its tap (REC OUT, BOOTH OUT or the computer's loopback)
 *     × its input gain → RECORDER meters → its own CLIP → the take.
 *   LISTENING: crowd / booth / phones (Stage 1), or the RECORDER's input —
 *     every perspective through the LISTEN gain and the protective limiter.
 *
 * Nothing loud is ever played to teach a fault: the ring is capped at
 * RING_CAP_DBFS before the listen gain and the limiter, the hum sits at
 * HUM_DBFS, and a thump, a hot-patch or a phantom pop is flagged, never
 * played.
 */
import { biquadInPlace, biquadResp, bqState, dbToLin, linToDb, protectiveLimitInPlace, SR, type Biquad, type BqState, type LimiterState } from './djDsp.ts';
import { rbj } from '../../../../features/ear/earDsp.ts';
import { ballistics, carryAt, deckSignal, METER_BLOCK_S, renderBooth, type BoothRender, type MeterState, type RenderCarry, type Tap } from './djRender.ts';
import { voiceBuf } from './djVoice.ts';
import { dmSignal } from './djDrumMachine.ts';
import { cueBlend, deviceLive, levelKnobGain, listenDb, phonesPlugged, speakerFeed, type Booth, type SpeakerId } from '../model/djModel.ts';
import {
  HUM_DBFS,
  HUM_HZ,
  MIC_INPUT_CLIP_AT_0DB,
  UNBAL_HUM_DBFS,
  XOVER_HZ,
  duckDepthDb,
  feedbackOf,
  laptopHum,
  micAlive,
  micGainDb,
  micGainKnob,
  micSensDb,
  recGainDb,
  type EventRig,
} from '../model/djEvent.ts';
import { ROOM, monitorsDbaAt, powerSum, topsDbaAt } from '../model/djRoom.ts';

/** The ring's ceiling at the mic channel (dBFS), before listen gain + limiter. */
export const RING_CAP_DBFS = -30;
/** Talkover: speech above this (dBFS at the mic bus) keys the dip. */
export const DUCK_THRESHOLD_DBFS = -45;
export const DUCK_ATTACK_S = 0.015;
export const DUCK_RELEASE_S = 0.45;

export type EvTap = 'mic' | 'recL' | 'recR' | 'sub';
export const EV_TAPS: readonly EvTap[] = ['mic', 'recL', 'recR', 'sub'];

export type EvExt = {
  meter: Record<EvTap, Float32Array>;
  hold: Record<EvTap, Float32Array>;
  raw: Record<EvTap, Float32Array>;
  /** Per block: the talkover dip in dB (0 = none, −12 = 12 dB down). */
  duckDb: Float32Array;
  /** Per block: the mic is carrying speech (above the duck threshold). */
  speech: Uint8Array;
  /** The deepest dip this render (dB ≤ 0). */
  duckMinDb: number;
  /** The ring's peak at the mic bus this render (dBFS), −Infinity if none. */
  ringDb: number;
  /** Mic-only contribution (RMS over the speech blocks, dBFS) reaching each feed. */
  micIn: { master: number; booth: number; rec: number; crowd: number };
  /** Average level of each feed over the render (dBFS). */
  feedRms: { master: number; booth: number; rec: number; venue: number };
  /** Clipped samples: the mic preamp, the mic input stage, the recorder;
   *  `paR` (ADDITIVE): PA R's own input overloading (its input on MIC). */
  clipped: { micPre: number; micInput: number; rec: number; paR?: number };
  /** A hum is in the crowd's feed / in CH 2's input now. */
  hum: { crowd: boolean; ch1: boolean; ch2: boolean };
  /** The recorder's captured signal (after its clip) and the mic-only part
   *  of it (for the take's voice marker), or null when nothing records. */
  take: { l: Float32Array; r: Float32Array; mic: Float32Array } | null;
  /** Modelled sound levels (dBA): the floor centre and the DJ's ears. */
  floorDba: number | null;
  djDba: number | null;
};

export type EventRender = BoothRender & { ext: EvExt };

type EvCarry = {
  lim: LimiterState;
  duckG: number;
  duckEnv: number;
  ringAmp: number;
  ringPh: number;
  humPh: number;
  xo: { topL: BqState[]; topR: BqState[]; sub: BqState[] };
  meters: Record<EvTap, MeterState>;
};

const FLOOR: MeterState = { m: -60, h: -60, age: 0 };
const BLOCK = Math.round(METER_BLOCK_S * SR);

const freshCarry = (): EvCarry => ({
  lim: { g: 1 },
  duckG: 1,
  duckEnv: 0,
  ringAmp: 0,
  ringPh: 0,
  humPh: 0,
  xo: { topL: [bqState(), bqState()], topR: [bqState(), bqState()], sub: [bqState(), bqState()] },
  meters: { mic: { ...FLOOR }, recL: { ...FLOOR }, recR: { ...FLOOR }, sub: { ...FLOOR } },
});

const cloneCarry = (c: EvCarry): EvCarry => ({
  ...c,
  lim: { g: c.lim.g },
  xo: { topL: c.xo.topL.map((q) => ({ ...q })), topR: c.xo.topR.map((q) => ({ ...q })), sub: c.xo.sub.map((q) => ({ ...q })) },
  meters: { ...c.meters },
});

/** The event render's carry: the base carry plus the event layer's own. */
type FullCarry = RenderCarry & { ev?: EvCarry };

/** As djRender.carryAt, with the event layer's state: the whole carry for a
 *  contiguous chunk, the meters at that moment for a re-render inside one. */
export function eventCarryAt(r: EventRender | null, t: number): FullCarry | null {
  const base = carryAt(r, t) as FullCarry | null;
  if (!r || !base) return base;
  if (base === r.carry) return base;
  const k = Math.floor((t - r.t0) / METER_BLOCK_S);
  if (k < 0 || k >= r.ext.meter.mic.length) return base;
  const meters = {} as Record<EvTap, MeterState>;
  for (const tap of EV_TAPS) meters[tap] = { m: r.ext.meter[tap][k], h: r.ext.hold[tap][k], age: 0 };
  const prev = (r.carry as FullCarry).ev;
  return { ...base, ev: { ...freshCarry(), duckG: prev?.duckG ?? 1, meters } };
}

/* ── helpers ──────────────────────────────────────────────────────────── */

function blockPeaks(x: Float32Array, y: Float32Array | null, n: number): Float32Array {
  const blocks = Math.ceil(n / BLOCK);
  const out = new Float32Array(blocks);
  for (let k = 0; k < blocks; k++) {
    let p = 0;
    const e = Math.min(n, (k + 1) * BLOCK);
    for (let i = k * BLOCK; i < e; i++) {
      const a = x[i] < 0 ? -x[i] : x[i];
      if (a > p) p = a;
      if (y) {
        const c = y[i] < 0 ? -y[i] : y[i];
        if (c > p) p = c;
      }
    }
    out[k] = p;
  }
  return out;
}

function clipInPlace(x: Float32Array, lim = 1): number {
  let c = 0;
  for (let i = 0; i < x.length; i++) {
    if (x[i] > lim) {
      x[i] = lim;
      c++;
    } else if (x[i] < -lim) {
      x[i] = -lim;
      c++;
    }
  }
  return c;
}

const rmsDb = (l: Float32Array, r: Float32Array | null): number => {
  let s = 0;
  for (let i = 0; i < l.length; i++) s += l[i] * l[i] + (r ? r[i] * r[i] : 0);
  return linToDb(Math.sqrt(s / Math.max(1, l.length * (r ? 2 : 1))));
};

/** RMS (dBFS) of `x` over the blocks flagged in `on`. */
function rmsOver(x: Float32Array, on: Uint8Array): number {
  let s = 0;
  let c = 0;
  for (let k = 0; k < on.length; k++) {
    if (!on[k]) continue;
    const e = Math.min(x.length, (k + 1) * BLOCK);
    for (let i = k * BLOCK; i < e; i++) {
      s += x[i] * x[i];
      c++;
    }
  }
  return c ? linToDb(Math.sqrt(s / c)) : -120;
}

const dbOf = (g: number) => 20 * Math.log10(Math.max(1e-9, g));
const HP_LR: Biquad = rbj(XOVER_HZ, Math.SQRT1_2, 0, 'highpass');
const LP_LR: Biquad = rbj(XOVER_HZ, Math.SQRT1_2, 0, 'lowpass');
/** Without the crossover: the tops' and the subs' own natural roll-offs. */
const HP_TOP_NATURAL: Biquad = rbj(50, Math.SQRT1_2, 0, 'highpass');
const LP_SUB_NATURAL: Biquad = rbj(200, Math.SQRT1_2, 0, 'lowpass');
/** The venue crossover's response at f (dB): the tops, the mono sub and
 *  what the floor hears — the render's own filters, cascaded as it runs
 *  them (LR4 = two Butterworth sections), or, without the crossover, the
 *  boxes' own roll-offs. The SYSTEM view plots it. */
export function xoverResp(f: number, xover: boolean, subs: boolean): { tops: number; sub: number; sum: number } {
  const mul = (a: [number, number], b: [number, number]): [number, number] => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const t = xover ? mul(biquadResp(HP_LR, f), biquadResp(HP_LR, f)) : biquadResp(HP_TOP_NATURAL, f);
  const s0 = xover ? mul(biquadResp(LP_LR, f), biquadResp(LP_LR, f)) : biquadResp(LP_SUB_NATURAL, f);
  const sv: [number, number] = subs ? s0 : [0, 0];
  const sum: [number, number] = [t[0] + sv[0], t[1] + sv[1]];
  const db = (z: [number, number]) => 20 * Math.log10(Math.max(1e-6, Math.hypot(z[0], z[1])));
  return { tops: db(t), sub: subs ? db(s0) : -120, sum: db(sum) };
}

/* A long unbalanced run HUMS but keeps its top end (wiring audit WF-DJ-05):
   a mixer's low-impedance line output drives 20 m of cable (a few nF) with
   its corner far above the audio band — the roll-off belongs to a
   high-impedance source such as a pickup, not to this run. */

/** A mains hum: the fundamental and its odd harmonics (a buzz), at `db`. */
function addHum(l: Float32Array, r: Float32Array | null, db: number, ph0: number): number {
  const a = dbToLin(db);
  const w = (2 * Math.PI * HUM_HZ) / SR;
  let ph = ph0;
  for (let i = 0; i < l.length; i++) {
    const v = a * (0.62 * Math.sin(ph) + 0.25 * Math.sin(3 * ph) + 0.13 * Math.sin(5 * ph));
    l[i] += v;
    if (r) r[i] += v;
    ph += w;
    if (ph > 2 * Math.PI) ph -= 2 * Math.PI;
  }
  return ph;
}

/* ── the render ───────────────────────────────────────────────────────── */

/**
 * Render the booth WITH its event rig for `seconds` from booth time `t0`
 * (the booth anchored at t0). `prev` is the last render (for the carry).
 * Without `b.ev` this is renderBooth plus empty event readings.
 */
export function renderEvent(b: Booth, t0: number, seconds: number, prev: EventRender | null): EventRender {
  const ev: EventRig | undefined = b.ev;
  const from = eventCarryAt(prev, t0);
  const joined = !!from && Math.abs(from.t1 - t0) <= 0.002;
  const ec: EvCarry = joined && from?.ev ? cloneCarry(from.ev) : from?.ev ? { ...freshCarry(), duckG: from.ev.duckG, meters: from.ev.meters } : freshCarry();
  const n = Math.max(1, Math.round(seconds * SR));

  // sources the event rig plugs into the channels
  const humCh = { ch1: false, ch2: false };
  const inject = ev
    ? {
        1: (input: string, len: number) => {
          if (input !== 'USB' || !ev.lap1.usb) return null;
          const live = ev.lap1.alive && ev.lap1.deck.playing;
          const s = deckSignal('LAP1', { ...ev.lap1.deck, playing: live }, len);
          if (laptopHum(ev.lap1)) {
            addHum(s.l, s.r, HUM_DBFS, 0);
            humCh.ch1 = true;
          }
          return s;
        },
        2: (input: string, len: number) => {
          if (input === 'USB' && ev.lap2.usb) {
            const live = ev.lap2.alive && ev.lap2.deck.playing;
            const s = deckSignal('LAP2', { ...ev.lap2.deck, playing: live }, len);
            if (laptopHum(ev.lap2)) {
              addHum(s.l, s.r, HUM_DBFS, 0.7);
              humCh.ch2 = true;
            }
            return s;
          }
          if (input === 'LINE' && ev.dm.audio) return dmSignal(b, t0, len);
          return null;
        },
      }
    : undefined;
  const base = renderBooth(b, t0, seconds, from, { inject, keep: true });
  const kept = base.kept!;
  if (!ev) return { ...base, ext: emptyExt(n) };

  const mixerOn = deviceLive(b, 'mixer');
  const blocks = Math.ceil(n / BLOCK);

  /* the MIC channel */
  const m = ev.mic;
  const mic = new Float32Array(n);
  const micMeterSig = new Float32Array(n);
  const clipped: EvExt['clipped'] = { micPre: 0, micInput: 0, rec: 0, paR: 0 };
  if (mixerOn && micAlive(m)) {
    const v = voiceBuf();
    const sens = dbToLin(micSensDb(m.device, m.rxOut));
    const inClip = dbToLin(MIC_INPUT_CLIP_AT_0DB);
    const g = dbToLin(micGainDb(micGainKnob(m)));
    for (const say of m.says) {
      const at = Math.round((say.at - t0) * SR);
      // a SHOUT ("make some noise!") is louder than speech (say.db, ADDITIVE)
      const sg = sens * dbToLin(say.db ?? 0);
      for (let i = Math.max(0, -at); i < v.length && at + i < n; i++) {
        let x = v[i] * sg;
        if (x > inClip) {
          x = inClip;
          clipped.micInput++;
        } else if (x < -inClip) {
          x = -inClip;
          clipped.micInput++;
        }
        micMeterSig[at + i] += x * g;
      }
    }
    for (let i = 0; i < n; i++) mic[i] = micMeterSig[i];
    clipped.micPre = clipInPlace(mic);
    const post = m.on ? levelKnobGain(m.level) : 0;
    for (let i = 0; i < n; i++) mic[i] *= post;
  }
  // FEEDBACK: a quiet stand-in ring, capped, only while the loop is ≥ 0 dB
  const fb = feedbackOf(b);
  let ringPeak = 0;
  {
    const ringing = mixerOn && fb.state === 'RINGING';
    const cap = dbToLin(RING_CAP_DBFS);
    const up = Math.pow(10, 12 / 20 / SR); // grows 12 dB a second…
    const down = Math.pow(10, -60 / 20 / SR); // …and dies 60 dB a second
    let a = ec.ringAmp;
    let ph = ec.ringPh;
    const w = (2 * Math.PI * fb.ringHz) / SR;
    for (let i = 0; i < n; i++) {
      if (ringing) a = a < 1e-4 ? 1e-4 : Math.min(cap, a * up);
      else a *= down;
      if (a > 1e-6) {
        mic[i] += a * Math.sin(ph);
        if (a > ringPeak) ringPeak = a;
      }
      ph += w;
      if (ph > 2 * Math.PI) ph -= 2 * Math.PI;
    }
    ec.ringAmp = a < 1e-7 ? 0 : a;
    ec.ringPh = ph;
  }

  /* TALKOVER: a voice-keyed dip on the music */
  const dip = new Float32Array(n);
  const speech = new Uint8Array(blocks);
  {
    const thr = dbToLin(DUCK_THRESHOLD_DBFS);
    const target = dbToLin(duckDepthDb(m.depth));
    const att = 1 - Math.exp(-1 / (DUCK_ATTACK_S * SR));
    const rel = 1 - Math.exp(-1 / (DUCK_RELEASE_S * SR));
    const envRel = 1 - Math.exp(-1 / (0.12 * SR));
    let env = ec.duckEnv;
    let g = ec.duckG;
    const active = m.talkover && m.on;
    for (let i = 0; i < n; i++) {
      const x = Math.abs(mic[i]);
      env = x > env ? x : env + (x - env) * envRel;
      const want = active && env > thr ? target : 1;
      g += (want - g) * (want < g ? att : rel);
      dip[i] = g;
      if (env > thr) speech[Math.floor(i / BLOCK)] = 1;
    }
    ec.duckEnv = env;
    ec.duckG = g;
  }
  const duckDb = new Float32Array(blocks);
  let duckMin = 0;
  for (let k = 0; k < blocks; k++) {
    let mn = 1;
    const e = Math.min(n, (k + 1) * BLOCK);
    for (let i = k * BLOCK; i < e; i++) if (dip[i] < mn) mn = dip[i];
    duckDb[k] = dbOf(mn);
    if (duckDb[k] < duckMin) duckMin = duckDb[k];
  }

  /* the outputs */
  const musL = new Float32Array(n);
  const musR = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    musL[i] = kept.busL[i] * dip[i];
    musR[i] = kept.busR[i] * dip[i];
  }
  const mk = mixerOn ? levelKnobGain(b.mixer.master) : 0;
  const bk = mixerOn ? levelKnobGain(b.mixer.booth) : 0;
  const pk = mixerOn ? levelKnobGain(b.mixer.phones) : 0;
  const mL = new Float32Array(n);
  const mR = new Float32Array(n);
  const bL = new Float32Array(n);
  const bR = new Float32Array(n);
  const recL = new Float32Array(n);
  const recR = new Float32Array(n);
  const progL = new Float32Array(n);
  const progR = new Float32Array(n);
  const mb = m.toBooth ? 1 : 0;
  const mr = m.toRec ? 1 : 0;
  for (let i = 0; i < n; i++) {
    progL[i] = musL[i] + mic[i];
    progR[i] = musR[i] + mic[i];
    mL[i] = progL[i] * mk;
    mR[i] = progR[i] * mk;
    bL[i] = (musL[i] + mic[i] * mb) * bk;
    bR[i] = (musR[i] + mic[i] * mb) * bk;
    recL[i] = musL[i] + mic[i] * mr;
    recR[i] = musR[i] + mic[i] * mr;
  }
  const pkMaster = { l: blockPeaks(mL, null, n), r: blockPeaks(mR, null, n) };
  const cMaster = clipInPlace(mL) + clipInPlace(mR);
  const pkBooth = blockPeaks(bL, bR, n);
  const cBooth = clipInPlace(bL) + clipInPlace(bR);
  clipInPlace(recL);
  clipInPlace(recR);
  // phones: the master side is the PROGRAM (before the MASTER knob)
  const pL = new Float32Array(n);
  const pR = new Float32Array(n);
  if (b.mixer.splitCue) {
    for (let i = 0; i < n; i++) {
      pL[i] = ((kept.cueL[i] + kept.cueR[i]) / 2) * pk;
      pR[i] = ((progL[i] + progR[i]) / 2) * pk;
    }
  } else {
    const kb = cueBlend(b.mixer.cueMix);
    for (let i = 0; i < n; i++) {
      pL[i] = (kept.cueL[i] * kb.cue + progL[i] * kb.master) * pk;
      pR[i] = (kept.cueR[i] * kb.cue + progR[i] * kb.master) * pk;
    }
  }
  const pkPhones = { l: blockPeaks(pL, null, n), r: blockPeaks(pR, null, n) };
  const cPhones = clipInPlace(pL) + clipInPlace(pR);

  /* the room */
  const z = new Float32Array(n);
  const outs = { MASTER: { L: mL, R: mR }, BOOTH: { L: bL, R: bR } } as const;
  const spk = (s: SpeakerId): Float32Array | null => {
    const f = speakerFeed(b, s);
    return f ? outs[f.out][f.side] : null;
  };
  let crowdL: Float32Array = z;
  let crowdR: Float32Array = z;
  let humCrowd = false;
  const subSig = new Float32Array(n);
  let venueRms = -120;
  const v = ev.venue;
  if (v.on) {
    const inL = new Float32Array(n);
    const inR = new Float32Array(n);
    const pick = (p: typeof v.djL) => (p === 'MST_L' ? mL : p === 'MST_R' ? mR : null);
    const a = pick(v.djL);
    const c = pick(v.djR);
    if (a) inL.set(a);
    if (c) inR.set(c);
    if (v.cable === 'UNBAL' && (a || c)) {
      ec.humPh = addHum(inL, inR, UNBAL_HUM_DBFS, ec.humPh);
      humCrowd = true;
    }
    const vg = dbToLin(v.gainDb);
    for (let i = 0; i < n; i++) {
      inL[i] *= vg;
      inR[i] *= vg;
      subSig[i] = (inL[i] + inR[i]) / 2;
    }
    venueRms = rmsDb(inL, inR);
    const tL = inL;
    const tR = inR;
    if (v.xover) {
      biquadInPlace(tL, HP_LR, ec.xo.topL[0]);
      biquadInPlace(tL, HP_LR, ec.xo.topL[1]);
      biquadInPlace(tR, HP_LR, ec.xo.topR[0]);
      biquadInPlace(tR, HP_LR, ec.xo.topR[1]);
      biquadInPlace(subSig, LP_LR, ec.xo.sub[0]);
      biquadInPlace(subSig, LP_LR, ec.xo.sub[1]);
    } else {
      biquadInPlace(tL, HP_TOP_NATURAL, ec.xo.topL[0]);
      biquadInPlace(tR, HP_TOP_NATURAL, ec.xo.topR[0]);
      biquadInPlace(subSig, LP_SUB_NATURAL, ec.xo.sub[0]);
    }
    if (!v.subs) subSig.fill(0);
    crowdL = new Float32Array(n);
    crowdR = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      crowdL[i] = tL[i] + subSig[i];
      crowdR[i] = tR[i] + subSig[i];
    }
  } else {
    crowdL = spk('paL') ?? z;
    crowdR = spk('paR') ?? z;
    // capstone: PA R's input switch on MIC — the line feed overloads the
    // speaker's own input stage (+30 dB into a soft clip). The level is held
    // near the clean side's so the lab never plays it loud: the fault is the
    // distortion, shown on PA R's own clip light.
    if (ev.paRMic && spk('paR')) {
      const d = new Float32Array(n);
      const drive = dbToLin(30);
      const ceil = 0.32;
      let over = 0;
      for (let i = 0; i < n; i++) {
        const x = crowdR[i] * drive;
        if (Math.abs(x) > 1) over++;
        d[i] = ceil * Math.tanh(x);
      }
      crowdR = d;
      clipped.paR = over;
    }
    if (ev.paLWall && !ev.paLIsolator && spk('paL')) {
      const h = new Float32Array(n);
      h.set(crowdL);
      ec.humPh = addHum(h, null, HUM_DBFS, ec.humPh);
      crowdL = h;
      humCrowd = true;
    }
  }

  /* the recorder */
  const rec = ev.rec;
  const rg = dbToLin(recGainDb(rec.gain));
  const tapL = rec.tap === 'REC_OUT' ? recL : rec.tap === 'BOOTH' ? bL : null;
  const tapR = rec.tap === 'REC_OUT' ? recR : rec.tap === 'BOOTH' ? bR : null;
  const rL = new Float32Array(n);
  const rR = new Float32Array(n);
  const rMic = new Float32Array(n);
  if (tapL && tapR) {
    const micK = rec.tap === 'REC_OUT' ? mr : mb * bk;
    for (let i = 0; i < n; i++) {
      rL[i] = tapL[i] * rg;
      rR[i] = tapR[i] * rg;
      rMic[i] = mic[i] * micK * rg;
    }
  } else if (rec.tap === 'LOOPBACK' && ev.lap1.alive && ev.lap1.deck.playing) {
    // the computer records what IT plays — its own track, nothing else
    const s = deckSignal('LAP1', ev.lap1.deck, n);
    for (let i = 0; i < n; i++) {
      rL[i] = s.l[i] * rg;
      rR[i] = s.r[i] * rg;
    }
  }
  const pkRec = { l: blockPeaks(rL, null, n), r: blockPeaks(rR, null, n) };
  clipped.rec = clipInPlace(rL) + clipInPlace(rR);

  /* listening */
  let fl: Float32Array | null = null;
  let fr: Float32Array | null = null;
  if (ev.hearRec) {
    fl = rL;
    fr = rR;
  } else if (b.perspective === 'CROWD') {
    fl = crowdL;
    fr = crowdR;
  } else if (b.perspective === 'BOOTH') {
    fl = spk('boothL');
    fr = spk('boothR');
  } else if (phonesPlugged(b)) {
    fl = pL;
    fr = pR;
  }
  const lg = dbToLin(listenDb(b.listen));
  const playL = new Float32Array(n);
  const playR = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    playL[i] = (fl ? fl[i] : 0) * lg;
    playR[i] = (fr ? fr[i] : 0) * lg;
  }
  const limiterDb = protectiveLimitInPlace(playL, playR, undefined, ec.lim);

  /* meters: the outputs this layer rebuilt, and its own taps */
  const meter = { ...base.meter };
  const hold = { ...base.hold };
  const raw = { ...base.raw };
  const ends = { ...base.carry.meters };
  const startOf = (tap: Tap) => from?.meters[tap];
  const redo = (tap: Tap, peaks: Float32Array) => {
    const bl = ballistics(peaks, startOf(tap));
    meter[tap] = bl.meter;
    hold[tap] = bl.hold;
    raw[tap] = bl.raw;
    ends[tap] = bl.end;
  };
  redo('masterL', pkMaster.l);
  redo('masterR', pkMaster.r);
  redo('booth', pkBooth);
  redo('phonesL', pkPhones.l);
  redo('phonesR', pkPhones.r);
  redo('crowd', blockPeaks(crowdL, crowdR, n));
  const em = {} as Record<EvTap, Float32Array>;
  const eh = {} as Record<EvTap, Float32Array>;
  const er = {} as Record<EvTap, Float32Array>;
  const eEnds = {} as Record<EvTap, MeterState>;
  const evPeaks: Record<EvTap, Float32Array> = { mic: blockPeaks(micMeterSig, null, n), recL: pkRec.l, recR: pkRec.r, sub: blockPeaks(subSig, null, n) };
  for (const tap of EV_TAPS) {
    const bl = ballistics(evPeaks[tap], ec.meters[tap]);
    em[tap] = bl.meter;
    eh[tap] = bl.hold;
    er[tap] = bl.raw;
    eEnds[tap] = bl.end;
  }
  ec.meters = eEnds;

  const rms = { ...base.rmsDb, masterL: rmsDb(mL, null), masterR: rmsDb(mR, null), booth: rmsDb(bL, bR), phonesL: rmsDb(pL, null), phonesR: rmsDb(pR, null), crowd: rmsDb(crowdL, crowdR) };
  const clippedAll = { ...base.clipped, master: cMaster, booth: cBooth, phones: cPhones };

  // the mic's own share of each feed, over the blocks where it speaks
  const micOnly = new Float32Array(n);
  for (let i = 0; i < n; i++) micOnly[i] = mic[i];
  const scaled = (k: number) => {
    const x = new Float32Array(n);
    for (let i = 0; i < n; i++) x[i] = micOnly[i] * k;
    return x;
  };
  const crowdMicK = v.on ? (v.djL || v.djR ? mk * dbToLin(v.gainDb) : 0) : spk('paL') || spk('paR') ? mk : 0;
  const micIn = {
    master: rmsOver(scaled(mk), speech),
    booth: rmsOver(scaled(mb * bk), speech),
    rec: rmsOver(rMic, speech),
    crowd: rmsOver(scaled(crowdMicK), speech),
  };
  const feedRms = { master: rmsDb(mL, mR), booth: rmsDb(bL, bR), rec: rmsDb(rL, rR), venue: venueRms };

  // modelled sound levels: the tops by their feed, the monitors by theirs
  const place = v.place;
  const crowdFeed = v.on ? venueRms : rmsDb(spk('paL') ?? z, spk('paR') ?? z);
  const boothFeed = rmsDb(spk('boothL') ?? z, spk('boothR') ?? z);
  const floorDba = crowdFeed > -90 ? topsDbaAt(ROOM.floorCentre, place, crowdFeed) : null;
  const djParts: number[] = [];
  if (crowdFeed > -90) djParts.push(topsDbaAt(ROOM.dj, place, crowdFeed));
  if (boothFeed > -90) djParts.push(monitorsDbaAt(ROOM.dj, boothFeed));
  const djDba = djParts.length ? powerSum(djParts) : null;

  const carry: FullCarry = { ...base.carry, meters: ends, ev: ec };
  return {
    ...base,
    kept: undefined,
    playback: { l: playL, r: playR },
    meter,
    hold,
    raw,
    rmsDb: rms,
    clipped: clippedAll,
    limiterDb,
    carry,
    ext: {
      meter: em,
      hold: eh,
      raw: er,
      duckDb,
      speech,
      duckMinDb: duckMin,
      ringDb: ringPeak > 0 ? linToDb(ringPeak) : -Infinity,
      micIn,
      feedRms,
      clipped,
      hum: { crowd: humCrowd, ch1: humCh.ch1, ch2: humCh.ch2 },
      take: rec.armedAt != null && (tapL || rec.tap === 'LOOPBACK') ? { l: rL, r: rR, mic: rMic } : null,
      floorDba,
      djDba,
    },
  } as EventRender;
}

function emptyExt(n: number): EvExt {
  const blocks = Math.ceil(n / BLOCK);
  const f = () => new Float32Array(blocks).fill(-60);
  const rec = (): Record<EvTap, Float32Array> => ({ mic: f(), recL: f(), recR: f(), sub: f() });
  return {
    meter: rec(),
    hold: rec(),
    raw: rec(),
    duckDb: new Float32Array(blocks),
    speech: new Uint8Array(blocks),
    duckMinDb: 0,
    ringDb: -Infinity,
    micIn: { master: -120, booth: -120, rec: -120, crowd: -120 },
    feedRms: { master: -120, booth: -120, rec: -120, venue: -120 },
    clipped: { micPre: 0, micInput: 0, rec: 0 },
    hum: { crowd: false, ch1: false, ch2: false },
    take: null,
    floorDba: null,
    djDba: null,
  };
}

/** The renderer the event screens hand to useBoothAudio. */
export const eventRenderer = (b: Booth, t0: number, seconds: number, prev: BoothRender | null): BoothRender => renderEvent(b, t0, seconds, (prev as EventRender | null) ?? null);

/** Is this render an event render? */
export const isEventRender = (r: BoothRender | null): r is EventRender => !!r && 'ext' in r;

