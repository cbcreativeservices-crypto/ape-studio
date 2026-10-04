/**
 * DEEP-DIVE A — topic / certificate / program completion (2026-10-03).
 *
 * Receipts for the client bugs found tracing completion end to end. Each test
 * fails on HEAD cf0b9c7e and passes with the fix. Source-reading, because the
 * screens import React Native and the API modules import the Supabase client.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8');

describe('DD-A1 · a passed Final Exam that issued nothing is not told "added to your record"', () => {
  // submit_final_exam (live) awards only IF v_passed AND v_month_ok AND
  // has_academy_access(auth.uid()). A paper submitted after a refund / a lapsed
  // cycle, or replayed from the offline queue later, returns outcome 'pass'
  // with credential_awarded false.
  it('the result screen picks different words, and no View on Profile, when credential_awarded is not true', () => {
    const src = read('screens/exam/FinalExamResultScreen.tsx');
    assert.match(
      src,
      /const passNotIssued = result\.outcome === 'pass' && result\.credential_awarded !== true;/,
      'the screen must derive pass-without-award from credential_awarded',
    );
    assert.match(src, /const copy = passNotIssued \? PASS_NOT_ISSUED :/, 'the pass copy must not be used for it');
    assert.match(src, /result\.outcome === 'pass' && !passNotIssued && \(/, 'View on Profile only when issued');
    const notIssued = src.slice(src.indexOf('const PASS_NOT_ISSUED'), src.indexOf('function fmtLockout'));
    assert.ok(!/added to your record/.test(notIssued), 'the not-issued words must not claim the record');
  });

  it('the offline-replay notice on the Dashboard says the same', () => {
    const api = read('features/finalExam/api.ts');
    assert.match(api, /export const EXAM_PASS_NOT_ISSUED_COPY =/);
    const dash = read('screens/dashboard/DashboardScreen.tsx');
    assert.match(
      dash,
      /result\.outcome === 'pass' && result\.credential_awarded !== true\s*\?\s*EXAM_PASS_NOT_ISSUED_COPY/,
      'a replayed pass with no award must not print EXAM_OUTCOME_COPY.pass',
    );
  });
});

describe('DD-A2 · NEXT UP never shows the catalog count for a member whose exact read failed', () => {
  it('fetchNearestCredential throws for a signed-in account when fetchAwardProgress answered null', () => {
    const src = read('features/achievements/api.ts');
    const fn = src.slice(src.indexOf('export async function fetchNearestCredential'));
    assert.match(
      fn,
      /if \(exact == null\) \{\s*const me = await myUserRowOrThrow<\{ id: string \}>\('id'\);\s*if \(me\?\.id\) throw/,
      'a failed exact read for a member must surface as a failure, not "12 of 12 topics complete"',
    );
  });
});

describe('DD-A3 · the credential lab-requirements sheet never says "0 of N" on an unreadable lab record', () => {
  it('reads useLabCompletionUnreadable and replaces the summary with the honest line', () => {
    const src = read('components/LabRequirementsSheet.tsx');
    assert.match(src, /const progressUnreadable = useLabCompletionUnreadable\(\);/);
    assert.match(
      src,
      /\{progressUnreadable \? \(\s*<Text[^>]*>\{CREDENTIAL_LAB_PROGRESS_UNREADABLE\}<\/Text>\s*\) : \(\s*<LabChecklistSummary rows=\{all\} \/>/,
      'LabChecklistSummary must not render while the record is unreadable',
    );
    const kit = read('screens/lab/kit/labEnd.ts');
    const line = kit.match(/export const CREDENTIAL_LAB_PROGRESS_UNREADABLE =\s*'([^']+)'/);
    assert.ok(line, 'the sibling wording lives in labEnd.ts');
    assert.ok(!/Leave this lab/.test(line![1]), 'a credential sheet has no lab to leave');
  });
});
