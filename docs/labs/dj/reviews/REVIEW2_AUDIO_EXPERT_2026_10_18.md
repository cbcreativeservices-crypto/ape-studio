DJ Systems Lab, Stage 2 + 2b (screens 13–24): audio-expert review. Review only: I edited, committed and built nothing; this file is the only one I wrote.

Branch dj-lab, head 72242637 (the merge of dj-lab-b), worktree C:\Users\profe\dev\ape-dj-lab.

I read pages p13–p24, eventShared, s2kit and registry.ts; the models djEffects, djKey, djLaptop, djVinyl, djDvs, djEvent, djRoom, djChangeover and djCapstone; the engines djFx, djStretch (header and core), djStems and djEventRender (header, crossover and hum); booth/setup.ts (preMatched); MODEL.md; SOURCES.md; and the Stage 1 review. I opened the screenshots as images: 13b, 13c, 14, 15b, 16, 17, 17b, 18b, 19a, 19b, 20a, 20b, 20c, 21a, 22a, 23a, 24b, 24c and 25b.

**What checked out:**
- **Echo timing:** beats × 60 / played BPM. 1 beat at 122 BPM = 492 ms and ¼ beat = 123 ms, as the 13b and 13c screenshots show. Internal feedback is capped at 0.92, with a 6 kHz darkening on each repeat.
- **Reverb:** comb gains use g = 10^(−3·delay/RT60), the correct RT60 law.
- **FX send/return loop:** a real outer loop with its own path, held under −12 dBFS by a soft limiter. "Pull the RETURN down first" is the right first move.
- **Semitone maths:** 12·log2(rate) everywhere:
  - +8 % = +1.33 st;
  - 126 → 122 BPM = −0.56 st;
  - 0.88 = −2.21 st.
  The key-relation logic (D minor and A minor are circle-of-fifths neighbours, one note apart) is right.
- **WSOLA (the time-stretch method):** 2048-sample periodic Hann grains at 50 % overlap sum exactly to 1 (42.7 ms at 48 kHz); ±512-sample (10.7 ms) search; normalised cross-correlation. The "simple, honest stretch" wording is accurate.
- **Stems:**
  - The leakage matrices' columns all sum to 1. I checked all eight.
  - "Separated" is always labelled a SIMULATION, never an algorithm, never "AI".
  - The original/separated distinction is taught correctly.
- **Laptop model:**
  - One buffer = B/SR.
  - The smallest clean buffer is 256 for two decks at 48 kHz, 1024 for live stems.
  - The controller cable carries no audio; there is a device list; a deck mapped to the wrong output pair is a fault.
- **Turntable:**
  - The balance → zero → set method.
  - Skating loads the inner groove wall (LEFT), so the RIGHT channel mistracks first. That is correct for the 45/45 groove.
  - The anti-skate set-to-zero practice of scratch DJs is mentioned.
  - A double phono stage is "about 36 dB too hot, bass boosted twice".
  - The ground wire is a signal ground, never the mains earth.
- **DVS (digital vinyl system):**
  - A quadrature control tone drawn as a ring.
  - ABSOLUTE / RELATIVE / INTERNAL / THRU described correctly.
  - THRU with a control record sends the tone to the PA.
  - The round trip is two buffers.
- **Mic:**
  - Phantom power belongs to the input.
  - Switch +48 V with the mic OFF.
  - A wireless receiver on LINE overloads the input before the gain knob.
  - A condenser is about 12 dB hotter than a dynamic.
  - The feedback loop is summed as power over each path, with a cardioid pickup. "Win back 6 dB" and "mic level DOWN first" are right.
- **PA:**
  - The −6 dB angle definition, the steep fall outside it, subs near-omni (−6 dB behind).
  - LR4 crossover at 100 Hz (two cascaded Butterworth sections, which sum flat).
  - Mono bass.
  - A Y-cable is not a summing circuit, and the explanation is correct.
  - The engineer owns the gain; MASTER stays at unity.
  - Tops behind the DJ make the decks the loudest seat in the house.
  - Turntable rumble from the subs is a different loop from mic feedback.
