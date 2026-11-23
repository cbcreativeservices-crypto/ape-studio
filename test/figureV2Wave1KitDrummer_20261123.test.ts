/**
 * FIGURE V2 — WAVE 1: THE KIT DRUMMER IN THE APP, BOTH VIEWS (must-do D78,
 * 2026-11-23). The owner passed the example ("Drummer passes") and asked that
 * "all the others can then match the approved example"; the roll-out runs in
 * waves. Wave 1 switches the seated kit drummer on everywhere the app shows
 * him, side view and view from above. Checked here:
 *   • the switch: the kit drummer's family switch is ON; FIGURE_V2_READY (every
 *     later family) stays false and keeps [MD:D78] on its line;
 *   • the kit scene draws the new drummer in both views (KitSide → DrummerSideV2,
 *     KitTop → DrummerTopV2, legs under the drums and the upper body over them);
 *   • every listed call site goes through the new drummer (the kit scene or the
 *     lesson drummer of kitScene/stickPlayer, which now draw the new look);
 *   • from above: ONE FINGER = ONE SHAPE — each hand shows five digits, each one
 *     visible region (counted on a painted grid, as the eye counts them); the
 *     shoes stand on their pedals (the right on the kick pedal, the left along
 *     the hi-hat pedal);
 *   • the labels keep off the new silhouette (stickDrummerCovers reads it);
 *   • the cost: built once per pose, and the Skia nodes and blurs per drummer
 *     counted against the old figure;
 *   • the old renderer's pinned source is untouched.
 * Reads normalise CRLF.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const SH = 'src/screens/lab/miking/lessons/shared';

const CFG = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/figureV2Config.ts'));
const KSA = R(await import('../src/screens/lab/miking/lessons/shared/kitScene/KitSceneArt.tsx'));
const SPL = R(await import('../src/screens/lab/miking/lessons/shared/kitScene/stickPlayer.tsx'));
const TP = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/topPlan.ts'));
const TOP = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/FigureV2Top.tsx'));
const DV = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/drummerV2.tsx'));
const KD = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/kitDrummerV2.tsx'));
const GE = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/geom.ts'));
const SPOSE = R(await import('../src/screens/lab/miking/lessons/shared/kitScene/stickPose.ts'));
const PF = R(await import('../src/screens/lab/miking/lessons/shared/players/PlayerFigure.tsx'));
const DET = await import('../src/screens/lab/miking/lessons/shared/figureV2/detail.tsx');
const { KIT_GROOVE } = R(await import('../src/screens/lab/miking/lessons/shared/kitScene/kitStrokes.ts'));

type Pt = { u: number; v: number };
type El = { type: unknown; props: { children?: unknown; [k: string]: unknown } };

/** Every React element under `node` (props.children, depth first). */
function elements(node: unknown, out: El[] = []): El[] {
  if (Array.isArray(node)) {
    for (const n of node) elements(n, out);
    return out;
  }
  if (node && typeof node === 'object' && 'props' in (node as object)) {
    const e = node as El;
    out.push(e);
    elements(e.props.children, out);
  }
  return out;
}
const fnOf = (e: El) => (typeof e.type === 'function' ? e.type : (e.type as { type?: unknown })?.type) as ((p: object) => unknown) | undefined;
const nameOf = (e: El) => (fnOf(e) as { name?: string } | undefined)?.name;

/** Render function components (and memo) down to the Skia primitives (the
 *  stand-in), with a minimal hook dispatcher for useMemo/useCallback/useRef. */
