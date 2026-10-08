/**
 * I03c MARACAS — the lesson's pages as DATA (blueprint §7). Words from the
 * owner's lesson (docs/labs/miking/source_text/Maracas-Miking-Technique-
 * Research.txt, "L<n>" in COMMENTS only) with the fixes in CORRECTIONS_LOG.md
 * (MR-xx) applied. OWNER RULING 2026-10-04: starting points; no source,
 * brand or model in learner text; no badges; FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, LessonPages, PageContent, SourcePageId, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, cardioidNull, CLEAR_REASON, contactSymptom, feedbackSymptom, firstNotch, gainCheck, hearingCheck, louderIsNotBetter, moveRemovesDelay, noPhantom, PEAK_REASON, polarityKeepsDelay, POWER_REASON, quickHearing, setupOrder, slowMeter, TECH_REASON, type SpWords } from '../shared/smallperc/commonItems.ts';
import type { SpLesson } from '../shared/smallperc/family.ts';
import { STAGE_THINGS, stageItems, standingWedges } from '../shared/smallperc/stage.ts';
import { MAR_MODEL } from './geometry.ts';
import { MAR_ZONES } from './model.ts';
import { MAR_COPY } from './copy.ts';

const W: SpWords = { p: 'mar', the: 'the maracas', a: 'a pair of maracas', noun: 'maraca', player: 'player', loudest: 'the loudest accent' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the maracas',
    goal: 'Get to know maracas — what they are, where you meet them, what they do in the music and how a pair is played — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Two vessel rattles on handles, usually one in each hand: the sound is made at the heads, and each arm can play its own part.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a stroke becomes sound in the head — the seeds lagging, striking, rolling — and what a circular wrist changes.',
    credit: { scenarios: ['mar.snd.1', 'mar.snd.2', 'mar.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The seeds strike and rub the vessel: accents at each turn, a wash between, a longer sustain when the wrist circles. The head is the source — not the handle.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the maraca player stands, what is around them — sometimes their own vocal mic — and what to do before any mic.',
    credit: { scenarios: ['mar.set.1', 'mar.set.hear', 'mar.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Map both heads and both arcs, listen to this pair, never ask the player to freeze or swap hands. Protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for maracas by its properties — pattern, power, size and how it handles brief peaks — not by its brand.',
    credit: { scenarios: ['mar.mic.1', 'mar.mic.peak', 'mar.mic.power', 'mar.mic.aim', 'mar.rec.1'], note: 'Answer the five checks (one reaches back to how the maracas sound).' },
    takeaway: 'Condensers and dynamics can all work; the pattern and the placement decide the room, the neighbours and the speakers in the channel. Aim at the heads, not the handles.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — one mic centred about 40–80 cm from the midpoint between the heads — then try a spot per head, and a singer’s pair.',
    credit: { scenarios: ['mar.place.1', 'mar.place.2', 'mar.place.3', 'mar.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different suggested starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'One centred mic outside both arcs is the place to begin; a spot per head only when one hand disappears or the parts need it — and checked in mono.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s real rejection faces a loud unwanted source — and handle the singer who plays maracas.',
    credit: { scenarios: ['mar.ctx.1', 'mar.ctx.2', 'mar.ctx.studio', 'mar.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the downstage wedge sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Aim nulls by the real pattern. A separate maraca spot controls only what it hears cleanly — it cannot take the maracas out of a vocal mic.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See how two spots on two heads interact — arrival times, comb-filter notches, and what polarity does and does not change.',
    credit: { scenarios: ['mar.two.1', 'mar.two.2', 'mar.two.3', 'mar.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Each spot hears both heads at different times. Polarity flips the sign; it does not remove a delay. A balanced single mic remains a valid choice.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — a head coming close, the pair itself, spill, the vocal mic, the monitors — before gain or EQ.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two briefs, and say what would justify a second mic.',
    credit: { scenarios: ['mar.prac.order', 'mar.prac.gain', 'mar.prac.setup1', 'mar.prac.setup2', 'mar.prac.3', 'mar.mix.1', 'mar.mix.2', 'mar.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'The heads named as the sources, both arcs covered safely, the mic count justified, and instrument, room, spill and gain problems told apart. More than one setup can pass.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L8-L10 · set L9-L13, L62 · mic L50-L52 ·
 * place L12-L24 · ctx L40-L47 · two L26-L30 · prac L55-L61. */
