/**
 * Sound Systems BUILD — cables carry WHICH console output (finding WF-SS-02,
 * owner go 2026-10-20; plan + the owner's eight decisions in
 * docs/wiring/SOUNDSYSTEMS_OUTPUTS_PLAN_2026_10_20.md).
 *
 * Pins: the seventeen outputs and their names (fifteen until round 3: the
 * stereo In-ears L/R pair, Aux 9 + 10, was added for R3-SS-01); Aux 8 ·
 * In-ears on the lab console; the one walk (`consoleWalk`) — the multicore carries every
 * output, an unchosen or stale choice reads '*', the input side ignores
 * `out`, `trace` never reads it; the FEEDS row on all ten capstones (every
 * reference build passes it, a build with no outputs chosen is live and
 * through the console and fails ONLY feeds, a wedge on a main fails, crossed
 * L/R fails, mono passes speech and Groups/FX only, the 2.1 sub on Aux 6 or
 * Matrix 1, wedges on different auxes, matrices fills/subs, the festival
 * in-ears on Aux 8); the BUILD page's OUTPUT key and plot tags; and that a
 * capstone passed before stays passed.
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
const outs = await import('../src/features/soundsystems/outputs.ts');
const { CAPSTONES, gradeCapstone, feedFits } = await import('../src/features/soundsystems/capstones.ts');
const { Build, referenceBuild } = await import('./_ssReferenceBuilds.ts');

type System = import('../src/features/soundsystems/types.ts').SoundSystem;
type ConsoleOut = import('../src/features/soundsystems/types.ts').ConsoleOut;

const src = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8');
const cap = (id: string) => CAPSTONES.find((c) => c.id === id)!;
const unmet = (id: string, s: System, cs = referenceBuild(id).cs) => gradeCapstone(cap(id), s, cs).unmet;
/** The same build with every output choice cleared. */
const stripOuts = (s: System): System => ({ placed: s.placed, links: s.links.map((l) => ({ from: l.from, to: l.to, level: l.level })) });
/** Re-point the cable INTO one loudspeaker (by slot) at another output. */
const repoint = (s: System, slot: string, out: ConsoleOut | null): System => {
  const p = s.placed.find((x) => x.slot === slot)!;
  const l = s.links.find((x) => x.to === p.id)!;
  return sys.setLinkOut(s, l.from, l.to, out);
};
const feedAt = (s: System, slot: string) => sys.feedOf(s, s.placed.find((x) => x.slot === slot)!.id);

describe('the console outputs', () => {
  // Round 3 (R3-SS-01, owner: a dedicated in-ear pair): Aux 9 + 10 join the
  // console, so fifteen outputs became seventeen and eight auxes ten.
  it('seventeen: MAIN L/R/MONO, Aux 1–10, Matrix 1–4 — unique, with plain labels', () => {
    assert.equal(outs.CONSOLE_OUTS.length, 17);
    assert.equal(new Set(outs.CONSOLE_OUTS).size, 17);
    assert.equal(outs.outLabel('mainL'), 'MAIN L');
    assert.equal(outs.outLabel('aux2'), 'AUX 2');
    assert.equal(outs.outLabel('mtx1'), 'MTX 1 · SUBS');
    assert.equal(outs.outTag('mtx1'), 'MTX 1');
    assert.equal(outs.OUT_UNSET, 'OUT ?');
    assert.deepEqual(outs.CONSOLE_OUTS.map(outs.outFamily).filter((f) => f === 'aux').length, 10);
    for (const o of outs.CONSOLE_OUTS) {
      assert.ok(outs.outTag(o).length <= 6, `${o}: the plot tag stays short`);
      assert.ok(outs.outUse(o).length > 10, o);
    }
  });
  it('Aux 8 · In-ears is on the lab console; the aux purposes come from it', () => {
    const cs = con.bandConsole();
    assert.deepEqual(cs.auxes.find((a) => a.id === 'aux8'), { id: 'aux8', name: 'Aux 8 · In-ears', purpose: 'iem', masterDb: 0 });
    assert.equal(cs.auxes.length, 10, 'Aux 1–8 plus the In-ears L/R pair (R3-SS-01)');
    assert.equal(outs.auxPurpose('aux8'), 'iem');
    assert.equal(outs.auxPurpose('aux1'), 'monitor');
    assert.equal(outs.auxPurpose('aux6'), 'sub');
    assert.equal(outs.auxPurpose('mainL'), null);
    for (const m of Object.values(outs.MTX_MATRIX)) assert.ok(cs.matrices.some((x) => x.id === m), m);
    assert.equal(outs.outName('aux8'), 'Aux 8 · In-ears');
    assert.equal(outs.outName('mtx2'), 'Matrix 2 · Front fills');
  });
});

