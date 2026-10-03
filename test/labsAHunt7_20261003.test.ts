/**
 * Labs A — hunt 7 (2026-10-03). Receipts.
 *
 * Ear Training, Amplifier Principles and Tuning & Temperament progress: a
 * change made while the stored copy could NOT BE READ (AsyncStorage.getItem
 * threw) is never written — right, an unread copy must not be written over —
 * but nothing said so. The drill showed the level-up, the module showed MARK
 * COMPLETE banked, the chapter showed its ✓, and all of it was gone next
 * visit. These three stores are each lab's only record of its credit. Hunt 6
 * fixed the same class in Drum Tuning / Mastering and round C in Cable
 * Install; the learner is now told through the shared failed-save notice. A
 * pure re-read stays quiet, and so does a guest.
 * R2: run against the HEAD earProgress.ts / ampProgress.ts / tuningProgress.ts and failed.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__LAH7_AS__ = AS;
g.__LAH7_READ_FAIL__ = false;

const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__LAH7_AS__;
     export default {
       async getItem(k) { if (globalThis.__LAH7_READ_FAIL__) throw new Error('read failed'); return s.has(k) ? s.get(k) : null; },
       async multiGet(ks) { if (globalThis.__LAH7_READ_FAIL__) throw new Error('read failed'); return ks.map((k) => [k, s.has(k) ? s.get(k) : null]); },
       async getAllKeys() { return [...s.keys()]; },
       async setItem(k, v) { s.set(k, v); },
       async removeItem(k) { s.delete(k); },
       async multiSet(rows) { for (const [k, v] of rows) s.set(k, v); },
       async multiRemove(ks) { for (const k of ks) s.delete(k); },
     };`,
  );

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (specifier.endsWith('.json')) return { ...nextResolve(specifier, context), importAttributes: { type: 'json' } };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      for (const ext of ['.ts', '.tsx']) {
        const candidate = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
});

const notice = await import('../src/features/storage/saveFailureNotice.ts');
const ear = await import('../src/features/ear/earProgress.ts');
const amp = await import('../src/features/amp/ampProgress.ts');
const tuning = await import('../src/features/tuning/tuningProgress.ts');

let shown = 0;
function fresh(readFails: boolean) {
  AS.clear();
  g.__LAH7_READ_FAIL__ = readFails;
  shown = 0;
  notice.__resetSaveFailureNoticeForTests(() => 1_000_000);
  notice.setSaveFailurePresenter(() => {
    shown++;
  });
  ear.setEarSaveBlocked(false);
  amp.setAmpSaveBlocked(false);
}

describe('a change dropped because the stored copy could not be READ is said', () => {
  it('Ear Training: a trial saved onto an unreadable ladder raises the notice', async () => {
    fresh(true);
    const s = await ear.loadEarProgress();
    s.modules.frequency = ear.applyTrial(ear.emptyModuleProgress(), 5, 1).next as never;
    await ear.saveEarProgress(s);
    assert.equal(shown, 1, 'the trial was dropped without a word');
    assert.equal(AS.size, 0, 'an unread copy must still never be written over');
  });

  it('Ear Training: a guest ladder stays quiet; a readable one saves', async () => {
    fresh(false);
    ear.setEarSaveBlocked(true);
    const guest = await ear.loadEarProgress();
    await ear.saveEarProgress(guest);
    assert.equal(shown, 0, 'a guest saves nowhere by rule — no notice');
    ear.setEarSaveBlocked(false);
    const s = await ear.loadEarProgress();
    s.subBassOk = false;
    await ear.saveEarProgress(s);
    assert.equal(shown, 0);
    assert.equal(AS.size, 1);
  });

  it('Amp: MARK COMPLETE on an unreadable copy raises the notice; a re-read does not', async () => {
    fresh(true);
    await amp.updateAmpProgress(() => {});
    assert.equal(shown, 0, 'a pure re-read is not a lost change');
    await amp.updateAmpProgress((s) => {
      s.modules.what = { visited: true, done: true, checks: {} } as never;
    });
    assert.equal(shown, 1, 'the credit was dropped without a word');
    assert.equal(AS.size, 0, 'an unread copy must still never be written over');
  });

  it('Amp: a readable copy raises nothing', async () => {
    fresh(false);
    await amp.updateAmpProgress((s) => {
      s.lastModule = 'what';
    });
    assert.equal(shown, 0);
    assert.equal(AS.size, 1);
  });

  it('Tuning: a chapter saved after an unreadable load raises the notice', async () => {
    fresh(true);
    const p = await tuning.loadTuningProgress();
    await tuning.saveTuningProgress({ ...p, completed: [0] });
    assert.equal(shown, 1, 'the chapter ✓ was dropped without a word');
    assert.equal(AS.size, 0, 'an unread copy must still never be written over');
  });

  it('Tuning: a readable load saves and raises nothing', async () => {
    fresh(false);
    const p = await tuning.loadTuningProgress();
    await tuning.saveTuningProgress({ ...p, completed: [0] });
    assert.equal(shown, 0);
    assert.equal(AS.size, 1);
  });
});

describe('Cable Install completion: never "saved" before the tier is known', () => {
  it('the unknown window (no tier read yet) reads checking, not "Everything … is saved"', async () => {
    const cc = await import('../src/screens/lab/cableinstall/completeCopy.ts');
    const tier = await import('../src/features/commercial/tier.ts');
    // The screen's inputs in the 'unknown' window: useLabEndGuest() is false
    // (isGuestTier('unknown')), noAccount is false (not resolved), not a member.
    const endGuest = tier.isGuestTier('unknown');
    const wording = tier.guestWordingOf('unknown', false, false);
    const st = cc.ciSaveWording(cc.ciSaveState({ endGuest, noAccount: false, isMember: false }), wording.account);
    assert.notEqual(st, 'saved', 'the end screen claimed the run was saved before anyone knew');
    assert.doesNotMatch(cc.ciLeftLead(st, { unbanked: 2, replayOnly: 0, total: 13 }), /saved/);
    assert.ok(cc.ciSaveNotice(st), 'told the run is not kept yet');
    assert.equal(cc.ciSaveNotice(st)?.join, undefined, 'no membership offer to someone who may be a member');
  });

  it('a known free account or member still reads saved', async () => {
    const cc = await import('../src/screens/lab/cableinstall/completeCopy.ts');
    const tier = await import('../src/features/commercial/tier.ts');
    for (const t of ['free', 'member'] as const) {
      const wording = tier.guestWordingOf(t, true, false);
      assert.equal(cc.ciSaveWording(cc.ciSaveState({ endGuest: false, noAccount: false, isMember: t === 'member' }), wording.account), 'saved');
    }
  });
});
