/**
 * Guest work → the account, in the same app session (owner ruling
 * 2026-10-01: "if in same session guest signs in then current session is
 * saved and stored").
 *
 * The shared ledger (src/features/lab/sessionCarry.ts) and every lab store
 * that refuses to write for a guest are exercised for real against an
 * in-memory AsyncStorage. For each store, four cases:
 *   1. a guest earns X, signs in → X is stored under the account (after the
 *      sign-in's device wipe, which would otherwise delete it);
 *   2. a member signs OUT, then a different user signs in → nothing carried;
 *   3. a members-only PREVIEW → nothing (owner 2026-09-01);
 *   4. a merge with credit already stored never loses anything (a signed-in
 *      learner whose membership read failed works as a "guest" meanwhile).
 * The screen wiring (who holds instead of saving) is pinned by source guards.
 * R2: every case was run against copies of the pre-change files and failed.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

type Kv = { map: Map<string, string>; failGet: boolean };
const kv: Kv = { map: new Map(), failGet: false };
(globalThis as unknown as { __carryKv: Kv }).__carryKv = kv;
(globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;

const STUBS: Record<string, string> = {
  '@react-native-async-storage/async-storage': `const s = globalThis.__carryKv; export default {
    getItem: async (k) => { if (s.failGet) throw new Error('unreadable'); return s.map.has(k) ? s.map.get(k) : null; },
    setItem: async (k, v) => { s.map.set(k, v); },
    removeItem: async (k) => { s.map.delete(k); },
    multiRemove: async (ks) => { for (const k of ks) s.map.delete(k); },
    getAllKeys: async () => [...s.map.keys()],
  };`,
  supabase: `export const supabase = { rpc: async () => ({ data: null, error: { message: 'user_not_found' } }) };`,
  sync: `export const emitStudyProgress = () => {};`,
  reviewPrompt: `export const noteHighValueEvent = async () => {};`,
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'carry-stub:async-storage', shortCircuit: true };
    if (/\/lib\/supabase$/.test(specifier)) return { url: 'carry-stub:supabase', shortCircuit: true };
    if (/\/study\/sync$/.test(specifier)) return { url: 'carry-stub:sync', shortCircuit: true };
    if (/\/review\/reviewPrompt$/.test(specifier)) return { url: 'carry-stub:reviewPrompt', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      for (const ext of ['.ts', '.tsx', '/index.ts']) {
        const candidate = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith('carry-stub:')) {
      const name = url.slice('carry-stub:'.length);
      return { format: 'module', shortCircuit: true, source: STUBS[name === 'async-storage' ? '@react-native-async-storage/async-storage' : name] };
    }
    return nextLoad(url, context);
  },
});

const carry = await import('../src/features/lab/sessionCarry.ts');
const preview = await import('../src/features/lab/labPreviewStore.ts');
const completion = await import('../src/features/lab/labCompletion.ts');
const visits = await import('../src/features/lab/labVisits.ts');
const paged = await import('../src/features/lab/pagedProgress.ts');
const ss = await import('../src/features/soundsystems/progress.ts');
const amp = await import('../src/features/amp/ampProgress.ts');
const ear = await import('../src/features/ear/earProgress.ts');
const tuning = await import('../src/features/tuning/tuningProgress.ts');
const drum = await import('../src/screens/lab/drumtuning/drumProgress.ts');
const mastering = await import('../src/screens/lab/mastering/masteringProgress.ts');
const room = await import('../src/features/roomdesign/roomDesignStore.ts');
const { defaultDesign } = await import('../src/screens/lab/roomdesign/roomModel.ts');

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const tick = () => new Promise((r) => setTimeout(r, 0));
const settle = async () => {
  for (let i = 0; i < 6; i++) await tick();
};
const json = (k: string) => {
  const v = kv.map.get(k);
  return v == null ? undefined : JSON.parse(v);
};

/** The account switch exactly as accountLocalSync runs it: the ledger learns
 *  the identity at the auth event, the device is wiped (every `ape:*` key and
 *  the in-memory stores), then the hand-off settles. */
async function authEvent(identity: string, wipe: boolean): Promise<void> {
  carry.noteSessionIdentity(identity);
  if (wipe) {
    for (const k of [...kv.map.keys()]) if (k.startsWith('ape:')) kv.map.delete(k);
    completion.resetLocal();
    visits.resetLocal();
    ss.resetLocal();
    room.resetLocal();
  }
  await carry.settleSessionCarry();
  await settle();
}
/** A launch that starts signed out (a guest). */
async function guestLaunch(): Promise<void> {
  await authEvent('', false);
}
async function memberLaunch(uid: string): Promise<void> {
  await authEvent(uid, false);
}
/** Guest → member (first sign-in on the device wipes it). */
const signIn = (uid: string) => authEvent(uid, true);
const signOut = () => authEvent('', true);

