/**
 * Screen Guide rollout — Advanced Mixing (owner 2026-10-31) — receipts.
 * Pattern: test/screenGuide_patchbay_20261031.test.ts.
 *
 *   1. every page the learner reaches (p1…p20, one per PageDef, in page
 *      order) has a complete guide inside its no-scroll budget, in the house
 *      copy rules;
 *   2. each guide quotes its page's REAL names (guide AND source, comments
 *      stripped);
 *   3. the numbers TRY THIS quotes are what the page draws (the comb
 *      calculator, the automation lanes, the final's step thresholds);
 *   4. wiring: AdvancedMixingLabScreen passes `pageGuide` AND `endGuide`
 *      to PagedLab;
 *   5. the accuracy chip: KEPT — LUFS / true-peak estimates, peak / RMS /
 *      crest, null residues on screen;
 *   6. the what's-left screen's guide (ADVANCED_MIXING_END_GUIDE) is held to
 *      the same budget and copy rules, and every fact it states is pinned to
 *      the code that draws that screen for THIS lab (PagedLab → LabEndScreen
 *      → labEnd): credit mode, titles, button labels, the "counts" rule.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
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

const MX = 'src/screens/lab/mixing';
const { ADVANCED_MIXING_SCREEN_GUIDES, ADVANCED_MIXING_GUIDE_PAGE_TITLES, ADVANCED_MIXING_END_GUIDE, advancedMixingPageGuide } = await import(`../${MX}/advancedMixingScreenGuides.ts`);
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const ADV = await import(`../${MX}/engine/advanced.ts`);

type Guide = Record<string, string[]>;
const GUIDES = ADVANCED_MIXING_SCREEN_GUIDES as unknown as Record<string, Guide>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');

const PAGE_FILES = ['pagesAdvA.tsx', 'pagesAdvB.tsx', 'pagesAdvC.tsx', 'pagesAdvD.tsx'].map((f) => `${MX}/${f}`);
const PAGE_TITLES = PAGE_FILES.flatMap((f) => [...code(f).matchAll(/\{ title: '((?:[^'\\]|\\.)*)', short: /g)].map((m) => m[1]));
const IDS = Array.from({ length: 20 }, (_, i) => `p${i + 1}`);

describe('1. every Advanced Mixing page has a complete guide', () => {
  it('one guide per page (p1…p20)', () => {
    assert.deepEqual(Object.keys(GUIDES), IDS);
    assert.deepEqual(Object.keys(ADVANCED_MIXING_GUIDE_PAGE_TITLES), IDS);
  });
  it('each id is pinned to its page’s real title, in page order', () => {
    assert.equal(PAGE_TITLES.length, 20, 'parsed every PageDef');
    assert.deepEqual(Object.values(ADVANCED_MIXING_GUIDE_PAGE_TITLES), PAGE_TITLES);
    assert.match(code(`${MX}/AdvancedMixingLabScreen.tsx`), /const PAGES = \[\.\.\.MIXING_ADV_PAGES_A, \.\.\.MIXING_ADV_PAGES_B, \.\.\.MIXING_ADV_PAGES_C, \.\.\.MIXING_ADV_PAGES_D\];/);
  });
  it('no appended check page (no authored check for mixing-adv)', () => {
    assert.doesNotMatch(read('src/features/lab/understandingChecks.ts') + read('src/features/lab/understanding.ts'), /mixing-adv/);
  });
  it('the PagedLab lookup is 0-based, and returns nothing past the last page (no check page)', () => {
    assert.equal(advancedMixingPageGuide(0), GUIDES.p1);
    assert.equal(advancedMixingPageGuide(19), GUIDES.p20);
    assert.equal(advancedMixingPageGuide(20), undefined);
  });
  for (const [id, gd] of Object.entries(GUIDES)) {
    it(`${id}: all five sections, 1–5 bullets each, 2–3 TRY THIS`, () => {
      assert.deepEqual(Object.keys(gd).sort(), [...SECTION_KEYS].sort());
      for (const k of SECTION_KEYS) {
        assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1, `${id}.${k} is empty`);
        assert.ok(gd[k].length <= 5, `${id}.${k} has ${gd[k].length} bullets (max 5)`);
        for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
    });
  }
  it('every step fits its no-scroll budget (375 × 812), on every page', () => {
    const over: string[] = [];
    for (const [id, gd] of Object.entries(GUIDES)) {
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
  it('house copy rules: knowledge not skills, no "N of total", "suggest" not "recommend", no build notes', () => {
    for (const [id, gd] of Object.entries(GUIDES)) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmastery\b|\byou(’|')?ve mastered\b|\byou mastered\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend"`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|cognition (pass|round|audit)|art fix|toddler pass)\b/i, `${id}: a build note`);
    }
  });
  it('Mixing copy: the pages that hand out a mixing move say starting point', () => {
    for (const id of ['p7', 'p12']) assert.match(textOf(GUIDES[id]), /suggested starting point/i, id);
  });
  it('diagnosis pages never state a case’s answer (p19 cases, p20 handoff diagnosis)', () => {
    const p19 = textOf(GUIDES.p19);
    assert.doesNotMatch(p19, /low-mid|250 Hz|presence|2–4 kHz|pileup|reverb setting it back|competitors/i);
    const p20 = [...GUIDES.p20.seeing, ...GUIDES.p20.teaches].join('\n');
    assert.doesNotMatch(p20, /buried lead|hot centered guitar|drowned space/i);
  });
});

describe('2. each guide quotes its page’s real names', () => {
  const SRC = [
    ...PAGE_FILES,
    `${MX}/kit.tsx`,
    `${MX}/advFigures.tsx`,
    `${MX}/advPlots.tsx`,
    'src/screens/lab/kit/labNav.ts',
    'src/screens/lab/kit/LabNavBar.tsx',
    'src/features/lab/ProNote.tsx',
  ]
    .map(code)
    .join('\n');
  const NAMES: Record<string, string[]> = {
    p1: ['PREREQUISITE MET', 'TWO WAYS IN', 'OPEN BEGINNING MIXING', 'Beginning Mixing complete', 'Prove the foundations (3 checks)', '‹ PREV', 'NEXT ›', '⏮', 'When to bring in a pro ›'],
    p2: ['THE PLAN, BEFORE THE FADERS', 'Priorities first', 'Reference analysis', 'Genre expectations', 'Processing strategy', 'Revision planning', 'COMMIT — YOUR THREE PRIORITIES', 'Vocal-forward', 'Groove first', 'Wide & deep', 'Punchy & tight', 'Warm & unhurried', 'Translates everywhere', '✓ Three named. Every decision from here negotiates around these.'],
    p3: ['THE PRACTICES', 'Templates', 'Folders & visibility', 'Routing maps', 'Processing order', 'Resource management', 'THIS SESSION’S ROUTING MAP', 'RHYTHM BUS', 'MUSIC BUS', 'VOCAL BUS', 'FX RTN', 'SENDS', 'MIX BUS', 'LEAD', 'KICK'],
    p4: ['GLUE, HEARD', 'KIT, NO COMP', 'ONE BUS COMP', 'PER-TRACK COMP', 'WHERE THE COMPRESSOR SITS — AND WHERE A PULL ACTS', 'DRUMS', 'VCA 1', 'NO PULL', 'PULL VCA −6', 'PULL SUBGROUP −6', 'WHEN EACH TOOL WINS', 'COMP'],
    p5: ['THE TOOLS', 'Multiple returns', 'Cue mixes', 'Sidechain feeds', 'Solo-safe returns', 'Feedback prevention'],
    p6: ['INSERT VS PARALLEL, HEARD', 'KIT DRY', 'INSERT COMP', 'PARALLEL (NY)', 'AS HEARD (level-matched)', 'CREST', 'Play a version to measure its peak, RMS and crest factor.', 'MULTIBUS THINKING'],
    p7: ['COMPLEMENTARY EQ, HEARD', 'CROWDED', 'COMPLEMENTARY', 'LEAD’S PRESENCE', 'THE ADVANCED TOOLKIT', 'Complementary EQ', 'Dynamic EQ', 'Mid/side EQ', 'Low-frequency management', 'KEYS · GTR · LEAD — NO EQ', 'KEYS −5 dB', 'GTR −4 dB', 'LEAD +2 dB'],
    p8: ['SIDECHAIN, HEARD', 'NO DUCK', 'KICK DUCKS BASS', 'THE KEY, DRAWN FROM THE REAL KICK', 'Serial compression', 'Multiband compression', 'Expansion & gating', 'Transient shaping', 'Advanced de-essing'],
    p9: ['THE COMB CALCULATOR', 'NOTCHES', 'PEAKS', 'POLARITY IS NOT DELAY', 'Ø'],
    p10: ['THE SIZE OF THE ROOM, HEARD', 'TIGHT ROOM', 'BIG HALL', 'THE TWO SPACES, MEASURED', 'RT60', 'THE SET-DESIGN TOOLKIT', 'Multiple spaces', 'Pre-delay as position', 'Filtered ambience', 'Tempo delays & throws'],
    p11: ['THE DRIVE, HEARD', 'CLEAN', 'GENTLE DRIVE', 'HARD DRIVE', 'THE TOOLKIT', 'What saturation adds', 'Tape, console, tube', 'Clipping as a tool', 'Level-matched evaluation'],
    p12: ['WIDTH AND ITS INVOICE, HEARD', 'AS MIXED', 'WIDENED 1.6×', 'WIDENED → MONO', 'WHERE EACH PART SITS — AND WHAT MONO COSTS IT', 'THE STABLE-CENTER RULE'],
    p13: ['SECTION DESIGN, HEARD', 'STATIC', 'SECTION-DESIGNED', 'BGV PAD', 'VERSE · BARS 1–2', 'CHORUS · BARS 3–4', 'Detailed rides', 'Subgroup & VCA automation', 'Plugin automation', 'Snapshots & sections', '▲ ENTERS'],
    p14: ['THE BUS CHAIN, THREE WAYS', 'NO BUS CHAIN', 'CONSERVATIVE CHAIN', 'OVERCOOKED', 'COMP', 'DRIVE', 'THE MASTERING BORDER'],
    p15: ['MEASURE — BS.1770-STYLE ESTIMATES', 'TRIM ', 'MEASURE', 'MEASURING…', 'LOUDNESS', 'TRUE PEAK', 'clear of −1', 'above −1', 'THE TRANSLATION CHECKS', 'THE MIX', 'MONO'],
    p16: ['THE DELIVERABLES VOCABULARY', 'Tracks vs multitracks vs stems', 'Alternate mixes', 'Standard stem sets', 'Identical starts & lengths', 'Names & versions'],
    p17: ['RUN IT — REAL MATH ON THE REAL SESSION', 'RUN THE NULL TEST', 'CLEAN BUS', 'BUS COMP ON FULL MIX', 'NULLS ✓', 'BROKEN ✗'],
    p18: ['THE PRACTICES', 'Version control', 'Metadata & documentation', 'Archive & recall', 'THE DELIVERY CHECKLIST — CHECKED, NOT REMEMBERED', '☐', '☑'],
    p19: ['CASE 1 — “IT’S MUDDY”', 'CASE 2 — “IT’S HARSH”', 'CASE 3 — “THE VOCAL IS BURIED”', 'What is actually wrong?', 'Solve all three cases', 'FLAWED', 'REPAIRED'],
    p20: ['THE MIXER’S MANTRA', 'STEP 1 — DIAGNOSE THE HANDOFF', 'THE HANDOFF', 'THE HANDOFF — YOUR DIAGNOSIS', 'THE REPAIR CONSOLE', 'HIGH-PASS THE KEYS (220 Hz)', 'BACK TO THE FLAWED HANDOFF', 'LISTEN — HANDOFF VS YOUR REPAIR', 'YOUR REPAIR', 'REPAIR, MONO', 'THE STEPS — VERIFIED AS YOU WORK', '7 · Deliver', '2 · Rebuild the balance', '3 · Clear the mud', '6 · Translation check', 'DELIVERED'],
  };
  it('a name list for every page', () => {
    assert.deepEqual(Object.keys(NAMES), Object.keys(GUIDES));
  });
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(GUIDES[id]);
      for (const n of names) {
        assert.ok(SRC.includes(n), `${id}: "${n}" is no longer in the lab’s source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
});

describe('3. the numbers TRY THIS quotes are what the page draws', () => {
  const fmt = (f: number) => (f >= 1000 ? `${(f / 1000).toFixed(1)}k` : String(Math.round(f)));
  const line = (ms: number) => `NOTCHES: ${ADV.combNotchesHz(ms, 3).map(fmt).join(' · ')} Hz — PEAKS: ${ADV.combPeaksHz(ms, 3).map(fmt).join(' · ')} Hz`;
  it('the comb line at 1 ms and 4 ms (p9), built exactly as the page builds it', () => {
    assert.match(code(`${MX}/pagesAdvB.tsx`), /NOTCHES: \{notches\.map\(\(f\) => \(f >= 1000 \? `\$\{\(f \/ 1000\)\.toFixed\(1\)\}k` : Math\.round\(f\)\)\)\.join\(' · '\)\} Hz — PEAKS:/);
    assert.match(code(`${MX}/pagesAdvB.tsx`), /const COMB_CHOICES = \[0\.5, 1, 2, 4\] as const;/);
    assert.equal(line(1), 'NOTCHES: 500 · 1.5k · 2.5k Hz — PEAKS: 1.0k · 2.0k · 3.0k Hz');
    assert.ok(textOf(GUIDES.p9).includes(line(1)));
    assert.ok(textOf(GUIDES.p9).includes(`NOTCHES: ${ADV.combNotchesHz(4, 3).map(fmt).join(' · ')} Hz`));
    assert.equal(ADV.combNotchesHz(4, 1)[0], 125);
  });
  it('section-designed lanes: fader + ride, formatted as the lanes print them (p13)', () => {
    const c = code(`${MX}/pagesAdvC.tsx`);
    const base = { lead: -3, bgv: -14, perc: -10, gtr: -9, keys: -11 };
    const ride = { lead: [0, 3], bgv: [-60, 10], perc: [-6, 0], gtr: [0, 2], keys: [2, -2] };
    assert.match(c, /lead: \{ \.\.\.AUTO_BASE\.lead, auto: \{ verseDb: 0, chorusDb: 3 \} \}/);
    assert.match(c, /bgv: \{ \.\.\.AUTO_BASE\.bgv, auto: \{ verseDb: -60, chorusDb: 10 \} \}/);
    assert.match(c, /perc: \{ \.\.\.AUTO_BASE\.perc, auto: \{ verseDb: -6, chorusDb: 0 \} \}/);
    assert.match(c, /gtr: \{ \.\.\.AUTO_BASE\.gtr, auto: \{ verseDb: 0, chorusDb: 2 \} \}/);
    assert.match(c, /keys: \{ \.\.\.AUTO_BASE\.keys, auto: \{ verseDb: 2, chorusDb: -2 \} \}/);
    const fmtRide = (db: number) => (db <= -60 ? '−∞' : db > 0 ? `+${db} dB` : db === 0 ? '0 dB' : `${db} dB`.replace('-', '−'));
    const delta = (a: number, b: number) => (a <= -60 ? '▲ ENTERS' : b <= -60 ? '▼ OUT' : `${b - a > 0 ? '▲ +' : '▼ −'}${Math.abs(b - a)} dB`);
    const lane = (id: keyof typeof base) => [base[id] + ride[id][0], base[id] + ride[id][1]];
    const t = textOf(GUIDES.p13);
    const [lv, lc] = lane('lead');
    assert.ok(t.includes(`LEAD ${fmtRide(lv).replace(' dB', '')} to ${fmtRide(lc)} (${delta(lv, lc)})`));
    const [bv, bc] = lane('bgv');
    assert.ok(t.includes(`BGV PAD ${fmtRide(bv)} to ${fmtRide(bc)} (${delta(bv, bc)})`));
    const [pv, pc] = lane('perc');
    assert.ok(t.includes(`PERC ${delta(pv, pc)}`));
    const [gv, gc] = lane('gtr');
    assert.ok(t.includes(`GTR ${delta(gv, gc)}`));
    const [kv, kc] = lane('keys');
    assert.ok(t.includes(`${fmtRide(kv).replace(' dB', '')} to ${fmtRide(kc)} (${delta(kv, kc)})`));
    assert.ok(t.includes(`KEYS, ${delta(kv, kc)}`));
    assert.ok(t.includes(`LEAD ${fmtRide(base.lead)}, KEYS ${fmtRide(base.keys)}`), 'STATIC lane values');
  });
  it('the final’s step thresholds (p20): LEAD ≥ −2, GTR ≤ +1, four channels changed, keys high-pass', () => {
    const d = code(`${MX}/pagesAdvD.tsx`);
    assert.match(d, /const leadUp = \(mix\.lead\?\.faderDb \?\? -6\) >= -2;/);
    assert.match(d, /const gtrTamed = \(mix\.gtr\?\.faderDb \?\? 5\) <= 1;/);
    assert.match(d, /return leadUp && gtrTamed && changed >= 4;/);
    assert.match(d, /const mudCleared = !!\(mix\.keys\?\.hpHz/);
    // TRY THIS changes four channels: LEAD, GTR, BGV and KEYS (the high-pass).
    assert.match(GUIDES.p20.tryThis[0], /LEAD[\s\S]*GTR[\s\S]*BGV[\s\S]*HIGH-PASS THE KEYS[\s\S]*four channels/);
    assert.match(d, /gtr: \{ faderDb: 5 \},[\s\S]*lead: \{ faderDb: -6, verbSendDb: 0 \}/);
  });
  it('the bus chains (p14) and the sidechain (p8) and parallel crush (p6) are quoted at their real settings', () => {
    const c = code(`${MX}/pagesAdvC.tsx`);
    assert.match(c, /busComp: \{ thresholdDb: -20, ratio: 2, attackMs: 30, releaseMs: 200 \},\n\s*busDriveDb: 4,/);
    assert.match(c, /busComp: \{ thresholdDb: -26, ratio: 6, attackMs: 2, releaseMs: 60 \},\n\s*busDriveDb: 12,/);
    const b = code(`${MX}/pagesAdvB.tsx`);
    assert.match(b, /bass: \{ comp: \{ thresholdDb: -26, ratio: 8, attackMs: 2, releaseMs: 110, sidechainFrom: 'kick' \} \}/);
    assert.match(b, /thresholdDb: -30, ratio: 8, attackMs: 1, releaseMs: 90, parallelBlendDb: -6/);
    assert.match(code(`${MX}/pagesAdvC.tsx`), /busDriveDb: 6, matchTo: 'clean'[\s\S]*busDriveDb: 14, matchTo: 'clean'/);
  });
  it('the trim is a plain linear gain after every stage, so LUFS and true peak follow it one for one (p15)', () => {
    const a = code(`${MX}/audio/mixAudio.ts`);
    assert.match(a, /const mg = db2lin\(masterDb\);[\s\S]*L\[i\] \*= mg;\n\s*R\[i\] \*= mg;/);
    assert.match(code(`${MX}/pagesAdvD.tsx`), /\{\[-6, -3, 0\]\.map\(\(db\) =>/);
    assert.match(code(`${MX}/pagesAdvD.tsx`), /measured\.tp <= -1 \? colors\.green : PEAK_RED/);
  });
  it('the null test: two stems (rhythm = kick, snare, perc, bass), a −60 dB pass line, a −18 dB 4:1 bus compressor (p17)', () => {
    const d = code(`${MX}/pagesAdvD.tsx`);
    assert.match(d, /const RHYTHM: readonly TrackId\[\] = \['kick', 'snare', 'perc', 'bass'\];/);
    assert.match(d, /result\.linear < -60 \? 'NULLS ✓' : 'NO NULL'/);
    assert.match(d, /busComp: \{ thresholdDb: -18, ratio: 4, attackMs: 10, releaseMs: 150 \}/);
  });
});

describe('4. wiring: every page draws the ⓘ through PagedLab', () => {
  it('AdvancedMixingLabScreen passes the lookup as pageGuide', () => {
    const SCREEN = code(`${MX}/AdvancedMixingLabScreen.tsx`);
    assert.match(SCREEN, /import \{ ADVANCED_MIXING_END_GUIDE, advancedMixingPageGuide \} from '\.\/advancedMixingScreenGuides';/);
    assert.match(SCREEN, /<PagedLab[^>]*pageGuide=\{advancedMixingPageGuide\}[^>]*\/>/);
  });
  it('AdvancedMixingLabScreen passes the what’s-left guide as endGuide', () => {
    assert.match(code(`${MX}/AdvancedMixingLabScreen.tsx`), /<PagedLab[^>]*endGuide=\{ADVANCED_MIXING_END_GUIDE\}[^>]*\/>/);
  });
  it('PagedLab shows endGuide on the what’s-left screen, titled WHERE YOU ARE', () => {
    const P = code('src/screens/lab/kit/PagedLab.tsx');
    assert.match(P, /const guide = ending \? endGuide : def\.guide \?\? pageGuide\?\.\(page\);/);
    assert.match(P, /guide=\{guide\}\s*guideTitle=\{ending \? 'WHERE YOU ARE' : def\.title\.toUpperCase\(\)\}/);
  });
});

describe('5. the accuracy chip: KEPT — real measurement numbers on screen', () => {
  it('the screen does not pass accuracy={false}', () => {
    assert.doesNotMatch(code(`${MX}/AdvancedMixingLabScreen.tsx`), /accuracy=\{false\}/);
  });
  it('the reason is on screen: LUFS / true-peak estimates and a crest readout', () => {
    const d = code(`${MX}/pagesAdvD.tsx`);
    assert.match(d, /BS\.1770-STYLE ESTIMATES/);
    assert.match(code(`${MX}/pagesAdvB.tsx`), /CREST \$\{\(m\.peakDb - m\.rmsDb\)\.toFixed\(1\)\} dB/);
  });
});

describe('6. the what’s-left screen’s guide (ADVANCED_MIXING_END_GUIDE)', () => {
  const END = ADVANCED_MIXING_END_GUIDE as unknown as Guide;
  const ET = textOf(END);
  const PAGED = code('src/screens/lab/kit/PagedLab.tsx');
  const ENDSCREEN = code('src/screens/lab/kit/LabEndScreen.tsx');
  const LABEND = code('src/screens/lab/kit/labEnd.ts');
  const SCREEN = code(`${MX}/AdvancedMixingLabScreen.tsx`);
  const endCall = PAGED.match(/<LabEndScreen[\s\S]*?\/>/)?.[0] ?? '';

  it('all five sections, 1–5 bullets each, 2–3 TRY THIS, inside the no-scroll budget', () => {
    assert.deepEqual(Object.keys(END).sort(), [...SECTION_KEYS].sort());
    for (const k of SECTION_KEYS) {
      assert.ok(END[k].length >= 1 && END[k].length <= 5, `END.${k}: ${END[k].length} bullets`);
      for (const line of END[k]) assert.ok(line.trim().length > 10, `END.${k}: a blank bullet`);
    }
    assert.ok(END.tryThis.length >= 2 && END.tryThis.length <= 3);
    for (const s of SCREEN_GUIDE_SECTIONS as readonly { key: string; place: string }[]) {
      if (s.place === 'strip') {
        for (const item of END.tryThis) assert.ok(item.length <= SCREEN_GUIDE_BUDGET.tryItem, `END.tryThis (${item.length})`);
        continue;
      }
      const n = END[s.key].join(' ').length;
      assert.ok(n <= (s.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low), `END.${s.key}: ${n}`);
    }
  });
  it('house copy rules: knowledge not skills, no "N of total", "suggest" not "recommend", no build notes', () => {
    assert.doesNotMatch(ET, /\byou(’|')?ll (master|build|mix|be able)|\bmastery\b|\byou(’|')?ve mastered\b|\byou mastered\b|\byou will learn to\b/i);
    assert.doesNotMatch(ET, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*\d+\b|\bOF\b/);
    assert.doesNotMatch(ET, /\brecommend/i);
    assert.doesNotMatch(ET, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|toddler pass)\b/i);
  });
  it('the titles it names are labEnd’s: WHAT’S LEFT, LAB COMPLETE', () => {
    assert.match(LABEND, /return w\.complete \? 'LAB COMPLETE' : "WHAT'S LEFT";/);
    assert.ok(ET.includes('WHAT’S LEFT') && ET.includes('LAB COMPLETE'));
  });
  it('the third title: YOUR PROGRESS when saved pages could not be read (this lab passes pageCreditKeys)', () => {
    assert.match(ENDSCREEN, /const title = unreadable \? 'YOUR PROGRESS'/);
    assert.match(PAGED, /const unreadable = pagesUnreadable \|\| \([^;]*pageCreditKeys\.length > 0\) && creditUnreadable\);/);
    assert.match(endCall, /unreadable=\{(unreadable|endUnreadable)\}/);
    assert.match(ET, /YOUR PROGRESS if saved pages could not be read/);
  });
  it('credit mode: the lab passes pageCreditKeys, so rows read ✓ CREDITED (✓ DONE for a guest)', () => {
    assert.match(SCREEN, /<PagedLab[^>]*pageCreditKeys=\{PAGE_KEYS\}[^>]*\/>/);
    assert.match(PAGED, /const creditMode: 'credit' \| 'progress' = creditLabKey \|\| pageCreditKeys\.length > 0 \? 'credit' : 'progress';/);
    assert.match(endCall, /mode=\{creditMode\}/);
    assert.match(ENDSCREEN, /const tag = mode === 'credit' && !isGuest \? 'CREDITED' : 'DONE';/);
    assert.ok(ET.includes('✓ CREDITED') && ET.includes('✓ DONE when you are not signed in'));
  });
  it('the buttons it names, with their exact labels and where they go', () => {
    // PagedLab passes no doneLabel → the default; PRACTICE AGAIN → page 1; DONE → back one screen.
    assert.doesNotMatch(endCall, /doneLabel/);
    assert.match(ENDSCREEN, /doneLabel = 'DONE · BACK TO LABS',/);
    assert.match(ENDSCREEN, /label="PRACTICE AGAIN FROM THE START"/);
    assert.match(endCall, /onPracticeAgain=\{\(\) => goTo\(0\)\}/);
    assert.match(endCall, /onDone=\{\(\) => safeGoBack\(navigation\)\}/);
    assert.match(endCall, /noun="page"/);
    for (const n of ['REVIEW ▾', 'HIDE ▴']) assert.ok(ENDSCREEN.includes(n), n);
    for (const n of ['DONE · BACK TO LABS', 'PRACTICE AGAIN FROM THE START', 'REVIEW ▾', 'HIDE ▴', 'Before You Begin']) assert.ok(ET.includes(n), `the guide never names "${n}"`);
    assert.equal(ADVANCED_MIXING_GUIDE_PAGE_TITLES.p1, 'Before You Begin');
    assert.match(ET, /PRACTICE AGAIN FROM THE START opens page 1, Before You Begin, and clears nothing/);
    assert.match(ET, /DONE · BACK TO LABS leaves the lab, back to the screen you opened it from/);
  });
  it('the strip on the end screen: ‹ PREV leaves the end screen, the readout reads WHAT’S LEFT, START OVER is in its list', () => {
    const NAVS = code('src/screens/lab/kit/labNav.ts');
    const HOOK = code('src/screens/lab/kit/useLabNav.ts');
    assert.match(NAVS, /prev: '‹ PREV'/);
    assert.match(NAVS, /whatsLeft: "WHAT'S LEFT"/);
    assert.match(HOOK, /if \(ending\) \{\s*unEnd\(\);\s*return;\s*\}/);
    assert.match(PAGED, /reset: \{ label: 'START OVER \(PRACTICE\)', run: confirmReset \}/);
    for (const n of ['‹ PREV', '⏮', 'START OVER (PRACTICE)']) assert.ok(ET.includes(n), n);
  });
  it('the "counts" rule: every page is manualDone, so only its goal chips count it — NEXT never does', () => {
    const defs = PAGE_FILES.flatMap((f) => [...code(f).matchAll(/\{ title: '(?:[^'\\]|\\.)*', short: [^}]*\}/g)].map((m) => m[0]));
    assert.equal(defs.length, 20);
    for (const d of defs) assert.match(d, /manualDone: true/, d);
    assert.match(PAGED, /if \(!pagesWithCheck\[from\]\?\.manualDone\) markDone\(\);/);
    assert.match(code(`${MX}/kit.tsx`), /export const HANDS_ON_DETAIL = 'Counts once the goals at the foot of the page are done\. NEXT moves on without counting it\.';/);
    assert.match(SCREEN, /handsOnDetail=\{HANDS_ON_DETAIL\}/);
    assert.ok(ET.includes('a line saying it counts once the goals at the foot of the page are done'));
    assert.match(ET, /NEXT and FINISH move on without counting it/);
  });
  it('page 1 counts when opened with Beginning Mixing complete on this device, or once its three checks are passed', () => {
    const A = code(`${MX}/pagesAdvA.tsx`);
    assert.match(A, /const unlocked = bmlDone === true \|\| passed >= 3;/);
    // read once, while page 1 is open; only useVisitGoals on that page marks it
    assert.match(A, /void loadPagedProgress\('mixing-beg'\)[\s\S]*?\}, \[\]\);/);
    assert.match(A, /const latched = useVisitGoals\(ctx, goals\);/);
    assert.match(ET, /Before You Begin counts when you open it with Beginning Mixing complete on this device, or once its three checks are passed/);
  });
  it('credit per page (signed in), kept after START OVER: onPageDone reports each page’s key; banked keys stay cleared', () => {
    assert.match(SCREEN, /const onPageDone = \(index: number\) => reportTrainingComplete\(mixingPageKeyAt\('adv', index\)\);/);
    assert.match(PAGED, /\(!!pageCreditKeys\[i\] && bankedPageKeys\.has\(pageCreditKeys\[i\]\)\)/);
    assert.match(LABEND, /'Practicing again or reviewing never removes credit you have already earned\./); // endNote (D41 K2)
    assert.match(ET, /never removes credit you have already earned/);
  });
  it('no check row and no optional pages, so the guide says the pages are the whole list', () => {
    assert.doesNotMatch(SCREEN, /optionalPage=/);
    assert.doesNotMatch(read('src/features/lab/understandingChecks.ts'), /mixing-adv/);
    assert.match(ET, /No CHECK row: the pages are the whole list\./);
    assert.doesNotMatch(ET, /OPTIONAL/);
    // several pages (Before You Begin, planning, session management, stems…) have no player
    assert.doesNotMatch(ET, /comparison/);
    assert.match(ET, /reopen a finished page to practice it again/);
    assert.match(ET, /START OVER \(PRACTICE\) at the foot of the strip’s page list/);
  });
});
