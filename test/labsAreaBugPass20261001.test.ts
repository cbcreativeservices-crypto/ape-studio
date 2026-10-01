/**
 * Labs (amp · tuning · ear · room design) — night bug pass 1, 2026-10-01.
 * The room-design store fence is exercised for real (AsyncStorage stubbed);
 * the screen fixes are pinned by source guards (the reasoning sits in the
 * comment beside each fix in the source).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it, test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const ASYNC_STORAGE = '@react-native-async-storage/async-storage';
const STUB_URL = 'ape-test:async-storage-roomdesign-pass1';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === ASYNC_STORAGE) return { url: STUB_URL, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === STUB_URL) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `
          const mem = new Map();
          globalThis.__apeRoomPass1Storage = mem;
          let delay = 0;
          globalThis.__apeRoomPass1Delay = (ms) => { delay = ms; };
          const wait = () => new Promise((r) => setTimeout(r, delay));
          export default {
            async getItem(k) { await wait(); return mem.has(k) ? mem.get(k) : null; },
            async setItem(k, v) { mem.set(k, v); },
            async removeItem(k) { mem.delete(k); },
          };
        `,
      };
    }
    return next(url, context);
  },
});

const store = await import('../src/features/roomdesign/roomDesignStore.ts');
const { defaultDesign } = await import('../src/screens/lab/roomdesign/roomModel.ts');
const { planTransform } = await import('../src/screens/lab/roomdesign/planGeom.ts');
const mem = (): Map<string, string> => (globalThis as { __apeRoomPass1Storage?: Map<string, string> }).__apeRoomPass1Storage!;
const setDelay = (ms: number) => (globalThis as { __apeRoomPass1Delay?: (ms: number) => void }).__apeRoomPass1Delay!(ms);
const KEY = 'ape:roomdesign:v1';

describe('room designs — a save racing the account wipe', () => {
  it('a save waiting on the hydrate never lands in the next account', async () => {
    mem().clear();
    setDelay(0);
    store.setRoomDesignSaveBlocked(false);
    store.resetLocal();
    setDelay(20); // the hydrate is still reading when the wipe runs
    const pending = store.saveRoomDesign({ ...defaultDesign('metric'), name: 'old account' });
    store.resetLocal(); // account switch: memory dropped, read fenced
    mem().clear(); // …and the ape:* sweep removed the key
    assert.equal(await pending, false, 'the fenced save reports not saved');
    await new Promise((r) => setTimeout(r, 40));
    assert.ok(!mem().has(KEY), 'nothing of the previous account was written back');
    setDelay(0);
    assert.deepEqual(store.getRoomDesigns(), []);
  });
});

test('room plan: a corner drag cannot run away (the transform is held while dragging)', () => {
  // Why the hold matters: with the LIVE fit, a finger resting near the glass
  // edge maps beyond the room every time the room grows.
  const gw = 300;
  const gh = 300;
  let width = 4;
  const fingerX = gw - 16; // near the right frame edge
  for (let i = 0; i < 10; i++) {
    const T = planTransform({ minX: 0, minY: 0, maxX: width, maxY: 5, width, length: 5 }, gw, gh);
    width = Math.min(20, T.toM({ x: fingerX, y: 100 }).x);
  }
  assert.ok(width > 6, `the live re-fit feeds back (reached ${width.toFixed(1)} m)`);
  const s = read('src/screens/lab/roomdesign/RoomPlanView.tsx');
  assert.match(s, /const frozenT = useRef<PlanTransform \| null>\(null\);/);
  assert.match(s, /frozenT\.current = st\.T;/);
  assert.match(s, /onPanResponderTerminate: \(\) => \{\n\s*const d = endDrag\(\);/);
});

test('room treatment: double taps never stack duplicates; ITEM ON/OFF flips the latest state', () => {
  const s = read('src/screens/lab/roomdesign/modules/modTreatment.tsx');
  assert.match(s, /setItems\(\(ts\) => \(ts\.some\(\(x\) => sameSpot\(x, t\)\) \? ts : \[\.\.\.ts, t\]\)\);/);
  assert.match(s, /const taken = new Set\(ts\.filter\(\(t\) => t\.kind === 'basstrap'\)\.map\(\(t\) => t\.wall\)\);/);
  assert.match(s, /\{ \.\.\.t, enabled: !t\.enabled \}/);
});

test('room monitoring: HEIGHT falls back to the tweeters once the sub is gone', () => {
  const s = read('src/screens/lab/roomdesign/modules/modMonitoring.tsx');
  assert.match(s, /const heightTarget: HeightTarget = heightPick === 'sub' && !SUB \? 'tweeter' : heightPick;/);
});

test('room create: a typed ceiling keeps the low point under it', () => {
  const s = read('src/screens/lab/roomdesign/modules/modCreate.tsx');
  assert.match(s, /const height = Math\.max\(H_MIN, Math\.min\(H_MAX, toMetres\(v, units\)\)\);\n\s*return \{ \.\.\.r, height, heightLow: Math\.min\(r\.heightLow, height - 0\.1\) \};/);
});

test('room review: DELETE asks first', () => {
  const s = read('src/screens/lab/roomdesign/modules/modReview.tsx');
  assert.match(s, /confirmDialog\('Delete saved design\?'[^\n]*\(\) => deleteSaved\(d\.id\), \{ destructive: true \}\)/);
});

test('amp: the queued visit read merges into what was tapped meanwhile; home reads behind the writes', () => {
  const m = read('src/screens/lab/amp/AmpModuleScreen.tsx');
  assert.match(m, /setDone\(\(d\) => d \|\| m\.done\);/);
  assert.match(m, /setChecksAnswered\(\(prev\) => \(\{ \.\.\.m\.checks, \.\.\.prev \}\)\);/);
  const h = read('src/screens/lab/amp/AmpLabHomeScreen.tsx');
  assert.match(h, /void updateAmpProgress\(\(\) => \{\}\)\.then\(\(s\) => \{\n\s*if \(alive\) setProgress\(s\);/);
});

test('tuning: BASIC/MATH tapped before the load is kept', () => {
  const t = read('src/screens/lab/tuning/TuningLabScreen.tsx');
  assert.match(t, /if \(mathPickedRef\.current != null\) p = \{ \.\.\.p, mathView: mathPickedRef\.current \};/);
  assert.match(t, /mathPickedRef\.current = next;/);
});

test('ear: a play that lands while the next trial loads is dropped', () => {
  const e = read('src/screens/lab/eartraining/EarModuleScreen.tsx');
  assert.match(e, /if \(!okOut \|\| !aliveRef\.current \|\| busyRef\.current\) return;/);
});
