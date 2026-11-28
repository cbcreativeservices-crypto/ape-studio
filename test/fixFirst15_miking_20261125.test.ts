/**
 * Fix-first 15 (owner 2026-11-25), group MIKING — items 4 and 7 of
 * Downloads/2026-11-25_LAB_CONTROLS_AUDIT.md (Appendix E rows 1 and 2).
 *
 * 4. Every "Aim the rejection" page: while AIM rides, only the mic turned; the
 *    inset's amber dot and OFF AXIS / PICKUP / REJECTION read the SAVED pose
 *    (rig.mics[0].pose), which changes only on release. They now read
 *    useAimRide (pages/PContext.tsx): the rig's shared pose — the one the
 *    Placement page's live strip and the two-mic comb read — mirrored through
 *    a reaction while the lane rides, the saved pose at rest. The credit and
 *    the read-aloud label keep the saved pose. The release still commits.
 * 7. F06 woodland, LISTEN AT: the range stops 0.5 m back (the walking path's
 *    keep-out is behind the start), but "back" counted only at 1.5 m, so the
 *    activity could never finish. The range is right; the threshold now stops
 *    at the lane's own end when the range is shorter than 1.5 m.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { arrivalAngle, gainDb, nearNull } from '../src/screens/lab/miking/engine/physics/polar.ts';
import { nearestOnPolyline, EDGE_BIRD, STREAM_PTS, WOODS_BIRDS, WOODS_PATH, WOODS_PATH_W } from '../src/screens/lab/miking/lessons/shared/field/sites.ts';
import { SETBACK } from '../src/screens/lab/miking/lessons/shared/field/safety.ts';

const read = (f: string) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');

/* ── item 4 ─────────────────────────────────────────────────────────────── */

const AIM_PAGES = [
  'src/screens/lab/miking/pages/PContext.tsx',
  'src/screens/lab/miking/lessons/shared/handdrums/pages/HContext.tsx',
  'src/screens/lab/miking/lessons/spk/pages.tsx',
  'src/screens/lab/miking/lessons/shared/electric/ampPages.tsx',
  'src/screens/lab/miking/lessons/shared/hand/handPages.tsx',
];

/** The "Aim the rejection" page's source: from its live values to its scene. */
function aimPage(s: string): string {
  const i = s.indexOf('const aimLive = useAimRide(rig);');
  assert.ok(i > 0, 'the page reads the live aim');
  const j = s.indexOf('</PatternInset>', i);
  assert.ok(j > i, 'the page draws its inset after');
  return s.slice(i, j);
}

