/**
 * Speech & Voice Lab — "explain this screen" content (owner 2026-10-31, the
 * Screen Guide rollout; pattern: wave/waveScreenGuides.ts and the PagedLab
 * guides, e.g. envelope/envelopeScreenGuides.ts).
 *
 * The lab is a PagedLab with no menu of its own: the learner lands on page 1
 * from TRAINING LAB → Voice & Speech, so page 1's guide also explains
 * the strip. One guide per page, keyed p1…p11 in page order (SpeechLabScreen
 * PAGES), plus the understanding check PagedLab appends (understandingChecks
 * SPEECH, keyed `check`). The what's-left screen has its own guide,
 * SPEECH_END_GUIDE (PagedLab `endGuide`, titled WHERE YOU ARE).
 *
 * Every line was written against the page's own code (speechPagesA/B,
 * headSection, speechViz, vowelViz, consonantViz, distanceViz, speechCharts,
 * features/speech/speechModel + speechSignals): names are the on-screen names
 * (keys, drawing labels, card headings), and every number quoted in TRY THIS
 * is what the page prints at that setting (test/screenGuide_speech_20261031
 * recomputes each one from the model).
 *
 * STEPPED: each section is one step held to SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; claims KNOWLEDGE, never skills;
 * no gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text. The check guides never give away an answer.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';

/** Each page key's title, in page order — pinned against SpeechLabScreen PAGES. */
export const SPEECH_GUIDE_PAGE_TITLES: Record<string, string> = {
  p1: 'The Speech System',
  p2: 'How a Voice Is Made',
  p3: 'Voiced vs Unvoiced',
  p4: 'Vowels & Formants',
  p5: 'Consonant Families',
  p6: 'Why Pop Filters Work',
  p7: 'Why Sibilance Exists',
  p8: 'The Distance Effect',
  p9: 'Voices Differ',
  p10: 'Speech Problem Simulator',
  p11: 'Check Yourself',
  check: 'Check your understanding',
};

