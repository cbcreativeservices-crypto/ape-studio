/**
 * Fact audit, Round 3 (Comp B return, 2026-10-22) — group A1_miking.
 * Pins a sample of the hedged / corrected learner wording in the miking
 * lessons a* / b* / c* (new words present, old claim gone), and the owner
 * ruling of 2026-10-22: comb filtering cancels FREQUENCIES, not pitches.
 * Ledger: LEDGER_R3_A1_miking.json (scratchpad of the parent session).
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const L = 'src/screens/lab/miking/lessons/';
const read = (f: string) => readFileSync(L + f, 'utf8').replace(/\r\n/g, '\n');

const PINS: { id: string; file: string; now: string; gone: string }[] = [
  { id: 'F015640', file: 'a02Trombone/art.tsx', now: 'nearly all round, as a trumpet does', gone: 'far more evenly than a trumpet' },
  { id: 'F015735', file: 'a02Trombone/lesson.ts', now: "prompt: 'How does a trombone spread its low notes?'", gone: 'Compared with a trumpet, how does a trombone' },
  { id: 'F016462', file: 'a04aTuba/copy.ts', now: 'Bell front: first made for early recording studios', gone: 'the tuba made for recording studios' },
  { id: 'F016716', file: 'a04aTuba/lesson.ts', now: 'in the lowest octaves, many patterns reject little', gone: 'get past every pattern' },
  { id: 'F018017', file: 'a07Piccolo/lesson.ts', now: 'we found no measurement made on a piccolo', gone: 'no piccolo-specific measurement exists' },
  { id: 'F019991', file: 'a10Harmonica/lesson.ts', now: 'Never straight into a desk input', gone: 'a speaker output goes to a speaker only' },
  { id: 'F020731', file: 'a12Organ/lesson.ts', now: 'the longest pipe of a stopped 16′ stop', gone: 'so a stopped 16′ stop is only' },
  { id: 'F021827', file: 'b05Lavalier/lesson.ts', now: 'Only a head-worn mic, like a headset, turns with the head', gone: 'Only a headset turns with the head' },
  { id: 'F023193', file: 'b04BoomCamera/lesson.ts', now: 'Never hold or raise any pole near overhead power lines', gone: 'a conductive pole' },
  { id: 'F025186', file: 'b08Audience/lesson.ts', now: 'Crowd mics stay out of the main PA.', gone: 'Crowd mics never go to the main PA.' },
  { id: 'F026194', file: 'b10Sideline/lesson.ts', now: "correct: 'The event’s radio coordinator'", gone: 'The venue’s radio coordinator' },
  { id: 'F027443', file: 'b12Parabolic/pages.tsx', now: 'Flip the POLARITY of the second mic, the fixed shotgun at F, both ways', gone: 'Flip B’s POLARITY' },
  { id: 'F029785', file: 'b17CrowdComplete/lesson.ts', now: 'by qualified riggers with venue approval', gone: 'by qualified venue staff' },
  { id: 'F029960', file: 'b17CrowdComplete/pages.tsx', now: 'A polarity flip on one path swaps left and right; a delay between the paths blurs the image', gone: 'independent processing on the two paths' },
  { id: 'F030302', file: 'c05aBanjo/lesson.ts', now: 'Louder only seems fuller', gone: 'Louder is not fuller' },
  { id: 'F030068', file: 'c01Guitar/copy.ts', now: 'a figure-8’s side null can', gone: 'no null helps there' },
  { id: 'F033777', file: 'c08BassAmp/lesson.ts', now: 'about 61 cm wide, 76 cm tall and 48 cm deep', gone: 'about 76 cm wide, 61 cm tall' },
  { id: 'F035114', file: 'c10Harp/lesson.ts', now: "correct: 'Use a secure stand from the side, clear of the harpist’s head'", gone: 'never over the harpist' },
  { id: 'F035206', file: 'c12Clavinet/lesson.ts', now: 'At 90° a cardioid is only about 6 dB down from on axis', gone: 'picks up half as much as on axis' },
  { id: 'F036043', file: 'c11Piano/lesson.ts', now: 'On most notes, releasing the key lets the damper fall', gone: "text: 'Releasing the key lets the damper fall" },
  { id: 'F037052', file: 'c14Sitar/copy.ts', now: 'set by the player and their bridge maker, never by a mic', gone: 'the jawari sound, set by the player, never by a mic' },
  { id: 'F037552', file: 'c15Veena/lesson.ts', now: 'Do not ask for it to change to suit a mic', gone: 'Never ask for it to change for a mic' },
];

/** Every .ts / .tsx file in the a*, b* and c* lesson folders. */
function groupFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.tsx?$/.test(n)) out.push(p);
    }
  };
  for (const d of readdirSync(L)) if (/^[abc]\d/.test(d)) walk(join(L, d));
  return out;
}

describe('fact audit R3 · A1 miking: hedged wording stays hedged', () => {
  for (const p of PINS) {
    it(`${p.id} (${p.file})`, () => {
      const s = read(p.file);
      assert.ok(s.includes(p.now), `${p.id}: corrected wording missing`);
      assert.ok(!s.includes(p.gone), `${p.id}: old wording is back`);
    });
  }

  it('owner ruling 2026-10-22: no a*/b*/c* lesson says comb filtering cancels "pitches"', () => {
    const files = groupFiles();
    assert.ok(files.length > 150, `only ${files.length} files found`);
    const bad = /pitch(es)?\b[^.'’]{0,40}\b(cancel|dip|comb)|\b(cancel(s|led)?|dips?|combs?)\b[^.'’]{0,40}\bpitch(es)?\b|cancels? (all )?(its|the) low notes/i;
    const hits = files.flatMap((f) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n').split('\n').filter((l) => bad.test(l)).map((l) => `${f}: ${l.trim().slice(0, 120)}`));
    assert.deepEqual(hits, []);
  });

  it('the comb wording now names frequencies', () => {
    assert.match(read('a01Trumpet/lesson.ts'), /some frequencies cancel in the sum/);
    assert.match(read('b02NewsAnchor/lesson.ts'), /EQ cannot fill the canceled frequencies/);
    assert.match(read('c01Guitar/lesson.ts'), /some frequencies add, some cancel/);
  });
});
