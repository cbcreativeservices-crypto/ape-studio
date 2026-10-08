/**
 * Miking Lab 7 group 3 — field and audience (B03 Field Reporters and Handheld
 * Interviews, B08 Broadcast Audience and Event Space) and their shared kit
 * (lessons/shared/broadcast: fieldInterview, reporterWind, venue; the repOmni
 * type). Real relationships, not re-runs of the implementation: the shared
 * place favours neither mouth; a directional mic pointed between two people
 * serves neither; a raised crowd mic evens the seats; two zone mics are not a
 * pair while a coincident pair has no delay; crowd mics in the PA are a
 * routing fault.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { LESSONS } from '../src/screens/lab/miking/data/registry.ts';
import { validateLesson, micBodyOf } from '../src/screens/lab/miking/engine/model/validate.ts';
import { assembly, compileScene } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { startingSetups } from '../src/screens/lab/miking/engine/setups.ts';
import { copyOf } from '../src/screens/lab/miking/engine/model/copy.ts';
import { arrivalAngle, nearNull } from '../src/screens/lab/miking/engine/physics/polar.ts';
import { BROADCAST_MIC_SLOTS, BROADCAST_MIC_TYPES } from '../src/screens/lab/miking/lessons/shared/broadcast/broadcastMics.ts';
import { HANDOFF_PATH, aimFrom, interviewReading, noiseAt, pathKeys, pathPoint, sharedCostDb } from '../src/screens/lab/miking/lessons/shared/broadcast/fieldInterview.ts';
import { REPORTER_COVERS, REPORTER_SITES, coverVerdict } from '../src/screens/lab/miking/lessons/shared/broadcast/reporterWind.ts';
import { DOMINATE_DB, EVENT_SCENE, FACE_H, STUDIO, STUDIO_SCENE, nearSeatBias, pairReading, paAngle } from '../src/screens/lab/miking/lessons/shared/broadcast/venue.ts';
import { routeProblems, withSends, type RoutingPlan } from '../src/screens/lab/miking/lessons/shared/broadcast/routing.ts';
import { degOf, offAxisDeg, refusedAt } from '../src/screens/lab/miking/lessons/shared/sports/venuePlan.ts';
import { learnerStrings } from './_mikingItemRules.ts';
import { LAV_BAND } from '../src/screens/lab/miking/lessons/shared/broadcast/bodyWorn.ts';
import { PAIR, REPORTER, SPACING } from '../src/screens/lab/miking/lessons/b03FieldReporter/geometry.ts';
import { B03_LIGHTNING } from '../src/screens/lab/miking/lessons/b03FieldReporter/copy.ts';
import { B08_PLACE, B08_SETUPS } from '../src/screens/lab/miking/lessons/b08Audience/model.ts';
import { B08_ROWS } from '../src/screens/lab/miking/lessons/b08Audience/rows.ts';

const v3 = (x: number, y: number, z: number) => ({ x, y, z });
const dist = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const B03 = lessonById('B03')!;
const B08 = lessonById('B08')!;

describe('Lab 7 group 3 — the reporter’s omni', () => {
  it('repOmni fills group 3’s slot: held in the hand, omni, defined once', () => {
    for (const id of BROADCAST_MIC_SLOTS.G3) assert.ok(id in BROADCAST_MIC_TYPES && MIC_TYPES[id], id);
    const t = MIC_TYPES.repOmni;
    assert.equal(t.patterns[0].id, 'omni');
    assert.equal(t.mount, 'clip');
    assert.equal(t.clip?.style, 'held');
    assert.equal(micBodyOf(t).armStyle, 'held');
    // a longer handle than the flagged stage handheld it is compared with
    assert.ok(t.body.length.mm > MIC_TYPES.bcFlagCard.body.length.mm);
  });
});

describe('Lab 7 group 3 — the handoff path (fieldInterview)', () => {
  const k = pathKeys(PAIR);
  it('the shared place is midway between the mouths, at chest height below them', () => {
    const mid = pathPoint(PAIR, 0.5);
    assert.ok(Math.abs(dist(mid, PAIR.a) - dist(mid, PAIR.b)) < 1);
    assert.ok(Math.abs(mid.y - HANDOFF_PATH.chestDrop) < 1);
    assert.deepEqual(mid, k.mid);
  });
  it('the close ends sit endGap from their mouth, a little below the breath', () => {
    const a = pathPoint(PAIR, 0);
    const b = pathPoint(PAIR, 1);
    assert.ok(Math.abs(Math.hypot(a.x - PAIR.a.x, a.z - PAIR.a.z) - HANDOFF_PATH.endGap) < 1);
    assert.ok(Math.abs(Math.hypot(b.x - PAIR.b.x, b.z - PAIR.b.z) - HANDOFF_PATH.endGap) < 1);
    assert.ok(a.y > 0 && b.y > 0);
  });
  it('shared, an omni favours neither voice; moved to the guest, the guest leads by distance', () => {
    const noise = noiseAt(PAIR, 0);
    const mid = pathPoint(PAIR, 0.5);
    const r0 = interviewReading(PAIR, mid, aimFrom(PAIR, mid, 'b', 'between'), 'omni', 'b', noise);
    assert.ok(Math.abs(r0.totalDb) < 0.5, `${r0.totalDb}`);
    assert.equal(r0.noiseDb, 0);
    const end = pathPoint(PAIR, 1);
    const r1 = interviewReading(PAIR, end, aimFrom(PAIR, end, 'b', 'speaker'), 'omni', 'b', noise);
    assert.ok(r1.distDb > 10, `${r1.distDb}`);
    // the shared place costs the guest's voice the same dB by distance
    assert.ok(Math.abs(sharedCostDb(PAIR, 'b') - (20 * Math.log10(r0.rSpeaker / r1.rSpeaker))) < 0.5);
  });
  it('a cardioid pointed between two people serves neither; at the speaker it favours them', () => {
    const mid = pathPoint(PAIR, 0.5);
    const noise = noiseAt(PAIR, 0);
    const btw = interviewReading(PAIR, mid, aimFrom(PAIR, mid, 'b', 'between'), 'cardioid', 'b', noise);
    assert.ok(Math.abs(btw.patternDb) < 0.5);
    assert.ok(btw.offSpeaker > 30 && btw.offOther > 30);
    const at = interviewReading(PAIR, mid, aimFrom(PAIR, mid, 'b', 'speaker'), 'cardioid', 'b', noise);
    assert.ok(at.patternDb > 1, `${at.patternDb}`);
  });
  it('a loud source behind the directional mic is taken down by its pattern; an omni hears it all round', () => {
    const end = pathPoint(PAIR, 1);
    const aim = aimFrom(PAIR, end, 'b', 'speaker');
    // the guest faces +x: a source behind the reporter is behind the mic held at the guest's mouth
    const behindMic = interviewReading(PAIR, end, aim, 'cardioid', 'b', noiseAt(PAIR, 180));
    assert.ok(behindMic.noiseDb < -6, `${behindMic.noiseDb}`);
    const omni = interviewReading(PAIR, end, aim, 'omni', 'b', noiseAt(PAIR, 180));
    assert.equal(omni.noiseDb, 0);
  });
});

describe('Lab 7 group 3 — wind on the handheld (words, never a level)', () => {
  it('each layer added never makes the capsule windier; exposed wind is never “solved”', () => {
    for (const s of REPORTER_SITES) {
      const marks = REPORTER_COVERS.map((c) => coverVerdict(s.id, c.id).marks);
      for (let i = 1; i < marks.length; i++) assert.ok(marks[i] <= marks[i - 1], s.id);
    }
    assert.equal(coverVerdict('exposed', 'fur').enough, false);
    assert.equal(coverVerdict('sheltered', 'foam').enough, true);
  });
  it('the words promise no immunity and print no level', () => {
    for (const s of REPORTER_SITES) for (const c of REPORTER_COVERS) {
      const w = coverVerdict(s.id, c.id).words;
      assert.doesNotMatch(w, /\bdB\b|\bimmune\b|\bimpervious\b|\bm\/s\b|\bmph\b/i);
    }
  });
});

describe('B03 Field Reporters and Handheld Interviews', () => {
  const zone = (id: string) => B03.zones.find((z) => z.id === id)!;
  it('validates', () => assert.deepEqual(validateLesson(B03, MIC_TYPES), []));
  it('is in the broadcast lab, ready', () => assert.equal(LESSONS.find((r) => r.id === 'B03')?.labId, 'broadcast'));
  it('the shared omni starts midway between the two mouths, below them', () => {
    const z = zone('b3.shared');
    const p = z.start.p;
    assert.ok(Math.abs(dist(p, PAIR.a) - dist(p, PAIR.b)) / dist(p, PAIR.b) < 0.05);
    assert.ok(p.y > 150, 'below the mouths (chest height)');
    assert.ok(SPACING >= 600 && SPACING <= 900, 'the proposal’s 600–900 mm spacing');
  });
  it('the directional handheld starts under 15 cm from the speaking mouth; the reporter’s own from the reporter', () => {
    assert.ok(dist(zone('b3.handoffDir').start.p, v3(0, 0, 0)) <= 150);
    assert.ok(dist(zone('b3.repOwn').start.p, REPORTER.lip) <= 150);
    const lav = dist(zone('b3.guestLav').start.p, v3(0, 0, 0));
    assert.ok(lav >= LAV_BAND.min && lav <= LAV_BAND.max);
  });
  it('every held mic is within the arm’s reach of the reporter’s shoulder', () => {
    for (const z of B03.zones) {
      const t = MIC_TYPES[z.requires?.micTypeIds?.[0] ?? ''];
      if (t?.clip?.style !== 'held') continue;
      for (const v of z.requires?.variants ?? (z.requires?.variant ? [z.requires.variant] : ['street'])) {
        const arm = assembly(compileScene(B03.model, v), z.start, micBodyOf(t)).find((q) => q.piece === 'arm');
        assert.ok(arm, `${z.id}: no grip`);
        assert.ok(dist(arm!.a, arm!.b) <= t.clip!.reach.mm, `${z.id}: ${dist(arm!.a, arm!.b).toFixed(0)} mm`);
      }
    }
  });
  it('the starting setups: ONE MIC shared, CLOSE the directional handheld, no FARTHER BACK; TWO MICS a mic each', () => {
    const st = startingSetups(B03, 'street', MIC_TYPES);
    assert.equal(st.find((s) => s.role === 'one')?.zones[0].id, 'b3.shared');
    assert.equal(st.find((s) => s.role === 'close')?.zones[0].id, 'b3.handoffDir');
    assert.ok(!st.some((s) => s.role === 'distant'));
    const two = startingSetups(B03, 'twoMics', MIC_TYPES).find((s) => s.role === 'pair');
    assert.deepEqual(two?.zones.map((z) => z.id), ['b3.repOwn', 'b3.guestLav']);
  });
  it('the live-event exercise can put the loudspeaker in a null by aim or pattern', () => {
    const X = copyOf(B03).context;
    const z = B03.zones.find((q) => q.id === X.zone)!;
    const w = B03.live.wedges.find((q) => q.id === X.target)!;
    const src = v3(w.p.x, w.p.y - w.lift, w.p.z);
    let ok = false;
    for (const p of X.patterns) for (let da = -X.azMax; da <= X.azMax && !ok; da += 2) for (let de = -X.elMax; de <= X.elMax && !ok; de += 2) if (p.id !== 'omni' && nearNull(p.id, arrivalAngle({ ...z.start, az: z.start.az + da, el: z.start.el + de }, src), 15)) ok = true;
    assert.ok(ok);
  });
  it('safety is exact and plain: the lightning rule, the windscreen, the stop signal, the rain', () => {
    assert.match(B03_LIGHTNING, /substantial building or a hard-topped vehicle/);
    assert.match(B03_LIGHTNING, /at least 30 minutes after the last thunder/);
    assert.match(B03_LIGHTNING, /windscreen does not make an outdoor interview safe/);
    const before = copyOf(B03).setting.before.map((b) => `${b.title} ${b.text}`).join(' ');
    assert.match(before, /stop or move signal/);
    assert.match(before, /out of the rain/);
    assert.ok(B03.diagnostic.some((d) => d.critical && /thunder/i.test(d.prompt)));
  });
});

describe('B08 Broadcast Audience and Event Space', () => {
  it('validates', () => assert.deepEqual(validateLesson(B08, MIC_TYPES), []));
  it('is in the broadcast lab, ready', () => assert.equal(LESSONS.find((r) => r.id === 'B08')?.labId, 'broadcast'));
  it('the audience is drawn as seats without people', () => {
    for (const sc of [STUDIO_SCENE, EVENT_SCENE]) for (const s of sc.sectors.filter((q) => q.kind === 'crowd')) assert.equal(s.empty, true, s.id);
  });
  it('a raised crowd mic evens the section; low over the front row, one person dominates', () => {
    const low = nearSeatBias(STUDIO.M, 1.6, STUDIO.N, STUDIO.S);
    const high = nearSeatBias(STUDIO.M, 4.0, STUDIO.N, STUDIO.S);
    assert.ok(low.db > DOMINATE_DB && low.dominates);
    assert.ok(high.db < DOMINATE_DB && !high.dominates);
    assert.ok(high.db < low.db);
  });
  it('the mono crowd mic’s start puts both PA cabinets well off its front', () => {
    for (const pa of [STUDIO.paL, STUDIO.paR]) {
      const a = paAngle(STUDIO.M, STUDIO.hBar, STUDIO.S, FACE_H, pa, STUDIO.paH, 'cardioid');
      assert.ok(a.deg >= 90, `${a.deg}`);
      assert.ok(a.db < -6);
    }
  });
  it('two zone mics are not a pair: a coincident XY has no delay, the zones have milliseconds and a low mono notch', () => {
    const side = { x: -3.6, y: 3 };
    const xy = pairReading(side, FACE_H, STUDIO.M, STUDIO.hBar, STUDIO.M, STUDIO.hBar);
    assert.equal(Math.abs(xy.dtMs) < 1e-9, true);
    assert.equal(xy.notch, null);
    const z = pairReading(side, FACE_H, STUDIO.ZL, STUDIO.hCorner, STUDIO.ZR, STUDIO.hCorner);
    assert.ok(Math.abs(z.dtMs) > 5, `${z.dtMs}`);
    assert.ok(z.notch !== null && z.notch < 200);
    // a near-coincident pair sits between the two
    const ortf = pairReading(side, FACE_H, { x: -0.085, y: STUDIO.M.y }, STUDIO.hBar, { x: 0.085, y: STUDIO.M.y }, STUDIO.hBar);
    assert.ok(Math.abs(ortf.dtMs) > 0 && Math.abs(ortf.dtMs) < 0.6);
  });
  it('crowd mics routed into the PA are a routing fault', () => {
    const plan: RoutingPlan = { sources: [{ id: 'crowd', label: 'The crowd mics', short: 'CROWD', kind: 'ambience', level: 'mic' }], dests: ['pa', 'stream', 'recorder'], sends: { crowd: ['stream', 'recorder'] } };
    assert.deepEqual(routeProblems(plan), []);
    assert.ok(routeProblems(withSends(plan, 'crowd', ['stream', 'recorder', 'pa'])).some((p) => p.code === 'ambienceInPa'));
  });
  it('every setup mic stands on an approved place — out of the stage, the aisles and the exits', () => {
    for (const s of B08_SETUPS) for (const m of s.mics) assert.equal(refusedAt(s.scene ?? STUDIO_SCENE, m.at), null, `${s.id} ${m.id}`);
  });
  it('the Placement Studio’s starts lie in a recommended zone', () => {
    for (const id of ['su.one', 'su.two', 'su.zones']) {
      const m = B08_SETUPS.find((s) => s.id === id)!.mics[0];
      // sportsPages.inPlanZone's rule, read here (a .tsx file stays out of node).
      const aim = degOf({ x: m.aimAt.x - m.at.x, y: m.aimAt.y - m.at.y });
      const inside = (z: (typeof B08_PLACE)[number]) => z.kinds.includes(m.kind) && m.at.x >= z.rect.x0 && m.at.x <= z.rect.x1 && m.at.y >= z.rect.y0 && m.at.y <= z.rect.y1 && m.h >= z.h[0] && m.h <= z.h[1] && offAxisDeg(m.at, aim, STUDIO_SCENE.targets.find((q) => q.id === z.target)!.p) <= z.tol;
      assert.ok(B08_PLACE.some(inside), id);
    }
  });
  it('the safety rows: nothing over people without a qualified rigger; crowd mics never into the PA; exits clear', () => {
    const all = B08_ROWS.map((r) => r.text).join(' ');
    assert.match(all, /qualified rigger/);
    assert.match(all, /never into the main PA/);
    assert.match(all, /exits, aisles and walkways/);
    assert.ok(B08.diagnostic.filter((d) => d.critical).length >= 2);
  });
});

describe('Lab 7 group 3 — the learner’s words', () => {
  for (const l of [B03, B08]) {
    it(`${l.id}: no institutional words, the starting-points voice, no link to another lesson, no singer`, () => {
      const strings = learnerStrings(l);
      for (const s of strings) assert.doesNotMatch(s, /\b(student|classroom|instructor|Pro Audio Training Academy)\b/i);
      assert.ok(strings.some((s) => /After our research, here is where we recommend you begin/.test(s)));
      assert.ok(strings.some((s) => /Experimentation is encouraged/.test(s)));
      for (const s of strings.filter((q) => q !== l.id)) assert.doesNotMatch(s, /\b(B0[1-9]|B1\d|F0\d|F1[0-6])\b/);
      for (const s of [...strings, ...learnerStrings(copyOf(l).context), ...learnerStrings(copyOf(l).placement), ...learnerStrings(copyOf(l).terms)]) assert.doesNotMatch(s, /\b(singers?|song)\b/i, s.slice(0, 80));
    });
  }
  it('L7G2-13: no broadcast lesson inherits the singer’s Studio-or-live line', () => {
    for (const row of LESSONS.filter((r) => r.labId === 'broadcast')) {
      const l = lessonById(row.id);
      if (!l) continue;
      assert.doesNotMatch(copyOf(l).context.learn.intro ?? '', /singer|band/i, row.id);
    }
  });
});
