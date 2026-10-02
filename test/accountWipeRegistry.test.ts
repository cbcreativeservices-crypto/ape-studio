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
  'features/startHere/firstOpen.ts':
    'the "first app open" flag is DEVICE-level (owner 2026-09-29: Start Here is the landing only the first time the app is opened) — on the KEEP list, no identity, no progress, no content',
  'screens/lab/rack/RackUnit.tsx':
    "the “hide the display” reading preference is device-level and is on the KEEP list for the same reason as showBigPicture and glossary autoOffline — it records no progress, no identity and no content, only how much room the lesson gets (tester report 2026-09-23)",
  'screens/auth/AuthScreen.tsx':
    'autoGuestDoneThisLoad is a dev-only, web-preview-only "the boot auto-guest already ran" latch (owner 2026-09-29) — no identity, no progress, no content, and inert in release builds',
  'features/account/accountLocalSync.ts':
    'its module-level `chain` is the wipe queue itself (night bug pass 3, 2026-10-01) — a promise that orders the wipes, holding no user data; resetting it from inside a wipe would un-order them',
  'features/account/deviceIdentity.ts':
    'the install id is on the KEEP list by design — it identifies the DEVICE for single-device login, not the person',
  'features/intro/onboardingFlow.ts':
    'first-use flags are device-level: a returning or guest user has already seen the tutorials (2026-08-13)',
  'features/lab/amplitudeOrientation.ts': 'same device-level first-use family as onboardingFlow',
  'features/lab/calcUsage.ts':
    'the offline calculator meter (ape:calc:usageLocal) is on the KEEP list — a rate limit, not user memory (night bug pass 1, 2026-10-01); its in-memory `lastKnown` window and write chain (wave 2, 2026-10-02) must SURVIVE an account switch for the same reason, or a sign-out would hand out a fresh offline week',
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
  'features/amp/ampProgress.ts':
    'holds a write-queue promise and the guest save-block FLAG (bug hunt 2026-09-30 pass 2) — the flag is re-set from the live entitlement on every render of the lab’s screens; no user data',
  'screens/lab/mastering/masteringProgress.ts':
    'the ampProgress pattern (2026-10-01): holds a write-queue promise and the guest save-block FLAG, re-set from the live entitlement on every render of the lab screen — no user data; every read goes to storage (ape:mastering:v1 is inside the ape:* wipe)',
  'screens/lab/drumtuning/drumProgress.ts':
    'the same masteringProgress pattern (Drum Tuning Lab, 2026-10-01): a write-queue promise and the guest save-block FLAG only, re-set from the live entitlement on every render of the lab screen — no user data in memory; every read goes to storage (ape:drumtuning:v1, tuning notes included, is inside the ape:* wipe)',
  'features/ear/earProgress.ts':
    'holds only the guest save-block FLAG (bug hunt 2026-09-30 pass 2), re-set from the live entitlement on every render of the lab’s screens, and (2026-10-01) the ids of modules the sign-in hand-off wrote, each tagged with the sessionCarry epoch — any identity change bumps the epoch, so the tags go stale by themselves — no user data; every read goes to storage',
  'features/tuning/tuningProgress.ts':
    'holds the lab’s chapter COUNT (content, set when the screen module loads) and a storage-read-failed flag — no user data; a guest’s session work lives in the sessionCarry ledger, which drops itself on every identity change (owner ruling 2026-10-01)',
  'screens/lab/calc/workflowStore.ts':
    'holds only the write-serialisation promise chain (bug hunt 2026-09-29), not user state — every read goes to storage',
  'features/study/localProgress.ts':
    'holds only a count of wipes in flight (night bug pass 3, 2026-10-01) that fences mirror writes racing the wipe — no user data; every read goes to storage, and EntitlementProvider clears the ape:localMethod:* keys on an identity change',
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

  /** A store on the shared safe store (features/storage/localStore.ts)
   *  registers its reset with the wipe at creation — no import needed
   *  (2026-10-02, closer A2 / guard G2). */
  const onSafeStore = (rel: string) => /from '[^']*storage\/localStore'/.test(readFileSync(join(SRC, rel), 'utf8'));

  it('EVERY stateful store is registered or exempt with a reason', () => {
    const missing: string[] = [];
    for (const rel of stateful) {
      if (EXEMPT[rel]) continue;
      if (onSafeStore(rel)) continue;
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

/**
 * G2 (pattern catalog 2026-10-02): every exported `reset*` function in src/ is
 * REACHED by the account wipe — called from resetAllLocalStores (directly or
 * under an import alias), or a store on the shared safe store whose reset is
 * registered at creation — or listed here with the reason it must not be.
 *
 * The 2026-10-02 count: 48 exported reset* functions, 33 calls in the wipe.
 * The gap was not 7 unregistered stores: it was 18 named resets that are a
 * learner's own PRACTICE reset, a Settings action on device-level flags, a
 * session tally, or a cache — each with a verdict below — plus ONE real gap,
 * `resetTaxonomyCache`, whose own header said "account switch" and which
 * nothing called. It is registered now. This list may only shrink.
 */
const RESET_NOT_FOR_THE_WIPE: Record<string, string> = {
  'features/amp/ampProgress.ts#resetAmpProgress':
    "a learner's PRACTICE reset (keeps `done` and `bestFinal`, owner 2026-09-29); the module holds no user data in memory (see EXEMPT)",
  'features/careerfinder/store.ts#resetCareerFinder':
    "the learner's own retake (answers + results, saved families kept); the account switch goes through resetLocal, which the wipe calls",
  'features/enrollment/enrollmentStore.ts#resetEnrollment':
    "the learner's own 'back to the free topics' edit, a commit through the shared safe store; the account switch is the store's own registered reset",
  'features/glossary/glossaryGateway.ts#resetGatewayProbe':
    'the cached "is the gateway deployed" answer — a deployment fact, identical for every user; dropped by tests and after a schema change only',
  'features/intro/onboardingFlow.ts#resetOnboarding':
    'Settings → "Reset onboarding hints": device-level first-use flags that deliberately SURVIVE the wipe (isOnboardingFlag, 2026-08-13)',
  'features/intro/screenIntros.ts#resetScreenIntros': 'same Settings action, same device-level ape:intro:* family',
  'features/lab/amplitudeOrientation.ts#resetAmplitudeOrientation': 'same Settings action, same device-level first-use family',
  'lib/coachMark.ts#resetCoachMarks': 'same Settings action, the ape:coach:* retire counters (kept by the wipe since 2026-08-28)',
  'features/lab/pagedProgress.ts#resetPagedProgress':
    "a learner's PRACTICE reset of one paged lab's page marks (credit lives elsewhere); the keys are ape:* and swept, and the module keeps no cache of them",
  'features/permissions/permissionStore.ts#resetAskModes':
    'Settings → "Reset permission prompts" (a user action); the wipe calls resetAskModeCache for the in-memory consent cache',
  'features/settings/a11y.ts#resetA11y': "called by settings/store.ts resetLocal (resetSettingsMirrors), which the wipe calls — reached, one level down",
  'features/soundsystems/progress.ts#resetSoundSystemsProgress':
    "the learner's own hub RESET (practice); the account switch goes through resetLocal, which the wipe calls",
  'features/soundsystems/progress.ts#resetSoundSystemsLists': "one mode's in-lab RESET (practice); same resetLocal for the account switch",
  'features/study/paceStore.ts#resetBrainOutput':
    "zeroes one method's session tally when its pace session restarts; the wipe's paceStore resetLocal clears the whole brainCache",
  'features/tuning/tuningProgress.ts#resetTuningProgress':
    "a learner's PRACTICE reset (removes the swept ape:* key); the module keeps no user data in memory (see EXEMPT)",
  'screens/lab/drumtuning/drumProgress.ts#resetDrumPractice':
    "a learner's PRACTICE reset (`done` and the notes are kept); a write-queue module with no user data in memory (see EXEMPT)",
  'screens/lab/mastering/masteringProgress.ts#resetMasteringPractice':
    "a learner's PRACTICE reset (`done` is kept); a write-queue module with no user data in memory (see EXEMPT)",
  'features/auth/api.ts#resetPassword': 'not a store: an alias of requestPasswordReset (the account-recovery request)',
  'features/onboarding/attractStore.ts#resetLocal':
    'the Home attract cues are device-level first-use state the wipe deliberately keeps (owner ruling recorded in the file); the export stays for the day that ruling is reversed',
  'screens/lab/calc/workflowStore.ts#resetLocal': 'exported again as resetCalcWorkflowStore in the same file, which the wipe calls',
};

describe('G2: every exported reset* is reached by the account wipe, or says why not', () => {
  const registry = readFileSync(REGISTRY, 'utf8');
  const wipeBody = registry.slice(registry.indexOf('export function resetAllLocalStores'));
  const calledInWipe = new Set([...wipeBody.matchAll(/^\s*(?:void )?(\w+)\(/gm)].map((m) => m[1]));
  /** module path (relative to src, no extension) → { exported name → local alias } */
  const aliases = new Map<string, Map<string, string>>();
  for (const m of registry.matchAll(/import \{([^}]+)\} from '([^']+)'/g)) {
    const mod = join('features/account', m[2]).split(sep).join('/');
    const map = aliases.get(mod) ?? new Map<string, string>();
    for (const spec of m[1].split(',')) {
      const [name, alias] = spec.trim().split(/\s+as\s+/);
      if (name) map.set(name, alias ?? name);
    }
    aliases.set(mod, map);
  }

  const exported: { rel: string; name: string; body: string; safe: boolean }[] = [];
  for (const p of walk(SRC)) {
    const rel = relative(SRC, p).split(sep).join('/');
    if (rel === 'features/account/clearLocalAccountData.ts') continue;
    if (rel === 'features/storage/localStore.ts') continue; // the helper's doc comment shows a resetLocal example
    const s = readFileSync(p, 'utf8');
    const safe = /from '[^']*storage\/localStore'/.test(s);
    for (const m of s.matchAll(/export (?:async )?(?:function|const) (reset\w+)/g)) {
      const at = m.index ?? 0;
      const end = s.indexOf('\n}', at);
      exported.push({ rel, name: m[1], body: s.slice(at, end < 0 ? s.length : end), safe });
    }
  }

  it('the scan found the resets and the wipe', () => {
    assert.ok(exported.length > 40, `expected many reset* exports, got ${exported.length}`);
    assert.ok(calledInWipe.size > 25, `expected the wipe's calls, got ${calledInWipe.size}`);
    assert.ok(calledInWipe.has('resetRegisteredLocalStores'), 'the wipe must run the self-registered stores');
  });

  it('every reset* export is reached or listed with a reason', () => {
    const unreached: string[] = [];
    for (const { rel, name, body, safe } of exported) {
      const id = `${rel}#${name}`;
      if (RESET_NOT_FOR_THE_WIPE[id]) continue;
      const mod = rel.replace(/\.tsx?$/, '');
      const alias = aliases.get(mod)?.get(name);
      if (alias && calledInWipe.has(alias)) continue;
      if (safe && /\.reset\(\)/.test(body)) continue; // registered at creation
      unreached.push(id);
    }
    assert.deepEqual(
      unreached,
      [],
      'these reset* exports are never reached by resetAllLocalStores.\n' +
        'Register the store (or put it on createLocalStore), or add it to RESET_NOT_FOR_THE_WIPE with a reason:\n  ' +
        unreached.join('\n  '),
    );
  });

  it('the list only shrinks: every entry still exists and still is not reached', () => {
    for (const [id, why] of Object.entries(RESET_NOT_FOR_THE_WIPE)) {
      assert.ok(why.length > 20, `${id} needs a real reason`);
      const [rel, name] = id.split('#');
      const hit = exported.find((e) => e.rel === rel && e.name === name);
      assert.ok(hit, `${id} is listed but no longer exported — remove the entry`);
      const alias = aliases.get(rel.replace(/\.tsx?$/, ''))?.get(name);
      assert.ok(!(alias && calledInWipe.has(alias)), `${id} is now called by the wipe — remove the entry`);
    }
  });
});
