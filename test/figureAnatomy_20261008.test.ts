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
import { STANDING as VIOLIN_STANDING } from '../src/screens/lab/miking/lessons/c09aViolin/geometry.ts';
import { POSTURE as CELLO } from '../src/screens/lab/miking/lessons/c09cCello/model.ts';
import { standing as bowedStanding } from '../src/screens/lab/miking/lessons/shared/bowed/posture.ts';
import { BASS as DOUBLE_BASS } from '../src/screens/lab/miking/lessons/shared/bowed/bowedSpec.ts';
import { WURLI_PLAYER_SIDE, WURLI_PLAYER_TOP, WURLI_SEAT_Y } from '../src/screens/lab/miking/lessons/shared/keys/wurliPlayer.ts';
import { METAL_ARM, hangingArm, metalFrontPose, metalSidePose, metalTopPose } from '../src/screens/lab/miking/lessons/shared/metal/metalFigure.ts';
// Figure pass 2 (owner 2026-10-15): the collar, the flute hold, the gong's reach.
import { COLLAR_LIFT, SINGER_COLLAR, SINGER_NECK, SINGER_SOLIDS } from '../src/screens/lab/miking/lessons/shared/voice/voicePose.ts';
import { COLLAR_B, NECK_B, SEATED_SOLIDS } from '../src/screens/lab/miking/lessons/shared/broadcast/talkerPose.ts';
import { LAYOUTS as FLUTES } from '../src/screens/lab/miking/lessons/a06Flute/geometry.ts';
import { SEATED as PICCOLO_SEATED, STANDING as PICCOLO_STANDING } from '../src/screens/lab/miking/lessons/a07Piccolo/geometry.ts';
import { CY as GONG_CY, GONG, MALLET_REACH, playerAt, strikePoint as gongStrike } from '../src/screens/lab/miking/lessons/i12Gong/model.ts';

const BASS_BOW = bowedStanding(DOUBLE_BASS, 'bow');
const add3 = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const sc3 = (a: { x: number; y: number; z: number }, k: number) => ({ x: a.x * k, y: a.y * k, z: a.z * k });

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
  // Figure pass 2026-10-15: the reed-piano player (I11b) and the metal /
  // mallet players (I06a–c, I12, I07–I10) are now shared-figure poses.
  out['keys.wurli.side'] = WURLI_PLAYER_SIDE;
  out['keys.wurli.top'] = WURLI_PLAYER_TOP;
  // the triangle held (clip hand up, beater hand at the chest), arms hanging, the gong mallet, the mallet player
  out['metal.held.side'] = metalSidePose([[-40, -1500], [-230, -1180]]);
  out['metal.rest.side'] = metalSidePose([]);
  out['metal.gong.side'] = metalSidePose([[-150, -1300]]);
  out['metal.chimes.front'] = metalFrontPose([[-260, -1380]]);
  out['metal.rest.front'] = metalFrontPose([]);
  out['mallets.front'] = metalFrontPose([[-240, -1130], [260, -1200]]);
  out['metal.held.top'] = metalTopPose([[-40, 0], [-230, 150]]).pose;
  return out;
}

/**
 * THE CANON and ARTICULATION (owner 2026-10-15: "forearm, elbow, upper arm,
 * shoulders, chest, waist, hips, thighs, upper leg, lower leg, ankle, foot,
 * hands, wrist, fingers, knuckles, finger tips … ALL NEED TO BE IN PROPORTION
 * and articulate correctly"). Per pose, from its joints:
 *   NECK      the head's centre 0.55–0.85 of a head above the collar: the
 *             chin clears the shoulders (I11b: "shoulder and head merge");
 *   WRIST     the hand turns ≤ 70° off its forearm (side and front views);
 *   ELBOW     never folded tighter than 25° between the bones (a seen arm);
 *   SEATED    the thigh (hip → knee) 360–480 mm and the lower leg (knee →
 *             ankle) 340–480 mm, the knee bent 60–150° — bends happen AT the
 *             hip and the knee, the limbs keep their lengths.
 */