const scenarios: MikingScenario[] = [
  {
    id: 'mar.snd.1',
    page: 'sound',
    prompt: 'Where is a maraca’s sound mainly made?',
    options: ['In the head, where the seeds strike and rub the vessel', 'At the end of the handle, where the player’s grip is', 'In the air between the two maracas as they pass'],
    correct: 'In the head, where the seeds strike and rub the vessel',
    explain: 'The seeds inside the head strike and rub its wall. Watch where each head travels — not the bottom of the handle.',
    why: {
      'At the end of the handle, where the player’s grip is': 'The handle is for holding; the head is the source.',
      'In the air between the two maracas as they pass': 'Each head makes its own sound; nothing is generated between them.',
    },
  },
  {
    id: 'mar.snd.2',
    page: 'sound',
    prompt: 'The player circles the wrist instead of striking up and down. What tends to change?',
    options: ['The seeds roll round the wall: a longer, smoother sustain', 'Nothing: the seeds still make exactly the same sound', 'The maraca becomes louder because the circles are faster'],
    correct: 'The seeds roll round the wall: a longer, smoother sustain',
    explain: 'Repeated circular wrist movements keep the seeds rubbing round the vessel’s wall — a sound with greater sustain.',
    why: {
      'Nothing: the seeds still make exactly the same sound': 'The motion changes how the seeds meet the wall — strikes or rolling.',
      'The maraca becomes louder because the circles are faster': 'The change is in the character — rolling rather than striking — not simply level.',
    },
  },
  {
    id: 'mar.snd.3',
    page: 'sound',
    prompt: 'One pair has rawhide heads, another plastic. What can you say before you listen?',
    options: ['Little: listen to each pair at its real playing strength', 'Rawhide is warmer, so it suits quiet songs best', 'Plastic is brighter, so it needs a dynamic mic to tame it'],
    correct: 'Little: listen to each pair at its real playing strength',
    explain: 'Material influences the possible sound, but neither a material name nor a product label gives an exact response at a mic.',
    why: {
      'Rawhide is warmer, so it suits quiet songs best': 'A material label is not a measured tone; hear the actual pair.',
      'Plastic is brighter, so it needs a dynamic mic to tame it': 'No material decides the mic; listen, then choose.',
    },
  },
  {
    id: 'mar.set.1',
    page: 'setting',
    prompt: 'Before you place a maraca mic, what do you map?',
    options: ['Where both heads travel through the whole part', 'The handles’ position at rest, since they hardly move', 'Only the louder hand, since the other will follow'],
    correct: 'Where both heads travel through the whole part',
    explain: 'Both heads, the widest travel, changes of height and any switch to the voice or another instrument decide where a mic can go.',
    why: {
      'The handles’ position at rest, since they hardly move': 'The handles move with the strokes — and the heads are the sources.',
      'Only the louder hand, since the other will follow': 'Each arm can play its own part; map both.',
    },
  },
  hearingCheck(W),
  {
    id: 'mar.set.2',
    page: 'setting',
    prompt: 'Would it be fair to ask the player to swap hands so the louder maraca faces the mic?',
    options: ['No — place the mics for how they play', 'Yes — it is a small change for a better balance', 'Yes, and ask them to match the accents too'],
    correct: 'No — place the mics for how they play',
    explain: 'Do not ask a player to freeze their hands, swap hands or force identical accents to simplify the mics.',
    why: {
      'Yes — it is a small change for a better balance': 'The player’s technique is the music; move the mic instead.',
      'Yes, and ask them to match the accents too': 'Different accents in each hand are part of the playing.',
    },
  },
  {
    id: 'mar.mic.1',
    page: 'microphone',
    prompt: 'A cardioid or an omni for a maraca spot — what decides?',
    options: ['The room and the stage: isolation needed, or broad coverage', 'The maraca material: rawhide heads want an omni to sound natural', 'Nothing: an omni is a mistake on percussion'],
    correct: 'The room and the stage: isolation needed, or broad coverage',
    explain: 'A cardioid often improves isolation; an omni can be tried in a quiet, good-sounding room where broad coverage helps.',
    why: {
      'The maraca material: rawhide heads want an omni to sound natural': 'The material does not choose the pattern; the room and the stage do.',
      'Nothing: an omni is a mistake on percussion': 'Too strong: in a quiet, good room an omni can sound natural.',
    },
  },
  slowMeter(W),
  noPhantom(W),
  {
    id: 'mar.mic.aim',
    page: 'microphone',
    prompt: 'Very close, a directional mic thumps in the lows. Should you aim it at the handles instead?',
    options: ['No — move back a little; the heads are the source', 'Yes — the handles are quieter, so the thump goes', 'Yes, and boost the treble to bring the seeds back'],
    correct: 'No — move back a little; the heads are the source',
    explain: 'Proximity effect and handling sound grow very close; neither is a reason to aim at the handles. Distance first.',
    why: {
      'Yes — the handles are quieter, so the thump goes': 'Aimed at the handles, the mic misses the heads — the sound you want.',
      'Yes, and boost the treble to bring the seeds back': 'EQ cannot bring back heads the mic is not aimed at.',
    },
  },
  {
    id: 'mar.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Close to one head, a mic hears that head jump on every stroke. Why?',
    options: ['The head comes much closer, then farther, each stroke', 'The seeds inside get louder as they warm up', 'The mic’s pickup pattern widens when the head comes near'],
    correct: 'The head comes much closer, then farther, each stroke',
    explain: 'Close to a moving head, each stroke changes the distance by a large share: the level leaps.',
    why: {
      'The seeds inside get louder as they warm up': 'The seeds do not change; the distance does.',
      'The mic’s pickup pattern widens when the head comes near': 'A pattern does not change with distance; the level does.',
    },
  },
  {
    id: 'mar.place.1',
    page: 'placement',
    prompt: 'A starting point says about 40–80 cm. Measured from where?',
    options: ['The midpoint between the heads’ usual positions', 'The nearest head at the end of its biggest stroke', 'The bottom of the handles, where they are held'],
    correct: 'The midpoint between the heads’ usual positions',
    explain: 'The distance is from the middle of the usual sound area; the closest stroke sets the clearance, read separately.',
    why: {
      'The nearest head at the end of its biggest stroke': 'That point sets the clearance; the readout shows it separately.',
      'The bottom of the handles, where they are held': 'The heads make the sound; measure from where they play.',
    },
  },
  {
    id: 'mar.place.2',
    page: 'placement',
    prompt: 'One hand overwhelms the other in a single centred mic. What do you try first?',
    options: ['Recentre or step back, then check the pair itself', 'A second mic on the quieter hand, straight away', 'Ask the player to play the louder hand more softly'],
    correct: 'Recentre or step back, then check the pair itself',
    explain: 'Is that head closer, louder, or moving through the mic’s axis? Recentre or step back, check the instruments — then consider two spots.',
    why: {
      'A second mic on the quieter hand, straight away': 'A second channel adds spill and delay; try the one mic’s position first.',
      'Ask the player to play the louder hand more softly': 'The player’s accents are the music; move the mic.',
    },
  },
  {
    id: 'mar.place.3',
    page: 'placement',
    prompt: 'When do two spots — one per head — make sense?',
    options: ['Hands far apart, different parts, or one hand lost', 'Whenever there are two maracas in the part', 'When the pair is too quiet for one mic’s gain'],
    correct: 'Hands far apart, different parts, or one hand lost',
    explain: 'Compare a single centred mic first: two channels add setup, spill and interaction between the mics.',
    why: {
      'Whenever there are two maracas in the part': 'Two maracas often sit well in one mic.',
      'When the pair is too quiet for one mic’s gain': 'A second mic does not fix a quiet source; gain or a louder pair does.',
    },
  },
  {
    id: 'mar.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Your stand clears the maracas at rest. Is that enough?',
    options: ['No — it must clear both arms’ whole arcs', 'Yes — maracas are small, so clear at rest is enough', 'Yes, provided the cable is taped down to the floor'],
    correct: 'No — it must clear both arms’ whole arcs',
    explain: 'Two arms sweep far more space than the maracas at rest. Check the whole part with the player.',
    why: {
      'Yes — maracas are small, so clear at rest is enough': 'Small instruments, big arcs: the arms and heads sweep far more space.',
      'Yes, provided the cable is taped down to the floor': 'A taped cable is good practice; the stand must still clear both arcs.',
    },
  },
  {
    id: 'mar.ctx.1',
    page: 'context',
    prompt: 'A singer plays maracas. Will a separate maraca spot take the rattle out of the vocal mic?',
    options: ['No — it adds control only of what it hears cleanly', 'Yes — the spot draws the maracas away from the vocal mic', 'Yes, if the spot is turned up above the vocal'],
    correct: 'No — it adds control only of what it hears cleanly',
    explain: 'The vocal mic still hears the maracas. Place both mics and the player to reduce unwanted pickup — without spoiling the singer’s mic technique.',
    why: {
      'Yes — the spot draws the maracas away from the vocal mic': 'A mic cannot remove sound from another mic; the vocal mic still hears them.',
      'Yes, if the spot is turned up above the vocal': 'Turning the spot up adds maracas; the vocal mic’s spill stays.',
    },
  },
  {
    id: 'mar.ctx.2',
    page: 'context',
    prompt: 'The maracas vanish when the band comes in. What do you change first?',
    options: ['The source and the layout, before gain or EQ', 'The channel gain, until they cut through again', 'A treble boost, so the seeds sit on top'],
    correct: 'The source and the layout, before gain or EQ',
    explain: 'If the direct maraca level is low against cymbals and backline, change the pair, the layout or the placement first.',
    why: {
      'The channel gain, until they cut through again': 'More gain lifts the cymbals, monitors and feedback risk too.',
      'A treble boost, so the seeds sit on top': 'A boost lifts the cymbals in the same channel.',
    },
  },
  {
    id: 'mar.ctx.studio',
    page: 'context',
    prompt: 'A studio overdub of a pair of maracas. Can a single mono pickup serve it?',
    options: ['Yes — mono often serves; stereo is an artistic choice', 'No — two maracas need two channels, hard-panned', 'No, because one mic cannot hear both of the hands'],
    correct: 'Yes — mono often serves; stereo is an artistic choice',
    explain: 'Mono is often sufficient for a supportive groove. Stereo should serve a deliberate spatial idea, not the number of instruments.',
    why: {
      'No — two maracas need two channels, hard-panned': 'Two instruments do not require two channels — or hard panning.',
      'No, because one mic cannot hear both of the hands': 'A centred mic, far enough back, often hears both well.',
    },
  },
  {
    id: 'mar.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · A singer’s head swings near the vocal mic on each accent. What happens?',
    options: ['The vocal channel rattles more on those accents', 'Nothing: a vocal mic rejects all percussion', 'The maraca spot gets quieter on those accents'],
    correct: 'The vocal channel rattles more on those accents',
    explain: 'The nearer a head passes the vocal capsule, the more maraca it hears. Rehearse the real gestures and check both mics.',
    why: {
      'Nothing: a vocal mic rejects all percussion': 'A vocal mic hears whatever is near its front — maracas included.',
      'The maraca spot gets quieter on those accents': 'The spot hears roughly the same; the vocal mic hears more.',
    },
  },
  polarityKeepsDelay(W),
  firstNotch(W),
  {
    id: 'mar.two.3',
    page: 'twoMic',
    prompt: 'You use a spot per head. What does each spot also hear?',
    options: ['The other head, a little later and quieter', 'Only its own head, if both are cardioids', 'Nothing more, as long as the arms are apart'],
    correct: 'The other head, a little later and quieter',
    explain: 'The two-head sound reaches each mic at different times. Bring both up together and check in mono.',
    why: {
      'Only its own head, if both are cardioids': 'A cardioid still hears from the side; the other head arrives later.',
      'Nothing more, as long as the arms are apart': 'Distance lowers the other head; it does not remove it — or its delay.',
    },
  },
  louderIsNotBetter(W),
  gainCheck(W),
  {
    id: 'mar.prac.3',
    page: 'practice',
    prompt: 'What would justify a second maraca mic?',
    options: ['A hand lost in one mic, or parts that need their own control', 'Two maracas need two microphones to sound balanced and right', 'The pair needs more level than one mic can give'],
    correct: 'A hand lost in one mic, or parts that need their own control',
    explain: 'If the one-mic result is balanced, it remains a valid choice; a second channel has to earn its spill and stands.',
    why: {
      'Two maracas need two microphones to sound balanced and right': 'A centred mic often balances a pair well.',
      'The pair needs more level than one mic can give': 'Level comes from gain — or a louder pair — not another mic.',
    },
  },
  {
    id: 'mar.mix.1',
    page: 'practice',
    prompt: 'A starting point says “about 40–80 cm”. What else do you need before placing the mic?',
    options: ['Where both heads actually travel, and where to aim', 'The maracas’ brand, so the number fits their size', 'Nothing more: the number already says where it goes'],
    correct: 'Where both heads actually travel, and where to aim',
    explain: 'The distance is from the midpoint between the heads; the mic must clear both arcs, and its aim sets the balance.',
    why: {
      'The maracas’ brand, so the number fits their size': 'The brand does not change the reference or the motion.',
      'Nothing more: the number already says where it goes': 'A distance means nothing without the motion and the aim.',
    },
  },
  cardioidNull(W),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  {
    id: 'mar.s.onehand',
    observation: 'One hand overwhelms the other',
    firstChecks: 'Is its head closer, louder, or moving through the mic’s axis?',
    options: ['Its head’s distance, its level and the mic’s axis', 'Turn the louder side down with EQ on that band', 'Ask the player to swap hands for the take'],
    correct: 'Its head’s distance, its level and the mic’s axis',
    explain: 'Recentre or step back, check the pair’s balance, then consider two spots.',
    why: {
      'Turn the louder side down with EQ on that band': 'EQ cannot separate two heads in one channel.',
      'Ask the player to swap hands for the take': 'The player’s hands are theirs; move the mic.',
    },
  },
  {
    id: 'mar.s.vanish',
    observation: 'The maracas vanish when the band enters',
    firstChecks: 'Is the direct maraca level low against cymbals and backline?',
    options: ['The pair and the layout against the band’s spill', 'Turn the maraca channel up until it cuts through', 'A big treble boost so the seeds sit on top'],
    correct: 'The pair and the layout against the band’s spill',
    explain: 'Change the source, the layout or the placement before gain and EQ.',
    why: {
      'Turn the maraca channel up until it cuts through': 'The channel raises the spill and the feedback risk too.',
      'A big treble boost so the seeds sit on top': 'A boost lifts the cymbals in the same channel.',
    },
  },
  {
    id: 'mar.s.tone',
    observation: 'The attack is too sharp, or the wash too dull',
    firstChecks: 'Does the pair or the stroke make it acoustically?',
    options: ['The pair and the technique, then small mic moves', 'A shell-material EQ preset for rawhide or plastic', 'A different mic model, before hearing the pair'],
    correct: 'The pair and the technique, then small mic moves',
    explain: 'Audition a different pair or technique and small position changes; no shell-material fix is universal.',
    why: {
      'A shell-material EQ preset for rawhide or plastic': 'A material label is not a measured tone; no preset fits every pair.',
      'A different mic model, before hearing the pair': 'Hear the instrument first; then change one thing at a time.',
    },
  },
  {
    id: 'mar.s.vocal',
    observation: 'The singer’s vocal channel rattles',
    firstChecks: 'How close do the heads pass the vocal capsule?',
    options: ['How close the heads pass the vocal mic', 'Gate the vocal mic to open only on singing', 'Add a maraca spot to pull them out of the vocal'],
    correct: 'How close the heads pass the vocal mic',
    explain: 'Rehearse the full gesture, move the maraca arc where comfortable, and check the vocal and maraca mics together.',
    why: {
      'Gate the vocal mic to open only on singing': 'The maracas play while the singer sings; a gate opens for both.',
      'Add a maraca spot to pull them out of the vocal': 'A spot cannot remove spill already in the vocal mic.',
    },
  },
  feedbackSymptom(W),
  {
    id: 'mar.s.thin',
    observation: 'Main plus spot sounds thin or unstable',
    firstChecks: 'Does the shared pickup change the sum? Compare in mono.',
    options: ['Each channel alone, then the sum in mono', 'Turn the spot up until it sounds full again', 'Invert the spot, since spots are usually wrong'],
    correct: 'Each channel alone, then the sum in mono',
    explain: 'Move the spot, rebalance, or remove it if it does not help.',
    why: {
      'Turn the spot up until it sounds full again': 'More level does not fix a cancellation.',
      'Invert the spot, since spots are usually wrong': 'No mic is usually wrong; compare both polarities at matched level.',
    },
  },
  contactSymptom(W),
];

