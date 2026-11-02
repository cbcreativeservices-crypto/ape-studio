/**
 * Audio Post-Production — "explain this screen" content (owner 2026-10-31,
 * Screen Guide rollout). The lab's screens are the shared production screens
 * (see productionScreenGuideParts.ts); this file says what Post-Production's
 * home, eight stages (in three chapters), eight exercises and Delivery
 * Package are about.
 *
 *   POSTPROD_START_GUIDE     — the home with no project yet (START A PROJECT)
 *   POSTPROD_HOME_GUIDE      — the home with a project open
 *   POSTPROD_STAGE_GUIDES    — one per stage, keyed by stageId
 *   POSTPROD_ACTIVITY_GUIDES — one per exercise, keyed by activityId
 *   POSTPROD_PACKET_GUIDE    — the Delivery Package screen
 *
 * Every field label, option, section title and finding title quoted here is
 * read from features/production/postprod/stage*.data.ts, and every TRY THIS
 * outcome — including each loudness and true-peak number — is what
 * readStage / readProject / checkActivity produce for those answers:
 * test/screenGuide_postprod_20261031.test.ts replays each one. Change a label,
 * an option, a rule or an exercise seed → update the guide here.
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

const kicker = (n: number) => `POST-PRODUCTION · STAGE ${n}`;
const CONTROL = stageControl('Delivery Package');

export const POSTPROD_START_GUIDE: ScreenGuide = {
  seeing: [
    'The Audio Post-Production home: everything between a folder of recordings and a delivery somebody has accepted.',
    'START A PROJECT: three project types — Music recording, Podcast or spoken word, Live performance or event.',
    'Its note: what you make changes the questions, the documents and the problems; the process underneath stays the same.',
  ],
  control: [
    'Tap a project type to start a project of that kind. It is saved on this phone, named after its type, and opens at once.',
    'Once a project is open, this screen shows its readiness, THE EIGHT STAGES in three chapters, the EXERCISES and the Delivery Package; + NEW PROJECT there starts another project of any type.',
    `‹ leaves the lab. ${CHIPS_LINE}`,
  ],
  changes: [
    'The type decides which questions appear: Frame rate and Start timecode are asked on podcast and live projects, not on music ones.',
    'Stage 4 edits speech on podcast and live projects (Speech and Dialogue Editing) and music on music and live ones (Music Editing and Comping).',
    'Some exercises fit only some types, so the EXERCISES list changes with the project.',
  ],
  teaches: [
    'Post-production: organize, edit, build, mix, finish to the specification, deliver, and archive.',
    'It follows Audio Pre-Production in Production Workflow: planning before the recording, finishing after it.',
    'Every stage asks what a real handover needs written down.',
  ],
  tryThis: [
    'Tap Podcast or spoken word: the project opens with a readiness score of 0 / 100, Not Approved, and NEXT OUTSTANDING points at Project name in Stage 1 · Receive the Project.',
    'Then tap + NEW PROJECT and pick Music recording: that project’s Stage 1 delivery specification has no Frame rate question.',
  ],
};

export const POSTPROD_HOME_GUIDE: ScreenGuide = {
  seeing: [
    'Your project: its name, its type, DUPLICATE and DELETE. Chips above switch projects; the last, + NEW PROJECT, starts another.',
    'PICK UP WHERE YOU LEFT OFF: the stage you last answered in. NEXT OUTSTANDING: the most pressing open item.',
    'PRODUCTION READINESS: the verdict, a score out of 100, a bar of required decisions. THE EIGHT STAGES under three CHAPTER headings, each with a dot, a % and its state.',
  ],
  control: [
    'Tap the name to rename it. DUPLICATE copies the answers but not accepted conditions; DELETE asks first, then removes it from this phone. + NEW PROJECT, then a type, starts another.',
    'Tap a stage, PICK UP WHERE YOU LEFT OFF or NEXT OUTSTANDING to open that stage — NEXT OUTSTANDING lands on the exact question.',
    'Tap a red blocker under PRODUCTION READINESS to accept it on the record: ACCEPT A CONDITION asks who and why, then RECORD IT.',
    'EXERCISES opens a broken practice project to repair. OPEN THE DELIVERY PACKAGE shows the whole project as one document.',
    `‹ leaves the lab. ${CHIPS_LINE}`,
  ],
  changes: [
    'The score counts decisions made, not screens opened.',
    'Flagged findings cost up to 2 points each, 20 max; an open blocker keeps it under 100 and Not Approved.',
    'Fixed or accepted, a blocker clears; accepted ones go to PROCEEDING WITH ACCEPTED CONDITIONS and print in the package.',
    'Approved With Documented Conditions: every required decision made, no blocker, but a condition accepted or something flagged.',
  ],
  teaches: [
    'A delivery is approved when its decisions are made and its blockers dealt with — a high score cannot outrank a blocker.',
    'Shipping with a known issue is a documented decision by a named person, never a silent one.',
    'Three chapters: Prepare and Edit, Build and Mix, Finish and Deliver.',
  ],
  tryThis: [
    'On a fresh project, set Stage 2’s “Do the source cards or drives still hold the material” to No, the sources have been cleared. This screen: ONE THING BLOCKS THIS PROJECT; Stage 2 reads BLOCKED.',
    'Tap that blocker, give a name and a reason, RECORD IT: it moves to PROCEEDING WITH ACCEPTED CONDITIONS and Stage 2 is no longer BLOCKED.',
    'Answer any question in a stage and come back: PICK UP WHERE YOU LEFT OFF appears, naming that stage.',
  ],
};

export const POSTPROD_STAGE_GUIDES: Record<string, ScreenGuide> = {
  // ── 1 ─────────────────────────────────────────────────────────────────────
  brief: {
    seeing: stageSeeing(kicker(1), 'The Handoff, What You Were Given, and What You Were Not, Creative Direction, and The Delivery Specification'),
    control: CONTROL,
    changes: [
      'Flagged: an assumed specification, nobody who can end the revision round, missing material nobody is chasing.',
      'The loudness numbers are checked for sense: a true-peak ceiling above 0 dBTP, or a tolerance with no target, is flagged.',
      'Frame rate left as Not yet specified is a blocker: picture work needs an agreed frame rate.',
    ],
    teaches: [
      'Post-production starts by writing down what you were given, what the finished thing must be, and what nobody has told you yet.',
      'The specification sets every later number: sample rate, bit depth, loudness, versions. Integrated loudness (LUFS) averages the whole program; true peak (dBTP) is the highest peak, even between samples.',
      'Stage 1: Stages 2–8 are checked against it.',
    ],
    tryThis: [
      'Set “Where the specification came from” to I am assuming the usual: “You are working from an assumed specification”. Pick A written delivery specification: it clears.',
      'Enter 1 in “Maximum true peak”: “That true-peak ceiling looks wrong”. Enter -1: it clears.',
      'On a podcast or live project set Frame rate to Not yet specified: BLOCKED. Pick No picture on this job: it clears, and Start timecode hides with a note saying why.',
    ],
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  media: {
    seeing: stageSeeing(kicker(2), 'Protect the Originals, Media Inventory, Copy Verification, and Technical Compatibility'),
    control: CONTROL,
    changes: [
      'Sources wiped or reused before the copy was proven is a blocker; a file count alone never clears it.',
      'A file count is not verification: a checksum (a fingerprint of every byte) catches any change; equal sizes catch truncation; full playback catches audible faults.',
      'One copy is not a backup; mixed sample rates or duplicate filenames are flagged. Corrupted, truncated or missing files with no plan are a blocker.',
    ],
    teaches: [
      'Protect the originals, prove the copy, then record what came in.',
      'Verification compares content, not names.',
      'Stage 2: comes before any editing, while the source cards still hold the material.',
    ],
    tryThis: [
      'Set “Do the source cards or drives still hold the material” to No, the sources have been cleared: BLOCKED — “Sources were cleared before the copy was proven”.',
      'Now tick Checksums match under “Verification method” and pick Every file under “How much was verified”: the block clears.',
      'Untick Checksums match and tick only File count matches: BLOCKED returns, and “Counting files is not verifying them” appears.',
    ],
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  session: {
    seeing: stageSeeing(kicker(3), 'Session Configuration, Folders and Tracks, Naming and Versions, and Synchronization'),
    control: CONTROL,
    changes: [
      'The session is checked against Stage 1’s delivery: a different sample rate or a shallower bit depth is flagged; a different frame rate is a blocker.',
      'Recorders on their own clocks, sync checked only at the start, or a drift fix that does not match its cause are flagged.',
      'No folder structure, no track structure, or a naming rule that is only a hope is flagged.',
    ],
    teaches: [
      'A session is a set of assumptions made once and trusted for weeks: rate, depth, frame rate and start time come first.',
      'Free-running clocks drift, so sync is checked at the END of the longest file.',
      'Stage 3: builds on Stages 1–2; the edit in Stage 4 depends on it.',
    ],
    tryThis: [
      'Set Stage 1’s “Delivery sample rate” to 48 kHz, then “Session sample rate” here to 44.1 kHz: “The session rate does not match the delivery rate”. Pick 48 kHz: it clears.',
      'Set “How many independent recorders” to Several, each running on its own clock, and the end-of-file sync check to No — only at the start: both are flagged.',
      'Change that sync check to Yes: both findings clear.',
    ],
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  edit: {
    seeing: stageSeeing(kicker(4), 'Source Review and Selection, Assembly, Speech and Dialogue Editing (podcast and live), Music Editing and Comping (music and live), and Cleanup and Restoration'),
    control: CONTROL,
    changes: [
      'Flagged: assembling material nobody has reviewed, takes chosen on cleanliness alone, alternates removed.',
      'Speech edited with no room tone, or edits never checked for the usual faults, is flagged; so is every breath removed.',
      'Repairs are checked for a before-and-after comparison; heavy repair on a problem nobody would notice is flagged too.',
    ],
    teaches: [
      'Choose takes on performance, keep the alternates, and make the joins invisible.',
      'A repair can become the new damage: judge it against the original, level-matched.',
      'Stage 4: the end of Chapter 1; Chapter 2 builds the sound on this edit.',
    ],
    tryThis: [
      'Set “Are the alternates still available” to Removed: “The alternate takes have been removed”. Pick Kept in the session, muted or hidden: it clears.',
      'On a podcast or live project set “Is there usable room tone” to None: “Speech edited with no room tone to fill the gaps” appears.',
      'There, set “What happens to breaths” to Removed: “Every breath has been removed” appears.',
    ],
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  build: {
    seeing: stageSeeing(kicker(5), 'Replacement and Pickup Recording, Atmosphere, Effects and Design, Music Integration, and Pitch, Timing and Performance Correction'),
    control: CONTROL,
    changes: [
      'Each addition is judged against what was there: a replacement with no matching plan, or judged only on its own, is flagged.',
      'Material with rights marked Missing or Expired is a blocker; added material with no rights status is flagged.',
      'Altering a performance without an agreement, or heavy correction with nothing protected, is flagged.',
    ],
    teaches: [
      'Write down why each addition is made before making it.',
      'A production can be improved past being itself: ambience that never changes, tuning that removes the intent.',
      'Stage 5: opens Chapter 2, working on Stage 4’s edit.',
    ],
    tryThis: [
      'Set “Has correction been agreed” to Not discussed with anyone and tick Pitch under “What is being corrected”: a finding appears. Pick Yes — agreed with the performer or producer: it clears.',
      'Set “Does the atmosphere run continuously through the edits” to No, attached to individual clips: “Atmosphere attached to clips rather than laid under them”.',
      'Set “Do the music edits respect the phrasing” to Cut to length wherever it landed: “Music cut to a duration rather than to a phrase”.',
    ],
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  mix: {
    seeing: stageSeeing(kicker(6), 'Preparing to Mix, Mix Architecture, The Mix, Automation, Format and Translation, and Prints and Stems'),
    control: CONTROL,
    changes: [
      'Blockers: stems that do not add up to the mix, or something in the mix that never reaches the stems.',
      'Flagged: mixing in the edit session, comparisons that are not level-matched, a mix heard on one system only.',
      'A send with nowhere to arrive, or heavy master processing over printed stems, is flagged.',
    ],
    teaches: [
      'Many problems that sound like balance problems are routing problems in disguise.',
      'Prove the stems recombine into the approved mix. A null test plays them against the mix with polarity flipped: if they match, the sum is silence.',
      'Stage 6: ends Chapter 2; Stage 7 finishes from this print.',
    ],
    tryThis: [
      'Set “Do the stems recombine into the mix” to No, they do not match: BLOCKED — “The stems do not add up to the mix”. Pick Yes — tested and it cancels: it clears.',
      'Set “Was a new session version made for the mix” to No — mixing in the edit session: “Mixing in the edit session” appears.',
      'Tick Headphones and A phone under “Checked on other systems”: “The mix has only been heard on one system” leaves the list.',
    ],
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  finish: {
    seeing: stageSeeing(kicker(7), 'Finishing Strategy, Loudness and Level, Mastering and Processing, Technical Quality Control, Creative and Editorial Review, Accessibility and Alternate Audiences'),
    control: CONTROL,
    changes: [
      'Measurements are checked against Stage 1: loudness outside target ± tolerance, or true peak above the ceiling, is a blocker.',
      'No full playback of the actual deliverable, or an open delivery-blocking QC issue, is a blocker.',
      'Dither applied more than once, or processing with no stated purpose, is flagged.',
    ],
    teaches: [
      'Know the number you must hit, match levels before comparing, and listen to the file itself.',
      'A file can pass every automated check and still be unlistenable.',
      'Stage 7: opens Chapter 3, starting from Stage 6’s approved mix.',
    ],
    tryThis: [
      'In Stage 1’s loudness target, tolerance and true-peak fields type -16, 1 and -1. Here, enter -13.2 LUFS and 0.4 dBTP as measured: two blockers. Enter -16.4 and -1.2: both clear.',
      'The window is target ± tolerance: -17 still passes, -17.1 brings back “The program misses its loudness target”.',
      'Set “Full uninterrupted playback of the actual deliverable” to Listened in the session, not the export: BLOCKED.',
    ],
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  deliver: {
    seeing: stageSeeing(kicker(8), 'Client Review and Revisions, Exports and Deliverables, Delivery Verification, and Archive'),
    control: CONTROL,
    changes: [
      'Blockers: revising over the approved version, files going out without approval, a deliverable that misses the specification.',
      'Files sent that nobody has opened is a blocker too: an upload is not a delivery.',
      'An archive with one copy, never restored, or unable to rebuild the project is flagged.',
    ],
    teaches: [
      'Exported, uploaded, received, verified and accepted are different things; only accepted means delivered.',
      'The approved version is kept safe before any revision round.',
      'Stage 8: the last stage; the Delivery Package records it all.',
    ],
    tryThis: [
      'Set “Is the previously approved version preserved” to No: BLOCKED — “Revisions are being made over the approved version”. Pick Yes — saved as a separate version and print: it clears.',
      'Enter 2 in “How many archive copies exist”, leaving “Where they are” empty: “One copy is not an archive” appears — a count with no place proves nothing. Fill in “Where they are”: it clears.',
      'Tick items under “The archive contains” and set “Has a restore been tested” to Only the file list was checked: “The archive has never been restored”.',
    ],
  },
};

export const POSTPROD_ACTIVITY_GUIDES: Record<string, ScreenGuide> = {
  'clarify-the-handoff': {
    seeing: activitySeeing(1, 'Clarify the handoff', 'all three project types'),
    control: ACTIVITY_CONTROL,
    changes: ACTIVITY_CHANGES,
    teaches: [
      'Write down what you were given and what you were not told, then ask the people who can answer — while answers are still cheap.',
      'The open-questions list is the real deliverable of the first stage.',
      'Practice for Stage 1, Receive the Project.',
    ],
    tryThis: [
      'Six checks start ○. Type one name in “Who approves the final”: “One named person is recorded as the approval authority” turns ✓.',
      'Name the destination in “Where the files go”: “A delivery destination is named” turns ✓.',
    ],
  },
  'safe-ingest': {
    seeing: activitySeeing(2, 'Safe ingest', 'all three project types'),
    control: ACTIVITY_CONTROL,
    changes: ACTIVITY_CHANGES,
    teaches: [
      'Lock the originals, verify by content, and settle duplicate or truncated files before the cards are cleared.',
      'A file at a different sample rate is not a fault: it needs a conversion decision, made once, on purpose.',
      'Practice for Stage 2, Ingest and Verify the Media.',
    ],
    tryThis: [
      'Set “Are the originals protected from writing” to Yes — permissions or hardware lock: “The originals are protected from writing” turns ✓.',
      'Set “How rate or format conversion is handled” to Converted once on ingest, originals kept: “A conversion policy is chosen for the mixed sample rates” turns ✓.',
    ],
  },
  'restore-synchronisation': {
    seeing: activitySeeing(3, 'Restore synchronization', 'Podcast or spoken word and Live performance or event projects'),
    control: ACTIVITY_CONTROL,
    changes: ACTIVITY_CHANGES,
    teaches: [
      'Diagnose before you cure: a constant offset is moved; a steady drift is stretched or reconformed.',
      'Free-running clocks drift; only a check at the end of the file shows it.',
      'Practice for Stage 3, Build and Synchronize the Session.',
    ],
    tryThis: [
      'Set “Was sync checked at the END of the longest file” to Yes: “Sync is checked at the end of the longest file” turns ✓.',
      'Tick Slate or clap under “What you are synchronizing from”: “A synchronization source beyond doing it by hand is recorded” turns ✓.',
    ],
  },
  'repair-without-overprocessing': {
    seeing: activitySeeing(4, 'Repair without overprocessing', 'Podcast or spoken word and Live performance or event projects'),
    control: ACTIVITY_CONTROL,
    changes: ACTIVITY_CHANGES,
    teaches: [
      'Effort should follow severity: a barely audible noise does not need a re-record.',
      'Repairs are judged level-matched, against what is removed, in context.',
      'Practice for Stage 4, Select, Assemble and Edit.',
    ],
    tryThis: [
      'Set “What happens to breaths” to Kept — reduced only where distracting: “Breaths are no longer being removed wholesale” turns ✓.',
      'Write the order of your repairs in “Processing order”: “A processing order is written down” turns ✓.',
    ],
  },
  'add-without-erasing': {
    seeing: activitySeeing(5, 'Add without erasing', 'Podcast or spoken word and Live performance or event projects'),
    control: ACTIVITY_CONTROL,
    changes: ACTIVITY_CHANGES,
    teaches: [
      'Each addition changes what is around it: rights, a matched replacement, continuous atmosphere, phrasing, agreed correction.',
      'A rights gap passes every technical check and still stops a program.',
      'Practice for Stage 5, Build the Sound.',
    ],
    tryThis: [
      'Pick Yes, laid as continuous beds for the atmosphere and Yes — length, level or layering varies under “Is repeated material varied”: the atmosphere check turns ✓.',
      'Tick Sidechain ducking under “How music and speech share the space”: “Something manages the relationship between music and speech” turns ✓.',
    ],
  },
  'route-the-mix': {
    seeing: activitySeeing(6, 'Route the mix', 'Music recording and Live performance or event projects'),
    control: ACTIVITY_CONTROL,
    changes: ACTIVITY_CHANGES,
    teaches: [
      'Three faults that make no sound: a group missing from the stems, a send with no return, heavy master processing over the stems.',
      'A null test at the point of printing catches what listening does not.',
      'Practice for Stage 6, Prepare, Mix and Print.',
    ],
    tryThis: [
      'Set “Processing on the master bus” to Left for the finishing stage: “Master processing is no longer heavy with stems printed beneath it” turns ✓.',
      'Set “Do the stems recombine into the mix” to Yes — tested and it cancels: “The stems recombine into the mix, or the difference is described” turns ✓.',
    ],
  },
  'meet-the-specification': {
    seeing: activitySeeing(7, 'Meet the specification', 'Podcast or spoken word and Live performance or event projects'),
    control: ACTIVITY_CONTROL,
    changes: ACTIVITY_CHANGES,
    teaches: [
      'Heavy limiting made this file too loud and too flat: ease it off, then set the level with plain gain.',
      'Measure the exported deliverable, not the session.',
      'Practice for Stage 7, Finish to Specification.',
    ],
    tryThis: [
      'The fresh copy measures -13.2 LUFS and 0.4 dBTP against -16 ± 1 LU and -1 dBTP, so the specification check starts ○.',
      'Set Dither to Once, at the final depth reduction: “Dither is decided rather than left unconsidered, and applied at most once” turns ✓.',
      'Set “What was measured” to The exported deliverable: “The measurement is taken from the exported deliverable” turns ✓.',
    ],
  },
  'the-upload-succeeded': {
    seeing: activitySeeing(8, 'The upload succeeded, but delivery failed', 'Music recording and Live performance or event projects'),
    control: ACTIVITY_CONTROL,
    changes: ACTIVITY_CHANGES,
    teaches: [
      'Exported, uploaded, received, verified and accepted are five different things.',
      'The deliverables list comes from the specification, not from what the session contains.',
      'Practice for Stage 8, Deliver and Archive.',
    ],
    tryThis: [
      'Set “Is the previously approved version preserved” to Yes — saved as a separate version and print: “The approved version is preserved as a session and a print” turns ✓.',
      'Set “Final approval” to Approved and write who approved what in “Approval record”: “The approval is no longer pending, with a record of who approved what” turns ✓.',
    ],
  },
};

export const POSTPROD_PACKET_GUIDE: ScreenGuide = {
  seeing: [
    'The Delivery Package: the whole project as one document. The PDF holds the title, verdict and all below SHARE AS PDF; the type and WHAT’S LEFT stay off it.',
    'At the top: project, type, verdict. WHAT’S LEFT: every open item by stage, blocked stages and blockers first.',
    'Below it: Revision, Revision date, Prepared by, Status; any MUST BE RESOLVED BEFORE PROCEEDING and ACCEPTED CONDITIONS; every stage’s answers.',
  ],
  control: [
    'Tap a WHAT’S LEFT row — BLOCKER, REQUIRED QUESTION or TO LOOK AT — to open that stage at that question (marked with an amber edge) or at its findings.',
    'SHARE AS PDF makes the PDF and records the next revision number. Where printing is not available the screen says so: this page is then the whole package.',
    `‹ goes back. ${CHIPS_LINE}`,
  ],
  changes: [
    'Unanswered questions print as “Not decided — required” or “Not decided”; a skip prints “Not applicable —” and its reason. Gaps are printed, never hidden.',
    'Revision reads “0 — not exported yet” until the first export; each export prints the next number.',
    'Status is the verdict. Prepared by is Stage 1’s post-production supervisor, or Unattributed.',
  ],
  teaches: [
    'A delivery record shows its own gaps and conditions, so whoever receives it knows what is not settled.',
    'A revision number tells everyone which copy is current.',
    'The package is where the lab ends: it is what you leave with.',
  ],
  tryThis: [
    'On a new project, WHAT’S LEFT opens with STAGE 1 · RECEIVE THE PROJECT, its first row a REQUIRED QUESTION: Project name. Tap it: Stage 1 opens at that question.',
    'Type a name in Stage 1’s “Post-production supervisor”, then come back: Prepared by changes from Unattributed to that name.',
    'Set Stage 8’s approved version to No: STAGE 8 · DELIVER AND ARCHIVE jumps to the top of WHAT’S LEFT, its BLOCKER first.',
  ],
};
