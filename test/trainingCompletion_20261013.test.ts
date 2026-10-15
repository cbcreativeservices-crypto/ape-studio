/**
 * Training-lab certificate credit — the reporting path, the completion
 * rules, the hooks and the backfill (owner 2026-10-13).
 *
 * Run for real against an in-memory AsyncStorage and a stubbed
 * `mark_lab_complete`:
 *   • a training key is recorded once and sent; `lab_not_found` (the backend
 *     row not there yet) keeps it UNSENT and it is retried — never dropped;
 *   • guests never send; a same-session guest's completion reaches the
 *     account they sign into; a members-only preview earns nothing;
 *   • labIds (a check banked under 'envelope', 'sound-systems-learn') are
 *     never sent — their credit travels as the lab's tr_ key;
 *   • each source's rule (pure), and each hook's wiring (source guards);
 *   • the backfill reads every store and credits what is already complete.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

type Kv = { map: Map<string, string> };
const kv: Kv = { map: new Map() };
type Rpc = { calls: string[]; answer: (key: string) => { message: string } | null };
const rpc: Rpc = { calls: [], answer: () => null };
const g = globalThis as unknown as { __trKv: Kv; __trRpc: Rpc; __DEV__: boolean };
g.__trKv = kv;
g.__trRpc = rpc;
g.__DEV__ = false;

const STUBS: Record<string, string> = {
  'async-storage': `const s = globalThis.__trKv; export default {
    getItem: async (k) => (s.map.has(k) ? s.map.get(k) : null),
    setItem: async (k, v) => { s.map.set(k, v); },
    removeItem: async (k) => { s.map.delete(k); },
    multiRemove: async (ks) => { for (const k of ks) s.map.delete(k); },
    getAllKeys: async () => [...s.map.keys()],
  };`,
  supabase: `export const supabase = { rpc: async (_fn, args) => {
    const r = globalThis.__trRpc; r.calls.push(args.p_lab_key);
    const e = r.answer(args.p_lab_key);
    return e ? { data: null, error: e } : { data: { ok: true }, error: null };
  } };`,
  sync: `export const emitStudyProgress = () => {};`,
  reviewPrompt: `export const noteHighValueEvent = async () => {};`,
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'tr-stub:async-storage', shortCircuit: true };
    if (/\/lib\/supabase$/.test(specifier)) return { url: 'tr-stub:supabase', shortCircuit: true };
    if (/\/study\/sync$/.test(specifier)) return { url: 'tr-stub:sync', shortCircuit: true };
    if (/\/review\/reviewPrompt$/.test(specifier)) return { url: 'tr-stub:reviewPrompt', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      for (const ext of ['.ts', '.tsx', '/index.ts']) {
        const candidate = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith('tr-stub:')) return { format: 'module', shortCircuit: true, source: STUBS[url.slice('tr-stub:'.length)] };
    return nextLoad(url, context);
  },
});

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const tick = () => new Promise((r) => setTimeout(r, 0));
const settle = async () => {
  for (let i = 0; i < 8; i++) await tick();
};

// A report made before any sink exists waits (node has no require).
const signal = await import('../src/features/lab/trainingSignal.ts');
signal.reportTrainingComplete('tr_bass');
signal.reportTrainingComplete('not_a_key');
const pendingBeforeSink = signal.__pendingTrainingReports();

const carry = await import('../src/features/lab/sessionCarry.ts');
const preview = await import('../src/features/lab/labPreviewStore.ts');
const completion = await import('../src/features/lab/labCompletion.ts');
const K = await import('../src/features/lab/trainingLabKeys.ts');
const tc = await import('../src/features/lab/trainingCompletion.ts');
const miking = await import('../src/screens/lab/miking/engine/progress/mikingProgress.ts');
const { PAGE_IDS } = await import('../src/screens/lab/miking/engine/model/types.ts');
const { LESSONS } = await import('../src/screens/lab/miking/data/registry.ts');
const { MASTERING_MODULES } = await import('../src/screens/lab/mastering/masteringContent.ts');
const { DRUM_CHAPTERS } = await import('../src/screens/lab/drumtuning/drumContent.ts');
const ssDone = await import('../src/features/soundsystems/labComplete.ts');
const { newProject } = await import('../src/features/production/projectStore.ts');

/** The account switch as accountLocalSync runs it. */
async function authEvent(identity: string, wipe: boolean): Promise<void> {
  carry.noteSessionIdentity(identity);
  if (wipe) {
    for (const k of [...kv.map.keys()]) if (k.startsWith('ape:')) kv.map.delete(k);
    completion.resetLocal();
    miking.resetMikingLocal();
  }
  await carry.settleSessionCarry();
  await settle();
}
const sentTo = (key: string) => rpc.calls.filter((k) => k === key).length;

