# Comp A: server changes from the 2026-10-04 afternoon wave

All of these are **drafts** in `supabase/migrations/`. **None is applied yet.** Apply each one only after the owner approves it.

The app code that uses them is already committed (6c2a147e). It falls back safely until each change is live, so they can be applied in any order. Each item below says what the app does before and after.

| # | File | What it does | App before it is live → after |
|---|---|---|---|
| 1 | `2026100410_glossary_starthere_terms.sql` | 3 new beginner glossary terms (Sound Source, Listener (acoustics), Audio Signal) plus topic mapping rows; fixes to Tone, Recording and Playback | No change before. After it is live, ccode re-links Start Here's words (a small OTA). **Tell ccode when it is done.** |
| 2 | `2026100420_glossary_formula_accuracy.sql` | 7 glossary formula corrections from the calculator audit. Examples: 0.775 → 0.7746 V; 1 Pa = 93.98 dB; critical-distance constant 0.0566; RF +32.45 with km/MHz; 6.02·N vs +1.76 (SQNR) | Glossary text only. No app change. |
| 3 | `2026100407_start_here_glossary_bonus.sql` | Start Here's one-time +2 extra definitions. Two never-resetting tables, one keyed by `auth.uid()` and one by device id; status and definition RPCs; RLS on, no table grants, service_role granted explicitly | Before: Start Here's related words use the normal weekly meter, and no extras are promised. After: the first 2 related-word opens are extras. Each app session retries. |
| 4 | `2026100401_community_notifications.sql` + edge function draft `docs/drafts/community-push/index.ts` (deploy it to `supabase/functions/community-push/`) + guide `docs/APE_COMMUNITY_NOTIFICATIONS_SERVER_DRAFT_2026_10_04.md` | Read state (marks everything existing as read), inbox counts, alert preferences (OFF by default), push device registry, push queue and triggers (ids only, never message text), rate limits, and a cron block to run AFTER the function is deployed | Before: badges show pending contact requests only, and Settings MESSAGES & REQUESTS stays hidden. After: unread counts, the Settings section, and alerts within about 1 minute. |

## Test plans
- **#3:** a rolled-back transaction test is in the migration's header and in ccode's report. Three opens by a free uid → `bonus_spent` true, true, false. A second uid on the same device gets false. The same uid on a new device gets false. A member touches neither table.
- **#4:** the guide's checks section. Includes the kill switch.
- **#1 and #2:** each file ends with a VERIFY query. #1 should return 6 rows. In #2, each update is keyed on id plus the current text, so a row someone edited since today does nothing; merge that one by hand.

## Store / compliance notes (#4, alerts)
- iOS needs no new permission text.
- Android already declares `POST_NOTIFICATIONS`.
- Privacy label / Data safety:
  - confirm **Device ID** is linked to the user, for App Functionality;
  - messages are already declared;
  - Expo push is the delivery service. If a user turns on "Show message text", part of a message passes through Expo/APNs/FCM.
- No age-rating change.

## Found while working (please look)
- Only **7 of 32** users have a `notification_preferences` row. Updates to the weekly-concept notification switches match nothing for the other 25, so those switches may silently do nothing. Worth a backfill or an upsert.

## Deep links: for the next store build (ccode will do this on the owner's build go)
Done after your 2026-10-04 finding that the apex host redirects:
- `app.json` `ios.associatedDomains: ["applinks:www.proaudiotrainingacademy.com"]` (www only).
- Drop the 9 apex-host entries from `android.intentFilters`; keep the 9 www entries.
- This is NOT done now. app.json is a fingerprint input, so it rides with the build. Changing it today would cut OTA updates off from builds 33/16.
- Your web files (`web/app/.well-known/*`, `web/proxy.ts`) are in the working tree, uncommitted, for the owner to push. ccode has not touched them.
