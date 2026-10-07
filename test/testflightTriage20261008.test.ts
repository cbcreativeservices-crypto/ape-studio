/**
 * TestFlight screenshot feedback, read 2026-10-08 (46 items, most on build 32).
 * Triage: docs/feedback/TESTFLIGHT_TRIAGE_2026_10_08.md. These guard the items
 * fixed in this pass, plus the earlier fixes that had no guard of their own.
 *
 *  #18 Line Array Laboratory, owner: "controls are slow to respond and move
 *      together sometimes". The ARRAY tray's sliders are DragSlider
 *      (foundations/bits.tsx), which (a) moved by PanResponder's `dx` — the
 *      CENTROID of every finger on the glass, so a second finger moved the
 *      slider already held — and (b) handed EVERY touch move to the lab, which
 *      rebuilds the whole wave scene per move, so the moves queued behind the
 *      renders. ParamLane was cured of both (laneFinger 2026-10-01, laneFeed
 *      2026-10-06); DragSlider now uses the same two helpers.
 *  #5  "Scrolling left and right either jumps screens or creates unwanted
 *      movement of the image" — the credential popup lost its sideways pager
 *      on 2026-09-30; its twin, the Explore TOPIC popup, still had it.
 *  #2  Calculator laboratory: every calculator name in a category popup was
 *      the same near-white as its tagline.
 *  #29 "Enrollment is not free. That statement is confusing" — the line now
 *      says exactly which topics open without a membership.
 *  #33 A guest who taps a members topic is told the real way in: an account
 *      first, then a membership.
 *  #31 Scenarios: the verdict stays until NEXT (no auto-advance timer).
 *  #30 Owner copy for the line above the Home carousel.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1').replace(/\{\s*\}/g, '{}');
const read = (rel: string) => stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n'));

// ── #18 DragSlider ───────────────────────────────────────────────────────────
test('#18 DragSlider follows the finger that grabbed it, not the centroid of every finger', () => {
  const s = read('src/screens/lab/foundations/bits.tsx');
  const body = s.slice(s.indexOf('export function DragSlider'), s.indexOf('export function', s.indexOf('export function DragSlider') + 10));
  assert.match(body, /fingerRef\.current = laneFingerAt\(e\.nativeEvent\)/, 'the grab records the grabbing finger');
  assert.match(body, /const dx = laneFingerDx\(e\.nativeEvent, fingerRef\.current, g\.dx\);/);
  assert.match(body, /if \(dx === 'lifted'\) return;/, 'a lifted grabbing finger leaves the slider where it is');
  assert.match(body, /laneDragValue\(baseRef\.current, dx, wRef\.current, insRef\.current, CAP_W\)/);
  assert.doesNotMatch(body, /laneDragValue\(baseRef\.current, g\.dx/, 'never the centroid dx');
});

test('#18 DragSlider hands the lab at most one value per frame — the newest — and never loses the last', () => {
  const s = read('src/screens/lab/foundations/bits.tsx');
  const body = s.slice(s.indexOf('export function DragSlider'), s.indexOf('export function', s.indexOf('export function DragSlider') + 10));
  assert.match(body, /createLaneFeed\(\{/);
  assert.match(body, /schedule: \(cb\) => setTimeout\(cb, DRAG_TICK_MS\)/);
  assert.match(body, /feed\.grant\(v\)/, 'a tap still lands at once');
  assert.match(body, /feed\.move\(/, 'a move only records the newest value');
  assert.match(body, /onPanResponderRelease: \(\) => \{\s*feed\.end\(\);/, 'the release delivers what is pending');
  assert.match(body, /onPanResponderTerminate: \(\) => \{\s*feed\.end\(\);/);
  const move = body.slice(body.indexOf('onPanResponderMove'), body.indexOf('onPanResponderRelease'));
  assert.doesNotMatch(move, /onChangeRef\.current\(/, 'no direct per-move delivery to the lab');
  assert.match(s, /const DRAG_TICK_MS = 16;/);
});

test('#18 pattern: the vertical faders follow their own finger too (laneFingerDy)', async () => {
  const { laneFingerAtY, laneFingerDy } = await import('../src/screens/lab/rack/laneFinger.ts');
  const f = laneFingerAtY({ identifier: 1, pageY: 300 });
  // Finger 1 down at y 300; finger 2 lands on the next fader at y 500 and moves.
  const two = { touches: [{ identifier: 1, pageY: 300 }, { identifier: 2, pageY: 420 }] };
  assert.equal(laneFingerDy(two, f, 60), 0, 'the held fader ignores the second finger (centroid would say 60)');
  assert.equal(laneFingerDy({ touches: [{ identifier: 1, pageY: 260 }] }, f, -40), -40, 'its own finger still drives it');
  assert.equal(laneFingerDy({ touches: [{ identifier: 2, pageY: 420 }] }, f, 60), 'lifted');
  assert.equal(laneFingerDy({}, f, 12), 12, 'no touch list → the centroid fallback');
  const eq = read('src/screens/lab/eq/modules/eqBits.tsx');
  const vf = eq.slice(eq.indexOf('export function VerticalFader'), eq.indexOf('export function GraphicBoard'));
  assert.match(vf, /fingerRef\.current = laneFingerAtY\(e\.nativeEvent\)/);
  assert.match(vf, /const dy = laneFingerDy\(e\.nativeEvent, fingerRef\.current, g\.dy\);\s*if \(dy === 'lifted'\) return;/);
  assert.match(vf, /baseRef\.current - dy \/ trackHRef\.current/);
  const gear = read('src/screens/lab/kit/gear.tsx');
  const gf = gear.slice(gear.indexOf('export function GearFader'), gear.indexOf('export function GearKnob'));
  assert.match(gf, /fingerRef\.current = laneFingerAtY\(e\.nativeEvent\)/);
  assert.match(gf, /const dy = laneFingerDy\(e\.nativeEvent, fingerRef\.current, g\.dy\);\s*if \(dy === 'lifted'\) return;/);
  assert.match(gf, /faderDbToFrac\(grabDb\.current\) - dy \/ SLOT_H/);
});

test('#18 the Line Array tray still uses DragSlider (so it gets the fix)', () => {
  const s = read('src/screens/lab/wave/modules/modWaveB.tsx');
  const body = s.slice(s.indexOf('export function LineArrayModule'), s.indexOf('export function DelayAlignModule'));
  assert.equal((body.match(/<DragSlider /g) ?? []).length, 3);
});

// ── #5 sideways pager ────────────────────────────────────────────────────────
test('#5 neither detail popup pages sideways (credential, and now the Explore topic popup)', () => {
  for (const f of ['src/screens/awards/CredentialDetailModal.tsx', 'src/screens/curriculum/TopicDetailModal.tsx']) {
    const s = read(f);
    assert.doesNotMatch(s, /<DetailPager/, `${f} must not render the sideways pager`);
    assert.doesNotMatch(s, /from '\.\.\/\.\.\/components\/detailSwipe'/, `${f} must not import it`);
  }
  const topic = read('src/screens/curriculum/TopicDetailModal.tsx');
  assert.match(topic, /\{renderPage\(topic\)\}/, 'the topic popup shows one topic, vertical scroll only');
});

// ── #2 calculator names ──────────────────────────────────────────────────────
test('#2 calculator names in a category popup are coloured apart from their taglines', () => {
  const s = read('src/screens/lab/calc/CalcLabScreen.tsx');
  const name = s.match(/tileName: \{[^}]*color: ([^,}\s]+)/)?.[1];
  const tag = s.match(/tileTag: \{[^}]*color: ([^,}\s]+)/)?.[1];
  assert.equal(name, 'colors.programPurple');
  assert.notEqual(name, tag);
});

// ── #29 enrollment wording ───────────────────────────────────────────────────
test('#29 the enroll line is true: names the two topics open without a membership, never "free"', () => {
  const s = readFileSync(new URL('../src/lib/copy.ts', import.meta.url), 'utf8');
  const line = s.match(/enrollFreeLine:\s*'([^']*)'/)?.[1] ?? '';
  assert.match(line, /membership/i);
  assert.match(line, /Pro Audio Safety/);
  assert.match(line, /DAW Fundamentals/);
  assert.doesNotMatch(line, /free|costs nothing|no cost/i);
});

// ── #33 guest how-to ─────────────────────────────────────────────────────────
test('#33 a known guest is told the account step before the membership step', () => {
  const sheet = read('src/features/commercial/StudyAccessSheet.tsx');
  assert.match(sheet, /guest\?: boolean/);
  assert.match(sheet, /\{guest\s*\?/);
  assert.match(sheet, /create your account/i);
  const dash = read('src/screens/dashboard/DashboardScreen.tsx');
  const at = dash.indexOf('<StudyAccessSheet');
  assert.ok(at > 0);
  // Known guest only (tier 'guest' AND guest wording) — never a pending member.
  assert.match(dash.slice(at, at + 400), /guest=\{quizAsGuest\}/);
});

// ── #31 scenarios ────────────────────────────────────────────────────────────
test('#31 Scenarios never auto-advances: the verdict stays until NEXT ›', () => {
  const s = read('src/screens/study/ScenariosScreen.tsx');
  assert.doesNotMatch(s, /advanceTimer\.current = setTimeout/);
  assert.match(s, /\{feedback && <StudioButton label="Next ›"/);
});

// ── #30 owner copy above the Home carousel ───────────────────────────────────
test('#30 the line above the carousel names the centred card (owner copy)', () => {
  const s = read('src/screens/courses/CourseSelectionScreen.tsx');
  const fn = s.slice(s.indexOf('export function deckHeadline'), s.indexOf('export function deckHeadline') + 900);
  const want: [string, string][] = [
    ["case 'tools'", 'Measure Audio'],
    ["case 'glossary'", 'Look Up a Term'],
    ["case 'startHere'", 'Begin Here'],
    ["case 'homeTopic'", 'Start Learning a Topic'],
    ["case 'showcase'", 'Explore Topics to Enroll In'],
  ];
  for (const [c, words] of want) {
    const i = fn.indexOf(c);
    assert.ok(i >= 0, c);
    assert.match(fn.slice(i, fn.indexOf('return', i) + words.length + 12), new RegExp(`return '${words}'`), c);
  }
  // The labs card: the owner's own later wording (2026-09-30, 1141be18).
  assert.match(fn, /case 'lab':\s*return 'Start Interactive Laboratories'/);
});
