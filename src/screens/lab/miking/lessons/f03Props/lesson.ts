/**
 * F03 PROPS AND OBJECT HANDLING — the lesson's pages as DATA. The words come
 * from the owner's lesson (docs/labs/miking/source_text/F03-Props-and-Object-
 * Handling-Miking-Technique.txt, "L<n>" in COMMENTS only) with the
 * corrections of foley_props/SOURCES.md §c applied and logged
 * (CORRECTIONS_LOG.md, Lab 6 · group 1): no institutional wording (F03-C1);
 * "several stations" (F03-C2); the band article replaced as the live support
 * (F03-C3, internal); the unbuilt cross-link dropped (F03-C5).
 *
 * One Foley artist and a PROP as the variant — keys, paper, a door, a chair
 * — plus a LIVE station, on the shared Foley stage (frame F). Every distance
 * a drawing default (O-6). Suggested, possible starting points; no source,
 * brand or model in learner text; fully silent.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { matchedLevels, nullOnPaper, polarityDelay, removeDelay, superNull } from '../shared/bowed/bowedItems.ts';
import { BRAND_REASON, CLEAR_REASON, DOC_REASON, LOUD_REASON, SHOCK_REASON, clearanceDiag, feedbackFoley, foleyGain, foleyRating, hearingDiag, noProvoke, repeatSymptom, shotgunRoom, thumpSymptom, type FoleyWords } from '../shared/foley/foleyItems.ts';
import { liveBooth } from '../shared/foley/stage.ts';
import type { SpExtra } from '../shared/smallperc/family.ts';
import { F03_MODEL, FLOOR } from './geometry.ts';
import { F03_ZONES } from './model.ts';
import { F03_COPY } from './copy.ts';

const W: FoleyWords = { p: 'f03', what: 'prop', loudest: 'the hardest door slam', movement: 'the whole hand and prop travel' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the prop',
    goal: 'Get to know a handled prop as a sound source — several events in several places on one object, performed in time with the picture — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A prop sound is several events in several places: the grasp, a small contact, the body answering, a final contact. Choose the prop and the action first.',
  },
  sound: {
    title: 'Where a prop’s sounds come from',
    goal: 'See how one action becomes several sounds — a small contact, the body answering, a final contact — and where each starts on the prop. Shown, never played.',
    credit: { scenarios: ['f03.snd.1', 'f03.snd.2', 'f03.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'A latch clicks at the edge; a panel resonates over its whole face; keys jingle below the ring. A mic aimed at one place hears that place most — so decide which part carries the scene.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Know what else reaches a prop mic — hands, breath, clothes, the table and the room — and what to settle first: the events named, the travel and pinch zones marked, safe props, clear exits.',
    credit: { scenarios: ['f03.set.1', 'f03.set.2', 'f03.set.hear'], note: 'Answer the three checks.' },
    takeaway: 'Name the events, rehearse at real speed, mark the whole travel and the pinch zones, and keep every mic, cable and operator outside them. Safe props, clear exits, comfortable levels.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a prop mic by its properties — a quiet condenser for soft detail, a dynamic for a loud prop or heavy stage spill, a shotgun or a small supercardioid — and compare in the room.',
    credit: { scenarios: ['f03.mic.tube', 'f03.mic.1', 'f03.mic.2', 'f03.rec.1'], note: 'Answer the four checks (one reaches back to where a prop’s sounds come from).' },
    takeaway: 'A quiet condenser reveals soft paper and small mechanisms; a dynamic suits a loud prop or a spill-heavy stage; a shotgun narrows only in the highs. No one mic suits every object — compare in the room.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — about 1–1.4 m from the prop, outside its whole travel, covering the whole action — then aim closer at the part that sounds, and see what changes.',
    credit: { scenarios: ['f03.place.1', 'f03.place.2', 'f03.place.3', 'f03.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the travel, inside two different starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'Cover the whole action first, from outside the travel; then compare an aimed look at the part that sounds. Distance and aim are separate choices, and the swing and pinch points come first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the prop mic so its rejection faces the wedge at a live station — and know why a quiet Foley stage and a theatre with a PA need different first plans.',
    credit: { scenarios: ['f03.ctx.1', 'f03.ctx.2', 'f03.ctx.ring', 'f03.ctx.studio', 'f03.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the four checks.' },
    takeaway: 'On a quiet stage, the whole action first, then a closer look. Live, a compact, stable mic at a known station, the wedge in its rejection, a distant room mic used with care — and feedback never provoked.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a close detail mic and a room mic on one prop can blur a transient together, how the arrival-time difference places comb notches, and why a moving prop shifts them as it moves.',
    credit: { scenarios: ['f03.two.1', 'f03.two.2', 'f03.two.3', 'f03.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Close detail plus room is a reasoned option, not more open channels. Record separately, compare each alone and the sum in mono over the whole action, move or rebalance first.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the prop, the performance and the aim first — a click without body, a boomy surface, a noisy stand — before processing.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up a prop mic in the right order, choose and justify a setup for a quiet stage and a live station, and say what would justify a second mic.',
    credit: { scenarios: ['f03.prac.order', 'f03.prac.gain', 'f03.prac.setup1', 'f03.prac.setup2', 'f03.prac.3', 'f03.mix.1', 'f03.mix.2', 'f03.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real stage.' },
    takeaway: 'The events named, the travel and pinch zones clear, the whole action covered first, headroom for the loudest slam and the quietest latch, and a mono check for a second mic pass. More than one setup can pass.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only: f03.snd.* L5, L8 · f03.set.* L5–L8, L49 ·
 * f03.mic.* L30–L31 · f03.place.* L13–L23 · f03.ctx.* L33–L34 · f03.two.* L28 ·
 * f03.prac.* / f03.mix.* L31, L50–L57.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'f03.snd.1',
    page: 'sound',
    prompt: 'A “door sound” in a scene. Where do its sounds start?',
    options: ['In several places: latch, hinge, panel, frame', 'Only at the handle, where the hand holds it', 'In the room, once the door has closed'],
    correct: 'In several places: latch, hinge, panel, frame',
    explain: 'One door sound is several events in several places: the latch releasing, the hinge, the panel resonating, the final contact in the frame. A mic aimed at one place hears that place most.',
    why: {
      'Only at the handle, where the hand holds it': 'The handle is one part of it; the latch, hinge, panel and frame each make their own sound.',
      'In the room, once the door has closed': 'The room carries the sound on, but it starts on the door itself.',
    },
  },
  {
    id: 'f03.snd.2',
    page: 'sound',
    prompt: 'Why might a mic close to the latch hear “a click but no door”?',
    options: ['The panel’s resonance is elsewhere on the door', 'The latch makes no sound until the door shuts', 'Close mics do not hear high, sharp sounds well'],
    correct: 'The panel’s resonance is elsewhere on the door',
    explain: 'The latch is a small, sharp event at the edge; the door’s body is the panel resonating over its whole face. Close to the latch, the click dominates — move toward a view of the panel, the frame and the room.',
    why: {
      'The latch makes no sound until the door shuts': 'The latch clicks as it releases and as it catches — that is the click.',
      'Close mics do not hear high, sharp sounds well': 'Close mics hear the click very well — that is the point.',
    },
  },
  {
    id: 'f03.snd.3',
    page: 'sound',
    prompt: 'The pictured prop sounds wrong. What is a fair first move?',
    options: ['A safe substitute prop that makes the right sound', 'A closer mic, to make the prop sound right', 'EQ on the channel, to make the prop match the picture'],
    correct: 'A safe substitute prop that makes the right sound',
    explain: 'A substitute object may match the needed sound better than the pictured one, if it is safe and controllable. No mic position fixes a prop with the wrong material or rhythm.',
    why: {
      'A closer mic, to make the prop sound right': 'A mic hears the sound the prop makes; it cannot change its material or rhythm.',
      'EQ on the channel, to make the prop match the picture': 'EQ changes balance, not the material or rhythm of the sound.',
    },
  },
  {
    id: 'f03.set.1',
    page: 'setting',
    prompt: 'Before placing a mic for a door cue, what do you mark?',
    options: ['Its whole swing and the pinch points', 'The handle’s height, to match the stand', 'The spot where it sounds loudest'],
    correct: 'Its whole swing and the pinch points',
    explain: 'Mark the door’s whole travel and its pinch zones — the hinge and the latch edge. The mic, its cable and any operator stay outside them; nothing goes in the swing.',
    why: {
      'The handle’s height, to match the stand': 'Height comes later: first the swing and the pinch points.',
      'The spot where it sounds loudest': 'Loudness is not the first question; the travel and the pinch zones are.',
    },
  },
  {
    id: 'f03.set.2',
    page: 'setting',
    prompt: 'Can the mic be fastened to the moving door for a closer sound?',
    options: ['No — not without an approved mounting plan', 'Yes — taped tightly, it cannot fall off the door', 'Yes — a small mic is light enough to ride on it'],
    correct: 'No — not without an approved mounting plan',
    explain: 'A mic on a moving door is a collision and a pinch risk, and its cable a trip. Mic the door from outside its swing; a mount on the door only with an approved mounting plan.',
    why: {
      'Yes — taped tightly, it cannot fall off the door': 'Tape does not make it safe: the swing, the pinch points and the cable stay risks.',
      'Yes — a small mic is light enough to ride on it': 'Weight is not the question; the moving door, the pinch points and the cable are.',
    },
  },
  foleyRating(W),
  {
    id: 'f03.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Where does a door’s body — its resonance — come from?',
    options: ['The panel, over its whole face', 'The latch, at the edge of the door', 'The handle, in the artist’s hand'],
    correct: 'The panel, over its whole face',
    explain: 'The panel resonates over its whole face as it swings and closes; the latch adds a small click at the edge.',
    why: {
      'The latch, at the edge of the door': 'The latch makes the click; the panel makes the body.',
      'The handle, in the artist’s hand': 'The handle starts the action; the panel resonates.',
    },
  },
  shotgunRoom(W, 'microphone'),
  {
    id: 'f03.mic.1',
    page: 'microphone',
    prompt: 'A heavy prop on a loud stage, lots of spill. A fair mic to compare?',
    options: ['A dynamic, close and aimed, outside the travel', 'A quiet condenser far back to catch the room', 'An omni, so the whole stage is evenly heard'],
    correct: 'A dynamic, close and aimed, outside the travel',
    explain: 'A dynamic may be workable when the prop is loud or stage spill is severe; a quiet condenser shines on soft paper and tiny mechanisms. Compare in the actual space.',
    why: {
      'A quiet condenser far back to catch the room': 'Far back on a loud stage it hears the spill as much as the prop.',
      'An omni, so the whole stage is evenly heard': 'An omni hears the spill from every side — the opposite of what is needed here.',
    },
  },
  {
    id: 'f03.mic.2',
    page: 'microphone',
    prompt: 'A quiet latch and a forceful door close in one cue: one gain setting cannot serve both. A fair idea?',
    options: ['Separate controlled passes or more headroom', 'Ask the artist to slam the door gently', 'Set the gain for the latch and accept clipping'],
    correct: 'Separate controlled passes or more headroom',
    explain: 'If one setting cannot serve a quiet latch and a forceful close, capture controlled separate passes or use suitable channels and headroom — never ask for unsafe force, and never accept clipping.',
    why: {
      'Ask the artist to slam the door gently': 'The scene sets the action. Change the capture, not the performance.',
      'Set the gain for the latch and accept clipping': 'Clipping cannot be undone later. Find headroom or record separate passes.',
    },
  },
  {
    id: 'f03.place.1',
    page: 'placement',
    prompt: 'Where does the first mic go for a door cue?',
    options: ['Outside the swing, covering the whole action', 'Inside the swing, right at the latch', 'On the door itself, as close as the mic can get'],
    correct: 'Outside the swing, covering the whole action',
    explain: 'First cover the complete action from outside the swing or travel; then compare an aimed view of the handle and latch and one of the panel or frame.',
    why: {
      'Inside the swing, right at the latch': 'Inside the swing the door hits it. Stay outside the travel.',
      'On the door itself, as close as the mic can get': 'Never on a moving door without an approved mounting plan.',
    },
  },
  {
    id: 'f03.place.2',
    page: 'placement',
    prompt: 'You move from the whole-action start to about 45 cm from the latch. What tends to change?',
    options: ['A sharper click, less of the panel and room', 'More of the panel and the room behind it', 'Nothing: the same door sounds the same'],
    correct: 'A sharper click, less of the panel and room',
    explain: 'Closer and aimed, the latch’s click comes forward and the panel and room drop. A close view may suit a close-up; a wide shot may need the object and room as one event.',
    why: {
      'More of the panel and the room behind it': 'That is what a farther, wider view tends to do.',
      'Nothing: the same door sounds the same': 'Distance and aim change which part of the door the mic hears most.',
    },
  },
  {
    id: 'f03.place.3',
    page: 'placement',
    prompt: 'For paper, the artist repeats the page turn. What do you change between takes?',
    options: ['Only the mic’s aim and position', 'The paper, the mic and the gain', 'The artist’s speed, to suit the mic'],
    correct: 'Only the mic’s aim and position',
    explain: 'Change one variable at a time: the performer repeats the same turn while only the mic’s aim and position move. Then you know what made the difference.',
    why: {
      'The paper, the mic and the gain': 'Three changes at once hide which one mattered.',
      'The artist’s speed, to suit the mic': 'The performance serves the scene; the mic moves, not the action.',
    },
  },
  {
    id: 'f03.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What stays outside a door’s swing and pinch points?',
    options: ['Mics, cables and any operator', 'Only the mic, not its cable', 'Only the artist’s other hand'],
    correct: 'Mics, cables and any operator',
    explain: 'Every mic, cable and operator stays outside door or furniture travel, and hands stay clear of hinges and pinch points.',
    why: {
      'Only the mic, not its cable': 'A cable in the swing is a trip and a snag. It stays out too.',
      'Only the artist’s other hand': 'Hands stay clear of pinch points — and so does all the hardware.',
    },
  },
  {
    id: 'f03.ctx.1',
    page: 'context',
    prompt: 'A live theatre: keys and a door performed at a station, through the PA. A fair first plan?',
    options: ['A compact, stable mic at a known station, wedge in its null', 'A room mic far back, so the props sound natural to the hall', 'Several mics open, one on each prop all the time'],
    correct: 'A compact, stable mic at a known station, wedge in its null',
    explain: 'A compact, stable position and a known object station keep the active prop in the pickup; aim the rejection at the wedge. A distant room mic returns the PA and takes away feedback margin.',
    why: {
      'A room mic far back, so the props sound natural to the hall': 'Far back it hears the PA and the wedge: less margin before feedback.',
      'Several mics open, one on each prop all the time': 'Each open mic takes margin away. Open what the cue needs.',
    },
  },
  superNull('f03.ctx.2', 'context', 'wedge'),
  noProvoke(W, 'context'),
  {
    id: 'f03.ctx.studio',
    page: 'context',
    prompt: 'A quiet Foley stage: a door for a medium shot. A fair first plan?',
    options: ['The whole action from outside the swing, then a closer look', 'A mic taped to the door’s handle for the closest detail', 'A mic inside the swing, aimed straight at the hinge'],
    correct: 'The whole action from outside the swing, then a closer look',
    explain: 'Cover the complete action from outside the swing first; then compare an aimed view of the latch and of the panel.',
    why: {
      'A mic taped to the door’s handle for the closest detail': 'Never a mic on a moving door without an approved mounting plan.',
      'A mic inside the swing, aimed straight at the hinge': 'Inside the swing the door hits it — and the hinge is a pinch point.',
    },
  },
  {
    id: 'f03.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Why decide which events of an action carry the scene?',
    options: ['A mic aimed at one place hears that place most', 'Only one event of an action ever makes a sound', 'The loudest event is the one to record'],
    correct: 'A mic aimed at one place hears that place most',
    explain: 'One action is several events in several places; the aim decides which come forward. Decide which carry the scene and which would distract.',
    why: {
      'Only one event of an action ever makes a sound': 'An action has several events — grasp, contact, body, final contact.',
      'The loudest event is the one to record': 'The scene decides; the loudest event may distract.',
    },
  },
  {
    id: 'f03.two.1',
    page: 'twoMic',
    prompt: 'A close latch mic and a room mic sound smeared together. Why?',
    options: ['The room mic hears each event later', 'The room mic inverts the door’s polarity', 'The close mic is louder, so the two cancel'],
    correct: 'The room mic hears each event later',
    explain: 'The farther mic hears each event later; summed, some pitches cancel and the transient blurs. Move or rebalance first; check polarity at matched levels as a diagnostic.',
    why: {
      'The room mic inverts the door’s polarity': 'Both face the same door; the difference is when the sound arrives.',
      'The close mic is louder, so the two cancel': 'Level alone does not cancel; the arrival-time difference does.',
    },
  },
  polarityDelay('f03.two.2'),
  matchedLevels('f03.two.3'),
  {
    id: 'f03.two.4',
    page: 'twoMic',
    prompt: 'A busy scene used several prop stations at once. Is that the same as a two-mic setup?',
    options: ['Each was a performance station as well as a mic', 'Yes: more stations are just more mics', 'Yes: stations must share one mic between them'],
    correct: 'Each was a performance station as well as a mic',
    explain: 'Several stations let a busy scene be covered quickly — each a performance station as well as a mic channel. Multi-mic capture should be a reasoned option, not just more open channels.',
    why: {
      'Yes: more stations are just more mics': 'Each station is a performer and a prop, not only a channel.',
      'Yes: stations must share one mic between them': 'Each station had its own pickup; the point is they are separate performances.',
    },
  },
  foleyGain(W),
  {
    id: 'f03.prac.3',
    page: 'practice',
    prompt: 'What would justify a second mic on a prop cue?',
    options: ['A useful perspective option, the mono sum holding', 'Two channels give the mix a wider choice', 'The prop needs more level than one mic on its own gives'],
    correct: 'A useful perspective option, the mono sum holding',
    explain: 'A close detail channel and a farther room/object channel, recorded separately, can give a reasoned option — if the pair holds up in mono over the whole action.',
    why: {
      'Two channels give the mix a wider choice': 'More channels also mean more room and noise. Add a mic for a reason.',
      'The prop needs more level than one mic on its own gives': 'Level comes from gain and distance, not a second mic.',
    },
  },
  {
    id: 'f03.mix.1',
    page: 'practice',
    prompt: 'Same door, same distance: one mic aimed at the latch, one at the panel. Why might they differ?',
    options: ['Each aims at a different sounding part', 'The panel mic is farther from the room', 'They cannot: the distance is the same'],
    correct: 'Each aims at a different sounding part',
    explain: 'Same distance, different aim: one hears the latch’s click most, the other the panel’s resonance. Aim and distance are separate choices.',
    why: {
      'The panel mic is farther from the room': 'Both are in the same room; the aim decides which part comes forward.',
      'They cannot: the distance is the same': 'Distance is one variable; the aim is another.',
    },
  },
  nullOnPaper('f03.mix.2', 'wedge'),
  removeDelay('f03.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'f03.sym.click',
    observation: 'A tiny click but no object body',
    firstChecks: 'Move from the latch or contact point toward a view of the panel, the frame and the room; compare the performance and the actual prop.',
    options: ['Move toward the panel and frame; check the prop', 'Boost the low end until the click has a body', 'Move the mic even closer to the latch to catch more'],
    correct: 'Move toward the panel and frame; check the prop',
    explain: 'Close to a latch, the click dominates. A view of the panel, frame and room brings the object’s body; the prop itself may need to change.',
    why: {
      'Boost the low end until the click has a body': 'EQ cannot add a body the mic does not hear.',
      'Move the mic even closer to the latch to catch more': 'Closer makes the click even more dominant.',
    },
  },
  {
    id: 'f03.sym.boom',
    observation: 'A boomy slam or a harsh ring',
    firstChecks: 'Is the mic facing one resonant surface? Adjust the angle, the distance or the force, keeping the timing.',
    options: ['The angle off the resonant surface, the distance, the force', 'A steep cut on the channel to remove the ring', 'A heavier door on the stand, so it rings a little less'],
    correct: 'The angle off the resonant surface, the distance, the force',
    explain: 'A mic facing one resonant surface hears its ring most. Change the angle or distance, or the force, while keeping the timing.',
    why: {
      'A steep cut on the channel to remove the ring': 'A cut also changes the wanted sound. Change the geometry first.',
      'A heavier door on the stand, so it rings a little less': 'A different prop may ring differently — but the aim is the first thing to check.',
    },
  },
  {
    id: 'f03.sym.soft',
    observation: 'Soft handling detail is missing',
    firstChecks: 'Quiet the room and the stand, move toward the active source within safe clearance, then confirm self-noise and gain.',
    options: ['Quiet the room, move closer within clearance, check noise', 'Turn the gain up on the channel until the detail appears', 'Ask the artist to handle the prop a little harder'],
    correct: 'Quiet the room, move closer within clearance, check noise',
    explain: 'Soft detail needs a quiet room and a quiet chain: reduce the noise, move toward the source within clearance, then check self-noise and gain.',
    why: {
      'Turn the gain up on the channel until the detail appears': 'Gain lifts the room noise with the detail.',
      'Ask the artist to handle the prop a little harder': 'The scene sets the handling. Change the capture instead.',
    },
  },
  thumpSymptom(W),
  feedbackFoley(W),
  repeatSymptom(W),
];

const orderTasks: OrderTask[] = [
  {
    id: 'f03.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a prop setup in the order you would do them.',
    steps: [
      { text: 'Name the action’s events and the shot', early: 'Start with what the scene needs.' },
      { text: 'Secure the prop; rehearse; mark the travel and pinch zones', early: 'Know the travel before anything is placed.' },
      { text: 'Choose a mic for this prop and stage, with a shock mount', early: 'Choose once the events and the travel are known.' },
      { text: 'Place it outside the travel, covering the whole action', early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs; then switch phantom on if the mic needs it', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set gain on the quietest handling and the loudest slam', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Then compare an aimed view of the part that sounds', early: 'Compare only once the whole action is covered and the level is safe.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower the monitoring before switching it, and follow the mic’s manual. Gain: watch the peaks — a brief slam can overload a slow meter’s reading.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'f03.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A quiet Foley stage, a medium shot: a door opened, walked through and closed. Phantom power available.',
    setups: [
      { id: 'a', label: 'One mic about 1.2 m out, outside the swing, covering the whole action', ok: true, power: 'phantom', feedback: 'A suggested starting point: the whole door — then compare a closer look.' },
      { id: 'b', label: 'A close detail mic at the latch plus a room mic, on separate channels', ok: true, power: 'phantom', feedback: 'A reasoned pair: check each alone and the sum in mono over the whole action.' },
      { id: 'c', label: 'A mic taped to the door’s face', ok: false, power: 'phantom', feedback: 'Never on a moving door without an approved mounting plan.' },
      { id: 'd', label: 'A stand inside the swing, aimed at the hinge', ok: false, power: 'phantom', feedback: 'Inside the swing, beside a pinch point. Stay outside the travel.' },
      { id: 'e', label: 'A mic across the doorway the artist walks through', ok: false, power: 'phantom', feedback: 'That blocks the way through and the exit. Keep the path clear.' },
    ],
    reasons: [DOC_REASON('the prop’s sounding part'), CLEAR_REASON('the swing, the pinch points and the travel'), { id: 'r.power', label: 'The channel gives the condenser the phantom power it needs', role: 'required', feedback: 'Say how the mic is powered: these condensers need phantom power.' }, SHOCK_REASON, BRAND_REASON, LOUD_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: the whole action covered from outside the travel, the pinch points clear, and the power the mic needs.',
  },
  {
    id: 'f03.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A live theatre: keys and a drawer performed at a station beside the stage, through the PA, a wedge in front.',
    setups: [
      { id: 'a', label: 'A small supercardioid close at the station, the wedge in its rejection', ok: true, power: 'phantom', feedback: 'A suggested starting point for live: compact, stable, aimed — check at show level.' },
      { id: 'b', label: 'A dynamic close at the station, the wedge behind it', ok: true, power: 'none', feedback: 'A fair live choice where spill is heavy — check the wedge against the real pattern.' },
      { id: 'c', label: 'A room mic far back to make the props sound natural', ok: false, power: 'phantom', feedback: 'Far back it returns the PA and takes away feedback margin.' },
      { id: 'd', label: 'Push the gain until it rings, then back it off', ok: false, power: 'phantom', feedback: 'Never provoke feedback. Check with the operator, short of any ring.' },
      { id: 'e', label: 'A mic in the drawer’s travel, for the closest sound', ok: false, power: 'phantom', feedback: 'The drawer hits it. Stay outside the travel.' },
    ],
    reasons: [DOC_REASON('the prop’s sounding part'), CLEAR_REASON('the hand’s and the drawer’s travel'), { id: 'r.null', label: 'The pattern’s rejection faces the wedge', role: 'required', feedback: 'Say where the wedge sits against the pattern.' }, { id: 'r.op', label: 'The gain is checked with the operator at show level', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, { id: 'r.ring', label: 'Find the edge of feedback, then back off', role: 'wrong', feedback: 'Feedback is never provoked — not even to find the edge.' }],
    explain: 'Two setups pass. What passes is the reasoning: a compact, stable pickup at a known station, the wedge in its rejection, the travel clear, and gain checked with the operator — never by making it ring.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: where does a door’s sound start?', options: ['Only at the handle', 'In several places on the door', 'In the room'], after: 'Now STEP through (or PLAY ONCE) and watch the hand, the contact, the body and the final contact.' },
  microphone: { prompt: 'Before you move anything: where will the supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move from the whole-action start to about 45 cm from the latch. What changes?', options: ['A sharper click', 'More room', 'It depends on this door'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge is on the floor in front of the artist. Where will a supercardioid aimed at the keys reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What is the first decision for a prop cue?',
    options: ['The prop and the action that make the sound', 'The one mic model that suits all props', 'The distance that suits this particular room'],
    correct: 'The prop and the action that make the sound',
    explain: 'Choose the prop and the action before the microphone: a mic cannot fix a prop with the wrong material or rhythm.',
    why: {
      'The one mic model that suits all props': 'No one mic suits every object; and the prop comes first.',
      'The distance that suits this particular room': 'Distance comes after the prop and the action.',
    },
  },
  {
    id: 'q.2',
    covers: 'sound',
    prompt: 'A mic close to a door’s latch tends to hear…',
    options: ['A sharp click, little of the panel', 'The panel’s resonance most of all', 'The whole door and the room evenly'],
    correct: 'A sharp click, little of the panel',
    explain: 'Close and aimed at the latch, the click dominates; the panel’s body and the room are elsewhere.',
    why: {
      'The panel’s resonance most of all': 'The panel resonates over its face, away from the latch.',
      'The whole door and the room evenly': 'That is a farther, wider view.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'Why name each event of an action before placing a mic?',
    options: ['Each starts in its own place on the prop', 'Each event needs a mic of its own', 'Only one of them reaches the mic'],
    correct: 'Each starts in its own place on the prop',
    explain: 'A grasp, a contact, a resonance and a final contact each start somewhere on the prop. Naming them tells you where to aim — and which would distract.',
    why: {
      'Each event needs a mic of its own': 'One mic can cover several events; naming them decides the aim.',
      'Only one of them reaches the mic': 'All of them reach it; the aim decides which come forward.',
    },
  },
  {
    id: 'q.4',
    covers: 'setting',
    prompt: 'What may never be fastened to a moving door without an approved mounting plan?',
    options: ['A microphone', 'A strip of tape', 'The artist’s hand'],
    correct: 'A microphone',
    explain: 'A mic on a moving door is a collision, pinch and trip risk; mic the door from outside its swing.',
    why: {
      'A strip of tape': 'Tape is not the risk; a mic and its cable riding the door are.',
      'The artist’s hand': 'The hand opens the door — kept clear of the hinge and latch pinch points.',
    },
  },
  clearanceDiag(W),
  hearingDiag(W),
];

const BOOTH = liveBooth(FLOOR.live);
const wedges: Wedge[] = [
  {
    id: 'wedge',
    label: 'a wedge on the floor in front of the artist, facing back at them',
    short: 'WEDGE',
    p: BOOTH.wedge.p,
    lift: 150,
    faces: BOOTH.wedge.faces,
    note: 'On the floor in front of the artist and off to their right, facing back at them: below and behind a mic aimed at the keys.',
    prov: { kind: 'illustrative', reason: 'a typical station layout; the wedge’s place is a drawing default' },
  },
];

const SP: SpExtra = {
  strikeTitle: 'Handle to sound',
  plan: { box: F03_MODEL.views.top!, things: [] },
  close: { side: { u0: -900, u1: 2700, v0: -1900, v1: 1060 }, top: { u0: -900, u1: 800, v0: -900, v1: 900 } },
};

export const F03_LESSON: Lesson & { sp: SpExtra } = {
  id: 'F03',
  labId: 'field',
  title: 'Props and Object Handling',
  subtitle: 'Keys, paper, a door, a chair: the whole action first from outside the travel, then the part that sounds',
  noun: { one: 'prop', many: 'props', subject: 'handled props' },
  model: F03_MODEL,
  micTypeIds: ['shotgunShort', 'scSupercard', 'smallDynCard', 'ldcRoom'],
  zones: F03_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Foley props are everyday objects a performer handles in time with the picture — keys, paper, doors, drawers, furniture. The line between Foley and sound effects is a workflow choice.', src: 'OUP-MW' },
    { title: 'SEVERAL SOUNDS IN ONE', text: 'One “door sound” is a grasp, a latch, a hinge, a panel and a final contact — each in its own place on the prop.', src: 'LESSON-F03' },
    { title: 'THE PROP FIRST', text: 'A safe substitute may match the needed sound better than the pictured object. No mic can fix the wrong material or rhythm.', src: 'ASE-CROSS' },
    { title: 'THE TRAVEL', text: 'A hand’s arc, a door’s swing and its pinch points, a drawer’s or a chair’s travel: every mic, cable and operator stays outside them.', src: 'LESSON-F03' },
  ],
  sound: {
    stages: [
      { title: 'The hand moves it', text: 'The hand grasps and moves the prop, in time with the picture: the start of the action.' },
      { title: 'A small contact', text: 'A small, sharp event in one place on the prop.', byVariant: { keys: 'Key strikes key below the ring: small, bright metal clicks.', live: 'Key strikes key below the ring: small, bright metal clicks.', paper: 'The sheet bends and rubs against the table: friction and a crisp crackle.', door: 'The lever turns and the latch releases at the door’s edge: a small, sharp click.', chair: 'A leg scrapes on the floor as the chair is dragged: the sound starts at the floor.' } },
      { title: 'The body answers', text: 'The larger part of the prop answers.', byVariant: { keys: 'The ring and the keys ring on together, spreading round the hand.', live: 'The ring and the keys ring on together, spreading round the hand.', paper: 'The table under the sheet answers the set-down: the table can be part of the sound.', door: 'The panel resonates as it swings — over its whole face, away from the latch.', chair: 'The chair’s frame rattles above the legs: structure, not only the floor.' } },
      { title: 'The final contact and the room', text: 'A final contact — the key in the lock, the sheet set down, the door into its frame, the chair set down — and the room carries it on.' },
    ],
    attack: 'The small contacts are sharp and brief: a latch, a jingle, a leg’s knock. A close, aimed mic tends to hear more of them — and of the hands.',
    body: 'The body — a panel, a table, a chair’s frame — rings on after the contact. A farther mic tends to join the object’s parts and the room.',
    head: { diameterMm: 0, rods: 0, label: 'the prop', strikeSrc: 'LESSON-F03' },
  },
  setting: {
    items: [
      { id: 'travel', label: 'the hand’s arc, the swing and the travel', short: 'THE TRAVEL', note: 'A door’s swing, its pinch points, a drawer’s or a chair’s travel: every mic, cable and operator stays outside.', prov: { kind: 'illustrative', reason: 'F03 L49' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'hands', label: 'hands, breath and clothes', short: 'THE PERFORMER', note: 'Finger and breath noise sit close to a prop: aim at the part that sounds, not the performer.', prov: { kind: 'illustrative', reason: 'F03 L14, L17' }, tag: 'SPILL', scene: 'all' },
      { id: 'table', label: 'the table and the floor', short: 'TABLE · FLOOR', note: 'A table can resonate under a set-down, and vibration reaches the stand: part of the sound, or a noise to check.', prov: { kind: 'illustrative', reason: 'F03 L14, L23' }, tag: 'THE SOURCE', scene: 'all' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'Some distance keeps the room’s natural space in the sound — and brings its noise.', prov: { kind: 'illustrative', reason: 'OUP-MW' }, tag: 'ROOM SOUND', scene: 'studio' },
      { id: 'pa', label: 'the PA and the wedge', short: 'PA · WEDGE', note: 'Live, a distant room mic returns the PA and takes away feedback margin; a compact mic at a known station works better.', prov: { kind: 'illustrative', reason: 'S-3REASONS, S-LIVE' }, tag: 'FEEDBACK PATH', scene: 'stage' },
    ],
    stage: 'LIVE: a compact, stable mic at a known prop station, the wedge in its rejection, the gain checked with the operator — never by making it ring.',
    studio: 'STUDIO: the whole action first from outside the travel, then an aimed look at the part that sounds; a room mic only for a reason.',
  },
  diagnostic,
  practice: {
    task: 'Choose a prop setup for a quiet Foley stage and for a live station, compare a whole-action view with an aimed detail, and explain what would justify a second mic. With a real performer and their agreement, you can record what you tried below.',
    fields: [
      { id: 'cue', label: 'Prop, action and the shot', kind: 'text' },
      { id: 'events', label: 'The audible events, in order', kind: 'text' },
      { id: 'mic', label: 'Mic type and pattern', kind: 'choice', choices: ['short shotgun', 'small supercardioid', 'small dynamic', 'large condenser (room)', 'other'] },
      { id: 'pos', label: 'Capsule to the sounding part; aim; nearest and farthest', kind: 'text' },
      { id: 'clear', label: 'Travel, pinch zones and cables checked', kind: 'text' },
      { id: 'notes', label: 'What you heard: click, body, room (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'Every prop’s size (a 30 mm key ring with 55 mm keys, an A4 sheet, an 800 × 2000 mm door with its handle 1 m up, a 450 mm chair) and the table — drawing defaults; no source gives one.', dims: [] },
    { text: 'Every distance to a prop (about 1–1.4 m for the whole action, 35–55 cm for the detail, 2.2–2.8 m for the room, 0.6–1 m for the panel) — drawing defaults (O-6).', dims: [] },
    { text: 'The keep-outs — the hand’s arc, the door’s swing (its leaf’s width) and pinch points, the chair’s path — drawing defaults.', dims: [] },
    { text: 'The live station, the PA and the wedge, and the artist’s figure — drawing defaults.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — possible starting points and ideas to consider, not rules. For props no one distance is established, so these are our own suggested places to begin. Every prop, performer and room is different: move the mic, experiment, and trust your ears and the room. Experimentation is encouraged. The lab is silent and draws a simplified picture: the artist in a typical pose, the travel and pinch points as keep-outs, mic patterns and the two-mic comb as textbook shapes. Distances are rounded to about 5 mm and measured from the prop’s sounding part to the mic’s capsule. Place real mics with the performer stopped, and only with their agreement.',
  copy: F03_COPY,
  sp: SP,
};