describe('the signal', () => {
  it('a report before the sink exists waits; a non-key is refused at the door', () => {
    assert.deepEqual(pendingBeforeSink, ['tr_bass']);
  });
  it('installing the sink replays what waited', async () => {
    signal.setTrainingSink(completion.markTrainingDone);
    assert.deepEqual(signal.__pendingTrainingReports(), []);
    await settle();
    assert.equal(completion.isLabDone('tr_bass'), true);
  });
});

describe('one reporting path (labCompletion)', () => {
  it('a member: recorded, sent once; lab_not_found keeps it UNSENT and it is retried, never dropped', async () => {
    await authEvent('u1', true);
    rpc.calls.length = 0;
    rpc.answer = (k) => (k === 'tr_gate' ? { message: 'lab_not_found' } : null);
    signal.reportTrainingComplete('tr_gate');
    await settle();
    assert.equal(sentTo('tr_gate'), 1, 'sent');
    assert.equal(completion.isLabDone('tr_gate'), true, 'complete on the device');
    assert.equal(completion.isLabCreditSent('tr_gate'), false, 'lab_not_found: not marked sent');
    const blob = JSON.parse(kv.map.get('ape:labProgress')!);
    assert.deepEqual(blob.units.tr_gate, [completion.TRAINING_DONE_UNIT]);
    assert.ok(!blob.sent.includes('tr_gate'));
    // The backend rows land; the next retry (boot / sign-in / backfill) sends it.
    rpc.answer = () => null;
    await completion.retryUnsentLabCredit();
    await settle();
    assert.equal(sentTo('tr_gate'), 2, 'retried');
    assert.equal(completion.isLabCreditSent('tr_gate'), true);
    // Idempotent from here.
    signal.reportTrainingComplete('tr_gate');
    await completion.retryUnsentLabCredit();
    await settle();
    assert.equal(sentTo('tr_gate'), 2);
  });

  it('the settle retry covers EVERY recorded training key, not only LAB_UNITS', async () => {
    rpc.calls.length = 0;
    rpc.answer = () => ({ message: 'network down' });
    signal.reportTrainingComplete('mxb_pan');
    signal.reportTrainingComplete('ear_pitch');
    await settle();
    rpc.answer = () => null;
    rpc.calls.length = 0;
    // A later launch of the same member: the settle retries.
    carry.__resetSessionCarryForTests();
    await authEvent('u1', false);
    assert.equal(sentTo('mxb_pan'), 1);
    assert.equal(sentTo('ear_pitch'), 1);
    assert.ok(completion.isLabCreditSent('mxb_pan') && completion.isLabCreditSent('ear_pitch'));
  });

  it('labIds are never sent (a check banked under its screen labId)', async () => {
    rpc.calls.length = 0;
    completion.registerLabUnits('envelope' as never, ['understanding']);
    completion.markLabUnit('envelope' as never, 'understanding');
    completion.registerLabUnits('sound-systems-learn' as never, ['understanding']);
    completion.markLabUnit('sound-systems-learn' as never, 'understanding');
    await settle();
    assert.deepEqual(rpc.calls, []);
    assert.equal(completion.hasLabUnit('envelope', 'understanding'), true, 'still banked on the device');
  });

  it('a members-only PREVIEW earns nothing', async () => {
    preview.startLabPreview('FmLab', 'FM Lab');
    signal.reportTrainingComplete('tr_fm');
    await settle();
    preview.endLabPreview();
    assert.equal(completion.isLabDone('tr_fm'), false);
  });

  it('GUESTS NEVER SEND; a same-session guest who signs in is credited after the wipe; after a sign-out nothing carries', async () => {
    await authEvent('', true); // u1 signs out → no account
    rpc.calls.length = 0;
    signal.reportTrainingComplete('tr_delay'); // after a sign-out: not carried
    await settle();
    carry.restartGuestSession(); // a deliberate guest session
    signal.reportTrainingComplete('tr_reverb');
    await settle();
    assert.deepEqual(rpc.calls, [], 'a guest sends nothing');
    assert.equal(completion.isLabDone('tr_reverb'), true, 'shown this session');
    await authEvent('u2', true); // the guest signs in (device wiped)
    assert.equal(sentTo('tr_reverb'), 1, 'the guest’s session work reaches the account');
    assert.equal(completion.isLabDone('tr_reverb'), true);
    assert.equal(sentTo('tr_delay'), 0, 'work after a sign-out is never credited to the next account');
    assert.equal(completion.isLabDone('tr_delay'), false);
  });

  it('the shape this boot-graph store accepts covers every real key and no af_*/labId', () => {
    const real = [...K.TRAINING_LABS.map((l) => l.key), ...LESSONS.map((l) => K.mikingLessonKey(l.id)), ...K.MIXING_BEG_PAGE_IDS.map((p) => K.mixingPageKey('beg', p)), ...K.MIXING_ADV_PAGE_IDS.map((p) => K.mixingPageKey('adv', p)), ...K.EAR_MODULE_IDS.map(K.earModuleKey)];
    for (const k of real) assert.ok(completion.isTrainingKeyShape(k), k);
    for (const k of ['af_cables', 'envelope', 'sound-systems-learn', 'eq', 'mixing-beg', 'reviewed']) assert.equal(completion.isTrainingKeyShape(k), false, k);
  });
});

