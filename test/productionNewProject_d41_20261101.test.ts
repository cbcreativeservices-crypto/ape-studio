/**
 * D41 bugs #18 / #20 (owner approved 2026-11-01): once a project existed in
 * Pre- or Post-Production, START A PROJECT was never shown again and DUPLICATE
 * kept the type, so a learner could not begin a project of ANOTHER type (and
 * so never reached the exercises filtered to it) without deleting theirs.
 *
 * The open-project home now carries + NEW PROJECT after the project chips. It
 * lists the same three types and creates through the same guarded `start`.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const SRC = read('src/screens/lab/production/ProductionLabScreen.tsx');

test('+ NEW PROJECT sits on the open-project home, after the chips, and opens the three types', () => {
  const openBranch = SRC.slice(SRC.indexOf(') : projects.length === 0 || !project ? ('));
  const afterStart = openBranch.slice(openBranch.indexOf('<>'));
  const chips = afterStart.indexOf('projects.map((p) => (');
  const plus = afterStart.indexOf('>+ NEW PROJECT</Text>');
  assert.ok(chips > 0 && plus > chips, '+ NEW PROJECT follows the project chips in the open-project branch');
  // The chip row shows even with ONE project, so the control is always reachable.
  assert.match(afterStart, /<View style=\{styles\.switcher\}>\s*\n\s*\{projects\.length > 1\s*\n\s*\? projects\.map/);
  assert.match(afterStart, /onPress=\{\(\) => setChoosingType\(\(v\) => !v\)\}/);
  assert.match(afterStart, /\{choosingType \? \(\s*\n\s*<View style=\{styles\.startBlock\}>[\s\S]*?\{pathwayRows\}/);
});

test('both lists are the same rows, and they create only through the guarded start()', () => {
  assert.equal((SRC.match(/\{pathwayRows\}/g) ?? []).length, 2, 'START A PROJECT and + NEW PROJECT share the rows');
  assert.match(SRC, /const pathwayRows = LAUNCH_PATHWAYS\.map\(\(p\) => \([\s\S]*?onPress=\{\(\) => void start\(p\)\}/);
  assert.equal((SRC.match(/newProject\(/g) ?? []).length, 1, 'one creation path');
  // Success closes the picker and drops a rename draft typed on the old project.
  const fn = SRC.slice(SRC.indexOf('const start = useCallback('), SRC.indexOf('[reload, lab, def]'));
  assert.match(fn, /if \(startingRef\.current\) return;/);
  assert.ok(fn.indexOf('if (!ok) {') < fn.indexOf('setChoosingType(false)'), 'a refused save leaves the picker open');
  assert.match(fn, /setNameDraft\(null\);\s*\n\s*setChoosingType\(false\);\s*\n\s*await reload\(\);\s*\n\s*setOpenId\(p\.id\);/);
});

test('the home and start guides describe + NEW PROJECT instead of "started … instead?"', () => {
  for (const f of ['preprodScreenGuides.ts', 'postprodScreenGuides.ts']) {
    const g = read('src/screens/lab/production/' + f);
    assert.doesNotMatch(g, /project instead\?/, `${f}: no "started X instead?" — there was no way to start one`);
    assert.match(g, /the last( one)?, \+ NEW PROJECT, starts (another|one)\./, `${f}: home seeing`);
    assert.match(g, / \+ NEW PROJECT, then a type, starts another\./, `${f}: home control`);
    assert.match(g, /\+ NEW PROJECT (there )?starts another project of any type/, `${f}: start control`);
  }
});
