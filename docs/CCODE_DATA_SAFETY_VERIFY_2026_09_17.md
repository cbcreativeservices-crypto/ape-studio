# ccode verify — Google Play Data safety + Apple App Privacy declaration

**From:** Computer A (Cowork) · **Date:** 2026-09-17 · **Reader:** ccode (client ground truth)
**Ask:** Verify the declaration below against what the **shipped** app actually transmits off-device, then reply with any add/remove. Booth submits after your ✔.

## Context (already decided — do not re-open)
- Telemetry = **Sentry** (crash+diagnostics) + **Aptabase** (analytics), **Option B fully anonymous**: Sentry never calls `setUser`, Aptabase has no user object → all telemetry is **"Data Not Linked"** (Apple) and carries no account id.
- Billing = **expo-iap** (direct StoreKit / Play Billing, no third-party processor).
- Auth = email/password only (Apple 4.8 N/A). No location SDK. Mic/dictation on-device. Not child-directed.

## Proposed declaration — Group A (account data · Collected=Yes · Shared=No · Apple: Linked)
| Data | Google category | Purpose | Req/Opt |
|---|---|---|---|
| Name (first + last initial) | Personal info → Name | App functionality / account | Required |
| Email | Personal info → Email | Account / auth | Required |
| Profile photo | Photos and videos → Photos | App functionality | Optional (opt-in) |
| Community profile / UGC | App activity → User-generated content | App functionality | Optional (opt-in) |
| Purchase history | Financial info → Purchase history | App functionality | Required |
| Learning progress | App activity → App interactions | App functionality | Required |
| Push token | App activity (functionality, NOT ads) | Push notifications | Required |
| Country (self-entered) | Personal info → other | Profile | Optional |

## Proposed declaration — Group B (telemetry · Collected=Yes · Shared=No · anonymous · Apple: NOT linked)
| Data | Source | Google category |
|---|---|---|
| Crash logs | Sentry | App info & performance → Crash logs |
| Diagnostics (device context, route names, release-health) | Sentry | App info & performance → Diagnostics |
| Product interaction (screen / quiz / exam events) | Aptabase | App activity → App interactions |

## Overall answers
- Encrypted in transit: **Yes** (HTTPS, all endpoints).
- Provide a way to request data deletion: **Yes** (account deletion via support + privacy policy).
- Shared with third parties: **None** (Sentry/Aptabase are processors, not ad networks; expo-iap has no processor in the receipt path).
- Apple "Used for tracking": **No** for every type (no IDFA/GAID, no ATT, no cross-app tracking, no data brokers).

## VERIFY THESE (client ground truth — A cannot see the client)
1. **Completeness:** Is anything the shipped app sends off-device **missing** from Group A/B? (Anything transmitted = must be declared.)
2. **User IDs (the main open call):** Does the app send any account/user identifier off-device **beyond email** — e.g. Supabase `auth.uid`, `ape_student_id`? If yes → add **Personal info → User IDs** (Collected=Yes, Linked). If email is the only identifier that leaves the device, we omit a separate User ID row. **Confirm which.**
3. **Purchase history:** Confirm expo-iap transmits purchase/entitlement data off-device (→ Collected=Yes under Financial info) and that **no third-party processor** sees it (→ Shared=No).
4. **Push token:** Confirm expo push token is collected for delivery only (functionality), never advertising.
5. **Photo + UGC:** Confirm both are opt-in (Optional) and stored server-side (Supabase Storage / tables).
6. **Country:** Confirm it's a self-entered profile field, not derived from IP/GPS; and `expo-location` is not installed → **no Location** category.
7. **On-device only (no declaration):** Confirm mic/dictation `requiresOnDeviceRecognition:true` (no Audio Data), camera Hz tool on-device, and no device/vendor/ad ID leaves the device (`expo-application` reads app version only).
8. **Any SDK added since the 2026-09-16 telemetry inventory** that collects/sends data? If so, name it + its data.

## Reply format
For each change: data type · Collected(Y/N) · Shared(Y/N) · purpose · Req/Opt · (Google) ephemeral? · (Apple) linked? tracking? — plus a one-line ✔ if Groups A+B are complete as written.

_Once ccode replies, A finalizes both store forms and Booth fills them. This same table drives Apple App Privacy (Group A = Linked, Group B = Not Linked, tracking=No throughout)._
