# CHECK F3: Game Audio Lab + Stage Plot and Channel Designer (independent checker, 2026-11-15)

## 1. Summary

**13 PASS · 0 FAIL · 0 NOT SEEABLE** (13 built items). Sweep items: spot-checked, no FAIL.

- Checked on commit 499fd2e5, branch `ota-after-approval-39-23`, in my own tab of the 8142 preview at 390 x 844. Sound was never turned on.
- Tests: I ran the 43 Game Audio / Stage Plot / labWaves F3 / labFixes F3 / plainTerms test files. 1,932 pass and 0 fail, the same count as the builder's report.
- The items the builder could not see on screen are now checked on screen: take, bar, Hz, dB, the page 23 TOPIC meanings, the PRO NOTEs on pages 8, 9, 10, 18 and 19, and the PLOT-10 line going away. The one exception is the BoxPanel "front of house (FOH)" words. They appear only on a stage box with wireless inputs, so I checked them in code only.

## 2. Items

| ID | Result | What I did and saw (390 x 844) | If FAIL: what to fix |
|---|---|---|---|
| GA-04 | PASS | **Page 8, step 3:** reads as parts a, b, c, d, one action per line: SPEED 2, then GENERATOR 1 off, then REMOVE GENERATOR 2, then the fault. **Other pages:** page 1 step 2, page 11 steps 2 and 3, page 13 steps 2 and 3, and page 15 steps 2 and 3 are lettered the same way. On page 9, steps 2 and 3 are lettered in code, which the builder's page-9 test also checks. **Look:** the letters are amber and nothing is cut. There are 3 leftover steps of three actions each (see section 3). | |
| GA-05 | PASS | **Page 11 dock:** WALK · YARD, SOUNDS, SOUND, STOP. FACING and STEP are gone. **Door closed:** 12 taps of STEP EAST walked 3.8 m down to 0.3 m, then the lane said "DOOR CLOSED: STOPPED AT THE WALL". **Door open:** I opened SOUNDS, turned SCENE on and chose OPEN DOOR. STEP EAST then took me into the WORKSHOP (6.1 m IN), and STEP WEST took me back to the COURTYARD. The log printed one ZONE line each way, and BEDS stayed at 2. **Pages 13 and 14:** page 13's dock is WALK, FACING, SOURCES; page 14's is WALK, OPEN DOOR, ROOM. **All three pages:** they use the same lane line and the same ‹ STEP WEST / STEP EAST › buttons. | |
| GA-17 | PASS | **Page 24 (capstone):** the whole page has exactly one ACTIVITY LOG; I counted it. SCENE and MIX AND MUSIC sit at the top of the log. **Function:** tapping MIX AND MUSIC checked that chip, and the empty line changed to "…MIX, MUSIC, REFUSED or FAULT lines". **All pages:** the goals end with "these marks start empty when you come back". | |
| PLOT-02 | PASS | **Four-piece INPUTS:** the list comes first with ADD A SOURCE. Under it is the line "Five more parts of the input list. Open one when you need it." followed by five closed rows. **Closed rows:** each row has its own line. The equipment row also shows "? 1 detail is still to be confirmed.", so a problem is not folded away. **Function:** tapping DI DEVICES opened it with HIDE ▴, its counts, both devices and the ADD buttons. In code, GO TO opens a DI or stage box sheet whether its fold is open or closed. **Blank MONITORS:** no boxes of zeros, only the "no monitor plan yet" note. **Four-piece MONITORS:** the non-zero counts still show. **Order:** in code, the questions card now comes before MONITOR PLAN. | |
| GA-01 | PASS | **Word rows:** page 1 has 3 words, page 2 has 3, page 8 has 4, page 9 has 3, page 10 has 4, page 15 has 4, page 16 has 4, page 18 has 3 and page 19 has 4. **Moved words:** the moved words now sit in each page's PRO NOTE, where they can still be tapped. | |
| GA-07 | PASS | **Opened on screen:** I opened the PRO NOTE fold on pages 8, 9, 10, 15, 18 and 19. Each starts closed (GO DEEPER ▾ with a hint line) and opens to the full text. **Page 8:** "Some tools keep such a value…". **Page 9:** the Wwise / FMOD paragraph and its three words. **Page 15:** the Dolby Atmos / DTS:X / Windows Sonic / Tempest paragraph and the 5.1 picture. **Pages 10, 18 and 19:** each fold opened and added text. | |
| GA-08 | PASS | **Page 15, step 1:** opens with "Headphones have two speakers, yet a sound can seem to come from behind you. How?" Then come one paragraph (stereo, mono, headphone 3D), four words and the closed PRO NOTE. **Steps 2 and 3:** both are lettered. "No headphones? Read the strip instead." is kept. | |
| GA-12 | PASS | **Page 1, step 1:** "VOICES counts voices: a voice is one sound playing right now. PLAYING counts what the game asked to play: page 8 explains how the two differ." **Check:** page 8 (Events and instances), step 2, does explain the difference. Its definition agrees: "VOICES counts the sound files playing now". | |
| PLOT-08 | PASS | **Library, Blank stage:** reads "Recommended for learning: 5 guided steps, and it completes this lab. Nothing is placed or assumed." Its START is the only amber-filled one; the five examples' START buttons are outlined. **True to the code:** spGuidedSteps has 5 steps, and the guided task opens by default only on a blank plot. | |
| GA-02 | PASS | **Seen on screen:** page 1 "in dB (how much louder or quieter)" (the plainTerms short), page 2 "a take is one version of a sound", page 16 "(a bar is four beats)", and page 14 "900 Hz (vibrations per second)" (the plainTerms short). Voice is on page 1 (GA-12). **No new lines:** each meaning sits inside an existing sentence. | |
| GA-11 | PASS | **Page 1:** "A game world from above. A game asks for sounds when things happen. Set LEVEL low, then turn SCENE on." is pinned right under the readouts. **First screen:** the picture, the caption, HIDE / FULL SCREEN and the LEVEL dock key all show without scrolling. **Removed:** the old "You are looking down…" line is gone from step 1. | |
| PLOT-10 | PASS | **Four-piece plot:** "? = a question for you to answer in that tab." shows under the tab bar (SETUP ? 3). It stayed while I visited INPUTS, MONITORS and STAGE, which are unmarked tabs. It went away after I tapped the marked SETUP tab. **Blank plot (no marks):** no line. | |
| PLOT-15 | PASS | **Four-piece STAGE:** the KEY ends with "A number in a box is an input channel. A code in a rounded box, such as M1, is a monitor mix." The text is 9.5 pt. **Scrolling:** this key strip already overflowed at 390 before the new line (about 109 px of content in a 99 px strip, with ▼ MORE showing). So the line adds more scrolling, not a new scroll. At rest its first line shows half-hidden under the strip's edge, as any last key row would. | |

