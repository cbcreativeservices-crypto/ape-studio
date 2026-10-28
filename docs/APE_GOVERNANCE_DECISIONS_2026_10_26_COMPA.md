# Governance decisions — 2026-10-25 / 26, Computer A record (D102–D109)

Owner rulings from Computer A's launch-review session (25 Oct evening into 26 Oct early morning), while both stores were still in review.

**Numbering:** ccode's record `docs/APE_GOVERNANCE_DECISIONS_2026_10_25.md` (OTA branch) already uses **D91–D101** for the same days. This record therefore starts at **D102**. (A first version of this file wrongly reused D91–D99; renumbered 26 Oct.) The verify-by-printed-code ruling is ccode's **D100**; Computer A's apply result is recorded under it below.

## D102 · Launch review accepted; task plan is the working list

- **Academy Launch Review** (Claude Docs, https://claude.ai/artifact/3438w4CK844trC2fLhi6QN): app, website, business, how the pieces connect, security, health, SWOT, 30/60/90 plan, business-plan update, decisions, sources. The owner agreed with the plan and almost all action items.
- Revised the same day after the owner's correction: the app is **two products** — a pro audio toolkit (free 31,558-term glossary, 166 calculators in 56 workspaces, 8 measurement tools, 62 interactive labs, Career Finder with 1,902 titles in 42 families) and a training academy (171 topics, 145,789 questions, 124 certificates / 36 programs, employer verification). The 32 Meta ads already target 22 audiences in US/CA/UK/AU.
- **Academy Launch Task Plan** (Claude Docs, https://claude.ai/artifact/3wJAhHuLthfFEYmzMPYtp8) is the working to-do list: Phase 1 now / Phase 2 approval day / Phase 3 days 1–30 / Phase 4 days 31–90.

## D103 · Owner decisions, 25 Oct (decision sitting)

| Topic | Decision |
|---|---|
| store-notifications security fix (repo b2601b4f) | Deploy on approval day, before Release |
| Certificate release | Daily automatic job (Comp A designs; owner approves the design) |
| Certificate rules (`lab_requirements_enforced`, `certificate_requires_exam`) | ON on approval day, together with the release job |
| Email confirmation | ON within 14 days of launch |
| Sandbox and comp grants | **No** end date |
| Access codes | Per-seat codes with end dates (Comp A server side; app screens in 1.0.1 if needed) |
| Two uncommitted server files | Done 25 Oct: stale validate-purchase copy discarded; employer-confirm-email committed as c4b8cc10 (matches live v14) |
| New content after launch | Keep adding (no freeze) |
| Lifetime plan | Keep; review 30 Jun 2027 |
| 10-page plan financials | Withdrawn; use the review's scenario model |
| Instructor progress view | Version 1.0.1 |
| Apple Small Business Program | Owner says already enrolled (Comp A to confirm the 15% rate) |
| Insurance | Quotes in month 1 |
| Onboarding tour | Once per account, next app update |
| Part-time contractor | When support passes 5 h/week |

## D104 · Institutional seat pricing (annual only, outside the stores)

- Institutional memberships are **annual only**, sold outside the App Store and Google Play, and **never disclosed to the stores**.
- Ask each buyer whether they are a **public non-profit** or a **private / for-profit** organization.
- **For-profit:** 90% of the store Annual price for 1–10 seats; **85%** for 11 or more seats. (The owner first said 80%, then corrected to 85%.)
- **Non-profit:** 75% of the store Annual price at any size.
- Today ($59.99 Annual): $53.99 / $50.99 / $44.99. From 1 Jan 2027 ($99.99): $89.99 / $84.99 / $74.99.

## D105 · Paid Meta ads held until version 1.0.1

- Comp A checked the store build (origin/next-store-build @ 800bf002): **no Meta SDK and no measurement partner** (analytics = Aptabase + Sentry), so Meta cannot see installs from builds 39/23.
- Owner: **hold paid ads until 1.0.1**, which adds the Meta SDK (with App Privacy / Data safety updates and Apple's App Tracking Transparency prompt). Then run the approved $50/day plan (US/CA/UK/AU, 18+, $25 iOS 14+ / $25 Android, four weekly waves) and judge it on days 3, 7 and 14 against the break-even rule (under about $3 per install keep or scale; over $6 with no organic lift drop to $25/day).
- Launch runs on community and organic channels: the owner's 40+ Facebook audio groups, an audio-education creator (250K+ followers), the website, the 3 reels and YouTube. Per-channel store links count installs by source.

## D106 · Ad creative

- All copywriter-proposed image headlines approved (they were already in Canva when checked, incl. the "you phone" typo fix).
- Credentials image: **"Learn it. Get certified. Let employers verify it."** (replaces "Network with Employers").
- Reel music is the owner's own (licensed for ads).
- Some ad photos are AI-generated: turn on Meta's AI label for those when ads are built.
- "166 calculators" in the ads is correct (store build registry: 166 in 56 workspaces).

## D107 · Account security

- Two-factor sign-in ON, codes on both phones (iPhone + Pixel): Supabase, GitHub, Vercel, Google (Play Console account). Apple already ON (1 phone number, 3 devices).
- **Meta:** the business portfolio (id 1097312032694587) is controlled by the Facebook account "Channing Chano Booth" (full access). Meta refused the 2FA change on 25 Oct ("can't do that at the moment", after failed password tries); retry after a day, in the Claude app's browser pane, with one careful password attempt.
- Supabase backups confirmed: org on Pro (daily, 7 days kept). Point-in-time recovery (~$100/month) not enabled; owner's call later.
- **Later (owner's to-do):** Bitwarden (free) for passwords and all recovery codes; a **family member** as emergency contact (Bitwarden Premium $19.80/yr or a sealed printed sheet).

## D100 (ccode's number) · Website "Verify by code" accepts the printed certificate code: APPLIED 26 Oct

- Bug (found by ccode 25 Oct): certificates print the first 8 characters of `users.qr_token`, but `public_verify_credentials` matched only `users.verify_code`, so every printed code answered "No match".
- Owner GO (via ccode's brief): Comp A ran ccode's guarded package on 26 Oct ~02:20 PT. 90_VERIFY = PASS · 5 · 5 · 5 · 0 · 0 · true; live check `/verify/F8461FBF` shows Pro1's 5 certificates.
- Backup: `public._ape_function_backup` row `public_verify_credentials_2026_10_25`; rollback page https://claude.ai/artifact/XDb5sobpDTKoLC4g7HLfsU.
- Known limit: deleted accounts' certificates (`retained_credentials`) still match by verify_code only.

## D108 · Time-trial removal on the server + Anorak kept fully open (runs on approval day)

- Owner (24 Oct): "There should be no way for a person to pass without doing the work." App side removed in the post-approval OTA branch `ota-after-approval-39-23` (99ab8484).
- Server package by Comp A (not yet run): `start_quiz_attempt` and `build_study_snapshot` lose the `trial_passed` shortcut; `credit_time_trial` EXECUTE revoked; all 24 `trial_passed` rows cleared.
- **All 24 rows belonged to Anorak** (the App Review member demo). Owner (26 Oct): "bring them back up to genuinely complete on that test account so the demo stays fully open." Step 15 records every term of those 8 topics as studied on those 24 rows.
- Package: `AUDIO APP\WAITING_FOR_STORE_APPROVAL\2026-10-26_TIME_TRIAL_SERVER` (00/05/10/15/90/99 + README + zip); artifact https://claude.ai/artifact/YXP2ZCF9Hp7HbVeeVwXehG. Dry-run on live in a forced rollback: all PASS, rollback byte-identical.
- **Run only after Apple approves** (Anorak is in the review notes), with ccode's post-approval OTA. Dropping the `trial_passed` column is deferred.

## D109 · Market and forecast basis for the business plan

- The 10-page plan's "100–250M" market figure is dropped; the year-one forecast is the review's scenario table (Conservative / Base / Strong) plus a **community-led** row reflecting the owner's 28-year network, groups and creator (middle ~60,000 installs, ~$300k net; placeholders until the owner gives the groups' combined membership).
- Market sizing (four ad countries, estimates): home-studio musicians/producers/DJs 11–28M; church sound volunteers 0.8–1.5M (≈373,000 US congregations; ~72% of church production teams mostly volunteer); podcasters/VO 0.3–0.5M; working techs 0.2–0.4M.
- Rule: rebuild the forecast from real data at day 30 and day 60, with installs counted by source.

## D110 · Intro video once per ACCOUNT: server half APPLIED 26 Oct
- Owner GO (26 Oct): "Yes: Comp A may run the intro-video-per-account SQL (guarded package, dry run first, ACK with verify rows)." (ccode's D99 item 7.)
- Live since ~07:30 PT:
  - new column `users.intro_video_seen_at`;
  - new functions `my_intro_video_seen()` and `mark_intro_video_seen()`, for signed-in users only (guests blocked).
- 90_VERIFY PASS (07:41 PT): pro1@ false → mark → true (in a rolled-back test); anon denied on both functions.
- Files: Downloads\2026-10-26_INTRO_VIDEO_PER_ACCOUNT_SQL. Rollback artifact https://claude.ai/artifact/PuaKtZ4hh6Gqw4DabxYLc2.
- The app half (8403954e) ships with the post-approval update. Owner confirmed the iPhone (build 39) still plays the correct intro video.

## D111 · Instructor view: labs scoped to the student's certificates; nothing hidden; no date filter (APPLIED 26 Oct)
- Owner rulings (26 Oct, via ccode's brief):
  - show progress only for the student's enrolled topics;
  - labs counted = the 15 Audio Fundamentals (`af_*`) labs plus the labs required by the CERTIFICATES whose required topics include the student's active enrollments (programs are not counted);
  - labs finished outside that set appear in a separate "other labs completed" list;
  - **the instructor sees everything the student completed, including before sharing.**
- Owner GO: "Yes: Comp A may change instructor_students and instructor_student_progress per the labs-scope brief."
- Applied ~08:45 PT:
  - new helper `private.student_scoped_labs(uuid)`, locked so only the instructor functions can use it;
  - only the labs parts of the two functions changed.
- 90_VERIFY PASS:
  - Pro1: 59 in scope, 4 complete, 1 other;
  - a student with no enrollments: 15;
  - 14 topics Pro1 completed before the share date still appear;
  - anon blocked on every instructor function.
- Live has no instructors or shares yet. The verify step used a temporary instructor inside a rolled-back block.
- Files: Downloads\2026-10-26_INSTRUCTOR_LABS_SCOPE_SQL. Rollback artifact https://claude.ai/artifact/UMQRAFR3t6ap5TqTSHev4M. Function backups `instructor_students_2026_10_26` and `instructor_student_progress_2026_10_26`.
- This replaces the 1.0.1 plan's B1 "OWNER DECIDES" box: the server side is done, and only the app screen is left.

## D112 · Launch-day website: ccode's branch is the one
- Gate-off on launch day = **ccode's 3dbb211b on `web-launch-day`**. Comp A's 93a60ff / `launch-day-site-DRAFT` is dropped and is not to be used.
- Legal pages: merged locally on `web-launch-day` (2549d94a), combining the live 2027 prices with the 10-22/23 rewrite.
- The **Terms zero-tolerance clause** (owner-approved 2026-10-15, incl. the 24-hour report commitment) goes in on `web-launch-day` before launch.
  - Comp A's answer to ccode, 26 Oct: put it in.
  - Open: the filter sentence ("may be refused before it is sent") stays on HOLD until Comp A confirms on live whether the message and contact-request filter is running.

## D113 · Google Play APPROVED; launch order confirmed (26 Oct evening)
- **Google Play approved the app.** Play Console Submission 3 (16 changes, submitted Oct 24 5:07 PM) has been **Ready to publish** since Oct 25 8:51 PM. Managed publishing is on, so nothing is public.
- The batch also contains **Open testing 20 (1.0.0) full rollout**. That is the old build-20 item, which D90 says to remove or update before publishing.
- **Owner's launch order (confirmed 26 Oct, 21:56 PT):** Apple approves → one OTA to both platforms (checked on the test phones first) → approval-day DB packages → **Apple Release and Google Publish together**.
  - The owner asked whether an OTA can go out before Publish: yes, technically. It still waits for Apple, because the same update would reach iOS build 39 while Apple is reviewing it (D74).
- Apple status not re-checked since 24 Oct (Waiting for Review then).

## D114 · Toddler-hunt server fixes: already LIVE (status check 26 Oct)
- Comp A's read-only check on live found every approved item from the 2026-10-14 brief already in place: #14, #12, #11, #6, #2 Part A and #3, plus #15 (glossary plain-English preview).
  - validate-purchase **v19**; its code comments date #2, #3 and #6 to 2026-10-23.
- **Play service account** `play-purchase-validator@pro-audio-training-academy.iam.gserviceaccount.com` has "Manage orders and subscriptions" (owner screenshots, 22:09 PT), so the server acknowledge works.
- Still on HOLD, unchanged:
  - #2 Part B;
  - the #6 restore wording (owner);
  - the app halves of #3, #6, #11 and #15 (ccode, next update).
- Status file for ccode: Downloads\2026-10-26_TODDLER_FIXES_STATUS.

## D115 · Website certificate thumbnails: Option A (27 Oct)
- Owner (09:52 PT): "use a for the certs".
- Both public pages (the QR scan page `/registry/<token>` and the Verify-by-code page `/verify/<code>`) list each credential with a small certificate image left of the title. Tapping a row opens that certificate full size, with Previous/Next.
- The QR scan page shows the certificate exactly as printed, working QR included. The code page shows the same certificate with "VERIFIED CODE <code>" in the QR box, because that page knows only the 8-character code.
- Website only; no database change. The covert microprint and ID glyph need the full token, so they stay absent on the code page (fail-closed).
- Preview: https://claude.ai/artifact/2f5ezFSXYKf7FuAKShMFMq. ccode brief: Downloads\2026-10-27_CERT_THUMBNAILS_CCODE. Deploy = owner's go.
- Also 27 Oct: the "audio engineer" files stay as uploaded; nothing to redo.

## D116 · ccode's "forgotten server items" brief: run now, ask before each deploy (27 Oct)
- The owner approved ccode's brief (R2, R4, R5, R6, R7, R8, R13, H3, H4, R3).
  - Then (≈10:00 PT): **"Everything now, in ccode's order"**, even with Apple still reviewing.
  - And: **ask him before each edge-function deploy.**
- Owner decisions in the brief: R13 YES (one-paid-month hold, job first, then flag); H4 KEEP `employer_profile_public`; R4 deploy approved.
- **Applied 27 Oct (all dry-run in a forced rollback first):**
  - R4 `store-notifications` v11 (owner "go 1", 10:50 PT);
  - R6 secret `users` columns re-locked;
  - R5 scenario rounds verified server-side;
  - R7a `set_registry_name`;
  - H3 daily pause job (10:53 UTC);
  - R13a release job (11:07 UTC);
  - R13b `certificate_requires_exam` = TRUE.
  - Certificates unchanged: 5.
- **Pending:**
  - R2 (secrets names from the owner, then deploy go, then one real application);
  - R8 (dry run stalled on the DB approval prompt; nothing changed);
  - R3 step 1;
  - R7b after ccode's OTA.
- **Owner smoke test for R6:** Profile, Settings student ID, certificate share QR.
- Rollback page: https://claude.ai/artifact/BeEYad8B7RsmMytXuyuDte. Progress file for ccode: Downloads\2026-10-27_FORGOTTEN_ITEMS_APPLIED.