function articulation(pose: PlayerPose): string[] {
  const out: string[] = [];
  if (pose.view === 'above') return out;
  const neckGap = d(pose.head.c, pose.neck) / BODY.headH;
  if (neckGap < 0.55 || neckGap > 0.85) out.push(`head centre ${neckGap.toFixed(2)} heads from the collar`);
  const ang = (a: number) => Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));
  for (const [s, sh, el, h] of [
    ['R', pose.shoulderR, pose.elbowR, pose.handR],
    ['L', pose.shoulderL, pose.elbowL, pose.handL],
  ] as const) {
    if (d(sh, h.wrist) < 1 && d(sh, el) < 1) continue;
    const fore = Math.atan2(h.wrist.v - el.v, h.wrist.u - el.u);
    if (d(el, h.wrist) > 40 && ang(h.dir - fore) > (70 * Math.PI) / 180 + 1e-6) out.push(`${s} wrist bent ${((ang(h.dir - fore) * 180) / Math.PI).toFixed(0)}°`);
    const a1 = Math.atan2(sh.v - el.v, sh.u - el.u);
    const a2 = Math.atan2(h.wrist.v - el.v, h.wrist.u - el.u);
    if (d(sh, el) > 120 && d(el, h.wrist) > 120 && ang(a1 - a2) < (25 * Math.PI) / 180) out.push(`${s} elbow folded to ${((ang(a1 - a2) * 180) / Math.PI).toFixed(0)}°`);
  }
  if (pose.view === 'side' && pose.posture === 'seated') {
    const f = pose.facing ?? 1;
    for (const [s, hp, kn, ft] of [
      ['R', pose.hipR, pose.kneeR, pose.footR],
      ['L', pose.hipL, pose.kneeL, pose.footL],
    ] as const) {
      const ankle = { u: ft.u - f * 40, v: ft.v - 70 };
      const thigh = d(hp, kn);
      const shin = d(kn, ankle);
      if (thigh < 360 || thigh > 480) out.push(`${s} thigh ${thigh.toFixed(0)} mm`);
      if (shin < 340 || shin > 480) out.push(`${s} lower leg ${shin.toFixed(0)} mm`);
      const knee = ang(Math.atan2(hp.v - kn.v, hp.u - kn.u) - Math.atan2(ankle.v - kn.v, ankle.u - kn.u));
      if (knee < (60 * Math.PI) / 180 || knee > (150 * Math.PI) / 180) out.push(`${s} knee at ${((knee * 180) / Math.PI).toFixed(0)}°`);
    }
  }
  return out;
}

/** Poses whose neck/wrist the drawing does not take from the pose alone
 *  (named, so the list can only shrink). */
const ARTICULATION_EXEMPT = new Set<string>([]);

