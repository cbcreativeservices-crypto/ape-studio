/**
 * Log out must not silently lose finished-lab credit (audit 2026-10-24, high).
 * A lab finished offline (or whose server row is missing) waits in
 * ape:labProgress as complete-but-unsent; the SIGNED_OUT wipe deletes it. Both
 * sign-out paths now retry that credit first and COUNT what is still unsent,
 * so the dialog warns instead of saying the progress is safe.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

type Kv = { map: Map<string, string> };
const kv: Kv = { map: new Map() };
const net = { online: false, calls: 0 };
(globalThis as unknown as { __lcKv: Kv; __lcNet: typeof net }).__lcKv = kv;
(globalThis as unknown as { __lcNet: typeof net }).__lcNet = net;
(globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;

const STUBS: Record<string, string> = {
  'async-storage': `const s = globalThis.__lcKv; export default {
    getItem: async (k) => (s.map.has(k) ? s.map.get(k) : null),
    setItem: async (k, v) => { s.map.set(k, v); },
    removeItem: async (k) => { s.map.delete(k); },
    multiRemove: async (ks) => { for (const k of ks) s.map.delete(k); },
    getAllKeys: async () => [...s.map.keys()],
  };`,
  supabase: `const n = globalThis.__lcNet; export const supabase = { rpc: async () => {
    n.calls++; if (!n.online) throw new Error('network'); return { data: {}, error: null }; } };`,
  sync: `export const emitStudyProgress = () => {};`,
  reviewPrompt: `export const noteHighValueEvent = async () => {};`,
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'lc-stub:async-storage', shortCircuit: true };
    if (/\/lib\/supabase$/.test(specifier)) return { url: 'lc-stub:supabase', shortCircuit: true };
    if (/\/study\/sync$/.test(specifier)) return { url: 'lc-stub:sync', shortCircuit: true };
    if (/\/review\/reviewPrompt$/.test(specifier)) return { url: 'lc-stub:reviewPrompt', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      for (const ext of ['.ts', '.tsx', '/index.ts']) {
        const candidate = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith('lc-stub:')) return { format: 'module', shortCircuit: true, source: STUBS[url.slice('lc-stub:'.length)] };
    return nextLoad(url, context);
  },
});

const carry = await import('../src/features/lab/sessionCarry.ts');
const lc = await import('../src/features/lab/labCompletion.ts');
const settle = () => new Promise((r) => setTimeout(r, 20));
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('unsent lab credit at sign-out', () => {
  it('a lab finished offline counts as unsent; the sign-out retry sends it', async () => {
    carry.noteSessionIdentity('member-1');
    await carry.settleSessionCarry(); // sign-in fully settled, as at any real Log out
    await lc.hydrateLabCompletion();
    const [key, units] = Object.entries(lc.LAB_UNITS).find(([, u]) => u && u.length > 0)! as [string, readonly string[]];
    for (const u of units) lc.markLabUnit(key as never, u);
    await settle();
    assert.ok(lc.isLabComplete(key), 'the lab is complete on the phone');
    assert.equal(lc.unsentLabCreditCount(), 1, 'offline: the credit is waiting');
    net.online = true;
    await lc.retryUnsentLabCredit();
    assert.equal(lc.unsentLabCreditCount(), 0, 'online: the retry sent it');
    assert.ok(lc.isLabCreditSent(key));
  });

  it('both sign-out paths retry it and count it in the warning', () => {
    for (const p of ['src/screens/settings/SettingsScreen.tsx', 'src/screens/dashboard/DashboardScreen.tsx']) {
      const s = read(p);
      assert.match(s, /flushScenarioQueue\(\), retryUnsentLabCredit\(\)\]\)/, `${p}: retries lab credit`);
      assert.match(s, /\+\n\s+unsentLabCreditCount\(\);/, `${p}: counts unsent lab credit`);
    }
  });
});
