/**
 * Drum Tuning Lab — toddler + cat bug pass 3 of 3 (2026-10-01). One test per
 * fix; each was run against the pre-fix files (R2) and failed there.
 *
 *  1. Ch3 HEAR and Ch7 DIAGNOSE counted a lug as "tapped" on the PRESS: with
 *     the audio gate refusing (output off, the prompt dismissed) nothing
 *     sounded, yet "tapped 8 of 8" opened ◉ REVEAL MAP and Ch7's "tap N lugs"
 *     unlocked WHERE? — evidence the learner never heard.
 *  2. Signing in mid-lab re-saves the guest's session notes: a write the
 *     store REFUSED still came back inside the returned list, so the note
 *     showed under "SAVED ON THIS DEVICE" and was gone next visit; a failed
 *     READ returned an empty list per note, so only the LAST session note
 *     stayed on screen (the others vanished from it).
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
(globalThis as unknown as { __drumStoreP3: Store }).__drumStoreP3 = store;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'node:test-async-storage-p3', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'node:test-async-storage-p3') {
      return {
        format: 'module',
        shortCircuit: true,
        source: `const s = globalThis.__drumStoreP3; export default { getItem: async (k) => { if (s.failGet) throw new Error('read failed'); return s.map.has(k) ? s.map.get(k) : null; }, setItem: async (k, v) => { if (s.failSet) throw new Error('disk full'); s.map.set(k, v); }, removeItem: async (k) => { s.map.delete(k); } };`,
      };
    }
    return nextLoad(url, context);
  },
});

const progress = await import('../src/screens/lab/drumtuning/drumProgress.ts');
const { soloPair } = await import('../src/screens/lab/drumtuning/soloPair.ts');
const KEY = 'ape:drumtuning:v1';
const note = (id: string, savedAt: number) => ({ id, name: id, savedAt, drums: [{ drum: '12" × 8" rack tom', batterHz: 200, note: '' }] });

describe('drum toddler pass 3 — a lug is tapped when it SOUNDED', () => {
  it('useDrumPlayback.play resolves true only after the clip started; every refusal resolves false', () => {
    const hook = strip(read(`${DIR}/useDrumPlayback.ts`));
    assert.match(hook, /play: \(\) => Promise<boolean>;/);
    assert.match(hook, /if \(!granted \|\| !focusedRef\.current\) \{\s*setPending\(false\);\s*return false;\s*\}/, 'a refused gate resolves false');
    assert.match(hook, /playerRef\.current\.play\(0\);[\s\S]*?setPlaying\(true\);\s*return true;\s*\}\)\(\)\.catch\(\(\) => false\);/);
  });

  it('soloPair.tap / .strike pass the sounding result through (false when the play refused)', async () => {
    const t = (result: boolean) => ({ playing: false, pending: false, stop: () => undefined, play: () => Promise.resolve(result) });
    const refused = soloPair(t(true), t(false));
    assert.equal(await refused.tap(), false, 'gate refused: the tap did not sound');
    const heard = soloPair(t(false), t(true));
    assert.equal(await heard.tap(), true);
    assert.equal(await soloPair(t(true), t(false)).strike(), true);
  });

  it('Ch3 HEAR marks the lug only when its tap sounded — and the lug that was pressed, not the one under the fader later', () => {
    const ch3 = strip(read(`${DIR}/modules/ch3Method.tsx`));
    assert.match(ch3, /const hearTapNow = \(\) => \{\s*const at = hearLug;\s*void hearTap\.play\(\)\.then\(\(ok\) => \{\s*if \(ok\) setTapped\(\(s\) => \(s\.has\(at\) \? s : new Set\(\[\.\.\.s, at\]\)\)\);/);
    assert.doesNotMatch(ch3, /setTapped\(\(s\) => \(s\.has\(hearLug\)/, 'never counted on the press');
  });

  it('Ch7 DIAGNOSE marks the lug on the case it was tapped on, only when the tap sounded', () => {
    const ch7 = strip(read(`${DIR}/modules/ch7Trouble.tsx`));
    assert.match(ch7, /const tapNow = \(\) => \{\s*const id = caseId;\s*const at = lug;\s*void solo\.tap\(\)\.then\(\(ok\) => \{\s*if \(!ok\) return;\s*setSims\(/);
  });
});

describe('drum toddler pass 3 — sign-in re-save never lists a refused note as saved', () => {
  it('root cause: a refused write still returns the note inside its list', async () => {
    store.map.clear();
    progress.setDrumSaveBlocked(false);
    store.failGet = false;
    store.failSet = true;
    const r = await progress.saveTuningNote(note('s1', 5));
    assert.equal(r.saved, false);
    assert.ok(r.notes.some((n) => n.id === 's1'), 'the in-memory copy carries it — so it is never the stored list');
    store.failSet = false;
  });

  it('keepSessionNotes: refused writes come back as `failed`, the stored list stays what the device holds', async () => {
    store.map.clear();
    progress.setDrumSaveBlocked(false);
    store.failGet = false;
    store.failSet = false;
    await progress.saveTuningNote(note('stored', 1));
    const stored = (await progress.loadDrumProgress()).notes;
    store.failSet = true;
    const kept = await progress.keepSessionNotes(stored, [note('g1', 2), note('g2', 3)]);
    store.failSet = false;
    assert.deepEqual(kept.notes.map((n) => n.id), ['stored'], 'nothing refused is listed as stored');
    assert.deepEqual(kept.failed.map((n) => n.id), ['g1', 'g2'], 'every refused note is kept for the screen');
    assert.deepEqual((await progress.loadDrumProgress()).notes.map((n) => n.id), ['stored']);
  });

  it('keepSessionNotes: a failed READ never collapses the session to its last note', async () => {
    store.map.clear();
    progress.setDrumSaveBlocked(false);
    store.map.set(KEY, JSON.stringify({ modules: {}, notes: [note('real', 1)] }));
    store.failGet = true;
    const kept = await progress.keepSessionNotes([], [note('g1', 2), note('g2', 3), note('g3', 4)]);
    store.failGet = false;
    assert.deepEqual(kept.failed.map((n) => n.id), ['g1', 'g2', 'g3']);
    assert.deepEqual(kept.notes, []);
    assert.deepEqual((await progress.loadDrumProgress()).notes.map((n) => n.id), ['real'], 'the device copy was never written over');
  });

  it('keepSessionNotes: writes that land are listed from the store', async () => {
    store.map.clear();
    progress.setDrumSaveBlocked(false);
    store.failGet = false;
    store.failSet = false;
    const kept = await progress.keepSessionNotes([], [note('g1', 2), note('g2', 3)]);
    assert.deepEqual(kept.notes.map((n) => n.id), ['g1', 'g2']);
    assert.deepEqual(kept.failed, []);
  });

  it('the host lists refused notes apart, marks them NOT SAVED, keeps them through later saves, and deletes them locally', () => {
    const host = strip(read(`${DIR}/DrumTuningLabScreen.tsx`));
    assert.match(host, /const kept = await keepSessionNotes\(s\.notes, notesRef\.current\);\s*if \(!alive\) return;\s*unsavedRef\.current = kept\.failed;\s*setUnsaved\(kept\.failed\);\s*setNotes\(listed\(kept\.notes\)\);/);
    assert.match(host, /if \(s\.saved\) \{\s*setNotes\(listed\(s\.notes\)\);\s*return 'saved';/);
    assert.match(host, /if \(unsavedRef\.current\.some\(\(n\) => n\.id === id\)\) \{[\s\S]*?return 'session';\s*\}\s*const s = await deleteTuningNote\(id\);/);
    assert.match(host, /unsavedIds=\{unsavedIds\}/);
    const ch6 = strip(read(`${DIR}/modules/ch6Kit.tsx`));
    assert.match(ch6, /'SAVED ON THIS DEVICE'\} · \{sorted\.length - unsavedCount\}/);
    assert.match(ch6, /isUnsaved\(n\) \? <Text style=\{\[styles\.noteDetail, \{ color: colors\.red \}\]\}>NOT SAVED — this session only<\/Text>/);
    assert.match(ch6, /const kept = notes\.filter\(\(x\) => guest \|\| !unsavedIds\?\.has\(x\.id\)\);/, 'the 24-note cap counts only what the device holds');
  });
});
