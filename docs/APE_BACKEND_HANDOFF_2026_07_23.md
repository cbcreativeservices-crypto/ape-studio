# AP&E STUDIO — HANDOFF TO PROJECT CHAT (BACKEND / GOVERNANCE)

- **Date:** 2026-07-23
- **From:** Client (RN/Expo) build session
- **Project:** Pro Audio Training Academy — Supabase project `yjgolswjggmlpeowvtxr` (LIVE)
- **Standing rule:** NO backend/schema/RPC changes were made this session. Client
  renders; server decides gating / entitlement / grading. This doc lists what the
  **backend + governance** should pick up from the client work since the
  2026-07-18 handoff.

---

## 0) VERIFICATION STATE AT HANDOFF

- `npx tsc --noEmit` → clean (exit 0).
- Metro dev bundle (android, dev) → HTTP 200.
- No backend/schema/RPC changes made from this session.
- Dev bypasses remain ACTIVE (see `src/config/devMode.ts`; restore steps in
  `docs/DEV_MODE_RESTORE_2026_07_18.md`).

---

## 1) BACKEND ACTION ITEMS

### A) Progress display parity — enrollment meters now match the Dashboard (BUG FIX)

**Symptom reported:** a topic (Pro Audio Safety) studied to near-completion in
Flashcards showed progress on the Flashcards LED, but the **My Enrollments**
topic meter (and the cert/program aggregate meters) read **0%**.

**Root cause (client):** `src/features/enrollment/enrollmentProgress.ts` derived
its % from **server** `student_method_progress.completion_pct` only. When the
user has no account (`userId === 'local'`) or the `record_study_progress` write
hasn't landed yet, that set is empty → 0%.

**Client fix (display-only, no contract change):** the hook now mirrors the
Dashboard exactly — it merges the **device-local method mirror**
(`loadAllLocalMethodStates`, AsyncStorage `ape:localMethod:<achId>:<method>`)
OVER the server rows and computes the topic % as the **mean of the applicable
methods' `studyDisplayPct`** (`src/features/study/api.ts`). Gates
(completion / time / accuracy) still read **server truth only**.

**Backend takeaway:** informational — `record_study_progress` contract is
unchanged. But this makes the **display-vs-gate flashcards discrepancy** (item
carried since 2026-07-15) newly visible on TWO surfaces, so please resolve:

- `studyDisplayPct` credits a flashcard as fully studied at **views ≥ 1 OR
  known** (one thorough pass = 100% display). The **server gate** still requires
  **views ≥ 2 OR known**. → If display 100% should equal the gate, set the
  flashcard method's **required views = 1** server-side. (Same ask as
  2026-07-15 item I; now affects the enrollment meters too.)

### B) Un-enroll MUST NOT erase progress (invariant to enforce server-side)

Product ruling (2026-07-23): **removing a topic or award from the enrollment
list never deletes progress.** Progress is always saved/tracked for any account,
active or lapsed.

- Today this is safe because the enrollment list is **device-local**
  (`enrollmentStore` / `enrolledBundlesStore` / `homeCardsStore` — all
  AsyncStorage; the entries hold only `{gs, favorite, active}` / bundle keys /
  home layout, no progress). Removing an entry cannot touch progress because the
  client never writes progress tables.
- **When the backend adds enrollment persistence / cross-device sync (see C):**
  un-enroll must be a **soft** operation. It must NOT cascade-delete
  `student_method_progress` or `student_achievement_progress`. Earned progress
  and awards survive un-enroll and re-enroll.

### C) Enrollment is client-local today — backend persistence is a future need

The Enrollment screen does **not** touch the backend `enrollment` table (frozen).
State lives in AsyncStorage:

- `ape:enrollmentList` — enrolled topics `{gs, favorite, active}` (order is
  user-arrangeable via drag-reorder).
- Enrolled bundles (cert/program/subject) + home-card layout (`HOME_MAX = 20`).
- Seeds: `FREE_ENROLL_GS = [100, 1240]` (Pro Audio Safety + DAW Fundamentals)
  auto-enroll for non-subscribers. `COREQ_TOPIC_GS = [100, 120, 1590]`.

**Takeaway:** for account users we'll eventually want the enrollment list, the
loaded/active set, favorites, order, and home layout to persist server-side and
sync across devices. Not built; flagging so the schema can be planned with the
un-enroll invariant (B) baked in.

### D) Deck-loading model (ruling to encode)

The countable unit loaded into the Dashboard study deck is the **individual
TOPIC** (`enrollmentStore` `active` flag; `toggleActive` / `setActiveMany`).

- Loading a topic into the deck is **UNGATED** and **persists** (free or paid).
  The Dashboard only **shows** the topics the user can actually access; loading
  itself is never blocked.
