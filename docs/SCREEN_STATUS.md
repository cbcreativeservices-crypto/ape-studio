# Screen Completion Tracker — Launch Sign-Off

**Purpose:** the running list of every screen in the app's live navigation, with a
completion status the owner signs off as we approach launch testing.

**Ask any time:** *"How many screens are incomplete?"* → read the **Headline** below.

> Provisional statuses set 2026-08-10 from build history + a completeness audit.
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
| Blocked (🟡 — built, dependency-gated) | 9 |
| Built, awaiting sign-off (🔵) | 66 |
| Signed off (🟢) | 0 |
| Excluded (⚪ — parked/dev) | 2 |
| **Total navigable screens (excl. ⚪)** | **75** |

**So: "how many screens are incomplete?" → 0 need net-new build; 9 are built but
blocked on the native audio engine build (the live meters/tools) or a scoped
sub-feature; 66 are built and awaiting your sign-off.**

> These provisional numbers are refined by the completeness audit — see the
> Audit line at the bottom.

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
| SplMeter | 🟡 | Built; live audio needs native DSP engine build. |
| Rta | 🟡 | Built; live audio needs native DSP engine build. |
| WaveformLive | 🟡 | Built; live audio needs native DSP engine build. |
| SignalGen | 🟡 | Built; live audio needs native DSP engine build. |
| SpectrogramLive | 🟡 | Built; live audio needs native DSP engine build. |
| Rt60Live | 🟡 | Built; live audio needs native DSP engine build. |
| FrequencyCounter | 🟡 | Built; live audio needs native DSP engine build. |
| MultiMeter | 🟡 | 1800+ lines built; live audio needs native DSP engine build. |
| DspDebug | ⚪ | Dev-only diagnostic screen — not shipped. |

## Effect & Fundamentals Labs
| Screen (route) | Status | Notes |
|---|---|---|
| AudioLearning | 🔵 | Labs hub. |
| EarLab | 🔵 | |
| LabCategory | 🔵 | Dev-lab rows stripped 2026-08-10. |
| HarmonicLab | 🔵 | |
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

**Audit:** provisional statuses seeded 2026-08-10 from build history; a
per-screen completeness audit is refining them (results fold in on completion).
