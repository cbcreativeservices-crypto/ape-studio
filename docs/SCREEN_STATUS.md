# Screen Completion Tracker — Launch Sign-Off

**Purpose:** the running list of every screen in the app's live navigation, with a
completion status the owner signs off as we approach launch testing.

**Ask any time:** *"How many screens are incomplete?"* → read the **Headline** below.

> Statuses set 2026-08-10 from build history + a per-screen completeness audit
> (audit verdict: **0 stubs, 0 partials — every screen fully built**).
> Owner sign-off is the only thing that moves a row to 🟢.

## Status legend
- 🟢 **Signed off** — owner has confirmed this screen is launch-ready.
- 🔵 **Built** — fully built & functional; awaiting owner sign-off.
- 🟡 **Blocked** — screen is built, but a dependency gates it (native audio/DSP
  engine not in the current build, or a scoped sub-feature is pending). Not a
  code stub — the blocker is named in Notes.
- 🔴 **Incomplete** — real dev work remains (stub, placeholder, unfinished section).
- ⚪ **Excluded** — intentionally not part of the commercial launch nav (parked or
  dev-only). Not counted.

## Headline (the running figure)
| Metric | Count |
|---|---|
| **Incomplete (🔴 — needs dev work)** | **0** |
| Blocked (🟡 — built, dependency-gated) | 1 |
| Built, awaiting sign-off (🔵) | 77 |
| Signed off (🟢) | 0 |
| Excluded (⚪ — parked/dev) | 2 |
| **Total navigable screens (excl. ⚪)** | **78** |

**So: "how many screens are incomplete?" → 0 need net-new build (audit found no
stubs/partials); the native audio engine went LIVE and was iOS-verified
2026-08-14, so the 8 measurement tools moved 🟡→🔵; 1 remains blocked
(PublicGlossary — scoped CM4 anon rendering, not the engine); 77 are built and
awaiting your sign-off.**

> 🟡 "Blocked" means the SCREEN is complete and shows honest gated states. The
> native DSP audio engine SHIPPED and was iOS-verified 2026-08-14 — the 8
> measurement tools are now 🔵. The remaining 🟡 (PublicGlossary) is gated by a
> scoped content sub-feature (CM4 anon rendering), not the engine.

> **Effect labs note:** the 12 effect-lab routes below (EqLab, DelayLab, ReverbLab,
> ChorusLab, FlangerLab, PhaserLab, CompressionLab, GateLab, LimiterLab,
> DistortionLab, PhaseLab, StereoLab) are 12 distinct nav destinations you sign
> off individually, but they share ONE code screen — `lab/FxLabScreen.tsx` driven
> by `lab/fxLabConfigs.tsx`. Content lives in the config; a code fix touches all 12.

> **Display decisions — 2026-08-15 (owner-verified on both phones, commit `c0ddc1a`):**
> - **Waveform traces unified** (WaveformLive, MultiMeter mini-scope, HarmonicLab live
>   strip): high resolution via **react-native-svg + min/max downsample to ≤128 columns**
>   over the correct time window (3 s scope / 2 s strip), pulled resolution-agnostically
>   from the fine engine history. **NOT Skia per-pixel** on the multi-panel screens — that
>   starved the render thread and made the whole screen (scope + spectrogram) clunky.
> - **Scale = `Math.max(1.05, observed)`** on all three: fixed full-scale for normal
>   signal (no size pulsing), expands only past 0 dBFS (disclosed "scale ±"). Replaced the
>   HarmonicLab strip's old pure auto-gain, which pulsed and crushed normal signal into a
>   thin "green outline" on transients. **One filled body, no outline stroke** (mini-scope
>   outline removed).
> - **MultiMeter LIVE SPECTRUM (RTA): FFT + AVG line traces removed** — LED bars +
>   peak-hold only ("never wanted that").
> - Standing render rule recorded in governance memory (`integrity-and-governance`).

---

