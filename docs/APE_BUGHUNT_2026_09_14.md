# Day bug-hunt 2026-09-14 — consolidated

Owner-requested "another agent test for bugs." Five agents, surfaces last
night's run did NOT cover (last night: reorder / help / store-checklist /
error-triad). Every fix reviewed and committed by the main session, tsc clean
and suite **1165/1165** per commit. Per-agent detail in
[docs/audit/day_2026_09_14/](audit/day_2026_09_14/). Commits: c2be05d0 ·
c781b12e · fe57aac5 (+ this report).

## Fixed and committed (4)

1. **Final Exam capstone strand** (c2be05d0) — a shape-valid-but-empty matching
   payload (or rights < lefts) passed the exam's shape guard but rendered
   controls that can never complete, with the Skip fallback suppressed
   (`answerable` was only `!!matching`) — stranding the learner until the 0:00
   force-submit wiped the attempt. The Final Exam is a deliberate port of
   QuizScreen but this M3 fallback was half-ported; brought to byte-parity.
2. **Gallery error-vs-empty** (c781b12e) — GalleryScreen (Topics → YOUR GALLERY)
   swallowed a read failure as `[]`, telling a member who HAS trophies "Earn
   your first trophy to see it here." The launch audit fixed this on three
   sibling screens but missed Gallery; now throws + error/Retry card.
3. **Directory "0 members" on error** (fe57aac5) — a failed Explore search drew
   a "0 members" count under the error banner; now the error shows only the
   banner + Retry.
4. **Calc cap comment 10 → 5** (fe57aac5) — comment-only; code already read the
   correct constant.

## The suite came back remarkably clean

- **Calculators**: zero correctness bugs — 12 formulas hand-verified
  numerically + ~20 by inspection, weekly-cap honesty holds (never mis-blocks
  under-cap), workflow reorder/runner and formula-key popup all correct.
- **Study/grading**: double-tap counting, answer-after-unmount, timer/submit
  races, progress-banking idempotency, resume merge, unlock gates, scoring
  math — all attacked and clean.
- **Nav/linking**: URL/host-spoofing defenses hold, boot effects correct, and
  the resolved-gate cold-boot notification-cancel regression is NOT
  reintroduced.
- **Achievements/certs**: counts share one source (no screen-vs-serialized
  split), the qrcode-dead fix + long-name invariant hold across 17 hostile
  cases.

## ⚠️ Two OWNER DECISIONS (report-only — not changed)

### E1 · Deep links bypass the members-only Training-Lab gate (HIGH)
`src/navigation/linking.ts:66-81` maps ~13 paths straight to member-only labs
(`labs/compression`, `labs/eq`, `labs/reverb`, …). The membership gate lives
ONLY in EarLabScreen's locked-row preview; the lab screens themselves carry no
membership check. So a non-member reaching a lab via a live
`proaudio://labs/...` custom-scheme link (needs no AASA) or via the
`pendingLink` resume after sign-in gets full access — no scrim, no upgrade
sheet.

Real-world exposure is currently LOW (the https App Links are inert until AASA
is hosted, and no `proaudio://` links are published anywhere yet), but it is a
genuine entitlement/revenue leak on the store surface.

**Recommended fix (single chokepoint, ~S):** gate inside `navigateToPath`
(linking.ts:109) — before dispatching to a member-only destination, check
entitlement; if not entitled (and resolved), route to Paywall instead of the
lab. Must handle the unresolved-at-cold-boot case (defer or safe-default).
Left unfixed because the run scoped entitlement report-only and the routing
target is an owner choice (Paywall vs the lab's own preview overlay).

### P1 · Registry publish-preview understates what goes public (privacy)
The "THIS IS WHAT OTHERS SEE" preview (`MyProfileView.tsx:743-774`) and the
publish-confirm copy (`:271-273`) list only display name / areas / specialties
/ how-involved / About — but the real public projection
(`AudioCommunityDirectoryScreen.tsx:187-214`) also shows **country, region,
languages, and the Open To list**. The consent flow's §8.1 wants an *exact*
preview and the §9 attestation copy omits the same fields. Left for the owner
because it touches the consent trail and the ratified attestation wording —
and it matters for the App Store UGC/privacy review.

## Low-priority notes (not changed)
- Stale "1,902" comments in two read-only files (actual 1,898):
  `careerIndex.ts:3`, `navigation/types.ts:324`.
- Explore has no pagination despite a paginated RPC; a concurrent-search race
  with no abort guard.
- `localSchedule.ts:110-118` `nextOccurrence()` is dead code.
- A self-healing sync race can briefly leave reminders booked for a downgraded
  non-member until the next foreground/settings sync (self-corrects).
- Two by-design Achievements count observations (Topics header vs Gallery
  date_earned) — need DB access to confirm.

## Not run
No adversarial re-attack wave yet (the 4 fixes are small and each was verified
against its twin/source at commit). Device pass from earlier remains parked.
