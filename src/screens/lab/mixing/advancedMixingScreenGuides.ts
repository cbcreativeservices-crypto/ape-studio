/**
 * Advanced Mixing — "explain this screen" content (owner 2026-10-31, the
 * Screen Guide rollout; pattern: wave/waveScreenGuides.ts and
 * patchbay/patchbayScreenGuides.ts).
 *
 * The lab is a PagedLab with no menu of its own: the learner lands on page 1
 * (the soft prerequisite gate) from the Mixing list, so page 1's guide also
 * explains the strip. One guide per page, keyed 'p1'…'p20' in page order
 * (pagesAdvA → pagesAdvD, as AdvancedMixingLabScreen spreads them). The
 * what's-left screen has its own guide, ADVANCED_MIXING_END_GUIDE (PagedLab
 * `endGuide`, titled WHERE YOU ARE). No appended check page.
 *
 * Every line was written against the page's own code (pagesAdvA–D, kit,
 * advFigures, advPlots, engine/advanced): names are the on-screen names (card
 * eyebrows, button labels, goal chips, labels drawn in the pictures), and
 * every number quoted is what the page draws for that setting (the comb
 * calculator's notches, the automation lanes, the step thresholds).
 * Reorder or retitle a page → update ADVANCED_MIXING_GUIDE_PAGE_TITLES and
 * its guide; test/screenGuide_mixing-adv_20261031.test.ts pins both.
 *
 * STEPPED: each section is one step held to SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; claims KNOWLEDGE, never
 * skills; mixing moves are suggested starting points, never rules; "suggest",
 * never "recommend"; no gear maker names; no "N of total"; no build notes in
 * learner text. The guide never gives away a check's or a diagnosis case's
 * answer.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';

/** Each page id's title, in page order — pinned against pagesAdvA–D. */
export const ADVANCED_MIXING_GUIDE_PAGE_TITLES: Record<string, string> = {
  p1: 'Before You Begin',
  p2: 'Advanced Mix Planning',
  p3: 'Complex Session Management',
  p4: 'Groups, Subgroups & VCAs',
  p5: 'Advanced Auxiliary Routing',
  p6: 'Parallel & Multibus Mixing',
  p7: 'Advanced EQ & Masking',
  p8: 'Advanced Dynamics',
  p9: 'Phase, Polarity & Alignment',
  p10: 'Advanced Depth & Space',
  p11: 'Harmonic Processing',
  p12: 'Stereo Imaging',
  p13: 'Advanced Automation',
  p14: 'Mix-Bus Processing',
  p15: 'Translation & Quality Control',
  p16: 'Stems & Alternate Mixes',
  p17: 'Stem Reconstruction',
  p18: 'Professional Delivery',
  p19: 'Mix Diagnosis',
  p20: 'The Final Repair',
};

