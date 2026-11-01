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
  'Tap an option. A wrong pick is marked ✗ and says choose again; the option that fits shows ✓ and the full reason.',
  '‹ PREV CARD and NEXT CARD › move between cards. NEXT › on the strip goes to the review.',
];

const REVIEW_CONTROL = [
  'Scroll. Tap a SAY IT BEFORE YOU READ IT card to show its answer — say it in your head first.',
  'The strip’s ‹ PREV returns to any step of this chapter; NEXT › opens the next chapter.',
];

export const DRUM_SCREEN_GUIDES: Record<DrumChapterId, readonly ScreenGuide[]> = {
  /* ── CHAPTER 1 · How a drum makes sound ─────────────────────────────────── */
  sound: [
    // LEARN · The drum as a system
    {
      seeing: [
        'A tom cut in half, side on: batter head on top, resonant head below. The part you choose lights up.',
        'Readouts: PART, HEADS 2, EDGES 2, LUGS 6 × 2.',
        'Below: CHAPTER 1, what the part does, and a card on the two heads.',
      ],
      control: [
        'PART: ride through the batter head, resonant head, shell, bearing edges, hoops, tension rods, lugs and the air inside, or tap for the list.',
        'The strip under the title: ‹ PREV and NEXT › walk the steps and chapters; tap the middle for the chapter list.',
      ],
      changes: [
        'Each part lights and its card says its job.',
        'The batter is struck; the air inside pushes the resonant head. Both heads shape the note.',
      ],
      teaches: [
        'A drum is a system: two heads, a shell with bearing edges, hoops, rods, lugs and the air inside.',
        'Every drawing in this lab is a model, and every sound is synthesized — learn the method here, then trust your ears on a real drum.',
      ],
      tryThis: [
        'Ride PART to AIR: it is the link between the two heads — the reason the resonant head matters.',
        'Ride PART to EDGE, then go to The shell and bearing edge step to see the profiles up close.',
      ],
    },
    // LEARN · Tension and pitch
    {
      seeing: [
        'The notes one head makes, lowest on the left; the tall bar is the pitch you hear. The higher bars are overtones.',
        'Readouts: TENSION (in words), PITCH, NOTE and 1ST OVERTONE.',
      ],
      control: [
        'TENSION fader: from very low to very high; the lane shows the pitch and the tension in N/m (newtons per metre — how hard the head is pulled).',
        '▶ STRIKE, or tap the display, plays the hit; tap again to stop.',
      ],
      changes: [
        'More tension → higher pitch: pitch rises with the square root of tension, so four times the tension is one octave up.',
        'The overtones sit at odd ratios (about 1 : 1.6 : 2.1 : 2.3), not a harmonic series — so a drum has no single clean note.',
      ],
      teaches: [
        'Tension sets pitch; a bigger or heavier head sits lower at the same tension.',
        'Tuning to an exact note is optional — NOTE only names the pitch for reference. The goal is a useful resonant sound.',
      ],
      tryThis: [
        'At the start PITCH reads 233 Hz and 1ST OVERTONE 371 Hz. Slide TENSION all the way left: PITCH 147 Hz.',
        'Now ride right until the lane reads 4800 N/m — four times the lowest, 1200: PITCH reads 294 Hz, one octave up.',
      ],
    },
    // LEARN · The shell and bearing edge
    {
      seeing: [
        'The top of the shell wall, cut across, with the head draped over it. The amber line is where head meets shell.',
        'Readouts: EDGE (the profile) and CONTACT (LEAST, SMALL, MORE or MOST).',
      ],
      control: [
        'EDGE: ride through 45° SHARP, 45° DOUBLE, ROUNDED and VINTAGE, or tap for the list with a line on each.',
      ],
      changes: [
        'A sharper edge touches the head along a thin line: brighter, longer ring. A rounder edge touches more: warmer, shorter.',
        'A true, clean edge lets the head seat evenly; a dented or dirty one makes a spot that will not tune.',
      ],
      teaches: [
        'The bearing edge sets how much head touches shell — contact, sustain and ease of tuning.',
        'No shell material decides a drum’s sound alone; edges, heads, hoops and tuning all take part.',
      ],
      tryThis: [
        'Ride EDGE from 45° SHARP to VINTAGE: CONTACT goes from LEAST to MOST and the amber line widens.',
        'Read the card on why it matters for tuning: the Prepare chapter looks for a dirty edge.',
      ],
    },
    // HEAR · Pitch, overtones, sustain, pitch bend
    {
      seeing: [
        'One hit, left to right in real time; the white line in the strip below is how loud it is, and a green mark shows where it has died away.',
        'Readouts: PITCH, SUSTAIN (estimated T60 — the time to fall 60 dB), BEND and OVERTONES (the share of the hit above three times the pitch).',
      ],
      control: [
        'STRIKE fader: 20–100 %, a light tap to a hard hit — louder, and a deeper bend.',
        'DAMPING fader: none, a small gel, a felt strip, a pillow.',
        '▶ STRIKE, or tap the display, plays the hit; tap again to stop.',
      ],
      changes: [
        'A harder STRIKE stretches the head more: it starts sharper and glides down further — BEND grows.',
        'More DAMPING shortens SUSTAIN and takes the overtones first.',
        'Each change makes a new sound: it is rendered again from the model.',
      ],
      teaches: [
        'The four things a tuner listens for: pitch, overtones, sustain and pitch bend.',
        'These numbers are measured from a synthesized hit — a model of a drum, not a measurement of yours.',
      ],
      tryThis: [
        'At STRIKE 80 % BEND reads +35 ¢. Slide STRIKE to 20 %: +2 ¢. To 100 %: +54 ¢.',
        'Strike with no damping: SUSTAIN about 1.72 s. Push DAMPING to 100 % and strike: about 0.27 s.',
      ],
    },
    // ADJUST · Turn one rod
    {
      seeing: [
        'The drum from above. The colored wedges are each rod’s pitch: blue low, yellow even, red high. The key sits on the chosen rod.',
        'Readouts: ROD, TURN, LUG PITCH, SPREAD (cents between the highest and lowest rod) and BEAT.',
      ],
      control: [
        'TURN fader: up to a full turn either way, in eighths, on the chosen rod.',
        'ROD: picks the rod. VIEW: DRUM, WAVE, PITCH, or a VIB entry to see one of the strike’s vibration shapes.',
        '▶ TAP plays a light tap near that rod; ▶ STRIKE plays the whole drum. A tap on the display strikes or stops.',
      ],
      changes: [
        'Turning one rod changes the pitch near it AND the balance of the whole head.',
        'An uneven head makes two slightly different notes at once; they beat as a slow warble. BEAT is their difference in hertz.',
        'The well says whether each turn made the head more or less even.',
      ],
      teaches: [
        'One rod moves its lug’s pitch and the head’s evenness — the reason tuning is done lug by lug.',
        'Cents (hundredths of a semitone) measure how far apart the rods are.',
      ],
      tryThis: [
        'On ROD 1 set TURN to +⅛ turn: SPREAD reads 21 ¢, BEAT 1.5 Hz. At +¼ turn: 42 ¢ and 3.1 Hz — ▶ STRIKE to hear the warble.',
        'Set TURN back to no turn: SPREAD 0 ¢, BEAT none. Then switch VIEW to PITCH and strike.',
      ],
    },
    // PRACTICE · Check your understanding
    {
      seeing: [
        'Four decisions about how a drum makes its sound, one card at a time.',
        'Your first answer on each card is the one remembered; a retry is explained, never penalized.',
      ],
      control: DECK_CONTROL,
      changes: [
        'Reaching the right option on each card banks it; reaching it on all four credits this chapter.',
      ],
      teaches: [
        'One rod and the warble, why a tuner app jumps on a drum, the parts of the system, and pitch bend.',
      ],
      tryThis: [
        'Before you tap, say your answer — then check it against the explanation.',
        'Missed the tuner-app card? Go back to Tension and pitch and read the line on odd overtone ratios.',
      ],
    },
    // REVIEW
    {
      seeing: [
        'YOUR RUN: what you did here — the rod turns and the decisions.',
        'SAY IT BEFORE YOU READ IT cards, KEY IDEAS, KEY TERMS and a TRY NEXT. At the end: TAKEAWAY and how this chapter’s credit is earned.',
      ],
      control: REVIEW_CONTROL,
      changes: [
        'YOUR RUN updates from what you did; nothing here changes the drum.',
        'Credit lands the moment its requirement is met; reviewing never removes it.',
      ],
      teaches: [
        'A drum as a system; tension and pitch; one rod and the warble; the four things a tuner listens for.',
        'Next: preparing a drum before tuning it.',
      ],
      tryThis: [
        'Do the TRY NEXT: on Turn one rod, turn two opposite rods by the same amount in opposite directions — the mean, and the pitch, stay put.',
        'Answer each recall card aloud before tapping it.',
      ],
    },
  ],

  /* ── CHAPTER 2 · Prepare before tuning ──────────────────────────────────── */
  prepare: [
    // LEARN · Identify the drum and goal
    {
      seeing: [
        'The drum you are about to tune, from above, drawn to size.',
        'Readouts: DRUM, SIZE, LUGS and RESPONDS — this lab’s starting band for the batter’s own pitch.',
        'Below: cards on size and type, and on playing style and the sound you want.',
      ],
      control: [
        'DRUM: ride SNARE, RACK, FLOOR and KICK, or tap for the list.',
      ],
      changes: [
        'Each drum redraws to its size, with its own lug count and band.',
        'Size and type set where a drum responds well; RESPONDS is a place to start listening, not a rule.',
      ],
      teaches: [
        'Know what you are tuning, and for what, before a rod turns.',
        'A snare is heads plus wires; a bass drum is a beater and a front-head decision.',
      ],
      tryThis: [
        'Ride DRUM through all four: RACK reads 12" × 8", 6 lugs, RESPONDS 130–260 Hz; KICK’s starts lowest: RESPONDS 45.0–90.0 Hz.',
        'Read the playing-style card, then pick the sound you would want from this drum.',
      ],
    },
    // LEARN · Inspect the hardware (reading)
    {
      seeing: [
        'HARDWARE: the cutaway drum with the chosen part lit, with its own full-screen view.',
        'BEFORE TUNING, LOOK — TAP A PART: five keys, RODS, LUGS, HOOPS, HEAD and EDGE, and a card on what to check.',
      ],
      control: [
        'Tap a part key: the drawing lights it and the card says what to look for. The same keys sit under the figure in full screen.',
      ],
      changes: [
        'Each part has its own failure: a rod that backs out, a stripped insert, a bent hoop, a worn head, grit on the edge.',
      ],
      teaches: [
        'Hardware faults often sound like tuning faults — check the hardware first.',
      ],
      tryThis: [
        'Tap HOOPS and read the table test: a flat hoop touches all the way round.',
        'Tap EDGE: grit between head and edge is a buzz or a dead spot that LOOKS like a tuning problem.',
      ],
    },
    // LEARN · Seat and tension a new head
    {
      seeing: [
        'The order to tighten the rods on a new head, drawn on the drum.',
        'Readouts: LUGS, STEP, THIS ROD and NEXT.',
        'Below: seating, why opposing, and the CAUTION card.',
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
        'Seating a new head and bringing it up in an opposing (star) pattern, a half turn per rod per round.',
        'A head has a working range: stop when the pitch stops rising.',
      ],
      tryThis: [
        'On 8 LUGS press ▶ RUN: THIS ROD reads #1, NEXT #5 — then 3, 7, 2, 6, 4, 8.',
        'Switch to 6 LUGS and ride STEP: three opposite pairs, 1 → 4 → 2 → 5 → 3 → 6.',
      ],
    },
    // HEAR · Start from a known condition
    {
      seeing: [
        'The floor tom head, brought up two ways: even rounds or big random turns. The wedges show each lug’s pitch.',
        'Readouts: APPROACH, STEP, SPREAD and PITCH.',
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
        'On EVEN STEPS ride STEP to 8: SPREAD 0 ¢, PITCH 156 Hz. ▶ STRIKE: a clean note.',
        'Flip to RANDOM at step 8: SPREAD 880 ¢, PITCH 137 Hz. ▶ STRIKE: the warble.',
      ],
    },
    // PRACTICE · Preparation checklist
    {
      seeing: [
        'A snare with one to three things wrong. The dashed ring is where you are looking; a fault is drawn only once you have looked there.',
        'Readouts: LOOKING AT, WALKED, FLAGGED and KEY (hidden until revealed).',
        'Below: what you see there, and the checklist of four faults.',
      ],
      control: [
        'INSPECT: walk the drum — HEAD, ROD 1 to ROD 10, EDGE and MAP.',
        'Tap a checklist line to flag that fault (tap again to unflag).',
        '✓ REVEAL KEY shows the answers; ↺ NEW DRUM deals another drum.',
      ],
      changes: [
        'Each place you inspect says what is there. The map shows only when you look at it.',
        'The key marks every line right or wrong. Credit needs every fault found and nothing extra flagged.',
      ],
      teaches: [
        'An inspection routine: head, every rod, the edge, then the tension map.',
        'A loose rod and an uneven head look alike on the map — walking the rods tells them apart.',
      ],
      tryThis: [
        'Walk every ROD before you look at MAP, then flag and ✓ REVEAL KEY.',
        'Missed one? ↺ NEW DRUM deals another; a repeat never removes credit.',
      ],
    },
    // REVIEW
    {
      seeing: [
        'YOUR RUN: the drums you checked and how the known-condition head ended.',
        'SAY IT BEFORE YOU READ IT cards, KEY IDEAS, KEY TERMS and a TRY NEXT. At the end: TAKEAWAY and how this chapter’s credit is earned.',
      ],
      control: REVIEW_CONTROL,
      changes: [
        'YOUR RUN updates from what you did; nothing here changes the drum.',
      ],
      teaches: [
        'Know the drum and the goal; check the hardware; seat the head; come up evenly from a known condition.',
        'Next: the basic tuning method, lug by lug.',
      ],
      tryThis: [
        'Answer the card on the star pattern aloud, then tap it.',
        'Do the TRY NEXT: walk every rod on the checklist before reading the map.',
      ],
    },
  ],

  /* ── CHAPTER 3 · The basic tuning method ────────────────────────────────── */
  method: [
    // LEARN · The seven steps
    {
      seeing: [
        'The floor tom at each step of the method — exploded for seating, the star order, a tap at each lug, the stroke at the center.',
        'Readouts: STEP, DO (the step’s short name) and HEAD (BATTER, or RESONANT for the last step).',
      ],
      control: [
        'STEP: ride SEAT, FINGER, STAR, TAP, ADJUST, PLAY and OTHER, or tap for the list with a line on each.',
      ],
      changes: [
        'Each step redraws the drum and its card gives the detail.',
        'The tap an inch in from the rim at each rod is set mostly by the tension at that rod.',
      ],
      teaches: [
        'The method: seat, finger-tighten, star pattern, tap near each lug, small adjustments, play from the seat, then the other head.',
        'Even first, the pitch you want second.',
      ],
      tryThis: [
        'Ride STEP to ADJUST: the map shows an uneven head — the job of the next two steps.',
        'Read the CAUTION card: a drum key and fingers only, and stop when the pitch stops rising.',
      ],
    },
    // HEAR · Tap near each lug
    {
      seeing: [
        'An uneven head with its color map hidden; ● is where the stick taps.',
        'Readouts: LUG, TAPPED, LUG PITCH (listen until the map is shown) and SPREAD (hidden).',
      ],
      control: [
        'LUG: pick a lug. ▶ TAP (or a tap on the display) plays it.',
        'Once every lug has sounded, pick the one you heard highest, then ◉ REVEAL MAP. Revealing early asks you to tap every lug first.',
      ],
      changes: [
        'A tap counts only when it actually sounds.',
        'The map and the numbers come after the ear: ◉ REVEAL MAP shows them and checks your pick — a free check, not credit.',
      ],
      teaches: [
        'Finding the odd lugs by ear: the same spot and the same light stroke at every lug.',
      ],
      tryThis: [
        'Tap all eight lugs, then tap the one you heard highest and ◉ REVEAL MAP: the map says lug 2, SPREAD 195 ¢.',
        'Tap lug 2 and its opposite, lug 6, back to back and hear the gap.',
      ],
    },
    // ADJUST · Tune the head
    {
      seeing: [
        'The head you are evening; the key sits on the rod you chose. Wedges: blue low, yellow even, red high.',
        'Readouts: LUG, THIS RUN (how far YOU have moved that rod), LUG PITCH, SPREAD and HEAD.',
      ],
      control: [
        'TURN fader: your move on this rod, in sixteenths of a turn (0 = as you found it).',
        'LUG picks the rod. BATTER / RESO switches heads. ▶ TAP plays a lug; ▶ STRIKE plays the whole drum.',
        'In the well: ▶ SHOW ME A MOVE (the first two on the batter) and ↺ NEW HEADS for a fresh practice pair.',
      ],
      changes: [
        'Tighten a low rod and it rises; loosen a high one and it falls. SPREAD shrinks as the lugs agree.',
        'On the batter the feedback names the rod, direction and amount; on the resonant head you find them by ear.',
      ],
      teaches: [
        'Evening a head with small, opposing moves, so the overall pitch stays where it is.',
        'Credit lands when the batter reads even — every lug within 10 cents.',
      ],
      tryThis: [
        'Tap ▶ SHOW ME A MOVE: the lab moves the furthest-out rod and says how its wedge and SPREAD changed. ▶ TAP it to hear.',
        'Keep going until SPREAD is under 10 ¢ and the map is one color, then flip to RESO.',
      ],
    },
    // REVIEW
    {
      seeing: [
        'YOUR RUN: each head’s SPREAD before and after, the number of moves, and your tap-round pick.',
        'SAY IT BEFORE YOU READ IT cards, KEY IDEAS, KEY TERMS and a TRY NEXT. At the end: TAKEAWAY and how this chapter’s credit is earned.',
      ],
      control: REVIEW_CONTROL,
      changes: [
        'YOUR RUN updates from what you did; nothing here changes the drum.',
      ],
      teaches: [
        'Tap near each rod, match the pitches with small opposing moves, then play it from the seat.',
        'Next: the two heads tuned as one instrument.',
      ],
      tryThis: [
        'Do the TRY NEXT: deal NEW HEADS and tune the resonant head first.',
        'Answer “A lug taps 30 cents high — which way?” before you tap the card.',
      ],
    },
  ],

  /* ── CHAPTER 4 · Tuning the whole drum ──────────────────────────────────── */
  whole: [
    // LEARN · Three relationships (reading)
    {
      seeing: [
        'THE AIR: the cutaway with the air inside lit — the link between the heads.',
        'TWO HEADS, ONE INSTRUMENT, then three relationships: resonant higher than batter, both heads equal, batter higher than resonant.',
        'Then: None of these is the correct one.',
      ],
      control: [
        'Scroll to read. Tap the figure for full screen. The next step lets you hear all three on one drum.',
      ],
      changes: [
        'The batter pushes the air, the air pushes the resonant head, and the two trade the sound back and forth.',
        'Where the resonant head sits against the batter decides where that energy goes and how long it lasts.',
      ],
      teaches: [
        'What each relationship tends to do in this model — and why players describe the pitch bend in opposite ways.',
        'Each relationship is a sound, not a rule.',
      ],
      tryThis: [
        'Read each relationship and guess which will ring longest, then test it on the next step.',
        'Open THE AIR full screen: the air is drawn between the heads — the path the sound trades along.',
      ],
    },
    // HEAR · Compare head relationships
    {
      seeing: [
        'One hit of the tom; the green mark is where it has died away. The label names both main notes the drum sounds.',
        'Readouts: BATTER, RESO, REL (in semitones), SUSTAIN and LATE SOUND (where the note sits at 0.9 s, against the batter).',
      ],
      control: [
        'BATTER and RESO faders: each head’s own pitch.',
        'SET: RESO ↑, EQUAL or BATTER ↑ — sets the resonant head 3 semitones above, equal, or 3 below.',
        'VIEW: WAVE, PITCH or VIBRATE. ▶ STRIKE, or a tap on the display, plays the drum.',
      ],
      changes: [
        'Heads near the same pitch trade the sound back and forth; heads apart let it leave sooner. Strike all three and judge which rings longest.',
        'Resonant high: a quicker, focused note that settles above the batter. Resonant low: the late sound settles lower.',
        'Once all three have sounded, WHICH ONE RANG LONGEST? appears.',
      ],
      teaches: [
        'How the two heads’ relationship sets sustain and where the note ends.',
        'SUSTAIN here is estimated from a synthesized hit — a model, not your drum. Listen on the drum in front of you.',
      ],
      tryThis: [
        'Tap SET → RESO ↑: RESO reads 226 Hz, REL +3.0 st. ▶ STRIKE and read SUSTAIN.',
        'Try EQUAL, then BATTER ↑ (RESO 160 Hz), striking each — then answer which rang longest.',
        'Switch VIEW to PITCH and strike BATTER ↑: watch where the late sound settles.',
      ],
    },
    // LEARN · Why the same tuning sounds different (reading)
    {
      seeing: [
        'IT DEPENDS — AND HERE IS ON WHAT: four cards — Size, Construction, Head choice and Playing style.',
      ],
      control: [
        'Scroll to read. The strip moves on to the decisions.',
      ],
      changes: [
        'A deeper shell, a bigger head, a different hoop, a thicker head or a harder stroke each change how a relationship sounds.',
      ],
      teaches: [
        'Why a setting that sings on one drum can thud on another — and why the lab asks you to listen, not copy a number.',
      ],
      tryThis: [
        'Think of two drums you know and how their size and heads differ, then read the Size card again.',
        'Go back one step and hear the three relationships again with these cards in mind.',
      ],
    },
    // PRACTICE · Check your understanding
    {
      seeing: [
        'Three decisions about the two heads together, one card at a time.',
        'Your first answer on each card is the one remembered; a retry is explained, never penalized.',
      ],
      control: DECK_CONTROL,
      changes: [
        'Reaching the right option on each card banks it — part of this chapter’s credit.',
      ],
      teaches: [
        'No relationship is the correct one; heads near one pitch sustain each other; size and construction change the result.',
      ],
      tryThis: [
        'Before you tap, say your answer — then check it against the explanation.',
        'Picked a wrong option? Read why it is not the best fit before you choose again.',
      ],
    },
    // REVIEW
    {
      seeing: [
        'YOUR RUN: the relationships you heard with their SUSTAIN, your answer on which rang longest, and the decisions.',
        'SAY IT BEFORE YOU READ IT cards, KEY IDEAS, KEY TERMS and a TRY NEXT. At the end: TAKEAWAY and how this chapter’s credit is earned.',
      ],
      control: REVIEW_CONTROL,
      changes: [
        'YOUR RUN updates from what you did; nothing here changes the drum.',
      ],
      teaches: [
        'The resonant head is half the instrument; each relationship is a sound, not a mistake and not a rule.',
        'Next: tuning each drum type.',
      ],
      tryThis: [
        'Do the TRY NEXT: move RESO slowly from 3 st below to 3 st above, striking as you go.',
        'Answer “Is one relationship the correct one?” aloud, then tap the card.',
      ],
    },
  ],

  /* ── CHAPTER 5 · Tuning each drum type ──────────────────────────────────── */
  types: [
    // LEARN · Snare drum
    {
      seeing: [
        'The snare side on: the wires hang under the bottom head; the stick’s height is the stroke; B and S tick the two heads’ pitches.',
        'Readouts: BATTER, SNARE SIDE, STRAINER and SUSTAIN.',
      ],
      control: [
        'STRAINER: from thrown off to tight.',
        'BOTTOM: the snare-side head, −200 to +900 ¢ against the batter.',
        'BATTER: the batter’s own pitch. STROKE: a ghost note to a hard hit.',
        '▶ STRIKE, or a tap on the display, plays the snare.',
      ],
      changes: [
        'The wires rattle only when the bottom head moves them past the strainer’s threshold.',
        'A tight strainer loses ghost notes and chokes the drum; a loose one buzzes at everything.',
        'The batter sets feel and pitch; the bottom head and strainer set the wire response.',
      ],
      teaches: [
        'A snare is two heads, wires and a strainer — and which part does what.',
      ],
      tryThis: [
        'At the start SNARE SIDE reads 290 Hz (BOTTOM +400 ¢). Ride BOTTOM to +700 ¢: 345 Hz. Strike each.',
        'Set STROKE low, then ride STRAINER tight and loose, striking each time.',
        'Bring STRAINER under 10 %: it reads OFF — the heads alone.',
      ],
    },
    // LEARN · Toms (reading)
    {
      seeing: [
        'TOMS: three cards — each head even, then the relationship; a useful progression across the kit; do not force a drum out of its range.',
      ],
      control: [
        'Scroll to read. The strip moves on to the bass drum.',
      ],
      changes: [
        'On a tom the resonant head carries most of the sustain and bend, so its relationship to the batter is the main tone decision.',
      ],
      teaches: [
        'Toms are tuned as a set, each where it responds best.',
        'Pushed too high a tom chokes; pulled too low the head wrinkles and flaps.',
      ],
      tryThis: [
        'Read the range card, then picture your own toms from lowest to highest.',
        'The goal step coming up lets you tune a tom toward a stated sound.',
      ],
    },
    // LEARN · Bass drum
    {
      seeing: [
        'The bass drum side on, pedal on the right; the beater swings in when you strike.',
        'Readouts: FRONT, PILLOW, BATTER and SUSTAIN.',
      ],
      control: [
        'FRONT: CLOSED, PORTED or NO FRONT.',
        'PILLOW: nothing inside up to a pillow against the batter.',
        'BATTER: the batter’s own pitch. BEATER: a soft to a hard stroke.',
        '▶ STRIKE, or a tap on the display, plays it.',
      ],
      changes: [
        'FRONT sets how much the heads couple: CLOSED is the longest note, NO FRONT the shortest.',
        'PILLOW shortens the decay and takes the overtones first.',
        'A harder beater: louder, more click, a deeper bend.',
      ],
      teaches: [
        'A bass drum is a beater, a low note and a front-head decision. A damped kick is a different instrument, not a worse one.',
      ],
      tryThis: [
        'Strike on PORTED (PILLOW 40 %), then CLOSED, then NO FRONT — and compare SUSTAIN.',
        'Take PILLOW to 0 and strike: the note opens up.',
      ],
    },
    // PRACTICE · Tune a drum for a sound
    {
      seeing: [
        'Your hit against the goal: the shaded zone is where the green died-away mark has to land.',
        'Readouts: GOAL, PITCH, SUSTAIN, BEND and MET (goals met so far).',
      ],
      control: [
        'BATTER, RESO and DAMPING faders tune and damp the drum.',
        'GOAL: SHORT, OPEN, LOW or BEND — each starts the drum where it fails.',
        '▶ STRIKE plays; ✓ CHECK judges the current setting. In the well, SNARE / RACK / FLOOR / KICK picks the practice drum.',
      ],
      changes: [
        'Every goal starts from a drum that fails it; you have to move toward it.',
        'CHECK judges sustain, pitch, bend and overtones, and says which way to move. Meeting two goals credits the interactive.',
      ],
      teaches: [
        'Tuning and damping are both choices; a stated goal decides them.',
        'The bands (short ≤ 0.55 s, open ≥ 0.9 s, bend ≥ 35 cents) are the lab’s teaching thresholds, not industry rules.',
      ],
      tryThis: [
        'Pick GOAL BEND on the rack tom: PITCH 260 Hz, BEND +32 ¢ — under the 35-cent line. Lower BATTER, strike, ✓ CHECK.',
        'On SHORT, raise DAMPING, strike, then ✓ CHECK and read which way to move.',
      ],
    },
    // PRACTICE · Check your understanding
    {
      seeing: [
        'Three decisions across the drum types, one card at a time.',
        'Your first answer on each card is the one remembered; a retry is explained, never penalized.',
      ],
      control: DECK_CONTROL,
      changes: [
        'Reaching the right option on each card banks it — part of this chapter’s credit.',
      ],
      teaches: [
        'Snare wire response, a damped bass drum as a different instrument, and a tom pushed out of its range.',
      ],
      tryThis: [
        'Before you tap, say your answer — then check it against the explanation.',
        'Picked a wrong option? Read why it is not the best fit before you choose again.',
      ],
    },
    // REVIEW
    {
      seeing: [
        'YOUR RUN: the goals met and not yet, the checks, and the decisions.',
        'SAY IT BEFORE YOU READ IT cards, KEY IDEAS, KEY TERMS and a TRY NEXT. At the end: TAKEAWAY and how this chapter’s credit is earned.',
      ],
      control: REVIEW_CONTROL,
      changes: [
        'YOUR RUN updates from what you did; nothing here changes the drum.',
      ],
      teaches: [
        'Snare: batter for feel, bottom head and strainer for sensitivity. Bass drum: beater, low note, front head. Same listening, different goals.',
        'Next: tuning a whole kit.',
      ],
      tryThis: [
        'Do the TRY NEXT: meet SHORT with damping alone, then with no damping and the resonant head 4 st away.',
        'Answer the snare card — where to look when soft strokes give no wires — before you tap it.',
      ],
    },
  ],

  /* ── CHAPTER 6 · Tuning a kit ───────────────────────────────────────────── */
  kit: [
    // LEARN · A range for every drum (reading)
    {
      seeing: [
        'TUNING AS A SET: five cards — a practical range for each drum, separation between the toms, listening in the music, rechecking after a move, and writing it down.',
      ],
      control: [
        'Scroll to read. The strip moves on to Build the tom range.',
      ],
      changes: [
        'Toms too close crowd together; too far apart the kit falls into unrelated drums.',
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
      seeing: [
        'The two toms and a ladder of their pitches; the bracket between them turns green when the step works. The kit starts upside down.',
        'Readouts: RACK, FLOOR, INTERVAL (in semitones) and VERDICT.',
      ],
      control: [
        'RACK fader: the 12" rack tom, 100–300 Hz. FLOOR fader: the 16" floor tom, 70–220 Hz.',
        '▶ RACK, ▶ FLOOR and ▶ BOTH (rack, then floor) play them. A tap on the display plays both or stops.',
      ],
      changes: [
        'DISTINCT: about 2.5 to 9 semitones between them, both drums in their bands.',
        'CLOSE (too close together) below that; UNBALANCED when a drum is out of its band, the floor is above the rack, or the gap is too wide.',
        'Credit: reach DISTINCT and hear ▶ BOTH.',
      ],
      teaches: [
        'Spacing toms so each keeps its own voice. These bands teach; your ears and your music set the real ones.',
      ],
      tryThis: [
        'At the start INTERVAL reads −2.3 st, UNBALANCED. Ride FLOOR to 110 Hz and RACK to 165 Hz: 7.0 st, DISTINCT. ▶ BOTH.',
        'Push RACK to 200 Hz: 10.3 st, UNBALANCED — too wide. At 140 / 130 Hz: 1.3 st, CLOSE.',
      ],
    },
    // PRACTICE · Save tuning notes (reading)
    {
      seeing: [
        'TUNING NOTES: a NAME, a NOTE, the rack and floor pitches from the previous step, and SAVE THIS SETUP.',
        'Below: your notes, each with LOAD and DELETE.',
      ],
      control: [
        'Type a name and a note, then SAVE THIS SETUP.',
        'LOAD puts a note’s pitches back on the RACK and FLOOR faders; DELETE asks first.',
      ],
      changes: [
        'A saved note is stored on this device; the list keeps the newest notes and says when it drops the oldest.',
        'When the lab cannot save — not signed in, or a preview — it says notes are kept for this session only.',
      ],
      teaches: [
        'Writing a setup down so you can get back to it: the pitches, the heads, the room and what worked.',
      ],
      tryThis: [
        'Name a setup after the room you play in and save it; then move the faders and LOAD it back.',
        'Save the same pitches twice with nothing typed: the lab says that setup is already saved.',
      ],
    },
    // REVIEW
    {
      seeing: [
        'YOUR RUN: the rack and floor pitches with their interval and verdict, the verdicts met on the way, and your tuning notes.',
        'SAY IT BEFORE YOU READ IT cards, KEY IDEAS, KEY TERMS and a TRY NEXT. At the end: TAKEAWAY and how this chapter’s credit is earned.',
      ],
      control: REVIEW_CONTROL,
      changes: [
        'YOUR RUN updates from what you did; nothing here changes the drums.',
      ],
      teaches: [
        'Each drum in the band where it responds; clear steps between the toms; listen in the music.',
        'Next: troubleshooting by ear.',
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
      seeing: [
        'SYMPTOM → WHERE TO LOOK: a table of five symptoms and the areas to investigate for each.',
        'Then BY EAR, BY REFERENCE, BY DEVICE: tuning by ear, a pitch reference, and a drum-tuning device.',
      ],
      control: [
        'Scroll to read. The next step puts five of these cases on the simulated drum.',
      ],
      changes: [
        'Every symptom has more than one possible cause. The strategy is always: listen → say where → fix, then strike again.',
      ],
      teaches: [
        'Diagnosing by symptom before turning anything.',
        'A device helps you repeat a setting; the ear decides whether it is right.',
      ],
      tryThis: [
        'Pick a row of the table and say which area you would check first — then see the case on the next step.',
        'Read the device card: a device helps consistency; the final judgment still comes from listening.',
      ],
    },
    // PRACTICE · Diagnose the symptom
    {
      seeing: [
        'A drum with a fault; the readouts are your evidence. Readouts: VIEW, SPREAD, BEAT, SUSTAIN and FAULT (STILL or GONE).',
        'Below: the case’s symptom, the step you are on (LISTEN, WHERE IS IT? or FIX) and replies quoting the evidence.',
      ],
      control: [
        'CASE: WARBLE, CHOKED, RING, SNARE or DRIFT.',
        'LUG fader picks where ▶ TAP lands; ▶ STRIKE (▶ SOFTLY on the snare case) plays the drum. VIEW: DRUM, WAVE or PARTS.',
        'The last key changes with the strategy: HIT 1ST, then taps still to do, then WHERE? to name an area, then FIX. ↺ RESET CASE deals it again.',
      ],
      changes: [
        'Strike (and tap where needed) before you can name an area; then the fixes open.',
        'A fix that only treats the symptom leaves FAULT at STILL; the right one turns it GONE. Clearing all five credits the interactive.',
      ],
      teaches: [
        'Listen, name the area, fix — and read what changed.',
        'This drum is a model; on a real drum the same strategy applies.',
      ],
      tryThis: [
        'WARBLE: ▶ STRIKE — SPREAD 226 ¢, BEAT 8.4 Hz. Tap three lugs, name the area, then FIX.',
        'On RING try the gel, then ↺ RESET CASE and retune the resonant head: two fixes, two different sounds.',
      ],
    },
    // PRACTICE · Check your understanding
    {
      seeing: [
        'Two decisions about tuning devices and drift, one card at a time.',
        'Your first answer on each card is the one remembered; a retry is explained, never penalized.',
      ],
      control: DECK_CONTROL,
      changes: [
        'Reaching the right option on each card banks it — part of this chapter’s credit.',
      ],
      teaches: [
        'A device measures one thing and the sound is the judgment; drift lives in rods, lugs and washers.',
      ],
      tryThis: [
        'Before you tap, say your answer — then check it against the explanation.',
        'Picked a wrong option? Read why it is not the best fit before you choose again.',
      ],
    },
    // REVIEW
    {
      seeing: [
        'YOUR RUN: cases cleared, first hypotheses right, and the decisions.',
        'SAY IT BEFORE YOU READ IT cards, KEY IDEAS, KEY TERMS and a TRY NEXT. At the end: TAKEAWAY and how this chapter’s credit is earned.',
      ],
      control: REVIEW_CONTROL,
      changes: [
        'YOUR RUN updates from what you did; nothing here changes the drum.',
      ],
      teaches: [
        'Listen → name the area → fix; devices give consistency, the ear decides.',
        'Last chapter: NEXT › becomes FINISH ›, which opens what’s left.',
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
  seeing: [
    'WHAT’S LEFT, or LAB COMPLETE once every chapter is credited: one row per chapter still to do, with what earns its credit.',
    '✓ DONE: the credited chapters — REVIEW ▾ lists them.',
  ],
  control: [
    'Tap a chapter’s row to open it.',
    'PRACTICE AGAIN FROM THE START opens Chapter 1 fresh. DONE · BACK TO LABS leaves the lab.',
    '‹ PREV on the strip returns to the step you came from, as you left it.',
  ],
  changes: [
    'A chapter is credited the moment its requirement is met; practicing again never removes it.',
    'START OVER (PRACTICE) at the foot of the chapter list clears answers for a fresh run; credit and tuning notes stay.',
  ],
  teaches: [
    'The lab’s path: how a drum sounds, preparation, the method, both heads, each drum type, the kit, troubleshooting.',
    'Last lab in Pitch & Tuning.',
  ],
  tryThis: [
    'Open any chapter still listed, straight from its row.',
    'Reopen Diagnose the symptom and clear a case you found hard.',
  ],
};

/** The guide for the step on screen; undefined for a step that does not exist. */
export function drumScreenGuide(chapter: DrumChapterId, step: number): ScreenGuide | undefined {
  return DRUM_SCREEN_GUIDES[chapter]?.[step];
}
