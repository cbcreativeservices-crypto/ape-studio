/**
 * FIGURE ANATOMY RATCHET (owner 2026-10-08, from a Pixel screenshot of F04
 * "Impacts, Liquids and Textures": "this poor guy has his lower half of his
 * body turned all the way around, has a rather large and offensive male
 * 'package' protruding from his pants, and an arm that appears to come from
 * either his butt … We, professionally, cannot have this kind of animation
 * and drawing issues").
 *
 * Every pose BUILDER the tests can reach (pure .ts — the Foley performer, the
 * standing/seated talker, the singer, the measuring operator, the guitarist)
 * is checked from its joints:
 *   ORIENTATION  in a side view the head, the knees and the feet face the
 *                same way (`facing`): the knees never bend backward, the head
 *                is never behind the collar;
 *   LIMBS        each arm starts at a shoulder at the top of the torso; the
 *                upper arm and forearm are never longer than an adult's (a
 *                projection may shorten them, never stretch them); a hand is
 *                within the arm's reach of its own shoulder;
 *   DECENCY      a standing figure has no hand, elbow or hand tip in a GROIN
 *                BOX in front of the pelvis (side view) or between the
 *                thighs below the belt (front view);
 *   PROPORTIONS  a standing adult is 6.5–8 heads tall.
 * And the drawing's own rules (PlayerFigure.buildSide): the shirt is tucked
 * at the belt and the trousers' pelvis has a flat front no further forward
 * than the thigh — read from the source, since Skia does not run here.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import type { PlayerPose, Pt } from '../src/screens/lab/miking/lessons/shared/players/playerPose.ts';
import { BODY } from '../src/screens/lab/miking/lessons/shared/players/playerPose.ts';
import { ARM, armChain, sidePose, standing, topPose, type Body3 } from '../src/screens/lab/miking/lessons/shared/foley/performer.ts';
import { v3 } from '../src/screens/lab/miking/lessons/shared/foley/frameF.ts';
import { WALKER } from '../src/screens/lab/miking/lessons/f01Footsteps/geometry.ts';
import { HOLDER, WEARER } from '../src/screens/lab/miking/lessons/f02Clothing/geometry.ts';
import { BODIES as F03_BODIES } from '../src/screens/lab/miking/lessons/f03Props/geometry.ts';
import { BODIES as F04_BODIES } from '../src/screens/lab/miking/lessons/f04Impacts/geometry.ts';
import { ARTIST } from '../src/screens/lab/miking/lessons/f05Perspective/geometry.ts';
import { SINGER_SIDE, SINGER_TOP } from '../src/screens/lab/miking/lessons/shared/voice/voicePose.ts';
import { SEATED_SIDE, SEATED_TOP, poseOnTalker } from '../src/screens/lab/miking/lessons/shared/broadcast/talkerPose.ts';
import { standPoses } from '../src/screens/lab/miking/lessons/shared/broadcast/standing.ts';
import { operatorSide, operatorTop } from '../src/screens/lab/miking/lessons/shared/measure/measureModel.ts';

const d = (a: Pt, b: Pt) => Math.hypot(a.u - b.u, a.v - b.v);
const mid = (a: Pt, b: Pt): Pt => ({ u: (a.u + b.u) / 2, v: (a.v + b.v) / 2 });
/** Adult lengths (mm) and the slack a drawing may take before it reads as stretched. */
const UPPER = ARM.upper;
const FORE = ARM.fore;
const STRETCH = 1.15;

