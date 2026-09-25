/**
 * Sound Systems Lab — engine truth suite (owner brief 2026-09-25).
 *
 * Pins everything a page can claim: the gear catalogue's level rules, the
 * connection verdicts (including the one hazard), the source→listener trace,
 * the console routing arithmetic, the calculator-backed load and timing
 * wrappers (asserted EQUAL to the calculator's own output — never a second
 * derivation), the 22 fault cases (healthy before the fault station, not
 * healthy at it, solvable by a forward walk), the ten capstones (a reference
 * build passes each; the empty venue passes none), the configuration data,
 * the OPERATE models and the understanding check.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

const store = new Map<string, string>();
(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE__ = store;

// House resolver hook: source modules import siblings without extensions
// (Metro resolves them; Node's loader does not) — see productionEngine.test.ts.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') {
      return { url: new URL('./_fake-async-storage.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { GEAR, gearSpec, isSink, isSource } = await import('../src/features/soundsystems/gear.ts');
const { STATION_ORDER } = await import('../src/features/soundsystems/types.ts');
const sys = await import('../src/features/soundsystems/system.ts');
const con = await import('../src/features/soundsystems/console.ts');
const loads = await import('../src/features/soundsystems/loads.ts');
const { FAULTS, FAULT_GROUPS, firstAbnormal, gradeAttempt, isForwardWalk, minimalProbes } = await import('../src/features/soundsystems/faults.ts');
const { CAPSTONES, gradeCapstone } = await import('../src/features/soundsystems/capstones.ts');
const { OUTPUT_CONFIGS, SYSTEM_TYPES, VENUE_CASES } = await import('../src/features/soundsystems/configs.ts');
const op = await import('../src/features/soundsystems/operate.ts');
const { SOUND_SYSTEMS_CHECK } = await import('../src/features/soundsystems/check.ts');
const { getWorkspace } = await import('../src/screens/lab/calc/registry.ts');
const progress = await import('../src/features/soundsystems/progress.ts');

type System = import('../src/features/soundsystems/types.ts').SoundSystem;
type GearKind = import('../src/features/soundsystems/types.ts').GearKind;
type SlotId = import('../src/features/soundsystems/types.ts').SlotId;
type Station = import('../src/features/soundsystems/types.ts').Station;

/* ── builder helpers ─────────────────────────────────────────────────────── */

class Build {
  s: System = sys.EMPTY_SYSTEM;
  ids: Record<string, string> = {};
  put(tag: string, kind: GearKind, slot: SlotId): this {
    const v = sys.place(this.s, kind, slot);
    assert.ok(v.ok, `place ${kind} at ${slot}: ${v.ok ? '' : v.reason}`);
    this.s = v.system;
    this.ids[tag] = v.id;
    return this;
  }
  link(a: string, b: string): this {
    const v = sys.connect(this.s, this.ids[a], this.ids[b]);
    assert.ok(v.ok, `connect ${a}→${b}: ${v.ok ? '' : v.reason}`);
    this.s = v.system;
    return this;
  }
}

/* ── gear ────────────────────────────────────────────────────────────────── */

describe('gear catalogue', () => {
  it('kinds are unique and every kind resolves', () => {
    assert.equal(new Set(GEAR.map((g) => g.kind)).size, GEAR.length);
    for (const g of GEAR) assert.equal(gearSpec(g.kind).kind, g.kind);
  });
  it('sources emit and accept nothing electrical; sinks radiate', () => {
    assert.ok(isSource('vocalMic') && isSource('playback') && isSource('di'));
    assert.ok(!isSource('console') && !isSource('amp'));
    assert.ok(isSink('poweredSpeaker') && isSink('wedge') && isSink('iemPack'));
    assert.ok(!isSink('amp') && !isSink('console'));
  });
  it('every kind has at least one slot role and prose in the professional register', () => {
    for (const g of GEAR) {
      assert.ok(g.roles.length > 0, g.kind);
      for (const text of [g.blurb, g.from, g.to]) assert.doesNotMatch(text, /coming soon|in development|stay tuned|future update/i, g.kind);
    }
  });
});

/* ── system graph ────────────────────────────────────────────────────────── */

