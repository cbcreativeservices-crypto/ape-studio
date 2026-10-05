/**
 * I03b EGG SHAKER — the lesson's pages as DATA (blueprint §7). Words from the
 * owner's lesson (docs/labs/miking/source_text/Egg-Shaker-Miking-Technique-
 * Research.txt, "L<n>" in COMMENTS only) with the fixes in CORRECTIONS_LOG.md
 * (EG-xx) applied. OWNER RULING 2026-10-04: starting points; no source,
 * brand or model in learner text; no badges; FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, PageContent, PageId, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, cardioidNull, CLEAR_REASON, contactSymptom, feedbackSymptom, firstNotch, gainCheck, hearingCheck, louderIsNotBetter, monoSymptom, moveRemovesDelay, noPhantom, PEAK_REASON, polarityKeepsDelay, POWER_REASON, quickHearing, setupOrder, slowMeter, TECH_REASON, type SpWords } from '../shared/smallperc/commonItems.ts';
import type { SpLesson } from '../shared/smallperc/family.ts';
import { STAGE_THINGS, stageItems, standingWedges } from '../shared/smallperc/stage.ts';
import { EGG_MODEL } from './geometry.ts';
import { EGG_ZONES } from './model.ts';
import { EGG_COPY } from './copy.ts';

const W: SpWords = { p: 'egg', the: 'the egg', a: 'an egg', noun: 'egg', player: 'player', loudest: 'the loudest phrase' };

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the egg shaker',
    goal: 'Get to know the egg shaker — what it is, where you meet it, what it does in the music and how it is held — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A small closed shell with grains inside and no handle, held in the hand — one or two at a time. The grip is part of the instrument, and the egg chosen sets the level.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a stroke becomes sound inside the egg — the grains lagging, striking, rolling — and how the grip changes where it can leave. Shown, never played.',
    credit: { scenarios: ['egg.snd.1', 'egg.snd.2', 'egg.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The grains lag the shell and strike it when the stroke turns — the attack — and roll along it — the wash. A palm over the shell shields and damps part of it.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the egg player stands, what is around them, what a stage and a studio add — and what to do before any mic.',
    credit: { scenarios: ['egg.set.1', 'egg.set.hear', 'egg.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Choose the egg before the mic, watch both hands and the real grip, and keep small loose parts safe. Protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for egg shakers by its properties — pattern, power, size and how it handles brief peaks — not by its brand.',
    credit: { scenarios: ['egg.mic.1', 'egg.mic.peak', 'egg.mic.power', 'egg.mic.omni', 'egg.rec.1'], note: 'Answer the five checks (one reaches back to how the egg sounds).' },
    takeaway: 'Condensers and dynamics can both work; the pattern, the position and the real stage matter more than a reputation. Tell a quiet source from a gain problem.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — about 30–60 cm from the middle of the playing area — then try one egg, two eggs close together and two hands apart, and see what changes.',
    credit: { scenarios: ['egg.place.1', 'egg.place.2', 'egg.place.3', 'egg.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'One mic outside the motion, about 30–60 cm from the middle of the playing area. Two eggs close together: one mic between them. Hands wide apart: perhaps one each — if the arrangement needs it.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s real rejection faces a loud unwanted source — and know when the egg itself is the limit.',
    credit: { scenarios: ['egg.ctx.1', 'egg.ctx.2', 'egg.ctx.studio', 'egg.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the downstage wedge sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Aim nulls by the real pattern. A quiet egg against a loud band is a source problem first: a louder egg, a better spot, a quieter stage — not more gain.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See how two mics on two hands interact — the arrival-time difference, comb-filter notches, and what polarity does and does not change.',
    credit: { scenarios: ['egg.two.1', 'egg.two.2', 'egg.two.3', 'egg.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two spots give control and add spill and a changing delay. Polarity flips the sign; it does not remove a delay. A balanced single mic remains a valid choice.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — a hand coming close, a palm over the shell, the egg itself, spill and the monitors — before gain or EQ.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two briefs, and say what would justify a second mic.',
    credit: { scenarios: ['egg.prac.order', 'egg.prac.gain', 'egg.prac.setup1', 'egg.prac.setup2', 'egg.prac.3', 'egg.mix.1', 'egg.mix.2', 'egg.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'An egg chosen for the setting, the whole hand motion inside the pickup and clear of the stand, a one- or two-mic choice explained, and spill or feedback told apart from a plain gain shortage.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L8-L10 · set L11, L60 · mic L45-L47 ·
 * place L14-L24 · ctx L36-L41 · two L25-L29 · prac L54-L59. */
