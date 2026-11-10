// The dev VISUAL INDEX must never reach a phone (owner 2026-11-10: "make sure
// it is not on any phones"). Every place that draws it is behind __DEV__, which
// is false in store builds and in every OTA bundle.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) ? [p] : [];
  });
}

describe('dev visual index is dev-only', () => {
  it('every <DevVisualIndex /> is drawn only under __DEV__', () => {
    let uses = 0;
    // The index's own file names itself in its doc comment; it is not a mount.
    for (const f of files('src').filter((x) => !/DevVisualIndex\.tsx$/.test(x))) {
      const src = readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
      for (const m of src.matchAll(/<DevVisualIndex\b/g)) {
        uses += 1;
        const before = src.slice(Math.max(0, (m.index ?? 0) - 20), m.index);
        assert.match(before, /__DEV__ \? $/, `${f}: <DevVisualIndex /> outside a __DEV__ gate`);
      }
    }
    assert.ok(uses > 0, 'expected the index to be mounted somewhere');
  });
});
