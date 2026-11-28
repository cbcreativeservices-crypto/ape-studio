/**
 * FIGURE V2 — METAL (D78 roll-out, 2026-11-24): the triangle (I06a), finger
 * cymbals (I06b), bar chimes (I06c) and gong (I12) players drawn as the cast
 * person on one 3-D skeleton per picture (shared/metal/metalFigureV2.ts,
 * each lesson's playerV2.ts). These tests pin: the switch and the cast; every
 * picture's arms of adult length with a natural wrist; each hand on what its
 * picture draws it holding (pads on the clip, the straps, the cymbals; the
 * stick grip on the beater and the mallet); left and right hands anatomically
 * left and right; the lessons converted WHOLE (no old figure drawn when the
 * switch is on); the instrument anchors unchanged.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FIGURE_V2_FAMILY, figureV2On } from '../src/screens/lab/miking/lessons/shared/figureV2/figureV2Config.ts';
import { armMeasures, handednessOf, type MetalArm, type MetalFig } from '../src/screens/lab/miking/lessons/shared/metal/metalFigureV2.ts';
import { beaterArm, CLIP_C, clipArm, triFig } from '../src/screens/lab/miking/lessons/i06aTriangle/playerV2.ts';
import { HELD_BEATER, MOUNTED_BEATER } from '../src/screens/lab/miking/lessons/i06aTriangle/beaters.ts';
import { FC_BODY, FC_LEFT_PINCH_FROM_ABOVE, fcFig, GHOST_Z, underArm } from '../src/screens/lab/miking/lessons/i06bFingerCymbals/playerV2.ts';
import { BC_SWEEP_FINGERS_DOWN, bcFig, sweepArm } from '../src/screens/lab/miking/lessons/i06cBarChimes/playerV2.ts';
import { gongFig, malletOf } from '../src/screens/lab/miking/lessons/i12Gong/playerV2.ts';
import { CLIP } from '../src/screens/lab/miking/lessons/i06aTriangle/geometry.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
type V = { x: number; y: number; z: number };
const dist = (a: V, b: V) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const VIEWS = ['side', 'top', 'front'] as const;

/** Every picture's figure, by name. */
function allFigs(): [string, MetalFig][] {
  const out: [string, MetalFig][] = [];
  for (const v of VIEWS) {
    for (const x of ['held', 'mounted']) out.push([`tri ${x} ${v}`, triFig(v, x)]);
    for (const x of ['orchestral', 'dance']) out.push([`fc ${x} ${v}`, fcFig(v, x)]);
    out.push([`bc ${v}`, bcFig(v)]);
    for (const x of ['tamtam', 'bossed']) out.push([`gong ${x} ${v}`, gongFig(v, x)]);
  }
  for (const z of GHOST_Z) out.push([`fc ghost ${z}`, fcFig('top', 'dance', z)]);
  out.push(['bc front (hand-drum hand)', bcFig('front', [220, -1250])]);
  return out;
}

test('metal: the family switch is on and each lesson has its own person', () => {
  assert.equal(FIGURE_V2_FAMILY.familyMetal, true);
  assert.equal(figureV2On('familyMetal'), true);
  const cast = read('src/screens/lab/miking/lessons/shared/figureV2/cast.ts');
  for (const [role, who] of [['metal.triangle', 'mei'], ['metal.fingerCymbals', 'drummer'], ['metal.barChimes', 'drummer'], ['metal.gong', 'ana']])
    assert.match(cast, new RegExp(`'${role.replace('.', '\\.')}': '${who}'`), role);
});

