/**
 * SHARED area — evening toddler hunt, pass 2 (2026-10-02).
 *
 * labVisits and labCompletion are driven for real: AsyncStorage, React and
 * the heavy imports are stubbed, the store logic under test is the real code.
 * Each test names the scenario and FAILED against the code before its fix.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

type Deferred = { resolve: (v: string | null) => void; reject: (e: unknown) => void };
type FakeStorage = {
  data: Map<string, string>;
  /** When set, getItem waits for the test to answer it. */
  hold: boolean;
  /** When set, getItem throws. */
  fail: boolean;
  pending: Deferred[];
};
const g = globalThis as Record<string, unknown>;
const AS: FakeStorage = { data: new Map(), hold: false, fail: false, pending: [] };
g.__E2_AS__ = AS;

const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const STUBS: Record<string, string> = {
  react: mod(`export function useState(v) { return [typeof v === 'function' ? v() : v, () => {}]; } export function useEffect(f) { f(); }`),
  '@react-native-async-storage/async-storage': mod(`
    const s = globalThis.__E2_AS__;
    export default {
      getItem(k) {
        if (s.fail) return Promise.reject(new Error('read failed'));
        if (s.hold) return new Promise((resolve, reject) => s.pending.push({ resolve: () => resolve(s.data.get(k) ?? null), reject }));
        return Promise.resolve(s.data.get(k) ?? null);
      },
      setItem(k, v) { s.data.set(k, v); return Promise.resolve(); },
    };
  `),
  './labPreviewStore': mod(`export function getLabPreview() { return { active: false }; } export function useLabPreview() { return { active: false }; }`),
  '../../lib/supabase': mod(`export const supabase = { rpc: async () => ({ data: null, error: { message: 'stub' } }) };`),
  '../study/sync': mod(`export function emitStudyProgress() {}`),
  '../review/reviewPrompt': mod(`export async function noteHighValueEvent() {}`),
  '../../screens/lab/wave/modules/registry': mod(`export const WAVE_MODULES = [];`),
  '../../screens/lab/digital/modules/registry': mod(`export const DIGITAL_MODULES = [];`),
  '../../screens/lab/meter/modules/registry': mod(`export const METER_MODULES = [];`),
  '../../screens/lab/gain/modules/registry': mod(`export const GAIN_MODULES = [];`),
  '../../screens/lab/cable/data/lessons': mod(`export const CABLE_UNITS = [];`),
  '../../screens/lab/cableinstall/registry': mod(`export const CI_LAB_UNITS = [];`),
  '../../screens/lab/patchbay/units': mod(`export const PATCHBAY_UNITS = [];`),
  '../../screens/lab/connectorselect/units': mod(`export const CONNECTOR_SELECT_UNITS = [];`),
  '../../screens/lab/foundations/units': mod(`export const FOUNDATIONS_UNITS = [];`),
  '../../screens/lab/micspeaker/units': mod(`export const MIC_PRINCIPLES_UNITS = []; export const SPEAKER_COVERAGE_UNITS = [];`),
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    const parent = context.parentURL ?? '';
    if (STUBS[specifier] && /features\/lab\/(labVisits|labCompletion|sessionCarry)\.ts(\?.*)?$/.test(parent)) {
      return { url: STUBS[specifier], shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', parent);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
  await new Promise<void>((r) => setImmediate(r));
};

// labCompletion warms its read at import: let that one land on an empty disk.
const visitsMod = await import('../src/features/lab/labVisits.ts');
const completionMod = await import('../src/features/lab/labCompletion.ts');
await flush();

test('labVisits: a device read still out when the account wipe runs does not hand the departing account’s visits to the next one', async () => {
  // The departing account's visits are on disk; this store has not read yet.
  AS.data.set('ape:labVisits', JSON.stringify({ lab_a: ['u1', 'u2'] }));
  AS.hold = true;
  const before = visitsMod.useLabVisits('lab_a'); // starts the read
  assert.equal(before.size, 0);
  assert.equal(AS.pending.length, 1, 'the read is out');
  // Sign-out / account switch: the sweep removes the key, then the reset.
  AS.data.delete('ape:labVisits');
  visitsMod.resetLocal();
  // The read issued before the sweep now answers with the OLD account's blob.
  AS.data.set('ape:labVisits', JSON.stringify({ lab_a: ['u1', 'u2'] }));
  AS.pending.shift()!.resolve(null);
  AS.data.delete('ape:labVisits');
  AS.hold = false;
  await flush();
  // The next account opens a unit: what is shown and written is theirs alone.
  visitsMod.markLabVisit('lab_a', 'u9');
  await flush();
  const shown = visitsMod.useLabVisits('lab_a');
  assert.deepEqual([...shown].sort(), ['u9'], 'the departing account’s visits leaked into the next account');
  assert.deepEqual(JSON.parse(AS.data.get('ape:labVisits') ?? '{}'), { lab_a: ['u9'] });
  visitsMod.resetLocal();
  AS.data.clear();
});

test('labVisits: a visit recorded while the device read failed is written once a later read succeeds (it was lost at the next launch)', async () => {
  AS.data.clear();
  AS.data.set('ape:labVisits', JSON.stringify({ lab_b: ['stored'] }));
  // A fresh, unhydrated module instance (the shared one is hydrated already).
  const fresh = await import('../src/features/lab/labVisits.ts?fresh=1' as string);
  AS.fail = true;
  fresh.markLabVisit('lab_b', 'new');
  await flush();
  AS.fail = false;
  assert.deepEqual(JSON.parse(AS.data.get('ape:labVisits')!), { lab_b: ['stored'] }, 'nothing written over a copy that could not be read');
  // A later screen mounts: the read succeeds and merges. No new unit follows.
  fresh.useLabVisits('lab_b');
  await flush();
  const disk = JSON.parse(AS.data.get('ape:labVisits')!) as Record<string, string[]>;
  assert.deepEqual([...disk.lab_b].sort(), ['new', 'stored'], 'the visit the screen showed was never written');
  AS.data.clear();
});

test('labCompletion: a unit recorded while the device read failed is written once a later read succeeds', async () => {
  AS.data.clear();
  // A fresh module: unhydrated, and its boot read FAILS.
  AS.fail = true;
  const fresh = await import('../src/features/lab/labCompletion.ts?fresh=1' as string);
  fresh.markLabUnit('af_some_lab', 'unit-1');
  await flush();
  assert.equal(AS.data.get('ape:labProgress'), undefined, 'nothing written over a copy that could not be read');
  AS.fail = false;
  AS.data.set('ape:labProgress', JSON.stringify({ units: { af_other: ['x'] }, sent: [], af: false }));
  // A screen mounts later; the read succeeds and merges. No new unit follows.
  fresh.useLabDone('af_some_lab');
  await flush();
  const disk = JSON.parse(AS.data.get('ape:labProgress')!) as { units: Record<string, string[]> };
  assert.deepEqual(disk.units.af_some_lab, ['unit-1'], 'the unit the screen showed as cleared was never written');
  assert.deepEqual(disk.units.af_other, ['x'], 'what was stored survives the merge');
  AS.data.clear();
  void completionMod;
});
