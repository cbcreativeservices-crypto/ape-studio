/**
 * Screen Guide rollout — Drum Tuning Lab (owner 2026-10-31) — receipts. The
 * Wave Physics pilot's pattern (test/screenGuide_20261031.test.ts):
 *
 *   1. one guide per chapter STEP (each step is its own screen), in the
 *      chapter's step order, plus the what's-left screen — all five sections,
 *      1–5 bullets, 2–3 TRY THIS, house copy rules;
 *   2. every step fits its no-scroll budget (SCREEN_GUIDE_BUDGET);
 *   3. each guide quotes its step's REAL names — pinned in guide and source;
 *   4. the TRY THIS numbers are what the step prints at its defaults,
 *      re-derived from drumEngine.ts (render-measured SUSTAIN re-rendered);
 *   5. wiring: LabHeader takes the step's guide (the end guide on FINISH),
 *      ScreenGuideHost wraps the content, keyed by chapter and step;
 *   6. CHIP DECISION: a modelled-drum concept lab drops the header
 *      AccuracyNote; the stage badges keep saying MODEL / SYNTHESIZED.
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

const { DRUM_SCREEN_GUIDES, DRUM_END_GUIDE, drumScreenGuide } = await import('../src/screens/lab/drumtuning/drumScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const E = await import('../src/screens/lab/drumtuning/drumEngine.ts');
const C = await import('../src/screens/lab/drumtuning/drumContent.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = DRUM_SCREEN_GUIDES as unknown as Record<string, Guide[]>;
const allGuides: [string, Guide][] = [...Object.entries(GUIDES).flatMap(([ch, list]) => list.map((g, i) => [`${ch}.${i}`, g] as [string, Guide])), ['end', DRUM_END_GUIDE as unknown as Guide]];
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');
const DIR = 'src/screens/lab/drumtuning';
const FILES: Record<string, string> = { sound: 'ch1Sound', prepare: 'ch2Prepare', method: 'ch3Method', whole: 'ch4Whole', types: 'ch5Types', kit: 'ch6Kit', trouble: 'ch7Trouble' };
const g = (ch: string, i: number) => GUIDES[ch][i];
const tt = (ch: string, i: number) => g(ch, i).tryThis.join('\n');

/** The step order the guides are written against (key per step). */
const STEP_KEYS: Record<string, string[]> = {
  sound: ['system', 'tension', 'edge', 'qualities', 'rod', 'practice', 'review'],
  prepare: ['identify', 'inspect', 'seat', 'known', 'checklist', 'review'],
  method: ['steps', 'hear', 'tune', 'review'],
  whole: ['relationships', 'compare', 'depends', 'practice', 'review'],
  types: ['snare', 'toms', 'kick', 'goal', 'practice', 'review'],
  kit: ['range', 'toms', 'notes', 'review'],
  trouble: ['symptoms', 'diagnose', 'practice', 'review'],
};

