/**
 * Speech & Voice Lab — "explain this screen" content (owner 2026-10-31, the
 * Screen Guide rollout; pattern: wave/waveScreenGuides.ts and the PagedLab
 * guides, e.g. envelope/envelopeScreenGuides.ts).
 *
 * The lab is a PagedLab with no menu of its own: the learner lands on page 1
 * from Advanced Training → Voice & Speech, so page 1's guide also explains
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
    seeing: [
      'The head and neck from the side (HEAD AND NECK, SIDE VIEW, NOT TO SCALE), with the CHEST below in FRONT VIEW.',
      'Eleven numbered discs, ten on leader lines (the tongue, 8, sits in place), in airflow order: lungs (1) to lips (10), then the jaw (11).',
      'Dark blue-gray is air space, red is muscle, cream is bone, pale blue is cartilage, pink is the lining.',
      'Under it, a card, then buttons 1 · LUNGS to 11 · JAW.',
    ],
    control: [
      'Tap a numbered disc on the drawing, or its button under the card. The part lights up in cyan and the card explains its job.',
      '⤢ FULL SCREEN under the drawing enlarges it (zoom, drag to pan). The same buttons and a two-line readout ride along at the bottom.',
      'The strip under the title: ⏮ goes to the first page, ‹ PREV and NEXT › step one page, and the MODULE readout with ▾ opens a list of every page.',
      'Tap ⓘ beside any page’s title to have that page explained.',
    ],
    changes: [
      'Choosing a part lights it in cyan and swaps the colour key in the card for that part’s role.',
      'The numbers follow the airflow on purpose: the power (lungs), the pipe (trachea), the source (larynx), the resonators and their valve (throat, soft palate, nose), then the parts that shape the sound.',
      'The next page plays these parts in the same order.',
    ],
    teaches: [
      'Speech is air, a buzz, resonating cavities and a few fast-moving parts.',
      'Which part does which job: the lungs power it, the folds make the buzz, the cavities shape it, and the tongue, teeth, lips and jaw cut it into words.',
      'The first page of the Speech & Voice Lab, in Advanced Training’s Voice & Speech section. Every later page uses these names.',
    ],
    tryThis: [
      'Tap 3 · LARYNX: the card calls it the sound source, and says the leaf above the folds is the epiglottis, a swallowing flap, not a speech part.',
      'Tap 5 · SOFT PALATE, then 6 · NASAL CAVITY: the flap decides whether air reaches the nose at all.',
      'Tap the discs 1 to 10 in order and say where the air goes next.',
    ],
  },

  // ── 2 · How a Voice Is Made ───────────────────────────────────────────────
  p2: {
    seeing: [
      'A strip of five numbered stages: BREATH, VOCAL FOLDS, RESONANCE, ARTICULATION, SPEECH. The current one is cyan.',
      'Below, the head-and-neck drawing with that stage’s parts lit, playing what they do: air rising, the folds buzzing, the throat glowing, the tongue and lips moving.',
      'A card names the stage, says what happens and ends “What you would see:”.',
    ],
    control: [
      '‹ PREVIOUS and NEXT STAGE › step one stage. Tapping a box on the strip jumps straight to it.',
      '▶ PLAY THE SEQUENCE steps through all five, about two seconds each, and stops on SPEECH; ■ STOP halts it. With reduced motion on there is no play key: step with the buttons.',
      'Tap a numbered part on the drawing to jump to the stage that uses it: 8, the tongue, opens ARTICULATION.',
      '⤢ FULL SCREEN enlarges the drawing; the strip, the readout and the stage keys come with it.',
    ],
    changes: [
      'Each stage adds one job. BREATH: air flows up. VOCAL FOLDS: the air sets the folds buzzing. RESONANCE: the throat, mouth and sometimes the nose boost some harmonics. ARTICULATION: tongue, lips, teeth and jaw shape and interrupt the sound.',
      'SPEECH lights every part from the larynx up: real talking runs all the stages at once.',
    ],
    teaches: [
      'How a voice is built in order: a power supply, a buzzing source, cavities that shape it, and movers that cut it into words.',
      'The order never changes, so the next pages take one stage each: voicing, vowels, consonants.',
      'It builds on the parts named on The Speech System.',
    ],
    tryThis: [
      'Tap ▶ PLAY THE SEQUENCE and watch the lit parts climb the body, from the lungs to the lips.',
      'Tap RESONANCE on the strip: the card reads 3 · RESONANCE, and the pharynx, soft palate and nasal cavity light up.',
      'Tap disc 1 on the drawing: the page jumps back to BREATH.',
    ],
  },

  // ── 3 · Voiced vs Unvoiced ────────────────────────────────────────────────
  p3: {
    seeing: [
      'Two keys, UNVOICED · S and VOICED · Z, over a view LOOKING DOWN THE LARYNX · FRONT AT TOP: epiglottis, false fold, vocal fold, glottis, arytenoid.',
      'On the right, a trace: the airflow puffs when voiced (WHAT COMES OUT), the mouth’s noise when not (WHAT THE MIC HEARS).',
      'A card, a cue line, then THE PAIRS · SAME SHAPE, FOLDS OFF / ON with seven pair keys.',
    ],
    control: [
      'UNVOICED and VOICED hold the folds apart or bring them together. The keys carry the chosen pair’s letters (S and Z to start).',
      'The pair keys (P / B, T / D, K / G, F / V, S / Z, SH / ZH and the two TH sounds) change which pair the keys and the card talk about. The drawing is the same for every pair.',
      '⤢ FULL SCREEN enlarges the larynx view with the two keys under it.',
    ],
    changes: [
      'VOICED: the folds meet; air pressure blows them open and they snap shut, again and again. Each opening lets out a puff, so the trace is a regular train of pulses: a pitch.',
      'UNVOICED: the folds swing apart into the breathing “V” and air rises freely (cyan). The trace turns to ragged noise made higher up, in the mouth.',
    ],
    teaches: [
      'Voicing is the one difference inside pairs such as S and Z: the same mouth shape, folds off or on.',
      'Voiced sounds carry the pitch and most of the energy; unvoiced sounds are noise with no pitch, and S and SH are where sibilance lives.',
      'It follows the five stages; Vowels & Formants comes next.',
    ],
    tryThis: [
      'Say “sss”, then “zzz”, with a finger on your throat, tapping UNVOICED · S and VOICED · Z as you go.',
      'Tap VOICED: the trace reads pulses → pitch + harmonics. With motion on, the note says SLOW MOTION · ABOUT 100× SLOWER.',
      'Tap the F / V pair, then UNVOICED · F: the card puts the hiss at the lower lip against the upper teeth.',
    ],
  },

  // ── 4 · Vowels & Formants ─────────────────────────────────────────────────
  p4: {
    seeing: [
      'Five vowel keys: A · AH, E · EH, I · EE, O · AW, U · OO.',
      'A drawing: the tongue space (FRONT, BACK, HIGH, LOW) with a dot per vowel, the mouth from the side and the lips from the front.',
      'A chart of the voice’s harmonics (bars, dB below the strongest) with the mouth’s resonance in gold dashes, F1, F2 and F3 marked. A card reads the formants in Hz.',
    ],
    control: [
      'Tap a vowel key. Its dot turns cyan, and the ring, the tongue, the jaw, the lips and the gold peaks glide to the new shape (they jump with reduced motion).',
      'Each drawing has ⤢ FULL SCREEN with the same keys under it; the chart’s full screen adds the formant readout.',
    ],
    changes: [
      'Where the tongue sits sets the mouth’s resonant peaks, the formants. They boost the harmonics near them, so the bars under a gold peak stand tallest.',
      'Tongue high, jaw nearly closed: a low F1. Tongue low, jaw open: a high F1. Tongue forward: a high F2; back: a low F2. Rounded lips pull every formant down a little.',
      'The harmonics stay 120 Hz apart: only their heights change.',
    ],
    teaches: [
      'A vowel is a mouth shape, not a pitch: the same buzz through a different filter.',
      'F1 follows how open the jaw is; F2 follows front versus back.',
      'The values are typical adult-male ones; women’s run roughly 15–20% higher, children’s higher again.',
      'Next: Consonant Families.',
    ],
    tryThis: [
      'Tap I · EE, then A · AH: F1 climbs from 270 to 730 Hz and F2 falls from 2290 to 1090 Hz. The two gold peaks move toward each other.',
      'Tap U · OO: the lips read rounded, with F1 ≈ 300 Hz and F2 ≈ 870 Hz, both low.',
      'Watch the jaw label: nearly closed on EE and OO, open on AH and AW, half open on EH.',
    ],
  },

  // ── 5 · Consonant Families ────────────────────────────────────────────────
  p5: {
    seeing: [
      'Six family keys: PLOSIVES, FRICATIVES, AFFRICATES, NASALS, LIQUIDS, GLIDES. A card gives the letters, how each is made, and Energy.',
      'A spectrogram of one syllable, such as “PA”: 400 ms left to right, 0 to 8k Hz bottom to top. Black = silence, blue → red = quiet → loud. Spans on top name its parts.',
      'Then an “At the microphone” card and an UNDERSTANDING CHECK.',
    ],
    control: [
      'Tap a family key: the card, the spectrogram and the microphone note all change.',
      '⤢ FULL SCREEN enlarges the spectrogram, with a readout and the same keys.',
      'The UNDERSTANDING CHECK at the foot: tap an answer. A wrong pick explains, and you try again.',
    ],
    changes: [
      'Each family does something different to the air, so its energy lands in a different place.',
      'PLOSIVES: closure (silence), then a sharp vertical burst. FRICATIVES: hiss across the top of the picture. NASALS: a nasal hum only at the bottom. LIQUIDS and GLIDES: vowel-like bands that bend.',
      'AFFRICATES: a closure, then a short hiss.',
    ],
    teaches: [
      'Consonants are what the mouth does to the air: block it, squeeze it, reroute it, or slide between shapes.',
      'Where the energy sits explains two microphone problems: the hiss is a job for a de-esser (a compressor that acts only while it hears hiss), the plosive’s air for a pop filter.',
      'The next two pages look closely at plosives and sibilance.',
    ],
    tryThis: [
      'Tap FRICATIVES, then NASALS: the colour jumps from the top of the picture (hiss) to the bottom (nasal hum).',
      'Tap PLOSIVES: a black gap marked closure, then the burst marked release, then the vowel.',
      'Tap AFFRICATES: closure, then hiss, then vowel. A stop released straight into a fricative.',
    ],
  },

  // ── 6 · Why Pop Filters Work ──────────────────────────────────────────────
  p6: {
    seeing: [
      'A slow-motion replay of one “P”: the talker on the left, a microphone’s capsule on the right, and a pop filter between them when it is on.',
      'Legend: ● air (orange, the puff of moving air) and ) sound (cyan, the pressure fronts).',
      'Under it, the waveform of “PA” AT THE CAPSULE, 0 to 200 ms. The dashed lines are full scale, the loudest a recorder takes. Then WHY THE MESH WORKS.',
    ],
    control: [
      'NO FILTER and WITH A POP FILTER switch the replay and the waveform together.',
      'Each drawing has ⤢ FULL SCREEN, with the two keys under it.',
    ],
    changes: [
      'The sound front reaches the capsule first either way, and passes the mesh untouched.',
      'NO FILTER: the slow puff lands later and shoves the capsule’s thin membrane hard (it flashes orange). On the waveform, a huge slow swing reaches the dashed full-scale line.',
      'WITH A POP FILTER: the mesh breaks the puff into small eddies that die out, and the swing all but goes.',
    ],
    teaches: [
      'A “P” is two things at once: a small sound and a gust of moving air.',
      'Sound is a pressure ripple that passes a fine mesh; a gust is moving air that the mesh breaks up. The consonant stays, the thump mostly goes.',
      'The same idea is behind foam windscreens and speaking slightly past the capsule.',
    ],
    tryThis: [
      'On NO FILTER, find the click when the lips part, at 20 ms, then the big slow swing after it. Tap WITH A POP FILTER: the click is the same, the swing nearly gone.',
      'Watch the capsule: a tiny cyan tick when the sound arrives, then, on NO FILTER only, a big orange shove.',
      'Read the note under the replay: in real life the sound travels about 100 times faster than the puff.',
    ],
  },

  // ── 7 · Why Sibilance Exists ──────────────────────────────────────────────
  p7: {
    seeing: [
      'Two keys, VOWEL · AH and "S", over a spectrum: bars from low to high frequency, 100 to 10k across the bottom, 0 dB = loudest band.',
      'An orange band, S LIVES HERE, spans 4 to 10 kHz.',
      'On "S" the vowel shows as a gray outline. Then three cards: WHY IT EXISTS, WHY IT GETS WORSE, WHAT TO DO.',
    ],
    control: [
      'VOWEL · AH and "S" swap the spectrum. The page opens on "S".',
      '⤢ FULL SCREEN enlarges the spectrum with the two keys under it.',
    ],
    changes: [
      '"S": very little low down; its energy peaks between 4 and 10 kHz, far above the vowel.',
      'VOWEL · AH: the voice’s harmonics, mostly below 1.5 kHz, gone off the bottom of the scale well before 4 kHz.',
      'The two barely overlap. That gap is what a de-esser uses, and what a presence boost (an EQ lift in the upper frequencies) hits by accident.',
    ],
    teaches: [
      'Sibilance is turbulence: air squeezed through a narrow channel and broken up on the teeth. It has no pitch.',
      'Why bright mics, presence boosts and close placement make it worse, and a suggested order of fixes: placement, gentle EQ, then a de-esser (a compressor that listens only to the hiss band).',
      'The De-Esser & Sibilance Control lab (Dynamics → Smart Processors Lab) shows how that processor decides.',
    ],
    tryThis: [
      'On "S", find the gray vowel outline: it sits low and to the left, the S bars high and to the right, inside S LIVES HERE.',
      'Tap VOWEL · AH: inside the orange band the bars are gone.',
    ],
  },

  // ── 8 · The Distance Effect ───────────────────────────────────────────────
  p8: {
    seeing: [
      'A scene drawn to scale: the talker, a microphone on a ruler (lips, 1", 6", 12"), cyan sound fronts, gray dashes for the room’s reflections.',
      'Five bars in dB: Direct voice, Room (reflections), Plosive air, Proximity bass, Voice over noise.',
      'A card for the chosen distance, then an UNDERSTANDING CHECK.',
    ],
    control: [
      'Three keys: 1", 6" and 12". The page opens on 6".',
      'The microphone slides to its new spot and the bars glide to their new lengths.',
      'Both drawings have ⤢ FULL SCREEN; the bars’ full screen keeps the keys and a short readout of all five numbers.',
      'The UNDERSTANDING CHECK at the foot: tap an answer. A wrong pick explains, and you try again.',
    ],
    changes: [
      'Direct voice and Room read against the direct voice at 12"; Plosive air against the puff at 12"; Proximity bass is the lift itself; Voice over noise, the gap to the noise floor.',
      'Direct voice spreads as it travels, so it grows as you move in. Room sound comes from all sides and barely changes: closer sounds drier.',
      'Plosive air climbs far faster; Proximity bass, a directional mic’s close-up lift, grows too.',
    ],
    teaches: [
      'Distance is the biggest control at the microphone, and it costs nothing.',
      'The direct-to-room balance is what “close” and “far” sound like.',
      'Moving in also brings pops and boom, so a working distance is a trade. The numbers are illustrative.',
    ],
    tryThis: [
      'Tap 12": Direct voice and Plosive air read 0 dB, Room -14 dB, Proximity bass +2 dB, Voice over noise +36 dB.',
      'Tap 6": Direct voice +6 dB, Plosive air +15 dB, Proximity bass +4 dB. Room stays at -14 dB.',
      'Tap 1": Direct voice +22 dB, but Plosive air +54 dB and Proximity bass +12 dB. Voice over noise reads +58 dB.',
    ],
  },

  // ── 9 · Voices Differ ─────────────────────────────────────────────────────
  p9: {
    seeing: [
      'One chart on a scale marked 100 Hz to 4 kHz, with three rows: Typical adult male, Typical adult female, Typical child.',
      'Each row: a thick pill for speaking pitch with a tick at its typical value, a thin bar for formants F1–F3, and fine ticks for that voice’s harmonics.',
      'The legend ends “typical, not fixed”. Below: TYPICAL, NOT FIXED, and a card per voice.',
    ],
    control: [
      'Nothing to switch: this page is reading. ⤢ FULL SCREEN enlarges the chart to read its numbers.',
      'GOT IT › at the end marks the page; NEXT does too.',
    ],
    changes: [
      'Pitch comes from the folds: longer, heavier folds vibrate more slowly. Formant height comes from the vocal tract: a longer tract puts the formants lower.',
      'The harmonic ticks sit every 120 Hz on the male row and every 300 Hz on the child’s: packed close for a low voice, far apart for a high one.',
      'The mouth can only boost harmonics that are there.',
    ],
    teaches: [
      'Why voices differ in pitch and in formant height, and that the bands overlap in real people.',
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
    seeing: [
      'Eight problem keys: SIBILANCE, PLOSIVES, MOUTH CLICKS, NASALITY, MUFFLED, OFF-AXIS, EXCESSIVE DISTANCE, POPPING BREATH.',
      'One drawing: a spectrum against a clean voice (… · VS A CLEAN VOICE (GRAY)), or for plosives, clicks and breath a 250 ms waveform (… · WAVEFORM).',
      'A cue line, then CAUSE, WHAT YOU HEAR and FIX.',
    ],
    control: [
      'Tap a problem key: the drawing, the cue and the card change. The page opens on SIBILANCE.',
      '⤢ FULL SCREEN stays open when a key swaps a spectrum for a waveform, with the keys under it.',
    ],
    changes: [
      'Spectrum problems add or remove energy: an orange band marks energy that should not be there (EXCESS, HONK); a blue band marks energy lost (LOST).',
      'Waveform problems happen in time: an air blast swamping the voice, sharp single ticks, a shapeless breath rush.',
      'Every FIX starts before any processing: with the talker or at the microphone (placement, distance, a filter or windscreen, water, how you breathe).',
    ],
    teaches: [
      'What each common voice problem does to the spectrum or the wave, and the usual first fix for it.',
      'It pulls the lab together: sibilance, plosives, nasality, distance and off-axis pickup all come from earlier pages.',
      'Next: Check Yourself.',
    ],
    tryThis: [
      'Tap OFF-AXIS: every bar sits below the gray clean voice, and the top end, marked LOST, falls away fastest.',
      'Tap MOUTH CLICKS: four sharp spikes sit on the vowel wave, not part of the voice at all.',
      'Tap EXCESSIVE DISTANCE: the voice drops, but a floor of room and noise does not drop with it; at the very bottom and top, that floor rises above the gray clean voice.',
    ],
  },

  // ── 11 · Check Yourself ───────────────────────────────────────────────────
  p11: {
    seeing: [
      'Seven questions, one per idea, each in an UNDERSTANDING CHECK card; the answers come in a fresh order each visit.',
      'A line on top counts how many are correct this visit and says whether the page is complete.',
    ],
    control: [
      'Tap an answer. A wrong pick explains itself: read it, then try again.',
      'Five right completes the page; NEXT › moves on to the lab’s final check at any time.',
      'Leaving starts the questions fresh; a page already complete stays complete.',
    ],
    changes: [
      'A right pick turns green with its explanation, and the card locks.',
      'Each question targets a common mix-up, such as loudness versus voicing, pitch versus vowel, mesh versus EQ, the epiglottis versus the soft palate, or a pitch number versus a person.',
    ],
    teaches: [
      'Whether the lab’s ideas stuck: voicing, formants, pop filters, the soft palate, sibilance, voice ranges and close-up boom.',
      'Wrong picks are part of it: each explanation says why.',
    ],
    tryThis: [
      'Unsure about S and Z? Go back to Voiced vs Unvoiced and switch the folds off and on.',
      'Unsure why a voice turns boomy up close? Go back to The Distance Effect and compare the bars at 6" and 1".',
    ],
  },

  // ── The understanding check (appended by PagedLab) ────────────────────────
  check: {
    seeing: [
      'CHECK YOUR UNDERSTANDING for the Speech & Voice Lab: four questions — where the hiss of an S comes from, a talker who keeps turning toward their notes, mouth clicks, and breath noise.',
      'Above them, how many are still to get right; a ✓ replaces a question’s number once it is right.',
      'Every answer opens its explanation: CORRECT, or NOT QUITE — TRY ANOTHER.',
    ],
    control: [
      'Tap an answer. A wrong one stays open: pick again straight away. Nothing is lost and there is no score.',
      'FINISH · SEE WHAT’S LEFT › at the foot of the page (FINISH › in the strip) shows what is left in the lab, at any time.',
      'Leaving this page before all four are right starts the questions fresh.',
    ],
    changes: [
      'Each explanation gives the reason, right or wrong — the teaching moment either way.',
      'All four right completes the lab. It counts toward every certificate and program that needs it, and never has to be taken twice.',
    ],
    teaches: [
      'Whether the lab’s practical side stuck: what makes sibilance, and the first fix, before any editing, for a talker who turns away, for clicks and for breath.',
      'Each question reaches back to a page: Why Sibilance Exists and the Speech Problem Simulator.',
    ],
    tryThis: [
      'Unsure about the hiss? Why Sibilance Exists draws where it comes from.',
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
  seeing: [
    'The big title reads WHAT’S LEFT, or LAB COMPLETE once every page and the check are done (YOUR PROGRESS if saved progress cannot be read). Under WHAT’S LEFT, a line says what is left and whether your work is saved on this device.',
    'Each page not done yet is a row, by name; the check’s row, Check your understanding, is marked CHECK.',
    'The pages you have done, and the check once passed, fold into one ✓ DONE line.',
  ],
  control: [
    'Tap a row to jump straight to that page, or to the check.',
    'REVIEW ▾ on the ✓ DONE line unfolds what you have done; tap any row to open it again. HIDE ▴ folds them away.',
    'PRACTICE AGAIN FROM THE START opens The Speech System and clears nothing. DONE · BACK TO LABS leaves the lab, back to the screen you opened it from.',
    'On the strip, ‹ PREV returns to the page you came from, ⏮ opens the first page, and WHAT’S LEFT ▾ lists every page.',
  ],
  changes: [
    'A page counts once you leave it with NEXT ›, or sooner when you tap one of its main keys (GOT IT › on Voices Differ). Opening it from a list counts nothing.',
    'Check Yourself counts only at five right in one visit; the check, only once all four are right.',
    'START OVER (PRACTICE), in the strip’s list, clears the page marks; a passed check stays done.',
  ],
  teaches: [
    'Which of the lab’s ideas you have met — anatomy, how a voice is made, voicing, vowels, consonants, plosives, sibilance, distance, voices, problems — and which are still ahead.',
    'The check is what completes the lab for any certificate or program that lists it.',
  ],
  tryThis: [
    'If any row is still listed, open the first one straight from here and try its keys or answers; on any page before Check Yourself, NEXT › then counts it.',
    'If the CHECK row is still listed, open it: a wrong answer explains itself, so read it and pick again.',
    'Open the Speech Problem Simulator, from its row or from REVIEW ▾ once it is done, and tap each problem key in turn.',
  ],
};

/** PagedLab's `pageGuide`: page index (0-based) → that page's guide. Index 11
 *  is the appended understanding check; the what's-left screen uses
 *  SPEECH_END_GUIDE (PagedLab `endGuide`) instead. */
export function speechPageGuide(index: number): ScreenGuide | undefined {
  if (index === 11) return SPEECH_SCREEN_GUIDES.check;
  return SPEECH_SCREEN_GUIDES[`p${index + 1}`];
}
