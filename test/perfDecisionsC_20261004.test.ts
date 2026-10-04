/**
 * PERF DECISIONS 2026-10-04 (owner: "do your recommendations, favoring
 * consistency and learning outcomes") — receipts, agent C.
 *
 *  1. Mastering: the LISTEN step pre-renders quietly once it settles, behind
 *     an honest "Preparing the audio…"; LEARN steps never pay; a ▶ joins; a
 *     step change cancels.
 *  2. Topic terms: a session cache keyed by (auth uid, tier, achievementId),
 *     cleared on identity / tier change and by the account wipe; never a
 *     failure, never an empty answer.
 *  3. Tube signed URLs: the 90 s memo is cleared by the account wipe.
 *  4. Awards pager: CurriculumView / EnrollmentView are memoised.
 *  5. Saved Results / Saved Projects: FlatList with the three faces as the
 *     empty face.
 *  6. program_topics (1016 rows, all active) is paged past PostgREST's
 *     1000-row cap.
 *
 * Every block fails on HEAD 401df890.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// ── a fake Supabase + env, and extensionless .ts resolution under src/ ──────
const SB_URL = 'ape-perfC:supabase';
const ENV_URL = 'ape-perfC:env';
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
    if (url === ENV_URL) return { format: 'module', shortCircuit: true, source: `export const SUPABASE_URL = 'https://example.test';` };
    if (url === SB_URL) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `
          export const supabase = {
            from(table) { return globalThis.__SBC.from(table); },
            auth: {
              getSession: () => globalThis.__SBC.getSession(),
              onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
            },
            functions: { invoke: (name, opts) => globalThis.__SBC.invoke(name, opts) },
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
  var __SBC: {
    from: (table: string) => unknown;
    getSession: () => Promise<unknown>;
    invoke: (name: string, opts: unknown) => Promise<unknown>;
  };
}
/** A query builder over fixed rows that honours `.range` — and, like
 *  PostgREST, never returns more than 1000 rows to one request. */
function tableOf(rows: Row[], calls: { range: [number, number] | null }[]) {
  const q: { range: [number, number] | null } = { range: null };
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'in', 'order']) b[m] = () => b;
  b.range = (from: number, to: number) => {
    q.range = [from, to];
    return b;
  };
  b.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => {
    calls.push({ range: q.range });
    const slice = q.range ? rows.slice(q.range[0], q.range[1] + 1) : rows;
    return Promise.resolve({ data: slice.slice(0, 1000), error: null }).then(res, rej);
  };
  return b;
}
globalThis.__SBC = {
  from: () => tableOf([], []),
  getSession: async () => ({ data: { session: null }, error: null }),
  invoke: async () => ({ data: null, error: null }),
};

