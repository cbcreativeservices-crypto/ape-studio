# CCODE HANDOFF — Weekly Concept Notifications (Cursor session close)
# AP&E / Pro Audio Training Academy
# Date: 2026-08-28
# From: Cursor (Grok) on Booth’s machine · To: Claude Code
# Repo: ape-studio · branch at session: `audio-tools-engine` (confirm with `git status`)
# Brand: always “Pro Audio Training Academy” / “the Academy” — never PAT / PATA

Booth is sole DB writer. Do not apply SQL, do not uncomment pg_cron, do not force-push.

---

## 1. What this system is

Weekly “misunderstood concept” pushes. 3,500 rows (500 × 7 categories). User picks categories + a weekly day/time. Cron (not live yet) hits an Edge Function every 15 minutes; the function finds due subscriptions, picks the next undelivered concept, sends Expo push, logs delivery.

Spec (not in repo): `APE_NOTIFICATIONS_WEEKLY_CONCEPT_SPEC_2026_08_27.md`  
Schema Booth already applied: `APE_NOTIFICATIONS_SCHEMA_2026_08_27_FIXED.sql` (in Downloads)  
Ranking job (Computer B, files only, no DB): `APE_NOTIFICATIONS_AUDIT_RANK_HANDOFF_ComputerB_2026_08_28.md`

Categories (exact strings — must match `notification_concepts.category`):

- Acoustics
- Pro Audio Equipment
- Audio Electronics
- Recording Studio Production
- Cabling and Wiring
- Music Recording Production
- Live Sound Reinforcement

---

## 2. Done — backend

| Item | Status |
|---|---|
| Tables + RLS + RPCs | Live (Booth applied 2026-08-28) |
| 3,500 concept rows | Loaded |
| `on-weekly-concept` Edge Function | **Deployed ACTIVE** on `yjgolswjggmlpeowvtxr` |
| pg_cron `weekly-concept-notifier` | **Still commented out** — Booth turns on after ranking |

Function path: `supabase/functions/on-weekly-concept/index.ts`

Behavior:

1. POST/GET only; `Authorization` must be `Bearer <SUPABASE_SERVICE_ROLE_KEY>` (what cron will send).
2. RPC `get_due_concept_subscriptions(check_time)` — due in ±7 minutes in the user’s timezone, not already fired today.
3. Read `notification_preferences`: skip unless `push_enabled` AND `notify_weekly_concept` AND `expo_push_token`.
4. RPC `get_next_concept(p_user_id, p_category)` — **lowest `id` not yet delivered**; cycle reset when exhausted.
5. Insert `notification_concept_deliveries` as `pending` **before** Expo send (idempotency).
6. Expo push: title = concept, body = misconception teaser (180 chars), `data.type = weekly_concept` plus card fields. Local file also puts `concept` in `data` (title fallback still exists in the app). **That `concept` field was added after the first deploy** — redeploy the function if you want it in production payloads. Tap handling already uses the notification title if `data.concept` is missing.
7. Update delivery `delivered` / `failed` + Expo ticket.

RPC return shape: function unwraps row-or-array (`asOne`).

Studio: https://supabase.com/dashboard/project/yjgolswjggmlpeowvtxr/functions  
Also live there: `tube-image`. (`validate-purchase` exists in repo; was not in the list response at deploy time.)

**Do not redeploy cron. Do not schedule cron.**

---

## 3. Done — app (this session, not yet a store build)

`expo-notifications` `~57.0.15` (Expo SDK 57). Plugin in `app.json` (`color` `#ffc64d`, `defaultChannel` `weekly-concept`). EAS `projectId` already `72f69470-fe12-4ecb-a10b-e8331d53812d`.

New files:

- `src/features/notifications/push.ts` — permission, Android channel, `getExpoPushTokenAsync`, write `expo_push_token` + `push_enabled` on `notification_preferences`, tap listener + cold-start `getLastNotificationResponseAsync`
- `src/features/notifications/weeklyConcept.ts` — category list, day_of_week 0=Sunday mapping, timezone from `Intl`, upsert/sync/deactivate subscriptions, fetch concept by id
- `src/screens/notifications/WeeklyConceptScreen.tsx` — modal card: what it is / misconception / correction / why it matters

Wired:

- `App.tsx` — attach listener; `NavigationContainer.onReady` flushes a queued tap
- `src/navigation/types.ts` + `RootNavigator.tsx` — route `WeeklyConcept` (modal)
- `src/features/settings/store.ts` — `notify_weekly_concept` on prefs fetch
- `src/screens/settings/SettingsScreen.tsx` — **Weekly concept** toggle under Push/Email: day+time popup, category chips. Default first-on: Acoustics, Monday 09:00, device IANA timezone. Turning on also requests push permission. Turning off sets pref false and deactivates all that user’s subs.

