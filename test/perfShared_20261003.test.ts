/**
 * PERFORMANCE HUNT 2026-10-03 — AREA 10 (SHARED) receipts.
 *
 * Each block pins the faster structure of one fix in the shared components,
 * lab kit, rack, lab stores, data and lib. Every one of them fails on HEAD
 * 4201f49f.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it, test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// ── v3 credential lists: session memo (lead note from Study) ────────────────
const STUB_URL = 'ape-test:supabase-perf10';
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
        source: `
          export const supabase = {
            from(table) {
              globalThis.__perfCalls = (globalThis.__perfCalls ?? 0) + 1;
              const b = { then(res, rej) { return Promise.resolve().then(() => globalThis.__perfFrom(table)).then(res, rej); } };
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
declare global {
  // eslint-disable-next-line no-var
  var __perfFrom: (table: string) => unknown;
  // eslint-disable-next-line no-var
  var __perfCalls: number;
}
const { fetchV3ProgramsStrict, fetchV3CertsStrict } = await import('../src/data/v3Curriculum.ts');

describe('v3 programs / certificates are memoised for the session (Enrollments BROWSE)', () => {
  it('programs: failure and empty are NOT cached; success IS (no round trips on reopen)', async () => {
    globalThis.__perfFrom = () => ({ data: null, error: { message: 'outage' } });
    await assert.rejects(fetchV3ProgramsStrict(), /outage/);
    globalThis.__perfFrom = () => ({ data: [], error: null });
    assert.deepEqual(await fetchV3ProgramsStrict(), []);
    globalThis.__perfFrom = (t) =>
      t === 'programs'
        ? { data: [{ id: 'p1', slug: 's', name: 'P', sequence: 1 }], error: null }
        : { data: [{ program_id: 'p1', gs: 10, seq: 1, is_elective: false }], error: null };
    const first = await fetchV3ProgramsStrict();
    assert.equal(first.length, 1);
    globalThis.__perfCalls = 0;
    globalThis.__perfFrom = () => ({ data: null, error: { message: 'later outage' } });
    assert.equal(await fetchV3ProgramsStrict(), first);
    assert.equal(globalThis.__perfCalls, 0, 'a reopen makes no network round trip');
  });
  it('certificates: same memo', async () => {
    globalThis.__perfFrom = () => ({ data: null, error: { message: 'outage' } });
    await assert.rejects(fetchV3CertsStrict(), /outage/);
    globalThis.__perfFrom = (t) =>
      t === 'certificates'
        ? { data: [{ id: 'c1', slug: 's', name: 'C', sequence: 1 }], error: null }
        : { data: [{ certificate_id: 'c1', gs: 10, seq: 1, is_required: true }], error: null };
    const first = await fetchV3CertsStrict();
    globalThis.__perfCalls = 0;
    assert.equal(await fetchV3CertsStrict(), first);
    assert.equal(globalThis.__perfCalls, 0);
  });
});

// ── Lab clip audio: the fetch no longer waits behind the gate / audio mode ──
test('LabAudioPlayer.play starts the clip load BEFORE the fenced audio-mode wait', () => {
  const src = read('src/features/lab/LabAudioPlayer.ts');
  const play = src.slice(src.indexOf('async play(labKey'));
  const early = play.indexOf('this.preload(labKey, [assetKey]);');
  assert.ok(early > 0, 'play() kicks the load off at once');
  assert.ok(early < play.indexOf('await startFenced('), 'before the fence awaits settleMode');
  assert.match(play, /await this\.settleMode\(\);[\s\S]*?return this\.load\(labKey, assetKey\);/, 'the fenced start still waits for the mode and shares the job');
});
test('useLabAudio.play preloads the clip while the audio gate decides', () => {
  const src = read('src/features/lab/useLabAudio.ts');
  const pre = src.indexOf('p.preload(labKey, [assetKey]);');
  assert.ok(pre > 0);
  assert.ok(pre < src.indexOf('await requestAudioOutput()'));
});

// ── Lab stores: unchanged units do not re-render every lab and hub ──────────
test('useLabClearedUnits / useLabCompletion / useLabVisits keep the same value when nothing changed', () => {
  const lc = read('src/features/lab/labCompletion.ts');
  assert.match(lc, /export function keepIfSameSet\(/);
  assert.match(lc, /const l = \(\) => setV\(\(prev\) => keepIfSameSet\(prev, read\(\)\)\);/);
  assert.match(lc, /prev\.complete === next\.complete && prev\.cleared === next\.cleared && prev\.total === next\.total \? prev : next/);
  const lv = read('src/features/lab/labVisits.ts');
  assert.match(lv, /setV\(\(prev\) => \{\s*const next = read\(\);\s*if \(prev\.size !== next\.size\) return next;/);
});

// ── Full screen: a closed full-screen view never builds the drawing ─────────
test('StageFullScreen renders the drawing through a child, not inline', () => {
  const src = read('src/screens/lab/rack/StageFullScreen.tsx');
  assert.match(src, /function FullDrawing\(/);
  assert.match(src, /function FullDrawing\([\s\S]*?\) \{\s*return <StageInFullScreen\.Provider value>\{render\(w, h\)\}<\/StageInFullScreen\.Provider>;/);
  assert.match(src, /<StageTextScale\.Provider value=\{textScale\}>\s*<FullDrawing render=\{render\} w=\{w\} h=\{h\} \/>/);
  assert.equal((src.replace(/\/\*[\s\S]*?\*\//g, '').match(/render\(w, h\)/g) ?? []).length, 1, 'the drawing is built in exactly one place: the child');
});

// ── Cold start: the ~600 KB topic overviews load on first open ──────────────
test('TopicAboutPanel never imports data/topicAbout at the top', () => {
  const src = read('src/components/TopicAboutPanel.tsx');
  assert.doesNotMatch(src, /^import [^;]*from '\.\.\/data\/topicAbout';/m);
  assert.match(src, /require\('\.\.\/data\/topicAbout'\)/);
  assert.match(src, /return topicCopy\(gs\) != null;/);
});
test('hasTopicAbout via topicCopy is exact: same topics both ways', async () => {
  const { topicAbout } = await import('../src/data/topicAbout.ts');
  const { topicCopy } = await import('../src/data/topicCopy.ts');
  for (let gs = 0; gs <= 10000; gs++) assert.equal(topicAbout(gs) != null, topicCopy(gs) != null, `gs ${gs}`);
});

// ── Lab photos: decoded once, held in memory ────────────────────────────────
test('LabPhoto draws through expo-image with a memory cache (RN Image fallback)', () => {
  const src = read('src/screens/lab/kit/LabPhoto.tsx');
  assert.match(src, /requireOptionalNativeModule\('ExpoImage'\)/);
  assert.match(src, /<EXPO_IMAGE source=\{source\}[^>]*cachePolicy="memory"/);
});

// ── Paged labs: the restored page is the first one mounted ──────────────────
test('PagedLab holds the page body for the saved place (bounded), then mounts it', () => {
  const src = read('src/screens/lab/kit/PagedLab.tsx');
  assert.match(src, /export const RESTORE_WAIT_MS = 200;/);
  assert.match(src, /const \[awaitingRestore, setAwaitingRestore\] = useState\(\(\) => resolved\);/);
  assert.match(src, /setTimeout\(\(\) => setAwaitingRestore\(false\), RESTORE_WAIT_MS\)/);
  assert.match(src, /const holdPageBody = awaitingRestore && progress == null && !navigatedRef\.current;/);
  assert.match(src, /setPage\(Math\.min\(p\.lastPage, pagesWithCheck\.length - 1\)\);\s*setAwaitingRestore\(false\);/);
  assert.match(src, /\{holdPageBody \? null : \(/);
});

// ── Web preview: no modal-dismiss wait where nothing refuses ────────────────
test('HOST_DISMISS_MS is 0 on web and still 450 on native', () => {
  const src = read('src/components/DimModal.tsx');
  assert.match(src, /export const HOST_DISMISS_MS = Platform\.OS === 'web' \? 0 : 450;/);
});