describe('the completion rules (pure)', () => {
  it('Miking: a lesson counts when every journey page is credited', () => {
    const p = { v: 1 as const, lessons: { M01: { done: [...PAGE_IDS], answers: {}, interactive: [] }, M02: { done: PAGE_IDS.slice(0, -1), answers: {}, interactive: [] } } };
    assert.deepEqual(tc.mikingCompleteKeys(p), ['mk_M01']);
  });
  it('Mixing: one key per page done; the appended check page is not a page', () => {
    assert.deepEqual(tc.mixingDoneKeys('beg', [0, 6, 16]), ['mxb_mix', 'mxb_pan']);
    assert.deepEqual(tc.mixingDoneKeys('adv', [19, 20]), ['mxa_final']);
  });
  it('Mastering (8 modules) / Drum (7 chapters): every one banked', () => {
    assert.equal(MASTERING_MODULES.length, 8);
    assert.equal(DRUM_CHAPTERS.length, 7);
    const all = (ids: readonly { id: string }[]) => ({ modules: Object.fromEntries(ids.map((m) => [m.id, { done: true, answers: {} }])) });
    assert.equal(tc.masteringAllDone(all(MASTERING_MODULES) as never), true);
    assert.equal(tc.masteringAllDone(all(MASTERING_MODULES.slice(1)) as never), false);
    assert.equal(tc.drumAllDone({ ...all(DRUM_CHAPTERS), notes: [] } as never), true);
    assert.equal(tc.drumAllDone({ ...all(DRUM_CHAPTERS.slice(0, 6)), notes: [] } as never), false);
  });
  it('Tuning: the store’s own done', () => {
    assert.equal(tc.tuningAllDone({ completed: [], lastChapter: 0, done: true, mathView: false }), true);
    assert.equal(tc.tuningAllDone({ completed: [0, 1], lastChapter: 0, done: false, mathView: false }), false);
  });
  it('Ear: mastered ≥ REQUIRED_EAR_LEVEL (mastered only grows; the current level can drop)', () => {
    const m = (mastered: number, level: number) => ({ level, trials: [], bestStreak: 0, streak: 0, total: 0, totalScore: 0, mastered });
    const keys = tc.earCompleteKeys({ modules: { pitch: m(K.REQUIRED_EAR_LEVEL, 1), eq: m(K.REQUIRED_EAR_LEVEL - 1, 3) }, subBassOk: true });
    assert.deepEqual(keys, ['ear_pitch']);
  });
  it('Sound Systems: the hub’s COMPLETE rule — every row AND the LEARN check', () => {
    const T = ssDone.SS_TOTALS;
    const n = (c: number) => Array.from({ length: c }, (_, i) => `x${i}`);
    const full = { capstones: n(T.build), route: n(T.route), operate: n(T.operate), faults: n(T.troubleshoot), forward: [] };
    assert.equal(ssDone.soundSystemsLabComplete(T.learn, full, true), true);
    assert.equal(ssDone.soundSystemsLabComplete(T.learn, full, false), false, 'the check is required');
    assert.equal(ssDone.soundSystemsLabComplete(T.learn - 1, full, true), false);
    assert.equal(ssDone.soundSystemsLabComplete(T.learn, { ...full, faults: n(T.troubleshoot - 1) }, true), false);
  });
  it('Production: a blank project is not complete (a project counts only with EVERY stage complete)', () => {
    assert.equal(tc.productionProjectComplete('preprod', newProject('preprod', 'music', 'x')), false);
    assert.equal(tc.productionProjectComplete('postprod', newProject('postprod', 'music', 'x')), false);
  });
});

