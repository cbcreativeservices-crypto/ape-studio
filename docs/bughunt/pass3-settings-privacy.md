# Bug hunt — Pass 3, agent F: settings, account and privacy

**Date:** 2026-09-18 · **Branch:** audio-tools-engine · **HEAD:** 0bbde663
**Axis:** every Settings control, every Profile control, account management, and
every privacy claim the app makes.
**Method:** source reading only. No dev server, no build, no `eas` command, no
git write. No file was edited except this one.

---

## PART 1 — THE SETTINGS TABLE

Every control on `src/screens/settings/SettingsScreen.tsx`, plus the controls that
belong to this axis but live elsewhere (Profile, Exposure Monitor). "Survives
logout?" is a separate column because it is where most of the damage is (F-1).

### NOTIFICATIONS (members only; `!isMember` → upsell)

| Control | What the UI says | What the code does | Survives logout? | Verdict |
|---|---|---|---|---|
| Phone notifications | "Alerts on this device. Required for everything below." | Writes `notification_preferences.push_enabled` (server), reverts the switch on write failure, and mirrors to `setPhoneNotificationsEnabled` → `syncLocalNotifications` cancels/rebooks all 9 local reminders | server ✓ | **OK** |
| Email | "The full weekly concept card, to your account email." | Writes `email_enabled`. Client-side delivery is unverifiable from here (server job) | server ✓ | **UNVERIFIED** — no client proof; needs a server check |
| Weekly concept | "One misunderstood concept a week…" | `setWeeklyConceptPref` + per-category rows; seeds one category ON so the switch does something | server ✓ | **OK** |
| 7 per-category day/time pills | "<Day> · <time>" | `saveCategorySchedule` per category | server ✓ | **OK** |
| Study reminder | "A daily nudge to open the app." | `localSchedule.ts:290` books a DAILY trigger at `notifyTime.notifyDailyStudy` | ✗ **wiped** | OK, but F-1 |
| Come back reminder (+ days stepper) | "After a stretch of days without opening the app." | `:305`, `continueDays` clamped ≥1 | ✗ **wiped** | OK, but F-1 |
| New glossary terms | "Once a month, on the 1st" | `:325`, `nextFirstOfMonth` | ✗ **wiped** | OK, but F-1 |
| Term of the day | "One audio term, every day." | `:369–400`, 7 DATE triggers ahead | ✗ **wiped** | OK, but F-1 |
| Definition of the day | "A definition — you name the term." | `:401`, same batch | ✗ **wiped** | OK, but F-1 |
| Weekly recap | "What you studied this week." | `:458` WEEKLY trigger | ✗ **wiped** | OK, but F-1 |
| Certificate progress | "How close you are to your next certificate." | WEEKLY trigger, same shape | ✗ **wiped** | OK, but F-1 |
| Misunderstood term | "…set straight — daily." | `bookCurated`, 7 days ahead from `MISUNDERSTOOD_TERMS` | ✗ **wiped** | OK, but F-1 |
| Odd term of the day | "A rare or odd audio term…" | `bookCurated`, `ODD_TERMS` | ✗ **wiped** | OK, but F-1 |

### DISPLAY & ACCESSIBILITY

| Control | What the UI says | What the code does | Survives logout? | Verdict |
|---|---|---|---|---|
| Text size, contrast & colour (read-only row) | "These follow your phone's own accessibility settings and **already apply throughout this app** — text here grows with your system text size." | True for RN `<Text>`. **False for `react-native-svg` `<Text>`** — 55 source files, and `react-native-svg@15.15.4` contains zero references to `fontScale` / `allowFontScaling` in either `lib/` or `apple/` | n/a | **WRONG (F-4, confirms pass 2)** |
| Reduce animations | "Turns off motion in the labs and menus." | Writes `reduceAnimations` → `applyA11yFromSettings` → `animationsAllowed()`, honoured at 22 call sites. **11 of 17 `withRepeat` files and 10 of 16 `Animated.loop` files never consult it**, including six Cable-Install lab scenes, the Harmonograph, the Oscillator Lab, the Wave Lab viz, the SPL 3-D gauge, the Tools Hub live previews and all 7 tool-demo cards | ✗ **wiped** | **PARTLY HONOURED (F-3)** |
| Reduce animations (forced-on state) | "Your phone already has reduced motion switched on, so animations are off here regardless." | `osReduceMotionOn()` ORed into `animationsAllowed()`; switch disabled | n/a | OK where consulted; same gap as above |
| Haptic feedback | (no hint) | `hapticsEnabled()` mirror, read at 14 sites (JogWheel, SwitchButton, rack, tuner, SPL, Career Finder…) | ✗ **wiped** | OK, but F-1 / F-2 |

### MICROPHONE & PRIVACY