describe('the console walk', () => {
  const base = () => new Build().put('mic', 'vocalMic', 'stageC').put('con', 'console', 'foh');
  it('a cable straight from the console with no output chosen reads OUT ? — the loudspeaker still lights', () => {
    const b = base().put('l', 'poweredSpeaker', 'mainL').link('mic', 'con').link('con', 'l');
    assert.equal(sys.feedOf(b.s, b.ids.l), '*');
    assert.ok(sys.trace(b.s).live.includes(b.ids.l));
    assert.equal(sys.sinksThroughConsole(b.s), true);
    assert.equal(sys.feedOf(sys.setLinkOut(b.s, b.ids.con, b.ids.l, 'mainL'), b.ids.l), 'mainL');
    assert.equal(sys.feedOf(sys.setLinkOut(sys.setLinkOut(b.s, b.ids.con, b.ids.l, 'mainL'), b.ids.con, b.ids.l, null), b.ids.l), '*');
  });
  it('the console → stagebox link carries EVERY output; the return picks one (decision 1)', () => {
    const b = base().put('box', 'stagebox', 'stageBox').put('w', 'poweredWedge', 'mon1').put('l', 'poweredSpeaker', 'mainL')
      .link('mic', 'box').link('box', 'con').link('con', 'box', 'aux3').link('box', 'w', 'aux1').link('box', 'l', 'mainL');
    assert.equal(sys.feedOf(b.s, b.ids.w), 'aux1', 'the out on the multicore run is ignored');
    assert.equal(sys.feedOf(b.s, b.ids.l), 'mainL');
    const conBox = b.s.links.find((l) => l.from === b.ids.con && l.to === b.ids.box)!;
    assert.equal(sys.carriesOutputs(b.s, conBox), false);
    assert.equal(sys.linkCarries(b.s, conBox), 'all');
    assert.equal(sys.outChoices(b.s, b.s.links.find((l) => l.to === b.ids.w)!).length, 17, 'every output, the In-ears L/R pair included (R3-SS-01)');
  });
  it('the input side ignores `out`; trace and chainTo never read it', () => {
    const b = base().put('l', 'poweredSpeaker', 'mainL').link('mic', 'con', 'aux4').link('con', 'l', 'mainL');
    assert.equal(sys.feedOf(b.s, b.ids.l), 'mainL');
    const micCon = b.s.links.find((l) => l.to === b.ids.con)!;
    assert.equal(sys.carriesOutputs(b.s, micCon), false);
    const bare = stripOuts(b.s);
    assert.deepEqual([...sys.trace(b.s).live], [...sys.trace(bare).live]);
    assert.deepEqual(sys.chainTo(b.s, b.ids.l).map((p) => p.id), sys.chainTo(bare, b.ids.l).map((p) => p.id));
  });
  it('pass-through gear offers only what reaches it; a stale choice reads OUT ?', () => {
    const b = base().put('proc', 'processor', 'rack1').put('amp', 'amp', 'rack2').put('l', 'passiveSpeaker', 'mainL').put('r', 'passiveSpeaker', 'mainR')
      .link('mic', 'con').link('con', 'proc', 'mainL').link('proc', 'amp').link('amp', 'l').link('amp', 'r', 'mainR');
    const ampL = b.s.links.find((l) => l.to === b.ids.l)!;
    assert.deepEqual(sys.outChoices(b.s, ampL), ['mainL'], 'one output reaches the amp: the OUTPUT key is LOCKED');
    assert.equal(sys.feedOf(b.s, b.ids.l), 'mainL', 'an unchosen hop passes on what reaches it');
    assert.equal(sys.feedOf(b.s, b.ids.r), '*', 'MAIN R never reaches the amp — the stale choice reads OUT ?');
    const open = sys.setLinkOut(b.s, b.ids.con, b.ids.proc, null);
    assert.equal(sys.feedOf(open, b.ids.r), 'mainR', 'one cable may carry all outputs into the processor');
    assert.equal(sys.feedOf(open, b.ids.l), '*', 'all outputs reach the left box and none is chosen');
  });
  it('a loudspeaker fed around the console has no console output at all', () => {
    const b = new Build().put('pb', 'playback', 'stageC').put('l', 'poweredSpeaker', 'mainL').link('pb', 'l', 'mainL');
    assert.equal(sys.feedOf(b.s, b.ids.l), null);
    assert.equal(sys.consoleWalk(b.s).viaConsole, false);
  });
  it('the in-ear pack is fed what reaches its transmitter', () => {
    const { s } = referenceBuild('festival');
    const pack = s.placed.find((p) => p.kind === 'iemPack')!;
    assert.equal(sys.feedOf(s, pack.id), 'aux8');
  });
});

