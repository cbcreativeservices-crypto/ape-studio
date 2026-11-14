# G5b · Sound Systems Lab (SoundSystemsLab) · hands-on follow-up to G5

Auditor G5b, 2026-11-14. Scope: only what G5 did not walk hands-on (BUILD capstones 2-10, ROUTE 2-8, OPERATE 2-5, TROUBLESHOOT faults). G5's hub, LEARN, BUILD module 1 / capstone 1 opening, ROUTE 1, OPERATE 1, TROUBLESHOOT 1-2 case list are in `G5_SoundSystemsLab.md` and are not repeated.

Setup: web preview tab-3 (`http://localhost:8142/?g5b=1#labpreview/SoundSystemsBuild` and the sibling routes `SoundSystemsRoute`, `SoundSystemsOperate`, `SoundSystemsTroubleshoot`), 390 x 844, member, intro cards unseen. SOUND OFF throughout. Tool note: the pane draws the 390-wide tab scaled to about 78 %, and clicks by screen coordinate did not land reliably on the plot, so I tapped through the page's own accessible targets ("Place at …", "<part> at <position>", "Cable from …"). Those are the same targets a finger hits, at their centres. Where a finger could do better than a centre tap (an edge tap), I say so.

---

## BUILD · Capstone 2 · Small mono music system · `#labpreview/SoundSystemsBuild` → MODULE 3 / 11

| Field | Notes |
|---|---|
| First look | The intro card over a dim venue plan. After GOT IT: the empty venue plan (SR, SL, RISER, LIP, BARRIER, HOUSE L/R, FOH · MIX), readouts PLACED · CABLES · LIVE · REQS 0/7, then a REQUIREMENTS checklist of 7 sentences. The eye goes to the checklist: "a to-do list", which is right. |
| Overwhelm | 3. Seven requirements, the shortest bin in BUILD so far (8 parts: vocal mic, instrument mic, DI, playback, console, powered loudspeaker, powered sub, power distribution), a story ("A café corner. Singer with guitar, plus a backing track"). The LAB NOTES add: "the playback is sent post-fader to Aux 6 (the sub aux), and Matrix 1 (subs) takes the main mix", which a beginner cannot parse. |
| Knows what it is learning? | Yes: "A single loudspeaker position covers a narrow room better than two fighting each other" (notes) and the intro's "how a sub beneath it adds the low end". |
| Knows what to do first? | Yes, the intro card says: "Place the powered loudspeaker at the center main position and the powered sub at the center sub position. Then cable…". **But that order is a trap (see Follows).** |
| Words they would not know | MAIN MONO, Aux 6, Matrix 1, post-fader, "sub aux", DI, "fed THROUGH the console", "center main position" vs the plot's own name "Center cluster" (the IN HAND card lists "Center cluster", the requirement says "center main position": two names for one spot). |
| Follows / continues? | **Blocked in two places.** (1) Overlapping targets: I placed the loudspeaker at "Center cluster" as the intro says, then picked the sub. The "Sub · center" ring sits directly under the placed loudspeaker; tapping it selects the loudspeaker instead ("Powered loudspeaker selected… tap REMOVE to take it off the plot") and the sub drops out of my hand ("nothing in hand"). Doing it the other way round (sub first) blocks the loudspeaker the same way. Same at 2x zoom in FULL SCREEN. Code check: `system.ts` puts Center cluster at (180,110) and Sub · center at (180,128), 18 units apart; a placed device's tap circle is 22 units (`VenueView.tsx` line 1273) and is drawn on top, so the centre of the second target is always under the first device. Only a tap on the far upper or lower edge of the dashed ring could land; a beginner will not find that. I could not complete requirements 3 + 4 together. (2) The decoy position: the sub may also stand at "Sub · center, front box". I tried it first (a beginner would: it says "center"); the sub placed with a green ✓ but requirement 4 stayed unticked with no word why (`capstones.ts` line 371 accepts only `subC`). (3) Spot taken by the wrong part: I put the playback device at "Front of house" (where a laptop really sits). The console's IN HAND card then read "STANDS AT · Front of house" only, and FOH was taken: no console could be placed and nothing had warned me. I had to find REMOVE on the playback. |
| Feedback seen | Very good wording on links: "✓ Vocal microphone → Mixing console, at mic level." Refusal: "△ Powered subwoofer has no free input — it takes 1." (clear, but it does not say what is already in it or how to free it). A deliberate mistake (playback straight into the sub) was ACCEPTED with a green ✓ "Playback device → Powered subwoofer, at line level", the sub turned LIVE, and the whole floor lit green/yellow; only requirement 6 ("nothing goes around the mix") quietly stayed unticked. A beginner reads ✓ + LIVE + a green room as success. |
| Recovery | REMOVE works on the selected device. Removing a cable means tapping the thin cable line itself (accessible name "… — tap to remove"); my tap at the cable's middle missed because the cable is an L-shaped run and its middle is empty plot. On a phone with the heat map drawn over the floor the cables are hard to see at all. No undo for a removed cable or device. |
| What works | The 8-part bin (only what this job needs); the requirement list that ticks live; link messages that name both ends and the level; LIVE / SILENT per device with "FED BY · FEEDS" in the device card; a real story (café corner). |
| Suggestions | 1. **Fix the overlapping targets**: keep at least one device-tap-radius (22 units) between any two positions that one capstone needs together (Center cluster vs Sub · center; also check Wedge 2/3 vs Center cluster, 22.4 units), or, while a part is in hand, let the target ring win over a placed device's tap circle. L. 2. Give the in-hand card a tappable list of its allowed positions ("Center cluster", "Sub · center"…) as buttons, so a beginner never has to hit a small ring (G5 suggested the same for module 1). M. 3. When a placed part does not satisfy a requirement, say so in the placement line: "Placed at Sub · center, front box. This build wants the sub at Sub · center." S. 4. Reserve FOH for the console in builds that need one, or warn when the last spot a needed part can use is taken: "Front of house is the only place for the console; move the playback." S. 5. A link that goes around the console should get an amber ⚠, not a green ✓: "Works, but it skips the mix: requirement 6." S. 6. Use one name: call the spot "Center cluster" in the requirement too (or "center main" on the plot). S. 7. In the device card, list each FED BY cable with a small ✕ to remove it; then the "no free input" message can say "Remove the playback cable first (✕ in the card)". M. 8. Fix "backing track.." (two full stops), same typo as capstone 1. S. 9. Move the Aux 6 / Matrix 1 preset note under a "how this console is set up" fold. S. |
| Hobbyist | Will enjoy it, will also hit the stacked centre targets and may think the lab is broken. Knows aux/matrix enough to read the preset note. |

## BUILD · Capstone 3 · 2.1 with a dedicated subwoofer output · MODULE 4 / 11 (built to PASS)

| Field | Notes |
|---|---|
| First look | Same empty plan, REQS 0/9, a 9-line checklist. Intro card: "How a dedicated sub output turns the bass level into one control at the console… Place the playback, the console, the powered tops and the powered sub. Cable the sub from the console on its own link, then give it AUX 6 or MTX 1 · SUBS with OUTPUT." |
| Overwhelm | 3 to read, 2 to do. Requirement 6 is a mouthful: "For THIS build the tops are fed direct, not through the sub (the sub's pass-through is the other valid way — see the brief)". The notes explain two wiring styles (a) and (b) in one 90-word paragraph. |
| Knows what it is learning? | Yes, and the reason to care is excellent: "Build (b) here, because it makes the sub level a fader move at the console." |
| Knows what to do first? | Yes. I placed console (FOH), playback (stage-left wing), tops (Main · house left / right), sub (Sub · center): no overlaps here, all placed first try. A part stays in hand after placing, so the second top was one tap: good. |
| Words they would not know | 2.1, tops, high-passed, crossover, pass-through, MAIN L/R, MONO, Aux 6, Matrix 1 / MTX 1, post-fader, "ALL OUTPUTS". |
| Follows / continues? | Yes, to PASS. Cabling console → top: "✓ Mixing console → Powered loudspeaker, at line level. Tap OUTPUT to choose the console output it carries." The plot labels the cable "OUT ?" until chosen, the device card says "FED BY · Mixing console · ALL OUTPUTS", and the top is already LIVE before an output is chosen (a beginner may stop there; the Outputs requirement is what holds the PASS). OUTPUT opens a list of 17+ outputs (Main L, Main R, Main mono, Aux 1-10 with names, Matrix 1-4, "more ↓") for a playback-only job: long, but each has a plain name ("Aux 6 · Subs"). After the last output: REQS turns green "PASS", the plot labels each cable MAIN L / MAIN R / AUX 6, the checklist header reads "REQUIREMENTS MET — CAPSTONE PASSED" and "Capstone 3 passed — recorded on the lab's home page. The build stays here to explore; CONTINUE when ready." |
| What works | The OUT ? → MAIN L labels on the plot (you see what each cable carries); "This cable now carries Aux 6 · Subs."; PASS in the readout; "The build stays here to explore". The real-world reason (sub level = one fader) is the best "why" in BUILD. |
| Suggestions | 1. Keep a new loudspeaker SILENT (or amber "OUT ?") until its output is chosen; "LIVE" with "ALL OUTPUTS" teaches that a cable alone is enough. S. 2. In capstones that need only 3 outputs, show those first in the OUTPUT list (a "for this build" group: Main L, Main R, Main mono, Aux 6, Matrix 1) and the rest under "more". M. 3. The pass line says "CONTINUE when ready" but the button is "NEXT: CAPSTONE 4 …"; use the same word. S. 4. Shorten requirement 6 to "Tops fed straight from the console (not through the sub)". S. 5. Typo "Playback only.." (two full stops). S. |
| Hobbyist | Exactly their setup; the (a)/(b) comparison is genuinely useful. |

