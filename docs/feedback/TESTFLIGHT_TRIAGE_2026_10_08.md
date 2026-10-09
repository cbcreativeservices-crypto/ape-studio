# TestFlight feedback triage — 2026-10-08

**Source:** the owner's export of the App Store Connect TestFlight screenshot feedback (46 items, newest first). Most items came from **build 32**. Build 32 was cut on 2026-09-26. Everything below was checked against **`final-lab`**, which is much newer.

**Branch:** `testflight-fixes`, based on `origin/final-lab` at b40a75f3.

**What "ALREADY FIXED" means:** the code that caused the report has since changed in a commit on `final-lab` (named in the row). Where a guard test exists, it is named in the last column.

Nothing here was tried on a phone. **"Retest"** means a tester should confirm the fix on the next build.

**Verdict counts (46 items):**

| Verdict | Count |
|---|---|
| ALREADY FIXED | 26 |
| FIXED NOW | 4 |
| OWNER DECISION | 11 |
| IDEA | 2 |
| Positive feedback | 3 |

## The table

| # | Tester | Screen | Verdict | What was done | Test |
|---|---|---|---|---|---|
| 1 | John Martin III | Certificate popup (Source Separation & Restoration) — "became unresponsive" | ALREADY FIXED (retest) | The build-32 popup had a sideways swipe pager (`DetailPager`). The pager was removed in 98ac8547. The dead-tap freezes on iOS came from new popups asked for in the middle of a screen push; they were fixed in d94c6c57 and 04df512a, and the joined/re-presented audio popup in 98ac8547. We have no reproduction on the current build. | `testflight32CredentialScenarioCopy` (no pager) |
| 2 | Owner | Audio Calculator Laboratory — calculator names all white | **FIXED NOW** | Calculator names in a category popup are now the lab's soft purple (`colors.programPurple`, about 8.6 : 1 contrast). The tagline under each name stays grey. The category titles were already amber (2026-09-30 grid). | `testflightTriage20261008` #2 |
| 3 | Owner (Pixel) | Pro Registry — cannot add user name / "list me" | ALREADY FIXED | 98ac8547. **ADD** now opens **MY USER NAME** (it used to open **PUBLIC PROFILE**, where the input does not live). A guest is told up front that listing needs an account. | `testflightBuild32Registry` 1a, 1b |
| 4 | Owner (Pixel) | Explore chips — Enrollments lit, page unchanged | ALREADY FIXED | 98ac8547. Every tab jump goes through `goToIndex`: it scrolls after the commit, checks where the pager actually landed, and scrolls again if needed. | `testflightBuild32Registry` 2 |
| 5 | Owner | Certificate card — sideways scroll jumps / moves the image | ALREADY FIXED + twin FIXED NOW | 98ac8547 removed the sideways pager from the credential popup. **Pattern sweep:** the Explore **topic** popup (`TopicDetailModal`) still had the same pager. It now shows one topic and scrolls vertically only. | `testflightTriage20261008` #5 |
| 6 | Owner | Speech lab p9 "voices differ" — chart capped at 500 Hz, text overlapping | ALREADY FIXED | 98ac8547. The axis now runs 60 Hz–4 kHz with formant regions, and the labels no longer overlap. | `speechModel` |
| 7 | Owner | Full screen in most labs (request) | ALREADY FIXED (mostly) | 094063cc and the rack rebuilds put full screen in about 40 labs. Labs still without it: Level & Amplitude orientation, Cable & Connector Fundamentals, Mic Select, Production, Mixing. These are listed under Ideas. | `labNavLaw`, rack tests |
| 8 | Owner | Cymatics — audio mutes on every screen change | ALREADY FIXED | 98ac8547. No screen re-locks the gate. Sound that is still playing counts as use. Re-announcing the same account no longer mutes. 4a6666f9 added the Settings option "Mute audio when I leave the app". The owner rule (audio stays on for 20 minutes of use, across screens) holds. | `audioGateStaysOn20260930` |
| 9 | Owner | Cymatics — Chladni plate ignores the frequency slider | ALREADY FIXED | 98ac8547. The fader crosses every resonance: on the default plate it used to reach 0 of 301 positions. The bezel fits, and the plate opens full screen. | `cymaticsFreqFader` |
| 10 | Owner | Tuning & Temperament — controls above the display | ALREADY FIXED | daa7614b rebuilt the lab on the Rack Unit, with full screen on 13 chapters. | `tuningLabRack` |
| 11 | Owner | Lab navigation inconsistent | ALREADY FIXED | 379b6734 and d3edb216. All labs use the shared strip: ⏮ · ‹ PREV · MODULE n/N ▾ · NEXT/FINISH, and header ‹ leaves the lab. | `labNavLaw`, `labNav`, `labNavHostsWp3` |
| 12 | Frank Giordano | Safety dashboard — Scenarios at 0% mid-round | ALREADY FIXED | 98ac8547. Answers given mid-round now move the shown percentage. The server-side value still owns the quiz gate. | `testflight32CredentialScenarioCopy` |
| 13 | Owner | Ear Training — "sound needs checking for playback and accuracy" | OWNER DECISION | No specific defect was named, and none was found by reading the code. This needs an audio-expert listening pass on a phone. Tell us which exercise. | — |
| 14 | Owner | Amplifier Principles — displays below controls | ALREADY FIXED | 49443882 rebuilt the lab on the Rack Unit, with full screen on every rig. | `ampRackLayout` |
| 15 | Owner | Cable & Connector — XLR/TRS combo image wrong | OWNER DECISION | Image work. It is already item #79 in the Comp C image package. No code change. | — |
| 16 | Owner | Visual Audio Analysis — waterfall ignores adjustments | ALREADY FIXED | 98ac8547. A reverb or Q ring that is hidden by the room's own decay is now explained in place. The bezel threshold matches the plot. Each Detective case starts fresh. | `meterLabWaterfallNav20260930` |
| 17 | Owner | Visual Audio Analysis — no prev/next | ALREADY FIXED | 98ac8547 put the lab on the shared strip. FINISH opens the what's-left screen. | `meterLabWaterfallNav20260930` |
| 18 | Owner | Line Array Laboratory — controls slow, move together | **FIXED NOW** | The ARRAY tray's three sliders (`DragSlider`) had two problems. First, they moved by PanResponder's `dx`, which is the centre point of **every** finger on the glass. Second, they sent every touch move to the lab, which rebuilds the whole wave scene each time. Both were already cured in the rack's `ParamLane` (laneFinger, laneFeed). `DragSlider` now uses the same two helpers. The same fix went into the EQ board's `VerticalFader` and the mixing desk's `GearFader`, through a new vertical twin, `laneFingerDy`. | `testflightTriage20261008` #18 (×4), `sliderEdgeGuard20261004` |
| 19 | Maureen O'Conner | Room Builder — ⓘ blends in | ALREADY FIXED | 98ac8547. The ⓘ chip now has an amber outline and a warm fill, and the ? key has an amber ring. | `testflightA11yBuild32` T2 |
| 20 | Maureen | Room Builder — info pages | POSITIVE | — | — |
| 21 | Maureen | Absorption Lab — scrolling text with big text | POSITIVE | — | — |
| 22 | Maureen | Level & Amplitude — "Illustrative training graphics — not live measurements" is confusing | IDEA | This is a copy change, so it needs the owner's approval. See Ideas. | — |
| 23 | Maureen | SPL Meter — "so cool" | POSITIVE | — | — |
| 24 | Maureen | Flashcards — "scrolling text does not line up sometimes" | OWNER DECISION (need the screenshot) | Two earlier commits reworked the definition scroller: ddf3118d (taps inside the scroller) and d2efa1bf (paging, the "more ↓" cue, nothing covered). There is no slide animation that could misalign the card. We need the screenshot to tell which line is out of line. | — |
| 25 | Maureen | Explore the Academy — hard for dyslexia | IDEA | Design change. See Ideas. | — |
| 26 | Maureen | Black screen / freeze when toggling tabs | ALREADY FIXED (retest) | Most likely 500a0512: the Explore page rendered blank after the screen opened on a later tab. Also relevant: 495f2c56 (session reads that stalled could freeze a screen) and c3b96748 (iOS black screen from a stacked modal). | — (no device repro) |
| 27 | Maureen | Community Directory — public-profile preview will not open | ALREADY FIXED | 98ac8547. The preview body was `flex: 1` inside a sheet sized to its content, so it laid out zero tall. | `testflightBuild32Registry` 3 |
| 28 | Maureen | Opening screen with big text | ALREADY FIXED | 98ac8547. Splash and Home are capped at the largest standard iOS text size (1.35×); the wordmark and chips fit. | `testflightA11yBuild32` T1 |
| 29 | Owner | "Enrollment is free" wording | **FIXED NOW** | 98ac8547 had already dropped "costs nothing". The replacement, "Enrolling is part of the membership", was still untrue for the two topics anyone can open. The line now reads: *"Certificates, programs and topics are part of the membership — only Pro Audio Safety and DAW Fundamentals open without one."* It never says "free". It is shown only to guests, in the **Heads up** prompt on Explore and in the credential pickers. | `testflightTriage20261008` #29, `testflight32CredentialScenarioCopy` |
| 30 | Owner | Home — copy above the carousel (explicit instruction) | ALREADY FIXED | c2c8710a applied the wording exactly: Measure Audio / Look Up a Term / Begin Here / Start Learning a Topic / Explore Topics to Enroll In. **Note:** the labs card reads **"Start Interactive Laboratories"**, the owner's own later wording from 2026-09-30 (1141be18), not "Start Learning". It was kept. Say if you want "Start Learning" back. A guard test is now pinned. | `testflightTriage20261008` #30 |
| 31 | Frank Giordano | Scenarios — answer feedback vanishes while scrolling | ALREADY FIXED | c2c8710a removed the 3-second auto-advance. The verdict and explanation stay until **NEXT ›**. A guard test is now pinned. | `testflightTriage20261008` #31 |
| 32 | Frank Giordano | Screen dims during the tuner and tools (request) | ALREADY FIXED (tools) | b8fadf88. The eight live tools (SPL, RTA, waveform, signal generator, spectrogram, RT60, counter/tuner, multimeter) keep the screen awake while they are in front. Extending this to labs is listed under Ideas. | — |
| 33 | Owner | Guest dashboard — flashcards with no "membership required" notice and no how-to | **FIXED NOW** (on top of 93c72e02) | 93c72e02 added the 🔒 **MEMBERS TOPIC** notice above the rack, the **LOCKED** switches, and the centred "Membership required" popup with a how-to. The how-to still said only "choose a membership", but a guest also needs an **account** (Paywall: "Create an account first"). A known guest now reads the account step too. The guest check uses `remindAsGuest(tier, useGuestWording().guest)`, never a pending or unconfirmed member. Members' copy is unchanged. | `testflightTriage20261008` #33 |
| 34 | Owner | An animation "not sufficiently accurate … not publish this lab" | OWNER DECISION | Lab art quality. The screen is unknown; around 09-28 this was most likely Cable Install, which has since been redrawn stage by stage. Needs the owner to re-judge on the current build. | — |
| 35 | Owner | Stage plot looks abstract | OWNER DECISION (redrawn since) | e06628f3 and 23d778f4 (2026-09-28) redrew Cable Install Stage 9 as a real top-down stage plot, then reviewed it. The owner should re-judge it. | — |
| 36 | Owner | "This animation is too poor to be useful" | OWNER DECISION | Lab art. Screen unknown; needs the screenshot or a re-judge. | — |
| 37 | Owner | "Animation so poor the task is a challenge" | OWNER DECISION | Lab art. Screen unknown; needs the screenshot or a re-judge. | — |
| 38 | Owner | Signal flow should be 3 columns with horizontal cables | ALREADY FIXED (confirm the screen) | 2cb2b4b1 (2026-09-28, "Owner, TestFlight 2026-09-28") redrew the Sound Systems map exactly as asked: STAGE \| CONSOLE · RACKS \| LOUDSPEAKERS columns, top to bottom, with horizontal cables. If the screenshot was the Gain Staging lab instead, that is a design job for the owner. | — |
| 39 | John Martin III | Frozen data wheel; wrong study page from the drum-set miking course | ALREADY FIXED | 1d67c864: **STUDY NOW** switches on an inactive certificate topic. 1101132f fixed the dial: a tap closes the big wheel, and the small dial opens on release. 094063cc: asking to study a topic now enrols and loads it. | `dashboardFocusInactive`, `studyFocusEnroll` |
| 40 | Owner | Tray controls unavailable outside full screen | ALREADY FIXED | 4473b229. An open tray fills the well and the dock drops to the bottom, so the lane and every key stay live while you choose. There is only one `DockTray` host (the Rack Unit), so every rack lab is covered. | `labStageCollapse` |
| 41 | John Martin III (b30) | Lock-up, play button dead, no sound | ALREADY FIXED (retest) | d94c6c57: no silent dead ▶; the gate joins a second request instead of refusing it. 04df512a: the audio popup now waits for the screen push to end. | `audioGateStaysOn20260930` |
| 42 | John Martin III (b30) | Flashcard words cut off at the bottom | ALREADY FIXED | d2efa1bf. A tap does not advance until the text has scrolled to its end; "more ↓" shows while there is more; the last line clears "Suggest a correction". | — (source fix; retest) |
| 43–46 | — | Older entries, not legible in the export | OWNER DECISION (need the screenshots) | App Store Connect → TestFlight → Feedback → Screenshots. | — |

