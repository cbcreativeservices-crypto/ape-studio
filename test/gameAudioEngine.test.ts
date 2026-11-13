/**
 * Game Audio lab — the sound engine (src/screens/lab/gameaudio/engine/):
 * the SAME source text that runs in the web build and in a phone's hidden
 * web view, loaded here against a recording fake of the Web Audio API.
 *
 * What is pinned: the honesty rule (a start that cannot sound answers
 * `failed`, never `started`), the fixed output ceiling, and the music
 * arithmetic — one clock time for every stem, a change asked "on the next
 * bar" written at that bar's clock time, and a withdrawn change that never
 * sounds later. Real audibility is a device check, not this file.
 *
 * Audit 2 (2026-11-12) found that this file could not SEE five faults, because
 * the fake was too kind. It is stricter now, as a browser is:
 *   - a convolver REFUSES an impulse at another sample rate (F1);
 *   - a parameter's `value` is read off its automation at the clock's time,
 *     so a ramp cut short reads where it really is (F21, F22);
 *   - `disconnect(node)` removes one connection, as the platform does.
 * And it pins what was missing: a stinger that has BEGUN is stopped (F3), the
 * engine's own music restart is not announced as a stop (F5), the reverb
 * obeys the buses (F8), and nothing past full scale reaches the ceiling (F15).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GA_CLOSING_JS,
  GA_ENGINE_JS,
  GA_ENGINE_VERSION,
  GA_HRTF_TRIM,
  GA_LIMITER_THRESHOLD_DB,
  GA_LIMITER_TRIM,
  GA_LIMITER_MAKEUP,
  GA_OUTPUT_CEILING,
  gaEngineHtml,
  gaIsPageHello,
} from '../src/screens/lab/gameaudio/engine/gaEngineSource.ts';
import { GaEngine } from '../src/screens/lab/gameaudio/engine/gaEngine.ts';
import { gaSoundStateOf } from '../src/screens/lab/gameaudio/engine/gaSoundState.ts';
import { gaSound } from '../src/screens/lab/gameaudio/sounds/gaSoundBank.ts';
import { MUSIC_BEAT_S, MUSIC_STINGER_LEAD_S } from '../src/screens/lab/gameaudio/sounds/gaSynth.ts';
import { f32ToI16Base64, i16Base64ToF32, type GaCmd, type GaEvt } from '../src/screens/lab/gameaudio/engine/gaEngineProtocol.ts';
import { readFileSync } from 'node:fs';

// outputCeiling.ts imports the player register without an extension, so node
// cannot load it; the ceiling is read from its source text instead.
const CEILING_SRC = readFileSync(new URL('../src/features/audio/outputCeiling.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const CEILING_DB = Number(/PLAYBACK_CEILING_DB = (-?\d+(?:\.\d+)?)/.exec(CEILING_SRC)![1]);
const PLAYBACK_CEILING = 10 ** (CEILING_DB / 20);

/* ── a recording fake of the Web Audio API ─────────────────────────────── */

type Auto = { op: 'set' | 'ramp' | 'exp' | 'cancel'; v?: number; t: number };
type Ev = { op: 'set' | 'ramp' | 'exp'; v: number; t: number; from: number };
/** An AudioParam that keeps its automation and can say what it is worth at
 *  any clock time (`at`). Its `value` behaves as the platform's does (check
 *  E, problem 2): it is the value already COMPUTED, so an event scheduled at
 *  the current time or later is not in it yet: before a future event it is
 *  the intrinsic value (a gain node's 1). An engine that reads it to start a
 *  ramp from is caught here. */
class FakeParam {
  private base: number;
  private events: Ev[] = [];
  private clock: () => number;
  log: Auto[] = [];
  constructor(v: number, clock: () => number = () => 0) {
    this.base = v;
    this.clock = clock;
  }
  get value(): number {
    return this.at(this.clock() - 1e-9);
  }
  set value(v: number) {
    this.base = v;
    this.events = [];
  }
  /** The value at clock time t. */
  at(t: number): number {
    let v = this.base;
    let prevT = -Infinity;
    for (const e of this.events) {
      if (e.op === 'set') {
        if (e.t > t) break;
        v = e.v;
        prevT = e.t;
        continue;
      }
      const t0 = prevT === -Infinity ? e.from : prevT;
      if (t >= e.t) {
        v = e.v;
        prevT = e.t;
        continue;
      }
      if (t > t0) {
        const p = (t - t0) / (e.t - t0);
        v = e.op === 'exp' && v > 0 && e.v > 0 ? v * Math.pow(e.v / v, p) : v + (e.v - v) * p;
      }
      break;
    }
    return v;
  }
  private add(op: Ev['op'], v: number, t: number) {
    this.log.push({ op, v, t });
    this.events.push({ op, v, t, from: this.clock() });
    this.events.sort((a, b) => a.t - b.t);
  }
  setValueAtTime(v: number, t: number) {
    this.add('set', v, t);
  }
  linearRampToValueAtTime(v: number, t: number) {
    this.add('ramp', v, t);
  }
  exponentialRampToValueAtTime(v: number, t: number) {
    this.add('exp', v, t);
  }
  /** As the platform does it: every event at or after t is REMOVED (a ramp
   *  cut this way falls back to the value before it). */
  cancelScheduledValues(t: number) {
    this.log.push({ op: 'cancel', t });
    this.events = this.events.filter((e) => e.t < t);
  }
}
class FakeNode {
  kind: string;
  outs: FakeNode[] = [];
  [k: string]: unknown;
  constructor(kind: string) {
    this.kind = kind;
  }
  connect(n: FakeNode) {
    this.outs.push(n);
  }
  disconnect(n?: FakeNode) {
    this.outs = n ? this.outs.filter((x) => x !== n) : [];
  }
  /** Short in a failure message (the whole graph would be printed). */
  [Symbol.for('nodejs.util.inspect.custom')]() {
    return `<${this.kind} → ${this.outs.map((o) => o.kind).join(', ') || 'nothing'}>`;
  }
}
/** The node's outputs are exactly these nodes (by identity). */
function outsAre(n: FakeNode, want: FakeNode[], msg?: string) {
  assert.equal(n.outs.length, want.length, `${msg ?? ''} ${n.kind}: ${n.outs.length} outputs, ${want.length} expected`);
  for (const w of want) assert.ok(n.outs.includes(w), `${msg ?? ''} ${n.kind} is not connected to ${w.kind}`);
}
class FakeBuffer {
  data: Float32Array[];
  sampleRate: number;
  duration: number;
  length: number;
  numberOfChannels: number;
  constructor(ch: number, len: number, sr: number) {
    this.data = Array.from({ length: ch }, () => new Float32Array(len));
    this.sampleRate = sr;
    this.duration = len / sr;
    this.length = len;
    this.numberOfChannels = ch;
  }
  getChannelData(i: number) {
    return this.data[i];
  }
}
class FakeCtx {
  currentTime = 10;
  state = 'running';
  sampleRate = 48000;
  destination = new FakeNode('destination');
  onstatechange: (() => void) | null = null;
  made: FakeNode[] = [];
  private param = (v: number) => new FakeParam(v, () => this.currentTime);
  private mk(kind: string, extra: Record<string, unknown> = {}) {
    const n = new FakeNode(kind);
    Object.assign(n, extra);
    this.made.push(n);
    return n;
  }
  createGain() {
    return this.mk('gain', { gain: this.param(1) });
  }
  createBiquadFilter() {
    return this.mk('biquad', { frequency: this.param(350), Q: this.param(1), type: 'lowpass' });
  }
  createStereoPanner() {
    return this.mk('stereo', { pan: this.param(0) });
  }
  createPanner() {
    return this.mk('panner', { positionX: this.param(0), positionY: this.param(0), positionZ: this.param(0) });
  }
  createDynamicsCompressor() {
    return this.mk('limiter', {
      threshold: this.param(-24),
      knee: this.param(30),
      ratio: this.param(12),
      attack: this.param(0.003),
      release: this.param(0.25),
    });
  }
  createWaveShaper() {
    return this.mk('shaper', { curve: null, oversample: 'none' });
  }
  createAnalyser() {
    return this.mk('analyser', { fftSize: 2048, getFloatTimeDomainData: (a: Float32Array) => a.fill(0) });
  }
  createChannelSplitter() {
    return this.mk('splitter');
  }
  /** A convolver takes an impulse at the CONTEXT's rate and no other: the
   *  platform throws, and so does this (the fault of audit 2, F1). */
  createConvolver() {
    const n = this.mk('convolver');
    const rate = this.sampleRate;
    let held: FakeBuffer | null = null;
    Object.defineProperty(n, 'buffer', {
      configurable: true,
      get: () => held,
      set: (b: FakeBuffer | null) => {
        if (b && b.sampleRate !== rate) throw new Error(`The buffer sample rate of ${b.sampleRate} does not match the context rate of ${rate} Hz.`);
        held = b;
      },
    });
    return n;
  }
  createBuffer(ch: number, len: number, sr: number) {
    return new FakeBuffer(ch, len, sr);
  }
  createBufferSource() {
    const n = this.mk('source', { playbackRate: this.param(1), loop: false, buffer: null, onended: null, started: null, stopped: null });
    n.start = (t: number) => {
      n.started = t;
    };
    n.stop = (t: number) => {
      n.stopped = t;
    };
    return n;
  }
  resume() {
    this.state = 'running';
    this.onstatechange?.();
  }
  suspend() {
    this.state = 'suspended';
    this.onstatechange?.();
  }
  close() {
    this.state = 'closed';
  }
}

