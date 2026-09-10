# Proposed `labs/*` deep-link mapping — for owner approval (2026-09-10)

Draft by Claude for the owner to review/edit, then I wire it into
`src/navigation/linking.ts` and flag the cross-repo sync. **Nothing is wired
yet.** Source of the gap: launch audit 2026-09-09, wave1 nav #5.

## Why this is safe to change now
Universal/App Links are **inert until the website hosts AASA + assetlinks**
(see `app-discoverability-2026-09-05` memory / `docs/APE_WEBSITE_SEO_NOTES_2026_09_05.md`).
So there are **no live public `labs/*` URLs to break** — including re-pointing
`labs/eq`. The custom scheme `proaudio://labs/*` works on-device today, but it's
not an advertised contract yet either.

## The `labs/eq` decision (the headline)
Two different EQ labs exist:
- **`EqLab`** — the *audible-effect* EQ lab (gated, amplitude-orientation).
- **`EqLabHome`** — the **teaching "EQ Lab"** (owner spec 2026-08-07), currently
  **not deep-linkable at all**.

Today `labs/eq` → `EqLab` (the effect). A marketing link almost certainly means
the teaching lab. **Proposed:**

| Slug | → Route | Change |
| --- | --- | --- |
| `labs/eq` | **EqLabHome** (teaching EQ Lab) | re-point (was EqLab) |
| `labs/eq-effect` | EqLab (audible effect) | new, moved off `labs/eq` |

*(Alternative if you'd rather not move the effect lab: keep `labs/eq` → EqLab and
add `labs/eq-lab` → EqLabHome. I recommend the table above — the clean slug
should be the teaching lab.)*

## Flagship / hub labs to ADD (no path today)
The labs a website or campaign would most plausibly link:

| Slug | → Route | Lab |
| --- | --- | --- |
| `labs/meters` | MeterLab | Metering lab (home) |
| `labs/gain` | GainLabHome | Gain Staging lab |
| `labs/amplifiers` | AmpLab | Amplifier Principles lab |
| `labs/waves` | WaveLab | Wave modules lab (home) |
| `labs/ear-training` | EarTrainingLab | Ear Training lab |
| `labs/tuning` | TuningLab | Tuning & Temperament lab |
| `labs/cables` | CableLab | Cable & Connector Fundamentals |
| `labs/signal-chain` | SignalChainLab | Signal Chain lab |
| `labs/envelope` | EnvelopeLab | Sound Envelope & Transients |
| `labs/speech` | SpeechLab | Speech & Voice lab |
| `labs/de-esser` | DeEsserLab | De-Esser lab |
| `labs/smart-processors` | SmartProcessorsLab | Smart Processors lab |
| `labs/mic-selection` | MicSelectLab | Mic Selection lab |
| `labs/amplitude` | AmplitudeLab | Amplitude visualizer |

## Effect sub-labs — OPTIONAL (reached from inside the FX hub)
Lower marketing value; map them only if you want each publicly addressable.
Suggested consistent slugs if yes:

`labs/chorus`→ChorusLab · `labs/flanger`→FlangerLab · `labs/phaser`→PhaserLab ·
`labs/gate`→GateLab · `labs/limiter`→LimiterLab · `labs/distortion`→DistortionLab ·
`labs/phase`→PhaseLab · `labs/stereo`→StereoLab · `labs/bass`→BassLab ·
`labs/autotune`→AutotuneLab · `labs/fm-synthesis`→FmLab · `labs/binaural`→BinauralLab ·
`labs/modular`→ModularLab

**Default recommendation:** leave these unmapped for launch (they fall through to
`LabCategory` today). Add later if a campaign needs one.

## Already mapped — keep as-is
`labs/harmonograph` · `labs/harmonic` · `labs/oscillator` · `labs/noise` ·
`labs/compression` · `labs/reverb` · `labs/delay` · `labs/microphone` ·
`labs/speaker` · `labs/tubes` · `labs/calculator` · `labs/digital` ·
`labs/cable-installation` · `labs` → EarLab · `labs/:id` → LabCategory (MUST stay
LAST — it's the catch-all).

## Open naming choices for you
1. `labs/eq` re-point vs `labs/eq-lab` alias (see headline section).
2. `labs/amplifiers` vs `labs/amps`; `labs/meters` vs `labs/metering`;
   `labs/waves` vs `labs/wave`.
3. Include the effect sub-labs now, or defer?

## When you approve — the wiring (I do this)
| Where | What |
| --- | --- |
| `src/navigation/linking.ts` | Add/repoint the `screens` entries per the approved table; keep `LabCategory: 'labs/:id'` last |
| `src/navigation/linkPaths.ts` | `isClaimedPath` already accepts any single-segment `labs/<x>`; confirm no per-slug list needs updating |
| `app.json` | Confirm `ios.associatedDomains` / `android.intentFilters` cover `/labs/*` (host-level today; verify path patterns) |
| **Website repo (cross-repo)** | AASA (`apple-app-site-association`) + `assetlinks.json` path patterns must include every new `/labs/*`; add to sitemap / marketing links |
| Gate | `tsc --noEmit` + `npm test` (296), then a device deep-link smoke test per slug |
