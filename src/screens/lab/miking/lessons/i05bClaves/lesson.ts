/**
 * I05b CLAVES — the lesson's pages as DATA (blueprint §7). Words from the
 * owner's lesson (docs/labs/miking/source_text/Claves-Miking-Technique-
 * Research.txt, "L<n>" in COMMENTS only) with the fixes in CORRECTIONS_LOG.md
 * (CV-xx) applied. OWNER RULING 2026-10-04: starting points; no source,
 * brand or model in learner text; no badges; FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, PageContent, PageId, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, cardioidNull, CLEAR_REASON, contactSymptom, feedbackSymptom, firstNotch, gainCheck, hearingCheck, louderIsNotBetter, monoSymptom, moveRemovesDelay, noPhantom, PEAK_REASON, polarityKeepsDelay, POWER_REASON, quickHearing, setupOrder, slowMeter, TECH_REASON, type SpWords } from '../shared/smallperc/commonItems.ts';
import type { SpLesson } from '../shared/smallperc/family.ts';
import { STAGE_THINGS, stageItems, standingWedges } from '../shared/smallperc/stage.ts';
import { CLV_MODEL } from './geometry.ts';
import { CLV_ZONES } from './model.ts';
import { CLV_COPY } from './copy.ts';

const W: SpWords = { p: 'clv', the: 'the claves', a: 'a pair of claves', noun: 'clave', player: 'player', loudest: 'the strongest accent' };

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the claves',
    goal: 'Get to know the claves — two sticks of hard wood, one supported and one striking — where you meet them, what they do and how they are held, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Two struck sticks of wood: one cradled so it can ring, one striking its middle. The grip is part of the sound.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a strike becomes sound — the clave bending in its lowest shape, its still points, the hollow under it — and what a squeezed grip does. Shown, never played.',
    credit: { scenarios: ['clv.snd.1', 'clv.snd.2', 'clv.snd.3'], interactive: 'soundPath', note: 'Step the strike through to the end (or play it once), and answer the three checks.' },
    takeaway: 'A click at the strike, then a short woody ring — if the supported clave is able to bend. Supported near its still points, it rings; squeezed into the palm, it is choked.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the clave player stands, what is around them, what a stage and a studio add — and what to do before any mic.',
    credit: { scenarios: ['clv.set.1', 'clv.set.hear', 'clv.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Check the grip first, watch the real groove, never place a mic between the sticks. Protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the claves by its properties — pattern, power, size and how it handles brief peaks — not by its brand.',
    credit: { scenarios: ['clv.mic.1', 'clv.mic.peak', 'clv.mic.power', 'clv.mic.omni', 'clv.rec.1'], note: 'Answer the five checks (one reaches back to how the claves sound).' },
    takeaway: 'A small condenser can show the short decay; a dynamic can also suit. A cardioid helps against room and neighbours; an omni only in a quiet, good room.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — about 30–60 cm from the middle of the striking area — outside both hands’ paths, and see what each spot changes.',
    credit: { scenarios: ['clv.place.1', 'clv.place.2', 'clv.place.3', 'clv.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'One mic in front of the striking area, 30–60 cm away, never between the sticks. A mono mic usually serves one player and one pair.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s real rejection faces a loud unwanted source — and know when the claves cannot be separated.',
    credit: { scenarios: ['clv.ctx.1', 'clv.ctx.2', 'clv.ctx.studio', 'clv.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the downstage wedge sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Aim nulls by the real pattern. More channel level lifts the spill too; move, lower the stage, choose a projecting pair — or say it cannot be done.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See how a clave spot and a main mic interact — arrival times, comb-filter notches, and what polarity does and does not change.',
    credit: { scenarios: ['clv.two.1', 'clv.two.2', 'clv.two.3', 'clv.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'The same strike arrives at two mics at different times. Polarity flips the sign; it does not remove a delay. Judge in mono.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the grip and the pair first — then distance, the striking area’s motion, spill and the monitors — before gain or EQ.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two briefs, and say what would justify a second mic.',
    credit: { scenarios: ['clv.prac.order', 'clv.prac.gain', 'clv.prac.setup1', 'clv.prac.setup2', 'clv.prac.3', 'clv.mix.1', 'clv.mix.2', 'clv.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'The supported resonator and the striker named, a mic outside both hands, acoustic damping told apart from mic placement, and the live trade-off explained. More than one setup can pass.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L8-L12 · set L8-L11, L44-L46 · mic L35-L38 ·
 * place L14-L22 · ctx L34-L40 · two L31 · prac L48-L58. */