function blockAll(on: boolean) {
  ss.setSoundSystemsSaveBlocked(on);
  amp.setAmpSaveBlocked(on);
  ear.setEarSaveBlocked(on);
  drum.setDrumSaveBlocked(on);
  mastering.setMasteringSaveBlocked(on);
  room.setRoomDesignSaveBlocked(on);
}

/**
 * The two NEGATIVE cases, each with a POSITIVE CONTROL in the same run — so
 * the test cannot pass on code that simply never carries anything (R2).
 * `work(tag)` does a guest's work tagged `tag`; `has(tag)` says whether the
 * device holds it now.
 */
type Work = (tag: 'A' | 'B') => Promise<void> | void;
type Has = (tag: 'A' | 'B') => boolean;
async function signOutCase(work: Work, has: Has): Promise<void> {
  await guestLaunch();
  await work('A');
  await settle();
  await signIn('u1');
  assert.equal(has('A'), true, 'control: a guest session IS written to the first account');
  await signOut();
  await work('B'); // done after u1 signed out
  await settle();
  await signIn('u2');
  assert.equal(has('A'), false, "u1's work never reaches u2");
  assert.equal(has('B'), false, 'work done after a sign-out is never carried');
}
async function previewCase(work: Work, has: Has): Promise<void> {
  await guestLaunch();
  await work('A');
  preview.startLabPreview('PreviewedLab', 'A members-only lab');
  await work('B');
  preview.endLabPreview();
  await settle();
  await signIn('u1');
  assert.equal(has('A'), true, 'control: the guest work outside the preview IS carried');
  assert.equal(has('B'), false, 'PREVIEW EARNS NOTHING');
}

beforeEach(async () => {
  carry.__resetSessionCarryForTests();
  preview.endLabPreview();
  kv.map.clear();
  kv.failGet = false;
  blockAll(false);
  completion.resetLocal();
  visits.resetLocal();
  ss.resetLocal();
  room.resetLocal();
  await settle();
});

// ── the ledger itself ────────────────────────────────────────────────────────

describe('sessionCarry — the shared hand-off', () => {
  it('a guest session’s work is written to its FIRST account, after that sign-in’s wipe', async () => {
    const got: unknown[] = [];
    carry.registerSessionCarry<string[]>('t:ledger', async (h) => {
      got.push([...h]);
      return true;
    });
    await guestLaunch();
    assert.equal(carry.holdSessionWork<string[]>('t:ledger', (p) => [...(p ?? []), 'x']), true);
    carry.noteSessionIdentity('u1');
    await tick();
    assert.deepEqual(got, [], 'nothing is written before the wipe has run');
    await carry.settleSessionCarry();
    assert.deepEqual(got, [['x']]);
  });

  it('a sign-out drops what was held, and nothing done after it is carried to the next account', async () => {
    const got: unknown[] = [];
    carry.registerSessionCarry<string[]>('t:ledger2', async (h) => {
      got.push([...h]);
      return true;
    });
    await memberLaunch('u1');
    await signOut();
    assert.equal(carry.holdSessionWork<string[]>('t:ledger2', (p) => [...(p ?? []), 'after-signout']), false);
    await signIn('u2');
    assert.deepEqual(got, []);
  });

  it('a preview holds nothing', async () => {
    await guestLaunch();
    preview.startLabPreview('MasteringLab', 'Mastering');
    assert.equal(carry.holdSessionWork<string[]>('t:ledger3', () => ['x']), false);
    assert.equal(carry.peekSessionWork('t:ledger3'), undefined);
  });

  it('a signed-in learner (tier read failed) has held work written straight to the same account', async () => {
    const got: unknown[] = [];
    carry.registerSessionCarry<string[]>('t:ledger4', async (h) => {
      got.push([...h]);
      return true;
    });
    await memberLaunch('u1');
    carry.holdSessionWork<string[]>('t:ledger4', (p) => [...(p ?? []), 'y']);
    await settle();
    assert.deepEqual(got, [['y']]);
  });

  it('a Guest Mode start begins a fresh guest session (nothing earlier carried, new work carried)', async () => {
    const got: unknown[] = [];
    carry.registerSessionCarry<string[]>('t:ledger5', async (h) => {
      got.push([...h]);
      return true;
    });
    await memberLaunch('u1');
    await signOut();
    carry.restartGuestSession();
    carry.holdSessionWork<string[]>('t:ledger5', (p) => [...(p ?? []), 'new-guest']);
    await signIn('u2');
    assert.deepEqual(got, [['new-guest']]);
  });

  it('accountLocalSync: the ledger learns each identity at the event and settles after the wipe', () => {
    const s = read('src/features/account/accountLocalSync.ts');
    // (guestEphemeral 2026-10-04: a launch confirmed to be a guest runs the
    // guest launch wipe in the sync's place — same queue, same order, the
    // hand-off still settles after it.)
    assert.match(s, /noteSessionIdentity\(identity\);[\s\S]{0,400}?chain = chain\.then\(\(\) => \(guestLaunch \? wipeGuestLaunch\(\) : syncLocalToIdentity\(identity\)\)\)\.catch\(\(\) => \{\}\);\s*chain = chain\.then\(\(\) => settleSessionCarry\(\)\)\.catch\(\(\) => \{\}\);/);
    const auth = read('src/screens/auth/AuthScreen.tsx');
    assert.match(auth, /await clearLocalAccountData\(\{ total: true \}\);[\s\S]{0,300}restartGuestSession\(\);/);
  });
});