describe('the hooks (live completion → reportTrainingComplete)', () => {
  it('Miking: banking the last journey page reports mk_<lessonId> (real store)', async () => {
    await authEvent('u3', true);
    rpc.calls.length = 0;
    miking.setMikingSaveBlocked(false);
    for (const p of PAGE_IDS.slice(0, -1)) await miking.bankPage('C05A', p);
    await settle();
    assert.equal(completion.isLabDone('mk_C05A'), false, 'not before the last page');
    await miking.bankPage('C05A', PAGE_IDS[PAGE_IDS.length - 1]);
    await settle();
    assert.equal(completion.isLabDone('mk_C05A'), true);
    assert.equal(sentTo('mk_C05A'), 1);
  });

  const has = (file: string, ...needles: (string | RegExp)[]) => {
    const src = read(file);
    for (const n of needles) assert.ok(typeof n === 'string' ? src.includes(n) : n.test(src), `${file}: ${n}`);
  };
  it('Mixing: each page marked done reports its page key', () => {
    has('src/screens/lab/mixing/BeginningMixingLabScreen.tsx', "reportTrainingComplete(mixingPageKeyAt('beg', index))", 'onPageDone={onPageDone}');
    has('src/screens/lab/mixing/AdvancedMixingLabScreen.tsx', "reportTrainingComplete(mixingPageKeyAt('adv', index))", 'onPageDone={onPageDone}');
    // PagedLab fires onPageDone for real pages only (never the check page).
    has('src/screens/lab/kit/PagedLab.tsx', 'if (fresh && page < pages.length) onPageDone?.(page);');
  });
  it('Mastering / Drum / Tuning / Sound Systems / Production / Ear', () => {
    has('src/screens/lab/mastering/MasteringLabScreen.tsx', "if (loaded && MASTERING_MODULES.every((m) => doneIds.has(m.id))) reportTrainingComplete(trainingKeyFor('MasteringLab'));");
    has('src/screens/lab/drumtuning/DrumTuningLabScreen.tsx', "if (loaded && DRUM_CHAPTERS.every((m) => doneIds.has(m.id))) reportTrainingComplete(trainingKeyFor('DrumTuningLab'));");
    has('src/screens/lab/tuning/TuningLabScreen.tsx', 'const allChaptersDone = progress?.done === true;', "if (allChaptersDone) reportTrainingComplete(trainingKeyFor('TuningLab'));");
    has('src/screens/lab/soundsystems/SoundSystemsLabScreen.tsx', 'const allDone = soundSystemsLabComplete(pages.learn, progress, checkPassed);', "if (known && allDone) reportTrainingComplete(trainingKeyFor('SoundSystemsLab'));");
    has('src/screens/lab/production/ProductionStageScreen.tsx', /if \(storedProject && productionProjectComplete\(lab, storedProject\)\) reportTrainingComplete\(trainingKeyFor\(lab === 'preprod' \? 'PreProdLab' : 'PostProdLab'\)\);/);
    has('src/screens/lab/eartraining/EarModuleScreen.tsx', 'if (next.mastered >= REQUIRED_EAR_LEVEL) reportTrainingComplete(earModuleKey(mod.id));');
    has('src/screens/lab/miking/engine/progress/mikingProgress.ts', 'void out.then(() => reportIfLessonComplete(lessonId));', 'creditedCount(l.done) === PAGE_IDS.length) reportTrainingComplete(mikingLessonKey(lessonId))');
  });
  it('understanding checks: every shell reports the lab’s tr_ key on a pass', () => {
    for (const f of ['src/screens/lab/kit/PagedLab.tsx', 'src/screens/lab/LabShell.tsx', 'src/screens/lab/soundsystems/SsPagedLab.tsx', 'src/components/LabUnderstandingBlock.tsx']) {
      has(f, 'reportTrainingComplete(trainingKeyForCheck(labId));');
    }
    // FxLabScreen is LabShell with its config's labId.
    has('src/screens/lab/FxLabScreen.tsx', 'labId={config.labId}');
  });
  it('the backfill runs from labCompletion’s settle listener, for a settled account only, lazily', () => {
    has(
      'src/features/lab/labCompletion.ts',
      /onSessionCarrySettled\(\(\) => \{\s*void Promise\.resolve\(\)[\s\S]*?\.then\(\(\) => flushSessionWork\(\)\)[\s\S]*?if \(!sessionIsSettledAccount\(\) \|\| typeof require !== 'function'\) return;[\s\S]*?require\('\.\/trainingCompletion'\)[\s\S]*?backfillTrainingCompletion\(\)/,
    );
    // Not in the app-start graph: no static import of the scan.
    assert.doesNotMatch(read('src/features/lab/labCompletion.ts'), /^import .*trainingCompletion/m);
  });
});

describe('the backfill', () => {
  it('reads every store and credits what was finished before this update', async () => {
    await authEvent('u4', true);
    rpc.calls.length = 0;
    rpc.answer = () => null;
    // A learner's device from before the update.
    kv.map.set('ape:miking:v1', JSON.stringify({ v: 1, lessons: { C06a: { done: [...PAGE_IDS], answers: {}, interactive: [] }, M03: { done: ['meet'], answers: {}, interactive: [] } } }));
    kv.map.set('ape:mixing-beg:v1', JSON.stringify({ completed: [0, 2, 16], lastPage: 3, done: false }));
    kv.map.set('ape:mixing-adv:v1', JSON.stringify({ completed: [5], lastPage: 5, done: false }));
    kv.map.set('ape:mastering:v1', JSON.stringify({ modules: Object.fromEntries(MASTERING_MODULES.map((m) => [m.id, { done: true, answers: {} }])) }));
    kv.map.set('ape:drumtuning:v1', JSON.stringify({ modules: { sound: { done: true, answers: {} } }, notes: [] }));
    kv.map.set('ape:tuning:v1', JSON.stringify({ completed: [0, 1, 2], lastChapter: 2, done: true, mathView: false }));
    kv.map.set('ape:ear:v1', JSON.stringify({ modules: { comb: { level: 2, trials: [], bestStreak: 0, streak: 0, total: 40, totalScore: 35, mastered: 2 }, band: { level: 2, trials: [], bestStreak: 0, streak: 0, total: 20, totalScore: 17, mastered: 1 } }, subBassOk: true }));
    // Fresh reads, as on a launch.
    miking.resetMikingLocal();
    // Checks passed before the update were banked under the screen labId only.
    completion.markLabUnit('envelope' as never, 'understanding');
    completion.markLabUnit('sound-systems-learn' as never, 'understanding');
    await settle();
    assert.equal(completion.isLabDone('tr_envelope'), false, 'precondition: no tr_ credit yet');
    const keys = new Set(await tc.collectCompletedTrainingKeys());
    for (const k of ['mk_C06a', 'mxb_mix', 'mxb_flow', 'mxa_parallel', 'tr_mastering', 'tr_tuning', 'ear_comb', 'tr_envelope']) assert.ok(keys.has(k), `missing ${k}`);
    for (const k of ['mk_M03', 'tr_drum_tuning', 'ear_band', 'tr_sound_systems', 'tr_preprod']) assert.ok(!keys.has(k), `not complete: ${k}`);
    assert.ok(![...keys].some((k) => k.startsWith('mxb_') && !K.MIXING_BEG_PAGE_IDS.some((p) => `mxb_${p}` === k)), 'the check page index is no key');
    await tc.backfillTrainingCompletion();
    await settle();
    for (const k of keys) {
      assert.equal(completion.isLabDone(k), true, k);
      assert.equal(sentTo(k), 1, `sent once: ${k}`);
    }
    // Running again sends nothing new.
    const before = rpc.calls.length;
    await tc.backfillTrainingCompletion();
    await settle();
    assert.equal(rpc.calls.length, before);
  });
});
