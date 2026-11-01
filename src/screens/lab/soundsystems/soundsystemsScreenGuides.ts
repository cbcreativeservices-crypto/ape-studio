/**
 * Sound Systems Lab — "explain this screen" content (owner 2026-10-31, the
 * Screen Guide rollout). One guide for the hub, one for every page of the
 * five modes (keyed by the page's on-screen TITLE — the same string the
 * header shows), one for LEARN's appended understanding check, and one for
 * the what's-left screen every mode opens at FINISH.
 *
 * Every line was written against the page's own code (pagesLearnA/B/C,
 * pagesBuild, pagesRoute, pagesOperate, pagesTroubleshoot, gainDock and the
 * features/soundsystems models): the names are the on-screen names (dock
 * keys, bezel keys, tray titles, labels drawn on the stage), and every number
 * quoted in TRY THIS is what the page prints at that setting — worked out in
 * test/screenGuide_soundsystems_20261031.test.ts from the same model
 * functions (parallelLoad, predictedSpl, delayMs, computeGainChain …). Change
 * a page's labels, ranges or defaults → update its guide here.
 *
 * Each section is one step and must fit a 375×812 phone with no scrolling —
 * SCREEN_GUIDE_BUDGET (types.ts). Copy rules: plain language; claims
 * KNOWLEDGE, never skills; no "N of total"; "suggest", never "recommend"; no
 * gear maker names; no build notes in learner text.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';

/* ── the hub ─────────────────────────────────────────────────────────────── */

export const SS_HUB_GUIDE: ScreenGuide = {
  seeing: [
    'The Sound Systems Lab home: five modes, each a card with its own progress bar.',
    'LEARN teaches the chapters; BUILD, ROUTE, OPERATE and TROUBLESHOOT put the same ideas in your hands.',
    'WHAT IS LEFT lists what still counts toward credit, with the UNDERSTANDING CHECK (the last page of LEARN) at the bottom.',
  ],
  control: [
    'Tap a mode card to open that mode where you left it. The modes can be done in any order.',
    'Tap a row in WHAT IS LEFT to jump straight to that mode.',
    'START OVER (PRACTICE) sends every mode back to its first page. Pages, capstones, exercises and faults you have completed stay credited.',
  ],
  changes: [
    'Each card’s bar fills as you finish its pages, capstones, exercises or faults — the hub reads each mode’s saved progress every time you come back.',
    'A mode’s row leaves WHAT IS LEFT once it is complete; the UNDERSTANDING CHECK row stays, with a ✓ once passed. When everything is done the panel turns green and reads SOUND SYSTEMS LAB — COMPLETE.',
  ],
  teaches: [
    'How a live sound system is taught here: understand it (LEARN), assemble it (BUILD), route it (ROUTE), run it (OPERATE), then fault-find it (TROUBLESHOOT).',
    'It sits in Live Sound Reinforcement, beside the DJ Systems Lab, and draws on the cable, gain and speaker labs.',
  ],
  tryThis: [
    'Start with LEARN: its first page is the whole system on one map, and every later mode refers back to it.',
    'After a few LEARN chapters, open BUILD and place a source, a console and a loudspeaker on the empty venue.',
  ],
};

/* ── the what's-left screen (every mode, after FINISH) ───────────────────── */

export const SS_END_GUIDE: ScreenGuide = {
  seeing: [
    'Where you are in this mode: the title reads WHAT\'S LEFT, or LAB COMPLETE when every page is done.',
    'Each page not done yet is listed by name; the pages you have finished fold into one ✓ line.',
  ],
  control: [
    'Tap a page that is still left to jump straight to it.',
    'REVIEW ▾ on the ✓ line unfolds the finished pages; tap any one to open it again.',
    'PRACTICE AGAIN FROM THE START reopens page 1 and clears nothing.',
    'DONE · BACK TO SOUND SYSTEMS returns to the lab’s home, where WHAT IS LEFT covers all five modes.',
  ],
  changes: [
    'A page joins the ✓ line once its goals are met — the goal chips in its notes — and a summary page marks itself as soon as it opens.',
    'In LEARN the check counts only when every question is answered correctly.',
  ],
  teaches: [
    'Which parts of this mode you have worked through, and which you have not met yet.',
    'Nothing is ever taken away: any page can be opened again for practice.',
  ],
  tryThis: [
    'Jump to the first page still listed and read its LAB NOTES before you touch a control.',
    'Tap DONE · BACK TO SOUND SYSTEMS and compare this list with the hub’s WHAT IS LEFT.',
  ],
};

/* ── LEARN (22 pages + the check) ────────────────────────────────────────── */

