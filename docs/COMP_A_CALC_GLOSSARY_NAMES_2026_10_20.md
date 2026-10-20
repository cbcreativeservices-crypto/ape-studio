# Comp A: reconcile the Calculator Lab's glossary names (2026-10-20)

**Owner, 2026-10-20:** Comp A handles and reconciles the Calculator Lab glossary names that miss or hit the wrong entry. ccode then updates the app lists to the names you return.

## How the app looks a name up
Each calculator workspace lists glossary names (`glossary: [...]` in `src/screens/lab/calc/workspaces/*.ts`). Tapping one opens `GlossaryTermPopup`, which runs `glossary_browse_v` `.ilike('term', name).limit(1)`. That is an exact, case-insensitive match with **no ordering**. So:
- a name with **no** entry opens nothing;
- a name with **two** entries opens whichever row Postgres returns first;
- a bare name opens whatever sense owns that exact name.

I checked all 131 calculator names against the live glossary today (read-only).

## A. Five names with no entry (they open nothing)
| Name in the app | Workspace (file) | What the calculator teaches there | Close live entries |
|---|---|---|---|
| `Exposure` | Exposure & Allowable Time (`splSafety.ts`, workspace `dose`) | Noise dose, allowable time, Leq | `Exposure/Dose` (Levels, Metering & Reference Standards); `Exposure duration` (Pro Audio Safety) |
| `Nonlinearity` | `wavesAdv.ts` (with Intermodulation, Distortion, Harmonics) | Intermodulation / harmonic products of a nonlinear system | `nonlinear` (Signal & Transfer-Function Analysis); `nonlinear distortion` (Attack, Decay…); `Linear versus nonlinear acoustic behavior` (Foundations) |
| `Summation` | Adding Sound Sources (`splSafety.ts`, workspace `spladd`) | Adding uncorrelated levels (energy sum) and identical sources | `Incoherent Summation`, `Coherent Summation` (both Foundations) |
| `Transformer tap` | Constant-Voltage 70 V / 100 V (`speakers.ts`, workspace `cv70`) | Choosing a speaker's tap wattage on a 70 V / 100 V line | `Loudspeaker Tap Impedance` (Commercial/Install AV) |
| `Wireless` | RF & Link Budget (`micsRf.ts`, workspace `rflink`) | Path loss and link margin for wireless mics | `Wireless microphone`, `Wireless microphone system` (RF Wireless Systems) |

## B. One name that opens the wrong sense
| Name | Workspace | Opens today | Should open |
|---|---|---|---|
| `Transformer` | Constant-Voltage 70 V / 100 V (`speakers.ts`) | **"Transformer" in AI/ML for Music & Sound** (the neural-network architecture) | The audio/electrical transformer. No such entry is live under a plain name. By the sense-tag rule this suggests `Transformer (AI)` for the ML entry plus an audio `Transformer` or `Transformer (audio)`. |

## C. Names with two live entries (the popup opens either one)
| Name | Entries |
|---|---|
| `Damping Factor` | 2 rows, both in Amplifiers |
| `Nyquist Frequency` | 2 rows, both in Digital Audio |
| `Free field` | 2 rows: Propagation, Reflection & Room Behavior and Sound Physics, Measurement & Acoustic Quantities |
| `Signal-to-Noise Ratio` | 2 rows: Signal Path & Levels and Levels, Metering & Reference Standards |

Please retire the duplicate or tag the senses, per the dedup standard, so each name opens one entry.

## D. For your information
`Monitoring (audio)` and `Reflection (acoustics)` (Computer B's new entries) appear in `glossary_browse_v` and open correctly. Their `glossary.achievement_id` reads **null**, although your note lists their topics (3840, 3010). Please confirm that is intended, or set it like other rows.

## What ccode needs back
For each row in A and B, either:
1. **"New entry: <exact term>"** once it is live, or
2. **"Use existing: <exact term>"**.

For C, say when it is done. ccode then updates the workspace lists, re-checks every name against the live glossary, and adds a ratchet test. No app change happens before you reply. The calculator text itself is unaffected.

ccode's suggestions only, yours to overrule:
- Exposure → `Exposure/Dose`
- Summation → `Incoherent Summation` (the workspace adds uncorrelated sources)
- Transformer tap → `Loudspeaker Tap Impedance`
- Wireless → `Wireless microphone system`
- Nonlinearity → `nonlinear distortion`
- Transformer → a new audio entry
