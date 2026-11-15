# Governance decisions — 2026-11-14, ccode record (D119–D123)

These are owner decisions made in the Suggested Setups side session. Each quotes the owner's words. The must-do row is D66.

## D119 · Room Design: a "Suggested setups" module (owner 2026-11-14)

**The owner's request:** "in the room design and monitoring lab, we should have a suggested setup mode that takes the users room and equipment and then outputs 3 suggested possible setups that have been calculated to be better results …"

**The owner's choices (quick-picks, all as recommended):**
1. A new module 5, after Explore placement. The lab now has 7 modules.
2. Setups A (bass) and B (image) may move the desk with the chair; C (least change) never does.
3. TRY THIS SETUP fills OPTION A, then OPTION B, and asks before replacing one. START is never touched.
4. Show only the genuinely better setups, plus one sentence saying why there are fewer.

**The build rules:**
- Only the lab's own model (roomModel) is used; no new physics.
- A setup must beat the current layout on its own goal and add no new "!" warning and no new placement problem.
- The search margin is 30%/70% against the Review page's 20%/80%.
- Woofers stay at least 35 cm from the front wall.

**History:** built in e2829cfe; bug-tested and included in the OTA on the owner's word ("Include it in the OTA" / "bug test it first").

## D120 · Room Design copy (owner 2026-11-14, "resolve these")

1. **The Review page's front-wall tip** no longer says the moved notch is "tamed by directivity and ordinary panels". It now says: close to the wall, the cancellation moves up out of the low bass, where 10 cm or more of absorption can reduce it, and keep the maker's rear-port clearance; well away, it drops low, below what nearfields play. Distances follow the learner's units.
2. **US percent style across the Room Design lab:** "35%", not "35 %". (Commit 3b7d9431.)

## D121 · Sound Safety warning: buttons only at the end (owner 2026-11-14)

**The owner's words (iPhone screenshot):** "do not show the 'i understand/keep sound off' area until the user scrolls all the way down to the bottom of the screen."

**What changed:** the pinned footer from the 11-14 audit (row 2) now appears only once the end has been reached (sticky per request). Until then, a hint line shows.

**Exceptions:**
- A warning that fits without scrolling counts as read.
- A phone screen reader gets the buttons at once; the web is excluded.
- BACK still declines.

**Commit:** 3cd52abc. **Published** (see D122).

## D122 · Production OTAs of 2026-11-14 (owner "Publish", "Publish it")

**OTA 1:** commit 632f9828; iOS group fc9a721c, Android group 874669d0. It carries the two new labs, lab fix rounds 1 and 2, the Career Finder text, Suggested Setups and the RTA glossary fix.
- **Before publishing:** a Pixel dev-build test (Game Audio sound heard by the owner; Stage Plot drag, SHARE PDF and PRINT).
- **After publishing:** the owner's iPhone test was "good".

**OTA 2:** commit 3cd52abc; iOS group 3c676af4, Android group c877873b.

**Both:** line-ending sync clean, both fingerprints MATCH, sourcemaps uploaded, and the Pixel Play app proven by the update group in logcat.

**Undo points:** OTA 1 rolls back to the 11-11 groups. OTA 2 rolls back to OTA 1.

**Comp A afterwards:** applied D60 (f) step 20 (2 lab rows and 9 requirement rows, no credit removed).

## D123 · The owner's account is a lifetime member (owner 2026-11-14, "it needs full membership - lifetime", "you run it")

**Account:** APE-C-32CDEBDA8E. Its `entitlements` row was a refunded Play test purchase.

**Now:** active / admin_grant / lifetime / expires 2099-12-31. That end date is the same one `redeem_access_code` uses for lifetime codes.

**How it was done:**
- The change was rehearsed in a rolled-back transaction first.
- The old row was backed up to `public.entitlements_backup_20261114`. Comp A revoked the client grants on that table and keeps it until after 1.0.1.
- Comp A confirmed `has_academy_access` = true.
- Paste files, including the rollback, are in `Downloads/2026-11-14_OWNER_LIFETIME_MEMBERSHIP_SupabaseDB`.