export const SS_LEARN_GUIDES: Record<string, ScreenGuide> = {
  'The complete system': {
    seeing: [
      'The system map in three columns, each read top to bottom: STAGE, CONSOLE · RACKS and LOUDSPEAKERS. Cables crossing between them are the hand-offs.',
      'LEDs along the cables chase a simulated program. The card above the notes shows the station you picked: what it takes IN, what it sends OUT, where it comes FROM and goes TO.',
      'Readouts: STAGE IN, HOUSE, STATION and SEEN.',
    ],
    control: [
      'STATION: ride it along the signal path, or tap any station on the map, to inspect it.',
      'STAGE IN: Analog snake (every mic carried to the console at mic level) or Digital stagebox (preamps on stage, one network cable both ways).',
      'HOUSE: Passive + amps (processor → amplifiers → passive boxes) or Powered boxes (the amplifier inside the cabinet).',
      'LAB NOTES holds the chapter text and the goal chips.',
    ],
    changes: [
      'Switching STAGE IN or HOUSE redraws the map, but the ORDER never changes: source → stage input → console → processing → amplification → loudspeaker → listener.',
      'A powered box simply folds the amplifier into the loudspeaker; a stagebox turns the snake into a network link.',
    ],
    teaches: [
      'What every section of a live sound system does and what feeds it — the map every later page and the fault bench use.',
      'Chapter 1 of LEARN; next you trace the same path in order.',
    ],
    tryThis: [
      'Switch STAGE IN between Analog snake and Digital stagebox: the hand-off to the console reads MULTICORE or NETWORK. Tap the Snake, then the Stagebox, and compare their OUT lines.',
      'Set HOUSE to Powered boxes: Processor and Amps leave the map, and the console feeds the Powered tops (MAIN L/R) and the Powered sub (SUB OUT) directly.',
      'Tap the listener: the one station that cannot be replaced, moved or re-patched.',
    ],
  },
  'Trace the signal': {
    seeing: [
      'The nine stations of the house path, dark until you light them.',
      'Readouts: LIT (how many are lit), LAST (the station lit last) and THREAD — OK, WRONG or COMPLETE.',
      'Once the thread is COMPLETE, the LEDs chase with the program.',
    ],
    control: [
      'NEXT: open it and tap the station the signal reaches next. The list stays open, so you can tap the whole path in a row.',
      'RESET (appears once something is lit) clears the thread so you can start again.',
    ],
    changes: [
      'A station tapped out of order turns the thread WRONG and the note says why: the signal has not reached it yet.',
      'Tapped in order, each station lights; the ninth one completes the thread.',
    ],
    teaches: [
      'The order a signal travels, source to listener — the same walk a technician makes on every fault.',
      'Chapter 1 continued; the fault bench in TROUBLESHOOT uses these nine stations.',
    ],
    tryThis: [
      'Tap Source, then jump to Amplifier: THREAD turns WRONG. Read the note, RESET and go in order.',
      'Light all nine in order and watch THREAD read COMPLETE as the LEDs start to chase.',
    ],
  },
  'Ten kinds of system': {
    seeing: [
      'A plan view of one system, stage at the top, its name and scale above it.',
      'The beams show where each box stands and what the floor gets.',
      'The card below gives the system’s chain, WHEN it is the right answer and NOT WHEN. Readouts: TYPE, BOXES and SEEN.',
    ],
    control: [
      'TYPE: ride it through TEN KINDS OF SYSTEM, or open the list and pick one. Each entry says whether it is CHOSEN BY THE VENUE or A WAY TO BUILD ANY OF THEM.',
    ],
    changes: [
      'Each type redraws the plan with its own boxes and positions; BOXES counts them.',
      'Most types are set by the venue — from a small powered PA to a large line array; the others are ways any of them can be built out, such as passive boxes with external amplifiers.',
    ],
    teaches: [
      'That systems differ by WHEN they are right, not just by what is in the case.',
      'Chapter 2; the next page asks you to match eight venues to these types.',
    ],
    tryThis: [
      'Compare the Large-format line-array system with the Distributed loudspeaker system: one big source flown high, or many small ones close to the listeners.',
      'Read NOT WHEN on the Small powered-loudspeaker PA, then on the Outdoor performance system.',
    ],
  },
  'Match the venue': {
    seeing: [
      'Eight venue cards, each with a short brief and four system choices.',
      'A goal chip at the top fills when every venue is matched.',
    ],
    control: [
      'Tap the system you would carry in for each venue. A wrong pick explains itself; try another until it is right.',
    ],
    changes: [
      'Each answer shows why that system fits the venue; a correct one locks the card with a ✓.',
    ],
    teaches: [
      'How a venue’s size, use and audience decide the kind of system — the step before any box is chosen.',
      'Chapter 2 practice, after the ten system types.',
    ],
    tryThis: [
      'Before you tap, say out loud what the room’s size and use rule out.',
      'After each answer, read the explanation and say which detail of the venue decided it.',
    ],
  },
  'Output configurations': {
    seeing: [
      'A plan of one output configuration: each loudspeaker drawn with its nominal (−6 dB) coverage sector, a tag saying what it carries, and the floor where it lands.',
      'Hatched floor is where two arrivals overlap and comb-filter: arriving at slightly different times, they cancel some frequencies and boost others. A seam marks the middle of a pair.',
      'Readouts: CONFIG, POSITIONS, FEEDS and SUBS (NONE, MONO or STEREO).',
    ],
    control: [
      'CONFIG: ride it through THIRTEEN OUTPUT CONFIGURATIONS, from Mono to Lobby, recording and broadcast feeds.',
      'The notes list each feed and the console bus that carries it (BUSES).',
    ],
    changes: [
      'Each configuration changes which console outputs exist and where they land: stereo splits left and right, LCR adds a center for the voice, a sub output makes the low end its own decision.',
    ],
    teaches: [
      'The ways a console’s outputs can reach a room, and what each one costs or buys.',
      'Chapter 3; the next page asks you to choose one for six rooms.',
    ],
    tryThis: [
      'Compare Stereo with LCR — left, center, right and look at where the center box lands.',
      'Compare Stereo mains with mono subwoofers with Stereo subwoofers: SUBS changes from MONO to STEREO.',
    ],
  },
  'Choose the configuration': {
    seeing: [
      'Six briefs — a lecture hall, a musical, a DJ bar, a field, flown mains, a conference — each with four configurations to choose from.',
    ],
    control: [
      'Tap the configuration that fits each brief. A wrong answer explains itself; try another.',
    ],
    changes: [
      'A correct answer shows why: the room or the brief decides, not the gear.',
    ],
    teaches: [
      'How a brief turns into an output configuration — mono for one voice in a narrow hall, delays for a deep field, matrix feeds for a lobby.',
      'Chapter 3 practice; routing comes next.',
    ],
    tryThis: [
      'For the outdoor stage, ask what the back rows need that the front rows do not.',
      'For the DJ bar, ask who should be able to turn the bass down — and from where.',
    ],
  },
  'The routing map': {
    seeing: [
      'Six routing tools as buttons: Main mix bus, Auxiliary send, Subgroup, DCA / VCA, Matrix output and Mute group.',
      'An opened tool shows four facts as ● or ○: carries audio, sums channels, a copy, remote control — then USE IT FOR and NOT FOR.',
    ],
    control: [
      'Tap each tool to open its card; a ✓ marks the ones you have opened.',
    ],
    changes: [
      'Nothing moves here: each card answers the same two questions — does audio pass THROUGH it, and does it SUM channels or COPY them?',
    ],
    teaches: [
      'Which console tool does which job, and why four of them are confused daily.',
      'Chapter 4; ROUTE mode puts every one of these on a live console.',
    ],
    tryThis: [
      'Open Subgroup and DCA / VCA side by side: one carries audio, the other only moves faders.',
      'Open Auxiliary send and Matrix output: both make new mixes, from channels or from finished buses.',
    ],
  },
  'Subwoofer feeds': {
    seeing: [
      'Six channels on the left, the console buses in the middle, the processor and two cabinets on the right.',
      'Blue lines are what reaches the subwoofer. The title names the feed method.',
      'Readouts: REACHES, CONTROL and VOCAL (CLEAR, or IN SUBS).',
    ],
    control: [
      'FEED: Crossover-fed, Aux-fed or Matrix-fed. Each option says WHEN it fits.',
      'VOCAL → SUB (only on the aux feed): send the vocal to the sub aux by mistake.',
    ],
    changes: [
      'Crossover-fed: everything below the crossover from every channel reaches the sub. Aux-fed: only the channels you send. Matrix-fed: whatever buses the matrix takes.',
      'With the vocal sent on the aux feed, VOCAL reads IN SUBS — a singer’s chest in the subwoofers, and the crossover is blameless.',
    ],
    teaches: [
      'What decides which sources reach a subwoofer, and who controls it from where.',
      'Chapter 5; placement and arrays come next.',
    ],
    tryThis: [
      'Switch FEED to Aux-fed and turn VOCAL → SUB on: VOCAL reads IN SUBS. Turn it off again.',
      'Compare CONTROL on all three feeds: PROC TRIM, PER SEND, MATRIX.',
    ],
  },
  'Subwoofer placement and arrays': {
    seeing: [
      'A plan with the two mains and the subs; the blue glow is the low-frequency field in this conceptual model.',
      'Readouts: SUBS (how many), PATTERN (OMNI, CARDIOID, END-FIRE) and RIG (GROUND or FLOWN).',
    ],
    control: [
      'LAYOUT: ride it through SUBWOOFER ARRANGEMENTS — Left / right, Center cluster, Cardioid stacks, End-fire array and Flown subs.',
    ],
    changes: [
      'Two subs a room-width apart add down the middle and cancel at some frequencies off to the sides — low notes are meters long.',
      'Cardioid and end-fire arrays use delay (and, for cardioid, a flipped box) so the glow stops behind the subs and stays in front.',
    ],
    teaches: [
      'Why sub placement is mostly geometry: fewer separated sources, boundaries used on purpose.',
      'Chapter 5 continued; real rooms add their own modes — measure before you trust a layout.',
    ],
    tryThis: [
      'Compare Left / right with Center cluster and watch the middle of the floor.',
      'Compare Cardioid stacks with End-fire array and watch where the glow stops behind the stage.',
    ],
  },
  'Stage monitors': {
    seeing: [
      'The stage from above: a wedge at the lip, a side fill at the wing, a drum fill beside the riser and a performer wearing in-ears.',
      'The card shows the monitor you picked and where it stands. Readouts: FED BY and SEEN.',
    ],
    control: [
      'MONITOR: ride it through THE MONITOR WORLD — Floor wedge, Side fill, Drum fill and In-ear monitors — or tap one on the stage.',
    ],
    changes: [
      'FED BY changes with each type: ONE AUX · PRE for a wedge or drum fill, STEREO AUX for side fills, STEREO AUX · TX for in-ears.',
    ],
    teaches: [
      'That monitoring is a second sound system pointed at the performers, normally fed PRE-fader so the house fader never moves it.',
      'Chapter 6; splits and talkback come next.',
    ],
    tryThis: [
      'Pick Floor wedge and read why it sits in the microphone’s null.',
      'Pick In-ear monitors and read the warning about level in a sealed ear.',
    ],
  },
  'Monitor console, splits and talkback': {
    seeing: [
      'Three sources feeding two consoles: front of house and the monitor console at side stage.',
      'Readouts: SPLIT, MON PREAMP, FOH HEARS and CHECKS (the two questions in the notes).',
    ],
    control: [
      'MON GAIN: the monitor engineer raises a preamp, from +0 to +12 dB.',
      'SPLIT: Analog split (two preamps, one per console) or Digital gain sharing (one preamp on a network).',
      'The notes hold two questions to answer.',
    ],
    changes: [
      'On the analog split, FOH HEARS stays UNCHANGED: each console has its own preamp.',
      'On gain sharing one preamp feeds both, so the house console applies a matching digital trim — FOH HEARS reads TRIM minus the same amount. That setting is gain compensation.',
    ],
    teaches: [
      'How one microphone reaches two consoles, and why a monitor gain move must not move the house mix.',
      'Chapter 6 continued; wiring and signal levels come next.',
    ],
    tryThis: [
      'Ride MON GAIN to +6 dB on Analog split, then switch SPLIT to Digital gain sharing: FOH HEARS changes from UNCHANGED to TRIM −6.',
      'Answer both questions in the notes until CHECKS is complete.',
    ],
  },
  'Wiring and connections': {
    seeing: [
      'Six proposed connections, each drawn from one device to another.',
      'Below them, the five signal levels on cables — mic, instrument, line, speaker and digital — with how strong each is and what carries it.',
    ],
    control: [
      'CONNECT or REFUSE each pair. The verdict appears after your answer.',
    ],
    changes: [
      'The verdict comes from the same engine that judges every cable in BUILD: either the level it connects at, or the reason it is refused.',
    ],
    teaches: [
      'That a connector’s shape never tells you the level it carries, and which mismatches are silent and which are dangerous.',
      'Chapter 7; amplifier loads come next.',
    ],
    tryThis: [
      'Before each answer, name the level leaving the first device and the level the second one expects.',
      'Read the speaker-level row in the table, then look again at any pair that starts at an amplifier.',
    ],
  },
  'Amplifier loads': {
    seeing: [
      'One amplifier channel and the passive cabinets wired across it in parallel. The wire turns gold at the amplifier’s minimum and red below it.',
      'Readouts: TOTAL LOAD, AMP MIN, INTO LOAD (watts) and VERDICT.',
    ],
    control: [
      'CABINETS: one to four, in parallel.',
      'CABINET: 16 Ω, 8 Ω or 4 Ω cabinets.',
      'BRIDGED: join two channels into one.',
    ],
    changes: [
      'Every cabinet added in parallel lowers the total load — always below the lowest single cabinet — and the amplifier must supply more current.',
      'Bridging doubles the voltage swing and doubles the minimum load, so a load that was fine unbridged can become unsafe.',
    ],
    teaches: [
      'What an amplifier can and cannot drive, worked out with the Audio Calculator’s parallel-load formula.',
      'Chapter 8; power ratings and headroom come next.',
    ],
    tryThis: [
      'With 8 Ω cabinets, set CABINETS to 2: TOTAL LOAD 4 Ω, VERDICT MARGINAL, INTO LOAD 500 W. Then 3: 2.67 Ω and UNSAFE.',
      'Choose 16 Ω cabinets and set CABINETS to 2: 8 Ω, SAFE, 300 W.',
      'Back to one 8 Ω cabinet and turn BRIDGED on: AMP MIN becomes 8 Ω and INTO LOAD reads 1000 W.',
    ],
  },
  'Power and headroom': {
    seeing: [
      'The cabinet’s power band: green from its 400 W continuous to 800 W program rating, with a marker where the amplifier lands.',
      'Readouts: MATCH, CONTINUOUS, PROGRAM and SPL at the listener’s distance (with 6 dB kept for peaks).',
    ],
    control: [
      'AMP: 100 W to 1600 W into 8 Ω, in 50 W steps.',
      'LISTENER: 2 m, 10 m or 30 m from the cabinet.',
    ],
    changes: [
      'Below the band the amplifier is UNDER — pushed to the cabinet’s level it clips, which kills tweeters. Well above it, OVER: safe only with the limiter set.',
      'Every doubling of power adds 3 dB; every doubling of distance costs 6 dB. That is why coverage is solved with placement before watts.',
    ],
    teaches: [
      'How amplifier power is matched to a loudspeaker, and how SPL falls with distance.',
      'Chapter 8 continued; the deployment sequence comes next.',
    ],
    tryThis: [
      'At the start (500 W, 10 m) MATCH reads IN BAND and SPL @ 10 m reads 98.0 dB. Double to 1000 W: 101.0 dB.',
      'Back at 500 W, set LISTENER to 30 m: SPL falls to 88.4 dB. Then pull AMP down to 300 W: MATCH reads UNDER.',
    ],
  },
  'The deployment sequence': {
    seeing: [
      'Sixteen setup steps in order, from assessing the venue to shutting down. Step 9, verify routing before powering loudspeakers, is marked.',
    ],
    control: [
      'Tap a step to open it and read why it comes where it does.',
    ],
    changes: [
      'Each opened step explains what would be unsafe, or wasted, if it came later.',
    ],
    teaches: [
      'Why a professional setup is a sequence and not a preference — and why step 9 is the one that saves loudspeakers.',
      'Chapter 9; OPERATE mode practises power-up, line check and gain.',
    ],
    tryThis: [
      'Open step 9, then step 10: verify with the amplifiers off, then power up.',
      'Open steps 11 to 13 and read one common show-day order: outputs, inputs, gain.',
    ],
  },
  'Gain structure': {
    seeing: [
      'One vocal peak followed from microphone to loudspeaker, one meter per stage, each with its red clip line above and its gray noise haze below.',
      'The verdict line says what is wrong. Readouts: AT SPEAKER, ABOVE NOISE, HEADROOM and VERDICT.',
    ],
    control: [
      'The lane starts on PREAMP. Tap its key (WHICH STAGE) to pick FADER, MAIN, PROC IN, PROC OUT or AMP; double-tap the lane to land on that stage’s unity.',
    ],
    changes: [
      'At the start the preamp is starved and every later stage makes up for it, so their noise floors rise with the signal: VERDICT NOISY.',
      'Gain placed early lifts the signal above every later floor; a stage pushed past its clip line clips, and every stage after it inherits the distortion.',
    ],
    teaches: [
      'Why the preamp does the work and the faders sit near unity, with headroom at every stage.',
      'Chapter 10; OPERATE mode sets a whole system the same way.',
    ],
    tryThis: [
      'At the start VERDICT reads NOISY. Raise PREAMP to +40 dB: with the later stages still at +10, it reads CLIPPING.',
      'Now return FADER, MAIN and PROC IN to 0: VERDICT OK, AT SPEAKER −8 dBu, ABOVE NOISE 78 dB.',
    ],
  },
  'Coverage and aim': {
    seeing: [
      'Two mains at the deck corners, each with its nominal (−6 dB) coverage sector; the floor shows the two summed.',
      'Hatched floor is where both arrive and comb-filter (some frequencies cancel, others rise — see Output configurations).',
      'Readouts: COVERAGE, AIM, RIG and FILLS.',
    ],
    control: [
      'COVERAGE: 60° to 120° horizontal, in 5° steps.',
      'AIM: straight ahead to 35° toed in.',
      'FLOWN: lift the mains. FILLS: add front fills on the stage lip.',
    ],
    changes: [
      'Narrow coverage throws further and overlaps less; wide coverage fills a wide room and paints the side walls.',
      'Toeing in tightens the overlap into the middle. Flown mains fire over the front rows, so they go dark; front fills bring them back.',
    ],
    teaches: [
      'That coverage, overlap and comb filtering are geometry first.',
      'Chapter 11; the Speaker Placement & Coverage lab covers it in full.',
    ],
    tryThis: [
      'Ride COVERAGE from 60° to 120° and watch the hatched overlap grow.',
      'Turn FLOWN on: the front rows go dark. Then turn FILLS on: they come back.',
    ],
  },
  'Delay and alignment': {
    seeing: [
      'Mains at the stage and delay towers on poles further back. The ring is the mains’ wavefront at the instant the towers fire.',
      'Readouts: NEEDED (ms), SET, ERROR and SOUND (the speed of sound).',
    ],
    control: [
      'DELAY: 0 to 300 ms added to the towers.',
      'DISTANCE: 10 m, 30 m or 60 m from the mains to the delays.',
      'AIR: 5 °C, 20 °C or 35 °C.',
    ],
    changes: [
      'Sound covers about 343 m each second at 20 °C, roughly 2.9 ms per meter — so the towers must wait until the mains’ sound reaches them. Aligned (within 2 ms), the ring just touches the towers.',
      'Warm air is faster, so the needed delay falls as the air warms.',
    ],
    teaches: [
      'How delay loudspeakers are aligned to the mains from distance and temperature, and why many engineers then add a few ms more.',
      'Chapter 11 continued; processing and tuning (Chapter 12) come next.',
    ],
    tryThis: [
      'At 30 m and 20 °C NEEDED reads 87.4 ms. Ride DELAY until ERROR is within 2 ms and the ring reaches the towers.',
      'Switch DISTANCE to 60 m: NEEDED jumps to 174.8 ms. Then set AIR to 35 °C: 170.5 ms.',
    ],
  },
  'Processing and tuning': {
    seeing: [
      'Nine processing blocks, each with where it lives: channel strip, processor or monitor outputs.',
      'Below them, a short system-tuning order and links to the RTA, SPL meter and Spectrogram tools.',
    ],
    control: [
      'Tap a block to open it; a ✓ marks the ones you have read.',
    ],
    changes: [
      'Each block says what it does and where it belongs — channel EQ shapes one source; system EQ shapes the whole system for the room.',
    ],
    teaches: [
      'What each processing block is for and where it sits in the chain.',
      'Chapter 12; feedback control (Chapter 13) comes next.',
    ],
    tryThis: [
      'Open Input EQ vs system EQ, then Parametric EQ and Graphic EQ, and compare where each lives.',
      'Open Limiters and read why they are set from ratings, never by ear on the night.',
    ],
  },
  'Feedback control': {
    seeing: [
      'From above: the performer, the microphone’s cardioid pattern and the wedge. The dashed path is the loop: mic → console → amplifier → wedge → air → mic.',
      'A bar shows the send against the red loop limit. Readouts: SEND, LOOP LIMIT, MARGIN and LOOP (STABLE or RINGING).',
    ],
    control: [
      'SEND: −30 to +10 dB to the wedge.',
      'WEDGE: In the live angle (off to the side) or In the null (directly behind the mic).',
      'NOTCH 2.5 k: cut the one frequency that rings.',
    ],
    changes: [
      'The loop rings once the send passes the limit. In this model, moving the wedge into the null buys 12 dB and the notch 4 dB more.',
      'Placement helps at every frequency at once; a notch helps only the one it finds.',
    ],
    teaches: [
      'Why gain-before-feedback is won first with geometry, then with stage level, and only last with an equalizer.',
      'Chapter 13; OPERATE’s ring-out uses the same model.',
    ],
    tryThis: [
      'At the start SEND is −12 dB and MARGIN 0 dB. Raise SEND to −11 dB: LOOP reads RINGING and MARGIN 1 dB OVER.',
      'Set WEDGE to In the null: LOOP LIMIT becomes 0 dB. Bring SEND to −6 dB: STABLE with 6 dB of margin.',
    ],
  },
  'The source-forward method': {
    seeing: [
      'The nine bench stations. The symptom is “the PA is dead, but every channel meter is dancing”, so the walk starts at the console input.',
      'Readouts: START, READ, LAST and FAULT.',
    ],
    control: [
      'WALK: ride it forward one station at a time.',
      '▶ RUN: watch the walk happen by itself (WALK AGAIN repeats it).',
    ],
    changes: [
      'Each station read shows OK until the first one that changes: the processor reads NO SIGNAL, and FAULT reads FOUND.',
      'The meters already cleared the source, the cable and the stage input, so there is no need to probe them.',
    ],
    teaches: [
      'The source-forward method: start where the symptom leaves doubt, read each station, stop at the first reading that changes.',
      'Chapter 14; TROUBLESHOOT mode puts 22 faults on this bench.',
    ],
    tryThis: [
      'Ride WALK forward one step at a time and say what you expect before each reading appears.',
      'Press ▶ RUN and count the probes: three readings, one answer, no boxes swapped.',
    ],
  },
  'What you can now do': {
    seeing: [
      'The close of LEARN: a summary of what the fourteen chapters covered, and where each of the other four modes takes it.',
      'A note that the understanding check follows this page, and a link back to the lab home.',
    ],
    control: [
      'NEXT opens the understanding check. Lab home — what is left returns to the hub.',
    ],
    changes: [
      'Nothing changes here; the page marks itself done as soon as it opens.',
    ],
    teaches: [
      'How the chapters fit together, from the complete system to fault-finding.',
      'The last reading page of LEARN; the check comes next and earns the lab’s credit.',
    ],
    tryThis: [
      'Before the check, think back to the system map on the first page and name each section from memory.',
      'Pick the mode that matches the chapter you found hardest and open it from the lab home.',
    ],
  },
};

