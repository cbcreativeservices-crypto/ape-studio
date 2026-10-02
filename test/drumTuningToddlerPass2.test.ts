/**
 * Drum Tuning Lab — toddler + cat bug pass 2 (2026-10-01). One test per fix;
 * each was run against the pre-fix files (R2) and failed there.
 *
 *  1. A failed READ of the store fell back to an empty copy that the next
 *     write saved over the real one (every credit, answer and note gone).
 *  2. A failed DELETE was silent: the row vanished, the note stayed on the
 *     device and came back next visit.
 *  3. ▶ TAP over a ringing ▶ STRIKE (Chapters 1, 3, 7) played both at once;
 *     the display tap started a strike over a ringing tap instead of stopping.
 *  4. ▶ ▶ fast: the first press cleared `pending` while the second was still
 *     rendering (the status flickered to "stopped"); ■ could not cancel a
 *     press waiting at the gate.
 *  5. FINISH ›, or "What's left" from CONTENTS on any step, unmounted the
 *     chapter: ‹ PREV came back to a fresh one (Ch7's cleared cases, Ch3's
 *     half-evened head, Ch5's met goals, Ch6's faders gone).
 *  6. Ch7 (correction to pass 1): a restart of the ringing strike was not
 *     counted as a strike and did not drift the rod.
 *  7. Ch6 (correction to pass 1): SAVE → DELETE → SAVE said "already saved"
 *     about the deleted note.
 *  8. Ch6: ▶ BOTH then an instant stop counted as "heard both" for credit.
 *  9. Ch6: the 24-note cap deleted the oldest note under a plain "Saved";
 *     names and notes had no length limit (one progress row holds them all).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const strip = (s: string) => s.replace(/\r\n/g, '\n').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const DIR = 'src/screens/lab/drumtuning';

type Store = { map: Map<string, string>; failSet: boolean; failGet: boolean };
const store: Store = { map: new Map(), failSet: false, failGet: false };
(globalThis as unknown as { __drumStoreP2: Store }).__drumStoreP2 = store;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'node:test-async-storage-p2', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'node:test-async-storage-p2') {
      return {
        format: 'module',
        shortCircuit: true,
        source: `const s = globalThis.__drumStoreP2; export default { getItem: async (k) => { if (s.failGet) throw new Error('Row too big to fit into CursorWindow'); return s.map.has(k) ? s.map.get(k) : null; }, setItem: async (k, v) => { if (s.failSet) throw new Error('disk full'); s.map.set(k, v); }, removeItem: async (k) => { s.map.delete(k); } };`,
      };
    }
    return nextLoad(url, context);
  },
});

const progress = await import('../src/screens/lab/drumtuning/drumProgress.ts');
const { soloPair } = await import('../src/screens/lab/drumtuning/soloPair.ts');
const KEY = 'ape:drumtuning:v1';
const note = (id: string, savedAt: number) => ({ id, name: id, savedAt, drums: [{ drum: '12" × 8" rack tom', batterHz: 200, note: '' }] });
const realCopy = () =>
  JSON.stringify({ modules: { sound: { done: true, answers: { s1: true } }, method: { done: true, answers: {}, interactive: true } }, lastModule: 'method', lastStep: 2, notes: [note('keep', 1)] });

describe('drum toddler pass 2 — the store', () => {
  it('a failed READ never writes: the real copy survives every writer (step, answer, bank, note, reset)', async () => {
    progress.setDrumSaveBlocked(false);
    store.failSet = false;
    store.map.set(KEY, realCopy());
    store.failGet = true;
    await progress.updateDrumProgress((s) => {
      s.lastStep = 0;
    });
    await progress.updateDrumProgress((s) => {
      s.modules.whole = { done: true, answers: {} };
    });
    const r = await progress.saveTuningNote(note('new', 2));
    assert.equal(r.saved, false, 'a note written blind is never "saved"');
    assert.equal(r.blocked, false);
    await progress.resetDrumPractice();
    store.failGet = false;
    const s = await progress.loadDrumProgress();
    assert.equal(s.modules.sound?.done, true, 'credit survives');
    assert.equal(s.modules.method?.done, true);
    assert.deepEqual(s.modules.sound?.answers, { s1: true });
    assert.deepEqual(s.notes.map((n) => n.id), ['keep'], 'the notes survive');
    assert.equal(s.lastModule, 'method');
  });

  it('a missing or unparseable copy still reads as empty and may be written', async () => {
    progress.setDrumSaveBlocked(false);
    store.failGet = false;
    store.map.set(KEY, '{not json');
    const r = await progress.saveTuningNote(note('a', 1));
    assert.equal(r.saved, true);
    store.map.delete(KEY);
    const r2 = await progress.saveTuningNote(note('b', 2));
    assert.equal(r2.saved, true);
  });

  it('deleteTuningNote reports deleted / blocked / failed, and a failed delete leaves the note on the device', async () => {
    store.map.clear();
    progress.setDrumSaveBlocked(false);
    store.failGet = false;
    store.failSet = false;
    await progress.saveTuningNote(note('x', 1));
    await progress.saveTuningNote(note('y', 2));
    store.failSet = true;
    let d = await progress.deleteTuningNote('x');
    assert.equal(d.saved, false);
    assert.equal(d.blocked, false);
    store.failSet = false;
    assert.deepEqual((await progress.loadDrumProgress()).notes.map((n) => n.id), ['x', 'y'], 'still on the device');
    d = await progress.deleteTuningNote('x');
    assert.equal(d.saved, true);
    assert.deepEqual(d.notes.map((n) => n.id), ['y']);
    progress.setDrumSaveBlocked(true);
    d = await progress.deleteTuningNote('y');
    assert.equal(d.saved, false);
    assert.equal(d.blocked, true);
    progress.setDrumSaveBlocked(false);
  });

  it('the host shows the row gone only when the store says so, and says when a delete failed', () => {
    const host = strip(read(`${DIR}/DrumTuningLabScreen.tsx`));
    assert.match(host, /const s = await deleteTuningNote\(id\);\s*if \(s\.saved\) \{\s*setNotes\((?:listed\()?s\.notes\)?\);\s*return 'deleted';\s*\}\s*if \(s\.blocked\) \{\s*setNotes\(\(prev\) => prev\.filter\(\(n\) => n\.id !== id\)\);\s*return 'session';\s*\}\s*return 'failed';/);
    assert.doesNotMatch(host, /void deleteTuningNote\(id\)/, 'never fire-and-forget');
    const ch6 = strip(read(`${DIR}/modules/ch6Kit.tsx`));
    assert.match(ch6, /void onDeleteNote\(n\.id\)\.then\(\(r\) => \{\s*if \(r === 'failed'\) setSavedFlash\(\{ text: `Could not delete/);
  });
});

describe('drum toddler pass 2 — one sound at a time', () => {
  type Fake = { play: () => void; stop: () => void; playing: boolean; pending: boolean; log: string[] };
  const fake = (name: string, log: string[]): Fake => {
    const f: Fake = { playing: false, pending: false, log, play: () => { log.push(`${name}.play`); f.playing = true; }, stop: () => { log.push(`${name}.stop`); f.playing = false; f.pending = false; } };
    return f;
  };

  it('TAP stops the strike, STRIKE stops the tap, the display stops whichever is sounding', () => {
    const log: string[] = [];
    const strike = fake('strike', log);
    const tap = fake('tap', log);
    const solo = soloPair(strike, tap);
    solo.strike();
    assert.equal(strike.playing, true);
    solo.tap();
    assert.equal(strike.playing, false, 'the ringing strike stops for the tap');
    assert.equal(tap.playing, true);
    log.length = 0;
    solo.toggle();
    assert.equal(tap.playing, false, 'the display stops the TAP — it does not strike over it');
    assert.equal(strike.playing, false);
    assert.ok(!log.includes('strike.play'));
    solo.toggle();
    assert.equal(strike.playing, true, 'idle: the display strikes');
    tap.pending = true;
    strike.playing = false;
    solo.toggle();
    assert.equal(tap.pending, false, 'a tap still rendering counts as sounding');
  });

  it('Chapters 1, 3 and 7 route their TAP, STRIKE and display through soloPair', () => {
    const ch1 = strip(read(`${DIR}/modules/ch1Sound.tsx`));
    assert.match(ch1, /const rodSolo = soloPair\(rod, tap\);/);
    assert.match(ch1, /onTap: rodSolo\.toggle,/);
    assert.match(ch1, /id: 'tap', label: '▶ TAP', onPress: rodSolo\.tap \}/);
    assert.match(ch1, /id: 'strike', label: '▶ STRIKE', onPress: rodSolo\.strike \}/);
    const ch3 = strip(read(`${DIR}/modules/ch3Method.tsx`));
    assert.match(ch3, /const tuneSolo = soloPair\(strike, tap\);/);
    assert.match(ch3, /onPress: tuneSolo\.tap \}[\s\S]*?onPress: tuneSolo\.strike \}[\s\S]*?onTap: tuneSolo\.toggle,/);
    const ch7 = strip(read(`${DIR}/modules/ch7Trouble.tsx`));
    assert.match(ch7, /const solo = soloPair\(pb, tap\);/);
    assert.match(ch7, /void solo\.tap\(\)\.then\(/, 'pass 3: the tap still goes through soloPair, counted when it sounded');
    assert.match(ch7, /onPress: strikeNow \}/);
    assert.match(ch7, /onTap: solo\.toggle,/);
  });

  it('useDrumPlayback: only the newest press owns `pending`; ■ cancels a press at any stage', () => {
    const hook = strip(read(`${DIR}/useDrumPlayback.ts`));
    assert.match(hook, /const t = \+\+playTokRef\.current;\s*const current = \(\) => aliveRef\.current && t === playTokRef\.current;/);
    assert.match(hook, /const fenced = await startFenced\(\{\s*start: load,\s*stop: \(\) => \{\},[^\n]*\s*isCurrent: current,\s*\}\);\s*if \(!current\(\)\) return(?: false)?;\s*setPending\(false\);/, 'a superseded press never clears pending');
    assert.match(hook, /const stop = useCallback\(\(\) => \{\s*seqRef\.current\+\+;\s*playTokRef\.current\+\+;/);
  });
});

describe('drum toddler pass 2 — the what\'s-left screen keeps the chapter', () => {
  it('the chapter stays mounted (hidden) under the end screen; its sound and animation stop', () => {
    const host = strip(read(`${DIR}/DrumTuningLabScreen.tsx`));
    assert.doesNotMatch(host, /\{end \?\? \(/, 'the end screen no longer REPLACES the chapter');
    assert.match(host, /<View style=\{end \? styles\.gone : styles\.body\}/);
    assert.match(host, /gone: \{ display: 'none' \}/);
    assert.match(host, /hidden: !!endState \};/);
    assert.match(host, /onPracticeAgain=\{\(\) => \{\s*setRunId\(\(r\) => r \+ 1\);\s*openModule\('sound', 0\);/, '"from the start" still opens Chapter 1 fresh');
    const hook = strip(read(`${DIR}/useDrumPlayback.ts`));
    assert.match(hook, /const hidden = host\?\.hidden === true;\s*useEffect\(\(\) => \{\s*if \(hidden\) stop\(\);\s*\}, \[hidden, stop\]\);/);
    const ch2 = strip(read(`${DIR}/modules/ch2Prepare.tsx`));
    assert.match(ch2, /const hidden = useContext\(StepHostContext\)\?\.hidden === true;\s*useEffect\(\(\) => \{\s*if \(hidden\) setRunning\(false\);\s*\}, \[hidden\]\);/);
    const steps = strip(read(`${DIR}/steps.tsx`));
    assert.match(steps, /hidden\?: boolean;/);
  });
});

describe('drum toddler pass 2 — chapter corrections', () => {
  it('Ch7: a restart of the ringing strike counts, and drifts the rod once per strike when the ring ends', () => {
    const ch7 = strip(read(`${DIR}/modules/ch7Trouble.tsx`));
    assert.match(ch7, /strikeRef\.current = \{ id, n: sims\[id\]\.strikes \+ 1, k: 1 \};/);
    assert.match(ch7, /if \(pb\.playing && ring && ring\.id === caseId\) \{\s*strikeRef\.current = \{ id: ring\.id, n: ring\.n \+ 1, k: ring\.k \+ 1 \};\s*setSims\(\(all\) => \(\{ \.\.\.all, \[ring\.id\]: \{ \.\.\.all\[ring\.id\], strikes: all\[ring\.id\]\.strikes \+ 1 \} \}\)\);\s*\}\s*solo\.strike\(\);/);
    assert.match(ch7, /i === 1 \? t - 0\.12 \* struckNow\.k : t/);
  });

  it('Ch6: "already saved" only while that note is still listed', () => {
    const ch6 = strip(read(`${DIR}/modules/ch6Kit.tsx`));
    assert.match(ch6, /prior\?\.sig === sig && notes\.some\(\(x\) => x\.id === prior\.id\)/);
    assert.match(ch6, /lastSaved\.current = \{ sig, name: n\.name, id: n\.id \};/);
  });

  it('Ch6: ▶ BOTH counts as heard only once the floor tom has sounded', () => {
    const ch6 = strip(read(`${DIR}/modules/ch6Kit.tsx`));
    assert.doesNotMatch(ch6, /if \(both\.playing\) setHeardBoth\(true\);/);
    assert.match(ch6, /if \(!both\.playing\) return;\s*const id = setTimeout\(\(\) => setHeardBoth\(true\), \(RACK_FIRST_S \+ GAP_S\) \* 1000 \+ FLOOR_HEARD_MS\);\s*return \(\) => clearTimeout\(id\);/);
  });

  it('Ch6: the cap names the note it drops; names and notes are length-limited', () => {
    const ch6 = strip(read(`${DIR}/modules/ch6Kit.tsx`));
    assert.match(ch6, /const dropped = kept\.length >= MAX_TUNING_NOTES \?/, 'pass 3: the cap counts only notes the device holds');
    assert.match(ch6, /\{ text: `Saved "\$\{n\.name\}" on this device\.\$\{capLine\}`, ok: true \}/);
    assert.match(ch6, /maxLength=\{NAME_MAX\}/);
    assert.match(ch6, /maxLength=\{NOTE_MAX\}/);
  });
});
