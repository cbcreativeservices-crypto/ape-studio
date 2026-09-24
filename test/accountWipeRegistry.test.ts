/**
 * Every store that holds a user's data in memory must be in the account wipe.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * `clearLocalAccountData` has two halves: a sweep that deletes every `ape:*` key
 * from storage, and `resetAllLocalStores()`, which drops the matching in-memory
 * caches. The sweep is mechanical and cannot drift. The list is maintained by
 * hand, and it drifts constantly: bug-hunt pass 2 found 2 modules missing from
 * it, pass 3 found 9, and pass 4 found 3 more — after two rounds of people
 * specifically looking.
 *
 * What was missing was never trivial. A departing user's acceptance of the
 * hearing-damage warning stayed in memory, so the NEXT person got audio with no
 * warning and no acceptance record of their own. A running time trial kept
 * ticking through a sign-out and credited study work to whoever signed in next.
 * Low-Light Production Mode — which silences every auto-appearing notice in the
 * app — was inherited by someone who never switched it on.
 *
 * None of that is findable by eye, and nothing failed when a module was left
 * out. So the invariant is asserted here instead: a module that keeps
 * module-level state AND persists under `ape:` is either registered, or listed
 * below with a reason it does not need to be.
 *
 * The check is deliberately crude — it reads source text rather than types —
 * because a crude check that runs is worth more than a precise one that does
 * not, and the failure it prevents is silent cross-account data leakage.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../src', import.meta.url));
const REGISTRY = fileURLToPath(
  new URL('../src/features/account/clearLocalAccountData.ts', import.meta.url),
);

/**
 * Modules that hold state and storage but must NOT be reset on an account
 * change. Each needs a reason — if you are adding one to make this test pass,
 * the reason is the part that matters.
 */
const EXEMPT: Record<string, string> = {
  'screens/lab/rack/RackUnit.tsx':
    "the “hide the display” reading preference is device-level and is on the KEEP list for the same reason as showBigPicture and glossary autoOffline — it records no progress, no identity and no content, only how much room the lesson gets (tester report 2026-09-23)",
  'features/account/deviceIdentity.ts':
    'the install id is on the KEEP list by design — it identifies the DEVICE for single-device login, not the person',
  'features/tools/measure/calibrationStore.ts':
    'microphone calibration is device hardware (governance R1), not user data',
  'features/intro/onboardingFlow.ts':
    'first-use flags are device-level: a returning or guest user has already seen the tutorials (2026-08-13)',
  'features/lab/amplitudeOrientation.ts': 'same device-level first-use family as onboardingFlow',
  'features/onboarding/attractStore.ts': 'same device-level first-use family as onboardingFlow',
  'features/review/reviewPrompt.ts':
    'the store-review cooldown is per install — resetting it would let a sign-out re-ask',
  'features/notifications/localSchedule.ts':
    'the device schedule is rebuilt from server prefs by requestLocalNotifSync on every standing change',
  'features/finalExam/api.ts':
    'the exam queue deliberately SURVIVES a sign-out (rows carry their owner and replay checks it) — see the KEEP list',
  'features/production/projectStore.ts':
    'holds a lazily-built store instance, not user data — every read goes to storage',
  'features/cymatics/patternStore.ts': 'same: a store instance, not a cache of rows',
  'features/amp/ampProgress.ts': 'holds a write-queue promise, not user state',
  'screens/glossary/GlossaryScreen.tsx':
    'its module state is the shared glossary CATALOG cache plus a lazily-required component — reference data, identical for every user',
};

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

describe('the account wipe reaches every store that holds user state', () => {
  const registry = readFileSync(REGISTRY, 'utf8');
  const imported = new Set(
    [...registry.matchAll(/from '([^']+)'/g)].map((m) => m[1].split('/').pop() ?? ''),
  );

  /** Files that keep module-level mutable state AND persist under `ape:`. */
  const stateful = walk(SRC)
    .map((p) => ({ p, s: readFileSync(p, 'utf8') }))
    .filter(({ s }) => /^let\s+\w+/m.test(s) && /'ape:[\w:]+/.test(s))
    .map(({ p }) => relative(SRC, p).split(sep).join('/'));

  it('the scan actually found the stores', () => {
    // If the heuristics stop matching, everything below passes vacuously —
    // which would be worse than the drift, so assert the input first.
    assert.ok(stateful.length > 20, `expected many stateful modules, got ${stateful.length}`);
    assert.ok(imported.size > 15, `expected the registry's imports, got ${imported.size}`);
    assert.ok(
      stateful.includes('features/audio/soundSafetyAck.ts'),
      'the sound-safety record should be in the scanned set',
    );
  });

  it('EVERY stateful store is registered or exempt with a reason', () => {
    const missing: string[] = [];
    for (const rel of stateful) {
      if (EXEMPT[rel]) continue;
      const base = (rel.split('/').pop() ?? '').replace(/\.tsx?$/, '');
      if (!imported.has(base)) missing.push(rel);
    }
    assert.deepEqual(
      missing,
      [],
      'these keep user state in memory and are NOT reset on an account change.\n' +
        'Add a reset to resetAllLocalStores(), or add the file to EXEMPT with a reason:\n  ' +
        missing.join('\n  '),
    );
  });

  it('every EXEMPT entry still exists and still carries a reason', () => {
    // An exemption for a file that has moved is an exemption nobody is reading.
    for (const [rel, why] of Object.entries(EXEMPT)) {
      assert.ok(why.length > 20, `${rel} needs a real reason, not "${why}"`);
      assert.ok(
        stateful.includes(rel),
        `${rel} is exempt but no longer matches the scan — remove the exemption or fix the path`,
      );
    }
  });
});
