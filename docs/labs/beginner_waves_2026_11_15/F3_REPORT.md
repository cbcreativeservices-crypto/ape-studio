# F3 report: Game Audio Lab + Stage Plot and Channel Designer (waves 1-3, 2026-11-15)

Summary: 13 of 13 built (wave 1: 4, wave 2: 5, wave 3: 4) · 0 not a bug · 0 held · 0 shared needs. Sweeps: 4 small changes (SH-26 ×2, SH-76, and SH-11/SH-36 guide wording with GA-05), the rest checked and recorded below. Tests: test/labWaves_20261115_F3.test.ts, 35 pass; with every existing Game Audio and Stage Plot test file (and plainTerms), 1,932 pass, 0 fail. `npx tsc --noEmit`: 0 errors in my files.

## Item table

| ID | Wave | What changed on screen (plain words) | Files | Test | Seen on screen at 390 | Status |
|---|---|---|---|---|---|---|
| GA-04 | 1 | Steps that asked for 3 or 4 actions in one sentence are now short lettered parts (a, b, c), one action each, same words. 25 steps on 18 pages (two-action steps left alone; the capstone's brief is a plan, not a list, so it stays). Three existing tests' prose readers (ChB, ChC, ChD) now read the parts as one Do line, so their word counts still measure the same words. | bits.tsx (`Do parts`), bitsLogic.ts (`gaPartLetter`), the page files | labWaves F3 "GA-04" (3) | Yes: page 1 step 2 reads a / b / c in amber, one action per line; page 15 steps 2 and 3 the same. | built |
| GA-05 | 1 | Every walking page walks with ONE control: WALK with ‹ STEP WEST / STEP EAST › at its ends. Zones page: FACING and STEP keys gone, WALK replaces both (one key fewer). Distance page: STEP replaced by WALK; FACING stays (turning is that page's lesson). Walls page unchanged, now uses the shared key. Guides say WALK. | pages/shared.tsx (`walkKey`, `stepAlong`, `WALK_KEY_WORD` moved here), p10Loops, p11Distance, p12Walls, guides/p10, guides/p11 | "GA-05" (3, one runs the model: through the door and back = 2 ZONE crossings; west end = VIRTUAL) | Yes: page 11 dock WALK · YARD + SOUNDS (FACING and STEP gone), lane line COURTYARD · 3.8 m TO WALL with ‹ STEP WEST / STEP EAST ›; page 13 dock WALK, FACING, SOURCES, SOUND, STOP, no label cut; two STEP WEST taps moved YOU (DISTANCE 8.8 → 10.1 m, 5.2 m TO WALL, FACING turned to 270°). | built |
| GA-17 | 1 | Capstone: ONE activity log, with SCENE / MIX AND MUSIC at its top to choose which lines it shows (was two log boxes). "Marks start empty when you come back" already on every page, verified. | bits.tsx (`ActivityLog views`), bitsLogic.ts (`GaLogView`), p22Capstone | "GA-17" (3) | Yes: one log in step 2 with SCENE / MIX AND MUSIC; tapping MIX AND MUSIC switched its empty line to MIX, MUSIC, REFUSED or FAULT; step 3 has no second log. | built |
| PLOT-02 | 1 | INPUTS: the five advanced parts (order or reserved channels, DI devices, stage boxes, equipment and who brings it, listed items) are closed rows with a one-line summary and GO DEEPER ▾, under "Five more parts of the input list. Open one when you need it." Questions still lead; a part with something to correct says so on its closed row. MONITORS: the questions card is first; an empty plan no longer shows three boxes of zeros (its "no monitor plan yet" note stays). | inputs/inputsFolds.ts (new, pure), spForm.tsx (`Section fold`), InputsArea, inputs/OrderPanel, DiPanel, BoxPanel, SummaryPanel, MonitorsArea, guides/inputs, guides/monitors | "PLOT-02" (4) | Yes (Four-piece example): five folded rows with their lines (The numbers follow the order. / 3 DI channels on 2 DI devices. / No stage box yet. / 14 inputs to the house system …); DI DEVICES opened with HIDE ▴ and all its counts. Blank plot MONITORS: no zero boxes, only the note. | built |
| GA-01 | 2 | Every word row keeps 2 to 4 words its page uses (12 rows cut, the 7-word ones to 4). Words that belong to a tool or a pro detail moved with that text into the step's PRO NOTE (still tappable there). Others moved to the page that uses them (Positional audio to the listener page, Event-driven audio to the mix page). 9 words no page's text uses went to the glossary's kept list, each with its reason. | 12 page files, gaTerms.ts (`GA_TERMS_KEPT_UNSHOWN`) | "GA-01" (3) | Yes: page 15 shows four words (Channel-based audio, Binaural rendering, HRTF, Downmix); page 1 three. | built |
| GA-07 | 2 | Tool names and pro details are in a closed PRO NOTE (the house GO DEEPER ▾ fold) at the end of the step, nothing removed: the Wwise/FMOD paragraph (triggers page), "some tools keep such a value…" (instances page), the container names (variation page), the event-driven duck (mix page), the memory card (budgets page), object audio + brand renderers + 5.1 picture (formats page). | bits.tsx (`ProNote`, reuses foundations/GoDeeper), p07, p08, p09, p13, p16, p17 | "GA-07" (3) | Yes: page 15's PRO NOTE closed (GO DEEPER ▾ + its hint), opens to the Dolby / DTS:X / Windows Sonic / Tempest paragraph and the 5.1 picture. | built |
| GA-08 | 2 | Formats page opens with its question: "Headphones have two speakers, yet a game can put a sound behind you. How?" Stereo, headphone 3D and mono stay open with 4 words; surround, object audio and the four brand names are folded in the PRO NOTE. Same as GA-07 and GA-01 on this page: one change. | p13Formats | "GA-08" (2) | Yes: page 15 step 1 opens with the headphones question; brands folded. | built |
| GA-12 | 2 | Page 1: "VOICES counts voices: a voice is one sound playing right now." PLAYING is marked as coming later ("page 8 explains how the two differ"). Guide p01 says the same. | p01Welcome, guides/p01 | "GA-12" (2) | Yes: page 1 step 1 shows the voice line and "page 8 explains how the two differ". | built |
| PLOT-08 | 2 | Library: Blank stage's line is now "Recommended for learning: 5 guided steps, and it completes this lab. Nothing is placed or assumed." (it replaces the old line). Its START is the only filled one; the five examples' START buttons are outlined. Library guide says the same. | spTemplates.ts (`SP_BLANK_LEARN_LINE`), ProjectLibrary, guides/library | "PLOT-08" (2) | Yes: library, Blank stage row shows the line and the only amber-filled START; the five examples' START are outlined. The library's intro card shows the new WHERE TO START. | built |
| GA-02 | 3 | Plain meanings where first met, each inside an existing sentence: voice (page 1, GA-12), dB on page 1's strip ("in dB (how much louder or quieter)", shared words), take on page 2 ("a take is one version of a sound", page 10's own words), bar on the music page ("a bar is a count of four beats"). | p01, p02, p14 | "GA-02" (2) | Yes: page 1 step 3 reads "in dB (how much louder or quieter)". Take / bar / Hz: not looked at on screen (text checked by test). | built |
| GA-11 | 3 | Page 1's picture carries one caption, pinned with the display (the rack's one-sentence line under it, inline and in full screen): "A game world from above. A game asks for sounds when things happen. Set LEVEL low, then turn SCENE on." The step-1 line no longer repeats "you are looking down on…". | GaLab.tsx (`GaRackSpec.caption` → `stage.modelNote`), p01Welcome | "GA-11" (2) | Yes: under page 1's display, two lines, picture and first dock key both on screen without scrolling. | built |
| PLOT-10 | 3 | The first time a "? 1" or "! 1" mark is on the tab bar, one line under it: "? = a question for you to answer in that tab." (and "! = something to correct in that tab." when that mark shows). It goes once a marked tab is opened, for the rest of the app session. | features/stageplot/spTabMarks.ts (new, pure), StagePlotLabScreen | "PLOT-10" (2) | Yes: Four-piece plot, SETUP ? 3, the line "? = a question for you to answer in that tab." under the tabs; blank plot (no marks) shows no line. | built |
| PLOT-15 | 3 | The on-screen KEY ends with one more line when the plot shows them: "A number in a box is an input channel. A code in a rounded box, such as M1, is a monitor mix." Same words as the printed packet already uses (now one constant for both). The PDF is unchanged (the packet's string is built from the same text). | spSymbols.ts (`SP_KEY_BADGE_*`), spPacket.ts (uses them, same output), stage/stageGeom (`foot`), stage/stageLinks (`stageKeyFoot`), stage/StageKey, stage/StagePlanView, StageArea | "PLOT-15" (2) | Yes: Four-piece STAGE, the KEY ends with "A number in a box is an input channel. A code in a rounded box, such as M1, …"; at 390 the key strip scrolls inside the display (▼ MORE), as designed for a long key. | built |

### Sweep items

| ID | Game Audio | Stage Plot |
|---|---|---|
| SH-11 silent first step | Checked all 24 guides' WHERE TO START: each opens with a step that can be seen (LEVEL, the door and the log, a tray, a strip). No change. | No sound in this lab: not applicable. |
| SH-15 stored values | NOT A BUG: every readout and strip is the model's own state, which runs with sound off (goals are facts; START lines say "not heard"). Nothing goes blank with sound off. | No sound: not applicable. |
| SH-27 labels in the picture | Scene labels are placed by the scene's own collision layout. Seen at 390 on pages 1, 7, 11, 13, 15 and 24: no word cut, dock labels whole (WALK · YARD, FACING · 90°, SOURCES · ALL OFF). No change. | The drawing leaves names out with its own line ("9 equipment names are hidden so that no name covers another…", seen on the Four-piece stage at 390). No change. |
| SH-35 dock key order | Checked every page's keys: the page's slider first, its trays/actions next, SOUND and ■ STOP always last; WALK is first on all three walking pages. No change needed. | One dock (Stage area), fixed order. No change. |
| SH-36 one name | WALK, ‹ STEP WEST, STEP EAST › used the same on keys, guides and steps of the three walking pages. VOICES/voice now one definition (page 1 and its guide). | GO DEEPER ▾ / HIDE ▴ are the same on SETUP and INPUTS (one constant). |
| SH-64 greyed controls | Already done where it applies (SPEED 2 locked with no generator 2, page 23's SPEED locked with the generator off, lane hidden for MUSIC/REPORT trays). No change. | Not applicable (forms). |
| SH-12 sound-off line | Already on every page (GA_SOUND_OFF_LINE). | No sound: not applicable. |
| SH-14 can't-listen path | Already: page 1 NEEDS SOUND tag with its watch-the-bars line, page 2 "Cannot play sound right now?", formats "No headphones? Read the strip instead.", walls "With SOUND off, watch the strip's REVERB window". | No sound: not applicable. |
| SH-37 "update the app" lines | grep: none in either lab. | none. |
| SH-26 codes spelled out | Hz first met on the walls page now reads "900 Hz (vibrations per second)" (shared words); dB on page 1 (GA-02). | "at FOH" in the stage box note now "at front of house (FOH)". |
| SH-76 tray one-liners | Page 23's TOPIC tray was the only bare one: each choice now has a one-line meaning naming its section. | Packages already carry "assumes"; no bare tray. |

## SHARED NEEDS

(none)

## Guardrail check

- GA-04: no new element; one sentence became 2-4 lines of the same words.
- GA-05: zones page lost two keys (FACING, STEP) and gained one (WALK).
- GA-17: one log box removed; one short sentence added to step 2 naming the two views.
- PLOT-02: five open sections became five closed rows; one line added above them (SETUP's pattern). MONITORS lost three zero boxes on an empty plan.
- GA-01 / GA-07 / GA-08: rows shortened; passages folded; the formats page lost its open brand paragraph, the 5.1 picture and three chips.
- GA-12 + GA-11 (page 1): the voice line replaces the old PLAYING/VOICES sentence; the caption replaces the "You are looking down…" sentence under the display; the dB words sit inside the existing LEVEL sentence.
- GA-02: all four meanings are inside existing sentences.
- PLOT-08: the new line replaces Blank stage's old line.
- PLOT-10: one line under the tab bar, only until a marked tab is opened.
- PLOT-15: one line at the end of the KEY, only on a plot that shows numbers or codes.

## Pinned tests changed on purpose (each with the owner's quote and the item ID)

- test/gameAudioChB, ChC, ChD: their prose readers now read `<Do parts={[...]} />` as one Do line (GA-04), so the word counts measure the same words.
- test/gameAudioGA2Fixes_20261113 (B-03): WALK_KEY_WORD is read from pages/shared.tsx (GA-05).
- test/labFixes_20261114_F3: the zones page keys are `[walkKey(s), soundsKey]` (GA-05); the headphones line is a lettered part (GA-04); page 1's page-8 pointer is in the voice line (GA-12).
- test/gameAudioChAFamilies: page 2's take sentence (GA-02); page 1's voice line (GA-12, which the owner approved over the earlier "do not teach voices on page 1" rule, L-12).
- test/stagePlotBoxesR3: the NEEDS A CORRECTION test is one function, `spBoxNeedsFix` (PLOT-02).
- test/stagePlotMonitors: the MONITOR PLAN hint names the three counts only when they show (PLOT-02).
- test/stagePlotStage (two) and test/stagePlotStore: the key's height and spoken sentence include its last line (PLOT-15); a tab press also retires the marks' legend (PLOT-10).

## Notes for the coordinator

- The PDF is unchanged: the packet's legend string is now built from the same two constants (`SP_KEY_BADGE_NUMBER`, `SP_KEY_BADGE_MIX` in spSymbols.ts) and produces the same text; every stagePlotPdf / stagePlotPacket test passes.
- `GaRackSpec.caption` uses the rack's existing opt-in `stage.modelNote` line (the one-sentence line pinned under the display, inline and in full screen). No frame file was changed.
- The PRO NOTE fold reuses `foundations/GoDeeper.tsx` (already shared by Room Design and Wave). No new fold component.
- While I tested, the 8142 preview once failed to render with `bezelTapHelp is not defined` (src/screens/lab/rack/BezelReadouts.tsx, group S's file mid-edit). After a reload it was fine; not caused by F3.

## What I could not check

- Page 1's dB words, page 2's take, the music page's bar, the walls page's Hz, page 23's TOPIC blurbs and the BoxPanel FOH words were checked by tests, not looked at on screen.
- The PLOT-10 line going away after a marked tab is opened was checked in code and by test, not on screen.
- Every page's PRO NOTE except page 15's was checked by test, not opened on screen.
- Sound was never turned on (KEEP SOUND OFF rule); nothing in this round changes what is heard.
