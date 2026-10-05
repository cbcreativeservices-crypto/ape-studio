/**
 * GLOSSARY — sharing is never an extra charge (owner ruling 2026-10-03 #1:
 * "opening a glossary term costs 1 lookup; once opened it is free for the
 * session; sharing is never an extra charge").
 *
 * The gap: the server counts every `get_glossary_definition` CALL, not every
 * answer. When a reader's open of a term went out and timed out (the 12 s
 * deadline, a dropped link), the server may already have counted it — but the
 * session cache (readDefinitionOnce, evening hunt 2) keeps only GOOD reads, so
 * SHARE on that term read the gateway again: a second lookup for one term
 * (and, through the multi-term share, one per such term). The legacy detail
 * the open fell back to carries no definition, so nothing short of another
 * metered read could fill the card.
 *
 * Now glossaryGateway remembers, per identity, a read that was SENT and never
 * answered (`sessionChargeUnanswered`), and Share says "couldn't be loaded"
 * instead of spending the second lookup. The open path is unchanged: a fault
 * is never kept, so re-opening the term is the reader's own retry.
 *
 * R2: these tests FAILED against the pre-fix glossaryGateway.ts (no
 * sessionChargeUnanswered export) and GlossaryScreen.tsx (copied aside, the
 * HEAD version put in place, run, the edited copy restored).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
g.__GSC_RPC__ = [] as string[];
g.__GSC_FAULT__ = null;

const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const SUPABASE = mod(`
  export const supabase = {
    auth: { onAuthStateChange(cb) { globalThis.__GSC_AUTH__ = cb; return { data: { subscription: { unsubscribe() {} } } }; } },
    async rpc(name, args) {
      globalThis.__GSC_RPC__.push(args.p_id);
      const f = globalThis.__GSC_FAULT__;
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
const signIn = (uid: string | null) =>
  (g.__GSC_AUTH__ as (e: string, s: unknown) => void)('SIGNED_IN', uid ? { user: { id: uid } } : null);

describe('glossaryGateway: a read SENT and never answered is remembered for the session', () => {
  it('a timed-out open is remembered; a good read clears it', async () => {
    signIn('free-a');
    g.__GSC_FAULT__ = 'gateway timeout';
    const r = await gw.readDefinitionOnce('t1', false);
    assert.equal(r.state, 'fault');
    assert.equal(gw.sessionChargeUnanswered('t1'), true, 'the charged-but-unanswered open is not remembered');
    g.__GSC_FAULT__ = null;
    // 2026-10-04: a free reader's re-open IS re-sent now (the server's 24 h
    // ledger answers a counted term without spending — glossaryMemberMeter),
    // and a good read clears the record.
    await gw.readDefinitionOnce('t1', false);
    assert.equal(gw.sessionChargeUnanswered('t1'), false);
  });

  it('a refusal is not a charge (limit / sign-in / not deployed)', async () => {
    signIn('free-b');
    for (const [id, msg] of [['t2', 'weekly_limit_reached'], ['t3', 'sign_in_required'], ['t4', 'could not find the function']]) {
      g.__GSC_FAULT__ = msg;
      await gw.readDefinitionOnce(id, false);
      assert.equal(gw.sessionChargeUnanswered(id), false, msg);
    }
    g.__GSC_FAULT__ = null;
  });

  it('another identity on the phone starts empty', async () => {
    signIn('free-c');
    g.__GSC_FAULT__ = 'gateway timeout';
    await gw.readDefinitionOnce('t5', false);
    g.__GSC_FAULT__ = null;
    assert.equal(gw.sessionChargeUnanswered('t5'), true);
    signIn(null);
    signIn('free-d');
    assert.equal(gw.sessionChargeUnanswered('t5'), false);
  });
});

describe('GlossaryScreen: Share never reads the gateway again for such a term', () => {
  const src = readFileSync(fileURLToPath(new URL('../src/screens/glossary/GlossaryScreen.tsx', import.meta.url)), 'utf8').replace(/\r\n/g, '\n');
  const between = (a: string, b: string) => {
    const i = src.indexOf(a);
    assert.ok(i >= 0, a);
    return src.slice(i, src.indexOf(b, i));
  };

  it('buildShareTerm (single AND multi-term shares) stops before readDefinitionOnce', () => {
    const s = between('const buildShareTerm = useCallback(', 'const resolveShareTerms');
    const guard = s.indexOf("if (!isMemberRef.current && sessionChargeUnanswered(id)) throw shareDefinitionUnreadable(e.term, 'error');");
    assert.ok(guard > 0, 'no charged-term guard in buildShareTerm');
    assert.ok(guard < s.indexOf('await readDefinitionOnce(id'), 'the guard must come before the metered read');
  });

  it('shareTerm stops before openViaGateway (whose read would be the second charge)', () => {
    const s = between('const shareTerm = useCallback(', 'const deferredSearch');
    const guard = s.indexOf("if (defTierRef.current !== 'member' && sessionChargeUnanswered(e.id)) {");
    assert.ok(guard > 0, 'no charged-term guard in shareTerm');
    assert.ok(guard < s.indexOf('await openViaGatewayRef.current(e.id)'));
    assert.match(s.slice(guard, guard + 220), /notifyShareUnreadable\(shareDefinitionUnreadable\(e\.term, 'error'\)\);\s*return;/);
  });
});
