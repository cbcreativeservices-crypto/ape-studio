/**
 * My Progress LABS on a new phone (bug test 2026-11-05, decision item 4). The
 * device holds nothing there until the server's lab record comes back, and the
 * screens said "Your completed labs will appear here" while that read was out
 * or had failed. Three faces: loading while it is out, unreadable with a retry
 * when it failed, truly empty only once it answered (or for a known guest).
 *
 * (A) labCompletion, run with stubbed storage and server.
 * (B) the face picker, real code with the store stubbed.
 * (C) source: the stall bound and the Retry wiring.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

type Answer = { data: unknown; error: unknown };
type Net = { calls: number; next: () => Promise<Answer> };
const net: Net = { calls: 0, next: async () => ({ data: [], error: null }) };
(globalThis as unknown as { __lrNet: Net }).__lrNet = net;
(globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;

const STUBS: Record<string, string> = {
  'async-storage': `const m = new Map(); export default {
    getItem: async (k) => (m.has(k) ? m.get(k) : null),
    setItem: async (k, v) => { m.set(k, v); },
    removeItem: async (k) => { m.delete(k); },
    multiGet: async (ks) => ks.map((k) => [k, m.has(k) ? m.get(k) : null]),
    multiSet: async (rows) => { for (const [k, v] of rows) m.set(k, v); },
    multiRemove: async (ks) => { for (const k of ks) m.delete(k); },
    getAllKeys: async () => [...m.keys()],
  };`,
  supabase: `const n = globalThis.__lrNet; export const supabase = {
    rpc: async () => ({ data: null, error: { message: 'stub' } }),
    from: () => ({ select: () => { n.calls++; return n.next(); } }),
  };`,
  sync: `export const emitStudyProgress = () => {};`,
  reviewPrompt: `export const noteHighValueEvent = async () => {};`,
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'lr-stub:async-storage', shortCircuit: true };
    if (/\/lib\/supabase$/.test(specifier)) return { url: 'lr-stub:supabase', shortCircuit: true };
    if (/\/study\/sync$/.test(specifier)) return { url: 'lr-stub:sync', shortCircuit: true };
    if (/\/review\/reviewPrompt$/.test(specifier)) return { url: 'lr-stub:reviewPrompt', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      for (const ext of ['.ts', '.tsx', '/index.ts']) {
        const candidate = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith('lr-stub:')) return { format: 'module', shortCircuit: true, source: STUBS[url.slice('lr-stub:'.length)] };
    return nextLoad(url, context);
  },
});

const carry = await import('../src/features/lab/sessionCarry.ts');
const lc = await import('../src/features/lab/labCompletion.ts');
const { completedLabsFace } = await import('../src/features/lab/completedLabs.ts');

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('the server read says how it went', () => {
  it('an unknown session is pending, never a guest (D57)', () => {
    assert.equal(lc.labServerCreditRead(), 'pending');
  });

  it('a failed read is failed, Retry shares one read and a good answer lands', async () => {
    let answer!: (a: Answer) => void;
    net.next = () => new Promise((r) => (answer = r));
    carry.noteSessionIdentity('user-a');
    assert.equal(lc.labServerCreditRead(), 'pending', 'wipe not finished yet');
    await carry.settleSessionCarry();
    await tick();
    assert.equal(net.calls, 1);
    assert.equal(lc.labServerCreditRead(), 'pending', 'still out');
    answer({ data: null, error: { message: 'offline' } });
    await tick();
    assert.equal(lc.labServerCreditRead(), 'failed');
    assert.equal(lc.isLabDone('af_cables'), false);

    // Two surfaces asking at once send one read, and the retry reads as loading.
    const first = lc.retryLabServerCredit();
    const second = lc.retryLabServerCredit();
    await tick();
    assert.equal(net.calls, 2);
    assert.equal(lc.labServerCreditRead(), 'pending');
    answer({ data: [{ labs: { key: 'af_cables' } }], error: null });
    await Promise.all([first, second]);
    await tick();
    assert.equal(lc.labServerCreditRead(), 'read');
    assert.equal(lc.isLabDone('af_cables'), true);
  });

  it('a thrown read is failed too', async () => {
    lc.resetLocal();
    net.next = async () => {
      throw new Error('network');
    };
    await lc.retryLabServerCredit();
    assert.equal(lc.labServerCreditRead(), 'failed');
  });

  it('a later failed re-read does not undo a record already read', async () => {
    lc.resetLocal();
    net.next = async () => ({ data: [], error: null });
    await lc.retryLabServerCredit();
    assert.equal(lc.labServerCreditRead(), 'read');
    net.next = async () => ({ data: null, error: { message: 'offline' } });
    await lc.retryLabServerCredit();
    assert.equal(lc.labServerCreditRead(), 'read');
  });

  it('a read left over from the departing account changes nothing', async () => {
    lc.resetLocal();
    let answer!: (a: Answer) => void;
    net.next = () => new Promise((r) => (answer = r));
    const out = lc.retryLabServerCredit();
    await tick();
    lc.resetLocal();
    assert.equal(lc.labServerCreditRead(), 'pending');
    answer({ data: [{ labs: { key: 'af_cables' } }], error: null });
    await out;
    assert.equal(lc.labServerCreditRead(), 'pending');
    assert.equal(lc.isLabDone('af_cables'), false);
  });

  it('a known guest has no server record to wait for', async () => {
    carry.noteSessionIdentity('');
    await carry.settleSessionCarry();
    assert.equal(lc.labServerCreditRead(), 'none');
    const calls = net.calls;
    await lc.retryLabServerCredit();
    assert.equal(net.calls, calls, 'a guest sends no read');
  });
});

describe('the face', () => {
  const lab = { key: 'af_cables', name: 'Cables', section: 'fundamentals', route: 'X' } as never;

  it('an empty list is empty only once the server answered, or for a guest', () => {
    assert.equal(completedLabsFace(false, true, [], 'pending').status, 'loading');
    assert.equal(completedLabsFace(false, true, [], 'failed').status, 'unreadable');
    assert.deepEqual(completedLabsFace(false, true, [], 'read'), { status: 'ready', labs: [] });
    assert.deepEqual(completedLabsFace(false, true, [], 'none'), { status: 'ready', labs: [] });
  });

  it('labs the device knows are shown while the server read is out or failed', () => {
    assert.equal(completedLabsFace(false, true, [lab], 'pending').status, 'ready');
    assert.equal(completedLabsFace(false, true, [lab], 'failed').status, 'ready');
  });

  it('a failed device read still beats everything', () => {
    assert.equal(completedLabsFace(true, true, [lab], 'read').status, 'unreadable');
    assert.equal(completedLabsFace(false, false, [], 'read').status, 'loading');
  });
});

describe('the wiring', () => {
  const src = read('src/features/lab/completedLabs.ts');

  it('Retry reads the server record again, not only the device', () => {
    assert.match(src, /void retryLabServerCredit\(\);/);
  });

  it('loading always ends: a stalled read becomes failed, past the client budget', () => {
    const budget = read('src/lib/boundedCall.ts').match(/FETCH_DEADLINE_MS = (\d+)/);
    const stall = src.match(/SERVER_READ_STALL_MS = (\d+)/);
    assert.ok(budget && stall);
    assert.ok(Number(stall[1]) > Number(budget[1]));
    assert.match(src, /stalled \? 'failed' : server/);
  });

  it('the list no longer blames this device', () => {
    assert.doesNotMatch(read('src/screens/achievements/LabsProgressScreen.tsx'), /lab record on this device/);
  });
});