describe('connections', () => {
  const b = new Build()
    .put('mic', 'vocalMic', 'stageL')
    .put('con', 'console', 'foh')
    .put('amp', 'amp', 'rack1')
    .put('top', 'poweredSpeaker', 'mainL')
    .put('pas', 'passiveSpeaker', 'mainR')
    .put('proc', 'processor', 'rack2');

  it('a microphone reaches the console at mic level', () => {
    const v = sys.canConnect(b.s, b.ids.mic, b.ids.con);
    assert.deepEqual(v, { ok: true, level: 'mic' });
  });
  it('speaker level into a line input is refused AND flagged unsafe', () => {
    const v = sys.canConnect(b.s, b.ids.amp, b.ids.top);
    assert.ok(!v.ok);
    if (!v.ok) {
      assert.equal(v.unsafe, true);
      assert.match(v.reason, /UNSAFE/);
    }
  });
  it('the console cannot drive a passive cabinet — it names the missing amplifier', () => {
    const v = sys.canConnect(b.s, b.ids.con, b.ids.pas);
    assert.ok(!v.ok);
    if (!v.ok) {
      assert.equal(v.unsafe, undefined);
      assert.match(v.reason, /POWER AMPLIFIER/);
    }
  });
  it('a microphone cannot feed an amplifier — it names the preamp', () => {
    const v = sys.canConnect(b.s, b.ids.mic, b.ids.amp);
    assert.ok(!v.ok);
    if (!v.ok) assert.match(v.reason, /preamp/i);
  });
  it('nothing can be fed INTO a source, and a distro carries no audio', () => {
    const d = new Build().put('mic', 'vocalMic', 'stageL').put('con', 'console', 'foh').put('pd', 'powerDistro', 'distro');
    assert.ok(!sys.canConnect(d.s, d.ids.con, d.ids.mic).ok);
    assert.ok(!sys.canConnect(d.s, d.ids.pd, d.ids.con).ok);
  });
  it('a loudspeaker takes one input; a loop is refused; duplicates are refused', () => {
    const c = new Build()
      .put('pb', 'playback', 'stageC')
      .put('rx', 'wirelessRx', 'stageL')
      .put('con', 'console', 'foh')
      .put('top', 'poweredSpeaker', 'mainL')
      .put('proc', 'processor', 'rack1')
      .link('pb', 'con')
      .link('con', 'top');
    assert.ok(!sys.canConnect(c.s, c.ids.rx, c.ids.top).ok, 'second feed into a top');
    c.link('con', 'proc');
    assert.ok(!sys.canConnect(c.s, c.ids.proc, c.ids.con).ok, 'loop');
    assert.ok(!sys.canConnect(c.s, c.ids.pb, c.ids.con).ok, 'duplicate');
  });
  it('placement respects slot roles and singletons', () => {
    const v = sys.place(sys.EMPTY_SYSTEM, 'console', 'mainL');
    assert.ok(!v.ok);
    const one = sys.place(sys.EMPTY_SYSTEM, 'console', 'foh');
    assert.ok(one.ok);
    if (one.ok) assert.ok(!sys.place(one.system, 'console', 'foh').ok, 'slot taken');
  });
});

describe('trace', () => {
  it('finds live sinks, silent sinks and stranded sources', () => {
    const b = new Build()
      .put('mic', 'vocalMic', 'stageL')
      .put('mic2', 'vocalMic', 'stageR')
      .put('con', 'console', 'foh')
      .put('l', 'poweredSpeaker', 'mainL')
      .put('r', 'poweredSpeaker', 'mainR')
      .link('mic', 'con')
      .link('con', 'l');
    const t = sys.trace(b.s);
    assert.deepEqual(t.live, [b.ids.l]);
    assert.deepEqual(t.silent, [b.ids.r]);
    assert.deepEqual(t.strandedSources, [b.ids.mic2]);
    assert.equal(sys.allSinksLive(b.s), false);
    b.link('con', 'r').link('mic2', 'con');
    assert.equal(sys.allSinksLive(b.s), true);
    assert.deepEqual(sys.chainTo(b.s, b.ids.r).map((p) => p.kind), ['vocalMic', 'console', 'poweredSpeaker']);
  });
  it('removing a device removes its links', () => {
    const b = new Build().put('mic', 'vocalMic', 'stageL').put('con', 'console', 'foh').link('mic', 'con');
    const s = sys.removePlaced(b.s, b.ids.con);
    assert.equal(s.links.length, 0);
    assert.equal(s.placed.length, 1);
  });
});

/* ── console ─────────────────────────────────────────────────────────────── */

