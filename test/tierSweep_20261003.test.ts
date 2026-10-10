/**
 * TIER SWEEP (2026-10-03) — one app-wide consistency fix.
 *
 * Owner rulings 2026-10-03: "if it fails the user needs to know" and "once it
 * fails it should know and stop checking"; standing rules: no upsell / "free"
 * copy and never a 🔒 to a member; "favor consistency".
 *
 * The bug class: a SIGNED-IN learner (a paying member included) with no
 * remembered tier whose membership read FAILED gets `resolved: true`,
 * `entitlement: 'anonymous'`, `tierKnown: false` (then `tierReadFailed`).
 * Every screen that judged on `resolved` alone told them they were a guest
 * ("not signed in", "won't be saved without an account"), locked them out
 * with a 🔒, or sold them the membership they hold. Now the guest wording,
 * the locks and the upsell need a KNOWN tier; while the provider retries the
 * screen is neutral, and once it gives up it says "Couldn't confirm your
 * membership on this phone…". Nothing is UNLOCKED on a failed read.
 *
 * The shared pieces (features/commercial/tier.ts + useTier.ts):
 *   memberGateOf / useMemberGate  — 'open' | 'locked' | 'checking' | 'unconfirmed'
 *   guestWordingAllowed / useGuestWording — the ONE guest-wording rule (labs'
 *     end screen + Start Here); the labs' hold / block rule is untouched.
 *
 * R2: every test below FAILED against the pre-sweep files (each copied aside,
 * the HEAD version put in place, the suite run, the edited copy restored).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

// Imported as a namespace (not named bindings) so that, on the pre-sweep
// files, the missing helpers fail THEIR tests instead of the whole file.
const tierMod = (await import('../src/features/commercial/tier.ts')) as Record<string, (...a: never[]) => unknown>;
const { tierOf, upsellAllowed } = tierMod as unknown as typeof import('../src/features/commercial/tier.ts');
const memberGateOf = (...a: unknown[]) => (tierMod.memberGateOf as (...x: unknown[]) => unknown)(...a);
const guestWordingAllowed = (...a: unknown[]) => (tierMod.guestWordingAllowed as (...x: unknown[]) => unknown)(...a);
const { endLead, whatsLeft } = await import('../src/screens/lab/kit/labEnd.ts');

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const NC = 'Couldn’t confirm your membership on this phone. Check your connection and reopen the app.';

// The failed-read learner as the provider reports them.
const FAILED = { tier: tierOf('anonymous', true), tierKnown: false };

describe('the shared rule (pure)', () => {
  it('a failed read is never a locked non-member, never a guest to talk to, never sold to', () => {
    assert.equal(FAILED.tier, 'guest', 'precondition: the resolved-based tier calls them a guest');
    assert.equal(memberGateOf(FAILED.tier, false, false), 'checking');
    assert.equal(memberGateOf(FAILED.tier, false, true), 'unconfirmed');
    assert.equal(guestWordingAllowed(FAILED.tier, false), false);
    assert.equal(upsellAllowed(FAILED.tier, false), false);
  });
  it('known answers keep their old meaning', () => {
    assert.equal(memberGateOf('member', false, false), 'open');
    assert.equal(memberGateOf('unknown', false, false), 'checking');
    assert.equal(memberGateOf('guest', true, false), 'locked'); // a real guest is always KNOWN
    assert.equal(memberGateOf('free', false, false), 'locked'); // a remembered free tier
    assert.equal(memberGateOf('free', true, true), 'locked');
    assert.equal(guestWordingAllowed('guest', true), true);
    assert.equal(guestWordingAllowed('preview', false), true);
    assert.equal(guestWordingAllowed('unknown', false), false);
    assert.equal(guestWordingAllowed('free', true), false);
  });
  it('the end-screen lead for an unconfirmed learner: neither "not signed in" nor "saved"', () => {
    const units = [
      { id: 'a', label: 'A', num: 1 },
      { id: 'b', label: 'B', num: 2 },
    ];
    const w = whatsLeft(units as never, new Set(['a']));
    const un = endLead(w, { mode: 'credit', noun: 'module', account: 'unconfirmed' } as never);
    assert.ok(un.includes(NC), un);
    assert.doesNotMatch(un, /not signed in|is saved/);
    const ch = endLead(w, { mode: 'credit', noun: 'module', account: 'checking' } as never);
    assert.match(ch, /Still checking your account\./);
    assert.doesNotMatch(ch, /not signed in|is saved/);
    // A KNOWN guest still hears the house guest line.
    assert.match(endLead(w, { mode: 'credit', noun: 'module', guest: true, account: 'unconfirmed' } as never), /not signed in/);
  });
});

describe('1. Awards — "won\'t be saved without an account" needs a KNOWN guest', () => {
  const s = read('src/screens/awards/AwardsScreen.tsx');
  it('both prompts read knownGuest', () => {
    assert.match(s, /const knownGuest = tierKnown && entitlement === 'anonymous';/);
    assert.equal((s.match(/if \(knownGuest\) setPayPrompt\(/g) ?? []).length, 2);
    assert.doesNotMatch(s, /resolved && entitlement === 'anonymous'\) setPayPrompt/);
  });
});

describe('2. Home + Curriculum — upsell only via useUpsellAllowed', () => {
  const home = read('src/screens/courses/CourseSelectionScreen.tsx');
  const cur = read('src/screens/curriculum/CurriculumScreen.tsx');
  it('Home: Membership link, eyebrows and the 🔒 ACADEMY MODE cards', () => {
    assert.match(home, /\{upsell \? \(\s*<Pressable\s*style=\{\[styles\.membershipBtn/);
    assert.doesNotMatch(home, /resolved && !isMember/);
    assert.equal((home.match(/upsell \? '🔒 ACADEMY MODE' : 'COMING SOON'/g) ?? []).length, 2, 'stub + coming topic cards');
    assert.doesNotMatch(home, /isMember \? 'COMING SOON' : '🔒 ACADEMY MODE'/);
  });
  it('Curriculum: Membership link, the FREE eyebrow and the a11y "Free,"', () => {
    assert.match(cur, /const upsell = useUpsellAllowed\(\);/);
    assert.doesNotMatch(cur, /tierResolved && !isMember|isMember \? '' : 'Free, '/);
    // Owner 2026-10-10: the Career Finder has its own Home card, so Explore
    // no longer carries the green Career Finder bar or its popup.
    assert.doesNotMatch(cur, /features\/careerfinder|finderContainer|setShowFinder|navigate\(finder/);
  });
});

describe('3. Calculator workflows — honest words, never the sell, on a failed read', () => {
  it('My Workflows: guardSave and the empty caption', () => {
    const s = read('src/screens/lab/calc/CalcWorkflowsScreen.tsx');
    assert.match(s, /const tierUnconfirmed = tier === 'guest' && !tierKnown;/);
    const guard = s.slice(s.indexOf('const guardSave = '), s.indexOf('const onNew = '));
    const unconf = guard.indexOf('if (tierUnconfirmed) {');
    assert.ok(unconf > 0 && unconf < guard.indexOf('confirmDialog('), 'checked before the membership dialog');
    assert.ok(guard.includes(NC));
    const cap = s.slice(s.indexOf('{mine.length === 0 ? ('), s.indexOf('WORKFLOW TEMPLATES'));
    assert.ok(cap.indexOf('tierUnconfirmed') < cap.indexOf('an Academy membership feature'));
    assert.ok(cap.includes(NC));
  });
  it('the builder\'s SAVE', () => {
    const s = read('src/screens/lab/calc/CalcWorkflowEditScreen.tsx');
    const save = s.slice(s.indexOf('const saveOnce = '), s.indexOf('const trimmed = name.trim()'));
    const unconf = save.indexOf('if (!editingId && tierUnconfirmed) {');
    assert.ok(unconf > 0 && unconf < save.indexOf("'Build your own workflow?'"));
    assert.ok(save.includes(NC));
  });
  it('the calculator no longer imports the raw Alert', () => {
    assert.doesNotMatch(read('src/screens/lab/calc/CalcWorkspaceScreen.tsx'), /import \{ Alert,/);
  });
});

describe('4. members-only screens: lock only a KNOWN non-member; say so on a failed read', () => {
  it('Tube card', () => {
    const s = read('src/screens/lab/tube/TubeCardScreen.tsx');
    assert.match(s, /const gate = useMemberGate\(\);/);
    const un = s.slice(s.indexOf("if (gate === 'unconfirmed') {"), s.indexOf("if (gate === 'locked') {"));
    assert.ok(un.includes('MEMBERSHIP_NOT_CONFIRMED') && !un.includes('UPGRADE') && !un.includes('🔒'));
    assert.doesNotMatch(s, /if \(!unlocked\)/);
  });
  it('Tube reference index', () => {
    const s = read('src/screens/lab/tube/TubeReferenceScreen.tsx');
    assert.match(s, /const unlocked = gate !== 'locked';/);
    assert.doesNotMatch(s, /!entResolved \|\| memberStanding/);
    const open = s.slice(s.indexOf('const openTube = '), s.indexOf("navigation.navigate('TubeCard'"));
    assert.ok(open.indexOf("gate === 'unconfirmed'") < open.indexOf('confirmDialog('));
  });
  it('Audio Learning, Ear Lab, Lab category', () => {
    assert.match(read('src/screens/lab/AudioLearningScreen.tsx'), /const locked = gate === 'locked';/);
    const ear = read('src/screens/lab/EarLabScreen.tsx');
    assert.match(ear, /const isMember = gate !== 'locked';/);
    assert.doesNotMatch(ear, /const isMember = !resolved \|\| memberStanding;/);
    assert.match(ear, /if \(gate === 'unconfirmed'\) \{\s*notify\('Membership not confirmed', MEMBERSHIP_NOT_CONFIRMED\);/);
    const cat = read('src/screens/lab/LabCategoryScreen.tsx');
    assert.match(cat, /const lockedLeaf = \(leaf: LabLeaf\) => gate === 'locked' && memberOnlyLeaf\(leaf\);/);
  });
  it('the members-only route gate: no preview scrim / upgrade sheet on a failed read, and no lab', () => {
    const s = read('src/features/lab/withMembershipPreview.tsx');
    assert.match(s, /const gated = memberOnly && gate === 'locked';/);
    assert.match(s, /if \(memberOnly && gate === 'unconfirmed'\) return <GateUnconfirmed/);
    assert.match(s, /if \(memberOnly && gate === 'checking'\) return <GateHold/);
  });
  it('Tools hub library / training rows, Flashcards mistakes copy', () => {
    const hub = read('src/screens/tools/ToolsHubScreen.tsx');
    assert.match(hub, /\{\(gate === 'open' \|\| gate === 'locked'\) && \(/);
    assert.match(hub, /gate === 'unconfirmed' \? <Text style=\{styles\.lockedNote\}>\{MEMBERSHIP_NOT_CONFIRMED\}/);
    // The gate itself now reaches levelText (tidy hunt 5, 2026-10-03), which
    // still reads 'locked' as the only non-member.
    const fc = read('src/screens/study/FlashcardsScreen.tsx');
    assert.match(fc, /const memberGate = useMemberGate\(\);/);
    assert.match(fc, /const member = gate !== 'locked';/);
  });
});

describe('5. Glossary — the offline footer and the topic picker', () => {
  const s = read('src/screens/glossary/GlossaryScreen.tsx');
  it('SEE MEMBERSHIP only for a KNOWN non-member; the failed read gets the plain words', () => {
    assert.match(s, /const upsell = useUpsellAllowed\(\);/);
    assert.match(s, /\{!resolved \|\| isMember \|\| !upsell \? \(/);
    assert.match(s, /resolved && !isMember\s*\? tierUnconfirmedCopy/);
  });
  it('the topic picker: no 🔒 MEMBERS and no upgrade hint unless upsell', () => {
    assert.match(s, /\{upsell \? COPY\.upgradePhrase : tierUnconfirmedCopy\}/);
    assert.match(s, /\{upsell \? <Text style=\{styles\.topicMembersTag\}>🔒 MEMBERS<\/Text> : null\}/);
  });
});

describe('6. guest WORDING — one central rule for the labs\' end screen and Start Here', () => {
  it('LabEndScreen words from useGuestWording; the behaviour hook is unchanged', () => {
    const s = read('src/screens/lab/kit/LabEndScreen.tsx');
    assert.match(s, /const wording = useGuestWording\(\);\s*const isGuest = guest \?\? wording\.guest;/);
    assert.match(s, /export function useLabEndGuest\(\): boolean \{\s*return isGuestTier\(useTier\(\)\);\s*\}/, 'blocking/carry rule untouched');
  });
  it('Start Here\'s "You’re not signed in" note', () => {
    const s = read('src/screens/startHere/StartHereScreen.tsx');
    assert.match(s, /guest: guestWording\.guest,/);
    assert.doesNotMatch(s, /guest: resolved && entitlement === 'anonymous'/);
  });
});

describe('7. the rest of the sweep', () => {
  it('Credential wall: "Sign in with a free account" needs a KNOWN guest', () => {
    assert.match(read('src/screens/achievements/CredentialWall.tsx'), /const guest = tierKnown && entitlement === 'anonymous';/);
  });
  it('Directory: "Get registered." only for a KNOWN guest', () => {
    assert.match(read('src/screens/directory/DirectoryScreen.tsx'), /const hasAccount = !tierKnown \|\| entitlement !== 'anonymous';/);
  });
});
