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
import type { ScreenGuide, ScreenIntro } from '../../../features/lab/screenGuide/types';

/* ── the hub ─────────────────────────────────────────────────────────────── */

export const SS_HUB_GUIDE: ScreenGuide = {
  intro: {
    learning: 'How a complete live sound system fits together, seen five ways: what each part does, how it’s assembled, how signal is routed, how it’s run, and how faults are found.',
    start: 'Tap the LEARN card first: its opening page puts the whole system on one map. Then glance at WHAT IS LEFT below the cards to see what you haven’t finished yet.',
  },
  seeing: [
    'This is the Sound Systems Lab home. It builds on the cable, gain and speaker labs. Each of the five mode cards has its own progress bar.',
    'LEARN explains the system chapter by chapter. BUILD, ROUTE, OPERATE and TROUBLESHOOT put the same ideas in your hands.',
    'WHAT IS LEFT lists what you haven’t finished, with the UNDERSTANDING CHECK (the last page of LEARN) at the bottom.',
  ],
  control: [
    'Tap a mode card to open that mode where you left it. You can take the modes in any order.',
    'Tap a row in WHAT IS LEFT to jump straight to that mode.',
    'Tap START OVER (PRACTICE) to send every mode back to its first page for another run. Nothing you’ve finished is lost: completed pages, capstones, exercises and faults stay done.',
  ],
  changes: [
    'Each card’s bar fills as you finish its pages, capstones, exercises or faults, and each mode remembers your place when you come back.',
    'A mode’s row leaves WHAT IS LEFT once you complete it. The UNDERSTANDING CHECK row stays and gets a ✓ once you pass it. When everything is done, the panel turns green and reads SOUND SYSTEMS LAB — COMPLETE.',
  ],
  teaches: [
    'A live sound system makes sense in five layers: what each part does, how the parts connect, how the console routes signal, how the system is run on show day, and how faults are traced.',
    'All five layers follow the same signal path, from source to listener, so what you learn in one carries straight into the next.',
  ],
  tryThis: [
    'Start with LEARN: its first page is the whole system on one map, and every later mode refers back to it.',
    'After a few LEARN chapters, open BUILD, place a source, a console and a loudspeaker on the empty venue, and cable them until the loudspeaker goes LIVE.',
  ],
};

/* ── the what's-left screen (every mode, after FINISH) ───────────────────── */

export const SS_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'Which parts of this mode’s view of the live system you’ve explored, and which links in the source-to-listener chain you haven’t met yet.',
    start: 'Tap the first page still listed to jump straight to it. Or tap REVIEW ▾ on the ✓ line and reopen a page you’ve finished.',
  },
  seeing: [
    'You’ve reached the end of this mode. The title reads WHAT\'S LEFT, or LAB COMPLETE once every page is done.',
    'Pages you haven’t finished are listed by name. The pages you have finished fold into one ✓ line.',
  ],
  control: [
    'Tap a page that is still listed to jump straight to it.',
    'Tap REVIEW ▾ on the ✓ line to unfold your finished pages, then tap any one to open it again.',
    'PRACTICE AGAIN FROM THE START takes you back to page 1. It clears nothing.',
    'DONE · BACK TO SOUND SYSTEMS returns you to the lab’s home, where WHAT IS LEFT covers all five modes.',
  ],
  changes: [
    'A page joins the ✓ line once you meet its goals, shown by the goal chips in its notes. A summary page counts as soon as you open it.',
    'In LEARN, the check counts only when you’ve answered every question correctly.',
  ],
  teaches: [
    'A live system works only when every link from source to listener is in place: no link can work until the ones before it pass the signal on.',
    'The same signal path looks different from each side — parts, assembly, routing, operation, faults — and each view makes the others clearer.',
  ],
  tryThis: [
    'Jump to the first page still listed and read its LAB NOTES before you touch a control.',
    'Open REVIEW ▾, pick one finished page and say out loud what it showed about the signal path. Then open it and check yourself.',
  ],
};

/* ── LEARN (22 pages + the check) ────────────────────────────────────────── */

