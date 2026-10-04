/**
 * ACCOUNT + COMMERCE — hunt 13 (2026-10-04).
 *
 * 1. flaggedStore — `useTermListUnreadable(kind)` / `useBookmarksUnreadable(ctx)`
 *    (lead leftover; GLOSSARY uses them for the Custom ★ / Bookmarks faces).
 *    `useTermList` / `useBookmarks` hand back an EMPTY stand-in while the
 *    stored copy is unread or UNREADABLE, so a screen could not tell "could
 *    not be read" from "nothing saved". The hooks read the store's own
 *    `isUnreadable` and re-render when it changes.
 *
 * 2. Profile › MY CERTIFICATES / MY PROGRAMS tallies (K2, lead leftover).
 *    `bundleDone` counted 'complete' entries in the progress map — which is
 *    EMPTY until the read lands and stays empty when it fails — so an offline
 *    open said "0 of 12 topics complete" over finished work. Unread → "—",
 *    the same rule as Enrollment's pctText / requirementSummary.
 *
 * 3. Profile › MY NUMBERS (K2). "Terms learned" printed `known.size` — 0 for
 *    an UNREADABLE known list — and "Topics completed" printed
 *    `profile?.completeCount ?? 0` — 0 before the profile read landed and for
 *    good after it failed. Both show "—" when unread.
 *
 * 4. Profile › Whole-curriculum progress (K2). An unread profile read
 *    "Not started yet" (and "0%" in the section summary, and a progress bar
 *    announcing "0% complete") — a claim about the learner's work nobody
 *    checked. Unread → "—" / "Progress not loaded".
 *
 * 5. Profile › MY CERTIFICATES / MY PROGRAMS empty face (K2 three faces).
 *    `useBundles()` is `[]` while the bundle store is unread AND after its
 *    read FAILED, and the screen said "No certificates started yet — enrol
 *    from Study" to a learner with certificates. Not read → a line that is
 *    true either way; the empty copy only once the list has been read.
 *
 * R2: every receipt below FAILED with flaggedStore.ts and ProfileScreen.tsx
 * as at HEAD 642fb8a2 (copied aside, `git show HEAD:` written back, run,
 * restored, cmp clean).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

class FlakyMap extends Map<string, string> {
  failReads = false;
  override has(k: string): boolean {
    if (this.failReads) throw new Error('storage read failed');
    return super.has(k);
  }
}
const disk = new FlakyMap();
(globalThis as Record<string, unknown>).__AH13_AS__ = disk;

const FAKE_AS = `
const s = globalThis.__AH13_AS__;
const get = (k) => (s.has(k) ? s.get(k) : null);
export default {
  async getItem(k) { return get(k); },
  async multiGet(ks) { return ks.map((k) => [k, get(k)]); },
  async setItem(k, v) { s.set(k, v); },
  async multiSet(kvs) { for (const [k, v] of kvs) s.set(k, v); },
  async removeItem(k) { s.delete(k); },
  async multiRemove(ks) { for (const k of ks) s.delete(k); },
  async getAllKeys() { return [...s.keys()]; },
};`;
// A hook outside React: subscribe (which starts the store's read, as a mounted
// hook does) and answer the current snapshot.
const FAKE_REACT = `
export function useSyncExternalStore(subscribe, get) { subscribe(() => {}); return get(); }
export default { useSyncExternalStore };`;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') {
      return { url: `data:text/javascript,${encodeURIComponent(FAKE_AS)}`, shortCircuit: true };
    }
    if (specifier === 'react') {
      return { url: `data:text/javascript,${encodeURIComponent(FAKE_REACT)}`, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const settle = async () => {
  for (let i = 0; i < 8; i++) await new Promise<void>((r) => setImmediate(r));
};
const read = (rel: string) => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
type Mod = Record<string, unknown>;
const fn = (m: Mod, name: string) => {
  assert.equal(typeof m[name], 'function', `${name} is exported`);
  return m[name] as (...a: unknown[]) => unknown;
};

describe('1. flaggedStore says when a list could NOT be read', () => {
  it('useTermListUnreadable: false for a readable list, true after a failed read', async () => {
    disk.failReads = false;
    disk.clear();
    disk.set('ape:knownTermsGlobal', JSON.stringify(['a']));
    const ok = (await import('../src/features/flags/flaggedStore.ts?ah13a')) as unknown as Mod;
    const unreadableOk = fn(ok, 'useTermListUnreadable');
    unreadableOk('known');
    await settle();
    assert.equal(unreadableOk('known'), false, 'a list that was read is not unreadable');

    const bad = (await import('../src/features/flags/flaggedStore.ts?ah13b')) as unknown as Mod;
    const unreadableBad = fn(bad, 'useTermListUnreadable');
    disk.failReads = true;
    unreadableBad('starred');
    await settle();
    assert.equal(unreadableBad('starred'), true, 'a failed read is reported, not shown as empty');
    disk.failReads = false;
  });

  it('useBookmarksUnreadable: per context, the same rule', async () => {
    disk.failReads = false;
    disk.clear();
    const m = (await import('../src/features/flags/flaggedStore.ts?ah13c')) as unknown as Mod;
    const unreadable = fn(m, 'useBookmarksUnreadable');
    unreadable('glossary');
    await settle();
    assert.equal(unreadable('glossary'), false, 'an absent key is a truly empty list, not unreadable');
    disk.failReads = true;
    unreadable('topic-42');
    await settle();
    assert.equal(unreadable('topic-42'), true);
    disk.failReads = false;
  });
});

describe('2–5. Profile: unread is never shown as zero or empty', () => {
  const s = code(read('screens/profile/ProfileScreen.tsx'));

  it('2. bundle tallies: unread progress → null ("—"), never "0 of N"', () => {
    assert.match(s, /const bundleDone = useCallback\(\s*\(topics: number\[\]\): number \| null => \{\s*if \(topics\.some\(\(gs\) => !bundleProg\.has\(gs\)\)\) return null;/);
  });

  it('3. MY NUMBERS: unreadable known list / unread profile → "—"', () => {
    assert.match(s, /const knownUnreadable = useTermListUnreadable\('known'\);/);
    assert.match(s, /<StatRow label="Terms learned" value=\{knownUnreadable \? '—' : String\(known\.size\)\} \/>/);
    assert.match(s, /<StatRow label="Topics completed" value=\{profile \? String\(profile\.completeCount\) : '—'\} last \/>/);
    assert.doesNotMatch(s, /profile\?\.completeCount \?\? 0/);
  });

  it('4. whole-curriculum readout: unread profile is "—", not "Not started yet" / "0%"', () => {
    assert.match(s, /\{!profile\s*\? '—'\s*: profile\.overallPct > 0/);
    assert.match(s, /\? \(profile \? `\$\{profile\.overallPct\}%` : '—'\)/);
    assert.match(s, /text: profile \? `\$\{pctClamped\}% complete` : 'Progress not loaded'/);
  });

  it('5. MY CERTIFICATES / MY PROGRAMS: the empty copy only once the bundles were READ', () => {
    assert.match(s, /const bundlesRead = useBundlesHydrated\(\);/);
    assert.match(s, /\) : !bundlesRead \? \(\s*<Text style=\{styles\.rowHint\}>Your certificates haven’t loaded yet\.<\/Text>\s*\) : \(\s*<Text style=\{styles\.rowHint\}>\s*No certificates started yet/);
    assert.match(s, /\) : !bundlesRead \? \(\s*<Text style=\{styles\.rowHint\}>Your programs haven’t loaded yet\.<\/Text>\s*\) : \(\s*<Text style=\{styles\.rowHint\}>\s*No programs started yet/);
  });
});

describe('sign-out keeps the per-uid topic welcome "seen" flags (lead, from HOME hunt 13)', () => {
  it('isOnboardingFlag spares ape:welcome:seen:<uid>:<topic>', () => {
    const src = read('features/account/clearLocalAccountData.ts');
    const fn = src.match(/function isOnboardingFlag[\s\S]*?\n}\n/)?.[0] ?? '';
    assert.match(fn, /k\.startsWith\('ape:welcome:seen:'\)/);
  });
});