## BUILD · Capstone 4 · Stereo band system with subwoofers · MODULE 5 / 11 (one side built to LIVE, both refusals tried)

| Field | Notes |
|---|---|
| First look | Empty plan, REQS 0/9. Intro card: "Where crossover and limiting live in a passive system… Build one side first: console → processor → amplifier → passive top. Watch it go LIVE, then repeat for the other side and the subs." A clear recipe. |
| Overwhelm | 3-4. The bin grows to 10 parts and adds three new words at once (Digital stagebox, Loudspeaker management processor, Power amplifier, Passive loudspeaker / subwoofer). 9 requirements. |
| Knows what it is learning? | Partly. "Passive" is never defined on this screen; the refusal message is what finally teaches it (see below). |
| Knows what to do first? | Yes (the recipe). The processor and amps only stand in four small "Rack · 1-4" rings in the top-right corner of the plot (26-28 units apart, fine to tap but easy to miss; nothing on the plot says "RACKS"). |
| Words they would not know | passive, crossover, limiting, loudspeaker management processor, "speaker level", "OUT ?", "ALL OUTPUTS". |
| Follows / continues? | Mostly. I followed the recipe exactly: console → processor → amplifier → passive top. Every link was accepted ("✓ Power amplifier → Passive loudspeaker, at speaker level") but the top stayed **SILENT**, because no source was placed yet: the recipe says "watch it go LIVE" and leaves out the mic. Only after I added a vocal mic and cabled it to the console did the top read "live". A beginner who follows the card to the letter will think they wired it wrong. Second wrinkle: the amplifier → top link says "Tap OUTPUT to choose the console output it carries": choosing a CONSOLE output on a cable that leaves an AMPLIFIER is hard to picture. |
| Refusals tried | (1) Top selected, then console tapped (wrong direction): "△ Passive loudspeaker has no signal output — the sound leaves it as air." (2) Console → passive top: "Passive loudspeaker is passive — it needs a POWER AMPLIFIER between Mixing console and the cabinet. Line level is far too weak to drive a cone." Both are excellent, plain, physical explanations: the best teaching moments of the capstone. |
| What works | The two refusal messages; "Every passive cabinet is driven by a power amplifier" ticking the moment the amp link is made; the recipe-style intro. |
| Suggestions | 1. Recipe fix: "Place a mic first. Then build one side: mic → console → processor → amplifier → passive top, and watch it go LIVE." S. 2. Define passive once, before the build ("a passive speaker has no amplifier inside; it needs a separate power amplifier"), e.g. as the first line of the brief, since the bin introduces "Passive" here for the first time. S. 3. Label the rack corner on the plot ("RACKS: processor and amps") so the four tiny rings are findable. S. 4. On amp → speaker links, word the OUTPUT prompt as "Which console output reaches this speaker through the amp?" or set it on the console → processor link instead. M. 5. The console-preset note ("the playback is sent post-fader to Aux 6") appears on a build that has no playback in its bin: write a preset note per capstone or drop it here. S. 6. Typo "Four-piece band.." S. |
| Hobbyist | A great step up from powered speakers; the processor-in-the-middle idea is what they rarely see at home. |

## BUILD · Capstone 5 · Digital stagebox and networked audio · MODULE 6 / 11 (stage side and network link built; one mistake tried)

| Field | Notes |
|---|---|
| First look | Empty plan, but REQS already reads **1/8** before anything is placed: "✓ No analog snake" is met by doing nothing. A beginner's first thought: "did I already do something?" |
| Overwhelm | 3-4. Bin of 12 parts. Requirement 4 is long: "The console's outputs come back down the same link and leave the stagebox — no cable from the console to anything else". |
| Knows what it is learning? | Yes, the intro's picture is strong: "every input to the console, and every output back to the stage, on one network cable instead of a heavy analog snake." The why ("fragile mic-level signals stay short") is in the screen guide only, not on the page. |
| Knows what to do first? | Yes: "Place the stagebox and cable every source into it, none straight to the console." The stagebox may also stand at "Power · stage-right wing", which then leaves no home for power distribution; nothing says so. |
| Words they would not know | stagebox, network link, analog snake, "digital (network)", returns, "leave the stagebox". |
| Follows / continues? | Yes. The deliberate mistake (mic straight to the console across the whole venue) was ACCEPTED with a green "✓ Vocal microphone → Mixing console, at mic level." Requirement 2 stayed unticked, silently. Then the same mic accepted a SECOND cable to the stagebox ("✓ Vocal microphone → Digital stagebox"): one microphone with two cables, which a beginner will take as normal. Stagebox → console: "✓ … at digital (network)". Console → stagebox: "✓ Mixing console → Digital stagebox, at digital (network)", and requirement 4 ticked. The plot draws the two directions as one run, but CABLES counted them as 2 (4 in total), while the page keeps saying "ONE network link". |
| What works | "at digital (network)" in the link message; the return path ticking requirement 4 immediately; the honest wording of the brief. |
| Suggestions | 1. Give the long mic-level run an amber warning on this capstone: "Accepted, but this is the long fragile run the stagebox is here to remove: plug it into the stagebox." S. 2. A microphone has one output: refuse a second cable from the same mic ("A mic has one output; unplug it from the console first"). S. 3. Count a two-way network link as 1 in CABLES (or show "1 network link, both ways"). S. 4. Do not start the checklist with a met "No analog snake" line; show it as "○ No analog snake (keep it that way)" until something else is built. S. 5. Put the reason to care on the page: "A mic signal is tiny; on a 60 m run it picks up hum. The stagebox turns it digital on stage." S. 6. Typo "front of house.." S. |
| Hobbyist | They will know USB/network interfaces; the "both ways on one cable" idea is the new, valuable bit. |

## BUILD · Capstone 6 · Band with four monitor mixes · MODULE 7 / 11 (CONSOLE panel used; plot side not rebuilt)

Depth note: the plot side (sources, wedges, amps, mains) uses the same place-and-cable steps walked in capstones 2-5, so here I spent the time on what is new: the CONSOLE key and its send panel. The four wedge rings (Wedge 1-4) are 40-42 plot units apart, so they do not have the overlap problem of capstone 2.

