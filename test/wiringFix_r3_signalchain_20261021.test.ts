/**
 * Wiring round 3 (2026-10-21) — Signal Chain. R3-SC-01: the engine is stereo
 * and the rack draws one patch lane; the owner chose a caption that says the
 * lane is the stereo pair and that outboard is patched at the rear.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

describe('R3-SC-01 — the one drawn lane is the stereo pair, patched at the rear', () => {
  const s = read('src/screens/lab/SignalChainLabScreen.tsx');
  it('the stage carries the caption under the rack', () => {
    assert.match(s, /ONE LANE = THE STEREO PAIR · PATCHED AT THE REAR/);
  });
  it('the rack gives up the caption’s height so nothing overflows the stage', () => {
    assert.match(s, /h=\{h - 20 - 20 - 18\}/);
    assert.match(s, /stageNote: \{[^}]*fontSize: 9[,\s][^}]*lineHeight: 12/);
  });
  it('the caption fits one line without a cap (no "…"; P14 ratchet)', () => {
    const words = 'ONE LANE = THE STEREO PAIR · PATCHED AT THE REAR';
    assert.ok(words.length <= 50, 'about 5 pt a character at 9 pt Oswald: ≤ 50 characters fits a 300 pt stage');
    assert.doesNotMatch(s, /stageNote\} numberOfLines=\{1\}/);
  });
});
