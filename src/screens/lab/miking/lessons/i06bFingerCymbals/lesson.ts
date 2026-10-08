/**
 * I06b FINGER CYMBALS — the lesson as DATA. Words from the owner's lesson
 * (docs/labs/miking/source_text/Finger-Cymbals-Miking-Technique-Research.txt;
 * "L<n>" in comments only), research in docs/labs/miking/finger_cymbals/,
 * corrections in CORRECTIONS_LOG.md (FC-01 …). Owner ruling 2026-10-04:
 * suggested starting points, no sources, brands or badges on screen. FULLY
 * SILENT. Dance and ensemble lessons (Lab 5, later) are named in words only.
 *
 * Two sources, two ways of playing: held still (orchestral) and danced. The
 * 30–60 cm range and the wider dance views are the lesson's own trials; the
 * one published number is a general 30 cm floor for percussion.
 */
import type { DiagnosticItem, Lesson, MikingScenario, LessonPages, PageContent, SourcePageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, cardioidNull, CLEAR_REASON, contactSymptom, firstNotch, gainCheck, hearingCheck, louderIsNotBetter, monoSymptom, moveRemovesDelay, PLAYER_REASON, polarityKeepsDelay, POWER_REASON, quickHearing, setupOrder, tailSymptom, type MetalWords } from '../shared/metal/metalItems.ts';
import { metalWords } from '../shared/metal/metalCopy.ts';
import { FC_MODEL, FC_ZONES } from './geometry.ts';