// ── 1. Mastering: quiet pre-render on the LISTEN step ───────────────────────
describe('1 · Mastering LISTEN pre-render', () => {
  const DIR = 'src/screens/lab/mastering';
  const hook = strip(read(`${DIR}/useMasterPlayback.ts`));
  it('the hook takes the LISTEN step and pre-renders only when the host is on it, after the page settles', () => {
    assert.match(hook, /export function useMasterPlayback\(variants: readonly MasterVariant\[\], matched: boolean, listenStep\?: number\): MasterPlayback/);
    assert.match(hook, /export const MASTER_PRERENDER_MS = 900;/);
    const eff = hook.slice(hook.indexOf('if (listenStep == null || hostStep !== listenStep) return;'));
    assert.ok(eff.length > 0 && hook.includes('if (listenStep == null || hostStep !== listenStep) return;'), 'LEARN / PRACTICE steps never pay');
    assert.match(eff, /if \(!aliveRef\.current \|\| !focusedRef\.current\) return;\s*if \(idsRef\.current\.length > 0 \|\| renderingSigRef\.current !== null\) return;/);
    assert.match(eff, /void renderAllRef\.current\(true\);\s*\}, MASTER_PRERENDER_MS\);/);
    assert.match(eff, /\}, \[signature, hostStep, listenStep\]\);/);
  });
  it('the quiet render never plays by itself, says nothing, and a ▶ joins it (the double-tap guard)', () => {
    const body = hook.slice(hook.indexOf('const renderAll = useCallback'), hook.indexOf('const renderAllRef'));
    assert.match(body, /async \(quiet = false\) =>/);
    assert.match(body, /if \(!quiet\) AccessibilityInfo\.announceForAccessibility/);
    assert.match(body, /if \(renderingSigRef\.current === signature\) return;/, 'a ▶ during the pre-render returns and is played by it');
    // Sound OFF and nothing queued: the DSP lands, the audio session is untouched.
    assert.match(body, /if \(pendingRef\.current == null && !isAudioOutputEnabled\(\)\) \{[\s\S]*?setStatus\('idle'\);\s*return;\s*\}/);
    // Still the house fence, and a queued play only when it reports started.
    assert.match(body, /const fenced = await startFenced\(\{\s*start: \(\) => player\.load\(clips\),/);
    assert.match(body, /if \(fenced\.status === 'started' && want && focusedRef\.current\)/);
    // Prepared DSP is reused by the ▶ that follows (no second programme pass).
    assert.match(body, /if \(prepared && prepared\.sig === signature\) \{\s*\(\{ clips, ids, measuredNext \} = prepared\);/);
    assert.match(hook, /const blocked = armFence\(\(\) => aliveRef\.current && focusedRef\.current\);/, 'the replay keeps armFence');
  });
  it('a step change cancels a render under way', () => {
    const eff = hook.slice(hook.indexOf('const stepSeen = useRef(hostStep);'));
    assert.match(eff, /stopAll\(\);\s*if \(renderingSigRef\.current !== null\) \{\s*renderSeqRef\.current\+\+;\s*renderingSigRef\.current = null;/);
  });
  it('the ▶ surfaces say "preparing the audio…" honestly', () => {
    assert.match(hook, /preparing: status === 'rendering' && pending == null,/);
    assert.match(strip(read(`${DIR}/kit.tsx`)), /if \(rendering && !pending\) text = 'preparing the audio… — ▶ plays as soon as it is ready';/);
    const st = read(`${DIR}/stages.tsx`);
    assert.match(st, /\{preparing \? 'preparing the audio… ▶ plays as soon as it is ready' : 'press ▶ on a version — the render draws here'\}/);
    assert.match(st, /preparing \? `Preparing the audio\. Play \$\{label\} when ready`/);
  });
  it('each LISTEN module passes the index of its LISTEN step — and it IS the LISTEN step', () => {
    for (const f of ['mod1What', 'mod5Workflow', 'mod6Loudness']) {
      const s = read(`${DIR}/modules/${f}.tsx`);
      const n = Number(/const LISTEN_STEP = (\d+);/.exec(s)?.[1]);
      const kinds = [...s.matchAll(/, kind: '(LEARN|LISTEN|EXPLORE|PRACTICE|REVIEW)', layout:/g)].map((m) => m[1]);
      assert.equal(kinds[n], 'LISTEN', `${f}: step ${n} is ${kinds[n]}`);
      assert.match(s, /useMasterPlayback\(variants, matched, LISTEN_STEP\)/, f);
      assert.match(s, /<WaveOverviewStage[^\n]*preparing=\{pb\.preparing\}/, f);
    }
  });
});

// ── 2. Topic terms: session cache keyed by (uid, tier, achievementId) ───────
describe('2 · topic terms session cache', async () => {
  const c = await import('../src/features/study/topicItemsCache.ts');
  const reg = await import('../src/features/storage/localStoreRegistry.ts');
  const item = (id: string, mistakes: string[] | null) =>
    ({ id, term: id, definition: 'd', common_mistakes: mistakes }) as never;
  let reads = 0;
  const memberRows = () => (reads++, Promise.resolve([item('a', ['members-only'])]));
  const freeRows = () => (reads++, Promise.resolve([item('a', null)]));

  it('the tier is part of the key: a member answer is never served to a non-member, nor the reverse', async () => {
    reg.resetRegisteredLocalStores();
    reads = 0;
    const m1 = await c.cachedTopicItems('u1', 'member', 'gs10', memberRows);
    const m2 = await c.cachedTopicItems('u1', 'member', 'gs10', memberRows);
    assert.equal(reads, 1, 'the second study method reads from the cache');
    assert.deepEqual(m2, m1);
    const f1 = await c.cachedTopicItems('u1', 'free', 'gs10', freeRows);
    assert.equal(reads, 2, 'a tier change reads again');
    assert.equal((f1[0] as { common_mistakes: unknown }).common_mistakes, null, 'the non-member never gets the member rows');
    const m3 = await c.cachedTopicItems('u1', 'member', 'gs10', memberRows);
    assert.equal(reads, 3, 'the tier change dropped the member entry too');
    assert.deepEqual((m3[0] as { common_mistakes: unknown }).common_mistakes, ['members-only']);
  });
  it('an auth identity change clears it (event and read alike); a token refresh for the same uid keeps it', async () => {
    reg.resetRegisteredLocalStores();
    reads = 0;
    await c.cachedTopicItems('u1', 'member', 'gs10', memberRows);
    c.noteTopicAuthUid('u1');
    await c.cachedTopicItems('u1', 'member', 'gs10', memberRows);
    assert.equal(reads, 1, 'same uid: kept');
    c.noteTopicAuthUid('u2');
    await c.cachedTopicItems('u1', 'member', 'gs10', memberRows);
    assert.equal(reads, 2, 'a different uid signed in: cleared');
    await c.cachedTopicItems('u2', 'member', 'gs10', memberRows);
    assert.equal(reads, 3, 'a different reader never gets the first one’s rows');
  });
  it('never caches a failure or an empty result; an unknown identity bypasses it', async () => {
    reg.resetRegisteredLocalStores();
    reads = 0;
    await assert.rejects(c.cachedTopicItems('u1', 'member', 'gs1', () => (reads++, Promise.reject(new Error('outage')))));
    await c.cachedTopicItems('u1', 'member', 'gs1', () => (reads++, Promise.resolve([])));
    await c.cachedTopicItems('u1', 'member', 'gs1', memberRows);
    assert.equal(reads, 3);
    await c.cachedTopicItems(null, 'member', 'gs2', memberRows);
    await c.cachedTopicItems(null, 'member', 'gs2', memberRows);
    assert.equal(reads, 5, 'a stalled session read (uid unknown) is never cached');
  });
  it('the account wipe registry clears it (registered, not exempted)', async () => {
    reg.resetRegisteredLocalStores();
    reads = 0;
    await c.cachedTopicItems('u1', 'member', 'gs10', memberRows);
    reg.resetRegisteredLocalStores();
    await c.cachedTopicItems('u1', 'member', 'gs10', memberRows);
    assert.equal(reads, 2);
    assert.doesNotMatch(read('test/accountWipeRegistry.test.ts'), /topicItemsCache/);
    assert.match(read('src/features/study/topicItemsCache.ts'), /^registerLocalStoreReset\(\(\) => \{\s*cache\.clear\(\);/m);
  });
  it('fetchTopicItems caches only with a known tier, and the study screens pass useTier()', () => {
    const api = read('src/features/study/api.ts');
    assert.match(api, /export async function fetchTopicItems\(achievementId: string, tier\?: string \| null\)/);
    assert.match(api, /if \(!tier \|\| tier === 'unknown' \|\| tier === 'preview'\) return read\(\);/);
    assert.match(api, /const uid = timedOut \? null : \(result\.data\.session\?\.user\?\.id \?\? ''\);/);
    assert.match(api, /noteTopicAuthUid\(session\?\.user\?\.id \?\? ''\)/);
    for (const f of ['study/FlashcardsScreen', 'study/MatchingScreen', 'study/FillInBlankScreen', 'dashboard/DashboardScreen']) {
      const s = read(`src/screens/${f}.tsx`);
      assert.match(s, /const tierForTerms = useTier\(\);/, f);
      assert.match(s, /fetchTopicItems\([A-Za-z]+, tierForTermsRef\.current\)/, f);
    }
  });
});

// ── 3. Tube signed URLs: cleared by the account wipe ────────────────────────
describe('3 · tube signed-URL memo and the account wipe', async () => {
  const tube = await import('../src/screens/lab/tube/tubeRefs.ts');
  const reg = await import('../src/features/storage/localStoreRegistry.ts');
  it('a wipe drops the memo: the next ask goes back to the server', async () => {
    let invokes = 0;
    globalThis.__SBC.getSession = async () => ({ data: { session: { user: { id: 'm1', is_anonymous: false } } }, error: null });
    globalThis.__SBC.invoke = async () => ({ data: { url: `https://signed/${++invokes}` }, error: null });
    const a = await tube.fetchTubePageCached('6l6', 1);
    const b = await tube.fetchTubePageCached('6l6', 1);
    assert.equal(invokes, 1, 'memoised within its 90 s');
    assert.equal(b.url, a.url);
    reg.resetRegisteredLocalStores();
    const c = await tube.fetchTubePageCached('6l6', 1);
    assert.equal(invokes, 2, 'the wipe cleared the memo');
    assert.notEqual(c.url, a.url);
    assert.doesNotMatch(read('test/accountWipeRegistry.test.ts'), /tubeRefs/, 'registered, not exempted');
  });
  it('a fetch in flight across the wipe is not memoised', async () => {
    let invokes = 0;
    let release!: () => void;
    globalThis.__SBC.invoke = () =>
      new Promise((r) => {
        invokes++;
        release = () => r({ data: { url: `https://late/${invokes}` }, error: null });
      });
    reg.resetRegisteredLocalStores();
    const p = tube.fetchTubePageCached('el34', 2);
    await new Promise((r) => setImmediate(r));
    reg.resetRegisteredLocalStores();
    release();
    await p;
    globalThis.__SBC.invoke = async () => ({ data: { url: `https://fresh/${++invokes}` }, error: null });
    await tube.fetchTubePageCached('el34', 2);
    assert.equal(invokes, 2, 'the late answer did not fill the memo after the wipe');
  });
});

// ── 4. Awards pager: the two big pages are memoised ─────────────────────────
describe('4 · Awards pager pages are memoised', () => {
  it('CurriculumView and EnrollmentView are React.memo; the pager passes a stable jump and a boolean', () => {
    assert.match(read('src/screens/curriculum/CurriculumScreen.tsx'), /export const CurriculumView = memo\(function CurriculumView\(\{/);
    assert.match(read('src/screens/enrollment/EnrollmentScreen.tsx'), /export const EnrollmentView = memo\(function EnrollmentView\(\{/);
    const aw = read('src/screens/awards/AwardsScreen.tsx');
    assert.match(aw, /const goToIndex = useCallback\(\(i: number\) => \{[\s\S]*?\}, \[\]\);/);
    assert.match(aw, /const goToPage = useCallback\(\(key: PageKey\) => goToIndex\(PAGE_ORDER\.indexOf\(key\)\), \[goToIndex\]\);/);
    assert.match(aw, /<CurriculumView\s+showBrand=\{false\}\s+onOpenCategory=\{goToPage\}\s+onScreen=\{currentKey === 'curriculum'\}/);
    assert.match(aw, /<EnrollmentView\s+showBrand=\{false\}\s+onOpenCategory=\{goToPage\}\s+onScreen=\{currentKey === 'enrollment'\}/);
  });
});

// ── 5. Saved Results / Saved Projects: virtualised lists ────────────────────
describe('5 · Saved Results and Saved Projects are FlatLists', () => {
  it('Saved Results: FlatList, the three faces as its empty face, no map over the list', () => {
    const s = read('src/screens/lab/calc/CalcResultsScreen.tsx');
    assert.doesNotMatch(s, /results\.map\(/);
    assert.doesNotMatch(s, /<ScrollView/);
    assert.match(s, /<FlatList\s+data=\{loaded \? results : \[\]\}\s+keyExtractor=\{\(r\) => r\.id\}\s+extraData=\{openId\}/);
    const empty = s.slice(s.indexOf('ListEmptyComponent='), s.indexOf('renderItem='));
    const i1 = empty.indexOf('Loading saved results…');
    const i2 = empty.indexOf('Your saved results could not be read from this device just now — they are not lost');
    const i3 = empty.indexOf('Nothing saved yet — finish a workflow run and tap SAVE RESULT on its summary.');
    assert.ok(i1 > 0 && i1 < i2 && i2 < i3, 'loading → unreadable → empty, word for word');
    assert.match(s, /if \(ticket === loadTicket\.current\) setResults\(list\);/, 'newest load wins');
  });
  it('Saved Projects: FlatList for the list, the editor stays a ScrollView', () => {
    const s = read('src/screens/lab/calc/CalcProjectsScreen.tsx');
    assert.doesNotMatch(s, /projects\.map\(/);
    assert.match(s, /\{!editing \? \([\s\S]*?<FlatList\s+data=\{loaded \? projects : \[\]\}\s+keyExtractor=\{\(p\) => p\.id\}/);
    const empty = s.slice(s.indexOf('ListEmptyComponent='), s.indexOf('renderItem='));
    const i1 = empty.indexOf('Loading your projects…');
    const i2 = empty.indexOf('Your saved projects could not be read from this device just now — they are not lost');
    const i3 = empty.indexOf('A project stores a venue or rig’s values');
    assert.ok(i1 > 0 && i1 < i2 && i2 < i3, 'loading → unreadable → empty, word for word');
    assert.match(s, /\) : \(\s*<ScrollView contentContainerStyle=\{\[styles\.scroll, cardColumn\]\} keyboardShouldPersistTaps="handled">\s*<>\s*<Text style=\{styles\.fieldLabel\}>PROJECT NAME<\/Text>/);
  });
});

// ── 6. program_topics: every row past the 1000-row page ─────────────────────
describe('6 · v3 program / certificate links are paged', async () => {
  const v3 = await import('../src/data/v3Curriculum.ts');
  it('a link table of 1016 rows comes back whole (a fake PostgREST capped at 1000 per request)', async () => {
    const calls: { range: [number, number] | null }[] = [];
    const links = Array.from({ length: 1016 }, (_, i) => ({ program_id: 'p1', gs: i + 1, seq: i + 1, is_elective: false }));
    globalThis.__SBC.from = (t) =>
      t === 'programs' ? tableOf([{ id: 'p1', slug: 's', name: 'P', sequence: 1 }], []) : tableOf(links, calls);
    const list = await v3.fetchV3ProgramsStrict();
    assert.equal(list[0].topicsGs.length, 1016, 'all 1016 links, not the first 1000');
    assert.equal(list[0].topicsGs[1015], 1016);
    assert.deepEqual(calls.map((c) => c.range), [[0, 999], [1000, 1999]]);
  });
  it('a page that fails rejects the whole read — never a partial list', async () => {
    let n = 0;
    const r = await v3.readAllPages<number>(async () =>
      ++n === 1 ? { data: Array.from({ length: v3.LINK_PAGE_ROWS }, (_, i) => i), error: null } : { data: null, error: { message: 'page 2 failed' } },
    );
    assert.deepEqual(r.data, []);
    assert.equal(r.error?.message, 'page 2 failed');
  });
  it('both link reads page over a total order (seq, then the unique id)', () => {
    const s = read('src/data/v3Curriculum.ts');
    for (const t of ['program_topics', 'certificate_topics']) {
      assert.match(s, new RegExp(`readAllPages<any>\\(\\(from, to\\) =>\\s*supabase\\s*\\.from\\('${t}'\\)[\\s\\S]*?\\.order\\('seq'\\)\\s*\\.order\\('id'\\)\\s*\\.range\\(from, to\\)`), t);
    }
    assert.match(s, /function memoOnce\(/, 'the session memo stays');
  });
});
