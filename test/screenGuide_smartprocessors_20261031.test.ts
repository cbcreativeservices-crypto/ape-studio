/**
 * Screen Guide rollout — Smart Processors Lab (2026-10-31) — receipts.
 * Patterns: test/screenGuide_20261031.test.ts (a hand-built home) and the
 * PagedLab rollouts (pageGuide).
 *
 *   1. every screen the learner reaches has a guide: the family hub
 *      (SmartProcessorsLabScreen), each of the nine De-Esser pages, in
 *      PAGES order, and the De-Esser's what's-left screen (DEESSER_END_GUIDE,
 *      2026-10-31; the lab's check lives on the hub) — five sections, copy
 *      rules, 2–3 TRY THIS;
 *   2. every step fits its no-scroll budget;
 *   3. the guide quotes the screens' REAL names;
 *   4. every TRY THIS number is what deEsserModel makes the page print at
 *      that setting — recomputed here from the model;
 *   5. wiring: the hub draws the ⓘ (inside the hint anchor, under a
 *      ScreenGuideHost) in place of the accuracy chip; the De-Esser PagedLab
 *      gets `pageGuide`, `endGuide` and `accuracy={false}` — a CONCEPT lab;
 *   6. the end guide's facts, against the code: the title states, "progress"
 *      mode (✓ DONE, not CREDITED), every button's label, what makes a page
 *      count, and where DONE goes (one screen back, to the hub).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const G = await import('../src/screens/lab/deesser/smartProcessorsScreenGuides.ts');
const M = await import('../src/features/deesser/deEsserModel.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const PAGES = G.DEESSER_SCREEN_GUIDES as unknown as Record<string, Guide>;
const HOME = G.SMART_PROCESSORS_HOME_GUIDE as unknown as Guide;
const END = G.DEESSER_END_GUIDE as unknown as Guide;
const allGuides: [string, Guide][] = [['home', HOME], ...Object.entries(PAGES), ['end', END]];
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

const HUB_FILE = 'src/screens/lab/deesser/SmartProcessorsLabScreen.tsx';
const LAB_FILE = 'src/screens/lab/deesser/DeEsserLabScreen.tsx';
const HUB = code(HUB_FILE);
const LAB = code(LAB_FILE);
const MODEL = code('src/features/deesser/deEsserModel.ts');
const SHELL = code('src/screens/lab/kit/PagedLab.tsx');
const END_SCREEN = code('src/screens/lab/kit/LabEndScreen.tsx');
const LAB_END = code('src/screens/lab/kit/labEnd.ts');
const SRC = [HUB, LAB, MODEL, SHELL, END_SCREEN, LAB_END, code('src/screens/lab/deesser/deEsserViz.tsx'), code('src/screens/lab/deesser/pathLayout.ts'), code('src/screens/lab/kit/ExpandableFigure.tsx'), code('src/screens/lab/kit/LabNavBar.tsx'), code('src/screens/lab/kit/labNav.ts'), code('src/screens/lab/tuning/components/check.tsx'), code('src/components/LabUnderstandingCheck.tsx')].join('\n');

/** Page body source, by PageDef component name. */
const pageSrc = (fn: string) => {
  const at = LAB.indexOf(`function ${fn}(`);
  const next = LAB.indexOf('\nfunction ', at + 10);
  return LAB.slice(at, next < 0 ? undefined : next);
};