type Timer = { id: number; f: () => void; ms: number; live: boolean };
function rig(state: 'running' | 'suspended' = 'running', sampleRate = 48000) {
  const g: Record<string, unknown> = { atob: (s: string) => atob(s) };
  new Function('window', GA_ENGINE_JS)(g);
  const events: GaEvt[] = [];
  const timers: Timer[] = [];
  let ctx!: FakeCtx;
  class AC extends FakeCtx {
    constructor() {
      super();
      this.state = state;
      this.sampleRate = sampleRate;
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      ctx = this;
    }
    resume() {
      /* a blocked context stays blocked until the test resumes it */
    }
  }
  const create = g.__gaCreateEngine as (o: Record<string, unknown>) => { handle: (m: GaCmd) => void };
  const eng = create({
    post: (m: GaEvt) => events.push(m),
    AudioContext: AC,
    setTimeout: (f: () => void, ms: number) => {
      timers.push({ id: timers.length + 1, f, ms, live: true });
      return timers.length;
    },
    clearTimeout: (id: number) => {
      const t = timers.find((x) => x.id === id);
      if (t) t.live = false;
    },
  });
  const send = (m: GaCmd) => eng.handle(m);
  const of = <K extends GaEvt['e']>(e: K) => events.filter((x) => x.e === e) as Extract<GaEvt, { e: K }>[];
  const fire = (pred: (t: Timer) => boolean) => {
    for (const t of timers.filter((x) => x.live && pred(x))) {
      t.live = false;
      t.f();
    }
  };
  const tone = (n = 480) => Float32Array.from({ length: n }, (_, i) => Math.sin(i / 5) * 0.5);
  return { send, events, of, timers, fire, tone, ctx: () => ctx };
}

const sources = (c: FakeCtx) => c.made.filter((n) => n.kind === 'source');
const kind = (c: FakeCtx, k: string) => c.made.filter((n) => n.kind === k);
const gainOf = (n: FakeNode) => n.gain as FakeParam;
const lim0 = (c: FakeCtx) => c.made.find((n) => n.kind === 'limiter')!;
/** The engine makes the six bus gains in protocol order, each wired to the
 *  pre-master; the pre-master is the first gain the engine makes. */
const BUS_ORDER = ['ambience', 'sfx', 'dialogue', 'music', 'ui', 'chat'];
function busOf(c: FakeCtx, bus: string): FakeNode {
  const pre = c.made.find((n) => n.kind === 'gain')!;
  const conv = c.made.find((n) => n.kind === 'convolver')!;
  const ret = conv.outs[0];
  const all = c.made.filter((n) => n.kind === 'gain' && n !== ret && n.outs.length === 1 && n.outs[0] === pre);
  return all[BUS_ORDER.indexOf(bus)];
}
/** What the platform's wave shaper does with one sample (Web Audio spec). */
function shape(curve: Float32Array, x: number): number {
  const n = curve.length;
  const v = ((n - 1) / 2) * (x + 1);
  if (v <= 0) return curve[0];
  if (v >= n - 1) return curve[n - 1];
  const k = Math.floor(v);
  const f = v - k;
  return (1 - f) * curve[k] + f * curve[k + 1];
}

describe('the engine is one source text for both transports', () => {
  it('is free of template syntax and the web-view page carries it whole', () => {
    assert.ok(!GA_ENGINE_JS.includes('${'), 'no interpolation inside the String.raw text');
    assert.ok(gaEngineHtml().includes(GA_ENGINE_JS));
    assert.ok(gaEngineHtml().includes('ReactNativeWebView.postMessage'));
  });
  it('holds the house output ceiling (−12 dBFS), applied once, last', () => {
    assert.ok(Math.abs(GA_OUTPUT_CEILING - PLAYBACK_CEILING) < 1e-12);
    const r = rig();
    r.send({ t: 'init' });
    const c = r.ctx();
    const last = c.made.find((n) => n.outs.includes(c.destination))!;
    assert.equal(last.kind, 'gain');
    assert.ok(Math.abs((last.gain as FakeParam).value - PLAYBACK_CEILING) < 1e-9);
    assert.equal(c.made.filter((n) => n.outs.includes(c.destination)).length, 1, 'one path to the device');
    const lim = c.made.find((n) => n.kind === 'limiter')!;
    const stopNode = c.made.find((n) => n.kind === 'shaper')!;
    assert.equal(lim.outs.length, 1, 'the limiter feeds its make-up trim and nothing else');
    const trim = lim.outs[0];
    assert.ok(Math.abs((trim.gain as FakeParam).value - GA_LIMITER_TRIM) < 1e-12, 'the trim takes the make-up gain back');
    outsAre(trim, [stopNode], 'the trim feeds the hard stop and nothing else');
    assert.ok(stopNode.outs.includes(last), 'the hard stop sits before the ceiling');
  });
  it('the device is never handed more than −12.0 dBFS: a hard stop at full scale follows the limiter (F15)', () => {
    const r = rig();
    r.send({ t: 'init' });
    const c = r.ctx();
    const stopNode = kind(c, 'shaper')[0];
    const curve = stopNode.curve as Float32Array;
    assert.ok(curve.length >= 2);
    assert.equal(curve[0], -1);
    assert.equal(curve[curve.length - 1], 1);
    // inside full scale a sample leaves as it came (to well under one 24-bit step)…
    for (const x of [-1, -0.999, -0.5, -1e-4, 0, 1e-4, 0.25, 0.7071, 0.999, 1]) assert.ok(Math.abs(shape(curve, x) - x) < 1e-7, `sample ${x}`);
    // …and one beyond it leaves AT full scale: the limiter's overshoot measured
    // +1.9 dBFS here (−10.1 dBFS at the device); after the ceiling that is −12.0
    for (const x of [1.0001, 1.245, 4, -1.0001, -1.245, -4]) {
      const y = shape(curve, x) * GA_OUTPUT_CEILING;
      assert.ok(20 * Math.log10(Math.abs(y)) <= CEILING_DB + 1e-9, `sample ${x} leaves at ${(20 * Math.log10(Math.abs(y))).toFixed(3)} dBFS`);
    }
    // the meter reads what is past the stop, so the readout and the device agree
    assert.ok(stopNode.outs.some((n) => n.kind === 'analyser') && stopNode.outs.some((n) => n.kind === 'splitter'));
    assert.ok(!lim0(c).outs.some((n) => n.kind === 'analyser') && !lim0(c).outs[0].outs.some((n) => n.kind === 'analyser'), 'no tap before the stop');
  });
  it('carries its version, so a page holding an older engine text replaces it', () => {
    const g: Record<string, unknown> = {};
    new Function('window', GA_ENGINE_JS)(g);
    assert.equal(g.__gaEngineVersion, GA_ENGINE_VERSION);
  });
});

describe('a start is a request: the engine answers started or failed', () => {
  it('fails honestly with no engine, a blocked engine, a missing sound, a wrong bus', () => {
    const cold = rig();
    cold.send({ t: 'start', v: 'a', buf: 'door', bus: 'sfx', gain: 1, mode: 'none' });
    assert.deepEqual(cold.of('failed').map((f) => f.why), ['no-context']);

    const blocked = rig('suspended');
    blocked.send({ t: 'init' });
    assert.equal(blocked.of('ready')[0].state, 'suspended');
    blocked.send({ t: 'buffer', id: 'door', sr: 48000, f32: [blocked.tone()] });
    blocked.send({ t: 'start', v: 'a', buf: 'door', bus: 'sfx', gain: 1, mode: 'none' });
    assert.deepEqual(blocked.of('failed').map((f) => f.why), ['suspended']);
    assert.equal(blocked.of('started').length, 0);
    assert.equal(sources(blocked.ctx()).length, 0, 'nothing was scheduled behind the learner');

    const r = rig();
    r.send({ t: 'init' });
    r.send({ t: 'start', v: 'a', buf: 'nope', bus: 'sfx', gain: 1, mode: 'none' });
    r.send({ t: 'buffer', id: 'door', sr: 48000, f32: [r.tone()] });
    r.send({ t: 'start', v: 'b', buf: 'door', bus: 'nowhere' as never, gain: 1, mode: 'none' });
    assert.deepEqual(r.of('failed').map((f) => [f.v, f.why]), [['a', 'missing-buffer'], ['b', 'bad-bus']]);
  });
  it('a good start reports the audio-clock time it sounds at, delay included', () => {
    const r = rig();
    r.send({ t: 'init' });
    r.send({ t: 'buffer', id: 'door', sr: 48000, f32: [r.tone()] });
    assert.deepEqual(r.of('buffer').map((b) => [b.id, b.ok]), [['door', true]]);
    r.send({ t: 'start', v: 'd1', buf: 'door', bus: 'sfx', gain: 0.5, mode: 'stereo', pan: -0.4 });
    r.send({ t: 'start', v: 'd2', buf: 'door', bus: 'sfx', gain: 0.5, mode: 'none', delay: 0.18 });
    const st = r.of('started');
    assert.deepEqual(st.map((s) => [s.v, +s.at.toFixed(3)]), [['d1', 10], ['d2', 10.18]]);
    const [a, b] = sources(r.ctx());
    assert.equal(a.started, 10);
    assert.equal(b.started, 10.18);
    const pan = r.ctx().made.find((n) => n.kind === 'stereo')!;
    assert.equal((pan.pan as FakeParam).value, -0.4);
  });
  it('a natural end and a stop are told apart; stop fades, never cuts', () => {
    const r = rig();
    r.send({ t: 'init' });
    r.send({ t: 'buffer', id: 'hum', sr: 48000, f32: [r.tone()] });
    r.send({ t: 'start', v: 'm1', buf: 'hum', bus: 'sfx', gain: 1, mode: 'none', loop: true });
    r.send({ t: 'start', v: 'm2', buf: 'hum', bus: 'sfx', gain: 1, mode: 'none' });
    const [s1, s2] = sources(r.ctx());
    assert.equal(s1.loop, true);
    r.send({ t: 'stop', v: 'm1', fade: 0.2 });
    assert.ok((s1.stopped as number) > 10.2, 'stops after its fade');
    (s1.onended as () => void)();
    (s2.onended as () => void)();
    assert.deepEqual(r.of('ended').map((e) => [e.v, e.why]), [['m1', 'stopped'], ['m2', 'natural']]);
  });
  it('a parameter change replaces the pending ramp instead of stacking one', () => {
    const r = rig();
    r.send({ t: 'init' });
    r.send({ t: 'buffer', id: 'hum', sr: 48000, f32: [r.tone()] });
    r.send({ t: 'start', v: 'm1', buf: 'hum', bus: 'sfx', gain: 1, mode: 'none', loop: true });
    const src = sources(r.ctx())[0];
    r.send({ t: 'set', v: 'm1', rate: 1.5, ramp: 0.3 });
    r.send({ t: 'set', v: 'm1', rate: 0.8, ramp: 0.3 });
    const log = (src.playbackRate as FakeParam).log;
    assert.equal(log.filter((x) => x.op === 'cancel').length, 2);
    assert.equal(log[log.length - 1].v, 0.8);
    assert.equal(src.started, 10, 'the SAME voice: it was never restarted');
    assert.equal(sources(r.ctx()).length, 1);
  });
});