const require = createRequire(import.meta.url);
const React = require('react');
const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
function expand(node: unknown, out: El[] = []): El[] {
  if (Array.isArray(node)) {
    for (const n of node) expand(n, out);
    return out;
  }
  if (!node || typeof node !== 'object' || !('props' in (node as object))) return out;
  const e = node as El;
  const f = fnOf(e);
  // (the Skia stand-in is one Proxy whose every property is itself: its `name` is no string)
  const name = (f as { name?: unknown } | undefined)?.name;
  if (f && typeof name === 'string' && name !== 'stub') {
    const prev = internals.H;
    internals.H = { useMemo: (g: () => unknown) => g(), useCallback: (g: unknown) => g, useRef: (v: unknown) => ({ current: v }), useContext: () => ctxValue };
    try {
      expand(f({ ...e.props }), out);
    } finally {
      internals.H = prev;
    }
    return out;
  }
  out.push(e);
  expand(e.props.children, out);
  // (a layer's paint is a node too)
  if (e.props.layer) expand(e.props.layer, out);
  return out;
}
/** The figure scale every useContext answers with while counting (detail.tsx's FigureScale). */
let ctxValue: unknown = undefined;
const costOf = (node: unknown, scale?: { ptPerMm: number | null; level?: 'full' | 'lite' }) => {
  ctxValue = scale;
  const els = expand(node);
  ctxValue = undefined;
  return { nodes: els.length, blurs: els.filter((e) => 'blur' in e.props && 'style' in e.props).length };
};

describe('wave 1 — the switch (D78)', () => {
  it('the kit drummer is ON; every later family stays off (FIGURE_V2_READY false, [MD:D78] on its line)', () => {
    assert.equal(CFG.figureV2On('kitDrummer'), true);
    assert.equal(CFG.FIGURE_V2_READY, false);
    const line = read(`${SH}/figureV2/figureV2Config.ts`).split('\n').find((l) => /FIGURE_V2_READY\s*=/.test(l)) ?? '';
    assert.match(line, /= false;.*\[MD:D78\]/);
    assert.deepEqual(Object.keys(CFG.FIGURE_V2_FAMILY), ['kitDrummer'], 'wave 1 switches one family');
  });
});

describe('wave 1 — the kit scene draws the approved look in both views', () => {
  it('side: KitSide → DrummerSide → DrummerSideV2 (the approved FigureV2Side)', () => {
    const side = elements(KSA.KitSide({})).find((e) => nameOf(e) === 'DrummerSide')!;
    const drawn = elements(fnOf(side)!({ ...side.props })).map(nameOf);
    assert.ok(drawn.includes('DrummerSideV2'));
    assert.ok(!drawn.includes('PlayerBehind'));
  });

  it('from above: KitTop → the legs under the drums, the upper body over them, both DrummerTopV2', () => {
    const tree = elements(KSA.KitTop({}));
    const tops = tree.filter((e) => nameOf(e) === 'DrummerTop');
    assert.deepEqual(
      tops.map((e) => e.props.part),
      ['legs', 'upper'],
    );
    const names = tree.map(nameOf);
    // the legs before the kick and the drums, the upper body after the hi-hat
    assert.ok(names.indexOf('KickTop') > tree.indexOf(tops[0]) - 0 && tree.indexOf(tops[1]) > names.indexOf('HiHatTop'));
    for (const t of tops) {
      const drawn = elements(fnOf(t)!({ ...t.props }));
      assert.ok(drawn.map(nameOf).includes('DrummerTopV2'), `${t.props.part}: the new drummer`);
      if (t.props.part === 'legs') assert.ok(drawn.map(nameOf).includes('HiHatPedalTop'), 'the hi-hat pedal under the left shoe');
    }
  });
});