export const SS_CHECK_GUIDE: ScreenGuide = {
  seeing: [
    'The understanding check: every question from LEARN on one page, each with its options.',
    'A ✓ replaces a question’s number once it is answered correctly.',
  ],
  control: [
    'Tap an option. CORRECT, or NOT QUITE — TRY ANOTHER, appears with an explanation; try again until it is right.',
  ],
  changes: [
    'Nothing is lost on a wrong answer and there is no score. When every question is correct, the check banks the lab’s credit unit.',
  ],
  teaches: [
    'Whether the chapters have stuck: system types, outputs, routing, subs, monitors, wiring, loads, gain, coverage, alignment, feedback and the walk.',
    'The last page of LEARN; the hub’s WHAT IS LEFT shows it as the UNDERSTANDING CHECK.',
  ],
  tryThis: [
    'After a wrong answer, read the explanation before you choose again.',
    'If a question stalls you, go back to its chapter with ‹ PREV, then return.',
  ],
};

/* ── BUILD (the empty venue + ten capstones) ─────────────────────────────── */

const BUILD_CONTROL = [
  'PART: open THE PARTS BIN, tap a part, then tap a highlighted position on the plot.',
  'Tap a placed device, then another, to run a cable; tap a cable to remove it.',
  'OUTPUT (on a loudspeaker or its cable): choose which console output it carries.',
  'REMOVE takes the selected device off the plot, with its cables; CLEAR empties the plot.',
];

