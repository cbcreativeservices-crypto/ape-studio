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
const PALETTE = await import('../src/screens/lab/miking/lessons/shared/figureV2/palette.ts');
const MAT_SHIRT = () => (PALETTE as unknown as { MAT: { shirt: { form: string[] } } }).MAT.shirt.form;
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
    // (wave 1 switches one family; later waves' families are listed OFF until their go — wave 3a: sideStanding, sideDeskTalker)
    const on = Object.entries(CFG.FIGURE_V2_FAMILY).filter(([, v]) => v).map(([k]) => k);
    // (wave 3a turned the standing figures on: the singer in E01 and E03)
    // (2026-11-24, overnight roll-out: every family below is ON in the working tree; any family the owner has not approved is switched OFF before OTA 16, [MD:D78])
    assert.deepEqual(on, ['kitDrummer', 'sideStanding', 'sideDeskTalker', 'sidePlayers', 'familyBowed', 'familyBrass', 'familyLowBrass', 'familySax', 'familyWinds', 'familySmallPerc', 'familyLutes', 'familyFreeReeds', 'frontAndBoom', 'familyMetal'], 'the families switched on so far');
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
      assert.equal(h.art.view, 'backTop', 'a matched grip from above: the back of the hand');
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
      assert.ok(art.creases.length >= 3, 'three knuckle creases (the first three; a thumb may add its joint crease)');
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

  // THE THUMB FROM ABOVE (owner 2026-11-23: "right hand thumb looks like a sausage on top", and a crop
  // of its rounded root sitting on the hand above the cuff): not a closed capsule — its base lies in
  // the hand (the thenar mound is the hand's own surface), only its outer edge and the gap line to the
  // index are drawn, nothing of it near the wrist; ≈ 55–65 mm free from the web, tapering from its
  // knuckle to a rounded tip at the fulcrum.
  for (const which of ['near', 'far'] as const)
    it(`the ${which === 'near' ? 'right' : 'left'} thumb from above: no capsule — its base in the hand, no line or end near the wrist, 55–65 mm free, tapering, its tip at the fulcrum`, () => {
      const h = plan.arms[which].placed!;
      const art = h.art;
      const thumb = art.parts.find((p: { digit?: string }) => p.digit === 'thumb')!;
      const body = art.parts.find((p: { name: string }) => p.name === 'hand')!.outline as Pt[];
      const out = thumb.outline as Pt[];
      // drawn by an open edge only (never its closed outline), and its base shares the hand
      assert.ok(thumb.edge && thumb.edge.length >= 4, 'the thumb draws its outer edge only');
      const inside = out.filter((q) => GE.inPoly(q, body)).length;
      assert.ok(inside >= 2 && inside / out.length >= 0.1, `its base lies in the hand (${inside} of ${out.length} points)`);
      // nothing of the thumb within 25 mm of the wrist (no rounded root above the cuff)
      const near = Math.min(...out.map((q) => Math.hypot(q.u, q.v)), ...(thumb.edge as Pt[]).map((q) => Math.hypot(q.u, q.v)));
      assert.ok(near >= 25, `the thumb comes ${near.toFixed(0)} mm from the wrist`);
      // its drawn edge starts at the web / knuckle region
      const web = art.thumbWeb as Pt;
      const e0 = (thumb.edge as Pt[])[0];
      assert.ok(e0.u >= web.u - 8, `the edge starts at the web (${e0.u.toFixed(0)} vs ${web.u.toFixed(0)})`);
      // free length: web → tip
      const tip = art.thumbTip as Pt;
      const free = Math.hypot(tip.u - web.u, tip.v - web.v) + 0;
      assert.ok(free >= 52 && free <= 66, `the free thumb ${free.toFixed(0)} mm`);
      // tapering: its width across its axis at the knuckle > at the end joint > near the tip
      const j = thumb.chain!.pts as Pt[];
      const widthAt = (c: Pt, dir: Pt) => {
        const n = { u: -dir.v, v: dir.u };
        const ts: number[] = [];
        for (let i = 0; i < out.length; i++) {
          const a = out[i];
          const b = out[(i + 1) % out.length];
          const den = (b.u - a.u) * n.v - (b.v - a.v) * n.u;
          if (Math.abs(den) < 1e-9) continue;
          // a + (b-a)s = c + n t  →  solve
          const s2 = ((c.u - a.u) * n.v - (c.v - a.v) * n.u) / den;
          const t2 = ((c.u - a.u) * (b.v - a.v) - (c.v - a.v) * (b.u - a.u)) / den;
          if (s2 >= 0 && s2 <= 1) ts.push(t2);
        }
        return ts.length >= 2 ? Math.max(...ts) - Math.min(...ts) : 0;
      };
      const ax = GE.unit(GE.sub(j[2], j[0]));
      const wK = widthAt(j[0], ax);
      const wI = widthAt(j[1], ax);
      const wT = widthAt(GE.lerp(j[1], j[2], 0.75), ax);
      assert.ok(wK >= 18 && wK <= 24, `at its knuckle ${wK.toFixed(0)} mm`);
      assert.ok(wK > wI && wI > wT, `tapering ${wK.toFixed(0)} > ${wI.toFixed(0)} > ${wT.toFixed(0)} mm`);
      // its pad at the fulcrum, against the stick's SIDE (not over it): along the stick near the
      // fulcrum, beside its axis by about the stick's and the tip's radii (placed, as the eye sees it)
      const tipV = h.at(tip);
      const sd = GE.unit(GE.sub(h.bead, h.butt));
      const rel = GE.sub(tipV, h.F);
      const along = GE.dot(rel, sd);
      const side = Math.abs(GE.crossZ(sd, rel));
      assert.ok(Math.abs(along) <= 18, `the tip ${along.toFixed(0)} mm along the stick from the fulcrum`);
      assert.ok(side >= 5 && side <= 16, `the tip ${side.toFixed(0)} mm beside the stick's axis (its side, not over it)`);
      // in the hand's soft shade: no cylinder of its own, no flat dark fill
      assert.ok(thumb.shade, 'the thumb is shaded softly from the hand’s edge');
      assert.equal(art.nails.length, 0, 'no nail: from above the thumb under the hand shows its side');
    });

  it('the thumb is never a capsule at any level: full paints its edge (not its outline); lite draws only the parts’ edges', () => {
    assert.match(read(`${SH}/figureV2/paint.tsx`), /<Path path=\{edge \?\? path\} style="stroke"/);
    assert.match(read(`${SH}/figureV2/paint.tsx`), /edge=\{p\.edge\} shade=\{p\.shade\} \/>/);
    const lite = read(`${SH}/figureV2/lite.tsx`);
    assert.match(lite, /const digitEdges = a\.edges \?/);
    assert.doesNotMatch(lite, /path=\{a\.front\} style="stroke"/);
  });

  it('both hands from above are back-of-hand views (owner: "thumb is underneath as the fulcrum"): the thumb painted FIRST, under the hand, showing only beyond the hand’s inner edge beside the stick; the hand’s shadow on it soft', () => {
    // the roll is recorded, not drawn: the right hand is rolled about 45° (thumb side up 0.72, back 0.66)
    assert.ok(plan.faces.near.thumb > 0.6 && plan.faces.near.back > 0.6, `right: back ${plan.faces.near.back.toFixed(2)}, thumb ${plan.faces.near.thumb.toFixed(2)}`);
    for (const which of ['near', 'far'] as const) {
      const h = plan.arms[which].placed!;
      assert.equal(h.art.view, 'backTop', `${which}: drawn from the back of the hand`);
      const names = h.parts.map((p: PPart) => p.name);
      assert.ok(names.indexOf('thumb') < names.indexOf('hand'), `${which}: the thumb before the back of the hand (${names.join(', ')})`);
    }
    assert.doesNotMatch(read(`${SH}/figureV2/authoredHands.ts`), /thumbTop/, 'no thumb-on-top drawing for a stick grip');
    const paint = read(`${SH}/figureV2/paint.tsx`);
    assert.match(paint, /casts=\{a\.stickUnder && p\.kind === 'palm' \? 0\.22 : undefined\} castBlur=\{a\.stickUnder && p\.kind === 'palm' \? 6 : 2\.6\}/);
  });

  it('the lower thumb transition (owner: "watch lower thumb transition around the hand"): wrist, heel, thumb base and thumb one smooth contour — the thumb leaves the hand’s edge at a shallow angle, never a lobe turning back', () => {
    const art = TP.kitDrummerTopPlan().arms.far.placed!.art;
    const thumb = art.parts.find((p: { digit?: string }) => p.digit === 'thumb')!.outline as Pt[];
    const body = art.parts.find((p: { name: string }) => p.name === 'hand')!.outline as Pt[];
    // where the visible strip leaves the hand: the first outline points outside the hand, walking from the heel
    const outside = thumb.filter((q) => !GE.inPoly(q, body));
    const heelEnd = outside.reduce((m, q) => (q.u < m.u ? q : m), outside[0]);
    assert.ok(heelEnd.u >= 25, `the thumb starts ${heelEnd.u.toFixed(0)} mm from the wrist`);
    // its outer contour rises gently from there (no step): each 10 mm along, at most ≈ 6 mm out
    const outer = outside.filter((q) => q.u <= 96).sort((a, b) => a.u - b.u);
    for (let i = 1; i < outer.length; i++) {
      const du = outer[i].u - outer[i - 1].u;
      const dv = Math.abs(outer[i].v - outer[i - 1].v);
      assert.ok(du > 0 && dv / du <= 0.6, `a step in the thumb's base contour at ${outer[i].u.toFixed(0)} mm (${(dv / du).toFixed(2)})`);
    }
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

describe('wave 1 — the cuffs from above (owner 2026-11-23: "sleev still shows transparent through and back circle of cuff")', () => {
  const plan = TP.kitDrummerTopPlan();
  it('no closed line round the band: the cuff draws its sides and near rim only (open), the elbow end only as the seam curve ON the sleeve, within its width', () => {
    for (const which of ['near', 'far'] as const) {
      const a = plan.arms[which];
      const e = a.cuffEdge as Pt[] | null;
      assert.ok(e && e.length >= 4, `${which}: an open cuff edge`);
      const gap = Math.hypot(e![0].u - e![e!.length - 1].u, e![0].v - e![e!.length - 1].v);
      assert.ok(gap >= 40, `${which}: the edge is open across the band's elbow end (${gap.toFixed(0)} mm)`);
      const seam = a.opening.seam as Pt[];
      const sg = Math.hypot(seam[0].u - seam[seam.length - 1].u, seam[0].v - seam[seam.length - 1].v);
      assert.ok(sg > 10 && sg <= 2 * 34 + 2, `${which}: the seam an open curve within the band's width (${sg.toFixed(0)} mm)`);
    }
    const side = read(`${SH}/figureV2/FigureV2Side.tsx`);
    assert.match(side, /<Path path=\{P\.cuffEdge \?\? P\.cuffCloth\} style="stroke"/);
    // the side view's cuff follows the same rule (owner: "back circle of cuff" was first said of it)
    assert.ok(KD.kitDrummerPlan().arms.far.cuffEdge, 'the side cuff: an open edge too');
  });

  it('a near-level forearm’s opening seen from above is almost edge-on: only its near rim, no far rim or inside showing', () => {
    for (const which of ['near', 'far'] as const) {
      const a = plan.arms[which];
      assert.equal(a.opening.toViewer, false, `${which}: no far rim or inside from above`);
      assert.equal(a.opening.rimFar, null);
    }
    assert.match(read(`${SH}/figureV2/sidePlan.ts`), /const toViewer = !away && tilt > \(trimSleeve \? 0\.3 : 0\.02\);/);
  });

  it('the cloth is opaque and the near rim is painted after the wrist (full and lite)', () => {
    for (const c of [...MAT_SHIRT()]) assert.match(c, /^#[0-9a-fA-F]{6}$/, `an opaque shirt colour (${c})`);
    const side = read(`${SH}/figureV2/FigureV2Side.tsx`);
    const near = side.slice(side.indexOf('function CuffNear('), side.indexOf('export function Arm('));
    assert.match(near, /<Form path=\{P\.cuffCloth\} mat=\{MAT\.shirt\} axis=\{a\.foreAxis\} w=\{38\} rim=\{3\} edge=\{0\}>/);
    const lite = read(`${SH}/figureV2/lite.tsx`);
    const arm = lite.slice(lite.indexOf('export function ArmLite('), lite.indexOf('const FAR ='));
    assert.ok(arm.lastIndexOf('{hand}') < arm.lastIndexOf('{near}'), 'lite: the near rim after the hand');
    assert.doesNotMatch(arm, /opacity=\{0\.[0-9]+\}/, 'lite arm fills: no translucency');
    const top = read(`${SH}/figureV2/FigureV2Top.tsx`);
    assert.match(top, /<Arm a=\{plan\.arms\.far\} P=\{T\.far\} t=\{torso\} stick=\{farStick\} \/>/);
  });
});

describe('the cuff band BEGINS AT ITS SEAM — no cap, no back circle (owner 2026-11-23: "back circle of cuff"), both views', () => {
  const arms = (): [string, any][] => [
    ['top near', TP.kitDrummerTopPlan().arms.near],
    ['top far', TP.kitDrummerTopPlan().arms.far],
    ['side far', KD.kitDrummerPlan().arms.far],
  ];
  it('no point of the band lies on the elbow side of its seam curve', () => {
    for (const [name, a] of arms()) {
      const df = a.opening.out as Pt;
      const seam = a.opening.seam as Pt[];
      const along = (q: Pt) => GE.dot(q, df);
      const seamMin = Math.min(...seam.map(along));
      for (const q of a.cuff as Pt[]) assert.ok(along(q) >= seamMin - 0.01, `${name}: a band point ${(seamMin - along(q)).toFixed(1)} mm past the seam toward the elbow`);
    }
  });
  it('just on the elbow side of the seam and 20 mm farther up the sleeve: the same paint (the sleeve; nothing covers the first point)', () => {
    for (const [name, a] of arms()) {
      const df = a.opening.out as Pt;
      const seam = a.opening.seam as Pt[];
      const mid = seam[Math.floor(seam.length / 2)];
      const near = GE.sub(mid, GE.mul(df, 2));
      const far = GE.sub(mid, GE.mul(df, 22));
      for (const q of [near, far]) {
        assert.ok(!GE.inPoly(q, a.cuff), `${name}: the band covers the sleeve behind its seam`);
        assert.ok(GE.inPoly(q, a.foreSleeve), `${name}: the sleeve there`);
      }
    }
  });
});