/** Every anatomy problem of one pose, as words (empty = sound). */
function anatomy(pose: PlayerPose, surface?: number): string[] {
  const out: string[] = [];
  const hip = mid(pose.hipR, pose.hipL);
  const torso = d(pose.neck, hip);
  for (const [s, sh, el, hand] of [
    ['R', pose.shoulderR, pose.elbowR, pose.handR],
    ['L', pose.shoulderL, pose.elbowL, pose.handL],
  ] as const) {
    // A collapsed arm (shoulder = elbow = wrist) is a figure drawn without it.
    if (d(sh, hand.wrist) < 1 && d(sh, el) < 1) continue;
    // The shoulder joint sits at the top of the torso, beside the collar.
    if (d(sh, pose.neck) > BODY.shoulderHalf + 40) out.push(`${s} shoulder ${d(sh, pose.neck).toFixed(0)} mm from the collar (not at the top of the torso)`);
    if (pose.view === 'side' && sh.v > pose.neck.v + 0.3 * torso) out.push(`${s} shoulder below the chest`);
    if (d(sh, el) > UPPER * STRETCH) out.push(`${s} upper arm ${d(sh, el).toFixed(0)} mm (adult ≈ ${UPPER})`);
    if (d(el, hand.wrist) > FORE * STRETCH) out.push(`${s} forearm ${d(el, hand.wrist).toFixed(0)} mm (adult ≈ ${FORE})`);
    if (d(sh, hand.wrist) > (UPPER + FORE) * 1.02) out.push(`${s} hand ${d(sh, hand.wrist).toFixed(0)} mm from its shoulder (reach ${UPPER + FORE})`);
  }
  if (pose.view === 'side') {
    const f = pose.facing ?? 1;
    if (f * (pose.head.c.u - pose.neck.u) < -25) out.push('head behind the collar (faces away from the body)');
    for (const [s, hp, kn, ft] of [
      ['R', pose.hipR, pose.kneeR, pose.footR],
      ['L', pose.hipL, pose.kneeL, pose.footL],
    ] as const) {
      if (pose.posture !== 'standing') continue;
      // The knee is on, or in front of, the hip–ankle line: it never bends backward.
      const ankle = { u: ft.u - f * 40, v: ft.v - 70 };
      const t = (kn.v - hp.v) / Math.max(1, ankle.v - hp.v);
      const lineU = hp.u + (ankle.u - hp.u) * t;
      if (f * (kn.u - lineU) < -15) out.push(`${s} knee bends backward (${(f * (kn.u - lineU)).toFixed(0)} mm)`);
      // The foot is under the body, not behind the heels' line by a stride.
      if (Math.abs(ft.u - hp.u) > 520) out.push(`${s} foot ${Math.abs(ft.u - hp.u).toFixed(0)} mm from the hip`);
    }
    // An elbow flexes one way: with the hand below the shoulder, the elbow is
    // never AHEAD of the shoulder–wrist line (it would point forward).
    for (const [s, sh, el, hand] of [
      ['R', pose.shoulderR, pose.elbowR, pose.handR],
      ['L', pose.shoulderL, pose.elbowL, pose.handL],
    ] as const) {
      if (hand.wrist.v < sh.v + 100 || Math.abs(hand.wrist.v - sh.v) < 1) continue;
      const t = (el.v - sh.v) / (hand.wrist.v - sh.v);
      const lineU = sh.u + (hand.wrist.u - sh.u) * t;
      if (f * (el.u - lineU) > 15) out.push(`${s} elbow points forward (${(f * (el.u - lineU)).toFixed(0)} mm ahead of the arm's line)`);
    }
    if (pose.posture === 'standing') {
      // THE GROIN BOX: in front of the pelvis, from just above the hips to mid-thigh.
      const inBox = (q: Pt) => {
        const fwd = f * (q.u - hip.u);
        return fwd > 75 && fwd < 340 && q.v > hip.v - 60 && q.v < hip.v + 230;
      };
      for (const [s, el, hand] of [
        ['R', pose.elbowR, pose.handR],
        ['L', pose.elbowL, pose.handL],
      ] as const) {
        // A hand ON a prop's surface (a table top, a chair's back rail) reads as
        // the hand on the prop, not at the body: its wrist within 90 mm above it.
        if (surface !== undefined && hand.wrist.v <= surface + 10 && hand.wrist.v >= surface - 90) continue;
        const tip = { u: hand.wrist.u + Math.cos(hand.dir) * BODY.handLen * 0.8, v: hand.wrist.v + Math.sin(hand.dir) * BODY.handLen * 0.8 };
        for (const [what, q] of [
          ['elbow', el],
          ['wrist', hand.wrist],
          ['hand', tip],
        ] as const)
          if (inBox(q)) out.push(`${s} ${what} in front of the groin`);
      }
      const ratio = (Math.max(pose.footR.v, pose.footL.v) - (pose.head.c.v - pose.head.r)) / BODY.headH;
      if (ratio < 6.5 || ratio > 8) out.push(`${ratio.toFixed(2)} heads tall`);
    }
  }
  if (pose.view === 'front' && pose.posture === 'standing') {
    const inBox = (q: Pt) => Math.abs(q.u - hip.u) < 70 && q.v > hip.v - 20 && q.v < hip.v + 200;
    for (const [s, hand] of [
      ['R', pose.handR],
      ['L', pose.handL],
    ] as const)
      if (hand.kind === 'rest' && inBox(hand.wrist)) out.push(`${s} hand between the thighs`);
  }
  return out;
}

