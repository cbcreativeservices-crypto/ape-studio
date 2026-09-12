# Wave 3 audit — Offline / Empty / Error states

Scope: launch-readiness of offline/no-network, empty-collection, and user-facing error
states. Read-only pass over `src/screens/**`, `src/features/**`, `src/components/**`,
`src/lib/**`. Line numbers are from the files as of 2026-09-09.

General note: the **live-measurement tools** (`EngineGate` + `useDspEngine`) and the
**Dashboard** are the strongest examples in the app — honest offline/error copy, a 12 s
start watchdog, cached instant-landing, self-heal for stranded sessions, and a Retry /
Back-to-Login escape hatch. Most gaps below are in the *content-fetch* screens that were
built before those patterns and never retrofitted, plus a handful of generic/raw error
strings.

---

## Top 5

1. **[High][offline]** Glossary corpus fetch failure is swallowed and rendered as
   "No results" — the user cannot tell an offline glossary from an empty one.
   `src/screens/glossary/GlossaryScreen.tsx:1272` + `:1967`
2. **[High][offline]** Achievements "Trophy Case" fetch failure leaves all three cards in
   a permanent skeleton/loading row with no error and no retry.
   `src/screens/achievements/AchievementsHomeScreen.tsx:60`
3. **[Med][offline]** CredentialWall treats a failed fetch as "none exist", showing
   "COMING SOON — No certificates available yet." when the user is merely offline.
   `src/screens/achievements/CredentialWall.tsx:55`
4. **[Med][error]** In-app feedback/report links (`Report a bug`, `Suggest a correction`,
   definition/term reports) fail silently when the device has no mail app — the buttons
   do nothing, with no fallback address. `src/lib/feedback.ts:56`
5. **[Med][error]** Auth surfaces raw Supabase `error.message` (offline shows the jargon
   "Network request failed") and a generic "Something went wrong. Please try again."
   `src/features/auth/api.ts:39` and `:72/:77/:98/:107/:113`

Auto-fixable count: **8 of 12** findings marked `auto_fixable: yes`.

Counts — by category: offline 6, empty 2, error 4. By severity: High 2, Med 5, Low 5.

---

## Findings

### [High] [offline] Glossary corpus failure is indistinguishable from an empty glossary
`src/screens/glossary/GlossaryScreen.tsx:1272` (load) · `:1967` (ListEmptyComponent)
- The corpus loader's only failure handling is `catch (e) { console.warn(...) }` then
  `finally { setLoading(false) }` (1272–1276). With no cached corpus (first open of the
  session) and no network, `entries` stays `[]`, `loading` flips false, and the list's
  `ListEmptyComponent` renders `No results for {filter}` (1967–1968). The nightly count
  RPC also fails, so even the header count is blank.
- How a user hits it: open the Glossary tab for the first time this session while offline
  (airplane mode, dead spot). They see an apparently empty 0-term glossary, not "you're
  offline".
- Fix: track a `loadError` state in the catch; when set and `entries.length === 0`, render
  a distinct offline card ("Couldn't load the glossary — check your connection") with a
  Retry that re-runs `loadAllEntries()` (the loader already does NOT session-cache a
  rejection, so retry works).
- `auto_fixable: yes`

### [High] [offline] Trophy Case sticks in a permanent loading skeleton on fetch failure
`src/screens/achievements/AchievementsHomeScreen.tsx:60`
- `fetchAchievementsHub().then(setHub).catch(() => setHub(null))` (60–62). `hub` stays
  `null`, so `t/c/p` are `undefined` (66–68) and each `RecentStrip` is rendered with
  `loading={!t}` → `true` forever (106, 128, 150). The strips show a blank placeholder row
  with no text, and the counts read "— / —" / "—". There is no error message and no retry.
- How a user hits it: open Achievements while offline, or during a Supabase blip.
- Fix: add an `error` state in the catch; when set, render an inline "Couldn't load your
  trophies — check your connection" with a Retry, instead of leaving the skeleton up.
- `auto_fixable: yes`

### [Med] [offline] CredentialWall shows "No certificates available yet" when offline
`src/screens/achievements/CredentialWall.tsx:55` · empty render `:211`
- Both loaders collapse failure into an empty/none result:
  `fetchEarnedCredentialsByType(kind).then(setRows).catch(() => setRows([]))` and
  `fetchNearestCredential(kind).then(setNearest).catch(() => setNearest(null))` (55–56).
  A null `nearest` → the "none_published" branch renders "COMING SOON / No {noun}s
  available yet." (211–217). Offline is thus reported as "these don't exist yet."
- How a user hits it: open Certificates/Programs offline.
- Fix: distinguish rejection from an empty result (e.g. a `failed` flag) and show a
  connection message + Retry rather than the COMING SOON slot.
- `auto_fixable: yes`

### [Med] [error] Feedback / report mail links fail silently (no mail app, no fallback)
`src/lib/feedback.ts:56`
- `sendFeedback()` ends with `Linking.openURL(url).catch(() => {})`. If no mail client is
  configured/installed (common on Android and on tablets), the `mailto:` open rejects and
  is swallowed — the button appears dead. This helper backs "Report a bug", "Suggest a
  correction" (Glossary `:733`), definition/term reports, and feature suggestions across
  the app.
- How a user hits it: tap any report/suggest affordance on a device with no default mail
  app.
- Fix: in the catch, `notify('No mail app found', 'Email us at info@proaudiotrainingacademy.com')`
  (and ideally copy the address to the clipboard) so the path is never a dead end.
- `auto_fixable: yes`

### [Med] [error] Auth generic "Something went wrong. Please try again."
`src/features/auth/api.ts:39`
- `REGISTER_ERROR_COPY` maps both `not_authenticated` and `internal_error` to
  "Something went wrong. Please try again." — the exact vague copy this audit flags. It
  states neither what happened nor what to do.
