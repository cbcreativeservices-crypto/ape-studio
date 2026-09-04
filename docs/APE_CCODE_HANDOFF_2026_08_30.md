# CCODE HANDOFF — 2026-08-30 (full day)
# AP&E / Pro Audio Training Academy
# Date: Sunday 2026-08-30 (into late evening Pacific)
# From: Cursor (Grok) on Booth’s machine · To: Claude Code
# Repo: ape-studio · branch: `audio-tools-engine` (confirm with `git status`)
# HEAD at handoff write-up: `c4deb82` App icon: the real mark, on a ground that matches the app
# Brand: always “Pro Audio Training Academy” / “the Academy” — never PAT / PATA / PAT Academy

Booth is sole DB writer. Do not apply SQL, do not uncomment pg_cron, do not force-push.
Do not commit unless Booth asks. Do not treat `/connect` as public marketing.

---

## 0. Read this first — working tree vs HEAD

A large part of **today is already committed** on `audio-tools-engine` (~32 commits).  
A large part of the **Cursor `/connect` work is NOT committed**. If you only look at `git log`, you will miss the invitation page.

**Uncommitted at handoff (do not lose these):**

| Path | What |
|---|---|
| `web/app/connect/` | New private invitation page (layout, page, CSS) — **owner approved copy + design** |
| `web/components/connect/ConnectForm.tsx` | Mailto form |
| `web/components/SiteChrome.tsx` | Hides Nav/Footer on `/connect` |
| `web/lib/connect.ts` | Path helper + mailto builder |
| `web/app/layout.tsx` | Uses SiteChrome |
| `web/app/robots.ts` | Disallow `/connect` when the site is public |
| `web/app/sitemap.ts` | Comment: never list `/connect` |
| `web/proxy.ts` | `/connect` allowlisted through the preview gate (does **not** set the gate cookie) |
| `docs/APE_GOVERNANCE_DECISIONS_2026_08_06.md` | R6 amended: gs3081 replaced gs3080 |
| `docs/APE_BUGBOT_FOLLOWUP_2026_08_28.md` | Closed note |
| `src/features/settings/LowLightLayer.tsx` | Uncommitted: dim wash waits for PROCEED on the activation notice |
| `src/features/settings/lowLight.ts` | Uncommitted: `useLowLightDim()` / `setLowLightGatePending` |

Ignore `.tmp.driveupload/` — local Drive junk, not product.

`docs/APE_CONNECT_VIP_RESEARCH_2026_08_30.md` exists. Its header still says “do not design yet”; **that line is stale.** Design was done and **approved** later the same day.

---

## 1. `/connect` — private invitation page (Cursor, owner-approved)

### What it is

A **hallway handshake continuation**, not a public site page. Booth hands a card at AES, academic symposia, conventions. Recipients open:

`https://www.proaudiotrainingacademy.com/connect`

Audience: schools, studios, employers (site licenses / custom configs), **and anyone else he handed the card to**.

**Approved lede:**

> You were handed this address in person. It’s written for schools, studios, and employers — and for anyone else I thought should have it.

### Product rules (do not reopen)

- One URL. **No AES-labeled variant** of the page. No “VIP” in copy. No 2-day reply guarantee.
- Not in Nav, Footer, or sitemap. `noindex, nofollow`.
- While `GATE_ENABLED` is true, `/connect` is reachable **without** the preview key. Opening it **must not** unlock the rest of the site (no gate cookie).
- **No in-site links** from `/connect` to `/get`, `/membership`, etc. Those hit the site gate and dump people into the learner funnel. The only CTA is mail to Booth.
- Print on the card: `proaudiotrainingacademy.com/connect` (human-readable URL, not QR-only). Optional `?from=` is accepted silently into the mailto body as `Source:`; it does **not** change the page.

### Design (approved)

Letter, not a patchbay. Earlier jack/IN-THRU-BUS-OUT icons were rejected.

1. Letterhead: mark, Academy name, **We met.**, lede.
2. One amber rule.
3. **What this is** — structured education; app is the classroom; seats + credential verify.
4. **The classroom** — one AppScreen (`home`).
5. **What you can license** — sheet rows: **Now** (site licenses, unique login codes, volume discount) / **Coming** (custom topics, certificates, courses, config, cohort reporting — not for sale yet). Honest split matches `/institutions`.
6. **Write to me** — “I’m Channing Booth. I read these myself.” Form: name, organization, role (optional), email, need radios, note. Button **Write to me** opens `mailto:info@proaudiotrainingacademy.com` subject `Following up from our meeting`.

Need radios:

- Site licenses for a school, studio, or team
- A custom program configuration
- Seats now, and a custom configuration as it comes online
- The learner app

### Files to read

