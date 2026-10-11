/**
 * B06 PANELS, PRESS CONFERENCES AND GROUPS — the lesson's pages as DATA
 * (blueprint §7). The words come from the owner's lesson (docs/labs/miking/
 * source_text/B06-Panels-Press-Conferences-and-Groups-Miking-Technique.txt,
 * cited "L<n>" in COMMENTS only) with the fixes logged in docs/labs/miking/
 * CORRECTIONS_LOG.md ("L7G1") applied — among them the lectern distance
 * (B06-1, L27: the lectern gooseneck about 10–14 in, a little off-centre —
 * NOT "around eight inches below the mouth, centred", which is the same
 * source's omni lavalier) and the institutional wording (B-INST: L2, L56).
 *
 * A panel and a lectern, the SET-UP as the variant (WHERE: PANEL /
 * LECTERN), on the seated talker (shared/broadcast) and the voice family's
 * standing figure. OWNER RULING 2026-10-04: suggested starting points,
 * never dogma; no source, brand or model in learner text; no badges. 3:1 is
 * a NOTE, never graded.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, clearReason, docReason, hearingDiag, polarityDelay, superNull, type Words } from '../shared/bowed/bowedItems.ts';
import { LOUD_VOICE, removeDelayVoice } from '../shared/broadcast/sportItems.ts';
import { hollowVoiceSymptom, personMeet, voiceRatingCheck } from '../shared/broadcast/voiceItems.ts';
import { B06_MODEL, PA_C, STAND_FLOOR } from './geometry.ts';
import { B06_ZONES } from './model.ts';
import { B06_COPY } from './copy.ts';

const W: Words = { noun: 'panel', player: 'panelist', moving: 'the heads, the hands and the papers' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the panel and the lectern',
    goal: 'Get to know a panel at a table and a presenter at a lectern — where each voice leaves, the table, the gooseneck bases, the lectern, the aisle and the PA — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Each voice leaves through its own mouth; the table, the turns of the heads, the aisle and the PA decide what else each mic hears.',
  },
  sound: {
    title: 'Where the voices come from',
    goal: 'See where speech leaves each talker, what turning to a neighbour does at a fixed mic, and what every extra open mic adds to the mix and costs in margin.',
    credit: { scenarios: ['b6.snd.1', 'b6.snd.2', 'b6.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'Every distance is read from the lips. A turn swings the voice off a fixed mic; every open mic hears the others later and lower, and costs margin before feedback. Tendencies, and panels vary.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Map every speaking position and every destination, check the press feed’s port with the event audio lead, and keep the open mics few — before any mic goes up.',
    credit: { scenarios: ['b6.set.1', 'b6.set.2', 'b6.set.3', 'b6.set.4'], note: 'Answer the four checks.' },
    takeaway: 'Map who speaks where and where each voice must go; route the audience question on purpose; match the press feed’s level and never send phantom power into it unverified; never provoke feedback.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for each speaking zone by its properties — a gooseneck, a shared boundary, a headset, an aisle mic — and its actual pattern, not by assuming every boundary is omni.',
    credit: { scenarios: ['b6.mic.1', 'b6.mic.2', 'b6.mic.3', 'b6.mic.4', 'b6.rec.1'], note: 'Answer the five checks (one reaches back to the talkers).' },
    takeaway: 'A gooseneck each for control; a shared boundary for a small, quiet table; a headset for a presenter who walks; a fixed aisle mic for questions. Check each one’s real pattern.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — a gooseneck about 20–30 cm below a panelist’s mouth, the lectern gooseneck about 25–36 cm and a little off the mouth — then move the mic and see what changes.',
    credit: { scenarios: ['b6.place.1', 'b6.place.2', 'b6.place.3', 'b6.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the talker, inside two different suggested starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A suggested zone is a place to begin, measured from the lips — not a rule. A short and a tall presenter, a turn to a neighbour and a step back all change the answer; clearance from the face, the sight line and the papers comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the lectern gooseneck so its pattern’s rejection faces the PA — and know why a quiet roundtable and a press conference with a PA need different choices.',
    credit: { scenarios: ['b6.ctx.1', 'b6.ctx.2', 'b6.ctx.studio', 'b6.rec.3'], interactive: 'wedgeInNull', note: 'LECTERN: aim the mic (or change its pattern) until the PA sits in the rejection. PANEL: answer the decision card. Then the three checks.' },
    takeaway: 'A quiet roundtable can share mics; a live room needs closeness, the smallest set of open mics and the PA toward each pattern’s rejection — and the stream and the press feed carry only what is routed into them.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a lectern mic and a headset on the same presenter comb when both are open, how the arrival-time difference places the notches, and why one is muted at a time.',
    credit: { scenarios: ['b6.two.1', 'b6.two.2', 'b6.two.3', 'b6.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'One voice in two open mics arrives twice: some pitches cancel and the open-mic count rises. Plan the handoff — one open at a time; polarity flips the sign and never removes a delay.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause and the route first — the distance, the turn, the open mics, the handoff, what each feed carries — before reaching for gain or processing.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up a panel and a press conference in the right order, choose and justify a setup for a live panel with a stream and for a quiet roundtable, and say what would justify a second mic.',
    credit: { scenarios: ['b6.prac.order', 'b6.prac.gain', 'b6.prac.setup1', 'b6.prac.setup2', 'b6.prac.3', 'b6.mix.1', 'b6.mix.2', 'b6.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The placement card is optional — it needs a real panel.' },
    takeaway: 'Each voice intelligible at its destination, an individual or shared choice justified, a planned lectern handoff, the press feed’s content and level known, and a safe setup pass. More than one setup can pass.',
  },
};
/** MEET IT in person words (review 2026-10-08, L7G2-18 / L7G3-17): the engine's goal calls the subject "it". */
pages.meet = personMeet(pages, 'the panel and the presenter');