const BUILD_CHANGES = [
  'Every cable is checked as you run it: the engine accepts it at its level, or refuses it with the reason — the wrong level, a full input, a loop.',
  'A loudspeaker lights LIVE only when an unbroken path of valid links runs to it from a source.',
];

function capstone(
  n: number,
  venue: string,
  build: string,
  teaches: string,
  tryThis: string[],
  routing = false,
): ScreenGuide {
  return {
    seeing: [
      `Capstone ${n}: ${venue} The plot shows the venue in plan, deck at the top.`,
      build,
      'Readouts: PLACED, CABLES, LIVE and REQS; the checklist fills itself in as you build.',
    ],
    control: routing
      ? [...BUILD_CONTROL.slice(0, 3), 'CONSOLE: route it — ▲/▼ step a level, PRE lights the pre-fader tap; the buses show who hears what.']
      : BUILD_CONTROL,
    changes: [
      BUILD_CHANGES[0],
      routing
        ? 'Each requirement ticks the moment the plot or the console meets it; REQS reads PASS when every one is met.'
        : 'Each requirement ticks the moment the plot meets it; REQS reads PASS when every one is met.',
    ],
    teaches: [teaches, 'BUILD comes after LEARN’s chapters; a capstone passed stays credited even if you change the build later.'],
    tryThis,
  };
}

