/**
 * Comp B Round-2 audit, fix Round B (2026-10-23), group A1_miking — miking
 * lessons a…, b… and c… only. Pins a sample of the S3 clarity fixes: the new
 * wording is present and the old wording is gone. Sources are read with
 * CRLF normalised.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const L = join(process.cwd(), 'src', 'screens', 'lab', 'miking', 'lessons');
const read = (rel: string) => readFileSync(join(L, rel), 'utf8').replace(/\r\n/g, '\n');

const CASES: { id: string; file: string; now: string; gone: string }[] = [
  { id: 'R001533', file: 'b04BoomCamera/copy.ts', now: 'narrower pickup in the highs does not make it reach farther', gone: 'narrower pickup higher up' },
  { id: 'R002134', file: 'b02NewsAnchor/lesson.ts', now: "correct: 'Pull the level down, then fix the distance and open mics'", gone: "'Lower it, then fix the distance and open mics'" },
  { id: 'R002443', file: 'c12Clavinet/lesson.ts', now: 'Panning does not remove combing from the mono sum', gone: 'Panning does not change the mono sum' },
  { id: 'R002775', file: 'b11Athletes/lesson.ts', now: 'the talkback in presenters’ earpieces (IFB)', gone: 'broadcast, intercom, IFB and the officials’ systems' },
  { id: 'R002777', file: 'b11Athletes/lesson.ts', now: 'with a walk test, every radio switched on', gone: 'walked at real density' },
  { id: 'R005371', file: 'b09Commentators/copy.ts', now: 'Nothing over the playing area without approval and a qualified rigger', gone: 'Nothing over the playing area, and nothing fixed' },
  { id: 'R006275', file: 'a04aTuba/copy.ts', now: 'so an aim at the edge counts too', gone: 'The lab counts it while the mic points within' },
  { id: 'R018455', file: 'a04bEuphonium/copy.ts', now: 'so an aim at the edge counts too', gone: 'The lab counts it while the mic points within' },
  { id: 'R007175', file: 'a10Harmonica/geometry.ts', now: 'has it in front and off to one side, not behind', gone: 'has it off to one side, not behind' },
  { id: 'R007048', file: 'a10Harmonica/pages.tsx', now: 'sits in front of the mic and off to one side', gone: 'sits off to its side' },
  { id: 'R007118', file: 'a10Harmonica/pages.tsx', now: 'Each reed is tuned to one note.', gone: 'Every reed is a different length' },
  { id: 'R007360', file: 'b17CrowdComplete/pages.tsx', now: 'A polarity flip on one path swaps left and right; a delay between the paths blurs the image.', gone: 'breaks the matrix' },
  { id: 'R008440', file: 'a06Flute/lesson.ts', now: 'A windscreen does not cut spill', gone: 'a windscreen helps most once the capsule is off the jet' },
  { id: 'R010699', file: 'a01Trumpet/lesson.ts', now: 'a mic a metre away hears much more of the band and the monitors', gone: 'hears the band and the monitors more than the horn' },
  { id: 'R011316', file: 'b10Sideline/lesson.ts', now: 'It reaches the handheld from above, on the camera side.', gone: 'reaches the handheld from in front and above' },
  { id: 'R014089a', file: 'c09aViolin/lesson.ts', now: 'The real move is tiny; it is drawn many times larger here.', gone: 'a tiny way, many times larger here' },
  { id: 'R014089b', file: 'c09bViola/lesson.ts', now: 'The real move is tiny; it is drawn many times larger here.', gone: 'a tiny way, many times larger here' },
  { id: 'R017235', file: 'c05bMandolin/lesson.ts', now: "correct: 'Tremolo — rapid picking of one note'", gone: 'Tremolo — set gain on its strongest accents' },
  { id: 'R019143', file: 'c04Steel/pages.tsx', now: 'Most necks have ten strings', gone: "text: 'Ten strings over a flat fretboard" },
  { id: 'R024738', file: 'b16MotorHorseWater/lesson.ts', now: 'With a gentle clap already at −6 dBFS, your strongest clap clips.', gone: 'the first real pass clips' },
  { id: 'R036601', file: 'b15TrackGymCombat/lesson.ts', now: 'With a quiet clap already at −6 dBFS, your strongest clap clips.', gone: 'the first bell or whistle clips' },
  { id: 'R024767', file: 'b16MotorHorseWater/lesson.ts', now: 'No audio crew or stand goes in the run-off, at any time.', gone: 'Nobody stands in the run-off' },
  { id: 'R024923', file: 'b16MotorHorseWater/model.ts', now: 'A small supercardioid, not a shotgun', gone: 'supercardioid, no tube,' },
  { id: 'R036779', file: 'b15TrackGymCombat/model.ts', now: 'A small supercardioid, not a shotgun', gone: 'supercardioid, no tube,' },
  { id: 'R024871', file: 'b16MotorHorseWater/pages.tsx', now: 'The capsule about 1 m up, near the clap height.', gone: 'clap and speech height' },
  { id: 'R028391', file: 'a03Horn/lesson.ts', now: 'rare pedal notes go lower', gone: 'its lowest notes reach down to about 62 Hz' },
  { id: 'R028950', file: 'c11Piano/lesson.ts', now: 'Outside mics pick up none of the hammer or key noise', gone: 'far less of the hammers than they really do' },
  { id: 'R028954', file: 'c11Piano/lesson.ts', now: "correct: 'Bring the mics closer together, or change the geometry, then recheck'", gone: 'Bring the pair closer or change its geometry' },
  { id: 'R032166', file: 'a09bBassoon/model.ts', now: "label: 'About a foot from the finger holes'", gone: "label: 'About a foot from the sound holes'" },
  { id: 'R036309', file: 'b12Parabolic/lesson.ts', now: 'What passes: the target first', gone: 'a planned handoff and headroom pass' },
  { id: 'R036421', file: 'b12Parabolic/lesson.ts', now: 'Pause when rain or damp goes past what the connectors and electronics are rated for.', gone: 'wet connectors and electronics paused' },
  { id: 'R050234', file: 'a05cTenorSax/art.tsx', now: 'The high harmonics travel on to holes farther down and to the bell', gone: 'The bell carries the high harmonics, and the lowest notes.' },
];

for (const c of CASES) {
  test(`${c.id}: ${c.file} carries the Round-B wording`, () => {
    const src = read(c.file);
    assert.ok(src.includes(c.now), `missing: ${c.now}`);
    assert.ok(!src.includes(c.gone), `still present: ${c.gone}`);
  });
}

test('R050234: all four saxophone reveals agree', () => {
  for (const f of ['a05aSopranoSax/art.tsx', 'a05bAltoSax/art.tsx', 'a05cTenorSax/art.tsx', 'a05dBaritoneSax/art.tsx']) {
    const src = read(f);
    assert.ok(src.includes('The high harmonics travel on to holes farther down and to the bell, which also carries the lowest notes.'), f);
  }
});

test('re-keyed quiz items: every stored key is one of its options', () => {
  const keys: [string, string][] = [
    ['b02NewsAnchor/lesson.ts', 'Pull the level down, then fix the distance and open mics'],
    ['a10Harmonica/lesson.ts', 'No null helps: distance, level and the wedge’s aim do the work'],
    ['c05bMandolin/lesson.ts', 'Tremolo — rapid picking of one note'],
    ['c11Piano/lesson.ts', 'Bring the mics closer together, or change the geometry, then recheck'],
  ];
  for (const [f, k] of keys) {
    const src = read(f);
    assert.equal(src.split(`'${k}'`).length - 1, 2, `${f}: option + correct for “${k}”`);
  }
  // R028950: the feedback stays keyed to the renamed distractor.
  assert.equal(read('c11Piano/lesson.ts').split("'Outside mics pick up none of the hammer or key noise'").length - 1, 2);
});
