# Launch readiness — the verdict and your action list

Written 2026-09-18 after five bug-hunt passes and ~40 agents. This is the one
document you have to read. Everything in it cites the report it came from, so
you can go deeper on any line without reading the other thirty-four.

**State of the tree right now:** 22 commits on `audio-tools-engine`, **none
pushed** (origin is still at `a12e7395`). `npx tsc --noEmit` clean, verified
today. `npm test` 1488 pass / 0 fail, 223 suites (`pass5-regression-risk.md`).
**Nothing from last night is on a phone.**

*Moving target note:* commit `7207acc2` — the TalkBack scrim and the graded
matching question — landed **while this document was being written**, and a fix
for the glossary meter was in the working tree at the time of writing. Both are
marked ✅ below. If anything else in section 2B reads as already done, check
`git log` before you spend time on it.

---

## 1 · Is this shippable?

**Not this morning. It is shippable in about two days, and almost none of the
remaining work is app code — it is yours.** The app itself is in good shape: the
five passes removed a genuinely frightening class of defect (silent data loss in
the exam queue, the measurement library and the production packet; inert
entitlement gates on both flagship paid labs; audio that could not be silenced),
and the residue still open in the client is mostly MAJOR-and-below. What is not
shippable is the **money path and the credential path, neither of which lives in
the app bundle** — and the fact that a hundred-odd files changed overnight and not
one of them has been seen by a phone. Ship after four things: deploy the server in
the right order, settle what actually awards a certificate, do one device pass,
and land two accessibility fixes that are the difference between "a paid feature"
and "a paid feature any Android user can take for free."

The three things that decide it:

**1. The money path is undeployed and, as written, has two traps that lose real
money.** The tenure migration and both edge functions are still not deployed, and
**order matters**: both functions read `member_since` / `refunded_at`, which only
the unapplied migration adds. Deploy a function first and a real purchase is
charged by Apple/Google, the insert fails, and the customer is told "we couldn't
verify that purchase" — with Restore hitting the same wall forever
(`pass5-server.md §2.2`). Separately, `status='refunded'` is probably rejected by
a live CHECK constraint, so every refund silently no-ops while returning 200
(`§2.1`); and Google refunds match on purchase token while `validate-purchase`
stores the **order id**, so every Android refund matches zero rows, permanently
(`§2.3`). A refunded member keeps paid access *and* keeps accruing tenure toward a
certificate. None of this can be found from a phone, and none of it can be fixed
by an OTA update.

**2. Nobody can currently say what issues a certificate.** Certificates appear to
be awarded by a DB trigger on topic completion, which would bypass the Final Exam
and the paid-month rule entirely (`pass2-awards.md §1`, still open). The migration
that was supposed to enforce the paid month contains the enforcing clause **as a
comment block, not SQL** — applying it cleanly enforces nothing, and
`member_month_complete` ships with zero callers (`pass5-server.md §3.2`). On top
of that, the RLS write lockdown may never have been applied, in which case an
authenticated user can PATCH their own progress row to `complete` and the trigger
mints them a credential with the shipped anon key (`§3.4`). The credential is the
thing you are selling. Ten minutes of read-only SQL settles all three.

**3. A hundred files changed overnight, verified only by a type-checker.** 101
source files, +3601/−449, in about twelve hours (`pass5-regression-risk.md`). Two
of the pass-4 fixes turned out to be *inverses* of the bugs they fixed and had to
be re-fixed 65 minutes later — the enrollment guard locked every new user out of
the free topics, and the comma handler turned a typed `12,000` into `12` in a
client-facing money field. Both were caught by a later agent, not by a test. That
is the accurate measure of how much confidence `tsc` and 1488 node tests buy here:
real, but not enough. `pass5-device-script.md` exists for exactly this and is the
highest-value hour you can spend today.

Two more came close to deciding it and were fixed in `7207acc2` an hour ago: **the
paid-lab scrim was a BLOCKER on Android** — TalkBack's ACTION_CLICK never
hit-tests, so a free user with TalkBack on could operate every paid lab straight
through the paywall (`pass5-a11y-worklist.md §W1`) — and **matching questions were
unusable without sight while being graded**, on the topic quiz and on the Final
Exam that issues the credential (`§W6`). Both now need a phone, not a reviewer:
the scrim fix adds a wrapping `View` to ~40 paid routes, which is the one
accessibility change in the batch that can move a layout.

