# MEASUREMENT & ANALYSIS TOOLS — RULINGS OF RECORD (Q1–Q5 + FOLLOW-ONS)
**Status: RULED by Prof. Booth 2026-07-09 (this document is the decision record; register in Project §1G)**
**Resolves: INDEX v48 §4M open rulings · tech spec `AUDIO_MEASUREMENT_TOOLS_TECH_RESEARCH_2026_07_09_v1.md` §10.3**

---

## Q1 — SPIKE-0 CAPTURE APPROACH: **Custom Expo Module + C++ core, with fallback**
- Build the native capture/DSP module (`ape-dsp`: Swift wrapper — AVAudioSession `.measurement` + AVAudioEngine tap — over a portable C++ DSP core, JSI-backed frame access).
- **1-week timeboxed spike.** If it overruns, fall back to `react-native-audio-api` (documented fallback, tech spec §2.3 Option B).
- Requires a **new EAS iOS dev build** (first custom native module).
- **Timing — RULED: start NOW, in parallel** with the launch-critical frontend work (Booth override of the after-launch recommendation). ⚠️ Dependency noted: the spike runs in the Claude Code session and must not displace the pre-provisioning items (QR wiring · S3/S4-Media shells · D-1 pass · S1/S7 wiring · smoke tests). Launch items keep priority on any conflict.

## Q2 — RTA LOW-FREQUENCY BANDS: **Honest gray-out (MVP)**
- 1/3-octave bands below the FFT-resolvable limit render grayed with an "insufficient resolution at this setting" state — never fabricated values.
- Dedicated IIR filterbank for the bottom bands = professional tier, later.

## Q3 — USAGE TELEMETRY (T-1): **YES — spec now**
- Scope: **opens + durations** — one event per tool session (`tool_id`, `opened_at`, `duration_seconds`). No measurement content, no audio, ever.
- Identity: **per-student** (authenticated RPC keyed to the student), consistent with the rest of the app.
- Spec of record: `T1_TOOL_USAGE_TELEMETRY_RPC_SPEC_2026_07_09_v1.md` (CANDIDATE — spec-approval ≠ deploy-authorization; deploy is a separate go-ahead via dev-branch → tests → advisors → merge).
- This supersedes the tech spec's "zero backend surface" MVP posture **by exactly one additive RPC + one table**; all §7.2 don'ts (no audio uploads, no calibration in DB, no progression writes, no overloading `record_study_progress`) remain in force.

## Q4 — TEST-SIGNAL OUTPUT CAP: **Capped + confirm**
- Generator (pink noise / sweep) defaults to **−20 dBFS**; hard cap **−12 dBFS**.
- Levels above the cap require an explicit tap-through confirmation ("Remove headphones / lower monitor level before continuing"), then unlock to full scale for that session only.
- Implemented in the native output path (tech spec §5.2); cap constants in one config location.

## Q5 — MINIMUM DEVICE CLASS: **iPhone 11 class (A13, 2019)**
- Performance budget, soak tests, and FFT ceilings (≤16384) target A13.
- Older devices may run with conservative spectrogram defaults but are unsupported for the perf guarantee.

---

## UNBLOCKED / NEXT ACTIONS
1. **Claude Code session:** Spike 0 kickoff (Option A) — needs a kickoff brief + new EAS dev build. Launch-critical items retain priority.
2. **This governance session:** T-1 spec authored (companion doc); deploy on separate go-ahead.
3. **Governance:** fold these rulings into INDEX §4M (mark RULED) + TRACKER at the next coordinated bump. Also to record at that bump: 2026-07-09/10 Project cleanup (Tier-1/2 deletions), G4 closed (`measurement_tools_card.PNG` renamed + verified live), `205b_card.PNG` re-upload.

## SAME-SESSION CLOSURES (2026-07-09, executed + verified by the governance session — also fold at next bump)
- **H1 CLOSED:** 2 trophy `icon_url` client-DML rows RATIFIED (verified live: Professional Audio Safety `eebac0e9…` + Sound & Acoustics `595c0857…`). Trophy art = 35 topics.
- **Backups dropped:** migration `drop_backup_glossary_tables_20260708_booth_confirmed` — `_backup_glossary_20260708` + `_backup_glossary_topics_20260708` removed (0 `_backup_*` tables remain); the two `rls_enabled_no_policy` INFO advisors cleared with them.
- **Grants hygiene CLOSED:** catalog check found the stray anon TRUNCATE/REFERENCES/TRIGGER on `users` already absent; residual anon `MAINTAIN` revoked via migration `revoke_anon_maintain_users_20260709`. Post-check: anon privileges on `users` = NONE. Advisors: 13 WARNs, all accepted by-design classes (RLS helpers + student-facing RPCs); no new exposure. *(Note: `authenticated` also holds stray `MAINTAIN` on `users` — harmless, left untouched, flag for the next hygiene pass.)*
- **H3 HELD:** flashcard-gate views≥2→≥1 deploy deferred (Booth ruling — change stays approved, deploy later).
- **T-1 deploy DEFERRED** until the engine build (spec stands as CANDIDATE).
- **Spike-0 kickoff brief authored:** `APE_SPIKE0_KICKOFF_BRIEF_2026_07_09_v1.md` (register in Project; hand to the Claude Code session).

*End of rulings record.*