- Pro Audio Safety (gs100) is **permanently loaded** and cannot be removed.
- Home-screen card toggles remain **paid-gated** (academy).

Server relevance: if/when the loaded set persists (C), mirror this "load is
ungated, access is what's gated" split.

### E) Pro Registry / public directory (client-side, awaiting persistence)

The Profile screen has a **PRO REGISTRY** panel with a `showInRegistry` toggle
and a `registryName` (see `src/features/profile/publicProfile.ts`). The
Directory screen renders a registered state (QR + USER/GRADUATE, links gated on
paid). These fields are **client-side today**. Backend will eventually own the
opt-in registry record + directory listing + the paid gate on shareable links.

---

## 2) GOVERNANCE / SPEC UPDATES TO LOG

Please fold these into the governance decisions log (successor to
`APE_GOVERNANCE_DECISIONS_2026_07_18.md`):

1. **Progress-preservation invariant** (§1B): un-enroll never erases progress;
   progress persists for any account, active or lapsed.
2. **Deck-loading ruling** (§1D): topics are the loadable unit; loading is
   ungated and persists; access (not loading) is what entitlement gates; Safety
   is permanently loaded.
3. **Onboarding / intro flow** (new timing + placement rules):
   - The **"Welcome to Pro Audio Training Academy"** popup now shows **BEFORE the
     login screen**, on first app open (`AppWelcomeOverlay` on `AuthScreen`).
     Minimum **9-second** dwell — the "LET'S GET STARTED" control appears only
     after 9s. Persists once (`ape:intro:appWelcome`).
   - The **"Our Commitment to You"** popup shows once on **first arrival at the
     Home screen** (`ScreenIntroOverlay introKey="commitment"` on
     CourseSelection). Minimum **8-second** dwell before "tap anywhere to
     continue" appears. Persists once (`ape:intro:commitment`).
   - Timed popups show **no interim text** during the countdown; the
     tap-to-continue affordance is **green** when it appears.
   - **Settings → "Reset onboarding hints"** is now **user-facing** (was
     dev-only) and clears BOTH coach marks (`resetCoachMarks`) AND all screen
     intros (`resetScreenIntros`, clears every `ape:intro:*`) — so the welcome
     and commitment popups replay after a reset.
   - Finalized (non-placeholder) intro copy: `appWelcome`, `commitment`,
     flashcards T1/T2/T3, `glossary`. Others remain placeholders.
4. **Display-vs-gate parity** (§1A): decision needed on flashcard required
   views (1 vs 2) so the LED and the gate agree.

---

## 3) CLIENT CHANGE LOG SINCE 2026-07-18 (for completeness)

Mostly UI; no backend impact except where §1 flags it.

**Enrollment screen**
- 3-card **DeckIcon** load indicator: staggered 3-card stack, thin outlines,
  border = `colors.blue` (#2f9bff, matches the Study icon), **opaque lighter-blue
  front card** (#7fbfff) that occludes the two back frames; no lightning bolt.
  GRAY when not loaded. Linked Study icon lights blue when loaded.
- Award containers (cert/program/subject): shared DeckIcon + linked Study +
  STUDY ALL / ADD-REMOVE TOPICS controls; cert/program default to collapsed
  (thin), individual topics default expanded; white topic borders.
- Animated **Hold-to-Remove** (left→right fill on hold); **press-hold
  drag-reorder** (replaced the ☰ handle); **MY RECORD** completed-items folder;
  **Browse & Add** pinned tab bar + collapse triangle. HOME SETUP button amber.
- Progress meters now merge the local mirror (see §1A).

**Dashboard**
- MY ENROLLMENTS button restyled to match the Home Enrollments button; method
  cards reverted to uniform gray; `viewMode` default `enrollment`.

**Profile / Directory**
- Institutional panel removed; PRO REGISTRY panel with `showInRegistry` toggle
  (disabled until name + registryName + valid email) and registryActive readout.
- Directory registered-state styling (green title, centered QR, USER/GRADUATE,
  paid-gated links).

**Onboarding / intros** — see §2.3.

**Misc**
- Notification schedule rows → one-line schedule buttons + JS-only custom
  time/day picker (no native datetimepicker dependency).
- Home NavIcon recolored orange → `colors.amber`.

---

## 4) OPEN QUESTIONS / DECISIONS NEEDED (for Prof. Booth)

1. **Flashcard required views: 1 or 2?** (§1A) — governs whether display % and
   the completion gate agree.
2. **Enrollment persistence** (§1C) — when do we move the enrollment list /
   loaded set / favorites / order / home layout server-side, and confirm the
   un-enroll soft-delete invariant (§1B) in that schema.
3. **Pro Registry / directory** (§1E) — server ownership of the opt-in registry
   record, listing, and the paid gate on shareable links.
