# AP&E Studio — Cowork Handoff (2026-07-23, end of day)

**Purpose:** hand this to Claude cowork/chat so it can update the project **memory** and
**governance** files with what shipped today. Everything below is the source of truth as of
end of session. Nothing here asks cowork to touch the codebase — the code is already committed
and pushed. This is a records-update handoff.

---

## 1. Repo state (authoritative)

| Item | Value |
|---|---|
| Repo | `https://github.com/cbcreativeservices-crypto/ape-studio.git` |
| Branch | `audio-tools-engine` |
| HEAD | `572aa6b` — *T-1 tool-usage telemetry: client wiring + R4 deploy record* |
| Working tree | **clean**, HEAD **pushed** to origin |
| Stack | Expo SDK 57.0.7 / RN 0.86 / TypeScript strict / Hermes / entry `index.ts` |

**Commit lineage this session (newest → oldest):**
- `572aa6b` T-1 tool-usage telemetry: client wiring + R4 deploy record
- `b402e19` Android: add versionCode/versionName to ape-dsp build.gradle
- `43adcec` Audio tools: Android port of the ape-dsp measurement engine (ruling R3)
- `257805e` Audio tools: RT60 tool UI, SPL field calibration, governance rulings
- `755af76` Audio Measurement Tools module: Phases 1-2 + native DSP engine

---

## 2. What shipped today (for the memory/project files)

### A. Audio Measurement Tools module (Phases 1–2)
- 8 tools scaffolded with **honest** Learn / Demo / (live) surfaces. NO fake/decorative meters
  anywhere (spec §1.7). When the native engine is absent, tools **gray out honestly** via
  `EngineGate` — never a simulated needle.
- Measurement data model: `src/features/tools/measure/` — `types.ts` (`SavedMeasurement` §7),
  `quality.ts` (valid/caution/invalid; `input_clipping = 'invalid'`), `compare.ts` (§8 warnings),
  `measurementStore.ts` (key `ape:toolMeasurements`), `calibrationStore.ts` (key `ape:splCalOffset`).

### B. Native DSP engine — `modules/ape-dsp/`
- **Portable header-only C++17 core** shared by both platforms (`ios/core/*.hpp`):
  Biquad (A/C/Z weighting + RBJ bandpass), Fft (radix-2), OctaveBands (Q2 gray-out),
  Ballistics (Fast/Slow), Pitch (YIN), Generator (**Q4 caps: −20 dBFS default / −12 dBFS hard cap
  enforced in-core**), WaveEnvelope (F1-honest clip), Rt60 (Schroeder / T20 / T30 / EDT + per-fit R²),
  EngineHub (SpscRing drop-newest; RT60 capture state machine).
- **iOS:** Swift module + ObjC++ facade `ApeDspCore`. 3 clean archives this session.
- **Android (ruling R3):** Kotlin module + JNI + **Oboe 1.10.0**. Input uses **Unprocessed** preset
  with device-support check + VoiceRecognition fallback + read-back of actual rate + mono-float guard.
  Compiles/links all 4 ABIs.
- **Golden-vector tests:** 61/61 pass locally under MSVC.
- **JS gating:** `ApeDsp.engineVersion()` → 0 absent / 1 spike / 2 engine. `useDspEngine` hook
  (lifecycle + 15 Hz poll, blur teardown, Android `RECORD_AUDIO` request).

### C. RT60 tool UI
- Guided capture (arm → trigger → record → done), decay curve, per-band T20/T30 method + R²,
  capture-window-scoped clip flags (fixed a bug where session-cumulative flags poisoned saves),
  invalid captures are **unsaveable**.

### D. T-1 telemetry client wiring
- `src/features/tools/telemetry.ts` — `useToolUsage(toolId)`: records ONE
  `{tool_id, opened_at, duration_seconds}` per tool session on unmount, fire-and-forget,
  errors swallowed, **authenticated-only**. Wired into `ToolInfoScreen` (session owner) and
  `FrequencyCounterScreen`.

---

## 3. Governance — rulings to record (R1–R4)

Full text lives in **`docs/APE_GOVERNANCE_DECISIONS_2026_07_23.md`** (already in repo). Summary for
the governance file:

| Ruling | Decision | Status |
|---|---|---|
| **R1** SPL calibration | **Device-local offset only** — `ape:splCalOffset`, stored on device, **never** in DB. CALIBRATE panel shipped in `SplMeterScreen`. | ✅ implemented |
| **R2** Light-pulse (camera) mode | **HOLD / deferred** — not built. | ⏸ deferred |
| **R3** Android port | **Commit to port** the measurement engine to Android. | ✅ done (commits `43adcec`,`b402e19`) |
| **R4** Backend changes | **Green-light both** (T-1 telemetry + H3 flashcard gate). | ✅ deployed |

