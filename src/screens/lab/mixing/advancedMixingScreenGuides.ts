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
    intro: {
      learning: 'How this lab builds on Beginning Mixing: the same five dimensions — balance, frequency, pan and width, depth, movement — handled across a big session you manage, repair and deliver.',
      start: 'If you see PREREQUISITE MET, tap NEXT ›. If you see TWO WAYS IN, answer the three checks, or tap OPEN BEGINNING MIXING to review first.',
    },
    seeing: [
      'This page marks where Beginning Mixing ends and this lab begins, and names the five dimensions you now handle across a big session.',
      'If you finished Beginning Mixing on this device, you see PREREQUISITE MET.',
      'If not, you see TWO WAYS IN: OPEN BEGINNING MIXING, or three short checks.',
      'The goal chip at the foot reads Beginning Mixing complete, or Prove the foundations (3 checks).',
    ],
    control: [
      'Tap OPEN BEGINNING MIXING to go back to the Beginning lab.',
      'Or answer the three checks: a post-fader send, a level-matched comparison, and one compressor for a whole kit. A wrong pick tells you why; choose again.',
      'On the strip under the title, ⏮ goes to the first page and ‹ PREV and NEXT › step through pages. Tap the readout in the middle for a list of every page, with ✓ on the ones you’ve done.',
      'The ‹ at the top leaves the lab. “When to bring in a pro ›” opens a short note.',
    ],
    changes: [
      'If Beginning Mixing is finished on this device, the goal is met right away.',
      'If not, each check you answer right counts. Three right answers meet the goal.',
      'NEXT always lets you move on. Until the goal is met, this page simply stays on the what’s-left list.',
    ],
    teaches: [
      'Beginning Mixing covered how a clear, balanced stereo mix is built. Here you see how a complex mix is managed, refined, fixed and delivered.',
      'The five dimensions stay the same — balance, frequency, pan and width, depth, movement — but a big session needs planning and routing to keep them in hand.',
      'A professional mix job runs in order: plan, route, process, check how it translates, then deliver.',
    ],
    tryThis: [
      'Haven’t finished Beginning Mixing? Take the three checks. Each explanation is a one-line refresher of a basic this lab leans on.',
      'Unsure about the channel path or the six routing terms? Tap OPEN BEGINNING MIXING and revisit those pages first.',
    ],
  },

  // ── 2 · Advanced Mix Planning ─────────────────────────────────────────────
  p2: {
    intro: {
      learning: 'Why a professional mix starts from a short list of priorities, decided before any fader moves, and why three priorities make a plan while a longer list doesn’t.',
      start: 'Open Priorities first in THE PLAN, BEFORE THE FADERS. Then tap three choices in COMMIT — YOUR THREE PRIORITIES and read the line under them.',
    },
    seeing: [
      'THE PLAN, BEFORE THE FADERS lists five planning moves: Priorities first, Reference analysis, Genre expectations, Processing strategy and Revision planning.',
      'COMMIT — YOUR THREE PRIORITIES gives you six choices, from Vocal-forward to Translates everywhere.',
      'A status line sits under the choices. Below it are a check about a dense mix and the goal chips.',
    ],
    control: [
      'Tap each planning move to open it.',
      'Tap a priority to choose it, and tap it again to remove it. Your choices: Vocal-forward, Groove first, Wide & deep, Punchy & tight, Warm & unhurried, Translates everywhere.',
      'Answer the check below.',
    ],
    changes: [
      'You can choose only three. A fourth tap adds nothing until you remove one.',
      'With three chosen, the line reads “✓ Three named. Every decision from here negotiates around these.”',
      'Your three are kept. The final page reads them back and asks whether your repair honored them.',
    ],
    teaches: [
      'Professional mixes start from a decision list, before the first fader moves.',
      'Three priorities make a plan you can act on. A longer list is a wish list, because priorities compete for the same space in the mix.',
      'Shared buses and reverbs are planned before the session sprawls, so every later move has a reason.',
    ],
    tryThis: [
      'Choose three priorities, then tap a fourth. Nothing is added until you remove one: that limit is the point.',
      'Open Reference analysis, then think of a song you know well. Where does its vocal sit, how wide is it, and how much low end does it have?',
    ],
  },

  // ── 3 · Complex Session Management ────────────────────────────────────────
  p3: {
    intro: {
      learning: 'How a big session is organized and mapped before mixing: buses that group related parts, an effects return fed by sends, and why insert order changes the sound.',
      start: 'Open each card in THE PRACTICES. Then trace LEAD on THIS SESSION’S ROUTING MAP, from its strip to VOCAL BUS and on to MIX BUS.',
    },
    seeing: [
      'THE PRACTICES lists five habits: Templates, Folders & visibility, Routing maps, Processing order and Resource management.',
      'THIS SESSION’S ROUTING MAP is drawn as a mixer. Eight channel strips feed RHYTHM BUS, MUSIC BUS and VOCAL BUS. SENDS feed an FX RTN (effects return). All of it reaches the MIX BUS and a pair of monitors.',
      'Below are a check about insert order and the goal chips.',
    ],
    control: [
      'Tap each practice to open it.',
      'Read the routing map like a wiring diagram: follow each wire, and see that it lands on its own input.',
      'Answer the check below.',
    ],
    changes: [
      'Each practice you open adds its explanation and moves you toward the first goal chip.',
      'This map is the same session you repair on the final page, so learning its routing now pays off later.',
    ],
    teaches: [
      'A big session is organized, mapped and kept light enough to run before anyone mixes it.',
      'A routing map catches mistakes that tired ears miss late at night, such as a double route: one track reaching the mix bus by two paths.',
      'Insert order is a decision you can hear: the same processors in a different order give a different result.',
    ],
    tryThis: [
      'On the map, follow LEAD from its strip to VOCAL BUS, then to MIX BUS and the L and R outputs.',
      'Find KICK, SNARE, PERC and BASS. All four wire into RHYTHM BUS, so one bus fader moves the whole rhythm section.',
    ],
  },

  // ── 4 · Groups, Subgroups & VCAs ──────────────────────────────────────────
  p4: {
    intro: {
      learning: 'How a subgroup fader and a VCA both turn drums down but act at different points, and why one compressor on the whole kit glues differently from one per drum.',
      start: 'Play ▶ KIT, NO COMP, then ▶ ONE BUS COMP and ▶ PER-TRACK COMP. Then tap PULL VCA −6 and PULL SUBGROUP −6 and read the line under the drawing.',
    },
    seeing: [
      'GLUE, HEARD plays the drums only, three ways, matched in level: “KIT, NO COMP”, ONE BUS COMP and PER-TRACK COMP.',
      'WHERE THE COMPRESSOR SITS — AND WHERE A PULL ACTS shows KICK, SNARE and PERC wired into a DRUMS subgroup. VCA 1 reaches the same three by a dashed control line only: no audio passes through it.',
      'Below: a readout line, WHEN EACH TOOL WINS, a check and the goal chips.',
    ],
    control: [
      'Tap ▶ KIT, NO COMP, ▶ ONE BUS COMP or ▶ PER-TRACK COMP to hear each version. The drawing moves the COMP to match right away, even with sound off.',
      'Tap NO PULL, PULL VCA −6 or PULL SUBGROUP −6 to see where a 6 dB cut acts.',
      'Answer the check below.',
    ],
    changes: [
      'ONE BUS COMP lights COMP on the DRUMS strip. PER-TRACK COMP puts a separate one on each drum.',
      'PULL VCA −6 drops each channel 6 dB, and ghost caps show where each fader moved to. PULL SUBGROUP −6 drops the DRUMS fader instead.',
      'The readout line tells you where the 6 dB acts, and what that does to the sends and to the compressor you picked.',
    ],
    teaches: [
      'Shared processing needs a shared audio path. One compressor on the summed kit reacts to every drum at once, so they move together; one per drum reacts to each alone.',
      'A VCA and a subgroup fader both turn the drums down, but at different points in the signal path.',
      'Subgroups, VCAs and control groups each have their own job; big mixes use all three.',
    ],
    tryThis: [
      'Pick ONE BUS COMP, then tap PULL VCA −6 and PULL SUBGROUP −6 in turn. Each time, read what the line says about the compressor.',
      'Play ONE BUS COMP, then PER-TRACK COMP. In the bus version, listen for the hi-hat on PERC dipping a little with each kick.',
    ],
  },

  // ── 5 · Advanced Auxiliary Routing ────────────────────────────────────────
  p5: {
    intro: {
      learning: 'How aux sends copy one signal to many places: a pre-fader headphone cue, a post-fader reverb, and a key that tells another channel’s compressor when to act.',
      start: 'Tap Cue mixes in THE TOOLS and follow the lit path from the lead’s AUX 1. Then tap Sidechain feeds and compare the two paths.',
    },
    seeing: [
      'THE TOOLS lists five uses of the aux system: Multiple returns, Cue mixes, Sidechain feeds, Solo-safe returns and Feedback prevention.',
      'The drawing shows strips: the lead’s AUX 1 (pre-fader) feeds a headphone cue, AUX 2 (post-fader) feeds a reverb return, and the kick’s KEY send feeds a compressor on the bass.',
      'Below are a check about soloing a vocal and the goal chips.',
    ],
    control: [
      'Tap a tool to open it. The drawing lights that tool’s path, and every tool you’ve opened stays lit.',
      'Answer the check below.',
    ],
    changes: [
      'Before you open a tool, every path is lit. The first tool you open leaves only its own path bright; each one after adds its own.',
      'Feedback prevention draws the LOOP nobody should patch, crossed out in red. The reverb return feeds the mix but has no send of its own, so no loop exists unless someone patches one.',
    ],
    teaches: [
      'Aux sends make copies of any signal, sent anywhere, at any level.',
      'A pre-fader copy ignores the channel fader, which suits a performer’s cue. A post-fader copy follows it, so the reverb stays in step with its source.',
      'A send can feed a detector instead of an effect: the kick tells the bass compressor when to duck.',
      'Advanced routing means knowing which copies exist and where each ends up.',
    ],
    tryThis: [
      'Open Cue mixes, then Sidechain feeds, and compare the two lit paths: one goes to a performer’s ears, the other to a detector.',
      'Open Solo-safe returns and find the solo-safe button on the reverb return strip.',
    ],
  },

  // ── 6 · Parallel & Multibus Mixing ────────────────────────────────────────
  p6: {
    intro: {
      learning: 'How parallel compression differs from an insert: the dry kit keeps its peaks on top while a crushed copy adds weight underneath, which the crest factor shows.',
      start: 'Play ▶ KIT DRY, then ▶ INSERT COMP, then ▶ PARALLEL (NY). After each, read PEAK, RMS and CREST on the measured line.',
    },
    seeing: [
      'INSERT VS PARALLEL, HEARD plays the kit three ways, matched in level: KIT DRY, INSERT COMP and PARALLEL (NY).',
      'A drawing shows the crushing compressor either in series or on a parallel path. A measured line shows AS HEARD (level-matched), PEAK, RMS and CREST.',
      'Below are MULTIBUS THINKING, a check and the goal chips.',
    ],
    control: [
      'Tap ▶ KIT DRY, ▶ INSERT COMP or ▶ PARALLEL (NY) to hear each version. The drawing switches to match the one you pick.',
      'Answer the check below.',
    ],
    changes: [
      'INSERT COMP crushes each drum (−30 dB threshold, 8:1, 1 ms attack, 90 ms release) and replaces the original signal.',
      'PARALLEL (NY) blends the same crush −6 dB under the untouched kit.',
      'Until the versions are measured (your first ▶, or on their own once ready), the line reads “Play a version to measure its peak, RMS and crest factor.” Then CREST (peak above RMS) shows how much punch is left.',
    ],
    teaches: [
      'Parallel processing keeps the untouched signal in charge, with a processed copy underneath.',
      'At the same loudness, crest factor (peak minus RMS, in dB) is a guide to punch: an insert crush shrinks it, while a parallel blend keeps the dry peaks on top.',
      'A parallel path adds energy to the bus, so check bus headroom again after adding one.',
    ],
    tryThis: [
      'Play INSERT COMP, then PARALLEL (NY), and compare the CREST figure for each. Which one keeps more distance between peak and RMS?',
      'Play KIT DRY first so the dry hits are fresh in your ear, then PARALLEL (NY). Listen for the same attack with more body behind it.',
    ],
  },

  // ── 7 · Advanced EQ & Masking ─────────────────────────────────────────────
  p7: {
    intro: {
      learning: 'How masking happens when parts share the same frequencies, and how complementary EQ clears a pocket for the lead vocal without touching its fader.',
      start: 'Play ▶ CROWDED, then ▶ COMPLEMENTARY, and watch the curves inside LEAD’S PRESENCE. Then open each tool in THE ADVANCED TOOLKIT.',
    },
    seeing: [
      'COMPLEMENTARY EQ, HEARD plays two versions, matched in level: CROWDED and COMPLEMENTARY.',
      'The EQ plot shades LEAD’S PRESENCE from 2 to 4 kHz, where the lead vocal’s clarity lives.',
      'THE ADVANCED TOOLKIT lists Complementary EQ, Dynamic EQ, Mid/side EQ and Low-frequency management.',
      'Below are a check about a guitar masking a vocal and the goal chips.',
    ],
    control: [
      'Tap ▶ CROWDED or ▶ COMPLEMENTARY to hear each version. The plot switches to match.',
      'Tap each tool in THE ADVANCED TOOLKIT to open it.',
      'Answer the check below.',
    ],
    changes: [
      'CROWDED shows one flat line, KEYS · GTR · LEAD — NO EQ, with keys and guitar 2 dB hot.',
      'COMPLEMENTARY cuts KEYS −5 dB and GTR −4 dB at 2.6 kHz, and lifts LEAD +2 dB in the same pocket.',
      'At matched level, the lead comes forward without a fader move, because the space around it changed.',
    ],
    teaches: [
      'Masking: when two parts share a frequency range, the louder one hides the other there.',
      'Complementary EQ cuts the crowd where the star lives and lifts the star gently in the same range.',
      'Dynamic EQ cuts only when the masker plays; mid/side EQ treats center and sides apart.',
      'Below about 120 Hz, a suggested starting point: decide which parts own the low end, and check in mono.',
    ],
    tryThis: [
      'Play CROWDED, then COMPLEMENTARY, and watch the three curves meet inside LEAD’S PRESENCE.',
      'Read the check, then ask: is the collision there all the time, or only sometimes? Each tool in THE ADVANCED TOOLKIT answers a different case.',
    ],
  },

  // ── 8 · Advanced Dynamics ─────────────────────────────────────────────────
  p8: {
    intro: {
      learning: 'How a compressor can be triggered by a different signal: the kick ducks the bass for a moment on each hit, so the two take turns in the low end.',
      start: 'Play ▶ NO DUCK, then ▶ KICK DUCKS BASS, and watch the gain line under the kick dip on each hit. Then open each tool in THE ADVANCED TOOLKIT.',
    },
    seeing: [
      'SIDECHAIN, HEARD plays kick and bass only: NO DUCK and KICK DUCKS BASS, deliberately not level-matched.',
      'THE KEY, DRAWN FROM THE REAL KICK shows two bars of the kick track, with the bass compressor’s gain under it.',
      'THE ADVANCED TOOLKIT lists Serial compression, Multiband compression, Expansion & gating, Transient shaping and Advanced de-essing.',
      'Below: a check about two gentle compressors, and goal chips.',
    ],
    control: [
      'Tap ▶ NO DUCK or ▶ KICK DUCKS BASS to hear each version. The gain drawing switches to match.',
      'Tap each tool in the toolkit to open it.',
      'Answer the check below.',
    ],
    changes: [
      'In KICK DUCKS BASS, the bass compressor (−26 dB threshold, 8:1, 2 ms attack, 110 ms release) listens to the kick, not the bass.',
      'Each kick hit presses the bass down for a moment, then it comes back: the low end takes turns.',
      'The dip is what you’re listening for, which is why this pair isn’t matched.',
    ],
    teaches: [
      'Dynamics can be keyed (triggered) from another signal: movement designed, not just controlled.',
      'Compression can be split across more than one stage; Serial compression explains how that changes what you hear.',
      'Multiband, expansion, transient shaping and de-essing each target one part of the sound: a band, the quiet parts, the attack, the S sounds.',
    ],
    tryThis: [
      'Press ▶ KICK DUCKS BASS and watch the gain line dip under each kick hit in the drawing. Can you hear the bass make room for the kick?',
      'Switch to ▶ NO DUCK. The gain line goes flat, and kick and bass overlap again.',
    ],
  },

  // ── 9 · Phase, Polarity & Alignment ───────────────────────────────────────
  p9: {
    intro: {
      learning: 'Why two mics on one source cause comb filtering: a small time gap cancels a predictable series of frequencies, and flipping polarity can’t fix a delay.',
      start: 'Tap 1 ms and read the NOTCHES / PEAKS line. Then tap 4 ms and watch the first notch drop down into the body of the sound.',
    },
    seeing: [
      'THE COMB CALCULATOR gives you four delay buttons, a comb plot and a NOTCHES / PEAKS line.',
      'On the plot, the dips are notches, where the two paths cancel, and the bumps are peaks, where they add.',
      'POLARITY IS NOT DELAY explains what the Ø button does and does not fix.',
      'Below are a check about snare top and bottom mics and the goal chips.',
    ],
    control: [
      'Tap 0.5 ms, 1 ms, 2 ms or 4 ms to set the delay between two paths of the same sound, like two mics at different distances.',
      'Answer the check below.',
    ],
    changes: [
      'The first notch sits at 1 ÷ (2 × delay); the next ones step up by 1 ÷ delay. Peaks sit at whole multiples of 1 ÷ delay.',
      'Shorter delays put the first notch higher (0.5 ms: 1 kHz). Longer ones pull it down into the body of the sound (4 ms: 125 Hz).',
      'Moving a mic about 34 cm moves the delay about 1 ms.',
    ],
    teaches: [
      'Two mics on one source pick it up at different times. Summed, a comb of cancellations runs through the tone.',
      'The arithmetic predicts exactly where the notches land.',
      'Polarity flips a waveform upside down; it can’t undo a delay. A time offset needs alignment: move the mic, or delay one track.',
    ],
    tryThis: [
      'Tap 1 ms: the line reads NOTCHES: 500 · 1.5k · 2.5k Hz — PEAKS: 1.0k · 2.0k · 3.0k Hz. Check the first notch: 1 ÷ (2 × 0.001 s) = 500 Hz.',
      'Tap 4 ms: the first notch drops to 125 Hz (NOTCHES: 125 · 375 · 625 Hz), into the body of most instruments.',
    ],
  },

  // ── 10 · Advanced Depth & Space ───────────────────────────────────────────
  p10: {
    intro: {
      learning: 'How depth is built with shared reverbs: a longer decay pushes parts back, pre-delay and filtering shape distance, and each part gets its own place front to back.',
      start: 'Play ▶ TIGHT ROOM, then ▶ BIG HALL, and compare the two decay curves. Then open Pre-delay as position and Filtered ambience in THE SET-DESIGN TOOLKIT.',
    },
    seeing: [
      'THE SIZE OF THE ROOM, HEARD sends the same parts into two shared spaces, matched in level: TIGHT ROOM and BIG HALL.',
      'THE TWO SPACES, MEASURED plots each reverb’s decay and its RT60: how long it takes to fall 60 dB.',
      'THE SET-DESIGN TOOLKIT lists Multiple spaces, Pre-delay as position, Filtered ambience, and Tempo delays & throws.',
      'Below: a check about a muddy vocal reverb, and goal chips.',
    ],
    control: [
      'Tap ▶ TIGHT ROOM or ▶ BIG HALL to hear each version. The decay plot switches to match.',
      'Tap each tool in the toolkit to open it.',
      'Answer the check below.',
    ],
    changes: [
      'Both versions send snare at −10 dB, guitar at −14 dB and lead at −12 dB. Only the space changes.',
      'BIG HALL shows the longer tail on the plot, and the same parts sound farther back and farther apart.',
    ],
    teaches: [
      'Depth is set design: several spaces at different distances, shaped returns, tempo-locked delays.',
      'Pre-delay is a distance cue: a longer gap before the reverb keeps a part up front. A return can be shaped with EQ too, which changes what the space adds.',
      'The question is never which reverb is best, but how far away each part should live.',
    ],
    tryThis: [
      'Play TIGHT ROOM, then BIG HALL, and compare the two decay curves. Listen to the lead: does it move back as the tail grows?',
      'Open Pre-delay as position and Filtered ambience, then answer the check with both in mind.',
    ],
  },

  // ── 11 · Harmonic Processing ──────────────────────────────────────────────
  p11: {
    intro: {
      learning: 'What saturation adds to a mix, how gentle and hard drive differ, and how to compare drive settings fairly.',
      start: 'Play ▶ CLEAN, then ▶ GENTLE DRIVE, then ▶ HARD DRIVE, and watch the drive plot change with each. Then open What saturation adds in THE TOOLKIT.',
    },
    seeing: [
      'THE DRIVE, HEARD runs the full session through a soft saturator (it rounds peaks off gently): CLEAN, GENTLE DRIVE and HARD DRIVE, matched in level so loudness can’t fool you.',
      'The drive plot shows how hard your pick pushes into the saturator.',
      'THE TOOLKIT: What saturation adds; Tape, console, tube; Clipping as a tool; Level-matched evaluation. Then a check on a plugin that sounds instantly “bigger”.',
    ],
    control: [
      'Tap ▶ CLEAN, ▶ GENTLE DRIVE or ▶ HARD DRIVE to hear each version. The plot switches to the one you pressed.',
      'Tap each card in THE TOOLKIT to open it and read how saturation is used.',
      'Answer the check below.',
    ],
    changes: [
      'GENTLE DRIVE pushes the bus 6 dB into the saturator. HARD DRIVE pushes it 14 dB.',
      'The harder the push, the more the peaks are rounded off and the more new harmonics appear.',
      'Matched in level, only the color is left: gentle drive sounds denser; hard drive costs you duller transients (the sharp start of each hit) and a fizzy top end.',
    ],
    teaches: [
      'Saturation adds harmonics that were never played. Gently, it adds weight and glue; pushed too hard, it becomes audible distortion.',
      'Saturation also adds loudness, so it is judged at matched level.',
      'Tape, console and tube are different curves of the same idea: rounding the peaks and adding harmonics.',
    ],
    tryThis: [
      'Play GENTLE DRIVE, then HARD DRIVE, and listen to the kick and snare hits. Which version keeps their front edge?',
      'Play CLEAN right after HARD DRIVE. At matched level, is the hard version still better, or just different?',
    ],
  },

  // ── 12 · Stereo Imaging ───────────────────────────────────────────────────
  p12: {
    intro: {
      learning: 'How mid/side splits a mix into center and difference, and why width added to the side can thin out or vanish when the mix folds to mono.',
      start: 'Play ▶ AS MIXED, then ▶ WIDENED 1.6×. Then play ▶ WIDENED → MONO and read the right-hand column to see which parts lose the most.',
    },
    seeing: [
      'WIDTH AND ITS INVOICE, HEARD plays the session three ways, matched in level: AS MIXED, WIDENED 1.6× and WIDENED → MONO (the widened mix folded to one channel).',
      'WHERE EACH PART SITS — AND WHAT MONO COSTS IT shows each part’s pan, with a right-hand column of what it loses in a mono fold.',
      'Below it, read THE STABLE-CENTER RULE before you answer the check.',
    ],
    control: [
      'Tap ▶ AS MIXED, ▶ WIDENED 1.6× or ▶ WIDENED → MONO to hear each version. The drawing switches to the one you pressed.',
      'Read THE STABLE-CENTER RULE, then answer the check below it.',
    ],
    changes: [
      'AS MIXED pans the guitar left and the keys right, with percussion and the backing pad off-center.',
      'WIDENED 1.6× turns the side channel (the left–right difference) up by 1.6×. The center is untouched.',
      'WIDENED → MONO folds the widened mix to one channel. Whatever lived in the side channel thins out or vanishes.',
    ],
    teaches: [
      'Mid/side splits a stereo signal into the center (mid: what left and right share) and the difference (side: what they don’t).',
      'Width added by turning up the side is energy a mono fold can’t keep.',
      'A suggested starting point, not a rule: kick, bass and lead at a solid center, and every width move checked in mono.',
    ],
    tryThis: [
      'Play WIDENED 1.6×, then WIDENED → MONO. Read the right-hand column: which parts lose the most?',
      'Compare GTR and KEYS in the drawing between AS MIXED and WIDENED 1.6×, then listen for them in the mono version.',
    ],
  },

  // ── 13 · Advanced Automation ──────────────────────────────────────────────
  p13: {
    intro: {
      learning: 'Automation can design a whole section: several parts move at once, some up and some down, so a chorus feels like a different place, not just a louder one.',
      start: 'Tap ▶ STATIC, then ▶ SECTION-DESIGNED, and watch the lanes change where VERSE · BARS 1–2 meets CHORUS · BARS 3–4. Find the one lane that goes down.',
    },
    seeing: [
      'SECTION DESIGN, HEARD plays one passage two ways, matched in level: STATIC (no fader moves) and SECTION-DESIGNED.',
      'The lanes show the fader level of LEAD, BGV PAD (background vocal pad), PERC, GTR and KEYS, split into VERSE · BARS 1–2 and CHORUS · BARS 3–4.',
      'THE MOVES: Detailed rides, Subgroup & VCA automation, Plugin automation, Snapshots & sections.',
    ],
    control: [
      'Tap ▶ STATIC or ▶ SECTION-DESIGNED to hear each version. The lanes redraw for the one you pressed, even with the sound off.',
      'Tap each move in THE MOVES to open it.',
      'Answer the check about swelling a whole rhythm section at once.',
    ],
    changes: [
      'In STATIC, every lane stays flat at its fader level: LEAD at −3 dB, KEYS at −11 dB.',
      'In SECTION-DESIGNED, LEAD goes −3 to 0 dB (▲ +3 dB), BGV PAD −∞ to −4 dB (▲ ENTERS), PERC ▲ +6 dB, GTR ▲ +2 dB.',
      'KEYS go the other way: −9 to −13 dB (▼ −4 dB). Contrast is built by giving as well as taking.',
    ],
    teaches: [
      'Advanced automation designs whole sections: several parts move at once, some in opposite directions.',
      'A chorus can be a different place, not just a louder one, because the balance itself changes.',
      'Automation can act on one channel, a whole group, a plugin or a whole section; each scale suits a different job.',
    ],
    tryThis: [
      'Tap ▶ SECTION-DESIGNED and find the one lane that drops at the chorus: KEYS, ▼ −4 dB. Listen for the room it leaves.',
      'Count the lanes that move at the chorus in SECTION-DESIGNED. Then play STATIC: does its chorus still sound like a new section?',
    ],
  },

  // ── 14 · Mix-Bus Processing ───────────────────────────────────────────────
  p14: {
    intro: {
      learning: 'Why processing on the mix bus usually stays gentle: it touches everything at once, and pushing it for loudness starts mastering before the mix is finished.',
      start: 'Play ▶ CONSERVATIVE CHAIN, then ▶ NO BUS CHAIN, and ask yourself whether you miss it. Then play ▶ OVERCOOKED and listen for pumping.',
    },
    seeing: [
      'THE BUS CHAIN, THREE WAYS plays the mix with NO BUS CHAIN, CONSERVATIVE CHAIN and OVERCOOKED, matched in level, so you judge tone and movement, not loudness.',
      'The mix strip shows two inserts, COMP and DRIVE, lit for the chain you pick.',
      'THE MASTERING BORDER explains where mix-bus work ends and mastering begins.',
    ],
    control: [
      'Tap ▶ NO BUS CHAIN, ▶ CONSERVATIVE CHAIN or ▶ OVERCOOKED to hear each version. The strip lights the inserts for the one you pressed.',
      'Read THE MASTERING BORDER, then answer the check below it.',
    ],
    changes: [
      'CONSERVATIVE CHAIN: 2:1, 30 ms attack, 200 ms release, threshold −20 dB (about 2 dB of glue: a gentle squeeze that holds the parts together), plus 4 dB of gentle drive.',
      'OVERCOOKED: 6:1, 2 ms attack, 60 ms release, threshold −26 dB, plus 12 dB of drive. Fast, hard settings like these make a mix pump.',
      'NO BUS CHAIN lights neither insert.',
    ],
    teaches: [
      'The mix bus carries every part at once, so anything you put there changes everything. That’s why its processing usually stays conservative.',
      'A useful test: bus processing should be missed when you bypass it, not noticed while it’s on.',
      'Chasing a loudness number on the mix bus is mastering started too early. Leave headroom and finish the mix.',
    ],
    tryThis: [
      'Play CONSERVATIVE CHAIN, then NO BUS CHAIN: do you miss it? Then try OVERCOOKED and listen for the pumping.',
      'Switch between the three and watch COMP and DRIVE light up on the strip. Match each sound to what is lit.',
    ],
  },

  // ── 15 · Translation & Quality Control ────────────────────────────────────
  p15: {
    intro: {
      learning: 'Translation means a mix survives other systems, volumes and formats. LUFS and true peak are delivery’s shared ruler, and normalized playback turns louder files down.',
      start: 'Tap TRIM 0 dB, then MEASURE. Tap TRIM −3 dB and MEASURE again, and compare the LOUDNESS and TRUE PEAK tiles. Then play ▶ THE MIX and ▶ MONO.',
    },
    seeing: [
      'MEASURE — BS.1770-STYLE ESTIMATES gives you a master trim, a MEASURE button and two delivery meters.',
      'After you measure, the LOUDNESS tile shows LUFS (loudness units relative to full scale) at that trim. The TRUE PEAK tile shows dBTP (peak level, counting peaks between samples): clear of −1 or above −1.',
      'THE TRANSLATION CHECKS let you hear THE MIX against MONO.',
    ],
    control: [
      'Tap TRIM −6 dB, TRIM −3 dB or TRIM 0 dB to set the master trim: the level of the whole mix before it’s measured.',
      'Tap MEASURE to measure integrated loudness (the average across the whole passage) and true peak. It reads MEASURING… while it works.',
      'Tap ▶ THE MIX and ▶ MONO to hear the mix and its mono fold (left and right summed to one channel), matched in level.',
      'Answer the check below.',
    ],
    changes: [
      'Loudness follows the trim one for one: a trim 3 dB lower reads 3 LU lower (1 LU = 1 dB), and true peak drops 3 dB too.',
      'TRUE PEAK turns green at −1 dBTP or lower, and red above it.',
      'These readings are estimates measured on your device, following the BS.1770 method. Treat them as teaching numbers, not a certified meter reading.',
    ],
    teaches: [
      'Translation asks whether a mix survives other systems, volumes and formats.',
      'LUFS and true peak are the delivery world’s shared ruler, not an artistic target.',
      'On normalized playback, a louder file is turned down to match the rest. What survives is the mix, not the number.',
    ],
    tryThis: [
      'MEASURE at TRIM 0 dB, then at TRIM −3 dB. LOUDNESS drops by 3 LU and TRUE PEAK by 3 dB.',
      'Watch the TRUE PEAK tile as you change the trim. Note which trim first reads clear of −1.',
    ],
  },

  // ── 16 · Stems & Alternate Mixes ──────────────────────────────────────────
  p16: {
    intro: {
      learning: 'What stems, tracks and alternate mixes are, and why every stem must start at the same time, run the same length and carry a clear name.',
      start: 'Tap Tracks vs multitracks vs stems and watch the timeline mark what it means. Then open Identical starts & lengths and see how the stems line up.',
    },
    seeing: [
      'THE DELIVERABLES VOCABULARY shows a five-stem delivery the way it lands on the receiving engineer’s timeline.',
      'Five cards explain it: Tracks vs multitracks vs stems, Alternate mixes, Standard stem sets, Identical starts & lengths, and Names & versions.',
      'Below them is a check about a request for “the stems”.',
    ],
    control: [
      'Tap a card to open it. The timeline marks the part of the delivery that card is about.',
      'Answer the check about a request for “the stems”.',
    ],
    changes: [
      'Each card you open adds its explanation and points the timeline at its subject, so you see each idea on a real delivery.',
      'Opening all five cards meets the first goal chip.',
    ],
    teaches: [
      'Stems are rendered submixes (groups of parts bounced to audio) that sum back to the mix. Tracks and multitracks are the raw recordings.',
      'Alternate mixes are the same mix with planned subtractions: instrumental, a cappella, TV mix, clean, performance.',
      'Every stem starts at the same time and runs the same length, with a name that says what, which version, when.',
    ],
    tryThis: [
      'Open Identical starts & lengths and look at how the stems line up on the timeline. What would happen if one started late?',
      'Open Standard stem sets: a common ask is drums, bass, music, vocals and FX, agreed on before you bounce.',
    ],
  },

  // ── 17 · Stem Reconstruction ──────────────────────────────────────────────
  p17: {
    intro: {
      learning: 'The stem contract: summed together, stems must rebuild the approved mix. A null test proves it, and a compressor on the full mix alone breaks it.',
      start: 'Tap RUN THE NULL TEST and wait for it to finish. Then compare the residue under CLEAN BUS with the residue under BUS COMP ON FULL MIX.',
    },
    seeing: [
      'RUN IT — REAL MATH ON THE REAL SESSION: a null-test drawing and the RUN THE NULL TEST button.',
      'Two stems, rhythm (kick, snare, percussion, bass) and everything else, are summed, then compared with the full mix.',
      'After the run, CLEAN BUS and BUS COMP ON FULL MIX each show a residue in dB (what’s left when the two don’t cancel) and a verdict.',
    ],
    control: [
      'Tap RUN THE NULL TEST. It renders (bounces) one bar of the full mix, the two stems, and the full mix with a bus compressor. The button shows each stage as it goes.',
      'Answer the check about stems that sum back louder than the mix.',
    ],
    changes: [
      'With a clean mix bus, the stems rebuild the mix: the residue falls far below −60 dB and reads NULLS ✓.',
      'Add one nonlinear stage (its output isn’t a scaled copy of its input), a bus compressor (−18 dB, 4:1) on the full mix only, and the stems can’t rebuild it: BROKEN ✗.',
      'The compressor reacted to the whole mix, something no separate stem ever heard.',
    ],
    teaches: [
      'The stem contract: summed together, the stems must rebuild the approved mix.',
      'A null test proves it: flip the polarity of one version, add the two, and measure what refuses to disappear.',
      'Stem specs must say what happens to mix-bus processing: printed onto each stem, sent separately, or documented.',
    ],
    tryThis: [
      'Run the test and compare the two residue numbers: the clean bus nulls, the compressed one leaves a residue.',
      'Read the BUS COMP ON FULL MIX residue: it is the compressor’s reaction to the whole mix, which no single stem ever met.',
    ],
  },

  // ── 18 · Professional Delivery ────────────────────────────────────────────
  p18: {
    intro: {
      learning: 'Why delivery is part of the craft: named versions, aligned files, documentation and an archive let anyone, including you a year later, find and recall the mix.',
      start: 'Open Version control, Metadata & documentation and Archive & recall. Then work down THE DELIVERY CHECKLIST, checking each line as if this were your delivery.',
    },
    seeing: [
      'THE PRACTICES covers three habits: Version control, Metadata & documentation, and Archive & recall.',
      'THE DELIVERY CHECKLIST — CHECKED, NOT REMEMBERED has six lines. Each shows ☐ until you check it.',
      'Below is a check about recalling a mix a year later.',
    ],
    control: [
      'Tap each practice to open it and read what it protects.',
      'Tap each checklist line to check it (☑), as if this were your own delivery.',
      'Answer the check about recalling a mix a year later.',
    ],
    changes: [
      'Nothing here changes the sound. What changes is whether someone else can open, trust and recall your work.',
      'Each line you check turns ☑ and stays checked.',
      'Checking all six lines meets the second goal chip.',
    ],
    teaches: [
      'Delivery is a craft: version names, aligned files, documentation and an archive.',
      'A checklist is checked, not remembered: late in a long session, memory skips steps.',
      'The engineer whose files are named, aligned and documented right gets called again.',
    ],
    tryThis: [
      'Check the six lines in order and say, for each, what would go wrong if it were skipped.',
      'Open Archive & recall, then answer the check. What would you need to rebuild this mix a year from now?',
    ],
  },

  // ── 19 · Mix Diagnosis ────────────────────────────────────────────────────
  p19: {
    intro: {
      learning: 'How diagnosis works: hear a symptom, name its real cause and choose the smallest repair, across three classic mix complaints.',
      start: 'Play ▶ MUDDY FLAWED and decide what’s wrong before you hear the repair. Answer the case’s check, then play ▶ MUDDY REPAIRED and compare.',
    },
    seeing: [
      'Three cases: CASE 1 — “IT’S MUDDY”, CASE 2 — “IT’S HARSH”, CASE 3 — “THE VOCAL IS BURIED”.',
      'Each card: the symptom, a flawed and a repaired version, a drawing, and a diagnosis check.',
      'The drawing hides its names and values until you answer that case’s check or play its repair, so your ears decide first.',
    ],
    control: [
      'Tap ▶ MUDDY FLAWED or ▶ MUDDY REPAIRED to hear each version, matched in level. HARSH and BURIED have the same pair of buttons.',
      'Each case’s drawing follows the version you picked in that case.',
      'Answer each case’s check: What is actually wrong?',
    ],
    changes: [
      'The muddy and harsh cases draw EQ curves; the buried case draws the console.',
      'Answering the check, or playing the repair, reveals the labels and values in the drawing.',
      'A wrong answer explains why it doesn’t fit the symptom; choose again.',
    ],
    teaches: [
      'Diagnosis: hear a symptom, name the cause, choose the smallest repair.',
      'A complaint like “muddy” or “buried” describes what a listener hears, not its cause. Finding the cause is your job.',
      'Matched in level, flawed against repaired shows what the repair really changed, not just how loud it is.',
    ],
    tryThis: [
      'Diagnose each case from the FLAWED version alone before you play the repair.',
      'After answering, compare the flawed and repaired drawings and match each change to what you heard.',
    ],
  },

  // ── 20 · The Final Repair ─────────────────────────────────────────────────
  p20: {
    intro: {
      learning: 'The whole job on a mix someone else started: diagnose it, repair it, add gentle glue, check in mono, and ask whether it honors your priorities.',
      start: 'Play ▶ THE HANDOFF and answer THE HANDOFF — YOUR DIAGNOSIS. Then work on THE REPAIR CONSOLE and watch THE STEPS turn ✓ as you go.',
    },
    seeing: [
      'THE MIXER’S MANTRA opens the page. STEP 1 — DIAGNOSE THE HANDOFF plays THE HANDOFF, someone else’s flawed mix, with a check.',
      'THE REPAIR CONSOLE: eight channels set to the handoff’s flawed mix.',
      'LISTEN — HANDOFF VS YOUR REPAIR: THE HANDOFF, YOUR REPAIR and REPAIR, MONO.',
      'THE STEPS — VERIFIED AS YOU WORK: seven rows that turn ✓ as you go.',
    ],
    control: [
      'Tap ▶ THE HANDOFF to hear the flawed mix, then answer THE HANDOFF — YOUR DIAGNOSIS.',
      'Each console channel has Ø (polarity flip), PAN, MUTE and a fader. Tap a channel’s name tape at its foot to solo it. HIGH-PASS THE KEYS (220 Hz) switches a filter on the keys.',
      'BACK TO THE FLAWED HANDOFF resets the console so you can start again.',
      '▶ THE HANDOFF, ▶ YOUR REPAIR and ▶ REPAIR, MONO compare your work, matched in level. Tap 7 · Deliver yourself, on your honor, when you’re satisfied.',
    ],
    changes: [
      '1 · Diagnose is ✓ by the check. 2 · Rebuild the balance is ✓ with LEAD at −2 dB or higher, GTR at +1 dB or lower, and four channels changed.',
      '3 · Clear the mud is ✓ when the keys are high-passed. Steps 4 and 5 are ✓ when YOUR REPAIR plays: tamer sends and gentle 2:1 glue.',
      '6 · Translation check is ✓ when REPAIR, MONO plays. All seven ✓ shows DELIVERED, with your page 2 priorities read back.',
    ],
    teaches: [
      'Repairing a mix you didn’t start is the whole job in one: diagnose, repair, glue, check in mono, deliver.',
      'The tools that build a mix are the tools that fix one.',
      'A habit worth keeping: at the end of every mix, ask whether it honored the priorities you set.',
    ],
    tryThis: [
      'Once 1 · Diagnose is ✓, try one repair: raise LEAD to −2 dB, pull GTR to +1 dB, lower BGV a little and tap HIGH-PASS THE KEYS. Steps 2 and 3 turn ✓.',
      'Play YOUR REPAIR, then REPAIR, MONO. Does the lead still lead when the mix folds to mono?',
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
  intro: {
    learning: 'Where you stand in the advanced mixing workflow: which stages, from planning and routing to delivery and repair, you have worked through and which are still ahead.',
    start: 'Read the pages still listed and tap one to jump to it. Or tap REVIEW ▾ to reopen a finished page and practice it again.',
  },
  seeing: [
    'This is WHAT’S LEFT. Once every page is done, the title changes to LAB COMPLETE.',
    'Each page you haven’t finished is listed by number and name. It counts once the goal chips at the foot of that page are done.',
    'Finished pages fold into one ✓ CREDITED line, or ✓ DONE if you’re not signed in.',
  ],
  control: [
    'Tap a listed page to jump straight to it.',
    'Tap REVIEW ▾ on the ✓ line to unfold your finished pages, then tap one to open it again. HIDE ▴ folds them away.',
    'PRACTICE AGAIN FROM THE START opens page 1, Before You Begin. It clears nothing.',
    'DONE · BACK TO LABS takes you out of the lab, back to the screen you opened it from.',
    'On the strip, ‹ PREV returns to the page you were on and ⏮ opens page 1. The WHAT’S LEFT readout lists every page, with ✓ on the ones you’ve done.',
  ],
  changes: [
    'A page is done when every goal chip at its foot shows ✓. NEXT and FINISH move you on, but they don’t mark the page done.',
    'Before You Begin counts as soon as you open it with Beginning Mixing finished on this device, or once you pass its three checks.',
    'Signed in, your finished pages are saved to your account. They still read ✓ CREDITED after START OVER (PRACTICE) in the strip’s page list.',
  ],
  teaches: [
    'An advanced mix moves through stages: set priorities, organize and route, process, check how it translates, deliver stems and files, then diagnose and repair.',
    'The stages lean on each other: a clear routing map makes a late repair fast, and stems only rebuild the mix if bus processing was planned.',
    'Real mixes loop back: a mono or loudness check near the end often sends you back to routing, EQ or space.',
  ],
  tryThis: [
    'Jump to the first page still listed and scroll to its goal chips before you start, so you know what makes it count.',
    'Tap REVIEW ▾ and reopen a finished page to practice it again. Practicing never takes away its ✓.',
  ],
};