const scenarios: MikingScenario[] = [
  {
    id: 'clv.snd.1',
    page: 'sound',
    prompt: 'Why is the supported clave struck in its middle?',
    options: ['The middle swings most in its lowest bending shape', 'The middle is where the wood is at its very thickest', 'The middle is farthest from the player’s supporting fingers'],
    correct: 'The middle swings most in its lowest bending shape',
    explain: 'An unclamped bar’s lowest shape moves most at its middle (and ends) and stays put at two points about a fifth of the way in — a strike there drives the ring strongly.',
    why: {
      'The middle is where the wood is at its very thickest': 'A clave is a uniform rod; the shape of its bending is the reason.',
      'The middle is farthest from the player’s supporting fingers': 'The fingers support it near its still points; the middle is where it swings most.',
    },
  },
  {
    id: 'clv.snd.2',
    page: 'sound',
    prompt: 'The supported clave is squeezed into the palm. What happens to the sound?',
    options: ['The ring is choked: a dead, short tick', 'Nothing: the wood rings the same whatever the grip', 'A longer ring, because the palm adds a chamber'],
    correct: 'The ring is choked: a dead, short tick',
    explain: 'Pressed along its length, the clave cannot bend freely; cradled over curled fingers, it rings and the hollow rings with it.',
    why: {
      'Nothing: the wood rings the same whatever the grip': 'The grip decides whether it can bend; squeezed, it is damped.',
      'A longer ring, because the palm adds a chamber': 'The chamber comes from curled fingers under a loosely cradled clave, not from pressing it in.',
    },
  },
  {
    id: 'clv.snd.3',
    page: 'sound',
    prompt: 'What does the hand’s hollow under the supported clave do?',
    options: ['It acts as a small resonating chamber for the clave', 'It catches the striker if the player misses the clave', 'It hides the clave from the mic for a softer sound'],
    correct: 'It acts as a small resonating chamber for the clave',
    explain: 'The fingers are curled to make a resonating chamber and to support the clave — part of the woody body of the sound.',
    why: {
      'It catches the striker if the player misses the clave': 'It is there for the sound and the support, not as a catch.',
      'It hides the clave from the mic for a softer sound': 'It adds resonance; the mic still hears the clave.',
    },
  },
  {
    id: 'clv.set.1',
    page: 'setting',
    prompt: 'Before you place a claves mic, what do you ask for?',
    options: ['The real groove, light and strong, with both hands in view', 'One loud strike, so that the gain can be set from it alone', 'A slower tempo, so the mic hears each separate strike clearly'],
    correct: 'The real groove, light and strong, with both hands in view',
    explain: 'Watch where the supported clave stays, where the striking hand goes, and how the player changes position — not one demonstration hit.',
    why: {
      'One loud strike, so that the gain can be set from it alone': 'One hit hides the groove and the hand’s path; gain needs the strongest real accent.',
      'A slower tempo, so the mic hears each separate strike clearly': 'The music sets the tempo; place the mic for it.',
    },
  },
  hearingCheck(W),
  {
    id: 'clv.set.2',
    page: 'setting',
    prompt: 'Where must the mic never go?',
    options: ['Between the two claves, in the striker’s path', 'In front of the player, facing the striking area', 'Slightly above the striking area, angled down at it'],
    correct: 'Between the two claves, in the striker’s path',
    explain: 'A miss or a follow-through could strike a mic between the sticks — or the player’s hand.',
    why: {
      'In front of the player, facing the striking area': 'That is the recommended start, outside both hands.',
      'Slightly above the striking area, angled down at it': 'Above and in front is a fair alternative, clear of the striker.',
    },
  },
  {
    id: 'clv.mic.1',
    page: 'microphone',
    prompt: 'A sharp click with little wood: what do you compare first?',
    options: ['The grip and the pair — then a little more distance', 'A brighter condenser, closer, for a cleaner click', 'A treble cut on the desk, keeping the mic where it is'],
    correct: 'The grip and the pair — then a little more distance',
    explain: 'Compare the player’s grip and a different pair first, then modestly more distance or another safe angle.',
    why: {
      'A brighter condenser, closer, for a cleaner click': 'Closer and brighter makes the click dominate more.',
      'A treble cut on the desk, keeping the mic where it is': 'EQ cannot add the wood the grip or the pair took away.',
    },
  },
  slowMeter(W),
  noPhantom(W),
  {
    id: 'clv.mic.omni',
    page: 'microphone',
    prompt: 'When could an omni be tried for the claves?',
    options: ['A quiet, good-sounding room, where broad pickup helps', 'A loud stage, so that both hands are heard equally well', 'Not on claves: an omni has no front to aim at them'],
    correct: 'A quiet, good-sounding room, where broad pickup helps',
    explain: 'A cardioid helps when room noise or other instruments must be rejected; an omni may be tried in a quiet, suitable room.',
    why: {
      'A loud stage, so that both hands are heard equally well': 'On a loud stage an omni hears the monitors and band equally too.',
      'Not on claves: an omni has no front to aim at them': 'Too strong: in a quiet room an omni can sound natural.',
    },
  },
  {
    id: 'clv.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic very close to a squeezed pair. What does it hear?',
    options: ['A louder version of the same choked tick', 'The full ring, because closeness restores it', 'Mostly the room, since the claves are muted'],
    correct: 'A louder version of the same choked tick',
    explain: 'A mic very near a muffled pair mostly gives a louder version of a muffled pair: the resonance is lost at the source.',
    why: {
      'The full ring, because closeness restores it': 'Closeness cannot restore a resonance the grip removed.',
      'Mostly the room, since the claves are muted': 'Close up, the claves still dominate — choked as they are.',
    },
  },
  {
    id: 'clv.place.1',
    page: 'placement',
    prompt: 'A starting point says about 30–60 cm. Measured from where?',
    options: ['The middle of the normal striking area', 'The striker’s hand, wherever it happens to be', 'The far end of the supported clave'],
    correct: 'The middle of the normal striking area',
    explain: 'The distance is from the centre of the striking area; the striker’s whole path sets the clearance, read separately.',
    why: {
      'The striker’s hand, wherever it happens to be': 'The hand moves; the striking area is the reference.',
      'The far end of the supported clave': 'The sound starts at the strike, in the middle.',
    },
  },
  {
    id: 'clv.place.2',
    page: 'placement',
    prompt: 'The level jumps as the player moves. What do you try?',
    options: ['Aim at the whole working zone, or move back a little', 'A compressor set fast to even out each strike', 'Ask the player to keep both hands still while playing'],
    correct: 'Aim at the whole working zone, or move back a little',
    explain: 'If the striking area moves toward and away from the capsule, aim at the complete working zone or step back modestly.',
    why: {
      'A compressor set fast to even out each strike': 'Processing hides the placement cause.',
      'Ask the player to keep both hands still while playing': 'The player’s motion is the music; place the mic for it.',
    },
  },
  {
    id: 'clv.place.3',
    page: 'placement',
    prompt: 'From a mic farther back, what tends to change?',
    options: ['Click and body cohere, with more room and spill', 'The click gets sharper as the room gets quieter', 'Nothing: distance does not change a clave'],
    correct: 'Click and body cohere, with more room and spill',
    explain: 'Close placement favours direct sound; moving away lets strike and body cohere — at the cost of more room and competing sound.',
    why: {
      'The click gets sharper as the room gets quieter': 'Farther brings more room, not less.',
      'Nothing: distance does not change a clave': 'Distance changes the direct-to-room balance.',
    },
  },
  {
    id: 'clv.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · The player switches to the squeezed grip for a section. What does the mic need?',
    options: ['A recheck: the sound itself has changed', 'Nothing: the mic hears the claves the same way', 'A closer position, to bring the ring back'],
    correct: 'A recheck: the sound itself has changed',
    explain: 'If the performer changes the grip, the angle or distance may need reassessment — but no position restores the choked ring.',
    why: {
      'Nothing: the mic hears the claves the same way': 'The source changed; what the mic hears changed with it.',
      'A closer position, to bring the ring back': 'Closer cannot restore a resonance the grip removed.',
    },
  },
  {
    id: 'clv.ctx.1',
    page: 'context',
    prompt: 'Nearby cymbals dominate the clave channel live. Is more gain the answer?',
    options: ['No — it raises the cymbals too; change geometry first', 'Yes — a little more gain brings the claves above them', 'Yes, combined with a bright EQ boost on the claves'],
    correct: 'No — it raises the cymbals too; change geometry first',
    explain: 'Move the performer or the mic, lower the stage, or choose a more projecting pair — and if separation is impossible, say so.',
    why: {
      'Yes — a little more gain brings the claves above them': 'The channel carries the cymbals too; they rise with it.',
      'Yes, combined with a bright EQ boost on the claves': 'A boost lifts the cymbals’ highs in the same channel.',
    },
  },
  {
    id: 'clv.ctx.2',
    page: 'context',
    prompt: 'A singer plays claves. Will a separate claves channel take the click out of the vocal mic?',
    options: ['No — the vocal mic still hears the click', 'Yes — the claves mic draws the click away', 'Yes, if the claves mic is turned up enough'],
    correct: 'No — the vocal mic still hears the click',
    explain: 'Check how much click enters the vocal mic; a second channel does not remove that spill.',
    why: {
      'Yes — the claves mic draws the click away': 'No mic removes sound from another mic.',
      'Yes, if the claves mic is turned up enough': 'Turning it up adds click; the vocal spill stays.',
    },
  },
  {
    id: 'clv.ctx.studio',
    page: 'context',
    prompt: 'A band records together in one room. When does the clave earn its own spot?',
    options: ['When it needs its own level the main mic cannot give', 'As a habit, so it can be raised in the mix later on', 'When the clave is the loudest instrument in the room'],
    correct: 'When it needs its own level the main mic cannot give',
    explain: 'Begin with the main or percussion-area mic; if it gives a balanced pulse, a spot may be unnecessary.',
    why: {
      'As a habit, so it can be raised in the mix later on': 'An unneeded spot doubles the click with a delay.',
      'When the clave is the loudest instrument in the room': 'Loudness is not the test; what the main mic misses is.',
    },
  },
  {
    id: 'clv.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · A clave mic placed between the sticks. What is the first problem?',
    options: ['A miss or follow-through can strike the mic', 'The click becomes too dull to hear clearly', 'The mic hears only the supported clave, not the striker'],
    correct: 'A miss or follow-through can strike the mic',
    explain: 'Between the sticks is in the striker’s path: the player’s hand and the mic are both at risk.',
    why: {
      'The click becomes too dull to hear clearly': 'The sound would be loud and close; the danger is the strike.',
      'The mic hears only the supported clave, not the striker': 'It would hear both — if it survived the first miss.',
    },
  },
  polarityKeepsDelay(W),
  firstNotch(W),
  {
    id: 'clv.two.3',
    page: 'twoMic',
    prompt: 'A clave spot and the main mic sound hollow together. What do you check?',
    options: ['Both together in mono, at the intended levels', 'Only the spot, soloed, at a high listening level', 'Only the main mic, since it hears the room'],
    correct: 'Both together in mono, at the intended levels',
    explain: 'The same strike arrives at different times; listen together and in mono, and adjust position, balance or the need for the spot.',
    why: {
      'Only the spot, soloed, at a high listening level': 'Soloed, the spot hides how it combines.',
      'Only the main mic, since it hears the room': 'The combination is the question.',
    },
  },
  louderIsNotBetter(W),
  gainCheck(W),
  {
    id: 'clv.prac.3',
    page: 'practice',
    prompt: 'What would justify a second clave mic?',
    options: ['A spread ensemble of players, not one pair', 'Each stick of the pair needs its own mic', 'The claves need more level than one mic gives'],
    correct: 'A spread ensemble of players, not one pair',
    explain: 'One mono mic usually serves one player and pair; several players spread out are a different source size — an area mic, or spots where control demands it.',
    why: {
      'Each stick of the pair needs its own mic': 'The pair sounds together; one mic serves it.',
      'The claves need more level than one mic gives': 'Level comes from gain, not another mic.',
    },
  },
  {
    id: 'clv.mix.1',
    page: 'practice',
    prompt: 'A starting point says “about 30–60 cm”. What else do you need before placing the mic?',
    options: ['Both hands’ paths, and where the strike happens', 'The claves’ brand, so the number fits their size', 'Nothing more: the number already says where it goes'],
    correct: 'Both hands’ paths, and where the strike happens',
    explain: 'The distance is from the striking area; the mic must clear both hands, and its aim sets the balance.',
    why: {
      'The claves’ brand, so the number fits their size': 'The brand does not change the reference or the motion.',
      'Nothing more: the number already says where it goes': 'A distance means nothing without the motion and the aim.',
    },
  },
  cardioidNull(W),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  {
    id: 'clv.s.dead',
    observation: 'A dead, short tick',
    firstChecks: 'Is the supported clave pressed against the palm, or held by too many fingers?',
    options: ['The grip: a less muffled, cradled support', 'Move the mic much closer to the claves', 'A long reverb to give the claves a longer tail'],
    correct: 'The grip: a less muffled, cradled support',
    explain: 'Have the player audition their usual, less muffled support — then reassess the mic.',
    why: {
      'Move the mic much closer to the claves': 'Closer gives a louder choked tick.',
      'A long reverb to give the claves a longer tail': 'Processing cannot restore the wood’s own ring.',
    },
  },
  {
    id: 'clv.s.click',
    observation: 'The click overwhelms the body',
    firstChecks: 'An extremely close mic, or a sharp pair or strike?',
    options: ['The pair, the grip, then a little more distance', 'A deep treble cut on the clave channel’s EQ', 'Ask the player to strike much more softly'],
    correct: 'The pair, the grip, then a little more distance',
    explain: 'Compare the source and the grip, then a little more distance or a safe angle.',
    why: {
      'A deep treble cut on the clave channel’s EQ': 'EQ dulls the click without adding body.',
      'Ask the player to strike much more softly': 'The strokes are the music; change the pair or the mic.',
    },
  },
  {
    id: 'clv.s.level',
    observation: 'Inconsistent level from stroke to stroke',
    firstChecks: 'Does the striking area move toward and away from the capsule?',
    options: ['Whether the striking area moves toward the mic', 'The cable, since level jumps like this are electrical', 'A compressor set before watching the player'],
    correct: 'Whether the striking area moves toward the mic',
    explain: 'Aim at the complete working zone or move back modestly.',
    why: {
      'The cable, since level jumps like this are electrical': 'Watch the player first.',
      'A compressor set before watching the player': 'Processing hides the cause.',
    },
  },
  {
    id: 'clv.s.spill',
    observation: 'Cymbal or snare dominates the clave channel',
    firstChecks: 'Is the direct clave sound too low against the neighbours?',
    options: ['The player’s and the mic’s position, and the pattern', 'More gain on the clave channel until it wins', 'A gate set to open only on the clave strikes'],
    correct: 'The player’s and the mic’s position, and the pattern',
    explain: 'Move the player or the mic and use the pattern’s rejection; test with the full band.',
    why: {
      'More gain on the clave channel until it wins': 'Gain raises the spill with the claves.',
      'A gate set to open only on the clave strikes': 'The spill rides in with each click; fix the geometry.',
    },
  },
  feedbackSymptom(W),
  monoSymptom(W),
  contactSymptom(W),
];

