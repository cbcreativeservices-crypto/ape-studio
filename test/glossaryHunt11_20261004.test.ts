/**
 * GLOSSARY — hunt 11 (2026-10-04). Section B re-audit first (perf f578503d:
 * renderEntryRow + strictMode, deferred search, corpus before the lock,
 * NAME_HITS, the probe warm-ups; a5d4614e: `resolved` on a remembered tier),
 * then K1–K12 across the area.
 *
 * 1. (K1) "Couldn't read the session" was taken as a DIFFERENT READER. The
 *    Glossary's mount read used `safeSession`, which answers a stalled read —
 *    or an expired token whose refresh could not reach the server
 *    (AuthRetryableFetchError; the session stays stored) — as `session: null`,
 *    and set `readerUid` to null. Its auth listener did the same with the
 *    INITIAL_SESSION every new listener is handed, which auth-js sends as NULL
 *    whenever its session read errors (GoTrueClient._emitInitialSession). The
 *    reader-change effect (ENTRIES_UID !== readerUid) then treated the same
 *    signed-in person as a sign-out: every definition and detail on screen
 *    blanked, the session's fallback charges forgotten (SESSION_FALLBACK_CHARGED
 *    — K7), SAVE ALL stopped, reads in flight dropped — and all of it again
 *    when the token refreshed and the same uid came back.
 *
 * Receipts: both tests FAILED on HEAD 784bb36f (R2).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const SCREEN = readFileSync(new URL('../src/screens/glossary/GlossaryScreen.tsx', import.meta.url), 'utf8');

/** The device-key mount effect: from the session read to the listener's end. */
function sessionBlock(): string {
  const start = SCREEN.indexOf("(supabase.auth.getSession(), 'Glossary')");
  assert.ok(start >= 0, 'the Glossary mount session read was not found');
  const end = SCREEN.indexOf('sub.subscription.unsubscribe();', start);
  assert.ok(end > start, 'the Glossary auth listener was not found');
  return SCREEN.slice(start - 40, end)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

describe('glossary: an unreadable session is not a different reader (K1)', () => {
  it('the mount read tells "stalled / unreachable" apart and leaves the reader as it was', () => {
    const b = sessionBlock();
    assert.match(b, /safeSessionResult\(supabase\.auth\.getSession\(\), 'Glossary'\)/);
    const guard = b.indexOf('if (timedOut) return;');
    const setUid = b.indexOf('setReaderUid(data.session?.user?.id ?? null);');
    assert.ok(guard >= 0, 'a timed-out / unreachable session read still settles the reader');
    assert.ok(setUid > guard, 'the reader must only be set after the timedOut check');
  });

  it('the listener ignores a NULL INITIAL_SESSION (an errored read, not a sign-out)', () => {
    const b = sessionBlock();
    const listener = b.slice(b.indexOf('supabase.auth.onAuthStateChange('));
    const skip = listener.search(/if \(event === 'INITIAL_SESSION' && !session\) return;/);
    const setUid = listener.indexOf('setReaderUid(session?.user?.id ?? null);');
    assert.ok(skip >= 0, 'a null INITIAL_SESSION still reads as a different reader');
    assert.ok(setUid > skip, 'the skip must come before the reader is set');
  });

  it('a real sign-out still changes the reader (SIGNED_OUT and later events are untouched)', () => {
    const b = sessionBlock();
    const listener = b.slice(b.indexOf('supabase.auth.onAuthStateChange('));
    // Only INITIAL_SESSION with no session is skipped; every other event still lands.
    assert.doesNotMatch(listener, /event === 'SIGNED_OUT'\) return/);
    assert.match(listener, /setHasSession\(!!session\);\s*setReaderUid\(session\?\.user\?\.id \?\? null\);/);
  });
});
