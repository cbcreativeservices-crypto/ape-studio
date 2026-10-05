/**
 * Lab 4 (Strings) ART PASS 2026-10-05 — the framing, the label layout and the
 * shared player, checked as RELATIONSHIPS (charter §9):
 *
 *   • FRAMING (frameGuitarViews): each variant's face view is framed on the
 *     instrument — it spans at least half the stage's width, the ukulele and
 *     the mandolin included — at the stage's aspect; every zone's drawn box
 *     and every start lies inside both views, inside the mic's roam
 *     (useRig.boundsOf: the overlap of the two boxes, 20 mm in);
 *   • LABELS (labelLayout.fitLabels): a label never lands on a zone (an
 *     obstacle), it takes an alternative place or its short form first, and a
 *     label moved off its part carries a leader to it;
 *   • the PLAYER skeleton (shared/players): joints come from the model's
 *     envelopes — the strumming hand inside its keep-out, the fretting hand
 *     on the neck, the head at the head envelope — at true human size for
 *     every instrument (the same shoulder width for a ukulele as a bass).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { DocumentedZone, Lesson, ViewBox } from '../src/screens/lab/miking/engine/model/types.ts';
import { viewsOf } from '../src/screens/lab/miking/engine/model/types.ts';
import { fitXform } from '../src/screens/lab/miking/engine/geometry/frame.ts';
import { chooseInsetCorner, fitLabels } from '../src/screens/lab/miking/engine/scene/labelLayout.ts';
import { HEAD_REACH, INSET_SHARE, STAGE_ASPECT } from '../src/screens/lab/miking/lessons/shared/guitars/guitarModel.ts';
import { C01_LESSON } from '../src/screens/lab/miking/lessons/c01Guitar/lesson.ts';
import { C07_LESSON } from '../src/screens/lab/miking/lessons/c07AcousticBass/lesson.ts';
import { C03_LESSON } from '../src/screens/lab/miking/lessons/c03Resonator/lesson.ts';
import { C05A_LESSON } from '../src/screens/lab/miking/lessons/c05aBanjo/lesson.ts';
import { C05B_LESSON } from '../src/screens/lab/miking/lessons/c05bMandolin/lesson.ts';
import { C05C_LESSON } from '../src/screens/lab/miking/lessons/c05cUkulele/lesson.ts';
import { C01_BUILT } from '../src/screens/lab/miking/lessons/c01Guitar/geometry.ts';
import { C03_BUILT } from '../src/screens/lab/miking/lessons/c03Resonator/geometry.ts';
import { C05A_BUILT } from '../src/screens/lab/miking/lessons/c05aBanjo/geometry.ts';
import { C05B_BUILT } from '../src/screens/lab/miking/lessons/c05bMandolin/geometry.ts';
import { C05C_BUILT } from '../src/screens/lab/miking/lessons/c05cUkulele/geometry.ts';
import { C07_BUILT } from '../src/screens/lab/miking/lessons/c07AcousticBass/geometry.ts';
import type { BuiltGuitarModel } from '../src/screens/lab/miking/lessons/shared/guitars/guitarModel.ts';
import { guitarPlayerPose } from '../src/screens/lab/miking/lessons/shared/guitars/guitarPlayer.ts';
import { BODY } from '../src/screens/lab/miking/lessons/shared/players/playerPose.ts';

const LESSONS: [Lesson, BuiltGuitarModel][] = [
  [C01_LESSON, C01_BUILT],
  [C03_LESSON, C03_BUILT],
  [C05A_LESSON, C05A_BUILT],
  [C05B_LESSON, C05B_BUILT],
  [C05C_LESSON, C05C_BUILT],
  [C07_LESSON, C07_BUILT],
];

const inside = (b: ViewBox, u: number, v: number, pad = 0) => u >= b.u0 + pad - 1e-6 && u <= b.u1 - pad + 1e-6 && v >= b.v0 + pad - 1e-6 && v <= b.v1 - pad + 1e-6;

describe('framing: each instrument fills its stage (frameGuitarViews)', () => {
  for (const [lesson, built] of LESSONS) {
    for (const v of lesson.model.variants) {
      const sc = built.scenes[v.id];
      const views = viewsOf(lesson.model, v.id);
      // The main view (the engine's side view) is what the glass shows first.
      const main = views.side!;
      it(`${lesson.id}/${v.id}: the instrument spans at least half the main view, at the stage's aspect`, () => {
        const span = sc.g.L + sc.variant.spec.neck.headLen.mm - sc.g.tail;
        assert.ok(span / (main.u1 - main.u0) >= 0.5, `${span} of ${main.u1 - main.u0}`);
        const a = (main.u1 - main.u0) / (main.v1 - main.v0);
        assert.ok(Math.abs(a - STAGE_ASPECT) < 0.02, `aspect ${a}`);
      });
      it(`${lesson.id}/${v.id}: the headstock and its tuners stay clear of the glass's inset (a right-hand corner)`, () => {
        const at = lesson.model.insetAt;
        const corner = typeof at === 'string' ? at : at?.[v.id];
        assert.ok(corner === 'top' || corner === 'bottom');
        const h = main.v1 - main.v0;
        if (corner === 'top') assert.ok(main.v0 + INSET_SHARE * h <= -(sc.o.lap ? 40 : HEAD_REACH) + 1e-6);
        else assert.ok(main.v1 - INSET_SHARE * h >= (sc.o.lap ? 60 : HEAD_REACH) - 1e-6, `${main.v1 - INSET_SHARE * h}`);
      });
      it(`${lesson.id}/${v.id}: both views share one x range (the stacked pair lines up on x)`, () => {
        assert.equal(views.side!.u0, views.top!.u0);
        assert.equal(views.side!.u1, views.top!.u1);
      });
      const zones = lesson.zones.filter((z: DocumentedZone) => z.requires?.variant === v.id);
      it(`${lesson.id}/${v.id}: every zone's box and start lies inside both views and the mic's roam`, () => {
        assert.ok(zones.length > 0);
        for (const z of zones) {
          for (const view of ['side', 'top'] as const) {
            const d = z.drawn?.[view];
            if (d && 'u0' in d) {
              assert.ok(inside(views[view]!, d.u0, d.v0) && inside(views[view]!, d.u1, d.v1), `${z.id} ${view} box`);
            }
          }
          const p = z.start.p;
          assert.ok(inside(views.side!, p.x, p.y, 20), `${z.id} start in side roam`);
          assert.ok(inside(views.top!, p.x, p.z, 20), `${z.id} start in top roam`);
        }
      });
    }
  }
});

describe('the shared player: joints from the model, at true size (guitarPlayer.ts)', () => {
  const inBox = (b: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } }, u: number, v: number, axis: 'y' | 'z', pad = 0) =>
    u >= b.min.x - pad && u <= b.max.x + pad && v >= b.min[axis] - pad && v <= b.max[axis] + pad;
  for (const [lesson, built] of LESSONS) {
    for (const v of lesson.model.variants) {
      const sc = built.scenes[v.id];
      const front = guitarPlayerPose(sc, 'side');
      const above = guitarPlayerPose(sc, 'top');
      it(`${lesson.id}/${v.id}: the head sits on the head envelope; the shoulders are an adult's, whatever the instrument`, () => {
        const hc = sc.o.P(sc.fit.head.c);
        assert.equal(front.head.c.u, hc.x);
        assert.equal(front.head.c.v, sc.o.lap ? hc.y : sc.fit.head.c.y);
        assert.equal(front.shoulderL.u - front.shoulderR.u, 2 * BODY.shoulderHalf);
        assert.equal(above.shoulderL.u - above.shoulderR.u, 2 * BODY.shoulderHalf);
        assert.equal(front.head.r, sc.fit.head.r);
      });
      if (!sc.o.lap) {
        it(`${lesson.id}/${v.id}: the fretting fingertips stop on the board, in four neighbouring fret spaces within a hand's reach`, () => {
          const b = front.handL.board!;
          assert.equal(b.tips.length, 4);
          assert.ok(Math.max(...b.tips) - Math.min(...b.tips) <= 100);
          for (const t of b.tips) {
            assert.ok(t > sc.g.edge && t < sc.g.L, 'on the neck');
            assert.ok(inBox(sc.fit.fret, t, 0, 'y'), 'inside the fretting hand’s keep-out');
          }
        });
        it(`${lesson.id}/${v.id}: the picking hand is drawn round the picking envelope's far end, over the strings`, () => {
          const c = { u: front.handR.wrist.u + Math.cos(front.handR.dir) * BODY.handLen * 0.42, v: front.handR.wrist.v + Math.sin(front.handR.dir) * BODY.handLen * 0.42 };
          assert.ok(Math.hypot(c.u - sc.fit.arm.b.x, c.v - sc.fit.arm.b.y) < 20);
          assert.ok(inBox(sc.fit.pick, c.u, c.v, 'y', 30));
        });
        it(`${lesson.id}/${v.id}: seen from above, the head and shoulders are behind the instrument's back`, () => {
          assert.ok(above.head.c.v + above.head.r < 0);
          assert.ok(above.shoulderR.v < -sc.g.depth);
        });
      } else {
        it(`${lesson.id}/${v.id}: lap style, the bar lies across the strings over the neck`, () => {
          const b = front.handL.board!;
          assert.ok(b.tips[0] > sc.g.edge && b.tips[0] < sc.g.L);
          assert.ok(b.v < 0, 'above the top (the top faces up, −v)');
        });
      }
    }
  }
});

describe('labels: placed clear of the zones (labelLayout)', () => {
  const xf = fitXform('side', { u0: 0, u1: 400, v0: 0, v1: 250 }, 400, 250, 0);
  it('a label whose place is under an obstacle takes its alternative place, with a leader', () => {
    const kept = fitLabels([{ id: 'a', text: 'SOUND HOLE', u: 100, v: 100, align: 'center' as const, at: { u: 100, v: 100 }, alts: [{ u: 100, v: 200, align: 'center' as const }] }], xf, 1, 400, undefined, [{ x0: 40, x1: 160, y0: 80, y1: 130 }]);
    assert.equal(kept.length, 1);
    assert.equal(kept[0].v, 200);
    assert.ok(kept[0].leader, 'a leader back to the part');
  });
  it('the full words in another place come before the short form in the first place', () => {
    const kept = fitLabels([{ id: 'a', text: 'NECK JOINT', short: 'JOINT', u: 100, v: 100, align: 'center' as const, alts: [{ u: 300, v: 100, align: 'center' as const }] }], xf, 1, 400, undefined, [{ x0: 60, x1: 140, y0: 80, y1: 120 }]);
    assert.equal(kept[0].text, 'NECK JOINT');
    assert.equal(kept[0].u, 300);
  });
  it('a label with no clear place is dropped, never drawn over the zone', () => {
    const kept = fitLabels([{ id: 'a', text: 'BRIDGE', u: 100, v: 100, align: 'center' as const }], xf, 1, 400, undefined, [{ x0: 0, x1: 400, y0: 0, y1: 250 }]);
    assert.equal(kept.length, 0);
  });
  it('the inset takes the other right-hand corner when its own would cover the headstock', () => {
    const rects = { top: { x0: 280, x1: 380, y0: 0, y1: 100 }, bottom: { x0: 280, x1: 380, y0: 150, y1: 250 } };
    assert.equal(chooseInsetCorner({ u0: 300, u1: 400, v0: 160, v1: 200 }, xf, rects, 'bottom'), 'top');
    assert.equal(chooseInsetCorner({ u0: 300, u1: 400, v0: 110, v1: 140 }, xf, rects, 'bottom'), 'bottom');
    assert.equal(chooseInsetCorner(undefined, xf, rects, 'top'), 'top');
  });
  it('without obstacles or alternatives nothing changes (the drum lessons)', () => {
    const l = [{ id: 'a', text: 'BATTER HEAD', u: 100, v: 100, align: 'center' as const }];
    const kept = fitLabels(l, xf, 1, 400);
    assert.deepEqual(kept, l);
  });
});
