/**
 * F04 IMPACTS, LIQUIDS AND TEXTURES — the lesson's pages as DATA. The words
 * come from the owner's lesson (docs/labs/miking/source_text/F04-Impacts-
 * Liquids-and-Textures-Miking-Technique.txt, "L<n>" in COMMENTS only) with
 * the corrections of foley_impacts_liquids/SOURCES.md §c applied and logged
 * (CORRECTIONS_LOG.md, Lab 6 · group 1): no institutional wording (F04-C1);
 * "suggested safe materials" (F04-C2); the maker's guide cited by its PDF
 * (F04-C3, internal); the hydrophone and contact sensor taught HERE, as
 * cards (F04-C4, O-7).
 *
 * This is Lab 6 part 1's WATER AND ELECTRICAL SAFETY lesson: its safety lines
 * are kept exact in meaning. Suggested, possible starting points; no source,
 * brand or model in learner text; fully silent.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { matchedLevels, nullOnPaper, polarityDelay, removeDelay, superNull } from '../shared/bowed/bowedItems.ts';
import { BRAND_REASON, CLEAR_REASON, DOC_REASON, LOUD_REASON, clearanceDiag, feedbackFoley, foleyGain, foleyRating, hearingDiag, noProvoke, repeatSymptom, thumpSymptom, type FoleyWords } from '../shared/foley/foleyItems.ts';
import { liveBooth } from '../shared/foley/stage.ts';
import type { SpExtra } from '../shared/smallperc/family.ts';
import { F04_MODEL, FLOOR } from './geometry.ts';
import { F04_ZONES } from './model.ts';
import { F04_COPY } from './copy.ts';

const W: FoleyWords = { p: 'f04', what: 'effect', loudest: 'the strongest planned hit', movement: 'the splash and the whole travel' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the sources',
    goal: 'Get to know three small, safe Foley sources — an impact, a little water, a dry texture — as sounds with an attack and a body or tail, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'An impact is a contact and a resonating body; water is an entry, a splash, bubbles and a long drip tail; a texture is a steady friction with a natural end. Safe materials first.',
  },
  sound: {
    title: 'Where these sounds come from',
    goal: 'See how each action becomes sound — the attack (contact, entry, friction), the body (the table, the bubbles and the wall, the board) and the tail — and where each starts. Shown, never played.',
    credit: { scenarios: ['f04.snd.1', 'f04.snd.2', 'f04.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'The attack is sharp and brief, the body and the tail longer and quieter. Set the gain on the strongest hit, let the tail finish — and decide which part the scene needs.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Know what else reaches the mic — handling, stand and table vibration, the room — and the water and electrical rules to settle before any stand goes up: the splash marked with the mic absent, electronics away from the wet area.',
    credit: { scenarios: ['f04.set.1', 'f04.set.2', 'f04.set.hear'], note: 'Answer the three checks.' },
    takeaway: 'Mark the splash with the mic absent and set the stand outside it; keep power, cables and connectors away from water; a windscreen is not a water barrier; never energise wet equipment. Hearing comes first.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose by properties — a condenser or a dynamic by level and detail, the mic’s maximum level and power — and know the three sensing paths: air, water and structure.',
    credit: { scenarios: ['f04.mic.1', 'f04.mic.2', 'f04.mic.3', 'f04.rec.1'], note: 'Answer the four checks (one reaches back to where these sounds come from).' },
    takeaway: 'An airborne mic hears the surface; a hydrophone made for immersion hears the water; a contact sensor hears the structure. Check the real mic’s maximum level and powering — never an ordinary mic in water.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — an airborne mic off to the side of the basin, outside the splash; a close view of the impact; a mic along the stroke — then compare a farther view, and see what changes.',
    credit: { scenarios: ['f04.place.1', 'f04.place.2', 'f04.place.3', 'f04.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every keep-out, inside two different starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A starting point is a place to begin, read from the action to the capsule — not a rule. Close means close to the edge of the splash, never inside it; distance trades attack for body, room and tail.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the effects mic so its rejection faces the wedge at a live station — and know why a quiet Foley stage and a live theatre need different plans, and no wet effect live without approved containment.',
    credit: { scenarios: ['f04.ctx.1', 'f04.ctx.2', 'f04.ctx.ring', 'f04.ctx.studio', 'f04.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the four checks.' },
    takeaway: 'On a quiet stage, change props, distance and protection between takes. Live, small contained effects at a fixed station, the wedge in the rejection, no wet effect without approved containment — and feedback never provoked.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why two mics on one splash can blur its attack together, how the arrival-time difference places comb notches, and why each mic is given a different task.',
    credit: { scenarios: ['f04.two.1', 'f04.two.2', 'f04.two.3', 'f04.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Begin with one mic per cue. A second earns its place with a different task — the entry or the tail, the room — recorded and labelled separately, checked in mono; choosing between mics is as fair as summing them.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the source, the force and the splash first — the headroom at the mic, the preamp and the recorder — before any processing. If anything gets wet, stop.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up an effects mic in the right order, choose and justify a setup for a small pour and a live impact, and say what would justify a second mic.',
    credit: { scenarios: ['f04.prac.order', 'f04.prac.gain', 'f04.prac.setup1', 'f04.prac.setup2', 'f04.prac.3', 'f04.mix.1', 'f04.mix.2', 'f04.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real stage.' },
    takeaway: 'Attack and tail named, the splash marked and kept clear, headroom from the strongest planned hit, the sensing path named, and a mono check for a second mic pass. More than one setup can pass.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only: f04.snd.* L5, L22–L24 · f04.set.* L26–L27, L49 ·
 * f04.mic.* L21, L28 · f04.place.* L12–L19 · f04.ctx.* L33–L34 · f04.two.* L30 ·
 * f04.prac.* / f04.mix.* L23, L50–L57.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'f04.snd.1',
    page: 'sound',
    prompt: 'An impact on a table. Is its first click the whole sound?',
    options: ['No: the object, the table and the room add the body', 'Yes: an impact is one sharp event, and there is nothing more', 'Yes: the rest is noise the mic should keep out'],
    correct: 'No: the object, the table and the room add the body',
    explain: 'The striking object, the contact surface, the resonant body and the room each contribute. A close mic hears the click; a farther one the body and the room.',
    why: {
      'Yes: an impact is one sharp event, and there is nothing more': 'The click is the attack; the table and the room ring on after it.',
      'Yes: the rest is noise the mic should keep out': 'The body may be exactly what the scene needs. Decide which part it wants.',
    },
  },
  {
    id: 'f04.snd.2',
    page: 'sound',
    prompt: 'Why let the drips finish before the next pour?',
    options: ['The drip tail can last a long time and is part of it', 'The water needs to settle before it can splash again', 'The mic needs a rest between loud splashes'],
    correct: 'The drip tail can last a long time and is part of it',
    explain: 'Water can leave a surprisingly long drip tail: cutting it off with the next take loses part of the sound. Let the decay or the drips finish.',
    why: {
      'The water needs to settle before it can splash again': 'Water splashes either way; the point is not to cut off the tail.',
      'The mic needs a rest between loud splashes': 'Mics do not tire; the tail is the reason to wait.',
    },
  },
  {
    id: 'f04.snd.3',
    page: 'sound',
    prompt: 'A brush across fabric: where does its sound start?',
    options: ['Along the line where the bristles rub the fabric', 'At the brush’s handle, in the artist’s gripping hand', 'Under the board, where it rests on the table'],
    correct: 'Along the line where the bristles rub the fabric',
    explain: 'The friction is along the stroke, changing with pressure, with the board’s resonance under it and a natural end. Aim along that line, never where the brush can cross the mic.',
    why: {
      'At the brush’s handle, in the artist’s gripping hand': 'The handle and fingers make unwanted noise; the texture is at the bristles.',
      'Under the board, where it rests on the table': 'The board answers, but the friction starts at the bristles.',
    },
  },
  {
    id: 'f04.set.1',
    page: 'setting',
    prompt: 'How do you find where the mic stand may go for a water cue?',
    options: ['Rehearse with the mic absent and mark the splash', 'Put the mic up first and watch where it gets wet', 'Use a rain cover and place the mic anywhere'],
    correct: 'Rehearse with the mic absent and mark the splash',
    explain: 'Mark the likely splash footprint with the mic absent, then set the stand outside it — power supplies, recorder, cables and connectors away from the wet area too.',
    why: {
      'Put the mic up first and watch where it gets wet': 'Water inside a mic can cause fire or electric shock. Find the splash before any equipment is there.',
      'Use a rain cover and place the mic anywhere': 'A rain cover is for between takes, not while recording; it does not make a mic splash-proof.',
    },
  },
  {
    id: 'f04.set.2',
    page: 'setting',
    prompt: 'Will a foam windscreen keep splashes off the mic?',
    options: ['No — a windscreen is not a water barrier', 'Yes — foam soaks up the water before it reaches the mic', 'Yes — as long as it is a thick, furry windscreen'],
    correct: 'No — a windscreen is not a water barrier',
    explain: 'A windscreen is for wind and handling, not water. A splash on one gives a loud thump and can ruin the take — less water and more distance, not a windscreen, keep the mic safe.',
    why: {
      'Yes — foam soaks up the water before it reaches the mic': 'Wet foam passes water on and thumps when hit. Keep the mic outside the splash.',
      'Yes — as long as it is a thick, furry windscreen': 'A furry windscreen is still not waterproof, and a hit still thumps.',
    },
  },
  foleyRating(W),
  {
    id: 'f04.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Which part of a pour is the loudest, briefest moment?',
    options: ['The entry: the splash as it hits the surface', 'The drips: the tail after the pour has ended', 'The bubbles: the sound inside the water'],
    correct: 'The entry: the splash as it hits the surface',
    explain: 'The entry and its splash are the attack — loudest and briefest; set the gain on it. The drips are the long, quiet tail.',
    why: {
      'The drips: the tail after the pour has ended': 'The drips are the quiet, long tail.',
      'The bubbles: the sound inside the water': 'Bubbles are part of the body, after the entry.',
    },
  },
  {
    id: 'f04.mic.1',
    page: 'microphone',
    prompt: 'You want the sound inside the water. What do you use?',
    options: ['A hydrophone made and rated for immersion', 'An ordinary condenser in a plastic bag, lowered in', 'A dynamic held just under the surface'],
    correct: 'A hydrophone made and rated for immersion',
    explain: 'A hydrophone senses pressure in water — only a model made and rated for immersion, with a compatible connection. Never an ordinary microphone lowered into a basin: water inside can cause fire or electric shock.',
    why: {
      'An ordinary condenser in a plastic bag, lowered in': 'Improvised waterproofing is never safe, and a bag is not a neutral acoustic barrier.',
      'A dynamic held just under the surface': 'An ordinary mic is not made for water — the risk is the same.',
    },
  },
  {
    id: 'f04.mic.2',
    page: 'microphone',
    prompt: 'A contact sensor on the dry outside of the basin hears…',
    options: ['Vibration in the container itself', 'The splash in the air above the water', 'The pressure inside the water'],
    correct: 'Vibration in the container itself',
    explain: 'A contact transducer senses structure-borne vibration — a distinct path from the air and from the water. Label each track with its sensing medium.',
    why: {
      'The splash in the air above the water': 'That is the airborne mic’s path.',
      'The pressure inside the water': 'That is the hydrophone’s path.',
    },
  },
  {
    id: 'f04.mic.3',
    page: 'microphone',
    prompt: 'A strong impact distorts. The mic has a pad switch. When does the pad help?',
    options: ['Only if the overload is at the mic itself', 'Whenever it distorts: a pad fixes it', 'Only once the take has been recorded'],
    correct: 'Only if the overload is at the mic itself',
    explain: 'A pad helps only if the mic has one and the overload is at that stage. Check the mic, the preamp and the recorder independently; a later fader cannot undo earlier clipping.',
    why: {
      'Whenever it distorts: a pad fixes it': 'If the overload is at the preamp or the recorder, the pad in the mic does not help.',
      'Only once the take has been recorded': 'After recording the clipping is already there. Find the stage that overloads first.',
    },
  },
  {
    id: 'f04.place.1',
    page: 'placement',
    prompt: 'For the pour, where does the airborne mic start?',
    options: ['Off to the side, outside the marked splash', 'Above the basin, close in over the middle of the water', 'In the splash, behind a windscreen'],
    correct: 'Off to the side, outside the marked splash',
    explain: 'Keep a normal airborne mic outside the marked splash, off to the side of the basin, aimed at the entry or the wall. “Close” means close to the splash’s edge, never inside it.',
    why: {
      'Above the basin, close in over the middle of the water': 'Right over the water is in the splash — water can reach the capsule.',
      'In the splash, behind a windscreen': 'A windscreen is not a water barrier.',
    },
  },
  {
    id: 'f04.place.2',
    page: 'placement',
    prompt: 'You move from the close impact start to about 1.5 m. What tends to change?',
    options: ['More body, room and decay; a softer attack', 'A sharper click, with less of the room', 'Nothing but the level of the impact'],
    correct: 'More body, room and decay; a softer attack',
    explain: 'Farther, the mic joins the object, its resonance and the room, at the cost of more room noise; closer reveals the contact transient but may miss the body.',
    why: {
      'A sharper click, with less of the room': 'That is what moving closer tends to do.',
      'Nothing but the level of the impact': 'Distance changes the balance of attack, body and room.',
    },
  },
  {
    id: 'f04.place.3',
    page: 'placement',
    prompt: 'Moving the mic, you notice the artist is hitting harder. What do you do?',
    options: ['Repeat with the original position, same force', 'Keep the harder hit, it suits the new place', 'Lower the gain and carry on comparing'],
    correct: 'Repeat with the original position, same force',
    explain: 'If moving the mic also changed the performer’s force, repeat with the original position before drawing a conclusion: change one variable at a time.',
    why: {
      'Keep the harder hit, it suits the new place': 'Then two things changed at once — you cannot tell which mattered.',
      'Lower the gain and carry on comparing': 'The force changed the sound itself; gain cannot undo that.',
    },
  },
  {
    id: 'f04.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Where do power supplies and cable joins go for a water cue?',
    options: ['Away from the wet area, dry', 'Under the basin’s table, close by', 'On the mat, near the action'],
    correct: 'Away from the wet area, dry',
    explain: 'Power supplies, the recorder, cables and connectors stay away from the wet area; dry your hands before touching controls.',
    why: {
      'Under the basin’s table, close by': 'Under the basin is where water drips. Keep them away from the wet area.',
      'On the mat, near the action': 'The mat is the wet area. Keep electronics away from it.',
    },
  },
  {
    id: 'f04.ctx.1',
    page: 'context',
    prompt: 'A live theatre wants a splash effect through the PA. What comes first?',
    options: ['Approved containment, cleanup and separation', 'A mic close in over the water for plenty of level', 'A louder splash to beat the PA'],
    correct: 'Approved containment, cleanup and separation',
    explain: 'Avoid a wet effect in a live stage area unless the venue has approved containment, cleanup and equipment separation. Then a small contained effect at a fixed station, the wedge in the rejection.',
    why: {
      'A mic close in over the water for plenty of level': 'Over the water is inside the splash — a water and electrical risk.',
      'A louder splash to beat the PA': 'More water means more risk. Containment and the setup come first.',
    },
  },
  superNull('f04.ctx.2', 'context', 'wedge'),
  noProvoke(W, 'context'),
  {
    id: 'f04.ctx.studio',
    page: 'context',
    prompt: 'A quiet Foley stage: a small pour for a close shot. A fair first plan?',
    options: ['One airborne mic beside the basin, outside the splash', 'A condenser right above the basin with a windscreen', 'Two mics in the splash for the closest possible sound'],
    correct: 'One airborne mic beside the basin, outside the splash',
    explain: 'One mic off to the side, outside the marked splash, aimed at the entry or the wall, is a place to begin; compare a farther position that includes the trickle and the drips.',
    why: {
      'A condenser right above the basin with a windscreen': 'Above the water is in the splash, and a windscreen is not a water barrier.',
      'Two mics in the splash for the closest possible sound': 'No mic belongs in the splash.',
    },
  },
  {
    id: 'f04.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · What does a hydrophone hear that an airborne mic does not?',
    options: ['Pressure inside the water', 'The splash in the air', 'The table’s vibration'],
    correct: 'Pressure inside the water',
    explain: 'A hydrophone hears pressure in the water — internal water sounds; an airborne mic hears the surface; a contact sensor hears the structure.',
    why: {
      'The splash in the air': 'That is the airborne mic’s path.',
      'The table’s vibration': 'That is a contact sensor’s path.',
    },
  },
  {
    id: 'f04.two.1',
    page: 'twoMic',
    prompt: 'An entry mic and a farther mic make the splash sound blurred together. Why?',
    options: ['They hear the attack at different times', 'The farther mic inverts the water’s polarity', 'The entry mic is louder, so the two cancel'],
    correct: 'They hear the attack at different times',
    explain: 'Different arrival times change the attack in the sum; moving water makes any one alignment imperfect. Check each alone, then the mono sum; choose or rebalance.',
    why: {
      'The farther mic inverts the water’s polarity': 'Both face the same water; the difference is when the sound arrives.',
      'The entry mic is louder, so the two cancel': 'Level alone does not cancel; the arrival-time difference does.',
    },
  },
  polarityDelay('f04.two.2'),
  matchedLevels('f04.two.3'),
  {
    id: 'f04.two.4',
    page: 'twoMic',
    prompt: 'You have two airborne mics on a splash. Do they need to be summed?',
    options: ['Choosing one of them can be the answer', 'Yes: two main mics are mixed together', 'Yes: summing is the only way to use a second mic'],
    correct: 'Choosing one of them can be the answer',
    explain: 'Choosing among mics, rather than combining every main mic, is a fair working method; a second mic can be a distant perspective or a different task.',
    why: {
      'Yes: two main mics are mixed together': 'Summing adds a comb; choosing is as fair.',
      'Yes: summing is the only way to use a second mic': 'A second mic can be chosen instead, or used for a different task.',
    },
  },
  foleyGain(W),
  {
    id: 'f04.prac.3',
    page: 'practice',
    prompt: 'What would justify a second mic on a water cue?',
    options: ['A different task: the entry or the tail and room', 'The same view twice, for a little more level overall', 'Two channels give the mix a wider choice'],
    correct: 'A different task: the entry or the tail and room',
    explain: 'Give a second mic a different task — one at the entry, one on the body, the room or the drip tail — record it separately, label its sensor and position, and check the mono sum.',
    why: {
      'The same view twice, for a little more level overall': 'Level comes from gain; the same view twice only adds a comb.',
      'Two channels give the mix a wider choice': 'More channels mean more room and noise; add one for a task.',
    },
  },
  {
    id: 'f04.mix.1',
    page: 'practice',
    prompt: 'Same mic, same place: a hard hit and a soft one. Why set the gain on the hard one?',
    options: ['Clipping at the mic or preamp cannot be undone later', 'The soft one needs no gain at all, so it does not matter', 'The hard hit sounds better at a higher gain'],
    correct: 'Clipping at the mic or preamp cannot be undone later',
    explain: 'Set gain on the loudest intended impact or splash: a later fader cannot undo earlier clipping. Then check the quiet detail and the tail for noise.',
    why: {
      'The soft one needs no gain at all, so it does not matter': 'It needs gain too — set from the loudest, then check the quiet parts.',
      'The hard hit sounds better at a higher gain': 'Gain is about headroom, not about making it sound better.',
    },
  },
  nullOnPaper('f04.mix.2', 'wedge'),
  removeDelay('f04.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'f04.sym.thunk',
    observation: 'A thump on the take, or a muffled sound after a splash',
    firstChecks: 'Stop. Move the mic and stand farther outside the splash; inspect the protection and dry or replace it as its maker instructs.',
    options: ['Stop; move it out of the splash; dry it as its maker says', 'Carry on, and cut the thump out of the take in the edit later', 'Add a second windscreen over the first one'],
    correct: 'Stop; move it out of the splash; dry it as its maker says',
    explain: 'Water hit the mic or its windscreen. Stop, move it farther out, and follow the maker’s guidance before using wet equipment again.',
    why: {
      'Carry on, and cut the thump out of the take in the edit later': 'A wet mic is a risk; stop first.',
      'Add a second windscreen over the first one': 'Windscreens are not water barriers.',
    },
  },
  {
    id: 'f04.sym.clicknobody',
    observation: 'A click with no body or tail',
    firstChecks: 'Let the object resonate; move from contact-only pickup toward its body or a useful room position.',
    options: ['Let it ring; move toward the body or a room view', 'Boost the low end until the click has some body', 'Strike harder so the body comes through'],
    correct: 'Let it ring; move toward the body or a room view',
    explain: 'A contact-only view hears the attack. Let the object resonate and move toward its body or the room.',
    why: {
      'Boost the low end until the click has some body': 'EQ cannot add a body the mic did not hear.',
      'Strike harder so the body comes through': 'Unsafe force is never the answer; move the mic.',
    },
  },
  {
    id: 'f04.sym.distort',
    observation: 'The impact or the splash distorts',
    firstChecks: 'Reduce the force if it keeps the cue; check the mic, preamp and recorder headroom independently, then retake.',
    options: ['Less force if it suits; headroom at each stage', 'Pull the fader down until it sounds clean', 'Ask for a bigger hit to test the limits'],
    correct: 'Less force if it suits; headroom at each stage',
    explain: 'Find the stage that overloads — the mic, the preamp, the recorder — before retaking. A fader after the overload cannot repair it.',
    why: {
      'Pull the fader down until it sounds clean': 'The clipping happened before the fader.',
      'Ask for a bigger hit to test the limits': 'More force makes it worse — and less safe.',
    },
  },
  thumpSymptom(W),
  feedbackFoley(W),
  repeatSymptom(W),
];

const orderTasks: OrderTask[] = [
  {
    id: 'f04.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a water-cue setup in the order you would do them.',
    steps: [
      { text: 'Name the event: entry, splash, flow, drips; safe materials', early: 'Start with what the scene needs.' },
      { text: 'Rehearse with the mic absent; mark the splash', early: 'Find the splash before any equipment is near it.' },
      { text: 'Electronics, cables and joins away from the wet area', early: 'The wet area is known only after the splash is marked.' },
      { text: 'Place an airborne mic outside the splash, aimed at the entry', early: 'You need the splash marked before you can place the mic.' },
      { text: 'Mute the outputs; then switch phantom on if the mic needs it', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set gain on the strongest planned splash, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Record, and let the drips finish before the next take', early: 'Record only once the level is set safely.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower the monitoring before switching it, and follow the mic’s manual. Water: stop if it escapes its containment, and never energise wet equipment.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'f04.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A quiet Foley stage, a close shot: a small pour into a basin. Phantom power available; a towel and a non-slip mat in place.',
    setups: [
      { id: 'a', label: 'A small condenser off to the side, about 1 m out, outside the marked splash', ok: true, power: 'phantom', feedback: 'A suggested starting point: the entry and the basin, the mic out of the spray.' },
      { id: 'b', label: 'A farther mic about 1.5 m out for the trickle, the drips and the room', ok: true, power: 'phantom', feedback: 'A fair comparison: more tail and room, farther from the spray.' },
      { id: 'c', label: 'A condenser 20 cm over the water with a foam windscreen', ok: false, power: 'phantom', feedback: 'Inside the splash; a windscreen is not a water barrier.' },
      { id: 'd', label: 'An ordinary mic in a bag, under the water', ok: false, power: 'phantom', feedback: 'Never an ordinary mic in water: only a hydrophone made for immersion.' },
      { id: 'e', label: 'The phantom supply on the mat beside the basin', ok: false, power: 'phantom', feedback: 'Electronics stay away from the wet area.' },
    ],
    reasons: [DOC_REASON('the water’s entry'), CLEAR_REASON('the marked splash and the wet area'), { id: 'r.power', label: 'The channel gives the condenser the phantom power it needs', role: 'required', feedback: 'Say how the mic is powered: these condensers need phantom power.' }, { id: 'r.dry', label: 'Power and cable joins are kept away from the water', role: 'optional', feedback: 'A fair water-safety reason.' }, BRAND_REASON, LOUD_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point read from the water’s entry, the splash and the wet area clear, and the power the mic needs.',
  },
  {
    id: 'f04.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A live theatre: a padded impact at a station beside the stage, through the PA, a wedge in front.',
    setups: [
      { id: 'a', label: 'A small supercardioid about 50 cm from the impact, the wedge in its rejection', ok: true, power: 'phantom', feedback: 'A suggested starting point for live: close, contained, aimed — check at show level.' },
      { id: 'b', label: 'A dynamic close to the impact, the wedge behind it', ok: true, power: 'none', feedback: 'A fair live choice for a strong hit — check the wedge against the real pattern.' },
      { id: 'c', label: 'A splash effect in an open bucket on the stage', ok: false, power: 'phantom', feedback: 'No wet effect live without approved containment, cleanup and separation.' },
      { id: 'd', label: 'Push the gain until it rings, then back it off', ok: false, power: 'phantom', feedback: 'Never provoke feedback. Check with the operator, short of any ring.' },
      { id: 'e', label: 'A mic in the block’s travel for the closest hit', ok: false, power: 'phantom', feedback: 'The block hits it. Stay outside the travel.' },
    ],
    reasons: [DOC_REASON('the impact'), CLEAR_REASON('the block’s travel'), { id: 'r.null', label: 'The pattern’s rejection faces the wedge', role: 'required', feedback: 'Say where the wedge sits against the pattern.' }, { id: 'r.op', label: 'The gain is checked with the operator at show level', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, { id: 'r.ring', label: 'Find the edge of feedback, then back off', role: 'wrong', feedback: 'Feedback is never provoked — not even to find the edge.' }],
    explain: 'Two setups pass. What passes is the reasoning: a close, contained pickup, the wedge in its rejection, the travel clear, and gain checked with the operator — never by making it ring.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: which part of a pour lasts longest?', options: ['The entry', 'The drip tail', 'The splash'], after: 'Now STEP through (or PLAY ONCE) and watch the attack, the body and the tail.' },
  microphone: { prompt: 'Before you move anything: where will the supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move from the close impact start to about 1.5 m. What changes?', options: ['More body and room', 'A sharper click', 'It depends on this table'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge is on the floor in front of the artist. Where will a supercardioid aimed at the impact reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'Which materials does this lesson’s practice use?',
    options: ['A padded block, a little water, a dry brush', 'Glass, a blade and a heavy drop for realism', 'Hot liquid and fine powder for texture'],
    correct: 'A padded block, a little water, a dry brush',
    explain: 'Safe, controllable sources: a padded block, a small amount of water in a stable basin, a clean dry brush on fabric. No glass, blades, heavy drops, hot liquid, powder or chemicals.',
    why: {
      'Glass, a blade and a heavy drop for realism': 'None of these are needed — and none are safe for this exercise.',
      'Hot liquid and fine powder for texture': 'Hot liquid and airborne powder are hazards; a dry brush gives a safe texture.',
    },
  },
  {
    id: 'q.2',
    covers: 'sound',
    prompt: 'A pour’s sound is…',
    options: ['An entry, a splash, bubbles and a long drip tail', 'One splash, then silence once the pour has ended', 'Mostly the container, hardly the water at all'],
    correct: 'An entry, a splash, bubbles and a long drip tail',
    explain: 'Water is an entry and splash (the attack), bubbles and the wall (the body) and drips (a surprisingly long tail).',
    why: {
      'One splash, then silence once the pour has ended': 'The drips can go on long after the pour.',
      'Mostly the container, hardly the water at all': 'The container is part of it; the water makes the entry, splash and drips.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'Where is the gain set for an impact cue?',
    options: ['On the strongest planned hit', 'On the quietest drip or rub', 'On a test hit softer than the cue'],
    correct: 'On the strongest planned hit',
    explain: 'Set gain on the loudest intended impact or splash, with headroom; then check the quiet detail and the tail for noise.',
    why: {
      'On the quietest drip or rub': 'Then the hit will clip — and clipping cannot be undone.',
      'On a test hit softer than the cue': 'The real cue will be louder and clip.',
    },
  },
  {
    id: 'q.4',
    covers: 'setting',
    critical: true,
    prompt: 'An ordinary condenser could reach the water if it moves in. What is the rule?',
    options: ['It stays outside the splash: water can cause shock', 'A windscreen makes it safe close to the water', 'Inside the splash is fine if the mic is cheap'],
    correct: 'It stays outside the splash: water can cause shock',
    explain: 'Water inside a mic can cause fire or electric shock; a windscreen is not a water barrier. Mark the splash with the mic absent and keep every mic, stand, cable and power supply outside it.',
    why: {
      'A windscreen makes it safe close to the water': 'A windscreen is for wind and handling, not water.',
      'Inside the splash is fine if the mic is cheap': 'The risk is fire and shock, not the cost of the mic.',
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
    note: 'On the floor in front of the artist and off to their right, facing back at them: below and behind a mic aimed at the impact.',
    prov: { kind: 'illustrative', reason: 'a typical station layout; the wedge’s place is a drawing default' },
  },
];

const SP: SpExtra = {
  strikeTitle: 'Act to sound',
  plan: { box: F04_MODEL.views.top!, things: [] },
  close: { side: { u0: -900, u1: 2700, v0: -1420, v1: 840 }, top: { u0: -900, u1: 900, v0: -800, v1: 800 } },
};

export const F04_LESSON: Lesson & { sp: SpExtra } = {
  id: 'F04',
  labId: 'field',
  title: 'Impacts, Liquids and Textures',
  subtitle: 'A safe impact, a little water, a dry texture: outside the splash and the travel, the attack against the tail',
  noun: { one: 'effect', many: 'effects', subject: 'impacts, liquids and textures' },
  model: F04_MODEL,
  micTypeIds: ['scSupercard', 'shotgunShort', 'smallDynCard'],
  zones: F04_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Small, controllable Foley sources performed to picture: a padded impact, a little water in a stable basin, a dry brush across fabric.', src: 'LESSON-F04' },
    { title: 'ATTACK AND TAIL', text: 'An impact is a contact and a resonating body; water is an entry, a splash, bubbles and a surprisingly long drip tail; a texture is a steady friction with a natural end.', src: 'KROTOS-VAL' },
    { title: 'THREE PATHS', text: 'An airborne mic hears the surface; a hydrophone made for immersion hears the water; a contact sensor hears the structure. Each is its own labelled track.', src: 'ASE-ELEM' },
    { title: 'WATER AND ELECTRICITY', text: 'Mark the splash with the mic absent; keep every mic, stand, cable and power supply outside it; a windscreen is not a water barrier; never energise wet equipment.', src: 'S-SM4-UG' },
  ],
  sound: {
    stages: [
      { title: 'The hand drives it', text: 'The block falls, the jug pours, the brush starts its stroke — with a repeatable, safe force.' },
      { title: 'The attack', text: 'The sharp, brief start.', byVariant: { impact: 'The block meets the table: the contact — the attack, the loudest moment.', live: 'The block meets the table: the contact — the attack, the loudest moment.', water: 'The water enters the surface: the entry and the splash — the loudest, briefest moment.', texture: 'The bristles catch and drag across the fabric: a friction that starts and keeps going along the line.' } },
      { title: 'The body', text: 'The larger part answers.', byVariant: { impact: 'The table top rings on under the hit: the body and its decay.', live: 'The table top rings on under the hit: the body and its decay.', water: 'Bubbles and flow, and the container’s wall ringing: the body of the water.', texture: 'The board under the fabric answers the stroke: its own resonance.' } },
      { title: 'The tail and the room', text: 'The decay, the long drip tail or the stroke’s natural end — and the room carries it on.' },
    ],
    attack: 'The attack is sharp and brief: the contact, the entry, the first catch of the bristles. A close mic tends to hear more of it — and is closest to any splash or air burst.',
    body: 'The body and the tail are longer and quieter: the table ringing, bubbles and drips, the board. A farther mic tends to hear more of them, and of the room.',
    head: { diameterMm: 0, rods: 0, label: 'the source', strikeSrc: 'LESSON-F04' },
  },
  setting: {
    items: [
      { id: 'splash', label: 'the splash envelope and the wet floor', short: 'THE SPLASH', note: 'Marked with the mic absent: every mic, stand foot, cable and power supply outside it.', prov: { kind: 'illustrative', reason: 'F04 L26' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'travel', label: 'the block’s travel and the brush’s stroke', short: 'THE TRAVEL', note: 'The block’s whole travel and the stroke: the mic never in their way.', prov: { kind: 'illustrative', reason: 'F04 L12, L18' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'vibration', label: 'the table and the stand', short: 'VIBRATION', note: 'A hit travels through the table and the floor into a stand: a shock mount and a separate stand base help.', prov: { kind: 'illustrative', reason: 'F04 L13' }, tag: 'NOISE', scene: 'all' },
      { id: 'room', label: 'the room and the tail', short: 'THE ROOM', note: 'A farther mic joins the source and the room and hears the tail — with more room noise.', prov: { kind: 'illustrative', reason: 'F04 L24' }, tag: 'ROOM SOUND', scene: 'studio' },
      { id: 'pa', label: 'the PA and the wedge', short: 'PA · WEDGE', note: 'Live: small contained effects, an operator-controlled channel, the wedge in the rejection; no wet effect without approved containment.', prov: { kind: 'illustrative', reason: 'F04 L33' }, tag: 'FEEDBACK PATH', scene: 'stage' },
    ],
    stage: 'LIVE: a small, contained effect at a fixed station, the wedge in the rejection, no wet effect without approved containment — and the gain checked with the operator, never by making it ring.',
    studio: 'STUDIO: an airborne mic outside the splash, a close view of the impact or along the stroke, a farther view for the body and the tail.',
  },
  diagnostic,
  practice: {
    task: 'Choose a setup for a small pour on a quiet stage and for a live impact, compare an attack view with a fuller one, and explain what would justify a second mic. With a real performer and their agreement, you can record what you tried below.',
    fields: [
      { id: 'cue', label: 'Source and cue: attack, body, tail', kind: 'text' },
      { id: 'safety', label: 'Splash marked, electronics away, containment and cleanup', kind: 'text' },
      { id: 'mic', label: 'Mic type and sensing path (air, water, structure)', kind: 'choice', choices: ['small condenser (air)', 'small dynamic (air)', 'hydrophone (water)', 'contact sensor (structure)', 'other'] },
      { id: 'pos', label: 'Capsule to the action; nearest clearance; aim', kind: 'text' },
      { id: 'gain', label: 'Gain set on the strongest planned hit; headroom', kind: 'text' },
      { id: 'notes', label: 'What you heard: attack, body, tail, room (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'Every source’s size (a 150 × 100 × 60 mm padded block, a Ø 400 × 120 mm basin on a 400 mm table, a 600 × 400 mm board) and the tables — drawing defaults.', dims: [] },
    { text: 'The splash envelope: 2.5 × the basin’s radius, illustrative (O-7) — mark the real one with the mic absent.', dims: [] },
    { text: 'Every distance (about 0.8–1.1 m beside the basin, 40–60 cm from the impact, 30–50 cm from the stroke, 1.3–1.7 m for the room) — drawing defaults; no source gives one.', dims: [] },
    { text: 'The hydrophone and the contact sensor are shown as cards only, never placed (O-7).', dims: [] },
    { text: 'The live station, the PA and the wedge, and the artist’s figure — drawing defaults.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — possible starting points and ideas to consider, not rules. No one distance suits every impact, basin and texture: move the mic, experiment, and trust your ears and the room. Experimentation is encouraged — with water and electricity, always inside the safety rules. The lab is silent and draws a simplified picture: the splash envelope as an illustrative mark, the travel as keep-outs, mic patterns and the two-mic comb as textbook shapes. Distances are rounded to about 5 mm and measured from the action to the mic’s capsule. Place real mics with the performer stopped, and only with their agreement.',
  copy: F04_COPY,
  sp: SP,
};
