/**
 * Ear Training Lab — "explain this screen" content (owner 2026-10-31, the
 * Screen Guide rollout). One guide per module (keyed by EarModuleId), one for
 * the module list (the lab home) and one for the what's-left screen (FINISH ·
 * SEE WHAT'S LEFT, reached from the list or from any drill).
 *
 * All fourteen modules run on ONE screen (EarModuleScreen): LISTEN FOR, the
 * ▶ clip chips, the answer chips, then the verdict, the truth line and the
 * SEE IT panel. Each guide is written against that module's own trial factory
 * (src/features/ear/modules/*.ts) and SeeItView: the names are the on-screen
 * names (chip labels, question wording, panel titles), and every number in
 * TRY THIS is what the screen prints for that trial — pinned and recomputed
 * in test/screenGuide_eartraining_20261031.test.ts. Change a module's chips,
 * levels, wording or numbers → update its guide here.
 *
 * STEPPED (owner review 2026-10-31): each section must fit a 375×812 phone
 * with no scrolling — held to SCREEN_GUIDE_BUDGET (types.ts).
 *
 * Copy rules: plain language; claims KNOWLEDGE, never skills; no gear brand
 * names; no "N of total"; "suggest", never "recommend"; no build notes.
 *
 * The playback honesty the header chip used to carry (phone output and the
 * learner's own headphones color the sound) lives in the HOME guide's WHAT
 * THIS TEACHES — the chip rule (owner 2026-10-31) keeps AccuracyNote for live
 * microphone tools and real-world measurements only.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';
import type { EarModuleId } from '../../../features/ear/earTypes';

export const EAR_HOME_GUIDE: ScreenGuide = {
  intro: {
    learning: 'How to name what you hear — tone, level, time, stereo, pitch and defects — and what an analyzer shows for each kind of change.',
    start: 'Tap Frequency Recognition to read its description, then tap OPEN. Play one ten-trial round, then come back with ‹ and pick your next module.',
  },
  seeing: [
    'This is the Ear Training menu: fourteen listening drills. Each plays clips, asks what changed, then shows the change measured. Two can use a recorded piano or guitar chord.',
    'Under MODULES, each row is a drill. A tried row shows its level and recent score (for example L2 · 85% · tried). A ✓ marks a module that counts, and “tried” drops away.',
    'FINISH · SEE WHAT’S LEFT › lists what doesn’t count yet.',
  ],
  control: [
    'Tap a module’s name to read its description and playback note, then tap OPEN to start the drill.',
    'Inside a drill, the ▶ chips play the clips and the answer chips take your answer. NEXT TRIAL › draws the next one, and ‹ brings you back here.',
    'Tap ⓘ inside any drill to have that screen explained.',
    'Tap FINISH · SEE WHAT’S LEFT › to see the modules that don’t count yet. Any row there opens its module.',
  ],
  changes: [
    'By what you hear: 1–4 tone; 5 defects; 6 stereo; 7, 10, 14 level, compression, clipping; 8, 9, 12, 13 time and phase (delay, reverb, polarity, comb filtering); 11 pitch.',
    'Each drill has a level ladder, judged only on answers at your current level: 80 % over your last 20 moves you up; under 50 % drops you back one.',
    'A module counts once you clear level 2 at 80 % over 20 answers; then it stays counted.',
  ],
  teaches: [
    'How to name a change you hear, and predict what an analyzer will show before you look.',
    'The words engineers use for what they hear: bands, dB steps, delays, spaces, defects.',
    'Your phone and headphones color the sound. Noticing a change carries over anywhere; the exact tone here does not.',
    'Each process from Equalization, Dynamics, Time Effects and Stereo & Spatial has a sound you can learn to recognize.',
  ],
  tryThis: [
    'New to ear training? Start with Frequency Recognition. Fix 1 kHz in your head, then name tones above and below it.',
    'Keep sets short: one ten-trial round per module, then a break. Tired ears hear less, and the drill reminds you after 15 minutes.',
    'In a module you find hard, replay every clip after each reveal, now that you know the answer.',
  ],
};

/** The what's-left screen (FINISH · SEE WHAT'S LEFT on the list or in a drill). */
export const EAR_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'Which kinds of sound change you can already name reliably, and which still need more listening practice.',
    start: 'Read each row’s level and number of answers. Tap the module still left with the lowest level, and play one ten-trial round.',
  },
  seeing: [
    'WHAT’S LEFT lists every module that doesn’t count yet. Each row is a link with its state: not tried yet, or tried, with its level and number of answers.',
    'Modules that already count fold into one ✓ line; tap REVIEW ▾ to unfold them.',
    'When all fourteen count, the title turns to LAB COMPLETE.',
  ],
  control: [
    'Tap any row to jump straight to that module.',
    'If you came from a drill, CARRY ON · (the module’s name) › takes you back to it as you left it. DONE · BACK TO THE MODULE LIST goes to the menu.',
    'If you came from the menu, DONE · BACK TO LABS leaves the lab.',
    'PRACTICE AGAIN FROM THE START opens Module 1, Frequency Recognition. It clears nothing.',
  ],
  changes: [
    'A module moves up to the ✓ line once you clear level 2 at 80 % over 20 answers.',
    'A tried row shows how far up its ladder you’ve climbed. A module that counts keeps its higher levels open, with smaller steps to hear.',
    'A bad round never takes a module off the ✓ line, so you can practice the hard levels freely.',
  ],
  teaches: [
    'Which kinds of change your ears already name reliably — tone, level, time, stereo, pitch, defects — and which still need practice.',
    'Small differences take more listening than big ones: each level up shrinks the step you’re asked to hear.',
  ],
  tryThis: [
    'Pick the module still left with the lowest level and play one ten-trial round.',
    'Once a module counts, keep going: its higher levels make the steps smaller.',
  ],
};

