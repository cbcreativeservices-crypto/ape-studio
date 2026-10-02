/**
 * Labs B (amp · tuning · ear · room design · production) — night bug pass 2,
 * 2026-10-01. The production store is exercised for real (a key-value stub
 * whose reads can fail); the screen fixes are pinned by source guards (the
 * reasoning sits in the comment beside each fix in the source).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

// House pattern (productionEngine.test.ts): extensionless sibling imports.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const { createProjectStore, memoryStore, newProject, PROJECT_KEYS } = await import('../src/features/production/projectStore.ts');

test('production store: a failed READ is never quarantined and never written over', async () => {
  const mem = memoryStore();
  const a = newProject('preprod', 'music', 'Keeper A');
  const b = newProject('preprod', 'music', 'Keeper B');
  const stored = JSON.stringify([a, b]);
  await mem.setItem(PROJECT_KEYS.preprod, stored);
  let failReads = 0;
  const kv = {
    getItem: async (k: string) => {
      if (failReads > 0) {
        failReads--;
        throw new Error('transient');
      }
      return mem.getItem(k);
    },
    setItem: (k: string, v: string) => mem.setItem(k, v),
    removeItem: (k: string) => mem.removeItem(k),
  };
  const store = createProjectStore(kv);
  failReads = 1;
  assert.deepEqual(await store.load('preprod'), [], 'a failed read still reads as empty');
  assert.equal(await mem.getItem(PROJECT_KEYS.preprod), stored, 'the key was not moved aside');
  assert.equal(await mem.getItem(`${PROJECT_KEYS.preprod}:damaged`), null);
  failReads = 1;
  assert.equal(await store.upsert(newProject('preprod', 'music', 'New')), false, 'the write is refused');
  assert.equal(await mem.getItem(PROJECT_KEYS.preprod), stored, 'nothing was written over the two projects');
  failReads = 1;
  assert.equal(await store.setValue('preprod', a.id, 'define', 'purpose', 'x'), null);
  failReads = 1;
  assert.equal(await store.remove('preprod', a.id), false);
  failReads = 1;
  assert.equal(await store.duplicate('preprod', a.id), null);
  assert.equal(await mem.getItem(PROJECT_KEYS.preprod), stored);
  assert.equal((await store.load('preprod')).length, 2, 'both projects are still there once storage reads again');
});

test('ear player: a clip write failing partway deletes the clips already written', () => {
  const s = read('src/features/ear/earPlayer.ts');
  const load = s.slice(s.indexOf('async load(bufs: Buf[])'), s.indexOf('this.files = uris;'));
  assert.match(load, /\} catch \(e\) \{[\s\S]*?await Promise\.all\(uris\.map\(\(u\) => freeWavUri\(u\)\)\);\s*throw e;/);
});

test('tuning player: a failed clip load is not an unhandled rejection, and is disposed', () => {
  const s = read('src/features/tuning/tuningAudio.ts');
  assert.match(s, /job\.finally\(\(\) => this\.loadingClips\.delete\(key\)\)\.catch\(\(\) => \{\}\);/);
  assert.doesNotMatch(s, /void job\.finally\(/);
  assert.match(s, /await p\.load\(\[buf\]\);\s*\} catch \(e\) \{\s*p\.dispose\(\);/);
  assert.match(s, /\} finally \{\s*if \(this\.wantKey === key\) this\.wantKey = null;/);
});

test('tuning lab: a chapter completed before the progress loads is kept', () => {
  const s = read('src/screens/lab/tuning/TuningLabScreen.tsx');
  assert.match(s, /if \(!base\) \{\s*if \(!pendingDoneRef\.current\.includes\(chapter\)\) pendingDoneRef\.current\.push\(chapter\);/);
  assert.match(s, /const early = pendingDoneRef\.current\.filter/);
  assert.match(s, /if \(!guestRef\.current\) void saveTuningProgress\(p\);/);
});

test('amp: an unreadable read is never written back (credit kept)', () => {
  const s = read('src/features/amp/ampProgress.ts');
  assert.match(s, /unreadable\.add\(s\);/);
  const save = s.slice(s.indexOf('export async function saveAmpProgress'), s.indexOf('let writeQueue'));
  const g = save.indexOf('if (unreadable.has(s)) return;');
  assert.ok(g >= 0 && g < save.indexOf('AsyncStorage.setItem'));
});

test('amp: a FINISH read landing after a strip move does not reopen the end screen', () => {
  const s = read('src/screens/lab/amp/AmpModuleScreen.tsx');
  assert.match(s, /const my = \+\+endReq\.current;[\s\S]*?if \(my === endReq\.current\) setEndState\(s\);/);
  assert.match(s, /\(i: number\) => \{\s*endReq\.current\+\+;\s*setEndState\(null\);/);
  assert.match(s, /const unEnd = useCallback\(\(\) => \{\s*endReq\.current\+\+;/);
});

test('room design: save wording stays neutral until the tier is known', () => {
  assert.match(read('src/screens/lab/roomdesign/labCtx.ts'), /resolved: boolean;/);
  assert.match(read('src/screens/lab/roomdesign/RoomDesignLabScreen.tsx'), /guest: !resolved \? false : guest,\s*preview,\s*resolved,/);
  const e = read('src/screens/lab/roomdesign/modules/modExplore.tsx');
  assert.match(e, /const known = resolved;/);
  // Night pass 3 split the resolved branch into guest / preview wording.
  assert.match(e, /: !known\s*\? 'Not saved yet — still checking your account/);
  // Owner ruling 2026-10-01: a signed-out guest's SAVE is held for the
  // sign-in hand-off (SAVE_HELD); when it could not be held, it says so.
  assert.match(e, /\? held\s*\? SAVE_HELD\s*: 'Kept on screen only — you are not signed in, so this design is not saved\.'/);
});

test('room design: a duplicate ADD selects the item already there', () => {
  const s = read('src/screens/lab/roomdesign/modules/modTreatment.tsx');
  assert.match(s, /const twin = design\.treatment\.find\(\(x\) => sameSpot\(x, t\)\);/);
  assert.equal(s.match(/selectAdded\(t\);/g)?.length, 2);
  assert.doesNotMatch(s, /\[\.\.\.ts, t\]\)\);\n\s*setSelId\(t\.id\);/);
});

test('room plan: a refused drag lets go of the held transform', () => {
  const s = read('src/screens/lab/roomdesign/RoomPlanView.tsx');
  assert.match(s, /onPanResponderReject: \(\) => \{\s*endDrag\(\);/);
});