/** The prop surface (v, the view's mm) the hands of a pose rest on: the
 *  table top at the action (F03 paper, F04), a chair's back rail (F03 chair). */
const ON_SURFACE: Record<string, number> = { 'F03.paper.side': 0, 'F03.chair.side': -880, 'F04.impact.side': 0, 'F04.live.side': 0, 'F04.texture.side': 0 };

/** Every reachable pose, by name. */
function poses(): Record<string, PlayerPose> {
  const out: Record<string, PlayerPose> = {};
  const body = (name: string, b: Body3) => {
    out[`${name}.side`] = sidePose(b);
    out[`${name}.top`] = topPose(b);
  };
  body('F01.walker', WALKER);
  body('F02.holder', HOLDER);
  body('F02.wearer', WEARER);
  for (const [k, b] of Object.entries(F03_BODIES)) body(`F03.${k}`, b);
  for (const [k, b] of Object.entries(F04_BODIES)) body(`F04.${k}`, b);
  body('F05.artist', ARTIST);
  out['voice.singer.side'] = SINGER_SIDE;
  out['voice.singer.top'] = SINGER_TOP;
  out['broadcast.seated.side'] = SEATED_SIDE;
  out['broadcast.seated.top'] = SEATED_TOP;
  for (const facing of [1, -1] as const) {
    const t = { id: 't', lip: v3(400, -200, 100), facing };
    out[`broadcast.seated.side.${facing}`] = poseOnTalker(SEATED_SIDE, t);
    const st = standPoses(t);
    out[`broadcast.standing.side.${facing}`] = st.side;
    out[`broadcast.standing.top.${facing}`] = st.top;
    out[`measure.operator.side.${facing}`] = operatorSide(500, 1200, facing);
    out[`measure.operator.top.${facing}`] = operatorTop(500, 300, facing);
  }
  return out;
}

