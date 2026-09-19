# Session handoff — 2026-09-19

Branch `audio-tools-engine`, **pushed, head `28793f92`**, tree clean.
`tsc` clean on app AND website, **1634 tests**.

**Read first:** `docs/APE_ENGINEERING_LESSONS.md` (why things broke, §1–§9) and
`docs/APE_GOVERNANCE_DECISIONS_2026_09_19.md` (D10–D20, what was decided).

---

## ⚠️ THE THINGS THAT ARE ACTUALLY OUTSTANDING

### 0 · Build 23 is BUILT BUT NOT SUBMITTED — the testers are on build 22

```
build 22 (what the testers have)  daee7c5c…   submitted 9/18 18:34, e0a610d5
build 23 (finished, on EAS only)  e6578853…   NEVER SUBMITTED
working tree                      e6578853…
```

A finished build is not in TestFlight. `eas submit` is a separate command, and
after it somebody has to add the build to the Internal group (A's lane). And
because an OTA is keyed to a **per-platform** fingerprint, an `eas update`
published right now matches build 23 and would reach **nobody** — succeeding,
and delivering nothing. Full explanation in §7 of the lessons doc and D20.

### 1 · An Android build is OWED — save-to-Photos is broken on the installed build

My `blockedPermissions` change broke it; owner confirmed on device ("android
image save failed"). **Fixed in the repo, reverted entirely** — but it is a
MANIFEST change, so **no OTA can deliver it**. The Android binary on the
phones right now still has the broken save.

iOS is unaffected: A's `e0a610d5` photosPermission string stands and the 90683
fix is in.

⛔ Do not start any build without the owner saying so in that moment.

### 2 · ✅ `ADMIN_NOTIFY_EMAIL` and the Resend key are SET

The owner set both in the Supabase dashboard on 2026-09-19
(`info@proaudiotrainingacademy.com`). Neither has been exercised by a real
application yet, so delivery and the Gmail filter are still unproven.

### 3 · The employer feature has NEVER RUN — every table is empty

Everything about it is traced through code, live ACLs and direct privilege
checks. **Nothing has been observed working.** One real application end to end
is the only real test, and it also proves Resend delivery and the Gmail
filter. Expect to find something; the chain has four hops and two of them were
already silently broken this week.

### 4 · Two new surfaces have never been seen rendered

The guided profile flow and the employer admin screen. Both need a signed-in
session (admin screen needs an admin account); the web preview is signed out.
Verified by tsc and unit tests only.

---

## What changed today, in one pass

**Employer accounts — went from "looks complete" to actually working.**
An adversarial agent audit found my own claim was wrong. The chain now is:
website apply → probe → **6-digit code to the work email** → confirm →
decide → one tagged admin email → approved employer contacts members from the
directory, member sees the badge. Plus an in-app admin queue to review and
revoke. Security decisions in D10/D11; grant traps in
`reference_postgres_grant_traps`.

**Guided profile setup (D13)** — `ProfileSetupFlow`, shown while a profile is
unstarted and unpublished. Taps before typing; About pre-drafted from the
member's own picks; every step skippable; resumes from what is saved. Owns no
state and no rules.

**Directory areas 13 → 23 (D12)** — six areas we teach had no home, plus
"Still exploring — not sure yet" at sort 99.

**The whole a11y worklist is closed** — W1–W18. Live regions, `accessible` on
labelled elements, all 18 sub-44pt targets, matching boards, the SPL slider,
focus repair. Notable: 38 labelled elements had never reached iOS at all.

**Three teaching-accuracy errors** — the Digital lab's flagship myth panel
contradicted the app's own calculator about 144 vs 146 dB; the Binaural lab had
the localization threshold backwards in three places; "Lissajous" meant two
different pictures across labs with nothing saying so.

**Cymatics #6** — the dish, loudspeaker and bell had no drawing at all. Now
RN-SVG, device-verified by the owner.

**The native gain fix shipped and the owner confirmed it: "No crackle!"**
Open since 2026-09-13.

---

## The owner's five queued items — 4 done, 1 not started

| # | Item | State |
|---|---|---|
| 1 | Sound labs start at 30% volume | **DONE** — one constant, 8 initialisers, 3 deliberate exclusions (D17) |
| 2 | Cap messaging so this isn't "a secret messaging side app" | **DONE** — stricter option, every count per PAIR, 90-day cooldown after a decline (D18) |
| 3 | Report abuse + suspend / remove / ban | **DONE** — Moderation Phase 0 (D19) |
| 4 | Help search that implies smart search | **DONE** — tokenised AND-match + stop words, 11 tests |
| 5 | **Legal verbiage: LLC closure, liability, refunds** | ⛔ **NOT STARTED.** ccode can draft only — this needs a lawyer before it ships |

### Three rulings the owner owes on item 3

Not engineering, and nothing is blocked while they are open:

1. Does a ban **revoke earned credentials**? `credential_awards.revoked_at`
   exists, so it is one UPDATE either way. Revoking something somebody passed
   an exam for is a different act from removing them from a directory.
2. Does a ban **terminate paid membership**? You cannot refund an IAP
   yourself — the stores own that — so banning a paid member without a refund
   is a consumer-law and chargeback question.
3. **Retention period** for reports, messages and moderation records after a
   removal.

---

## Parked, with the reasoning written down

- **`.git` is 80% of the EAS upload** (572 MB archive). One line in
  `.easignore` — must ride with a native build, because `.easignore` is
  fingerprint source #1. In `APE_NEXT_BUILD_CHECKLIST.md`.
- **`mergeDims` blend vs mean** (D16) — a ruling, not a defect.
- **Cymatics #14 / #18 / #19** (D16) — Medium scope calls, text recovered and
  in `Downloads/2026-09-18_BUGHUNT/design-cymatics.md`.
- **Production #5a packet preview** — needs `react-native-webview`, which is
  now installed, so this is unblocked at the next build.
- **Paywall "early beta" / "prices valid through the end of the year"** — a
  commercial promise in the owner's voice. Flagged three times, not rewritten.

---

## Standing rules that bit this session

- **NEVER** run `eas build` / `eas submit` without the owner saying so in that
  moment. Store consoles are Comp A's lane.
- **Deliver one file loose in `Downloads/`**, not wrapped in a folder.
- **A permission belongs to the SDK, not to your reading of the code paths.**
- **Read every grant back.** A revoke can silently change nothing, and an RLS
  policy with no GRANT is inert — that one bit twice (lessons §8).
- **Build, submit and update are three different acts** (lessons §7, D20).
- **Zero rows means it has never run** — say that, don't say "complete".
