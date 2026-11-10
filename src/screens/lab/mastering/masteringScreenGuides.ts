/**
 * Mastering Lab — "explain this screen" content (owner 2026-10-31, the Screen
 * Guide rollout; pattern: wave/waveScreenGuides.ts).
 *
 * The lab is ONE screen with eight modules, each a run of STEPS (LEARN /
 * LISTEN / EXPLORE / PRACTICE / REVIEW) on the shared strip in sub-step mode.
 * Every step is its own screen, so every step has its own guide: keyed by
 * module id, in step order, each entry carrying the step's own key, title and
 * layout (rack = a Rack Unit with display, bezel and dock; read = a document
 * page). MasteringLabScreen asks masteringStepGuide(module, step); the
 * what's-left screen (its own end state, FINISH › or CONTENTS → WHAT'S LEFT ›)
 * shows MASTERING_END_GUIDE, written against that branch of the screen and the
 * shared LabEndScreen (mode="progress", noun module, default DONE label).
 *
 * Every line was written against the step's own code (modules/mod1–mod8,
 * kit, stages, masteringContent, masteringEngine): names are the on-screen
 * names (bezel keys, dock labels, card titles), and every number quoted in
 * TRY THIS is what the step prints at that setting (masteringEngine maths).
 * Reorder, retitle or re-lay a step → update its entry here;
 * test/screenGuide_mastering_20261031.test.ts pins key, title and layout
 * against the module files.
 *
 * STEPPED: each section is one step held to SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; claims KNOWLEDGE, never
 * skills; no loudness number as THE rule (examples to verify against the
 * destination's current spec); nothing encourages loud monitoring; "suggest",
 * never "recommend"; no gear maker names; no "N of total"; no build notes in
 * learner text. The guide never gives away a PRACTICE card's answer or the
 * Module 8 checks key.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';
import type { MasteringModuleId } from './masteringContent';

export type MasteringGuideStep = { key: string; title: string; rack: boolean; guide: ScreenGuide };

/* ── shared wording for the steps every module repeats ───────────────────── */

const DECK_CONTROL = [
  'Tap the option you think fits. Your FIRST answer on each card is the one recorded. If you try again, you still get the explanation, with no penalty.',
  '‹ PREV CARD and NEXT CARD › move between cards. The deck opens on the first card you haven’t answered.',
  'NEXT › on the strip moves on at any time; you can come back.',
];

