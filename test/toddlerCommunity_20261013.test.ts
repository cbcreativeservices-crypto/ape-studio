/**
 * TODDLER PASS — Area 3 (profile, community, messaging, directory, moderation,
 * employer), 2026-10-13. Source receipts: each block fails on the tree before
 * this pass.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const myProfile = read('src/screens/directory/MyProfileView.tsx');
const requests = read('src/screens/directory/RequestsView.tsx');
const notice = read('src/features/account/AccountStandingNotice.tsx');
const modApi = read('src/features/moderation/api.ts');

describe('T3-1 visibility switches: one write per switch, newest re-read wins', () => {
  it('both switches go through flipSwitch, which drops taps while that switch is out', () => {
    assert.match(myProfile, /flipSwitch\('discoverable', \(\) => setDiscoverable\(v\)\)/);
    assert.match(myProfile, /flipSwitch\('contact', \(\) => setContactEnabled\(v\)\)/);
    assert.match(myProfile, /if \(switching\.current\.has\(key\) \|\| stale\(\)\) return;/);
    assert.match(myProfile, /\.finally\(\(\) => switching\.current\.delete\(key\)\)/);
    assert.doesNotMatch(myProfile, /void setDiscoverable\(v\)\.then/);
  });
  it('refresh() drops a re-read that a newer one has overtaken', () => {
    const body = myProfile.slice(myProfile.indexOf('const refresh = useCallback'));
    assert.match(body, /const ticket = \+\+refreshTicket\.current;/);
    assert.match(body, /if \(ticket !== refreshTicket\.current\) return;/);
  });
});

describe('T3-2 queued profile writes never cross to the next account', () => {
  it('captures the wipe count at mount', () => {
    assert.match(myProfile, /const wipeAtMount = useRef\(localStoreWipeCount\(\)\);/);
  });
  it('persist, the flush-on-leave, publish and delete all check it before calling the server', () => {
    assert.match(myProfile, /if \(stale\(\)\) return false; \/\/ the account changed/);
    assert.match(myProfile, /stale\(\) \? undefined : saveCommunityProfile\(latest\)/);
    assert.match(myProfile, /stale\(\) \? null : publishCommunityProfile\(on, adult\)/);
    assert.match(myProfile, /stale\(\) \? null : deleteCommunityProfile\(\)/);
  });
});

describe('T3-3 chip taps build on the latest profile, not the render closure', () => {
  it('toggleArea / toggleIn / setPrimary read pRef.current', () => {
    const area = myProfile.slice(myProfile.indexOf('const toggleArea'), myProfile.indexOf('const gaps'));
    assert.match(area, /const toggleArea = \(slug: string\) => \{\s*const p = pRef\.current;/);
    assert.match(area, /persist\(\{ \.\.\.pRef\.current, primaryArea: slug \}\)/);
    assert.match(area, /const toggleIn = [^\n]+\n\s*const p = pRef\.current;/);
  });
});

describe('T3-4 the standing notice re-reads on every Profile visit', () => {
  it('reads on focus, newest wins, and a failed re-read keeps the last answer', () => {
    assert.match(notice, /useFocusEffect\(/);
    assert.match(notice, /if \(mine === ticket\.current && r\.ok\) setStanding\(r\.standing\);/);
    assert.doesNotMatch(notice, /useEffect\(\(\) => \{\s*let alive/);
  });
  it('readMyStanding tells "nothing to say" from "could not ask"', () => {
    assert.match(modApi, /export async function readMyStanding\(\)/);
    assert.match(modApi, /if \(error\) return \{ ok: false \};/);
    assert.match(modApi, /if \(!r\) return \{ ok: true, standing: null \};/);
  });
});

describe('T3-5 a member alert tapped while Requests is open re-reads the list first', () => {
  it('a link that arrives after the first load reloads before matching', () => {
    assert.match(requests, /const freshFor = useRef<string \| null>\(openThreadId\);/);
    assert.match(requests, /if \(freshFor\.current !== openThreadId\) \{\s*freshFor\.current = openThreadId;\s*void load\(\);\s*return;/);
    assert.match(requests, /freshFor\.current = null;\s*onOpenedRef\.current\?\.\(\);/);
  });
});

describe('T3-6 the open conversation re-reads when the app comes back', () => {
  it('ThreadSheet listens for AppState active and reloads', () => {
    const sheet = requests.slice(requests.indexOf('function ThreadSheet'));
    assert.match(sheet, /AppState\.addEventListener\('change', \(s\) => \{\s*if \(s === 'active'\) void load\(\);/);
    assert.match(sheet, /return \(\) => sub\.remove\(\);/);
  });
});

describe('T3-7 the conversation follows the newest message unless the reader scrolls up', () => {
  it('pins to the end on open and after a send; a drag unpins', () => {
    const sheet = requests.slice(requests.indexOf('function ThreadSheet'));
    assert.match(sheet, /if \(pinToEnd\.current\) listRef\.current\?\.scrollToEnd\(\{ animated: false \}\);/);
    assert.match(sheet, /onScrollBeginDrag=\{\(\) => \{\s*pinToEnd\.current = false;/);
    assert.match(sheet, /pinToEnd\.current = true; \/\/ show the message just sent/);
    // The hooks sit above the early return (rules of hooks).
    assert.ok(sheet.indexOf('const pinToEnd = useRef(true)') < sheet.indexOf('if (!thread) return null;'));
  });
});
