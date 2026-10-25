# Governance decisions — 2026-10-24

These are the owner's rulings from 2026-10-24, the day of the final store build and the Apple resubmission. They follow D77–D84 (2026-10-16).

## D85 · Final store build = iOS 39 / Android 23, built and submitted together

- **Source:** built on the owner's GO from `next-store-build` @ 802c3d7c. All 14,966 tests passed. Native engine v10 compiled cleanly on EAS.
- **Apple:** iOS 1.0 (39) was resubmitted, with Academy Lifetime, Monthly, Annual and the Academy Membership group in the same submission. Waiting for Review from 4:38 PM.
- **Google:** Production 23 (1.0.0) was sent for review (~5:10 PM). Managed publishing is ON.
- **Both stores always go together** (owner 2026-10-23). Nothing goes live until the owner presses Apple **Release** and Google **Publish** on the same day.
- **No production OTA while in review** (D74). OTA now reaches only builds 39 / 23; 38 / 22 keep their own runtime.

## D86 · The App Review Sign-In box holds the NON-member account

- **The rule:** Sign-In Information = `nonmember@proaudiotrainingacademy.com`. The member demo (`anorak@`) is listed in the Notes, labelled.
- **Why:** Apple's own help page says to provide an account with an expired subscription. Build 36 was rejected under 2.1(b) because the Sign-In account was a member, and members never see the plans.
- **Attachment** (App Review Information + Resolution Center): `2026-10-24_APPLE_REVIEW_ATTACHMENTS_build39.zip`, holding:
  - the paywall + Terms + Privacy screen recording;
  - the welcome-page screenshot.
- **Notes:** 3,935 of 4,000 characters, owner-approved.
- **One device per account:** after recording or testing with a review account, **log out**, or the reviewer meets "signed in on another device".

## D87 · Institutional licensing and access codes stay, explained openly

- **The rule:** the "Access or promo code" field stays on Create Account and in Settings › MEMBERSHIP. The owner said institutional licensing "is part of the business".
- **Codes are:**
  - organization-paid seats (one code per seat, under a separate agreement, usually at a multi-seat discount); or
  - free complimentary codes.
- **Codes are never sold to individuals.** Individuals buy only through In-App Purchase.
- **The review Notes explain this up front** (owner: "be clear, open and proactive knowing this may flag"), citing 3.1.3(b) and linking `https://www.proaudiotrainingacademy.com/institutions`, which is now public (exact-match exception in `web/proxy.ts`).
- **If Apple objects:** the fallback is website-side redemption. It needs no new build, because the app only reads the membership.
- **"Redeem an offer code"** (Apple's / Google's own code screen) was added on the paywall and in Settings › MEMBERSHIP.

## D88 · "Research and learn more ↗ · View images ↗" on glossary terms and flashcard backs

- **What it is:** a quiet line on the glossary term page and the flashcard back.
- **"Research and learn more"** opens a popup with Wikipedia, Google and Google Scholar. Popup copy is owner-approved: *"Keep exploring "{term}" — see pictures, history and other explanations. These open in your browser, outside the Academy."*
- **"View images"** opens Google Images with SafeSearch on (`safe=active`).
- **Always the phone's own browser,** never an in-app browser: that would count as "unrestricted web access" in Apple's age rating. Nothing comes back into the app.
- **Search phrases:**
  - Wikipedia uses the exact article when the server has `wikipedia_url` (English-Wikipedia URLs only), else a search for the bare term.
  - Google, Scholar and Images use the server's `search_query` (a plain phrase of 2–120 characters), else "term + audio".
  - Both columns are optional, and their read is separate and non-fatal.
- **Data source:** Comp B researches per-term context and Comp A loads it (package `Downloads/2026-10-24_ComputerB_WIKIPEDIA_LINKS_WITH_DATA/`, B001 = the two free topics first). The DB migration needs the owner's go. Once loaded, links improve with no app update.
- **Not on Fill-in or Matching:** they have no review screen yet (NEXT BUILD item 2).

## D89 · 1 January 2027 prices: decided, part-scheduled

- **New prices from 1 Jan 2027:** Monthly $9.99 → **$14.99**, Annual $59.99 → **$99.99**, Lifetime $99.99 → **$249.99** (ruling H-B, confirmed 2026-10-24).
- **Lifetime:** scheduled in App Store Connect today (Global Price Change).
- **Monthly and Annual:** Apple offers "Plan a Price Change" only after a subscription is approved. Schedule them **right after approval**, choosing **"Preserve prices for existing subscribers"**.
- **Play Console:** schedule all three.
- **Why it's urgent:** the paywall's "These prices are available until 1 January 2027" must be backed by a real change on that date. Never extend or reset the date.

## D90 · Launch day

1. Wait until **both** Apple and Google approve.
2. Schedule the subscription prices (D89).
3. In Play's Publishing overview, the batch "**Changes ready to publish (13)**" is the OLD approved launch (Production 20 in 177 countries, Open testing 20, store listing). **Never press it before launch day.** On launch day, first remove or update the Open-testing-20 item.
4. Press Apple **Release** and Google **Publish** together. Production then ships 23.
5. If the reviewer bought Lifetime on nonmember@, revoke that entitlement.
6. Location returns in the next build (NEXT BUILD list in `docs/APE_NEXT_BUILD_CHECKLIST.md`).

## Engineering note (not a ruling)

**App Store Connect's forms ignore values set by script.** Setting a field's value with JS (native setter + `input` event) looked right but was never registered; the page restored the old values on refresh. Fill ASC and Play forms with **real clicks and typing** only.

**Upload limits:**
- App Review attachments accept lower-case extensions only (`.mp4`, not `.MP4`). Convert HEVC to H.264.
- Several files go in one `.zip`.
- The Chrome upload tool's limit is 10 MB, so the 160 MB AAB is uploaded by the owner.
- EAS has no Play service-account key, so `eas submit` to Play fails non-interactively.
