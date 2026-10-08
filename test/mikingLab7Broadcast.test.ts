/**
 * Miking Lab 7 group 1 — the broadcast desk kit (lessons/shared/broadcast/:
 * talkerPose, deskReflection, openMicPanel, routing, broadcastMics, the
 * engine's drawn arms) and the lessons built on it. Real relationships, not
 * re-runs of the implementation: a head turn moves the mouth on a circle and
 * a fixed mic's distance with it; the image source is a mirror and its delay
 * is the path difference over c; a talker's own mic hears them first; NOM
 * costs 3 dB per doubling; a remote guest's own voice in their return is an
 * echo; line into a mic input overloads; the arm's elbow keeps its two
 * segment lengths.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { speedOfSoundAir } from '../src/screens/lab/calc/calcUnits.ts';
import { elbowOf, gooseneckPts } from '../src/screens/lab/miking/engine/geometry/arm.ts';
import { micBodyOf } from '../src/screens/lab/miking/engine/model/validate.ts';
import { HEAD_C } from '../src/screens/lab/miking/lessons/shared/voice/voiceSpec.ts';
import { DESK_TOP_Y, HOST, SEATED_FLOOR, SEATED_SOLIDS, TURN_LIMITS, onTalker, poseOnTalker, SEATED_SIDE, SEATED_TOP, solidOnTalker, talkerAnchor, turnHead, turnReadout, type Talker } from '../src/screens/lab/miking/lessons/shared/broadcast/talkerPose.ts';
import { deskPlate, deskReflection, imageSource, onPlate, reflectionPoint } from '../src/screens/lab/miking/lessons/shared/broadcast/deskReflection.ts';
import { bleedMatrix, leakCombs, openMics, strongestLeak, threeToOneNote, type PanelMic, type PanelTalker } from '../src/screens/lab/miking/lessons/shared/broadcast/openMicPanel.ts';
import { CONNECT_WORDS, DESTINATIONS, PRESS_BOX, connect, feeds, reaches, routeProblems, withSends, type RoutingPlan } from '../src/screens/lab/miking/lessons/shared/broadcast/routing.ts';
import { BROADCAST_MIC_SLOTS, BROADCAST_MIC_TYPES, DESK_ARM } from '../src/screens/lab/miking/lessons/shared/broadcast/broadcastMics.ts';

const v3 = (x: number, y: number, z: number) => ({ x, y, z });
const dist = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const LIP = v3(0, 0, 0);

describe('the seated talker (talkerPose.ts)', () => {
  it('the desk and the floor sit below the lips by the drawing defaults (740 + 450 mm)', () => {
    assert.equal(DESK_TOP_Y, 450);
    assert.equal(SEATED_FLOOR, 1190);
  });
  it('a talker facing −x is the mirror of one facing +x (points and solids)', () => {
    const B: Talker = { id: 'b', lip: v3(1500, 0, 0), facing: -1 };
    assert.deepEqual(onTalker(B, v3(100, 20, 30)), v3(1400, 20, -30));
    const head = solidOnTalker(B, SEATED_SOLIDS.head);
    assert.equal(head.kind, 'capsule');
    if (head.kind === 'capsule') assert.ok(Math.abs(head.a.x - (1500 - HEAD_C.x)) < 1e-9);
    const t = solidOnTalker(B, SEATED_SOLIDS.torso);
    assert.ok(t.kind === 'box' && t.min.x < t.max.x && t.min.z < t.max.z, 'a mirrored box stays a box');
    const V = talkerAnchor(B);
    assert.deepEqual(V.fwd, v3(-1, 0, 0));
    assert.deepEqual(V.right, v3(0, 0, -1));
  });
  it('the seated poses keep the neck and the head of the voice family; placed poses move with the talker', () => {
    assert.equal(SEATED_SIDE.head.c.u, HEAD_C.x);
    const B: Talker = { id: 'b', lip: v3(1500, 0, 0), facing: -1 };
    const side = poseOnTalker(SEATED_SIDE, B);
    assert.equal(side.facing, -1);
    assert.ok(Math.abs(side.head.c.u - (1500 - HEAD_C.x)) < 1e-9);
    const top = poseOnTalker(SEATED_TOP, B);
    assert.equal(top.facing, Math.PI);
    assert.ok(Math.abs(top.neck.u - onTalker(B, v3(SEATED_TOP.neck.u, 0, 0)).x) < 1e-9);
  });
  it('a head turn moves the mouth on a circle about the head’s centre, and its axis turns with it', () => {
    const r0 = dist(LIP, HEAD_C);
    for (const yaw of [-60, -30, 0, 30, 60]) {
      for (const pitch of [TURN_LIMITS.pitch.min, 0, TURN_LIMITS.pitch.max]) {
        const t = turnHead(yaw, pitch);
        assert.ok(Math.abs(dist(t.mouth, HEAD_C) - r0) < 1e-6, `${yaw}/${pitch}`);
        assert.ok(Math.abs(Math.hypot(t.dir.x, t.dir.y, t.dir.z) - 1) < 1e-9);
      }
    }
    assert.deepEqual(turnHead(0, 0).mouth, v3(0, 0, 0));
    assert.ok(turnHead(30, 0).mouth.z > 0, '+ yaw turns toward the talker’s right (+z)');
    assert.ok(turnHead(0, -20).dir.y > 0, 'reading down points the axis down (+y)');
  });
  it('a fixed mic: facing ahead it reads its distance on the axis; a turn puts it off the axis — more change for a closer mic', () => {
    const near = turnReadout(v3(60, 0, 0), v3(-1, 0, 0), 0, 0);
    assert.ok(Math.abs(near.d - 60) < 1e-9 && near.offAxis < 1e-6 && near.distDb === 0);
    const n30 = turnReadout(v3(60, 0, 0), v3(-1, 0, 0), 30, 0);
    const f30 = turnReadout(v3(150, 0, 0), v3(-1, 0, 0), 30, 0);
    assert.ok(n30.offAxis > 30 && f30.offAxis > 20);
    assert.ok(Math.abs(n30.distDb) > Math.abs(f30.distDb), 'the same turn changes a close mic’s level more');
    assert.ok((n30.aimErr ?? 0) > 5, 'a fixed mic no longer points at the turned mouth');
  });
});

describe('the desk reflection (deskReflection.ts)', () => {
  const plate = deskPlate(450, 60, 1440, -650, 650);
  it('the image source is the mouth mirrored through the desk', () => {
    assert.deepEqual(imageSource(LIP, plate), v3(0, 900, 0));
  });
  it('the bounce point lies on the plane, on the straight line from the image to the mic', () => {
    const mic = v3(400, 0, 0);
    const at = reflectionPoint(LIP, mic, plate)!;
    assert.ok(Math.abs(at.y - 450) < 1e-9 && onPlate(at, plate));
    // Equal angles: the two legs mirror each other (the path equals |mic − image|).
    assert.ok(Math.abs(dist(LIP, at) + dist(at, mic) - dist(mic, v3(0, 900, 0))) < 1e-6);
  });
  it('Δt is the path difference over c (the calculator’s, 20 °C), the first notch 1 / (2Δt)', () => {
    const pose = { p: v3(125, 0, 0), az: 0, el: 0 };
    const R = deskReflection(LIP, pose, 'cardioid', plate);
    assert.ok(R.exists);
    const dMm = Math.hypot(125, 900) - 125;
    assert.ok(Math.abs(R.dMm - dMm) < 1e-9);
    assert.ok(Math.abs(R.dtMs - dMm / speedOfSoundAir(20)) < 1e-9);
    assert.ok(Math.abs((R.firstNotchHz ?? 0) - 1 / (2 * (R.dtMs / 1000))) < 1e-6);
    assert.ok(R.distDb > 0, 'the bounce travels farther: it arrives lower');
  });
  it('a mic lower toward the desk hears the bounce sooner (higher first notch) and stronger', () => {
    const level = deskReflection(LIP, { p: v3(200, 0, 0), az: 0, el: 0 }, 'omni', plate);
    const low = deskReflection(LIP, { p: v3(200 * Math.cos(Math.PI / 6), 200 * Math.sin(Math.PI / 6), 0), az: 0, el: -30 }, 'omni', plate);
    assert.ok(level.exists && low.exists);
    assert.ok(low.dtMs < level.dtMs && (low.firstNotchHz ?? 0) > (level.firstNotchHz ?? 0));
    assert.ok(low.distDb < level.distDb);
  });
  it('no reflection when the bounce point falls off the plate (a close mic over the desk’s edge)', () => {
    const edge = deskReflection(LIP, { p: v3(80, 0, 0), az: 0, el: 0 }, 'omni', plate);
    assert.equal(edge.exists, false, 'the bounce at 40 mm falls in front of the edge at 60 mm');
    const small = deskPlate(450, 900, 1000, -50, 50);
    const R = deskReflection(LIP, { p: v3(125, 0, 0), az: 0, el: 0 }, 'omni', small);
    assert.equal(R.exists, false);
    assert.equal(R.firstNotchHz, null);
  });
});

describe('open mics and bleed (openMicPanel.ts)', () => {
  const talkers: PanelTalker[] = [
    { id: 'A', label: 'A', mouth: v3(0, 0, 0) },
    { id: 'B', label: 'B', mouth: v3(1500, 0, 0) },
  ];
  const mics = (openB: boolean): PanelMic[] => [
    { id: 'mA', label: 'mA', owner: 'A', pose: { p: v3(125, 0, 0), az: 0, el: 0 }, pattern: 'cardioid', open: true },
    { id: 'mB', label: 'mB', owner: 'B', pose: { p: v3(1375, 0, 0), az: 180, el: 0 }, pattern: 'cardioid', open: openB },
  ];
  it('each mic hears its own talker at 0 dB and the other lower — by distance and by the pattern’s rear', () => {
    const m = bleedMatrix(mics(true), talkers);
    assert.equal(m[0][0].totalDb, 0);
    assert.ok(m[0][1].distanceDb > 20, 'B is ten times farther from mic A');
    assert.ok(m[0][1].patternDb === null || m[0][1].patternDb > 6, 'B sits behind mic A');
  });
  it('a talker through two open mics: own first, the other later by the path difference over c', () => {
    const c = leakCombs(mics(true), talkers).find((x) => x.talker === 'A')!;
    assert.ok(Math.abs(c.dtMs - (dist(v3(1375, 0, 0), LIP) - 125) / speedOfSoundAir(20)) < 1e-9);
    assert.ok(c.firstNotchHz != null && c.firstNotchHz < 200);
    assert.equal(strongestLeak(mics(false), talkers), null, 'one open mic: no second copy');
  });
  it('NOM costs 10·log10(n): one open mic costs nothing, two about 3 dB, four about 6 dB', () => {
    assert.equal(openMics(mics(false)).costDb, 0);
    assert.ok(Math.abs(openMics(mics(true)).costDb - 10 * Math.log10(2)) < 1e-9);
  });
  it('3:1 is a note across the open mics only', () => {
    const t = threeToOneNote(mics(true), talkers)!;
    assert.ok(t.ok && t.apart > t.need);
    assert.equal(threeToOneNote(mics(false), talkers), null);
  });
});

describe('routing (routing.ts)', () => {
  const plan: RoutingPlan = {
    sources: [
      { id: 'host', label: 'host', short: 'H', kind: 'mic', level: 'mic' },
      { id: 'guest', label: 'guest', short: 'G', kind: 'remote', level: 'line' },
      { id: 'crowd', label: 'crowd', short: 'C', kind: 'ambience', level: 'mic' },
      { id: 'tb', label: 'talkback', short: 'T', kind: 'talkback', level: 'mic' },
    ],
    dests: ['phones', 'monitor', 'stream', 'remoteReturn', 'pa', 'talkback'],
    sends: { host: ['phones', 'stream', 'remoteReturn'], guest: ['phones', 'stream'], crowd: ['stream'], tb: ['talkback'] },
    openMics: ['host'],
    needs: { stream: ['host', 'guest'] },
  };
  it('a clean plan has no problems; feeds and reaches agree', () => {
    assert.deepEqual(routeProblems(plan), []);
    assert.deepEqual(feeds(plan, 'stream').map((s) => s.id), ['host', 'guest', 'crowd']);
    assert.ok(reaches(plan, 'host', 'remoteReturn') && !reaches(plan, 'guest', 'remoteReturn'));
  });
  it('the guest in their own return is an echo (mix-minus missing)', () => {
    assert.deepEqual(routeProblems(withSends(plan, 'guest', ['phones', 'stream', 'remoteReturn'])), [{ code: 'echo', source: 'guest' }]);
  });
  it('the guest on a loudspeaker near an open mic loops back', () => {
    assert.deepEqual(routeProblems(withSends(plan, 'guest', ['monitor', 'stream'])), [{ code: 'speakerLoop', dest: 'monitor', source: 'guest' }]);
  });
  it('an ambience mic in the PA, talkback on air, and a needed source missing are each caught', () => {
    assert.deepEqual(routeProblems(withSends(plan, 'crowd', ['stream', 'pa'])), [{ code: 'ambienceInPa', source: 'crowd' }]);
    assert.deepEqual(routeProblems(withSends(plan, 'tb', ['talkback', 'stream'])), [{ code: 'talkbackOnAir', dest: 'stream' }]);
    assert.deepEqual(routeProblems(withSends(plan, 'guest', ['phones'])), [{ code: 'missing', dest: 'stream', source: 'guest' }]);
  });
  it('the press box: a line input, mic-level isolated outputs; line into a mic input overloads, mic into line is too quiet', () => {
    assert.equal(PRESS_BOX.input, 'line');
    assert.equal(PRESS_BOX.output, 'mic');
    assert.equal(connect('mic', 'mic'), 'ok');
    assert.equal(connect('line', 'mic'), 'overload');
    assert.equal(connect('mic', 'line'), 'tooQuiet');
    assert.ok(CONNECT_WORDS.overload.length > 20 && DESTINATIONS.pressBox.words.includes('isolated'));
  });
});

describe('broadcast mics and the drawn arms', () => {
  it('the group 1 types are in MIC_TYPES; the group 2 and 3 slots are reserved, not defined', () => {
    for (const id of Object.keys(BROADCAST_MIC_TYPES)) assert.ok(MIC_TYPES[id], id);
    for (const id of [...BROADCAST_MIC_SLOTS.G2, ...BROADCAST_MIC_SLOTS.G3]) assert.ok(!(id in BROADCAST_MIC_TYPES), id);
  });
  it('a desk arm reaches exactly its two segments; its body carries the arm’s drawing', () => {
    const b = micBodyOf(MIC_TYPES.bcDynArm);
    assert.equal(b.reach, DESK_ARM.lower.mm + DESK_ARM.upper.mm);
    assert.equal(b.armStyle, 'deskArm');
    assert.deepEqual(b.elbow, { a: DESK_ARM.lower.mm, b: DESK_ARM.upper.mm });
    assert.equal(micBodyOf(MIC_TYPES.bcGoose).armStyle, 'gooseneck');
  });
  it('the elbow keeps both segment lengths, sits above the line, and a stretched arm lies straight', () => {
    const grip = v3(170, 330, -350);
    const tail = v3(315, 0, 0);
    const e = elbowOf(grip, tail, 420, 400);
    assert.ok(Math.abs(dist(grip, e) - 420) < 1e-6 && Math.abs(dist(e, tail) - 400) < 1e-6);
    const mid = (grip.y + tail.y) / 2;
    assert.ok(e.y < mid, 'the elbow is raised (y up is negative)');
    const far = elbowOf(v3(0, 0, 0), v3(2000, 0, 0), 420, 400);
    assert.ok(Math.abs(far.y) < 1e-9 && far.x > 0 && far.x < 2000);
  });
  it('a gooseneck rises from its base and enters the tail along the mic’s axis', () => {
    const q = gooseneckPts(v3(0, 450, 0), v3(200, 100, 0), v3(-1, 0, 0));
    assert.ok(q[1].y < q[0].y, 'it rises first');
    assert.ok(q[2].x > q[3].x, 'it arrives along the axis (from behind the tail)');
  });
  it('the host’s frame is frame V', () => {
    assert.deepEqual(HOST.lip, v3(0, 0, 0));
    assert.equal(HOST.facing, 1);
  });
});
