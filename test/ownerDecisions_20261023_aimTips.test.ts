/**
 * Owner 2026-10-23: the 60° aim-tip wording ("Turn the front … either way —
 * the X stays in front of the mic, a little off its axis.") also applies to
 * the tips with other angles (35°, 40°, 45°, 70°) and to the templates.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = join(import.meta.dirname, '..', 'src', 'screens', 'lab', 'miking');
const files: string[] = [];
(function walk(d: string) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(n)) files.push(p);
  }
})(ROOT);
const all = files.map((f) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n')).join('\n');

describe('aim tips all use the owner wording', () => {
  it('no tip says the mic "still faces / points / looks" at the source', () => {
    assert.doesNotMatch(all, /either way — it still (faces|points|looks)/);
  });
  it('no "Swing the front up to N° either way" remains', () => {
    assert.doesNotMatch(all, /Swing the (front|face|capsule) (up to [^ ]+ )?either way/);
  });
  it('the other angles carry the new wording', () => {
    for (const s of [
      'Turn the front up to 70° either way — the bell stays in front of the mic, a little off its axis.',
      'Turn the front up to 35° either way — the speaker stays in front of the mic, a little off its axis.',
      'Turn the capsule up to 45° either way — the mouth stays in front of the mic, a little off its axis.',
      'Turn the face up to 45° either way — the kit stays in front of the mic, a little off its axis.',
      'Turn the front up to 45° either way — the ${n.one} stays in front of the mic, a little off its axis.',
      'Turn the front up to 45° either way — ${o.context.facing} stays in front of the mic, a little off its axis.',
      'Turn the front up to 40° either way.',
    ]) assert.ok(all.includes(s), s);
  });
});
