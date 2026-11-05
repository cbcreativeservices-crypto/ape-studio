/**
 * Report 2026-11-05 item 24: emails sent straight from Help had no role= or
 * sid= unless Profile or Settings had been opened that session. The identity
 * is now filled at sign-in, and a read that cannot be trusted changes nothing.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildDataLine,
  clearFeedbackIdentity,
  fillFeedbackIdentity,
  getFeedbackIdentity,
  setFeedbackIdentity,
} from '../src/lib/feedbackTags.ts';

const src = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const reads = (over: Partial<Record<'sessionUid' | 'role' | 'studentId', unknown>> = {}) => {
  const answers = { sessionUid: 'u1', role: 'employer', studentId: 'APE-123', ...over };
  return {
    sessionUid: async () => answers.sessionUid as string | null | undefined,
    role: async () => answers.role as string,
    studentId: async () => answers.studentId as string | null | undefined,
  };
};

test('sign-in fill: no screen opened, and the data line carries role= and sid=', async () => {
  clearFeedbackIdentity();
  await fillFeedbackIdentity('u1', reads());
  const id = getFeedbackIdentity();
  assert.deepEqual(id, { studentId: 'APE-123', role: 'employer' });
  assert.equal(buildDataLine([['sid', id.studentId], ['role', id.role]]), 'APE-DATA v1 | sid=APE-123 | role=employer');
});

test('an account with no verified kind and no student id gets neither field', async () => {
  clearFeedbackIdentity();
  await fillFeedbackIdentity('u1', reads({ role: 'none', studentId: null }));
  assert.deepEqual(getFeedbackIdentity(), {});
});

test('a failed read leaves that field as it was', async () => {
  clearFeedbackIdentity();
  setFeedbackIdentity({ studentId: 'APE-OLD', role: 'instructor' });
  await fillFeedbackIdentity('u1', reads({ role: 'unknown', studentId: 'APE-123' }));
  assert.deepEqual(getFeedbackIdentity(), { studentId: 'APE-123', role: 'instructor' });
  await fillFeedbackIdentity('u1', reads({ role: 'employer', studentId: undefined }));
  assert.deepEqual(getFeedbackIdentity(), { studentId: 'APE-123', role: 'employer' });
});

test('a rejected read changes nothing and never throws', async () => {
  clearFeedbackIdentity();
  setFeedbackIdentity({ role: 'employer' });
  await fillFeedbackIdentity('u1', { ...reads(), studentId: () => Promise.reject(new Error('offline')) });
  assert.deepEqual(getFeedbackIdentity(), { role: 'employer' });
});

test('a read landing after a sign-out, an account switch or an unknown session is dropped', async () => {
  for (const sessionUid of [null, 'u2', undefined]) {
    clearFeedbackIdentity();
    await fillFeedbackIdentity('u1', reads({ sessionUid }));
    assert.deepEqual(getFeedbackIdentity(), {}, `session now ${sessionUid}`);
  }
});

test('the two auth events of one launch run one fill', async () => {
  clearFeedbackIdentity();
  let roleReads = 0;
  const r = { ...reads(), role: async () => { roleReads += 1; return 'employer'; } };
  await Promise.all([fillFeedbackIdentity('u1', r), fillFeedbackIdentity('u1', r)]);
  assert.equal(roleReads, 1);
  await fillFeedbackIdentity('u1', r); // a later sign-in reads again
  assert.equal(roleReads, 2);
});

test('wiring: filled after the wipe, for a real account only, and lazily', () => {
  const sync = src('src/features/account/accountLocalSync.ts');
  assert.match(
    sync,
    /chain = chain\.then\(\(\) => settleSessionCarry\(\)\)\.catch\(\(\) => \{\}\);\n(\s+\/\/.*\n)*\s+if \(identity\) chain = chain\.then\(\(\) => fillFeedbackIdentitySoon\(identity\)\)/,
  );
  assert.match(sync, /const identity = isRealAccount\(session\) \? \(session\?\.user\?\.id \?\? ''\) : '';/);
  // A `require` in a function: the start graph must not gain the feedback modules.
  assert.match(sync, /require\('\.\/feedbackIdentityFill'\)/);
  assert.doesNotMatch(sync, /^import .*feedback/m);
});

test('wiring: the fill loads feedback.ts, which registers the sign-out reset', () => {
  const fill = src('src/features/account/feedbackIdentityFill.ts');
  assert.match(fill, /^import '\.\.\/\.\.\/lib\/feedback';$/m);
  assert.match(src('src/lib/feedback.ts'), /registerLocalStoreReset\(clearFeedbackIdentity\);/);
  assert.match(fill, /fillFeedbackIdentity\(uid, \{ sessionUid, role: myVerifierKind, studentId \}\)/);
});