export const SS_LEARN_GUIDES: Record<string, ScreenGuide> = {
  'The complete system': {
    intro: {
      learning: 'What each part of a live sound system does, and the order signal passes through them: source, stage input, console, processing, amplification, loudspeaker, listener.',
      start: 'Ride STATION along the path and read each card’s IN and OUT. Then switch STAGE IN to Digital stagebox and HOUSE to Powered boxes, and watch which parts change.',
    },
    seeing: [
      'The whole system on one map, in three columns read top to bottom: STAGE, CONSOLE · RACKS and LOUDSPEAKERS. Where a cable crosses columns, one section hands the signal on.',
      'LEDs chase along the cables like a program playing. The card above the notes shows your station: what it takes IN, sends OUT, comes FROM and goes TO.',
      'STAGE IN and HOUSE show your two choices; STATION names the part you’re on.',
    ],
    control: [
      'Ride STATION along the signal path, or tap any station on the map, to see what it does.',
      'STAGE IN: Analog snake (a multicore cable carries every mic to the console at mic level) or Digital stagebox (the preamps sit on stage, and one network cable carries audio both ways).',
      'HOUSE: Passive + amps (processor → amplifiers → passive boxes, which have no amplifier of their own) or Powered boxes (the amplifier is inside the cabinet).',
      'Open LAB NOTES for the chapter text and the goal chips that show what this page asks of you.',
    ],
    changes: [
      'Switching STAGE IN or HOUSE redraws the map, but the ORDER never changes: source → stage input → console → processing → amplification → loudspeaker → listener.',
      'A powered box folds the amplifier into the loudspeaker, and a stagebox turns the snake into a network link. Every job still happens; only its place moves.',
    ],
    teaches: [
      'Every live system does the same jobs in the same order: pick up the sound, bring it to the console, process it, amplify it, and turn it back into sound for the listener.',
      'Choices like a digital stagebox or powered boxes change where a job happens, not whether it happens.',
    ],
    tryThis: [
      'Switch STAGE IN between Analog snake and Digital stagebox: the hand-off to the console reads MULTICORE or NETWORK. Tap the Snake, then the Stagebox, and compare their OUT lines.',
      'Set HOUSE to Powered boxes: Processor and Amps leave the map, and the console feeds the Powered tops (MAIN L/R) and the Powered sub (SUB OUT) directly.',
      'Tap the listener: the one station that cannot be replaced, moved or re-patched. Every other choice serves this one.',
    ],
  },
  'Trace the signal': {
    intro: {
      learning: 'The fixed order a signal travels through a live system, source to listener, and why no station can work until everything before it has passed the signal on.',
      start: 'Open NEXT and tap the station the signal reaches first, then the next one, in order. Watch THREAD: it stays OK while you follow the real path.',
    },
    seeing: [
      'You’re looking at the nine stations of the house path. Each stays dark until you light it.',
      'LIT counts the stations you’ve lit, LAST names the one you lit last, and THREAD reads OK, WRONG or COMPLETE.',
      'Once THREAD reads COMPLETE, the LEDs chase along the path as the program flows.',
    ],
    control: [
      'Open NEXT and tap the station the signal reaches next. The list stays open, so you can tap the whole path in a row.',
      'RESET appears once something is lit. Tap it to clear the thread and start again.',
    ],
    changes: [
      'Tap a station out of order and THREAD turns WRONG. The note tells you why: the signal hasn’t reached that station yet.',
      'Tap them in order and each station lights; the ninth one completes the thread.',
    ],
    teaches: [
      'Signal travels in one fixed order, source to listener. Each station can only pass on what the station before it handed over.',
      'That order is also the walk a technician makes on every fault: follow the signal and check each station in turn.',
    ],
    tryThis: [
      'Tap Source, then jump to Amplifier: THREAD turns WRONG. Read the note, RESET and go in order.',
      'Light all nine in order and watch THREAD read COMPLETE as the LEDs start to chase.',
    ],
  },
  'Ten kinds of system': {
    intro: {
      learning: 'Why venues need different kinds of live sound system, and how each kind is the right answer in some places and the wrong one in others.',
      start: 'Ride TYPE through TEN KINDS OF SYSTEM. For each one, see where the beams land on the floor, then read WHEN and NOT WHEN on the card.',
    },
    seeing: [
      'You’re looking down on one system, stage at the top, with its name and scale above it.',
      'The beams show where each box (loudspeaker cabinet) stands and which part of the floor it covers.',
      'The card below gives the system’s chain, WHEN it’s the right answer and NOT WHEN. TYPE names the system and BOXES counts its loudspeakers.',
    ],
    control: [
      'Ride TYPE through TEN KINDS OF SYSTEM, or open the list and pick one. Each entry says whether it is CHOSEN BY THE VENUE or A WAY TO BUILD ANY OF THEM.',
    ],
    changes: [
      'Each type redraws the plan with its own boxes and positions, and BOXES counts them.',
      'Most types are set by the venue, from a small powered PA to a large line array. The others are ways any of them can be built out, such as passive boxes with external amplifiers.',
    ],
    teaches: [
      'Systems differ by WHEN they are right, not just by what is in the case. The venue’s size, shape and use come first.',
      'Some choices, like passive boxes with external amplifiers, aren’t a kind of system at all: they’re a way to build any kind.',
    ],
    tryThis: [
      'Compare the Large-format line-array system with the Distributed loudspeaker system: one big source flown high, or many small ones close to the listeners.',
      'Read NOT WHEN on the Small powered-loudspeaker PA, then on the Outdoor performance system. What does each one run out of?',
    ],
  },
  'Match the venue': {
    intro: {
      learning: 'How a venue’s size, use and audience decide which kind of live sound system it needs, before any single loudspeaker is chosen.',
      start: 'Read the first venue card’s brief and decide what its size and use rule out. Then tap the system you would carry in, and read the explanation.',
    },
    seeing: [
      'Each of the eight venue cards gives a short brief and four systems to choose from.',
      'The goal chip at the top fills once you’ve matched every venue.',
    ],
    control: [
      'Tap the system you would carry in for each venue. The first wrong pick asks you to try again; from the second miss on, the explanation shows. Try until it is right.',
    ],
    changes: [
      'Each answer shows why that system does or doesn’t suit the venue. A correct one locks the card with a ✓.',
    ],
    teaches: [
      'A venue’s size, use and audience decide the kind of system. That choice comes before any box is chosen.',
      'The same system can be right in one room and wrong in the next, so the brief, not the gear list, drives the decision.',
    ],
    tryThis: [
      'Before you tap, say out loud what the room’s size and use rule out.',
      'After each answer, read the explanation and say which detail of the venue decided it.',
    ],
  },
  'Output configurations': {
    intro: {
      learning: 'The ways a console’s outputs can feed a room, from mono to stereo, LCR and separate subs, and what each one gains or costs.',
      start: 'Ride CONFIG through THIRTEEN OUTPUT CONFIGURATIONS. For each one, find the hatched floor where two boxes overlap, and read FEEDS and SUBS.',
    },
    seeing: [
      'One output configuration from above. Each box shows its coverage sector (edge = −6 dB), a tag for what it carries, and where it lands.',
      'Hatched floor is where two arrivals overlap and comb-filter (see Wave Physics): arriving at slightly different times, they cancel some frequencies and boost others. A seam marks a pair’s middle.',
      'CONFIG names it; POSITIONS, FEEDS and SUBS (NONE, MONO or STEREO) describe it.',
    ],
    control: [
      'Ride CONFIG through THIRTEEN OUTPUT CONFIGURATIONS, from Mono to Lobby, recording and broadcast feeds.',
      'Open the notes to see each feed and the console bus that carries it (BUSES).',
    ],
    changes: [
      'Each configuration changes which console outputs exist and where they land. Stereo splits left and right, LCR adds a center box for the voice, and a separate sub output lets you set the low end on its own.',
    ],
    teaches: [
      'A console’s outputs can reach a room in many ways, and each buys something: stereo width, a clear center voice, or bass set separately.',
      'Each also costs something: more boxes, more feeds, and more floor where two arrivals overlap and comb-filter.',
    ],
    tryThis: [
      'Compare Stereo with LCR (left, center, right) and look at where the center box lands: in the middle, where the voice should seem to come from.',
      'Compare Stereo mains with mono subwoofers against Stereo subwoofers: SUBS changes from MONO to STEREO.',
    ],
  },
  'Choose the configuration': {
    intro: {
      learning: 'How a written brief becomes an output configuration: the room and the job decide which outputs you need, not the gear on hand.',
      start: 'Start with the lecture hall: read its brief and tap the configuration you think fits. If it’s wrong, read why, then try another.',
    },
    seeing: [
      'Six briefs: a lecture hall, a musical, a DJ bar, a field, flown main speakers and a conference. Each offers four configurations to choose from.',
    ],
    control: [
      'Tap the configuration that fits each brief. The first wrong answer asks you to try again; from the second miss on, the explanation shows.',
    ],
    changes: [
      'A correct answer shows why: the room or the brief decides, not the gear.',
    ],
    teaches: [
      'A brief turns into an output configuration: the room’s size and shape, what it carries and who must hear it decide which outputs you need.',
      'Delays are extra boxes partway back, timed to the main speakers. A matrix builds a separate feed from the finished mix.',
    ],
    tryThis: [
      'For the outdoor stage, ask what the back rows need that the front rows do not.',
      'For the DJ bar, ask who needs to turn the bass down during the night — and from where.',
    ],
  },
  'The routing map': {
    intro: {
      learning: 'What each console routing tool does with audio: whether it carries sound, adds channels together, makes a copy, or only controls other faders by remote.',
      start: 'Tap Subgroup, then DCA / VCA, and compare their ● and ○ facts. Then open the other four tools and read USE IT FOR and NOT FOR on each.',
    },
    seeing: [
      'Six routing tools sit here as buttons: Main mix bus, Auxiliary send, Subgroup, DCA / VCA, Matrix output and Mute group.',
      'An opened tool shows four facts as ● (yes) or ○ (no): carries audio, sums channels, a copy, remote control. Then it says USE IT FOR and NOT FOR.',
    ],
    control: [
      'Tap each tool to open its card; a ✓ marks the ones you’ve opened.',
    ],
    changes: [
      'Nothing moves here. Each card answers the same two questions: does audio pass THROUGH it, and does it SUM channels or COPY them?',
    ],
    teaches: [
      'A subgroup sums audio; an aux send copies channels into a new mix; a matrix mixes finished buses; a DCA / VCA moves faders by remote and carries no sound.',
      'They’re easy to confuse because several of them change levels. Asking “does audio pass through it?” sorts them out.',
    ],
    tryThis: [
      'Open Subgroup and DCA / VCA side by side: one carries audio, the other only moves faders.',
      'Open Auxiliary send and Matrix output: both make new mixes, from channels or from finished buses.',
    ],
  },
  'Subwoofer feeds': {
    intro: {
      learning: 'Which sources reach a subwoofer depends on how it’s fed, by crossover, aux send or matrix, and that choice also decides who controls the sub level.',
      start: 'Switch FEED between Crossover-fed, Aux-fed and Matrix-fed and watch the blue lines and CONTROL. Then, on Aux-fed, turn VOCAL → SUB on and read VOCAL.',
    },
    seeing: [
      'Six channels sit on the left, the console buses in the middle, and the processor and two cabinets on the right. The title names the feed method.',
      'Blue lines show what reaches the subwoofer.',
      'REACHES says what gets to the sub, CONTROL where its level is set, and VOCAL reads CLEAR, or IN SUBS.',
    ],
    control: [
      'FEED: pick Crossover-fed, Aux-fed or Matrix-fed. Each option says WHEN it fits.',
      'VOCAL → SUB works only on the aux feed. Turn it on to send the vocal to the sub aux by mistake, and see where it ends up.',
    ],
    changes: [
      'Crossover-fed: the processor’s crossover sends everything in the mix below its split point to the sub. Aux-fed: only the channels you send. Matrix-fed: whatever buses the matrix takes.',
      'Send the vocal on the aux feed and VOCAL reads IN SUBS: the singer’s chest booms from the subwoofers. The send is to blame, not the crossover.',
    ],
    teaches: [
      'How a sub is fed decides what reaches it: crossover-fed takes the low end of the whole mix; aux-fed takes only what you send.',
      'It also decides who sets the sub level and from where: a trim at the processor, each channel’s send, or a matrix at the console.',
    ],
    tryThis: [
      'Switch FEED to Aux-fed and turn VOCAL → SUB on: VOCAL reads IN SUBS. Turn it off again.',
      'Compare CONTROL on all three feeds: PROC TRIM on Crossover-fed, PER SEND on Aux-fed, MATRIX on Matrix-fed.',
    ],
  },
  'Subwoofer placement and arrays': {
    intro: {
      learning: 'Why subwoofer placement decides where the bass is even: separated subs add in some places and cancel in others, and delay can keep bass from spilling behind the stage.',
      start: 'Ride LAYOUT from Left / right to Center cluster and watch the blue glow down the middle of the floor. Then try Cardioid stacks and read PATTERN.',
    },
    seeing: [
      'You’re looking down on the venue: the two main speakers and the subs. The blue glow is a rough picture of where the bass is strong, not a measurement of a real room.',
      'SUBS shows how many subs there are. PATTERN shows how they spread their bass (OMNI, CARDIOID or END-FIRE). RIG shows whether they stand on the GROUND or are FLOWN.',
    ],
    control: [
      'Ride LAYOUT through SUBWOOFER ARRANGEMENTS: Left / right, Center cluster, Cardioid stacks, End-fire array and Flown subs.',
      'On each arrangement, compare the glow in front of the subs with the glow behind them, and across the middle of the floor.',
    ],
    changes: [
      'Two subs a room-width apart add down the middle and cancel at some frequencies off to the sides. Low notes have wavelengths meters long, so the gap between subs matters.',
      'Cardioid and end-fire arrays use delay. Cardioid also turns one box backward and flips its polarity. Either way, the glow stays in front of the subs and stops behind them.',
    ],
    teaches: [
      'Sub placement is mostly geometry: fewer separated sources, and boundaries such as the floor and walls used on purpose, give more even bass.',
      'Delay and polarity can steer bass forward, away from the stage behind the subs.',
      'Real rooms add their own modes, so measure before you trust a layout.',
    ],
    tryThis: [
      'Compare Left / right with Center cluster and watch the middle of the floor.',
      'Compare Cardioid stacks with End-fire array and watch where the glow stops behind the stage.',
      'Switch to Flown subs and check RIG. Then look at how the glow covers the floor from overhead.',
    ],
  },
  'Stage monitors': {
    intro: {
      learning: 'Monitors are a second sound system aimed at the performers. Each type, from floor wedge to in-ears, needs its own kind of feed from the console.',
      start: 'Ride MONITOR from Floor wedge to In-ear monitors, or tap a monitor on the stage. Read FED BY for each one.',
    },
    seeing: [
      'You’re looking down on the stage: a wedge at the lip (the front edge), a side fill at the wing, a drum fill beside the drum riser and a performer wearing in-ears.',
      'The card names the monitor you picked and where it stands. FED BY shows which console send drives it; SEEN shows the types you have opened.',
    ],
    control: [
      'Ride MONITOR through THE MONITOR WORLD: Floor wedge, Side fill, Drum fill and In-ear monitors. Or tap a monitor on the stage.',
      'For each one, read the card: where it stands, who it is for, and its FED BY.',
    ],
    changes: [
      'FED BY changes with each type. A wedge or drum fill gets ONE AUX · PRE: one mix, for the player in front of it.',
      'Side fills get a STEREO AUX. In-ears get a STEREO AUX · TX: a stereo mix sent to a transmitter (TX) that carries it to the performer.',
      'PRE means the send is taken before the channel fader.',
    ],
    teaches: [
      'Monitoring is a second sound system pointed at the performers, normally fed pre-fader so the house fader never moves it.',
      'A wedge sits in the microphone’s null, the direction the mic hears least, so it can play louder before feedback.',
      'In-ears seal the ear, so their level reaches the eardrum directly: hearing safety matters most here.',
    ],
    tryThis: [
      'Pick Floor wedge and read why it sits in the microphone’s null.',
      'Pick In-ear monitors and read the warning about level in a sealed ear.',
    ],
  },
  'Monitor console, splits and talkback': {
    intro: {
      learning: 'How one microphone feeds two consoles, front of house and monitors, and why a monitor engineer’s gain change must never change the house mix.',
      start: 'With SPLIT on Analog split, ride MON GAIN to +6 dB and read FOH HEARS. Then switch SPLIT to Digital gain sharing and read it again.',
    },
    seeing: [
      'Three sources feed two consoles: front of house (FOH), where the audience mix is made, and the monitor console at side stage, which makes the performers’ mixes.',
      'SPLIT shows how the signal is shared. MON PREAMP is the monitor engineer’s gain. FOH HEARS tells you what that gain change does at front of house.',
      'CHECKS tracks your answers to the notes’ two questions.',
    ],
    control: [
      'MON GAIN: you are the monitor engineer, raising a preamp from +0 to +12 dB.',
      'SPLIT: Analog split (two preamps, one per console) or Digital gain sharing (one preamp on a network that both consoles use).',
      'Read the notes and answer their two questions.',
    ],
    changes: [
      'On Analog split, FOH HEARS stays UNCHANGED: each console has its own preamp.',
      'On Digital gain sharing, one preamp feeds both. So the house console applies a matching digital trim, and FOH HEARS reads TRIM minus the same amount. That setting is called gain compensation.',
    ],
    teaches: [
      'One microphone can reach two consoles: through an analog split with a preamp for each, or through one shared preamp on a network.',
      'A monitor gain move must not move the house mix. With a shared preamp, gain compensation trims the house side by the same amount to cancel it.',
      'Talkback is a mic at each console routed to the monitor mixes, never the main mix, so the engineers can speak to the stage.',
    ],
    tryThis: [
      'Ride MON GAIN to +6 dB on Analog split, then switch SPLIT to Digital gain sharing: FOH HEARS changes from UNCHANGED to TRIM −6.',
      'Answer both questions in the notes. If one stalls you, switch SPLIT again and watch what FOH HEARS does.',
    ],
  },
  'Wiring and connections': {
    intro: {
      learning: 'Why a connector’s shape never tells you the signal level on its cable, and which level mismatches only go quiet and which can damage equipment.',
      start: 'Read the five signal levels below the connections first. Then, for the first pair, name the level leaving one device and the level the other expects, and tap CONNECT or REFUSE.',
    },
    seeing: [
      'Six proposed connections, each a cable drawn from one device to another. Your job is to decide which ones should be made.',
      'Below them, the five signal levels on cables: mic, instrument, line, speaker and digital, with how strong each is and what carries it.',
    ],
    control: [
      'Tap CONNECT or REFUSE for each pair. The verdict appears after you answer.',
      'Use the table of levels as your reference before each answer, not the look of the plug.',
    ],
    changes: [
      'Each verdict names the level the connection works at, or the reason it must be refused.',
      'BUILD applies the same rules later to every cable you run there.',
    ],
    teaches: [
      'A connector’s shape never tells you the level it carries: the same plug can carry an instrument signal or an amplifier’s speaker output.',
      'Some mismatches only leave a signal too quiet or noisy; others can damage equipment. The level at each end decides which.',
    ],
    tryThis: [
      'Before each answer, name the level leaving the first device and the level the second one expects.',
      'Read the speaker-level row in the table, then look again at any pair that starts at an amplifier.',
    ],
  },
  'Amplifier loads': {
    intro: {
      learning: 'How cabinets wired in parallel lower the load an amplifier sees, and why a load below the amplifier’s minimum, or careless bridging, is unsafe.',
      start: 'Set CABINET to 8 Ω and CABINETS to 2, then 3. Watch TOTAL LOAD, INTO LOAD and VERDICT as the wire turns gold, then red.',
    },
    seeing: [
      'One amplifier channel with passive cabinets wired across it in parallel: each cabinet connected straight across the same output.',
      'The wire turns gold at the amplifier’s minimum load and red below it.',
      'TOTAL LOAD is what the amplifier sees, AMP MIN the lowest it can drive, INTO LOAD the watts it delivers, and VERDICT the result.',
    ],
    control: [
      'CABINETS: one to four, in parallel.',
      'CABINET: 16 Ω, 8 Ω or 4 Ω cabinets.',
      'BRIDGED: join the amplifier’s two channels into one more powerful channel.',
    ],
    changes: [
      'Every cabinet added in parallel lowers the total load, always below the lowest single cabinet, and the amplifier must supply more current.',
      'Bridging doubles the voltage swing and doubles the minimum load, so a load that was fine unbridged can become unsafe.',
      'Parallel load: 1/Z = 1/Z1 + 1/Z2 + … For equal cabinets, divide one cabinet’s ohms by the count.',
    ],
    teaches: [
      'Ohms (Ω) measure a loudspeaker’s impedance, the load it puts on the amplifier. A lower load draws more current and more power.',
      'Every amplifier has a minimum load. Below it the amplifier is pushed past what it can safely drive.',
      'Bridging buys power, but the amplifier then needs a higher load.',
    ],
    tryThis: [
      'With 8 Ω cabinets, set CABINETS to 2: TOTAL LOAD 4 Ω, VERDICT MARGINAL, INTO LOAD 500 W. Then 3: 2.67 Ω and UNSAFE.',
      'Choose 16 Ω cabinets and set CABINETS to 2: 8 Ω, SAFE, 300 W.',
      'Back to one 8 Ω cabinet and turn BRIDGED on: AMP MIN becomes 8 Ω and INTO LOAD reads 1000 W.',
    ],
  },
  'Power and headroom': {
    intro: {
      learning: 'How amplifier power is matched to a loudspeaker’s ratings, and why distance costs far more level than extra watts can buy back.',
      start: 'At the start, 500 W lands IN BAND. Double AMP to 1000 W and see SPL rise by only 3 dB. Then set LISTENER to 30 m and watch it fall.',
    },
    seeing: [
      'The green band is the cabinet’s power range: from its 400 W continuous rating (steady power) to its 800 W program rating (real music, with peaks). The marker shows where the amplifier lands.',
      'MATCH, CONTINUOUS and PROGRAM describe the pairing. SPL is the predicted sound level, in dB SPL, at the listener’s distance, with 6 dB kept spare for peaks.',
    ],
    control: [
      'AMP: the amplifier’s power, 100 W to 1600 W into 8 Ω, in 50 W steps.',
      'LISTENER: stand 2 m, 10 m or 30 m from the cabinet.',
    ],
    changes: [
      'Below the band, MATCH reads UNDER: pushed to drive the cabinet to its rating, the amplifier clips, and clipping can burn out tweeters.',
      'Well above the band, MATCH reads OVER: safe only with a limiter guarding the cabinet.',
      'Every doubling of power adds 3 dB; every doubling of distance costs 6 dB. That is why coverage is solved with placement before watts.',
    ],
    teaches: [
      'An amplifier is matched to a loudspeaker by its ratings. Too small is risky too, because a clipping amplifier can destroy tweeters.',
      'Doubling the power gains only 3 dB, but doubling the distance loses 6 dB. Putting loudspeakers closer to listeners does more than adding watts.',
    ],
    tryThis: [
      'At the start (500 W, 10 m) MATCH reads IN BAND and SPL @ 10 m reads 98.0 dB. Double to 1000 W: 101.0 dB.',
      'Back at 500 W, set LISTENER to 30 m: SPL falls to 88.4 dB. Then pull AMP down to 300 W: MATCH reads UNDER.',
    ],
  },
  'The deployment sequence': {
    intro: {
      learning: 'Why a professional setup follows a fixed order, and why checking the routing before the loudspeakers get power is the step that protects them.',
      start: 'Open step 9, “Verify routing before powering loudspeakers”, and read why it sits there. Then open step 10 and see what it waits for.',
    },
    seeing: [
      'Sixteen setup steps in order, from assessing the venue to shutting down: the whole job of putting in a system.',
      'Step 9, “Verify routing before powering loudspeakers”, is marked. It is the step that protects the loudspeakers.',
    ],
    control: [
      'Tap a step to open it and read why it comes where it does.',
      'Before you open one, guess what would go wrong if it moved later. Then read the step and check your guess.',
    ],
    changes: [
      'Each step you open explains what would be unsafe, or wasted, if it came later.',
      'Steps 9 and 10 show the core rule: check the routing with the amplifiers off, then power up.',
    ],
    teaches: [
      'A professional setup is a sequence, not a preference: each step depends on the ones before it.',
      'Checking the routing with the amplifiers off finds a wrong patch in silence, before it can reach a loudspeaker.',
      'One common show-day order is outputs, then inputs, then gain.',
    ],
    tryThis: [
      'Open step 9, then step 10: verify with the amplifiers off, then power up.',
      'Open steps 11 to 13 and read one common show-day order: outputs, inputs, gain.',
    ],
  },
  'Gain structure': {
    intro: {
      learning: 'Why the preamp should do the work while later stages sit near unity, and how noise and headroom through a whole system are decided at the first stage.',
      start: 'VERDICT starts at NOISY. Raise PREAMP to +40 dB and watch it read CLIPPING. Then tap WHICH STAGE and bring FADER, MAIN and PROC IN back to 0.',
    },
    seeing: [
      'One vocal peak followed from microphone to loudspeaker, one meter per stage. Each meter has a red clip line above and a gray noise haze below.',
      'The verdict line says what is wrong. AT SPEAKER is the level reaching the end of the chain, ABOVE NOISE how far it clears the noise, HEADROOM the space left before clipping.',
    ],
    control: [
      'The lane starts on PREAMP. Tap its key (WHICH STAGE) to pick FADER, MAIN, PROC IN, PROC OUT or AMP.',
      'Double-tap the lane to land on that stage’s unity.',
    ],
    changes: [
      'At the start the preamp is starved, so every later stage adds gain to make up, and lifts its own noise floor with the signal: VERDICT NOISY.',
      'Gain placed early lifts the signal above every later floor. A stage pushed past its clip line clips, and every stage after it inherits the distortion.',
      'Clean, but any stage under 12 dB of headroom: VERDICT TIGHT, HEADROOM orange. At 12 dB it turns green: VERDICT OK.',
    ],
    teaches: [
      'The preamp does the work: gain added first lifts the signal clear of every later stage’s noise.',
      'Later stages sit near unity, neither boosting nor cutting, and every stage keeps headroom for peaks.',
      'Distortion made early can’t be undone later: every stage after a clip carries it.',
    ],
    tryThis: [
      'At the start VERDICT reads NOISY. Raise PREAMP to +40 dB: with the later stages still at +10 dB, it reads CLIPPING.',
      'Now return FADER, MAIN and PROC IN to 0: VERDICT TIGHT, HEADROOM 10 dB.',
      'Lower PREAMP to +38 dB: VERDICT OK, HEADROOM 12 dB, AT SPEAKER −10 dBu, ABOVE NOISE 78 dB.',
    ],
  },
  'Coverage and aim': {
    intro: {
      learning: 'How a loudspeaker’s coverage angle and aim decide who hears it, where two loudspeakers overlap and comb-filter, and why flown loudspeakers need front fills.',
      start: 'Ride COVERAGE from 60° to 120° and watch the hatched overlap grow. Then turn FLOWN on and look at the front rows.',
    },
    seeing: [
      'Two main speakers at the corners of the deck (the stage), each with its coverage sector: where it is no more than 6 dB below its level straight ahead. The floor shows the two summed.',
      'Hatched floor is where both arrive and comb-filter: some frequencies cancel, others rise, as on Output configurations.',
      'COVERAGE, AIM, RIG and FILLS show your settings.',
    ],
    control: [
      'COVERAGE: each loudspeaker’s horizontal angle, 60° to 120°, in 5° steps.',
      'AIM: from straight ahead to 35° toed in (turned toward the middle of the room).',
      'FLOWN: lift the main speakers overhead. FILLS: add front fills, small loudspeakers on the stage lip for the front rows.',
    ],
    changes: [
      'Narrow coverage puts more level on its axis, so it reaches farther and overlaps less. Wide coverage fills a wide room and also hits the side walls.',
      'Toeing in tightens the overlap into the middle. Flown main speakers fire over the front rows, so they go dark; front fills bring them back.',
    ],
    teaches: [
      'Coverage, overlap and comb filtering are geometry first: angle and aim decide who hears what before any EQ.',
      'Where two loudspeakers both reach a seat, the overlap colors the sound.',
      'Height reaches the back rows but misses the front, so flown systems need front fills.',
    ],
    tryThis: [
      'Ride COVERAGE from 60° to 120° and watch the hatched overlap grow.',
      'Turn FLOWN on: the front rows go dark. Then turn FILLS on: they come back.',
      'Ride AIM toward 35° and watch where the hatched overlap moves.',
    ],
  },
  'Delay and alignment': {
    intro: {
      learning: 'How delay loudspeakers far from the stage are timed to the main speakers from distance and the speed of sound, and why warmer air needs less delay.',
      start: 'At 30 m and 20 °C, NEEDED reads 87.4 ms. Ride DELAY until ERROR is within 2 ms and watch the ring just touch the towers.',
    },
    seeing: [
      'Main speakers at the stage and delay towers on poles farther back. The ring is the main speakers’ wavefront at the moment the towers fire.',
      'NEEDED is the delay the towers need, in ms. SET is what you dialed in, ERROR the difference, and SOUND the speed of sound in this air.',
    ],
    control: [
      'DELAY: 0 to 300 ms added to the towers.',
      'DISTANCE: 10 m, 30 m or 60 m from the main speakers to the delays.',
      'AIR: 5 °C, 20 °C or 35 °C.',
    ],
    changes: [
      'Sound covers about 343 m each second at 20 °C, roughly 2.9 ms per meter. The towers must wait until the main speakers’ sound reaches them.',
      'Aligned (within 2 ms), the ring just touches the towers.',
      'Warm air is faster, so the needed delay falls as the air warms.',
    ],
    teaches: [
      'Delay loudspeakers are aligned to the main speakers from distance and temperature: about 2.9 ms per meter at 20 °C.',
      'Without delay, a listener near a tower hears it before the stage, like an echo.',
      'Many engineers then add a few ms more, so the stage sound arrives first and the sound still seems to come from the stage.',
    ],
    tryThis: [
      'At 30 m and 20 °C NEEDED reads 87.4 ms. Ride DELAY until ERROR is within 2 ms and the ring reaches the towers.',
      'Switch DISTANCE to 60 m: NEEDED jumps to 174.8 ms. Then set AIR to 35 °C: 170.5 ms.',
    ],
  },
  'Processing and tuning': {
    intro: {
      learning: 'What each processing block in a live system does, and where it belongs: on one channel, on the whole system, or on the monitor outputs.',
      start: 'Open Input EQ vs system EQ and read where each one lives. Then open Parametric EQ and Graphic EQ and compare their homes.',
    },
    seeing: [
      'Nine processing blocks, each with where it lives: channel strip, processor or monitor outputs.',
      'Below them, a short system-tuning order and links to the RTA, SPL meter and Spectrogram tools, used to measure the system in the room.',
    ],
    control: [
      'Tap a block to open it; a ✓ marks the ones you have read.',
      'Open the blocks in pairs that do similar jobs, and compare where each one lives.',
    ],
    changes: [
      'Each block says what it does and where it belongs. Channel EQ shapes one source; system EQ shapes the whole system for the room.',
      'Where a block lives decides what it touches: one channel, everything the audience hears, or one performer’s monitor.',
    ],
    teaches: [
      'What each processing block is for and where it sits in the chain.',
      'The same kind of tool does a different job in a different place: an EQ on a channel shapes a voice, an EQ in the processor shapes the system.',
      'Limiters protect the loudspeakers, so they are set from ratings, not by ear during the show.',
    ],
    tryThis: [
      'Open Input EQ vs system EQ, then Parametric EQ and Graphic EQ, and compare where each lives.',
      'Open Limiters and read why they are set from ratings, never by ear during the show.',
    ],
  },
  'Feedback control': {
    intro: {
      learning: 'Why a wedge feeds back: the mic hears the wedge, and the loop rings once the send passes its limit. Moving the wedge wins far more than a notch.',
      start: 'Raise SEND from −12 dB to −11 dB and watch LOOP turn to RINGING. Then set WEDGE to In the null and see LOOP LIMIT jump to 0 dB.',
    },
    seeing: [
      'From above you see the performer, the mic’s cardioid pickup pattern and the wedge. Follow the dashed loop: mic → console → amplifier → wedge → air → back into the mic.',
      'The bar compares your send with the red loop limit. SEND, LOOP LIMIT and MARGIN give the numbers; LOOP tells you STABLE or RINGING.',
    ],
    control: [
      'SEND sets the level to the wedge, from −30 to +10 dB. Every dB you add pushes the loop closer to its limit.',
      'WEDGE moves the wedge: In the live angle (off to the side, where the mic still hears it) or In the null (directly behind the mic, where a cardioid hears least).',
      'NOTCH 2.5 k cuts the one frequency that rings.',
    ],
    changes: [
      'Once SEND passes LOOP LIMIT, the loop rings: each trip around comes back louder than it left, and one tone howls.',
      'In this lab, moving the wedge into the null buys 12 dB, and the notch buys 4 dB more.',
      'Placement lowers the loop at every frequency at once; a notch helps only the one frequency it cuts.',
    ],
    teaches: [
      'Feedback is a loop: the mic hears its own wedge, and the sound rings when what comes back is louder than what left.',
      'Gain before feedback is won first with geometry, then with lower stage level, and only last with an equalizer.',
      'A cardioid mic rejects sound from directly behind it, so that is where its wedge belongs.',
    ],
    tryThis: [
      'At the start SEND is −12 dB and MARGIN 0 dB. Raise SEND to −11 dB: LOOP reads RINGING and MARGIN 1 dB OVER.',
      'Set WEDGE to In the null: LOOP LIMIT becomes 0 dB. Bring SEND to −6 dB: STABLE with 6 dB of margin.',
      'Back in the live angle, turn on NOTCH 2.5 k and watch LOOP LIMIT rise by only 4 dB. Compare that with the 12 dB the null gave you.',
    ],
  },
  'The source-forward method': {
    intro: {
      learning: 'How to find a fault without guessing: start where the symptom leaves doubt, read each station going forward, and stop at the first reading that changes.',
      start: 'Read the symptom: the PA is dead, but every channel meter is dancing. Then ride WALK forward one station at a time and watch READ.',
    },
    seeing: [
      'These are the nine stations a signal passes, source to listener. The symptom: “the PA is dead, but every channel meter is dancing”.',
      'Dancing meters prove the source, the cable and the stage input already work, so the walk starts at the console input.',
      'START shows where you begin, READ what each station reads, LAST the station you just read, and FAULT whether you’ve found it.',
    ],
    control: [
      'WALK moves you forward one station at a time, in the same order the signal travels.',
      '▶ RUN plays the whole walk by itself; WALK AGAIN repeats it so you can watch it once more.',
    ],
    changes: [
      'Each station reads OK until the first one that changes. Here the processor reads NO SIGNAL, and FAULT reads FOUND.',
      'You don’t probe the source, the cable or the stage input: the meters already cleared them. Every probe you skip is time saved at a real show.',
    ],
    teaches: [
      'The source-forward method: start where the symptom leaves doubt, read each station in signal order, and stop at the first reading that changes.',
      'The fault sits at that first changed station, or in the link just before it.',
      'A symptom is evidence: what already works tells you where not to look, so you read instead of swapping boxes.',
    ],
    tryThis: [
      'Ride WALK forward one step at a time and say what you expect before each reading appears.',
      'Press ▶ RUN and count the probes: three readings, one answer, no boxes swapped.',
    ],
  },
  'What you can now do': {
    intro: {
      learning: 'How the fourteen LEARN chapters join into one picture of a live system: choosing and wiring it, routing it, setting gain, controlling feedback and finding faults.',
      start: 'Read the summary. Then picture the system map from the first chapter and name each section from memory. When you’re ready, tap NEXT for the understanding check.',
    },
    seeing: [
      'You’ve reached the close of LEARN: a summary of what the fourteen chapters covered, from the system map to fault-finding.',
      'It also shows where BUILD, ROUTE, OPERATE and TROUBLESHOOT take each idea next, and tells you the understanding check follows this page.',
    ],
    control: [
      'Tap NEXT to open the understanding check.',
      'Tap “Lab home — what is left” to return to the lab home and see which parts you haven’t done yet.',
    ],
    changes: [
      'Nothing on this page moves; opening it is enough to mark it read.',
      'The understanding check that follows draws on every chapter, so this is the moment to look back over them.',
    ],
    teaches: [
      'A live system is one chain: the venue decides the system type, the outputs and routing feed it, and correct wiring, loads and power keep it safe.',
      'Gain structure, coverage, delay alignment and feedback control make it sound right; the source-forward walk finds what breaks.',
    ],
    tryThis: [
      'Before the check, picture the system map from the first page and name each section from memory.',
      'Pick the mode that matches the chapter you found hardest and open it from the lab home.',
    ],
  },
};

