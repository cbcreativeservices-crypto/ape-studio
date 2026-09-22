/**
 * SQLite-backed offline glossary (owner 2026-09-22).
 *
 * "the glossary needs to work offline after being loaded. a user lets say who
 * works on a cruise will not be able to load it every time."
 *
 * Until now there was NO persistence of any kind: the corpus lived in a
 * module-level variable, so every cold start re-downloaded all 31,858 terms and
 * a user with no signal had no glossary at all.
 *
 * Native only — Metro picks this on ios/android; web resolves the in-memory
 * sibling (offlineCorpus.ts), because expo-sqlite's web build needs
 * SharedArrayBuffer + wa-sqlite wasm and must never enter the web bundle. Same
 * split, and same reason, as submissionQueueStorage.
 *
 * ⛔ SCHEMA CHANGES NEED A MIGRATION. `CREATE TABLE IF NOT EXISTS` does not
 * ALTER a table an existing install already has, so adding a column here
 * without a `PRAGMA user_version` migration makes every insert throw on
 * upgrade. Same warning as the quiz queue in this database.
 *
 * WRITES ARE ASYNC AND TRANSACTIONAL. 31,858 individual synchronous inserts
 * would block the JS thread for seconds — which is the exact failure this
 * whole change exists to remove.
 */
import * as SQLite from 'expo-sqlite';

export type OfflineTerm = { id: string; term: string; achievement_id: string | null };

const db = SQLite.openDatabaseSync('ape-studio.db');

db.execSync(`CREATE TABLE IF NOT EXISTS glossary_corpus (
  id TEXT PRIMARY KEY,
  term TEXT NOT NULL,
  achievement_id TEXT,
  definition TEXT,
  src TEXT NOT NULL
);`);
db.execSync(`CREATE TABLE IF NOT EXISTS glossary_meta (k TEXT PRIMARY KEY, v TEXT NOT NULL);`);
// Ordering the list by term is the single hottest read; without this the first
// paint pays a full sort of 31,858 rows.
db.execSync(`CREATE INDEX IF NOT EXISTS glossary_corpus_term ON glossary_corpus (term);`);

/**
 * `src` is the view the rows came from — `glossary` or `glossary_browse_v`.
 * They are NOT interchangeable: the browse view masks definitions to a teaser
 * for non-members, so serving a member rows cached as a guest would show them
 * truncated definitions they have paid for. Every read is scoped by it.
 */
export async function loadTerms(src: string): Promise<OfflineTerm[]> {
  return (await db.getAllAsync<OfflineTerm>(
    'SELECT id, term, achievement_id FROM glossary_corpus WHERE src = ? ORDER BY term',
    [src],
  )) as OfflineTerm[];
}

export async function saveTerms(src: string, rows: OfflineTerm[]): Promise<void> {
  await db.withTransactionAsync(async () => {
    // A term removed upstream must disappear locally too, so the set is
    // replaced rather than merged. Definitions are re-attached below.
    await db.runAsync('DELETE FROM glossary_corpus WHERE src = ?', [src]);
    const stmt = await db.prepareAsync(
      'INSERT OR REPLACE INTO glossary_corpus (id, term, achievement_id, definition, src) VALUES (?,?,?,NULL,?)',
    );
    try {
      for (const r of rows) await stmt.executeAsync([r.id, r.term, r.achievement_id, src]);
    } finally {
      await stmt.finalizeAsync();
    }
  });
}

/** Definitions already on the device, for the ids asked about. */
export async function loadDefinitions(src: string, ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!ids.length) return out;
  // SQLite's variable limit is 999 by default — chunk rather than risk it.
  for (let i = 0; i < ids.length; i += 900) {
    const slice = ids.slice(i, i + 900);
    const marks = slice.map(() => '?').join(',');
    const rows = (await db.getAllAsync<{ id: string; definition: string | null }>(
      `SELECT id, definition FROM glossary_corpus WHERE src = ? AND definition IS NOT NULL AND id IN (${marks})`,
      [src, ...slice],
    )) as { id: string; definition: string | null }[];
    for (const r of rows) if (r.definition) out.set(r.id, r.definition);
  }
  return out;
}

export async function saveDefinitions(
  src: string,
  rows: { id: string; definition: string | null }[],
): Promise<void> {
  const keep = rows.filter((r) => !!r.definition);
  if (!keep.length) return;
  await db.withTransactionAsync(async () => {
    const stmt = await db.prepareAsync(
      'UPDATE glossary_corpus SET definition = ? WHERE id = ? AND src = ?',
    );
    try {
      for (const r of keep) await stmt.executeAsync([r.definition, r.id, src]);
    } finally {
      await stmt.finalizeAsync();
    }
  });
}

/** How complete the offline copy is — drives the "available offline" readout. */
export async function corpusStats(src: string): Promise<{ terms: number; definitions: number }> {
  const r = await db.getFirstAsync<{ terms: number; definitions: number }>(
    'SELECT COUNT(*) AS terms, COUNT(definition) AS definitions FROM glossary_corpus WHERE src = ?',
    [src],
  );
  return { terms: r?.terms ?? 0, definitions: r?.definitions ?? 0 };
}

/** Ids with no definition stored yet, oldest-first by term for stable paging. */
export async function idsMissingDefinitions(src: string, limit: number): Promise<string[]> {
  const rows = (await db.getAllAsync<{ id: string }>(
    'SELECT id FROM glossary_corpus WHERE src = ? AND definition IS NULL ORDER BY term LIMIT ?',
    [src, limit],
  )) as { id: string }[];
  return rows.map((r) => r.id);
}

export async function getMeta(k: string): Promise<string | null> {
  const r = await db.getFirstAsync<{ v: string }>('SELECT v FROM glossary_meta WHERE k = ?', [k]);
  return r?.v ?? null;
}

export async function setMeta(k: string, v: string): Promise<void> {
  await db.runAsync('INSERT OR REPLACE INTO glossary_meta (k, v) VALUES (?,?)', [k, v]);
}

/** Wipe the offline copy — used when the reader asks for the space back. */
export async function clearCorpus(): Promise<void> {
  await db.runAsync('DELETE FROM glossary_corpus');
  await db.runAsync('DELETE FROM glossary_meta');
}

export const OFFLINE_AVAILABLE = true;