describe('music runs on the audio clock (96 BPM, 4/4, four-bar phrase)', () => {
  const START: GaCmd = {
    t: 'music',
    op: 'start',
    bpm: 96,
    beatsPerBar: 4,
    barsPerPhrase: 4,
    stems: [
      { id: 'calm', buf: 's1', gain: 1 },
      { id: 'pulse', buf: 's2', gain: 0 },
      { id: 'drive', buf: 's3', gain: 0 },
    ],
  };
  function playing() {
    const r = rig();
    r.send({ t: 'init' });
    for (const id of ['s1', 's2', 's3', 'sting']) r.send({ t: 'buffer', id, sr: 48000, f32: [r.tone()] });
    r.send(START);
    return r;
  }
  it('0.625 s per beat, 2.5 s per bar, 10 s per phrase; every stem on ONE start time', () => {
    const r = playing();
    const m = r.of('music')[0] as Extract<GaEvt, { e: 'music'; what: 'started' }>;
    assert.deepEqual([m.beat, m.bar, m.phrase], [0.625, 2.5, 10]);
    const starts = sources(r.ctx()).map((s) => s.started);
    assert.equal(starts.length, 3);
    assert.ok(starts.every((t) => t === m.at), 'one clock time');
    assert.ok(sources(r.ctx()).every((s) => s.loop === true));
  });
  it('a change asked mid-bar lands exactly on the next bar line', () => {
    const r = playing();
    const t0 = (r.of('music')[0] as { at: number }).at;
    r.ctx().currentTime = t0 + 3.1; // 0.6 s into bar 2
    r.send({ t: 'music', op: 'layers', req: 'q1', at: 'bar', gains: { pulse: 1 } });
    const q = r.of('music').find((x) => x.what === 'queued') as Extract<GaEvt, { e: 'music'; what: 'queued' }>;
    assert.ok(Math.abs(q.at - (t0 + 5)) < 1e-9);
    assert.ok(Math.abs(q.inS - 1.9) < 1e-9);
    const pulse = r.ctx().made.filter((n) => n.kind === 'gain' && (n.gain as FakeParam).log.some((l) => l.t === q.at));
    assert.equal(pulse.length, 1, 'only the asked stem moves');
    const log = (pulse[0].gain as FakeParam).log;
    assert.deepEqual(log.map((l) => [l.op, l.v, +(l.t - t0).toFixed(3)]), [['cancel', undefined, 5], ['set', 0, 5], ['ramp', 1, 5.03]]);
    const g = pulse[0].gain as FakeParam;
    assert.equal(g.at(t0 + 4.99), 0, 'held until the line');
    assert.equal(g.at(t0 + 5.03), 1);
    assert.equal(r.of('music').filter((x) => x.what === 'applied').length, 0, 'not applied until the boundary passes');
    r.fire((t) => t.ms > 1000);
    assert.deepEqual(r.of('music').filter((x) => x.what === 'applied').map((x) => (x as { req: string }).req), ['q1']);
  });
  it('too close to a line to promise it: the change takes the following one', () => {
    const r = playing();
    const t0 = (r.of('music')[0] as { at: number }).at;
    r.ctx().currentTime = t0 + 4.97;
    r.send({ t: 'music', op: 'layers', req: 'q1', at: 'bar', gains: { pulse: 1 } });
    const q = r.of('music').find((x) => x.what === 'queued') as { at: number };
    assert.ok(Math.abs(q.at - (t0 + 7.5)) < 1e-9);
    r.ctx().currentTime = t0 + 5.2;
    r.send({ t: 'music', op: 'layers', req: 'q2', at: 'beat', gains: { drive: 1 } });
    const q2 = r.of('music').filter((x) => x.what === 'queued')[1] as { at: number };
    assert.ok(Math.abs(q2.at - (t0 + 5.625)) < 1e-9);
    r.send({ t: 'music', op: 'layers', req: 'q3', at: 'phrase', gains: { drive: 0 } });
    const q3 = r.of('music').filter((x) => x.what === 'queued')[2] as { at: number };
    assert.ok(Math.abs(q3.at - (t0 + 10)) < 1e-9);
  });
  it('a withdrawn change never sounds later: gains restored, stinger unscheduled, no report', () => {
    const r = playing();
    const t0 = (r.of('music')[0] as { at: number }).at;
    r.ctx().currentTime = t0 + 0.5;
    r.send({ t: 'music', op: 'layers', req: 'q1', at: 'bar', gains: { pulse: 1, drive: 1 } });
    r.send({ t: 'music', op: 'stinger', req: 's1', at: 'bar', buf: 'sting', gain: 0.8 });
    const sting = sources(r.ctx())[3];
    assert.ok(Math.abs((sting.started as number) - (t0 + 2.5)) < 1e-9, 'the stinger waits for the bar');
    r.send({ t: 'music', op: 'cancel', req: 'q1' });
    r.send({ t: 'music', op: 'cancel', req: 's1' });
    assert.equal(sting.stopped, 0, 'unscheduled before it started');
    r.fire(() => true);
    assert.equal(r.of('music').filter((x) => x.what === 'applied').length, 0);
    assert.deepEqual(r.of('music').filter((x) => x.what === 'cancelled').map((x) => (x as { req: string }).req), ['q1', 's1']);
    const stemGains = r.ctx().made.filter((n) => n.kind === 'gain' && n.outs.length === 1 && (n.gain as FakeParam).log.some((l) => l.op === 'cancel'));
    assert.equal(stemGains.length, 2);
    for (const g of stemGains) assert.equal((g.gain as FakeParam).value, 0, 'back to the gain it had');
  });
  it('STOP ALL silences voices, stems and everything still waiting', () => {
    const r = playing();
    const t0 = (r.of('music')[0] as { at: number }).at;
    r.ctx().currentTime = t0 + 0.5;
    r.send({ t: 'start', v: 'm1', buf: 's1', bus: 'sfx', gain: 1, mode: 'none', loop: true });
    r.send({ t: 'music', op: 'stinger', req: 's1', at: 'phrase', buf: 'sting', gain: 0.8 });
    r.send({ t: 'stopAll' });
    for (const s of sources(r.ctx())) assert.notEqual(s.stopped, null, 'every source has a stop time');
    r.fire(() => true);
    assert.equal(r.of('music').filter((x) => x.what === 'applied').length, 0);
    assert.equal(r.of('music').filter((x) => x.what === 'stopped').length, 1);
  });
});

describe('voices: placement, filter, and letting go', () => {
  function withLoop() {
    const r = rig();
    r.send({ t: 'init' });
    r.send({ t: 'buffer', id: 'hum', sr: 48000, f32: [r.tone()] });
    return r;
  }
  it('the 3D renderer is trimmed by 2.5 dB against the stereo pan; neither is restarted to change (F26)', () => {
    assert.equal(GA_HRTF_TRIM, 0.75);
    const r = withLoop();
    r.send({ t: 'start', v: 'a', buf: 'hum', bus: 'sfx', gain: 0.5, mode: 'stereo', pan: 0.3, loop: true });
    const c = r.ctx();
    const src = sources(c)[0];
    const sfx = c.made.find((n) => n.kind === 'gain' && n.outs.some((o) => o.kind === 'gain') && c.made.indexOf(n) > 0 && (n as FakeNode) === busOf(c, 'sfx'))!;
    const stereo = kind(c, 'stereo')[0];
    const placedA = stereo.outs[0];
    assert.equal(gainOf(placedA).value, 1, 'stereo placement at unity');
    outsAre(placedA, [sfx]);

    // the renderer changes under a LIVING voice
    c.currentTime = 12;
    r.send({ t: 'set', v: 'a', mode: 'hrtf', pos: [1, 0, -1] });
    assert.equal(sources(c).length, 1, 'no new source');
    assert.equal(src.started, 10, 'the loop keeps its place');
    assert.equal(src.stopped, null);
    const panner = kind(c, 'panner')[0];
    const placedB = panner.outs[0];
    outsAre(placedB, [sfx]);
    assert.equal((panner.positionX as FakeParam).value, 1);
    // a cross-fade: the old placement falls as the new one rises to the trim
    assert.equal(gainOf(placedA).at(12), 1);
    assert.equal(gainOf(placedB).at(12), 0);
    assert.ok(Math.abs(gainOf(placedA).at(12.015) - 0.5) < 1e-9);
    assert.equal(gainOf(placedA).at(12.03), 0);
    assert.ok(Math.abs(gainOf(placedB).at(12.03) - GA_HRTF_TRIM) < 1e-12);
    // then the old placement is let go
    r.fire((t) => t.ms > 40 && t.ms < 100);
    outsAre(placedA, []);
    outsAre(stereo, []);
    // the same request again changes nothing
    const made = c.made.length;
    r.send({ t: 'set', v: 'a', mode: 'hrtf', pos: [0, 0, -1] });
    assert.equal(c.made.length, made);
    assert.equal((panner.positionX as FakeParam).at(12.1), 0);

    // a voice STARTED in 3D carries the trim from its first sample
    r.send({ t: 'start', v: 'b', buf: 'hum', bus: 'sfx', gain: 1, mode: 'hrtf', pos: [0, 0, -1] });
    assert.equal(gainOf(kind(c, 'panner')[1].outs[0]).value, GA_HRTF_TRIM);
  });
  it('the wall filter moves in equal steps of PITCH, not of hertz (F27)', () => {
    const r = withLoop();
    r.send({ t: 'start', v: 'a', buf: 'hum', bus: 'sfx', gain: 1, mode: 'none', loop: true, lowpass: 900 });
    const f = kind(r.ctx(), 'biquad')[0].frequency as FakeParam;
    r.send({ t: 'set', v: 'a', lowpass: 20000, ramp: 0.25 });
    assert.deepEqual(f.log.slice(-2).map((l) => l.op), ['set', 'exp']);
    // halfway through the move the corner is at the geometric middle
    // (4243 Hz), not at the straight-line middle (10 450 Hz)
    const mid = f.at(10.125);
    assert.ok(Math.abs(mid - Math.sqrt(900 * 20000)) < 1, `${mid.toFixed(0)} Hz`);
    r.send({ t: 'set', v: 'a', gain: 0.5, ramp: 0.25 });
    const g = sources(r.ctx())[0].outs[0].outs[0];
    assert.equal(gainOf(g).log[gainOf(g).log.length - 1].op, 'ramp', 'a GAIN still moves in a straight line');
  });
  it('a finished voice lets go of the shared graph, and so does one replaced under the same id (F29)', () => {
    const r = withLoop();
    r.send({ t: 'start', v: 'a', buf: 'hum', bus: 'sfx', gain: 1, mode: 'stereo', loop: true, rev: 0.3 });
    r.send({ t: 'start', v: 'a', buf: 'hum', bus: 'sfx', gain: 1, mode: 'stereo', loop: true, rev: 0.3 });
    const c = r.ctx();
    const [first, second] = sources(c);
    assert.ok((first.stopped as number) > 10, 'the first copy was faded out');
    const tails = (src: FakeNode) => {
      const g = src.outs[0].outs[0];
      return { g, stereo: g.outs.find((o) => o.kind === 'stereo')!, send: g.outs.find((o) => o.kind === 'gain')! };
    };
    const a = tails(first);
    const b = tails(second);
    const placed = a.stereo.outs[0];
    (first.onended as () => void)();
    for (const n of [a.g, placed, a.send]) outsAre(n, [], 'the replaced copy is unplugged:');
    assert.equal(r.of('ended').length, 0, 'and says nothing: its id lives on in the new copy');
    assert.equal(b.send.outs.length, 1, 'the new copy is untouched');
    r.send({ t: 'stop', v: 'a' });
    (second.onended as () => void)();
    for (const n of [b.g, b.send]) outsAre(n, []);
    assert.deepEqual(r.of('ended').map((e) => [e.v, e.why]), [['a', 'stopped']]);
  });
});