// ── labCompletion (credit units; written for everyone, lost in the wipe) ────

describe('labCompletion — a guest’s credit units', () => {
  it('a guest earns a unit, signs in → it is stored under the account', async () => {
    await guestLaunch();
    completion.markLabUnit('af_wave_physics', 'w1');
    await settle();
    await signIn('u1');
    assert.deepEqual(json('ape:labProgress')?.units?.af_wave_physics, ['w1']);
  });
  it('a member signs out, a different user signs in → nothing carried', async () => {
    const units = () => (json('ape:labProgress')?.units?.af_wave_physics ?? []) as string[];
    await signOutCase((t) => completion.markLabUnit('af_wave_physics', t), (t) => units().includes(t));
  });
  it('a preview → nothing', async () => {
    const units = () => (json('ape:labProgress')?.units?.af_wave_physics ?? []) as string[];
    await previewCase((t) => completion.markLabUnit('af_wave_physics', t), (t) => units().includes(t));
  });
  it('replaying into an account that already has units keeps them all', async () => {
    await guestLaunch();
    completion.markLabUnit('af_wave_physics', 'w2');
    await settle();
    // Sign-in: the wipe runs, the account banks a unit of its own, THEN the
    // hand-off replays the guest's — a union, nothing lost.
    carry.noteSessionIdentity('u1');
    for (const k of [...kv.map.keys()]) kv.map.delete(k);
    completion.resetLocal();
    completion.markLabUnit('af_wave_physics', 'w1');
    await settle();
    await carry.settleSessionCarry();
    await settle();
    assert.deepEqual(new Set(json('ape:labProgress').units.af_wave_physics), new Set(['w1', 'w2']));
  });
});

// ── labVisits ───────────────────────────────────────────────────────────────

describe('labVisits — a guest’s opened modules', () => {
  it('a guest’s visit (persist:false) is written to the account at sign-in', async () => {
    await guestLaunch();
    visits.markLabVisit('eq', 'm1', { persist: false });
    await settle();
    assert.equal(json('ape:labVisits'), undefined, 'nothing written while a guest');
    await signIn('u1');
    assert.deepEqual(json('ape:labVisits'), { eq: ['m1'] });
  });

  it('sign-out → different user → nothing', async () => {
    const eq = () => (json('ape:labVisits')?.eq ?? []) as string[];
    await signOutCase((t) => visits.markLabVisit('eq', t, { persist: false }), (t) => eq().includes(t));
  });
  it('preview → nothing', async () => {
    const eq = () => (json('ape:labVisits')?.eq ?? []) as string[];
    await previewCase((t) => visits.markLabVisit('eq', t, { persist: false }), (t) => eq().includes(t));
  });
  it('merges with visits already stored', async () => {
    kv.map.set('ape:labVisits', JSON.stringify({ eq: ['m1'], tube: ['a'] }));
    await memberLaunch('u1');
    visits.markLabVisit('eq', 'm2', { persist: false });
    await settle();
    const v = json('ape:labVisits');
    assert.deepEqual(new Set(v.eq), new Set(['m1', 'm2']));
    assert.deepEqual(v.tube, ['a']);
  });
});

// ── pagedProgress (PagedLab, the Sound Systems modes, Start Here) ───────────

