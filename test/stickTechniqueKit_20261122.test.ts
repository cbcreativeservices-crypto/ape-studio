/**
 * NORMAL STICK TECHNIQUE on every kit and cymbal picture (owner 2026-11-22,
 * on the Concert Snare screenshot he named "drumstickhasunrealisticangle":
 * "look for other labs with drum sticks and make sure they are not all crazy
 * like this example. It should look like normal stick tech. usage").
 *
 * Every pose is computed with the SAME functions the art draws with
 * (shared/kitScene/stickPose.ts + kitStrokes.ts, used by stickPlayer.tsx and
 * KitSceneArt.tsx), and the standard is asserted as numbers:
 *   • a 406 mm stick, held at its fulcrum 290 mm from the bead (116 mm of
 *     butt behind it): never stretched; drawn ≤ 406 mm in either view;
 *   • the angle to what it strikes (a tilted tom against its own head):
 *     drums 8–18°, hi-hat 8–25°, ride 10–25°, crash / China (the SHOULDER on
 *     the edge, the tip over the plate) 10–45°, splash 8–30°;
 *   • on a drum, the fist (fulcrum) 30–100 mm over the head;
 *   • both sticks on one drum: a V of 60–90° from above, the beads 30–60 mm
 *     apart near the middle, neither bead on a hand;
 *   • the side and the top view of every stick agree in x (one 3-D pose);
 *   • a raised stick pivots at the wrist (the hand where the stroke had it);
 *   • the arm is a relaxed two-bone arm (adult bones, elbow 70–145°, wrist
 *     bent ≤ 45°, elbow under the shoulder, a drum's forearm falling to it);
 *   • no suggested mic position inside a stick or a hand; no label on a stick
 *     and no leader across one (except the STICK label's own leader).
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const P = R(await import('../src/screens/lab/miking/lessons/shared/kitScene/stickPose.ts'));
const K = R(await import('../src/screens/lab/miking/lessons/shared/kitScene/kitStrokes.ts'));
const { BODY } = R(await import('../src/screens/lab/miking/lessons/shared/players/playerPose.ts'));
const { ARM } = R(await import('../src/screens/lab/miking/lessons/shared/foley/performer.ts'));
const { S0_KIT } = R(await import('../src/screens/lab/miking/lessons/m02Snare/model.ts'));
const { DRUMMER, kitEnvelopes } = R(await import('../src/screens/lab/miking/lessons/shared/kitScene/kitSceneModel.ts'));
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const { lessonArt } = R(await import('../src/screens/lab/miking/data/lessonArt.ts'));
const { labelRect, leaderLine, segsCross } = R(await import('../src/screens/lab/miking/engine/scene/labelLayout.ts'));
const { fitXform } = R(await import('../src/screens/lab/miking/engine/geometry/frame.ts'));
const { viewsOf } = R(await import('../src/screens/lab/miking/engine/model/types.ts'));
const { sceneFrame } = R(await import('../src/screens/lab/miking/engine/geometry/contentFrame.ts'));
const { layoutArtLabels } = R(await import('../src/screens/lab/miking/engine/scene/artLabels.ts'));
const { liveReserve } = R(await import('../src/screens/lab/miking/engine/scene/PlacementScene.tsx'));
const { strikeArmStick } = R(await import('../src/screens/lab/miking/lessons/shared/kitScene/stickPlayer.tsx'));

type V3 = { x: number; y: number; z: number };
type P2 = { x: number; y: number };
const DEG = Math.PI / 180;
const sub = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const len = (a: V3) => Math.hypot(a.x, a.y, a.z);
const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const d2 = (a: { u: number; v: number }, b: { u: number; v: number }) => Math.hypot(a.u - b.u, a.v - b.v);

/** The struck thing of each picture's RIGHT hand: its angle range. */
const RIGHT_KIND: Record<string, [kind: 'drum' | 'hats' | 'ride' | 'crash' | 'splash' | 'level', lo: number, hi: number]> = {
  SNARE_PAIR: ['drum', 8, 18],
  RACK_TOM: ['drum', 8, 18],
  FLOOR_TOM: ['drum', 8, 18],
  HIHAT_LESSON: ['hats', 8, 25],
  KIT_GROOVE: ['hats', 8, 25],
  CRASH16: ['crash', 10, 45],
  CRASH18: ['crash', 10, 45],
  CHINA_UP: ['crash', 10, 45],
  CHINA_INV: ['crash', 10, 45],
  RIDE_BOW: ['ride', 10, 25],
  SPLASH_ON_ARM: ['splash', 8, 30],
  SPLASH_ON_CRASH: ['splash', 8, 30],
  CLOSEUP_CYMBAL: ['level', 10, 25],
};

