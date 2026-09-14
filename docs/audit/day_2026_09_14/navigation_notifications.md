# Bug hunt — navigation, deep-linking, app boot, notifications (2026-09-14)

Scope: `src/navigation/**`, `src/screens/notifications/**`, `App.tsx` (boot ordering),
notification helpers under `src/features/**`. Method: full read + pure-logic reasoning +
`node --test test/linkPaths.test.ts` (15/15 green). No web-preview device claims are made here.

No code was edited. The one real defect found is an **entitlement** bug at the
navigation boundary, which is report-only per the run's rules.

---

## FIXED
None. (No in-scope correctness bug warranted an edit; the real finding is entitlement — reported, not touched.)

---

## OUT-OF-SCOPE / ENTITLEMENT REPORTS (report-only, do NOT edit here)

### E1 — Deep links bypass the members-only Training-Lab gate  (HIGH)

**Where the paths are claimed:** `src/navigation/linking.ts:66-81` maps deep-link paths
straight to member-only lab screens, e.g.

- `labs/harmonograph` → `HarmonographLab`  (linking.ts:67)
- `labs/harmonic` → `HarmonicLab`  (linking.ts:68)
- `labs/oscillator` → `OscillatorLab`  (linking.ts:69)
- `labs/noise` → `NoiseLab`  (linking.ts:70)
- `labs/eq` → `EqLab`  (linking.ts:71)
- `labs/compression` → `CompressionLab`  (linking.ts:72)
- `labs/reverb` → `ReverbLab`  (linking.ts:73)
- `labs/delay` → `DelayLab`  (linking.ts:74)
- `labs/microphone` → `MicLab`  (linking.ts:75)
- `labs/speaker` → `SpeakerLab`  (linking.ts:76)
- `labs/tubes` → `TubeLab`  (linking.ts:77)
- `labs/digital` → `DigitalLab`  (linking.ts:79)
- `labs/cable-installation` → `CableInstallLab`  (linking.ts:80)
- plus any `labs/:id` handled by `LabCategory` (linking.ts:81)

**Why they are gated content:** `src/screens/lab/labCatalog.ts` marks these
`section: 'training'` (whole section members-only) or `member: true`
(e.g. `MicLab` labCatalog.ts:106, `SpeakerLab` :122, `DigitalLab` :133,
`CableInstallLab` :149; the Dynamics/Time/Modulation/etc. families are all
`section:'training'` :202-356).

**Where the gate actually lives:** `src/screens/lab/EarLabScreen.tsx:57-91`. The membership
gate is driven **by the menu**: `leafLocked()` / `sectionLocked()` compute lock state from
`useEntitlement()`, and tapping a locked row calls `startLabPreview(route, name)`
(EarLabScreen.tsx:85, :91) which arms the root `LabPreviewOverlay` scrim + upgrade sheet
(mounted in `App.tsx:497`).

**The hole:** the lab screens themselves do **not** self-gate on membership. `FxLabScreen.tsx`,
`LabShell.tsx`, `fxLabConfigs.tsx`, and the standalone lab homes carry only
`withAmplitudeOrientation` (the blue→red color-language gate; RootNavigator.tsx:140-184) —
verified there is no `useEntitlement`/`isMember`/`startLabPreview` reference in those files.
So reaching a member-only lab by any path **other than** an EarLab row tap skips
`startLabPreview` entirely, and `LabPreviewOverlay` never arms. Two such paths exist:

1. A `proaudio://labs/compression` (etc.) **custom-scheme** deep link. `linking.enabled`
   is `Platform.OS !== 'web'` (linking.ts:41) and `proaudio://` is in `prefixes` (linking.ts:42);
   the custom scheme needs **no** AASA/domain verification, so this is live on device today.
   (The `https://` App Links are correctly inert until AASA is hosted, but that note does not
   cover the custom scheme.)
2. `pendingLink` resume after sign-in: `AuthScreen.tsx:84-85` and `PaywallScreen.tsx:56-57`
   call `navigateToPath(consumePendingLink())` (linking.ts:109), which `navigate()`s straight
   to the stored lab path with no membership check.

**Net effect:** a non-member who follows/receives a `proaudio://labs/<member-lab>` link — or
who had one parked before signing in as a non-member — lands in the full members-only lab with
no scrim and no upgrade prompt.

**Suggested direction (for the entitlement/commercial owner, not fixed here):** either (a) have
the member-only lab screens self-gate (a shared HOC alongside `withAmplitudeOrientation`, arming
the same preview/upgrade sheet), or (b) route deep links for member-only labs through a gate-aware
entry rather than the raw screen. Option (a) also closes the `pendingLink`-resume path in one place.
Changing which paths `linking.ts` claims is **not** sufficient on its own and would desync the
app.json/AASA/website contract (linkPaths.ts:6-10).

---

## ATTACKED AND CLEAN

- **Deep-link URL parsing / host-spoofing** (`linkPaths.ts`): userinfo `@`-spoof, backslash
  smuggling, `%2f`/`%5c`, control chars, traversal, port/case normalization, oversize input all
  rejected. `isAcceptedLink` re-checks the real authority beyond React Navigation's string-prefix
  match. `test/linkPaths.test.ts` 15/15 green.

