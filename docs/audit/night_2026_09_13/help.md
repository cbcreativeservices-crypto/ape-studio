# Help-system adversarial re-attack — 2026-09-13 (Pillar B/C)

Scope: helpContent.ts · HelpScreen.tsx · HelpPreview.tsx · HelpKey.tsx · CoachMark.tsx · coachMark.ts · screenIntros.ts. Host screens read-only.
Verification: `npx tsc --noEmit` clean; `npm test` 1127/1127 pass after fixes.

## FIXED (in-scope edits)

1. **Stale pre-fill when a "?" key lands on an already-open Help** — `src/screens/help/HelpScreen.tsx`.
   `query` was seeded from `route.params.search` only in the `useState` initializer. Reachable path: Help(search="study") → open *Where do saved measurements go?* → jump **Open the Tools** → ToolsHub "?" (`search="tool"`) — native-stack `navigate('Help', …)` returns to the EXISTING modal and only swaps params, so the screen kept showing the old "study" filter. Added a `useEffect` that re-applies `route.params.search` whenever it changes.

2. **HelpKey pre-fill "tool" missed 2 of the 5 TOOLS & LABS entries** — `src/features/help/helpContent.ts`.
   `tools-saved` ("Where do saved measurements go?" — the entry whose jump goes to ToolsHub itself) and `tools-limits` never contain the word "tool" in their ratified copy, so the ToolsHub "?" key surfaced neither. Fixed in search logic, not copy: `filterHelp` now also matches the category TITLE ("TOOLS & LABS") and keeps the whole category on a title hit. Side effects checked: "study" now pulls all of STUDYING & CERTIFICATES (good for the Dashboard key), "lab" pulls TOOLS & LABS (good for LabShell), "meter"/"enroll" unchanged; all existing filterHelp tests still pass ("bluetooth", "the", no-match, drop-out).

3. **Clear ✕ hidden for whitespace-only input** — `src/screens/help/HelpScreen.tsx`. `searching` (trimmed) gated the clear button, so a box holding only spaces had no ✕. Clear now shows whenever `query.length > 0`; email gating still keys off the trimmed value (whitespace-only correctly shows the full manual + email).

4. **No-results state silent to screen readers** — `src/screens/help/HelpScreen.tsx`. The "Nothing in the manual matches …" text now carries `accessibilityRole="alert"` + `accessibilityLiveRegion="polite"` so a SR user typing into zero results hears it.

## OUT-OF-SCOPE REPORTS (host screens — not edited)

5. **Dashboard first entry: intro overlay + jog pill co-fire** — `src/screens/dashboard/DashboardScreen.tsx:2023-2028`. `jogCoach.visible` is decided independently of the `dashboard` intro, so on a fresh install both render at once. **Visually this holds the one-interruption rule** — the intro is a full-screen `Modal` (rgba(0,0,0,.78) backdrop + `accessibilityViewIsModal`) that covers the pill — but the CoachMark's `accessibilityRole="alert"` still fires its announcement while the intro modal is up. Same class on Glossary (`GlossaryScreen.tsx:3245/3380`) and Flashcards (`FlashcardsScreen.tsx:422/1813`). A clean fix needs the intro-visible signal exposed from `ScreenIntroOverlay.tsx` (read-only tonight) into `useCoachMark`. Minor, a11y-only.

6. **HelpKey placements are NOT gated by HELP_HUB_ENABLED** — only the Settings row is (`SettingsScreen.tsx:588`); the "?" keys on Dashboard/ToolsHub/SplMeter/LabShell/Awards would still open the hub if the flag were ever flipped back to false. Moot while the flag stays true (ratified 2026-09-13); flagging in case the kill-switch is ever relied on.

## ATTACKED AND CLEAN

