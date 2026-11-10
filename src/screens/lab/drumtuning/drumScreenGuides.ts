/**
 * Drum Tuning Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts).
 *
 * The lab is ONE screen of seven chapters, each a run of steps (LEARN → HEAR
 * → ADJUST → PRACTICE → REVIEW, modules/ch*.tsx). Every step is its own
 * screen — a Rack Unit page or a reading page — so there is one guide per
 * step, in the chapter's step order (length = DRUM_STEP_COUNTS), plus the
 * what's-left screen.
 *
 * Every name is the on-screen name in the step's own code (bezel keys, dock
 * labels, tray options, the Landing line, cards) or the lab kit (kit.tsx,
 * mastering/kit.tsx, LabEndScreen). Every number in TRY THIS is what the
 * screen prints, worked from drumEngine.ts at the step's own defaults; the
 * test re-derives each one:
 *   Ch1 tension: 3000 N/m → PITCH 233 Hz, 1ST OVERTONE 371 Hz; 1200 → 147 Hz;
 *       4800 → 294 Hz. Qualities: BEND +35 ¢ at STRIKE 80 %, +2 ¢ at 20 %,
 *       +54 ¢ at 100 %; SUSTAIN 1.72 s → 0.27 s at DAMPING 100 %.
 *       Turn one rod: +⅛ turn → SPREAD 21 ¢, BEAT 1.5 Hz; +¼ → 42 ¢, 3.1 Hz.
 *   Ch2 RESPONDS 130–260 Hz (rack); known condition: EVEN STEPS step 8 →
 *       SPREAD 0 ¢, PITCH 156 Hz; RANDOM step 8 → 880 ¢, 137 Hz.
 *   Ch3 tap round the head: the map says lug 2 is highest, SPREAD 195 ¢.
 *   Ch4 SET RESO ↑ → RESO 226 Hz (REL +3.0 st); BATTER ↑ → 160 Hz.
 *   Ch5 SNARE SIDE 290 Hz at BOTTOM +400 ¢, 345 Hz at +700 ¢; BEND goal on
 *       the rack tom starts at 260 Hz with BEND +32 ¢.
 *   Ch6 start 140 / 160 Hz → −2.3 st UNBALANCED; 165 / 110 → 7.0 st
 *       DISTINCT; 200 / 110 → 10.3 st UNBALANCED; 140 / 130 → 1.3 st CLOSE.
 *   Ch7 warble case: SPREAD 226 ¢, BEAT 8.4 Hz.
 * The drum is a MODEL: every sound is synthesized from membrane physics and
 * heard through an uncalibrated output, so the guides say so where a
 * readout could be taken for a measurement of a real drum.
 * Change a step's labels, defaults or order → update its guide here;
 * test/screenGuide_drumtuning_20261031.test.ts pins the shape, the names
 * and the numbers.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language; KNOWLEDGE, never skills; no gear brand names;
 * no "N of total"; "suggest" never "recommend"; no build notes. No tuning
 * relationship is called correct; tuning to a note is optional.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';
import type { DrumChapterId } from './drumContent';

/* ── shared wording for the read steps every chapter has ─────────────────── */

const DECK_CONTROL = [
  'Tap the option you think fits. A wrong pick shows ✗ and asks you to choose again; the option that fits shows ✓ and the full reason.',
  '‹ PREV CARD and NEXT CARD › move between cards. NEXT › on the strip opens this chapter’s review.',
];

const REVIEW_CONTROL = [
  'Scroll through the review. Say each SAY IT BEFORE YOU READ IT answer in your head first, then tap the card to show it.',
  '‹ PREV on the strip returns to any step of this chapter. NEXT › opens the next chapter; on the last chapter it becomes FINISH ›, which opens WHAT’S LEFT.',
];

