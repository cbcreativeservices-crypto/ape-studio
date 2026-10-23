/**
 * Round-2 audit fix pass (Comp B second audit, 2026-10-23), Round A — group
 * A1_miking (miking lessons a* / b* / c*).
 *
 * Pins the corrected learner wording (new words present, old claim gone) and
 * the owner rulings of 2026-10-23:
 *   #1 hearing guidance names NIOSH (85 dBA, 3 dB halving) and OSHA (90 dBA,
 *      5 dB) — no "widely used guideline" left unnamed in these lessons;
 *   #3 gear over people: never over the AUDIENCE without a qualified rigger;
 *      mounts on protective gear, instrument bridges, riders/horses and goal
 *      nets only with the approval of the athlete / team / owner / competition.
 * Ledger: LEDGER_RA_A1_miking.json (scratchpad of the parent session).
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const L = 'src/screens/lab/miking/lessons/';
const read = (f: string) => readFileSync(L + f, 'utf8').replace(/\r\n/g, '\n');

const PINS: { id: string; file: string; now: string; gone: string }[] = [
  { id: 'R010722', file: 'a01Trumpet/lesson.ts', now: 'the air in about 1.5 m of tube', gone: 'about 1.4 m of tube' },
  { id: 'R010864', file: 'a01Trumpet/art.tsx', now: 'tube is about 1.5 m long', gone: 'tube is about 1.4 m long' },
  { id: 'R010716', file: 'a01Trumpet/lesson.ts', now: "prompt: 'For safety, what must a stand mic and its cable stay clear of around a trumpeter?'", gone: "prompt: 'What must a stand mic and its cable" },
  { id: 'R006340', file: 'a04aTuba/geometry.ts', now: 'a mic seldom goes in it or close over it', gone: 'no mic goes in it or right over it' },
  { id: 'R032447', file: 'a08aClarinet/geometry.ts', now: 'About two dozen tone holes', gone: 'About twenty tone holes' },
  { id: 'R032008', file: 'a09bBassoon/lesson.ts', now: "correct: 'From open holes nearer the reed'", gone: 'From farther down the folded tube' },
  { id: 'R031994', file: 'a09bBassoon/lesson.ts', now: 'This page’s stand condenser and miniature both need phantom power.', gone: 'moves with it. Both need phantom power.' },
  { id: 'R007184', file: 'a10Harmonica/paths.tsx', now: 'Only a DI made for speaker level', gone: 'never into a mic, line or DI input' },
  { id: 'R024638', file: 'a11Accordion/pages.tsx', now: 'an octave apart, or tuned a little apart', gone: 'tuned together' },
  { id: 'R039851', file: 'a12Organ/lesson.ts', now: 'A Figure-8 (Bidirectional) pair, facing the two side walls', gone: 'figure-eight' },
  { id: 'R002113', file: 'b02NewsAnchor/lesson.ts', now: "'The need to aim it at the mouth'", gone: 'The camera’s frame and its edges' },
  { id: 'R013767', file: 'b03FieldReporter/lesson.ts', now: "'Leave it all to the automatic level'", gone: "'The automatic level switched on'" },
  { id: 'R001230', file: 'b04BoomCamera/lesson.ts', now: 'keep every pole away from power lines, whatever it is made of', gone: 'no conductive pole near power lines;' },
  { id: 'R001532', file: 'b04BoomCamera/copy.ts', now: 'held steady and clear of every head', gone: 'nothing above anyone’s head' },
  { id: 'R003063', file: 'b05Lavalier/lesson.ts', now: 'about 110–125° off its front', gone: 'a little off to the rear sides' },
  { id: 'R008604', file: 'b07Voiceover/lesson.ts', now: 'from 30 cm to 15 cm', gone: 'from 25 cm to 12 cm' },
  { id: 'R008837', file: 'b07Voiceover/model.ts', now: 'The reader looks under the mic to the script', gone: 'looks over the mic' },
  { id: 'R011067', file: 'b08Audience/pages.tsx', now: 'hung by a qualified rigger', gone: 'qualified crew' },
  { id: 'R005255', file: 'b09Commentators/lesson.ts', now: 'Turn the return down, fit each headset', gone: 'start the return level low' },
  { id: 'R036477', file: 'b12Parabolic/pages.tsx', now: 'Flip the POLARITY of the second mic, the fixed shotgun at F', gone: 'Flip mic B’s POLARITY' },
  { id: 'R028644', file: 'b13FieldDiamond/lesson.ts', now: "correct: 'Only with the competition’s approval'", gone: 'no mic, no camera' },
  { id: 'R040142', file: 'b14CourtIce/lesson.ts', now: 'Use a true boundary mic instead', gone: 'or raise it' },
  { id: 'R036601', file: 'b15TrackGymCombat/lesson.ts', now: 'In the practice, a gentle clap peaks at −30 dBFS.', gone: 'the event will be much louder' },
  { id: 'R024843', file: 'b16MotorHorseWater/lesson.ts', now: 'only with the approval of the rider, the owner and the organizer', gone: 'no mic on a horse, its tack or its rider' },
  { id: 'R007234', file: 'b17CrowdComplete/lesson.ts', now: "'The working side, still sent as stereo'", gone: 'The one side, panned to centre' },
  { id: 'R008920', file: 'c01Guitar/lesson.ts', now: "correct: 'Their voice, from just above, in front of the mic'", gone: 'from just above and behind it' },
  { id: 'R018686', file: 'c02GuitarAmp/lesson.ts', now: 'the notches move, but the delay does not. Only moving a mic, or a channel delay', gone: 'arrives: the notches move, the delay does not' },
  { id: 'R013353', file: 'c06bBassBowed/lesson.ts', now: 'clamped to it unless the owner approves?', gone: 'should never have a mic or clip clamped' },
  { id: 'R019704', file: 'c10Harp/lesson.ts', now: 'Distant mics hear less of the room than close spots do', gone: 'far less of the harpist’s fingers' },
  { id: 'F035165', file: 'c10Harp/lesson.ts', now: 'This miniature is a condenser. On a cable, it needs phantom power.', gone: 'Miniatures like this are condensers' },
  { id: 'R002725', file: 'c12Clavinet/soundArt.tsx', now: 'DI OR HI-Z INPUT', gone: 'DI OR LINE INPUT' },
];

describe('Round-2 audit, Round A · A1 miking: corrected wording is in place', () => {
  for (const p of PINS) {
    it(`${p.id} · ${p.file}`, () => {
      const s = read(p.file);
      assert.ok(s.includes(p.now), `${p.id}: new wording missing`);
      assert.ok(!s.includes(p.gone), `${p.id}: old wording still present`);
    });
  }
});

/** Every lesson source file in a* / b* / c*. */
function lessonFiles(): string[] {
  const out: string[] = [];
  for (const d of readdirSync(L)) {
    if (!/^[abc]\d/.test(d)) continue;
    const dir = join(L, d);
    if (!statSync(dir).isDirectory()) continue;
    for (const f of readdirSync(dir)) if (/\.(ts|tsx)$/.test(f)) out.push(join(dir, f));
  }
  return out;
}