export const SS_CHECK_GUIDE: ScreenGuide = {
  intro: {
    learning: 'How the ideas from LEARN connect: system types, outputs, routing, subs, monitors, wiring, loads, gain, coverage, alignment, feedback and the source-forward walk.',
    start: 'Read the first question and tap the option you think is right. If NOT QUITE — TRY ANOTHER appears, read the explanation before you choose again.',
  },
  seeing: [
    'This is the understanding check: every question from LEARN on one page, each with its options.',
    'When you answer a question correctly, a ✓ replaces its number.',
  ],
  control: [
    'Tap an option. You’ll see CORRECT, or NOT QUITE — TRY ANOTHER, with an explanation. Keep trying until it’s right.',
  ],
  changes: [
    'A wrong answer costs you nothing, and there is no score. Every explanation says why, so a wrong pick still teaches you something. Once every question is correct, the check is passed.',
  ],
  teaches: [
    'System types, outputs, routing, subs, monitors, wiring, amplifier loads and gain are all links in one chain, from source to listener.',
    'Coverage, alignment and feedback control shape how that chain sounds; the source-forward walk finds where it breaks.',
  ],
  tryThis: [
    'After a wrong answer, read the explanation before you choose again.',
    'If a question stalls you, tap the page readout ▾ in the strip, pick its chapter from the list, then return.',
  ],
};