### Backend deploys applied to PRODUCTION (project `yjgolswjggmlpeowvtxr`)
> These are the DB changes the governance file must reflect. **Backend remains "frozen" except
> these R4-approved changes.**

1. **`t1_tool_usage_telemetry`** — new table `public.tool_usage_log`
   (`id, user_id→users, tool_id text (1–40), opened_at, duration_seconds (0–86400), created_at`)
   + RLS own-row SELECT + RPC `record_tool_usage(text, timestamptz, integer)`
   `SECURITY DEFINER`, `search_path public,pg_temp`, authenticated-only, inserts one row.
2. **`t1_tool_usage_rls_initplan_optimize`** — wrapped `auth.uid()` in `(select auth.uid())` for init-plan perf.
3. **`h3_flashcard_gate_views_2_to_1`** — fail-closed `pg_get_functiondef` replace in
   `record_study_progress`: `views >= 2` → `views >= 1`. Verified `h3_applied = true`.

**§7.2 constraints honored:** no calibration data in DB · no audio uploads · no progression
writes from tools · `record_study_progress` not overloaded. Deploy verified non-destructively
(rolled-back auth-context transaction; production `tool_usage_log` left empty).

---

## 4. Build artifacts (EAS, account `cbcreativeservices`)

| Build | Profile | Platform | Result | Notes |
|---|---|---|---|---|
| dev builds ×N | development | iOS | FINISHED | need Metro dev server to run |
| `e3f8e436` | development | Android | FINISHED | need Metro dev server to run |
| **`d671f550`** | **preview** | **Android** | **FINISHED** | **standalone APK — embeds JS + engine, no dev server. Install on Pixel 7.** |
| iOS preview | preview | iOS | **NOT built** | **blocked: EAS free-plan iOS build quota exhausted, resets Sat Aug 1 2026** |

- Android preview APK (download/install): `https://expo.dev/artifacts/eas/ECWlcIaK6MbJXeXvK1tvG9uK-OGlOCQZZ6RZV5AFO4M.apk`
- Android preview build page: `https://expo.dev/accounts/cbcreativeservices/projects/ape-studio/builds/d671f550-dc86-4064-8a5d-79daaec2ea30`
- The iOS preview *upload + credentials succeeded* (valid ad-hoc profile, device `00008130-00022C183651001C`); only the **monthly free-plan iOS quota** stopped it.

---

## 5. Open items for the morning (NOT for cowork — for the next Claude Code session)

1. **iPhone connectivity** — run in an **Administrator** PowerShell, then restart LAN Metro:
   ```
   Set-NetConnectionProfile -InterfaceAlias "Ethernet" -NetworkCategory Private
   New-NetFirewallRule -DisplayName "Expo Metro 8081" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8081 -Profile Private,Public
   ```
   Root cause: computer on **Ethernet 192.168.0.227**, network category **Public**, Windows
   Firewall blocking inbound 8081. iOS ATS blocks cleartext HTTP over the public tunnel domain
   but allows the private LAN IP (`exp://192.168.0.227:8081`, verified serves HTTP 200).
   Secondary suspect: McAfee VPN/firewall — may also need `node.exe` allowed.
   > **Rule:** modifying Windows firewall/security settings is the **user's** action — Claude Code
   > directs, does not do it.
2. **iOS standalone build** — either wait for the **Aug 1** quota reset then cut the iOS `preview`
   build, or the user upgrades the EAS plan (paid — user's decision).
3. **On-device runtime validation** — user's step (physical devices). Per-tool checklist already
   provided. Android Oboe **Unprocessed** preset honoring is still unverified on real hardware.
4. **R2 light-pulse camera mode** — still deferred; revisit if prioritized.

---

## 6. What cowork should do with this

- Update the **project memory** to reflect: Phases 1–2 + engine + RT60 + Android port + T-1
  telemetry all **shipped and pushed** (HEAD `572aa6b`); preview builds status (Android standalone
  building, iOS quota-blocked to Aug 1).
- Update the **governance file** with the R1–R4 outcomes in §3 and the three production DB deploys.
- Note the standing constraint: **backend frozen except the R4-approved changes above**.

*Handoff generated end-of-day 2026-07-23. Source repo commit `572aa6b`.*