const scenarios: MikingScenario[] = [
  {
    id: 'egg.snd.1',
    page: 'sound',
    prompt: 'What makes the attack of an egg shaker?',
    options: ['The grains striking the shell when a stroke turns', 'The player’s fingers tapping the outside of the shell', 'Air squeezed out through tiny holes in the shell'],
    correct: 'The grains striking the shell when a stroke turns',
    explain: 'The grains lag the shell; when the stroke turns they keep going and strike its inside — a burst of tiny impacts. Rolling along it gives the wash.',
    why: {
      'The player’s fingers tapping the outside of the shell': 'The fingers hold it; the sound comes from the grains inside.',
      'Air squeezed out through tiny holes in the shell': 'An egg is closed; the grains striking the shell make the sound.',
    },
  },
  {
    id: 'egg.snd.2',
    page: 'sound',
    prompt: 'The player cups the palm over the egg. What can change at a mic on that side?',
    options: ['Less of the egg, and a softer sound, on the covered side', 'Nothing: a palm cannot change how such a small egg sounds', 'More level, because the palm reflects the grains’ sound'],
    correct: 'Less of the egg, and a softer sound, on the covered side',
    explain: 'A palm can partly shield the shell and damp it: the covered side sends less to the mic, and the texture can soften.',
    why: {
      'Nothing: a palm cannot change how such a small egg sounds': 'A hand over a small shell covers a large part of it — the grip changes what leaves it.',
      'More level, because the palm reflects the grains’ sound': 'A soft palm damps more than it reflects; less leaves the covered side.',
    },
  },
  {
    id: 'egg.snd.3',
    page: 'sound',
    prompt: 'An egg sounds thin and quiet against the band. What is worth trying first?',
    options: ['A louder egg suited to the part, before more gain', 'A brighter mic, pushed in as close as the hand allows', 'A treble boost on the desk, with the same quiet egg'],
    correct: 'A louder egg suited to the part, before more gain',
    explain: 'Eggs come in softer and louder versions for different settings. Gain and EQ raise the spill and the noise with the egg.',
    why: {
      'A brighter mic, pushed in as close as the hand allows': 'Very close makes level jumps and handling noise worse — and the hand may reach the mic.',
      'A treble boost on the desk, with the same quiet egg': 'A boost lifts the spill and noise with the egg; the source is the limit.',
    },
  },
  {
    id: 'egg.set.1',
    page: 'setting',
    prompt: 'Before you place an egg mic, what do you ask the player to show you?',
    options: ['The whole part: both hands, the largest gesture, the real grip', 'One clean stroke, so that the level can be set from it alone', 'Nothing yet: put the mic up, then adjust the player'],
    correct: 'The whole part: both hands, the largest gesture, the real grip',
    explain: 'One egg or two, how far apart the hands go, how the palm covers the shell — all decide where a mic can go and what it hears.',
    why: {
      'One clean stroke, so that the level can be set from it alone': 'One stroke hides the second hand, the biggest gesture and the grip.',
      'Nothing yet: put the mic up, then adjust the player': 'Never adjust the player to fit a mic; place the mic for the player.',
    },
  },
  hearingCheck(W),
  {
    id: 'egg.set.2',
    page: 'setting',
    prompt: 'A cracked egg shaker is leaking grains. What do you do?',
    options: ['Retire it, and keep the loose grains away from children', 'Tape the crack and keep playing it, as it still sounds fine', 'Use it anyway, since the mic will hide the rattle of the crack'],
    correct: 'Retire it, and keep the loose grains away from children',
    explain: 'A damaged shell can spill its fill: retire it, and keep small loose parts away from children.',
    why: {
      'Tape the crack and keep playing it, as it still sounds fine': 'Tape can fail mid-song and spill the grains; retire the damaged egg.',
      'Use it anyway, since the mic will hide the rattle of the crack': 'A mic does not make a damaged instrument safe — or hide a crack’s rattle.',
    },
  },
  {
    id: 'egg.mic.1',
    page: 'microphone',
    prompt: 'The egg is clean but quiet; the spill is already fine. What do you change?',
    options: ['The preamp gain, with headroom, on a peak meter', 'The EQ, boosting the treble to bring the egg out', 'The mic, swapping to an omni to collect more sound'],
    correct: 'The preamp gain, with headroom, on a peak meter',
    explain: 'Tell a quiet source from a gain problem: if the direct signal is clean and the separation is fine, more gain is the right move.',
    why: {
      'The EQ, boosting the treble to bring the egg out': 'EQ changes the tone, not the level problem — and lifts the noise.',
      'The mic, swapping to an omni to collect more sound': 'An omni collects more of the room and the stage, not more egg.',
    },
  },
  slowMeter(W),
  noPhantom(W),
  {
    id: 'egg.mic.omni',
    page: 'microphone',
    prompt: 'Is an omni a good choice for an egg spot on a loud monitored stage?',
    options: ['Generally not: it hears the monitors and band as well', 'Yes: it covers the moving hands from all directions', 'Yes, if it is placed closer than a cardioid would be'],
    correct: 'Generally not: it hears the monitors and band as well',
    explain: 'An omni gives broad coverage and hears every loudspeaker equally — generally unsuitable for a loud monitored stage. In a quiet room it can be fine.',
    why: {
      'Yes: it covers the moving hands from all directions': 'It covers the hands — and the wedges and the band just as well.',
      'Yes, if it is placed closer than a cardioid would be': 'Closer helps a little, but an omni still has no rejection to aim at the monitors.',
    },
  },
  {
    id: 'egg.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A directional mic, very close to a moving egg. What can you expect?',
    options: ['Tone changes as the egg leaves its axis, and handling thumps', 'A steadier sound, since the egg now dominates the whole room', 'Nothing different from a mic placed farther back'],
    correct: 'Tone changes as the egg leaves its axis, and handling thumps',
    explain: 'Directional mics change tone off axis, and very close they exaggerate low-frequency handling sound (proximity effect).',
    why: {
      'A steadier sound, since the egg now dominates the whole room': 'Closer, each small movement is a big share of the distance: less steady.',
      'Nothing different from a mic placed farther back': 'Distance changes level steadiness, off-axis tone and handling noise.',
    },
  },
  {
    id: 'egg.place.1',
    page: 'placement',
    prompt: 'A starting point says about 30–60 cm. Measured from where?',
    options: ['The middle of the usual playing area — not the nearest stroke', 'The nearest point the egg reaches on its very biggest stroke', 'The player’s chest, wherever the egg happens to be'],
    correct: 'The middle of the usual playing area — not the nearest stroke',
    explain: 'The distance is to the centre of the motion. The nearest approach sets the clearance — and at 30 cm a hand may still come close.',
    why: {
      'The nearest point the egg reaches on its very biggest stroke': 'That point sets the clearance; the readout shows it separately.',
      'The player’s chest, wherever the egg happens to be': 'The egg is played in front of the chest; measure from where it is played.',
    },
  },
  {
    id: 'egg.place.2',
    page: 'placement',
    prompt: 'Two eggs, hands close together. Where does one mic start?',
    options: ['Aimed between them, far enough back to take in both', 'On one egg only — the other will be picked up anyway', 'Between the hands, as close as the eggs allow'],
    correct: 'Aimed between them, far enough back to take in both',
    explain: 'If both hands share a compact area, one mic aimed between their usual positions can take in both — compare hand to hand.',
    why: {
      'On one egg only — the other will be picked up anyway': 'The other egg arrives off axis and farther away: the balance suffers.',
      'Between the hands, as close as the eggs allow': 'Between moving hands, the mic is in the path — and every stroke jumps.',
    },
  },
  {
    id: 'egg.place.3',
    page: 'placement',
    prompt: 'The hands are wide apart, playing different parts. What is a fair option?',
    options: ['A spot per hand — then check both together in mono', 'One close mic on the left egg, with the gain pushed up', 'Ask the player to keep both hands together for the mic'],
    correct: 'A spot per hand — then check both together in mono',
    explain: 'Two spots give independent control, at the cost of stands, spill and a second arrival of each egg. A well-placed area mic is the other option.',
    why: {
      'One close mic on the left egg, with the gain pushed up': 'The right hand is far off axis; more gain lifts the spill too.',
      'Ask the player to keep both hands together for the mic': 'The arrangement sets the hands; place the mics for them.',
    },
  },
  {
    id: 'egg.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Your stand clears both eggs at rest. Is that enough?',
    options: ['No — it must clear both hands’ whole motion and the face', 'Yes — eggs are tiny, so a spot clear at rest is enough', 'Yes, provided the cable is taped down to the floor'],
    correct: 'No — it must clear both hands’ whole motion and the face',
    explain: 'The rest position says little: strokes and big gestures sweep far more space. Check the whole motion with the player.',
    why: {
      'Yes — eggs are tiny, so a spot clear at rest is enough': 'Tiny instrument, big motion: the arms and strokes sweep far more space.',
      'Yes, provided the cable is taped down to the floor': 'A taped cable is good practice; the stand must still clear the motion.',
    },
  },
  {
    id: 'egg.ctx.1',
    page: 'context',
    prompt: 'Live, the egg is buried once the band comes in. Turning its channel up does what?',
    options: ['Raises the spill and the feedback risk with the egg', 'Brings the egg forward, with nothing else in the mix changing', 'Makes the egg louder on stage for the player'],
    correct: 'Raises the spill and the feedback risk with the egg',
    explain: 'A weak egg in a loud setting cannot be rescued by its spot: the spot raises everything it hears. Move the source, choose a louder egg, or lower the stage.',
    why: {
      'Brings the egg forward, with nothing else in the mix changing': 'The channel also carries the cymbals and monitors; they rise with it.',
      'Makes the egg louder on stage for the player': 'The channel level does not change the acoustic egg; it raises what the mic hears.',
    },
  },
  {
    id: 'egg.ctx.2',
    page: 'context',
    prompt: 'Your spot is a hypercardioid. Where should the wedge go to use its rejection?',
    options: ['Off to the side of the rear, where its nulls point', 'Directly behind it, as you would for a cardioid', 'In front of it, beside the egg, out of the way'],
    correct: 'Off to the side of the rear, where its nulls point',
    explain: 'A hypercardioid has a rear lobe; its deepest rejection lies off to each side of the rear. Place the wedge by the real pattern.',
    why: {
      'Directly behind it, as you would for a cardioid': 'Straight behind sits in a hypercardioid’s rear lobe — it hears some of the wedge.',
      'In front of it, beside the egg, out of the way': 'In front is where the mic hears best: the wedge would feed straight in.',
    },
  },
  {
    id: 'egg.ctx.studio',
    page: 'context',
    prompt: 'A band records live in one room. When does the egg earn its own spot?',
    options: ['When the main or percussion mic misses it and it needs control', 'As a habit, so that it can be turned up in the mix later on', 'When the egg is the loudest instrument in the room'],
    correct: 'When the main or percussion mic misses it and it needs control',
    explain: 'Check what the main mics already capture; add a spot only for needed control — and listen to both together, in mono.',
    why: {
      'As a habit, so that it can be turned up in the mix later on': 'A spot that is not needed doubles the egg with a delay.',
      'When the egg is the loudest instrument in the room': 'An egg rarely is; the test is what the main mics miss.',
    },
  },
  {
    id: 'egg.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · The player changes to a cupped grip for the chorus. What might a fixed mic hear?',
    options: ['Less egg on the covered side, and a softer texture', 'The same: the grip changes nothing that reaches the mic', 'More low end, because the palm adds body'],
    correct: 'Less egg on the covered side, and a softer texture',
    explain: 'A palm over the shell shields and damps it. Check the mic with every grip the part uses.',
    why: {
      'The same: the grip changes nothing that reaches the mic': 'The grip changes what leaves the shell — and so what reaches the mic.',
      'More low end, because the palm adds body': 'A palm damps; it does not add body. Very close, handling thumps can sound like it.',
    },
  },
  polarityKeepsDelay(W),
  firstNotch(W),
  {
    id: 'egg.two.3',
    page: 'twoMic',
    prompt: 'You use one spot per hand. What does each mic also hear?',
    options: ['The other egg, a little later and quieter', 'Only its own egg, if both mics are cardioids', 'Nothing else, as long as the hands are apart'],
    correct: 'The other egg, a little later and quieter',
    explain: 'Each spot hears both eggs; the far one arrives later. Check the pair together, in mono, at the intended levels.',
    why: {
      'Only its own egg, if both mics are cardioids': 'A cardioid still hears from the side; the other egg reaches it later.',
      'Nothing else, as long as the hands are apart': 'Distance lowers the other egg; it does not remove it — or its delay.',
    },
  },
  louderIsNotBetter(W),
  gainCheck(W),
  {
    id: 'egg.prac.3',
    page: 'practice',
    prompt: 'What would justify a second mic for two eggs?',
    options: ['Hands far apart, or parts that need their own control', 'There are two eggs, so there should be two mics to match', 'The eggs need more level than one mic can give'],
    correct: 'Hands far apart, or parts that need their own control',
    explain: 'Decide from the arrangement and the movement, not the number of hands. A balanced single mic is still a valid choice.',
    why: {
      'There are two eggs, so there should be two mics to match': 'Two eggs often sit well in one mic; a second adds spill and delay.',
      'The eggs need more level than one mic can give': 'Level comes from gain — or a louder egg — not another mic.',
    },
  },
  {
    id: 'egg.mix.1',
    page: 'practice',
    prompt: 'A starting point says “about 30–60 cm”. What else do you need before placing the mic?',
    options: ['Where the hands actually move, and where to aim', 'The egg’s brand, so the number fits its size', 'Nothing more: the number already says where it goes'],
    correct: 'Where the hands actually move, and where to aim',
    explain: 'The distance is from the middle of the playing area; the mic must clear the whole motion, and its aim sets the balance.',
    why: {
      'The egg’s brand, so the number fits its size': 'The brand does not change the reference or the motion.',
      'Nothing more: the number already says where it goes': 'A distance means nothing without the motion and the aim.',
    },
  },
  cardioidNull(W),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  {
    id: 'egg.s.uneven',
    observation: 'Strokes are uneven in level',
    firstChecks: 'Does one hand or accent travel much closer to the mic?',
    options: ['Whether one hand or accent comes much closer', 'The cable, because level jumps are usually electrical', 'A compressor setting, before watching the player'],
    correct: 'Whether one hand or accent comes much closer',
    explain: 'Move back, recentre, or change the playing spot; listen to the whole phrase.',
    why: {
      'The cable, because level jumps are usually electrical': 'Watch the player first: a hand coming closer is the common cause.',
      'A compressor setting, before watching the player': 'Processing hides a placement problem; find the physical cause first.',
    },
  },
  {
    id: 'egg.s.lost',
    observation: 'One egg of a pair disappears',
    firstChecks: 'Are the hands apart, one egg softer, or a palm covering it?',
    options: ['The hands’ spacing, the eggs themselves, and the grip', 'Boost the treble on the quieter side until both eggs match', 'Ask the player to play that egg harder'],
    correct: 'The hands’ spacing, the eggs themselves, and the grip',
    explain: 'Check the part and the eggs’ outputs, then compare one central mic with separate coverage.',
    why: {
      'Boost the treble on the quieter side until both eggs match': 'EQ cannot bring back an egg the mic does not hear.',
      'Ask the player to play that egg harder': 'The music sets the touch; check the eggs and the mic first.',
    },
  },
  {
    id: 'egg.s.noise',
    observation: 'Hand, clothing or stand noises dominate',
    firstChecks: 'Is the mic too close, or in the travel path?',
    options: ['Whether the mic is too close or in the path', 'A gate set to open only on the egg strokes', 'A high-pass filter set as high as it goes'],
    correct: 'Whether the mic is too close or in the path',
    explain: 'Create clearance, secure the cable, and compare a modestly farther position.',
    why: {
      'A gate set to open only on the egg strokes': 'An egg plays constantly: a gate chops it, and the noise rides along.',
      'A high-pass filter set as high as it goes': 'A filter can help a little, but the cause is distance and the path.',
    },
  },
  {
    id: 'egg.s.masked',
    observation: 'The egg is masked in the live mix',
    firstChecks: 'Is the egg’s level low compared with the stage spill?',
    options: ['The egg against the spill: a louder egg, a better spot', 'Turn the egg channel up until it cuts through the band', 'A big treble boost so it sits on top'],
    correct: 'The egg against the spill: a louder egg, a better spot',
    explain: 'Try a louder suitable egg, better player and mic placement, or less nearby stage level.',
    why: {
      'Turn the egg channel up until it cuts through the band': 'The channel raises the spill and the feedback risk with the egg.',
      'A big treble boost so it sits on top': 'A boost lifts the cymbals in the same channel too.',
    },
  },
  feedbackSymptom(W),
  monoSymptom(W),
  contactSymptom(W),
];

