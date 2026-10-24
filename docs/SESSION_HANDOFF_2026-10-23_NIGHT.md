# Session handoff · 2026-10-23 night (ccode, dj-lab → next-store-build)

Everything below is committed on `dj-lab`, fast-forwarded into `next-store-build` (the OTA source), pushed, and published to the **Android preview channel only** (the Pixel). Fingerprint unchanged: **b975a5d1** (matches installed Android build 130e5d8b). Nothing went to production, and nothing was built or submitted.

## Owner permissions for tonight
Given in chat before the nap:
- Preview-channel updates as needed.
- Commit, merge and push both branches.
- Fix real bugs; list design and copy questions for the owner.
- The onboarding change waits.

## Shipped tonight

| Area | Change | Commit |
|---|---|---|
| DJ lab | "Froze black at about screen 7" was **screen 17**: the dial loupe was a rounded rectangle with no corner radius. Native Skia throws on that and the screen goes black; web draws it anyway. Now a plain rectangle, plus an app-wide ratchet test. | 2e25c2e7 |
| Home | Study-area eyebrow reads "Explore Certificates & Programs". The Start Here title is on 3 lines. | e1821279 |
| Home | Free-topic caption above the card: green **Free** · blue headphones + **Study Topic** (members see no "Free"). | c90b20c1 |
| Home | Headline over the study-area cards: **Learn About the Academy’s Curriculum**. | 76cd7765 |
| Home | Commercial 70V card: the owner's warmer art, **bundled in the app**, unprocessed, **with** the standard dark wash. | 83825356, 090e17a5 |
| Glossary | Add/remove flashes the filter icon. Search shows in both modes. BEG previews use `plain_english_preview` for non-members (Comp A #15). | e1821279, 72c7f6c7 |
| My Enrollments | New help popup. The approved explanation sits under the title, with a reveal triangle after 5 visits. "?" is no longer inside the Return button. | e1821279, d5f76aea |
| Mixing Guides | A tap opens the guide **at once** (the 1-second map flash before opening is gone). | e251c2da |
| Cable Install, stage 5 | The J-hooks now carry the cable: strap behind, saddle under, cable flat on each saddle. | f1e0ff97 |
| Messages | SEND passes `p_client_msg_id` (Comp A #11), with a 2-argument fallback. | 5cc13851 |
| Purchases | Each purchase is tagged with the buyer's account id (Comp A #3). | 0c61cfe7 |
| Server source | Repo `validate-purchase` = deployed v18. This is the repo copy only; nothing was deployed. | d88c4e64 |
| Handoff log | Restored after two bad stub fills wiped it; Comp A's 18:55 and 19:30 entries re-posted. | 8dc6d85f, 0c61cfe7 |

All 14,822+ tests pass and TypeScript is clean at every commit.

## Device testing so far (Pixel 7 Pro)
- **DJ lab:** all 24 screens, every dock tray, full screen. No errors, no black frames.
- **54 labs:** each opened and stepped through every page. No crash, no error, no black frame.
- **Single-screen labs:** 38 labs are being exercised (tabs and dock trays). That and **128 Miking lessons** were still running when this was written. Then come the **8 tools** and the **final check pass**.

## Open: owner decisions (HOLD)
- **HOLD:** #6, the restore-failure wording (Comp A says it's an owner hold).
- **HOLD:** onboarding for every new account on first sign-in. Approved, waits until the owner is back.
- **HOLD:** Cable Install stage 8 "As found" view. It is deliberately wrong (it's the find-the-problems exercise); say if anything there should still change.
- **Not verified:** a real store purchase carrying the new account tag. It needs a real purchase, which only the owner can make.
- **Resubmission plan unchanged:** see `2026-10-23_RESUBMISSION_PLAN_OTA_AND_NEW_BUILD.md`. Builds iOS 37 + Android 21 only on the owner's GO.

## Lessons recorded in memory
- A sed stub fill with an empty line number rewrites the whole handoff log. Always guard it.
- Never give a reason without reading the code first. (Tonight I wrongly said the study-area cards are signed-in only.)
- Web preview: a blank page after reload means the Skia load race or a long rebuild, so reload again. Home's carousel only renders cards near the centre; use the dot row to reach a card.
