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
    // (the far elbow is DRAWN carried out to the side, hidden by the torso — owner 2026-11-23;
    // the pose's own elbow is unchanged and recorded)
    assert.deepEqual(plan.arms.far.behind!.poseElbow, pose.elbowL);
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

  it("the left hand's thumb lies along the stick on its upper side, its tip toward the stick's tip, beyond every finger", () => {
    const h = plan.arms.far.placed!;
    const t = h.thumbTip!;
    const vLine = h.F.v + ((t.u - h.F.u) * (h.bead.v - h.F.v)) / (h.bead.u - h.F.u);
    assert.ok(t.v < vLine, `thumb tip ${(vLine - t.v).toFixed(0)} mm above the stick's line`);
    const s = GE.unit(GE.sub(h.bead, h.butt));
    const along = (q: Pt) => GE.dot(GE.sub(q, h.F), s);
    for (const p of h.parts as { digit?: string; placed: Pt[] }[]) {
      if (!p.digit || p.digit === 'thumb') continue;
      const reach = Math.max(...p.placed.map(along));
      assert.ok(along(t) > reach, `the thumb's tip beyond the ${p.digit} finger along the stick`);
    }
  });

  it('placed at true size across the hand; along it foreshortened as the 3-D hand axis is — except the right fist, drawn near true size for reading (owner 2026-11-23)', () => {
    for (const a of [plan.arms.near, plan.arms.far]) {
      const h = a.placed!;
      const d = Math.hypot(h.at({ u: 100, v: 0 }).u - h.at({ u: 0, v: 0 }).u, h.at({ u: 100, v: 0 }).v - h.at({ u: 0, v: 0 }).v);
      const e = Math.hypot(h.at({ u: 0, v: 100 }).u - h.at({ u: 0, v: 0 }).u, h.at({ u: 0, v: 100 }).v - h.at({ u: 0, v: 0 }).v);
      assert.ok(Math.abs(e - 100) < 1e-6, 'across the hand at true size');
      if (h.art.view === 'fistEdge') {
        // "right hand yes can be larger and clearer": within 15 % of true size, not the 0.59 projection.
        assert.ok(d >= 85 && d <= 100, `the right fist drawn at ${d.toFixed(0)} % of true length`);
        assert.ok(a.away && a.mouth, 'it comes out of the sleeve’s mouth');
        continue;
      }
      const fx = a.hold!.sk.frame.x;
      const sx = Math.max(0.45, Math.min(1, Math.hypot(fx.x, fx.y)));
      assert.ok(Math.abs(d - 100 * sx) < 1e-6, `along the hand × ${sx.toFixed(2)}`);
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
        // The forearm runs away from the viewer: the fist comes out of the sleeve's mouth; its
        // root (the drawn wrist) is behind the mouth, under the sleeve — the join is covered.
        const m = a.mouth!;
        assert.ok(GE.dot(GE.sub(h.wrist, m.p), m.n) < 0, 'the drawn wrist is behind the sleeve’s mouth');
        assert.ok(GE.inPoly(h.wrist, a.upper) || GE.inPoly(h.wrist, a.foreSleeve), 'and under the sleeve');
        // The fist and the arm run one way: the hand's axis within 25° of the elbow → fulcrum line.
        const lineA = ang(a.elbow, h.F);
        const handA = ang(h.wrist, h.at({ u: 97, v: 0 }));
        assert.ok(turn(lineA, handA) <= 25, `fist ${turn(lineA, handA).toFixed(0)}° off the arm's line`);
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

  it('every finger is ONE closed outline (owner: "i see 9 fingers"): never a union of bones and joint discs', () => {
    const paths = read('src/screens/lab/miking/lessons/shared/figureV2/paths.ts');
    assert.match(paths, /h\.parts\.map\(\(q\) => \(\{ path: smoothClosed\(q\.placed,/);
    assert.doesNotMatch(paths, /bonesPath/);
  });
});

describe('figure V2 — the belt and the trousers (owner 2026-11-23)', () => {
  const plan = KD.kitDrummerPlan();
  it('"fix perfectly straight horizontal belt": the belt wraps the waist — its top edge curves and rides higher in front (the seated pelvis rolled back)', () => {
    const top = plan.beltTop as Pt[];
    const a = top[0];
    const b = top[top.length - 1];
    const chord = GE.sub(b, a);
    const len = Math.hypot(chord.u, chord.v);
    const n = { u: -chord.v / len, v: chord.u / len };
    const dev = Math.max(...top.map((q) => Math.abs(GE.dot(GE.sub(q, a), n))));
    assert.ok(dev > 4, `the top edge bows ${dev.toFixed(1)} mm off its chord (not a straight line)`);
    const front = plan.facing > 0 ? (a.u > b.u ? a : b) : a.u < b.u ? a : b;
    const back = front === a ? b : a;
    assert.ok(front.v < back.v - 5, `higher in front than behind by ${(back.v - front.v).toFixed(0)} mm`);
    assert.ok(plan.beltLoop.length && plan.buckle.length && plan.blouse.length, 'a loop, the buckle’s edge, the shirt blousing over it');
  });

  it('"pant leg also need similar shading like the rest of the pants below": seat, thigh and shin are one cloth in one cylinder light', () => {
    const side = read('src/screens/lab/miking/lessons/shared/figureV2/FigureV2Side.tsx');
    assert.match(side, /const CLOTH = \{ \.\.\.MAT\.trousers/);
    assert.match(side, /<Form path=\{path\} mat=\{CLOTH\} axis=\{l\.thighAxis\}/);
    assert.match(side, /function Shin[\s\S]*?colors=\{CLOTH\.form\} positions=\{CLOTH\.pos\}/);
    // the near and far legs are both drawn by the one Leg (the far one only a value step down)
    assert.equal((side.match(/<Leg path=/g) ?? []).length, 2);
  });
});


describe('figure V2 — a thumb and four fingers (owner 2026-11-23: "the pointer finger is too long and wrapped up over the thumb and it shows 6 fingers")', () => {
  const AHm = R(AUTH);
  type Part = { name: string; kind: string; digit?: string; outline: Pt[]; chain?: { pts: Pt[]; r: number[] } };
  const segDist = (p: Pt, a: Pt, b: Pt) => {
    const ab = GE.sub(b, a);
    const t = Math.max(0, Math.min(1, GE.dot(GE.sub(p, a), ab) / (GE.dot(ab, ab) || 1)));
    return Math.hypot(p.u - (a.u + ab.u * t), p.v - (a.v + ab.v * t));
  };
  const edgeDist = (p: Pt, poly: Pt[]) => Math.min(...poly.map((q, i) => segDist(p, q, poly[(i + 1) % poly.length])));
  const lenOf = (c: { pts: Pt[] }) => c.pts.slice(1).reduce((s, q, i) => s + Math.hypot(q.u - c.pts[i].u, q.v - c.pts[i].v), 0);

  it('the palm-side grip shows exactly five digits: one thumb, four fingers (no extra hooked form)', () => {
    const parts = AHm.handArt('palmThumb').parts as Part[];
    const digits = parts.filter((p) => p.kind === 'digit');
    assert.deepEqual(digits.map((p) => p.digit).sort(), ['index', 'little', 'middle', 'ring', 'thumb']);
    assert.equal(new Set(digits.map((p) => p.digit)).size, 5);
    assert.ok(!parts.some((p) => /hook/.test(p.name)), 'no separate hook');
    // the only non-digit form is the palm (no web, no knuckle, no separate pad)
    assert.deepEqual(parts.filter((p) => p.kind !== 'digit').map((p) => p.name), ['palm']);
  });

  it('the fist from its little-finger side shows the little finger and a sliver of the ring finger — nothing that reads as another finger', () => {
    const parts = AHm.handArt('fistEdge').parts as Part[];
    const digits = parts.filter((p) => p.kind === 'digit').map((p) => p.digit);
    // one part per finger (no separate knuckle form)
    assert.deepEqual([...digits].sort(), ['little', 'ring']);
  });

  it('each finger at an adult length, in the order middle > ring ≥ index > little; the thumb ≤ 65 mm from its base joint', () => {
    const parts = AHm.handArt('palmThumb').parts as Part[];
    const by = (d: string) => parts.find((p) => p.digit === d)!.chain!;
    const L = { index: lenOf(by('index')), middle: lenOf(by('middle')), ring: lenOf(by('ring')), little: lenOf(by('little')) };
    assert.ok(L.middle > L.ring && L.ring >= L.index && L.index > L.little, `lengths ${JSON.stringify(L, (_k, x) => (typeof x === 'number' ? Math.round(x) : x))}`);
    const LIM: Record<string, number[]> = { index: [40, 23, 18], middle: [45, 27, 19], ring: [42, 26, 19], little: [33, 20, 17] };
    for (const d of Object.keys(LIM)) {
      const c = by(d);
      c.pts.slice(1).forEach((q, i) => {
        const seg = Math.hypot(q.u - c.pts[i].u, q.v - c.pts[i].v);
        assert.ok(seg <= LIM[d][i] + 1, `${d} bone ${i + 1}: ${seg.toFixed(0)} mm (adult ≤ ${LIM[d][i]})`);
      });
    }
    const t = by('thumb');
    const fromBase = lenOf({ pts: t.pts.slice(1) });
    assert.ok(fromBase <= 65, `thumb ${fromBase.toFixed(0)} mm from its base joint`);
  });

  it('the index finger never lies over the thumb, and the thumb tip is uncovered in the paint order', () => {
    const parts = AHm.handArt('palmThumb').parts as Part[];
    const thumb = parts.find((p) => p.digit === 'thumb')!;
    const index = parts.find((p) => p.digit === 'index')!;
    const deepest = Math.max(0, ...index.outline.filter((q) => GE.inPoly(q, thumb.outline)).map((q) => edgeDist(q, thumb.outline)));
    assert.ok(deepest <= 2.5, `the index finger reaches ${deepest.toFixed(1)} mm into the thumb`);
    const tip = AHm.handArt('palmThumb').thumbTip as Pt;
    const after = parts.slice(parts.indexOf(thumb) + 1);
    for (const p of after) assert.ok(!GE.inPoly(tip, p.outline), `${p.name} covers the thumb tip`);
    // and no finger drawn after the thumb at all: the thumb is the nearest form
    assert.equal(after.filter((p) => p.kind === 'digit').length, 0);
  });
});

/*
 * ONE FINGER = ONE SHAPE (owner 2026-11-23: "i see 9 fingers"). The test
 * looks the way the eye does: each authored hand is painted, in its own paint
 * order, onto a 0.5 mm grid (the stick between the palm and the fingers; the
 * fist's butt stub over all); every separately visible region of every part
 * is found; a FINGER-SIZED FORM is a visible region 12–25 mm wide (twice its
 * largest inscribed radius) and ≥ 40 mm² — the size of a finger end. The
 * count must equal the digits the view shows: five on the left, two on the
 * right, each digit exactly one region, the palm none.
 */
describe('figure V2 — one finger = one shape (owner 2026-11-23: "i see 9 fingers")', () => {
  const plan = KD.kitDrummerPlan();
  type PPart = { name: string; kind: string; digit?: string; layer: 'back' | 'front'; placed: Pt[]; placedAxis: [Pt, Pt] };
  const capsule = (a: Pt, b: Pt, r: number) => (q: Pt) => {
    const ab = GE.sub(b, a);
    const t = Math.max(0, Math.min(1, GE.dot(GE.sub(q, a), ab) / (GE.dot(ab, ab) || 1)));
    return Math.hypot(q.u - (a.u + ab.u * t), q.v - (a.v + ab.v * t)) <= r;
  };
  /** The hand painted on a grid: each cell's topmost layer, then each layer's visible regions. */
  function regions(h: { art: { view: string }; parts: PPart[]; butt: Pt; bead: Pt; stubEnd: Pt }) {
    const parts = h.parts;
    const stick = capsule(h.butt, h.bead, 7);
    const stub = capsule(h.butt, h.stubEnd, 7);
    // paint order: [id, cover]
    const order: [string, (q: Pt) => boolean][] = [];
    const poly = (p: PPart) => (q: Pt) => GE.inPoly(q, p.placed);
    if (h.art.view === 'fistEdge') {
      order.push(['stick', stick]);
      parts.forEach((p, i) => order.push([`${i}`, poly(p)]));
      order.push(['stub', stub]);
    } else {
      parts.forEach((p, i) => p.layer === 'back' && order.push([`${i}`, poly(p)]));
      order.push(['stick', stick]);
      parts.forEach((p, i) => p.layer === 'front' && order.push([`${i}`, poly(p)]));
    }
    const all = parts.flatMap((p) => p.placed);
    const b = GE.boundsOf(all);
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
    // connected regions of each id (4-neighbour), with area and inscribed width
    const seen = new Uint8Array(W * H);
    const out: { id: string; area: number; width: number; at: Pt }[] = [];
    for (let c = 0; c < W * H; c++) {
      const id = top[c];
      if (!id || id === 'stick' || id === 'stub' || seen[c]) continue;
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
      // inscribed radius: the chamfer distance to the nearest cell outside the region
      const inR = new Map<number, number>(cells.map((x) => [x, Infinity]));
      const pass = (xs: number[], nb: number[]) => {
        for (const x of xs) {
          let d = inR.get(x)!;
          for (const o of nb) {
            const y = x + o;
            const dy = inR.has(y) ? inR.get(y)! : 0;
            d = Math.min(d, dy + (Math.abs(o) === 1 || Math.abs(o) === W ? 1 : 1.414));
          }
          inR.set(x, d);
        }
      };
      const sorted = [...cells].sort((p, q) => p - q);
      pass(sorted, [-1, -W, -W - 1, -W + 1]);
      pass(sorted.reverse(), [1, W, W + 1, W - 1]);
      const width = 2 * Math.max(...inR.values()) * step;
      const at = cells.reduce((m, x) => ({ u: m.u + (b.u0 + ((x % W) - 1) * step) / cells.length, v: m.v + (b.v0 + (Math.floor(x / W) - 1) * step) / cells.length }), { u: 0, v: 0 });
      out.push({ id, area: cells.length * step * step, width, at });
    }
    return out;
  }
  const report = (h: { parts: PPart[]; F: Pt }, rs: { id: string; area: number; width: number; at: Pt }[]) =>
    rs.map((r) => `${h.parts[Number(r.id)].name}: ${r.area.toFixed(0)} mm², ${r.width.toFixed(0)} mm wide, at ${(r.at.u - h.F.u).toFixed(0)},${(r.at.v - h.F.v).toFixed(0)} from the fulcrum`).join('; ');

  for (const [which, want] of [
    ['far', { thumb: 1, index: 1, middle: 1, ring: 1, little: 1 }],
    ['near', { ring: 1, little: 1 }],
  ] as const) {
    it(`the ${which === 'far' ? 'left hand (palm side)' : 'right fist (little-finger side)'}: as many finger-sized forms as digits — each digit one region, the palm none`, () => {
      const h = plan.arms[which].placed!;
      const rs = regions(h);
      const big = rs.filter((r) => r.area >= 40);
      const all = report(h, big);
      // each digit: exactly one visible region of any size above a speck (≥ 4 mm²)
      for (const d of Object.keys(want)) {
        const i = h.parts.findIndex((p: PPart) => p.digit === d);
        const n = rs.filter((r) => r.id === `${i}` && r.area >= 4).length;
        assert.equal(n, 1, `${d}: ${n} visible regions (${all})`);
      }
      // finger-sized forms: only the digits (the right fist's ring finger is a sliver beyond the little finger)
      const fingerSized = big.filter((r) => r.width >= 12 && r.width <= 25);
      const digitIds = new Set(h.parts.map((p: PPart, i: number) => (p.digit ? `${i}` : '')).filter(Boolean));
      const stray = fingerSized.filter((r) => !digitIds.has(r.id));
      assert.equal(stray.length, 0, `a non-digit region is finger-sized (${all})`);
      const digitsSeen = new Set(big.filter((r) => digitIds.has(r.id)).map((r) => r.id));
      assert.equal(digitsSeen.size, Object.keys(want).length, `${digitsSeen.size} digits seen (${all})`);
      if (which === 'far') assert.equal(fingerSized.length, 5, `left: ${fingerSized.length} finger-sized forms (${all})`);
    });
  }

  it('each finger is one simple outline: a single closed path that never crosses itself', () => {
    const AHm = R(AUTH);
    const cross = (a: Pt, b: Pt, c: Pt, d: Pt) => {
      const o = (p: Pt, q: Pt, r: Pt) => Math.sign((q.u - p.u) * (r.v - p.v) - (q.v - p.v) * (r.u - p.u));
      return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
    };
    for (const v of ['fistEdge', 'palmThumb'] as const)
      for (const p of AHm.handArt(v).parts as { name: string; kind: string; outline: Pt[] }[]) {
        if (p.kind !== 'digit') continue;
        const o = p.outline;
        const n = o.length;
        for (let i = 0; i < n; i++)
          for (let j = i + 2; j < n; j++) {
            if (i === 0 && j === n - 1) continue;
            assert.ok(!cross(o[i], o[(i + 1) % n], o[j], o[(j + 1) % n]), `${v} ${p.name}: its outline crosses itself (edges ${i}, ${j})`);
          }
      }
  });

  it('the left hand: four fingers lie across the front of the stick, near right angles to it, covering ≥ 60 mm of it between the index and the little finger', () => {
    const h = plan.arms.far.placed!;
    const s = GE.unit(GE.sub(h.bead, h.butt));
    const fingers = (h.parts as PPart[]).filter((p) => p.digit && p.digit !== 'thumb');
    assert.equal(fingers.length, 4);
    for (const f of fingers) {
      const a = GE.unit(GE.sub(f.placedAxis[1], f.placedAxis[0]));
      const off = 90 - (Math.acos(Math.min(1, Math.abs(GE.dot(a, s)))) * 180) / Math.PI;
      assert.ok(off <= 25, `${f.digit}: ${off.toFixed(0)}° off a right angle to the stick`);
      assert.equal(f.layer, 'front', `${f.digit} in front of the stick`);
    }
    // the stick's centre line under the fingers: the longest covered run
    const L = Math.hypot(h.bead.u - h.butt.u, h.bead.v - h.butt.v);
    let run = 0;
    let best = 0;
    for (let x = 0; x <= L; x += 0.5) {
      const q = GE.add(h.butt, GE.mul(s, x));
      if (fingers.some((f) => GE.inPoly(q, f.placed))) best = Math.max(best, (run += 0.5));
      else run = 0;
    }
    assert.ok(best >= 60, `the fingers cover ${best.toFixed(0)} mm of the stick`);
    // the order along the stick: index nearest the tip, then middle, ring, little nearest the butt
    const along = (f: PPart) => GE.dot(GE.sub(GE.lerp(f.placedAxis[0], f.placedAxis[1], 0.5), h.F), s);
    const by = (d: string) => fingers.find((f) => f.digit === d)!;
    assert.ok(along(by('index')) > along(by('middle')) && along(by('middle')) > along(by('ring')) && along(by('ring')) > along(by('little')), 'index, middle, ring, little from the tip toward the butt');
  });

  it('the left hand: each fingertip carries its nail (inside the finger, at its end); the thumb is whole, painted last', () => {
    const AHm = R(AUTH);
    const art = AHm.handArt('palmThumb');
    const parts = art.parts as { name: string; digit?: string; outline: Pt[]; chain?: { pts: Pt[] } }[];
    for (const d of ['index', 'middle', 'ring', 'little']) {
      const f = parts.find((p) => p.digit === d)!;
      const tip = f.chain!.pts[f.chain!.pts.length - 1];
      const nail = (art.nails as Pt[][]).find((n) => n.every((q) => GE.inPoly(q, f.outline)) && n.some((q) => Math.hypot(q.u - tip.u, q.v - tip.v) < 8));
      assert.ok(nail, `${d}: a nail at its tip`);
    }
    assert.equal(parts[parts.length - 1].digit, 'thumb', 'the thumb is the last form painted');
  });
});

/*
 * THE CUFF'S OPENING (owner 2026-11-23, the left cuff: "there is a transparent
 * circle in the sleeve, then a gray disk representing the hand going in, but
 * it is behind both edges of the sleeve, not going inside"). Back to front:
 * the far half of the rim and the sleeve's inside; the wrist coming out over
 * them; the near half of the rim in front of the wrist. The cloth is opaque.
 */
describe('figure V2 — the cuff: the wrist goes INTO the sleeve (owner 2026-11-23)', () => {
  const plan = KD.kitDrummerPlan();
  const side = read('src/screens/lab/miking/lessons/shared/figureV2/FigureV2Side.tsx');

  it('paint order per arm: the far rim and the inside, then the wrist and hand, then the near rim', () => {
    const body = side.slice(side.indexOf('function Arm('), side.indexOf("/** The trousers' cloth as one garment"));
    const at = (k: string) => [...body.matchAll(new RegExp(k.replace(/[{}]/g, '\\$&'), 'g'))].map((m) => m.index!);
    const far = at('{cuffFar}\n');
    const hand = at('{hand}\n');
    const near = at('{cuffNear}\n');
    assert.equal(far.length, 3, 'every branch paints the far rim');
    assert.equal(hand.length, 3);
    assert.equal(near.length, 3, 'every branch paints the near rim');
    for (let i = 0; i < 3; i++) {
      assert.ok(far[i] < hand[i] && hand[i] < near[i], `branch ${i + 1}: far rim → hand → near rim`);
      if (i < 2) assert.ok(near[i] < far[i + 1]);
    }
  });

  it('no see-through ring: no stroked full ellipse and no translucent fill at the cuff — only the rim’s open halves are stroked', () => {
    assert.doesNotMatch(side, /cuffRim|mouthLip/);
    const cuff = side.slice(side.indexOf('function CuffFar('), side.indexOf('function Arm('));
    // the opening's area is filled once, opaque (the sleeve's inside), and never stroked
    assert.doesNotMatch(cuff, /path=\{P\.opening\}[^>]*style="stroke"/);
    assert.match(cuff, /<Path path=\{P\.opening\}>\s*<LinearGradient/);
    for (const m of cuff.matchAll(/<Path path=\{([^}]+)\}[^>]*style="stroke"/g)) assert.ok(['P.rimNear', 'P.rimFar', 'P.cuffCloth'].includes(m[1]) || m[1] === 'P.seam', `stroked: ${m[1]}`);
  });

  it('the rim is split in halves (open curves, end to end across the opening); the cloth ends at the near half; the wrist comes out over the far half', () => {
    for (const a of [plan.arms.near, plan.arms.far]) {
      const o = a.opening;
      const ends = (q: Pt[]) => Math.hypot(q[0].u - q[q.length - 1].u, q[0].v - q[q.length - 1].v);
      assert.ok(Math.abs(ends(o.rimNear) - 2 * o.e.ry) < 0.5, 'the near half runs from one side of the opening to the other');
      if (o.rimFar) assert.ok(Math.abs(ends(o.rimFar) - 2 * o.e.ry) < 0.5);
      if (a.mouth) {
        assert.equal(o.toViewer, false, 'the right forearm runs away: its mouth turned away, only its near edge shows');
        continue;
      }
      // the left forearm comes a little toward the viewer: the opening shows, its far half beyond the wrist's root
      assert.equal(o.toViewer, true, 'the left cuff’s opening is turned toward the viewer');
      const along = (q: Pt) => GE.dot(GE.sub(q, o.e.c), o.out);
      for (const q of a.cuff as Pt[]) assert.ok(along(q) <= 0.01, 'no cloth beyond the near rim');
      const farMid = GE.add(o.e.c, GE.mul(o.out, o.e.rx));
      assert.ok(GE.inPoly(farMid, a.wristSkin), 'the wrist lies over the middle of the far rim');
      assert.ok(Math.min(...(a.wristSkin as Pt[]).map(along)) < -o.e.rx, 'and starts inside the sleeve, behind the near rim');
    }
  });
});

describe('figure V2 — the whole drummer, owner notes 2026-11-23', () => {
  const plan = KD.kitDrummerPlan();

  it('"lighten the brown band going diagonally across the head": the head’s ramp only darkens, gently — no core-shadow ring', () => {
    const { HEAD_SKIN } = PAL as unknown as { HEAD_SKIN: { form: string[] } };
    const lum = (h: string) => {
      const n = parseInt(h.slice(1), 16);
      return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
    };
    const L = HEAD_SKIN.form.map(lum);
    for (let i = 1; i < L.length; i++) assert.ok(L[i] <= L[i - 1] + 0.5, `the ramp lightens again at stop ${i} (a ring)`);
    assert.ok(L[0] - L[L.length - 1] <= 70, `lit to far side ${(L[0] - L[L.length - 1]).toFixed(0)} levels (gentle modelling)`);
    const side = read('src/screens/lab/miking/lessons/shared/figureV2/FigureV2Side.tsx');
    for (const p of ['neck', 'skull', 'ear']) assert.match(side, new RegExp(`<Form path=\{P\.${p}\} mat=\{HEAD_SKIN\} round=`));
  });

  it('"The left shoulder looks displaced and behind…": nothing of the far arm lies outside the back at ANY height from the shoulder to the belt; it has no shoulder cap', () => {
    const f = plan.arms.far;
    assert.ok(f.behind, 'the far arm is drawn hidden behind the torso');
    // the back's outline (the shirt's back side), interpolated by height
    const back = (plan.shirt as Pt[]).slice(9).sort((p, q) => p.v - q.v);
    const backAt = (v: number) => {
      for (let i = 1; i < back.length; i++)
        if (v <= back[i].v) {
          const t = (v - back[i - 1].v) / (back[i].v - back[i - 1].v || 1);
          return back[i - 1].u + (back[i].u - back[i - 1].u) * t;
        }
      return back[back.length - 1].u;
    };
    const beltV = Math.min(...(plan.beltTop as Pt[]).map((q) => q.v));
    const pts: [string, Pt[]][] = [
      ['upper sleeve', f.upper],
      ['forearm sleeve', f.foreSleeve],
      ...(f.folds as Pt[][]).map((q, i) => [`fold ${i}`, q] as [string, Pt[]]),
    ];
    for (const [name, q] of pts)
      for (const p of q) {
        if (p.v < f.shoulder.v - 40 || p.v > beltV) continue;
        const inside = plan.facing * (p.u - backAt(p.v));
        assert.ok(inside >= 7, `${name} ${inside.toFixed(0)} mm from the back's edge at ${p.u.toFixed(0)},${p.v.toFixed(0)} (≥ 7 inside)`);
      }
    // the occlusion shadow is clipped to the far sleeve, so it lies where the sleeve lies
    assert.match(read('src/screens/lab/miking/lessons/shared/figureV2/FigureV2Side.tsx'), /plan\.arms\.far\.behind\s*\?\s*\[P\.far\.upper, P\.far\.foreSleeve\]\.map\(\(q, i\) => \(\s*<Group key=\{`occ\$\{i\}`\} clip=\{q\}>/);
    // no deltoid cap: no seam, and the sleeve's root no wider than the arm
    assert.equal(f.armhole.length, 0, 'no set-in seam on the far arm');
    const top = Math.min(...(f.upper as Pt[]).map((q) => q.v));
    assert.ok(top >= f.shoulder.v - 31, `the far sleeve rises ${(f.shoulder.v - top).toFixed(0)} mm above the shoulder point (a cap)`);
    // the drawing, not the pose: the elbow carried forward (out to the side), the forearm not stretched or crushed
    assert.ok(f.behind!.elbowShift <= 90, `the drawn far elbow moved ${f.behind!.elbowShift.toFixed(0)} mm`);
    assert.ok(f.behind!.foreRatio >= 0.85 && f.behind!.foreRatio <= 1.15, `the far forearm at ${(f.behind!.foreRatio * 100).toFixed(0)} % of its length`);
  });

  it('the far wrist, cuff and hand are exactly where the pose puts them (the clamp moves only the elbow and the sleeve); the near arm is unchanged', () => {
    const free = KD.kitDrummerPlan(undefined, { farBehind: false });
    const a = plan.arms.far;
    const b = free.arms.far;
    assert.equal(b.behind, null);
    assert.deepEqual(b.elbow, b.line[0]);
    assert.deepEqual(a.wrist, b.wrist, 'the wrist');
    assert.deepEqual(a.line.slice(-2), b.line.slice(-2), 'the forearm’s last stretch (into the cuff)');
    assert.deepEqual(a.cuff, b.cuff, 'the cuff');
    assert.deepEqual(a.opening, b.opening, 'the cuff’s opening');
    assert.deepEqual(a.wristSkin, b.wristSkin, 'the wrist');
    assert.deepEqual(a.placed!.wrist, b.placed!.wrist, 'the hand’s wrist');
    assert.deepEqual(a.placed!.F, b.placed!.F, 'the hand on the fulcrum');
    assert.deepEqual(
      a.placed!.parts.map((q: { placed: Pt[] }) => q.placed),
      b.placed!.parts.map((q: { placed: Pt[] }) => q.placed),
      'every part of the hand, point for point',
    );
    assert.deepEqual(plan.arms.near.upper, free.arms.near.upper, 'the near arm');
    assert.deepEqual(plan.arms.near.line, free.arms.near.line);
    assert.equal(plan.arms.near.behind, null);
  });

  it('"lighten" (the jaw\'s shadow on the neck): about half strength, softer', () => {
    const side = read('src/screens/lab/miking/lessons/shared/figureV2/FigureV2Side.tsx');
    const m = side.match(/<Path path=\{P\.jawShadow\} color=\{MAT\.skin\.deep\} opacity=\{([\d.]+)\}>\s*<BlurMask blur=\{([\d.]+)\}/);
    assert.ok(m, 'the jaw shadow');
    assert.ok(Number(m![1]) <= 0.27, `opacity ${m![1]}`);
    assert.ok(Number(m![2]) >= 6, `blur ${m![2]}`);
  });
});