---

## 2 · The action list

### A · Only you can do these

Ordered. The first four are one sitting at the computer.

| # | Do | Why | Time | Blocks launch? |
|---|---|---|---|---|
| A1 | Run the ten read-only queries in `pass5-server.md §8` against the live project | 40 of 52 RPCs and 25 of 31 tables have **no definition in the repo** (`§0`). These ten answers decide whether refunds, purchases, quizzes and the directory work at all. | 20 min | **YES** |
| A2 | Confirm `APE_RLS_PROGRESS_WRITE_LOCKDOWN_2026_09_10.SQL` was applied; re-run it if unsure (it is idempotent) | If it was not, credential forgery is possible with the shipped anon key (`pass5-server.md §3.4`). No applied-marker exists anywhere in the repo. | 10 min | **YES** |
| A3 | Answer "what awards a certificate?" — read the live `evaluate_user_credentials` / `trg_eval_credentials` bodies | The repo proves these exist in production and contains **not one line of either** (`§3.1`). Until you read them you do not know whether the Final Exam gate is real. | 20 min | **YES** |
| A4 | Widen the `entitlements.status` CHECK to include `'refunded'` | Otherwise every refund write raises 23514, returns 200, the store never retries, and a refunded member keeps access and tenure (`§2.1`). | 5 min | **YES** |
| A5 | Apply `2026091801_paid_month_before_credential.sql`, **verify both columns exist**, and only then deploy `validate-purchase` and `store-notifications` | Reverse the order and real purchases are charged and return `grant_failed` (`§2.2`). | 30 min | **YES** |
| A6 | Add `entitlements.store_original_ref` + index; write it on first activation; match Google refunds on it | Today every Android refund matches zero rows forever while logging success (`§2.3`). Do **not** "fix" it by flipping the `\|\|` — that re-opens the pass-1 forgery hole. | 45 min | **YES** |
| A7 | Verify the 7 `validate-purchase` store secrets are set | Unset = every buyer gets "we couldn't verify that purchase", `finishTransaction` never runs, and **Google auto-refunds every purchase after 72 h** (`pass2-network.md §10`). Also a guideline 2.1 rejection when the reviewer tries to buy. | 15 min | **YES** |
| A8 | `npx expo-updates fingerprint:generate`, compare with `eas build:list` runtimeVersion, **before any `eas update`** | `.gitignore` is CRLF on disk and LF in the index — fingerprint source #2, the same trap as `.easignore`. Do not edit `.gitattributes`/`.gitignore` until the compare is run: the "fix" could equally break OTA (`pass5-native-config.md E-1`). | 5 min | **YES** |
| A9 | The device pass: `pass5-device-script.md`, Sessions 0–3 minimum | Everything above was verified by `tsc` only. Sessions 0–3 cover every BLOCKER-class change. | 40–90 min | **YES** |
| A10 | **One** native build carrying **all** of: `enableBackgroundPlayback: false`, the photo-library permission trim, `ios.associatedDomains`, `submit.production` credentials, the Android notification icon, and the two Android audio fixes | None can ship OTA and every one changes the fingerprint, so they must be one commit and one build (`pass5-native-config.md E-2…E-12`, `pass3-android.md §1–2`). `E-12` (submit credentials) must be in the *same* commit as the launch build or `eas submit` fails on launch day. Restoring `associatedDomains` needs an **interactive** build with an Apple login. | half a day + build | **YES** |
| A11 | Correct the submission pack's two false console answers before filling in the store forms | It says "no user-to-user communication" (false — real threaded messaging) and "no analytics SDK, no crash reporter" (false since 2026-09-16). Wrong IARC answers are a removal risk, not a rejection risk (`pass4-store-review.md R5`). | 20 min | **YES** |
| A12 | Deploy the 8 missing website paths + `/.well-known/assetlinks.json`, or drop the App Link claims | Nine `pathPrefix` claims, eight of them 404 (`pass5-native-config.md E-4`). | 1 h, or 5 min to drop | No |
| A13 | `supabase functions download` the 4 live-but-uncommitted lab functions and commit them | One (`lab-audio`) gates a paid path with a second, unreviewable definition of "member" — and the readable one was found wrong (`pass5-server.md §4.5`, `§4.1`). | 20 min | No |
| A14 | `eas channel:view production` — confirm it maps to a real branch | Store builds listen on `production`; your whole documented dev loop publishes `--branch preview` (`E-13`). | 2 min | **YES, on launch day** |
| A15 | Supply a white-on-transparent 96×96 Android notification icon | Otherwise every weekly-concept push shows a blank white square. No agent will touch image assets. | your call | No |

