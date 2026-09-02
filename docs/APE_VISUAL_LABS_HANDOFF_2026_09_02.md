# Overnight build 2026-09-02 — three visual labs: handoff

Built unattended from the owner's pasted briefs, after the Ear Training, Amplifier
Principles and Tuning & Temperament labs from the same night. Everything below is on
`audio-tools-engine` and pushed. **Every line of copy in these labs is new and
unratified — owner review queue.** Every chart is labelled relative / illustrative /
conceptual; nothing is presented as a measurement.

| Lab | Route(s) | Catalog row | Commit |
| --- | --- | --- | --- |
| Sound Envelope & Transients | `EnvelopeLab` | Synthesis (replaces the "Sound Envelope Lab" placeholder) | 1f0cf55 |
| Speech & Voice — How Human Speech Works | `SpeechLab` | Voice & Speech (replaces the "Speech Lab" placeholder) | a76db91 |
| Smart Processors V1 — De-Esser & Sibilance Control | `SmartProcessorsLab` (hub) → `DeEsserLab` | Dynamics (replaces the "Smart Processors Lab" placeholder) | efe4976 |

## Shared architecture

* `C:\Users\profe\dev\ape-studio\src\screens\lab\kit\PagedLab.tsx` — the shell all three
  use: header "TITLE · n OF N", progress dots + tappable page list with RESET (Alert),
  Back / Continue / Finish, subtitle on page 1, reduced-motion flag from
  `animationsAllowed()`. Pages are components that receive `ctx {reduceMotion, markDone,
  isDone}`.
* `C:\Users\profe\dev\ape-studio\src\features\lab\pagedProgress.ts` — AsyncStorage
  `ape:<labId>:v1` (`envelope`, `speech`, `deesser`); wiped with the guest wipe like every
  other `ape:*` key.
* Reused: `Lead/Body/Card/Btn/Row/Eyebrow` (tuning primitives), `UnderstandingCheck`
  (tuning/check), `ControlSlider` (amp/kit), theme tokens, `levelColor`.
* Each lab is a pure model + node tests + screens:

| Model | Tests | Screens |
| --- | --- | --- |
| `src\features\envelope\envelopeModel.ts` | `test\envelopeModel.test.ts` (11) | `src\screens\lab\envelope\{EnvelopeLabScreen,EnvelopeChart}.tsx` |
| `src\features\speech\speechModel.ts` | `test\speechModel.test.ts` (13) | `src\screens\lab\speech\{SpeechLabScreen,speechPagesA,speechPagesB,speechViz}.tsx` |
| `src\features\deesser\deEsserModel.ts` | `test\deEsserModel.test.ts` (10) | `src\screens\lab\deesser\{SmartProcessorsLabScreen,DeEsserLabScreen,deEsserViz}.tsx` |

## What each lab contains

**Sound Envelope & Transients (7 pages).** ADSR explorer (attack/decay/release on log
ms sliders, sustain, hold, linear vs exponential shapes; envelope + waveform redraw
instantly; rise-time 10→90 % marker; glossary) · gallery of teaching shapes (snare, kick,
piano, violin, trumpet, cymbal, speech syllables) with LOAD INTO THE EXPLORER · Transient
Explorer (sharp / soft / none + why transients matter for percussion, speech, instrument
ID, compression, limiters, loudspeakers) · duration timeline on a log-time axis (finger
snap → pink noise) · peak vs average with crest factor computed from the drawn waveform ·
the envelope-vs-propagation boundary (owner's split from the Wave lab) · four checks.

**Speech & Voice (11 pages).** Tappable head cross-section (11 structures) · five-stage
production sequence with the cross-section highlighting each stage (auto-play only when
motion is allowed) · voiced vs unvoiced with animated vocal folds and the seven
minimal pairs · vowels on the tongue chart with jaw/lip diagram and a harmonics-under-
the-mouth-curve formant chart (typical adult-male values, flagged as such) · six consonant
families with an energy-band display · why pop filters work (diagram + trace, with/without)
· why sibilance exists (S vs vowel spectrum) · the distance effect at 1"/6"/12" (direct,
room, plosive air, proximity bass, voice over noise — relative, illustrative) · voices
differ (typical ranges, "typical, not fixed" warning card) · eight-problem simulator
(cause / visual / fix) · four checks.

**Smart Processors V1 (hub + 9 pages).** Hub lists De-Esser (live) and six planned
members using the catalog's `DEV_NOTE` (no timeline, no promise). The de-esser lab: what
sibilance is (phrase frames + per-frame spectrum) · why EQ is not enough (vowel-brightness
loss computed for a static cut vs the de-esser) · the detection path as a tappable block
diagram (band-pass in the side chain, not the signal path) · threshold with detector trace
and gain-reduction bars · frequency selection 2–10 kHz with band width and starting-point
hints · reading gain reduction (range) · broadband vs split-band, frame by frame, before /
after spectrum · over-de-essing progression (off → transparent → controlled → noticeable →
lisping → dull) · connections (EQ Lab, Compression, Gate, Visual Audio Analysis, Speech
lab — real routes) + four checks. One rack state is shared across the pages.

## Verification performed

* `npx tsc --noEmit` clean after every phase.
* `npm test` — **154 / 154** (25 directory + 46 amp + 49 tuning + 11 envelope + 13 speech +
  10 de-esser).
* Web preview (8090, sound never enabled): every page of all three labs opened and
  screenshotted; interactions exercised through the DOM (sliders, chips, page list, Continue
  / Finish, LOAD INTO THE EXPLORER, JUMP TO AN S); phone-width (375 px) layout checked on
  the de-esser lab; progress counter verified to advance per page.
* Bugs found and fixed on the way: PagedLab mark-done + advance clobbering each other
  (progress stuck at 0) — now persists through a ref; duration-timeline label collisions;
  serif fallback fonts in SVG labels; vowel spectrum drawn on the wrong axis — replaced by
  the linear formant chart; distance-page labels clipped / black-on-dark; de-esser trace
  labels overlapping; nested SVG text not rendering on web.

## Not done / needs the owner

| Where | What |
| --- | --- |
| All three labs | Copy review — all NEW, nothing ratified. |
| Speech lab, page 1 | The head cross-section is a stylised side view; if it does not meet the design bar it is one SVG in `speechViz.tsx` (`HeadCrossSection`) and the tap positions live in `ANATOMY` (x, y). |
| Phone | Device pass: slider feel (`ControlSlider`), SVG tap targets (head diagram, block diagram, duration timeline), reduced-motion behaviour on a real OS toggle. |
| Ear + Tuning labs (earlier tonight) | Device pass WITH sound — never enabled on the web harness. |
| Smart Processors | Future members: add a row to `FAMILY` in `SmartProcessorsLabScreen.tsx` and a new `PagedLab`. |
