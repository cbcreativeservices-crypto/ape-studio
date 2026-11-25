/**
 * FIGURE V2 — THE APPROVED MALLET HANDS ON THE SIDE-VIEW MALLET PLAYERS (2026-11-24; malletPlaced.ts, malletHeld.tsx).
 * The approved hands (malletHandBack.tsx; malletHandPalm.tsx, the same grip from the palm side) have a straight
 * wrist, the shaft 15° below the forearm. At the lessons' old grips (hands 490–570 mm below the shoulder) no arm could
 * come in along that line. Owner 2026-11-24, "Raise the hands": the grips (only) move; each mallet head stays, each
 * shaft keeps its real length. Pinned here:
 *   • the old grips did not fit (the numbers);
 *   • the new grips are the ones malletGripFor finds (the most natural arm for the straight wrist), the heads and
 *     the shaft lengths unchanged;
 *   • M06's near (right) hand, M06's far (left) hand — its PALM to the camera: the palm-side drawing, mirrored
 *     (owner 2026-11-24, "Palm mallet passes") — and M07a's (left, mirrored) hand are the approved drawings on
 *     straight-wrist arms: the sleeve laid along the drawing's own forearm line, its mouth at the drawing's cuff, no
 *     old fist on that arm;
 *   • M06's far hand: no lower grip carries the palm-side drawing on a straight wrist (the numbers).
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const MP = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/malletPlaced.ts'));
const MH = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/malletHandBack.tsx'));
const MHP = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/malletHandPalm.tsx'));
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
type ArmP = { placed: unknown; hold: unknown; elbow: Pt; wrist: Pt; shoulder: Pt; line: Pt[]; opening: { e: { c: Pt } }; behind: { elbowShift: number } | null };
const fit = MP.malletSideFit as (o: unknown) => Fit;
const gripFor = MP.malletGripFor as (o: unknown) => Pose | null;
const d3 = (a: V, b: V) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const deg = (a: number) => (a * 180) / Math.PI;
const [strokeLow, raisedLow] = TP.TIMP_MALLETS_LOW as { hand: V; ball: V; butt: V }[];
const [stroke, raised] = TP.TIMP_MALLETS as { hand: V; ball: V; butt: V }[];
/** The far hand's grip before the palm-side drawing (the stand-in fist's, earlier on 2026-11-24). */
const STAND_IN = { x: -534.75, y: -882.19, z: -530 };
const HEAD_Y = stroke.ball.y + TP.TIMP_MALLET.ballR;
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
const inPoly = (body: Pt[], p: Pt) => {
  let c = false;
  for (let i = 0, j = body.length - 1; i < body.length; j = i++) {
    const a = body[i];
    const b = body[j];
    if (a.v > p.v !== b.v > p.v && p.u < ((b.u - a.u) * (p.v - a.v)) / (b.v - a.v) + a.u) c = !c;
  }
  return c;
};

