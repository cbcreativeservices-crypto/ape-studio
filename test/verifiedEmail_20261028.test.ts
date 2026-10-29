/**
 * Must-do D23 (b): the applicant "You're verified" email, sent once by
 * supabase/functions/employer-verified-email when a database trigger sees an
 * application become approved (Comp A's design, 2026-10-28).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { NEXT_STEPS as WEB } from '../web/lib/verifiedNextSteps.ts';
import { NEXT_STEPS as FN } from '../supabase/functions/employer-verified-email/copy.ts';
import { buildEmail, richHtml } from '../supabase/functions/employer-verified-email/email.ts';

const fnDir = join(import.meta.dirname, '..', 'supabase', 'functions');
const src = (p: string) => readFileSync(join(fnDir, p), 'utf8').replace(/\r\n/g, '\n');

describe('applicant verified email (D23 b)', () => {
  it('uses exactly the owner-approved website wording', () => {
    assert.deepEqual(JSON.parse(JSON.stringify(FN)), JSON.parse(JSON.stringify(WEB)));
  });

  it('builds the instructor and employer versions, bold markers become <b>, text is escaped', () => {
    const i = buildEmail('instructor', 'Acme <School>');
    assert.match(i.html, /instructor account for Acme &lt;School&gt; is active/);
    assert.match(i.html, /proaudiotrainingacademy\.com\/instructor/);
    assert.doesNotMatch(i.html, /\*\*/);
    assert.doesNotMatch(i.text, /\*\*|<b>/);
    const e = buildEmail('employer', 'Acme');
    assert.match(e.html, /<b>Employer account<\/b>/);
    assert.match(e.text, /^1\. Get the Pro Audio Training Academy app/m);
    // Owner 2026-10-28: the email says "on our website", not "here".
    assert.match(e.text, /^2\. Sign in with the same email and password you used on our website\.$/m);
    assert.doesNotMatch(e.html + i.html, /you used here/);
    assert.equal(richHtml('a **<x>**'), 'a <b>&lt;x&gt;</b>');
    assert.match(buildEmail('something-else', '').html, /employer account for your organization/);
  });

  it('accepts only the service role, sends once (claim RPC), and releases on a failed send', () => {
    const s = src('employer-verified-email/index.ts');
    assert.match(s, /auth !== `Bearer \$\{service\}` && !isServiceRoleJwt\(auth\)/);
    assert.match(s, /rpc\("employer_claim_verified_email"/);
    assert.match(s, /rpc\("employer_release_verified_email"/);
    assert.ok(s.indexOf('employer_claim_verified_email') < s.indexOf('fetch(RESEND_URL'));
  });

  it('every employer mail uses the sender that is set (EMPLOYER_MAIL_FROM), never the old "AP&E" name', () => {
    for (const f of ['employer-verified-email/index.ts', 'employer-confirm-email/index.ts', 'employer-apply-finalize/index.ts']) {
      const s = src(f);
      assert.match(s, /Deno\.env\.get\("EMPLOYER_MAIL_FROM"\) \?\? Deno\.env\.get\("EMAIL_FROM"\) \?\?/, f);
      assert.doesNotMatch(s, /AP&E Pro Audio Training/, f);
    }
  });
});
