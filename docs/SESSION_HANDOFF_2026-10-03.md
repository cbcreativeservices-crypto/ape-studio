# Session handoff, 2026-10-03 (read this FIRST next session)

Branch `audio-tools-engine`. Everything is pushed, and an OTA update is **PUBLISHED** to production and preview for builds iOS 33 and Android 16. Tests: 4527/4527, tsc clean.

## 1. What happened today, in order
1. **Store and submission work.**
   - iOS 33 was submitted (fee8903b) with a temporary `ascAppId 6813607582` in eas.json, which was restored afterwards.
   - Android 16 was already in Play internal testing (A uploaded it by hand on 10-02).
2. **Owner rulings applied** (governance D50–D52; the file is docs/APE_GOVERNANCE_DECISIONS_2026_10_03.md):
   - glossary charging;
   - honesty over silence;
   - the four-state membership check.
3. **Hunt 4** found 9 fixes (10dc1565).
4. **Tier sweep** across about 20 screens (1e9f0f9d), plus the owner's recommendations 1–3 (f88cbb5b): lab guest wording and glossary member metering.
5. **Glossary 24 h server change** (owner-approved) went to Comp A:
   - migration `supabase/migrations/2026100301_glossary_term_reads_24h.sql`, NOT applied;
   - brief: Downloads/2026-10-03_COMP_A_GLOSSARY_24H_REOPEN.md.
6. **Hunt 5** found 14 + 4 corrections (38dc0a4a). Most of them were gaps the tier sweep had left. A tidy round of 9 items followed (401bb4bf).
7. **Hunt 6** found 15 + 1 correction (78f3638d).
8. **The owner's extra calculator check:**
   - A (formulas): 0 wrong formulas or constants across 163 functions in 55 workspaces, and 12 edge fixes.
   - B (screens/store): 2 fixes.
   - A follow-up round of 9 items: one exact 0 dBu / 94 dB SPL reference; NIOSH 80–140 dBA; reflection path; 70 V headroom; list commas (00e3869b).
9. **Final rounds C and D** (8be3c78e): 19 owner-recommendation items.
10. **PUBLISH** (owner go): see CROSS_SESSION_HANDOFF for the update IDs. u.expo.dev serves them. The Pixel was not connected, so there is no on-device proof.

## 2. Bug-count trend (report it honestly)
30 → 22 → 10 (10-02 evening), then 9 → 14 (+4) → 15 (+1).
- Hunt 5 rose because of the tier sweep's own gaps.
- Hunt 6 went deeper: calculator accuracy, Settings write-before-load, and the Production rename wipe.

## 3. Open items
- **Comp A:** apply 2026100301. When it is live, remove the client no-re-send guard in `glossaryGateway.ts` (READ_UNANSWERED) and update the glossaryMemberMeter / glossaryShareCharge / glossaryHunt5 tests.
- **Testers on iOS 32 / Android 15** get nothing until they install 33/16.
- **Owner calls, recorded in D54 and not changed:**
  - EarLab/LabCategory open before the first read;
  - the Dashboard study switches on 'unconfirmed';
  - an offline cold start after more than 1 h goes to login.
- **New small owner questions** (in the Downloads report):
  - "100,200,300" with no spaces is now refused in calc list fields;
  - the 70 V default headroom changed from 2 dB to 1 dB;
  - the NIOSH dose now excludes <80 dBA.
- **Lower-priority suspects that agents noted but did not fix** are listed in memory `project_overnight_toddler_2026_10_02.md` (hunt 4–6 recs lines).

## 4. Rules and helpers added today
- AGENTS.md HOUSE HELPERS now covers:
  - `useMemberGate` / `useUpsellAllowed` / `useGuestWording` / `safeSessionResult`;
  - the three faces of a list screen;
  - shared calc reference constants.
- Lessons: docs/APE_ENGINEERING_LESSONS.md, section "2026-10-03".
- **Sync hook behaviour:** the post-commit hook does NOT add a stub when the commit itself touches `docs/CROSS_SESSION_HANDOFF.md`. Commit work separately from channel edits, or write the entry by hand.

## 5. How to publish next time (this worked today)
1. Stop any preview server first.
2. Run `npx expo-updates fingerprint:generate --platform ios|android`. The result must equal iOS `e8e3455b…` and Android `22976b0e…`.
3. Check `eas update:list --branch production` for a rollback.
4. Run `npx eas-cli update --branch production --environment preview --platform all --message "…" --non-interactive`, then the same command with `--branch preview`.
5. Verify with a curl of u.expo.dev using `accept: multipart/mixed` and `expo-protocol-version: 1`.
