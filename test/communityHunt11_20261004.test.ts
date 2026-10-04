/**
 * HUNT 11 — Area 9 (community + careers + awards), 2026-10-04.
 * Each block is a receipt that FAILS on 784bb36f.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { readableError } from '../src/features/directory/rules.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('H11-1 the live reverse-pending refusal reads as itself', () => {
  // The exact sentence contact_request_send raises since the security fixes
  // went live (read-only pg_get_functiondef, 2026-10-04).
  const live = 'this member has already sent you a request — answer it in your inbox';

  it('names the waiting request and where to answer it — not "on our side"', () => {
    const out = readableError(live);
    assert.equal(out, 'This member has already sent you a request. Answer it under Requests.');
    assert.doesNotMatch(out, /on our side/);
  });

  it('the older one-pending index still reads as OUR request', () => {
    assert.match(readableError('duplicate key value violates unique constraint "contact_requests_one_pending"'), /You already sent this member/);
  });
});

describe('H11-2 "your account is restricted" is not only a SEND', () => {
  // Raised live by publish, set_discoverable, set_contact, contact_request_respond
  // as well as the two sends; the switches and ACCEPT/DECLINE show this string.
  const out = readableError('your account is restricted');

  it('does not say "send" under a switch or a DECLINE button', () => {
    assert.doesNotMatch(out, /\bsend\b/i);
  });

  it('still names the restriction and where the reason is', () => {
    assert.match(out, /community access is restricted/);
    assert.match(out, /notice on your Profile/);
  });
});

describe('H11-3 the member-sheet press-in prefetch is dropped on an account wipe', () => {
  const src = read('src/features/directory/api.ts');

  it('a reset clears the prefetch map', () => {
    const at = src.indexOf('export function resetProfilePrefetch(');
    assert.ok(at > 0, 'resetProfilePrefetch exists');
    const body = src.slice(at, src.indexOf('\n}', at));
    assert.match(body, /profilePrefetch\.clear\(\)/);
  });

  it('and it self-registers with the wipe at module evaluation', () => {
    assert.match(src, /^registerLocalStoreReset\(resetProfilePrefetch\);/m);
  });
});

describe('H11-4 a block made in Requests reaches the kept-mounted Explore list', () => {
  const host = read('src/screens/directory/AudioCommunityDirectoryScreen.tsx');
  const req = read('src/screens/directory/RequestsView.tsx');

  it('the host hands RequestsView the same block marker the member sheet uses', () => {
    // (2026-10-04, userNotifications: RequestsView also takes the linked
    // conversation now — the block marker is still the first prop.)
    assert.match(host, /<RequestsView\s+onBlocked=\{markBlocked\}[\s\S]*?\/>/);
    assert.match(host, /<MemberSheet[\s\S]*?onBlocked=\{markBlocked\}/);
  });

  it('BLOCK in a thread reports the member only after the server blocked', () => {
    const at = req.indexOf('void blockThread(t.id, true).then((r) => {');
    assert.ok(at > 0);
    const arm = req.slice(at, req.indexOf('}),', at));
    const fail = arm.indexOf('if (!r.ok) return onError(r.error);');
    const mark = arm.indexOf('onBlocked(t);');
    assert.ok(fail > 0 && mark > fail, 'onBlocked runs after the failure return');
  });

  it('REPORT + also-block reports the member only when the block went through', () => {
    assert.match(req, /blocked = b2\.ok;\s*\n\s*if \(blocked\) onBlocked\(thread\);/);
  });

  it('RequestsView passes the thread token (employers have none) to the host', () => {
    assert.match(req, /if \(t\.otherToken\) onBlockedRef\.current\?\.\(t\.otherToken\);/);
    assert.equal((req.match(/onBlocked=\{noteBlocked\}/g) ?? []).length, 2, 'incoming and sent cards');
  });
});