describe('figure anatomy (owner 2026-10-08): every pose builder is drawn correctly, proportionally and decently', () => {
  for (const [name, pose] of Object.entries(poses())) {
    it(`${name}: ${pose.view} ${pose.posture}`, () => {
      assert.deepEqual(anatomy(pose, ON_SURFACE[name]), []);
    });
    if (!ARTICULATION_EXEMPT.has(name))
      it(`${name}: canon + articulation (owner 2026-10-15)`, () => {
        assert.deepEqual(articulation(pose), []);
      });
  }

  it('the shared body widths keep an adult canon (owner 2026-10-15)', () => {
    // shoulders ≈ 2 heads across the deltoids; the hand ≈ the face's length (≈ 0.8 head);
    // each limb tapers joint to joint: upper arm > elbow > wrist, thigh > knee > ankle.
    const across = 2 * (BODY.shoulderHalf + 46);
    assert.ok(across / BODY.headH >= 1.8 && across / BODY.headH <= 2.3, `shoulders ${across} mm = ${(across / BODY.headH).toFixed(2)} heads`);
    assert.ok(BODY.handLen / BODY.headH >= 0.7 && BODY.handLen / BODY.headH <= 0.9, 'the hand ≈ a face long');
    assert.ok(BODY.upperArmR > BODY.elbowR && BODY.elbowR > BODY.wristR, 'the arm tapers to the wrist');
    assert.ok(BODY.thighR > BODY.kneeR && BODY.kneeR > BODY.ankleR, 'the leg tapers to the ankle (ankle narrower than the calf)');
    assert.ok(BODY.chestHalf > BODY.waistHalf && BODY.hipHalf > BODY.waistHalf, 'chest → waist → hips');
    assert.ok(METAL_ARM.upper <= ARM.upper && METAL_ARM.fore <= ARM.fore && METAL_ARM.upper / METAL_ARM.fore >= 1 && METAL_ARM.upper / METAL_ARM.fore <= 1.3, 'upper arm ≈ forearm, adult length');
  });

  it('I11b (figure pass 2026-10-15): the reed-piano player is the shared figure at true scale — seated on the bench, forearms level with the keys', () => {
    const P = WURLI_PLAYER_SIDE;
    const hip = mid(P.hipR, P.hipL);
    assert.ok(Math.abs(P.hipR.v - (WURLI_SEAT_Y - 85)) < 1 && hip.v < WURLI_SEAT_Y, 'the hip joint 85 mm above the seat');
    const forearm = Math.atan2(P.handR.wrist.v - P.elbowR.v, P.elbowR.u - P.handR.wrist.u);
    assert.ok(Math.abs(forearm) < (10 * Math.PI) / 180, 'the forearm within 10° of level');
    assert.ok(P.elbowR.v < -720 && P.elbowR.v > -800, 'the elbow just above the key tops (720)');
    const tall = P.footL.v - (P.head.c.v - P.head.r * 1.09);
    assert.ok(tall > 1250 && tall < 1340, `seated, the crown ${tall.toFixed(0)} mm up (inside the authored frame, 1330)`);
    const art = readFileSync(new URL('../src/screens/lab/miking/lessons/shared/keys/KeysArt.tsx', import.meta.url), 'utf8');
    assert.doesNotMatch(art, /limb\(\[S\(P\.shoulder/, 'the old hand-built capsule torso is gone');
    assert.match(art, /<PlayerInFront pose=\{side \? WURLI_PLAYER_SIDE : WURLI_PLAYER_TOP\}/);
  });

  it('metal players: a hand held close keeps its elbow at the side (the upper arm hangs; never thrown behind the back)', () => {
    const sh = { u: -380, v: -1445 };
    const r = hangingArm(sh, { u: -300, v: -1200 }, 1);
    assert.ok(Math.abs(r.elbow.u - sh.u) < 20 && r.elbow.v > sh.v + 250, 'the elbow hangs under the shoulder');
    const far = hangingArm(sh, { u: 100, v: -1300 }, 1);
    assert.ok(d(sh, far.elbow) <= METAL_ARM.upper + 0.5 && d(far.elbow, far.wrist) <= METAL_ARM.fore + 0.5, 'a reach keeps both bones at length');
    const src = readFileSync(new URL('../src/screens/lab/miking/lessons/shared/metal/metalArt.tsx', import.meta.url), 'utf8');
    assert.match(src, /<PlayerBehind pose=\{fig\.pose\} \/>/, 'PlayerInk draws the shared figure');
  });

  it('the neck goes INTO the collar (owner on I11b: "shoulder and head merge")', () => {
    const src = readFileSync(new URL('../src/screens/lab/miking/lessons/shared/players/PlayerFigure.tsx', import.meta.url), 'utf8');
    assert.match(src, /const head = intoCollar\(headProfile\(pose\.head\.c/, 'side: the head stops at the shirt');
    assert.match(src, /const head = intoCollar\(headFront\(pose\.head\.c/, 'front: the head stops at the shirt');
    const fr = readFileSync(new URL('../src/screens/lab/miking/lessons/shared/freereed/PlayerProfile.tsx', import.meta.url), 'utf8');
    assert.match(fr, /head: intoCollar\(figureHeadProfile\(/);
    const seating = readFileSync(new URL('../src/screens/lab/miking/lessons/shared/ensemble/SeatingArt.tsx', import.meta.url), 'utf8');
    assert.match(seating, /const prof = Math\.abs\(rightU\) < 0\.5;/, 'ensemble bodies turn with the player (a side-on singer is drawn in profile)');
    assert.doesNotMatch(seating, /addFig\(b, 'skin', capsule\(Q\(0, 30, 880\)/, 'no rod-shaped hand at the thigh');
  });

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
    // (2026-10-15: the shoulder line now sits BELOW the chin — its top 14 mm over `sh` — and the neck ends just inside it.)
    assert.match(seating, /const NECK_V = g - sh - 8;/, 'the neck ends at the collar, not below the shoulder line');
    assert.match(seating, /addFig\(b, 'shirt', ellipse\(P\(o\.u, g - sh \+ 22\), !prof \? 212 : 122, 36\)\)/, 'the shoulder line under the chin');
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
    // The arm (owner 2026-10-10 at 3×: "arm, elbow, wrist and hand need to be
    // more anatomically correct"): ONE outline — the upper arm tapering to a
    // narrower elbow, the forearm swelling in its upper third and tapering to
    // a ≈ 62 mm cuff that stops short of the wrist crease; cut square there.
    const arm = src.match(/export const ARM = \{ root: (\d+), upper: (\d+), elbow: (\d+), belly: (\d+), cuff: (\d+), cuffGap: (\d+) \}/);
    assert.ok(arm, 'the arm widths are one table');
    const [root, upper, elbow, belly, cuff, gap] = arm!.slice(1).map(Number);
    assert.ok(root >= upper && upper > elbow && belly > elbow && belly > cuff, 'deltoid ≥ upper arm > elbow < forearm belly > cuff');
    assert.ok(cuff * 2 >= 58 && cuff * 2 <= 66, `cuff ${cuff * 2} mm across`);
    assert.ok(gap >= 8 && gap <= 25, `the bare wrist shows ${gap} mm below the cuff`);
    const ap = src.slice(src.indexOf('export function armPath('), src.indexOf('function sleeveArm('));
    assert.match(ap, /THE CROOK/, 'the elbow’s inner side is a soft concave fold');
    assert.match(ap, /olecranon/, 'the elbow’s outer side shows its point');
    assert.match(ap, /const ring = \[\.\.\.side\(1\)\.reverse\(\), \.\.\.cap, \.\.\.side\(-1\)\];/, 'one outline: up one side, round the shoulder, down the other; the cuff a straight edge');
    // A SHIRT sleeve (figure pass 2, 2026-10-15): the sleeve's own widths —
    // cloth over the elbow narrows it only a little (the bare arm's pinch in a
    // sleeve read as a mannequin's joint).
    assert.match(src, /function sleeveArm\(root: Pt, e: Pt, w: Pt, cap: SkPath \| null = null\): SkPath \{\s*return union\(cap, armPath\(root, e, w, SLEEVE\)\);/);
    const sl = src.match(/export const SLEEVE = \{ root: ([\d.]+), upper: ([\d.]+), elbow: ([\d.]+), belly: ([\d.]+), cuff: ([\d.]+), cuffGap: (\d+) \}/);
    assert.ok(sl, 'the sleeve widths are one table');
    const [sRoot, sUpper, sElbow, sBelly, sCuff] = sl!.slice(1).map(Number);
    assert.ok(sRoot >= sUpper && sUpper >= sElbow && sBelly >= sElbow && sBelly > sCuff, 'deltoid ≥ upper sleeve ≥ elbow ≤ forearm sleeve > cuff');
    assert.ok(sUpper - sElbow <= 3, `the sleeve narrows only ${((sUpper - sElbow) * 2).toFixed(0)} mm over the elbow (cloth, not a joint)`);
    assert.ok(sCuff * 2 >= 58 && sCuff * 2 <= 66, `sleeve cuff ${sCuff * 2} mm across`);
    // The wrist: narrower than the cuff and the heel of the hand, trimmed square at the cuff (no skin over the sleeve).
    const wr = src.slice(src.indexOf('function wristOf('), src.indexOf('function trimAtCuff('));
    assert.match(wr, /capsule\(M\(0, 0\), L\(18, 0\), half, half \+ 4\.5\)/, 'the heel of the hand is wider than the wrist');
    assert.match(wr, /return trimAtCuff\(col, w, f\);/);
    assert.ok(27.5 * 2 >= 52 && 27.5 * 2 <= 60 && 27.5 * 2 < cuff * 2, 'the wrist (55 mm) is narrower than the cuff');
    assert.doesNotMatch(src, /const arm(L|R|Near|Far) = limb\(/, 'no arm is a bare capsule chain');
    for (const v of ['buildFront(', 'buildAbove(', 'buildSide(']) {
      const body = src.slice(src.indexOf(`function ${v}`), src.indexOf('\n}\n', src.indexOf(`function ${v}`)));
      assert.match(body, /sleeveArm\(/, `${v} draws its arms as sleeves`);
    }
    // The shoulder: a deltoid joined to the arm (front and profile), never a tube's round end over the shoulder line.
    // (Pass 2: the front deltoid lies ALONG the arm — capAlong — so it turns with it and never stands out as a pad.)
    assert.match(src, /const capR = capAlong\(pt\(sR\.u, sR\.v \+ 12\), pose\.elbowR\);/);
    assert.match(src, /sleeveArm\(pt\(sR\.u, sR\.v \+ 12\), pose\.elbowR, pose\.handR\.wrist, capR\)/);
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
    assert.match(bowed, /export type HandHold = \{\s*kind: HandKind;/);
    assert.match(bowed, /arm\('L', s\.shoulderL, s\.elbowL, s\.handL, wL\.wrist, wL\.depth\)/, 'the forearm ends at the hand’s own wrist');
    assert.match(bowed, /const path = armPath\(P2pt\(S2\), P2pt\(E2\), P2pt\(w2\), view === 'top' \? TOP_ARM : SIDE_ARM\);/, 'each bowed/brass arm is ONE outline (a readable elbow), never two capsules');
    // The left hand on the neck (owner 2026-10-10: "upside down"): the palm behind the neck, the wrist straight
    // with the forearm, the fingers arching OVER the board and down onto the strings (side, and the cello/bass
    // from above).
    assert.match(bowed, /return \{ kind: 'wrap', neck: \{ tips, a, b \}, depth: instDepth - 1 \};/, 'the left hand wraps the neck from behind it');
    const fig = read('shared/players/PlayerFigure.tsx');
    const nh = fig.slice(fig.indexOf('export function neckHand('), fig.indexOf('/* ── the parts ── */'));
    assert.match(nh, /const W = pt\(km\.u - d\.u \* 96, km\.v - d\.v \* 96\);/, 'the wrist on the elbow→knuckles line (straight)');
    assert.match(nh, /const front = Skia\.Path\.MakeFromOp\(all, q, PathOp\.Intersect\)/, 'the fingers rise from behind the board');
    assert.match(bowed, /depth: w\.palmOver \? instDepth \+ 0\.4 : instDepth - 0\.5, items: \[\{ path: w\.neck\.behind/, 'the palm is painted behind the instrument');
    assert.match(bowed, /depth: instDepth \+ 0\.5, items: \[\{ path: w\.neck\.front/, 'the fingers over it');
    const brass = read('shared/brass/BrassArt.tsx');
    assert.doesNotMatch(brass, /<Paint opacity=\{0\.62\} \/>/, 'the brass player is opaque');
    assert.match(brass, /R: \{ kind: 'keys', dir: along - 1\.05, at: \[mid\[0\], mid\[1\] \+ 2\] \}/, 'the valve hand’s fingers on the buttons');
    // Low brass: opaque, anatomical hands, the forearm routed clear of the piston cluster.
    const low = read('shared/lowbrass/LowBrassArt.tsx');
    assert.doesNotMatch(low, /opacity=\{playerKeys\.has\(it\.key\) \? 0\.82 : 1\}/);
    assert.doesNotMatch(low, /limb\('hand[LR]', J\.wrist[LR], J\.hand[LR], 30, 36, SKIN\)/, 'no capsule (mitten) hands');
    assert.match(low, /const hs = handShape\(\{ wrist: pt\(wrist\[0\], wrist\[1\]\), dir, kind \}, Math\.atan2\(wrist\[1\] - E\[1\], wrist\[0\] - E\[0\]\)\);/);
    // Low brass arms are the shared anatomical arm (no tube arms, no round elbow knob).
    assert.match(low, /const a = splitArm\(/);
    assert.doesNotMatch(low, /limb\('upper[LR]'/);
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

  // Owner 2026-10-10: the profile BACK read as a hump (kyphosis). A healthy
  // back: nearly straight from the nape to the seat, the shoulder blade a
  // shallow curve — no point of the back more than 35 mm behind the
  // nape → seat chord (PlayerFigure) / behind the shoulders–hips line (the
  // bowed and brass 3-D figure).
  it('profile backs are healthy: no hump behind the shoulders (shared side figure; bowed/brass 3-D figure)', () => {
    const src = readFileSync(new URL('../src/screens/lab/miking/lessons/shared/players/PlayerFigure.tsx', import.meta.url), 'utf8');
    const side = src.slice(src.indexOf('function buildSide('), src.indexOf('const cache = new WeakMap'));
    const list = side.slice(side.indexOf('const torso = smooth('), side.indexOf('0.5,', side.indexOf('const torso = smooth(')));
    const back = [...list.matchAll(/along\((-?[\d.]+), (-?[\d.]+)\)/g)].map((m) => ({ t: Number(m[1]), off: Number(m[2]) })).filter((p) => p.off < 0).sort((a, b) => a.t - b.t);
    assert.ok(back.length >= 5, 'the back is drawn through enough points');
    const lo = back[0];
    const hi = back[back.length - 1];
    for (const p of back) {
      const chord = lo.off + ((p.t - lo.t) / (hi.t - lo.t)) * (hi.off - lo.off);
      const bulge = chord - p.off; // behind the chord (more negative = further back)
      assert.ok(bulge <= 35, `PlayerFigure back at t=${p.t}: ${bulge.toFixed(0)} mm behind the nape→seat line`);
    }
    // The bowed/brass figure: the torso is the hull of discs; read their sizes and forward shifts from the source.
    const bowed = readFileSync(new URL('../src/screens/lab/miking/lessons/shared/bowed/BowedArt.tsx', import.meta.url), 'utf8');
    assert.match(bowed, /circlePts\(q\(add\(s\.chest, scale\(fw, 28\)\)\), 104\)/);
    assert.match(bowed, /scale\(fw, 20\)\)\), 96\)/);
    assert.match(bowed, /circlePts\(q\(add\(s\.hipL, scale\(fw, -8\)\)\), 96\)/);
    const bulgeOf = (pl: { face: { x: number; z: number }; chest: V; pelvis: V; shoulderR: V; shoulderL: V; hipR: V; hipL: V }) => {
      const L = Math.hypot(pl.face.x, pl.face.z) || 1;
      const f = { x: pl.face.x / L, z: pl.face.z / L };
      // In the side view (u = x): how far each disc reaches BEHIND (against the facing's x).
      const sgn = Math.sign(f.x) || 1;
      const behind = (c: V, fwd: number, r: number) => -sgn * (c.x + f.x * fwd) + r;
      const mid = { x: pl.chest.x * 0.4 + pl.pelvis.x * 0.6, y: 0, z: 0 };
      const shoulders = Math.max(behind(pl.shoulderR, 0, 70), behind(pl.shoulderL, 0, 70));
      const hips = Math.max(behind(pl.hipR, -8, 96), behind(pl.hipL, -8, 96));
      const trunk = Math.max(behind(pl.chest, 28, 104), behind(mid, 20, 96));
      return trunk - Math.max(shoulders, hips);
    };
    type V = { x: number; y: number; z: number };
    for (const [n, P] of [['violin', VIOLIN_STANDING], ['cello', CELLO], ['bass', BASS_BOW], ['trumpet', TP], ['trombone', TB]] as const) {
      const b = bulgeOf(P.player as never);
      assert.ok(b <= 35, `${n}: the back bulges ${b.toFixed(0)} mm behind the shoulders/hips`);
    }
  });

  // Owner 2026-10-10 (views from above): shoes point the way the body faces;
  // ears lie close to the skull; the shoulders are a rounded rectangle.
  it('views from above: shoes toe-forward, ears close to the skull, shoulders a rounded rectangle', () => {
    const src = readFileSync(new URL('../src/screens/lab/miking/lessons/shared/players/PlayerFigure.tsx', import.meta.url), 'utf8');
    const above = src.slice(src.indexOf('function buildAbove('), src.indexOf('function buildSide('));
    const shoe = above.slice(above.indexOf('const shoes ='), above.indexOf('});', above.indexOf('const shoes =')));
    const vs = [...shoe.matchAll(/P\((-?\d+), (-?\d+)\)/g)].map((m) => Number(m[2]));
    assert.ok(Math.max(...vs) >= 140 && Math.min(...vs) >= -100, `the toe ${Math.max(...vs)} mm ahead, the heel ${Math.min(...vs)} mm behind the foot point`);
    const head = src.slice(src.indexOf('export function headAbove('), src.indexOf('export function FigureHead('));
    const ears = head.slice(head.indexOf('const ears ='), head.indexOf(';', head.indexOf('const ears =')));
    const xs = [...ears.matchAll(/P\(s \* (\d+),/g)].map((m) => Number(m[1]));
    assert.ok(Math.max(...xs) <= 90, `the ears reach ${Math.max(...xs)} (skull 80): close to the skull`);
    assert.match(above, /pt\(sR\.u - 40, sR\.v \+ 4\), \/\/ the deltoid/);
    // OWNER 2026-10-10: a STANDING person from above shows no feet; a foot is drawn only where it truly shows (a stride, a lean, seated feet past the knees).
    assert.match(above, /shoes: shoes\.filter\(\(_, i\) => dist\(i === 0 \? pose\.footR : pose\.footL, n\) > 260\)/);
    for (const P of [SINGER_TOP]) {
      for (const f of [P.footR, P.footL]) assert.ok(Math.hypot(f.u - P.neck.u, f.v - P.neck.v) <= 260, 'an upright singer’s feet stay hidden from above');
    }
    // Painted UNDER the body from above; a hanging arm is the deltoid's cap, no cut sleeve end.
    assert.match(src, /\.filter\(\(s\) => s\.far \|\| pose\.view === 'above'\)/);
    assert.match(above, /const aboveArm = /);
    // The bowed/brass figure from above: the same rounded outline, slim arms.
    const bowedSrc = readFileSync(new URL('../src/screens/lab/miking/lessons/shared/bowed/BowedArt.tsx', import.meta.url), 'utf8');
    assert.match(bowedSrc, /const path = smoothClosedP2\(pts\);/);
    assert.match(bowedSrc, /const TOP_ARM = \{ root: 46, upper: 42, elbow: 37, belly: 38, cuff: 30, cuffGap: 16 \} as const;/);
    assert.match(above, /pt\(n\.u, n\.v - 112\), \/\/ the upper back/);
  });

  // Owner 2026-10-10: the bow hand HOLDS the bow at the frog (it was open, palm up, beside the stick).
  it('bowed players: the right hand holds the bow at the frog (a grip on the stick, square to it)', () => {
    const bowed = readFileSync(new URL('../src/screens/lab/miking/lessons/shared/bowed/BowedArt.tsx', import.meta.url), 'utf8');
    assert.match(bowed, /hands: \{ L: neckHold\(P, view, instDepth\), R: bowHold\(P, view\) \}/);
    // From above: the pronated hand on top of the stick, the fingers slanting toward the tip.
    assert.match(bowed, /return \{ kind: 'grip', dir, at, over: true \};/);
    // From the side (owner 2026-10-10 at 3×: "a flat paw"): the bow hold — the fingers draped over the
    // stick, the thumb bent under it (painted behind the stick).
    assert.match(bowed, /return \{ kind: 'bow', dir: f \+ 0\.08 \* \(Math\.cos\(f\) >= 0 \? 1 : -1\), at \};/);
    assert.match(bowed, /if \(hs\.thumbBehind && \(w\.kind === 'bow' \|\| w\.frame\)\)/);
    // A wrist never bends past ≈ 70° from the forearm.
    assert.match(bowed, /const lim = wristLimit\(/);
    for (const P of [VIOLIN_STANDING, CELLO, BASS_BOW]) {
      const f = add3(P.bow.frog, sc3(P.bow.up, 29));
      const d = Math.hypot(P.player.handR.x - f.x, P.player.handR.y - f.y, P.player.handR.z - f.z);
      assert.ok(d <= 12, `the hand point sits on the stick at the frog (${d.toFixed(1)} mm)`);
    }
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

/**
 * FIGURE PASS 2 (owner 2026-10-15). The owner approved letting the keep-out
 * zones move with the corrected anatomy; each moved number is pinned here with
 * its reason.
 */
describe('figure pass 2 (owner 2026-10-15): collar, flute hold, gong reach, one-garment shirt', () => {
  it('singers and talkers: the collar sits COLLAR_LIFT above the torso datum — a shorter neck; the shoulders and body stay', () => {
    // "neck slightly long — fix the collar point": 24 mm higher. Before, the
    // profile showed ≈ 85 mm of neck under the jaw (≈ 136 at the nape).
    assert.ok(COLLAR_LIFT >= 18 && COLLAR_LIFT <= 30, `collar lift ${COLLAR_LIFT} mm`);
    assert.equal(SINGER_SIDE.neck.v, SINGER_NECK.y - COLLAR_LIFT, 'the singer’s drawn collar');
    assert.equal(SINGER_COLLAR.y, SINGER_NECK.y - COLLAR_LIFT);
    assert.equal(SEATED_SIDE.neck.v, NECK_B.y - COLLAR_LIFT, 'the seated talker’s drawn collar');
    assert.equal(COLLAR_B.y, NECK_B.y - COLLAR_LIFT);
    // The jaw's underside (headProfile: the chin at 100 head units under the
    // centre) to the collar: a real neck in a shirt, 35–65 mm.
    const chin = SINGER_SIDE.head.c.v + 100 * (SINGER_SIDE.head.r / 110);
    const neck = SINGER_SIDE.neck.v - chin;
    assert.ok(neck >= 35 && neck <= 65, `≈ ${neck.toFixed(0)} mm of neck under the jaw`);
    // The shoulders did not move with it (the arms, the lav marks and the pack hang from the datum).
    assert.equal(SINGER_SIDE.shoulderR.v, SINGER_NECK.y + 58);
    assert.equal(SEATED_SIDE.shoulderR.v, NECK_B.y + 58);
    // Re-derived keep-outs: the neck capsule ends at the collar (24 mm shorter);
    // the torso box's top starts at the collar (24 mm higher; was datum − 10).
    for (const [n, S, c] of [['standing', SINGER_SOLIDS, SINGER_COLLAR], ['seated', SEATED_SOLIDS, COLLAR_B]] as const) {
      assert.ok(S.neck.kind === 'capsule' && S.neck.b.y === c.y, `${n}: the neck solid ends at the collar`);
      assert.ok(S.torso.kind === 'box' && S.torso.min.y === c.y - 10, `${n}: the torso solid starts at the collar`);
    }
  });

  it('A06/A07 flute and piccolo: the left elbow bends ≥ 60° and hangs below the shoulder (was a level band across the chest, ≈ 37°)', () => {
    const d3 = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    const cases = [...Object.entries(FLUTES).map(([k, L]) => [`flute ${k}`, L] as const), ['piccolo standing', PICCOLO_STANDING] as const, ['piccolo seated', PICCOLO_SEATED] as const];
    for (const [n, L] of cases) {
      const sh = L.body.shoulderL;
      const el = L.handL.elbow;
      const wr = L.handL.wrist;
      const up = d3(sh, el);
      const fore = d3(el, wr);
      const reach = d3(sh, wr);
      const interior = (Math.acos((up * up + fore * fore - reach * reach) / (2 * up * fore)) * 180) / Math.PI;
      assert.ok(180 - interior >= 60, `${n}: the left elbow bends ${(180 - interior).toFixed(0)}°`);
      assert.ok(el.y - sh.y >= 80, `${n}: the left elbow hangs ${(el.y - sh.y).toFixed(0)} mm below its shoulder`);
      assert.ok(el.y > wr.y, `${n}: the elbow is below the hand`);
      // The chest turns right (the left shoulder forward), the hands stay on the keys.
      assert.ok(L.body.shoulderL.z > L.body.shoulderR.z + 100, `${n}: the shoulders are turned to the right`);
    }
  });

  it('I12 gong: the mallet hand reaches out to the stroke — never folded back to the shoulder', () => {
    const MH = GONG.malletHead.mm / 2;
    const reach = METAL_ARM.upper + METAL_ARM.fore;
    for (const v of ['tamtam', 'bossed'] as const) {
      const P = playerAt(v);
      const sp = gongStrike(v);
      // In 3-D: the striking (right) shoulder, on the gong's side, to the hand on the handle.
      const sh = { x: P.x, y: -1445, z: P.z + BODY.shoulderHalf };
      const grip = { x: sp.x + MALLET_REACH.out, y: GONG_CY - MALLET_REACH.up, z: sp.z - MALLET_REACH.across };
      const d = Math.hypot(sh.x - grip.x, sh.y - grip.y, sh.z - grip.z);
      assert.ok(d >= 0.75 * reach && d <= 0.97 * reach, `${v}: the hand is ${d.toFixed(0)} mm from the shoulder (arm ${reach})`);
      // From the audience (art.tsx frontArt): the drawn hand well out from the shoulder.
      const FU = (z: number) => -z;
      const gripU = FU(sp.z) + MH * 0.6 + MALLET_REACH.across;
      const pose = metalFrontPose([[gripU - FU(P.z) + 10, GONG_CY - MALLET_REACH.up + 10]]);
      const seen = Math.hypot(pose.handR.wrist.u - pose.shoulderR.u, pose.handR.wrist.v - pose.shoulderR.v);
      assert.ok(seen >= 240, `${v}: seen from the audience the wrist is ${seen.toFixed(0)} mm from the shoulder`);
      assert.deepEqual(anatomy(pose), [], `${v}: front pose`);
      // The player stands clear of the frame's feet (±300 mm along x).
      assert.ok(P.x - 160 > GONG.feet.mm / 2 + GONG.post.mm, `${v}: the player's box is clear of the frame's feet`);
    }
  });

  it('one shirt (owner: "shoulder transitions from shirt sleeves to the shirt body look very unnatural"): sleeves share the garment’s light and melt into the shoulder', () => {
    const src = readFileSync(new URL('../src/screens/lab/miking/lessons/shared/players/PlayerFigure.tsx', import.meta.url), 'utf8');
    for (const v of ['buildFront(', 'buildAbove(', 'buildSide(']) {
      const body = src.slice(src.indexOf(`function ${v}`), src.indexOf('\n}\n', src.indexOf(`function ${v}`)));
      assert.match(body, /const garment = garmentBox\(/, `${v} shades the shirt as one garment`);
      assert.match(body, /tone: 'shirt', box: garment/, `${v}: the shirt body takes the garment's light`);
      assert.match(body, /soft: atShoulder\(/, `${v}: a sleeve's edge over the shoulder is a soft fold`);
    }
    // FigureMass honours the garment's box and the soft region.
    assert.match(src, /const b = box \?\? own;/);
    // A nearly straight arm's crook never loops into a notch.
    assert.match(src, /if \(bend < 0\.25 \|\| Math\.abs\(back\) > Math\.min\(L1, L2\) \* 0\.42\) \{/);
  });
});