export const SS_BUILD_GUIDES: Record<string, ScreenGuide> = {
  'The empty venue': {
    seeing: [
      'An empty venue in plan — the deck and its riser at the top, wings either side, the audience below — and every part in the catalog.',
      'The cable legend colors each link by its level: mic, line, speaker, digital, wireless.',
      'Readouts: PLACED, CABLES, LIVE and SILENT (loudspeakers with no path from a source).',
    ],
    control: BUILD_CONTROL,
    changes: BUILD_CHANGES,
    teaches: [
      'How a system goes together link by link, and why a placed loudspeaker can still be silent.',
      'The first BUILD page; the ten capstones that follow are graded builds.',
    ],
    tryThis: [
      'Place a vocal mic, a console and a powered loudspeaker, then cable mic → console → loudspeaker: LIVE goes to 1.',
      'Try to cable the mic straight to the loudspeaker and read the refusal.',
    ],
  },
  'Capstone 1 · Speech system': capstone(
    1,
    'a meeting room for sixty, one presenter.',
    'Bin: a vocal mic, a console, powered loudspeakers and power. The checklist asks for a mic, a console, mains left and right, every box live, everything through the console.',
    'The simplest complete system — and every rule of the larger ones is already in it.',
    [
      'Place the mic, the console and a powered box at main left AND main right, then cable them through the console.',
      'Select a main and open OUTPUT: give it MAIN L or MAIN R (or MAIN MONO into both).',
    ],
  ),
  'Capstone 2 · Small mono music system': capstone(
    2,
    'a café corner, a singer with guitar, plus a backing track.',
    'Bin: vocal mic, instrument mic, DI, playback, console, a powered loudspeaker and a powered sub. ONE box at the center main position, a sub under it — no left/right pair.',
    'Why a single loudspeaker position covers a narrow room better than two fighting each other.',
    [
      'Put the single box at the center main position and the sub at the center sub position.',
      'Give the center box MAIN MONO, and the sub MAIN MONO, AUX 6 or MTX 1 · SUBS.',
    ],
  ),
  'Capstone 3 · 2.1 with a dedicated subwoofer output': capstone(
    3,
    'a DJ night in a bar, playback only.',
    'Bin: playback, a wireless receiver, a console, powered tops and a powered sub. For THIS build the sub takes its own console output and the tops are fed direct.',
    'How a dedicated sub output turns the bass level into a fader move at the console.',
    [
      'Cable the sub from the console on its own link, not through a top.',
      'Give the sub AUX 6 or MTX 1 · SUBS, and the tops MAIN L and MAIN R (or MAIN MONO into both).',
    ],
  ),
  'Capstone 4 · Stereo band system with subwoofers': capstone(
    4,
    'a 300-capacity club, a four-piece band.',
    'Bin: stage sources, stagebox, console, processor, amplifiers, passive tops and subs. Every main and sub goes THROUGH the processor; every passive box needs an amplifier.',
    'Where crossover and limiting live, and why passive cabinets put the amplifiers in your hands.',
    [
      'Run console → processor → amplifier → passive box for one side first, and watch it go LIVE.',
      'Try to cable the console straight to a passive top and read why it is refused.',
    ],
  ),
  'Capstone 5 · Digital stagebox and networked audio': capstone(
    5,
    'a festival side stage with a long run to front of house.',
    'Every source into the stagebox, ONE network link to the console, the outputs back down the same link to leave the stagebox. No analog snake.',
    'How a digital stagebox carries every channel both ways on one link.',
    [
      'Cable every source into the stagebox — none straight to the console.',
      'Feed the processor from the stagebox, not from the console, and watch the returns requirement tick.',
    ],
  ),
  'Capstone 6 · Band with four monitor mixes': capstone(
    6,
    'a theater stage, four musicians who each want something different.',
    'Four wedges in the four monitor positions plus a main pair. Then the console: something sent to each of Aux 1–4, every monitor send PRE-fader.',
    'How each wedge gets its own aux mix, and why monitor sends are pre-fader.',
    [
      'Place the four wedges, give each a different monitor aux with OUTPUT, then open CONSOLE.',
      'In CONSOLE, step up a send on each of Aux 1–4 and light PRE on every one.',
    ],
    true,
  ),
  'Capstone 7 · Subgroups and effects': capstone(
    7,
    'the same theater, mixed properly.',
    'A working system first, then the console: drums on the DRUMS subgroup reaching the main mix, both vocals sent POST-fader to Aux 5 (reverb), every band channel on the BAND DCA.',
    'Subgroups (audio sums), post-fader effect sends and DCAs (remote fader control) working together.',
    [
      'In CONSOLE, put kick, snare and overheads on the DRUMS subgroup and check the subgroup still reaches the main mix.',
      'Send both vocals to Aux 5 and make sure PRE is OFF: an effect send follows the fader.',
    ],
    true,
  ),
  'Capstone 8 · Matrices for mains, fills and lobby': capstone(
    8,
    'a conference hall with front fills and a lobby overflow.',
    'Mains, front fills and subs placed and live. On the console: Matrix 2 (fills) and Matrix 1 (subs) take MAIN; Matrix 3 (lobby) takes MAIN plus Aux 7, with the announce mic sent to Aux 7.',
    'How matrices build extra outputs from the finished mix, each with its own level.',
    [
      'Give the front fills MTX 2 · FILLS and the subs MTX 1 · SUBS with OUTPUT, then set those matrices to take MAIN in CONSOLE.',
      'Send the announce mic to Aux 7 and let Matrix 3 take AUX 7 as well as MAIN.',
    ],
    true,
  ),
  'Capstone 9 · Outdoor system with front fills and delays': capstone(
    9,
    'a park stage for two thousand, ninety meters deep.',
    'Mains, subs, front fills and delay loudspeakers left and right — ALL through the processor, every passive box amplified.',
    'Why fills and delays go through the processor: alignment is what makes six boxes one system.',
    [
      'Place the delay towers, then cable them from the processor rather than straight from the console.',
      'Read the outputs requirement and give each front fill MTX 2 · FILLS, MAIN MONO or its own side’s main.',
    ],
  ),
  'Capstone 10 · Festival-style complete system': capstone(
    10,
    'a main stage with mains, subs, monitors and a recording feed.',
    'Everything at once: stagebox, processor, mains and subs, four wedges, in-ears. On the console: four pre-fader mixes, in-ears on Aux 8, Matrix 4 recording, Aux 6 with only kick, bass and keys.',
    'How every earlier capstone combines into one complete system.',
    [
      'Build the PA side first (stagebox, processor, amplifiers, mains, subs), then the stage side, then open CONSOLE.',
      'In CONSOLE, check Aux 6: kick, bass and keys only — no vocal in the subs.',
    ],
    true,
  ),
};

