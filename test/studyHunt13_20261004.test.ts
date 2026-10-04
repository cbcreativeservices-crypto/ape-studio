/**
 * STUDY area, hunt 13 (2026-10-04). Each test FAILED against HEAD 642fb8a2
 * (R2: the fixed files were copied aside, `git show HEAD:<path>` written back,
 * this file run, the fixes restored and cmp'd).
 *
 *   1. study/api fetchStudyRowsByIds (the ★ deck, lead leftover) — every
 *      starred id went out in ONE `.in()` read. Measured read-only against the
 *      live API: ~700+ ids is a URL the gateway refuses (HTTP 400), so a large
 *      ★ deck failed to open at all; and the view returns a row PER TOPIC, so
 *      past 1000 rows PostgREST silently dropped the tail. Now chunked ids, each
 *      chunk paged with readAllPages over a total order.
 *   2. study/api fetchTopicMedia — same single read for the ★ deck's images:
 *      refused, and EVERY card silently lost its image. Now chunked.
 *   3. study/api + sessionRetry — a 42501 study read while the session read was
 *      UNKNOWN (refresh unreached / stalled) told a member "Sign in to study
 *      this topic" (catalog K1). Now 'unknown' ("Could not load this topic.").
 *   4. FlashcardsScreen — a global list popup (★ / bookmarks / known) whose
 *      off-deck name read FAILED, or was still loading, read "No terms in this
 *      set." (K2). Now "Loading…" / "could not be loaded" (source-pinned).
 *   5. EnrollmentScreen SEE & EDIT — read the live `useTermList` placeholder
 *      (empty before the ★ list hydrates, and when unreadable) and showed
 *      "· 0 — No terms yet" (K2); now readTermList + newest-open ticket.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const SB_URL = 'ape-studyH13:supabase';
const ENV_URL = 'ape-studyH13:env';
registerHooks({
  resolve(specifier, context, next) {
    if (/lib\/supabase$/.test(specifier)) return { url: SB_URL, shortCircuit: true };
    if (/lib\/env$/.test(specifier)) return { url: ENV_URL, shortCircuit: true };
    if (/^\.{1,2}\//.test(specifier) && !/\.\w+$/.test(specifier) && context.parentURL?.includes('/src/')) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === ENV_URL) {
      return { format: 'module', shortCircuit: true, source: `export const SUPABASE_URL = 'https://example.test'; export const SUPABASE_ANON_KEY = 'k';` };
    }
    if (url === SB_URL) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `
          export const supabase = {
            from(table) { return globalThis.__SH13.from(table); },
            rpc() { return Promise.resolve({ data: null, error: { message: 'no' } }); },
            auth: {
              getSession: () => globalThis.__SH13.getSession(),
              onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
            },
          };
        `,
      };
    }
    return next(url, context);
  },
});

type Row = Record<string, unknown>;
declare global {
  // eslint-disable-next-line no-var
  var __SH13: { from: (table: string) => unknown; getSession: () => Promise<unknown> };
}

/** Like the live gateway + PostgREST: an `.in()` list past MAX_IDS is refused
 *  (HTTP 400), and no request returns more than 1000 rows. */
const MAX_IDS = 600;
function tableOf(rows: Row[], log: { ids: number }[]) {
  let filter: { col: string; vals: Set<unknown> } | null = null;
  let range: [number, number] | null = null;
  const orders: string[] = [];
  const b: Record<string, unknown> = {};
  b.select = () => b;
  b.eq = () => b;
  b.in = (col: string, vals: unknown[]) => {
    filter = { col, vals: new Set(vals) };
    return b;
  };
  b.order = (col: string) => {
    orders.push(col);
    return b;
  };
  b.range = (from: number, to: number) => {
    range = [from, to];
    return b;
  };
  b.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => {
    log.push({ ids: filter?.vals.size ?? 0 });
    if (filter && filter.vals.size > MAX_IDS) {
      return Promise.resolve({ data: null, error: { message: 'Bad Request', code: '400' } }).then(res, rej);
    }
    let out = filter ? rows.filter((r) => filter!.vals.has(r[filter!.col])) : rows.slice();
    if (orders.length) {
      out = out.slice().sort((x, y) => {
        for (const c of orders) {
          const a = String(x[c] ?? ''), z = String(y[c] ?? '');
          if (a !== z) return a < z ? -1 : 1;
        }
        return 0;
      });
    }
    if (range) out = out.slice(range[0], range[1] + 1);
    return Promise.resolve({ data: out.slice(0, 1000), error: null }).then(res, rej);
  };
  return b;
}

