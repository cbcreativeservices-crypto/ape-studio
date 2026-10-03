/**
 * OWNER RULINGS 2026-10-03 — receipts for the four calls.
 *
 * 1. GLOSSARY SHARE = ONE USE. "sharing requires opening a glossary term so
 *    yes it counts as 1 use (not extra to share — just that they opened that
 *    term's definition)". Driven for real: glossaryGateway with supabase
 *    stubbed, counting every `get_glossary_definition` call. The screen's
 *    share path is pinned: when its one read FAILED (it fails open, answering
 *    true) the share no longer reads the gateway a second time.
 * 2. OSHA ABOVE 115 / 130 dBA. "yes, honesty is preferred" — levels above
 *    130 dBA are still counted, and the result now says so; above 115 dBA it
 *    says OSHA permits no continuous exposure at all.
 * 3. FAILED SAVES ARE TOLD. "if it fails the user needs to know" — the Home
 *    Setup sheet's SAVE dropped both write results; it now says so.
 * 4. ONCE THE MEMBERSHIP CHECK FAILS, STOP CHECKING. "once it fails — it
 *    should know and stop checking". The provider exposes `tierReadFailed`
 *    (set when the bounded retries are spent, cleared by a later success or
 *    an identity change); every "CHECKING…" site shows an honest end state.
 *
 * R2: run against the pre-change files (copied aside, originals restored,
 * run, fixed files put back) the receipts FAILED — see the report.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
g.__OR3_RPC__ = [] as string[];
g.__OR3_FAULT__ = null;
class FlakyMap extends Map<string, string> {
  failWrites = false;
  override set(k: string, v: string): this {
    if (this.failWrites) throw new Error('storage write failed');
    return super.set(k, v);
  }
}
const AS = new FlakyMap();
g.__OR3_AS__ = AS;

const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const SUPABASE = mod(`
  export const supabase = {
    auth: { onAuthStateChange(cb) { globalThis.__OR3_AUTH__ = cb; return { data: { subscription: { unsubscribe() {} } } }; } },
    async rpc(name, args) {
      globalThis.__OR3_RPC__.push(args.p_id);
      const f = globalThis.__OR3_FAULT__;
      if (f) return { data: null, error: { message: f } };
      return { data: [{ definition: 'full text of ' + args.p_id, plain_english: null, purpose_function: null,
        practical_application: null, scenario_contexts: null, related_terms: null, category: null, difficulty: null,
        common_mistakes: null, used: 3, lim: 14, window_start: null }], error: null };
    },
    from() { throw new Error('not used'); },
  };`);
const DEVICE = mod(`export async function getDeviceId() { return 'device-1'; }`);
const ASYNC = mod(`
  const s = globalThis.__OR3_AS__;
  export default {
    async getItem(k) { return s.has(k) ? s.get(k) : null; },
    async multiGet(ks) { return ks.map((k) => [k, s.has(k) ? s.get(k) : null]); },
    async setItem(k, v) { s.set(k, v); },
    async multiSet(kvs) { for (const [k, v] of kvs) s.set(k, v); },
    async removeItem(k) { s.delete(k); },
    async multiRemove(ks) { for (const k of ks) s.delete(k); },
  };`);

registerHooks({
  resolve(specifier, context, nextResolve) {
    const stub = (url: string) => ({ url, shortCircuit: true });
    if (/lib\/supabase$/.test(specifier)) return stub(SUPABASE);
    if (/account\/deviceIdentity$/.test(specifier)) return stub(DEVICE);
    if (specifier === '@react-native-async-storage/async-storage') return stub(ASYNC);
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return stub(candidate.href);
    }
    return nextResolve(specifier, context);
  },
});

const read = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
/** Code only — a comment that mentions a fix is not the fix. */
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/([^:'"`])\/\/.*$/gm, '$1');
const between = (s: string, a: string, b: string) => {
  const i = s.indexOf(a);
  assert.ok(i >= 0, `missing: ${a}`);
  const j = s.indexOf(b, i + a.length);
  assert.ok(j > i, `missing after ${a}: ${b}`);
  return s.slice(i, j);
};

// ── 1 · Glossary share = one use ────────────────────────────────────────────
const gw = await import('../src/features/glossary/glossaryGateway.ts');
const rpc = () => g.__OR3_RPC__ as string[];
const signIn = (uid: string | null) =>
  (g.__OR3_AUTH__ as (e: string, s: unknown) => void)('SIGNED_IN', uid ? { user: { id: uid } } : null);

describe('1 · Glossary: sharing a term costs exactly the one lookup of opening it', () => {
  it('share an UNOPENED term → one RPC; opening it afterwards costs nothing', async () => {
    signIn('share-1');
    rpc().length = 0;
    // shareTerm: openViaGateway's read, then buildShareTerm's read, then getDetail's.
    await gw.readDefinitionOnce('t1', false);
    await gw.readDefinitionOnce('t1', false);
    await gw.readDefinitionOnce('t1', false);
    assert.deepEqual(rpc(), ['t1'], 'the share charged more than one lookup');
    // …and the reader then opens the same term, here or in a popup.
    await gw.readDefinitionOnce('t1', false);
    await gw.readDefinitionOnce('t1');
    assert.deepEqual(rpc(), ['t1'], 'opening a term already paid for by the share was charged again');
  });

  it('share an ALREADY-OPENED term → no RPC at all', async () => {
    signIn('share-2');
    rpc().length = 0;
    await gw.readDefinitionOnce('t2', false); // the open
    assert.equal(rpc().length, 1);
    await gw.readDefinitionOnce('t2', false); // the share
    assert.deepEqual(rpc(), ['t2']);
  });

  it('a MULTI-term share never charges the same term twice (sequential or concurrent)', async () => {
    signIn('share-3');
    rpc().length = 0;
    for (const id of ['a', 'b', 'a', 'c', 'b']) await gw.readDefinitionOnce(id, false); // resolveShareTerms
    await Promise.all(['a', 'd', 'd', 'c'].map((id) => gw.readDefinitionOnce(id, false))); // overlapping adds
    assert.deepEqual([...rpc()].sort(), ['a', 'b', 'c', 'd']);
  });

  it('a FAILED read leaves no paid definition behind — the screen guard keys on exactly this', async () => {
    signIn('share-4');
    rpc().length = 0;
    g.__OR3_FAULT__ = 'gateway timeout';
    const r = await gw.readDefinitionOnce('t4', false);
    g.__OR3_FAULT__ = null;
    assert.equal(r.state, 'fault');
    assert.equal(gw.sessionDefinition('t4', false), null);
  });

  const src = strip(read('src/screens/glossary/GlossaryScreen.tsx'));
  it('shareTerm: a failed first read is SAID, never read again (one share = at most one RPC)', () => {
    const s = between(src, 'const shareTerm = useCallback(', 'const deferredSearch');
    assert.match(
      s,
      /if \(serverMetersRef\.current && !detailsRef\.current\[e\.id\]\) \{\s*if \(!\(await openViaGatewayRef\.current\(e\.id\)\)\) return;\s*if \(!detailsRef\.current\[e\.id\] && !sessionDefinition\(e\.id, isMemberRef\.current\)\) \{\s*notifyShareUnreadable\(shareDefinitionUnreadable\(e\.term, 'error'\)\);\s*return;\s*\}\s*\}/,
    );
    // The guard sits BEFORE the build (whose own read would be the second charge).
    assert.ok(s.indexOf('sessionDefinition(e.id') < s.indexOf('primary = await buildShareTerm(e.id)'));
  });
  it('the share build and the multi-term resolve still read only through the session cache', () => {
    const b = between(src, 'const buildShareTerm = useCallback(', 'const resolveShareTerms');
    assert.equal((b.match(/readDefinitionOnce\(/g) ?? []).length, 1);
    assert.doesNotMatch(b, /fetchDefinitionViaGateway|supabase\.rpc/);
    const r = between(src, 'const resolveShareTerms = useCallback(', 'const namedFrom');
    assert.doesNotMatch(r, /readDefinitionOnce|fetchDefinitionViaGateway|supabase\.rpc/);
  });
});

// ── 2 · OSHA above 115 / 130 dBA ────────────────────────────────────────────
describe('2 · OSHA dose: honest above 115 and 130 dBA, still counted', async () => {
  const spl = await import('../src/screens/lab/calc/workspaces/splSafety.ts');
  const ws = spl.WORKSPACES_SPL.find((w) => w.id === 'dose')!;
  const dose = ws.functions.find((f) => f.key === 'doseOsha')!;
  const allow = ws.functions.find((f) => f.key === 'allowOsha')!;
  const texts = (o: ReturnType<typeof dose.compute>) => o.filter((r) => 'text' in r) as { label: string; text: string }[];
  const has = (o: ReturnType<typeof dose.compute>, label: string) => texts(o).find((r) => r.label === label);

  it('at or below 115 dBA: no new lines', () => {
    const o = dose.compute({ doseLevels: [90, 105, 115], doseMins: [60, 30, 10] });
    assert.equal(has(o, 'ABOVE 115 dBA'), undefined);
    assert.equal(has(o, 'ABOVE 130 dBA'), undefined);
  });
  it('above 115 dBA: the no-continuous-exposure line', () => {
    const o = dose.compute({ doseLevels: [90, 116], doseMins: [60, 1] });
    assert.match(has(o, 'ABOVE 115 dBA')?.text ?? '', /OSHA allows no continuous exposure above 115 dBA/);
    assert.equal(has(o, 'ABOVE 130 dBA'), undefined);
  });
  it('above 130 dBA: both lines, and the interval is STILL counted by the 5 dB rule', () => {
    const o = dose.compute({ doseLevels: [135], doseMins: [1] });
    assert.ok(has(o, 'ABOVE 115 dBA'));
    assert.match(has(o, 'ABOVE 130 dBA')?.text ?? '', /Table G-16a stops at 130 dBA.*extending the same 5 dB rule/);
    // 135 dBA: T = 480 / 2^(45/5) = 480/512 min; 1 min → 106.666…%
    const pel = o.find((r) => r.label.startsWith('PEL DOSE')) as { value: number };
    assert.ok(Math.abs(pel.value - (1 / (480 / 512)) * 100) < 1e-9);
    assert.equal(spl.oshaDose([135], [1], spl.OSHA_PEL_THRESHOLD), pel.value);
  });
  it('only PAIRED intervals are judged (an unpaired 140 is not counted, so not warned)', () => {
    const o = dose.compute({ doseLevels: [95, 140], doseMins: [60] });
    assert.equal(has(o, 'ABOVE 115 dBA'), undefined);
  });
  it('the single-level OSHA allowable time says the same', () => {
    assert.ok(has(allow.compute({ lex: 131 }), 'ABOVE 130 dBA'));
    assert.ok(has(allow.compute({ lex: 120 }), 'ABOVE 115 dBA'));
    assert.equal(has(allow.compute({ lex: 110 }), 'ABOVE 115 dBA'), undefined);
  });
});

// ── 3 · Failed saves are told ───────────────────────────────────────────────
describe('3 · Home Setup SAVE: a refused write is said', async () => {
  const home = await import('../src/features/home/homeCardsStore.ts');
  it('setHomeGs answers the write result (true when stored, false when refused)', async () => {
    assert.equal(await home.setHomeGs([1, 2]), true);
    AS.failWrites = true;
    try {
      assert.equal(await home.setHomeGs([3]), false);
      assert.equal(await home.setDefaultHomeGs(3), false); // 3 is on the (in-memory) list, so a real write
    } finally {
      AS.failWrites = false;
    }
  });
  it('the sheet notifies on a false result, after closing', () => {
    const s = strip(read('src/screens/enrollment/HomeSetupSheet.tsx'));
    const save = between(s, 'const save = () =>', 'const holdTimer');
    assert.match(save, /const list = setHomeGs\(/);
    assert.match(save, /const def = setDefaultHomeGs\(defaultDraft\);/);
    assert.match(save, /onClose\(\);\s*void Promise\.all\(\[list, def\]\)\.then\(\(\[a, b\]\) => \{\s*if \(!\(a && b\)\) \{\s*notify\('Home not saved'/);
  });
});

// ── 4 · Membership check: once it fails, stop checking ──────────────────────
describe('4 · tierReadFailed: set after the retries, cleared on success / identity change', () => {
  const p = strip(read('src/features/commercial/EntitlementProvider.tsx'));
  it('is in the context type, the value and the useMemo deps', () => {
    assert.match(between(p, 'type EntitlementContextValue = {', '\n};'), /tierReadFailed: boolean;/);
    assert.match(p, /const \[tierReadFailed, setTierReadFailed\] = useState\(false\);/);
    const memo = between(p, 'const value = useMemo<EntitlementContextValue>(', 'return <EntitlementContext.Provider');
    assert.match(memo, /tierKnown,\s*tierReadFailed,\s*\}\)/);
    assert.match(memo, /\[commercialMode, entitlement, resolved, tierKnown, tierReadFailed, /);
  });
  it('SET only when the retries are spent, for the generation that gave up', () => {
    const d = between(p, 'const deriveWithRetry = async', 'const identityOf');
    const loopEnd = d.indexOf("console.warn('[entitlement] read still failing after retries");
    assert.ok(loopEnd > 0);
    assert.match(d.slice(loopEnd), /^[^\n]*\n\s*if \(alive && generation === mine && !devOverrode\.current\) setTierReadFailed\(true\);/);
    assert.equal((p.match(/setTierReadFailed\(true\)/g) ?? []).length, 1, 'set anywhere else');
    // The retry schedule itself is unchanged: three, bounded — no loop.
    assert.match(p, /const RETRY_DELAYS_MS = \[1500, 4000, 10000\];/);
    assert.match(d, /for \(const delay of RETRY_DELAYS_MS\)/);
    assert.doesNotMatch(p, /setInterval\(/);
  });
  it('CLEARED by markKnown, by a successful refresh, and by an identity change', () => {
    assert.match(between(p, 'const markKnown = () => {', 'if (await deriveAndApply'), /setTierKnown\(true\);\s*setTierReadFailed\(false\);/);
    assert.match(between(p, 'const refreshEntitlement = useCallback(', 'const setCommercialMode'), /setTierKnown\(true\);\s*setTierReadFailed\(false\);/);
    assert.match(between(p, 'if (uidSeeded.current && identity !== lastUid.current) {', 'clearLocalOnUserChange(identity);'), /setTierKnown\(false\);\s*setTierReadFailed\(false\);/);
  });
});

describe('4 · every CHECKING… site has an honest end state', () => {
  it('Settings — NOTIFICATIONS summary and body, MEMBERSHIP summary and Status', () => {
    const s = strip(read('src/screens/settings/SettingsScreen.tsx'));
    assert.match(s, /const \{ entitlement, refreshEntitlement, resolved, tierKnown, tierReadFailed \} = useEntitlement\(\);/);
    assert.match(s, /if \(!tierKnown && !isMember\) return tierReadFailed \? 'not confirmed' : '…';/);
    assert.match(s, /\{tierReadFailed\s*\? 'Couldn’t confirm your membership on this phone\. Check your connection and reopen the app\.'\s*: 'Checking your membership…'\}/);
    assert.match(s, /summary=\{!tierKnown \? \(tierReadFailed \? 'NOT CONFIRMED' : '…'\) : isMember/);
    assert.match(s, /\{!tierKnown\s*\? tierReadFailed\s*\? 'NOT CONFIRMED'\s*: 'CHECKING…'/);
    // No other CHECKING… left without the end state.
    assert.equal((s.match(/'CHECKING…'/g) ?? []).length, 1);
  });
  it('Profile — status', () => {
    const s = strip(read('src/screens/profile/ProfileScreen.tsx'));
    assert.match(s, /tierKnown, tierReadFailed \} = useEntitlement\(\);/);
    assert.match(s, /const statusLabel = !tierKnown\s*\? tierReadFailed\s*\? 'NOT CONFIRMED'\s*: 'CHECKING…'/);
  });
  it('Tools — useSaveGate: plain SAVE (no 🔒), no save, notify on tap', () => {
    const s = strip(read('src/screens/tools/ToolLockUi.tsx'));
    const sg = between(s, 'export function useSaveGate()', 'export function useFullScreenGate');
    assert.match(sg, /const unconfirmed = !isMember && !known && tierReadFailed;/);
    assert.match(sg, /const checking = !isMember && !known && !tierReadFailed;/);
    assert.match(sg, /const locked = !isMember;/);
    assert.match(sg, /label: \(base: string\) => \(checking \? 'CHECKING…' : unconfirmed \? base : locked \? `🔒 \$\{base\}` : base\)/);
    assert.match(sg, /if \(unconfirmed\) \{\s*notify\(\s*'Membership not confirmed',\s*'Couldn’t confirm your membership on this phone\. Check your connection and reopen the app\.',\s*\);\s*return;\s*\}\s*openMembershipGate/);
  });
  it('MultiMeter keeps its sheet and draft when unconfirmed (prompt, no close)', () => {
    const s = strip(read('src/screens/tools/MultiMeterScreen.tsx'));
    assert.match(s, /if \(saveGate\.checking\) return;\s*if \(saveGate\.unconfirmed\) \{\s*saveGate\.prompt\(\);\s*return;\s*\}\s*if \(saveGate\.locked\) \{\s*setDraft\(null\);/);
  });
  it('Paywall — "still checking" only while something is checking', () => {
    const s = strip(read('src/screens/commercial/PaywallScreen.tsx'));
    assert.match(s, /if \(!tierKnown\) \{\s*if \(tierReadFailed\) \{\s*notify\(\s*'Membership not confirmed',/);
  });
});
