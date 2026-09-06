import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTargets,
  centsBetween,
  CONFIRM_MS,
  dampCents,
  directionText,
  fmtCents,
  IN_TUNE_CENTS,
  INITIAL_LOCK,
  lowStringHint,
  magnitudeColor,
  nearestTarget,
  noteHz,
  RETARGET_MS,
  stepLock,
  stepTarget,
} from '../src/features/tools/tuner/centerLock.ts';

const near = (a: number, b: number, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);

test('standard open strings are the sounding pitches at A4=440', () => {
  const g = buildTargets('guitar6', 'standard', 440);
  assert.deepEqual(g.map((t) => t.note), ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']);
  near(g[0].hz, 82.41);
  near(g[5].hz, 329.63);
  const b5 = buildTargets('bass5', 'standard', 440);
  assert.deepEqual(b5.map((t) => t.note), ['B0', 'E1', 'A1', 'D2', 'G2']);
  near(b5[0].hz, 30.87);
  near(b5[1].hz, 41.2);
  const g7 = buildTargets('guitar7', 'standard', 440);
  assert.equal(g7[0].note, 'B1');
});

test('violin defaults to perfect fifths from A4 and offers equal temperament', () => {
  const v = buildTargets('violin', 'standard', 440);
  near(v[0].hz, 195.56);
  near(v[1].hz, 293.33);
  near(v[2].hz, 440);
  near(v[3].hz, 660);
  const et = buildTargets('violin', 'standard', 440, 0, 'equal');
  near(et[0].hz, noteHz('G3'));
  near(et[3].hz, noteHz('E5'));
  assert.ok(Math.abs(centsBetween(v[3].hz, et[3].hz)) > 1, 'fifths and ET differ audibly on E5');
});

test('tunings and capo shift the targets', () => {
  const dropD = buildTargets('guitar6', 'dropD', 440);
  assert.equal(dropD[0].note, 'D2');
  assert.equal(dropD[1].note, 'A2');
  const capo2 = buildTargets('guitar6', 'standard', 440, 2);
  assert.equal(capo2[0].note, 'F#2');
  assert.equal(capo2[5].note, 'F#4');
  const a442 = buildTargets('guitar6', 'standard', 442);
  near(a442[1].hz, 110.5, 0.05);
});

test('nearestTarget picks the closest string and reports signed cents', () => {
  const g = buildTargets('guitar6', 'standard', 440);
  const r = nearestTarget(g[2].hz * Math.pow(2, -7 / 1200), g); // D3, 7 ¢ flat
  assert.equal(r.i, 2);
  near(r.cents, -7, 0.01);
});

test('AUTO retarget needs a stable candidate, MANUAL never moves', () => {
  let s = { target: 0, candidate: null as number | null, candidateSince: null as number | null };
  s = stepTarget(s, 1, 1000, false);
  assert.equal(s.target, 0, 'one frame nearer does not switch');
  s = stepTarget(s, 1, 1000 + RETARGET_MS - 1, false);
  assert.equal(s.target, 0);
  s = stepTarget(s, 1, 1000 + RETARGET_MS, false);
  assert.equal(s.target, 1, 'switches once the candidate has held');
  // A flicker to another string resets the candidate clock.
  s = stepTarget(s, 3, 2000, false);
  s = stepTarget(s, 2, 2010, false);
  s = stepTarget(s, 2, 2010 + RETARGET_MS - 5, false);
  assert.equal(s.target, 1);
  // Manual lock ignores everything.
  const m = stepTarget({ target: 4, candidate: null, candidateSince: null }, 0, 9999, true);
  assert.equal(m.target, 4);
});

test('lock confirms once after CONFIRM_MS inside ±2 ¢ and re-arms on leaving', () => {
  let l = stepLock(INITIAL_LOCK, 1.5, 0);
  assert.equal(l.confirmed, false);
  l = stepLock(l, -1.0, CONFIRM_MS - 10);
  assert.equal(l.confirmed, false, 'not yet stable long enough');
  l = stepLock(l, 0.4, CONFIRM_MS);
  assert.equal(l.confirmed, true);
  assert.equal(l.justConfirmed, true, 'exactly one confirmation event');
  l = stepLock(l, 0.2, CONFIRM_MS + 100);
  assert.equal(l.justConfirmed, false, 'does not repeat while inside');
  l = stepLock(l, IN_TUNE_CENTS + 0.5, CONFIRM_MS + 200);
  assert.equal(l.confirmed, false, 'leaving the zone re-arms');
  l = stepLock(l, 0.1, CONFIRM_MS + 300);
  l = stepLock(l, 0.1, CONFIRM_MS + 300 + CONFIRM_MS);
  assert.equal(l.justConfirmed, true, 'confirms again after re-entry and a fresh hold');
  assert.equal(stepLock(l, null, 9999).confirmed, false, 'silence releases the lock');
});

test('damping is fast far from centre and heavier near it, frame-rate independent', () => {
  const far = dampCents(0, 40, 16.7);
  const nearC = dampCents(0, 3, 16.7);
  assert.ok(far / 40 > nearC / 3, 'fraction covered per frame is larger when far');
  const oneFrame = dampCents(0, 40, 16.7);
  const twoHalfFrames = dampCents(dampCents(0, 40, 8.35), 40, 8.35);
  near(oneFrame, twoHalfFrames, 0.5);
});

test('direction words, colours and formatting', () => {
  assert.equal(directionText(null, false), 'PLAY A STRING');
  assert.equal(directionText(-8, false), 'FLAT · RAISE PITCH');
  assert.equal(directionText(8, false), 'SHARP · LOWER PITCH');
  assert.equal(directionText(1, false), 'HOLD…');
  assert.equal(directionText(1, true), 'IN TUNE');
  assert.equal(directionText(1200, false), 'OCTAVE HIGH');
  assert.equal(magnitudeColor(0), '#37e05f');
  assert.notEqual(magnitudeColor(-30), magnitudeColor(30) === magnitudeColor(-30) ? 'x' : magnitudeColor(-30));
  assert.equal(magnitudeColor(30), magnitudeColor(-30), 'colour is magnitude, direction is not colour');
  assert.equal(fmtCents(-7.24), '−7.2¢');
  assert.equal(fmtCents(0.02), '0.0¢');
  assert.equal(fmtCents(null), '—');
});

test('low-string coaching appears only for low targets after sustained instability', () => {
  assert.equal(lowStringHint(41.2, 500), null);
  assert.ok(lowStringHint(41.2, 2000));
  assert.equal(lowStringHint(110, 5000), null);
});