const id = (i: number) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`;
const N = 900;
// Each starred term sits in TWO topics, so the view returns 2 rows per term.
const studyRows: Row[] = [];
for (let i = 0; i < N; i++) {
  for (const t of ['topic-a', 'topic-b']) {
    studyRows.push({ glossary_id: id(i), achievement_id: `${t}-${i}`, term: `term ${String(i).padStart(4, '0')}`, definition: 'd', common_mistakes: null });
  }
}
const mediaRows: Row[] = Array.from({ length: N }, (_, i) => ({ glossary_id: id(i), media_type: 'image', url: `img/${i}.png`, sort_order: 0 }));

let calls: { ids: number }[] = [];
globalThis.__SH13 = {
  from: (table: string) =>
    tableOf(table === 'glossary_study_v' ? studyRows : table === 'glossary_media' ? mediaRows : [], calls),
  getSession: async () => ({ data: { session: { user: { id: 'u1' } } }, error: null }),
};

const api = await import('../src/features/study/api.ts');
const retry = await import('../src/features/study/sessionRetry.ts');

describe('1 · the ★ deck reads every starred term', () => {
  it('900 starred terms (1800 view rows) all come back; no request carries a refused id list', async () => {
    calls = [];
    const ids = Array.from({ length: N }, (_, i) => id(i));
    const items = await api.fetchGlossaryItemsByIds(ids);
    assert.equal(items.length, N, 'every starred term is in the deck');
    assert.equal(new Set(items.map((x) => x.id)).size, N, 'each term once');
    assert.ok(calls.every((c) => c.ids <= MAX_IDS), 'no single request carries the whole list');
  });
  it('a chunk whose view rows pass the 1000-row page is read to the end (paged, total order)', async () => {
    const saved = globalThis.__SH13;
    // 150 terms × 10 topics = 1500 rows for one chunk; the LAST row of each
    // term carries common_mistakes, so a dropped page would also lose them.
    const rows: Row[] = [];
    for (let i = 0; i < 150; i++) {
      for (let t = 0; t < 10; t++) {
        rows.push({ glossary_id: id(i), achievement_id: `t${t}`, term: `x${i}`, definition: 'd', common_mistakes: t === 9 ? ['m'] : null });
      }
    }
    globalThis.__SH13 = { ...saved, from: () => tableOf(rows, []) };
    try {
      const items = await api.fetchGlossaryItemsByIds(Array.from({ length: 150 }, (_, i) => id(i)));
      assert.equal(items.length, 150);
      assert.ok(items.every((x) => x.common_mistakes?.length === 1), 'the row past the page edge was read');
    } finally {
      globalThis.__SH13 = saved;
    }
  });
});

describe('2 · the ★ deck keeps its images', () => {
  it('900 starred terms: every image resolves', async () => {
    calls = [];
    const ids = Array.from({ length: N }, (_, i) => id(i));
    const m = await api.fetchTopicMedia(ids);
    assert.equal(Object.keys(m).length, N);
    assert.equal(m[id(5)], 'https://example.test/storage/v1/object/public/img/5.png');
  });
});

describe('4 · Flashcards global list popup: a failed name read is not an empty list (K2)', () => {
  const src = readFileSync(new URL('../src/screens/study/FlashcardsScreen.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  it('the off-deck read records loading / failed', () => {
    assert.match(src, /const \[listFetch, setListFetch\] = useState<'loading' \| 'failed' \| null>\(null\);/);
    const eff = src.slice(src.indexOf('const missing = globalListIds'), src.indexOf('const termListRows = useMemo'));
    assert.match(eff, /setListFetch\('loading'\);\s*fetchGlossaryItemsByIds\(missing\)/);
    assert.match(eff, /\.catch\(\(\) => \{[\s\S]*?if \(!cancelled\) setListFetch\('failed'\);/);
  });
  it('the popup says so instead of "No terms in this set."', () => {
    assert.match(src, /globalListIds && listFetch === 'failed' \? \(\s*<Text style=\{styles\.tlEmpty\}>\s*Some terms in this list could not be loaded\./);
    assert.match(src, /\) : globalListIds && listFetch === 'loading' \? \(\s*<Text style=\{styles\.tlEmpty\}>Loading…<\/Text>\s*\) : globalListIds && listFetch === 'failed' \? null : \(\s*<Text style=\{styles\.tlEmpty\}>No terms in this set\.<\/Text>/);
  });
});

describe('5 · Enrollment SEE & EDIT reads the ★ list after it has loaded (K2)', () => {
  const src = readFileSync(new URL('../src/screens/enrollment/EnrollmentScreen.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  const body = src.slice(src.indexOf('const openCustomList = async'), src.indexOf('// Continue Learning: best active topic'));
  it('awaits readTermList (throws when unreadable) instead of the live placeholder set', () => {
    assert.match(body, /const ids = await readTermList\('starred'\);\s*const items = await fetchGlossaryItemsByIds\(\[\.\.\.ids\]\);/);
    assert.doesNotMatch(src, /fetchGlossaryItemsByIds\(\[\.\.\.starred\]\)/);
  });
  it('newest open wins', () => {
    assert.match(body, /const ticket = \+\+customListTicket\.current;/);
    assert.match(body, /if \(ticket !== customListTicket\.current\) return;/);
    assert.match(body, /if \(ticket === customListTicket\.current\) setCustomListFailed\(true\);/);
  });
});

describe('3 · an unknown session is not a guest (K1)', () => {
  it('withSessionRetry: an unknown session answers "could not load", not "sign in", and does not retry', async () => {
    let reads = 0;
    const denied = () => {
      reads++;
      return Promise.reject(Object.assign(new Error('permission denied for view glossary_study_v'), { code: '42501' }));
    };
    await assert.rejects(
      retry.withSessionRetry(denied, async () => 'unknown' as const),
      (e: unknown) => retry.studyLoadReason(e) === 'unknown',
    );
    assert.equal(reads, 1);
    // A real guest and a real member are unchanged.
    await assert.rejects(retry.withSessionRetry(denied, async () => false), (e: unknown) => retry.studyLoadReason(e) === 'signed-out');
  });

  it('fetchTopicItems: refresh unreached (AuthRetryableFetchError) + 42501 → "Could not load this topic", never "Sign in"', async () => {
    const saved = globalThis.__SH13;
    const deny = () => {
      const b: Record<string, unknown> = {};
      for (const k of ['select', 'eq', 'in', 'order', 'range']) b[k] = () => b;
      const err = { code: '42501', message: 'permission denied for view glossary_study_v' };
      b.maybeSingle = () => Promise.resolve({ data: null, error: err });
      b.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => Promise.resolve({ data: null, error: err }).then(res, rej);
      return b;
    };
    globalThis.__SH13 = {
      from: () => deny(),
      getSession: async () => ({ data: { session: null }, error: { name: 'AuthRetryableFetchError', message: 'fetch failed' } }),
    };
    try {
      await assert.rejects(api.fetchTopicItems('ach-1'), (e: unknown) => {
        const reason = retry.studyLoadReason(e);
        assert.equal(reason, 'unknown');
        assert.doesNotMatch(retry.studyLoadMessage(reason), /sign in/i);
        return true;
      });
    } finally {
      globalThis.__SH13 = saved;
    }
  });
});
