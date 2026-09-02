# Ear Training Lab — Implementation Spec (2026-09-02)

Flagship lab. 14 modules (owner's verbatim list; owner numbering skips 5 — we renumber 1–14 and keep names).
Architecture fixed: offline-rendered PCM (48kHz/16-bit, 1.5–6s clips) → WAV → expo-audio; app audio gate + red frame; Rack Unit lab UI; measurement-tool bridge = offline FFT of the SAME buffer. All copy below is **NEW COPY — owner review**.

## 1. Pedagogical frame (what drives every decision)

- **Short sessions.** Critical-listening acuity degrades with adaptation and fatigue well before discomfort (Zwicker & Fastl; every commercial trainer — SoundGym — uses 5–15 min daily workouts). Rounds are **10 trials**; soft nudge after **15 min**: "Your ears adapt. Come back fresh." Never hard-lock.
- **Loudness-matched stimuli.** Level is the great confound: a 3 dB EQ boost is partly detected as "louder" (equal-loudness contours). All stimuli are normalized to equal RMS (−20 dBFS target) **after** processing, except Loudness Recognition (8) where level IS the variable. This is the TrainYourEars/Harman "How to Listen" rule and it is what separates real EQ ears from loudness guessing.
- **Immediate feedback + re-listen + see it.** Knowledge-of-results must be immediate and re-experienceable (Moulton's Golden Ears loop: alternate flawed/flat until the flaw pops out). Feedback screen always offers: correct answer, **Hear A/B again** chips, and one-tap **See it** (mini spectrum/waveform from the same buffer). This bridge to the measurement tools is the lab's differentiator.
- **Difficulty ladders sized by JND.** Level JND ≈ 0.5–1 dB broadband (Miller 1947) → loudness ladder bottoms at 1 dB. Frequency JND for pure tones is far finer (~0.2–0.5%, Wier et al. 1977) than third-octave spacing (~26%), so frequency ladders are about **categorical labeling** (octave → third-octave), the skill Letowski called "timbre solfege," not raw discrimination. EQ detection is easier for boosts than cuts and for wide Q than narrow (Bech & Zacharov; Corey) → ladders start ±12 dB wide boosts, end ±3 dB cuts.
- **Level-up rule (uniform across modules):** advance at ≥80% correct over the last 20 trials at the current level; offer step-down below 50% (bracket the ~71% sweet spot of adaptive staircases without feeling punitive). Streaks shown per module; **mastery = top level at ≥80%**.
- **Anti-gaming:** randomize which slot (A/B/X) holds the target; randomize base playback level ±2 dB per trial (kills absolute-level anchoring); never repeat the same parameter twice in a row; re-render trials with fresh random phase/f0 so no clip is memorizable.

## 2. Modules

Answer UI patterns used below: **CHIPS** (choice chips, ≥44pt), **AB** (two transport chips + question), **ABX** (A, B, X chips; "X is A or B?"), **GRID** (frequency band grid).

### M1 — Frequency Recognition
- **Exercises:** (a) *Name the band*: one 1.5s tone plays → GRID of ISO third-octave centers; (b) *Higher/lower*: two tones sequential → AB; (c) *Find the target*: named target ("find 1 kHz") + 3 tones → CHIPS.
- **Ladder:** L1 octave centers only (63…16k, 9 choices) · L2 half-octave (13) · L3 full 25 third-octave, ±1-band credit · L4 full 25, exact only. Higher/lower ladder: 2 octaves → 1 → 1/3 → 1/6 apart.
- **Stimulus:** sine, 1.5s, 20ms raised-cosine fades, random start phase. Below 250 Hz add fixed makeup gain (+6 dB at 63 Hz tapering to 0 at 250) approximating equal loudness — documented, not claimed calibrated.
- **Scoring:** L3 adjacent band = half credit; exact = full.
- **See it:** mini log-axis spectrum, answer band highlighted; chosen vs actual markers.
- **Playback:** decent headphones recommended; **63–80 Hz is genuinely absent on phone speakers** (see §4).

### M2 — EQ Recognition
- **Exercises:** A (dry) vs B (one EQ move) on the same source → "what changed?": frequency (GRID, octave centers), direction (boost/cut CHIPS), amount (CHIPS: 3/6/9/12 dB).
- **Ladder:** L1 ±12 dB wide boosts · L2 ±9 boost+cut · L3 ±6, adds shelves + narrow notch · L4 ±3, all filter types. Boosts before cuts at each level (cuts measurably harder — Bech).
- **Stimulus:** source = pink noise OR harmonic complex (saw f0 110–220 Hz, 24 harmonics, gentle −6 dB/oct rolloff) as a program-material surrogate (**V2: real music stems would be better — marked**). Filters: RBJ biquads — peaking Q=1.4 (wide), Q=4.0 (narrow notch/boost); low/high shelf Q=0.707. Post-filter re-normalize RMS (the loudness-match rule).
- **Scoring:** frequency ±1 octave-center adjacent credit (half); direction must be exact; amount ±1 step credit at L1–L2.
- **See it:** dry vs processed spectra overlaid; filter curve drawn.
- **Playback:** headphones recommended.

### M3 — Band Identification
- **Exercises:** same A/B "what AREA changed?" → CHIPS with the 8 named bands: Sub Bass 20–60 · Bass 60–250 · Low Mid 250–500 · Mid 500–2k · Upper Mid 2k–4k · Presence 4k–6k · Brilliance 6k–16k · Air 16k+.
- **Ladder:** L1 ±12 dB, 4 coarse bands (Bass/Mid/Presence/Brilliance) · L2 ±9, all 8 · L3 ±6 · L4 ±4, adjacent-band credit removed.
- **Stimulus:** shares M2's renderer; boost/cut centered on the band's log-center, Q sized to band width.
- **Scoring:** adjacent band = half credit L1–L3.
- **See it:** spectrum with 8 labeled band regions; changed region glows.
- **Playback:** headphones recommended; Sub Bass and Air trials flagged (§4).

### M4 — Noise & Waveform Identification
- **Exercises:** one clip → CHIPS: white/pink/brown noise; sine/square/saw/triangle (random f0 200–800 Hz, fresh each trial).
- **Ladder:** L1 noise-vs-tone families separated · L2 all 7 mixed · L3 shorter clips (0.8s) + A/B "which is pink?" pairs.
- **Stimulus:** white = uniform random; pink = Voss-McCartney or −3 dB/oct FIR; brown = integrated white (−6 dB/oct), DC-blocked. Waveforms band-limited (additive to Nyquist/2 harmonics) to avoid aliasing.
- **Scoring:** exact only (7 discrete answers).
- **See it:** spectrum slope overlay (flat / −3 / −6 dB per octave labeled) for noises; single-cycle waveform zoom for shapes.
- **Playback:** any.

### M5 — Audio Defect Recognition (owner #6)
- **Exercises:** defect plays alone (L1) or under a rendered "program bed" (chord pad + soft drum pulse, our surrogate) → CHIPS "what problem do you hear?" 12 answers, introduced in groups.
- **Ladder:** L1 defect solo, 6 common ones (hum, hiss, distortion, clipping, dropout, click) · L2 all 12 solo · L3 under bed at −20 dB · L4 under bed at −30/−35 dB.
- **Stimulus recipes (all offline synthesis):**
  - *Hum:* 50 or 60 Hz sine + 2nd (−12 dB) + 3rd (−18 dB). *Ground loop:* hum family but rectified — dominant 100/120 Hz + rich even harmonics to ~1 kHz (labeled "(emulation)").
  - *Buzz:* 50/60 Hz band-limited pulse train (odd-harmonic-rich to 5 kHz) — edgy vs hum's smooth.
  - *Hiss:* white noise, −40 dBFS, gentle 3 kHz presence tilt. *Crackle:* Poisson impulses (~15/s, random amp, 8 kHz LPF). *Pop:* one 30ms half-cosine thump at 40–60 Hz. *Click:* 1–3 sample impulse, full band.
  - *Distortion:* tanh waveshaper on the bed, drive 6–18 dB. *Clipping:* hard clip at −6…−1 dBFS of peaks.
  - *Dropout:* 80–300 ms zeroed with 5ms fades. *Digital glitch:* 20–60 ms of block-repeated/shuffled samples (buffer stutter) + brief aliased noise.
  - *RF interference:* GSM-style 217 Hz pulsed AM bursts of a 1–2 kHz buzzy carrier (labeled "(emulation)").
- **Scoring:** exact; confusable pairs (hum/ground-loop, distortion/clipping, crackle/click) earn half credit at L1–L2, full distinction required L3+.
- **See it:** spectrum for tonal defects (hum harmonics visible!); waveform strip for impulsive/dropout/clip defects.
- **Playback:** any; hum fundamentals weak on phone speakers — harmonics carry it (note shown).

### M6 — Stereo Recognition (owner #7) — **HEADPHONES REQUIRED**
- **Exercises:** one stereo clip → CHIPS: left/right/center/wide/narrow/mono/out-of-phase.
- **Ladder:** L1 L/R/C/mono · L2 + wide/narrow · L3 + out-of-phase · L4 A/B "which is wider?" (subtle M/S ratios).
- **Stimulus (stereo buffers):** source = pink burst + tone mix. Pan = constant-power L/R/C. Wide = mid/side with S boosted +6 dB plus 8 ms Haas offset on side content; narrow = S −8 dB; mono = identical channels; out-of-phase = one channel polarity-inverted.
- **Scoring:** exact; wide/narrow confusion half credit at L2.
- **See it:** goniometer (Lissajous) + correlation meter value computed from the buffer — the classic visuals, drawn offline.
- **Playback:** phone speaker(s) collapse everything — module refuses to score without the headphone acknowledgment (§4). Honest note: true out-of-phase *cancellation* is a speaker phenomenon; on headphones it reads as "in-head/diffuse" — copy says so.

### M7 — Loudness Recognition (owner #8)
- **Exercises:** same clip twice at different levels → AB "which is louder?"; then CHIPS "by about how much?" (1/2/3/6 dB).
- **Ladder:** 6 → 3 → 2 → **1 dB** (broadband level JND ≈ 0.5–1 dB — Miller 1947; stop at 1, don't frustrate).
- **Stimulus:** pink burst or harmonic complex; only gain differs. Base level randomized ±2 dB per trial (anti-anchoring). The ONE module exempt from loudness matching, obviously.
- **Scoring:** direction exact; magnitude ±1 chip credit at 6/3 dB levels.
- **See it:** two bars on the **amplitude color ramp** (sacred — this is a level visual) with dB delta labeled.
- **Playback:** any. Copy: "This teaches gain awareness — the 1 dB you learn here is the 1 dB clients can't name but feel."

### M8 — Delay Recognition (owner #9)
- **Exercises:** (a) AB "which has a delay?"; (b) 3 clips "which delay is longest?" CHIPS A/B/C; (c) "about how long?" CHIPS 50/100/250/500 ms.
- **Ladder:** L1 500 ms · L2 250 · L3 100 · L4 50 ms — below ~30–50 ms echoes fuse with the direct sound (Haas 1951), which is exactly where Comb Filtering (M13) picks up; the two modules cross-link in copy.
- **Stimulus:** transient-rich source (rendered click+tone "pluck" pattern); single echo at −6 dB, one repeat. Longer trials use 1–2 repeats with feedback 0.3.
- **Scoring:** time chip ±1 adjacent credit at L1–L2.
- **See it:** waveform with direct and echo onset markers + ms ruler.
- **Playback:** any.

### M9 — Reverb Recognition (owner #10) — everything labeled **"(emulation)"**
- **Exercises:** (a) space type CHIPS: room/hall/plate/chamber/spring; (b) decay CHIPS: short/medium/long; (c) tone CHIPS: bright/dark.
- **Ladder:** L1 dry-vs-wet AB · L2 short/medium/long · L3 room vs hall vs plate · L4 all five spaces · L5 bright/dark within a space.
- **Stimulus:** Schroeder reverberator, offline: 4 parallel combs + 2 series allpasses (allpass g=0.7, 5.0/1.7 ms). Parameter sets — *Room:* combs 29/31/37/41 ms, RT 0.4s, damping LPF 6 kHz, predelay 0. *Chamber:* combs 37/41/47/53, RT 1.0s, LPF 5 kHz, predelay 10 ms. *Hall:* combs 50/56/61/68, RT 2.2s, LPF 3.5 kHz, predelay 25 ms. *Plate:* combs 31/37/41/43 + 2 extra allpasses (density), RT 1.6s, LPF 9 kHz (bright), predelay 0. *Spring:* dispersive allpass chain (8 allpasses, freq-dependent delay) + 2.5 Hz flutter AM, RT 1.8s — the "boing" is dispersion. Decay variants scale comb feedback for RT 0.5/1.2/2.5s; bright/dark = damping LPF 8 kHz vs 2 kHz.
- **Scoring:** room/chamber and hall/plate confusions half credit at L3–L4.
- **See it:** decay envelope (Schroeder backward integration of the same buffer) with RT60 slope line — direct bridge to the Wave lab's reverb module.
- **Playback:** headphones recommended (low-level tails vanish on phone speakers).

### M10 — Compression Recognition (owner #11)
- **Exercises:** (a) AB "which is compressed?"; (b) CHIPS none/light/moderate/heavy/pumping; (c) AB "which sounds most natural?"
- **Ladder:** L1 none vs heavy · L2 none/moderate/heavy · L3 all five · L4 none vs light (the hard one — near-transparent).
- **Stimulus:** source = rendered drum pattern (kick = 60 Hz decaying sine + click, snare = 100 ms noise burst, 4 bars at 100 BPM — fully synthesizable offline; **V2: real drum loop marked**). Offline feed-forward compressor: peak envelope follower → gain computer → smoothing. Settings — *Light:* 2:1, thr −18, att 30 ms, rel 200 ms. *Moderate:* 4:1, −24, 10, 150. *Heavy:* 8:1, −30, 5, 100. *Pumping:* 10:1, −35, att 1 ms, rel 400 ms so gain audibly swells between kick hits. Makeup gain then RMS re-match (compression must be heard as envelope change, not level).
- **Scoring:** adjacent intensity half credit L2–L3; pumping exact.
- **See it:** waveform + gain-reduction trace overlay (we computed the envelope — plot it), GR in dB on the amplitude ramp.
- **Playback:** any; headphones recommended for light settings.

### M11 — Pitch Recognition (owner #12)
- **Exercises:** two notes sequential → AB "which is higher?"; then CHIPS interval ID.
- **Ladder:** higher/lower: 12 → 7 → 4 → 2 → 1 semitone. Intervals: L1 {unison, P5, octave} · L2 + {M3, P4} · L3 + {m3, M2, M6} · L4 full 12. (Untrained pitch-direction JND is coarse; interval naming is a learned category task — musician pedagogy, not JND.)
- **Stimulus:** harmonic complex (saw, 6 harmonics, −6 dB/oct) — complex tones give stronger pitch salience than sines (virtual pitch, Terhardt). Root randomized A2–A4; 1s notes, 150 ms gap.
- **Scoring:** interval ±1 semitone adjacent credit at L1–L2.
- **See it:** two markers on a piano-strip graphic + spectrum showing the harmonic stacks.
- **Playback:** any.

### M12 — Polarity & Phase (owner #13)
- **Exercises:** "two mics on one source, summed": (a) AB "which sum is fuller?" (in-polarity vs inverted); (b) CHIPS normal/inverted/partial-cancellation. Honesty rule: a lone polarity flip of a symmetric tone is **inaudible** — we never test it; we always test the *sum*, which is the real-world skill (snare top/bottom).
- **Ladder:** L1 identical copies (inverted sum = near-silence — dramatic) · L2 copies offset 0.2 ms (deep hollow notch comb, not full null) · L3 offset 0.5 ms + level mismatch 3 dB (subtle low-end loss).
- **Stimulus:** mono. Source = drum pattern from M10. Sum = copy1 + (±copy2 delayed 0–0.5 ms, gain-matched or −3 dB), then RMS re-match EXCEPT L1 where the cancellation level drop is the lesson (documented exemption).
- **Scoring:** exact.
- **See it:** overlaid waveforms of the two copies + resulting sum spectrum (the LF hole is unmistakable).
- **Playback:** headphones recommended. Note in copy: on speakers in a room, phase games get even messier — that's the Wave lab's interference module.

### M13 — Comb Filtering (owner #14)
- **Exercises:** AB "which is comb filtered?" then ABX at the top level.
- **Ladder:** delayed-copy level 0 dB (deep combs) → −3 → −6 → −9 dB (shallow); delay randomized 0.5–10 ms each trial (moves the comb so learners hear the *character* — "phasey/hollow" — not one notch pattern).
- **Stimulus:** pink noise or drum bed; y = x + g·x[n−d], RMS re-matched. Shares M8's delay-line renderer.
- **Scoring:** exact (binary/ABX).
- **See it:** spectrum with the comb notches + "notch spacing = 1/delay" caption — direct bridge to Wave lab module 7.
- **Playback:** headphones recommended (room reflections add their own combs over speakers — genuinely confusing; say so).

### M14 — Clipping Recognition (owner #15)
- **Exercises:** (a) AB clean vs clipped; (b) CHIPS clean/mild/moderate/severe; (c) ABX for mild at top level.
- **Ladder:** severe → moderate → mild. Definitions on the M10 drum source: *mild* = hard clip at 99th-percentile peak −1 dB (only transient tips), *moderate* = −4 dB (audible crunch), *severe* = −10 dB (square-ish). RMS re-matched after clipping (clipping raises density — without matching it's a loudness test).
- **Scoring:** adjacent severity half credit at L2.
- **See it:** waveform zoom on flattened peaks + spectrum showing added odd harmonics.
- **Playback:** any; phone-speaker distortion can mask mild clipping (note shown).

## 3. Shared framework

- **Files:** `src/screens/lab/ear/` — `EarLabHomeScreen.tsx` (module list, Rack Unit style), `EarModuleScreen.tsx` (shell + dock), `modules/registry.ts`, `engine/` (renderers), `engine/wav.ts` (**new util — none exists in the codebase**: PCM Float32 → 16-bit WAV bytes → base64 file in cache dir → expo-audio player).
- **Registry (mirrors `WAVE_MODULES` in `src/screens/lab/wave/modules/registry.ts`):**
  `EAR_MODULES: { id: EarModuleId; num: string; title: string; blurb: string; phones: 'required'|'recommended'|'any'; family: 'tone'|'dynamics'|'time'|'space'|'defect'|'pitch'; member: boolean }[]`
- **Trial state machine:** `idle → rendering → ready → presenting → answering → feedback → next`. Render the NEXT trial's buffers during `feedback` (clips are ≤6s mono — sub-second synth; never block the answer UI). All buffers freed on module exit.
- **Player UI:** transport chips **A / B / X** (≥44pt), tap toggles play from start; active chip shows a progress ring. Replays **unlimited at L1–L2, capped at 2 per clip at top level** (Moulton: repetition builds the category; SoundGym: limits sharpen recall — we use both, by level). Answering stops playback. Auto-loudness rule from §1 enforced in the renderer, not per-module code.
- **Feedback panel:** correct/incorrect, the true parameter, Hear-again chips (both stimuli stay resident), **See it** expander (offline FFT: 4096-pt Hann, log freq axis; waveform strip where specified). Level visuals use the app amplitude ramp only.
- **Persistence (device-local AsyncStorage, key `ape.ear.v1`):**
  `{ [moduleId]: { level: number; trials: { ts: number; level: number; correct: boolean }[] /* last 50 */; bestStreak: number; mastered: boolean } }`
  Level-up/down per §1. Mastery can later feed the lab-credit bridge (`mark_lab_complete`, immutable key per module, per the R6c pattern) — wire-ready, not wired in V1.
- **Catalog:** lives in **Training Labs** as "Ear Training Lab." Recommend: **M1 level 1, M4, and M7 free** (a real taste of the flagship), everything else member — same pattern as Audio Fundamentals. **Owner decides.**
- **Audio gate:** every module screen goes through `requestAudioOutput()`; silent until enabled; red frame active as app-wide.

## 4. Headphone / speaker guidance (per-module capability note shown in the dock)

Each module shows a one-line playback note; `phones: 'required'` modules (M6) show a blocking acknowledgment ("I'm on headphones") before scoring counts. Modules touching ≤80 Hz (M1 low bands, M3 Sub Bass, M5 hum fundamentals, M10 kick) offer an optional **"My playback can't do sub-bass"** toggle that excludes those trials from the ladder rather than punishing the learner for their transducer.

| # | Module | Phones | Note |
|---|--------|--------|------|
| 1 | Frequency | Recommended | 63–80 Hz absent on phone speakers; sub-bass toggle offered |
| 2 | EQ | Recommended | Low-shelf trials need real LF extension |
| 3 | Band ID | Recommended | Sub Bass + Air bands flagged; toggle offered |
| 4 | Noise/Waveform | Any | Slopes survive small speakers |
| 5 | Defects | Any | Hum heard via harmonics on small speakers |
| 6 | Stereo | **REQUIRED** | Phone speakers collapse the image; blocking ack |
| 7 | Loudness | Any | Relative levels survive any transducer |
| 8 | Delay | Any | Temporal, not spectral |
| 9 | Reverb | Recommended | Quiet tails vanish on phone speakers |
| 10 | Compression | Recommended | Kick-dependent; sub-bass toggle for pumping trials |
| 11 | Pitch | Any | Complex tones carry pitch anywhere |
| 12 | Polarity | Recommended | LF cancellation needs LF; true speaker phase is Wave lab turf |
| 13 | Comb | Recommended | Room reflections add their own combs over speakers |
| 14 | Clipping | Any (good phones for "mild") | Speaker distortion masks mild clipping |

## 5. Honesty & safety checklist (this lab)

- [ ] All reverbs/spring/RF/ground-loop labeled **"(emulation)"** in the answer chips and feedback copy.
- [ ] Never claim calibrated SPL or "dB SPL"; loudness module speaks only in **relative dB**.
- [ ] LF makeup-gain table (M1) documented in feedback copy as an approximation, not equal-loudness calibration.
- [ ] Loudness-matching exemptions (M7 entirely; M12 L1) stated in module intro copy.
- [ ] M12 never pretends a lone polarity flip is audible; M6 says out-of-phase ≠ speaker cancellation on headphones.
- [ ] Program "bed"/drum sources labeled as rendered surrogates; real-music variants marked V2.
- [ ] Default render level −20 dBFS RMS; audio gate + red frame on every module; 15-min fatigue nudge.
- [ ] All strings flagged **NEW COPY — owner review** (including this spec's example copy).

## 6. Build order (tonight — lab is shippable after every wave)

| Wave | Ships | Shared renderer |
|------|-------|-----------------|
| 0 | `wav.ts` encoder, engine core (osc/noise/RBJ biquad/envelopes/offline FFT), trial state machine, answer-UI kit (CHIPS/AB/ABX/GRID), persistence, registry, EarLabHomeScreen | — |
| 1 | **M1 Frequency, M3 Band, M2 EQ, M4 Noise** | tone family: osc + noise + biquad + spectrum view |
| 2 | **M7 Loudness, M10 Compression, M14 Clipping** | dynamics family: drum-pattern source + envelope follower + waveshaper + GR/waveform view |
| 3 | **M8 Delay, M13 Comb, M12 Polarity, M9 Reverb** | time family: delay line kit → combs/allpasses → Schroeder; decay-envelope view |
| 4 | **M6 Stereo (adds stereo WAV path), M5 Defects, M11 Pitch** | space/defect family: stereo buffers + goniometer; defect synth grab-bag |

Wave 1 alone is a working, honest lab (the freq/EQ/band core every trainer starts with). Waves 2–4 each reuse the prior wave's DSP.
