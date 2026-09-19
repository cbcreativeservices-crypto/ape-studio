# AP&E — governance decisions, 2026-09-19

Continues `APE_GOVERNANCE_DECISIONS_2026_09_18.md` (D1–D9). Numbering carries
on at D10. Engineering lessons from the same day live in
`APE_ENGINEERING_LESSONS.md`; this file is what was DECIDED, not what was
learned.

---

## D10 · Employer verification requires possession of the work mailbox

**Owner:** *"require employers to confirm with a registered email reply like
everyone has to now days."*

Auto-approval previously rested on a string comparison of the work-email
domain against the company website domain, plus a public probe of a site the
applicant need not own. Anyone with an Academy account could have been
auto-approved as "Abbey Road Studios / hiring@abbeyroad.com" and carried a
VERIFIED EMPLOYER badge into graduates' inboxes with the app vouching for them.

**Ruled:** a 6-digit code is mailed to the work address; entering it is what
confirms. `work email not confirmed` is the FIRST condition in
`employer_decide`, because possession is the only signal an impostor cannot
supply. A missing confirmation **queues**, never rejects — only a human may
reject.

⛔ **Never weaken this.** ⛔ The code lives in `employer_email_verifications`,
which has RLS on, **no policies and no grants to any role**, because the
applicant can read their own application row and a hash of a 6-digit code on a
readable row is brute-forced offline in milliseconds.

## D11 · Review, reject and revoke live in the APP, admin-only

**Owner:** *"admin screen in the app."*

`employer_review` had existed with zero callers; there was no pending list and
revocation was impossible through any client. Decided: `EmployerAdmin` screen
in the app, reached from a Profile row that renders nothing for non-admins,
**deliberately not in `linking.ts`** — a deep link to an admin screen is a URL
worth guessing. Enforcement stays in the database (`is_admin()` on every RPC);
the UI gate is a courtesy.

## D12 · Everyone finds a home in the directory

**Owner:** *"include users of our diverse audio spectrum not just more
mainstream as is currently. we have excluded fields currently… everyone should
find a home."*

The app showcases 23 study areas on its own Home carousel and the directory
offered 13. Six areas we TEACH had nowhere to land. Ruled: 13 → 23, additive
only. Labels stay BROAD, not specific ("Audio Tech Work, Business & Career"
absorbs technicians and freelancers rather than splitting them five ways).

**"Still exploring — not sure yet" sorts at 99** so it never competes with a
real answer but is always reachable. That row is the point: a beginner — the
core audience of a training app — previously could not answer the first
question of their profile honestly.

## D13 · Sign-up is a guided flow, not a form

**Owner:** *"make it into a positive and easy guided experience instead of just
fill out the fields (most users wont)."*

Evidence: 9 accounts, **0 profiles started** — not zero finished, zero started.
The editor opened on a blank display-name box, so the first ask was typing and
the reward was invisible.

Ruled: `MyProfileView` renders stepped while the profile is unstarted and
unpublished, and reverts to the full editor once complete. **Taps before
typing** (areas → involvement → open-to), About pre-drafted from the member's
own picks, every step skippable, resumes from what is saved. A published
member never sees a wizard over their own profile.

⛔ The flow **owns no state and no rules** — same `persist`, same togglers,
same caps, same publish path, all passed in. Two surfaces editing one profile
through two code paths is how caps drift from the server.

## D14 · Admin email: one inbox, subject tags are the contract

**Owner:** all mail goes to `info@proaudiotrainingacademy.com`; Gmail filters
are the only sorting available.

Therefore **exactly one email per application**, sent at the moment the outcome
is known (not one at submit and another at decision), and the tags LEAD the
subject and must never move:

```
[APE-EMPLOYER][REVIEW]    needs a human
[APE-EMPLOYER][AUTO-OK]   already approved, for the record
```

`ADMIN_NOTIFY_EMAIL` is still UNSET at time of writing. Without it a queued
application notifies nobody.

## D15 · `photosPermission: false` is withdrawn, permanently

Apple rejected the upload (90683) and the Android twin broke save-to-Photos on
device. Both halves of pass-5 finding E-3 are withdrawn. See
`feedback_permissions_match_the_binary` and §1 of
`APE_ENGINEERING_LESSONS.md`. ⛔ Do not re-apply either.

## D16 · Two Cable Install items are rulings, not defects — still open

- **`mergeDims` is an exponential blend, not a running average.** Score 100
  nine times and 0 once and the card reads 50, where the mean is 83. But the
  reverse run also reads 50 where the mean would be 10, and "recent work counts
  most" is defensible for a teaching lab. It also drives `weakestDim` → the
  "Recommended review" line, so changing it changes the ADVICE the lab gives.
  Only the docstring was corrected. **Owner ruling still needed.**
- **Cymatics #14 / #18 / #19** (Harmonics as a rack; a perf lever conditional
  on device evidence; adding a recall check) are Medium scope calls from
  `Downloads/2026-09-18_BUGHUNT/design-cymatics.md`, not bugs.
