/**
 * 2026-11-05 — the SPL LED printed 40 for any level under its scale (a 21 dB room
 * read AVG 40 beside a gauge at 21), and the Advanced Tuner's 0 sat left of the
 * centre tick. The readout now runs through one worklet, exercised here for real.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import ts from 'typescript';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const V = read('src/screens/lab/meter/vizMeters.tsx');
const T = read('src/screens/tools/CenterLockTuner.tsx');

function loadReadout(): (db: number, splOffset: number, splBot: number) => string {
  const m = V.match(/export function splReadoutText\([\s\S]*?\n\}\n/);
  assert.ok(m, 'splReadoutText exists in vizMeters.tsx');
  const js = ts.transpileModule(m[0].replace('export ', ''), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return new Function(`${js}\nreturn splReadoutText;`)();
}

describe('SPL LED readout never prints the scale floor as a reading', () => {
  const text = loadReadout();
  it('below the scale it says so', () => {
    assert.equal(text(-79, 100, 40), '<40'); // the Pixel's 21 dB room
    assert.equal(text(-60.6, 100, 40), '<40'); // rounds to 39
  });
  it('on the scale it prints the true number, 40 included', () => {
    assert.equal(text(-60, 100, 40), '40');
    assert.equal(text(-30, 100, 40), '70');
    assert.equal(text(5, 100, 40), '105');
  });
  it('no reading is not a level', () => {
    assert.equal(text(-120, 100, 40), '—');
    assert.equal(text(NaN, 100, 40), '—');
  });
  it('fits the column: no wider than the three characters of "100"', () => {
    assert.ok(text(-79, 100, 40).length <= 3);
  });
  it('PK and AVG both use it and the floor clamp is gone', () => {
    assert.match(V, /splReadoutText\(liveRms\.value, splOffset, SPL_BOT\)/);
    assert.match(V, /splReadoutText\(lHold\.value, splOffset, SPL_BOT\)/);
    assert.doesNotMatch(V, /Math\.max\(SPL_BOT, Math\.round/);
  });
  it('it is a worklet, because the readouts run on the UI thread', () => {
    assert.match(V, /export function splReadoutText\([^\n]*\n\s*'worklet';/);
  });
});

describe('Advanced Tuner scale: the 0 sits on the centre tick', () => {
  const style = (k: string) => T.split('\n').find((l) => l.startsWith(`  ${k}: {`)) ?? '';
  it('equal side cells around the 0, not space-between', () => {
    assert.doesNotMatch(style('scaleRow'), /space-between/);
    assert.match(style('scaleLeft'), /flex: 1,/);
    assert.match(style('scaleRight'), /flex: 1,/);
    assert.doesNotMatch(style('scaleMid'), /flex/);
  });
  it('aligned left, centre, right', () => {
    assert.match(T, /styles\.scaleLeft\]\}>−50 FLAT</);
    assert.match(T, /styles\.scaleMid\]\}>0</);
    assert.match(T, /styles\.scaleRight\]\}>SHARP \+50</);
    assert.match(style('scaleLeft'), /textAlign: 'left'/);
    assert.match(style('scaleMid'), /textAlign: 'center'/);
    assert.match(style('scaleRight'), /textAlign: 'right'/);
  });
});