describe('1. every Drum Tuning screen has a complete guide', () => {
  it('a guide list for every chapter, one guide per step, in the chapter file’s step order', () => {
    const counts = code(`${DIR}/modules/index.ts`);
    assert.deepEqual(Object.keys(GUIDES).sort(), C.DRUM_CHAPTERS.map((c: { id: string }) => c.id).sort());
    for (const [ch, file] of Object.entries(FILES)) {
      const keys = [...code(`${DIR}/modules/${file}.tsx`).matchAll(/key: '(\w+)', title: '[^']+', kind: '(?:LEARN|HEAR|ADJUST|PRACTICE|REVIEW)', layout: '(?:rack|read)'/g)].map((m) => m[1]);
      assert.deepEqual(keys, STEP_KEYS[ch], `${ch}: the chapter's steps changed — update its guides`);
      assert.equal(GUIDES[ch].length, keys.length, `${ch}: one guide per step`);
      assert.match(counts, new RegExp(`\\b${ch}: ${keys.length}\\b`), `${ch}: DRUM_STEP_COUNTS`);
    }
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, 2–3 TRY THIS`, () => {
      assert.deepEqual(Object.keys(gd).filter((k) => k !== 'intro').sort(), [...SECTION_KEYS].sort());
      for (const k of SECTION_KEYS) {
        assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1 && gd[k].length <= 5, `${id}.${k}: 1–5 bullets`);
        for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
    });
  }
  it('house copy rules: knowledge not skills, no "N of total", no build notes, "suggest" not "recommend", no makers', () => {
    for (const [id, gd] of allGuides) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend"`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|toddler pass|hunt \d)\b/i, `${id}: a build note`);
      assert.doesNotMatch(t, /Yamaha|Remo\b|\bDW\b|Evans|Pearl|Tama|Gretsch|Ludwig|Zildjian|Tune-?Bot|DrumDial/, `${id}: a maker's name`);
    }
  });
  it('lab rules: no relationship is called correct; tuning to a note stays optional; the drum is a model', () => {
    const t = allGuides.map(([, gd]) => textOf(gd)).join('\n');
    assert.doesNotMatch(t, /the correct (tuning|relationship)\b/i);
    assert.match(textOf(g('sound', 1)), /Tuning to an exact note is optional/);
    assert.match(textOf(g('sound', 0)), /The method carries over to a real drum, where your ears have the final say/);
  });
});

