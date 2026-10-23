/**
 * Audit round 2 (Comp B, 2026-10-23) — Round B (the last round) in the A2
 * miking files (engine, shared, data, pages and every lesson outside the a,
 * b and c lessons): the S3 CLARIFY / HEDGE / CONTEXT items.
 *
 * Pins a sample of the fixes (new wording present, old wording gone), the
 * sweeps that touched many files (comb notches at every odd half period, the
 * lowest shape among the ring-shaped ones, "stand still there", the channel
 * delay, the omni with no null to aim), and the two code-checked facts (the
 * resonator's bridge on the cone; the concert bass drum's 25° aim floor).
 * Source is read with CRLF normalised.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { C03_MODEL } from '../src/screens/lab/miking/lessons/c03Resonator/geometry.ts';
import { C05B_MODEL } from '../src/screens/lab/miking/lessons/c05bMandolin/geometry.ts';

const ROOT = process.cwd();
const MK = join(ROOT, 'src/screens/lab/miking');
const read = (rel: string) => readFileSync(join(MK, rel), 'utf8').replace(/\r\n/g, '\n');

function a2Files(dir = MK): string[] {
  const out: string[] = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) {
      if (/[\\/]lessons[\\/][abc]\d/.test(p)) continue; // A1's lessons
      out.push(...a2Files(p));
    } else if (/\.(ts|tsx)$/.test(n)) out.push(p);
  }
  return out;
}
const FILES = a2Files().map((f) => ({ f: f.slice(ROOT.length + 1), s: readFileSync(f, 'utf8').replace(/\r\n/g, '\n') }));
const filesWith = (needle: string) => FILES.filter(({ s }) => s.includes(needle)).map(({ f }) => f);

describe('Round B sweeps across the A2 files', () => {
  it('comb filtering: a notch at every odd half period, not just one', () => {
    assert.deepEqual(filesWith('cancels where it is half a period late'), []);
    assert.ok(filesWith('cancels at each frequency where it is half a period late, or 1½, 2½ … periods late').length >= 18);
  });
  it('the ring-shaped shapes include the lowest one', () => {
    // Drums and hand drums (membranes); the gong (i12, a plate) is not in this sweep.
    const drums = FILES.filter(({ f }) => !/i12Gong/.test(f));
    assert.deepEqual(drums.filter(({ s }) => /drives only the ring-shaped ones(?!, the lowest shape among them)/.test(s)).map(({ f }) => f), []);
  });
  it('"the rest stand still there", never "are still there"', () => {
    assert.deepEqual(filesWith('the rest are still there'), []);
    for (const id of ['M01', 'M02', 'M07B']) {
      const l = lessonById(id);
      if (!l) continue;
      assert.ok(l.diagnostic.some((d) => d.correct === 'Only the ring-shaped ones — the rest stand still there'), id);
    }
  });
  it('a channel delay changes the delay too', () => {
    assert.deepEqual(filesWith('Only a mic’s position changes the delay.'), []);
  });
  it('an omni has no null to aim (feedback replies)', () => {
    assert.deepEqual(filesWith('An omni rejects nothing: it usually makes feedback more likely'), []);
  });
  it('"a general rule of at least 30 cm", not a "30 cm floor"', () => {
    assert.deepEqual(filesWith('a general 30 cm floor for percussion'), []);
  });
  it('the three-dash clearance sentence is gone', () => {
    assert.deepEqual(filesWith('in red, with the reason, if a move is stopped — and show roughly'), []);
    assert.ok(filesWith('If a move is stopped, they turn red and give the reason').length >= 20);
  });
});

/** [file, new wording, old wording] */
const PINS: [string, string, string][] = [
  ['lessons/e13MixedEnsemble/lesson.ts', 'a tree’s centre mic too low in the mix', 'a tree’s centre too low, thins'],
  ['lessons/e13MixedEnsemble/lesson.ts', 'between the cello spot and the hall', 'The monitor sits in front of the cello spot'],
  ['lessons/e13MixedEnsemble/lesson.ts', 'Once a stage clips, EQ or a limiter after it cannot undo it.', "'EQ cannot repair clipping.'"],
  ['lessons/e11StringQuartet/art.tsx', 'a floor monitor below it sits off that axis', 'where a monitor can sit in its rejection'],
  ['lessons/e12PercussionEnsemble/art.tsx', 'angle the mic in from the wedge side', 'where a wedge can sit in its rejection'],
  ['lessons/m03Toms/lesson.ts', 'keep the mics at least three times as far apart as each one is from its own tom', 'than the other mic is'],
  ['lessons/f09LocationSpeech/pages.tsx', 'Little space above the head', 'Little headroom'],
  ['lessons/f09LocationSpeech/lesson.ts', 'stays narrow down to somewhat lower frequencies', 'narrows down to somewhat lower pitches'],
  ['lessons/shared/sax/saxLesson.ts', 'cannot cleanly restore what the filter took away', 'cannot restore what the filter removed'],
  ['lessons/shared/sax/saxLesson.ts', 'hardly changes the pitch', 'hardly takes part'],
  ['lessons/f13RoomAcoustics/lesson.ts', 'EDT needs less range and may still hold', 'report insufficient range for that band'],
  ['lessons/m07aConcertBassDrum/copy.ts', 'between about 25° and {tol}° off the head’s axis', '{tol}° off its axis'],
  ['lessons/m07aConcertBassDrum/lesson.ts', 'We found no such rule', 'No source establishes such a rule'],
  ['lessons/e04Duets/lesson.ts', 'most crews mute a mic before it is passed', 'or passes a live mic'],
  ['lessons/e07SingerInstrument/copy.ts', 'a pop screen at least 10 cm in front of it', 'its screen at least 10 cm'],
  ['lessons/e05Choir/geometry.ts', 'the front row’s outer singers sit just outside it', 'the whole choir fills its 95°'],
  ['lessons/m09Overheads/geometry.ts', 'so its fills arrive at a different time', 'reach the overheads after the snare’s sound does'],
  ['lessons/m09Overheads/copy.ts', 'from the player’s right: the floor tom and the ride nearest', 'the hi-hat and the crash on the left'],
  ['lessons/shared/measure/SurveyTools.tsx', 'would wrongly give the source as ${total - bgL} dB', 'which is what plain subtraction would wrongly give'],
  ['lessons/m10Room/copy.ts', 'clear of the player’s head and sticks', 'nothing over the player'],
  ['lessons/m10Room/lesson.ts', 'If it is routed to the PA or the monitors, that invites feedback', "'That invites uncontrolled feedback.'"],
  ['lessons/m11Kit/lesson.ts', 'The delay is the same at every frequency', 'at every pitch'],
  ['lessons/shared/ensemble/stereoArray.ts', 'the wider tree’s 2 m across and 1.5 m forward', 'closer together than the wider tree’s 1.5 m'],
  ['lessons/i11bWurlitzer/lesson.ts', 'new cables and the DI’s ground lift do not cure', 'hum that new cables do not cure'],
  ['lessons/f14SystemMeasurement/lesson.ts', 'at the front seat drawn here, the sub, then the front fill, then the main', 'here the front fill — arrives first'],
  ['lessons/spk/lesson.ts', 'a 4×10 bass cabinet about 61 cm wide and 76 cm tall', 'a 4×10 bass cabinet about 76 cm;'],
  ['lessons/spk/pages.tsx', 'Mic-to-PA feedback is made on purpose only', '. Feedback is made on purpose only to ring out a system'],
  ['lessons/f12SoundLevel/copy.ts', 'along the facade, toward the lawn', 'away from the house’s corner'],
  ['lessons/f16ScientificArrays/lesson.ts', 'A click from the side point, on the right, shows up first on the L channel', 'The R channel shows the left click first'],
  ['lessons/i09Xylophone/lesson.ts', 'every natural has a tube, but only some sharps and flats do', 'only the sharps and flats that need one'],
  ['lessons/m01Kick/geometry.ts', 'against the batter head. Mics stay off it', 'Damping on the bottom of the drum, against the beater head.'],
  ['lessons/shared/field/dish.ts', 'out from the bottom of the bowl', 'a third of its width from the middle'],
  ['data/micTypes.ts', 'half-cardioid (picks up only above the surface)', 'half-cardioid (hemisphere above the surface)'],
];