| Field | Notes |
|---|---|
| First look | Plot, REQS **1/8** at start again: "✓ Console: every monitor send is PRE-fader" is met while nothing is sent at all. A new dock key: CONSOLE ▸ 1/2. The instruction line now says "Build it on the plot from the bin in PART, then open CONSOLE to route it". |
| Overwhelm | 4 on the plot page; **5 inside CONSOLE**. The panel is a grid of 10 channels (Kick, Snare, Overheads, Bass DI, Guitar, Keys, Lead vocal, Backing vox, Announce, Playback) × 4 wedges, each cell with ▲, ▼, a level and a PRE key: 40 cells, about 160 tap targets in a phone-width popup, plus ALL PRE / ALL POST per wedge. |
| Knows what it is learning? | Yes: the intro ("each performer's wedge gets its own aux mix… pre-fader so house fader moves never change what the band hears") and the wedge headers that name the musician (WEDGE 1 SINGER, WEDGE 2 GUITAR, WEDGE 3 BASS, WEDGE 4 DRUMS): a beginner knows at once who each column is for. |
| Knows what to do first? | Partly. The panel's own line is "▲/▼ step a level; PRE lights the pre-fader tap." It does not say which channel to start with; the natural guess (singer's own voice in the singer's wedge) works. |
| Words they would not know | aux, send, pre-fader / post-fader, "tap", bus, "ALL PRE", DI, overheads, "Announce". |
| Follows / continues? | Yes, with a sting. I pressed ▲ on Lead vocal → Wedge 1: the readout under the grid changed to "AUX 1 · WEDGE 1 HEARS: Lead vocal at -20 dB" (excellent, plain feedback). But the PRE requirement that was ticked at the start **un-ticked** the moment I did the right thing (the send starts POST). A beginner reads that as "I broke something". ALL PRE for Wedge 1 ticked it again. The panel never shows a house fader moving, so the reason for PRE ("house fader moves never change what the band hears") is told, not shown here (it is shown in ROUTE). |
| What works | Musician names on the wedge columns; "WEDGE n HEARS: …" lines (the clearest feedback in BUILD); ALL PRE / ALL POST shortcuts; "stays open — compare while you watch" so the plot is still visible. |
| Suggestions | 1. Start with the minimum grid: show the 4-5 channels a first mix needs (vocal, guitar, bass, kick, keys) and fold the rest under "MORE CHANNELS". M. 2. Make new monitor sends start PRE on this capstone (it is the lesson's answer) or show the PRE requirement as "○ waiting: nothing sent yet" instead of a free ✓ that later disappears. S. 3. Add one first step on the panel: "Start with WEDGE 1 · SINGER: tap ▲ on Lead vocal." S. 4. Put a single house fader for Lead vocal in the panel so the learner can watch WEDGE 1 HEARS stay put when it moves (PRE) and change when it moves (POST). M. 5. Typo "something different.." S. |
| Hobbyist | They will love the "who hears what" lines; the grid is familiar from a digital mixer app. |

## BUILD · Capstone 7 · Subgroups and effects · MODULE 8 / 11 (CONSOLE panel used: subgroup, double-routing, DCA)

| Field | Notes |
|---|---|
| First look | REQS 1/7 at start again ("✓ The drums still reach the main mix" met with nothing done). CONSOLE ▸ 1/4. The intro card arrived about a second late and opened ON TOP of the CONSOLE panel I had just opened: two overlays stacked. |
| Overwhelm | 5 inside CONSOLE. One panel holds: 10 channel rows each with L/R, GROUP, DCA and a REVERB send (▲ ▼ OFF PRE), ALL PRE / ALL POST, two subgroups (DRUMS, VOCALS) each with TO L/R and a fader, two DCAs (BAND, VOCALS) each with a fader and MUTE, and three "HEARS" readouts (MAIN MIX, DRUMS SUBGROUP, AUX 5 · REVERB). Three routing ideas (subgroup, post-fader effect, DCA) in one screen. |
| Knows what it is learning? | Yes from the intro: "a subgroup sums audio, a post-fader effect send follows the fader, and a DCA moves faders by remote". The notes give the real-world reason well: "hang the whole band on one DCA so a speech cue is one fader move." |
| Knows what to do first? | Yes: intro says "put kick, snare and overheads on the DRUMS subgroup". Tapping Kick's GROUP cell (shown as "—") set it to DRUMS: one tap, no chooser. Discoverable only by trying; nothing says "tap — to assign". |
| Words they would not know | subgroup, DCA, L/R, assign, post-fader, PRE, Aux 5, "TO L/R". |
| Follows / continues? | Yes, and the model is honest. After Kick → DRUMS, Kick still had L/R lit: the row showed "△ L/R + GROUP" and MAIN MIX HEARS read "Kick +6" (the classic double-routing fault, 6 dB hot). Good that it is modelled, but "△ L/R + GROUP" is code to a beginner and nothing says "the kick now reaches the main twice, so it is 6 dB too loud: switch its L/R off". Switching L/R off brought the kick back to 0 dB through the group. Kick DCA "—" → BAND with one tap; BAND DCA ▼ twice → "DRUMS SUBGROUP HEARS: Kick at -6 dB" and the kick moved in the main list: the DCA visibly turns the channel down without carrying audio. The MAIN MIX HEARS list re-sorts by level, so "Kick" jumped from first to last; a beginner looking for it may think it disappeared. |
| What works | "HEARS" readouts as the proof of every routing move; the double-routing fault modelled (+6) instead of hidden; one-tap GROUP / DCA cells; the speech-cue reason for a DCA. |
| Suggestions | 1. Split the panel into steps that match the requirements (1 DRUMS subgroup → 2 vocal reverb sends → 3 BAND DCA), each showing only its columns; or tabs GROUP · FX · DCA. M. 2. Replace "△ L/R + GROUP" with words on tap or as a line under the grid: "Kick reaches the main twice (direct and through DRUMS): +6 dB. Turn its L/R off." S. 3. Show "tap to assign" in the empty GROUP / DCA cells (e.g. "+ group") instead of "—". S. 4. Keep MAIN MIX HEARS in channel order (as the grid) so a row does not jump. S. 5. Do not start the intro card after the learner has already opened CONSOLE; or close CONSOLE while the card shows. S, SHARED (intro timing). 6. Typo "mixed properly.." S. |
| Hobbyist | The double-routing +6 is a lesson many home mixers never learn; they will appreciate it. |

## BUILD · Capstone 8 · Matrices for mains, fills and lobby · MODULE 9 / 11 (CONSOLE panel: lobby matrix built)

| Field | Notes |
|---|---|
| First look | REQS 1/7 at start ("✓ Nothing vocal is sent to the sub aux (Aux 6)": met by doing nothing, fair this time since it is a "don't"). CONSOLE ▸ 1/4. |
| Overwhelm | 4-5. The notes are one 70-word paragraph naming four destinations (mains, front fills, lobby, subs) and three matrices. The panel: 10 channels × two send columns, with headers printed as "ANNOUNCE / LOBBY / ALL PRE / ALL POST / SUBS / SUBS / ALL PRE / ALL POST" (the two aux columns read as four labels; "SUBS SUBS" is a doubled header), then three matrix blocks with MAIN / AUX 7 / AUX 6 toggles showing "off". |
| Knows what it is learning? | Partly. The intro says it well ("matrices build extra outputs from the finished mix, so front fills, subs and a lobby each get their own level while following every house move"), but "matrix" is never pictured: a beginner does not know a matrix is "a small mixer after the main mixer". |
| Knows what to do first? | Yes from the intro (fills on MTX 2, subs on MTX 1, then set them to take MAIN). |
| Words they would not know | matrix, front fill, overflow, lobby feed, Aux 7, "takes MAIN", "by its own route". |
| Follows / continues? | Yes. Matrix 3 MAIN: off → 0 dB; AUX 7: off → 0 dB; Announce ▲ on Aux 7: "MATRIX 3 · LOBBY HEARS: Announce at 1 dB, Kick at 0 dB, Snare at 0 dB…" The lesson ("the announce mic arrives there twice and sits louder than the rest", screen guide) shows only as **1 dB** louder: a number a beginner cannot feel, and the page does not say "that is the point". |
| What works | The "HEARS" readouts again; matrix toggles that turn from "off" to a level; real venue story (conference hall with a lobby). |
| Suggestions | 1. One picture line for matrix: "A matrix is a small extra mixer fed by your finished mixes; each one feeds one speaker group with its own level." S. 2. Fix the column headers: one header per aux ("AUX 7 · ANNOUNCE (lobby)", "AUX 6 · SUBS") with ALL PRE / ALL POST under it, no doubled "SUBS SUBS". S. 3. After the lobby route works, say it in words: "The lobby now hears the announcer twice (main + Aux 7), so speech sits above the band there." and start the Aux 7 send higher so the difference is visible (e.g. +6). S. 4. Split the notes paragraph into four lines, one per destination. S. 5. Typo "lobby overflow.." S. |
| Hobbyist | Matrices are new to nearly all home users; the lobby example makes them make sense. |

Correction to capstone 4, suggestion 2 (found while walking capstone 9): the parts bin DOES carry a plain line per part, e.g. passive loudspeaker: "Drivers and a crossover in a cabinet, no amplifier. It needs a power amplifier of the right size, connected by speaker cable…". So "passive" is defined, but only inside the open bin, after the beginner has already met the word in the requirement list. Keep the suggestion as "repeat that one line in the brief", size S.

## BUILD · Capstone 9 · Outdoor system with front fills and delays · MODULE 10 / 11 (delay side built around the processor on purpose)

| Field | Notes |
|---|---|
| First look | REQS **1/9** at start: "✓ Every passive cabinet has an amplifier" is met while there are no cabinets. The story is vivid: "A park stage for two thousand, ninety meters deep." |
| Overwhelm | 4. Nine requirements; the Outputs requirement alone is 46 words ("…each front fill on Matrix 2, MONO or its own side's main; each delay on its own side's main or MONO"). Eight speaker positions to fill. |
| Knows what it is learning? | Yes: "alignment is what makes this one system rather than six" (notes) and the intro: "the delays must wait for the main speakers' sound to reach them". |
| Knows what to do first? | Yes: the intro lists the parts in order and warns "Cable the delays from the processor, not straight from the console". |
| Words they would not know | front fill, delay loudspeaker/tower, alignment, processor, MONO, Matrix 2, "fly over". |
| Follows / continues? | I placed console, mic, one amp and one passive box at "Delay · house left", and cabled mic → console → amplifier → delay box, skipping the processor on purpose. Result: green "✓ Power amplifier → Passive loudspeaker, at speaker level", the box went **LIVE**, "Everything live" and "fed THROUGH the console" both ticked; only "ALL fed through the processor" stayed open, with no message saying the processor was skipped. A helpful context line did appear under the Outputs requirement: "A delay speaker takes its own side's main or MONO — the processor gives it its own level and delay." The delay time itself is never shown in BUILD: the VenueView "… ms" label is fed only on the LEARN pages (`plot.tsx`), so the core idea of this capstone (how long a delay must wait) is told, not seen, here. |
| What works | The story and its scale; the contextual hint under the Outputs requirement; "rather than six" (systems) as the reason to care. |
| Suggestions | 1. When a delay or fill goes LIVE without the processor, show an amber note on it: "Live, but not aligned: it plays before the main sound arrives. Feed it from the processor." S. 2. Once a delay box is fed through the processor, print its delay on the plot ("waits 87 ms", from the same `delayMs` used in LEARN chapter 11). M. 3. Do not tick "Every passive cabinet has an amplifier" while no cabinet exists (show "○ (no cabinets yet)"). S. 4. Break the Outputs requirement into one line per speaker group. S. 5. Typo "ninety meters deep.." S. |
| Hobbyist | The delay-tower idea is new to most; seeing the milliseconds would make the capstone. |

## BUILD · Capstone 10 · Festival-style complete system · MODULE 11 / 11 (bin, checklist and CONSOLE panel tried; plot not built in full)

| Field | Notes |
|---|---|
| First look | REQS 0/12, the page button now reads FINISH ›, the dock has PART and CONSOLE ▸ 0/4. |
| Overwhelm | 5, honestly earned (it is the capstone). Twelve requirements; one of them is 47 words ("Outputs: MAIN L left, MAIN R right; each wedge on a different monitor aux; the in-ears on Aux 8 (or, for a stereo mix, the In-ears L/R pair: Aux 9 + 10, two cables from the stagebox); the subs on Aux 6"). Bin of 15 parts (new: Floor wedge passive/powered, In-ear monitor transmitter, In-ear bodypack). The CONSOLE panel has 8 send columns (WEDGE 1-4 with musician names, SUBS, IN-EARS MONO, IN-EARS L, IN-EARS R) × 10 channels drawn as knobs: on the phone the panel shows about five columns and ONE channel row (Kick) before "more ↓", and scrolls both ways. |
| Knows what it is learning? | Yes: "How every earlier capstone joins into one complete system". The notes add a useful honesty line: "on a real main stage the inputs are split to a separate monitor console at side stage." |
| Knows what to do first? | Yes: "Build the PA side first… Then the stage side… Then open CONSOLE." A good order. |
| Words they would not know | in-ear transmitter, bodypack, Aux 8 / 9 / 10, Matrix 4, sub aux, split, "stereo in-ears". |
| Follows / continues? | The console side responds well: Lead vocal ▲ into the SUBS column → "AUX 6 · THE SUBS HEAR: Lead vocal at -20 dB" and the "no vocal or speech" requirement stays open. The page does not say why that is bad; the screen guide has the line ("A vocal on it puts the singer's chest in the subwoofers") but it is not on the page. FINISH › opens "WHAT'S LEFT · 10 pages not done yet… jump straight to any of them", with PRACTICE AGAIN, DONE · BACK TO SOUND SYSTEMS and "Practicing again or reviewing never clears what you have already done." A clean ending. "The empty venue" (a sandbox with no pass condition shown) is listed as "not done", which may puzzle. |
| What works | The build order in the intro; the console's "THE SUBS HEAR" line; the honest split-console note; the WHAT'S LEFT page. |
| Suggestions | 1. Break the 12 requirements into the three phases the intro names (PA SIDE · STAGE SIDE · CONSOLE) with a sub-count each ("PA 2/4"). S. 2. In CONSOLE, show one destination at a time (a WEDGES / SUBS / IN-EARS / RECORD switch) so a phone shows a full channel list for one mix, not five columns of one row. M. 3. Put the "singer's chest in the subwoofers" reason in the requirement or as a line when a vocal lands on Aux 6. S. 4. Explain how module 1 "The empty venue" counts as done (or leave it out of WHAT'S LEFT). S. 5. Typo "recording feed.." S. |
| Hobbyist | A satisfying final boss for them; the in-ear L/R detail is real-world. |

### BUILD mode · overall (capstones 2-10)

**Journey.** The capstones are well ordered (mono → 2.1 → passive with processor → stagebox → monitors → subgroups/DCA → matrices → delays → everything) and each has a real story and a live checklist; capstone 3 can be passed in a few minutes and the PASS state is clear. A beginner is stopped early, though: capstone 2's two centre positions sit on top of each other, and the intro's own order makes the second one impossible to tap. From capstone 6 on, the CONSOLE panel replaces the plot as the hard part, and it is dense (40-80 send cells on a phone).

**3 biggest problems:** (1) Overlapping plot targets in capstone 2 (blocking) and small unlabeled rings everywhere. (2) Accepted-but-wrong links: a green ✓ and LIVE for links that skip the console (cap 2), the stagebox (cap 5) or the processor (cap 9); a mic can take two cables. The requirement quietly stays open with no "why". (3) Free ticks at the start (caps 5, 6, 7, 8, 9: "No analog snake", "every monitor send is PRE", "drums reach main", "every passive cabinet has an amplifier" all ✓ before anything exists), and in cap 6 one of them un-ticks the moment the learner does the right thing.

**3 best things:** (1) Refusal messages in physical language ("the sound leaves it as air", "Line level is far too weak to drive a cone"). (2) "HEARS" readouts in CONSOLE (WEDGE 1 HEARS, THE SUBS HEAR, LOBBY HEARS). (3) Real stories and reasons (sub level as one fader; one DCA so a speech cue is one move; "rather than six" systems).

**Repeated typo:** every capstone instruction line ends its venue sentence with two full stops ("…backing track..", "…Playback only..", etc.): capstones 1-10.

---

## ROUTE · Module 2 · Pre-fader and post-fader · `#labpreview/SoundSystemsRoute` → MODULE 2 / 8 (done: both goals ✓)

| Field | Notes |
|---|---|
| First look | Three tall bus meters side by side (AUX 1 · SINGER'S WEDGE, AUX 5 · REVERB, MAIN MIX with Kick, Snare… "+4 more"), readouts FADER · WEDGE HEARS · REVERB HEARS · MAIN, all 0 dB. Reads as "three meters: who hears the singer". Good. |
| Overwhelm | 2-3. One channel, two sends, one fader. The "ON THIS CONSOLE" paragraph about mutes and pre-fader sends is a pro aside (it ends well: "a monitor engineer will ask before the first song"). |
| Knows what it is learning? | Yes. The notes' setup is clever: "both currently tapped the WRONG way around: the wedge follows the house fader, the reverb ignores it." THE TWO SENDS box gives the rule per send in one line each. |
| Knows what to do first? | Partly: three different first steps. The intro card: "Before changing anything, pull VOX FADER to −20 dB and watch WEDGE HEARS and REVERB HEARS. Then set WEDGE TAP to PRE…" (the best one: see the problem first). The instruction line: "Set WEDGE TAP to PRE and FX TAP to POST, then ride the VOX FADER down". The notes: "Tap PRE under each send". Also the intro card arrived late and opened over the WEDGE TAP tray I had already opened. |
| Words they would not know | tap (as in "the point the copy is taken"), pre-fader / post-fader, aux, unity, "ride", "wet". |
| Follows / continues? | Yes. I followed the intro: lead vocal fader down 4 steps → "FADER -12 dB · WEDGE HEARS -12 dB · REVERB HEARS 0 dB": the wrong state is visible and makes the point by itself. Then (in CONSOLE) ALL PRE for the wedge and ALL POST for the reverb → "WEDGE HEARS 0 dB · REVERB HEARS -12 dB" and both goals turned "✓ … done". The WEDGE TAP tray explains each choice in plain words ("The send takes its copy AFTER the fader: it follows every fader move. For effects and aux-fed subs."). Tool note: the dock's VOX FADER strip did not move under a synthetic drag or arrow keys in this preview (its slider has no keyboard focus), so I used the CONSOLE tray's ▼ steps; a finger drag on a phone was not checked (needs a phone). |
| What works | Starting in the wrong state; the two "HEARS" readouts as the score; the tray's one-line meaning for PRE and POST; ticks that need both the setting AND the fader move ("fader pulled down, wedge unchanged"). |
| Suggestions | 1. One first step everywhere: use the intro's order (pull the fader first, watch, then fix) in the instruction line and the notes too. S. 2. Say "slide" or "pull" instead of "ride". S. 3. Put a short "what a tap is" line: "A send copies the channel. PRE copies it before the fader, POST after." above THE TWO SENDS. S. 4. Fold "ON THIS CONSOLE" (mute behaviour) under a PRO NOTE. S. |
| Hobbyist | The cleanest explanation of pre/post they will meet. |

## ROUTE · Module 3 · Subgroup, aux, matrix or DCA? · MODULE 3 / 8 (done: 8 of 8, one wrong pick first)

| Field | Notes |
|---|---|
| First look | No display and no dock on this page: header, "CHAPTER 4 · SUBGROUP, AUX, MATRIX OR DCA?", "Eight situations from real shows. Each has one right tool; the wrong ones come with the reason they fail.", then eight situation cards with four tool buttons each. Reads as "a quiz", which is right. |
| Overwhelm | 2. Concrete, real situations ("The whole band needs to come down 6 dB under the speech, without changing any monitor mix."). |
| Knows what it is learning? | Yes; the intro card adds the thinking tool: "Before you tap a tool, ask: does audio need to pass through it, and should it follow the house mix or ignore it?" (the same two questions as LEARN chapter 4). |
| Knows what to do first? | Yes. But the intro card arrived about a second after the page and swallowed my first answer tap (the tap closed nothing and picked nothing; the card was sitting over the cards). SHARED intro-card timing, as G5 saw on NEXT. |
| Words they would not know | DCA / VCA, matrix, mute group, "aux-fed sub", "wet / dry", "split", "broadcast truck". |
| Follows / continues? | Yes. Wrong pick (DCA for the drum compression case): "A DCA rides the level, but no audio passes through it — there is nothing to insert a compressor on." The reason is physical and memorable. Each right pick shows a ✓ line that teaches ("A PRE-FADER aux send is an independent copy: its level is set on the send, and the channel fader does not touch it."). Counter "8 of 8 chosen." |
| What works | Wrong answers explained by the reason they fail; right answers explained too (not just "correct"); real-show wording; the two-question thinking tool in the intro. |
| Suggestions | 1. Put the intro's two questions on the page above Situation 1 (they are the key to every answer and vanish when the card closes). S. 2. Situation 5 (sub feed) relies on "aux-fed sub" from LEARN chapter 5: add "(see LEARN chapter 5)" in its ✓ line. S. 3. Show the score as "8 of 8 right" (not "chosen") so the learner knows they are done. S. |
| Hobbyist | Fast and satisfying; the wrong-answer reasons are the best part. |

## ROUTE · Module 4 · Four monitor mixes · MODULE 4 / 8 (done: both goals ✓)

| Field | Notes |
|---|---|
| First look | Four wedge meters (W1 · SINGER, W2 · GUITAR, W3 · BASS, W4 · DRUMS), empty; readouts CHANNEL LEAD VOCAL · SEND OFF · TAP — · WEDGES ≥2 0/4. Musician names on the meters make it instantly human. |
| Overwhelm | 3. Two ways to work: the dock (CHANNEL ▸, SEND ▸ with a lane, PRE, CONSOLE ▸) or the CONSOLE grid. |
| Knows what it is learning? | Yes. THE RULE: "The house engineer's faders must not reach into a performer's mix — which is what PRE means." The notes give a ready-made recipe per wedge ("Wedge 1 is the singer's: vocal and a little keys…"), which removes guesswork. |
| Knows what to do first? | Partly. The instruction line packs four steps: "Pick a CHANNEL, tap SEND to pick its wedge, ride the lane up and set PRE — or open CONSOLE for the whole desk." The intro card again appeared after the page and sat on top as I reached for CONSOLE. |
| Words they would not know | aux, send, lane, PRE, "ride", "linked pair of auxes", in-ear transmitter. |
| Follows / continues? | Yes. In CONSOLE I followed the recipe (vocal + keys to W1, vocal + guitar to W2, vocal + bass to W3, vocal + kick to W4): "WEDGES ≥2 4/4" and "✓ Every wedge hears at least two channels"; then ALL PRE on each column → "✓ Every monitor send is PRE-fader". The meters above filled, each listing its channels with a PRE tag and a level. On the phone the channel names in the wedge meters are cut ("Lead vo…"). |
| What works | Named wedges; the recipe in the notes; the meters as proof; ALL PRE per column. |
| Suggestions | 1. Split the instruction into numbered steps (1 pick a wedge · 2 add two channels · 3 set PRE) and offer CONSOLE as "or do it all on the desk". S. 2. Show the recipe as a tiny table next to the meters (W1: vocal, keys…) so it is visible while working. S. 3. Shorten channel names in the wedge meters ("Vox", "Keys") so they are not cut at 390 wide. S. 4. Start new sends PRE in this module, or tell the learner that every new send starts POST here, so "PRE" is a deliberate second step and not a surprise. S. |
| Hobbyist | Exactly what they want to practise before their first live gig. |

## ROUTE · Module 5 · Subgroups and DCAs · MODULE 5 / 8 (done: both goals ✓)

| Field | Notes |
|---|---|
| First look | Three bus meters (DRUMS SUBGROUP "silent · OFF", MAIN MIX with channel bars "+4 more", AUX 4 · DRUMMER) and readouts KICK → MAIN · KICK → WEDGE · BAND DCA · DRUMS GRP 0/3. The two "KICK →" readouts are the experiment in miniature: smart. |
| Overwhelm | 3-4. The instruction line is three tasks in one sentence; THE RULE is a 90-word paragraph (subgroup carries audio, DCA carries none, DCA mute, double-routing △ flag, parallel processing). |
| Knows what it is learning? | Yes: "THE DIFFERENCE, PROVEN" and "THE THREE BUSES ABOVE" explain each meter in one line. This page also explains the △ double-routing flag that BUILD capstone 7 leaves unexplained. |
| Knows what to do first? | Yes. The dock's BAND DCA key reads "LOCKED" with a helpful reason ("locked — no channel is on BAND yet. Open CONSOLE and tap a channel's DCA cell..", with a doubled full stop). |
| Words they would not know | subgroup, DCA, L/R, "insert point", "parallel processing", "double-routing", "remote hand on each member's fader" (a good image). |
| Follows / continues? | Yes, end to end: kick, snare, overheads → DRUMS and off L/R ("DRUMS GRP → L/R", goal 1 ✓), kick DCA → BAND (the dock key unlocks), BAND DCA ▼ four times → "KICK → MAIN -12 dB · KICK → WEDGE 0 dB" and goal 2 ✓. The proof is exactly the lesson. |
| What works | The two KICK → readouts; LOCKED with a reason; "a remote hand on each member's fader"; the page owning the △ explanation. |
| Suggestions | 1. Number the three tasks in the instruction (1 drums into DRUMS, off L/R · 2 kick on BAND · 3 BAND down to −10). S. 2. Split THE RULE: keep the first two sentences; move DCA mute and parallel processing to a PRO NOTE. S. 3. Link BUILD capstone 7 to this page for the △ flag ("what is △? see ROUTE 5"). S. 4. Fix "DCA cell.." (two full stops). S. |
| Hobbyist | The proof (main drops, wedge doesn't) settles the DCA-vs-subgroup confusion for good. |

## ROUTE · Module 6 · Mute groups, solo and direct outs · MODULE 6 / 8 (done: both goals ✓, one wrong answer first)

| Field | Notes |
|---|---|
| First look | One meter "MAIN MIX — WHO IS STILL LIVE" and readouts BAND MUTE OFF · MAIN HEARS 10 CH · STILL LIVE ALL · CHECK —. Dock: just two keys, BAND MUTE and ALL MICS. Very calm. |
| Overwhelm | 2 to do, 4 to read: under the task sit two dense blocks, "SOLO · PFL · AFL" (≈80 words) and "INSERTS · DIRECT OUTPUTS · DIGITAL PATCHING" (≈60 words), three topics that are not part of the mute task. |
| Knows what it is learning? | Yes for mute groups (a real moment: "Between songs the band must vanish and come back exactly as set, while the announcement microphone and walk-in music stay live"). The solo/insert/patching blocks are a second and third lesson. |
| Knows what to do first? | Yes: "Press BAND MUTE and read what the main mix still hears." The intro card adds a good second step: "Then press ALL MICS as well and see which…". |
| Words they would not know | mute group, PFL, AFL, solo-in-place, destructive, insert, direct output, patch, "control-room output". |
| Follows / continues? | Yes. BAND MUTE → "MAIN HEARS 2 CH · STILL LIVE MC · PB" (green) and goal 1 ✓. "MC · PB" is shorthand a beginner cannot decode (announce Mic, PlayBack). Then ALL MICS → "MAIN HEARS 1 CH" and STILL LIVE turned amber **"CHECK"**: a catch-all word (`pagesRoute.tsx` line 499: anything that is not "MC · PB" or "ALL" prints "CHECK"), shown right next to a readout that is itself called CHECK. The meter itself was clear (only "Playback" left). The check question: PFL (wrong) → only "Not quite — try again." (module 3 explained every wrong pick; this one does not); AFL → "✓ AFL listens after the fader and pan: the channel as the mix hears it…" and goal 2 ✓. |
| What works | The between-songs story; a two-key dock; the meter listing who is still live; the ✓ explanation. |
| Suggestions | 1. Spell out STILL LIVE: "ANNOUNCE + PLAYBACK" (or "MIC · MUSIC"), and replace "CHECK" with what is true ("MUSIC ONLY", "SOME MICS"). S. 2. Give each wrong answer its own reason, as module 3 does ("PFL is before the fader: you would not hear the fader or pan."). S. 3. Fold SOLO and INSERTS/PATCHING into "MORE ON THE CONSOLE ▾"; the page's task is mute groups. S. 4. Say what ALL MICS is for in its key or caption ("mutes every mic, announce mic too: see what is left"). S. |
| Hobbyist | Useful; PFL/AFL is the bit they half-know and will be glad to have explained. |

## ROUTE · Module 7 · Matrix outputs · MODULE 7 / 8 (done: 3 of 3 goals ✓)

| Field | Notes |
|---|---|
| First look | Four bus meters (MX 2 · FRONT FILLS, MX 3 · LOBBY, MX 4 · RECORDING, AUX 7 · ANNOUNCE), all "silent · OFF"; readouts FILLS TAKE · LOBBY TAKES · REC TAKES · MC → AUX 7. |
| Overwhelm | 3. Three destinations, three goals, a MATRICES tray, an MC → AUX 7 fader and CONSOLE. |
| Knows what it is learning? | Yes, and better than BUILD capstone 8: the notes define a matrix in one sentence ("A matrix mixes finished BUSES — the main mix, an aux, a subgroup — into a further output with its own level, EQ and delay"), THE LOBBY box explains the "arrives twice" idea, and THE RULE gives the reason: "A matrix is the post-main tool… the fills, the lobby and the recorder follow it". |
| Knows what to do first? | Yes. The MATRICES tray explains its own control: "Tap a crosspoint to cycle it: off → 0 dB → −6 dB." |
| Words they would not know | matrix, crosspoint, front fills, Aux 7, "post-main", PRE-fader, "MC" (announce mic, never spelled out on the readout). |
| Follows / continues? | Yes. Crosspoints: FILLS TAKE MAIN, LOBBY TAKES MAIN + AUX 7, REC TAKES MAIN (goals 1 and 3 ✓). Announce → Aux 7 (one ▲ in CONSOLE, -20 dB) → goal 2 ✓, and "MX 3 · LOBBY: Announce at 1 dB, Kick at 0 dB…": the "louder than everything else" result is only +1 dB, so the page's promise is technically met but not visible. Tool note: the MC → AUX 7 dock fader is a drag strip that did not respond to synthetic input in this preview; CONSOLE ▲ did the same job. |
| What works | The one-sentence matrix definition; "TAKES" readouts that read like sentences ("LOBBY TAKES MAIN + AUX 7"); the crosspoint hint in the tray. |
| Suggestions | 1. Start the Aux 7 send at a level that makes the announce mic clearly louder in the lobby (+6 dB), or add a line when goal 2 ticks: "The lobby hears the announcer twice: about N dB above the band." S. 2. Spell MC as "ANNOUNCE MIC" on the readout and dock key. S. 3. Reuse this page's matrix definition and LOBBY box in BUILD capstone 8. S. |
| Hobbyist | Matrices finally make sense; the recording feed is something they will actually use. |

## ROUTE · Module 8 · Output patching · MODULE 8 / 8 (done: 7/7 patched, one wrong patch first)

| Field | Notes |
|---|---|
| First look | A stagebox panel "STAGEBOX · LINE OUTPUTS" with seven sockets, each with a bus tape above and a destination below (PROC 1 L, PROC 2 R, WEDGE 1, WEDGE 2, PROC 4 SUB, PROC 3 FILL, LOBBY); readouts SOCKET · FED FROM UNPATCHED · PATCHED 0/7. Looks like real gear with masking-tape labels: very good. |
| Overwhelm | 2-3. One clear job, repeated seven times. |
| Knows what it is learning? | Yes: "A wrong patch is silent at best — a main output into a wedge amplifier puts the house mix in the singer's wedge." Concrete stakes. |
| Knows what to do first? | Yes: "Tap a socket, then the bus it needs." The SOCKET chooser lists each output with its destination in plain words ("OUT 3 · Wedge 1 amplifier", "OUT 5 · Processor input 4 → subwoofers (aux-fed)"). |
| Words they would not know | patch, stagebox, processor input, aux-fed, Matrix 2/3. The BUS chooser lists "Aux 1, Aux 2, Aux 6, Matrix 2, Matrix 3" with no names; in BUILD the same list reads "Aux 1 · Wedge 1", "Aux 6 · Subs". A beginner must remember which aux is which. |
| Follows / continues? | Yes. Wrong on purpose (Main L into OUT 3 · Wedge 1): the socket shows ✗ and "✕ Wedge 1 amplifier: patched from Main L. A wedge takes its own aux — never a main output (one of the TROUBLESHOOT faults)." Fixed with Aux 1, then the other six → "PATCHED 7/7" and "✓ Every output leaves the right socket. Document it — the patch list is what the next person rebuilds from." The notes still say "Nothing is patched yet." after 7/7 (static line). |
| What works | The taped panel; destinations in plain words; the wrong-patch line that names the consequence and links to TROUBLESHOOT; the closing professional habit ("Document it"). |
| Suggestions | 1. Name the buses in the BUS list as BUILD does ("Aux 1 · Wedge 1", "Aux 6 · Subs", "Matrix 2 · Fills", "Matrix 3 · Lobby"). S. 2. Let a socket be tapped directly on the panel (the instruction says "or tap one on the panel"; in this preview the sockets had no tap target I could reach, so I used the chooser; not checked on a phone). S. 3. Make the notes' "Nothing is patched yet." follow the state (or drop it). S. |
| Hobbyist | Very real; a digital-desk owner will recognise the patch page. |

### ROUTE mode · overall (modules 2-8)

**Journey.** ROUTE is the strongest mode for a beginner after LEARN: every module starts from a clear situation, has 1-3 goals that tick on real actions, and proves each idea with a computed "HEARS" or "→" readout (wedge stays put while the house fader moves; main drops while the drummer's wedge does not). All seven modules could be finished by a careful beginner. The weak spots are wording, not mechanics.

**3 biggest problems:** (1) The intro card arrives late and lands on top of whatever the learner opened first (trays, CONSOLE, quiz answers): modules 2, 3, 4, 5. (2) First steps that differ between the intro card, the instruction line and the notes (module 2), and four-step instruction sentences (modules 4, 5, 7). (3) Codes on readouts: "MC · PB", "CHECK" (module 6), "MC → AUX 7" (module 7), unnamed "Aux 1 / Aux 6" in the patch list (module 8).

**3 best things:** (1) Proof readouts ("KICK → MAIN -12 dB · KICK → WEDGE 0 dB"). (2) Wrong answers explained by why they fail (module 3, module 8). (3) Starting in a wrong state the learner fixes (module 2: both sends tapped the wrong way round).

---

## OPERATE · Module 2 · Line check · `#labpreview/SoundSystemsOperate` → MODULE 2 / 5 (done: 14/14 marked, one wrong mark first)

| Field | Notes |
|---|---|
| First look | A two-part status board: "PROCESSOR · OUTPUT SIGNAL PRESENT / PLAYS THE RIGHT FEED (TALK-MIC TEST)" with six numbered outputs (MAIN L … WEDGE 3), then "STAGEBOX INPUT LEDs / CONSOLE CHANNEL METERS" with eight inputs (KICK … PB), all "?". Readouts LINE · PROC OUT · RIGHT FEED · MARKED 0/14. It looks like a checklist on a clipboard: right for the job. |
| Overwhelm | 3. Fourteen lines to probe and mark, but each is one tap + one tap. The notes explain the two readings per line in plain questions ("did the signal arrive at the stage?" / "did it arrive at its channel?"). |
| Knows what it is learning? | Yes: "Outputs first — the PA has to be proven before there is anything to line-check into". THE RULE is a superb diagnostic key: "LED lit but meter flat = the patch. LED dark = the cable or the source." |
| Knows what to do first? | Yes, two ways: the dock (LINE ▸ + PROBE + MARK OK / MARK FAULT) or the PROBE buttons on every row of the list. I used the list. |
| Words they would not know | line check, processor output, talk-mic, stagebox LED, pink noise, "open on pin 2", patch. |
| Follows / continues? | Yes. Each probe writes its reading in plain words on the row: "Plays the HOUSE MIX, not Aux 2 — talk into the announce mic and it comes out of Wedge 2. Patched from Main L."; "Stagebox LED 5 lights while the keys play — but channel 5's meter stays FLAT… channel 5 is patched from input 6."; "Stagebox LED 7 stays DARK… Swap the cable: alive. The original reads open on pin 2." Marking Wedge 2 OK on purpose gave "Read it again — that reading is a fault." with OK / FAULT offered again. After all 14: MARKED 14/14 and "✓ Every output and input probed and correctly marked". Two observations: (a) the readings already say the cause ("Good.", "Patched from Main L."), so marking needs reading, not reasoning; for a beginner that is fine as a first pass, but THE RULE (LED vs meter) is never put to work. (b) The page ends at the tick: nothing says what to do about the three faults found (fix the patch, replace the cable). |
| What works | Two readings per line; plain-language readings; "Read it again" instead of a red X; THE RULE as a diagnostic key; "It is the cheapest hour of the day." |
| Suggestions | 1. Show the two readings as symbols first (LED ● / meter ▁) and let the learner choose OK / PATCH FAULT / CABLE FAULT using THE RULE; reveal the plain sentence after the mark. M. 2. End the page with a "what you found" summary: "3 faults: Wedge 2 output patch, channel 5 input patch, channel 7 cable. Next: fix them before soundcheck." S. 3. Put THE RULE above the list (it is the tool for the whole job and sits at the bottom). S. 4. Gloss "pink noise" and "talk-mic" once. S. |
| Hobbyist | Satisfying and realistic; a hobbyist who has done one gig will nod at "LED lit but meter flat = the patch". |

## OPERATE · Module 3 · Establish gain structure · MODULE 3 / 5 (opened, read, stage picker used; the lane fader could not be moved here)

Not finished, real reason: every value on this page changes only through the dock's lane fader (a drag strip). In this web preview the lane did not respond to a synthetic drag, a tap or arrow keys (its slider takes no keyboard focus), as on ROUTE 2 and 7 where CONSOLE ▲/▼ offered a way round. This page has no ▲/▼ alternative, so the three goals could not be reached by me. A finger on a phone should drag it: not checked (needs a phone).

| Field | Notes |
|---|---|
| First look | Eight meters in a row with small gear icons above (mic, preamp, fader, main, processor in/out, amp, speaker), red CLIP dots with ↑ arrows on every stage after the preamp, numbers under each (SOURCE -30 … SPEAKER -10). Readouts AT SPEAKER -10 dBu · ABOVE NOISE 69 dB · HEADROOM **CLIP** · VERDICT **CLIPPING** in red. A red "✕ Clipping at the preamp gain. Every stage after it inherits the distortion — turning a later control down makes it quieter, not cleaner." Strong, alarming in a useful way. |
| Overwhelm | 4. Eight meters with two numbers each, a five-symbol legend (● CLIP LED, ⌐ bracket, ▮ white tick, ▒ gray haze, - - - dashed NOMINAL "+4 dBu lines up with −18 dBFS…"), a four-step PROCEDURE with dBFS/dBu, three goals. |
| Knows what it is learning? | Yes: "Distortion can only be fixed where it starts." (intro) and the notes' framing: "The opposite fault from the LEARN chapter: the preamp is cranked and every later stage is pulling it back down." |
| Knows what to do first? | Yes: "The lane is the PREAMP: ride it down until its bracket shows headroom." Then "tap the key, pick each later stage, return it to unity (double-tap)". The stage picker (WHICH STAGE) lists every stage with its value and a plain description of the selected one ("Preamp gain · The one control that adds gain to a mic-level signal… starved, and every later stage amplifies its hiss; cranked, and every later stage inherits its clipping."). I also found that tapping a meter column selects that stage (my tap landed on PROC IN and the lane switched to it): handy, but nothing says so. |
| Words they would not know | preamp, unity, headroom, dBu, dBFS, nominal, attenuate, "inherited", noise floor, limiter, gain-before-feedback, "double-tap to unity" (a hidden gesture). |
| Follows / continues? | Not reached (see the note above). |
| What works | Starting in the clipping state with every downstream ↑; the red sentence that names the trap ("quieter, not cleaner"); stage descriptions in the picker. |
| Suggestions | 1. Give the lane ▲/▼ step buttons (or a −/+ pair) as ROUTE's CONSOLE tray has, so the page can be done without a precise drag and with assistive tech. M, SHARED (lane). 2. Say "tap a meter to pick that stage" in the instruction line. S. 3. Make "double-tap = back to unity" visible (a small "UNITY" button next to the lane). S, SHARED. 4. Show the legend one symbol at a time as each matters (G5 made the same point for LEARN chapter 10). M. |
| Hobbyist | A good companion to the Gain Staging Lab (linked under GO DEEPER). |

## OPERATE · Module 4 · Ring-out and soundcheck · MODULE 4 / 5 (POSITION and NOTCH used; SEND lane could not be moved here)

Goal 1 ("Every wedge at −6 dB or louder") needs the SEND lane, which, like the gain lane on module 3, did not respond in this preview and has no ▲/▼ alternative. Not checked on a phone (needs a phone). POSITION, NOTCH and WEDGE all worked.

| Field | Notes |
|---|---|
| First look | A stage drawing labelled LIVE ANGLE / NULL / WEDGE, "LOOP STABLE · SEND -18 dB", readouts W1 SINGER … W4 DRUMS all -18 dB, and the caption "RING-OUT — ILLUSTRATIVE MODEL · placement buys 12 dB, a notch 4". A heading line "WEDGE 1 · SINGER · 6 dB of margin". |
| Overwhelm | 3. Four wedges, four dock keys (WEDGE, SEND, POSITION, NOTCH). THE FOUR WEDGES list states each wedge's situation in one line ("Wedge 3 · Bass · -18 dB · in the null · 18 dB of margin"), which is a model of a readable status. |
| Knows what it is learning? | Yes: "move each wedge into its mic's null first, notch only what still rings, then bring the level up." The order is the lesson. |
| Knows what to do first? | Yes: "pick Wedge 1 · Singer and raise SEND to −6 dB: it rings. Then set POSITION to In the null". |
| Words they would not know | ring-out, live angle, null, notch, margin, cardioid / super- / hypercardioid, "110–125° off axis", gain-before-feedback, analyzer. |
| Follows / continues? | Partly (see the note). I did the steps in the WRONG order on purpose: NOTCH first, while the wedge was still in the live angle. It was accepted silently: margin 6 → 10 dB, no word that the page's rule is "position first". Then POSITION → In the null: margin 10 → 22 dB and THE FOUR WEDGES read "in the null · notched · 22 dB of margin". The POSITION tray explains each choice clearly ("In the null · Directly behind this cardioid microphone, where it hears least… geometry first, before any notch."). The "margin" number is the feedback, but "margin" is never defined (it means "how far below the ring you are"). |
| What works | One-line status per wedge; the tray text for each position; honest "ILLUSTRATIVE MODEL" note ("teaching proportions, not measurements"); the order of the fix stated everywhere. |
| Suggestions | 1. Define margin once: "margin = how many dB you can still turn up before it rings". S. 2. When NOTCH is used before POSITION, say so: "Notch saves 4 dB; moving the wedge saves 12. Try POSITION first." S. 3. Give SEND ▲/▼ steps (same lane issue as module 3). M, SHARED. 4. Show the wedge-to-mic angle on the drawing for the selected wedge with the null marked, so "null" is a place you can see (the stage does draw one wedge; label its null in words). S. |
| Hobbyist | The "position first, notch second" rule is the real-world gem. |

## OPERATE · Module 5 · Shutdown and documentation · MODULE 5 / 5 (done: both goals ✓, one wrong order first)

| Field | Notes |
|---|---|
| First look | Five devices in a row all "● ON" (STAGE DEVICES, CONSOLE, PROCESSOR, AMPLIFIERS, LOUDSPEAKERS), readouts STEPS 0/5 · LAST — · ORDER SO FAR OK · DARK 0/5, "POWER DOWN · YOUR ORDER · Nothing yet." Same calm frame as OPERATE 1, so the learner already knows how it works. |
| Overwhelm | 2. One ordering task and a five-item checklist. |
| Knows what it is learning? | Yes: "Power-down is the mirror of power-up, for the same reason." (the shutdown teaser G5 asked for on OPERATE 1 lives here). THE RULE gives a reason to care: "Documentation is not admin. It is what lets the next person — or you, next week — rebuild the system". |
| Knows what to do first? | Yes, but the STEP tray almost answers itself: the buttons read "Amps and powered boxes — FIRST", "Console — save first", "Stage devices — last". The ordering puzzle becomes reading the labels. |
| Words they would not know | system master, processor outputs, "thump", scene, preset, patch list. |
| Follows / continues? | Yes. Wrong on purpose (Console first): ORDER WRONG and "✕ "Console" must come AFTER "Mute the processor outputs (or pull the system master)". Reset and try again." (it names the missing step: good), RESET in the dock. Then Mute → Amps → Processor → Console → Stage devices: "ORDER CORRECT · 5/5", each step listed with its reason ("Nothing that is switched off later can send a thump through an amplifier that is already off."). The goal tick arrived about a second after the last step. DOCUMENT: five checkboxes; ticking all five gave "✓ Document the configuration". Two issues: (a) the checklist lets you tick "Console scene saved" AFTER the console has been switched off, while THE RULE says "Before the console goes dark, the show is saved"; the order the page teaches is not the order it accepts. (b) Accessibility: the rack's spoken label ignores the power-down direction (`pagesOperate.tsx` line 116 uses `on.has(r.step)` while the drawing uses `!on.has` when direction is down), so after "Mute + Amps" a screen reader hears "Stage devices off, Console off, Processor off, Amplifiers on, Loudspeakers on": the exact opposite of the screen. |
| What works | Mirror of OPERATE 1; the wrong-order message names the step that must come first; reasons under each chosen step; THE RULE on documentation. |
| Suggestions | 1. Drop "— FIRST", "— last", "save first" from the STEP button labels; keep the reasons for after the pick. S. 2. Put "Save the console scene" INTO the power-down sequence (before Console off), or lock that checkbox once the console is dark with "too late: it was saved before power-down?". S. 3. Fix the rack's spoken label for power-down (use the same `lit` test as the drawing). S. 4. Close OPERATE with a one-line recap of the day: line check → gain → ring-out → shutdown. S. |
| Hobbyist | Quick; the documentation habit is the useful takeaway. |

### OPERATE mode · overall (modules 2-5)

**Journey.** OPERATE follows a real show day in order (power-up, line check, gain, ring-out, shutdown), which gives a beginner a strong sense of where they are. Line check and shutdown are fully doable and well fed back. The two middle modules (gain structure, ring-out) are the richest ideas, but every value lives on a drag lane with no ▲/▼ steps, which I could not move in this preview (not checked on a phone).

**3 biggest problems:** (1) Lane-only controls on modules 3-4 (no step buttons, no keyboard), unlike ROUTE's CONSOLE tray. (2) Answers given away: line-check readings state the cause ("Good.", "Patched from Main L."), and shutdown step labels say "FIRST" / "last". (3) Order rules not enforced: notch before position accepted silently; console scene can be "saved" after the console is off.

**3 best things:** (1) A real show-day sequence. (2) THE RULE lines as diagnostic tools ("LED lit but meter flat = the patch"). (3) Wrong-order messages that name the missing step.

---

## TROUBLESHOOT · Module 2 · Dead signal · `#labpreview/SoundSystemsTroubleshoot` → MODULE 2 / 6 (cases 1 and 2 solved hands-on)

How a case works (seen here, same in every group): tap a case → a case card (symptom in quotes, a one-line setting such as "Club system: digital stagebox, console at front of house…", and a starting hint "▸ The symptom clears everything before CONSOLE INPUT. Start there and walk forward.") → PROBE a station from the tray or the map → each probe writes "STATION · READING" plus a plain sentence → FAULT opens four candidate causes → a debrief with ✓ / ✓✓, WHY, THE FIX and THE WALK. BENCH returns to the list.

| Field | Notes |
|---|---|
| First look | The nine-station map (SOURCE … LISTENER under STAGE / CONSOLE · RACKS / LOUDSPEAKERS, all "?"), readouts CASE 0 SOLVED · PROBED · READS · GRADE, six case cards in the customer's words. Inviting. |
| Overwhelm | 2-3. Six cases, one at a time; a six-colour legend under the notes. |
| Knows what it is learning? | Yes: "The walk finds where the signal stops." The intro adds the method: "PROBE the starting station first, then walk forward one station at a time." |
| Knows what to do first? | Yes: the case card tells you where to start. One odd hint: case 2 says "The symptom clears everything before SOURCE" (there is nothing before the source; it means "start at the source"). |
| Words they would not know | probe, station, main bus, stagebox, "open on pin 2", tester, "forward walk", ✓✓. |
| Case 1 "No sound anywhere" | Console input · OK ("Every channel meter is moving"), Console output · NO SIGNAL ("The MAIN bus meter sits at nothing while the channel meters dance. The main MUTE button is lit."), then I probed one station too far on purpose (Processor · NO SIGNAL "Dark. Nothing arrives."). Wrong name on purpose ("The amplifier rack has lost power"): "✕ Not this one. You have already read the station that changed — look at that reading again. FAULT re-opens after your next probe." FAULT then stays locked until another probe. The natural next probe is to re-read the station that changed (Console output); doing so produced "△ You jumped backward. The bench still records the answer, but not as a forward walk." and the grade became ✓, not ✓✓ ("4 probes; a disciplined walk from Console input needs 2"). **The lock forces a probe and then grades that probe as a backward jump**: a beginner who made one wrong guess cannot earn ✓✓ on that case and will not understand why. The debrief itself is excellent: "WHY · Channel meters alive and the main meter dead put the fault between them… THE FIX · Un-mute the main bus. Then ask how it got muted: a mute group, a scene recall, or a hand." |
| Case 2 "One input has no sound" | Clean forward walk: Source · OK ("The performer is on; the microphone is live and its switch is on."), Cable · NO SIGNAL ("Swap in a known-good cable: the channel comes alive. The original reads open on pin 2 on the tester."), FAULT → "A faulty microphone cable" → "✓ Correct — and a source-forward walk. 2 probes; a disciplined walk from Source needs 2." GRADE ✓✓. THE FIX: "Replace the cable and tag the bad one so it does not go back in the case." (a real habit). |
| Other four cases in this group | Left loudspeaker has no sound · Subwoofers have no output · Signal reaches the mixer but not the loudspeakers · Intermittent cable or connector: symptoms read on the list; not walked (see the TROUBLESHOOT depth note at the end of this mode). |
| What works | Symptoms in the customer's voice; the start hint; readings as observations a real tech would make; the four-part debrief (WHY / FIX / WALK); grading the method, not just the answer. |
| Suggestions | 1. After a wrong name, re-open FAULT on a re-read of the station that changed without counting it as a backward jump (or unlock FAULT immediately and just record the wrong guess). S. 2. Reword the start hint for source-first cases: "Start at the SOURCE and walk forward." S. 3. Show ✓ vs ✓✓ meaning once on the first case card ("✓ = right answer; ✓✓ = right answer by walking forward from the start"). S. |
| Hobbyist | The best mode for them, as G5 said; the debriefs are worth reading even when right. |

## TROUBLESHOOT · Module 3 · Level, noise and distortion · MODULE 3 / 6 (case "Amplifier clips" solved ✓✓)

| Field | Notes |
|---|---|
| Case card | "AMPLIFIER CLIPS · "It gets harsh and nasty as soon as the band gets loud." · Amplifier input attenuators fully open (full output at +4 dBu in); the processor limiter threshold is set ABOVE that. · ▸ The symptom clears everything before CONSOLE OUTPUT." The setting line already states the cause (see the cross-case finding below). |
| Walk | Tapping stations on the map works as well as the tray (the map stations are labelled "Console OUT, not probed — tap to probe"). Console OUT · OK, Processor · OK, Amplifier · CLIP · DISTORTION ("CLIP LEDs flash on every loud passage. With the attenuators open this amplifier is at full output by +4 dBu, so everything above that is flattened — and the limiter upstream is set higher than the amplifier's clip point, so it never wins."). FAULT: four options, one obviously right and phrased with its fix ("The amplifier is driven into clipping — set its input level and the system gain structure"). "✓ Correct — and a source-forward walk. 3 probes; a disciplined walk from Console output needs 3." |
| Debrief | WHY ("the first station to run out of it [headroom] is the amplifier… the distortion is a warning of damage to come"), THE FIX ("The limiter, not the amplifier, should set the ceiling."), THE WALK ("The first station with no headroom left is where the level structure broke."): three strong, memorable lines. |
| Words they would not know | attenuator, +4 dBu, limiter, threshold, headroom, tweeters. |
| Other cases in this group | Loudspeaker produces distortion · Loud hum or buzz · Ground loop · Excessive limiter activity: list read, not walked (depth note below). |
| Suggestions | 1. Hide the setting line's cause (see cross-case finding 1). S. 2. The right option should not carry its own fix in the wording; keep all four options the same length and form. S. |

## TROUBLESHOOT · Module 4 · Routing · MODULE 4 / 6 (case "Wrong output bus selected" solved, far-end guess first)

| Field | Notes |
|---|---|
| Case card | ""Guitar meter is moving on the desk but the guitar is not in the PA." · The guitar channel is assigned to Subgroup 3. Subgroup 3 is not assigned to the main mix. · ▸ … Start [at CONSOLE INPUT]". Again, the setting line is the answer. |
| Walk | I guessed at the far end first, as an amateur would: Loudspeaker · OK ("Cabinet plays cleanly at the expected level."). A beginner may read "OK" as "the guitar is fine there", since the reading says nothing about the guitar being absent. Then Console IN, Console OUT · NO SIGNAL ("The guitar channel is assigned to SUBGROUP 3 only. Subgroup 3's master has no MAIN assignment — its meter moves, the main mix never receives it."). Named correctly: "✓ Correct — but not a forward walk. 3 probes; a disciplined walk from Console input needs 2." The grade drops, but nothing says WHY in my case words ("you started at the loudspeaker: that is guessing at the far end"); THE WALK line only says "That is where the walk went." |
| Debrief | WHY: "A channel meter shows what enters the channel, not where it goes." Excellent. THE FIX: "Assign Subgroup 3 to the main mix (or the channel directly), and check the other subgroups." |
| Other cases | Incorrect digital patch · Pre-fader / post-fader routing error · Monitor changes when the main fader moves · Subwoofer receives vocals unintentionally: list read, not walked. |
| Suggestions | 1. When the first probe is downstream of the start hint, say so in the grade line: "You started at the loudspeaker; the walk starts at the console input." S. 2. Make far-end OK readings say what they hear: "Plays the band cleanly; no guitar in it." S. |

## TROUBLESHOOT · Module 5 · Time, polarity and crossover · MODULE 5 / 6 (case "Reversed polarity" solved ✓✓)

| Field | Notes |
|---|---|
| Case card | ""Each side alone sounds full. Both together, the bass disappears in the middle." · Two powered tops. The cable to the right top has pins 2 and 3 swapped." (the answer, again). |
| Walk | Console OUT · OK, Processor · OK, "Powered cabinet (amp inside)" · OK (the station is renamed for powered speakers: good), Loudspeaker · **"OK · POLARITY"** ("Each cabinet alone is full. Both together: the low end cancels on the center line. Flip the polarity of ONE cabinet: it returns. The right cabinet's cable tests pins 2 and 3 reversed."). A reading that says OK and names the fault in the same badge is confusing. ✓✓ with 4 probes. |
| Debrief | Superb physics in plain words: "Every electrical station reads normal because a reversed cable IS a normal signal, upside down… Some faults live between stations, not in one — the walk still finds them, at the end." |
| Other cases | Incorrect crossover · Delay loudspeaker arriving too early: list read, not walked. |
| Suggestions | 1. Use a non-OK badge for the station where the fault shows ("COMPARE · POLARITY" or "OK ALONE · CANCELS TOGETHER"). S. 2. This case depends on hearing (cancellation in the middle); with sound off the words carry it well, keep them. |

## TROUBLESHOOT · Module 6 · Digital, network and acoustic · MODULE 6 / 6 (case "Digital clocking problem" solved ✓✓)

| Field | Notes |
|---|---|
| Case card | ""Clicks and pops, every few seconds, on every channel at once." · Digital stagebox set to be the clock master; the console has been switched to INTERNAL clock." (the answer). |
| Walk | Stage input · OK, Console IN · "OK · CLICKS" ("Every channel clicks at the same instant. The console's clock page reads INTERNAL — two masters, and the receiver slips a sample whenever they drift apart."). Named "A digital clock mismatch — one clock master, everything else following it" → ✓✓, 2 probes. |
| Debrief | WHY: "One bad cable affects one channel; a clock fault affects every channel at once, at the same instant." (a perfect beginner rule of thumb). THE FIX goes deep (Dante/AES67 elections, sample rates): fine for a hobbyist, heavy for a beginner. |
| Words they would not know | clock master, INTERNAL clock, sample, Dante, AES67, sample rate. |
| Other cases | Network audio interruption · Feedback appears during soundcheck: list read, not walked. |
| Suggestions | 1. Lead THE FIX with one plain line ("Pick ONE device to keep time; set every other device to follow it") and fold the Dante/AES67 detail. S. 2. Same "OK · CLICKS" badge issue as polarity. S. |

### TROUBLESHOOT · cross-case findings and depth note

**Depth note (real reason):** 5 of the 22 cases were solved hands-on (one per group plus a second dead-signal case); the other 17 were opened from their group lists (symptom read) but not walked. Each walk costs 6-8 tool round trips in this preview (refs regenerate after every BENCH, so every case needs fresh look-ups), and this run also had to cover DJ screens 2-24 and Game Audio pages 17 and 19 hands-on. The mechanism is identical in every case (card → probes → FAULT → debrief), so the five walks cover every kind of feedback the bench gives. I then checked all 22 `setup:` lines in `src/features/soundsystems/faults.ts` (lines 95-633) for the finding below.

1. **The case setting line gives the answer away** in 12 of 22 cases (amp attenuators open, limiter preset from a smaller cabinet, channel 1 patched from input 4, guitar on Subgroup 3 not on main, reverb send PRE, wedge amp patched from MAIN L, vocal on Aux 6, pins 2 and 3 swapped, crossover at 400 Hz, DELAY outputs 0.0 ms, console on INTERNAL clock, wedge firing on-axis at +6 dB) and strongly hints in 3 more (20 m unbalanced keyboard cable, two mains circuits, door-hinge network cable with Energy-Efficient Ethernet). A beginner who reads the card can name the fault without walking; the bench then grades the walk, but the thinking it wants (read, compare, stop at the first change) is skipped. Suggestion: show only the symptom and a neutral system description ("Club system: stagebox, console, processor, amps, passive tops") on the card; reveal the setup detail in the debrief. M.
2. **Wrong guess → locked FAULT → forced re-probe → "jumped backward"** (case 1). S.
3. **"OK" badges on the station where the fault shows** ("OK · POLARITY", "OK · CLICKS"). S.
4. **Grade drops without saying why in the learner's terms** (far-end first probe). S.
5. **What works across all five:** customer-voiced symptoms; a start hint; observational readings; a four-part debrief that teaches the physics (polarity, clock) in one or two sentences; method graded, not just answer.

---

## SOUND SYSTEMS LAB · G5b verdict on the practice modes (adds to G5's verdict)

**The beginner's journey through the four practice modes.** ROUTE is the gentlest and most complete: every module could be finished, and each proves its idea with a computed "HEARS" readout. TROUBLESHOOT is the most motivating (customer-voiced faults, excellent debriefs) but its case cards hand over the answer. OPERATE follows a real show day; its two middle modules depend on a drag lane with no step buttons. BUILD is the most ambitious and the most fragile on a phone: overlapping targets (capstone 2), small unlabeled rings, links that are wrong but get a green ✓, and console panels of 40-80 cells.

**3 biggest orientation problems (practice modes)**
1. **Feedback that says "fine" when it is not:** green ✓ + LIVE for links that skip the console, stagebox or processor (BUILD); free requirement ticks before anything is built; "OK" badges on the faulty station (TROUBLESHOOT); notch-before-position accepted silently (OPERATE 4).
2. **Phone ergonomics:** capstone 2's stacked centre positions (blocking, code-confirmed), tiny rings, cable removal by tapping a thin line, CONSOLE grids that show one channel row at a time, lanes without ▲/▼.
3. **The intro card arrives late and lands on top** of whatever the learner opened first (trays, CONSOLE, quiz answers), in BUILD, ROUTE, OPERATE and TROUBLESHOOT alike (SHARED).

**3 best things**
1. "HEARS" / "→" readouts that prove routing ideas (ROUTE 2, 4, 5, 7; BUILD 6-10).
2. Explanations in physical language at the moment of a mistake (BUILD refusals, ROUTE 3 wrong answers, TROUBLESHOOT WHY / FIX / WALK).
3. Real-work framing throughout: café, club, park for two thousand, line check as "the cheapest hour of the day", "Document it — the patch list is what the next person rebuilds from."

**"First 30 seconds" rewrite for a practice mode (BUILD capstone 2 as the example):** "A café corner: one singer with a guitar, plus a backing track. Build: 1 · put the console at FRONT OF HOUSE · 2 · put the sub at SUB · CENTER, then the speaker at CENTER CLUSTER (tap the names below) · 3 · plug mic, DI and playback into the console · 4 · plug the console into both speakers and choose MONO for each. The checklist ticks as you go; a ⚠ means it works but is not what this job needs."
