/**
 * FIGURE V2 — THE APPROVED MALLET HAND ON THE SIDE-VIEW MALLET PLAYERS (2026-11-24; malletPlaced.ts, malletHeld.tsx).
 * The approved hand (malletHandBack.tsx) has a straight wrist, the shaft 15° below the forearm. At the lessons' old
 * grips (hands 490–570 mm below the shoulder) no arm could come in along that line. Owner 2026-11-24, "Raise the
 * hands": the grips (only) move; each mallet head stays, each shaft keeps its real length. Pinned here:
 *   • the old grips did not fit (the numbers);
 *   • the new grips are the ones malletGripFor finds (the most natural arm for the straight wrist), the heads and
 *     the shaft lengths unchanged;
 *   • M06's near (right) hand and M07a's (left, mirrored) hand are the approved drawing on a straight-wrist arm: the
 *     sleeve laid along the drawing's own forearm line, its mouth at the drawing's cuff, no old fist on that arm;
 *   • M06's far (left) hand shows its palm: it keeps the drummer's palm-side fist, now clear of the near one.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const MP = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/malletPlaced.ts'));
const MH = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/malletHandBack.tsx'));
const TV = R(await import('../src/screens/lab/miking/lessons/m06Timpani/timpanistV2.ts'));
const BV = R(await import('../src/screens/lab/miking/lessons/m07aConcertBassDrum/playerV2.ts'));
const TP = R(await import('../src/screens/lab/miking/lessons/m06Timpani/malletPose.ts'));
const G = R(await import('../src/screens/lab/miking/lessons/m07aConcertBassDrum/geometry.ts'));
const PS = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/playersStick.ts'));
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

type V = { x: number; y: number; z: number };
type Pt = { u: number; v: number };
type Fit = { fits: boolean; shaftDeg: number; needForeDeg: number; bestForeDeg: number; bendDeg: number; at: { x: number; y: number; rot: number; mirror: boolean }; cuff: Pt };
type Pose = { grip: V; head: V; elbow: V; wrist: V; foreDeg: number; tiltDeg: number; shaftDeg: number; upper: number; fore: number; elbowFwd: number; elbowDown: number };
const fit = MP.malletSideFit as (o: unknown) => Fit;
const gripFor = MP.malletGripFor as (o: unknown) => Pose | null;
const d3 = (a: V, b: V) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const deg = (a: number) => (a * 180) / Math.PI;
const [strokeLow, raisedLow] = TP.TIMP_MALLETS_LOW as { hand: V; ball: V; butt: V }[];
const [stroke, raised] = TP.TIMP_MALLETS as { hand: V; ball: V; butt: V }[];
const SH_R = TV.TIMP_STICKS.R.shoulder as V;
const SH_L = TV.TIMP_STICKS.L.shoulder as V;
const SH_B = BV.BASS_ARM.shoulder as V;
const MALLET = G.MALLET as { head: V; grip: V; headR: number };
const BASS_LOW_F = (() => {
  const g = G.MALLET_GRIP_LOW as V;
  const L = d3(g, MALLET.head);
  return { x: g.x + ((MALLET.head.x - g.x) / L) * 45, y: g.y + ((MALLET.head.y - g.y) / L) * 45, z: g.z + ((MALLET.head.z - g.z) / L) * 45 };
})();
const BASS_F = BV.BASS_FULCRUM as V;
const fmt = (p: V) => `(${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)})`;

describe('the approved mallet hand on the side-view mallet players (owner: "Raise the hands")', () => {
  it('the OLD grips: no arm from the lesson’s shoulder met the drawing’s straight wrist', () => {
    const old = {
      timpaniNearR: fit({ fulcrum: raisedLow.hand, head: raisedLow.ball, shoulder: SH_R, mirror: false }),
      timpaniFarL: fit({ fulcrum: strokeLow.hand, head: strokeLow.ball, shoulder: SH_L, mirror: false }),
      bassL: fit({ fulcrum: BASS_LOW_F, head: MALLET.head, shoulder: SH_B, mirror: true }),
    };
    for (const [n, c] of Object.entries(old)) console.log(`old ${n}: shaft ${c.shaftDeg.toFixed(1)}°, forearm needed ${c.needForeDeg.toFixed(1)}°, nearest reachable ${c.bestForeDeg.toFixed(1)}°, wrist bend ${c.bendDeg.toFixed(1)}°`);
    for (const c of Object.values(old)) assert.equal(c.fits, false);
  });

  it('the NEW grips are the most natural straight-wrist arms; the heads and the shaft lengths unchanged', () => {
    const cases = [
      ['M06 near (raised)', raised.hand, gripFor({ head: raised.ball, shaft: 310, gripZ: raisedLow.hand.z, shoulder: SH_R, mirror: false })],
      ['M07a (left)', BASS_F, gripFor({ head: MALLET.head, shaft: 355, gripZ: BASS_LOW_F.z, shoulder: SH_B, mirror: true })],
    ] as const;
    for (const [n, got, want] of cases) {
      assert.ok(want, `${n}: an arm reaches`);
      console.log(`${n}: solver ${fmt(want!.grip)}; lesson grip ${fmt(got)}; forearm ${want!.foreDeg.toFixed(1)}° (tilt ${want!.tiltDeg.toFixed(1)}°), shaft ${want!.shaftDeg.toFixed(1)}°, elbow ${want!.elbowDown.toFixed(0)} mm below the shoulder, ${want!.elbowFwd.toFixed(0)} mm forward`);
    }
    for (const [n, got, want] of cases) assert.ok(d3(got, want!.grip) < 1, `${n}: the lesson's grip ${fmt(got)} is the solver's ${fmt(want!.grip)}`);
    console.log(`before → after: M06 right ${fmt(raisedLow.hand)} → ${fmt(raised.hand)}; M06 left ${fmt(strokeLow.hand)} → ${fmt(stroke.hand)}; M07a grip point ${fmt(BASS_LOW_F)} → ${fmt(BASS_F)} (grip end ${fmt(G.MALLET_GRIP_LOW)} → ${fmt(MALLET.grip)})`);
    // the heads stay; the real lengths stay
    for (const [a, b] of [[stroke, strokeLow], [raised, raisedLow]] as const) {
      assert.deepEqual(a.ball, b.ball, 'the ball where it was');
      assert.ok(Math.abs(d3(a.hand, a.ball) - (TP.TIMP_MALLET.len - TP.TIMP_MALLET.butt)) < 1e-6);
      assert.ok(Math.abs(d3(a.butt, a.hand) - TP.TIMP_MALLET.butt) < 1e-6);
    }
    assert.ok(raised.hand.y < raisedLow.hand.y - 200, 'the raised hand lifted to elbow height');
    assert.deepEqual(MALLET.head, { x: 44, y: 40, z: -230 });
    assert.ok(Math.abs(d3(MALLET.grip, MALLET.head) - 400) < 0.1, 'the bass mallet 400 mm, grip end to the head centre');
    assert.ok(BASS_F.y < BASS_LOW_F.y, 'raised');
  });

  it('M06 near and M07a: the approved drawing on a straight-wrist arm (forearm and hand agree, no old fist)', () => {
    const arms = [
      ['M06 near', TV.TIMP_NEAR_POSE as Pose, TV.timpanistSidePlan(), raised.hand, raised.ball, false, 15],
      ['M07a', BV.BASS_NEAR_POSE as Pose, BV.bassSidePlan(), BASS_F, MALLET.head, true, 27],
    ] as const;
    for (const [n, p, plan, grip, head, mirror, maxTilt] of arms) {
      assert.ok(p, `${n}: the arm reaches`);
      assert.ok(Math.abs(p.upper - 300) <= 4 && Math.abs(p.fore - 290) < 1, `${n}: adult bones (${p.upper.toFixed(0)}, ${p.fore.toFixed(0)})`);
      assert.ok(p.tiltDeg <= maxTilt, `${n}: forearm ${p.tiltDeg.toFixed(1)}° from level`);
      assert.ok(p.elbowDown > 200 && p.elbowDown <= 304, `${n}: the elbow hangs ${p.elbowDown.toFixed(0)} mm below the shoulder`);
      assert.ok(p.elbowFwd > -60 && p.elbowFwd < 150, `${n}: the elbow at the side (${p.elbowFwd.toFixed(0)} mm forward)`);
      const f = fit({ fulcrum: grip, head, shoulder: { x: p.elbow.x, y: p.elbow.y, z: 0 }, mirror });
      // (the drawing's forearm line, and the sleeve on it)
      const a = (plan as { arms: { near: { placed: unknown; hold: unknown; elbow: Pt; wrist: Pt; opening: { e: { c: Pt } } } } }).arms.near;
      assert.equal(a.placed, null, `${n}: no authored fist on that arm`);
      assert.equal(a.hold, null, `${n}: no hand skeleton on that arm`);
      assert.ok(Math.hypot(a.elbow.u - p.elbow.x, a.elbow.v - p.elbow.y) < 0.5, `${n}: the sleeve's elbow is the pose's`);
      const sleeveDeg = deg(Math.atan2(a.wrist.v - a.elbow.v, a.wrist.u - a.elbow.u));
      assert.ok(Math.abs(sleeveDeg - f.needForeDeg) < 0.5, `${n}: the sleeve along the drawing's forearm (${sleeveDeg.toFixed(2)} vs ${f.needForeDeg.toFixed(2)})`);
      const mouth = Math.hypot(a.opening.e.c.u - f.cuff.u, a.opening.e.c.v - f.cuff.v);
      assert.ok(mouth < 3, `${n}: the sleeve's mouth on the drawing's cuff rim (${mouth.toFixed(1)} mm)`);
      // (the drawing placed on the lesson's shaft: its fulcrum on the grip point)
      const at = MP.malletHandAt(grip, head, mirror);
      const toPage = MH.malletHandToPage({ ...at, s: 1 });
      const q = toPage(MH.onShaft(100, 0));
      assert.ok(Math.abs(deg(Math.atan2(q.v - at.y, q.u - at.x)) - f.shaftDeg) < 1e-6 && at.x === grip.x && at.y === grip.y, `${n}: on the lesson's shaft`);
    }
  });

  it('the lesson’s shafts pass THROUGH the hand: the butts (45 mm back, Ø 10 and Ø 16) end inside it', () => {
    const body = (MH.MALLET_HAND_BACK as { body: Pt[] }).body;
    const inside = (p: Pt) => {
      let c = false;
      for (let i = 0, j = body.length - 1; i < body.length; j = i++) {
        const a = body[i];
        const b = body[j];
        if (a.v > p.v !== b.v > p.v && p.u < ((b.u - a.u) * (p.v - a.v)) / (b.v - a.v) + a.u) c = !c;
      }
      return c;
    };
    for (const r of [5, 8]) for (const [a, d] of [[-45, 0], [-45 + r, r], [-45 + r, -r], [-20, r], [-20, -r]]) assert.ok(inside(MH.onShaft(a, d)), `r ${r}: (${a}, ${d}) inside the hand`);
  });

  it('M06 far (left) hand: its palm to the camera — the drummer’s palm-side fist on a STRAIGHT forearm (owner: "look like a broken arm")', () => {
    const L = TV.TIMP_STICKS.L;
    assert.equal(PS.fistViewOf(L.hold), 'palmThumb');
    const plan = TV.timpanistSidePlan();
    const a = plan.arms.far as { placed: { art: { view: string }; F: Pt; ex: Pt; wrist: Pt }; line: Pt[]; elbow: Pt; shoulder: Pt; wrist: Pt; behind: { elbowShift: number } };
    assert.equal(a.placed.art.view, 'palmThumb');
    assert.ok(Math.hypot(a.placed.F.u - stroke.hand.x, a.placed.F.v - stroke.hand.y) < 0.5, 'on its grip point');
    // the forearm one straight line from the elbow into the fist (no banana): every stretch within 3° of the chord
    const ang = (p: Pt, q: Pt) => deg(Math.atan2(q.v - p.v, q.u - p.u));
    const chord = ang(a.elbow, a.wrist);
    for (let i = 1; i < a.line.length; i++) assert.ok(Math.abs(ang(a.line[i - 1], a.line[i]) - chord) < 3, `stretch ${i}: ${ang(a.line[i - 1], a.line[i]).toFixed(1)}° vs ${chord.toFixed(1)}°`);
    // the wrist straight (the fist's own axis on the forearm's line); the elbow hangs below the shoulder; bones true
    const hx = deg(Math.atan2(a.placed.ex.v, a.placed.ex.u));
    assert.ok(Math.abs(hx - chord) < 4, `wrist ${Math.abs(hx - chord).toFixed(1)}°`);
    assert.equal(a.behind.elbowShift, 0, 'the elbow not moved out from behind the back');
    assert.ok(Math.abs(d3(L.shoulder, L.elbow) - 300) < 1 && Math.abs(d3(L.elbow, { x: a.wrist.u, y: a.wrist.v, z: L.hold.poseWrist.z }) - 290) < 2, 'adult bones');
    assert.ok(Math.hypot(a.elbow.u - a.shoulder.u, a.elbow.v - a.shoulder.v) <= 300, 'the upper arm never longer on the page than it is');
    assert.ok(a.elbow.v - a.shoulder.v > 200, 'the elbow hangs below the shoulder');
    // its grip: the stroke's shaft 20° to the head, the hand ≈ 12 cm over it
    const sh = deg(Math.asin((stroke.ball.y - stroke.hand.y) / d3(stroke.hand, stroke.ball)));
    console.log(`M06 far: forearm ${chord.toFixed(1)}°, wrist ${Math.abs(hx - chord).toFixed(1)}°, elbow ${(a.elbow.v - a.shoulder.v).toFixed(0)} below / ${(a.elbow.u - a.shoulder.u).toFixed(0)} forward of the shoulder; shaft ${sh.toFixed(1)}° (3-D)`);
    assert.ok(sh > 12 && sh < 25);
    const gap = Math.hypot(raised.hand.x - stroke.hand.x, raised.hand.y - stroke.hand.y);
    console.log(`M06 grip points on the page: ${gap.toFixed(0)} mm apart (were ${Math.hypot(raisedLow.hand.x - strokeLow.hand.x, raisedLow.hand.y - strokeLow.hand.y).toFixed(0)})`);
    assert.ok(gap > PS.IN_LINE_MM * 3, 'no longer one behind the other');
  });

  it('the lessons draw it (the near stick place), only on the v2 figure', () => {
    for (const f of ['src/screens/lab/miking/lessons/m06Timpani/art.tsx', 'src/screens/lab/miking/lessons/m07aConcertBassDrum/art.tsx']) assert.ok(read(f).includes('<MalletInBackHand'), f);
    const h = read('src/screens/lab/miking/lessons/shared/figureV2/malletHeld.tsx');
    assert.ok(/sleeve=\{false\}/.test(h) && /ownScale=\{false\}/.test(h) && /paintShaft=\{false\}/.test(h));
  });
});