### B · Should be coded before launch

Everything here ships over the air.

**Tier 1 — under an hour total, and each is a promise the app currently breaks**

- ✅ **DONE in `7207acc2` — the paid-lab scrim.** On Android a free user with
  TalkBack could operate every paid lab straight through the paywall; the gated
  subtree is now hidden from the accessibility tree
  (`pass5-a11y-worklist.md §W1`). **It still wants a visual smoke test on two
  labs — one rack, one paged — because it adds a wrapping `View`.** That is the
  only a11y change in the whole worklist that can affect layout. Put it in your
  device pass.
- ✅ **DONE in `7207acc2` — matching questions.** Paired cells were distinguished
  *only* by `opacity: 0.38`, so to a screen reader a used option was identical to
  an available one — on the graded Final Exam (`§W6`). Verify on a phone: swipe
  through a matching question with VoiceOver/TalkBack and confirm a paired term
  announces as unavailable.
- **Sign-in errors are silent on iOS** — all six surfaces use
  `accessibilityLiveRegion`, which RN does not implement on iOS. Four lines. This
  is the front door. `§W2`.
- **`resetGenCapSession` has zero callers** (verified today). The generator
  output-cap unlock — a hearing-safety gate — survives an account switch. One
  line. `pass4-open-items.md §1e`.
- ✅ **IN FLIGHT — the glossary's 14-a-week cap** reset every time a guest
  re-entered Guest Mode: the only limit on free access to 26,855 definitions. A
  fix adding `ape:glossaryUsageLocal` to the KEEP list was in the working tree as
  this was written. Confirm it is committed. `pass5-fresh-eyes.md §G-1`.
- **The store-review prompt is the only auto-overlay with no Low-Light gate**
  (verified today), and it burns its once-per-version allowance when suppressed.
  Your standing rule, and it fires during a show.
- **Six more careers printed bare in `subjectMeta.ts`** — including a fourth
  "rigger" — on a screen any user can open, against the hard disclosure rule. The
  in-flight fix is **inert** (it matches canonical titles against prose).
  `pass5-verification.md §20`, `pass5-data-integrity.md §D-9`.
- **Ten licensed occupations printed bare on the career-family screen**, directly
  above that screen's own LICENSED badge. The predicate already exists in a
  sibling file. ~3 lines. `§D-10`.
- **The credential celebration's SHARE button** resets you to the Study dashboard
  and the celebration is already spent. Remove `SHARE,` from five arrays.
  `pass4-open-items.md §4c`.
- **Android hardware BACK escapes the Celebration screen** and the credential is
  marked seen before it is shown — the biggest moment in the app, lost permanently
  on that device. 3-line BackHandler, already written twice elsewhere.
  `pass3-android.md §5`.

**Tier 2 — half a day, and these are the ones a paying customer will hit**

- **Twenty-eight of 29 sites still assert identity from `resolved`, not
  `tierKnown`.** A paying member who opens the app offline — a venue with no
  signal, i.e. your target user's normal environment — is shown the non-member
  experience across ~40 paid routes. That is failing **closed on an infrastructure
  error**, the inverse of your own rule. Pass 3 fixed one screen.
  `pass5-regression-risk.md §5.1`.
- **`tube-image` reads `entitlements[0]`** — the exact bug `EntitlementProvider`
  was fixed to stop doing, so a member with two rows is refused. 3 lines.
  `pass5-server.md §4.1`.