describe('console routing', () => {
  it('pre-fader sends ignore fader and mute; post-fader sends follow both', () => {
    let cs = con.bandConsole();
    cs = con.setSend(cs, 'vox', 'aux1', { db: 0, tap: 'pre' });
    cs = con.setSend(cs, 'vox', 'aux5', { db: 0, tap: 'post' });
    cs = con.setChannel(cs, 'vox', { faderDb: -20 });
    const pre = con.auxBus(cs, 'aux1').find((c) => c.channelId === 'vox')!.gain;
    const post = con.auxBus(cs, 'aux5').find((c) => c.channelId === 'vox')!.gain;
    assert.equal(Math.round(con.lin2db(pre)), 0);
    assert.equal(Math.round(con.lin2db(post)), -20);
    cs = con.setChannel(cs, 'vox', { mute: true });
    assert.equal(con.auxBus(cs, 'aux5').find((c) => c.channelId === 'vox')!.gain, 0);
    assert.ok(con.auxBus(cs, 'aux1').find((c) => c.channelId === 'vox')!.gain > 0);
  });
  it('a subgroup not assigned to main is a dead end with a moving meter', () => {
    let cs = con.bandConsole();
    cs = con.setChannel(cs, 'gtr', { toMain: false, subgroup: 'sub-drums' });
    assert.ok(con.hears(con.mainBus(cs)).some((c) => c.channelId === 'gtr'));
    cs = con.setSubgroup(cs, 'sub-drums', { toMain: false });
    assert.ok(!con.hears(con.mainBus(cs)).some((c) => c.channelId === 'gtr'));
    assert.ok(con.hears(con.subgroupBus(cs, 'sub-drums')).some((c) => c.channelId === 'gtr'));
  });
  it('a DCA moves the main path and post sends, not pre sends; a DCA mute silences', () => {
    let cs = con.bandConsole();
    cs = con.setChannel(cs, 'kick', { dca: 'dca-band' });
    cs = con.setSend(cs, 'kick', 'aux1', { db: 0, tap: 'pre' });
    cs = con.setDca(cs, 'dca-band', { levelDb: -12 });
    assert.equal(Math.round(con.lin2db(con.mainBus(cs).find((c) => c.channelId === 'kick')!.gain)), -12);
    assert.equal(Math.round(con.lin2db(con.auxBus(cs, 'aux1').find((c) => c.channelId === 'kick')!.gain)), 0);
    cs = con.setDca(cs, 'dca-band', { mute: true });
    assert.equal(con.mainBus(cs).find((c) => c.channelId === 'kick')!.gain, 0);
  });
  it('a matrix mixes whole buses after their masters', () => {
    let cs = con.bandConsole();
    cs = con.setSend(cs, 'mc', 'aux2', { db: 0, tap: 'pre' });
    cs = con.setMatrixInput(cs, 'mx-lobby', 'main', -6);
    cs = con.setMatrixInput(cs, 'mx-lobby', 'aux2', 0);
    const heard = con.hears(con.matrixBus(cs, 'mx-lobby'));
    assert.ok(heard.some((c) => c.channelId === 'mc'));
    assert.ok(heard.some((c) => c.channelId === 'kick'));
    // the mc appears via both main (−6) and aux2 (0): its gain exceeds a main-only channel's
    const mc = heard.find((c) => c.channelId === 'mc')!.gain;
    const kick = heard.find((c) => c.channelId === 'kick')!.gain;
    assert.ok(mc > kick);
  });
  it('the which-tool cases each have one valid answer and honest distractor feedback', () => {
    const ids = new Set(con.ROUTING_TOOLS.map((t) => t.id));
    assert.equal(ids.size, con.ROUTING_TOOLS.length);
    for (const c of con.WHICH_TOOL) {
      assert.ok(ids.has(c.correct), c.id);
      for (const k of Object.keys(c.wrong)) {
        assert.ok(ids.has(k as never), `${c.id} wrong key ${k}`);
        assert.notEqual(k, c.correct, `${c.id} marks the correct tool as wrong`);
      }
    }
    assert.equal(new Set(con.WHICH_TOOL.map((c) => c.id)).size, con.WHICH_TOOL.length);
  });
  it('the routing truths separate audio from control', () => {
    assert.equal(con.routingTool('dca').carriesAudio, false);
    assert.equal(con.routingTool('subgroup').sumsChannels, true);
    assert.equal(con.routingTool('aux').isCopy, true);
    assert.equal(con.routingTool('matrix').mixesBuses, true);
  });
});

/* ── loads: never a second derivation ────────────────────────────────────── */