- **NIOSH dose (the noise-exposure model):** `nioshDose([dj],[240])`, 85 dBA / 8 h with a 3 dB exchange, so 4 h at 88 dBA = 100 %. Correct, and not cited in-app.
- **Recording:**
  - Tap choice; REC OUT before the MASTER knob ("mixers differ").
  - Loopback hears only the computer.
  - The monitoring-loop quiz is excellent.
  - Clipping in the recorder is in the file forever.
- **Hybrid rig:**
  - MIDI clock at 24 ticks a beat, setting tempo but not the bar (START does that).
  - TRS-MIDI type A / type B swaps the tip and ring wires, so the plug fits and nothing arrives (correct).
  - USB needs a host.
  - The 0.6 BPM drift answer is right.
- **Changeover:**
  - An input list; two USB paths; level matching by average in the headphones.
  - A backup that needs no computer.
  - The earth-lift refusal text is excellent and is offered as the wrong answer in every repair and prevention debrief.
- **Capstone:**
  - The signal-tracing method.
  - Each fault's evidence is the meter logic a pro uses. "Hum in the crowd but not the booth or the headphones, only on the left, so it entered after the mixer" is exactly right.
- **Hot-patch cautions:** added on 17, 22 and 24, following Stage 1 #3.
- **House rules:** no brand or model names (one borderline term: #23); no citations shown to learners; "starting points, not rules" present on 13, 14, 15, 17, 18 and 22.

## Findings

**1. WRONG (in effect).** The "pre-matched" blends are half a semitone out of tune.
- **Where:**
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\booth\setup.ts:31-36` (`preMatched`)
  - used in `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p13Effects.tsx:138`, `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p15Stems.tsx:80, 203`, `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p16Laptop.tsx:97` and `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p24Capstone.tsx:194, 318`
- **Problem:**
  - `preMatched` slows Glass Harbour 3.17 % with key lock OFF, so deck B sounds −0.56 st: the exact state Screen 14 labels OUT OF TUNE and calls "sour".
  - The Screen 13 goals "One reverb on both decks" and "Effect on deck B only" need both decks up from bar 17, where both tracks have bass and chords.
  - Screen 15's stem blend is the worst case:
    - at bar 41 (the drop), deck A's chords and melody (A minor) sit over deck B's groove half a semitone flat;
    - deck A's BASS stays on under deck B's bass, so two bass lines clash, which is the Screen 9 lesson.
  - A pro hears all of this at once.
- **A pro expects:** Tempo-matched demos that are also in tune, and a stem swap that swaps the bass along with the drums.
- **Fix:**
  - Give `preMatched` a key-lock option, used by these screens: `B: { ...B, pitch: …, keyLock: true }`.
  - Reword the Notes: "Deck B's tempo has been matched to deck A for you, with key lock on — Screens 10 and 14 show how."
  - p15 Do text (line 203): "…with deck A's DRUMS and BASS off and deck B's drums and bass on — A's chords and melody over B's groove."
  - The `swap` goal (p15:135) should also require `gA.bass === 0`.

**2. MISLEADING.** PA L is drawn on the crowd's RIGHT.
- **Where:**
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\model\djRoom.ts:7-9, 73-74, 89-90`
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\art\PlanView.tsx:4, 204`
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p20Pa.tsx:347` (the swap note)
  - screenshots `20a_pa_room_corners_390.jpg` and `19b_mic_room_ringing_390.jpg`
- **Problem:** The model puts PA L at +x, the DJ's LEFT hand as they face the crowd. That is the crowd's RIGHT. In live sound, the left main normally stands at HOUSE LEFT, the audience's left, so the room hears the stereo image the right way round. The swap note "the room's left speaker is playing your right channel" then teaches the mirror of common practice.
- **A pro expects:** "Left" is from the audience (house left); a DJ facing the crowd has PA L on their right. Many clubs run mono anyway, and the engineer decides.
- **Fix:** Either move PA L to −x (the DJ's right) on every placement and in the plan art, or keep the drawing and add a TERM on p20: "Which speaker is LEFT is the venue's call. In live sound it is usually HOUSE LEFT — the crowd's left, your RIGHT as you face them. Ask the engineer; many club systems run mono." Then reword p20:347: "L and R are swapped against the venue's labels: swap the two inputs."

**3. MISSING (safety).** Speaker stands, passive amplifiers and speaker cables.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p20Pa.tsx:47, 351-352`
- **Problem:**
  - The screen has learners move tops onto stands "2.2 m up", and passive tops on an amplifier.
  - It never mentions stand safety, which is the one real way PA work injures people in a small venue.
  - The PASSIVE term never says to switch the amplifier off before you connect speaker cables (the terminals can carry tens of volts).
- **Fix:** Add a safety Note: "Real stands: on level ground, legs fully out, the top locked on the pole, the legs taped clear of feet, and never higher than the stand's rating. With passive speakers, the amplifier is OFF (or its level down) while you connect or move a speaker cable — its terminals can carry a shock-level voltage on a big amplifier."

**4. MISLEADING.** One booth, two mains frequencies.
- **Where:**
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\model\djVinyl.ts:69` (`HUM_HZ = 50`)
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\model\djEvent.ts:365` (`HUM_HZ = 60`)
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p17Vinyl.tsx:251`
  - `C:\Users\profe\dev\ape-dj-lab\docs\labs\dj\SOURCES.md:93`
- **Problem:**
  - Screen 17's turntable hum is 50 Hz ("in some countries 60 Hz").
  - The laptop and PA hums on 20, 23 and 24 are 60 Hz.
  - Mains frequency is fixed by the country, so the same venue cannot hum at both.
  - The turntable's acoustic resonance also differs: 80 Hz on 17 (`FEEDBACK_HZ`) and 60 Hz on 20 (`TT_RUMBLE_HZ`), for the same turntable on the same table.
- **Fix:**
  - Use ONE shared mains constant (50 Hz, as SOURCES F35 records) in both models.
  - Say "50 Hz (60 Hz in some countries)" wherever a hum is named on 20, 23 and 24.
  - Use one turntable resonance (about 60–80 Hz) in both feedback models.

**5. MISLEADING.** The mic target leaves no headroom for a shout.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p19Mic.tsx:66` (goal) and `:412`
- **Problem:** "Speech peaks between −10 and −3 dBFS." A DJ's "make some noise!" is 10 dB or more above conversational speech, so a channel set with speech peaks at −3 clips on the first shout. The goal also states a gain target as a rule.
- **A pro expects:** Set the gain on normal speech with plenty of headroom, then check a shout.
- **Fix:**
  - Goal: "Mic live: speech peaks −18 … −8 dBFS".
  - Text: "Set GAIN on your normal speaking voice until its peaks sit around −18 to −8 dBFS (a suggested starting point), then try a shout: it should stay out of the red. Announcements get louder than you think."
  - Keep the lab's default of +44 dB (about −8 dBFS speech) inside that band.

**6. MISLEADING.** Mic-to-line difference understated.
- **Where:**
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p19Mic.tsx:431`
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\model\djEvent.ts:89-92` (+38 dB)
  - `C:\Users\profe\dev\ape-dj-lab\docs\labs\dj\SOURCES.md:136` (F39)
- **Problem:** "A line-level signal is about 38 dB hotter than a mic." A dynamic mic on close speech is about 2 mV (−52 dBu). Consumer line is −10 dBV (−7.8 dBu, about 44 dB hotter); pro line is +4 dBu (about 56 dB hotter). Stage 1 (SOURCES F9, Stage 1 review #20) teaches "a mic input adds roughly 40–60 dB of gain".
- **Fix:**
  - Explain text: "A line-level signal is some 40–55 dB hotter than a mic."
  - Model: +44 dB (the overload result is unchanged).
  - SOURCES F39: "about 40–55 dB above mic level".

**7. MISLEADING.** "Mic feedback is high up the range."
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p20Pa.tsx:378`
- **Problem:** "MIC feedback rings through the air into a microphone, high up the range." The lab's own model rings the booth-monitor path at 630 Hz (`RING_HZ.booth`, screenshot 19b), and real rooms often ring first in the low mids (250–800 Hz) near wedges.
- **Fix:** "…MIC feedback rings through the air into a microphone, at whatever pitch the loop peaks first — often the mids or highs. TURNTABLE feedback is the floor and the table shaking the stylus — low and slow, from the subs."

**8. MISSING.** The decks dose leaves out the headphones.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p20Pa.tsx:352` and the 4-HOUR DOSE readout
- **Problem:** The dose counts only the PA spill and the booth monitors. For many DJs the headphones are the larger share, pushed up to beat the booth.
- **Fix:** "This dose counts the room at the decks only — your headphones add to it, often more than the room. Turn the BOOTH down before you turn the headphones up…" Also set the bezel sub-line under 4-HOUR DOSE to "ROOM ONLY".

**9. MISLEADING (mild).** A floor level stated as a target.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p20Pa.tsx:345` and goal 2
- **Problem:** "…until the FLOOR reads 95 dBA or more" reads as a rule. Real venues often have a licence limit (a sound limiter), and the engineer sets the room to it.
- **Fix:** "…until the FLOOR reads about 95 dBA (a suggested level for a busy floor in this model; a real venue's limit and its engineer decide)…"

**10. POLISH.** Stage-box position contradicts itself.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p20Pa.tsx:59` against `:155`
- **Problem:** The LOOK text says "the venue's stage box beside the booth"; the tray says "THE 20 m RUN TO THE STAGE BOX". The unbalanced-hum lesson needs the long run.
- **Fix:** LOOK: "…the venue's stage box at the side of the stage, about 20 m of cable away…" (or keep the box beside the booth and call the row "THE CABLE TO THE STAGE BOX (its multicore runs on to the engineer)").

**11. MISSING.** A crossover is flat only when the system is aligned.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p20Pa.tsx:350` (and `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\engine\djEventRender.ts:217-225`)
- **Problem:** "Turn it ON and watch the white line go flat." An LR4 pair sums flat only when the sub and the tops arrive in time and in polarity. In a real room the engineer sets a delay and polarity at the processor, and a sub a few metres from its tops can cancel around the crossover.
- **Fix:** Add: "…flat here because this sub and these tops arrive together. In a real system the engineer also time-aligns them (a delay and the polarity at the processor); a sub far from its tops can cancel round the crossover point."

**12. POLISH.** Coherent bass is shown as a power sum.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\model\djRoom.ts:28-29, 180-182`
- **Problem:** "Sources add as POWER (uncorrelated), which is the honest average for program music." That is fair for tops over a band. At sub frequencies, two subs playing the same mono bass add coherently: up to +6 dB where they are in step, and deep nulls where they are not. The bass map therefore understates both the build-up between the subs and the room's nulls.
- **Fix:** Add one line in the code comment and in MODEL.md §20: "Bass from several subs adds coherently (in-step +6 dB, out-of-step nulls); the map shows the average." No learner change is needed, since the in-app note already says "simplified".

**13. MISSING (safety).** Dropping the stylus on a live channel.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p17Vinyl.tsx:62` (`LOWER ONTO THE RECORD`) and Steps 2–3
- **Problem:** The learner lifts and lowers the arm with CH1 up and the crowd listening. On a real system, a stylus dropped or lifted on a live phono channel is a loud thump through the PA. It can also chip the stylus or damage the record.
- **Fix:**
  - Add a safety Note: "Lift and lower the arm with the cue lever, and with the channel fader down: a dropped stylus is a loud thump through the PA, and can chip the stylus."
  - Optionally flag a THUMP when `armUp` changes while `channelRoute(b,1)` is live and the fader is above 0.3.

**14. POLISH.** The subs feed turntable feedback too.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p17Vinyl.tsx:107` (RoomTray note)
- **Problem:** Screen 17 names only the booth monitor. In clubs the subs are the usual culprit, and Screen 20 teaches that.
- **Fix:** "…different from microphone feedback. The booth monitor does it here; in a club the PA's subs often do it too (Screen 20)."

**15. MISLEADING (mild).** One calibration method stated as universal.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p18Dvs.tsx:38, 99`
- **Problem:** "Calibrate with the needle in the groove and the platter STOPPED." That is one system's noise-floor step. Others calibrate with the record playing, or do both.
- **Fix:**
  - Tray note: "On this system, calibrate with the needle in the groove and the platter STOPPED (it measures the noise floor); some systems calibrate with the record playing. Do it again after any change to the setup."
  - TERM: "…on this system, with the needle on the still record…"

**16. POLISH.** The DVS screen runs on a large buffer.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p18Dvs.tsx:115, 160, 258`
- **Problem:** Setup uses `freshLaptop()` with a 512-sample buffer, so the quiz reads "about 23 ms". DVS players normally run the smallest clean buffer (often 128–256) because scratching needs it.
- **Fix:**
  - Setup with `buffer: 256` (12.7 ms round trip).
  - Explain text: "…Smaller buffers shorten it (Screen 16); DVS players usually run the smallest buffer that stays free of dropouts."

**17. POLISH.** Hint wording does not match the on-screen labels.
- **Where:**
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p18Dvs.tsx:272` ("CROWD HEARS", "CH1 INPUT")
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p16Laptop.tsx:233` ("Open OUTPUTS")
- **Problem:** The readout is labelled CROWD, the key CH1 IN and the param OUTPUT.
- **Fix:** Match each hint to the exact on-screen label.

**18. MISLEADING (mild).** Latency figures.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p16Laptop.tsx:33, 200`
- **Problem:**
  - "Latency: about one buffer plus the converter." Many drivers run two buffers plus a safety offset.
  - "At 2048 a jog move is heard almost 50 ms late." The model's own figure at 48 kHz is 43.7 ms.
- **Fix:**
  - TERM: "…about one or two buffers plus the converter — your software's audio page shows the real figure."
  - Step 3: "…at 2048 a jog move is heard about 44 ms late."

**19. MISSING (safety, mild).** Choosing the output device sends music to the PA at full level.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p16Laptop.tsx:195` (setup: faders 0.85, both decks playing)
- **Problem:** The learner switches the output device from BUILT-IN to MIXER USB with both channels up. For real, the music arrives on the PA at full level the instant the device connects. The same is true when a USB cable goes back in.
- **Fix:** Add a Note: "For real, pick the output device (and plug the USB back in) with the channel faders down — the music arrives at full level the moment it connects."

**20. MISSING.** Practical laptop preparation.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p16Laptop.tsx:205, 209`
- **Problem:**
  - The 96 kHz task suggests a higher rate is a goal. For DJ playback it doubles the work for no difference a dance floor can hear.
  - The step that prevents most dropouts is missing (charger in, sleep off, USB power saving off, a port on the laptop itself rather than a hub).
  - So is the laptop-charger ground-loop whine every laptop DJ meets (Screen 23).
- **Fix:**
  - Step 5: "Most DJ setups run at 44.1 or 48 kHz; 96 kHz doubles the work for nothing the floor can hear. Try it to see the cost."
  - Step 4 note: "Before a gig: charger in, sleep and USB power saving off, the interface in a port on the laptop itself (not a hub), notifications and wireless tasks off."
  - "A hum or whine that comes and goes with the charger is a ground loop — Screen 23."

**21. POLISH.** A 24 % load next to 12 dropouts.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p16Laptop.tsx:58` (screenshot `16_laptop_dropouts_390.jpg` shows LOAD 24 % beside DROP 12)
- **Problem:** A pro reads 24 % as safe. The model's dropouts come from short spikes, not from the average.
- **Fix:** TrayNote: "LOAD is the average; dropouts come from short spikes on top of it, so a low average can still drop out at a small buffer."

**22. POLISH.** "Original stems are exactly the track."
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p15Stems.tsx:33, 174`
- **Problem:** True for this lab's built tracks. Real stem files rebuild the track closely, not always exactly: master-bus processing acts on the full mix.
- **Fix:** "Parts that were recorded or made separately (the multitrack). In this lab they add up to exactly the track; real stem files come very close. One muted is truly gone."

**23. POLISH.** A product feature name, and two registry wordings.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p14Key.tsx:36`
- **Problem:** "Also called master tempo" is one maker's feature name. It is widely used, so it is the owner's call under the everyday-names exception.
- **Fix:** Either drop it, or say "some players call it master tempo".
- **Also, in `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\registry.ts:60`:**
  - "artefacts" here, "artifacts" on the screen: pick one.
  - "Tell playback speed from pitch" misdescribes the screen. See #24.

**24. MISLEADING.** The "what this lab covers" lines for 13–18, checked against the real screens.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\registry.ts:59-64`
- **Problem:**
  - 13 leaves out the send/return and the return loop.
  - 14 says "tell speed from pitch", but the screen teaches that speed CARRIES pitch unless key lock is on.
  - 15 is right.
  - 16 is right.
  - 17 leaves out acoustic feedback and isolation (a goal and a whole view).
  - 18 leaves out the play modes and the control tone on the PA (its fault).
- **Fix (exact lines):**
  - 13: 'Place an effect as an insert, on the master or on a send; set its timing in beats, dry/wet and feedback; and stop a return loop.'
  - 14: 'Hear how speed moves pitch, use key lock and key shift, and listen for the stretch’s artifacts.'
  - 15: 'Mix with stems, and tell original stems from separated audio — listen before you trust a muted part to be gone.'
  - 16: 'Connect a laptop and interface: device, channels, sample rate, buffer, latency and dropouts.'
  - 17: 'Set up a turntable and its phono stage, keep the cartridge signal clean, and keep it out of feedback.'
  - 18: 'Run a digital vinyl system: calibrate, choose absolute, relative or internal, recover when tracking fails, and keep the control tone off the PA.'

**25. POLISH.** Effects unit: tempo source and send/return wording.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p13Effects.tsx:34, 51, 247` and `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\model\djEffects.ts:28-29`
- **Problem:**
  - On MASTER and SEND the TIME silently follows deck A. Real beat-FX units take the tempo from the mixer's BPM counter (with a channel or auto choice) or from a TAP button, and a misread BPM puts every echo off the beat.
  - "Each channel's SEND knob" is rare on DJ mixers. Many have one send with a channel select.
  - A send/return adds "only the effect" only when the outboard unit is set 100 % wet.
- **Fix:**
  - Step 1: "Its TIME follows the tempo — on this mixer, the deck on its channel (deck A on MASTER or SEND); many units read the mixer's BPM counter or let you TAP the tempo. Check its BPM before you trust an echo."
  - TERM: "On this mixer, each channel's SEND… The RETURN adds only the effect back (set an outboard unit to 100 % wet)."

**26. POLISH.** The LOOP warning fires on a stable loop.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p13Effects.tsx:170, 313` and `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\model\djEffects.ts:121-124`
- **Problem:** `loop` is any `loopGain > 0`, so "LOOP — the lab is holding this one quiet" and the red route show even when SEND 2 is low and the loop dies away by itself. Only a total gain (internal feedback + the return path) of 1 or more builds a roar.
- **Fix:** Keep the red re-entry drawing for any loop. Show the safety Note and "ROAR" only when `fbGain(fx) + loopGain >= 1` (approximately: the paths share the delay line). Below that, say "RE-ENTRY — extra repeats; push it further and it runs away."

**27. MISLEADING (mild).** Ground-loop cures stated as certain.
- **Where:**
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p23Changeover.tsx:49, 324`
  - `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\model\djEvent.ts:358-361` (`laptopHum`: a strip always cures it)
- **Problem:**
  - "…or power everything from one strip" is the best first move, but not always a cure. Two-pin laptop chargers still leak noise into USB through their internal filter, so a whine can stay on the same strip.
  - Many USB isolators run only at the slower USB speed, which some multichannel interfaces will not work at.
- **Fix:**
  - TERM: "…Break it in the audio or USB path — an isolator or a DI's ground lift — or power everything from one strip, which often cures it. A charger can still whine on the same strip; then try the battery."
  - p23 tray: "a USB isolator (check it supports your interface's USB speed)".

**28. POLISH.** A charger is not on air, but it is not harmless.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p23Changeover.tsx:196`
- **Problem:** "A charger is not a source (the battery carries on)" is right for the prediction. But on many laptops, pulling the charger switches to a power-saving mode that throttles the processor, and that can bring dropouts or a click.
- **Fix:** Add: "…the battery carries on — though on many laptops the change of power mode can cause a click or dropouts, so leave the on-air laptop's charger alone."

**29. MISSING.** Capstone: the second fault gets no help, and the debrief is given away.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p24Capstone.tsx:448-455` and `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\model\djCapstone.ts:195-213`
- **Problem:**
  - (a) In a two-fault event, the hints and the symptom cover only `faults[0]`. The second fault has no symptom line, no hint and no debrief ("Now debrief the first one below").
  - (b) Hint 2 is the fault's `evidence` text word for word, and hint 3 its `repair`, so the debrief's EVIDENCE and REPAIR answers have just been shown.
  - (c) The wrong options come from faults in OTHER subsystems, which usually contradict the symptom. In `24c_capstone_fixed_debrief_390.jpg` the symptom is "CH 2 meters fine" and the wrong cause offered is "the headphone blend": ruled out at a glance. A pro's debrief tests reasoning from the evidence.
- **Fix:**
  - Show each planted fault's symptom, and give each its own hint ladder and debrief.
  - Make hint 2 a question, not the answer: per fault, a `probe` string, e.g. for XF_ASSIGN: "Which meter is the LAST one that moves when you raise FADER 2?".
  - Draw the distractors from a per-fault list of PLAUSIBLE wrong causes that fit the same symptom. For XF_ASSIGN: "the channel fader is broken", "the MASTER is down", "CH 2's selector is on PHONO".
  - Keep the earth-lift distractor.

**30. MISSING.** The capstone bank misses the commonest real faults.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\model\djCapstone.ts:37-137`
- **Problem:** The nine faults are well chosen and honestly demonstrated. Missing are the three a working engineer meets most, all of which the booth model can already show:
  - a powered speaker's input switch left on MIC, or its own level knob down (Stage 1 review #26);
  - a bad or intermittent cable;
  - the mic channel's ON left off for the announcement.
- **Fix:** Add `PA_INPUT_MIC` (PA R distorts, its LED red, MASTER R meter clean: fixed by setting the speaker to LINE) and `MIC_OFF` (MIC meter live, no voice on any feed: fixed by MIC ON). Add `BAD_CABLE` only if the render can drop and crackle one MASTER side, fixed by "swap in the spare cable"; prevention: "carry a spare of every cable you depend on".

**31. POLISH.** Duplicate IDs in SOURCES.md.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\docs\labs\dj\SOURCES.md:83-102` against `:122-152`
- **Problem:** The merge left two F25–F35 runs and two U6–U11 runs (Stage 2 and Stage 2b), and the Stage 2 F35 ("the lab uses 50 Hz") now contradicts Stage 2b (60 Hz). See #4.
- **Fix:** Renumber the Stage 2b facts F40 onward and its unknowns U13 onward; settle F35 with #4.

**32. POLISH.** Phantom-power safety in the TERM.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p19Mic.tsx:61`
- **Problem:** "A dynamic mic needs none" is true. A pro adds when phantom can harm: some ribbon mics, unbalanced adapters, and line gear on a combo jack.
- **Fix:** "…A balanced dynamic mic needs none and ignores it; keep +48 V off for anything not made for it (some ribbon mics, unbalanced adapters, line gear on a combo jack)."

**33. POLISH.** Recorder settings.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p21Rec.tsx:44, 260`
- **Problem:**
  - "Peaks around −12 to −3 dBFS" is a technical target, so it is fine, but say it is a starting point.
  - Two handheld-recorder traps are missing: AUTO LEVEL or a built-in limiter left on (it pumps the mix), and a line feed into the recorder's MIC input.
- **Fix:**
  - "…peaks around −12 to −3 dBFS is a good starting point…"
  - Note: "On the recorder itself: LINE input (not MIC), and AUTO LEVEL / limiter off, or it pumps the mix up and down."

**34. POLISH.** The DJ cartridge type is never named.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p17Vinyl.tsx:37`
- **Problem:** "+36 dB" is moving-magnet gain. DJ cartridges are moving-magnet; hi-fi moving-coil types need far more gain.
- **Fix:** Optional: "…about +36 dB for the moving-magnet cartridges DJs use…"

**35. POLISH.** Clock from a beat counter inherits its BPM reading.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p22Hybrid.tsx:321`
- **Problem:** The mixer's clock comes from its beat counter. If the counter misreads a track (half or double time, Screen 11), the drum machine follows the misreading.
- **Fix:** Add to the Note: "A clock from a beat counter is only as good as its BPM reading: if the counter reads half or double time, the follower does too."

**36. POLISH.** Changeover craft.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\src\screens\lab\dj\pages\p23Changeover.tsx:326`
- **Problem:** The common pro practice of the incoming DJ mixing OUT of the outgoing DJ's last track is not mentioned.
- **Fix:** Add: "Many changeovers are a mix: agree the last track, and the incoming DJ beatmatches into it from their own channel."

**37. POLISH (not audio).** The Stage 2b screenshots predate the merge.
- **Where:** `C:\Users\profe\dev\ape-dj-lab\docs\labs\dj\screens\stage2b\*.jpg`
- **Problem:** They show "MODULE 14 / 18" and "what's left" rows numbered 13–18.
- **Fix:** Re-shoot after the merge to confirm 19–24 and the optional markers on 16–18.

## Top 5 must-fix

1. **#1 (setup.ts `preMatched`; p13, p15, p16, p24):** Every pre-matched blend plays deck B half a semitone flat. Screen 15's stem swap also stacks two bass lines out of tune. Turn key lock on in `preMatched`, and swap the bass along with the drums.
2. **#2 (djRoom, PlanView, p20):** PA L is drawn on the crowd's right. Move it to house left (the DJ's right), or add the convention TERM and reword the swap note.
3. **#3 (p20):** No stand or rigging safety, and no "amplifier off before speaker cables", on a screen that has learners raise tops 2.2 m and wire passive boxes.
4. **#5 (p19):** The mic target (speech peaks to −3 dBFS) clips on the first shout. Set speech at about −18 to −8 dBFS and check a shout.
5. **#29 (p24):** In a two-fault event the second fault has no symptom, hint or debrief. The hints print the debrief answers, and the distractors are ruled out by the symptom.

Close behind:
- #13: a stylus dropped on a live channel thumps the PA.
- #4: 50 Hz and 60 Hz mains in the same booth.
- #6: the mic-to-line gap stated as 38 dB.
- #19: switching the output device sends full-level music to the PA.
- #24: the registry lines for 13, 14, 17 and 18 do not describe those screens.
