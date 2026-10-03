/**
 * Pattern hunt phase 2, wave 3 — P8 "guest / preview / tier-unknown gating"
 * (docs/bughunt/PATTERN_CATALOG_2026_10_02.md, closer A5).
 *
 * The shared piece: features/commercial/tier.ts — the membership standing as
 * a TRI-STATE (`unknown | preview | guest | free | member`) plus the four
 * questions a screen asks of it (`persistAllowed`, `holdAllowed`,
 * `isGuestTier`, `upsellAllowed`), and `useTier()` for the live value. The
 * provider boots at 'anonymous', so a two-state `entitlement === 'anonymous'`
 * read "guest" for a member at every launch, and `if (isGuest) return;` read
 * "not a guest" for a real guest in the same window.
 *
 * Real bug fixed on the way (screens/lab/mixing/kit.tsx): the focal-point
 * choice and the mix-priorities toggle were gated on useLabEndGuest(), which
 * is FALSE while the tier is unknown — a tap before the first entitlement
 * read landed wrote a guest's choice to the device and edited the stored
 * priorities. Both are now session-only until a real account is known, and
 * the work is HELD by the shared ledger for the account it turns out to
 * belong to.
 *
 * R2: `tierOf` is new (the behavioural tests fail without the file); the
 * mixing receipts fail against the pre-change kit.tsx (`useLabEndGuest()` in
 * both hooks, no hold, no writers).
 *
 * The ratchet at the end: no NEW file may decide anything from a two-state
 * `entitlement === 'anonymous'` / `!== 'anonymous'` comparison. Every current
 * site is listed with why it is still allowed; the list may only SHRINK.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { holdAllowed, isGuestTier, persistAllowed, tierOf, upsellAllowed, type Tier } from '../src/features/commercial/tier.ts';

const SRC = fileURLToPath(new URL('../src', import.meta.url));
const read = (p: string) => readFileSync(join(SRC, p), 'utf8').replace(/\r\n/g, '\n');

// ── the shared piece ────────────────────────────────────────────────────────

describe('tierOf — the unknown window is neither a guest nor a member', () => {
  it('is unknown until the first read resolves, whatever the provisional entitlement says', () => {
    assert.equal(tierOf('anonymous', false), 'unknown');
    assert.equal(tierOf('academy', false), 'unknown', 'a cached member tier before the read is still unknown');
    assert.equal(tierOf('free', false), 'unknown');
    assert.equal(tierOf('lapsed', false), 'unknown');
  });
  it('maps the resolved entitlement: anonymous → guest, academy → member, free/lapsed → free', () => {
    assert.equal(tierOf('anonymous', true), 'guest');
    assert.equal(tierOf('academy', true), 'member');
    assert.equal(tierOf('free', true), 'free');
    assert.equal(tierOf('lapsed', true), 'free');
  });
  it('a members-only preview wins over everything (PREVIEW EARNS NOTHING)', () => {
    assert.equal(tierOf('free', true, true), 'preview');
    assert.equal(tierOf('anonymous', false, true), 'preview');
    assert.equal(tierOf('academy', true, true), 'preview');
  });
});

describe('the four questions', () => {
  const all: Tier[] = ['unknown', 'preview', 'guest', 'free', 'member'];
  it('persistAllowed: only a real account — never the unknown window, a guest or a preview', () => {
    assert.deepEqual(all.filter(persistAllowed), ['free', 'member']);
  });
  it('holdAllowed: the unknown window and a known guest hold their work; a preview holds nothing', () => {
    assert.deepEqual(all.filter(holdAllowed), ['unknown', 'guest']);
  });
  it('isGuestTier: KNOWN only — a signed-in learner is never told "nothing is saved" before the read lands', () => {
    assert.deepEqual(all.filter(isGuestTier), ['preview', 'guest']);
  });
  it('upsellAllowed: never to a member, never before the tier is known', () => {
    assert.deepEqual(all.filter((t) => upsellAllowed(t, true)), ['preview', 'guest', 'free']);
    // Final round A (2026-10-02): a read that never produced a tier allows none.
    // Hunt 5 (2026-10-03): except a REMEMBERED 'free' — the last tier the
    // server confirmed for this account, the same `known` rule as memberGateOf.
    assert.deepEqual(all.filter((t) => upsellAllowed(t, false)), ['free']);
  });
  it('every tier answers exactly one of persist / hold / drop', () => {
    for (const t of all) {
      const drop = t === 'preview';
      assert.equal(Number(persistAllowed(t)) + Number(holdAllowed(t)) + Number(drop), 1, t);
    }
  });
});

// ── the migrations (React Native — receipts by source) ──────────────────────

describe('useLabEndGuest is the tri-state', () => {
  const s = read('screens/lab/kit/LabEndScreen.tsx');
  it('reads isGuestTier(useTier()) and no longer compares the raw entitlement', () => {
    assert.match(s, /export function useLabEndGuest\(\): boolean \{\s*return isGuestTier\(useTier\(\)\);\s*\}/);
    assert.doesNotMatch(s, /entitlement === 'anonymous'/);
  });
  it('useTier folds the provider and the preview flag', () => {
    const h = read('features/commercial/useTier.ts');
    assert.match(h, /const \{ entitlement, resolved \} = useEntitlement\(\);/);
    assert.match(h, /const preview = useLabPreview\(\)\.active;/);
    assert.match(h, /return tierOf\(entitlement, resolved, preview\);/);
  });
});

describe('Mixing: a choice made before the tier is known is session-only and HELD', () => {
  const s = read('screens/lab/mixing/kit.tsx');
  it('both commitments gate on persistAllowed(useTier()), not on the two-state guest reading', () => {
    assert.equal((s.match(/guestRef\.current = !persistAllowed\(useTier\(\)\);/g) ?? []).length, 2);
    assert.doesNotMatch(s, /useLabEndGuest\(\)/, 'no call to the two-state guest reading');
  });
  it('the focal point: written for a real account, otherwise held for the ledger', () => {
    // 2026-10-03: a refusal now raises the shared failed-save notice.
    assert.match(s, /if \(!guestRef\.current\) void AsyncStorage\.setItem\(FOCAL_KEY, id\)\.catch\(armSaveFailureReport\(\)\);\s*else holdSessionWork<string>\(FOCAL_CARRY, \(\) => id\);/);
  });
  it('the priorities: the session list is held as a whole session copy that started empty', () => {
    const toggle = s.slice(s.indexOf('const toggle = useCallback((id: string) => {'));
    assert.match(toggle, /^const toggle = useCallback\(\(id: string\) => \{\s*if \(guestRef\.current\) \{[\s\S]*?holdSessionWork<readonly string\[\]>\(PRIORITIES_CARRY, \(\) => prioritiesSession \?\? \[\]\);\s*return;/);
  });
  it('the ledger has a writer for each, and the priorities writer merges stored-first under the cap of three', () => {
    assert.match(s, /registerSessionCarry<string>\(FOCAL_CARRY, async \(id\) => \{/);
    assert.match(s, /registerSessionCarry<readonly string\[\]>\(PRIORITIES_CARRY, async \(session\) => \{\s*const ok = await prioritiesStore\.mutate\(\(list\) => mergeMixPriorities\(list, session\)\);/);
    assert.match(s, /export function mergeMixPriorities\(stored: readonly string\[\], session: readonly string\[\]\): string\[\] \{\s*const out = \[\.\.\.stored\];\s*for \(const id of session\) if \(!out\.includes\(id\) && out\.length < 3\) out\.push\(id\);/);
  });
});

// ── the ratchet ─────────────────────────────────────────────────────────────

const TWO_STATE = /entitlement (?:===|!==) 'anonymous'/;

/** Every file that still compares the raw entitlement, with why it is still
 *  allowed. A NEW file fails. An entry whose file no longer matches fails too
 *  (remove it — the list may only shrink). Reasons use the house words:
 *  "resolved-gated" = the comparison is `resolved && …` on the same line;
 *  "tierKnown-gated" = an identity assertion gated on `tierKnown`. */