Web: push registration is a no-op (`Platform.OS === 'web'`). Subscriptions can still be written if Settings is used on web; delivery still needs a device token.

`npx tsc --noEmit` passed after these changes.

**Required before any real push reaches a phone:** a **new EAS / dev-client build**. The native module is not in older binaries.

---

## 4. Plans already in place (do not invent a different pipeline)

### A. Ranking gate (blocks cron)

Computer B audits + ranks 1–500 **per category** (no ties). Output:

- `notifications_audit_ranked_3500.csv` (`rank` + `audit_note`; `id` unchanged)
- `notifications_audit_corrections_B2.md`

**Delivery sequence is supposed to be `rank`, not `id`.** Today `get_next_concept` is `ORDER BY nc.id`. After Booth accepts ranking:

1. Booth applies a rank column / remap (he is sole DB writer).
2. Change `get_next_concept` to `ORDER BY rank` (or equivalent).
3. Then Booth uncomments pg_cron in the FIXED schema (15 min, `net.http_post` to `/on-weekly-concept` with service-role bearer).

Until then, the Edge Function can be invoked manually with the service role; it will send if anyone has a due sub + token. There should be few/no due subs in production yet.

### B. Token column

Function and app write `notification_preferences.expo_push_token`. Schema add in the FIXED SQL was `notify_weekly_concept` only. If token saves fail in Settings, Booth should run:

```sql
alter table notification_preferences
  add column if not exists expo_push_token text;
```

Do not run this from Claude Code unless Booth asks.

### C. App follow-ups (not started)

- The other 7 Settings “commercial” notify rows are still **device-local AsyncStorage** — not this pipeline. Do not pretend they send.
- No in-app “history of concepts received” list; tap-to-card only.
- Expo `data` payload can approach 4KB with full card text; if Expo rejects, shrink `data` to `type` + `concept_id` and let `WeeklyConceptScreen` fetch `notification_concepts` (RLS already allows authenticated SELECT).
- Function `verify_jwt` is true at the gateway; cron will send a valid service-role JWT. Keep the in-function bearer check.
- Redeploy `on-weekly-concept` after any function edit (needs `npx supabase login` or `SUPABASE_ACCESS_TOKEN` in a TTY — Cursor could not login without a token).

### D. Security / secrets

A Supabase **personal access token** (`sbp_…`) was pasted into Cursor chat to deploy. **Revoke it** at https://supabase.com/dashboard/account/tokens if not already done. Do not commit tokens. Do not put service-role keys in the client.

### E. Same Cursor thread (web, separate from notifications)

Earlier 2026-08-25 work on the Next site (`web/`): atmosphere plates were moved off the uploaded right-weighted formula/HUD PNGs. New original art lives at `web/public/atmospheres/{chamber,lexicon,hall,field}.png`. Component is `web/components/Atmosphere.tsx` (`RoomField`, `Veil`, `Meterbridge`, `Well`). Homepage Knowledge/Glossary use veils; In the app is a floor meterbridge only. `/academy` = hall, `/curriculum` = field. Old files `fundamentals.png`, `glossary.png`, `calc-lab.png`, `training-labs.png` may still be on disk unused. Phone `AppScreen` media: cached load used to leave opacity 0; that was fixed (`onLoadedMetadata` / `complete` / `autoPlay`). Site is gated in production (`GATE_ENABLED`); gate is off in `NODE_ENV === development`. **Do not claim WCAG AA or EU AI Act compliance.** Do not merge/deploy web unless Booth asks.

---

## 5. Suggested Claude Code next steps (in order)

1. Confirm `git status` — notifications + web atmosphere files may be uncommitted. Do not commit unless Booth asks.
2. If Booth has Computer B’s ranked CSV: plan the DB rank column + RPC change (SQL for Booth to apply), then a function redeploy if needed.
3. If token column is missing: give Booth the one-liner above.
4. After a new native build: smoke Settings → Weekly concept on → confirm a row in `notification_concept_subscriptions` and a token on `notification_preferences`.
5. Manual function invoke (service role) only if Booth wants a send test **before** cron. One user, one category, send_time near now.
6. Cron last. Not before ranking.

---

## 6. Do not

- Uncomment or schedule pg_cron
- Apply ranking or schema from this machine
- Keyword-stuff “certification”
- Abbreviate the Academy name
- Treat local Settings reminder toggles as live push jobs
- Deploy web or the mobile store binary without Booth

---

_End of handoff._
