/**
 * THE LEFT FOOT ON THE HI-HAT PEDAL (owner 2026-11-23: "left foot should be on
 * hi hat pedal").
 *
 * The pedal is one description (kitPlanModel KIT.hihatPedal → hihatPedalGeom):
 * hinged at the stand's base under the rod, angled from the rod toward the
 * drummer's left hip. Every drawing and tap area derives from it. The left leg
 * is solved in 3-D (stickPose LEFT_LEG) and drawn from the same points in both
 * views: the ball of the foot on the footboard, the knee over the ankle, the
 * bones as long as the right leg's.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { KIT, KIT_CYMBALS, KIT_FLOOR_Y, hihatPedalGeom, planHitTest, yAt } from '../src/screens/lab/miking/lessons/shared/kitPlanModel.ts';
import { drummerPose, viewDrummer, LEFT_LEG } from '../src/screens/lab/miking/lessons/shared/kitScene/stickPose.ts';
import { KIT_GROOVE } from '../src/screens/lab/miking/lessons/shared/kitScene/kitStrokes.ts';
import { kitParts } from '../src/screens/lab/miking/lessons/shared/kitScene/kitSceneModel.ts';

const read = (p: string) => readFileSync(new URL(`../src/screens/lab/miking/lessons/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const DEG = 180 / Math.PI;
const g = hihatPedalGeom();
const d = drummerPose(KIT_GROOVE);
const side = viewDrummer(d, 'side').pose;
const top = viewDrummer(d, 'top').pose;

describe('the hi-hat pedal: where a real one is', () => {
  it('the hi-hat itself has not moved (cymbals, rod)', () => {
    assert.deepEqual(KIT_CYMBALS.hihat.c, { x: -470, y: yAt(850), z: -650 });
    assert.deepEqual(KIT.hihatPedal.rod, { u: KIT_CYMBALS.hihat.c.x, v: KIT_CYMBALS.hihat.c.z });
  });
  it('its toe end is at the rod’s foot (the stand’s base)', () => {
    assert.ok(Math.hypot(g.toe.u - g.rod.u, g.toe.v - g.rod.v) <= 50);
  });
  it('it points from the rod toward the drummer’s left hip: 35–55° off straight back, toward the throne side', () => {
    const a = Math.atan2(g.heel.v - g.toe.v, -(g.heel.u - g.toe.u)) * DEG;
    assert.ok(a >= 35 && a <= 55, `${a.toFixed(1)}°`);
    assert.ok(g.heel.v > g.toe.v, 'toward the throne (+v)');
    assert.ok(Math.abs(Math.hypot(g.heel.u - g.toe.u, g.heel.v - g.toe.v) - 290) < 1e-6, 'a 290 mm footboard with its heel plate');
  });
  it('the keep-out box contains the whole footboard', () => {
    const box = kitParts().find((p) => p.id === 'hihat.pedal')!.solid;
    assert.equal(box.kind, 'box');
    if (box.kind !== 'box') return;
    for (const c of g.corners) assert.ok(c.u >= box.min.x - 1e-6 && c.u <= box.max.x + 1e-6 && c.v >= box.min.z - 1e-6 && c.v <= box.max.z + 1e-6, JSON.stringify(c));
  });
  it('a tap on the footboard names the hi-hat in the plans (the tap area follows the turned pedal)', () => {
    const mid = g.at(0.6);
    assert.equal(planHitTest({ scene: 'kit' } as never, mid.u, mid.v, 0), 'hihat');
  });
});

describe('the left foot on the pedal, the leg natural (both views)', () => {
  it('side view: the ball of the foot on the footboard’s slope, a third of the way back from the toe end', () => {
    const t = (side.footL.u - g.heel.u) / (g.toe.u - g.heel.u);
    const boardV = KIT_FLOOR_Y - (g.heelH + (g.toeH - g.heelH) * t);
    assert.ok(Math.abs(side.footL.v - boardV) < 3, `ball ${side.footL.v.toFixed(1)} vs board ${boardV.toFixed(1)}`);
    assert.ok(Math.abs(1 - t - 1 / 3) < 0.02, `a third back from the toe (${(1 - t).toFixed(2)})`);
    assert.ok(side.shoeL && (side.shoeL.along ?? 1) < 0.9, 'the shoe drawn turned (foreshortened), not full-length side-on');
  });
  it('from above: the ball inside the footboard, the shoe along the pedal', () => {
    assert.ok(g.contains(LEFT_LEG.ball.x, LEFT_LEG.ball.z), 'on the board');
    const n = top.neck;
    const world = { x: n.u + (top.footL.v - n.v), z: n.v + (n.u - top.footL.u) };
    assert.ok(Math.hypot(world.x - LEFT_LEG.ball.x, world.z - LEFT_LEG.ball.z) < 0.5, 'the drawn foot is the solved foot');
    const yaw = top.shoeL?.yaw ?? 0;
    // the toe's direction in the world from the authored yaw (authored toe (−sin, cos) ↔ world (cos, sin))
    const toe = { x: Math.cos(yaw), z: Math.sin(yaw) };
    assert.ok(toe.x * -g.dir.u + toe.z * -g.dir.v > 0.999, 'the toe points along the pedal toward the rod');
  });
  it('the knee over the ankle: the shin within 15° of upright (side view and in 3-D), the knee not behind the ankle', () => {
    const k = LEFT_LEG.knee;
    const a = LEFT_LEG.ankle;
    const sideShin = Math.atan2(k.x - a.x, a.y - k.y) * DEG;
    assert.ok(Math.abs(sideShin) <= 15, `side ${sideShin.toFixed(1)}°`);
    assert.ok(k.x >= a.x - 15, 'the knee not behind the ankle');
    const shin3 = Math.acos((a.y - k.y) / LEFT_LEG.shin) * DEG;
    assert.ok(shin3 <= 15, `3-D ${shin3.toFixed(1)}°`);
    // the drawn side view agrees (the knee is the solved one)
    assert.ok(Math.abs(side.kneeL.u - k.x) < 0.5 && Math.abs(side.kneeL.v - k.y) < 0.5);
  });
  it('the left thigh and shin as long as the right leg’s', () => {
    const t = Math.hypot(LEFT_LEG.knee.x - LEFT_LEG.hip.x, LEFT_LEG.knee.y - LEFT_LEG.hip.y, LEFT_LEG.knee.z - LEFT_LEG.hip.z);
    const s = Math.hypot(LEFT_LEG.knee.x - LEFT_LEG.ankle.x, LEFT_LEG.knee.y - LEFT_LEG.ankle.y, LEFT_LEG.knee.z - LEFT_LEG.ankle.z);
    assert.ok(Math.abs(t - LEFT_LEG.thigh) / LEFT_LEG.thigh < 0.03, `thigh ${t.toFixed(0)} vs ${LEFT_LEG.thigh.toFixed(0)}`);
    assert.ok(Math.abs(s - LEFT_LEG.shin) / LEFT_LEG.shin < 0.03, `shin ${s.toFixed(0)} vs ${LEFT_LEG.shin.toFixed(0)}`);
    assert.ok(LEFT_LEG.thigh > 440 && LEFT_LEG.thigh < 500 && LEFT_LEG.shin > 420 && LEFT_LEG.shin < 480, 'adult bones');
  });
  it('the knee clears the hi-hat stand’s tube, and the leg stays out of the snare', () => {
    assert.ok(Math.hypot(LEFT_LEG.knee.x - g.rod.u, LEFT_LEG.knee.z - g.rod.v) >= 95);
    const sn = KIT.drums.snare;
    // the shin's plan line is outside the snare's footprint
    for (let i = 0; i <= 10; i++) {
      const x = LEFT_LEG.knee.x + ((LEFT_LEG.ankle.x - LEFT_LEG.knee.x) * i) / 10;
      const z = LEFT_LEG.knee.z + ((LEFT_LEG.ankle.z - LEFT_LEG.knee.z) * i) / 10;
      assert.ok(Math.hypot(x - sn.c.x, z - sn.c.z) > sn.spec.d.mm / 2 + 20, 'clear of the snare');
    }
  });
});

describe('every drawing reads the one pedal description', () => {
  it('no drawing keeps the old straight-back pedal', () => {
    for (const p of ['shared/cymbals/CymbalArt.tsx', 'shared/KitPlan.tsx', 'shared/kitScene/kitSceneModel.ts', 'i01aHiHat/art.tsx', 'shared/kitScene/stickPose.ts', 'shared/figureV2/kitDrummerV2.tsx', 'shared/drums/DrumArt.tsx', 'shared/kitPlanModel.ts']) {
      const s = read(p);
      assert.ok(!/hihatPedal\.(u0|u1)\b/.test(s), `${p} still reads u0 / u1`);
    }
  });
  it('both figures draw the left shoe turned with the pedal', () => {
    assert.match(read('shared/players/PlayerFigure.tsx'), /shoe\(pose\.footL, pose\.shoeL\)/);
    assert.match(read('shared/figureV2/kitDrummerV2.tsx'), /along: Math\.abs\(g\.dir\.u\)/);
    assert.match(read('shared/figureV2/sidePlan.ts'), /const F = \(x: number, y: number\) => F0\(x \* k, y\);/);
  });
});
