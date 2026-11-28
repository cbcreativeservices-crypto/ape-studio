/**
 * Round 2 of the lab controls audit (owner 2026-11-25: "Fix-first 15", then
 * "continue with next fixes"), group MIKING — the checker's corrections to
 * round-1 item 4 (M1–M3) and the next Appendix E rows of
 * Downloads/2026-11-25_LAB_CONTROLS_AUDIT.md:
 *
 *  M1  useAimRide reached React once per GLIDE frame (fractional sub-steps):
 *      its reaction now compares the SHOWN pose (whole degrees, whole mm).
 *  M2  a release during a far tap's glide dropped the mirror before the
 *      owed commit landed (numbers jumped back): it stays until rig.version
 *      changes.
 *  M3  sameSceneProps is exported and tested with plain objects.
 *  E3  F15 Keep out: the mic left the drawing (and reached through the wall).
 *  E4  B17 Mid-Side WIDTH: the mono outline shrank past width 0.5.
 *  E5  I07 Vibraphone: SPEED moved mid-run did not change the turning fan.
 *  E6  F11 Calibrator: a SEAT change turned an old failed reading green.
 *  E7  I01c Crash (and I01d Splash): "Who hears it" drew the other setup.
 *  E10 "On the instrument": the card's Pattern line named the first pattern.
 *  E12 SPK rotary: DISTANCE / LOWER AT moved nothing for some pickups.
 *  E14 SPK front/rear: the comb in the well waited for the finger to lift.
 */
import './_mikingTsxLoader.ts';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const read = (f: string) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const M = 'src/screens/lab/miking';

type Pose = { p: { x: number; y: number; z: number }; az: number; el: number };

/* ── M1–M3: useAimRide ─────────────────────────────────────────────────── */

const PC = R(await import(`../${M}/pages/PContext.tsx`));

