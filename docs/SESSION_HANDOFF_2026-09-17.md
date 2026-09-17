# SESSION HANDOFF — 2026-09-17 (ccode / Claude Code)

**Repo:** `C:\Users\profe\dev\ape-studio` · branch `audio-tools-engine` · **pushed and clean**
**Supersedes:** `SESSION_HANDOFF_2026-09-16_B.md` (still accurate for anything before this date)
**43 commits landed this session**, from `20bf18a5` to `1991de22`.

---

## 0. READ THIS FIRST — three things that will waste your time otherwise

1. **The phones run STANDALONE `preview` builds. They do not talk to Metro.**
   Editing code and reloading the dev client will NEVER show your change. This cost most of a
   morning. Check what the phone is actually running before debugging "my edit isn't showing".
2. **To see a change, fastest first:**
   - **Browser preview, seconds, no publish.** `preview_start` with the **`ape-web`** config — note
     it lives in `C:\Users\profe\.claude\launch.json`, NOT the repo's `.claude/launch.json`, which
     that tool does not read. Serves the real app at `http://localhost:8091` and auto-enters Guest
     Mode. Use it for ALL copy, layout and colour work. It cannot run mic, camera or audio engine.
   - **`npx eas update --branch preview --environment preview --message "…" --non-interactive`** —
     a few minutes, reaches both installed phones. `--environment` is REQUIRED non-interactively.
     On the phone: close fully, open, wait, close, open. First launch downloads, second runs it.
   - A full build only for native changes (~30 min + ~9 min upload).
3. **BATCH THE CEREMONY.** The edits take seconds; `tsc` is ~90 s, `eas update` 2–4 min. Do several
   changes, then ONE typecheck and ONE publish. The owner called this out directly. For pure
   styling, tsc alone is enough. **`npm test` is node's runner — jest reports ~193 bogus failures.**

---

## 1. Build + release state

- **Both phones have native `preview` builds** (Android + iOS, both succeeded 2026-09-17) and have
  received OTA updates. iOS build `03783d0c`, Android after the Sentry fix below.
- **OTA is configured and working**: `expo-updates ~57.0.22`, `runtimeVersion` on the **fingerprint**
  policy, `channel` on all three eas.json profiles. JS-only fixes no longer need a build.
- **EAS env now holds 6 vars** (was 2): Supabase URL + anon key, Sentry DSN, Aptabase key,
  `SENTRY_ORG`, `SENTRY_DISABLE_AUTO_UPLOAD`. `scripts/eas-env-sync.ps1` pushes them from `.env`.

### The build trap that cost two failed builds — do not re-create it
Adding `SENTRY_AUTH_TOKEN` makes the source-map upload **mandatory**. A *wrong* token fails the
whole build after ~21 min of Gradle (401 Invalid token); *removing* the token then fails it again
("Auth token is required"). The real switch is **`SENTRY_DISABLE_AUTO_UPLOAD=true`**, read literally
by `node_modules/@sentry/react-native/sentry.gradle`. That is set now, so builds pass and crash
reports arrive **unsymbolicated**. To get symbolication: put a VALID token in `.env`
(the **Tokens** section of the Sentry internal integration — *not* the Client Secret, which is what
produced the 401), run the sync script, and remove the disable flag.
**Test any token in 2 seconds first:** `npx @sentry/cli --auth-token <TOKEN> info`.

### iOS 27 — safe, but do not "fix" it
The owner's iPhone runs iOS 27. **Never pin a Xcode 27 image on SDK 57** — expo/expo#47570 is an
open, unfixed blank-screen bug under the UIScene lifecycle that iOS-27-SDK builds require. EAS's
Xcode 26.6 default keeps us in compatibility mode and the App Store still accepts iOS 26 SDK builds.
The iOS 27 path is the SDK 58 upgrade. Detail + the required iOS device test list in
`docs/APE_BUILD_READINESS_2026_09_17.md` §4d.

---

## 2. What shipped this session (all pushed, all in the phones' current OTA)

