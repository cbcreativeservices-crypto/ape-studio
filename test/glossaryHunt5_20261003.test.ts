/**
 * GLOSSARY — hunt 5 (2026-10-03). Re-audit of f88cbb5b / 1e9f0f9d.
 *
 * 1. READ_UNANSWERED over-recorded. Every plain 'error' fault was filed as
 *    "sent, maybe charged", so the term was never read again this session.
 *    But a CODED server error (PGRST000/003 pool exhaustion, a JWT reject, a
 *    statement timeout) is PostgREST answering with a rolled-back
 *    transaction: get_glossary_definition's glossary_consume increment
 *    (2026092502_glossary_meter_per_device.sql:213) rolled back with it. Nothing
 *    was charged, yet the reader lost that term's full definition for the
 *    whole session. Only an uncoded fault (timeout / transport) may have been
 *    counted.
 * 2. GlossaryTermPopup told a confirmed MEMBER their full entry (the browse
 *    view hands members the whole text) was "the opening of the entry" after a
 *    gateway fault — with "so you're never charged twice" since f88cbb5b.
 * 3. GlossaryTermPopup said MEMBERSHIP_NOT_CONFIRMED ("Couldn't confirm … reopen
 *    the app") while the membership read was still retrying ('checking').
 * 4. GlossaryScreen's return-to-term effect relied on `capped` meaning "not yet
 *    known or a non-member"; since f88cbb5b `capped` is false while the gate is
 *    'checking' / 'unconfirmed', so the stored term opened (and was charged)
 *    before anyone knew whose lookup it was.
 *
 * Receipts: every test below FAILED on HEAD 29b2ed4c.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
g.__GH5_RPC__ = [] as string[];
g.__GH5_ERR__ = null;

const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const SUPABASE = mod(`
  export const supabase = {
    auth: { onAuthStateChange(cb) { globalThis.__GH5_AUTH__ = cb; return { data: { subscription: { unsubscribe() {} } } }; } },
    async rpc(name, args) {
      globalThis.__GH5_RPC__.push(args.p_id);
      const e = globalThis.__GH5_ERR__;
      if (e) return { data: null, error: e };
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
const rpc = () => g.__GH5_RPC__ as string[];
const signIn = (uid: string) =>
  (g.__GH5_AUTH__ as (e: string, s: unknown) => void)('SIGNED_IN', { user: { id: uid } });

const read = (p: string) =>
  readFileSync(fileURLToPath(new URL('../' + p, import.meta.url)), 'utf8').replace(/\r\n/g, '\n');

describe('1 · a coded server error is not a charge: the next open asks again', () => {
  it('PGRST003 (pool timeout) → re-open is sent and opens', async () => {
    signIn('h5-free-1');
    rpc().length = 0;
    g.__GH5_ERR__ = { code: 'PGRST003', message: 'Timed out acquiring connection from connection pool.' };
    const first = await gw.readDefinitionOnce('c1', false);
    g.__GH5_ERR__ = null;
    assert.equal(first.state, 'fault');
    assert.equal(gw.sessionChargeUnanswered('c1'), false, 'a rolled-back read was filed as charged');
    const again = await gw.readDefinitionOnce('c1', false);
    assert.equal(again.state, 'ok');
    assert.deepEqual(rpc(), ['c1', 'c1']);
  });

  it('an uncoded timeout is filed as maybe-charged, and (since the 24 h ledger, 2026-10-04) re-sent on the next open', async () => {
    signIn('h5-free-2');
    rpc().length = 0;
    g.__GH5_ERR__ = { message: 'gateway timeout' };
    await gw.readDefinitionOnce('c2', false);
    g.__GH5_ERR__ = null;
    assert.equal(gw.sessionChargeUnanswered('c2'), true);
    const again = await gw.readDefinitionOnce('c2', false);
    assert.equal(again.state, 'ok');
    assert.equal(gw.sessionChargeUnanswered('c2'), false);
    assert.deepEqual(rpc(), ['c2', 'c2']);
  });
});

describe('2/3 · the term popup labels a short entry honestly', () => {
  const p = read('src/features/glossary/GlossaryTermPopup.tsx');
  const block = p.slice(p.indexOf("if (full.state !== 'ok') {"), p.indexOf('setRow((prev) =>'));

  it("a confirmed member's full browse row gets no 'opening of the entry' note", () => {
    const open = block.indexOf("if (gate === 'open') return;");
    assert.ok(open > 0, 'no member exemption from the partial note');
    assert.ok(open < block.indexOf("setPartial('unanswered')"), 'the exemption must precede the unanswered note');
    assert.ok(open < block.indexOf("setPartial('other')"), 'the exemption must precede the other note');
  });

  it("'checking' is not told the membership could not be confirmed", () => {
    assert.match(block, /gate === 'checking' \? 'checking'/);
    assert.match(p, /partial === 'checking'\s*\?\s*'[^']*still being checked/);
  });
});

describe('4 · return-to-term waits for a known standing', () => {
  it('the effect also returns while the gate is checking / unconfirmed', () => {
    const s = read('src/screens/glossary/GlossaryScreen.tsx');
    const i = s.indexOf('AsyncStorage.getItem(RETURN_TERM_KEY)');
    assert.ok(i > 0);
    const head = s.slice(s.lastIndexOf('useEffect(() => {', i), i);
    assert.match(head, /if \(!resolved \|\| capped \|\| memberGate === 'checking' \|\| memberGate === 'unconfirmed'\) return;/);
    assert.match(s, /\}, \[resolved, capped, memberGate, openPopupRoot\]\);/);
  });
});