describe('pagedProgress — a guest’s pages', () => {
  it('a guest finishes pages, signs in → they are stored; a later save from an older copy keeps them', async () => {
    await guestLaunch();
    paged.holdPagedProgress('envelope', { done: 0 });
    paged.holdPagedProgress('envelope', { done: 2 });
    paged.holdPagedProgress('envelope', { lastPage: 3 });
    await signIn('u1');
    assert.deepEqual(json('ape:envelope:v1'), { completed: [0, 2], lastPage: 3, done: false });
    await paged.savePagedProgress('envelope', { completed: [], lastPage: 0, done: false });
    assert.deepEqual(json('ape:envelope:v1').completed, [0, 2], 'a stale save never drops carried pages');
  });
  it('sign-out → different user → nothing', async () => {
    const pages = () => (json('ape:envelope:v1')?.completed ?? []) as number[];
    const n = { A: 1, B: 2 } as const;
    await signOutCase((t) => paged.holdPagedProgress('envelope', { done: n[t] }), (t) => pages().includes(n[t]));
  });
  it('preview → nothing', async () => {
    const pages = () => (json('ape:envelope:v1')?.completed ?? []) as number[];
    const n = { A: 1, B: 2 } as const;
    await previewCase((t) => paged.holdPagedProgress('envelope', { done: n[t] }), (t) => pages().includes(n[t]));
  });
  it('merges with pages already stored (a union; done never cleared)', async () => {
    kv.map.set('ape:speech:v1', JSON.stringify({ completed: [0, 1], lastPage: 1, done: true }));
    await memberLaunch('u1');
    paged.holdPagedProgress('speech', { done: 4 });
    await settle();
    const p = json('ape:speech:v1');
    assert.deepEqual(p.completed, [0, 1, 4]);
    assert.equal(p.done, true);
  });
  it('the hosts hold instead of saving for a guest, and only DELTAS', () => {
    const pl = read('src/screens/lab/kit/PagedLab.tsx');
    assert.match(pl, /if \(!guestRef\.current && !loadedAsGuestRef\.current\) void savePagedProgress\(labId, next\);\s*else holdPaged\(base, next\);/);
    assert.match(pl, /for \(const i of next\.completed\) if \(!base\.completed\.includes\(i\)\) holdPagedProgress\(labId, \{ done: i \}\);/);
    const sp = read('src/screens/lab/soundsystems/SsPagedLab.tsx');
    assert.match(sp, /if \(!noSaveRef\.current && !loadedNoSaveRef\.current\) void savePagedProgress\(labId, next\);\s*else \{[\s\S]*?holdPagedProgress\(labId, \{ done: i \}\)/);
    const sh = read('src/screens/startHere/StartHereScreen.tsx');
    assert.match(sh, /else if \(noAccountRef\.current \|\| loadedAsGuestRef\.current\) holdDeltas\(base, next\);/);
    assert.match(sh, /function holdDeltas\([\s\S]*?holdPagedProgress\(START_HERE_ID, \{ done: i \}\)/);
    assert.match(sh, /\}, \[resolved, noAccount\]\);/, 'Start Here re-reads when the account state changes');
  });
});

// ── Sound Systems progress ──────────────────────────────────────────────────

describe('soundsystems/progress — faults, capstones, exercises', () => {
  it('a guest solves a fault, signs in → stored under the account', async () => {
    await guestLaunch();
    ss.setSoundSystemsSaveBlocked(true);
    ss.markFaultSolved('f1', true);
    await settle();
    assert.equal(json('ape:soundsystems:v1'), undefined);
    await signIn('u1');
    const p = json('ape:soundsystems:v1');
    assert.deepEqual(p.faults, ['f1']);
    assert.deepEqual(p.forward, ['f1']);
  });
  it('sign-out → different user → nothing', async () => {
    const caps = () => (json('ape:soundsystems:v1')?.capstones ?? []) as string[];
    await signOutCase((t) => {
      ss.setSoundSystemsSaveBlocked(true);
      ss.markCapstonePassed(t);
    }, (t) => caps().includes(t));
  });
  it('preview → nothing', async () => {
    const caps = () => (json('ape:soundsystems:v1')?.capstones ?? []) as string[];
    await previewCase((t) => {
      ss.setSoundSystemsSaveBlocked(true);
      ss.markCapstonePassed(t);
    }, (t) => caps().includes(t));
  });
  it('merges with stored progress (every list a union)', async () => {
    kv.map.set('ape:soundsystems:v1', JSON.stringify({ faults: ['f0'], forward: [], capstones: ['c0'], route: [], operate: [] }));
    await memberLaunch('u1');
    ss.setSoundSystemsSaveBlocked(true);
    ss.markRouteDone('r1');
    await settle();
    const p = json('ape:soundsystems:v1');
    assert.deepEqual(p.faults, ['f0']);
    assert.deepEqual(p.capstones, ['c0']);
    assert.deepEqual(p.route, ['r1']);
  });
});

// ── Amplifier Principles ────────────────────────────────────────────────────