- **Search edge cases**: regex metacharacters are inert (`String.includes`, no RegExp anywhere); very long queries just filter to nothing; whitespace-only returns the full hub (pinned by test); the no-results empty state renders the trimmed query safely.
- **Jump routes**: `Paywall`, `Settings` (×2), `ToolsHub` all exist in `RootStackParamList` (`src/navigation/types.ts`); the test suite also pins this by parsing the source.
- **HelpKey terms**: all five ("study", "tool", "meter", "lab", "enroll") match ≥1 entry (test-pinned); match-set sensibility audited term by term — only the "tool" gap above was real.
- **Factual audit of answers vs code** (all verified in source):
  - Settings → MEMBERSHIP → "Redeem access or promo code" ✓ (`SettingsScreen.tsx:628,646`); Settings → ACCOUNT → "Log out" ✓ (`:652,696`); "Replay onboarding hints" in both Help and Settings ✓ (`:720`).
  - "Progress → Trophy Case → CERTIFICATES" ✓ — tab draws PROGRESS (`components/nav/TabBar.tsx:79-81`), hub titled TROPHY CASE with a CERTIFICATES card (`AchievementsHomeScreen.tsx:95,139`).
  - BROWSE & ADD ✓, HOME SETUP + ⌂ ✓, chips exactly "A–Z / ⌂ On Home / Not started" ✓ (`EnrollmentScreen.tsx:918-920,1302,1310`); hold-to-remove control ✓ (`HoldToRemove`, `:1508`); reorder only in custom order (no chip) ✓ (`:1356,1365`); required-core topics stay loaded ✓ (`coreLocked`, `:1352-1354`).
  - One-device model, guest-wipe-by-design, saved measurements member-only + device-local, weekly calc/glossary caps, glossary open without account — all match the shipped model.
  - No "Recent list" or ⚑-glyph claims exist in the current ratified content (earlier-draft concerns; already gone).
- **filterHelp purity**: never mutates `HELP_CATEGORIES` (test-pinned; the title-hit path returns the original category object, which is safe because the screen never writes into it).
- **Toggle state `open` across filter changes**: an open entry filtered out and back re-renders open — chevron, amber tint, `accessibilityState.expanded` all derive from the same `open === e.id`, so no desync. Deliberately left.
- **LayoutAnimation**: gated by `animationsAllowed()`; app is on Fabric so no Android `setLayoutAnimationEnabledExperimental` needed (pattern matches 7 other screens).
- **coachMark retire logic**: `started` ref + `suppressed` in the effect deps re-decide correctly on suppression flips; `registerAction` can't fire before storage resolves (visible stays false); dev bypass never advances the counter; unmounted-setState is harmless on React 18. One doc nit: the comment "untouched on toggle-off; re-entry re-decides" — the code actually starts on toggle-off within the same mount (deps include `suppressed`); behavior is reasonable, comment slightly stale.
- **COACH_KEYS reset coverage**: all six keys removed by `resetCoachMarks`; the two raw-string call sites (`'ape:coach:flashcards'`, `'ape:coach:glossary'`) equal their COACH_KEYS values exactly, so reset covers them (cosmetic: they bypass the constant — host files, not edited).
- **screenIntros**: `dashboard` and `awards` ratified copy carries `placeholder: false` ✓; `resetScreenIntros` clears by `ape:intro:` prefix so both are covered regardless of key list.
- **"Certificate can be downloaded" claim** (`study-certs`): conditionally clean — `AwardProgressScreen.tsx:93,203` says "Certificate download needs the next app build" when the native print/share module is absent, but the Help hub itself only reaches users in that same next build, and the QR fix landed (store-readiness handoff §5). No action; worth one owner glance at next-build assembly.

## DEVICE-ONLY ITEMS

- HelpScreen is `presentation: 'modal'` (`RootNavigator.tsx:274`) — per the root-overlays memory, confirm on device that any future root overlay intended to appear over Help actually renders (known modal-screen blind spot class).
- The re-applied pre-fill (fix #1) and the ToolsHub→Help round-trip deserve one on-device pass; the web harness (`#helppreview`) registers only the Help route, so jump buttons no-op there by design (harness limitation, not a bug).
- SR announcement timing of fix #4 (VoiceOver/TalkBack) can only be judged on device.

## FOLLOW-UP (not done — outside editable file list)

- `test/helpContent.test.ts`: add a pin for the new title-match behavior (e.g. `filterHelp('tool')` includes `tools-saved` and `tools-limits`).
