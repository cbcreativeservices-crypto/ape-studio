/**
 * Beginner waves 1-3, 2026-11-15 — group F9 (the Labs menu, Microphone
 * Selection Lab, the Miking Labs). Owner, 2026-11-15: "build waves 1 thru 3"
 * (D62 adoption plan). Brief: docs/labs/beginner_waves_2026_11_15/00_BUILD_BRIEF.md;
 * items: F9_ITEMS.md; report: F9_REPORT.md.
 *
 * Every test here would have failed before its change.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { describe, it } from 'node:test';
import { revealDelta } from '../src/screens/lab/micselect/reveal.ts';
import * as D from '../src/screens/lab/micselect/micSelectData.ts';
import * as J from '../src/screens/lab/miking/engine/journey.ts';
import { HUB_NOTE, hubStartLine, LESSONS, MIKING_LABS, START_LESSON } from '../src/screens/lab/miking/data/registry.ts';
import { PAGE_IDS } from '../src/screens/lab/miking/engine/model/types.ts';

const ROOT = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped (so a comment can never satisfy a match). */
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
const M = 'src/screens/lab/miking';
const MS = 'src/screens/lab/micselect';

// ── SH-38 · the model notes are plain lines, not all-caps warnings ──────────
describe('SH-38 · no all-caps "NOT A MEASUREMENT" / "NOT TO SCALE" model notes in F9 labs', () => {
  it('the three Miking chart notes read in plain lower case, the disclosure kept', () => {
    for (const [f, line] of [
      [`${M}/lessons/shared/measure/ProductTools.tsx`, 'Relative dB · a made-up cycle, not a measurement'],
      [`${M}/lessons/shared/measure/RoomTools.tsx`, 'dB · a simplified example, not a measurement'],
      [`${M}/lessons/shared/measure/SurveyTools.tsx`, 'dBA · a made-up example, not a measurement'],
    ] as const) {
      const s = code(f);
      assert.doesNotMatch(s, /NOT A MEASUREMENT/, f);
      assert.ok(s.includes(line), `${f}: ${line}`);
    }
  });
  it('Mic Selection’s polar badge is one plain line, and its guide quotes it', () => {
    assert.ok(code(`${MS}/polarStage.tsx`).includes('>Top view · directions only, not to scale<'));
    assert.doesNotMatch(code(`${MS}/polarStage.tsx`), /DIRECTIONS ONLY, NOT TO SCALE/);
    assert.ok(read(`${MS}/micSelectScreenGuides.ts`).includes('“Top view · directions only, not to scale”'));
  });
});

