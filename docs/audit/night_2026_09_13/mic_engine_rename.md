# EngineGate recovery · mic-permission UX audit · "MultiMeter" rename options — night 2026-09-13

Build agent scope: EDIT only `src/screens/tools/EngineGate.tsx`, `src/features/permissions/**`, `src/screens/tools/ToolInfoScreen.tsx`. FrequencyCounterScreen / CenterLockTuner / tuner/** owned by another session — findings there are file:line reports only.

Verification: `npx tsc --noEmit` — the only error is `src/data/v3Curriculum.ts:118`, a file another session has mid-edit in the working tree (it is that session's audit target); none of the files touched here produce errors. `npm test` — 1147 pass / 0 fail. Actual OS permission-dialog behavior is a **device-pass item**, not claimed.

---

## 1. FIXED — EngineGate now offers honest recovery (error_triad.md stranding item)

`src/screens/tools/EngineGate.tsx` (rewritten):

- New optional prop `onRetry?: () => void` (the host's engine `start()`).
- **'error' card**: renders a real **TRY AGAIN** GlassButton (gold, matching the tools idiom — WaveformScreen already uses a GlassButton for exactly this) when `onRetry` is passed. Copy adapts: with the key it says "Tap TRY AGAIN…"; without it the old lie ("Try again" with no control) is replaced by the honest path "Go back and re-open this tool to try again…".
- **'denied' card** — platform-correct, self-contained:
  - **OPEN SETTINGS** (steel) always renders, via `Linking.openSettings()` — needs no host wiring, so every existing `<EngineGate state=… />` call site gains it immediately (SplMeter, Rta, Rt60, MultiMeter, Waveform, Spectrogram, FrequencyCounter, HarmonicsView, EQ modules).
  - **ALLOW MICROPHONE** (re-request) renders on **Android only** and only with `onRetry`: Android re-shows the OS dialog on a plain re-request unless the user picked "Don't ask again" (then the request resolves denied instantly and Settings remains, as the copy says). iOS asks exactly once ever, so no re-request key is offered there — Settings is the only honest path.
- Retry is safe by construction: `start()` in `useDspEngine` (src/features/tools/engine/useDspEngine.ts:102-104) only refuses 'absent'/'spike', so calling it from 'error' or 'denied' re-runs the permission check + capture start cleanly.

### Host wiring still needed (out of my edit scope — one-line diffs)

The 'error' TRY AGAIN key only appears where the host passes `onRetry`. Each is `<EngineGate state={state} lastError={lastError} onRetry={() => void start()} />`:

| File | Line | Note |
|---|---|---|
| src/screens/tools/SplMeterScreen.tsx | 1359 and 1664 (Full-VU overlay) | the audit's named stranding host |
| src/screens/tools/FrequencyCounterScreen.tsx | 595 | **FORBIDDEN file — owning session must wire it** |
| src/screens/tools/MultiMeterScreen.tsx | 1169 | |
| src/screens/tools/RtaScreen.tsx | 1208 | |
| src/screens/tools/Rt60Screen.tsx | 416 | |
| src/screens/tools/SpectrogramScreen.tsx | 465 | |
| src/screens/tools/WaveformScreen.tsx | 548 | already has its own external TRY AGAIN at :549-551 — when wiring `onRetry`, delete that block or skip wiring here (two retry keys otherwise) |
| src/screens/lab/HarmonicsView.tsx | 1917 | renders the gate for denied/error in LIVE mode |
| src/screens/lab/eq/modules/LiveSpectrumEq.tsx :420, SeeingFrequency.tsx :367 | | same pattern |

Lab shells that pass only absent/spike (`gate`) need nothing.

**Device-pass items**: (a) Android denied → ALLOW MICROPHONE re-shows the OS dialog; after "Don't ask again" it stays denied and OPEN SETTINGS lands on the app page; (b) iOS denied → OPEN SETTINGS lands on the app's settings; (c) error → TRY AGAIN restarts capture (once hosts wire it).

---

## 2. AUDIT — mic-permission UX (Apple 5.1.1(ii) / Play prominent disclosure)

### (a) Requested on first measurement use, never at app launch — HOLDS, with one nuance

- The ONLY mic-permission request paths: Android `PermissionsAndroid.request(RECORD_AUDIO)` inside `ensureMicPermission` (src/features/tools/engine/useDspEngine.ts:34-45), called from `start()` at :120; iOS prompts natively inside the ape-dsp module on first capture start. `micSession.ts` never prompts (documented, src/features/tools/engine/micSession.ts:25-26).
- Nothing at launch: `ApeDsp.start()` callers are only micSession:116 and DspDebugScreen:56 (dev screen). SplashScreen / RootNavigator / App bootstrap contain no engine start. Grep for RECORD_AUDIO confirms no other requester.
- **Nuance**: the first OS mic dialog fires on first open of the **Tools & Analysis hub**, not of an individual tool — the hub auto-starts capture for its live tile previews by explicit owner exemption (src/screens/tools/hubPreviewEngine.ts:1-23, auto-start at :206-210). Still user-initiated, in a measurement context, and never at launch; denied never re-prompts in a loop (:20-22, start fires only from 'idle'). Reviewer-facing this is acceptable, but the consent context is "opened the tools menu", which is weaker than "started a meter" — see (c).
- Onboarding sampler explicitly does NOT suppress or trigger permission surfaces (src/features/intro/onboardingSampling.ts:8-10).

### (b) Every non-mic feature works with mic denied — HOLDS

- Denial is fully contained in the tools engine: `ensureMicPermission` false → state 'denied' → EngineGate card (useDspEngine.ts:120-122); no throw escapes, no global flag is set.
- Hub with mic denied: previews rest on static artwork, tiles stay interactive (hubPreviewEngine.ts:20-22, 201-205).
- Study/calculators/references/demos never import useDspEngine/micSession: the only mic consumers are the tools screens, the hub, HarmonicsView LIVE mode and the two EQ live modules (grep of `useDspEngine` — 34 files, all tools/labs; the lab shells use output-only `ApeDsp.gen*`, no capture). Tool DEMOs are scripted visuals (no engine). GlossaryDictation uses the separate speech-recognition permission, requested at feature use with its own try/catch (src/screens/glossary/GlossaryDictation.tsx:65).

### (c) In-app pre-permission explainer before the OS dialog — GAP (partially closed here)

- The PermissionPrompt/ask-mode machinery covers **camera, location, photo only** — there was NO 'mic' capability (src/features/permissions/permissionStore.ts:23 before this change), and no call site runs any in-app explainer before the OS mic dialog. First mic ask = raw OS dialog on hub open.
- Honest-copy disclosure DOES exist nearby but not pre-dialog: ToolInfoScreen's PHONE-MICROPHONE LIMITS (src/screens/tools/ToolInfoScreen.tsx:188-189) and the app.json permission strings (recently reviewed, out of subject).
- **Done in scope**: added `'mic'` to `CapabilityKey` + `resetAskModes` (src/features/permissions/permissionStore.ts:23,54) and authored the honest pre-permission copy (src/features/permissions/PermissionPrompt.tsx COPY.mic — "analyzed on your device and immediately discarded — nothing is recorded, stored, or uploaded… runs only while a live tool is open"), consistent with the on-device-only claims in app.json and the tools' honesty copy. Settings' "Reset permission prompts" now clears it too.
- **Out of scope (report)**: wiring. The OS dialog is triggered from `useDspEngine.start()` (Android :119-123) and natively by the module on iOS — both outside my edit scope. Recommended wiring: gate the FIRST-ever engine start through `usePermissionFlow('mic', …)` at the two entry owners — hubPreviewEngine's auto-start (hubPreviewEngine.ts:206-210) and useDspEngine.start for the direct-entry tools (multimeter/hzcounter deep links, linkPaths.ts:31). Note iOS has no JS mic-request API in the current dep set — the flow's `osRequest` would be the capture start itself, so on iOS the explainer simply precedes the start that prompts. NOT wired into ToolInfoScreen deliberately: the hub has almost always already triggered the OS dialog before ToolInfo mounts, so a prompt there would be dead weight on the common path.

---

## 3. REPORT ONLY — the "multimeter" rename (no strings changed)

### Every user-visible occurrence

| Where | File:line | Exact string |
|---|---|---|
| Catalog name (hub tile title, library, concept-module related-tool link → ToolInfo header) | src/screens/tools/toolsData.ts:203 | `name: 'Pro Audio MultiMeter'` |
| Catalog subtitle | src/screens/tools/toolsData.ts:204 | `subtitle: 'All-In-One Live Meter · Mono'` |
| Live screen title | src/screens/tools/MultiMeterScreen.tsx:1056 | `PRO AUDIO MULTIMETER` |
| Saved snapshot title (persists into the Measurement Library rows) | src/screens/tools/MultiMeterScreen.tsx:901 | `` `MultiMeter snapshot — LCF ${…} dBC` `` |
| Hub tile screen-reader label | src/screens/tools/ToolsHubScreen.tsx:291 | `'Pro audio multimeter: combined level bar, spectrum, spectrogram and oscilloscope'` |
| Help-sheet tool name | src/features/lab/guidedLessons/toolHelp.tsx:241 | `name: 'Pro Audio MultiMeter'` |
| Deep-link URL (user-visible in links/App Links) | src/navigation/linking.ts:61 (`'tools/multimeter'`), src/navigation/linkPaths.ts:31 | `tools/multimeter` |
| Store metadata | — | Nothing in-repo: `web/` has zero matches; store listing text lives outside the repo. If any store screenshot or feature bullet names "MultiMeter", it should follow the owner's chosen name. |
| NOT the tool — leave alone | src/features/notifications/curated/oddTerms.json:680,2404 | genuinely about electrical multimeters (curriculum content, correct usage) |

Internal identifiers that must NOT change regardless of rename: ToolKey `'multimeter'`, payload kind `'multimeter_snapshot'` and `tool_type: 'multimeter'` (persisted/telemetry — src/features/tools/measure/types.ts:204, MultiMeterScreen.tsx:899), file names, deep-link key if link stability matters (see Option B tradeoff).

### Three options (owner decides copy)

**A. Keep "Pro Audio MultiMeter", sharpen the subtitle** — smallest change.
- toolsData.ts:204 → `subtitle: 'Combined Level · Spectrum · Scope Meters · Mono'`
- Optionally ToolsHubScreen.tsx:291 → `'Pro audio multimeter: combined audio level bar, spectrum, spectrogram and oscilloscope'`
- Tradeoff: cheapest; "Audio" already sits in the name, and the subtitle then spells out what it meters. Residual risk: a reviewer skimming only the headline still sees "MultiMeter"; the bare-word a11y label and `tools/multimeter` URL remain.

**B. Rename to "Audio Meter Suite"** — removes the ambiguity entirely.
- toolsData.ts:203 → `name: 'Audio Meter Suite'`; :204 → `subtitle: 'Level · Spectrum · Scope · Mono'`
- MultiMeterScreen.tsx:1056 → `AUDIO METER SUITE`; :901 → `` `Meter Suite snapshot — LCF ${…} dBC` ``
- ToolsHubScreen.tsx:291 → `'Audio meter suite: combined level bar, spectrum, spectrogram and oscilloscope'`
- toolHelp.tsx:241 → `name: 'Audio Meter Suite'`
- Tradeoff: zero electrical-meter reading; loses the rack-gear flavor the owner curated; old saved snapshots keep their "MultiMeter snapshot" titles (historical rows — fine, or leave :901 unchanged for continuity). Deep link can stay `tools/multimeter` (internal key) or move to `tools/meter-suite` — moving it breaks any already-shared links once AASA/App Links are hosted.

**C. "Audio MultiMeter (Level · RMS · Peak)" hybrid** — keeps the trademark-y word, forces the audio reading at every surface.
- toolsData.ts:203 → `name: 'Audio MultiMeter'`; :204 → `subtitle: 'Level · RMS · Peak · Spectrum · Scope'`
- MultiMeterScreen.tsx:1056 → `AUDIO MULTIMETER`; other strings drop "Pro" accordingly (:901 unchanged, ToolsHubScreen:291 → `'Audio multimeter: …'`, toolHelp:241 → `'Audio MultiMeter'`)
- Tradeoff: middle ground — the word "multimeter" survives but is never separable from "Audio"; slightly weaker than B against a worst-case reviewer, much cheaper than B's full sweep. Note the subtitle loses "Mono" unless kept: `'Level · RMS · Peak · Mono'`.

---

## Changed files this session

- `src/screens/tools/EngineGate.tsx` — retry/settings recovery controls (mission 1).
- `src/features/permissions/permissionStore.ts` — `'mic'` capability key + reset list.
- `src/features/permissions/PermissionPrompt.tsx` — mic pre-permission copy (ready to wire).
- `docs/audit/night_2026_09_13/mic_engine_rename.md` — this report.

No git operations performed; no renames applied; no app.json/native changes.