/* ── ROUTE (8 pages) ─────────────────────────────────────────────────────── */

export const SS_ROUTE_GUIDES: Record<string, ScreenGuide> = {
  'Anatomy of a channel': {
    seeing: [
      'One channel strip drawn top to bottom in signal order. The sends leave as copies at the PRE and POST tap points; the main path ends at the assignment.',
      'Readouts: STATION, AUDIO (THROUGH, A COPY or THE PATH) and SEEN. The notes show the same channel on the console model, read-only.',
    ],
    control: [
      'STATION: ride THE CHANNEL, TOP TO BOTTOM — input and preamp, high-pass filter, EQ, insert, fader, pan and mute, aux sends, assignment, direct output — or tap a block.',
    ],
    changes: [
      'AUDIO tells you what each block does to the signal: THROUGH (the whole channel passes it), A COPY (a send or direct out), or THE PATH (where the main path goes).',
    ],
    teaches: [
      'Insert = through, send = copy, assignment = where the main path goes — four words that end most routing confusion.',
      'The first ROUTE page; pre- and post-fader sends come next.',
    ],
    tryThis: [
      'Ride STATION from Input and preamp down to Assignment and say THROUGH, A COPY or THE PATH before AUDIO does.',
      'Open the Fader, pan and mute block and read what this console’s MUTE does to pre-fader sends.',
    ],
  },
  'Pre-fader and post-fader': {
    seeing: [
      'The vocal channel and three buses: AUX 1 · SINGER’S WEDGE, AUX 5 · REVERB and MAIN MIX, each showing what it hears.',
      'Both sends start tapped the WRONG way round. Readouts: FADER, WEDGE HEARS, REVERB HEARS and MAIN.',
    ],
    control: [
      'VOX FADER: the lead vocal’s fader, −60 to +10 dB.',
      'WEDGE TAP and FX TAP: PRE-fader or POST-fader for each send.',
      'CONSOLE: the vocal’s fader, MUTE and the two sends with their PRE switches.',
    ],
    changes: [
      'A PRE-fader send takes its copy before the fader, so the house fader cannot move it. A POST-fader send follows every fader move.',
      'On this console the channel MUTE also silences its pre-fader sends.',
    ],
    teaches: [
      'Why monitor sends are pre-fader and effect sends post-fader.',
      'ROUTE page 2; the monitor-mix page uses pre-fader sends on every channel.',
    ],
    tryThis: [
      'Before changing anything, pull VOX FADER to −20 dB: WEDGE HEARS drops with it and REVERB HEARS stays put — backwards.',
      'Set WEDGE TAP to PRE and FX TAP to POST, then pull the fader down again and watch which bus moves now.',
    ],
  },
  'Subgroup, aux, matrix or DCA?': {
    seeing: [
      'Eight situations from real shows, each with the routing tools to choose from.',
    ],
    control: [
      'Tap the tool that fits each situation; a wrong answer explains why it fails. Try again until it is right.',
    ],
    changes: [
      'A correct answer locks the card and explains the job that tool does.',
    ],
    teaches: [
      'Which console tool to reach for: an aux for a new mix, a subgroup to sum audio, a matrix to feed from finished buses, a DCA to move faders by remote.',
      'ROUTE page 3, between the send pages and the console exercises.',
    ],
    tryThis: [
      'For each situation, ask first: does the job need audio to pass through the tool?',
      'Then ask: should it follow the house mix or ignore it?',
    ],
  },
  'Four monitor mixes': {
    seeing: [
      'Four wedge buses — W1 · SINGER, W2 · GUITAR, W3 · BASS and W4 · DRUMS — each listing who it hears.',
      'Readouts: CHANNEL, SEND, TAP and WEDGES ≥2 (how many wedges hear at least two channels).',
    ],
    control: [
      'CHANNEL: pick a channel.',
      'SEND: ride the lane; its key opens TO WHICH WEDGE.',
      'PRE: tap it to light the pre-fader tap.',
      'CONSOLE: the whole desk — ▲/▼ step a send, PRE lights its tap, ALL PRE sets a whole column.',
    ],
    changes: [
      'Each send you raise appears on its wedge’s bus at that level.',
      'With PRE lit, the house faders never reach into a performer’s mix.',
    ],
    teaches: [
      'How four performers get four different mixes from one console.',
      'ROUTE page 4; BUILD’s Capstone 6 asks for the same on a plot.',
    ],
    tryThis: [
      'Give W1 · SINGER the lead vocal and a little keys, as the notes suggest, and light PRE on both.',
      'Open CONSOLE and use ALL PRE on each wedge column.',
    ],
  },
  'Subgroups and DCAs': {
    seeing: [
      'Three buses: DRUMS SUBGROUP, MAIN MIX and AUX 4 · DRUMMER.',
      'Readouts: KICK → MAIN, KICK → WEDGE, BAND DCA and DRUMS GRP.',
    ],
    control: [
      'BAND DCA: the DCA’s level, −60 to +10 dB.',
      'CONSOLE: three drum channels and the bass — tap GROUP to cycle a channel into DRUMS (and off L/R), tap DCA to hang it on BAND.',
    ],
    changes: [
      'A subgroup carries audio: the channels sum in it and its fader scales the sum.',
      'A DCA carries none: it moves each member’s fader by remote, so anything tapped before the fader — the drummer’s wedge — never meets it.',
    ],
    teaches: [
      'The difference between a subgroup and a DCA, proved on the buses.',
      'ROUTE page 5; BUILD’s Capstone 7 uses both.',
    ],
    tryThis: [
      'In CONSOLE route kick, snare and overheads into DRUMS, then check DRUMS GRP reads → L/R.',
      'Hang the kick on BAND and ride BAND DCA to −10 dB: KICK → MAIN drops, KICK → WEDGE does not.',
    ],
  },
  'Mute groups, solo and direct outs': {
    seeing: [
      'The main bus, labeled MAIN MIX — WHO IS STILL LIVE.',
      'Readouts: BAND MUTE, MAIN HEARS (how many channels), STILL LIVE and CHECK.',
      'The notes explain solo, PFL and AFL, inserts and direct outs, and hold one question.',
    ],
    control: [
      'BAND MUTE: one button that mutes every band channel.',
      'ALL MICS: a second mute group for every microphone.',
    ],
    changes: [
      'BAND MUTE closes every channel assigned to it; the announce mic and the playback are not in it, so they stay live — STILL LIVE reads MC · PB.',
      'Releasing it brings the band back exactly as set.',
    ],
    teaches: [
      'How mute groups change a scene in one press, and which solo hears what.',
      'ROUTE page 6; matrices come next.',
    ],
    tryThis: [
      'Press BAND MUTE: MAIN HEARS drops to 2 CH and STILL LIVE reads MC · PB.',
      'Press ALL MICS as well and see which channel is still live.',
    ],
  },
  'Matrix outputs': {
    seeing: [
      'Three matrix buses: MX 2 · FRONT FILLS, MX 3 · LOBBY and MX 4 · RECORDING, each listing what reaches it.',
      'Readouts: FILLS TAKE, LOBBY TAKES, REC TAKES and MC → AUX 7.',
    ],
    control: [
      'MC → AUX 7: the announce mic’s send to Aux 7, an aux kept for this so no wedge hears it.',
      'MATRICES: tap a crosspoint to cycle it off → 0 dB → −6 dB.',
      'CONSOLE: the announce mic, the vocal and the kick, with their L/R and Aux 7 cells.',
    ],
    changes: [
      'A matrix mixes finished BUSES into a further output with its own level, so the fills, lobby and recorder follow every house move.',
      'The lobby takes MAIN plus AUX 7, so the announce mic arrives there twice: louder than the rest.',
    ],
    teaches: [
      'Why the matrix is the post-main tool for fills, overflow rooms and recordings.',
      'ROUTE page 7; output patching comes last.',
    ],
    tryThis: [
      'In MATRICES give Matrix 2 and Matrix 4 MAIN and watch FILLS TAKE and REC TAKES read MAIN.',
      'Ride MC → AUX 7 up, then let Matrix 3 take MAIN and AUX 7.',
    ],
  },
  'Output patching': {
    seeing: [
      'The stagebox’s seven line outputs, each with the bus tape above its socket and the destination its cable runs to. Nothing is patched yet.',
      'Readouts: SOCKET, FED FROM and PATCHED.',
    ],
    control: [
      'SOCKET: ride THE STAGEBOX’S LINE OUTPUTS, or tap a socket on the panel.',
      'BUS: pick what that socket carries — Main L, Main R, Aux 1, Aux 2, Aux 6, Matrix 2 or Matrix 3.',
    ],
    changes: [
      'FED FROM turns green for the right bus and red for a wrong one, and the socket says why: a wedge takes its own aux, aux-fed subs the sub aux, fills a matrix.',
    ],
    teaches: [
      'That every output must leave the right socket — a main output into a wedge amplifier puts the house mix in the singer’s wedge.',
      'The last ROUTE page; BUILD wires a whole venue the same way.',
    ],
    tryThis: [
      'Patch Main L into the Wedge 1 amplifier on purpose and read the socket’s note, then fix it.',
      'Patch all seven correctly and read the reminder to write the patch list down.',
    ],
  },
};

