/**
 * v3 curriculum helpers — failure must propagate, not masquerade as empty
 * (audit night 2026-09-13, "systemic root cause").
 *
 * The helpers used to swallow EVERY error into `[]`, so a dead connection was
 * indistinguishable from an empty catalog and screens rendered dishonest
 * blanks. This suite pins the new contract:
 *
 *   - `fetchV3CurriculumStrict` / `fetchV3ProgramsStrict` / `fetchV3CertsStrict`
 *     REJECT on any query failure and resolve `[]` only for a genuinely empty
 *     result set;
 *   - the legacy lenient names still resolve `[]` on failure (their remaining
 *     bare-`.then()` callers must not gain unhandled rejections);
 *   - a FAILED curriculum load is never cached by the session memo (Retry
 *     refetches), while a successful one IS (Bug+Hater A1-07).
 *
 * The supabase client is a module stub (registerHooks, as in
 * measurementStore.test.ts) steered per-table via `globalThis.__apeFrom`.
 */
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

const STUB_URL = 'ape-test:supabase';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.endsWith('lib/supabase')) return { url: STUB_URL, shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === STUB_URL) {
      return {
        format: 'module',
        shortCircuit: true,
        // A thenable query builder: every chained method returns the builder,
        // awaiting it resolves whatever __apeFrom queued for that table.
        source: `
          export const supabase = {
            from(table) {
              const b = {
                then(res, rej) { return Promise.resolve().then(() => globalThis.__apeFrom(table)).then(res, rej); },
              };
              for (const m of ['select', 'eq', 'in', 'order']) b[m] = () => b;
              return b;
            },
          };
        `,
      };
    }
    return next(url, context);
  },
});

const {
  fetchV3Certs,
  fetchV3CertsStrict,
  fetchV3Curriculum,
  fetchV3CurriculumStrict,
  fetchV3Programs,
  fetchV3ProgramsStrict,
} = await import('../src/data/v3Curriculum.ts');

type TableResult = { data: unknown; error: { message: string } | null };
declare global {
  // eslint-disable-next-line no-var
  var __apeFrom: (table: string) => TableResult | Promise<TableResult>;
}

const ok = (data: unknown): TableResult => ({ data, error: null });
const fail = (message: string): TableResult => ({ data: null, error: { message } });

const TOPIC_ROW = {
  id: 'a-1',
  name: 'Decibels',
  global_sequence: 3060,
  field: 'Foundations',
  subject: 'Levels',
  always_free: true,
  applicable_methods: ['flashcards'],
  icon_url: null,
};

// ⚠️ ORDER MATTERS in this file: the curriculum memo is module-level state, so
// the failure cases run before the success case deliberately — each failing
// call also proves the previous failure was not cached.

test('curriculum: a query error REJECTS strict and resolves [] lenient', async () => {
  globalThis.__apeFrom = () => fail('permission denied for table achievements');
  await assert.rejects(fetchV3CurriculumStrict(), /permission denied/);
  // The rejection was not cached — the lenient wrapper triggers a fresh load
  // and maps the same failure to [] for its legacy bare-.then() callers.
  assert.deepEqual(await fetchV3Curriculum(), []);
});

test('curriculum: a thrown network failure propagates through strict', async () => {
  globalThis.__apeFrom = () => Promise.reject(new Error('Network request failed'));
  await assert.rejects(fetchV3CurriculumStrict(), /Network request failed/);
});

test('curriculum: success parses, groups, and IS memo-cached for the session', async () => {
  globalThis.__apeFrom = (table) => {
    assert.equal(table, 'achievements');
    return ok([TOPIC_ROW]);
  };
  const fields = await fetchV3CurriculumStrict();
  assert.equal(fields.length, 1);
  assert.equal(fields[0].field, 'Foundations');
  assert.equal(fields[0].subjects[0].subject, 'Levels');
  assert.equal(fields[0].subjects[0].topics[0].gs, 3060);
  // Session memo (A1-07): once loaded, a later backend outage does not evict
  // the good catalog — both entry points keep serving it.
  globalThis.__apeFrom = () => fail('outage');
  assert.equal(await fetchV3CurriculumStrict(), fields);
  assert.equal(await fetchV3Curriculum(), fields);
});

test('programs: an error on either query REJECTS strict, [] lenient', async () => {
  // First query fails.
  globalThis.__apeFrom = () => fail('permission denied for table programs');
  await assert.rejects(fetchV3ProgramsStrict(), /programs read failed/);
  assert.deepEqual(await fetchV3Programs(), []);
  // Link-table failure — previously ignored outright ({ data: links } with no
  // error check), which rendered every program as topicless and filtered ALL
  // of them away: the dishonest empty this suite exists to prevent.
  globalThis.__apeFrom = (table) =>
    table === 'programs'
      ? ok([{ id: 'p1', slug: 'p', name: 'Program', sequence: 1 }])
      : fail('permission denied for table program_topics');
  await assert.rejects(fetchV3ProgramsStrict(), /program topics read failed/);
  assert.deepEqual(await fetchV3Programs(), []);
});

test('programs: genuine emptiness still resolves [] on BOTH entry points', async () => {
  globalThis.__apeFrom = () => ok([]);
  assert.deepEqual(await fetchV3ProgramsStrict(), []);
  assert.deepEqual(await fetchV3Programs(), []);
});

test('programs: success maps required vs elective topics', async () => {
  globalThis.__apeFrom = (table) =>
    table === 'programs'
      ? ok([{ id: 'p1', slug: 'p', name: 'Program', sequence: 1 }])
      : ok([
          { program_id: 'p1', gs: 3060, seq: 1, is_elective: false },
          { program_id: 'p1', gs: 3070, seq: 2, is_elective: true },
        ]);
  const progs = await fetchV3ProgramsStrict();
  assert.equal(progs.length, 1);
  assert.deepEqual(progs[0].topicsGs, [3060]);
  assert.deepEqual(progs[0].electivesGs, [3070]);
});

test('certificates: error REJECTS strict, [] lenient; genuine empty resolves []', async () => {
  globalThis.__apeFrom = () => fail('permission denied for table certificates');
  await assert.rejects(fetchV3CertsStrict(), /certificates read failed/);
  assert.deepEqual(await fetchV3Certs(), []);
  globalThis.__apeFrom = (table) =>
    table === 'certificates'
      ? ok([{ id: 'c1', slug: 'c', name: 'Cert', sequence: 1 }])
      : fail('permission denied for table certificate_topics');
  await assert.rejects(fetchV3CertsStrict(), /certificate topics read failed/);
  globalThis.__apeFrom = () => ok([]);
  assert.deepEqual(await fetchV3CertsStrict(), []);
});
