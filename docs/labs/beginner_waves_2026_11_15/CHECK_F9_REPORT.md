# CHECK F9: Labs menu, Microphone Selection, Miking (independent check, 2026-11-15)

Checker: did not build any of this. Preview http://localhost:8142, one tab, 390 x 844. `test/labWaves_20261115_F9.test.ts` re-run: 37/37 pass. No file under `src/` or `test/` changed.

## 1. Summary

**20 rows checked: 19 PASS, 1 FAIL, 0 NOT SEEABLE.**
(15 items, with SH-44 and LM-03 checked once, plus SH-75-F, plus the 4 sweep items marked BUILT: SH-26, SH-27, SH-36, SH-76.)

I looked first at everything the builder could not see: the Labs menu (LM-04, SH-44/LM-03), Miking module 6 (MK-03, MK-10), the EVENT / PIECE dock keys, and the SH-38 chart note. I saw all of them on screen.

## 2. Table

| ID | Result | What I did and saw (390 x 844) | If FAIL: what to fix |
|---|---|---|---|
| LM-04 | PASS | The preview route has no `section` param, so I set `section: 'fundamentals'` on the EarLab screen through its own navigation. The menu opens on "New to audio? Start with the first tile, Understanding Level & Amplitude, then Foundations of Sound. Both are free; the deeper Fundamentals labs open with Academy membership." The first tile really is Understanding Level & Amplitude (START HERE badge), with Foundations of Sound beside it. The topic list is gone, so this is a line in and a line out. The member copy is the start line alone. | |
| SH-44 = LM-03 | PASS | Every subject heading on the combined menu shows its description under the name (12.5 px, muted grey), and the count ("4 Labs") now sits beside the name. Checked Sound, Acoustics, Signal, Instruments & Recording, Modulation, Phase and Time Effects, among others. Nothing is cut. The ✓ DONE work was already in place. One small duplicate is in §3 item 3. | |
| SH-38 | PASS | Seen on screen in Miking F13 (Room Acoustics), module 6, step 1: "dB · a simplified example, not a measurement", in lower case. Mic Selection module 3 badge: "Top view · directions only, not to scale" (9 px, no text-transform). ProductTools ("Relative dB · a made-up cycle, not a measurement") and SurveyTools ("dBA · a made-up example, not a measurement") checked in the code. None of them is in capitals any more. | |
| SH-49 (Mic Selection) | PASS | Module 1: the long photo names (Large-Diaphragm Condenser, Shotgun / Interference-Tube) wrap onto up to 3 lines and none is cut. The cells are large and well apart. | |
| MS-02 | PASS | Module 1: tapping the Boundary photo scrolled 428 px, so the Boundary card showed in full with the tapped row still visible above it. COMPARE kept Boundary as the first pick ("Pick one more microphone to place beside Boundary."). Tapping Ribbon then brought the side-by-side card into view. Module 2: the Sensitivity chip brought its card up. Module 10: CHECK MY REASONING brought the verdict ("✓ A defensible professional choice.") into view. Preview note: the smooth scroll only moves while the pane draws frames, so while the pane was hidden it stopped part way. On a phone this does not apply. | |
| MS-03 | PASS | Module 8 chips read "A · Studio", "B · Loud stage", "C · Outdoors". | |
| MS-01 | PASS | Module 2: the sixteen chips sit in four labeled groups (HOW IT HEARS, LEVEL AND NOISE, POWER AND CABLE, SIZE AND BUILD), and "tap each one" is gone. A small wording note is in §3 item 6. | |
| MS-04 | PASS | Module 1 opens on "Tap a mic to see what it's good at, and what it's not." with COMPARE beside it, then HOW IT WORKS INSIDE (4) and SHAPE OR JOB (8). After GOT IT, the first two grid rows show without scrolling. The warning is now two plain lines below the card. | |
| MK-02 | PASS | Kick Drum START HERE reads "THE JOURNEY · 8 MODULES", with rows numbered 1, 2, 3, 4, 5–7, 8. Module 1, step 4: the dock key reads EVENT, the same word as the bezel cell (EVENT 1). The guide says "Go EVENT by EVENT through the strike, or PLAY ONCE". Tapping EVENT opens a list ("1 · The beater strikes" … "4 · Sound leaves the drum"), and picking 2 moved the drawing and the bezel to EVENT 2. Placement Studio worked example: the dock key reads PIECE, and the guide says "Use PIECE to read the example piece by piece". | |
| MK-11 | PASS | Kick Drum Placement Studio, step 2 (full-size screenshot): the blue starting zones are clearly tinted with solid edges, and the moved mic has an amber rim on a dark halo. The drawing and the readouts show without scrolling. | |
| MK-03 | **FAIL (wording)** | The two-mic sentence is plain on Kick module 6: "Added together, the two copies cancel at a row of evenly spaced pitches: the dips in the comb drawing. The 1ST NOTCH readout is the lowest one." That part passes. The zone card, though, reads "TENDENCY · A sharp, defined attack … Move it and listen." on Kick Placement Studio. My judgment: "TENDENCY" is a real word, but it is an abstract noun that does not say what it is a tendency of, so a beginner has to work it out. The silent-lab line just above it already says it plainly: the card "says what a mic there **tends to hear**". The line under the new label also still ends "Move it and listen." | Change `ZONE_TENDENCY_LABEL` (src/screens/lab/miking/engine/kit.tsx:40) to "TENDS TO HEAR", the same words as the Can't-listen line on the same screen, and update the 48 reveals that say "Each zone's TENDENCY line". Optional: 64 of the 708 `tendency:` strings contain "listen" (e.g. M01 zone IN, "Move it and listen."). Change these to "Move it and watch the readouts", or drop the closing words. |
| MK-06 | PASS | MikingHub: "Suggested starting points, not rules. Silent drawings: no sound plays. Place real mics with the player stopped." sits right under the heading. It does not say listen or recommend, and no tile shows a lock. | |
| MK-04 | PASS | Each family shows one amber line under its family line, for example "New to miking? Start with Kick Drum; modules 1 and 2 give you the foundation." and "… Start with Hi-Hat; …". The first six tiles show without scrolling. Every lesson stays open, and the hub has no 🔒. | |
| MK-05 | PASS | Kick START HERE: "Eight modules: 1 and 2 are the foundation, and 3 to 8 go deeper. Stopping after module 2 and coming back later is fine." The journey map follows. | |
| MK-10 | PASS | Module 6 goal line: "Module 6 goal (advanced: read it, skim the numbers, come back later): …". CONTENTS lists "Studio or live · advanced", "Two microphones · advanced" and "Troubleshoot · advanced". Tapping "Two microphones · advanced" opened module 6, so it is open. The map's Advanced row adds "Fine to skim on a first pass." | |
| SH-75-F | PASS | Checked in the code: micSelectScreenGuides.ts no longer contains "Nothing is lost and there is no score." | |
| SH-26 | PASS | Mic Selection's first card reads "Commonly handles very high sound pressure level (SPL)". | |
| SH-27 | PASS | Same as SH-49: the mic photo names wrap and none is cut. | |
| SH-36 | PASS | The EVENT key matches the bezel cell EVENT and the words "EVENT by EVENT". The zone label matches its reveals (see MK-03 for the word itself). | |
| SH-76 | PASS (code + test) | `PATTERN_BLURBS` (engine/physics/polar.ts:44) gives each pattern one plain line, and all three PATTERN trays (PMicrophone, PMicOnIt, journeyPages) pass it as `blurb`. Test SH-76 passes. On Kick module 3, my scripted taps on the PATTERN dock key did not open its tray, so I did not see the blurbs on screen. A finger tap is worth one look. | |

