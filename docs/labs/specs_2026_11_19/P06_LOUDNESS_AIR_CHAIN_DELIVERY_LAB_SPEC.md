# P06 Loudness, Air Chain & Delivery Lab: build specification

Written 2026-11-19 by ccode. This is a SPEC ONLY: nothing is built, listed or published until the owner's explicit GO (D56: Opus HIGH effort).
Inputs: Comp B proposal P06 and HOLD list (docs/labs/new_lab_proposals_2026_11_18/COMP_B_TO_CCODE_2026-11-18_NEW_LAB_PROPOSALS.html, section 7), owner decisions OWNER_DECISIONS_2026_11_19.md (all HOLD defaults accepted), docs/APE_LAB_VISUAL_CHARTER_2026_10_04.md, AGENTS.md, and the code named below (read on branch ota-after-approval-39-23).

---

## 1. Summary for the owner

**What the learner does.** The learner plays real programmes (a music track, a talk podcast with pauses, a short TV-style ad) through a loudness meter and watches how it decides: the frequency weighting, the 400 ms blocks, the two gates that throw silence away, and the four numbers (momentary, short-term, integrated, loudness range) plus true peak. They then bring each programme to a destination picked from a popup (European TV, US TV, a music service, a podcast platform, or their own spec). Each destination's numbers come from one owner-maintained table that shows a "checked on" date. They turn the gain first and use a limiter only when the peak ceiling forces it. Next they see true peak drawn between the samples, and hear and measure what lossy codecs do at falling bitrates. They push a bright mix through a radio air chain (AGC, multiband compressor, limiter, clipper, 50 or 75 µs pre-emphasis) and hear and see what it does. They build mix-minus feeds for two remote guests and a phone caller on an on-air console. Finally they QC a delivery file line by line against a spec sheet, and finish with a capstone: three programmes to three destinations, each change explained.

**Size.** L: 6 modules, 29 screens plus the shared "what's left" end screen. The nearest comparison is the Game Audio Lab (115 files, about 26,000 lines). Expect about the same.

**Credit.** One whole-lab key, `tr_loudness_delivery`, completes when all six modules are done. Six module keys (`lad_measure`, `lad_targets`, `lad_codecs`, `lad_airchain`, `lad_onair`, `lad_qc`) let a credential require only the modules its job needs, the same way Ear Training and the Mixing pages work today. Members only (H22). Credit is never removed, the lab never blocks navigation, and it ends on the shared "what's left" screen.

**Native build: NO.** Everything runs in the JavaScript layer and can ship by OTA on the owner's word. The native engine (modules/ape-dsp) cannot measure LUFS: it has no K-weighting, no gating and no oversampled true peak, and it meters the microphone, not file playback. It is not used. Section 4 has the detail.

**What it needs from the owner** (asks; only the first one blocks part of the build):
1. An OK, at build time, to install a standard ffmpeg build on this PC, or to have Comp B render 12 codec files, and to download the free ITU and EBU loudness test files. Module 3's codec ladder cannot be rendered without an encoder, and the release check needs the test files. Section 8 has the detail.
2. Approval, at build time, of the credential rows in section 6. Two of them differ from Comp B's list, with reasons given.
3. Nothing else. The targets table is owner-maintained and reviewed twice a year (H06). I put the review dates on the must-do list when the lab is built. The new pre-emphasis equation goes into the calculator library as a function, not a new calculator tile, so "166 calculators" stays true. A longer spoken piece in the owner's voice would improve modules 1, 2 and 5, but it is optional: the lab builds its podcast from clips already in the lab-audio bucket.

---

## 2. Learning outcomes (knowledge, not skills)

After this lab the learner knows / understands:

1. How an integrated loudness value is produced: the K-weighting filter (a high shelf plus a high-pass), 400 ms blocks with 75 % overlap, the absolute gate at −70 LUFS, and the relative gate 10 LU below the first average.
2. What momentary (400 ms), short-term (3 s), integrated (gated, whole programme) and loudness range (LRA, in LU) each describe, and why they read differently on the same file.
3. That LUFS and LKFS are the same unit; that 1 LU is 1 dB of difference; and why a sample-peak meter, a VU meter and a loudness meter disagree about the same file.
4. That delivery targets belong to each destination, change over time, and must be checked against the destination's current spec each time. They are not a quality goal, and no single number is "the standard for everything".
5. What a streaming service's playback level is (where it turns loud tracks down), and how that differs from a broadcaster's delivery requirement.
6. What true peak is, why it can read higher than sample peak, and why lossy encoding can raise peaks, which is why delivery specs leave headroom.
7. How common codec artefacts sound and look: lost high frequencies, pre-echo before sharp attacks, and swirling or "birdie" artefacts at low bitrates.
8. What each stage of a broadcast air chain does (AGC, multiband compression, limiting, clipping), and why FM pre-emphasis (50 µs or 75 µs) makes treble the hardest thing for the processor to control.
9. What mix-minus and IFB are, why every remote guest and caller needs their own mix-minus, and what a broadcast delay unit is for.
10. How a delivery file is QC'd against a spec sheet (loudness, true peak, sample rate, bit depth, channel order, file naming, head and tail silence), and why a file can "measure fine" and still be rejected (sample peak versus true peak, ungated versus gated, dialogue-gated measurement, a mono file measured as one channel).

The intro screen claims these as knowledge ("you'll know how a meter decides…"), never as skills.

---

## 3. Screen-by-screen plan

**Shell.** A PagedLab-style lab with a module registry, like the DJ Systems Lab (`dj/pages/registry`, `labDoneKey`): shared LabNavBar, CONTENTS, NEXT that never blocks, and the last page opens LabEndScreen ("what's left", PRACTISE AGAIN, DONE).

**Live screens** use the **Rack Unit**: the display pinned on top, a well that scrolls, controls docked at the bottom, and a read-only bezel (BezelReadouts: a cropped readout drops its label, never its number). FULL SCREEN is a working surface and everything in it zooms (D35). Reading-only screens use the reading column.

**Text and meters.** All display text is at least 9 pt at 390 px after fit scaling (`fitValue`). Meters write shared values on every animation frame, never React state per frame. The loudness colour standard comes from `src/features/tools/levelColor.ts`. Peak readouts over a ceiling read red `#ff5a48`.

**Every meter label says what it measures:**
- SAMPLE PEAK dBFS
- TRUE PEAK dBTP
- MOMENTARY LUFS (400 ms)
- SHORT-TERM LUFS (3 s)
- INTEGRATED LUFS (gated)
- LRA LU
- VU (0 VU = −18 dBFS here, a stated alignment)

No meter shows a bare "dB" or a bare "dBFS".