| Control | What the UI says | What the code does | Survives logout? | Verdict |
|---|---|---|---|---|
| Release mic in the background | "Stops the microphone **the moment you switch away from a measurement tool**, and re-starts it when you return." | `useDspEngine.ts:308–325` wires an `AppState` release **only when the caller passes `stop`**. 8 tools do; **`LiveSpectrumEq.tsx:284` and `SeeingFrequency.tsx:304` call `useToolAutoStart(state, onStart)` with no `stop`** — the setting does nothing on those two live-mic EQ Lab modules. Also fires on `background` only, not on in-app navigation | ✗ **wiped** | **NOT HONOURED EVERYWHERE (F-6)** |
| Contribute anonymized calibration data | "…share your offset and phone model anonymously… Never sends audio, location, or anything that identifies you. Turning this off clears anything queued." | `setCrowdsourceConsent(false)` → `clearContributionQueue()` ✓. `queueContribution` refuses without consent ✓. `catalogClient.uploadQueuedContributions` re-checks consent ✓ and sends no PII ✓ | ✗ **wiped → silently reverts to OFF** | **OK** (copy is accurate); see F-11 for the un-deployed table |

### FEEDBACK & SUPPORT

| Control | What the UI says | What the code does | Verdict |
|---|---|---|---|
| Help & answers | — | Navigates to `Help` (`HELP_HUB_ENABLED = true`) | **Contains a false answer — F-5** |
| Report a bug / Suggest a term / Report a definition error / Suggest a feature | — | `sendFeedback(kind, …, {screen, tier, studentId})` → `mailto:` composer, user reviews and sends. Context block is visible in the body | **OK** |

### MEMBERSHIP / ACCOUNT / HINTS / DELETE

| Control | What the UI says | What the code does | Verdict |
|---|---|---|---|
| Status | ACADEMY — ACTIVE / LAPSED / GUEST — NO ACCOUNT / FREE | Reads `entitlement` once `resolved`. `resolved` flips even when the read **failed** | **LIES OFFLINE — F-2** |
| Redeem access or promo code | "Membership codes apply instantly…" | `redeemAccessCode` → `refreshEntitlement` | OK |
| Student ID | — | `my_identity()` RPC | OK (hidden when `isGuest`, see F-2) |
| App version | — | `Constants.expoConfig?.version` | OK |
| About & credits | — | `About` route. **Carries no Terms or Privacy link** | see F-7 |
| Log out | "You can sign in as a different user afterward." | `signOut()` → `accountLocalSync` wipes every `ape:*` key + the SQLite measurement table | **DESTROYS LOCAL DATA SILENTLY — F-1** |
| Sign in / create account | shown when `resolved && isGuest` | `navigation.reset(Splash)` | wrong row for an offline member — F-2 |
| Replay onboarding hints | "Onboarding hints and the welcome greeting will show again on next open." | Resets `ape:intro:*`, the 6 `COACH_KEYS`, the amplitude orientation and the onboarding flow. **Does not reset `ape:fcFsGuide`, `ape:splFsBright`, `ape:splFsRed` (the `*FsGuide` family the account-wipe code itself classifies as onboarding flags) or `ape:learnIntrosSeen`** | **INCOMPLETE — F-9** |
| Ask about permissions again | "…will ask again next time — including if you had chosen 'always allow.' This does not change what you've allowed in your device Settings." | `resetAskModes()` clears cache + `ape:perm:{camera,location,photo,mic}` and touches no OS grant | **OK — copy is exactly right** |
| DELETE ACCOUNT (hold 5 s → confirm) | "Permanently erases your personal data and signs you out. This cannot be undone." | `delete_my_account` RPC → `signOut` → `clearLocalAccountData()` + `resetAllLocalStores()` | mostly OK; **F-8** (unreachable offline), **F-13** (misleading failure copy) |

### Controls on this axis that are NOT in Settings

| Control | Where it is | Verdict |
|---|---|---|
| Low-Light Production Mode | **Profile** screen (`LowLightRow`, `ProfileScreen.tsx:620`) | the mode's own popup says it is "in Settings" — **F-10** |
| Publish to Pro Registry + 18+ gate | Profile (`onRegistryToggle`) | **OK** — see §18+ below |
| Save exposure history / Export history / exposure warnings | Exposure Monitor tool | latch burn — **F-12**; settings wiped on logout — F-1 |
| Telemetry (Sentry + Aptabase) | **nowhere** — no user control exists | see F-5 |

---

# PART 2 — FINDINGS

---

## F-1 · BLOCKER — Logging out silently destroys everything the app never syncs

**Where:** `src/screens/settings/SettingsScreen.tsx:184–193` (the dialog),
`src/features/account/accountLocalSync.ts:43–46`,
`src/features/account/clearLocalAccountData.ts:93–126`

**What the user does:** taps Log out. The dialog says, in full:

> **Log out?** — "You can sign in as a different user afterward."

They sign back in to **the same account**.

**What happens:** `signOut()` fires `SIGNED_OUT`, `syncLocalToIdentity('')` sees the
identity change from their uid to `''`, and runs the full wipe. Gone, with no
warning and no way back:

- **the saved Measurement Library** — up to `MAX_SAVED = 200` SPL / RTA /
  spectrogram / Rt60 captures. `clearLocalAccountData` calls
  `clearStoredMeasurements()` (`:125`) which does `DELETE FROM measurements`.
  `measurementStore.ts:20–22` states this library is **"DEVICE-LOCAL by design:
  backend frozen; tools tech-spec §7.2 forbids measurement content
  server-side"** — so there is no server copy, ever.