## Root-cause patterns found in this pass, and the sweep

1. **A held control follows the centre point of every finger, not its own finger.**
   - **Cause:** PanResponder's `g.dx` / `g.dy` is the centroid of all touches, and the view that holds the gesture receives every finger's moves.
   - **Fixed now:** `DragSlider` (13 files use it), the EQ board's `VerticalFader`, and the mixing desk's `GearFader`.
   - **Fixed earlier:** `ParamLane`, the Room Design plan and side views, and the Harmonics stem levels.
   - **Still on the centroid (listed, not changed):**
     - Digital lab quantiser drag (`digital/vizQuant.tsx`)
     - EQ node drag (`eq/modules/MultiBand.tsx`, 2-D)
     - Mic Principles head and hand drags (`micspeaker/MicPrinciplesLabScreen.tsx`)
     - Harmonics phase slider (`HarmonicStems.tsx`, around line 297)
     - Binaural pad (`BinauralLabScreen.tsx`)
     - `GearKnob` (`kit/gear.tsx`)
   - **Read the touch's own `locationX`, which jumps when a second finger moves:** amp `ControlSlider` (`amp/kit.tsx`) and tuning `DragRail`.
   - **Effort:** about 2 h for all of them with `laneFinger` / `fingerOffset`.
2. **Every touch move goes straight into a heavy page re-render, so the control feels slow and catches up late.**
   - **Fixed now:** `DragSlider`, which now uses `laneFeed`.
   - **Fixed earlier:** `ParamLane`.
   - **Still deliver every move:** `VerticalFader`, `ControlSlider` and `DragRail`. `GearFader` rounds to whole dB, which already limits its rate.
