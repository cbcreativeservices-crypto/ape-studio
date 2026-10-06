/**
 * Tidy list, hunt 5 (2026-10-03) — small honest-state fixes after the tier sweep.
 *
 * T1 Awards credential popup: STUDY NOW / GO TO MY ENROLLMENTS survive a
 *    failed membership read (`hasAccount || tierReadFailed`); the pick's
 *    persistence stays on `hasAccount`.
 * T2 StudyAreaExplore: the same for its Study / My enrollments doors.
 * T3 Flashcards MISTAKES side: an 'unconfirmed' gate says MEMBERSHIP_NOT_CONFIRMED,
 *    never "(No common-mistakes note written for this term yet…)".
 * T4 ToolInfo + Frequency Counter: LEARN / DEMO give way to the honest card on
 *    'unconfirmed' (no 🔒, not live buttons) — the Tools hub rule.
 * T5 'checking' bodies say "Checking your account…" (ToolGatePending, TubeCard).
 * T6 Settings Student ID row survives a failed read.
 * T7 Profile "Trophies & records" row hides only for a KNOWN non-member.
 * T8 Cymatics studios: a failed OPEN IN STUDIO read is told, not swallowed.
 * T9 Calc workflow EDIT: an unread workflow is said, and SAVE refuses over it.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('tidy hunt 5 (2026-10-03)', () => {
  it('T1 Awards popup study buttons survive a failed membership read', () => {
    const src = read('src/screens/awards/AwardsScreen.tsx');
    assert.match(src, /const showStudyNav = hasAccount \|\| tierReadFailed;/);
    assert.equal((src.match(/onStudy=\{showStudyNav \? studyFromDetail : undefined\}/g) ?? []).length, 2);
    assert.equal((src.match(/onEnrollments=\{showStudyNav \? enrollmentsFromDetail : undefined\}/g) ?? []).length, 2);
    assert.doesNotMatch(src, /onStudy=\{hasAccount/);
    // Persistence hold untouched.
    assert.match(src, /if \(!hasAccount\) return;/);
  });

  it('T2 StudyAreaExplore study doors survive a failed membership read', () => {
    const src = read('src/screens/courses/StudyAreaExplore.tsx');
    assert.match(src, /const showStudyNav = hasAccount \|\| tierReadFailed;/);
    assert.match(src, /onStudy=\{\s*showStudyNav\s*\?/);
    assert.match(src, /onEnrollments=\{\s*showStudyNav\s*\?/);
  });

  it('T3 Flashcards: an unconfirmed gate never claims the note is unwritten', () => {
    const src = read('src/screens/study/FlashcardsScreen.tsx');
    assert.match(src, /function levelText\(item: GlossaryItem, level: number, gate: MemberGate\)/);
    assert.match(src, /gate === 'unconfirmed'\s*\?\s*notConfirmed\('Common-mistakes notes'\)/);
    assert.match(src, /const notConfirmed = [^\n]*\n?[^\n]*\$\{MEMBERSHIP_NOT_CONFIRMED\}/);
    assert.match(src, /levelText\(card, level, memberGate\)/);
  });

  it('T4 ToolInfo + Frequency Counter: no live LEARN/DEMO on an unconfirmed gate', () => {
    const info = read('src/screens/tools/ToolInfoScreen.tsx');
    assert.match(info, /const gate = useMemberGate\(\);/);
    assert.match(info, /gate === 'unconfirmed' \? \(\s*<ToolGatePending gate="unconfirmed" \/>/);
    const fc = read('src/screens/tools/FrequencyCounterScreen.tsx');
    assert.match(fc, /\{unconfirmed \? \(\s*<ToolGatePending gate="unconfirmed" \/>/);
    assert.match(fc, /unconfirmed=\{memberGate === 'unconfirmed'\}/);
  });

  it('T5 checking bodies say "Checking your account…"', () => {
    const lock = read('src/screens/tools/ToolLockUi.tsx');
    assert.match(lock, /if \(gate === 'checking'\) return <Text style=\{styles\.note\}>Checking your account…<\/Text>;/);
    assert.doesNotMatch(lock, /if \(gate === 'checking'\) return null;/);
    const tube = read('src/screens/lab/tube/TubeCardScreen.tsx');
    const checking = tube.slice(tube.indexOf("if (gate === 'checking')"), tube.indexOf("if (gate === 'unconfirmed')"));
    assert.match(checking, /Checking your account…/);
    assert.match(checking, /accessibilityLabel="Back"/);
    assert.match(checking, /TUBE REFERENCE/);
  });

  it('T6 Settings Student ID row survives a failed read', () => {
    const src = read('src/screens/settings/SettingsScreen.tsx');
    assert.match(src, /\{!isGuest \|\| tierReadFailed \? \(\s*<View style=\{\[styles\.row, styles\.rowBorder\]\}>\s*<Text style=\{styles\.rowLabel\}>Student ID<\/Text>/);
  });

  it('T7 Profile Trophies & records row hides only for a known non-member', () => {
    const src = read('src/screens/profile/ProfileScreen.tsx');
    assert.match(src, /const memberGate = useMemberGate\(\);/);
    assert.match(src, /\{memberGate !== 'locked' \|\| caps\.achievements \? \(/);
    assert.doesNotMatch(src, /\{!resolved \|\| caps\.achievements \? \(/);
  });

  it('T8 Cymatics studios tell a failed OPEN IN STUDIO read', () => {
    for (const s of ['Liquid', 'Membrane', 'Plate']) {
      const src = read(`src/screens/lab/cymatics/${s}StudioScreen.tsx`);
      assert.match(src, /import \{ notify \} from '\.\.\/\.\.\/\.\.\/lib\/confirm';/, s);
      const tail = src.slice(src.indexOf('.getPattern(savedId)'));
      const effect = tail.slice(0, tail.indexOf('return () =>'));
      assert.doesNotMatch(effect, /\.catch\(\(\) => undefined\)/, s);
      assert.match(effect, /notify\('Pattern not opened', '[^']*couldn’t be opened just now\. It isn’t lost/, s);
      assert.doesNotMatch(src, /Alert\.alert/, s);
    }
  });

  it('T9 Calc workflow EDIT: unread is said and SAVE refuses over it', () => {
    const src = read('src/screens/lab/calc/CalcWorkflowEditScreen.tsx');
    assert.match(src, /workflowListUnreadable\(list\)/);
    assert.match(src, /setLoad\('unreadable'\)/);
    assert.match(src, /setLoad\('missing'\)/);
    assert.match(src, /if \(editingId && load !== 'loaded'\) \{/);
    // The guard runs before anything is written.
    const save = src.slice(src.indexOf('const saveOnce = async'));
    assert.ok(save.indexOf("load !== 'loaded'") < save.indexOf('saveWorkflow('));
    assert.match(src, /couldn’t be read just now\. It isn’t lost/);
    assert.match(src, /isn’t on this device any more/);
    assert.match(src, /load !== 'loaded' \? \(/);
  });
});
