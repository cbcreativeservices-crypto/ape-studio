/**
 * FIGURE V2 — THE PLAYERS (wave 3, set 3b of D78, 2026-11-24): the timpanist
 * (M06), the concert bass drummer (M07a), the cajón player (I02) and the Foley
 * performers (F01, F03, F04, F05) drawn as cast members with the approved
 * hands. Pins: each hand closes exactly where the lesson puts the stick,
 * mallet or prop (nothing the lesson measures moved); the grips stay within
 * an easy wrist; the cajón hands lie palm toward the plate; each lesson opts
 * in at its call sites under the `sidePlayers` switch; one person per lesson.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const near = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }, tol = 0.5) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) <= tol;
type V = { x: number; y: number; z: number };
const d3 = (a: V, b: V) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
/** An arm on a stick drawn with the drummer's pieces: adult bones, the elbow below the shoulder and a little
 *  outside the shoulder-to-wrist line (never in through the chest), the wrist easy. */
function armIsPlausible(a: { shoulder: V; elbow: V; wrist: V; out: V; reach: boolean; hold: { bend: number; wristMiss: number } }) {
  assert.ok(a.reach, 'in reach');
  assert.ok(Math.abs(d3(a.shoulder, a.elbow) - 300) < 1, `upper arm ${d3(a.shoulder, a.elbow)}`);
  assert.ok(Math.abs(d3(a.elbow, a.wrist) - 290) < 1, `forearm ${d3(a.elbow, a.wrist)}`);
  assert.ok(a.elbow.y > a.shoulder.y + 120, 'the elbow hangs below the shoulder');
  // outside the shoulder-to-wrist line: the elbow's offset from that line has a positive outward part
  const t = ((a.elbow.x - a.shoulder.x) * (a.wrist.x - a.shoulder.x) + (a.elbow.y - a.shoulder.y) * (a.wrist.y - a.shoulder.y) + (a.elbow.z - a.shoulder.z) * (a.wrist.z - a.shoulder.z)) / d3(a.wrist, a.shoulder) ** 2;
  const off = { x: a.elbow.x - a.shoulder.x - t * (a.wrist.x - a.shoulder.x), y: a.elbow.y - a.shoulder.y - t * (a.wrist.y - a.shoulder.y), z: a.elbow.z - a.shoulder.z - t * (a.wrist.z - a.shoulder.z) };
  assert.ok(off.x * a.out.x + off.y * a.out.y + off.z * a.out.z > 0, 'the elbow a little outside the line');
  assert.ok(off.y > 0, 'the elbow below the line');
  assert.ok(a.hold.bend <= 40, `wrist bend ${a.hold.bend}`);
  assert.ok(a.hold.wristMiss <= 60, `wrist miss ${a.hold.wristMiss}`);
}
/** An arm plan's hand is an approved authored stick fist, its fulcrum on (u, v). */
function fistOn(arm: { placed: { art: { view: string }; F: { u: number; v: number } } | null }, u: number, v: number) {
  assert.ok(arm.placed, 'an authored hand');
  assert.ok(['fistEdge', 'palmThumb', 'backTop'].includes(arm.placed!.art.view), arm.placed!.art.view);
  assert.ok(Math.hypot(arm.placed!.F.u - u, arm.placed!.F.v - v) < 0.5, 'the fulcrum on the grip point');
}