describe('FEEDS on every capstone', () => {
  for (const c of CAPSTONES) {
    it(`capstone ${c.n} (${c.id}): the reference build passes; with no outputs chosen it is live and through the console and fails ONLY feeds`, () => {
      const { s, cs } = referenceBuild(c.id);
      assert.ok(c.requirements.some((r) => r.id === 'feeds' && r.kind === 'build' && /^Outputs: /.test(r.text)), c.id);
      assert.deepEqual(gradeCapstone(c, s, cs).unmet, []);
      const bare = stripOuts(s);
      assert.equal(sys.allSinksLive(bare), true);
      assert.equal(sys.sinksThroughConsole(bare), true);
      assert.deepEqual(gradeCapstone(c, bare, cs).unmet, ['feeds']);
    });
  }
  it('a wedge on a main fails; a wedge on the reverb aux fails; the empty venue fails', () => {
    const { s } = referenceBuild('monitors');
    assert.deepEqual(unmet('monitors', repoint(s, 'mon1', 'mainL')), ['feeds']);
    assert.deepEqual(unmet('monitors', repoint(s, 'mon1', 'aux5')), ['feeds']);
    assert.ok(unmet('monitors', sys.EMPTY_SYSTEM).includes('feeds'));
  });
  it('wedges must be on DIFFERENT monitor auxes — not necessarily wedge N on aux N (decision 4)', () => {
    const { s } = referenceBuild('monitors');
    assert.deepEqual(unmet('monitors', repoint(s, 'mon2', 'aux1')), ['feeds'], 'two wedges on Aux 1');
    const swapped = repoint(repoint(s, 'mon1', 'aux2'), 'mon2', 'aux1');
    assert.deepEqual(unmet('monitors', swapped), []);
    const f = referenceBuild('festival');
    assert.deepEqual(unmet('festival', repoint(f.s, 'mon4', 'aux3')), ['feeds']);
  });
  it('crossed L/R fails; mono into both passes speech, Groups/FX (decision 2) and 2.1 (owner 2026-10-21)', () => {
    for (const id of ['speech', 'groups-fx', 'two-one', 'stereo-subs', 'network', 'monitors', 'matrices', 'outdoor', 'festival']) {
      const { s } = referenceBuild(id);
      const crossed = repoint(repoint(s, 'mainL', 'mainR'), 'mainR', 'mainL');
      assert.deepEqual(unmet(id, crossed), ['feeds'], `${id} crossed`);
      const mono = repoint(repoint(s, 'mainL', 'mainMono'), 'mainR', 'mainMono');
      assert.deepEqual(unmet(id, mono), id === 'speech' || id === 'groups-fx' || id === 'two-one' ? [] : ['feeds'], `${id} mono`);
    }
  });
  it('the centre box takes MAIN MONO only; a main never takes an aux', () => {
    const { s } = referenceBuild('mono-music');
    assert.deepEqual(unmet('mono-music', repoint(s, 'mainC', 'mainL')), ['feeds']);
    const sp = referenceBuild('speech').s;
    assert.deepEqual(unmet('speech', repoint(sp, 'mainL', 'aux1')), ['feeds']);
  });
  it('2.1: the sub on Aux 6 or Matrix 1 passes, on a main fails (decision 3)', () => {
    const { s } = referenceBuild('two-one');
    assert.equal(feedAt(s, 'subC'), 'aux6');
    assert.deepEqual(unmet('two-one', repoint(s, 'subC', 'mtx1')), []);
    assert.deepEqual(unmet('two-one', repoint(s, 'subC', 'mainMono')), ['feeds']);
    assert.deepEqual(unmet('two-one', repoint(s, 'subC', 'aux7')), ['feeds']);
  });
  it('stereo subs take any main output, mono-summed included (decision 5)', () => {
    const { s } = referenceBuild('stereo-subs');
    for (const o of ['mainL', 'mainR', 'mainMono'] as ConsoleOut[]) assert.deepEqual(unmet('stereo-subs', repoint(repoint(s, 'subL', o), 'subR', o)), [], o);
    assert.deepEqual(unmet('stereo-subs', repoint(s, 'subL', 'aux1')), ['feeds']);
  });
  it('matrices: the front fills on Matrix 2 and the subs on Matrix 1', () => {
    const { s } = referenceBuild('matrices');
    assert.deepEqual(unmet('matrices', repoint(s, 'frontFillL', 'mainL')), ['feeds']);
    assert.deepEqual(unmet('matrices', repoint(s, 'subC', 'aux6')), ['feeds']);
  });
  // Round 3 (R3-SS-02, owner: tighten): a delay no longer passes on Matrix 2
  // — that matrix is the front fills' — so this case flipped from [] to
  // ['feeds']; test/wiringFix_r3_soundsystems_20261021 pins the rest.
  it('outdoor: fills on their own side’s main, MONO or Matrix 2, delays on their own side’s main or MONO — never an aux, the lobby, the recording or the fills’ matrix (SS-R2-06, R3-SS-02)', () => {
    const { s } = referenceBuild('outdoor');
    assert.deepEqual(unmet('outdoor', repoint(s, 'delayL', 'mtx2')), ['feeds']);
    assert.deepEqual(unmet('outdoor', repoint(s, 'delayL', 'mainMono')), []);
    assert.deepEqual(unmet('outdoor', repoint(s, 'delayL', 'mtx3')), ['feeds']);
    assert.deepEqual(unmet('outdoor', repoint(s, 'delayL', 'aux7')), ['feeds']);
  });
  it('festival: the in-ear transmitter must take Aux 8 (decision 6); the subs Aux 6', () => {
    const { s } = referenceBuild('festival');
    const tx = s.placed.find((p) => p.kind === 'iemTx')!;
    const intoTx = s.links.find((l) => l.to === tx.id)!;
    assert.deepEqual(unmet('festival', sys.setLinkOut(s, intoTx.from, intoTx.to, 'aux4')), ['feeds'], 'a wedge mix in the ears');
    assert.deepEqual(unmet('festival', sys.setLinkOut(s, intoTx.from, intoTx.to, 'mainL')), ['feeds']);
    assert.deepEqual(unmet('festival', repoint(s, 'subL', 'mainL')), ['feeds']);
  });
  it('feedFits: a monitor position or a pack never takes a main; unchosen never fits', () => {
    const at = (kind: 'poweredWedge' | 'iemPack' | 'poweredSub', slot: 'mon1' | 'wingL' | 'drumFill' | 'subL') => ({ id: 'x', kind, slot });
    assert.equal(feedFits(at('poweredWedge', 'mon1'), 'mainMono'), false);
    assert.equal(feedFits(at('poweredWedge', 'mon1'), 'aux8'), false, 'a wedge takes a monitor aux, not the in-ear aux (round 2, SS-R2-05)');
    assert.equal(feedFits(at('poweredWedge', 'mon1'), 'aux1'), true);
    assert.equal(feedFits(at('iemPack', 'wingL'), 'aux8'), true);
    assert.equal(feedFits(at('poweredSub', 'drumFill'), 'aux4'), true);
    assert.equal(feedFits(at('iemPack', 'wingL'), 'mainL'), false);
    assert.equal(feedFits(at('poweredSub', 'subL'), '*'), false);
    assert.equal(feedFits(at('poweredSub', 'subL'), null), false);
  });
});

