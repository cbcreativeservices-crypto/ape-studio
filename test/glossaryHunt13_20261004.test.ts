/**
 * GLOSSARY — hunt 13 (2026-10-04, final overnight). Re-audit of hunt 12
 * (b5b323ce: meterKnown heads-up, ENTRIES_CACHE wipe, Recent unreadable), the
 * two leftovers, then K1–K12 across the area.
 *
 * 1. (K1/K6, leftover) GlossaryTermPopup told a SIGNED-IN reader to "allow
 *    its temporary device ID". The browse view is granted to every signed-in
 *    reader (an account or a device key), so a 42501 reaches one only when the
 *    request went out without their token — an expired token whose refresh
 *    could not reach the server, or a stalled keychain read. The denial now
 *    asks safeSessionResult: a present or unknown session is the connection
 *    failure; only a known no-session reader is sent for the key.
 *
 * 2. (K2, leftover) The Custom (★) list and the Bookmarks said "No terms yet"
 *    / "No bookmarks in this list yet" when their stored copy could not be
 *    read. Account's flaggedStore now exposes useTermListUnreadable /
 *    useBookmarksUnreadable; the filter views, the held-chip list and the
 *    bookmark popup say the list could not be read (the Recent pattern).
 *
 * 3. (K2) A failed topic-list read wrote [] over the list an earlier focus had
 *    read. The read runs on every focus (back from Σ, a lab action, the
 *    Paywall): the picker went blank but for Equations, the chip lost
 *    "Topic ✓" for a topic still filtering the list, and the duplicate-name
 *    union fell back to one id, so terms filed under the twin id vanished. A
 *    failed read keeps what is held; with nothing held the picker says so.
 *
 * 4. (K3/K6) SHARE on a term whose detail came from a free cross-link hop is
 *    read in buildShareTerm, and a server refusal there told a reader whose
 *    membership was still being checked, or could not be confirmed, "This
 *    week's definition lookups are used up" — words readViaGateway and the
 *    term popup refuse to say to that reader (owner 2026-10-03 #1).
 *
 * Receipts: every test FAILED on HEAD 642fb8a2 (files copied aside, HEAD
 * written back, run, restored, cmp).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
const POPUP = strip(read('src/features/glossary/GlossaryTermPopup.tsx'));
const SCREEN = strip(read('src/screens/glossary/GlossaryScreen.tsx'));

describe('1 · the term popup names the device ID only to a reader with no session', () => {
  it('a 42501 asks who is here before choosing needsKey', () => {
    assert.match(POPUP, /import \{ safeSessionResult \} from '\.\.\/\.\.\/lib\/getSessionSafe';/);
    const at = POPUP.indexOf("classifyGatewayError(error) === 'denied'");
    assert.ok(at > 0);
    const branch = POPUP.slice(at, at + 600);
    assert.match(branch, /await safeSessionResult\(supabase\.auth\.getSession\(\), 'glossary term popup'\)/);
    assert.match(branch, /if \(cancelled\) return;/);
    // Present OR unknown → the connection line; only a known absence → the key.
    assert.match(branch, /if \(result\.data\.session \|\| timedOut\) setLoadError\(true\);\s*else setNeedsKey\(true\);/);
    assert.doesNotMatch(POPUP, /=== 'denied'\) setNeedsKey\(true\)/);
  });
});

describe('2 · Custom and Bookmarks: unreadable is not empty', () => {
  it('uses the flaggedStore unreadable hooks', () => {
    assert.match(SCREEN, /useTermListUnreadable\('starred'\)/);
    assert.match(SCREEN, /useBookmarksUnreadable\('glossary'\)/);
    assert.match(SCREEN, /useBookmarksUnreadable\(bmCtx\)/);
    assert.match(SCREEN, /useBookmarksUnreadable\(termListModal\?\.bookmarkCtx \?\? 'glossary'\)/);
  });
  it('the filter views say the list could not be read', () => {
    assert.match(SCREEN, /filter === 'custom' && starredUnreadable && !search\.trim\(\) \? \(\s*<Text style=\{styles\.empty\}>\{CUSTOM_UNREADABLE\}<\/Text>/);
    assert.match(SCREEN, /filter === 'favorites' && bookmarksUnreadable && !search\.trim\(\) \? \(\s*<Text style=\{styles\.empty\}>\{BOOKMARKS_UNREADABLE\}<\/Text>/);
  });
  it('the held-chip list says so before "No terms yet"', () => {
    const at = SCREEN.indexOf("termListModal?.kind === 'starred' && starredUnreadable");
    const empty = SCREEN.indexOf("'No terms yet — tap ★ on any term to build your custom list.'");
    assert.ok(at > 0 && empty > at);
    assert.match(SCREEN, /termListModal\?\.kind === 'bookmark' && pickedBookmarksUnreadable\s*\? BOOKMARKS_UNREADABLE/);
  });
  it('the bookmark popup says so before "No bookmarks in this list yet"', () => {
    assert.match(SCREEN, /: bmUnreadable\s*\? BOOKMARKS_UNREADABLE\s*: 'No bookmarks in this list yet/);
    // …and its row renderer repaints when that answer changes.
    assert.match(SCREEN, /\[bmCtx, openTermFromBm, switchBmCtx, topicsById, bmUnreadable, loadError\]/);
  });
});

describe('3 · a failed topic read never writes over the held list', () => {
  it('a null read keeps topics and marks them unreadable', () => {
    const at = SCREEN.indexOf("'glossary topic list'");
    const body = SCREEN.slice(at, at + 900);
    assert.match(body, /if \(topicRows == null\) \{\s*setTopicsUnreadable\(true\);\s*await corpus;\s*return;\s*\}\s*setTopicsUnreadable\(false\);\s*setTopics\(/);
    assert.doesNotMatch(SCREEN, /topicRows \?\? \[\]/);
  });
  it('both picker variants show the unreadable face when nothing is held', () => {
    const hits = SCREEN.match(/\{topicsUnreadable && topicsAZ\.length === 0 \? <Text style=\{styles\.empty\}>\{TOPICS_UNREADABLE\}<\/Text> : null\}/g) ?? [];
    assert.equal(hits.length, 2);
  });
});

describe('4 · a share refusal says "used up" only to a known non-member', () => {
  it('buildShareTerm maps limit-reached by the member gate', () => {
    assert.match(SCREEN, /const memberGateRef = useRef\(memberGate\);\s*memberGateRef\.current = memberGate;/);
    assert.match(
      SCREEN,
      /r\.fault === 'limit-reached' && memberGateRef\.current !== 'locked'\s*\? memberGateRef\.current === 'checking'\s*\? 'checking'\s*: 'unconfirmed'\s*: r\.fault;\s*if \(definition == null\) throw shareDefinitionUnreadable\(e\.term, fault\);/,
    );
  });
  it('the notice has honest words for checking / unconfirmed', () => {
    const at = SCREEN.indexOf('function notifyShareUnreadable');
    const fn = SCREEN.slice(at, at + 900);
    assert.match(fn, /err\.fault === 'checking'\s*\? `Your account is still being checked/);
    assert.match(fn, /err\.fault === 'unconfirmed'\s*\? `The full definition of “\$\{err\.term\}” can’t be loaded to share\. \$\{MEMBERSHIP_NOT_CONFIRMED\}`/);
  });
});
