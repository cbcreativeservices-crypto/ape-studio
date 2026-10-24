/**
 * labKit — overnight toddler pass 1 (2026-10-24) receipts.
 *
 * 1. THE PRO NOTE PRESENTED DURING THE TERM POPUP'S DISMISSAL (K10 class).
 *    Since 2026-10-19 a Mixing-family lab (Beginning / Advanced Mixing,
 *    Mastering, Mixing Guides) opens with the glossary TERM popup first, and
 *    the "Knowing When to Bring In a Pro" note waits for it through
 *    useScreenIntro's `useLabTermIntroOwed()` hold. CONTINUE clears `owed` in
 *    the same commit that unmounts the term popup's Modal, so the note's
 *    Modal was presented WHILE the term popup was still animating away. iOS
 *    refuses that presentation (DimModal: HOST_DISMISS_MS / rootModalHoldMs):
 *    nothing appears, the note is never marked seen, and its refused Modal
 *    stays registered as an open host — so the next root popup (the audio
 *    gate on the mixer's ▶, an AppDialog) is drawn INTO an invisible host and
 *    the lab's ▶ reads dead. Every other follower of a closing Modal in the
 *    app waits the fade out (TopicWelcomeSheet, LabTermIntro, AppDialog, the
 *    audio gate); the note now does too.
 *
 * Screens import React Native, so these are source receipts (house style).
 * R2: the [R2] test FAILED against the pre-fix copy of src/features/lab/ProNote.tsx
 * (copied aside, original restored, test run, fix restored).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const code = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

describe('labKit night 1 — Pro note waits out the term popup dismissal', () => {
  const proNote = code('src/features/lab/ProNote.tsx');
  const intro = code('src/features/intro/ScreenIntroOverlay.tsx');
  const term = code('src/features/intro/LabTermIntro.tsx');

  it('the path: CONTINUE lifts the hold at once, and useScreenIntro has no fade wait of its own', () => {
    // CONTINUE → dismissed → owed false → setLabTermIntroOwed(id, false) before paint.
    assert.match(term, /const onContinue = useCallback\(\(\) => \{\s*setDismissed\(true\);/);
    assert.match(term, /useLayoutEffect\(\(\) => \{\s*setLabTermIntroOwed\(id, owed\);/);
    // useScreenIntro's visible flips with the hold, no rootModalHoldMs.
    assert.match(intro, /visible: visible && focused && !suppressed && !hold && !labTermFirst/);
    assert.doesNotMatch(intro, /rootModalHoldMs/);
  });

  it('[R2] ProNoteIntro waits rootModalHoldMs before presenting, and stays up once presented', () => {
    assert.match(proNote, /import \{ Modal, rootModalHoldMs \} from '\.\.\/\.\.\/components\/DimModal';/);
    const body = proNote.slice(proNote.indexOf('export function ProNoteIntro'), proNote.indexOf('export function ProNoteButton'));
    assert.match(body, /const presentedRef = useRef\(false\);/);
    assert.match(body, /if \(!visible\) presentedRef\.current = false;/);
    assert.match(body, /const holdMs = visible && !presentedRef\.current \? rootModalHoldMs\(\) : 0;/);
    assert.match(body, /setTimeout\(\(\) => setHoldTick\(\(n\) => n \+ 1\), holdMs\)/);
    assert.match(body, /return \(\) => clearTimeout\(t\);/);
    assert.match(body, /const show = visible && \(presentedRef\.current \|\| holdMs <= 0\);/);
    assert.match(body, /if \(!show\) return null;/);
    // `owed` still reported throughout the wait (the guest reminder keeps holding).
    assert.match(body, /onOwed\?\.\(owed\);/);
  });
});
