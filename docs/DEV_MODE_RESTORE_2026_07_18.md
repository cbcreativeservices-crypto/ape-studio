# DEV-MODE RESTORE CHECKLIST — 2026-07-18

Everything turned off / adjusted for Booth's screen-development testing, and
what "operating position" means for each. **Master switchboard:
[`src/config/devMode.ts`](../src/config/devMode.ts)** — every bypass funnels
through `devBypass(flag)`, which is hard-guarded by `__DEV__` (a release build
is ALWAYS in operating position regardless of these flags).

## To restore everything at once

In `src/config/devMode.ts`, set all four flags to `false`:

```ts
export const DEV_BYPASS = {
  bypassQuizLocks: false,
  bypassMethodLocks: false,
  bypassAcademyLocks: false,
  alwaysShowIntros: false,
} as const;
```

No other code changes are needed — every consumer below checks the flag at
the moment of use. The sections below document each consumer so future edits
don't silently bake a bypass in.

---

## 1. `bypassQuizLocks` — quiz always startable

| Where | Bypassed behavior | Operating position |
|---|---|---|
| `src/screens/dashboard/DashboardScreen.tsx` (`quizState` derivation) | A `locked` quiz renders as `ready`; the quiz switch is tappable. | Quiz stays `Locked` until all method gates pass (server-mirrored readout). |

**Note:** the server RPC `start_quiz_attempt` still re-checks gates and may
refuse — the client then surfaces the server error. That is EXPECTED while
testing; the backend is frozen. Do not add further client-side workarounds.

## 2. `bypassMethodLocks` — every topic + method reachable

| Where | Bypassed behavior | Operating position |
|---|---|---|
| `DashboardScreen.tsx` `topicsUnlocked` | Topic swipe frontier = last topic in every mode; stored index clamps to full course length in `load()`. | Institutional mode: frontier = last non-locked topic (progress rows); swipe past = shake + haptic. |
| `DashboardScreen.tsx` `frontierIdx` | Returns `topics.length - 1`. | Computed from `progressByTopic` statuses. |
| `DashboardScreen.tsx` inapplicable-method switch | Dead (clear/unlit) switches become a live "Open" outline switch navigating to the method screen (screen may be empty of content). | Inapplicable methods render a DEAD clear switch (travels + clicks, opens nothing). |

**Product decision (KEEP, not a bypass):** in **commercial/academy mode** no
topic is ever locked — `topicsUnlocked = commercialMode || devBypass(...)`.
Paying users roam the whole course; topic quizzes count toward certificates /
awards but never gate movement. When restoring, leave the `commercialMode`
half of that condition in place.

## 3. `bypassAcademyLocks` — full academy entitlement

| Where | Bypassed behavior | Operating position |
|---|---|---|
| `src/features/commercial/EntitlementProvider.tsx` | `caps` forced to `capsFor('academy')` regardless of the real entitlement (paywalls, veils, upsells hidden). | `caps = capsFor(entitlement)` from the real subscription state. |

Server-side RLS/grants still apply (e.g. `glossary_full_v` common_mistakes may
403 for anon) — those failures are non-fatal by design.

## 4. `alwaysShowIntros` — first-time experience on every entry

| Where | Bypassed behavior | Operating position |
|---|---|---|
| `src/features/intro/ScreenIntroOverlay.tsx` (`useScreenIntro`) | Intro overlay shows on EVERY screen entry; the `ape:intro:<key>` seen-marker is neither read nor written. | Shows once per install, then persisted as seen. |
| `src/lib/coachMark.ts` | Coach marks visible immediately on every mount; retire counters neither read nor written. | Self-retiring: shown until N acknowledgements, persisted. |
| `src/screens/study/FlashcardsScreen.tsx` (fullscreen guide effect) | The FULL SCREEN guide shows every time the 2-review threshold hits, ignoring + not writing its `fsGuideCount` (max-2) counter. | Guide appears at most 2 times ever, counter persisted. |

### Intro placeholders installed (content TBD — these stay after restore)

`src/features/intro/screenIntros.ts` + `ScreenIntroOverlay.tsx` are the NEW
intro/tutorial system (placeholder copy, real tutorials not yet developed).
Mounted at:

- `CourseSelectionScreen` — `ScreenIntroSequence first="appWelcome" second="firstUserWelcome"` (app welcome after load-in → first-user welcome tutorial)
- `DashboardScreen` — `introKey="dashboard"` (method cards)
- `FlashcardsScreen` — `introKey="flashcards"`
- `GlossaryScreen` — `introKey="glossary"`
- `AwardsScreen` — `introKey="awards"`

These are product features, not bypasses — only their show-every-time behavior
comes from `alwaysShowIntros`.

---

## Not bypasses — new features added in the same session (do NOT revert)

- **User term lists** `src/features/flags/flaggedStore.ts` — four
  device-persisted lists togglable from any term-list popup via
  `TermSelectIcons` (⚑ ♥ ★ ✓/✗): **flagged** (legacy key `ape:glossaryFavs`,
  so previously starred glossary terms carry over; shared by Glossary star,
  Flashcards card star + FLAG TERM button, the Dashboard "My Flagged List"
  card), **heart** (favorites), **starred** — user-facing name **"Custom
  List"** (Booth 2026-07-18; it will also feed the user's notifications —
  scheduling is a future feature), and **known** (self-assessed, global;
  separate from server-credited study progress).
- **Flagged pseudo-topic** — `FLAGGED_TOPIC_ID` (`'flagged'`) routes
  Flashcards into local-only flagged study: no `StudySession`, no
  `record_study_progress`, no local method-state mirror. Documented limitation
  until a backend topic exists (backend frozen).
- **Dashboard**: tap topic title → all-terms sheet (rows carry the select
  icons); Flagged card below rack.
- **Flashcards**: ★ starred view chip + popup; term-list popups with select
  icons; glossary terms INSIDE definitions are highlighted links to a
  full-screen definition overlay (deck-scoped matching — a whole-glossary
  index is deliberately not fetched); exit returns to the same card.
- **Study screens**: visible `‹ RETURN` button in `StudyHeader` (all 5
  methods) back to the Dashboard.
- **Glossary**: per-term share icon (`Share.share`, familiar box-with-arrow
  SVG in `src/components/ShareIcon.tsx`).
- **Signup/pricing**: `COPY.betaPricingNote` (beta new-adopter pricing, valid
  through year-end) on AuthScreen commercial signup, PaywallScreen, and
  UpgradeSheet.
- **Audio Tools**: Tuner placeholder tile (`planned: true`) + design note that
  tools must go deep and demonstrate glossary terms.

## Known dev-mode side effects to expect while testing

- Quiz start may error with a server gate message (expected — see §1).
- "Open"-ed inapplicable methods may show empty decks/boards.
- Intros reappear on every focus/mount — that is the point.