const pictures = Object.entries(K.KIT_PICTURES) as [string, any][];

function strikeOf(a: any): any {
  // The stroke the raised stick was lifted from (the same hand, no raise).
  const sp = { ...a.spec };
  delete sp.raise;
  return P.solveStroke(a.hand, a.shoulder, sp);
}

describe('stick technique (owner 2026-11-22: "It should look like normal stick tech. usage")', () => {
  it('every picture is in the table (a new picture states its standard)', () => {
    assert.deepEqual(Object.keys(K.KIT_PICTURES).sort(), Object.keys(RIGHT_KIND).sort());
  });

  for (const [name, spec] of pictures) {
    const d = P.drummerPose(spec);
    const side = P.viewDrummer(d, 'side');
    const top = P.viewDrummer(d, 'top');
    for (const a of [d.R, d.L]) {
      const tag = `${name} ${a.hand === 'R' ? 'right' : 'left'}`;
      const raised = !!a.spec.raise;
      it(`${tag}: a real 406 mm stick, held 290 mm from the bead, reached without stretching`, () => {
        assert.equal(a.pulled, false, 'the arm reaches the stroke as specified');
        assert.ok(Math.abs(P.dist3(a.butt, a.bead) - 406) < 1e-6, `stick ${P.dist3(a.butt, a.bead)}`);
        assert.ok(Math.abs(P.dist3(a.fulcrum, a.bead) - 290) < 1e-6, 'fist to bead = the held length');
        assert.ok(Math.abs(P.dist3(a.fulcrum, a.butt) - 116) < 1e-6, '116 mm of butt behind the fist');
        assert.ok(Math.abs(P.dist3(a.wrist, a.fulcrum) - 70) < 1e-6, 'the wrist joint 70 mm behind the fulcrum');
        for (const [v, vd] of [['side', side], ['top', top]] as const) {
          const s = a.hand === 'R' ? vd.stick : vd.farStick;
          const drawn = Math.hypot(s.to.x - s.butt.x, s.to.y - s.butt.y);
          assert.ok(drawn <= 406 + 1e-6, `${v} drawn ${drawn.toFixed(1)} mm`);
          // fist → bead drawn is the held length foreshortened the same way as the stick
          const held = Math.hypot(s.to.x - s.from.x, s.to.y - s.from.y);
          assert.ok(Math.abs(held / drawn - 290 / 406) < 1e-6, `${v} grip at a third`);
        }
      });
      it(`${tag}: the side and the top view are one stick (they agree in x)`, () => {
        const ss = a.hand === 'R' ? side.stick : side.farStick;
        const ts = a.hand === 'R' ? top.stick : top.farStick;
        for (const k of ['butt', 'from', 'to'] as const) assert.ok(Math.abs(ss[k].x - ts[k].x) < 0.5, `${k}: side x ${ss[k].x.toFixed(1)} vs top x ${ts[k].x.toFixed(1)}`);
        const hs = a.hand === 'R' ? side.pose.handR : side.pose.handL;
        assert.ok(Math.abs(hs.wrist.u - a.wrist.x) < 0.5, 'side wrist');
        assert.ok(Math.abs(hs.wrist.v - a.wrist.y) < 0.5, 'side wrist height');
      });
      if (!raised) {
        it(`${tag}: the stick meets what it strikes at a normal angle`, () => {
          const [kind, lo, hi] = a.hand === 'R' ? RIGHT_KIND[name] : (['drum', 8, 18] as const);
          const ang = P.angleToSurface(a);
          assert.ok(ang >= lo && ang <= hi, `${kind}: ${ang.toFixed(1)}° (want ${lo}–${hi}°)`);
          const above = P.fistAbove(a);
          if (kind === 'drum') assert.ok(above >= 30 && above <= 100, `the fist ${above.toFixed(0)} mm over the head (want 30–100)`);
          if (a.spec.contact === 'shoulder') {
            // A glancing blow: the stick's shoulder on the edge, the tip over the plate.
            const sh = { x: a.bead.x - a.u.x * P.STICK.shoulder, y: a.bead.y - a.u.y * P.STICK.shoulder, z: a.bead.z - a.u.z * P.STICK.shoulder };
            assert.ok(P.dist3(sh, a.spec.at) < 1e-6, 'the shoulder is on the strike point');
            assert.ok(dot(sub(a.bead, a.spec.surface.c), a.spec.surface.n) > 0, 'the tip is over the plate, not through it');
          } else if (kind !== 'drum') {
            assert.ok(above > 15, `the stick comes from the top side (fist ${above.toFixed(0)} mm)`);
          }
          if (kind === 'drum' && a.spec.surface === K.CLOSEUP_DRUM.right.surface) {
            // the bead near the middle of the head
            const r = Math.hypot(a.bead.x - a.spec.surface.c.x, a.bead.z - a.spec.surface.c.z);
            assert.ok(r <= 0.4 * a.spec.surface.R, `bead ${r.toFixed(0)} mm from the centre`);
          }
        });
      } else {
        it(`${tag}: a raised stick pivots at the wrist — the hand stays where the stroke had it, the tip comes up 20–45°`, () => {
          const s = strikeOf(a);
          assert.ok(P.dist3(s.wrist, a.wrist) < 1e-6, 'the wrist where the striking hand would be');
          const rise = Math.acos(Math.max(-1, Math.min(1, dot(s.u, a.u)))) / DEG;
          assert.ok(rise >= 20 - 1e-9 && rise <= 45, `tip up ${rise.toFixed(1)}°`);
          assert.ok(a.bead.y < s.bead.y, 'the tip is higher than at the stroke');
          assert.ok(P.fistAbove(s) >= 30 && P.fistAbove(s) <= 100, 'its stroke was a normal one');
          assert.ok(P.angleToSurface(s) >= 8 && P.angleToSurface(s) <= 18, 'its stroke was a normal one');
        });
      }
      it(`${tag}: a relaxed arm (adult bones, elbow 70–145°, wrist ≤ 45°, the elbow under the shoulder)`, () => {
        assert.ok(Math.abs(P.dist3(a.shoulder, a.elbow) - P.DRUM_ARM.upper) < 1e-6, 'upper arm');
        assert.ok(Math.abs(P.dist3(a.elbow, a.wrist) - P.DRUM_ARM.fore) < 1e-6, 'forearm');
        const e = P.elbowAngle(a);
        assert.ok(e >= 70 && e <= 145, `elbow ${e.toFixed(0)}°`);
        const w = P.wristBend(a);
        assert.ok(w <= 45, `wrist bent ${w.toFixed(0)}°`);
        const [kindE] = a.hand === 'R' ? RIGHT_KIND[name] : ['drum'];
        // A drum: the upper arm hangs; a cymbal reached up and forward may lift
        // the elbow to (never above) the shoulder.
        assert.ok(a.elbow.y - a.shoulder.y >= (kindE === 'drum' ? 150 : 0), `the elbow ${(a.elbow.y - a.shoulder.y).toFixed(0)} mm under the shoulder`);
        // The elbow never thrown far behind the back (honest limit, see the
        // report: the kit's snare sits close to the throne).
        assert.ok(a.elbow.x - a.shoulder.x >= -110, `elbow ${(a.elbow.x - a.shoulder.x).toFixed(0)} mm behind the shoulder`);
        const side = a.hand === 'R' ? 1 : -1;
        // The elbow stays at its own side; a reach across the body (the right
        // hand to the hats or the 16 in crash on the left) brings it in front
        // of the chest a little, never across it.
        const across = a.hand === 'R' && a.spec.at.z < a.shoulder.z - 300;
        assert.ok(side * (a.elbow.z - a.shoulder.z) > (across ? -60 : 0), `the elbow ${(side * (a.elbow.z - a.shoulder.z)).toFixed(0)} mm out from its shoulder`);
        if (kindE === 'drum' && !raised) {
          const fs = P.forearmSlope(a);
          assert.ok(fs >= 0 && fs <= 35, `the forearm falls ${fs.toFixed(0)}° from the elbow`);
        }
      });
    }

    it(`${name}: neither bead lands on a hand, in either view`, () => {
      for (const vd of [side, top]) {
        const n = vd.pose.neck;
        // From above the pose is authored round the neck: undo the turn.
        const toPose = (p: P2) => (vd === side ? { u: p.x, v: p.y } : { u: n.u - (p.y - n.v), v: n.v + (p.x - n.u) });
        for (const [bead, other] of [
          [vd.stick.to, vd.pose.handL],
          [vd.farStick.to, vd.pose.handR],
        ] as const) {
          const b = toPose(bead);
          const tip = { u: other.wrist.u + Math.cos(other.dir) * BODY.handLen * 0.8, v: other.wrist.v + Math.sin(other.dir) * BODY.handLen * 0.8 };
          const vx = tip.u - other.wrist.u;
          const vy = tip.v - other.wrist.v;
          const t = Math.max(0, Math.min(1, ((b.u - other.wrist.u) * vx + (b.v - other.wrist.v) * vy) / (vx * vx + vy * vy)));
          const dist = Math.hypot(b.u - (other.wrist.u + t * vx), b.v - (other.wrist.v + t * vy));
          assert.ok(dist > BODY.handW / 2 + 5, `${vd === side ? 'side' : 'top'}: a bead ${dist.toFixed(0)} mm from the other fist`);
        }
      }
      assert.ok(P.dist3(d.R.bead, d.L.fulcrum) > 120 && P.dist3(d.L.bead, d.R.fulcrum) > 120, '3-D: no bead at the other hand');
    });

    it(`${name}: the drawn figure keeps the anatomy rules (both views)`, () => {
      for (const vd of [side, top]) {
        const pose = vd.pose;
        for (const [sh, el, h] of [
          [pose.shoulderR, pose.elbowR, pose.handR],
          [pose.shoulderL, pose.elbowL, pose.handL],
        ] as const) {
          assert.ok(d2(sh, pose.neck) <= BODY.shoulderHalf + 40, 'shoulder at the collar');
          assert.ok(d2(sh, el) <= ARM.upper * 1.15, 'upper arm');
          assert.ok(d2(el, h.wrist) <= ARM.fore * 1.15, 'forearm');
          if (pose.view === 'side') {
            // the hand turns ≤ 70° off its forearm (the figure test), the elbow never points forward
            const fore = Math.atan2(h.wrist.v - el.v, h.wrist.u - el.u);
            const bend = Math.abs(Math.atan2(Math.sin(h.dir - fore), Math.cos(h.dir - fore))) / DEG;
            if (d2(el, h.wrist) > 40) assert.ok(bend <= 70, `drawn wrist ${bend.toFixed(0)}°`);
            if (h.wrist.v >= sh.v + 100) {
              const t = (el.v - sh.v) / (h.wrist.v - sh.v);
              const lineU = sh.u + (h.wrist.u - sh.u) * t;
              assert.ok(el.u - lineU <= 15, 'the elbow does not point forward');
            }
          }
        }
        if (pose.view === 'side') {
          // The seat moved back (SEAT_BACK): the thighs keep an adult length.
          // (The legs below the knee are the kit scene's, unchanged here.)
          for (const [hp, kn] of [
            [pose.hipR, pose.kneeR],
            [pose.hipL, pose.kneeL],
          ] as const) assert.ok(d2(hp, kn) >= 360 && d2(hp, kn) <= 480, `thigh ${d2(hp, kn).toFixed(0)}`);
          const gap = d2(pose.head.c, pose.neck) / BODY.headH;
          assert.ok(gap >= 0.55 && gap <= 0.85, 'the head on its neck');
        }
      }
    });
  }

  it('the snare pair (M02): a V of 60–90° pointing at the playing spot, beads side by side 30–60 mm apart near the centre', () => {
    const d = P.drummerPose(K.SNARE_PAIR);
    const pr = { x: d.R.u.x, z: d.R.u.z };
    const pl = { x: d.L.u.x, z: d.L.u.z };
    const V = Math.acos((pr.x * pl.x + pr.z * pl.z) / Math.hypot(pr.x, pr.z) / Math.hypot(pl.x, pl.z)) / DEG;
    assert.ok(V >= 60 && V <= 90, `V ${V.toFixed(0)}°`);
    const gap = P.dist3(d.R.bead, d.L.bead);
    assert.ok(gap >= 30 && gap <= 60, `beads ${gap.toFixed(0)} mm apart`);
    assert.ok(d.R.bead.z > d.L.bead.z, 'the right bead on the right: the sticks do not cross');
    for (const a of [d.R, d.L]) assert.ok(Math.hypot(a.bead.x - P.SNARE_HEAD.c.x, a.bead.z - P.SNARE_HEAD.c.z) <= 0.4 * P.SNARE_HEAD.R, 'near the middle');
    // M02's own rule: the beads stay clear of the hi-hat stand (lesson u = −80).
    for (const a of [d.R, d.L]) assert.ok(a.bead.x - S0_KIT.x > -80 + 60, 'clear of the hi-hat stand');
  });

  it('the close-ups are the same strokes moved (drum ≈ the M02 stroke, cymbal 15° to a level plate)', () => {
    for (const kind of ['drum', 'cymbal'] as const) {
      const s = strikeArmStick({ x: 0, y: 0 }, kind);
      assert.ok(Math.abs(s.to.x) < 1e-9 && Math.abs(s.to.y) < 1e-9, 'the bead on the tip');
      assert.ok(Math.hypot(s.to.x - s.butt.x, s.to.y - s.butt.y) <= 406, 'never longer than the stick');
      const apparent = Math.atan2(s.to.y - s.butt.y, s.to.x - s.butt.x) / DEG;
      assert.ok(apparent > 5 && apparent < 30, `${kind}: seen at ${apparent.toFixed(0)}° in the close-up`);
    }
  });

  it('the drummer sits as an adult on the throne, inside its keep-out (head top 1390, the drawn head inside env.drummer)', () => {
    const env = kitEnvelopes().find((e: any) => e.id === 'env.drummer').shape;
    assert.equal(env.kind, 'capsule');
    for (const spec of Object.values(K.KIT_PICTURES) as any[]) {
      const d = P.drummerPose(spec);
      // the head's top point and its back within the capsule
      const a = env.a;
      const b = env.b;
      const segD = (p: V3) => {
        const ab = sub(b, a);
        const t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / dot(ab, ab)));
        return len(sub(p, { x: a.x + ab.x * t, y: a.y + ab.y * t, z: a.z + ab.z * t }));
      };
      const leaned = (spec.lean ?? 0) > 0;
      if (!leaned) assert.ok(segD({ ...d.head, y: d.head.y - 110 }) <= env.r + 1, 'head top inside the keep-out');
    }
    assert.ok(Math.abs(290.4 - DRUMMER.headTop.y - 1390) < 1e-9);
  });
});

