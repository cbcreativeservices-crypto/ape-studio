DJ Systems Lab, Stage 1 (screens 1–12): audio-expert review. Review only: I edited, committed and built nothing.

I read the model, deck, time, render, DSP and music code, the dock, trays, setup, the art files, all 12 pages, MODEL.md, SOURCES.md, both brief files and all 15 screenshots. The one thing I ran was a read-only node script in my scratchpad that measured each track's peak and average level from the engine.

**What checked out:**
- Isolator: LR4 at 250 Hz / 2.5 kHz, bands sum to all-pass.
- RIAA: 3180/318/75 µs, with an exact inverse.
- Phono +36 dB, clipping before the trim.
- dBu/dBV numbers on the level ladder.
- Crossfader: −3.01 / −6.02 / 0 dB at centre.
- +6.02 / +3 dB summing.
- NIOSH tile.
- Semitone math.
- Split cue L = cue / R = master.
- Cue tap: pre-fader.
- Booth: pre-master.
- Phones master side: pre-master knob.
- Male XLR outputs.
- Mirrored channel order on the rear panel.
- No brand names, no citations.
- "Suggested starting point" wording is present.

**Measured levels (engine, bar 17, 8 s window):**

| Track | Peak | Average (RMS) | Crest |
|---|---|---|---|
| Night Ferry | −6.3 dBFS | −19.8 dBFS | 13.4 dB |
| Glass Harbour | −0.6 dBFS | −8.9 dBFS | 8.2 dB |
| Slow Orbit | −3.7 dBFS | −16.9 dBFS | 13.2 dB |

## Findings

**1. WRONG.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p06Gain.tsx:50-53, 92, 105`
- **Problem:** The goal "Matched within 2 dB" compares PEAKS only, and the text says the trims "even them out". With peaks matched, Glass Harbour is still about 5 dB louder on average. Peak is not loudness. The research brief (DJ12) also asks for "peaks, average level".
- **A pro expects:** Match by average level (where the meter's bar sits most of the time) and by ear in cue. Use the peak only as a ceiling.
- **Fix:**
  - Show an average readout per channel (`last.rmsDb.ch1` / `ch2` already exist).
  - Change the goals to "averages within 2 dB, peaks below −3 dBFS".
  - Add: "Peaks are not loudness. A loud master reaches the same peak as a quiet one but sounds several dB louder. Match where each meter sits most of the time, and check by ear in your headphones; use the peak only to stay out of the red."

**2. MISLEADING.**
- **Where:**
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p06Gain.tsx:32-41`
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p08Faders.tsx:64-68`
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p09Eq.tsx:40-45, 201-206`
- **Problem:** Both decks start together at bar 17 with pitch 0: 122 against 126 BPM. They drift 4 beats a minute, a quarter-beat flam after about 3.75 s and half a beat after 7.5 s. Screen 9 then says "kill one LOW and the blend clears up" over a train wreck, and Screen 8 teaches "smooth blends" the same way.
- **A pro expects:** Never judge an EQ blend or a crossfader curve on tracks that are not beatmatched.
- **Fix:**
  - In these setups, set deck B's pitch to `pitchFor(126,122)` (−3.17 %) and phase-align it, for example with `sync(b,t,'B')` on the TRUE grid.
  - Add: "Deck B's tempo has been matched to deck A for you — Screen 10 shows how."

**3. MISSING (safety).**
- **Where:**
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p03Connect.tsx:287` ("Pull the red plug" with the PA live)
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p04Build.tsx:146-147, 183-184` (the fault is fixed by moving MASTER L into a live speaker)
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\trays.tsx` (`PatchTray`)
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\model\djModel.ts:449-452`
- **Problem:** The model flags a thump only for power switching. Patching a cable while the PA is live is silent and unflagged. A half-inserted RCA plug buzzes and pops loudly through a live PA, and re-plugging a master cable into a live powered speaker can bang.
- **Fix:**
  - On p03, add a Note: "The lab keeps this quiet. On a real system, pull the channel fader (or the MASTER) down before you plug or unplug any audio cable — a half-inserted RCA plug buzzes loudly through the PA."
  - First hint of the p04 fault: "Turn the MASTER down (or the PA off) first."
  - In `PatchTray`, raise a HOT-PATCH warning, like THUMP, when a cable into a live speaker, or a source cable on a channel that is up, changes. Reuse `deviceLive` and `speakerCabled`.

