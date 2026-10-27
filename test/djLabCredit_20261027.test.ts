/**
 * DJ Systems Lab certificate credit [MD:R3] (owner 2026-10-18: the DJ lab is
 * required by BOTH DJ credentials once all 24 screens exist — they do, in
 * builds 39/23; built 2026-10-27).
 *
 * Pins:
 *   • the PERMANENT server key tr_dj (route DJSystemsLab, all-modules) — a
 *     rename would cost every learner the credit once the server row exists;
 *   • the completion rule: every REQUIRED screen done (16–18 are optional);
 *   • the wiring: DJSystemsLabScreen hands PagedLab `labDoneKey`, PagedLab
 *     reports it through reportTrainingComplete once the lab is done, and the
 *     backfill reads the lab's own PagedLab store (`ape:dj-systems:v1`);
 *   • the bundled requirement copy for both DJ credentials, and the generated
 *     seed carries the safe-order warning.
 * The backfill itself is exercised in test/trainingCompletion_20261013.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TRAINING_LABS, isTrainingKey, trainingKeyFor, trainingLabByRoute } from '../src/features/lab/trainingLabKeys.ts';
import { allLabKeys, describeLabKey } from '../src/data/labKeyCatalog.ts';
import { labRequirementsFor } from '../src/data/labRequirements.ts';
import { DJ_LAB_ID, DJ_SCREEN_NUMBERS, djLabComplete, isOptionalNo, numberPages } from '../src/screens/lab/dj/pages/registry.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const has = (file: string, ...needles: string[]) => {
  const src = read(file);
  for (const n of needles) assert.ok(src.includes(n), `${file}: ${n}`);
};

describe('the key', () => {
  it('tr_dj is the DJ Systems Lab’s permanent server key', () => {
    assert.deepEqual(trainingLabByRoute('DJSystemsLab'), { route: 'DJSystemsLab', key: 'tr_dj', completion: 'all-modules' });
    assert.equal(trainingKeyFor('DJSystemsLab'), 'tr_dj');
    assert.equal(isTrainingKey('tr_dj'), true);
    assert.equal(TRAINING_LABS.filter((l) => l.key === 'tr_dj').length, 1);
  });
  it('resolves to a name, an area and the route that opens it; the seed writes its labs row', () => {
    assert.deepEqual(describeLabKey('tr_dj'), { key: 'tr_dj', name: 'DJ Systems Lab', area: 'training', route: 'DJSystemsLab' });
    assert.ok(allLabKeys().some((k) => k.key === 'tr_dj'));
    // The labs row the server needs, exactly as the draft SQL inserts it.
    has('docs/APE_LAB_CERT_REQUIREMENTS_SEED_2026_10_13.sql', "('tr_dj', 'DJ Systems Lab', 'training')");
  });
  it('the lab id that names its PagedLab store never changes', () => {
    assert.equal(DJ_LAB_ID, 'dj-systems');
  });
});

describe('the completion rule (every required screen)', () => {
  const all = DJ_SCREEN_NUMBERS.map((_, i) => i);
  it('24 screens, numbered 1–24 — the same numbers pages/index DJ_PAGE_NO gives', () => {
    assert.deepEqual(DJ_SCREEN_NUMBERS, Array.from({ length: 24 }, (_, i) => i + 1));
    // pages/index.ts: the page list, and the one declared number.
    const src = read('src/screens/lab/dj/pages/index.ts');
    const list = /export const DJ_PAGES: PageDef\[\] = \[([\s\S]*?)\];/.exec(src)?.[1] ?? '';
    const ids = list.split(',').map((s) => s.trim()).filter(Boolean);
    assert.deepEqual(ids, Array.from({ length: 24 }, (_, i) => `P${String(i + 1).padStart(2, '0')}`));
    assert.ok(src.includes('numberPages(DJ_PAGES, new Map<PageDef, number>([[P19, 19]]))'), 'DJ_PAGE_NO declares only P19');
    assert.deepEqual(numberPages(ids, new Map([['P19', 19]])), [...DJ_SCREEN_NUMBERS]);
  });
  it('every screen done → complete', () => {
    assert.equal(djLabComplete(all), true);
  });
  it('the optional equipment paths (16–18) are not needed', () => {
    const required = all.filter((i) => !isOptionalNo(DJ_SCREEN_NUMBERS[i]));
    assert.equal(required.length, 21);
    assert.equal(djLabComplete(required), true);
  });
  it('any required screen missing → not complete; nothing done → not complete', () => {
    for (const miss of [0, 14, 18, 23]) assert.equal(djLabComplete(all.filter((i) => i !== miss)), false, `screen ${miss + 1}`);
    assert.equal(djLabComplete([]), false);
  });
});

describe('the wiring', () => {
  it('the DJ screen hands PagedLab its whole-lab key', () => {
    has('src/screens/lab/dj/DJSystemsLabScreen.tsx', 'labId={DJ_LAB_ID}', "labDoneKey={trainingKeyFor('DJSystemsLab')}", 'optionalPage={optionalPage}');
  });
  it('PagedLab reports it once the lab is done, through the one training signal', () => {
    has(
      'src/screens/lab/kit/PagedLab.tsx',
      'const labComplete = !!progress && allDone(progress.completed);',
      'if (labDoneKey && labComplete) reportTrainingComplete(labDoneKey);',
      // The "done" rule honours optional pages.
      'return pagesWithCheck.every((_, i) => opt(i) || completed.includes(i));',
    );
  });
  it('the backfill credits a lab finished before this update (builds 39/23 sent nothing)', () => {
    has(
      'src/features/lab/trainingCompletion.ts',
      "import { DJ_LAB_ID, djLabComplete } from '../../screens/lab/dj/pages/registry';",
      "if (!isPagedProgressUnreadable(DJ_LAB_ID) && djLabComplete(p.completed)) add(trainingKeyFor('DJSystemsLab'));",
    );
  });
});

describe('the requirement copy', () => {
  it('both DJ credentials require the DJ Systems Lab', () => {
    for (const slug of ['cert-dj-and-club-sound-v3', 'prog-dj-and-club-audio-v3']) {
      assert.ok(labRequirementsFor(slug).some((r) => r.key === 'tr_dj'), slug);
    }
  });
  it('the generated seed warns against re-running it for the DJ rows (safe order)', () => {
    has('docs/APE_LAB_CERT_REQUIREMENTS_SEED_2026_10_13.sql', 'Do NOT re-run this whole seed to add them', '2026-10-27_R3_DJ_LAB_SQL_DRAFT.sql');
  });
});