| Area | What |
|---|---|
| **Cymatics Phase 4** | Pattern Gallery & Art Studio (`550bb53e`). Last unbuilt area of the spec — PLANNED AREAS is now empty. **Never run on a device.** |
| Cymatics rack pass | Nodes/Harmony/Change/Systems on the Rack Unit; studios tightened |
| Cymatics module 8 | Experiments now run *inside* the studio: `rack.wellTop` slot + PREV/NEXT series |
| Topic welcome modal | First open of a topic's flashcards shows B's copy, once per user per topic |
| Study paywall sheet | Now offers the two free topics instead of only "pay or leave" |
| Lab lists | Generic emoji icons removed; Calculator row purple **text + icon only** |
| Tuner | iOS-only note clipping fixed (line box shorter than the font's ascent) |
| Tools hub | Previews no longer go static on return (nav lock was a ref, now state) |
| Progress screens | Certificate + program art wired to the `course-cards` bucket |
| Profile | Contact-email copy corrected; "Your user name" moved out of PUBLIC PROFILE |

**ALL OF IT IS UNVERIFIED ON DEVICE** except the rack pass and module 8.

---

## 3. Open work, in the order it matters

1. **Device-test everything above.** Phase 4 especially — the gallery, the art board's tap-to-fill
   hit testing, and studio state restore have never run on hardware. Section 10 of
   `docs/APE_CYMATICS_PHASE4_DESIGN_2026_09_17.md` is the written test script.
2. **Owner's Phase 4 verdict, given on first look:** *"Module 4 — pattern gallery and art studio are
   not intuitive or user friendly."* A UX pass is wanted. Not started.
3. **Owner wants test agents run through the Cymatics labs**, and **a scientific audit of the
   Cymatics lab**. Both explicitly deferred — "later, not now".
4. **iOS audio/camera pass** on the iPhone: buffer duration, route changes when recording starts,
   interruptions, AirPods Sleep Detection cutting long sessions, camera Hz tool, dictation, the
   newly enabled save/print/share, and audible beats from engine 8.
5. **62 certificates still have no art**; `assets/Certificate_Squares` holds 54 of them awaiting
   upload to the `course-cards` bucket (assigned to Computer B), 8 need art created. List:
   `C:\Users\profe\Downloads\2026-09-17_CERT_ART_MISSING\`.
6. **Sentry symbolication** — see §1.
7. **`.easignore`** — the project archive is 705 MB and takes ~9 min to upload because untracked
   image folders are sent to the build servers.

---

## 4. Governance / privacy decisions made this session (do not silently reverse)

- **Store data-safety declaration.** ccode verified A's draft against the shipped client and found
  it incomplete: **4 adds** (User IDs; an app-scoped install Device ID sent via `claim_device`;
  in-app Messages; the opt-in mic-calibration catalog) and **3 corrections** (profile photo is NOT
  collected — no upload path exists; push token is Optional not Required; "Name" is a self-chosen
  nickname). Telemetry has **no user-facing opt-out** and starts before login, so Group B is
  Required. Sentry is US, Aptabase EU. Full reply in the sync channel + `Downloads\2026-09-17_...`.
- **Forms are filed for the POST-NATIVE-BUILD state** (device context switches on with the native
  Sentry module).
- **Payments:** no third-party processor exists. expo-iap direct to StoreKit/Play Billing, verified
  server-side by the `validate-purchase` edge function. "Shared with third parties: None" is correct.
  **But it FAILS SAFE** — if its Apple/Google secrets are unset, the store charges the customer and
  the app never unlocks. Verify those 7 secrets before selling anything.
- **Profile contact email: SETTLED — device-local forever, no direct-email route.** Employer contact
  already works via in-app requests by anonymous token. Syncing the address would convert a value
  that never leaves the phone into stored, account-linked personal data. Not collected, not
  transmitted, not shared — by decision, not by accident. The email was also dropped as a gate on
  switching the registry listing on.
- **Age rating: KEEP 13+ and DECLARE the user interaction, with the 18+ gate on top.** The database
  enforces an age attestation, logs consent with a policy version, and unpublish kills page + search
  + contact together. **But `public.directory_known_minor()` is a stub returning `false`** — the 18+
  barrier is self-attestation, not verification, because no birthdate is collected.
  **A/Booth action:** both rating questionnaires must declare interaction + UGC, and the one Apple
  criterion currently unmet is **filtering/review of the free-text `display_name` and `about`**.

---

## 5. Hard rules worth re-reading before you touch anything

- **NEVER run `eas build`** on your own reading of a message. The only cue is the owner saying, in
  that moment, to start it now. Ask one line, then wait.
- **NEVER add/upload/commit/delete image assets** without the owner naming the folder and giving a
  go, each time.
- **Push only when the owner says "push".** Commit when they say commit.
- **Commands to the owner start with `cd C:\Users\profe\dev\ape-studio;`** — their shell is not in
  the repo, and a command without it gets skipped.
- **Deliverables go to `C:\Users\profe\Downloads\<date>_<NAME>\`.** `SendUserFile` reports success
  while the owner receives NOTHING — it has failed twice. Verify on disk, say the full path, and use
  `reveal_path` on the folder.
- **Lab builds need an explicit GO *and* a reminder to switch to Fable first.**
- No promise words in user-facing copy. MIN_FONT 12 in the labs. Amplitude drawings use the house
  ramp (`levelColor.ts`); categorical tints for states. Low-Light mode: nothing may auto-appear.

---

## 6. Cross-computer state

- **A (Cowork)** QA'd and loaded B's 166 topic welcome messages into
  `achievements.flashcard_welcome_title/body`, then applied a tone polish to 17 rows in place. The
  modal reads live, so that landed with no client change.
- **A has no commit event of its own** — when A writes an entry into
  `docs/CROSS_SESSION_HANDOFF.md`, it only reaches shared history when ccode commits and pushes it.
  Check that file for unstaged A entries before finishing a session.
- **B** owes: the 54 certificate images uploaded, art for the last 8, and the "Subtractive Mixing"
  glossary term.

---

*Written by ccode (Claude Code, Opus 5) at the owner's request, 2026-09-17.*