describe('1. every Smart Processors screen has a complete guide', () => {
  it('a guide per De-Esser page, in PAGES order, titles verbatim', () => {
    const titles = [...LAB.matchAll(/\{ title: '([^']+)', short: '[^']+', Component: Page\w+ \}/g)].map((m) => m[1]);
    assert.deepEqual(titles, G.DEESSER_PAGES.map((p: { title: string }) => p.title));
    assert.deepEqual(Object.keys(PAGES), G.DEESSER_PAGES.map((p: { id: string }) => p.id));
    G.DEESSER_PAGES.forEach((p: { id: string }, i: number) => assert.equal(G.deEsserPageGuide(i), PAGES[p.id]));
    assert.equal(G.deEsserPageGuide(G.DEESSER_PAGES.length), undefined, 'no page guide past the end — the what’s-left screen has its own (endGuide)');
  });
  it('the de-esser has no appended check page; its check lives on the hub (five questions)', () => {
    const checks = code('src/features/lab/understandingChecks.ts');
    assert.doesNotMatch(checks, /^\s*deesser:/m);
    assert.match(checks, /^\s*'smart-processors': DEESSER,/m);
    const block = checks.slice(checks.indexOf('const DEESSER'), checks.indexOf('const DELAY'));
    assert.equal((block.match(/^\s{4}id: '/gm) ?? []).length, 5);
    assert.match(HUB, /<LabUnderstandingBlock labId="smart-processors" labTitle="Smart Processors Lab" \/>/);
    assert.match(HOME.seeing.join(' '), /five questions/);
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, none empty; TRY THIS is 2–3`, () => {
      assert.deepEqual(Object.keys(gd).filter((k) => k !== 'intro').sort(), [...SECTION_KEYS].sort());
      // the intro card (Guided Lessons return 2026-11-08): learning ≤ 30 words, start ≤ 40
      const intro = (gd as unknown as { intro?: { learning: string; start: string } }).intro;
      assert.ok(intro, 'no intro');
      assert.ok(intro.learning.trim().split(/\s+/).length <= 30, 'intro.learning over 30 words');
      assert.ok(intro.start.trim().split(/\s+/).length <= 40, 'intro.start over 40 words');
      for (const k of SECTION_KEYS) {
        assert.ok(gd[k].length >= 1 && gd[k].length <= 5, `${id}.${k}: ${gd[k].length} bullets`);
        for (const line of gd[k]) assert.ok(line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3`);
    });
  }
  it('house copy rules', () => {
    for (const [id, gd] of allGuides) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y|ed|ing)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend"`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|V1|DE-R2)\b/, `${id}: a build note`);
      assert.doesNotMatch(t, /\b(Waves|UAD|Universal Audio|SSL|Neve|API|Fairchild|Lexicon|Eventide|Boss|TC Electronic|FabFilter|iZotope|Soothe|Neumann|Shure|Sennheiser)\b/, `${id}: a gear maker/model name`);
    }
  });
});

