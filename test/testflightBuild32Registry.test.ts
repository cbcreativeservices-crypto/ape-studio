/**
 * TestFlight build 32 — Pro Registry reports. Source-reading guards.
 *
 * 1. Owner, Pixel: "unable to add my username nor … turn on list me". The
 *    gap checklist's "Your user name — ADD ›" opened PUBLIC PROFILE (which no
 *    longer holds that field) and left MY USER NAME collapsed, so the input was
 *    never mounted and the focus went nowhere; the listing switch stays dimmed
 *    until a user name exists. A guest who did fill everything in then ran the
 *    18+ → Publish chain into a refused write reported as "check your
 *    connection".
 * 2. Owner, Pixel: Enrollments tab lit, Pro Registry still on screen. The tab
 *    tap scrolled the pager inline, in the same tick as the re-layout it caused.
 * 3. Maureen, iPhone: "will not allow preview of public profile". The preview
 *    sheet's body was `flex: 1` inside a content-sized sheet — laid out zero tall.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
const read = (rel: string) =>
  stripComments(readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8'));

const profile = read('screens/profile/ProfileScreen.tsx');
const awards = read('screens/awards/AwardsScreen.tsx');
const myProfile = read('screens/directory/MyProfileView.tsx');

test('1a: "Your user name — ADD" opens the section that holds the user name', () => {
  const focus = profile.match(/const focusField = useCallback\([\s\S]*?\}, \[\]\);/);
  assert.ok(focus, 'focusField not found');
  assert.match(
    focus[0],
    /key === 'name'\)\s*setNameSeq/,
    "focusField('name') must remount MY USER NAME open, not PUBLIC PROFILE",
  );
  const at = profile.indexOf('title="MY USER NAME"');
  assert.ok(at >= 0, 'MY USER NAME section not found');
  const attrs = profile.slice(profile.lastIndexOf('<Section', at), profile.indexOf('Your user name', at));
  assert.match(attrs, /key=\{`user-name-\$\{nameSeq\}/, 'MY USER NAME must remount on nameSeq');
  assert.match(attrs, /defaultOpen=\{nameSeq > 0/, 'MY USER NAME must open when its ADD is tapped');
  // The input the ADD focuses lives inside that section.
  const body = profile.slice(profile.indexOf('title="MY USER NAME"'), profile.indexOf('title="PUBLIC PROFILE"'));
  assert.match(body, /ref=\{nameRef\}/, 'nameRef must be on the input inside MY USER NAME');
});

test('1b: a guest is told listing needs an account, before any publish attempt', () => {
  const toggle = profile.match(/const onRegistryToggle = useCallback\([\s\S]*?\n {2}\);/);
  assert.ok(toggle, 'onRegistryToggle not found');
  const t = toggle[0];
  const guestAt = t.indexOf('if (v && registryGuest)');
  assert.ok(guestAt >= 0, 'onRegistryToggle must check registryGuest when switching on');
  assert.ok(
    guestAt < t.indexOf('setRegistryVisible'),
    'the guest check must come before the server write',
  );
  assert.ok(guestAt < t.indexOf('Are you 18 or older?'), 'a guest must not be walked through the 18+ prompt');
  assert.match(t.slice(guestAt), /Listing needs an account/);
  assert.match(t.slice(guestAt), /navigate\('Auth'\)/, 'the guest popup offers the way to an account');
  assert.match(profile, /const registryGuest = tierKnown && entitlement === 'anonymous'/);
  assert.match(
    profile,
    /\{registryGuest \? \(\s*<Text[^>]*>\s*Listing needs an account/,
    'the switch row states the guest rule in place, not only on tap',
  );
  assert.doesNotMatch(profile, /Alert\.alert/);
});

test('2: every pager jump — tab taps included — goes through the landing-checked goToIndex', () => {
  const tabRow = awards.slice(awards.indexOf('styles.tabRow'), awards.indexOf('<FlatList\n'));
  assert.match(tabRow, /onPress=\{\(\) => goToIndex\(i\)\}/, 'the tab must jump via goToIndex');
  assert.doesNotMatch(tabRow, /scrollToIndex/, 'no inline scroll in the tab row');
  const go = awards.match(/const goToIndex = useCallback\([\s\S]*?\}, \[\]\);/);
  assert.ok(go, 'goToIndex not found');
  assert.match(go[0], /requestAnimationFrame\(jump\)/, 'the scroll runs after the commit');
  assert.match(go[0], /setTimeout\([\s\S]*offsetXRef\.current[\s\S]*if \(at !== i\) jump\(\)/, 'and is re-issued if it did not land');
  // The offset the check reads is fed by the pager itself.
  assert.match(awards, /onScroll=\{\(e\) => \{\s*offsetXRef\.current = e\.nativeEvent\.contentOffset\.x/);
  assert.match(awards, /onScrollBeginDrag=\{\(\) => \{\s*wantedRef\.current = null/, 'a swipe cancels the check');
  // Only goToIndex scrolls to a page index (onLayout start + width re-snap aside).
  const scrolls = [...awards.matchAll(/scrollToIndex\(\{ index: (\w+)/g)].map((m) => m[1]);
  assert.deepEqual(scrolls.sort(), ['i', 'idx', 'startIdx'].sort(), `unexpected scrollToIndex callers: ${scrolls}`);
});

test('3: the public-profile preview (and the specialty picker) bodies can be seen', () => {
  const preview = myProfile.slice(myProfile.indexOf('function PreviewSheet'));
  assert.match(preview, /<ScrollView style=\{\{ flexShrink: 1 \}\}>/, 'preview body must shrink, not flex: 1');
  const picker = myProfile.slice(myProfile.indexOf('function SpecialtyPicker'), myProfile.indexOf('function PreviewSheet'));
  assert.doesNotMatch(picker, /<ScrollView[^>]*style=\{\{ flex: 1 \}\}/, 'picker body must not be flex: 1');
  // Both sheets are content-sized (maxHeight only) — the reason flex: 1 collapses.
  assert.match(myProfile, /sheet: \{[\s\S]*?maxHeight: '88%'/);
  assert.match(myProfile, /PREVIEW MY PUBLIC PROFILE[\s\S]*?setPreviewOpen\(true\)/);
});
