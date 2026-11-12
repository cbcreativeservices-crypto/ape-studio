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
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GA_ENGINE_JS, GA_OUTPUT_CEILING, gaEngineHtml } from '../src/screens/lab/gameaudio/engine/gaEngineSource.ts';
import { f32ToI16Base64, i16Base64ToF32, type GaCmd, type GaEvt } from '../src/screens/lab/gameaudio/engine/gaEngineProtocol.ts';
import { readFileSync } from 'node:fs';

// outputCeiling.ts imports the player register without an extension, so node
// cannot load it; the ceiling is read from its source text instead.
const CEILING_SRC = readFileSync(new URL('../src/features/audio/outputCeiling.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const CEILING_DB = Number(/PLAYBACK_CEILING_DB = (-?\d+(?:\.\d+)?)/.exec(CEILING_SRC)![1]);
const PLAYBACK_CEILING = 10 ** (CEILING_DB / 20);

/* ── a recording fake of the Web Audio API ─────────────────────────────── */

type Auto = { op: 'set' | 'ramp' | 'cancel'; v?: number; t: number };
class FakeParam {
  value: number;
  log: Auto[] = [];
  constructor(v: number) {
    this.value = v;
  }
  setValueAtTime(v: number, t: number) {
    this.log.push({ op: 'set', v, t });
    this.value = v;
  }
  linearRampToValueAtTime(v: number, t: number) {
    this.log.push({ op: 'ramp', v, t });
    this.value = v;
  }
  cancelScheduledValues(t: number) {
    this.log.push({ op: 'cancel', t });
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
  disconnect() {
    this.outs = [];
  }
}
class FakeBuffer {
  data: Float32Array[];
  sampleRate: number;
  duration: number;
  constructor(ch: number, len: number, sr: number) {
    this.data = Array.from({ length: ch }, () => new Float32Array(len));
    this.sampleRate = sr;
    this.duration = len / sr;
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
  private mk(kind: string, extra: Record<string, unknown> = {}) {
    const n = new FakeNode(kind);
    Object.assign(n, extra);
    this.made.push(n);
    return n;
  }
  createGain() {
    return this.mk('gain', { gain: new FakeParam(1) });
  }
  createBiquadFilter() {
    return this.mk('biquad', { frequency: new FakeParam(350), Q: new FakeParam(1), type: 'lowpass' });
  }
  createStereoPanner() {
    return this.mk('stereo', { pan: new FakeParam(0) });
  }
  createPanner() {
    return this.mk('panner', { positionX: new FakeParam(0), positionY: new FakeParam(0), positionZ: new FakeParam(0) });
  }
  createDynamicsCompressor() {
    return this.mk('limiter', {
      threshold: new FakeParam(-24),
      knee: new FakeParam(30),
      ratio: new FakeParam(12),
      attack: new FakeParam(0.003),
      release: new FakeParam(0.25),
    });
  }
  createAnalyser() {
    return this.mk('analyser', { fftSize: 2048, getFloatTimeDomainData: (a: Float32Array) => a.fill(0) });
  }
  createChannelSplitter() {
    return this.mk('splitter');
  }
  createConvolver() {
    return this.mk('convolver', { buffer: null });
  }
  createBuffer(ch: number, len: number, sr: number) {
    return new FakeBuffer(ch, len, sr);
  }
  createBufferSource() {
    const n = this.mk('source', { playbackRate: new FakeParam(1), loop: false, buffer: null, onended: null, started: null, stopped: null });
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
function rig(state: 'running' | 'suspended' = 'running') {
  const g: Record<string, unknown> = { atob: (s: string) => atob(s) };
  new Function('window', GA_ENGINE_JS)(g);
  const events: GaEvt[] = [];
  const timers: Timer[] = [];
  let ctx!: FakeCtx;
  class AC extends FakeCtx {
    constructor() {
      super();
      this.state = state;
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
    assert.ok(lim.outs.includes(last), 'the limiter sits before the ceiling');
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
    assert.deepEqual(log.map((l) => [l.op, l.v, +(l.t - t0).toFixed(3)]), [['set', 0, 5], ['ramp', 1, 5.03]]);
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