- **`validate-purchase:223` discards the `maybeSingle()` error** → with duplicate
  rows, a third row with a restarted `member_since`, permanently denying that
  member every credential. `§4.4`.
- **`submitFinalExam` has no error vocabulary** (~15 lines, reusing copy six lines
  away) — and this **must land before** the paid-month gate is applied, or a
  member finishing the capstone sees the raw string `paid_tenure_required`.
  `§3.3`.
- **The free calculator cap is fully defeated by airplane mode**, and the counter
  *disappears*, so the bypass is discoverable. The pattern exists next door in
  `glossaryCap.ts`. `pass2-network.md §8`.
- **Purchase listeners live only while the paywall is mounted.** Interrupted
  transactions (Ask-to-Buy, SCA) land nowhere. Register at app root. `§10`.
- **Tube Reference maps every 4xx to "sign in"** — telling a paying member they are
  not a member on a 404 or a hiccup. `§9`.
- **The public directory shows an employer that a member holds zero credentials**
  when one of two RPCs fails, as fact, with no retry. `§7`.
- **Production numeric table columns and dates.** Ten table columns store raw text
  (`Number("12,000")` → NaN → `?? 0`, so the over-budget advisory fails open *and*
  "no contingency" fires at someone who typed one), and dates go through
  `Date.parse`, which is null on Hermes and 4 January on V8 — **so it does not
  reproduce the same way in your browser preview as on the phone**. Route both
  through the existing hardened `parseQuantity`. `pass4-open-items.md §2a, §2b`.
- **Two permanently dead TAKE FINAL EXAM buttons** on "Manage My Learning", with no
  visible reason, while the exam works behind a different tap. `§4a`.
- **"Reduce animations" is ignored by 12 of 17 `withRepeat` files**, including
  `SwitchButton` — seven instances on the Dashboard alone. `pass4-open-items.md §3`.
- **The one calculator formula that is false arithmetic**:
  `dBV = dBu − 2.218 · dBu = dBV + 2.218`, where the app's own key teaches `·` as
  multiply. Two more of the same shape. Your calculators are the declared source of
  truth. `pass3-teaching.md §1`.
- **The Study tab downloads 100 KB–1.5 MB just to count rows**, on every focus and
  after every study write; **Explore makes ~27 serial round trips (~1 MB, 5–10 s on
  4G)** to fill one line inside a collapsed accordion; **Explore → TOPICS fires 166
  concurrent requests for 33 MB** of 1024px art to draw 34pt thumbnails — on a new
  paying customer's first visit. All three are small fixes.
  `pass3-performance.md §G1, §G2, §G4`.
- **Delete the 889 KB Bravura font and Yellowtail from the preload** — nothing
  references either and they block the splash. Two lines, the cheapest win in any
  report. `§G5`.

**Tier 3 — copy, while you are in the file**

`AudioOutputGate.tsx:318-322` still promises audio "stays on… including if you
switch away and come back" — false since yesterday, and it is a sentence you
personally dictated (`pass5-regression-risk.md §1C`). The paywall still calls the
product an "early **beta**" with prices "valid through the end of the year" and no
expiry mechanism — on the screen a reviewer buys from (`pass4-copy.md F-5`,
`pass4-store-review.md K2`). Six "Coming Soon" rows survive in the member-gated
Smart Processors lab, missed by your no-placeholder sweep (`K5`). Two
client-facing documents stamp a **UTC** date, so an evening in the Americas prints
tomorrow on the Production Packet's revision-control block
(`pass4-fresh-eyes.md §H-3`).

### C · Can wait until after launch

- The rest of the accessibility worklist — ~190 lines across 18 items, of which
  Tier 1 above is the first 19 (`pass5-a11y-worklist.md`). The 14–16 remaining
  Android-only live regions, focus management (never implemented; only 4 places
  actually break a task), study-screen announcements, auto-advance timers tuned to
  sighted reading speed, the 8 Community Directory modals missing
  `accessibilityViewIsModal`, 18 sub-44pt touch targets.
- **Font scaling.** Biggest scope item in the reports, correctly deferred: the
  honest short-term fix is the copy in `SettingsScreen.tsx:543`, not 55 files.