describe('2. every step fits its no-scroll budget', () => {
  it('seeing / changes / teaches ≤ low, control ≤ high, each TRY THIS item ≤ tryItem', () => {
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
});

describe('3. each guide quotes its step’s real names', () => {
  const SHARED = [`${DIR}/kit.tsx`, 'src/screens/lab/mastering/kit.tsx', `${DIR}/drumContent.ts`, `${DIR}/drumEngine.ts`, `${DIR}/stagesDrum.tsx`, `${DIR}/modules/shared.tsx`, `${DIR}/DrumTuningLabScreen.tsx`, 'src/screens/lab/kit/labNav.ts', 'src/screens/lab/kit/ExpandableFigure.tsx'].map(code).join('\n');
  const REVIEW = ['YOUR RUN', 'SAY IT BEFORE YOU READ IT', 'KEY IDEAS', 'KEY TERMS', 'TRY NEXT', 'TAKEAWAY'];
  const DECK = ['‹ PREV CARD', 'NEXT CARD ›'];
  const NAMES: Record<string, string[][]> = {
    sound: [
      ['PART', 'HEADS', 'EDGES', 'LUGS', 'AIR', 'EDGE', '‹ PREV', 'NEXT ›'],
      ['TENSION', 'PITCH', 'NOTE', '1ST OVERTONE', '▶ STRIKE', 'N/m'],
      ['EDGE', 'CONTACT', '45° SHARP', '45° DOUBLE', 'ROUNDED', 'VINTAGE', 'LEAST', 'SMALL', 'MORE', 'MOST'],
      ['PITCH', 'SUSTAIN', 'BEND', 'OVERTONES', 'STRIKE', 'DAMPING', '▶ STRIKE'],
      ['ROD', 'TURN', 'LUG PITCH', 'SPREAD', 'BEAT', 'VIEW', 'DRUM', 'WAVE', 'PITCH', 'VIB', '▶ TAP', '▶ STRIKE'],
      DECK,
      REVIEW,
    ],
    prepare: [
      ['DRUM', 'SIZE', 'LUGS', 'RESPONDS'],
      ['HARDWARE', 'BEFORE TUNING, LOOK — TAP A PART', 'RODS', 'LUGS', 'HOOPS', 'HEAD', 'EDGE'],
      ['LUGS', 'STEP', 'THIS ROD', 'NEXT', '▶ RUN', '■ PAUSE', 'CAUTION'],
      ['APPROACH', 'STEP', 'SPREAD', 'PITCH', 'EVEN STEPS', 'RANDOM', '▶ STRIKE'],
      ['LOOKING AT', 'WALKED', 'FLAGGED', 'KEY', 'INSPECT', 'HEAD', 'EDGE', 'MAP', '✓ REVEAL KEY', '↺ NEW DRUM'],
      REVIEW,
    ],
    method: [
      ['STEP', 'DO', 'HEAD', 'SEAT', 'FINGER', 'STAR', 'TAP', 'ADJUST', 'PLAY', 'OTHER', 'BATTER', 'RESONANT', 'CAUTION'],
      ['LUG', 'TAPPED', 'LUG PITCH', 'SPREAD', '▶ TAP', '◉ REVEAL MAP'],
      ['LUG', 'THIS RUN', 'SPREAD', 'HEAD', 'TURN', 'BATTER', 'RESO', '▶ TAP', '▶ STRIKE', '▶ SHOW ME A MOVE', '↺ NEW HEADS'],
      REVIEW,
    ],
    whole: [
      ['THE AIR', 'TWO HEADS, ONE INSTRUMENT', 'None of these is the correct one', 'Resonant higher than batter', 'Both heads equal', 'Batter higher than resonant'],
      ['BATTER', 'RESO', 'REL', 'SUSTAIN', 'LATE SOUND', 'SET', 'RESO ↑', 'EQUAL', 'BATTER ↑', 'VIEW', 'WAVE', 'PITCH', 'VIBRATE', '▶ STRIKE', 'WHICH ONE RANG LONGEST?'],
      ['IT DEPENDS — AND HERE IS ON WHAT', 'Size', 'Construction', 'Head choice', 'Playing style'],
      DECK,
      REVIEW,
    ],
    types: [
      ['BATTER', 'SNARE SIDE', 'STRAINER', 'SUSTAIN', 'BOTTOM', 'STROKE', 'OFF', '▶ STRIKE'],
      ['TOMS'],
      ['FRONT', 'PILLOW', 'BATTER', 'SUSTAIN', 'CLOSED', 'PORTED', 'NO FRONT', 'BEATER', '▶ STRIKE'],
      ['GOAL', 'PITCH', 'SUSTAIN', 'BEND', 'MET', 'BATTER', 'RESO', 'DAMPING', 'SHORT', 'OPEN', 'LOW', '▶ STRIKE', '✓ CHECK'],
      DECK,
      REVIEW,
    ],
    kit: [
      ['TUNING AS A SET'],
      ['RACK', 'FLOOR', 'INTERVAL', 'VERDICT', '▶ RACK', '▶ FLOOR', '▶ BOTH', 'DISTINCT', 'CLOSE', 'UNBALANCED'],
      ['TUNING NOTES', 'NAME', 'NOTE', 'SAVE THIS SETUP', 'LOAD', 'DELETE'],
      REVIEW,
    ],
    trouble: [
      ['SYMPTOM → WHERE TO LOOK', 'BY EAR, BY REFERENCE, BY DEVICE'],
      ['VIEW', 'SPREAD', 'BEAT', 'SUSTAIN', 'FAULT', 'STILL', 'GONE', 'CASE', 'LUG', '▶ STRIKE', '▶ SOFTLY', '▶ TAP', 'HIT 1ST', 'WHERE?', 'FIX', '↺ RESET CASE', 'LISTEN', 'WHERE IS IT?', 'DRUM', 'WAVE', 'PARTS'],
      DECK,
      REVIEW,
    ],
  };
  for (const [ch, list] of Object.entries(NAMES)) {
    it(`${ch}: a name list per step, and every pinned name is on the screen AND in the guide`, () => {
      assert.equal(list.length, GUIDES[ch].length);
      const src = code(`${DIR}/modules/${FILES[ch]}.tsx`) + '\n' + SHARED;
      list.forEach((names, i) => {
        const gt = textOf(g(ch, i)).toLowerCase();
        for (const n of names) {
          assert.ok(src.includes(n), `${ch}.${i}: "${n}" is no longer in the step source — update the guide`);
          assert.ok(gt.includes(n.toLowerCase()), `${ch}.${i}: the guide never names "${n}"`);
        }
      });
    });
  }
  it('names built in code (drum kinds, case ids) are what the guides quote', () => {
    assert.deepEqual(E.DRUM_LIST.map((d: { kind: string }) => d.kind.toUpperCase()), ['SNARE', 'RACK', 'FLOOR', 'KICK']);
    assert.match(code(`${DIR}/modules/ch2Prepare.tsx`), /short: \(d\) => d\.kind\.toUpperCase\(\)/);
    assert.ok(textOf(g('prepare', 0)).includes('SNARE, RACK, FLOOR and KICK'));
    assert.ok(textOf(g('types', 3)).includes('SNARE / RACK / FLOOR / KICK'));
    assert.deepEqual(E.SYMPTOMS.map((s: { id: string }) => s.id.toUpperCase()), ['WARBLE', 'CHOKED', 'RING', 'SNARE', 'DRIFT']);
    assert.match(code(`${DIR}/modules/ch7Trouble.tsx`), /short: s\.id\.toUpperCase\(\)/);
    assert.ok(textOf(g('trouble', 1)).includes('WARBLE, CHOKED, RING, SNARE or DRIFT'));
    assert.match(code(`${DIR}/modules/ch7Trouble.tsx`), /label: !struck \? 'HIT 1ST' : `\$\{tapsLeft\} TO TAP`/);
    assert.match(code(`${DIR}/modules/ch2Prepare.tsx`), /short: `ROD \$\{i \+ 1\}`/);
    assert.ok(textOf(g('prepare', 4)).includes('ROD 1 to ROD 10'));
  });
  it('the end screen’s names are the shared end screen’s', () => {
    const src = [code('src/screens/lab/kit/LabEndScreen.tsx'), code('src/screens/lab/kit/labEnd.ts'), code('src/screens/lab/kit/labNav.ts'), code(`${DIR}/DrumTuningLabScreen.tsx`)].join('\n');
    const gt = textOf(DRUM_END_GUIDE as unknown as Guide);
    for (const n of ['LAB COMPLETE', 'REVIEW ▾', 'PRACTICE AGAIN FROM THE START', 'DONE · BACK TO LABS', 'START OVER (PRACTICE)', '‹ PREV']) {
      assert.ok(src.includes(n), `"${n}" is no longer in the end-screen source`);
      assert.ok(gt.includes(n), `the end guide never names "${n}"`);
    }
  });
});

describe('4. TRY THIS numbers are what the steps print at their defaults', () => {
  const D = E.DRUMS;
  const fmtHz = (hz: number) => (hz >= 1000 ? `${(hz / 1000).toFixed(2)} k` : hz.toFixed(hz < 100 ? 1 : 0));
  const fmtCents = (c: number) => `${c >= 0 ? '+' : ''}${c.toFixed(0)} ¢`;
  const headAt = (d: string, hz: number, w: 'batter' | 'reso') => ({ tension: E.tensionForHz(D[d].diameterIn, hz, w === 'batter' ? D[d].sigmaBatter : D[d].sigmaReso), turns: new Array(D[d].lugs).fill(0) });
  // The lab's own formatters are the ones re-implemented above.
  it('the formatters match kit.tsx / modules/shared.tsx', () => {
    assert.match(code(`${DIR}/kit.tsx`), /export const fmtHz = \(hz: number \| null \| undefined\): string => \(hz == null \|\| !Number\.isFinite\(hz\) \? '—' : hz >= 1000 \? `\$\{\(hz \/ 1000\)\.toFixed\(2\)\} k` : hz\.toFixed\(hz < 100 \? 1 : 0\)\);/);
    assert.match(code(`${DIR}/modules/shared.tsx`), /export const fmtCents = \(c: number \| null \| undefined\): string => \(c == null \|\| !Number\.isFinite\(c\) \? '—' : `\$\{c >= 0 \? '\+' : ''\}\$\{c\.toFixed\(0\)\} ¢`\);/);
  });
  it('sound.1 tension: 3000 → 233 / 371 Hz; 1200 → 147 Hz; 4800 → 294 Hz', () => {
    const f = (t: number) => E.fundamentalHz(12, t, D.rack.sigmaBatter);
    assert.equal(fmtHz(f(3000)), '233');
    assert.equal(fmtHz(f(3000) * 1.594), '371');
    assert.deepEqual(D.rack.tensionRange, [1200, 5500]);
    assert.equal(fmtHz(f(1200)), '147');
    assert.equal(fmtHz(f(4800)), '294');
    assert.match(code(`${DIR}/modules/ch1Sound.tsx`), /const \[tension, setTension\] = useState\(3000\);/);
    assert.match(code(`${DIR}/modules/ch1Sound.tsx`), /\{ k: '1ST OVERTONE', v: `\$\{fmtHz\(f0 \* 1\.594\)\} Hz`/);
    for (const s of ['PITCH reads 233 Hz and 1ST OVERTONE 371 Hz', 'PITCH 147 Hz', '4800 N/m', 'PITCH reads 294 Hz']) assert.ok(tt('sound', 1).includes(s), s);
  });
  it('sound.3 qualities: BEND +35 / +2 / +54 ¢; SUSTAIN about 1.72 s → 0.27 s at DAMPING 100 %', () => {
    assert.equal(fmtCents(E.bendCents(0.8, 3000)), '+35 ¢');
    assert.equal(fmtCents(E.bendCents(0.2, 3000)), '+2 ¢');
    assert.equal(fmtCents(E.bendCents(1, 3000)), '+54 ¢');
    const p = (damping: number) => ({ drum: 'rack', batter: E.evenHead(3000, 6), reso: E.evenHead(2600, 6), resoPresent: true, damping, strike: 0.8, strikeR: 0.3, strikeTheta: 0 });
    assert.equal(E.sustainT60(E.renderStrike(p(0)).mono).toFixed(2), '1.72');
    assert.equal(E.sustainT60(E.renderStrike(p(1)).mono).toFixed(2), '0.27');
    assert.match(code(`${DIR}/modules/ch1Sound.tsx`), /const RESO_T = 2600;/);
    for (const s of ['BEND reads +35 ¢', '20 %: +2 ¢', '100 %: +54 ¢', 'about 1.72 s', 'about 0.27 s']) assert.ok(tt('sound', 3).includes(s), s);
  });
  it('sound.4 turn one rod: +⅛ → 21 ¢ / 1.5 Hz; +¼ → 42 ¢ / 3.1 Hz; even → 0 ¢ / none', () => {
    const h = (t: number) => ({ tension: 3000, turns: [t, 0, 0, 0, 0, 0] });
    const read = (t: number) => [`${E.spreadCents(h(t)).toFixed(0)} ¢`, `${E.beatRateHz(h(t), 12, D.rack.sigmaBatter).toFixed(1)} Hz`];
    assert.deepEqual(read(0.125), ['21 ¢', '1.5 Hz']);
    assert.deepEqual(read(0.25), ['42 ¢', '3.1 Hz']);
    assert.equal(E.spreadCents(h(0)).toFixed(0), '0');
    assert.ok(E.beatRateHz(h(0), 12, D.rack.sigmaBatter) < 0.05);
    assert.match(code(`${DIR}/modules/ch1Sound.tsx`), /faderParam\(\{ id: 'turn', label: 'TURN', value: head\.turns\[lug\], min: -1, max: 1, step: 0\.125/);
    for (const s of ['SPREAD reads 21 ¢, BEAT 1.5 Hz', '42 ¢ and 3.1 Hz', 'SPREAD 0 ¢, BEAT none']) assert.ok(tt('sound', 4).includes(s), s);
  });
  it('prepare.0 RESPONDS 130–260 Hz on the 12" × 8" rack tom, 6 lugs', () => {
    assert.equal(`${fmtHz(D.rack.usefulHz[0])}–${fmtHz(D.rack.usefulHz[1])} Hz`, '130–260 Hz');
    assert.equal(`${D.rack.diameterIn}" × ${D.rack.depthIn}"`, '12" × 8"');
    assert.equal(D.rack.lugs, 6);
    assert.ok(tt('prepare', 0).includes('RACK reads 12" × 8", 6 lugs, RESPONDS 130–260 Hz'));
    assert.equal(fmtHz(D.kick.usefulHz[0]), '45.0');
    assert.ok(D.kick.usefulHz[0] < Math.min(D.snare.usefulHz[0], D.rack.usefulHz[0], D.floor.usefulHz[0]), 'KICK’s band starts lowest');
    assert.ok(tt('prepare', 0).includes(`KICK’s band sits lowest: RESPONDS ${fmtHz(D.kick.usefulHz[0])}–${fmtHz(D.kick.usefulHz[1])} Hz`));
  });
  it('prepare.2 the star orders the guide quotes (8 and 6 lugs)', () => {
    assert.deepEqual(E.STAR_ORDER[8].map((i: number) => i + 1), [1, 5, 3, 7, 2, 6, 4, 8]);
    assert.deepEqual(E.STAR_ORDER[6].map((i: number) => i + 1), [1, 4, 2, 5, 3, 6]);
    assert.match(code(`${DIR}/modules/ch2Prepare.tsx`), /const \[lugs, setLugs\] = useState<LugCount>\(8\);/);
    for (const s of ['THIS ROD reads #1, NEXT #5 — then 3, 7, 2, 6, 4, 8', '1 → 4 → 2 → 5 → 3 → 6']) assert.ok(tt('prepare', 2).includes(s), s);
  });
  it('prepare.3 known condition: EVEN step 8 → 0 ¢ / 156 Hz; RANDOM step 8 → 880 ¢ / 137 Hz', () => {
    // The chapter's knownSequence, re-run (KNOWN_T 1200, floor tom, 8 lugs).
    const even = { tension: 1200 + E.TURN_NPM * 0.25 * 8, turns: new Array(8).fill(0) };
    let s = 0x9e37 + 8;
    const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 0x100000000);
    const turns = new Array(8).fill(0);
    for (let k = 0; k < 8; k++) {
      const i = Math.floor(rnd() * 8);
      turns[i] += 0.5 + rnd() * 1.0;
    }
    const random = { tension: 1200, turns };
    const hz = (h: { tension: number; turns: number[] }) => fmtHz(E.fundamentalHz(16, E.meanTension(h), D.floor.sigmaBatter));
    assert.equal(E.spreadCents(even).toFixed(0), '0');
    assert.equal(hz(even), '156');
    assert.equal(E.spreadCents(random).toFixed(0), '880');
    assert.equal(hz(random), '137');
    const src = code(`${DIR}/modules/ch2Prepare.tsx`);
    assert.match(src, /const KNOWN_T = 1200;/);
    assert.match(src, /let s = 0x9e37 \+ lugs;/);
    assert.match(src, /turns\[i\] \+= 0\.5 \+ rnd\(\) \* 1\.0;/);
    for (const x of ['SPREAD 0 ¢, PITCH 156 Hz', 'SPREAD 880 ¢, PITCH 137 Hz']) assert.ok(tt('prepare', 3).includes(x), x);
  });
  it('method.1 tap round the head: the map shows the highest lug (number not given, owner 2026-11-09), SPREAD 195 ¢; lug 6 is its opposite', () => {
    const h = E.randomUnevenHead(2400, 8, 0x51ab, 0.5);
    const c = E.lugCents(h);
    assert.equal(c.indexOf(Math.max(...c)) + 1, 2);
    assert.equal(E.spreadCents(h).toFixed(0), '195');
    assert.match(code(`${DIR}/modules/ch3Method.tsx`), /useState<HeadState>\(\(\) => randomUnevenHead\(2400, SPEC\.lugs, 0x51ab, 0\.5\)\)/);
    for (const x of ['The map shows which lug was highest, and SPREAD 195 ¢', 'lug 6']) assert.ok(tt('method', 1).includes(x), x);
  });
  it('whole.1 SET: RESO ↑ → 226 Hz (+3.0 st); BATTER ↑ → 160 Hz', () => {
    const up = Math.round(190 * Math.pow(2, 3 / 12));
    const down = Math.round(190 * Math.pow(2, -3 / 12));
    assert.equal(up, 226);
    assert.equal(down, 160);
    assert.equal(`+${(12 * Math.log2(up / 190)).toFixed(1)} st`, '+3.0 st');
    assert.match(code(`${DIR}/modules/ch4Whole.tsx`), /setResoHz\(Math\.round\(batterHz \* Math\.pow\(2, st \/ 12\)\)\);/);
    for (const x of ['RESO reads 226 Hz and REL +3.0 st', 'RESO 160 Hz']) assert.ok(tt('whole', 1).includes(x), x);
  });
  it('types.0 SNARE SIDE 290 Hz at +400 ¢, 345 Hz at +700 ¢', () => {
    assert.equal(fmtHz(230 * Math.pow(2, 400 / 1200)), '290');
    assert.equal(fmtHz(230 * Math.pow(2, 700 / 1200)), '345');
    assert.match(code(`${DIR}/modules/ch5Types.tsx`), /const \[snSide, setSnSide\] = useState\(400\);/);
    for (const x of ['SNARE SIDE reads 290 Hz (BOTTOM +400 ¢)', '+700 ¢: 345 Hz']) assert.ok(tt('types', 0).includes(x), x);
  });
  it('types.3 BEND goal on the rack tom: PITCH 260 Hz, BEND +32 ¢, under the 35-cent line', () => {
    const top = D.rack.usefulHz[1];
    assert.equal(top, 260);
    const bend = E.bendCents(0.85, headAt('rack', top, 'batter').tension);
    assert.equal(fmtCents(bend), '+32 ¢');
    assert.ok(bend < 35);
    assert.match(code(`${DIR}/drumEngine.ts`), /const ok = m\.bendCents >= 35 && m\.t60 >= 0\.5;/);
    assert.match(code(`${DIR}/modules/ch5Types.tsx`), /default: return \{ batter: top, reso: top, damp: 0\.3 \};/);
    assert.ok(tt('types', 3).includes('PITCH 260 Hz, BEND +32 ¢'));
  });
  it('kit.1 tom range: start −2.3 st UNBALANCED; 165/110 → 7.0 DISTINCT; 200/110 → 10.3 UNBALANCED; 140/130 → 1.3 CLOSE', () => {
    const v = (r: number, f: number) => [E.tomInterval(r, f).kind, E.tomInterval(r, f).semitones.toFixed(1)];
    assert.deepEqual(v(140, 160), ['unbalanced', '-2.3']);
    assert.deepEqual(v(165, 110), ['distinct', '7.0']);
    assert.deepEqual(v(200, 110), ['unbalanced', '10.3']);
    assert.deepEqual(v(140, 130), ['close', '1.3']);
    const src = code(`${DIR}/modules/ch6Kit.tsx`);
    assert.match(src, /const \[rackHz, setRackHz\] = useState\(140\);/);
    assert.match(src, /const \[floorHz, setFloorHz\] = useState\(160\);/);
    for (const x of ['−2.3 st, UNBALANCED', '7.0 st, DISTINCT', '10.3 st, UNBALANCED', '1.3 st, CLOSE']) assert.ok(tt('kit', 1).includes(x), x);
  });
  it('trouble.1 warble case: SPREAD 226 ¢, BEAT 8.4 Hz; three taps needed', () => {
    const mid = (D.rack.usefulHz[0] + D.rack.usefulHz[1]) / 2;
    const h = E.randomUnevenHead(headAt('rack', mid, 'batter').tension, 6, 0x77a1, 0.5);
    assert.equal(E.spreadCents(h).toFixed(0), '226');
    assert.equal(E.beatRateHz(h, 12, D.rack.sigmaBatter).toFixed(1), '8.4');
    assert.equal(E.symptomById('warble').tapsNeeded, 3);
    assert.match(code(`${DIR}/modules/ch7Trouble.tsx`), /randomUnevenHead\(even\(mid, 'batter'\)\.tension, spec\.lugs, 0x77a1, 0\.5\)/);
    assert.ok(tt('trouble', 1).includes('SPREAD 226 ¢, BEAT 8.4 Hz. Tap three lugs'));
  });
});

describe('5. wiring: LabHeader takes the step guide, ScreenGuideHost wraps the content', () => {
  const SCR = code(`${DIR}/DrumTuningLabScreen.tsx`);
  it('the step guide by chapter and step, the end guide on FINISH, the step title on the card', () => {
    assert.match(SCR, /import \{ ScreenGuideHost \} from '\.\.\/\.\.\/\.\.\/features\/lab\/screenGuide';/);
    assert.match(SCR, /import \{ DRUM_END_GUIDE, drumScreenGuide \} from '\.\/drumScreenGuides';/);
    assert.match(SCR, /<LabHeader[\s\S]*?guide=\{endState \? DRUM_END_GUIDE : drumScreenGuide\(mod\.id, stepIdx\)\}[\s\S]*?guideTitle=\{endState \? 'WHAT’S LEFT' : \(stepTitles\[stepIdx\] \?\? mod\.title\)\.toUpperCase\(\)\}/);
  });
  it('the host wraps the root’s content; a step change closes the guide; no regions under the end screen', () => {
    assert.match(SCR, /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 10 \}\]\}>(\s*\{\})*\s*<ScreenGuideHost resetKey=\{endState \? 'end' : `\$\{mod\.id\}:\$\{stepIdx\}`\} regions=\{!endState\}>\s*<LabHeader/);
    assert.match(SCR, /<\/StepHostContext\.Provider>\s*<\/View>\s*<\/ScreenGuideHost>\s*<\/View>\s*<\/LabNavProvider>/);
  });
  it('drumScreenGuide returns the step’s guide, and nothing past the last step', () => {
    assert.equal(drumScreenGuide('kit', 1), DRUM_SCREEN_GUIDES.kit[1]);
    assert.equal(drumScreenGuide('kit', 4), undefined);
  });
});

describe('6. chip decision: modelled-drum concept lab — no header AccuracyNote', () => {
  it('the header has no chip; the stage badges still say MODEL and SYNTHESIZED', () => {
    const SCR = code(`${DIR}/DrumTuningLabScreen.tsx`);
    assert.doesNotMatch(SCR, /AccuracyNote/);
    assert.doesNotMatch(SCR, /ACCURACY_DETAIL/);
    const shared = code(`${DIR}/modules/shared.tsx`);
    assert.match(shared, /export const MODEL_BADGE = 'MODEL · illustration, not a measurement';/);
    assert.match(shared, /export const RENDER_BADGE = 'SYNTHESIZED · additive membrane model computed before playback/);
  });
});

describe('review fixes 2026-10-31 (each vetted against the code)', () => {
  it('Tension and pitch: N/m is explained; the lane runs left–right', () => {
    assert.match(code(`${DIR}/modules/ch1Sound.tsx`), /\$\{v\.toFixed\(0\)\} N\/m`/);
    assert.ok(g('sound', 1).control.join(' ').includes('N/m (newtons per meter — how hard the head is pulled)'));
    assert.ok(tt('sound', 1).includes('Ride TENSION all the way left: PITCH 147 Hz'));
    for (const [id, gd] of allGuides) assert.doesNotMatch(gd.tryThis.join(' '), /TENSION to the bottom/, id);
  });
  it('Compare head relationships: the guide does not answer WHICH ONE RANG LONGEST? before the learner listens', () => {
    const ch = g('whole', 1).changes.join(' ');
    assert.doesNotMatch(ch, /the longest note/);
    assert.ok(ch.includes('Strike all three and judge which rings longest'));
  });
});
