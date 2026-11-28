# CHECK F8a (independent checker, 2026-11-15)

Group F8a: Oscillators, Noise, Harmonics, FM Synthesis, Modular Synth, Sound Envelope & Transients, Autotune.
Repo C:\Users\profe\dev\ape-workbench, branch ota-after-approval-39-23. No file under src/ or test/ changed. Every lab was opened at 390 x 844 in one pane tab (closed at the end); the Sound Safety sheet was always closed with KEEP SOUND OFF.

## 1. Summary

- 23 items: **PASS 23** (HAR-04's finger drag of H3 is NOT SEEABLE in the pane; the rest of HAR-04 passes).
- Sweep items: **PASS 5** (SH-11, SH-12, SH-35, SH-37, SH-76), **FAIL 1** (SH-64, Autotune: the word LOCKED), **PART 2** (SH-27, SH-36: see section 3). SH-15 / SH-14 "not needed" accepted.
- test/labWaves_20261115_F8a.test.ts: 52 pass, 0 fail.

Priority checks:
- **Harmonics** opens on SINE, stems pinned first under the display with "DRAG H3 UP", THD / CREST / SLOPE hidden until MEASURE: yes.
- **Autotune** key says gray = as sung, gridline = right note, and the drawing code agrees: the gray line is drawn at `sungX = xOf(midi*100 + offCents)`; the target gridlines at `m*100`; the amber curve runs `correctedCents(off, amount, tau, t)` from the sung pitch toward the gridline (AutotuneLabScreen.tsx:575-595, 641-690).
- **SPEED grayed while AMOUNT is OFF:** yes (dimmed, a tap gives the reason), but the key face reads LOCKED (FAIL below).
- **FM faint lines:** measured from the drawn SVG they land where fmGrid.ts says (table, FM-03).

## 2. Table

| ID | Result | What I did and saw (390 x 844) | If FAIL: what to fix |
|---|---|---|---|
| HAR-04 | PASS (drag: NOT SEEABLE) | Opens on PRESET SINE: one band, pure sine wave, heading "HARMONIC STEMS — DRAG H3 UP"; WHERE TO START begins with the H3 drag. At 390 x 844 the lower half of the stem field and the H1–H12 labels sit behind the dock (H3 label y 777, dock from about y 720); the heading and top of the stems show, a short scroll shows H3. A finger drag is a phone check. | — |
| HAR-01 | PASS | Stems pinned under the sound-off line, above the caption and LAB NOTES. Readout strip shows F0 only. MEASURE on: THD 0.0 %, CREST 3.0 dB, SLOPE appear; off: hidden again. The well line "Tap MEASURE to show THD, CREST and SLOPE…" matches. Six dock keys fit. | — |
| HAR-02 | PASS | THD CALC opens "THD compares the harmonics with the main note: 0 % is a pure tone, and the stronger the harmonics, the higher it climbs.", then the formula; DONE closes it. | — |
| AUT-01 | PASS | Key under the display: "Each row is one sung note, top to bottom: gray as sung, amber as heard; gridline = right note." Rows numbered 1–6 at the right edge, clear of the F4 label. | — |
| AUT-02 | PASS | First line under the sound-off line: "¢ = cents: 100 cents = one piano key. Slide AMOUNT, switch SPEED…". | — |
| AUT-03 | PASS | Picked SLOW: the amber path dropped to 1 segment and grew back to all 40 in about 1.1 s (sampled from the drawn paths). The hidden pane skips frames, so the smooth glide itself is best seen on a phone. Sound-off line: "Switch SPEED and watch each curve replay…". | — |
| AUT-04 | PASS | Intro text (autotuneScreenGuides.ts:39-40): gray = as sung, gridline = right note, AMOUNT OFF then 100 %, PLAY second. On screen AMOUNT OFF draws each amber curve dashed on its gray line, as the step says. | — |
| FM-01 | PASS | Subtitle "One tone shakes another · new tones appear"; key "green = the note · amber = new tones FM adds / faint lines = in-tune spots for a clear note"; caption "Drag INDEX and watch new tones spread out around the note…"; note "Worked out from the math…". No Bessel / Nyquist on or under the display. Dashed / red cases are in the ⓘ (fmScreenGuides.ts:57). | — |
| FM-02 | PASS | Readout reads MOD 440 Hz. | — |
| FM-03 | PASS | Measured the drawn SVG. RATIO 2, FC 220: faint lines every 13.4 px from x 27.4 (220 Hz steps); sticks at 27.4, 54.3, 81.2, 108.1 …, so they sit on every other line (odd multiples), as fmGrid math says. RATIO 1.41 ✳: lines at 32.4, 50.7, 69.1 …; the carrier sits on 32.4, every other stick between lines (58.3, 84.1, 110 …). Lines are faint (#2b2d3a). | — |
| FM-04 | PASS | fmScreenGuides.ts:52-53: intro opens "FM shakes one tone with another, which makes new tones."; WHERE TO START begins "Drag INDEX from 0 to 8…", with ▶ second. | — |
| OSC-04 | PASS | Below the display: sound-off line, the OSC-03 line, LAB NOTES (folded), then the two CHECK YOURSELF questions, then WHAT YOU'RE SEEING and REFERENCE VS SPEAKER (advisory kept in view), then GO DEEPER ▾ closed, holding THE SOUND and FM · AM. Nothing removed (code). | — |
| OSC-05 | PASS | oscillatorScreenGuides.ts:42 "Every sound shape is built from simple tones stacked up, like a recipe. Bar 1 is the note; bars 2 to 12 set its color." | — |
| OSC-03 | PASS | "Each bar is one pure tone: bar 1 is the note, bars 2 to 12 add its color." sits right under the sound-off line; it replaced the old caption, so no line was added. | — |
| NOI-04 | PASS | Intro card on arrival: "Noise here is a hiss with no note; engineers use it on purpose to test speakers and rooms. Its color is its tilt, from rumble to bright hiss." | — |
| NOI-02 | PASS | "↑ louder" above and "↓ quieter" below the 1 kHz pivot, "← rumble … hiss →" under 20 … 20k; no word sits on a line; chart, readouts and dock in view. | — |
| NOI-03 | PASS | COLOR tray → WHITE: "Flat per Hz, yet it sounds bright: the octave from 5,000 to 10,000 Hz holds 5,000 Hz of noise, the octave from 50 to 100 Hz only 50." | — |
| MOD-04 | PASS | Intro card: "Sound flows along the amber cable: TONE, FILTER, VOLUME, OUT…"; WHERE TO START begins "Tap PATCH → WOBBLE". The audio cables are amber on the case, so words and picture agree. | — |
| MOD-01 | PASS | TONE / FILTER / VOLUME / OUT over VCO / VCF / VCA / OUT above the case, on the amber arrow, legible at 390. Subtitle "Tone → Filter → Volume, patched with cables". | — |
| MOD-03 | PASS | THE VOICE, AS SOUND sits straight under the sound-off line, outside LAB NOTES, in view with the dock. Stepped CUTOFF down 4 times: marker 2.0 kHz → 1.0 kHz, more bars gray. | — |
| MOD-02 | PASS | "Tap any box to learn what it does. The case is patched exactly like the sound you hear." is the first line under the graph's key, above LAB NOTES (under the graph, which now sits between it and the case). | — |
| ENV-04 | PASS | Module 1 Try-it: "drag ATTACK all the way left and the sound starts with a snap; drag it right and it fades in slowly. That rise is the attack." | — |
| ENV-01 | PASS | Module 5 (snare): "A big gap between the lines means a spiky sound, like a drum; a small gap, a steady sound, like a trumpet. The numbers are in dB (how much louder or quieter)." comes before "peak -0.4 dB · average (RMS) -15.7 dB · crest factor 15.3 dB"; the old chart caption is gone. | — |
| SH-64 (Autotune) | FAIL | Stepped AMOUNT to OFF: the SPEED key dims and a tap prints "SPEED — locked: SPEED does nothing while AMOUNT is OFF: raise AMOUNT first." The function works. But the key face reads **LOCKED**, and in this app "locked" / 🔒 means members-only (useMemberGate 'locked'). A beginner can read SPEED as a paid feature, which is a new wrong turn. | AutotuneLabScreen.tsx:367: add the rack's existing `lockedValue` (SN-1), e.g. `lockedValue: 'AMOUNT OFF'`, so the key reads AMOUNT OFF and the tapped line says "not yet" instead of "locked". |
| SH-11 | PASS | Every EXPLORE WHERE TO START in the six sound labs opens with a step you can see (code, guide files). | — |
| SH-12 | PASS | Sound-off lines seen in Harmonics, Autotune, FM, Oscillator, Noise, Modular. | — |
| SH-35 | PASS | Harmonics model dock F0 · PRESET · MEASURE · THD CALC · AXIS · MODE as reported. | — |
| SH-37 | PASS | No store-build "update the app" line seen. FM's "install the v7 build" line shows only because the preview is a dev build (__DEV__). | — |
| SH-76 | PASS (code) | Oscillator F0 and FM FC trays now have per-choice lines. | — |

## 3. Other things noticed in passing

1. **Modular readout captions are cut at 390 (SH-27 part).** The first-visit captions under VCO and SEQ read "tone sha…" and "steps a s…". These are the shared rack's caption row, not F8a's new labels, but the F8a report says nothing in its labs was cut. Fix: shorter captions ("tone", "steps") in ModularLabScreen.tsx:391-401, or a two-line caption in the shared rack.
2. **THD's readout caption contradicts HAR-02.** The F8a report says THD CALC avoids the word "share" because THD can pass 100 %. But the THD readout caption (HarmonicsView.tsx, bezel `caption: 'overtone share'`) still says "share". Suggest "overtone strength".
3. **SH-36 shared need still open:** Oscillator and Harmonics both show "Toggle PHONE SPEAKER OUTPUT…", but the key is SPKR (Harmonics has no such key at all). This is SHARED NEED 2 in the F8a report (speakerSafety.ts).
4. **Envelope word clash (minor):** the new Try-it line says the sound "starts with a snap" when ATTACK is all the way left, and the button right below it is "ATTACK: SNAP / LINEAR", which means the curve shape. A beginner may think the line refers to that button. Suggest "starts at once" or "starts with a click".
5. **Preview crash seen once, not F8a's:** on one reload the page stayed blank with "ReferenceError: useRef is not defined at GuidedLessonSheet". The file already imports useRef (another group's edit was in flight), and the next reload worked.
6. **My own taps:** while closing the Sound Safety sheet on Autotune, one click landed on the agreement checkbox and ticked it, and the next click unticked it. Sound was never enabled. Two intro cards (Noise, Modular) were closed with GOT IT.