/* ── BUILD (the empty venue + ten capstones) ─────────────────────────────── */

const BUILD_CONTROL = [
  'PART: open THE PARTS BIN, tap a part, then tap a highlighted position on the plot to place it.',
  'To run a cable, tap a placed device, then the device it should feed. Tap a cable to remove it.',
  'OUTPUT (on a loudspeaker or its cable): choose which console output it carries.',
  'REMOVE takes the selected device off the plot, with its cables. CLEAR empties the plot.',
];

const BUILD_CHANGES = [
  'Each cable is checked as you run it. It’s accepted at its level, or refused with the reason: the wrong level, an input that’s already full, or a loop.',
  'A loudspeaker moves from SILENT to LIVE only when an unbroken path of valid cables runs to it from a source. One missing link anywhere keeps it silent.',
];

/** The capstones' shared lines (one wording on every capstone). */
const CAPSTONE_READOUTS_LINE = 'Watch PLACED, CABLES, LIVE and REQS: the checklist fills itself in as you build.';
const CAPSTONE_CONSOLE_LINE = 'CONSOLE: route it. ▲/▼ steps a level, PRE lights the pre-fader tap, and the buses show who hears what.';

/** One capstone's own text; every other line is shared. */
type CapstoneText = {
  intro: ScreenIntro;
  /** Follows "Capstone n: " — the venue and the job. */
  venue: string;
  /** What THE PARTS BIN holds and what the build asks for. */
  build: string;
  /** Replaces the shared cable-check line where the screen teaches its own refusal. */
  cableCheck?: string;
  /** This capstone's example of a requirement left open. */
  open: string;
  teaches: string[];
  tryThis: string[];
  /** The console capstones: CONSOLE joins the dock (before REMOVE / CLEAR,
   *  which pagesBuild still shows there). */
  routing?: boolean;
};

function capstone(n: number, t: CapstoneText): ScreenGuide {
  return {
    intro: t.intro,
    seeing: [`Capstone ${n}: ${t.venue} Seen from above, deck (the stage) at the top.`, t.build, CAPSTONE_READOUTS_LINE],
    control: t.routing ? [...BUILD_CONTROL.slice(0, 3), CAPSTONE_CONSOLE_LINE, BUILD_CONTROL[3]] : BUILD_CONTROL,
    changes: [
      t.cableCheck ?? BUILD_CHANGES[0],
      `${t.routing ? 'Each requirement checks itself the moment the plot or the console meets it' : 'Each requirement checks itself the moment the plot meets it'}; REQS reads PASS when every one is met. ${t.open}`,
    ],
    teaches: t.teaches,
    tryThis: t.tryThis,
  };
}

