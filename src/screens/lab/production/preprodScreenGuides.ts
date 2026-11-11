/**
 * Audio Pre-Production — "explain this screen" content (owner 2026-10-31,
 * Screen Guide rollout). The lab's screens are the shared production screens
 * (see productionScreenGuideParts.ts); this file says what Pre-Production's
 * home, six stages, six exercises and Production Packet are about.
 *
 *   PREPROD_START_GUIDE     — the home with no project yet (START A PROJECT)
 *   PREPROD_HOME_GUIDE      — the home with a project open
 *   PREPROD_STAGE_GUIDES    — one per stage, keyed by stageId
 *   PREPROD_ACTIVITY_GUIDES — one per exercise, keyed by activityId
 *   PREPROD_PACKET_GUIDE    — the Production Packet screen
 *
 * Every field label, option, section title and finding title quoted here is
 * read from features/production/preprod/stage*.data.ts, and every TRY THIS
 * outcome is what readStage / readProject / checkActivity produce for those
 * answers: test/screenGuide_preprod_20261031.test.ts replays each one. Change
 * a label, an option, a rule or an exercise seed → update the guide here.
 *
 * Copy rules: plain language, short sentences; claims KNOWLEDGE, never
 * skills; no "N of total"; "suggest" never "recommend"; no gear makers; no
 * build notes in learner text.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';
import {
  ACTIVITY_CHANGES,
  ACTIVITY_CONTROL,
  CHIPS_LINE,
  activitySeeing,
  stageControl,
  stageSeeing,
} from './productionScreenGuideParts';

const KICKER = 'PRE-PRODUCTION · STAGE n';
const kicker = (n: number) => KICKER.replace('n', String(n));
const CONTROL = stageControl('Production Packet');

export const PREPROD_START_GUIDE: ScreenGuide = {
  intro: {
    learning: 'What pre-production is: deciding what is made, for whom, by whom, when, for how much and how it is captured, before anyone records.',
    start: 'Tap Music recording and read the readiness score it opens with. Then tap + NEW PROJECT, pick Live performance or event, and compare the two Stage 1 questions.',
  },
  seeing: [
    'This is the Audio Pre-Production home: everything that should happen before recording, filming, broadcasting or presenting begins.',
    'Under START A PROJECT you choose one of three types: Music recording, Podcast or spoken word, or Live performance or event.',
    'Read the note: what you make changes the questions, the documents and the problems; the planning process underneath stays the same.',
  ],
  control: [
    'Tap a project type to start that kind of project. It opens at once, saved on this phone and named after its type.',
    'Once a project is open, check its readiness, work through THE SIX STAGES, try the EXERCISES and build the Production Packet. + NEW PROJECT there starts another project of any type.',
    `‹ leaves the lab. ${CHIPS_LINE}`,
  ],
  changes: [
    'The type changes the wording: Stage 1 asks “How many songs?” on a music project and “How many episodes?” on a podcast.',
    'It also changes which questions appear and which are required, so each plan asks only what that kind of production needs.',
    'Some exercises fit only some types. The people and emergency exercises are set at a live show, so only Live projects get them; the input-list one is for Music and Live.',
  ],
  teaches: [
    'Pre-production is the planning stage: what is being made, for whom, by whom, when, for how much, and how it will be captured.',
    'A music session, a podcast and a live show go through the same planning steps; only the questions and documents differ.',
    'A plan names the questions; rights, safety and power decisions belong to qualified people.',
  ],
  tryThis: [
    'Tap Music recording. The project opens at a readiness score of 0 / 100, Not Ready for Production, and NEXT OUTSTANDING points at Project name in Stage 1 · Define the Project.',
    'Then tap + NEW PROJECT and pick Live performance or event. Its Stage 1 asks “Inputs from the stage” where the music project asks “Simultaneous sources to record”.',
  ],
};

export const PREPROD_HOME_GUIDE: ScreenGuide = {
  intro: {
    learning: 'When a production plan is truly ready: every required decision made, and every blocker fixed or accepted in writing by a named person, whatever the score says.',
    start: 'Read the verdict under PRODUCTION READINESS. Then tap NEXT OUTSTANDING to land on the most pressing open question, answer it, and come back to see the score move.',
  },
  seeing: [
    'Your open project: its name and type, with DUPLICATE and DELETE. The chips above switch projects; the last one, + NEW PROJECT, starts another.',
    'PICK UP WHERE YOU LEFT OFF names the stage you last answered in. NEXT OUTSTANDING names the most pressing open item.',
    'PRODUCTION READINESS shows the verdict, a score out of 100 and a bar of required decisions. THE SIX STAGES each show a dot, a % and a state.',
  ],
  control: [
    'Tap the name to rename it. DUPLICATE copies the answers but not accepted conditions. DELETE asks first, then removes the project from this phone. + NEW PROJECT, then a type, starts another.',
    'Tap a stage, PICK UP WHERE YOU LEFT OFF or NEXT OUTSTANDING to open that stage. NEXT OUTSTANDING lands on the exact question.',
    'Tap a red blocker under PRODUCTION READINESS to accept it on the record: ACCEPT A CONDITION asks who and why, then RECORD IT.',
    'EXERCISES opens a broken practice plan to repair. OPEN THE PRODUCTION PACKET shows the whole plan as one document.',
    `‹ leaves the lab. ${CHIPS_LINE}`,
  ],
  changes: [
    'The score counts decisions made, not screens opened.',
    'Each flagged finding costs up to 2 points, 20 at most. An open blocker keeps the score under 100 and Not Ready for Production.',
    'A fixed or accepted blocker clears; accepted ones go to PROCEEDING WITH ACCEPTED CONDITIONS and print in the packet.',
    'Ready With Approved Conditions: all required decisions made, no blocker, but a condition accepted or a flag.',
  ],
  teaches: [
    'A plan is ready when its decisions are made and its blockers dealt with. A high score can’t outrank a safety, legal or recording blocker.',
    'Real productions often go ahead with a known gap, as long as a named person has accepted it in writing.',
    'A production is planned in order: define, deliver, people, schedule, technical plan, readiness. Each step leans on the ones before.',
  ],
  tryThis: [
    'On a fresh project, set Stage 1’s “When must it be finished?” to a date before today and come back. ONE THING BLOCKS THIS PROJECT appears, and Stage 1 reads BLOCKED.',
    'Tap that blocker, give a name and a reason, then RECORD IT. It moves to PROCEEDING WITH ACCEPTED CONDITIONS, and Stage 1 is no longer BLOCKED.',
    'Answer any question in a stage and come back. PICK UP WHERE YOU LEFT OFF now appears, naming that stage.',
  ],
};

export const PREPROD_STAGE_GUIDES: Record<string, ScreenGuide> = {
  // ── 1 ─────────────────────────────────────────────────────────────────────
  define: {
    intro: {
      learning: 'Why a production is defined before any gear is chosen: its purpose, audience, scope, one approver and a checkable meaning of “finished”.',
      start: 'Read WHY THIS MATTERS. Then type one name in “Who approves the finished work?” and tap SEE THEM ↓ to check which gaps in the brief are left.',
    },
    seeing: stageSeeing(kicker(1), 'Project Brief, Scope and Creative Direction'),
    control: CONTROL,
    changes: [
      'Every answer re-runs the checks at once: the dots, the badge and WHAT THIS PLAN IS STILL MISSING update as you go.',
      'Flagged: a purpose with nothing checkable, two names as the approver, no audience, or success not defined.',
      'A completion date already passed is a blocker. A scope larger than the time, money, people or equipment behind it is flagged.',
    ],
    teaches: [
      'A production is defined by its purpose, audience, scope, approver and what “finished” means — before any gear is chosen.',
      'One person must give the final yes. A group can’t end a project, because nobody in it can say “finished” alone.',
      'Every later part of a plan is measured against this brief: deliverables, people, schedule, technical plan and readiness.',
    ],
    tryThis: [
      'Type one name in “Who approves the finished work?”: “Nobody can end this project” leaves. Make it “Sam Lee and Alex Ray”: “More than one person has the final yes” appears.',
      'Set “When must it be finished?” to a date before today. The badge reads BLOCKED and “The completion date has already passed” appears.',
      'Check Livestream under “Where will it be presented?”. A livestream finding appears until you check Livestream or broadcast feed under “Which services are included?”.',
    ],
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  deliver: {
    intro: {
      learning: 'Why every deliverable needs a format, a destination and a specification set by that destination, and why most delivery failures are knowable before the first session.',
      start: 'In “What must be delivered?”, tap + ADD ROW and choose a Type. Then tap SEE THEM ↓ and read which delivery gaps are still flagged.',
    },
    seeing: stageSeeing(kicker(2), 'Deliverables, Technical Specification, Destination and Platform, and Approval Chain'),
    control: CONTROL,
    changes: [
      'The destination sets the specification. A channel format that doesn’t match the destination, or a destination with no loudness requirement, is flagged.',
      'A clean version with no definition, stems with no list, or no archival master anywhere in the plan is flagged.',
      'Approval is checked against Stage 1: review rounds that differ from the revisions in scope are flagged.',
    ],
    teaches: [
      'Every deliverable needs a format, a destination, and a specification that comes from that destination.',
      'Most delivery failures are knowable before the first session: wrong format, wrong loudness, a missing clean version, the wrong approver.',
      'Delivery rests on the brief: the review rounds and the approver were set when the project was defined.',
    ],
    tryThis: [
      'Add a row to “What must be delivered?” of Type Mastered program or master. “No deliverables are defined” clears; “There is no archival master anywhere in the plan” stays.',
      'Add a second row of Type Archival package. “There is no archival master anywhere in the plan” clears.',
      'Set “If a reviewer misses their deadline, what happens?” to Not decided. It counts as answered, but the late-approval finding stays. Any real outcome clears it.',
    ],
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  people: {
    intro: {
      learning: 'How naming people turns a plan into something a crew can run: one owner per task, one person per authority, and qualified people for regulated work.',
      start: 'Enter 8 in “How many wireless channels?” and read what WHAT THIS PLAN IS STILL MISSING asks for. Then set “How is the audio system powered?” to Temporary distribution and watch the badge.',
    },
    seeing: stageSeeing(kicker(3), 'Team, Responsibility Assignment, Communication Plan, and Talent and Participants'),
    control: CONTROL,
    changes: [
      'Every task needs exactly one responsible person. Two people with the same authority, or one person carrying too much, is flagged.',
      'Work that needs a qualified person is a blocker until one is named: a licensed electrician for temporary power and, on a live show, a qualified rigger for anything flown.',
      'A participant who is a minor, with no consent or supervision recorded, is a blocker too.',
    ],
    teaches: [
      'Naming people is how a plan becomes something a crew can carry out: one owner per task, one person per authority.',
      'Some jobs need qualified, licensed people, such as an electrician or a rigger. The plan records who; it never replaces them.',
      'Several wireless channels need an RF coordinator: one person who plans the radio frequencies so they don’t interfere.',
    ],
    tryThis: [
      'Enter 8 in “How many wireless channels?”. “Wireless channels with nobody coordinating them” appears and stays until you name an RF coordinator.',
      'Set “How is the audio system powered?” to Temporary distribution or a tie-in to building power: the badge reads BLOCKED. Name the licensed electrician and it clears.',
    ],
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  schedule: {
    intro: {
      learning: 'Why schedules fail by omission, and how the calendar, the clock, the budget and the channel count test every earlier decision in the plan.',
      start: 'In “Blocks of the day”, tap + ADD ROW and add a Soundcheck block. Then tap SEE THEM ↓ and read what the day is still missing.',
    },
    seeing: stageSeeing(kicker(4), 'Milestones, Production-Day Schedule, Budget and Resource Check'),
    control: CONTROL,
    changes: [
      'The day is checked for what plans forget: a line check as well as a soundcheck, setup, breaks, changeovers, file verification and a backup.',
      'Budget lines are added up against the total, and a budget with no contingency is flagged.',
      'On music and live projects, Stage 1’s source count is compared with the channels you have. More sources than channels is a blocker.',
    ],
    teaches: [
      'A schedule fails by omission: the line check, the break and the backup are simply not on the sheet. A line check proves each input arrives before soundcheck.',
      'Time, money and equipment are where earlier decisions are tested: a plan can promise more than its hours, budget or channels allow.',
      'A contingency line is money held back for what goes wrong.',
    ],
    tryThis: [
      'On a music or live project with 24 sources in Stage 1, enter 16 in “Recording channels available”: BLOCKED, “More sources than the equipment can capture”. Enter 24: it clears.',
      'In “Blocks of the day” add only a Soundcheck block: “There is a soundcheck but no line check”. Add a Line check block and it clears.',
      'Set “Total budget available” to 5000, with lines of 4000 and 1500 and no Contingency line: “The lines add up to more than the budget” and “No contingency in the budget” appear.',
    ],
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  technical: {
    intro: {
      learning: 'Why the input list is the document everything on the day is patched from, and how phantom power, stereo channels and channel counts must agree with it.',
      start: 'In “Input list”, tap + ADD ROW and add Lead vocal, Captured by Condenser microphone. Set Phantom power to Off, then On, and watch the findings.',
    },
    seeing: stageSeeing(kicker(5), 'Content Readiness, Location and Acoustics, Sources and Inputs, Microphones and Capture, Signal Flow and Routing, Monitoring and Communication, Synchronization, Session, Files and Data'),
    control: CONTROL,
    changes: [
      'The input list is checked row by row: phantom power against the capture type, two channels for a stereo source, and the total against Stage 4’s channels.',
      'A click or playback nobody can hear, more cue mixes than outputs, or an unsettled clock is flagged.',
      'If nobody has stood in the room, that is flagged: acoustics and power are found on a site visit.',
    ],
    teaches: [
      'The input list is the document everything on the day is patched from: each source, how it is captured, and its channel.',
      'Most condensers and active ribbons need phantom power (a tube condenser has its own supply). Leave it off for a line, playback or passive ribbon source.',
      'A stereo source needs two channels, and a click only helps if it reaches the players’ cue mix.',
    ],
    tryThis: [
      'In “Input list” add Lead vocal, Captured by Condenser microphone, Phantom power Off: “Phantom power does not match the source”. Set it On and it clears.',
      'Add Keys with “Channels this source needs” 2 (stereo pair) and Console channel 9: “A stereo source has been given one channel”. Type 9-10 and it clears.',
      'Those two rows need 3 channels. Set Stage 4’s “Recording channels available” to 2 and come back: BLOCKED. Set it to 3 and the block clears.',
    ],
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  readiness: {
    intro: {
      learning: 'How a production is declared ready, ready with approved conditions, or not ready, and why every hazard, permission and backup needs a named owner.',
      start: 'In “Hazard register”, tap + ADD ROW and set Severity if it happens to Life-threatening. Watch the badge, then fill Preventive action and Owner.',
    },
    seeing: stageSeeing(kicker(6), 'Rights and Permissions, Safety and Risk, Equipment and Logistics, Testing and Rehearsal, Contingency, Production-Day Documentation, and Final Readiness Review'),
    control: CONTROL,
    changes: [
      'Blockers: a life-threatening hazard with no preventive action or owner, a missing rights item, and unsigned rigging or temporary power.',
      'Each backup is checked for the switch, the time and the person. One that can’t be reached in time is flagged.',
      'If nobody is named to decide whether the production continues, that is flagged.',
    ],
    teaches: [
      'A production is declared ready, ready with approved conditions, or not ready, by someone who has actually looked.',
      'Productions fail on the pending permission, the untested backup and the hazard nobody owned.',
      'A hazard is only managed when it has a preventive action and an owner; writing it down alone changes nothing.',
    ],
    tryThis: [
      'In “Hazard register” add a hazard with Severity if it happens set to Life-threatening and no preventive action: BLOCKED. Fill Preventive action and Owner and it clears.',
      'Type a name in “Who decides to continue, pause, simplify, relocate, reschedule or cancel?”. “Nobody is named to decide whether the production continues” leaves.',
    ],
  },
};

export const PREPROD_ACTIVITY_GUIDES: Record<string, ScreenGuide> = {
  'repair-the-brief': {
    intro: {
      learning: 'How a one-sentence brief becomes a plan: a real purpose, an audience and platform, one approver, a priced scope and success you can check.',
      start: 'Read the brief and the five checks. Tap OPEN THE PLAN AND FIX IT, type one name in “Who approves the finished work?”, then come back and look for a ✓.',
    },
    seeing: activitySeeing(1, 'Repair the vague brief', 'all three project types'),
    control: ACTIVITY_CONTROL,
    changes: ACTIVITY_CHANGES,
    teaches: [
      'A one-sentence brief becomes a plan when it has a real purpose, an audience and platform, one approver, a priced scope and checkable success.',
      'The first questions are mostly not technical; the gear list follows from the answers.',
      'A scope can only be priced once it says which services are included and how many revision rounds they cover.',
    ],
    tryThis: [
      'All five checks start ○. Open the plan, type one name in “Who approves the finished work?”, and come back: “A single approver is named” turns ✓.',
      'Check a service under “Which services are included?” and enter 2 in “Revision rounds included”: “At least one service is selected and a revision count is entered” turns ✓.',
    ],
  },
  'deliverable-detective': {
    intro: {
      learning: 'How a delivery request hides contradictions in ordinary words, why the destination sets the specification, and why one named person decides when it’s done.',
      start: 'Read the request slowly and look for words that contradict each other. Then tap OPEN THE PLAN AND FIX IT and start with “Who gives final approval?”.',
    },
    seeing: activitySeeing(2, 'Deliverable detective', 'all three project types'),
    control: ACTIVITY_CONTROL,
    changes: ACTIVITY_CHANGES,
    teaches: [
      'Requests hide contradictions in ordinary words: a stereo file for an immersive room, a clean edit with no standard, approval from a group.',
      'The specification belongs to the destination; “done” belongs to one named person.',
      'A late-approval rule decides in advance what happens when a reviewer misses a deadline, so delivery doesn’t stall.',
    ],
    tryThis: [
      'Seven checks start ○. Set “If a reviewer misses their deadline, what happens?” to any outcome but Not decided: “The late-approval outcome is chosen” turns ✓.',
      'Type one person’s name in “Who gives final approval?”: “One named person replaces ‘the board’” turns ✓.',
    ],
  },
  'who-owns-this-task': {
    intro: {
      learning: 'Why every task on a live show needs exactly one owner, and why nobody can hold two jobs that happen at the same time.',
      start: 'Read the brief and find who holds more than one job. Then tap OPEN THE PLAN AND FIX IT and name a person in “Stage manager”.',
    },
    seeing: activitySeeing(3, 'Who owns this task?', 'Live performance or event projects'),
    control: ACTIVITY_CONTROL,
    changes: ACTIVITY_CHANGES,
    teaches: [
      'One responsible person per task, one person per authority, and nobody holding two jobs that happen at once.',
      'A list can name every task and still leave the media, the releases and the power unowned.',
      'Monitor engineering and a livestream run during the same show, so each needs its own person.',
    ],
    tryThis: [
      'Name a person in “Who is responsible for the recorded media?” and in “Stage manager”: “A media manager is named, and a stage manager on a live show” turns ✓.',
      'Dana holds three jobs at once. Name others as “Monitor engineer” and “Livestream or broadcast operator”: “Nobody holds two jobs that happen at the same time” turns ✓.',
    ],
  },
  'save-the-production': {
    intro: {
      learning: 'Which blocks every production day needs (line check, changeovers, a break, verification, a backup) and why channels and contingency are settled first.',
      start: 'Read the brief and note the two checks that already pass. Tap OPEN THE PLAN AND FIX IT and describe the backup in “How is the backup made and where does it go?”.',
    },
    seeing: activitySeeing(4, 'Save the production', 'all three project types'),
    control: ACTIVITY_CONTROL,
    changes: ACTIVITY_CHANGES,
    teaches: [
      'The blocks every crew writes in: line check, changeovers, a break, verification and a backup.',
      'Channels and contingency are settled first: a day can’t run on channels or money it doesn’t have.',
      'Omissions are cheap to fix on paper and ruinous on the day.',
    ],
    tryThis: [
      'Two checks already pass: the day fits, and the recording is still in scope. Describe the backup in “How is the backup made and where does it go?”: a third turns ✓.',
      'Stage 1 lists 24 sources. Enter 24 in “Recording channels available” and 1 in “Spare microphones, DIs and cables”: the channels check turns ✓.',
    ],
  },
  'build-the-input-list': {
    intro: {
      learning: 'How an input list is made to fit the channels you have: stereo pairs, phantom matched to each source, DIs, and the click in a cue mix.',
      start: 'Tap OPEN THE PLAN AND FIX IT and count the “Input list” channels against the system. Then add a cue mix that carries the click in “Performer cue mixes”.',
    },
    seeing: activitySeeing(5, 'Build the input list', 'Music recording and Live performance or event projects'),
    control: ACTIVITY_CONTROL,
    changes: ACTIVITY_CHANGES,
    teaches: [
      'An input list fits when each stereo source has two channels, phantom matches the source, bass and acoustic pickups go through a DI, and the click is in a cue mix.',
      'Every fix is a decision — what to sum, drop or route — not a purchase.',
      'A DI (direct box) turns an instrument’s output into a balanced, mic-level signal a console input can take.',
    ],
    tryThis: [
      'The fresh list has 17 rows needing 19 channels on a 16-channel system, so “The summed channel count is no more than the channels available” starts ○. Decide what to sum or drop.',
      'In “Performer cue mixes” add a row with a Who and “click” in “What they need in it”: “At least one cue mix exists that carries the click” turns ✓.',
    ],
  },
  'production-emergency': {
    intro: {
      learning: 'Why a backup is the switch, the time and the person, not just spare equipment, and how a risk becomes an approved condition only when someone accepts it in writing.',
      start: 'Read the brief and decide who should call continue or stop. Tap OPEN THE PLAN AND FIX IT, name that person and fill “What triggers each response?”.',
    },
    seeing: activitySeeing(6, 'Production emergency', 'Live performance or event projects'),
    control: ACTIVITY_CONTROL,
    changes: ACTIVITY_CHANGES,
    teaches: [
      'A backup is the switch, the time and the person — not just spare equipment.',
      'An unresolved risk becomes an approved condition only when a named person accepts it in writing.',
      'A contingency plan names the simplest version that still keeps the promise, such as the live recording.',
    ],
    tryThis: [
      'Name who decides to continue or stop, and fill “What triggers each response?”: “A decision authority is named, with the triggers written down” turns ✓.',
      'Fill in “The simplest version that still delivers what was promised”: “The simplest version is described, and it still keeps the live recording” turns ✓.',
    ],
  },
};

export const PREPROD_PACKET_GUIDE: ScreenGuide = {
  intro: {
    learning: 'Why a planning document prints its own gaps and accepted conditions, and why a revision number tells everyone which copy is current.',
    start: 'Read WHAT’S LEFT from the top and tap its first row to jump to that question. Then come back and check Revision, Prepared by and Status before you tap SHARE AS PDF.',
  },
  seeing: [
    'The Production Packet: your whole plan as one document, headed by project, type and verdict.',
    'WHAT’S LEFT lists open items by stage, blocked stages and blockers first. The PDF holds the title, verdict and all below SHARE AS PDF; the type and WHAT’S LEFT stay off it.',
    'Then: Revision, Revision date, Prepared by, Status, any MUST BE RESOLVED BEFORE PROCEEDING and ACCEPTED CONDITIONS, and every stage’s answers.',
  ],
  control: [
    'Tap a WHAT’S LEFT row (BLOCKER, REQUIRED QUESTION or TO LOOK AT) to open that stage at that question, marked with an amber edge, or at its findings.',
    'Tap SHARE AS PDF to make the PDF and record the next revision number. Where printing isn’t available, the screen says so, and this page is then the whole packet.',
    `‹ goes back. ${CHIPS_LINE}`,
  ],
  changes: [
    'Unanswered questions print as “Not decided — required” or “Not decided”. A skip prints “Not applicable —” and its reason. Gaps are printed, never hidden.',
    'Revision reads “0 — not exported yet” until the first export; each export prints the next number.',
    'Status is the verdict. Prepared by is Stage 1’s producer or project lead, or Unattributed when nobody is named.',
  ],
  teaches: [
    'A planning document shows its own gaps and conditions, so the people relying on it know what is not settled.',
    'A revision number tells everyone which copy is current, so nobody works from an old plan.',
    'A plan with a named author and a stated status is one a crew can actually run a production from.',
  ],
  tryThis: [
    'On a new project, WHAT’S LEFT opens with STAGE 1 · DEFINE THE PROJECT, its first row a REQUIRED QUESTION: Project name. Tap it and Stage 1 opens at that question.',
    'Type a name in Stage 1’s “Producer or project lead”, then come back: Prepared by changes from Unattributed to that name.',
    'Add a life-threatening hazard with no action in Stage 6: STAGE 6 · CONFIRM PRODUCTION READINESS jumps to the top of WHAT’S LEFT, its BLOCKER first.',
  ],
};