- **all four personal term lists** — bookmarks (`ape:glossaryFavs`), hearts,
  the ★ Custom List, and the "I know this" list (`flaggedStore.ts:35–39`).
  `commercialAuth.ts` pushes favourites to the server **once, at signup**, and
  nothing ever reads them back.
- **every Settings preference** — `ape:settings` is a plain `ape:*` key, not on
  the `KEEP` allowlist: haptics, Reduce animations, mic release, all 9
  notification toggles and all their day/time choices.
- **the hearing-exposure configuration** — `ape:exposure:v1:settings`, which
  holds `refSplAt0Dbfs` and `refCalibrated`, i.e. the user's own calibration of
  the dosimeter, plus the NIOSH/OSHA standard choice. Note `ape:splCalOffset` IS
  on `KEEP` "device mic calibration — hardware (governance R1)"; the exposure
  reference is the same class of value and was missed.
- lab module progress (`ape:labProgress`), Career Finder answers/results, deck
  order, Home cards, glossary history.

**Why this matters more than an account switch:** the wipe was designed for
*"logging in as a DIFFERENT user"* (`clearLocalAccountData.ts:5`). It also fires
on a plain sign-out and sign-back-in, which every user does eventually — after a
password change, after a new phone, or just to check something. The same wipe
runs with no dialog at all in `SingleDeviceGuard.tsx:56–65`: sign in on a second
phone and the first phone erases its measurement library while showing only
*"Your account was signed in on another device."*

