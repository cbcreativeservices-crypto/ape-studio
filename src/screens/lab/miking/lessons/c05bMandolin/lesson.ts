/**
 * C05b MANDOLIN — the lesson's pages as DATA. Words from the owner's lesson
 * (docs/labs/miking/source_text/Mandolin-Miking-Technique.txt, "L<n>" in
 * COMMENTS only) with the fixes MD-01 … applied (CORRECTIONS_LOG.md).
 * Starting-points voice; FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, PageContent, PageId, SetupTask, Symptom } from '../../engine/model/types.ts';
import { ACCURACY, brandReason, clearReason, contextChecks, DOC_REASON, hearingCheck, hearingDiag, LOUD_REASON, micChecks, POWER_REASON, practiceChecks, setupOrder, sharedSymptoms, STRINGS_PREDICT, twoMicChecks } from '../shared/guitars/stringsContent.ts';
import { C05B_MODEL, C05B_WEDGES, C05B_ZONES } from './geometry.ts';
import { C05B_COPY, MANDO } from './copy.ts';

const P = 'md';

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the mandolin',
    goal: 'Get to know the mandolin — A-style and F-style, oval hole and f-holes — what it is, where you meet it, its job in the music, and its parts, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Eight strings in four pairs drive a floating bridge on a carved top. The outline (A or F) and the opening (oval or f-holes) are separate things — name both.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a pluck becomes sound — the paired strings, the floating bridge, the top and the air in the body — and where the sound leaves. Shown, never played.',
    credit: { scenarios: [`${P}.snd.1`, `${P}.snd.2`, `${P}.snd.3`], interactive: 'soundPath', note: 'Step the pluck through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The top, driven through the floating bridge, does most of the radiating; the air breathes through the opening. Design differences — oval hole or f-holes — are tendencies, not guarantees.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the space round a mandolin player — the picking arc, the short neck, their voice, their movement — a bluegrass stage and a studio, and what to do before any mic.',
    credit: { scenarios: [`${P}.set.1`, `${P}.set.2`, `${P}.set.3`], note: 'Answer the three checks.' },
    takeaway: 'The picking arc and the fretting hand are the player’s; a small instrument turns as they move. The bridge and the scroll are not mounting points. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the mandolin by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: [`${P}.mic.1`, `${P}.mic.2`, `${P}.mic.3`, `${P}.mic.4`, `${P}.rec.1`], note: 'Answer the five checks (one reaches back to how the mandolin sounds).' },
    takeaway: 'An omni suits a quiet, good room; a cardioid controls the room and the band; a clip-on moves with the player if its range fits the body. A mic’s maximum SPL is not a hearing limit.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — aimed where the neck meets the body — then move the mic and see what changes.',
    credit: { scenarios: [`${P}.place.1`, `${P}.place.2`, `${P}.place.3`, `${P}.rec.2`], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin. On a small instrument a small move changes a lot: record the exact position, and keep clear of the picking arc.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the floor wedge — and know when a close mic, a shared mic, a clip or a pickup suits the stage.',
    credit: { scenarios: [`${P}.ctx.1`, `${P}.ctx.2`, `${P}.ctx.studio`, `${P}.rec.3`], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Aim the rejection by the actual pattern. Close mics help gain before feedback; wedges and overlapping mics colour the sound. No mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why two views of a small instrument can thin out together, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: [`${P}.two.1`, `${P}.two.2`, `${P}.two.3`, `${P}.two.4`], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two views hear the mandolin at different times, so their sum combs. Polarity flips the sign; it does not remove a delay. A small instrument does not need to be made wide.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — position, aim, the opening, the player’s movement, gain and polarity — before reaching for EQ.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mandolin mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second mic.',
    credit: { scenarios: [`${P}.prac.order`, `${P}.prac.gain`, `${P}.prac.setup1`, `${P}.prac.setup2`, `${P}.prac.3`, `${P}.mix.1`, `${P}.mix.2`, `${P}.mix.3`], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real mandolin.' },
    takeaway: 'A balanced, repeatable position, power and level checks on the strongest chops, a mono check of any pair, and no contact with the bridge, scroll or finish pass. A brand does not.',
  },
};

const scenarios: MikingScenario[] = [
  {
    id: `${P}.snd.1`,
    page: 'sound',
    prompt: 'What does most of a mandolin’s radiating?',
    options: ['The carved top, driven through the floating bridge', 'The paired strings, straight out into the whole room', 'The scroll and the points on the body’s edge'],
    correct: 'The carved top, driven through the floating bridge',
    explain: 'The strings press a floating bridge onto the top; the bridge drives the top, and the top and the air in the body radiate the sound.',
    why: {
      'The paired strings, straight out into the whole room': 'Two strings per note still move little air. They drive the bridge and the top.',
      'The scroll and the points on the body’s edge': 'They are ornaments of the outline. The top does the radiating.',
    },
  },
  {
    id: `${P}.snd.2`,
    page: 'sound',
    prompt: 'An open string is plucked exactly at its middle. Which of its shapes can that pluck set moving?',
    options: ['Only the odd ones; every even shape is still there', 'All of them equally, because the whole string moves', 'Only the even ones; the odd shapes are still there'],
    correct: 'Only the odd ones; every even shape is still there',
    explain: 'A pluck drives a shape only as much as the string moves at the pick in that shape. Every even shape has a still point at the exact middle.',
    why: {
      'All of them equally, because the whole string moves': 'The pick touches one spot. A shape is driven only as much as the string moves there.',
      'Only the even ones; the odd shapes are still there': 'The reverse: the even shapes have a still point at the middle.',
    },
  },
  {
    id: `${P}.snd.3`,
    page: 'sound',
    prompt: 'Is every F-hole mandolin brighter than every oval-hole mandolin?',
    options: ['No: it is a design tendency, not a guarantee', 'Yes: f-holes add treble to the sound in each case', 'Yes, as long as both mandolins are F-style'],
    correct: 'No: it is a design tendency, not a guarantee',
    explain: 'F-hole mandolins often lean toward treble attack and chop, oval-hole ones toward a rounder, more vocal sound — tendencies a maker describes. Listen to the actual instrument.',
    why: {
      'Yes: f-holes add treble to the sound in each case': 'It is a tendency, and instruments vary. Listen before deciding.',
      'Yes, as long as both mandolins are F-style': 'F-style names the outline; the opening is a separate thing. Neither guarantees a sound.',
    },
  },
  hearingCheck(P, MANDO),
  {
    id: `${P}.set.2`,
    page: 'setting',
    prompt: 'Where may a clip go on a mandolin?',
    options: ['Only where its instructions allow, with the owner’s OK', 'On the scroll, since it sticks out well clear of the body', 'On the bridge, so the mic moves with the strings'],
    correct: 'Only where its instructions allow, with the owner’s OK',
    explain: 'Do not grip a fragile scroll, a movable bridge, an f-hole’s edge or the vibrating top unless the mount’s instructions permit it — and only with consent.',
    why: {
      'On the scroll, since it sticks out well clear of the body': 'The scroll is fragile carved wood, not mounting hardware.',
      'On the bridge, so the mic moves with the strings': 'The bridge floats and drives the top: a clip there damps and moves it.',
    },
  },
  {
    id: `${P}.set.3`,
    page: 'setting',
    prompt: 'A bluegrass band works one shared front mic. What does that need?',
    options: ['Choreography, restrained monitors and a kind room', 'Nothing more than one good mic and a loud PA', 'A clip on each instrument as well as the front mic'],
    correct: 'Choreography, restrained monitors and a kind room',
    explain: 'Players step in for solos and back for balance. It works with choreography, quiet monitoring and a room that suits it — an ensemble technique.',
    why: {
      'Nothing more than one good mic and a loud PA': 'A loud PA and monitors are what make a shared mic hard. It depends on the players and the room.',
      'A clip on each instrument as well as the front mic': 'That is a different approach — close miking — not the shared mic.',
    },
  },
  {
    id: `${P}.rec.1`,
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic pointed straight into the opening from close up tends to hear what?',
    options: ['One local resonance, sometimes boomy or uneven', 'The whole instrument in a perfect, even balance', 'Only the pick, and none of the body'],
    correct: 'One local resonance, sometimes boomy or uneven',
    explain: 'The body’s air breathes through the opening; close and straight in, a mic can favour one resonance. Treat it as an audition, not a start.',
    why: {
      'The whole instrument in a perfect, even balance': 'Close to one opening hears a small, uneven part, not the whole.',
      'Only the pick, and none of the body': 'Near the opening the body dominates, not the pick.',
    },
  },
  {
    id: `${P}.mic.1`,
    page: 'microphone',
    prompt: 'When does an omni near the neck junction make sense on a mandolin?',
    options: ['In a quiet, favourable room where its sound is welcome', 'On a loud stage, to keep all of the wedges out of it', 'Very close, for the most bass from proximity'],
    correct: 'In a quiet, favourable room where its sound is welcome',
    explain: 'An omni hears all round: a natural view of the mandolin and the room. Choose it because the room is good, not to fight spill.',
    why: {
      'On a loud stage, to keep all of the wedges out of it': 'An omni rejects nothing: on a loud stage it hears the wedges too.',
      'Very close, for the most bass from proximity': 'Proximity effect belongs to directional mics; an omni shows little of it.',
    },
  },
  ...micChecks(P, MANDO),
  {
    id: `${P}.place.1`,
    page: 'placement',
    prompt: 'The chop sounds harsh and all pick. What is a good first move?',
    options: ['Shift toward the neck junction, or add a little distance', 'Move closer in to the bridge to catch more of the chop', 'Cut the treble hard until the chop softens'],
    correct: 'Shift toward the neck junction, or add a little distance',
    explain: 'Close to the pick and the bridge magnifies the transient. A blend at the junction, or a little more distance, rounds it.',
    why: {
      'Move closer in to the bridge to catch more of the chop': 'That adds more of the harsh pick.',
      'Cut the treble hard until the chop softens': 'EQ cannot fix an unbalanced local view. Move first.',
    },
  },
  {
    id: `${P}.place.2`,
    page: 'placement',
    prompt: 'Why record the exact capsule position on a mandolin?',
    options: ['Small moves change a small instrument’s balance a lot', 'It is required before a mic is allowed to be switched on', 'The mandolin will not sound right a second time'],
    correct: 'Small moves change a small instrument’s balance a lot',
    explain: 'A few centimetres on a small body is a large change of view. Record the distance, aim, pattern and posture so a good position can be found again.',
    why: {
      'It is required before a mic is allowed to be switched on': 'It is not a rule for switching on; it is how you repeat a good result.',
      'The mandolin will not sound right a second time': 'It will — if you can find the same position again. That is the point.',
    },
  },
  {
    id: `${P}.place.3`,
    page: 'placement',
    prompt: 'A starting point says 30–40 cm, aimed at where the neck meets the body. Your readout says 35 cm out from the sound hole. Are you in it?',
    options: ['Not necessarily: it is read from the neck junction', 'Yes: 35 cm falls inside the 30 to 40 cm band', 'Yes, as long as the mic is facing the mandolin’s top'],
    correct: 'Not necessarily: it is read from the neck junction',
    explain: 'A distance means something only with its reference point. The junction and the hole are different places, so the same number puts the mic somewhere else.',
    why: {
      'Yes: 35 cm falls inside the 30 to 40 cm band': 'Same number, different point. The band is read from the junction.',
      'Yes, as long as the mic is facing the mandolin’s top': 'Aim is a separate check. The distance is read from the named point.',
    },
  },
  {
    id: `${P}.rec.2`,
    page: 'placement',
    prompt: 'FROM EARLIER · What must a stand mic and its boom stay out of, round a mandolin player?',
    options: ['The picking arc, the fretting hand and the player’s turn', 'The front of the mandolin, so the audience can see it', 'The space by the player’s feet, which is kept for the DI'],
    correct: 'The picking arc, the fretting hand and the player’s turn',
    explain: 'The pick sweeps over the top, the fretting hand moves on the short neck, and a small instrument turns as the player moves. Never obstruct them.',
    why: {
      'The front of the mandolin, so the audience can see it': 'In front is usually where the mic goes. The player’s space is what to protect.',
      'The space by the player’s feet, which is kept for the DI': 'Cables need a route, but the safety question is the hands and the turn.',
    },
  },
  ...contextChecks(P, MANDO),
  {
    id: `${P}.ctx.studio`,
    page: 'context',
    prompt: 'A quiet studio, a solo mandolin, a lot of room sound. When is a cardioid the better choice than an omni?',
    options: ['When reflections or other players intrude', 'Whenever the mandolin is an F-style instrument', 'When the room is quiet and sounds good'],
    correct: 'When reflections or other players intrude',
    explain: 'A cardioid gives more isolation when the room or neighbours intrude; an omni suits a quiet, favourable room.',
    why: {
      'Whenever the mandolin is an F-style instrument': 'The style does not decide it; the room and the spill do.',
      'When the room is quiet and sounds good': 'That is where an omni shines. A cardioid helps when the room intrudes.',
    },
  },
  {
    id: `${P}.rec.3`,
    page: 'context',
    prompt: 'FROM EARLIER · The player keeps a note going by picking it fast. What is that called?',
    options: ['Tremolo — set gain on its strongest accents', 'Chop — the offbeat chords of the rhythm', 'Sustain — the string just ringing on alone'],
    correct: 'Tremolo — set gain on its strongest accents',
    explain: 'Tremolo is rapid repeated picking. Set preamp gain on the strongest chops and tremolo accents, leaving headroom.',
    why: {
      'Chop — the offbeat chords of the rhythm': 'Chop is the percussive offbeat chord; tremolo is the rapid picking of one note.',
      'Sustain — the string just ringing on alone': 'A mandolin’s notes decay fast; tremolo keeps them going.',
    },
  },
  ...twoMicChecks(P, MANDO),
  ...practiceChecks(P, MANDO, {
    quote: '30–40 cm, aimed where the neck meets the body',
    right: 'The neck junction, not the opening or the bridge',
    wrong1: 'The opening, since that is the loudest place',
    wrong2: 'The back of the body, measured through it',
    explain: 'A distance belongs to the point it names: from the neck junction, from the opening and from the bridge are different places for the same number.',
  }),
];

const symptoms: Symptom[] = [
  {
    id: `${P}.sym.harsh`,
    observation: 'The chop is harsh or all pick',
    firstChecks: 'Is the mic too close to the pick and bridge? Shift toward the neck-junction blend or increase distance.',
    options: ['Shift toward the neck junction, or add distance', 'Move closer to the bridge to catch the chop', 'Cut the treble hard until the chop is soft'],
    correct: 'Shift toward the neck junction, or add distance',
    explain: 'A close view of the pick magnifies it. A blend, or a little more distance, rounds it.',
    why: {
      'Move closer to the bridge to catch the chop': 'Closer to the pick is harsher still.',
      'Cut the treble hard until the chop is soft': 'EQ dulls the whole mandolin; move first.',
    },
  },
  {
    id: `${P}.sym.boom`,
    observation: 'One body note booms',
    firstChecks: 'Is the capsule aimed straight into an opening? Move off it or back slightly; compare in context.',
    options: ['Move off the opening, or back a little, and compare', 'Boost the treble until the boom is masked by it', 'Move closer to the opening to hear it clearly'],
    correct: 'Move off the opening, or back a little, and compare',
    explain: 'Straight into an opening favours one resonance. Move off it, then judge in context.',
    why: {
      'Boost the treble until the boom is masked by it': 'EQ hides it without fixing it. Move first.',
      'Move closer to the opening to hear it clearly': 'Closer makes that one resonance stronger still.',
    },
  },
  {
    id: `${P}.sym.thin`,
    observation: 'The notes seem thin',
    firstChecks: 'Is the mic mainly hearing strings or a very small region? Include more of the top and body; check the low courses.',
    options: ['Include more of the top and body; check the low notes', 'Turn the channel up until the notes sound fuller', 'Add a second mic aimed at the strings near the nut'],
    correct: 'Include more of the top and body; check the low notes',
    explain: 'A view of the strings or one small region misses the body. Broaden it.',
    why: {
      'Turn the channel up until the notes sound fuller': 'Louder is not fuller: the balance comes from where the mic is.',
      'Add a second mic aimed at the strings near the nut': 'That adds more strings. Fix the one view first.',
    },
  },
  ...sharedSymptoms(P, MANDO),
];

const setupTasks: SetupTask[] = [
  {
    id: `${P}.prac.setup1`,
    page: 'practice',
    brief: 'BRIEF 1 · A bluegrass band on a stage with floor wedges. The mandolin gets its own channel; phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser, cardioid, aimed at the neck junction at the close end, rear to the wedge', ok: true, power: 'phantom', feedback: 'A recommended target, brought close for gain, its rejection toward the wedge.' },
      { id: 'b', label: 'Instrument dynamic aimed at the neck junction, clear of the picking arc', ok: true, power: 'none', feedback: 'A robust close option at a recommended target.' },
      { id: 'c', label: 'Clip-on mini on a clip whose range fits this body, between joint and opening', ok: true, power: 'phantom', feedback: 'A recommended starting point that moves with the player — with the owner’s OK.' },
      { id: 'd', label: 'Clip the mini to the scroll, aimed back at the f-holes', ok: false, power: 'phantom', feedback: 'The scroll is fragile carved wood, not a mount.' },
      { id: 'e', label: 'Small omni 1 m out front, to hear the whole band’s blend', ok: false, power: 'phantom', feedback: 'On a stage with wedges an omni that far out hears everything but the mandolin.' },
    ],
    reasons: [DOC_REASON, clearReason('the picking arc, the fretting hand and the player’s turn'), POWER_REASON, { id: 'r.null', label: 'Aiming its rejection toward the wedge helps against feedback', role: 'optional', feedback: 'A fair live reason — though no position alone prevents feedback.' }, brandReason(MANDO), LOUD_REASON],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point from its named point, clearance from the player, power that matches the mic.',
  },
  {
    id: `${P}.prac.setup2`,
    page: 'practice',
    brief: 'BRIEF 2 · A quiet studio, a tremolo melody on an A-style mandolin. The only spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'Instrument dynamic 30–40 cm out, aimed at the neck junction', ok: true, power: 'none', feedback: 'A recommended starting point; a dynamic needs no phantom.' },
      { id: 'b', label: 'Instrument dynamic about 20 cm from the oval hole, a little off it', ok: true, power: 'none', feedback: 'A recommended starting point; it needs no phantom. Listen for boom.' },
      { id: 'c', label: 'Small omni condenser at the neck junction', ok: false, power: 'phantom', feedback: 'A fair idea in a good room — but this input has no phantom power.' },
      { id: 'd', label: 'Clip-on mini between the joint and the hole', ok: false, power: 'phantom', feedback: 'A miniature condenser needs phantom power, which this input does not have.' },
      { id: 'e', label: 'Instrument dynamic 2 cm into the oval hole', ok: false, power: 'none', feedback: 'Never insert a mic into an opening: it favours one resonance and risks the instrument.' },
    ],
    reasons: [DOC_REASON, clearReason('the picking arc, the fretting hand and the player’s turn'), POWER_REASON, { id: 'r.record', label: 'I will note the exact position so I can find it again', role: 'optional', feedback: 'A fair reason on a small instrument.' }, brandReason(MANDO), LOUD_REASON],
    explain: 'Two positions pass. What passes is the reasoning: a sensible starting point, clear of the player, powered by what this input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: what moves most of the air when a mandolin is plucked?', options: ['The paired strings', 'The top, driven by the bridge', 'The scroll'], after: 'Now STEP through the pluck (or PLAY ONCE) and watch what each event drives.' },
  placement: { prompt: 'Predict: you move the mic from the neck junction toward the bridge and top. What changes?', options: ['More chop and definition', 'More of the room', 'It depends on this mandolin'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  ...STRINGS_PREDICT,
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'How are a mandolin’s eight strings arranged?',
    options: ['In four pairs, each pair played as one note', 'As eight single strings, all tuned differently', 'In two groups of four, one for each hand'],
    correct: 'In four pairs, each pair played as one note',
    explain: 'Eight strings in four courses: each pair is tuned together and played as one note.',
    why: {
      'As eight single strings, all tuned differently': 'They are paired: two strings per note.',
      'In two groups of four, one for each hand': 'All are picked by one hand and fretted by the other, in pairs.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What do “A-style” and “F-style” describe?',
    options: ['The body’s outline — the opening is a separate thing', 'The kind of strings it takes, steel or nylon', 'The tuning, one set an octave above the other'],
    correct: 'The body’s outline — the opening is a separate thing',
    explain: 'A-style is a teardrop outline; F-style adds a scroll and points. The opening — oval or f-holes — is named separately.',
    why: {
      'The kind of strings it takes, steel or nylon': 'Both styles use steel strings; the letters name the outline.',
      'The tuning, one set an octave above the other': 'They are tuned alike; the letters name the outline.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'A string plucked exactly at its middle drives which of its shapes?',
    options: ['Only the odd ones — the even ones are still there', 'All of its shapes, each one just as hard', 'Only the even ones — the odd ones are still there'],
    correct: 'Only the odd ones — the even ones are still there',
    explain: 'A pluck drives a shape only as much as the string moves at the pick; every even shape has a still point at the middle.',
    why: {
      'All of its shapes, each one just as hard': 'The pick touches one spot; a shape still there is not driven.',
      'Only the even ones — the odd ones are still there': 'The reverse: the even ones are still at the middle.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Where does most of a mandolin’s sound come from?',
    options: ['The carved top, driven through the floating bridge', 'The strings themselves, moving the air directly', 'The tailpiece, at the far end of the body'],
    correct: 'The carved top, driven through the floating bridge',
    explain: 'The bridge drives the top; the top and the air in the body radiate the sound.',
    why: {
      'The strings themselves, moving the air directly': 'Strings move little air on their own.',
      'The tailpiece, at the far end of the body': 'The tailpiece anchors the strings; it radiates little.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'What must a stand mic stay out of, round a mandolin player?',
    options: ['The picking arc, the fretting hand and the player’s turn', 'The front of the mandolin, so the audience can see it clearly', 'The space behind the player, where the cables run'],
    correct: 'The picking arc, the fretting hand and the player’s turn',
    explain: 'The pick sweeps over the top, the fretting hand moves on the neck, and the instrument turns as the player moves.',
    why: {
      'The front of the mandolin, so the audience can see it clearly': 'In front is usually where the mic goes. The player’s space is what to keep clear.',
      'The space behind the player, where the cables run': 'Cables need a route, but the moving space is the player’s hands and turn.',
    },
  },
  hearingDiag(MANDO),
];

export const C05B_LESSON: Lesson = {
  id: 'C05B',
  labId: 'strings',
  title: 'Mandolin',
  subtitle: 'A-style or F-style — the neck junction, the opening, or a clip',
  noun: { one: 'mandolin', many: 'mandolins' },
  model: C05B_MODEL,
  micTypeIds: ['sdcCard', 'instDynCard', 'clipCond'],
  zones: C05B_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [setupOrder(P, MANDO, 'Have the player stop; aim it at the neck junction; check the picking arc and the turn')],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A small, bright string instrument with eight steel strings in four pairs over a carved top. A floating bridge drives the top. A-style bodies are teardrops, often with an oval hole; F-style bodies have a scroll, points and f-holes.', src: 'EASTMAN' },
    { title: 'WHERE YOU MEET IT', text: 'Bluegrass, folk, country and classical music, on stage — often round a shared mic — and in the studio.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'The percussive offbeat chop, tremolo melodies, fast single-note leads. Ask which they will play, and at what level.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'This lab draws a mandolin about 66 cm (26 in) long and 26 cm (10 in) across the body, about 4.5 cm deep (drawn sizes for the depth and string length).', src: 'MET-A4' },
  ],
  sound: {
    stages: [
      { title: 'The pick pulls a pair', text: 'A pick pulls a PAIR of strings aside and lets them go — or picks them fast, again and again, in tremolo. That release is where the ATTACK begins.' },
      { title: 'The strings swing', text: 'Released, the pair swings between its two still ends — the floating bridge and the nut (or a fret). Its lowest shape is drawn here many times larger than it really moves.' },
      { title: 'The bridge drives the top', text: 'The strings press a floating bridge onto the carved top. Each swing rocks the bridge and drives the top.' },
      { title: 'Sound leaves', text: 'Sound leaves from the top and through the opening — an oval hole or two f-holes — where the air in the small body breathes. The ring that follows, brief on a mandolin, is the BODY of the sound.' },
    ],
    attack: 'The start of the note: the pick on a pair of strings — the chop’s crack. Near the bridge and the pick a mic hears more of it.',
    body: 'The ring: the top and the body’s air, briefly. Toward the opening a mic hears more body resonance, unevenly if too close. Both are tendencies; mandolins vary.',
    head: { diameterMm: 70, rods: 0, label: 'the opening', strikeSrc: 'LESSON' },
  },
  setting: {
    items: [
      { id: 'player', label: 'the player and the mandolin', short: 'PLAYER', note: 'Standing on a strap, the short neck to the player’s left; the pick sweeps over the top and the instrument turns as they move.', prov: { kind: 'illustrative', reason: 'a typical standing posture' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'vocal', label: 'the vocal mic (a singing player)', short: 'VOCAL MIC', note: 'Above the mandolin, in front of the mouth. The voice reaches the mandolin mic and the mandolin the vocal mic: plan both.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'shared', label: 'a shared band mic', short: 'SHARED MIC', note: 'A bluegrass band may share a front mic, stepping in for solos — choreography, restrained monitors and a kind room.', prov: { kind: 'illustrative', reason: 'a typical bluegrass stage' }, tag: 'ENSEMBLE', scene: 'stage' },
      { id: 'wedge', label: 'the player’s floor wedge (monitor)', short: 'WEDGE', note: 'In front of the player, facing back. Wedges and overlapping mics can colour the sound and cut isolation.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'band', label: 'the band: bass and drums', short: 'BAND', note: 'Upstage; in a bluegrass band the banjo and guitar are close neighbours too.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'stage', planIds: ['bassAmp', 'kit'] },
      { id: 'pa', label: 'the PA', short: 'PA', note: 'At the front corners, facing the audience.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FEEDBACK', scene: 'stage', planIds: ['paL', 'paR'] },
      { id: 'audience', label: 'the audience', short: 'AUDIENCE', note: 'Beyond the stage edge.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a quiet, favourable studio room an omni can present the mandolin naturally; in a busy one, a cardioid isolates it.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: a wedge in front, the band round the player, the PA facing out — or a shared mic. A close directional mic, a clip or a pickup gives control.',
    studio: 'STUDIO: no wedges, repeated trials when the player stops, and a room that can be part of the sound.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic setup for a given mandolin, player and room, describe an alternative position, and explain what would justify a second mic. With a real mandolin and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'mando', label: 'Mandolin (style, opening)', kind: 'text' },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser', 'dynamic', 'clip-on mini', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, aim, pattern and posture', kind: 'text' },
      { id: 'notes', label: 'What you heard — chop, tremolo, leads (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The player’s standing posture and reach, and the strap height: drawing defaults. No HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The top’s, the strings’ and the bridge’s keep-off margins: illustrative.', dims: ['a', 'f'] },
    { text: 'The scale (350), the body length (350), the depth (45), the neck joint (190 mm from the bridge), the openings and the outline’s stations — drawing defaults; only the overall length and width are museum mandolins’.', dims: [] },
    { text: 'The 30–40 cm junction start reads DPA’s two-omni “distance” as a one-mic distance; the 20 cm opening start is the guide’s guitar row, which lists the mandolin.', dims: [] },
    { text: 'The clip’s capsule height and reach, the mic sizes, the wedge, the shared mic and the band’s positions — drawing defaults.', dims: [] },
  ],
  live: { wedges: C05B_WEDGES },
  accuracyDetail: ACCURACY(MANDO, 'an A-style and an F-style mandolin drawn at typical sizes'),
  copy: C05B_COPY,
};
