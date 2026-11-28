/**
 * ENSEMBLE SPACING (owner 2026-11-26: "spacing between musicians in several should be checked and improved.
 * especially rhythm section to the side of the horns in the big bands. there is a big gap..").
 *
 * The big band's rows (E16 bb.standard): the rhythm section moved toward the horn rows as ONE group
 * (seating.ts BB_RHYTHM_DX, +500 mm across) — the drums beside the trumpets, the bass beside the trombones, the
 * piano beside the saxes (D. Berger, On Conducting Jazz Ensembles; E. MacDonald, Jazz Big Band Seating
 * Placement) — tight against the rows, never on them:
 *   • the kick's front head about 0.5 m from the trumpet riser's end;
 *   • the bass's lower bout clear of the trombone riser's side by about 0.25 m (room for the bass);
 *   • the piano's case clear of the trombone riser's corner by about 0.5 m;
 *   • the four keep their places to each other (moved as a group), and their close mics move with them.
 * The jazz guitar group (E15 jazz.guitar): the guitarist and the amp moved together toward the bass
 * (bandStage.ts JAZZ_GTR_DX, +700 mm): 1.7 m from the bassist instead of 2.3 m.
 * Pure (no drawing).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BB_RHYTHM_DX, seatingOf } from '../src/screens/lab/miking/lessons/shared/ensemble/seating.ts';
import { ampOf, guitarPoint, GUITAR_POSE, JAZZ_GTR_DX, kitKickFront, local } from '../src/screens/lab/miking/lessons/shared/ensemble/bandStage.ts';
import { ensembleModel } from '../src/screens/lab/miking/lessons/shared/ensemble/ensembleModel.ts';
import { BOWED_POSE } from '../src/screens/lab/miking/lessons/shared/ensemble/ensembleHands.ts';
import { KIT } from '../src/screens/lab/miking/lessons/shared/kitPlanModel.ts';
import * as E16 from '../src/screens/lab/miking/lessons/e16BigBand/geometry.ts';

const BB = seatingOf('bb.standard');
const seat = (id: string) => BB.seats.find((q) => q.id === id)!;
const tbnRiser = BB.risers.find((r) => r.h === 200)!;
const tptRiser = BB.risers.find((r) => r.h === 400)!;

describe('E16 rows: the rhythm section beside the horns', () => {
  it('moved as one group, +500 mm across, each player keeping its place to the others', () => {
    assert.equal(BB_RHYTHM_DX, 500);
    const at = (id: string) => [seat(id).p.x, seat(id).p.z];
    assert.deepEqual(at('pno.1'), [-4800, -1000]);
    assert.deepEqual(at('gtr.1'), [-4500, -2800]);
    assert.deepEqual(at('cb.1'), [-2800, -2350]);
    assert.deepEqual(at('dr.1'), [-3700, -3900]);
    assert.equal(BB.stage.x0, -5500);
  });
  it('the drums beside the trumpets: the kick’s front head about 0.5 m from the trumpet riser’s end', () => {
    const k = kitKickFront(seat('dr.1')).c;
    // the front hoop's nearest edge across (the kick's radius, turned with the drummer)
    const halfW = KIT.kick.hoop.halfW;
    const nearX = k.x + halfW * Math.abs(Math.sin((seat('dr.1').face * Math.PI) / 180 - Math.PI / 2));
    const g = tptRiser.x0 - nearX;
    assert.ok(g >= 400 && g <= 700, `kick to the trumpet riser: ${Math.round(g)} mm`);
    assert.ok(k.z > tptRiser.z0 && k.z < tptRiser.z1, 'the kick points at the trumpet riser’s end');
  });
  it('the bass beside the trombones: its lower bout about 0.25 m clear of the riser’s side', () => {
    const q = seat('cb.1');
    const P = BOWED_POSE.bass;
    // The lower bout: about 0.3 m up the body from its tail block, about 0.65 m across (a 3/4 bass) and
    // 0.22 m deep, turned with the player: its reach across the stage (+x) is the ellipse's support.
    const t = { right: P.tail.x + P.d.x * 300, fwd: P.tail.z + P.d.z * 300 };
    const c = local(q.p, q.face, t.fwd, t.right, 0);
    const F = (q.face * Math.PI) / 180;
    const reach = Math.hypot(330 * Math.cos(F), 110 * Math.sin(F));
    const g = tbnRiser.x0 - (c.x + reach);
    assert.ok(g >= 180 && g <= 450, `bass to the trombone riser: ${Math.round(g)} mm`);
    assert.ok(c.z > tbnRiser.z0 && c.z < tbnRiser.z1, 'the bass stands beside the trombone riser');
    const tbn2 = seat('tbn.2');
    const d = Math.hypot(q.p.x - tbn2.p.x, q.p.z - tbn2.p.z);
    assert.ok(d >= 1200 && d <= 1700, `bassist to the 2nd trombone: ${Math.round(d)} mm`);
  });
  it('the piano beside the saxes: its case about 0.5 m clear of the trombone riser’s corner', () => {
    const m = ensembleModel({ id: 'x', name: 'x', variants: [{ id: 'v', label: 'v', blurb: '', seating: BB }] });
    const b = m.parts.find((p) => p.id === 'v:pno.1.inst')!.solid as { min: { x: number; z: number }; max: { x: number; z: number } };
    const g = Math.hypot(Math.max(tbnRiser.x0 - b.max.x, 0), Math.max(tbnRiser.z0 - b.max.z, 0, b.min.z - tbnRiser.z1));
    assert.ok(g >= 350 && g <= 700, `piano case to the trombone riser: ${Math.round(g)} mm`);
    const t1 = seat('sax.t1');
    const s = Math.max(b.min.x - t1.p.x, 0, t1.p.x - b.max.x);
    assert.ok(s >= 300 && s <= 700, `piano case to tenor 1’s chair: ${Math.round(s)} mm`);
  });
  it('their close mics moved with them (read from their seats)', () => {
    const near = (p: { x: number; z: number }, q: { p: { x: number; z: number } }, r: number) => Math.hypot(p.x - q.p.x, p.z - q.p.z) <= r;
    assert.ok(near(E16.BB_PNO.p, seat('pno.1'), 2400), 'piano mic');
    assert.ok(near(E16.BB_CB.p, seat('cb.1'), 800), 'bass mic');
    assert.ok(near(E16.BB_AMP.p, seat('gtr.1'), 900), 'amp mic');
    assert.ok(near(E16.BB_OH.foot, seat('dr.1'), 900), 'overhead stand');
    for (const m of [E16.BB_PNO.p, E16.BB_CB.p, E16.BB_AMP.p, E16.BB_OH.spot.p]) assert.ok(m.x < tbnRiser.x0, 'still on the rhythm section’s side');
  });
});

describe('E15 guitar group: the guitarist beside the bass', () => {
  it('the guitarist and the amp moved together, +700 mm across (the guitarist was 2.3 m from the bassist)', () => {
    const s = seatingOf('jazz.guitar');
    const gt = s.seats.find((q) => q.id === 'jgtr.1')!;
    const amp = ampOf(s, 'jgtr')!;
    assert.equal(JAZZ_GTR_DX, 700);
    assert.deepEqual([gt.p.x, gt.p.z, amp.p.x, amp.p.z], [-1600, -900, -2300, -1900]);
    const ub = s.seats.find((q) => q.id === 'ub.1')!;
    const d = Math.hypot(gt.p.x - ub.p.x, gt.p.z - ub.p.z);
    assert.ok(d >= 1500 && d <= 1900, `guitarist to bassist ${Math.round(d)} mm`);
    const P = GUITAR_POSE.eguitar;
    const head = guitarPoint(gt, 'eguitar', P.L + P.neck);
    const g = Math.hypot(head.x - ub.p.x, head.z - ub.p.z) - 300;
    assert.ok(g >= 800 && g <= 1100, `headstock to the bassist ${Math.round(g)} mm`);  });
});
