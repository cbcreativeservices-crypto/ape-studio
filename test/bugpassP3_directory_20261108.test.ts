/**
 * Bug pass 2026-11-08, pass 3 (final), group "directory". One block per bug
 * ID; see scratchpad/bugpass/FIX_P3_directory.md for the write-up.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  SIGN_IN_TO_SEE_DIRECTORY,
  acceptsContact,
  contactOffer,
  failedReadLine,
} from '../src/features/directory/rules.ts';
import { memberCardA11y } from '../src/features/directory/kinds.ts';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
/** Source with comments blanked, so a comment can never satisfy a check. */
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));

describe('CODE-3-07: no em dash in member text on the Directory (Pro Registry) screen', () => {
  const F = 'src/screens/directory/DirectoryScreen.tsx';

  it('no em dash outside comments', () => {
    const lines = code(F)
      .split('\n')
      .map((l, i) => [i + 1, l] as const)
      .filter(([, l]) => l.includes('—'));
    assert.deepEqual(lines, []);
  });

  it('the six lines keep their meaning with a full stop or comma', () => {
    const s = read(F);
    assert.match(s, /through the \{BRAND_PHRASE\}, even if you no longer/);
    assert.match(s, /'Couldn’t load your Registry name\. Check your connection\.'/);
    assert.match(s, /'Add your Registry name\. Tap SET UP MY PROFILE below\.'/);
    assert.match(s, /Couldn’t load your verification QR\. Check your connection\. Your credentials are/);
    assert.match(s, /switch on your Registry listing\.\n\s*You get a page you can hand/);
    assert.match(s, /add your information\. You don’t need a paid or active membership/);
  });
});

describe('UI-3-04: a failed read whose only button is SIGN IN says so in words', () => {
  const NET = 'No connection. Check your signal and try again.';
  const FALLBACK = 'Couldn’t load this. Check your connection and try again.';

  it('a known guest reads the sign-in line, never "check your connection"', () => {
    assert.equal(failedReadLine(true, NET, FALLBACK), SIGN_IN_TO_SEE_DIRECTORY);
    assert.equal(failedReadLine(true, null, FALLBACK), 'Sign in to see the directory.');
    assert.equal(failedReadLine(true, NET, FALLBACK, 'Sign in to see your contact requests.'), 'Sign in to see your contact requests.');
    assert.doesNotMatch(failedReadLine(true, NET, FALLBACK), /connection|signal/i);
  });

  it('a server answer that already says "Sign in" is kept as it is', () => {
    const m = 'Your session has ended. Sign in again to continue.';
    assert.equal(failedReadLine(false, m, FALLBACK), m);
    assert.equal(failedReadLine(true, m, FALLBACK), m);
  });

  it('a signed-in member keeps the read message (RETRY), or the fallback when there is none', () => {
    assert.equal(failedReadLine(false, NET, FALLBACK), NET);
    assert.equal(failedReadLine(false, null, FALLBACK), FALLBACK);
    assert.equal(failedReadLine(false, '', FALLBACK), FALLBACK);
  });

  it('the words and the button share one sign-in test', () => {
    const bits = code('src/screens/directory/directoryBits.tsx');
    assert.match(bits, /export function needsSignIn\(guest: boolean, message: string \| null \| undefined\): boolean \{\s*return guest \|\| \/\\bSign in\\b\/\.test\(message \?\? ''\);/);
    assert.match(bits, /export function useFailedReadLine\(\)[\s\S]*?const \{ guest \} = useGuestWording\(\);[\s\S]*?failedReadLine\(guest, message, fallback, signInLine\)/);
  });

  it('every directory banner over RetryOrSignIn goes through the line', () => {
    const ex = code('src/screens/directory/ExploreView.tsx');
    assert.match(ex, /<Banner tone="warn">\{failLine\(err\)\}<\/Banner>[\s{}]*<RetryOrSignIn message=\{err\}/);
    const mp = code('src/screens/directory/MyProfileView.tsx');
    assert.match(mp, /<Banner tone="warn">\s*\{failLine\(\s*loadErr,\s*'Couldn’t load your community profile\. Check your connection and try again\.',\s*'Sign in to see your community profile\.',\s*\)\}\s*<\/Banner>[\s{}]*<RetryOrSignIn message=\{loadErr\}/);
    const rq = code('src/screens/directory/RequestsView.tsx');
    assert.match(rq, /<Banner tone="warn">\{failLine\(loadErr, loadErr \?\? '', 'Sign in to see your contact requests\.'\)\}<\/Banner>[\s{}]*<RetryOrSignIn/);
    assert.match(rq, /\$\{failLine\(loadErr, loadErr \?\? '', 'Sign in to see your contact requests\.'\)\} Showing the last list that loaded\./);
    for (const s of [ex, mp, rq]) {
      assert.doesNotMatch(s, /<Banner tone="warn">\{(err|loadErr)\}<\/Banner>[\s{}]*<RetryOrSignIn/, 'no raw failed-read message over RetryOrSignIn');
      // Hooks before any early return.
      assert.ok(s.indexOf('const failLine = useFailedReadLine();') > 0);
    }
  });
});

describe('UI-3-08 / CODE-3-09: the card label and green light follow the sheet rule', () => {
  const base = { displayName: 'Maya R.', plate: 'GRADUATE', primaryArea: 'Live Sound & Events', roles: [], credentialCount: 0 };

  it('acceptsContact equals contactOffer === "send" whenever Open To is known', () => {
    for (const contactEnabled of [true, false]) {
      for (const openTo of [[], ['hiring']]) {
        assert.equal(acceptsContact({ contactEnabled, openTo }), contactOffer({ contactEnabled, openTo }) === 'send');
      }
    }
  });

  it('a search row with no Open To field falls back to contact_enabled (server change held for Comp A)', () => {
    assert.equal(acceptsContact({ contactEnabled: true }), true);
    assert.equal(acceptsContact({ contactEnabled: false }), false);
    assert.match(read('src/features/directory/rules.ts'), /SERVER change, held for\s*\n\s*\* Comp A/);
  });

  it('the screen-reader label says "open to contact" only when a request could be sent', () => {
    assert.match(memberCardA11y({ ...base, contactEnabled: true, openTo: ['hiring'] }), /open to contact$/);
    assert.doesNotMatch(memberCardA11y({ ...base, contactEnabled: true, openTo: [] }), /open to contact/);
    assert.doesNotMatch(memberCardA11y({ ...base, contactEnabled: false, openTo: ['hiring'] }), /open to contact/);
    assert.match(memberCardA11y({ ...base, contactEnabled: true }), /open to contact$/);
  });

  it('the card LED and label use acceptsContact, not contactEnabled alone', () => {
    const ex = code('src/screens/directory/ExploreView.tsx');
    assert.match(ex, /led=\{acceptsContact\(r\) \? 'green' : 'off'\}/);
    assert.doesNotMatch(ex, /led=\{r\.contactEnabled/);
    const k = code('src/features/directory/kinds.ts');
    assert.match(k, /acceptsContact\(c\) \? 'open to contact' : null/);
    assert.doesNotMatch(k, /c\.contactEnabled \? 'open to contact'/);
  });
});