describe('ampProgress', () => {
  it('a guest completes a module, signs in → stored', async () => {
    await guestLaunch();
    amp.setAmpSaveBlocked(true);
    await amp.updateAmpProgress((s) => {
      s.modules.m1 = { visited: true, done: true, checks: { q1: true } } as never;
    });
    assert.equal(kv.map.get('ape:amp:v1'), undefined);
    await signIn('u1');
    assert.equal(json('ape:amp:v1').modules.m1.done, true);
  });
  it('sign-out → different user → nothing', async () => {
    const mods = () => (json('ape:amp:v1')?.modules ?? {}) as Record<string, unknown>;
    await signOutCase(async (t) => {
      amp.setAmpSaveBlocked(true);
      await amp.updateAmpProgress((s) => {
        s.modules[t as never] = { visited: true, done: true, checks: {} } as never;
      });
    }, (t) => t in mods());
  });
  it('preview → nothing', async () => {
    const mods = () => (json('ape:amp:v1')?.modules ?? {}) as Record<string, unknown>;
    await previewCase(async (t) => {
      amp.setAmpSaveBlocked(true);
      await amp.updateAmpProgress((s) => {
        s.modules[t as never] = { visited: true, done: true, checks: {} } as never;
      });
    }, (t) => t in mods());
  });
  it('merges: done only grows, the stored (first) answer wins, the best final is kept', async () => {
    kv.map.set('ape:amp:v1', JSON.stringify({ modules: { m1: { visited: true, done: true, checks: { q1: false } } }, bestFinal: { scorePct: 90, passed: true, at: 1 } }));
    await memberLaunch('u1');
    amp.setAmpSaveBlocked(true);
    await amp.updateAmpProgress((s) => {
      s.modules.m1 = { visited: true, done: false, checks: { q1: true, q2: true } } as never;
      s.modules.m2 = { visited: true, done: true, checks: {} } as never;
      s.final = { scorePct: 60, passed: false, at: 5 };
    });
    await settle();
    const p = json('ape:amp:v1');
    assert.equal(p.modules.m1.done, true);
    assert.equal(p.modules.m1.checks.q1, false, 'first recorded answer wins');
    assert.equal(p.modules.m1.checks.q2, true);
    assert.equal(p.modules.m2.done, true);
    assert.equal(p.bestFinal.scorePct, 90);
    assert.equal(p.final.scorePct, 60);
  });
});

// ── Ear Training ────────────────────────────────────────────────────────────

describe('earProgress', () => {
  const trained = (s: Awaited<ReturnType<typeof ear.loadEarProgress>>, mastered: number) => {
    s.modules.freq = { ...ear.emptyModuleProgress(), total: 5, totalScore: 4, mastered, bestStreak: 3 } as never;
  };
  it('a guest’s ladder, signed in → stored', async () => {
    await guestLaunch();
    ear.setEarSaveBlocked(true);
    const s = await ear.loadEarProgress();
    trained(s, 1);
    await ear.saveEarProgress(s);
    assert.equal(kv.map.get('ape:ear:v1'), undefined);
    await signIn('u1');
    assert.equal(json('ape:ear:v1').modules.freq.total, 5);
  });
  it('sign-out → different user → nothing', async () => {
    const mods = () => (json('ape:ear:v1')?.modules ?? {}) as Record<string, unknown>;
    await signOutCase(async (t) => {
      ear.setEarSaveBlocked(true);
      const s = await ear.loadEarProgress();
      s.modules[t as never] = { ...ear.emptyModuleProgress(), total: 3, totalScore: 2 } as never;
      await ear.saveEarProgress(s);
    }, (t) => t in mods());
  });
  it('a ladder loaded before a sign-out is never carried to the next account', async () => {
    await memberLaunch('u1');
    ear.setEarSaveBlocked(true);
    const s = await ear.loadEarProgress();
    await signOut();
    s.modules.freq = { ...ear.emptyModuleProgress(), total: 5, totalScore: 4 } as never;
    await ear.saveEarProgress(s);
    await signIn('u2');
    assert.equal(kv.map.get('ape:ear:v1'), undefined);
    // control: a ladder loaded in a guest session IS carried
    carry.__resetSessionCarryForTests();
    kv.map.clear();
    await guestLaunch();
    const g = await ear.loadEarProgress();
    g.modules.freq = { ...ear.emptyModuleProgress(), total: 5, totalScore: 4 } as never;
    await ear.saveEarProgress(g);
    await signIn('u3');
    assert.equal(json('ape:ear:v1')?.modules?.freq?.total, 5);
  });
  it('preview → nothing', async () => {
    const mods = () => (json('ape:ear:v1')?.modules ?? {}) as Record<string, unknown>;
    await previewCase(async (t) => {
      ear.setEarSaveBlocked(true);
      const s = await ear.loadEarProgress();
      s.modules[t as never] = { ...ear.emptyModuleProgress(), total: 3, totalScore: 2 } as never;
      await ear.saveEarProgress(s);
    }, (t) => t in mods());
  });
  it('merges: the account’s ladder stays, the mastered level only rises', async () => {
    kv.map.set('ape:ear:v1', JSON.stringify({ modules: { freq: { ...ear.emptyModuleProgress(), level: 4, total: 300, mastered: 2, bestStreak: 9 } }, subBassOk: false }));
    await memberLaunch('u1');
    ear.setEarSaveBlocked(true);
    const s = await ear.loadEarProgress();
    trained(s, 3);
    await ear.saveEarProgress(s);
    await settle();
    const p = json('ape:ear:v1');
    assert.equal(p.modules.freq.level, 4);
    assert.equal(p.modules.freq.total, 300);
    assert.equal(p.modules.freq.mastered, 3);
    assert.equal(p.modules.freq.bestStreak, 9);
    assert.equal(p.subBassOk, false);
  });
});

