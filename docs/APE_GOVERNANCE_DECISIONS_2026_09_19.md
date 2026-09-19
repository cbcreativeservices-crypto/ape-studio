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

---

## D17 · Sound labs open at 30% — but only where the number means loudness

**Owner:** *"in all labs that turn on sound, the volume setting/fader auto
starts at 30% always… that way volume never starts loud."*

One constant, `src/features/audio/startLevel.ts`, and eight initialisers.
Double-tap reset moves with it, so a reset can never be louder than the start.

⛔ **Three levels are deliberately EXCLUDED, and must stay excluded:**
Liquid Studio's SHAKE is an acceleration in g whose Faraday threshold is the
lesson (30% sits below threshold — the dish would look broken); the Signal
Generator's −20 dBFS already IS 10% of full scale and matches the engine's own
`defaultLevelDb`; Mixing faders start at unity because unity is the lesson.

Not clamped in the shared tone helper: that caps the sound without moving the
fader, and a lane reading 70% while playing at 30% is a lying control.

## D18 · Messaging caps: STRICTER, and counted per PAIR

**Owner chose the stricter option.** 10 requests/week (unchanged), **10
messages/day**, **30/week**, **5 per partner per day**, stop after **5
consecutive unanswered**, **1000-character** messages.

Plus two anti-harassment rules that are not about volume at all:
**a 90-day cooldown after a decline** (previously a "no" held for zero
seconds — the index only blocked a duplicate PENDING row), and **no second
request while an accepted thread exists**.

⛔ Every count is **per PAIR**, joined through `contact_requests` — never per
`request_id`. A per-thread cap is evaded by opening a second thread.

The remaining NEEDS OWNER from that audit: a lifetime per-thread cap and a
separate monthly ceiling. Neither was adopted.

## D19 · Moderation Phase 0 shipped; three questions are the owner's

States: `active / warned / suspended(until) / banned / removed`, with an
append-only `moderation_actions` audit. A suspension **expires by being read**,
never by a cron job. A ban **unpublishes and never deletes** — deleting
destroys the evidence behind the ban and anything an appeal rests on.

Enforcement runs in two directions: a restricted SENDER is refused; a
restricted TARGET disappears behind the same deliberately vague wording a
block gives. Reporting, thread history and sign-in are deliberately NOT
blocked — a suspended user must still be able to report, the other party keeps
the evidence, and a banned user must be able to read the reason and appeal.

⚠️ **STILL NEEDS OWNER — legal/product, not engineering:**
1. Does a ban **revoke earned credentials**? `credential_awards.revoked_at`
   exists, so it is one UPDATE either way. Revoking a credential somebody
   passed an exam for is a different act from removing them from a directory.
2. Does a ban **terminate paid membership**? You cannot refund an IAP
   yourself — the stores own that — so banning a paid member without a refund
   is a consumer-law and chargeback question.
3. **Retention period** for reports, messages and moderation records after a
   removal.

## D20 · Build, submit and update are three separate acts

Recorded because the owner asked directly and because two of the three have
silently delivered nothing this week.

`eas build` makes a binary. **It puts nothing in front of a tester.**
`eas submit` sends that binary to Apple/Google — a separate command, followed
by Apple processing AND somebody adding it to the Internal group in the
console (A's lane). `eas update` swaps JS inside an already-installed app and
**cannot carry native or manifest changes**.

An OTA is keyed to a per-platform runtime fingerprint, so it reaches only
matching builds. On 2026-09-19 build 23 sat finished and unsubmitted while
testers were on build 22 with a different fingerprint — an update published
then would have reached nobody, successfully.

**Standing rule:** JS-only and fingerprints match → OTA. Anything native or in
`app.json` / `eas.json` → build AND submit; no OTA can help.


## D21 · The legal entity, and what a refund or a ban does to a credential

**Owner, 2026-09-19, answering the questions raised in
`APE_LEGAL_REVIEW_2026_09_19.md`.**

### The entity

**Pro Audio Training Academy LLC** — a California limited liability company,
formed **July 2026**, registered at state and federal level (EIN, DUNS, CA
tax identity all issued). Registered address **2558 Miller Ave, Escondido, CA
92029**.

The registered name IS the trading name, so there is **no DBA layer** — the
contract, the store listings and the merchant identity can all say the same
thing. The published Terms and Privacy Policy currently name no entity at all
(zero occurrences of "LLC" in 439 KB), which is the single highest-severity
finding in the legal review: the liability cap, the indemnity and the warranty
disclaimers all run in favour of an unnamed trade name.

⛔ **The EIN and DUNS numbers do not go in any published document.** They
belong in store, banking and tax forms. Nothing on the website needs them.

### A refund does NOT revoke a certificate

**Owner: "refund does not revoke certificate."** Settled, and it matches the
reasoning already recorded: a certificate records that somebody passed an exam
on a date, which stays true whatever later happens to the payment. Revoking it
over a refund turns a billing dispute into an academic-integrity accusation.

A refund ends **access**. It does not touch the credential.

### A ban means no access; credential revocation is DISCRETIONARY and narrow

**Owner: "ban means no access. and at discretion for extreme matters →
revoke certificates for fraud, forgery, or suspicious activity until proven
legit."**

So revocation is **not** an automatic consequence of a ban. It is reserved for
three grounds — **fraud, forgery, suspicious activity** — and the operative
words are **"until proven legit"**: this is a **HOLD pending proof, not a
permanent revocation**. The credential comes back if the holder establishes
the record is genuine. Default state on a ban is: access gone, credential
intact.

⚠️ **Two things this ruling needs before it can be built:**

1. **The data model cannot express a hold.** `credential_awards.revoked_at` is
   a single nullable timestamp — settable and re-settable, so a hold is
   technically reversible, but there is **no reason code, no actor, and no way
   to distinguish "under review" from "permanently revoked"**. There is also no
   admin RPC to set it: no client path to revoke a credential exists at all.
   Both are A's tables.
2. **The public verification wording carries real exposure.** A held credential
   must read as *"not currently verifiable — under review"*, never as
   fraudulent or forged. Publicly calling someone a forger before it is proven
   is defamation-shaped, and "until proven legit" explicitly means it is not
   yet proven. What `/verify/[code]` and `/registry/[token]` return today for a
   revoked award is a backend question for A — the RPCs are theirs.

### ⚠️ UNRESOLVED — "no access" conflicts with what Phase 0 shipped

The moderation work that shipped (D19) restricts **the community only**: a
banned account can still sign in, study, and use every lab and tool, and
`AccountStandingNotice` tells them so in those words — *"You can still study,
and your certificates are unaffected."*

"Ban means no access" reads wider than that. The two readings need different
work and have different consequences:

- **Community only** (what is built): nothing to change.
- **The whole app**: enforcement points move, the notice copy is wrong, and it
  collides directly with the refund position — you cannot refund an in-app
  purchase yourself, so cutting a paid member off from content they bought is
  a chargeback and consumer-law question, not just a moderation one.

Sign-in itself must stay open under either reading: a banned user has to be
able to read the reason and appeal, and in the EU the DSA expects a statement
of reasons.

**Still open from D19:** whether a ban terminates paid membership, and the
retention period for reports, messages and moderation records after removal.