export const ADVANCED_MIXING_SCREEN_GUIDES: Record<string, ScreenGuide> = {
  // ── 1 · Before You Begin ──────────────────────────────────────────────────
  p1: {
    seeing: [
      'The first page: the boundary between the two mixing labs, and the five dimensions this lab pursues at scale.',
      'If Beginning Mixing is complete on this device: PREREQUISITE MET.',
      'If not: TWO WAYS IN, with OPEN BEGINNING MIXING and three short checks.',
      'One goal chip at the foot: Beginning Mixing complete, or Prove the foundations (3 checks).',
    ],
    control: [
      'OPEN BEGINNING MIXING opens the Beginning lab.',
      'Answer the three checks: a post-fader send, a level-matched comparison, one compressor for a whole kit. A wrong pick explains itself; choose again.',
      'The strip under the title: ⏮ (first page), ‹ PREV, the readout (tap it for the list of every page, ✓ when done), NEXT ›. The ‹ at the top leaves the lab. “When to bring in a pro ›” opens a short note.',
    ],
    changes: [
      'A Beginning lab finished on this device meets the goal at once.',
      'Otherwise each check answered right counts; three unlock the goal.',
      'This is a soft gate: NEXT always moves on, and the page is simply listed on the what’s-left screen until its goal is met.',
    ],
    teaches: [
      'Beginning asked: can you make a clear, balanced stereo mix? Advanced asks: can you manage, refine, troubleshoot and deliver a complex one?',
      'The same five dimensions — balance, frequency, pan and width, depth, movement — at the scale of a big session.',
      'The lab runs from planning and routing, through processing and translation, to stems, delivery and a final repair.',
    ],
    tryThis: [
      'Not finished Beginning Mixing? Take the three checks: each explanation is a one-line refresher of a foundation this lab leans on.',
      'Unsure of the channel path or the six routing terms? Tap OPEN BEGINNING MIXING and revisit those pages first.',
    ],
  },

  // ── 2 · Advanced Mix Planning ─────────────────────────────────────────────
  p2: {
    seeing: [
      'THE PLAN, BEFORE THE FADERS: Priorities first, Reference analysis, Genre expectations, Processing strategy, Revision planning.',
      'COMMIT — YOUR THREE PRIORITIES: six choices, from Vocal-forward to Translates everywhere.',
      'A status line under the choices, a check about a dense mix, and goal chips.',
    ],
    control: [
      'Tap each planning move to open it.',
      'Tap a priority to choose it; tap again to remove it. Choices: Vocal-forward, Groove first, Wide & deep, Punchy & tight, Warm & unhurried, Translates everywhere.',
      'Answer the check below.',
    ],
    changes: [
      'Three is the limit: a fourth tap adds nothing until you remove one.',
      'With three chosen the line reads “✓ Three named. Every decision from here negotiates around these.”',
      'The final page reads your three back and asks whether the repair honored them.',
    ],
    teaches: [
      'Professional mixes start at a decision list, before the first fader.',
      'Three priorities is a plan; a longer list is a wish list.',
      'Shared paths and spaces are decided before the session sprawls.',
    ],
    tryThis: [
      'Choose three priorities, then tap a fourth: nothing is added until you remove one.',
      'Open Reference analysis, then think of a reference: where does its vocal sit, how wide is it, how much low end?',
    ],
  },

  // ── 3 · Complex Session Management ────────────────────────────────────────
  p3: {
    seeing: [
      'THE PRACTICES: Templates, Folders & visibility, Routing maps, Processing order, Resource management.',
      'THIS SESSION’S ROUTING MAP, drawn as the mixer itself: eight channel strips into RHYTHM BUS, MUSIC BUS and VOCAL BUS, an FX RTN fed by SENDS, all into the MIX BUS and out to a pair of monitors.',
      'A check about insert order, and goal chips.',
    ],
    control: [
      'Tap each practice to open it.',
      'The routing map is a drawing to read: every wire lands on its own input.',
      'Answer the check below.',
    ],
    changes: [
      'Each practice you open adds its line and moves you toward the first goal chip.',
      'The map is the session you repair on the final page.',
    ],
    teaches: [
      'A big session is organized, mapped and kept light enough to run before it is mixed.',
      'A routing map catches mistakes, such as a double route, that ears miss late at night.',
      'Insert order is a decision with an audible result.',
    ],
    tryThis: [
      'On the map, follow LEAD from its strip to VOCAL BUS, then to MIX BUS and the L and R outputs.',
      'Find KICK, SNARE, PERC and BASS: all four wire into RHYTHM BUS.',
    ],
  },

  // ── 4 · Groups, Subgroups & VCAs ──────────────────────────────────────────
  p4: {
    seeing: [
      'GLUE, HEARD: drums only, three ways — “KIT, NO COMP”, ONE BUS COMP and PER-TRACK COMP, level-matched.',
      'WHERE THE COMPRESSOR SITS — AND WHERE A PULL ACTS: KICK, SNARE and PERC strips wired into a DRUMS subgroup, and VCA 1 reaching the three channels by a dashed control line only.',
      'A readout line under the drawing, WHEN EACH TOOL WINS, a check, and goal chips.',
    ],
    control: [
      '▶ KIT, NO COMP, ▶ ONE BUS COMP and ▶ PER-TRACK COMP play each version; the drawing moves the COMP to match at once, even with sound off.',
      'NO PULL, PULL VCA −6 and PULL SUBGROUP −6 show where a 6 dB cut acts.',
      'Answer the check below.',
    ],
    changes: [
      'ONE BUS COMP lights COMP on the DRUMS strip; PER-TRACK COMP puts one on each drum.',
      'PULL VCA −6 drops each channel 6 dB (ghost caps on the strips); PULL SUBGROUP −6 drops the DRUMS fader instead.',
      'The readout line says where the 6 dB acts, and what it does to the sends and to the compressor you picked.',
    ],
    teaches: [
      'Shared processing needs a shared audio path: one compressor on a summed kit gives one envelope, unlike copies on each drum.',
      'A VCA and a subgroup fader both turn drums down, but in different places.',
      'Subgroups, VCAs and control groups each have their job; big mixes use all three.',
    ],
    tryThis: [
      'Pick ONE BUS COMP, then tap PULL VCA −6 and PULL SUBGROUP −6 in turn, and read what the line says about the compressor.',
      'Play ONE BUS COMP, then PER-TRACK COMP, and listen for the hat dipping with each kick in the bus version.',
    ],
  },

  // ── 5 · Advanced Auxiliary Routing ────────────────────────────────────────
  p5: {
    seeing: [
      'THE TOOLS: Multiple returns, Cue mixes, Sidechain feeds, Solo-safe returns, Feedback prevention.',
      'An aux drawing as strips: the lead’s AUX 1 (pre-fader) to a headphone cue, AUX 2 (post-fader) to a reverb return, and the kick’s KEY send to a compressor on the bass.',
      'A check about soloing a vocal, and goal chips.',
    ],
    control: [
      'Tap a tool to open it; the drawing lights its path. Every tool you have opened stays lit.',
      'Answer the check below.',
    ],
    changes: [
      'Before you open a tool, every path is lit. The first tool you open leaves only its own path bright; each tool after that adds its path. Feedback prevention draws the LOOP nobody should patch, crossed out in red.',
      'Feedback prevention notes that the reverb return outputs to the mix but has no send of its own — no loop exists unless someone patches one.',
    ],
    teaches: [
      'The aux system makes copies of anything, sent anywhere, at any level.',
      'A send can feed a detector instead of an effect: the kick telling a bass compressor when to duck.',
      'Advanced mixing means knowing which copies exist and where each one ends up.',
    ],
    tryThis: [
      'Open Cue mixes, then Sidechain feeds, and compare the two lit paths: one goes to a performer, one to a detector.',
      'Open Solo-safe returns and find the solo-safe button on the reverb return strip.',
    ],
  },

  // ── 6 · Parallel & Multibus Mixing ────────────────────────────────────────
  p6: {
    seeing: [
      'INSERT VS PARALLEL, HEARD: the kit three ways — KIT DRY, INSERT COMP and PARALLEL (NY), level-matched.',
      'A drawing of the crush in series or as a parallel path, and a measured line: AS HEARD (level-matched), PEAK, RMS and CREST.',
      'MULTIBUS THINKING, a check, and goal chips.',
    ],
    control: [
      '▶ KIT DRY, ▶ INSERT COMP and ▶ PARALLEL (NY) play each version; the drawing follows the button you press.',
      'Answer the check below.',
    ],
    changes: [
      'INSERT COMP crushes each drum (−30 dB threshold, 8:1, 1 ms attack, 90 ms release) and replaces the signal.',
      'PARALLEL (NY) runs the same crush blended −6 dB under the dry kit.',
      'Until the versions are rendered (your first ▶, or quietly once the sounds are ready) the line reads “Play a version to measure its peak, RMS and crest factor.” Then CREST (peak above RMS) shows how much punch is left.',
    ],
    teaches: [
      'Parallel processing keeps the untouched signal in charge, with a processed copy underneath.',
      'At the same loudness, crest factor is the punch: an insert crush flattens it, a parallel blend keeps the dry peaks on top.',
      'A parallel path adds energy, so bus headroom is checked again.',
    ],
    tryThis: [
      'Play INSERT COMP, then PARALLEL (NY), and compare the CREST figure on the line for each.',
      'Play KIT DRY first so the dry transients are fresh in your ear, then PARALLEL (NY).',
    ],
  },

  // ── 7 · Advanced EQ & Masking ─────────────────────────────────────────────
  p7: {
    seeing: [
      'COMPLEMENTARY EQ, HEARD: CROWDED and COMPLEMENTARY, level-matched.',
      'An EQ plot with LEAD’S PRESENCE shaded from 2 to 4 kHz.',
      'THE ADVANCED TOOLKIT: Complementary EQ, Dynamic EQ, Mid/side EQ, Low-frequency management.',
      'A check about a guitar masking a vocal, and goal chips.',
    ],
    control: [
      '▶ CROWDED and ▶ COMPLEMENTARY play each version; the plot follows the button you press.',
      'Tap each tool in THE ADVANCED TOOLKIT to open it.',
      'Answer the check below.',
    ],
    changes: [
      'CROWDED: one flat line, KEYS · GTR · LEAD — NO EQ, with keys and guitar 2 dB hot.',
      'COMPLEMENTARY: KEYS −5 dB and GTR −4 dB at 2.6 kHz, LEAD +2 dB in the same pocket.',
      'Matched in level, the lead comes forward without a fader move: the space around it changed.',
    ],
    teaches: [
      'Complementary EQ: cut the crowd where the star lives, lift the star gently in the same range.',
      'Dynamic EQ cuts only when the masker plays; mid/side EQ treats center and sides apart.',
      'Below about 120 Hz, decide which parts own the low end and check in mono — a suggested starting point, not a rule.',
    ],
    tryThis: [
      'Play CROWDED, then COMPLEMENTARY, and watch the three curves meet inside LEAD’S PRESENCE.',
      'Open Dynamic EQ, then read the check: is the collision there all the time, or only sometimes?',
    ],
  },

  // ── 8 · Advanced Dynamics ─────────────────────────────────────────────────
  p8: {
    seeing: [
      'SIDECHAIN, HEARD: kick and bass only, NO DUCK and KICK DUCKS BASS — deliberately not level-matched.',
      'THE KEY, DRAWN FROM THE REAL KICK: two bars of the kick track, and under it the gain the bass compressor applies.',
      'THE ADVANCED TOOLKIT: Serial compression, Multiband compression, Expansion & gating, Transient shaping, Advanced de-essing.',
      'A check about two gentle compressors, and goal chips.',
    ],
    control: [
      '▶ NO DUCK and ▶ KICK DUCKS BASS play each version; the gain drawing follows the button you press.',
      'Tap each tool in the toolkit to open it.',
      'Answer the check below.',
    ],
    changes: [
      'KICK DUCKS BASS: the bass compressor (−26 dB threshold, 8:1, 2 ms attack, 110 ms release) listens to the kick, not the bass.',
      'Each kick hit presses the bass down for a moment, then it comes back — the low end takes turns.',
      'The dip is the event you are listening for, which is why this pair is not matched.',
    ],
    teaches: [
      'Dynamics can be keyed from another signal: movement designed, not just controlled.',
      'Several gentle stages can do the work of one hard one, with less audible grabbing.',
      'Multiband, expansion, transient shaping and de-essing each target one part of the sound.',
    ],
    tryThis: [
      'Press ▶ KICK DUCKS BASS and watch the gain line dip under each kick hit in the drawing.',
      'Switch to ▶ NO DUCK: the gain line goes flat, and kick and bass overlap again.',
    ],
  },

  // ── 9 · Phase, Polarity & Alignment ───────────────────────────────────────
  p9: {
    seeing: [
      'THE COMB CALCULATOR: four delays, a comb plot, and a NOTCHES / PEAKS line.',
      'POLARITY IS NOT DELAY: what the Ø button does and does not fix.',
      'A check about snare top and bottom mics, and goal chips.',
    ],
    control: [
      'Tap 0.5 ms, 1 ms, 2 ms or 4 ms: the delay between two paths of the same sound.',
      'Answer the check below.',
    ],
    changes: [
      'The first notch sits at 1 ÷ (2 × delay); the next ones step up by 1 ÷ delay. Peaks sit at whole multiples of 1 ÷ delay.',
      'Short delays (1 ms or less) notch high; longer ones pull the first notch down into the body of the sound.',
      'Moving a mic about 34 cm moves the delay about 1 ms.',
    ],
    teaches: [
      'Two mics on one source arrive at different times; summed, a comb of cancellations runs through the tone.',
      'The arithmetic predicts exactly where the notches land.',
      'Polarity mirrors a waveform; it cannot un-delay a signal. A time offset needs alignment.',
    ],
    tryThis: [
      'Tap 1 ms: the line reads NOTCHES: 500 · 1.5k · 2.5k Hz — PEAKS: 1.0k · 2.0k · 3.0k Hz.',
      'Tap 4 ms: the first notch drops to 125 Hz (NOTCHES: 125 · 375 · 625 Hz) — into the body of most instruments.',
    ],
  },

  // ── 10 · Advanced Depth & Space ───────────────────────────────────────────
  p10: {
    seeing: [
      'THE SIZE OF THE ROOM, HEARD: TIGHT ROOM and BIG HALL — the same sends, two shared spaces, level-matched.',
      'THE TWO SPACES, MEASURED: the shared reverb’s own decay, and how long each takes to fall 60 dB (its RT60).',
      'THE SET-DESIGN TOOLKIT: Multiple spaces, Pre-delay as position, Filtered ambience, Tempo delays & throws.',
      'A check about a muddy vocal reverb, and goal chips.',
    ],
    control: [
      '▶ TIGHT ROOM and ▶ BIG HALL play each version; the decay plot follows the button you press.',
      'Tap each tool in the toolkit to open it.',
      'Answer the check below.',
    ],
    changes: [
      'Both versions send snare −10, guitar −14 and lead −12 dB; only the space changes.',
      'BIG HALL has the longer tail on the plot, and the same parts sound further back and apart.',
    ],
    teaches: [
      'Depth is set design: several spaces at different distances, shaped returns, tempo-locked delays.',
      'Pre-delay acts as a distance dial; filtering a return keeps the room out of the low end.',
      'The question is never which reverb is best, but how far away each part should live.',
    ],
    tryThis: [
      'Play TIGHT ROOM, then BIG HALL, and compare the two decay curves on the plot.',
      'Open Pre-delay as position and Filtered ambience, then answer the check with both in mind.',
    ],
  },

  // ── 11 · Harmonic Processing ──────────────────────────────────────────────
  p11: {
    seeing: [
      'THE DRIVE, HEARD: the full session through a soft saturator — CLEAN, GENTLE DRIVE and HARD DRIVE, level-matched.',
      'A drive plot that follows the version you pick.',
      'THE TOOLKIT: What saturation adds; Tape, console, tube; Clipping as a tool; Level-matched evaluation.',
      'A check about a plugin that sounds instantly “bigger”, and goal chips.',
    ],
    control: [
      '▶ CLEAN, ▶ GENTLE DRIVE and ▶ HARD DRIVE play each version; the plot follows the button you press.',
      'Tap each card in THE TOOLKIT to open it.',
      'Answer the check below.',
    ],
    changes: [
      'GENTLE DRIVE pushes the bus 6 dB into the saturator; HARD DRIVE pushes it 14 dB.',
      'Matched in level, what remains is the color: density first, then the cost of the hard version — duller transients, a fizzy top.',
    ],
    teaches: [
      'Saturation adds harmonics that were never played: weight and glue when gentle, distortion when blind.',
      'Saturation also adds loudness, so it is judged at matched level.',
      'Tape, console and tube are different curves of the same idea.',
    ],
    tryThis: [
      'Play GENTLE DRIVE, then HARD DRIVE, and listen to the kick and snare hits: which version keeps their front?',
      'Play CLEAN right after HARD DRIVE: at matched level, is the hard version still better, or just different?',
    ],
  },

  // ── 12 · Stereo Imaging ───────────────────────────────────────────────────
  p12: {
    seeing: [
      'WIDTH AND ITS INVOICE, HEARD: AS MIXED, WIDENED 1.6× and WIDENED → MONO, level-matched.',
      'WHERE EACH PART SITS — AND WHAT MONO COSTS IT: the session’s pans, with a right-hand column of what each part loses in a mono fold.',
      'THE STABLE-CENTER RULE, a check, and goal chips.',
    ],
    control: [
      '▶ AS MIXED, ▶ WIDENED 1.6× and ▶ WIDENED → MONO play each version; the drawing follows the button you press.',
      'Answer the check below.',
    ],
    changes: [
      'AS MIXED pans guitar left, keys right, percussion and backing pad off-center.',
      'WIDENED 1.6× scales the side channel up by 1.6; the center is untouched.',
      'WIDENED → MONO folds the widened mix: whatever lived in the side channel thins or vanishes.',
    ],
    teaches: [
      'Mid/side splits a stereo signal into center (mid) and difference (side).',
      'Width added by scaling the side is energy a mono fold cannot keep.',
      'A suggested starting point: kick, bass and lead at a solid center; every width move checked in mono.',
    ],
    tryThis: [
      'Play WIDENED 1.6×, then WIDENED → MONO, and read the right-hand column for the parts that lose the most.',
      'Compare GTR and KEYS in the drawing between AS MIXED and the widened view.',
    ],
  },

  // ── 13 · Advanced Automation ──────────────────────────────────────────────
  p13: {
    seeing: [
      'SECTION DESIGN, HEARD: STATIC and SECTION-DESIGNED, level-matched.',
      'Automation lanes for LEAD, BGV PAD, PERC, GTR and KEYS, split VERSE · BARS 1–2 and CHORUS · BARS 3–4 — each lane shows the fader level.',
      'THE MOVES: Detailed rides, Subgroup & VCA automation, Plugin automation, Snapshots & sections.',
      'A check about swelling a whole rhythm section, and goal chips.',
    ],
    control: [
      '▶ STATIC and ▶ SECTION-DESIGNED play each version; the lanes follow the button you press, even with sound off.',
      'Tap each move in THE MOVES to open it.',
      'Answer the check below.',
    ],
    changes: [
      'STATIC: every lane is flat at its fader level (LEAD −3 dB, KEYS −11 dB).',
      'SECTION-DESIGNED: LEAD −3 to 0 dB (▲ +3 dB), BGV PAD −∞ to −4 dB (▲ ENTERS), PERC ▲ +6 dB, GTR ▲ +2 dB.',
      'KEYS go the other way: −9 to −13 dB (▼ −4 dB). Contrast is built by giving as well as taking.',
    ],
    teaches: [
      'Advanced automation designs sections: several elements moving at once, some in opposite directions.',
      'A chorus can be a different place, not just a louder one.',
      'Riding one VCA or subgroup moves a whole family in one gesture.',
    ],
    tryThis: [
      'Tap ▶ SECTION-DESIGNED and find the one lane that drops: KEYS, ▼ −4 dB.',
      'Count the moves that happen at the chorus in SECTION-DESIGNED — the prompt asks you to.',
    ],
  },

  // ── 14 · Mix-Bus Processing ───────────────────────────────────────────────
  p14: {
    seeing: [
      'THE BUS CHAIN, THREE WAYS: NO BUS CHAIN, CONSERVATIVE CHAIN and OVERCOOKED, level-matched.',
      'A mix strip with COMP and DRIVE inserts, lit for the chain you pick.',
      'THE MASTERING BORDER, a check, and goal chips.',
    ],
    control: [
      '▶ NO BUS CHAIN, ▶ CONSERVATIVE CHAIN and ▶ OVERCOOKED play each version; the drawing follows the button you press.',
      'Answer the check below.',
    ],
    changes: [
      'CONSERVATIVE CHAIN: 2:1, 30 ms attack, 200 ms release, threshold −20 dB (about 2 dB of glue), plus 4 dB of gentle drive.',
      'OVERCOOKED: 6:1, 2 ms attack, 60 ms release, threshold −26 dB, plus 12 dB of drive.',
      'NO BUS CHAIN lights neither insert.',
    ],
    teaches: [
      'The mix bus touches everything, so its processing stays conservative.',
      'Bus processing should be missed when bypassed, not noticed when active.',
      'Chasing a loudness number on the mix bus is mastering started too early — leave headroom and finish the mix.',
    ],
    tryThis: [
      'Play CONSERVATIVE CHAIN, then NO BUS CHAIN: do you miss it? Then try OVERCOOKED and listen for the pumping.',
      'Watch COMP and DRIVE on the strip light up as you switch between the three.',
    ],
  },

  // ── 15 · Translation & Quality Control ────────────────────────────────────
  p15: {
    seeing: [
      'MEASURE — BS.1770-STYLE ESTIMATES: a master trim, MEASURE, and two delivery meters.',
      'After measuring: a LOUDNESS tile (LUFS at the trim) and a TRUE PEAK tile (dBTP, clear of −1 or above −1).',
      'THE TRANSLATION CHECKS with THE MIX and MONO, a check, and goal chips.',
    ],
    control: [
      'TRIM −6 dB, TRIM −3 dB or TRIM 0 dB sets the master trim.',
      'MEASURE renders the session and measures its integrated loudness and true peak (MEASURING… while it works).',
      '▶ THE MIX and ▶ MONO play the fold, matched. Answer the check below.',
    ],
    changes: [
      'Loudness follows the trim one for one: a trim 3 dB lower reads 3 LU lower, and true peak drops 3 dB too.',
      'TRUE PEAK turns green at −1 dBTP or lower and red above it.',
      'These are on-device estimates of the BS.1770 procedure — teaching numbers, not certified metering.',
    ],
    teaches: [
      'Translation asks whether a mix survives other systems, volumes and formats.',
      'LUFS and true peak are the delivery world’s shared ruler, not an artistic target.',
      'On normalized playback, a louder file is turned down: what survives is the mix, not the number.',
    ],
    tryThis: [
      'MEASURE at TRIM 0 dB, then at TRIM −3 dB: LOUDNESS drops by 3 and TRUE PEAK by 3 dB.',
      'Watch the TRUE PEAK tile: note which trim first reads clear of −1.',
    ],
  },

  // ── 16 · Stems & Alternate Mixes ──────────────────────────────────────────
  p16: {
    seeing: [
      'THE DELIVERABLES VOCABULARY: a five-stem delivery as it lands on the receiving engineer’s timeline.',
      'Five cards: Tracks vs multitracks vs stems, Alternate mixes, Standard stem sets, Identical starts & lengths, Names & versions.',
      'A check about a request for “the stems”, and goal chips.',
    ],
    control: [
      'Tap a card to open it; the timeline marks what that card is about.',
      'Answer the check below.',
    ],
    changes: [
      'Each card opened adds its explanation and points the timeline at its subject.',
      'Five opened cards complete the first goal chip.',
    ],
    teaches: [
      'Stems are rendered submixes that sum back to the mix; tracks and multitracks are the raw recordings.',
      'Alternate mixes are the same mix with planned subtractions: instrumental, a cappella, TV mix, clean, performance.',
      'Every stem starts at the same time and runs the same length, with a name that says what, which version, when.',
    ],
    tryThis: [
      'Open Identical starts & lengths and look at how the stems line up on the timeline.',
      'Open Standard stem sets: a common ask is drums, bass, music, vocals and FX — agreed before bouncing.',
    ],
  },

  // ── 17 · Stem Reconstruction ──────────────────────────────────────────────
  p17: {
    seeing: [
      'RUN IT — REAL MATH ON THE REAL SESSION: a null-test drawing and RUN THE NULL TEST.',
      'Two stems — rhythm (kick, snare, percussion, bass) and everything else — summed, then compared with the full mix.',
      'After the run: CLEAN BUS and BUS COMP ON FULL MIX, each with its residue in dB and a verdict.',
      'A check about stems that sum back louder, and goal chips.',
    ],
    control: [
      'RUN THE NULL TEST renders the full mix, the two stems, and the full mix with a bus compressor, one bar long; the button shows each stage while it works.',
      'Answer the check below.',
    ],
    changes: [
      'With a clean mix bus the stems rebuild the mix: the residue falls far below −60 dB and reads NULLS ✓.',
      'Add one nonlinear stage — a bus compressor (−18 dB, 4:1) on the full mix only — and the stems can no longer rebuild it: BROKEN ✗.',
      'The compressor reacted to the whole mix, something no separate stem ever heard.',
    ],
    teaches: [
      'The stem contract: summed together, the stems must rebuild the approved mix.',
      'A null test proves it: flip one side, sum, and measure what refuses to disappear.',
      'Stem specs must say what happens to mix-bus processing: printed onto each stem, sent separately, or documented.',
    ],
    tryThis: [
      'Run the test and compare the two residue numbers: the clean bus nulls, the compressed one leaves a residue.',
      'Read the BUS COMP ON FULL MIX residue: it is the compressor’s reaction to the whole mix, which no single stem ever met.',
    ],
  },

  // ── 18 · Professional Delivery ────────────────────────────────────────────
  p18: {
    seeing: [
      'THE PRACTICES: Version control, Metadata & documentation, Archive & recall.',
      'THE DELIVERY CHECKLIST — TICKED, NOT REMEMBERED: six lines, each ☐ until ticked.',
      'A check about recalling a mix a year later, and goal chips.',
    ],
    control: [
      'Tap each practice to open it.',
      'Tap each checklist line to tick it (☑), as if this were your delivery.',
      'Answer the check below.',
    ],
    changes: [
      'Each line you tick turns ☑ and stays ticked.',
      'All six ticked completes the second goal chip.',
    ],
    teaches: [
      'Delivery is a craft: version names, aligned files, documentation and an archive.',
      'A checklist is ticked, not remembered.',
      'The engineer whose files are named, aligned and documented right gets called again.',
    ],
    tryThis: [
      'Tick the six lines in order and say, for each, what would go wrong if it were skipped.',
      'Open Archive & recall, then answer the check.',
    ],
  },

  // ── 19 · Mix Diagnosis ────────────────────────────────────────────────────
  p19: {
    seeing: [
      'Three cases: CASE 1 — “IT’S MUDDY”, CASE 2 — “IT’S HARSH”, CASE 3 — “THE VOCAL IS BURIED”.',
      'Each card: the symptom, a flawed and a repaired version, a drawing, and a diagnosis check.',
      'The drawing hides its names and values until you answer that case’s check or play its repair.',
      'One goal chip: Solve all three cases.',
    ],
    control: [
      '▶ MUDDY FLAWED and ▶ MUDDY REPAIRED (and the same for HARSH and BURIED) play each version, level-matched.',
      'Each case’s drawing follows its own pick.',
      'Answer each case’s check: What is actually wrong?',
    ],
    changes: [
      'Muddy and harsh draw EQ curves; buried draws the console.',
      'Answering the check, or playing the repair, reveals the labels and values in the drawing.',
      'A wrong answer explains why it does not fit; choose again.',
    ],
    teaches: [
      'Diagnosis: hear a symptom, name the cause, choose the smallest repair.',
      'Three classic complaints, each with its flawed audio and its repair.',
    ],
    tryThis: [
      'Diagnose each case from the FLAWED version alone before you play the repair.',
      'After answering, compare the flawed and repaired drawings and match them to what you heard.',
    ],
  },

  // ── 20 · The Final Repair ─────────────────────────────────────────────────
  p20: {
    seeing: [
      'THE MIXER’S MANTRA, then STEP 1 — DIAGNOSE THE HANDOFF: THE HANDOFF and a diagnosis check.',
      'THE REPAIR CONSOLE: eight channels set to someone else’s flawed mix.',
      'LISTEN — HANDOFF VS YOUR REPAIR: THE HANDOFF, YOUR REPAIR and REPAIR, MONO.',
      'THE STEPS — VERIFIED AS YOU WORK: seven rows, and one goal chip.',
    ],
    control: [
      '▶ THE HANDOFF plays the flawed mix. Answer THE HANDOFF — YOUR DIAGNOSIS.',
      'The console: Ø, PAN, MUTE, fader and the solo tape on each channel. HIGH-PASS THE KEYS (220 Hz) toggles a filter on the keys.',
      'BACK TO THE FLAWED HANDOFF resets the console.',
      '▶ THE HANDOFF, ▶ YOUR REPAIR and ▶ REPAIR, MONO compare, level-matched. 7 · Deliver is a button you tap on your honor.',
    ],
    changes: [
      '1 · Diagnose ticks with the check. 2 · Rebuild the balance ticks with LEAD at −2 dB or higher, GTR at +1 dB or lower, and four channels changed.',
      '3 · Clear the mud ticks when the keys are high-passed. Steps 4 and 5 tick when YOUR REPAIR plays: tamer sends and gentle 2:1 glue.',
      '6 · Translation check ticks when REPAIR, MONO plays. All seven ✓ shows DELIVERED, with your page 2 priorities read back.',
    ],
    teaches: [
      'The whole job on a mix you did not start: diagnose, repair, glue, check in mono, deliver.',
      'Every repair here uses a tool this lab covered.',
      'The habit: at the end of every mix, ask whether it honored the priorities you set.',
    ],
    tryThis: [
      'Once 1 · Diagnose is ✓: raise LEAD to −2 dB, pull GTR to +1 dB, lower BGV a little and tap HIGH-PASS THE KEYS. Steps 2 and 3 tick (four channels changed).',
      'Play YOUR REPAIR, then REPAIR, MONO, and check that the lead still leads in the fold.',
    ],
  },
};