// ── Tuning & Temperament ────────────────────────────────────────────────────

describe('tuningProgress', () => {
  it('a guest completes chapters, signs in → stored', async () => {
    await guestLaunch();
    tuning.holdTuningProgress({ done: 0 });
    tuning.holdTuningProgress({ done: 2 });
    tuning.holdTuningProgress({ lastChapter: 2 });
    await signIn('u1');
    const p = json('ape:tuning:v1');
    assert.deepEqual(p.completed, [0, 2]);
    assert.equal(p.lastChapter, 2);
  });
  it('sign-out → different user → nothing', async () => {
    const ch = () => (json('ape:tuning:v1')?.completed ?? []) as number[];
    const n = { A: 1, B: 2 } as const;
    await signOutCase((t) => tuning.holdTuningProgress({ done: n[t] }), (t) => ch().includes(n[t]));
  });
  it('preview → nothing', async () => {
    const ch = () => (json('ape:tuning:v1')?.completed ?? []) as number[];
    const n = { A: 1, B: 2 } as const;
    await previewCase((t) => tuning.holdTuningProgress({ done: n[t] }), (t) => ch().includes(n[t]));
  });
  it('merges with stored chapters; a later save from an older copy keeps them', async () => {
    kv.map.set('ape:tuning:v1', JSON.stringify({ completed: [0, 1], lastChapter: 1, done: false, mathView: true }));
    await memberLaunch('u1');
    tuning.holdTuningProgress({ done: 3 });
    await settle();
    assert.deepEqual(json('ape:tuning:v1').completed, [0, 1, 3]);
    assert.equal(json('ape:tuning:v1').mathView, true);
    await tuning.saveTuningProgress({ completed: [0, 1], lastChapter: 1, done: false, mathView: true });
    assert.deepEqual(json('ape:tuning:v1').completed, [0, 1, 3]);
  });
  it('the screen holds instead of saving for a guest, and re-reads on a guest change', () => {
    const t = read('src/screens/lab/tuning/TuningLabScreen.tsx');
    assert.match(t, /if \(!guestRef\.current && !loadedAsGuestRef\.current\) void saveTuningProgress\(next\);\s*else \{[\s\S]*?holdTuningProgress\(\{ done: c \}\)/);
    assert.match(t, /\}, \[resolved, guest\]\);/);
  });
});

// ── Drum Tuning (newest lab: its re-read showed but did not write) ──────────

describe('drumProgress', () => {
  const note = (id: string, savedAt: number) => ({ id, name: id, savedAt, drums: [{ drum: 'snare', batterHz: 200, note: '' }] });
  it('a guest banks a chapter, answers, an interactive and a note; signs in → all stored', async () => {
    await guestLaunch();
    drum.setDrumSaveBlocked(true);
    await drum.updateDrumProgress((s) => {
      s.modules.sound = { done: true, answers: { a1: true }, interactive: true };
      s.lastModule = 'sound';
      s.lastStep = 2;
    });
    const r = await drum.saveTuningNote(note('n1', 10));
    assert.equal(r.saved, false);
    assert.equal(kv.map.get('ape:drumtuning:v1'), undefined);
    await signIn('u1');
    const p = json('ape:drumtuning:v1');
    assert.equal(p.modules.sound.done, true);
    assert.deepEqual(p.modules.sound.answers, { a1: true });
    assert.equal(p.modules.sound.interactive, true);
    assert.deepEqual(p.notes.map((n: { id: string }) => n.id), ['n1']);
    assert.equal(p.lastStep, 2);
  });
  it('sign-out → different user → nothing', async () => {
    const ch = { A: 'sound', B: 'prepare' } as const;
    const done = (t: 'A' | 'B') => json('ape:drumtuning:v1')?.modules?.[ch[t]]?.done === true;
    await signOutCase(async (t) => {
      drum.setDrumSaveBlocked(true);
      await drum.updateDrumProgress((s) => {
        s.modules[ch[t]] = { done: true, answers: {} };
      });
    }, done);
  });
  it('preview → nothing', async () => {
    const ch = { A: 'sound', B: 'prepare' } as const;
    const done = (t: 'A' | 'B') => json('ape:drumtuning:v1')?.modules?.[ch[t]]?.done === true;
    await previewCase(async (t) => {
      drum.setDrumSaveBlocked(true);
      await drum.updateDrumProgress((s) => {
        s.modules[ch[t]] = { done: true, answers: {} };
      });
    }, done);
  });
  it('merges: credit a union, the FIRST answer wins, notes added under the cap', async () => {
    kv.map.set('ape:drumtuning:v1', JSON.stringify({ modules: { sound: { done: true, answers: { a1: false } } }, notes: [note('old', 1)] }));
    await memberLaunch('u1');
    drum.setDrumSaveBlocked(true);
    await drum.updateDrumProgress((s) => {
      s.modules.sound = { done: false, answers: { a1: true, a2: true } };
      s.modules.prepare = { done: true, answers: {} };
    });
    await drum.saveTuningNote(note('new', 20));
    await settle();
    const p = json('ape:drumtuning:v1');
    assert.equal(p.modules.sound.done, true, 'credit never removed');
    assert.equal(p.modules.sound.answers.a1, false, 'the first recorded answer wins');
    assert.equal(p.modules.sound.answers.a2, true);
    assert.equal(p.modules.prepare.done, true);
    assert.deepEqual(p.notes.map((n: { id: string }) => n.id), ['old', 'new']);
    assert.equal(drum.mergeDrumProgress({ modules: {}, notes: Array.from({ length: 24 }, (_, i) => note(`s${i}`, 100 + i)) }, { modules: {}, notes: [note('g', 500)] }).notes.length, drum.MAX_TUNING_NOTES);
  });
  it('a store that could not be read is never written over — and the work lands once it can be read', async () => {
    kv.map.set('ape:drumtuning:v1', JSON.stringify({ modules: { sound: { done: true, answers: {} } }, notes: [] }));
    await memberLaunch('u1');
    drum.setDrumSaveBlocked(true);
    kv.failGet = true;
    await drum.updateDrumProgress((s) => {
      s.modules.prepare = { done: true, answers: {} };
    });
    await settle();
    assert.equal(json('ape:drumtuning:v1').modules.prepare, undefined, 'not written over an unreadable copy');
    kv.failGet = false;
    await drum.updateDrumProgress((s) => {
      s.lastStep = 1;
    });
    await settle();
    const p = json('ape:drumtuning:v1');
    assert.equal(p.modules.sound.done, true);
    assert.equal(p.modules.prepare?.done, true, 'control: the held work is written once the copy can be read');
  });
});

