/**
 * Miking art fix ROUND 3 (2026-10-16, owner: "go through all labs and make the
 * improvements found in the grading report") — the ratchets for the four
 * sections fixed here: Measurement (F11/F13/F14), Cajón & hand percussion
 * (I02/I03a/I05d), Guitars & amps (C01–C05C, C08), Lutes (C13–C15).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { operatorReadingSolid, operatorSideReading, operatorTopReading, sheetOf } from '../src/screens/lab/miking/lessons/shared/measure/measureModel.ts';
import { cajonPose } from '../src/screens/lab/miking/lessons/i02Cajon/cajonPose.ts';
import { SEAT } from '../src/screens/lab/miking/lessons/i02Cajon/model.ts';
import { dorsalFlat } from '../src/screens/lab/miking/lessons/shared/smallperc/hands.ts';

const L = '../src/screens/lab/miking/lessons/';
const read = (p: string) => readFileSync(new URL(L + p, import.meta.url), 'utf8');
const d = (a: { u: number; v: number }, b: { u: number; v: number }) => Math.hypot(b.u - a.u, b.v - a.v);

describe('Measurement — the operator reads the log sheet; names keep off the mic band', () => {
  it('the clipboard sits in the fists, ahead of the body, inside the collision solid', () => {
    for (const facing of [1, -1] as const) {
      const pose = operatorSideReading(2600, 1200, facing);
      const s = sheetOf(pose);
      assert.equal(s.kind, 'side');
      if (s.kind !== 'side') return;
      // The lower edge within a hand's length of the near wrist.
      assert.ok(d(s.low, pose.handR.wrist) < 110, `board in the fist (${d(s.low, pose.handR.wrist).toFixed(0)} mm)`);
      // Ahead of the collar, toward `facing`; the top edge above the hands and below the eyes.
      assert.ok((s.high.u - pose.neck.u) * facing > 300, 'the board is held out in front');
      assert.ok(s.high.v < s.low.v && s.high.v > pose.head.c.v, 'leaning away, below the eyes');
      // The elbows bend (forearm well off the hanging line): upper arm and forearm at ≥ 60° to each other.
      const a1 = Math.atan2(pose.elbowR.v - pose.shoulderR.v, pose.elbowR.u - pose.shoulderR.u);
      const a2 = Math.atan2(pose.handR.wrist.v - pose.elbowR.v, pose.handR.wrist.u - pose.elbowR.u);
      const bend = Math.abs(((a2 - a1 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
      assert.ok(Math.PI - bend > (60 * Math.PI) / 180, 'the elbow bends');
      const sol = operatorReadingSolid(2600, 0, 1200, facing);
      assert.equal(sol.kind, 'box');
      if (sol.kind === 'box') assert.ok(s.high.u >= sol.min.x && s.high.u <= sol.max.x, 'the solid reaches the board');
    }
    const top = operatorTopReading(2600, -1000, -1);
    assert.equal(sheetOf(top).kind, 'above');
  });
  it('F11 / F14 use the reading operator and keep their labels off the mic band', () => {
    for (const f of ['f11MeasurementMics/art.tsx', 'f14SystemMeasurement/art.tsx']) {
      const s = read(f);
      assert.match(s, /<ReadingOperator pose=/, f);
      assert.match(s, /figureAt: \(view, _?variant, u, v, tol\) => .*inBand\(MIC_BAND/, f);
    }
  });
  it('F13 section: real seats (cushion, back, armrest, pedestal) and the named curtain', () => {
    const s = read('f13RoomAcoustics/RoomArt.tsx');
    for (const k of ['backs', 'steel', 'arms', 'curtain', 'folds', 'rail']) assert.match(s, new RegExp(`<Path path=\\{s\\.${k}\\}`), k);
    assert.match(read('f13RoomAcoustics/art.tsx'), /\{ id: 'curtains', text: 'CURTAINS', u: 2700/);
  });
});

describe('Cajón & hand percussion — the shared figure, true limbs, no white dots', () => {
  it('the cajón player is the shared figure on the SEAT joints, limbs at true length', () => {
    for (const v of ['rear', 'frontport']) {
      const p = cajonPose('side', v);
      assert.equal(p.posture, 'seated');
      assert.ok(d(p.shoulderR, p.elbowR) <= SEAT.upperArm + 2 && d(p.shoulderR, p.elbowR) >= SEAT.upperArm * 0.6, 'upper arm');
      assert.ok(d(p.elbowR, p.handR.wrist) <= SEAT.forearm + 2 && d(p.elbowR, p.handR.wrist) >= SEAT.forearm * 0.6, 'forearm');
      assert.deepEqual([p.hipR.u, p.hipR.v], [SEAT.hip.x, SEAT.hip.y], 'the drawing sits on the keep-outs');
      const t = cajonPose('top', v);
      // From above the elbows stay ahead of the shoulders (never folded back past them).
      assert.ok(t.elbowR.v > t.shoulderR.v && t.elbowL.v > t.shoulderL.v);
    }
    const art = read('i02Cajon/art.tsx');
    assert.doesNotMatch(art, /function (TorsoSide|LegSide|SeatedTop)\(/, 'the old plugged-on body parts are gone');
    assert.match(art, /figureAt: cajonFigureAt/);
  });
  it('a curled hand seen from its back shows no fingernails; the hands wear the figure nail tone', () => {
    assert.equal(dorsalFlat(70).nails?.length, 1, 'only the thumb nail');
    assert.equal(dorsalFlat(0).nails?.length, 5);
    assert.match(read('i03aShaker/art.tsx'), /const ALONG_BACK = dorsalFlat\(70\);/);
    assert.match(read('shared/smallperc/Hand.tsx'), /const NAIL = FIGURE_NAIL\.fill;/);
  });
});

describe('Guitars & amps — the fretting hand drawn with its arch; the plucked string rings', () => {
  it('fretView keeps every pad on its string and fret, and shows what stands toward the viewer turned', async () => {
    const { fretView, FRET_PAD_D } = await import('../src/screens/lab/miking/lessons/shared/players/handPoses.ts');
    const fv = fretView(1);
    const pad = fv({ x: 300, y: -10, z: FRET_PAD_D });
    assert.deepEqual([pad.u, pad.v], [300, -10]);
    const pip = fv({ x: 300, y: -10, z: FRET_PAD_D + 30 });
    assert.ok(pip.u > 300 + 10 && pip.v > -10 + 3, 'a raised joint shows the turn');
    const gp = read('shared/guitars/guitarPlayer.ts');
    assert.match(gp, /const fv = fretView\(/);
    assert.match(gp, /posed: \{ sk, view: fv, cut:/);
  });
  it('the pluck sequence swings the string (decorative motion only) and the STRINGS leader keeps off the player', () => {
    const s = read('shared/guitars/StringSound.tsx');
    assert.match(s, /const motion = useDecorativeMotion\(\);/);
    assert.match(s, /<Path path=\{liveString\}/);
    assert.match(read('shared/guitars/GuitarArt.tsx'), /\.find\(clear\)/);
  });
});

describe('Lutes — the veena player close, the tala strings on the player side, an adult oud player, the string rings', () => {
  it('veena: tala strings on the −y (player) side; the player 100 mm nearer; oud shoulders at the house breadth', async () => {
    const { veenaGeom } = await import('../src/screens/lab/miking/lessons/shared/lutes/luteSpec.ts');
    const { sceneOfKind } = await import('../src/screens/lab/miking/lessons/shared/lutes/luteModel.ts');
    const { luteHands } = await import('../src/screens/lab/miking/lessons/shared/lutes/luteHands.ts');
    const { BODY } = await import('../src/screens/lab/miking/lessons/shared/players/playerPose.ts');
    for (const t of veenaGeom().tala) assert.ok(t.y < 0, 'tala on the player side');
    const vn = sceneOfKind('veena');
    assert.equal(vn.fit.head.c.z, -300);
    assert.ok(vn.at.tala.y < 0);
    const oud = sceneOfKind('oud');
    assert.equal(oud.fit.shoulderL.x - oud.fit.shoulderR.x, 2 * BODY.shoulderHalf);
    // The fit's elbows stay the posed arms' solutions (they feed the keep-outs and the plan).
    for (const sc of [vn, oud]) {
      const H = luteHands(sc);
      for (const [a, b] of [[sc.fit.elbowL, H.fret.elbow], [sc.fit.elbowR, H.pluck.elbow]] as const) assert.ok(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < 1.5, `${sc.kind} elbow kept equal`);
    }
    const art = read('shared/lutes/veenaArt.tsx');
    assert.match(art, /tip: F\(t\.pegX, -nh - 62, -20\)/);
  });
  it('the lute pluck sequence swings the string (decorative motion only)', () => {
    const s = read('shared/lutes/LuteSound.tsx');
    assert.match(s, /const motion = useDecorativeMotion\(\);/);
    assert.match(s, /<Path path=\{liveString\}/);
  });
});
