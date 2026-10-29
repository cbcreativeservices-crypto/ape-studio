/**
 * Must-do D23 (owner 2026-10-28: wording approved, "Website first" for
 * instructors, gate fix approved). A verified employer or instructor sees a
 * "What to do next" checklist on the apply form's verified screen and on the
 * status page, and nothing on that path lands on the site-key screen while the
 * site is gated.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { NEXT_STEPS, boldParts, nextStepsFor } from '../web/lib/verifiedNextSteps.ts';

const web = (p: string) => readFileSync(join(import.meta.dirname, '..', 'web', p), 'utf8').replace(/\r\n/g, '\n');
const proxy = web('proxy.ts');

describe('verified next steps (D23)', () => {
  it('has an employer and an instructor version, with no unfilled blanks', () => {
    for (const k of ['employer', 'instructor'] as const) {
      const all = [...NEXT_STEPS[k].steps, ...NEXT_STEPS[k].footer].join('\n');
      assert.ok(NEXT_STEPS[k].steps.length >= 5, k);
      assert.doesNotMatch(all, /[⟨⟩]/, `${k} still has a ⟨…⟩ blank`);
      assert.equal(all.split('**').length % 2, 1, `${k}: unbalanced ** markers`);
    }
  });

  it('instructors are sent to the website page for their code and their students', () => {
    const s = NEXT_STEPS.instructor.steps.join('\n');
    assert.match(s, /proaudiotrainingacademy\.com\/instructor/);
    assert.match(s, /never their answers/);
    assert.match(s, /Name on your certificates/);
  });

  it('picks the version by kind; anything else gets the employer version', () => {
    assert.equal(nextStepsFor('instructor'), NEXT_STEPS.instructor);
    assert.equal(nextStepsFor('employer'), NEXT_STEPS.employer);
    assert.equal(nextStepsFor(null), NEXT_STEPS.employer);
  });

  it('bold markers split into parts', () => {
    assert.deepEqual(boldParts('a **b** c'), [
      { text: 'a ', bold: false },
      { text: 'b', bold: true },
      { text: ' c', bold: false },
    ]);
  });

  it('shows on the apply form only when approved, and on the status page only when approved', () => {
    assert.match(web('components/EmployerApplyForm.tsx'), /\{status === "approved" \? <VerifiedNextSteps kind=\{kind\} \/> : null\}/);
    assert.match(web('components/EmployerStatus.tsx'), /\{app\.status === "approved" \? <VerifiedNextSteps kind=\{app\.kind\} \/> : null\}/);
  });

  it('the whole verified path is public while gated, exact match, before the cookie check, no cookie set', () => {
    for (const p of ['/employers/apply', '/api/employers/apply', '/employers/account', '/login', '/reset-password', '/get', '/instructor']) {
      assert.ok(proxy.includes(`legalPublic === "${p}"`), `${p} not public`);
    }
    const first = proxy.indexOf('legalPublic === "/api/employers/apply"');
    assert.ok(first > 0 && proxy.indexOf('request.cookies.get(GATE_COOKIE)') > first);
    const block = proxy.slice(proxy.indexOf('legalPublic === "/employers/apply"'), proxy.indexOf('return NextResponse.next();', first));
    assert.doesNotMatch(block, /cookies\.set/);
  });
});