**The standard display ("Loudness meter panel")** reused on most screens has three parts:
- Vertical bars for M, S, I and TP L/R, with numbers.
- A loudness-over-time graph: short-term as a solid line, momentary as a faint line, integrated as a level line, plus the chosen destination's target band and true-peak ceiling (dashed and labelled, so nothing relies on colour alone).
- The programme waveform under it on a real time base, with a playhead. The playhead and every bar read from one clock: the player's position, sampled each frame.

**Accuracy note.** One ⚖️ note sits behind the header ⓘ: "These meters measure the lab's own audio files the way the loudness standard describes. They do not measure what your speaker plays or the sound in your room." This is a measuring lab, so the chip applies (D37).

**Learner text names the standards** (BS.1770, EBU R 128, ATSC A/85) because they ARE the subject of this lab (topic gs4510). There is still no reference list, no citation codes and no badges (charter §12). Advice reads as suggested starting points ("a common place to start is…"). A destination's numbers read as "this destination asks for…", never as our rule.

**Help.** Every screen gets a screen guide (`loudnessScreenGuides.ts`) that speaks to the student and is custom to that screen. The column "Help intent" says what it must cover.

### Module 1: How loudness is measured (`lad_measure`)

| # | Title | Display | Dock controls | Learner action | Teaching intent | Help intent |
|---|---|---|---|---|---|---|
| 1 | Welcome and safe listening | Reading page with the lab map (6 modules) and the playback-level card | LOUDER / SOFTER monitor level (starts at 30 %, startLevel.ts), ■ STOP | Play the test programme at a comfortable low level, stop it, find STOP | What the lab covers; the monitor level is not a measured sound level; the app-wide −12 dB ceiling | "You're setting how loud the PHONE plays, not how loud the file is. The meters measure the file." |
| 2 | Three meters, one file | Meter panel with a sample-peak bar, a VU needle (300 ms ballistics) and integrated LUFS, side by side on the same file | Programme popup (speech / music / ad), ▶ ■ | Play all three programmes; note which meter says which is "loudest" | Peak, VU and loudness answer different questions; the loudest peak is not the loudest-sounding programme | Explains each meter's label and what it reacts to |
| 3 | The ear's weighting | K-weighting response curve (the shelf and the high-pass drawn separately, then combined), with the programme spectrum behind it | Toggle the shelf and the high-pass on/off (drawing only), ▶ ■ | Switch each stage and watch the bass and the treble change weight | The meter weights frequencies the way loudness is heard; low bass counts less, upper mids and treble count a little more | What each curve stage does, in words; "this curve is the meter's, not your ears'" |
| 4 | Blocks and gates | The programme cut into 400 ms blocks (75 % overlap shown on a zoomed strip); each block a bar coloured by its loudness; the −70 LUFS absolute gate line, then the relative gate line drawn 10 LU below the first average; gated blocks greyed and hatched | STEP (absolute gate → first average → relative gate → final average), ▶ ■, programme popup | Step through the gating on the podcast (which has pauses) and the music; watch the silence drop out | Why the integrated number ignores silence and very quiet passages, so a podcast with pauses is not "quieter" than it sounds | Explains each step in plain words; why there are two gates |
| 5 | Four numbers | Full meter panel live; LRA drawn as the 10th–95th percentile span of the short-term values (after its own gates) | ▶ ■, programme popup, a "freeze at playhead" key | Play each programme; compare M, S, I and LRA; answer "which number changes fastest?" | Momentary vs short-term vs integrated vs range; LRA describes how much the loudness moves, not how loud it is | What each number is for, and who uses it |
| 6 | Module check | Check card (4 questions, every option explained, every reasonable answer accepted) | — | Answer | Confirms outcomes 1–3 | "A wrong answer only explains; try again" |

### Module 2: Targets by destination (`lad_targets`)

| # | Title | Display | Dock | Learner action | Teaching intent | Help intent |
|---|---|---|---|---|---|---|
| 7 | Where it's going | The destinations table from the owner table (section 5): loudness, true-peak ceiling, what kind of number it is (delivery requirement / playback level / recommendation), "checked on" date | Destination popup (popups, never pulldowns) | Open each destination and read its row | Targets belong to destinations and change; a playback level is not a mastering requirement | How to read a row; "check the destination's current spec before every delivery" |
| 8 | Gain first | Meter panel with the destination's target band and ceiling | GAIN lane (dB, signed, snapped to 0.1 dB), destination popup, programme popup, ▶ ■ | Bring each programme into the band with gain only | Gain moves integrated loudness and true peak by exactly the same dB; it changes level, not tone | Why gain is the first move; the measured number updates without re-measuring because gain is linear |
| 9 | When gain isn't enough | Same panel plus a gain-reduction meter for a true-peak limiter | GAIN, LIMITER ceiling (dBTP), ▶ ■ | Bring the ad to a loud target where gain alone breaks the ceiling; add only as much limiting as needed | Processing is a second step, with a cost; how much limiting a target forces | What the GR meter shows; "start with the least" |
| 10 | Measured fine, rejected | Four "rejected file" case cards. Each opens the meter on the same file measured two ways side by side: sample peak vs true peak; ungated vs gated; whole-programme vs dialogue-gated (the lab knows where its own speech is; a real meter uses a speech detector, said once); a mono file measured as one channel vs as two (3.01 dB apart) | Case popup, ▶ ■ | Find why each file was rejected | Each rejection is a measurement-method mismatch, not a bad mix | One hint per case, written to the student |
| 11 | Module check | Check card (4 questions) | — | Answer | Outcomes 4, 5, 10 | as above |

### Module 3: True peak and codecs (`lad_codecs`)