describe('the approved mallet hands on the side-view mallet players (owner: "Raise the hands", "Palm mallet passes")', () => {
  it('the OLD grips: no arm from the lesson’s shoulder met the drawing’s straight wrist', () => {
    const old = {
      timpaniNearR: fit({ fulcrum: raisedLow.hand, head: raisedLow.ball, shoulder: SH_R, mirror: false }),
      timpaniFarL: fit({ fulcrum: strokeLow.hand, head: strokeLow.ball, shoulder: SH_L, mirror: false }),
      bassL: fit({ fulcrum: BASS_LOW_F, head: MALLET.head, shoulder: SH_B, mirror: true }),
    };
    for (const [n, c] of Object.entries(old)) console.log(`old ${n}: shaft ${c.shaftDeg.toFixed(1)}°, forearm needed ${c.needForeDeg.toFixed(1)}°, nearest reachable ${c.bestForeDeg.toFixed(1)}°, wrist bend ${c.bendDeg.toFixed(1)}°`);
    for (const c of Object.values(old)) assert.equal(c.fits, false);
    // the stand-in fist's grip: no real-length arm reaches the palm-side drawing's wrist there at all
    assert.equal(MP.malletArmAt(STAND_IN, stroke.ball, SH_L, false), null);
  });

  it('the NEW grips are the most natural straight-wrist arms; the heads and the shaft lengths unchanged', () => {
    const cases = [
      ['M06 near (raised)', raised.hand, gripFor({ head: raised.ball, shaft: 310, gripZ: raisedLow.hand.z, shoulder: SH_R, mirror: false })],
      // (the palm-side drawing, mirrored, lands exactly where malletHandBack would: the same solver)
      ['M06 far (stroke)', stroke.hand, gripFor({ head: stroke.ball, shaft: 310, gripZ: strokeLow.hand.z, shoulder: SH_L, mirror: false })],
      ['M07a (left)', BASS_F, gripFor({ head: MALLET.head, shaft: 355, gripZ: BASS_LOW_F.z, shoulder: SH_B, mirror: true })],
    ] as const;
    for (const [n, got, want] of cases) {
      assert.ok(want, `${n}: an arm reaches`);
      console.log(`${n}: solver ${fmt(want!.grip)}; lesson grip ${fmt(got)}; forearm ${want!.foreDeg.toFixed(1)}° (tilt ${want!.tiltDeg.toFixed(1)}°), shaft ${want!.shaftDeg.toFixed(1)}°, elbow ${want!.elbowDown.toFixed(0)} mm below the shoulder, ${want!.elbowFwd.toFixed(0)} mm forward`);
    }
    for (const [n, got, want] of cases) assert.ok(d3(got, want!.grip) < 1, `${n}: the lesson's grip ${fmt(got)} is the solver's ${fmt(want!.grip)}`);
    console.log(`before → after: M06 right ${fmt(raisedLow.hand)} → ${fmt(raised.hand)}; M06 left ${fmt(strokeLow.hand)} → stand-in fist ${fmt(STAND_IN)} → palm hand ${fmt(stroke.hand)}; M07a grip point ${fmt(BASS_LOW_F)} → ${fmt(BASS_F)} (grip end ${fmt(G.MALLET_GRIP_LOW)} → ${fmt(MALLET.grip)})`);
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

  it('M06 near, M06 far and M07a: the approved drawing on a straight-wrist arm (forearm and hand agree, no old fist)', () => {
    const tp = TV.timpanistSidePlan() as { arms: { near: ArmP; far: ArmP } };
    const arms = [
      ['M06 near', TV.TIMP_NEAR_POSE as Pose, tp.arms.near, raised.hand, raised.ball, false, 15],
      ['M06 far', TV.TIMP_FAR_POSE as Pose, tp.arms.far, stroke.hand, stroke.ball, false, 30],
      ['M07a', BV.BASS_NEAR_POSE as Pose, (BV.bassSidePlan() as { arms: { near: ArmP } }).arms.near, BASS_F, MALLET.head, true, 27],
    ] as const;
    for (const [n, p, a, grip, head, mirror, maxTilt] of arms) {
      assert.ok(p, `${n}: the arm reaches`);
      assert.ok(Math.abs(p.upper - 300) <= 4 && Math.abs(p.fore - 290) < 1, `${n}: adult bones (${p.upper.toFixed(0)}, ${p.fore.toFixed(0)})`);
      assert.ok(p.tiltDeg <= maxTilt, `${n}: forearm ${p.tiltDeg.toFixed(1)}° from level`);
      assert.ok(p.elbowDown > 200 && p.elbowDown <= 304, `${n}: the elbow hangs ${p.elbowDown.toFixed(0)} mm below the shoulder`);
      assert.ok(p.elbowFwd > -60 && p.elbowFwd < 150, `${n}: the elbow at the side (${p.elbowFwd.toFixed(0)} mm forward)`);
      const f = fit({ fulcrum: grip, head, shoulder: { x: p.elbow.x, y: p.elbow.y, z: 0 }, mirror });
      // (the drawing's forearm line, and the sleeve on it: ONE straight line, elbow → cuff)
      assert.equal(a.placed, null, `${n}: no authored fist on that arm`);
      assert.equal(a.hold, null, `${n}: no hand skeleton on that arm`);
      assert.equal(a.line.length, 2, `${n}: the forearm one straight line`);
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
    // the far arm hangs behind the torso as every far arm does, its elbow where the pose has it (not carried out)
    assert.ok(tp.arms.far.behind && tp.arms.far.behind.elbowShift === 0, 'the far elbow not moved');
    // the far arm: the side view and the view from above read the same elbow
    assert.deepEqual(TV.TIMP_STICKS.L.elbow, (TV.TIMP_FAR_POSE as Pose).elbow);
  });

  it('M06 far: the palm-side drawing, mirrored, lands exactly where the back-of-hand drawing would (its cuff, its shaft)', () => {
    const ang = Math.atan2(stroke.ball.y - stroke.hand.y, stroke.ball.x - stroke.hand.x);
    const back = MH.malletHandToPage({ ...MP.malletHandAt(stroke.hand, stroke.ball, false), s: 1 });
    const palm = MHP.malletHandPalmToPage({ x: stroke.hand.x, y: stroke.hand.y, s: 1, rot: MHP.malletHandPalmRotFor(ang, true), mirror: true });
    const c1 = back(MH.MALLET_HAND_CUFF);
    const c2 = palm(MHP.MALLET_HAND_PALM_CUFF);
    assert.ok(Math.hypot(c1.u - c2.u, c1.v - c2.v) < 1e-6, 'the same cuff');
    for (const a of [-45, 0, 100, 310]) {
      const q1 = back(MH.onShaft(a, 0));
      const q2 = palm(MHP.onShaftPalm(a, 0));
      assert.ok(Math.hypot(q1.u - q2.u, q1.v - q2.v) < 1e-6, `the same shaft (${a} mm)`);
    }
    // the far arm's sleeve mouth on that cuff
    const far = (TV.timpanistSidePlan() as { arms: { far: ArmP } }).arms.far;
    assert.ok(Math.hypot(far.opening.e.c.u - c2.u, far.opening.e.c.v - c2.v) < 3, 'the sleeve on the palm drawing’s cuff');
  });

  it('the lesson’s shafts pass THROUGH the hand: the butts (45 mm back, Ø 10 and Ø 16) end inside it, from either side', () => {
    const body = (MH.MALLET_HAND_BACK as { body: Pt[] }).body;
    const palmBody = (MHP.MALLET_HAND_PALM as { body: Pt[] }).body;
    for (const r of [5, 8])
      for (const [a, d] of [[-45, 0], [-45 + r, r], [-45 + r, -r], [-20, r], [-20, -r]]) {
        assert.ok(inPoly(body, MH.onShaft(a, d)), `back, r ${r}: (${a}, ${d}) inside the hand`);
        assert.ok(inPoly(palmBody, MHP.onShaftPalm(a, d)), `palm, r ${r}: (${a}, ${d}) inside the hand`);
      }
  });

  it('M06 far: no LOWER grip carries the palm-side drawing on a straight wrist (why the hand rose)', () => {
    // The grip turned about the ball on the mallet's own length (the heading from above unchanged), from 20° to the
    // head (the stand-in's) up to the solver's: the least wrist bend any real-length arm from the far shoulder needs
    // (upper arm 300, forearm 290, the elbow ≥ 120 mm below the shoulder and −60…200 mm forward).
    const u0 = { x: stroke.ball.x - STAND_IN.x, z: stroke.ball.z - STAND_IN.z };
    const hz = Math.hypot(u0.x, u0.z);
    const leastBend = (th: number) => {
      const e = (th * Math.PI) / 180;
      const grip = { x: stroke.ball.x - (u0.x / hz) * Math.cos(e) * 310, y: stroke.ball.y - Math.sin(e) * 310, z: stroke.ball.z - (u0.z / hz) * Math.cos(e) * 310 };
      const f = fit({ fulcrum: grip, head: stroke.ball, shoulder: SH_L, mirror: false });
      const W3 = { x: f.cuff.u, y: f.cuff.v, z: grip.z };
      let best = Infinity;
      for (let pa = 0; pa < 360; pa += 1)
        for (const pz of [-0.6, -0.3, 0, 0.3]) {
          const pr = (pa * Math.PI) / 180;
          const tb = PS.twoBone(SH_L, W3, { x: Math.sin(pr), y: Math.cos(pr), z: pz }) as { elbow: V; reach: boolean };
          if (!tb.reach) continue;
          const E = tb.elbow;
          if (E.y - SH_L.y < 120 || E.x - SH_L.x > 200 || E.x - SH_L.x < -60) continue;
          best = Math.min(best, Math.abs(deg(Math.atan2(W3.y - E.y, W3.x - E.x)) - f.needForeDeg));
        }
      return { bend: best, above: HEAD_Y - grip.y, reach: d3(SH_L, W3) };
    };
    const rows = [20, 24, 28, 32, 36, 38, 40, 42].map((th) => ({ th, ...leastBend(th) }));
    for (const r of rows) console.log(`  shaft ${r.th}° to the head, hand ${r.above.toFixed(0)} mm over it: shoulder → drawing's wrist ${r.reach.toFixed(0)} mm; ${Number.isFinite(r.bend) ? `least wrist bend ${r.bend.toFixed(1)}°` : 'out of reach (arm 590 mm)'}`);
    assert.ok(!Number.isFinite(rows[0].bend), 'at the stand-in’s 20° the drawing’s wrist is out of reach');
    for (const r of rows.filter((q) => q.th <= 36)) assert.ok(r.bend > 10, `${r.th}°: a bent wrist (${r.bend.toFixed(1)}°)`);
    assert.ok(rows[rows.length - 1].bend < 1, '42°: straight');
    // the grip the lesson uses: its shaft and height, and the pelvis check (the figure standard's band in front of the hip)
    const sh = deg(Math.asin((stroke.ball.y - stroke.hand.y) / d3(stroke.hand, stroke.ball)));
    const hip = (TV.timpanistSidePlan() as { hip: Pt }).hip;
    const p = TV.TIMP_FAR_POSE as Pose;
    const band = (q: V) => q.x - hip.u > 75 && q.x - hip.u < 340 && q.y > hip.v - 60 && q.y < hip.v + 230;
    console.log(`M06 far: shaft ${sh.toFixed(1)}° to the head (3-D), the hand ${(HEAD_Y - stroke.hand.y).toFixed(0)} mm over it; grip moved ${(stroke.hand.x - STAND_IN.x).toFixed(1)} mm toward the drum, ${(STAND_IN.y - stroke.hand.y).toFixed(1)} mm up (${d3(stroke.hand, STAND_IN).toFixed(1)} mm); forearm ${p.foreDeg.toFixed(1)}° down; elbow ${p.elbowDown.toFixed(0)} below / ${p.elbowFwd.toFixed(0)} forward of the shoulder; in front of the pelvis: grip ${band(stroke.hand)}, wrist ${band(p.wrist)}, elbow ${band(p.elbow)}`);
    assert.ok(!band(stroke.hand) && !band(p.wrist) && !band(p.elbow), 'no longer in front of the pelvis');
    const gap = Math.hypot(raised.hand.x - stroke.hand.x, raised.hand.y - stroke.hand.y);
    assert.ok(gap > PS.IN_LINE_MM * 3, `the two grips apart on the page (${gap.toFixed(0)} mm)`);
  });

  it('the lessons draw them (the near and far stick places), only on the v2 figure; the palm’s shaft in the lesson’s wood', () => {
    for (const f of ['src/screens/lab/miking/lessons/m06Timpani/art.tsx', 'src/screens/lab/miking/lessons/m07aConcertBassDrum/art.tsx']) assert.ok(read(f).includes('<MalletInBackHand'), f);
    assert.ok(read('src/screens/lab/miking/lessons/m06Timpani/art.tsx').includes('<MalletInPalmHand'));
    const h = read('src/screens/lab/miking/lessons/shared/figureV2/malletHeld.tsx');
    assert.equal(h.match(/sleeve=\{false\} ownScale=\{false\}/g)?.length, 2);
    assert.equal(h.match(/paintShaft=\{false\}/g)?.length, 2);
    assert.ok(/wood=\{LESSON_WOOD\}/.test(h) && /colors: MALLET_WOOD/.test(h));
  });
});
