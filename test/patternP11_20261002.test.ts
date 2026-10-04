/**
 * Pattern hunt P11 (catalog 2026-10-02) — setState / present / play for a
 * component that is gone, and (with P2) a load that lands for a key that is no
 * longer current.
 *
 * RATCHET: every file with an async effect (`useEffect` / `useFocusEffect`
 * whose body awaits, `.then(`s or runs an async IIFE) carries a recognised
 * guard — an alive/cancelled flag, a mounted ref, a request ticket/sequence,
 * a generation, an AbortSignal — or is listed below with why it needs none.
 * The list may only shrink.
 *
 * Fixed 2026-10-02 (pins in patternP2_20261002): TrophyScreen,
 * CalcWorkflowEditScreen, StudyFsOverlay, TopicsScreen, CalcProjectsScreen,
 * usePatterns, labCompletion, labVisits; EarModuleScreen's clip-end timer
 * (patternP10_20261002).
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const ROOT = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');
function srcFiles(dir = 'src'): string[] {
  const out: string[] = [];
  for (const name of readdirSync(new URL(dir, ROOT))) {
    const rel = join(dir, name).replace(/\\/g, '/');
    if (statSync(new URL(rel, ROOT)).isDirectory()) out.push(...srcFiles(rel));
    else if (/\.tsx?$/.test(name)) out.push(rel);
  }
  return out;
}
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const ASYNC_EFFECT = /use(?:Focus)?Effect\(\s*(?:useCallback\(\s*)?\(\)\s*=>\s*\{[\s\S]{0,400}?(?:void\s*\(?async|\.then\(|await\s)/;
const GUARD =
  /\b(?:cancelled|canceled|mountedRef|isMounted|alive|aliveRef|live|disposed|ticket|generation|stale|aborted|seqRef|reqId|latestRef)\b|gen !==|Token\b|TokenRef|signal|latest\.current|\w*Req\.current|\w*Seq\.current/;

/** Unguarded async effects, each checked by hand 2026-10-02. */
const NEEDS_NO_GUARD: Record<string, string> = {
  'src/features/account/SessionExpiryGuard.tsx': 'app-lifetime component; the read only writes a ref',
  'src/features/dev/popupSuppressStore.ts': '[]-deps subscribe hook: the late hydrate re-reads module state (always current); no key to go stale',
  'src/features/intro/onboardingFlow.ts': '[]-deps subscribe hook: the late hydrate re-reads module state; no key to go stale',
  'src/features/lab/amplitudeOrientation.ts': '[]-deps subscribe hook: the late hydrate re-reads module state; no key to go stale',
  'src/features/onboarding/attractStore.ts': '[]-deps subscribe hooks: the late hydrate re-reads module state; no key to go stale',
  'src/features/tools/telemetry.ts': 'fire-and-forget usage RPC from the unmount cleanup; touches no state',
  'src/features/tools/withKeepAwake.tsx': 'native keep-awake activate; the cleanup deactivates the same tag',
  'src/lib/coachMark.ts': 'one-shot read latched by started.current; writes refs and one setVisible',
  'src/screens/auth/AuthScreen.tsx': 'dev-only web preview auto-guest, once per page load',
  'src/screens/lab/cable/CableLabScreen.tsx': 'once per mount (resolved flips once); navigatedRef stops a late restore over a tap',
  'src/screens/lab/micselect/MicSelectLabScreen.tsx': 'once per mount (resolved flips once); navigatedRef stops a late restore over a tap',
};

test('ratchet: no NEW unguarded async effect anywhere in src/', () => {
  const found = srcFiles()
    .map((f) => ({ f, s: code(read(f)) }))
    .filter(({ s }) => ASYNC_EFFECT.test(s) && !GUARD.test(s))
    .map(({ f }) => f);
  const unexpected = found.filter((f) => !NEEDS_NO_GUARD[f]);
  assert.deepEqual(unexpected, [], 'an async effect that can land after unmount or after its key changed — add an alive flag / request ticket, or justify it in NEEDS_NO_GUARD');
  assert.deepEqual(Object.keys(NEEDS_NO_GUARD).filter((f) => !found.includes(f)), [], 'remove stale NEEDS_NO_GUARD entries');
});

test('the signature sees the shapes it is meant to', () => {
  assert.match('useEffect(() => {\n  void load().then(setX);\n}, [id]);', ASYNC_EFFECT);
  assert.match('useFocusEffect(\n  useCallback(() => {\n    fetchIt().then((r) => setR(r));\n  }, []),\n);', ASYNC_EFFECT);
  assert.doesNotMatch('let alive = true;', /x^/);
  assert.match('const my = ++loadSeq.current;', GUARD);
});
