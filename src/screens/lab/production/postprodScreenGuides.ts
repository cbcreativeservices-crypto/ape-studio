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
  activityControl,
  CHIPS_LINE,
  activitySeeing,
  stageControl,
  stageSeeing,
} from './productionScreenGuideParts';

const kicker = (n: number) => `POST-PRODUCTION · STAGE ${n}`;
const CONTROL = stageControl('Delivery Package', 'PROJECT');

export const POSTPROD_START_GUIDE: ScreenGuide = {
  intro: {
    learning: 'What post-production covers, from a folder of recordings to a delivery somebody has accepted, and why the kind of project changes the questions but not the process.',
    start: 'Tap Podcast or spoken word to start a project, and see where NEXT OUTSTANDING points. Then tap + NEW PROJECT and pick Music recording to compare the two.',
  },
  seeing: [
    'This is the Audio Post-Production home. The lab covers everything between a folder of recordings and a delivery somebody has accepted.',
    'Under START A PROJECT, you pick one of three project types: Music recording, Podcast or spoken word, or Live performance or event.',
    'Read the note under them: what you make changes the questions, the documents and the problems, but the process underneath stays the same.',
  ],
  control: [
    'Tap a project type to start that kind of project. It’s saved on this phone, named after its type, and opens at once.',
    'Once a project is open, check its readiness, work through THE EIGHT STAGES in three chapters, try the EXERCISES and build the Delivery Package. + NEW PROJECT starts another project of any type.',
    `‹ leaves the lab. ${CHIPS_LINE}`,
  ],
  changes: [
    'The type you pick decides which questions appear. Podcast and live projects ask for Frame rate and Start timecode; music projects don’t.',
    'Stage 4 edits speech on podcast and live projects (Speech and Dialogue Editing) and music on music and live projects (Music Editing and Comping); live projects get both.',
    'Some exercises fit only some project types, so the EXERCISES list changes with the project you open.',
  ],
  teaches: [
    'Post-production is a chain of jobs in order: organize, edit, build, mix, finish to the specification, deliver, and archive.',
    'Pre-production plans the work before anything is recorded; post-production finishes it after the recording stops.',
    'At every handover, someone takes over your work without you there to explain it, so each stage asks what has to be written down.',
  ],
  tryThis: [
    'Tap Podcast or spoken word. The project opens at a readiness score of 0 / 100, Not Approved, and NEXT OUTSTANDING points at Project name in Stage 1 · Receive the Project.',
    'Now tap + NEW PROJECT and pick Music recording. In that project’s Stage 1, the delivery specification has no Frame rate question.',
  ],
};

export const POSTPROD_HOME_GUIDE: ScreenGuide = {
  intro: {
    learning: 'How a delivery earns approval: every required decision made and every blocker fixed or accepted by a named person. A high score never outranks a blocker.',
    start: 'Read the verdict under PRODUCTION READINESS, then tap NEXT OUTSTANDING to land on the most pressing open question. Later, tap a red blocker to see how a condition is accepted on the record.',
  },
  seeing: [
    'Your project is at the top: name, type, DUPLICATE, DELETE. Chips above switch projects; the last, + NEW PROJECT, starts one.',
    'PICK UP WHERE YOU LEFT OFF names the stage you last answered in; NEXT OUTSTANDING, the most pressing open item.',
    'PRODUCTION READINESS: the verdict, a score out of 100, a bar of required decisions. THE EIGHT STAGES sit under three CHAPTER headings, each with a dot, a % and its state.',
  ],
  control: [
    'Tap the name to rename the project. DUPLICATE copies the answers but not accepted conditions. DELETE asks first, then removes it from this phone. + NEW PROJECT, then a type, starts another.',
    'Tap a stage, PICK UP WHERE YOU LEFT OFF or NEXT OUTSTANDING to open that stage. NEXT OUTSTANDING lands on the exact question.',
    'Tap a red blocker under PRODUCTION READINESS to accept it on the record: ACCEPT A CONDITION asks who and why, then RECORD IT.',
    'EXERCISES opens a broken practice project to repair. OPEN THE DELIVERY PACKAGE shows the whole project as one document.',
    `‹ leaves the lab. ${CHIPS_LINE}`,
  ],
  changes: [
    'The score counts decisions made, not screens opened.',
    'Flagged findings cost up to 2 points each, 20 max. Open blockers keep the score under 100 and Not Approved.',
    'A blocker clears once fixed or accepted; accepted ones go to PROCEEDING WITH ACCEPTED CONDITIONS and print in the package.',
    'Approved With Documented Conditions: all required decisions made, no blocker, but a condition accepted or something flagged.',
  ],
  teaches: [
    'A delivery is approved when its decisions are made and its blockers dealt with. A high score cannot outrank a blocker.',
    'Shipping with a known issue is a documented decision by a named person, never a silent one.',
    'Post-production runs in three chapters, each working on what the last one handed over: Prepare and Edit, Build and Mix, Finish and Deliver.',
  ],
  tryThis: [
    'On a fresh project, set Stage 2’s “Do the source cards or drives still hold the material” to No, the sources have been cleared. Back here: ONE THING BLOCKS THIS PROJECT; Stage 2 reads BLOCKED.',
    'Tap that blocker, give a name and a reason, then RECORD IT. It moves to PROCEEDING WITH ACCEPTED CONDITIONS, and Stage 2 is no longer BLOCKED.',
    'Answer any question in a stage and come back. PICK UP WHERE YOU LEFT OFF now appears, naming that stage.',
  ],
};