test('metal: every arm is an adult arm with a real elbow, the wrist within a natural bend', () => {
  for (const [name, fig] of allFigs()) {
    for (const side of ['L', 'R'] as const) {
      const a = fig.arms[side];
      const upper = dist(a.elbow, a.shoulder);
      const fore = dist(a.sk.frame.o, a.elbow);
      assert.ok(upper > 290 && upper < 325, `${name} ${side}: upper arm ${upper.toFixed(0)} mm`);
      assert.ok(fore > 215 && fore < 280, `${name} ${side}: forearm ${fore.toFixed(0)} mm`);
      // (a real elbow: never a straight rod from shoulder to wrist)
      const reach = dist(a.sk.frame.o, a.shoulder);
      assert.ok(reach < upper + fore - 8, `${name} ${side}: the arm is not straight (reach ${reach.toFixed(0)})`);
      if (!a.handElsewhere) {
        const fd = { x: a.sk.frame.o.x - a.elbow.x, y: a.sk.frame.o.y - a.elbow.y, z: a.sk.frame.o.z - a.elbow.z };
        const l = Math.hypot(fd.x, fd.y, fd.z);
        const c = (fd.x * a.sk.frame.x.x + fd.y * a.sk.frame.x.y + fd.z * a.sk.frame.x.z) / l;
        const bend = (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
        assert.ok(bend <= 50, `${name} ${side}: wrist bend ${bend.toFixed(0)}°`);
      }
    }
  }
});

test('metal: the left hand is a left hand and the right a right one, in every picture', () => {
  for (const [name, fig] of allFigs()) {
    assert.equal(handednessOf(fig.arms.L.sk), -1, `${name}: left`);
    assert.equal(handednessOf(fig.arms.R.sk), 1, `${name}: right`);
  }
});

test('triangle: the clip held "like a C" — thumb behind it, middle finger in front, index on top', () => {
  const a: MetalArm = clipArm('side');
  const C = CLIP_C;
  const [index, middle] = a.sk.fingers;
  const thumb = a.sk.thumb.joints[3];
  const tipOf = (d: { joints: V[] }) => d.joints[3];
  assert.ok(tipOf(index).y < C.y - CLIP.h / 2, 'index pad on top of the clip');
  assert.ok(tipOf(middle).x > C.x + CLIP.w / 2, 'middle pad on the clip\'s front (audience side)');
  assert.ok(thumb.x < C.x - CLIP.w / 2, 'thumb pad on the clip\'s back (player side): opposite the fingers');
  for (const m of a.sk.miss) assert.ok(m < 4, `pad miss ${m.toFixed(1)}`);
  // (the ring and little fingers hang free, near the triangle, to damp)
  for (const d of a.sk.fingers.slice(2)) assert.ok(tipOf(d).y > C.y, 'ring and little fingers below the clip');
});

test('triangle: the beater held near its end in the stick grip (thumb one side, fingers the other)', () => {
  for (const b of [HELD_BEATER, MOUNTED_BEATER]) {
    const a = beaterArm('R', b);
    // (review 2: the approved held grip — the beater passes THROUGH the closed hand, drawn by GripHand)
    assert.ok(a.grip && a.handElsewhere, 'the hand closes round the beater');
    const near = dist(a.grip!.g.fist, b.grip);
    assert.ok(near > 20 && near < 45, `closes ${near.toFixed(0)} mm in from the end`);
  }
  // the beaters themselves are the lesson's (moved unchanged out of art.tsx)
  assert.equal(Math.round(HELD_BEATER.tip.y), -1191);
  assert.ok(Math.abs(Math.hypot(HELD_BEATER.grip.x - HELD_BEATER.tip.x, HELD_BEATER.grip.y - HELD_BEATER.tip.y, HELD_BEATER.grip.z - HELD_BEATER.tip.z) - 215) < 1e-6);
});

test('finger cymbals: pads on the straps (orchestral) and under the bells (dance)', () => {
  const held = fcFig('side', 'orchestral');
  for (const side of ['L', 'R'] as const) {
    const sk = held.arms[side].sk;
    const pinch = dist(sk.fingers[0].joints[3], sk.thumb.joints[3]);
    assert.ok(pinch < 18, `${side}: thumb and index pads pinch the strap (${pinch.toFixed(0)} mm apart)`);
  }
  for (const v of VIEWS) {
    const d = fcFig(v, 'dance');
    for (const side of ['L', 'R'] as const) for (const m of d.arms[side].sk.miss) assert.ok(m < 8, `dance ${v} ${side}: pad miss ${m.toFixed(1)}`);
  }
});

test('bar chimes: the sweeping fingers brush the bars from the player\'s side, the right arm hangs', () => {
  const a = sweepArm();
  for (const f of a.sk.fingers) {
    const t = f.joints[3];
    assert.ok(t.x < 0 && t.x > -25, `fingertip just behind the bars (x ${t.x.toFixed(0)})`);
  }
  const R = bcFig('side').arms.R;
  assert.ok(R.sk.frame.o.y > -1000, 'the right hand hangs at the side');
});

test('gong: the mallet in the right hand near the end of its handle, the arm reaching with a soft elbow', () => {
  for (const x of ['tamtam', 'bossed']) {
    const m = malletOf('side', x);
    const fig = gongFig('side', x);
    const a = fig.arms.R;
    const reach = dist(a.sk.frame.o, a.shoulder);
    assert.ok(reach > 420, `${x}: the arm reaches (${reach.toFixed(0)} mm)`);
    assert.ok(dist(a.sk.frame.o, m.grip) < 140, `${x}: the hand at the handle's end`);
    assert.ok(fig.arms.L.sk.frame.o.y > -1000, `${x}: the left hand hangs`);
  }
});

test('metal: each lesson converted whole — every old figure only behind the switch', () => {
  for (const f of ['i06aTriangle', 'i06bFingerCymbals', 'i06cBarChimes', 'i12Gong']) {
    const src = read(`src/screens/lab/miking/lessons/${f}/art.tsx`);
    const lines = src.split('\n');
    lines.forEach((l, i) => {
      if (/<(PlayerInk|PlayerBehindQuiet|PlayerInFront|SweepHand) /.test(l)) {
        const ctx = lines.slice(Math.max(0, i - 3), i + 1).join('\n');
        assert.match(ctx, /old=\{/, `${f}:${i + 1} an old figure outside MetalSwitch: ${l.trim()}`);
      }
    });
    assert.ok(/MetalPlayerV2/.test(src), `${f}: draws the new player`);
  }
  // (the face-on page knows the drawn scale: the player takes the right level of detail)
  assert.match(read('src/screens/lab/miking/lessons/shared/metal/metalPages.tsx'), /<FigureScale ptPerMm=\{xf\.s\}>/);
});

test('metal: the two stroke rulings left to the owner default to the new pose, and the old one is sound too', () => {
  assert.equal(BC_SWEEP_FINGERS_DOWN, true);
  assert.equal(FC_LEFT_PINCH_FROM_ABOVE, true);
  // (the one-line flip: the held cymbal lying on the left hand's fingers, the thumb's pad on its rim from above)
  const u = underArm(FC_BODY);
  for (const m of u.sk.miss) assert.ok(m < 8, `under-cymbal pad miss ${m.toFixed(1)}`);
  assert.equal(handednessOf(u.sk), -1);
  assert.ok(u.sk.thumb.joints[3].y < u.sk.fingers[1].joints[3].y, 'the thumb above the plate, the fingers under it');
});

test('metal: the measures the study page reads are sane', () => {
  const m = armMeasures(clipArm('front'));
  assert.ok(m.upper > 300 && m.fore > 240 && m.wristBend < 40);
});