- How a user hits it: a registration RPC returns an internal/auth-state error.
- Fix: give each code an actionable line (e.g. internal → "We couldn't finish creating
  your account. Please try again in a moment or contact your professor.").
- `auto_fixable: yes`

### [Med] [error] Auth surfaces raw Supabase error strings (incl. offline jargon)
`src/features/auth/api.ts:72` `:77` `:98` `:107` `:113`
- `ensureSession`, `signIn`, `requestPasswordReset`, `verifyRecoveryOtp`, and
  `updatePassword` all `return error.message` verbatim; `AuthScreen` then `setError`s it
  (e.g. AuthScreen `:263`). Offline this yields the developer-facing "Network request
  failed"; other paths surface raw provider phrasing.
- How a user hits it: try to sign in / reset password while offline or rate-limited.
- Fix: detect network failures and show "You appear to be offline — reconnect and try
  again."; map the common auth messages to plain copy rather than passing through.
- `auto_fixable: no` (needs message-mapping/classification, judgement)

### [Med] [empty] Enrollment empty list is a terse dead-end
`src/screens/enrollment/EnrollmentScreen.tsx:1227`
- With no enrollments the body renders a single small italic gray line: `No topics yet.`
  (1228–1229, `styles.empty` at `:1878`). It doesn't tell the user that the Browse & Add
  section below is how they build a list, or point at the free topics.
- How a user hits it: a new/guest account, or after clearing the list.
- Fix: replace with a short empty state that names the next action ("Browse certificates,
  programs, and topics below to start building your study list").
- `auto_fixable: yes`

### [Low] [error] Quiz / Final Exam "Submit failed" shows the raw exception message
`src/screens/quiz/QuizScreen.tsx:165` · `src/screens/exam/FinalExamScreen.tsx:138`
- The offline branch is handled well (`notify('Offline', 'Offline — please reconnect to
  submit.')`), but the non-offline failure path is
  `notify('Submit failed', (e as Error).message, ...)` — the body is whatever the thrown
  error says (often a stack-ish/PostgREST string).
- How a user hits it: a server/RPC error (not a clean offline) on quiz/exam submit.
- Fix: show a fixed, honest line ("We couldn't record your submission. It's saved and will
  retry — check your connection.") and log the raw message instead of showing it.
- `auto_fixable: yes`

### [Low] [offline] Mic-denied card names system Settings but gives no way to open it
`src/screens/tools/EngineGate.tsx:31`
- The `denied` state copy is good ("Enable microphone access for this app in system
  Settings, then return here.") but there is no button; the user must leave the app and
  navigate Settings manually.
- How a user hits it: decline the mic permission on any live tool.
- Fix: add an "Open Settings" button wired to `Linking.openSettings()`.
- `auto_fixable: no` (needs new control + wiring)

### [Low] [offline] Directory fetches invoked without a rejection handler
`src/screens/directory/DirectoryScreen.tsx:102`
- `loadPublicProfile().then(...)` (102) and `void fetchMyQrToken().then(setQrToken)` (103)
  have no `.catch`. `loadPublicProfile` is internally safe (AsyncStorage read with its own
  try/catch, `publicProfile.ts:75`), but `fetchMyQrToken` is a Supabase call — offline it
  rejects as an unhandled promise rejection, and the QR block simply never populates with
  no explanation.
- Fix: add `.catch(() => {})` (or a small "couldn't load your registry code" state) to the
  QR fetch.
- `auto_fixable: yes`

### [Low] [offline] Flashcards spins with no timeout if the topic fetch stalls
`src/screens/study/FlashcardsScreen.tsx:1164`
- Clean network *errors* are handled ("Could not load this topic. Check your connection."
  at `:495`, rendered `:1154`). But a *stalled* request never rejects, and `if (!items)`
  renders a bare `ActivityIndicator` with no watchdog/retry (1164–1169) — unlike the tools
  engine, which has a 12 s watchdog.
- How a user hits it: a half-open connection (captive portal, dead spot) when opening a
  study method.
- Fix: add a timeout that flips to the same error+Back state after N seconds.
- `auto_fixable: no` (needs timeout logic)

### [Low] [empty] Dashboard cold fallback shows a bare "Nothing to show yet."
`src/screens/dashboard/DashboardScreen.tsx:1089`
- When there's no error but `data`/`topic` is missing (`if (error || !data || !topic)`),
  the fallback text is `error ?? 'Nothing to show yet.'` (1092). It's a rare edge (e.g. an
  account with zero resolvable topics and no error), but the copy dead-ends with no
  next-step. (The error path itself is well handled with Retry / Back-to-Login below it.)
- Fix: give the no-data-no-error case a directed empty state ("No topics loaded yet — add
  courses from My Enrollments").
- `auto_fixable: yes`

---

## Good patterns worth preserving (not defects)
- `src/screens/tools/EngineGate.tsx` — honest absent/spike/denied/error cards; no fake
  meters. `useDspEngine.ts:111` 12 s start watchdog.
- `src/screens/dashboard/DashboardScreen.tsx:817` — offline refresh never clobbers good
  on-screen content; explicit Retry + Back-to-Login escape.
- `src/screens/awards/AwardsScreen.tsx:586/:695` — empty states name the connection cause.
- `src/screens/tools/MeasurementLibraryScreen.tsx:580` — clear "NO SAVED MEASUREMENTS YET"
  card. `src/screens/glossary/GlossaryScreen.tsx:2514` — "No terms in this set." for the
  favorites/custom/recent lists. `src/screens/profile/ProfileScreen.tsx:610` — honest
  "no certificates started yet" empty state.