- **Deep-link config ↔ route inventory:** every screen named in `linking.ts` config exists in
  `RootNavigator.tsx` / `MainTabs.tsx` / `StudyStack.tsx`, and every param name matches
  `types.ts` (`topicSlug`, `query`, `toolKey`, `category`, `id`). Deep-link targets consume their
  params: `DashboardScreen.tsx:966-985` (`topicSlug`), `PublicGlossaryScreen.tsx:23` (`query`).
  `ToolInfo`'s `tools/:toolKey` and the explicit `tools/multimeter` / `tools/frequency-counter`
  static routes coexist (static wins). Unknown `labs/:id` falls through to `LabCategory`'s own
  "not available" state (documented linking.ts:81). Malformed/unknown links fail the
  `isAcceptedLink` filter and are left to the browser — graceful, no crash.

- **`navigateToPath` uses NAVIGATE, not reset** (linking.ts:114-126) so a resumed destination is
  not thrown away by Splash's cold-start `initialRouteName: 'Splash'`; every caller has a fallback
  (`AuthScreen.tsx:88-93`, `PaywallScreen.tsx:57`).

- **Preview harnesses stay DEV+web-only** (`App.tsx:237-413`): every `#<hash>preview` branch is
  guarded by `__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined'`. None can activate
  on device or in a release build.

- **Boot ordering / effects:** `attachWeeklyConceptPush(open, openLocal)` is wired from
  `App.tsx:141-161`; local-reminder upkeep runs on boot and every foreground with a load-bearing
  `.catch` (App.tsx:167-181); `attachLinkCapture` (App.tsx:190) parks incoming URLs; font-load
  **error** falls through to render with system fonts rather than hanging (App.tsx:229-231).
  Cold-start notification taps are parked (`queueWeeklyConcept`/`queueLocalDest`) and drained in
  `NavigationContainer.onReady` (App.tsx:457-461) — the two drain maps share the one
  `routeLocalDest` so the cold and live paths cannot diverge.

- **Resolved-gate cold-boot cancellation (the memory-flagged regression) is NOT reintroduced.**
  `memberStanding()` is tri-state and starts `'unknown'` (memberStanding.ts:20); the scheduler's
  gate is `memberStanding() !== 'nonmember'` (localSchedule.ts:233), so a cold boot racing the
  entitlement fetch treats a member as a member and re-books. The provider re-runs the sync only
  after `tierKnown` (EntitlementProvider.tsx:428-431) — deliberately `tierKnown`, not `resolved`,
  so a *failed* boot read leaves standing at `'unknown'` instead of writing a definite
  `'nonmember'` (the exact fix documented at EntitlementProvider.tsx:420-427).

- **No duplicate local schedules per boot:** `syncLocalNotifications` sweeps only its own
  `ape.notif.*` identifiers then rebuilds (localSchedule.ts:247-253), guarded by a `syncing`
  re-entrancy flag (:220) and a 5-min foreground throttle (:212-214). Expo WEEKLY weekday math is
  correct (`dayNameToDow()+1`, 0=Sun→1=Sun; localSchedule.ts:471,491 vs the SDK-57 1..7 convention).
  New-terms one-shot persists/re-books to the 1st-of-month and self-expires when `fireAt <= now`
  (:327-362). Notification taps carry the right `dest` and route to Glossary/Awards
  (`App.tsx:113-129`; empty-`dest` reminders like dailyStudy/weeklySummary intentionally just open
  the app — push.ts:186-213).

- **Modal / back-nav:** Settings/Help/About/Paywall/WeeklyConcept/Institutional/ExposureMonitor are
  `presentation:'modal'` and the root overlays (`LowLightDim`, `AppDialogHost`, `MembershipGateHost`)
  are mounted per-screen in `RootNavigator.screenLayout` (RootNavigator.tsx:238-259) — the fix for the
  "overlays invisible on the 7 modal screens" memory item is in place. `WeeklyConcept` has a working
  ✕ → `goBack()` (WeeklyConceptScreen.tsx:57) and its cold-start open uses `navigate` over the
  Splash-preserved stack, so Back lands somewhere sensible.

---

## OBSERVATIONS (low severity, no edit made)

- **O1 — dead code:** `nextOccurrence()` (`src/features/notifications/localSchedule.ts:110-118`)
  is defined but never called (weekly reminders use the Expo `WEEKLY` trigger directly). Harmless;
  safe to delete in a cleanup pass.

- **O2 — self-healing race, not a defect:** if the boot `syncLocalNotificationsThrottled` (standing
  `'unknown'`) is still running when the entitlement resync fires, the `syncing` guard
  (localSchedule.ts:220) drops the resync. For a member this is a no-op (unknown already books). For a
  *downgraded* non-member who still has toggles on, reminders can stay booked until the next
  foreground/settings sync corrects them. Low impact and self-correcting; noting only for completeness.
