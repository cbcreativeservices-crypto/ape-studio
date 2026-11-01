/**
 * Screen Guide rollout — Patchbay Signal Flow & Normalling (owner 2026-10-31)
 * — receipts. Pattern: test/screenGuide_20261031.test.ts (the Wave pilot).
 *
 *   1. every page the learner reaches (units p1…p23, one per PageDef, in
 *      page order) has a guide with all five sections, 1–5 bullets each,
 *      2–3 TRY THIS experiments, every step inside its no-scroll budget, in
 *      the house copy rules;
 *   2. each guide quotes its page's REAL names — each one pinned here is in
 *      both the guide and the lab's source (comments stripped);
 *   3. the numbers and states the TRY THIS lines quote are what the engine
 *      and the page code produce;
 *   4. wiring: PatchbayLabScreen passes `pageGuide` and `endGuide` to
 *      PagedLab; PagedLab draws the ⓘ on every page AND on the what's-left
 *      screen (titled WHERE YOU ARE) and hosts the overlay;
 *   5. the accuracy-chip decision: Patchbay is a CONCEPT lab (routing states,
 *      no real-world measurement numbers; the cutaway has its own CONCEPTUAL
 *      MODEL badge) → `accuracy={false}`, so the ⓘ takes the chip's spot;
 *   6. the END guide (PATCHBAY_END_GUIDE): shape, budgets, copy rules, and
 *      every fact it states pinned against LabEndScreen / labEnd / PagedLab /
 *      useLabNav and the props this lab passes (credit mode, noun, no check,
 *      button labels, which pages NEXT ticks, where DONE goes).
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

const PB = 'src/screens/lab/patchbay';
const { PATCHBAY_SCREEN_GUIDES, PATCHBAY_GUIDE_PAGE_TITLES, PATCHBAY_END_GUIDE, patchbayPageGuide } = await import(`../${PB}/patchbayScreenGuides.ts`);
const { PATCHBAY_UNITS, PATCHBAY_PAGE_COUNT } = await import(`../${PB}/units.ts`);
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const E = await import(`../${PB}/engine/patchbay.ts`);
const { STUDIO_PAIRS, DESIGN_ROWS } = await import(`../${PB}/engine/scenariosB.ts`);

type Guide = Record<string, string[]>;
const GUIDES = PATCHBAY_SCREEN_GUIDES as unknown as Record<string, Guide>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');

const PAGE_FILES = ['pagesA.tsx', 'pagesB.tsx', 'pagesC.tsx', 'pagesD.tsx'].map((f) => `${PB}/${f}`);
/** Every PageDef title, in page order (pagesA → D, as PatchbayLabScreen spreads them). */
const PAGE_TITLES = PAGE_FILES.flatMap((f) => [...code(f).matchAll(/\{ title: '((?:[^'\\]|\\.)*)', short: /g)].map((m) => m[1]));

describe('1. every Patchbay page has a complete guide', () => {
  it('one guide per page unit (p1…p23), none for a page that does not exist', () => {
    assert.equal(PATCHBAY_PAGE_COUNT, 23);
    assert.deepEqual(Object.keys(GUIDES), [...PATCHBAY_UNITS]);
    assert.deepEqual(Object.keys(PATCHBAY_GUIDE_PAGE_TITLES), [...PATCHBAY_UNITS]);
  });
  it('each unit id is pinned to its page’s real title, in page order (reorder a page → update the guides)', () => {
    assert.equal(PAGE_TITLES.length, 23, 'parsed every PageDef');
    assert.deepEqual(Object.values(PATCHBAY_GUIDE_PAGE_TITLES), PAGE_TITLES);
  });
  it('the PagedLab lookup is 0-based; past the last page it has none (the end screen uses endGuide)', () => {
    assert.equal(patchbayPageGuide(0), GUIDES.p1);
    assert.equal(patchbayPageGuide(22), GUIDES.p23);
    assert.equal(patchbayPageGuide(23), undefined);
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
  it('house copy rules: knowledge not skills, no "N of total", "suggest" not "recommend", no build notes, no maker names', () => {
    for (const [id, gd] of Object.entries(GUIDES)) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y|ed)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend"`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|rack conversion|cognition pass)\b/i, `${id}: a build note`);
      // The makers behind the lab's sources (pagesA header) stay out of learner text.
      assert.doesNotMatch(t, /\b(Neutrik|Bittree|Behringer|Samson)\b/i, `${id}: a maker name`);
      assert.doesNotMatch(t, /\bART\b/, `${id}: a maker name`);
    }
  });
});

describe('2. each guide quotes its page’s real names', () => {
  const SRC = [
    ...PAGE_FILES,
    `${PB}/bits.tsx`,
    `${PB}/rackLayout.tsx`,
    `${PB}/art/PatchPairView.tsx`,
    `${PB}/art/JackCutaway.tsx`,
    `${PB}/art/StudioBayView.tsx`,
    `${PB}/engine/scenarios.ts`,
    `${PB}/engine/scenariosB.ts`,
    'src/screens/lab/kit/labNav.ts',
    'src/screens/lab/kit/LabNavBar.tsx',
    'src/screens/lab/rack/RackUnit.tsx',
    'src/screens/lab/tuning/components/check.tsx',
  ]
    .map(code)
    .join('\n');
  const NAMES: Record<string, string[]> = {
    p1: ['TOP ROW = SOURCES · OUTPUTS', 'BOTTOM ROW = DESTINATIONS · INPUTS', 'Signal falls downhill. Top → Bottom.', 'THE PATCHBAY MANTRA', '‹ PREV', 'NEXT ›', '⏮', 'MODULE'],
    p2: ['CONSOLE OUT 1', 'INTERFACE IN 1', 'SOURCE · OUTPUT', 'DESTINATION · INPUT', 'BTM', 'TOP JACK', 'BOTTOM JACK', 'DEST HEARS', 'CORD', 'EMPTY', 'NONE', 'NOTHING', 'PATCH', 'YOUR CABLE', 'HIDE DISPLAY', 'FULL SCREEN'],
    p3: ['NO INTERNAL', 'NOT PLUGGED IN', 'ALT SOURCE', 'ONE CORD', 'TOP TO BOTTOM', 'SEE THE DEAD END (top only)', 'COMPLETE THE ROUTE (both jacks)', 'goes only into the cord'],
    p4: ['NO PATCH CORD REQUIRED', 'UNDERSTANDING CHECK', 'Nowhere — patch cords make every connection'],
    p5: ['INSIDE THE JACK — CUTAWAY', 'FRONT PANEL', 'TIP SPRING', 'FROM SOURCE · REAR', 'NORMAL CONTACT', 'TO DESTINATION · REAR', 'INSERTION', 'CONTACTS', 'TOUCHING', 'OPEN', 'INTACT', 'BROKEN', 'CONCEPTUAL MODEL', 'ENLARGED', 'PLUG INSERTION', 'BREAK THE NORMAL (insert fully)', 'RESTORE IT (pull the plug back out)'],
    p6: ['ANALYZER', 'DRUM MACHINE', 'NORMAL BROKEN', 'A · NOTHING PATCHED', 'B · TOP ONLY', 'C · BOTTOM ONLY', 'D · BOTH', 'SOURCE'],
    p7: ['PREDICT BEFORE PATCHING', 'PREDICT IT (answer below)', 'THEN DO IT (patch the top)', 'SPLIT'],
    p8: ['FULL-NORMAL', 'HALF-NORMAL (COMMON BAY)', 'UNDERSTANDING CHECK', 'Both'],
    p9: ['TAP THE MIX (top only — nothing interrupted)', 'REPLACE THE SOURCE (bottom — normal breaks)', 'MULT', 'PARALLEL', 'ANALYZER', 'DRUM MACHINE'],
    p10: ['ACTION', 'FULL', 'HALF (COMMON)', 'THRU', 'THE PATCHBAY MANTRA', 'MODULE'],
    p11: ['PREDICT', 'Here is why — read the path.'],
    p12: ['CASE', 'YOUR VERDICT', 'Full-normal', 'Half-normal', 'Thru', '▸'],
    p13: ['THE PATCHBAY MANTRA', 'SOURCES BEHIND THIS LAB', 'PART TWO STARTS ON THE NEXT PAGE'],
    p14: ['PAIR', '07 THRU', 'VISIT 4 PAIRS', 'FIND THE 2 THRU PAIRS', 'PATCH SOMETHING', 'INTERFACE OUT 1', 'MONITOR CTRL L', 'TOP JACK'],
    p15: ['PAIRS', 'FRONT CORDS', 'NORMALS', 'HIDDEN', 'SHOWN', 'SHOW THE INVISIBLE NORMALS', 'THRU'],
    p16: ['SYNTH (SOURCE C)', 'NORMAL PATH', 'OVERPATCH', 'OVERPATCH IT (patch the bottom)', 'OVERPATCHED'],
    p17: ['VOCAL PAIR', 'PROCESSOR PAIR', 'VOCAL OUT', 'CONSOLE IN 2', 'COMPRESSOR OUT', 'COMPRESSOR IN', '① SEND', '② RETURN', 'COMPRESSOR', 'BYPASSED', 'INSERT COMPRESSOR', 'VIEW', 'INSERT THE COMPRESSOR', 'BYPASS IT AGAIN', 'SERVICE CALL (answer below)'],
    p18: ['CALL', 'YOUR DIAGNOSIS', 'The re-wired compressor', 'Nothing happens'],
    p19: ['TAPE OUT 1', 'CONSOLE TAPE RTN 1', 'YOUR CABLE', 'ALT SOURCE', 'BREAK IT FROM THE TOP', 'SEE THE CLASH (bottom on this bay)', 'THE RULE THAT TRAVELS', 'CLASH'],
    p20: ['PLUG INSERTION', 'T · R · S', 'TIP', 'RING', 'SLEEVE', 'CONCEPTUAL MODEL', 'TOUCHING', 'INTACT'],
    p21: ['⚠ PHANTOM POWER + PATCHBAYS', '+48 V', 'Patch quickly so the transient is short'],
    p22: ['CONSOLE DIRECT OUT 1 → INTERFACE INPUT 1', 'SPARE PAIR (future gear)', 'COMPRESSOR OUT → COMPRESSOR IN', 'FULL-NORMAL', 'HALF-NORMAL', 'THRU', '✓', '△'],
    p23: ['IDENTIFY THE CONFIGURATION', 'SPOT THE HAZARD', 'Confirmed — read the path.', 'LAB COMPLETE', 'THE PATCHBAY MANTRA', 'FINISH'],
  };
  it('a name list for every page', () => {
    assert.deepEqual(Object.keys(NAMES), Object.keys(GUIDES));
  });
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(GUIDES[id]);
      for (const n of names) {
        // '07 THRU' is built from the pair number + config at render time.
        const inSrc = n === '07 THRU' ? /\$\{nn\(pair\.n\)\} \$\{pair\.config === 'thru' \? 'THRU'/.test(SRC) : SRC.includes(n);
        assert.ok(inSrc, `${id}: "${n}" is no longer in the lab’s source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
});

describe('3. the numbers and states TRY THIS quotes are what the screen shows', () => {
  const R = E.resolvePair;
  it('the contact opens at 85% (84% still touching); the badge prints the same number', () => {
    assert.equal(E.CONTACT_OPEN_AT, 0.85);
    assert.equal(E.contactsOpen(0.84), false);
    assert.equal(E.contactsOpen(0.85), true);
    assert.equal(E.contactsOpen(0.5), false);
    assert.match(code(`${PB}/art/JackCutaway.tsx`), /opens at \$\{Math\.round\(CONTACT_OPEN_AT \* 100\)\}% in/);
    assert.match(code(`${PB}/rackLayout.tsx`), /Math\.round\(v \* 100\) \/ 100/, '1% fader steps');
    for (const id of ['p5', 'p20']) assert.match(textOf(GUIDES[id]), /85%/);
  });
  it('T · R · S page: starts at 90%, the band labels show only past 30% (so they show at 84% and 100%)', () => {
    const d = code(`${PB}/pagesD.tsx`);
    assert.match(d, /const \[insertion, setInsertion\] = useState\(0\.9\);/);
    assert.match(code(`${PB}/art/JackCutaway.tsx`), /showConductors && insertion > 0\.3 \?/);
    assert.match(textOf(GUIDES.p20), /90%[\s\S]*30%/);
    assert.match(textOf(GUIDES.p20), /90% to 84%[\s\S]*100%/);
    assert.equal(E.contactsOpen(1), true, '100% reads OPEN / BROKEN');
  });
  it('the cutaway page starts with the plug OUT (no plug drawn until past 2%)', () => {
    assert.match(code(`${PB}/pagesA.tsx`), /const \[insertion, setInsertion\] = useState\(0\);/);
    assert.match(code(`${PB}/art/JackCutaway.tsx`), /\{insertion > 0\.02 \? \(/);
    assert.match(textOf(GUIDES.p5), /PLUG OUT/);
  });
  it('predict / diagnose pages never state the answer (p7 top-jack result, p18 call answers)', () => {
    const p7 = [...GUIDES.p7.seeing, ...GUIDES.p7.changes, ...GUIDES.p7.teaches, ...GUIDES.p7.tryThis].join('\n');
    assert.doesNotMatch(p7, /top (jack |plug )?(taps|leaves it closed)|status reads SPLIT|stays INTACT/i);
    const p18 = textOf(GUIDES.p18);
    assert.doesNotMatch(p18, /own input|top-row source|top row or bottom row/i);
  });
  it('the final page’s solved answers are page state (leaving clears them) — the guide warns, never sends the learner away mid-way', () => {
    assert.match(code(`${PB}/pagesD.tsx`), /const \[solved, setSolved\] = useState<Record<string, boolean>>\(\{\}\);/);
    assert.doesNotMatch(GUIDES.p23.tryThis.join('\n'), /jump to the table page, then come back/i);
  });
  it('design cards: SPARE PAIR is not the last card; △ marks a pick that does not suit the job (ok: false)', () => {
    assert.notEqual(DESIGN_ROWS[DESIGN_ROWS.length - 1].pair, 'SPARE PAIR (future gear)');
    assert.doesNotMatch(GUIDES.p22.seeing.join('\n'), /to a SPARE PAIR/);
    assert.match(code(`${PB}/pagesD.tsx`), /\{verdict\.ok \? '✓ ' : '△ '\}/);
  });
  it('thru: no normal; top only → NOTHING; both → PATCH', () => {
    assert.equal(R({ config: 'thru', topPlugged: true, bottomPlugged: false }).destinationHears, 'nothing');
    assert.equal(R({ config: 'thru', topPlugged: true, bottomPlugged: true }).destinationHears, 'patch');
    assert.equal(R({ config: 'thru', topPlugged: false, bottomPlugged: true }).destinationHears, 'patch');
    assert.equal(R({ config: 'thru', topPlugged: false, bottomPlugged: false }).hasNormal, false);
  });
  it('full: top only breaks and silences (the red hazard); bottom / both → PATCH', () => {
    const top = R({ config: 'full', topPlugged: true, bottomPlugged: false });
    assert.equal(top.normalBroken && top.destinationHears === 'nothing', true);
    assert.equal(R({ config: 'full', topPlugged: false, bottomPlugged: true }).destinationHears, 'patch');
    const both = R({ config: 'full', topPlugged: true, bottomPlugged: true });
    assert.equal(both.normalBroken, true);
    assert.equal(both.destinationHears, 'patch');
    assert.deepEqual(both.sourceReaches, ['patch'], 'the analyzer still gets the console');
  });
  it('half (common): top → SPLIT with the normal intact; bottom → broken, PATCH', () => {
    const top = R({ config: 'half', breakSide: 'bottom', topPlugged: true, bottomPlugged: false });
    assert.equal(top.isSplit && top.normalActive && top.destinationHears === 'normal', true);
    const bot = R({ config: 'half', breakSide: 'bottom', topPlugged: false, bottomPlugged: true });
    assert.equal(bot.normalBroken && bot.destinationHears === 'patch', true);
  });
  it('half, top-breaking: top → broken + silent (red); bottom alone → CLASH', () => {
    const top = R({ config: 'half', breakSide: 'top', topPlugged: true, bottomPlugged: false });
    assert.equal(top.normalBroken && top.destinationHears === 'nothing', true);
    const bot = R({ config: 'half', breakSide: 'top', topPlugged: false, bottomPlugged: true });
    assert.equal(bot.isMerge, true);
    assert.equal(bot.destinationHears, 'both');
    assert.match(code(`${PB}/rackLayout.tsx`), /\? 'CLASH'/);
  });
  it('the 8-pair bay: 01–06 half, 07–08 thru, 05 is INTERFACE OUT 1 → MONITOR CTRL L', () => {
    assert.equal(STUDIO_PAIRS.length, 8);
    assert.deepEqual(STUDIO_PAIRS.map((p: { config: string }) => p.config), ['half', 'half', 'half', 'half', 'half', 'half', 'thru', 'thru']);
    const p5 = STUDIO_PAIRS.find((p: { n: number }) => p.n === 5);
    assert.equal(`${p5.sourceLabel} → ${p5.destLabel}`, 'INTERFACE OUT 1 → MONITOR CTRL L');
    // A new selection starts with empty jacks (the guide says so).
    assert.match(code(`${PB}/pagesC.tsx`), /setPlugState\(\{ top: false, bottom: false \}\);/);
  });
  it('the processor chain: bypassed processor pair reads NONE / NOTHING; inserted vocal pair reads BROKEN / PATCH', () => {
    const proc = R({ config: 'thru', topPlugged: false, bottomPlugged: false });
    assert.equal(proc.hasNormal, false);
    assert.equal(proc.destinationHears, 'nothing');
    const vocal = R({ config: 'half', breakSide: 'bottom', topPlugged: true, bottomPlugged: true });
    assert.equal(vocal.normalBroken && vocal.destinationHears === 'patch', true);
  });
  it('design rows: the main path takes HALF ✓, FULL ✓ (with a cost), THRU △; the compressor rejects HALF', () => {
    const g1 = DESIGN_ROWS.find((r: { id: string }) => r.id === 'g1');
    assert.deepEqual([g1.verdicts.half.ok, g1.verdicts.full.ok, g1.verdicts.thru.ok], [true, true, false]);
    const g3 = DESIGN_ROWS.find((r: { id: string }) => r.id === 'g3');
    assert.equal(g3.verdicts.half.ok, false);
    assert.equal(DESIGN_ROWS.length, 6);
  });
});

describe('4. wiring: every page draws the ⓘ through PagedLab', () => {
  const SCREEN = code(`${PB}/PatchbayLabScreen.tsx`);
  const PAGED = code('src/screens/lab/kit/PagedLab.tsx');
  it('PatchbayLabScreen passes the lookup as pageGuide and PATCHBAY_END_GUIDE as endGuide', () => {
    assert.match(SCREEN, /import \{ PATCHBAY_END_GUIDE, patchbayPageGuide \} from '\.\/patchbayScreenGuides';/);
    assert.match(SCREEN, /<PagedLab[\s\S]*?pageGuide=\{patchbayPageGuide\}[\s\S]*?\/>/);
    assert.match(SCREEN, /<PagedLab[\s\S]*?endGuide=\{PATCHBAY_END_GUIDE\}[\s\S]*?\/>/);
  });
  it('PagedLab: the end guide shows while ending, titled WHERE YOU ARE; the host wraps the page, regions on rack pages only', () => {
    assert.match(PAGED, /const guide = ending \? endGuide : def\.guide \?\? pageGuide\?\.\(page\);/);
    assert.match(PAGED, /<ScreenGuideHost resetKey=\{ending \? 'end' : String\(page\)\} regions=\{!!def\.rack && !ending\}>/);
    assert.match(PAGED, /guide=\{guide\}\s*guideTitle=\{ending \? 'WHERE YOU ARE' : def\.title\.toUpperCase\(\)\}/);
  });
});

describe('5. the accuracy chip: Patchbay is a CONCEPT lab', () => {
  it('accuracy={false}: no header chip on rack pages, no note on reading pages', () => {
    assert.match(code(`${PB}/PatchbayLabScreen.tsx`), /<PagedLab[\s\S]*?accuracy=\{false\}[\s\S]*?\/>/);
    const PAGED = code('src/screens/lab/kit/PagedLab.tsx');
    assert.match(PAGED, /right=\{accuracy && def\.rack && !ending \? <AccuracyNote compact/);
    assert.match(PAGED, /\{accuracy \? <AccuracyNote style=\{styles\.accuracy\}/);
  });
  it('nothing in the lab draws its own AccuracyNote; the cutaway keeps its CONCEPTUAL MODEL badge', () => {
    for (const f of [...PAGE_FILES, `${PB}/PatchbayLabScreen.tsx`, `${PB}/rackLayout.tsx`, `${PB}/bits.tsx`]) {
      assert.doesNotMatch(code(f), /AccuracyNote/, `${f} draws an accuracy chip`);
    }
    assert.match(code(`${PB}/art/JackCutaway.tsx`), /export const JACK_BADGE = `CONCEPTUAL MODEL/);
  });
});

describe('6. the END guide (what’s-left screen) is true for THIS lab', () => {
  const END = PATCHBAY_END_GUIDE as unknown as Guide;
  const ET = textOf(END);
  const SCREEN = code(`${PB}/PatchbayLabScreen.tsx`);
  const PAGED = code('src/screens/lab/kit/PagedLab.tsx');
  const LES = code('src/screens/lab/kit/LabEndScreen.tsx');
  const LABEND = code('src/screens/lab/kit/labEnd.ts');
  const NAV = code('src/screens/lab/kit/useLabNav.ts');
  const NAVBAR = code('src/screens/lab/kit/LabNavBar.tsx');
  const NAVPURE = code('src/screens/lab/kit/labNav.ts');
  /** PagedLab's own <LabEndScreen … /> element. */
  const endEl = PAGED.match(/<LabEndScreen[\s\S]*?\/>/)?.[0] ?? '';

  it('all five sections, 1–5 bullets, 2–3 TRY THIS, inside the no-scroll budgets', () => {
    assert.deepEqual(Object.keys(END).sort(), [...SECTION_KEYS].sort());
    for (const k of SECTION_KEYS) {
      assert.ok(END[k].length >= 1 && END[k].length <= 5, `end.${k}: ${END[k].length} bullets`);
      for (const line of END[k]) assert.ok(line.trim().length > 10, `end.${k}: a blank bullet`);
    }
    assert.ok(END.tryThis.length >= 2 && END.tryThis.length <= 3);
    for (const s of SCREEN_GUIDE_SECTIONS as readonly { key: string; place: string }[]) {
      if (s.place === 'strip') {
        for (const item of END.tryThis) assert.ok(item.length <= SCREEN_GUIDE_BUDGET.tryItem, `end.tryThis (${item.length})`);
        continue;
      }
      const cap = s.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
      const n = END[s.key].join(' ').length;
      assert.ok(n <= cap, `end.${s.key}: ${n} > ${cap}`);
    }
  });
  it('house copy rules', () => {
    assert.doesNotMatch(ET, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y|ed)?\b|\byou will learn to\b/i);
    assert.doesNotMatch(ET, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*\d+\b|\bOF\s+\d+\b/i, 'an "N of total"');
    assert.doesNotMatch(ET, /\brecommend/i);
    assert.doesNotMatch(ET, /\b(TODO|FIXME|placeholder|owner 20\d\d)\b/i);
    assert.doesNotMatch(ET, /\b(Neutrik|Bittree|Behringer|Samson)\b/i);
  });
  it('the titles it names are the ones labEnd / LabEndScreen draw', () => {
    assert.match(LABEND, /w\.complete \? 'LAB COMPLETE' : "WHAT'S LEFT"/);
    assert.match(ET, /WHAT’S LEFT[\s\S]*LAB COMPLETE/);
    assert.ok(endEl.length > 0, 'found PagedLab’s <LabEndScreen />');
    assert.doesNotMatch(endEl, /completeTitle=/, 'no custom complete title for this lab');
    assert.match(PAGED, /guideTitle=\{ending \? 'WHERE YOU ARE'/);
  });
  it('credit mode: Patchbay banks p<n> credit (creditLabKey) → rows read ✓ CREDITED, ✓ DONE for a guest', () => {
    assert.match(SCREEN, /<PagedLab[\s\S]*?creditLabKey=\{PATCHBAY_LAB_KEY\}[\s\S]*?\/>/);
    assert.match(PAGED, /const creditMode: 'credit' \| 'progress' = creditLabKey \|\| pageCreditKeys\.length > 0 \? 'credit' : 'progress';/);
    assert.match(endEl, /mode=\{creditMode\}/);
    assert.match(LES, /const tag = mode === 'credit' && !isGuest \? 'CREDITED' : 'DONE';/);
    assert.match(LES, /✓ \{tag\} · /);
    assert.match(ET, /✓ CREDITED line \(✓ DONE when you are not signed in\)/);
  });
  it('the unit is a page; no understanding check, no optional page, no per-page detail line', () => {
    assert.match(endEl, /noun="page"/);
    assert.doesNotMatch(code('src/features/lab/understandingChecks.ts'), /\bpatchbay\s*:/, 'Patchbay has no understanding check (no CHECK row)');
    assert.doesNotMatch(SCREEN, /optionalPage=|pageDetail=|handsOnDetail=|labDoneKey=|doneLabel=/);
    assert.doesNotMatch(ET, /\bCHECK\b|optional/i);
    assert.match(ET, /listed by its number and name/);
    assert.match(LES, /String\(r\.num\)\.padStart\(2, '0'\)/);
  });
  it('every button label it quotes is on the end screen or the strip, exactly', () => {
    assert.match(LES, /label="PRACTICE AGAIN FROM THE START"/);
    assert.match(LES, /doneLabel = 'DONE · BACK TO LABS'/);
    assert.doesNotMatch(endEl, /doneLabel=/, 'PagedLab keeps the default DONE label');
    assert.match(LES, /'HIDE ▴' : 'REVIEW ▾'/);
    assert.match(NAVPURE, /prev: '‹ PREV'/);
    assert.match(NAVPURE, /whatsLeft: "WHAT'S LEFT"/);
    assert.match(PAGED, /reset: \{ label: 'START OVER \(PRACTICE\)', run: confirmReset \}/);
    for (const label of ['PRACTICE AGAIN FROM THE START', 'DONE · BACK TO LABS', 'REVIEW ▾', 'HIDE ▴', '‹ PREV', 'START OVER (PRACTICE)', 'WHAT’S LEFT readout opens CONTENTS']) {
      assert.ok(ET.includes(label), `the end guide never names "${label}"`);
    }
  });
  it('what each control does: row → that page; PRACTICE AGAIN → page 1, clears nothing; DONE → one screen back; ‹ PREV → the page you came from', () => {
    assert.match(endEl, /onJump=\{\(id\) => goTo\(Number\(id\)\)\}/);
    assert.match(endEl, /onPracticeAgain=\{\(\) => goTo\(0\)\}/);
    assert.match(endEl, /onDone=\{\(\) => safeGoBack\(navigation\)\}/);
    assert.match(NAV, /if \(ending\) \{\s*unEnd\(\);\s*return;\s*\}/, '‹ PREV on the end screen leaves it back to the page');
    assert.match(PAGED, /const unEnd = useCallback\(\(\) => setEnding\(false\), \[\]\);/, 'page index untouched');
    assert.match(NAVBAR, /onPress=\{nav\.prev\}/);
    assert.match(ET, /PRACTICE AGAIN FROM THE START opens page 1 and clears nothing/);
    assert.match(ET, /DONE · BACK TO LABS leaves the lab, back to the screen you opened it from/);
  });
  it('the credit rule: NEXT / FINISH tick only the three pages without manualDone; every other page ticks itself', () => {
    const defs = PAGE_FILES.flatMap((f) =>
      [...code(f).matchAll(/\{ title: '((?:[^'\\]|\\.)*)', short: [^\n]*\}/g)].map((m) => ({ title: m[1], manual: /manualDone: true/.test(m[0]) })),
    );
    assert.equal(defs.length, 23);
    assert.deepEqual(
      defs.filter((d) => !d.manual).map((d) => d.title),
      ['Signal falls downhill', 'One pair, two pictures', 'The four questions, answered'],
    );
    // …which are pages 1, 2 and 13 — and none of them is the last page, so
    // FINISH (shown only on p23, a manualDone page) ticks nothing.
    const idx = defs.map((d, i) => (d.manual ? -1 : i + 1)).filter((n) => n > 0);
    assert.deepEqual(idx, [1, 2, 13]);
    assert.ok(defs[defs.length - 1].manual, 'the last page (FINISH) marks itself');
    assert.match(NAV, /if \(index >= last\) \{\s*finish\(\);/);
    assert.match(ET, /Three pages count as soon as you leave them with NEXT: page 1, page 2 and page 13\./);
    assert.doesNotMatch(ET, /leave them with NEXT or FINISH/);
    assert.match(ET, /NEXT \(FINISH on the last page\) still moves on, but the page stays listed/);
    assert.match(ET, /pages 1, 2 and 13 count once you leave them with NEXT/);
    assert.match(PAGED, /if \(!pagesWithCheck\[from\]\?\.manualDone\) markDone\(\);/);
    // A page counts by its device tick OR its banked p<n> credit unit.
    assert.match(PAGED, /\(!!creditLabKey && bankedPages\.has\(`p\$\{i \+ 1\}`\)\)/);
    assert.match(SCREEN, /markLabUnit\(PATCHBAY_LAB_KEY, `p\$\{index \+ 1\}`\)/);
  });
  it('START OVER (PRACTICE): last row of CONTENTS, asks first, page 1; banked pages keep their ✓', () => {
    assert.match(PAGED, /Credit you have already earned stays\./);
    assert.match(PAGED, /confirmDialog\('Start a fresh practice run\?'/);
    assert.match(PAGED, /setEnding\(false\);\s*setPage\(0\);/);
    assert.match(NAVBAR, /\{NAV\.whatsLeft\} ›<\/Text>[\s\S]*?\{nav\.reset \?/, 'the reset row is the last row of CONTENTS');
    assert.match(ET, /START OVER \(PRACTICE\), last in CONTENTS, asks first, then starts again from page 1\. Pages already credited keep their ✓\./);
  });
  it('YOUR PROGRESS when saved progress cannot be read; every row still opens', () => {
    assert.match(LES, /const title = unreadable \? 'YOUR PROGRESS'/);
    assert.match(endEl, /unreadable=\{unreadable\}/);
    assert.match(ET, /the title reads YOUR PROGRESS and every page can still be opened/);
  });
  it('TRY THIS holds on every face: LAB COMPLETE lists nothing; REVIEW ▾ only once a page is done', () => {
    assert.match(LES, /\{w\.left\.length > 0 \?/);
    assert.match(LES, /\{w\.credited\.length > 0 \?/);
    assert.match(END.tryThis[0], /^A page still listed\?/);
    assert.match(END.tryThis[1], /^Something on the ✓ line\?/);
    assert.doesNotMatch(ET, /keeps its credit/);
  });
});
