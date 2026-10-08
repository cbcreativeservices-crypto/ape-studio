/**
 * A09b BASSOON — the lesson's pages as DATA (blueprint §7). The words come
 * from the owner's lesson (docs/labs/miking/source_text/Bassoon-Miking-
 * Technique.txt, "L<n>" in COMMENTS only) with the fixes in CORRECTIONS_LOG.md
 * (A9B-01 …) applied: DPA's "up from the bell" and the lesson's "down" are
 * the same point on a bell-up bassoon (said once, plainly); the clip's
 * gooseneck "back toward the upper joint" means DOWN the instrument here; the
 * supercardioid's nulls sit toward the rear near 125°, not at the sides
 * (L37); MDAT's 3–4 ft on the right, 45° down, added.
 *
 * OWNER RULING 2026-10-04: suggested starting points, never dogma; no
 * source, brand or model in learner text; no badges.
 */
import type { DiagnosticItem, MikingScenario, OrderTask, LessonPages, PageContent, SourcePageId, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import type { LessonCopy } from '../../engine/model/copy.ts';
import { BRAND_REASON, LOUD_REASON, POWER_REASON, bellBoomSymptom, clearReason, clipThreatSymptom, colourSymptom, docReason, feedbackSymptom, filterSymptom, firstHoleCheck, gainCheck, hearingCheck, hearingDiag, keyNoiseSymptom, matchedLevels, nullOnPaper, polarityDelay, removeDelay, superNull, type WindWords } from '../shared/woodwinds/windItems.ts';
import { windExtra, type WindLesson } from '../shared/woodwinds/windLesson.ts';
import { BASSOON_MODEL, SEATED, SPEC } from './geometry.ts';
import { BASSOON_ZONES } from './model.ts';

const W: WindWords = { noun: 'bassoon', player: 'bassoonist', end: 'the bell', exciter: 'the reed', moving: 'the hands, the bocal and the bell beside the head' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the bassoon',
    goal: 'Get to know the bassoon — what it is, where you meet it, what it does in the music, and its folded parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A double reed on a curved bocal drives about 2.6 m of conical tube, folded in two: down the wing joint, round the boot, up the long joint to the bell above the player’s head.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a breath becomes a bassoon note — the double reed, the folded air column, the first open hole — and where the sound leaves.',
    credit: { scenarios: ['bsn.snd.1', 'bsn.snd.2', 'bsn.snd.3'], interactive: 'soundPath', note: 'Step the sequence through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The lowest note leaves from the bell at the top; every note above it leaves farther DOWN the folded tube — the long joint, the boot, the wing joint. A mic sees one part of a picture that moves with every note.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the bassoon sits — the seat strap, the bocal and the reed, the hands, the bell above the head, the section around it — what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['bsn.set.1', 'bsn.set.2', 'bsn.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The bocal, the reed, the hands, the seat strap and the bell beside the head stay clear. Ask the player first, hear the lowest note and the top, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the bassoon by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['bsn.mic.1', 'bsn.mic.2', 'bsn.mic.3', 'bsn.rec.1'], note: 'Answer the four checks (one reaches back to how the bassoon sounds).' },
    takeaway: 'A source that radiates from many places welcomes an omni where the room allows; a cardioid separates. A miniature on the bell joint moves with it. Both need phantom power.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — facing the keys a third of the way down from the bell — then move the mic and see what changes.',
    credit: { scenarios: ['bsn.place.1', 'bsn.place.2', 'bsn.place.3', 'bsn.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different suggested starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'Each starting point serves a goal: close for a focused spot, a foot away for balance, high on the right for the room, near the bell to compare the lowest note. Clearance comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the player’s wedge — and know what a pattern cannot do, and why a studio solo and a loud stage need different choices.',
    credit: { scenarios: ['bsn.ctx.1', 'bsn.ctx.2', 'bsn.ctx.studio', 'bsn.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A cardioid rejects most behind; a supercardioid toward the rear near 125°, with a small lobe straight behind — not at its sides. Real nulls are shallower than the picture, and no mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a bell mic and a body mic — or a spot and the main pair — can sound hollow or unstable together, and what the polarity switch does and does not change.',
    credit: { scenarios: ['bsn.two.1', 'bsn.two.2', 'bsn.two.3', 'bsn.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two mics hear the bassoon at different times — and a bell mic and a body mic change their balance note by note. Move or rebalance first; polarity flips the sign and never removes a delay. Judge in mono, at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — where the mic looks, its distance, the pattern, the player’s movement, the mount, the filter — before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one bassoon mic in the right order, choose and justify a setup for a studio solo and a loud stage, and say what would justify a second mic.',
    credit: { scenarios: ['bsn.prac.order', 'bsn.prac.gain', 'bsn.prac.setup1', 'bsn.prac.setup2', 'bsn.prac.3', 'bsn.mix.1', 'bsn.mix.2', 'bsn.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real bassoon.' },
    takeaway: 'Clearance from the bocal, the reed, the hands, the seat strap and the bell, the right power and level, the lowest note checked through any filter, and an accurate account of polarity versus delay pass — and more than one setup can pass.',
  },
};

/* THE CHECKS. Lesson lines in comments only: bsn.snd.* L6 · bsn.set.* L7 ·
 * bsn.mic.* L30, L38 · bsn.place.* L13, L25 · bsn.ctx.* L37 · bsn.two.* L35 ·
 * bsn.prac.* / bsn.mix.* L70-L74. */
const scenarios: MikingScenario[] = [
  {
    id: 'bsn.snd.1',
    page: 'sound',
    prompt: 'The bassoon plays its very lowest note, every hole closed. Where does the sound leave?',
    options: ['From the boot, at the bottom of the fold', 'From the reed and the bocal, at the lips', 'From the bell, at the top above the head'],
    correct: 'From the bell, at the top above the head',
    explain: 'With every hole closed, the whole folded tube sounds and the sound has only one way out: the bell at the top. One note higher opens a hole just below the bell, and the sound leaves there.',
    why: {
      'From the boot, at the bottom of the fold': 'The boot is the middle of the tube’s path; with every hole closed the air goes on round it, up to the bell.',
      'From the reed and the bocal, at the lips': 'The reed starts the sound; it leaves where the tube meets the open air.',
    },
  },
  firstHoleCheck('bsn.snd.2', { ...W, end: 'the bell' }),
  {
    id: 'bsn.snd.3',
    page: 'sound',
    prompt: 'Why can a mic aimed only into the bell overstate one note?',
    options: ['The bell filters out the bassoon’s higher notes', 'Only the lowest note leaves mainly by the bell', 'The bell is the loudest part of each phrase'],
    correct: 'Only the lowest note leaves mainly by the bell',
    explain: 'With every hole closed, the sound leaves the bell; each note above opens a hole farther down, and most of the sound leaves there. A bell-only mic hears the lowest note well and the rest from afar.',
    why: {
      'The bell filters out the bassoon’s higher notes': 'Nothing is filtered: higher notes simply leave lower down, from open holes.',
      'The bell is the loudest part of each phrase': 'Loudness is not the point; most notes leave from the holes.',
    },
  },
  hearingCheck('bsn.set.1', W),
  {
    id: 'bsn.set.2',
    page: 'setting',
    prompt: 'Which part of the bassoon must never be used to hold a mic or a clip?',
    options: ['The music stand in front of the player', 'The bocal, the thin curved tube to the reed', 'The chair the bassoonist sits on, under the boot'],
    correct: 'The bocal, the thin curved tube to the reed',
    explain: 'The bocal is delicate and sets the instrument’s response; nothing is clamped or taped to it. Keep stands and cables away from it, the reed and the hands.',
    why: {
      'The music stand in front of the player': 'A music stand is not part of the bassoon — and it is the player’s sightline, not a mount.',
      'The chair the bassoonist sits on, under the boot': 'The chair is not the instrument; the question is what on the bassoon is too delicate to hold anything.',
    },
  },
  {
    id: 'bsn.set.3',
    page: 'setting',
    prompt: 'Before placing any mic on a bassoon, what do you ask for?',
    options: ['One long tuning note, as loud as possible', 'The lowest note, a high passage, soft and accented notes', 'Nothing yet: the starting point already says where to go'],
    correct: 'The lowest note, a high passage, soft and accented notes',
    explain: 'The place the sound leaves moves with every note — the lowest from the bell, the rest farther down — so test the actual part, and watch the seat strap, the bell height and the movement.',
    why: {
      'One long tuning note, as loud as possible': 'One note leaves from one place; the music moves the sound along the bassoon.',
      'Nothing yet: the starting point already says where to go': 'A starting point says where to begin; the player’s part says whether it works.',
    },
  },
  {
    id: 'bsn.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · As the bassoon plays higher, where does the sound leave?',
    options: ['From the bell, whatever the note', 'From farther down the folded tube', 'From the reed, closer to the player'],
    correct: 'From farther down the folded tube',
    explain: 'The lowest note leaves from the bell; each note up opens a hole farther down — the long joint, round the boot, up the wing joint.',
    why: {
      'From the bell, whatever the note': 'Only the lowest note, every hole closed, leaves mainly from the bell.',
      'From the reed, closer to the player': 'The reed starts the sound; it leaves where the tube meets the open air.',
    },
  },
  {
    id: 'bsn.mic.1',
    page: 'microphone',
    prompt: 'Why can an omni suit a bassoon in a good room?',
    options: ['It rejects the room better than a cardioid', 'It hears the bell only, which carries the tone', 'The bassoon radiates from many places at once'],
    correct: 'The bassoon radiates from many places at once',
    explain: 'With sound leaving the holes, the boot and the bell in a pattern that changes note by note, a broad pickup can hold the instrument together — where the room and the neighbours allow. A cardioid separates when needed.',
    why: {
      'It rejects the room better than a cardioid': 'An omni rejects nothing: it hears more room, not less.',
      'It hears the bell only, which carries the tone': 'An omni hears all round; most notes leave from the holes, not the bell.',
    },
  },
  {
    id: 'bsn.mic.2',
    page: 'microphone',
    prompt: 'A miniature clipped near the bassoon’s bell — where should it point?',
    options: ['Straight up into the bell, where it opens', 'Across at the player’s face and reed', 'Down the instrument, toward the keys'],
    correct: 'Down the instrument, toward the keys',
    explain: 'Near the bell, pointed down toward the keys, the capsule hears the open holes below and some bell. Into the bell it hears mostly the lowest note.',
    why: {
      'Straight up into the bell, where it opens': 'Into the bell it favours the very lowest note and misses the holes.',
      'Across at the player’s face and reed': 'Toward the face it hears breath and the reed’s edge; the sound leaves below.',
    },
  },
  {
    id: 'bsn.mic.3',
    page: 'microphone',
    prompt: 'Your only spare input has no phantom power. Can you use the bassoon’s clip miniature there?',
    options: ['Yes — the strap on the bell joint carries its power', 'No — like the stand condenser, it needs phantom power', 'Yes, if its cable is short enough to keep the signal up'],
    correct: 'No — like the stand condenser, it needs phantom power',
    explain: 'Both of this page’s mics are condensers: the stand mic needs phantom power, and the miniature needs it through its adapter. Find a powered input, or a different kind of mic.',
    why: {
      'Yes — the strap on the bell joint carries its power': 'A clip is a mount. The miniature still needs phantom power through its adapter.',
      'Yes, if its cable is short enough to keep the signal up': 'Cable length does not power a condenser.',
    },
  },
  {
    id: 'bsn.place.1',
    page: 'placement',
    prompt: 'One description says “a third of the length up from the bell”, another “down”. On a bassoon, are they the same place?',
    options: ['No — “up” means above the bell, out in the air', 'No — “down” means down on the boot, near the floor', 'Yes — one third along the instrument from the bell'],
    correct: 'Yes — one third along the instrument from the bell',
    explain: 'Measure along the instrument from the bell end toward the reed. On a clarinet that point is above the bell; on a bassoon, whose bell is at the top, it is below it — on the long joint.',
    why: {
      'No — “up” means above the bell, out in the air': 'The measurement runs along the instrument, not into the air above it.',
      'No — “down” means down on the boot, near the floor': 'A third of the way from the bell lands on the long joint, well above the boot.',
    },
  },
  {
    id: 'bsn.place.2',
    page: 'placement',
    prompt: 'You move the mic from the keys up toward the bell. What tends to change?',
    options: ['All the notes get brighter by the same amount', 'More of the lowest note, less of the rest', 'Nothing: the bassoon sounds the same all over'],
    correct: 'More of the lowest note, less of the rest',
    explain: 'The lowest note leaves from the bell; the others from holes below. Toward the bell, the lowest note tends to grow and the higher passages thin — compare at matched levels.',
    why: {
      'All the notes get brighter by the same amount': 'The change is note by note: the bell carries the lowest note most.',
      'Nothing: the bassoon sounds the same all over': 'Each part of the folded tube radiates its own share, note by note.',
    },
  },
  {
    id: 'bsn.place.3',
    page: 'placement',
    prompt: 'Is a mic a few centimetres from the bocal a good close position?',
    options: ['Yes — the bocal is where the sound is strongest', 'Yes, if it is clamped to the bocal for stability', 'Not usually: it is fragile and hears mostly reed'],
    correct: 'Not usually: it is fragile and hears mostly reed',
    explain: 'The bocal and the reed start the sound, but it leaves from the holes and the bell. Near the bocal a mic sits by the player’s face and hears the reed’s edge — and nothing may ever be clamped to it.',
    why: {
      'Yes — the bocal is where the sound is strongest': 'The sound leaves lower down; the bocal is the delicate link to the reed.',
      'Yes, if it is clamped to the bocal for stability': 'Nothing is ever clamped to the bocal: it can bend and change the instrument.',
    },
  },
  {
    id: 'bsn.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What must a bassoon mic, its boom and its cable stay clear of?',
    options: ['The bocal and reed, the hands, the strap, the bell', 'The music stand and the conductor’s line of sight', 'The front of the instrument, so that it can project'],
    correct: 'The bocal and reed, the hands, the strap, the bell',
    explain: 'Clearance comes first: the bocal and reed at the lips, the fingers and thumbs, the seat strap and the bell beside the player’s head.',
    why: {
      'The music stand and the conductor’s line of sight': 'Sight lines matter too, but the safety question is what can be struck or bent.',
      'The front of the instrument, so that it can project': 'In front is where a stand mic usually goes; what must stay clear is what moves or bends.',
    },
  },
  {
    id: 'bsn.ctx.1',
    page: 'context',
    prompt: 'A bassoon line over a loud band, a wedge in front. A good first step?',
    options: ['A farther mic, so the band blends in with the bassoon', 'Closer and aimed, or a clip on the bell joint', 'Turn the bassoon channel up above the band'],
    correct: 'Closer and aimed, or a clip on the bell joint',
    explain: 'On a loud stage, a closer mic with its rejection toward the wedge — or a miniature that moves with the bassoon — gives more bassoon relative to the stage. More gain raises the band too.',
    why: {
      'A farther mic, so the band blends in with the bassoon': 'Farther brings in more band and monitor — the opposite of what a loud stage needs.',
      'Turn the bassoon channel up above the band': 'More gain raises everything the mic hears and brings feedback closer.',
    },
  },
  superNull('bsn.ctx.2', 'context', 'wedge'),
  {
    id: 'bsn.ctx.studio',
    page: 'context',
    prompt: 'A solo bassoon in a good, quiet studio: is one stand mic at a balanced distance a fair first choice?',
    options: ['No — it needs both a bell mic and a body mic as well', 'Yes — then compare a little farther and higher', 'No — a clip on the bocal hears it best'],
    correct: 'Yes — then compare a little farther and higher',
    explain: 'One low-noise mic at a balanced distance gives a coherent bassoon; step back for more blend, compare a higher view toward the bell, and note the position for repeat takes.',
    why: {
      'No — it needs both a bell mic and a body mic as well': 'Two mics change their balance note by note. One good position is the simpler start.',
      'No — a clip on the bocal hears it best': 'Nothing goes on the bocal — and a quiet studio needs no stage isolation.',
    },
  },
  {
    id: 'bsn.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · A supercardioid’s deepest rejection is…',
    options: ['At its sides, square to the front (90°)', 'Toward the rear, either side of the axis', 'Straight behind it, right on the rear axis'],
    correct: 'Toward the rear, either side of the axis',
    explain: 'A supercardioid rejects most near 125° — toward the rear, off the axis — with a small lobe straight behind. Place a wedge for the actual pattern.',
    why: {
      'At its sides, square to the front (90°)': 'At 90° the pickup is still fair; the rejection deepens toward the rear.',
      'Straight behind it, right on the rear axis': 'Straight behind sits a small rear lobe; that is the cardioid’s null, not the supercardioid’s.',
    },
  },
  {
    id: 'bsn.two.1',
    page: 'twoMic',
    prompt: 'A bell mic and a body mic on one bassoon. Why can the pair sound unstable?',
    options: ['The bell mic inverts the sound as it travels to it', 'Their balance changes note by note, with a delay', 'Two mics on a bassoon cancel all its low notes'],
    correct: 'Their balance changes note by note, with a delay',
    explain: 'The lowest note is loud in the bell mic; higher notes in the body mic — and the two hear each note at different times. The blend shifts through the phrase. Check the mono sum over the whole passage, or prefer one position.',
    why: {
      'The bell mic inverts the sound as it travels to it': 'Distance delays a sound; it does not flip its sign.',
      'Two mics on a bassoon cancel all its low notes': 'Cancellation depends on the delay and the levels: some pitches dip, others add.',
    },
  },
  polarityDelay('bsn.two.2'),
  matchedLevels('bsn.two.3'),
  {
    id: 'bsn.two.4',
    page: 'twoMic',
    prompt: 'In an orchestra recording with the main pair up, how do you use a bassoon spot?',
    options: ['Make it the loudest channel when the bassoon leads', 'Bring it up for a stated balance, and check it in mono', 'Leave the main pair out while the bassoon plays its solo'],
    correct: 'Bring it up for a stated balance, and check it in mono',
    explain: 'The main pair carries the ensemble image; a spot supports it. Bring it in gently, keep its depth consistent with the woodwinds, and check the mono sum.',
    why: {
      'Make it the loudest channel when the bassoon leads': 'A loud spot pulls the bassoon unnaturally forward.',
      'Leave the main pair out while the bassoon plays its solo': 'The main pair is the picture of the orchestra; the spot only supports it.',
    },
  },
  gainCheck('bsn.prac.gain', W),
  {
    id: 'bsn.prac.3',
    page: 'practice',
    prompt: 'What would justify a separate bell mic and body mic on a bassoon?',
    options: ['More channels make the mix easier to shape later', 'The musical goal needs it and it holds in mono', 'The bassoon is too quiet for one microphone'],
    correct: 'The musical goal needs it and it holds in mono',
    explain: 'Only if the goal justifies the extra complexity — then check the pair over the whole passage, especially the lowest note, in mono. If it stays unstable, one coherent position is better.',
    why: {
      'More channels make the mix easier to shape later': 'More channels add spill, cables and a combining check that can shift note by note.',
      'The bassoon is too quiet for one microphone': 'Level comes from gain and the fader, not from a second mic.',
    },
  },
  {
    id: 'bsn.mix.1',
    page: 'practice',
    prompt: 'A starting point reads “15–20 cm, a third of the way down from the bell”. Where is the mic?',
    options: ['Beside the long joint, facing the keys', 'Inside the bell, a third of the way into its depth', 'On the boot, by the seat strap'],
    correct: 'Beside the long joint, facing the keys',
    explain: 'One third of the bassoon’s length from the bell, measured along it toward the reed, lands on the long joint; 15–20 cm out from there, facing the keys.',
    why: {
      'Inside the bell, a third of the way into its depth': 'The third is measured along the whole instrument, not into the bell.',
      'On the boot, by the seat strap': 'The boot is near the bottom — much more than a third of the way down.',
    },
  },
  nullOnPaper('bsn.mix.2', 'wedge'),
  removeDelay('bsn.mix.3'),
];

const symptoms: Symptom[] = [bellBoomSymptom('bsn.sym.bell', W), colourSymptom('bsn.sym.colour', W), keyNoiseSymptom('bsn.sym.keys', W), filterSymptom('bsn.sym.filter', W), clipThreatSymptom('bsn.sym.clip', W), feedbackSymptom('bsn.sym.feedback', W)];

const orderTasks: OrderTask[] = [
  {
    id: 'bsn.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic bassoon setup in the order you would do them.',
    steps: [
      { text: 'Ask the player for the part: the lowest note, the top, soft and accented, how they move', early: 'Start with the player and the music.' },
      { text: 'Hear the bassoon unamplified in the room, through the whole range', early: 'Listen before choosing a mic.' },
      { text: 'Choose the mic and a weighted stand (or an approved clip)', early: 'Choose once you know the part and the room.' },
      { text: 'With the player stopped, place it facing the keys, clear of the bocal, hands, strap and bell', early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom power on', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set input gain on the quietest AND loudest passages, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare a little farther and higher, at matched levels', early: 'Compare only once the level is set safely.' },
      { text: 'Secure the stand and cable; recheck the lowest note through any filter', early: 'Secure it last, then check the lowest note again.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before switching it, and follow your own equipment’s manual. Gain: headroom for the strongest accent; the filter must keep the lowest note.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'bsn.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Studio, a solo bassoon, a good quiet room. One channel, phantom power available.',
    setups: [
      { id: 'a', label: 'Small condenser about a foot from the boot’s finger holes, facing them', ok: true, power: 'phantom', feedback: 'A suggested starting point for a balanced bassoon — then compare a little farther and higher.' },
      { id: 'b', label: 'Small condenser 15–20 cm from the long joint, a third of the way down from the bell', ok: true, power: 'phantom', feedback: 'A suggested starting point for a focused spot — check the lowest note against the rest.' },
      { id: 'c', label: 'A mic pointed straight into the bell, a few centimetres away', ok: false, power: 'phantom', feedback: 'A bell-only view favours the very lowest note and misses the holes below.' },
      { id: 'd', label: 'A small clip on the bocal, right by the reed', ok: false, power: 'phantom', feedback: 'Nothing goes on the bocal — and the sound leaves lower down.' },
      { id: 'e', label: 'A mic on the floor under the boot, aimed up', ok: false, power: 'phantom', feedback: 'Under the boot it sits in the seat strap’s and the feet’s way, and hears little of the holes and the bell.' },
    ],
    reasons: [docReason('the finger holes or the long joint'), clearReason('the bocal and reed, the hands, the seat strap and the bell'), POWER_REASON, { id: 'r.blend', label: 'It hears the holes and some of the bell together', role: 'optional', feedback: 'A fair reason: the lowest note leaves from the bell, the rest from the holes.' }, BRAND_REASON('bassoon'), LOUD_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a sensible starting point from its named part, clearance from what moves or bends, and the power the mic needs.',
  },
  {
    id: 'bsn.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage: a bassoonist in a band with drums and amps, a wedge in front. Phantom power available.',
    setups: [
      { id: 'a', label: 'A miniature on the bell joint, aimed down the instrument at the keys', ok: true, power: 'phantom', feedback: 'A suggested starting point that moves with the bassoon — check the clip and the lowest note.' },
      { id: 'b', label: 'A cardioid close to the long joint, its rear toward the wedge', ok: true, power: 'phantom', feedback: 'A suggested starting point with the rejection aimed — mark the spot with the player.' },
      { id: 'c', label: 'An omni a metre away, for a natural blend', ok: false, power: 'phantom', feedback: 'On a loud stage an omni a metre away hears the band and the wedge more than the bassoon.' },
      { id: 'd', label: 'A clip squeezed round the bocal', ok: false, power: 'phantom', feedback: 'Nothing goes on the bocal: it is delicate and can be bent.' },
      { id: 'e', label: 'A mic straight into the bell, turned up until it clears the band', ok: false, power: 'phantom', feedback: 'A bell-only view hears the lowest note; turned up, it brings the stage and feedback.' },
    ],
    reasons: [docReason('the bell joint or the long joint'), clearReason('the bocal, the hands, the seat strap and the cable path'), POWER_REASON, { id: 'r.move', label: 'A mic on the bassoon holds its distance as the player moves', role: 'optional', feedback: 'A fair live reason for a clip mic.' }, BRAND_REASON('bassoon'), { id: 'r.loudest', label: 'Turn it up until the bassoon is louder than the band', role: 'wrong', feedback: 'More gain raises the stage in that mic too, and brings feedback closer.' }],
    explain: 'Two setups pass. What passes is the reasoning: a mount made for the bassoon or a close aimed stand mic, clearance from the bocal and the hands, the power it needs — and the rejection aimed at the wedge.',
  },
];

const predictions: WindLesson['predictions'] = {
  sound: { prompt: 'Before you step through: where does the bassoon’s very lowest note leave?', options: ['The boot', 'The bell at the top', 'The bocal'], after: 'Now STEP through (or PLAY ONCE), then try the notes on the next step.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the mic from the keys up toward the bell. What changes?', options: ['More of the lowest note', 'More of the high notes', 'Nothing'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge is on the floor in front. Where will a supercardioid aimed back at the bassoon reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What connects the bassoon’s reed to the wooden instrument?',
    options: ['The long joint, rising to the bell', 'The bocal, a thin curved metal tube', 'The seat strap, from the chair to the boot'],
    correct: 'The bocal, a thin curved metal tube',
    explain: 'The reed sits on the bocal, which curves from the player’s lips into the top of the wing joint. It is delicate: nothing is ever clamped to it.',
    why: {
      'The long joint, rising to the bell': 'The long joint is the far side of the fold, rising to the bell.',
      'The seat strap, from the chair to the boot': 'The strap holds the instrument up; it carries no sound.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'Why is the bassoon folded in two?',
    options: ['About 2.6 m of tube fits in a 1.35 m instrument', 'The fold makes the bassoon a brass instrument', 'The second half of the folded tube is decorative only'],
    correct: 'About 2.6 m of tube fits in a 1.35 m instrument',
    explain: 'The bore runs down the wing joint, round a U-tube in the boot and up the long joint to the bell: about 2.6 m of tube in an instrument about 1.35 m tall.',
    why: {
      'The fold makes the bassoon a brass instrument': 'It is a double-reed woodwind; the fold only saves length.',
      'The second half of the folded tube is decorative only': 'The whole folded tube is the air column that sounds.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'The bassoon plays its lowest note, every hole closed. Where does the sound leave?',
    options: ['From the boot, at the bottom of the fold', 'From the bocal, at the reed', 'From the bell, above the head'],
    correct: 'From the bell, above the head',
    explain: 'With every hole closed, the whole tube sounds and the sound leaves from the bell at the top.',
    why: {
      'From the boot, at the bottom of the fold': 'The air goes on round the boot; with every hole closed it leaves at the bell.',
      'From the bocal, at the reed': 'The reed starts the sound; the bell lets it out.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'As the bassoon plays higher, where does most of each note leave?',
    options: ['From the bell, whatever note is being played', 'From the reed, which sits nearer to the player', 'Farther down the tube, at the first open hole'],
    correct: 'Farther down the tube, at the first open hole',
    explain: 'Each note up opens a hole farther down the tube — the long joint, round the boot, up the wing joint — and most of the sound leaves there.',
    why: {
      'From the bell, whatever note is being played': 'Only the lowest note leaves mainly from the bell.',
      'From the reed, which sits nearer to the player': 'The reed starts the sound; it leaves where the tube is open.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'What must a stand mic and its cable stay clear of around a bassoonist?',
    options: ['The music stand, so the part can be read', 'The audience’s view of the whole instrument', 'The bocal and reed, hands, strap and bell'],
    correct: 'The bocal and reed, hands, strap and bell',
    explain: 'Clearance comes first: the bocal and the reed at the lips, the fingers and thumbs, the seat strap, and the bell beside the player’s head.',
    why: {
      'The music stand, so the part can be read': 'Sight lines matter, but safety is about what moves or bends.',
      'The audience’s view of the whole instrument': 'The view matters less than the player’s movement.',
    },
  },
  hearingDiag('q.6', W),
];

const floorY = SEATED.body.floorY;
const wedges: Wedge[] = [
  { id: 'wedge', label: 'the player’s floor wedge, in front, facing back at them', short: 'WEDGE', p: { x: 0, y: floorY, z: 1450 }, lift: 150, faces: { x: 0, y: 0, z: -1 }, note: 'On the floor in front, facing back at the player: below and behind a mic aimed back at the bassoon — tilting the mic matters as much as turning it.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
  { id: 'side', label: 'another player’s wedge, off to the bassoonist’s left', short: 'SIDE WEDGE', p: { x: 1400, y: floorY, z: 900 }, lift: 150, faces: { x: -0.8, y: 0, z: -0.6 }, note: 'Off to one side, facing another player: well off the mic’s axis.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
];

const copy: Partial<LessonCopy> = {
  variantKey: 'POSTURE',
  variantShort: { seated: 'seated', standing: 'standing' },
  sceneSubject: { seated: 'a bassoon held by a seated player on a seat strap', standing: 'a bassoon held by a standing player on a harness' },
  viewTag: { side: 'FRONT · FROM THE AUDIENCE', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'to player’s left', minus: 'to player’s right', label: 'ACROSS', blurb: 'Toward the player’s left (the bell) or right (the boot) (x).' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The bell rises above the player’s head.' },
    z: { plus: 'toward the audience', minus: 'toward the player', label: 'FRONT–BACK', blurb: 'Toward the audience or toward the player (z).' },
  },
  instrument: {
    figureBadge: 'A bassoon, its keys toward you · every part named',
    figureLabel: 'A bassoon seen from the side, keys toward you.',
    partsBadge: 'A bassoonist from the audience · tap a part to name it',
    partsLooking: { side: 'Front view · from the audience', top: 'Top view · from above' },
    partsIdle: 'The reed on its bocal starts the sound; the air in the long folded cone rings; the open holes and the bell let it out — the next page shows how. The bassoon crosses the body, the bell above the head.',
    variantNotes: { standing: 'STANDING: the same hold on a harness — the floor and the legs farther from a stand’s base. Switch POSTURE to sit the player down.' },
  },
  placement: {
    workedZone: { seated: 'bsn.dpa', standing: 'bsn.dpa' },
    workedLine: 'This starting point also reads how far the mic is from {line}.',
    workedAim: 'Aim it at the keys on the long joint — the lab counts it while the mic points within about {tol}° of them. Distance, height and angle are separate things to try.',
    workedClear: 'Clear of every part — the bell beside the head, the bocal and the reed, the hands and thumbs, the seat strap. Clearance comes first, before any number, and the player stops before a real mic moves.',
    blocked: {},
    reveal: 'Toward the bell, the lowest note tends to grow and the rest to thin; toward the boot’s holes, the middle notes lead; farther, more room. Each zone’s LISTEN FOR line is an idea to check by ear.',
    typeNotes: {
      sdcCard: 'Ideas to try: begin facing the keys a third of the way down from the bell; then a foot from the boot’s holes, or high on the right — one change at a time, the lowest note and a high passage each time.',
      wwMini: 'Ideas to try with a miniature: keep its strap on the bell joint; change only the capsule’s angle — farther down the instrument for a more even range.',
    },
    note: 'Clearance comes first: stop the player before moving a real mic. A mic, clip or cable anywhere the bocal, the hands, the strap or the bell can reach is in the wrong place, whatever the number says.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we suggest you begin with that kind of mic, measured from the part it names — the long joint a third of the way down from the bell, the boot’s holes, the keys from the side, the bell. They are starting points for different goals, not rules.',
      separate: 'Distance, height and the angle toward the bell are separate variables: change one at a time, and play the lowest note, the middle and the top each time. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.',
      clearance: 'Clearance comes first. Stop the player before moving a mic; keep the mic, stand, clip and cable clear of the bocal and reed, the fingers and thumbs, the seat strap and the bell beside the head. The engine stops the mic and names what it would touch.',
      tendencies: 'Toward the bell tends to bring the lowest note forward; toward the holes, the middle register; very close to the keys, clicks; farther, more room and blend. A directional mic up close also lifts the lows. These are tendencies, and bassoons vary.',
    },
  },
  context: {
    variant: 'seated',
    zone: 'bsn.dpa',
    typeId: 'sdcCard',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'sdcCard' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'sdcCard' },
      { id: 'hypercardioid', label: 'hypercardioid', typeId: 'sdcCard' },
    ],
    micNoun: 'A small condenser',
    shield: ['ww.long', 'ww.long.1', 'ww.long.2', 'ww.bell', 'ww.wing'],
    azMax: 60,
    elMax: 60,
    aimBlurb: 'Swing the front up to 60° either way — it still faces the bassoon.',
    plan: { u0: -1300, u1: 1700, v0: -500, v1: 1750 },
    side: { u0: -1300, u1: 1700, v0: -800, v1: 1300 },
    target: 'wedge',
    frontIds: [],
    targetWord: 'wedge',
    looking: 'Top view · mic in front of the bassoon',
    prompt: 'The player’s wedge stays where they need it. Turn the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — while the mic still points at the bassoon.',
    activityDone: 'done — the wedge sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies — the bassoon’s range. Use the null to aim, not to promise silence.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). In front of the player and aimed back at the bassoon, its rear faces the audience side — the wedge, down on the floor, sits below that line, so tilting the mic matters as much as turning it.',
    shieldNote: 'The player’s body and the bassoon can reflect stage sound into the front of a mic aimed at them — the free-field pattern cannot show that. Listen with the monitors on.',
    studioId: 'bsn.ctx.studio',
    studioPrompt: 'A studio session, a solo bassoon, a good room: what is the mic’s job?',
    studioNote: 'In the studio, one mic at a balanced distance — then a little farther and higher — can carry the whole bassoon and some room. Repeated trials are practical when the player stops. Switch back to LIVE for the monitor exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not restrictions.',
      points: [
        { title: 'PERSPECTIVE', text: 'Studio: a solo may want the room and the folded tube’s many outlets blended. Live: a bassoon among drums and amps needs a closer view, or a clip.' },
        { title: 'SPILL AND FEEDBACK', text: 'Studio: the room and the neighbours. Live: monitors, the PA and the band — and a pattern rejects least in the lows. Nothing alone prevents feedback.' },
        { title: 'MOVEMENT', text: 'The bassoon pivots a little on its strap. A stand mic has a working zone; a miniature on the bell joint keeps one distance.' },
        { title: 'IN A SECTION', text: 'With a main pair up, a bassoon mic is a spot: bring it up only for a stated balance, check it in mono. A section spot can sit between two bassoons at about head height.' },
      ],
      body: 'With a wedge in front of the player, a pattern’s rejection is a tool to aim — tilting as well as turning. Some stage sound in a bassoon mic is normal; the question is how much the music can take.',
      warn: 'No mic position alone prevents feedback: the pattern, the other open mics, the monitors, the system level and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
    },
  },
  twoMic: {
    variant: 'seated',
    A: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'bsn.dpa' },
    B: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'bsn.bell' },
    learn: [
      'A bell mic and a body mic are a choice for a reason, not a requirement: the lowest note is loud in one, the other notes in the other, so the blend moves through the phrase — and the two hear each note at different times.',
      'When it goes in: hear each mic alone, then the pair in MONO at the intended levels, over the whole passage and the lowest note. Move or rebalance a mic first; check both polarity states only after that.',
    ],
    warn: 'This simplified graph treats the bassoon as one point and both mics as hearing the same sound. Real mics on a bassoon hear different notes from different outlets, so read the notch POSITIONS and treat their depths as illustrative. Judge by ear, in mono, at matched levels.',
  },
  practice: {
    gain: 'bsn.prac.gain',
    second: 'bsn.prac.3',
    mixed: ['bsn.mix.1', 'bsn.mix.2', 'bsn.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: what a distance is measured from, a pattern’s null, and polarity versus delay.',
  },
  terms: {
    instrument: 'the bassoon',
    aimRef: 'its reference',
    startIntro: 'This lesson is about putting a microphone on a bassoon. First the bassoon itself: what it is, how the double reed and the long folded air column make its sound, where that sound leaves — farther down the instrument as the pitch rises — and where the player sits. Then the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
    startNew: 'Good — NEXT takes you through the bassoon first. You can change how you started here at any time.',
    refTitle: 'MEASURED FROM',
    otherRef: 'The same number measured from another part of the bassoon — the bell, the boot, the reed — would put the mic somewhere else.',
    noAim: 'This starting point gives no aim, so the mic simply faces the bassoon. Distance, height and angle are still separate things to try.',
    clipMount: 'Mount: a clip made for this bassoon, on a strap round the bell joint — never the bocal — with the player’s agreement',
    standMount: 'Mount: a weighted stand placed clear of the bocal, the hands, the seat strap and the bell',
    inPath: 'bassoon in path',
    facing: 'facing the bassoon',
    observation: 'For a real bassoon, with the player’s agreement, and the player stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
  },
};

export const A09B_LESSON: WindLesson = {
  id: 'A09b',
  labId: 'winds',
  title: 'Bassoon',
  subtitle: 'A third of the way down from the bell, a foot from the holes, high on the right, or a clip',
  noun: { one: 'bassoon', many: 'bassoons' },
  model: BASSOON_MODEL,
  micTypeIds: ['sdcCard', 'wwMini'],
  zones: BASSOON_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'The bass of the double reeds: a reed on a curved metal bocal, and a long conical wooden tube folded in two — the wing joint down, a U-turn in the boot, the long joint up to the bell. Finger holes and keys run down its length.', src: 'Y-BSN-MECH' },
    { title: 'WHERE YOU MEET IT', text: 'Orchestras, wind bands, chamber groups, film and studio sessions. This lesson covers one bassoon: a studio solo, a loud stage and a spot in a section.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'It plays bass lines and a wide, singing tenor range — from deep, buzzing low notes to soft, high melodies. Ask what the music needs: the section’s foundation, a solo line, or a separated part over a band.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'About 1.35 m tall, with about 2.6 m of tube folded inside; its lowest note, B♭1, is about 58 Hz. This lab draws a bassoon about that size, held across the body — seated on a seat strap, or standing on a harness.', src: 'Y-BSN-MECH' },
  ],
  sound: {
    stages: [
      { title: 'Breath on the double reed', text: 'The player’s lips hold the two cane blades; the breath pushes them together, narrowing the slit the air comes through.' },
      { title: 'The blades open and close', text: 'The blades snap shut and spring open again, letting the air in in puffs — in step with the long air column behind them.' },
      { title: 'The folded air column rings', text: 'A pressure wave runs down the bocal and the wing joint, round the boot and up the long joint, reflecting where the tube first meets the open air: a standing wave along the whole fold.' },
      { title: 'Sound leaves the bassoon', text: 'The lowest note leaves from the bell at the top; each note above opens a hole farther down the tube, and most of its sound leaves there — so the source moves down the instrument as the pitch rises.' },
    ],
    attack: 'The start of a note: the tongue releasing the reed and the reed’s buzz — strongest near the reed and bocal. A mic close to the reed or the keys hears more of it, and of the clicks.',
    body: 'The sustained tone: the folded cone ringing, leaving from the open holes, the boot region and the bell in a pattern that changes with every note. A little distance tends to blend those outlets with the room. Both are tendencies, and bassoons vary.',
    head: { diameterMm: 0, rods: 0, label: 'the air column', strikeSrc: 'Y-BSN-MECH4' },
  },
  setting: {
    items: [
      { id: 'self', label: 'the bassoon and its player', short: 'BASSOON', note: 'Across the body: the boot at the right hip on a seat strap, the bell above the head to the left. Ringed in amber: the instrument this lesson mics.', prov: { kind: 'illustrative', reason: 'bassoon/GEOMETRY_PROPOSAL.md posture (drawing default)' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'bocal', label: 'the bocal, the reed and the hands', short: 'BOCAL · HANDS', note: 'The bocal is delicate; the reed is at the lips; the fingers and both thumbs work the keys the whole time. No mic, clip, stand or cable goes there.', prov: { kind: 'illustrative', reason: 'the proposal’s keep-outs' }, tag: 'KEEP CLEAR', scene: 'kit', planIds: ['self'] },
      { id: 'strap', label: 'the seat strap and the chair', short: 'SEAT STRAP', note: 'A strap over the seat holds the boot up. Keep a stand’s base and cables off it and away from the chair’s legs and the player’s feet.', prov: { kind: 'illustrative', reason: 'the proposal’s keep-outs' }, tag: 'KEEP CLEAR', scene: 'kit', planIds: ['self'] },
      { id: 'stand', label: 'the music stand', short: 'MUSIC STAND', note: 'In front, shared with the second bassoon. The player must see the music and the conductor.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SIGHT LINE', scene: 'kit', planIds: ['stand.bsn'] },
      { id: 'bsn2', label: 'the second bassoon beside', short: 'BASSOON 2', note: 'In a section another bassoon sits close by; a spot between the two at about head height can hear both.', prov: { kind: 'illustrative', reason: 'a typical seating' }, tag: 'SPILL · SECTION', scene: 'kit' },
      { id: 'oboes', label: 'the oboes in front', short: 'OBOES', note: 'Right in front of the bassoons; a bassoon mic aimed forward hears them too.', prov: { kind: 'illustrative', reason: 'a typical seating' }, tag: 'SPILL', scene: 'kit', planIds: ['ob1', 'ob2'] },
      { id: 'clarinets', label: 'the clarinets beside', short: 'CLARINETS', note: 'The other half of the back row.', prov: { kind: 'illustrative', reason: 'a typical seating' }, tag: 'SPILL', scene: 'kit', planIds: ['cl1', 'cl2', 'bcl'] },
      { id: 'wedge', label: 'the player’s wedge (monitor)', short: 'WEDGE', note: 'On a stage, a floor monitor in front, facing back at the player — loud, and close to a bassoon mic.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'side', label: 'another player’s wedge', short: 'SIDE WEDGE', note: 'Off to one side, facing another player.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Live, the audience already hears the acoustic bassoon; the PA adds what the room needs.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage', planIds: ['audience', 'pa'] },
      { id: 'main', label: 'a main pair for the ensemble', short: 'MAIN PAIR', note: 'In a recording of a group, a main pair hears the whole ensemble; a bassoon mic is a spot that supports it.', prov: { kind: 'illustrative', reason: 'a generic main pair' }, tag: 'MAIN PAIR', scene: 'studio' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'No wedges on the floor; a good room helps the bassoon’s many outlets blend.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors on the floor feed the players, the PA faces the audience, and a band can be loud. A closer, aimed mic — or a miniature on the bell joint — helps against the stage and feedback; a pattern rejects least in the bassoon’s low range.',
    studio: 'STUDIO: no wedges, a room that may sound good, and repeated trials when the player stops. One mic at a balanced distance can carry the whole bassoon; in an ensemble, a main pair may carry it already.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic bassoon setup for a studio solo and for a loud stage, describe an alternative position, and explain what would justify a second mic. With a real bassoon and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'room', label: 'Room or stage', kind: 'text' },
      { id: 'posture', label: 'Player', kind: 'choice', choices: ['seated, seat strap', 'standing, harness'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser, cardioid', 'small condenser, omni', 'miniature on a clip', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, from the keys (or which part)', kind: 'text' },
      { id: 'notes', label: 'What you heard: the lowest note, the middle, the top, keys, room', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The player’s height above the floor and the hold across the body — drawing defaults — so no HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The split of the 2.6 m bore between the bocal, wing joint, boot, long joint and bell, the joints’ diameters and the key layout are drawing defaults; the 1.35 m height, the bore’s ends and the bell are sourced; the holes sit where the semitone rule puts them (a simplified picture).', dims: [] },
    { text: 'The hands, arms, head, the seat strap and the bassoon’s pivot — illustrative keep-outs (a 20 mm margin round the bassoon).', dims: [] },
    { text: 'The bell view’s 12–30 cm, the clip’s 3–13 cm and the miniature’s size and reach — drawing defaults to check on the real instrument.', dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. Every bassoon, reed, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: one player in a typical hold, tone holes where the semitone rule puts them along the folded bore, the air column as an ideal cone, mic patterns and the two-mic comb as textbook shapes. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped, and only with their agreement.',
  copy,
  wind: windExtra(SPEC, {
    soundSubject: 'A bassoon on its side, keys toward you, its folded air column drawn open',
    breath: 'Breath and the reed’s buzz are heard close to the reed and the bocal, at the player’s face — a body-facing mic hears little wind.',
    keys: 'Long rods, the thumbs’ many keys and the pads closing: loud within a few centimetres of the boot and the wing joint.',
    directivity: 'Measured round a player in a quiet room: around 125 Hz the bassoon radiates about equally in every direction; between 1 and 2 kHz its pattern is most pronounced, and the 1 kHz band beams strongly toward the bell.',
    noteDefault: 9,
  }),
};