## Core / Navigation
| Screen (route) | Status | Notes |
|---|---|---|
| Splash | 🔵 | Boot splash. |
| Auth | 🔵 | Login/entry; entitlement reads server on login. |
| Home (CourseSelection) | 🔵 | Academy menu; coming-soon topic stubs retired 2026-08-10. |
| Profile | 🔵 | Goals auto-populate from My Enrollments. |
| Settings | 🔵 | Dev-only rows guarded to dev builds. |
| About | 🔵 | |
| Directory | 🔵 | |
| Paywall | 🔵 | Commercial upgrade. |
| PublicGlossary | 🟡 | Nav shell works; full anonymous rendering (anon locks/grants) is scoped CM4. |

## Study
| Screen (route) | Status | Notes |
|---|---|---|
| Dashboard (Study tab root) | 🔵 | Topic image from achievement trophy. |
| Flashcards | 🔵 | |
| FillInBlank | 🔵 | |
| Matching | 🔵 | |
| Quiz | 🔵 | v3 quiz rules (approved-only, no graded in practice). |
| Glossary | 🔵 | Term↔calculator round-trip live. |
| Scenarios | 🔵 | |

## Results / Awards
| Screen (route) | Status | Notes |
|---|---|---|
| Results | 🔵 | |
| Trophy | 🔵 | |
| Awards | 🔵 | |
| AchievementsGrid | 🔵 | Back button when opened outside bottom nav. |
| Gallery | 🔵 | |

## Tools
| Screen (route) | Status | Notes |
|---|---|---|
| ToolsHub | 🔵 | "N in development" tally removed 2026-08-10. |
| ToolInfo | 🔵 | Engine-status card honest ("not in this build"). |
| ToolLearn | 🔵 | Academy-gated learn content. |
| ToolDemo | 🔵 | Visual/silent demos. |
| ConceptModule | 🔵 | |
| ToolLibrary (MeasurementLibrary) | 🔵 | Share branding unified 2026-08-10. |
| ExposureMonitor (Listening Exposure) | 🔵 | Added 2026-08-12: app-wide audio dosimeter — check-ins, history, settings, privacy; works on any build (estimates labeled). |
| SplMeter | 🔵 | Engine LIVE — iOS-verified 2026-08-14. |
| Rta | 🔵 | Engine LIVE — iOS-verified 2026-08-14. |
| WaveformLive | 🔵 | Engine LIVE — iOS-verified 2026-08-14. |
| SignalGen | 🔵 | Engine LIVE — iOS-verified 2026-08-14. |
| SpectrogramLive | 🔵 | Engine LIVE — iOS-verified 2026-08-14. |
| Rt60Live | 🔵 | Engine LIVE — iOS-verified 2026-08-14. |
| FrequencyCounter | 🔵 | Engine LIVE — iOS-verified 2026-08-14. |
| MultiMeter | 🔵 | 1800+ lines built; engine LIVE — iOS-verified 2026-08-14. Mini-scope high-res SVG min/max + fixed scale, no outline; RTA (LIVE SPECTRUM) line traces removed 2026-08-15. |
| DspDebug | ⚪ | Dev-only diagnostic screen — not shipped. |

