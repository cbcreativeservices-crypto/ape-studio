# Discoverability analytics — event specification

**Status: specification only. Nothing here is implemented, and that is deliberate.**

The app has no analytics provider. The only telemetry that exists is `src/features/tools/telemetry.ts`, which records one `{tool_id, opened_at, duration_seconds}` row per tool session through the `record_tool_usage` RPC, for authenticated users only, with all errors swallowed. Its scope was fixed by ruling (2026-07-23 R4): opens and durations only, never measurement content.

Choosing an analytics vendor is a product and privacy decision the owner has not made, and the brief is explicit that a second analytics vendor must not be added without a reason and approval. So this document defines **what to measure and what must never be sent**, ready to wire the day a provider is chosen.

## 1. Privacy rules that bind every event below

These are not preferences. An event that breaks one of them must not ship.

- **Never send**: access tokens, session identifiers, email addresses, real names, credential ids or verification tokens, registry tokens, user-entered search text, glossary notes, audio, or any measurement reading.
- **Never send a full URL.** Send a controlled `route` value from a fixed list plus a `content_type`. A full URL leaks the slug, and slugs can be personal in the profile and credential families.
- **Content identity is a slug or an internal id, never both**, and never a token that grants access to anything.
- The app's consent posture must be mirrored: if the user has not opted in, events are dropped at the source, not buffered for later.
- Anything that would look wrong printed in a support ticket should not be in an event.

## 2. Events

### Deep links

| Event | When | Properties |
|---|---|---|
| `deep_link_received` | a URL reaches the app | `route`, `source` (`universal`, `scheme`, `notification`) |
| `deep_link_opened` | it resolved and navigated | `route`, `content_type`, `cold_start` (bool) |
| `deep_link_rejected` | `isAcceptedLink` refused it | `reason` (`bad_host`, `bad_scheme`, `malformed`, `unclaimed_path`) — **never the URL** |
| `deep_link_content_missing` | resolved but the content was not found | `route`, `content_type` |
| `deep_link_resumed_after_auth` | a pending destination replayed after sign-in | `route` |

`deep_link_rejected` is the one that earns its keep: a spike means either an attack or, far more likely, the website and the app disagreeing about a path.

### Web to app

| Event | When | Properties |
|---|---|---|
| `web_to_app_cta` | "Open in the app" tapped on the website | `route`, `platform`, `installed` (if detectable) |

### Content and learning

| Event | When | Properties |
|---|---|---|
| `glossary_term_viewed` | a term is expanded | `term_slug`, `entry` (`search`, `deep_link`, `related`, `topic`) |
| `topic_viewed` | a topic is fronted on the Dashboard | `topic_slug` |
| `lab_started` / `lab_completed` | lab open / completion recorded | `lab_key` |
| `tool_started` / `tool_completed` | tool session start / end | `tool_key`, `duration_s` on completion |
| `quiz_completed` | a quiz is submitted | `topic_slug`, `passed` (bool) — **not the score breakdown** |
| `certificate_earned` | an award is granted | `award_type`, `award_id` — **never the credential token** |

### Ratings

| Event | When | Properties |
|---|---|---|
| `review_prompt_eligible` | eligibility evaluated true | `trigger_event` |
| `review_prompt_requested` | the native prompt was asked for | `trigger_event`, `app_version` |

There is deliberately **no event for what the user rated**. The OS does not report it and the app must not try to infer it. Recording only "we asked" is the whole contract.

### Commercial

| Event | When | Properties |
|---|---|---|
| `signup_started` / `signup_completed` | registration flow | `entry` |
| `trial_started`, `subscription_started` | entitlement change | `plan` |

## 3. Attribution

- Preserve UTM parameters through website calls to action so store-console acquisition reports stay meaningful.
- Apple campaign and custom-product-page measurement, and Play acquisition reports, are **store-console tasks**, not app code.
- **Deferred deep linking** (install, then land on the originally requested content) needs a third-party attribution SDK; no operating system provides it, and Firebase Dynamic Links was shut down on 25 August 2025. Not recommended before launch: owned links plus a smart `/get` landing page cover almost all of the value at none of the privacy or dependency cost.

## 4. When a provider is chosen

Wire it behind a single module with the event names above as a typed union, so no screen ever calls a vendor SDK directly and swapping vendors is one file. Mirror the existing `telemetry.ts` posture: fire and forget, all errors swallowed, never able to block or delay the UI.