describe('loads call the calculators', () => {
  it('parallel impedance equals the calculator output exactly', () => {
    const r = loads.parallelLoad([8, 8]);
    assert.equal(r.ohms, 4);
    assert.equal(r.warning, null);
    const calc = getWorkspace('impedance')!.functions.find((f) => f.key === 'parallel')!.compute({ zlist: [8, 8, 8] });
    const total = calc.find((o) => o.label === 'TOTAL PARALLEL IMPEDANCE')!;
    assert.ok('value' in total);
    assert.equal(loads.parallelLoad([8, 8, 8]).ohms, total.value);
    assert.ok(loads.parallelLoad([4, 4]).warning, 'the calculator raises its load warning below 3 Ω');
  });
  it('the load verdict reads the amplifier minimum', () => {
    assert.equal(loads.loadVerdict(4, 4), 'marginal');
    assert.equal(loads.loadVerdict(2.67, 4), 'unsafe');
    assert.equal(loads.loadVerdict(8, 4), 'safe');
    assert.equal(loads.loadVerdict(Infinity, 4), 'open');
  });
  it('delay from distance equals the calculator (about 87 ms for 30 m at 20 °C)', () => {
    const ms = loads.delayMs(30, 20);
    assert.ok(ms > 87 && ms < 88, `${ms}`);
    const calc = getWorkspace('distdelay')!.functions.find((f) => f.key === 'distToDelay')!.compute({ dist: 30, temp: 20 });
    const d = calc.find((o) => o.label === 'DELAY')!;
    assert.ok('value' in d);
    assert.equal(ms, d.value * 1000);
  });
  it('predicted SPL equals the calculator', () => {
    const v = loads.predictedSpl(97, 400, 10, 6);
    const calc = getWorkspace('speakerpower')!.functions.find((f) => f.key === 'predictspl')!.compute({ sens: 97, power: 400, dist: 10, headroom: 6, nspk: 1 });
    const o = calc[0];
    assert.ok('value' in o);
    assert.equal(v, o.value);
  });
  it('amplifier matching is a band, not a number', () => {
    assert.equal(loads.ampMatch(200, 400, 800), 'under');
    assert.equal(loads.ampMatch(600, 400, 800), 'ok');
    assert.equal(loads.ampMatch(1500, 400, 800), 'over');
    const rating = { at8: 300, at4: 500, minOhms: 4, bridged8: 1000, minOhmsBridged: 8 };
    assert.equal(loads.wattsIntoLoad(rating, 8), 300);
    assert.equal(loads.wattsIntoLoad(rating, 4), 500);
    assert.equal(loads.wattsIntoLoad(rating, 2), null);
    assert.equal(loads.wattsIntoLoad(rating, 8, true), 1000);
    assert.equal(loads.wattsIntoLoad(rating, 4, true), null);
  });
});

/* ── faults ──────────────────────────────────────────────────────────────── */

describe('fault library', () => {
  it('twenty-two cases, unique ids, every group used', () => {
    assert.equal(FAULTS.length, 22);
    assert.equal(new Set(FAULTS.map((f) => f.id)).size, 22);
    for (const g of FAULT_GROUPS) assert.ok(FAULTS.some((f) => f.group === g.id), g.id);
  });
  it('every station has a reading; healthy before the fault, not healthy at it', () => {
    for (const f of FAULTS) {
      for (const s of STATION_ORDER) assert.ok(f.reads[s]?.note, `${f.id} missing ${s}`);
      const idx = STATION_ORDER.indexOf(f.faultAt);
      for (let i = 0; i < idx; i++) {
        const r = f.reads[STATION_ORDER[i]];
        assert.equal(r.signal, 'ok', `${f.id}: ${STATION_ORDER[i]} should read healthy before the fault`);
        assert.ok(!r.flags || r.flags.length === 0, `${f.id}: ${STATION_ORDER[i]} flagged before the fault`);
      }
      assert.equal(firstAbnormal(f), f.faultAt, `${f.id}: first abnormal reading must be the fault station`);
    }
  });
  it('the options are unique and the answer is in range', () => {
    for (const f of FAULTS) {
      assert.equal(new Set(f.options).size, f.options.length, f.id);
      assert.ok(f.correct >= 0 && f.correct < f.options.length, f.id);
      assert.ok(f.explain.length > 40 && f.fix.length > 20 && f.forward.length > 20, f.id);
    }
  });
  it('a forward walk is graded as one; a backwards jump is not', () => {
    assert.equal(isForwardWalk(['source', 'cable', 'cable', 'stagebox']), true);
    assert.equal(isForwardWalk(['speaker', 'source']), false);
    const f = FAULTS.find((x) => x.id === 'one-input')!;
    assert.equal(minimalProbes(f), 2);
    const g = gradeAttempt(f, ['source', 'cable'] as Station[], f.correct);
    assert.deepEqual(g, { correct: true, forward: true, sawFault: true, probes: 2, minimal: 2 });
    const bad = gradeAttempt(f, ['speaker', 'amp'] as Station[], f.correct + 1);
    assert.equal(bad.correct, false);
    assert.equal(bad.forward, false);
    assert.equal(bad.sawFault, false);
  });
});