// ── Mastering (newest lab: carryPreLoad showed but a guest's re-read did not write)

describe('masteringProgress', () => {
  it('a guest banks a module, answers and Module 8 ticks; signs in → all stored', async () => {
    await guestLaunch();
    mastering.setMasteringSaveBlocked(true);
    await mastering.updateMasteringProgress((s) => {
      s.modules.what = { done: true, answers: { s1: true } };
      s.modules.project = { done: false, answers: {}, checks: ['c1'], qc: ['q1'] };
    });
    assert.equal(kv.map.get('ape:mastering:v1'), undefined);
    await signIn('u1');
    const p = json('ape:mastering:v1');
    assert.equal(p.modules.what.done, true);
    assert.deepEqual(p.modules.what.answers, { s1: true });
    assert.deepEqual(p.modules.project.checks, ['c1']);
    assert.deepEqual(p.modules.project.qc, ['q1']);
  });
  it('sign-out → different user → nothing', async () => {
    const has = (t: 'A' | 'B') => json('ape:mastering:v1')?.modules?.what?.answers?.[t] === true;
    await signOutCase(async (t) => {
      mastering.setMasteringSaveBlocked(true);
      await mastering.updateMasteringProgress((s) => {
        const m = s.modules.what ?? { done: false, answers: {} };
        s.modules.what = { ...m, answers: { ...m.answers, [t]: true } };
      });
    }, has);
  });
  it('preview → nothing', async () => {
    const has = (t: 'A' | 'B') => json('ape:mastering:v1')?.modules?.what?.answers?.[t] === true;
    await previewCase(async (t) => {
      mastering.setMasteringSaveBlocked(true);
      await mastering.updateMasteringProgress((s) => {
        const m = s.modules.what ?? { done: false, answers: {} };
        s.modules.what = { ...m, answers: { ...m.answers, [t]: true } };
      });
    }, has);
  });
  it('merges: done a union, the FIRST answer wins, ticks a union', async () => {
    kv.map.set('ape:mastering:v1', JSON.stringify({ modules: { what: { done: true, answers: { s1: false } }, project: { done: false, answers: {}, checks: ['c0'], qc: [] } } }));
    await memberLaunch('u1');
    mastering.setMasteringSaveBlocked(true);
    await mastering.updateMasteringProgress((s) => {
      s.modules.what = { done: false, answers: { s1: true, s2: true } };
      s.modules.project = { done: false, answers: {}, checks: ['c1'], qc: ['q1'] };
    });
    await settle();
    const p = json('ape:mastering:v1');
    assert.equal(p.modules.what.done, true);
    assert.equal(p.modules.what.answers.s1, false);
    assert.equal(p.modules.what.answers.s2, true);
    assert.deepEqual(new Set(p.modules.project.checks), new Set(['c0', 'c1']));
    assert.deepEqual(p.modules.project.qc, ['q1']);
  });
});