const W: MetalWords = { p: 'fc', the: 'the finger cymbals', player: 'player', loudest: 'the brightest accent', tail: 'the ring' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the finger cymbals',
    goal: 'Get to know finger cymbals — what they are, where you meet them, what they do in the music, their parts and the two ways they are played — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A pair of small brass cymbals, about 5 cm across, sounding when one strikes the other. Held still and dropped edge-first, or worn on the thumbs and fingers of a dancer — two different sources for a mic.',
  },
  sound: {
    title: 'How they make their sound',
    goal: 'See how a stroke becomes sound — edge meets edge, they part, both ring — and why letting them part matters.',
    credit: { scenarios: ['fc.snd.1', 'fc.snd.2', 'fc.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'Two small plates struck together: a bright attack where the edges meet, then both ring in shapes whose pitches are not whole-number steps apart. Pressed together they choke; released, they ring on.',
  },
  setting: {
    title: 'Where they sit',
    goal: 'Know where finger cymbals are played — a still player or a moving dancer, the neighbours, what a stage and a studio add — and what to do before any mic.',
    credit: { scenarios: ['fc.set.1', 'fc.set.hear', 'fc.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Ask for the whole passage — or the whole dance — before anything goes up. The hands, the body and the route set the clearance; check the straps. Protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for finger cymbals by its properties — pattern, power, size, mount and peak handling — not by its brand.',
    credit: { scenarios: ['fc.mic.1', 'fc.mic.2', 'fc.mic.3', 'fc.mic.4', 'fc.rec.1'], note: 'Answer the five checks (one reaches back to how they sound).' },
    takeaway: 'A small condenser is a common studio choice for the bright attack and the ring; a dynamic can suit a stage. Watch the peaks. For a dancer, the pattern’s coverage matters as much as its detail.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — about 30–60 cm from a still player’s hands, a little above; high and wide for a dancer — then move the mic and see what changes.',
    credit: { scenarios: ['fc.place.1', 'fc.place.2', 'fc.place.3', 'fc.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the player, in two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'A still player: about 30–60 cm from the playing area, a little above, seeing both cymbals and the release. A dancer: a wider or higher view outside the whole route — never between the cymbals, and never limiting the dance.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces a loud monitor — and know when a spot helps and when the stage mics already do the job.',
    credit: { scenarios: ['fc.ctx.1', 'fc.ctx.2', 'fc.ctx.studio', 'fc.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'A fixed station: a stand-mounted directional mic clear of both hands, its null toward the loudest wedge. A dancer: listen to the stage mics first; a broader pickup trades spill and feedback margin for coverage.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'Add a second mic: see what polarity does and does not change, and judge the pair in mono.',
    credit: { scenarios: ['fc.two.1', 'fc.two.2', 'fc.two.3', 'fc.two.4'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Polarity flips the sign; it does not remove a delay. Two cymbals do not need two mics — a pair is optional, for a broad image or a moving performer. Judge any pair in mono.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Look at the source first — the release, the pair, the contact — then the hands’ path and the mic’s angle, other open mics and the monitors, before reaching for EQ or a gate.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second mic.',
    credit: { scenarios: ['fc.prac.order', 'fc.prac.gain', 'fc.prac.setup1', 'fc.prac.setup2', 'fc.prac.3', 'fc.mix.1', 'fc.mix.2', 'fc.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'Map the real hand or dance movement, choose a safe pickup that carries the whole phrase, tell source changes from mic changes, and know why a spot is — or is not — useful. More than one setup can pass.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L5-L6 · set L6, L52 · mic L9-L13 · place L9-L11 ·
 * ctx L40-L46 · two L32 · prac L60-L65. */
const scenarios: MikingScenario[] = [
  {
    id: 'fc.snd.1',
    page: 'sound',
    prompt: 'How does a pair of finger cymbals make its sound?',
    options: ['One cymbal strikes the other; both plates ring', 'Air trapped between them is pushed out in a puff', 'A thin wire inside each cymbal rattles when shaken'],
    correct: 'One cymbal strikes the other; both plates ring',
    explain: 'They are concussion idiophones: the metal itself vibrates. Edge meets edge — the attack — and both small plates ring.',
    why: {
      'Air trapped between them is pushed out in a puff': 'The metal plates themselves vibrate; there is no air chamber to speak of.',
      'A thin wire inside each cymbal rattles when shaken': 'There is no wire: each cymbal is a solid brass plate.',
    },
  },
  {
    id: 'fc.snd.2',
    page: 'sound',
    prompt: 'The player keeps the cymbals pressed together after the stroke. What happens?',
    options: ['The ring is choked: an attack, then little ring', 'The ring gets longer, because the pair is steadier', 'Nothing changes: the ring is already over by then'],
    correct: 'The ring is choked: an attack, then little ring',
    explain: 'Touching plates damp each other. Released after the stroke, both ring on — so watch how the player releases the pair before blaming the mic.',
    why: {
      'The ring gets longer, because the pair is steadier': 'Pressed together they damp each other: the ring stops.',
      'Nothing changes: the ring is already over by then': 'The ring lasts after the contact — unless the plates stay together.',
    },
  },
  {
    id: 'fc.snd.3',
    page: 'sound',
    prompt: 'Why does a finger cymbal shimmer rather than sound one plain note?',
    options: ['Its plate rings in many shapes at pitches not in whole-number steps', 'The leather strap keeps buzzing against the metal as it rings out', 'The dancer’s movement through the room keeps changing its pitch'],
    correct: 'Its plate rings in many shapes at pitches not in whole-number steps',
    explain: 'A struck plate rings in many shapes at once; their pitches are not 1 : 2 : 3, so the ear hears a bright, piercing shimmer.',
    why: {
      'The leather strap keeps buzzing against the metal as it rings out': 'A strap that buzzes is a fault to check; the shimmer is the plate’s own shapes.',
      'The dancer’s movement through the room keeps changing its pitch': 'Movement changes the level at a fixed mic, not the cymbals’ shapes.',
    },
  },
  {
    id: 'fc.set.1',
    page: 'setting',
    prompt: 'Finger cymbals for a dance piece. What do you ask for before placing a mic?',
    options: ['The whole dance: both hands, turns and the route', 'Only the loudest accent, so gain can be set', 'For the dancer to stay at one fixed spot near the mic'],
    correct: 'The whole dance: both hands, turns and the route',
    explain: 'Do not assume a dancer stands still at chest height. The route, turns and both hands decide where a mic can go — and the dance, not the mic, sets them.',
    why: {
      'Only the loudest accent, so gain can be set': 'Gain needs the loudest and the quietest moments — and placement needs the whole route.',
      'For the dancer to stay at one fixed spot near the mic': 'Never restrict the choreography to suit a mic.',
    },
  },
  hearingCheck(W),
  {
    id: 'fc.set.2',
    page: 'setting',
    prompt: 'Before a moving performer plays, what do you check on the cymbals?',
    options: ['The straps or loops, so no cymbal flies off', 'That they are tied tightly to the player’s hand', 'That the pair is polished and bright'],
    correct: 'The straps or loops, so no cymbal flies off',
    explain: 'A loose cymbal can fall or fly from the hand. Confirm the attachment with the musician — and keep stands and cables clear of the route so nothing snags.',
    why: {
      'That they are tied tightly to the player’s hand': 'The straps hold them; the plates must still ring freely.',
      'That the pair is polished and bright': 'Polish is cosmetic; the attachment is the safety check.',
    },
  },
  {
    id: 'fc.mic.1',
    page: 'microphone',
    prompt: 'Through a close condenser the attack is harsh. What do you look at first?',
    options: ['The contact and the pair, then the mic’s angle', 'A larger condenser, which will make the attack softer', 'Lower gain, so the harshness goes away'],
    correct: 'The contact and the pair, then the mic’s angle',
    explain: 'How the edges meet, the force and the pair change the attack before the mic does. Then compare a safe angle or distance at matched level — off-axis response varies, so listen.',
    why: {
      'A larger condenser, which will make the attack softer': 'Diaphragm size is not a tone control. Start with the source.',
      'Lower gain, so the harshness goes away': 'Gain changes the level, not the balance: it stays harsh, only quieter.',
    },
  },
  {
    id: 'fc.mic.2',
    page: 'microphone',
    prompt: 'The meter looks fine, but the brightest accents distort. Why can that happen?',
    options: ['A slow meter can miss the brief peaks that overload the input', 'The mic distorts when its level is set too low', 'A modest meter reading means the mic cable is faulty somewhere along it'],
    correct: 'A slow meter can miss the brief peaks that overload the input',
    explain: 'A struck finger cymbal’s attack is very brief; a slow average meter reads low while the peak overloads. Watch a peak meter, and check the preamp, the converter and the live chain.',
    why: {
      'The mic distorts when its level is set too low': 'Low level does not cause distortion; brief peaks the meter misses do.',
      'A modest meter reading means the mic cable is faulty somewhere along it': 'Nothing is broken: the meter is too slow for the peaks.',
    },
  },
  {
    id: 'fc.mic.3',
    page: 'microphone',
    prompt: 'The spare channel has no phantom power. Which of this page’s mics can you use?',
    options: ['The small dynamic: it needs no power', 'The small condenser, if it sits farther back', 'Either, as long as the gain is turned up'],
    correct: 'The small dynamic: it needs no power',
    explain: 'A dynamic needs no power. A condenser needs phantom power wherever it is placed.',
    why: {
      'The small condenser, if it sits farther back': 'Distance does not change what a condenser needs.',
      'Either, as long as the gain is turned up': 'Gain cannot power a condenser.',
    },
  },
  {
    id: 'fc.mic.4',
    page: 'microphone',
    prompt: 'A dancer plays finger cymbals across the stage. Why might a wider pattern help — and cost?',
    options: ['It covers the moving hands but hears more of the stage', 'It rejects the stage better, since it hears more of the dancer', 'It costs nothing: a wider pattern just hears the dancer better'],
    correct: 'It covers the moving hands but hears more of the stage',
    explain: 'A mic aimed at one point can miss a moving pair. A wider or higher view covers more of the route — with more spill and less gain before feedback.',
    why: {
      'It rejects the stage better, since it hears more of the dancer': 'A wider pattern rejects less, not more.',
      'It costs nothing: a wider pattern just hears the dancer better': 'The cost is spill and feedback margin on a loud stage.',
    },
  },
  {
    id: 'fc.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Why must the mic hear the cymbals after the stroke, not only at it?',
    options: ['The ring after the release is part of the sound', 'The attack happens after the cymbals part', 'Sound only leaves the cymbals once they are still'],
    correct: 'The ring after the release is part of the sound',
    explain: 'The bright attack and the decaying ring coexist. A mic placed only for the contact point can miss the ring — and a gate can cut it off.',
    why: {
      'The attack happens after the cymbals part': 'The attack is the contact; the ring follows the release.',
      'Sound only leaves the cymbals once they are still': 'They radiate while they ring; still plates are silent.',
    },
  },
  {
    id: 'fc.place.1',
    page: 'placement',
    prompt: 'A starting point says about 30–60 cm. What is it measured from?',
    options: ['The middle of the area where the cymbals are played', 'The player’s chest, wherever the hands are', 'The floor, so that the stand height can be set first'],
    correct: 'The middle of the area where the cymbals are played',
    explain: 'The distance belongs to the playing area — and the mic must still stay outside both hands’ whole path. The number is not a safety clearance.',
    why: {
      'The player’s chest, wherever the hands are': 'The cymbals are played out in front of the chest; measure from where they are played.',
      'The floor, so that the stand height can be set first': 'The floor says nothing about the distance to the sound.',
    },
  },
  {
    id: 'fc.place.2',
    page: 'placement',
    prompt: 'For the most level, could you put the mic right between the two cymbals?',
    options: ['No — fingers and the other cymbal can hit it', 'Yes — between them it hears both cymbals equally', 'Yes, as long as the mic is very small'],
    correct: 'No — fingers and the other cymbal can hit it',
    explain: 'Never put the mic directly between the cymbals or where fingers can strike it. Get closer from outside the whole gesture.',
    why: {
      'Yes — between them it hears both cymbals equally': 'Even if it did, the cymbals and fingers move there. Clearance comes first.',
      'Yes, as long as the mic is very small': 'Size is not the question: the hands’ path is.',
    },
  },
  {
    id: 'fc.place.3',
    page: 'placement',
    prompt: 'The level jumps as the hands move. What do you try first?',
    options: ['Cover the whole gesture: farther back, or wider', 'Ask the player to keep both hands still for the mic', 'A compressor, set hard on the channel'],
    correct: 'Cover the whole gesture: farther back, or wider',
    explain: 'A mic aimed at one stationary contact point can miss a moving pair. Step back or widen the view until the level holds across the whole gesture.',
    why: {
      'Ask the player to keep both hands still for the mic': 'The movement is the music; cover it instead.',
      'A compressor, set hard on the channel': 'Processing hides a placement problem; fix the coverage first.',
    },
  },
  {
    id: 'fc.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · For a dancer, is a stand clear of the dancer’s first position enough?',
    options: ['No — it must clear the whole route and every turn', 'Yes — the cymbals are tiny, so that is plenty of room', 'Yes, as long as the cable is taped down'],
    correct: 'No — it must clear the whole route and every turn',
    explain: 'Small cymbals, big movement: map the route, the turns and the arms, and keep stands and cables off the dance path.',
    why: {
      'Yes — the cymbals are tiny, so that is plenty of room': 'The dancer moves far beyond the cymbals’ size.',
      'Yes, as long as the cable is taped down': 'Taping helps, but the stand must still clear the whole route.',
    },
  },
  {
    id: 'fc.ctx.1',
    page: 'context',
    prompt: 'A loud band; the cymbals are weak against the stage. First move?',
    options: ['Move the player and mic, cut competing levels, then gain', 'Turn the cymbal mic up until it cuts through the whole band', 'Ask the player to strike each accent much harder'],
    correct: 'Move the player and mic, cut competing levels, then gain',
    explain: 'Moving the player and the mic, lowering neighbouring sources and closing unused mics help more than gain, which raises spill and feedback risk too.',
    why: {
      'Turn the cymbal mic up until it cuts through the whole band': 'More gain raises the band in that mic too, and brings feedback closer.',
      'Ask the player to strike each accent much harder': 'Harder strokes change the music; fix the balance instead.',
    },
  },
  {
    id: 'fc.ctx.2',
    page: 'context',
    prompt: 'Should the finger-cymbal channel go into the player’s monitor?',
    options: ['Low or out, unless the player actually needs it', 'Yes, loud, so the player hears each stroke', 'Yes — monitors stop finger cymbals feeding back'],
    correct: 'Low or out, unless the player actually needs it',
    explain: 'The bright attack raises the feedback risk in a monitor. The player usually hears the cymbals acoustically; send only what they need.',
    why: {
      'Yes, loud, so the player hears each stroke': 'A loud send raises the feedback risk — and the player is right beside the cymbals.',
      'Yes — monitors stop finger cymbals feeding back': 'Monitors are where feedback starts, not a cure for it.',
    },
  },
  {
    id: 'fc.ctx.studio',
    page: 'context',
    prompt: 'An ensemble recording. When do the finger cymbals earn their own spot?',
    options: ['When the main or overhead mics lose them', 'As a habit, so they can be turned up later', 'When they are the loudest instrument anywhere in the room'],
    correct: 'When the main or overhead mics lose them',
    explain: 'Listen to the main pair and the overheads first; a spot gives independent control, but it may also hear more loud neighbours than cymbals. Check it with the main, in mono.',
    why: {
      'As a habit, so they can be turned up later': 'A spot that is not needed adds spill and can colour the sum.',
      'When they are the loudest instrument anywhere in the room': 'Loudness is not the test; what the main mics miss is.',
    },
  },
  {
    id: 'fc.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · A dancer moves toward and away from a fixed mic. What does the mic hear change?',
    options: ['The level, as the distance changes', 'The pitch of the cymbals', 'Nothing: the cymbals are the same'],
    correct: 'The level, as the distance changes',
    explain: 'Nearer is louder at the mic. Along a route the level rises and falls — the reason for a wider or higher view that covers it.',
    why: {
      'The pitch of the cymbals': 'Distance changes the level at the mic, not the cymbals’ pitch.',
      'Nothing: the cymbals are the same': 'The cymbals are the same; their distance to the mic is not.',
    },
  },
  polarityKeepsDelay(W),
  firstNotch(W),
  {
    id: 'fc.two.3',
    page: 'twoMic',
    prompt: 'There are two cymbals. Can one mic cover the pair?',
    options: ['Yes — one mic hears the pair; a second is optional', 'No — each cymbal needs its own close mic to be heard', 'No — a pair of mics is the usual rule for two cymbals'],
    correct: 'Yes — one mic hears the pair; a second is optional',
    explain: 'A stereo pair is an option for a broad image or a moving performer — not required because there are two cymbals. Judge any pair in mono.',
    why: {
      'No — each cymbal needs its own close mic to be heard': 'The two cymbals sound together; one mic hears the pair.',
      'No — a pair of mics is the usual rule for two cymbals': 'One mic is the usual start; a second has to earn its place.',
    },
  },
  louderIsNotBetter(W),
  gainCheck(W),
  {
    id: 'fc.prac.3',
    page: 'practice',
    prompt: 'What would justify a second finger-cymbal mic?',
    options: ['The best single mic misses something the music needs', 'Two mics are the usual standard for finger cymbals', 'The cymbals need more level than one mic can give them'],
    correct: 'The best single mic misses something the music needs',
    explain: 'One mic is often enough. A second earns its place for a broad image or a moving performer — and adds spill, timing and feedback risk.',
    why: {
      'Two mics are the usual standard for finger cymbals': 'One well-placed mic is the usual start.',
      'The cymbals need more level than one mic can give them': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'fc.mix.1',
    page: 'practice',
    prompt: 'A second pair sounds higher. Can you say thicker cymbals always ring higher?',
    options: ['No — compare these pairs; makers and alloys differ', 'Yes — thickness sets the pitch in each pair', 'Yes, as long as both pairs are exactly the same size'],
    correct: 'No — compare these pairs; makers and alloys differ',
    explain: 'One maker describes its thick pair as higher than its thin pair; that does not make a rule across makers, alloys, sizes or players. Compare the real pairs.',
    why: {
      'Yes — thickness sets the pitch in each pair': 'Size, alloy, shape and the player all play a part; compare the real pairs.',
      'Yes, as long as both pairs are exactly the same size': 'Even at one size, alloys and shapes differ between makers.',
    },
  },
  cardioidNull(W),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  {
    id: 'fc.s.noring',
    observation: 'Attack but almost no ring',
    firstChecks: 'Do the cymbals stay pressed together, or touch a hand?',
    options: ['Whether they part freely after the stroke', 'Move the mic closer to catch the ring', 'Add reverb to make up the missing ring'],
    correct: 'Whether they part freely after the stroke',
    explain: 'Have the player show the intended release before changing the mic. A choked pair has little ring to pick up.',
    why: {
      'Move the mic closer to catch the ring': 'The ring is missing at the source; distance cannot restore it.',
      'Add reverb to make up the missing ring': 'Reverb hides the cause; check the release first.',
    },
  },
  {
    id: 'fc.s.harsh',
    observation: 'Harsh attack',
    firstChecks: 'Is the pair or the contact making it — or is the mic too direct?',
    options: ['The contact and pair, then a safe angle', 'Push the mic closer to soften the attack', 'Cut the treble on the desk straight away'],
    correct: 'The contact and pair, then a safe angle',
    explain: 'Compare the technique and the pair, then a safe angle or distance at matched level.',
    why: {
      'Push the mic closer to soften the attack': 'Closer tends to more attack, not less.',
      'Cut the treble on the desk straight away': 'Find whether the source or the mic makes it before EQ.',
    },
  },
  {
    id: 'fc.s.uneven',
    observation: 'The pattern’s level is uneven',
    firstChecks: 'Do the hands move in and out of the pickup area?',
    options: ['Whether the hands leave the pickup area', 'Compress the channel until it is even', 'Ask the player to keep both hands still for the mic'],
    correct: 'Whether the hands leave the pickup area',
    explain: 'Cover the full gesture or widen the station; rehearse the route.',
    why: {
      'Compress the channel until it is even': 'Processing hides a coverage problem; widen the pickup first.',
      'Ask the player to keep both hands still for the mic': 'The movement is the music; cover it.',
    },
  },
  {
    id: 'fc.s.feet',
    observation: 'Footfalls and handling noise',
    firstChecks: 'Is the player moving near the mic or its stand?',
    options: ['Whether the player is near the mic or stand', 'Add a gate so the noise between strokes is cut', 'Swap for a mic with a wider pattern to cover it'],
    correct: 'Whether the player is near the mic or stand',
    explain: 'Isolate the support and move the stand; filter only the unwanted low noise, and listen to what the filter does.',
    why: {
      'Add a gate so the noise between strokes is cut': 'A gate would cut the ring too. Move the stand first.',
      'Swap for a mic with a wider pattern to cover it': 'A wider pattern hears more of the floor and the stage, not less.',
    },
  },
  tailSymptom(W),
  monoSymptom(W),
  contactSymptom(W, 'a hand or a cymbal'),
];

const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point, measured from where the cymbals are played', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };

const setupTasks: SetupTask[] = [
  {
    id: 'fc.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A studio overdub: a still player, an orchestral part — held flat, struck edge-first — with soft notes and a few accents. Phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser about 40 cm in front and a little above the playing area', ok: true, power: 'phantom', feedback: 'A recommended starting point, clear of both hands; it needs the phantom this channel has.' },
      { id: 'b', label: 'Small condenser about 55 cm away, a little above, for more of the room', ok: true, power: 'phantom', feedback: 'A wider view — check the soft notes stay distinct.' },
      { id: 'c', label: 'A mic held between the two cymbals', ok: false, power: 'phantom', feedback: 'That is where the cymbals and fingers move.' },
      { id: 'd', label: 'A gate on the channel to cut the room between strokes', ok: false, power: 'phantom', feedback: 'A gate would cut the ring the music needs.' },
      { id: 'e', label: 'Ask the player to strike harder so the mic hears it better', ok: false, power: 'none', feedback: 'Harder strokes change the music — and the player’s technique is not changed for a mic.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.peak', label: 'Gain is set from the brightest accent, then checked on the soft notes', role: 'optional', feedback: 'A fair reason — and good practice.' }, BRAND_REASON, PLAYER_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point from the playing area, outside both hands’ path, with the power the mic needs.',
  },
  {
    id: 'fc.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A dancer plays finger cymbals across a quiet stage. Ensemble mics are already up. The spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'No extra mic: listen to the ensemble mics first, and add nothing if they carry it', ok: true, power: 'none', feedback: 'Fair, if the existing mics carry the route.' },
      { id: 'b', label: 'Small dynamic high and in front, outside the whole route, aimed at its middle', ok: true, power: 'none', feedback: 'A wider view that covers the route; a dynamic needs no phantom. Check spill and feedback.' },
      { id: 'c', label: 'Small condenser on a stand in the middle of the route', ok: false, power: 'phantom', feedback: 'It needs phantom this input lacks — and it is in the dancer’s path.' },
      { id: 'd', label: 'Ask the dancer to stay by one mic for the whole piece', ok: false, power: 'none', feedback: 'Never restrict the choreography to suit a mic.' },
      { id: 'e', label: 'A wearable mic taped to the dancer’s hand, untested', ok: false, power: 'phantom', feedback: 'A wearable mic is not a default: it changes with every move and needs a tested attachment and wireless system.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.route', label: 'The pickup covers the whole route, not one spot', role: 'optional', feedback: 'A fair reason for a moving performer.' }, BRAND_REASON, PLAYER_REASON],
    explain: 'Two setups pass. What passes is the reasoning: coverage of the whole route, outside the dance, powered by what this input can supply — or no extra mic when the existing ones carry it.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: what happens if the two cymbals stay together after the stroke?', options: ['The ring is choked', 'They ring louder', 'Nothing changes'], after: 'Now STEP through the stroke (or PLAY ONCE), then try the plate’s shapes.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the mic from 30 cm to 60 cm. What changes most?', options: ['More room, steadier level', 'More attack', 'Nothing'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge sits downstage, behind the mic. Can a cardioid’s null reach it?', options: ['Yes — its back can face the wedge', 'No — only an omni can', 'It is already at the side'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'fc.q.1',
    covers: 'instrument',
    prompt: 'What are finger cymbals?',
    options: ['A pair of small cymbals that sound when struck together', 'A single small cymbal on a short stand, struck with a stick', 'Tiny bells tied in a ring round the player’s wrist'],
    correct: 'A pair of small cymbals that sound when struck together',
    explain: 'A pair of small metal plates — concussion idiophones. (Crotales, a tuned keyboard of small cymbals, are a different instrument.)',
    why: {
      'A single small cymbal on a short stand, struck with a stick': 'They are a pair, struck together — held or worn on the fingers.',
      'Tiny bells tied in a ring round the player’s wrist': 'They are small cymbals, not bells.',
    },
  },
  {
    id: 'fc.q.2',
    covers: 'instrument',
    prompt: 'How are finger cymbals played in a classical setting?',
    options: ['One held flat, the other dropped edge-first into it', 'Both worn on the thumbs and clapped while walking', 'Shaken in one hand like a pair of maracas'],
    correct: 'One held flat, the other dropped edge-first into it',
    explain: 'Held parallel to the floor, struck by dropping one edge into the other — a bright, articulate sound. Worn on the thumb and finger is the traditional, dance way.',
    why: {
      'Both worn on the thumbs and clapped while walking': 'That is closer to the traditional dance way; the classical way holds one flat.',
      'Shaken in one hand like a pair of maracas': 'They are struck together, not shaken.',
    },
  },
  {
    id: 'fc.q.3',
    covers: 'sound',
    prompt: 'The player keeps the pair pressed together after each stroke. What does a mic hear?',
    options: ['An attack, then little ring', 'A longer, fuller ring than before', 'Nothing at all — the sound stops dead'],
    correct: 'An attack, then little ring',
    explain: 'Touching plates damp each other: the release matters as much as the stroke.',
    why: {
      'A longer, fuller ring than before': 'Pressed together, they choke.',
      'Nothing at all — the sound stops dead': 'The contact still makes an attack.',
    },
  },
  {
    id: 'fc.q.4',
    covers: 'sound',
    prompt: 'A dancer moves along a route past a fixed mic. What changes at the mic?',
    options: ['The level, as the distance changes', 'The cymbals’ pitch, up and down', 'Only the room, not the cymbals'],
    correct: 'The level, as the distance changes',
    explain: 'Nearer is louder at the mic: a moving source changes level along its route.',
    why: {
      'The cymbals’ pitch, up and down': 'Distance changes the level at the mic, not the pitch.',
      'Only the room, not the cymbals': 'The direct sound changes too, with the distance.',
    },
  },
  {
    id: 'fc.q.5',
    covers: 'setting',
    critical: true,
    prompt: 'Placing a mic for a dancer with finger cymbals, what comes first?',
    options: ['The whole route, the arms and every turn', 'The exact distance the starting point gives', 'The shortest cable run back to the stage box'],
    correct: 'The whole route, the arms and every turn',
    explain: 'Clearance comes before every number: stands and cables stay off the dance path, and the dance is never restricted for a mic.',
    why: {
      'The exact distance the starting point gives': 'The numbers are starting points; the route comes first.',
      'The shortest cable run back to the stage box': 'A tidy cable matters, but never before the performer’s space.',
    },
  },
  quickHearing(W),
];

export const I06B_LESSON: Lesson = {
  id: 'I06b',
  labId: 'percussion',
  title: 'Finger Cymbals',
  subtitle: 'A small pair, held still or danced — attack, ring and the moving hands',
  noun: { one: 'finger cymbal', many: 'finger cymbals' },
  model: FC_MODEL,
  micTypeIds: ['sdcCard', 'smallDynCard'],
  zones: FC_ZONES,
  // Review 2026-10-07 (R12-A03): no two-mic STARTING SETUP — two mics 15 cm
  // apart on one small pair only comb; the farther spot is the FARTHER BACK
  // setup (engine/setups.ts SETUP_PICKS).
  pages,
  scenarios,
  symptoms,
  orderTasks: [setupOrder(W, { text: 'Watch the whole passage — or the whole dance — with the player', early: 'Start with the player and the music.' })],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT THEY ARE', text: 'A pair of small brass cymbals, each with a strap or loop through its centre. They sound when one strikes the other — the metal itself vibrates. (Crotales, a tuned keyboard of small cymbals, and the drum-kit cymbals are other instruments.)', src: 'MET-TAL' },
    { title: 'WHERE YOU MEET THEM', text: 'In music and dance traditions where they are worn on the fingers, and in orchestras and percussion sections — in the studio and on stage. (Dance and whole-ensemble setups come later, in Lab 5.)', src: 'PAS-ECV0220' },
    { title: 'WHAT THEY DO IN THE MUSIC', text: 'Bright, piercing accents, quick rhythms, and a shimmering ring after each stroke. Held still and struck edge-first, or played in rhythm by a dancer — two very different sources for a mic.', src: 'PAS-ECV0220' },
    { title: 'THEIR SIZE', text: 'Small: about 5 cm across. This lab draws a measured pair of 5.5 and 4.8 cm (about 2 in), 2.4 cm high. Thin and thick pairs exist; one maker describes its thin pair as lower-pitched than its thick — compare the real pairs.', src: 'MET-TAL' },
  ],
  sound: {
    stages: [
      { title: 'Edge-first', text: 'One cymbal is held flat; the other is dropped edge-first toward it.', byVariant: { dance: 'The thumb and a finger bring their two cymbals together, in rhythm.' } },
      { title: 'The edges meet', text: 'The edge strikes the other cymbal near its rim: the bright ATTACK.' },
      { title: 'Apart, both ring', text: 'The upper cymbal lifts away and both plates ring in many shapes at once. Kept pressed together, they would choke.', byVariant: { dance: 'Thumb and finger part and both plates ring in many shapes at once. Kept pressed together, they would choke.' } },
      { title: 'Sound leaves all round', text: 'Sound leaves both faces of both small plates. A mic a little above sees both cymbals and the release.', byVariant: { dance: 'Sound leaves both faces of both small plates — while the dancer moves on, so the distance to a fixed mic keeps changing.' } },
    ],
    attack: 'The start of each stroke: edge meeting edge — very brief and very bright. A mic close to the contact, or aimed straight at it, tends to hear more of it; the contact, the force and the pair change it before the mic does.',
    body: 'The ring after the cymbals part: both small plates shimmering, until the player lets it fade or damps it. Pressed together they choke. A mic that sees both cymbals and the release hears attack and ring together. Tendencies — pairs and players vary.',
    head: { diameterMm: 55, rods: 0, label: 'a 5.5 cm finger cymbal', strikeSrc: 'PAS-ECV0220' },
  },
  setting: {
    items: [
      { id: 'pair', label: 'the finger cymbals, in front of the chest', short: 'CYMBALS', note: 'Held still: one cymbal flat in front of the chest, the other dropped into it. Danced: a pair on each hand, moving with the dancer.', prov: { kind: 'illustrative', reason: 'a typical hold: the posture is a drawing default' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'player', label: 'the player — or the dancer — and both hands', short: 'PLAYER', note: 'Both hands, the drop, and — for a dancer — the whole route and every turn: the player’s space. No mic, stand or cable in it.', prov: { kind: 'illustrative', reason: 'a standing player: a drawing default' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'wedge', label: 'a floor wedge downstage', short: 'WEDGE', note: 'Live, a floor monitor on the audience side, facing back toward the player — behind a mic that faces the cymbals, where a pattern’s null can help.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'band', label: 'the drums and louder players', short: 'DRUMS · BAND', note: 'Far louder than finger cymbals: move the player and mic, or lower the neighbours, before raising gain.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'stage' },
      { id: 'audience', label: 'the audience and the PA', short: 'AUDIENCE · PA', note: 'Listen from here first, without amplification. The mic usually comes from this side.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'MIC SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a good room, a more distant image can suit the music; record the silence after an accent too — ring, room and handling show up there.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: a fixed station takes a stand-mounted directional mic clear of both hands; a dancer needs the stage mics or a broader, higher pickup — with more spill and less feedback margin.',
    studio: 'STUDIO: a still player, the final pair and a comfortable position; compare a moderate spot with a wider view. A stereo pair is optional, not required because there are two cymbals.',
  },
  diagnostic,
  practice: {
    task: 'Map the real hand or dance movement, choose a safe pickup that carries the whole phrase, tell source changes from mic changes, and say why a spot is or is not useful. With a player’s agreement, log what you tried below.',
    fields: [
      { id: 'inst', label: 'The pair (size, thin or thick, straps)', kind: 'text' },
      { id: 'played', label: 'How they were played', kind: 'choice', choices: ['held still, edge-first', 'worn, dancing', 'both'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser', 'small dynamic', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'peak', label: 'Headroom on the brightest accent', kind: 'text' },
      { id: 'notes', label: 'What you heard: attack, ring, level along the route (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The dome (26 mm) and the metal’s thickness — drawing defaults; the sizes are one measured museum pair, not a standard for modern pairs.', dims: ['domeD', 'thick'] },
    { text: 'The held height (1150 mm), the drop (60 mm), the dancer’s hand height (1550 mm), the dance envelope (r 700 mm, 2050 mm high) and the 3 m route — drawing defaults the owner checks.', dims: ['holdH', 'drop', 'danceH', 'danceR', 'danceTop', 'route'] },
    { text: 'The 30–60 cm starting range and the wider dance views are the lesson’s own trials; the one published number is a general 30 cm floor for percussion. A wearable mic is not a default (the lesson).', dims: [] },
  ],
  live: {
    wedges: [
      { id: 'wedge', label: 'a floor wedge downstage, facing back toward the player', short: 'WEDGE', p: { x: 1600, y: 0, z: 350 }, lift: 150, faces: { x: -1, y: 0, z: -0.2 }, note: 'On the audience side, behind a mic that faces the cymbals — the case a pattern’s null can help with.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
      { id: 'side', label: 'a side-fill monitor across the stage', short: 'SIDE FILL', p: { x: 300, y: 0, z: 1700 }, lift: 150, faces: { x: 0, y: 0, z: -1 }, note: 'Off to the player’s right, roughly beside the mic’s front: no pattern’s null reaches it. Distance and level do the work.', prov: { kind: 'illustrative', reason: 'a typical stage layout' } },
    ],
  },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. There is no single agreed finger-cymbal miking standard: these starting points come from how microphones behave and a general 30 cm floor for percussion, and every pair, player, dance and room is different. Move the mic, experiment, and trust your ears. The lab is silent and draws a simplified picture: one measured pair, a standing player or a dancer on a straight route, the plate’s shapes on a flat disc held at its centre, motion drawn larger, mic patterns as textbook shapes. Distances are rounded to about 5 mm and measured to the mic’s front. Keep clear of the hands and the route.',
  copy: { words: metalWords('finger cymbals', 'player') },
};
