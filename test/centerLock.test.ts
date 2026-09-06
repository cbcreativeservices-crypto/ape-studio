import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTargets,
  centsBetween,
  CONFIRM_MS,
  courseHint,
  courses,
  dampCents,
  directionText,
  displayNote,
  EMPTY_TARGETS,
  FAMILY_ORDER,
  fifthsHz,
  fmtCents,
  HOLD_MIN_MS,
  holdSummary,
  IN_TUNE_CENTS,
  INITIAL_HOLD,
  INITIAL_LOCK,
  INSTRUMENT_KEYS,
  INSTRUMENTS,
  instrumentsByFamily,
  lowStringHint,
  magnitudeColor,
  nearestTarget,
  noteHz,
  noteMidi,
  pianoKeyNumber,
  pianoRangeHint,
  pianoStretchCents,
  pianoTarget,
  readAgainstPartials,
  RETARGET_MS,
  steadinessText,
  stepPianoKey,
  STRETCH_LEVELS,
  stringNumber,
  wrongKeyText,
  stepChromatic,
  stepHold,
  stepLock,
  stepTarget,
  TRANSPOSITIONS,
  TUNINGS,
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
  assert.equal(directionText(1, false), 'ALMOST…');
  assert.equal(directionText(1, true), 'IN TUNE');
  assert.equal(directionText(1200, false), 'OCTAVE HIGH');
  assert.equal(magnitudeColor(0), '#37e05f');
  assert.notEqual(magnitudeColor(-30), magnitudeColor(30) === magnitudeColor(-30) ? 'x' : magnitudeColor(-30));
  assert.equal(magnitudeColor(30), magnitudeColor(-30), 'colour is magnitude, direction is not colour');
  assert.equal(fmtCents(-7.24), '−7.2¢');
  assert.equal(fmtCents(0.02), '0.0¢');
  assert.equal(fmtCents(null), '—');
  assert.equal(fmtCents(-317.8), '−318¢', 'whole cents beyond ±10');
  assert.equal(fmtCents(12.34), '+12¢');
  assert.equal(displayNote('C#4'), 'C♯4');
  assert.equal(displayNote('E2'), 'E2');
  assert.equal(wrongKeyText(-317.8), 'WRONG KEY · −3 SEMI');
  assert.equal(wrongKeyText(104), 'WRONG KEY · +1 SEMI');
  assert.equal(wrongKeyText(3900), 'WRONG KEY · +3 OCT');
  assert.equal(wrongKeyText(40), null);
});

test('players count strings from the top: string 1 is the highest course', () => {
  const g = buildTargets('guitar6', 'standard', 440);
  assert.equal(stringNumber(g[0], g), 6, 'low E is string 6');
  assert.equal(stringNumber(g[5], g), 1, 'high E is string 1');
  const g12 = buildTargets('guitar12', 'standard', 440);
  assert.equal(stringNumber(g12[0], g12), 6, 'the low E course is course 6');
  assert.equal(stringNumber(g12[1], g12), 6, 'its octave partner shares the number');
  const b5 = buildTargets('bass5', 'standard', 440);
  assert.equal(stringNumber(b5[0], b5), 5);
  assert.equal(stringNumber(b5[4], b5), 1);
});

test('no-string modes share one frozen target array', () => {
  assert.equal(buildTargets('piano', 'standard', 440), buildTargets('piano', 'standard', 442));
  assert.equal(buildTargets('chromatic', 'standard', 440), EMPTY_TARGETS);
  for (const k of INSTRUMENT_KEYS) assert.ok(INSTRUMENTS[k].short.length > 0, `${k} short name`);
});

