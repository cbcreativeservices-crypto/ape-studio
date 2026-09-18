# APE Governance Decisions — 2026-09-18

Decisions of record made by the owner on 2026-09-18. Where this document and memory or code disagree, this document wins (with `docs/SCREEN_STATUS.md`).

---

## D1 — Any contacting is 18+ gated (STANDING RULE)

**Ruling (owner):** *"yes any contacting is 18+ gated."*

Every contact path in the Audio Community Directory — sending a request, replying, opening a thread — sits behind the 18+ attestation, not just publishing a listing.

**Open:** whether `contact_request_send` is server-gated on the attestation, or only the UI is. A live-DB question, not answered this session.

---

## D2 — A certificate needs every requirement AND one complete paid month

**Ruling (owner, verbatim):**

> *"so topics CAN be completed and earned but they earn no certificate, no award yet. just congratulations on the screen. When all topics + 3 co-reqs + req labs are all done finally together - then a certificate can be issued. There is a final exam. That final exam should remind the user of the minimum 1 month membership if it has not already lapsed. Once it has lapsed, then the reminder never shows (needs to). but if a fast first user gets there within the first month, then this should pop up and remind them of the policy. They can continue to proceed with the final exam, but results are not released until the first month is completed. then graded, then awarded. If the user closes their membership before the month ends, explain their final exam is wiped, not graded, and not applied."*

### What this means, precisely

| Event | Result |
|---|---|
| A topic is completed | Congratulations on screen. **No award, no certificate.** |
| All topics + 3 co-requisites + required labs done | **Eligible.** Still no certificate. |
| Final Exam passed, month complete | Certificate issued. |
| Final Exam passed, month NOT complete | **Held.** Graded, not released, not awarded. No score shown. |
| Membership ends before the month completes | Exam **wiped** — not graded, not applied. Said BEFORE they sit it. |
| Month already complete | The reminder never appears again. |

### Implemented

Three staged migrations, applied to production the same day:

- **Stage 0** `2026091801_paid_month_before_credential.sql` — `member_since`, `refunded_at`, `member_month_complete(p_uid uuid)`, and the `redeem_access_code` integration.
- **Stage 1** `2026091801_tenure_and_flags.sql` — widened `entitlements_status_check` to allow `'refunded'`, created `credential_eligibility` and `app_flags`.
- **Stage 2** `2026091802_credential_eligibility_cutover.sql` — `evaluate_user_credentials` records ELIGIBILITY instead of awarding; `submit_final_exam` grades always and releases only on tenure; `release_pending_credentials`; `discard_unreleased_credentials`; and `start_final_exam` refuses to start over a HELD paper.

**⚠️ `app_flags.certificate_requires_exam` is still FALSE.** Stage 2 is installed and dormant. The cutover is one UPDATE; the rollback is the same line with `false`.

**⚠️ DO NOT flip it before the client ships.** Phones without the `held` handling render a result screen that does not know the outcome.

### The finding that made this urgent

`evaluate_user_credentials` gated on four HARDCODED achievement ids belonging to a **draft/archived** curriculum. The active v3 curriculum carries the same four requirements under different ids. The sets are disjoint, so no v3 learner was ever auto-awarded, and all 125 existing awards belonged to one seeded account.

**⛔ Do not "fix" those ids on their own.** Correcting them outside the flagged branch resumes auto-awarding for every v3 user, which then makes the Final Exam unreachable for all of them via `start_final_exam`'s `already_earned`.

---

## D3 — A pre-exam integrity briefing, every time (STANDING RULE)

**Ruling (owner, verbatim):**

> *"nope, there needs to be a pop up before beginning explaining the integrity of the exam, the academy, and the trust employers have in our graduates. we have the quiz quit/cancel policy for these reasons, if we are clear up front, every time, then the user already knows what happened. and why. to be clear. Employers must trust our grads that they earned and did not use a computer to do the work for them (what everyone does now). To hold that trust that bar must be high. The app is training professionals, so we already have pro expectations, pro assessment should go hand in hand."*

`src/screens/exam/ExamBriefing.tsx` — shown before `startFinalExam`, **every time**, not once. Its four rules are written FROM the enforcing code, not from intention: the 602-second limit, `focus_loss_count >= 2` voids the attempt with a 15-minute lockout, leaving wipes the attempt, and it must be started online.