const DOC = { id: 'r.doc', label: 'It starts about 40–80 cm from the midpoint between the heads', role: 'required' as const, feedback: 'Say why it is a good place to begin, and what it is measured from.' };

const setupTasks: SetupTask[] = [
  {
    id: 'mar.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A studio overdub: a pair of maracas, a supportive groove, a quiet room. Phantom power is available.',
    setups: [
      { id: 'a', label: 'One small condenser centred about 60 cm in front of the pair', ok: true, power: 'phantom', feedback: 'The suggested start: both heads, outside both arcs; it needs the phantom this channel has.' },
      { id: 'b', label: 'One small condenser about 50 cm away, centred, a little higher', ok: true, power: 'phantom', feedback: 'Also fair: a different height to balance the heads — compare by ear.' },
      { id: 'c', label: 'Two spots, hard-panned, because there are two maracas', ok: false, power: 'phantom', feedback: 'Two instruments do not require two channels; stereo should serve a deliberate idea.' },
      { id: 'd', label: 'A mic aimed at the handles to avoid the bright seeds', ok: false, power: 'phantom', feedback: 'The heads are the source; aimed at the handles the mic misses them.' },
      { id: 'e', label: 'Ask the player to hold both maracas still and shake gently', ok: false, power: 'none', feedback: 'The player’s motion is never changed to suit a mic.' },
    ],
    reasons: [DOC, CLEAR_REASON, POWER_REASON, PEAK_REASON, BRAND_REASON, TECH_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point from the midpoint between the heads, outside both arcs, power that matches the mic.',
  },
  {
    id: 'mar.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A live show: the singer plays maracas at a vocal mic, with monitors on stage. The spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'One small dynamic for the maracas, centred and a little above them', ok: true, power: 'none', feedback: 'A dynamic needs no phantom; check the vocal mic and the spot together, and the wedge in the null.' },
      { id: 'b', label: 'No maraca spot: the vocal mic and the band mics carry them, checked at soundcheck', ok: true, power: 'none', feedback: 'Fair if they are heard well enough: fewer open mics on a loud stage.' },
      { id: 'c', label: 'A small condenser on the maracas', ok: false, power: 'phantom', feedback: 'This input has no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'A maraca spot turned up to pull the rattle out of the vocal', ok: false, power: 'none', feedback: 'A spot cannot remove what the vocal mic already hears.' },
      { id: 'e', label: 'Ask the singer to hold the maracas away from the face', ok: false, power: 'none', feedback: 'The singer’s gestures are theirs; rehearse and place the mics for them.' },
    ],
    reasons: [{ id: 'r.doc', label: 'It accounts for the vocal mic and both arms', role: 'required', feedback: 'Say what it covers: both heads, both arms — and the vocal mic that hears them too.' }, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'Fewer open mics keep spill and feedback down', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, TECH_REASON],
    explain: 'Two setups pass. What passes is the reasoning: the vocal mic’s pickup accounted for, both arms covered safely, power the input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: the wrist swings a maraca down. Where are the seeds at first?', options: ['Left behind at the top', 'Already at the bottom', 'Spread evenly'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch the seeds.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: one centred mic, the right hand much closer to it. What happens?', options: ['The right hand dominates', 'Both stay balanced', 'It depends on the pair'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge sits behind the mic and off to one side. Can a cardioid’s null reach it?', options: ['Yes — with a tilt of the mic', 'No — only a tighter pattern’s null can', 'It is already in the null'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'mar.q.1',
    covers: 'instrument',
    prompt: 'How are maracas most often played?',
    options: ['As a matched pair, one in each hand', 'As one maraca, struck with a stick', 'Mounted on a stand and shaken by it'],
    correct: 'As a matched pair, one in each hand',
    explain: 'A performer most often plays two matched maracas, one in each hand, held by their handles — though a single maraca is possible.',
    why: {
      'As one maraca, struck with a stick': 'They are shaken vessel rattles, held by their handles.',
      'Mounted on a stand and shaken by it': 'They are held and shaken by the player’s hands.',
    },
  },
  {
    id: 'mar.q.2',
    covers: 'instrument',
    prompt: 'Where is a maraca’s sound mainly made?',
    options: ['At the head, by the seeds inside', 'At the handle, where the hand grips', 'At the player’s wrist, as it turns'],
    correct: 'At the head, by the seeds inside',
    explain: 'The head is the source: watch where each head travels.',
    why: {
      'At the handle, where the hand grips': 'The handle is for holding; the head sounds.',
      'At the player’s wrist, as it turns': 'The wrist drives the motion; the seeds in the head make the sound.',
    },
  },
  {
    id: 'mar.q.3',
    covers: 'sound',
    prompt: 'A circular wrist instead of up-and-down strokes: what tends to change?',
    options: ['A longer, smoother sustain as the seeds roll', 'More accent, as the seeds strike the wall harder', 'Nothing — the seeds behave the same way'],
    correct: 'A longer, smoother sustain as the seeds roll',
    explain: 'Circles keep the seeds rubbing round the wall: greater sustain.',
    why: {
      'More accent, as the seeds strike the wall harder': 'Rolling replaces striking: less accent, more sustain.',
      'Nothing — the seeds behave the same way': 'The motion changes how the seeds meet the wall.',
    },
  },
  {
    id: 'mar.q.4',
    covers: 'sound',
    prompt: 'Close to one head, every stroke leaps in level. Why?',
    options: ['The head’s distance to the mic changes a lot', 'The seeds get louder with each stroke', 'The mic’s pattern narrows near a source'],
    correct: 'The head’s distance to the mic changes a lot',
    explain: 'Close to a moving head, each stroke changes the distance by a large share.',
    why: {
      'The seeds get louder with each stroke': 'The seeds do not change; the distance does.',
      'The mic’s pattern narrows near a source': 'A pattern does not change with distance.',
    },
  },
  {
    id: 'mar.q.5',
    covers: 'setting',
    prompt: 'A singer plays maracas at the vocal mic. What should you expect?',
    options: ['The vocal mic will hear the maracas too', 'The vocal mic will reject the maracas', 'A maraca spot will remove them from the vocal'],
    correct: 'The vocal mic will hear the maracas too',
    explain: 'Expect maraca spill in the vocal mic — more when a head passes near it. A spot gives control only of what it hears cleanly.',
    why: {
      'The vocal mic will reject the maracas': 'A vocal mic hears what is near its front — maracas included.',
      'A maraca spot will remove them from the vocal': 'No mic removes sound from another mic.',
    },
  },
  quickHearing(W),
];

export const I03C_LESSON: SpLesson = {
  id: 'I03c',
  labId: 'percussion',
  title: 'Maracas',
  subtitle: 'A pair, two arms: one mic centred on the heads, a spot each, or a singer’s pair',
  noun: { one: 'pair of maracas', many: 'maracas' },
  model: MAR_MODEL,
  micTypeIds: ['orchSdc', 'smallDynCard'],
  zones: MAR_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    setupOrder(W, { text: 'Map both heads through the whole part; listen to this pair', early: 'Start with the player, the pair and the music.' }, { text: 'Hear what the existing mics — and any vocal mic — already carry', early: 'Hear what the existing mics give before you add one.' }),
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Shaken vessel rattles: a hollow head with seeds inside, on a handle. Usually a matched pair, one in each hand — the seeds strike and rub the vessel: an idiophone.', src: 'GRIN-MAR' },
    { title: 'WHERE YOU MEET IT', text: 'In Latin and popular music, on studio overdubs, at percussion stations — and in the hands of singers.', src: 'LESSON-MARACAS' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'A pulse with accents on the up and the down strokes, each arm playing its own; a circular wrist gives a longer, smoother sustain.', src: 'RANGEL' },
    { title: 'ITS SIZE', text: 'Pairs measured in a collection run about 27–30 cm (10.6–11.7 in) long. This lab draws a pair 28.4 cm long, with plastic or rawhide-like heads drawn as rawhide.', src: 'GRIN-MAR' },
  ],
  sound: {
    stages: [
      { title: 'The stroke starts', text: 'The wrist swings the head down. The seeds inside lag behind, at the top of the vessel.' },
      { title: 'The stroke turns', text: 'The head stops and turns back up; the seeds keep going across the inside.' },
      { title: 'The seeds strike the wall', text: 'They strike the vessel’s wall — the ATTACK — and rub along it — the WASH.' },
      { title: 'Sound leaves the head', text: 'The head passes the impacts to the air all round. The handle adds little: the head is the source.' },
    ],
    attack: 'The seeds striking the vessel at each turn of the stroke — on the way up and on the way down.',
    body: 'The seeds rubbing round the wall between strikes — a longer sustain when the wrist circles. Tendencies — pairs and players vary.',
    head: { diameterMm: 75, rods: 0, label: 'the maraca head', strikeSrc: 'LESSON-MARACAS' },
  },
  setting: {
    items: [
      { id: 'maracas', label: 'the maraca player at the station', short: 'MARACAS', note: 'Standing at a percussion station with a pair — or singing at a vocal mic. The drawing every page of this lesson uses.', prov: { kind: 'illustrative', reason: 'a typical station layout; no source gives positions' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'perc', label: 'other percussion at the station', short: 'PERCUSSION', note: 'Hand drums and a cymbal beside the player: louder than a pair of maracas, and close.', prov: { kind: 'illustrative', reason: 'a typical station layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'kit', label: 'the drum kit', short: 'DRUM KIT', note: 'Cymbals a few metres away: an open overhead may hear them as strongly as the maracas.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'amp', label: 'a guitar amp', short: 'AMP', note: 'Loud upstage: aim the maraca mic’s rejection, not its front, toward it.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'vocal', label: 'a vocal microphone', short: 'VOCAL MIC', note: 'A singer — perhaps the maraca player — at a vocal mic: it hears the maracas, more when a head passes near it.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'ANOTHER MIC', scene: 'kit' },
      ...stageItems('the maracas', 'Room, ensemble or percussion mics may already carry the maracas; a spot is added only if they need their own level.'),
    ],
    stage: 'LIVE: a dedicated directional spot, a projecting pair, monitors in the mic’s low-sensitivity directions — and the vocal mic’s maraca spill checked with the real gestures.',
    studio: 'RECORDING: a comfortable posture, a quiet room, one centred mic for a supportive groove; stereo only for a deliberate idea.',
  },
  diagnostic,
  practice: {
    task: 'Name the heads as the sources, cover both arcs safely, justify one mic or two, and tell instrument, room, spill and gain problems apart — then make one live change without putting hardware in either arm’s path. With a real pair and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'pair', label: 'Pair (heads, material)', kind: 'text' },
      { id: 'mics', label: 'Mics', kind: 'choice', choices: ['one centred', 'a spot per head', 'none — other mics carry them'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser', 'large condenser', 'dynamic', 'other'] },
      { id: 'zone', label: 'Distances you tried (about 40 and 80 cm)', kind: 'text' },
      { id: 'balance', label: 'Hand-to-hand balance', kind: 'text' },
      { id: 'notes', label: 'What you heard (attack, wash, room, spill)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The head (75 × 95 mm) and handle (Ø 25 mm) split of the 284.48 mm overall length — drawing defaults.', dims: ['headW', 'headH', 'handleD'] },
    { text: 'The hands’ spacing (±200 mm), the head’s arc (a pivot 170 mm below the head, ±35°) and the circular ring (40 mm) — drawing defaults.', dims: ['pairZ', 'pivot', 'stroke', 'ring'] },
    { text: 'The per-head spot band (30–60 cm) — the lesson gives no number; a drawing default. The singer’s vocal mic and its boom — ILLUSTRATIVE.', dims: [] },
  ],
  live: { wedges: standingWedges('the maracas') },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. Every pair, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a pair of maracas in two settings, a few beads standing for the seeds, mic patterns and the two-mic comb as textbook shapes, and motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.',
  copy: MAR_COPY,
  sp: {
    strikeTitle: 'Stroke to sound',
    close: { side: { u0: -340, u1: 260, v0: -1440, v1: -880 }, top: { u0: -340, u1: 260, v0: -420, v1: 420 } },
    plan: {
      box: { u0: -2600, u1: 2700, v0: -2100, v1: 2100 },
      things: [
        { id: 'maracas', kind: 'drums', u: 0, v: 0, scene: 'all' },
        { id: 'perc', kind: 'perc', u: -250, v: 1050, scene: 'all' },
        { id: 'kit', kind: 'kit', u: -1500, v: -1350, scene: 'all' },
        { id: 'amp', kind: 'amp', u: -1900, v: 950, face: 0, scene: 'all' },
        { id: 'vocal', kind: 'micstand', u: 1100, v: -1350, scene: 'all' },
        ...STAGE_THINGS,
      ],
    },
  },
};