export const EAR_SCREEN_GUIDES: Record<EarModuleId, ScreenGuide> = {
  // ── 1 ─────────────────────────────────────────────────────────────────────
  frequency: {
    intro: {
      learning: 'Where frequencies sit by ear, using 1 kHz as your anchor, and why low tones need more level to sound as loud as mid tones.',
      start: 'Read LISTEN FOR, then tap ▶ and name the tone. After you answer, read the truth line and find the tone’s single peak in SEE IT.',
    },
    seeing: [
      'LISTEN FOR, then a question: name the tone, which of A and B is higher, or which of A, B, C is a named tone.',
      'Naming chips: nine octave centers, 63 Hz–16 kHz (level 1); 13 third-octaves (level 2); all 25 (3–4). Otherwise: A/B or Clip A/B/C chips.',
      'Then: the verdict, the truth line (what played) and SEE IT, a SPECTRUM of the clip.',
      'Header: “last 20” score and level; above the question, trial number and streak.',
    ],
    control: [
      '▶ plays a clip and ■ stops it. At the top level each clip allows two plays while you answer, so make the first listen count.',
      'Tap an answer chip to answer. NEXT TRIAL › draws the next tone; after ten, NEXT ROUND › starts a new round.',
      'If your speaker or headphones can’t play deep bass, check My playback can’t reproduce sub-bass. From the next trial, tones at or below 80 Hz are skipped.',
      '⤢ FULL SCREEN enlarges the SPECTRUM with the ▶ chips under it, so you can replay a tone while you watch its peak. FINISH · SEE WHAT’S LEFT › lists what doesn’t count yet.',
    ],
    changes: [
      'A pure sine is one frequency: one peak per clip. After you answer, a green band marks the tone (none on higher-or-lower).',
      'Tones under 250 Hz get up to +6 dB of makeup, as ears are less sensitive there: a rough match, not a calibrated level.',
      'Levels tighten the grid: octaves, every other third, then every third (level 3 half-credits a neighbor). Higher-or-lower pairs close from two octaves to a sixth of one.',
    ],
    teaches: [
      'Where frequencies sit by ear: 1 kHz as the anchor, weight and boom below it, edge and sizzle above.',
      'The third-octave grid that EQs and analyzers use. An octave is a doubling of frequency; three third-octave steps (each about ×1.26) make one octave.',
      'Low tones need more level to sound as loud as mid tones.',
      'Single tones are the base for hearing EQ moves (EQ Recognition) and whole regions (Band Identification).',
    ],
    tryThis: [
      'After each answer, read the truth line: a 125 Hz tone adds “+3.0 dB makeup”, 63 Hz adds “+6.0 dB”, 250 Hz and up add none.',
      'At level 1, check the sub-bass box: from the next trial the 63 Hz chip is gone, leaving eight chips, 125 Hz to 16 kHz.',
      'On a “Which tone is higher?” pair, play A and B, answer, then check SEE IT: the higher tone’s peak sits further right.',
    ],
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  eq: {
    intro: {
      learning: 'What boosting or cutting one frequency region does to a sound, and why a fair EQ comparison keeps both versions equally loud.',
      start: 'Pick a SOURCE, then play ▶ A, ▶ B and A again. Answer the question, then watch SEE IT, where the move’s frequency glows green.',
    },
    seeing: [
      'You hear two clips, A and B: the same source, but B has one EQ move. You’re asked where it is, which way (Boost or Cut), or how much.',
      'SOURCE: Synth (a generated tone), Piano or Guitar (a recorded chord).',
      'After you answer: a truth line such as “+12 dB wide bell (Q 1.4) at 1 kHz”, and SEE IT, the A and B spectra with the move’s frequency glowing green.',
    ],
    control: [
      '▶ A and ▶ B play the clips (■ stops). Play A, then B, then A again. At the top level each clip allows two plays.',
      'Answer chips: 125 Hz to 8 kHz in octaves; Boost or Cut; or 3 dB, 6 dB, 9 dB, 12 dB.',
      'SOURCE chips: Piano or Guitar trains your ear on a recording from the next trial. Synth is the default, and it plays while a recording is still loading.',
      'NEXT TRIAL › moves on. ⤢ FULL SCREEN enlarges the A and B spectra. FINISH · SEE WHAT’S LEFT › lists what doesn’t count yet.',
    ],
    changes: [
      'A and B are matched in level after the move, so B isn’t simply turned up. Listen for what changed in its tone.',
      'A boost adds energy around its frequency; a cut removes it. A wide bell (Q 1.4) colors a broad region, a narrow bell (Q 4.0) a slice, a shelf everything past its corner.',
      'Levels shrink the move: ±12, ±9, ±6, then ±3 dB. Cuts join at level 2, shelves and narrow bells at level 3.',
    ],
    teaches: [
      'What “more of” or “less of” a frequency region does to a sound.',
      'Why fair EQ comparisons match loudness: the louder version tends to sound better and hides what the EQ really did.',
      'Boosts are easier to hear than cuts, which is why cuts come later here.',
      'An EQ move lifts or lowers a frequency you can already place from Frequency Recognition. The EQ Lab shows the same moves.',
    ],
    tryThis: [
      'On “Is B boosted or cut?”, ask what B has more of or less of — never which clip is louder.',
      'Tap Piano: the line under the chips says when the recorded piano chord takes over (from the next trial).',
      'After a reveal, play B while you watch SEE IT: the green band marks where the two curves part.',
    ],
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  band: {
    intro: {
      learning: 'The band names engineers use, from Sub Bass to Air: where each sits in hertz, and what each sounds like when it rises or falls.',
      start: 'Play ▶ A, then ▶ B, and ask which region of the sound changed. Tap that band’s name, then read the truth line for its range in hertz.',
    },
    seeing: [
      'B has one EQ move spread across a whole band: “Which band changed from A to B?”',
      'The bands, low to high: Sub Bass, Bass, Low Mid, Mid, Upper Mid, Presence, Brilliance, Air. Level 1 uses Bass, Mid, Presence, Brilliance.',
      'After you answer, SEE IT shows spectra over shaded bands with short names such as BASS, MID and BRILL; the changed band glows, its name in green.',
    ],
    control: [
      '▶ A and ▶ B play the clips (■ stops); at the top level each allows two plays.',
      'Tap the band you think changed; NEXT TRIAL › moves on.',
      'SOURCE: Synth, Piano or Guitar. A recording takes over from the next trial.',
      'If your playback has no deep bass, check My playback can’t reproduce sub-bass to drop the Sub Bass band (20–60 Hz).',
      '⤢ FULL SCREEN enlarges the shaded bands. FINISH · SEE WHAT’S LEFT › lists what doesn’t count yet.',
    ],
    changes: [
      'The move is sized to its band, so the whole region rises or falls, not just one frequency.',
      'Each band has a character: boom (Bass), mud (Low Mid), honk (Mid), bite (Upper Mid), edge (Presence), sparkle (Brilliance).',
      'Levels: ±12 dB on four bands, then ±9 and ±6 dB on all eight, then ±4 dB. Up to level 3 a neighboring band earns half credit (CLOSE).',
    ],
    teaches: [
      'The band names engineers use to talk about a mix, and where each sits in hertz.',
      'How to describe a sound by region (“too much Low Mid”) before reaching for an exact frequency.',
      'A region is wider than one frequency: in EQ Recognition a move centered on one frequency; here the whole band moves together.',
    ],
    tryThis: [
      'After a reveal, read a truth line like “+9 dB in Low Mid (250 Hz–500 Hz), centered near 354 Hz”, then replay B and listen for mud.',
      'At level 2 or above, check the sub-bass box: from the next trial Sub Bass is gone and seven bands remain.',
      'Pick Guitar: when the chord has too little energy for a move, the truth line says that trial used pink noise instead.',
    ],
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  noise: {
    intro: {
      learning: 'What white, pink and brown noise and the four basic wave shapes sound like, and how each one’s spectrum explains its color.',
      start: 'Tap ▶ and ask first: noise, or a pitched wave? Tap your answer, then compare the SPECTRUM in SEE IT with the dashed slope guides.',
    },
    seeing: [
      'One clip (▶) and “What are you hearing?” Chips: White, Pink and Brown noise; Sine, Square, Sawtooth and Triangle wave.',
      'Level 1 plays the three noises or the four waves; level 2 mixes all seven; level 3 shortens clips and adds “Which clip is pink noise?” pairs.',
      'After you answer, SEE IT shows a SPECTRUM; on noise, dashed guides labeled 0, −3 and −6 dB/oct.',
    ],
    control: [
      '▶ plays the clip (■ stops); a pink pair has ▶ A and ▶ B. At level 3, the top, each clip allows two plays.',
      'Tap the noise color or wave shape you hear; NEXT TRIAL › moves on.',
      '⤢ FULL SCREEN enlarges the SPECTRUM with the ▶ chips under it, so you can replay while you compare slopes. FINISH · SEE WHAT’S LEFT › lists what doesn’t count yet.',
    ],
    changes: [
      'Noise is a slope. White is flat per hertz, so most of its energy sits up high: hiss. Pink falls 3 dB per octave; brown about 6 dB, mostly rumble.',
      'Each wave shape is a stack of harmonics: a sine has one; a square odd ones (hollow); a sawtooth all of them (bright, buzzy); a triangle odd ones that fade fast (soft).',
      'Each wave gets a new pitch between 200 and 800 Hz, so listen for its color, not the note.',
    ],
    teaches: [
      'The basic colors of sound: what each noise and each wave shape sounds like.',
      'How a spectrum’s slope, or its pattern of harmonics, matches what you hear.',
      'Pink noise is a common test signal for speakers and rooms, so it pays to know it by ear.',
      'These are the sounds the Noise and Oscillators labs build from their controls.',
    ],
    tryThis: [
      'On a noise trial, read SEE IT after you answer: the trace follows the 0 guide for white, −3 for pink, −6 dB/oct for brown.',
      'On a wave trial, look at SEE IT: a sine is one peak; the others are a row of peaks crowding together to the right — full for the sawtooth, every other one for square and triangle.',
      'On a pink pair, judge the hiss: pink has less than white and more than brown.',
    ],
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  defect: {
    intro: {
      learning: 'The names and first clues of common audio faults — steady or one-off, smooth or rough — and the mark each one leaves on an analyzer.',
      start: 'Tap ▶ and decide first: is the problem steady or one-off? Then tap the fault you hear, and compare it with SEE IT.',
    },
    seeing: [
      'One clip (▶): “What problem do you hear?” From level 3: “What problem is hiding in the program?”',
      'Level 1 chips: Hum, Hiss, Click, Distortion, Clipping, Dropout. Level 2 adds Ground loop (emulation), Buzz, Crackle, Pop, Digital glitch, RF interference (emulation).',
      'Then SEE IT: a SPECTRUM for hum, ground loop, buzz, hiss, RF and the two distortions; a WAVEFORM for clicks, pops, crackle, dropouts, glitches.',
    ],
    control: [
      '▶ plays the clip (■ stops); at level 4, the top, it allows two plays.',
      'Tap the problem you hear; NEXT TRIAL › moves on.',
      '⤢ FULL SCREEN enlarges SEE IT, so a spike or a hole is easier to spot. FINISH · SEE WHAT’S LEFT › lists what doesn’t count yet.',
    ],
    changes: [
      'Levels 1–2 play each fault alone. Level 3 hides it under a generated music bed; level 4 mixes the faults that sit on top (hum, hiss, clicks…) deeper still.',
      'At levels 1–2 a look-alike earns half credit: Hum and Ground loop, Crackle and Click, Distortion and Clipping.',
      'Hum from AC power sits at 50 or 60 Hz with soft harmonics, so it’s smooth. Buzz has the same rate with 60 harmonics, so it’s edgy.',
    ],
    teaches: [
      'The names of common faults, and the first clue to each: steady or one-off, smooth or rough.',
      'Each fault leaves a mark an analyzer shows: harmonics of hum from AC power, a raised noise floor, a spike, a hole.',
      'Naming the fault is the first step to finding its cause: a cable, a ground, a level, an edit.',
    ],
    tryThis: [
      'When Hum comes up, SEE IT shows a few peaks at the far left, the low end. On Buzz they run on up to 3 kHz (50 Hz power) or 3.6 kHz (60 Hz).',
      'Compare Dropout and Click on the WAVEFORM: a hole in the sound versus a single spike.',
      'On every trial, decide steady or one-off before you look at the chips.',
    ],
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  stereo: {
    intro: {
      learning: 'How to hear where a sound sits and how wide it is, what a flipped side feels like, and what a goniometer and correlation show.',
      start: 'Put on headphones and tap I’M ON HEADPHONES. Play the clip, tap what the image is doing, then compare the GONIOMETER shape and corr.',
    },
    seeing: [
      'First, HEADPHONES REQUIRED: phone speakers collapse the stereo image.',
      'One clip: “What is this stereo image doing?” Chips: Left, Right, Centered (mono); level 2 adds Wide and Narrow, level 3 Out of phase. Level 4: “Which clip is wider?”',
      'After you answer, SEE IT: a GONIOMETER marked L and R, “M up · S across” (M is what both sides share, S how they differ), and corr under it: how alike the sides are, 1 to −1.',
    ],
    control: [
      'Tap I’M ON HEADPHONES to open the drill; it asks each time you open this module.',
      '▶ plays the clip (■ stops); level 4 has ▶ A and ▶ B, two plays each.',
      'Tap the chip that matches what you hear; NEXT TRIAL › moves on.',
      '⤢ FULL SCREEN enlarges the goniometer and corr. FINISH · SEE WHAT’S LEFT › lists what doesn’t count yet.',
    ],
    changes: [
      'The goniometer plots one side against the other: upright is mono (corr 1.00), leaning to L or R is panned, flat is one side flipped (corr −1.00).',
      'Wide and Narrow are one scene with its S content turned up (a cloud) or down (hugging the vertical).',
      'On headphones a flipped side feels inside your head. Added together, flipped sides cancel: fully in a mono speaker, mostly in the lows from two speakers in a room.',
    ],
    teaches: [
      'How to read a stereo image by ear: side, center, width, and the in-head feel of a flipped side.',
      'A single centered source is mono: both sides identical.',
      'A goniometer shows where and how wide; correlation shows only how alike the sides are. The Stereo Imaging lab builds these images.',
    ],
    tryThis: [
      'On a Left trial, read corr after you answer: 1.00, the same as Centered. Correlation shows how alike the sides are, not where the sound sits.',
      'At level 3 compare Centered (mono) with Out of phase: corr goes from 1.00 to −1.00 and the line turns from upright to flat.',
      'Narrow hugs the vertical line: its corr reads about 0.9. Wide spreads into a cloud, yet its corr stays positive, about 0.3.',
    ],
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  loudness: {
    intro: {
      learning: 'How big a decibel really is: 6 dB is obvious, 1 dB is near the smallest change most people notice, and louder usually sounds better.',
      start: 'Play ▶ A, then ▶ B, and decide which is louder. After you answer, read the two level bars in SEE IT for the real gap in dB.',
    },
    seeing: [
      'Two clips of the same sound, A and B, at different levels: “Which is louder?” or “By about how much do A and B differ?”',
      'Chips: A is louder, B is louder — or 1 dB, 2 dB, 3 dB, 6 dB.',
      'After you answer, SEE IT shows two level bars, A and B. The louder reads 0.0 dB; the other shows how far below it sits.',
    ],
    control: [
      '▶ A and ▶ B play the clips (■ stops). At the top level each allows two plays, so compare them closely.',
      'Tap your answer; NEXT TRIAL › brings a new pair.',
      'FINISH · SEE WHAT’S LEFT › lists the modules that don’t count yet.',
    ],
    changes: [
      'Unlike most drills, the two clips are not loudness-matched: the level gap is the lesson, and only the gain differs.',
      'Both clips also shift together by up to 2 dB each trial, so you can’t learn one loudness as a cue.',
      'Levels shrink the gap: 6, 3, 2, then 1 dB. “By how much?” draws from every gap unlocked so far; level 1 asks only which is louder.',
    ],
    teaches: [
      'How big a decibel is: 6 dB is obvious; 1 dB is near the smallest change most people notice.',
      'Why fair comparisons match loudness: the louder version usually wins, even when nothing else changed.',
      'These are relative levels in dB, not a measured sound level: nothing here is calibrated.',
    ],
    tryThis: [
      'At level 2, after a “By about how much?” trial, read the bars: 0.0 dB and −3.0 dB, or 0.0 dB and −6.0 dB.',
      'Trust your first impression on “Which is louder?”, then check it against the bars.',
    ],
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  delay: {
    intro: {
      learning: 'How a time gap turns into what you hear — a separate echo, a slap, then a blur — and where your ear stops hearing two events.',
      start: 'Tap ▶ and listen just after the first pluck for its echo. Answer, then read SEE IT: the gold markers show the gap in ms.',
    },
    seeing: [
      'A plucked pattern with echoes. Three questions: which of A and B has a delay; which of A, B and C has the longest; or “About how long is the delay?”',
      'Time chips: 50 ms, 100 ms, 250 ms, 500 ms.',
      'After you answer, SEE IT shows a WAVEFORM with two gold dashed markers, a pluck and its echo, and the gap in ms above them.',
    ],
    control: [
      '▶ plays a clip (■ stops); at the top level each clip allows two plays, so listen for the echo from the first pluck.',
      'Tap the clip or time you hear; NEXT TRIAL › moves on.',
      '⤢ FULL SCREEN enlarges the WAVEFORM and its gold markers. FINISH · SEE WHAT’S LEFT › lists what doesn’t count yet.',
    ],
    changes: [
      'Each pluck gets an echo 6 dB down; from 250 ms on, fainter repeats follow.',
      'Long gaps sound like a separate echo. Near 50 ms the echo starts to blur into the sound. Much shorter gaps (under about 10 ms) fuse and color the tone: that’s Comb Filtering, Module 13.',
      'Levels: 500 ms, then 250 ms, 100 ms, 50 ms. Up to level 2 a neighboring time earns half credit.',
    ],
    teaches: [
      'How a time gap turns into what you hear: echo, slap, then thickening.',
      'Where the ear stops hearing two events and starts hearing one.',
      'How to read time on a waveform: from a pluck to its echo is the delay. The Delay lab adds feedback and tempo.',
    ],
    tryThis: [
      'After a “How long?” answer, read SEE IT: the gold ruler shows the delay, such as 250 ms from the pluck to its echo.',
      'On a “longest delay” trial, play A, B and C in a row and feel the gap after the first pluck in each.',
    ],
  },

  // ── 9 ─────────────────────────────────────────────────────────────────────
  reverb: {
    intro: {
      learning: 'What sets reverb spaces apart — decay time (RT60), density, bloom and brightness — and how room, chamber, hall, plate and spring each sound.',
      start: 'Tap ▶ and listen to what happens after each pluck stops. Answer, then look at the tail in SEE IT.',
    },
    seeing: [
      'A plucked pattern with reverb. Every space is generated and labeled (emulation): an imitation, not a real room or unit.',
      'Level 1: which of A and B has reverb. 2: Short, Medium or Long. 3: Room, Hall or Plate. 4: all five, adding Chamber and Spring. 5: Bright or Dark.',
      'After you answer, SEE IT shows a WAVEFORM of the tail at levels 1–4, a SPECTRUM at level 5.',
    ],
    control: [
      '▶ plays a clip (■ stops); at level 5, the top, each clip allows two plays.',
      'Tap the space or length you hear; NEXT TRIAL › moves on.',
      '⤢ FULL SCREEN enlarges the reverb tail. FINISH · SEE WHAT’S LEFT › lists what doesn’t count yet.',
    ],
    changes: [
      'Each space has its own tail: Room about 0.4 s, Chamber 1.0 s, Plate 1.6 s, Hall 2.2 s; Spring adds a wobbling ripple.',
      'Short, Medium and Long are built to an RT60 of 0.5, 1.2 and 2.5 s. RT60 is the time the tail takes to fall 60 dB.',
      'Bright or Dark keeps a 1.2 s decay and changes only the damping: a dark tail loses its highs first.',
    ],
    teaches: [
      'The words for reverb: decay time (RT60), density (how fast echoes pile into a smooth wash), bloom (how the tail builds) and brightness.',
      'What sets common spaces apart: room, chamber, hall, plate, spring.',
      'Real rooms and reverb units vary; these are typical examples. In the Reverb lab you set RT60, pre-delay, damping and mix yourself.',
    ],
    tryThis: [
      'At level 1, after you answer, play the dry clip and check the WAVEFORM: it falls straight to silence after each pluck.',
      'At level 2, read SEE IT after each answer: a Long tail (2.5 s) stretches far past a Short one (0.5 s).',
      'At level 4, Room and Chamber, or Hall and Plate, earn half credit for each other. Listen for bloom and density.',
    ],
  },

  // ── 10 ────────────────────────────────────────────────────────────────────
  compression: {
    intro: {
      learning: 'What compression does to a sound’s shape — flatter peaks, fuller gaps, pumping — and why it can seem better only because it’s louder.',
      start: 'Play ▶ A and ▶ B and listen to the drum hits, not the volume. Answer, then compare the two lanes in SEE IT.',
    },
    seeing: [
      'A generated drum pattern (kick and snare). Level 1: which of A and B is compressed. Levels 2–3: name one clip’s setting. Level 4: A and B again, light this time.',
      'Chips: None, Light, Moderate, Heavy, Pumping (level 2: None, Moderate, Heavy).',
      'After you answer, SEE IT shows a WAVEFORM of the peaks, one lane per clip.',
    ],
    control: [
      '▶ plays a clip (■ stops); at the top level each clip allows two plays, so focus on the hits from the start.',
      'Tap the setting you hear; NEXT TRIAL › moves on.',
      '⤢ FULL SCREEN enlarges the peak lanes. FINISH · SEE WHAT’S LEFT › lists what doesn’t count yet.',
    ],
    changes: [
      'Every clip is loudness-matched, so the clue is the shape, never the volume.',
      'Compression turns the loudest hits down: peaks flatten and the gaps between hits fill in.',
      'Light is 2:1 above −18 dBFS, Moderate 4:1 above −24, Heavy 8:1 above −30. Pumping, 10:1 above −35 with a 400 ms release, swells back up between hits.',
    ],
    teaches: [
      'What compression does to a sound’s shape: snap versus sit-down, and pumping.',
      'Why a compressed track can seem better only because it is louder.',
      'Reading “2:1 above −18 dBFS”: once the level passes −18 dBFS (18 dB under full scale), 2 dB more in gives 1 dB more out. Release is how fast it lets go.',
      'Light compression is meant to be hard to hear. The Compression lab shows the controls behind each setting.',
    ],
    tryThis: [
      'At level 1, read SEE IT after answering: the compressed lane’s hits are flatter and its gaps fuller.',
      'At level 3, when Pumping comes up, listen between the hits: the level swells back up.',
    ],
  },

  // ── 11 ────────────────────────────────────────────────────────────────────
  pitch: {
    intro: {
      learning: 'Relative pitch: which of two notes is higher, how the intervals from Unison to Octave sound, and that each interval is a frequency ratio.',
      start: 'Play ▶ A, then ▶ B, and sing the step between them. Tap the direction or interval you hear, then compare both harmonic stacks in SEE IT.',
    },
    seeing: [
      'Two notes, A then B: “Which note is higher?” or “What interval is A up to B?”',
      'Interval chips grow: Unison, Perfect 5th and Octave at level 1; Major 3rd and Perfect 4th join, then Major 2nd, Minor 3rd and Major 6th; from level 4, all 13.',
      'After you answer, SEE IT shows a SPECTRUM with both notes’ harmonic stacks.',
    ],
    control: [
      '▶ A and ▶ B play the notes (■ stops); at level 5, the top, each allows two plays.',
      'Tap the direction or interval you hear; NEXT TRIAL › moves on.',
      '⤢ FULL SCREEN enlarges the two harmonic stacks. FINISH · SEE WHAT’S LEFT › lists what doesn’t count yet.',
    ],
    changes: [
      'Higher-or-lower pairs close in: 12, 7, 4, 2, then 1 semitone apart (a semitone is one piano key).',
      'Notes are rich tones, not sines: more harmonics give your ear more to lock onto. The lower note sits between 110 and 440 Hz.',
      'An interval is a frequency ratio. Up to level 2, an interval one semitone off earns half credit.',
    ],
    teaches: [
      'Relative pitch: which note is higher, and the name of the gap.',
      'Interval names and their sound, from Unison to Octave.',
      'Hearing intervals helps you spot an off-pitch note and talk with musicians. The Tuning & Temperament Lab explains the ratios.',
    ],
    tryThis: [
      'On an interval trial, sing A then B as one step before you answer.',
      'After an Octave, look at SEE IT: up to A’s highest peak, each peak of B lands on every second peak of A — double the frequency.',
    ],
  },

  // ── 12 ────────────────────────────────────────────────────────────────────
  polarity: {
    intro: {
      learning: 'Polarity (a flip) versus phase (a time offset), and why two mics on one source can thin or even cancel the sound when they’re summed.',
      start: 'Play ▶ A and ▶ B and listen to the kick’s low end in each. Answer, then compare the spectra in SEE IT.',
    },
    seeing: [
      'A drum pattern picked up by two mics and summed. In one version, one copy is polarity-flipped.',
      'Level 1 always asks “Which sum is fuller?” of A and B. Levels 2–3 also play one clip to name: Normal sum, Polarity flipped or Partial cancellation.',
      'After you answer, SEE IT shows a SPECTRUM of the clip or clips.',
    ],
    control: [
      '▶ plays a clip (■ stops); at level 3, the top, each clip allows two plays.',
      'Tap the sum you hear; NEXT TRIAL › moves on.',
      '⤢ FULL SCREEN enlarges the SPECTRUM. FINISH · SEE WHAT’S LEFT › lists what doesn’t count yet.',
    ],
    changes: [
      'Level 1: identical copies. Flipped, they cancel completely, so silence is the expected result, not a fault; that clip’s level isn’t matched.',
      'Level 2: copies 0.2 ms apart; level 3: 0.5 ms apart, one 3 dB quieter. Flipped, the lows cancel: thin, not silent.',
      'Partial cancellation is in polarity but 1.2 ms late: notches from about 400 Hz up, lows intact.',
    ],
    teaches: [
      'Polarity (a flip) versus phase (a time offset), and what each does to a sum.',
      'Why two mics on one source can thin the low end, and why mixers have a polarity switch.',
      'A flip on one signal alone is rarely audible; the sum is where it bites. The Phase lab goes deeper.',
    ],
    tryThis: [
      'At level 1, after you answer, replay both clips: one full, the other silent. That’s total cancellation, not a fault.',
      'At level 2, on a “Which sum is fuller?” pair, listen to the kick: in the flipped sum its low end thins out while the snare’s crack stays.',
    ],
  },

  // ── 13 ────────────────────────────────────────────────────────────────────
  comb: {
    intro: {
      learning: 'What comb filtering sounds like, why a sound arriving twice a few milliseconds apart cuts evenly spaced notches, and how the delay sets their spacing.',
      start: 'Play ▶ A and ▶ B and listen for a hollow, tube-like color. Answer, then read the lower plot in SEE IT and note how far apart its dips are.',
    },
    seeing: [
      'A and B: pink noise or a drum pattern. One is mixed with a copy of itself 0.5–10 ms late. Level 4 adds X, a copy of A or B.',
      'After you answer, SEE IT shows both spectra on top.',
      'Below them: the measured ratio of the combed clip to the dry one (such as “A ÷ B · linear Hz”, 0 to 5k). Its dips are the notches.',
    ],
    control: [
      '▶ plays a clip (■ stops); at level 4, the top, each clip allows two plays, so listen for the hollow color right away.',
      'Chips: A or B; at level 4, X is A or X is B. NEXT TRIAL › moves on.',
      '⤢ FULL SCREEN enlarges both plots. FINISH · SEE WHAT’S LEFT › lists what doesn’t count yet.',
    ],
    changes: [
      'Where the copy arrives half a cycle late it cancels; a whole cycle late it adds. So dips repeat every 1 ÷ delay hertz, the first at half that.',
      'The delay changes every trial, so the notches move; the hollow “tube” sound stays.',
      'Levels turn the copy down: 0, −3, −6, then −9 dB. A quieter copy makes shallower notches, harder to hear.',
    ],
    teaches: [
      'What comb filtering sounds like, and where it comes from: a sound reaching a mic twice, by a reflection or a second mic.',
      'Spacing = 1 ÷ delay: a 1 ms delay notches every 1000 Hz.',
      'It’s what a very short delay becomes once the echo fuses (Delay Recognition). The Wave Physics Laboratory shows why.',
    ],
    tryThis: [
      'A truth line reading “Delayed copy 2.0 ms behind — notches every 500 Hz” puts the lower plot’s dips at 250, 750, 1250 Hz… 500 Hz apart.',
      'Across trials, compare spacing: near 10 ms the dips crowd together (100 Hz apart); near 1 ms they spread out (1000 Hz apart).',
    ],
  },

  // ── 14 ────────────────────────────────────────────────────────────────────
  clipping: {
    intro: {
      learning: 'How clipping sounds at each strength, why it lives on the loudest moments, and why every gain stage needs headroom below its ceiling.',
      start: 'Play ▶ A and ▶ B and listen to the loudest hits for crunch. Answer, then look in SEE IT for the flattened peaks.',
    },
    seeing: [
      'A generated drum pattern. Level 1: which of A and B is clipped. Levels 2–3: “How clipped is this?” Level 4: X is a copy of A or B, one clean, one mild.',
      'Chips: Clean, Mild, Moderate, Severe (level 2: Clean, Moderate, Severe).',
      'After you answer, SEE IT shows a SPECTRUM at level 1, a WAVEFORM at levels 2–4.',
    ],
    control: [
      '▶ plays a clip (■ stops); at level 4, the top, each clip allows two plays, so listen to the loudest hits.',
      'Tap how clipped it sounds; NEXT TRIAL › moves on.',
      '⤢ FULL SCREEN enlarges SEE IT, so flat tops are easier to see. FINISH · SEE WHAT’S LEFT › lists what doesn’t count yet.',
    ],
    changes: [
      'Clipping flattens the tallest peaks against a ceiling: Mild cuts 1 dB into the peaks, Moderate 4 dB, Severe 10 dB.',
      'Flat tops create new harmonics, so clipping adds crunch or buzz on the loudest hits only.',
      'The clips are loudness-matched afterwards. A neighboring severity earns half credit; calling a clipped clip Clean never does.',
    ],
    teaches: [
      'How clipping sounds at each strength, and that it lives on the loudest moments.',
      'Why every gain stage needs headroom, the space left before clipping.',
      'Clipping is a hard ceiling; the Distortion fault in Module 5 rounds the peaks instead. The Distortion lab compares them.',
    ],
    tryThis: [
      'At level 1, read SEE IT after answering: the clipped trace sprays extra energy across the top of the spectrum.',
      'At level 2, when Severe comes up, look at the WAVEFORM: the hits all stop at the same flat height — the ceiling.',
    ],
  },
};