export const SPEECH_SCREEN_GUIDES: Record<string, ScreenGuide> = {
  // ── 1 · The Speech System ─────────────────────────────────────────────────
  p1: {
    intro: {
      learning: 'The parts that make speech, in the order the air meets them: the lungs power it, the vocal folds buzz, the cavities shape the buzz, and the movers form words.',
      start: 'Tap 1 · LUNGS, then work up to 10 · LIPS and read each card. Then tap 5 · SOFT PALATE and 6 · NASAL CAVITY to see how air reaches the nose.',
    },
    seeing: [
      'You’re looking at the head and neck from the side (HEAD AND NECK, SIDE VIEW, NOT TO SCALE), with the CHEST below in FRONT VIEW.',
      'Eleven numbered discs follow the air: lungs (1) up to lips (10), then the jaw (11).',
      'Dark blue-gray is air space, red is muscle, cream is bone, pale blue is cartilage, pink is the lining.',
      'Under the drawing: a card, then buttons 1 · LUNGS to 11 · JAW.',
    ],
    control: [
      'Tap a numbered disc on the drawing, or its button under the card. That part lights up in cyan and the card explains its job in speech.',
      'Tap ⤢ FULL SCREEN under the drawing to enlarge it; zoom in and drag to pan. The same buttons and a two-line readout stay at the bottom.',
      'Use the strip under the title to move through the lab: ⏮ goes to the first page, ‹ PREV and NEXT › step one page, and the MODULE readout with ▾ lists every page.',
      'Tap ⓘ beside any page’s title to have that page explained.',
    ],
    changes: [
      'When you pick a part, it lights cyan and the card’s color key changes to show that part’s role.',
      'The numbers follow the air on purpose: the power (lungs), the pipe (trachea), the source (larynx), the resonators and their valve (throat, soft palate, nose), then the parts that shape the sound.',
      'The next page, How a Voice Is Made, sets these parts working in the same order.',
    ],
    teaches: [
      'Speech is air, a buzz, resonating cavities and a few fast-moving parts.',
      'Each part has a job: the lungs power the voice, the vocal folds in the larynx make the buzz, the cavities shape it, and the tongue, teeth, lips and jaw cut it into words.',
      'The larynx is the sound source. Everything above it works as a filter and a set of valves on that one buzz.',
    ],
    tryThis: [
      'Tap 3 · LARYNX: the card calls it the sound source. It also says the leaf above the folds is the epiglottis, a swallowing flap, not a speech part.',
      'Tap 5 · SOFT PALATE, then 6 · NASAL CAVITY: the soft palate is the flap that decides whether air reaches the nose at all.',
      'Tap the discs 1 to 10 in order and say out loud where the air goes next.',
    ],
  },

  // ── 2 · How a Voice Is Made ───────────────────────────────────────────────
  p2: {
    intro: {
      learning: 'How a voice is built from four jobs in a fixed order: breath powers it, the folds buzz, the cavities shape the buzz, and the mouth cuts it into words.',
      start: 'Tap ▶ PLAY THE SEQUENCE and watch which parts light at each stage. Then tap RESONANCE on the strip and read the card.',
    },
    seeing: [
      'Across the top, five numbered stages: BREATH, VOCAL FOLDS, RESONANCE, ARTICULATION, SPEECH. The stage you’re on is cyan.',
      'Below, the drawing from The Speech System plays that stage: air rising, the folds buzzing, the throat glowing, the tongue and lips moving.',
      'The card names the stage, says what happens, and ends with “What you would see:”.',
    ],
    control: [
      '‹ PREVIOUS and NEXT STAGE › step one stage at a time. Tap a box on the strip to jump straight to it.',
      '▶ PLAY THE SEQUENCE runs all five, about two seconds each, and stops on SPEECH; ■ STOP halts it. If reduced motion is on in your device’s settings, there’s no play key: step with the buttons.',
      'Tap a numbered part on the drawing to jump to the stage that uses it: 8, the tongue, opens ARTICULATION.',
      '⤢ FULL SCREEN enlarges the drawing; the strip, the readout and the stage keys come with it.',
    ],
    changes: [
      'Each stage adds one job. BREATH: air flows up. VOCAL FOLDS: the air sets the folds buzzing. RESONANCE: the throat, mouth and sometimes the nose boost some harmonics (the higher tones stacked on the buzz). ARTICULATION: tongue, lips, teeth and jaw shape and interrupt the sound.',
      'SPEECH lights every part from the larynx up, because real talking runs all the stages at once.',
    ],
    teaches: [
      'A voice is built in a fixed order: a power supply, a buzzing source, cavities that shape it, and movers that cut it into words.',
      'The cavities shape the buzz the folds hand them; they don’t create it.',
      'Voicing belongs to the folds, vowels to the cavities, and consonants to the movers.',
    ],
    tryThis: [
      'Tap ▶ PLAY THE SEQUENCE and watch the lit parts climb the body, from the lungs to the lips.',
      'Tap RESONANCE on the strip: the card reads 3 · RESONANCE, and the pharynx, soft palate and nasal cavity light up.',
      'Tap disc 1 on the drawing: the page jumps back to BREATH, the stage the lungs power.',
    ],
  },

  // ── 3 · Voiced vs Unvoiced ────────────────────────────────────────────────
  p3: {
    intro: {
      learning: 'What separates S from Z, F from V and P from B: the same mouth shape, with the vocal folds either buzzing (voiced) or held apart (unvoiced).',
      start: 'Put a finger on your throat and say “sss”, then “zzz”. Tap UNVOICED · S and VOICED · Z as you go and compare the trace on the right.',
    },
    seeing: [
      'You’re looking down at the larynx (LOOKING DOWN THE LARYNX · FRONT AT TOP): epiglottis, false fold, vocal fold, glottis, arytenoid. Two keys sit above: UNVOICED · S and VOICED · Z.',
      'On the right, a trace shows what leaves: puffs of air when voiced (WHAT COMES OUT), the mouth’s noise when not (WHAT THE MIC HEARS).',
      'Below: a card, a cue line, then THE PAIRS · SAME SHAPE, FOLDS OFF / ON with seven pair keys.',
    ],
    control: [
      'UNVOICED holds the folds apart; VOICED brings them together. The two keys show the chosen pair’s letters (S and Z to start).',
      'Tap a pair key (P / B, T / D, K / G, F / V, S / Z, SH / ZH and the two TH sounds) to change which pair the keys and the card talk about. The drawing stays the same for every pair, because inside a pair only the folds change.',
      '⤢ FULL SCREEN enlarges the larynx view, with the two keys under it.',
    ],
    changes: [
      'On VOICED, the folds meet. Air pressure blows them open and they snap shut, again and again. Each opening lets out a puff, so the trace becomes a regular train of pulses: a pitch.',
      'On UNVOICED, the folds swing apart into the breathing “V” and air rises freely (cyan). The trace turns to ragged noise, made higher up, in the mouth.',
    ],
    teaches: [
      'Voicing is the only difference inside pairs such as S and Z: the same mouth shape, folds off or on.',
      'Voiced sounds carry the pitch and most of the energy. Unvoiced sounds are noise with no pitch, and S and SH are where sibilance (the sharp hiss of S sounds) lives.',
      'An unvoiced sound has no note: its character comes from where the mouth squeezes or blocks the air.',
    ],
    tryThis: [
      'Put a finger on your throat. Say “sss”, then “zzz”, tapping UNVOICED · S and VOICED · Z as you go: you feel the buzz only on Z.',
      'Tap VOICED: the trace reads pulses → pitch + harmonics. With motion on, the note says SLOW MOTION · ABOUT 100× SLOWER.',
      'Tap the F / V pair, then UNVOICED · F: the card puts the hiss at the lower lip against the upper teeth.',
    ],
  },

  // ── 4 · Vowels & Formants ─────────────────────────────────────────────────
  p4: {
    intro: {
      learning: 'Why each vowel sounds different at the same pitch: the tongue, jaw and lips move the mouth’s resonant peaks, the formants F1 and F2.',
      start: 'Tap I · EE, then A · AH, and watch the gold peaks on the chart move. Read F1 and F2 in Hz on the card each time.',
    },
    seeing: [
      'Five vowel keys sit on top: A · AH, E · EH, I · EE, O · AW, U · OO.',
      'The drawing shows the tongue space (FRONT, BACK, HIGH, LOW) with a dot per vowel, the mouth from the side and the lips from the front.',
      'The chart shows the voice’s harmonics as bars, in dB below the strongest. The gold dashes are the mouth’s resonance, with F1, F2 and F3 marked. The card gives the formants in Hz.',
    ],
    control: [
      'Tap a vowel key. Its dot turns cyan, and the ring, the tongue, the jaw, the lips and the gold peaks glide to the new shape (they jump if reduced motion is on).',
      'Each drawing has ⤢ FULL SCREEN with the same keys under it; the chart’s full screen adds the formant readout.',
    ],
    changes: [
      'Where the tongue sits sets the mouth’s resonant peaks, called formants. They boost the harmonics near them, so the bars under a gold peak stand tallest.',
      'Tongue high, jaw nearly closed: a low F1. Tongue low, jaw open: a high F1. Tongue forward: a high F2; back: a low F2. Rounded lips pull every formant down a little.',
      'The harmonics stay 120 Hz apart: the pitch never moves, only their heights change.',
    ],
    teaches: [
      'A vowel is a mouth shape, not a pitch: the same buzz through a different filter.',
      'F1 follows how open the jaw is; F2 follows whether the tongue is forward or back.',
      'The values here are typical adult-male ones; women’s run roughly 15–20% higher, children’s higher again.',
    ],
    tryThis: [
      'Tap I · EE, then A · AH: F1 climbs from 270 to 730 Hz and F2 falls from 2290 to 1090 Hz. The two gold peaks move toward each other.',
      'Tap U · OO: the lips read rounded, with F1 ≈ 300 Hz and F2 ≈ 870 Hz, both low.',
      'Watch the jaw label as you tap each key: nearly closed on EE and OO, open on AH and AW, half open on EH.',
    ],
  },

  // ── 5 · Consonant Families ────────────────────────────────────────────────
  p5: {
    intro: {
      learning: 'How consonants differ by what the mouth does to the air, and how that puts each family’s energy in its own place in time and frequency.',
      start: 'Tap PLOSIVES and find the silent gap, then the burst on the spectrogram. Then tap FRICATIVES and NASALS and watch the color jump from top to bottom.',
    },
    seeing: [
      'Six family keys sit on top: PLOSIVES, FRICATIVES, AFFRICATES, NASALS, LIQUIDS, GLIDES. The card gives the letters, how each is made, and its Energy.',
      'The spectrogram shows one syllable, such as “PA”: time runs 400 ms left to right, frequency 0 to 8 kHz bottom to top. Black = silence, blue → red = quiet → loud. Spans on top name its parts.',
      'Below: an “At the microphone” card and an UNDERSTANDING CHECK.',
    ],
    control: [
      'Tap a family key: the card, the spectrogram and the microphone note all change together.',
      '⤢ FULL SCREEN enlarges the spectrogram, with a readout and the same keys.',
      'In the UNDERSTANDING CHECK at the foot, tap an answer. A wrong pick explains why, and you try again.',
    ],
    changes: [
      'Each family does something different to the air, so its energy lands in a different place on the picture.',
      'PLOSIVES: closure (silence), then a sharp vertical burst. FRICATIVES: hiss across the top of the picture. NASALS: a nasal hum only at the bottom. LIQUIDS and GLIDES: vowel-like bands that bend.',
      'AFFRICATES: a closure, then a short hiss.',
    ],
    teaches: [
      'Consonants are what the mouth does to the air: block it, squeeze it, reroute it through the nose, or slide between shapes.',
      'Where the energy sits explains two microphone problems: the hiss is a job for a de-esser (a compressor that acts only while it hears hiss), the plosive’s air for a pop filter.',
      'A spectrogram shows both at once: when a sound happens and where its energy sits.',
    ],
    tryThis: [
      'Tap FRICATIVES, then NASALS: the color jumps from the top of the picture (hiss) to the bottom (nasal hum).',
      'Tap PLOSIVES: find the black gap marked closure, then the burst marked release, then the vowel.',
      'Tap AFFRICATES: closure, then hiss, then vowel. It’s a stop (another name for a plosive) released straight into a fricative.',
    ],
  },

  // ── 6 · Why Pop Filters Work ──────────────────────────────────────────────
  p6: {
    intro: {
      learning: 'Why a “P” can overload a microphone: it carries a small sound and a slow gust of air, and a pop filter breaks up the gust but passes the sound.',
      start: 'Tap NO FILTER and watch the orange puff shove the capsule, then find the huge swing on the waveform. Then tap WITH A POP FILTER and compare.',
    },
    seeing: [
      'A slow-motion replay of one “P”: the talker on the left, a microphone’s capsule (the part that picks up sound) on the right, and a pop filter between them when it’s on.',
      'The legend: ● air (orange, the puff of moving air) and ) sound (cyan, the pressure fronts).',
      'Under it, the waveform of “PA” AT THE CAPSULE, 0 to 200 ms. The dashed lines are full scale, the loudest a recorder takes. Then WHY THE MESH WORKS.',
    ],
    control: [
      'NO FILTER and WITH A POP FILTER switch the replay and the waveform together, so you can compare what moves and what gets recorded.',
      'Each drawing has ⤢ FULL SCREEN, with the two keys under it.',
    ],
    changes: [
      'Either way, the sound front reaches the capsule first and passes the mesh untouched.',
      'On NO FILTER, the slow puff lands later and shoves the capsule’s thin membrane hard (it flashes orange). On the waveform, a huge slow swing reaches the dashed full-scale line.',
      'WITH A POP FILTER, the mesh breaks the puff into small eddies that die out, and the swing all but goes.',
    ],
    teaches: [
      'A “P” is two things at once: a small sound and a gust of moving air.',
      'Sound is a pressure ripple that passes through a fine mesh; a gust is moving air that the mesh breaks up. The consonant stays, the thump mostly goes.',
      'The same idea is behind foam windscreens and speaking slightly past the capsule.',
    ],
    tryThis: [
      'On NO FILTER, find the click when the lips part, at 20 ms, then the big slow swing after it. Tap WITH A POP FILTER: the click is the same, the swing nearly gone.',
      'Watch the capsule: a tiny cyan nudge when the sound arrives, then, on NO FILTER only, a big orange shove.',
      'Read the note under the replay: in real life the sound travels about 100 times faster than the puff, so it always arrives first.',
    ],
  },

  // ── 7 · Why Sibilance Exists ──────────────────────────────────────────────
  p7: {
    intro: {
      learning: 'Why an S hisses: air squeezed past the teeth makes noise at 4 to 10 kHz, far above the vowel, and that gap is what lets you tame it.',
      start: 'The page opens on "S": find the orange S LIVES HERE band and the gray vowel outline. Then tap VOWEL · AH and see which bars disappear.',
    },
    seeing: [
      'Two keys, VOWEL · AH and "S", sit over a spectrum: bars run from low to high frequency, 100 to 10k across the bottom; the corner note reads 0 dB = loudest band.',
      'An orange band, S LIVES HERE, spans 4 to 10 kHz.',
      'On "S" the vowel shows as a gray outline, for comparison. Below: three cards, WHY IT EXISTS, WHY IT GETS WORSE and WHAT TO DO.',
    ],
    control: [
      'VOWEL · AH and "S" swap the spectrum. The page opens on "S".',
      '⤢ FULL SCREEN enlarges the spectrum with the two keys under it.',
    ],
    changes: [
      'On "S" there’s very little low down; the energy peaks between 4 and 10 kHz, far above the vowel.',
      'On VOWEL · AH you see the voice’s harmonics, mostly below 1.5 kHz, gone off the bottom of the scale well before 4 kHz.',
      'The two barely overlap. That gap is what a de-esser uses, and what a presence boost (an EQ lift in the upper frequencies) hits by accident.',
    ],
    teaches: [
      'Sibilance is turbulence: air squeezed through a narrow channel and broken up on the teeth. It has no pitch.',
      'Bright mics, presence boosts and close placement make it worse. A suggested order of fixes: placement, gentle EQ, then a de-esser (a compressor that listens only to the hiss band).',
      'Because the hiss and the vowel sit in separate bands, the hiss can be turned down without dulling the vowel.',
    ],
    tryThis: [
      'On "S", find the gray vowel outline: it sits low and to the left, the S bars high and to the right, inside S LIVES HERE.',
      'Tap VOWEL · AH: inside the orange band the bars are gone. A de-esser listening there hears only the S.',
    ],
  },

  // ── 8 · The Distance Effect ───────────────────────────────────────────────
  p8: {
    intro: {
      learning: 'How mic distance changes a voice: closer gives more direct sound over the room and noise, but also stronger pops and bass boom, so every distance is a trade-off.',
      start: 'The page opens on 6". Tap 12", then 1", and watch the five bars. Compare how fast Plosive air climbs against Direct voice.',
    },
    seeing: [
      'A scene drawn to scale: the talker, a microphone on a ruler (lips, 1", 6", 12"), cyan sound fronts, and gray dashes for the room’s reflections.',
      'Five bars in dB: Direct voice, Room (reflections), Plosive air, Proximity bass, Voice over noise.',
      'A card for the distance you chose, then an UNDERSTANDING CHECK.',
    ],
    control: [
      'Three keys move the microphone: 1", 6" and 12". The page opens on 6".',
      'The microphone slides to its new spot and the bars glide to their new lengths.',
      'Both drawings have ⤢ FULL SCREEN; the bars’ full screen keeps the keys and a short readout of all five numbers.',
      'In the UNDERSTANDING CHECK at the foot, tap an answer. A wrong pick explains why, and you try again.',
    ],
    changes: [
      'Direct voice and Room read against direct voice at 12", Plosive air against the 12" puff. Proximity bass is the lift; Voice over noise, the gap to the noise.',
      'Direct voice spreads as it travels, so moving in adds about 6 dB per halving of distance. Room sound comes from all sides and holds steady: closer is drier.',
      'Plosive air climbs far faster; Proximity bass, a directional mic’s close-up lift, grows too.',
    ],
    teaches: [
      'Distance is the biggest control you have at the microphone, and it costs nothing.',
      'The direct-to-room balance is what “close” and “far” sound like.',
      'Moving in also brings pops and boom, so a working distance is a trade-off. These numbers show the trend; real mics and rooms differ.',
    ],
    tryThis: [
      'Tap 12": Direct voice and Plosive air read 0 dB, Room -14 dB, Proximity bass +2 dB, Voice over noise +36 dB.',
      'Tap 6": Direct voice +6 dB, Plosive air +15 dB, Proximity bass +4 dB. Room stays at -14 dB.',
      'Tap 1": Direct voice +22 dB, but Plosive air +54 dB and Proximity bass +12 dB. Voice over noise reads +58 dB: cleaner, but full of pops and boom.',
    ],
  },

  // ── 9 · Voices Differ ─────────────────────────────────────────────────────
  p9: {
    intro: {
      learning: 'Why adult male, adult female and child voices differ: fold size sets the pitch, vocal-tract length sets the formants, and real voices overlap.',
      start: 'Read the three rows: the pill for pitch, the bar for formants. Then open ⤢ FULL SCREEN and compare how tightly the harmonic ticks pack in each row.',
    },
    seeing: [
      'One chart on a scale from 100 Hz to 4 kHz, with three rows: Typical adult male, Typical adult female, Typical child.',
      'Each row has a thick pill for speaking pitch, with a tick at its typical value; a thin bar for formants F1–F3; and fine ticks for that voice’s harmonics.',
      'The legend ends “typical, not fixed”. Below the chart: TYPICAL, NOT FIXED, and a card for each voice.',
    ],
    control: [
      'There’s nothing to switch: this page is for reading. Tap ⤢ FULL SCREEN to enlarge the chart and read its numbers.',
      'GOT IT › at the end marks the page as done; NEXT does too.',
    ],
    changes: [
      'Pitch comes from the folds: longer, heavier folds vibrate more slowly. Formant height comes from the vocal tract: a longer tract puts the formants lower.',
      'The harmonic ticks sit every 120 Hz on the male row and every 300 Hz on the child’s: packed close for a low voice, far apart for a high one.',
      'The mouth can only boost harmonics that are there, so a high voice gives the formants fewer to lift.',
    ],
    teaches: [
      'Voices differ in pitch, set by the folds, and in formant height, set by the length of the tract. In real people the bands overlap.',
      'A lower voice puts more energy in the bottom octaves; higher formants push presence and sibilance up a little.',
      'The bands are starting points for gain and EQ, never rules about a person.',
    ],
    tryThis: [
      'Read the rows: pitch ~120 Hz, ~210 Hz and ~300 Hz; formants 270 Hz–3 kHz, 310 Hz–3.3 kHz and 370 Hz–3.7 kHz.',
      'Open ⤢ FULL SCREEN and compare the bright ticks inside each formant bar: the male row holds the most, packed tight; the child’s the fewest, far apart.',
    ],
  },

  // ── 10 · Speech Problem Simulator ─────────────────────────────────────────
  p10: {
    intro: {
      learning: 'What eight common voice problems do to the spectrum or the waveform, where each comes from, and why the first fix is with the talker or the microphone.',
      start: 'On SIBILANCE, compare the orange band with the gray clean voice, then read CAUSE and FIX. Then tap PLOSIVES and see the drawing become a waveform.',
    },
    seeing: [
      'Eight problem keys: SIBILANCE, PLOSIVES, MOUTH CLICKS, NASALITY, MUFFLED, OFF-AXIS, EXCESSIVE DISTANCE, POPPING BREATH.',
      'One drawing: a spectrum against a clean voice in gray (… · VS A CLEAN VOICE (GRAY)), or, for plosives, clicks and breath, a 250 ms waveform (… · WAVEFORM).',
      'Below: a cue line, then CAUSE, WHAT YOU HEAR and FIX.',
    ],
    control: [
      'Tap a problem key: the drawing, the cue and the card change. The page opens on SIBILANCE.',
      '⤢ FULL SCREEN stays open when a key swaps a spectrum for a waveform, with the keys under it, so you can step through every problem enlarged.',
    ],
    changes: [
      'Spectrum problems add or remove energy: an orange band marks energy that shouldn’t be there (EXCESS, HONK); a blue band marks energy lost (LOST).',
      'Waveform problems happen in time: an air blast swamping the voice, sharp single spikes, a shapeless breath rush.',
      'Every FIX starts before any processing: with the talker or at the microphone (placement, distance, a filter or windscreen, water, breathing).',
    ],
    teaches: [
      'Each common voice problem leaves its own mark on the spectrum or the wave, and has a usual first fix.',
      'Problems of tone show best on a spectrum; problems in time, like pops, clicks and breaths, show best on a waveform.',
      'Sibilance, plosives and nasality start with how the voice is made; distance and off-axis pickup start with where the mic sits.',
    ],
    tryThis: [
      'Tap OFF-AXIS: every bar sits below the gray clean voice, and the top end, marked LOST, falls away fastest. A mic’s pickup narrows most at high frequencies.',
      'Tap MOUTH CLICKS: four sharp spikes sit on the vowel wave, not part of the voice at all.',
      'Tap EXCESSIVE DISTANCE: the voice drops, but a floor of room and noise does not drop with it; at the very bottom and top, that floor rises above the gray clean voice.',
    ],
  },

  // ── 11 · Check Yourself ───────────────────────────────────────────────────
  p11: {
    intro: {
      learning: 'A review of seven ideas from this lab: voicing, formants, pop filters, the soft palate, sibilance, voice ranges and why a voice turns boomy up close.',
      start: 'Read each question and tap your answer. If it’s wrong, read the explanation before you pick again. Five right completes the page.',
    },
    seeing: [
      'Seven questions, one per idea, each in an UNDERSTANDING CHECK card. The answers come in a fresh order each visit, so you can’t go by position.',
      'A line on top counts how many are correct this visit and says whether the page is complete.',
    ],
    control: [
      'Tap an answer. A wrong pick explains itself: read it, then try again.',
      'Five right completes the page; NEXT › moves on to the lab’s final check at any time.',
      'If you leave, the questions start fresh; a page already complete stays complete.',
    ],
    changes: [
      'A right pick turns green with its explanation, and the card locks.',
      'Each question targets a common mix-up, such as loudness versus voicing, pitch versus vowel, mesh versus EQ, the epiglottis versus the soft palate, or a pitch number versus a person.',
    ],
    teaches: [
      'Voicing, formants, pop filters, the soft palate, sibilance, voice ranges and close-up boom each explain one step in how speech reaches a microphone.',
      'Every one traces back to a physical cause: the folds, the shape of the tract, the mouth, or the distance to the mic.',
    ],
    tryThis: [
      'Unsure about S and Z? Go back to Voiced vs Unvoiced and switch the folds off and on.',
      'Unsure why a voice turns boomy up close? Go back to The Distance Effect and compare the bars at 6" and 1".',
    ],
  },

  // ── The understanding check (appended by PagedLab) ────────────────────────
  check: {
    intro: {
      learning: 'A last look at the lab’s practical side: where an S’s hiss comes from, and the first fix for a talker who turns away, for clicks and for breath noise.',
      start: 'Answer each of the four questions and read why your pick is right or wrong. Unsure? Revisit Why Sibilance Exists or the Speech Problem Simulator, then come back.',
    },
    seeing: [
      'CHECK YOUR UNDERSTANDING for the Speech & Voice Lab: four questions on where the hiss of an S comes from, a talker who keeps turning toward their notes, mouth clicks, and breath noise.',
      'Above them you see how many are still to get right; a ✓ replaces a question’s number once it’s right.',
      'Every answer opens its explanation: CORRECT, or NOT QUITE — TRY ANOTHER.',
    ],
    control: [
      'Tap an answer. A wrong one stays open: pick again straight away. Nothing is lost and there is no score.',
      'FINISH · SEE WHAT’S LEFT › at the foot of the page (FINISH › in the strip) shows what is left in the lab, at any time.',
      'If you leave this page before all four are right, the questions start fresh.',
    ],
    changes: [
      'Each explanation gives the reason, right or wrong, so every answer teaches something.',
      'Get all four right and the lab is complete. A pass is kept: you never need to take the check twice.',
    ],
    teaches: [
      'Sibilance and the three talker problems here each have a cause you can name, and a first fix.',
      'Naming the cause first tells you whether the fix belongs with the talker, at the microphone, or in later processing.',
    ],
    tryThis: [
      'Unsure about the hiss? Why Sibilance Exists shows where it comes from.',
      'Unsure about clicks, breath or a talker who turns away? The Speech Problem Simulator shows each one, with its FIX.',
    ],
  },
};