**What should happen:** either the Log out dialog names what is about to be
destroyed ("Your saved measurements, term lists and app settings stay on this
phone only and will be erased"), or — better — `ape:settings`,
`ape:exposure:v1:settings` and the four term-list keys join `KEEP`, since none of
them is another user's academic record. The measurement library is the hard case:
it is deliberately un-syncable, so it needs either a KEEP entry keyed on
"same user signing back in" or an explicit warning.

**Confidence:** high. Traced end to end; `KEEP` is six literal strings and none
of these keys is among them.

---

## F-2 · MAJOR — Offline, Settings tells a paying member they have no account, and hides Delete Account

**Where:** `src/screens/settings/SettingsScreen.tsx:100` (`isGuest`), `:640–700`;
`src/features/commercial/EntitlementProvider.tsx:195–202`, `:438–446`

**What the user does:** a signed-in Academy member opens Settings with no network
(plane, lift, dead cell).

**What happens:** `deriveAndApply` returns `false` on every attempt (the read
errors), so `entitlement` stays at its boot default `'anonymous'`. `resolved`,
however, flips in a `.finally()` after the first attempt. Settings gates
everything on `resolved`, so once it flips the member is shown:

- MEMBERSHIP: `GUEST` / **"GUEST — NO ACCOUNT"**
- NOTIFICATIONS: the 🔒 *"…are an Academy member feature"* upsell — selling a
  member their own membership, the exact failure the 2026-09-11 first-paint guard
  was added to prevent
- ACCOUNT: the Student ID row **hidden**, and **"Sign in / create account"**
  where Log out should be (`:673`)
- **the entire DELETE ACCOUNT section hidden** (`:741`, `isGuest ? null : …`)

**Why I believe it:** the provider itself documents the trap it is falling into.
`EntitlementProvider.tsx:195–201`:

> "`resolved` means 'the first attempt finished, first paint may proceed' — it
> flips in a `.finally()` even when the read FAILED. `tierKnown` means 'a read
> actually produced a tier…' Anything that must not act on a guessed tier gates
> on THIS, not on `resolved`. **Internal to the provider on purpose** — the UI
> wants `resolved` so it never hangs."

`tierKnown` is not in the context value (`:456–480` exports `commercialMode,
entitlement, caps, isMember, resolved, …`), so Settings cannot tell "guest" from
"read failed". The bounded retry (`[1500, 4000, 10000] ms`) cannot help while
offline — all four attempts fail.

**Consequences beyond the wrong label:** account deletion is a store requirement
and a legal one; it must not vanish because a network read failed. Tapping "Sign
in / create account" resets to Splash, which routes `session ? Main : Auth` and
bounces straight back — so an offline member also has no working way to log out.

**What should happen:** expose a third state to the UI (`tierKnown`, or an
`entitlementUnknown` flag) and render ACCOUNT + DELETE ACCOUNT from *session
presence*, not from tier. Whether someone has an account is a `getSession()`
question, not an entitlements-table question.

**Confidence:** high on the code path. Note this is the *failed-read* case, which
is distinct from the pass-2 first-paint fix — the pass-2 fix is what put the
`resolved &&` guard here in the first place.

---

## F-3 · MAJOR — "Reduce animations" leaves the labs and the Tools Hub animating

**Where:** `SettingsScreen.tsx:534` (the copy), `src/features/settings/a11y.ts:75`

**The exact string:** "Turns off motion **in the labs and menus**."

**What happens:** `animationsAllowed()` is consulted at 22 call sites, but the
continuous, repeating motion — the kind reduce-motion exists for — largely
ignores it. Counted across `src/`:

- **11 of 17** files using Reanimated `withRepeat` never reference
  `animationsAllowed` / `reduceMotion`: `cableinstall/scenes/{Ceiling,Fire,Inspect,Rack,Walls,Why}Scene.tsx`,
  `HarmonographMachine.tsx`, `micspeaker/MicCutaway.tsx`, `OscillatorLabScreen.tsx`,
  `wave/vizWave.tsx`, `tools/Spl3dGauge.tsx`. Spot-checked, they are infinite:
  `OscillatorLabScreen.tsx:423` `withRepeat(withTiming(…), -1, false)`,
  `MicCutaway.tsx:66–67`, `Spl3dGauge.tsx:438/475/476`, `vizWave.tsx:1268`.
- **10 of 16** files using `Animated.loop` likewise, including
  `screens/tools/hubPreviewsSim.tsx:150,237` (the Tools Hub's live tile
  previews — the "menus" the copy names) and all seven
  `components/tooldemos/*Demo.tsx` cards.

Because `animationsAllowed()` is also where the **OS** reduce-motion setting is
ORed in (`a11y.ts:76`), a user who has switched reduced motion on for their whole
phone still gets every one of these loops.

**What should happen:** either the copy narrows to what is true, or these loops
gate. The Cable-Install scenes and the SPL 3-D gauge are the highest-value fixes
(full-screen, continuous).

**Confidence:** high on the counts (mechanical grep of `src/`). Moderate that
every one of the 21 files is user-visible continuous motion — I spot-checked six.

---

## F-4 · MAJOR — "already apply throughout this app" is false for ~55 files of meters and diagrams (confirms pass 2)

**Where:** `SettingsScreen.tsx:527–530`

**The exact string:** "These follow your phone's own accessibility settings and
**already apply throughout this app** — text here grows with your system text
size."

**Verified, with the evidence pass 2 did not have:**

```
$ grep -rn "getFontScale|allowFontScaling|fontScale" node_modules/react-native-svg/lib/   → 0 hits
$ grep -rni "fontscale|contentSizeCategory|preferredFont" node_modules/react-native-svg/apple/ → 0 hits
```

`react-native-svg@15.15.4` (package.json:57) has no font-scale handling anywhere
in its JS output or its Apple native sources. SVG `fontSize` is a user-space
unit rendered directly. **55 files** in `src/` import a `Text` from
`react-native-svg` — the meter scales, axis labels, frequency callouts and lab
diagram annotations. Those do not grow. Nothing in the app sets
`allowFontScaling={false}` (the only hit is the comment at `:508`), so ordinary
`<Text>` *is* fine.

This row exists specifically because the owner removed working in-app font-size
chips on the argument that the OS already did the job (`store.ts:8–14`). The
argument is right for prose and wrong for exactly the screens where a small label
matters most.

**What should happen:** the copy should say the app's text follows the phone's
setting *and* that meter and diagram labels are drawn at a fixed size. The real
fix (multiplying SVG `fontSize` by `PixelRatio.getFontScale()`) is a large
mechanical change, not a launch-week one.

**Confidence:** high.

---

## F-5 · MAJOR — The in-app Help contradicts the app on account deletion, and its privacy answer omits telemetry

**Where:** `src/features/help/helpContent.ts:237–240` and `:223–225`
(`HELP_HUB_ENABLED = true`, `:17`; reachable from Settings → "Help & answers")

**(a) "How do I delete my account?"** answers:

> "Email us — the ASK A QUESTION button at the bottom of the full manual opens a
> pre-addressed message — and we will delete your account and its data."

The app has had a self-service Delete Account in Settings since 2026-07-25. This
answer sends the user on a support round-trip for something that is two taps
away, and it is precisely the pattern Apple Guideline 5.1.1(v) rejects — a
reviewer who opens Help before Settings reads it as "this app has no in-app
deletion". Fix: point at Settings → DELETE ACCOUNT.

**(b) "What does the app send off my phone?"** answers:

> "Your account's study progress and enrollments sync so they survive a new
> phone. Audio from the tools is never uploaded, and saved measurements stay on
> the device."

All true, and incomplete. `src/config/telemetry.ts:18` has `TELEMETRY_ENABLED =
true`, and `src/features/telemetry/telemetry.ts` boots **Sentry** (crash events,
50 breadcrumbs, auto session tracking) and **Aptabase** (screen views + 6 product
events) on every launch. There is **no user-facing telemetry control anywhere in
the app** — I searched Settings, Profile and About. That is a defensible design
(both SDKs are anonymous; see F-14, they check out), but the one screen that
answers "what leaves my phone" must not omit it. As written it reads as a denial.

**Severity note:** I have marked (a) MAJOR rather than BLOCKER because the real
control does exist — the harm is the wrong instruction and the store-review
signal.

**Confidence:** high.

---

## F-6 · MAJOR — "Release mic in the background" does nothing on the two EQ Lab live-mic modules

**Where:** `src/features/tools/engine/useDspEngine.ts:309` (`if (!stop) return
undefined;`), `src/screens/lab/eq/modules/LiveSpectrumEq.tsx:284`,
`src/screens/lab/eq/modules/SeeingFrequency.tsx:304`

**The exact string:** "Stops the microphone **the moment you switch away from a
measurement tool**, and re-starts it when you return."

The AppState release/resume pair is wired inside `useToolAutoStart`, and only when
the caller passes a `stop` function. Eight screens do — FrequencyCounter, Rt60,
Rta, Spectrogram, SplMeter, Waveform, MultiMeter, ToolInfo. **Two do not:**

```
LiveSpectrumEq.tsx:284   useToolAutoStart(state, onStart);
SeeingFrequency.tsx:304  useToolAutoStart(state, onStart);
```

Both hold a live `useDspEngine` capture (`:265` / `:288`, `{ bands: true }`) and
both define an `onStop` that closes over `stop` — the argument was simply not
passed. On those two EQ Lab modules the setting is inert in both positions.

**Scope, honestly:** `app.json` declares no `UIBackgroundModes`, so iOS suspends
the app and Android 11+ cuts background mic access — so this is unlikely to be a
literal hot mic. What is certainly wrong is that the app states a privacy
behaviour ("stops the microphone the moment you switch away") that two of its ten
live-mic surfaces do not implement, and that on return those two get no resume
either. The fix is one argument per call site.

**Secondary copy point:** "the moment you switch away from a measurement tool"
reads as *in-app navigation*; the handler only fires on `AppState === 'background'`.
Unmount teardown is `useDspEngine`'s, so the outcome is right, but the sentence
describes a different trigger than the one it has.

**Confidence:** high on the missing argument. Moderate on the real-world
background-capture impact, which the OS also constrains — a device test on
Android 10 would settle it.

---

## F-7 · MAJOR — Terms and Privacy Policy are reachable only from the Paywall

**Where:** `src/screens/commercial/PaywallScreen.tsx:278–390` — the only
`openPolicy` / policy link in `src/`.

A grep of the whole tree for `proaudiotrainingacademy.com/(privacy|terms)`,
`openPolicy`, and policy-link markup returns hits in exactly one file. Settings
has no Privacy Policy row; `AboutScreen.tsx` has no `Linking` call at all.

So: a free user, a guest, and any member who never re-opens the paywall cannot
read the privacy policy or the terms from inside the app. For an app that runs
analytics and crash reporting and operates a public Registry listing, and that is
days from a store submission, that is a gap a reviewer opens Settings to check.

**What should happen:** a Privacy Policy / Terms pair in Settings (ACCOUNT or
FEEDBACK & SUPPORT) or on the About screen, reusing `openPolicy`.

**Confidence:** high on the grep. I have not checked what the store listing
metadata already declares — that may cover the submission, but not the in-app
requirement.

---

## F-8 · MAJOR — Low-Light's one permitted popup sends the user to a switch that is not there

**Where:** `src/features/settings/LowLightLayer.tsx:127–129` (gate copy), `:73`
(accessibility hint), `:7` + `ProfileScreen.tsx:620` (the row's real home)

**The exact string, in the one popup this mode is allowed to show:**

> "You can cancel it at any time: tap the screen quickly six times in a row. You
> can also turn it off **from this switch in Settings**."

and the row's own `accessibilityHint`: "Tap the screen quickly six times to
cancel it."

`LowLightRow` is rendered in exactly one place — `ProfileScreen.tsx:620`, at the
top of Profile. `SettingsScreen.tsx` neither imports nor renders it; a grep for
`LowLightRow` returns Profile and the component file, nothing else. So the user
is in a 50 %-dimmed, red-washed app where nothing else may appear on screen, and
the instructions send them to the wrong screen. The 6-tap escape still works, so
this is not a lock-out — but this popup is the *only* explanation the mode ever
gives, and half of it is wrong.

**Second, larger problem in the same two sentences:** the gate says

> "While this mode is on, no pop-ups, **notifications**, intros, or other screens
> will appear anywhere in the app."

Nothing in `src/features/notifications/` references low-light — a grep for
`lowLight|LowLight` across that directory returns nothing. The nine local
reminders scheduled through `expo-notifications` are OS-level and will fire,
banner and sound, during a show. This is the mode's core promise and it is not
kept for the one category of interruption the user cannot dismiss from inside the
app.

**What should happen:** either point the copy at Profile (one-word fix), or move
the row into Settings' DISPLAY & ACCESSIBILITY section — and either drop
"notifications" from the claim or have `setLowLight(true)` suspend the local
schedule.

**Confidence:** high on both.

---

## F-9 · MINOR — "Replay onboarding hints" misses the full-screen guides it elsewhere calls onboarding flags

**Where:** `SettingsScreen.tsx:707–720`; `clearLocalAccountData.ts:83–85`

The reset promises "Onboarding hints and the welcome greeting will show again on
next open" and runs `resetCoachMarks()` (all six `COACH_KEYS` — verified complete
against the six `useCoachMark` call sites), `resetScreenIntros()` (sweeps
`ape:intro:*`), `resetAmplitudeOrientation()` and `resetOnboarding()`.

It does **not** clear:

- `ape:fcFsGuide` (`FlashcardsScreen.tsx:1143,1162`), `ape:splFsBright`,
  `ape:splFsRed` — the `*FsGuide` fullscreen-guide counters, which
  `clearLocalAccountData.ts:84` explicitly classifies as onboarding flags
  (`k.endsWith('FsGuide')`) and preserves through an account wipe *because*
  "Settings → 'Reset onboarding hints' is the intended way to replay them"
  (`:81`). The comment names this control as the mechanism; the control does not
  implement it.
- `ape:learnIntrosSeen` (`DashboardScreen.tsx:691,1156`) — the per-course and
  per-topic intro sheets. Conversely, that key is *not* matched by
  `isOnboardingFlag`, so it is wiped on every account switch and replays there.

**Confidence:** high.

---

## F-10 · MINOR — A withdrawn advisory hearing warning is burned, not held (the pass-2 fix covered only the critical pair)

**Where:** `src/features/audio/exposureMonitor.ts:467–475`;
`src/features/audio/ExposureCheckin.tsx:101–104`

Pass 2 fixed the once-a-day dose warnings so the latch is held when overlays are
suppressed (`:493`, `if (settings.criticalWarnings && !areOverlaysSuppressed())`).
The **advisory** warning — sustained ≥ 88 dBA for five minutes, once per session
— was not given the same treatment:

```ts
if (settings.advisoryWarnings && !advisoryFiredThisSession && elevatedSec >= 300) {
  advisoryFiredThisSession = true;   // latch set…
  d.warnings += 1;
  emitCheckin('advisory');           // …then emitted
}
```

and the receiver drops it two ways:

```ts
if (areOverlaysSuppressed()) return;                                  // low-light
if ((kind === 'routine' || kind === 'advisory') && !onAudioScreen()) return;
```

So the advisory is silently consumed for the whole session if (a) Low-Light
Production Mode is on — the live-show mode, where sustained 88 dBA is most likely
— or (b) the user is not on one of the 52 `AUDIO_ROUTES` at that exact second,
which is easy: leave a lab tone running and open the Dashboard. Either way the
warning never fires again this session.

`d.warnings += 1` also increments for warnings the user never saw, so the
exposure history over-reports. The same is true of `d.checkins += 1` for routine
check-ins, though those re-fire on the next interval so nothing is lost there.

**What should happen:** hoist `!areOverlaysSuppressed()` to gate the advisory
emit the way it gates the critical pair, and set `advisoryFiredThisSession` only
once the overlay has actually shown.

**Confidence:** high on the code path.

---

## F-11 · MINOR — `authStorage.removeItem` leaves the session in plaintext AsyncStorage, and nothing ever sweeps it

**Where:** `src/lib/authStorage.native.ts:111–118`, `:94–110`;
`clearLocalAccountData.ts:88–90`

Confirming and extending the pass-2 finding. When SecureStore **is** present:

```ts
async removeItem(key) {
  if (!SecureStore) return AsyncStorage.removeItem(key);
  try { await secureRemove(SecureStore, key); }
  catch { await AsyncStorage.removeItem(key); }
}
```

the AsyncStorage branch is only reached when the keychain *throws*. Any session
that ever landed in the AsyncStorage fallback — written by `setItem`'s `catch`,
or by a build that shipped before the native module — is never deleted on sign
out. And it is never swept afterwards either: `clearLocalAccountData` is scoped
to `ape:*` and its docblock states it "leaves the Supabase `sb-*` auth session
and any other library keys alone" (`:89`). So a **refresh token in plaintext**
can outlive sign-out, account switch, and delete-account, on the same disk the
security rationale at the top of that file exists to keep it off.

The documented "auto-upgrades to the keychain once the client is rebuilt"
(`:14–15`) is also not an upgrade: `getItem` on an upgraded client reads the
keychain, finds nothing, and the user is signed out — the stale value is neither
migrated nor removed.

**What should happen:** make every branch of `removeItem` clear both stores, and
have `getItem` migrate-then-delete when it finds a value only in AsyncStorage.

**Confidence:** high on the code. Moderate on how many devices are actually
carrying such a value — it needs a build that predates `expo-secure-store`, or a
keychain write that threw. `supabase.ts:30–35` gates auto-refresh on foreground,
which makes the locked-device keychain failure unlikely.

---

## F-12 · MINOR — Signup can race the wipe that is supposed to preserve the guest's favourites

**Where:** `src/features/commercial/commercialAuth.ts:47–56`;
`accountLocalSync.ts:64–77`

```ts
const sessionErr = await ensureSession(email.trim(), password);   // fires SIGNED_IN
…
const migration = await collectFavoritesMigration();              // reads ape:glossaryFavs
```

`ensureSession` produces the `SIGNED_IN` event, which `useAccountLocalSync`
answers with `void syncLocalToIdentity(uid)` — an unawaited async chain that ends
in `AsyncStorage.multiRemove` over every `ape:*` key, `ape:glossaryFavs`
included. `collectFavoritesMigration()` starts on the next line and reads the same
key. Whether the read or the removal wins is a genuine race between two floating
promise chains (the wipe is two awaits deep, the read one), with no ordering
guarantee either way.

When the wipe wins, `register_commercial_user` is called with an empty
`p_favorites` and the guest's starred glossary terms are gone — which is the one
piece of guest state the signup path explicitly tries to carry forward.

**What should happen:** collect the migration *before* `ensureSession`, or have
`syncLocalToIdentity` expose a promise the signup path can await.

**Confidence:** moderate on which side wins in practice; high that there is no
ordering guarantee. A device test (star a term as a guest, create an account,
check the favourites survive) would settle it in a minute.

---

## F-13 · MINOR — Delete Account can report failure after the account is already gone

**Where:** `src/features/settings/DeleteAccountButton.tsx:71–89`

Already logged as D-7 in `docs/audit/waveD_auth-session.md:54–57` and still
present. The RPC, the sign-out and both local wipes share one `try`, so anything
that throws *after* `delete_my_account` succeeded surfaces as:

> "Could not delete account — Something went wrong. Please check your connection
> and try again."

The account is gone; the user is told it is not, is still signed in against a
dead session, and will retry against a row that no longer exists. I traced the
realistic throw sites: `clearLocalAccountData` is fully guarded internally and
`clearStoredMeasurements` swallows its own error (`measurementStore.ts:248–252`),
so the only live candidate is `supabase.auth.signOut()` rejecting. Low
probability, high confusion. One `try` around the RPC and a second around the
cleanup, with "deleted — cleanup incomplete" copy, fixes it.

**Confidence:** high on the code, low on frequency.

---

## F-14 · Also checked — no finding

These I traced and could not fault. Recording them so the next pass does not
repeat the work.

- **Telemetry payloads.** All six `trackEvent` call sites carry enum-shaped
  props only: `exam_start {award}`, `exam_finish {passed, offline}`,
  `quiz_start {practice}`, `quiz_finish {outcome, offline}`,
  `study_area_explore {area: analyticsKey(area), options}`, and
  `trackScreen` sends the **route name** with no params
  (`App.tsx:211`). `sanitizeProps` (`scrub.ts:42–58`) refuses rather than
  truncates: `VALUE_RE` excludes `@`, `/` and quotes, caps at 48 chars and 10
  props. `scrubEvent` deletes `user` and `request`; `scrubBreadcrumb` drops
  console breadcrumbs and strips query strings. `Sentry.init` pins
  `sendDefaultPii:false`, no replay, no tracing, no screenshots. **One residual
  gap worth a note rather than a finding:** `scrubEvent` does not touch
  `exception.values[].value` or `message`, so a thrown error whose *text*
  contains user input would pass. Nothing in the app currently throws such an
  error that I found, but `captureError` at `RootErrorBoundary.tsx:56` catches
  arbitrary render errors.
- **"The contact email is device-local and never collected."** True.
  `publicProfile.ts` holds `email` in `ape:publicProfile` and never sends it:
  `setRegistryVisible` (`:186–200`) transmits only `bio`, `interests`,
  `primaryInterest`, `adult` and `policyVersion`, with the comment "never the
  email"; `queueListingSync` signs only the three published fields, so a
  keystroke in the email box cannot republish. `ProfileScreen.tsx:935` lists
  "· Your email address" under what is *not* published, and `:952` is honest
  that no contact button exists yet. `emailValid` is not a listing gate
  (`:334`). Clean.
- **The 18+ attestation.** `ProfileScreen.tsx:426–440`. Asked once per account,
  only on the way ON, before the publish consent. `isAdultConfirmed()` is a
  module-level mirror set from the server's `registry_adult_confirmed`
  (`publicProfile.ts:109`), reset by `resetLocal()` on every account wipe
  (registered in `resetAllLocalStores`), and defaults **false** when the listing
  read fails — so it fails closed and re-asks. `setRegistryListing` sends
  `p_adult: input.adult ?? false`. The copy is careful not to overclaim: it says
  the listing is adults-only and that everything else works at any age, and it
  never says the age is verified. Accurate for an attestation.
- **"A guest is wiped 100% clean."** `AuthScreen.tsx:169`
  `clearLocalAccountData({ total: true })` removes every `ape:*` key including
  the onboarding/coach flags and the exam queue; the two survivors it re-writes
  (`ape:careerfinder:v1`, `ape:localUserId`) are both documented, and
  `ape:splCalOffset` / `ape:deviceId` are hardware and install identity, not
  user memory. `resetAllLocalStores()` clears the in-memory mirrors, including
  the sound-safety acknowledgement and the celebration set. Matches the claim.
- **"Ask about permissions again."** `permissionStore.ts:53–62` clears the cache
  and all four `ape:perm:*` keys and touches no OS grant — the copy says exactly
  that, including the "always allow" case.
- **The crowdsource consent copy.** Revoking clears the queue
  (`deviceProfile.ts:203–210`), nothing is stored without consent (`:216–217`),
  and upload re-checks consent server-side of the decision
  (`catalogClient.ts:43`). The payload is platform/model/os-build/offset — no
  account, no audio, no geo. **Caveat, not a finding:** the target table's SQL
  lives at `docs/MIC_CATALOG_2026_08_21.sql` and `supabase/migrations/` contains
  only `2026091801_paid_month_before_credential.sql`, so the table may not be
  deployed. `uploadQueuedContributions` fails silently and keeps the queue, so
  nothing breaks — but "so other owners of your phone start closer to accurate"
  would be describing something that never happens. Needs a live DB check.
- **Notification wiring.** All nine device-local reminders are read and booked by
  `localSchedule.ts` (`:290, :305, :325, :369, :382, :401, :456–457, :458`, plus
  the weekly pair), the master switch really does cancel them
  (`setPhoneNotificationsEnabled` → `syncLocalNotifications`), the member gate is
  enforced independently (`memberStanding()` at `:184, :233`), and `setPref`
  reverts both the switch and the scheduler mirror on a failed write.
- **`Toggle`.** `disabled` blocks press and announces `accessibilityState
  {checked, disabled}` plus the web `aria-*` fallbacks; every Settings row passes
  a `label`. The `groupOff` `pointerEvents:'none'` block is backed by real
  `disabled` props on each switch, so switch-control access cannot beat it.
- **The certificate export.** `certificatePdf.ts` is honestly gated
  (`isAvailable()` + typed `needs_build` / `no_share_target` reasons) and hands
  the PDF to the OS share sheet — nothing is uploaded. The document carries the
  server `registry_name` and the QR token. That the printed ID *is* the registry
  token is already on the brief's KNOWN list; the one thing I would add is that
  the token is embedded even for a user who has never published a listing, so
  sharing the PDF hands over a permanent verification URL with no disclosure at
  the export button. What `public_verify_by_token` returns for an unlisted
  account needs a live DB check before anyone acts on that.

---

## Two small notes, below finding threshold

- `src/features/settings/a11y.ts` maintains a `listeners` Set and its docblock
  promises "a subscription so React components re-render the moment it changes"
  — but the module **exports no subscribe function**, so the set is permanently
  empty and every `listeners.forEach` is a no-op. Consequence: flipping "Reduce
  animations" takes effect on each screen's next render, not immediately. Dead
  code plus an inaccurate docblock rather than a user-visible bug.
- `loadLocalSettings()` has exactly one non-Settings caller —
  `EntitlementProvider.tsx:448`, behind `if (!tierKnown) return`. For the offline
  member of F-2, `tierKnown` never becomes true, so the synchronous mirrors
  (`hapticsEnabled`, `micReleaseOnBackgroundEnabled`, `a11y().reduceAnimations`)
  stay at their defaults for the whole app run unless the user opens Settings.
  A user who turned haptics off gets them back; a user who turned reduce-motion
  on does not get it. Self-healing and narrow, but it is the same root cause as
  F-2 and would be fixed by the same change.

---

## Coverage

**Read in full:** `SettingsScreen.tsx`, `settings/store.ts`, `settings/a11y.ts`,
`settings/lowLight.ts`, `settings/LowLightLayer.tsx`, `DeleteAccountButton.tsx`,
`clearLocalAccountData.ts`, `accountLocalSync.ts`, `SingleDeviceGuard.tsx`,
`authStorage.native.ts`, `authStorage.ts`, `supabase.ts`, `config/telemetry.ts`,
`telemetry/telemetry.ts`, `telemetry/scrub.ts`, `permissionStore.ts`,
`lib/feedback.ts`, `components/Toggle.tsx`, `certificatePdf.ts`,
`popupSuppressStore.ts`, `commercialAuth.ts`, `profile/publicProfile.ts`.
**Read in part:** `ProfileScreen.tsx` (registry, age gate, email, export),
`EntitlementProvider.tsx` (derive/retry/resolved), `exposureMonitor.ts` +
`ExposureCheckin.tsx`, `localSchedule.ts`, `useDspEngine.ts`, `helpContent.ts`,
`PaywallScreen.tsx`, `AuthScreen.tsx` (guest + signup), `deviceProfile.ts`,
`catalogClient.ts`, `measurementStore.ts`, `flaggedStore.ts`, `coachMark.ts`,
`screenIntros.ts`, `onboardingFlow.ts`.

**Not covered on this axis** (someone else's, or out of budget): the purchase and
restore flow itself, the Community Directory's contact/block/report path, the
notification *content* pipeline, and anything server-side — `delete_my_account`,
`set_registry_listing`, `public_verify_by_token` and the mic-catalog table were
all read from docs and call sites, never from the live database.

**Nothing was found** wrong with: the permission-prompt reset, the 18+ gate's
logic, the crowdsource consent contract, the telemetry prop whitelist, the
`Toggle` component's accessibility, or the notification scheduler's honouring of
its nine toggles.
