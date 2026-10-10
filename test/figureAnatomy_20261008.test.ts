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
import { FH, TP } from '../src/screens/lab/miking/lessons/a01Trumpet/geometry.ts';
import { TB } from '../src/screens/lab/miking/lessons/a02Trombone/geometry.ts';

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
    assert.match(side, /const armFar = sleeveArm\(pose\.shoulderL, /);
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

  // Figure polish 2026-10-10 (owner: "a pro reference app, my peers are my
  // critics" — mannequin tubes, mitten hands, capsule joints).
  it('PlayerFigure polish: real hands (four jointed fingers + a thumb, adult size), tapered sleeved arms with a deltoid, cut square at the cuff; small-percussion arms opaque', () => {
    const src = readFileSync(new URL('../src/screens/lab/miking/lessons/shared/players/PlayerFigure.tsx', import.meta.url), 'utf8');
    // The hand: four fingers, each three phalanges; the middle the longest;
    // hand length (wrist crease → middle tip) 0.75–0.82 head lengths.
    const table = src.slice(src.indexOf('const FINGERS = ['), src.indexOf('] as const;', src.indexOf('const FINGERS = [')));
    const fingers = [...table.matchAll(/\{ x: (-?[\d.]+), y: (-?[\d.]+), a: (-?[\d.]+), seg: \[([\d.]+), ([\d.]+), ([\d.]+)\], r: \[([\d.]+), ([\d.]+), ([\d.]+), ([\d.]+)\] \}/g)].map((m) => ({
      reach: Number(m[1]) + Number(m[4]) + Number(m[5]) + Number(m[6]),
      len: Number(m[4]) + Number(m[5]) + Number(m[6]),
      r: [7, 8, 9, 10].map((i) => Number(m[i])),
    }));
    assert.equal(fingers.length, 4, 'four fingers');
    const [index, middle, ring, little] = fingers;
    assert.ok(middle.len > index.len && middle.len > ring.len && ring.len > little.len && index.len > little.len, 'middle longest, little shortest');
    const handH = middle.reach / BODY.headH;
    assert.ok(handH >= 0.75 && handH <= 0.82, `hand = ${handH.toFixed(2)} head lengths`);
    for (const f of fingers) {
      assert.ok(f.r[0] >= 9 && f.r[0] <= 12, `finger base ${f.r[0] * 2} mm wide`);
      assert.ok(f.r.every((r, i) => i === 0 || r < f.r[i - 1]), 'each finger tapers to its tip');
    }
    assert.match(src, /const thumb = digit\(L, /, 'every hand has a jointed thumb');
    // No mitten: no hand kind is a palm plus a single 'fingers' blob.
    assert.doesNotMatch(src, /const fingers = limb\(\[L\(/);
    // The arm: a tapered sleeve — upper arm thicker than the elbow, the
    // forearm's belly thicker than the cuff — cut square at the cuff.
    const up = src.match(/const upper = limb\(\[root, lerp\(root, e, 0\.3\), e\], \[(\d+), (\d+), (\d+)\]\)/);
    const fo = src.match(/const fore = limb\(\[e, lerp\(e, w, 0\.26\), w\], \[(\d+), (\d+), (\d+)\]\)/);
    assert.ok(up && fo, 'sleeveArm builds the upper arm and forearm');
    assert.ok(Number(up![2]) > Number(up![3]) && Number(fo![2]) > Number(fo![3]) && Number(up![2]) > Number(fo![2]) && Number(fo![3]) < Number(up![3]), 'upper arm > elbow > forearm belly > cuff');
    assert.match(src, /return Skia\.Path\.MakeFromOp\(arm, cut, PathOp\.Difference\) \?\? arm;/, 'the sleeve ends square at the cuff');
    assert.doesNotMatch(src, /const arm(L|R|Near|Far) = limb\(/, 'no arm is a bare capsule chain');
    for (const v of ['buildFront(', 'buildAbove(', 'buildSide(']) {
      const body = src.slice(src.indexOf(`function ${v}`), src.indexOf('\n}\n', src.indexOf(`function ${v}`)));
      assert.match(body, /sleeveArm\(/, `${v} draws its arms as sleeves`);
    }
    // The shoulder: a deltoid joined to the arm (front and profile), never a tube's round end over the shoulder line.
    assert.match(src, /sleeveArm\(pt\(sR\.u, sR\.v \+ 12\), pose\.elbowR, pose\.handR\.wrist, deltoid\(R\)\)/);
    assert.match(src, /const armNear = sleeveArm\(sh, pose\.elbowR, pose\.handR\.wrist, deltoid\);/);
    assert.match(src, /const deltoid = Skia\.Path\.MakeFromOp\(deltoidRaw, torso, PathOp\.Intersect\)/, 'the profile deltoid stays inside the shoulder line');
    // Small percussion: the arm is opaque (a far arm is darker, never see-through), the sleeve a cut T-shirt sleeve.
    const sp = readFileSync(new URL('../src/screens/lab/miking/lessons/shared/smallperc/Player.tsx', import.meta.url), 'utf8');
    const arm2d = sp.slice(sp.indexOf('export function Arm2D('));
    assert.doesNotMatch(arm2d, /<Group opacity=\{opacity\}>/);
    assert.match(arm2d, /PathOp\.Difference\) \?\? cap;/, 'the sleeve hem is cut square');
  });

  // Figure polish round 2 (2026-10-10): the family figures the owner named.
  it('family figures are OPAQUE and their hands hold what they hold (brass, low brass, bowed, woodwinds, boom operator, bongo legs)', () => {
    const read = (p: string) => readFileSync(new URL(`../src/screens/lab/miking/lessons/${p}`, import.meta.url), 'utf8');
    // Bowed + brass share playerGroups: no see-through player layers.
    const bowed = read('shared/bowed/BowedArt.tsx');
    const scene = bowed.slice(bowed.indexOf('export function BowedScene('));
    assert.doesNotMatch(scene, /<Paint opacity=\{0\.(5|78)\} \/>/, 'the bowed player is opaque');
    assert.match(bowed, /export type HandHold = \{ kind: HandKind;/);
    assert.match(bowed, /fore\('foreL', s\.elbowL, s\.handL, wL\.wrist, wL\.depth\)/, 'the forearm ends at the hand’s own wrist');
    assert.match(bowed, /return \{ kind: 'wrap', dir: Math\.atan2\(b\[1\] - a\[1\], b\[0\] - a\[0\]\), at: b, depth: instDepth - 1 \};/, 'the left hand wraps the neck from behind it');
    const brass = read('shared/brass/BrassArt.tsx');
    assert.doesNotMatch(brass, /<Paint opacity=\{0\.62\} \/>/, 'the brass player is opaque');
    assert.match(brass, /R: \{ kind: 'keys', dir: along - 1\.05, at: \[mid\[0\], mid\[1\] \+ 2\] \}/, 'the valve hand’s fingers on the buttons');
    // Low brass: opaque, anatomical hands, the forearm routed clear of the piston cluster.
    const low = read('shared/lowbrass/LowBrassArt.tsx');
    assert.doesNotMatch(low, /opacity=\{playerKeys\.has\(it\.key\) \? 0\.82 : 1\}/);
    assert.doesNotMatch(low, /limb\('hand[LR]', J\.wrist[LR], J\.hand[LR], 30, 36, SKIN\)/, 'no capsule (mitten) hands');
    assert.match(low, /const hs = handShape\(\{ wrist: pt\(wrist\[0\], wrist\[1\]\), dir, kind \}\);/);
    // Woodwinds: from the audience the fingers close round the tube.
    assert.match(read('shared/woodwinds/WindArt.tsx'), /kind: front \? \('grip' as const\) : \('above' as const\)/);
    // Boom operator (B04 B10 B11 F09): the elbow raised beside the head, never under the chin.
    const loc = read('shared/field/LocationArt.tsx');
    assert.match(loc, /elbowR: upElbow\(shR, wrR\),/);
    // Bongo legs: one trouser mass + a shoe; the near leg a dashed phantom, never a translucent ghost.
    const bongo = read('m04bBongos/art.tsx');
    assert.match(bongo, /path: limb\(\[hip, knee, ankle\], \[82, 62, 40\]\), tone: 'trousers'/);
    assert.doesNotMatch(bongo, /opacity=\{ghost \? 0\.38 : 1\}/);
  });

  // Round 4 (2026-10-10): a brass player's elbows HANG (from above the raised
  // elbows framed the head). Upper arm ≈ 40–55° below horizontal: the elbow
  // 150–250 mm below the shoulder, 80–200 mm in front, 30–120 mm outboard.
  it('brass players: the elbows hang beside the body (trumpet, flugelhorn; the trombone’s left arm)', () => {
    const check = (name: string, s: { x: number; y: number; z: number }, e: { x: number; y: number; z: number }, out: 1 | -1) => {
      const down = e.y - s.y;
      const fwd = e.x - s.x;
      const side = (e.z - s.z) * out;
      assert.ok(down >= 150 && down <= 250, `${name}: elbow ${down.toFixed(0)} mm below the shoulder`);
      assert.ok(fwd >= 80 && fwd <= 200, `${name}: elbow ${fwd.toFixed(0)} mm in front`);
      assert.ok(side >= 30 && side <= 120, `${name}: elbow ${side.toFixed(0)} mm outboard`);
      const ang = (Math.atan2(down, Math.hypot(fwd, side)) * 180) / Math.PI;
      assert.ok(ang >= 38 && ang <= 58, `${name}: upper arm ${ang.toFixed(0)}° below horizontal`);
    };
    for (const [n, P] of [['trumpet', TP], ['flugelhorn', FH]] as const) {
      check(`${n} R`, P.player.shoulderR, P.player.elbowR, 1);
      check(`${n} L`, P.player.shoulderL, P.player.elbowL, -1);
    }
    check('trombone L', TB.player.shoulderL, TB.player.elbowL, -1);
  });
});