- **Cold-start module graph** (840 of 855 modules before first frame) and the
  410 KB of browser-only Sentry code. Both reports say explicitly: not this week
  (`pass3-performance.md §G6, §G12`).
- The theoretical races T1–T9, the 29 unmatched career example strings, the dead
  `CredentialThumb` file, the Cable Install scorecard blend
  (`pass4-fresh-eyes.md §H-2`) — listed so they are not re-found, not so they are
  fixed now.
- The three teaching MINORs: the 144-vs-146 dB attribution (it is the +1.76 dB
  full-scale-sine term, not rounding), the binaural ~800 Hz threshold stated
  backwards, and the Lissajous vertical-vs-45° contradiction
  (`pass3-teaching.md §2–4`). Wrong, worth fixing, not worth a launch day.
- The glossary's ~22,700 definitions and the quiz banks were **never checked by any
  pass** — they live in Supabase. Schedule a read-only export and a content pass
  after launch.

---

## 3 · The decisions only you can make

**D1 · Does the Community Directory ship at 13+?**
The 18+ attestation gates *publishing your own listing*. The directory itself is
registered **ungated**, is a claimed deep link, and a 13-year-old free account can
browse adults' real names and open a private message thread
(`pass4-store-review.md K7`). There is also no objectionable-content filter and no
terms agreement at account creation (`R4`, Apple 1.2). Options: (a) gate browsing
and messaging behind the same 18+ attestation; (b) raise the rating to 17+;
(c) ship the directory read-only for launch and turn messaging on later.
**Recommendation: (c), then (a) later.** Read-only removes the Apple 1.2
content-filter requirement and the minor-to-adult DM path in one move, costs you
nothing you are charging for, and buys time to add the filter and the EULA
properly. Whichever you pick, first check whether `contact_request_send` is
server-gated on attestation — a live-DB question, and it may already be closed.

**D2 · Does the paid-month rule ship now or later?**
Right now it is promised in the UI and enforced nowhere: the migration's enforcing
clause is prose, `member_month_complete` has zero callers, and the certificate may
be minted by a trigger that never consults it (`pass5-server.md §3.2`,
`pass2-awards.md §1`). Options: (a) hand-edit the live `start_final_exam` to add
the gate before launch; (b) ship without the rule and **remove the promise from the
UI**; (c) ship as-is. **Recommendation: (a) if A3 shows the trigger is not already
minting certificates behind your back; (b) otherwise.** (c) is the one option not
available to you — a rule stated in the product and unenforced in the server is the
shape of a refund dispute you lose. If you pick (a), the ordering matters:
`submitFinalExam`'s error vocabulary must land first.

**D3 · Is the Final Exam gate worth what it costs?**
The gate is expensive: a hard 10-minute clock that voids on two app switches, a
capstone whose only copy may live in an offline queue, matching questions unusable
without sight, and seven server-side refusals the enabled button ignores with no
eligibility date shown anywhere (`pass2-journeys.md J4-2`,
`pass5-a11y-worklist.md §W6`). **Recommendation: keep the exam, soften the clock.**
The exam is what makes the credential mean anything, and it is most of your defence
against "I completed the topics, where is my certificate." But the
void-on-app-switch rule punishes a phone ringing, not a cheater, and every one of
its failure modes lands on the most valuable moment in the product. Pausing the
clock on backgrounding — or simply lengthening it — costs almost no integrity and
removes a whole class of support email.

