/**
 * djStage2 — the Stage 2 additions to the booth's ONE signal path, as a hook
 * the render calls at fixed points (engine/djRender.renderBooth). Pure
 * TypeScript; every part is pinned by the test/djStage2*.test.ts files. With
 * none of the Stage 2 state present it returns null and the render is the
 * Stage 1 render, sample for sample.
 *
 * WHERE IT ACTS (the order of processing, docs/labs/dj/MODEL.md §12):
 *   deck()          a deck with KEY LOCK, a KEY SHIFT or STEMS plays through
 *                   the speed chain (engine/djStretch) from its stems
 *                   (engine/djStems) instead of the plain resample;
 *   sources()       the TURNTABLE: a control record's tone (DVS), the stylus
 *                   lifted, MISTRACKING (tracking force, anti-skate), the
 *                   ground HUM, and the ACOUSTIC FEEDBACK loop through the
 *                   booth monitor (model/djVinyl);
 *   channelInput()  a channel whose selector is on USB hears the laptop's
 *                   decks assigned to its pair (model/djLaptop), with the
 *                   buffer's DROPOUTS; the DVS software deck's stutter; THRU;
 *                   an FX RETURN brought back in on channel 2;
 *   channelPost()   after the fader: a channel INSERT effect, and the SEND;
 *   bus()           the SEND/RETURN effect and a MASTER insert, before the
 *                   bus clip (so an effect can overload the bus by itself);
 *   safetyDb()      a quieter listening level while a loop, a howl or a
 *                   control tone is on a speaker (never loud in the lab).
 */
import { SR, biquadInPlace, bqState, dbToLin, linToDb, rng, type BqState, type Biquad } from './djDsp.ts';
import { trackWindow, trueGrid, type StereoBuf } from './djMusic.ts';
import { cloneFxCarry, freshFxCarry, fxProcess, fxReplay, fxRinging, type FxCarry, type FxRun, type FxTrace } from './djFx.ts';
import { speedChain } from './djStretch.ts';
import { melodyGhostDb, stemWindow } from './djStems.ts';
import { LOOP_SAFETY_DB, dryWet, fxBpm, fxTempoDeck, returnLoopGain, type FxState } from '../model/djEffects.ts';
import { dropoutsIn, laptopFeeds } from '../model/djLaptop.ts';
import { CART_V, FEEDBACK_HZ, HUM_HZ, HUM_V, feedbackLoopGain, trackAbility, wallForce } from '../model/djVinyl.ts';
import { CONTROL_HZ, dvsLock, toneOnChannel } from '../model/djDvs.ts';
import { speedPlan } from '../model/djKey.ts';
import { PHONO_GAIN_DB, deckPos, faderGain, trimDb, type Booth, type ChannelId, type DeckId, type DeckState } from '../model/djModel.ts';
import { beatAt } from '../model/djTime.ts';

export const BLOCK_S = 0.01;
const BLOCK = Math.round(BLOCK_S * SR);

/** The acoustic loop's state (carried across contiguous chunks only). */
type TtLoop = { bp: [BqState, BqState]; ring: [Float32Array, Float32Array]; i: number };
export type S2Carry = { fx: FxCarry | null; tt: TtLoop | null };

export type S2Report = {
  /** Replays the effect to any moment of this chunk (carryAt). */
  fxTrace: FxTrace | null;
  /** Per 10 ms block, dBFS: the signal fed INTO the effect, and its WET output. */
  fxIn: Float32Array | null;
  fxOut: Float32Array | null;
  fxBpm: number | null;
  /** A return loop's gain (linear, 0 = none). */
  loopGain: number;
  /** Booth times of the laptop's dropouts in this chunk. */
  dropouts: number[];
  /** The melody's ghost (dB) in a SEPARATED deck with its melody muted. */
  ghostDb: Partial<Record<DeckId, number>>;
  /** The DVS software's view of its control signal: L and R samples. */
  scope: { l: number[]; r: number[] } | null;
  /** The acoustic loop's gain, and its howl's level (dBFS, line). */
  ttLoopGain: number;
  howlDb: number;
  /** The listening level's safety trim this chunk (dB, ≤ 0). */
  safetyDb: number;
};