export const DRUM_SCREEN_GUIDES: Record<DrumChapterId, readonly ScreenGuide[]> = {
  /* ── CHAPTER 1 · How a drum makes sound ─────────────────────────────────── */
  sound: [
    // LEARN · The drum as a system
    {
      intro: {
        learning: 'A drum is a system, not just the head you hit: two heads, a shell with bearing edges, hoops, rods, lugs, and the air inside that links the heads.',
        start: 'Step PART through each part and watch it light up on the cut-away tom. Stop on AIR and read why the resonant head matters.',
      },
      seeing: [
        'You’re looking at a tom cut in half, from the side: the batter head (the one you hit) on top, the resonant head below. The part you pick lights up.',
        'Readouts: PART, HEADS 2, EDGES 2 and LUGS 6 × 2 (six lugs for each head).',
        'Below: CHAPTER 1, what the chosen part does, and a card on the two heads.',
      ],
      control: [
        'Step PART through the batter head, resonant head, shell, bearing edges, hoops, tension rods, lugs and the air inside, or tap it for the list.',
        'The strip under the title: ‹ PREV and NEXT › move between steps and chapters. Tap the middle of the strip for the chapter list.',
      ],
      changes: [
        'Each part lights up as you pick it, and its card tells you its job.',
        'You strike the batter; the air inside then pushes the resonant head. So both heads shape the note, not just the one you hit.',
      ],
      teaches: [
        'A drum is a system: two heads, a shell with bearing edges (the shaped rim the head rests on), hoops, rods, lugs and the air inside.',
        'Every drawing here is a model and every sound is synthesized. The method carries over to a real drum, where your ears have the final say.',
      ],
      tryThis: [
        'Move PART to AIR. The air links the two heads, and that is why the resonant head matters even though you never hit it.',
        'Move PART to EDGE, then go to The shell and bearing edge step to see the profiles up close.',
      ],
    },
    // LEARN · Tension and pitch
    {
      intro: {
        learning: 'Why more tension raises a drum’s pitch, with four times the tension giving one octave, and why a drum’s overtones never line up into a clean musical note.',
        start: 'Tap ▶ STRIKE and read PITCH 233 Hz and 1ST OVERTONE 371 Hz. Then slide TENSION all the way left and strike again.',
      },
      seeing: [
        'Each bar is a note the head makes, lowest on the left. The tall bar is the pitch you hear; the bars to its right are overtones.',
        'TENSION tells you in words how tight the head is. PITCH and NOTE give the main note; 1ST OVERTONE is the next note up.',
      ],
      control: [
        'TENSION fader: from very low to very high; the lane shows the pitch and the tension in N/m (newtons per meter — how hard the head is pulled).',
        '▶ STRIKE, or tap the display, plays the hit; tap again to stop.',
      ],
      changes: [
        'More tension gives a higher pitch, but slowly: pitch rises with the square root of tension. So four times the tension is one octave up.',
        'The overtones sit at uneven ratios, about 1 : 1.6 : 2.1 : 2.3. That isn’t a harmonic series like a string’s, so a drum has no single clean note.',
      ],
      teaches: [
        'Tension sets pitch; a bigger or heavier head sits lower at the same tension.',
        'Tuning to an exact note is optional. NOTE only names the pitch for reference; what you’re after is a useful, resonant sound.',
      ],
      tryThis: [
        'At the start PITCH reads 233 Hz and 1ST OVERTONE 371 Hz. Slide TENSION all the way left: PITCH 147 Hz.',
        'Now slide TENSION right until the lane reads 4800 N/m, four times the lowest, 1200. PITCH reads 294 Hz, one octave up. Strike both and compare.',
      ],
    },
    // LEARN · The shell and bearing edge
    {
      intro: {
        learning: 'How the bearing edge, the shaped rim the head sits on, decides how much head touches shell, and with it the drum’s brightness, sustain and ease of tuning.',
        start: 'Step EDGE from 45° SHARP to VINTAGE and watch the amber line widen as CONTACT climbs from LEAST to MOST.',
      },
      seeing: [
        'You’re looking at the top of the shell wall, cut across, with the head draped over it. The amber line shows where head meets shell.',
        'EDGE names the edge’s profile, its cut shape. CONTACT says how much head touches shell: LEAST, SMALL, MORE or MOST.',
      ],
      control: [
        'Step EDGE through 45° SHARP, 45° DOUBLE, ROUNDED and VINTAGE, or tap it for the list with a line on each.',
      ],
      changes: [
        'A sharper edge touches the head along a thin line, so the drum sounds brighter and rings longer. A rounder edge touches more of the head, so it sounds warmer and shorter.',
        'A true, clean edge lets the head seat evenly; a dented or dirty one makes a spot that will not tune.',
      ],
      teaches: [
        'The bearing edge sets how much head touches shell — contact, sustain and ease of tuning.',
        'No shell material decides a drum’s sound alone; edges, heads, hoops and tuning all take part.',
      ],
      tryThis: [
        'Step EDGE from 45° SHARP to VINTAGE: CONTACT goes from LEAST to MOST and the amber line widens.',
        'Read the card on why it matters for tuning: the Prepare chapter looks for a dirty edge.',
      ],
    },
    // HEAR · Pitch, overtones, sustain, pitch bend
    {
      intro: {
        learning: 'The four things a tuner listens for in every hit, pitch, overtones, sustain and pitch bend, and how a harder stroke or more damping changes them.',
        start: 'Tap ▶ STRIKE at STRIKE 80 % and read BEND +35 ¢. Then slide STRIKE to 20 % and strike again: the glide almost disappears.',
      },
      seeing: [
        'One hit, left to right in real time. The white line in the strip below is how loud it is; a green mark shows where it has died away.',
        'PITCH is the note. SUSTAIN is the estimated T60, the time to fall 60 dB. BEND is how far the pitch glides, in cents. OVERTONES is the share of the hit above three times the pitch.',
      ],
      control: [
        'STRIKE fader: 20–100 %, from a light tap to a hard hit. A harder hit is louder, with a deeper bend.',
        'DAMPING fader: from none, through a small gel and a felt strip, up to a pillow.',
        '▶ STRIKE, or tap the display, plays the hit; tap again to stop.',
      ],
      changes: [
        'A harder STRIKE stretches the head more: it starts sharper and glides down further — BEND grows.',
        'More DAMPING shortens SUSTAIN and takes the overtones first.',
        'Each setting gives a fresh hit, so strike again after every move to hear it.',
      ],
      teaches: [
        'Every hit has four qualities a tuner listens for: pitch, overtones, sustain and pitch bend. Your stroke and your damping change them, not just the rods.',
        'These numbers are measured from a synthesized hit — a model of a drum, not a measurement of yours.',
      ],
      tryThis: [
        'At STRIKE 80 % BEND reads +35 ¢. Slide STRIKE to 20 %: +2 ¢. To 100 %: +54 ¢.',
        'Strike with no damping: SUSTAIN is about 1.72 s. Push DAMPING to 100 % and strike: about 0.27 s.',
      ],
    },
    // ADJUST · Turn one rod
    {
      intro: {
        learning: 'Why turning one rod changes both the pitch near its lug and the evenness of the whole head, and how an uneven head makes a slow warble called beating.',
        start: 'On ROD 1, set TURN to +⅛ turn and tap ▶ STRIKE. Read SPREAD and BEAT, then try +¼ turn and listen for a faster warble.',
      },
      seeing: [
        'You’re looking down on the drum. Each colored wedge is one rod’s pitch: blue low, yellow even, red high. The drum key sits on the rod you chose.',
        'ROD and TURN show your move. LUG PITCH is that lug’s pitch, SPREAD is the cents between the highest and lowest rod, and BEAT is the warble rate.',
      ],
      control: [
        'TURN fader: up to a full turn either way, in eighths, on the chosen rod.',
        'ROD picks the rod. VIEW shows DRUM, WAVE or PITCH, or pick a VIB entry to see one of the strike’s vibration shapes.',
        '▶ TAP plays a light tap near that rod; ▶ STRIKE plays the whole drum. A tap on the display strikes or stops.',
      ],
      changes: [
        'Turning one rod changes the pitch near it AND the balance of the whole head.',
        'An uneven head sounds two slightly different notes at once. They beat against each other as a slow warble; BEAT is their difference in hertz.',
        'After each turn, you’re told whether the head got more or less even.',
      ],
      teaches: [
        'One rod moves its lug’s pitch and the head’s evenness — the reason tuning is done lug by lug.',
        'Cents (hundredths of a semitone) measure how far apart the rods are. The wider the spread, the faster the warble you hear.',
      ],
      tryThis: [
        'On ROD 1 set TURN to +⅛ turn: SPREAD reads 21 ¢, BEAT 1.5 Hz. At +¼ turn: 42 ¢ and 3.1 Hz — ▶ STRIKE to hear the warble.',
        'Set TURN back to no turn: SPREAD 0 ¢, BEAT none. Then switch VIEW to PITCH and strike, and compare it with the drum at +¼ turn.',
      ],
    },
    // PRACTICE · Check your understanding
    {
      intro: {
        learning: 'What one rod out of line does to the sound, why a pitch tuner struggles on a drum, which parts make up the system, and what causes pitch bend.',
        start: 'Read the first card and say your answer before you tap an option. If you land on ✗, read why, then choose again until you reach ✓.',
      },
      seeing: [
        'Four decisions about how a drum makes its sound, one card at a time.',
        'Your first answer on each card is the one remembered. If you try again, you still get the explanation, with no penalty.',
      ],
      control: DECK_CONTROL,
      changes: [
        'A card is done once you reach its right option. Reach it on all four and this chapter is complete.',
      ],
      teaches: [
        'What one rod out of line does to a drum’s sound, why a pitch tuner struggles to read a drum, which parts make up the system, and what makes the pitch bend after a hit.',
      ],
      tryThis: [
        'On the one-rod card, say what you heard on Turn one rod before you tap. Then check your answer against the explanation.',
        'Missed the tuner-app card? Go back to Tension and pitch and read the line on uneven overtone ratios.',
      ],
    },
    // REVIEW
    {
      intro: {
        learning: 'The core of Chapter 1 in one place: a drum as a system, how tension sets pitch, why one rod causes a warble, and the four qualities of every hit.',
        start: 'Read YOUR RUN to see your rod turns and decisions. Then answer each SAY IT BEFORE YOU READ IT card in your head before you tap it.',
      },
      seeing: [
        'YOUR RUN: what you did in this chapter, the rod turns and the decisions.',
        'Below: SAY IT BEFORE YOU READ IT cards, KEY IDEAS, KEY TERMS and a TRY NEXT. At the end: the TAKEAWAY, and what completes this chapter.',
      ],
      control: REVIEW_CONTROL,
      changes: [
        'YOUR RUN updates from what you did in this chapter. Nothing on this page changes the drum.',
        'Once you’ve met what this chapter asks, it stays complete. Reading the review never undoes it.',
      ],
      teaches: [
        'How a drum works as a system of heads, shell, edges, hoops, rods, lugs and air, and how tension sets its pitch.',
        'What one rod does to its own lug and to the whole head, and the four qualities a tuner listens for in every hit.',
      ],
      tryThis: [
        'Do the TRY NEXT: on Turn one rod, turn two opposite rods the same amount in opposite directions. The average lug pitch, and so the drum’s pitch, stays put.',
        'Answer each recall card aloud before you tap it, and back it up with a number you saw in this chapter, like BEND +35 ¢ or SPREAD 21 ¢.',
      ],
    },
  ],

  /* ── CHAPTER 2 · Prepare before tuning ──────────────────────────────────── */
  prepare: [
    // LEARN · Identify the drum and goal
    {
      intro: {
        learning: 'Why you name the drum and the sound you want before turning any rod: each drum’s size and type set the band where it responds well.',
        start: 'Step DRUM through SNARE, RACK, FLOOR and KICK. Watch the drawing resize and RESPONDS move, from RACK’s 130–260 Hz down to KICK’s 45.0–90.0 Hz.',
      },
      seeing: [
        'The drum you’re about to tune, from above, drawn to size.',
        'DRUM, SIZE and LUGS describe it. RESPONDS is this lab’s starting band for the batter’s own pitch: where to begin listening.',
        'Below: cards on size and type, and on playing style and the sound you want.',
      ],
      control: [
        'DRUM: step through SNARE, RACK, FLOOR and KICK, or tap for the list.',
      ],
      changes: [
        'Each drum redraws to its size, with its own lug count and band.',
        'Size and type set where a drum responds well; RESPONDS is a place to start listening, not a rule.',
      ],
      teaches: [
        'Know what you are tuning, and for what, before a rod turns.',
        'A snare is two heads plus wires, and both shape its sound. A bass drum’s sound depends on its beater and on what you do with the front head.',
      ],
      tryThis: [
        'Step DRUM through all four. RACK reads 12" × 8", 6 lugs, RESPONDS 130–260 Hz. KICK’s band sits lowest: RESPONDS 45.0–90.0 Hz.',
        'Read the playing-style card, then decide what you’d want from this drum: a short, dry note or an open, ringing one.',
      ],
    },
    // LEARN · Inspect the hardware (reading)
    {
      intro: {
        learning: 'Why hardware faults often sound like tuning faults, and what can go wrong with the rods, lugs, hoops, head and bearing edge before you tune.',
        start: 'Under BEFORE TUNING, LOOK — TAP A PART, tap RODS, then each of the other keys. Read what the card tells you to look for on each part.',
      },
      seeing: [
        'HARDWARE shows the cut-away drum with the part you chose lit up. Tap ⤢ FULL SCREEN under it to open the figure full screen.',
        'Under BEFORE TUNING, LOOK — TAP A PART are five keys, RODS, LUGS, HOOPS, HEAD and EDGE, and a card on what to check.',
      ],
      control: [
        'Tap a part key: the drawing lights it and the card says what to look for. The same keys sit under the figure in full screen.',
      ],
      changes: [
        'Each part fails in its own way: a rod that backs out, a stripped insert (the threaded part inside the lug), a bent hoop, a worn head, grit on the edge.',
      ],
      teaches: [
        'Hardware faults often sound like tuning faults — check the hardware first.',
      ],
      tryThis: [
        'Tap HOOPS and read the table test: a flat hoop touches all the way around.',
        'Tap EDGE: grit between head and edge is a buzz or a dead spot that LOOKS like a tuning problem.',
      ],
    },
    // LEARN · Seat and tension a new head
    {
      intro: {
        learning: 'Why a new head is seated and then brought up in an opposing star pattern, so the hoop stays level and the head rises evenly instead of wrinkling.',
        start: 'Set LUGS to 8 and press ▶ RUN. Follow THIS ROD and NEXT as the pattern jumps across the drum, then slide STEP to walk it at your own pace.',
      },
      seeing: [
        'The drum shows the order to tighten the rods on a new head.',
        'LUGS is how many rods the head has. STEP is where you are in the pattern; THIS ROD is the one to turn now, and NEXT the one after.',
        'Below: cards on seating, on why you work across opposite rods, and the CAUTION card.',
      ],
      control: [
        'STEP fader: walk the pattern by hand. ▶ RUN (or a tap on the display) plays it, one rod every 0.6 s; ■ PAUSE stops it.',
        'LUGS: 6, 8 or 10 lugs — each has its own pattern.',
      ],
      changes: [
        'Opposite rods are tightened in turn, so the hoop stays parallel to the edge and the head rises evenly.',
        'Tightening neighbors in a row pulls one side down first and wrinkles the head.',
      ],
      teaches: [
        'A new head is seated first, then brought up in an opposing (star) pattern, a half turn per rod each round.',
        'A head has a working range: stop when the pitch stops rising.',
      ],
      tryThis: [
        'On 8 LUGS press ▶ RUN: THIS ROD reads #1, NEXT #5 — then 3, 7, 2, 6, 4, 8.',
        'Switch to 6 LUGS and slide STEP: three opposite pairs, 1 → 4 → 2 → 5 → 3 → 6.',
      ],
    },
    // HEAR · Start from a known condition
    {
      intro: {
        learning: 'Why you start with every rod finger-tight and come up evenly: even rounds keep one pitch across the head, while random turns leave it warbling.',
        start: 'On EVEN STEPS, slide STEP to 8 and tap ▶ STRIKE. Then flip the key to RANDOM, still at step 8, and strike again to hear the difference.',
      },
      seeing: [
        'This is the floor tom head, brought up two ways: in even rounds or with big random turns. The wedges show each lug’s pitch.',
        'APPROACH names the method and STEP how far you’ve gone. SPREAD is the cents between the highest and lowest lug; PITCH is the drum’s note.',
      ],
      control: [
        'STEP fader: from finger-tight (the known condition) through eight moves.',
        'EVEN STEPS / RANDOM key: switches the approach. ▶ STRIKE, or a tap on the display, plays the drum.',
      ],
      changes: [
        'EVEN STEPS turns every rod a quarter turn per round: the head rises as one color and SPREAD stays 0 ¢.',
        'RANDOM makes big turns on single rods: the map goes mottled, SPREAD climbs to hundreds of cents and the strike warbles.',
      ],
      teaches: [
        'Start from a known condition — every rod finger-tight — and come up evenly.',
        'When a drum is a mess, back every rod off and start again rather than chase one lug.',
      ],
      tryThis: [
        'On EVEN STEPS slide STEP to 8: SPREAD 0 ¢, PITCH 156 Hz. ▶ STRIKE: a clean note.',
        'Flip to RANDOM at step 8: SPREAD 880 ¢, PITCH 137 Hz. ▶ STRIKE: the warble.',
      ],
    },
    // PRACTICE · Preparation checklist
    {
      intro: {
        learning: 'An inspection routine before tuning, head, every rod, the edge, then the tension map, and why a loose rod and an uneven head look alike on the map.',
        start: 'Use INSPECT to walk the snare: HEAD, then ROD 1 to ROD 10, then EDGE. Look at MAP last, then tap each checklist line you think is a fault.',
      },
      seeing: [
        'A snare with one to three things wrong. The dashed ring is where you’re looking; a fault is drawn only once you’ve looked there.',
        'LOOKING AT names the spot. WALKED and FLAGGED track your inspection, and KEY stays hidden until you reveal it.',
        'Below: what you see there, and the checklist of four faults.',
      ],
      control: [
        'INSPECT: walk the drum — HEAD, ROD 1 to ROD 10, EDGE and MAP.',
        'Tap a checklist line to flag that fault (tap again to unflag).',
        '✓ REVEAL KEY shows the answers; ↺ NEW DRUM deals another drum.',
      ],
      changes: [
        'Each place you inspect says what is there. The map shows only when you look at it.',
        'The key marks every line right or wrong. A correct inspection finds every fault and flags nothing extra.',
      ],
      teaches: [
        'An inspection follows the same routine every time: the head, every rod, the edge, then the tension map, so nothing gets skipped.',
        'A loose rod and an uneven head look alike on the map — walking the rods tells them apart.',
      ],
      tryThis: [
        'Walk every ROD before you look at MAP, then flag and ✓ REVEAL KEY.',
        'Missed one? Tap ↺ NEW DRUM for another snare and walk every rod again before you look at MAP.',
      ],
    },
    // REVIEW
    {
      intro: {
        learning: 'Why preparation comes before tuning: know the drum and the sound you want, rule out hardware faults, then bring the head up evenly from finger-tight.',
        start: 'Read YOUR RUN to see the drums you checked. Then answer each SAY IT BEFORE YOU READ IT card in your head before you tap it.',
      },
      seeing: [
        'This is your Chapter 2 summary. YOUR RUN shows the drums you checked for faults and where you left the head on Start from a known condition.',
        'Below: SAY IT BEFORE YOU READ IT cards, KEY IDEAS, KEY TERMS and a TRY NEXT. At the end: the TAKEAWAY, and what completes this chapter.',
      ],
      control: REVIEW_CONTROL,
      changes: [
        'YOUR RUN updates from what you did in this chapter. Nothing on this page changes the drum, so you can reread it as often as you like.',
      ],
      teaches: [
        'Good tuning starts before a rod turns: know which drum it is and the sound you want, then check rods, lugs, hoops, head and edge, because hardware faults often sound like tuning faults.',
        'How a new head is seated and brought up in a star pattern from finger-tight, every lug starting from the same known condition.',
      ],
      tryThis: [
        'Before you tap the star-pattern card, say the 8-lug order out loud from memory. Then tap the card and check.',
        'Do the TRY NEXT: on the Preparation checklist, walk every rod before you look at the map. A loose rod and an uneven head can look alike there.',
      ],
    },
  ],

  /* ── CHAPTER 3 · The basic tuning method ────────────────────────────────── */
  method: [
    // LEARN · The seven steps
    {
      intro: {
        learning: 'The order of the tuning method, from seating the head to playing from the seat, and why you even out the head before you choose its pitch.',
        start: 'Move STEP from SEAT through to OTHER and read each card. Stop at TAP and notice where the stick lands near each rod.',
      },
      seeing: [
        'You’re looking at the floor tom at each stage of the tuning method: pulled apart for seating, the star order, a tap at each lug, then the stroke at the center.',
        'STEP and DO name the stage you’re on. HEAD shows which head you’re working on: BATTER, until the last step switches to RESONANT.',
      ],
      control: [
        'Move STEP through SEAT, FINGER, STAR, TAP, ADJUST, PLAY and OTHER, or tap it to open the list with one line on each stage. Read each stage’s card below the drawing as you go.',
      ],
      changes: [
        'Each stage redraws the drum, and its card tells you what you do there.',
        'At TAP, the stick lands about an inch in from the rim at each rod. The pitch there is set mostly by the tension at that one rod, so each tap tells you about that lug.',
      ],
      teaches: [
        'The method runs in order: seat the head, finger-tighten, tighten in a star pattern, tap near each lug, make small adjustments, play from the seat, then do the other head.',
        'Even first, the pitch you want second. An uneven head sounds two slightly different notes that warble, whatever pitch you aim for.',
      ],
      tryThis: [
        'Move STEP to ADJUST. The map shows an uneven head; evening it out is the job of the next two steps, Tap near each lug and Tune the head.',
        'Read the CAUTION card: use a drum key and your fingers only, and stop when the pitch stops rising.',
      ],
    },
    // HEAR · Tap near each lug
    {
      intro: {
        learning: 'How to hear which part of a head is out of line by tapping near each lug with the same light stroke, before any map tells you.',
        start: 'Pick a lug with LUG and tap ▶ TAP. Go around all eight lugs, pick the one you heard highest, then tap ◉ REVEAL MAP.',
      },
      seeing: [
        'This head is uneven, but its color map is hidden, so your ears do the work. The ● marks where the stick taps, near the lug you pick.',
        'LUG shows which lug you’re on, and TAPPED counts the lugs you’ve heard. LUG PITCH and SPREAD stay hidden until you reveal the map.',
      ],
      control: [
        'Pick a lug with LUG, then tap ▶ TAP, or tap the display, to hear it.',
        'Once every lug has sounded, pick the one you heard as highest, then tap ◉ REVEAL MAP. If you reveal before you’ve tapped every lug, you’re asked to tap them all first.',
      ],
      changes: [
        'A lug counts in TAPPED only once its tap has actually played, so keep your sound on.',
        'Your ear comes first, the numbers second. ◉ REVEAL MAP shows the colors and numbers and checks your pick; it never counts against you.',
      ],
      teaches: [
        'You can find the odd lugs by ear if every tap is the same: the same spot near the rod and the same light stroke. Then any change in pitch you hear comes from the tension at that lug.',
      ],
      tryThis: [
        'Tap all eight lugs, pick the one you heard highest, then tap ◉ REVEAL MAP. The map says lug 2, SPREAD 195 ¢: almost two semitones between highest and lowest.',
        'Tap lug 2, then its opposite, lug 6, back to back. Listen for the gap between the two pitches.',
      ],
    },
    // ADJUST · Tune the head
    {
      intro: {
        learning: 'How small, opposing turns bring every lug to the same pitch, so the head becomes even without its overall pitch moving far.',
        start: 'Tap ▶ SHOW ME A MOVE and watch SPREAD. Then pick a red or blue lug with LUG, slide TURN a little, and ▶ TAP to hear it move.',
      },
      seeing: [
        'You’re evening out this head. The key sits on the rod you chose, and each wedge shows that lug’s pitch: blue is low, yellow is even, red is high.',
        'THIS RUN is how far you’ve turned the chosen rod. SPREAD is the gap between the highest and lowest lug; HEAD says which head you’re on.',
      ],
      control: [
        'Pick the rod with LUG, then slide TURN to move it in sixteenths of a turn; 0 is where you found it. Switch heads with BATTER / RESO.',
        '▶ TAP plays one lug so you can hear just that spot; ▶ STRIKE plays the whole drum.',
        'In the notes, ▶ SHOW ME A MOVE makes a move for you, for your first two moves on the batter. ↺ NEW HEADS gives you a fresh pair to practice on.',
      ],
      changes: [
        'Tighten a low rod and its pitch rises; loosen a high one and it falls. As the lugs agree, SPREAD shrinks and the wedges turn yellow.',
        'On the batter, the feedback names the rod, the direction and how far. On the resonant head it doesn’t, so you find them by ear.',
      ],
      teaches: [
        'You even a head with small moves in both directions: raise the low lugs and lower the high ones, so they meet in the middle and the overall pitch stays about where it was.',
        'In this lab the batter counts as even when every lug is within 10 cents, a tenth of a semitone.',
      ],
      tryThis: [
        'Tap ▶ SHOW ME A MOVE. The furthest-out rod moves, and you’re told how its wedge and SPREAD changed. ▶ TAP that lug to hear the difference.',
        'Keep going until SPREAD reads 10 ¢ or less and the map is one color. Then switch to RESO and even that head by ear.',
      ],
    },
    // REVIEW
    {
      intro: {
        learning: 'How the basic method fits together: find the odd lugs by ear, even them with small opposing moves, then judge the drum by playing it.',
        start: 'Read YOUR RUN and compare each head’s SPREAD before and after. Then answer each SAY IT BEFORE YOU READ IT card in your head before you tap it.',
      },
      seeing: [
        'This is your Chapter 3 summary. YOUR RUN shows each head’s SPREAD before and after you tuned it, how many moves you made, and the lug you picked as highest by ear.',
        'Below: SAY IT BEFORE YOU READ IT cards, KEY IDEAS, KEY TERMS and a TRY NEXT. At the end: the TAKEAWAY, and what completes this chapter.',
      ],
      control: REVIEW_CONTROL,
      changes: [
        'YOUR RUN updates from Tap near each lug and Tune the head. Nothing on this page changes the drum.',
        'Compare each head’s SPREAD before and after: the drop shows how much more even your moves made it.',
      ],
      teaches: [
        'The basic method: tap near each rod, match the pitches with small opposing moves, then play the drum from the seat, where you judge the sound the player actually hears.',
        'Your ear finds the odd lug; SPREAD only confirms what you heard.',
      ],
      tryThis: [
        'Do the TRY NEXT: on Tune the head, tap ↺ NEW HEADS and even the resonant head first, by ear, with no feedback naming the rod.',
        'Before you tap the card “A lug taps 30 cents high — which way?”, say your answer out loud. Then tap it and check.',
      ],
    },
  ],

  /* ── CHAPTER 4 · Tuning the whole drum ──────────────────────────────────── */
  whole: [
    // LEARN · Three relationships (reading)
    {
      intro: {
        learning: 'Why a drum’s two heads act as one instrument, linked by the air inside, and how the resonant head’s pitch against the batter changes the sound.',
        start: 'Tap THE AIR figure to see it full screen. Then scroll through the three relationships and guess which one will ring longest.',
      },
      seeing: [
        'THE AIR shows the drum cut in half with the air inside lit up. That air is the link between the two heads.',
        'Below, TWO HEADS, ONE INSTRUMENT gives three relationships: resonant higher than batter, both heads equal, and batter higher than resonant. The last card says none of these is the correct one.',
      ],
      control: [
        'Scroll to read the cards. Tap the figure to see it full screen. On the next step, Compare head relationships, you hear all three on one drum.',
      ],
      changes: [
        'When you hit the batter, it pushes the air, the air pushes the resonant head, and the two heads pass the sound back and forth.',
        'Where the resonant head sits against the batter decides where that energy goes and how long the drum rings.',
      ],
      teaches: [
        'The resonant head is half the sound: its pitch against the batter shapes the sustain and whether the note settles higher or lower as it fades.',
        'That’s why players describe the pitch bend in opposite ways. Each relationship is a sound to choose, not a rule.',
      ],
      tryThis: [
        'Read each relationship and guess which one will ring longest. Then test your guess on the next step, Compare head relationships.',
        'Open THE AIR full screen and follow the air between the heads: it’s the path the sound travels back and forth on.',
      ],
    },
    // HEAR · Compare head relationships
    {
      intro: {
        learning: 'How the pitch gap between batter and resonant head changes how long a tom rings, and whether its note settles higher or lower as it fades.',
        start: 'Tap SET → RESO ↑ and ▶ STRIKE, then read SUSTAIN. Do the same with EQUAL and BATTER ↑, and compare.',
      },
      seeing: [
        'You see one hit of the tom; the green mark shows where it has died away. The label names the two main notes the drum sounds.',
        'BATTER and RESO are each head’s own pitch, and REL is the gap in semitones. SUSTAIN is how long it rings; LATE SOUND is where the note sits at 0.9 s, against the batter.',
      ],
      control: [
        'Slide BATTER and RESO to set each head’s own pitch.',
        'Tap SET for a quick start: RESO ↑ puts the resonant head 3 semitones above the batter, EQUAL matches them, and BATTER ↑ puts it 3 semitones below.',
        'Switch VIEW between WAVE, PITCH and VIBRATE. Tap ▶ STRIKE, or tap the display, to play the drum.',
      ],
      changes: [
        'Heads near the same pitch pass the sound back and forth, so it lasts; heads further apart let it leave sooner. Strike all three and judge which rings longest.',
        'With the resonant head high, the note is quicker and more focused and settles above the batter. With it low, the late sound settles lower.',
        'Once you’ve struck all three, WHICH ONE RANG LONGEST? appears.',
      ],
      teaches: [
        'The pitch gap between the two heads sets how long the drum sustains and where the note ends up as it fades.',
        'SUSTAIN here is estimated from a synthesized hit of a model drum, not measured on a real one. On a real drum, your ears make the call.',
      ],
      tryThis: [
        'Tap SET → RESO ↑: RESO reads 226 Hz and REL +3.0 st. ▶ STRIKE and note SUSTAIN.',
        'Now try EQUAL, then BATTER ↑ (RESO 160 Hz), striking each. Then answer which one rang longest.',
        'Switch VIEW to PITCH and strike on BATTER ↑. Watch where the late sound settles compared with the batter.',
      ],
    },
    // LEARN · Why the same tuning sounds different (reading)
    {
      intro: {
        learning: 'Why one tuning can sing on one drum and thud on another: size, construction, head choice and playing style all change the result.',
        start: 'Scroll through the four cards under IT DEPENDS — AND HERE IS ON WHAT. Start with Size, then think of two drums you know.',
      },
      seeing: [
        'Under IT DEPENDS — AND HERE IS ON WHAT, four cards explain why the same tuning sounds different on different drums: Size, Construction, Head choice and Playing style.',
      ],
      control: [
        'Scroll to read the four cards. When you’re done, NEXT › on the strip opens the decision cards that check your understanding.',
      ],
      changes: [
        'Change one thing about the drum and the same head relationship sounds different: a deeper shell, a bigger head, a different hoop, a thicker head or a harder stroke.',
      ],
      teaches: [
        'A setting that sings on one drum can thud on another, because size, construction, heads and playing style all shape the result.',
        'So a pitch number copied from another drum is only a starting point. You listen to the drum in front of you.',
      ],
      tryThis: [
        'Think of two drums you know. How do their size and heads differ? Then read the Size card again with them in mind.',
        'Go back one step to Compare head relationships and hear the three relationships again with these cards in mind.',
      ],
    },
    // PRACTICE · Check your understanding
    {
      intro: {
        learning: 'What you know about two heads as one instrument: whether any relationship is the correct one, and what makes a drum sustain.',
        start: 'Read the first card and say your answer before you tap. Then use NEXT CARD › to work through all three.',
      },
      seeing: [
        'Three decision cards check what you’ve learned about the two heads working together, one card at a time.',
        'Your first answer on each card is the one remembered. If you try again, you still get the explanation, with no penalty.',
      ],
      control: DECK_CONTROL,
      changes: [
        'A card counts once you reach the option that fits. Together, the cards are part of what completes this chapter.',
      ],
      teaches: [
        'Whether any head relationship is the correct one, which relationship keeps a drum ringing longest, and how a drum’s size and construction change the result.',
      ],
      tryThis: [
        'Before you tap, think back to Compare head relationships: which setting rang longest for you? Say your answer, then check it against the explanation.',
        'Picked a wrong option? Read why it isn’t the best fit for two heads working together before you choose again.',
      ],
    },
    // REVIEW
    {
      intro: {
        learning: 'How the resonant head’s pitch against the batter shapes sustain and where the note settles, and how you choose between the relationships.',
        start: 'Read YOUR RUN and compare the SUSTAIN of each relationship you heard. Then answer each SAY IT BEFORE YOU READ IT card before you tap it.',
      },
      seeing: [
        'This is your Chapter 4 summary. YOUR RUN lists the relationships you heard with their SUSTAIN, your answer on which rang longest, and your decision cards.',
        'Below: SAY IT BEFORE YOU READ IT cards, KEY IDEAS, KEY TERMS and a TRY NEXT. At the end: the TAKEAWAY, and what completes this chapter.',
      ],
      control: REVIEW_CONTROL,
      changes: [
        'YOUR RUN updates from what you heard and answered in this chapter. Nothing on this page changes the drum.',
        'Read the SUSTAIN values side by side: on the same tom, the head relationship alone changed how long it rang.',
      ],
      teaches: [
        'The resonant head is half the instrument. How it sits against the batter shapes the sustain and where the note settles as it fades.',
        'How you choose between the three relationships, and whether any one of them is correct.',
      ],
      tryThis: [
        'Do the TRY NEXT: on Compare head relationships, move RESO slowly from 3 st below the batter to 3 st above, striking as you go. Listen for where it rings longest.',
        'Answer “Is one relationship the correct one?” aloud, then tap the card to check.',
      ],
    },
  ],

  /* ── CHAPTER 5 · Tuning each drum type ──────────────────────────────────── */
  types: [
    // LEARN · Snare drum
    {
      intro: {
        learning: 'How a snare’s parts share the work: the batter sets feel and pitch, while the bottom head and strainer set how the wires respond.',
        start: 'Tap ▶ STRIKE to hear the starting snare. Then move BOTTOM from +400 ¢ to +700 ¢ and strike again, listening to the wires.',
      },
      seeing: [
        'You’re looking at the snare from the side. The wires hang under the bottom head, the stick’s height shows the stroke, and B and S mark the two heads’ pitches.',
        'BATTER and SNARE SIDE are the two heads’ pitches. STRAINER shows how tight the wires are pulled; SUSTAIN shows how long the drum rings.',
      ],
      control: [
        'STRAINER sets the wire tension, from thrown off to tight.',
        'BOTTOM sets the snare-side head from −200 to +900 ¢ against the batter. BATTER sets the top head’s own pitch.',
        'STROKE runs from a ghost note (a very soft stroke) to a hard hit.',
        'Tap ▶ STRIKE, or tap the display, to play the snare.',
      ],
      changes: [
        'The wires rattle only when the bottom head moves them past the strainer’s threshold.',
        'Too tight a strainer loses ghost notes and chokes the drum; too loose and the wires buzz at everything.',
        'The batter sets the feel and pitch; the bottom head and strainer set how the wires respond.',
      ],
      teaches: [
        'A snare is two heads, a set of wires and a strainer. The batter gives the feel and pitch; the bottom head and strainer decide how easily the wires respond, from ghost notes to hard hits.',
      ],
      tryThis: [
        'At the start SNARE SIDE reads 290 Hz (BOTTOM +400 ¢). Move BOTTOM to +700 ¢: 345 Hz. Strike at each setting and compare the wires.',
        'Set STROKE low for a ghost note, then move STRAINER tight and loose, striking each time. Listen for when the wires vanish.',
        'Bring STRAINER under 10 %: it reads OFF. Strike to hear the two heads alone, with no wires.',
      ],
    },
    // LEARN · Toms (reading)
    {
      intro: {
        learning: 'Why toms are tuned as a set, each in the range where it responds best, and what happens when a tom is forced too high or too low.',
        start: 'Scroll through the three TOMS cards. Read the range card closely: it explains what happens when a tom is pushed out of its range.',
      },
      seeing: [
        'Under TOMS, three cards: get each head even, then set the relationship between them; build a useful progression across the kit; and don’t force a drum out of its range.',
      ],
      control: [
        'Scroll to read the three cards. NEXT › on the strip moves on to the bass drum.',
      ],
      changes: [
        'On a tom, the resonant head shapes much of the sustain and bend. So how it sits against the batter is the main tone decision you make.',
      ],
      teaches: [
        'Toms are tuned as a set: each one where it responds best, with a useful step from one tom to the next.',
        'Push a tom too high and it chokes; pull it too low and the head wrinkles and flaps.',
      ],
      tryThis: [
        'Read the range card, then picture your own toms, or ones you’ve heard, from lowest to highest. Where does each one sound its best?',
        'Coming up, Tune a drum for a sound lets you tune a tom toward a stated sound. Keep the range card in mind there.',
      ],
    },
    // LEARN · Bass drum
    {
      intro: {
        learning: 'How a bass drum’s sound comes from three choices: the front head, the damping inside and the beater stroke, and why a damped kick is a different instrument.',
        start: 'Tap ▶ STRIKE on PORTED, then switch FRONT to CLOSED and NO FRONT, striking each. Watch SUSTAIN change.',
      },
      seeing: [
        'You’re looking at the bass drum from the side, with the pedal on the right. When you strike, the beater swings in to hit the batter.',
        'FRONT shows the front head choice, PILLOW how much damping is inside, BATTER the batter’s pitch, and SUSTAIN how long the note rings.',
      ],
      control: [
        'FRONT picks the front head: CLOSED, PORTED (a hole cut in it) or NO FRONT.',
        'PILLOW runs from nothing inside the drum up to a pillow against the batter.',
        'BATTER sets the batter’s own pitch. BEATER sets the stroke, from soft to hard.',
        'Tap ▶ STRIKE, or tap the display, to play the drum.',
      ],
      changes: [
        'FRONT sets how strongly the two heads are linked through the air inside: CLOSED gives the longest note, NO FRONT the shortest.',
        'More PILLOW shortens the decay and takes away the overtones first.',
        'A harder BEATER makes the hit louder, with more click and a deeper pitch bend.',
      ],
      teaches: [
        'A bass drum is a beater, a low note and a front-head decision. A damped kick isn’t a worse drum, just a different instrument: a short, punchy note instead of a long boom.',
      ],
      tryThis: [
        'With PILLOW at 40 %, strike on PORTED, then CLOSED, then NO FRONT. Compare SUSTAIN each time.',
        'Take PILLOW to 0 and strike again. Hear the note open up as the damping comes out.',
      ],
    },
    // PRACTICE · Tune a drum for a sound
    {
      intro: {
        learning: 'How tuning and damping work together to set a drum’s pitch, sustain and bend, and how a stated sound decides which way you move each one.',
        start: 'Pick GOAL BEND with the rack tom. Lower BATTER a little, tap ▶ STRIKE, then tap ✓ CHECK and read which way it tells you to move.',
      },
      seeing: [
        'You’re tuning toward a stated sound. The shaded zone shows where the green died-away mark has to land to meet the goal.',
        'After each hit, read GOAL, PITCH, SUSTAIN and BEND. MET counts the goals you’ve met so far.',
      ],
      control: [
        'BATTER, RESO and DAMPING faders tune and damp the drum.',
        'GOAL: SHORT, OPEN, LOW or BEND — each starts the drum where it fails.',
        'Tap ▶ STRIKE to hear the drum, then ✓ CHECK to have your current setting judged.',
        'In the notes, SNARE / RACK / FLOOR / KICK picks the drum you practice on.',
      ],
      changes: [
        'Every goal starts from a drum that fails it, so you always have to move something to get there.',
        '✓ CHECK judges sustain, pitch, bend and overtones, then tells you which way to move. Meet two goals to complete this step.',
      ],
      teaches: [
        'Tuning and damping are both choices; the sound you’re asked for decides them.',
        'Bend is the glide down in pitch right after the hit.',
        'The bands (short ≤ 0.55 s, open ≥ 0.9 s, bend ≥ 35 cents) are this lab’s teaching thresholds, not industry rules.',
      ],
      tryThis: [
        'Pick GOAL BEND on the rack tom: PITCH 260 Hz, BEND +32 ¢ — just under the 35-cent line. Lower BATTER, strike, then ✓ CHECK.',
        'On SHORT, raise DAMPING, strike, then ✓ CHECK and read which way to move.',
      ],
    },
    // PRACTICE · Check your understanding
    {
      intro: {
        learning: 'Three tuning decisions across drum types: what sets how snare wires respond, how to judge a damped kick, and what happens to a tom pushed out of range.',
        start: 'Read the first card and say your answer before you tap an option. If you get ✗, read why, then choose again. NEXT CARD › brings up the next decision.',
      },
      seeing: [
        'Three decisions, one card at a time, about the snare, the bass drum and the toms you met in this chapter.',
        'Your first answer on each card is the one remembered. If you try again, you still get the explanation, with no penalty.',
      ],
      control: DECK_CONTROL,
      changes: [
        'A card counts once you reach the option that fits. Together, the cards are part of what completes this chapter.',
      ],
      teaches: [
        'What sets how a snare’s wires respond, whether a damped bass drum is a worse drum, and what happens to a tom pushed out of its range.',
      ],
      tryThis: [
        'Before you tap the snare card, picture a soft ghost note and say where you would look first. Then tap and read the explanation.',
        'Missed a card? Go back to its step in this chapter — Snare drum, Toms or Bass drum — and read the line it was built on.',
      ],
    },
    // REVIEW
    {
      intro: {
        learning: 'How one way of listening serves different goals: which parts of a snare set its feel and its wire sensitivity, and what shapes a kick’s sound.',
        start: 'Read YOUR RUN to see which goals you met. Then say each SAY IT BEFORE YOU READ IT answer in your head before you tap the card.',
      },
      seeing: [
        'YOUR RUN sums up this chapter: the goals you met and the ones not met yet, your checks, and your decisions.',
        'Below: SAY IT BEFORE YOU READ IT cards, KEY IDEAS, KEY TERMS and a TRY NEXT. At the end: the TAKEAWAY, and what completes this chapter.',
      ],
      control: REVIEW_CONTROL,
      changes: [
        'YOUR RUN updates from what you did on Tune a drum for a sound and the check cards. Nothing on this page changes the drum.',
      ],
      teaches: [
        'Snare: which part sets the feel, and which parts set how sensitive the wires are.',
        'Bass drum: the beater, a low note and the front head shape the sound.',
        'Every drum type uses the same listening, aimed at a different goal.',
      ],
      tryThis: [
        'Do the TRY NEXT: meet SHORT with damping alone, then with no damping and the resonant head 4 st (semitones) away. Do the two short notes sound alike?',
        'Before you tap the snare card, say where you’d look when soft strokes give no wires.',
      ],
    },
  ],

  /* ── CHAPTER 6 · Tuning a kit ───────────────────────────────────────────── */
  kit: [
    // LEARN · A range for every drum (reading)
    {
      intro: {
        learning: 'Why a kit is tuned as a set: each drum in the range where it responds, clear steps between the toms, and a recheck in the music after any move.',
        start: 'Scroll through the five TUNING AS A SET cards. On the separation card, hum two notes a third apart, then two a fifth apart.',
      },
      seeing: [
        'TUNING AS A SET gives you five cards: a practical range for each drum, separation between the toms, listening in the music, rechecking after a move, and writing it down.',
        'Read them as one idea: here you tune the whole kit, not one drum at a time.',
      ],
      control: [
        'Scroll to read the cards. Then tap NEXT › on the strip to open Build the tom range, where you space two toms yourself.',
      ],
      changes: [
        'Toms tuned too close together crowd each other; spread too far apart, the kit sounds like unrelated drums instead of one set.',
      ],
      teaches: [
        'A kit is tuned as a set: each drum where it responds, clear steps between the toms, checked with the band.',
      ],
      tryThis: [
        'Read the separation card, then hum two notes a third apart and two a fifth apart.',
        'Read the recheck card: temperature, humidity and a van ride all move tuning.',
      ],
    },
    // ADJUST · Build the tom range
    {
      intro: {
        learning: 'How far apart two toms need to be, in semitones, to keep their own voices, and why spacing them too close or too wide both weaken the kit.',
        start: 'The kit starts with the floor tom above the rack: INTERVAL −2.3 st, UNBALANCED. Move FLOOR to 110 Hz and RACK to 165 Hz, then tap ▶ BOTH.',
      },
      seeing: [
        'Two toms and a ladder of their pitches. The bracket between them turns green when the step between them works.',
        'The kit starts upside down: the floor tom sounds higher than the rack tom.',
        'Read RACK, FLOOR, INTERVAL and VERDICT. INTERVAL is the gap in semitones (st), the steps between piano keys; 12 make an octave.',
      ],
      control: [
        'RACK fader: the 12" rack tom, 100–300 Hz. FLOOR fader: the 16" floor tom, 70–220 Hz.',
        '▶ RACK and ▶ FLOOR play one tom each; ▶ BOTH plays the rack, then the floor. A tap on the display plays both or stops.',
      ],
      changes: [
        'DISTINCT: about 2.5 to 9 semitones between them, both drums in their bands.',
        'CLOSE: less than that, so the two toms crowd together. UNBALANCED: a drum is out of its band, the floor sits above the rack, or the gap is too wide.',
        'Reach DISTINCT and hear ▶ BOTH to complete this step.',
      ],
      teaches: [
        'Toms need clear space between them so each keeps its own voice. 7 semitones, for example, is a musical fifth.',
        'These bands are for learning; your ears and your music set the real ones.',
      ],
      tryThis: [
        'At the start INTERVAL reads −2.3 st, UNBALANCED. Move FLOOR to 110 Hz and RACK to 165 Hz: 7.0 st, DISTINCT. ▶ BOTH.',
        'Push RACK to 200 Hz: 10.3 st, UNBALANCED — too wide. At 140 / 130 Hz: 1.3 st, CLOSE.',
      ],
    },
    // PRACTICE · Save tuning notes (reading)
    {
      intro: {
        learning: 'Why drummers and engineers write a tuning down: the pitches, the heads and the room let you get back to a sound that worked.',
        start: 'Type a NAME for this setup, such as the room you play in, add a NOTE on what worked, then tap SAVE THIS SETUP.',
      },
      seeing: [
        'TUNING NOTES holds a NAME, a NOTE, the rack and floor pitches you set on Build the tom range, and SAVE THIS SETUP.',
        'Below: your notes, each with LOAD and DELETE.',
      ],
      control: [
        'Type a name and a note, then SAVE THIS SETUP.',
        'LOAD puts a note’s pitches back on the RACK and FLOOR faders. DELETE asks before it removes a note.',
      ],
      changes: [
        'Your notes are saved on this device. The list keeps the newest notes and tells you when it drops the oldest.',
        'If the lab can’t save, for example when you aren’t signed in, it tells you notes are kept for this session only.',
        'Saving the same pitches again with nothing typed adds no copy; the lab says that setup is already saved.',
      ],
      teaches: [
        'Writing a setup down lets you get back to it: the pitches, the heads, the room and what worked.',
        'Pitches alone aren’t the whole story; the same numbers can sound different on other heads or in another room.',
      ],
      tryThis: [
        'Name a setup after the room you play in and save it; then move the faders and LOAD it back.',
        'Go ‹ PREV, set a CLOSE pair and save it too. LOAD each note in turn, go ‹ PREV and play ▶ BOTH to hear the two spacings.',
      ],
    },
    // REVIEW
    {
      intro: {
        learning: 'How a kit holds together: each drum in the band where it responds, clear steps between the toms, and a final check while the music plays.',
        start: 'Read YOUR RUN for your final rack and floor pitches and their verdict. Then try each SAY IT BEFORE YOU READ IT card, answering in your head first.',
      },
      seeing: [
        'YOUR RUN shows your rack and floor pitches with their interval and verdict, the verdicts you reached on the way, and your tuning notes.',
        'Below: SAY IT BEFORE YOU READ IT cards, KEY IDEAS, KEY TERMS and a TRY NEXT. At the end: the TAKEAWAY, and what completes this chapter.',
      ],
      control: REVIEW_CONTROL,
      changes: [
        'YOUR RUN updates from what you did on Build the tom range and Save tuning notes. Nothing on this page changes the drums.',
      ],
      teaches: [
        'Each drum in the band where it responds; clear steps between the toms; listen in the music.',
        'Why tuning has to be rechecked after the kit moves.',
      ],
      tryThis: [
        'Do the TRY NEXT: find the widest interval that still sounds like one kit, then the narrowest that still sounds like two drums.',
        'Answer “Why recheck tuning after a van ride?” aloud, then tap the card.',
      ],
    },
  ],

  /* ── CHAPTER 7 · Advanced tuning and troubleshooting ────────────────────── */
  trouble: [
    // LEARN · Diagnosis by symptom (reading)
    {
      intro: {
        learning: 'Why each drum symptom has more than one possible cause, why you listen before you turn anything, and what a tuning device can and can’t decide.',
        start: 'Scroll through SYMPTOM → WHERE TO LOOK. Pick one row and say which area you’d check first. Then read BY EAR, BY REFERENCE, BY DEVICE.',
      },
      seeing: [
        'SYMPTOM → WHERE TO LOOK lists five symptoms, each with the areas worth checking.',
        'Below it, BY EAR, BY REFERENCE, BY DEVICE compares three ways to tune: by ear alone, against a pitch reference, and with a drum-tuning device.',
      ],
      control: [
        'Scroll to read. Then tap NEXT › on the strip: Diagnose the symptom puts five of these cases on a model drum for you to fix.',
      ],
      changes: [
        'Every symptom has more than one possible cause, so you don’t guess. Listen, say where the problem is, fix it, then strike again.',
      ],
      teaches: [
        'You diagnose by symptom before you turn anything.',
        'A device helps you repeat a setting; the ear decides whether it is right.',
      ],
      tryThis: [
        'Pick a row of the table and say which area you would check first — then see the case on the next step.',
        'Read the BY DEVICE card, then name one job a device does well and one it can’t do for you.',
      ],
    },
    // PRACTICE · Diagnose the symptom
    {
      intro: {
        learning: 'How to troubleshoot a drum by ear: listen first, name where the fault is, fix it, then read the evidence to check the fault is really gone.',
        start: 'Pick CASE WARBLE and tap ▶ STRIKE: SPREAD reads 226 ¢, BEAT 8.4 Hz. Then use the LUG fader and ▶ TAP on three lugs to hear where it’s uneven.',
      },
      seeing: [
        'A drum with a fault. The readouts are your evidence: VIEW, SPREAD (cents between the highest and lowest lug), BEAT (how fast the warble pulses), SUSTAIN and FAULT.',
        'FAULT reads STILL until the cause is fixed, then GONE.',
        'Below: the case’s symptom, the step you are on (LISTEN, WHERE IS IT? or FIX) and replies quoting the evidence.',
      ],
      control: [
        'CASE: WARBLE, CHOKED, RING, SNARE or DRIFT.',
        'The LUG fader picks where ▶ TAP lands. ▶ STRIKE (▶ SOFTLY on the snare case) plays the drum. VIEW: DRUM, WAVE or PARTS.',
        'The last key walks you through the method: HIT 1ST, then the taps still to do, then WHERE? to name an area, then FIX. ↺ RESET CASE deals the case again.',
      ],
      changes: [
        'Strike (and tap where needed) before you can name an area; then the fixes open.',
        'A fix that only treats the symptom leaves FAULT at STILL; the right one turns it GONE. Clear all five cases to complete this step.',
      ],
      teaches: [
        'Listen, name the area, fix — and read what changed.',
        'An uneven head splits its note into two close pitches; BEAT is how fast they pulse against each other.',
        'This drum is a model, but the same method works on a real drum in front of you.',
      ],
      tryThis: [
        'WARBLE: ▶ STRIKE — SPREAD 226 ¢, BEAT 8.4 Hz. Tap three lugs, name the area, then FIX. Strike again and watch FAULT.',
        'On RING try the gel, then ↺ RESET CASE and retune the resonant head: two fixes, two different sounds.',
      ],
    },
    // PRACTICE · Check your understanding
    {
      intro: {
        learning: 'What a tuning device can and can’t tell you about a drum, and where to look when tuning drifts.',
        start: 'Read the first card and say your answer before you tap an option. If you get ✗, read why, then choose again. NEXT CARD › brings up the second decision.',
      },
      seeing: [
        'Two decisions about tuning devices and drift, one card at a time.',
        'Your first answer on each card is the one remembered. If you try again, you still get the explanation, with no penalty.',
      ],
      control: DECK_CONTROL,
      changes: [
        'A card counts once you reach the option that fits. Together, the cards are part of what completes this chapter.',
      ],
      teaches: [
        'What a tuning device measures, and what it leaves to your ears.',
        'Where tuning that drifts usually starts.',
      ],
      tryThis: [
        'Before you tap the device card, say what a device can tell you about a drum and what only your ears can judge.',
        'Before the drift card, say your answer first. Then read the explanation, right or wrong.',
      ],
    },
    // REVIEW
    {
      intro: {
        learning: 'The troubleshooting method as a whole: listen, name the area, then fix, and what a tuning device adds to it.',
        start: 'Read YOUR RUN to see the cases you cleared and how often your first guess was right. Then answer “What is a tuning device for?” in your head before you tap it.',
      },
      seeing: [
        'YOUR RUN shows the cases you cleared, how many first hypotheses (your first guess at the cause) were right, and your decisions.',
        'Below: SAY IT BEFORE YOU READ IT cards, KEY IDEAS, KEY TERMS and a TRY NEXT. At the end: the TAKEAWAY, and what completes this chapter.',
      ],
      control: REVIEW_CONTROL,
      changes: [
        'YOUR RUN updates from what you did on Diagnose the symptom and the check cards. Nothing on this page changes the drum.',
      ],
      teaches: [
        'Troubleshooting runs in one order: listen, name the area, then fix.',
        'What a tuning device adds, and what it leaves to your ears.',
        'A first guess is a hypothesis: strike again after each fix and let the sound confirm or correct it.',
      ],
      tryThis: [
        'Do the TRY NEXT: clear EXCESSIVE RING both ways and compare the two “fixed” drums.',
        'Answer “What is a tuning device for?” aloud, then tap the card.',
      ],
    },
  ],
};