/*
 * THE CHECKS. Lesson lines in comments only: b6.snd.* L6, L29–L32 · b6.set.*
 * L5, L34–L45 · b6.mic.* L11–L25 · b6.place.* L12, L27 (B06-1) · b6.ctx.*
 * L30, L47 · b6.two.* L28 · b6.prac.* / b6.mix.* L49–L56.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'b6.snd.1',
    page: 'sound',
    prompt: 'A panelist turns to answer the neighbour. What happens at their gooseneck, fixed on the table?',
    options: ['The voice swings off its axis and dulls', 'The gooseneck bends round to follow them', 'Nothing, as long as the talker stays seated'],
    correct: 'The voice swings off its axis and dulls',
    explain: 'The gooseneck stays where it was bent; the mouth turns. Off its axis the voice is duller — and it now points more toward the neighbour’s mic.',
    why: {
      'The gooseneck bends round to follow them': 'A gooseneck holds the shape it was bent to.',
      'Nothing, as long as the talker stays seated': 'A turn of the head is enough to move the mouth off the axis.',
    },
  },
  {
    id: 'b6.snd.2',
    page: 'sound',
    prompt: 'Four panel mics are open but only one person is speaking. What do the other three add?',
    options: ['The speaker later and lower, and more room', 'Nothing, because each mic is aimed elsewhere', 'Only the other panelists’ breathing'],
    correct: 'The speaker later and lower, and more room',
    explain: 'Each open mic hears the speaker from farther away — later and lower — plus the room. Summed, the speaker combs; live, each doubling of open mics costs about 3 dB of margin.',
    why: {
      'Nothing, because each mic is aimed elsewhere': 'A mic aimed elsewhere still hears a voice a metre away, lower but clearly.',
      'Only the other panelists’ breathing': 'They hear the speaker too, and the room.',
    },
  },
  {
    id: 'b6.snd.3',
    page: 'sound',
    prompt: 'Why can a shared boundary mic between two panelists change more with each head turn?',
    options: ['It is farther from each mouth than a gooseneck', 'It hears only the talker on its left side', 'A boundary mic only works when people are silent'],
    correct: 'It is farther from each mouth than a gooseneck',
    explain: 'Farther away and low on the table, every turn is a bigger change in angle and level — and it hears more of the room and the table.',
    why: {
      'It hears only the talker on its left side': 'It hears both — that is the idea of sharing it.',
      'A boundary mic only works when people are silent': 'It works for speech; it is simply farther from each mouth.',
    },
  },
  voiceRatingCheck('b6.set.1', 'the panelist'),
  {
    id: 'b6.set.2',
    page: 'setting',
    prompt: 'Audience questions are clear in the room but missing on the stream. What is the likely cause?',
    options: ['The question mic is not routed to the stream', 'The questioners are speaking much too quietly', 'The stream turns down the voices it hears'],
    correct: 'The question mic is not routed to the stream',
    explain: 'The room hears the question acoustically and through the PA; the stream carries only what is routed into it. Route the question mic to the stream and the press feed on purpose.',
    why: {
      'The questioners are speaking much too quietly': 'If the room hears them well, the mic picks them up: the route is the gap.',
      'The stream turns down the voices it hears': 'A stream carries what it is sent.',
    },
  },
  {
    id: 'b6.set.3',
    page: 'setting',
    prompt: 'A reporter plugs into the press feed box, whose outputs are mic level. How should their input be set?',
    options: ['For mic level, phantom power off', 'For line level, so that it cannot be too loud', 'For mic level, with phantom power on'],
    correct: 'For mic level, phantom power off',
    explain: 'Match the input to the port: a mic-level output into a mic input. Do not send phantom power into a feed nobody has verified.',
    why: {
      'For line level, so that it cannot be too loud': 'A mic-level feed into a line input is far too quiet; noise comes up with it.',
      'For mic level, with phantom power on': 'Phantom power into an unverified feed port is not safe for the box. Off unless its guidance says otherwise.',
    },
  },
  {
    id: 'b6.set.4',
    page: 'setting',
    prompt: 'Before a live panel, how do you check the panel mics with the PA on?',
    options: ['Each up to its working level; any ring, pull down', 'Raise each one until it rings, then back it off a bit', 'Open all of them at once at a high level'],
    correct: 'Each up to its working level; any ring, pull down',
    explain: 'Start with only the needed speech mics open; bring each to its working level with the responsible operator. Never raise gain to provoke feedback as a test.',
    why: {
      'Raise each one until it rings, then back it off a bit': 'Provoking feedback risks ears and loudspeakers.',
      'Open all of them at once at a high level': 'Many open mics at a high level invite feedback.',
    },
  },
  {
    id: 'b6.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Two panel mics are open, one panelist speaks. What reaches the mix twice?',
    options: ['That panelist’s voice, the far copy later', 'Nothing, because each mic has its own talker', 'Only the room, and not a voice'],
    correct: 'That panelist’s voice, the far copy later',
    explain: 'The speaker reaches their own mic first and the neighbour’s later; summed, some pitches cancel.',
    why: {
      'Nothing, because each mic has its own talker': 'Each mic also hears the neighbours.',
      'Only the room, and not a voice': 'A voice a metre away reaches the mic clearly.',
    },
  },
  {
    id: 'b6.mic.1',
    page: 'microphone',
    prompt: 'A boundary mic lies on the table between two panelists. Is it an omni?',
    options: ['Not always — check its actual pattern', 'Yes — boundary mics hear evenly all round', 'It turns into one by lying flat'],
    correct: 'Not always — check its actual pattern',
    explain: 'Many boundary mics are half-cardioid or half-supercardioid. Aim its front at the talkers and check the real pattern.',
    why: {
      'Yes — boundary mics hear evenly all round': 'Some are; many are directional above the surface.',
      'It turns into one by lying flat': 'Lying on a surface changes the response near it, not the pattern’s type.',
    },
  },
  {
    id: 'b6.mic.2',
    page: 'microphone',
    prompt: 'Soft, overlapping panelists in a room with a PA. Which approach gives the most control?',
    options: ['A gooseneck each, on its own channel', 'One shared boundary in the middle', 'An overhead mic above the whole table'],
    correct: 'A gooseneck each, on its own channel',
    explain: 'Individual goosenecks give the best control for soft or overlapping talkers; a shared mic is farther from each mouth.',
    why: {
      'One shared boundary in the middle': 'Farther from each mouth: more room, more PA, less control.',
      'An overhead mic above the whole table': 'Long distance brings reverberation and cross-talk — no substitute for close speech mics.',
    },
  },
  {
    id: 'b6.mic.3',
    page: 'microphone',
    prompt: 'The presenter walks away from the lectern during the talk. Which mic keeps them steady?',
    options: ['A headset, with the lectern muted', 'The lectern gooseneck turned right up', 'A second gooseneck on the same lectern'],
    correct: 'A headset, with the lectern muted',
    explain: 'A headset keeps its distance as the presenter walks; plan who mutes the lectern so the two do not comb.',
    why: {
      'The lectern gooseneck turned right up': 'Turning it up as they walk away raises the room and the PA too.',
      'A second gooseneck on the same lectern': 'Two lectern mics do not follow someone who leaves the lectern.',
    },
  },
  {
    id: 'b6.mic.4',
    page: 'microphone',
    prompt: 'What does a fixed aisle mic need for audience questions?',
    options: ['The questioner close to it, and a route to the feeds', 'A long distance from people for a natural sound', 'A loudspeaker right next to it so the room hears the question'],
    correct: 'The questioner close to it, and a route to the feeds',
    explain: 'Coach the questioner to stay close for the whole question, and route the mic to the stream and the press feed — a lectern mic does not cover the aisle.',
    why: {
      'A long distance from people for a natural sound': 'Far from the mouth, the question sinks into the room.',
      'A loudspeaker right next to it so the room hears the question': 'A loudspeaker beside an open mic feeds back.',
    },
  },
  {
    id: 'b6.place.1',
    page: 'placement',
    prompt: 'Where can a lectern gooseneck start, as an idea?',
    options: ['About 25–36 cm away, a little off the mouth', 'Right against the lips, so it hears only them', 'Low on the lectern top, under the papers'],
    correct: 'About 25–36 cm away, a little off the mouth',
    explain: 'After our research, about 25–36 cm (10–14 in), a little off the mouth’s axis, is a place to begin — out of the sight line and the paper’s path. Try it with a short and a tall presenter.',
    why: {
      'Right against the lips, so it hears only them': 'Too close for a lectern: pops, and every head turn becomes a big change.',
      'Low on the lectern top, under the papers': 'Under the papers it hears the pages, not the voice.',
    },
  },
  {
    id: 'b6.place.2',
    page: 'placement',
    prompt: 'Why bend the gooseneck a little below and off the mouth’s line?',
    options: ['Fewer breath bursts, modest turns still covered', 'To keep it as far from the talker’s voice as it can be', 'So that the camera sees it more clearly'],
    correct: 'Fewer breath bursts, modest turns still covered',
    explain: 'Out of the straight line of the breath, pops drop; the capsule still hears the mouth as it turns a little.',
    why: {
      'To keep it as far from the talker’s voice as it can be': 'The aim is to keep it near the mouth, out of the breath.',
      'So that the camera sees it more clearly': 'A lower capsule usually hides it better, not shows it.',
    },
  },
  {
    id: 'b6.place.3',
    page: 'placement',
    prompt: 'A tall presenter follows a short one at the same lectern. A fair step?',
    options: ['Re-shape the gooseneck to the new mouth', 'Leave it, and turn the channel up', 'Ask the tall presenter to stoop down to the old height'],
    correct: 'Re-shape the gooseneck to the new mouth',
    explain: 'Rehearse with short and tall speakers: bring the capsule back to a starting distance from this mouth.',
    why: {
      'Leave it, and turn the channel up': 'Gain raises the room and the PA with the distant voice.',
      'Ask the tall presenter to stoop down to the old height': 'Move the mic to the presenter, not the presenter to the mic.',
    },
  },
  {
    id: 'b6.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · The stream needs the remote contributor and the questions. What decides whether they are in it?',
    options: ['What is routed into the stream', 'How loud they sound in the room', 'Which mic is nearest the stream'],
    correct: 'What is routed into the stream',
    explain: 'A feed carries only what is routed into it, however clearly the room hears it.',
    why: {
      'How loud they sound in the room': 'The room hears acoustically; the stream hears the route.',
      'Which mic is nearest the stream': 'A stream has no place in the room: it is a route.',
    },
  },
  {
    id: 'b6.ctx.1',
    page: 'context',
    prompt: 'A press conference with a PA. A fair first step for the lectern mic?',
    options: ['Close to the mouth, its rejection toward the PA', 'Farther back, so that it covers the whole stage', 'Turned up until it is louder than the PA'],
    correct: 'Close to the mouth, its rejection toward the PA',
    explain: 'In a live room, prioritise proximity, the PA’s place and the smallest useful set of open mics; aim the pattern’s rejection toward the loudspeaker.',
    why: {
      'Farther back, so that it covers the whole stage': 'Farther from the mouth, it hears more PA and room: less margin.',
      'Turned up until it is louder than the PA': 'More gain brings feedback closer.',
    },
  },
  superNull('b6.ctx.2', 'context', 'PA'),
  {
    id: 'b6.ctx.studio',
    page: 'context',
    prompt: 'A small, quiet studio roundtable with no PA, four people close together. A fair first setup?',
    options: ['A gooseneck each, or a shared boundary for two', 'One mic hanging high above the table', 'A loudspeaker on the table so that everyone can hear the cues'],
    correct: 'A gooseneck each, or a shared boundary for two',
    explain: 'With no PA and everyone close, individual mics give the most control; a shared boundary works if everyone stays near it.',
    why: {
      'One mic hanging high above the table': 'High and far: reverberation and cross-talk.',
      'A loudspeaker on the table so that everyone can hear the cues': 'A loudspeaker among open mics spills into all of them.',
    },
  },
  {
    id: 'b6.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Four mics are open on a live panel. What happens to the margin before feedback?',
    options: ['About 6 dB less than with one open mic', 'The same, however many are open', 'It grows, because more mics share the load'],
    correct: 'About 6 dB less than with one open mic',
    explain: 'Each doubling of open mics costs about 3 dB: four is two doublings, about 6 dB.',
    why: {
      'The same, however many are open': 'Every open mic hears the PA too: the margin shrinks.',
      'It grows, because more mics share the load': 'More open mics mean more paths for feedback, not fewer.',
    },
  },
  {
    id: 'b6.two.1',
    page: 'twoMic',
    prompt: 'The presenter wears a headset and stands at the lectern, both mics open. Why does the voice sound hollow?',
    options: ['It reaches the lectern mic later than the headset', 'The headset reverses the polarity of the presenter’s voice', 'The lectern mic is louder, so it cancels'],
    correct: 'It reaches the lectern mic later than the headset',
    explain: 'The headset is close; the lectern mic is farther. One voice, two arrival times: summed, some pitches cancel.',
    why: {
      'The headset reverses the polarity of the presenter’s voice': 'Distance delays a sound; it does not flip its sign.',
      'The lectern mic is louder, so it cancels': 'Level changes the notches’ depth; the delay makes them.',
    },
  },
  polarityDelay('b6.two.2'),
  {
    id: 'b6.two.3',
    page: 'twoMic',
    prompt: 'What is the fair plan for a lectern mic and a headset on one presenter?',
    options: ['One open at a time, with a rehearsed handoff', 'Both open, so the voice is twice as safe if one fails', 'One polarity flipped, both left open'],
    correct: 'One open at a time, with a rehearsed handoff',
    explain: 'Decide who mutes which, and rehearse it. A second mic can be a separately routed backup, not a second open capsule.',
    why: {
      'Both open, so the voice is twice as safe if one fails': 'Both open on one voice comb and cost margin.',
      'One polarity flipped, both left open': 'Polarity cannot remove the delay between them.',
    },
  },
  {
    id: 'b6.two.4',
    page: 'twoMic',
    prompt: 'Two adjacent goosenecks both hear the same panelist. A first fix?',
    options: ['Reduce the redundant open pickup', 'Space them by a strict 3:1 rule', 'Boost the treble on both of them'],
    correct: 'Reduce the redundant open pickup',
    explain: 'Mute or lower the mic not in use, reposition, or choose the better channel. 3:1 can help with spaced mics; it is not a guarantee at a talking table.',
    why: {
      'Space them by a strict 3:1 rule': '3:1 helps with spaced mics; it cannot override the room, the turns and the routing.',
      'Boost the treble on both of them': 'EQ cannot fill the comb’s notches.',
    },
  },
  {
    id: 'b6.prac.gain',
    page: 'practice',
    prompt: 'The quietest panelist is hard to hear. What do you do first?',
    options: ['Bring their gooseneck closer; then set gain', 'Raise their distant mic until they cut through', 'Ask the louder panelists to speak more softly'],
    correct: 'Bring their gooseneck closer; then set gain',
    explain: 'Set usable gain for the quietest speaker without raising a distant mic to make up for its place; check the loudest speech for overload.',
    why: {
      'Raise their distant mic until they cut through': 'Gain on a distant mic raises the room and the PA with them.',
      'Ask the louder panelists to speak more softly': 'The panel is the panel: move the quiet one’s mic.',
    },
  },
  {
    id: 'b6.prac.3',
    page: 'practice',
    prompt: 'What would justify a second mic on the lectern?',
    options: ['A separately routed backup, kept closed', 'Two open capsules for a fuller, richer voice', 'More level for a soft presenter'],
    correct: 'A separately routed backup, kept closed',
    explain: 'A backup earns its place if it is routed separately and opened only when needed. Two open capsules on one voice comb.',
    why: {
      'Two open capsules for a fuller, richer voice': 'Two open capsules on one voice comb.',
      'More level for a soft presenter': 'Level comes from distance and gain, not another mic.',
    },
  },
  {
    id: 'b6.mix.1',
    page: 'practice',
    prompt: 'A first syllable is clipped whenever a new panelist starts speaking. What do you check?',
    options: ['The automatic mixer’s settings, in rehearsal', 'The panelists’ chairs and the table height', 'The PA’s level in the room at that moment'],
    correct: 'The automatic mixer’s settings, in rehearsal',
    explain: 'Automatic mixers choose or share gain and have hold, off-attenuation and priority settings that vary by model. Rehearse interruptions and listen for clipped first syllables.',
    why: {
      'The panelists’ chairs and the table height': 'Furniture does not clip a first syllable; a gate or an automatic mixer can.',
      'The PA’s level in the room at that moment': 'The PA’s level does not decide when a channel opens; the automatic mixer’s settings do.',
    },
  },
  {
    id: 'b6.mix.2',
    page: 'practice',
    prompt: 'A reporter’s recorder distorts badly on the press feed. What is a likely cause?',
    options: ['A line-level port into a mic input', 'The press box adds its own reverb', 'The lectern mic is too far from the box'],
    correct: 'A line-level port into a mic input',
    explain: 'Match the input to the port’s level; a line-level feed into a mic input overloads. Check the exact port with the event audio lead.',
    why: {
      'The press box adds its own reverb': 'The box distributes the mix; it does not add effects.',
      'The lectern mic is too far from the box': 'The box is fed by the mixer, not by a mic’s distance.',
    },
  },
  removeDelayVoice('b6.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'b6.sym.room',
    observation: 'The panel sounds distant and roomy',
    firstChecks: 'How many mics are open? Is each gooseneck near its talker? A shared mic for too many?',
    options: ['Fewer open mics; each one closer to its talker', 'Raise all of the panel mics a little, all together', 'Add an overhead mic to fill in the room'],
    correct: 'Fewer open mics; each one closer to its talker',
    explain: 'Each open mic adds the room; distance adds more. Close the unused ones and bring each mic to its talker.',
    why: {
      'Raise all of the panel mics a little, all together': 'More gain on every mic raises the room and the PA.',
      'Add an overhead mic to fill in the room': 'A distant mic adds more room, not less.',
    },
  },
  {
    id: 'b6.sym.knock',
    observation: 'Thumps when papers are moved or the table is knocked',
    firstChecks: 'Are the bases near the papers and the hands? Are they on a shock mount?',
    options: ['Move the bases away from papers; isolate them', 'Turn the low end of all the panel mics right down', 'Ask the panel not to touch the table at all'],
    correct: 'Move the bases away from papers; isolate them',
    explain: 'Structure noise travels through the table into the base and the neck. Keep bases away from page turning; a table or shock mount helps.',
    why: {
      'Turn the low end of all the panel mics right down': 'A deep cut thins every voice and leaves the knocks’ cause.',
      'Ask the panel not to touch the table at all': 'People handle papers; isolate the mics.',
    },
  },
  {
    id: 'b6.sym.question',
    observation: 'Remote viewers say they cannot hear the audience questions',
    firstChecks: 'Is the question mic routed to the stream? Did questioners stay close to it?',
    options: ['Route the question mic to the stream; keep them close', 'Turn the PA up so that the stream can hear the room', 'Ask the presenter to speak more loudly when answering'],
    correct: 'Route the question mic to the stream; keep them close',
    explain: 'The stream carries only what is routed into it. Route the question mic and check it at the destination.',
    why: {
      'Turn the PA up so that the stream can hear the room': 'The stream is not listening to the room.',
      'Ask the presenter to speak more loudly when answering': 'The missing voice is the questioner’s.',
    },
  },
  {
    id: 'b6.sym.handoff',
    observation: 'The presenter sounds hollow when they walk back to the lectern',
    firstChecks: 'Are the headset and the lectern both open? Who mutes which?',
    options: ['Mute one; rehearse the handoff with the operator', 'Boost the low end on both of the channels to fill it in', 'Flip one polarity and leave both open'],
    correct: 'Mute one; rehearse the handoff with the operator',
    explain: 'Two open mics on one voice comb. Plan who mutes which and rehearse it.',
    why: {
      'Boost the low end on both of the channels to fill it in': 'EQ cannot undo a comb between two arrivals.',
      'Flip one polarity and leave both open': 'Polarity cannot remove the delay between them.',
    },
  },
  {
    id: 'b6.sym.feedback',
    observation: 'The PA rings when every panel mic is open',
    firstChecks: 'Lower the level at once. How many open mics? Where is the PA against the patterns?',
    options: ['Lower the level, then close the unused mics', 'Turn the panel up so it stays over the ring', 'Swap all the goosenecks for omni capsules'],
    correct: 'Lower the level, then close the unused mics',
    explain: 'Feedback is a sound-system condition: lower the send, then fewer open mics, closer mics and the PA toward the patterns’ rejection. Never provoke feedback on purpose.',
    why: {
      'Turn the panel up so it stays over the ring': 'More gain feeds the loop.',
      'Swap all the goosenecks for omni capsules': 'Omnis hear the PA from every side: feedback comes sooner.',
    },
  },
  hollowVoiceSymptom('b6.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'b6.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a panel and press setup in the order you would do them.',
    steps: [
      { text: 'Map every speaking position and every destination', early: 'Start with who speaks where and where each voice goes.' },
      { text: 'Choose a mic for each zone and place it near its talker', early: 'Place the mics once the map is known.' },
      { text: 'Sound-check each channel alone; gain for the quietest speaker', early: 'Check each mic once it is placed.' },
      { text: 'Open only the needed mics; plan the lectern handoff', early: 'Decide the open mics after each one is checked.' },
      { text: 'Route the question and remote voices to every feed', early: 'Route the feeds once the mics work.' },
      { text: 'With the audio lead, check the press port’s level and contents', early: 'The press feed comes after the routing.' },
    ],
    explain: 'A sensible order. Phantom power: mute the outputs first and follow your own equipment’s manual; never into an unverified feed port. Never raise gain to provoke feedback.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'b6.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A four-person panel with a lectern, a PA in the room, a live stream and audience questions.',
    setups: [
      { id: 'a', label: 'A gooseneck each, a lectern gooseneck, an aisle mic routed to every feed', ok: true, power: 'phantom', feedback: 'A suggested start: close mics, the question routed on purpose — check the open mics with the PA on.' },
      { id: 'b', label: 'Headsets on the panel and the presenter, an aisle mic to every feed', ok: true, power: 'phantom', feedback: 'A start that can pass — check fit, clothing noise and the lectern handoff.' },
      { id: 'c', label: 'One shared boundary for the whole panel', ok: false, power: 'phantom', feedback: 'Far from most mouths, with a PA: more room, less margin.' },
      { id: 'd', label: 'The question mic to the PA only', ok: false, power: 'none', feedback: 'The stream and the press would never hear the questions.' },
      { id: 'e', label: 'Every mic left open the whole time', ok: false, power: 'phantom', feedback: 'Each open mic costs margin and adds room. Open the needed ones.' },
    ],
    reasons: [docReason('the lips'), clearReason('the talkers’ faces, the sight lines and the aisle'), { id: 'r.route', label: 'The question and the remote voice are routed to the stream and the press feed', role: 'required', feedback: 'Say how the feeds get every voice.' }, { id: 'r.three', label: 'A strict 3:1 spacing guarantees a clean mix', role: 'wrong', feedback: '3:1 can help with spaced mics; it is not a guarantee at a talking table.' }, BRAND_REASON('panel'), LOUD_VOICE],
    explain: 'More than one setup passes. What passes is the reasoning: close mics measured from the lips, the fewest open, every voice routed on purpose, and clearance kept.',
  },
  {
    id: 'b6.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A quiet studio roundtable for a recording, no PA, two people close together.',
    setups: [
      { id: 'a', label: 'A gooseneck each, on separate channels', ok: true, power: 'phantom', feedback: 'A suggested start: the most control — check their view of each other.' },
      { id: 'b', label: 'One shared boundary between them, its front toward both', ok: true, power: 'phantom', feedback: 'A fair start in a quiet room if both stay near it — check its real pattern and the turns.' },
      { id: 'c', label: 'One mic hanging high above the table', ok: false, power: 'phantom', feedback: 'High and far: room and cross-talk.' },
      { id: 'd', label: 'A loudspeaker on the table for the producer’s cues', ok: false, power: 'none', feedback: 'A loudspeaker among open mics spills into them. Headphones.' },
      { id: 'e', label: 'A boundary under the papers, out of sight', ok: false, power: 'phantom', feedback: 'Under the papers, it hears the pages.' },
    ],
    reasons: [docReason('the lips'), clearReason('the faces, the papers and the hands'), { id: 'r.pattern', label: 'The boundary’s actual pattern was checked', role: 'optional', feedback: 'A fair reason for the shared choice.' }, BRAND_REASON('roundtable'), { id: 'r.loud', label: 'Turn the shared mic up until both are loud', role: 'wrong', feedback: 'Gain raises the room with the voices.' }],
    explain: 'Two setups pass. What passes is the reasoning: individual or shared justified by a quiet room and the people’s places, measured from the lips, clear of the papers.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: where does each panelist’s voice leave the body?', options: ['The chest', 'The mouth (and the nose)', 'The throat'], after: 'Now STEP through (or PLAY ONCE), then turn a panelist and open more mics.' },
  microphone: { prompt: 'Before you move anything: is every boundary mic an omni?', options: ['Yes', 'No', 'Only on a table'], after: 'Now choose each TYPE and see where it starts.' },
  placement: { prompt: 'Predict: the lectern gooseneck moves from 35 cm to 25 cm from the lips. What changes?', options: ['More voice, less room', 'More room', 'It depends on this presenter'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The PA is at the stage’s front corner. Where will a supercardioid lectern mic reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip the headset’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'sound',
    prompt: 'A panelist turns to a neighbour. What happens at their fixed gooseneck?',
    options: ['The voice swings off its axis and dulls', 'The gooseneck bends to follow the turning head', 'Nothing while they stay seated'],
    correct: 'The voice swings off its axis and dulls',
    explain: 'The gooseneck holds still while the mouth turns.',
    why: {
      'The gooseneck bends to follow the turning head': 'A gooseneck keeps its bend.',
      'Nothing while they stay seated': 'A head turn is enough.',
    },
  },
  {
    id: 'q.2',
    covers: 'sound',
    prompt: 'Why mute the panel mics of people who are not speaking?',
    options: ['Each open mic adds room and lowers margin', 'A muted mic sounds warmer when it is opened again', 'A mic with no talker adds only a little hiss'],
    correct: 'Each open mic adds room and lowers margin',
    explain: 'Every open mic adds the speaker later, the room, and — live — costs about 3 dB per doubling.',
    why: {
      'A muted mic sounds warmer when it is opened again': 'Muting does not change the mic’s tone.',
      'A mic with no talker adds only a little hiss': 'It adds far more than hiss: the speaker, later, the room — and live, it costs margin before feedback.',
    },
  },
  {
    id: 'q.3',
    covers: 'setting',
    critical: true,
    prompt: 'How do you check panel mics with the PA on before the event?',
    options: ['Each to its working level; any ring, pull down', 'Raise each one until it rings, to find the system’s limit', 'Open all at once at a high level to test'],
    correct: 'Each to its working level; any ring, pull down',
    explain: 'Never raise gain to provoke feedback: bring each mic up to its working level only.',
    why: {
      'Raise each one until it rings, to find the system’s limit': 'Provoking feedback risks ears and loudspeakers.',
      'Open all at once at a high level to test': 'Many open mics at a high level invite feedback.',
    },
  },
  {
    id: 'q.4',
    covers: 'setting',
    critical: true,
    prompt: 'A reporter asks for phantom power on the press feed port. What do you do?',
    options: ['Not until its policy is checked — usually off', 'Turn it on; mic inputs need it anyway', 'On, if their recorder is a good, modern one'],
    correct: 'Not until its policy is checked — usually off',
    explain: 'Check the exact port’s phantom-power policy with the event audio lead; never send phantom power into an unverified feed.',
    why: {
      'Turn it on; mic inputs need it anyway': 'A feed port is not a condenser mic; phantom power can harm an unverified device.',
      'On, if their recorder is a good, modern one': 'The recorder’s quality is not the question; the port’s policy is.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'The room heard the audience question; the stream did not. Why?',
    options: ['The question mic was not sent to the stream', 'The stream filters out the audience’s voices', 'The question was asked far too quietly to hear'],
    correct: 'The question mic was not sent to the stream',
    explain: 'A feed carries only what is routed into it.',
    why: {
      'The stream filters out the audience’s voices': 'A stream carries what it is sent.',
      'The question was asked far too quietly to hear': 'The room heard it: the route is the gap.',
    },
  },
  hearingDiag('q.6', W),
];

const wedges: Wedge[] = [
  {
    id: 'pa',
    label: 'the PA loudspeaker at the stage’s front corner',
    short: 'PA',
    p: { x: PA_C.x, y: STAND_FLOOR, z: PA_C.z },
    lift: STAND_FLOOR - PA_C.y,
    faces: { x: 1, y: 0, z: 0 },
    note: 'On a pole at the stage’s front corner, facing the audience: its back and side reach the lectern — below and off to one side of a gooseneck aimed up at the mouth.',
    prov: { kind: 'illustrative', reason: 'a typical small stage: the PA’s place and height are drawing defaults' },
    glyph: 'none',
  },
];

export const B06_LESSON: Lesson = {
  id: 'B06',
  labId: 'broadcast',
  title: 'Panels, Press Conferences and Groups',
  subtitle: 'A gooseneck each, the lectern a little off the mouth — the fewest open mics, and every voice routed on purpose',
  noun: { one: 'panel', many: 'panels', subject: 'panel', person: true },
  model: B06_MODEL,
  micTypeIds: ['bcGoose', 'bcGooseSuper', 'bcBoundary', 'vocHeadset', 'vocDynCard'],
  zones: B06_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  setupPairs: [{ label: 'A gooseneck each, two panelists', A: { zone: 'b6.goose' }, B: { zone: 'b6.gooseP3' }, variants: ['panel'] }],
  orient: [
    { title: 'WHAT IT IS', text: 'Several voices sharing a stage or a table — a panel, a roundtable, a press conference with a lectern, audience questions and a feed for the media. Each voice leaves through its own mouth.', src: 'LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'Conferences, press events, panels on stage and in studios: goosenecks on the table, a lectern, a question mic in the aisle, a PA, a stream and a press feed box.', src: 'LESSON' },
    { title: 'THE JOB', text: 'Each intended speaker intelligible at each destination, while table noise, room pickup and loudspeaker spill stay under control.', src: 'LESSON' },
    { title: 'INDIVIDUAL OR SHARED', text: 'A mic each gives the most control; a shared mic is simpler and smaller to see. The room, the PA and how much control is needed decide. Experimentation is encouraged.', src: 'LESSON' },
  ],
  sound: {
    stages: [
      { title: 'Breath from the lungs', text: 'The lungs push air up the windpipe — the power behind every word.' },
      { title: 'The vocal folds buzz', text: 'In the voice box, low in the throat, two small folds come together and the breath sets them buzzing. That buzz is the raw sound of the voice.' },
      { title: 'The throat and mouth shape it', text: 'The throat, the tongue, the lips and the open mouth shape the buzz into vowels and words; the tongue, the teeth and the lips add the consonants.' },
      { title: 'It leaves the mouth', text: 'Almost all of it leaves through the open mouth — on m, n and ng it leaves through the nose instead. That is where every distance here is measured from: the lips.' },
    ],
    attack: 'P, B and T push a puff of air straight out of the lips; S sends a narrow hiss forward. A gooseneck a little below the mouth’s line, out of that path, hears fewer breath bursts.',
    body: 'The vowels carry the level and the tone. Each voice also reaches every other open mic — farther, lower and later. Tendencies, to check by ear.',
    head: { diameterMm: 0, rods: 0, label: 'the mouth', strikeSrc: 'LESSON' },
  },
  setting: {
    items: [
      { id: 'panel', label: 'the panelists', short: 'PANEL', note: 'Seated 70 cm apart, all facing the audience, turning to each other as they talk.', prov: { kind: 'illustrative', reason: 'the shared figure seated; the seat pitch a drawing default' }, tag: 'THE SOURCES', scene: 'all' },
      { id: 'table', label: 'the table and the papers', short: 'TABLE', note: 'Papers, hands and knocks travel through the table into the bases: keep the bases away from them.', prov: { kind: 'illustrative', reason: 'the lesson L12' }, tag: 'NOISE', scene: 'all' },
      { id: 'lectern', label: 'the lectern', short: 'LECTERN', note: 'Its gooseneck about 25–36 cm from the mouth, a little off it; a short and a tall presenter both need it.', prov: { kind: 'illustrative', reason: 'the lesson L27 (B06-1)' }, tag: 'THE SOURCE', scene: 'stage' },
      { id: 'aisle', label: 'the audience question point', short: 'AISLE', note: 'A lectern mic does not cover the aisle: a question mic of its own, routed to every feed.', prov: { kind: 'illustrative', reason: 'the lesson L5, L21' }, tag: 'ROUTE', scene: 'stage' },
      { id: 'pa', label: 'the PA', short: 'PA', note: 'Every open mic hears it: the fewest open mics, the patterns’ rejection toward it.', prov: { kind: 'illustrative', reason: 'a typical small stage' }, tag: 'FEEDBACK', scene: 'stage' },
      { id: 'press', label: 'the press feed box', short: 'PRESS FEED', note: 'A copy of the mix for the reporters: it carries only what is routed into it, often at mic level from isolated outputs.', prov: { kind: 'illustrative', reason: 'the lesson L34' }, tag: 'ROUTE', scene: 'all' },
    ],
    stage: 'LECTERN: the gooseneck about 25–36 cm from the mouth, a little off it, the PA toward its rejection; a headset for walking with the lectern muted; the aisle mic routed to every feed. Never provoke feedback.',
    studio: 'PANEL: a gooseneck each, about 20–30 cm below each mouth, on separate channels — or, in a quiet room with no PA, a shared boundary between two.',
  },
  diagnostic,
  practice: {
    task: 'Choose a setup for a live panel with a stream and for a quiet roundtable, describe an alternative, and explain what would justify a second mic. With a real panel and the talkers’ agreement, you can record a placement card below.',
    fields: [
      { id: 'map', label: 'Speaking positions and destinations', kind: 'text' },
      { id: 'mics', label: 'Mic for each zone', kind: 'choice', choices: ['a gooseneck each', 'a shared boundary', 'headsets', 'lectern gooseneck + aisle mic', 'other'] },
      { id: 'aim', label: 'Distances from the lips and aims', kind: 'text' },
      { id: 'mutes', label: 'Mute and handoff plan', kind: 'text' },
      { id: 'feeds', label: 'Question route, stream and press channels', kind: 'text' },
      { id: 'notes', label: 'Cable protection and one remaining limitation', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The panelists seated (the lips 450 mm above a 740 mm table), 70 cm apart, and the presenter standing (the lips 1550 mm above the floor) — the shared figures’ drawing defaults.', dims: ['yFloor'] },
    { text: 'The table (70 cm deep, a cloth skirt), the gooseneck bases (33 cm in front, 21 cm to the left), the boundary’s place, the lectern (its top 37–43 cm below the lips, 45 cm deep), the aisle mic’s place and the PA — drawing defaults.', dims: [] },
    { text: 'The panel gooseneck’s distance (20–30 cm round the proposal’s 25 cm) and its 10–35° below the mouth’s line, and the lectern’s “a little off-centre” drawn below the mouth — the lab’s drawing. The gooseneck’s reach (46 cm) and head are drawing defaults.', dims: [] },
    { text: 'The 7–10 in gain-setting distance at a podium is not drawn as a zone (owner item O-LEC). The head turns about its centre (a simplified picture).', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. Every panel, lectern, room and PA is different: move the mics, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: talkers in typical poses, mic patterns and the two-mic comb as textbook shapes, the open-mic cost as about 3 dB per doubling, the 3:1 rule as a note, never a test. Distances are rounded to about 5 mm below 1 m and more coarsely above it, with feet from 3 m and measured from the lips to the mic’s front. Never provoke feedback; never send phantom power into an unverified feed.',
  copy: B06_COPY,
};
