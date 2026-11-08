/**
 * Report items 7 and 26 (2026-11-05): the Audio Community is hidden, so every
 * way in, and every badge read to the server, sits behind ONE off switch
 * (src/config/communityVisible.ts).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { COMMUNITY_VISIBLE } from '../src/config/communityVisible.ts';
import { isAcceptedLink, isClaimedPath, isDirectoryPath } from '../src/navigation/linkPaths.ts';
import { setPendingLink, peekPendingLink } from '../src/navigation/pendingLink.ts';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const UUID = '3f2b8c1e-5d4a-4b6f-9a7e-1c2d3e4f5a6b';

describe('the one switch', () => {
  it('is ON (owner 2026-11-07, forum by OTA, option A), and a leaf with no imports', () => {
    assert.equal(COMMUNITY_VISIBLE, true);
    assert.doesNotMatch(read('src/config/communityVisible.ts'), /^import /m);
  });
  it('Home and the tab bar read it', () => {
    assert.match(read('src/screens/courses/CourseSelectionScreen.tsx'), /^const SHOW_COMMUNITY_ON_HOME = COMMUNITY_VISIBLE;$/m);
    assert.match(read('src/components/nav/TabBar.tsx'), /^const SHOW_COMMUNITY_BADGE_ON_TAB = COMMUNITY_VISIBLE;$/m);
  });
});

describe('with the switch on, deep links and push taps reach the directory', () => {
  it('directory links are claimed', () => {
    for (const p of ['directory', 'directory/requests', `directory/requests/${UUID}`]) {
      assert.equal(isClaimedPath(p), true, p);
      assert.equal(isDirectoryPath(p), true, p);
    }
    assert.equal(isAcceptedLink('https://proaudiotrainingacademy.com/directory'), true);
    assert.equal(isAcceptedLink(`proaudio://directory/requests/${UUID}`), true);
  });
  it('a directory link can be parked for after sign-in', () => {
    assert.equal(setPendingLink(`proaudio://directory/requests/${UUID}`), true);
    assert.notEqual(peekPendingLink(), null);
  });
  it('Pro Registry stays reachable: it is not the community', () => {
    assert.equal(isClaimedPath('awards/directory'), true);
  });
  it('a tapped member alert opens only through the switch', () => {
    assert.match(
      read('src/features/notifications/push.ts'),
      /if \(COMMUNITY_VISIBLE && tap && community\) community\.open\(rules\(\)\.communityPath\(tap\)\);/,
    );
  });
});

describe('Pro Registry SET UP MY PROFILE', () => {
  const src = read('src/screens/directory/DirectoryScreen.tsx');
  it('opens the directory only when the switch is on, otherwise Profile', () => {
    assert.match(
      src,
      /COMMUNITY_VISIBLE\s*\? \(navigation as any\)\.navigate\('AudioCommunityDirectory'\)\s*: \(navigation as any\)\.popTo\('Main', \{ screen: 'Profile' \}\)/,
    );
    assert.equal(src.match(/navigate\('AudioCommunityDirectory'\)/g)?.length, 1);
  });
  it('its badge is behind the switch', () => {
    assert.match(src, /\{COMMUNITY_VISIBLE \? <CommunityBadge /);
    assert.equal(src.match(/<CommunityBadge /g)?.length, 1);
  });
});

describe('hidden badges do not ask the server', () => {
  it('every read goes through the one gated function', () => {
    const src = read('src/features/directory/CommunityBadge.tsx');
    assert.match(src, /export function refreshCommunityInbox\(force = false\): Promise<void> \{\n\s+if \(!COMMUNITY_VISIBLE\) return Promise\.resolve\(\);/);
    assert.equal(src.match(/refreshInbox\(/g)?.length, 1, 'no second way to the read');
    assert.match(src, /useEffect\(\(\) => \{\n\s+void refreshCommunityInbox\(\);/);
  });
});