**D4 · The terminology forks.** Three, and the first two go on a résumé.
- **What the customer buys**: nine CTA labels and five product nouns ("Academy
  membership" 42 strings, "Academy Mode" 11, "Academy access" 7…). ~70 strings, but
  `lib/copy.ts` is governance-locked, so it is your call (`pass4-copy.md T-1`).
  **Recommendation: one noun — "Academy membership" — and one CTA — "SEE
  MEMBERSHIP".** Cheap partial today: unify just the nine button labels, which are
  not in `copy.ts`.
- **The award names**: "Specialization Certificate" (9 strings) vs "Specialized
  Certificate" (5), and level 2's page is headlined `PROFESSIONAL CERTIFICATE`
  while not being the Certificates page (`T-3`). **Recommendation: L1 =
  Specialization Certificate, L2 = Professional Program, "credential" as the
  umbrella — and decide it before the first certificate is printed.**
- **US vs UK English**: the house dialect is unambiguously US (organiz 43–0),
  broken by 147 strings (`T-8`). **Recommendation: hand-fix the nine visible
  colour-picker strings now, script the rest after launch.**

**D5 · The Production Labs: ship as built, or spend a day on presentation?**
The teaching in them is the best writing in the codebase — and the design report's
own verdict is that they are at real risk of being *admired rather than used*:
14–16 phone screens of uninterrupted scroll per stage, every field shown to every
user forever, and the findings panel — the payoff — at the very bottom
(`design-production-labs.md`). **Recommendation: spend half a day on the cheap
rendering wins, not on `showWhen`.** Surface findings at the top, render
`Finding.fieldIds` and `Finding.learnMore` (both already computed and read by
nothing), and **ungate the debrief** — it is currently locked behind success, so
the learner it was written for never reads it. `showWhen` is the bigger win and the
right next feature; it is not a launch-week change.

**D6 · Cymatics Phase 4.** Built, and it still has not had its device pass;
`design-cymatics.md §10` is the script. One item from that report I would pull
forward regardless: **every exported artefact loses its SIMULATION label the moment
it leaves the app.** The lab teaches "patterns generated by an app are
measurements" as a myth, and then ships an unlabelled mandala that will be reposted
as "the shape of 528 Hz". Four one-line additions. **Recommendation: do the four
lines, do the device pass; if the device pass finds anything structural, Phase 4
slips and the rest of the lab still ships.**

---

## 4 · What is genuinely good

After a hundred findings you need this, and it is not consolation — it is the
reason five passes were possible at all.

**The honesty discipline is real and it is everywhere.** Every hearing-exposure
level prints "dBA **est.**"; the honesty line ends "Not a medical or compliance
measurement" and renders twice *plus* on the CSV export. Cymatics badges every
shape CALCULATED·VALIDATED / CALCULATED / APPROXIMATED and carries a four-line
"what is exact, what is approximated, what a real plate also depends on" block in
all three studios. `AccuracyNote` says, in the product: "Studying here does **not**
qualify you to do it." The production labs' accepted-blocker flow demands a name
*and* a reason, refuses twice independently, and the sheet says "This does not fix
the problem." (`pass3-settings-privacy.md V5–V6`, `design-cymatics.md`,
`design-production-labs.md`.) The pass that went looking for a health-claim problem
reported not finding one.

**The anti-misconception charter holds under grep.** Searching for
staircase/connect-the-dots returns only *denials*; the one staircase the app draws
is labelled "a CONVERTER operation — it is NOT what a DAC's analog output looks
like." The Cymatics heat map is deliberately scaled by response strength because a
full-red map at every frequency would teach the lab's own target misconception —
**and the code comment says exactly that** (`pass3-teaching.md`,
`design-cymatics.md`). The pass hunting for confidently-wrong teaching hand-
recomputed dBu/dBV (including the 11.8 dB pro/consumer gap, not the 14 everyone
else prints), NIOSH/OSHA doses, Sabine/Eyring/Millington–Sette, BS.1770-5,
Butterworth Q↔BW, Bessel-zero ratios, Peterson & Barney formants, Woodworth ITD —
and came back with three MINORs. It also noted that the app **declares dBFS
un-convertible without an alignment reference**, which it calls the single most
commonly botched fact in audio education.

**Permission and privacy handling is better than most shipping apps.** The mic
purpose string survives the whole plugin chain. Telemetry matches its declaration
exactly: no `setUser`, `beforeSend` strips user and IP, enum-shaped whitelisted
props that **refuse rather than truncate**, no IDFA/GAID, route names only. The
contact email is verifiably device-local — `setRegistryVisible` transmits bio,
interests, primary interest, adult flag and policy version and nothing else — and
Profile honestly lists the email under what is *not* published. Account deletion is
present, discoverable, behind a 5-second hold, deletes 10 tables and 13 cascades,
survives an offline entitlement read, and the Help text says "You do not need to
contact us." The 18+ attestation fails closed on a read error and never claims the
age is verified (`pass3-settings-privacy.md V4, V10`, `pass4-store-review.md`).