/* ── the lessons that draw these sticks: mic zones and labels ── */

/** Lesson id → its drawn drummer per variant, and the lesson frame's origin in K. */
const LESSON_STICKS: Record<string, { spec: (variant: string) => any; origin: V3 }> = {
  M02: { spec: () => K.SNARE_PAIR, origin: S0_KIT },
  M03: { spec: (v) => (v === 'floor' || v === 'open' ? K.FLOOR_TOM : K.RACK_TOM), origin: { x: 0, y: 0, z: 0 } },
  I01a: { spec: () => K.HIHAT_LESSON, origin: { x: 0, y: 0, z: 0 } },
  I01b: { spec: () => K.RIDE_BOW, origin: { x: 0, y: 0, z: 0 } },
  I01c: { spec: (v) => (v === 'crash2' ? K.CRASH18 : K.CRASH16), origin: { x: 0, y: 0, z: 0 } },
  I01d: { spec: (v) => (v === 'piggy' ? K.SPLASH_ON_CRASH : K.SPLASH_ON_ARM), origin: { x: 0, y: 0, z: 0 } },
  I01e: { spec: (v) => (v === 'inverted' ? K.CHINA_INV : K.CHINA_UP), origin: { x: 0, y: 0, z: 0 } },
  M09: { spec: () => K.KIT_GROOVE, origin: { x: 0, y: 0, z: 0 } },
  M10: { spec: () => K.KIT_GROOVE, origin: { x: 0, y: 0, z: 0 } },
  M11: { spec: () => K.KIT_GROOVE, origin: { x: 0, y: 0, z: 0 } },
};