// ── Room Design (newest lab: a guest's SAVE was not kept at all) ────────────

describe('roomDesignStore', () => {
  const design = (id: string, name: string) => ({ ...defaultDesign(), id, name });
  it('a guest saves a design, signs in → it is in the account’s library on the device', async () => {
    await guestLaunch();
    room.setRoomDesignSaveBlocked(true);
    assert.equal(room.holdRoomDesignForSession(design('d1', 'Mine')), true);
    assert.equal(kv.map.get('ape:roomdesign:v1'), undefined);
    await signIn('u1');
    assert.deepEqual(json('ape:roomdesign:v1').map((d: { id: string }) => d.id), ['d1']);
  });
  it('sign-out → different user → nothing', async () => {
    const ids = () => ((json('ape:roomdesign:v1') ?? []) as { id: string }[]).map((d) => d.id);
    await signOutCase((t) => {
      room.setRoomDesignSaveBlocked(true);
      room.holdRoomDesignForSession(design(t, t));
    }, (t) => ids().includes(t));
  });
  it('preview → nothing, and the lab is told it was not held', async () => {
    const ids = () => ((json('ape:roomdesign:v1') ?? []) as { id: string }[]).map((d) => d.id);
    await previewCase((t) => {
      room.setRoomDesignSaveBlocked(true);
      const held = room.holdRoomDesignForSession(design(t, t));
      assert.equal(held, t === 'A');
    }, (t) => ids().includes(t));
  });
  it('merges: added to the stored library, a design already there is never lost, the cap holds', async () => {
    const stored = Array.from({ length: room.MAX_SAVED_DESIGNS }, (_, i) => ({ ...design(`s${i}`, `S${i}`), updatedAt: 1000 + i }));
    kv.map.set('ape:roomdesign:v1', JSON.stringify(stored));
    await memberLaunch('u1');
    room.setRoomDesignSaveBlocked(true);
    room.holdRoomDesignForSession(design('g1', 'Guest'));
    await settle();
    const lib = json('ape:roomdesign:v1');
    assert.equal(lib.length, room.MAX_SAVED_DESIGNS);
    assert.ok(lib.some((d: { id: string }) => d.id === 'g1'));
    assert.ok(lib.some((d: { id: string }) => d.id === 's1'), 'only the oldest makes room');
  });
  it('the lab holds a guest SAVE and words it honestly', () => {
    const host = read('src/screens/lab/roomdesign/RoomDesignLabScreen.tsx');
    assert.match(host, /if \(guest\) return Promise\.resolve\(\{ ok: false, at: design, held: !preview && holdRoomDesignForSession\(design\) \}\);/);
    const ex = read('src/screens/lab/roomdesign/modules/modExplore.tsx');
    assert.match(ex, /\? held\s*\? SAVE_HELD/);
  });
});

// ── Cymatics tick-offs (written for everyone, lost in the sign-in wipe) ─────

describe('Cymatics experiment tick-offs', () => {
  it('a guest’s ticks are held (guestOnly) and written back after the sign-in wipe', () => {
    const s = read('src/screens/lab/cymatics/ExperimentWell.tsx');
    assert.match(s, /holdSessionWork<HeldTicks>\(CARRY_KEY, \(prev\) => withHeldTick\(prev, experiment\.id, i, on\), \{ guestOnly: true \}\);/);
    // Wave 2 (2026-10-02): the writer merges into the shared safe store's
    // HYDRATED series — never over ticks that could not be read (it answers
    // false then, and the ledger tries again). Since 2026-10-04 it merges
    // what the ledger holds when it RUNS (an untick let go of meanwhile stays
    // off — smallFixes_20261004).
    assert.match(s, /registerSessionCarry<HeldTicks>\(CARRY_KEY, \(held\) => ticksStore\.mutate\(\(all\) => mergeHeldTicks\(all, peekSessionWork<HeldTicks>\(CARRY_KEY\) \?\? held\)\)\);/);
  });
});

// ── wording: the end screen tells the truth to a guest and to a preview ─────

describe('wording', () => {
  it('a guest is told signing in before closing the app keeps the work; a preview is told it earns nothing', async () => {
    const { endLead, whatsLeft } = await import('../src/screens/lab/kit/labEnd.ts');
    const w = whatsLeft([{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], new Set(['a']));
    const g = endLead(w, { mode: 'credit', noun: 'page', guest: true });
    assert.match(g, /sign in before you close the app/);
    assert.doesNotMatch(g, /is saved\b(?! yet)/);
    const p = endLead(w, { mode: 'credit', noun: 'page', guest: true, preview: true });
    assert.match(p, /members-only preview/);
    assert.doesNotMatch(p, /sign in/i);
  });
});
