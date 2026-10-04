# Alerts between members + unread counts — server draft for Comp A (2026-10-04)

Owner decision 2026-10-04: "user should be able to turn on and use notifications between each other".

**Nothing here is applied or deployed.** The app side is in the working tree and works by OTA with or without these server pieces.

## Status of each piece

| Piece | Where | State |
|---|---|---|
| Badges for pending contact requests | app | Works by OTA **today** (reads the live `contact_threads`) |
| Badges for unread messages, per-conversation "N NEW" | app + migration §1–2 | App ready. Shows once the migration is applied (no new OTA needed) |
| Settings → MESSAGES & REQUESTS switch | app + migration §3–4 | App ready. The section stays hidden until the migration is applied |
| Alerts actually delivered | migration §5–6 + edge function + cron §7 | Draft only |
| Tapping an alert opens the conversation | app | Ready (OTA). Nothing to tap until alerts are sent |

No new build is needed. `expo-notifications` is already in the shipped binaries (weekly concept), with its config plugin in `app.json`.

## Deploy order (Comp A, after owner approval)

1. Apply `supabase/migrations/2026100401_community_notifications.sql`.
   - Check right after: `select * from contact_inbox_counts();` as a test account returns one row.
   - Check right after: `select * from community_notify_prefs_get();` returns `false, true, true, false`.
2. Copy `docs/drafts/community-push/index.ts` to `supabase/functions/community-push/index.ts`, then deploy it.
3. Make sure the service-role key is in Vault as `service_role_key` (same as the weekly-concept cron, if that one uses Vault).
4. Run the `cron.schedule(...)` block at the end of the migration file (§7).
5. Test end to end with two seeded accounts on two phones:
   - turn alerts on for B;
   - A sends B a request, then B gets an alert within about a minute;
   - B accepts, A writes, then B gets "A sent you a message";
   - B blocks A, A writes, then nothing arrives.

**Kill switch:** `select cron.unschedule('community-push-every-minute');` stops every alert at once. The badges keep working.

## What each part does, in plain words

### 1. Read state
- `contact_thread_reads` remembers, for each person and conversation, when they last opened it.
- The app calls `contact_thread_mark_read(id)` after it has shown the messages.
- Everything that exists when the migration runs is marked read, so nobody gets a badge for old messages.

### 2. Counts
`contact_inbox_counts()` returns three things:
- the pending incoming requests;
- the unread messages;
- a per-conversation map.

It leaves out:
- blocked pairs;
- restricted senders.

It returns no row when the session has no account behind it.

### 3. Choices
`community_notify_prefs`, through `community_notify_prefs_get()` and `community_notify_prefs_set(...)`:
- **Alerts are off by default.**
- Messages and requests are on by default once alerts are switched on.
- "Show message text" is **off by default**.
- A missing row reads as the defaults, so no backfill is needed.

This is a new table, not `notification_preferences`. Only 7 of 32 users have a `notification_preferences` row today (read-only count, 2026-10-04), and an update there matches nothing for the other 25. That is a separate existing problem for the weekly-concept switches, worth a look.

### 4. Phones
`push_devices` has one row per app install, keyed by the app's stable install id `ape:deviceId`.
- `push_device_register` **moves** that row to whoever is signed in now.
- `push_device_release` deletes it.
- The app releases the row on Log out, before signing out.
- On every account's first launch, the app either releases the row (alerts off) or takes it over (alerts on).

So after a sign-out or an account switch, the departing account's alerts stop reaching that phone.

Other rules:
- At most 10 phones per account.
- Dead addresses are deleted when Expo reports `DeviceNotRegistered`.

### 5. Outbox, batching, rate limits
- Triggers on `contact_messages` and `contact_requests` insert **ids only** (never text) into `community_push_queue`.
- A failure there never blocks the message itself.
- Every minute, the sender groups the outbox: everything one person sent one recipient in that minute becomes **one** alert, for example "sent you 3 messages".
- Rate limits:
  - at most one alert per conversation per 2 minutes;
  - at most 20 alerts per recipient per hour.
- Messages over a limit still count on the badge. They just do not buzz the phone.

### 6. Who is never alerted (all checked in SQL, `community_push_due`)
- Anyone who has not switched alerts on, or who has switched that kind off.
- Anyone in a blocked pair, in either direction.
- Anyone in a pair where either account is restricted (`account_restricted`: banned, removed, or suspended).
- A message alert when the conversation is no longer open.
- A request alert when the request is no longer pending.
- Guests: no account means no `users` row, so no prefs and no phones.

### Privacy: what the alert says
- **Title:** the sender's display name, or the employer's company name.
- **Body:** "sent you a message" / "sent you 3 messages" / "asked to contact you".
- The first 120 characters of the message appear **only** when the recipient switched "Show message text" on. That choice is a single message, and it applies on the lock screen too.
- `data` carries only `{ type: 'community', kind, requestId }`, never text or names.

### RLS and grants
- Every new table has RLS on, with **no** grants to `anon` or `authenticated`. Like the rest of the directory, they are reached only through SECURITY DEFINER RPCs.
- Client RPCs are granted to `authenticated` only. `public` and `anon` are revoked (EXECUTE is granted to PUBLIC by default).
- Sender RPCs (`community_push_due`, `community_push_record`, `push_device_forget_token`) are granted to `service_role` only, and explicitly, because service_role does not inherit.

## Store compliance notes (Comp A's lane; I cannot see either console)

- **iOS permission text:** none needed. iOS has no usage-description string for notifications. The app asks with its own explainer first ("Get alerts for messages and requests?"), then the system dialog. It asks only when the person turns the switch on, never at launch. That is the opt-in Apple 4.5.4 expects.
- **Android 13+:** `POST_NOTIFICATIONS` already comes with expo-notifications in the shipped binary (weekly concept). No change.
- **Privacy label (App Store) / Data safety (Play):** please check that these are already declared, and add them if not:
  - **Identifiers → Device ID**, linked to the user, for App Functionality. The push address and install id are stored against the account. The install id already exists for single-device login, and the weekly-concept push token was already stored.
  - **User Content → Other user content / Messages**, already declared for community chat. Alerts send no new content off the device. With "Show message text" on, part of a message passes through Expo's push service (and Apple / Google) to the recipient's own phone.
  - **Third party:** Expo push service (expo.dev) delivers the alerts. The weekly concept already uses it.
- No age-rating change. "Users interact" was already YES.

## Exact app wording (for review)

**Settings → MESSAGES & REQUESTS**
- Intro: "Alerts when another member messages you or asks to contact you."
- "Alert me on this phone": "Off until you switch it on. Your phone asks for permission first."
- "New messages": "Someone in an open conversation writes to you."
- "Contact requests": "Someone asks to contact you."
- "Show message text": "Off: an alert shows only who wrote and “sent you a message”. On: the start of the message shows too — including on your lock screen."
- Footer: "Members you have blocked, and accounts the Academy has restricted, never send you an alert. While Low-Light Production Mode is on, alerts do not pop up over the app."

**Permission explainer:** "Get alerts for messages and requests?" "We’ll let you know when another member messages you or asks to contact you. An alert shows their name and “sent you a message” — not what they wrote, unless you choose that in Settings. Your phone will ask you next." Button: **ALLOW ALERTS**.

**Badges:** a number on the Profile tab, on "Open the Directory", on SET UP MY PROFILE, and on the REQUESTS tab. Conversation buttons read "OPEN CONVERSATION (5) · 2 NEW".