3. **A sideways pager inside a reading popup.**
   - **Fixed now:** `TopicDetailModal`.
   - **Sweep:** `DetailPager` (`components/detailSwipe.tsx`) is now used nowhere. It is left in place because a motion ratchet allowlist names it, and removing it is the owner's call.
4. **A sentence true of most but not all.** "Enrolling is part of the membership" ignored the two open topics.
   - **Sweep:** no other copy claims every topic needs a membership. The Cable Install guest line is about saved progress, which is true.
5. **A how-to that assumes an account.**
   - **Sweep:** `UpgradeSheet` and `MembershipGate` give no step list. Paywall itself tells a guest "Create an account first". Nothing else needed.

## Owner decisions to unblock (beyond the ideas)

- **#13 Ear Training:** name the exercise, or approve an audio-expert listening pass (about 1–2 h with a phone).
- **#15 XLR/TRS combo image:** in the Comp C image package (#79). Needs the owner's go to swap the image.
- **#24 Flashcards alignment, #34 / #36 / #37 animations, #43–46:** need the screenshots, or a re-judge on the current build.
- **#30:** the labs card reads "Start Interactive Laboratories" (the owner's 2026-09-30 wording). Keep it, or go back to "Start Learning"?
- **#35 stage plot and #38 three-column signal flow:** both have been redrawn since build 32. Please re-judge.