const DOC = { id: 'r.doc', label: 'It starts about 30–60 cm from the middle of the striking area, never between the sticks', role: 'required' as const, feedback: 'Say what it is measured from — and where it must not go.' };

const setupTasks: SetupTask[] = [
  {
    id: 'clv.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A quiet studio overdub: one player, one pair of claves, a pleasant room. Phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser about 40 cm in front of the striking area, aimed at it', ok: true, power: 'phantom', feedback: 'The recommended start, outside both hands; it needs the phantom this channel has.' },
      { id: 'b', label: 'Small dynamic about 45 cm away, a little higher, angled down', ok: true, power: 'none', feedback: 'Also fair: a different balance — and a dynamic needs no power.' },
      { id: 'c', label: 'A mic between the two claves, close to the strike', ok: false, power: 'phantom', feedback: 'In the striker’s path: a miss would hit the mic or the hand.' },
      { id: 'd', label: 'Ask the player to grip the supported clave firmly for control', ok: false, power: 'none', feedback: 'A firm grip chokes the ring; the grip is the player’s.' },
      { id: 'e', label: 'A clip-on mic taped to the supported clave', ok: false, power: 'phantom', feedback: 'Nothing on a handheld clave without a purpose-built, safe setup — and it would damp it.' },
    ],
    reasons: [DOC, CLEAR_REASON, POWER_REASON, PEAK_REASON, BRAND_REASON, TECH_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a start from the striking area, outside both hands, power that matches the mic.',
  },
  {
    id: 'clv.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud live show: claves at a percussion station near the drum kit, wedges on stage. The spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'A small dynamic near the station, aimed at the striking area, a null toward the wedge', ok: true, power: 'none', feedback: 'A directional spot close enough for useful direct sound, outside the striker; a dynamic needs no phantom.' },
      { id: 'b', label: 'The station’s shared percussion mic, if positions and levels suit', ok: true, power: 'none', feedback: 'Fair if it carries the pulse: fewer open mics.' },
      { id: 'c', label: 'A small condenser on the claves', ok: false, power: 'phantom', feedback: 'This input has no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'An omni between the drum kit and the player', ok: false, power: 'none', feedback: 'An omni there hears the kit and the wedges as much as the claves.' },
      { id: 'e', label: 'Turn the clave channel up until it beats the cymbals', ok: false, power: 'none', feedback: 'More gain raises the cymbals and the feedback risk too.' },
    ],
    reasons: [{ id: 'r.doc', label: 'It covers the striking area from outside both hands’ paths', role: 'required', feedback: 'Say what it covers and how it stays clear.' }, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'Fewer open mics keep spill and feedback down', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, TECH_REASON],
    explain: 'Two setups pass. What passes is the reasoning: the striking area covered safely and power the input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: where will the struck clave move least?', options: ['A little way in from each end', 'At its exact middle', 'At its two very ends'], after: 'Now STEP through the strike (or PLAY ONCE) and watch the blue still points.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: from 30 cm to 60 cm away — what grows?', options: ['The room and the spill', 'The click', 'Nothing'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge sits behind the mic and off to one side. Can a cardioid’s null reach it?', options: ['Yes — with a tilt of the mic', 'No — only a tighter pattern’s null can', 'It is already in the null'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'clv.q.1',
    covers: 'instrument',
    prompt: 'How is the supported clave held?',
    options: ['Cradled over curled fingers, able to ring', 'Squeezed firmly into the palm for control', 'Pinched at one end between finger and thumb'],
    correct: 'Cradled over curled fingers, able to ring',
    explain: 'Cradled, not squeezed into the palm: the fingers support it and make a resonating chamber.',
    why: {
      'Squeezed firmly into the palm for control': 'Squeezed, it is choked.',
      'Pinched at one end between finger and thumb': 'It rests across the curled fingers.',
    },
  },
  {
    id: 'clv.q.2',
    covers: 'instrument',
    prompt: '“Clave” names two things. Which does this lesson mic?',
    options: ['The pair of wooden sticks, the instrument', 'The rhythmic pattern that organises the music', 'Both — the pattern decides the placement'],
    correct: 'The pair of wooden sticks, the instrument',
    explain: 'Clave is also a rhythmic pattern; this lesson is about picking up the instrument.',
    why: {
      'The rhythmic pattern that organises the music': 'The pattern belongs in a music lesson; here, the instrument.',
      'Both — the pattern decides the placement': 'The instrument and its motion decide the placement.',
    },
  },
  {
    id: 'clv.q.3',
    covers: 'sound',
    prompt: 'Why does a cradled clave ring and a squeezed one tick?',
    options: ['Cradled, it can bend freely; squeezed, it is damped', 'Cradled, the striker hits harder; squeezed, it hits softer', 'Cradled, the wood is warmer from the hand'],
    correct: 'Cradled, it can bend freely; squeezed, it is damped',
    explain: 'Supported near its still points, the clave bends and rings; pressed along its length, it cannot.',
    why: {
      'Cradled, the striker hits harder; squeezed, it hits softer': 'The strike can be the same; the support decides the ring.',
      'Cradled, the wood is warmer from the hand': 'Warmth plays no part; unhindered bending does.',
    },
  },
  {
    id: 'clv.q.4',
    covers: 'sound',
    prompt: 'Where is the supported clave struck — and why?',
    options: ['The middle, where its lowest shape swings most', 'Near one end, so the strike reaches its still points', 'Anywhere: a clave sounds the same everywhere'],
    correct: 'The middle, where its lowest shape swings most',
    explain: 'The middle swings most in the lowest bending shape: the strike drives it well.',
    why: {
      'Near one end, so the strike reaches its still points': 'Striking a still point drives that shape least.',
      'Anywhere: a clave sounds the same everywhere': 'Where it is struck changes what rings.',
    },
  },
  {
    id: 'clv.q.5',
    covers: 'setting',
    prompt: 'Where is the one place a clave mic must not go?',
    options: ['Between the two sticks, in the striker’s path', 'Slightly above the striking area, angled down at it', 'In front of the player, aimed at the strike'],
    correct: 'Between the two sticks, in the striker’s path',
    explain: 'A miss or follow-through could strike a mic there, or the player’s hand.',
    why: {
      'Slightly above the striking area, angled down at it': 'Above and in front is fair, clear of the striker.',
      'In front of the player, aimed at the strike': 'That is the recommended start.',
    },
  },
  quickHearing(W),
];