const CFG = await import('../src/screens/lab/miking/lessons/shared/figureV2/figureV2Config.ts');
const CAST = await import('../src/screens/lab/miking/lessons/shared/figureV2/cast.ts');
const TIMP = await import('../src/screens/lab/miking/lessons/m06Timpani/timpanistV2.ts');
const TM = await import('../src/screens/lab/miking/lessons/m06Timpani/malletPose.ts');
const BASS = await import('../src/screens/lab/miking/lessons/m07aConcertBassDrum/playerV2.ts');
const BG = await import('../src/screens/lab/miking/lessons/m07aConcertBassDrum/geometry.ts');
const CAJ = await import('../src/screens/lab/miking/lessons/i02Cajon/cajonV2.ts');
const CAJP = await import('../src/screens/lab/miking/lessons/i02Cajon/cajonPose.ts');
const FV = await import('../src/screens/lab/miking/lessons/shared/foley/foleyV2.ts');
const F03G = await import('../src/screens/lab/miking/lessons/f03Props/geometry.ts');
const F04G = await import('../src/screens/lab/miking/lessons/f04Impacts/geometry.ts');
const F05G = await import('../src/screens/lab/miking/lessons/f05Perspective/geometry.ts');
const F01G = await import('../src/screens/lab/miking/lessons/f01Footsteps/geometry.ts');
const PG = await import('../src/screens/lab/miking/lessons/shared/foley/propGeom.ts');
const F03A = await import('../src/screens/lab/miking/lessons/f03Props/art.tsx');
const TIMP_ART = await import('../src/screens/lab/miking/lessons/m06Timpani/art.tsx');

const CM = await import('../src/screens/lab/miking/lessons/i02Cajon/model.ts');
const PS = await import('../src/screens/lab/miking/lessons/shared/figureV2/playersStick.ts');

