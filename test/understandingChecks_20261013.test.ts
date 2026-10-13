/**
 * Practice-lab understanding checks (owner 2026-10-13: practice labs with no
 * lessons complete by passing a short understanding check).
 *
 * Ratchet: every TRAINING_LABS row with completion 'understanding' has an
 * authored check of 3–5 questions; every question has 3–5 distinct options,
 * exactly one correct option (matched by value) and an explanation; ids are
 * unique per lab; no brand or model names; the checks are registered in
 * UNDERSTANDING_CHECKS. ⏸ The content is on HOLD for owner review.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TRAINING_LABS, UNDERSTANDING_LAB_IDS } from '../src/features/lab/trainingLabKeys.ts';
import { PRACTICE_LAB_CHECKS } from '../src/features/lab/understandingChecks.ts';

const understandingLabs = TRAINING_LABS.filter((l) => l.completion === 'understanding');

// Case-sensitive on purpose: generic words such as "waves" must not trip it.
const BRAND_DENYLIST = [
  'Auto-Tune', 'Antares', 'Melodyne', 'Shure', 'SM57', 'SM58', 'Neumann', 'U87', 'Sennheiser', 'AKG',
  'Audio-Technica', 'Electro-Voice', 'Royer', 'Coles', 'Yamaha', 'DX7', 'Moog', 'Roland', 'Korg',
  'Fender', 'Marshall', 'Mesa', 'Eventide', 'Lexicon', 'FabFilter', 'Universal Audio', 'Crown', 'QSC',
  'Behringer', 'Mackie', '12AX7', 'EL34', 'EL84', '6L6', 'KT88', '6550', '12AU7', '12AT7',
];

test('every understanding-completion lab has a labId and 3–5 questions', () => {
  assert.ok(understandingLabs.length > 0);
  for (const lab of understandingLabs) {
    const id = UNDERSTANDING_LAB_IDS[lab.route];
    assert.ok(id, `${lab.route}: no runtime labId mapped`);
    const qs = PRACTICE_LAB_CHECKS[id];
    assert.ok(qs, `${lab.route} (${id}): no check authored`);
    assert.ok(qs.length >= 3 && qs.length <= 5, `${lab.route} (${id}): ${qs.length} questions, want 3–5`);
  }
});

test('no authored check is orphaned — every key is a labId some understanding lab uses', () => {
  const used = new Set(understandingLabs.map((l) => UNDERSTANDING_LAB_IDS[l.route]));
  for (const labId of Object.keys(PRACTICE_LAB_CHECKS)) {
    assert.ok(used.has(labId), `${labId}: authored but no understanding lab maps to it`);
  }
});

test('every question has distinct options, exactly one correct by value, and an explanation', () => {
  for (const [labId, qs] of Object.entries(PRACTICE_LAB_CHECKS)) {
    const ids = new Set<string>();
    for (const q of qs) {
      const where = `${labId}/${q.id}`;
      assert.ok(q.id && !ids.has(q.id), `${where}: missing or duplicate id`);
      ids.add(q.id);
      assert.ok(q.prompt.trim().length > 10, `${where}: prompt too short`);
      assert.ok(q.options.length >= 3 && q.options.length <= 5, `${where}: ${q.options.length} options`);
      assert.equal(new Set(q.options).size, q.options.length, `${where}: duplicate options`);
      assert.equal(q.options.filter((o) => o === q.correct).length, 1, `${where}: correct must match exactly one option`);
      assert.ok(q.explanation.trim().length > 20, `${where}: explanation missing`);
    }
  }
});

test('no brand or model names in any question text', () => {
  for (const [labId, qs] of Object.entries(PRACTICE_LAB_CHECKS)) {
    for (const q of qs) {
      const text = [q.prompt, ...q.options, q.explanation].join(' \n ');
      for (const name of BRAND_DENYLIST) {
        assert.ok(!text.includes(name), `${labId}/${q.id}: contains "${name}"`);
      }
    }
  }
});

test('the checks are registered in UNDERSTANDING_CHECKS and the file carries the HOLD marker', () => {
  const reg = readFileSync('src/features/lab/understanding.ts', 'utf8');
  assert.match(reg, /import \{ PRACTICE_LAB_CHECKS \} from '\.\/understandingChecks';/);
  assert.match(reg, /\.\.\.PRACTICE_LAB_CHECKS,/);
  const data = readFileSync('src/features/lab/understandingChecks.ts', 'utf8');
  assert.ok(data.startsWith('// ⏸ HOLD — owner review required before release (owner 2026-10-13).'));
});
