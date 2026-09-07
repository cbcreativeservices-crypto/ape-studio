# Launch run-list — 2026-09-07 (resume here for "get closer to launch")

Written before a Claude relaunch. State of record; nothing here needs re-deriving.
Sources: `docs/APE_LAUNCH_TRIAGE_2026_08_21.md`, `docs/APE_NEXT_BUILD_CHECKLIST.md`,
`docs/discoverability/RESUME_HERE.md`, memory `launch-triage-2026-08-21`, `deferred-backlog-2026-09-01`,
`notifications-status`, `security-review-2026-08-28`.

## Where the app stands

- Branch `audio-tools-engine`, last commit `f45783c` (tuner bug pass + doc). tsc clean, 296 tests.
- Installed dev clients: iOS build 16 / Android versionCode 12 (2026-09-05, commit 783a0a9). Everything
  since is JS-only and loads from Metro. The NEXT build carries expo-iap, expo-store-review,
  expo-application, expo-image (all installed, plugins/LOADERS done).
- `eas.json`: build profiles development / preview / production; submit profile `production` exists but
  needs the Apple app ID and the Play service-account key. Production profile has NO auto-increment.
- `app.json`: name `Pro Audio` (device, on purpose), version 1.0.0, bundle/package
  `com.cbcreativeservices.apestudio`, encryption flag set, mic/camera/location usage strings present.
- Feedback already goes to `info@proaudiotrainingacademy.com` (`src/lib/feedback.ts`).

## Hard blockers for a paid launch

| # | Where | What | Who | Files / refs |
|---|---|---|---|---|
| 1 | App Store Connect + Play Console | Create products lifetime $99.99 / annual $59.99 / monthly $9.99 with the IDs the app expects | Owner (console); Claude hands over the ID list | `src/features/commercial/purchase.ts`, triage doc §IAP |
| 2 | Supabase edge functions | Verify validate-purchase writes entitlements end to end; sandbox purchase on both phones | Claude (read-only check + test script), owner (sandbox accounts) | `supabase/functions/*`, `src/screens/.../PaywallScreen.tsx` |
| 3 | EAS | One production build per platform, then submit — **ONLY on the owner's explicit go, each step** | Owner cue | BUILD RULE, `docs/APE_GOVERNANCE_DECISIONS_2026_09_05.md` |
| 4 | `eas.json` | `cli.appVersionSource: remote` + production `autoIncrement: true` | Claude, 10 min | `eas.json` |
| 5 | Store listings | Copy is drafted with verified lengths; screenshots + feature graphic do not exist | Owner shoots on device from Claude's shot list | `docs/discoverability/STORE_LISTING_SOURCE_OF_TRUTH.md` |
| 6 | Both consoles | Privacy nutrition labels / Play Data Safety, content rating, reviewer demo account (comp code `TESTCOMP`) | Claude drafts answers from the code; owner enters | `docs/APE_ACCESS_CODES_2026_08_21.sql` |
| 7 | Website | Privacy policy + terms at public URLs; site is sitewide noindex until `GATE_ENABLED` flips | Owner decision, then Claude once `web/` is cleared to touch (owner WIP, uncommitted) | `web/lib/gate.ts`, RESUME_HERE §2.0 |

## Should be done before launch

| # | Where | What | Who |
|---|---|---|---|
| 8 | Supabase | Read the 5 anon-callable definer functions that may write (`award_complete`, `award_required_topics`, `materialize_discrete_slot`, `_labs_recompute_af`, `trg_eval_credentials`); hand over revoke SQL. Revoke must name PUBLIC; grant service_role first | Claude read-only; owner runs |
| 9 | Website | `/.well-known/apple-app-site-association` + `assetlinks.json` (needs Play app-signing SHA-256), `/get` landing | Claude after `web/` go-ahead |
| 10 | Phones | Device pass: tuner full screen (identity/note gap on iOS, IN TUNE lock, LOCKED keys, piano), QA-night fixes, five overnight labs | Owner |
| 11 | Copy | Ratify new lab copy, term-bucket bodies; re-ratify the two math errors found in ratified copy | Owner |
| 12 | Email | Intake aliases feedback@/corrections@/suggestions@ → info@, Gmail rules (Claude in Chrome, owner signed in; never enter credentials) | Owner + Claude |
| 13 | Notifications | Weekly-concept cron activation, RESEND key, one sandbox send | Owner, `docs/APE_EMAIL_WEEKLY_CONCEPT_2026_08_29.md` |
| 14 | Storage bucket | Re-upload course-card art with a long Cache-Control | Owner |

## First-update material (not launch)

iOS universal links (one interactive build after AASA is live), glossary web pages, analytics provider,
the deferred green backlog (`deferred-backlog-2026-09-01`), startup-graph performance, tuner design calls
(A4/STROBE into the picker, A4 write-back, piano note+octave picker).

## What Claude starts on the owner's word, no decisions needed

Items 4, 6 (drafts), 8, the product-ID list (1), the edge-function check + sandbox script (2), the
screenshot shot list (5). Roughly half a day.

## Session hygiene after relaunch

- Restart the phone dev-client Metro in a Claude-readable background task (standing order). Tunnel mode
  was in use on 2026-09-06 for an off-site demo (`npx expo start --dev-client --tunnel --port 8081`,
  `@expo/ngrok` is installed); the tunnel address changes on every restart — read it from
  `http://127.0.0.1:4040/api/tunnels`. LAN mode is the default otherwise.
- Web preview Metro on 8090 for the browser pane (`#hzcounterpreview` reaches the tuner).
- Owner WIP that must never be committed: `web/app/connect`, `web/components/connect`,
  `web/lib/connect.ts`, `web/components/SiteChrome.tsx`, `web/app/{layout,robots,sitemap}.ts(x)`,
  `web/proxy.ts`, `docs/APE_BUGBOT_FOLLOWUP_2026_08_28.md`, `docs/APE_GOVERNANCE_DECISIONS_2026_08_06.md`,
  `src/features/credentials/certificateHtml.ts`, `certificateAssets.ts`, `docs/APE_CCODE_HANDOFF_2026_08_30.md`.

## BUILD RULE (owner, 2026-09-05)
NEVER run `eas build` / `eas submit` or any billed/external action on my own reading. The ONLY cue is the
owner saying, in that moment, to start the build now. Ask one line, then WAIT.