**4. MISLEADING.**
- **Where:**
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p12Loops.tsx:38, 293, 339`
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\model\djModel.ts:251-257`
- **Problem:** "The sampler plays out of its host deck's channel" is stated as a general rule. Most club media players have no sampler at all. In DJ software the sampler usually has its own output: often straight to the master, with its own level and its own headphone CUE button, or assigned to a chosen channel.
- **Fix:**
  - TERMS: "Where a sampler plays out depends on the system: in some it follows a deck's channel (as here); in many it goes straight to the master with its own level and headphone-cue button. Check before you fire a pad on a live system."
  - "Why" text: "In this booth the sampler plays out of its host deck's channel…"

**5. WRONG.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p11Grid.tsx:72`
- **Problem:** "a correct grid puts its bold bar lines on the strongest kicks." In four-on-the-floor music every kick is the same level; in `djMusic.ts` all four kicks have equal gain (0.75 / 0.8). The "one" is found from the structure, not from kick strength.
- **Fix:** "A correct grid puts a thin line on every kick and a bold bar line on the 'one' — where a crash, a chord change or a new part lands, and straight after a drum fill."
- **Also, line 198:** "the tall kick peaks fall BETWEEN the lines" runs on Glass Harbour, the loud soft-clipped master (8.2 dB crest). In `11_grid_390.jpg` its lane is a solid wall: no kick peaks or grid lines can be seen. Run this lesson on Night Ferry (13.4 dB crest, clear kicks), or colour the lane by low band.

**6. MISLEADING.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p06Gain.tsx:96-106`
- **Problem:** The trims are set with both tracks on air (faders 0.85, CROWD perspective).
- **A pro expects:** Set the incoming deck's trim in the headphones, CUE on and fader down, matching the on-air channel.
- **Fix:**
  - Start ch2 with fader 0, cue on.
  - Do text: "Cue deck B with its fader down and set TRIM 2 until its meter sits with CH1 — the crowd never hears you do it."

**7. MISLEADING.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p06Gain.tsx:27, 101, 137`
- **Problem:** A mix bus with its own clip, before the MASTER knob, is presented as universal. Analog summing buses can clip. Many digital DJ mixers have spare room inside, and their first hard limit is the master or the output converter. The principle (a later control cannot undo an earlier clip) is right.
- **Fix:**
  - TERMS: "…On this mixer it has its own limit (many analog mixers do; many digital ones have more room inside). Wherever a stage clips, a later control cannot undo it."
  - "Why" text: "On this mixer the mix bus was clipping…"

**8. MISLEADING.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p05Play.tsx:28, 196-199`
- **Problem:** "On most players loading stops whatever that deck was playing." Behaviour varies: some players stop, some jump straight into the new track, some block the load with a lock setting.
- **Fix:** "Depending on the player, loading onto a playing deck stops it, jumps straight into the new track, or is refused by a load-lock setting — on air, any of those is a disaster. Load only onto the deck the crowd is not hearing." Adjust `wrong[2]` to match.