- `web/app/connect/page.tsx`
- `web/app/connect/layout.tsx` + `connect.css`
- `web/components/connect/ConnectForm.tsx`
- `web/lib/connect.ts`
- `web/components/SiteChrome.tsx`
- `web/proxy.ts` (allowlist after `/api/unlock`, before cookie check)
- Research (background only): `docs/APE_CONNECT_VIP_RESEARCH_2026_08_30.md`

Local verify: `cd web && npm run dev` → http://localhost:3000/connect  
Chrome hidden. `?from=aes` must look the **same** as `/connect`.

### Not done on `/connect`

- No CRM / server form — mailto v1 only.
- No deploy of web unless Booth asks. Site is still gated (`web/lib/gate.ts` `GATE_ENABLED = true`).
- Do not add `/connect` to Footer “for exclusivity.”

---

## 2. Bugbot close (Cursor, owner ruled)

Parked in the morning so `/connect` could be built. Finished the same evening.

### 2a. Weekly-concept user ids — already fixed in commit `f624695`

**Do not “unify” both tables onto `users.id`.** Verified in the live DB 2026-08-30:

| Table | `user_id` is | RLS |
|---|---|---|
| `notification_preferences` | `public.users.id` (app id) | via `users.auth_id = auth.uid()` |
| `notification_concept_subscriptions` | `auth.users.id` | `user_id = auth.uid()` |

Mixing them made PostgREST `.update().eq()` match **zero rows with no error**. Token never saved (`push_enabled` true, `expo_push_token` null). Edge Function looked up prefs by auth uid and skipped everyone (`sent: 0`).

Fix (in HEAD):

- Client prefs writes: `appUserId()` (`users.id`) + `.select('user_id')` and **warn on no match**.
- Client subscription writes: `authUserId()`.
- `supabase/functions/on-weekly-concept/index.ts`: map `sub.user_id` → `users.auth_id` → `users.id` before reading prefs.

**If you redeploy the Edge Function**, this mapping must stay. Cron is still **not** to be uncommented.

### 2b. Offline final exam never replayed — in HEAD

`enqueueExamSubmission` wrote; `replayExamSubmissions()` was never called. Dashboard `load` now replays exams next to quizzes and alerts:

`src/screens/dashboard/DashboardScreen.tsx` (~716). Account switch already wipes `ape:*` including `ape:finalExamQueue`.

### 2c. Co-req gs3080 vs gs3081 — **owner ruling 2026-08-30**

**Audio Fundamentals Lab (gs3081) replaced Electrical Power (gs3080).**

`COREQ_TOPIC_GS = [3060, 3070, 3081, 4370]`

Completing every lab in `audio_fundamentals` marks gs3081 complete (`labCompletion.ts` / `mark_lab_complete`). Foundations of Sound (`FoundationsCourse` / `af_foundations`) is **one of those labs**, not a fifth standing requirement.

UI so it is not counted twice:

- Award banners list **only** `COREQ_TOPIC_GS` names (no extra “Foundations in Audio”).
- Extra Enrollment green lab card removed.

Governance R6 amended in `docs/APE_GOVERNANCE_DECISIONS_2026_08_06.md` (file may still be uncommitted — check). Live `award_standing_requirements` already used 3081 (see `src/features/awards/api.ts`).

Closed note: `docs/APE_BUGBOT_FOLLOWUP_2026_08_28.md`

---

## 3. Committed today on `audio-tools-engine` (other sessions on this machine)

Newest first. Grouped. Do not redo these.

### Identity / weekly notifications / email

| Commit | What |
|---|---|
| `f624695` | Identity mismatch fix (see §2a) |
| `9abad5c` | Email setup status: DNS verified, column applied, function deployed v2 |
| `8a5e530` | Email doc: reply-to is Workspace-routed `info@` |
| `d6952c8` | Settings: collapsible sections, **per-category** weekly schedules, design pass |
| `200adc5` | Schedule popup: colliding number/buttons |
| `ee0d064` | “Phone notifications” is a real master switch + copy |
| `b078ad3` | Module-scope mock prefs leaked onto the device |
| `12134bf` | Settings: every section starts closed |

Weekly concept: each of 7 categories has **its own** day and time (not one shared schedule). Staggered defaults. Categories must match `notification_concepts.category` exactly. Short labels in `CATEGORY_SHORT` (`weeklyConcept.ts`).

Email transport lives in `on-weekly-concept` (push + email, gated by `notify_weekly_concept`). Company domain only. Doc: `docs/APE_EMAIL_WEEKLY_CONCEPT_2026_08_29.md`.

**Still: do not uncomment pg_cron. Ranking still blocks production send sequence.**

### Web domains