/* ── capstones ───────────────────────────────────────────────────────────── */

type CS = import('../src/features/soundsystems/console.ts').ConsoleState;

/** A reference build per capstone — the proof that each brief is satisfiable
 *  on the venue plot the lab provides. */
function referenceBuild(id: string): { s: System; cs: CS } {
  let cs = con.bandConsole();
  const b = new Build();
  const pre = (ch: string, aux: string) => (cs = con.setSend(cs, ch, aux, { db: 0, tap: 'pre' }));
  const post = (ch: string, aux: string) => (cs = con.setSend(cs, ch, aux, { db: 0, tap: 'post' }));
  const fourMixes = () => {
    pre('vox', 'aux1');
    pre('gtr', 'aux2');
    pre('bass', 'aux3');
    pre('kick', 'aux4');
  };
  const auxFedSubs = () => {
    post('kick', 'aux6');
    post('bass', 'aux6');
    post('keys', 'aux6');
    cs = con.setMatrixInput(cs, 'mx-subs', 'aux6', 0);
  };
  switch (id) {
    case 'speech':
      b.put('mic', 'vocalMic', 'stageC').put('con', 'console', 'foh').put('l', 'poweredSpeaker', 'mainL').put('r', 'poweredSpeaker', 'mainR')
        .link('mic', 'con').link('con', 'l').link('con', 'r');
      break;
    case 'mono-music':
      b.put('mic', 'vocalMic', 'stageC').put('di', 'di', 'stageL').put('pb', 'playback', 'stageR').put('con', 'console', 'foh')
        .put('c', 'poweredSpeaker', 'mainC').put('sub', 'poweredSub', 'subC')
        .link('mic', 'con').link('di', 'con').link('pb', 'con').link('con', 'c').link('con', 'sub');
      break;
    case 'stereo-subs':
      b.put('m1', 'vocalMic', 'stageC').put('m2', 'instrumentMic', 'riserC').put('d1', 'di', 'stageL').put('rx', 'wirelessRx', 'stageR')
        .put('box', 'stagebox', 'stageBox').put('con', 'console', 'foh').put('proc', 'processor', 'rack1').put('ampT', 'amp', 'rack2').put('ampS', 'amp', 'rack3')
        .put('l', 'passiveSpeaker', 'mainL').put('r', 'passiveSpeaker', 'mainR').put('sl', 'passiveSub', 'subL').put('sr', 'passiveSub', 'subR')
        .link('m1', 'box').link('m2', 'box').link('d1', 'box').link('rx', 'box').link('box', 'con').link('con', 'proc')
        .link('proc', 'ampT').link('proc', 'ampS').link('ampT', 'l').link('ampT', 'r').link('ampS', 'sl').link('ampS', 'sr');
      break;
    case 'two-one':
      b.put('pb', 'playback', 'stageC').put('con', 'console', 'foh').put('l', 'poweredSpeaker', 'mainL').put('r', 'poweredSpeaker', 'mainR').put('sub', 'poweredSub', 'subC')
        .link('pb', 'con').link('con', 'l').link('con', 'r').link('con', 'sub');
      break;
    case 'monitors':
      b.put('m1', 'vocalMic', 'stageC').put('m2', 'instrumentMic', 'riserC').put('d1', 'di', 'stageL').put('d2', 'di', 'stageR').put('con', 'console', 'foh')
        .put('w1', 'poweredWedge', 'mon1').put('w2', 'poweredWedge', 'mon2').put('w3', 'poweredWedge', 'mon3').put('w4', 'poweredWedge', 'mon4')
        .put('l', 'poweredSpeaker', 'mainL').put('r', 'poweredSpeaker', 'mainR')
        .link('m1', 'con').link('m2', 'con').link('d1', 'con').link('d2', 'con')
        .link('con', 'w1').link('con', 'w2').link('con', 'w3').link('con', 'w4').link('con', 'l').link('con', 'r');
      fourMixes();
      break;
    case 'groups-fx':
      b.put('mic', 'vocalMic', 'stageC').put('con', 'console', 'foh').put('l', 'poweredSpeaker', 'mainL').put('r', 'poweredSpeaker', 'mainR')
        .link('mic', 'con').link('con', 'l').link('con', 'r');
      for (const d of ['kick', 'snare', 'oh']) cs = con.setChannel(cs, d, { toMain: false, subgroup: 'sub-drums' });
      post('vox', 'aux5');
      post('bvox', 'aux5');
      for (const c of ['kick', 'snare', 'oh', 'bass', 'gtr', 'keys', 'vox', 'bvox']) cs = con.setChannel(cs, c, { dca: 'dca-band' });
      break;
    case 'matrices':
      b.put('mic', 'vocalMic', 'stageC').put('rx', 'wirelessRx', 'stageL').put('pb', 'playback', 'stageR').put('con', 'console', 'foh')
        .put('l', 'poweredSpeaker', 'mainL').put('r', 'poweredSpeaker', 'mainR').put('fl', 'poweredSpeaker', 'frontFillL').put('fr', 'poweredSpeaker', 'frontFillR').put('sub', 'poweredSub', 'subC')
        .link('mic', 'con').link('rx', 'con').link('pb', 'con').link('con', 'l').link('con', 'r').link('con', 'fl').link('con', 'fr').link('con', 'sub');
      cs = con.setMatrixInput(cs, 'mx-fills', 'main', 0);
      pre('mc', 'aux2');
      cs = con.setMatrixInput(cs, 'mx-lobby', 'main', -6);
      cs = con.setMatrixInput(cs, 'mx-lobby', 'aux2', 0);
      auxFedSubs();
      break;
    case 'outdoor':
      b.put('m1', 'vocalMic', 'stageC').put('m2', 'instrumentMic', 'riserC').put('d1', 'di', 'stageL').put('d2', 'di', 'stageR')
        .put('box', 'stagebox', 'stageBox').put('con', 'console', 'foh').put('proc', 'processor', 'rack1').put('ampT', 'amp', 'rack2').put('ampS', 'amp', 'rack3')
        .put('l', 'passiveSpeaker', 'mainL').put('r', 'passiveSpeaker', 'mainR').put('sl', 'passiveSub', 'subL').put('sr', 'passiveSub', 'subR')
        .put('fl', 'poweredSpeaker', 'frontFillL').put('fr', 'poweredSpeaker', 'frontFillR').put('dl', 'poweredSpeaker', 'delayL').put('dr', 'poweredSpeaker', 'delayR')
        .link('m1', 'box').link('m2', 'box').link('d1', 'box').link('d2', 'box').link('box', 'con').link('con', 'proc')
        .link('proc', 'ampT').link('proc', 'ampS').link('ampT', 'l').link('ampT', 'r').link('ampS', 'sl').link('ampS', 'sr')
        .link('proc', 'fl').link('proc', 'fr').link('proc', 'dl').link('proc', 'dr');
      break;
    case 'network':
      b.put('m1', 'vocalMic', 'stageC').put('m2', 'instrumentMic', 'riserC').put('d1', 'di', 'stageL').put('rx', 'wirelessRx', 'stageR')
        .put('box', 'stagebox', 'stageBox').put('con', 'console', 'foh').put('proc', 'processor', 'rack1').put('amp', 'amp', 'rack2')
        .put('l', 'passiveSpeaker', 'mainL').put('r', 'passiveSpeaker', 'mainR')
        .link('m1', 'box').link('m2', 'box').link('d1', 'box').link('rx', 'box').link('box', 'con').link('con', 'box')
        .link('box', 'proc').link('proc', 'amp').link('amp', 'l').link('amp', 'r');
      break;
    case 'festival':
      b.put('m1', 'vocalMic', 'stageC').put('m2', 'vocalMic', 'stageL').put('m3', 'instrumentMic', 'riserC').put('m4', 'instrumentMic', 'riserL').put('d1', 'di', 'riserR').put('rx', 'wirelessRx', 'stageR')
        .put('pack', 'iemPack', 'wingL').put('box', 'stagebox', 'stageBox').put('con', 'console', 'foh')
        .put('proc', 'processor', 'rack1').put('ampT', 'amp', 'rack2').put('ampS', 'amp', 'rack3').put('tx', 'iemTx', 'rack4')
        .put('l', 'passiveSpeaker', 'mainL').put('r', 'passiveSpeaker', 'mainR').put('sl', 'passiveSub', 'subL').put('sr', 'passiveSub', 'subR')
        .put('w1', 'poweredWedge', 'mon1').put('w2', 'poweredWedge', 'mon2').put('w3', 'poweredWedge', 'mon3').put('w4', 'poweredWedge', 'mon4')
        .link('m1', 'box').link('m2', 'box').link('m3', 'box').link('m4', 'box').link('d1', 'box').link('rx', 'box').link('box', 'con').link('con', 'box')
        .link('box', 'proc').link('proc', 'ampT').link('proc', 'ampS').link('ampT', 'l').link('ampT', 'r').link('ampS', 'sl').link('ampS', 'sr')
        .link('box', 'w1').link('box', 'w2').link('box', 'w3').link('box', 'w4').link('box', 'tx').link('tx', 'pack');
      fourMixes();
      cs = con.setMatrixInput(cs, 'mx-rec', 'main', 0);
      auxFedSubs();
      break;
    default:
      throw new Error(`no reference build for ${id}`);
  }
  return { s: b.s, cs };
}

