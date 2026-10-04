/**
 * PERFORMANCE HUNT — AREA 9: COMMUNITY + CAREERS + AWARDS (2026-10-03).
 *
 * Receipts for each delay / stall fixed. Source-shape assertions pin the faster
 * structure; every block FAILED against HEAD 4201f49f (R2: the fixed file
 * copied aside, `git show HEAD:<path>` written back, the test run, the fixed
 * file restored and compared).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

/** From `start` to the first line that begins a new top-level declaration. */
function block(src: string, start: string): string {
  const i = src.indexOf(start);
  assert.ok(i >= 0, `missing: ${start}`);
  const rest = src.slice(i + start.length);
  const end = rest.search(/\n(export |function |const |async function |type |\/\*\*)/);
  return start + (end < 0 ? rest : rest.slice(0, end));
}

describe('Career Finder', () => {
  const idx = read('src/features/careerfinder/careerIndex.ts');

  it('title lookups read a title map built once, not a scan of all ~1,900 careers per call', () => {
    const reg = block(idx, 'export function isRegulatedTitle(');
    const fur = block(idx, 'export function furtherEducationForTitle(');
    for (const b of [reg, fur]) {
      assert.match(b, /careersTitled\(t\)/);
      assert.doesNotMatch(b, /all\(\)/, 'no full scan of the index per call');
    }
    // Built lazily, once.
    assert.match(idx, /let byTitle: Map<string, Career\[\]> \| null = null;/);
    assert.match(idx, /if \(!byTitle\) \{/);
  });

  it('Results draws family cards with a render FUNCTION, never an inline component type', () => {
    const res = read('src/screens/careerfinder/CareerFinderResultsScreen.tsx');
    assert.doesNotMatch(res, /const FamilyCard = \(/, 'an inline component remounts every card per render');
    assert.doesNotMatch(res, /<FamilyCard\b/);
    assert.match(res, /const familyCard = \(/);
    assert.match(res, /<Card key=\{f\.id\}/, 'the card keeps a key now that it is a plain element');
  });

  it('the quiz auto-advance beat is 300 ms or less (was 450 ms), and still 0 under Reduce Motion', () => {
    const quiz = read('src/screens/careerfinder/CareerFinderQuizScreen.tsx');
    const m = quiz.match(/const ADVANCE_MS = (\d+);/);
    assert.ok(m, 'ADVANCE_MS present');
    assert.ok(Number(m[1]) <= 300, `ADVANCE_MS ${m[1]}`);
    assert.match(quiz, /const delay = animationsAllowed\(\) \? ADVANCE_MS : 0;/);
  });
});

describe('Audio Community Directory', () => {
  const explore = read('src/screens/directory/ExploreView.tsx');
  const host = read('src/screens/directory/AudioCommunityDirectoryScreen.tsx');
  const api = read('src/features/directory/api.ts');

  it('result cards and the filter panel are memoized out of the per-keystroke render', () => {
    assert.match(explore, /const MemberCard = memo\(function MemberCard/);
    assert.match(explore, /const FilterPanel = memo\(function FilterPanel/);
    assert.match(explore, /<MemberCard key=\{r\.publicToken\} r=\{r\} onOpen=\{onOpenMember\} \/>/);
    assert.match(explore, /<FilterPanel tax=\{tax\} f=\{f\} setF=\{setF\} \/>/);
    // The panel's writes are functional updates (no stale `f` once memoized).
    const panel = block(explore, 'const FilterPanel = memo(');
    assert.doesNotMatch(panel, /setF\(\{ \.\.\.f/);
  });

  it('a re-search keeps the list on screen; the spinner is only for "nothing yet"', () => {
    assert.match(explore, /\{busy && visibleRows\.length === 0 \? \(\s*<Loading label="Searching the directory…" \/>/);
    assert.doesNotMatch(explore, /\{busy \? \(\s*<Loading/);
    // While a new search is out, the count line says so and "Show more" waits.
    assert.match(explore, /\{busy\s*\? 'Searching the directory…'/);
    assert.match(explore, /\{hasMore && !busy \? \(/);
  });

  it('Explore stays mounted across tab switches and refreshes in the background on return', () => {
    assert.doesNotMatch(host, /\{tab === 'explore' \? <ExploreView/);
    assert.match(host, /<View style=\{tab === 'explore' \? st\.pane : st\.paneHidden\}>/);
    assert.match(host, /paneHidden: \{ display: 'none' \}/);
    assert.match(host, /active=\{tab === 'explore'\}/);
    assert.match(explore, /if \(active && !wasActive\.current\) void run\(fRef\.current\);/);
    assert.match(explore, /if \(!active && wasActive\.current\) Keyboard\.dismiss\(\);/);
  });

  it('the member sheet takes a profile read started on press-IN (one-shot, short-lived)', () => {
    assert.match(explore, /onPressIn=\{\(\) => prefetchPublicProfile\(r\.publicToken\)\}/);
    assert.match(host, /takePrefetchedPublicProfile\(token\) \?\? fetchPublicProfile\(token\)/);
    const take = block(api, 'export function takePrefetchedPublicProfile(');
    assert.match(take, /profilePrefetch\.delete\(token\);/, 'one-shot: a Retry always reads fresh');
    assert.match(take, /Date\.now\(\) - hit\.at >= PROFILE_PREFETCH_MS/);
    // Title is the tapped card's name from the first frame.
    assert.match(host, /!settled && seedName \? seedName\.toUpperCase\(\)/);
  });

  it('a conversation reads its messages and its allowance in parallel', () => {
    const req = read('src/screens/directory/RequestsView.tsx');
    assert.match(req, /await Promise\.all\(\[fetchThreadMessages\(id\), fetchContactAllowance\(id\)\]\)/);
    assert.doesNotMatch(req, /const a = await fetchContactAllowance\(id\);/);
    assert.match(req, /if \(openId\.current === id && seq === loadSeq\.current\) setAllow\(a\);/);
  });

  it('My Profile reads the old-profile draft alongside the other four loads', () => {
    const mp = read('src/screens/directory/MyProfileView.tsx');
    assert.match(mp, /alreadyMigrated\(\)\.catch\(\(\) => false\),\s*buildLegacyDraft\(\)\.catch\(\(\) => null\),\s*\]\);/);
    assert.doesNotMatch(mp, /await buildLegacyDraft\(\)/);
  });

  it('the Directory page of the Awards pager is memoized', () => {
    const dir = read('src/screens/directory/DirectoryScreen.tsx');
    assert.match(dir, /export const DirectoryView = memo\(function DirectoryView/);
  });
});

describe('Awards + Trophy Case', () => {
  const awardsApi = read('src/features/awards/api.ts');
  const ach = read('src/features/achievements/api.ts');

  it('award progress reads the identity and the required-topics RPC together', () => {
    const fn = block(awardsApi, 'export async function fetchAwardProgress(');
    assert.match(fn, /await Promise\.all\(\[internalUserId\(\), reqRead\]\)/);
    assert.ok(fn.indexOf('Promise.all([internalUserId(), reqRead])') < fn.indexOf('if (!userId) return null;'));
    // A guest still gets null, never the RPC's rejection.
    assert.ok(fn.indexOf('if (!userId) return null;') < fn.indexOf('if (!req.ok) throw req.e;'));
  });

  it('the topic overlay reads progress alongside the curriculum, not after it', () => {
    const fn = block(ach, 'export async function fetchTopicAchievements(');
    assert.match(fn, /await Promise\.all\(\[fetchV3CurriculumStrict\(\), readMyProgressRows\(\)\]\)/);
    assert.match(fn, /if \(error\) throw error;/, 'a failed progress read still rejects');
  });

  it('Trophy Case reads are shared per identity for a few seconds; failures are never kept', () => {
    const sh = block(ach, 'async function shared<T>(');
    assert.match(sh, /hit\.key === key && Date\.now\(\) - hit\.at < RECENT_MS/);
    assert.match(sh, /entry\.p\.catch\(\(\) => \{\s*if \(slot\.cur === entry\) slot\.cur = null;/);
    assert.match(ach, /const RECENT_MS = 8_000;/);
    // Hunt 12: the identity read is the house safeSessionResult (unknown ≠ guest).
    assert.match(ach, /return result\.data\?\.session\?\.user\?\.id \?\? 'guest';/);
    assert.match(ach, /return shared\(topicSlot, fetchTopicAchievements\);/);
    assert.match(ach, /return shared\(gallerySlot, fetchGalleryV3\);/);
    assert.match(ach, /return shared\(nearestSlots\[type\], \(\) => fetchNearestCredential\(type\)\);/);
    // The screens read through the shared wrappers.
    assert.match(read('src/screens/achievements/TopicsScreen.tsx'), /fetchTopicAchievementsShared\(\)/);
    assert.match(read('src/screens/achievements/GalleryScreen.tsx'), /fetchGalleryV3Shared\(\)/);
    assert.match(read('src/screens/achievements/CredentialWall.tsx'), /fetchNearestCredentialShared as fetchNearestCredential,/);
    // The wall's list and its NEXT UP share ONE credentials read.
    assert.doesNotMatch(block(ach, 'export async function fetchEarnedCredentialsByType('), /fetchMyCredentials\(\)/);
  });

  it('the hub cards and the gallery link warm the next screen on press-IN', () => {
    const hub = read('src/screens/achievements/AchievementsHomeScreen.tsx');
    for (const t of ['topics', 'certificate', 'program']) {
      assert.match(hub, new RegExp(`onPressIn=\\{\\(\\) => prefetchTrophyCase\\('${t}'\\)\\}`));
    }
    const topics = read('src/screens/achievements/TopicsScreen.tsx');
    assert.match(topics, /onPressIn=\{\(\) => prefetchTrophyCase\('gallery'\)\}/);
  });

  it('the credential wall draws remote art with expo-image (memory + disk), not RN Image', () => {
    const wall = read('src/screens/achievements/CredentialWall.tsx');
    assert.match(wall, /import \{ Image \} from 'expo-image';/);
    assert.doesNotMatch(wall, /import \{[^}]*\bImage\b[^}]*\} from 'react-native';/);
    assert.equal((wall.match(/cachePolicy="memory-disk"/g) ?? []).length, 2);
  });

  it('the certificate / program choosers are virtualized FlatLists, and the pager pages are memoized', () => {
    const aw = read('src/screens/awards/AwardsScreen.tsx');
    assert.doesNotMatch(aw, /\{specCertsAZ\.map\(\(c\) => \(\s*<CredentialRow/);
    assert.doesNotMatch(aw, /\{programPathsAZ\.map\(\(p\) => \(\s*<CredentialRow/);
    assert.match(aw, /<FlatList\s+data=\{specCertsAZ\}[\s\S]{0,120}renderItem=\{renderCertRow\}/);
    assert.match(aw, /<FlatList\s+data=\{programPathsAZ\}[\s\S]{0,120}renderItem=\{renderProgRow\}/);
    assert.match(aw, /const AwardPageView = memo\(function AwardPageView/);
    assert.match(aw, /const summaryForTier = useCallback\(/);
    // A row tap still runs the CURRENT handler.
    assert.match(aw, /onPress=\{\(\) => openCertRef\.current\(c\)\}/);
    assert.match(aw, /onPress=\{\(\) => openProgRef\.current\(p\)\}/);
  });
});