const STILL_TWO_STATE: Record<string, string> = {
  'features/commercial/tier.ts': 'the shared piece itself — tierOf is where the comparison belongs',
  'features/glossary/deviceKey.ts': 'a comment quoting the comparison; no decision',
  'features/glossary/deviceKeyState.ts': 'a doc comment on the isGuest input; the caller (GlossaryScreen) passes `resolved` alongside',
  'features/tools/telemetry.ts': 'telemetry only (an authed flag on events); nothing saved, charged or worded',
  'screens/achievements/CredentialWall.tsx': 'resolved-gated (`resolved && …`)',
  'screens/awards/AwardsScreen.tsx': 'resolved-gated on every site',
  'screens/commercial/PaywallScreen.tsx': 'behind a `!tierKnown` return / tierKnown-gated (a charged purchase: the strictest gate)',
  'screens/courses/CourseSelectionScreen.tsx': 'the dev-only commercial toggle seeding a tier; __DEV__ only',
  'screens/courses/StudyAreaExplore.tsx': 'resolved-gated',
  'screens/directory/DirectoryScreen.tsx': 'deliberately optimistic while unresolved (`!resolved || …`) plus an `accountConfirmed` that is resolved-gated',
  'screens/glossary/GlossaryScreen.tsx': 'the device-key input is passed with `resolved`; the charge is `resolved && !isMember`; capMode local is harmless before the read',
  'screens/lab/cable/CableLabScreen.tsx': 'resolved-gated noAccountRef (pinned by cableInstallComplete)',
  'screens/lab/cableinstall/CableInstallLabScreen.tsx': 'resolved-gated noAccountRef (pinned by cableInstallComplete)',
  'screens/lab/calc/CalcWorkspaceScreen.tsx': 'resolved-gated mustSignIn',
  'screens/lab/drumtuning/DrumTuningLabScreen.tsx': 'a comment describing the old bug; the screen uses useLabEndGuest',
  'screens/lab/foundations/FoundationsCourseScreen.tsx': 'resolved-gated noAccountRef',
  'screens/lab/kit/PagedLab.tsx': 'resolved-gated isGuest (pinned by navShellBugPass20261001; the load effect waits for resolved)',
  'screens/lab/micselect/MicSelectLabScreen.tsx': 'resolved-gated noAccountRef',
  'screens/lab/roomdesign/RoomDesignLabScreen.tsx': 'a comment describing the old bug; the screen uses useLabEndGuest',
  'screens/lab/soundsystems/SsPagedLab.tsx': 'resolved-gated isGuest (pinned by labsAFullRun2_20261001)',
  'screens/profile/ProfileScreen.tsx': 'tierKnown-gated (an identity assertion)',
  'screens/settings/SettingsScreen.tsx': 'every decision that asserts an identity is tierKnown-gated in place (2026-09-17); the plain isGuest only hides the Student ID row until known',
  'screens/startHere/StartHereScreen.tsx': 'resolved-gated noAccountRef (pinned by startHere)',
};

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

