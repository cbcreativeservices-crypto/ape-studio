/**
 * GLOSSARY — owner decisions 2026-10-03.
 *
 * #1 A paying member is never capped on the CLIENT. A signed-in learner whose
 *    membership read failed (no remembered tier) was metered like a free
 *    reader: `capped = commercialMode && resolved && !isMember` matched them,
 *    so the client lock check ran, rows clamped, and a server
 *    'weekly_limit_reached' put up the "out of lookups" lock with its upsell.
 *    The SERVER already exempts members itself
 *    (supabase/migrations/2026092502_glossary_meter_per_device.sql:196-205 —
 *    `has_academy_access(auth.uid())` returns the row unmetered), so the
 *    client now meters only a KNOWN non-member (`useMemberGate() === 'locked'`)
 *    and says MEMBERSHIP_NOT_CONFIRMED where something must be refused.
 *
 * #2 Re-opening a term after a timed-out read is free for the session, like
 *    Share. The server has NO per-term ledger: get_glossary_definition calls
 *    glossary_consume on every call (same migration, :213), so the only free
 *    re-open is one that is not sent. readDefinitionOnce now answers a term
 *    whose read was sent and never answered with the same fault, unsent —
 *    except for a confirmed member, whom the server never meters.
 *    SUPERSEDED 2026-10-04: the server's 24 h per-term ledger is LIVE
 *    (glossary_term_reads, 2026100301; Comp A, CHECK all true), so the
 *    client guard is removed — a re-open is SENT, and a counted term is
 *    answered without spending. The #2 tests below now prove the re-send.
 *
 * Receipts: these tests FAILED on HEAD (fb34b850) — the gateway re-sent the
 * read, GlossaryScreen capped on `resolved && !isMember` and locked on any
 * server limit, and the popup sold upgrade options to an unconfirmed member.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
g.__GMM_RPC__ = [] as string[];
g.__GMM_FAULT__ = null;

const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const SUPABASE = mod(`
  export const supabase = {
    auth: { onAuthStateChange(cb) { globalThis.__GMM_AUTH__ = cb; return { data: { subscription: { unsubscribe() {} } } }; } },
    async rpc(name, args) {
      globalThis.__GMM_RPC__.push(args.p_id);
      const f = globalThis.__GMM_FAULT__;
      if (f) return { data: null, error: { message: f } };
      return { data: [{ definition: 'full text', plain_english: null, purpose_function: null, practical_application: null,
        scenario_contexts: null, related_terms: null, category: null, difficulty: null, common_mistakes: null,
        used: 3, lim: 14, window_start: null }], error: null };
    },
    from() { throw new Error('not used'); },
  };`);
const DEVICE = mod(`export async function getDeviceId() { return 'device-1'; }`);

registerHooks({
  resolve(specifier, context, nextResolve) {
    const stub = (url: string) => ({ url, shortCircuit: true });
    if (/lib\/supabase$/.test(specifier)) return stub(SUPABASE);
    if (/account\/deviceIdentity$/.test(specifier)) return stub(DEVICE);
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return stub(candidate.href);
    }
    return nextResolve(specifier, context);
  },
});

const gw = await import('../src/features/glossary/glossaryGateway.ts');
const rpc = () => g.__GMM_RPC__ as string[];
const signIn = (uid: string | null) =>
  (g.__GMM_AUTH__ as (e: string, s: unknown) => void)('SIGNED_IN', uid ? { user: { id: uid } } : null);

const read = (p: string) =>
  readFileSync(fileURLToPath(new URL('../' + p, import.meta.url)), 'utf8').replace(/\r\n/g, '\n');
const between = (src: string, a: string, b: string) => {
  const i = src.indexOf(a);
  assert.ok(i >= 0, a);
  const j = src.indexOf(b, i);
  assert.ok(j > i, b);
  return src.slice(i, j);
};

describe('#2 · a re-open after a timed-out read is SENT again (the server ledger makes it free)', () => {
  it('free reader: timeout, then re-open → read again and opened; then cached (popup sends nothing)', async () => {
    signIn('mm-free-1');
    rpc().length = 0;
    g.__GMM_FAULT__ = 'gateway timeout';
    const first = await gw.readDefinitionOnce('t1', false);
    g.__GMM_FAULT__ = null;
    assert.equal(first.state, 'fault');
    assert.equal(gw.sessionChargeUnanswered('t1'), true);
    const again = await gw.readDefinitionOnce('t1', false); // Glossary re-open, next visit
    const popup = await gw.readDefinitionOnce('t1'); //         a lab / calculator term popup
    assert.deepEqual(rpc(), ['t1', 't1'], 'the re-open is asked again; the popup then reads the session copy');
    assert.equal(again.state, 'ok');
    assert.equal(popup.state, 'ok');
    assert.equal(gw.sessionChargeUnanswered('t1'), false);
  });

  it('a confirmed member still re-reads (the server never meters them)', async () => {
    signIn('mm-member-1');
    rpc().length = 0;
    g.__GMM_FAULT__ = 'gateway timeout';
    await gw.readDefinitionOnce('t2', true);
    g.__GMM_FAULT__ = null;
    const r = await gw.readDefinitionOnce('t2', true);
    assert.equal(r.state, 'ok');
    assert.deepEqual(rpc(), ['t2', 't2']);
  });

  it('a refusal is not a charge: the next tap still asks', async () => {
    signIn('mm-free-2');
    rpc().length = 0;
    g.__GMM_FAULT__ = 'weekly_limit_reached';
    await gw.readDefinitionOnce('t3', false);
    g.__GMM_FAULT__ = null;
    const r = await gw.readDefinitionOnce('t3', false);
    assert.equal(r.state, 'ok');
    assert.deepEqual(rpc(), ['t3', 't3']);
  });

  it('a new identity on the phone starts clean', async () => {
    signIn('mm-free-3');
    rpc().length = 0;
    g.__GMM_FAULT__ = 'gateway timeout';
    await gw.readDefinitionOnce('t4', false);
    g.__GMM_FAULT__ = null;
    signIn(null);
    signIn('mm-free-4');
    const r = await gw.readDefinitionOnce('t4', false);
    assert.equal(r.state, 'ok');
    assert.deepEqual(rpc(), ['t4', 't4']);
  });

  it('the term popup words such a term: retry, and never charged twice within 24 hours', () => {
    const p = read('src/features/glossary/GlossaryTermPopup.tsx');
    assert.match(p, /else if \(full\.fault === 'error' && sessionChargeUnanswered\(hit\.id\)\) setPartial\('unanswered'\);/);
    assert.match(p, /partial === 'unanswered'\s*\?\s*'[^']*open it again to retry[^']*never charged twice/);
    // Start Here asks first (D55) for such a term: it may still be charged.
    assert.match(p, /export function termPaidThisSession[\s\S]{0,160}?return sessionDefinition\(known\.id\) != null;\n\}/);
  });
});

describe('#1 · the client meters only a KNOWN non-member', () => {
  const screen = read('src/screens/glossary/GlossaryScreen.tsx');

  it('capped keys on the member gate, not on resolved && !isMember', () => {
    assert.match(screen, /const memberGate = useMemberGate\(\);\s*const meterKnown = memberGate === 'locked';/);
    assert.match(screen, /const capped = meterKnown;/);
    assert.doesNotMatch(screen, /const capped = (commercialMode && )?resolved && !isMember;/);
  });

  it('a server limit while membership is unconfirmed: no lock, no upsell — the honest words', () => {
    const b = between(screen, "if (r.fault === 'limit-reached') {", "if (r.fault === 'sign-in-required') {");
    const guard = b.indexOf('if (!meterKnown) {');
    assert.ok(guard > 0, 'no unconfirmed-membership guard before the lock');
    assert.ok(guard < b.indexOf('setLocked(true)'), 'the guard must come before the lock');
    assert.match(b.slice(guard, guard + 400), /MEMBERSHIP_NOT_CONFIRMED[\s\S]*return false;/);
  });

  it('the term popup sells upgrade options only to a known non-member', () => {
    const p = read('src/features/glossary/GlossaryTermPopup.tsx');
    assert.match(p, /const memberGate = useMemberGate\(\);/);
    // Hunt 5 (2026-10-03): the gate itself is kept, so 'checking' gets its own words.
    assert.match(p, /setPartial\(gate === 'locked' \? 'limit-reached' : gate === 'checking' \? 'checking' : 'unconfirmed'\)/);
    assert.match(p, /partial === 'unconfirmed'\s*\?\s*`[^`]*\$\{MEMBERSHIP_NOT_CONFIRMED\}`/);
  });

  it('memberGateOf: an unconfirmed signed-in learner is never "locked"', async () => {
    const { memberGateOf } = await import('../src/features/commercial/tier.ts');
    // resolved, read failed, no remembered tier → tierOf says 'guest'
    assert.equal(memberGateOf('guest', false, true), 'unconfirmed');
    assert.equal(memberGateOf('guest', false, false), 'checking');
    assert.equal(memberGateOf('unknown', false, false), 'checking');
    assert.equal(memberGateOf('member', false, true), 'open');
    // known guest / known or remembered free → metered
    assert.equal(memberGateOf('guest', true, false), 'locked');
    assert.equal(memberGateOf('free', false, true), 'locked');
  });
});
