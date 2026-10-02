/**
 * GLOSSARY — evening toddler hunt pass 2 (2026-10-02).
 *
 * 1. ONE CHARGE PER TERM PER SESSION, ACROSS SURFACES. The server charges
 *    every `get_glossary_definition` call. The Glossary screen remembered what
 *    it had read only per MOUNT (it is a pushed stack screen, so every visit
 *    started empty), and the term popup kept its own separate cache — so a free
 *    reader paid again for a term read on an earlier visit, or read in a
 *    calculator popup. Both now read through glossaryGateway's
 *    readDefinitionOnce, keyed to the uid, with a standing check so joining or
 *    lapsing re-reads (members are never metered).
 *
 * Driven for real: glossaryGateway is imported with supabase stubbed (the RPC
 * counts its calls; the auth listener is captured so a sign-out can be fired).
 *
 * R2: the behaviour tests FAILED against the pre-fix glossaryGateway.ts (no
 * readDefinitionOnce export) and the source test against the pre-fix
 * GlossaryScreen.tsx (copied aside, restored, run, put back).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
g.__GE2_RPC__ = [] as string[];
g.__GE2_ROW__ = { lim: 14, used: 3 };
g.__GE2_FAULT__ = null;

const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const SUPABASE = mod(`
  export const supabase = {
    auth: { onAuthStateChange(cb) { globalThis.__GE2_AUTH__ = cb; return { data: { subscription: { unsubscribe() {} } } }; } },
    async rpc(name, args) {
      globalThis.__GE2_RPC__.push(args.p_id);
      const f = globalThis.__GE2_FAULT__;
      if (f) return { data: null, error: { message: f } };
      const r = globalThis.__GE2_ROW__;
      return { data: [{ definition: 'full text', plain_english: null, purpose_function: null, practical_application: null,
        scenario_contexts: null, related_terms: null, category: null, difficulty: null, common_mistakes: null,
        used: r.used, lim: r.lim, window_start: null }], error: null };
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
const rpc = () => g.__GE2_RPC__ as string[];
const signIn = (uid: string | null) =>
  (g.__GE2_AUTH__ as (e: string, s: unknown) => void)('SIGNED_IN', uid ? { user: { id: uid } } : null);

describe('glossary definitions: one charge per term per session (evening 2)', () => {
  it('a second read of the same term — another visit, or the popup — is not charged', async () => {
    signIn('free-1');
    rpc().length = 0;
    const a = await gw.readDefinitionOnce('t1', false); // the Glossary screen, first visit
    const b = await gw.readDefinitionOnce('t1', false); // the Glossary screen, next visit
    const c = await gw.readDefinitionOnce('t1'); //        a calculator's term popup
    assert.equal(a.state, 'ok');
    assert.equal(b.state, 'ok');
    assert.equal(c.state, 'ok');
    assert.deepEqual(rpc(), ['t1'], 'the same term was charged more than once in one session');
  });

  it('two taps while the first read is out share it', async () => {
    signIn('free-2');
    rpc().length = 0;
    await Promise.all([gw.readDefinitionOnce('t2', false), gw.readDefinitionOnce('t2')]);
    assert.deepEqual(rpc(), ['t2']);
  });

  it('a fault is never kept — the next tap asks again', async () => {
    signIn('free-3');
    rpc().length = 0;
    g.__GE2_FAULT__ = 'gateway timeout';
    const r = await gw.readDefinitionOnce('t3', false);
    assert.equal(r.state, 'fault');
    g.__GE2_FAULT__ = null;
    const r2 = await gw.readDefinitionOnce('t3', false);
    assert.equal(r2.state, 'ok');
    assert.deepEqual(rpc(), ['t3', 't3']);
  });

  it('another identity on the phone starts empty', async () => {
    signIn('free-4');
    rpc().length = 0;
    await gw.readDefinitionOnce('t4', false);
    signIn(null); // sign-out
    signIn('free-5');
    await gw.readDefinitionOnce('t4', false);
    assert.deepEqual(rpc(), ['t4', 't4'], 'the next reader inherited the last one\'s paid read');
  });

  it('a read under the other standing is re-read (joining / lapsing)', async () => {
    signIn('free-6');
    rpc().length = 0;
    g.__GE2_ROW__ = { lim: 14, used: 4 }; // a metered (free) read: Common Mistakes masked
    await gw.readDefinitionOnce('t6', false);
    await gw.readDefinitionOnce('t6', true); // joined: must not get the masked row
    assert.deepEqual(rpc(), ['t6', 't6']);
    g.__GE2_ROW__ = { lim: null, used: null }; // a member's read
    await gw.readDefinitionOnce('t7', true);
    await gw.readDefinitionOnce('t7', false); // lapsed: must not get the member's row free
    assert.deepEqual(rpc(), ['t6', 't6', 't7', 't7']);
    g.__GE2_ROW__ = { lim: 14, used: 3 };
  });
});

describe('the Glossary screen and the popup read through the session cache', () => {
  const read = (p: string) => readFileSync(fileURLToPath(new URL(`../${p}`, import.meta.url)), 'utf8');
  it('GlossaryScreen.readViaGateway uses readDefinitionOnce with the reader\'s standing', () => {
    const s = read('src/screens/glossary/GlossaryScreen.tsx');
    const i = s.indexOf('const readViaGateway = useCallback(');
    assert.ok(i >= 0);
    const body = s.slice(i, i + 2600);
    assert.match(body, /await readDefinitionOnce\(id, isMember\)/);
    assert.ok(!/fetchDefinitionViaGateway\(/.test(body), 'the screen calls the metered read directly again');
    // A cached answer is not a new charge, so it must not repeat the heads-up.
    assert.match(body, /if \(fresh && typeof used === 'number'/);
  });
  it('the popup no longer keeps a cache of its own', () => {
    const p = read('src/features/glossary/GlossaryTermPopup.tsx');
    assert.match(p, /return readDefinitionOnce\(id\);/);
    assert.ok(!/new Map<string, Promise<DefinitionResult>>/.test(p));
  });
});