describe('RATCHET — no new two-state guest check in src/', () => {
  const hits = walk(SRC)
    .filter((p) => TWO_STATE.test(readFileSync(p, 'utf8')))
    .map((p) => relative(SRC, p).split(sep).join('/'))
    .sort();
  it('every file that compares the raw entitlement is on the allowlist with a reason (use useTier()/tierOf() instead)', () => {
    const fresh = hits.filter((f) => !(f in STILL_TWO_STATE));
    assert.deepEqual(fresh, [], `new two-state tier check(s): ${fresh.join(', ')} — decide from useTier() (features/commercial/useTier.ts)`);
  });
  it('the allowlist only shrinks: an entry whose file no longer compares the raw entitlement is removed', () => {
    const stale = Object.keys(STILL_TWO_STATE).filter((f) => !hits.includes(f));
    assert.deepEqual(stale, [], `remove from STILL_TWO_STATE: ${stale.join(', ')}`);
  });
  it('the lab end screen and the mixing kit stay on the tier (never back to a two-state read)', () => {
    for (const f of ['screens/lab/kit/LabEndScreen.tsx', 'screens/lab/mixing/kit.tsx']) {
      assert.ok(!hits.includes(f), `${f} compares the raw entitlement again`);
      assert.match(read(f), /useTier\(\)/, `${f} no longer reads useTier()`);
    }
  });
});
