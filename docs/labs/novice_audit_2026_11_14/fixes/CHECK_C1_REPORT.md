# CHECK C1 report (lab fix round 1, 2026-11-14): S1, S3, F2

Checker C1. I used the built-in pane, in my own tab (tab-33), at 390x844 (and 320 where the fix is about width). The preview was http://localhost:8142. I did not edit any source or test file. The tab is closed and its viewport is reset.

## Summary

**Checked 63 · PASS 47 · FAIL 3 · NOT SEEABLE 13.** Two table rows, the Labs menu at 390 and the end rows' "Left: …" text, pass on screen but hold FAIL F2 and FAIL F3, so they count as FAIL.

The three FAILs:
- **F1, real.** DJ screen 10: the tray fold does not leave the lesson readable.
- **F2, width.** Labs menu at 320: titles and blurbs are cut.
- **F3, small.** The spoken label of the Sound Systems end rows misses a full stop.

## What I changed in saved data (shared origin)

- **Intro card for Noise Lab EXPLORE.** I removed only `inv45xw` from `ape:intro:screenIntroCards`. My own GOT IT then wrote it back.
- **The "New: tap ⓘ" hint.** I removed `ape:intro:screenGuideHint` three times to see the hint. At the end I set it back to `"true"`, its value before I started.
- **Seen flags written by my own real taps** (GOT IT on cards I had not seen before):
  - the "noise color" term (`term:c4bfb4c2-…`);
  - the intro cards for Noise LEARN and CHECK;
  - the intro cards for SS hub, Troubleshoot bench, Routing, Digital, ROUTE 4 and DJ screens 6 and 14.
- **Sound Systems progress.** "Subwoofer receives vocals unintentionally" is now marked solved with a forward walk.
- **DJ screen 24.** The event was opened once. All seven power switches are back OFF.
- **Sound Safety.** I never pressed ENABLE; I pressed KEEP SOUND OFF every time. I never pressed PRINT, SHARE or DOWNLOAD.

## How the pane maps clicks

The pane draws the 390x844 page into an 800x365 frame. Clicks given by coordinate map as x*390/800 and y*844/365. I calibrated this on the mode tabs and on GOT IT.

All the "real tap" steps below are real pointer clicks, by ref or by coordinate. Where I used a script `.click()`, the table says so: only to move between modules or to repeat a step key many times.

## Table

