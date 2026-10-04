/**
 * GLOSSARY — hunt 9 (2026-10-03). Re-audit of d44fcee4 (screen ShortReadNote),
 * then the area.
 *
 * 1. The device-key mint signed a member OUT of their own account. mintNow read
 *    the session through safeSession, which answers BOTH a stalled keychain read
 *    and an expired token whose refresh could not reach the server
 *    (AuthRetryableFetchError — the session stays stored) as "no session" — and
 *    then called signInAnonymously(). auth-js takes no lock there and saves the
 *    new anonymous session over whatever is stored, announcing SIGNED_IN for a
 *    new uid. On a slow cold start the entitlement provider is still at its boot
 *    'anonymous', so the Glossary asks a signed-in member for the temporary
 *    device ID; AGREE (or a consent already on file → the silent 'mint') then
 *    replaced the member's session with a throwaway key, and the identity change
 *    wiped the device's account data. An unknown session is now a network
 *    failure (the screen already fails open on it), never a mint.
 *
 * 2. The weekly-lookup LOCK never appeared on iOS when it went up as another
 *    Modal closed. A new term is most often reached mid-visit from the
 *    Bookmarks / Custom / Recent list or the bookmark popup, which close as the
 *    term opens; the metered read answers "out of lookups" inside their fade,
 *    iOS refuses a Modal presented over one still animating away, and with
 *    `visible` already true RN never retries — no lock, no term, and every
 *    later tap a no-op (the lock is already "up"). GlossaryLockView now waits
 *    rootModalHoldMs() like AppDialog and MembershipGate, then stays up.
 *
 * Receipts: every test below FAILED on HEAD 3131eae3.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const KEY = readFileSync(new URL('../src/features/glossary/deviceKey.ts', import.meta.url), 'utf8');

/** mintNow's body, comments stripped. */
function mintNowBody(): string {
  const start = KEY.indexOf('async function mintNow(');
  assert.ok(start >= 0, 'mintNow not found');
  return KEY.slice(start)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

describe('glossary device key: never mint over a session that could not be read', () => {
  it('mintNow reads the session through safeSessionResult (it knows a stall from a sign-out)', () => {
    const body = mintNowBody();
    assert.match(body, /safeSessionResult\(supabase\.auth\.getSession\(\), 'deviceKey'\)/);
    assert.doesNotMatch(body, /\bsafeSession\(/);
  });

  it('a timed-out / unreached session read returns a network failure BEFORE signInAnonymously', () => {
    const body = mintNowBody();
    const refuse = body.search(/if \(timedOut\) return \{ ok: false, reason: 'network'/);
    const mint = body.indexOf('signInAnonymously(');
    assert.ok(refuse >= 0, 'no refusal on an unknown session');
    assert.ok(mint > refuse, 'the refusal must come before the anonymous sign-in');
    // A session that DID come back is still reused, not re-minted.
    assert.match(body, /if \(result\.data\.session\) return \{ ok: true \}/);
  });
});

const LOCK = readFileSync(new URL('../src/features/glossary/GlossaryLockView.tsx', import.meta.url), 'utf8');

describe('GlossaryLockView: never presented over a Modal still closing', () => {
  it('holds its presentation for rootModalHoldMs() and re-renders when the hold ends', () => {
    assert.match(LOCK, /import \{ Modal, rootModalHoldMs \} from '\.\.\/\.\.\/components\/DimModal';/);
    assert.match(LOCK, /const holdMs = visible && !presentedRef\.current \? rootModalHoldMs\(\) : 0;/);
    assert.match(LOCK, /setTimeout\(\(\) => setHoldTick\(\(n\) => n \+ 1\), holdMs\)/);
    assert.match(LOCK, /const present = visible && holdMs <= 0;/);
  });

  it('the Modal is driven by the held flag, and once up it stays up', () => {
    assert.match(LOCK, /accessibilityViewIsModal\s+visible=\{present\}/);
    assert.doesNotMatch(LOCK, /visible=\{visible\}/);
    assert.match(LOCK, /if \(present\) presentedRef\.current = true;/);
    assert.match(LOCK, /if \(!visible\) presentedRef\.current = false;/);
  });
});