describe('figure V2 players (set 3b)', () => {
  it('is switched on as its own family', () => {
    assert.equal(CFG.FIGURE_V2_FAMILY.sidePlayers, true);
  });

  it('each lesson draws one cast member (roles fixed)', () => {
    assert.equal(CAST.ROLES['player.timpani'], 'kofi');
    assert.equal(CAST.ROLES['player.bassDrum'], 'ruth');
    // (the approved hand-drum hand drawn on the plate from above wears the drummer's skin)
    assert.equal(CAST.ROLES['player.cajon'], 'drummer');
    assert.equal(CAST.ROLES['foley.performer'], 'mei');
  });

  it('M06: each hand closes on its own mallet where the lesson poses it, the wrist easy', () => {
    assert.ok(near(TIMP.TIMP_ARMS.R.hold.fulcrum, TM.TIMP_MALLETS[1].hand));
    assert.ok(near(TIMP.TIMP_ARMS.L.hold.fulcrum, TM.TIMP_MALLETS[0].hand));
    // (owner 2026-11-24, "Raise the hands") the near (right) hand is the APPROVED MALLET HAND on a straight-wrist arm
    // (figureV2MalletPlaced_20261124.test.ts); the far (left) keeps the drummer's palm-side fist, its elbow chosen so
    // the forearm runs straight into it ("look like a broken arm")
    for (const a of [TIMP.TIMP_STICKS.R, TIMP.TIMP_STICKS.L]) {
      assert.ok(Math.abs(d3(a.shoulder, a.elbow) - 300) <= 1, `upper arm ${d3(a.shoulder, a.elbow)}`);
      assert.ok(a.elbow.y > a.shoulder.y + 200, 'the elbow hangs below the shoulder');
    }
    assert.ok(TIMP.TIMP_STICKS.L.hold.bend <= 40, 'the far wrist easy');
    const p = TIMP.timpanistSidePlan();
    const t = TIMP.timpanistTopPlan();
    assert.equal(p.arms.near.placed, null, 'the near arm draws the approved mallet hand, no authored fist');
    fistOn(p.arms.far, TM.TIMP_MALLETS[0].hand.x, TM.TIMP_MALLETS[0].hand.y);
    assert.equal(p.arms.far.placed!.art.view, 'palmThumb');
    for (const [arm, m] of [[t.arms.near, TM.TIMP_MALLETS[1]], [t.arms.far, TM.TIMP_MALLETS[0]]] as const) {
      fistOn(arm, m.hand.x, m.hand.z);
      assert.equal(arm.placed!.art.view, 'backTop', 'from above the drummer’s fist from above');
    }
    // from above, two arms leaving two shoulders: the elbows on their own sides, apart
    assert.ok(t.arms.near.elbow.v - t.arms.far.elbow.v > 250, 'two separate arms from above');
    // the two fists no longer one behind the other
    assert.ok(Math.hypot(TM.TIMP_MALLETS[0].hand.x - TM.TIMP_MALLETS[1].hand.x, TM.TIMP_MALLETS[0].hand.y - TM.TIMP_MALLETS[1].hand.y) > 150);
  });

  it('the shared stick arm: adult bones, the elbow down and out, the drummer’s fist chosen by the face seen', () => {
    const sh = { x: 0, y: -1400, z: 190 };
    const a = PS.stickArm3({ hand: 'R', fulcrum: { x: 350, y: -950, z: 150 }, bead: { x: 700, y: -800, z: 120 }, shoulder: sh, out: { x: 0, y: 0, z: 1 }, fwd: { x: 1, y: 0, z: 0 } });
    armIsPlausible(a);
    assert.deepEqual(PS.STICK_ARM, { upper: 300, fore: 290 });
    // seen along the shaft: the fist from its little-finger side (the drummer's crossing hand)
    assert.equal(PS.fistViewOf({ ...a.hold, dir: { x: 0, y: 0, z: 1 } }), 'fistEdge');
  });

  it('M06: the HEADS, BOWLS and TIMPANIST leaders keep off the player (review 2026-11-24)', () => {
    const L = TIMP_ART.timpaniLabels('side', 'two');
    const byId = (id: string) => L.find((l) => l.id === id)!;
    // the labels on the drums' open side (right of the player, who stands left of the drums)
    for (const id of ['heads', 'bowl']) assert.ok(byId(id).u > 0 && byId(id).at!.u > 0, id);
    // the player's dot on his back below the shoulder, not on his head; its label behind him
    const pl = byId('player');
    assert.equal(pl.text, 'TIMPANIST');
    assert.ok(pl.at!.v > -1450 && pl.u < pl.at!.u, 'dot below the head, label behind');
  });

  it('M07a: the mallet is untouched, held a few cm from its end, the player turned (not mirrored) toward the head', () => {
    // (owner 2026-11-24, "Raise the hands": the head stays, the grip moved round it on the same 400 mm —
    // figureV2MalletPlaced_20261124.test.ts pins the numbers)
    assert.deepEqual(BG.MALLET, { head: { x: 44, y: 40, z: -230 }, grip: { x: 343.7, y: -216, z: -298 }, headR: 42 });
    assert.ok(near(BASS.BASS_ARM.hold.fulcrum, BASS.BASS_FULCRUM));
    assert.ok(Math.hypot(BASS.BASS_FULCRUM.x - BG.MALLET.grip.x, BASS.BASS_FULCRUM.y - BG.MALLET.grip.y, BASS.BASS_FULCRUM.z - BG.MALLET.grip.z) < 50);
    assert.equal(BASS.BASS_ARM.hand, 'L');
    // the side view: the APPROVED MALLET HAND (mirrored) on a straight-wrist arm — no authored fist on that arm;
    // from above the drummer's fist from above on the grip point
    const A = BASS.BASS_ARM;
    assert.ok(Math.abs(d3(A.shoulder, A.elbow) - 300) <= 1 && Math.abs(d3(A.elbow, A.wrist) - 290) < 1, 'adult bones');
    assert.ok(A.elbow.y > A.shoulder.y + 200, 'the elbow hangs below the shoulder');
    assert.equal(BASS.bassSidePlan().arms.near.placed, null);
    fistOn(BASS.bassTopPlan().arms.far, BASS.BASS_FULCRUM.x, BASS.BASS_FULCRUM.z);
    const p = BASS.bassSidePlan();
    assert.equal(p.facing, -1);
    // the PLAYER label's leader lands on the head as before (MIRROR_C + 345 = 603)
    const hc = (p.head.box.u0 + p.head.box.u1) / 2;
    assert.ok(Math.abs(hc - 603) < 40, `head at ${hc}`);
  });

  it('I02: each arm solved from its shoulder to its wrist on the plate (owner 2026-11-24: the elbows)', () => {
    for (const v of ['rear', 'frontport']) {
      const s = CM.stateOf(v);
      const E = CAJ.cajonElbows(v);
      for (const [a, e, out] of [[s.R, E.R, 1], [s.L, E.L, -1]] as const) {
        assert.ok(Math.abs(d3(a.S, e) - 300) < 1 && Math.abs(d3(e, a.W) - 290) < 1, 'adult bones, the wrist where the model puts it');
        assert.ok(e.y > a.S.y + 200, 'the elbow hangs below the shoulder');
        // a little outside the shoulder, never winged far out (from above: no V)
        const o = (e.z - a.S.z) * out;
        assert.ok(o > 0 && o < 110, `elbow out ${o}`);
      }
      // the side view's forearm runs straight to the wrist (no hooked sleeve at a bent wrist); its hand on the plate
      const p = CAJ.cajonSidePlan(v);
      for (const arm of [p.arms.near, p.arms.far]) {
        assert.equal(arm.line.length, 2, 'a straight forearm');
        assert.ok(arm.placed, 'the hand on the plate');
      }
    }
  });

  it('I02: the hands lie on the plate where the pose puts them, palm toward the box', () => {
    for (const v of ['rear', 'frontport']) {
      const pose = CAJP.cajonPose('side', v);
      const p = CAJ.cajonSidePlan(v);
      for (const [a, h] of [[p.arms.near, pose.handR], [p.arms.far, pose.handL]] as const) {
        assert.ok(a.placed, 'hand drawn');
        assert.ok(Math.hypot(a.placed!.wrist.u - h.wrist.u, a.placed!.wrist.v - h.wrist.v) < 0.5);
        // local +y is the palm's side: it points back toward the box (−u)
        const y = a.placed!.at({ u: 0, v: 10 });
        assert.ok(y.u < a.placed!.wrist.u, 'palm toward the plate');
      }
    }
  });

  it('Foley: every held thing is held exactly where the lesson puts it', () => {
    const k = FV.KEYS_HOLD.R as { kind: 'hold'; at: { x: number; y: number; z: number } };
    assert.equal(k.kind, 'hold');
    assert.ok(Math.abs(k.at.x) < 1 && Math.abs(k.at.z) < 1, 'over the key ring at the origin');
    const door = FV.PROPS_HOLD.door.R as { kind: 'hold'; at: { x: number; y: number; z: number } };
    assert.equal(door.at.z, PG.DOOR.handleZ);
    for (const [specs, bodyOf, vs] of [
      [FV.PROPS_HOLD, F03G.bodyOf, ['keys', 'paper', 'door', 'chair', 'live']],
      [FV.IMPACTS_HOLD, F04G.bodyOf, ['impact', 'water', 'texture', 'live']],
    ] as const) {
      for (const v of vs) {
        const s = (specs as Record<string, (typeof FV.PROPS_HOLD)['keys']>)[v];
        const plan = FV.foleySidePlan(bodyOf(v), s);
        const top = FV.foleyTopPlan(bodyOf(v), s);
        const gs = FV.foleySideGrips(bodyOf(v), s);
        const gt = FV.foleyTopGrips(bodyOf(v), s);
        for (const side of ['R', 'L'] as const) {
          const h = s[side];
          const k = side === 'R' ? 'near' : 'far';
          const a = plan.arms[k];
          if (h.kind === 'side') continue;
          if (h.kind === 'hold') {
            // (review 2026-11-24) closed round the thing: one skin, the thing through the fist, the fist's middle
            // exactly where the lesson puts the grip, the arm in reach
            assert.ok(gs[k] && gt[k], `${v} ${side}: hand closed round the thing in both views`);
            const g = FV.foleyGrip(bodyOf(v), side, h)!;
            assert.ok(near(g.fist, h.at, 1e-9) && !g.far, `${v} ${side}: on the grip point, in reach`);
            continue;
          }
          assert.ok(a.placed, `${v} ${side}: hand drawn`);
          assert.ok(top.arms[k].placed, `${v} ${side}: hand drawn from above`);
        }
      }
    }
    assert.ok(FV.foleySideGrips(F05G.ARTIST, FV.KEYS_HOLD).near);
    assert.ok(FV.foleySidePlan(F01G.WALKER, { R: { kind: 'side' }, L: { kind: 'side' } }).arms.near.placed, 'the walker’s hands at rest');
  });

  it('F03: the door handle plan fix moved only the drawn handle (onto the leaf); the tap area, labels and numbers are untouched', () => {
    // the labels, exactly as before the fix
    assert.deepEqual(F03A.propsLabels('side', 'door'), [
      { id: 'latch', text: 'HANDLE · LATCH', short: 'LATCH', u: 300, v: -250, align: 'left', at: { u: 60, v: 0 } },
      { id: 'leaf', text: 'DOOR (EDGE-ON)', short: 'DOOR', u: 280, v: -800, align: 'left', tone: 'muted', at: { u: 20, v: -700 } },
    ]);
    assert.deepEqual(F03A.propsLabels('top', 'door'), [
      { id: 'swing', text: 'THE SWING', short: 'SWING', u: -620, v: 380, align: 'center', tone: 'muted', at: { u: -560, v: 240 } },
      { id: 'pinch', text: 'PINCH POINT', short: 'PINCH', u: 260, v: 960, align: 'left', tone: 'muted', at: { u: 60, v: 800 } },
      { id: 'latch', text: 'LATCH', u: 280, v: -200, align: 'left', at: { u: 40, v: 40 } },
    ]);
    // the model's numbers
    assert.equal(PG.DOOR.W, 800);
    assert.equal(PG.DOOR.handleZ, 70);
    assert.equal(PG.DOOR.t, 40);
    // the tap area: a disc of 80 mm round the handle — side at the origin, from above at z = handleZ
    const hit = (view: 'side' | 'top', u: number, v: number) => F03A.propsHitTest(view, 'door', u, v, 0);
    assert.equal(hit('side', 0, 0), 'f03.handle');
    assert.equal(hit('side', 79, 0), 'f03.handle');
    assert.notEqual(hit('side', 0, -81), 'f03.handle');
    assert.equal(hit('top', 0, PG.DOOR.handleZ), 'f03.handle');
    assert.equal(hit('top', 0, PG.DOOR.handleZ + 79), 'f03.handle');
    assert.notEqual(hit('top', 0, PG.DOOR.handleZ + 81), 'f03.handle');
    // the drawn plan handle (props.FoleyDoor, the same formula): 70 mm in from the latch edge, ON the leaf
    const src = read('src/screens/lab/miking/lessons/shared/foley/props.tsx');
    assert.match(src, /const hx = e\.x - Math\.cos\(ang\) \* DOOR\.handleZ;/);
    assert.match(src, /const hz = e\.z - Math\.sin\(ang\) \* DOOR\.handleZ;/);
    for (const open of [0, 0.5, 1]) {
      const e = PG.doorEdge(open);
      const ang = Math.atan2(e.z - PG.DOOR.W, e.x);
      const h = { x: e.x - Math.cos(ang) * PG.DOOR.handleZ, z: e.z - Math.sin(ang) * PG.DOOR.handleZ };
      const hinge = { x: 0, z: PG.DOOR.W };
      // on the leaf: between the latch edge and the hinge, 70 mm from the edge
      assert.ok(Math.abs(Math.hypot(h.x - e.x, h.z - e.z) - PG.DOOR.handleZ) < 1e-6);
      assert.ok(Math.abs(Math.hypot(h.x - hinge.x, h.z - hinge.z) - (PG.DOOR.W - PG.DOOR.handleZ)) < 1e-6);
      if (open === 0) assert.ok(h.z >= 0 && h.z <= PG.DOOR.W && Math.abs(h.z - PG.DOOR.handleZ) < 1e-6);
    }
  });

  it('each converted lesson opts in at its call sites', () => {
    for (const p of ['m06Timpani/art.tsx', 'm07aConcertBassDrum/art.tsx', 'i02Cajon/art.tsx', 'f01Footsteps/art.tsx', 'f03Props/art.tsx', 'f04Impacts/art.tsx', 'f05Perspective/art.tsx']) {
      const src = read(`src/screens/lab/miking/lessons/${p}`);
      assert.match(src, /figureV2On\('sidePlayers'\)/, p);
      assert.match(src, /v2 = V2/, p);
    }
  });
});
