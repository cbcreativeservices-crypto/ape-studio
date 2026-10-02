/**
 * Drum Tuning Lab — toddler + cat bug pass 1 (2026-10-01). One test per
 * fix; each was checked against the pre-fix code (R2).
 *
 *  1. Ch7 drift case: every strike was cut off a frame in (the drift moved
 *     the head at the START of the strike, changing the strike's own key).
 *  2. useDrumPlayback: a fader moved while ▶ was still loading played the
 *     stale clip when the load landed.
 *  3. A damaged / older-shape store crashed the screen (`in` on a string)
 *     or a note row (`d.drum.split`).
 *  4. Chapter 1 never resumed: no `lastModule` → step 0, answers dropped.
 *  5. Tuning notes: "Saved on this device" before / regardless of the write;
 *     the 24-note cap's dropped note stayed on screen as saved; a guest saw
 *     "SAVED ON THIS DEVICE"; a double tap on SAVE filed a duplicate.
 *  6. A slow tier check / a guest signing in mid-lab: stored progress never
 *     re-read for the visit.
 *  7. START OVER on Chapter 1 did not remount it (cards stayed answered).
 *  8. Ch2: the cross-pattern interval kept running after the page turned.
 *  9. Ch5: CHECK inside the 120 ms settle judged the previous setting.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const strip = (s: string) => s.replace(/\r\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const DIR = 'src/screens/lab/drumtuning';

type Store = { map: Map<string, string>; failSet: boolean };
const store: Store = { map: new Map(), failSet: false };
(globalThis as unknown as { __drumStore2: Store }).__drumStore2 = store;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'node:test-async-storage-2', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'node:test-async-storage-2') {
      return {
        format: 'module',
        shortCircuit: true,
        source: `const s = globalThis.__drumStore2; export default { getItem: async (k) => s.map.has(k) ? s.map.get(k) : null, setItem: async (k, v) => { if (s.failSet) throw new Error('disk full'); s.map.set(k, v); }, removeItem: async (k) => { s.map.delete(k); } };`,
      };
    }
    return nextLoad(url, context);
  },
});

const progress = await import('../src/screens/lab/drumtuning/drumProgress.ts');
const KEY = 'ape:drumtuning:v1';
const note = (id: string, savedAt: number) => ({ id, name: id, savedAt, drums: [{ drum: '12" × 8" rack tom', batterHz: 200, note: '' }] });

describe('drum toddler pass 1 — the store', () => {
  it('a damaged / older-shape copy is sanitised: no throw on `in`, no malformed note rows, no bogus resume point', async () => {
    progress.setDrumSaveBlocked(false);
    store.failSet = false;
    store.map.set(
      KEY,
      JSON.stringify({
        modules: { sound: { done: true, answers: 'oops' }, method: { done: 'yes', answers: { m1: true, m2: 'x' }, interactive: 1 }, bogus: { done: true } },
        lastModule: 'nowhere',
        lastStep: -2,
        notes: [note('ok', 1), { id: 'bad1', name: 'b', savedAt: 2, drums: [null] }, { id: 'bad2', name: 'b', drums: [] }, { id: 'bad3', name: 'b', savedAt: 3, drums: [{ drum: 5, batterHz: 100 }] }],
      }),
    );
    const s = await progress.loadDrumProgress();
    assert.deepEqual(s.modules.sound, { done: true, answers: {} });
    assert.deepEqual(s.modules.method, { done: false, answers: { m1: true } });
    assert.equal((s.modules as Record<string, unknown>).bogus, undefined);
    assert.equal(s.lastModule, undefined);
    assert.equal(s.lastStep, undefined);
    assert.deepEqual(s.notes.map((n) => n.id), ['ok']);
    // The screen's onAnswered mutate: `in` on the stored answers must not throw.
    await progress.updateDrumProgress((st) => {
      const m = st.modules.sound ?? progress.emptyDrumChapter();
      if ('s1' in m.answers) return;
      st.modules.sound = { ...m, answers: { ...m.answers, s1: true } };
    });
    assert.equal(JSON.parse(store.map.get(KEY)!).modules.sound.answers.s1, true);
  });

  it('Chapter 1 resumes at its stored step with its answers when no lastModule was ever written', () => {
    const at = progress.drumResumePoint({ modules: { sound: { done: false, answers: { s1: true } } }, lastStep: 4, notes: [] });
    assert.deepEqual(at, { id: 'sound', step: 4, answers: { s1: true } });
    const host = strip(read(`${DIR}/DrumTuningLabScreen.tsx`));
    assert.match(host, /const at = drumResumePoint\(s\);\s*setModId\(at\.id\);\s*setAnswers\(at\.answers\);\s*setStepRaw\(at\.step\);/);
    assert.doesNotMatch(host, /else if \(s\.lastModule && DRUM_CHAPTERS\.some/, 'resume never needs a lastModule');
  });

  it('saveTuningNote says whether the write landed: saved / blocked (guest) / failed', async () => {
    store.map.clear();
    progress.setDrumSaveBlocked(false);
    store.failSet = false;
    let r = await progress.saveTuningNote(note('a', 1));
    assert.equal(r.saved, true);
    assert.equal(r.blocked, false);
    store.failSet = true;
    r = await progress.saveTuningNote(note('b', 2));
    assert.equal(r.saved, false, 'a failed write is never "saved"');
    assert.equal(r.blocked, false);
    store.failSet = false;
    progress.setDrumSaveBlocked(true);
    r = await progress.saveTuningNote(note('c', 3));
    assert.equal(r.saved, false);
    assert.equal(r.blocked, true);
    progress.setDrumSaveBlocked(false);
  });

  it('the list on screen is what the store holds: the cap\'s dropped note never comes back as saved; a guest list is capped too', async () => {
    store.map.clear();
    progress.setDrumSaveBlocked(false);
    let r = await progress.saveTuningNote(note('n0', 0));
    for (let i = 1; i <= progress.MAX_TUNING_NOTES; i++) r = await progress.saveTuningNote(note(`n${i}`, i));
    assert.equal(r.notes.length, progress.MAX_TUNING_NOTES);
    assert.ok(!r.notes.some((n) => n.id === 'n0'));
    let mem: ReturnType<typeof note>[] = [];
    for (let i = 0; i <= progress.MAX_TUNING_NOTES; i++) mem = progress.withNote(mem, note(`g${i}`, i));
    assert.equal(mem.length, progress.MAX_TUNING_NOTES);
    const host = strip(read(`${DIR}/DrumTuningLabScreen.tsx`));
    assert.match(host, /if \(s\.saved\) \{\s*setNotes\((?:listed\()?s\.notes\)?\);\s*return 'saved';/);
    assert.match(host, /if \(s\.blocked\) \{\s*setNotes\(\(prev\) => withNote\(prev, note\)\);\s*return 'session';/);
    assert.doesNotMatch(host, /prev\.filter\(\(p\) => !s\.notes\.some/, 'no merge that resurrects a dropped note');
  });
});

describe('drum toddler pass 1 — the screen and the chapters', () => {
  it('Ch7: the drift moves the rod when the strike ENDS, never at its start (which cut every strike off)', () => {
    const ch7 = strip(read(`${DIR}/modules/ch7Trouble.tsx`));
    assert.doesNotMatch(ch7, /if \(!pb\.playing\) return;\s*setSims\(\(all\) => \{\s*const s = all\[caseId\];\s*const turns = s\.drift/, 'no drift on the playing edge');
    assert.match(ch7, /if \(pb\.playing\) \{[\s\S]*?strikes: all\[id\]\.strikes \+ 1[\s\S]*?return;\s*\}/, 'the strike counts on the press');
    assert.match(ch7, /if \(!s\.drift \|\| s\.strikes !== struckNow\.n\) return all;/, 'the drift lands at the end, and never on a case reset since');
  });

  it('useDrumPlayback: a control change cancels a ▶ still loading the old settings', () => {
    const hook = strip(read(`${DIR}/useDrumPlayback.ts`));
    assert.match(hook, /if \(loadedKeyRef\.current !== key\) \{\s*seqRef\.current\+\+;/);
    assert.match(hook, /if \(!aliveRef\.current \|\| my !== seqRef\.current\) return false;\s*loadedKeyRef\.current = k;/, 'the load re-checks its sequence after the player load');
  });

  it('a slow tier / a sign-in mid-lab re-reads the store once it unblocks, merging (credit only grows) and keeping the session notes', () => {
    const host = strip(read(`${DIR}/DrumTuningLabScreen.tsx`));
    assert.match(host, /\}, \[resolved, loaded, blocked\]\);/);
    assert.match(host, /setDoneIds\(\(prev\) => new Set\(\[\.\.\.\(reread \? prev : \[\]\)/);
    // Pass 3 correction: the re-save goes through keepSessionNotes (a refused write is never listed as stored).
    assert.match(host, /const kept = await keepSessionNotes\(s\.notes, notesRef\.current\);/);
  });

  it('a guest\'s session notes survive a chapter change (the blocked store reads back empty)', () => {
    const host = strip(read(`${DIR}/DrumTuningLabScreen.tsx`));
    const open = host.slice(host.indexOf('const openModule = useCallback'), host.indexOf('const onAnswered = useCallback'));
    assert.ok(open.length > 0);
    assert.doesNotMatch(open, /setNotes\(/, 'openModule never replaces the notes with the store\'s copy');
  });

  it('START OVER remounts the chapter even when the run restarts on the chapter already open', () => {
    const host = strip(read(`${DIR}/DrumTuningLabScreen.tsx`));
    assert.match(host, /setRunId\(\(r\) => r \+ 1\);\s*openModule\('sound', 0\);/);
    assert.match(host, /<Component key=\{`\$\{mod\.id\}:\$\{runId\}`\}/);
  });

  it('Ch6 notes: the flash follows the write; a guest list is never called saved; a repeat SAVE files no duplicate', () => {
    const ch6 = strip(read(`${DIR}/modules/ch6Kit.tsx`));
    assert.match(ch6, /void onSaveNote\(n\)\.then\(\(r\) => \{/);
    assert.match(ch6, /if \(r === 'failed'\) \{\s*setSavedFlash\(\{ text: 'Could not save on this device/);
    assert.doesNotMatch(ch6, /onSaveNote\(n\);\s*setSavedFlash/, 'never "saved" ahead of the write');
    assert.match(ch6, /\{guest \? 'THIS SESSION ONLY — NOT SAVED' : 'SAVED ON THIS DEVICE'\}/);
    // Pass 2 corrected this guard: the note must also still be in the list.
    assert.match(ch6, /if \(!name\.trim\(\) && !note\.trim\(\) && prior\?\.sig === sig && notes\.some\(\(x\) => x\.id === prior\.id\)\) \{/);
    assert.match(ch6, /if \(saving\.current\) return;/);
  });

  it('Ch2: turning the page pauses the cross-pattern interval', () => {
    const ch2 = strip(read(`${DIR}/modules/ch2Prepare.tsx`));
    assert.match(ch2, /const hostStep = useContext\(StepHostContext\)\?\.step;\s*useEffect\(\(\) => \{\s*setRunning\(false\);\s*\}, \[hostStep\]\);/);
  });

  it('Ch5: CHECK judges a fresh render of the current settings, not the debounced picture', () => {
    const ch5 = strip(read(`${DIR}/modules/ch5Types.tsx`));
    assert.match(ch5, /const r = g\.measure\(\);\s*const v = judgeGoal\(goal, \{ t60: r\.t60,[^}]*upper: upperRatio\(r\.result\.partials, gBatter\)/);
    assert.doesNotMatch(ch5, /judgeGoal\(goal, \{ t60: g\.rendered/);
    const hook = strip(read(`${DIR}/useDrumPlayback.ts`));
    assert.match(hook, /measure: renderNow,/);
  });
});
