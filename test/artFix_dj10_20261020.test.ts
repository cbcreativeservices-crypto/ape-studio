/**
 * DJ-10 (owner 2026-10-20): Screen 20's unbalanced 20 m run is drawn as an
 * XLR-ended lead whose CABLE is unbalanced (thinner, plain, an UNBAL flag) —
 * never TRS plug faces on the mixer's male and the stage box's female XLRs
 * (rule C13: every plug drawn fits its jack).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

describe('DJ-10: the unbalanced run keeps XLR plugs at both ends', () => {
  it('Screen 20 never draws a TRS plug for the unbalanced lead', () => {
    const p20 = read('src/screens/lab/dj/pages/p20Pa.tsx');
    assert.doesNotMatch(p20, /kind: unbal \? 'trs' : 'xlr'/);
    assert.match(p20, /r=\{\{ id: `v\$\{r\.to\}`, kind: 'xlr',[^}]*label: `\$\{from === 'L' \? 'MST L' : 'MST R'\}\$\{unbal \? ' · UNBAL' : ''\}`[^}]*unbal \}\}/);
  });
  it('the cable shows it: thinner, plain jacket, an amber-edged flag', () => {
    const c = read('src/screens/lab/dj/art/cables.tsx');
    assert.match(c, /unbal\?: boolean;/);
    assert.match(c, /if \(r\.unbal\) return \{ colour: '#24262b', width: WIDTH\[k\] \* 0\.6, pattern: r\.dashed \? 'dash' : 'plain' \};/);
    assert.match(c, /edge=\{r\.unbal \? INK\.amber :/);
  });
});