const z = (n: number): StereoBuf => ({ l: new Float32Array(n), r: new Float32Array(n) });
const PHONO_G = dbToLin(PHONO_GAIN_DB);

/** A 0 dB-peak band-pass biquad (RBJ "constant 0 dB peak gain"). */
function bandpass(f: number, q: number): Biquad {
  const w0 = (2 * Math.PI * f) / SR;
  const alpha = Math.sin(w0) / (2 * q);
  const a0 = 1 + alpha;
  return { b0: alpha / a0, b1: 0, b2: -alpha / a0, a1: (-2 * Math.cos(w0)) / a0, a2: (1 - alpha) / a0 };
}
const BP_FB = bandpass(FEEDBACK_HZ, 2.5);
const TT_LOOP_N = Math.round(0.008 * SR);

function blockDb(l: Float32Array, r: Float32Array): Float32Array {
  const nb = Math.ceil(l.length / BLOCK);
  const out = new Float32Array(nb);
  for (let k = 0; k < nb; k++) {
    let p = 0;
    for (let i = k * BLOCK; i < Math.min(l.length, (k + 1) * BLOCK); i++) {
      const a = Math.abs(l[i]);
      const c = Math.abs(r[i]);
      if (a > p) p = a;
      if (c > p) p = c;
    }
    out[k] = Math.max(-60, linToDb(p));
  }
  return out;
}

/** Does this deck need the Stage 2 source (stretch, shift or stems)? */
export const deckNeedsStage2 = (d: DeckState): boolean => !!d.track && (!!d.keyLock || !!d.keyShift || !!d.stems);

const HAS_FX = (b: Booth): b is Booth & { fx: FxState } => !!b.fx;

export type Stage2 = {
  deck: (slot: DeckId, d: DeckState, n: number) => StereoBuf | null;
  sources: (src: Record<'A' | 'B' | 'TT', StereoBuf>) => void;
  channelInput: (ch: ChannelId, l: Float32Array, r: Float32Array, src: Record<'A' | 'B' | 'TT', StereoBuf>) => boolean;
  channelPost: (ch: ChannelId, l: Float32Array, r: Float32Array, fader: number) => StereoBuf;
  bus: (busL: Float32Array, busR: Float32Array) => void;
  safetyDb: () => number;
  end: () => { carry: S2Carry; report: S2Report };
};

/**
 * The Stage 2 hook for one render of `n` samples from booth time `t0`, or
 * null when the booth uses none of it. `from` is the previous chunk's Stage 2
 * carry; `joined` = this render continues it exactly.
 */