| Lab | Fix (group + item #) | Steps | Seen | Result |
|---|---|---|---|---|
| Noise | S1 #1 one card, term inside | Card already seen → removed `inv45xw`, reloaded | ONE card: "NOISE LAB ✕ / Noise color / Noise color tells you how a noise spreads its energy across pitches… / WHAT YOU'RE LEARNING / WHERE TO START / ⓘ EXPLAIN THIS SCREEN / GOT IT", no CONTINUE sheet. Before the removal (card seen), the term came alone with CONTINUE, which is right. | PASS |
| Sound Systems hub | S1 #1/#6 one card on a members-only lab | Fresh load | ONE card: "Sound System" term + WHAT YOU'RE LEARNING + WHERE TO START + GOT IT | PASS |
| Noise | S1 #2 card arrives with the page | Polled the page as it loaded | The card was up on the first look after the bundle drew | PASS (timing under 0.4 s not measurable) |
| Noise | S1 #3 popups one at a time | Real GOT IT | Card closed → SOUND SAFETY WARNING alone; no hint on that visit | PASS |
| Noise | S1 #1 seen flags | Read localStorage after GOT IT | Both written (card id + `term:c4bfb4c2`) | PASS |
| any | S1 #4 no tap swallowed in a popup's first 350 ms | — | The pane cannot time a tap under 0.4 s against a bundle that takes 15 s to draw | NOT SEEABLE |
| any | S1 #5 nothing opens over an open tray | — | No popup became due while I had a tray open. Every tray I opened came after the arrival popups were done. | NOT SEEABLE |
| Noise | S1 #7 + checklist step 7: once per session | KEEP SOUND OFF, then header ▶ | No sheet; the sound-off line stays | PASS |
| EarLab → Stereo → Noise | S1 #7 across labs | New session: Stereo (sheet) → KEEP SOUND OFF → ‹ → Noise | No sheet on Noise | PASS |
| DJ | S1 #7 / #12 on DJ PLAY and START THE FAULT | New session: screen 6 START THE FAULT → sheet → KEEP SOUND OFF. Screen 10 ▶ PLAY A / B; screen 14 START THE FAULT | Sheet once only; no sheet after | PASS |
| Noise | S1 #8 + checklist step 6: pinned buttons | Sheet open | Both buttons at y 680–780 of 844 with no scroll. ENABLE has aria-disabled=true, "Unavailable until you tick the box at the end of the warning." | PASS |
| Noise | S1 #9 + checklist steps 3–5: dim tap does nothing | Real clicks: 3 above the card (1 s apart), 3 below the card, 1 press-drag on the dim | The sheet stayed every time | PASS (the press was ~0.3 s, not a 2 s hold: the pane has no hold) |
| Noise | S1 #10 opaque from the first frame | Screenshot right after GOT IT | Opaque | PASS |
| Noise | S1 #7 new footnote | Read the sheet | "This warning appears once each time you open the app, until you enable sound. The Pro Audio Safety topic covers hearing protection in full." | PASS |
| any | S1 checklist step 9 (Android BACK on the hosted sheet) | — | Phone only | NOT SEEABLE |
| any | S1 #11 the tick resets only on a NEW request | — | Needs a re-presented gate | NOT SEEABLE |
| Noise | S1 #13 the "New: tap ⓘ" hint | Removed the hint key; new session; declined on Stereo; opened Noise (a quiet visit) | "New: tap ⓘ to have this screen explained ✕" ~1 s after arrival. Gone after ~8 s, key written "true". It did not come on visits that had the sheet or an intro card. | PASS |
| Noise | S1 #13 taps pass through the bubble | Real click on the bubble's body over the tab strip (page ~300,87) | The CHECK tab became selected | PASS |
| Noise | S1 #14 guide arrow words | Card → EXPLAIN THIS SCREEN → stepped to TRY THIS | aria "Previous thing to try" / "Next thing to try" | PASS |
| Noise | S1 #15 "noise color" card | Seen in the one card | Text verbatim as in S1_REPORT | PASS |
| Connector / Cable Dressing | S1 #15 reworded cards | Read labTermIntroData.ts:141 and :152 (labs not opened) | Connector: "Its shape tells you what it fits, not what it carries…". Cable dressing: "…not just making them look neat…" | PASS by code (not on screen) |
| Noise / Stereo / Harmonic | S3 #1 sound-off line | After KEEP SOUND OFF | Noise: "Sound off? Each color still shows its tilt: watch the line and SLOPE." Stereo: "Sound off? The two traces show what you would hear…". Harmonic: "Sound off? The bands, THD and the wave still show every change you make." | PASS |
| Delay / Phase | S3 #4 example lines | — | No `#labpreview` route | NOT SEEABLE |
| — | S3 #2 NEEDS SOUND tag | — | No lab I opened places one | NOT SEEABLE |
| Noise / Harmonic / Stereo | S3 #5 HELP key | Header | "HELP ⓘ ▶" (HELP 41x24) | PASS |
| EarLab / Harmonic | S3 #6 ± chip | Header | "± ACCURACY" on the menu; ± "About accuracy and calibration" on Harmonic | PASS |
| DJ / Miking | S3 #7 ABOUT chip | Header | "ABOUT ⓘ" on DJ and on Miking M01 | PASS |
| SS / DJ | S3 #11 bezel captions | First visits | SS ROUTE 4: "copy point", "two-plus each". DJ 14: "beats a minute", "semitones off", "musical key" | PASS |
| — | S3 #12 Hz/dB chip | — | Its flag was already set; I did not reset it (S3 saw it) | NOT SEEABLE (already seen by S3) |
| Stereo / Miking / SS | S3 #13 no grey-out | Opened SOURCE, PAN, SETUPS, CASE, PROBE trays | The lesson above each card stays bright | PASS |
| SS Troubleshoot | S3 #14 / F2 #5 the tray closes on solve | Solved a case | FAULT tray closed; WHY / THE FIX / THE WALK in view | PASS |
| SS Troubleshoot | S3 #14 a scroll closes a pick tray | CASE tray (not sticky), mouse-wheel scroll of the well | The well scrolled, the tray stayed. RackUnit.tsx:919 uses `onScrollBeginDrag`, which a web wheel never fires; on a phone a finger drag does. | NOT SEEABLE (phone touch only) |
| Harmonic | S3 #15 two-tap reset | PRESET tray, ⟲ RESTORE PRESET | One tap → "TAP AGAIN TO RESET". It disarmed by itself after 3.5 s. Tap + tap → fired, and the key went back to "⟲ RESTORE PRESET". | PASS |
| SS ROUTE 4 / BUILD / Operate | S3 #16 −/+ lane ends | SEND + ×3; PART +; PREAMP −/+ ×40 | SEND OFF → −54 dB; PART + put "Vocal microphone" in hand; PREAMP walked the whole range | PASS |
| Miking M01 | S3 #18 dock labels not cut on the first frame | Sampled the dock every 20 ms for 120 ms after each step change, over 5 steps | No dock key label cut (only the "−"/"+" glyph boxes report a 1 px overflow) | PASS (no six-key Placement step reached) |
| SS Troubleshoot | S3 #20 reading-well fold + OPEN DISPLAY | Scrolled the case into view | The bar read "▾ OPEN DISPLAY"; a touch on the dock opened it again | PASS |
| DJ 10 | S3 #29 / F2 phase-2 tray fold on a tall display | DECKS tray, real tap | The display folds, but the card grows into the freed room. The lesson is hidden behind it. | **FAIL F1** |
| EarLab | S3 #21 START HERE | Menu | Pill over "Understanding Level & Amplitude" | PASS |
| EarLab | S3 #22 Mic Selection first | Menu | Instruments & Recording opens with "Microphone Selection Lab" | PASS |
| EarLab | S3 #23 no cut blurbs | Clamp scan of 137 clamped text nodes | 390: 0 cut. **320: 50 cut** (9 titles, 41 blurbs) | PASS at 390 / **FAIL F2 at 320** |
| EarLab | S3 #24 ✓ DONE | — | No lab is done in this account | NOT SEEABLE |
| Harmonic | S3 #25 FINISH fallback after a check | CHECK pane text | "FINISH · SEE WHAT'S LEFT ›" present | PASS (a pass was not run first) |
| SS BUILD | F2 #1 capstone 2 completable | — | F2 saw it; I did not rebuild it | NOT SEEABLE (not re-run) |
| SS BUILD | F2 #3 no free ticks on an empty venue | Walked capstones 1–10 | REQS 0/7 … 0/12; no ✓ anywhere | PASS |
| SS BUILD | F2 #10 no ".." | Read the venue line of all 10 capstones | None | PASS |
| SS Troubleshoot | F2 #4 FAULT locked until a probe | Real tap on FAULT | "FAULT — locked: probe a station first. The bench names a fault from a reading, not from the list."; no tray | PASS |
| SS Troubleshoot | F2 #9 WRONG CONTENT | Probed Console output | READS "WRONG CONTENT"; key "PROBE ▸ WRONG CONTENT" | PASS |
| SS Troubleshoot | F2 #11 PROBE ▸ NO SIGNAL | — | No dead station probed | NOT SEEABLE (F2 saw it) |
| SS Troubleshoot | F2 3b short causes; own reasons; no answer in the setting lines | Case card, FAULT options, a wrong pick | Options are short causes with no fix. The wrong pick printed its own reason ("With aux-fed subs the crossover does not choose…"). Setting line: "Aux-fed subs: the console decides which channels the subs get." | PASS |
| SS Troubleshoot | F2 #6 \<MODE> COMPLETE | — | Needs all 22 faults solved | NOT SEEABLE |
| SS Troubleshoot | F2 phase-2 #4 end rows "Left: …" | FINISH on module 6 | "02 Dead signal / Left: Solve all 6 faults · Solve at least one with a source-forward walk". "04 Routing / Left: Solve all 5 faults" (the forward walk I did is dropped). | PASS (spoken label: **FAIL F3**) |
| SS Operate 3 | F2 #7 "met earlier, not now" | PREAMP down to QUIET, then back up to CLIPPING | "✓ No stage clipping · met earlier, not now" and "✓ At least 12 dB headroom at every stage · met earlier, not now" | PASS |
| SS Operate 5 | F2 #8 rack spoken label | STEP: mute, then amps | The drawing shows AMPLIFIERS / LOUDSPEAKERS ○ OFF; the spoken label says "…Amplifiers off, Loudspeakers off" | PASS |
| SS ROUTE 4 | F2 #12 short wedge names | SEND + ×3 | W1 · SINGER cell reads "Vocal" | PASS |
| DJ 6 | F2 #15 the 8-second rule | START THE FAULT; trims down | MIX BUS OVER → CLEAN, "Fixed. …", ✓. It stayed CLEAN for 16 s. The interim "keep it" line was not seen: "Fixed." was up 1–4 s after my last trim tap, because one rendered chunk seems to cover the 8 s. | PASS (the interim line is not seen) |
| DJ 10 | F2 #16 three decimals | Played A and B | "B vs A +0.066 beat"; the Do line says "0.062 or less" | PASS |
| DJ 24 | F2 #17 ROOM wording | Powered all 7, OPEN THE DOORS | This event's fault was "thin and one-sided", not a hot trim. Checked by code only (p24Capstone.tsx:477, :535). | NOT SEEABLE (random event) |
| DJ 24 | F2 #19 power switches | EVENT tray; real tap on DECK A | Seven switches "DECK A power, off" … each 352x44. ON gave "DECK A power, on", POWER 1/7. All back OFF. | PASS |
| DJ 11 | F2 #20 PRACTICE SCENARIOS fold | GRID tray | "PRACTICE SCENARIOS ▸" closed; the scenarios are not shown | PASS |
| DJ 14 | F2 #21 no free tick | START THE FAULT | The fault set KEY LOCK on and key shift +1; "○ Lock the key" and "○ Shift the key a step" stayed ○ | PASS |
| DJ 7 / 21 | S3 #10 / F2 #18 no "dBFS dBFS" | Scanned every aria-label on screen 21 | None doubled. The cells read "—" (no playback there), so it is not proven with a reading. | PASS (no reading) |
| DJ | F2 phase-2 balanced checks | Read screens 6, 10, 11, 24 | Right options are not much longer. On 11 and 24 the right one is still the single longest (50 vs 41 characters, ratio 1.22), which is within F2's ≤ 1.45 rule. | PASS (observation below) |
| DJ | F2 phase-2 sound-off line, captions, ABOUT | — | Covered above | PASS |

## FAIL list

### F1: DJ screen 10, an open tray still hides the whole lesson (S3 #29 / F2 phase-2 shared need)

Repro:
1. Load `#labpreview/DJSystemsLab` at 390x844. Go to module 10 ("Tempo, beatmatching and phrasing").
2. Tap the **DECKS ▸** key.
3. First frame: the display is whole and the card sits right under the bezel. No lesson line is visible.
4. A beat later the display folds to its strip, as S3 built. But the card then grows to fill the room the fold freed:
   - the card spans y 312–678 (366 px) in an 844 viewport;
   - every lesson line (y 370–702) is behind it;
   - only the last ~24 px of one line shows between the card and the SLIDER lane.
   - S3_REPORT claimed "about four lesson lines readable above the card". That is not what happens.

Suspected cause:
- `src/screens/lab/rack/RackUnit.tsx:731-732`: `trayTop` and `trayRoom` are worked out from the **folded** `stageBlockH`.
- So `maxHeight={trayRoom}` (RackUnit.tsx:751) grows after the fold.
- `DockTray.tsx:222-223` then sets `minHeight: Math.min(tallestH, maxHeight)`. The DECKS tray content is tall, so the card takes all the freed room.

What a fix must do: keep the card's height from the unfolded layout, or cap it at (room − TRAY_READ_MIN).

### F2: Labs menu at 320 wide, tile titles and blurbs are cut (S3 #23)

Repro:
1. Load `#labpreview/EarLab` and set the viewport to 320x844.
2. 50 of the 137 clamped text nodes are cut (scrollHeight > clientHeight):
   - **9 titles**, for example "Understanding Level & …", "Speaker Placement & …", "Cable & Connector Fundamentals", "Audio Connectors & Cable Selection", "Patchbay Signal Flow & Normalling", "Stage Plot and Channel Designer", "Mastering Lab: From Final Mix to Release", "Tuning & Temperament Lab", "Cymatics Lab: Sound Made Visible".
   - **41 blurbs**, among them most of the new short `tileBlurb`s.
3. At 390: 0 cut.

The fix only reached 390. The owner accepted hidden names at 320 for Stage Plot only, so this needs an owner call.

Suspected cause: `src/screens/lab/labCatalog.ts` (the `tileBlurb` lengths, up to 64 characters) and the title/blurb clamp in `src/screens/lab/EarLabScreen.tsx` `LeafTile` at narrow tile widths.

### F3 (small, screen reader only): a Sound Systems end row's spoken label runs two sentences together

Repro:
1. Open SS Troubleshoot and walk modules 1→6.
2. Tap FINISH ›.
3. Read a row's accessibility label. It says: "page 2, Dead signal. Left: Solve all 6 faults · Solve at least one with a source-forward walk **Opens it.**" There is no full stop before "Opens it".

Suspected cause:
- `src/screens/lab/soundsystems/pageMemory.ts:87`: `goalsLeftLine` returns the line with no end stop.
- `src/screens/lab/kit/LabEndScreen.tsx:226` appends `${r.detail} Opens it.`.

## Regressions and other things I noticed (not FAILs)

- **"N of total" counters on screen.** I did not run git, so I have not confirmed that none of them was added in this round. They look older than this round, but S3 #16's −/+ keys now step through them:
  - SS hub cards "0/22", "0/10";
  - bezel "CASE 5 OF 5";
  - "Capstone 3 of 10 · …";
  - DJ "A PHRASE 3 / 8" and "POWER 0/7";
  - Miking "SETUP: 1 of 6".
- **SS Troubleshoot: the step line goes stale.** "▸ Keep walking forward until the reading changes — then name the fault." stays on screen after the start station has already read WRONG CONTENT, and after the case is solved.
- **SS Operate 5: the STEP options give away the order.** They read "Console — save first", "Stage devices — last", "Amps and powered boxes — FIRST". The bezel then reads "LAST · AMPS AND POWERED BOXES — FIRST". Not F2's item, but it reads oddly and gives the answer.
- **DJ 11: the GRID tray gives away the check.** It says "…the music's structure finds the one, not the loudest kick". On screens 11 and 24 the right option is also still the longest line.
- **DJ 14: spoken grammar.** The key says "key shift 1 semitones".
- **DJ 6: the TRIM key's spoken label repeats itself.** It says "TRIM 1: TRIM 1 +9.0 dB".
- **Browser only: SS ROUTE 4 lane readout cut.** "-54 dB Lead vocal → singer's wedge" is ellipsized in the 196 px lane. `fitValue` does not shrink text on web; on a phone it should shrink to about 10 pt. Not a phone failure as far as I can tell.
- **SS Troubleshoot: right answer ignored after a wrong pick.** A tap on the right option before a new probe does nothing. This is the deliberate lock from 2026-09-29. The other options' blurbs say "Probe another station before naming the fault again", but the tapped option itself shows no change.
- **Most option trays are sticky** ("stays open — compare while you watch"), so the scroll-closes-a-pick-tray rule applies to few trays: SS CASE is one; SOURCE, PAN, PRESET, PROBE, FAULT, STEP, DECKS and SETUPS are all sticky.