describe('Owner ruling 2026-10-23 #1 · hearing guidance names its authorities', () => {
  it('no 85 dBA line in a*/b*/c* is left as an unnamed "widely used guideline"', () => {
    for (const f of lessonFiles()) {
      const s = readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
      assert.doesNotMatch(s, /widely used guideline/i, f);
    }
  });
  it('every 85 dBA limit names NIOSH, and OSHA 90 dBA with its 5 dB rule', () => {
    let n = 0;
    for (const f of lessonFiles()) {
      const s = readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
      for (const m of s.matchAll(/[^'`]*\b85 dBA\b[^'`]*/g)) {
        n += 1;
        assert.match(m[0], /NIOSH/, `${f}: ${m[0].slice(0, 80)}`);
        assert.match(m[0], /OSHA\) is 90 dBA with a 5 dB rule/, `${f}: ${m[0].slice(0, 80)}`);
        assert.doesNotMatch(m[0], /(workplace|legal) limit[^.;]*85/i, f);
      }
    }
    assert.ok(n >= 30, `expected the hearing lines, found ${n}`);
  });
});

describe('Owner ruling 2026-10-23 #3 · over people and approved mounts', () => {
  it('anything hung over seats names a qualified rigger, never "qualified crew" or "competent people"', () => {
    for (const f of lessonFiles()) {
      const s = readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
      assert.doesNotMatch(s, /\b(hung|hung only|mounted safely|installation,?) by (qualified crew|competent people)/i, f);
      assert.doesNotMatch(s, /rigging bar by qualified crew|competent people, rated supports/i, f);
    }
  });
  it('the boom lesson bans gear over the audience, not over the talker', () => {
    const s = read('b04BoomCamera/copy.ts') + read('b04BoomCamera/lesson.ts') + read('b04BoomCamera/geometry.ts');
    assert.doesNotMatch(s, /never swung above people|swing above people|nothing above anyone’s head/);
    assert.match(s, /over the audience/);
  });
  it('protective gear, riders and goal nets: only with approval', () => {
    assert.match(read('b11Athletes/lesson.ts'), /without the approval of the athlete and the team/);
    assert.doesNotMatch(read('b11Athletes/lesson.ts'), /Never put anything under or on protective equipment/);
    assert.doesNotMatch(read('b16MotorHorseWater/lesson.ts'), /No mic goes on the rider either/);
    assert.doesNotMatch(read('b13FieldDiamond/pages.tsx'), /Nothing on goals, nets or flagposts\./);
  });
});
