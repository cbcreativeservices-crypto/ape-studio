/**
 * Screen Guide rollout — Cable & Connector Fundamentals + Audio Connectors &
 * Cable Selection (2026-10-31, after the Wave Physics pilot) — receipts.
 *
 *   1. every screen the learner reaches has a guide: the Cable lab's 12
 *      lesson steps (keyed by CableLessonId) and the Connector lab's 16
 *      pages (CONNECTOR_SELECT_PAGES, in PagedLab order — pinned against the
 *      PageDef titles in pagesA–D); five sections, 1–5 bullets, 2–3 TRY THIS;
 *   2. every step fits its no-scroll budget (SCREEN_GUIDE_BUDGET);
 *   3. house copy rules: knowledge not skills, no "N of total", "suggest"
 *      not "recommend", no build notes, no gear brand names;
 *   4. each guide quotes its screen's REAL names — every name pinned here is
 *      in both the guide and that lab's source (rename one → update both);
 *   5. the numbers TRY THIS quotes are the ones the data produces;
 *   6. wiring: CableLabScreen passes the per-lesson guide to LabHeader inside
 *      a regions-off ScreenGuideHost; ConnectorSelect passes pageGuide AND
 *      endGuide (the what's-left screen, WHERE YOU ARE) — its facts (title
 *      states, button labels, credit mode, what makes a page count, where
 *      DONE goes) pinned against PagedLab / LabEndScreen / labEnd / bits;
 *   7. the ACCURACY CHIP decision: both are CONCEPT labs (nothing measured;
 *      the Cable lab's tester is labelled a simulation, the Connector lab's is
 *      a drawn tester with lamps) — the chip / note is gone.
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
const code = (p: string) =>
  read(p)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { CABLE_LESSONS } = await import('../src/screens/lab/cable/data/lessons.ts');
const { CABLE_SCREEN_GUIDES } = await import('../src/screens/lab/cable/cableScreenGuides.ts');
const { CONNECTOR_SELECT_PAGES, CONNECTOR_SELECT_SCREEN_GUIDES, CONNECTOR_SELECT_END_GUIDE, connectorSelectPageGuide } = await import(
  '../src/screens/lab/connectorselect/connectorSelectScreenGuides.ts'
);
const { CONNECTOR_SELECT_PAGE_COUNT } = await import('../src/screens/lab/connectorselect/units.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const CABLE = CABLE_SCREEN_GUIDES as unknown as Record<string, Guide>;
const CONN = CONNECTOR_SELECT_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides: [string, Guide][] = [
  ...Object.entries(CABLE).map(([k, v]) => [`cable.${k}`, v] as [string, Guide]),
  ...Object.entries(CONN).map(([k, v]) => [`connector.${k}`, v] as [string, Guide]),
  ['connector.END', CONNECTOR_SELECT_END_GUIDE as unknown as Guide],
];
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');

const CABLE_DIR = 'src/screens/lab/cable';
const CONN_DIR = 'src/screens/lab/connectorselect';
const CABLE_SRC = [
  'CableLabScreen.tsx',
  'lessons/bits.tsx',
  'lessons/connectorCard.tsx',
  ...Array.from({ length: 12 }, (_, i) => `lessons/lesson${String(i + 1).padStart(2, '0')}.tsx`),
  'data/lessons.ts',
  ...['01', '02', '03', '04', '05', '06', '07', '08', '09', '11', '12'].map((n) => `data/lesson${n}.ts`),
  'data/testerCables.ts',
  'data/connectors.analog.ts',
  'data/connectors.digital.ts',
  'data/connectors.power.ts',
  'data/connectors.speaker.ts',
  '../kit/ExpandableFigure.tsx',
]
  .map((f) => code(`${CABLE_DIR}/${f}`))
  .join('\n');
const CONN_SRC = [
  'pagesA.tsx',
  'pagesB.tsx',
  'pagesC.tsx',
  'pagesD.tsx',
  'bits.tsx',
  'labels.ts',
  'data/roster.ts',
  'data/jobs.ts',
  'data/practice.ts',
  'data/scenarios.ts',
  'data/assessment.ts',
  'engine/tester.ts',
  'engine/evaluate.ts',
  '../cable/data/connectors.analog.ts',
  '../cable/data/connectors.speaker.ts',
]
  .map((f) => code(`${CONN_DIR}/${f}`))
  .join('\n');

describe('1. every screen of both labs has a complete guide', () => {
  it('Cable: one guide per lesson step — and none for a step that does not exist', () => {
    const ids = CABLE_LESSONS.map((l: { id: string }) => l.id).sort();
    assert.equal(ids.length, 12, '9 lessons + tester + challenge + final check');
    assert.deepEqual(Object.keys(CABLE).sort(), ids);
  });
  it('Connector: one entry per page, in PagedLab order, titles verbatim from pagesA–D', () => {
    const titles = ['pagesA.tsx', 'pagesB.tsx', 'pagesC.tsx', 'pagesD.tsx'].flatMap((f) => {
      const src = code(`${CONN_DIR}/${f}`);
      const defs = src.slice(src.indexOf(': PageDef[] = ['));
      return [...defs.matchAll(/\{ title: '([^']+)', short:/g)].map((m) => m[1]);
    });
    assert.equal(titles.length, CONNECTOR_SELECT_PAGE_COUNT);
    assert.deepEqual(
      CONNECTOR_SELECT_PAGES.map((p: { title: string }) => p.title),
      titles,
    );
    assert.deepEqual(Object.keys(CONN).sort(), CONNECTOR_SELECT_PAGES.map((p: { id: string }) => p.id).sort());
  });
  it('connectorSelectPageGuide maps every page index to its guide, and nothing past the end', () => {
    CONNECTOR_SELECT_PAGES.forEach((p: { id: string }, i: number) => assert.equal(connectorSelectPageGuide(i), CONN[p.id]));
    assert.equal(connectorSelectPageGuide(CONNECTOR_SELECT_PAGE_COUNT), undefined);
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, none empty; TRY THIS 2–3`, () => {
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
});

describe('2. every step fits its no-scroll budget', () => {
  it('low ≤ 410, high ≤ 700, one TRY THIS item ≤ 200 — on every screen', () => {
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
    assert.deepEqual(over, [], 'tighten the wording (keep it accurate) — a step must not need scrolling');
  });
});

describe('3. house copy rules', () => {
  it('knowledge not skills, no "N of total", no "recommend", no build notes, no gear brand names', () => {
    for (const [id, gd] of allGuides) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*\d+\s+(UNITS|SOLVED|CLEARED)/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|ART SLOT|owner 20\d\d)\b/i, `${id}: a build note in learner text`);
      // The labs themselves say "-style" for these product families; the
      // guides describe them instead (no maker or product names).
      assert.doesNotMatch(t, /speakon|ethercon|powercon|opticalcon|neutrik|socapex|\bdante\b|aes50/i, `${id}: a gear brand name`);
    }
  });
});

describe('4. each guide quotes its screen’s real names', () => {
  const CABLE_NAMES: Record<string, string[]> = {
    l01_what_travels: ['WHAT CAN TRAVEL THROUGH A CABLE?', 'MIC-LEVEL AUDIO', 'POWER + DATA TOGETHER', 'WHAT MUST TRAVEL HERE?', 'NEXT PAIR ›', 'FINISH CHECK ✓', 'LOUDSPEAKER-LEVEL AUDIO'],
    l02_anatomy: ['THE CONNECTOR, PART BY PART', 'INSIDE THE CABLE', 'CABLE JACKET', 'FIBER CORE & CLADDING', 'SEVEN CONSTRUCTIONS', 'BALANCED PAIR', 'PEEL THE FIRST LAYER ›', 'PEEL DEEPER ›', 'FULLY PEELED — WHAT YOU CANNOT SEE FROM OUTSIDE', 'DIELECTRIC', 'CENTER CONDUCTOR', 'TWISTED PAIR'],
    l03_analog: ['THE ANALOG FAMILY', 'PINOUT INK KEY', 'WHY THIS ONE MATTERS', 'CONTACTS & USES', 'INSPECT & TEST', 'BALANCED VS UNBALANCED', 'ALSO RECOGNIZE', '3-PIN XLR', '3.5 MM TRRS', 'COMBO XLR/TRS', 'STANDARD', 'CONVENTION', 'EQUIPMENT-DEPENDENT', 'FULL SCREEN', 'CTIA/AHJ', 'OMTP'],
    l04_same_plug: ['THE PLUG BOTH CABLES WEAR', 'WHY THEY LOOK ALIKE', 'Interchangeable?', 'IT DEPENDS', 'THE HONEST RESULT OF CHOOSING WRONG', 'NEXT LOOK-ALIKE ›', 'One way only'],
    l05_loudspeaker: ['THE FOUR DIFFERENT CONNECTIONS', 'WHAT TRAVELS', 'CONNECTORS THAT SERVE IT', 'THE LOUDSPEAKER CONNECTORS', 'BINDING POST', 'BANANA PLUG', 'BARE WIRE', 'LEGACY 1/4-INCH TS', 'INSTRUMENT CABLE VS LOUDSPEAKER CABLE', 'SAME PLUG — DIFFERENT CABLE', 'ROUTING PICKS', 'NEXT SCENARIO ›', 'Passive loudspeaker (full-range)'],
    l06_digital: ['THE CONNECTORS — BROWSE ALL TEN', 'WHAT THE CARDS TEACH', 'USB — THE PLUG DOES NOT DEFINE THE CABLE', 'MIDI — INSTRUCTIONS, NOT AUDIO', 'ETHERNET — ONE PLUG, MANY SYSTEMS', 'COAX & OPTICAL', 'AV & CONTROL', 'USB MICRO-B', 'ETHERNET 8P8C', 'MIDI DIN-5', 'CONNECTING IT', 'CABLE BEHIND IT'],
    l07_power: ['TWO KINDS OF POWER', 'AC POWER', 'LOW-VOLTAGE DC', 'THREE CONDUCTORS, THREE ROLES', 'NEMA 5-15', 'POWER CONNECTOR BROWSER · 10 CONNECTORS', 'THE NEVER LIST', 'RECOGNIZE — NEVER HANDLE', 'WALL & IEC', 'DC & NEGOTIATED', 'DC BARREL', 'NEMA TWIST-LOCK', 'STAGE PIN', 'CAM FEEDER', 'MULTICIRCUIT', 'Safety ground'],
    l08_selection: ['FOURTEEN CONNECTIONS TO CABLE', 'MIC → MIXER', 'DC SUPPLY → DEVICE', 'DECISION', 'NEXT DECISION ›', 'SOLVE CONNECTION ✓', 'NEXT CONNECTION ›', 'NOTHING — XLR IS HOT-SAFE', 'GUITAR → DI', 'YES — THE PLUGS MATCH', 'MIXER → POWERED SPKR'],
    l09_handling: ['CORRECT PRACTICES', 'GRIP THE BODY', 'DEFECTIVE = OUT', 'THE INSPECTION EYE', 'THE INSPECTION SCENE', 'FAULT', 'NEXT ITEM ›', 'FINISH INSPECTION ✓', 'COIL OVER-UNDER', 'NO KNOTS, NO TIGHT BENDS', 'SIGNAL APART FROM AC POWER'],
    l10_tester: ['VIRTUAL CABLE TESTER', 'INSIDE THE CABLE', 'PATH', 'EXPECTED', 'MEASURED', 'FAULT', 'NETWORK', 'POWER', 'CONNECT BOTH ENDS ›', 'RUN TEST ›', 'NAME THE FAULT', 'DECIDE THE DISPOSITION', 'PASSES — RETURN TO SERVICE', 'RELABEL IT AND KEEP USING IT', 'REPAIR (QUALIFIED PERSON), THEN RETEST', 'REMOVE FROM SERVICE', 'PRACTICE AGAIN ↻', 'Round → GROUND', 'Pin 2 → Pin 3', 'DROPS ON FLEX', 'SPLIT'],
    l11_challenge: ['TWO SYSTEMS TO CABLE, END TO END', 'SHOW A', 'STUDIO B', 'SIGNAL PATH', 'POWER-UP SEQUENCE', 'FAULT HUNT', 'DATA & CONTROL', 'WHAT TRAVELS HERE?', 'NEXT CONNECTION ›', 'FINISH STAGE ✓', 'CONFIRM ORDER', 'NAME WHY IT FAILS', 'WHICH WAY AROUND?', 'Powered main loudspeakers'],
    l12_final: ['LAB PROGRESS', 'WHAT’S LEFT', 'LAB COMPLETE', 'GENERAL', 'CRITICAL SAFETY', 'REVIEW CONNECTORS ›', 'RETRY FINAL CHALLENGE ›'],
  };
  const CONN_NAMES: Record<string, string[]> = {
    threeThings: ['STATION 1 · CONNECTOR, CABLE AND SIGNAL', 'THE CENTRAL LESSON', 'THE EXPLODED CABLE', 'Cable connector (plug)', 'Strain relief', 'Outer jacket', 'ASK THESE FOUR QUESTIONS — EVERY TIME, FOREVER', '1 · Does it physically fit?'],
    samePlug: ['STATION 1 · THE SAME PLUG, TWO JOBS', 'BALANCED MONO', 'STEREO PHONES', 'Right channel', 'The number of contacts on the plug', 'ASSIGNMENT'],
    benchAnalog: ['STATION 2 · IDENTIFICATION BENCH — ANALOG', 'FIND A CONNECTOR — ALL FAMILIES', 'ALSO CALLED', 'CONTACTS', 'MAY CARRY', 'TYPICALLY FROM', 'TYPICALLY INTO', 'RETENTION', 'MOST COMMON MISTAKE', 'SAFETY', 'aux'],
    benchSpeaker: ['STATION 2 · IDENTIFICATION BENCH — LOUDSPEAKER', 'THE FAMILY RULE', 'MOST COMMON MISTAKE', 'OFF'],
    benchDigital: ['STATION 2 · IDENTIFICATION BENCH — DIGITAL, DATA & MIDI', 'Open four cards', 'Open the MIDI card', 'MIDI DATA — NOT AUDIO', 'Control data'],
    jobsMatrix: ['STATION 3 · SAME CONNECTOR, DIFFERENT JOB', 'FAMILIES — SWIPE →', 'CHECK MY MARKS', 'TRY AGAIN', 'REAL JOB', 'NOT A JOB', '3-pin XLR', '1/4-inch TRS', 'HDMI'],
    declare: ['STATION 3 · DECLARE BEFORE YOU CONNECT', 'AES OUT', 'Analog microphone signal', 'COAXIAL DIGITAL OUT', 'Any RCA interconnect that fits', 'CH 5 INSERT', 'COMPATIBLE', 'LABEL'],
    inside: ['STATION 4 · WHAT IS INSIDE THE CABLE', 'CONSTRUCTIONS — SWIPE →', 'THE CUT END, ON THE BENCH', 'BUILT FOR', 'THE REQUIRED COMPARISON', 'Balanced shielded twisted pair', 'Heavy-gauge speaker cable', '75-ohm coaxial digital cable', 'A continuity test across both ends'],
    buildStage: ['STATION 5 · BUILD THE SYSTEM — STAGE BASICS', '1 · Physically fits', '2 · Signal the equipment expects', '3 · Cable construction correct', '4 · Connection safe', 'CORRECT CABLE', 'UNVERIFIED', 'WRONG SIGNAL LEVEL', 'DOES NOT FIT', 'FITS — BUT VERIFY', 'TWO OUTPUTS JOINED', '1/4-inch TS instrument cable', 'XLR-shell lighting/data cable'],
    buildMonitors: ['STATION 5 · BUILD THE SYSTEM — MONITORS & POWER', 'SPEAKER OUTPUT INTO AN INPUT', 'WRONG CABLE CONSTRUCTION', 'mixer LINE INPUT', 'Headphones vs headset'],
    buildSources: ['STATION 5 · BUILD THE SYSTEM — SOURCES & DATA', 'PROTOCOL MISMATCH', 'CD/LINE', 'PHONO', 'non-ARC', 'charge-only USB-C cable'],
    tester: ['STATION 6 · THE CABLE TESTER', 'ON THE BENCH', 'END A', 'END B', 'FLEX THE CABLE', 'INSPECT', 'RESEAT PLUG', 'LIT', 'DARK', 'FLICKERING', 'LOCKED', 'dead-vocal', 'borrowed-gear', 'crackling'],
    faultFinder: ['STATION 6 · FAULT FINDER', 'PASS', 'FLICKERING', 'RESEAT PLUG', 'INSTRUMENT CABLE', 'Headphone extension', 'dead stage drop', 'amp-to-cabinet', 'L·C', 'R·S'],
    safety: ['STATION 7 · SAFETY & PROFESSIONAL PRACTICE', 'COILING & ROUTING LIVE NEXT DOOR', 'I WILL WORK THIS WAY', 'ACKNOWLEDGED', 'OPEN CABLE DRESSING & INSTALLATION', 'Acknowledge all 9 rules', 'LAST', 'FIRST'],
    myths: ['THE MISCONCEPTIONS CHALLENGE', 'TRUE', 'FALSE', 'Bust all 9 myths', 'MIDI cables carry musical audio', 'Balanced means stereo'],
    final: ['FINAL · YOU’RE ON THE JOB', 'SAFETY-CRITICAL', 'CLOCK IN — DRAW MY 12', 'TURN IN THE JOB SHEET', 'NEW ATTEMPT — FRESH DRAW', 'RUN IT AGAIN ANYWAY', 'NOT YET'],
  };
  it('a name list for every screen of both labs', () => {
    assert.deepEqual(Object.keys(CABLE_NAMES).sort(), Object.keys(CABLE).sort());
    assert.deepEqual(Object.keys(CONN_NAMES).sort(), Object.keys(CONN).sort());
  });
  const pairs: [string, string[], Guide, string][] = [
    ...Object.entries(CABLE_NAMES).map(([id, n]) => [`cable.${id}`, n, CABLE[id], CABLE_SRC] as [string, string[], Guide, string]),
    ...Object.entries(CONN_NAMES).map(([id, n]) => [`connector.${id}`, n, CONN[id], CONN_SRC] as [string, string[], Guide, string]),
  ];
  for (const [id, names, gd, src] of pairs) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(gd);
      for (const n of names) {
        assert.ok(src.includes(n), `${id}: "${n}" is no longer in the lab source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
});

describe('5. the outcomes TRY THIS quotes are the ones the data produces', () => {
  it('Cable lesson 2: BALANCED PAIR peels in four layers, SPEAKER in three with no shield', async () => {
    const { CROSS_SECTIONS } = await import('../src/screens/lab/cable/data/lesson02.ts');
    const by = (id: string) => CROSS_SECTIONS.find((c: { id: string }) => c.id === id).layers.map((l: { name: string }) => l.name);
    assert.deepEqual(by('balanced_shielded'), ['JACKET', 'SHIELD', 'INSULATION', 'TWISTED PAIR']);
    assert.equal(by('speaker_2c').length, 3);
    assert.ok(!by('speaker_2c').includes('SHIELD'));
    assert.deepEqual(by('coax'), ['JACKET', 'SHIELD', 'DIELECTRIC', 'CENTER CONDUCTOR']);
  });
  it('Cable lessons 1 and 5: the verdicts quoted for the fixed pair / scenario order', async () => {
    const { CARRY_PAIRS } = await import('../src/screens/lab/cable/data/lesson01.ts');
    const mp = CARRY_PAIRS.find((p: { from: string; to: string }) => p.from === 'Mixer' && p.to === 'Powered loudspeaker');
    assert.equal(mp.correct, 'line_level');
    assert.ok(!(mp.accept ?? []).includes('speaker_level'));
    const ic = CARRY_PAIRS.find((p: { from: string }) => p.from === 'Audio interface');
    assert.equal(ic.correct, 'digital_audio');
    assert.deepEqual(ic.accept, ['hybrid_power_data']);
    assert.equal(CARRY_PAIRS.length, 9);
    const { ROUTING_SCENARIOS } = await import('../src/screens/lab/cable/data/lesson05.ts');
    assert.equal(ROUTING_SCENARIOS.length, 5);
    const ap = ROUTING_SCENARIOS.find((r: { id: string }) => r.id === 'amp_passive');
    assert.equal(ap.correct, 'nl2_lead');
    assert.deepEqual(ap.accept, ['nl4_full']);
    const mx = ROUTING_SCENARIOS[0];
    assert.equal(mx.to, 'Powered loudspeaker');
    assert.equal(mx.correct, 'line_xlr');
    assert.ok(!(mx.accept ?? []).length, 'a SPEAKER LEVEL pick is plainly wrong here');
    assert.ok(ap.correct !== 'inst_cable' && !ap.accept.includes('inst_cable'), 'the INSTRUMENT pick is wrong on amp → passive');
    assert.match(ap.wrongHint, /two heavier unshielded conductors, not a shielded signal cable/);
  });
  it('Cable lesson 4: ten pairs; TS instrument vs speaker is NO; exactly two are IT DEPENDS (TRS jobs, optical formats)', async () => {
    const { PLUG_COMPARISONS } = await import('../src/screens/lab/cable/data/lesson04.ts');
    assert.equal(PLUG_COMPARISONS.length, 10);
    assert.equal(PLUG_COMPARISONS[0].id, 'ts_instrument_vs_speaker');
    assert.equal(PLUG_COMPARISONS[0].answer, 'no');
    assert.deepEqual(
      PLUG_COMPARISONS.filter((c: { answer: string }) => c.answer === 'depends').map((c: { id: string }) => c.id),
      ['trs_three_jobs', 'toslink_spdif_vs_adat'],
    );
    assert.match(PLUG_COMPARISONS.find((c: { id: string }) => c.id === 'xlr_analog_vs_aes3').oneWay, /^One way only/);
  });
  it('Cable lessons 8, 9 and 12: fixed orders and counts', async () => {
    const { SELECTION_SCENARIOS } = await import('../src/screens/lab/cable/data/lesson08.ts');
    assert.equal(SELECTION_SCENARIOS.length, 14);
    // TRY THIS quotes a WRONG pick on these credit steps (never the key).
    const mic = SELECTION_SCENARIOS.find((s: { chip: string }) => s.chip === 'MIC → MIXER');
    assert.ok(mic.steps.at(-1).options.includes('NOTHING — XLR IS HOT-SAFE'));
    assert.notEqual(mic.steps.at(-1).correct, 'NOTHING — XLR IS HOT-SAFE');
    assert.match(mic.steps.at(-1).hint, /pops/);
    assert.match(mic.steps.at(-1).hint, /phantom power has its own extra rule/);
    const gtr = SELECTION_SCENARIOS.find((s: { chip: string }) => s.chip === 'GUITAR → DI');
    assert.ok(gtr.steps.at(-1).options.includes('YES — THE PLUGS MATCH'));
    assert.notEqual(gtr.steps.at(-1).correct, 'YES — THE PLUGS MATCH');
    assert.match(gtr.steps.at(-1).hint, /missing shield/);
    const { SCENE_ITEMS, HANDLING_PRACTICES } = await import('../src/screens/lab/cable/data/lesson09.ts');
    assert.equal(SCENE_ITEMS.length, 12);
    assert.equal(HANDLING_PRACTICES.length, 12);
    assert.equal(SCENE_ITEMS[1].answer, 'ok', 'the second scene item (two-pole cord) is OK');
    const { FINAL_QUESTIONS, SAFETY_QUESTIONS } = await import('../src/screens/lab/cable/data/lesson12.ts');
    assert.equal(FINAL_QUESTIONS.length, 10);
    assert.equal(SAFETY_QUESTIONS.length, 7);
  });
  it('Cable tester: A passes, B is pins 2/3 reversed (repair), H has an open earth (remove)', async () => {
    const { TESTER_CABLES } = await import('../src/screens/lab/cable/data/testerCables.ts');
    assert.equal(TESTER_CABLES.length, 8);
    const c = (chip: string) => TESTER_CABLES.find((t: { chip: string }) => t.chip === chip);
    const a = c('CABLE A');
    assert.equal(a.faultId, 'no_fault');
    assert.equal(a.disposition, 'requalify');
    assert.deepEqual(a.actualMap, a.expectedMap);
    const b = c('CABLE B');
    const bm = Object.fromEntries(b.actualMap.map((r: { path: string; value: string }) => [r.path, r.value]));
    assert.equal(bm['Pin 2 → Pin 2'], 'OPEN');
    assert.equal(bm['Pin 2 → Pin 3'], 'CLOSED');
    assert.equal(b.disposition, 'repair_qualified');
    const h = c('CABLE H');
    const hm = Object.fromEntries(h.actualMap.map((r: { path: string; value: string }) => [r.path, r.value]));
    assert.equal(hm['Round → GROUND'], 'OPEN');
    assert.equal(h.disposition, 'remove');
  });
  it('Connector tester + fault finder: the lamps quoted are lampFor’s answers', async () => {
    const { FAULTS, lampFor } = await import('../src/screens/lab/connectorselect/engine/tester.ts');
    const f = (id: string) => FAULTS.find((x: { id: string }) => x.id === id);
    assert.deepEqual(FAULTS.slice(0, 4).map((x: { id: string }) => x.id), ['open_hot', 'short_tip_ring', 'shield_open', 'pins_23_reversed']);
    assert.equal(lampFor(f('open_hot'), 1, 1, false, false), 'dark');
    assert.equal(lampFor(f('open_hot'), 0, 0, false, false), 'lit');
    assert.equal(lampFor(f('pins_23_reversed'), 1, 1, false, false), 'dark');
    assert.equal(lampFor(f('pins_23_reversed'), 1, 2, false, false), 'lit');
    assert.equal(lampFor(f('short_tip_ring'), 0, 1, false, false), 'lit');
    assert.equal(lampFor(f('short_tip_ring'), 0, 0, false, false), 'lit', 'T to T is LIT too');
    assert.equal(lampFor(f('open_hot'), 2, 2, false, false), 'lit', '3 to 3 is LIT');
    assert.equal(lampFor(f('pins_23_reversed'), 2, 1, false, false), 'lit', '3 to 2 is LIT');
    // A dark straight pair is not always a break: the swapped cables read dark too.
    assert.equal(lampFor(f('lr_reversed'), 0, 0, false, false), 'dark');
    assert.equal(lampFor(f('lr_reversed'), 0, 2, false, false), 'lit');
    assert.equal(FAULTS.slice(4).length, 5);
    assert.equal(lampFor(f('intermittent'), 0, 0, false, false), 'lit');
    assert.equal(lampFor(f('intermittent'), 0, 0, true, false), 'flicker');
    assert.equal(lampFor(f('intermittent'), 0, 1, false, false), 'dark', 'only the STRAIGHT paths are lit at rest');
    assert.equal(lampFor(f('wrong_type'), 1, 2, false, false), 'lit', 'TS sleeve spans ring + sleeve: they read joined');
    assert.match(f('wrong_type').inspect, /not a fault/);
    for (let i = 0; i < 3; i++) assert.equal(lampFor(f('wrong_type'), i, i, false, false), 'lit');
    assert.equal(lampFor(f('not_seated'), 0, 0, false, false), 'dark');
    assert.equal(lampFor(f('not_seated'), 0, 0, false, true), 'lit');
    assert.match(f('wrong_type').inspect, /INSTRUMENT CABLE/);
  });
  it('Connector build pages: the verdict labels quoted come out of evaluateChoice', async () => {
    const { SCENARIOS } = await import('../src/screens/lab/connectorselect/data/scenarios.ts');
    const { evaluateChoice } = await import('../src/screens/lab/connectorselect/engine/evaluate.ts');
    const v = (title: string, name: RegExp) => {
      const s = SCENARIOS.find((x: { title: string }) => x.title === title);
      assert.ok(s, title);
      return evaluateChoice(s.choices.find((c: { name: string }) => name.test(c.name)));
    };
    const ts = v('Dynamic microphone → mixer', /^1\/4-inch TS instrument cable$/);
    assert.equal(ts.label, 'DOES NOT FIT');
    assert.equal(ts.unverified, true);
    assert.equal(v('Dynamic microphone → mixer', /lighting\/data/).label, 'FITS — BUT VERIFY');
    const y = v('Stereo keyboard → two mixer inputs', /^One Y-cable/);
    assert.equal(y.label, 'TWO OUTPUTS JOINED');
    assert.equal(y.signal, false);
    assert.equal(y.safe, false);
    assert.equal(v('Power amplifier → passive loudspeaker', /mixer LINE INPUT/).label, 'SPEAKER OUTPUT INTO AN INPUT');
    const inst = v('Power amplifier → passive loudspeaker', /instrument cable with adapters/);
    assert.equal(inst.label, 'WRONG CABLE CONSTRUCTION');
    assert.equal(inst.safe, false);
    assert.equal(v('Turntable → phono input', /CD\/LINE/).label, 'WRONG SIGNAL LEVEL');
    assert.equal(v('Television → receiver / soundbar', /non-ARC/).label, 'PROTOCOL MISMATCH');
    assert.equal(v('Computer → USB audio interface', /charge-only/).label, 'FITS — BUT VERIFY');
    // Page slices: 4 scenarios per build page, in this order.
    assert.deepEqual(SCENARIOS.slice(0, 4).map((s: { title: string }) => s.title)[0], 'Dynamic microphone → mixer');
    assert.equal(SCENARIOS.slice(4, 8).map((s: { title: string }) => s.title).includes('Power amplifier → passive loudspeaker'), true);
    assert.equal(SCENARIOS.slice(8, 12).map((s: { title: string }) => s.title).includes('Turntable → phono input'), true);
  });
  it('Connector final: 12 drawn, 80% bar — ten right is 83% (pass), nine is 75% (not yet)', async () => {
    const { PASS_PCT, DRAW_SIZE } = await import('../src/screens/lab/connectorselect/data/assessment.ts');
    assert.equal(PASS_PCT, 80);
    assert.equal(DRAW_SIZE, 12);
    assert.equal(Math.round((10 / 12) * 100), 83);
    assert.equal(Math.round((9 / 12) * 100), 75);
    const t = textOf(CONN.final);
    for (const s of ['80%', '83%', '75%', 'twelve']) assert.ok(t.includes(s), s);
  });
  it('Connector counts quoted: 8 parts, 8 families, 8 constructions, 9 rules, 9 myths', async () => {
    const { CABLE_PARTS, FOUR_QUESTIONS } = await import('../src/screens/lab/connectorselect/data/roster.ts');
    const { JOB_MATRIX } = await import('../src/screens/lab/connectorselect/data/jobs.ts');
    const { CROSS_SECTIONS, SAFETY_RULES, MISCONCEPTIONS } = await import('../src/screens/lab/connectorselect/data/practice.ts');
    assert.equal(CABLE_PARTS.length, 8);
    assert.equal(FOUR_QUESTIONS.length, 4);
    assert.equal(JOB_MATRIX.length, 8);
    assert.equal(CROSS_SECTIONS.length, 8);
    assert.equal(SAFETY_RULES.length, 9);
    assert.equal(MISCONCEPTIONS.length, 9);
    assert.ok(MISCONCEPTIONS.every((m: { answer: boolean }) => m.answer === false), 'every claim is a myth, so FALSE resolves it');
  });
});

describe('6. wiring', () => {
  const CL = code(`${CABLE_DIR}/CableLabScreen.tsx`);
  const CS = code(`${CONN_DIR}/ConnectorSelectLabScreen.tsx`);
  it('CableLabScreen: the per-lesson guide on LabHeader, inside a regions-off host reset per lesson', () => {
    assert.match(CL, /import \{ ScreenGuideHost \} from '\.\.\/\.\.\/\.\.\/features\/lab\/screenGuide';/);
    assert.match(CL, /import \{ CABLE_SCREEN_GUIDES \} from '\.\/cableScreenGuides';/);
    assert.match(CL, /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 10 \}\]\}>\s*<ScreenGuideHost regions=\{false\} resetKey=\{s\.id\}>\s*<LabHeader/);
    assert.match(CL, /<LabHeader[\s\S]*?guide=\{CABLE_SCREEN_GUIDES\[s\.id\]\}\s*guideTitle=\{s\.title\}\s*\/>/);
    assert.match(CL, /<\/ScrollView>\s*<\/ScreenGuideHost>\s*<\/View>\s*<\/LabNavProvider>/);
  });
  it('ConnectorSelectLabScreen: PagedLab gets pageGuide (its host is built in; no rack pages, so regions stay off)', () => {
    assert.match(CS, /import \{[^}]*\bconnectorSelectPageGuide\b[^}]*\} from '\.\/connectorSelectScreenGuides';/);
    assert.match(CS, /<PagedLab[\s\S]*?pageGuide=\{connectorSelectPageGuide\}[\s\S]*?\/>/);
    for (const f of ['pagesA.tsx', 'pagesB.tsx', 'pagesC.tsx', 'pagesD.tsx']) {
      assert.doesNotMatch(code(`${CONN_DIR}/${f}`), /rack: true/, `${f}: a rack page would need regions`);
    }
    const PL = code('src/screens/lab/kit/PagedLab.tsx');
    assert.match(PL, /const guide = ending \? endGuide : def\.guide \?\? pageGuide\?\.\(page\);/);
    assert.match(PL, /<ScreenGuideHost resetKey=\{ending \? 'end' : String\(page\)\} regions=\{!!def\.rack && !ending\}>/);
  });
  it('ConnectorSelectLabScreen: the what’s-left screen has its own guide — PagedLab gets endGuide (titled WHERE YOU ARE)', () => {
    assert.match(CS, /import \{ CONNECTOR_SELECT_END_GUIDE, connectorSelectPageGuide \} from '\.\/connectorSelectScreenGuides';/);
    assert.match(CS, /<PagedLab[\s\S]*?endGuide=\{CONNECTOR_SELECT_END_GUIDE\}[\s\S]*?\/>/);
    const PL = code('src/screens/lab/kit/PagedLab.tsx');
    assert.match(PL, /guideTitle=\{ending \? 'WHERE YOU ARE' : def\.title\.toUpperCase\(\)\}/);
  });
});

describe('6b. the END guide says only what this lab’s end screen does', () => {
  const CS = code(`${CONN_DIR}/ConnectorSelectLabScreen.tsx`);
  const PL = code('src/screens/lab/kit/PagedLab.tsx');
  const LE = code('src/screens/lab/kit/LabEndScreen.tsx');
  const LJ = code('src/screens/lab/kit/labEnd.ts');
  const NAVSRC = code('src/screens/lab/kit/LabNavBar.tsx') + code('src/screens/lab/kit/labNav.ts') + code('src/screens/lab/kit/useLabNav.ts');
  const T = textOf(CONNECTOR_SELECT_END_GUIDE as unknown as Guide);
  it("title states: WHAT'S LEFT / LAB COMPLETE / YOUR PROGRESS (unreadable) — as labEnd + LabEndScreen draw them", () => {
    assert.match(LJ, /return w\.complete \? 'LAB COMPLETE' : "WHAT'S LEFT";/);
    assert.match(LE, /const title = unreadable \? 'YOUR PROGRESS'/);
    for (const s of ["WHAT'S LEFT", 'LAB COMPLETE', 'YOUR PROGRESS']) assert.ok(T.includes(s), s);
  });
  it('CREDIT mode (rows ✓ CREDITED, ✓ DONE for a guest): this lab passes creditLabKey', () => {
    assert.match(CS, /creditLabKey=\{CONNECTOR_SELECT_LAB_KEY\}/);
    assert.match(PL, /const creditMode: 'credit' \| 'progress' = creditLabKey \|\| pageCreditKeys\.length > 0 \? 'credit' : 'progress';/);
    assert.match(LE, /const tag = mode === 'credit' && !isGuest \? 'CREDITED' : 'DONE';/);
    assert.ok(T.includes('✓ CREDITED') && T.includes('✓ DONE if you’re signed out or in a preview'));
    // isGuest comes from useGuestWording, which is true for a preview too (this
    // lab is members-only with a preview), so a preview's rows read DONE.
    assert.match(LE, /const isGuest = guest \?\? wording\.guest;/);
    assert.match(code('src/features/commercial/tier.ts'), /return isGuestTier\(tier\) && \(tier === 'preview' \|\| tierKnown\);/);
    assert.match(LE, /\{showCredited \? 'HIDE ▴' : 'REVIEW ▾'\}/);
    assert.ok(T.includes('REVIEW ▾'));
  });
  it('noun "page"; no check row (no understanding check authored) and no optional pages', async () => {
    assert.match(PL, /noun="page"/);
    const { understandingFor } = await import('../src/features/lab/understanding.ts');
    assert.equal(understandingFor('connector-select'), null, 'a check would add a CHECK row — update the END guide');
    assert.match(CS, /labId="connector-select"/);
    assert.doesNotMatch(CS, /optionalPage=|handsOnDetail=|pageDetail=|labDoneKey=/);
    assert.doesNotMatch(T, /check row|optional/i, 'no check row and no optional pages: the guide names neither');
    // Rows are page titles, not stations (the misconceptions page and the Final carry no STATION tag).
    assert.doesNotMatch(T, /station/i);
    assert.ok(T.includes('lists, by name, every page you haven’t finished'));
    assert.match(code(`${CONN_DIR}/pagesA.tsx`), /title: 'Connector, cable, signal'/);
    // The line under the title: how much is left + whether the work is saved (every endLead branch).
    assert.match(LE, /<Text style=\{styles\.lead\}>\{endLead\(w, \{ mode, noun, guest: isGuest, preview: inPreview, carry: sessionCarryOpen\(\), account \}\)\}<\/Text>/);
    assert.ok(T.includes('The line under the title says how much is left and if your work is saved'));
    // Unreadable: the note replaces the lead; rows still split by what could be read, so the guide says "still opens", not "listed".
    assert.match(LE, /\{unreadable \? \(\s*<ProgressUnreadableNote \/>/);
    assert.ok(T.includes('a note says why, and every page still opens'));
    assert.doesNotMatch(T, /goals are not all met|stays listed/);
  });
  it('button labels verbatim: PRACTICE AGAIN FROM THE START (page 1, clears nothing), DONE · BACK TO LABS (safeGoBack), ‹ PREV (back to the page)', () => {
    assert.match(LE, /<GlassButton label="PRACTICE AGAIN FROM THE START"/);
    assert.match(LE, /doneLabel = 'DONE · BACK TO LABS'/);
    assert.match(PL, /onPracticeAgain=\{\(\) => goTo\(0\)\}/);
    assert.match(PL, /onDone=\{\(\) => safeGoBack\(navigation\)\}/);
    assert.doesNotMatch(PL, /doneLabel=/, 'PagedLab keeps the default DONE label');
    assert.match(NAVSRC, /prev: '‹ PREV'/);
    assert.match(NAVSRC, /if \(ending\) \{\s*unEnd\(\);\s*return;\s*\}/);
    assert.match(PL, /reset: \{ label: 'START OVER \(PRACTICE\)', run: confirmReset \}/);
    for (const s of [
      'PRACTICE AGAIN FROM THE START opens page 1 and clears nothing',
      'DONE · BACK TO LABS leaves the lab and takes you back to where you opened it',
      '‹ PREV returns you to the page you were on',
      'START OVER (PRACTICE)',
    ])
      assert.ok(T.includes(s), s);
  });
  it('what makes a page count: every page marks ITSELF when all its goal chips tick (NEXT / FINISH never mark it); the Final’s goal is a pass', () => {
    const defLines = ['pagesA.tsx', 'pagesB.tsx', 'pagesC.tsx', 'pagesD.tsx'].flatMap((f) => {
      const src = code(`${CONN_DIR}/${f}`);
      return src
        .slice(src.indexOf(': PageDef[] = ['))
        .split('\n')
        .filter((l) => /\{ title: '/.test(l));
    });
    assert.equal(defLines.length, CONNECTOR_SELECT_PAGE_COUNT);
    for (const l of defLines) assert.match(l, /manualDone: true/, `every page marks itself: ${l}`);
    assert.match(PL, /if \(!pagesWithCheck\[from\]\?\.manualDone\) markDone\(\);/);
    const BITS = code(`${CONN_DIR}/bits.tsx`);
    assert.match(BITS, /const all = seen\.current\.every\(Boolean\);\s*useMarkWhen\(all, \(\) => \{\s*if \(!ctx\.isDone\) ctx\.markDone\(\);/);
    // Goal chips on all 16 pages: four per file, except pagesC, whose three
    // build pages share one makeScenarioPage body (one <GoalChips>) + the tester.
    const chips: Record<string, number> = { 'pagesA.tsx': 4, 'pagesB.tsx': 4, 'pagesC.tsx': 2, 'pagesD.tsx': 4 };
    for (const [f, n] of Object.entries(chips)) {
      assert.equal((code(`${CONN_DIR}/${f}`).match(/<GoalChips /g) ?? []).length, n, `${f}: goal chips`);
    }
    assert.equal((code(`${CONN_DIR}/pagesC.tsx`).match(/= makeScenarioPage\(/g) ?? []).length, 3);
    const PD = code(`${CONN_DIR}/pagesD.tsx`);
    assert.match(PD, /label: `Pass the job: \$\{PASS_PCT\}% \+ every safety call right`, hit: passedOnce/);
    // Goals live in the page's own state + a per-mount ref, and PagedLab swaps the
    // page component on every jump, so a half-done page restarts at ○ next visit.
    assert.match(BITS, /const seen = useRef<boolean\[\]>\(goals\.map\(\(\) => ctx\.isDone\)\);/);
    assert.match(PL, /const Page = def\.Component;/);
    assert.ok(T.includes('all its goal chips read ✓ in one visit. Leave early and they reset to ○. NEXT or FINISH alone doesn’t finish it.'));
    assert.ok(T.includes('The Final counts only after a pass: 80% and every safety call right'));
  });
  it('credit: a done page banks p<n> to the lab key; START OVER clears page marks only, banked credit still counts', () => {
    assert.match(CS, /markLabUnit\(CONNECTOR_SELECT_LAB_KEY, `p\$\{index \+ 1\}`\)/);
    assert.match(PL, /\(!!creditLabKey && bankedPages\.has\(`p\$\{i \+ 1\}`\)\)/);
    assert.match(PL, /if \(banked \|\| progress\?\.completed\.includes\(i\)\) endCleared\.add\(String\(i\)\);/);
    assert.ok(T.includes('START OVER (PRACTICE) in the page list resets goal chips only'));
    // A guest's units are HELD and replayed into the first account signed into this
    // session (when the carry is open — the lead line says which); only a preview earns nothing.
    const LC = code('src/features/lab/labCompletion.ts');
    assert.match(LC, /if \(getLabPreview\(\)\.active\) return;\s*(\/\/[^\n]*\n\s*)*holdSessionWork<HeldUnits>\(CARRY_KEY, [^\n]*\{ guestOnly: true \}\);/);
    assert.match(LJ, /sign in before you close the app to keep your progress/);
    assert.ok(T.includes('Signed out, the line under the title says if signing in can still keep them. A preview saves nothing'));
    assert.doesNotMatch(T, /not when signed out/);
  });
  it("the way in: FINISH on the last page, or WHAT'S LEFT in the contents", () => {
    assert.match(NAVSRC, /finish: 'FINISH ›'/);
    assert.match(NAVSRC, /onPress=\{nav\.openEnd\}/);
    assert.match(NAVSRC, /whatsLeft: "WHAT'S LEFT"/);
  });
});

describe('7. the accuracy chip: both are concept labs, so it is gone', () => {
  it('CableLabScreen renders no AccuracyNote — the ⓘ guide key holds that header spot', () => {
    assert.doesNotMatch(code(`${CABLE_DIR}/CableLabScreen.tsx`), /AccuracyNote/);
  });
  it('ConnectorSelect passes accuracy={false}, which drops PagedLab’s reading-page note and rack chip', () => {
    assert.match(code(`${CONN_DIR}/ConnectorSelectLabScreen.tsx`), /accuracy=\{false\}/);
    const PL = code('src/screens/lab/kit/PagedLab.tsx');
    assert.match(PL, /\{accuracy \? <AccuracyNote style=\{styles\.accuracy\} detail=\{accuracyDetail\} \/> : null\}/);
    assert.match(PL, /right=\{accuracy && def\.rack && !ending \? <AccuracyNote compact/);
  });
  it('why: nothing in either lab is measured — the Cable bench tester is labelled a simulation; the Connector tester is a drawn lamp model', async () => {
    const { SIMULATION_BADGE } = await import('../src/screens/lab/cable/data/testerCables.ts');
    assert.match(SIMULATION_BADGE, /training model, not a live measurement/);
    for (const p of [`${CABLE_DIR}/CableLabScreen.tsx`, `${CONN_DIR}/ConnectorSelectLabScreen.tsx`]) {
      assert.doesNotMatch(code(p), /useMeter|useMicrophone|AudioRecorder|expo-audio/, `${p}: a live input would change the chip decision`);
    }
  });
});