/** Distance from p to the segment a–b (3-D). */
function segDist3(p: V3, a: V3, b: V3): number {
  const ab = sub(b, a);
  const t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / (dot(ab, ab) || 1)));
  return len(sub(p, { x: a.x + ab.x * t, y: a.y + ab.y * t, z: a.z + ab.z * t }));
}

describe('the lessons around the new sticks', () => {
  for (const [id, L] of Object.entries(LESSON_STICKS)) {
    const lesson = lessonById(id);
    it(`${id}: the lesson exists`, () => assert.ok(lesson, id));
    if (!lesson) continue;
    it(`${id}: no suggested mic start sits in a stick or a hand (40 mm clear of the stick, 90 mm of the fist)`, () => {
      const bad: string[] = [];
      for (const z of lesson.zones ?? []) {
        const variants: string[] = z.requires?.variant ? [z.requires.variant] : z.requires?.variants ?? lesson.model.variants.map((v: any) => v.id);
        for (const variant of variants) {
          const d = P.drummerPose(L.spec(variant));
          const p = { x: z.start.p.x + L.origin.x, y: z.start.p.y + L.origin.y, z: z.start.p.z + L.origin.z };
          for (const a of [d.R, d.L]) {
            const sd = segDist3(p, a.butt, a.bead);
            const fd = segDist3(p, a.wrist, a.fulcrum);
            if (sd < 40 || fd < 90) bad.push(`${z.id} (${variant}) ${a.hand}: stick ${sd.toFixed(0)} mm, fist ${fd.toFixed(0)} mm`);
          }
        }
      }
      assert.deepEqual(bad, []);
    });
    it(`${id}: no label sits on a drawn stick and no leader crosses one (phone layouts)`, () => {
      const A = lessonArt(id);
      const bad = new Set<string>();
      for (const variant of lesson.model.variants.map((v: any) => v.id)) {
        const views = viewsOf(lesson.model, variant);
        const d = P.drummerPose(L.spec(variant));
        for (const view of Object.keys(views) as ('side' | 'top')[]) {
          const vd = P.viewDrummer(d, view);
          const o = { x: L.origin.x, y: view === 'side' ? L.origin.y : L.origin.z };
          const sticks = [vd.stick, vd.farStick].map((s: any) => ({ a: { x: s.butt.x - o.x, y: s.butt.y - o.y }, b: { x: s.to.x - o.x, y: s.to.y - o.y } }));
          const authored = views[view]!;
          const parts = sceneFrame(lesson.model, variant, view, false)!;
          const aspect = (parts.u1 - parts.u0) / (parts.v1 - parts.v0);
          const band = liveReserve(1, 390, 1);
          const layouts = [
            { where: 'figure', box: parts, w: 358, h: 358 / aspect, top: 0, pad: 6 },
            ...[300, 420, 640].map((h) => ({ where: `parts ${h}`, box: parts, w: 390, h, top: 0, pad: 8 })),
            ...[300, 420, 640].map((h) => ({ where: `stage ${h}`, box: authored, w: 390, h, top: band, pad: 8 })),
          ];
          for (const lay of layouts) {
            const f = fitXform(view, lay.box, lay.w, lay.h - lay.top, lay.pad);
            const xf = { ...f, oy: f.oy + lay.top };
            if (lay.where !== 'figure' && xf.s < (lesson.model.labelMinScale ?? 0.06)) continue;
            const px = (p: P2) => ({ x: xf.ox + p.x * xf.s, y: xf.oy + p.y * xf.s });
            const stickPx = sticks.map((s) => ({ x1: px(s.a).x, y1: px(s.a).y, x2: px(s.b).x, y2: px(s.b).y }));
            for (const l of layoutArtLabels(A, view, variant, authored, xf, 1, lay.w, lay.h, { minY: lay.top + 1, model: lesson.model })) {
              const r = labelRect(l, xf, 1, lay.w);
              // the words: a stick (half-width 7 mm) never runs through the box
              for (const sg of stickPx) {
                const n = 40;
                for (let i = 0; i <= n; i++) {
                  const x = sg.x1 + ((sg.x2 - sg.x1) * i) / n;
                  const y = sg.y1 + ((sg.y2 - sg.y1) * i) / n;
                  if (x > r.x0 + 1 && x < r.x1 - 1 && y > r.y0 + 1 && y < r.y1 - 1) bad.add(`${variant} ${view} ${lay.where}: "${l.text}" on a stick`);
                }
              }
              const at = l.leader ?? l.at ?? l.lead;
              const line = at ? leaderLine(r, xf, at) : null;
              if (!line) continue;
              const ownStick = l.id === 'stick';
              for (const sg of stickPx) {
                if (ownStick) continue;
                if (segsCross(sg, line)) bad.add(`${variant} ${view} ${lay.where}: "${l.text}" leader crosses a stick`);
              }
            }
          }
        }
      }
      assert.deepEqual([...bad], []);
    });
  }
});