test('AUTO piano key uses the stretched scale near a boundary', () => {
  // A0 stretched −30 ¢: a tone 40 ¢ below equal-tempered A♯0 is still nearer
  // stretched A♯0 (−30 ¢ from its ET pitch) than stretched A0.
  const hz = noteHz('A#0') * Math.pow(2, -40 / 1200);
  assert.equal(stepPianoKey(null, hz, 440, 1), noteMidi('A#0'));
  // Without stretch the same tone rounds to A♯0 as well; with stretch OFF a tone 55 ¢ below rounds to A0.
  assert.equal(stepPianoKey(null, noteHz('A#0') * Math.pow(2, -55 / 1200), 440, 0), noteMidi('A0'));
  // Hysteresis: once on A4, 55 ¢ sharp still reads A4.
  assert.equal(stepPianoKey(69, 440 * Math.pow(2, 55 / 1200), 440, 1), 69);
  assert.equal(stepPianoKey(69, 440 * Math.pow(2, 70 / 1200), 440, 1), 70);
});

test('low-string coaching appears only for low targets after sustained instability', () => {
  assert.equal(lowStringHint(41.2, 500), null);
  assert.ok(lowStringHint(41.2, 2000));
  assert.equal(lowStringHint(110, 5000), null);
});

test('every preset is well-formed and every family is represented', () => {
  for (const k of INSTRUMENT_KEYS) {
    const inst = INSTRUMENTS[k];
    assert.equal(inst.labels.length, inst.strings.length, `${k} labels`);
    if (inst.partners) assert.equal(inst.partners.length, inst.strings.length, `${k} partners`);
    for (const t of TUNINGS[k]) assert.equal(t.semitoneOffsets.length, inst.strings.length, `${k}/${t.key} offsets`);
    if (!inst.chromatic) {
      assert.ok(TUNINGS[k].length >= 1, `${k} has a tuning`);
      const targets = buildTargets(k, 'standard', 440);
      assert.ok(targets.length >= inst.strings.length);
      for (const t of targets) assert.ok(t.hz > 25 && t.hz < 1400, `${k} ${t.note} in the mic range`);
    }
  }
  const grouped = instrumentsByFamily();
  assert.deepEqual(grouped.map((g) => g.family), FAMILY_ORDER);
  for (const g of grouped) assert.ok(g.keys.length >= 1, `${g.family} has presets`);
  assert.equal(grouped.reduce((n, g) => n + g.keys.length, 0), INSTRUMENT_KEYS.length);
});

test('the world presets carry the sounding pitches from the brief', () => {
  const notes = (k: Parameters<typeof buildTargets>[0]) => buildTargets(k, 'standard', 440).map((t) => t.note);
  assert.deepEqual(notes('pipa'), ['A2', 'D3', 'E3', 'A3']);
  assert.deepEqual(notes('erhu'), ['D4', 'A4']);
  assert.deepEqual(notes('oudArabic'), ['C2', 'F2', 'A2', 'D3', 'G3', 'C4']);
  assert.deepEqual(notes('oudTurkish'), ['C#2', 'F#2', 'B2', 'E3', 'A3', 'D4']);
  assert.deepEqual(notes('ukuleleHighG'), ['G4', 'C4', 'E4', 'A4']);
  assert.deepEqual(notes('viola'), ['C3', 'G3', 'D4', 'A4']);
  assert.deepEqual(notes('cello'), ['C2', 'G2', 'D3', 'A3']);
  assert.deepEqual(notes('banjo5'), ['D3', 'G3', 'B3', 'D4', 'G4']);
  assert.deepEqual(buildTargets('dulcimer', 'daa', 440).map((t) => t.note), ['D3', 'A3', 'A3']);
});

test('double courses with an octave partner give two targets per course', () => {
  const g12 = buildTargets('guitar12', 'standard', 440);
  assert.equal(g12.length, 10, 'four octave pairs + two unison courses');
  const byCourse = courses(g12);
  assert.equal(byCourse.length, 6);
  assert.deepEqual(byCourse[0].map((t) => t.note), ['E2', 'E3']);
  assert.equal(byCourse[0][1].partner, true);
  assert.deepEqual(byCourse[5].map((t) => t.note), ['E4']);
  // Playing the octave string of the low course targets that string, not OCTAVE HIGH.
  const near = nearestTarget(noteHz('E3') * Math.pow(2, 3 / 1200), g12);
  assert.equal(g12[near.i].note, 'E3');
  assert.equal(g12[near.i].course, 0);
  assert.ok(courseHint(g12[0], g12)?.includes('E3'));
  assert.equal(courseHint(g12[8], g12), null, 'unison course needs no octave coaching');
  // Tuning shifts the partner with its course.
  const eb = buildTargets('guitar12', 'eb', 440);
  assert.deepEqual(courses(eb)[0].map((t) => t.note), ['D#2', 'D#3']);
});