describe('BUILD page: OUTPUT key, tags, cable words, the record kept', () => {
  const BUILD = src('screens/lab/soundsystems/pagesBuild.tsx');
  const PLOT = src('screens/lab/soundsystems/plot.tsx');
  const VENUE = src('screens/lab/soundsystems/art/VenueView.tsx');
  it('OUTPUT follows PART in the dock: a lane for many, a tap key for 2–4, LOCKED with a reason for one (D75)', () => {
    assert.match(BUILD, /\.\.\.\(output \? \[output\] : \[\]\),\n {4}\.\.\.\(extras\.console/);
    assert.match(BUILD, /if \(choices\.length <= 4\) \{\n {4}return \{\n {6}kind: 'options',/);
    assert.match(BUILD, /locked: `Only \$\{outName\(only\)\} reaches the/);
    assert.match(BUILD, /label: 'OUTPUT'/);
  });
  it('the prompt names OUTPUT; the card reads the output beside FED BY; the bezel is unchanged', () => {
    assert.match(BUILD, /Tap OUTPUT to choose which console output feeds it/);
    assert.match(BUILD, /FED BY · \{upstream\(/);
    assert.match(BUILD, /\{carried \? ` · \$\{carried\}` : ''\}/);
    assert.doesNotMatch(BUILD, /k: 'OUTPUT'/, 'the bezel stays read-only and unchanged');
  });
  it('the plot tags each loudspeaker with its output and moves the tags that would clash', () => {
    assert.match(BUILD, /placedToBeams\(b\.system\.placed, b\.live, tags\)/);
    assert.match(PLOT, /if \(slot === 'subL' \|\| slot === 'subR'\) return \{ feedDy: -18 \};/);
    assert.match(PLOT, /if \(slot === 'mainC'\) return \{ feedDx: -12, feedDy: 4, feedAnchor: 'end' \};/);
    assert.match(VENUE, /\{lipClear \? <PlotLabel x=\{111\} y=\{124\}/);
  });
  it('a cable reads what it carries to a screen reader', () => {
    assert.match(VENUE, /\$\{p\.linkA11y\?\.\(l\) \? `, \$\{p\.linkA11y\(l\)\}` : ''\} — tap to remove/);
    assert.match(BUILD, /'carries every console output'/);
    assert.match(BUILD, /'no console output chosen'/);
  });
  it('a capstone passed before stays passed (decision 8): the page never un-marks, the store only adds', () => {
    assert.doesNotMatch(BUILD, /unmarkCapstone|removeCapstone|capstones\s*=\s*\[\]/);
    assert.match(BUILD, /Passed earlier — still credited\./);
    const progress = src('features/soundsystems/progress.ts');
    assert.match(progress, /export function markCapstonePassed\(id: string\): void \{\n {2}add\('capstones', id\);/);
  });
});