/* ── OPERATE (5 pages) ───────────────────────────────────────────────────── */

export const SS_OPERATE_GUIDES: Record<string, ScreenGuide> = {
  'Power-up sequence': {
    seeing: [
      'The system with everything dark: stage devices, console, processor, amplifiers and loudspeakers. Each device lights (● ON) when you switch it on.',
      'Above the notes, POWER UP · YOUR ORDER lists your steps. Readouts: STEPS, LAST, ORDER and LIT.',
    ],
    control: [
      'STEP: tap the steps in the order you choose.',
      'RESET (once you have started) clears your order.',
    ],
    changes: [
      'A step out of order turns ORDER to WRONG and names the step it must come after.',
      'In the right order, every turn-on thump happens into a system that cannot pass it to a loudspeaker: the amplifiers wake last, into silence.',
    ],
    teaches: [
      'The power-up order and the reason for it: sources and console first, amplifiers last.',
      'The first OPERATE page; it follows LEARN’s deployment sequence.',
    ],
    tryThis: [
      'Tap Verify routing — amps OFF, then Amps and powered boxes — LAST: ORDER reads WRONG. Read why, RESET, and go again.',
      'Before each tap, ask which device would be listening if this one thumped.',
    ],
  },
  'Line check': {
    seeing: [
      'Two strips of LEDs: the processor outputs above and the stagebox inputs below. Each probe reveals two readings.',
      'Readouts: LINE, then STAGEBOX LED (LIT or DARK) and CH METER (MOVING or FLAT) on an input, or PROC OUT (SIGNAL or NONE) and RIGHT FEED (YES or NO) on an output, then MARKED.',
    ],
    control: [
      'LINE: ride OUTPUTS FIRST, THEN EVERY INPUT.',
      'PROBE: read the selected line.',
      'MARK OK or MARK FAULT: your verdict.',
    ],
    changes: [
      'On an input: LED lit but meter flat = the input patch; LED dark = the cable or the source. On an output: signal present but the wrong feed plays = the output patch.',
      'A wrong mark says “Read it again”; three of these lines are faults.',
    ],
    teaches: [
      'How a line check tests the system one path at a time, outputs first, before the band arrives.',
      'OPERATE page 2; gain structure comes next.',
    ],
    tryThis: [
      'Probe Ch 5 · Keys DI: STAGEBOX LED LIT, CH METER FLAT. Decide what that pattern means before you mark it.',
      'Probe Ch 7 · Backing vocal: the LED stays DARK. Which part of the path is left?',
    ],
  },
  'Establish gain structure': {
    seeing: [
      'The gain chain, one meter per stage. The preamp is cranked: the first CLIP indicator lights there and every later meter carries the ↑ of inherited distortion.',
      'Readouts: AT SPEAKER, ABOVE NOISE, HEADROOM and VERDICT.',
    ],
    control: [
      'The lane starts on PREAMP. Tap its key (WHICH STAGE) for FADER, MAIN, PROC IN, PROC OUT or AMP; double-tap the lane for that stage’s unity (AMP’s mark is −18).',
    ],
    changes: [
      'Turning a later stage down only makes the clipped signal quieter — the distortion happened at the preamp.',
      'The amplifier’s input attenuator at −18 makes the amplifier the last stage to clip.',
    ],
    teaches: [
      'How a whole system is set from microphone to loudspeaker: preamp first, unity through the middle, headroom at every stage.',
      'OPERATE page 3 — the opposite fault from LEARN’s gain chapter.',
    ],
    tryThis: [
      'Bring PREAMP to +40 dB and FADER and MAIN to 0, leaving AMP at 0: VERDICT still reads CLIPPING — now at the amplifier.',
      'Set PREAMP to +35 dB and AMP to −18: VERDICT OK, HEADROOM 15 dB, AT SPEAKER −13 dBu.',
    ],
  },
  'Ring-out and soundcheck': {
    seeing: [
      'The stage shows the wedge you picked, with its microphone’s pattern. Three wedges start in the live angle; Wedge 3 · Bass is already in the null.',
      'The bezel shows each wedge’s send — W1 SINGER, W2 GUITAR, W3 BASS and W4 DRUMS — with a ! while it rings.',
    ],
    control: [
      'WEDGE: pick one.',
      'SEND: −30 to +6 dB to that wedge.',
      'POSITION: In the live angle or In the null.',
      'NOTCH: cut the frequency that rings.',
    ],
    changes: [
      'A wedge in the live angle rings 12 dB sooner in this model; the null buys those 12 dB back, a notch buys 4 more.',
      'Every wedge starts at −18 dB. The goal is every wedge at −6 dB or louder with none ringing.',
    ],
    teaches: [
      'The ring-out order: reposition first, notch only what rings, then set the level.',
      'OPERATE page 4; LEARN’s feedback chapter uses the same model.',
    ],
    tryThis: [
      'Pick Wedge 1 · Singer and raise SEND to −6 dB: it rings. Set POSITION to In the null: it stops, with 6 dB of margin.',
      'On a live-angle wedge at −6 dB, try NOTCH alone: it still reads RINGING — 2 dB over. A notch buys only 4 dB.',
    ],
  },
  'Shutdown and documentation': {
    seeing: [
      'The system with everything on. Each device goes dark (○ OFF) when you switch it off.',
      'POWER DOWN · YOUR ORDER lists your steps. Readouts: STEPS, LAST, ORDER and DARK.',
    ],
    control: [
      'STEP: tap the power-down steps in order.',
      'DOCUMENT: tick off the five things to write down — the console scene, the processor preset, the input and output patch lists, loudspeaker positions and delay times.',
      'RESET clears your order.',
    ],
    changes: [
      'Power-down is the mirror of power-up: mute the outputs, then amplifiers FIRST, so nothing switched off later can thump through a live amplifier.',
    ],
    teaches: [
      'The power-down order, and why documenting the show is part of the job.',
      'The last OPERATE page.',
    ],
    tryThis: [
      'Start with Console — save first: ORDER reads WRONG. Read why, RESET and begin with Mute the outputs.',
      'Open DOCUMENT and tick all five before you leave.',
    ],
  },
};