describe('figure anatomy (owner 2026-10-08): every pose builder is drawn correctly, proportionally and decently', () => {
  for (const [name, pose] of Object.entries(poses())) {
    it(`${name}: ${pose.view} ${pose.posture}`, () => {
      assert.deepEqual(anatomy(pose, ON_SURFACE[name]), []);
    });
  }

  it('the checker itself catches the F04 water figure as it was (a far arm from the hip, the hand at the groin)', () => {
    // The joints as shipped before the fix: the far elbow BELOW the hip, the hand at knee height in front of the thigh.
    const shipped = sidePose({ ...F04_BODIES.water, elL: v3(-500, -160, -220), wrL: v3(-330, 120, -240) });
    const issues = anatomy(shipped).join(' | ');
    assert.match(issues, /L upper arm/);
    assert.match(issues, /L hand .* from its shoulder/);
  });

  it('a backward knee and a head turned away are caught (orientation)', () => {
    const p = sidePose(WALKER);
    const bad: PlayerPose = { ...p, kneeR: { u: p.kneeR.u - 160, v: p.kneeR.v }, head: { ...p.head, c: { u: p.neck.u - 120, v: p.head.c.v } } };
    const issues = anatomy(bad).join(' | ');
    assert.match(issues, /knee bends backward/);
    assert.match(issues, /head behind the collar/);
  });

  it('standing(): every arm is a two-bone chain from its own shoulder, of adult length, within reach', () => {
    const b = standing({ floorY: 1000, x: 0, wrR: v3(900, 0, 0), wrL: v3(0, -2000, -100) });
    for (const [sh, el, wr] of [
      [b.shR, b.elR, b.wrR],
      [b.shL, b.elL, b.wrL],
    ] as const) {
      const L = (a: typeof sh, c: typeof sh) => Math.hypot(a.x - c.x, a.y - c.y, a.z - c.z);
      assert.ok(Math.abs(L(sh, el) - ARM.upper) < 0.5, 'upper arm keeps its length');
      assert.ok(Math.abs(L(el, wr) - ARM.fore) < 0.5, 'forearm keeps its length');
      assert.ok(L(sh, wr) <= (ARM.upper + ARM.fore) * 0.986, 'the hand is pulled back into reach');
    }
    const c = armChain(v3(0, 0, 0), v3(0, 400, 0), v3(-100, 200, 0));
    assert.ok(c.el.x < 0, 'the elbow bends toward the hint');
  });

  it('standing(lean): the upper body turns forward about the hips; the legs stay on the floor', () => {
    const up = standing({ floorY: 1000, x: 0, wrR: v3(0, 200, 100), wrL: v3(0, 200, -100) });
    const bent = standing({ floorY: 1000, x: 0, lean: 25, wrR: v3(0, 200, 100), wrL: v3(0, 200, -100) });
    assert.ok(bent.neck.x > up.neck.x + 150 && bent.neck.y > up.neck.y, 'the collar moves forward and down');
    assert.deepEqual([bent.ftR, bent.ftL, bent.hipR], [up.ftR, up.ftL, up.hipR]);
    assert.ok(bent.head.x > bent.neck.x, 'the head stays over and ahead of the collar');
  });

  it('PlayerFigure profile: the shirt is tucked at the belt, the pelvis is ONE trouser mass with a flat front no further forward than the thigh', () => {
    const src = readFileSync(new URL('../src/screens/lab/miking/lessons/shared/players/PlayerFigure.tsx', import.meta.url), 'utf8');
    const side = src.slice(src.indexOf('function buildSide('), src.indexOf('const cache = new WeakMap'));
    const m = side.match(/const pelvis = smooth\(\[(.*?)\], 0\.5\)/);
    assert.ok(m, 'buildSide builds a pelvis');
    const fronts = [...m![1].matchAll(/along\((-?[\d.]+), (-?[\d.]+)\)/g)].map((q) => ({ t: Number(q[1]), fwd: Number(q[2]) }));
    for (const q of fronts) assert.ok(q.fwd <= BODY.thighR + 12, `the pelvis front at t=${q.t} is ${q.fwd} mm forward (thigh ${BODY.thighR}): no bulge`);
    assert.match(side, /const legNear = union\(pelvis, /, 'the pelvis joins the near leg (one trouser mass)');
    assert.match(side, /PathOp\.Difference\) \?\? torso;/, 'the shirt is cut at the belt (tucked in)');
    assert.doesNotMatch(side, /\{ path: torso, tone: 'shirt' \}/, 'the untucked torso is never drawn');
    // The far arm is drawn BEHIND the torso, from the far shoulder.
    assert.match(side, /const armFar = limb\(\[pose\.shoulderL, /);
    const behind = side.slice(side.indexOf('const behind: Mass[]'));
    assert.ok(behind.indexOf('armFar') < behind.indexOf('path: shirt'), 'the far arm is painted before (behind) the shirt');
  });

  it('family figures (Skia, read from the source): the line-art arm is a two-bone chain; ensemble masses are unions; necks end at the collar', () => {
    const read = (p: string) => readFileSync(new URL(`../src/screens/lab/miking/lessons/shared/${p}`, import.meta.url), 'utf8');
    // Metal line art (I06a–c, I12): shoulder → solved elbow → hand, never a curve sagging to the hip.
    const metal = read('metal/metalArt.tsx');
    const side = metal.slice(metal.indexOf('export function playerSide('), metal.indexOf('export function playerTop('));
    assert.match(side, /elbow2D\(LINE_SHOULDER, \[hx, hy\], 1\)/);
    assert.doesNotMatch(side, /\(hy - 1450\) \/ 2/);
    const arm = metal.match(/LINE_ARM = \{ upper: (\d+), fore: (\d+) \}/);
    assert.ok(arm && Number(arm[1]) <= ARM.upper && Number(arm[2]) <= ARM.fore, 'the profile arm is never longer than an adult arm');
    // Ensemble (E02–E16): every figure part is UNIONED into its mass (addPath let a torso and the shoulder oval cancel: a hole).
    const seating = read('ensemble/SeatingArt.tsx');
    assert.doesNotMatch(seating, /b\.fig\.[a-z]+\.addPath\(/);
    assert.match(seating, /function addFig\(b: Batch, tone: FigTone, q: SkPath\): void \{\s*b\.fig\[tone\] = Skia\.Path\.MakeFromOp\(b\.fig\[tone\], q, PathOp\.Union\)/);
    assert.match(seating, /const NECK_V = g - sh - 55;/, 'the neck ends at the collar, not below the shoulder line');
    // Small percussion (I02–I05): the head sits on the collar (head centre 1606 mm, collar 1440 mm).
    assert.match(read('smallperc/Player.tsx'), /headProfile\(pt\(-346, H\(1606\)\), 108, H\(1440\), 1\)/);
  });
});
