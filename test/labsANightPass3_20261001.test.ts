/**
 * Labs A + Mastering — night bug pass 3 (2026-10-01).
 *
 *  • MasteringLabScreen: Module 8 ticks are not written before the first
 *    load (they were built on an empty pre-load copy and replaced the stored
 *    lists); the load merges them in, and Module 8 remounts on `loaded` so it
 *    reads the merged lists.
 *  • LabCategoryScreen (reachable by the `labs/:id` deep link): OPEN arms the
 *    members-only preview like the Ear Lab, and a second OPEN inside 600 ms
 *    is ignored.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) =>
  readFileSync(join(process.cwd(), p), 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

describe('MasteringLabScreen (pass 3): Module 8 ticks before the load', () => {
  const s = read('src/screens/lab/mastering/MasteringLabScreen.tsx');
  it('onProjectState holds pre-load ticks instead of writing them', () => {
    const body = s.slice(s.indexOf('const onProjectState'), s.indexOf('const scenarios ='));
    assert.match(body, /if \(!loadedRef\.current\) \{\s*\n\s*preProjectRef\.current = \{ checks, qc \};\s*\n\s*return;/);
    assert.ok(body.indexOf('preProjectRef.current =') < body.indexOf('updateMasteringProgress'));
  });
  it('the load merges the held ticks into the stored lists', () => {
    assert.match(s, /const checks = \[\.\.\.new Set\(\[\.\.\.\(p\?\.checks \?\? \[\]\), \.\.\.pre\.checks\]\)\];/);
    assert.match(s, /const qc = \[\.\.\.new Set\(\[\.\.\.\(p\?\.qc \?\? \[\]\), \.\.\.pre\.qc\]\)\];/);
    assert.match(s, /setQcComplete\(qc\.length >= PROJECT_QC\.length\);/);
  });
  it('Module 8 remounts once the load lands', () => {
    assert.match(s, /key=\{mod\.id === 'project' && !loaded \? 'project:pre-load' : mod\.id\}/);
  });
});

describe('LabCategoryScreen (pass 3): the Ear Lab open rule', () => {
  const s = read('src/screens/lab/LabCategoryScreen.tsx');
  it('arms the preview for a resolved non-member on a members-only leaf', () => {
    assert.match(s, /resolved && !isMember && \(cat\.section === 'training' \|\| !!leaf\.member\)/);
    const open = s.slice(s.indexOf('const open = '), s.indexOf('return (', s.indexOf('const open = ')));
    assert.ok(open.indexOf('startLabPreview(') >= 0 && open.indexOf('startLabPreview(') < open.indexOf('go(leaf.route'));
  });
  it('ignores a second OPEN inside 600 ms', () => {
    assert.match(s, /if \(now - lastOpenAt\.current < 600\) return;/);
  });
});