export const MASTERING_GUIDE_STEPS: Record<MasteringModuleId, readonly MasteringGuideStep[]> = {
  // ══ MODULE 1 · What mastering is ═════════════════════════════════════════
  what: [
    {
      key: 'fits', title: 'Where mastering fits', rack: true,
      guide: {
        intro: {
          learning: 'Where mastering sits in a project — after mixing, before release — and why it works on one finished stereo file, not on separate tracks.',
          start: 'Ride STAGE from MIX to MASTER and watch WORKS ON change from TRACKS to STEREO. Then ride on to RELEASE.',
        },
        seeing: [
          'At the top of the notes, IN THIS MODULE gives you this module’s objective.',
          'The display shows a project’s chain — RECORDING, EDITING, MIXING, MASTERING, RELEASE — with the stage you’ve chosen lit.',
          'On the bezel, STAGE gives its place in the chain, NAME its name, and WORKS ON what that stage acts on.',
          'In the header, the first ⓘ opens this lab’s accuracy note; the far-right ⓘ explains the screen.',
        ],
        control: [
          'Ride the STAGE fader in the dock through REC, EDIT, MIX, MASTER and RELEASE. It starts on MASTER.',
          'The strip holds ⏮, ‹ PREV, the readout and NEXT ›. ‹ PREV and NEXT › walk through the steps and carry on into the next module. Tap the readout for the list of modules.',
          'HIDE DISPLAY and FULL SCREEN sit on the bezel. The ‹ at the top leaves the lab. “When to bring in a pro ›” under the strip opens a short note.',
        ],
        changes: [
          'At REC, EDIT and MIX, WORKS ON reads TRACKS: every part — vocal, drums, bass — is still separate and can be moved on its own.',
          'At MASTERING it reads STEREO: one finished file with every element inside it.',
          'At RELEASE it reads FILES: the masters delivered for release.',
        ],
        teaches: [
          'Mastering is the last listening, decision-making and delivery stage before release.',
          'It acts on the whole program at once. Once the mix is stereo, the vocal is no longer its own control, so mastering can’t rebalance the tracks inside it.',
          'That’s why a problem with one part goes back to the mix stage.',
        ],
        tryThis: [
          'Ride STAGE to MIX: WORKS ON reads TRACKS. Step to MASTER: it reads STEREO — the vocal is no longer its own handle.',
          'Ride on to RELEASE: WORKS ON reads FILES. At each stage, ask what could still be changed there.',
        ],
      },
    },
    {
      key: 'can', title: 'What mastering can and cannot do', rack: false,
      guide: {
        intro: {
          learning: 'What mastering can change in a finished stereo mix — tone, dynamics, level, consistency, order — and what it can’t: one element’s balance inside it.',
          start: 'Read WHAT MASTERING CAN ADDRESS, then WHAT IT CANNOT DO. Finish with THE PURPOSE OF OBJECTIVITY: the next step tests it by ear.',
        },
        seeing: [
          'This is a reading page in three parts: WHAT MASTERING CAN ADDRESS, WHAT IT CANNOT DO, and THE PURPOSE OF OBJECTIVITY.',
          'The first part lists four things mastering can address: overall tonal balance, dynamics and level, consistency across a collection, and sequencing and release preparation.',
        ],
        control: [
          'Scroll to read. When you’re done, NEXT › at the foot of the page takes you to the LISTEN step.',
        ],
        changes: [
          'Nothing moves on this page. It sets up the rule you’ll test by ear on the next step.',
          'An EQ move at the vocal’s frequencies also moves everything else that lives there. That’s why fixing one element needs a revised mix, or stems (separate submixes) by agreement.',
        ],
        teaches: [
          'Mastering shapes the whole program: tone, dynamics, level, consistency, order and delivery.',
          'A stereo master gives no independent control over the vocal, drums or bass.',
          'Objectivity is a method: listen first, compare at matched level, verify with a meter, then decide.',
        ],
        tryThis: [
          'Name one problem from your own listening that mastering could fix, and one that would need a mix revision.',
          'Keep the method in mind — listen, match, verify, decide. The next step puts it to work on a louder version of a mix.',
        ],
      },
    },
    {
      key: 'listen', title: 'Louder is not better', rack: true,
      guide: {
        intro: {
          learning: 'Why a louder version tends to sound “better” at first, and what a limiter really trades away once both versions play at the same loudness.',
          start: 'Leave MATCH LEVEL on. Tap ▶ MIX, then ▶ LOUDER, and listen to the kick and snare hits. Then compare the PLR cell for each version.',
        },
        seeing: [
          'The display shows the waveform of the version playing (THE MIX or LOUDER), a gain-reduction strip and the limiter faceplate: INPUT, CEILING, RELEASE, GR, or BYP when nothing is processed.',
          'The bezel: PEAK, TRUE PK, LUFS (loudness), PLR (peak above loudness) and MATCH dB.',
          'The badge: the meters are estimates and your phone’s output isn’t calibrated, so judge by comparison.',
        ],
        control: [
          '▶ MIX plays the mix as delivered. ▶ LOUDER plays the same mix driven 8 dB into a peak limiter, a processor that holds peaks under a set ceiling. ■ STOP stops. Tapping the display plays or stops too.',
          'MATCH LEVEL starts on: it plays both versions at the quieter one’s loudness.',
          'Once both versions have rendered, the notes show what’s playing and the measured numbers.',
        ],
        changes: [
          'LOUDER’s limiter has its ceiling at −0.3 dBFS. It raises LUFS and shrinks PLR: less distance from peak to average.',
          'With MATCH on, LOUDER is turned down by the loudness difference (in LU; 1 LU = 1 dB), so only the dynamics differ. MATCH dB shows by how much.',
          'TRUE PK can read over 0 dBTP here: this limiter checks only the samples, so peaks that form between samples get through.',
        ],
        teaches: [
          'Louder isn’t better, only louder: extra level makes a version seem fuller and brighter.',
          'Limiting trades transients (the sharp starts of hits) and movement for density. Sometimes that’s the right trade, never automatically.',
          'Fair comparisons happen at matched loudness.',
        ],
        tryThis: [
          'With MATCH LEVEL on, tap ▶ MIX, then ▶ LOUDER, and listen to the kick and snare hits and the space between them.',
          'Compare the PLR cell for each version: LOUDER’s is smaller, because the limiter has pulled its peaks toward the average.',
          'Before switching MATCH off, turn your volume down: the warning card says how far LOUDER steps up.',
        ],
      },
    },
    {
      key: 'practice', title: 'Mix issue or mastering issue?', rack: false,
      guide: {
        intro: {
          learning: 'How to sort a problem by its reach: does it touch the whole stereo program, one element inside it, or is something still unknown?',
          start: 'Read the first card’s situation and ask what it touches. Then tap Mastering adjustment, Mix revision, or More information from the client, and read the explanation.',
        },
        seeing: [
          'Each card describes a situation from a mastering job. A line shows your place in the deck.',
          'Each card offers three next steps: Mastering adjustment, Mix revision, or More information from the client.',
        ],
        control: DECK_CONTROL,
        changes: [
          'A fitting pick shows ✓ and the full explanation. Another pick tells you it isn’t the best fit, so you can choose again.',
          'Once the last card has an answer, this module is done, even if some first picks were wrong.',
        ],
        teaches: [
          'Every problem has a reach: the whole stereo program, one element inside it, or something not yet known. The reach points to the next step.',
          'Asking the client for more information is a legitimate, professional answer, not a way to dodge the decision.',
        ],
        tryThis: [
          'For each card, ask: does this touch the whole program, one element inside it, or is something unknown?',
          'Read every explanation, right or wrong: each one shows the reasoning behind the next step.',
        ],
      },
    },
    {
      key: 'review', title: 'Review', rack: false,
      guide: {
        intro: {
          learning: 'The core of Module 1: mastering sits between mixing and release, works on the whole program, and can’t rebalance elements inside a stereo mix.',
          start: 'Read the KEY IDEAS. Then cover the definitions and say Mastering, Stereo master and Mix revision in your own words before checking them.',
        },
        seeing: [
          'KEY IDEAS sums up this module in five lines.',
          'KEY TERMS defines Mastering, Stereo master and Mix revision.',
          'At the foot: the TAKEAWAY, and the credit line, which shows whether this module is done and what it still needs.',
        ],
        control: [
          'Scroll to read. NEXT › moves on to Module 2, Two roles: who controls what, the mixing or the mastering engineer. Tap the readout on the strip for its list, which jumps to any module.',
        ],
        changes: [
          'The line at the foot updates as you answer the PRACTICE cards. Once all have an answer, it reads credited.',
          'That never goes away. START OVER (PRACTICE), at the foot of the readout’s list, clears your answers, but the module stays done.',
        ],
        teaches: [
          'Mastering sits between mixing and release and works on the whole program.',
          'It cannot rebalance elements inside a stereo mix; a problem with one element calls for a mix revision.',
          'Any mastering change — tone, dynamics, level — reaches every part of the mix at once.',
        ],
        tryThis: [
          'Cover the definitions and say each KEY TERM in your own words.',
          'If the line at the foot says cards are still open, ‹ PREV returns to the PRACTICE step.',
        ],
      },
    },
  ],

  // ══ MODULE 2 · Two roles ═════════════════════════════════════════════════
  roles: [
    {
      key: 'table', title: 'Two jobs, side by side', rack: false,
      guide: {
        intro: {
          learning: 'How the two jobs differ: the mixing engineer shapes relationships between tracks; the mastering engineer judges and prepares the finished program.',
          start: 'Read the table one row at a time, across both columns: MIXING ENGINEER, then MASTERING ENGINEER. Then read the two notes under it.',
        },
        seeing: [
          'IN THIS MODULE gives the objective. Below it, a two-column table compares MIXING ENGINEER and MASTERING ENGINEER across five rows.',
          'Two notes follow: The roles can overlap, and Mastering is not simply “making it louder”.',
        ],
        control: [
          'Scroll to read. NEXT › takes you to the EXPLORE step, where you place client requests in the signal flow.',
        ],
        changes: [
          'Read across each row: you see the same topic from each job.',
          'Even when one person does both, the listening perspective and the control available change.',
        ],
        teaches: [
          'The mixer shapes relationships among tracks; the mastering engineer evaluates and prepares the finished program.',
          'Independent control of one element belongs to the mix, or to stems (separate submixes) by agreement.',
        ],
        tryThis: [
          'For each row, picture a real task — raising a snare, sequencing eight songs — and decide which column it belongs in.',
          'Read The roles can overlap. When one person does both jobs, what changes between the two?',
        ],
      },
    },
    {
      key: 'control', title: 'Who has control of that?', rack: true,
      guide: {
        intro: {
          learning: 'Why a request’s place in the signal flow decides whose job it is: one element belongs to the mix, the whole program to mastering.',
          start: 'Ride REQUEST to VOCAL and see which stage lights and what ADDRESSED BY reads. Then ride to WIDTH and read the card in the notes.',
        },
        seeing: [
          'The display traces the signal flow: the individual tracks, the mix bus, the stereo master, then the delivery.',
          'The lit stage is where the request is normally addressed; its color says whose job it is, and a strip spells out the verdict.',
          'On the bezel, REQUEST gives the short name and ADDRESSED BY reads MIXING, MASTERING or EITHER.',
        ],
        control: [
          'Ride REQUEST in the dock, or tap it for the full list, A CLIENT REQUEST. There are ten requests, from VOCAL and SNARE to FORMAT, WIDTH, BUS COMP and FADES.',
          'Read the card in the notes: it gives the full request and why it belongs where it does.',
        ],
        changes: [
          'Element requests (a vocal level, a snare tone) light the tracks: only the mix can move one part against another.',
          'Whole-program requests (brightness, level, order, format) light the master or delivery stage.',
          'Some read EITHER: both roles can act, but with different reach.',
        ],
        teaches: [
          'Where in the signal flow a request can be properly addressed decides whose job it is.',
          'A stereo master cannot single out one instrument; the mix can.',
        ],
        tryThis: [
          'Ride REQUEST to VOCAL: ADDRESSED BY reads MIXING and the tracks stage lights.',
          'Ride to WIDTH: ADDRESSED BY reads EITHER. Read the card to see how the two roles’ reach differs.',
        ],
      },
    },
    {
      key: 'practice', title: 'Which role?', rack: false,
      guide: {
        intro: {
          learning: 'How to tell a mastering perspective (the finished program, the whole collection) from a mixing one (relationships inside one mix).',
          start: 'Read the first card and ask: is this about the parts of one mix, or the finished program? Then tap one of the three answers and read the explanation.',
        },
        seeing: [
          'Each card asks who does what in a project. A line shows your place in the deck.',
          'Each card offers three answers.',
        ],
        control: DECK_CONTROL,
        changes: [
          'A fitting pick shows ✓ and the full explanation. Another pick tells you it isn’t the best fit, so you can choose again.',
          'Once the last card has an answer, this module is done, even if some first picks were wrong.',
        ],
        teaches: [
          'A mastering perspective looks at the program and the collection; a mixing perspective looks at relationships inside one mix.',
          'Loudness is one decision among many, never the definition of mastering.',
        ],
        tryThis: [
          'Before answering, ask: is this about the parts of one mix, or the finished program as a whole?',
          'Read each explanation, even after a right answer: the reasoning matters more than the pick.',
        ],
      },
    },
    {
      key: 'review', title: 'Review', rack: false,
      guide: {
        intro: {
          learning: 'The core of Module 2: the mixer works inside the session, while the mastering engineer works on the finished program, its translation and its delivery.',
          start: 'Before reading each KEY TERM’s definition, say it in your own words. Then read the TAKEAWAY and the line at the foot.',
        },
        seeing: [
          'KEY IDEAS and KEY TERMS sum up the two roles.',
          'At the foot: the TAKEAWAY, and the credit line, which shows whether this module is done.',
        ],
        control: [
          'Scroll to read. NEXT › moves on to Module 3, Room and monitoring: the room and level every judgment depends on.',
        ],
        changes: [
          'The credit line reads credited once every PRACTICE card has an answer. After that it stays credited, even if you try a card again.',
        ],
        teaches: [
          'The mixer works inside the session; the mastering engineer works on the finished program.',
          'Translation (how the master holds up on other systems), consistency, technical quality and delivery are the mastering focus.',
          'Switching to the mastering role means hearing the program as one whole, not as parts to rebalance.',
        ],
        tryThis: [
          'Say each KEY TERM in your own words before reading its definition.',
          'Cards still open? Tap ‹ PREV to go back to the PRACTICE step and answer them.',
        ],
      },
    },
  ],

  // ══ MODULE 3 · Room and monitoring ═══════════════════════════════════════
  room: [
    {
      key: 'room', title: 'Room and listening environment', rack: false,
      guide: {
        intro: {
          learning: 'Why the listening room shapes every mastering decision: reflections and bass behavior color what you hear, so the main monitors decide and other systems only check.',
          start: 'Tap the A TREATED ROOM drawing to see it larger. Find the amber pads and the corner traps, then read the five points under ROOM DESIGN AND ACOUSTIC CONTROL.',
        },
        seeing: [
          'A TREATED ROOM shows one room from above, with the monitors, the listener and the treatment. It’s an illustration, not a measurement.',
          'ROOM DESIGN AND ACOUSTIC CONTROL covers five room points: noise, reflections, low-frequency behavior, listening position and coloration.',
          'MAIN MONITORS AND SECONDARY CHECKS covers the main pair, a second system and headphones.',
        ],
        control: [
          'Scroll to read, and tap the drawing to see it larger. NEXT › takes you on to monitoring level.',
        ],
        changes: [
          'The amber pads sit at the first-reflection points, where sound from a monitor first bounces off a wall on its way to you. The corner traps deal with the bass.',
          'You sit on the center line, at the third corner of an equilateral triangle with the monitors, away from the walls.',
          'A suggested starting point is about 38% of the way back from the front wall, then refined by measuring.',
        ],
        teaches: [
          'The room is the last stage of the monitoring chain, and the first thing to get right.',
          'Low frequencies are the hardest part of a room to control, and the most likely to mislead a tonal decision.',
          'The main monitors make the decisions; a second system and headphones check them.',
        ],
        tryThis: [
          'Find the amber pads in the drawing. Trace a path from one monitor to the wall where a pad sits, then on to the listener.',
          'Think of your own listening room. Which point is its weakest: noise, reflections, low end, listening position or coloration?',
        ],
      },
    },
    {
      key: 'level', title: 'Monitoring level and listening habits', rack: true,
      guide: {
        intro: {
          learning: 'How listening level changes what you hear: quieter playback sounds thin, louder sounds full, and the louder you listen, the shorter your safe daily time.',
          start: 'Ride the MONITOR fader down to 65 dB and watch BASS and TREBLE. Then ride it up past 85 dB and watch PER DAY and READING.',
        },
        seeing: [
          'The curve shows how your ear’s balance shifts with level, compared with 1 kHz. Ghost curves mark 65, 83 and 95 dB.',
          'On the bezel: SPL (C), BASS and TREBLE (how far each seems to shift), PER DAY (the NIOSH daily limit) and READING.',
          'The orange band on the scale starts where you near the daily exposure limit.',
        ],
        control: [
          'Ride the MONITOR fader in the dock from 55 to 100 dB SPL. It starts at 83 dB. The level is C-weighted (bass counted more fully than in dBA) and read on a slow meter.',
          'Read the notes under the display: they explain each reading and the habit behind it — one moderate level, measured with a meter.',
        ],
        changes: [
          'As level drops, your ear loses bass (and a little treble) faster than 1 kHz, so the same file sounds thin. Louder, it sounds full.',
          'PER DAY follows NIOSH: 8 h+ below 85 dB, and every 3 dB louder halves the safe time.',
          'The NIOSH limit is 85 dBA for 8 hours. A C reading of music runs a few dB higher, so PER DAY errs on the safe side.',
          'READING: QUIET below 70, GOOD to 83, HOT from 84 to 88, UNSAFE from 89.',
        ],
        teaches: [
          'A tonal decision made at a different level is partly a decision about the level.',
          'One repeatable, moderate monitoring level keeps comparisons fair, keeps you focused and protects your hearing.',
          'Measure the level with a calibrated meter. A room meter can’t read headphone level, and headphones often run louder than they feel.',
        ],
        tryThis: [
          'Ride MONITOR down to 65 dB: BASS reads −5.3 dB and TREBLE −1.1 dB. The same file would now sound thin.',
          'Ride up to 88 dB: PER DAY reads 4 h and READING HOT. At 91 dB it’s 2 h and UNSAFE. Then bring it back to 83.',
        ],
      },
    },
    {
      key: 'path', title: 'Build a monitoring path', rack: true,
      guide: {
        intro: {
          learning: 'A monitoring path is an order of jobs — playback, conversion, level control, amplification, loudspeakers — and the order holds however the boxes share them.',
          start: 'Press + CONNECT and watch DAW appear on the glass. Keep pressing until PATH reads COMPLETE. Then tap CLEAR and build a chain that ends in ACTIVE.',
        },
        seeing: [
          'The display draws the chain you build, device by device. The next device shows faintly, marked NEXT ›, and each cable is drawn by what it carries.',
          'A verdict appears on the glass: COMPLETE, WORKS · MINIMAL, or CHECK THE CHAIN.',
          'On the bezel: STAGES (slots used), TO ADD, and PATH (EMPTY, CHECK, MINIMAL, COMPLETE).',
        ],
        control: [
          'Pick a DEVICE in the dock: DAW, DAC (digital-to-analog converter), MON CTL (monitor controller), AMP, PASSIVE or ACTIVE. Each has a one-line note on its job.',
          '+ CONNECT adds it to the chain. If it’s already in, you see ✓ PLACED; at five devices, SLOTS FULL. The choice then moves on to the next device not yet placed.',
          '‹ UNDO removes the last device; CLEAR empties the chain.',
        ],
        changes: [
          'The notes tell you, in plain words, what is wrong or missing.',
          'COMPLETE needs a monitor controller and at least four of the five jobs: playback, conversion, level, amplification and sound.',
          'An AMP in front of ACTIVE monitors reads CHECK: active monitors already have their own amplifiers built in.',
        ],
        teaches: [
          'A monitoring path is an order of jobs: playback, conversion (digital to analog), level control, amplification, loudspeakers.',
          'Real systems split those jobs across boxes in different ways; the order stays the same.',
          'Power order: amplifiers on last and off first, so switching thumps from other gear never reach the speakers.',
        ],
        tryThis: [
          'Press + CONNECT five times: the choice walks DAW, DAC, MON CTL, AMP, PASSIVE and PATH reads COMPLETE.',
          'Tap CLEAR, connect DAW, DAC, MON CTL and AMP, then choose ACTIVE last: PATH reads CHECK. Read the note to see why.',
        ],
      },
    },
    {
      key: 'practice', title: 'Room and monitoring decisions', rack: false,
      guide: {
        intro: {
          learning: 'How the room, the listening level and the monitoring path each change what reaches your ears, and why headphones and small speakers check rather than decide.',
          start: 'Read the first card and ask whether it’s about the room, the level or the path. Tap the option that fits, then read the explanation.',
        },
        seeing: [
          'A deck of room and monitoring decisions, one card at a time. A line shows your place in the deck.',
        ],
        control: DECK_CONTROL,
        changes: [
          'A fitting pick shows ✓ and the full explanation. Another pick tells you it isn’t the best fit, so you can choose again.',
          'Once the last card has an answer, this module is done, even if some first picks were wrong.',
        ],
        teaches: [
          'When a mix sounds wrong in your listening position, the cause can be the room, the monitoring level or the monitoring path, and each needs a different fix.',
          'Headphones and small speakers are checks, not the reference: the decisions are made on the main monitors in the treated room.',
        ],
        tryThis: [
          'For each card, ask what reached your ears: the room, the level, or the path. Then choose.',
          'Read every explanation, right or wrong, and match it to the room drawing, the MONITOR curve or the path you built.',
        ],
      },
    },
    {
      key: 'review', title: 'Review', rack: false,
      guide: {
        intro: {
          learning: 'A recap: a mastering judgment depends on the room, one moderate and repeatable listening level, and a monitoring path in the right order.',
          start: 'Before you scroll, say the five jobs of a monitoring path in order. Then read KEY IDEAS, KEY TERMS and the TAKEAWAY.',
        },
        seeing: [
          'KEY IDEAS and KEY TERMS sum up the room and monitoring.',
          'At the foot: the TAKEAWAY, and the credit line, which shows whether this module is done.',
        ],
        control: [
          'Scroll to read. NEXT › moves on to Module 4, Mastering equipment and tools: the tools, grouped by the decisions they serve.',
        ],
        changes: [
          'The credit line reads credited once every PRACTICE card has an answer. After that it stays credited, even if you try a card again.',
        ],
        teaches: [
          'A judgment is only as good as the room and the level it was made at.',
          'One moderate, repeatable monitoring level, measured with a meter, keeps every comparison fair.',
          'The monitoring path runs playback, conversion, level control, amplification, loudspeakers, in that order.',
        ],
        tryThis: [
          'Say the five jobs of a monitoring path in order without looking.',
          'Cards still open? Tap ‹ PREV to go back to the PRACTICE step and answer them.',
        ],
      },
    },
  ],

  // ══ MODULE 4 · Mastering equipment and tools ═════════════════════════════
  tools: [
    {
      key: 'groups', title: 'Tools by the decision they serve', rack: false,
      guide: {
        intro: {
          learning: 'Mastering tools are grouped by the decision they serve, from hearing and editing the file to verifying it, because no single chain of gear is required.',
          start: 'Scroll through the seven cards. For each tool group, read the decision it serves, then find the one group that only verifies.',
        },
        seeing: [
          'IN THIS MODULE gives the module’s goal. Below it are seven cards, one per tool group, each with the decision it serves.',
          'They run from Playback and editing (hear it, cut it, export it) to Analog equipment (optional).',
        ],
        control: [
          'Scroll to read. NEXT › goes on to the tool shelf, where you can try each group.',
        ],
        changes: [
          'Nothing moves on this page. On the next step, these same seven groups become the shelf you pick from with TOOL.',
        ],
        teaches: [
          'There is no required chain: the order and the gear vary by engineer, room and project.',
          'What stays the same is the set of decisions a session makes, so the tools are grouped by those decisions.',
        ],
        tryThis: [
          'For each group, name a problem you would reach for it to solve.',
          'Find the one group that exists only to verify: Meters and analysis. It changes nothing in the sound; it tells you what is there.',
        ],
      },
    },
    {
      key: 'shelf', title: 'The tool shelf', rack: true,
      guide: {
        intro: {
          learning: 'Each mastering decision has its own view: an EQ curve for tone, a dynamics curve for density and peaks, a stereo picture for width, meters to verify.',
          start: 'Pick STEREO with TOOL and ride WIDTH up to ×2.00 while you watch CORRELATION. Then pick DYNAMICS and ride RATIO while you watch OUT AT 0 IN.',
        },
        seeing: [
          'The display shows the view a mastering engineer reads for the chosen tool group: an EQ curve, a dynamics curve, a stereo picture or a meter.',
          'On the bezel: TOOL, the amount (TILT, RATIO, WIDTH, LEVEL…), and a second number where it helps: OUT AT 0 IN, CORRELATION or LUFS (I).',
          'The badge reads MODEL for a modeled view, or MEASURED when METERS reads the client’s mix itself.',
        ],
        control: [
          'TOOL in the dock picks the group: EDITING, MONITORS, EQ, DYNAMICS, STEREO, METERS, ANALOG. The amount fader takes its name from the tool.',
          'Changing TOOL resets the amount: EQ to ±1.5 dB brighter, DYNAMICS to 10.5 : 1, STEREO to ×1.00.',
          '▶ DRAW MIX appears for EDITING and METERS. It reads the client’s mix once, silently, and draws it.',
        ],
        changes: [
          'EQ and ANALOG tilt by the same amount at both ends, up to ±3.0 dB. DYNAMICS ratio runs 1.0 : 1 to 20.0 : 1 against a −12 dB threshold.',
          'STEREO width runs ×0.00 to ×2.00. Wider means lower correlation: the two channels share less.',
          'METERS: LEVEL is a plain gain change of ±8 dB, and every loudness number moves with it.',
        ],
        teaches: [
          'Each decision has its own display: EQ for tone, dynamics for density and peaks, stereo for width (with a mono check), meters to verify.',
          'Meters confirm a decision you made by listening; they don’t make it for you.',
        ],
        tryThis: [
          'Pick STEREO and ride WIDTH from ×1.00 up to ×2.00: CORRELATION falls from 0.60 to 0.00.',
          'Pick DYNAMICS: at RATIO 10.5 : 1 a 0 dB input comes out at −10.9 dB. Ride RATIO down to 2.1 : 1, nearer the gentle ratios suggested as a starting point in mastering: OUT AT 0 IN reads −6.4 dB.',
        ],
      },
    },
    {
      key: 'analog', title: 'Analog and digital', rack: false,
      guide: {
        intro: {
          learning: 'Analog gear is optional in mastering. Analog and digital differ in recall, precision, workflow and color, not in rank, and both are judged the same fair way.',
          start: 'Read What it is and What it is not, then How to compare honestly. List the four things you would match before comparing any two tools.',
        },
        seeing: [
          'ANALOG EQUIPMENT (OPTIONAL) is one reading page in three parts: What it is, What it is not, and How to compare honestly.',
        ],
        control: [
          'Scroll to read. NEXT › goes on to the PRACTICE step.',
        ],
        changes: [
          'Nothing moves on this page. It sets the rule you use to compare any two tools, analog or digital.',
        ],
        teaches: [
          'Analog gear is optional: neither a requirement nor a mark of quality.',
          'Analog and digital differ in recall (bringing back exact settings later), precision, workflow and color, not in rank.',
          'Compare them the same way as everything else: the same goal, matched level, bypass and a second system.',
        ],
        tryThis: [
          'List what you would match before comparing any two tools: the goal, the level, a bypass, a second system.',
          'Think of one reason to choose each: exact recall for digital, a particular color for analog.',
        ],
      },
    },
    {
      key: 'practice', title: 'Choose a tool for the job', rack: false,
      guide: {
        intro: {
          learning: 'How a listening goal points to a tool group rather than a preset, and why the honest next move is sometimes a check, not more processing.',
          start: 'Read the first card’s listening goal. Name the decision it needs — tone, density, width or verification — then tap the option that fits and read the explanation.',
        },
        seeing: [
          'A deck of listening goals, one card at a time. Each card asks which tool, or which next check, might help.',
          'On this deck the options sit two across.',
        ],
        control: DECK_CONTROL,
        changes: [
          'A fitting pick shows ✓ and the full explanation. Another pick tells you it isn’t the best fit, so you can choose again.',
          'Once the last card has an answer, this module is done, even if some first picks were wrong.',
        ],
        teaches: [
          'A tool is chosen by the goal you can hear, not by a preset.',
          'Sometimes the next move is a check, such as a meter or a second system, not more processing.',
        ],
        tryThis: [
          'Before answering, name the decision first (tone, density, width, verification), then the tool group.',
          'Watch for cards where the honest answer is a check rather than a tool.',
        ],
      },
    },
    {
      key: 'review', title: 'Review', rack: false,
      guide: {
        intro: {
          learning: 'A recap: mastering tools are grouped by the decision they serve, chosen by the goal, confirmed by listening at matched level and verified with a meter.',
          start: 'Before you scroll, name the seven tool groups from memory. Then read KEY IDEAS, KEY TERMS and the TAKEAWAY.',
        },
        seeing: [
          'KEY IDEAS and KEY TERMS sum up the tools.',
          'At the foot: the TAKEAWAY, and the credit line, which shows whether this module is done.',
        ],
        control: [
          'Scroll to read. NEXT › moves on to Module 5, The mastering workflow: the order a typical session runs in.',
        ],
        changes: [
          'The credit line reads credited once every PRACTICE card has an answer. After that it stays credited, even if you try a card again.',
        ],
        teaches: [
          'Tools are grouped by the decision they serve; there is no required chain.',
          'Choose by the goal, confirm by listening at matched level, and verify with a meter.',
          'Analog and digital differ in recall and color, not in rank.',
        ],
        tryThis: [
          'Name the seven tool groups from memory, then check them against TOOL on the shelf step.',
          'Cards still open? Tap ‹ PREV to go back to the PRACTICE step and answer them.',
        ],
      },
    },
  ],

  // ══ MODULE 5 · The mastering workflow ════════════════════════════════════
  workflow: [
    {
      key: 'flow', title: 'A common workflow', rack: true,
      guide: {
        intro: {
          learning: 'A mastering session runs in a common order, from inspecting the file to checking the exports, and why inspection comes first and the quality check comes last.',
          start: 'Ride the FLOW fader from INSPECT to QC and watch each stage light on the display. Then go back to INSPECT and read its card in the notes.',
        },
        seeing: [
          'Start with IN THIS MODULE at the top of the notes: it says what this module is for.',
          'The display shows a common mastering workflow in seven stages, with one stage lit. The badge reminds you that order and scope vary from job to job.',
          'On the bezel, FLOW shows where the stage sits in the order and NAME gives its name. The card in the notes explains that stage.',
        ],
        control: [
          'Ride the FLOW fader in the dock through its seven stops: INSPECT, LISTEN, DECIDE, CHANGE, SEQUENCE, DELIVER, QC. Each stop lights its stage and brings up its card in the notes.',
          'When you’ve read every card, tap NEXT › on the strip to go on to the inspection sheet.',
        ],
        changes: [
          'As you move FLOW, the lit stage moves along the display and the card switches to that stage’s job.',
          'Receive and inspect comes first: a peak meter and a DC-offset check (a steady shift of the waveform away from zero) before monitoring at level.',
          'Quality-check the exports comes last, and it’s done on the exported files themselves, not on the session.',
        ],
        teaches: [
          'A typical session runs: receive and inspect, listen, decide whether the mix is ready, change, sequence, deliver, check.',
          'Order and scope vary by project; the habits don’t: inspect before you process, compare every change at matched level, and check the files you send.',
        ],
        tryThis: [
          'Ride FLOW to INSPECT and read its card. What happens before anything is played at level, and why does it come first?',
          'Ride to CHANGE and read its card: every change is compared with the unprocessed mix at matched level, the same fair test you heard in Module 1.',
        ],
      },
    },
    {
      key: 'inspect', title: 'Inspect the delivery', rack: false,
      guide: {
        intro: {
          learning: 'Why a delivered mix is inspected before any processing: the version, the headroom, a limiter left on the mix bus and the real delivery spec.',
          start: 'Scroll through the inspection sheet and stop at each flagged row to read what it found. Then read the Decide card at the end: three questions that go back to the client.',
        },
        seeing: [
          'This sheet is your first look at a mix that has arrived for the EP: file, approved version, format, sample peak, DC offset, the mixer’s notes, references and delivery requirements.',
          'Flagged rows show what a careful first look turns up.',
          'The Decide card at the end lists three questions to send back to the client.',
        ],
        control: [
          'Scroll to read. NEXT › goes on to the LISTEN step.',
        ],
        changes: [
          'Each flag names a problem and the question it raises — before a note is heard at level.',
          'Nothing is processed on this sheet: every flag is something to confirm with the client first.',
        ],
        teaches: [
          'Inspection comes before processing: version, headroom, a limiter on the mix bus, and the real delivery spec.',
          'Three questions to the client cost less than a master of the wrong file.',
        ],
        tryThis: [
          'Find the version mismatch: the file says v7, but the email approved v8.',
          'Find the row that should be checked before monitoring at level, and read why.',
        ],
      },
    },
    {
      key: 'listen', title: 'A considered change, matched', rack: true,
      guide: {
        intro: {
          learning: 'Why a mastering change is judged against the bypassed mix at matched level, and how a small level boost makes a change seem better than it is.',
          start: 'Leave MATCH LEVEL on. Tap ▶ BYPASS, then ▶ WITH EQ, and listen to the tone. Then move the TILT fader and compare the two again.',
        },
        seeing: [
          'The display shows the waveform of the version you’re hearing and the EQ faceplate. TILT is split between the 200 Hz and 2.5 kHz shelves: one end goes up as the other goes down.',
          'The faceplate also shows the +2 dB OUTPUT trim and the SAFETY ceiling. In BYPASS it reads BYP.',
          'The bezel shows PEAK, TRUE PK, LUFS, PLR and MATCH dB, as in Module 1.',
        ],
        control: [
          'TILT fader: −4.0 to +4.0 dB end to end, in 0.5 dB steps. It starts at +1.5.',
          'MATCH LEVEL starts on; leave it on. Tap ▶ BYPASS to hear the mix untouched, ▶ WITH EQ to hear the tilt, and ■ STOP to stop. Tapping the display plays or stops too.',
          'With MATCH on, moving the fader updates the version you’re hearing and plays it again, so you can compare straight away.',
        ],
        changes: [
          'WITH EQ adds the tilt plus a +2 dB output trim — the way a “better” setting usually sneaks in louder. The −0.3 dBFS SAFETY ceiling holds its peaks.',
          'A tilt moves the LUFS reading up or down, depending on where the mix’s energy sits.',
          'With MATCH on, whichever version reads louder is turned down by the difference, so only the tone is judged.',
        ],
        teaches: [
          'Make a change for a reason you can name, then bypass, match and listen again.',
          'A small level rise, like this +2 dB trim, can make a version seem fuller and brighter, so a change only proves itself at matched level.',
          'A change you keep is one that still wins at matched level.',
        ],
        tryThis: [
          'Set TILT to +4.0: the dock reads +4.0 dB end to end (±2.0): each shelf moves 2.0 dB. Compare WITH EQ and BYPASS with MATCH LEVEL on. Do you still prefer it?',
          'Move TILT to −4.0 and watch which way the LUFS cell moves this time.',
        ],
      },
    },
    {
      key: 'practice', title: 'Workflow decisions', rack: false,
      guide: {
        intro: {
          learning: 'Where each workflow decision belongs in a mastering session: at inspection, on the first listen, in a matched bypass, or at the final check.',
          start: 'Read the first card and place it on the FLOW you met in this module’s first step. Tap the option that fits, then read the explanation before NEXT CARD ›.',
        },
        seeing: [
          'A deck of workflow decisions, one card at a time. A line shows your place in the deck.',
          'Each card describes a moment in a mastering session and asks what fits there.',
        ],
        control: DECK_CONTROL,
        changes: [
          'A fitting pick shows ✓ and the full explanation. Another pick tells you it isn’t the best fit, so you can choose again.',
          'Once the last card has an answer, this module is done, even if some first picks were wrong.',
        ],
        teaches: [
          'Where each decision belongs in the session: inspection, the first listen, a matched bypass, the final check.',
          'A decision made at the wrong point in the session costs time and work, so each one belongs at its own stage.',
        ],
        tryThis: [
          'For each card, find its place on the FLOW from the first step of this module.',
          'Read every explanation, right or wrong, and name the FLOW stage it belongs to.',
        ],
      },
    },
    {
      key: 'review', title: 'Review', rack: false,
      guide: {
        intro: {
          learning: 'The seven workflow stages in order, and two habits behind them: compare every change with the bypass at matched level, and run QC on the files you send.',
          start: 'Read KEY IDEAS and KEY TERMS, then the TAKEAWAY at the foot. If the line under it says cards are still open, ‹ PREV takes you back to the PRACTICE step.',
        },
        seeing: [
          'KEY IDEAS sums up the workflow; KEY TERMS gives its words and what they mean.',
          'At the foot: the TAKEAWAY, and the credit line, which shows whether this module is done.',
        ],
        control: [
          'Scroll to read. NEXT › moves on to Module 6, Loudness and translation: reading loudness numbers and comparing masters fairly.',
        ],
        changes: [
          'The credit line reads credited once every PRACTICE card has an answer. After that it stays credited, even if you try a card again.',
        ],
        teaches: [
          'Inspect, listen, decide, change, sequence, deliver, check.',
          'Every processing decision is a bypass comparison at matched level; QC is on the files you send.',
          'Inspection protects the job from the wrong file before any work starts; QC catches problems in what actually leaves the room.',
        ],
        tryThis: [
          'Say the seven workflow stages in order without looking.',
          'Cards still open? Tap ‹ PREV to go back to the PRACTICE step and answer them.',
        ],
      },
    },
  ],

  // ══ MODULE 6 · Loudness and translation ══════════════════════════════════
  loudness: [
    {
      key: 'numbers', title: 'The four numbers', rack: true,
      guide: {
        intro: {
          learning: 'Peak, true peak, integrated loudness and dynamic range answer four different questions, and gain moves them together without changing the gaps between them.',
          start: 'Pick a SIGNAL, then ride the GAIN fader and watch PEAK, TRUE PK and LUFS move together. Switch FACE between Sample peak meter and Loudness meter to compare.',
        },
        seeing: [
          'Start with IN THIS MODULE at the top of the notes.',
          'The display is a sample peak meter or a loudness meter, the same meters as the Visual Audio Analysis lab. It plays a synthesized teaching signal, and there’s no target line: no single number is the goal here.',
          'The bezel shows PEAK, TRUE PK, LUFS (loudness units relative to full scale), GAIN and FACE.',
        ],
        control: [
          'GAIN fader: −12 to +6 dB, in 0.5 dB steps.',
          'FACE switches the meter: Sample peak meter or Loudness meter (BS.1770-style, the standard method behind LUFS).',
          'SIGNAL picks Music mix, Speech, Kick drum or Organ. Each comes with a note on what to watch.',
        ],
        changes: [
          'GAIN moves PEAK, TRUE PK and LUFS by the same amount: the gaps between them stay put.',
          'SIGNAL changes the gap between peak and loudness — the room a limiter has to spend.',
          'True peak, read between samples, can sit above the sample peak.',
        ],
        teaches: [
          'Four different questions: peak (one instant), true peak (between samples), integrated loudness (the whole piece), dynamic range (peaks above average, and movement over time).',
          'Limiting mostly spends the peak-to-average gap; compression shrinks loudness movement.',
        ],
        tryThis: [
          'Ride GAIN to +3.0 dB: PEAK, TRUE PK and LUFS all rise by 3.0 — the gaps between them do not change.',
          'Switch SIGNAL from Music mix to Kick drum, then Organ, and compare how far PEAK sits above LUFS for each.',
        ],
      },
    },
    {
      key: 'listen', title: 'Quieter and louder, matched', rack: true,
      guide: {
        intro: {
          learning: 'What a louder master costs: pushing a limiter harder raises loudness but takes away transients and movement, which you only hear fairly at matched level.',
          start: 'Leave MATCH LEVEL on and tap ▶ QUIETER, then ▶ LOUDER. Push DRIVE higher and compare again, listening to the hits and the space between them.',
        },
        seeing: [
          'The display shows the waveform, the gain-reduction strip and the limiter faceplate: INPUT (the drive), CEILING −1.0 dBFS, RELEASE 80 ms and GR (gain reduction).',
          'While you drag DRIVE, the picture is an estimate, labeled ESTIMATE · RENDERS WHEN YOU LET GO. Let go to see and hear the result.',
          'The bezel shows PEAK, TRUE PK, LUFS, PLR and MATCH dB, as in Module 1.',
        ],
        control: [
          'DRIVE fader: 0 to +14 dB into the limiter, in 0.5 dB steps. It starts at +6.0.',
          'MATCH LEVEL starts on; leave it on. Tap ▶ QUIETER or ▶ LOUDER to hear each version, and ■ STOP to stop. Tapping the display plays or stops too.',
        ],
        changes: [
          'QUIETER is the same limiter with no drive; LOUDER is driven by DRIVE.',
          'More drive: more gain reduction, a higher LUFS and a smaller PLR. With MATCH on, LOUDER is turned down to QUIETER’s loudness, so you hear only what the limiting did.',
          'This limiter watches samples only, and peaks can form between samples, so TRUE PK can read over its −1.0 ceiling.',
        ],
        teaches: [
          'What a louder master costs, heard at matched level: transients and movement.',
          'The right loudness depends on the content and the destination; this lab sets no target.',
        ],
        tryThis: [
          'Ride DRIVE to 0: LOUDER becomes the same as QUIETER. Then push it to +14 and compare them at matched level.',
          'At high DRIVE, read TRUE PK: a sample-peak ceiling of −1.0 can still let true peak through above it.',
          'Want to hear LOUDER without the match? Turn your volume down first: the warning card says how far it steps up.',
        ],
      },
    },
    {
      key: 'normal', title: 'Normalization and translation', rack: false,
      guide: {
        intro: {
          learning: 'Why loudness normalization doesn’t make careful mastering pointless, and why headphones, small speakers, a car and a phone are checks while the accurate room decides.',
          start: 'Read PLAYBACK LOUDNESS NORMALIZATION first, then TRANSLATION CHECKS. When you’re done, tap NEXT › to see the translation display.',
        },
        seeing: [
          'A reading page in two parts: PLAYBACK LOUDNESS NORMALIZATION, then TRANSLATION CHECKS.',
          'The first part is about how services play masters back; the second is about how other systems show you what the master really holds.',
        ],
        control: [
          'Scroll to read. NEXT › goes on to the translation display.',
        ],
        changes: [
          'Normalization is a playback gain: the service turns each master up or down as it plays, and the file itself doesn’t change.',
          'So a heavily limited master can be played at the same loudness as a dynamic one, or quieter.',
          'Services differ on whether they turn quiet masters up.',
        ],
        teaches: [
          'Careful mastering still matters with normalization, because processing changes the dynamics and the sound.',
          'Headphones, small speakers, a car and a phone are checks; the accurate room decides.',
        ],
        tryThis: [
          'Think of a master you know that sounds crushed: on normalized playback, what did its loudness buy it?',
          'Name what each check system reveals: bass, width, a vanishing vocal.',
        ],
      },
    },
    {
      key: 'translate', title: 'As heard elsewhere', rack: true,
      guide: {
        intro: {
          learning: 'How the same master changes on headphones, a small speaker, a phone and in a car, and why those checks inform a decision without replacing the accurate room.',
          start: 'If ▶ DRAW MIX shows, tap it once. Then ride SYSTEM from Main monitors (treated room) to Phone speaker (mono) and compare the solid line with the dashed one.',
        },
        seeing: [
          'The dashed line is the program’s spectrum as mastered, measured from the mix. The solid line is a MODEL of how a playback system presents it.',
          'On the main monitors the two coincide, so only the solid line is drawn.',
          'The bezel shows SYSTEM and FOLD: STEREO, or MONO when the system sums left and right into one channel.',
        ],
        control: [
          'SYSTEM in the dock: Main monitors (treated room), Headphones, Small speaker, Phone speaker (mono), Car.',
          'If ▶ DRAW MIX shows, tap it first: it draws the mix once, with no sound.',
        ],
        changes: [
          'Small speaker: little below 150 Hz. Phone speaker: almost nothing below about 400 Hz, folded to MONO.',
          'Car: the bass lifted, the top shelved down. Headphones: a small lift in presence and bass.',
          'These are illustrative shapes, not measurements of any product: real systems vary.',
        ],
        teaches: [
          'Each system presents the same master differently: bandwidth, a mid bump, a mono fold.',
          'A bass line that carries on the main monitors can almost vanish on a phone, so a phone check shows whether the song still holds up without it.',
          'Translation checks inform the decision; they do not replace the accurate room.',
        ],
        tryThis: [
          'Ride SYSTEM to Phone speaker (mono): FOLD reads MONO and the solid line drops away below about 400 Hz.',
          'Ride to Car and compare the solid line with the dashed one at both ends.',
        ],
      },
    },
    {
      key: 'practice', title: 'Loudness decisions', rack: false,
      guide: {
        intro: {
          learning: 'How to read loudness numbers in context: the content, the destination, playback normalization and how the master translates to other systems.',
          start: 'Read the first card and decide which number or idea it is really about. Tap the option that fits, then read the explanation before NEXT CARD ›.',
        },
        seeing: [
          'A deck of loudness decisions, one card at a time. A line shows your place in the deck.',
          'Each card gives a loudness situation and asks what fits, using the numbers and ideas from this module.',
        ],
        control: DECK_CONTROL,
        changes: [
          'A fitting pick shows ✓ and the full explanation. Another pick tells you it isn’t the best fit, so you can choose again.',
          'Once the last card has an answer, this module is done, even if some first picks were wrong.',
        ],
        teaches: [
          'Reading loudness numbers in context: content, destination, normalization and translation.',
        ],
        tryThis: [
          'For each card, ask which of the four numbers it is really about.',
          'Read every explanation, right or wrong, and note whether it turns on the content, the destination, normalization or translation.',
        ],
      },
    },
    {
      key: 'review', title: 'Review', rack: false,
      guide: {
        intro: {
          learning: 'Why peak, true peak, integrated loudness and dynamic range answer four different questions, and why playback normalization can’t undo the limiting in a file.',
          start: 'Read the KEY IDEAS, then cover each KEY TERM’s definition and say it in your own words. Check the credit line at the foot before you tap NEXT ›.',
        },
        seeing: [
          'This page sums up Module 6, Loudness and translation. Start with KEY IDEAS, then the KEY TERMS.',
          'At the foot: the TAKEAWAY, and the credit line, which shows whether this module is done.',
        ],
        control: [
          'Scroll to read. NEXT › moves on to Module 7, Mastering for release: delivering the right file for each destination.',
        ],
        changes: [
          'The credit line reads credited once every PRACTICE card has an answer. After that it stays credited, even if you try a card again.',
        ],
        teaches: [
          'Peak, true peak, integrated loudness and dynamic range answer four questions: one instant, between samples, the whole piece, and peaks above average plus movement over time.',
          'Normalization is a playback gain that turns the whole file up or down; limiting is a permanent decision about dynamics, in the file.',
          'A louder version costs transients and movement, a cost you hear fairly only at matched level.',
        ],
        tryThis: [
          'Explain peak and true peak in one sentence each. Then say why a file limited to a −1.0 dBFS sample-peak ceiling can still read higher on TRUE PK.',
          'Cards still open? Tap ‹ PREV to go back to the PRACTICE step and answer them.',
        ],
      },
    },
  ],

  // ══ MODULE 7 · Mastering for release ═════════════════════════════════════
  release: [
    {
      key: 'contexts', title: 'Delivery contexts', rack: false,
      guide: {
        intro: {
          learning: 'Why every delivery destination has its own current requirements, and why the Red Book audio CD is the one format whose numbers stay fixed.',
          start: 'Read the five client briefs and tap a drawing to see what gets delivered. Then find the constant card and read the EP’s length and its size as Red Book WAV.',
        },
        seeing: [
          'Module 7 opens with IN THIS MODULE and its objective, then five client briefs. Each one has a drawing of what gets delivered.',
          'The briefs: Streaming / digital distribution, CD preparation, Vinyl preparation, Broadcast or picture-related delivery, and Alternate versions.',
          'One card stands apart from the briefs: the constant, the Red Book audio CD.',
        ],
        control: [
          'Scroll to read, and tap a drawing to see it larger. NEXT › takes you to the delivery checklist, where each brief gets its own list to confirm.',
        ],
        changes: [
          'Each brief asks for a different delivery. The facts and examples for each one sit beside the checklist on the next step.',
          'Because the CD format never changes, the constant card can give the four-track EP’s length and its exact size as Red Book WAV.',
        ],
        teaches: [
          'Every destination has its own current requirements, and every client has a request. You confirm both before exporting, instead of assuming one setting fits every release.',
          'Red Book CD audio is fixed: 16-bit, 44.1 kHz, two channels, about 74 minutes. With those numbers fixed, a WAV file’s size follows from its length alone.',
        ],
        tryThis: [
          'Read the constant card: the EP runs 16.8 minutes and takes 177 MB as Red Book WAV. Does it fit on one CD with room to spare?',
          'For each brief, guess what you’d need to confirm before exporting. Then check your guesses on the next step.',
        ],
      },
    },
    {
      key: 'checklist', title: 'Delivery checklist', rack: true,
      guide: {
        intro: {
          learning: 'Why a delivery starts from the destination’s current spec and the client’s request, and why sample-rate conversion comes first and dither comes last, once.',
          start: 'Ride DESTINATION to CD preparation and read its brief, then the FACT and EXAMPLE lines. Open CONFIRM and check each line once you understand it.',
        },
        seeing: [
          'The display shows a delivery sheet for the destination you choose: its sample brief and the lines to confirm. The sheet fills in as you check them.',
          'On the bezel, DESTINATION names the sheet and CONFIRMED turns green when every line is checked.',
          'In the notes: the brief, then FACT and EXAMPLE lines.',
        ],
        control: [
          'Ride DESTINATION in the dock to change the sheet, or tap it to pick from the list.',
          'Tap CONFIRM to open the checklist. Tap a line to check it; tap it again to clear it.',
        ],
        changes: [
          'Each destination has its own list and keeps its own check marks when you switch away and back.',
          'Read the two kinds of line differently. A FACT is fixed. An EXAMPLE is labeled as an example: verify it against the destination’s current spec, because it isn’t the rule.',
        ],
        teaches: [
          'A clean delivery means confirming the destination’s current spec and the client’s request, delivering exactly that, and writing down what you sent.',
          'Order matters: sample-rate conversion first, then dither to 16-bit as the very last step, once. Any change after dither would need dither again.',
        ],
        tryThis: [
          'Ride DESTINATION to CD preparation, open CONFIRM and check every line: CONFIRMED turns green. Which lines were FACTS, and which were EXAMPLES?',
          'Switch to Vinyl preparation and back. CD preparation still has its check marks, because each destination keeps its own.',
        ],
      },
    },
    {
      key: 'practice', title: 'Release decisions', rack: false,
      guide: {
        intro: {
          learning: 'How release decisions start from the destination’s current spec and the client’s request, instead of one setting remembered from another job.',
          start: 'Read the first card and ask what you’d check before deciding. Tap an option, then read the explanation, right or wrong. NEXT CARD › moves on.',
        },
        seeing: [
          'A deck of release decisions, one card at a time. Each card is a choice you’d face when delivering a release.',
          'A line on the card shows your place in the deck.',
        ],
        control: DECK_CONTROL,
        changes: [
          'A fitting pick shows ✓ and the full explanation. Another pick tells you it isn’t the best fit, so you can choose again.',
          'Once the last card has an answer, this module is done, even if some first picks were wrong.',
        ],
        teaches: [
          'A release decision starts from today’s spec for that destination, not from a setting you remember. Specs change, so an example is something to check, not a rule.',
          'One release can need several files, each made to its own destination’s spec.',
        ],
        tryThis: [
          'For each card, ask: what would I read before deciding — the spec, or the client?',
          'Read every explanation, right or wrong. Notice which part of the spec, or which client request, decided each answer.',
        ],
      },
    },
    {
      key: 'review', title: 'Review', rack: false,
      guide: {
        intro: {
          learning: 'Why each destination has current requirements to confirm, why sample-rate conversion comes before dither, and why metadata and documentation are part of the delivery.',
          start: 'Read the KEY IDEAS and KEY TERMS for release. Then say the order out loud: sample-rate conversion, then dither, once, last. Check the credit line before you tap NEXT ›.',
        },
        seeing: [
          'This page sums up Module 7, Mastering for release: KEY IDEAS, then KEY TERMS.',
          'At the foot: the TAKEAWAY, and the credit line, which shows whether this module is done.',
        ],
        control: [
          'Scroll to read. NEXT › moves on to Module 8, Putting it all together: one fictional release, from the brief to the final check.',
        ],
        changes: [
          'The credit line reads credited once every PRACTICE card has an answer. After that it stays credited, even if you try a card again.',
        ],
        teaches: [
          'Each destination has current requirements. FACTS, like the Red Book CD format, change rarely; EXAMPLES are checked against the spec of the day.',
          'Sample-rate conversion comes first; dither comes once, as the last step.',
          'Metadata and documentation are part of the delivery: the files plus the information that says what they are.',
        ],
        tryThis: [
          'Say the order without looking: sample-rate conversion, then dither, once, last. Then say why dither can’t come earlier.',
          'Cards still open? Tap ‹ PREV to go back to the PRACTICE step and answer them.',
        ],
      },
    },
  ],

  // ══ MODULE 8 · Putting it all together ═══════════════════════════════════
  project: [
    {
      key: 'brief', title: 'The brief and the mix files', rack: false,
      guide: {
        intro: {
          learning: 'Why a mastering job starts by reading the brief and inspecting the mix files, and how the client’s words set limits before any processing.',
          start: 'Read the client email for Night Signal — EP — Low Orbit. Then go through THE MIX FILES, AS INSPECTED and compare each track’s loudness estimate and true peak.',
        },
        seeing: [
          'Module 8 opens with IN THIS MODULE and its objective, then the brief: Night Signal — EP — Low Orbit (fictional), from a client email.',
          'Below it, THE MIX FILES, AS INSPECTED: four tracks with lengths and notes.',
          'Each track shows its integrated loudness estimate and true peak, tinted against 0 dBTP, the top of the digital scale.',
        ],
        control: [
          'Scroll to read. NEXT › goes on to the track decisions, one card per track.',
        ],
        changes: [
          'Nothing moves on this page. Every later step in Module 8 answers part of this brief, so read it closely now.',
        ],
        teaches: [
          'A mastering job starts by reading the brief and inspecting the files, before any processing. That’s where you learn what the client wants and what’s already in the files.',
          'The client’s words set the limits: one record, a quiet song kept quiet, and instrumentals for sync (music placed under film, TV or ads).',
        ],
        tryThis: [
          'Compare Tide Table at −19.8 LUFS with Night Signal at −12.6: a 7.2 LU gap. The client wants it kept, so the quiet song stays quiet.',
          'Find the track whose true peak sits closest to 0 dBTP: Night Signal, at −0.4. Why does that matter before you add any level?',
        ],
      },
    },
    {
      key: 'problems', title: 'What can mastering address?', rack: false,
      guide: {
        intro: {
          learning: 'How to sort each track’s problem by its reach — the whole program, one element inside it, or something still unknown — with a real brief in hand.',
          start: 'Read the first track’s card and recall its note from the previous step. Pick a mastering adjustment, a mix revision, or more information from the client, then read the explanation.',
        },
        seeing: [
          'One card per track of the EP. Each asks which next step fits: a mastering adjustment, a mix revision, or more information from the client.',
          'A line on the card shows your place in the deck.',
        ],
        control: DECK_CONTROL,
        changes: [
          'A fitting pick shows ✓ and the full explanation. Another pick tells you it isn’t the best fit, so you can choose again.',
          'Module 8 is done once these four track decisions are answered and every line of the final QC checklist is checked.',
        ],
        teaches: [
          'The question from Module 1, now on a real project: does a problem touch the whole stereo program, one element inside it, or is something still unknown?',
          'Only the mix can move one part against another; mastering acts on everything in the file at once.',
        ],
        tryThis: [
          'Reread each track’s note on the previous step before answering its card.',
          'Ask for each: one element in one section, or the whole program?',
        ],
      },
    },
    {
      key: 'checks', title: 'Listening checks and tools', rack: false,
      guide: {
        intro: {
          learning: 'How the brief decides which listening checks and tools a release needs, and which moves would break something the client asked to protect.',
          start: 'Keep the brief in mind and check (☑) only the lines this EP needs. When you’ve decided every line, tap REVEAL THE KEY › and read the reasons.',
        },
        seeing: [
          'A checklist of listening checks and tools for this EP. Each line shows ☐ until you check it.',
          'At the foot, a card asks Ready? and offers REVEAL THE KEY ›.',
        ],
        control: [
          'Tap a line to check it (☑); tap it again to clear it. Your check marks are kept.',
          'When you’ve decided every line, tap REVEAL THE KEY › to see the key and a reason under each line.',
        ],
        changes: [
          'After the reveal, each line where your choice differs from the key is marked Needed: or Not this:, with the reasoning.',
          'The card counts the lines that agree with the key. A line agrees when it’s checked where the EP needs it, or left clear where it doesn’t.',
        ],
        teaches: [
          'The brief decides the checks: some serve what this EP needs, and some would break what the client protected.',
          'Leaving a check or tool out on purpose is a decision too. The reasoning behind each line matters more than the score.',
        ],
        tryThis: [
          'Check your list with the brief open in your mind, then reveal and read only the lines that differ.',
          'Look for any line that would undo something the client asked to keep.',
        ],
      },
    },
    {
      key: 'sequence', title: 'Sequence and delivery plan', rack: true,
      guide: {
        intro: {
          learning: 'How order, gaps, fades and crossfades shape the way a release plays, and why a loudness step the client asked for is framed, not fixed.',
          start: 'At OPENER→QUIET with GAP at 2.0 s, read MAX STEP and TOTAL. Then switch ORDER to QUIET MID and watch MAX STEP turn amber.',
        },
        seeing: [
          'The display shows the running order on a real time scale. Block length is track length, height and color show loudness, and the wedge is the fade-out. Below, the three transitions are zoomed in.',
          'On the bezel: ORDER, GAP, MAX STEP (the largest loudness step between neighbors) and TOTAL.',
          'THE DELIVERY PLAN is in the notes.',
        ],
        control: [
          'GAP fader: 0 to 6 s of silence between tracks, in 0.5 s steps. It starts at 2.0 s.',
          'ORDER: Opener first, quiet song last (OPENER→QUIET); Quiet song in the middle (QUIET MID); Build to the opener (BUILD UP).',
          'CROSSFADE overlaps neighbors by 2 s with no gap. GAP is locked while it’s on.',
        ],
        changes: [
          'MAX STEP turns amber above 6 LU. TOTAL grows with each gap and shrinks with a crossfade.',
          'In the zoomed strip, the gap, the fade wedge and a crossfade overlap all move with the fader.',
          'The quiet song makes a step the client asked for, so the gap around it is your decision.',
        ],
        teaches: [
          'Sequencing shapes a release: order, gaps, fades and the loudness steps between tracks.',
          'A deliberate step is kept and framed by the order and the time around it; an accidental one is fixed.',
          'The delivery plan: digital first, CD a month later, vinyl only after asking the cutting engineer.',
        ],
        tryThis: [
          'At OPENER→QUIET with GAP 2.0 s: MAX STEP reads 5.9 LU and TOTAL 16:51. Switch to QUIET MID: 7.2 LU, in amber.',
          'Turn CROSSFADE on: GAP reads XF and TOTAL drops to 16:39. Would you want the quiet song to start under a crossfade, or after silence?',
        ],
      },
    },
    {
      key: 'qc', title: 'Final QC checklist', rack: false,
      guide: {
        intro: {
          learning: 'Why quality control happens on the exported files you send, not on the session, and why a job ends with a usable delivery and a note of what was sent.',
          start: 'Read each of the nine QC lines and check (☑) one only when you can say how you’d check it on a real file. Then read the status card.',
        },
        seeing: [
          'The final QC checklist: nine lines about the exported files. Each shows ☐ until you check it.',
          'Under it: a status card, then KEY TERMS, the TAKEAWAY and the module’s credit line.',
        ],
        control: [
          'Tap a line to check it (☑); tap it again to clear it. Your check marks are kept.',
          'On this step the strip’s NEXT › reads FINISH ›. It opens the what’s-left screen for the whole lab.',
        ],
        changes: [
          'With every line checked, the status card reads QC complete — or Delivered, once the four track decisions are answered too.',
          'At that moment Module 8 is done, and its credit line reads credited.',
        ],
        teaches: [
          'Quality control happens on the files you send, not on the session that made them, because an export can differ from what you heard while working.',
          'A mastering job ends with a delivery somebody can use, and a note of what was sent.',
        ],
        tryThis: [
          'Check each line only when you can say how you would check it on a real file.',
          'If the card says decisions are still open, press ‹ PREV three times to reach step 2, What can mastering address?, and answer them.',
        ],
      },
    },
  ],
};

