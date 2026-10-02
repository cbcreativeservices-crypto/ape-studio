/**
 * Evening toddler hunt pass 3 (2026-10-02) — CALC area.
 *
 * E3-1 Saved Projects DELETE ignored the store's answer. workflowStore's
 *      deleteProject returns false when the stored list cannot be read (it then
 *      refuses to overwrite it) or the write fails; the screen closed the
 *      dialog and left the project in the list with nothing said. Saved Results
 *      and My Workflows already say "Not deleted" on the same failure.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(path.resolve(HERE, '..', p), 'utf8');
const PROJECTS = read('src/screens/lab/calc/CalcProjectsScreen.tsx');

describe('E3-1 — a failed project delete is reported, like the sibling screens', () => {
  it('removeProject branches on the delete result', () => {
    const start = PROJECTS.indexOf('const removeProject = ');
    const body = PROJECTS.slice(start, PROJECTS.indexOf('\n  };', start));
    assert.doesNotMatch(body, /deleteProject\(p\.id\)\.then\(reload\)/, 'the result must not be thrown away');
    assert.match(body, /deleteProject\(p\.id\)\.then\(\(ok\) => \{/);
    assert.match(body, /if \(!ok\) return notify\('Not deleted'/);
    assert.ok(body.indexOf("notify('Not deleted'") < body.indexOf('reload()'), 'notify on failure, reload on success');
  });
  it('uses the same words as Saved Results and My Workflows', () => {
    const msg = "notify('Not deleted', 'That could not be removed from this device. Nothing was changed — try again.')";
    assert.ok(read('src/screens/lab/calc/CalcResultsScreen.tsx').includes(msg));
    assert.ok(read('src/screens/lab/calc/CalcWorkflowsScreen.tsx').includes(msg));
    assert.ok(PROJECTS.includes(msg));
  });
});