Sweep items reported NOT A BUG or CHECKED (SH-11, SH-12, SH-14, SH-15, SH-35, SH-37, SH-64): I agree. The one exception is the listen wording in §3 item 1.

## 3. Other things I noticed in passing

1. **A "listen" line sits right above the silent-lab sentence.** Every Miking module shows a STARTING POINTS card: "These are suggested starting points, not rules. Put the mic up, listen, move it, and adjust — your ears and the room decide." (`STANDARD_LINE`, src/screens/lab/miking/engine/journey.ts:106). On START HERE it is directly above "Nothing here makes a sound: the lab is silent…". MK-06 took "listen" out of the hub note, but this card still asks a silent learner to listen. Fix: "…Put the mic up, move it, and adjust; the room and the real source decide."
2. **Zone tendency lines.** 64 of the 708 still end in "listen" (see MK-03).
3. **Labs menu, the Phase subject.** Its new description, "Polarity vs phase, correlation, mono compatibility.", is word for word the blurb of its only tile, right below it, so the same line shows twice. Fix: when a subject holds one lab and its description equals that tile's blurb, show the description once.
4. **Placement Studio bezel, Kick module 4, step 2.** The AIM caption is cut to "off tar…" at 390. This is a SH-27-type cut, in a readout caption rather than a dock key.
5. **Mic Selection module 2 intro.** "The next modules cover pattern, response, level, noise, power and size in depth, so skim the rest for now". That list names nearly all four groups, so "the rest" points at very little. Fix: name only the first group, or say "skim the chips you don't know yet".
6. **Preview only, not an app bug.** The Mic Selection reveal scroll and the Miking trays only move while the Browser pane draws frames, because they wait on requestAnimationFrame. A hidden pane makes them look stuck.
