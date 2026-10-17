# Session handoff — 2026-10-16 (night)

**Folder / branch:** `C:\Users\profe\dev\ape-build-snap`, `next-store-build`. Nothing is pushed, published, uploaded or submitted.
**Store state:** iOS 1.0 build 36 and Android 20 are **in review**. Release is MANUAL in App Store Connect. D74: no production OTA and no bucket upload until both stores approve.
**Checks (10-16 night):** full suite 12,209/12,209 at 477495bb; tsc clean; fingerprints Android b975a5d1 ✅ and iOS f6a7ee3c ✅. Checked again after the last code commit c9ee6177 and the image commits; image assets do not change the fingerprint.

## Done 10-15 → 10-16
- **Lab-art grading and fixes:** every lab graded on a 20-category scale; fix waves run over all the labs; average 6.94 → 7.44 (82 B, 2 C). Report: `Downloads/2026-10-16_LAB_ART_GRADES.html`.
- **Owner rulings on the HOLDs:** d5cfbd01 (D80).
- **Mixing Guides:**
  - keyboard low-end corrections (D77);
  - the keyboardist caution in 17 guides, plus 10 guides with a one-line addition;
  - English glosses: 902 in 29 guides (D78).
- **Home, Flashcards and Glossary UI rulings** (D84).
- **Store-readiness fixes** a03d9949; chat rules message bfab662f (D81).
- **Images:** 6 Comp C images installed (D82). 72 still needed: `Downloads/2026-10-16_IMAGES_STILL_NEEDED.md`.
- **Promo buttons** for the owner's video: `Downloads/2026-10-16_PROMO_BUTTON_*.png` (transparent and on black).
- **Approval-day plan:** `Downloads/2026-10-16_APPROVAL_DAY_PLAN_UPDATE_VS_NEXT_BUILD.md`. Use it with `Downloads/2026-10-15_APPROVAL_DAY_CHECKLIST.md`.

## Waiting
1. **Store approval (owner).** Then follow the checklist: Release This Version → one production OTA (258+ commits, no native) → tile and certificate uploads → switch the exam lab gate on → prove it on phones → Comp A's server work.
2. **New intro video (owner).** The owner has a newer intro video than the 10-11 v2. Convert it to 1080p30 fast-start, replace `assets/onboarding/intro_v1_1080p30.mp4`, play it in the browser and show the owner BEFORE the OTA.
3. **Comp C images:** match returns against IMAGE_SPECS. To send back: the Live Mixing Specialist and Microphone Technology Specialist certificates.
4. **Version 1.0.1 native build:** about 1–2 weeks after launch, owner's "build" only. Queue: `project_next_build_queue` memory items 1–11 (audio-engine fixes, ping-pong, stereo source, deep links, package bumps, 16 KB check).
5. **Exit flow** (branch `exit-flow`, worktree `C:\Users\profe\dev\ape-exit-flow`): waits on Comp A's server brief. The privacy draft is approved. The website `/delete-account` page is on branch `web-delete-account` (not pushed).

## Traps
- Never switch branches in ape-build-snap. Never commit the `__nav` preview line; it is not in the tree now.
- `docs/CROSS_SESSION_HANDOFF.md`: fill each commit's stub by sha.