/** The what's-left screen (FINISH › on Module 8's last step, or the strip's
 *  readout → WHAT'S LEFT ›). Every line is true of MasteringLabScreen's end
 *  branch: LabEndScreen in "progress" mode (rows read ✓ DONE), one row per
 *  module, a row opening the step that earns it (MASTERING_CREDIT_STEP /
 *  MASTERING_PROJECT_QC_STEP), PRACTICE AGAIN → Module 1 step 1 with nothing
 *  cleared, DONE · BACK TO LABS → safeGoBack. A module is done once every
 *  decision on it has an answer (Module 8: and every QC line ticked). */
export const MASTERING_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'A look back over the whole mastering path — what a master can and can’t change, the two roles, room, tools, workflow, loudness and delivery — and what’s still open.',
    start: 'Read the rows still listed: each one names what finishes that module. Tap a row to open that step, or tap REVIEW ▾ to reopen a module you found hard.',
  },
  seeing: [
    'The title tells you where you stand: WHAT’S LEFT while modules remain, LAB COMPLETE once every module is done. If your saved progress can’t be loaded, it reads YOUR PROGRESS.',
    'Each module still to do has a row naming what finishes it: the decisions on its PRACTICE step, or for Module 8, the four track decisions and the QC checklist.',
    'Modules you’ve finished fold into one ✓ DONE line; REVIEW ▾ lists them.',
  ],
  control: [
    'Tap a module’s row to open the step that finishes it: its PRACTICE deck, or Module 8’s track decisions (its QC checklist once those four are saved). A finished module opens at its first step.',
    'PRACTICE AGAIN FROM THE START opens Module 1 at its first step. Your saved answers stay, and no finished module is undone.',
    'DONE · BACK TO LABS leaves the lab.',
    'On the strip, ‹ PREV takes you back to the step you came from: your answers and check marks are kept, its other settings start fresh. ⏮ opens Module 1. Tap the WHAT’S LEFT ▾ readout for the list of modules.',
  ],
  changes: [
    'A module is done (inside it, the word is “credited”) once each of its decisions has an answer, right or wrong. Module 8 also needs every QC line checked.',
    'START OVER (PRACTICE), below the module list, asks first. Then it clears your answers and Module 8 check marks and opens Module 1. Finished modules stay done.',
    'Progress is kept on this device. Signed out, the line under the title says what is kept.',
  ],
  teaches: [
    'Mastering is the last listening, decision and delivery stage. It works on the finished stereo program, never on the separate tracks inside it.',
    'Every mastering judgment depends on the room, a moderate monitoring level and a comparison at matched loudness.',
    'A master is finished only when the right files reach the destination and pass a final check on the files themselves.',
  ],
  tryThis: [
    'If a module is still listed, tap its row: it opens on a step that finishes it (Module 8 needs two). Then tap the strip’s readout and WHAT’S LEFT › to come back here.',
    'If a ✓ DONE line shows, tap REVIEW ▾ and reopen a module you found hard. It opens at its first step, so you meet the whole idea again.',
  ],
};

/** The guide for step `step` of `moduleId` (undefined past the end). */
export function masteringStepGuide(moduleId: MasteringModuleId, step: number): MasteringGuideStep | undefined {
  return MASTERING_GUIDE_STEPS[moduleId]?.[step];
}
