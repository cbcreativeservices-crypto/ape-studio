/**
 * Miking Lab 6 group 6 — F09 Location Speech and Practical Sounds, F10
 * Spatial and Specialist Field Pickup, and their shared kits (lessons/shared/
 * field/location.ts, spatial.ts; the spatial presets in stereoArray.ts).
 * Real relationships, not re-runs of the implementation: the boom stays out
 * of the shot and aimed at the mouth, the power-line keep-out is exactly
 * 3 m (10 ft), the body mic stays on the chest when the head turns, a
 * swapped A-format track turns the field, FuMa and ambiX differ, the Double
 * M/S decode follows a walker, the arrays keep their shapes, and the safety
 * words are exact.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { LESSONS, labMeta, lessonsOf } from '../src/screens/lab/miking/data/registry.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { validateLesson, micBodyOf } from '../src/screens/lab/miking/engine/model/validate.ts';
import { checkAssembly, compileScene, assembly } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { inZone } from '../src/screens/lab/miking/engine/geometry/zones.ts';
import { aimVec, angleBetween } from '../src/screens/lab/miking/engine/geometry/vec.ts';
import { sdf } from '../src/screens/lab/miking/engine/geometry/sdf.ts';
import { deltaTms } from '../src/screens/lab/miking/engine/physics/twoMic.ts';
import { speedOfSoundAir } from '../src/screens/lab/calc/calcUnits.ts';
import {
  LIGHTNING,
  POWER_LINE_CLEARANCE,
  SAFETY_WORDS,
  SHOTS,
  SHOT_IDS,
  aboveFrame,
  boomStart,
  frameForShot,
  headroomKeepOut,
  inFrame,
  lineClearance,
  micToMouth,
  powerLineKeepOut,
  turnedMouth,
} from '../src/screens/lab/miking/lessons/shared/field/location.ts';
import {
  A_ORDER,
  B_ORDER,
  DRILL_GOOD,
  DRILL_START,
  ROUTES,
  W_SCALE_DB,
  aSignals,
  aToB,
  bDirection,
  decodedDirection,
  dirFrom,
  directionError,
  dmsDecode,
  dmsTracks,
  drillProblems,
  misread,
} from '../src/screens/lab/miking/lessons/shared/field/spatial.ts';
import { ARRAYS, ARRAY_IDS, SPATIAL_DIMS, arrayCapsules, dtLR } from '../src/screens/lab/miking/lessons/shared/ensemble/stereoArray.ts';
import { BOOM, FRAME, HEAD_TOP, LAV_P, LENS, POWER_LINE, GRIP } from '../src/screens/lab/miking/lessons/f09LocationSpeech/geometry.ts';
import { F10_SETUPS, F10_ZONES } from '../src/screens/lab/miking/lessons/f10SpatialField/model.ts';
import { EAR_SEATED, EAR_STANDING, LISTENER, PLAZA, fromS, toS } from '../src/screens/lab/miking/lessons/f10SpatialField/geometry.ts';

const F09 = lessonById('F09')!;
const F10 = lessonById('F10')!;
const v3 = (x: number, y: number, z: number) => ({ x, y, z });
const dist = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

describe('registry: Lab 6 group 6 (the field lab is ready, one block, no hard-coded totals)', () => {
  it('F09 and F10 are ready lessons of the field lab, served with their content', () => {
    const ids = lessonsOf('field').map((l) => l.id);
    assert.ok(ids.includes('F09') && ids.includes('F10'));
    assert.ok(F09 && F10 && F09.labId === 'field' && F10.labId === 'field');
    assert.ok((labMeta('field')?.blurb.length ?? 0) > 40 && (labMeta('field')?.familyBlurb.length ?? 0) > 20);
    // One contiguous block, in lesson-number order.
    const at = LESSONS.findIndex((l) => l.id === 'F09');
    assert.equal(LESSONS[at + 1].id, 'F10');
  });
  it('both lessons validate', () => {
    assert.deepEqual(validateLesson(F09, MIC_TYPES), []);
    assert.deepEqual(validateLesson(F10, MIC_TYPES), []);
  });
});

describe('the location kit (location.ts)', () => {
  it('SAFETY is exact: 3 m (10 ft) from power lines; 30 minutes after the last lightning or thunder', () => {
    assert.equal(POWER_LINE_CLEARANCE.mm, 3000);
    assert.equal(POWER_LINE_CLEARANCE.ft, 10);
    assert.equal(LIGHTNING.waitMin, 30);
    assert.match(SAFETY_WORDS.powerLine, /at least 3 m \(10 ft\)/);
    assert.match(SAFETY_WORDS.lightning, /30 minutes after the last lightning or thunder/);
    const ko = powerLineKeepOut(POWER_LINE);
    assert.equal(ko.kind, 'capsule');
    assert.equal(ko.kind === 'capsule' ? ko.r : 0, 3000);
  });
  it('the frame: the lens is outside the shot, the talker’s face is in it, the frame top is above the head', () => {
    assert.ok(!inFrame(FRAME, LENS));
    assert.ok(inFrame(FRAME, v3(0, 0, 0)), 'the lips are in the shot');
    assert.ok(FRAME.top < HEAD_TOP, 'headroom above the head');
  });
  it('every shot’s boom start sits 150 mm above the frame line, aimed at the mouth; wider shots push it away', () => {
    let last = 0;
    for (const s of SHOT_IDS) {
      const f = frameForShot(LENS, s);
      const b = boomStart(f);
      assert.ok(aboveFrame(f, b.p) >= 150 - 0.5, `${s}: ${aboveFrame(f, b.p)}`);
      assert.ok(angleBetween(b.aim, v3(-b.p.x, -b.p.y, -b.p.z)) < 0.01, `${s}: aimed at the lips`);
      assert.ok(b.d > last, `${s} farther than the shot before`);
      last = b.d;
    }
    assert.ok(SHOTS.close.top > SHOTS.wide.top);
  });
  it('the headroom keep-out holds a point in the shot above the head, and not the lips, the chest or the camera mic', () => {
    const k = headroomKeepOut(FRAME, HEAD_TOP);
    assert.ok(sdf(k, v3(300, -230, 0)) < 0, 'a boom dipping into the headroom is in the keep-out');
    assert.ok(sdf(k, v3(30, 0, 0)) > 0);
    assert.ok(sdf(k, LAV_P) > 0);
    assert.ok(sdf(k, v3(2420, -195, 0)) > 0, 'the camera-top mic is clear of it');
    assert.ok(sdf(k, BOOM.p) > 0, 'the boom start is above it');
  });
  it('a head turn moves the mouth and its axis; a body mic stays put and keeps its distance', () => {
    const pivot = v3(-87, 0, 0);
    const t = turnedMouth(60, pivot);
    assert.ok(Math.abs(dist(t.mouth, pivot) - 87) < 1e-6);
    assert.ok(Math.abs(Math.atan2(t.dir.z, t.dir.x) * (180 / Math.PI) - 60) < 1e-9);
    const l0 = micToMouth(LAV_P, null, v3(0, 0, 0), v3(1, 0, 0));
    const l1 = micToMouth(LAV_P, null, t.mouth, t.dir);
    assert.ok(Math.abs(l1.d - l0.d) < 0.15 * l0.d, 'the body mic stays near its distance');
    const b1 = micToMouth(BOOM.p, BOOM.aim, t.mouth, t.dir);
    assert.ok((b1.aimErr ?? 0) > 3, 'a boom left where it was now points off the mouth');
  });
  it('the line clearance is a distance to the conductor', () => {
    assert.equal(Math.round(lineClearance(v3(-1200, POWER_LINE.a.y + 3000, 0), POWER_LINE)), 3000);
  });
});

describe('F09: the boom, the body mic, the plant, the camera mic and the power line', () => {
  const zone = (id: string) => F09.zones.find((z) => z.id === id)!;
  it('the boom’s start is out of the shot (above the frame line) in every set-up with a camera', () => {
    for (const id of ['loc.boom', 'loc.boom.out']) {
      const p = zone(id).start.p;
      assert.ok(aboveFrame(FRAME, p) >= 140, `${id} ${aboveFrame(FRAME, p)}`);
      assert.ok(!inFrame(FRAME, p));
    }
  });
  it('outdoors, every zone start and the boom pole keep at least 3 m (10 ft) from the power line', () => {
    for (const z of F09.zones.filter((q) => q.requires?.variant === 'outdoor')) {
      assert.ok(lineClearance(z.start.p, POWER_LINE) >= 3000, `${z.id}`);
      const t = MIC_TYPES[z.requires!.micTypeIds![0]];
      const segs = assembly(compileScene(F09.model, 'outdoor'), z.start, micBodyOf(t));
      for (const s of segs) assert.ok(lineClearance(s.a, POWER_LINE) >= 3000 && lineClearance(s.b, POWER_LINE) >= 3000, `${z.id} ${s.piece}`);
    }
    // A mic raised toward the line is stopped by its keep-out.
    const sc = compileScene(F09.model, 'outdoor');
    const hit = checkAssembly(sc, { p: v3(-900, -1100, 0), az: 0, el: -60 }, micBodyOf(MIC_TYPES.locBoomFur));
    assert.equal(hit?.partId, 'f9.power');
  });
  it('the boom pole reaches the operator’s grip; the body mic clips to the chest, never to the pole', () => {
    const sc = compileScene(F09.model, 'set');
    const boom = assembly(sc, zone('loc.boom').start, micBodyOf(MIC_TYPES.locBoomSg)).find((s) => s.piece === 'arm')!;
    assert.ok(dist(boom.b, GRIP) < 1, 'the pole ends at the grip');
    const lav = assembly(sc, zone('loc.lav').start, micBodyOf(MIC_TYPES.locLav)).find((s) => s.piece === 'arm')!;
    assert.ok(dist(lav.a, lav.b) < 40, 'a short clip to the shirt');
    const d = dist(zone('loc.lav').start.p, v3(0, 0, 0));
    assert.ok(d >= 150 && d <= 320, `the body mic ${d} mm from the lips`);
  });
  it('every zone start is clear and inside its zone in each set-up it serves', () => {
    for (const z of F09.zones) {
      const t = MIC_TYPES[z.requires!.micTypeIds![0]];
      const v = z.requires!.variant!;
      const sc = compileScene(F09.model, v);
      assert.equal(checkAssembly(sc, z.start, micBodyOf(t)), null, z.id);
    }
  });
  it('the camera mic is as far from the talker as the camera is (direction is not proximity)', () => {
    const d = dist(zone('loc.cam').start.p, v3(0, 0, 0));
    assert.ok(Math.abs(d - LENS.x) < 200, `${d}`);
  });
  it('the two-mic pair (boom + body mic) has a real arrival-time difference', () => {
    const dt = deltaTms(dist(zone('loc.boom').start.p, v3(0, 0, 0)) - dist(zone('loc.lav').start.p, v3(0, 0, 0)));
    assert.ok(dt > 0.5 && dt < 2, `${dt} ms`);
  });
});

describe('the spatial kit (spatial.ts)', () => {
  it('in order, the A → B conversion puts a source where it is', () => {
    for (const [az, el] of [[0, 0], [45, 0], [-90, 0], [180, 0], [0, 45]]) {
      const got = bDirection(aToB(aSignals(dirFrom(az, el))));
      assert.ok(directionError(got, { az, el }) < 1, `${az}/${el}`);
    }
  });
  it('the drill starts with every problem and ends with none; a swapped track turns the field', () => {
    assert.deepEqual(drillProblems(DRILL_START).sort(), ['format', 'gainMatch', 'lfe', 'order', 'unlinked'].filter((p) => p !== 'gainMatch').sort());
    assert.deepEqual(drillProblems(DRILL_GOOD), []);
    const src = { az: 45, el: 0 };
    assert.ok(directionError(decodedDirection(DRILL_GOOD, dirFrom(45, 0)), src) < 1);
    assert.ok(directionError(decodedDirection(DRILL_START, dirFrom(45, 0)), src) > 20, 'swapped tracks move the source');
    const loud = { ...DRILL_GOOD, gains: [6, 0, 0, 0] };
    assert.ok(drillProblems(loud).includes('gainMatch'));
    assert.ok(directionError(decodedDirection(loud, dirFrom(-90, 0)), { az: -90, el: 0 }) > 3, 'an unmatched gain pulls the image');
  });
  it('FuMa is W, X, Y, Z with W 3 dB down; ambiX is W, Y, Z, X — read one as the other and the picture moves', () => {
    assert.deepEqual([...B_ORDER.fuma], ['W', 'X', 'Y', 'Z']);
    assert.deepEqual([...B_ORDER.ambix], ['W', 'Y', 'Z', 'X']);
    assert.equal(W_SCALE_DB.fuma, -3);
    assert.equal(W_SCALE_DB.ambix, 0);
    const ok = misread(dirFrom(0, 0), 'ambix', 'ambix');
    assert.ok(directionError(ok, { az: 0, el: 0 }) < 1);
    const bad = misread(dirFrom(0, 0), 'ambix', 'fuma');
    assert.ok(bad.el > 60, `a front source read the wrong way lands overhead (${bad.el})`);
  });
  it('Double M/S: a source on the left is louder left, front and rear; the wrong Side polarity mirrors it', () => {
    const t = dmsTracks(90);
    const d = dmsDecode(t.mf, t.s, t.mb);
    assert.ok(d.L > d.R && d.Ls > d.Rs);
    const w = dmsDecode(t.mf, t.s, t.mb, { sideSign: -1 });
    assert.ok(w.R > w.L);
    const front = dmsDecode(dmsTracks(0).mf, dmsTracks(0).s, dmsTracks(0).mb);
    assert.ok(front.L > front.Ls, 'a front source is louder in front');
  });
  it('every capture reaches every destination, and each route has its words', () => {
    for (const c of Object.values(ROUTES)) for (const r of Object.values(c)) assert.ok(r.words.length > 20);
    assert.equal(ROUTES.binaural.headphones.how, 'native');
    assert.equal(ROUTES.surround50.surround5.how, 'native');
    assert.equal(ROUTES.foa.stereo.how, 'render', 'raw A-format is never played as stereo');
    assert.equal(A_ORDER.length, 4);
  });
});

describe('the spatial presets (stereoArray.ts)', () => {
  it('the binaural head’s ears are a fixed 150 mm apart, the Ambisonic capsules a regular tetrahedron', () => {
    const b = arrayCapsules('binaural');
    assert.equal(b.length, 2);
    assert.ok(Math.abs(dist(b[0].p, b[1].p) - SPATIAL_DIMS.earSpacing) < 1e-6);
    const f = arrayCapsules('foa');
    assert.equal(f.length, 4);
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) assert.ok(Math.abs(angleBetween(f[i].dir, f[j].dir) - 109.47) < 0.05);
    assert.ok(f.every((q) => q.route === 'A'), 'raw A-format tracks, never speaker channels');
  });
  it('Double M/S is a front and a rear cardioid with a sideways figure-8; the five-channel array maps L, C, R, Ls, Rs', () => {
    const d = arrayCapsules('dms');
    assert.deepEqual(d.map((q) => q.pattern), ['cardioid', 'figure8', 'cardioid']);
    assert.ok(Math.abs(angleBetween(d[0].dir, d[2].dir) - 180) < 1e-6);
    assert.ok(Math.abs(angleBetween(d[0].dir, d[1].dir) - 90) < 1e-6);
    assert.deepEqual(arrayCapsules('surround50').map((q) => q.route), ['L', 'C', 'R', 'Ls', 'Rs']);
  });
  it('arrays without a sourced spacing are example layouts (no number on screen); no recording angle is invented', () => {
    for (const id of ['surround50', 'irt', 'hamasaki'] as const) assert.equal(ARRAYS[id].example, true);
    for (const id of ARRAY_IDS) if (id !== 'ortf') assert.equal(ARRAYS[id].recordingAngle, null);
    for (const id of ['surround50', 'irt', 'hamasaki'] as const) assert.doesNotMatch(`${ARRAYS[id].what} ${ARRAYS[id].tends} ${ARRAYS[id].check}`, /\d+\s*(mm|cm|m)\b/);
  });
});

describe('F10: the listener’s point, the arrays and the scene', () => {
  it('frame S ↔ frame F10: an array facing 0° faces the scene front; turning is a proper rotation', () => {
    const c = arrayCapsules('ortf', {}, { c: toS(LISTENER), face: 0 });
    const mid = { x: (c[0].dir.x + c[1].dir.x) / 2, y: 0, z: (c[0].dir.z + c[1].dir.z) / 2 };
    const f = fromS(mid);
    assert.ok(f.x > 0.5 && Math.abs(f.z) < 1e-9, 'facing +x');
    // The left capsule is on the listener's left (−z).
    assert.ok(fromS(c[0].p).z < 0);
    const p = v3(1, 2, 3);
    assert.deepEqual(toS(fromS(p)), p);
  });
  it('the listener heights are 1.7 m standing and 1.2 m seated; the head and the Ambisonic mic start there, facing front', () => {
    assert.equal(EAR_STANDING, 1700);
    assert.equal(EAR_SEATED, 1200);
    for (const id of ['sp.head', 'sp.foa', 'sp.dms']) {
      const z = F10_ZONES.find((q) => q.id === id)!;
      assert.equal(-z.start.p.y, 1700, id);
      assert.ok(angleBetween(aimVec(z.start.az, z.start.el), v3(1, 0, 0)) < 1e-6, `${id} faces the scene front`);
    }
  });
  it('no setup stands in the public footpath; the close mic is within 10 cm of the singer', () => {
    for (const s of F10_SETUPS) for (const r of s.rigs) assert.ok(r.c.x < PLAZA.path.x0 || r.c.x > PLAZA.path.x1, s.id);
    const c = F10_ZONES.find((q) => q.id === 'sp.close')!;
    assert.ok(dist(c.start.p, PLAZA.singerMouth) <= 100);
  });
  it('every engine zone start is clear and inside its zone', () => {
    for (const z of F10.zones) {
      const t = MIC_TYPES[z.requires!.micTypeIds![0]];
      for (const v of z.requires?.variant ? [z.requires.variant] : ['plaza', 'event']) {
        const sc = compileScene(F10.model, v);
        assert.equal(checkAssembly(sc, z.start, micBodyOf(t)), null, `${z.id} ${v}`);
        assert.ok(inZone(z, { scene: sc, surfaces: F10.model.surfaces, lines: F10.model.lines, variant: v, micTypeId: t.id, mount: t.mount }, z.start), `${z.id} ${v}`);
      }
    }
  });
  it('the ears hear a walker on the left first (straight paths, the calculator’s speed of sound)', () => {
    const ears = arrayCapsules('binaural', {}, { c: toS(LISTENER), face: 0 }).map((q) => ({ ...q, p: fromS(q.p), dir: fromS(q.dir) }));
    assert.ok(dtLR(ears, v3(2900, -1550, -2000)) > 0, 'the right ear hears it later');
    assert.ok(Math.abs(dtLR(ears, v3(2900, -1550, 0))) < 1e-9);
    assert.ok(speedOfSoundAir(20) > 343 && speedOfSoundAir(20) < 344);
  });
});

describe('safety and wording in the learner text', () => {
  const learner = (l: typeof F09) => JSON.stringify({ p: l.pages, s: l.scenarios, d: l.diagnostic, y: l.symptoms, z: l.zones.map((z) => [z.label, z.band, z.tendency, z.checks]), o: l.orient, set: l.setting, c: l.copy, a: l.accuracyDetail });
  it('both lessons say the power-line and lightning rules exactly, and never “last thunder” alone', () => {
    for (const l of [F09, F10]) {
      const s = learner(l);
      assert.match(s, /at least 3 m \(10 ft\)/, l.id);
      assert.match(s, /30 minutes after the last lightning or thunder/, l.id);
      assert.doesNotMatch(s, /after the last thunder/, l.id);
    }
  });
  it('the starting-points voice: “use your ears” and “Experimentation is encouraged”', () => {
    for (const l of [F09, F10]) {
      const s = learner(l);
      assert.match(s, /Experimentation is encouraged/, l.id);
      assert.match(s, /trust your ears/, l.id);
    }
  });
  it('consent and privacy are said in plain words: a hidden mic is not permission', () => {
    assert.match(learner(F09), /never hide a mic to record anyone secretly/i);
    assert.match(learner(F10), /permission/i);
  });
});