**Sweep items (spot checks):**
- **SH-14:** "No headphones? Read the strip instead." is present.
- **SH-26:** "900 Hz (vibrations per second)" and "front of house (FOH)" are present.
- **SH-76:** the page 23 TOPIC tray shows "Space and acoustics: where a sound is, and what is in its way." for the chosen chip. It uses the house tray's rule: the meaning shows for the chosen chip only.
- **SH-12:** "Sound off? You can still do every step" is on every page.
- **SH-37:** a grep found no "update the app" or "dev build" lines in either lab.
- **SH-35:** WALK is the first key on all three walking pages, and SOUND and ■ STOP are always last.

## 3. Other things I noticed in passing (not this round's items failing)

1. **Three-action steps still in one sentence (GA-04 leftovers).** Each of these could be a short a/b/c list:
   - Page 2, step 2: "Press OPEN DOOR and read the log. Then switch GEN 1 on to start the generator. Turn SOUND on first if you can listen." The "first" step comes last in the sentence (p02Reacts.tsx:73).
   - Page 4, step 2: "Open GAMES and pick a kind of game. Watch the picture, then read its card here. Pick two more." (p04Games.tsx:138)
   - Page 8, step 2: "Open GENERATORS. Choose ADD GENERATOR 2, then switch GENERATOR 1 and GENERATOR 2 on." (p07Instances.tsx:155)
2. **A walking note mentions a control that is gone (SH-36).** At the scene's edge, the log NOTE still says "…no footstep plays. Turn to walk another way." On the WALK pages there is no turning control any more: ‹ STEP WEST turns you by itself. Seen on page 11 after STEP EAST at the workshop's east end (src/screens/lab/gameaudio/model/gaModel.ts:1394). On pages that only have WALK it could read "Step the other way".
3. **The page 15 PRO NOTE's word row lists Ambisonics and Head tracking, but the text inside the fold never uses either word.** They were already on the open row before this round, so this is not worse.
4. **Page 13 opens with FACING as the active key, not WALK.** This is on purpose (`initialParam: 'facing'`), and it matches step 2b ("Move FACING, then drag WALK"). Recorded only because WALK is the first key.
5. **Viewport reset.** During the Stage Plot check, the pane's width change reset my 390 x 844 setting twice. I set it again each time and re-took the screenshots (innerWidth 390 confirmed).