describe('the room reverb', () => {
  const sfxStart: GaCmd = { t: 'start', v: 'g1', buf: 'hum', bus: 'sfx', gain: 1, mode: 'stereo', loop: true, rev: 0.28 };
  it('the bank\'s own impulse loads on a 48 000, 44 100 and 24 000 Hz device, and the command is answered (F1)', () => {
    const ir = gaSound('ir_room')!;
    // authored at 48 kHz (check E, problem 9): most devices need no conversion
    assert.equal(ir.sr, 48000, 'the impulse is authored at 48 kHz');
    for (const rate of [48000, 44100, 24000]) {
      const r = rig('running', rate);
      r.send({ t: 'init' });
      r.send({ t: 'buffer', id: 'ir_room', sr: ir.sr, f32: ir.ch });
      r.send({ t: 'reverb', buf: 'ir_room', gain: 0.9 });
      assert.deepEqual(r.of('error'), [], `no error at ${rate} Hz`);
      assert.deepEqual(r.of('reverb'), [{ e: 'reverb', ok: true }]);
      const c = r.ctx();
      const conv = kind(c, 'convolver')[0];
      const held = conv.buffer as FakeBuffer;
      assert.equal(held.sampleRate, rate, 'at the device rate');
      assert.equal(held.numberOfChannels, 2);
      assert.equal(held.length, Math.round((ir.ch[0].length * rate) / 48000));
      assert.ok(Math.abs(held.duration - 1.5) < 1e-3, 'the same 1.5 s');
      // a 24 kHz device steps DOWN: every other sample of the source
      if (rate === 24000) {
        const x = ir.ch[0];
        const y = held.getChannelData(0);
        for (const i of [100, 1001, 9000]) assert.ok(Math.abs(y[i] - x[2 * i]) < 1e-6, `sample ${i}`);
      }
      const ret = conv.outs[0];
      assert.equal(gainOf(ret).at(c.currentTime + 0.05), 0.9, 'the return is opened');
    }
  });
  it('an impulse at another rate is converted: a straight line between neighbors', () => {
    const r = rig('running', 48000);
    r.send({ t: 'init' });
    const x = Float32Array.from({ length: 2400 }, (_, i) => Math.sin(i / 7) * Math.exp(-i / 800));
    r.send({ t: 'buffer', id: 'ir24', sr: 24000, f32: [x, x] });
    r.send({ t: 'reverb', buf: 'ir24', gain: 0.9 });
    assert.deepEqual(r.of('reverb'), [{ e: 'reverb', ok: true }]);
    const y = (kind(r.ctx(), 'convolver')[0].buffer as FakeBuffer).getChannelData(0);
    assert.equal(y.length, 4800);
    for (const i of [200, 2001, 3000, 4001]) {
      const want = i % 2 ? (x[(i - 1) / 2] + x[(i + 1) / 2]) / 2 : x[i / 2];
      assert.ok(Math.abs(y[i] - want) < 1e-6, `sample ${i}`);
    }
  });
  it('says so when there is no reverb: a missing impulse, an engine not started, an impulse the device refuses', () => {
    const cold = rig();
    cold.send({ t: 'reverb', buf: 'ir_room', gain: 0.9 });
    assert.deepEqual(cold.of('reverb'), [{ e: 'reverb', ok: false, why: 'no-context' }]);
    const r = rig();
    r.send({ t: 'init' });
    r.send({ t: 'reverb', buf: 'ir_room', gain: 0.9 });
    assert.deepEqual(r.of('reverb'), [{ e: 'reverb', ok: false, why: 'missing-buffer' }]);
    // a device whose convolver refuses even a converted impulse
    r.send({ t: 'buffer', id: 'ir_room', sr: 48000, f32: [r.tone()] });
    const conv = kind(r.ctx(), 'convolver')[0];
    Object.defineProperty(conv, 'buffer', {
      configurable: true,
      get: () => null,
      set: () => {
        throw new Error('no convolver here');
      },
    });
    r.send({ t: 'reverb', buf: 'ir_room', gain: 0.9 });
    const last = r.of('reverb')[1];
    assert.equal(last.ok, false);
    assert.match(last.why ?? '', /no convolver here/);
    assert.equal(gainOf(conv.outs[0]).at(r.ctx().currentTime + 1), 0, 'the return stays shut');
    // and the lab's handle on the engine keeps the answer for the screen
    const eng = new GaEngine();
    assert.equal(eng.reverbOk, null);
    eng.receive({ e: 'reverb', ok: false, why: 'no convolver here' });
    assert.equal(eng.reverbOk, false);
    assert.match(eng.lastError ?? '', /reverb/);
    eng.receive({ e: 'reverb', ok: true });
    assert.equal(eng.reverbOk, true);
  });
  it('obeys MUTE, SOLO, the faders and the duck: each bus has its own way into the reverb (F8)', () => {
    const r = rig();
    r.send({ t: 'init' });
    r.send({ t: 'buffer', id: 'hum', sr: 48000, f32: [r.tone()] });
    r.send(sfxStart);
    r.send({ t: 'start', v: 'd1', buf: 'hum', bus: 'dialogue', gain: 1, mode: 'none', rev: 0.2 });
    const c = r.ctx();
    const conv = kind(c, 'convolver')[0];
    const revIn = c.made.find((n) => n.outs.includes(conv))!;
    const sends = c.made.filter((n) => n.kind === 'gain' && n.outs.length === 1 && n.outs[0] === revIn);
    assert.equal(sends.length, 6, 'one reverb send per bus');
    const voiceSend = (src: FakeNode) => src.outs[0].outs[0].outs.find((o) => o.kind === 'gain' && gainOf(o).value < 0.5)!;
    const [g1, d1] = sources(c);
    const sfxSend = voiceSend(g1).outs[0];
    const dlgSend = voiceSend(d1).outs[0];
    assert.ok(sends.includes(sfxSend) && sends.includes(dlgSend) && sfxSend !== dlgSend);
    assert.ok(!voiceSend(g1).outs.includes(revIn), 'no voice reaches the reverb around its bus');
    // MUTE the effects bus: its dry path AND its way into the reverb close
    r.send({ t: 'bus', bus: 'sfx', gain: 0, ramp: 0.05 });
    const sfx = busOf(c, 'sfx');
    assert.equal(gainOf(sfx).at(10.05), 0);
    assert.equal(gainOf(sfxSend).at(10.05), 0, 'the muted bus sends nothing to the reverb');
    assert.equal(gainOf(dlgSend).at(10.05), 1, 'another bus is untouched');
    // the duck (−10 dB on music) reaches the wet sound as it reaches the dry
    r.send({ t: 'bus', bus: 'music', gain: 0.316, ramp: 0.12 });
    const music = busOf(c, 'music');
    const musicSend = sends.find((n) => n !== sfxSend && Math.abs(gainOf(n).at(10.12) - 0.316) < 1e-9)!;
    assert.ok(musicSend, 'the music send followed the duck');
    assert.ok(Math.abs(gainOf(music).at(10.12) - 0.316) < 1e-9);
  });
  it('STOP ALL ends the tail too; a sound started right after it has its room at once (check E, problem 8)', () => {
    const r = rig();
    r.send({ t: 'init' });
    r.send({ t: 'buffer', id: 'hum', sr: 48000, f32: [r.tone()] });
    r.send({ t: 'buffer', id: 'ir', sr: 24000, f32: [r.tone(), r.tone()] });
    r.send({ t: 'reverb', buf: 'ir', gain: 0.9 });
    r.send(sfxStart);
    const c = r.ctx();
    c.currentTime = 11;
    const old = kind(c, 'convolver')[0];
    const oldRet = old.outs[0];
    const oldIn = c.made.find((n) => n.outs.includes(old))!;
    const held = old.buffer;
    const voiceSend = sources(c)[0].outs[0].outs[0].outs.find((o) => o.kind === 'gain' && gainOf(o).at(11) > 0.2 && gainOf(o).at(11) < 0.3)!;
    r.send({ t: 'stopAll', fade: 0.03 });
    // the old reverb (and its tail) fades out with the fade…
    assert.equal(gainOf(oldRet).at(11.03), 0, 'the old return is shut by the end of the fade');
    // …and a fresh one takes every bus send now, return open
    const fresh = kind(c, 'convolver')[1];
    assert.ok(fresh && fresh !== old, 'a fresh convolver at once');
    assert.equal(fresh.buffer, held, 'the same impulse, already at the device rate');
    const freshIn = c.made.find((n) => n.outs.includes(fresh))!;
    const sends = c.made.filter((n) => n.kind === 'gain' && n.outs.includes(freshIn));
    assert.equal(sends.length, 6, 'all six bus sends feed the fresh reverb');
    assert.ok(!c.made.some((n) => n.outs.includes(oldIn)), 'and none the old one');
    const freshRet = fresh.outs[0];
    assert.equal(gainOf(freshRet).at(11), 0.9, 'its return is open from the first sample');
    // the stopped voice sends nothing into the fresh reverb
    assert.equal(gainOf(voiceSend).at(11), 0, 'the stopped voice\'s send is closed at once');
    // a sound started 5 ms after STOP ALL is heard in the room
    c.currentTime = 11.005;
    r.send({ ...sfxStart, v: 'g2' } as GaCmd);
    const g2send = sources(c)[1].outs[0].outs[0].outs.find((o) => o.kind === 'gain' && gainOf(o).at(11.01) > 0.2 && gainOf(o).at(11.01) < 0.3)!;
    assert.ok(g2send.outs.some((n) => sends.includes(n)), 'its send goes to a bus send of the fresh reverb');
    // the old chain is let go after the fade
    c.currentTime = 11.05;
    r.fire((t) => t.ms > 40 && t.ms < 100);
    outsAre(old, [], 'the old convolver (and its tail) is unplugged');
    outsAre(oldRet, [], 'the old return is unplugged');
  });
  it('a reverb nothing has fed is left alone by STOP ALL', () => {
    const r = rig();
    r.send({ t: 'init' });
    r.send({ t: 'buffer', id: 'hum', sr: 48000, f32: [r.tone()] });
    r.send({ t: 'buffer', id: 'ir', sr: 48000, f32: [r.tone(), r.tone()] });
    r.send({ t: 'reverb', buf: 'ir', gain: 0.9 });
    r.send({ t: 'start', v: 'dry', buf: 'hum', bus: 'sfx', gain: 1, mode: 'none', loop: true });
    r.send({ t: 'stopAll', fade: 0.03 });
    assert.equal(kind(r.ctx(), 'convolver').length, 1);
  });
});