test('perfect fifths reach viola and cello through octaves, and stay pure', () => {
  near(fifthsHz('A4'), 440);
  near(fifthsHz('D4'), 440 / 1.5);
  near(fifthsHz('A3'), 220);
  near(fifthsHz('C2'), 220 / Math.pow(1.5, 3), 0.001);
  const cello = buildTargets('cello', 'standard', 440);
  near(cello[3].hz, 220);
  near(cello[0].hz, 65.19, 0.01);
  assert.ok(Math.abs(centsBetween(cello[0].hz, noteHz('C2'))) > 5, 'pure C2 differs from ET by several cents');
  const et = buildTargets('cello', 'standard', 440, 0, 'equal');
  near(et[0].hz, noteHz('C2'));
});

test('chromatic mode holds the note across the half-way point and writes transposed pitch', () => {
  const a = stepChromatic(null, 440 * Math.pow(2, 45 / 1200), 440);
  assert.equal(a.target.note, 'A4');
  const b = stepChromatic(a.midi, 440 * Math.pow(2, 55 / 1200), 440);
  assert.equal(b.target.note, 'A4', '55 ¢ sharp still reads as A4 once held');
  const c = stepChromatic(a.midi, 440 * Math.pow(2, 70 / 1200), 440);
  assert.equal(c.target.note, 'A#4', 'beyond 60 ¢ it moves on');
  const bb = TRANSPOSITIONS.find((t) => t.key === 'Bb')!;
  const t = stepChromatic(null, 440, 440, bb.semis);
  assert.equal(t.target.note, 'B4', 'concert A reads as written B for a B♭ instrument');
  near(t.target.hz, 440, 0.001, );
  assert.equal(t.target.label, 'SOUNDS A4');
  const eb = TRANSPOSITIONS.find((t) => t.key === 'Eb')!;
  assert.equal(stepChromatic(null, noteHz('C4'), 440, eb.semis).target.note, 'A4');
  const f = TRANSPOSITIONS.find((t) => t.key === 'F')!;
  assert.equal(stepChromatic(null, noteHz('C4'), 440, f.semis).target.note, 'G4');
  const tenor = TRANSPOSITIONS.find((t) => t.key === 'BbLow')!;
  assert.equal(stepChromatic(null, noteHz('C4'), 440, tenor.semis).target.note, 'D5', 'tenor sax writes an octave above trumpet');
  const bari = TRANSPOSITIONS.find((t) => t.key === 'EbLow')!;
  assert.equal(stepChromatic(null, noteHz('C4'), 440, bari.semis).target.note, 'A5', 'bari sax: written A5 for concert C4');
});

