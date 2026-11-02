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
  'Tap an option to answer the card. Your FIRST answer on each card is the one recorded; a retry is explained, never penalized.',
  '‹ PREV CARD and NEXT CARD › move between cards. The deck opens on the first card not yet answered.',
  'NEXT › on the strip moves on at any time; you can come back.',
];

export const MASTERING_GUIDE_STEPS: Record<MasteringModuleId, readonly MasteringGuideStep[]> = {
  // ══ MODULE 1 · What mastering is ═════════════════════════════════════════
  what: [
    {
      key: 'fits', title: 'Where mastering fits', rack: true,
      guide: {
        seeing: [
          'IN THIS MODULE and its objective sit at the top of the notes on this first step.',
          'The display: the project chain — RECORDING, EDITING, MIXING, MASTERING, RELEASE — with the chosen stage lit.',
          'The bezel: STAGE (its place in the chain), NAME, and WORKS ON — what that stage acts on.',
          'The header has two ⓘ keys: the first opens this lab’s accuracy note, the far-right one explains the screen.',
        ],
        control: [
          'STAGE fader in the dock: REC, EDIT, MIX, MASTER, RELEASE. It starts on MASTER.',
          'The strip: ⏮, ‹ PREV, the readout (tap it for the list of modules), NEXT ›. PREV and NEXT walk the steps and roll into the next module.',
          'HIDE DISPLAY and FULL SCREEN sit on the bezel. The ‹ at the top leaves the lab. “When to bring in a pro ›” under the strip opens a short note.',
        ],
        changes: [
          'WORKS ON reads TRACKS for recording, editing and mixing — every part is still separate.',
          'At MASTERING it reads STEREO: one finished file with every element inside it.',
          'At RELEASE it reads FILES: the delivered masters.',
        ],
        teaches: [
          'Mastering is the last listening, decision-making and delivery stage before release.',
          'It acts on the whole program at once, so it cannot rebalance the tracks inside a stereo mix.',
          'Next in this module: what mastering can and cannot do, then a matched-level listening test.',
        ],
        tryThis: [
          'Ride STAGE to MIX: WORKS ON reads TRACKS. Step to MASTER: it reads STEREO — the vocal is no longer its own handle.',
          'Ride to RELEASE: WORKS ON reads FILES.',
        ],
      },
    },
    {
      key: 'can', title: 'What mastering can and cannot do', rack: false,
      guide: {
        seeing: [
          'A reading page in three parts: WHAT MASTERING CAN ADDRESS, WHAT IT CANNOT DO, THE PURPOSE OF OBJECTIVITY.',
          'Four things it can address: overall tonal balance, dynamics and level, consistency across a collection, sequencing and release preparation.',
        ],
        control: [
          'Scroll to read. NEXT › at the foot of the page goes on to the LISTEN step.',
        ],
        changes: [
          'Nothing moves on this page: it sets up the rule the next step tests by ear.',
          'An EQ move at the vocal’s frequencies moves everything that lives there — which is why one element needs a revised mix (or stems, by agreement).',
        ],
        teaches: [
          'Mastering shapes the whole program: tone, dynamics, level, consistency, order and delivery.',
          'A stereo master gives no independent control over the vocal, drums or bass.',
          'Objectivity is a method: listen first, compare at matched level, verify with a meter, decide.',
        ],
        tryThis: [
          'Name one problem from your own listening that mastering could fix, and one that needs a mix revision.',
          'Hold the method in mind — listen, match, verify, decide — the next step uses it.',
        ],
      },
    },
    {
      key: 'listen', title: 'Louder is not better', rack: true,
      guide: {
        seeing: [
          'The display: the waveform of the version on the glass, a gain-reduction strip, and the limiter faceplate — INPUT, CEILING, RELEASE, GR, or BYP when nothing is processed.',
          'The bezel: PEAK, TRUE PK, LUFS, PLR (peak above loudness) and MATCH dB.',
          'The badge: an offline render with estimated meters, heard through an uncalibrated phone output.',
        ],
        control: [
          '▶ MIX plays the mix as delivered; ▶ LOUDER plays the same mix driven 8 dB into a peak limiter; ■ STOP stops. Tapping the display plays or stops too.',
          'MATCH LEVEL (on to start) plays both at the quieter one’s loudness.',
          'The notes show what is playing and the measured numbers once both have rendered.',
        ],
        changes: [
          'LOUDER’s limiter has its ceiling at −0.3 dBFS. It raises LUFS and shrinks PLR: less distance from peak to average.',
          'With MATCH on, LOUDER is turned down by the difference in loudness (in LU, 1 LU = 1 dB), so only the dynamics differ. MATCH dB shows by how much.',
          'TRUE PK can read over 0 dBTP here on purpose: this limiter watches samples only, with no look-ahead.',
        ],
        teaches: [
          'Louder is not better — only louder. Extra level makes a version seem fuller and brighter.',
          'Limiting trades transients and movement for density; sometimes the right trade, never automatically.',
          'Fair comparisons happen at matched loudness.',
        ],
        tryThis: [
          'With MATCH LEVEL on, play THE MIX, then LOUDER, and listen to the kick and snare hits and the space between them.',
          'Compare the PLR cell for each version: LOUDER’s is smaller.',
          'Before switching MATCH off, turn your volume down: the warning card says how far LOUDER steps up.',
        ],
      },
    },
    {
      key: 'practice', title: 'Mix issue or mastering issue?', rack: false,
      guide: {
        seeing: [
          'A deck of situations, one card at a time, with a line counting your place in the deck.',
          'Each card offers three next steps: Mastering adjustment, Mix revision, or More information from the client.',
        ],
        control: DECK_CONTROL,
        changes: [
          'A fitting pick shows ✓ and the full explanation. Another pick says it is not the best fit; choose again.',
          'The module is credited the moment the last card is answered — a wrong first pick still counts.',
        ],
        teaches: [
          'Sorting a problem by its reach: the whole stereo program, one element inside it, or something still unknown.',
          'Asking the client for information is a legitimate, professional answer.',
        ],
        tryThis: [
          'For each card, ask: does this touch the whole program, one element inside it, or is something unknown?',
          'Read every explanation, right or wrong — the explanation is the point.',
        ],
      },
    },
    {
      key: 'review', title: 'Review', rack: false,
      guide: {
        seeing: [
          'KEY IDEAS: five lines that sum up the module.',
          'KEY TERMS: Mastering, Stereo master, Mix revision.',
          'At the foot: the TAKEAWAY, and a line saying whether this module is credited and what earns it.',
        ],
        control: [
          'Scroll to read. NEXT › moves on to Module 2, Two roles. The readout’s list jumps to any module.',
        ],
        changes: [
          'The credit line updates as the PRACTICE cards are answered: once all are in, the module reads credited.',
          'Credit is never removed; START OVER (PRACTICE), at the foot of the readout’s list, clears answers but keeps credit.',
        ],
        teaches: [
          'Mastering sits between mixing and release and works on the whole program.',
          'It cannot rebalance elements inside a stereo mix; that is a mix revision.',
          'Next: who controls what — the mixing and mastering roles.',
        ],
        tryThis: [
          'Cover the definitions and say each KEY TERM in your own words.',
          'If the credit line says cards are still open, ‹ PREV returns to the PRACTICE step.',
        ],
      },
    },
  ],

  // ══ MODULE 2 · Two roles ═════════════════════════════════════════════════
  roles: [
    {
      key: 'table', title: 'Two jobs, side by side', rack: false,
      guide: {
        seeing: [
          'IN THIS MODULE and its objective, then a two-column table: MIXING ENGINEER and MASTERING ENGINEER, five rows.',
          'Two notes: The roles can overlap, and Mastering is not simply "making it louder".',
        ],
        control: [
          'Scroll to read. NEXT › goes on to the EXPLORE step.',
        ],
        changes: [
          'Read across each row: the same topic, seen from each job.',
          'Even when one person does both, the listening perspective and the control available change.',
        ],
        teaches: [
          'The mixer shapes relationships among tracks; the mastering engineer evaluates and prepares the finished program.',
          'Independent control of an element belongs to the mix — or to stems, by agreement.',
        ],
        tryThis: [
          'For each row, picture a real task — raising a snare, sequencing eight songs — and decide which column it belongs in.',
          'Read The roles can overlap: what changes even when one person does both jobs?',
        ],
      },
    },
    {
      key: 'control', title: 'Who has control of that?', rack: true,
      guide: {
        seeing: [
          'The display: a signal flow from the individual tracks, through the mix bus, to the stereo master and the delivery.',
          'The lit stage is where the request is normally addressed; its color says whose job it is, and a strip spells out the verdict.',
          'The bezel: REQUEST (short name) and ADDRESSED BY (MIXING, MASTERING or EITHER).',
        ],
        control: [
          'REQUEST in the dock: ride it, or tap it for the full list, A CLIENT REQUEST. Ten requests, from VOCAL and SNARE to FORMAT, WIDTH, BUS COMP and FADES.',
          'The card in the notes gives the full request and why it belongs where it does.',
        ],
        changes: [
          'Element requests (a vocal level, a snare tone) light the tracks: only the mix can move one part against another.',
          'Whole-program requests (brightness, level, order, format) light the master or delivery stage.',
          'Some read EITHER: both roles can act, with different reach.',
        ],
        teaches: [
          'Where in the signal flow a request can be honestly addressed decides whose job it is.',
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
        seeing: [
          'A deck of role questions, one card at a time, with a line counting your place in the deck.',
          'Each card offers three answers.',
        ],
        control: DECK_CONTROL,
        changes: [
          'A fitting pick shows ✓ and the explanation; another pick says it is not the best fit.',
          'The module is credited the moment the last card is answered.',
        ],
        teaches: [
          'Telling a mastering perspective (the program, the collection) from a mixing one (relationships inside one mix).',
          'Loudness is one decision among many, never the definition of mastering.',
        ],
        tryThis: [
          'Before answering, ask: is this about the parts of one mix, or the finished program as a whole?',
          'Read each explanation, even after a right answer.',
        ],
      },
    },
    {
      key: 'review', title: 'Review', rack: false,
      guide: {
        seeing: [
          'KEY IDEAS and KEY TERMS for the two roles.',
          'At the foot: the TAKEAWAY and the module’s credit line.',
        ],
        control: [
          'Scroll to read. NEXT › moves on to Module 3, Room and monitoring.',
        ],
        changes: [
          'The credit line reads credited once every PRACTICE card is answered. Credit is never removed.',
        ],
        teaches: [
          'The mixer works inside the session; the mastering engineer works on the finished program.',
          'Translation, consistency, technical quality and delivery are the mastering focus.',
          'Next: the room and monitoring that every judgment depends on.',
        ],
        tryThis: [
          'Say each KEY TERM in your own words before reading its definition.',
          'Cards still open? ‹ PREV returns to the PRACTICE step.',
        ],
      },
    },
  ],

  // ══ MODULE 3 · Room and monitoring ═══════════════════════════════════════
  room: [
    {
      key: 'room', title: 'Room and listening environment', rack: false,
      guide: {
        seeing: [
          'IN THIS MODULE and its objective, then A TREATED ROOM: one room from above, an illustration, not a measurement.',
          'ROOM DESIGN AND ACOUSTIC CONTROL: room noise, reflections, low-frequency behavior, listening position, coloration.',
          'MAIN MONITORS AND SECONDARY CHECKS: the main pair, a second system, headphones.',
        ],
        control: [
          'Scroll to read; tap the drawing to see it larger. NEXT › goes on to monitoring level.',
        ],
        changes: [
          'The amber pads in the drawing sit at the first-reflection points; corner traps handle the bass.',
          'The listener sits on the center line, at the third corner of an equilateral triangle with the monitors. Where that falls front to back is found by measurement in each room.',
        ],
        teaches: [
          'The room is the last stage of the monitoring chain, and the first thing to get right.',
          'Low frequencies are the hardest part of a room, and the most likely to mislead a tonal decision.',
          'The main monitors make the decisions; a second system and headphones check them.',
        ],
        tryThis: [
          'Find the amber reflection pads in the drawing and trace a reflection from a monitor to the listener.',
          'Think of your own listening room: which of the five room points is its weakest?',
        ],
      },
    },
    {
      key: 'level', title: 'Monitoring level and listening habits', rack: true,
      guide: {
        seeing: [
          'The display: a model of how the ear’s balance shifts with level, as a curve against 1 kHz, with ghost curves at 65, 83 and 95 dB.',
          'The bezel: SPL (C), BASS and TREBLE (the apparent shift), PER DAY (the NIOSH daily limit) and READING.',
          'The scale’s orange band starts where the daily exposure limit is approached.',
        ],
        control: [
          'MONITOR fader in the dock: 55 to 100 dB SPL (C, slow). It starts at 83 dB.',
          'The notes explain the reading and the habits: one moderate level, measured with a meter.',
        ],
        changes: [
          'Lower levels: the ear loses bass (and a little treble) faster than 1 kHz, so the same file reads thin. Louder reads full.',
          'PER DAY is 8 h+ below 85 dB and halves every 3 dB above it.',
          'READING: QUIET below 70, GOOD to 83, HOT from 84 to 88, UNSAFE from 89.',
        ],
        teaches: [
          'A tonal decision made at a different level is partly a decision about the level.',
          'One repeatable, moderate monitoring level protects comparisons, focus and hearing.',
          'Measure the level with a calibrated meter. A room meter cannot read headphone level, and headphones often run louder than they feel.',
        ],
        tryThis: [
          'Ride MONITOR down to 65 dB: BASS reads −5.3 dB and TREBLE −1.1 dB — the same file now sounds thin.',
          'Ride up to 88 dB: PER DAY reads 4 h, READING HOT. At 91 dB: 2 h, UNSAFE. Then bring it back to 83.',
        ],
      },
    },
    {
      key: 'path', title: 'Build a monitoring path', rack: true,
      guide: {
        seeing: [
          'The display: the chain you build, device by device; the next device drawn faintly, marked NEXT ›. Each cable is drawn by what it carries.',
          'A verdict on the glass: COMPLETE, WORKS · MINIMAL, or CHECK THE CHAIN.',
          'The bezel: STAGES (slots used), TO ADD, and PATH (EMPTY, CHECK, MINIMAL, COMPLETE).',
        ],
        control: [
          'DEVICE in the dock: DAW, DAC, MON CTL, AMP, PASSIVE or ACTIVE, each with a one-line note.',
          '+ CONNECT adds the chosen device (✓ PLACED if it is already in; SLOTS FULL at five). The choice then moves to the next unplaced device by itself.',
          '‹ UNDO removes the last device; CLEAR empties the chain.',
        ],
        changes: [
          'The notes list what is wrong or missing, in plain words.',
          'COMPLETE needs a monitor controller and at least four of the five jobs: playback, conversion, level, amplification, sound.',
          'An amplifier in front of active monitors reads CHECK: they already contain their own.',
        ],
        teaches: [
          'A monitoring path is an order of jobs: playback, conversion, level control, amplification, loudspeakers.',
          'Real systems vary in how boxes share those jobs; the order stays the same.',
          'Power order: amplifiers on last, off first.',
        ],
        tryThis: [
          'Press + CONNECT five times: the choice walks DAW, DAC, MON CTL, AMP, PASSIVE and PATH reads COMPLETE.',
          'CLEAR, then connect DAW, DAC, MON CTL, AMP and choose ACTIVE last: PATH reads CHECK. Read the note to see why.',
        ],
      },
    },
    {
      key: 'practice', title: 'Room and monitoring decisions', rack: false,
      guide: {
        seeing: [
          'A deck of room and monitoring decisions, one card at a time, with a line counting your place in the deck.',
        ],
        control: DECK_CONTROL,
        changes: [
          'A fitting pick shows ✓ and the explanation; another pick says it is not the best fit.',
          'The module is credited the moment the last card is answered.',
        ],
        teaches: [
          'Applying the room, level and monitoring-path ideas to real decisions.',
          'Headphones and small speakers are checks, not the reference.',
        ],
        tryThis: [
          'For each card, ask what reached the ears — the room, the level, or the path.',
          'Read every explanation, right or wrong.',
        ],
      },
    },
    {
      key: 'review', title: 'Review', rack: false,
      guide: {
        seeing: [
          'KEY IDEAS and KEY TERMS for the room and monitoring.',
          'At the foot: the TAKEAWAY and the module’s credit line.',
        ],
        control: [
          'Scroll to read. NEXT › moves on to Module 4, Mastering equipment and tools.',
        ],
        changes: [
          'The credit line reads credited once every PRACTICE card is answered. Credit is never removed.',
        ],
        teaches: [
          'Judgment is only as good as the room and the level it was made at.',
          'One moderate, repeatable monitoring level, measured with a meter.',
          'Next: the tools, grouped by the decisions they serve.',
        ],
        tryThis: [
          'Say the five jobs of a monitoring path in order without looking.',
          'Cards still open? ‹ PREV returns to the PRACTICE step.',
        ],
      },
    },
  ],

  // ══ MODULE 4 · Mastering equipment and tools ═════════════════════════════
  tools: [
    {
      key: 'groups', title: 'Tools by the decision they serve', rack: false,
      guide: {
        seeing: [
          'IN THIS MODULE and its objective, then seven cards — one per tool group, each with the decision it serves.',
          'From Playback and editing (hear it, cut it, export it) to Analog equipment (optional).',
        ],
        control: [
          'Scroll to read. NEXT › goes on to the tool shelf.',
        ],
        changes: [
          'Nothing moves here: the groups become the shelf on the next step.',
        ],
        teaches: [
          'There is no required chain: order and gear vary by engineer, room and project.',
          'What stays constant is the set of decisions a session makes — so tools are grouped by those.',
        ],
        tryThis: [
          'For each group, name a problem you would reach for it to solve.',
          'Notice which group exists only to verify: Meters and analysis.',
        ],
      },
    },
    {
      key: 'shelf', title: 'The tool shelf', rack: true,
      guide: {
        seeing: [
          'The display: the view a mastering engineer looks at for the chosen tool group — an EQ curve, a dynamics curve, a stereo picture, a meter.',
          'The bezel: TOOL, the amount (TILT, RATIO, WIDTH, LEVEL…), and a second number where it adds one — OUT AT 0 IN, CORRELATION or LUFS (I).',
          'The badge says MODEL, or MEASURED when the METERS view reads the rendered mix.',
        ],
        control: [
          'The amount fader (its name follows the tool). TOOL in the dock picks the group: EDITING, MONITORS, EQ, DYNAMICS, STEREO, METERS, ANALOG.',
          'Changing TOOL resets its amount: EQ to ±1.5 dB brighter, DYNAMICS to 10.5 : 1, STEREO to ×1.00.',
          '▶ DRAW MIX appears for EDITING and METERS: it renders the client’s mix once, with no sound, to draw it.',
        ],
        changes: [
          'EQ and ANALOG tilt ± the same amount at both ends, up to ±3.0 dB. DYNAMICS ratio runs 1.0 : 1 to 20.0 : 1 against a −12 dB threshold.',
          'STEREO width runs ×0.00 to ×2.00; wider means lower correlation.',
          'METERS: LEVEL is a plain gain, ±8 dB, and every loudness number shifts with it.',
        ],
        teaches: [
          'Each decision has its own display: EQ for tone, dynamics for density and peaks, stereo for width (with a mono check), meters to verify.',
          'Meters confirm a decision made by listening; they do not make it.',
        ],
        tryThis: [
          'Pick STEREO and ride WIDTH from ×1.00 up to ×2.00: CORRELATION falls from 0.60 to 0.00.',
          'Pick DYNAMICS: RATIO 10.5 : 1 turns a 0 dB input into −10.9 dB. Ride RATIO down to 1.0 : 1 and it reads 0.0 dB.',
        ],
      },
    },
    {
      key: 'analog', title: 'Analog and digital', rack: false,
      guide: {
        seeing: [
          'ANALOG EQUIPMENT (OPTIONAL): What it is, What it is not, How to compare honestly.',
        ],
        control: [
          'Scroll to read. NEXT › goes on to the PRACTICE step.',
        ],
        changes: [
          'Nothing moves here: the page sets the rule for comparing any two tools.',
        ],
        teaches: [
          'Analog gear is optional — neither a requirement nor a mark of quality.',
          'Analog and digital differ in recall, precision, workflow and color, not in rank.',
          'Compare them the same way as everything: same goal, matched level, bypass, a second system.',
        ],
        tryThis: [
          'List what you would match before comparing any two tools: goal, level, bypass, a second system.',
          'Think of one reason to choose each: recall for digital, a particular color for analog.',
        ],
      },
    },
    {
      key: 'practice', title: 'Choose a tool for the job', rack: false,
      guide: {
        seeing: [
          'A deck of listening goals, one card at a time, each asking which tool — or which next check — might help.',
          'Options sit two across on this deck.',
        ],
        control: DECK_CONTROL,
        changes: [
          'A fitting pick shows ✓ and the explanation; another pick says it is not the best fit.',
          'The module is credited the moment the last card is answered.',
        ],
        teaches: [
          'Choosing a tool by the goal, not a preset — and knowing when the next move is a check, not a process.',
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
        seeing: [
          'KEY IDEAS and KEY TERMS for the tools.',
          'At the foot: the TAKEAWAY and the module’s credit line.',
        ],
        control: [
          'Scroll to read. NEXT › moves on to Module 5, The mastering workflow.',
        ],
        changes: [
          'The credit line reads credited once every PRACTICE card is answered. Credit is never removed.',
        ],
        teaches: [
          'Tools grouped by decision; no required chain.',
          'Choose by the goal, confirm by listening at matched level, verify with a meter.',
          'Next: the order a typical session runs in.',
        ],
        tryThis: [
          'Name the seven tool groups from memory.',
          'Cards still open? ‹ PREV returns to the PRACTICE step.',
        ],
      },
    },
  ],

  // ══ MODULE 5 · The mastering workflow ════════════════════════════════════
  workflow: [
    {
      key: 'flow', title: 'A common workflow', rack: true,
      guide: {
        seeing: [
          'IN THIS MODULE and its objective sit at the top of the notes.',
          'The display: a common mastering workflow in seven stages, one lit. The badge says order and scope vary.',
          'The bezel: FLOW (its place) and NAME. The card in the notes gives that stage’s detail.',
        ],
        control: [
          'FLOW fader in the dock: INSPECT, LISTEN, DECIDE, CHANGE, SEQUENCE, DELIVER, QC.',
        ],
        changes: [
          'Each stage lights on the glass and its card explains what happens there.',
          'Receive and inspect comes first: a peak meter and a DC-offset check before monitoring at level.',
          'Quality-check the exports comes last: on the files themselves.',
        ],
        teaches: [
          'A typical session: receive and inspect, listen, decide whether it is ready, change, sequence, deliver, check.',
          'Order and scope vary by project; the habits do not.',
        ],
        tryThis: [
          'Ride FLOW to INSPECT and read its card: what happens before anything is played at level?',
          'Ride to CHANGE: every change is compared with the unprocessed mix at matched level.',
        ],
      },
    },
    {
      key: 'inspect', title: 'Inspect the delivery', rack: false,
      guide: {
        seeing: [
          'An inspection sheet for a mix that has arrived for the EP: file, approved version, format, sample peak, DC offset, the mixer’s notes, references, delivery requirements.',
          'Flagged rows explain what a careful first look turns up.',
          'A Decide card: three questions back to the client.',
        ],
        control: [
          'Scroll to read. NEXT › goes on to the LISTEN step.',
        ],
        changes: [
          'Each flag names a problem and the question it raises — before a note is heard at level.',
        ],
        teaches: [
          'Inspection comes before processing: version, headroom, a limiter on the mix bus, and the real delivery spec.',
          'Three questions to the client cost less than a master of the wrong file.',
        ],
        tryThis: [
          'Find the version mismatch: the file says v7, the email approved v8.',
          'Find the row that should be checked before monitoring at level, and read why.',
        ],
      },
    },
    {
      key: 'listen', title: 'A considered change, matched', rack: true,
      guide: {
        seeing: [
          'The display: the waveform of the version on the glass and the EQ faceplate — TILT split between the 200 Hz and 2.5 kHz shelves, the +2 dB OUTPUT trim, the SAFETY ceiling. BYPASS shows it bypassed (BYP).',
          'The bezel: PEAK, TRUE PK, LUFS, PLR and MATCH dB.',
        ],
        control: [
          'TILT fader: −4.0 to +4.0 dB end to end, in 0.5 dB steps. It starts at +1.5.',
          'MATCH LEVEL (on to start), ▶ BYPASS, ▶ WITH EQ, ■ STOP. Tapping the display plays or stops too.',
          'With MATCH on, a moved fader re-renders and replays the sounding version.',
        ],
        changes: [
          'WITH EQ adds the tilt plus a +2 dB output trim — the way a “better” setting usually sneaks in louder. The −0.3 dBFS SAFETY ceiling holds its peaks.',
          'A tilt moves the LUFS reading up or down, depending on where the mix’s energy sits.',
          'With MATCH on, whichever version reads louder is turned down by the difference, so only the tone is judged.',
        ],
        teaches: [
          'Make a change for a reason you can name, then bypass, match and listen again.',
          'A change you keep is one that still wins at matched level.',
        ],
        tryThis: [
          'Set TILT to +4.0: the dock reads +4.0 dB end to end (±2.0). Compare WITH EQ and BYPASS with MATCH LEVEL on.',
          'Move TILT to −4.0 and watch which way the LUFS cell moves this time.',
        ],
      },
    },
    {
      key: 'practice', title: 'Workflow decisions', rack: false,
      guide: {
        seeing: [
          'A deck of workflow decisions, one card at a time, with a line counting your place in the deck.',
        ],
        control: DECK_CONTROL,
        changes: [
          'A fitting pick shows ✓ and the explanation; another pick says it is not the best fit.',
          'The module is credited the moment the last card is answered.',
        ],
        teaches: [
          'Where each decision belongs in the session: inspection, the first listen, a matched bypass, the final check.',
        ],
        tryThis: [
          'For each card, find its place on the FLOW from the first step of this module.',
          'Read every explanation, right or wrong.',
        ],
      },
    },
    {
      key: 'review', title: 'Review', rack: false,
      guide: {
        seeing: [
          'KEY IDEAS and KEY TERMS for the workflow.',
          'At the foot: the TAKEAWAY and the module’s credit line.',
        ],
        control: [
          'Scroll to read. NEXT › moves on to Module 6, Loudness and translation.',
        ],
        changes: [
          'The credit line reads credited once every PRACTICE card is answered. Credit is never removed.',
        ],
        teaches: [
          'Inspect, listen, decide, change, sequence, deliver, check.',
          'Every processing decision is a bypass comparison at matched level; QC is on the files you send.',
          'Next: reading loudness numbers and comparing masters fairly.',
        ],
        tryThis: [
          'Say the seven workflow stages in order without looking.',
          'Cards still open? ‹ PREV returns to the PRACTICE step.',
        ],
      },
    },
  ],

  // ══ MODULE 6 · Loudness and translation ══════════════════════════════════
  loudness: [
    {
      key: 'numbers', title: 'The four numbers', rack: true,
      guide: {
        seeing: [
          'IN THIS MODULE and its objective sit at the top of the notes.',
          'The display: the Visual Audio Analysis lab’s own meter — a sample peak meter or a loudness meter (no target line), playing a synthesized teaching signal.',
          'The bezel: PEAK, TRUE PK, LUFS, GAIN and FACE.',
        ],
        control: [
          'GAIN fader: −12 to +6 dB, in 0.5 dB steps.',
          'FACE: Sample peak meter or Loudness meter (BS.1770-style).',
          'SIGNAL: Music mix, Speech, Kick drum or Organ, each with a note on what to watch.',
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
        seeing: [
          'The display: the waveform, the gain-reduction strip and the limiter faceplate — INPUT (the drive), CEILING −1.0 dBFS, RELEASE 80 ms, GR.',
          'While you drag DRIVE the picture is an estimate, labelled ESTIMATE · RENDERS WHEN YOU LET GO.',
          'The bezel: PEAK, TRUE PK, LUFS, PLR and MATCH dB.',
        ],
        control: [
          'DRIVE fader: 0 to +14 dB into the limiter, in 0.5 dB steps. It starts at +6.0.',
          'MATCH LEVEL (on to start), ▶ QUIETER, ▶ LOUDER, ■ STOP. Tapping the display plays or stops too.',
        ],
        changes: [
          'QUIETER is the same limiter with no drive; LOUDER is driven by DRIVE.',
          'More drive: more gain reduction, a higher LUFS and a smaller PLR. With MATCH on, LOUDER is turned down to QUIETER’s loudness.',
          'This limiter watches samples only, so TRUE PK can read over its −1.0 ceiling.',
        ],
        teaches: [
          'What a louder master costs, heard at matched level: transients and movement.',
          'The right loudness depends on the content and the destination; this lab sets no target.',
        ],
        tryThis: [
          'Ride DRIVE to 0: LOUDER becomes the same as QUIETER. Then push it to +14 and compare them at matched level.',
          'At high DRIVE, read TRUE PK: a sample-peak ceiling of −1.0 can still let true peak through above it.',
        ],
      },
    },
    {
      key: 'normal', title: 'Normalization and translation', rack: false,
      guide: {
        seeing: [
          'PLAYBACK LOUDNESS NORMALIZATION and TRANSLATION CHECKS, on one reading page.',
        ],
        control: [
          'Scroll to read. NEXT › goes on to the translation display.',
        ],
        changes: [
          'Normalization is a playback gain: a heavily limited master can be played at the same loudness as a dynamic one, or quieter.',
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
        seeing: [
          'The display: the program’s spectrum as mastered (dashed, measured from the render) and a MODEL of how a playback system presents it (solid).',
          'On the main monitors the two coincide, so only the solid line is drawn.',
          'The bezel: SYSTEM and FOLD (STEREO or MONO).',
        ],
        control: [
          'SYSTEM in the dock: Main monitors (treated room), Headphones, Small speaker, Phone speaker (mono), Car.',
          '▶ DRAW MIX appears until the mix has been drawn: it renders it once, with no sound.',
        ],
        changes: [
          'Small speaker: little below 150 Hz. Phone speaker: almost nothing below about 400 Hz, folded to MONO.',
          'Car: the bass lifted, the top shelved down. Headphones: a small lift in presence and bass.',
          'Illustrative shapes, not measurements of any product.',
        ],
        teaches: [
          'Each system presents the same master differently: bandwidth, a mid bump, a mono fold.',
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
        seeing: [
          'A deck of loudness decisions, one card at a time, with a line counting your place in the deck.',
        ],
        control: DECK_CONTROL,
        changes: [
          'A fitting pick shows ✓ and the explanation; another pick says it is not the best fit.',
          'The module is credited the moment the last card is answered.',
        ],
        teaches: [
          'Reading loudness numbers in context: content, destination, normalization and translation.',
        ],
        tryThis: [
          'For each card, ask which of the four numbers it is really about.',
          'Read every explanation, right or wrong.',
        ],
      },
    },
    {
      key: 'review', title: 'Review', rack: false,
      guide: {
        seeing: [
          'KEY IDEAS and KEY TERMS for loudness and translation.',
          'At the foot: the TAKEAWAY and the module’s credit line.',
        ],
        control: [
          'Scroll to read. NEXT › moves on to Module 7, Mastering for release.',
        ],
        changes: [
          'The credit line reads credited once every PRACTICE card is answered. Credit is never removed.',
        ],
        teaches: [
          'Peak, true peak, integrated loudness and dynamic range answer four different questions.',
          'Normalization is a playback gain; limiting is a permanent decision about dynamics.',
          'Next: delivering the right file for each destination.',
        ],
        tryThis: [
          'Explain the difference between peak and true peak in one sentence each.',
          'Cards still open? ‹ PREV returns to the PRACTICE step.',
        ],
      },
    },
  ],

  // ══ MODULE 7 · Mastering for release ═════════════════════════════════════
  release: [
    {
      key: 'contexts', title: 'Delivery contexts', rack: false,
      guide: {
        seeing: [
          'IN THIS MODULE and its objective, then five client briefs, each with an illustration of its delivery object.',
          'Streaming / digital distribution, CD preparation, Vinyl preparation, Broadcast or picture-related delivery, Alternate versions.',
          'The one constant: the Red Book audio CD.',
        ],
        control: [
          'Scroll to read; tap a drawing to see it larger. NEXT › goes on to the delivery checklist.',
        ],
        changes: [
          'Each brief is a different delivery; the facts and examples for each sit beside the checklist on the next step.',
          'The constant card gives the four-track EP’s length and its size as Red Book WAV.',
        ],
        teaches: [
          'Every destination has its own current requirements, and every client a request.',
          'Red Book CD audio is fixed: 16-bit, 44.1 kHz, two channels, about 74 minutes.',
        ],
        tryThis: [
          'Read the constant card: the EP runs 16.8 minutes, 177 MB as Red Book WAV.',
          'For each brief, guess what you would need to confirm before exporting, then check on the next step.',
        ],
      },
    },
    {
      key: 'checklist', title: 'Delivery checklist', rack: true,
      guide: {
        seeing: [
          'The display: a delivery sheet for the chosen destination — its sample brief and the lines to confirm, filling in as you tick them.',
          'The bezel: DESTINATION and CONFIRMED (green when every line is ticked).',
          'The notes: the brief, then FACT and EXAMPLE lines.',
        ],
        control: [
          'DESTINATION in the dock: ride it, or tap it for the list.',
          'CONFIRM opens the checklist: tap a line to tick it, tap again to clear it.',
        ],
        changes: [
          'Every destination has its own list, and keeps its own ticks when you switch.',
          'FACTS are facts; EXAMPLES are labelled examples to verify against the destination’s current spec — not the rule.',
        ],
        teaches: [
          'Confirm the destination’s current spec and the client’s request, deliver exactly that, and document it.',
          'The order of operations: sample-rate conversion first, dither to 16-bit as the very last step, once.',
        ],
        tryThis: [
          'Ride DESTINATION to CD preparation, open CONFIRM and tick every line: CONFIRMED turns green.',
          'Switch to Vinyl preparation and back: each destination keeps its own ticks.',
        ],
      },
    },
    {
      key: 'practice', title: 'Release decisions', rack: false,
      guide: {
        seeing: [
          'A deck of release decisions, one card at a time, with a line counting your place in the deck.',
        ],
        control: DECK_CONTROL,
        changes: [
          'A fitting pick shows ✓ and the explanation; another pick says it is not the best fit.',
          'The module is credited the moment the last card is answered.',
        ],
        teaches: [
          'Applying destination requirements: checking today’s spec instead of assuming one setting.',
        ],
        tryThis: [
          'For each card, ask: what would I read before deciding — the spec, or the client?',
          'Read every explanation, right or wrong.',
        ],
      },
    },
    {
      key: 'review', title: 'Review', rack: false,
      guide: {
        seeing: [
          'KEY IDEAS and KEY TERMS for release.',
          'At the foot: the TAKEAWAY and the module’s credit line.',
        ],
        control: [
          'Scroll to read. NEXT › moves on to Module 8, Putting it all together.',
        ],
        changes: [
          'The credit line reads credited once every PRACTICE card is answered. Credit is never removed.',
        ],
        teaches: [
          'Each destination has current requirements; facts change rarely, examples are checked against the spec of the day.',
          'Metadata and documentation are part of the delivery.',
          'Next: a whole fictional release, start to finish.',
        ],
        tryThis: [
          'Say the order: sample-rate conversion, then dither, once, last.',
          'Cards still open? ‹ PREV returns to the PRACTICE step.',
        ],
      },
    },
  ],

  // ══ MODULE 8 · Putting it all together ═══════════════════════════════════
  project: [
    {
      key: 'brief', title: 'The brief and the mix files', rack: false,
      guide: {
        seeing: [
          'IN THIS MODULE and its objective, then the brief: Night Signal — EP — Low Orbit (fictional), from a client email.',
          'THE MIX FILES, AS INSPECTED: four tracks with lengths and notes.',
          'Each track’s integrated loudness estimate and true peak, tinted against 0 dBTP.',
        ],
        control: [
          'Scroll to read. NEXT › goes on to the track decisions.',
        ],
        changes: [
          'Nothing moves here: every later step in this module answers part of this brief.',
        ],
        teaches: [
          'A mastering job starts by reading the brief and inspecting the files, before any processing.',
          'The client’s words set the limits: one record, a quiet song kept quiet, instrumentals for sync.',
        ],
        tryThis: [
          'Compare Tide Table at −19.8 LUFS with Night Signal at −12.6: a 7.2 LU difference the client wants kept: the quiet song stays quiet.',
          'Find the track whose true peak sits closest to 0 dBTP: Night Signal, at −0.4.',
        ],
      },
    },
    {
      key: 'problems', title: 'What can mastering address?', rack: false,
      guide: {
        seeing: [
          'One card per track: a mastering adjustment, a mix revision, or more information from the client?',
          'A line counts your place in the deck.',
        ],
        control: DECK_CONTROL,
        changes: [
          'A fitting pick shows ✓ and the explanation; another pick says it is not the best fit.',
          'These four decisions, plus the final QC checklist, credit the module.',
        ],
        teaches: [
          'Sorting a real project’s problems by reach, as in Module 1, with the brief in hand.',
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
        seeing: [
          'A checklist of listening checks and tools for this EP, each ☐ until ticked.',
          'A card at the foot: Ready? with REVEAL THE KEY ›.',
        ],
        control: [
          'Tap a line to tick it (☑); tap again to clear it. Your ticks are kept.',
          'REVEAL THE KEY › shows the key and a reason under each line.',
        ],
        changes: [
          'After the reveal, lines that differ from the key are marked Needed: or Not this:, with the reasoning.',
          'The card counts how many lines agree with the key: ticked where a check is needed, left clear where it is not.',
        ],
        teaches: [
          'Choosing checks from the brief: what this EP needs, and what would break what the client protected.',
          'The point is the reasoning, not the score.',
        ],
        tryThis: [
          'Tick your list with the brief open in your mind, then reveal and read only the lines that differ.',
          'Look for any line that would undo something the client asked to keep.',
        ],
      },
    },
    {
      key: 'sequence', title: 'Sequence and delivery plan', rack: true,
      guide: {
        seeing: [
          'The display: the running order on a real time base — block length is track length, height and color its loudness, the wedge its fade-out. Below, the three transitions zoomed.',
          'The bezel: ORDER, GAP, MAX STEP (the largest loudness step between neighbors) and TOTAL.',
          'THE DELIVERY PLAN in the notes.',
        ],
        control: [
          'GAP fader: 0 to 6 s between tracks, in 0.5 s steps. It starts at 2.0 s.',
          'ORDER: Opener first, quiet song last (OPENER→QUIET); Quiet song in the middle (QUIET MID); Build to the opener (BUILD UP).',
          'CROSSFADE overlaps neighbors by 2 s with no gap; GAP is locked while it is on.',
        ],
        changes: [
          'MAX STEP turns amber above 6 LU. TOTAL grows with each gap and shrinks with a crossfade.',
          'In the zoomed strip the gap, the fade wedge and a crossfade overlap all move with the fader.',
          'The quiet song makes a step the client asked for, so the gap around it is a decision.',
        ],
        teaches: [
          'Sequencing shapes a release: order, gaps, fades and loudness steps between tracks.',
          'A deliberate step is kept and framed; an accidental one is fixed.',
          'The delivery plan: digital first, CD a month later, vinyl only after asking the cutting engineer.',
        ],
        tryThis: [
          'At OPENER→QUIET with GAP 2.0 s: MAX STEP reads 5.9 LU and TOTAL 16:51. Switch to QUIET MID: 7.2 LU, in amber.',
          'Turn CROSSFADE on: GAP reads XF and TOTAL drops to 16:39.',
        ],
      },
    },
    {
      key: 'qc', title: 'Final QC checklist', rack: false,
      guide: {
        seeing: [
          'The final QC checklist: nine lines on the exported files, each ☐ until ticked.',
          'A status card under it, then KEY TERMS, the TAKEAWAY and the module’s credit line.',
        ],
        control: [
          'Tap a line to tick it (☑); tap again to clear it. Your ticks are kept.',
          'NEXT › here is FINISH: it opens the what’s-left screen for the whole lab.',
        ],
        changes: [
          'With every line ticked the card reads QC complete — or Delivered once the four track decisions are answered too.',
          'That moment credits the module.',
        ],
        teaches: [
          'Quality control happens on the files you send, not on the session that made them.',
          'A mastering job ends with a delivery somebody can use, and a note of what was sent.',
        ],
        tryThis: [
          'Tick each line only when you can say how you would check it on a real file.',
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
  seeing: [
    'The title reads WHAT’S LEFT, or LAB COMPLETE once every module is done; YOUR PROGRESS if your saved progress could not be read.',
    'One row per module still to do, with what finishes it: the decisions on its PRACTICE step, or for Module 8 the four track decisions and the QC checklist.',
    'Finished modules fold into one ✓ DONE line; REVIEW ▾ lists them.',
  ],
  control: [
    'Tap a module’s row to open it on the step that finishes it: its PRACTICE deck, or Module 8’s track decisions — its QC checklist once those four are saved. A finished module opens at its first step.',
    'PRACTICE AGAIN FROM THE START opens Module 1 at its first step; saved answers stay, and it never undoes a finished module.',
    'DONE · BACK TO LABS leaves the lab.',
    'On the strip, ‹ PREV returns to the step you came from — your answers and ticks are kept, its other settings start fresh — and ⏮ opens Module 1. Tap the WHAT’S LEFT ▾ readout for the list of modules.',
  ],
  changes: [
    'A module is done — “credited” inside the module — the moment every one of its decisions has an answer, right or wrong. Module 8 also needs every QC line ticked.',
    'START OVER (PRACTICE), at the foot of the module list, asks first, then clears your answers and Module 8 ticks and opens Module 1; finished modules stay done.',
    'Progress is kept on this device. Signed out, the line under the title says what is kept.',
  ],
  teaches: [
    'Which modules are done and which are still to do — from what mastering is through to a full project.',
    'Any module can be opened again for practice; nothing done is taken away.',
  ],
  tryThis: [
    'If a module is still listed, tap its row: it opens on a step that earns it (Module 8 needs two). Then tap the strip’s readout and WHAT’S LEFT › to come back here.',
    'If a ✓ DONE line shows, tap REVIEW ▾ and reopen a module you found hard — it opens at its first step.',
  ],
};

/** The guide for step `step` of `moduleId` (undefined past the end). */
export function masteringStepGuide(moduleId: MasteringModuleId, step: number): MasteringGuideStep | undefined {
  return MASTERING_GUIDE_STEPS[moduleId]?.[step];
}
