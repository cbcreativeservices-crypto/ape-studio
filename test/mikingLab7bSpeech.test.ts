/**
 * Miking Lab 7 part 2, group 1 — speech in sport (B09 commentators, B10
 * sideline and post-event interviews, B11 athletes, coaches and officials)
 * and the shared pieces it built in lessons/shared/broadcast/: the sport
 * mics (headset boom, lip ribbon, flagged handhelds), the HELD arm the
 * engine draws, the feeds state (cough, talkback, mix-minus, the officials'
 * private circuit that can never reach the air), the booth's spill readout,
 * the handoff, the standing talker and frame T. Real relationships, not
 * re-runs of the implementation.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { LESSONS, labMeta, lessonsOf } from '../src/screens/lab/miking/data/registry.ts';
import { validateLesson, micBodyOf } from '../src/screens/lab/miking/engine/model/validate.ts';
import { assembly, checkAssembly, compileScene } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { inZone } from '../src/screens/lab/miking/engine/geometry/zones.ts';
import { sdf } from '../src/screens/lab/miking/engine/geometry/sdf.ts';
import { heldElbowOf, heldFist } from '../src/screens/lab/miking/engine/geometry/arm.ts';
import { startingSetups } from '../src/screens/lab/miking/engine/setups.ts';
import { gain } from '../src/screens/lab/miking/engine/physics/polar.ts';
import { SPORT_SPEECH_MIC_TYPES, HELD_ARM, HEADSET_BOOM, LIP_RIBBON } from '../src/screens/lab/miking/lessons/shared/broadcast/sportMics.ts';
import { BROADCAST_MIC_SLOTS } from '../src/screens/lab/miking/lessons/shared/broadcast/broadcastMics.ts';
import { FEED_HOME, ON_AIR, PRIVATE_REFUSED, canRoute, feedPlan, feedProblems, type FeedSpec } from '../src/screens/lab/miking/lessons/shared/broadcast/feeds.ts';
import { reaches } from '../src/screens/lab/miking/lessons/shared/broadcast/routing.ts';
import { BOOTH, boothSpill, partnerAt, partnerMouth } from '../src/screens/lab/miking/lessons/shared/broadcast/boothPlan.ts';
import { HANDOFF_EARLY, HANDOFF_LATE, HANDOFF_ON_TIME, between, betweenDrop, clippedQuestion, handoffOk, levelDb, lostSyllables } from '../src/screens/lab/miking/lessons/shared/broadcast/handoff.ts';
import { SHOULDER_R, TORSO, bodyWornChain, chestVsHeadset, keepOutsOf, standPoses } from '../src/screens/lab/miking/lessons/shared/broadcast/standing.ts';
import { turnHead } from '../src/screens/lab/miking/lessons/shared/broadcast/talkerPose.ts';
import { SPORTS_SAFETY } from '../src/screens/lab/miking/lessons/shared/sports/safety.ts';
import { learnerStrings } from './_mikingItemRules.ts';
import { ANALYST, CALLER } from '../src/screens/lab/miking/lessons/b09Commentators/geometry.ts';
import { GUEST, REPORTER, SHOULDER_REP, TOUCHLINE_X } from '../src/screens/lab/miking/lessons/b10Sideline/geometry.ts';

const v3 = (x: number, y: number, z: number) => ({ x, y, z });
const dist = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const LIP = v3(0, 0, 0);
const IDS = ['B09', 'B10', 'B11'] as const;

describe('the sport mics and the held arm', () => {
  it('the group’s types are in MIC_TYPES; no Lab 7a slot id is taken', () => {
    for (const id of Object.keys(SPORT_SPEECH_MIC_TYPES)) assert.ok(MIC_TYPES[id], id);
    for (const id of [...BROADCAST_MIC_SLOTS.G2, ...BROADCAST_MIC_SLOTS.G3]) assert.ok(!(id in SPORT_SPEECH_MIC_TYPES), id);
  });
  it('the headset is a cardioid dynamic; the lip ribbon a figure-8 ribbon; the flagged handhelds omni, cardioid, supercardioid', () => {
    assert.equal(MIC_TYPES.bcHeadsetBoom.transducer, 'dynamic');
    assert.deepEqual(MIC_TYPES.bcHeadsetBoom.patterns.map((p) => p.id), ['cardioid']);
    assert.deepEqual(MIC_TYPES.bcLipRibbon.patterns.map((p) => p.id), ['figure8']);
    assert.equal(MIC_TYPES.bcLipRibbon.transducer, 'ribbon');
    assert.deepEqual(['bcFlagOmni', 'bcFlagCard', 'bcFlagSuper'].map((id) => MIC_TYPES[id].patterns[0].id), ['omni', 'cardioid', 'supercardioid']);
    assert.equal(HEADSET_BOOM.pivotDeg.value, 155);
    assert.equal(HEADSET_BOOM.adjustMm.value, 89);
  });
  it('the lip guard depth is an UNKNOWN drawing default (D7-7) and never a learner readout', () => {
    assert.equal(LIP_RIBBON.guardDepth.placeholder, true);
    assert.equal(LIP_RIBBON.guardDepth.prov.kind, 'unknown');
    const s = learnerStrings(lessonById('B09')!).join(' ');
    assert.doesNotMatch(s, /\b60 mm\b|\b6 cm\b behind/);
  });
  it('a held mic’s body carries the held arm: its reach is the arm’s', () => {
    const b = micBodyOf(MIC_TYPES.bcFlagOmni);
    assert.equal(b.armStyle, 'held');
    assert.equal(b.reach, HELD_ARM.reach.mm);
    assert.deepEqual(b.elbow, { a: HELD_ARM.upper.mm, b: HELD_ARM.fore.mm });
    assert.ok(HELD_ARM.reach.mm >= HELD_ARM.upper.mm + HELD_ARM.fore.mm, 'the reach covers the arm and the grip');
  });
  it('the held elbow keeps both segment lengths and hangs BELOW the shoulder–fist line; stretched, it lies on the line', () => {
    const sh = v3(-110, 176, -470);
    const fist = v3(250, 120, -20);
    const e = heldElbowOf(sh, fist, 300, 290);
    assert.ok(Math.abs(dist(sh, e) - 300) < 1e-6 && Math.abs(dist(e, fist) - 290) < 1e-6);
    assert.ok(e.y > (sh.y + fist.y) / 2, 'the elbow hangs (y down is positive)');
    const far = heldElbowOf(v3(0, 0, 0), v3(2000, 0, 0), 300, 290);
    assert.ok(Math.abs(far.y) < 1e-9 && far.x > 0 && far.x < 2000);
    const f = heldFist(v3(0, 0, 0), v3(1, 0, 0));
    assert.deepEqual(f, v3(45, 0, 0));
  });
});

describe('feeds: cough, talkback, the return, the private circuit (feeds.ts)', () => {
  const spec: FeedSpec = {
    commentators: [
      { id: 'cA', label: 'A', short: 'A' },
      { id: 'cB', label: 'B', short: 'B' },
    ],
    crowd: { id: 'crowd', label: 'crowd', short: 'C' },
    producer: { id: 'prod', label: 'producer', short: 'P' },
    official: { id: 'off', label: 'official', short: 'O' },
    dests: ['pa', 'program', 'recorder', 'phones', 'ifb', 'talkback'],
  };
  it('on air the commentary mic reaches the program and the recorder; cough cuts it from everything; talkback sends it to the producer only', () => {
    const on = feedPlan(spec, FEED_HOME);
    assert.ok(reaches(on, 'cA', 'program') && reaches(on, 'cA', 'recorder'));
    const cough = feedPlan(spec, { ...FEED_HOME, key: 'cough' });
    assert.deepEqual(cough.sends.cA, []);
    const tb = feedPlan(spec, { ...FEED_HOME, key: 'talkback' });
    assert.deepEqual(tb.sends.cA, ['talkback']);
    assert.ok(feedProblems(spec, { ...FEED_HOME, key: 'talkback' }).some((p) => p.code === 'offAir'));
    assert.ok(reaches(cough, 'cB', 'program'), 'the key acts on one mic only');
  });
  it('mix-minus keeps the commentators’ own voices out of their return; the whole program brings them back late', () => {
    const mm = feedPlan(spec, FEED_HOME);
    for (const c of ['cA', 'cB']) assert.ok(!reaches(mm, c, 'ifb'), c);
    assert.ok(reaches(mm, 'prod', 'ifb'), 'the producer’s cues interrupt the return');
    assert.ok(!reaches(mm, 'prod', 'program'), 'talkback never on air');
    assert.deepEqual(feedProblems(spec, FEED_HOME), []);
    const full = feedProblems(spec, { ...FEED_HOME, ret: 'full' });
    assert.ok(full.some((p) => p.code === 'lateSelf'));
  });
  it('the crowd bed is its own channel; without it the program misses it', () => {
    assert.ok(reaches(feedPlan(spec, FEED_HOME), 'crowd', 'program'));
    assert.ok(feedProblems(spec, { ...FEED_HOME, crowd: 'none' }).some((p) => p.code === 'missing'));
  });
  it('the official’s mic: off reaches nothing, PA reaches the PA only, PA + program both', () => {
    assert.deepEqual(feedPlan(spec, { ...FEED_HOME, official: 'off' }).sends.off, []);
    assert.deepEqual(feedPlan(spec, { ...FEED_HOME, official: 'pa' }).sends.off, ['pa']);
    assert.ok(reaches(feedPlan(spec, { ...FEED_HOME, official: 'paProgram' }), 'off', 'program'));
  });
  it('the officials’ private circuit can NEVER be routed on air, in any state: it is not even a source of the mixer', () => {
    for (const key of ['onAir', 'cough', 'talkback'] as const)
      for (const ret of ['mixMinus', 'full'] as const)
        for (const crowd of ['own', 'none'] as const)
          for (const official of ['off', 'pa', 'paProgram'] as const)
            for (const priv of ['closed', 'tryAir'] as const) {
              const plan = feedPlan(spec, { key, ret, crowd, official, priv });
              assert.ok(!plan.sources.some((s) => s.id === 'private'), 'the private circuit never enters the mixer');
            }
    for (const d of ON_AIR) assert.equal(canRoute('private', d, ['private']), false, d);
    assert.equal(canRoute('cA', 'program', ['private']), true);
    assert.match(PRIVATE_REFUSED, /Refused/);
  });
});

describe('the booth plan and the partner’s spill (boothPlan.ts)', () => {
  it('the proposal’s example: own 25 mm, partner 900 mm → 31 dB by distance alone', () => {
    const s = boothSpill(v3(25, 0, 0), v3(-1, 0, 0), LIP, v3(0, 0, 900), 'omni');
    assert.ok(Math.abs(s.own - 25) < 1e-9);
    assert.ok(Math.abs(s.distDb - 20 * Math.log10(s.partner / 25)) < 1e-9);
    assert.ok(Math.abs(s.distDb - 31.1) < 0.2, s.distDb.toFixed(2));
    assert.ok(Math.abs(s.patternDb ?? 99) < 1e-9, 'an omni adds nothing');
  });
  it('a figure-8 lip mic on the mouth’s axis has the partner beside it near its side null', () => {
    const s = boothSpill(v3(16, 0, 0), v3(-1, 0, 0), LIP, v3(0, 0, BOOTH.seatGap.mm), 'figure8');
    assert.ok(s.offAxis > 85 && s.offAxis < 95);
    assert.ok(s.patternDb == null || s.patternDb > 20);
  });
  it('a headset boom on the partner’s side puts the partner behind the capsule: more rejection than the boom on the far side', () => {
    const near = v3(14, 0, 34);
    const far = v3(14, 0, -34);
    const unit = (p: { x: number; y: number; z: number }) => {
      const l = Math.hypot(p.x, p.y, p.z);
      return v3(-p.x / l, -p.y / l, -p.z / l);
    };
    const pm = partnerMouth(partnerAt(900), 0);
    const a = boothSpill(near, unit(near), LIP, pm, 'cardioid');
    const b = boothSpill(far, unit(far), LIP, pm, 'cardioid');
    assert.ok((a.totalDb ?? 999) > (b.totalDb ?? 0), `${a.totalDb} vs ${b.totalDb}`);
  });
  it('a partner turned toward you comes closer to your mic', () => {
    const p = v3(14, 0, 34);
    const ahead = dist(p, partnerMouth(partnerAt(900), 0));
    const turned = dist(p, partnerMouth(partnerAt(900), -45));
    assert.ok(turned < ahead);
  });
  it('the B09 analyst sits the booth’s gap to the commentator’s right, both facing the field', () => {
    assert.deepEqual(CALLER.lip, LIP);
    assert.equal(ANALYST.lip.z, BOOTH.seatGap.mm);
    assert.equal(ANALYST.facing, 1);
  });
});

describe('the handoff (handoff.ts)', () => {
  it('a mic at the speaker is louder for them than for the other mouth; one left between hears the speaker lower than a close mic', () => {
    const r = REPORTER.lip;
    const g = GUEST.lip;
    const close = v3(94, 34, 0);
    assert.ok(levelDb(close, g, r) > 10);
    const mid = between(r, g);
    assert.ok(Math.abs(mid.z - (r.z + g.z) / 2) < 1e-9);
    const drop = betweenDrop(dist(close, g), dist(mid, g));
    assert.ok(drop > 6, drop.toFixed(1));
    assert.ok(Math.abs(drop - 20 * Math.log10(dist(mid, g) / dist(close, g))) < 1e-9);
  });
  it('on time the mic arrives before the answer; late it costs the first words; early it clips the question', () => {
    assert.equal(handoffOk(HANDOFF_ON_TIME), true);
    assert.equal(lostSyllables(HANDOFF_ON_TIME), 0);
    assert.equal(handoffOk(HANDOFF_LATE), false);
    assert.ok(lostSyllables(HANDOFF_LATE) > 0.5);
    assert.equal(handoffOk(HANDOFF_EARLY), false);
    assert.ok(clippedQuestion(HANDOFF_EARLY) > 0);
  });
});

describe('the standing talker and frame T (standing.ts)', () => {
  it('the reporter’s held arm hangs from their right shoulder, toward the guest', () => {
    assert.ok(Math.abs(SHOULDER_REP.z - (REPORTER.lip.z + SHOULDER_R.z)) < 1e-9);
    assert.ok(SHOULDER_REP.z > REPORTER.lip.z, 'the right shoulder is on the guest’s side');
    const poses = standPoses(REPORTER, { arm: 'R' });
    assert.deepEqual(poses.side.elbowR, poses.side.shoulderR, 'the folded arm leaves the engine to draw it');
  });
  it('the breastbone sits below the lips on the chest’s front; the pack at the small of the back; the antenna hangs straight down', () => {
    assert.ok(TORSO.sternum.y > 150 && TORSO.sternum.y < 260);
    assert.ok(TORSO.smallOfBack.x < TORSO.sternum.x - 200);
    const c = bodyWornChain('chest');
    assert.deepEqual(c.mic, TORSO.sternum);
    assert.ok(c.antenna[1].y > c.antenna[0].y + 100);
    assert.ok(Math.abs(c.antenna[1].x - c.antenna[0].x) < 10, 'straight, not coiled');
  });
  it('the keep-outs are drawn on an athlete only, and the approved chest place is clear of every one of them', () => {
    assert.deepEqual(keepOutsOf('coach'), []);
    const ko = keepOutsOf('athlete');
    assert.ok(ko.length >= 3);
    for (const k of ko) assert.ok(sdf(k.shape, TORSO.sternum) > 0, k.id);
  });
  it('turning the head moves the mouth away from a chest mic; a headset keeps its distance', () => {
    const c0 = chestVsHeadset(0, 0, turnHead);
    assert.ok(Math.abs(c0.chest.db) < 1e-9);
    const c45 = chestVsHeadset(45, 0, turnHead);
    assert.ok(c45.chest.d > c45.chest.d0 && c45.chest.db > 0);
    assert.equal(c45.headset.db, 0);
  });
});

describe('Lab 7 part 2 · G1 lessons: B09, B10, B11', () => {
  it('ready lessons of the broadcast lab, in one contiguous block after the part 1 block', () => {
    const ids = lessonsOf('broadcast').map((l) => l.id);
    for (const id of IDS) assert.ok(ids.includes(id), id);
    const at = LESSONS.findIndex((l) => l.id === 'B09');
    assert.deepEqual(LESSONS.slice(at, at + 3).map((l) => l.id), [...IDS]);
    assert.match(labMeta('broadcast')!.blurb, /commentators/);
  });
  for (const id of IDS) {
    const l = lessonById(id)!;
    const variantsOf = (z: (typeof l.zones)[number]) => (z.requires?.variant ? [z.requires.variant] : z.requires?.variants ?? l.model.variants.map((v) => v.id));
    it(`${id}: validates; every start is inside its zone and clear in every variant it is offered in; every arm, boom and hand reaches`, () => {
      assert.deepEqual(validateLesson(l, MIC_TYPES), []);
      for (const z of l.zones) {
        const t = MIC_TYPES[z.requires!.micTypeIds![0]];
        for (const v of variantsOf(z)) {
          const scene = compileScene(l.model, v);
          assert.equal(checkAssembly(scene, z.start, micBodyOf(t)), null, `${z.id} in ${v}`);
          assert.ok(inZone(z, { scene, surfaces: l.model.surfaces, lines: l.model.lines, variant: v, micTypeId: t.id, mount: t.mount }, z.start), `${z.id} in ${v}`);
          if (t.mount === 'clip') {
            const arm = assembly(scene, z.start, micBodyOf(t)).find((q) => q.piece === 'arm');
            assert.ok(arm, `${z.id}: no grip in ${v}`);
            assert.ok(dist(arm!.a, arm!.b) <= t.clip!.reach.mm, `${z.id}: ${dist(arm!.a, arm!.b).toFixed(0)} mm`);
          }
        }
      }
    });
    it(`${id}: each zone’s centre (mid distance along its start’s line) is clear of the people and the furniture`, () => {
      for (const z of l.zones) {
        const t = MIC_TYPES[z.requires!.micTypeIds![0]];
        const surf = l.model.surfaces.find((q) => q.id === z.refSurface)!;
        const mid = (z.distance.min + z.distance.max) / 2;
        const d = v3(z.start.p.x - surf.point.x, z.start.p.y - surf.point.y, z.start.p.z - surf.point.z);
        const k = mid / Math.hypot(d.x, d.y, d.z);
        const p = v3(surf.point.x + d.x * k, surf.point.y + d.y * k, surf.point.z + d.z * k);
        for (const v of variantsOf(z)) assert.equal(checkAssembly(compileScene(l.model, v), { p, az: z.start.az, el: z.start.el }, micBodyOf(t)), null, `${z.id} centre in ${v}`);
      }
    });
    it(`${id}: the starting-points voice, no institutional words, no brand, no link to other lessons, 3:1 never a pass gate`, () => {
      const strings = learnerStrings(l);
      assert.ok(strings.some((s) => /After our research, here is where we suggest you begin/.test(s)));
      assert.ok(strings.some((s) => /Experimentation is encouraged/.test(s)));
      for (const s of strings) assert.doesNotMatch(s, /\b(student|classroom|instructor|Academy|IFAB|FIFA|NFL|Shure|Sennheiser|Coles|SM2|4104|HMD)\b/i);
      for (const s of strings.filter((q) => q !== l.id)) assert.doesNotMatch(s, /\b(B0\d|B1\d|F\d\d)\b/);
      for (const t of l.setupTasks) for (const r of t.reasons) if (/3:1/.test(r.label)) assert.equal(r.role, 'wrong');
    });
  }
  it('the setups by variant: one mic, the pairs, the close and the farther starts (B11 has no two-mic setup)', () => {
    const roles = (id: string, v: string) => startingSetups(lessonById(id)!, v, MIC_TYPES).map((s) => `${s.role}:${s.mics.map((m) => m.zoneId).join('+')}`);
    assert.deepEqual(roles('B09', 'booth'), ['one:b9.headset', 'pair:b9.headset+b9.analyst']);
    assert.deepEqual(roles('B09', 'open'), ['one:b9.headset', 'close:b9.lip']);
    assert.deepEqual(roles('B09', 'studio'), ['one:b9.headset', 'distant:b9.arm']);
    assert.deepEqual(roles('B10', 'sideline'), ['one:b10.hand', 'close:b10.headset']);
    assert.deepEqual(roles('B10', 'twoMics'), ['one:b10.hand', 'pair:b10.hand+b10.reporter']);
    assert.deepEqual(roles('B10', 'postEvent'), ['one:b10.lav', 'distant:b10.boom']);
    assert.deepEqual(roles('B11', 'coach'), ['one:b11.lav', 'close:b11.headset', 'distant:b11.perimeter']);
    for (const v of ['coach', 'official', 'athlete']) assert.ok(!roles('B11', v).some((r) => r.startsWith('pair')), v);
  });
  it('B09: the headset capsule sits BESIDE the mouth (outside corner, not in front); the lip guard on the axis, close', () => {
    const l = lessonById('B09')!;
    const hs = l.zones.find((z) => z.id === 'b9.headset')!;
    assert.ok((hs.cone?.min ?? 0) >= 45, 'off the mouth’s axis');
    assert.ok(Math.abs(hs.start.p.z) > hs.start.p.x, 'more to the side than in front');
    const lip = l.zones.find((z) => z.id === 'b9.lip')!;
    assert.ok(lip.distance.max <= 30 && lip.requires?.variant === 'open');
  });
  it('B10: the handheld starts under 15 cm from the speaking mouth, held from the reporter’s shoulder at the sideline', () => {
    const l = lessonById('B10')!;
    const z = l.zones.find((q) => q.id === 'b10.hand')!;
    assert.ok(z.distance.max <= 150);
    const arm = assembly(compileScene(l.model, 'sideline'), z.start, micBodyOf(MIC_TYPES.bcFlagOmni)).find((q) => q.piece === 'arm')!;
    assert.ok(dist(arm.b, SHOULDER_REP) < 1e-6, 'the reporter holds it');
    assert.ok(TOUCHLINE_X < -1000, 'the play area is behind the talkers, well clear of every zone');
    for (const q of l.zones) assert.ok(q.start.p.x > TOUCHLINE_X, q.id);
  });
  it('B10 and B11: the safety lines are the one sports card, exact — never into play, approval first, lightning with no dugout', () => {
    const s10 = learnerStrings(lessonById('B10')!).join(' ');
    assert.ok(s10.includes(SPORTS_SAFETY.lightning.text) && s10.includes(SPORTS_SAFETY.play.text) && s10.includes(SPORTS_SAFETY.approval.text));
    assert.match(s10, /Dugouts and open rain shelters are not safe/);
    const s11 = learnerStrings(lessonById('B11')!).join(' ');
    assert.ok(s11.includes(SPORTS_SAFETY.protective.text));
    assert.match(s11, /Never send crew into play/);
    assert.match(s11, /consenting adult/);
    assert.match(s11, /private circuit/);
  });
  it('B11: a polar check — the official’s cardioid headset hears the PA high in front more than a supercardioid’s rear null would', () => {
    // A sanity relation of the ideal patterns the context page uses.
    assert.ok(gain('supercardioid', 125) < 0.01 && gain('cardioid', 180) < 1e-9);
  });
});