describe('stingers: tracked from the moment they are scheduled to their last sample', () => {
  const START: GaCmd = {
    t: 'music',
    op: 'start',
    bpm: 96,
    beatsPerBar: 4,
    barsPerPhrase: 4,
    stems: [
      { id: 'calm', buf: 's1', gain: 1 },
      { id: 'pulse', buf: 's2', gain: 0 },
      { id: 'drive', buf: 's3', gain: 0 },
    ],
  };
  function playing() {
    const r = rig();
    r.send({ t: 'init' });
    for (const id of ['s1', 's2', 's3']) r.send({ t: 'buffer', id, sr: 48000, f32: [r.tone()] });
    // a 2.4 s stinger, as the bank's is
    r.send({ t: 'buffer', id: 'sting', sr: 48000, f32: [r.tone(Math.round(2.4 * 48000))] });
    r.send(START);
    const t0 = (r.of('music')[0] as { at: number }).at;
    return { r, t0, c: r.ctx() };
  }
  const stingerEvents = (r: ReturnType<typeof rig>) => r.of('music').filter((x) => x.what === 'stinger') as Extract<GaEvt, { e: 'music'; what: 'stinger' }>[];
  const levelNow = (r: ReturnType<typeof rig>) => {
    r.fire((t) => t.ms === 180);
    const lv = r.of('level');
    return lv[lv.length - 1];
  };

  it('the lead is half a beat (0.3125 s), and the file starts that much BEFORE the line so its hit lands on it (F9)', () => {
    assert.equal(MUSIC_STINGER_LEAD_S, 0.3125);
    assert.equal(MUSIC_STINGER_LEAD_S, MUSIC_BEAT_S / 2);
    const { r, t0, c } = playing();
    c.currentTime = t0 + 0.5;
    r.send({ t: 'music', op: 'stinger', req: 'a', at: 'bar', buf: 'sting', gain: 0.9, lead: MUSIC_STINGER_LEAD_S });
    const qa = r.of('music').find((x) => x.what === 'queued') as Extract<GaEvt, { e: 'music'; what: 'queued' }>;
    assert.ok(Math.abs(qa.at - (t0 + 2.5)) < 1e-9, 'the HIT is promised on the bar line');
    assert.ok(Math.abs((sources(c)[3].started as number) - (t0 + 2.5 - 0.3125)) < 1e-9, 'the file starts half a beat early');
    // 0.2 s before a line there is no room for a 0.3125 s pickup: the next line
    c.currentTime = t0 + 4.8;
    r.send({ t: 'music', op: 'stinger', req: 'b', at: 'bar', buf: 'sting', gain: 0.9, lead: MUSIC_STINGER_LEAD_S });
    assert.ok(Math.abs((sources(c)[4].started as number) - (t0 + 7.5 - 0.3125)) < 1e-9);
    // on a BEAT: the line is 0.625 s apart, the pickup takes half of it
    c.currentTime = t0 + 5.01;
    r.send({ t: 'music', op: 'stinger', req: 'c', at: 'beat', buf: 'sting', gain: 0.9, lead: MUSIC_STINGER_LEAD_S });
    assert.ok(Math.abs((sources(c)[5].started as number) - (t0 + 5.625 - 0.3125)) < 1e-9);
    // NOW: the pickup starts at once and the hit follows it
    r.send({ t: 'music', op: 'stinger', req: 'd', at: 'now', buf: 'sting', gain: 0.9, lead: MUSIC_STINGER_LEAD_S });
    const qd = r.of('music').filter((x) => x.what === 'queued')[3] as { at: number };
    assert.ok(Math.abs((sources(c)[6].started as number) - (c.currentTime + 0.01)) < 1e-9);
    assert.ok(Math.abs(qd.at - (c.currentTime + 0.01 + 0.3125)) < 1e-9);
    // with no lead the file starts ON the line, as before
    r.send({ t: 'music', op: 'stinger', req: 'e', at: 'bar', buf: 'sting', gain: 0.9 });
    assert.ok(Math.abs((sources(c)[7].started as number) - (t0 + 7.5)) < 1e-9);
  });

  it('STOP ALL stops a stinger that has BEGUN, and says so (F3)', () => {
    const { r, t0, c } = playing();
    c.currentTime = t0 + 0.5;
    r.send({ t: 'music', op: 'stinger', req: 's1', at: 'bar', buf: 'sting', gain: 0.9, lead: MUSIC_STINGER_LEAD_S });
    const sting = sources(c)[3];
    const g = sting.outs[0];
    assert.equal(levelNow(r).voices, 3, 'three stems; the stinger is still waiting');
    // its pickup has begun: it is a voice now, though its hit has not landed
    c.currentTime = t0 + 2.3;
    assert.equal(levelNow(r).voices, 4);
    // the line passes and the engine reports it
    c.currentTime = t0 + 2.68;
    r.fire((t) => t.ms > 1000);
    assert.deepEqual(r.of('music').filter((x) => x.what === 'applied').map((x) => (x as { req: string }).req), ['s1']);
    assert.equal(levelNow(r).voices, 4, 'still sounding: still counted');
    // ■ STOP, 0.18 s into the hit (the audit's case: 2.1 s more of it was heard)
    r.send({ t: 'stopAll', fade: 0.03 });
    assert.ok(Math.abs((sting.stopped as number) - (t0 + 2.68 + 0.03 + 0.01)) < 1e-9, 'its source is told to stop after the fade');
    assert.ok(gainOf(g).at(t0 + 2.68) > 0.89);
    assert.equal(gainOf(g).at(t0 + 2.71), 0, 'silent 30 ms later');
    assert.deepEqual(stingerEvents(r), [{ e: 'music', what: 'stinger', req: 's1', state: 'stopped' }]);
    // still counted while the fade runs: 3 stems and the stinger
    assert.equal(levelNow(r).voices, 4, 'fading sounds are still sounding');
    for (const src of sources(c)) (src.onended as () => void)();
    assert.equal(levelNow(r).voices, 0, 'nothing is left once every source has ended');
  });

  it('music STOP stops it as well; one that plays out says "ended" and lets go of the bus (F3, F29)', () => {
    const { r, t0, c } = playing();
    c.currentTime = t0 + 0.5;
    r.send({ t: 'music', op: 'stinger', req: 's1', at: 'bar', buf: 'sting', gain: 0.9, lead: MUSIC_STINGER_LEAD_S });
    r.send({ t: 'music', op: 'stinger', req: 's2', at: 'phrase', buf: 'sting', gain: 0.9, lead: MUSIC_STINGER_LEAD_S });
    const [a, b] = sources(c).slice(3);
    c.currentTime = t0 + 2.6;
    r.fire((t) => t.ms > 1000 && t.ms < 3000);
    // the first plays to its end
    c.currentTime = t0 + 2.5 - 0.3125 + 2.4;
    (a.onended as () => void)();
    assert.deepEqual(stingerEvents(r), [{ e: 'music', what: 'stinger', req: 's1', state: 'ended' }]);
    outsAre(a.outs[0], [], 'its gain is unplugged from the music bus');
    // music STOP (0.4 s fade) with the second one still WAITING for its phrase
    r.send({ t: 'music', op: 'stop', fade: 0.4 });
    assert.equal(b.stopped, 0, 'unscheduled: it never starts');
    assert.equal(stingerEvents(r).length, 1, 'a stinger that never sounded is not reported as one that stopped');
    assert.equal(r.of('music').filter((x) => x.what === 'stopped').length, 1);
    r.fire(() => true);
    assert.equal(r.of('music').filter((x) => x.what === 'applied').length, 1, 'nothing is applied after the stop');
    // stems let go when their sources end
    const stems = sources(c).slice(0, 3);
    for (const s of stems) (s.onended as () => void)();
    for (const s of stems) outsAre(s.outs[0], []);
  });

  it('one that ends before its report could run (a throttled tab) is still reported: applied, then ended', () => {
    const { r, t0, c } = playing();
    c.currentTime = t0 + 0.5;
    r.send({ t: 'music', op: 'stinger', req: 's1', at: 'bar', buf: 'sting', gain: 0.9, lead: MUSIC_STINGER_LEAD_S });
    c.currentTime = t0 + 6;
    (sources(c)[3].onended as () => void)();
    const tail = r.of('music').slice(-2).map((x) => x.what);
    assert.deepEqual(tail, ['applied', 'stinger']);
    r.fire(() => true);
    assert.equal(r.of('music').filter((x) => x.what === 'applied').length, 1, 'the late timer adds nothing');
  });

  it('withdrawn during its pickup: faded out before the line, never "applied"', () => {
    const { r, t0, c } = playing();
    c.currentTime = t0 + 0.5;
    r.send({ t: 'music', op: 'stinger', req: 's1', at: 'bar', buf: 'sting', gain: 0.9, lead: MUSIC_STINGER_LEAD_S });
    const sting = sources(c)[3];
    c.currentTime = t0 + 2.3;
    r.send({ t: 'music', op: 'cancel', req: 's1' });
    assert.ok((sting.stopped as number) < t0 + 2.5, 'stopped before the line');
    assert.equal(gainOf(sting.outs[0]).at(t0 + 2.34), 0);
    r.fire(() => true);
    assert.deepEqual(r.of('music').filter((x) => x.what === 'applied' || x.what === 'stinger'), []);
    assert.equal(r.of('music').filter((x) => x.what === 'cancelled').length, 1);
  });
});