/**
 * The what's-left END screen (PagedLab `endGuide`; LabEndScreen + labEnd).
 * Written against what this lab passes: no creditLabKey / pageCreditKeys, so
 * PROGRESS mode (rows read ✓ DONE, saved on this device); noun "page"; no
 * handsOnDetail / pageDetail / optionalPage, so no detail lines except the
 * appended check's own; the default DONE label (DONE · BACK TO LABS →
 * safeGoBack, the screen the lab was opened from); PRACTICE AGAIN → goTo(0),
 * clears nothing. A page counts done when NEXT/FINISH leaves it
 * (beforeAdvance) or one of its main keys calls ctx.markDone (GOT IT › on
 * Voices Differ; not p3's pair keys or FULL SCREEN); Check Yourself is manualDone and marks itself at
 * PASS_MARK = 5; the check marks itself at all four right and is banked to
 * the account (UNDERSTANDING_UNIT), so START OVER (PRACTICE) never unmarks it.
 * Pinned in test/screenGuide_speech_20261031 §7.
 */
export const SPEECH_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'The lab’s path at a glance: how speech is made from the lungs to the lips, and how voicing, formants, consonants, distance and voice type shape what a mic hears.',
    start: 'Tap the first page still listed to open it. If only Check your understanding is left, open it and get all four questions right.',
  },
  seeing: [
    'The big title reads WHAT’S LEFT, or LAB COMPLETE once every page and the check are done. The line under it says what is left and whether your work is saved on this device.',
    'Each page not done yet is a row, by name; the check’s row, Check your understanding, is marked CHECK.',
    'Pages you’ve done, and the check once passed, fold into one ✓ DONE line. If saved progress can’t be read, the title reads YOUR PROGRESS.',
  ],
  control: [
    'Tap a row to jump straight to that page, or to the check.',
    'REVIEW ▾ on the ✓ DONE line unfolds what you’ve done; tap any row to open it again. HIDE ▴ folds them away.',
    'PRACTICE AGAIN FROM THE START opens The Speech System and clears nothing. DONE · BACK TO LABS leaves the lab, back to the screen you opened it from.',
    'On the strip, ‹ PREV returns to the page you came from, ⏮ opens the first page, and WHAT’S LEFT ▾ lists every page.',
  ],
  changes: [
    'A page counts once you leave it with NEXT ›, or sooner when you tap one of its main keys (GOT IT › on Voices Differ). Opening it from a list counts nothing.',
    'Check Yourself counts only at five right in one visit; the check, only once all four are right.',
    'START OVER (PRACTICE), in the strip’s list, clears the page marks; a passed check stays done.',
  ],
  teaches: [
    'The lab’s ideas in order: the parts of the voice, how a voice is made, voicing, vowels, consonants, plosives, sibilance, distance, how voices differ, and common problems.',
    'Together they follow speech from the lungs to the microphone, so any voice problem can be traced back to where it starts.',
  ],
  tryThis: [
    'If any row is still listed, open the first one straight from here and try its keys or answers; on any page before Check Yourself, NEXT › then counts it.',
    'If the CHECK row is still listed, open it: a wrong answer explains itself, so read it and pick again.',
    'Open the Speech Problem Simulator, from its row or from REVIEW ▾, and tap each problem key: name the earlier page each problem comes from.',
  ],
};

/** PagedLab's `pageGuide`: page index (0-based) → that page's guide. Index 11
 *  is the appended understanding check; the what's-left screen uses
 *  SPEECH_END_GUIDE (PagedLab `endGuide`) instead. */
export function speechPageGuide(index: number): ScreenGuide | undefined {
  if (index === 11) return SPEECH_SCREEN_GUIDES.check;
  return SPEECH_SCREEN_GUIDES[`p${index + 1}`];
}