export function stage2Of(b: Booth, t0: number, n: number, from: S2Carry | null | undefined, joined: boolean): Stage2 | null {
  const usbIn = ([1, 2] as ChannelId[]).some((c) => b.ch[c].input === 'USB');
  const anyDeck = deckNeedsStage2(b.decks.A) || deckNeedsStage2(b.decks.B);
  if (!b.fx && !b.vinyl && !b.dvs && !(b.laptop && usbIn) && !anyDeck) return null;

  const report: S2Report = { fxTrace: null, fxIn: null, fxOut: null, fxBpm: null, loopGain: 0, dropouts: [], ghostDb: {}, scope: null, ttLoopGain: 0, howlDb: -120, safetyDb: 0 };
  const carry: S2Carry = { fx: from?.fx ? cloneFxCarry(from.fx) : null, tt: joined && from?.tt ? { bp: [{ ...from.tt.bp[0] }, { ...from.tt.bp[1] }], ring: [from.tt.ring[0].slice(), from.tt.ring[1].slice()], i: from.tt.i } : null };
  let safety = 0;

  /* ── the effect ── */
  const fx = b.fx ?? null;
  const fxActive = !!fx && (fx.on || (!!carry.fx && fxRinging(carry.fx)));
  const bpm = fx ? fxBpm(b, fx) : 120;
  let beat0 = 0;
  if (fx) {
    const d = b.decks[fxTempoDeck(fx)];
    if (d.track) beat0 = beatAt(trueGrid(d.track), deckPos(d, t0));
  }
  const trim2 = dbToLin(trimDb(b.ch[2].trim));
  const loopGain = fx ? returnLoopGain(b, fx, trim2, faderGain(b.ch[2].fader)) : 0;
  report.loopGain = loopGain;
  if (loopGain > 0) safety = Math.min(safety, LOOP_SAFETY_DB);
  const sendL = new Float32Array(n);
  const sendR = new Float32Array(n);
  let fxDone = false;
  let ch2Return: StereoBuf | null = null;
  /** Run the effect once on `inL/inR`, keeping the trace and the readings. */
  const runFx = (inL: Float32Array, inR: Float32Array, lg: number): StereoBuf => {
    if (!carry.fx) carry.fx = freshFxCarry();
    const run: FxRun = { fx: fx!, bpm, beat0, feed: fx!.on, loopGain: lg };
    // a COPY: the caller mixes into its own buffers after this
    const fedL = fx!.on ? inL.slice() : new Float32Array(n);
    const fedR = fx!.on ? inR.slice() : new Float32Array(n);
    report.fxTrace = { start: cloneFxCarry(carry.fx), run, inL: fedL, inR: fedR };
    const y = fxProcess(run, fedL, fedR, carry.fx);
    report.fxIn = blockDb(fedL, fedR);
    report.fxOut = blockDb(y.l, y.r);
    report.fxBpm = bpm;
    fxDone = true;
    return y;
  };

  /* ── the turntable ── */
  const sources = (src: Record<'A' | 'B' | 'TT', StereoBuf>) => {
    const tt = b.tt;
    const v = b.vinyl;
    const phonoOut = b.ttPreamp === 'PHONO';
    const toCart = phonoOut ? 1 / PHONO_G : 1;
    if (b.dvs?.on && b.dvs.control) {
      // the CONTROL RECORD: a 1 kHz quadrature tone, its phase the record's
      // position, its level the platter's speed (a cartridge reads velocity)
      const rate = tt.playing ? 1 + tt.pitch / 100 : 0;
      const A = 0.5 * rate * toCart;
      const L = new Float32Array(n);
      const R = new Float32Array(n);
      const noise = b.dvs.dirty ? rng(0xd1 + Math.round(t0 * 100)) : null;
      for (let i = 0; i < n; i++) {
        const pos = tt.playing ? tt.posSec + (t0 + i / SR - tt.at) * rate : tt.posSec;
        const ph = 2 * Math.PI * CONTROL_HZ * pos;
        let l = A * Math.sin(ph);
        let r = A * Math.cos(ph);
        if (noise) {
          const c = noise() < 0.004 ? (noise() * 2 - 1) * 0.6 * toCart : 0;
          l += c + (noise() * 2 - 1) * 0.06 * toCart * rate;
          r += c + (noise() * 2 - 1) * 0.06 * toCart * rate;
        }
        L[i] = l;
        R[i] = r;
      }
      src.TT = { l: L, r: R };
    }
    if (v) {
      if (v.armUp) {
        src.TT = z(n);
      } else if (!(b.dvs?.on && b.dvs.control)) {
        // MISTRACKING, per groove wall (left = inner, right = outer), on the
        // line-equivalent signal
        const wf = wallForce(v);
        const ab = { l: trackAbility(wf.L), r: trackAbility(wf.R) };
        const toLine = phonoOut ? PHONO_G : 1;
        const noise = rng(0x7a + Math.round(t0 * 1000));
        for (const side of ['l', 'r'] as const) {
          const a = ab[side];
          if (a >= 1) continue;
          const x = src.TT[side];
          const T = 0.62 * Math.max(0.05, a);
          let hp = 0;
          let prev = 0;
          for (let i = 0; i < n; i++) {
            const xl = x[i] * toLine;
            hp = 0.6 * (hp + xl - prev);
            prev = xl;
            const d = Math.abs(xl) + 1.5 * Math.abs(hp);
            if (d > T) {
              const y = xl * Math.pow(T / d, 0.6) + 0.25 * (d - T) * (noise() * 2 - 1);
              x[i] = y / toLine;
            }
          }
        }
      }
      // the ground HUM (50 Hz and its odd harmonics: a buzz), at the cartridge
      if (!v.gnd && !v.armUp && b.power.turntable) {
        const hv = (HUM_V / CART_V) * 0.5 * (phonoOut ? 1 / PHONO_G : 1);
        for (let i = 0; i < n; i++) {
          const t = t0 + i / SR;
          const h = hv * (Math.sin(2 * Math.PI * HUM_HZ * t) + 0.5 * Math.sin(2 * Math.PI * 3 * HUM_HZ * t) + 0.3 * Math.sin(2 * Math.PI * 5 * HUM_HZ * t));
          src.TT.l[i] += h;
          src.TT.r[i] += h;
        }
      }
      // ACOUSTIC FEEDBACK through the booth monitor
      const G = feedbackLoopGain(b, v);
      report.ttLoopGain = G;
      if (G > 0.02) {
        if (!carry.tt) carry.tt = { bp: [bqState(), bqState()], ring: [new Float32Array(TT_LOOP_N), new Float32Array(TT_LOOP_N)], i: 0 };
        const st = carry.tt;
        const toLine = phonoOut ? PHONO_G : 1;
        const C = 0.3;
        let howl = 0;
        const sides = [src.TT.l, src.TT.r];
        const i0 = st.i;
        for (let s = 0; s < 2; s++) {
          const x = sides[s];
          const ring = st.ring[s];
          const bp = st.bp[s];
          let ri = i0;
          const one = new Float32Array(1);
          for (let i = 0; i < n; i++) {
            one[0] = ring[ri];
            biquadInPlace(one, BP_FB, bp);
            let fbk = G * one[0];
            if (G >= 0.95) fbk = C * Math.tanh(fbk / C);
            const y = x[i] * toLine + fbk;
            ring[ri] = y;
            ri = ri + 1 === TT_LOOP_N ? 0 : ri + 1;
            x[i] = y / toLine;
            howl += fbk * fbk;
          }
          if (s === 1) st.i = ri;
        }
        report.howlDb = linToDb(Math.sqrt(howl / (2 * n)));
        if (G >= 1) safety = Math.min(safety, -9);
      }
    }
  };

  /* ── the decks through the speed chain and their stems ── */
  const deck = (slot: DeckId, d: DeckState, n: number): StereoBuf | null => {
    if (!deckNeedsStage2(d)) return null;
    if (!d.playing) return z(n);
    const plan = speedPlan(d);
    const id = d.track!;
    const read = (start: number, len: number): StereoBuf => (d.stems ? stemWindow(id, start, len, d.stems, d.stemFrom ?? 'ORIGINAL') : trackWindow(id, start, len).mix);
    if (d.stems && (d.stemFrom ?? 'ORIGINAL') === 'SEPARATED' && d.stems.lead === 0) report.ghostDb[slot] = melodyGhostDb(d.stems, d.posSec, Math.round(n * plan.rate));
    return speedChain(read, d.posSec, plan, n);
  };

  /* ── the channels ── */
  const usbFill = (ch: ChannelId, l: Float32Array, r: Float32Array, src: Record<'A' | 'B' | 'TT', StereoBuf>): boolean => {
    const lap = b.laptop;
    if (!lap || b.ch[ch].input !== 'USB') return false;
    let any = false;
    for (const d of ['A', 'B'] as DeckId[]) {
      if (!laptopFeeds(lap, d, ch)) continue;
      any = true;
      let s = src[d];
      // DVS THRU: the software passes the turntable's own sound back on deck 1
      if (d === 'A' && b.dvs?.on && b.dvs.mode === 'THRU') {
        const tt = src.TT;
        const k = b.ttPreamp === 'PHONO' ? PHONO_G : 1;
        s = { l: tt.l.map((x) => Math.max(-1, Math.min(1, x * k))), r: tt.r.map((x) => Math.max(-1, Math.min(1, x * k))) };
      } else if (d === 'A' && b.dvs?.on && b.dvs.mode !== 'INT' && dvsLock(b) === 'UNSTABLE') {
        // the software loses the control signal for a moment, now and then
        s = { l: s.l.slice(), r: s.r.slice() };
        const r0 = rng(0x51 + Math.floor(t0 * 4));
        let t = 0.15 + r0() * 0.6;
        while (t < n / SR) {
          const a = Math.round(t * SR);
          const len = Math.round((0.04 + r0() * 0.05) * SR);
          for (let i = a; i < Math.min(n, a + len); i++) {
            const e = Math.min(1, (i - a) / 96, (a + len - i) / 96);
            s.l[i] *= 1 - e;
            s.r[i] *= 1 - e;
          }
          t += 0.5 + r0() * 0.9;
        }
      }
      for (let i = 0; i < n; i++) {
        l[i] += s.l[i];
        r[i] += s.r[i];
      }
    }
    if (any) {
      // the laptop's buffer DROPOUTS: a buffer that missed its deadline is a gap
      const drops = dropoutsIn(lap, t0, n / SR);
      report.dropouts = drops;
      const len = Math.max(1, Math.round((lap.buffer / lap.rate) * SR));
      for (const t of drops) {
        const a = Math.round((t - t0) * SR);
        for (let i = Math.max(0, a); i < Math.min(n, a + len); i++) {
          l[i] = 0;
          r[i] = 0;
        }
      }
    }
    return any;
  };

  const channelInput = (ch: ChannelId, l: Float32Array, r: Float32Array, src: Record<'A' | 'B' | 'TT', StereoBuf>): boolean => {
    if (ch === 2 && fx && fx.route === 'SEND' && fx.returnTo === 'CH2' && fxActive) {
      // the RETURN comes back in on channel 2 (its own send is the loop)
      const y = runFx(sendL, sendR, loopGain);
      const k = Math.max(0, fx.wet);
      ch2Return = y;
      for (let i = 0; i < n; i++) {
        l[i] = y.l[i] * k;
        r[i] = y.r[i] * k;
      }
      return true;
    }
    return usbFill(ch, l, r, src);
  };

  const channelPost = (ch: ChannelId, l: Float32Array, r: Float32Array, fader: number): StereoBuf => {
    const out = { l: new Float32Array(n), r: new Float32Array(n) };
    for (let i = 0; i < n; i++) {
      out.l[i] = l[i] * fader;
      out.r[i] = r[i] * fader;
    }
    if (fx && fxActive && fx.route === (ch === 1 ? 'CH1' : 'CH2')) {
      const y = runFx(out.l, out.r, 0);
      const dw = fx.on ? dryWet(fx.wet) : { dry: 1, wet: dryWet(fx.wet).wet };
      for (let i = 0; i < n; i++) {
        out.l[i] = out.l[i] * dw.dry + y.l[i] * dw.wet;
        out.r[i] = out.r[i] * dw.dry + y.r[i] * dw.wet;
      }
    }
    if (fx && fx.route === 'SEND' && !(ch === 2 && fx.returnTo === 'CH2')) {
      const s = Math.max(0, fx.send[ch]);
      if (s > 0) {
        for (let i = 0; i < n; i++) {
          sendL[i] += out.l[i] * s;
          sendR[i] += out.r[i] * s;
        }
      }
    }
    return out;
  };

  const bus = (busL: Float32Array, busR: Float32Array) => {
    if (!fx || !fxActive || fxDone) return;
    if (fx.route === 'SEND' && fx.returnTo === 'BUS') {
      const y = runFx(sendL, sendR, 0);
      const k = Math.max(0, fx.wet);
      for (let i = 0; i < n; i++) {
        busL[i] += y.l[i] * k;
        busR[i] += y.r[i] * k;
      }
    } else if (fx.route === 'MASTER') {
      const y = runFx(busL.slice(), busR.slice(), 0);
      const dw = fx.on ? dryWet(fx.wet) : { dry: 1, wet: dryWet(fx.wet).wet };
      for (let i = 0; i < n; i++) {
        busL[i] = busL[i] * dw.dry + y.l[i] * dw.wet;
        busR[i] = busR[i] * dw.dry + y.r[i] * dw.wet;
      }
    }
  };

  const safetyDb = () => {
    if (toneOnChannel(b)) safety = Math.min(safety, -9);
    report.safetyDb = safety;
    return safety;
  };

  const end = () => {
    void ch2Return;
    if (b.dvs?.on && b.dvs.control) report.scope = controlScope(b, t0);
    return { carry, report };
  };

  return { deck, sources, channelInput, channelPost, bus, safetyDb, end };
}

