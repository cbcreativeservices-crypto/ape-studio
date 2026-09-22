/**
 * Every auth read is bounded. No exceptions but the two that own the pattern.
 *
 * ⛔ WHY A REPO-WIDE GUARD AND NOT A LIST. This class has been "fixed" three
 * times and was incomplete each time:
 *
 *  1. SplashScreen fixed its own stall in QA Wave D (2026-09-10) and nowhere else.
 *  2. A sweep on 2026-09-21 converted fifteen call sites and was reported as
 *     complete. It had grepped `auth.getSession()` on ONE LINE, and six sites
 *     write it across two — including the app's BOOT read, whose stall leaves
 *     Home on a permanent bare spinner.
 *  3. That sweep was framed around one method name, so `getUser()` — a NETWORK
 *     round trip, unbounded in a second way — was never covered at all.
 *
 * `.catch()` does not help: a promise that never settles rejects nothing. The
 * user sees a screen that never finishes, with no error for any boundary to
 * catch, and because the cause is a stored value, force-quitting reproduces it.
 * A tester hit exactly that on 2026-09-21.
 *
 * So this matches the CALL, multiline, and allows only the two files that are
 * the pattern itself.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

const ROOT = new URL('../src/', import.meta.url);

/** The helper itself, and Splash's own local race which predates it. */
const ALLOWED = ['lib/getSessionSafe.ts', 'screens/SplashScreen.tsx'];

const walk = (dir: URL): URL[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? walk(new URL(e.name + '/', dir))
      : /\.tsx?$/.test(e.name)
        ? [new URL(e.name, dir)]
        : [],
  );

const rel = (u: URL) =>
  decodeURIComponent(u.pathname).slice(decodeURIComponent(ROOT.pathname).length);

const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

test('no auth.getSession() or auth.getUser() is awaited unbounded', () => {
  const offenders: string[] = [];
  for (const file of walk(ROOT)) {
    const name = rel(file).split('\\').join('/');
    if (ALLOWED.includes(name)) continue;
    const src = stripComments(readFileSync(file, 'utf8'));
    // The call, however it is spaced or line-broken.
    for (const m of src.matchAll(/auth\s*\.\s*(getSession|getUser)\s*\(/g)) {
      // Legitimate uses pass the promise INTO the helper, so the call is
      // preceded by safeSession( / safeUser( / hasSafeSession( on the same
      // expression. Look back a short way for one of those.
      const before = src.slice(Math.max(0, m.index! - 120), m.index!);
      if (!/(safeSession|safeUser|hasSafeSession)\s*\(/.test(before)) {
        offenders.push(`${name} → auth.${m[1]}()`);
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    'these can hang forever, and a .catch() cannot save them:\n' + offenders.join('\n'),
  );
});

test('the helper still bounds BOTH shapes', () => {
  const src = readFileSync(new URL('lib/getSessionSafe.ts', ROOT), 'utf8');
  assert.match(src, /export async function safeSession/, 'session reads');
  assert.match(src, /export async function safeUser/, 'user reads — the network one');
  assert.match(src, /SESSION_TIMEOUT_MS/, 'a bound must exist');
});