test('piano stretch is zero at A4, flat in the bass, sharp in the treble, scaled by amount', () => {
  assert.equal(pianoStretchCents(69), 0);
  near(pianoStretchCents(108), 30, 0.01, );
  near(pianoStretchCents(21), -30, 0.01);
  assert.ok(pianoStretchCents(96) > 8 && pianoStretchCents(96) < 18, 'C7 roughly +10…15 ¢ like the Railsback average');
  assert.ok(pianoStretchCents(84) > 2 && pianoStretchCents(84) < 6, 'C6 a few cents sharp');
  assert.ok(pianoStretchCents(48) < -2 && pianoStretchCents(48) > -6, 'C3 a few cents flat');
  for (let m = 22; m <= 108; m++) assert.ok(pianoStretchCents(m) >= pianoStretchCents(m - 1), 'monotonic');
  near(pianoStretchCents(108, 0.5), 15, 0.01);
  assert.equal(pianoStretchCents(21, 0), 0);
  assert.equal(pianoKeyNumber(21), 1);
  assert.equal(pianoKeyNumber(69), 49);
  assert.equal(pianoKeyNumber(108), 88);
  const a4 = pianoTarget(69, 440);
  near(a4.hz, 440);
  assert.equal(a4.key, 49);
  const c8 = pianoTarget(108, 440);
  near(centsBetween(c8.hz, noteHz('C8')), 30, 0.01);
  assert.equal(pianoTarget(5, 440).note, 'A0', 'clamped to the keyboard');
  const p = INSTRUMENTS.piano;
  assert.ok(p.chromatic && p.piano && p.family === 'Piano');
});

test('a locked piano key reads the 2nd partial when that is what the mic hears', () => {
  const a0 = pianoTarget(21, 440, 0); // 27.5 Hz, under the tracker floor
  const heard = a0.hz * 2 * Math.pow(2, 4 / 1200); // 2nd partial, 4 ¢ sharp
  const r = readAgainstPartials(heard, a0.hz, 3);
  assert.equal(r.partial, 2);
  near(r.cents, 4, 0.01);
  const f = readAgainstPartials(a0.hz * Math.pow(2, -3 / 1200), a0.hz, 3);
  assert.equal(f.partial, 1, 'the fundamental wins when it fits');
  const wild = readAgainstPartials(a0.hz * 2.7, a0.hz, 2);
  assert.equal(wild.partial, 1, 'nothing fits → honest fundamental reading');
  assert.ok(Math.abs(wild.cents) > 1000);
  assert.ok(pianoRangeHint(27.5, 1)?.includes('2nd partial'));
  assert.ok(pianoRangeHint(27.5, 2)?.includes('sharp'));
  assert.ok(pianoRangeHint(3000, 1)?.includes('Treble'));
  assert.equal(pianoRangeHint(440, 1), null);
  assert.equal(STRETCH_LEVELS.find((s) => s.key === 'typical')?.amount, 1);
});

test('hold readout judges the last 1.5 s, skips the attack, and reports mean and spread', () => {
  let h = INITIAL_HOLD;
  for (let i = 0; i < 5; i++) h = stepHold(h, 'A4', 3 + (i % 2), i * 50);
  assert.equal(holdSummary(h, 250), null, 'too few samples / too short');
  for (let i = 5; i < 30; i++) h = stepHold(h, 'A4', 3 + (i % 2), i * 50);
  const s = holdSummary(h, HOLD_MIN_MS + 1000)!;
  assert.ok(s);
  near(s.avg, 3.5, 0.1);
  assert.ok(s.spread < 1);
  assert.equal(steadinessText(s.spread), 'ROCK STEADY');
  // A wild attack in the first 150 ms does not colour the readout.
  let a = stepHold(INITIAL_HOLD, 'A4', 80, 0);
  a = stepHold(a, 'A4', 60, 50);
  a = stepHold(a, 'A4', 40, 100);
  for (let t = 200; t <= 1400; t += 50) a = stepHold(a, 'A4', 2, t);
  near(holdSummary(a, 1400)!.avg, 2, 0.01);
  // Only the trailing window counts: an early drift ages out.
  let w = INITIAL_HOLD;
  for (let t = 0; t <= 1000; t += 50) w = stepHold(w, 'A4', 20, t);
  for (let t = 1050; t <= 3000; t += 50) w = stepHold(w, 'A4', 0, t);
  near(holdSummary(w, 3000)!.avg, 0, 0.01);
  assert.equal(stepHold(h, 'B4', 0, 9999).samples.length, 1, 'a new note restarts');
  assert.equal(stepHold(h, null, null, 9999).note, null, 'silence resets');
  assert.equal(steadinessText(12), 'UNSTEADY');
});