// ── MS-02 · a changed card scrolls into view ────────────────────────────────
describe('MS-02 · the card a tap changes is brought into view', () => {
  const view = { y: 100, h: 600 };
  it('a card already in view stays put', () => {
    assert.equal(revealDelta({ y: 200, h: 300 }, view), 0);
  });
  it('a card below the fold scrolls up just far enough to show its foot', () => {
    // top at 500 (400 into the view), 300 tall: the foot is at 700 + 12 margin > 600
    assert.equal(revealDelta({ y: 500, h: 300 }, view), 700 - 588);
  });
  it('a card taller than the view lines its top up with the top edge', () => {
    assert.equal(revealDelta({ y: 600, h: 900 }, view), 500 - 12);
  });
  it('a card wholly below the view is brought in', () => {
    assert.ok(revealDelta({ y: 900, h: 200 }, view) > 0);
  });
  it('it never scrolls up (what was tapped sits above the card)', () => {
    assert.equal(revealDelta({ y: 50, h: 900 }, view), 0);
    assert.equal(revealDelta({ y: 0, h: 50 }, view), 0);
  });
  it('the mic card, the chip card and the challenge verdict are wrapped in <Reveal>', () => {
    const s = code(`${MS}/MicSelectLabScreen.tsx`);
    assert.match(s, /<Reveal on=\{compare \? `pair:\$\{pair\.join\('\|'\)\}` : sel\}>/);
    assert.match(s, /<Reveal on=\{sel\} style=\{styles\.detailCard\}>/);
    assert.match(s, /<Reveal on=\{`\$\{scenario\}:\$\{pick\}`\} onMount style=\{styles\.detailCard\}>/);
    // the host measures its scroll window and tracks the offset
    assert.match(s, /<RevealCtx\.Provider value=\{reveal\}>/);
    assert.match(s, /onScroll=\{\(e\) => \{\s*scrollY\.current = e\.nativeEvent\.contentOffset\.y;/);
    assert.match(s, /revealDelta\(\{ y: ny, h: nh \}, \{ y: vy, h: vh \}\)/);
  });
  it('COMPARE still keeps the current mic as the first pick (built 2026-11-14, unchanged)', () => {
    assert.match(code(`${MS}/MicSelectLabScreen.tsx`), /setPair\(sel \? \[sel\] : \[\]\);/);
  });
});

// ── SH-49 · Mic Selection's photo names are never cut ───────────────────────
describe('SH-49 · lesson 1’s photo names take three lines at 11 pt, so none is cut', () => {
  it('the name is 11 pt (2026-11-14) and may wrap to three lines', () => {
    const s = code(`${MS}/MicSelectLabScreen.tsx`);
    const types = s.slice(s.indexOf('function TypesStep()'), s.indexOf('function CharsStep()'));
    assert.match(types, /<Text style=\{styles\.micCellName\} numberOfLines=\{3\}>/);
    assert.match(s, /micCellName: \{[^}]*fontSize: 11,/);
  });
});

// ── MS-03 · lesson 8's chips say the place, not just a letter ───────────────
describe('MS-03 · the environment chips read A · Studio, B · Loud stage, C · Outdoors', () => {
  it('each scenario carries its chip words and the screen uses them', () => {
    assert.deepEqual(D.ENV_SCENARIOS.map((e) => e.chip), ['A · Studio', 'B · Loud stage', 'C · Outdoors']);
    assert.match(code(`${MS}/MicSelectLabScreen.tsx`), /<Chip key=\{s\.key\} label=\{s\.chip\}/);
    assert.doesNotMatch(code(`${MS}/MicSelectLabScreen.tsx`), /s\.title\.split\('·'\)\[0\]/);
  });
  it('the guide names the chips as they read', () => {
    const g = read(`${MS}/micSelectScreenGuides.ts`);
    assert.ok(g.includes('A · Studio, B · Loud stage and C · Outdoors'));
    assert.doesNotMatch(g, /on chips A, B and C/);
  });
});

// ── MS-04 · lesson 1 opens on the photos, in two groups ─────────────────────
describe('MS-04 · lesson 1: the grid in two groups first, the warning shortened and below', () => {
  const s = code(`${MS}/MicSelectLabScreen.tsx`);
  const types = s.slice(s.indexOf('function TypesStep()'), s.indexOf('function CharsStep()'));
  it('two groups by what a name describes; every mic is in exactly one', () => {
    assert.deepEqual(D.MIC_CLASS_NAMES, { transducer: 'HOW IT WORKS INSIDE', form: 'SHAPE OR JOB' });
    assert.match(types, /\{group\('transducer'\)\}\s*\{group\('form'\)\}/);
    assert.equal(D.MIC_TYPES.filter((m) => m.klass === 'transducer').length + D.MIC_TYPES.filter((m) => m.klass === 'form').length, D.MIC_TYPES.length);
  });
  it('the tap line replaces the old eyebrow, and the class note comes after the card', () => {
    assert.equal(D.TYPES_TAP_LINE, 'Tap a mic to see what it’s good at, and what it’s not.');
    assert.doesNotMatch(types, /TAP A MICROPHONE/);
    assert.ok(types.indexOf('TYPES_TAP_LINE') < types.indexOf("group('transducer')"));
    assert.ok(types.indexOf('<LessonBanner text={CLASS_NOTE} />') > types.indexOf('</Reveal>'), 'the note follows the card');
  });
  it('the note is shorter than before and drops the jargon list', () => {
    assert.ok(D.CLASS_NOTE.length < 200, `${D.CLASS_NOTE.length}`);
    assert.doesNotMatch(D.CLASS_NOTE, /acoustic directivity design|transducer principle/);
    assert.match(D.CLASS_NOTE, /not equivalent categories/);
  });
  it('the card’s class line uses the group names', () => {
    assert.match(types, /<Text style=\{styles\.detailKlass\}>\{MIC_CLASS_NAMES\[t\.klass\]\}<\/Text>/);
    assert.doesNotMatch(types, /TRANSDUCER PRINCIPLE|DESIGN \/ FORM FACTOR/);
  });
});

// ── MS-01 · lesson 2's sixteen chips in four groups ─────────────────────────
describe('MS-01 · lesson 2: four labeled groups and one "skim the rest" line', () => {
  it('every characteristic is in exactly one group', () => {
    const all = D.CHAR_GROUPS.flatMap((g) => g.keys);
    assert.equal(D.CHAR_GROUPS.length, 4);
    assert.equal(new Set(all).size, all.length);
    assert.deepEqual([...all].sort(), D.CHARACTERISTICS.map((c) => c.key).sort());
  });
  it('the intro names what the next modules cover and no longer says "tap each one"', () => {
    assert.doesNotMatch(D.CHAR_INTRO, /tap each one/);
    assert.match(D.CHAR_INTRO, /skim the rest for now/);
  });
  it('the screen draws the groups', () => {
    const s = code(`${MS}/MicSelectLabScreen.tsx`);
    assert.match(s, /CHAR_GROUPS\.map\(\(g\) =>/);
    assert.match(s, /<Text accessibilityRole="header" style=\{styles\.groupEyebrow\}>\{g\.title\}<\/Text>/);
  });
});

// ── SH-75-F · the CHECK guide no longer repeats the card's own sentence ─────
describe('SH-75-F · Mic Selection’s end guide drops "Nothing is lost and there is no score."', () => {
  it('the shared card says it; the guide line keeps its other words', () => {
    const g = read(`${MS}/micSelectScreenGuides.ts`);
    assert.doesNotMatch(g, /Nothing is lost and there is no score\./);
    assert.match(g, /a second wrong pick also shows the explanation\.'/);
  });
});

// ── MK-02 · one name per thing: modules on the map, no STEP dock key ────────
describe('MK-02 · the journey map counts the eight modules; the STEP dock key is renamed', () => {
  it('each map row is numbered by its modules, and every module is on the map once', () => {
    assert.deepEqual(J.STAGES.map((s) => J.stageModules(s)), ['1', '2', '3', '4', '5–7', '8']);
    assert.deepEqual(J.STAGES.flatMap((s) => s.pages), [...PAGE_IDS]);
    const k = code(`${M}/engine/journeyKit.tsx`);
    assert.match(k, /`THE JOURNEY · \$\{PAGE_IDS\.length\} MODULES`/);
    assert.doesNotMatch(k, /STAGES\.length\} STAGES/);
    assert.match(k, /\{done \? '✓' : stageModules\(s\)\}/);
  });
  it('no Miking dock key, bezel cell or play label says STEP any more (the strip owns "step")', () => {
    const bad: string[] = [];
    for (const f of walkSrc(M)) {
      const s = code(f);
      if (/label: 'STEP'/.test(s.replace(/kind: 'action', id: 'step', label: 'STEP'/g, ''))) bad.push(`${f}: label STEP`);
      if (/k: 'STEP'/.test(s)) bad.push(`${f}: bezel STEP`);
      if (/'NEXT STEP'/.test(s)) bad.push(`${f}: NEXT STEP`);
      if (/STEP through/.test(s)) bad.push(`${f}: STEP through`);
      if (/: 'STEP'\)/.test(s)) bad.push(`${f}: value STEP`);
    }
    assert.deepEqual(bad, []);
    assert.match(code(`${M}/pages/PSound.tsx`), /id: 'step',\s*label: 'EVENT'/);
    assert.match(code(`${M}/pages/PPlacement.tsx`), /id: 'piece',\s*label: 'PIECE'/);
    assert.match(read(`${M}/mikingScreenGuides.ts`), /Use PIECE to read the example piece by piece/);
  });
});

// ── MK-11 · the Placement Studio's mic and zones are clear at phone size ────
describe('MK-11 · zones and the mic you move are drawn to be seen on a phone', () => {
  const s = code(`${M}/engine/scene/PlacementScene.tsx`);
  it('an idle zone has a clear tint and a fixed-width edge on the glass', () => {
    assert.match(s, /export const ZONE_IDLE_FILL = 0\.12;/);
    assert.match(s, /export const ZONE_IDLE_EDGE = 0\.8;/);
    assert.match(s, /zoneSV\.value === z\.id \? ZONE_ON_FILL : ZONE_IDLE_FILL/);
    assert.match(s, /const edgeW = useDerivedValue\(\(\) => Math\.max\(2\.5, ZONE_EDGE_PX \/ xf\.value\.s\)\);/);
    assert.doesNotMatch(s, /\? 0\.26 : 0\.03|\? 1 : 0\.32/);
    assert.match(s, /<ZoneBand key=\{z\.id\} z=\{z\} rig=\{rig\} view=\{view\} zoneSV=\{zoneA\} xf=\{xf\} \/>/);
  });
  it('the mic you move wears a dark halo and an amber rim under its art', () => {
    const g = s.slice(s.indexOf('function MicGlyph('), s.indexOf('function PopHoop('));
    assert.match(g, /const haloW = useDerivedValue\(\(\) => MIC_HALO_PX \/ \(xf\.value\.s \* hk\)\);/);
    assert.ok(g.indexOf('strokeWidth={haloW}') > 0 && g.indexOf('strokeWidth={haloW}') < g.indexOf('<MikingMicArt'), 'the halo is drawn under the art');
    assert.match(g, /\{focus \? \(/);
  });
});

// ── MK-03 · silent words: no "LISTEN FOR", no formula sentences ─────────────
describe('MK-03 · the zone card says TENDENCY, and the two-mic line is in plain words', () => {
  it('the zone card label and every reveal that names it agree', () => {
    const kit = code(`${M}/engine/kit.tsx`);
    assert.match(kit, /export const ZONE_TENDENCY_LABEL = 'TENDENCY';/);
    assert.match(kit, /`\$\{ZONE_TENDENCY_LABEL\} · \$\{z\.tendency\}`/);
    const left = walkSrc(M).filter((f) => !f.endsWith('listenLine.ts') && /LISTEN FOR/.test(code(f)));
    assert.deepEqual(left, []);
    assert.ok(walkSrc(`${M}/lessons`).some((f) => read(f).includes('Each zone’s TENDENCY line is an idea to check by ear')));
  });
  it('no two-mic page prints the notch formulas as its sentence', () => {
    for (const f of [`${M}/pages/PTwoMic.tsx`, `${M}/lessons/shared/hand/handPages.tsx`, `${M}/lessons/shared/handdrums/pages/HTwoMic.tsx`, `${M}/lessons/m09Overheads/PTwoOverheads.tsx`]) {
      const s = code(f);
      assert.doesNotMatch(s, /odd multiples of 1 ÷ \(2 Δt\)|whole multiples of 1 ÷ Δt\./, f);
      assert.match(s, /the dips in the comb drawing\. The 1ST NOTCH readout is the lowest one\./, f);
    }
  });
});

// ── MK-05 · START HERE says the lesson's size and where to stop ─────────────
describe('MK-05 · the start step: eight modules, 1–2 the foundation, fine to stop after 2', () => {
  it('every intro carries the line, and a person is still never "it"', () => {
    assert.match(J.JOURNEY_LENGTH_LINE, /Eight modules: 1 and 2 are the foundation, and 3 to 8 go deeper\./);
    assert.doesNotMatch(J.JOURNEY_LENGTH_LINE, /\b(it|its|itself)\b/);
    assert.ok(J.journeyIntro({ one: 'kick', many: 'kicks' }).includes(J.JOURNEY_LENGTH_LINE));
    const person = J.journeyIntro({ one: 'host', many: 'hosts', person: true });
    assert.ok(person.includes(J.JOURNEY_LENGTH_LINE));
    assert.doesNotMatch(person, /\b(itself|its|it)\b/);
    // the journey sentence the map already shows gave way (a line in, a line out)
    assert.doesNotMatch(J.journeyIntro({ one: 'kick', many: 'kicks' }), /Then real starting setups drawn on/);
  });
  it('a lesson with its own intro (B12–B17) adds the same line', () => {
    assert.match(code(`${M}/lessons/shared/journeyPages.tsx`), /own \? `\$\{own\} \$\{JOURNEY_LENGTH_LINE\}`/);
  });
});

// ── MK-10 · modules 5–7 say they can be skimmed ─────────────────────────────
describe('MK-10 · the advanced modules carry a skim-for-now tag (goal line and CONTENTS)', () => {
  it('modules 5 to 7 are the advanced ones', () => {
    assert.deepEqual(J.ADVANCED_PAGES.map((p) => PAGE_IDS.indexOf(p) + 1), [5, 6, 7]);
    assert.equal(J.ADVANCED_GOAL_TAG, 'advanced: read it, skim the numbers, come back later');
  });
  it('the lesson screen tags the goal line and the CONTENTS titles; nothing is locked', () => {
    const s = code(`${M}/MikingLessonScreen.tsx`);
    assert.match(s, /isAdvanced\(page\) \? `Module \$\{pageIdx \+ 1\} goal \(\$\{ADVANCED_GOAL_TAG\}\): ` : `Module \$\{pageIdx \+ 1\} goal: `/);
    assert.match(s, /title: `\$\{pageOf\(lesson, id\)\.title\}\$\{isAdvanced\(id\) \? ADVANCED_CONTENTS_TAG : ''\}`/);
    assert.match(code(`${M}/engine/journey.ts`), /return 'open';/);
  });
});

// ── MK-04 + MK-06 · the hub: one note under the heading, one start line ─────
describe('MK-04 / MK-06 · each family hub says where to begin, and the note sits on top', () => {
  it('every family has a ready start lesson and one start line', () => {
    for (const lab of MIKING_LABS) {
      const id = START_LESSON[lab.id];
      assert.ok(LESSONS.some((l) => l.id === id && l.labId === lab.id), `${lab.id}: ${id}`);
      assert.match(hubStartLine(lab.id), /^New to miking\? Start with .+; modules 1 and 2 give you the foundation\.$/);
    }
    assert.equal(hubStartLine('ensembles'), 'New to miking? Start with Lead Vocal; modules 1 and 2 give you the foundation.');
  });
  it('the note says "suggested", not "recommend", never asks to listen, and keeps the safety point', () => {
    assert.match(HUB_NOTE, /Suggested starting points, not rules/);
    assert.doesNotMatch(HUB_NOTE, /recommend|listen/i);
    assert.match(HUB_NOTE, /Place real mics with the player stopped/);
  });
  it('the hub draws the note before the tiles and the short family line in place of the long paragraph', () => {
    const s = code(`${M}/MikingHubScreen.tsx`);
    assert.ok(s.indexOf('{HUB_NOTE}') < s.indexOf('<GlassPanel'));
    assert.match(s, /<Text style=\{styles\.blurb\}>\{lab\.familyBlurb\}<\/Text>/);
    assert.doesNotMatch(s, /\{lab\.blurb\}|trust your ears and the room/);
    assert.match(s, /hubStartLine\(lab\.id\)/);
  });
});

// ── LM-04 · the Fundamentals menu says which tile to open first ─────────────
describe('LM-04 · the Fundamentals opening line names the first two tiles', () => {
  const s = code('src/screens/lab/EarLabScreen.tsx');
  it('member and free copy both start with the start line; no topic list', () => {
    assert.match(s, /export const FUNDAMENTALS_START_LINE =\s*'New to audio\? Start with the first tile, Understanding Level & Amplitude, then Foundations of Sound\.';/);
    assert.match(s, /const FUNDAMENTALS_INTRO_MEMBER = FUNDAMENTALS_START_LINE;/);
    assert.match(s, /`\$\{FUNDAMENTALS_START_LINE\} Both are free;/);
    assert.doesNotMatch(s, /level and amplitude, the foundations of/);
  });
});

// ── SH-44 = LM-03 · each subject heading shows its description ──────────────
describe('SH-44 / LM-03 · the Labs menu subject headings carry their one-line description', () => {
  const s = code('src/screens/lab/EarLabScreen.tsx');
  it('the description shows under the name; the count moved beside the name (a line in, a line out)', () => {
    const label = s.slice(s.indexOf('function CategoryLabel('), s.indexOf('function LabRow('));
    assert.match(label, /<View style=\{styles\.catNameRow\}>\s*<Text style=\{\[styles\.catName, purple && styles\.catNamePurple\]\}>\{cat\.name\}<\/Text>\s*<Text style=\{styles\.catCount\}>\{categoryCountLabel\(cat\)\}<\/Text>\s*<\/View>\s*<Text style=\{styles\.catDesc\}>\{cat\.description\}<\/Text>/);
  });
});

/** Every .ts / .tsx file under a folder (repo-relative paths). */
function walkSrc(dir: string): string[] {
  const out: string[] = [];
  const go = (d: string) => {
    for (const n of readdirSync(new URL(d, ROOT))) {
      const p = `${d}/${n}`;
      if (statSync(new URL(p, ROOT)).isDirectory()) go(p);
      else if (/\.tsx?$/.test(n)) out.push(p);
    }
  };
  go(dir);
  return out;
}

// ── SH-76 · tray choices carry a one-line meaning ───────────────────────────
describe('SH-76 · the Miking PATTERN trays: each choice says what it means', () => {
  it('every pattern has a blurb, and the three trays that had bare names use them', async () => {
    const { PATTERN_BLURBS, PATTERN_LABELS } = await import('../src/screens/lab/miking/engine/physics/polar.ts');
    assert.deepEqual(Object.keys(PATTERN_BLURBS).sort(), Object.keys(PATTERN_LABELS).sort());
    for (const v of Object.values(PATTERN_BLURBS)) assert.ok(v.length > 10 && v.length <= 100, v);
    for (const f of [`${M}/pages/PMicOnIt.tsx`, `${M}/pages/PMicrophone.tsx`, `${M}/lessons/shared/journeyPages.tsx`]) {
      assert.match(code(f), /options: t\.patterns\.map\(\(p\) => \(\{ id: p\.id, label: p\.label, blurb: PATTERN_BLURBS\[p\.id\] \}\)\)/, f);
    }
  });
});

// ── SH-26 · a code is spelled out where it is first seen ────────────────────
describe('SH-26 · Mic Selection spells out SPL on the first card a learner sees', () => {
  it('the Moving-Coil Dynamic card (shown first) says "sound pressure level (SPL)"', () => {
    const dyn = D.MIC_TYPES.find((m) => m.key === 'dynamic')!;
    assert.ok(dyn.traits.includes('Commonly handles very high sound pressure level (SPL)'));
  });
});
