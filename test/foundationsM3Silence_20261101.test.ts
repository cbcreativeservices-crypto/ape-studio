/**
 * Foundations Module 3 — STRENGTH 0 % is SILENT (D42 round 2, owner GO 2026-11-01).
 *
 * The picture goes flat at 0 % and the guide says "no vibration, no wave — and
 * no sound", but PLAY used to bottom out at −44 dBFS: a faint 165 Hz tone over
 * a flat graph. m3LevelDb now returns −120 dBFS (below any output's floor) at
 * the 0 the lane shows, and the old −44…−22 dBFS ramp everywhere above it.
 *
 * Source-reading ratchet (the screen imports React Native): the helper is
 * extracted from the file and evaluated, so the NUMBERS are tested, not just
 * the spelling.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');
const SRC = read('src/screens/lab/foundations/FoundationsCourseScreen.tsx');
const GUIDE = read('src/screens/lab/foundations/foundationsScreenGuides.ts');

function loadM3LevelDb(): (a: number) => number {
  const silent = SRC.match(/^const M3_SILENT_DB = (-\d+);$/m);
  assert.ok(silent, 'M3_SILENT_DB is defined at module scope');
  const fn = SRC.match(/^const m3LevelDb = \(a: number\) => (.+?); \/\/ /m);
  assert.ok(fn, 'm3LevelDb is defined at module scope');
  // eslint-disable-next-line no-new-func
  return new Function('M3_SILENT_DB', `return (a) => ${fn![1]};`)(Number(silent![1])) as (a: number) => number;
}

describe('Foundations M3: STRENGTH 0 % is silent', () => {
  const m3LevelDb = loadM3LevelDb();

  it('0 % (and anything the lane rounds to 0 %) plays at −120 dBFS — silence', () => {
    for (const a of [0, 0.001, 0.0049]) {
      assert.ok(m3LevelDb(a) <= -120, `a=${a}: ${m3LevelDb(a)} dBFS`);
      assert.ok(Number.isFinite(m3LevelDb(a)), 'finite — −Infinity is not a safe bridge value');
    }
  });

  it('above 0 % the old ramp is unchanged: −44 … −22 dBFS', () => {
    assert.equal(m3LevelDb(0.01), -44 + 0.01 * 22);
    assert.equal(m3LevelDb(0.5), -33);
    assert.equal(m3LevelDb(1), -22);
  });

  it('M3 drives BOTH the fader write and PLAY through m3LevelDb', () => {
    const m3 = SRC.slice(SRC.indexOf('function M3Rack('), SRC.indexOf('function M3Stage('));
    assert.match(m3, /const levelFor = m3LevelDb;/);
    assert.match(m3, /tone\.set\(\{ levelDb: levelFor\(v\) \}\)/);
    assert.match(m3, /tone\.play\(165, levelFor\(amt\)\)/);
    assert.doesNotMatch(m3, /-44 \+ a \* 22/, 'no second, un-muted ramp inside M3Rack');
  });

  it('the guide says plain "no sound" and drops the never-mutes note', () => {
    assert.ok(GUIDE.includes('No vibration means no wave, and no sound.'));
    assert.doesNotMatch(GUIDE, /PLAY never fully mutes/);
    assert.doesNotMatch(GUIDE, /still plays a faint tone/);
  });
});