/* ── TROUBLESHOOT (the bench intro + five fault groups) ──────────────────── */

function faultGroup(title: string, blurb: string, sample: string): ScreenGuide {
  return {
    seeing: [
      `${title}: ${blurb}`,
      'With no case open, the notes list the faults (○ unsolved, ✓ solved, ✓✓ solved with a source-forward walk). With a case open, the map shows its nine stations and the notes its symptom.',
      'Readouts: CASE, PROBED, READS and GRADE.',
    ],
    control: [
      'CASE: put a fault on the bench (or tap one in the list).',
      'PROBE: read a station (or tap it on the map); each probe shows what a technician would read there.',
      'FAULT: name the fault once you have read where it changes.',
      'RESET clears the probes; BENCH returns to the list.',
    ],
    changes: [
      'The symptom clears everything before the starting station. Each probe colors that station by its reading; the first reading that is not healthy marks the fault.',
      'GRADE: ✓ for the right diagnosis, ✓✓ when every probe also went forward. A probe backward is recorded, but not as a forward walk.',
    ],
    teaches: [
      `How faults in this group show themselves, and how the source-forward walk finds them — ${sample}`,
      'TROUBLESHOOT builds on LEARN’s last chapter, the source-forward method.',
    ],
    tryThis: [
      'Open a case, read the symptom, and probe the starting station first.',
      'Name the fault only after a reading changes, then compare your probe count with the minimum in the verdict.',
    ],
  };
}

export const SS_TROUBLESHOOT_GUIDES: Record<string, ScreenGuide> = {
  'How the bench works': {
    seeing: [
      'A worked example on the bench map: the symptom cleared the first three stations, the console input and output read OK, the processor reads NO SIGNAL.',
      'Below: twenty-two faults in five groups, how a walk starts, and what ✓ and ✓✓ mean.',
    ],
    control: [
      'Nothing to operate here — read it, then NEXT opens the first fault group.',
    ],
    changes: [
      'In the example the walk stopped at the first reading that changed: that station is the answer.',
    ],
    teaches: [
      'How the bench grades you: the right diagnosis, and a disciplined walk from where the symptom leaves doubt.',
      'The first TROUBLESHOOT page; it applies LEARN’s source-forward method.',
    ],
    tryThis: [
      'In the example, point to the station where the reading changes, then check it against the sentence above the map.',
      'Say where a walk should start for “one vocal is dead, the band is fine”.',
    ],
  },
  'Dead signal': faultGroup('Dead signal', 'nothing, or nothing from one place. The walk finds where the signal stops.', 'a station that reads NO SIGNAL right after one that reads OK.'),
  'Level, noise and distortion': faultGroup('Level, noise and distortion', 'it plays, but wrong: clipping, hum, squash, a rattle.', 'the station where clean turns dirty.'),
  Routing: faultGroup('Routing', 'the signal exists and arrives somewhere — just not where it should.', 'usually the console, sending to the wrong place.'),
  'Time, polarity and crossover': faultGroup('Time, polarity and crossover', 'everything is present; the pieces disagree with each other.', 'the processor and the loudspeakers are the stations to read.'),
  'Digital, network and acoustic': faultGroup('Digital, network and acoustic', 'clicks, dropouts or a ring.', 'solved by discipline, not by swapping boxes.'),
};

/** The guide for page `index` of a mode, by the page's title (the check page
 *  appended to LEARN has its own guide). */
export function ssGuideFor(guides: Record<string, ScreenGuide>, titles: readonly string[], index: number, withCheck = false): ScreenGuide | undefined {
  if (withCheck && index === titles.length) return SS_CHECK_GUIDE;
  const t = titles[index];
  return t == null ? undefined : guides[t];
}
