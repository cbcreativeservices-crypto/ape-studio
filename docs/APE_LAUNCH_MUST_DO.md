# THE launch must-do list (one list, kept current)

**Rule (owner 2026-10-26, "Let's not again forget things"):**
- This is the ONE list of everything owed after both stores approve, on launch day, and in 1.0.1.
- An item goes here **the moment** it is deferred.
- It leaves only when it is done **and verified**, with the commit or result written next to it.
- Read this before answering "what's next".

Copies: memory `launch-must-do-list.md` · Downloads `<date>_APE_LAUNCH_MUST_DO.md/.html`.

**Last reconciled:** 2026-10-26, twice. The second pass came after finding the second memory store, `C:\Users\profe\.claude\projects\C--Users-profe\memory\`; its "pending after approval" and "launch reminders" notes are folded in here. Sources: the session transcript, both memory stores, and:
- `CROSS_SESSION_HANDOFF.md`;
- the governance docs, D44–D101;
- `SESSION_HANDOFF_2026-10-*`;
- the OTA branch log;
- the live DB and storage.

## Where things stand

| | |
|---|---|
| Store builds | iOS 1.0 (**39**) and Android 1.0.0 (**23**), both IN REVIEW since 2026-10-24 |
| Rule while in review | **D74:** no production OTA. Website and server changes only with the owner's go |
| Post-approval OTA branch | `ota-after-approval-39-23` (worktree `C:\Users\profe\dev\ape-workbench`). JS/content only, committed and pushed as each change lands (PROTOCOL rule 18) |
| Owner's test phone | Pixel 7 Pro has Android **build 23** since 2026-10-26 (sideloaded, debug-key signed). Pro1 signed in again by the owner, 2026-10-26 morning |

## A. When BOTH stores approve: the post-approval update (owner's GO each time)

| # | What | Status |
|---|---|---|
| A1 | Check that the fingerprint of `ota-after-approval-39-23` still matches 39/23 (iOS `91355451…`, Android `a903813a…`). Run tsc and the full suite. Check `eas update:list --branch production` for a rollback | to do |
| A2 | Publish the OTA to production, iOS then Android (`eas update`), **owner's GO in the moment** | to do |
| A3 | **Upload the 40 newer topic tiles** at the same moment as A2: `node scripts/upload-topic-tiles.mjs`, which needs the service key. The server holds the 2026-09-09 versions of gs3100 3150 3160 3170 3180 3200 3220 3290 3310 3330 3340 3400 3420 3430 3490 3530 3540 3600 3680 3700 3790 3820 3830 3840 3930 3960 3990 4040 4090 4120 4210 4230 4310 4410 4470 4490 4700 4710 4720 4730. Found 2026-10-26 by md5 comparison; the owner-approved images from 10-17/18 were committed but never uploaded. Spot-check 2–3 public URLs | to do |
| A3b | **Upload the 32 newer certificate-card images** (`course-cards` bucket) at the same moment: `node scripts/upload-credential-cards.mjs`, which needs the service key. The server has 09-30 versions of 31 `cert-*-v3.webp` files plus `prog-broadcast-podcast-and-streaming-audio-v3.webp`. Found 2026-10-26 by md5; the home-store note of 2026-10-11 said to upload them with the tiles | to do |
| A6 | **Turn on "labs required for the final exam"**, in the SAME sitting, AFTER the OTA is published, never before: `lab_requirements_enforced()` → `select true` (it's `false` on live, checked 2026-10-26). Then test: a cert with no labs → the exam starts; labs undone → `labs_incomplete`; an earned cert → `already_earned`. This is Comp A's "certificate rules switch on approval day" | to do (Comp A or ccode, owner's go) |
| A4 | Prove the update landed on a device (Sentry OTA context or Pixel logcat). Report the update IDs | to do |
| A5 | **Comp A server changes**, timed with the OTA: the time-trial removal (`docs/2026-10-24_CCODE_TO_COMP_A_REMOVE_TIME_TRIAL_SERVER.md`): stop honouring `trial_passed`, revoke `credit_time_trial`, reset passes | Comp A's package READY (2026-10-26; folder `AUDIO APP\WAITING_FOR_STORE_APPROVAL\2026-10-26_TIME_TRIAL_SERVER`; clears 24 Anorak `trial_passed` rows, records their 8 topics as studied). Owner's go at approval |

**What the OTA carries** (as of 2026-10-26; each commit is on the branch):

| Commit | Change |
|---|---|
| 99ab8484 | Time Trial quiz shortcut removed (D91) |
| a8cf616a | Registry "verify" line opens the member's own /registry/<token> page (D93) |
| 6d29a85c + 102879cc | Sample certificate: "SAMPLE · NOT FOR PRINT" sash, seal softened (33% +13%), QR kept (D94) |
| 0bbfde4b | Signatory "Channing “Cháno” Booth · Founder & Curriculum Director" (D95) |
| 931a0ff7 | Certificate PDF gets a readable file name (D96) |
| 1e272c8f | iPhone edge swipe on the Profile + Progress tab roots (D97) |
| 1e914db5 | iPhone swipe-back on 25 audited screens (D97) |
| fcdab163 | Launch audit Task A items 2–4: Sentry environment = channel, lab probe dev-only, study queue flushed before a forced sign-out (D99) |
| 2e4cf973 | Owner change list D0a/b/d: Progress share card + real certificates; popups with text scroll as one page |
| 6578217a | Owner change list D0e–i: DAW "Don't See a Term?" note, ALL tap, FULL VIEW label, purple Bookmarks flash, browser-window link icon |
| 8403954e | D2 intro video once per ACCOUNT (app half; server SQL is Comp A's) + D7 comment |

## B. Launch day (D90, owner presses the buttons)

| # | What | Status |
|---|---|---|
| B1 | Schedule Monthly $14.99 / Annual $99.99 in App Store Connect (only possible after approval), with "Preserve prices for existing subscribers" | to do |
| B2 | Play Console: schedule all three 2027 prices | to do |
| B3 | Play: remove or update the Open-testing-20 item in "Changes ready to publish (13)". **Never press that batch before launch day** | to do |
| B4 | Press Apple **Release** and Google **Publish** together | to do |
| B5 | Revoke any reviewer Lifetime on nonmember@ | to do |
| B6 | Website: gate OFF, plus store links (`web/lib/appstore.ts`: Apple id6813607582, Play com.cbcreativeservices.apestudio) as ONE launch-day push. Comp A Task B; it pairs with gate-off commit 93a60ff on `launch-day-site-DRAFT` | PREPARED 2026-10-26 overnight, LOCAL ONLY: `web-launch-day` @ 3dbb211b (worktree `ape-web-launch`) has gate off + store links. NOT pushed. **Before launch day, the owner decides a merge conflict:** this branch's Terms/Privacy edits (10-22/23) vs the live branch's newer legal edits (10-24/25: 2027 prices back in the Terms, the camera line, /institutions, /verify). Comp A's own gate-off commit 93a60ff is on Comp A's computer, not here. **OWNER DECIDED 2026-10-26:** gate-off = ccode's 3dbb211b (Comp A's 93a60ff is dropped); legal pages = the live 10-24/25 texts plus whatever 10-22/23 added. **DONE locally:** merge 2549d94a on `web-launch-day` — Terms = the 10-22/23 rewrite (free access / Academy membership, verification + Pro Registry live, §17.17–17.18, email-only sign-in, Version 1.0) with the live D89 prices in all three places; the §9.11 "price changes handled through the stores" sentence now carries D89's "existing subscribers keep their price"; Privacy = the 10-22/23 text (live camera fix already in it). Website type check clean on the changed files. **Ready to push on the owner's launch-day go** (push = Vercel deploy) |
| B7 | Check the Play account-deletion URL (Data safety) loads publicly with the gate ON and OFF (Comp A Task B3) | CHECKED 2026-10-26: gate ON → /support, /privacy, /terms answer 200 (/about 401); /support has "How do I request account or data deletion?". Gate OFF → every path passes (web/proxy.ts:109). Comp A/owner: confirm Play's Data-safety deletion URL is /support |
| B8 | Test data: pro1@ holds 5 test certificates (`credential_awards.source='owner_test'`) and `show_in_registry=true`. Remove with `delete from credential_awards where source='owner_test'` if the owner wants a clean launch | owner's call |

## C. Waiting on others

| Who | What |
|---|---|
| ~~Comp A~~ | ~~Run the verify-by-printed-code SQL~~ **DONE 2026-10-26 ~02:20 (Comp A ACK):** 90_VERIFY = PASS 5·5·5·0·0·true; live `/verify/F8461FBF` shows Pro1's 5 certificates; backup row `public._ape_function_backup` `public_verify_credentials_2026_10_25` |
| Comp A | Time-trial server SQL (A5): **READY, not run** (Comp A 2026-10-26; dry run on live in a forced rollback = PASS). Runs with the post-approval OTA on the owner's go |
| Owner → Comp A | **New website page for the owner's audio engineer to upload files** (owner 2026-10-26). Comp A does the DB + website work. ccode note: the site already has the Lab Audio Uploader at `/lab-upload` (2026-09-14: shared upload code checked by the `lab-upload` edge function, one-shot signed upload URLs, private `lab-audio-source` bucket, server-side manifest), which may be reusable |
| Owner → Comp A → ccode | **Website certificate thumbnails** (owner request): for a holder with several certificates, a small thumbnail left of each title, and a tap opens the full certificate (drawn from `certificateHtml.ts`, same inputs). **Waiting on the owner's A/B/C** for the `/verify` page's QR area: A = show the verified code; B = return the full token so the QR matches (needs SQL); C = thumbnails on `/registry` only. Comp A then sends ccode the website handoff |
| Comp A | Intro-video SQL (D2): Comp A checked live, the SQL is sound; **waits for the owner's go**, then a guarded 00/05/10/90/99 package, dry run first, ACK with verify rows |
| Comp A | Link-context migration (`search_query`, `wikipedia_url`) on approval day; Comp B returns |
| Comp A | Approval-day server switches: certificate rules (labs + final exam) and the daily certificate-release job. Tell Comp A if the app assumes certificates release instantly |
| Comp A | **The toddler-hunt server brief** (Downloads `2026-10-14_COMP_A_TODDLER_SERVER_FIXES.md`, items #2 #3 #6 #11 #12 #14) is applied **after** the OTA. Then ccode wires the client halves it names (`p_client_msg_id`, restore reasons, `appAccountToken` / `obfuscatedAccountId`). Status to confirm with Comp A |
| Comp A | Terms zero-tolerance + 24 h clause (owner-approved 2026-10-15, `2026-10-15_TERMS_ZERO_TOLERANCE_DRAFT.md`) is published with the launch-day site (B6) |
| Comp A | Per-seat access codes with end dates. App redeem-screen wording for expired/used codes is to be confirmed |
| Comp A | Email confirmation ON within 14 days of launch. App sign-up copy ("check your email") and the confirm landing screen are to be confirmed |

## D. ccode work queue (Comp A post-review list, 2026-10-25)

| # | What | Status |
|---|---|---|
| D0 | The owner's change list (given 2026-10-26). Owner's order: change list, then D1–D5 | DONE 2026-10-26 (owner: "done with my changes"); each row below says what is checked; all of it reaches phones only with the post-approval OTA |
| D0a | Progress screen: order top→bottom = Share your achievements, Certificates, Programs, Topics. The Certificates strip shows small images of the REAL earned certificates (not blue circles); tap one to open it. On the Certificates screen the left image box and the full-screen view show the certificate itself, not the credential art | built on the OTA branch 2026-10-26; checked as a guest on the web preview; signed-in + phone check waits for the OTA |
| D0b | Progress "Share your achievements" stops being a button. It shows the certificate image, the user's QR (pending/website tile with no account), and a blue underlined link to their /registry page (as on Get Discovered) | built on the OTA branch 2026-10-26; web preview checked (guest) |
| D0c | Put the current Android build (23) on the Pixel (sideload from the EAS 7fac1daa AAB, debug-keystore signed like build 20) | DONE 2026-10-26: build 20 uninstalled (owner OK), 23 installed, versionCode 23 confirmed; owner signs in again |
| D0d | Study Dashboard topic popup (image + "About this topic"): scrolling on iPhone is stubborn | built on the OTA branch 2026-10-26 (the whole popup scrolls as one page, no inner scroll box); web checked; iPhone check after the OTA |
| D0e | Flashcards, DAW Fundamentals (the free topic): a "Don't see a term?" popup, once, at whichever comes first: the ALL list open ~7 s (first time) or the 30th card shown. Explains that terms live in the topic that covers them fully (EQ → Equalization (EQ), compression → Dynamics — Compression, Limiting & Gating (Core)). OK closes it. No pick from the owner, so the defaults apply: the full draft text, once ever (whichever trigger comes first), 30 cards counted across visits | built on the OTA branch 2026-10-26; web preview: shows after 7 s in the ALL list, OK closes it, never again. 30-card path pinned by test, not clicked through; phones after the OTA |
| D0f | Flashcards: the ALL list opens with a plain tap (no long press) | built on the OTA branch 2026-10-26; web preview checked |
| D0g | Flashcards: with reveal-all (red eye) on, a label reads "FULL VIEW: Term + Definition Together" | built on the OTA branch 2026-10-26; web preview checked |
| D0h | Bookmark add/remove: besides the term's bookmark animation, the Bookmarks LIST icon flashes purple 0.4 s — in Flashcards AND at the top of the Glossary | built on the OTA branch 2026-10-26; Flashcards measured on web (#b45bff ~0.4 s, add and remove); Glossary same hook, not clicked (its device-ID consent) |
| D0i | Glossary + Flashcards: the ↗ arrow after "Research and learn more" and "View images" becomes the owner's browser-window-with-arrow icon (the globe was rejected as too compact), traced exactly from the owner's image as an SVG (WebLinkIcon), in the link's gray | OWNER APPROVED 2026-10-26 (gray); built on the OTA branch; overlay-checked against the original |
| D1 | Task A item 6: test the paywall close button on the Pixel (owner said yes, USB) | DONE 2026-10-26 ~4:29 AM, PASS on the Pixel 7 Pro, Android build 23, guest (Pro1 signed out with the owner's OK): Home → Membership opens the paywall; ✕ closes it to Home; Android BACK closes it; a tap just off the ✕ closes it. iPhone not tested (no device access) |
| D2 | Task A item 7: the onboarding **intro video** shows once per **account** (it's per device today) | APP HALF built on the OTA branch 2026-10-26 (owner's pick): Home asks `my_intro_video_seen()` before the video; no answer → today's per-device rule, so safe before the server. Comp A brief with the SQL: Downloads `2026-10-26_CCODE_TO_COMP_A_INTRO_VIDEO_PER_ACCOUNT.md/.html`. **Waiting: Comp A runs the SQL on the owner's go** |
| D3 | Task B: website launch-day prep (B6, B7) | DONE 2026-10-26 overnight — see B6 (local commit; a legal-text merge for the owner) and B7 (checked) |
| D4 | Task C: the 1.0.1 plan | DONE 2026-10-26 overnight: Downloads `2026-10-26_APE_1.0.1_PLAN.md/.html` (owner decisions marked OWNER DECIDES inside) |
| D5 | Reply to Comp A on Tasks A/B/C in `CROSS_SESSION_HANDOFF.md` | DONE 2026-10-26 overnight: LOG entry "reply-to-A (Tasks A/B/C…)" on the OTA branch; asks Comp A for the intro-video SQL (owner's go), the Play deletion URL, and which gate-off commit |
| D6 | Pro1 shows "Academy member" twice on its registry page (no registry name set). Optionally hide the label when no name is set (website) | DONE 2026-10-26 (owner YES): `web-launch-day` @ 1e605767, local only; can also be cherry-picked to the live site on the owner's go |
| D7 | `labCatalog.ts` comment says "163 ratified functions"; the truth is 166 (Comp A). Fix it in the next code change | DONE 2026-10-26: the comment keeps its 2026-08-31 history and adds "166 as of 2026-10-26" |

## E. Version 1.0.1 (needs a build)

The plan, in order with the owner's decisions marked: Downloads `2026-10-26_APE_1.0.1_PLAN.md/.html` (D4).

| What | Source |
|---|---|
| Meta SDK + install events; App Privacy, Data safety and App Tracking Transparency changes | owner 2026-10-25 |
| **Purchase events to analytics** (started/completed/failed/restored), plus the "Analytics" purpose for purchase history in both store forms | D98, moved from the OTA |
| Instructor progress view + a student-data statement for schools. **Server side LIVE since 2026-10-04** (`instructor_*` functions; what a teacher sees and the student's opt-in were decided by the owner 2026-10-04), so 1.0.1 = app UI only (Comp A 2026-10-26) | owner 2026-10-25 |
| Location restore · Fill-in/Matching research links · Android camera `required=false` · Terms title | `APE_NEXT_BUILD_CHECKLIST.md` |
| Native build queue (other memory store: `project_next_build_queue.md`) | read it before any build |
