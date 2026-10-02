/**
 * Full-app bug run 2 (2026-10-01), area 10 SHARED — regression receipts.
 *
 * Each case FAILED against the pre-fix file (R2: the fixed file copied aside,
 * the old one restored, the test run, then the fix restored).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

type Kv = { map: Map<string, string>; failGet: boolean };
const kv: Kv = { map: new Map(), failGet: false };
(globalThis as unknown as { __run2Kv: Kv }).__run2Kv = kv;
(globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;
const STUBS: Record<string, string> = {
  'async-storage': `const s = globalThis.__run2Kv; export default {
    getItem: async (k) => { if (s.failGet) throw new Error('unreadable'); return s.map.has(k) ? s.map.get(k) : null; },
    setItem: async (k, v) => { s.map.set(k, v); },
    removeItem: async (k) => { s.map.delete(k); },
  };`,
  supabase: `export const supabase = { rpc: async () => ({ data: null, error: { message: 'user_not_found' } }) };`,
  sync: `export const emitStudyProgress = () => {};`,
  reviewPrompt: `export const noteHighValueEvent = async () => {};`,
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'run2-stub:async-storage', shortCircuit: true };
    if (/\/lib\/supabase$/.test(specifier)) return { url: 'run2-stub:supabase', shortCircuit: true };
    if (/\/study\/sync$/.test(specifier)) return { url: 'run2-stub:sync', shortCircuit: true };
    if (/\/review\/reviewPrompt$/.test(specifier)) return { url: 'run2-stub:reviewPrompt', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      for (const ext of ['.ts', '.tsx', '/index.ts']) {
        const candidate = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith('run2-stub:')) return { format: 'module', shortCircuit: true, source: STUBS[url.slice('run2-stub:'.length)] };
    return nextLoad(url, context);
  },
});

const carry = await import('../src/features/lab/sessionCarry.ts');
const preview = await import('../src/features/lab/labPreviewStore.ts');
const { endLead, whatsLeft } = await import('../src/screens/lab/kit/labEnd.ts');

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

// ── 1. LabAudioPlayer: a clip never starts after the learner left the app ──

describe('LabAudioPlayer.play() honours a leave-the-app stop that lands during its awaits', () => {
  it('source: the stop epoch is read before the first await and checked with the gate', () => {
    const s = read('src/features/lab/LabAudioPlayer.ts');
    assert.match(s, /import \{ getSoundStopEpoch, isAudioOutputEnabled \} from '\.\.\/audio\/audioOutputStore';/);
    const body = s.slice(s.indexOf('async play('), s.indexOf('  stop(): void'));
    const at = body.indexOf('const stopEpoch = getSoundStopEpoch();');
    assert.ok(at > 0, 'epoch captured');
    assert.ok(at < body.indexOf('await '), 'captured BEFORE the first await');
    assert.match(body, /if \(!isAudioOutputEnabled\(\)\) return 'blocked';\n\s*if \(getSoundStopEpoch\(\) !== stopEpoch\) return 'blocked';/);
    assert.ok(body.indexOf("return 'blocked'") < body.indexOf('got.player.play()'), 'checked before play');
  });
});

// ── 2. The end screen never promises a carry the ledger will not make ──────

describe('sessionCarryOpen + the guest end-screen line', () => {
  beforeEach(() => {
    carry.__resetSessionCarryForTests();
    preview.endLabPreview();
  });

  it('open for a guest session and a signed-in account; CLOSED after a sign-out until Guest Mode restarts', async () => {
    assert.equal(carry.sessionCarryOpen(), true, 'no auth answer yet');
    carry.noteSessionIdentity('');
    assert.equal(carry.sessionCarryOpen(), true, 'a guest session');
    carry.noteSessionIdentity('u1');
    await carry.settleSessionCarry();
    await carry.settleSessionCarry();
    assert.equal(carry.sessionCarryOpen(), true);
    carry.noteSessionIdentity(''); // sign-out
    assert.equal(carry.sessionCarryOpen(), false);
    // …and it agrees with what the ledger actually does:
    assert.equal(carry.holdSessionWork<string[]>('t:x', () => ['w']), false);
    carry.restartGuestSession();
    assert.equal(carry.sessionCarryOpen(), true);
    assert.equal(carry.holdSessionWork<string[]>('t:x', () => ['w']), true);
  });

  it('closed during a members-only preview', () => {
    carry.noteSessionIdentity('');
    preview.startLabPreview('X', 'X');
    assert.equal(carry.sessionCarryOpen(), false);
    preview.endLabPreview();
    assert.equal(carry.sessionCarryOpen(), true);
  });

  it('endLead: carry=false tells a guest the plain truth; carry default keeps the sign-in line', () => {
    const units = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }];
    const part = whatsLeft(units, new Set(['a']));
    const full = whatsLeft(units, new Set(['a', 'b']));
    for (const w of [part, full]) {
      const closed = endLead(w, { mode: 'credit', noun: 'module', guest: true, carry: false });
      assert.match(closed, /You are not signed in, so nothing here is saved\.$/);
      assert.doesNotMatch(closed, /sign in before you close the app/);
      assert.match(endLead(w, { mode: 'credit', noun: 'module', guest: true }), /sign in before you close the app/);
    }
    // A preview and a signed-in learner are unchanged.
    assert.match(endLead(part, { mode: 'credit', noun: 'module', guest: true, preview: true, carry: false }), /members-only preview/);
    assert.match(endLead(part, { mode: 'credit', noun: 'module', carry: false }), /Everything you have done is saved/);
  });

  it('source: LabEndScreen and the Sound Systems mirror both ask the ledger', () => {
    const end = read('src/screens/lab/kit/LabEndScreen.tsx');
    assert.match(end, /endLead\(w, \{ mode, noun, guest: isGuest, preview: inPreview, carry: sessionCarryOpen\(\) \}\)/);
    const ss = read('src/screens/lab/soundsystems/SoundSystemsLabScreen.tsx');
    assert.match(ss, /: sessionCarryOpen\(\) \? 'You are not signed in, so nothing here is saved yet — sign in before you close the app to keep your progress\. Move through the lab in any order — this list is what still counts toward credit\.' : 'You are not signed in, so nothing here is saved\. Move through the lab in any order — this list is what still counts toward credit\.'/);
  });
});

// ── 3a. useLabNav: a dimmed ⏮ does nothing ─────────────────────────────────

describe('useLabNav ⏮ does what it is drawn as', () => {
  it('source: start() returns when the view draws ⏮ dimmed (sub-step mode, module 1, step 2+)', () => {
    const s = read('src/screens/lab/kit/useLabNav.ts');
    const body = s.slice(s.indexOf('const start = useCallback'), s.indexOf('const prev = useCallback'));
    assert.match(body, /if \(!view\.startOn\) return;\n\s*leaveEnd\(\);\n\s*go\(0\);/);
    assert.doesNotMatch(body, /sub\.index <= 0/);
  });
});

// ── 3b. BezelReadouts: the number is never cut, never carries " ›" ─────────

describe('BezelReadouts: a bare number wider than its cell', () => {
  it('source: drawn smaller (floor 9 pt) instead of ellipsized; no caret on the cropped value paths', () => {
    const s = read('src/screens/lab/rack/BezelReadouts.tsx');
    assert.match(s, /const V_MIN_FS = 9;/);
    assert.match(s, /fits\(s\) \? null : \{ fontSize: Math\.max\(V_MIN_FS, /);
    assert.match(s, /numFs\(it\.v\)\]\} numberOfLines=\{1\}>\n\s*\{it\.v\}\n\s*<\/Text>/);
    assert.match(s, /numFs\(parts\[0\]\)\]\} numberOfLines=\{1\}>\n\s*\{parts\[0\]\}\n\s*<\/Text>/);
    assert.doesNotMatch(s, /cropped && it\.onPress \? <Text style=\{styles\.tapMark\}>/);
    // The only caret left is on the key line, which a cropped cell drops.
    assert.equal(s.match(/styles\.tapMark\}> ›/g)?.length, 1);
  });
});

// ── 4. A failed device READ is never written over (labCompletion, labVisits) ─

describe('lab stores: a read that failed is not "nothing stored"', () => {
  const tick = () => new Promise((r) => setTimeout(r, 0));
  const settle = async () => {
    for (let i = 0; i < 6; i++) await tick();
  };

  it('labCompletion: banked units survive a failed boot read and a unit recorded meanwhile; the next read merges', async () => {
    kv.map.set('ape:labProgress', JSON.stringify({ units: { af_patchbay: ['p1', 'p2'] }, sent: [], af: false }));
    kv.failGet = true;
    const completion = await import('../src/features/lab/labCompletion.ts'); // boot hydrate fails
    await settle();
    completion.markLabUnit('af_patchbay', 'p3');
    await settle();
    assert.deepEqual(JSON.parse(kv.map.get('ape:labProgress')!).units.af_patchbay, ['p1', 'p2'], 'nothing written over the unread copy');
    kv.failGet = false;
    completion.markLabUnit('af_patchbay', 'p4');
    await settle();
    assert.deepEqual([...JSON.parse(kv.map.get('ape:labProgress')!).units.af_patchbay].sort(), ['p1', 'p2', 'p3', 'p4']);
    kv.failGet = false;
  });

  it('pagedProgress: a save after a failed load never writes over the stored pages', async () => {
    const paged = await import('../src/features/lab/pagedProgress.ts');
    kv.map.set('ape:labX:v1', JSON.stringify({ completed: [0, 1, 2], lastPage: 2, done: true }));
    kv.failGet = true;
    const got = await paged.loadPagedProgress('labX');
    assert.deepEqual(got.completed, []); // the screen sees an empty copy…
    await paged.savePagedProgress('labX', { completed: [5], lastPage: 5, done: false });
    assert.deepEqual(JSON.parse(kv.map.get('ape:labX:v1')!), { completed: [0, 1, 2], lastPage: 2, done: true }, '…and saving it writes nothing');
    kv.failGet = false;
    await paged.savePagedProgress('labX', { completed: [5], lastPage: 5, done: false });
    assert.deepEqual(JSON.parse(kv.map.get('ape:labX:v1')!), { completed: [0, 1, 2, 5], lastPage: 5, done: true });
    // A normal load/save is unchanged.
    await paged.savePagedProgress('labX', { completed: [1], lastPage: 1, done: false });
    assert.deepEqual(JSON.parse(kv.map.get('ape:labX:v1')!), { completed: [1], lastPage: 1, done: false });
  });

  it('labVisits: the same', async () => {
    kv.map.set('ape:labVisits', JSON.stringify({ lab1: ['a', 'b'] }));
    kv.failGet = true;
    const visits = await import('../src/features/lab/labVisits.ts');
    visits.markLabVisit('lab1', 'c');
    await settle();
    assert.deepEqual(JSON.parse(kv.map.get('ape:labVisits')!), { lab1: ['a', 'b'] });
    kv.failGet = false;
    visits.markLabVisit('lab1', 'd');
    await settle();
    assert.deepEqual([...JSON.parse(kv.map.get('ape:labVisits')!).lab1].sort(), ['a', 'b', 'c', 'd']);
  });
});