export const I05B_LESSON: SpLesson = {
  id: 'I05b',
  labId: 'percussion',
  title: 'Claves',
  subtitle: 'Two sticks of wood: cradled to ring, never a mic between them',
  noun: { one: 'pair of claves', many: 'claves' },
  model: CLV_MODEL,
  micTypeIds: ['orchSdc', 'smallDynCard'],
  zones: CLV_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    setupOrder(W, { text: 'Check the grip; watch the real groove and both hands’ paths', early: 'Start with the player, the grip and the music.' }, { text: 'Hear whether the main or percussion mic already carries the pulse', early: 'Hear what the existing mics give before you add one.' }),
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Two cylindrical sticks of hard wood that make a clear, resonant sound when struck together: one supported, one striking — idiophones. (Clave is also a rhythm; this lesson is about the instrument.)', src: 'PAS-ECV02' },
    { title: 'WHERE YOU MEET IT', text: 'In Latin and Afro-Caribbean music, at percussion stations, in ensembles — sometimes in a singer’s hands.', src: 'LESSON-CLAVES' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'A short, cutting pulse: a fast click and a short woody ring. Solid and hollowed pairs differ in pitch character; the grip decides whether it rings at all.', src: 'MEINL-CL1' },
    { title: 'ITS SIZE', text: 'This lab draws a pair 20 cm long and 2.5 cm across — a drawing; no maker prints a size.', src: 'LESSON-CLAVES' },
  ],
  sound: {
    stages: [
      { title: 'The striker strikes', text: 'The edge of the striking clave strikes the middle of the supported one: a fast click — the ATTACK.' },
      { title: 'The clave bends', text: 'The supported clave bends in its lowest shape — its middle and ends swing, two still points about a fifth of the way in from each end stay put. Drawn much larger than it moves.' },
      { title: 'The hollow rings with it', text: 'Supported near its still points, it rings on; the hollow of the curled fingers beneath it rings with it.' },
      { title: 'Sound leaves', text: 'From the clave and the hollow: a click, then a short woody ring — the BODY. The striker rings a little too.' },
    ],
    attack: 'The striker’s edge meeting the middle of the supported clave: a fast, sharp click.',
    body: 'A short, woody ring from the supported clave and the hollow under it — present only when it is able to bend. Tendencies — pairs, grips and players vary.',
    head: { diameterMm: 25, rods: 0, label: 'the clave', strikeSrc: 'PAS-ECV02' },
  },
  setting: {
    items: [
      { id: 'claves', label: 'the clave player at the station', short: 'CLAVES', note: 'At a percussion station, both hands in use. The drawing every page of this lesson uses.', prov: { kind: 'illustrative', reason: 'a typical station layout; no source gives positions' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'perc', label: 'other percussion at the station', short: 'PERCUSSION', note: 'Hand drums and a cymbal: the player may switch between them; a shared mic may serve if positions and levels suit.', prov: { kind: 'illustrative', reason: 'a typical station layout' }, tag: 'STATIONS', scene: 'kit' },
      { id: 'kit', label: 'the drum kit', short: 'DRUM KIT', note: 'Cymbals and snare a few metres away: raising the clave channel raises them too.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'amp', label: 'a guitar amp', short: 'AMP', note: 'Loud upstage: aim the clave mic’s rejection toward it where you can.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'vocal', label: 'a singer’s microphone', short: 'VOCAL MIC', note: 'If the player sings, the vocal mic hears the click — a second channel does not remove it.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'ANOTHER MIC', scene: 'kit' },
      ...stageItems('the claves', 'An ensemble, main or percussion-area mic may already give a balanced clave pulse; a spot is added only for its own level.'),
    ],
    stage: 'LIVE: a predictable station, a directional stand mic near it, outside both hands, its rejection toward the wedges — checked against the full band.',
    studio: 'RECORDING: the pair and the articulation first; a moderate-distance spot compared with a closer safe one at matched level; one mono mic usually serves.',
  },
  diagnostic,
  practice: {
    task: 'Name the supported resonator and the striker, secure a mic outside both hands’ full movement, tell acoustic damping from mic placement, and explain the live trade-off between more direct sound and the player’s clearance. With a real pair and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'pair', label: 'Pair (solid or hollowed)', kind: 'text' },
      { id: 'grip', label: 'Grip', kind: 'choice', choices: ['cradled', 'squeezed', 'mixed'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser', 'dynamic', 'area mic only', 'other'] },
      { id: 'dist', label: 'Distances you tried (about 30 and 60 cm)', kind: 'text' },
      { id: 'clear', label: 'The striker’s closest approach', kind: 'text' },
      { id: 'notes', label: 'What you heard (click, body, room, bleed)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The claves’ size (Ø 25 × 200 mm) and the striker’s arc (±25° about the wrist, 150 mm) — drawing defaults; the grip is drawn as the published grip describes it.', dims: ['len', 'd', 'arc'] },
    { text: 'The playing height and the player’s posture: ILLUSTRATIVE; no height is shown.', dims: [] },
    { text: 'HOW IT SOUNDS draws an ideal uniform unclamped bar’s lowest bending shape; a real clave’s grain, taper and hand contact shift it.', dims: [] },
  ],
  live: { wedges: standingWedges('the claves') },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every pair, grip, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a pair of claves in two constructions, an ideal unclamped bar’s bending shape, mic patterns and the two-mic comb as textbook shapes, and motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.',
  copy: CLV_COPY,
  sp: {
    strikeTitle: 'Strike to sound',
    close: { side: { u0: -360, u1: 260, v0: -1420, v1: -960 }, top: { u0: -360, u1: 260, v0: -320, v1: 320 } },
    plan: {
      box: { u0: -2600, u1: 2700, v0: -2100, v1: 2100 },
      things: [
        { id: 'claves', kind: 'drums', u: 0, v: 0, scene: 'all' },
        { id: 'perc', kind: 'perc', u: -250, v: 1050, scene: 'all' },
        { id: 'kit', kind: 'kit', u: -1500, v: -1350, scene: 'all' },
        { id: 'amp', kind: 'amp', u: -1900, v: 950, face: 0, scene: 'all' },
        { id: 'vocal', kind: 'micstand', u: 1100, v: -1350, scene: 'all' },
        ...STAGE_THINGS,
      ],
    },
  },
};