**9. MISSING.**
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p05Play.tsx:29, 184` and `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\model\djDeck.ts:86-94`
- **Problem:** There is no hold-to-preview on the transport CUE (holding CUE at the cue point plays it; letting go snaps back; pressing PLAY while holding lets it run). This is the core way to release a track on the "one".
- **Fix:** Add to TERMS and Step 3: "On most players you can HOLD CUE to hear from the cue point; let go and it snaps back. Press PLAY while holding to let it run." Model it later as a `cueHold`.

**10. MISLEADING.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p05Play.tsx:152-168`
- **Problem:** The "JOG" key is a fader over the whole track. That is a needle (strip) search, not a jog.
- **Fix:** Rename the key SEARCH. Keep the ±1 s steps and add ±1-beat steps labelled JOG.

**11. MISSING.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p05Play.tsx:31` and `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p10Tempo.tsx:87`
- **Problem:** There is no jog-mode caution. In VINYL (scratch) mode, pressing the top plate of a playing jog grabs and stops the track, a classic beginner train wreck.
- **Fix:** "…Push or drag the outer ring to nudge. In VINYL mode, pressing the top plate grabs the track like a record — never rest your hand on it."

**12. MISLEADING.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p10Tempo.tsx:224`
- **Problem:** "bring TEMPO B down until its BPM reads like A's." On players and DJ turntables, + is toward the DJ (the lab's own `PlayerTop.tsx:14, 269` draws it that way). To slow B you push the fader AWAY from you.
- **Fix:** "Slow deck B: move TEMPO B toward − (away from you on the player) until its BPM reads like A's."

**13. MISLEADING.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p10Tempo.tsx:246-266`
- **Problem:**
  - The fault is a half-beat offset (about 246 ms) fixed with 8 / 20 ms nudges: about 12 presses, yet the "why" says "A few nudges".
  - The clash stays on air the whole time (ch2 fader 0.85, CROWD perspective).
- **A pro expects:** Take the clashing deck out first, fix it in the headphones (re-drop on the one, or a firm push), then bring it back.
- **Fix:**
  - First hint: "Pull B out of the mix (fader down) and fix it in your headphones."
  - Add a ¼-beat "BIG PUSH", or "CUE + re-drop on the one".
  - `fixed` also requires the fader back up after the fix.
  - "Why": "A big offset is quickest fixed by restarting B on the one; nudges are for the last few milliseconds."

**14. MISLEADING (mild).** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p10Tempo.tsx:39-40`
- **Problem:** "Fix offset with a jog NUDGE, not the tempo fader." Many DJs, vinyl DJs especially, correct phase with a brief ride of the tempo fader and back.
- **Fix:** "…with a jog nudge (or a quick push of the tempo fader and straight back — leave it moved and you create drift)."

**15. MISSING.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p10Tempo.tsx:219-233` and `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p07Cue.tsx:186-196`
- **Problem:** Nothing says which sound to beatmatch against. The PA arrives late by distance, about 2.9 ms per metre.
- **Fix:** Add a Note: "In a big room the PA reaches you late — about 3 ms for every metre. Match against your headphones and the booth monitors, never the sound coming back off the floor."

**16. MISSING.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p10Tempo.tsx:229`
- **Problem:** With no key lock, 126 → 122 BPM is −0.56 semitone. Glass Harbour (D minor) then sits about half a semitone flat against Night Ferry's A-minor bass and chords, which sounds sour. Its bass enters at bar 9.
- **Fix:** "…about half a semitone lower — enough to sound sour against deck A's bass and chords. Blend over drum-only intros, or use key lock (later in the course)."

**17. MISLEADING / POLISH.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\engine\djMusic.ts:19-23, 54-61`
- **Problem:**
  - The outro is 8 bars, and only 4 of them are drums-only (bars 61–64), while the intro is 16 bars.
  - The whole track is 64 bars, about 2:06 at 122 BPM, so a mix started from bar 17 runs out in about 90 s.
  - DJ-friendly tracks mirror the intro: 16–32 bars of outro, at least 8 of them drums-only.
- **Fix:**
  - Lengthen the tracks to 72–80 bars.
  - Make the OUTRO 16 bars (8 drums + bass, then 8 drums).
  - Update `test/djMusic.test.ts` and regenerate `djTrackData.ts`.

**18. MISSING.**
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p08Faders.tsx:27-33` and `C:\Users\profe\dev\ape-dj-lab\docs\labs\dj\SOURCES.md:32`
- **Problem:** Crossfader REVERSE (hamster) appears nowhere in learner text, yet SOURCES F18 says it is "mentioned only". The channel-fader curve switch is also absent.
- **Fix:**
  - Add a term: "Reverse (hamster): swaps the crossfader's sides — check it when a cut comes in backwards."
  - Correct SOURCES F18.

**19. POLISH.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p08Faders.tsx:87, 181`
- **Problem:** The goal "Hear two copies add +6 dB" also accepts DIP at centre. There each side is −6.02 dB, so the sum only equals one deck alone (0 dB).
- **Fix:**
  - Require CUT (or both on THRU).
  - Add: "Real copies are never sample-aligned; a few milliseconds apart they phase (a jet-like comb sound)."

**20. MISLEADING (mild).** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p03Connect.tsx:36` (against `djModel.ts:118`, 2 mV)
- **Problem:** "Mic level … smaller still, about a thousandth of a volt." That clashes with the ladder's 2 mV. A loud close vocal on a dynamic mic reaches tens of mV, overlapping phono level or exceeding it.
- **Fix:** "Mic level: around phono level or a little lower — about 1–3 mV for close speech, far more for a shout — so a mic input adds roughly 40–60 dB of gain."

**21. POLISH.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p03Connect.tsx:38` and `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p04Build.tsx:25`
- **Problem:** "the signal plus a flipped copy, so noise cancels." Rejection comes from the differential input, and many outputs are impedance-balanced with no flipped copy.
- **Fix:** "Two signal wires and a shield; the input takes the difference between the two wires, so hum picked up equally on both cancels."

**22. MISSING.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\art\RearPanels.tsx:72-95` (MixerRear, PlayerRear)
- **Problem:**
  - No printed socket legends (CH1 / CH2, PHONO / LINE, L / R, MASTER, BOOTH, GND, DIGITAL OUT, LINK). Reading them is the Screen 3 lesson ("Read all five before you plug in"); compare `03_connect_390.jpg`.
  - MASTER L / R are drawn L-left from behind (not mirrored), while the channel inputs are mirrored. Printed labels remove that ambiguity.
- **Fix:** Draw the legends (at least 9 pt in close views).

**23. POLISH.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p02Gear.tsx:126` (`art/gear.tsx` Headphones)
- **Problem:** The a11y text says "from the front", but the L cup is drawn on the viewer's left. Seen from the front, the left cup is on the viewer's right.
- **Fix:** Say "as you wear them", or mirror the drawing.

**24. POLISH.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\model\djModel.ts:57-63`
- **Problem:** Trim unity sits at 62.5 % of travel (about 1:30 on the dial). Real trims mark 0 dB at the 12 o'clock centre detent.
- **Fix:** Use a piecewise taper with 0 dB at p = 0.5, or a −12 … +12 range.

**25. POLISH.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p02Gear.tsx:37`
- **Problem:** "One 6.35 mm stereo plug." Many DJ headphones have a 3.5 mm plug with a 6.35 mm adapter, and the drawn mixer front has both jacks.
- **Fix:** "One stereo plug (3.5 mm, often with a 6.35 mm adapter) carries both ears."

**26. MISSING.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p04Build.tsx:147`
- **Problem:** The powered speaker's own setup is not mentioned: its MIC / LINE input switch and its level knob. A line feed into an input set to MIC distorts.
- **Fix:** Add to the safety note: "…and check each powered speaker's input is set to LINE, with its level at the marked unity point."

**27. POLISH.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p01Welcome.tsx:210-212`
- **Problem:** "Fixed" accepts only a change of LISTEN. In a real booth, silent headphones mean nothing is cued.
- **Fix:** Also accept CUE 1 on, or the blend past centre. Reword the "why" so the lesson is "nothing was cued to the headphones", not "it was the phone's perspective".

**28. POLISH.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p05Play.tsx:80-83, 175`
- **Problem:** The text says "deck A plays to the crowd — ON AIR", but setup leaves deck A paused; `05_play_390.jpg` shows "ON AIR NOTHING".
- **Fix:** Start deck A at setup, or make "Start deck A" the first goal.

**29. POLISH (audible).** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\engine\djRender.ts:280` (and line 216)
- **Problem:**
  - `chanDsp()` is rebuilt for every chunk, so the isolator, filter and RIAA filters restart from zero at each 3 s / 8 s join. With an EQ cut, a resonant filter (Q 3.5) or a phono stage engaged, that is a transient click or thump at every join.
  - `ballistics()` restarts at −60, so the meters dip at every join.
- **Fix:** Carry the channel DSP states and the last meter / hold values across contiguous chunks; reset them only on a discontinuity.

**30. POLISH.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\shared.tsx:278`
- **Problem:** The readout "OVER +1.4" shows a level above full scale, which no real meter can read.
- **Fix:** Show "CLIP", with "(over by 1.4 dB in this model)" in words if wanted.

**31. MISSING (mild).**
- **Where:**
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p07Cue.tsx:32`
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p06Gain.tsx:91`
- **Problem:** Screen 7 never says that cue taps vary between mixers (SOURCES U1 claims the lab does). Screen 6 omits the filter from the meter tap ("after TRIM and EQ").
- **Fix:**
  - p07: "…before its fader (on this mixer, after trim, EQ and filter — real mixers vary)."
  - p06: "after TRIM, EQ and FILTER".

**32. POLISH.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p12Loops.tsx:356`
- **Problem:** The summary says "Beatmatch by ear", but Screen 10 relies on the phase strip and the BPM readouts.
- **Fix:** Either add a Screen 10 goal with the readouts hidden, or reword to "Beatmatch with your ears and the displays".

**33. POLISH.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\model\djDeck.ts:154-160`
- **Problem:** Beat jump cancels an active loop. On many players a beat jump inside a loop moves the loop.
- **Fix:** Say so in the p12 TERMS.

**34. POLISH.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\art\TurntableTop.tsx:171`
- **Problem:** The strobe light is lit only while the record plays. A real strobe light is on whenever the turntable is powered; that is how speed is checked.

**35. POLISH.** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p11Grid.tsx:36, 44`
- **Problem:** Half / double BPM uses only 126 read as 63.
- **Fix:** Name the cases that actually come up: drum & bass 174 / 87, hip-hop 85 / 170, dubstep 140 / 70.

## Top 5 must-fix

1. **#1 (p06):** Gain matching by PEAK leaves Glass Harbour about 5 dB louder on average. Add an average readout and match on it.
2. **#2 (p06, p08, p09):** Blends and EQ lessons run on un-beatmatched tracks (122 against 126 BPM). Pre-match deck B's tempo and phase in these setups.
3. **#3 (p03, p04, `PatchTray`):** No hot-patching caution, while the lab has learners pull and move audio cables into a live PA. Add the warning and a HOT-PATCH flag.
4. **#4 (p12):** Sampler routing is taught as a universal rule. Say where it varies.
5. **#5 (p11:72, 198):** "Bold bar lines on the strongest kicks" is false for four-on-the-floor music, and the kicks cannot be seen on the loud track. Fix the wording and use Night Ferry for the grid lesson.

Close behind: #12 (the tempo fader's physical direction), #13 (the half-beat offset fault left on air, fixed by about 12 nudges) and #8 / #9 (load behaviour and hold-to-preview CUE).

The only file I wrote is the scratch measurement script: `C:\Users\profe\AppData\Local\Temp\claude\C--Users-profe\9f204438-260c-4368-9117-696fe9f3adbe\scratchpad\crest.ts`.