/* ── the right foot on the redrawn kick pedal; the close-ups' step labels ── */

const { KIT } = R(await import('../src/screens/lab/miking/lessons/shared/kitPlanModel.ts'));
const { poseHit } = R(await import('../src/screens/lab/miking/lessons/shared/players/playerPose.ts'));
const { labelWidth } = R(await import('../src/screens/lab/miking/engine/scene/labelLayout.ts'));
const { uprightSoundBox } = R(await import('../src/screens/lab/miking/lessons/shared/drums/UprightSound.tsx'));
const { SNARE_14x55, TOM_12x8, FLOOR_16x16 } = R(await import('../src/screens/lab/miking/lessons/shared/drums/drumSpec.ts'));
const { TIMBALE_TIP } = R(await import('../src/screens/lab/miking/lessons/shared/handdrums/handSoundArt.tsx'));
const TIMB = R(await import('../src/screens/lab/miking/lessons/m04cTimbales/model.ts'));

describe('the drummer’s right foot is on the kick pedal (M01 pedal redrawn 2026-11-22)', () => {
  for (const [name, spec] of pictures) {
    it(`${name}: heel on the heel plate, toe on the footboard, the same foot from the side and from above`, () => {
      const d = P.drummerPose(spec);
      const side = P.viewDrummer(d, 'side').pose;
      const top = P.viewDrummer(d, 'top').pose;
      const ped = KIT.kick.pedal;
      // PlayerFigure's foot point is the ball of the foot: heel 96 behind, toe 150 ahead.
      assert.ok(side.footR.u - 96 >= ped.u0 - 5, `heel ${(side.footR.u - 96).toFixed(0)} behind the pedal (${ped.u0})`);
      assert.ok(side.footR.u + 150 <= ped.u1 + 10, 'toe on the footboard');
      const n = top.neck;
      const world = { x: n.u + (top.footR.v - n.v), z: n.v + (n.u - top.footR.u) };
      assert.ok(Math.abs(world.x - side.footR.u) < 0.5, 'side and top agree');
      assert.ok(Math.abs(world.z) <= ped.halfW, `from above the foot is on the pedal (z ${world.z.toFixed(0)})`);
      const ankle = { u: side.footR.u - 40, v: side.footR.v - 70 };
      const shin = d2(side.kneeR, ankle);
      assert.ok(shin >= 340 && shin <= 480, `right shin ${shin.toFixed(0)} mm`);
      assert.ok(ankle.u >= side.kneeR.u - 20, 'the shin leans toward the pedal, not back under the seat');
    });
  }
});