/** PagedLab's `pageGuide`: page index (0-based) → that page's guide. The
 *  what's-left screen never asks: it shows ADVANCED_MIXING_END_GUIDE. */
export function advancedMixingPageGuide(index: number): ScreenGuide | undefined {
  return ADVANCED_MIXING_SCREEN_GUIDES[`p${index + 1}`];
}

/* ── the what's-left screen (after FINISH on The Final Repair) ─────────────
 * Written against kit/PagedLab + kit/LabEndScreen + kit/labEnd as this lab
 * drives them: credit mode (pageCreditKeys), noun "page", no optional pages,
 * no check, every page manualDone (HANDS_ON_DETAIL on each row still left),
 * default DONE label, DONE = back one screen. */
export const ADVANCED_MIXING_END_GUIDE: ScreenGuide = {
  seeing: [
    'The title reads WHAT’S LEFT, or LAB COMPLETE once every page is done (YOUR PROGRESS if saved pages could not be read).',
    'Each page not done yet is listed by number and name, with a line saying it counts once the goals at the foot of the page are done.',
    'Finished pages fold into one ✓ CREDITED line (✓ DONE when you are not signed in). No CHECK row: the pages are the whole list.',
  ],
  control: [
    'Tap a listed page to jump straight to it.',
    'REVIEW ▾ on the ✓ line unfolds the finished pages; tap one to open it again. HIDE ▴ folds them away.',
    'PRACTICE AGAIN FROM THE START opens page 1, Before You Begin, and clears nothing.',
    'DONE · BACK TO LABS leaves the lab, back to the screen you opened it from.',
    'On the strip: ‹ PREV returns to the page you were on, ⏮ opens page 1, and the WHAT’S LEFT readout opens the list of every page (✓ when done).',
  ],
  changes: [
    'A page counts when every goal chip at its foot shows ✓ — it then marks itself. NEXT and FINISH move on without counting it.',
    'Before You Begin counts when you open it with Beginning Mixing complete on this device, or once its three checks are passed.',
    'Signed in, each page is credited to your account as it counts, and still reads ✓ CREDITED after START OVER (PRACTICE) at the foot of the strip’s page list.',
  ],
  teaches: [
    'Which parts of the advanced mixing workflow you have worked through — planning, routing, processing, checking, delivering, diagnosing — and which you have not met yet.',
    'Nothing is taken away: any page can be opened again for practice, and practicing never removes credit you have already earned.',
  ],
  tryThis: [
    'Jump to the first page still listed and scroll to its goal chips before you begin, so you know what makes it count.',
    'Tap REVIEW ▾ and reopen a finished page to practice it again; reviewing never removes its credit.',
  ],
};