describe('2. every step fits its no-scroll budget', () => {
  it('low ≤ 410, high ≤ 700, one TRY THIS item ≤ 200', () => {
    const over: string[] = [];
    for (const [id, gd] of allGuides) {
      for (const s of SCREEN_GUIDE_SECTIONS as readonly { key: string; place: string }[]) {
        if (s.place === 'strip') {
          for (const item of gd.tryThis) if (item.length > SCREEN_GUIDE_BUDGET.tryItem) over.push(`${id}.tryThis (${item.length}): ${item.slice(0, 40)}…`);
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

describe('3. each guide quotes its screen’s real names', () => {
  const NAMES: Record<string, string[]> = {
    home: ['Smart Processors', 'De-Esser & Sibilance Control', 'OPEN', 'CHECK YOUR UNDERSTANDING', 'CORRECT', 'NOT QUITE — TRY ANOTHER', '‹', 'detector', 'threshold', 'gain computer'],
    what: ['PHRASE', 'SPECTRUM', 'voice body', 'hiss band (2–10 kHz)', 'JUMP TO AN S', '‹', '›', 'FULL SCREEN', 'NEXT'],
    eqVs: ['STATIC EQ CUT · −', 'DE-ESSER', 'HISS BAND ALONE', 'brightness taken from everything that is not an S', 'UNDERSTANDING CHECK', 'FULL SCREEN'],
    path: ['SIGNAL PATH', 'MAIN PATH', 'SIDE CHAIN', 'NEXT BLOCK ›', 'WALK THE SIGNAL', 'STOP', 'BROADBAND', 'SPLIT-BAND', 'FULL SCREEN', 'UNDERSTANDING CHECK'],
    threshold: ['DETECTOR', 'THRESHOLD', 'GAIN REDUCTION', 'Threshold', 'Too high', 'About right', 'FULL SCREEN', 'UNDERSTANDING CHECK'],
    frequency: ['SPECTRUM', 'STARTING POINTS', 'Detector frequency', 'Band width', 'Missing it', 'narrow', 'wide', 'FULL SCREEN', 'UNDERSTANDING CHECK'],
    gr: ['GAIN REDUCTION', 'Range (maximum reduction)', 'Threshold', 'Controlled', 'Transparent', 'FULL SCREEN'],
    mode: ['BROADBAND', 'SPLIT-BAND', 'THIS FRAME · BEFORE (GHOST) AND AFTER', 'AUTO-STEP', 'JUMP TO AN S', 'FULL SCREEN', 'UNDERSTANDING CHECK'],
    over: ['OUTPUT', 'THE PROGRESSION', 'How hard', 'RESET RACK TO DEFAULTS', 'Transparent', 'Controlled', 'Lisping', 'Dull and lifeless', 'FULL SCREEN', 'UNDERSTANDING CHECK'],
    connections: ['EQ Lab', 'Compression', 'Gate / Expander', 'Visual Audio Analysis', 'Speech & Voice Lab', 'OPEN ›', 'FINISH · SEE WHAT’S LEFT'],
    end: ["WHAT'S LEFT", 'LAB COMPLETE', 'YOUR PROGRESS', '✓', 'DONE', 'REVIEW ▾', 'PRACTICE AGAIN FROM THE START', 'DONE · BACK TO LABS', '‹ PREV', '▾', 'What Sibilance Is', 'Connections & Check', 'Smart Processors', 'NEXT', 'FINISH'],
  };
  it('a name list for every screen', () => assert.deepEqual(Object.keys(NAMES).sort(), allGuides.map(([id]) => id).sort()));
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(id === 'home' ? HOME : id === 'end' ? END : PAGES[id]);
      for (const n of names) {
        assert.ok(SRC.includes(n), `${id}: "${n}" is no longer in the lab source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('the drawn path-box labels the path guide quotes (pathLayout labels, drawn upper-case)', () => {
    const pl = code('src/screens/lab/deesser/pathLayout.ts');
    for (const l of ['band-pass', 'detector', 'threshold', 'gain comp.', 'input', 'output', 'sum', 'gain']) assert.match(pl, new RegExp(`label: \\[('[a-z ·.]+', )?'${l.replace('.', '\\.')}'`), l);
    assert.match(pl, /label: \['band', 'split'\]/);
    assert.match(code('src/screens/lab/deesser/deEsserViz.tsx'), /\{t\.toUpperCase\(\)\}/);
    const t = textOf(PAGES.path);
    for (const n of ['BAND-PASS', 'DETECTOR', 'THRESHOLD', 'GAIN COMP', 'BAND SPLIT', 'SUM', 'INPUT', 'OUTPUT', 'GAIN']) assert.ok(t.includes(n), n);
    // WALK THE SIGNAL's order in split-band, as the guide states it
    assert.match(pl, /\['in', 'split', 'bpf', 'det', 'thr', 'gc', 'gain', 'sum', 'out'\]/);
    assert.equal(M.DEFAULTS.mode, 'split', 'the lab starts in split-band');
  });
  it('the frequency page’s sibilant buttons are exactly the five the guide lists', () => {
    const SIB = M.PHRASE.filter((f: { sibilant: boolean }) => f.sibilant);
    const labels = SIB.map((f: { label: string; hissHz: number }) => `“${f.label}” · ${(f.hissHz / 1000).toFixed(1)}k`);
    assert.match(pageSrc('PageFrequency'), /label=\{`“\$\{PHRASE\[i\]\.label\}” · \$\{\(PHRASE\[i\]\.hissHz \/ 1000\)\.toFixed\(1\)\}k`\}/);
    assert.match(PAGES.frequency.control.join(' '), new RegExp(labels.join(', ')));
    assert.equal(M.FREQ_HINTS.length, 5);
    assert.match(PAGES.frequency.seeing.join(' '), /STARTING POINTS offers five suggested frequencies/);
  });
});

describe('4. every TRY THIS number is what the model prints at that setting', () => {
  // The lab's starting rack (DeEsserLabScreen LAB_DEFAULTS): Range capped at 8.
  assert.match(LAB, /const RANGE_MAX_DB = 8;/);
  assert.match(LAB, /const LAB_DEFAULTS: Settings = \{ \.\.\.DEFAULTS, rangeDb: Math\.min\(DEFAULTS\.rangeDb, RANGE_MAX_DB\) \};/);
  const RACK = { ...M.DEFAULTS, rangeDb: Math.min(M.DEFAULTS.rangeDb, 8) };
  const SIB = M.PHRASE.map((f: { sibilant: boolean }, i: number) => (f.sibilant ? i : -1)).filter((i: number) => i >= 0);
  const out = (s: object) => M.processPhrase(M.PHRASE, s);
  it('the starting rack: 6.5 kHz, Q 1.4, threshold −10 dB, Range 8 dB, split-band', () => {
    assert.deepEqual([RACK.freqHz, RACK.q, RACK.thresholdDb, RACK.rangeDb, RACK.mode], [6500, 1.4, -10, 8, 'split']);
  });
  it('page 1: the "i" → "s" frames, "sh" at 4.0 kHz vs S’s at 6.5–7.0 kHz, a "·" gap', () => {
    const [th, i, s] = M.PHRASE;
    assert.deepEqual([th.label, i.label, s.label], ['th', 'i', 's']);
    assert.ok(s.body < i.body && s.hiss > i.hiss);
    const sh = M.PHRASE.find((f: { label: string }) => f.label === 'sh');
    assert.equal(sh.hissHz, 4000);
    const sHz = M.PHRASE.filter((f: { label: string }) => f.label === 's').map((f: { hissHz: number }) => f.hissHz);
    assert.equal(Math.min(...sHz), 6500); assert.equal(Math.max(...sHz), 7000);
    assert.match(pageSrc('PageWhat'), /near \$\{kHz\(f\.hissHz\)\}/);
    assert.match(PAGES.what.tryThis.join('\n'), /near 4\.0 kHz, lower than the S’s near 6\.5–7\.0 kHz/);
  });
  it('page 2: EQ takes 8.0 dB from the non-S frames, the de-esser 0.0, S’s down about 7.0', () => {
    const eq = M.eqCut(M.PHRASE, 8);
    const de = M.processPhrase(M.PHRASE, { ...M.DEFAULTS, thresholdDb: -12, rangeDb: 8 });
    assert.match(pageSrc('PageEqVs'), /processPhrase\(PHRASE, \{ \.\.\.DEFAULTS, thresholdDb: -12, rangeDb: cut \}\)/);
    assert.equal(M.vowelBrightnessLossDb(M.PHRASE, eq).toFixed(1), '8.0');
    assert.equal(M.vowelBrightnessLossDb(M.PHRASE, de).toFixed(1), '0.0');
    assert.equal(M.meanSibilantGr(de).toFixed(1), '7.0');
    assert.match(PAGES.eqVs.tryThis.join('\n'), /8\.0 dB from everything that is not an S\. Tap DE-ESSER: 0\.0 dB[\s\S]*about 7\.0 dB/);
  });
  it('page 4: −10 all sibilants + nothing else (About right); −19 the TH; −21 the P joins; 0 nothing (Too high)', () => {
    const crossing = (t: number) => out({ ...RACK, thresholdDb: t }).filter((p: { grDb: number }) => p.grDb > 0);
    const others = (t: number) => crossing(t).filter((p: { frame: { sibilant: boolean } }) => !p.frame.sibilant).map((p: { frame: { label: string } }) => p.frame.label);
    const sibs = (t: number) => crossing(t).filter((p: { frame: { sibilant: boolean } }) => p.frame.sibilant).length;
    assert.equal(sibs(-10), SIB.length); assert.deepEqual(others(-10), []);
    assert.deepEqual(others(-18), []); assert.deepEqual(others(-19), ['th']);
    assert.deepEqual(others(-20), ['th']); assert.deepEqual(others(-21), ['th', 'p']);
    assert.equal(crossing(0).length, 0);
    assert.match(pageSrc('PageThreshold'), /'About right: every sibilant crosses/);
    assert.match(pageSrc('PageThreshold'), /'Too high: no S reaches the threshold/);
    assert.match(pageSrc('PageThreshold'), /min=\{-40\} max=\{0\} step=\{1\}/);
  });
  it('page 5: 98% → Q 4.0 86%; "sh" at Q 4.0 24% (Missing it); the SH starting point 100%', () => {
    const pct = (hz: number, fc: number, q: number) => Math.round(M.bandpassGain(hz, fc, q) * 100);
    assert.equal(SIB[3], 11); assert.equal(M.PHRASE[11].hissHz, 7000); // the page opens on “s” · 7.0k
    assert.match(pageSrc('PageFrequency'), /useState<number>\(SIB\[3\]\)/);
    assert.equal(pct(7000, 6500, 1.4), 98);
    assert.equal(pct(7000, 6500, 4), 86);
    assert.equal(pct(4000, 6500, 4), 24);
    assert.ok(M.bandpassGain(4000, 6500, 4) <= 0.4, 'reads Missing it');
    const shHint = M.FREQ_HINTS.find((h: { id: string }) => h.id === 'sh');
    assert.equal(shHint.name, '"SH" rather than "S"'); assert.equal(shHint.hz, 4000);
    assert.equal(pct(4000, shHint.hz, 4), 100);
    assert.match(pageSrc('PageFrequency'), /min=\{0\.7\} max=\{4\} step=\{0\.1\}/);
    const t = PAGES.frequency.tryThis.join('\n');
    assert.match(t, /“s” · 7\.0k is heard 98%\. Slide Band width to Q 4\.0 · narrow: 86%/);
    assert.match(t, /pick “sh” · 4\.0k: 24%, Missing it\. Under STARTING POINTS, tap "SH" rather than "S" · 4\.0k: the detector moves to 4\.0 kHz and hears 100%/);
    // the page leaves the shared rack at 4.0 kHz / Q 4.0 — so it hands it back
    assert.match(t, /set the detector back to 6\.5 kHz and Q 1\.4, where the lab starts/);
    assert.match(pageSrc('PageFrequency'), /set\(\{ freqHz: h\.hz \}\)/);
  });
  it('page 6: peak 7.4 / average 5.8 Controlled; Range 4.0 → 4.0 / 3.7 Transparent', () => {
    const a = out(RACK);
    assert.equal(Math.max(...a.map((p: { grDb: number }) => p.grDb)).toFixed(1), '7.4');
    assert.equal(M.meanSibilantGr(a).toFixed(1), '5.8');
    assert.equal(M.overStage(M.meanSibilantGr(a)).name, 'Controlled');
    const b = out({ ...RACK, rangeDb: 4 });
    assert.equal(Math.max(...b.map((p: { grDb: number }) => p.grDb)).toFixed(1), '4.0');
    assert.equal(M.meanSibilantGr(b).toFixed(1), '3.7');
    assert.equal(M.overStage(M.meanSibilantGr(b)).name, 'Transparent');
    assert.match(pageSrc('PageGr'), /min=\{0\} max=\{RANGE_MAX_DB\} step=\{0\.5\}/);
    const t = PAGES.gr.tryThis.join('\n');
    assert.match(t, /detector at 6\.5 kHz and Q 1\.4 \(where the lab starts\), Threshold −10 dB and Range 8\.0 dB: peak 7\.4 dB, average 5\.8 dB — Controlled/);
    // why the step names the detector: left where page 5 ends (4.0 kHz, Q 4.0)
    // the same page reads peak 6.0 / average 1.2 — Transparent
    const moved = out({ ...RACK, freqHz: 4000, q: 4 });
    assert.equal(M.meanSibilantGr(moved).toFixed(1), '1.2');
    assert.match(t, /Range down to 4\.0 dB: peak 4\.0 dB, average 3\.7 dB — Transparent/);
  });
  it('page 7: JUMP TO AN S from frame 1 lands on frame 3 “s” at −7.2 dB; frame 8 “a” has none', () => {
    const a = out(RACK);
    assert.equal(SIB.find((i: number) => i > 0), 2);
    assert.equal(M.PHRASE[2].label, 's');
    assert.equal(a[2].grDb.toFixed(1), '7.2');
    assert.equal(M.PHRASE[7].label, 'a'); assert.equal(a[7].grDb, 0);
    assert.match(pageSrc('PageMode'), /const \[step, setStep\] = useState\(0\);/);
    assert.match(pageSrc('PageMode'), /'no reduction on this frame — both modes pass it untouched'/);
    const t = PAGES.mode.tryThis.join('\n');
    assert.match(t, /detector 6\.5 kHz, Q 1\.4, Threshold −10 dB, Range 8\.0 dB\. JUMP TO AN S lands on frame 3, “s”, at −7\.2 dB/);
    assert.equal(out({ ...RACK, freqHz: 4000, q: 4 })[2].grDb, 0, 'at 4.0 kHz / Q 4.0 frame 3 has none');
    assert.match(t, /frame 8, “a”: no reduction, so both modes pass it untouched/);
  });
  it('page 8: 25% Transparent (threshold −6), 45% Controlled, 75% Lisping, 100% Dull and lifeless (~16 dB)', () => {
    const at = (a: number) => {
      const s = M.overSettings(a, 'split');
      const mean = M.meanSibilantGr(out(s));
      return { thr: -Math.round(a * M.OVER_THRESHOLD_SPAN_DB), stage: M.overStage(mean).name, mean };
    };
    assert.deepEqual([at(0.25).thr, at(0.25).stage], [-6, 'Transparent']);
    assert.equal(at(0.45).stage, 'Controlled');
    assert.equal(at(0.75).stage, 'Lisping');
    assert.deepEqual([at(1).thr, at(1).stage, at(1).mean.toFixed(0)], [-24, 'Dull and lifeless', '16']);
    // the mode does not change the reduction (only what it is applied to)
    assert.equal(M.meanSibilantGr(out(M.overSettings(1, 'broadband'))).toFixed(0), '16');
    assert.match(pageSrc('PageOver'), /threshold \$\{-Math\.round\(v \* OVER_THRESHOLD_SPAN_DB\)\} dB/);
    const t = PAGES.over.tryThis.join('\n');
    assert.match(t, /25% \(threshold −6 dB\): Transparent\. Then 45%: Controlled\. Then 75%: Lisping/);
    assert.match(t, /100% \(threshold −24 dB\) the card reads Dull and lifeless, about 16 dB/);
  });
  it('page 9 + hub: the five connections, in order', () => {
    assert.deepEqual(M.CONNECTIONS.map((c: { name: string }) => c.name), ['EQ Lab', 'Compression', 'Gate / Expander', 'Visual Audio Analysis', 'Speech & Voice Lab']);
    assert.match(PAGES.connections.seeing[0], /EQ Lab, Compression, Gate \/ Expander, Visual Audio Analysis and Speech & Voice Lab/);
  });
});

describe('5. wiring + the accuracy-chip decision', () => {
  it('the hub: ScreenGuideHost (no regions) + the ⓘ inside the hint anchor, where the chip sat', () => {
    assert.match(HUB, /import \{ ScreenGuideHintAnchor, ScreenGuideHost, ScreenGuideKey \} from '\.\.\/\.\.\/\.\.\/features\/lab\/screenGuide';/);
    assert.match(HUB, /import \{ SMART_PROCESSORS_HOME_GUIDE \} from '\.\/smartProcessorsScreenGuides';/);
    assert.match(HUB, /<ScreenGuideHost regions=\{false\}>[\s\S]*<ScreenGuideHintAnchor>[\s\S]*<ScreenGuideKey title="SMART PROCESSORS LAB" guide=\{SMART_PROCESSORS_HOME_GUIDE\} \/>[\s\S]*<\/ScreenGuideHintAnchor>[\s\S]*<LabUnderstandingBlock[\s\S]*<\/ScreenGuideHost>/);
    assert.doesNotMatch(HUB, /AccuracyNote/);
  });
  it('the De-Esser PagedLab: pageGuide + endGuide + accuracy={false}', () => {
    assert.match(LAB, /import \{ DEESSER_END_GUIDE, deEsserPageGuide \} from '\.\/smartProcessorsScreenGuides';/);
    assert.match(LAB, /<PagedLab[\s\S]*?pageGuide=\{deEsserPageGuide\}[\s\S]*?endGuide=\{DEESSER_END_GUIDE\}[\s\S]*?accuracy=\{false\}[\s\S]*?\/>/);
    // the shell honours all three: the end guide shows only while ending, titled WHERE YOU ARE
    assert.match(SHELL, /const guide = ending \? endGuide : def\.guide \?\? pageGuide\?\.\(page\);/);
    assert.match(SHELL, /guideTitle=\{ending \? 'WHERE YOU ARE' : def\.title\.toUpperCase\(\)\}/);
    assert.match(SHELL, /\{accuracy \? <AccuracyNote style=\{styles\.accuracy\} detail=\{accuracyDetail\} \/> : null\}/);
  });
  it('a CONCEPT lab: nothing plays, nothing is measured, and every figure keeps its "conceptual" badge', () => {
    assert.doesNotMatch(LAB + HUB, /ApeDsp|useMicrophone|getUserMedia|AudioRecorder|startFenced/);
    assert.match(LAB, /const CONCEPTUAL = 'Relative levels from a modeled phrase — conceptual, not a calibrated meter\.';/);
    assert.ok((LAB.match(/badge=\{CONCEPTUAL\}/g) ?? []).length >= 6);
  });
});

describe('6. the end guide is true for THIS lab’s what’s-left screen', () => {
  const PAGED = LAB.slice(LAB.indexOf('<PagedLab'), LAB.indexOf('/>', LAB.indexOf('<PagedLab')));
  const endText = textOf(END);
  it('titles: WHAT\'S LEFT, LAB COMPLETE when every page is done, YOUR PROGRESS when unreadable', () => {
    assert.match(LAB_END, /return w\.complete \? 'LAB COMPLETE' : "WHAT'S LEFT";/);
    assert.match(END_SCREEN, /const title = unreadable \? 'YOUR PROGRESS' : w\.complete && completeTitle \? completeTitle : endTitle\(w\);/);
    assert.doesNotMatch(PAGED, /completeTitle/);
    assert.match(END.seeing.join(' '), /WHAT'S LEFT lists each page you haven’t done[\s\S]*LAB COMPLETE[\s\S]*YOUR PROGRESS/);
  });
  it('"progress" mode: no creditLabKey / pageCreditKeys / labDoneKey, no appended check — rows read ✓ DONE, never CREDITED; the credit check is listed and drawn (D41 K8)', () => {
    for (const p of ['creditLabKey', 'pageCreditKeys', 'labDoneKey', 'optionalPage', 'doneLabel', 'handsOnDetail', 'pageDetail']) assert.doesNotMatch(PAGED, new RegExp(p), p);
    assert.match(SHELL, /const creditMode: 'credit' \| 'progress' = creditLabKey \|\| pageCreditKeys\.length > 0 \? 'credit' : 'progress';/);
    assert.match(END_SCREEN, /const tag = mode === 'credit' && !isGuest \? 'CREDITED' : 'DONE';/);
    assert.match(END.seeing.join(' '), /then a CHECK row: the five Smart Processors questions\. LAB COMPLETE shows once every page is done and the check is passed/);
    assert.match(END.seeing.join(' '), /Done pages and a passed check fold into one ✓ DONE row/);
    assert.match(PAGED, /creditCheckLabId="smart-processors"/);
    assert.doesNotMatch(endText, /CREDITED/);
    // the lab's credit is the hub's check (labId smart-processors), not these pages
    assert.match(HUB, /<LabUnderstandingBlock labId="smart-processors"/);
    // certificate bookkeeping left student text (owner 2026-11-08); where the check counts stays
    assert.match(END.changes.join(' '), /You can pass the five-question check here or on the Smart Processors Lab page; either one counts/);
    assert.doesNotMatch(endText, /certificate/i);
  });
  it('every button by its exact label, and what each does', () => {
    assert.match(END_SCREEN, /<GlassButton label="PRACTICE AGAIN FROM THE START"[^>]*onPress=\{onPracticeAgain\} \/>/);
    assert.match(END_SCREEN, /doneLabel = 'DONE · BACK TO LABS',/);
    assert.match(END_SCREEN, /\{showCredited \? 'HIDE ▴' : 'REVIEW ▾'\}/);
    assert.match(SHELL, /onPracticeAgain=\{\(\) => goTo\(0\)\}/);
    assert.match(SHELL, /onJump=\{\(id\) => goTo\(Number\(id\)\)\}/);
    assert.match(SHELL, /onDone=\{\(\) => safeGoBack\(navigation\)\}/);
    assert.match(SHELL, /noun="page"/);
    // page 1 is What Sibilance Is; PRACTICE AGAIN only moves (goTo never clears marks)
    assert.match(LAB, /const PAGES: PageDef\[\] = \[\n\s*\{ title: 'What Sibilance Is'/);
    assert.match(END.control.join(' '), /PRACTICE AGAIN FROM THE START opens What Sibilance Is and clears nothing/);
    // DONE goes back ONE screen: the de-esser is only ever opened from the hub
    assert.match(HUB, /route: 'DeEsserLab'/);
    assert.match(END.control.join(' '), /DONE · BACK TO LABS goes back one screen, to the Smart Processors Lab page/);
    // the strip on the end screen: ‹ PREV leaves the end screen for the page you were on; the WHAT'S LEFT ▾ readout drops down the page list
    const nav = code('src/screens/lab/kit/useLabNav.ts');
    assert.match(nav, /if \(ending\) \{\s*unEnd\(\);\s*return;\s*\}/);
    assert.match(code('src/screens/lab/kit/labNav.ts'), /pos: "What's left\. Opens the contents"/);
    assert.match(code('src/screens/lab/kit/LabNavBar.tsx'), /\{view\.pos\} \{contentsOpen \? '▴' : '▾'\}/);
    assert.match(END.control.join(' '), /‹ PREV returns to the page you came from\. WHAT'S LEFT ▾ lists every page, with START OVER \(PRACTICE\) at its foot\. START OVER asks first, then clears the page ✓ marks; a passed check stays/);
  });
  it('what makes a page count: any control or its check (touch / markDone), or NEXT / FINISH (no manualDone page); a CONTENTS jump never', () => {
    assert.doesNotMatch(LAB, /manualDone/);
    assert.match(SHELL, /if \(!pagesWithCheck\[from\]\?\.manualDone\) markDone\(\);/);
    // pages 1–8 mark themselves on any control (touch); page 9 only on the closing question's right answer
    for (const fn of ['PageWhat', 'PageEqVs', 'PagePath', 'PageThreshold', 'PageFrequency', 'PageGr', 'PageMode', 'PageOver']) assert.match(pageSrc(fn), /touch\(ctx\)/, fn);
    assert.doesNotMatch(pageSrc('PageConnections'), /touch\(ctx\)/);
    assert.match(pageSrc('PageConnections'), /onCorrect=\{\(\) => ctx\.markDone\(\)\}/);
    // goTo (CONTENTS / an end-screen row) marks nothing
    const goTo = SHELL.slice(SHELL.indexOf('const goTo = useCallback'), SHELL.indexOf('const markDone = useCallback'));
    assert.doesNotMatch(goTo, /markDone|completed/);
    const t = END.changes.join(' ');
    assert.match(t, /use one of its controls \(not FULL SCREEN or RESET RACK TO DEFAULTS\), answer its check right, or press NEXT\. Connections & Check counts when you answer its closing question right, or tap FINISH/);
    assert.match(t, /Opening a page from a list doesn’t count it/);
    // the two controls that do NOT count a page: FULL SCREEN (ExpandableFigure only opens) and RESET RACK TO DEFAULTS
    const fig = code('src/screens/lab/kit/ExpandableFigure.tsx');
    assert.match(fig, /onPress=\{\(\) => setFull\(true\)\}/);
    assert.doesNotMatch(fig, /markDone|touch/);
    assert.match(LAB, /<Btn label="RESET RACK TO DEFAULTS" onPress=\{\(\) => \{ set\(\{ \.\.\.LAB_DEFAULTS \}\); setAmount\(0\); \}\}/);
  });
  it('START OVER (PRACTICE) sits at the foot of the WHAT\'S LEFT ▾ list, asks first, and clears the ✓ marks (no credit elsewhere)', () => {
    assert.match(SHELL, /reset: \{ label: 'START OVER \(PRACTICE\)', run: confirmReset \}/);
    assert.match(SHELL, /confirmDialog\('Start a fresh practice run\?', message, 'Start over', doReset\)/);
    assert.match(SHELL, /const fresh: PagedProgress = \{ completed: \[\], lastPage: 0, done: false \};/);
    assert.match(code('src/screens/lab/kit/LabNavBar.tsx'), /\{nav\.reset \? \(/);
    assert.match(END.control.join(' '), /START OVER asks first, then clears the page ✓ marks/);
    assert.match(END.tryThis.join(' '), /reopen a finished page you found hard\. Its ✓ stays/);
    assert.doesNotMatch(endText, /Nothing is taken away/);
  });
  it('unreadable: YOUR PROGRESS, yet a page done on this visit still folds under ✓ DONE (endCleared reads progress.completed)', () => {
    assert.match(SHELL, /if \(banked \|\| progress\?\.completed\.includes\(i\)\) endCleared\.add\(String\(i\)\);/);
    assert.match(END.seeing.join(' '), /YOUR PROGRESS, your saved pages couldn’t be read: every page stays listed, and only pages done on this visit fold under ✓ DONE/);
  });
});