The tenure section renders three ways from `TenureState` (`complete` / `incomplete` / `unknown`). On `unknown` it states the POLICY and asserts nothing about that person — a member of two years must never be told their results will be held.

---

## D4 — It is always "Specialization Certificate" (STANDING RULE)

**Ruling (owner):** *"it should always be 'Specialization Certificate'."*

Every "Specialized Certificate" is gone. `test/credentialNaming.test.ts` scans the whole `src` tree rather than pinning the known sites, because the real failure is a NEW screen with the old word.

**Not renamed:** the Program page's `PROFESSIONAL CERTIFICATE` headline. That is Level 2, a genuinely different credential.

---

## D5 — A user may learn without completing

**Ruling (owner):** *"yes, we need to allow user to learn without completing."*

Study, labs and glossary are not gated on finishing anything. Completion gates the CREDENTIAL, not the learning.

---

## D6 — Trophy Case copy, and NO FEATURING

**Ruling (owner):** the Trophy Case copy as dictated, then: *"remove feature. user can only share."*

The section was headed FEATURED ACHIEVEMENT and offered to "select an accomplishment to feature and share". Featuring does not exist and is not being built. **The heading went too** — it was the promise, in larger type.

It now reads SHARE YOUR ACHIEVEMENTS and describes what is real: the verification link, the QR as an image, and the printed certificate.

**Copy lives in `TROPHY_CASE_EMPTY` (`features/celebration/catalog.ts`) and the screen reads it.** That constant existed with zero consumers while the screen carried hardcoded duplicates — the featuring language had to be deleted twice, and only a grep found the second.

---

## D7 — Sharing: the QR, the link, and the certificate

**Ruling (owner):** *"the user should be able to share easily their QR code, their unique URL and their printed certificate (image)."*

Delivered, shipping OTA: COPY LINK / SHARE LINK / SHARE QR on each credential and on the Profile ID card. The shared QR is a **card** — academy, holder, credential, QR, and the URL printed in words — because a bare QR square tells the recipient nothing and cannot be trusted before scanning.

**The certificate still shares as a PDF, not a PNG.** Making it an image needs `react-native-webview` (to photograph the one existing `certificateHtml.ts` definition rather than re-drawing it in React and letting the two drift).

**Not ruled. Recommendation given and NOT yet accepted by the owner: skip it for launch.** The PDF covers handing a certificate to an employer, and the QR card already covers posting an image. Installing a native dependency strands every OTA fix until the next build, and view-shot capturing a WebView is unreliable on Android. Parked with full reasoning in `docs/APE_NEXT_BUILD_CHECKLIST.md`.

---

## D8 — LANE BOUNDARY: store consoles belong to Comp A (STANDING RULE)

**Ruling (owner):** *"please step aside from Google Play store and Apple dev store work. Claude chat (comp a) is doing that with me. that is comp a's lane. You are the app… do not place comp a store tasks into your list of things i need to do with you. this is inefficient."*

**ccode does not put store-console work on the owner's list.** Not App Store Connect, not Play Console, not IARC/age ratings, not data-safety forms, not store secrets, not submission packs.

Where the app INTERACTS with that work, say so once and move on — e.g. `validate-purchase`'s store secrets decide whether purchases verify, but verifying them is A's job, not a task for this lane.

**ccode's lane:** the app, its client code, its server functions and migrations, and the device pass.

---

## What is live in production as of this document

| | |
|---|---|
| Stage 0, 1, 2 migrations | applied · `certificate_requires_exam` = **false** |
| `validate-purchase` | **v4 deployed** — platform-correct `store_ref`, prior-read no longer restarts tenure |
| `tube-image` | **v5 deployed** — judges every entitlement row |
| `store-notifications` | **NOT deployed** — needs `verify_jwt: false` and the store webhooks configured |
| `topic_term_counts(uuid[])` | applied — replaces two client-side row-counting loops |
| `on-weekly-concept` cron | scheduled `*/10`, **inert** until a `service_role_key` Vault secret exists |
| PUBLIC-execute revokes | applied to `refresh_academy_stats` and `member_month_complete` |