/** The close-up arm (StrikeArm) moved so its tip is on `tip`: does it cover (u, v)? */
function closeArmCovers(kind: 'drum' | 'cymbal', tip: P2, u: number, v: number, tol: number): boolean {
  const spec = kind === 'drum' ? K.CLOSEUP_DRUM : K.CLOSEUP_CYMBAL;
  const vd = P.viewDrummer(P.drummerPose(spec), 'side');
  const s = strikeArmStick(tip, kind);
  const sh = { x: s.to.x - vd.stick.to.x, y: s.to.y - vd.stick.to.y };
  // the stick
  const vx = s.to.x - s.butt.x;
  const vy = s.to.y - s.butt.y;
  const t = Math.max(0, Math.min(1, ((u - s.butt.x) * vx + (v - s.butt.y) * vy) / (vx * vx + vy * vy)));
  if (Math.hypot(u - (s.butt.x + t * vx), v - (s.butt.y + t * vy)) <= 8 + tol) return true;
  // the near arm and the fist (the far arm hangs out of the close-up)
  const p = vd.pose;
  const near = { ...p, shoulderL: p.shoulderR, elbowL: p.elbowR, handL: p.handR };
  return poseHit(near, u - sh.x, v - sh.y, tol);
}
/** A static label's box (mm) at a phone glass, as StaticLabels draws it. */
function boxMm(l: { u: number; v: number; text: string; align: string }, box: any, w = 390, h = 248) {
  const xf = fitXform('side', box, w, h, 6);
  const W = labelWidth(l.text, 1, w) / xf.s;
  const x0 = l.align === 'left' ? l.u : l.align === 'right' ? l.u - W : l.u - W / 2;
  return { u0: x0, u1: x0 + W, v0: l.v - 7 / xf.s, v1: l.v - 7 / xf.s + (9.5 * 1.25) / xf.s };
}
function boxClear(b: { u0: number; u1: number; v0: number; v1: number }, covers: (u: number, v: number) => boolean): boolean {
  for (let i = 0; i <= 16; i++) for (let j = 0; j <= 4; j++) if (covers(b.u0 + ((b.u1 - b.u0) * i) / 16, b.v0 + ((b.v1 - b.v0) * j) / 4)) return false;
  return true;
}

