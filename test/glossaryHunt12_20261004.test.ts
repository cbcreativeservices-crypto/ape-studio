/**
 * GLOSSARY — hunt 12 (2026-10-04). Re-audit of hunt 11 (1c5a74c4: the mount
 * session read through safeSessionResult + the null INITIAL_SESSION skip), then
 * K1–K12 across the area.
 *
 * 1. (K3) The weekly heads-up sold membership to a maybe-member. A metered
 *    gateway read carries the week's count, and readViaGateway raised
 *    "Weekly glossary limit … Academy membership makes the glossary unlimited"
 *    from that count alone — while the reader's membership was 'checking' or
 *    'unconfirmed'. The refusal path beside it already refused to say "limit
 *    reached" or sell to that reader (owner 2026-10-03 #1); the heads-up now
 *    follows the same `meterKnown` rule.
 *
 * 2. (K5, a gap hunt 11 opened) The cached corpus kept the last reader's PAID
 *    text across an account change. A metered read patches the full definition
 *    onto the cached entry object; only the screen's reader comparison blanked
 *    it, and since hunt 11 an unknown session read (a stall, an unreachable
 *    refresh) leaves the reader unknown — so a different reader whose first
 *    read was unknown kept the previous reader's full text in the collapsed
 *    rows and their speakers. The account wipe now drops the cached corpus.
 *
 * 3. (K2) An unreadable Recent list said "Nothing yet — terms you open will
 *    appear here" (held-chip list) and "No results for Recent. Try a shorter
 *    word…" (the filter). The store already refuses to write over an
 *    unreadable copy; the screen now says the list could not be read.
 *
 * Receipts: every [R2] test FAILED on HEAD c0debb14 (files copied aside, HEAD
 * written back, run, restored, cmp).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const SCREEN = readFileSync(new URL('../src/screens/glossary/GlossaryScreen.tsx', import.meta.url), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
const CODE = strip(SCREEN);

// ── A fake AsyncStorage whose reads can be made to throw; React's store hook
// answers the snapshot directly (no renderer needed). ──────────────────────
const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__GH12_AS__ = AS;
g.__GH12_FAIL__ = false;
g.__GH12_SETS__ = [] as string[];
const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const FAKE_AS = mod(`
  const s = globalThis.__GH12_AS__;
  export default {
    async getItem(k) {
      if (globalThis.__GH12_FAIL__) throw new Error('storage read failed');
      return s.has(k) ? s.get(k) : null;
    },
    async setItem(k, v) { globalThis.__GH12_SETS__.push(k); s.set(k, String(v)); },
    async removeItem(k) { s.delete(k); },
  };`);
const REACT = mod(`
  export function useSyncExternalStore(sub, get) { return get(); }
  export default { useSyncExternalStore };`);
registerHooks({
  resolve(specifier, context, nextResolve) {
    const stub = (url: string) => ({ url, shortCircuit: true });
    if (specifier === '@react-native-async-storage/async-storage') return stub(FAKE_AS);
    if (specifier === 'react') return stub(REACT);
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return stub(candidate.href);
    }
    return nextResolve(specifier, context);
  },
});
const recent = (await import('../src/features/glossary/recentTerms.ts')) as Record<string, unknown> & {
  RECENT_TERMS_KEY: string;
  getRecentTerms: () => string[];
  recordRecentTerm: (id: string) => Promise<boolean>;
};
const settle = async () => {
  for (let i = 0; i < 40; i++) await Promise.resolve();
  await new Promise<void>((r) => setImmediate(r));
  for (let i = 0; i < 40; i++) await Promise.resolve();
};

/** readViaGateway's body, comments stripped. */
function readViaGatewayBody(): string {
  const start = CODE.indexOf('const readViaGateway = useCallback(');
  assert.ok(start >= 0, 'readViaGateway not found');
  const end = CODE.indexOf('const gatewayInFlightRef', start);
  assert.ok(end > start);
  return CODE.slice(start, end);
}

