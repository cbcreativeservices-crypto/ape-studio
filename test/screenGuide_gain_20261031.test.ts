/**
 * Screen Guide rollout — Gain Staging Lab (2026-10-31) — receipts.
 * Pattern: test/screenGuide_20261031.test.ts (the Wave Physics pilot).
 *
 *   1. every GainModuleId, the lab home and the what's-left view have a guide
 *      with all five sections, 1–5 bullets each, 2–3 TRY THIS, in the house
 *      copy rules, each step inside its no-scroll budget;
 *   2. each guide quotes its screen's REAL names — every name pinned here is
 *      in both the guide and the lab's source (rename one → update the guide);
 *   3. the TRY THIS numbers are what the engine prints at that setting;
 *   4. wiring: both headers pass `guide` to LabHeader inside a ScreenGuideHost
 *      (regions off on the menu, on for the Rack Unit modules);
 *   5. chip decision pinned (correction, owner rule 2026-10-31): GAIN / level
 *      readouts are one of the owner's OWN named examples of a lab that keeps
 *      the AccuracyNote — so both headers KEEP the compact chip and the ⓘ sits
 *      beside it (LabHeader draws `right` first, then the key), as Room Design.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { GAIN_MODULES } = await import('../src/screens/lab/gain/modules/registry.ts');
const { GAIN_SCREEN_GUIDES, GAIN_HOME_GUIDE, GAIN_END_GUIDE } = await import('../src/screens/lab/gain/gainScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const E = await import('../src/screens/lab/gain/gainEngine.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const MODS = GAIN_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides: [string, Guide][] = [
  ['home', GAIN_HOME_GUIDE as unknown as Guide],
  ['end', GAIN_END_GUIDE as unknown as Guide],
  ...Object.entries(MODS),
];
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');

describe('1. every Gain Staging screen has a complete guide', () => {
  it('every GainModuleId has a guide — and no guide is for a module that does not exist', () => {
    const ids = GAIN_MODULES.map((m: { id: string }) => m.id).sort();
    assert.equal(ids.length, 8, 'eight modules');
    assert.deepEqual(Object.keys(MODS).sort(), ids);
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, 2–3 TRY THIS`, () => {
      assert.deepEqual(Object.keys(gd).filter((k) => k !== 'intro').sort(), [...SECTION_KEYS].sort());
      // the intro card (Guided Lessons return 2026-11-08): learning ≤ 30 words, start ≤ 40
      const intro = (gd as unknown as { intro?: { learning: string; start: string } }).intro;
      assert.ok(intro, 'no intro');
      assert.ok(intro.learning.trim().split(/\s+/).length <= 30, 'intro.learning over 30 words');
      assert.ok(intro.start.trim().split(/\s+/).length <= 40, 'intro.start over 40 words');
      for (const k of SECTION_KEYS) {
        assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1, `${id}.${k} is empty`);
        assert.ok(gd[k].length <= 5, `${id}.${k} has ${gd[k].length} bullets (max 5)`);
        for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
    });
  }
  it('every step fits its no-scroll budget', () => {
    const over: string[] = [];
    for (const [id, gd] of allGuides) {
      for (const s of SCREEN_GUIDE_SECTIONS as readonly { key: string; place: string }[]) {
        if (s.place === 'strip') {
          for (const item of gd.tryThis) if (item.length > SCREEN_GUIDE_BUDGET.tryItem) over.push(`${id}.tryThis (${item.length})`);
          continue;
        }
        const n = gd[s.key].join(' ').length;
        const cap = s.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
        if (n > cap) over.push(`${id}.${s.key}: ${n} > ${cap}`);
      }
    }
    assert.deepEqual(over, []);
  });
  it('house copy rules: knowledge not skills, no "N of total", no build notes, "suggest" not "recommend", no gear brands', () => {
    for (const [id, gd] of allGuides) {
      const t = textOf(gd);
      // MASTER is a stage name on this screen; the skill claim is what is barred.
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmastery\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\bmaster\b/, `${id}: lowercase "master" (the stage is MASTER / Master Output)`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend"`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d)\b/i, `${id}: a build note`);
      assert.doesNotMatch(t, /\b(Neve|SSL|API|Avid|Yamaha|Behringer|Mackie|Allen ?& ?Heath|Midas|Focusrite|Universal Audio)\b/, `${id}: a gear brand`);
    }
  });
});

describe('2. each guide quotes its screen’s real names', () => {
  const LEARN = code('src/screens/lab/gain/modules/modLearn.tsx');
  const EXPLORE = code('src/screens/lab/gain/modules/modExplore.tsx');
  const VIZ = code('src/screens/lab/gain/gainViz.tsx');
  const RACK = code('src/screens/lab/rack/RackUnit.tsx');
  const HOME = code('src/screens/lab/gain/GainLabHomeScreen.tsx') + code('src/screens/lab/gain/modules/registry.ts') + code('src/screens/lab/ModuleAccordionRow.tsx');
  const END = code('src/screens/lab/kit/LabEndScreen.tsx') + code('src/screens/lab/kit/labEnd.ts');
  const learn = LEARN + VIZ + RACK;
  const explore = EXPLORE + VIZ + RACK + LEARN;
  const NAMES: Record<string, [string, string[]]> = {
    home: [HOME, ['SOURCE', 'PREAMP', 'PROCESSING', 'FADER', 'OUTPUT', 'LEARN', 'EXPLORE', 'CHALLENGE', 'OPEN', 'SEE WHAT’S LEFT', 'RELATED', 'LEVELS & DECIBELS CALC', 'SIGNAL CHAIN BUILDER', 'SPL METER', 'What Gain Staging Is', 'Troubleshooting Challenge']],
    end: [END, ['WHAT\'S LEFT', 'LAB COMPLETE', 'REVIEW ▾', 'PRACTICE AGAIN FROM THE START', 'DONE · BACK TO LABS']],
    intro: [learn, ['SOURCE', 'PREAMP', 'OUTPUT', 'STATUS', 'FIXED', 'TOO LOW', 'HEALTHY', 'OVERLOAD', 'QUIET SOURCE', 'CLIP', 'HOT', 'FULL SCREEN', 'HIDE DISPLAY']],
    input: [learn, ['INPUT GAIN', 'PREAMP', 'HEADROOM', 'OUTPUT', 'STATUS', 'FIXED', 'LOW', 'OK', 'HOT', 'CLIP']],
    follow: [learn, ['PREAMP', 'PROC', 'OUTPUT', 'STATUS', 'FIXED', 'TOO LOW', 'HEALTHY', 'HOT', 'CLIP']],
    lowhigh: [learn, ['PREAMP', 'OUTPUT', 'NOISE', 'STATUS', 'SCENARIO', 'TOO LOW EARLY', 'TOO HIGH EARLY', 'BALANCED', 'DIST']],
    fadervsgain: [learn, ['PREAMP', 'FADER', 'OUTPUT', 'DIST', 'YES', 'STATUS', 'OVERDRIVE', 'RESET', 'CLIP']],
    multistage: [explore, ['PREAMP', 'EQ', 'COMP', 'FADER', 'BUS', 'MASTER', 'HEADROOM', 'X-RAY', 'BALANCE', '✓ OK', 'SIG', 'CLIP', 'PROCESS', 'LEVELS', 'EQ GAIN', 'COMPRESSOR OUTPUT', 'CHANNEL FADER', 'MASTER OUTPUT', 'TEST YOURSELF — RANDOM', 'RESET', 'TOO LOW']],
    freeplay: [explore, ['SOURCE', 'MASTER', 'X-RAY', 'STATUS', 'PROCESS', 'LEVELS', 'EQ GAIN', 'COMPRESSOR OUTPUT', 'CHANNEL FADER', 'MASTER OUTPUT', 'TEST YOURSELF — RANDOM', 'SIG', 'CLIP']],
    troubleshoot: [explore, ['MASTER', 'STATUS', 'INSPECT', 'FOUND', 'TRY AGAIN', 'Source', 'Preamp', 'Compressor', 'Channel Fader', 'Bus', 'Master Output', 'COMP', '?']],
  };
  it('a name list for every guide', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), allGuides.map(([id]) => id).sort());
  });
  const byId = Object.fromEntries(allGuides);
  for (const [id, [src, names]] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(byId[id]).replace(/’/g, id === 'end' ? '\'' : '’');
      for (const n of names) {
        assert.ok(src.includes(n), `${id}: "${n}" is no longer in the lab's source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('the ranges and defaults quoted match the modules', () => {
    // intro: SOURCE −40…−6 from −30, fixed +18 preamp
    assert.match(LEARN, /useState\(-30\);\s*const stages = useMemo\(\s*\(\) => \[mk\('pre', 'Preamp', 'preamp', 18, 0, 40, false\)/);
    assert.match(LEARN, /setSource\(Math\.round\(-40 \+ t \* 34\)\)/);
    // lowhigh scenarios; fadervsgain OVERDRIVE; multistage / freeplay starts
    assert.match(LEARN, /low: \{ pre: 2, out: 24 \},\s*high: \{ pre: 36, out: -16 \},\s*bal: \{ pre: 18, out: 0 \}/);
    assert.match(LEARN, /label: 'OVERDRIVE', onPress: \(\) => \{ setPre\(36\); setFader\(0\); \}/);
    assert.match(EXPLORE, /const MULTI_START: Gains = \{ pre: 8, eq: -6, comp: 0, fad: 6, bus: 6, out: 0 \};/);
    assert.match(EXPLORE, /const FREE_START: Gains = \{ pre: 20, eq: 0, comp: 0, fad: 0, bus: 0, out: 0 \};/);
    assert.match(EXPLORE, /setSource\(Math\.round\(-40 \+ t \* 38\)\)/);
    assert.match(EXPLORE, /const gains: Gains = \{ pre: 20, eq: 0, comp: 0, fad: 0, bus: 0, out: 0 \};/);
  });
});

describe('3. the TRY THIS numbers are what the engine prints', () => {
  type N = { key: string; level: number; region: string; stageClipped: boolean; distorted: boolean; noise: number };
  const mk = (key: string, kind: string, gain: number) => ({ key, name: key, kind, gain, min: -40, max: 40, adjustable: true });
  const lv = (n: N) => Math.round(n.level);
  const status = (n: N) => (n.stageClipped ? 'CLIP' : n.distorted ? 'DIST' : n.region === 'low' ? 'LOW' : n.region === 'hot' ? 'HOT' : 'OK');
  const chain = (src: number, ...st: [string, string, number][]): N[] => E.computeChain(src, st.map(([k, kind, g]) => mk(k, kind, g)));
  it('intro', () => {
    const at = (s: number) => chain(s, ['pre', 'preamp', 18], ['out', 'output', 0]);
    assert.equal(lv(at(-24)[1]), -6); assert.equal(status(at(-24)[2]), 'HOT');
    assert.equal(lv(at(-18)[1]), 0); assert.equal(status(at(-18)[2]), 'CLIP');
    assert.equal(lv(at(-40)[1]), -22); assert.equal(status(at(-40)[1]), 'OK');
  });
  it('input', () => {
    const at = (p: number) => chain(-30, ['pre', 'preamp', p], ['out', 'output', 0]);
    assert.equal(lv(at(6)[1]), -24); assert.equal(status(at(6)[1]), 'OK');
    assert.equal(lv(at(24)[1]), -6); assert.equal(status(at(24)[1]), 'HOT');
    assert.equal(lv(at(30)[1]), 0); assert.equal(status(at(30)[1]), 'CLIP');
  });
  it('follow', () => {
    const at = (p: number) => chain(-30, ['pre', 'preamp', p], ['proc', 'processor', 6], ['out', 'output', 0]);
    assert.equal(lv(at(18)[1]), -12); assert.equal(lv(at(18)[2]), -6); assert.equal(status(at(18)[2]), 'HOT');
    assert.equal(status(at(24)[1]), 'HOT'); assert.equal(status(at(24)[2]), 'CLIP'); assert.equal(status(at(24)[3]), 'CLIP');
    assert.equal(lv(at(0)[1]), -30); assert.equal(status(at(0)[1]), 'LOW'); assert.equal(lv(at(0)[3]), -24);
    // −24 dB is the bottom edge of HEALTHY, not starved: PROC and OUTPUT read OK
    assert.equal(status(at(0)[2]), 'OK'); assert.equal(status(at(0)[3]), 'OK');
  });
  it('meter drawing facts the guides state (hiss shows only on the meter scale; red starts at HOT)', () => {
    const VIZ = read('src/screens/lab/gain/gainViz.tsx');
    assert.match(VIZ, /meterFill\(node\.noise\) > 0\.005 \?/);
    assert.match(VIZ, /bottom: pct\(ZONE_HOT_FILL\), height: pct\(1 - ZONE_HOT_FILL\)/);
    assert.match(VIZ, /node\.kind === 'source' && node\.region === 'low'\) return 'QUIET SOURCE'/);
    const shows = (noise: number) => E.meterFill(noise) > 0.005;
    const inAt = (p: number) => chain(-30, ['pre', 'preamp', p], ['out', 'output', 0]);
    assert.equal(shows(inAt(0)[0].noise), false, 'SOURCE hiss never shows');
    assert.equal(shows(inAt(0)[1].noise) || shows(inAt(0)[2].noise), false, 'Input Gain First default: no hiss on screen');
    assert.equal(shows(inAt(18)[1].noise), true, 'raise INPUT GAIN and the hiss appears');
    // the gap between level and hiss widens at first, then stops at the source’s own 22 dB
    const gap = (p: number) => inAt(p)[1].level - inAt(p)[1].noise;
    assert.ok(gap(6) > gap(0) + 3 && gap(24) - gap(18) < 0.5 && gap(30) <= 22.0001);
  });
  it('lowhigh', () => {
    const at = (p: number, o: number) => chain(-30, ['pre', 'preamp', p], ['out', 'output', o]);
    const bal = at(18, 0), low = at(2, 24), high = at(36, -16);
    assert.deepEqual([lv(bal[1]), lv(bal[2]), Math.round(bal[2].noise), status(bal[2])], [-12, -12, -34, 'OK']);
    assert.deepEqual([lv(low[2]), Math.round(low[2].noise)], [-4, -22]);
    // TOO LOW EARLY, OUTPUT moved to +16 dB: same level as BALANCED, more hiss
    const lowMatched = at(2, 16);
    assert.deepEqual([lv(lowMatched[2]), Math.round(lowMatched[2].noise)], [-12, -30]);
    assert.ok(lowMatched[2].noise > -30, 'NOISE turns amber above −30');
    // the gap is lost at the starved preamp; the late gain only carries it
    const gapPre = low[1].level - low[1].noise, gapOut = low[2].level - low[2].noise;
    assert.ok(Math.abs(gapPre - gapOut) < 0.1 && gapOut < bal[2].level - bal[2].noise - 3);
    assert.deepEqual([lv(high[2]), status(high[2])], [-16, 'DIST']);
  });
  it('fadervsgain', () => {
    const at = (p: number, f: number) => chain(-30, ['pre', 'preamp', p], ['fad', 'fader', f], ['out', 'output', 0]);
    assert.deepEqual([lv(at(36, 0)[1]), at(36, 0)[3].distorted, status(at(36, 0)[3])], [0, true, 'CLIP']);
    assert.deepEqual([lv(at(36, -20)[3]), at(36, -20)[3].distorted, status(at(36, -20)[3])], [-20, true, 'DIST']);
    // OVERDRIVE: later stages at +0 dB are handed 0 dB and read CLIP themselves
    assert.ok(at(36, 0)[2].stageClipped && at(36, 0)[3].stageClipped);
    // the fix: PREAMP +18, FADER +0 — both healthy at −12 dB, no distortion
    const fixed = at(18, 0);
    assert.deepEqual([lv(fixed[1]), lv(fixed[3]), fixed[3].distorted, status(fixed[1]), status(fixed[3])], [-12, -12, false, 'OK', 'OK']);
  });
  const full = (src: number, g: Record<string, number>) =>
    chain(src, ['pre', 'preamp', g.pre], ['eq', 'eq', g.eq], ['comp', 'comp', g.comp], ['fad', 'fader', g.fad], ['bus', 'bus', g.bus], ['out', 'output', g.out]);
  it('multistage', () => {
    const start = full(-30, { pre: 8, eq: -6, comp: 0, fad: 6, bus: 6, out: 0 });
    assert.deepEqual([lv(start[2]), lv(start[3])], [-28, -28]);
    assert.ok(start[2].level <= E.LOW_EDGE && start[3].level <= E.LOW_EDGE, 'SIG dark (lit only above LOW_EDGE)');
    assert.equal(E.chainIsHealthy(start), false);
    const fixed = full(-30, { pre: 8, eq: 0, comp: 0, fad: 6, bus: 6, out: 0 });
    assert.equal(E.chainIsHealthy(fixed), true); assert.equal(lv(fixed[6]), -10);
  });
  it('freeplay', () => {
    const start = full(-30, { pre: 20, eq: 0, comp: 0, fad: 0, bus: 0, out: 0 });
    assert.ok(start.slice(1).every((n) => lv(n) === -10));
    const loud = full(-10, { pre: 20, eq: 0, comp: 0, fad: 0, bus: 0, out: 0 });
    assert.ok(loud.slice(1).every((n) => n.stageClipped));
    const ok = full(-10, { pre: 0, eq: 0, comp: 0, fad: 0, bus: 0, out: 0 });
    assert.ok(ok.slice(1).every((n) => lv(n) === -10)); assert.equal(status(ok[6]), 'OK');
  });
  it('troubleshoot: back to +0 dB (+20 dB preamp) restores −10 dB everywhere', () => {
    const base = { pre: 20, eq: 0, comp: 0, fad: 0, bus: 0, out: 0 };
    for (const k of ['eq', 'comp', 'bus']) assert.equal(status(full(-30, { ...base, [k]: 12 })[6]), 'CLIP');
    assert.equal(status(full(-30, { ...base, fad: 10 })[6]), 'CLIP');
    assert.equal(status(full(-30, { ...base, pre: 34 })[6]), 'CLIP');
    const restored = full(-30, base);
    assert.ok(restored.slice(1).every((n) => lv(n) === -10)); assert.ok(E.chainIsHealthy(restored));
    // "lower that stage until its meter sits in HEALTHY" passes — no exact value needed
    assert.ok(E.chainIsHealthy(full(-30, { ...base, eq: 3 })));
    assert.ok(!E.chainIsHealthy(full(-30, { ...base, eq: 4 })), '+4 leaves EQ HOT');
    assert.ok(E.chainIsHealthy(full(-30, { ...base, pre: 23 })));
  });
});

describe('4. wiring', () => {
  const HOME = code('src/screens/lab/gain/GainLabHomeScreen.tsx');
  const MOD = code('src/screens/lab/gain/GainModuleScreen.tsx');
  it('home: the home guide (what’s-left guide when ending) on LabHeader, inside a regions-off host', () => {
    assert.match(HOME, /import \{ GAIN_END_GUIDE, GAIN_HOME_GUIDE \} from '\.\/gainScreenGuides';/);
    assert.match(HOME, /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 10 \}\]\}>(\s*\{\})*\s*<ScreenGuideHost regions=\{false\} resetKey=\{ending \? 'end' : 'list'\}>/);
    assert.match(HOME, /<LabHeader[\s\S]*?guide=\{ending \? GAIN_END_GUIDE : GAIN_HOME_GUIDE\}/);
    assert.match(HOME, /<\/ScreenGuideHost>\s*<\/View>\s*\);\s*\}/);
  });
  it('module: the per-module guide by GainModuleId, inside a host with Rack Unit regions, reset per module', () => {
    assert.match(MOD, /import \{ GAIN_END_GUIDE, GAIN_SCREEN_GUIDES \} from '\.\/gainScreenGuides';/);
    assert.match(MOD, /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 10 \}\]\}>(\s*\{\})*\s*<ScreenGuideHost resetKey=\{ending \? 'end' : meta\.id\}>/);
    assert.match(MOD, /<LabHeader[\s\S]*?guide=\{ending \? GAIN_END_GUIDE : GAIN_SCREEN_GUIDES\[meta\.id\]\}/);
    assert.match(MOD, /<\/ScreenGuideHost>\s*<\/View>\s*<\/LabNavProvider>/);
    // every module is a Rack Unit module, so the default (measured) regions apply
    for (const m of GAIN_MODULES as { id: string }[]) assert.match(MOD, new RegExp(`'${m.id}',`), `${m.id} is a RACK_MODULE`);
  });
});

describe('5. accuracy chip decision: KEPT beside the ⓘ (gain/level readouts — an owner-named example)', () => {
  it('both headers keep the compact AccuracyNote in `right`; the ⓘ key is added beside it', () => {
    for (const p of ['src/screens/lab/gain/GainLabHomeScreen.tsx', 'src/screens/lab/gain/GainModuleScreen.tsx']) {
      const s = code(p);
      assert.match(s, /import \{ AccuracyNote \} from '\.\.\/\.\.\/\.\.\/components\/AccuracyNote';/, `${p}: chip imported`);
      // up to the header's OWN closing line (the chip's "/>" sits inside it)
      const header = s.match(/<LabHeader[\s\S]*?\n\s*\/>/)![0];
      assert.match(header, /right=\{<AccuracyNote compact \/>\}/, `${p}: the compact chip in the header's right group`);
      assert.match(header, /guide=\{/, `${p}: guide on the header`);
    }
    // LabHeader draws `right` FIRST and the key LAST, so chip and ⓘ sit side by side.
    const nav = code('src/screens/lab/kit/LabNavBar.tsx');
    assert.match(nav, /<View style=\{styles\.headerRight\}>\s*\{right\}\s*\{key\}\s*<\/View>/);
  });
  it('the readouts are still badged as a simulation, and the guide never retells the chip', () => {
    const src = code('src/screens/lab/gain/modules/modLearn.tsx') + code('src/screens/lab/gain/modules/modExplore.tsx');
    assert.match(src, /const BADGE = 'SIMULATED SIGNAL CHAIN · RELATIVE dB';/);
    for (const [id, gd] of allGuides) assert.doesNotMatch(textOf(gd), /MEASURE WITH THE RIGHT TOOL|LEARN HERE/, `${id}: still describes the chip`);
  });
});
