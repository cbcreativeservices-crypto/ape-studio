/**
 * Cable labs bug hunt (2026-09-29) — source guards for the Cable Dressing &
 * Installation lab and the Cable & Connector Fundamentals lab.
 *
 * The screens are React Native, so most guards read the source as text (no
 * RN import, no Metro). The score engine is pure and imported directly.
 */
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { mergeDims, weakestDim } from '../src/screens/lab/cableinstall/engine/score.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CI = resolve(ROOT, 'src/screens/lab/cableinstall');
const CL = resolve(ROOT, 'src/screens/lab/cable');
/** Source with comments stripped and line endings normalised. */
const src = (p: string) =>
  readFileSync(p, 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

describe('cable install — score engine facts the fixes rely on', () => {
  it('mergeDims is NOT idempotent (why InspectScene must not re-report its dims)', () => {
    const once = mergeDims({ safety: 40 }, { safety: 100 });
    const twice = mergeDims(once, { safety: 100 });
    assert.equal(once.safety, 70);
    assert.notEqual(twice.safety, once.safety);
  });
  it('weakestDim is null when nothing is below 80 (REVIEW RESULTS must not guess)', () => {
    assert.equal(weakestDim({ safety: 90, routing: 85 }), null);
    assert.equal(weakestDim({}), null);
  });
});

describe('cable install — InspectScene', () => {
  const s = src(resolve(CI, 'scenes/InspectScene.tsx'));
  const body = s.slice(s.indexOf('const onQuizSolved'), s.indexOf('const inspectDock'));
  it('flips to done OUTSIDE the one-shot credit guard (retry no longer sticks at 5/5)', () => {
    const guard = body.indexOf('if (!firedRef.current)');
    const guardEnd = body.indexOf('}', body.indexOf('onComplete(', guard));
    assert.ok(guard > 0, 'credit guard present');
    const done = body.lastIndexOf("setPhase('done')");
    assert.ok(done > guardEnd, "setPhase('done') runs after (outside) the guard");
  });
  it('does not merge the inspection dims twice', () => {
    assert.match(body, /onComplete\(onDims \? undefined : passDims\)/);
  });
});

describe('cable install — screen', () => {
  const s = src(resolve(CI, 'CableInstallLabScreen.tsx'));
  it('REPEAT LAB starts a fresh run without wiping banked credit, and resets myths', () => {
    // One `repeatLab` serves the completion stage's REPEAT LAB and the shared
    // strip's CONTENTS reset (lab navigation migration WP5, 2026-10-01).
    const repeat = s.slice(s.indexOf('const repeatLab = useCallback'), s.indexOf('}, [goTo]);', s.indexOf('const repeatLab = useCallback')));
    assert.ok(repeat.length > 0, 'repeatLab is defined');
    assert.doesNotMatch(repeat, /completedUnitsRef\.current = new Set/);
    assert.match(repeat, /runUnitsRef\.current = new Set\(\)/);
    assert.match(repeat, /setShownMyths\(\[\]\)/);
    assert.match(repeat, /goTo\(1, \{\}, \[\]\)/);
    assert.match(s, /onRepeat=\{repeatLab\}/);
    assert.match(s, /reset: \{ label: 'REPEAT LAB \(PRACTICE\)', run: repeatLab \}/);
  });
  it('the shared strip is the navigation: CONTENTS ✓ and what-is-left read THIS run; the copy knows banked credit', () => {
    assert.match(s, /from '\.\.\/kit\/LabNavBar'/);
    assert.match(s, /<LabNavBar nav=\{nav\} \/>/);
    assert.match(s, /intro: true/);
    assert.match(s, /beforeAdvance,/);
    assert.match(s, /return 'consumed';/, 'the myth interstitial consumes NEXT');
    assert.match(s, /const done = runUnitsRef\.current\.has\(m\.unit\)/);
    assert.match(s, /banked: completedUnitsRef\.current\.has\(m\.unit\)/);
    // The completion copy moved to completeCopy.ts (2026-10-01 save-honesty fix).
    assert.match(s, /ciLeftLead\(saveState,/);
    assert.match(src(resolve(CI, 'completeCopy.ts')), /already banked/);
    assert.doesNotMatch(s, /SKIP AHEAD|FINISH ✓|rackFooter|<ProgressDot/);
  });
  it('REVIEW RESULTS is not offered when no dimension is below 80', () => {
    assert.match(s, /canReview=\{weakestDim\(dims\) != null\}/);
    assert.match(s, /if \(!worst\) return;/);
  });
  it('restores the step BEFORE parsing the (possibly corrupt) score state', () => {
    const r = s.slice(s.indexOf('AsyncStorage.multiGet'));
    assert.ok(r.indexOf('setStep(n)') < r.indexOf('JSON.parse(rawState)'));
    assert.match(r, /st\?\.dims/);
  });
});

describe('cable install — same-frame double taps', () => {
  it('Walls: NEXT WALL advances by an absolute index', () => {
    const s = src(resolve(CI, 'scenes/WallsScene.tsx'));
    assert.doesNotMatch(s, /setWallIdx\(\(i\) => i \+ 1\)/);
    assert.match(s, /setWallIdx\(wallIdx \+ 1\)/);
  });
  it('Supports: a synchronous pick lock', () => {
    const s = src(resolve(CI, 'scenes/SupportsScene.tsx'));
    assert.match(s, /pickedRef\.current\) return;\n\s+pickedRef\.current = true;/);
  });
  it('Know / Route / Fire / Floor lock answers through refs', () => {
    assert.match(src(resolve(CI, 'scenes/KnowScene.tsx')), /const cur = ansRef\.current\[sid\]/);
    assert.match(src(resolve(CI, 'scenes/RouteScene.tsx')), /if \(picksRef\.current\[sid\]\) return;/);
    const fire = src(resolve(CI, 'scenes/FireScene.tsx'));
    assert.match(fire, /if \(flowAnsRef\.current\.length !== qi\) return;/);
    assert.match(fire, /if \(spaceAnsRef\.current\[id\] != null\) return;/);
    const floor = src(resolve(CI, 'scenes/FloorScene.tsx'));
    assert.match(floor, /const cur = signsRef\.current;/);
    assert.match(floor, /signsRef\.current = nextSigns;/);
  });
  it('Ceiling: one spacing penalty per distinct failing layout; CONFIRM docked', () => {
    const s = src(resolve(CI, 'scenes/CeilingScene.tsx'));
    assert.match(s, /!failedLayouts\.current\.has\(hookKey\)/);
    assert.equal((s.match(/label="CONFIRM THE ROUTE ✓"/g) ?? []).length, 2);
  });
  it('Rack: a solved jack ignores further jack taps', () => {
    assert.match(src(resolve(CI, 'scenes/RackScene.tsx')), /if \(replaced \|\| cSel\?\.ok\) return;/);
  });
  it('SourceSheet: Android back closes the sheet', () => {
    const s = src(resolve(CI, 'bits.tsx'));
    assert.match(s, /BackHandler\.addEventListener\('hardwareBackPress'/);
  });
});

describe('cable fundamentals', () => {
  const shell = src(resolve(CL, 'CableLabScreen.tsx'));
  it('CONTENTS done flags come from cleared units, not the step index; lesson 12 is the end state', () => {
    assert.doesNotMatch(shell, /i < step/);
    assert.match(shell, /LESSON_UNITS\[st\.id\]/);
    assert.match(shell, /from '\.\.\/kit\/LabNavBar'/);
    assert.match(shell, /<LabNavBar nav=\{nav\} \/>/);
    assert.match(shell, /<LabNextButton nav=\{nav\} \/>/);
    assert.match(shell, /const ending = step === last;/);
    assert.doesNotMatch(shell, /DONE ✓|lastNavAtRef|leavingRef|navigation\.goBack/);
  });
  it('the shell holds bench / challenge progress across lesson changes', () => {
    assert.match(shell, /<CableShellStateCtx\.Provider value=\{lessonState\}>/);
    assert.match(src(resolve(CL, 'lessons/lesson10.tsx')), /useCableShellState<string\[\]>\('l10\.solved'/);
    const l11 = src(resolve(CL, 'lessons/lesson11.tsx'));
    assert.match(l11, /useCableShellState<ChProgress>\('l11\.progA'/);
    assert.match(l11, /useCableShellState<ChProgress>\('l11\.progB'/);
  });
  it("the final step lists what is left, with jump links", () => {
    const l12 = src(resolve(CL, 'lessons/lesson12.tsx'));
    assert.match(l12, /WHAT’S LEFT/);
    assert.match(l12, /<WhatsLeft nav=\{nav\} \/>/);
    assert.match(l12, /onPress=\{\(\) => nav\(r\.id\)\}/);
  });
  it('LESSON_UNITS covers exactly the lab unit set', () => {
    const data = src(resolve(CL, 'data/lessons.ts'));
    for (const k of ['TESTER_UNIT', 'CHALLENGE_A_UNIT, CHALLENGE_B_UNIT', '...SAFETY_UNITS, FINAL_UNIT']) {
      assert.ok(data.slice(data.indexOf('LESSON_UNITS')).includes(k), k);
    }
  });
});