| # | Title | Display | Dock | Learner action | Teaching intent | Help intent |
|---|---|---|---|---|---|---|
| 12 | Between the samples | A zoomed waveform: samples as dots, the reconstructed signal drawn through them (4× oversampled), the inter-sample over marked above the highest sample; sample-peak and true-peak readouts | Zoom STEP, a "nudge the phase" control (moves the sine's phase against the sample grid), ▶ ■ | Find a phase where the true peak is well above the highest sample | Why true peak can read higher than sample peak; the converter draws the line, not the dots | "The dots are what's stored; the line is what comes out of the converter." |
| 13 | The bitrate ladder | Spectrum (log frequency) of the original and of each rung, with the measured high-frequency cut-off line; meter panel showing true peak per rung | Rung popup (original + 5 rungs, section 4.4), programme popup, ▶ ■ | Step down the ladder and watch the top end and the true peak | Lower bitrates remove high frequencies and can raise true peak; the numbers shown are MEASURED from these files (other encoders differ) | What the cut-off line is; why the peak can rise after encoding |
| 14 | Hear the artefacts | Three short A/B cards: lost highs, pre-echo (a sharp attack, the smear drawn before it on a zoomed waveform), swirling/"birdies" (spectrogram strip) | A / B toggle, ▶ ■ | Listen to each pair; the visual carries the lesson if the phone speaker hides it | What each artefact sounds and looks like | "If you can't hear it on this speaker, the picture shows where it is." |
| 15 | Headroom for encoding | Meter panel: a master at −0.1 dBTP vs the same master at −1 and −2 dBTP, each encoded at the lowest rung, true peak after decoding | Version popup, ▶ ■ | Compare true peak after encoding | Why delivery specs leave true-peak headroom before lossy encoding | Ties back to the destinations table ceilings |
| 16 | Module check | Check card (4 questions) | — | Answer | Outcomes 6, 7 | as above |

### Module 4: The broadcast air chain (`lad_airchain`)

| # | Title | Display | Dock | Learner action | Teaching intent | Help intent |
|---|---|---|---|---|---|---|
| 17 | Studio to transmitter | Chain map: studio console → studio-transmitter link → processor (AGC → multiband → limiter → pre-emphasis → clipper) → stereo encoder → transmitter. Each block an illustrated real object, not a box | Tap a block (opens its explainer popup) | Open every block | What each stage is for, in order | Says the drawing is a simplified generic chain; real stations differ |
| 18 | AGC and multiband | Chain view with a gain-reduction meter on the AGC and on each band (e.g. 4 bands), plus the meter panel | Per-stage DRIVE / BYPASS, programme popup, ▶ ■ (matched-loudness A/B available) | Bypass and engage each stage | Slow AGC rides level; the multiband shapes density and tone band by band | What a GR meter reads; why matched loudness is needed to judge fairly |
| 19 | Pre-emphasis | Pre-emphasis curve for 50 µs and 75 µs computed by the calculator function (turnover marked; boost at 15 kHz printed); the 15 kHz audio low-pass of FM stereo marked | Pre-emphasis popup (50 µs / 75 µs), frequency cursor | Read the boost at any frequency; compare the two curves | Pre-emphasis lifts treble before the limiter and clipper, so a bright mix hits the ceiling first in the treble | How to read the curve; "50 µs is used in Europe, 75 µs in the Americas" (from the source, section 5) |
| 20 | A bright mix on air | Chain view with every GR meter + meter panel + spectrum before/after the chain | Programme popup (normal mix / bright mix), pre-emphasis popup, chain IN/OUT, ▶ ■ (matched-loudness and "as broadcast" modes, both under the playback cap) | Push the bright mix through both pre-emphasis settings; listen and watch the treble band's GR | Bright mixes lose treble or turn harsh on FM; the processor makes things denser and louder-sounding | What to listen for; that the lab's processor is a model, not any brand's |
| 21 | Module check | Check card (4 questions) | — | Answer | Outcome 8 | as above |

### Module 5: The on-air studio (`lad_onair`)

| # | Title | Display | Dock | Learner action | Teaching intent | Help intent |
|---|---|---|---|---|---|---|
| 22 | The on-air console | Illustrated radio console: host mic, co-host mic, music playout, two remote guests on codecs, one phone caller through a telephone hybrid; PROGRAM, AUDITION and three mix-minus buses; routing drawn as traceable parallel lanes (cables never merged) | Tap a channel to see its sends | Trace where each source goes | Buses on an on-air console and what each feeds | Names each bus in plain words |
| 23 | The guest who hears themselves | Return path drawn with the round-trip delay; the guest's earpiece feed waveform showing their own voice coming back late | MIX-MINUS ON/OFF for guest A, ▶ ■ | Hear the echo, then fix it | Why a guest hearing themselves delayed can't talk; mix-minus = everything minus their own source | "The delay in this example is a set value; real codec and network delay varies." |
| 24 | Build three mix-minuses | The console with a send matrix | Send toggles per source × mix-minus bus | Build correct feeds for guest A, guest B and the caller; the model checks each feed | Every remote gets their own mix-minus; the caller's feed must exclude the caller | One hint per wrong send ("guest B hears guest B") |
| 25 | IFB and the delay unit | IFB talkback interrupting the guest's program feed; a broadcast delay unit before the transmitter with DUMP | TALK key, DELAY in/out, DUMP | Talk to a guest without the audience hearing; dump a mistake | What IFB is; what a delay unit is for (no claim of a typical delay length) | Plain words for both |
| 26 | Module check | Check card (4 questions) | — | Answer | Outcome 9 | as above |

### Module 6: QC and delivery (`lad_qc`)

| # | Title | Display | Dock | Learner action | Teaching intent | Help intent |
|---|---|---|---|---|---|---|
| 27 | The spec sheet | A client's delivery spec sheet, made up but written like real ones: loudness and tolerance, measurement method, true-peak ceiling, sample rate, bit depth, channel order, file-naming pattern, head and tail silence | Spec popup (TV / streaming music / podcast sheets) | Read each line | Every line of a spec is checked; a fictional client's numbers stand in for a real one, and the sheet says so | How to read a spec sheet |
| 28 | Line-by-line QC | The learner's own programme from module 2 (its gain/limiter settings carried over), checked line by line: PASS / FAIL with the measured value and the reason | Spec popup, RE-CHECK | Read the report; find each failure | QC is measurement plus metadata; a file can fail on a line that has nothing to do with sound | Explains each FAIL reason |
| 29 | Capstone: three to three | Three programmes × three destinations grid; each cell opens the meter panel with the target band, then a short "why" choice | GAIN, LIMITER, destination, ▶ ■ | Bring each programme to its destination and pick the reason for each change | Ties every module together; explaining the change is the knowledge | "There is more than one good answer; the check accepts every reasonable one." |
| (end) | What's left | Shared LabEndScreen: every page not yet done by name with a jump link, PRACTISE AGAIN, DONE | — | — | — | — |

**When a screen counts as done.** A screen is done when its Do task is done. The task is checked by the model: for example, every programme inside the band on screen 8, all three feeds correct on screen 24, or every check question answered correctly with retries allowed. NEXT is never held. A module is done when all of its screens are done.

---

## 4. Audio and DSP

### 4.1 What exists today (read 2026-11-19)

- **Native engine (`modules/ape-dsp`, EngineHub.hpp).** It meters MICROPHONE CAPTURE only, with:
  - Z/A/C-weighted RMS with Fast (125 ms) and Slow (1 s) ballistics;
  - sample peak (which may exceed 0 dBFS, finding F1), peak hold and clip runs;
  - Leq Z/A;
  - FFT bands, spectrum, YIN pitch and a waveform envelope.

  It has **no K-weighting, no 400 ms block gating, no momentary or short-term LUFS, no LRA and no oversampled true peak.** Its only oversampling is the 4× toggle on the distortion clippers in Effects.hpp. It never sees file playback.
- **JavaScript (`src/screens/lab/mixing/engine/advanced.ts`).**
  - `kWeight()` uses the PUBLISHED BS.1770 48 kHz pre-filter and RLB coefficients. The house DSP rate `SR` is 48,000 in `src/features/ear/earDsp.ts`, so these are exact.
  - `loudnessLufsEstimate()` does 400 ms blocks with 75 % overlap, the −70 LUFS absolute gate, the −10 LU relative gate and the −0.691 offset.
  - `truePeakDbEstimate` / `truePeakDbFast` do 4× oversampling with an 8-tap Hann-windowed sinc. This is NOT the BS.1770 Annex 2 filter, which is why that lab labels it an ESTIMATE.
  - The Mastering Lab (`mastering/masteringEngine.ts`) adds a 3 s short-term series.
  - LRA is NOT implemented anywhere.
  - The Visual Audio Analysis lab's loudness module (`meter/meterEngine.ts`) is a simplified teaching model and says so. It is not a meter.
- **Playback.** Audio is rendered offline in JS and played through expo-audio by `EarClipPlayer`, behind the app-wide output gate. `outputCeiling.ts` caps every file player at −12 dB (`PLAYBACK_CEILING_DB`). Recorded teaching clips come from the lab-audio bucket (`labClipBuffer.ts`: edge function, signed URL, cached WAV, `wavDecode.ts`, resampled to 48 kHz). All of it is OTA-safe.

### 4.2 How this lab measures (new pure module `src/features/loudness/bs1770.ts`)

All measurement runs on the decoded 48 kHz float buffers that the lab plays, offline, in pure TypeScript. That means it runs in Node tests, in Hermes on both platforms and in the web preview, identically.

**K-weighting.** Reuse `kWeight()` exactly: the 48 kHz published coefficients. Every source is resampled to 48 kHz by the existing loader, so no other rate's coefficients are ever needed. A guard throws if a buffer arrives at another rate.

**Block powers.** Per channel, take the mean square of the K-weighted signal over 400 ms blocks with a 100 ms hop (75 % overlap). Combine the channels as L_k = −0.691 + 10·log10(Σ G_i·z_i), with G = 1.0 for L, R and C, and G = 1.41 for the surround channels. The LFE is excluded. This lab only plays mono and stereo, but the function takes the weights so a 5.1 measurement stays correct. A mono file can be measured as ONE channel (the BS.1770 reading) or as dual mono, which is 3.01 dB higher. Screen 10 shows both, labelled.

**Momentary.** The 400 ms block loudness, ungated, one value every 100 ms (a 10 Hz series).

**Short-term.** A 3 s sliding window, ungated, one value every 100 ms.

**Integrated.**
1. Keep the blocks above the −70 LUFS absolute gate.
2. Average their powers.
3. Set the relative gate at that average − 10 LU.
4. Average the blocks above both gates.

The function also returns the gate values and the kept/discarded mask, because screen 4 draws them.

**Running integrated** (the value as the programme plays): the same procedure over the blocks up to the playhead, precomputed per 100 ms step.

**LRA** (EBU Tech 3342):
1. Take the short-term values at 10 Hz.
2. Apply the absolute gate at −70 LUFS.
3. Apply a relative gate at the gated mean − 20 LU.
4. LRA = 95th percentile − 10th percentile, in LU.

The function also returns the two percentile values for the screen 5 drawing.

**Dialogue-gated (screen 10 only).** Integrated loudness over only the blocks inside the lab's own dialogue regions. The lab authored the programme, so it knows where the speech is. Said once: "a real meter finds speech with a detector".

**True peak.**
- Implement BS.1770 Annex 2: 4× oversampling at 48 kHz with the Annex's published 48-tap FIR (12 taps per phase), taking the absolute maximum of the oversampled signal per channel, in dBTP.
- In floating point the Annex's optional −12.04 dB integer-headroom attenuation is not needed and is not applied.
- The existing 8-tap estimate stays where it is. The Mastering and Advanced Mixing labs are NOT changed by this build, so none of their pinned numbers move. Moving them onto the shared module later is an optional, separate change.

**Sample peak.** The absolute maximum sample per channel, in dBFS.

**VU (screen 2).** Full-wave rectified average with the standard VU ballistics (99 % of the final reading in 300 ms), modelled in TS. The display states its alignment, 0 VU = −18 dBFS. That alignment is an assumption, labelled once. Any dBu shown uses `DBU_REF_V` from `calcUnits.ts`.

**Gain shortcut.** Gain is linear, so after a gain-only change every loudness and peak value shifts by exactly that many dB with no re-measurement. This is the masteringEngine `applyGain` pattern, pinned by a test. A limiter, the air chain or a codec rung is re-measured.

**Performance.**
- Programmes are 30 s for modules 1–2 (long enough for gating and LRA to mean something) and 10–15 s for modules 3–6.
- K-weighting and the block powers are cheap.
- True peak is the cost: about 36 multiply-adds per input sample per channel. A 30 s stereo programme is about 100 M operations, likely 1–3 s in Hermes.
- So measurement runs off the render path with `runSoon()`, in chunks that yield between them. The bezel shows "Measuring…" (never a stale number), and results are cached per programme version.
- A Node timing test sets a budget.
- Frame-rate claims come only from the Pixel, on an installed release build (charter §7). iOS is reported as NOT MEASURED.

**Display feed.** Each frame, `useFrameCallback` reads the player position. It then picks the 100 ms index and writes the M / S / I / TP-so-far shared values from the precomputed series. The bars and needles update every animation frame; the values step at 10 Hz, the same as a real loudness meter.

**Verification gate before release** (the proposal's open point, made binding):
1. Run the module against the ITU-R BS.2217 compliance material and the EBU Tech 3341 (loudness and true peak) and Tech 3342 (LRA) test signals, with an offline script (`scripts/loudness/verify-bs1770.mjs`) that decodes the WAVs with `wavDecode.ts`.
2. Every case must sit inside the tolerance that document gives. The tolerances are copied from the free documents at build time; they are UNKNOWN in this spec.
3. The receipt goes in `docs/labs/loudness/`.

The test files are large and are NOT added to the repo. The test signals that are defined by their equations, such as a 1 kHz sine at a stated level, ARE generated inside the normal test suite.

Until the gate passes, the lab is not listed. After it passes, learner text says "measured the way the standard describes", never "certified".

### 4.3 Native build or OTA?

**OTA. No native build.** Every piece runs on code already in builds 39/23:
- JS DSP;
- Skia and Reanimated displays;
- expo-audio playback through EarClipPlayer;
- expo-file-system (legacy) caching of lab-audio WAVs.

There is no package.json change and no fingerprint change.

A native build would only be needed for a different lab: one that measures LIVE microphone input in LUFS. That would need K-weighting, block gating and an Annex 2 true-peak path added to EngineHub, plus a new engine version. It is not proposed here.

The lab also does not import files from the learner's device in this version. That would need a document picker; check the binary before ever adding one.

### 4.4 Codec demos: pre-rendered, never live

Live encoding is impossible by OTA: there is no encoder in the binary. Device decoders also differ between iOS and Android (Ogg Opus especially), which would break iOS = Android.

So the builder renders offline:
1. Two 10 s programme excerpts (the music track and a speech-plus-music excerpt) are encoded as:
   - MP3 at 320, 128 and 64 kbps;
   - AAC at 128 and 64 kbps;
   - Opus at 32 kbps.

   That is 5 lossy rungs plus the original. The final rung list is fixed at build after listening; each rung must make a point.
2. Each encode is decoded straight back to 48 kHz 16-bit stereo WAV.

That gives 12 files, about 1.9 MB each (about 23 MB in total in the lab-audio bucket, downloaded on demand and cached). The encoder name, version and exact command line for every file go in SOURCES.md.

The app plays these decoded WAVs and MEASURES them with `bs1770.ts` like any other buffer. Every cut-off, true-peak rise and artefact on screen is therefore measured from the files, never typed in. The decoders' added samples at the start (encoder delay) are trimmed offline so the A/B lines up, and that trim is recorded.

The pre-echo and birdie excerpts (screen 14) are chosen by listening on a phone speaker at the capped level. Each one has a visual (zoomed waveform or spectrogram), so the lesson never depends on hearing a subtle artefact.

### 4.5 Programme material

- **Music:** the mixing lab's synthesized mix (`renderMix`), plus the lab-audio clip `mixing_lab/full-band-output-2` (16 s, 48 kHz stereo).
- **Podcast:** the two male-voice clips in `critical_listening`, joined with real pauses, which is exactly what screen 4's gates need.
- **TV-style ad:** synthesized from a music bed, a voice clip and a hit.

All three are built in `engine/programmes.ts`, deterministically, so the tests can measure them. An owner voice recording would replace the podcast later if he wishes; it is not required.

### 4.6 Air chain and on-air models

**Air chain** (`engine/airChain.ts`, offline JS render like masteringEngine):
- a slow wideband AGC;
- a 4-band Linkwitz-Riley crossover built from earDsp biquads (bands sum flat in magnitude; tested);
- per-band compressors;
- a look-ahead-free peak limiter;
- first-order pre-emphasis H(s) = 1 + sτ with τ = 50 or 75 µs, using the calculator function;
- a clipper at the 100 %-modulation ceiling;
- a 15 kHz low-pass;
- de-emphasis for listening, so the learner hears what a receiver plays.

GR per stage is recorded per 100 ms for the meters. It is a generic teaching model, not any product, and says so once.

**Mix-minus** (`engine/mixMinus.ts`): a pure routing matrix. The source × bus sends are checked by a rule: each mix-minus bus = PROGRAM minus its own source. The echo demo is rendered offline: the guest's clip plus a delayed copy, at the example delay recorded in the simplifications register.

**QC** (`engine/qc.ts`): pure checks over the measured values plus file metadata (sample rate, bit depth, channel order, name pattern, head and tail silence measured from the buffer), each returning PASS/FAIL with a reason string.

### 4.7 Safe level cap (H08: cap and warn, as in the DJ Systems Lab)

- Nothing sounds before `requestAudioOutput()`. Every sound starts through `startFenced` / `armFence`. Shake-to-mute, the idle lock, backgrounding, closing the lab and another lab coming to the front all stop it (`useStopWhenSilenced`, `useStopOnClose`, `labOutputOwner`).
- Every file player sits under the app-wide −12 dB ceiling (`outputCeiling.ts`, applied by EarClipPlayer).
- A protective limiter runs at −1 dBFS on the PLAYBACK copy only, after all measurement. It is the DJ lab's `protectiveLimitInPlace` pattern; the meters always read the unprotected programme.
- The monitor-level control starts at 30 % (`startLevel.ts`). It is the only control that makes playback louder.
- Screens where the learner raises playback level (the monitor control, and module 2's GAIN when monitoring is "as measured") are added to `LEVEL_WARNING_SITES`. The hearing reminder shows before EVERY play there, per the owner's 2026-09-13 ruling: no "seen it" flag.
- By default, module 2 and module 4 A/B listening is loudness-matched to the quietest version (attenuation only). That way a louder version never ambushes the learner, and the comparison is fair. "As broadcast" mode is offered and still stays under the cap.
- The welcome screen states plainly that the monitor level is not a measured or safe sound level.

---

## 5. Accuracy: every number, its source, and when it was checked

**Rule (H06, H24).**
- Delivery targets live ONLY in a new owner-maintained table, `src/data/deliveryTargets.ts`, reviewed twice a year. Each row carries `checkedOn` (ISO date), `source`, `kind` and `nextReview`.
- The lab shows "checked on <date>" on every row. Past 183 days the row also shows an amber "due for review" note. A test does NOT fail on the date, because a date-driven failure would break unrelated commits; the review dates go on docs/APE_LAUNCH_MUST_DO.md instead.
- The Calculator Lab's existing `LOUDNESS_TARGETS` (`calc/workspaces/loudness.ts`) becomes a view of this same table with its current strings unchanged. That way the app has ONE targets list, and the calculator's pinned tests do not move.
- A value nobody has checked shows as UNKNOWN and is never drawn as a number.
- Every source below is a free document: no H24 purchase is expected. If ARIB TR-B32 turns out to be paid, its row stays UNKNOWN.

**The checked-on rules for this table.** "Comp B 2026-11-18" means it was reported in Comp B's research and not yet opened by ccode. The builder opens the free source, confirms it, and writes the date. "App 2026-10-04" means the row is already in the Calculator Lab with that read date.

### 5.1 Measurement constants (taught; the code is pinned to them)

| Fact | Value | Source | Checked on |
|---|---|---|---|
| K-weighting | high shelf (~+4 dB above ~1.68 kHz) then a high-pass (~38 Hz); published 48 kHz coefficients | ITU-R BS.1770-5 (11/2023) | Coefficients in app code since the mastering-lab audio review 2026-10-01; PDF to be opened at build |
| Loudness offset | −0.691 dB | BS.1770-5 | as above |
| Block / overlap | 400 ms, 75 % | BS.1770-5 | as above |
| Absolute gate | −70 LUFS (LKFS) | BS.1770-5 | as above |
| Relative gate (integrated) | −10 LU | BS.1770-5 | as above |
| Channel weights | L, R, C 1.0; Ls, Rs 1.41; LFE excluded | BS.1770-5 | Comp B 2026-11-18; confirm at build |
| A 0 dBFS 1 kHz sine on one front channel | −3.01 LKFS | BS.1770-5 | confirm at build (becomes a generated test) |
| LUFS = LKFS; 1 LU = 1 dB | same unit | BS.1770-5 / EBU R 128 | confirm at build |
| Momentary / short-term windows | 400 ms / 3 s, ungated | EBU Tech 3341 | Comp B 2026-11-18; confirm at build |
| Meter update rate | at least 10 Hz | EBU Tech 3341 | confirm at build |
| LRA | short-term at 10 Hz; −70 LUFS absolute, −20 LU relative gate; 95th − 10th percentile | EBU Tech 3342 | confirm at build |
| True-peak method | 4× oversampling at 48 kHz, Annex 2 48-tap FIR | BS.1770-5 Annex 2 | confirm at build |
| True-peak meter under-read limit and test tolerances | UNKNOWN | BS.1770-5 / Tech 3341 | UNKNOWN until the free text is read |
| Compliance tolerances (all test cases) | UNKNOWN | BS.2217, Tech 3341, Tech 3342 | UNKNOWN until read |
| VU ballistics | 99 % of the reading in 300 ms | charter §4 (VU 300 ms) | the standard's own number is to be confirmed at build |
| VU alignment used in the lab | 0 VU = −18 dBFS (stated as this lab's assumption) | common EBU alignment, to be sourced at build | UNKNOWN source until checked; shown as an assumption |

### 5.2 Delivery targets (the owner table; the lab never hard-codes these in teaching text)

| Destination | Loudness | True-peak ceiling | Kind | Source | Checked on |
|---|---|---|---|---|---|
| European TV | −23 LUFS ±0.5 LU (±1 LU live) | −1 dBTP | Delivery requirement | EBU R 128 (the app says "2020"; Comp B cites v5.0; the current version is confirmed at build) | App 2026-10-04 (no read date in the app row); Comp B 2026-11-18 |
| US TV | −24 LKFS ±2 dB | −2 dBTP recommended | Delivery requirement (CALM Act) | ATSC A/85:2013. A July 2026 revision is reported by secondary sources; UNKNOWN until checked | App 2026-10-04 (no read date in the app row) |
| Japan TV | −24 LKFS | UNKNOWN | Delivery requirement | ARIB TR-B32 | Comp B 2026-11-18; UNKNOWN if paid |
| Australia TV | −24 LKFS | UNKNOWN | Delivery requirement | Free TV OP-59 | Comp B 2026-11-18 |
| A large music service (Spotify) | −14 LUFS Normal (Loud −11, Quiet −19) | below −1 dBTP; below −2 dBTP for masters louder than −14 LUFS | Playback level, not a mastering requirement | Spotify for Artists, "Loudness normalization" | App: read 2026-10-04 |
| Apple Music | −16 LUFS (Sound Check) | not published | Playback level | Apple, as reported | App 2026-10-04 (as reported) |
| YouTube | about −14 LUFS | not published | Playback level | measured by engineers; no published figure | App 2026-10-04 |
| Apple Podcasts | −16 LKFS ±1 dB | max −1 dBTP | Delivery recommendation | Apple Podcasts, "Audio requirements" | App: read 2026-10-04 |
| AES streaming recommendation | −16 LUFS music; −18 LUFS speech | — | Distribution recommendation | AES TD1008 (2021) | App 2026-10-04 (no read date); Comp B 2026-11-18 |
| The learner's own spec | typed by the learner | typed by the learner | Learner's | — | — |

(The calculator's existing Amazon Music and TIDAL rows carry over unchanged in the shared table.)

### 5.3 Air chain, codec and studio numbers

| Fact | Value | Source | Checked on |
|---|---|---|---|
| FM pre-emphasis time constants | 50 µs (Europe and most of the world), 75 µs (Americas, some others) | ITU-R BS.450-3 | Comp B 2026-11-18; confirm at build |
| Pre-emphasis boost | 10·log10(1 + (2πfτ)²) dB | first-order RC network (physics) | Calculated 2026-11-19 |
| Turnover frequency 1/(2πτ) | 75 µs → 2122 Hz; 50 µs → 3183 Hz | calculated | 2026-11-19 |
| Boost at 15 kHz | 75 µs → +17.07 dB; 50 µs → +13.66 dB (matches Comp B's +17 / +13.7) | calculated | 2026-11-19 |
| FM stereo audio bandwidth | 15 kHz (below the 19 kHz pilot) | ITU-R BS.450-3 | confirm at build |
| 100 % modulation (±75 kHz deviation) | the clipper ceiling represents it | ITU-R BS.450-3 | confirm at build; until then the lab says "the legal modulation limit" with no number |
| Codec cut-offs, true-peak rises, artefacts | MEASURED from the rendered files; never stated as a general number | the files themselves + encoder name, version and command | at render |
| Codec round-trip delay in the echo demo | one example value, labelled "in this example" | simplifications register | n/a (illustrative) |
| Broadcast delay length | not stated | — | UNKNOWN (deliberately not claimed) |
| Telephone audio band (if drawn) | UNKNOWN until sourced (ITU-T, free) | — | UNKNOWN |
| Mix-minus / IFB definitions | as described | Comrex "Mix-Minus and eliminating Echo"; Telos "Studio audio connections" | Comp B 2026-11-18; confirm at build |
| 5.1 channel order on the made-up spec sheets | the sheet states its own order (it is the client's spec) | fictional sheet, written like real ones | n/a |

**H25: equations into the calculator library first.**
- `preEmphasisBoostDb(fHz, tauUs)` and `preEmphasisTurnoverHz(tauUs)` are added as exported, tested pure functions in `src/screens/lab/calc/workspaces/loudness.ts`, the calculator library. The lab only calls them, and never copies the formula.
- They are NOT added as a new calculator tile, so "166 calculators" stays true. A visible tile would change that count, which is the owner's call alone.
- The loudness-normalisation gain and the LU difference already exist in the calculator (`loudnorm`, `loudtp`). The lab's gain readouts call those calculator functions.
- The BS.1770 measurement is an algorithm, not an equation. It lives in `src/features/loudness/bs1770.ts`.

**Must not teach (pinned by a learner-text test):**
- "−14 LUFS is the standard";
- "LUFS is dBFS RMS" (or "the same as RMS");
- "louder is better";
- a target described as a quality goal.

---

## 6. Credit

**Keys** (PERMANENT once live; each is a server `labs` row):
- `tr_loudness_delivery`: the whole lab. Route `LoudnessDeliveryLab`, completion `all-modules` (all six module keys done).
- A new module key family, `lad_<module>`, listed as `LAD_MODULE_IDS = ['measure','targets','codecs','airchain','onair','qc']` in `trainingLabKeys.ts`. `isTrainingKey` accepts it. This follows the precedent of the owner's 2026-10-13 ruling that Miking and Mixing are required lesson by lesson, and of the `ear_<module>` keys.

**Completion rule.**
- A module key is recorded the moment the last of its screens is done (section 3). The whole-lab key is recorded when all six are done.
- Reported through labCompletion's one queue: guests never send, preview earns nothing, and `lab_not_found` is kept and retried until Comp A's rows exist.
- No backfill (the lab was never on a phone).
- Progress lives in the lab's own store via `createLocalStore`. A failed read is UNREADABLE and never overwritten, and the store is never saved before it has loaded.
- Credit is never removed. PRACTISE AGAIN clears nothing.

**Understanding-check ideas** (4 per module; every option explained; every reasonable answer accepted):
- M1: "A podcast with long pauses reads −19 LUFS integrated; without the gates it would read…" (lower; the gates ignore silence). "Which number would you watch to see one loud word?" (momentary). "Two files have the same sample peak; why can one sound much louder?"
- M2: "Your mix is −11 LUFS; the destination plays at −14. What happens?" (it is turned down; nothing is 'fixed'). "Gain +2 dB: what happens to true peak?" (+2 dB exactly). "Which rejection reason is a measurement-method mismatch?"
- M3: "Why can true peak exceed every sample?" "Why leave −1 to −2 dBTP before lossy encoding?" "Which artefact smears sound before a drum hit?" (pre-echo).
- M4: "Why does a bright mix lose treble on FM?" (pre-emphasis then limiting). "Which stage rides slow level changes?" (AGC). "Which is larger at 15 kHz, 50 µs or 75 µs boost?"
- M5: "Guest B hears herself late; what's missing?" (her own mix-minus). "What does IFB let the producer do?" "Why does the caller's feed exclude the caller?"
- M6: "The file measures −23.0 LUFS and was rejected; list two reasons that could still fail it." "Head silence 0.2 s against a spec of 2 s: pass or fail?"

**Required by** (Comp B's list checked against `src/data/labRequirements.ts` on 2026-11-19). All 11 slugs exist in the credential fixture (`test/labCertRequirements_20261013.test.ts`). Ten already have rows in the map; `cert-audio-standards-specialist-v3` has none, so today it requires the fundamentals only. Applying the file's bar ("could a learner do this job without having done this lab?"):

| Credential | Slug | Comp B | Recommended | Why |
|---|---|---|---|---|
| Loudness & Delivery Specialist | cert-loudness-and-delivery-specialist-v3 | all | `tr_loudness_delivery` | The lab IS this job. Keep the existing tr_limiter, mxa_qc and mxa_deliver |
| Streaming Mastering & Loudness | cert-streaming-mastering-and-loudness-v3 | 1–3, 6 | `lad_measure`, `lad_targets`, `lad_codecs`, `lad_qc` | Agree |
| Broadcast Engineer | cert-broadcast-engineer-v3 | 1, 4, 5 | `lad_measure`, `lad_airchain`, `lad_onair` | Agree (radio air chain and on-air studio are this credential's description) |
| Podcast Production | cert-podcast-production-v3 | 1, 2, 5 | `lad_measure`, `lad_targets`, `lad_onair` | Agree (remote guests need mix-minus) |
| Mastering Engineer | cert-mastering-engineer-v3 | 1–3 | `lad_measure`, `lad_codecs` | **Changed.** Module 2 overlaps the required Mastering Lab's release module, which already walks destination briefs. The meter's method and codec true peak are new |
| Audio Standards Specialist | cert-audio-standards-specialist-v3 | 1, 3 | `lad_measure`, `lad_codecs` | Agree. This is the credential's first variable requirement (the map's header lists standards credentials as fundamentals-only because no lab taught a standard; this one does) |
| Re-Recording Mixer | cert-re-recording-mixer-v3 | 1, 2, 6 | `lad_measure`, `lad_targets`, `lad_qc` | Agree |
| Broadcast, Podcast and Streaming Audio | prog-broadcast-podcast-and-streaming-audio-v3 | all | `tr_loudness_delivery` | Agree |
| Mixing and Mastering Engineering | prog-mixing-and-mastering-engineering-v3 | 1–3, 6 | `lad_measure`, `lad_codecs` | **Changed.** Programs carry roughly the union of their certificates' needs, never the sum. Module 2 overlaps tr_mastering, and module 6 overlaps the required mxa_qc and mxa_deliver |
| Post-Production Audio | prog-post-production-audio-v3 | 1, 2, 6 | `lad_measure`, `lad_targets`, `lad_qc` | Agree |
| Audio Standards and Technical Compliance | prog-audio-standards-and-technical-compliance-v3 | 1–3, 6 | `lad_measure`, `lad_targets`, `lad_codecs`, `lad_qc` | Agree |

The "relevant but not required" list stays unrequired. Learners who started a credential before the change date are exempt (H20). Mechanics:
1. Edit `labRequirements.ts` (each row with a learner-facing `why`).
2. Run `node scripts/gen-lab-cert-seed.mjs`.
3. Run the ratchet test.
4. The server rows go to Comp A as a SQL brief ZIP, AFTER the update that reports the lab is on phones (the tr_game_audio precedent).

---

## 7. Files, tests, and honest size

**Create**
- `src/features/loudness/bs1770.ts`: K-weighting reuse, block powers, momentary/short-term series, gated integrated (with gate values and masks), dialogue-gated, LRA, Annex 2 true peak, sample peak.
- `src/features/loudness/vu.ts`: VU ballistics model.
- `src/data/deliveryTargets.ts`: the owner table (H06).
- `src/screens/lab/loudness/`:
  - `LoudnessDeliveryLabScreen.tsx` and `registry.ts` (pages, module map, `ladModuleDone`, `ladLabComplete`, `LAD_LAB_ID`);
  - `pages/p01…p29.tsx` and `pages/shared.tsx`;
  - `engine/` — `programmes.ts`, `measureCache.ts`, `airChain.ts`, `codecLadder.ts` (asset keys + render metadata), `mixMinus.ts`, `qc.ts`, `checks.ts`;
  - `art/` — `MeterPanel.tsx`, `GateView.tsx`, `KWeightCurve.tsx`, `InterSample.tsx`, `CodecSpectrum.tsx`, `AirChainView.tsx`, `PreEmphasisCurve.tsx`, `OnAirConsole.tsx`, `SpecSheet.tsx`, each with `model.ts` / `geometry.ts` / scene per charter §2;
  - `useLoudnessPlayback.ts`: the useMasterPlayback pattern;
  - `loudnessScreenGuides.ts` and `ldTerms.ts`.
- `scripts/loudness/render-codec-ladder.mjs` (offline, builder's machine: encode, decode, trim, write the WAVs and a render log).
- `scripts/loudness/verify-bs1770.mjs` (offline compliance receipt).
- `docs/labs/loudness/SOURCES.md`, `MODEL.md`, `CORRECTIONS_LOG.md`, the simplifications register, and the compliance receipt.

**Change**
- `src/screens/lab/labCatalog.ts` (a row in Production Workflow, `member: true`);
- `src/navigation/types.ts` and `RootNavigator.tsx`;
- `src/features/lab/trainingLabKeys.ts` (tr_ key, `LAD_MODULE_IDS`, `isTrainingKey`);
- `src/features/lab/trainingCompletion.ts` (rule table; no backfill);
- `src/data/labKeyCatalog.ts` (names for 7 keys);
- `src/data/labRequirements.ts` and the regenerated seed;
- `src/screens/lab/calc/workspaces/loudness.ts` (pre-emphasis functions; `LOUDNESS_TARGETS` as a view of the shared table, strings unchanged);
- `src/features/audio/levelHearingWarning.ts` (`LEVEL_WARNING_SITES`);
- `src/features/audio/ExposureCheckin.tsx` (the sound-lab list, as Game Audio did);
- `src/features/intro/labTermIntroData.ts`;
- `src/dev/webPreviews.tsx`;
- the lab tile art (`labTileArt.ts`);
- `test/patternP10b_20261002.test.ts` (lesson loops, each with its reason);
- `docs/APE_LAUNCH_MUST_DO.md` (twice-yearly target review dates, Comp A brief, codec render).

No package.json change. No native change.

**Tests** (targeted while building; ONE full suite at the end through `node scripts/suite-gate.mjs`):
- **bs1770:**
  - 1 kHz sine at 0 dBFS on one channel → −3.01 LKFS; stereo 1 kHz at −23 dBFS → −23.0 LUFS (both generated).
  - Silence appended changes nothing (the gates); a −80 dBFS segment is ignored; the relative gate drops a quiet passage.
  - A 20 s / 20 s two-level sequence gives the LRA the Tech 3342 case states (the value is copied from the document at build).
  - True peak of a sine at fs/4 with a 45° phase reads above sample peak by the amount the math gives.
  - Gain shifts every value by exactly that gain.
  - A non-48 kHz buffer throws.
- **Calculator:** pre-emphasis boost at 15 kHz equals 17.07 / 13.66 dB, and the turnovers equal 2122 / 3183 Hz. The calculator's existing loudness tests stay green.
- **Targets table:** every row has an ISO `checkedOn`, a source and a kind; UNKNOWN rows render no number; the calculator view's strings are unchanged.
- **Models:**
  - mix-minus: each bus excludes exactly its own source; PROGRAM includes all;
  - air chain: crossover sums flat within tolerance; the clipper never exceeds its ceiling; GR is never negative; pre-emphasis uses the calculator function, never a copy;
  - QC: each line's PASS/FAIL and reason on fixtures.
- **Credit:**
  - registry: every page belongs to one module; module done means all its pages done; NEXT is never held;
  - credit: `lad_*` and `tr_loudness_delivery` are valid training keys; the requirement rows match the seed (the ratchet).
- **House rules:**
  - `startFenced`, `safeGoBack`, `createLocalStore`, `useMemberGate` and `runSoon` ratchets pass, and no allowlist grows;
  - learner text has none of the "must not teach" lines, and no source codes or badges;
  - screen guides exist for all 29 screens (the screenGuide test pattern);
  - display text is at least 9 pt at 390 px;
  - every teaching Canvas has an accessibility label and a live summary.
- **Offline (not in the suite):** the BS.2217 / Tech 3341 / Tech 3342 compliance receipt, and a Node timing budget for measuring a 30 s programme.

**Reviews before handover:** an audio-expert pass (meter maths, air chain, codecs, mix-minus), a cognitive/learning pass, and a skeptical VISUAL pass against the charter. Then rendered inspection in the web preview at 390×844, landscape and iPad, with every capture opened before it is handed over.

**Honest size.** About 100 files and 24,000–28,000 lines, the same order as the Game Audio Lab (115 files, 26,356 lines, built over 2026-11-12 to 11-15 with an audit and fix rounds). Expect two build sessions plus two review/fix rounds. Plus the offline codec render (about an hour once an encoder is available) and the compliance run. Running the measurement on the phone (true peak) is the main performance risk, and it is mitigated as in section 4.2.

---

## 8. Open items that truly block

1. **Encoder and test files (owner OK, at build time).**
   - **Codec encoder.** This PC has no audio encoder (no ffmpeg, lame or opusenc found on 2026-11-19). Module 3's 12 codec files cannot be made without one: either the owner OKs installing a standard ffmpeg build here, or Comp B renders them with the script and its exact command lines.
   - **Free test files.** The release verification needs the free ITU-R BS.2217 and EBU Tech 3341/3342 test files downloaded. That download also needs the owner's OK.

   Everything else in the lab can be built without these. Module 3's screens can be drawn and tested with generated signals while the files wait.
2. **Comp A server work (not an owner decision; a real dependency).**
   - The `labs` rows for the 7 keys and the requirement rows. Until then the device keeps the credit unsent and retries it, so this blocks credit reaching the server, not the lab.
   - Uploading the 12 codec WAVs (and any new programme clips) to the lab-audio bucket with their asset rows. Until then module 3's audio cannot load on phones.

   One SQL/asset brief ZIP, sent after the build.
3. **Owner approval of the requirement rows (section 6), at build.** Only the two changed rows are new decisions. Building and listing the lab does not wait for it; the rows going live does.

Not blockers (and not held):
- the target review schedule (H06, accepted);
- the ATSC A/85 revision (its row shows UNKNOWN until checked);
- an optional owner voice recording;
- whether pre-emphasis ever gets its own calculator tile (default: no, so 166 stays);
- moving the Mastering and Advanced Mixing labs onto `bs1770.ts` (a separate, optional change).

Building starts only on the owner's explicit GO (D56). Publishing by OTA happens only on the owner's word. No `eas build` is involved.