describe('glossary: the weekly heads-up is for a KNOWN non-member only (K3)', () => {
  it('[R2] the metered read raises warnUsage only when meterKnown', () => {
    const body = readViaGatewayBody();
    const call = body.match(/if \(([^)]*)\) warnUsage\(used, lim\);/);
    assert.ok(call, 'the heads-up call was not found');
    assert.match(call[1], /\bmeterKnown\b/, 'a maybe-member was told "Academy membership makes the glossary unlimited"');
    assert.match(call[1], /\bfresh\b/, 'a cached answer is still not a new charge (no repeat heads-up)');
  });

  it('[confirm] the refusal beside it keeps its own meterKnown rule, and meterKnown is a dep', () => {
    const body = readViaGatewayBody();
    assert.match(body, /if \(!meterKnown\) \{/);
    assert.match(body, /\[putDetail, isMember, meterKnown, memberGate\]/);
  });
});

describe('glossary: the account wipe drops the cached corpus (K5)', () => {
  it('[R2] a top-level wipe reset clears ENTRIES_CACHE', () => {
    assert.match(
      CODE,
      /import \{ registerLocalStoreReset \} from '\.\.\/\.\.\/features\/storage\/localStoreRegistry';/,
    );
    assert.match(CODE, /^registerLocalStoreReset\(\(\) => \{\s*ENTRIES_CACHE = null;\s*\}\);/m);
  });

  it('[confirm] the reader marker is NOT reset there — a mounted screen still blanks on a reader change', () => {
    const at = CODE.search(/^registerLocalStoreReset\(/m);
    const block = CODE.slice(at, CODE.indexOf('});', at));
    assert.doesNotMatch(block, /ENTRIES_UID|ENTRIES_DEF_TIER/);
    assert.match(CODE, /const readerChanged = readerUid !== undefined && ENTRIES_UID !== undefined && ENTRIES_UID !== readerUid;/);
  });
});

describe('glossary Recent list: unreadable is not empty (K2)', () => {
  it('[R2] the store reports a failed read through useRecentTermsUnreadable', async () => {
    assert.equal(typeof recent.useRecentTermsUnreadable, 'function', 'no way for the screen to know the read failed');
    const unreadable = recent.useRecentTermsUnreadable as () => boolean;
    AS.set(recent.RECENT_TERMS_KEY, JSON.stringify(['a', 'b']));
    g.__GH12_FAIL__ = true;
    recent.getRecentTerms(); // starts the read
    await settle();
    assert.equal(unreadable(), true, 'a read that threw must say so');
    assert.deepEqual(recent.getRecentTerms(), [], 'nothing stored is shown as if read');
    // An open while unreadable writes nothing over the stored history…
    g.__GH12_SETS__ = [];
    void recent.recordRecentTerm('c');
    await settle();
    assert.deepEqual(g.__GH12_SETS__, [], 'the stored list must not be written over');
    // …and once the store reads again, the history comes back with the open on top.
    g.__GH12_FAIL__ = false;
    void recent.recordRecentTerm('d');
    await settle();
    assert.equal(unreadable(), false);
    assert.deepEqual(recent.getRecentTerms().slice(0, 4), ['d', 'c', 'a', 'b']);
  });

  it('[R2] both Recent views say the list could not be read instead of "Nothing yet"', () => {
    assert.match(CODE, /const recentUnreadable = useRecentTermsUnreadable\(\);/);
    // The held-chip list.
    assert.match(CODE, /termListModal\?\.kind === 'recent' && recentUnreadable\s*\?\s*RECENT_UNREADABLE/);
    // The Recent filter's empty list (a search keeps its own "no results").
    assert.match(CODE, /filter === 'recent' && recentUnreadable && !search\.trim\(\) \?/);
    assert.match(CODE, /const RECENT_UNREADABLE =\s*'Your recent terms couldn’t be read on this phone\. Nothing has been removed/);
  });
});
