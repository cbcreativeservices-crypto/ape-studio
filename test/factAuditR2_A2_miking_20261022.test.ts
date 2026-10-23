/**
 * Fact audit, Round 2 (Comp B return, 2026-10-22) — group A2_miking.
 * Pins a sample of the corrected learner wording in the miking lessons
 * (d* / e* / f* / i* / m* / spk, lessons/shared/, engine copy): the corrected
 * words are present and the wrong claim is gone.
 * Ledger: LEDGER_R2_A2_miking.json (scratchpad of the parent session).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const M = 'src/screens/lab/miking/';
const L = M + 'lessons/';
const read = (f: string) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');

const PINS: { id: string; file: string; now: string; gone: string }[] = [
  { id: 'F038857', file: L + 'e04Duets/geometry.ts', now: 'If not, the nearer singer would dominate and, at a cardioid, sound bassier.', gone: 'The nearer singer would dominate, and sound bassier.' },
  { id: 'F039732', file: L + 'e06ChildrensChoir/lesson.ts', now: 'Limits used for events aimed at young children are about 94 dB averaged over 15 minutes, and peaks under 120 dB', gone: 'A widely used standard for events aimed at children' },
  { id: 'F043261', file: L + 'e14FullOrchestra/geometry.ts', now: 'The mics sit closer together than on the 2 m tree', gone: 'The capsules sit closer than 1.5 m to each other' },
  { id: 'F043442', file: L + 'e14FullOrchestra/lesson.ts', now: 'the mic’s own circuit, the preamp or the converter', gone: 'capsule, preamp, converter' },
  { id: 'F044702', file: L + 'f01Footsteps/lesson.ts', now: 'One directional mic about 0.9–1.8 m out, a stable step area', gone: 'about 1–2 m out' },
  { id: 'F046805', file: L + 'f06Ambience/lesson.ts', now: 'Then the two would point 140° apart, both partly backward.', gone: 'That would be 220° between them.' },
  { id: 'F047308', file: L + 'f07Wildlife/lesson.ts', now: 'The mic, settings, placement and method', gone: 'The mic, settings, place and method' },
  { id: 'F048994', file: L + 'f10SpatialField/lesson.ts', now: 'a logged turn can be undone in the decoder', gone: 'a decoder can turn a correct field, not repair a wrong one' },
  { id: 'F050063', file: L + 'f12SoundLevel/lesson.ts', now: 'about 3 dB at the usual 2 m position, up to about 6 dB with the mic flat on the wall', gone: 'the most the wall can add' },
  { id: 'F050812', file: L + 'f13RoomAcoustics/lesson.ts', now: 'about 35 dB of decay for T20, 45 dB for T30', gone: 'The floor every decay has to clear by 10 dB' },
  { id: 'F059418', file: L + 'i08Marimba/lesson.ts', now: 'All the other bars hang over pipes', gone: 'Every other bar hangs over a pipe' },
  { id: 'F063642', file: L + 'm04aCongas/lesson.ts', now: 'The full palm, flat, near the centre', gone: 'The full palm, slightly cupped' },
  { id: 'F069666', file: L + 'shared/broadcast/audiencePages.tsx', now: 'Two capsules about 17 cm apart, angled out', gone: 'a hand’s width apart' },
  { id: 'F071027', file: L + 'shared/ensemble/seating.ts', now: 'with the pedal down the notes ring on; let it up and they stop', gone: 'until the pedal stops them' },
  { id: 'F072659', file: L + 'shared/mallets/MSound.tsx', now: 'far from the still points, so it drives the lowest shape strongly', gone: 'where the lowest shape moves most' },
  { id: 'F073920', file: L + 'shared/sax/saxMics.ts', now: 'phantom power through its XLR adapter, which cuts the lows below about 80 Hz', gone: 'a wireless pack may cut below 80 Hz' },
  { id: 'F074765', file: L + 'shared/voice/addVoice.ts', now: 'On m, n and ng the mouth is closed, so the voice leaves through the nose.', gone: 'some of the voice leaves through the nose' },
  // systemic patterns
  { id: 'F042699', file: L + 'e12PercussionEnsemble/lesson.ts', now: 'Not until they ring: set the level the players need, with a margin.', gone: 'Ring out the wedges by pushing them to feedback' },
  { id: 'F061799', file: L + 'm01Kick/copy.ts', now: 'Feedback is made on purpose only to ring out a system — by its operator, at a controlled level.', gone: 'not to “find” a frequency' },
  { id: 'F048289', file: L + 'f09LocationSpeech/lesson.ts', now: 'keep at least 3 m (10 ft) from power lines (more for high-voltage ones)', gone: 'keep at least 3 m (10 ft) from power lines, and stop' },
  { id: 'F050722', file: L + 'f13RoomAcoustics/lesson.ts', now: 'Keep the source level the same both times: only the panels may change.', gone: 'Never drive the source louder to force a result.' },
  { id: 'F074053', file: L + 'shared/speakers/LeslieDisplay.tsx', now: 'INSIDE VIEW · ONLY A TECHNICIAN OPENS IT', gone: 'NEVER OPEN THE CABINET' },
  { id: 'F060486', file: L + 'i11aRhodes/lesson.ts', now: 'A speaker output goes only to a speaker, or to a load box made for it.', gone: 'A speaker output goes only to a speaker. ' },
  { id: 'F062330', file: L + 'm02Snare/geometry.ts', now: 'The cylinder between the heads, wood or metal.', gone: 'The wooden cylinder between the heads.' },
  { id: 'F070380', file: L + 'shared/cymbals/cymbalItems.ts', now: 'a condenser needs power, usually phantom; a dynamic needs none', gone: 'a condenser needs phantom; a dynamic needs none' },
];

describe('fact audit R2 · A2 miking: corrected wording stays corrected', () => {
  for (const p of PINS) {
    it(`${p.id} (${p.file.replace(L, '')})`, () => {
      const s = read(p.file);
      assert.ok(s.includes(p.now), `${p.id}: corrected wording missing`);
      assert.ok(!s.includes(p.gone), `${p.id}: old wording is back`);
    });
  }
  it('no copy in this group bans feedback outright, or forbids finding a frequency (ring-out is the operator’s job)', () => {
    const files = ['engine/model/copy.ts', 'lessons/e01LeadVocal/lesson.ts', 'lessons/e04Duets/lesson.ts', 'lessons/e12PercussionEnsemble/lesson.ts', 'lessons/f09LocationSpeech/lesson.ts', 'lessons/m02Snare/copy.ts', 'lessons/shared/voice/voiceCopy.ts', 'lessons/spk/pages.tsx'];
    for (const f of files) assert.doesNotMatch(read(M + f), /Never provoke feedback|never provoke feedback|Never create feedback deliberately|not to “find” a frequency/, f);
  });
});
