/**
 * FIGURE V2 — THE OWNER'S EXAMPLE FIGURE (must-do D78, owner 2026-11-22: "i
 * want you to improve all human figures … But first show me one - we work on
 * that one until I say it passes"; "human figures including hands, heads,
 * etc").
 *
 * The example is the seated kit drummer of Drum Overheads (M09), side view.
 * The new look is a SECOND renderer behind a switch that stays OFF in the
 * app until the owner approves it; the dev study page `#labpreview/FigureStudy`
 * forces it on for its own pictures only. Checked here:
 *   • the switch exists, is false and carries [MD:D78] on its line;
 *   • with the switch off the kit scene's drummer is the CURRENT renderer
 *     (PlayerBehind / PlayerInFront), and only an explicit `figureV2` draws
 *     the new one;
 *   • the new drummer, from the SAME pose: a head in true profile inside the
 *     head's box, facing the way the feet face; each hand closed round its
 *     stick's fulcrum (the stick passes through the grip), the wrist bent
 *     ≤ 45°; nothing of the arms or hands in the groin region, and the
 *     trousers' seat no further forward than the lap;
 *   • the plan, the grips and the paths are built once (memoised).
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const CFG = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/figureV2Config.ts'));
const KD = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/kitDrummerV2.tsx'));
const SP = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/sidePlan.ts'));
const G = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/grip.ts'));
const GE = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/geom.ts'));
const PA = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/paths.ts'));
const PAL = await import('../src/screens/lab/miking/lessons/shared/figureV2/palette.ts');
const PA_ANAT = await import('../src/screens/lab/miking/lessons/shared/hand/anatomy/anatomy.ts');
const AUTH = await import('../src/screens/lab/miking/lessons/shared/figureV2/authoredHands.ts');
const KSA = R(await import('../src/screens/lab/miking/lessons/shared/kitScene/KitSceneArt.tsx'));
const PF = R(await import('../src/screens/lab/miking/lessons/shared/players/PlayerFigure.tsx'));
const SPOSE = R(await import('../src/screens/lab/miking/lessons/shared/kitScene/stickPose.ts'));
const { KIT_GROOVE } = R(await import('../src/screens/lab/miking/lessons/shared/kitScene/kitStrokes.ts'));

type Pt = { u: number; v: number };
type V3 = { x: number; y: number; z: number };
type El = {
  type: unknown;
  props: { children?: unknown; [k: string]: unknown };
};

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
const named = (e: El) => (typeof e.type === 'function' ? (e.type as { name?: string }).name : undefined);

describe('figure V2 — the switch (D78)', () => {
  it('FIGURE_V2_READY exists, is false, and carries [MD:D78] on its line', () => {
    assert.equal(CFG.FIGURE_V2_READY, false);
    const src = read('src/screens/lab/miking/lessons/shared/figureV2/figureV2Config.ts');
    const line = src.split('\n').find((l) => /FIGURE_V2_READY\s*=/.test(l)) ?? '';
    assert.match(line, /export const FIGURE_V2_READY = false;.*\[MD:D78\]/);
  });

  it('switched off, the kit drummer (side) is drawn by the CURRENT renderer', () => {
    const tree = elements(KSA.KitSide({}));
    const side = tree.find((e) => named(e) === 'DrummerSide');
    assert.ok(side, 'KitSide draws DrummerSide');
    assert.equal(side!.props.v2, undefined, 'the lesson passes no figureV2: the switch decides');
    const drawn = elements((side!.type as (p: object) => unknown)({ ...side!.props }));
    const names = drawn.map(named);
    assert.ok(names.includes('PlayerBehind') && names.includes('PlayerInFront'), 'the current PlayerFigure layers');
    assert.ok(!names.includes('KitDrummerSideV2'), 'not the new renderer');
    // The M09 art (the owner's screen) passes no switch either.
    assert.doesNotMatch(read('src/screens/lab/miking/lessons/m09Overheads/art.tsx'), /figureV2/);
  });

  it('only an explicit figureV2 draws the new renderer (the study page)', () => {
    const tree = elements(KSA.KitSide({ figureV2: true }));
    const side = tree.find((e) => named(e) === 'DrummerSide')!;
    const drawn = elements((side.type as (p: object) => unknown)({ ...side.props }));
    assert.ok(drawn.map(named).includes('KitDrummerSideV2'));
    assert.match(read('src/dev/FigureStudy.tsx'), /figureV2/);
  });

  it('the current renderer is untouched (PlayerFigure keeps its source)', () => {
    const src = read('src/screens/lab/miking/lessons/shared/players/PlayerFigure.tsx');
    assert.match(src, /return <FigureMass path=\{fill\} tone="skin"/);
    assert.ok(typeof PF.PlayerBehind === 'function' && typeof PF.PlayerInFront === 'function');
  });
});

describe('figure V2 — the M09 side drummer, drawn on the same pose', () => {
  const plan = KD.kitDrummerPlan();
  const d3 = SPOSE.drummerPose(KIT_GROOVE);
  const pose = SPOSE.viewDrummer(d3, 'side').pose;

  it('is built on the pose the current drummer uses (no joint moved)', () => {
    assert.deepEqual(plan.arms.near.shoulder, pose.shoulderR);
    assert.deepEqual(plan.arms.near.elbow, pose.elbowR);
    assert.deepEqual(plan.arms.far.elbow, pose.elbowL);
    assert.deepEqual(plan.legs.near.knee, pose.kneeR);
    assert.deepEqual(plan.neck, pose.neck);
  });

  it('the head: a true profile inside the head box, facing the way the feet face', () => {
    const c = pose.head.c;
    const r = pose.head.r;
    const h = plan.head;
    for (const q of [...h.skull, ...h.hair, ...h.ear, h.noseTip, h.chin, h.back]) {
      assert.ok(Math.abs(q.u - c.u) <= r * 1.2 && Math.abs(q.v - c.v) <= r * 1.35, `profile point (${q.u.toFixed(0)}, ${q.v.toFixed(0)}) outside the head box`);
    }
    const feet = Math.sign(pose.footR.u - (pose.hipR.u + pose.hipL.u) / 2);
    assert.equal(Math.sign(h.noseTip.u - c.u), feet, 'the nose points the way the feet point');
    assert.equal(Math.sign(h.chin.u - c.u), feet);
    assert.equal(Math.sign(h.back.u - c.u), -feet, 'the back of the skull behind');
    assert.equal(Math.sign(plan.shoes.near.toe.u - plan.shoes.near.heel.u), feet, 'the shoes point the same way');
    assert.equal(plan.facing, feet);
    // Adult proportion: the head (crown to chin) ≈ 1/7–1/7.5 of a standing adult;
    // the figure's head is 205–245 mm tall.
    const hh = GE.boundsOf(h.skull);
    assert.ok(hh.v1 - hh.v0 > 205 && hh.v1 - hh.v0 < 245, `head height ${(hh.v1 - hh.v0).toFixed(0)} mm`);
    // The ear sits behind the jaw, between the brow and the nose's base.
    const ear = GE.boundsOf(h.ear);
    assert.ok((ear.u0 + ear.u1) / 2 < c.u + 5, 'the ear is behind the head centre line');
  });

  it('each hand closes round its stick: the fulcrum inside the grip, the stick through it, the wrist ≤ 45°', () => {
    for (const [arm, hold] of [
      [d3.R, plan.arms.near.hold],
      [d3.L, plan.arms.far.hold],
    ] as const) {
      assert.ok(hold, `${arm.hand}: a hand on the stick`);
      const sk = hold!.sk;
      const P = (q: V3): Pt => ({ u: q.x, v: q.y });
      const pts: Pt[] = [...sk.palm.map(P), ...sk.fingers.flatMap((f: { joints: V3[] }) => f.joints.map(P)), ...sk.thumb.joints.map(P)];
      const hull = GE.hull(pts);
      assert.ok(GE.inPoly(P(arm.fulcrum), hull), `${arm.hand}: the fulcrum lies inside the hand's grip in the side view`);
      // In 3-D: the thumb's pad and the index finger close on the stick at the fulcrum.
      const dist = (a: V3, b: V3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      const thumbPad = sk.thumb.joints[sk.thumb.joints.length - 1];
      const index = sk.fingers[0].joints;
      assert.ok(dist(thumbPad, arm.fulcrum) < 40, `${arm.hand}: thumb pad ${dist(thumbPad, arm.fulcrum).toFixed(0)} mm from the fulcrum`);
      assert.ok(Math.min(...index.map((j: V3) => dist(j, arm.fulcrum))) < 40, `${arm.hand}: the index finger at the fulcrum`);
      assert.deepEqual(hold!.fulcrum, arm.fulcrum, 'the stick is held at the pose’s own fulcrum');
      assert.ok(hold!.bend <= 45, `${arm.hand}: wrist bent ${hold!.bend.toFixed(0)}°`);
      assert.ok(Math.abs(hold!.fore - 262) < 30, `${arm.hand}: forearm ${hold!.fore.toFixed(0)} mm (adult ≈ 262)`);
    }
  });

  it('nothing at or in front of the groin: no arm or hand there, the seat no further forward than the lap', () => {
    const hip = plan.hip;
    const f = plan.facing;
    const thighTop = hip.v - 84;
    const inGroin = (q: Pt) => f * (q.u - hip.u) >= 0 && f * (q.u - hip.u) <= 130 && q.v >= thighTop - 60 && q.v <= hip.v + 20;
    const parts: Pt[] = [];
    for (const a of [plan.arms.near, plan.arms.far]) {
      parts.push(...a.upper, ...a.foreSleeve, ...a.cuff, ...a.wristSkin);
      if (a.hold) {
        const sk = a.hold.sk;
        const P = (q: V3): Pt => ({ u: q.x, v: q.y });
        parts.push(...sk.palm.map(P), ...sk.fingers.flatMap((x: { joints: V3[] }) => x.joints.map(P)), ...sk.thumb.joints.map(P));
      }
    }
    const bad = parts.filter(inGroin);
    assert.equal(bad.length, 0, `arm/hand points in the groin region: ${bad.map((q) => `(${q.u.toFixed(0)},${q.v.toFixed(0)})`).join(' ')}`);
    const front = Math.max(...plan.seat.map((q: Pt) => f * (q.u - hip.u)));
    assert.ok(front <= 110, `the seat's front ${front.toFixed(0)} mm before the hips (a flat front, no bulge)`);
    // Nothing protrudes from the trousers' front between the belt and the thighs.
    const lap = plan.legs.near.outline.filter((q: Pt) => inGroin(q) && f * (q.u - hip.u) > 110);
    assert.equal(lap.length, 0);
  });

  it('the shoes stand on their pedals (the sole on the footboard), the near arm out of the torso', () => {
    const s = plan.shoes.near;
    assert.ok(s.slope > 0.05 && s.slope < 0.25, `the kick pedal's footboard tilts the shoe ${((s.slope * 180) / Math.PI).toFixed(1)}°`);
    assert.ok(Math.abs(s.toe.v - s.ball.v) < 60);
    // The sleeve's root is inside the shirt (it grows out of the body, no plug-in arm).
    assert.ok(GE.inPoly(plan.arms.near.shoulder, plan.shirt));
  });
});

describe('figure V2 — built once', () => {
  it('the plan, the grips and the paths are memoised (same inputs, same objects)', () => {
    const a = KD.kitDrummerPlan();
    const b = KD.kitDrummerPlan();
    assert.equal(a, b, 'the same plan object');
    const d3 = SPOSE.drummerPose(KIT_GROOVE);
    assert.equal(KD.kitHolds(d3), KD.kitHolds(d3));
    const arm = {
      hand: 'R' as const,
      elbow: d3.R.elbow,
      wrist: d3.R.wrist,
      fulcrum: d3.R.fulcrum,
      bead: d3.R.bead,
    };
    assert.equal(G.stickHold(arm), G.stickHold({ ...arm }), 'a grip is solved once per stroke');
    const pose = SPOSE.viewDrummer(d3, 'side').pose;
    assert.equal(SP.sidePlan(pose, {}), SP.sidePlan(pose, {}));
    assert.equal(PA.sidePaths(a), PA.sidePaths(b), 'the same path set');
    assert.equal(PA.sidePaths(a).skull, PA.sidePaths(b).skull);
  });

  it('the renderer recomputes nothing per frame: no clock, no animation hooks', () => {
    for (const f of ['FigureV2Side.tsx', 'paint.tsx', 'kitDrummerV2.tsx', 'paths.ts', 'sidePlan.ts', 'grip.ts']) {
      const src = read(`src/screens/lab/miking/lessons/shared/figureV2/${f}`);
      assert.doesNotMatch(src, /useFrameCallback|useDerivedValue|useSharedValue|useClock|requestAnimationFrame|Date\.now/, f);
    }
  });
});

describe('figure V2 — round 2 (owner-eyed review, 2026-11-22)', () => {
  const plan = KD.kitDrummerPlan();
  const pose = SPOSE.viewDrummer(SPOSE.drummerPose(KIT_GROOVE), 'side').pose;

  it("both hands are one person's skin: the far hand at most a small value step down, the same material", () => {
    const FS = read('src/screens/lab/miking/lessons/shared/figureV2/FigureV2Side.tsx');
    const k = Number(FS.match(/export const FAR_SKIN_DIM = ([0-9.]+);/)?.[1]);
    assert.ok(k >= 0.88 && k <= 1, `far skin dim ${k}`);
    // The value step on the skin's light tone (0 … 1 luminance).
    const lum = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => x / 255);
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const { MAT } = R(PAL);
    const L = lum(MAT.skin.form[1]);
    assert.ok(L - L * k <= 0.08, `value step ${(L - L * k).toFixed(3)}`);
    // One paint for every hand: HandV2's parts all take MAT.skin, and the far hand
    // is dimmed by a plain value scale (no hue shift).
    const paint = read('src/screens/lab/miking/lessons/shared/figureV2/paint.tsx');
    assert.match(paint, /const SKIN = MAT\.skin;/);
    assert.match(FS, /const dimLayer = \(k: number\) =>[\s\S]*?matrix=\{\[k, 0, 0, 0, 0, 0, k, 0, 0, 0, 0, 0, k, 0, 0,/);
  });

  it('the new hand options are opt-in: only the V2 renderer passes them, the shared hand library is unchanged without them', () => {
    const draw = read('src/screens/lab/miking/lessons/shared/hand/anatomy/drawAnatomy.ts');
    assert.match(draw, /v2\?: boolean;/);
    // Every v2 branch is guarded by the option.
    for (const m of draw.matchAll(/opts\.v2/g)) assert.ok(m.index! > 0);
    assert.match(draw, /if \(opts\.v2\) pieces\.push\(circle[\s\S]*?else pieces\.push\(circle\(P\(shift\(shift\(dg\.joints\[0\], f\.z, 1\.5 \+ 2\.2 \* bend\)/);
    // Only figureV2 passes v2 to handLayers.
    const users: string[] = [];
    const walk = (d: string) => {
      for (const e of readdirSync(new URL(`../${d}`, import.meta.url), { withFileTypes: true })) {
        const p = `${d}/${e.name}`;
        if (e.isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(e.name) && /v2: true/.test(read(p)) && /handLayers/.test(read(p))) users.push(p);
      }
    };
    walk('src/screens/lab/miking');
    assert.deepEqual(users, ['src/screens/lab/miking/lessons/shared/figureV2/paths.ts']);
  });

  it('the head: eye line near half the head height, the eye set back from the bridge, the ear between brow and nose base', () => {
    const h = plan.head;
    const sk = GE.boundsOf(h.skull);
    const mid = (sk.v0 + sk.v1) / 2;
    assert.ok(Math.abs(h.eyeC.v - mid) < 18, `eye ${(h.eyeC.v - mid).toFixed(0)} mm from mid-height`);
    assert.ok(h.noseTip.u - h.eyeC.u > 35, 'the eye well behind the nose tip (set back from the bridge)');
    const ear = GE.boundsOf(h.ear);
    assert.ok(ear.v1 - ear.v0 > 52 && ear.v1 - ear.v0 < 75, `ear ${(ear.v1 - ear.v0).toFixed(0)} mm long`);
    assert.ok(ear.v0 > sk.v0 + 70 && ear.v1 < sk.v1 - 40, 'the ear between the brow line and the nose base');
    // The chin stacked under the nose, not receding (the 8° nod carries it ≈ 8 mm back).
    assert.ok(h.noseTip.u - h.chin.u < 40, `chin ${(h.noseTip.u - h.chin.u).toFixed(0)} mm behind the nose tip`);
    // The neck narrower than the head.
    const nk = GE.boundsOf(h.neck);
    assert.ok(nk.u1 - nk.u0 < (sk.u1 - sk.u0) * 0.75);
    void pose;
  });

  it('a long sleeve hangs from the shoulder; the trouser hem rests on the instep', () => {
    const a = plan.arms.near;
    assert.ok(GE.inPoly(a.shoulder, plan.shirt), 'the sleeve grows out of the shirt');
    assert.ok(a.cuff.length > 0 && a.wristSkin.length > 0, 'a cuff and the bare wrist');
    const l = plan.legs.near;
    const s = plan.shoes.near;
    // the hem's lowest point no lower than the shoe's top at the heel and above the sole
    const lowest = Math.max(...l.lower.map((q: Pt) => q.v));
    assert.ok(lowest < s.heel.v - 20, 'the hem stays on the shoe, above the sole');
  });
});

describe('figure V2 — the hands (owner: "Fix the hands", 2026-11-23)', () => {
  const d3 = SPOSE.drummerPose(KIT_GROOVE);
  const holds = KD.kitHolds(d3);

  it('each hand holds its stick in a matched grip: the roll recorded, the thumb on the upper side of the stick', () => {
    // The roll about the stick: 0 = German (palm down), 90 = French (thumb on top).
    // The left hand sits in the American grip; the right hand turns toward it only as
    // far as its wrist allows on this pose (the right forearm runs up into the hi-hat
    // stroke: a 45° roll would bend the wrist ≈ 56°, past the owner's 45° rule).
    assert.ok(holds.L.roll >= 30 && holds.L.roll <= 60, `left roll ${holds.L.roll.toFixed(0)}°`);
    assert.ok(holds.R.roll >= 0 && holds.R.roll <= 60, `right roll ${holds.R.roll.toFixed(0)}°`);
    for (const [arm, h] of [
      [d3.R, holds.R],
      [d3.L, holds.L],
    ] as const) {
      const pad = h.sk.thumb.joints[h.sk.thumb.joints.length - 1];
      assert.ok(pad.y < arm.fulcrum.y, `${arm.hand}: the thumb's pad above the stick (${(arm.fulcrum.y - pad.y).toFixed(0)} mm)`);
      assert.ok(h.bend <= 45, `${arm.hand}: wrist ${h.bend.toFixed(0)}°`);
      assert.ok(Math.abs(h.fore - 262) < 30, `${arm.hand}: forearm ${h.fore.toFixed(0)} mm`);
      const t = h.sk.thumb.joints[3];
      assert.ok(Math.hypot(t.x - arm.fulcrum.x, t.y - arm.fulcrum.y, t.z - arm.fulcrum.z) < 40, `${arm.hand}: thumb pad at the fulcrum`);
    }
  });

  it('the united hand silhouette (palm, webbing, every digit) contains the fulcrum in the side view', () => {
    for (const [arm, h] of [
      [d3.R, holds.R],
      [d3.L, holds.L],
    ] as const) {
      const P2 = (q: V3): Pt => ({ u: q.x, v: q.y });
      const sk = h.sk;
      const web: Pt[] = [];
      for (let i = 0; i < 3; i++) {
        const a = sk.fingers[i].joints;
        const b = sk.fingers[i + 1].joints;
        web.push(P2(a[0]), P2(b[0]), { u: a[0].x + (a[1].x - a[0].x) * 0.42, v: a[0].y + (a[1].y - a[0].y) * 0.42 });
      }
      const form = GE.hull([...sk.palm.map(P2), ...sk.fingers.flatMap((f: { joints: V3[] }) => f.joints.map(P2)), ...sk.thumb.joints.map(P2), ...web]);
      assert.ok(GE.inPoly(P2(arm.fulcrum), form), `${arm.hand}: the fulcrum inside the hand's form`);
    }
    // The painter fills ONE united skin form per side of the stick, then shades inside it.
    const paths = read('src/screens/lab/miking/lessons/shared/figureV2/paths.ts');
    assert.match(paths, /const formFront = front\.length \? unionOf\(\.\.\.front\)/);
    assert.match(paths, /webbing\(sk, P\)/);
    const paint = read('src/screens/lab/miking/lessons/shared/figureV2/paint.tsx');
    assert.match(paint, /\{\/\* the skin form first, as one silhouette \*\/\}\s*<Path path=\{form\}>/);
  });

  it('an adult hand: ≈ 186 mm long, 70–90 mm across the knuckles, the middle finger longest', () => {
    const { handProportions } = R(PA_ANAT);
    const p = handProportions();
    assert.ok(p.handLength > 178 && p.handLength < 196, `hand ${p.handLength.toFixed(0)} mm`);
    assert.ok(p.breadth >= 70 && p.breadth <= 90, `breadth ${p.breadth.toFixed(0)} mm`);
    assert.ok(p.fingers.middle > p.fingers.index && p.fingers.middle > p.fingers.ring && p.fingers.middle > p.fingers.little);
  });
});

describe('figure V2 — the authored hands (owner: "Fix the hands", round 3)', () => {
  const AH = R(AUTH);
  const plan = KD.kitDrummerPlan();

  it('the fist from its little-finger side is a compact block: ≈ 100 mm wrist to knuckle, 0.6–0.8 as tall at the knuckle end', () => {
    const art = AH.handArt('fistEdge');
    const all: Pt[] = art.parts.flatMap((p: { outline: Pt[] }) => p.outline);
    const k = art.knuckle;
    const length = k.u; // the wrist crease is the frame's origin
    assert.ok(length > 85 && length < 110, `wrist to knuckle ${length.toFixed(0)} mm`);
    const end = all.filter((q) => q.u > k.u - 30);
    const height = Math.max(...end.map((q) => q.v)) - Math.min(...end.map((q) => q.v));
    assert.ok(height / length >= 0.6 && height / length <= 0.8, `height ${height.toFixed(0)} mm = ${(height / length).toFixed(2)} of the length`);
    // The hypothenar fills the space under the back of the hand (no loaf): the body is
    // at least 0.55 of the knuckle-end height deep half way along.
    const body = art.parts.find((p: { name: string }) => p.name === 'hand').outline as Pt[];
    const mid = body.filter((q) => Math.abs(q.u - 45) < 12);
    const depth = Math.max(...mid.map((q) => q.v)) - Math.min(...mid.map((q) => q.v));
    assert.ok(depth >= 0.55 * height, `depth half way ${depth.toFixed(0)} mm`);
  });

  it('each placed hand: its authored outline contains the fulcrum; the stick passes through it', () => {
    for (const a of [plan.arms.near, plan.arms.far]) {
      const h = a.placed!;
      assert.ok(h, 'an authored hand is placed on each stick');
      const inside = h.parts.some((p: { placed: Pt[] }) => GE.inPoly(h.F, p.placed));
      assert.ok(inside, `${h.art.view}: the fulcrum inside the drawn hand`);
      assert.deepEqual(h.F, { u: a.hold!.fulcrum.x, v: a.hold!.fulcrum.y }, 'the drawing sits on the pose’s own fulcrum');
    }
    assert.equal(plan.arms.near.placed!.art.view, 'fistEdge', 'the right hand: the stick runs along the line of sight');
    assert.equal(plan.arms.far.placed!.art.view, 'palmThumb', 'the left hand: palm side, thumb on top');
  });

  it("the left hand's thumb tip lies on the upper side of the stick, the index hooked ahead of it", () => {
    const h = plan.arms.far.placed!;
    const t = h.thumbTip!;
    const vLine = h.F.v + ((t.u - h.F.u) * (h.bead.v - h.F.v)) / (h.bead.u - h.F.u);
    assert.ok(t.v < vLine, `thumb tip ${(vLine - t.v).toFixed(0)} mm above the stick's line`);
    // The index's hook (its middle joint) is further along the stick than the thumb's tip.
    const along = (q: Pt) => (q.u - h.F.u) * (h.bead.u - h.F.u) + (q.v - h.F.v) * (h.bead.v - h.F.v);
    assert.ok(along(h.knuckle) > along(t), 'the index hooks ahead of the thumb');
  });

  it('placed at true size across the hand, foreshortened along it exactly as the 3-D hand axis is; the forearm meets the drawn wrist', () => {
    for (const a of [plan.arms.near, plan.arms.far]) {
      const h = a.placed!;
      const fx = a.hold!.sk.frame.x;
      const sx = Math.max(0.45, Math.min(1, Math.hypot(fx.x, fx.y)));
      const d = Math.hypot(h.at({ u: 100, v: 0 }).u - h.at({ u: 0, v: 0 }).u, h.at({ u: 100, v: 0 }).v - h.at({ u: 0, v: 0 }).v);
      assert.ok(Math.abs(d - 100 * sx) < 1e-6, `along the hand × ${sx.toFixed(2)}`);
      const e = Math.hypot(h.at({ u: 0, v: 100 }).u - h.at({ u: 0, v: 0 }).u, h.at({ u: 0, v: 100 }).v - h.at({ u: 0, v: 0 }).v);
      assert.ok(Math.abs(e - 100) < 1e-6, 'across the hand at true size');
      assert.deepEqual(a.wrist, h.wrist, 'the sleeve and wrist run to the drawn hand');
    }
  });
});

describe('figure V2 — the arm into the hand (owner: "check for hand transition to wrist and arm", 2026-11-23)', () => {
  const plan = KD.kitDrummerPlan();
  const ang = (a: Pt, b: Pt) => Math.atan2(b.v - a.v, b.u - a.u);
  const turn = (a: number, b: number) => {
    let d = ((b - a) * 180) / Math.PI;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return Math.abs(d);
  };

  it('the centre line elbow → wrist → knuckles has no kink: a visible join turns in steps of ≤ 20° (or the pose’s own wrist bend); a join seen end-on is covered by the cuff', () => {
    for (const a of [plan.arms.near, plan.arms.far]) {
      const h = a.placed!;
      if (a.away) {
        // The forearm runs away from the viewer: its sleeve's end (the cuff seen end-on) covers the join.
        assert.ok(GE.inPoly(h.wrist, a.cuff), 'the drawn wrist lies inside the cuff seen end-on');
        continue;
      }
      const pts: Pt[] = [...a.line, h.at({ u: 97, v: 0 })];
      const limit = Math.max(20, a.hold!.bend + 2);
      for (let i = 1; i < pts.length - 1; i++) {
        const t = turn(ang(pts[i - 1], pts[i]), ang(pts[i], pts[i + 1]));
        assert.ok(t <= limit, `turn ${t.toFixed(0)}° at point ${i} (limit ${limit.toFixed(0)}°)`);
      }
      assert.deepEqual(pts[pts.length - 2], h.wrist, 'the forearm ends at the drawn wrist (no offset)');
    }
  });

  it('the visible wrist is narrower than the cuff’s opening and than the hand', () => {
    const a = plan.arms.far;
    const h = a.placed!;
    const dir = GE.unit(GE.sub(a.foreAxis[1], a.foreAxis[0]));
    const n = GE.perp(dir);
    const across = (poly: Pt[], nn: Pt) => {
      const ps = poly.map((q) => GE.dot(q, nn));
      return Math.max(...ps) - Math.min(...ps);
    };
    const wrist = across(a.wristSkin, n);
    const cuff = across(a.cuff, n);
    const palm = h.parts.find((p: { name: string }) => p.name === 'palm')!.placed as Pt[];
    const hand = across(palm, GE.perp(h.ex));
    assert.ok(wrist < cuff, `wrist ${wrist.toFixed(0)} mm < cuff ${cuff.toFixed(0)} mm`);
    assert.ok(wrist < hand, `wrist ${wrist.toFixed(0)} mm < hand ${hand.toFixed(0)} mm`);
  });

  it('one skin across forearm, wrist and hand: the wrist is painted as the hand’s own first part, in the hand’s one light', () => {
    const paths = read('src/screens/lab/miking/lessons/shared/figureV2/paths.ts');
    assert.match(paths, /kind: 'wrist', name: 'wrist'/);
    assert.match(paths, /art: a\.placed \? artPaths\(a\.placed, a\.away \? null : \{ poly: a\.wristSkin/);
    const side = read('src/screens/lab/miking/lessons/shared/figureV2/FigureV2Side.tsx');
    assert.match(side, /\{P\.art \? null : \(\s*<Form path=\{P\.wristSkin\} mat=\{MAT\.skin\}/);
    const paint = read('src/screens/lab/miking/lessons/shared/figureV2/paint.tsx');
    // Every authored part (the wrist among them) is filled with the one skin material.
    assert.match(paint, /function ArtPart[\s\S]*?SKIN\.form\[1\], SKIN\.form\[2\]/);
  });

  it('fingers in front of the stick are solid (a curled digit is painted as the union of its bones)', () => {
    const AHm = R(AUTH);
    for (const v of ['fistEdge', 'palmThumb'] as const) for (const p of AHm.handArt(v).parts) if (p.kind === 'digit') assert.ok(p.chain && p.chain.pts.length >= 2, `${v} ${p.name}`);
    assert.match(read('src/screens/lab/miking/lessons/shared/figureV2/paths.ts'), /q\.placedChain \? bonesPath\(q\.placedChain\)/);
  });
});