## IDEAS FOR THE OWNER TO APPROVE OR DECLINE

1. **Full screen for the remaining labs (#7).**
   - Give the Level & Amplitude cards, Cable & Connector photos, Mic Select, Production and Mixing displays the same ⤢ FULL SCREEN button as the other labs.
   - **Recommend:** yes for Level & Amplitude and Cable & Connector. The others are mostly text and lists.
   - **Effort:** about 1–2 h per lab.
2. **Plainer honesty line (#22).** Replace "Illustrative training graphics — not live measurements." with "These pictures are drawn to teach the colours — they are not measuring any sound right now."
   - **Recommend:** yes.
   - **Effort:** 5 min.
3. **Calmer Explore page (#25).** For readers who find Explore the Academy hard to read: stop the moving art behind the cards, use shorter left-aligned lines with more line spacing, and keep one idea per card.
   - **Recommend:** yes, as an accessibility pass. Optionally add a "calm reading" switch in Settings that also applies Reduce Motion.
   - **Effort:** about half a day.
4. **Keep the screen awake in labs while sound is on (#32).** Same helper as the live tools (`useKeepAwakeWhileFocused`); applies while a lab's audio is enabled or a Production lab is open.
   - **Recommend:** yes.
   - **Effort:** about 1 h.
5. **‹ › buttons instead of sideways swipe in the topic and credential popups (#5 follow-up).** Stepping between items without the accidental swipe.
   - **Recommend:** yes if browsing many topics in a row matters; otherwise no.
   - **Effort:** about 1 h.
6. **Finish the touch-follow sweep (pattern 1).** Make every remaining drag follow its own finger and deliver at most once per frame.
   - **Recommend:** yes, before launch.
   - **Effort:** about 2 h.
7. **Settle the open "leave the app mutes audio" rule.** Settings now offers "Mute audio when I leave the app" (default ON).
   - **Recommend:** keep ON as the default.
   - **Effort:** none.

## Positive feedback

- **#20 Maureen, Room Builder:** "The info pages are so useful." She had not found them before the ⓘ was made visible (#19).
- **#21 Maureen, Absorption Laboratory:** "The scrolling text is great on this page even with big text turned on."
- **#23 Maureen, SPL Meter home:** "This is so cool."

## Verification

- `tsc --noEmit` is clean.
- The full suite passes: `node --test --test-timeout=120000 "test/**/*.test.ts"` → **9082 / 9082**. The baseline was 9072, and this pass added 10 tests.
- The first full run caught one ratchet: G6, the rule against cleanup-only effects that list dependencies. The `DragSlider` unmount effect is now `[]`-deps. The ratchet and all 15 `pattern*` suites were rerun green after that change.
- The new guards are in `test/testflightTriage20261008.test.ts`.