/**
 * What the DVS software sees of its control signal: ~48 ms of the turntable's
 * tone after the mixer's phono stage (+36 dB, its clip at full scale), as L/R
 * pairs (the ring a DVS program draws). Clean = a round ring; hum wobbles it;
 * a clipped (too hot) signal squares it; a dirty record fuzzes it; a stopped
 * platter is a dot in the middle.
 */
export function controlScope(b: Booth, t0: number): { l: number[]; r: number[] } {
  const tt = b.tt;
  const rate = tt.playing ? 1 + tt.pitch / 100 : 0;
  const cart = b.ttPreamp === 'PHONO' ? 1 / PHONO_G : 1;
  const into = b.plugs['tt.rcaL'] === 'ch1.phono.L' ? PHONO_G : 1;
  const noise = rng(0x5c0 + Math.round(t0));
  const l: number[] = [];
  const r: number[] = [];
  const N = Math.round(0.048 * SR);
  const hv = b.vinyl && !b.vinyl.gnd ? (HUM_V / CART_V) * 0.5 * 2.2 : 0;
  // a fractional stride, so the points fall all round the ring (not on the
  // same 16 phases of a 1 kHz tone at 48 kHz)
  for (let i = 0; i < N; i += 3.137) {
    const t = t0 + i / SR;
    const pos = tt.playing ? tt.posSec + (t - tt.at) * rate : tt.posSec;
    const ph = 2 * Math.PI * CONTROL_HZ * pos;
    const h = hv * Math.sin(2 * Math.PI * HUM_HZ * t);
    const dn = b.dvs?.dirty ? (noise() * 2 - 1) * 0.07 : 0;
    const clip = (x: number) => Math.max(-1, Math.min(1, x));
    l.push(clip((0.5 * rate * Math.sin(ph) + h + dn) * cart * into));
    r.push(clip((0.5 * rate * Math.cos(ph) + h * 0.6 + dn * 0.8) * cart * into));
  }
  return { l, r };
}

/** The effect's state `k` samples into a traced chunk (for carryAt). */
export function s2CarryAt(rep: S2Report | undefined, carry: S2Carry, k: number): S2Carry {
  return { fx: rep?.fxTrace ? fxReplay(rep.fxTrace, k) : carry.fx ? cloneFxCarry(carry.fx) : null, tt: null };
}