describe('music: restart, NOW changes and late withdrawals', () => {
  const START: GaCmd = {
    t: 'music',
    op: 'start',
    bpm: 96,
    beatsPerBar: 4,
    barsPerPhrase: 4,
    stems: [
      { id: 'calm', buf: 's1', gain: 1 },
      { id: 'pulse', buf: 's2', gain: 0 },
    ],
  };
  function playing() {
    const r = rig();
    r.send({ t: 'init' });
    for (const id of ['s1', 's2']) r.send({ t: 'buffer', id, sr: 48000, f32: [r.tone()] });
    r.send(START);
    const t0 = (r.of('music')[0] as { at: number }).at;
    return { r, t0, c: r.ctx() };
  }
  const what = (r: ReturnType<typeof rig>) => r.of('music').map((x) => x.what);

  it('"stopped" is said only for a stop COMMAND, never for the engine\'s own restart inside a start (F5)', () => {
    const { r, c } = playing();
    c.currentTime = 13;
    // sound came back after an interruption: the lab sends the start again
    r.send(START);
    assert.deepEqual(what(r), ['started', 'started'], 'no "stopped" between them');
    const [a, b, a2, b2] = sources(c);
    assert.ok((a.stopped as number) > 13 && (b.stopped as number) > 13, 'the old stems were stopped all the same');
    assert.ok(a2.started === b2.started && (a2.started as number) > 13);
    r.send({ t: 'music', op: 'stop', fade: 0.4 });
    assert.deepEqual(what(r), ['started', 'started', 'stopped']);
    r.send({ t: 'stopAll' });
    assert.deepEqual(what(r), ['started', 'started', 'stopped'], 'nothing left to stop: nothing said');
  });

  it('CHANGE AT = NOW moves from where the layer IS: a second change inside the fade does not jump (F21)', () => {
    const { r, t0, c } = playing();
    c.currentTime = t0 + 1;
    r.send({ t: 'music', op: 'layers', req: 'q1', at: 'now', gains: { pulse: 1 }, ramp: 0.4 });
    const pulse = gainOf(sources(c)[1].outs[0]);
    assert.ok(Math.abs(pulse.at(t0 + 1.2) - 0.5) < 1e-9, 'halfway up after 0.2 s');
    c.currentTime = t0 + 1.2;
    r.send({ t: 'music', op: 'layers', req: 'q2', at: 'now', gains: { pulse: 0 }, ramp: 0.4 });
    // it was at 0.5: from here it may only fall (the fault set it to 1.0 first)
    let prev = pulse.at(t0 + 1.2);
    assert.ok(Math.abs(prev - 0.5) < 1e-9);
    for (let t = t0 + 1.205; t <= t0 + 1.61; t += 0.005) {
      const v = pulse.at(t);
      assert.ok(v <= prev + 1e-12, `the level rose at ${(t - t0).toFixed(3)} s: ${prev.toFixed(3)} → ${v.toFixed(3)}`);
      prev = v;
    }
    assert.equal(pulse.at(t0 + 1.6), 0);
  });

  it('a withdrawal that arrives AFTER the line does not undo what already sounded (F22)', () => {
    const { r, t0, c } = playing();
    c.currentTime = t0 + 0.5;
    r.send({ t: 'music', op: 'layers', req: 'q1', at: 'bar', gains: { pulse: 1 } });
    const pulse = gainOf(sources(c)[1].outs[0]);
    // the line has passed and the layer is in, but the report timer has not
    // run yet (a background tab runs timers late)
    c.currentTime = t0 + 2.9;
    assert.equal(pulse.value, 1);
    r.send({ t: 'music', op: 'cancel', req: 'q1' });
    assert.equal(pulse.value, 1, 'the layer stays in');
    assert.equal(pulse.at(t0 + 5), 1);
    assert.deepEqual(what(r).slice(-1), ['applied'], 'it is reported as what it was: applied');
    assert.equal(r.of('music').filter((x) => x.what === 'cancelled').length, 0);
    r.fire(() => true);
    assert.equal(r.of('music').filter((x) => x.what === 'applied').length, 1, 'once');
  });
});

describe('check E: a stop is a stop, whatever was already fading (problem 1)', () => {
  const MUSIC: GaCmd = { t: 'music', op: 'start', bpm: 96, beatsPerBar: 4, barsPerPhrase: 4, stems: [{ id: 'calm', buf: 's1', gain: 1 }] };
  function rigged() {
    const r = rig();
    r.send({ t: 'init' });
    for (const id of ['hum', 's1', 'sting']) r.send({ t: 'buffer', id, sr: 48000, f32: [r.tone(Math.round(2.4 * 48000))] });
    return { r, c: r.ctx() };
  }
  /** The latest time any source may still make a sound. */
  const lastSound = (c: FakeCtx) => Math.max(...sources(c).map((s) => (s.stopped == null ? Infinity : (s.stopped as number))));
  it('a voice fading out over 0.5 s is cut to the STOP ALL fade', () => {
    const { r, c } = rigged();
    r.send({ t: 'start', v: 'h', buf: 'hum', bus: 'sfx', gain: 0.5, mode: 'none', loop: true });
    c.currentTime = 11;
    r.send({ t: 'stop', v: 'h', fade: 0.5 });
    const g = sources(c)[0].outs[0].outs[0];
    assert.ok(gainOf(g).at(11.3) > 0.1, 'the scene stop fades slowly');
    c.currentTime = 11.05;
    r.send({ t: 'stopAll', fade: 0.04 });
    assert.equal(gainOf(g).at(11.09), 0, 'silent by the end of the STOP ALL fade');
    assert.ok(lastSound(c) <= 11.05 + 0.04 + 0.011, `its source stops at ${lastSound(c)}`);
    // a slower stop afterwards never lengthens it again
    r.send({ t: 'stop', v: 'h', fade: 2 });
    assert.ok(lastSound(c) <= 11.101);
  });
  it('a voice restarted under the same id while fading is not orphaned: STOP ALL reaches the old copy, and it is counted', () => {
    const { r, c } = rigged();
    r.send({ t: 'start', v: 'h', buf: 'hum', bus: 'sfx', gain: 0.5, mode: 'none', loop: true });
    c.currentTime = 11;
    r.send({ t: 'stop', v: 'h', fade: 0.5 });
    c.currentTime = 11.05;
    r.send({ t: 'start', v: 'h', buf: 'hum', bus: 'sfx', gain: 0.5, mode: 'none', loop: true });
    r.fire((t) => t.ms === 180);
    assert.equal(r.of('level').at(-1)!.voices, 2, 'the old copy still sounds: it is counted');
    c.currentTime = 11.1;
    r.send({ t: 'stopAll', fade: 0.04 });
    assert.ok(lastSound(c) <= 11.1 + 0.04 + 0.011, `every copy stops by ${lastSound(c)}`);
    const [oldSrc, newSrc] = sources(c);
    assert.ok((oldSrc.stopped as number) <= 11.07, 'the old copy was already cut to 10 ms by the restart');
    (oldSrc.onended as () => void)();
    (newSrc.onended as () => void)();
    r.fire((t) => t.ms === 180);
    assert.equal(r.of('level').at(-1)!.voices, 0);
  });
  it('music stems and a stinger already fading after a music STOP are cut by STOP ALL', () => {
    const { r, c } = rigged();
    r.send(MUSIC);
    c.currentTime = 10.2;
    r.send({ t: 'music', op: 'stinger', req: 's', at: 'now', buf: 'sting', gain: 0.9 });
    c.currentTime = 11;
    r.send({ t: 'music', op: 'stop', fade: 0.4 });
    assert.ok(lastSound(c) > 11.4, 'music stop fades over 0.4 s');
    c.currentTime = 11.05;
    r.send({ t: 'stopAll', fade: 0.04 });
    assert.ok(lastSound(c) <= 11.05 + 0.04 + 0.011, `stems and stinger stop by ${lastSound(c)}`);
    for (const src of sources(c)) assert.equal(gainOf(src.outs[0]).at(11.09), 0);
    r.fire((t) => t.ms === 180);
    assert.equal(r.of('level').at(-1)!.voices, 2, 'counted until they end');
  });
});

