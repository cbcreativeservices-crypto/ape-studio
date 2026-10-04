/**
 * SHARED, hunt 12 (2026-10-04).
 *
 * 1. labCompletion: a unit recorded while the device read was still out when
 *    the account wipe ran was added to the NEXT account's units (and a lab it
 *    completed fired mark_lab_complete for them). recordUnit is now fenced by
 *    the wipe generation, like the read, persist() and fireComplete.
 * 2. LabUnderstandingCheck: `passed` was read once, at mount. The completion
 *    store and paged progress load asynchronously, so a check passed on an
 *    earlier visit could read "answer all N" for the whole visit. It now
 *    follows `passed` turning true.
 *
 * R2: against HEAD's labCompletion.ts / LabUnderstandingCheck.tsx both tests
 * fail.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

type Deferred = { resolve: (v: string | null) => void; reject: (e: unknown) => void };
const g = globalThis as Record<string, unknown>;
const AS = { data: new Map<string, string>(), hold: false, fail: false, pending: [] as Deferred[] };
g.__SH12_AS__ = AS;

const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const STUBS: Record<string, string> = {
  react: mod(`export function useState(v) { return [typeof v === 'function' ? v() : v, () => {}]; } export function useEffect(f) { f(); }`),
  '@react-native-async-storage/async-storage': mod(`
    const s = globalThis.__SH12_AS__;
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
  '../../lib/supabase': mod(`export const supabase = { rpc: async () => { globalThis.__SH12_RPC__ = (globalThis.__SH12_RPC__ ?? 0) + 1; return { data: null, error: { message: 'stub' } }; } };`),
  '../study/sync': mod(`export function emitStudyProgress() {}`),
  '../review/reviewPrompt': mod(`export async function noteHighValueEvent() {}`),
  '../storage/saveFailureNotice': mod(`export function reportUnhandledSaveFailure() {} export function armSaveFailureReport() { return () => {}; }`),
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
    if (STUBS[specifier] && /features\/lab\/(labCompletion|sessionCarry)\.ts(\?.*)?$/.test(parent)) {
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

test('labCompletion: a unit whose read was out when the account wipe ran never lands in the next account', async () => {
  // Boot read FAILS: the store stays unhydrated, so the next unit starts a read.
  AS.fail = true;
  const lc = await import('../src/features/lab/labCompletion.ts');
  await flush();
  AS.fail = false;
  // The departing account reviews a lab; the read that unit waits on is slow.
  AS.hold = true;
  lc.registerLabUnits('af_amplitude', ['reviewed']);
  await flush();
  // registerLabUnits started the read; answer it later.
  lc.markLabReviewed('af_amplitude');
  await flush();
  assert.ok(AS.pending.length >= 1, 'the read is out');
  // Sign-out / account switch: the sweep, then the store reset.
  lc.resetLocal();
  const rpcBefore = (g.__SH12_RPC__ as number | undefined) ?? 0;
  // The read issued before the wipe answers now.
  while (AS.pending.length) AS.pending.shift()!.resolve(null);
  AS.hold = false;
  await flush();
  const shown = lc.useLabClearedUnits('af_amplitude');
  assert.deepEqual([...shown], [], 'the departing account’s unit was recorded under the next account');
  assert.equal(lc.isLabComplete('af_amplitude'), false);
  assert.equal((g.__SH12_RPC__ as number | undefined) ?? 0, rpcBefore, 'mark_lab_complete fired for the next account');
  // The next account's own unit still records.
  lc.markLabReviewed('af_amplitude');
  await flush();
  assert.equal(lc.isLabComplete('af_amplitude'), true);
});

test('LabUnderstandingCheck follows `passed` turning true after mount', () => {
  const src = readFileSync(new URL('../src/components/LabUnderstandingCheck.tsx', import.meta.url), 'utf8');
  const effect = /useEffect\(\(\) => \{\s*if \(!passed\) return;[\s\S]*?setCorrect\([\s\S]*?setFired\(true\);\s*\}, \[passed, questions\]\);/;
  assert.match(src, effect, 'a check passed on an earlier visit reads unpassed when `passed` arrives after mount');
});