describe('M1: the AIM ride reaches React only when a shown value changes', () => {
  it('a far tap glides 0° → 30° in 300 fractional sub-steps: 31 shown poses, not 300', () => {
    const base: Pose = { p: { x: 120.4, y: -300.2, z: 40.6 }, az: 0, el: 0 };
    let rawPushes = 0;
    let shownPushes = 0;
    let prevRaw: Pose | null = null;
    let prevShown: Pose | null = null;
    for (let i = 0; i <= 300; i++) {
      const raw = { ...base, az: (30 * i) / 300 };
      const shown = PC.shownPose(raw);
      if (!prevRaw || !PC.samePose(raw, prevRaw)) rawPushes++;
      if (!prevShown || !PC.samePose(shown, prevShown)) shownPushes++;
      prevRaw = raw;
      prevShown = shown;
    }
    assert.equal(rawPushes, 301, 'before: every glide frame crossed to React');
    assert.equal(shownPushes, 31, 'after: once per whole degree');
  });
  it('the shown pose is the pose to the nearest degree and millimetre (what the cells can show)', () => {
    const s = PC.shownPose({ p: { x: 1.4, y: -2.6, z: 3.5 }, az: 12.49, el: -7.51 });
    assert.deepEqual(s, { p: { x: 1, y: -3, z: 4 }, az: 12, el: -8 });
  });
  it('the reaction dedupes on the shown pose but sends the RAW pose (the cells read it, as the saved pose at rest)', () => {
    const s = read(`${M}/pages/PContext.tsx`);
    assert.match(s, /useAnimatedReaction\(\s*\(\) => sv\.value,\s*\(p, prev\) => \{\s*if \(!prev \|\| !samePose\(shownPose\(p\), shownPose\(prev\)\)\) scheduleOnRN\(see, p\);/);
  });
});

describe('M2: a release during a glide keeps the mirror until the commit lands', () => {
  const s = read(`${M}/pages/PContext.tsx`);
  const hook = s.slice(s.indexOf('export function useAimRide'), s.indexOf('export function sameSceneProps'));
  it('rest marks the commit owed at the version it saw; it no longer clears the mirror itself', () => {
    const rest = hook.slice(hook.indexOf('const rest = useCallback'), hook.indexOf('}, []);', hook.indexOf('const rest = useCallback')));
    assert.match(rest, /riding\.current = false;\s*if \(owed\.current == null\) owed\.current = shownVersion\.current;/, 'a second release (a double-tap home mid-glide) keeps the first owed version');
    assert.doesNotMatch(rest, /setSeen\(null\)/, 'before: rest() dropped the mirror while the glide still ran');
  });
  it('the mirror follows the glide while owed, and drops once rig.version changes', () => {
    assert.match(hook, /if \(riding\.current \|\| owed\.current != null\) setSeen/);
    assert.match(hook, /const version = rig\.version;/);
    assert.match(hook, /useEffect\(\(\) => \{\s*if \(owed\.current != null && version > owed\.current && !riding\.current\) \{\s*owed\.current = null;\s*setSeen\(null\);\s*\}\s*\}, \[version\]\);/);
    assert.match(hook, /const ride = useCallback\(\(\) => \{\s*riding\.current = true;\s*\}, \[\]\);/, 'a new ride keeps an owed commit: the mirror drops once a later version lands');
  });
});

describe('M3: sameSceneProps, with plain objects', () => {
  const same = PC.sameSceneProps as (a: unknown, b: unknown) => boolean;
  const cb = () => {};
  const mics = [{ slot: 'A' }];
  const rig = (over: Record<string, unknown> = {}) => ({ mics, version: 3, preview: cb, ...over });
  it('a fresh rig object with the same fields is the same scene', () => {
    assert.equal(same({ rig: rig(), view: 'top', slots: ['A'] }, { rig: rig(), view: 'top', slots: ['A'] }), true);
  });
  it('one rig field changed (a commit: version, mics) is a different scene', () => {
    assert.equal(same({ rig: rig(), view: 'top' }, { rig: rig({ version: 4 }), view: 'top' }), false);
    assert.equal(same({ rig: rig(), view: 'top' }, { rig: rig({ mics: [{ slot: 'A' }] }), view: 'top' }), false);
  });
  it('arrays compare element by element; other props by identity; key counts must match', () => {
    assert.equal(same({ rig: rig(), slots: ['A', 'B'] }, { rig: rig(), slots: ['A', 'B'] }), true);
    assert.equal(same({ rig: rig(), slots: ['A', 'B'] }, { rig: rig(), slots: ['A'] }), false);
    assert.equal(same({ rig: rig(), view: 'top' }, { rig: rig(), view: 'side' }), false);
    assert.equal(same({ rig: rig(), wedge: { at: 1 } }, { rig: rig(), wedge: { at: 1 } }), false, 'a fresh object prop is a change (the pages memo it)');
    assert.equal(same({ rig: rig(), view: 'top' }, { rig: rig(), view: 'top', w: 3 }), false);
    assert.equal(same({ rig: rig(), view: 'top' }, { rig: rig({ extra: 1 }), view: 'top' }), false);
  });
});

/* ── E3: F15 Keep out ──────────────────────────────────────────────────── */

const KO = R(await import(`../${M}/lessons/f15Machinery/KeepOutStep.tsx`));
const F15G = R(await import(`../${M}/lessons/f15Machinery/geometry.ts`));
const MS = R(await import(`../${M}/lessons/shared/measure/measureSpec.ts`));

describe('E3: F15 Keep out — the mic stays in the drawing and in the room', () => {
  const body = MS.MEAS_DIMS.bodyHalf.mm;
  const OLD_BOX = { u0: -900, u1: 2350, v0: -1250, v1: 1250 };
  /** The mic's front at p, its body pointing away from the fan, and the ring round p. */
  const extent = (d: number, a: number) => {
    const p = KO.probeAt(d, a);
    const ux = Math.cos((a * Math.PI) / 180);
    const uz = Math.sin((a * Math.PI) / 180);
    return { p, tail: { x: p.x + ux * body, z: p.z + uz * body } };
  };
  const inside = (b: typeof OLD_BOX, q: { x: number; z: number }) => q.x >= b.u0 && q.x <= b.u1 && q.z >= b.v0 && q.z <= b.v1;
  it('before: over the old lanes the mic left the old frame, and reached through the wall', () => {
    let lost = 0;
    let walled = 0;
    for (let a = 0; a <= 180; a += 5)
      for (let d = 200; d <= 2200; d += 25) {
        const e = extent(d, a);
        if (!inside(OLD_BOX, e.p)) lost++;
        if (e.p.x < F15G.WALL_X) walled++;
      }
    assert.ok(lost > 500, `${lost} lane positions drew the mic off the picture`);
    assert.ok(walled > 0, `${walled} positions behind the wall`);
  });
  it('after: every DISTANCE step at every ANGLE draws the whole mic inside the frame, in front of the wall', () => {
    for (let a = 0; a <= 180; a += 5) {
      const top = KO.reachAt(a);
      assert.equal(top % 25, 0, 'the reach sits on the 25 mm step');
      for (let k = 0; k <= 80; k++) {
        const d = Math.min(top, Math.round((KO.D_MIN + (k / 80) * (top - KO.D_MIN)) / 25) * 25);
        const e = extent(d, a);
        assert.ok(inside(KO.KEEP_OUT_BOX, e.p) && inside(KO.KEEP_OUT_BOX, e.tail), `a ${a}° d ${d}: in the frame`);
        assert.ok(e.tail.x > F15G.WALL_X + 40, `a ${a}° d ${d}: in front of the wall`);
      }
    }
  });
  it('the lane is unchanged wherever the wall is not in the way (0°–90°: 0.2–2.2 m)', () => {
    for (let a = 0; a <= 90; a += 5) assert.equal(KO.reachAt(a), 2200);
    assert.equal(KO.reachAt(180), 1550);
    assert.ok(KO.reachAt(135) < 2200 && KO.reachAt(135) > KO.reachAt(180));
  });
  it('the page wires the reach: DISTANCE spans it, ANGLE clamps to it, the frame is KEEP_OUT_BOX', () => {
    const s = read(`${M}/lessons/f15Machinery/KeepOutStep.tsx`);
    assert.match(s, /value: \(d - D_MIN\) \/ \(dMax - D_MIN\)/);
    assert.match(s, /setD\(\(dd\) => Math\.min\(dd, reachAt\(na\)\)\);/);
    assert.match(s, /const box = KEEP_OUT_BOX;/);
    assert.doesNotMatch(s, /u0: -900, u1: 2350/);
  });
});

/* ── E4: B17 Mid-Side width ────────────────────────────────────────────── */

const AR = R(await import(`../${M}/lessons/shared/sports/arenaPages.tsx`));
const DM = R(await import(`../${M}/lessons/shared/sports/downmix.ts`));

describe('E4: B17 Mid-Side — the mono outline never moves with WIDTH', () => {
  const ks: number[] = [];
  for (let k = 0; k <= AR.MS_K_MAX + 1e-9; k += 0.05) ks.push(Math.round(k * 100) / 100);
  const bruteMax = (k: number) => {
    let m = 0;
    for (let d = -180; d <= 180; d += 0.1) m = Math.max(m, Math.abs(DM.msDecode(d, k).L), Math.abs(DM.msDecode(d, k).R));
    return m;
  };
  it('before: the old per-width scale shrank the mono outline (⅔ at k 1.0, ½ at k 1.5)', () => {
    const oldScale = (k: number) => 1 / Math.max(1, ...[-180, -90, 0, 90].map((q) => Math.max(Math.abs(DM.msDecode(q, k).L), Math.abs(DM.msDecode(q, k).R))));
    assert.equal(oldScale(0.5), 1);
    assert.equal(oldScale(1).toFixed(2), '0.67');
    assert.equal(oldScale(1.5).toFixed(2), '0.50');
  });
  it('msPeak is the true peak of |L| and |R| at every width', () => {
    for (const k of ks) assert.ok(Math.abs(AR.msPeak(k) - bruteMax(k)) < 1e-4, `k ${k}`);
  });
  it('after: ONE scale; every lobe fits the outer ring at every width, and the widest just touches it', () => {
    for (const k of ks) assert.ok(bruteMax(k) * AR.MS_SCALE <= 1 + 1e-6, `k ${k}`);
    assert.ok(Math.abs(bruteMax(AR.MS_K_MAX) * AR.MS_SCALE - 1) < 1e-4);
    const s = read(`${M}/lessons/shared/sports/arenaPages.tsx`);
    assert.match(s, /const scale = MS_SCALE;/);
    assert.doesNotMatch(s, /const peak = Math\.max\(1, \.\.\.\[-180, -90, 0, 90\]/);
  });
  it('the mono sum is the Mid alone at every width (what the outline draws)', () => {
    for (const k of ks) for (let d = -180; d <= 180; d += 15) assert.ok(Math.abs(DM.msDecode(d, k).mono - DM.msDecode(d, 0).mono) < 1e-12);
  });
});

/* ── E5: I07 Vibraphone fan ────────────────────────────────────────────── */

const MSD = R(await import(`../${M}/lessons/shared/mallets/MSound.tsx`));

describe('E5: I07 Vibraphone — SPEED moved mid-run turns the fan at the new speed', () => {
  it('fanAngleAfter: 90 rpm for 8 s is 12 turns; re-aimed at 3 s to 150 rpm it ends 4.5 + 12.5 turns on', () => {
    const turns = (rad: number) => rad / (2 * Math.PI);
    assert.ok(Math.abs(turns(MSD.fanAngleAfter(0, 90, 8000)) - 12) < 1e-9);
    const at3 = MSD.fanAngleAfter(0, 90, 3000);
    assert.ok(Math.abs(turns(MSD.fanAngleAfter(at3, 150, 5000)) - 17) < 1e-9);
  });
  it('the SPEED lane re-aims a running fan for the rest of its run, from where it is', () => {
    const s = read(`${M}/lessons/shared/mallets/MSound.tsx`);
    assert.match(s, /onChange: \(x\) => \{\s*const r = Math\.round\(25 \+ x \* 125\);\s*setRpm\(r\);[\s\S]{0,200}if \(spinning && r !== rpm\) \{\s*const left = runEnd\.current - Date\.now\(\);\s*if \(left > 0\) spin\(r, left\);/);
    assert.match(s, /runEnd\.current = Date\.now\(\) \+ FAN_RUN_S \* 1000;\s*spin\(rpm, FAN_RUN_S \* 1000\);/);
    assert.match(s, /angle\.value = withTiming\(fanAngleAfter\(angle\.value, r, ms\), \{ duration: ms, easing: Easing\.linear \}/);
    assert.doesNotMatch(s, /onChange: \(x\) => setRpm\(/, 'before: SPEED only stored the number');
  });
});

/* ── E6: F11 Calibrator check ──────────────────────────────────────────── */

const CC = R(await import(`../${M}/lessons/shared/measure/CalibratorCheck.tsx`));
const CAL = R(await import(`../${M}/lessons/shared/measure/calibrator.ts`));

describe('E6: F11 Calibrator — a SEAT change after READ BEFORE clears the old reading', () => {
  it('the fault: the loose reading fails, the firm seat passes, so the old number took the new seat\'s green', () => {
    const sc = CAL.CAL_SCENARIOS.find((s: { id: string }) => s.id === 'good');
    const loose = CAL.runCheck(sc, 'loose');
    const firm = CAL.runCheck(sc, 'seated');
    assert.equal(loose.pre.stable && loose.pre.within, false);
    assert.equal(firm.pre.stable && firm.pre.within, true);
    assert.notEqual(sc.pre.loose, sc.pre.seated);
  });
  it('seatPick: after a reading it clears; before one it only picks; during and after the run it refuses', () => {
    assert.deepEqual(CC.seatPick('before', 92.4), { allowed: true, clear: true });
    assert.deepEqual(CC.seatPick('before', null), { allowed: true, clear: true }, 'a "no stable reading" is a reading too');
    assert.deepEqual(CC.seatPick('seat', undefined), { allowed: true, clear: false });
    assert.deepEqual(CC.seatPick('run', 94), { allowed: false, clear: false });
    assert.deepEqual(CC.seatPick('after', 94), { allowed: false, clear: false });
  });
  it('the SEAT key uses it: the reading and the phase go back to the first step', () => {
    const s = read(`${M}/lessons/shared/measure/CalibratorCheck.tsx`);
    assert.match(s, /const s = seatPick\(phase, pre\);\s*if \(!s\.allowed \|\| id === seat\) return;\s*setSeat\(id as Seat\);\s*if \(s\.clear\) \{\s*setPre\(undefined\);\s*setPhase\('seat'\);/);
  });
});

/* ── E7: I01c Crash / I01d Splash, "Who hears it" ──────────────────────── */

const { lessonById } = R(await import(`../${M}/data/lessons.ts`));
const CYM = R(await import(`../${M}/lessons/shared/cymbals/cymbalLesson.ts`));
const CS = R(await import(`../${M}/lessons/shared/cymbals/CymbalSound.tsx`));
const TY = R(await import(`../${M}/engine/model/types.ts`));

describe('E7: the arrivals step draws the setup its sources belong to', () => {
  const inTop = (b: { u0: number; u1: number; v0: number; v1: number }, p: { x: number; z: number }) => p.x >= b.u0 && p.x <= b.u1 && p.z >= b.v0 && p.z <= b.v1;
  for (const id of ['I01a', 'I01b', 'I01c', 'I01d', 'I01e']) {
    it(`${id}: on every setup, the cymbal's strike lies in the frame of the setup drawn`, () => {
      const L = lessonById(id);
      const A = CYM.cymOf(L).arrivals;
      const strike = A.sources[0].p;
      for (const v of L.model.variants) {
        const drawn = CS.arrivalsVariant(L.model, v.id);
        assert.ok(inTop(TY.viewsOf(L.model, drawn).top, strike), `${id} ${v.id}: drawn ${drawn}`);
        if (L.model.viewsByVariant?.[v.id]) {
          // The fault: that setup's own frame does not hold the strike the numbers come from.
          assert.equal(inTop(TY.viewsOf(L.model, v.id).top, strike), false, `${id} ${v.id}: before, the picture and the numbers disagreed`);
          assert.equal(drawn, L.model.defaultVariant);
        } else assert.equal(drawn, v.id, 'a setup in the same place is drawn as chosen');
      }
    });
  }
  it('CymbalSound draws the arrivals background with arrivalsVariant', () => {
    const s = read(`${M}/lessons/shared/cymbals/CymbalSound.tsx`);
    assert.match(s, /const arrivalsOn = arrivalsVariant\(lesson\.model, variant\);\s*const Background = useCallback\(\(p: \{ view: ViewId \}\): ReactElement => <Instrument view=\{p\.view\} variant=\{arrivalsOn\} \/>, \[Instrument, arrivalsOn\]\);/);
  });
});

/* ── E10: the Pattern line on "On the instrument" ──────────────────────── */

const PM = R(await import(`../${M}/pages/PMicrophone.tsx`));
const { MIC_TYPES } = R(await import(`../${M}/data/micTypes.ts`));

describe('E10: "On the instrument" — the Pattern line names the pattern picked', () => {
  const multi = Object.values(MIC_TYPES as Record<string, { id: string; patterns: { id: string }[] }>).filter((t) => t.patterns.length > 1);
  it(`${multi.length} multi-pattern types: each pattern gets its own line; no pattern given = the first, as before`, () => {
    assert.ok(multi.length >= 10, `${multi.length} types with several patterns`);
    for (const t of multi) {
      const lines = t.patterns.map((p) => PM.plainLines(t, undefined, p.id).pattern);
      assert.equal(new Set(lines).size, new Set(t.patterns.map((p) => p.id)).size, `${t.id}: ${lines.join(' | ')}`);
      // The TYPE card (no pattern picked) names the first pattern, then every pattern the mic switches to.
      const card = PM.plainLines(t).pattern;
      assert.ok(card.startsWith(PM.plainLines(t, undefined, t.patterns[0].id).pattern + ' (switchable: '), `${t.id}: ${card}`);
      for (const p of t.patterns) assert.ok(card.includes((p as { label: string }).label.replace(/\s*\(.*\)$/, '')), `${t.id}: names ${p.id}`);
    }
    const ldc = multi.find((t) => t.patterns.some((p) => p.id === 'figure8'))!;
    assert.match(PM.plainLines(ldc, undefined, 'figure8').pattern, /^Pattern: figure-8/);
  });
  it('PMicOnIt passes the picked pattern', () => {
    assert.match(read(`${M}/pages/PMicOnIt.tsx`), /const pl = plainLines\(t, C\.words, pat\);/);
  });
});

/* ── E12, E14: SPK ─────────────────────────────────────────────────────── */

const SPK = R(await import(`../${M}/lessons/spk/pages.tsx`));
const LM = R(await import(`../${M}/lessons/shared/speakers/leslieMics.ts`));
const POLAR = R(await import(`../${M}/engine/physics/polar.ts`));
const VEC = R(await import(`../${M}/engine/geometry/vec.ts`));

describe('E12: SPK rotary — DISTANCE and LOWER AT locked where they move nothing', () => {
  const ARRS = ['upper', 'upperLower', 'xyLower', 'sidesLower', 'room'] as const;
  it('the physics: the room pair ignores the distance; "one mic, upper" and the room pair have no lower mic', () => {
    assert.deepEqual(LM.leslieMics('room', 40, 40, 'front'), LM.leslieMics('room', 300, 300, 'back'));
    for (const a of ARRS) {
      const hasLower = LM.leslieMics(a, 100, 100, 'front').some((m: { level: string }) => m.level === 'lower');
      assert.equal(hasLower, a !== 'upper' && a !== 'room', a);
      if (!hasLower) assert.deepEqual(LM.leslieMics(a, 100, 100, 'front'), LM.leslieMics(a, 100, 100, 'back'), `${a}: LOWER AT moves nothing`);
      if (a !== 'room') assert.notDeepEqual(LM.leslieMics(a, 40, 40, 'front'), LM.leslieMics(a, 300, 300, 'front'), `${a}: DISTANCE moves a mic`);
    }
  });
  it('rotaryLocks locks exactly those, with a reason', () => {
    for (const a of ARRS) {
      const hasLower = LM.leslieMics(a, 100, 100, 'front').some((m: { level: string }) => m.level === 'lower');
      const k = SPK.rotaryLocks(a, hasLower);
      assert.equal(k.dist !== undefined, a === 'room', `${a} DISTANCE`);
      assert.equal(k.lower !== undefined, !hasLower, `${a} LOWER AT`);
    }
    const s = read(`${M}/lessons/spk/pages.tsx`);
    assert.match(s, /locked: rotaryLocks\(arr, hasLower\)\.dist,/);
    assert.match(s, /id: 'lower', label: 'LOWER AT',[^\n]*locked: rotaryLocks\(arr, hasLower\)\.lower,/);
  });
});

describe('E14: SPK front/rear — the comb follows the drag', () => {
  const cone = { x: 0, y: -200, z: 0 };
  const back = { x: 120, y: -200, z: 0 };
  const a: Pose = { p: { x: -80, y: -200, z: 30 }, az: 0, el: 0 };
  const b: Pose = { p: { x: 260, y: -210, z: -20 }, az: 180, el: 0 };
  it('pairGain is the page\'s old gain formula (the drawn comb at rest is unchanged)', () => {
    // The old inline gainOf (spk/pages.tsx before round 2), verbatim.
    const gainOf = (pose: Pose, s: typeof cone, p: string) => {
      const r = Math.max(1, VEC.dist(pose.p, s)) / 1000;
      return Math.max(0.001, Math.abs(p === 'cardioid' ? 0.5 + 0.5 * Math.cos((POLAR.arrivalAngle(pose, s) * Math.PI) / 180) : 1)) / r;
    };
    for (const pat of ['cardioid', 'omni']) for (const [pose, s] of [[a, cone], [b, back], [b, cone]] as const) assert.equal(SPK.pairGain(pose, s, pat), gainOf(pose, s, pat));
    const n = SPK.pairNow(a, b, cone, back, 'cardioid', 'cardioid');
    assert.equal(n.dMm, VEC.dist(b.p, back) - VEC.dist(a.p, cone));
    assert.equal(n.gA, SPK.pairGain(a, cone, 'cardioid'));
    assert.equal(n.gB, SPK.pairGain(b, back, 'cardioid'));
  });
  it('samePairShown: a sub-millimetre glide step is the same picture; a millimetre is not', () => {
    const n = SPK.pairNow(a, b, cone, back, 'cardioid', 'cardioid');
    const nudge = (dx: number) => SPK.pairNow(a, { ...b, p: { ...b.p, x: b.p.x + dx } }, cone, back, 'cardioid', 'cardioid');
    assert.equal(SPK.samePairShown(n, nudge(0.01)), true);
    assert.equal(SPK.samePairShown(n, nudge(3)), false);
  });
  it('the well draws LivePairComb, fed by a reaction on the rig\'s shared poses A and B', () => {
    const s = read(`${M}/lessons/spk/pages.tsx`);
    assert.match(s, /const a = rig\.pose\.A;\s*const b = rig\.pose\.B;/);
    assert.match(s, /useAnimatedReaction\(\s*\(\) => pairNow\(a\.value, b\.value, sFront, sBack, patA, patB\),\s*\(v, prev\) => \{\s*if \(!prev \|\| !samePairShown\(v, prev\)\) scheduleOnRN\(setNow, v\);/);
    assert.match(s, /<LivePairComb rig=\{rig\} sFront=\{sFront\} sBack=\{sBack\} patA=\{A\.pattern\} patB=\{B\.pattern\} sEff=\{sEff\}/);
    assert.match(s, /const gA = pairGain\(A\.pose, sFront, A\.pattern\);\s*const gB = pairGain\(B\.pose, sBack, B\.pattern\);/, 'the bezel and the comb share one gain');
    assert.doesNotMatch(s, /<PairComb w=\{wellW\}/, 'before: the comb read the saved poses');
  });
});

/* ── Checker corrections (owner 2026-11-25, round 2) ───────────────────── */

describe('checker 1: "Who hears it" says when it draws another setup than the one chosen', () => {
  for (const id of ['I01c', 'I01d']) {
    it(`${id}: the own-frame setup's looking line names the setup drawn; the default setup's is unchanged`, () => {
      const L = lessonById(id);
      const A = CYM.cymOf(L).arrivals;
      const own = L.model.variants.find((v: { id: string }) => L.model.viewsByVariant?.[v.id])!;
      const def = L.model.variants.find((v: { id: string }) => v.id === L.model.defaultVariant)!;
      const drawn = CS.arrivalsVariant(L.model, own.id);
      const line = CS.arrivalsLooking(L.model, A.looking, own.id, drawn);
      assert.equal(line, `${A.looking} · drawn with ${def.phrase}: the times belong to it`);
      assert.equal(CS.arrivalsLooking(L.model, A.looking, def.id, CS.arrivalsVariant(L.model, def.id)), A.looking);
    });
  }
  it('CymbalSound passes the memoized words to the arrivals step', () => {
    const s = read(`${M}/lessons/shared/cymbals/CymbalSound.tsx`);
    assert.match(s, /const arrivalsWords = useMemo\(\(\) => \(arrivalsOn === variant \? A : \{ \.\.\.A, looking: arrivalsLooking\(lesson\.model, A\.looking, variant, arrivalsOn\) \}\), \[A, arrivalsOn, variant, lesson\.model\]\);\s*const arrivals = useArrivalsStep\(\{ words: arrivalsWords,/);
  });
});

describe('checker 2: F15 ANGLE says when the wall stops the mic', () => {
  it('the ANGLE lane names the wall\'s stop where the reach is short of 2.2 m', () => {
    const s = read(`${M}/lessons/f15Machinery/KeepOutStep.tsx`);
    assert.match(s, /format: \(\) => `\$\{a\}° off the airflow\$\{dMax < D_MAX \? ` · the wall stops the mic at \$\{fmtMetres\(dMax\)\}` : ''\}`,/);
    assert.ok(KO.reachAt(180) < KO.D_MAX && KO.reachAt(90) === KO.D_MAX);
  });
});

describe('checker 4: single-pattern TYPE cards are unchanged', () => {
  it('a mic with one pattern gets no "(switchable: …)"', () => {
    const one = Object.values(MIC_TYPES as Record<string, { id: string; patterns: { id: string }[] }>).filter((t) => t.patterns.length === 1);
    assert.ok(one.length > 40);
    for (const t of one) assert.equal(PM.plainLines(t).pattern, PM.plainLines(t, undefined, t.patterns[0].id).pattern, t.id);
  });
});
