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
  seeing: [
    'The Audio Pre-Production home: everything that should happen before recording, filming, broadcasting or presenting begins.',
    'START A PROJECT: three project types — Music recording, Podcast or spoken word, Live performance or event.',
    'Its note: what you make changes the questions, the documents and the problems; the planning process underneath stays the same.',
  ],
  control: [
    'Tap a project type to start a project of that kind. It is saved on this phone, named after its type, and opens at once.',
    'Once a project is open, this screen shows its readiness, THE SIX STAGES, the EXERCISES and the Production Packet; + NEW PROJECT there starts another project of any type.',
    `‹ leaves the lab. ${CHIPS_LINE}`,
  ],
  changes: [
    'The type changes the wording: Stage 1 asks “How many songs?” on a music project, “How many episodes?” on a podcast.',
    'It also changes which questions appear and which are required, so the plan asks only what that kind of production needs.',
    'Some exercises fit only some types: the people and emergency exercises are set at a live show (Live projects only); the input-list exercise is for Music and Live.',
  ],
  teaches: [
    'Pre-production is the planning stage: what is being made, for whom, by whom, when, for how much, and how it will be captured.',
    'It is the first lab in Production Workflow; Audio Post-Production picks up after the recording stops.',
    'This is planning education: rights, safety and power questions point to qualified people.',
  ],
  tryThis: [
    'Tap Music recording: the project opens at 0 / 100, Not Ready for Production, and NEXT OUTSTANDING points at Project name in Stage 1 · Define the Project.',
    'Then tap + NEW PROJECT and pick Live performance or event: its Stage 1 asks “Inputs from the stage” where the music project asks “Simultaneous sources to record”.',
  ],
};

export const PREPROD_HOME_GUIDE: ScreenGuide = {
  seeing: [
    'Your project: its name, its type, DUPLICATE and DELETE. Chips above switch projects; the last, + NEW PROJECT, starts another.',
    'PICK UP WHERE YOU LEFT OFF: the stage you last answered in. NEXT OUTSTANDING: the most pressing open item.',
    'PRODUCTION READINESS: the verdict, a score out of 100 and a bar of required decisions. THE SIX STAGES: each with a dot, a % and its state.',
  ],
  control: [
    'Tap the name to rename it. DUPLICATE copies the answers but not accepted conditions; DELETE asks first, then removes it from this phone. + NEW PROJECT, then a type, starts another.',
    'Tap a stage, PICK UP WHERE YOU LEFT OFF or NEXT OUTSTANDING to open that stage — NEXT OUTSTANDING lands on the exact question.',
    'Tap a red blocker under PRODUCTION READINESS to accept it on the record: ACCEPT A CONDITION asks who and why, then RECORD IT.',
    'EXERCISES opens a broken practice plan to repair. OPEN THE PRODUCTION PACKET shows the whole plan as one document.',
    `‹ leaves the lab. ${CHIPS_LINE}`,
  ],
  changes: [
    'The score counts decisions made, not screens opened.',
    'Each flagged finding costs up to 2 points (20 max); an open blocker keeps it under 100 and Not Ready for Production.',
    'Fixed or accepted, a blocker clears; accepted ones go to PROCEEDING WITH ACCEPTED CONDITIONS and print in the packet.',
    'Ready With Approved Conditions: every required decision made, no blocker, but a condition accepted or something flagged.',
  ],
  teaches: [
    'A plan is ready when its decisions are made and its blockers dealt with — a high score cannot outrank a safety, legal or recording blocker.',
    'Real productions often go ahead with a known gap, as long as a named person has accepted it in writing.',
    'The six stages follow the order a production is planned: define, deliver, people, schedule, technical plan, readiness.',
  ],
  tryThis: [
    'On a fresh project, set Stage 1’s “When must it be finished?” to a date before today, then come back: ONE THING BLOCKS THIS PROJECT appears and Stage 1 reads BLOCKED.',
    'Tap that blocker, give a name and a reason, RECORD IT: it moves to PROCEEDING WITH ACCEPTED CONDITIONS and Stage 1 is no longer BLOCKED.',
    'Answer any question in a stage and come back: PICK UP WHERE YOU LEFT OFF appears, naming that stage.',
  ],
};