const DOC = { id: 'r.doc', label: 'It starts about 30–60 cm from the middle of the playing area', role: 'required' as const, feedback: 'Say why it is a good place to begin, and what it is measured from.' };

const setupTasks: SetupTask[] = [
  {
    id: 'egg.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A quiet studio overdub: one egg, a soft part, a pleasant room. Phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser about 40 cm in front of the playing area, aimed into it', ok: true, power: 'phantom', feedback: 'The recommended start, outside the motion; it needs the phantom this channel has.' },
      { id: 'b', label: 'Small condenser about 50 cm away, a little higher, angled down', ok: true, power: 'phantom', feedback: 'Also fair: a different balance of egg, hand and room — compare by ear.' },
      { id: 'c', label: 'A mic 8 cm from the egg so the soft part is loud enough', ok: false, power: 'phantom', feedback: 'Inside the motion — and very close, every stroke jumps and handling noise rises. Choose the egg or the gain instead.' },
      { id: 'd', label: 'A clip-on mic taped to the egg', ok: false, power: 'phantom', feedback: 'No mic on a small egg without a purpose-built, safe system and the player’s agreement.' },
      { id: 'e', label: 'Ask the player to cup the egg tightly so it sounds smoother', ok: false, power: 'none', feedback: 'The grip is the player’s; place the mic for it.' },
    ],
    reasons: [DOC, CLEAR_REASON, POWER_REASON, PEAK_REASON, BRAND_REASON, TECH_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point from the middle of the playing area, outside the whole motion, power that matches the mic.',
  },
  {
    id: 'egg.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A live show: the player shakes an egg in each hand, close together, beside a loud drum kit. The spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'One small dynamic aimed between the eggs, a null toward the wedge', ok: true, power: 'none', feedback: 'One mic for two close eggs; a dynamic needs no phantom. Check spill and feedback with the operator.' },
      { id: 'b', label: 'A small dynamic about 30 cm in front of the hands, with a louder egg pair', ok: true, power: 'none', feedback: 'Fair: the source chosen for the setting, a dynamic that needs no phantom.' },
      { id: 'c', label: 'A small condenser between the eggs', ok: false, power: 'phantom', feedback: 'This input has no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'An omni in front of the player, to catch both hands', ok: false, power: 'none', feedback: 'On a loud stage an omni hears every monitor and the kit — spill and early feedback.' },
      { id: 'e', label: 'A close mic on each egg, both turned well up', ok: false, power: 'none', feedback: 'Two close mics, turned up, raise the kit spill and the feedback risk.' },
    ],
    reasons: [{ id: 'r.doc', label: 'It covers both hands and their real motion', role: 'required', feedback: 'Say what it covers — both eggs, the whole motion.' }, CLEAR_REASON, POWER_REASON, { id: 'r.src', label: 'A louder egg suits a loud stage better than more gain', role: 'optional', feedback: 'A fair source-first reason.' }, BRAND_REASON, TECH_REASON],
    explain: 'Two setups pass. What passes is the reasoning: both hands covered, outside the motion, a source that suits the stage, power the input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: the wrist moves the egg one way. What do the grains inside do at first?', options: ['They lag behind', 'They move exactly with the shell', 'They stay stuck to the shell’s wall'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch the grains.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: two eggs, hands wide apart. Can one mic still serve?', options: ['Yes, from farther back', 'No — two mics are needed', 'It depends on the part'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge sits behind the mic and off to one side. Can a cardioid’s null reach it?', options: ['Yes — with a tilt of the mic', 'No — only a tighter pattern’s null can', 'It is already in the null'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'egg.q.1',
    covers: 'instrument',
    prompt: 'How is an egg shaker different from a maraca?',
    options: ['No handle: the egg sits in the hand, so the grip matters', 'It has a short handle that sits inside the egg-shaped shell', 'It is played with a stick instead of being shaken'],
    correct: 'No handle: the egg sits in the hand, so the grip matters',
    explain: 'A small handleless shell held in the palm or fingers — the hand round it is part of the instrument.',
    why: {
      'It has a short handle that sits inside the egg-shaped shell': 'Egg shakers have no handle; maracas do.',
      'It is played with a stick instead of being shaken': 'It is shaken; its grains strike the shell.',
    },
  },
  {
    id: 'egg.q.2',
    covers: 'instrument',
    prompt: 'A set of eggs is labelled soft, medium, loud and extra-loud. What are those labels?',
    options: ['Relative product choices — not calibrated levels', 'Exact sound levels, measured at a set distance', 'Settings that change how a mic should be placed'],
    correct: 'Relative product choices — not calibrated levels',
    explain: 'They help choose an egg for the setting; they are not measured levels and promise nothing on a loud stage.',
    why: {
      'Exact sound levels, measured at a set distance': 'No level is printed; they are relative categories.',
      'Settings that change how a mic should be placed': 'They describe the egg, not the mic; place the mic by listening.',
    },
  },
  {
    id: 'egg.q.3',
    covers: 'sound',
    prompt: 'Where does an egg shaker’s attack start?',
    options: ['The grains striking the shell as a stroke turns', 'The fingers tapping the shell from outside', 'Air leaving through the shell’s seam'],
    correct: 'The grains striking the shell as a stroke turns',
    explain: 'The grains lag the shell and strike its inside when the stroke turns.',
    why: {
      'The fingers tapping the shell from outside': 'The fingers hold it; the grains make the sound.',
      'Air leaving through the shell’s seam': 'The shell is closed; the impacts inside make the sound.',
    },
  },
  {
    id: 'egg.q.4',
    covers: 'sound',
    prompt: 'A palm cups over the egg. What changes for a mic on that side?',
    options: ['Less of the egg reaches it, and the sound can soften', 'Nothing: the grains are inside the shell anyway', 'More of the egg, because the cupped palm focuses its sound'],
    correct: 'Less of the egg reaches it, and the sound can soften',
    explain: 'The palm shields and damps the covered part of the shell.',
    why: {
      'Nothing: the grains are inside the shell anyway': 'The shell radiates the sound; covering it changes what leaves.',
      'More of the egg, because the cupped palm focuses its sound': 'A soft palm damps rather than focuses.',
    },
  },
  {
    id: 'egg.q.5',
    covers: 'setting',
    prompt: 'A quiet egg must play over a loud backline live. What comes first?',
    options: ['A louder egg and a better spot, before more gain', 'More channel gain until it is heard over the band', 'A bright EQ boost so it cuts through the backline'],
    correct: 'A louder egg and a better spot, before more gain',
    explain: 'The source and the layout decide the spill; gain and EQ raise everything in the channel.',
    why: {
      'More channel gain until it is heard over the band': 'Gain raises the backline spill and the feedback risk with the egg.',
      'A bright EQ boost so it cuts through the backline': 'EQ lifts the spill in the same band too.',
    },
  },
  quickHearing(W),
];

export const I03B_LESSON: SpLesson = {
  id: 'I03b',
  labId: 'percussion',
  title: 'Egg Shaker',
  subtitle: 'No handle: one egg, two close, or hands apart — the grip is part of it',
  noun: { one: 'egg shaker', many: 'egg shakers' },
  model: EGG_MODEL,
  micTypeIds: ['orchSdc', 'smallDynCard'],
  zones: EGG_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    setupOrder(W, { text: 'Choose the egg for the setting; watch both hands and the real grip', early: 'Start with the egg, the player and the music.' }, { text: 'Hear it in the room and decide whether an existing mic already carries it', early: 'Hear what the existing mics give before you add one.' }),
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A small, handleless shell — often egg-shaped plastic — with grains inside. Shaken, the grains strike the shell: an idiophone, with no drumhead. Played singly, or one in each hand.', src: 'MEINL-ES4' },
    { title: 'WHERE YOU MEET IT', text: 'On studio overdubs, on stage at a percussion station, and in many players’ pockets — a quiet, detailed pulse that often sits under a groove.', src: 'DPA-JONAS' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Short wrist strokes, broader arm motion, interlocking patterns with two hands. Its forward and return strokes need not be equally accented — and eggs come in softer and louder versions for different settings.', src: 'LESSON-EGG' },
    { title: 'ITS SIZE', text: 'Small enough to hide in a hand. This lab draws an egg about 6 cm long and 4.5 cm across — a drawing; no maker prints a size.', src: 'LESSON-EGG' },
  ],
  sound: {
    stages: [
      { title: 'The stroke starts', text: 'The wrist moves the egg. The grains inside lag behind, at the trailing end.' },
      { title: 'The stroke turns', text: 'The egg stops and turns back; the grains keep going across the inside.' },
      { title: 'The grains strike the shell', text: 'They strike the inside of the shell — the ATTACK — and roll along it — the WASH.' },
      { title: 'Sound leaves the shell', text: 'The shell passes the impacts to the air — less where a palm or fingers cover it, so the grip changes the sound.' },
    ],
    attack: 'The grains striking the inside of the shell as each stroke turns. A sharper turn tends to give a stronger attack; the forward and return strokes can differ.',
    body: 'The grains rolling along the wall between impacts: the wash. A palm over the shell damps and shields part of it. Tendencies — eggs, grains and players vary.',
    head: { diameterMm: 45, rods: 0, label: 'the egg’s shell', strikeSrc: 'LESSON-EGG' },
  },
  setting: {
    items: [
      { id: 'egg', label: 'the egg player at the station', short: 'EGGS', note: 'Standing at a percussion station with one egg or two. The drawing every page of this lesson uses.', prov: { kind: 'illustrative', reason: 'a typical station layout; no source gives positions' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'perc', label: 'other percussion at the station', short: 'PERCUSSION', note: 'Hand drums and a cymbal beside the player: much louder than an egg, and close.', prov: { kind: 'illustrative', reason: 'a typical station layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'kit', label: 'the drum kit', short: 'DRUM KIT', note: 'Cymbals and snare a few metres away: the loudest spill into a quiet egg mic.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'amp', label: 'a guitar amp', short: 'AMP', note: 'Loud and bright upstage: aim the egg mic’s rejection, not its front, toward it.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'vocal', label: 'a singer’s microphone', short: 'VOCAL MIC', note: 'Another open mic near the station: it hears the eggs, and the egg mic hears the voice.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'ANOTHER MIC', scene: 'kit' },
      ...stageItems('the eggs', 'An area or ensemble mic over the percussion may already carry the eggs; a spot is added only if they need their own control.'),
    ],
    stage: 'LIVE: a dedicated directional mic, monitors in its low-sensitivity directions, the full band at soundcheck — and a louder egg before more gain.',
    studio: 'RECORDING: choose an egg whose level and grain suit the part, away from noisy fans; one mono spot often does everything.',
  },
  diagnostic,
  practice: {
    task: 'Choose an egg for the setting, keep both hands’ motion inside the pickup and clear of the stand, explain a one- or two-mic choice, and tell spill or feedback from a plain gain shortage. With real eggs and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'egg', label: 'Egg (soft / medium / loud)', kind: 'text' },
      { id: 'hands', label: 'Hands', kind: 'choice', choices: ['one egg', 'two, close', 'two, apart'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser', 'large condenser', 'dynamic', 'other'] },
      { id: 'zone', label: 'Distances you tried (about 30 and 60 cm)', kind: 'text' },
      { id: 'grip', label: 'Grip and what it changed', kind: 'text' },
      { id: 'notes', label: 'What you heard (pulse, noise, level, spill)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The egg’s size (58 × 45 mm): no maker prints one — a drawing default.', dims: ['len', 'd'] },
    { text: 'Each egg’s motion envelope (±120 mm along the shake, ±50 across), the hands’ spacing (±180 mm close, ±260 mm apart) and the palm’s cover — drawing defaults and ILLUSTRATIVE.', dims: ['sweep', 'across', 'pairZ', 'apartZ'] },
    { text: 'The playing height and the player’s posture: ILLUSTRATIVE; no height is shown.', dims: [] },
  ],
  live: { wedges: standingWedges('the eggs') },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every egg, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: an egg shaker in one or two hands, a few beads standing for the grains, mic patterns and the two-mic comb as textbook shapes, and motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.',
  copy: EGG_COPY,
  sp: {
    strikeTitle: 'Stroke to sound',
    close: { side: { u0: -330, u1: 250, v0: -1400, v1: -960 }, top: { u0: -330, u1: 250, v0: -380, v1: 380 } },
    plan: {
      box: { u0: -2600, u1: 2700, v0: -2100, v1: 2100 },
      things: [
        { id: 'egg', kind: 'drums', u: 0, v: 0, scene: 'all' },
        { id: 'perc', kind: 'perc', u: -250, v: 1050, scene: 'all' },
        { id: 'kit', kind: 'kit', u: -1500, v: -1350, scene: 'all' },
        { id: 'amp', kind: 'amp', u: -1900, v: 950, face: 0, scene: 'all' },
        { id: 'vocal', kind: 'micstand', u: 1100, v: -1350, scene: 'all' },
        ...STAGE_THINGS,
      ],
    },
  },
};