describe('item 4: "Aim the rejection" follows the AIM drag live', () => {
  it('physics: a 30° turn moves the arrival angle and the pickup, so a saved-pose read freezes them', () => {
    const src = { x: -600, y: 200, z: 300 };
    const saved = { p: { x: 0, y: 0, z: 0 }, az: 0, el: 0 };
    const turned = { ...saved, az: 30 };
    const t0 = arrivalAngle(saved, src);
    const t1 = arrivalAngle(turned, src);
    assert.ok(Math.abs(t1 - t0) > 5, `the angle moves (${t0.toFixed(1)}° → ${t1.toFixed(1)}°)`);
    assert.notEqual(gainDb('supercardioid', t0).toFixed(1), gainDb('supercardioid', t1).toFixed(1));
    // At rest the live pose IS the saved pose: identical numbers, as before.
    assert.equal(arrivalAngle({ ...saved }, src), t0);
    assert.equal(nearNull('supercardioid', arrivalAngle({ ...saved }, src), 15), nearNull('supercardioid', t0, 15));
  });

  it('useAimRide mirrors the rig shared pose (rig.pose.A) only while the lane rides, and the saved pose at rest', () => {
    const s = read(AIM_PAGES[0]);
    const hook = s.slice(s.indexOf('export function useAimRide'), s.indexOf('function sameSceneProps'));
    assert.match(hook, /const sv = rig\.pose\.A;/);
    // Round 2 M1 (owner 2026-11-25, fix-first 15): the reaction compares the SHOWN pose (whole degrees) and sends the raw one.
    assert.match(hook, /useAnimatedReaction\(\s*\(\) => sv\.value,\s*\(p, prev\) => \{\s*if \(!prev \|\| !samePose\(shownPose\(p\), shownPose\(prev\)\)\) scheduleOnRN\(see, p\);/);
    // Round 2 checker (owner 2026-11-25, fix-first 15): deduped on the shown pose, the raw pose sent.
    assert.match(hook, /if \(!prev \|\| !samePose\(shownPose\(p\), shownPose\(prev\)\)\) scheduleOnRN\(see, p\);/, 'only a shown change crosses to React');
    // Round 2 M2 (owner 2026-11-25, fix-first 15): the mirror stays until the release's commit lands.
    assert.match(hook, /if \(riding\.current \|\| owed\.current != null\) setSeen/, 'only while the lane rides, or its commit is owed');
    assert.match(hook, /riding\.current = false;\s*if \(owed\.current == null\) owed\.current = shownVersion\.current;/, 'the release marks the commit owed (the first one kept)');
    assert.match(hook, /if \(owed\.current != null && version > owed\.current && !riding\.current\) \{\s*owed\.current = null;\s*setSeen\(null\);/, 'the landed commit drops the mirror');
    assert.match(hook, /return \{ pose: seen \?\? saved, ride, rest \};/, 'the saved pose at rest');
    assert.match(s, /export const SteadyScene = memo\(PlacementScene, sameSceneProps\);/, 'the drawing is not re-rendered per degree');
  });

  for (const f of AIM_PAGES) {
    it(`${f.split('/miking/')[1]}: dot and OFF AXIS / PICKUP / REJECTION read the live aim; credit and save unchanged`, () => {
      const s = read(f);
      const p = aimPage(s);
      assert.match(p, /const thetaNow = arrivalAngle\(aimLive\.pose, src\);/);
      assert.match(p, /const dbNow = gainDb\(pattern, thetaNow\);/);
      assert.match(p, /const inNullNow = nearNull\(pattern, thetaNow, NULL_TOL\);/);
      assert.match(p, /angle=\{live \? thetaNow : 0\}/, 'the inset dot');
      assert.match(p, /k: 'OFF AXIS', v: `≈ \$\{Math\.round\(thetaNow \/ 5\) \* 5\}°`/);
      assert.match(p, /fmtDb\(dbNow\)/, 'PICKUP');
      assert.match(p, /isDeepNull\(dbNow\)/, 'PICKUP deep null');
      assert.match(p, /k: 'REJECTION', v: inNullNow/);
      assert.doesNotMatch(p, /angle=\{live \? theta : 0\}|Math\.round\(theta \/ 5\)|fmtDb\(db\)|k: 'REJECTION', v: inNull[ &]/, 'no saved-pose read left in the live cells');
      // The lane rides before the preview write, rests before the commit; the release still saves.
      assert.match(p, /aimLive\.ride\(\);\s*aimHeld\.note\(v, rig\.preview\(/);
      assert.match(p, /onCommit: \(\) => \{\s*aimLive\.rest\(\);\s*rig\.commit\('A'\);\s*setAimed\(true\);/);
      // The credit still comes from the saved pose (inNull, from rig.mics[0].pose).
      assert.match(s, /const pose = rig\.mics\[0\]\.pose;/);
      assert.match(s, /const theta = arrivalAngle\(pose, src\);/);
      assert.match(s, /const inNull = nearNull\(pattern, theta, NULL_TOL\);/);
      assert.match(s, /&& inNull && [^\n]*onInteractive\('wedgeInNull'\)/);
      assert.match(p, /<SteadyScene\s+rig=\{rig\}/);
      assert.match(p, /wedge=\{wedgeArt\}/);
    });
  }
});

/* ── item 7 ─────────────────────────────────────────────────────────────── */

type Range = { min: number; max: number; start: number };
const snap = (q: number) => Math.round(q / 100) * 100;
/** The lane's reachable ends (it snaps to 100 mm, fieldSteps useBalanceStep). */
const ends = (r: Range) => ({ lo: snap(r.min), hi: snap(r.max) });
/** The OLD rule: a fixed 1.5 m each way. */
const oldReachable = (r: Range) => ends(r).lo <= r.start - 1500 && ends(r).hi >= r.start + 1500;
/** The NEW rule (fieldSteps loAt / hiAt): 1.5 m, or the lane's own end. */
const newReachable = (r: Range) => {
  const loAt = Math.max(r.start - 1500, ends(r).lo);
  const hiAt = Math.min(r.start + 1500, ends(r).hi);
  return ends(r).lo <= loAt && ends(r).hi >= hiAt && loAt < r.start && hiAt > r.start;
};

const F06 = read('src/screens/lab/miking/lessons/f06Ambience/pages.tsx');
const F07 = read('src/screens/lab/miking/lessons/f07Wildlife/pages.tsx');
const STEPS = read('src/screens/lab/miking/lessons/shared/field/fieldSteps.tsx');

describe('item 7: F06 woodland LISTEN AT can finish', () => {
  // Every useBalanceStep user, with the range its source declares.
  const users: Record<string, Range> = {
    'F06 woodland': { min: -500, max: 4500, start: 0 },
    'F06 plaza': { min: -6500, max: 5000, start: 0 },
    'F07 wildlife': { min: -2000, max: EDGE_BIRD.c[0] - SETBACK.most.mm - 500, start: 0 },
  };
  it('the ranges are the ones in the sources (every useBalanceStep user)', () => {
    assert.match(F06, /x: \{ min: -500, max: 4500, start: 0 \}/);
    assert.match(F06, /x: \{ min: -6500, max: 5000, start: 0 \}/);
    assert.match(F07, /x: \{ min: -2000, max: RING_EDGE_X, start: 0 \}/);
    assert.match(F07, /const RING_EDGE_X = EDGE_BIRD\.c\[0\] - SETBACK\.most\.mm - 500;/);
    const n = (s: string) => (s.match(/useBalanceStep\(\{/g) ?? []).length;
    assert.equal(n(F06) + n(F07), 3, 'three users; no other lesson calls it');
  });

  it('the range is right: 0.5 m back is the last clear step before the walking path keep-out', () => {
    // The path's centre at z = 0, between its vertices at z = −5000 and +5000.
    const [a, b] = [WOODS_PATH[1], WOODS_PATH[2]];
    const cx = a[0] + ((0 - a[1]) / (b[1] - a[1])) * (b[0] - a[0]);
    const hw = WOODS_PATH_W / 2 + 300; // bandKeepOut('env.path', …, WOODS_PATH_W / 2 + 300)
    assert.equal(cx, -1600);
    assert.ok(-500 - cx > hw, '−0.5 m is clear of the path');
    assert.ok(-600 - cx <= hw + 50, 'one more step back is at the keep-out edge');
    assert.ok(-2000 - cx < hw, 'the audit\'s −2 m would stand on the path');
  });

  it('before: the woodland could never count "back"; after: every user can finish both ways', () => {
    assert.equal(oldReachable(users['F06 woodland']), false, 'the fault');
    for (const [k, r] of Object.entries(users)) assert.equal(newReachable(r), true, k);
    // The two lessons that already worked keep their 1.5 m legs exactly.
    for (const k of ['F06 plaza', 'F07 wildlife']) {
      const r = users[k];
      assert.equal(Math.max(r.start - 1500, ends(r).lo), -1500, `${k} lo`);
      assert.equal(Math.min(r.start + 1500, ends(r).hi), 1500, `${k} hi`);
    }
  });

  it('fieldSteps counts "moved" at 1.5 m or the lane\'s own snapped end', () => {
    assert.match(STEPS, /const BALANCE_LEG = 1500;/);
    assert.match(STEPS, /const loAt = Math\.max\(spec\.x\.start - BALANCE_LEG, snap\(spec\.x\.min\)\);/);
    assert.match(STEPS, /const hiAt = Math\.min\(spec\.x\.start \+ BALANCE_LEG, snap\(spec\.x\.max\)\);/);
    assert.match(STEPS, /const xx = snap\(spec\.x\.min \+ v \* span\);/);
    assert.match(STEPS, /setMoved\(\(m\) => \(\{ lo: m\.lo \|\| xx <= loAt, hi: m\.hi \|\| xx >= hiAt \}\)\);/);
    assert.doesNotMatch(STEPS, /spec\.x\.start - 1500|spec\.x\.start \+ 1500/);
  });

  it('the readout changes across the range the way the text says (node evaluation, fieldSteps formula)', () => {
    const H = 1500; // AMB_H
    const birds = [WOODS_BIRDS.a, WOODS_BIRDS.b].map((q) => ({ x: q.c[0], y: -q.h, z: q.c[1] }));
    const d = (p: { x: number; y: number; z: number }, q: { x: number; y: number; z: number }) => Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
    const at = (x: number) => {
      const p = { x, y: -H, z: 0 };
      const m = nearestOnPolyline(STREAM_PTS, p, 0);
      const o = birds.reduce((best, q) => (d(p, q) < d(p, best) ? q : best), birds[0]);
      return { rM: d(p, m), rO: d(p, o) };
    };
    const r0 = at(0);
    const shift = (x: number) => {
      const r = at(x);
      return -20 * Math.log10(r.rM / r0.rM) + 20 * Math.log10(r.rO / r0.rO);
    };
    // Monotonic: toward the water the water gains; back, the birds gain.
    let prev = -Infinity;
    for (let x = -500; x <= 4500; x += 100) {
      const s = shift(x);
      assert.ok(s > prev, `monotonic at ${x}`);
      prev = s;
    }
    assert.equal(shift(-500).toFixed(2), '-0.30'); // "+0.3 dB BIRDS": past the 0.25 dB "AS AT THE START" band
    assert.ok(Math.abs(shift(-500)) >= 0.25, 'the back end reads as a change, not AS AT THE START');
    assert.equal(shift(1500).toFixed(2), '1.10');
    assert.equal(shift(4500).toFixed(2), '4.80'); // "a few meters nearer the water and it takes over"
    // The closing sentence says only what the back end shows (birds forward a little).
    assert.match(F06, /after: 'A few meters nearer the water and it takes over; back at the edge of the path the birds come forward a little\./);
    assert.doesNotMatch(F06, /a few meters back and the birds come forward/);
  });
});