export const SS_BUILD_GUIDES: Record<string, ScreenGuide> = {
  'The empty venue': {
    intro: {
      learning: 'How a sound system goes together one cable at a time, and why a loudspeaker you’ve placed stays silent until an unbroken path reaches it from a source.',
      start: 'Open PART and place a vocal mic, a console and a powered loudspeaker. Tap the mic, then the console, to run a cable; then the console, then the loudspeaker. Watch LIVE.',
    },
    seeing: [
      'You’re looking down on an empty venue: the deck (the stage) and its riser at the top, wings on each side, the audience below. THE PARTS BIN holds every part you can place.',
      'Each cable you run takes a color from the legend, set by the level it carries: mic, line, speaker, digital or wireless.',
      'Watch PLACED, CABLES, LIVE and SILENT as you build; SILENT counts loudspeakers no source can reach yet.',
    ],
    control: BUILD_CONTROL,
    changes: BUILD_CHANGES,
    teaches: [
      'A sound system is a chain of links, and every link must carry the right level into the right input.',
      'A loudspeaker on the plot isn’t a working loudspeaker: if any link between it and a source is missing or refused, it stays silent.',
    ],
    tryThis: [
      'Place a vocal mic, a console and a powered loudspeaker. Cable mic → console → loudspeaker and watch LIVE go to 1.',
      'Now try to cable the mic straight to the loudspeaker and read the refusal. What level leaves a mic, and what level does the loudspeaker expect?',
    ],
  },
  'Capstone 1 · Speech system': capstone(1, {
    intro: {
      learning: 'Why even the smallest speech system follows the full chain: one mic into the console, then out to main speakers left and right, with nothing bypassing the console.',
      start: 'Place the vocal mic, the console and a powered box at main left and main right. Cable mic → console, then console → each box, and give each box a console output with OUTPUT.',
    },
    venue: 'a meeting room for sixty, with one presenter.',
    build: 'THE PARTS BIN holds a vocal mic, a console, powered loudspeakers and AC power. The checklist asks for a mic, a console, main speakers left and right, every box live, and everything through the console.',
    open: 'Wire only one side and ‘every box live’ stays open.',
    teaches: [
      'The simplest complete system: one mic, one console, two main speakers. Every rule of the larger systems is already in it.',
      'Sending everything through the console gives one place to set the presenter’s level and to mute the room.',
    ],
    tryThis: [
      'Place the mic, the console and a powered box at main left AND main right, then cable them through the console.',
      'Select a main speaker and open OUTPUT: give it MAIN L or MAIN R (or MAIN MONO into both).',
    ],
  }),
  'Capstone 2 · Small mono music system': capstone(2, {
    intro: {
      learning: 'Why one loudspeaker position covers a narrow room better than a left/right pair whose overlapping arrivals cancel some frequencies, and how a sub beneath it adds the low end.',
      start: 'Place the powered loudspeaker at the center main position and the powered sub at the center sub position. Then cable the vocal mic, instrument mic, DI and playback into the console.',
    },
    venue: 'a café corner, a singer with guitar, plus a backing track.',
    build: 'THE PARTS BIN holds a vocal mic, an instrument mic, a DI, playback, a console, a powered loudspeaker and a powered sub. The plan: ONE box at the center main position, a sub under it, no left/right pair.',
    open: 'Place a left/right pair and the single-position requirement stays open.',
    teaches: [
      'In a narrow room, one loudspeaker position reaches every seat from one place. Two boxes overlap down the middle, where their arrivals cancel some frequencies and boost others.',
      'The sub adds the low end under the box. Feeding it from MAIN MONO, a sub aux or a matrix decides who sets its level, and from where.',
    ],
    tryThis: [
      'Put the single box at the center main position and the sub at the center sub position.',
      'Give the center box MAIN MONO, and the sub MAIN MONO, AUX 6 or MTX 1 · SUBS. Which choice lets you turn the bass down without touching the singer?',
    ],
  }),
  'Capstone 3 · 2.1 with a dedicated subwoofer output': capstone(3, {
    intro: {
      learning: 'How a dedicated sub output turns the bass level into one control at the console, separate from the tops, so the low end becomes its own decision.',
      start: 'Place the playback, the console, the powered tops and the powered sub. Cable the sub from the console on its own link, then give it AUX 6 or MTX 1 · SUBS with OUTPUT.',
    },
    venue: 'a DJ night in a bar, playback only. A 2.1 system means two tops plus one sub.',
    build: 'THE PARTS BIN holds playback, a wireless receiver, a console, powered tops and a powered sub. For this build the sub takes its own console output and the tops are fed straight from the console.',
    open: 'The sub requirement wants the sub on its own console output.',
    teaches: [
      'With the sub on its own console output, the bass level becomes a fader move at the console, separate from the tops.',
      'On a sub fed through a top, the bass can only change at the box. Its own output puts that choice with the engineer at the console.',
    ],
    tryThis: [
      'Cable the sub from the console on its own link, not through a top, so the console sets its level by itself.',
      'Give the sub AUX 6 or MTX 1 · SUBS, and the tops MAIN L and MAIN R (or MAIN MONO into both).',
    ],
  }),
  'Capstone 4 · Stereo band system with subwoofers': capstone(4, {
    intro: {
      learning: 'Where crossover and limiting live in a passive system: the processor splits and protects the signal, and every passive box needs an amplifier to drive it.',
      start: 'Build one side first: console → processor → amplifier → passive top. Watch it go LIVE, then repeat for the other side and the subs.',
    },
    venue: 'a 300-capacity club, a four-piece band.',
    build: 'THE PARTS BIN holds stage sources, a stagebox, a console, a processor, amplifiers, passive tops and subs. Every main speaker and sub goes THROUGH the processor; every passive box needs an amplifier.',
    cableCheck: 'Each cable is checked as you run it. A console output straight into a passive top is refused: a line-level signal can’t drive a passive box without an amplifier. A full input or a loop is refused too.',
    open: 'A box that skips the processor or the amplifier keeps its requirement open.',
    teaches: [
      'In a passive system the processor holds the crossover, which sends the lows to the subs and the rest to the tops, and the limiters that protect each box.',
      'Passive cabinets put the amplifiers in your hands: you choose each amplifier and the load it drives.',
    ],
    tryThis: [
      'Run console → processor → amplifier → passive box for one side first, and watch it go LIVE.',
      'Try to cable the console straight to a passive top and read why it is refused.',
    ],
  }),
  'Capstone 5 · Digital stagebox and networked audio': capstone(5, {
    intro: {
      learning: 'How a digital stagebox carries every input to the console, and every output back to the stage, on one network cable instead of a heavy analog snake.',
      start: 'Place the stagebox and cable every source into it, none straight to the console. Then run ONE network link from the stagebox to the console.',
    },
    venue: 'a festival side stage, with a long run to front of house (the mix position in the audience).',
    build: 'The plan: every source into the stagebox, ONE network link to the console, and the outputs back down the same link to leave the stagebox. No analog snake.',
    open: 'A source cabled straight to the console, or a processor fed from the console, leaves a requirement open.',
    teaches: [
      'A digital stagebox puts the preamps on stage and turns the snake into one network cable that carries every channel both ways.',
      'On a long run, the fragile mic-level signals stay short: they become digital on stage, so the long cable carries no mic level at all.',
    ],
    tryThis: [
      'Cable every source into the stagebox — none straight to the console.',
      'Feed the processor from the stagebox, not from the console, and watch the returns requirement get checked.',
    ],
  }),
  'Capstone 6 · Band with four monitor mixes': capstone(6, {
    intro: {
      learning: 'How each performer’s wedge gets its own aux mix, and why monitor sends are taken pre-fader so house fader moves never change what the band hears.',
      start: 'Place four wedges in the four monitor positions and give each a different monitor aux with OUTPUT. Then open CONSOLE, step up a send on each of Aux 1–4 and light PRE.',
    },
    venue: 'a theater stage, four musicians who each want something different.',
    build: 'The plan: four wedges in the four monitor positions plus a pair of main speakers. Then the console: something sent to each of Aux 1–4, every monitor send PRE-fader.',
    open: 'A monitor send left post-fader keeps its requirement open.',
    teaches: [
      'Each wedge plays its own aux mix, so each of the four musicians can hear something different from the same console.',
      'Monitor sends are PRE-fader: the house engineer’s fader moves change the room, never the musicians’ wedges.',
    ],
    tryThis: [
      'Place the four wedges, give each a different monitor aux with OUTPUT, then open CONSOLE.',
      'In CONSOLE, step up a send on each of Aux 1–4 and light PRE on every one.',
    ],
    routing: true,
  }),
  'Capstone 7 · Subgroups and effects': capstone(7, {
    intro: {
      learning: 'How a subgroup sums audio, a post-fader effect send follows the fader, and a DCA moves faders by remote, all working together in one theater mix.',
      start: 'Build a working system first. Then open CONSOLE, put kick, snare and overheads on the DRUMS subgroup, and send both vocals to Aux 5 with PRE off.',
    },
    venue: 'the same theater, mixed properly.',
    build: 'A working system first, then the console: drums on the DRUMS subgroup reaching the main mix, both vocals sent POST-fader to Aux 5 (reverb), every band channel on the BAND DCA.',
    open: 'A DRUMS subgroup that doesn’t reach the main mix keeps its requirement open.',
    teaches: [
      'A subgroup carries audio: the drums sum in it, and it must still reach the main mix. A DCA carries none; it moves its members’ faders by remote.',
      'An effect send is post-fader, so the reverb follows each vocal’s fader: pull a vocal down and its reverb drops with it.',
    ],
    tryThis: [
      'In CONSOLE, put kick, snare and overheads on the DRUMS subgroup and check the subgroup still reaches the main mix.',
      'Send both vocals to Aux 5 and make sure PRE is OFF: an effect send follows the fader.',
    ],
    routing: true,
  }),
  'Capstone 8 · Matrices for mains, fills and lobby': capstone(8, {
    intro: {
      learning: 'How matrices build extra outputs from the finished mix, so front fills, subs and a lobby each get their own level while following every house move.',
      start: 'Place the main speakers, front fills and subs. Give the fills MTX 2 · FILLS and the subs MTX 1 · SUBS with OUTPUT, then set those matrices to take MAIN in CONSOLE.',
    },
    venue: 'a conference hall with front fills and a lobby overflow.',
    build: 'Main speakers, front fills and subs placed and live. On the console: Matrix 2 (fills) and Matrix 1 (subs) take MAIN; Matrix 3 (lobby) takes MAIN plus Aux 7, with the announce mic sent to Aux 7.',
    open: 'A lobby matrix without Aux 7 keeps its requirement open.',
    teaches: [
      'A matrix mixes finished buses into a further output with its own level, so the fills, subs and lobby follow every house move.',
      'The lobby takes MAIN plus Aux 7, so the announce mic arrives there twice and sits louder than the rest of the mix.',
    ],
    tryThis: [
      'Give the front fills MTX 2 · FILLS and the subs MTX 1 · SUBS with OUTPUT, then set those matrices to take MAIN in CONSOLE.',
      'Send the announce mic to Aux 7 and let Matrix 3 take AUX 7 as well as MAIN.',
    ],
    routing: true,
  }),
  'Capstone 9 · Outdoor system with front fills and delays': capstone(9, {
    intro: {
      learning: 'Why front fills and delay loudspeakers go through the processor: the delays must wait for the main speakers’ sound to reach them, so many boxes act as one system.',
      start: 'Place the main speakers, subs, front fills and the delay towers left and right. Cable the delays from the processor, not straight from the console, and give every passive box an amplifier.',
    },
    venue: 'a park stage for two thousand, ninety meters deep.',
    build: 'The plan: main speakers, subs, front fills and delay loudspeakers left and right — ALL through the processor, every passive box amplified.',
    cableCheck: 'Each cable is checked as you run it. A line output straight into a passive box is the wrong level and is refused with the reason; so is a full input or a loop.',
    open: 'A delay cabled straight from the console keeps its requirement open, since the processor is where its delay is set.',
    teaches: [
      'Delay loudspeakers must wait until the main speakers’ sound reaches them. At 20 °C sound takes about 2.9 ms per meter, so towers far back need a long delay.',
      'Fills and delays go through the processor because alignment is set there. In time with each other, many boxes sound like one system, not echoes.',
    ],
    tryThis: [
      'Place the delay towers, then cable them from the processor rather than straight from the console.',
      'Read the outputs requirement and give each front fill MTX 2 · FILLS, MAIN MONO or its own side’s main.',
    ],
  }),
  'Capstone 10 · Festival-style complete system': capstone(10, {
    intro: {
      learning: 'How every earlier capstone joins into one complete system: stagebox, processed PA, pre-fader monitor mixes, in-ears, a sub aux and a recording feed.',
      start: 'Build the PA side first: stagebox, processor, amplifiers, main speakers and subs. Then the stage side: four wedges and in-ears. Then open CONSOLE.',
    },
    venue: 'a main stage with main speakers, subs, monitors and a recording feed.',
    build: 'Everything at once: stagebox, processor, main speakers and subs, four wedges, in-ears. On the console: four pre-fader mixes, in-ears on Aux 8, Matrix 4 recording, Aux 6 with only kick, bass and keys.',
    open: 'A vocal left on Aux 6 keeps its requirement open.',
    teaches: [
      'A complete system is the smaller ones joined: a stagebox and network link, a processed PA, pre-fader monitor mixes, a sub aux and a matrix feed for recording.',
      'Aux 6 feeds the subs, so only kick, bass and keys belong there. A vocal on it puts the singer’s chest in the subwoofers.',
    ],
    tryThis: [
      'Build the PA side first (stagebox, processor, amplifiers, main speakers, subs), then the stage side, then open CONSOLE.',
      'In CONSOLE, check Aux 6: kick, bass and keys only — no vocal in the subs.',
    ],
    routing: true,
  }),
};