/** The what's-left screen (FINISH › on the last step, or CONTENTS). */
export const DRUM_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'How the seven chapters build one method: hear what a drum does, prepare it, even each head, balance both heads, tune each drum and the kit, then diagnose by ear.',
    start: 'Tap a row under WHAT’S LEFT to open that chapter, or tap REVIEW ▾ to see the chapters marked ✓ DONE. ‹ PREV takes you back to the step you came from.',
  },
  seeing: [
    'WHAT’S LEFT lists each chapter you haven’t completed, with what you still need to do in it. Once every chapter is complete, the title reads LAB COMPLETE.',
    'Completed chapters fold into one ✓ DONE line. REVIEW ▾ lists them.',
  ],
  control: [
    'Tap a chapter’s row to open it.',
    'PRACTICE AGAIN FROM THE START opens Chapter 1 fresh. DONE · BACK TO LABS leaves the lab.',
    '‹ PREV on the strip returns to the step you came from, as you left it.',
  ],
  changes: [
    'A chapter counts as complete the moment you meet what its row asks for. Practicing it again never undoes that.',
    'START OVER (PRACTICE), at the foot of the chapter list, clears your answers for a fresh run. Your completed chapters and saved tuning notes stay.',
  ],
  teaches: [
    'Drum tuning is one method, in order: know how a drum sounds, prepare it, even each head lug by lug, balance the two heads, then tune each drum type and the kit as a set.',
    'When a drum sounds wrong, you listen first, name where the problem is, then fix it. Your ears make the final call, not a number.',
  ],
  tryThis: [
    'Pick the chapter still listed that you feel least sure about and open it straight from its row.',
    'Reopen Diagnose the symptom in Chapter 7 and clear the case you found hardest. Say where the fault is before you fix it.',
  ],
};

/** The guide for the step on screen; undefined for a step that does not exist. */
export function drumScreenGuide(chapter: DrumChapterId, step: number): ScreenGuide | undefined {
  return DRUM_SCREEN_GUIDES[chapter]?.[step];
}