describe('wave 1 — every place this drummer appears goes through the new drummer', () => {
  const sites: [string, RegExp][] = [
    ['m09Overheads/art.tsx', /KitSide|KitTop/],
    ['m09Overheads/pages.tsx', /KitSide|KitTop/],
    ['m09Overheads/PairsScene.tsx', /KitSide|KitTop/],
    ['m10Room/RoomArt.tsx', /KitSide|KitTop/],
    ['m11Kit/art.tsx', /KitSide|KitTop/],
    ['m11Kit/pages.tsx', /KitSide|KitTop/],
    ['m11Kit/PlanScene.tsx', /KitSide|KitTop/],
    ['shared/kitPages/CymbalStrike.tsx', /StrikeArm/],
    ['m02Snare/art.tsx', /LessonDrummer/],
    ['m03Toms/art.tsx', /LessonDrummer/],
    ['shared/drums/UprightSound.tsx', /StrikeArm/],
    ['i01aHiHat/art.tsx', /StickDrummerArt|LessonDrummer|KitAround/],
    ['shared/cymbals/CymbalKitArt.tsx', /StickDrummerArt/],
    ['shared/cymbals/CymbalStrikeFx.tsx', /StrikeArm/],
    ['shared/handdrums/handSoundArt.tsx', /StrikeArm/],
    ['shared/ensemble/BandArt.tsx', /KitSide|KitTop/],
    ['shared/handdrums/HandPlan.tsx', /KitTop/],
    ['shared/speakers/StagePlan.tsx', /KitTop/],
    ['shared/brass/BrassSettingPage.tsx', /KitTop/],
    ['shared/sax/SaxSettingPage.tsx', /KitTop/],
    ['shared/bowed/BowedSettingPage.tsx', /KitTop/],
    ['shared/guitars/StagePlan.tsx', /KitTop/],
    ['shared/speakers/BacklinePlan.tsx', /KitTop/],
  ];
  for (const [f, entry] of sites)
    it(`${f}: draws the drummer through ${entry.source.replace(/\\|/g, ' / ')}, never the old figure on the drummer's pose`, () => {
      const src = read(`src/screens/lab/miking/lessons/${f}`);
      assert.match(src, entry);
      assert.ok(!(/drummerPose\(|viewDrummer\(/.test(src) && /PlayerBehind|PlayerInFront/.test(src)), 'no old figure on the drummer pose');
    });

  it('the entry points draw the new look when the switch is on (kit scene, lesson drummer, phantom, hand-over, strike close-up)', () => {
    const ksa = read(`${SH}/kitScene/KitSceneArt.tsx`);
    assert.match(ksa, /function DrummerSide\(\{ v2 = figureV2On\('kitDrummer'\) \}/);
    assert.match(ksa, /if \(v2\) return <DrummerSideV2 /);
    assert.match(ksa, /function DrummerTop\(\{ part, v2 = figureV2On\('kitDrummer'\) \}/);
    const spl = read(`${SH}/kitScene/stickPlayer.tsx`);
    for (const re of [
      /export function StickDrummerArt\([^)]*v2 = figureV2On\('kitDrummer'\)/,
      /<DrummerSideV2 spec=\{spec\} dim=\{dim\}/,
      /<DrummerTopV2 spec=\{spec\} part="upper" dim=\{dim\}/,
      /<DrummerTopV2 spec=\{spec\} part="legs" dim=\{dim\} \/>/,
      /export function StickHandOver\([^)]*v2 = figureV2On\('kitDrummer'\)/,
      /if \(v2\) return <DrummerNearArmV2 /,
      /export function StrikeArm\([^)]*v2 = figureV2On\('kitDrummer'\)/,
      /<DrummerSideV2 spec=\{closeSpec\(kind\)\} hangLeft dim=\{dim\}/,
    ])
      assert.match(spl, re);
    // a phantom (dim .34) is the same new drummer, receded
    const ph = elements(SPL.StickDrummerArt({ view: 'side', spec: KIT_GROOVE, dim: 0.34 })).find((e) => nameOf(e) === 'DrummerSideV2');
    assert.ok(ph && ph.props.dim === 0.34, 'the phantom: the new drummer at dim .34');
    const top = elements(SPL.StickDrummerArt({ view: 'top', spec: KIT_GROOVE, dim: 0.34 })).find((e) => nameOf(e) === 'DrummerTopV2');
    assert.ok(top && top.props.part === 'upper');
    const over = elements(SPL.StickHandOver({ view: 'side', spec: KIT_GROOVE, dim: 0.5 })).map(nameOf);
    assert.ok(over.includes('DrummerNearArmV2'), 'the hand-over: the same new arm and hand');
    const arm = elements(SPL.StrikeArm({ tip: { x: 0, y: 0 } })).map(nameOf);
    assert.ok(arm.includes('DrummerSideV2'), 'the strike close-up: the same new drummer');
  });
});

/* ── from above: ONE FINGER = ONE SHAPE, counted as the eye counts ── */

describe('wave 1 — from above: each fist one silhouette with its knuckle row, the thumb its own form; the shoes on their pedals', () => {
  const plan = TP.kitDrummerTopPlan();
  type PPart = { name: string; kind: string; digit?: string; layer: 'back' | 'front'; placed: Pt[] };
  const capsule = (a: Pt, b: Pt, r: number) => (q: Pt) => {
    const ab = GE.sub(b, a);
    const t = Math.max(0, Math.min(1, GE.dot(GE.sub(q, a), ab) / (GE.dot(ab, ab) || 1)));
    return Math.hypot(q.u - (a.u + ab.u * t), q.v - (a.v + ab.v * t)) <= r;
  };
  /** The hand painted on a 0.5 mm grid in its paint order (from above: the stick
   *  under the whole hand), then each part's visible regions with their
   *  inscribed width. */
  function regions(h: { parts: PPart[]; butt: Pt; bead: Pt }) {
    const order: [string, (q: Pt) => boolean][] = [['stick', capsule(h.butt, h.bead, 7)]];
    h.parts.forEach((p, i) => order.push([`${i}`, (q: Pt) => GE.inPoly(q, p.placed)]));
    const b = GE.boundsOf(h.parts.flatMap((p) => p.placed));
    const step = 0.5;
    const W = Math.ceil((b.u1 - b.u0) / step) + 3;
    const H = Math.ceil((b.v1 - b.v0) / step) + 3;
    const top: string[] = new Array(W * H).fill('');
    for (let j = 0; j < H; j++)
      for (let i = 0; i < W; i++) {
        const q = { u: b.u0 + (i - 1) * step, v: b.v0 + (j - 1) * step };
        for (let k = order.length - 1; k >= 0; k--)
          if (order[k][1](q)) {
            top[j * W + i] = order[k][0];
            break;
          }
      }
    const seen = new Uint8Array(W * H);
    const out: { id: string; area: number; width: number }[] = [];
    for (let c = 0; c < W * H; c++) {
      const id = top[c];
      if (!id || id === 'stick' || seen[c]) continue;
      const cells: number[] = [];
      const stack = [c];
      seen[c] = 1;
      while (stack.length) {
        const x = stack.pop()!;
        cells.push(x);
        const i = x % W;
        for (const y of [x - 1, x + 1, x - W, x + W]) {
          if (y < 0 || y >= W * H || seen[y] || top[y] !== id) continue;
          if ((y === x - 1 && i === 0) || (y === x + 1 && i === W - 1)) continue;
          seen[y] = 1;
          stack.push(y);
        }
      }
      const inR = new Map<number, number>(cells.map((x) => [x, Infinity]));
      const pass = (xs: number[], nb: number[]) => {
        for (const x of xs) {
          let d = inR.get(x)!;
          for (const o of nb) d = Math.min(d, (inR.has(x + o) ? inR.get(x + o)! : 0) + (Math.abs(o) === 1 || Math.abs(o) === W ? 1 : 1.414));
          inR.set(x, d);
        }
      };
      const sorted = [...cells].sort((p, q) => p - q);
      pass(sorted, [-1, -W, -W - 1, -W + 1]);
      pass(sorted.reverse(), [1, W, W + 1, W - 1]);
      out.push({ id, area: cells.length * step * step, width: 2 * Math.max(...inR.values()) * step });
    }
    return out;
  }

  // A FIST FROM ABOVE (owner 2026-11-23: "knuckles look very odd" — four separate pills read as beads):
  // one silhouette for the hand and the fingers, the knuckle row as four swells on its contour, three
  // short creases from the valleys, the thumb its own form. Five digits: the thumb and four knuckles.
  for (const which of ['near', 'far'] as const)
    it(`the ${which === 'near' ? 'right' : 'left'} fist from above: no outline round any finger; one silhouette whose knuckle row is four swells (an arc), three short creases from the valleys, the thumb one form — five digits`, () => {
      const h = plan.arms[which].placed!;
      assert.equal(h.art.view, plan.faces[which].up === 'thumb' ? 'thumbTop' : 'backTop');
      const art = h.art;
      // no closed outline surrounds a single finger
      const fingers = art.parts.filter((p: { digit?: string }) => p.digit && p.digit !== 'thumb');
      assert.equal(fingers.length, 0, `finger outlines: ${fingers.map((p: { name: string }) => p.name).join(', ')}`);
      assert.deepEqual(art.parts.map((p: { name: string }) => p.name).sort(), ['hand', 'thumb']);
      const body = art.parts.find((p: { name: string }) => p.name === 'hand')!.outline as Pt[];
      const ks = art.knuckles as Pt[];
      assert.equal(ks.length, 4, 'four knuckles');
      // each knuckle a swell ON the one silhouette, a valley between neighbours
      const near = (q: Pt) => Math.min(...body.map((b) => Math.hypot(b.u - q.u, b.v - q.v)));
      for (const k of ks) assert.ok(near(k) <= 1.5, `a knuckle on the silhouette (${near(k).toFixed(1)} mm off)`);
      const front = body.filter((q) => q.u > 85).sort((a, b) => a.v - b.v);
      for (let i = 0; i < 3; i++) {
        const lo = Math.min(ks[i].v, ks[i + 1].v);
        const hi = Math.max(ks[i].v, ks[i + 1].v);
        const between = front.filter((q) => q.v > lo + 1 && q.v < hi - 1);
        const valley = Math.min(...between.map((q) => q.u));
        assert.ok(valley <= Math.min(ks[i].u, ks[i + 1].u) - 2.5, `a valley between knuckles ${i + 1} and ${i + 2} (${valley.toFixed(1)})`);
        // its crease: short, starting at the valley
        const c = art.creases[i] as Pt[];
        const len = c.slice(1).reduce((s, q, j) => s + Math.hypot(q.u - c[j].u, q.v - c[j].v), 0);
        assert.ok(len <= 12 && len >= 4, `crease ${i + 1}: ${len.toFixed(0)} mm`);
        assert.ok(c[c.length - 1].v > lo && c[c.length - 1].v < hi, `crease ${i + 1} ends in its valley`);
      }
      assert.equal(art.creases.length, 3, 'three creases');
      // an arc, not a ruler line: the middle knuckle farthest forward, the little finger's set back
      if (art.view === 'backTop') {
        assert.ok(ks[2].u >= Math.max(ks[0].u, ks[1].u, ks[3].u), 'the middle knuckle farthest forward');
        assert.ok(ks[0].u <= Math.min(ks[1].u, ks[2].u, ks[3].u), 'the little finger’s knuckle set back');
      } else {
        // rolled toward the thumb: the row turns away, each swell smaller toward the little finger
        assert.ok(ks[3].u > ks[2].u && ks[2].u > ks[1].u && ks[1].u > ks[0].u, 'the knuckle row turning away');
      }
      // as the eye counts: the thumb is one visible form, finger-sized; the hand is one region
      const rs = regions(h);
      const iT = h.parts.findIndex((p: PPart) => p.digit === 'thumb');
      const iH = h.parts.findIndex((p: PPart) => p.name === 'hand');
      const thumb = rs.filter((r) => r.id === `${iT}` && r.area >= 4);
      assert.equal(thumb.length, 1, 'the thumb: one visible region');
      assert.ok(thumb[0].width >= 10 && thumb[0].width <= 25, `the thumb ${thumb[0].width.toFixed(0)} mm wide`);
      assert.equal(rs.filter((r) => r.id === `${iH}` && r.area >= 4).length, 1, 'the hand and fingers: one region');
      assert.equal(1 + ks.length, 5, 'five digits: the thumb and four knuckles');
    });

  it('what faces up is drawn (owner: "the thumb is correctly placed under the hand" when the back faces up): the back of the hand — thumb FIRST, the hand over it casting its shadow; the thumb’s side — thumb LAST, along the top of the stick', () => {
    // the right hand is rolled about 45° toward thumb-up (thumb side 0.72 against back 0.66): no margin lets it pass as a back view
    assert.equal(plan.faces.near.up, 'thumb', `right: back ${plan.faces.near.back.toFixed(2)}, thumb ${plan.faces.near.thumb.toFixed(2)}`);
    assert.equal(plan.faces.far.up, 'back', `left: back ${plan.faces.far.back.toFixed(2)}, thumb ${plan.faces.far.thumb.toFixed(2)}`);
    assert.match(read(`${SH}/figureV2/topPlan.ts`), /up: \(back >= thumb \? 'back' : 'thumb'\)/);
    for (const which of ['near', 'far'] as const) {
      const h = plan.arms[which].placed!;
      const names = h.parts.map((p: PPart) => p.name);
      if (plan.faces[which].up === 'back') {
        assert.equal(h.art.view, 'backTop');
        assert.ok(names.indexOf('thumb') < names.indexOf('hand'), `${which}: the thumb before the back of the hand (${names.join(', ')})`);
        const thumb = h.art.parts.find((p: { digit?: string }) => p.digit === 'thumb')!;
        assert.ok(thumb.chain!.pts[0].u < 30, 'the thumb’s root near the wrist end');
      } else {
        assert.equal(h.art.view, 'thumbTop');
        assert.equal(names[names.length - 1], 'thumb', `${which}: the thumb on top, painted last (${names.join(', ')})`);
      }
    }
    const paint = read(`${SH}/figureV2/paint.tsx`);
    assert.match(paint, /casts=\{a\.stickUnder && p\.kind === 'palm' \? 0\.45 : undefined\}/);
  });

  it('each hand from above sits on its own stick (the fulcrum inside the drawn hand) and its thumb lies on the thumb side the 3-D hand has', () => {
    for (const which of ['near', 'far'] as const) {
      const a = plan.arms[which];
      const h = a.placed!;
      assert.ok(h.parts.some((p: PPart) => GE.inPoly(h.F, p.placed)), `${which}: the fulcrum inside the hand`);
      assert.deepEqual(h.F, { u: a.hold!.fulcrum.x, v: a.hold!.fulcrum.z });
      const axis = GE.unit({ u: a.hold!.sk.frame.x.x, v: a.hold!.sk.frame.x.z });
      const tip3 = a.hold!.sk.thumb.joints[a.hold!.sk.thumb.joints.length - 1];
      const wrist = { u: a.hold!.poseWrist.x, v: a.hold!.poseWrist.z };
      const want = Math.sign(GE.crossZ(axis, GE.sub({ u: tip3.x, v: tip3.z }, wrist)));
      const got = Math.sign(GE.crossZ(h.ex, GE.sub(h.thumbTip!, h.wrist)));
      assert.equal(got, want, `${which}: the thumb on the side the 3-D hand has it`);
    }
  });

  it('the right shoe stands on the kick pedal; the left shoe along the hi-hat pedal, turned with it', () => {
    const { RIGHT_BALL, LEFT_LEG } = SPOSE;
    const [r, l] = plan.shoes as { upper: Pt[]; sole: Pt[]; axis: [Pt, Pt] }[];
    assert.ok(GE.inPoly({ u: RIGHT_BALL.x, v: RIGHT_BALL.z }, r.sole), 'the right ball of the foot on the kick pedal');
    assert.ok(GE.inPoly({ u: LEFT_LEG.ball.x, v: LEFT_LEG.ball.z }, l.sole), 'the left ball of the foot on the hi-hat pedal');
    const toe = GE.unit(GE.sub(l.axis[1], l.axis[0]));
    const want = GE.unit({ u: LEFT_LEG.toeDir.x, v: LEFT_LEG.toeDir.z });
    const off = (Math.acos(Math.max(-1, Math.min(1, GE.dot(toe, want)))) * 180) / Math.PI;
    assert.ok(off <= 3, `the left shoe ${off.toFixed(1)}° off the pedal's line`);
  });
});

describe('wave 1 — the labels keep off the new silhouette', () => {
  it('stickDrummerCovers reads the new outlines (with the pose envelope round them)', () => {
    const src = read(`${SH}/kitScene/stickPlayer.tsx`);
    assert.match(src, /if \(figureV2On\('kitDrummer'\) && drummerV2Covers\(viewOf\(view\), spec, u, v, tol\)\) return true;/);
    for (const view of ['side', 'top'] as const) {
      const h = view === 'side' ? KD.kitDrummerPlan().arms.far.placed! : TP.kitDrummerTopPlan().arms.far.placed!;
      const c = h.at({ u: 50, v: 0 });
      assert.ok(DV.drummerV2Covers(view, KIT_GROOVE, c.u, c.v, 0), `${view}: the drawn hand covers its own middle`);
      assert.ok(SPL.stickDrummerCovers(view, KIT_GROOVE, c.u, c.v, 0));
      assert.ok(!DV.drummerV2Covers(view, KIT_GROOVE, c.u + 5000, c.v, 0));
    }
  });
});

describe('wave 1 — cost on a phone', () => {
  it('built once per pose: the top plan and its paths are memoised', () => {
    const a = TP.kitDrummerTopPlan();
    assert.strictEqual(TP.kitDrummerTopPlan(), a);
    assert.strictEqual(TOP.topPaths(a), TOP.topPaths(a));
    assert.strictEqual(KD.kitDrummerPlan(), KD.kitDrummerPlan());
  });

  it('the new drummer’s nodes and blurs per level of detail, against the old figure: at lesson sizes (lite) no more than 1.5× the old nodes and no more blurs', () => {
    const d = SPOSE.drummerPose(KIT_GROOVE);
    const old = (view: 'side' | 'top') => costOf([React.createElement(PF.PlayerBehind, { pose: SPOSE.viewDrummer(d, view).pose }), React.createElement(PF.PlayerInFront, { pose: SPOSE.viewDrummer(d, view).pose })]);
    const sideOld = old('side');
    const topOld = old('top');
    const lesson = { ptPerMm: 0.2 }; // the M09 picture on a 390 pt phone
    const close = { ptPerMm: 1.6 }; // the study page's close-ups
    const sideLite = costOf(React.createElement(DV.DrummerSideV2, {}), lesson);
    const topLite = costOf(React.createElement(DV.DrummerTopV2, {}), lesson);
    const sideFull = costOf(React.createElement(DV.DrummerSideV2, {}), close);
    const topFull = costOf(React.createElement(DV.DrummerTopV2, {}), close);
    const phantom = costOf(React.createElement(DV.DrummerSideV2, { dim: 0.34 }), close);
    const f = (c: { nodes: number; blurs: number }) => `${c.nodes}/${c.blurs}`;
    const msg = `nodes/blurs — side: old ${f(sideOld)}, lite ${f(sideLite)}, full ${f(sideFull)}; top: old ${f(topOld)}, lite ${f(topLite)}, full ${f(topFull)}; phantom ${f(phantom)}`;
    for (const c of [sideOld, topOld, sideLite, topLite, sideFull, topFull]) assert.ok(c.nodes > 20, `counted: ${msg}`);
    assert.ok(sideLite.nodes <= 1.5 * sideOld.nodes && sideLite.blurs <= sideOld.blurs, `side at lesson size: ${msg}`);
    assert.ok(topLite.nodes <= 1.5 * topOld.nodes && topLite.blurs <= topOld.blurs, `top at lesson size: ${msg}`);
    assert.equal(phantom.blurs, 0, `a phantom (dim .34) is drawn lite at any size: ${msg}`);
    assert.ok(phantom.nodes <= sideLite.nodes + 4, msg);
    // full detail (the close-ups, full screen): a budget the later waves keep
    assert.ok(sideFull.nodes <= 800 && sideFull.blurs <= 170, msg);
    assert.ok(topFull.nodes <= 560 && topFull.blurs <= 110, msg);
  });

  it('the hair bug cannot return: no blur reaches the canvas under ≈ 0.75 device pixel (it takes its whole path with it on CanvasKit); every figure blur goes through the guard', () => {
    const DT = R(DET);
    assert.equal(DT.blurShows(1.1, { ptPerMm: 0.2 }, 1), false, 'the hair’s 1.1 mm soft edge at a lesson’s 0.2 pt/mm is left out');
    assert.equal(DT.blurShows(1.1, { ptPerMm: 1.6 }, 1), true, 'and kept in the close-ups');
    for (const f of ['paint.tsx', 'FigureV2Side.tsx', 'FigureV2Top.tsx', 'lite.tsx', 'drummerV2.tsx'])
      assert.doesNotMatch(read(`${SH}/figureV2/${f}`), /<BlurMask/, `${f}: a raw BlurMask`);
    // the hair is a plain gradient fill: its soft edge is the guarded Blur
    const side = read(`${SH}/figureV2/FigureV2Side.tsx`);
    assert.match(side, /<Path path=\{P\.hair\}>\s*<LinearGradient [^>]*\/>\s*<Blur mm=\{1\.1\} \/>/);
    // the scenes that fit the art tell the figure its scale, inside the canvas
    assert.match(read('src/screens/lab/miking/engine/scene/PlacementScene.tsx'), /<FigureScale ptPerMm=\{base\.s\}>\s*<Instrument /);
    assert.match(read('src/screens/lab/miking/engine/scene/InstrumentFigure.tsx'), /<FigureScale ptPerMm=\{xf\.s\}>\s*<Instrument /);
  });

  it('the figure is a cached layer: the kit scene’s drummer and the new drummers are memoised components', () => {
    const ksa = read(`${SH}/kitScene/KitSceneArt.tsx`);
    assert.match(ksa, /const DrummerSide = memo\(function DrummerSide/);
    assert.match(ksa, /const DrummerTop = memo\(function DrummerTop/);
    const dv = read(`${SH}/figureV2/drummerV2.tsx`);
    assert.match(dv, /export const DrummerSideV2 = memo\(/);
    assert.match(dv, /export const DrummerTopV2 = memo\(/);
    // nothing per frame: no clock, no animation hooks in the new drummer
    for (const f of ['drummerV2.tsx', 'FigureV2Top.tsx', 'FigureV2Side.tsx', 'topPlan.ts'])
      assert.doesNotMatch(read(`${SH}/figureV2/${f}`), /useClock|useFrameCallback|useSharedValue|useDerivedValue|requestAnimationFrame/, f);
  });
});

describe('wave 1 — the old renderer is untouched (other families still use it)', () => {
  it('PlayerFigure keeps its head and figure source', () => {
    const src = read(`${SH}/players/PlayerFigure.tsx`);
    assert.match(src, /return <FigureMass path=\{fill\} tone="skin" contour=\{2\.6\} \/>;/);
    assert.match(src, /export function PlayerBehind\(\{ pose, dim = 1, part = 'all' \}/);
    assert.match(src, /export function headAbove\(c: Pt, r: number\): HeadPaths \{/);
  });
});