describe('check E: a start with a fade-in and a SET or STOP in the same batch (problem 2)', () => {
  function rigged() {
    const r = rig();
    r.send({ t: 'init' });
    r.send({ t: 'buffer', id: 'bed', sr: 48000, f32: [r.tone()] });
    return { r, c: r.ctx() };
  }
  const fadeStart = (extra: Record<string, unknown> = {}) => ({ t: 'start', v: 'b', buf: 'bed', bus: 'ambience', gain: 0.1, mode: 'none', loop: true, fadeIn: 0.08, ...extra }) as GaCmd;
  it('a SET in the same instant re-aims the fade: from silence to the new gain at the fade\'s end', () => {
    const { r, c } = rigged();
    r.send(fadeStart());
    r.send({ t: 'set', v: 'b', gain: 0.05, ramp: 0.06 });
    const g = gainOf(sources(c)[0].outs[0].outs[0]);
    assert.equal(g.at(10), 0, 'silent at the start (it played at gain 1 for 20 ms before)');
    assert.ok(Math.abs(g.at(10.04) - 0.025) < 1e-9, 'half way up the fade');
    assert.ok(Math.abs(g.at(10.08) - 0.05) < 1e-9, 'at the new gain when the fade ends');
    for (let t = 10; t <= 10.2; t += 0.001) assert.ok(g.at(t) <= 0.1 + 1e-9, `never above the voice's own gain (t ${t.toFixed(3)})`);
  });
  it('a STOP in the same instant makes no sound at all', () => {
    const { r, c } = rigged();
    r.send(fadeStart());
    r.send({ t: 'stop', v: 'b', fade: 0.02 });
    const g = gainOf(sources(c)[0].outs[0].outs[0]);
    for (let t = 10; t <= 10.1; t += 0.001) assert.equal(g.at(t), 0, `silent at ${t.toFixed(3)}`);
  });
  it('a delayed start keeps its fade-in when a SET reaches it first', () => {
    const { r, c } = rigged();
    r.send(fadeStart({ delay: 0.3 }));
    c.currentTime = 10.1;
    r.send({ t: 'set', v: 'b', gain: 0.2, ramp: 0.06 });
    const g = gainOf(sources(c)[0].outs[0].outs[0]);
    assert.equal(g.at(10.3), 0, 'silent when it starts');
    assert.ok(Math.abs(g.at(10.34) - 0.1) < 1e-9, 'rising');
    assert.ok(Math.abs(g.at(10.38) - 0.2) < 1e-9, 'at the new gain at the fade\'s end');
  });
  it('a SET in the middle of the fade-in continues from where the fade is', () => {
    const { r, c } = rigged();
    r.send(fadeStart());
    c.currentTime = 10.04;
    r.send({ t: 'set', v: 'b', gain: 0.2 });
    const g = gainOf(sources(c)[0].outs[0].outs[0]);
    assert.ok(Math.abs(g.at(10.04) - 0.05) < 1e-9, 'no jump at the SET');
    assert.ok(Math.abs(g.at(10.08) - 0.2) < 1e-9);
  });
});

describe('check E: interrupted moves end ON their line (problem 4) and page 14 changes during a NOW fade (problem 3)', () => {
  it('a move that interrupts a ramp first ramps to the value the param HAS, at that instant, then moves', () => {
    const r = rig();
    r.send({ t: 'init' });
    r.send({ t: 'buffer', id: 'hum', sr: 48000, f32: [r.tone()] });
    r.send({ t: 'start', v: 'v', buf: 'hum', bus: 'sfx', gain: 0.2, mode: 'none', loop: true });
    const c = r.ctx();
    const g = gainOf(sources(c)[0].outs[0].outs[0]);
    r.send({ t: 'set', v: 'v', gain: 1, ramp: 0.2 });
    c.currentTime = 10.1;
    r.send({ t: 'set', v: 'v', gain: 0.2, ramp: 0.1 });
    const tail = g.log.slice(-3);
    // NOT "cancel; set(0.6)": cancelling the ramp in flight and SETTING its
    // value left one sample at the value before the ramp (0.2) on the platform
    assert.deepEqual(tail.map((l) => [l.op, l.v == null ? null : +l.v.toFixed(6), +l.t.toFixed(6)]), [['cancel', null, 10.1], ['ramp', 0.6, 10.1], ['ramp', 0.2, 10.2]]);
    assert.ok(Math.abs(g.at(10.05) - 0.4) < 1e-9, 'the first ramp is untouched before the change');
    assert.ok(Math.abs(g.at(10.1) - 0.6) < 1e-9);
    assert.ok(Math.abs(g.at(10.15) - 0.4) < 1e-9);
  });
  const START: GaCmd = { t: 'music', op: 'start', bpm: 96, beatsPerBar: 4, barsPerPhrase: 4, stems: [{ id: 'a', buf: 's1', gain: 1 }, { id: 'b', buf: 's2', gain: 0 }] };
  function playing() {
    const r = rig();
    r.send({ t: 'init' });
    for (const id of ['s1', 's2']) r.send({ t: 'buffer', id, sr: 48000, f32: [r.tone()] });
    r.send(START);
    const t0 = (r.of('music')[0] as { at: number }).at;
    const [sa, sb] = sources(r.ctx());
    return { r, t0, c: r.ctx(), a: gainOf(sa.outs[0]), b: gainOf(sb.outs[0]) };
  }
  it('a layer that does not change is not touched by a change of another layer', () => {
    const { r, t0, c, a } = playing();
    c.currentTime = t0 + 1;
    const before = a.log.length;
    r.send({ t: 'music', op: 'layers', req: 'q', at: 'beat', gains: { a: 1, b: 1 }, ramp: 0.03 });
    assert.equal(a.log.length, before, 'no automation written on layer a');
  });
  it('a BEAT change of another layer asked during a NOW fade lets the fade go on', () => {
    const { r, t0, c, a, b } = playing();
    c.currentTime = t0 + 1.0;
    r.send({ t: 'music', op: 'layers', req: 'q1', at: 'now', gains: { a: 0, b: 0 }, ramp: 0.4 });
    c.currentTime = t0 + 1.05;
    r.send({ t: 'music', op: 'layers', req: 'q2', at: 'beat', gains: { a: 0, b: 1 }, ramp: 0.03 });
    // the fade of a goes on along its line (the fault: back to full at once,
    // held until the beat, then a step to silence)
    for (let t = t0 + 1.0; t <= t0 + 1.4; t += 0.01) assert.ok(Math.abs(a.at(t) - (1 - (t - (t0 + 1)) / 0.4)) < 1e-6, `layer a at ${(t - t0).toFixed(2)} s: ${a.at(t).toFixed(3)}`);
    assert.equal(a.at(t0 + 2), 0);
    assert.equal(b.at(t0 + 1.25), 0, 'b waits for its beat');
    assert.equal(b.at(t0 + 1.25 + 0.03), 1);
  });
  it('a BAR change of the FADING layer is anchored at the value the fade has on the line', () => {
    const { r, t0, c, a } = playing();
    c.currentTime = t0 + 2.0;
    r.send({ t: 'music', op: 'layers', req: 'q1', at: 'now', gains: { a: 0, b: 0 }, ramp: 1.0 });
    c.currentTime = t0 + 2.1;
    r.send({ t: 'music', op: 'layers', req: 'q2', at: 'bar', gains: { a: 1, b: 0 }, ramp: 0.03 });
    // the bar line is at t0 + 2.5, where the NOW fade is at 0.5
    assert.ok(Math.abs(a.at(t0 + 2.3) - 0.7) < 1e-9, 'the fade goes on up to the line');
    assert.ok(Math.abs(a.at(t0 + 2.5) - 0.5) < 1e-9, 'the line finds it at 0.5');
    assert.ok(Math.abs(a.at(t0 + 2.515) - 0.75) < 1e-9, 'and it rises from there');
    assert.equal(a.at(t0 + 2.53), 1);
  });
  it('withdrawing a waiting change during a NOW fade leaves the fade as it was', () => {
    const { r, t0, c, a } = playing();
    c.currentTime = t0 + 2.0;
    r.send({ t: 'music', op: 'layers', req: 'q1', at: 'now', gains: { a: 0, b: 0 }, ramp: 1.0 });
    c.currentTime = t0 + 2.1;
    r.send({ t: 'music', op: 'layers', req: 'q2', at: 'bar', gains: { a: 1, b: 0 }, ramp: 0.03 });
    c.currentTime = t0 + 2.2;
    r.send({ t: 'music', op: 'cancel', req: 'q2' });
    // the fault: a step from where the fade was straight to its end value
    for (let t = t0 + 2.2; t <= t0 + 3.0; t += 0.01) assert.ok(Math.abs(a.at(t) - (1 - (t - (t0 + 2)) / 1.0)) < 1e-6, `layer a at ${(t - t0).toFixed(2)} s: ${a.at(t).toFixed(3)}`);
    assert.equal(a.at(t0 + 3.5), 0);
    assert.deepEqual(r.of('music').filter((x) => x.what === 'cancelled').map((x) => (x as { req: string }).req), ['q2']);
  });
});

