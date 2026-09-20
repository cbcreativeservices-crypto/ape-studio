# Edge function deploy notes — employer work-email verification

**Last checked against the live project 2026-09-20.** This file replaces an earlier
`_NOT_DEPLOYED.md` that was **wrong** — see "What I got wrong" at the bottom.

## Live state, read from the project (`yjgolswjggmlpeowvtxr`)

| function | deployed | note |
|---|---|---|
| `employer-apply-finalize` | ✅ ACTIVE v4 | probes the domain, records checks, emails the admin |
| `employer-confirm-email` | ✅ **ACTIVE v2** | checks the code AND sends the tagged outcome email |
| `employer-issue-code` | ❌ **NOT DEPLOYED** | written 2026-09-20, has never run |

## The one thing still missing

**Nothing ever mints or mails a code.** The database half was built on 2026-09-19 —
`employer_issue_email_code`, `employer_confirm_work_email`, and the `employer_decide` rule that
queues any application whose work email is unconfirmed. `employer-confirm-email` was deployed to
consume a code. But no caller of `employer_issue_email_code` exists anywhere: a repo-wide grep finds
it only in a migration comment.

So the flow is: apply → admin is emailed → **stop**. The applicant is never sent anything, no
application can confirm its work email, and every one therefore sits permanently flagged
**WORK EMAIL NOT CONFIRMED**, which also blocks auto-approval.

### What is already safe, deployed or not

The apply form no longer claims a code was sent. It requires the server to return `sent_to` before
showing the code screen, and otherwise falls through to the honest branch: the application **was
saved** and a person will review it. Both of those are true today. So the current failure mode is
*correct behaviour with manual review*, not a lie.

`web/app/api/employers/apply/route.ts` calls `employer-issue-code` and treats any failure as "no code
sent", so deploying the function is the only thing needed to turn the automatic path on, and not
deploying it breaks nothing.

## To finish it

1. **Set `EMPLOYER_MAIL_FROM`** (or reuse `MAIL_FROM`) on the Supabase project. `RESEND_API_KEY` is
   already set. `employer-issue-code` returns `mail_unavailable` and sends nothing until the
   from-address exists — the intended fail-safe.
2. `supabase functions deploy employer-issue-code`
3. Apply for an employer account end to end from a real mailbox. **This flow has never run once**, so
   a live test is not optional.

⛔ **Do NOT deploy `employer-confirm-email`.** It is already live and working. The copy in this repo
was captured verbatim from the deployed source on 2026-09-20 so that the repo finally has it under
version control — deploy it only if you have diffed it and intend the change.

## Things a reviewer should push back on in `employer-issue-code`

- It **mails before it records**. Deliberate: recording first and then failing to send would
  invalidate a code the applicant may already be holding while giving them no new one. A code that
  does not work is recoverable; one that silently replaced a working one is not.
- The destination address is read **from the application row, never from the request body**. If the
  caller could name the destination, the check would be theatre.
- It has never been executed. It is written against the signatures in
  `supabase/migrations/2026091904_employer_work_email_verification.sql` and the pattern in
  `employer-apply-finalize`.

## What I got wrong

The earlier note said **both** functions were undeployed and gave three deploy steps. Bug pass 2
checked the live project and found `employer-confirm-email` ACTIVE since 2026-09-19. Two consequences
worth recording:

- The deploy checklist had a step that would have **overwritten a working function** with a thinner
  repo copy — mine had no owner-notification email at all, and the subject tags in that email are a
  contract the owner's Gmail filters depend on. The repo copy is now the deployed source verbatim.
- Pass 1's finding that "`employer-confirm-email` does not exist" was true of the **repo** and false
  of **production**. The repo not containing a deployed function is its own problem, and it is the
  reason the mistake was possible.