export const POSTPROD_STAGE_GUIDES: Record<string, ScreenGuide> = {
  // ── 1 ─────────────────────────────────────────────────────────────────────
  brief: {
    intro: {
      learning: 'Why post-production starts by writing down what you were given, what the delivery must be, and what nobody has told you yet: every later number comes from that specification.',
      start: 'Open The Delivery Specification. Set “Where the specification came from” to I am assuming the usual and read the finding. Then enter 1 in “Maximum true peak”.',
    },
    seeing: stageSeeing(kicker(1), 'The Handoff, What You Were Given, and What You Were Not, Creative Direction, and The Delivery Specification'),
    control: CONTROL,
    changes: [
      'Three things are flagged here: working from an assumed specification, nobody who can end the revision round, and missing material nobody is chasing.',
      'The loudness numbers are checked for sense. A true-peak ceiling above 0 dBTP is flagged, and so is a tolerance with no target.',
      'Leaving Frame rate as Not yet specified is a blocker: picture work needs an agreed frame rate to keep sound and picture in sync.',
    ],
    teaches: [
      'Post-production starts by writing down what you were given, what the finished thing must be, and what nobody has told you yet.',
      'The specification sets every later number: sample rate, bit depth, loudness, versions. Integrated loudness (LUFS) is a gated average of the whole program; true peak (dBTP) is the highest peak, even between samples.',
      'Stages 2–8 are all checked against this specification.',
    ],
    tryThis: [
      'Set “Where the specification came from” to I am assuming the usual: “You are working from an assumed specification” appears. Pick A written delivery specification: it clears.',
      'Enter 1 in “Maximum true peak” and “That true-peak ceiling looks wrong” appears: a ceiling above 0 dBTP would allow clipping. Enter -1: it clears.',
      'On a podcast or live project, set Frame rate to Not yet specified: BLOCKED. Pick No picture on this job: it clears, and Start timecode hides with a note saying why.',
    ],
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  media: {
    intro: {
      learning: 'Why the originals are protected first, and why a copy is proven by its content (a checksum, not a file count) before the source cards are cleared.',
      start: 'Set “Do the source cards or drives still hold the material” to No, the sources have been cleared, and watch the stage block. Then check Checksums match under “Verification method”.',
    },
    seeing: stageSeeing(kicker(2), 'Protect the Originals, Media Inventory, Copy Verification, and Technical Compatibility'),
    control: CONTROL,
    changes: [
      'Wiping or reusing the sources before the copy is proven is a blocker; a file count alone never clears it.',
      'A checksum (a fingerprint of every byte) catches any change, matching sizes catch a file cut short, and full playback catches audible faults.',
      'One copy is not a backup. Mixed sample rates or duplicate filenames are flagged; corrupted, truncated or missing files with no plan are a blocker.',
    ],
    teaches: [
      'Protect the originals, prove the copy, then record what came in.',
      'Verification compares content, not names: two files can share a name and a size and still differ inside.',
      'Ingest comes before any editing, while the source cards still hold the material. Once they’re cleared, a bad copy can’t be replaced.',
    ],
    tryThis: [
      'Set “Do the source cards or drives still hold the material” to No, the sources have been cleared: BLOCKED — “Sources were cleared before the copy was proven”.',
      'Now check Checksums match under “Verification method” and pick Every file under “How much was verified”: the block clears.',
      'Uncheck Checksums match and check only File count matches: BLOCKED returns, and “Counting files is not verifying them” appears.',
    ],
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  session: {
    intro: {
      learning: 'Why the session’s sample rate, bit depth, frame rate and start time must match the delivery, and why sync is checked at the end of the longest file.',
      start: 'Set Stage 1’s “Delivery sample rate” to 48 kHz. Back here, set “Session sample rate” to 44.1 kHz and read the finding, then pick 48 kHz.',
    },
    seeing: stageSeeing(kicker(3), 'Session Configuration, Folders and Tracks, Naming and Versions, and Synchronization'),
    control: CONTROL,
    changes: [
      'Your session is checked against Stage 1’s delivery: a different sample rate or a shallower bit depth is flagged, and a different frame rate is a blocker.',
      'Flagged: recorders on their own clocks, sync checked only at the start, or a drift fix that doesn’t match its cause.',
      'A missing folder structure or track structure is flagged, and so is a naming rule with no pattern, like “final” or “newest”.',
    ],
    teaches: [
      'A session is a set of assumptions made once and trusted for weeks: rate, depth, frame rate and start time come first.',
      'Recorders on free-running clocks slowly drift apart, so sync is checked at the END of the longest file, where the drift is largest.',
      'The edit is built on this session, so a wrong rate or frame rate here is carried into every cut that follows.',
    ],
    tryThis: [
      'Set Stage 1’s “Delivery sample rate” to 48 kHz, then “Session sample rate” here to 44.1 kHz: “The session rate does not match the delivery rate”. Pick 48 kHz: it clears.',
      'Set “How many independent recorders” to Several, each running on its own clock, and the end-of-file sync check to No — only at the start: both are flagged.',
      'Change that sync check to Yes: both findings clear. Separate clocks are fine as long as the end check is there to catch any drift.',
    ],
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  edit: {
    intro: {
      learning: 'How an edit stays invisible: takes chosen on performance, alternates kept, speech gaps filled with room tone, and every repair judged against the original.',
      start: 'Set “Are the alternates still available” to Removed and read the finding. On a podcast or live project, set “Is there usable room tone” to None.',
    },
    seeing: stageSeeing(kicker(4), 'Source Review and Selection, Assembly, Speech and Dialogue Editing (podcast and live), Music Editing and Comping (music and live), and Cleanup and Restoration'),
    control: CONTROL,
    changes: [
      'Flagged: assembling material nobody has reviewed, choosing takes on cleanliness alone, and removing the alternates.',
      'Flagged too: speech edited with no room tone, edits never checked for the usual faults, and every breath removed.',
      'Repairs need a before-and-after comparison; heavy repair on a problem nobody would notice is flagged too.',
    ],
    teaches: [
      'Choose takes on performance, keep the alternates, and make the joins invisible.',
      'A repair can become the new damage: judge it against the original, level-matched (at the same loudness).',
      'Room tone, the quiet sound of the room, fills the gaps between cuts. Without it, edited speech drops into dead silence.',
    ],
    tryThis: [
      'Set “Are the alternates still available” to Removed: “The alternate takes have been removed”. Pick Kept in the session, muted or hidden: it clears.',
      'On a podcast or live project, set “Is there usable room tone” to None: “Speech edited with no room tone to fill the gaps” appears.',
      'There, set “What happens to breaths” to Removed: “Every breath has been removed” appears. Natural speech has breaths.',
    ],
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  build: {
    intro: {
      learning: 'Why every addition (a pickup, atmosphere, music or pitch correction) is judged against what was there, cleared for rights, and agreed with the performer.',
      start: 'Set “Has correction been agreed” to Not discussed with anyone and check Pitch under “What is being corrected”. Read the finding, then pick Yes — agreed with the performer or producer.',
    },
    seeing: stageSeeing(kicker(5), 'Replacement and Pickup Recording, Atmosphere, Effects and Design, Music Integration, and Pitch, Timing and Performance Correction'),
    control: CONTROL,
    changes: [
      'Each addition is judged against what was there. A replacement with no plan to match it, or one judged only on its own, is flagged.',
      'Material with rights marked Missing or Expired is a blocker; added material with no rights status is flagged.',
      'Altering a performance without an agreement is flagged, and so is heavy correction with nothing chosen in “What is being protected”.',
    ],
    teaches: [
      'Write down why each addition is made before making it.',
      'A production can be over-improved until it stops sounding like itself: ambience that never changes, or tuning that removes what the performer meant.',
      'Atmosphere runs as a continuous bed under the edits, and music is cut on a phrase, so neither one breaks at every edit.',
    ],
    tryThis: [
      'Set “Has correction been agreed” to Not discussed with anyone and check Pitch under “What is being corrected”: a finding appears. Pick Yes — agreed with the performer or producer: it clears.',
      'Set “Does the atmosphere run continuously through the edits” to No, attached to individual clips: “Atmosphere attached to clips rather than laid under them” appears.',
      'Set “Do the music edits respect the phrasing” to Cut to length wherever it landed: “Music cut to a duration rather than to a phrase” appears.',
    ],
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  mix: {
    intro: {
      learning: 'Why many balance problems are really routing problems, and how a null test proves the printed stems add back up to the approved mix.',
      start: 'Set “Do the stems recombine into the mix” to No, they do not match and watch the stage block. Then pick Yes — tested and it cancels.',
    },
    seeing: stageSeeing(kicker(6), 'Preparing to Mix, Mix Architecture, The Mix, Automation, Format and Translation, and Prints and Stems'),
    control: CONTROL,
    changes: [
      'Blockers: stems that don’t add up to the mix, or something in the mix that never reaches the stems.',
      'Flagged: mixing in the edit session, comparisons that aren’t level-matched, and a mix heard on one system only.',
      'A send with nowhere to arrive is flagged, and so is heavy master processing over printed stems: the stems don’t carry it, so they no longer match the mix.',
    ],
    teaches: [
      'Many problems that sound like balance problems are routing problems in disguise.',
      'Prove the stems recombine into the approved mix. A null test plays them against the mix with polarity flipped: if they match, the sum is silence.',
      'Checking the mix on more than one system, such as headphones and a phone, shows how it will sound outside the room you mixed in.',
    ],
    tryThis: [
      'Set “Do the stems recombine into the mix” to No, they do not match: BLOCKED — “The stems do not add up to the mix”. Pick Yes — tested and it cancels: it clears.',
      'Set “Was a new session version made for the mix” to No — mixing in the edit session: “Mixing in the edit session” appears.',
      'Check Headphones and A phone under “Checked on other systems”: “The mix has only been heard on one system” leaves the list.',
    ],
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  finish: {
    intro: {
      learning: 'How a finished file is checked against the specification: loudness inside target ± tolerance, true peak under the ceiling, and a full listen to the exported file itself.',
      start: 'In Stage 1, type -16, 1 and -1 in the loudness target, tolerance and true-peak fields. Back here, enter -13.2 LUFS and 0.4 dBTP as measured and read the two blockers.',
    },
    seeing: stageSeeing(kicker(7), 'Finishing Strategy, Loudness and Level, Mastering and Processing, Technical Quality Control, Creative and Editorial Review, Accessibility and Alternate Audiences'),
    control: CONTROL,
    changes: [
      'Measurements are checked against Stage 1: loudness outside target ± tolerance, or true peak above the ceiling, is a blocker.',
      'No full playback of the actual deliverable is a blocker, and so is an open QC (quality control) issue that blocks delivery.',
      'Dither applied more than once, or processing with no stated purpose, is flagged.',
    ],
    teaches: [
      'Know the number you must hit, match levels before comparing, and listen to the file itself.',
      'A file can pass every automated check and still be unlistenable.',
      'Dither is low-level noise added when you reduce bit depth. It belongs once, at the final reduction; each extra pass only adds noise.',
    ],
    tryThis: [
      'In Stage 1’s loudness target, tolerance and true-peak fields type -16, 1 and -1. Here, enter -13.2 LUFS and 0.4 dBTP as measured: two blockers. Enter -16.4 and -1.2: both clear.',
      'The window is target ± tolerance: -17 still passes, but -17.1 brings back “The program misses its loudness target”.',
      'Set “Full uninterrupted playback of the actual deliverable” to Listened in the session, not the export: BLOCKED. The session is not the file you deliver.',
    ],
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  deliver: {
    intro: {
      learning: 'Why exported, uploaded, received, verified and accepted are different steps, why the approved version is kept safe first, and what makes an archive real.',
      start: 'Set “Is the previously approved version preserved” to No and read the blocker. Then enter 2 in “How many archive copies exist” and leave “Where they are” empty.',
    },
    seeing: stageSeeing(kicker(8), 'Client Review and Revisions, Exports and Deliverables, Delivery Verification, and Archive'),
    control: CONTROL,
    changes: [
      'Blockers: revising over the approved version, files going out without approval, and a deliverable that misses the specification.',
      'Files sent that nobody has opened are a blocker too: an upload is not a delivery.',
      'An archive with one copy, never restored, or unable to rebuild the project is flagged.',
    ],
    teaches: [
      'Exported, uploaded, received, verified and accepted are different things; only accepted means delivered.',
      'The approved version is kept safe before any revision round, so you can always go back to what was signed off.',
      'An archive is proven only when it has been restored: a file list shows what was saved, not that it can be opened.',
    ],
    tryThis: [
      'Set “Is the previously approved version preserved” to No: BLOCKED — “Revisions are being made over the approved version”. Pick Yes — saved as a separate version and print: it clears.',
      'Enter 2 in “How many archive copies exist” and leave “Where they are” empty: “One copy is not an archive” appears. A count with no place proves nothing. Fill in “Where they are”: it clears.',
      'Check items under “The archive contains”, then set “Has a restore been tested” to Only the file list was checked: “The archive has never been restored”.',
    ],
  },
};

export const POSTPROD_ACTIVITY_GUIDES: Record<string, ScreenGuide> = {
  'clarify-the-handoff': {
    intro: {
      learning: 'Practice for Stage 1: why a handoff is clarified in writing early, naming who approves the final and where the files go, while answers are still cheap.',
      start: 'Read the brief, then tap OPEN THE PROJECT AND FIX IT. Type one name in “Who approves the final” and come back to watch that check turn ✓.',
    },
    seeing: activitySeeing(1, 'Clarify the handoff', 'all three project types'),
    control: activityControl('PROJECT'),
    changes: ACTIVITY_CHANGES,
    teaches: [
      'Write down what you were given and what you were not told, then ask the people who can answer, while answers are still cheap.',
      'The open-questions list is the real deliverable of the first stage.',
      'A job needs one named person who approves the final, and a named destination for the files. Without them, nobody can say when it’s finished.',
    ],
    tryThis: [
      'Six checks start ○. Type one name in “Who approves the final”: “One named person is recorded as the approval authority” turns ✓.',
      'Name the destination in “Where the files go”: “A delivery destination is named” turns ✓.',
    ],
  },
  'safe-ingest': {
    intro: {
      learning: 'Practice for Stage 2: why the originals are locked, copies are verified by content, and a mixed sample rate gets one deliberate conversion decision.',
      start: 'Read the brief, then tap OPEN THE PROJECT AND FIX IT. Set “Are the originals protected from writing” to Yes — permissions or hardware lock, then come back to the checklist.',
    },
    seeing: activitySeeing(2, 'Safe ingest', 'all three project types'),
    control: activityControl('PROJECT'),
    changes: ACTIVITY_CHANGES,
    teaches: [
      'Lock the originals, verify by content, and settle duplicate or truncated files before the cards are cleared.',
      'A file at a different sample rate is not a fault: it needs a conversion decision, made once, on purpose.',
      'Converting once on ingest and keeping the originals means every later stage works at one rate, and nothing is lost.',
    ],
    tryThis: [
      'Set “Are the originals protected from writing” to Yes — permissions or hardware lock: “The originals are protected from writing” turns ✓.',
      'Set “How rate or format conversion is handled” to Converted once on ingest, originals kept: “A conversion policy is chosen for the mixed sample rates” turns ✓.',
    ],
  },
  'restore-synchronisation': {
    intro: {
      learning: 'Practice for Stage 3: how a constant offset differs from a steady drift, and why only a check at the end of the longest file shows drift.',
      start: 'Read the brief, then tap OPEN THE PROJECT AND FIX IT. Set “Was sync checked at the END of the longest file” to Yes and come back to the checklist.',
    },
    seeing: activitySeeing(3, 'Restore synchronization', 'Podcast or spoken word and Live performance or event projects'),
    control: activityControl('PROJECT'),
    changes: ACTIVITY_CHANGES,
    teaches: [
      'Diagnose before you cure: a constant offset is moved; a steady drift is stretched or reconformed (rebuilt from the source to match the reference timing).',
      'Free-running clocks drift, and only a check at the end of the file shows it.',
      'A slate or clap gives every recorder the same sharp sound to line up on, so sync doesn’t rest on lining things up by hand.',
    ],
    tryThis: [
      'Set “Was sync checked at the END of the longest file” to Yes: “Sync is checked at the end of the longest file” turns ✓.',
      'Check Slate or clap under “What you are synchronizing from”: “A synchronization source beyond doing it by hand is recorded” turns ✓.',
    ],
  },
  'repair-without-overprocessing': {
    intro: {
      learning: 'Practice for Stage 4: why repair effort should follow how bad a problem really is, and why every repair is judged level-matched, in context.',
      start: 'Read the brief, then tap OPEN THE PROJECT AND FIX IT. Set “What happens to breaths” to Kept — reduced only where distracting, and come back to the checklist.',
    },
    seeing: activitySeeing(4, 'Repair without overprocessing', 'Podcast or spoken word and Live performance or event projects'),
    control: activityControl('PROJECT'),
    changes: ACTIVITY_CHANGES,
    teaches: [
      'Effort should follow severity: a barely audible noise does not need a re-record.',
      'Repairs are judged level-matched (at the same loudness), against what is removed, and in context.',
      'Breaths are part of natural speech. Reduce the ones that distract, and write down the order of your repairs so the work can be checked.',
    ],
    tryThis: [
      'Set “What happens to breaths” to Kept — reduced only where distracting: “Breaths are no longer being removed wholesale” turns ✓.',
      'Write the order of your repairs in “Processing order”: “A processing order is written down” turns ✓.',
    ],
  },
  'add-without-erasing': {
    intro: {
      learning: 'Practice for Stage 5: how each addition changes what is around it, from rights and matched replacements to continuous atmosphere and music under speech.',
      start: 'Read the brief, then tap OPEN THE PROJECT AND FIX IT. Pick Yes, laid as continuous beds for the atmosphere, then come back to the checklist.',
    },
    seeing: activitySeeing(5, 'Add without erasing', 'Podcast or spoken word and Live performance or event projects'),
    control: activityControl('PROJECT'),
    changes: ACTIVITY_CHANGES,
    teaches: [
      'Each addition changes what is around it: rights, a matched replacement, continuous atmosphere, phrasing, agreed correction.',
      'A rights gap passes every technical check and still stops a program.',
      'Sidechain ducking lowers the music automatically while someone speaks, so the words stay clear without riding the fader by hand.',
    ],
    tryThis: [
      'Pick Yes, laid as continuous beds for the atmosphere and Yes — length, level or layering varies under “Is repeated material varied”: the atmosphere check turns ✓.',
      'Check Sidechain ducking under “How music and speech share the space”: “Something manages the relationship between music and speech” turns ✓.',
    ],
  },
  'route-the-mix': {
    intro: {
      learning: 'Practice for Stage 6: three routing faults you can’t hear in the mix, and why a null test when you print catches what listening misses.',
      start: 'Read the brief, then tap OPEN THE PROJECT AND FIX IT. Set “Processing on the master bus” to Left for the finishing stage, and come back to the checklist.',
    },
    seeing: activitySeeing(6, 'Route the mix', 'Music recording and Live performance or event projects'),
    control: activityControl('PROJECT'),
    changes: ACTIVITY_CHANGES,
    teaches: [
      'Three faults you can’t hear in the mix: a group missing from the stems, a send with no return, heavy master processing over the stems.',
      'A null test at the point of printing catches what listening does not.',
      'Leaving heavy master-bus processing for the finishing stage keeps the printed stems able to add back up to the mix.',
    ],
    tryThis: [
      'Set “Processing on the master bus” to Left for the finishing stage: “Master processing is no longer heavy with stems printed beneath it” turns ✓.',
      'Set “Do the stems recombine into the mix” to Yes — tested and it cancels: “The stems recombine into the mix, or the difference is described” turns ✓.',
    ],
  },
  'meet-the-specification': {
    intro: {
      learning: 'Practice for Stage 7: why an over-limited file misses its loudness and true-peak specification, and why you measure the exported deliverable, not the session.',
      start: 'Read the brief, then tap OPEN THE PROJECT AND FIX IT. The copy measures -13.2 LUFS and 0.4 dBTP; start by setting Dither to Once, at the final depth reduction.',
    },
    seeing: activitySeeing(7, 'Meet the specification', 'Podcast or spoken word and Live performance or event projects'),
    control: activityControl('PROJECT'),
    changes: ACTIVITY_CHANGES,
    teaches: [
      'Heavy limiting made this file too loud and too squashed: ease it off, then set the level with plain gain.',
      'Measure the exported deliverable, not the session.',
      'Dither belongs once, at the final reduction in bit depth. Applying it again only adds more noise.',
    ],
    tryThis: [
      'The fresh copy measures -13.2 LUFS and 0.4 dBTP against -16 ± 1 LU and -1 dBTP, so the specification check starts ○.',
      'Set Dither to Once, at the final depth reduction: “Dither is decided rather than left unconsidered, and applied at most once” turns ✓.',
      'Set “What was measured” to The exported deliverable: “The measurement is taken from the exported deliverable” turns ✓.',
    ],
  },
  'the-upload-succeeded': {
    intro: {
      learning: 'Practice for Stage 8: why exported, uploaded, received, verified and accepted are five different things, and why the approved version and its approval record come first.',
      start: 'Read the brief, then tap OPEN THE PROJECT AND FIX IT. Set “Is the previously approved version preserved” to Yes — saved as a separate version and print.',
    },
    seeing: activitySeeing(8, 'The upload succeeded, but delivery failed', 'Music recording and Live performance or event projects'),
    control: activityControl('PROJECT'),
    changes: ACTIVITY_CHANGES,
    teaches: [
      'Exported, uploaded, received, verified and accepted are five different things.',
      'The deliverables list comes from the specification, not from what the session contains.',
      'Keep the approved version as a separate version and print, and record who approved what, so a later question has an answer.',
    ],
    tryThis: [
      'Set “Is the previously approved version preserved” to Yes — saved as a separate version and print: “The approved version is preserved as a session and a print” turns ✓.',
      'Set “Final approval” to Approved and write who approved what in “Approval record”: “The approval is no longer pending, with a record of who approved what” turns ✓.',
    ],
  },
};

export const POSTPROD_PACKET_GUIDE: ScreenGuide = {
  intro: {
    learning: 'Why a delivery record prints its own gaps, conditions and revision number, so whoever receives it knows what isn’t settled and which copy is current.',
    start: 'Read WHAT’S LEFT from the top: blocked stages come first. Tap a row to jump to that question, then come back and look at Revision, Prepared by and Status.',
  },
  seeing: [
    'The Delivery Package is your whole project as one document. At the top: project, type, verdict.',
    'WHAT’S LEFT lists every open item by stage, blocked stages and blockers first. The PDF holds the title, verdict and all below SHARE AS PDF, not WHAT’S LEFT or the type.',
    'Below: Revision, Revision date, Prepared by, Status; any MUST BE RESOLVED BEFORE PROCEEDING and ACCEPTED CONDITIONS; every stage’s answers.',
  ],
  control: [
    'Tap a WHAT’S LEFT row (BLOCKER, REQUIRED QUESTION or TO LOOK AT) to open that stage at that question, marked with an amber edge, or at its findings.',
    'SHARE AS PDF makes the PDF and records the next revision number. If printing isn’t available on your phone, the screen says so, and this page is then the whole package.',
    `‹ goes back. ${CHIPS_LINE}`,
  ],
  changes: [
    'Unanswered questions print as “Not decided — required” or “Not decided”; a skip prints “Not applicable —” and its reason. Gaps are printed, never hidden.',
    'Revision reads “0 — not exported yet” until the first export; each export prints the next number.',
    'Status is the verdict. Prepared by is Stage 1’s post-production supervisor, or Unattributed if nobody is named.',
  ],
  teaches: [
    'A delivery record shows its own gaps and conditions, so whoever receives it knows what is not settled.',
    'A revision number tells everyone which copy is current.',
    'Prepared by puts a name on the delivery: whoever receives it knows who is responsible and who to ask.',
  ],
  tryThis: [
    'On a new project, WHAT’S LEFT opens with STAGE 1 · RECEIVE THE PROJECT, its first row a REQUIRED QUESTION: Project name. Tap it: Stage 1 opens at that question.',
    'Type a name in Stage 1’s “Post-production supervisor”, then come back: Prepared by changes from Unattributed to that name.',
    'Set Stage 8’s “Is the previously approved version preserved” to No: STAGE 8 · DELIVER AND ARCHIVE jumps to the top of WHAT’S LEFT, its BLOCKER first.',
  ],
};