describe('Round B: a sample of single fixes (new wording in, old wording out)', () => {
  for (const [file, now, was] of PINS) {
    it(`${file}: ${now.slice(0, 50)}`, () => {
      const s = read(file);
      assert.ok(s.includes(now), `missing: ${now}`);
      assert.ok(!s.includes(was), `still there: ${was}`);
    });
  }
});

describe('Round B: keys changed with their options', () => {
  const key = (lessonId: string, itemId: string) => {
    const l = lessonById(lessonId);
    assert.ok(l, lessonId);
    const all = [...l.scenarios, ...l.symptoms, ...l.diagnostic];
    const it = all.find((x) => x.id === itemId);
    assert.ok(it, `${lessonId} ${itemId}`);
    assert.ok(it.options.includes(it.correct), `${itemId}: key is one of the options`);
    return it.correct;
  };
  it('E01: a dynamic is "often used" for loud voices', () => assert.equal(key('E01', 'lv.mic.3'), 'Audition a dynamic, a type often used for loud voices'));
  it('E08: no "narrowly compatible" jargon', () => assert.equal(key('E08', 'ac.ctx.1'), 'Close mics, or a narrow mono-safe pair'));
  it('F04: "sum both"', () => assert.equal(key('F04', 'f04.two.4'), 'Choose one for the scene, or sum both if mono holds'));
});

describe('Round B: code-checked facts', () => {
  const bridge = (m: { parts: readonly { id: string; role?: string }[] }) => m.parts.find((p) => /bridge$/.test(p.id))?.role ?? '';
  it('a resonator’s bridge stands on the cone; a mandolin’s still floats', () => {
    assert.match(bridge(C03_MODEL), /resonator cone/);
    assert.doesNotMatch(bridge(C03_MODEL), /Glued to the top/);
    assert.match(bridge(C05B_MODEL), /floating|movable/i);
  });
  it('the concert bass drum aim copy matches the zone’s 25° floor', () => {
    assert.match(read('lessons/m07aConcertBassDrum/model.ts'), /aim: \{ minOffAxis: 25, maxOffAxis: 75/);
    assert.match(read('lessons/m07aConcertBassDrum/copy.ts'), /between about 25° and \{tol\}°/);
  });
});
