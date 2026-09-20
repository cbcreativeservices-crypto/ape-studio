# ⛔ Two employer functions are written but NOT DEPLOYED

**Written 2026-09-20 by ccode. Needs the owner's go, and one env var, before it does anything.**

- `employer-issue-code/` — mints the six-digit code, mails it to the work address, records it
- `employer-confirm-email/` — checks the code (thin wrapper over the RPC the form already expects)

## Why they were written

Bug pass 1 found the employer work-email flow was a guaranteed dead end. The **database half was
built** on 2026-09-19 — `employer_issue_email_code`, `employer_confirm_work_email`, and the
`employer_decide` rule that queues any application whose work email is unconfirmed. **Nothing ever
called it.** The apply flow probed the domain, emailed the admin, and returned `{ ok: true }`, which
the form read as "code sent" and announced to the applicant in bold with their own address in it.
No mail was ever sent. There was no exit from that screen. `employer-confirm-email`, which the form
invokes at step two, did not exist at all. And because no application could ever confirm its work
email, every one of them landed permanently flagged **WORK EMAIL NOT CONFIRMED** — which also
blocked auto-approval.

The standing note that employer accounts are "BUILT END TO END" is true of the SQL. The client and
edge layer between the form and the SQL was missing.

## What is already safe, with or without a deploy

The apply form no longer claims a code was sent. It now requires the server to actually return
`sent_to` before it shows the code screen; otherwise it falls through to the honest branch that says
the application **was saved** and a person will review it. That is true today.

So the failure mode with these functions undeployed is *correct behaviour with manual review*, not a
lie. Deploying them turns the automatic path on.

## To deploy

1. **Set `EMPLOYER_MAIL_FROM`** (or reuse `MAIL_FROM`) on the Supabase project. `RESEND_API_KEY` is
   already set — `on-weekly-concept` uses it. `employer-issue-code` returns `mail_unavailable` and
   sends nothing until the from-address exists, which is the intended fail-safe.
2. `supabase functions deploy employer-issue-code`
3. `supabase functions deploy employer-confirm-email`
4. Apply for an employer account end to end, from a real mailbox, and confirm the code arrives and
   works. **This flow has never run once**, so a live test is not optional.

## Things a reviewer should push back on

- `employer-issue-code` **mails before it records**. Deliberate: recording first and then failing to
  send would invalidate a code the applicant may already be holding while giving them no new one.
  A code that does not work is recoverable; one that silently replaced a working one is not.
- The destination address is read **from the application row, never from the request body**. If the
  caller could name the destination the check would be theatre.
- `employer-confirm-email` deliberately does **not** use the service role. The RPC is granted to
  `authenticated` and enforces ownership, expiry and attempt limits itself.
- Neither function has been executed. They are written against the signatures in
  `supabase/migrations/2026091904_employer_work_email_verification.sql` and the pattern in
  `employer-apply-finalize`, and `employer_confirm_work_email`'s exact return shape is handled
  defensively, but **nothing here has been run**.
