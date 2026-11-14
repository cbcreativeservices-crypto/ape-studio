# Bug test ROUND 2 — R2-GA2 — Game Audio Lab, pages 12 to 22 and the END screen (2026-11-13)

Tester: R2-GA2. Own browser tab (tab-49), fronted before every motion check, sound OFF (Sound Safety never accepted, never shown). Sizes: 390 x 844, 375 x 667 (fresh page load), 320 x 700.
URL: `http://localhost:8142/#labpreview/GameAudioLab`. Evidence folder: `C:\Users\profe\AppData\Local\Temp\claude\e45de0ce5238aca8\f5e8364b-06db-4f2e-9d53-2c6c9d3fd6d3\scratchpad\r2_ga2\` (raw numbers in `measurements.md` there).

Method: controls pressed by ref / DOM click (one `computer` drag per slider, or a pointer-event drag where the emulated frame refused the drag). Strips read three ways: the strip's own accessibility label, a CSS-magnified capture of the canvas, and the readouts and log. Cut text measured as drawn-text width (DOM Range) against the box that holds it. Other testers kept fronting their own tabs; whenever my tab was in the background its animation was throttled (labels stepped 1–2 s late) — every motion verdict below was re-taken with my tab in front.

Counts (new): **0 S1, 4 S2, 10 S3** (14). Round 1: 15 FIXED, 1 STILL BROKEN (B-16), 1 BROKEN DIFFERENTLY (B-06).

## 1. Round 1 re-check

| R1 ID | Verdict | Evidence |
|---|---|---|
| B-01 p21 dead SPEED | **FIXED** | Page opens with TOPIC, SOUND, ■ STOP only (no slider): `p21_open_topic_first.jpg`. SPEED exists only on RULES / SPACE / TEST. RULES: 40 → 100 % moves EFFECTS −20 → −17 dB. GEN 1 off → key "SPEED: locked — GEN 1 is off: switch it on…", note says the same. SPACE + ■ STOP → "locked — Generator 1 was stopped: choose this TOPIC again…". AI → "This lab uses no AI, so there is nothing to show: the scene stays quiet." |
| B-02 p18 ■ STOP mid-flight | **FIXED** | ■ STOP 80 ms after DOOR · NEW ID: strip "A1 ✕ DROPPED · ■ STOP" on both machines, card "Never arrives: ■ STOP dropped action A1 on its way. Nothing plays and the door does not move.", log "Action A1 (door) DROPPED by STOP ALL: it never arrives". A1 AGAIN afterwards plays (first arrival), then is ignored as a duplicate. `p18_A4_dropped_by_STOP.jpg` |
| B-03 p12 WALK key "WORKSH…" | **FIXED** | Key reads YARD / SHOP at 390 and 320. `p12_walk_key_SHOP_390.jpg` |
| B-04 p13 MONO changes with direction | **FIXED** (by the words) | Tray, step 3 and guide now say "a sound to one side folds up to 3 dB quieter… (the pan law)". Measured MONO −15.1 / −14.7 / −14.2 dB at 90° / 185° / 350°: within 3 dB. `p13_mono_tray_text.jpg` |
| B-05 p17 FEWER silent at the floor | **FIXED** | ALARM + WARNING LINE, FEWER ×7: 12, 8, 4, 2, then "2 VOICES · HELD: 2 PROTECTED" on the fader line and key; log "BUDGET: 1 asked, but 2 protected voices are sounding. The budget stays at 2". After the line ends, FEWER reaches 1. |
| B-06 p22 at 320 chips below the fold | **BROKEN DIFFERENTLY** | The dock now holds six keys on one row at 320 (46 / 51 / 45 / 49 / 48 / 45 px, all ≥ 44; text 9–14 px). Every chip a hint or step names is reachable with a short scroll and a "more ↓" cue (see §3). But the tightened keys now cut their values: see **R2-GA2-02**. |
| B-07 p12 strip text at 320 | **FIXED** | No collision at 320 or 390 (`p12_strip_320_mag_IF_GEN_1PLAYED.png`); one small drawing fault left, R2-GA2-11. |
| B-08 voices label "after theirs was stolen" | **FIXED** | After lowering BUDGET: "Waiting for a voice: the room tone." |
| B-09 music bus +2 dB red | **FIXED** (by the words) | p16 step 1 and the signal-path label: "the music at ALERT can read above 0 dB: a sum of gains, not an overload." (p22 still shows +2 dB red with no words of its own; it relies on p16.) |
| B-10 p19 orphan not marked | **FIXED** | Strip "NO OWNER HUM 2 FAN 2"; label "an orphan with no owner: its generator was removed". New small cut on the slot: R2-GA2-08. `p19_fault5_orphan_strip.jpg` |
| B-11 p14 beat label lags | **FIXED** | Tab in front: beat changes at 13, 632, 1254, 1879, 2509, 3134, 3758 ms after START = 0.625 s a beat (96 BPM). |
| B-12 p20 profiler running clock | **FIXED** | "MIX 12.2 s" = seconds since the page opened. |
| B-13 Reanimated warning flood | **FIXED** | 0 "shared value" warnings in the whole run; 0 console errors. |
| B-14 p14 no-op request waits | **FIXED** | ALERT applied, CALM queued, ALERT again → "PENDING · Nothing is waiting."; CALM + DRIVE playing, MOOD ALERT → "Add PULSE". |
| B-15 p16 ASCII hyphen | **FIXED** | Log "BUS EFFECTS: −14 dB". |
| B-16 320 small cuts ("SURFA…", "PLAYI…", "the log is emp…") | **STILL BROKEN** (one of three) | p20 profiler and p12 readouts whole. p22 SURFACE still drawn "SURFA…" at 320 once MUSIC reads ALERT: **R2-GA2-03**. |
| B-17 p12 small truths | **FIXED** | (a) guide: "GEN 1 shows MUFFLED…, CLEAR…, OFF when stopped, and VIRTUAL past its maximum distance"; (b) card "WORKSHOP REVERB: On, but nothing in the workshop plays now" while VIRTUAL, strip "NOT PLAYED NOW"; (c) "Generator 1 is playing". |
| Held (2) intro card over an open tray | **NOT TESTABLE on screen** | Every page's intro card is already marked seen in the shared browser storage (`ape:intro:screenIntroCards`); the brief forbids clearing it. Code read: `introHold.ts` + `RackUnit.tsx` report a tray or lane drag as work; an owed card is dropped for the visit, a card already up is closed. Logic looks right. |
| Held (3) tray title "stays op…" | **FIXED** | At 320: MOVE "MOVE · CLOSE THIS: THE SLIDER TURNS YOU" shrinks to 11.4 px and fits (249.8 in 251.7 px); SOUNDS 11.3 px fits; MUSIC / REPORT use the short "· stays open". |

## 2. New bugs

**R2-GA2-01 · p19 Testing and fault finding · S2** — Fault 5 counts as FIXED the moment ADD GENERATOR 2 is pressed: the new generator silently adopts the orphan loop, the loop is never stopped, and the removal is never tested again.
- Steps (clean open, 390): step 4 ▸ fault 5 ▸ START THE FAULT. TEST ▸ ADD GENERATOR 2, GENERATOR 2 (on), REMOVE GENERATOR 2 → log FAULT "…instance i260 is an ORPHAN", strip NO OWNER. FIX ▸ WHEN A GENERATOR IS REMOVED ▸ STOP ITS LOOP (FAULTS stays 1, orphan still plays — right). TEST ▸ ADD GENERATOR 2.
- Expected: the fault counts only after the learner removes the generator again and sees the loop stop (the guide says "Fault 5 also needs the stray loop stopped"; step 3 says "After a fix, run the same action again").
- Happened: on ADD alone, FIXED 0 → 1 and "Fault 5 fixed: the loop: done". The chip reads "GENERATOR 2 · ON" although nobody switched it on; the strip now lists "the hum of generator 2… the fan of generator 2" with no orphan mark. The only log line is "A second generator was placed in the workshop". A learner who then follows the card ("switch GENERATOR 2 on") switches it OFF.
- Evidence: `measurements.md` (p19 section).
- Cause: `model/gaModel.ts:1482-1484` (`addMachine`: "an orphan loop left under this id is this machine's sound again", `on: !!orphan`) + `pages/data/gaFaults.ts:313-321` (`faultOpen` is false once no stray loop exists, so `faultFixed` latches).
- Smallest fix: don't adopt — a new generator starts OFF and the orphan keeps playing until ■ STOP; and count fault 5 only after a removal made with STOP ITS LOOP (a `fact` such as `removedClean`).

**R2-GA2-02 · p22 Capstone (shared dock) at 375 and 320, and p20 at 320 · S2** — Dock values still end in "…" on the new narrow dock.
- Steps A (375 x 667, fresh page load): page list ▸ 22. Wait 2 s with the tab in front.
  - Happened: MOVE reads "FACE 9…" (text 47.09 px in a 46.50 px box at 10.9 px), SOUNDS reads "SPEED 4…" (46.66 in 46.50). `p22_375x667_dock_FACE9_SPEED4_cut.png`, `p22_375x667_fresh_load_dock.jpg`. (At 390 the same keys fit.)
- Steps B (320 x 700): p22 ▸ SOUNDS ▸ GENERATOR 1 on, close, slider to 100 %.
  - Happened: SOUNDS value becomes "SPEED 100%" and its key widens 51 → 55 px; the other keys narrow, and MOVE now reads "FACE 9…" (44.08 in 43.80). The keys also shift sideways after the drag. `p22_320_dock_MOVE_FACE9_cut.png`.
- Steps C (320 x 700): p20 ▸ TOOL ▸ UNREAL ENGINE.
  - Happened: the TOOL key reads "UNRE…" every time (35.97 px at 11.1 px in a 35.66 px box). ANY, WWISE, FMOD and UNITY fit. `p20_320_TOOL_key_UNRE_cut.png`.
- Expected (new frame rule): whole words at ≥ 9 pt, never "…".
- Cause: the fitted size is computed against a key width that is a fraction of a pixel wider than the box the value is drawn in (`DockButton.tsx:155-162` — `inner` from the onLayout width; the visible Text box is 0.2–0.6 px narrower), and `VALUE_FIT_MARGIN_PX = 0.3` (`dockFit.ts:35`) is too small to cover it.
- Smallest fix: floor `inner` to a whole pixel and use a value margin of at least 0.8 px (as `LABEL_FIT_MARGIN_PX`); and leave a chooser-fader key's live value (SOUNDS "SPEED n%") out of `dockKeyNeed`, as a plain fader's already is, so the row does not re-lay out under a drag.

**R2-GA2-03 · p22 Capstone at 320 · S2** — A readout label is still drawn with "…" (round-1 B-16, new frame rule).
- Steps: 320 x 700, p22 ▸ MUSIC ▸ MUSIC · OFF (on) ▸ ALERT.
- Expected: SURFACE whole, short, or dropped.
- Happened: the MUSIC value ALERT widens its cell; SURFACE is drawn "SURFA…" (47.11 px text in a 46.58 px box) and stays so after the tray closes. `p22_320_bezel_SURFA_cut_MUSIC_ALERT.png`, `p22_320_report_tray_SURFA_cut_FACE9_cut.jpg`.
- Cause: `rack/BezelReadouts.tsx:115` rounds the cell width (`Math.round`), and `dockFit.ts:252` `bezelKeyFit` accepts a key up to `FIT_SLACK_PX` (0.5) WIDER than the room; RN-web then ellipsizes the overflow.
- Smallest fix: compare `key <= avail - 0.5` (a margin, not a slack) and floor the cell width; or give SURFACE a `kNarrow` ("SURF.").

**R2-GA2-04 · p14 Adaptive music · S2** — "Play a stinger on a boundary" latches for a stinger that waited for no boundary.
- Steps: clean open p14 ▸ MUSIC ▸ ▶ START ▸ CHANGE AT ▸ NOW ▸ MUSIC ▸ STINGER.
- Expected: not done (the goal and step 3 are about a hit landing on the line).
- Happened: log "STINGER asked for NOW, with no boundary to wait for" / "STINGER played immediately", and "Play a stinger on a boundary: done". A goal that latches for nothing.
- Cause: `pages/p14Music.tsx:166` `hit: since('stingerPlayed') > 0`.
- Smallest fix: count only stingers whose quantize was BEAT / BAR / PHRASE (a separate fact, e.g. `stingerOnLine`).

**R2-GA2-05 · p15 Dialogue · S3** — the REFUSED words and the interruption cross overlap on the strip. Steps: SPANISH ▸ GREETING ▸ at 0.9 s WARNING ▸ GREETING. The greeting row draws "✕ REFUSED: A MORE IMPORTANT LINE SPEAKS" from x0+15 and the cut cross at 0.9 s on top of it ("REFUSED✕A MOR…"); the "INTERRUPTED AT 0.9 s" words are replaced. `p15_refused_text_under_interrupt_cross_mag3x.png`. Cause `scene/hud/bLines.tsx:105,118-120`. Fix: while refused, skip the cut cross (or put the refused words after it).

**R2-GA2-06 · p17 Budgets · S3** — the check's explanation contradicts the screen. It says "No voice can be taken: one is protected and the other is more important than the impact", but the strip lists "the guide's warning line, priority 95, protected" and the fader says "HELD: 2 PROTECTED". `pages/p17Budgets.tsx:269`. Fix: "both are protected, so no voice can be taken."

**R2-GA2-07 · p19 Testing · S3 (design question)** — FIX opens on the setting of the fault whose card is shown, with the wrong value already marked ● (e.g. "GUIDE'S VOICE: BUS ● EFFECTS ○ DIALOGUE") before the learner has reproduced the symptom. Fixing early does not count (PASS), but the tray points at the culprit, so "finding comes before fixing" is not exercised. `pages/p19Testing.tsx:112-117,167`. Fix if wanted: open FIX on the first setting (DOOR FILE) or on the last one the learner chose.

**R2-GA2-08 · p19 fault 5 strip · S3** — the orphan's first slot is cut: "HUM…" while the next reads "FAN 2" (390, magnified `p19_fault5_HUM2_slot_cut_mag3x.png`). The header "NO OWNER HUM 2 FAN 2" names it, but a slot label with "…" is a cut label. `scene/hud/cVoices.tsx` slot label. Fix: drop the priority on a narrow orphan slot, or shorten to "HUM2".

**R2-GA2-09 · p21 Game audio today · S3** — a statement about the lab that is not quite true. AI topic: "Every sound here is a file made ahead of time"; reading section: "Nothing in this lab is procedural: every sound is a file made ahead of time." Page 1 says "Every sound in this lab is made in the app, not recorded", and `sounds/gaSoundBank.ts` synthesises each sound on first use, while the lab runs. `pages/p21Today.tsx:136,219`. Fix: "Every sound here is made once, when a page first needs it, then played back unchanged: nothing is generated as you play."

**R2-GA2-10 · p20 at 320 · S3** — the tool display's header is cut: "SIMPLIFIED · NOT ONE …" (9 px; 154 px text in 101 px). `p20_320_full.jpg`. Fix: "SIMPLIFIED" alone below 360 wide.

**R2-GA2-11 · p12 wall strip · S3** — the title is drawn "IF GEN 1PLAYED" with no visible space after the 1 (390 and 320, magnified). `p12_strip_390_mag_virtual.png`, `p12_strip_320_mag_IF_GEN_1PLAYED.png`. `scene/hud/bWall.tsx:96,158` (label font's space next to "1"). Fix: a wider space or "IF GEN 1 · PLAYED".

**R2-GA2-12 · p14 strip label · S3** — while a stinger waits (PENDING 7.3 s, tray "STINGER: its hit lands at the end of the phrase in 7.3 s"), the clock strip's label says "Nothing is waiting. … A stinger waits for its line." Fix: "No layer change waits. A stinger waits for its line."

**R2-GA2-13 · p22 at 320 x 700 · S3** — (a) with MOVE or SOUNDS open, the tray (y 395–575) covers the readout row, so SURFACE — what MOVE changes — is hidden while you use it; (b) after GO: GRAVEL the YOU figure sits on the "DOOR CLOSED" label (`p22_320_YOU_over_DOOR_CLOSED.jpg`). At 390 neither happens.

**R2-GA2-14 · small wording · S3** — (a) p19 door-chain label "Computed output level zero level; the lab level is 70%." (`scene/hud/aModel.ts:379`); (b) p17 memory card label "Overheat alarm: 1 seconds at 48,000 samples per second" (`pages/data/gaBudget.ts:83`); (c) END review key's spoken label "1 done. Hide them to review".

## 3. Control table (what round 1 did not test, or tested only in part)

| Screen | Control / path | Purpose | Result | Seen |
|---|---|---|---|---|
| p12 | Screen guide, all five steps on screen | Explain the screen | PASS | Steps 1–5 shown in order; text true on screen |
| p12 | FULL SCREEN 1x → 2x, CLOSE DOOR inside it, exit | Work in full screen | PASS | Strip grows with the scene; readouts follow; state kept on exit (at 2x YOU is off-screen until you drag: expected pan) |
| p12 | 320 x 700 dock (5 keys) | Fit | PASS | 57.6 px keys, OPEN DOOR 9.2 px, nothing cut |
| p13 | All three outputs × FACING through a turn | Output formats | PASS | Numbers in B-04 row; goals latch; check wrong-first explained |
| p14 | CHANGE AT ▸ NOW + STINGER | Stinger without a boundary | FAIL | R2-GA2-04 |
| p14 | ■ STOP with a stinger and a mood change waiting | Withdraw | PASS | Both withdrawn, two log lines, PENDING NONE, strip clear |
| p14 | NEXT PHRASE + STINGER: bezel vs tray vs strip | Countdown agrees | PASS | 7.3 / 6.7 / 5.9 / 5.1 / 4.5 / 3.7 s identical in all three; flag hollow, then filled on the line (`p14_stinger_flag.png`) |
| p15 | WARNING during WARNING | Same line twice | PASS | "IGNORED: it is already speaking"; log NOTE |
| p15 | Spanish interrupt + refuse on the strip | Marks | PASS with S3 | R2-GA2-05 |
| p16 | MUTE + SOLO on one bus, both on | Odd order | PASS | "effects: muted", others "silent, because another bus is soloed" |
| p16 | VISUAL CUE before ALARM | Odd order | PASS | Goal latches only once ALARM runs |
| p17 | Budget 1 + BURST with the alarm | Refuse | PASS | REFUSED 12 |
| p18 | ■ STOP on a new ID, then A1 AGAIN ×2, ID CHECK off | Network paths | PASS | B-02 row |
| p19 | All five faults by their cards, from a clean open | Find, then fix | PASS (1–4) / FAIL (5) | R2-GA2-01 |
| p19 | Start a fault and fix it at once | Must not count | PASS | FAULTS 1 → 0, FIXED 0, card back to START THE FAULT |
| p20 | TOOL × 5 on the PROFILER cell | Names | PASS | Profiler layout / Profiler window / Audio Profiler module / Audio Insights |
| p20 | 320 x 700 dock (6 keys) | Fit | FAIL | R2-GA2-02 (UNREAL) |
| p21 | TOPIC × 6, SPEED present / absent / locked | Function | PASS | B-01 row |
| p21 | Two checks without choosing a topic | Page done | PASS | Counted done (by design) |
| p22 | All seven goals by the hints at 320 x 700 | Capstone | PASS | All seven latched; "All seven are met…" |
| p22 | Chips the hints name at 320 x 700 | Reachable | PASS (scroll) | MOVE: GO: GRAVEL 2 px, GO: WORKSHOP 2–54 px below the fold; SOUNDS: GENERATOR 1 / GUIDE LINE 2 px, ALARM / VISUAL CUE 54 px, CLEAN SCENE 102 px; MUSIC: CALM / ALERT 5 px; REPORT: BROWSER / XR / CLOUD 30 px, the five LISTENING chips 80 px. Every one reachable by scrolling the tray; "more ↓" shown. At 375 x 667: REPORT LISTENING 63 px, SOUNDS CLEAN SCENE 48 px. |
| p22 | Six keys at 320: one row, ≥ 44, ≥ 9 pt | New frame rule | PASS / FAIL | Row and sizes PASS; values cut, R2-GA2-02 |
| p22 | Tray titles at 320 | Never cut | PASS | Held (3) row |
| p13–p22 | FULL SCREEN in and out on every page | Work in full screen | PASS | Each page: display enlarges (370 x 231), zoom steps offered, nothing cut, readouts identical after exit |
| p12–p22 | Page list jumps (not NEXT) | Clean scene | PASS | p16 → p17 with SOUNDS tray open: tray closed, scene clean; p19 → p20 → p19: goals and faults reset |
| p12 | NEXT pressed twice fast | Double tap | PASS | Moves one page only |
| — | Browser BACK | | NOT TESTABLE | history.length 1: the preview pushes no history |
| END | FINISH ▸ list, REVIEW ▾ / HIDE ▴, open a done page | What's left | PASS | "22 pages still to go" / "21 pages…"; each row says what counts; review row opens p21 clean, still ✓ |
| — | Console | | PASS | 0 errors; only library deprecation warnings |

## 4. Not tested, and why
- **Sound**: never heard (Sound Safety never accepted). Everything judged from the model, strips, readouts and log.
- **First-visit intro card** (new rule "never over an open tray"): every Game Audio card is already marked seen in the shared browser storage, which the brief forbids clearing. Code read only (`introHold.ts`, `RackUnit.tsx:347-348`): looks right.
- **Guest "not saved" reminder at lab open**: on the web it is a native `confirm()` (via `confirmDialog`), which this browser suppresses (console: "Page dialog suppressed (confirm)"). Not seen on screen.
- **Registration / Labs menu / tr_game_audio**: outside this slice's screens; code read only (`trainingLabKeys.ts`, `GameAudioLabScreen.tsx` pass `labDoneKey`). Not run to all 22 pages (a page reload empties a guest's progress).
- **Reduce motion**: not switchable here; round 1 read it in code; not re-read.
- **Real phone, Android BACK, rotation, landscape full screen**: no device.
- **END: PRACTICE AGAIN, DONE · BACK TO LABS, DISCUSS, p22 SHARE SUMMARY**: forbidden by the brief.
- **Motion smoothness**: judged only with my tab in front; other testers kept fronting their tabs, so a canvas sometimes lagged 1–2 s (the scene was blank for about 1–2 s after some page opens and resizes; not reported as a bug because it could be the throttling).
