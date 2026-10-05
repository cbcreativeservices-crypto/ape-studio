/**
 * C09b VIOLA — the lesson's pages as DATA (blueprint §7). The words come
 * from the owner's lesson (docs/labs/miking/source_text/Viola-Miking-
 * Technique.txt, cited "L<n>" in COMMENTS only) with the fixes logged in
 * docs/labs/miking/CORRECTIONS_LOG.md (VA-01 … VA-04) applied — among them
 * the hearing line the lesson did not have (VA-03).
 *
 * OWNER RULING 2026-10-04 — suggested starting points, never dogma; no
 * source, brand or model in learner text; no badges. The 0.5–1.2 m stand
 * distance is the lesson's own audition range (L75): a modest suggestion.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, PageContent, PageId, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, LOUD_REASON, POWER_REASON, clearReason, docReason, feedbackSymptom, gainCheck, hearingCheck, hearingDiag, hollowSymptom, matchedLevels, nullOnPaper, polarityDelay, removeDelay, type Words } from '../shared/bowed/bowedItems.ts';
import { STANDING, VIOLA_MODEL } from './geometry.ts';
import { VIOLA_ZONES } from './model.ts';
import { VIOLA_COPY } from './copy.ts';

const W: Words = { noun: 'viola', player: 'violist', moving: 'the bow’s sweep and the bow arm' };

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the viola',
    goal: 'Get to know the viola — what it is, where you meet it, what it does in the music, and its parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Held like a violin, larger and lower: the bow drives the strings, the bridge carries their vibration into the body. Violas vary in size and tone more than violins do.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a bowed string becomes sound — the bow’s grip and slip, the rocking bridge, the top and back — and where the sound leaves the viola. Shown, never played.',
    credit: { scenarios: ['va.snd.1', 'va.snd.2', 'va.snd.3'], interactive: 'soundPath', note: 'Step the sequence through to the end (or play it once), and answer the three checks.' },
    takeaway: 'At a distance the ear hears body, strings and room blended; a capsule very close to one feature hears its own local view. That is the viola’s close-miking trade-off — tendencies, and violas vary.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the viola sits — under the chin, the bow’s sweep and the bow arm, the neighbours in a quartet — what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['va.set.1', 'va.set.2', 'va.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The bow sweeps out to the player’s right and the bow arm with it; the head is at the chin rest. In a group, the violas sit between the violins and the cellos. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the viola by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['va.mic.1', 'va.mic.2', 'va.mic.3', 'va.mic.4', 'va.rec.1'], note: 'Answer the five checks (one reaches back to how the viola sounds).' },
    takeaway: 'A stand mic gives the integrated viola; a compact cardioid aimed at one area colours it on purpose; a miniature on a clip or holder stays put as the player moves — each has its own trade-off.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — in front of the player and a little above, aimed broadly at the bridge and top, clear of the bow — then move the mic and see what changes.',
    credit: { scenarios: ['va.place.1', 'va.place.2', 'va.place.3', 'va.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin, measured from a named part — the bridge — not a rule; the stand distance is a modest suggestion. Move one variable at a time, play both extreme strings, and keep the bow clear.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the player’s wedge — and know what a pattern cannot do, and where a supercardioid really rejects.',
    credit: { scenarios: ['va.ctx.1', 'va.ctx.2', 'va.ctx.studio', 'va.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A supercardioid has a rear lobe: a wedge straight behind it is not automatically the best place. Closer placement helps against the stage only if it still sounds right, and every system has a feedback limit.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why two mics on one viola can sound thin together, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: ['va.two.1', 'va.two.2', 'va.two.3', 'va.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two mics at different distances hear the viola at different times: some pitches cancel in the sum. Move or rebalance first; polarity flips the sign and never removes a delay.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Reposition before you EQ: the angle, the distance, the filter, the room and the mount come first.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one viola mic in the right order, choose and justify a setup for two briefs, and say what would justify a second mic.',
    credit: { scenarios: ['va.prac.order', 'va.prac.gain', 'va.prac.setup1', 'va.prac.setup2', 'va.prac.3', 'va.mix.1', 'va.mix.2', 'va.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real viola.' },
    takeaway: 'Safe clearance from the bow, the arm and the head, correct power and level checks, pattern reasoning and an accurate account of polarity versus delay pass — and more than one setup can pass.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only: va.snd.* L6 · va.set.* L7, L65
 * (hearing added, VA-03) · va.mic.* L9, L26, L33 · va.place.* L9, L26,
 * L33 · va.ctx.* L32 · va.two.* L30 · va.prac.* / va.mix.* L28-L35, L65-L71.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'va.snd.1',
    page: 'sound',
    prompt: 'Why does a capsule very close to one part of the viola give a different sound from a mic farther away?',
    options: ['Close, it hears one region; at a distance, body, strings and room blend', 'Close, it hears only the strings, because the body itself makes no sound', 'Far away, the viola’s low notes do not reach a mic at all'],
    correct: 'Close, it hears one region; at a distance, body, strings and room blend',
    explain: 'The viola radiates differently from each part. Close miking is a practical compromise: a local view, with less spill, against the blended sound heard at a distance.',
    why: {
      'Close, it hears only the strings, because the body itself makes no sound': 'The body radiates most of the sound; close up, the mic hears whichever region it faces.',
      'Far away, the viola’s low notes do not reach a mic at all': 'Low notes travel well; at a distance they blend with the room.',
    },
  },
  {
    id: 'va.snd.2',
    page: 'sound',
    prompt: 'How does a bow keep a viola note sounding?',
    options: ['It grips and drags the string, then lets it slip back — every cycle', 'It strikes the string again and again, faster than the eye can follow', 'It presses the string down onto the fingerboard to start the note'],
    correct: 'It grips and drags the string, then lets it slip back — every cycle',
    explain: 'Rosin on the hair grips the string and drags it; when the string’s pull wins, it slips back and is caught again — once every vibration, for as long as the bow moves.',
    why: {
      'It strikes the string again and again, faster than the eye can follow': 'A bow never strikes: it grips and lets go.',
      'It presses the string down onto the fingerboard to start the note': 'The left hand’s fingers choose the note; the bow sets the string vibrating.',
    },
  },
  {
    id: 'va.snd.3',
    page: 'sound',
    prompt: 'What does the bridge do with the strings’ vibration?',
    options: ['It rocks on its feet and drives the top, while the soundpost links the back', 'It stops the vibration, so the string only sounds between the bridge and the nut', 'It sends it down the neck to the scroll, which radiates it'],
    correct: 'It rocks on its feet and drives the top, while the soundpost links the back',
    explain: 'The strings rock the bridge; one foot drives the top in and out, the other stands over the soundpost, which passes the motion to the back.',
    why: {
      'It stops the vibration, so the string only sounds between the bridge and the nut': 'The bridge ends the vibrating length — and passes the vibration into the body; that is how the viola sounds.',
      'It sends it down the neck to the scroll, which radiates it': 'The scroll radiates little; the top and back do the work.',
    },
  },
  hearingCheck('va.set.1', W),
  {
    id: 'va.set.2',
    page: 'setting',
    prompt: 'Before placing a mic, what do you ask the violist to play?',
    options: ['The low C and high A, quiet and strong bows, and any pizzicato', 'One loud open string, held long, to set the gain', 'Nothing: a starting point does not depend on the music or the player'],
    correct: 'The low C and high A, quiet and strong bows, and any pizzicato',
    explain: 'The extremes show what a position does: the C string’s body, the A string’s detail, a quiet bow’s noise and the loudest passage’s level. Note the player’s sway, the chin and shoulder rests, and the neighbours.',
    why: {
      'One loud open string, held long, to set the gain': 'One note shows neither the C string’s body nor a quiet bow’s noise.',
      'Nothing: a starting point does not depend on the music or the player': 'A starting point is where to begin; the music decides where you end up.',
    },
  },
  {
    id: 'va.set.3',
    page: 'setting',
    prompt: 'What must a viola mic, its stand and its cable stay clear of?',
    options: ['The bow’s full arc, the bow arm and the player’s head', 'The music stand, so the player can read the part and the conductor', 'The front of the viola, so the audience can see it clearly'],
    correct: 'The bow’s full arc, the bow arm and the player’s head',
    explain: 'Clearance comes first: both ends of the bow, the arm out to the tip, and the head at the chin rest. Secure stands and route cables away from the feet and the bow.',
    why: {
      'The music stand, so the player can read the part and the conductor': 'Sight lines matter, but the safety question is what moves.',
      'The front of the viola, so the audience can see it clearly': 'In front is where a stand mic usually goes. What must stay clear is what moves.',
    },
  },
  {
    id: 'va.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic farther from the viola tends to hear…',
    options: ['More of the blended instrument and the room', 'Only the bow noise, with the body filtered out', 'The f-holes, and nothing from the top or back'],
    correct: 'More of the blended instrument and the room',
    explain: 'At a distance, the parts of the viola blend with the room; close up, one region dominates. A tendency to check by ear.',
    why: {
      'Only the bow noise, with the body filtered out': 'That is closer to what a mic right at the bow hears.',
      'The f-holes, and nothing from the top or back': 'The top and back radiate most of the sound; distance blends all of it.',
    },
  },
  {
    id: 'va.mic.1',
    page: 'microphone',
    prompt: 'A compact cardioid aimed close at one area of the viola can…',
    options: ['Bring out timbre, bow or finger sounds — and some low-end body', 'Capture the whole viola evenly, from all of its parts at once, like a room mic', 'Remove the room completely from the recording'],
    correct: 'Bring out timbre, bow or finger sounds — and some low-end body',
    explain: 'Aimed at a chosen area, it emphasises that area’s sound; up close, proximity effect adds low-frequency weight. A deliberate colour, not a neutral view.',
    why: {
      'Capture the whole viola evenly, from all of its parts at once, like a room mic': 'Close and aimed, it favours one area — that is the point of it.',
      'Remove the room completely from the recording': 'A cardioid reduces the room; it does not remove it.',
    },
  },
  {
    id: 'va.mic.2',
    page: 'microphone',
    prompt: 'Why does a miniature on the viola need its aim chosen with care?',
    options: ['It samples only part of the viola, so its aim shapes the sound', 'It hears the whole room, so the aim makes no difference to the sound', 'Its clip turns it into a pickup, which ignores the aim'],
    correct: 'It samples only part of the viola, so its aim shapes the sound',
    explain: 'Mounted close, a narrow-pattern miniature hears one region. It follows the player, but the region it faces decides the colour.',
    why: {
      'It hears the whole room, so the aim makes no difference to the sound': 'Close up and directional, it hears mostly one region of the viola.',
      'Its clip turns it into a pickup, which ignores the aim': 'A miniature is still a microphone hearing airborne sound; a pickup is a different, electrical path.',
    },
  },
  {
    id: 'va.mic.3',
    page: 'microphone',
    prompt: 'An omni close to the viola, compared with a close cardioid…',
    options: ['Has no directional proximity lift, but still hears the neighbours', 'Rejects the neighbours better, because it is so close', 'Adds more low end, because omni mics boost the bass when they are close'],
    correct: 'Has no directional proximity lift, but still hears the neighbours',
    explain: 'An omni avoids the directional proximity effect and can integrate the room well — but a close omni still hears adjacent players and monitors.',
    why: {
      'Rejects the neighbours better, because it is so close': 'An omni rejects nothing; closeness helps the level, not the rejection.',
      'Adds more low end, because omni mics boost the bass when they are close': 'The close-up bass lift is a directional mic’s proximity effect.',
    },
  },
  {
    id: 'va.mic.4',
    page: 'microphone',
    prompt: 'A clip that fits a violin: can you put it on a viola?',
    options: ['Only if its maker says it fits that viola — check its depth', 'Yes: violin and viola clips are interchangeable', 'No: a viola is too large and too deep to take an instrument clip'],
    correct: 'Only if its maker says it fits that viola — check its depth',
    explain: 'Mounts are not interchangeable instructions: use one its maker lists for the viola, check this instrument’s depth, finish, chin and shoulder rests and the bow path — with the player’s consent.',
    why: {
      'Yes: violin and viola clips are interchangeable': 'Some clips fit both; check the maker’s fit for this viola.',
      'No: a viola is too large and too deep to take an instrument clip': 'Clips and holders made for the viola exist; use one that fits.',
    },
  },
  {
    id: 'va.place.1',
    page: 'placement',
    prompt: 'You change the mic’s height, angle and distance at once, and it sounds better. What can you conclude?',
    options: ['Not much: change one variable at a time to learn what helped', 'The new distance was the improvement, since it changed the most of all', 'The old position was wrong in all three ways'],
    correct: 'Not much: change one variable at a time to learn what helped',
    explain: 'Move one variable at a time, replay the same phrase, and compare at matched level — otherwise you cannot tell which change did the work.',
    why: {
      'The new distance was the improvement, since it changed the most of all': 'Without separate tries you cannot tell which change helped.',
      'The old position was wrong in all three ways': 'One change may have done it all; test one at a time.',
    },
  },
  {
    id: 'va.place.2',
    page: 'placement',
    prompt: 'The bow sound is too prominent in a good room. A first move to try?',
    options: ['A little more distance, or a different angle', 'Cut the high frequencies on the channel first', 'Move the mic closer to the bridge'],
    correct: 'A little more distance, or a different angle',
    explain: 'Use a little more distance if the room sounds useful and the local bow sound is too prominent; change the angle before reaching for EQ.',
    why: {
      'Cut the high frequencies on the channel first': 'EQ dulls the viola along with the bow. Move the mic first.',
      'Move the mic closer to the bridge': 'Closer to the bridge brings more bow, not less.',
    },
  },
  {
    id: 'va.place.3',
    page: 'placement',
    prompt: 'Where may a holder for two strings go on a viola?',
    options: ['Between the tailpiece and the bridge — not across the bowing length', 'Across the strings under the fingerboard, right where the bow plays them', 'On the bridge itself, gripping its top'],
    correct: 'Between the tailpiece and the bridge — not across the bowing length',
    explain: 'The holder grips two strings behind the bridge, its capsule over or under them. Never clamp across the bowing length, and never onto the bridge.',
    why: {
      'Across the strings under the fingerboard, right where the bow plays them': 'That is the bowing length: the bow would hit it.',
      'On the bridge itself, gripping its top': 'Nothing clamps the bridge: it can damp it and risk the instrument.',
    },
  },
  {
    id: 'va.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Before you trust a new viola position, what do you play?',
    options: ['The low C and the high A, quiet and strong, and pizzicato', 'Only the loudest passage, so that the level is safe for the whole show', 'An open A, which shows the whole instrument'],
    correct: 'The low C and the high A, quiet and strong, and pizzicato',
    explain: 'Both extremes and the full dynamic range show what a position does — the C’s body and the A’s detail, a quiet bow’s noise, the loudest note’s level.',
    why: {
      'Only the loudest passage, so that the level is safe for the whole show': 'The level is one check; the tone across the range is another.',
      'An open A, which shows the whole instrument': 'One string shows one string. Play both extremes.',
    },
  },
  {
    id: 'va.ctx.1',
    page: 'context',
    prompt: 'On a louder stage, what does moving the viola mic closer do?',
    options: ['Raises the viola against the stage — if it still sounds right', 'Removes the monitors from the mic completely', 'Makes feedback impossible, whatever level the whole system runs at'],
    correct: 'Raises the viola against the stage — if it still sounds right',
    explain: 'Reducing the distance improves the usable viola level relative to spill and feedback, provided the closer sound is acceptable. Every system still has a feedback limit.',
    why: {
      'Removes the monitors from the mic completely': 'Closer helps the ratio; the monitors are still heard.',
      'Makes feedback impossible, whatever level the whole system runs at': 'Every system has a feedback limit; closer only moves it.',
    },
  },
  {
    id: 'va.ctx.2',
    page: 'context',
    prompt: 'Where should a wedge sit relative to a supercardioid viola mic?',
    options: ['Toward the rear, off to one side — not straight behind', 'Straight behind it, on its rear axis, as far from its front as it gets', 'Beside it, square to its front (90°)'],
    correct: 'Toward the rear, off to one side — not straight behind',
    explain: 'A supercardioid has a rear pickup lobe: its deepest rejection is off to each side of the rear, not straight behind. Place the mic and the wedges by the actual pattern.',
    why: {
      'Straight behind it, on its rear axis, as far from its front as it gets': 'Straight behind sits in the supercardioid’s small rear lobe.',
      'Beside it, square to its front (90°)': 'At 90° the pickup is still fair.',
    },
  },
  {
    id: 'va.ctx.studio',
    page: 'context',
    prompt: 'An exposed classical viola in a good room. What do you listen for first?',
    options: ['A complete instrument and a coherent room, from one stand mic', 'The bow noise, with the mic as close to the bridge as it will go', 'Each string separately, with a mic for each one'],
    correct: 'A complete instrument and a coherent room, from one stand mic',
    explain: 'First a complete viola in the room; then modest changes in height, angle and distance across the C and A strings. A second room view is optional.',
    why: {
      'The bow noise, with the mic as close to the bridge as it will go': 'The spot should not make bow noise prominent just because the mic is close.',
      'Each string separately, with a mic for each one': 'Mics hear the whole viola from where they are; they do not split strings.',
    },
  },
  {
    id: 'va.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · What carries the strings’ vibration into the viola’s body?',
    options: ['The bridge, rocking on its feet', 'The tailpiece, which is fixed to the end', 'The chin rest, which touches the top'],
    correct: 'The bridge, rocking on its feet',
    explain: 'The strings rock the bridge; the bridge drives the top, and the soundpost links the back.',
    why: {
      'The tailpiece, which is fixed to the end': 'The tailpiece anchors the strings; the bridge drives the body.',
      'The chin rest, which touches the top': 'The chin rest is for the player; it carries no string vibration.',
    },
  },
  {
    id: 'va.two.1',
    page: 'twoMic',
    prompt: 'Why can two mics on one viola sound hollow together?',
    options: ['They hear each note at different times, so some pitches cancel', 'The farther mic inverts the sound on its way there, so it cancels', 'Two mics on one source cancel each other’s low end in the sum'],
    correct: 'They hear each note at different times, so some pitches cancel',
    explain: 'Different arrival times make a comb of notches. Move or rebalance first, then check polarity at matched levels.',
    why: {
      'The farther mic inverts the sound on its way there, so it cancels': 'Distance delays a sound; it does not flip its sign.',
      'Two mics on one source cancel each other’s low end in the sum': 'Some pitches dip and others add: it depends on the delay and the levels.',
    },
  },
  polarityDelay('va.two.2'),
  matchedLevels('va.two.3'),
  {
    id: 'va.two.4',
    page: 'twoMic',
    prompt: 'A solo viola sounds right on one mic, but the producer wants a wider image. Is a second mic worth trying?',
    options: ['Yes — as an option, checked for phase and movement in mono', 'No — a solo instrument can be recorded with one mic only', 'Yes — two close mics make a stereo pair, wherever they go'],
    correct: 'Yes — as an option, checked for phase and movement in mono',
    explain: 'A second mic on one viola is optional: it can widen the picture, and it complicates phase and movement. Try it, and keep it only if the pair holds up in mono while the player moves.',
    why: {
      'No — a solo instrument can be recorded with one mic only': 'One good mic often does it, but a second can earn its place — if it holds up in mono.',
      'Yes — two close mics make a stereo pair, wherever they go': 'Two close mics are two perspectives, not automatically a stereo pair. Each hears the whole viola from where it is.',
    },
  },
  gainCheck('va.prac.gain', W),
  {
    id: 'va.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second viola channel?',
    options: ['The first mic works alone, the pair adds something, it holds in mono', 'Two channels give the mix engineer more options to choose from later on', 'The viola needs more level in the mix than one mic can give it'],
    correct: 'The first mic works alone, the pair adds something, it holds in mono',
    explain: 'A second mic blends a different perspective — and a delay. If the pair loses body, move or rebalance it, check polarity — or leave it out.',
    why: {
      'Two channels give the mix engineer more options to choose from later on': 'More channels add spill and a combining check; a second mic should earn its place.',
      'The viola needs more level in the mix than one mic can give it': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'va.mix.1',
    page: 'practice',
    prompt: 'A starting point says “15–40 cm from the bridge”. You are 20 cm from the scroll. Are you in it?',
    options: ['Not necessarily — measure from the bridge, as it names', 'Yes: 20 cm falls inside the 15 to 40 cm band', 'Yes, as long as the mic is aimed at the viola and clear of the bow'],
    correct: 'Not necessarily — measure from the bridge, as it names',
    explain: 'A distance means something only with the part it is measured from. The scroll is half a metre from the bridge.',
    why: {
      'Yes: 20 cm falls inside the 15 to 40 cm band': 'Same number, different part. Measure from the bridge.',
      'Yes, as long as the mic is aimed at the viola and clear of the bow': 'Aim is a separate check; the distance is read from the bridge.',
    },
  },
  nullOnPaper('va.mix.2', 'wedge'),
  removeDelay('va.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'va.sym.bow',
    observation: 'Bow noise masks the note',
    firstChecks: 'The capsule is localised near the bow or the bridge: change the angle, or move outward and up.',
    options: ['Change the angle, or move the mic outward and up', 'Cut the high frequencies on the viola channel first', 'Ask the player to bow more lightly for the whole of the session'],
    correct: 'Change the angle, or move the mic outward and up',
    explain: 'Very close to the bow, the mic overstates it. A little more distance or a different angle blends the note and the bow.',
    why: {
      'Cut the high frequencies on the viola channel first': 'EQ dulls the viola along with the bow. Move the mic first.',
      'Ask the player to bow more lightly for the whole of the session': 'The bowing is the player’s; the mic’s position is yours to change.',
    },
  },
  {
    id: 'va.sym.thin',
    observation: 'The C string sounds thin',
    firstChecks: 'Check the placement and the high-pass filter: reposition before adding bass EQ, and reassess the filter.',
    options: ['Placement and the high-pass filter, before any bass boost', 'Boost the low end on the channel until the C is full', 'Swap to the largest mic you have, for its bigger diaphragm and bass'],
    correct: 'Placement and the high-pass filter, before any bass boost',
    explain: 'A filter set too high or a position far from the body can thin the C. Set the filter only after confirming it does not remove useful viola body.',
    why: {
      'Boost the low end on the channel until the C is full': 'EQ cannot restore what a filter removed. Check the filter and the position first.',
      'Swap to the largest mic you have, for its bigger diaphragm and bass': 'Diaphragm size does not decide the lows. Placement and the filter do.',
    },
  },
  {
    id: 'va.sym.boom',
    observation: 'The low mids sound boomy',
    firstChecks: 'A close directional mic or the room: back away or change the angle; compare positions in the room.',
    options: ['Back away or change the angle; compare room positions', 'Cut all the low end, so no note can boom', 'Move the mic right up to an f-hole, where the low end is controlled'],
    correct: 'Back away or change the angle; compare room positions',
    explain: 'A close directional mic lifts the low end (proximity effect), and a room can boost some notes. Move first; a broad cut thins every note.',
    why: {
      'Cut all the low end, so no note can boom': 'A broad cut thins every note to fix a few.',
      'Move the mic right up to an f-hole, where the low end is controlled': 'An f-hole adds low-mid body: it usually makes boom worse.',
    },
  },
  {
    id: 'va.sym.string',
    observation: 'One string is much louder than the others',
    firstChecks: 'The capsule sees a narrow part of the top: broaden the view and replay both extremes.',
    options: ['Broaden the view and replay both extreme strings', 'Cut that string’s frequencies with a narrow EQ', 'Ask the player to avoid that string where possible'],
    correct: 'Broaden the view and replay both extreme strings',
    explain: 'Close up, the capsule favours the region it faces. A little distance or a new angle evens the strings.',
    why: {
      'Cut that string’s frequencies with a narrow EQ': 'Notes move between strings; a fixed EQ cannot follow. Fix the view.',
      'Ask the player to avoid that string where possible': 'The music decides the strings; the mic should serve all four.',
    },
  },
  feedbackSymptom('va.sym.feedback', W),
  hollowSymptom('va.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'va.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic viola setup in the order you would do them.',
    steps: [
      { text: 'Hear the viola unamplified: C and A strings, quiet and strong bows, pizzicato', early: 'Start by listening to the player in the room.' },
      { text: 'Mark the bow’s full arc and the player’s sway; note neighbours and monitors', early: 'Know the space before choosing where a mic can go.' },
      { text: 'Choose the mic and a stand or an approved mount', early: 'Choose once you know the sound and the space.' },
      { text: 'With the player stopped, place it in front and a little above, clear of the bow', early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom power on', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set input gain on quiet AND strongest passages, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Change one variable at a time, same phrase, matched levels', early: 'Compare only once the level is set safely.' },
      { text: 'Secure the stand and cable; recheck the full bow and movement', early: 'Secure it last, then watch the player’s whole motion again.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before switching it, and follow your own equipment’s manual. Gain: set it for the loudest passage — and check a transmitter’s input too, if one is used.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'va.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Overdub in a dense pop arrangement: the viola needs more definition and separation. One channel, phantom available.',
    setups: [
      { id: 'a', label: 'Compact cardioid 20–30 cm from the bridge, aimed at the bridge and top', ok: true, power: 'phantom', feedback: 'A recommended starting point: closer and aimed, for definition — listen for bow noise and the C string.' },
      { id: 'b', label: 'Compact cardioid aimed toward the body, a little farther back', ok: true, power: 'phantom', feedback: 'A recommended starting point that favours weight — useful if the arrangement is thin.' },
      { id: 'c', label: 'Small condenser 1.2 m away, to catch the room', ok: false, power: 'phantom', feedback: 'Far away adds room, not the definition and separation the brief asks for.' },
      { id: 'd', label: 'A mic clamped to the bridge for the most definition', ok: false, power: 'phantom', feedback: 'Nothing clamps the bridge: it can damp it and risk the instrument.' },
      { id: 'e', label: 'A stand mic beside the bow hand, as close to the strings as possible', ok: false, power: 'phantom', feedback: 'That is the bow arm’s path: the mic would be struck.' },
    ],
    reasons: [docReason('the bridge'), clearReason('the bow’s full arc, the bow arm and the player’s head'), POWER_REASON, { id: 'r.prox', label: 'Close up, proximity effect can add useful body — I will check the C string', role: 'optional', feedback: 'A fair reason, checked by ear.' }, BRAND_REASON('viola'), LOUD_REASON],
    explain: 'Two aimed positions pass. What passes is the reasoning: a sensible starting point, clearance, the power it needs — and an ear on the bow and the C string.',
  },
  {
    id: 'va.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage; the violist turns and sways. One channel, phantom available, the monitors are loud.',
    setups: [
      { id: 'a', label: 'Miniature on a body clip made for the viola, aimed at the bridge, away from the face', ok: true, power: 'phantom', feedback: 'A recommended starting point that moves with the viola — check the fit and do a full motion test.' },
      { id: 'b', label: 'Miniature on a holder behind the bridge, over the strings, checked for colour', ok: true, power: 'phantom', feedback: 'A recommended starting point: steady as the player moves — compare under and over.' },
      { id: 'c', label: 'Small condenser 1 m in front, for a natural blended sound', ok: false, power: 'phantom', feedback: 'On a loud stage, a metre away hears the monitors more than the viola — and the player leaves its zone.' },
      { id: 'd', label: 'A violin clip pushed onto the viola without checking it fits', ok: false, power: 'phantom', feedback: 'Mounts are not interchangeable: use one made to fit this viola.' },
      { id: 'e', label: 'A supercardioid with the wedge straight behind it, trusted to reject it', ok: false, power: 'phantom', feedback: 'A supercardioid has a rear lobe: straight behind is not its best rejection.' },
    ],
    reasons: [docReason('the bridge’s foot or the strings behind the bridge'), clearReason('the bow, the bow arm, the chin and shoulder rests and the face'), POWER_REASON, { id: 'r.move', label: 'A mic on the viola holds its sound as the player turns', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON('viola'), { id: 'r.iso', label: 'A mic on the viola makes it an isolated source', role: 'wrong', feedback: 'A mounted mic still hears the stage and the monitors; check them with the monitors on.' }],
    explain: 'Two miniatures pass. What passes is the reasoning: a mount that fits this viola, clearance from the bow and the face, the power it needs, and a full motion test.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: how does a bow keep a note going?', options: ['It strikes the string very fast', 'It grips the string, then lets it slip', 'It presses the string against the board'], after: 'Now STEP through (or PLAY ONCE) and watch the string, the bridge and the top.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you bring a cardioid from a metre to 25 cm from the viola. What changes?', options: ['More definition, and more low end', 'More of the room', 'It depends on this viola'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'Where will a supercardioid aimed at the viola reject the wedge best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'How is a viola held and played?',
    options: ['Under the chin like a violin, with a bow', 'Upright on the floor like a cello', 'Flat on the lap, plucked like a harp'],
    correct: 'Under the chin like a violin, with a bow',
    explain: 'The viola is held like a violin — a little larger, a fifth lower — and bowed or plucked.',
    why: {
      'Upright on the floor like a cello': 'That is the cello; the viola sits under the chin.',
      'Flat on the lap, plucked like a harp': 'The viola is held at the shoulder and usually bowed.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'Which string is the viola’s lowest?',
    options: ['The C string, below the violin’s range', 'The E string, the same as the violin’s top', 'The G string, the same as the cello’s lowest'],
    correct: 'The C string, below the violin’s range',
    explain: 'The viola’s strings are C, G, D, A: its low C (about 131 Hz) lies below the violin’s lowest G.',
    why: {
      'The E string, the same as the violin’s top': 'The viola has no E string; its top string is A.',
      'The G string, the same as the cello’s lowest': 'The viola’s lowest is C; the cello’s lowest is a lower C.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'A capsule very close to one part of the viola tends to…',
    options: ['Hear that part’s own sound, not the blended instrument', 'Hear the whole viola, evenly balanced from top to bottom', 'Lose the viola’s low notes entirely'],
    correct: 'Hear that part’s own sound, not the blended instrument',
    explain: 'Close up, one region dominates; at a distance, the body, the strings and the room blend.',
    why: {
      'Hear the whole viola, evenly balanced from top to bottom': 'That is what a little distance tends to give.',
      'Lose the viola’s low notes entirely': 'A close mic hears low notes; the issue is one region dominating.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'How does a bow keep a note sounding?',
    options: ['It grips the string, then lets it slip back, every cycle', 'It strikes the string again and again, very fast, like a hammer', 'It holds the string still against the fingerboard'],
    correct: 'It grips the string, then lets it slip back, every cycle',
    explain: 'Grip and slip, once every vibration: the bow feeds the string as long as it moves.',
    why: {
      'It strikes the string again and again, very fast, like a hammer': 'A bow never strikes. It grips and lets go.',
      'It holds the string still against the fingerboard': 'The left hand stops the string; the bow sets it vibrating.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'What must a stand mic and its cable stay clear of around a violist?',
    options: ['The bow’s full arc, the bow arm and the player’s head', 'The music stand, so the player can still read the music', 'The audience’s view of the viola'],
    correct: 'The bow’s full arc, the bow arm and the player’s head',
    explain: 'Clearance comes first: whatever moves, and the head at the chin rest.',
    why: {
      'The music stand, so the player can still read the music': 'Sight lines matter, but safety is about what moves.',
      'The audience’s view of the viola': 'The view matters less than the player’s movement.',
    },
  },
  hearingDiag('q.6', W),
];

const floorY = STANDING.floorY;
const wedges: Wedge[] = [
  {
    id: 'wedge',
    label: 'the player’s floor wedge, in front, facing back at them',
    short: 'WEDGE',
    p: { x: 1500, y: floorY, z: 150 },
    lift: 150,
    faces: { x: -1, y: 0, z: 0 },
    note: 'On the floor in front, facing back at the player: below and behind a mic aimed back at the viola — tilting the mic matters as much as turning it.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
  },
  {
    id: 'side',
    label: 'another player’s wedge, off to the violist’s left',
    short: 'SIDE WEDGE',
    p: { x: 900, y: floorY, z: -1250 },
    lift: 150,
    faces: { x: -0.6, y: 0, z: 0.8 },
    note: 'Off to one side, facing another player: well off the mic’s axis.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
  },
];

export const C09B_LESSON: Lesson = {
  id: 'C09b',
  labId: 'strings',
  title: 'Viola',
  subtitle: 'A stand in front, a cardioid aimed at one area, or a miniature',
  noun: { one: 'viola', many: 'violas' },
  model: VIOLA_MODEL,
  micTypeIds: ['sdcCard', 'strMini'],
  zones: VIOLA_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'The viola is the violin’s larger, lower relative, held the same way under the chin. Its four strings — C, G, D, A — run over a bridge that passes their vibration into the hollow body. Bowed, or plucked (pizzicato).', src: 'DPA-VLA' },
    { title: 'WHERE YOU MEET IT', text: 'String quartets and orchestras, chamber music, studio sessions — and solo and live work too. This lesson covers one viola: a studio solo, a spot in an ensemble, and a live stage.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'It fills the middle of the string sound — inner voices and harmonies — and takes melodies of its own, with a darker colour than the violin. The sound that supports a quartet may differ from the focused tone needed beside amplified instruments.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'Violas vary in size and tone more than violins; this lab draws one about 39 cm in body length. Its lowest note, the open C, is about 131 Hz.', src: 'MET-BANKS' },
  ],
  sound: {
    stages: [
      { title: 'The bow grips the string', text: 'Rosin on the bow hair grips the string and drags it sideways with the bow — a tiny way, many times larger here than it really moves.' },
      { title: 'The string slips back', text: 'When the string’s pull gets stronger than the grip, it slips back past its resting place, and the hair catches it again — once every vibration: that is how a bow keeps a note going.' },
      { title: 'The string rocks the bridge', text: 'The vibrating strings pull the top of the bridge from side to side, and the bridge rocks on its two feet.' },
      { title: 'The bridge drives the top', text: 'Under one foot the top moves in and out; under the other, the soundpost holds the top nearly still and passes the motion to the back. The top, the back and the air inside all vibrate.' },
      { title: 'Sound leaves the body', text: 'Sound leaves from the whole top and back and the f-holes, each part differently. At a distance the ear hears them blended with the room; very close, a mic hears one region’s own sound.' },
    ],
    attack: 'The start of a note: the bow catching the string (or a finger’s pluck) — strongest where the bow meets the strings. A capsule close to the bow tends to hear more of it.',
    body: 'The sustained tone: the strings, the bridge, the top and back and the air inside ringing together. A mic at a little distance tends to hear the viola whole, with the room. Both are tendencies — violas vary.',
    head: { diameterMm: 0, rods: 0, label: 'the C string', strikeSrc: 'PHYS-ET' },
  },
  setting: {
    items: [
      { id: 'viola', label: 'the viola and the violist', short: 'VIOLA', note: 'Held under the chin on the left shoulder, the scroll forward and to the left. Ringed in amber: the instrument this lesson mics.', prov: { kind: 'illustrative', reason: 'viola/GEOMETRY_PROPOSAL.md (violin posture, tail 20 mm lower)' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'bow', label: 'the bow’s arc and the bow arm', short: 'BOW', note: 'The bow travels its whole length across the strings, out to the player’s right at the tip; the bow arm swings with it. No mic, stand or cable goes there.', prov: { kind: 'illustrative', reason: 'violin/GEOMETRY_PROPOSAL.md §3 bow envelope' }, tag: 'KEEP CLEAR', scene: 'kit' },
      { id: 'head', label: 'the chin rest and the player’s head', short: 'HEAD', note: 'The jaw rests on the chin rest; a shoulder rest lies under the back. A clip must clear both — and point away from the face.', prov: { kind: 'illustrative', reason: 'proposal head sphere' }, tag: 'KEEP CLEAR', scene: 'kit' },
      { id: 'stand', label: 'the music stand', short: 'MUSIC STAND', note: 'In front of the player: keep their view of the music and the group clear.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SIGHT LINE', scene: 'kit' },
      { id: 'violin', label: 'a violin beside', short: 'VIOLIN', note: 'In a quartet the violins sit close by; a viola spot hears them.', prov: { kind: 'illustrative', reason: 'a typical quartet seating' }, tag: 'SPILL', scene: 'kit' },
      { id: 'cello', label: 'a cello beside', short: 'CELLO', note: 'On the other side, the cello — loud in the low end, and its body reflects sound too.', prov: { kind: 'illustrative', reason: 'a typical quartet seating' }, tag: 'SPILL', scene: 'kit' },
      { id: 'wedge', label: 'the player’s wedge (monitor)', short: 'WEDGE', note: 'On a stage, a floor monitor in front, facing back at the player.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'side', label: 'another player’s wedge', short: 'SIDE WEDGE', note: 'Off to one side, facing another player.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Live, the audience already hears the acoustic viola; the PA adds what the room needs.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'main', label: 'a main pair for the group', short: 'MAIN PAIR', note: 'In a recording of a group, a main pair hears the whole ensemble; a viola mic is a spot that supports it.', prov: { kind: 'illustrative', reason: 'a generic main pair' }, tag: 'MAIN PAIR', scene: 'studio' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'No wedges on the floor; hear the viola in the room before placing a mic.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors on the floor, the PA facing the audience, and louder neighbours. A closer mic can raise the viola against the stage — if it still sounds right; a mounted miniature follows the player.',
    studio: 'STUDIO: no wedges, a room to hear first, and repeated trials when the player stops. One stand mic often carries the whole viola; in a group, the main pair may carry it already.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic viola setup for a studio solo, an ensemble spot and a live stage, and explain what would justify a second mic. With a real viola and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'room', label: 'Room or stage', kind: 'text' },
      { id: 'posture', label: 'Player', kind: 'choice', choices: ['standing', 'seated'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser, cardioid', 'small condenser, omni', 'miniature on a clip or holder', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, from the bridge (or which part)', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The viola’s height above the floor (the violin’s hold, 20 mm lower; 450 mm lower again seated) — drawing defaults — so no HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The viola is drawn at one museum instrument’s size (body 388 mm, bouts, rib, string length 352); violas vary 15–17 in. Stop (215), bridge height, arching, the fingerboard and the bow length (740) are drawing defaults.', dims: [] },
    { text: 'The bow’s sweep, the bow hand, the bow arm, the left hand and the player’s head — illustrative envelopes; the player’s body and the chair (seated) are drawn from the proposal’s head and tail positions.', dims: [] },
    { text: 'The 0.5–1.2 m front distance is the lesson’s own audition range; the aimed cardioid’s 15–40 cm, and the clip and holder distances, are drawing defaults.', dims: [] },
    { text: 'The miniature’s capsule and gooseneck reach, the small condenser’s diameter, and whether a body clip fits this viola’s depth (rib 35 mm plus the arching) — to check on the real instrument.', dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules; the stand distance in particular is a modest suggestion. Every viola, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: one player in a typical hold, the bow’s sweep as a hatched area, mic patterns and the two-mic comb as textbook shapes, and string and body motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped, and only with their agreement.',
  copy: VIOLA_COPY,
};