**The paywall is hardened in the ways that matter.** Title, term, price and the
auto-renewal line sit above CONTINUE with working Terms and Privacy links. The
purchase controls fail safe: no buying before entitlement resolves, no buying as a
guest, no double-buy for an existing member. `validate-purchase` fails safe on a
missing secret, a failed verification, a bundle or SKU mismatch, a revoked
transaction, or a failed write — and **expiry is never shortened**. `admin-codes`
has five independent factors, every one failing safe on an unset secret. Deep-link
parsing rejects userinfo, backslashes, encoded separators, traversal and foreign
schemes, and the pending link is in-memory and single-use. And the verdict on the
dev bypasses is flat: **no dev bypass leaks paid content or skips a gate in
production** (`pass1-entitlement.md`).

**Accessibility is a strength here, not a liability.** Of 1,111 touchable elements
only 64 lack both role and label. `allowFontScaling` is disabled **nowhere** — zero
hits repo-wide, which the pass calls the single best thing about this codebase's
accessibility, because it is the most common RN failure and you do not have it. No
colour-only information anywhere, after two passes went looking for it. RTA
announces "Real-time spectrum, 61 bands. Loudest band 1.2 kilohertz at −34 dB." The
Dashboard's powered-off rack panels announce *"powered off"*, so your staged unlock
is legible without sight. The quiz timer — a silent clock plus one latched "one
minute left" — is the *right* answer, and the report says so
(`pass2-honesty-a11y.md`, `pass4-a11y-journey.md`, `pass5-a11y-worklist.md`).

**The comment culture is why five passes worked at all.** Agent after agent found
the fix it was about to propose already written in a dated comment that explained
the bug, the reasoning and the rejected alternative — B-064, B-153 and B-164 in
Cable Install; the "why we do NOT reset this" note on `exposureMonitor.booted`; the
written ERROR MODEL with its strict/lenient split in `v3Curriculum.ts`; the
`ParamLane` accessibility comment good enough to be used as a template. Every
report says some version of the same sentence: **the failures are mechanical
oversights against conventions this codebase already established**, not a missing
philosophy. That is the difference between a hundred findings that are two days of
work and a hundred findings that mean a rewrite. Worth naming alongside it: 1,098
hook scopes and 6,141 hook calls swept with the compiler API — **zero violations**;
zero real typos across ~106,000 strings; the production rules engine machine-
verified complete across 367 fields, 248 columns and 853 option values with zero
unknown field keys; and one `ProductionStageScreen` drawing every stage of both
labs with no `if (stageId === …)` anywhere — adding a stage really is a data file.

---

## 5 · The risk of everything that changed last night

101 source files, +3601/−449, 21 commits, in about twelve hours, verified by a type
checker and 1488 node tests that cannot see a phone. The honest read
(`pass5-regression-risk.md`): most of it is well-judged and the tests added are
real tests — but **two of the pass-4 fixes shipped as the exact inverse of the bugs
they fixed** (a new user locked out of the free topics; a typed `12,000` committed
as `12` in a client-facing money field), and neither was caught by a test. Both
were re-fixed in pass 5. That is the shape of the risk: not that the fixes were
careless, but that this much change in one night produces a class of error only a
phone finds.

The concentrations to watch: **the audio path** — four commits in one day touched
the emergency mute, two of them fixes to fixes, and it is a written safety promise
reachable in the first two minutes of the app. **The account wipe** — fourteen
modules added to the registry across four passes, three of them yesterday, none
ever checked on a device. **The production number fields** — rewritten twice in six
hours. **The entitlement reads** — a generation guard added on one path, then the
same hole found on a second.

`docs/bughunt/pass5-device-script.md` is built for exactly this, ordered by
scariness. Session 0 is five minutes at the computer and includes the fingerprint
check and a way to **prove the OTA actually landed** before you trust a single
result below it. Sessions 1–3 cover every BLOCKER-class change: the emergency mute,
money and the gates, and the second account. If you get ten minutes and nothing
else, the script's own answer is **Session 1, steps 1–7**.