/* ── ROUTE (8 pages) ─────────────────────────────────────────────────────── */

export const SS_ROUTE_GUIDES: Record<string, ScreenGuide> = {
  'Anatomy of a channel': {
    intro: {
      learning: 'What each block of a console channel does to the signal: most pass it through, sends make copies, and the assignment decides where the main path goes.',
      start: 'Ride STATION from Input and preamp down the strip, or tap a block. Before AUDIO answers, say whether that block is THROUGH, A COPY or THE PATH.',
    },
    seeing: [
      'One channel strip, drawn top to bottom in the order the signal flows. Sends leave as copies at the PRE and POST tap points; the main path ends at the assignment.',
      'STATION names the block you’re on, AUDIO says what it does to the signal, and SEEN tracks the blocks you’ve looked at. The notes show the same channel on the console, read-only.',
    ],
    control: [
      'STATION: ride THE CHANNEL, TOP TO BOTTOM — input and preamp, high-pass filter, EQ, insert, fader, pan and mute, aux sends, assignment, direct output — or tap a block on the strip.',
    ],
    changes: [
      'AUDIO tells you what each block does to the signal: THROUGH (the whole channel passes it), A COPY (a send or direct out), or THE PATH (where the main path goes).',
      'A copy taken at the PRE tap point ignores the fader; one taken at POST follows it.',
    ],
    teaches: [
      'An insert sends the whole channel out to a processor and back: the signal goes through it.',
      'A send or a direct out takes a copy and leaves the channel itself untouched.',
      'The assignment decides where the main path goes; a DCA or mute group only controls channels, with no audio in it. Through, copy, path, control: four words that end most routing confusion.',
    ],
    tryThis: [
      'Ride STATION from Input and preamp down to Assignment and say THROUGH, A COPY or THE PATH before AUDIO does.',
      'Open the Fader, pan and mute block and read what this console’s MUTE does to pre-fader sends. Consoles differ here, so it’s worth knowing.',
    ],
  },
  'Pre-fader and post-fader': {
    intro: {
      learning: 'Why monitor sends are taken pre-fader and effect sends post-fader: the singer’s wedge must ignore house fader moves, and the reverb must follow them.',
      start: 'Before changing anything, pull VOX FADER to −20 dB and watch WEDGE HEARS and REVERB HEARS. Then set WEDGE TAP to PRE and FX TAP to POST and try again.',
    },
    seeing: [
      'The vocal channel feeds three buses: AUX 1 · SINGER’S WEDGE, AUX 5 · REVERB and MAIN MIX. Each shows what it hears.',
      'Both sends start tapped the WRONG way around. FADER shows the vocal’s fader; WEDGE HEARS, REVERB HEARS and MAIN show what each bus gets.',
    ],
    control: [
      'VOX FADER: the lead vocal’s fader, −60 to +10 dB. This is the move the house engineer makes during the show.',
      'WEDGE TAP and FX TAP: PRE-fader or POST-fader for each send.',
      'CONSOLE: the vocal’s fader, MUTE and the two sends with their PRE switches.',
    ],
    changes: [
      'A PRE-fader send takes its copy before the fader, so the house fader can’t move it. A POST-fader send follows every fader move.',
      'On this console the channel MUTE also silences its pre-fader sends. Not every console works that way.',
    ],
    teaches: [
      'Monitor sends are pre-fader: when the house engineer rides the vocal, the singer’s wedge must stay the same.',
      'Effect sends are post-fader: pull the vocal down and its reverb comes down with it, instead of hanging on by itself.',
    ],
    tryThis: [
      'Before changing anything, pull VOX FADER to −20 dB: WEDGE HEARS drops with it and REVERB HEARS stays put — backwards.',
      'Set WEDGE TAP to PRE and FX TAP to POST, then pull the fader down again and watch which bus moves now.',
    ],
  },
  'Subgroup, aux, matrix or DCA?': {
    intro: {
      learning: 'Which console tool fits which job: an aux makes a new mix, a subgroup sums audio, a matrix feeds from finished buses, and a DCA moves faders by remote.',
      start: 'Read the first situation. Before you tap a tool, ask: does audio need to pass through it, and should it follow the house mix or ignore it?',
    },
    seeing: [
      'Eight situations from real shows, one card each. Each is a job someone needs done; your answer is the routing tool that does it.',
    ],
    control: [
      'Tap the tool that fits the situation. A wrong answer explains why that tool fails the job; try again until it’s right.',
    ],
    changes: [
      'A correct answer locks the card and explains the job that tool does.',
      'A wrong answer isn’t wasted: its explanation shows what that tool really does, which is half the lesson.',
    ],
    teaches: [
      'An aux builds a new mix from channels, such as a wedge mix or an effect send. A subgroup sums channels into one audio path.',
      'A matrix builds a further output from finished buses. A DCA carries no audio; it moves its assigned channels’ faders by remote.',
      'Two questions sort them: does audio pass through the tool, and should it follow the house mix?',
    ],
    tryThis: [
      'For each situation, ask first: does the job need audio to pass through the tool?',
      'Then ask: should it follow the house mix or ignore it?',
    ],
  },
  'Four monitor mixes': {
    intro: {
      learning: 'How one console gives four performers four different monitor mixes, and why every monitor send is taken before the channel fader.',
      start: 'Pick a CHANNEL, ride SEND, then tap the lane’s key to open TO WHICH WEDGE and choose W1 · SINGER. Tap PRE to light the pre-fader tap.',
    },
    seeing: [
      'Each wedge is its own mix on its own bus: W1 · SINGER, W2 · GUITAR, W3 · BASS and W4 · DRUMS. Each one lists the channels that performer hears.',
      'CHANNEL, SEND and TAP show the channel you’re working on, how much of it you’re sending, and where its copy is taken.',
      'WEDGES ≥2 counts the wedges that already hear at least two channels.',
    ],
    control: [
      'Pick a source with CHANNEL. That’s the channel you’re about to send to a wedge.',
      'Ride the SEND lane to set how much of it goes out. Tap the lane’s key to open TO WHICH WEDGE and choose the wedge.',
      'Tap PRE to light the pre-fader tap, so the copy leaves before the channel fader.',
      'Open CONSOLE to see the whole desk. ▲/▼ step a send up or down, PRE lights that send’s tap, and ALL PRE sets a whole wedge column to pre-fader at once.',
    ],
    changes: [
      'Every send you raise shows up on that wedge’s bus at the level you set. The same channels build four different lists.',
      'With PRE lit, the copy leaves before the fader. When the house engineer rides a fader, the performer’s wedge stays exactly as it was.',
    ],
    teaches: [
      'One console can build a separate mix for every performer: each aux bus takes its own copy of each channel, at its own level.',
      'A wedge mix is built around what that player needs to hear to play in time and in tune, not around the house balance.',
      'Monitor sends are taken pre-fader so house mix moves never change what a performer hears on stage.',
    ],
    tryThis: [
      'Give W1 · SINGER the lead vocal and a little keys, as the notes suggest, and light PRE on both. Watch both appear on the W1 bus.',
      'Build a different mix for W4 · DRUMS and watch WEDGES ≥2 count up as each wedge gets a second channel.',
      'Open CONSOLE and press ALL PRE on each wedge column. Every send in that column now ignores the house faders.',
    ],
  },
  'Subgroups and DCAs': {
    intro: {
      learning: 'The difference between a subgroup, which sums real audio into one bus, and a DCA, which carries no audio and only moves faders by remote.',
      start: 'Open CONSOLE and tap GROUP on kick, snare and overheads to put them in DRUMS. Then tap DCA on the kick and ride BAND DCA down.',
    },
    seeing: [
      'Three buses: DRUMS SUBGROUP, MAIN MIX and AUX 4 · DRUMMER, the drummer’s wedge mix. Each shows what reaches it.',
      'KICK → MAIN and KICK → WEDGE show how loud the kick arrives in the house and in the drummer’s wedge. BAND DCA shows the DCA level; DRUMS GRP shows where the subgroup goes.',
    ],
    control: [
      'Ride BAND DCA from −60 to +10 dB. A DCA (digitally controlled amplifier) is a remote control for the faders assigned to it.',
      'Open CONSOLE to see three drum channels and the bass. Tap GROUP to cycle a channel into DRUMS, which also takes it off L/R. Tap DCA to assign that channel to BAND.',
    ],
    changes: [
      'A subgroup carries audio. The channels sum in it, and its fader turns that sum up or down on its way to the main mix.',
      'A DCA carries none. It moves each member’s fader by remote, so anything tapped before the fader, like the drummer’s wedge, never feels it.',
    ],
    teaches: [
      'A subgroup is a real bus: the whole kit flows through it as one signal you can ride or process together.',
      'A DCA only moves faders, so pre-fader sends ignore it. Pulling it down quiets the house and leaves the monitors alone.',
      'A channel sent to a subgroup should leave L/R, or it reaches the main mix twice and jumps in level.',
    ],
    tryThis: [
      'In CONSOLE route kick, snare and overheads into DRUMS, then check DRUMS GRP reads → L/R.',
      'Assign the kick to BAND and ride BAND DCA to −10 dB: KICK → MAIN drops, KICK → WEDGE does not. The wedge copy leaves before the fader.',
    ],
  },
  'Mute groups, solo and direct outs': {
    intro: {
      learning: 'How a mute group silences a whole set of channels in one press, and how PFL and AFL solo (pre-fade and after-fade listen) let you hear one channel privately.',
      start: 'Press BAND MUTE and watch MAIN HEARS and STILL LIVE change. Then press ALL MICS as well and see which channel is still live.',
    },
    seeing: [
      'MAIN MIX — WHO IS STILL LIVE lists every channel still reaching the main PA.',
      'BAND MUTE shows whether that group is pressed, MAIN HEARS counts the channels still in the main mix, and STILL LIVE names them. CHECK tracks the question in the notes.',
      'The notes also explain solo (PFL and AFL), inserts and direct outs.',
    ],
    control: [
      'Press BAND MUTE to mute every band channel with one button. Press it again to bring them all back.',
      'Press ALL MICS for a second mute group that covers every microphone, whatever its job.',
    ],
    changes: [
      'BAND MUTE closes every channel in its group. The announce mic and the playback aren’t in it, so they stay live: STILL LIVE reads MC · PB (MC is the announce mic, PB the playback).',
      'A mute group moves no faders. Release it and the band comes back exactly as you set it.',
    ],
    teaches: [
      'A mute group switches a whole scene in one press, like a changeover or a speech, without touching a fader.',
      'PFL (pre-fade listen) lets you hear a channel before its fader; AFL (after-fade listen) hears it after. Both go to your headphones, not the main PA.',
      'A direct out sends a copy of one channel elsewhere, such as a recorder.',
    ],
    tryThis: [
      'Press BAND MUTE: MAIN HEARS drops to 2 CH and STILL LIVE reads MC · PB. Release it and check every band channel returns.',
      'Press ALL MICS as well and see which channel is still live. Ask yourself why that source isn’t in either group.',
    ],
  },
  'Matrix outputs': {
    intro: {
      learning: 'How a matrix builds extra outputs from finished buses, so front fills, a lobby and a recording follow the house mix at their own levels.',
      start: 'In MATRICES, tap the crosspoint where MAIN meets Matrix 2 to give the front fills the main mix. Then ride MC → AUX 7 up.',
    },
    seeing: [
      'Three matrix buses, each a separate output: MX 2 · FRONT FILLS, MX 3 · LOBBY and MX 4 · RECORDING. Each lists what reaches it.',
      'FILLS TAKE, LOBBY TAKES and REC TAKES name the buses each matrix is taking. MC → AUX 7 shows the announce mic’s send.',
    ],
    control: [
      'Ride MC → AUX 7 to send the announce mic to Aux 7. That aux is kept for this job, so no wedge hears it.',
      'In MATRICES, tap a crosspoint, the cell where a bus meets a matrix, to cycle it off → 0 dB → −6 dB.',
      'Open CONSOLE to see the announce mic, the vocal and the kick, with their L/R and Aux 7 cells.',
    ],
    changes: [
      'A matrix mixes finished BUSES, not single channels, into a further output with its own level. So the fills, lobby and recorder follow every house move.',
      'The lobby takes MAIN plus AUX 7, so the announce mic arrives there twice: louder than the rest.',
    ],
    teaches: [
      'A matrix feeds outputs built from the finished mix: front fills, an overflow room, a recording.',
      'Each matrix has its own level, so a lobby can run quieter than the room without changing the house mix.',
      'Adding a second bus to one matrix lets one place hear more of a source, like announcements in the lobby.',
    ],
    tryThis: [
      'In MATRICES give Matrix 2 and Matrix 4 MAIN and watch FILLS TAKE and REC TAKES read MAIN.',
      'Ride MC → AUX 7 up, then let Matrix 3 take MAIN and AUX 7. Watch LOBBY TAKES change: the announce mic now reaches the lobby twice.',
    ],
  },
  'Output patching': {
    intro: {
      learning: 'Why every console output has to leave the right stagebox socket, and what the room hears when a bus lands on the wrong loudspeaker.',
      start: 'Ride SOCKET to the first line output and read its tape and where its cable runs. Use BUS to choose what feeds it, and watch FED FROM turn green or red.',
    },
    seeing: [
      'The stagebox’s seven line outputs. Above each socket is a strip of tape naming its bus, and you can see where its cable runs.',
      'Nothing is patched yet. SOCKET names the output you’ve picked, FED FROM shows the bus feeding it, and PATCHED tracks the sockets you’ve patched.',
    ],
    control: [
      'Ride SOCKET along THE STAGEBOX’S LINE OUTPUTS, or tap a socket on the panel.',
      'Use BUS to choose what that socket carries: Main L, Main R, Aux 1, Aux 2, Aux 6, Matrix 2 or Matrix 3.',
    ],
    changes: [
      'FED FROM turns green when the bus suits the destination and red when it doesn’t. The socket’s note says why.',
      'A wedge takes its own aux, aux-fed subs take the sub aux, and front fills take a matrix.',
    ],
    teaches: [
      'Console routing only works if each output leaves the right socket. The cable decides where sound goes; the patch decides what travels in it.',
      'A main output patched into a wedge amplifier puts the house mix in the singer’s wedge instead of the singer’s own mix.',
      'A written patch list lets anyone check or rebuild the system.',
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
    intro: {
      learning: 'Why a system powers up in order: stage devices and console first, amplifiers last, so every turn-on thump happens before anything can pass it to a loudspeaker.',
      start: 'Tap STEP and choose what to switch on first. Watch ORDER: if it reads WRONG, read which step must come first, tap RESET and try again.',
    },
    seeing: [
      'The whole system starts dark: stage devices, console, processor, amplifiers and loudspeakers. Each device shows ● ON as you switch it on.',
      'POWER UP · YOUR ORDER lists the steps you’ve taken. STEPS counts them, LAST names the latest, ORDER says whether it’s safe, and LIT tracks what is on.',
    ],
    control: [
      'Tap STEP and pick the next thing to switch on. You choose the order; ORDER tells you whether it’s safe.',
      'RESET appears once you’ve started. Tap it to clear your order and begin again.',
    ],
    changes: [
      'Tap a step too early and ORDER reads WRONG, naming the step it must come after.',
      'In the right order, each turn-on thump goes into a system that can’t pass it on. The amplifiers wake last, into silence.',
    ],
    teaches: [
      'Power up from the source end: stage devices and console first, then processing, and amplifiers or powered boxes last.',
      'A device switching on can send a thump down the line. If the amplifiers are already on, that thump reaches the loudspeakers.',
      'Routing is checked with the amplifiers still off, so a wrong patch can’t reach the room.',
    ],
    tryThis: [
      'Tap “Verify routing — amps OFF”, then “Amps and powered boxes — LAST”: ORDER reads WRONG. Read why, RESET, and go again.',
      'Before each tap, ask which device would be listening if this one thumped.',
    ],
  },
  'Line check': {
    intro: {
      learning: 'How a line check proves every path before the band arrives: outputs first, then each input, and how two readings tell a patch fault from a cable fault.',
      start: 'Ride LINE through OUTPUTS FIRST, THEN EVERY INPUT. Tap PROBE on each line, compare its two readings, then tap MARK OK or MARK FAULT.',
    },
    seeing: [
      'Two strips of LEDs: the processor outputs above, the stagebox inputs below. Each probe gives you two readings to compare.',
      'On an input you read STAGEBOX LED (LIT or DARK) and CH METER (MOVING or FLAT). On an output, PROC OUT (SIGNAL or NONE) and RIGHT FEED (YES or NO).',
      'LINE names the line you’re on; MARKED shows your verdicts.',
    ],
    control: [
      'LINE: ride OUTPUTS FIRST, THEN EVERY INPUT, one line at a time.',
      'PROBE reads the selected line.',
      'MARK OK or MARK FAULT records your verdict. Decide from the two readings, not from a hunch.',
    ],
    changes: [
      'On an input, LED lit but meter flat means the signal reaches the stagebox but not the channel: the input patch. LED dark means nothing arrives: the cable or the source.',
      'On an output, signal present but the wrong feed playing means the output patch.',
      'A wrong mark says “Read it again”. Three of these lines are faults.',
    ],
    teaches: [
      'A line check tests one path at a time before the band arrives, so faults turn up in a quiet room, not mid-show.',
      'Outputs come first: once you trust the loudspeakers, every input you check plays through a system you know works.',
      'Where a signal is last seen and first missing tells you which part of the path failed.',
    ],
    tryThis: [
      'Probe Ch 5 · Keys DI: STAGEBOX LED LIT, CH METER FLAT. Decide what that pattern means before you mark it.',
      'Probe Ch 7 · Backing vocal: the LED stays DARK. Which part of the path is left?',
    ],
  },
  'Establish gain structure': {
    intro: {
      learning: 'How gain is set through a whole system, mic to loudspeaker: preamp first, unity through the middle, and headroom at every stage. Distortion can only be fixed where it starts.',
      start: 'Find the first CLIP indicator: it’s at the preamp. Tap the lane’s key (WHICH STAGE) to look at each stage, then bring PREAMP down and watch VERDICT.',
    },
    seeing: [
      'The gain chain, one meter per stage. The preamp is turned up too far: its CLIP indicator lights first, and every later meter shows ↑, the distortion it inherited.',
      'AT SPEAKER, ABOVE NOISE, HEADROOM and VERDICT sum up the chain.',
      'This is the opposite fault from LEARN’s gain chapter, which starts with the preamp too low.',
    ],
    control: [
      'The lane starts on PREAMP. Tap its key (WHICH STAGE) to pick FADER, MAIN, PROC IN, PROC OUT or AMP.',
      'Double-tap the lane to set that stage to its unity mark. AMP’s mark is −18 dB.',
    ],
    changes: [
      'Turning a later stage down only makes the clipped signal quieter. The distortion happened at the preamp, and only the preamp can prevent it.',
      'In this lab the amplifier’s input attenuator at −18 dB makes it the last stage to clip; real systems set it from the amplifier and processor specs.',
    ],
    teaches: [
      'Clipping is fixed where it starts: every stage after it inherits the distortion.',
      'Set gain from the front: preamp first, the middle stages near unity, the amplifier last, with headroom left at every stage.',
      'Headroom is the space between the signal’s peaks and the clip point; without it, the loudest moment of the show distorts.',
    ],
    tryThis: [
      'Bring PREAMP to +40 dB and FADER and MAIN to 0, leaving AMP at 0: VERDICT still reads CLIPPING — now at the amplifier.',
      'Set PREAMP to +35 dB and AMP to −18 dB: VERDICT OK, HEADROOM 15 dB, AT SPEAKER −13 dBu.',
    ],
  },
  'Ring-out and soundcheck': {
    intro: {
      learning: 'How wedges are rung out before the show: move each wedge into its mic’s null first, notch only what still rings, then bring the level up.',
      start: 'With WEDGE, pick Wedge 1 · Singer and raise SEND to −6 dB: it rings. Then set POSITION to In the null and watch the ! in the readouts disappear.',
    },
    seeing: [
      'The stage shows the wedge you picked, with its mic’s pickup pattern. Three wedges start in the live angle; Wedge 3 · Bass already sits in the null.',
      'The readouts show every wedge’s send, W1 SINGER, W2 GUITAR, W3 BASS and W4 DRUMS, with a ! on any wedge that is ringing.',
    ],
    control: [
      'WEDGE picks the wedge you’re ringing out.',
      'SEND sets that wedge’s level, from −30 to +6 dB.',
      'POSITION moves it: In the live angle, where the mic still hears it, or In the null, where the mic hears it least.',
      'NOTCH cuts the frequency that rings.',
    ],
    changes: [
      'In this lab a wedge in the live angle rings 12 dB sooner. The null buys those 12 dB back; a notch buys only 4 more.',
      'Every wedge starts at −18 dB. Your goal is every wedge at −6 dB or louder, with none ringing.',
    ],
    teaches: [
      'The ring-out order: reposition first, notch only what still rings, then set the level.',
      'Each wedge and the mic in front of it form a feedback loop, so you ring them out one at a time.',
      'Moving a wedge helps every frequency at once; each notch fixes one frequency and takes a little out of the performer’s mix.',
    ],
    tryThis: [
      'Pick Wedge 1 · Singer and raise SEND to −6 dB: it rings. Set POSITION to In the null: it stops, with 6 dB of margin.',
      'On a live-angle wedge at −6 dB, try NOTCH alone: it still reads RINGING — 2 dB over. A notch buys only 4 dB.',
    ],
  },
  'Shutdown and documentation': {
    intro: {
      learning: 'Why power-down mirrors power-up: outputs muted, then amplifiers off first, so nothing switched off later can thump through them. And why the show gets written down.',
      start: 'Tap STEP and choose what to switch off first. If ORDER reads WRONG, read why, tap RESET and try again. Then open DOCUMENT.',
    },
    seeing: [
      'The whole system starts on. Each device shows ○ OFF as you switch it off.',
      'POWER DOWN · YOUR ORDER lists your steps. STEPS counts them, LAST names the latest, ORDER says whether the order is safe, and DARK tracks what is off.',
    ],
    control: [
      'STEP: tap the power-down steps in the order you think is safe.',
      'DOCUMENT: check off the five things to write down — the console scene, the processor preset, the input and output patch lists, loudspeaker positions and delay times.',
      'RESET clears your order so you can start again.',
    ],
    changes: [
      'Power-down is the mirror of power-up: mute the outputs, then switch the amplifiers off FIRST.',
      'With the amplifiers already off, a thump from any device switched off later has no way to reach a loudspeaker.',
    ],
    teaches: [
      'Amplifiers are last on and first off, because a thump from any other device reaches the loudspeakers only through them.',
      'Writing down the scene, preset, patch lists, loudspeaker positions and delay times lets you, or the next engineer, rebuild the same system and the same sound.',
    ],
    tryThis: [
      'Start with “Console — save first”: ORDER reads WRONG. Read why, RESET and begin with “Mute the outputs”.',
      'Open DOCUMENT and check all five before you leave.',
    ],
  },
};

/* ── TROUBLESHOOT (the bench intro + five fault groups) ──────────────────── */

/** One fault group's own text: what a healthy reading means for this kind of
 *  fault. The list, readout, CASE, RESET and GRADE lines are shared. */
type FaultGroupText = {
  intro: ScreenIntro;
  /** Follows "<title> faults: ". */
  blurb: string;
  /** The PROBE line: what to ask at each station. */
  probe: string;
  /** The FAULT line: when to name it. */
  fault: string;
  /** What healthy means here, and which reading marks the fault. */
  healthy: string;
  teaches: string[];
  tryThis: string[];
};

function faultGroup(title: string, t: FaultGroupText): ScreenGuide {
  return {
    intro: t.intro,
    seeing: [
      `${title} faults: ${t.blurb}`,
      'With no case open, the notes list this group’s faults: ○ unsolved, ✓ solved, ✓✓ solved with a source-forward walk. A case shows its nine stations and its symptom.',
      'Watch CASE, PROBED (your probes), READS (the last reading) and GRADE (your result).',
    ],
    control: [
      'CASE: put a fault on the bench, or tap one in the list.',
      t.probe,
      t.fault,
      'RESET clears your probes so you can walk again; BENCH returns to the list.',
    ],
    changes: [
      t.healthy,
      'GRADE gives ✓ for the right diagnosis and ✓✓ when every probe also went forward. A backward probe is recorded, but not as a forward walk.',
    ],
    teaches: t.teaches,
    tryThis: t.tryThis,
  };
}

export const SS_TROUBLESHOOT_GUIDES: Record<string, ScreenGuide> = {
  'How the bench works': {
    intro: {
      learning: 'Building on LEARN’s source-forward method: how a symptom tells you where to start, and why the first reading that changes marks the fault.',
      start: 'Find the three stations the symptom already cleared, then follow the walk to the processor’s NO SIGNAL. Read what ✓ and ✓✓ mean, then tap NEXT.',
    },
    seeing: [
      'A worked example on the bench map. The symptom already cleared the first three stations, so the walk began at the console.',
      'The console input and output read OK. The processor reads NO SIGNAL: that’s where the signal stops.',
      'Below the map: twenty-two faults in five groups, how a walk starts, and what ✓ and ✓✓ mean.',
    ],
    control: [
      'There’s nothing to operate here. Read the worked example, then tap NEXT to open the first fault group.',
    ],
    changes: [
      'The walk stopped at the first reading that changed: that station is the answer. Every station after it would read NO SIGNAL too, so probing further tells you nothing new.',
    ],
    teaches: [
      'A symptom already tells you which stations work. Start where the doubt begins, which is not always at the microphone.',
      'Read each station in signal order and stop at the first reading that changes. That finds the fault with the fewest checks.',
      'Swapping boxes at random wastes time and can hide the real cause; a reading proves it.',
    ],
    tryThis: [
      'In the example, point to the station where the reading changes, then check it against the sentence above the map.',
      'Say where a walk should start for “one vocal is dead, the band is fine”.',
    ],
  },
  'Dead signal': faultGroup('Dead signal', {
    intro: {
      learning: 'How a dead signal stops at one point in the chain, and how a source-forward walk finds the first station where the signal disappears.',
      start: 'Tap CASE to put a fault on the bench and read its symptom. PROBE the starting station first, then walk forward one station at a time.',
    },
    blurb: 'nothing at all, or nothing from one place. Your job is to find where the signal stops.',
    probe: 'PROBE: read a station, or tap it on the map. Each probe shows what a technician would find there: signal, or NO SIGNAL.',
    fault: 'FAULT: name the fault once you’ve seen where the signal disappears.',
    healthy: 'Here, healthy means signal is present. Once one station reads NO SIGNAL, every station after it will too, so only the first one matters.',
    teaches: [
      'A dead signal stops at one point, and everything downstream goes silent with it. Look for a station that reads NO SIGNAL right after one that reads OK.',
      'When only one source is dead, the parts it shares with the others are already proven, so the fault is on the path that source uses alone.',
    ],
    tryThis: [
      'Open a case and read the symptom. Before you probe, say which stations it already clears, then probe the starting station first.',
      'Stop at the first NO SIGNAL that follows an OK and name the fault. Compare your probe count with the minimum in the verdict.',
    ],
  }),
  'Level, noise and distortion': faultGroup('Level, noise and distortion', {
    intro: {
      learning: 'How clipping, hum and over-compression enter at one stage and travel on to every stage after it, and how a forward walk finds where it starts.',
      start: 'Open a CASE and read whether it’s clipping, hum, squash or a rattle. PROBE the starting station, then walk forward until a reading turns dirty.',
    },
    blurb: 'it plays, but wrong. Clipping, hum, squash (the sound pressed flat) or a rattle.',
    probe: 'PROBE: read a station, or tap it on the map, to see what a technician would find there. Ask: is it clean, and at a sensible level?',
    fault: 'FAULT: name the fault once you’ve found the first station where the sound goes wrong.',
    healthy: 'Here the signal is present everywhere, so the question is quality. Distortion or hum added at one station rides along to every station after it. So the first dirty reading matters, not the worst one.',
    teaches: [
      'Clipping, hum and over-compression are added at one stage and inherited by every later one. Turning a later stage down only makes the fault quieter.',
      'That’s why you look for the station where clean turns dirty, not the place where the problem sounds worst.',
    ],
    tryThis: [
      'Open a case: is the symptom clipping, hum, squash or a rattle? Decide what a clean reading looks like, then probe the starting station.',
      'Keep probing forward until a reading turns dirty, and name the fault there. Then see whether your walk earned ✓✓.',
    ],
  }),
  Routing: faultGroup('Routing', {
    intro: {
      learning: 'How a healthy signal can still end up in the wrong place, and how to find the point where it takes the wrong turn.',
      start: 'Open a CASE and read the symptom. PROBE the starting station, and at each station ask whether it carries the right signal, not just any signal.',
    },
    blurb: 'the signal exists and arrives somewhere, just not where it should. Your job is to find where it takes the wrong turn.',
    probe: 'PROBE: read a station, or tap it on the map. Ask two things at each: is there signal, and is it the right signal for this path?',
    fault: 'FAULT: name the fault once you’ve found where the signal leaves its proper path.',
    healthy: 'A routing fault can show healthy signal at a station that should be getting something else. The first station carrying the wrong thing marks the fault.',
    teaches: [
      'In a routing fault nothing is broken. The signal is healthy, but a send, an assignment or a patch points it to the wrong place.',
      'Swapping cables or boxes won’t fix it. Following where the signal is meant to go, and checking where it actually goes, will.',
    ],
    tryThis: [
      'Open a case and read the symptom. Say where the signal is supposed to go, then probe the starting station first.',
      'At each station, ask whether it carries the right signal. Name the fault at the first wrong one and compare your probe count with the minimum.',
    ],
  }),
  'Time, polarity and crossover': faultGroup('Time, polarity and crossover', {
    intro: {
      learning: 'Why loudspeakers that each work can still fight each other through timing, polarity or crossover errors, and how a walk finds which piece disagrees.',
      start: 'Open a CASE and read the symptom. Ask which two parts of the system must agree, then PROBE the starting station and walk forward.',
    },
    blurb: 'everything is present, but the pieces disagree with each other. Your job is to find which piece is out of step.',
    probe: 'PROBE: read a station, or tap it on the map. Compare each reading with what the system needs, not just whether sound is there.',
    fault: 'FAULT: name the fault once you’ve found the reading that disagrees.',
    healthy: 'Every station can pass signal and still be wrong. A delay that’s off, a flipped polarity or a wrong crossover makes loudspeakers cancel or pile up instead of joining. The first reading that disagrees marks the fault.',
    teaches: [
      'Two loudspeakers playing the same sound only add up when they arrive in time and in the same polarity. Out of step, they cancel, often around the crossover.',
      'A crossover splits the signal by frequency. Set wrong, it leaves a gap or a pile-up between the subs and the tops.',
    ],
    tryThis: [
      'Open a case and read the symptom. Say which two parts of the system have to agree, then probe the starting station first.',
      'Probe forward until a reading disagrees with what the system needs, then name the fault. Check it against the verdict’s minimum probe count.',
    ],
  }),
  'Digital, network and acoustic': faultGroup('Digital, network and acoustic', {
    intro: {
      learning: 'How clicks, dropouts and a ring each point to a different kind of fault, and why a careful walk proves the cause where swapping boxes only hides it.',
      start: 'Open a CASE and decide whether it’s clicks, dropouts or a ring. PROBE the starting station, then walk forward until a reading changes.',
    },
    blurb: 'clicks, dropouts or a ring. Your job is to find where the trouble starts.',
    probe: 'PROBE: read a station, or tap it on the map. A click can come and go, so trust each reading over what you think you heard.',
    fault: 'FAULT: name the fault once a reading shows where the trouble starts.',
    healthy: 'Clicks and dropouts mean the digital stream is being interrupted. A ring means sound is looping back into a microphone. Each starts at one station. The first reading that isn’t healthy marks the fault.',
    teaches: [
      'Digital and network faults often come and go, so a station-by-station reading proves more than listening.',
      'They’re solved by a careful walk, not by swapping boxes. A swap can make a fault vanish for a while without showing its cause.',
      'A ring is feedback: the loop from microphone to loudspeaker and back has too much gain at one frequency.',
    ],
    tryThis: [
      'Open a case: clicks, dropouts or a ring? Say which part of the system each one points to, then probe the starting station.',
      'Don’t swap anything. Walk forward until a reading changes, name the fault, and compare your probe count with the minimum in the verdict.',
    ],
  }),
};

/** The guide for page `index` of a mode, by the page's title (the check page
 *  appended to LEARN has its own guide). */
export function ssGuideFor(guides: Record<string, ScreenGuide>, titles: readonly string[], index: number, withCheck = false): ScreenGuide | undefined {
  if (withCheck && index === titles.length) return SS_CHECK_GUIDE;
  const t = titles[index];
  return t == null ? undefined : guides[t];
}