describe('check E: the limiter and the ceiling (problem 6)', () => {
  it('the limiter starts at −6 dB, so its overshoot stays under full scale and the hard stop is a backstop', () => {
    assert.equal(GA_LIMITER_THRESHOLD_DB, -6);
    const r = rig();
    r.send({ t: 'init' });
    const lim = kind(r.ctx(), 'limiter')[0];
    assert.equal((lim.threshold as FakeParam).value, GA_LIMITER_THRESHOLD_DB);
    assert.equal((lim.ratio as FakeParam).value, 20);
    assert.ok(GA_ENGINE_JS.includes(`var LIMIT_DB = ${GA_LIMITER_THRESHOLD_DB};`), 'the engine text uses the same threshold');
    assert.ok(GA_ENGINE_JS.includes(`var LIMIT_TRIM = 1 / ${GA_LIMITER_MAKEUP};`), 'and the same make-up trim');
    // the Web Audio make-up gain at these settings is +0.57 dB per dB of
    // threshold: +3.42 dB at -6 (measured in Chrome 157, offline)
    assert.ok(Math.abs(20 * Math.log10(GA_LIMITER_MAKEUP) - 3.42) < 0.01);
    // what the code promises is a SAMPLE-peak ceiling
    const src = readFileSync(new URL('../src/screens/lab/gameaudio/engine/gaEngineSource.ts', import.meta.url), 'utf8');
    assert.ok(/sample-peak ceiling/i.test(src), 'the engine says sample-peak');
    const hook = readFileSync(new URL('../src/screens/lab/gameaudio/engine/useGaSound.ts', import.meta.url), 'utf8');
    assert.ok(/sample-peak ceiling/i.test(hook), 'the sound session says sample-peak');
  });
});

describe('the phone host and the SOUND key', () => {
  it('the closing commands stop first, then dispose, and are safe on a page that never loaded (F18)', () => {
    assert.ok(GA_CLOSING_JS.indexOf('"stopAll"') > 0 && GA_CLOSING_JS.indexOf('"stopAll"') < GA_CLOSING_JS.indexOf('"dispose"'));
    // run it against a page with no engine, then against one that records
    new Function('window', GA_CLOSING_JS)({});
    const got: GaCmd[] = [];
    new Function('window', GA_CLOSING_JS)({ __ga: (m: GaCmd) => got.push(m) });
    assert.deepEqual(got.map((m) => m.t), ['stopAll', 'dispose']);
    const host = readFileSync(new URL('../src/screens/lab/gameaudio/engine/GaEngineHost.tsx', import.meta.url), 'utf8');
    assert.match(host, /useLayoutEffect\(\s*\(\) => \(\) => \{[\s\S]{0,80}injectJavaScript\(GA_CLOSING_JS\)/, 'sent from a layout-effect cleanup, while the ref is set');
    assert.match(host, /onContentProcessDidTerminate=\{died\}/);
    assert.match(host, /onRenderProcessGone=\{died\}/);
  });
  it('a page that says hello twice has reloaded; a ping answered with or without a context has not (check E, problem 7)', () => {
    const hello = JSON.parse(/post\((\{e:"clock"[^)]*\})\)/.exec(gaEngineHtml())![1].replace(/([{,])(\w+):/g, '$1"$2":')) as GaEvt;
    assert.equal(gaIsPageHello(hello), true);
    const r = rig();
    // before init (no context): the answer looks like the hello in every
    // other field (now 0, state closed)
    r.send({ t: 'ping' });
    r.send({ t: 'init' });
    r.send({ t: 'ping' });
    r.send({ t: 'dispose' });
    r.send({ t: 'ping' });
    const clocks = r.of('clock');
    assert.equal(clocks.length, 3);
    assert.deepEqual([clocks[0].now, clocks[0].state], [0, 'closed'], 'the case that used to collide');
    for (const c of clocks) assert.equal(gaIsPageHello(c), false);
    assert.equal(gaIsPageHello({ e: 'state', state: 'closed' }), false);
  });
  it('a dead web view takes the engine\'s status to off, and its sounds are forgotten', async () => {
    const eng = new GaEngine();
    const sent: GaCmd[] = [];
    eng.attach({ kind: 'webview', send: (c) => sent.push(c), dispose: () => sent.push({ t: 'dispose' }) });
    const started = eng.init();
    eng.receive({ e: 'ready', sr: 48000, state: 'running', hrtf: true });
    assert.equal(await started, 'running');
    const loading = eng.load('door', 48000, [new Float32Array(8)]);
    eng.receive({ e: 'buffer', id: 'door', ok: true, seconds: 1 });
    assert.equal(await loading, true);
    eng.receive({ e: 'reverb', ok: true });
    eng.detach();
    assert.equal(eng.status, 'off');
    assert.equal(eng.has('door'), false);
    assert.equal(eng.reverbOk, null);
    assert.equal(eng.attached, false);
  });
  it('SOUND reads off until it is asked for, and off again once it is switched off (F7)', () => {
    // the engine can be running and the gate open: without the wish it is OFF
    assert.equal(gaSoundStateOf('running', false, false, true), 'off');
    assert.equal(gaSoundStateOf('running', false, true, true), 'on');
    assert.equal(gaSoundStateOf('running', false, true, false), 'off', 'a closed gate: nothing may sound');
    assert.equal(gaSoundStateOf('starting', false, true, true), 'starting');
    assert.equal(gaSoundStateOf('blocked', false, true, true), 'blocked');
    assert.equal(gaSoundStateOf('failed', false, true, true), 'failed');
    assert.equal(gaSoundStateOf('off', false, true, true), 'off', 'the web view died: off, never "on" in silence');
    assert.equal(gaSoundStateOf('unavailable', false, false, true), 'unavailable');
    assert.equal(gaSoundStateOf('running', true, false, true), 'declined');
    // the hook: disable() withdraws the wish, stops everything and shuts the
    // output; enable() asks the preview first, then the gate, then the fence
    const hook = readFileSync(new URL('../src/screens/lab/gameaudio/engine/useGaSound.ts', import.meta.url), 'utf8');
    const disable = /const disable = useCallback\(\(\) => \{([\s\S]*?)\}, \[engine\]\);/.exec(hook)![1];
    assert.match(disable, /setWanted\(false\)/);
    assert.match(disable, /engine\.stopAll\(/);
    assert.match(disable, /\{ t: 'silent', on: true \}/);
    assert.match(disable, /gen\.current\+\+/);
    const enable = /const enable = useCallback\(async \(\): Promise<boolean> => \{([\s\S]*?)\}, \[engine, requestAudioOutput\]\);/.exec(hook)![1];
    assert.ok(enable.indexOf('getLabPreview().active') < enable.indexOf('requestAudioOutput()'), 'a preview is refused BEFORE any prompt (F30)');
    assert.ok(enable.indexOf('requestAudioOutput()') < enable.indexOf('startFenced('));
    assert.match(enable, /\{ t: 'silent', on: false \}/);
    assert.match(hook, /Math\.max\(e\.rms, e\.l, e\.r\)/, 'exposure takes the loudest of the mix and either ear (F16)');
  });
  it('SOUND never reads ON while the output is shut, and a mute from outside switches it OFF (check E, problems 5 and 10)', () => {
    // while a press is answered it may say STARTING, never ON, even with the
    // engine already running (a second press after SOUND was switched off)
    assert.equal(gaSoundStateOf('running', false, false, true, true), 'off');
    assert.equal(gaSoundStateOf('starting', false, false, true, true), 'starting');
    assert.equal(gaSoundStateOf('starting', false, false, true, false), 'off');
    const hook = readFileSync(new URL('../src/screens/lab/gameaudio/engine/useGaSound.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
    const enable = /const enable = useCallback\(async \(\): Promise<boolean> => \{([\s\S]*?)\}, \[engine, requestAudioOutput\]\);/.exec(hook)![1];
    const fence = enable.indexOf('startFenced(');
    const wantOn = enable.indexOf('setWanted(true)');
    assert.ok(fence > 0 && wantOn > fence, 'the wish is recorded only AFTER the fence');
    const blocked = enable.slice(enable.indexOf("if (fenced.status !== 'started')"), wantOn);
    assert.ok(/setWanted\(false\)/.test(blocked) && /\{ t: 'silent', on: true \}/.test(blocked), 'a blocked start shuts the output again and leaves SOUND off');
    assert.ok(/why !== 'superseded'/.test(blocked), 'unless a newer press owns it');
    // the app's own silencing: a CLOSED gate is the SOUND key switched off
    const silenced = /const silenced = useCallback\(\(\) => \{([\s\S]*?)\}, \[stopAll, disable\]\);/.exec(hook)![1];
    assert.ok(/isAudioOutputEnabled\(\)\) stopAll\(\);\s*else disable\(\);/.test(silenced));
    assert.ok(/useStopWhenSilenced\(sounding \|\| wanted, silenced\)/.test(hook));
  });
});

describe('samples cross the web-view bridge as 16-bit PCM', () => {
  it('round-trips within one 16-bit step and the engine decodes the same', () => {
    const x = Float32Array.from([0, 0.5, -0.5, 1, -1, 0.123456, NaN, 2, -2]);
    const b64 = f32ToI16Base64(x);
    const y = i16Base64ToF32(b64);
    const want = [0, 0.5, -0.5, 1, -1, 0.123456, 0, 1, -1];
    for (let i = 0; i < want.length; i++) assert.ok(Math.abs(y[i] - want[i]) < 1 / 32767 + 1e-9, `sample ${i}`);
    const r = rig();
    r.send({ t: 'init' });
    r.send({ t: 'buffer', id: 'a', sr: 48000, i16: [b64] });
    assert.equal(r.of('buffer')[0].ok, true);
    r.send({ t: 'start', v: 'v', buf: 'a', bus: 'ui', gain: 1, mode: 'none' });
    const got = (sources(r.ctx())[0].buffer as FakeBuffer).getChannelData(0);
    for (let i = 0; i < want.length; i++) assert.ok(Math.abs(got[i] - y[i]) < 1e-6);
    for (const n of [1, 2, 3, 4, 5, 4097]) {
      const z = Float32Array.from({ length: n }, (_, i) => Math.sin(i) * 0.9);
      const back = i16Base64ToF32(f32ToI16Base64(z));
      assert.equal(back.length, n);
    }
  });
});