describe('the close-ups: a real stroke, held, its step labels clear of the arm', () => {
  it('the timbale stick (M04c how it sounds): a 406 mm dowel about 11° to the head, held; ① clear of the arm and stick', () => {
    const R0 = TIMB.SMALL.R;
    const headY = TIMB.SMALL.headY;
    const sx = TIMB.SMALL.c.x - 0.55 * R0;
    const tip = TIMBALE_TIP(sx, headY);
    const s = strikeArmStick(tip, 'drum');
    assert.ok(Math.hypot(s.to.x - s.butt.x, s.to.y - s.butt.y) <= 406, 'never longer than the stick');
    const a = P.drummerPose(K.CLOSEUP_DRUM).R;
    const ang = P.angleToSurface(a);
    assert.ok(ang >= 10 && ang <= 20, `the stroke ${ang.toFixed(1)}° to the head`);
    assert.ok(Math.abs(s.to.y - headY) <= 8 && Math.abs(s.to.x - sx) <= 8, 'the tip on the strike');
    const BOX = { u0: -R0 - 300, u1: R0 + 400, v0: headY - 330, v1: TIMB.SMALL.bottomY + 170 };
    const l1 = { u: sx + 40, v: headY - 170, text: '① THE STICK STRIKES', align: 'left' };
    for (const [w, h] of [[390, 248], [390, 320], [358, 260]] as const) assert.ok(boxClear(boxMm(l1, BOX, w, h), (u, v) => closeArmCovers('drum', tip, u, v, 4)), `① on the arm at ${w}×${h}`);
  });
  for (const [name, spec] of [['14 in snare', SNARE_14x55], ['12 in tom', TOM_12x8], ['16 in floor tom', FLOOR_16x16]] as const) {
    it(`the drum close-up (${name}): ① STRIKE clear of the arm and stick`, () => {
      const box = uprightSoundBox(spec);
      const l1 = { u: 30, v: -110, text: '① STRIKE', align: 'left' };
      assert.ok(boxClear(boxMm(l1, box), (u, v) => closeArmCovers('drum', { x: -6, y: -6 }, u, v, 4)));
    });
  }
});
