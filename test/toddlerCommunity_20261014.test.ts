/**
 * TODDLER HUNT 2026-10-14 — owner-approved community items (report §3):
 *  #11 a message re-sent after a slow SEND arrives twice (client half)
 *  #13 Directory REPORT has no "Also block them" (Requests has it)
 *  #15 tapping the same member alert twice gives no second refresh
 *  #25 a guest's Profile tab shows editable fields and no way to sign in
 *  #26 a guest's Directory offers only a RETRY that can never work
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { landedAlready, pendingFor, type PendingSend } from '../src/features/directory/sendOnce.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const bits = read('src/screens/directory/directoryBits.tsx');
const dir = read('src/screens/directory/AudioCommunityDirectoryScreen.tsx');
const requests = read('src/screens/directory/RequestsView.tsx');
const explore = read('src/screens/directory/ExploreView.tsx');
const myProfile = read('src/screens/directory/MyProfileView.tsx');
const profile = read('src/screens/profile/ProfileScreen.tsx');
const api = read('src/features/directory/api.ts');

describe('#11 one composed message is sent once', () => {
  let n = 0;
  const mint = () => `id-${++n}`;

  it('the same text again reuses the id and the first snapshot; new text is a new message', () => {
    const a = pendingFor(undefined, 'hello', new Set(['m1']), mint);
    assert.equal(a.retry, false);
    const b = pendingFor(a.pending, 'hello', new Set(['m1', 'm2']), mint);
    assert.equal(b.retry, true);
    assert.equal(b.pending, a.pending, 'a retry keeps the client id and the pre-attempt snapshot');
    const c = pendingFor(a.pending, 'hello again', new Set(['m1']), mint);
    assert.equal(c.retry, false);
    assert.notEqual(c.pending.clientId, a.pending.clientId);
  });

  it('a retry is answered as sent only when a NEW message of mine with that text appeared', () => {
    const p: PendingSend = { clientId: 'x', body: 'see you Friday', knownIds: new Set(['old']) };
    assert.equal(landedAlready(p, [{ id: 'old', mine: true, body: 'see you Friday' }]), false, 'an older identical message is not this one');
    assert.equal(landedAlready(p, [{ id: 'new', mine: false, body: 'see you Friday' }]), false, 'theirs is not mine');
    assert.equal(landedAlready(p, [{ id: 'new', mine: true, body: 'see you Friday ' }]), true);
    assert.equal(landedAlready({ ...p, knownIds: null }, [{ id: 'new', mine: true, body: 'see you Friday' }]), false, 'no snapshot proves nothing');
  });

  it('SEND goes through sendOnce: re-read on a retry, clear the pending entry only on success', () => {
    const sheet = requests.slice(requests.indexOf('function ThreadSheet'));
    assert.match(sheet, /msgsFor\.current === thread\.id \? new Set\(msgs\.map\(\(m\) => m\.id\)\) : null/);
    assert.match(sheet, /if \(retry && pending\.knownIds\) \{\s*const seen = await fetchThreadMessages\(thread\.id\);\s*if \(seen\.ok && landedAlready\(pending, seen\.rows\)\) return \{ ok: true \} as const;/);
    assert.match(sheet, /if \(r\.ok && pendingSends\.current\.get\(thread\.id\) === pending\) \{\s*pendingSends\.current\.delete\(thread\.id\);/);
    assert.match(sheet, /msgsFor\.current = null;/, 'switching conversations drops the snapshot source');
  });

  // Comp A #11 went live 2026-10-23 (Variant B): the client id now reaches the
  // server, and the 2-argument call stays as the fallback for a server
  // without the 3-argument function (PGRST202 / 42883).
  it('the client id goes to the 3-argument RPC; the 2-argument call is the fallback', () => {
    const send = api.slice(api.indexOf('export async function sendThreadMessage'), api.indexOf('export async function blockThread'));
    assert.match(send, /p_request_id: requestId,\s*p_body: body,\s*p_client_msg_id: clientMsgId,/);
    assert.match(send, /error\.code === 'PGRST202' \|\| error\.code === '42883'/);
    assert.match(send, /supabase\.rpc\('contact_message_send', \{\s*p_request_id: requestId,\s*p_body: body,\s*\}\)/);
    assert.match(requests, /return sendThreadMessage\(thread\.id, pending\.body, pending\.clientId\);/);
  });
});

describe('#13 Directory REPORT can also block, like Requests', () => {
  it('both report sheets use the one shared chip', () => {
    assert.match(bits, /export function AlsoBlockChip/);
    assert.match(bits, /label=\{on \? 'Also blocking them ✓' : 'Also block them'\}/);
    assert.match(requests, /<AlsoBlockChip on=\{alsoBlock\} onToggle=\{\(\) => setAlsoBlock\(\(v\) => !v\)\} \/>/);
    const sheet = dir.slice(dir.indexOf('function ReportSheet'));
    assert.match(sheet, /const \[alsoBlock, setAlsoBlock\] = useState\(true\);/);
    assert.match(sheet, /<AlsoBlockChip on=\{alsoBlock\}/);
  });

  it('the block runs only after the report went through, and the receipt says what the SERVER did', () => {
    const send = dir.slice(dir.indexOf('onSend={(reason, detail, alsoBlock) =>'), dir.indexOf('function ContactSheet'));
    assert.match(send, /const b = r\.ok && alsoBlock \? await blockMember\(token, true\) : null;\s*if \(b\?\.ok\) onBlocked\?\.\(token\);/);
    // The block is not fenced by the open member; only the screen answer is.
    assert.ok(send.indexOf('blockMember(token, true)') < send.indexOf('if (liveToken.current !== token) return;'));
    assert.match(send, /setErr\(b && !b\.ok \? b\.error : null\);\s*setReported\(b\?\.ok \? 'blocked' : 'reported'\);/);
    assert.match(dir, /reported === 'blocked' \? \(\s*<Banner tone="good">\s*Report received\. We review reports and act on them\. You will not hear from this member/);
  });
});

describe('#15 every alert tap re-reads', () => {
  it('the link effect keys on the params OBJECT (one per navigate), not the link text', () => {
    assert.match(dir, /const lastParams = useRef\(params\);/);
    assert.match(dir, /if \(lastParams\.current === params\) return;\s*lastParams\.current = params;/);
    assert.match(dir, /if \(next\.thread\) setOpenThreadId\(next\.thread\);/);
    assert.doesNotMatch(dir, /lastLinkKey/);
  });
});

describe('#25 a guest Profile is a sign-in card', () => {
  it('a KNOWN guest gets the plain sentence and SIGN IN to the sign-in screen, no upsell', () => {
    const at = profile.indexOf('if (registryGuest) {');
    assert.ok(at > 0);
    const guest = profile.slice(at, profile.indexOf('\n  return (', at));
    assert.match(guest, /Sign in or create an account to have a profile\./);
    assert.match(guest, /label="SIGN IN"[\s\S]*navigate\('Auth'\)/);
    assert.doesNotMatch(guest, /UPGRADE|Paywall|free|CredentialShareRow|TextInput/i);
    assert.match(profile, /const registryGuest = tierKnown && entitlement === 'anonymous';/);
  });
});

describe('#26 a guest Directory offers SIGN IN, not a dead RETRY', () => {
  it('RetryOrSignIn: known guest or a "Sign in" answer → SIGN IN; otherwise RETRY', () => {
    assert.match(bits, /return guest \|\| \/\\bSign in\\b\/\.test\(message \?\? ''\);/);
    assert.match(bits, /const \{ guest \} = useGuestWording\(\);\s*if \(needsSignIn\(guest, message\)\)/);
    assert.match(bits, /label="SIGN IN"[\s\S]*navigate\('Auth'\)/);
    assert.match(bits, /<PrimaryButton label="RETRY" onPress=\{onRetry\} \/>/);
  });
  it('Explore, My Profile and Requests load failures all use it', () => {
    assert.match(explore, /<RetryOrSignIn message=\{err\} onRetry=\{\(\) => void run\(f\)\} \/>/);
    assert.match(myProfile, /<RetryOrSignIn message=\{loadErr\} onRetry=\{\(\) => setReloadKey\(\(k\) => k \+ 1\)\} \/>/);
    assert.match(requests, /<RetryOrSignIn message=\{loadErr\} onRetry=\{\(\) => void load\(\)\} \/>/);
  });
});