## Effect & Fundamentals Labs
| Screen (route) | Status | Notes |
|---|---|---|
| AudioLearning | 🔵 | Labs hub. |
| EarLab | 🔵 | |
| LabCategory | 🔵 | Dev-lab rows stripped 2026-08-10. |
| HarmonicLab | 🔵 | Live waveform strip: high-res SVG min/max + fixed scale (no auto-gain pulse/outline) 2026-08-15. |
| OscillatorLab | 🔵 | |
| NoiseLab | 🔵 | |
| HarmonographLab | 🔵 | |
| EqLab | 🔵 | Effect lab. |
| DelayLab | 🔵 | |
| ReverbLab | 🔵 | |
| ChorusLab | 🔵 | |
| FlangerLab | 🔵 | |
| PhaserLab | 🔵 | |
| CompressionLab | 🔵 | |
| GateLab | 🔵 | |
| LimiterLab | 🔵 | |
| DistortionLab | 🔵 | |
| PhaseLab | 🔵 | |
| StereoLab | 🔵 | |
| SignalChainLab | 🔵 | Capstone chain; audio-gated on engine build (diagram/lessons live). |
| BassLab | 🔵 | |
| AutotuneLab | 🔵 | |
| FmLab | 🔵 | |
| BinauralLab | 🔵 | |
| ModularLab | 🔵 | |
| MicLab (MicPrinciples) | 🔵 | |
| MicSelectLab (Microphone Selection) | 🔵 | Added 2026-08-12: 9 lessons + Choose-the-Mic challenge + optional mic locker; no engine dependency. |
| AmplitudeLab (Understanding Level & Amplitude) | 🔵 | Added 2026-08-12: color-language orientation; first lab in Audio Fundamentals + first-use gate across labs/tools. |
| SpeakerLab (SpeakerCoverage) | 🔵 | Future-promise note removed 2026-08-10. |
| TubeLab (VacuumTube) | 🔵 | VS animation redrawn 2026-08-10. |
| TubeReference | 🔵 | |
| TubeCard | 🔵 | |

## Calculators
| Screen (route) | Status | Notes |
|---|---|---|
| CalcLab | 🔵 | 53 workspaces live. |
| CalcWorkspace | 🔵 | Share branding unified. |
| CalcSymbolsKey | 🔵 | Empty-state de-futured 2026-08-10. |
| CalcWorkflows | 🔵 | |
| CalcWorkflowEdit | 🔵 | |
| CalcWorkflowRun | 🔵 | |
| CalcProjects | 🔵 | |
| CalcResults | 🔵 | Share-as-image + text unified. |

## Lab Homes / Modules
| Screen (route) | Status | Notes |
|---|---|---|
| DigitalLab (home) | 🔵 | 8 modules live. |
| DigitalModule | 🔵 | |
| WaveLab (home) | 🔵 | |
| WaveModule | 🔵 | |
| MeterLab (home) | 🔵 | |
| MeterModule | 🔵 | |
| EqLabHome | 🔵 | Planned "SOON" cards removed 2026-08-10. |
| EqModule | 🔵 | 10 EQ modules. |
| GainLabHome | 🔵 | |
| GainModule | 🔵 | Gain-staging modules complete. |

## Foundations
| Screen (route) | Status | Notes |
|---|---|---|
| FoundationsCourse | 🔵 | "Module 12" promise removed 2026-08-10. |
| FoundationsPlayground | 🔵 | |

## Excluded from launch nav
| Screen (route) | Status | Notes |
|---|---|---|
| Institutional | ⚪ | PARKED — academic/site-license version postponed until after commercial launch. Reachable only from a disabled Profile row. |
| DspDebug | ⚪ | Dev-only diagnostics. |

---

## How to use this tracker
- **To sign a screen off:** change its 🔵/🟡 to 🟢 and update the Headline counts.
- **When a screen's blocker clears** (e.g. the native audio engine ships): move
  its 🟡 → 🔵 (or 🟢 if verified).
- **New screen added to nav:** add a row in its section and bump the total.
- Keep the Headline table in sync with the section rows — it is the single figure
  answered when asked "how many screens are incomplete?".

**Audit (2026-08-10, complete):** per-screen completeness audit of all ~75
navigable screens found **0 stubs and 0 partials** — every screen is a fully
built, functional component; audio/measurement screens use honest gated states
rather than fake data. 47 COMPLETE + 22 COMPLETE-GATED (the gated set = the live
meters/tools + audio-dependent labs). No net-new screen build is outstanding;
remaining work is the native DSP engine build (unblocks the 🟡 rows) and owner
sign-off (🔵 → 🟢).