| Commit | What |
|---|---|
| `3043c7c` | `.co` 308 → `www.proaudiotrainingacademy.com` in `web/proxy.ts` (before the gate) |
| `174907c` | Same for `.online` |

Canonical host: `www.proaudiotrainingacademy.com`. Do not serve a duplicate site on typo domains.

### Accessibility (big sweep)

Docs: `docs/APE_ACCESSIBILITY_2026_08_30.md`

Model: **defer text size / contrast / colour to the phone.** In-app chips that did nothing were removed. Colour-blind remap **ruled out** (amplitude ramp is meaning, owner 2026-08-30). Reduce-animations = app toggle OR OS reduce-motion.

| Commit | What |
|---|---|
| `cee1f92` | a11y runtime; honour reduceAnimations |
| `5ed8e82` | Drop dead text-size/contrast/colour controls |
| `b69d831` | Labels, roles, hints, hit targets |
| `4aba4b7` | Document the model |
| `79cdf64` | Round 2: modal focus traps, image labels, headings |
| `e2d0859` | Round 3: touch targets, selected state, 47 non-issues ruled out |
| `dac6c9f` | Last image labels; rounds 2–3 documented |

Runtime: `src/features/settings/a11y.ts` — use `animationsAllowed()`.

### EQ lab / waterfall / dock

| Commit | What |
|---|---|
| `4d8e71d` | Waterfall: build once and hold; REPLAY |
| `6f25abb` | Dock: pressed state, haptic, action flash |
| `b9006e3` | EQ lane: filter pick (220 Hz Q6 / 440 Hz Q1 / 1 kHz shelf) |
| `3819c68` | One EQ key: tap opens filter menu, then slider |
| `25d8454` | Chooser-fader rolled to 2 more places; sticky support |
| `842003c` | Waterfall: EQ boost must not move frequencies it is not touching |
| `8cf75ff` | Waterfall: real decay curve, not three plateaus |
| `69b6d8e` | EQ bands **accumulate** instead of replacing each other |

### Profile / registry / privacy

| Commit | What |
|---|---|
| `1226fba` | One showable ID; `users.show_in_registry` default **false**; switch writes server, confirms ON, reverts on fail |
| `cab0c6b` | ID: low-light + screen readers |
| `9bc765e` | Registry: voluntary listing; publish only what was agreed |
| `1456426` | Profile preview harness `#profilepreview/<width>` |
| `701a3f9` | **Stop the dev screen-index shipping to students** |

QR / ID card is for showing across a table. Registry must not publish from a local-only flag.

### Labs / mic / foundations / icon

| Commit | What |
|---|---|
| `ebc8ec1` | Mic + Foundations punch list: missing font; stereo nobody could read |
| `c4deb82` | App icon: real mark, ground matches the app |

---

## 4. Standing constraints (still true)

- Expo SDK **57** — docs: https://docs.expo.dev/versions/v57.0.0/
- Next on `web/` is **not** the Next you remember; read `web/AGENTS.md` / `web/node_modules/next/dist/docs/` before web edits.
- Brand name never abbreviated.
- Do not claim WCAG AA or EU AI Act compliance.
- Do not keyword-stuff “certification.”
- Site gate: `GATE_ENABLED = true` until launch. Local `NODE_ENV === development` bypasses the gate for the whole site (so `/connect` allowlist is a **production** concern).
- Push still needs a **new EAS / dev-client build** for `expo-notifications` native module (house lesson 2026-08-21 / 08-27).
- Computer B ranking CSV still gates `get_next_concept` order (`id` today, `rank` after Booth accepts).

---

## 5. Suggested Claude Code next steps (in order)

1. `git status` — confirm `/connect` files are still untracked/modified. **Do not commit unless Booth asks.**
2. If Booth wants `/connect` on the live gated site: deploy **web only** after he asks. Smoke: card URL works without the site key; `/` still gated; Nav/Footer absent; mailto opens.
3. If Booth wants the Low-Light PROCEED gate: that is the uncommitted `lowLight.ts` / `LowLightLayer.tsx` work — finish/verify, don’t mix it into a `/connect` commit unless he says so.
4. Do not reopen co-req to gs3080. Do not add Foundations as a fifth requisite.
5. Do not uncomment pg_cron. Do not apply ranking SQL.
6. Bugbot parked work is **closed**. Do not re-litigate the two-identity notification map.

---

## 6. Do not

- Force-push
- Apply SQL / schedule cron
- Index or advertise `/connect`
- Put a second password on `/connect`
- Send card recipients to the homepage
- Primary CTA = Get the app
- Invent `vip.proaudiotrainingacademy.com`
- Merge/deploy web or the store binary without Booth
- Commit `.tmp.driveupload/` or secrets

---

_End of handoff._
