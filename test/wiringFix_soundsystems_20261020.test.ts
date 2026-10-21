/**
 * Wiring fixes, Sound Systems Lab (owner go 2026-10-20) — ratchets for
 * SS-02, SS-04 … SS-10 in docs/wiring/WIRING_FINDINGS_2026_10_20.md.
 * Each block fails if the wrong logic or wording comes back.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE__ = new Map<string, string>();

// House resolver hook (see soundSystemsEngine.test.ts): extensionless sibling imports.
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

const sys = await import('../src/features/soundsystems/system.ts');
const con = await import('../src/features/soundsystems/console.ts');
const cov = await import('../src/features/soundsystems/coverage.ts');
const { CAPSTONES, gradeCapstone } = await import('../src/features/soundsystems/capstones.ts');
const { FAULTS } = await import('../src/features/soundsystems/faults.ts');
const { OUTPUT_CONFIGS } = await import('../src/features/soundsystems/configs.ts');
const { SOUND_SYSTEMS_CHECK } = await import('../src/features/soundsystems/check.ts');

type System = import('../src/features/soundsystems/types.ts').SoundSystem;
type GearKind = import('../src/features/soundsystems/types.ts').GearKind;
type SlotId = import('../src/features/soundsystems/types.ts').SlotId;
type ConsoleOut = import('../src/features/soundsystems/types.ts').ConsoleOut;

const src = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const ROUTE = src('screens/lab/soundsystems/pagesRoute.tsx');
const LEARN_B = src('screens/lab/soundsystems/pagesLearnB.tsx');
const LEARN_C = src('screens/lab/soundsystems/pagesLearnC.tsx');
const BUILD = src('screens/lab/soundsystems/pagesBuild.tsx');
const TROUBLE = src('screens/lab/soundsystems/pagesTroubleshoot.tsx');
const CONSOLE = src('features/soundsystems/console.ts');

class Build {
  s: System = sys.EMPTY_SYSTEM;
  ids: Record<string, string> = {};
  put(tag: string, kind: GearKind, slot: SlotId): this {
    const v = sys.place(this.s, kind, slot);
    assert.ok(v.ok, `place ${kind} at ${slot}`);
    this.s = v.system;
    this.ids[tag] = v.id;
    return this;
  }
  link(a: string, b: string, out?: ConsoleOut): this {
    const v = sys.connect(this.s, this.ids[a], this.ids[b], out);
    assert.ok(v.ok, `link ${a} → ${b}: ${v.ok ? '' : v.reason}`);
    this.s = v.system;
    return this;
  }
}
const cap = (id: string) => CAPSTONES.find((c) => c.id === id)!;

describe('SS-02 · every loudspeaker must be fed THROUGH the console', () => {
  it('every capstone grades it', () => {
    for (const c of CAPSTONES) assert.ok(c.requirements.some((r) => r.id === 'viaConsole'), c.id);
  });
  it('outdoor: stagebox straight into the processor (console fed, but no return) is bypassed', () => {
    const b = new Build()
      .put('m1', 'vocalMic', 'stageC').put('m2', 'instrumentMic', 'riserC').put('d1', 'di', 'stageL').put('d2', 'di', 'stageR')
      .put('box', 'stagebox', 'stageBox').put('con', 'console', 'foh').put('proc', 'processor', 'rack1').put('ampT', 'amp', 'rack2').put('ampS', 'amp', 'rack3')
      .put('l', 'passiveSpeaker', 'mainL').put('r', 'passiveSpeaker', 'mainR').put('sl', 'passiveSub', 'subL').put('sr', 'passiveSub', 'subR')
      .put('fl', 'poweredSpeaker', 'frontFillL').put('fr', 'poweredSpeaker', 'frontFillR').put('dl', 'poweredSpeaker', 'delayL').put('dr', 'poweredSpeaker', 'delayR')
      .link('m1', 'box').link('m2', 'box').link('d1', 'box').link('d2', 'box').link('box', 'con').link('box', 'proc')
      .link('proc', 'ampT').link('proc', 'ampS').link('ampT', 'l', 'mainL').link('ampT', 'r', 'mainR').link('ampS', 'sl', 'mainL').link('ampS', 'sr', 'mainR')
      .link('proc', 'fl', 'mainL').link('proc', 'fr', 'mainR').link('proc', 'dl', 'mainL').link('proc', 'dr', 'mainR');
    assert.equal(sys.allSinksLive(b.s), true, 'the plain trace still calls it live — that was the hole');
    assert.equal(sys.sinksThroughConsole(b.s), false);
    const g = gradeCapstone(cap('outdoor'), b.s, con.bandConsole());
    // No console output reaches a loudspeaker either, so the FEEDS row
    // (WF-SS-02) fails with it — the outputs chosen are only names until
    // the console return carries them.
    assert.deepEqual(g.unmet, ['viaConsole', 'feeds']);
    // the console return closes it
    const fixed = sys.connect(b.s, b.ids.con, b.ids.box);
    assert.ok(fixed.ok);
    if (fixed.ok) assert.deepEqual(gradeCapstone(cap('outdoor'), fixed.system, con.bandConsole()).unmet, []);
  });
  it('outdoor with no console at all fails', () => {
    const b = new Build()
      .put('m1', 'vocalMic', 'stageC').put('box', 'stagebox', 'stageBox').put('proc', 'processor', 'rack1').put('l', 'poweredSpeaker', 'mainL')
      .link('m1', 'box').link('box', 'proc').link('proc', 'l');
    assert.equal(sys.sinksThroughConsole(b.s), false);
    assert.ok(gradeCapstone(cap('outdoor'), b.s, con.bandConsole()).unmet.includes('viaConsole'));
  });
  it('2.1: a wireless receiver wired straight into one top bypasses the mix', () => {
    const b = new Build()
      .put('pb', 'playback', 'stageC').put('pb2', 'wirelessRx', 'stageL').put('con', 'console', 'foh')
      .put('l', 'poweredSpeaker', 'mainL').put('r', 'poweredSpeaker', 'mainR').put('sub', 'poweredSub', 'subC')
      .link('pb', 'con').link('pb2', 'l').link('con', 'r').link('con', 'sub');
    assert.equal(sys.sinksThroughConsole(b.s), false);
    assert.ok(gradeCapstone(cap('two-one'), b.s, con.bandConsole()).unmet.includes('viaConsole'));
  });
  it('the network return (console → stagebox → processor and wedges) is THROUGH the console', () => {
    const b = new Build()
      .put('m1', 'vocalMic', 'stageC').put('box', 'stagebox', 'stageBox').put('con', 'console', 'foh').put('proc', 'processor', 'rack1')
      .put('l', 'poweredSpeaker', 'mainL').put('w', 'poweredWedge', 'mon1')
      .link('m1', 'box').link('box', 'con').link('con', 'box').link('box', 'proc').link('proc', 'l').link('box', 'w');
    assert.equal(sys.sinksThroughConsole(b.s), true);
  });
});

describe('SS-04 · the insert point is console-dependent', () => {
  it('names pre-EQ on most compact analog desks and the digital choice', () => {
    assert.match(ROUTE, /Where it sits depends on the console: this lab’s strip puts it after the EQ, most compact analog desks put it before the EQ/);
    assert.match(ROUTE, /many digital desks let you choose pre- or post-EQ/);
  });
});

describe('SS-05 · the troubleshooting prose agrees with the fault data', () => {
  it('“nothing anywhere” starts at the console input, as the data does', () => {
    assert.equal(FAULTS.find((f) => f.id === 'nothing')!.startAt, 'consoleIn');
    assert.match(TROUBLE, /“nothing anywhere” starts at the console input/);
    assert.doesNotMatch(TROUBLE, /starts at the console output, because the meters/);
  });
});

describe('SS-06 · +4 dBu ↔ dBFS is a console reference, not a universal', () => {
  it('hedged, with EBU R68 and SMPTE RP155 named correctly', () => {
    assert.doesNotMatch(LEARN_C, /The console’s nominal \+4 dBu sits at about −18 dBFS/);
    assert.match(LEARN_C, /On many consoles the nominal \+4 dBu/);
    assert.match(LEARN_C, /EBU R68 aligns 0 dBu to −18 dBFS, SMPTE RP155 aligns \+4 dBu to −20 dBFS/);
    assert.match(src('screens/lab/soundsystems/art/ChainMeter.tsx'), /−18 dBFS on this lab’s console \(the reference varies\)/);
  });
});

describe('SS-07 · delay loudspeakers: align, then the precedence offset', () => {
  it('every delay claim names the extra few milliseconds', () => {
    const q = SOUND_SYSTEMS_CHECK.find((x) => x.id === 'delay-time')!;
    assert.ok(q.options.includes(q.correct));
    assert.match(q.correct, /a few ms more/);
    assert.match(q.explanation, /precedence/);
    assert.match(OUTPUT_CONFIGS.find((c) => /delay/i.test(c.what) && c.layout.some((l) => l.kind === 'delay'))!.what, /a few milliseconds more/);
    assert.match(FAULTS.find((f) => f.id === 'delay-time')!.explain, /a few milliseconds more/);
    assert.doesNotMatch(src('features/soundsystems/configs.ts'), /arrives together with the mains\./);
  });
});

describe('SS-08 · a matched pair carrying the same signal is correlated', () => {
  const l = { x: 40, y: 0, aimDeg: 15, coverDeg: 90 };
  const r = { x: 320, y: 0, aimDeg: -15, coverDeg: 90 };
  it('about +6 dB on the time-aligned centre line', () => {
    const d = cov.fieldDb([l, r], 180, 200) - cov.fieldDb([l], 180, 200);
    assert.ok(d > 5.5 && d < 6.5, `${d}`);
  });
  it('a power sum (combing averages to about +3 dB) off the line', () => {
    const a = cov.fieldDb([l], 220, 200);
    const b = cov.fieldDb([r], 220, 200);
    const both = cov.fieldDb([l, r], 220, 200);
    assert.ok(Math.abs(both - 10 * Math.log10(10 ** (a / 10) + 10 ** (b / 10))) < 0.01);
  });
  it('unrelated boxes (a main and a front fill) still sum as power', () => {
    const fill = { x: 180, y: 0, aimDeg: 0, coverDeg: 90, gain: 0.06, throw: 40 };
    const top = { x: 180, y: 0, aimDeg: 0, coverDeg: 90 };
    const a = cov.fieldDb([top], 180, 100);
    const b = cov.fieldDb([fill], 180, 100);
    assert.ok(Math.abs(cov.fieldDb([top, fill], 180, 100) - 10 * Math.log10(10 ** (a / 10) + 10 ** (b / 10))) < 0.01);
  });
  it('the header no longer teaches the uncorrelated +3 dB for the same signal', () => {
    assert.doesNotMatch(src('features/soundsystems/coverage.ts'), /add about 3 dB there, not 6/);
    assert.doesNotMatch(src('features/soundsystems/configs.ts'), /the comb-filter zone down the middle/);
  });
});

describe('SS-09 · double routing: usually one, parallel on purpose', () => {
  it('the strip and the subgroup page name deliberate parallel routing', () => {
    assert.doesNotMatch(ROUTE, /one or the other, never both/);
    assert.match(ROUTE, /usually one or the other\. Both by accident is the double-routing fault/);
    assert.match(ROUTE, /on purpose it is parallel processing/);
    assert.match(CONSOLE, /on purpose\n \* it is parallel processing/);
  });
});

describe('SS-10 · small inconsistencies', () => {
  it('mic-to-line shortfall is 40–60 dB everywhere', () => {
    assert.doesNotMatch(LEARN_B, /40–50 dB too quiet/);
    assert.match(LEARN_B, /40–60 dB too quiet/);
    assert.match(src('features/soundsystems/system.ts'), /roughly 40–60 dB/);
  });
  it('five levels on cables (the type has seven); refusals are not “three reasons”', () => {
    assert.match(LEARN_B, /Five signal levels travel on cables \(sound in the air and radio links are the other two/);
    assert.doesNotMatch(LEARN_B, /Every refusal in BUILD mode is one of these three sentences/);
    assert.doesNotMatch(BUILD, /refuses a link for one of three reasons/);
  });
  it('the lab console’s sub aux is kick, bass and keys — no floor-tom channel claimed', () => {
    const ids = con.bandConsole().channels.map((c) => c.id);
    assert.ok(!ids.some((id) => /tom/i.test(id)));
    assert.doesNotMatch(CONSOLE, /kick, bass, floor tom and keyboard/);
    assert.match(LEARN_B, /on this lab’s console kick, bass and keys/);
    assert.match(LEARN_B, /a matrix taking MAIN sends the whole mix/);
  });
  it('2.1 via the sub: L and R on two inputs keep the tops stereo; one cable is a mono feed (round 2, SS-R2-09)', () => {
    const c = OUTPUT_CONFIGS.find((x) => x.id === 'two-one')!;
    assert.ok(c.layout.some((l) => l.feed === 'L') && c.layout.some((l) => l.feed === 'R'));
    assert.doesNotMatch(c.what, /One console output/);
    assert.match(c.what, /Many subs take L and R on two inputs and pass both on, high-passed, so the tops stay stereo; with one cable into the sub — a mono feed — the tops play mono\./);
  });
  it('toe-in: the inner edge meets the centre line about a third of the way back (true to the plot)', () => {
    const s = sys.slotDef('mainL');
    const edge = ((18 + 45) * Math.PI) / 180;
    const y = s.y + ((180 - s.x) / Math.sin(edge)) * Math.cos(edge);
    const frac = (y - 140) / (314 - 140); // the audience block, VenueView AUD
    assert.ok(frac > 0.2 && frac < 0.4, `${frac}`);
    assert.match(OUTPUT_CONFIGS.find((x) => x.id === 'stereo')!.changes, /about a third of the way back/);
  });
  it('the wedge null is not cardioid-only', () => {
    assert.doesNotMatch(LEARN_B, /microphone’s null, directly behind it\./);
    assert.match(LEARN_B, /directly behind a cardioid, about 110–125° off-axis for a super- or hypercardioid/);
  });
  it('the polarity fault ties its station to its cable fix', () => {
    const f = FAULTS.find((x) => x.id === 'polarity')!;
    assert.equal(f.faultAt, 'speaker');
    assert.match(f.explain, /the cable INTO the right cabinet is the cause/);
  });
});