export const PREPROD_STAGE_GUIDES: Record<string, ScreenGuide> = {
  // ── 1 ─────────────────────────────────────────────────────────────────────
  define: {
    seeing: stageSeeing(kicker(1), 'Project Brief, Scope and Creative Direction'),
    control: CONTROL,
    changes: [
      'Each answer re-runs the checks at once: the dots, the badge and WHAT THIS PLAN IS STILL MISSING update.',
      'Flagged: a purpose with nothing checkable, two names as the approver, no audience, success not defined.',
      'A completion date already passed is a blocker. Scope larger than the time, money, people or equipment behind it is flagged.',
    ],
    teaches: [
      'A production is defined by its purpose, audience, scope, approver and what “finished” means — before any gear is chosen.',
      'One person must give the final yes: a group cannot end a project.',
      'Stage 1: everything in Stages 2–6 is checked against what is decided here.',
    ],
    tryThis: [
      'Type one name in “Who approves the finished work?”: “Nobody can end this project” leaves. Make it “Sam Lee and Alex Ray”: “More than one person has the final yes”.',
      'Set “When must it be finished?” to a date before today: the badge reads BLOCKED and “The completion date has already passed” appears.',
      'Tick Livestream under “Where will it be presented?”: a livestream finding appears until Livestream or broadcast feed is ticked under “Which services are included?”.',
    ],
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  deliver: {
    seeing: stageSeeing(kicker(2), 'Deliverables, Technical Specification, Destination and Platform, and Approval Chain'),
    control: CONTROL,
    changes: [
      'The destination sets the specification: a channel format that does not match it, or a destination with no loudness requirement, is flagged.',
      'A clean version with no definition, stems with no list, or no archival master anywhere are flagged.',
      'Approval is checked against Stage 1: review rounds that differ from the revisions in scope are flagged.',
    ],
    teaches: [
      'Every deliverable needs a format, a destination, and a specification that comes from that destination.',
      'Most delivery failures are knowable before the first session: wrong format, wrong loudness, a missing clean version, the wrong approver.',
      'Stage 2: builds on Stage 1’s scope and approver.',
    ],
    tryThis: [
      'Add a row to “What must be delivered?” of Type Mastered program or master: “No deliverables are defined” clears; “There is no archival master anywhere in the plan” stays.',
      'Add a second row of Type Archival package: “There is no archival master anywhere in the plan” clears.',
      'Set “If a reviewer misses their deadline, what happens?” to Not decided: it counts as answered, but the late-approval finding stays. Any real outcome clears it.',
    ],
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  people: {
    seeing: stageSeeing(kicker(3), 'Team, Responsibility Assignment, Communication Plan, and Talent and Participants'),
    control: CONTROL,
    changes: [
      'Every task needs exactly one responsible person: two people with the same authority, or one person carrying too much, is flagged.',
      'Work that needs a qualified person — a licensed electrician for temporary power and, on a live show, a qualified rigger for anything flown — is a blocker until one is named.',
      'A participant who is a minor with no consent or supervision recorded is a blocker too.',
    ],
    teaches: [
      'Naming people is how a plan becomes something a crew can carry out: one owner per task, one person per authority.',
      'Some jobs need qualified, licensed people. The plan records who; it never replaces them.',
      'Stage 3: follows Stage 2’s deliverables; Stage 4’s schedule is built around these people.',
    ],
    tryThis: [
      'Enter 8 in “How many wireless channels?”: “Wireless channels with nobody coordinating them” appears until an RF coordinator is named.',
      'Set “How is the audio system powered?” to Temporary distribution or a tie-in to building power: BLOCKED. Name the licensed electrician and it clears.',
    ],
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  schedule: {
    seeing: stageSeeing(kicker(4), 'Milestones, Production-Day Schedule, Budget and Resource Check'),
    control: CONTROL,
    changes: [
      'The day is checked for what plans forget: a line check as well as a soundcheck, setup, breaks, changeovers, file verification and a backup.',
      'Budget lines are added up against the total; a budget with no contingency is flagged.',
      'On music and live projects, Stage 1’s source count is compared with the channels you have: more sources than channels is a blocker.',
    ],
    teaches: [
      'A schedule fails by omission: the line check, the break and the backup are simply not on the sheet.',
      'Time, money and equipment are where the earlier stages are tested.',
      'Stage 4: tests Stages 1–3 against the calendar, the clock and the budget.',
    ],
    tryThis: [
      'On a music or live project with 24 sources in Stage 1, enter 16 in “Recording channels available”: BLOCKED — “More sources than the equipment can capture”. Enter 24: the block clears.',
      'In “Blocks of the day” add only a Soundcheck block: “There is a soundcheck but no line check”. Add a Line check block and it clears.',
      '“Total budget available” 5000, two budget lines of 4000 and 1500, neither a Contingency line: “The lines add up to more than the budget” and “No contingency in the budget” both appear.',
    ],
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  technical: {
    seeing: stageSeeing(kicker(5), 'Content Readiness, Location and Acoustics, Sources and Inputs, Microphones and Capture, Signal Flow and Routing, Monitoring and Communication, Synchronization, Session, Files and Data'),
    control: CONTROL,
    changes: [
      'The input list is checked row by row: phantom power against the capture type, two channels for a stereo source, and the total against Stage 4’s channels.',
      'A click or playback nobody can hear, more cue mixes than outputs, or an unsettled clock is flagged.',
      'Nobody having stood in the room is flagged: acoustics and power are found on a visit.',
    ],
    teaches: [
      'The input list is the document everything on the day is patched from.',
      'Most condensers and active ribbons need phantom power (a tube condenser has its own supply); phantom left on for a line, playback or passive ribbon source is flagged.',
      'Stage 5: turns Stages 1–4 into the crew’s working plan.',
    ],
    tryThis: [
      'In “Input list” add Lead vocal, Captured by Condenser microphone, Phantom power Off: “Phantom power does not match the source”. Set it On: it clears.',
      'Add Keys with “Channels this source needs” 2 (stereo pair) and Console channel 9: “A stereo source has been given one channel”. Type 9-10: it clears.',
      'Those two rows need 3 channels. Set Stage 4’s “Recording channels available” to 2, then come back here: BLOCKED. Set it to 3: the block clears.',
    ],
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  readiness: {
    seeing: stageSeeing(kicker(6), 'Rights and Permissions, Safety and Risk, Equipment and Logistics, Testing and Rehearsal, Contingency, Production-Day Documentation, and Final Readiness Review'),
    control: CONTROL,
    changes: [
      'Blockers: a life-threatening hazard with no preventive action or owner, a missing rights item, unsigned rigging or temporary power.',
      'Backups are checked for the switch, the time and the person: one that cannot be reached in time is flagged.',
      'Nobody named to decide whether the production continues is flagged.',
    ],
    teaches: [
      'Ready, ready with approved conditions, or not ready — declared by someone who has actually looked.',
      'Productions fail on the pending permission, the untested backup and the hazard nobody owned.',
      'Stage 6: the last look before the day, reading Stages 1–5 back.',
    ],
    tryThis: [
      'In “Hazard register” add a hazard, Severity if it happens Life-threatening, with no preventive action: BLOCKED. Fill Preventive action and Owner: it clears.',
      'Type a name in “Who decides to continue, pause, simplify, relocate, reschedule or cancel?”: “Nobody is named to decide whether the production continues” leaves.',
    ],
  },
};

export const PREPROD_ACTIVITY_GUIDES: Record<string, ScreenGuide> = {
  'repair-the-brief': {
    seeing: activitySeeing(1, 'Repair the vague brief', 'all three project types'),
    control: ACTIVITY_CONTROL,
    changes: ACTIVITY_CHANGES,
    teaches: [
      'Turning a one-sentence brief into a plan: a real purpose, an audience and platform, one approver, a priced scope, checkable success.',
      'The first questions are mostly not technical; the gear list follows from the answers.',
      'Practice for Stage 1, Define the Project.',
    ],
    tryThis: [
      'All five checks start ○. Open the plan, type one name in “Who approves the finished work?”, come back: “A single approver is named” turns ✓.',
      'Tick a service under “Which services are included?” and enter 2 in “Revision rounds included”: “At least one service is selected and a revision count is entered” turns ✓.',
    ],
  },
  'deliverable-detective': {
    seeing: activitySeeing(2, 'Deliverable detective', 'all three project types'),
    control: ACTIVITY_CONTROL,
    changes: ACTIVITY_CHANGES,
    teaches: [
      'Requests hide contradictions in ordinary words: a stereo file for an immersive room, a clean edit with no standard, approval from a group.',
      'The specification belongs to the destination; “done” belongs to one named person.',
      'Practice for Stage 2, Establish Deliverables.',
    ],
    tryThis: [
      'Seven checks start ○. Set “If a reviewer misses their deadline, what happens?” to any outcome but Not decided: “The late-approval outcome is chosen” turns ✓.',
      'Type one person’s name in “Who gives final approval?”: “One named person replaces \'the board\'” turns ✓.',
    ],
  },
  'who-owns-this-task': {
    seeing: activitySeeing(3, 'Who owns this task?', 'Live performance or event projects'),
    control: ACTIVITY_CONTROL,
    changes: ACTIVITY_CHANGES,
    teaches: [
      'One responsible person per task, one person per authority, and nobody holding two jobs that happen at once.',
      'A list can name every task and still leave the media, the releases and the power unowned.',
      'Practice for Stage 3, People and Responsibilities.',
    ],
    tryThis: [
      'Name a person in “Who is responsible for the recorded media?” and in “Stage manager”: “A media manager is named, and a stage manager on a live show” turns ✓.',
      'Dana holds three jobs at once. Name others as “Monitor engineer” and “Livestream or broadcast operator”: “Nobody holds two jobs that happen at the same time” turns ✓.',
    ],
  },
  'save-the-production': {
    seeing: activitySeeing(4, 'Save the production', 'all three project types'),
    control: ACTIVITY_CONTROL,
    changes: ACTIVITY_CHANGES,
    teaches: [
      'The blocks every crew writes in — line check, changeovers, a break, verification, a backup — and why channels and contingency are settled first.',
      'Omissions are cheap to fix on paper and ruinous on the day.',
      'Practice for Stage 4, Schedule and Resources.',
    ],
    tryThis: [
      'Two checks already pass on the fresh copy: the day fits, and the recording is still in scope. Describe the backup in “How is the backup made and where does it go?”: a third turns ✓.',
      'Stage 1 lists 24 sources. Enter 24 in “Recording channels available” and 1 in “Spare microphones, DIs and cables”: the channels check turns ✓.',
    ],
  },
  'build-the-input-list': {
    seeing: activitySeeing(5, 'Build the input list', 'Music recording and Live performance or event projects'),
    control: ACTIVITY_CONTROL,
    changes: ACTIVITY_CHANGES,
    teaches: [
      'An input list that fits: two channels per stereo source, phantom matched to the source, a DI for bass and acoustic pickup, the click in a cue mix.',
      'Every fix is a decision — what to sum, drop or route — not a purchase.',
      'Practice for Stage 5, Prepare the Creative and Technical Plan.',
    ],
    tryThis: [
      'The fresh list has 17 rows needing 19 channels on a 16-channel system, so “The summed channel count is no more than the channels available” starts ○.',
      'In “Performer cue mixes” add a row with a Who and “click” in “What they need in it”: “At least one cue mix exists that carries the click” turns ✓.',
    ],
  },
  'production-emergency': {
    seeing: activitySeeing(6, 'Production emergency', 'Live performance or event projects'),
    control: ACTIVITY_CONTROL,
    changes: ACTIVITY_CHANGES,
    teaches: [
      'A backup is the switch, the time and the person — not just spare equipment.',
      'An unresolved risk becomes an approved condition only when a named person accepts it in writing.',
      'Practice for Stage 6, Confirm Production Readiness.',
    ],
    tryThis: [
      'Name who decides to continue or stop, and fill “What triggers each response?”: “A decision authority is named, with the triggers written down” turns ✓.',
      'Fill in “The simplest version that still delivers what was promised”: “The simplest version is described, and it still keeps the live recording” turns ✓.',
    ],
  },
};

export const PREPROD_PACKET_GUIDE: ScreenGuide = {
  seeing: [
    'The Production Packet: the whole plan as one document. The PDF holds the title, verdict and all below SHARE AS PDF; the type and WHAT’S LEFT stay off it.',
    'At the top: project, type, verdict. WHAT’S LEFT: every open item by stage, blocked stages and blockers first.',
    'Below it: Revision, Revision date, Prepared by, Status; any MUST BE RESOLVED BEFORE PROCEEDING and ACCEPTED CONDITIONS; every stage’s answers.',
  ],
  control: [
    'Tap a WHAT’S LEFT row — BLOCKER, REQUIRED QUESTION or TO LOOK AT — to open that stage at that question (marked with an amber edge) or at its findings.',
    'SHARE AS PDF makes the PDF and records the next revision number. Where printing is not available the screen says so: this page is then the whole packet.',
    `‹ goes back. ${CHIPS_LINE}`,
  ],
  changes: [
    'Unanswered questions print as “Not decided — required” or “Not decided”; a skip prints “Not applicable —” and its reason. Gaps are printed, never hidden.',
    'Revision reads “0 — not exported yet” until the first export; each export prints the next number.',
    'Status is the verdict. Prepared by is Stage 1’s producer or project lead, or Unattributed.',
  ],
  teaches: [
    'A planning document shows its own gaps and conditions, so the people relying on it know what is not settled.',
    'A revision number tells everyone which copy is current.',
    'The packet is where the lab ends: it is what you leave with.',
  ],
  tryThis: [
    'On a new project, WHAT’S LEFT opens with STAGE 1 · DEFINE THE PROJECT, its first row a REQUIRED QUESTION: Project name. Tap it: Stage 1 opens at that question.',
    'Type a name in Stage 1’s “Producer or project lead”, then come back: Prepared by changes from Unattributed to that name.',
    'Add a life-threatening hazard with no action in Stage 6: STAGE 6 · CONFIRM PRODUCTION READINESS jumps to the top of WHAT’S LEFT, its BLOCKER first.',
  ],
};
