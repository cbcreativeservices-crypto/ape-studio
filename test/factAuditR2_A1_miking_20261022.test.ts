/**
 * Fact audit, Round 2 (Comp B return, 2026-10-22) — group A1_miking.
 * Pins a sample of the corrected learner wording in the miking lessons
 * (a* / b* / c*): the corrected words are present and the wrong claim is gone.
 * Ledger: LEDGER_R2_A1_miking.json (scratchpad of the parent session).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const L = 'src/screens/lab/miking/lessons/';
const read = (f: string) => readFileSync(L + f, 'utf8').replace(/\r\n/g, '\n');

const PINS: { id: string; file: string; now: string; gone: string }[] = [
  { id: 'F015265', file: 'a01Trumpet/lesson.ts', now: "'That is the lows. The highs gather along the axis.'", gone: 'That is the low notes.' },
  { id: 'F016112', file: 'a03Horn/lesson.ts', now: 'depending on the note. Only the lip end is a peak for every note.', gone: 'depending on the shape' },
  { id: 'F018572', file: 'a08aClarinet/lesson.ts', now: 'about two dozen tone holes', gone: 'about twenty tone holes' },
  { id: 'F019567', file: 'a09bBassoon/lesson.ts', now: "'Closer to the reed, at the first open hole'", gone: 'Farther down the tube, at the first open hole' },
  { id: 'F019631', file: 'a09bBassoon/lesson.ts', now: 'so the source moves down the long joint, round the boot and up the wing joint as the pitch rises', gone: 'so the source moves down the instrument as the pitch rises' },
  { id: 'F020252', file: 'a11Accordion/geometry.ts', now: 'no cardioid’s or supercardioid’s null reaches it', gone: 'no pattern’s null reaches it' },
  { id: 'F021043', file: 'a12Organ/lesson.ts', now: 'some guides round the spacing to about six inches (15 cm)', gone: 'CORRECTIONS_LOG ORG-02' },
  { id: 'F021269', file: 'b01RadioHost/lesson.ts', now: 'related pickup problems', gone: 'related routing problems' },
  { id: 'F022017', file: 'b02NewsAnchor/lesson.ts', now: "observation: 'A low desk mic sounds hollow'", gone: 'A raised desk mic sounds hollow' },
  { id: 'F022855', file: 'b04BoomCamera/geometry.ts', now: "label: 'WIDER SHOT'", gone: "label: 'WIDE SHOT'" },
  { id: 'F026458', file: 'b11Athletes/copy.ts', now: 'so its tone and level shift as the head turns', gone: 'steadier in level' },
  { id: 'F027813', file: 'b13FieldDiamond/lesson.ts', now: 'Separate channels do not change feedback.', gone: 'Feedback is about routing' },
  { id: 'F029176', file: 'b16MotorHorseWater/lesson.ts', now: 'any Doppler pitch shift is tiny', gone: 'the mic’s off-axis tone' },
  { id: 'F030835', file: 'c02GuitarAmp/lesson.ts', now: 'the valves get very hot, and high voltage is close by inside', gone: 'the chassis and valves are hot and live' },
  { id: 'F033215', file: 'c07AcousticBass/lesson.ts', now: 'the longer the delay, the lower the first notch reaches into the bass', gone: 'the low end suffers first' },
  { id: 'F037307', file: 'c14Sitar/lesson.ts', now: 'a broad bridge (of horn, bone or a synthetic)', gone: 'broad bone bridge' },
  { id: 'F015204', file: 'a01Trumpet/copy.ts', now: 'Feedback is made on purpose only to ring out a system — by its operator, at a controlled level.', gone: 'Never create feedback deliberately' },
  { id: 'F021171', file: 'b01RadioHost/copy.ts', now: 'any ring-out is the system operator’s job', gone: 'never raise a level to find feedback' },
  { id: 'F030882', file: 'c08BassAmp/lesson.ts', now: "'No — a speaker output never feeds either'", gone: 'goes only to a speaker' },
  { id: 'F036564', file: 'c12Clavinet/lesson.ts', now: 'Do not tape a mic to the grille cloth', gone: 'The mic never touches the grille' },
  { id: 'F025307', file: 'b08Audience/lesson.ts', now: 'we found no source that gives a crowd mic’s height', gone: 'no source gives a crowd mic’s height' },
  { id: 'F030379', file: 'c05cUkulele/lesson.ts', now: "'This miniature condenser needs phantom power, which this input does not have.'", gone: "'A miniature condenser needs phantom power" },
];

describe('fact audit R2 · A1 miking: corrected wording stays corrected', () => {
  for (const p of PINS) {
    it(`${p.id} (${p.file})`, () => {
      const s = read(p.file);
      assert.ok(s.includes(p.now), `${p.id}: corrected wording missing`);
      assert.ok(!s.includes(p.gone), `${p.id}: old wording is back`);
    });
  }
  it('no lesson in this group bans feedback outright any more (ring-out is the operator’s job)', () => {
    for (const f of ['b01RadioHost/lesson.ts', 'b04BoomCamera/lesson.ts', 'b09Commentators/lesson.ts', 'c10Harp/lesson.ts', 'c12Clavinet/lesson.ts']) {
      assert.doesNotMatch(read(f), /Never provoke feedback|Never create feedback deliberately/, f);
    }
  });
});
