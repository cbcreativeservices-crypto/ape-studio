/**
 * Miking Labs — a view key is shown only where pressing it changes the picture
 * (owner, Pixel 2026-10-06: "some displays showed both above and side views
 * but in full screen some of the view buttons didn't matter … Useless buttons
 * should just be hidden.").
 *
 * A DualView stage shows one view with the other as an inset on the glass
 * (the key swaps them) but BOTH views in full screen (the key would change
 * nothing): its key is `hideInFull`, and the rack's full-screen dock leaves
 * it out. A single-view stage keeps its key everywhere.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { viewToggle } from '../src/screens/lab/miking/engine/scene/viewToggle.ts';

const ROOT = new URL('../src/screens/lab/miking/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const files: string[] = [];
const walk = (d: string) => {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(n)) files.push(p);
  }
};
walk(ROOT);
const rel = (p: string) => p.slice(ROOT.length).replace(/\\/g, '/');
const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

describe('viewToggle()', () => {
  const set = () => {};
  it('a DualView stage: the key works on the glass and is hidden in full screen', () => {
    const [k] = viewToggle({ view: 'side', setView: set, stage: 'dual' });
    assert.equal(k.kind, 'toggle');
    assert.equal((k as { hideInFull?: boolean }).hideInFull, true);
  });
  it('a single-view stage keeps its key in full screen', () => {
    const [k] = viewToggle({ view: 'top', setView: set, stage: 'single', labels: ['SIDE VIEW', 'FROM ABOVE'] });
    assert.equal((k as { hideInFull?: boolean }).hideInFull, undefined);
    assert.equal((k as { label: string }).label, 'FROM ABOVE');
  });
  it('a model with one view gets no key at all', () => {
    assert.deepEqual(viewToggle({ view: 'side', setView: set, stage: 'dual', both: false }), []);
  });
});

describe('every Miking view key goes through viewToggle, with the right stage', () => {
  it('no hand-built SIDE / TOP view toggle is left (the room plan keeps its own single-view key)', () => {
    const raw = files.filter((f) => /kind: 'toggle', id: 'view'/.test(read(f))).map(rel);
    assert.deepEqual(raw, ['lessons/m10Room/PRoomSetting.tsx']);
  });
  it("a 'dual' key belongs to a DualView of the same view; a 'single' key to a one-view stage", () => {
    const bad: string[] = [];
    for (const f of files) {
      const s = read(f);
      for (const m of s.matchAll(/viewToggle\(\{ view: (\w+), setView: \w+, stage: '(dual|single)'/g)) {
        const [, v, stage] = m;
        const dual = new RegExp(`<DualView[^>]*\\bview=\\{${v}\\}`).test(s);
        const single = new RegExp(`<(?!DualView)\\w+[^>]*\\bview=\\{${v}\\}`).test(s);
        if (stage === 'dual' && !dual) bad.push(`${rel(f)}: '${v}' marked dual, no DualView draws it`);
        if (stage === 'single' && !single) bad.push(`${rel(f)}: '${v}' marked single, no one-view stage draws it`);
      }
    }
    assert.deepEqual(bad, []);
  });
});

describe('the rack hides a hideInFull key in full screen only', () => {
  const s = readFileSync(new URL('../src/screens/lab/rack/RackUnit.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  it('the full-screen dock is built with inFull = true, the inline one with false', () => {
    assert.match(s, /controls=\{dockFor\(true\)\}/);
    assert.match(s, /\{dockFor\(false\)\}<\/View>/);
    assert.match(s, /if \(inFull && \(p\.kind === 'toggle' \|\| p\.kind === 'options'\) && p\.hideInFull\) return null;/);
  });
});