describe('capstones', () => {
  it('ten capstones, numbered 1..10, unique ids, every requirement has a kind', () => {
    assert.equal(CAPSTONES.length, 10);
    assert.deepEqual(CAPSTONES.map((c) => c.n), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.equal(new Set(CAPSTONES.map((c) => c.id)).size, 10);
    for (const c of CAPSTONES) {
      assert.ok(c.requirements.length >= 4, c.id);
      assert.equal(new Set(c.requirements.map((r) => r.id)).size, c.requirements.length, c.id);
      assert.equal(c.routing, c.requirements.some((r) => r.kind === 'route'), `${c.id} routing flag disagrees with its requirements`);
      for (const k of c.bin) gearSpec(k);
    }
  });
  it('the empty venue passes no capstone', () => {
    for (const c of CAPSTONES) assert.equal(gradeCapstone(c, sys.EMPTY_SYSTEM, con.bandConsole()).pass, false, c.id);
  });
  for (const c of CAPSTONES) {
    it(`capstone ${c.n} — ${c.title} — has a passing reference build on the venue plot`, () => {
      const { s, cs } = referenceBuild(c.id);
      const g = gradeCapstone(c, s, cs);
      assert.deepEqual(g.unmet, [], `${c.id} unmet: ${g.unmet.join(', ')}`);
    });
  }
  it('capstone 2 rejects a stereo pair; capstone 4 rejects tops fed through the sub', () => {
    const stereo = referenceBuild('speech');
    assert.ok(gradeCapstone(CAPSTONES[1], stereo.s, stereo.cs).unmet.includes('mono'));
    const b = new Build().put('pb', 'playback', 'stageC').put('con', 'console', 'foh').put('sub', 'poweredSub', 'subC').put('l', 'poweredSpeaker', 'mainL').put('r', 'poweredSpeaker', 'mainR')
      .link('pb', 'con').link('con', 'sub').link('sub', 'l').link('sub', 'r');
    const g = gradeCapstone(CAPSTONES[3], b.s, con.bandConsole());
    assert.ok(g.unmet.includes('topsDirect'));
    assert.ok(!g.unmet.includes('dedicated'));
  });
  it('capstone 9 rejects a source wired straight to the console; capstone 7 rejects a lobby with no aux', () => {
    const r = referenceBuild('network');
    const rx = r.s.placed.find((p) => p.kind === 'wirelessRx')!.id;
    const mic = r.s.placed.find((p) => p.kind === 'vocalMic')!.id;
    const conId = r.s.placed.find((p) => p.kind === 'console')!.id;
    const direct = sys.connect(sys.removePlaced(r.s, rx), mic, conId);
    assert.ok(direct.ok);
    if (direct.ok) assert.ok(gradeCapstone(CAPSTONES[8], direct.system, r.cs).unmet.includes('sources'));
    const m = referenceBuild('matrices');
    const noAux = con.setMatrixInput(m.cs, 'mx-lobby', 'aux2', null);
    assert.ok(gradeCapstone(CAPSTONES[6], m.s, noAux).unmet.includes('lobby'));
  });
});

/* ── configurations ──────────────────────────────────────────────────────── */

describe('output configurations and system types', () => {
  it('thirteen configurations and ten system types with unique ids', () => {
    assert.equal(OUTPUT_CONFIGS.length, 13);
    assert.equal(new Set(OUTPUT_CONFIGS.map((c) => c.id)).size, 13);
    assert.equal(SYSTEM_TYPES.length, 10);
    assert.equal(new Set(SYSTEM_TYPES.map((c) => c.id)).size, 10);
  });
  it('every placed loudspeaker stands in a slot whose role matches its kind', () => {
    const roleFor = { top: ['main'], sub: ['sub'], fill: ['fill'], delay: ['delay'] } as const;
    for (const c of [...OUTPUT_CONFIGS, ...SYSTEM_TYPES]) {
      for (const p of c.layout) {
        const slot = sys.slotDef(p.slot);
        assert.ok((roleFor[p.kind] as readonly string[]).includes(slot.role), `${c.id}: ${p.kind} at ${p.slot} (${slot.role})`);
      }
      assert.equal(new Set(c.layout.map((p) => p.slot)).size, c.layout.length, `${c.id} reuses a slot`);
    }
  });
  it('venue cases point at real system types', () => {
    const ids = new Set(SYSTEM_TYPES.map((t) => t.id));
    for (const v of VENUE_CASES) assert.ok(ids.has(v.correct), v.id);
    assert.equal(new Set(VENUE_CASES.map((v) => v.id)).size, VENUE_CASES.length);
  });
});

/* ── operate ─────────────────────────────────────────────────────────────── */

describe('operate models', () => {
  it('unity through the chain is the professional target', () => {
    const chain = op.computeGainChain({});
    assert.equal(op.gainVerdict(chain), 'ok');
    assert.ok(chain.every((n) => !n.clipped));
  });
  it('a starved preamp made up on the fader is noisy; a hot preamp clips and the clip is inherited', () => {
    assert.equal(op.gainVerdict(op.computeGainChain({ preamp: 5, fader: 10, main: 10, procIn: 10 })), 'noisy');
    const hot = op.computeGainChain({ preamp: 60, fader: 0 });
    assert.equal(op.gainVerdict(hot), 'clipping');
    const first = hot.find((n) => n.clipped)!;
    assert.equal(first.id, 'preamp');
    assert.ok(hot[hot.length - 1].clipped && hot[hot.length - 1].inheritedClip);
  });
  it('sequences grade order and name the first misplaced step', () => {
    const ids = op.POWER_UP.map((s) => s.id);
    assert.equal(op.isSequenceCorrect(ids, op.POWER_UP), true);
    const wrong = [ids[4], ...ids.slice(0, 4), ids[5]];
    assert.equal(op.isSequenceCorrect(wrong, op.POWER_UP), false);
    assert.deepEqual(op.firstSequenceError(wrong, op.POWER_UP), { id: 'amps', mustFollow: 'verify' });
    assert.equal(op.SETUP_SEQUENCE.length, 16);
    assert.deepEqual(op.SETUP_SEQUENCE.map((s) => s.n), Array.from({ length: 16 }, (_, i) => i + 1));
  });
});

/* ── check ───────────────────────────────────────────────────────────────── */

describe('understanding check', () => {
  it('has enough questions, each answered by a value in its own options', () => {
    assert.ok(SOUND_SYSTEMS_CHECK.length >= 12);
    assert.equal(new Set(SOUND_SYSTEMS_CHECK.map((q) => q.id)).size, SOUND_SYSTEMS_CHECK.length);
    for (const q of SOUND_SYSTEMS_CHECK) {
      assert.ok(q.options.includes(q.correct), q.id);
      assert.ok(q.options.length >= 3 && q.options.length <= 5, q.id);
      assert.ok(q.explanation.length > 30, q.id);
    }
  });
});

/* ── progress store ──────────────────────────────────────────────────────── */

describe('progress store', () => {
  it('records, de-duplicates, persists and resets', async () => {
    progress.markFaultSolved('nothing', true);
    progress.markFaultSolved('nothing', false);
    progress.markCapstonePassed('speech');
    await new Promise((r) => setTimeout(r, 5));
    const p = progress.getSoundSystemsProgress();
    assert.deepEqual(p.faults, ['nothing']);
    assert.deepEqual(p.forward, ['nothing']);
    assert.deepEqual(p.capstones, ['speech']);
    assert.ok(store.get('ape:soundsystems:v1')?.includes('speech'));
    progress.resetLocal();
    assert.deepEqual(progress.getSoundSystemsProgress().faults, []);
  });
});
