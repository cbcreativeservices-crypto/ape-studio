/**
 * Glossary — full-app bug run 1, 2026-10-01.
 *
 *  1. probeGateway() caches its promise for the whole app session and was
 *     unbounded: a stalled probe (Android RN fetch has no timeout) never
 *     settled and never cleared, so every Glossary visit sat 'unknown' and every
 *     lab/calculator term popup that awaits it span forever. Bounded now; a
 *     stall reads as a transient fault (not cached).
 *  2. mintDeviceKey() runs through singleFlight, which hands every caller the
 *     same in-flight promise: a stalled sign-in poisoned AGREE, the renewal and
 *     every later visit for the session. Bounded; a stall settles as 'network'.
 *  3. The 5-minute background release reloads fresh entries (blank definitions)
 *     under a still-mounted Glossary, but the "already requested" id set was
 *     only reset on a table change — every term already scrolled past rendered
 *     an empty definition for the rest of the visit.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8');

test('the gateway probe is bounded and a stall is not cached', () => {
  const src = read('src/features/glossary/glossaryGateway.ts');
  const body = src.slice(src.indexOf('export function probeGateway'), src.indexOf('export function corpusTable'));
  assert.match(body, /await softDeadline</, 'the probe read must race a deadline');
  assert.match(body, /\{ error: \{ message: 'gateway probe timeout' \} \}/);
  // The timeout message classifies as a transient fault, which resets PROBE.
  assert.match(body, /PROBE = null; \/\/ transient/);
  assert.match(src, /const PROBE_DEADLINE_MS = \d+;/);
});

test('minting the device key is bounded inside the single-flight slot', () => {
  const src = read('src/features/glossary/deviceKey.ts');
  assert.match(src, /import \{ softDeadline \} from '\.\.\/\.\.\/lib\/boundedCall';/);
  assert.match(
    src,
    /return mintOnce\(\(\) =>\s*softDeadline<MintResult>\(\s*mintNow,\s*\{ ok: false, reason: 'network', message: 'device key mint timeout' \}/,
  );
});

test('a reloaded corpus forgets which definitions were already requested', () => {
  const src = read('src/screens/glossary/GlossaryScreen.tsx');
  assert.match(src, /requestedDefsRef\.current = new Set\(\);\s*\}, \[table, entries\]\);/);
  // The reset must run BEFORE the defTier effect, whose defRev bump on an
  // entries change is what re-renders the rows so they queue again.
  const reset = src.indexOf('}, [table, entries]);');
  const tierEffect = src.indexOf('}, [defTier, entries, readerUid]);');
  assert.ok(reset > 0 && tierEffect > reset, 'reset effect must precede the defTier effect');
  const tierBody = src.slice(src.lastIndexOf('useEffect(() => {', tierEffect), tierEffect);
  assert.match(tierBody, /setDefRev\(\(n\) => n \+ 1\);\s*\/\/ popupTrail/);
});
