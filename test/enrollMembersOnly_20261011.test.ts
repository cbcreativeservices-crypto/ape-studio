/**
 * ENROLLING IS FOR MEMBERS (owner 2026-10-11).
 *
 * "do not allow non members to add topics, certificates, etc into enrollments
 * anymore. they need to know immediately that this is only for members."
 *
 * 1. The gate opens ONLY on 'open' (or for a request made up entirely of the
 *    two free topics). 'locked', 'checking' and 'unconfirmed' change nothing.
 * 2. RATCHET: every screen call to an enrollment ADD function goes through
 *    `guardEnroll(` (src/features/enrollment/useEnrollGate.ts). A call that is
 *    not inside a guardEnroll(...) within the few lines above it fails, unless
 *    it is on ALLOWED below — and ALLOWED may only SHRINK.
 * 3. The old guest "won't be saved without an account" enroll prompts are gone.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { enrollDecisionOf, enrollLockedBody } from '../src/features/enrollment/enrollGate.ts';

const FREE = new Set([3060, 3970]);
const isFree = (gs: number) => FREE.has(gs);

test('the enroll gate opens only on open', () => {
  for (const gate of ['open', 'locked', 'checking', 'unconfirmed'] as const) {
    const d = enrollDecisionOf(gate, [3001, 3002], isFree);
    assert.equal(d, gate === 'open' ? 'add' : gate, gate);
    // No gs list (unknown contents) is never treated as free.
    assert.equal(enrollDecisionOf(gate, undefined, isFree), gate === 'open' ? 'add' : gate);
    assert.equal(enrollDecisionOf(gate, [], isFree), gate === 'open' ? 'add' : gate);
  }
});

test('the two free topics can be added back by anyone; a mix with a paid topic cannot', () => {
  for (const gate of ['locked', 'checking', 'unconfirmed'] as const) {
    assert.equal(enrollDecisionOf(gate, [3060], isFree), 'add');
    assert.equal(enrollDecisionOf(gate, [3060, 3970], isFree), 'add');
    assert.equal(enrollDecisionOf(gate, [3060, 3001], isFree), gate);
  }
});

test('the popup says members only, and only a known guest is told they are not signed in', () => {
  assert.match(enrollLockedBody(false), /Academy members only/);
  assert.match(enrollLockedBody(false), /My Enrollments/);
  assert.doesNotMatch(enrollLockedBody(false), /not signed in/);
  assert.match(enrollLockedBody(true), /not signed in/);
  assert.doesNotMatch(enrollLockedBody(true), /\bfree\b/i);
});

test('the hook uses the house helpers and adds only on the add decision', () => {
  const src = readFileSync('src/features/enrollment/useEnrollGate.ts', 'utf8');
  assert.match(src, /useMemberGate\(\)/);
  assert.match(src, /useUpsellAllowed\(\)/);
  assert.match(src, /useGuestWording\(\)/);
  assert.match(src, /openMembershipGate\(/);
  assert.doesNotMatch(src, /Alert\.alert/);
  // add() runs in exactly one place, behind the 'add' decision.
  assert.equal((src.match(/\badd\(\);/g) ?? []).length, 1);
  assert.match(src, /if \(decision === 'add'\) \{\s*add\(\);/);
});

const ADD_FNS = ['addTopics', 'addTopicsUnloaded', 'addTopic', 'toggleTopic', 'addBundle', 'ensureStudyTopic'];
const CALL = new RegExp(`(?<![\\w.])(${ADD_FNS.join('|')})\\(`, 'g');
/** How far above a call its guardEnroll( may open. */
const WINDOW = 6;

/** file → number of ungated calls allowed (may only shrink). */
// Empty at birth. (DashboardScreen's STUDY NOW hand-off enrolls a member
// directly on the line after its guardEnroll branch for a KNOWN non-member —
// it sits inside the window, see the test below.)
const ALLOWED: Record<string, number> = {};

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p.replace(/\\/g, '/'));
  }
  return out;
}

test('RATCHET: every screen call to an enrollment add goes through guardEnroll', () => {
  const offenders: string[] = [];
  const counts: Record<string, number> = {};
  for (const file of walk('src/screens')) {
    const src = readFileSync(file, 'utf8');
    if (!/features\/enrollment\/(enrollmentStore|enrolledBundlesStore)/.test(src)) continue;
    const lines = src.split(/\r?\n/);
    lines.forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // comments
      if (/^\s*import\b/.test(line) || /^\s*(\w+,\s*)*\w+,?\s*$/.test(line)) return; // import lists
      CALL.lastIndex = 0;
      if (!CALL.test(line)) return;
      const above = lines.slice(Math.max(0, i - WINDOW), i + 1).join('\n');
      if (/guardEnroll\(/.test(above)) return;
      counts[file] = (counts[file] ?? 0) + 1;
      offenders.push(`${file}:${i + 1}: ${line.trim()}`);
    });
  }
  for (const [file, n] of Object.entries(counts)) {
    const allowed = ALLOWED[file] ?? 0;
    assert.ok(n <= allowed, `ungated enrollment add(s) — wrap in guardEnroll (useEnrollGate):\n${offenders.filter((o) => o.startsWith(file)).join('\n')}`);
  }
  // The allowlist may only shrink: an entry that is no longer needed must go.
  for (const [file, allowed] of Object.entries(ALLOWED)) {
    assert.equal(counts[file] ?? 0, allowed, `${file}: ALLOWED is stale — lower it to ${counts[file] ?? 0}`);
  }
});

test('the STUDY NOW hand-off gates a known non-member', () => {
  const src = readFileSync('src/screens/dashboard/DashboardScreen.tsx', 'utf8');
  assert.match(src, /if \(memberGate === 'locked'\) guardEnroll\(\(\) => void ensureStudyTopic\(focusGs\), \[focusGs\]\);/);
});

test('every enroll entry point imports the shared gate', () => {
  for (const f of [
    'src/screens/awards/AwardsScreen.tsx',
    'src/screens/courses/StudyAreaExplore.tsx',
    'src/screens/curriculum/CurriculumScreen.tsx',
    'src/screens/careerfinder/CareerFamilyScreen.tsx',
    'src/screens/enrollment/EnrollmentScreen.tsx',
    'src/screens/dashboard/DashboardScreen.tsx',
  ]) {
    assert.match(readFileSync(f, 'utf8'), /useEnrollGate\(\)/, f);
  }
});

test('the guest "won\'t be saved" ENROLL prompts are gone (a non-member never enrolls now)', () => {
  for (const f of ['src/screens/awards/AwardsScreen.tsx', 'src/screens/courses/StudyAreaExplore.tsx']) {
    const src = readFileSync(f, 'utf8');
    assert.doesNotMatch(src, /setPayPrompt/, f);
    assert.doesNotMatch(src, /won’t be saved without an account/, f);
  }
});
