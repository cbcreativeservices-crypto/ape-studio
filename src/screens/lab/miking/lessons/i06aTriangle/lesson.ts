/**
 * I06a TRIANGLE — the lesson as DATA. Words from the owner's lesson
 * (docs/labs/miking/source_text/Triangle-Miking-Technique-Research.txt;
 * "L<n>" in comments only), research in docs/labs/miking/triangle/,
 * corrections in CORRECTIONS_LOG.md (TRI-01 …). Owner ruling 2026-10-04:
 * suggested starting points, no sources, brands or badges on screen. FULLY
 * SILENT. It names the percussion section and the orchestra lessons (Lab 5,
 * later) in words only — no placeholder rows.
 *
 * The 30–60 cm range is the lesson's own teaching trial (it says so); the
 * general 30 cm floor for percussion is the one published number. On screen
 * they are simply suggested starting points.
 */
import type { DiagnosticItem, Lesson, MikingScenario, LessonPages, PageContent, SourcePageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, cardioidNull, CLEAR_REASON, contactSymptom, firstNotch, gainCheck, hearingCheck, louderIsNotBetter, monoSymptom, moveRemovesDelay, PLAYER_REASON, polarityKeepsDelay, POWER_REASON, quickHearing, setupOrder, tailSymptom, type MetalWords } from '../shared/metal/metalItems.ts';
import { metalWords } from '../shared/metal/metalCopy.ts';
import { TRI_MODEL, TRI_ZONES } from './geometry.ts';

const W: MetalWords = { p: 'tri', the: 'the triangle', player: 'percussionist', loudest: 'the strongest stroke', tail: 'the ring' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the triangle',
    goal: 'Get to know the triangle — what it is, where you meet it, what it does in the music, its parts and how it is held — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A steel rod bent into a triangle with one open corner, hung freely from a clip and struck with a steel beater. It rings long and bright with no single fixed pitch — and the end of each note is played too.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a stroke becomes sound — the bar bends, rings in many shapes at once, and sends sound out all round — and why it must hang freely.',
    credit: { scenarios: ['tri.snd.1', 'tri.snd.2', 'tri.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The triangle is a bar, bent: struck, it rings in many shapes at once whose pitches are not whole-number steps apart — a shimmer, not one note. It rings only while it hangs freely; a hand on the metal stops it.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the triangle sits — the player, the beater and the damping hand, its neighbours, what a stage and a studio add — and what to do before any mic.',
    credit: { scenarios: ['tri.set.1', 'tri.set.hear', 'tri.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Ask for the whole passage: soft and strong strokes, rolls and cutoffs. The beater, the damping hand and the clip hand set the clearance; check the clip and both lines first. Protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the triangle by its properties — pattern, power, size, mount and peak handling — not by its brand.',
    credit: { scenarios: ['tri.mic.1', 'tri.mic.2', 'tri.mic.3', 'tri.mic.4', 'tri.rec.1'], note: 'Answer the five checks (one reaches back to how the triangle sounds).' },
    takeaway: 'A small condenser is a common place to start for the attack and the long ring; a dynamic can suit a loud stage. The pattern decides how much room and how many neighbours you hear. No type is required.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — about 30–60 cm from the triangle, in front and a little to one side, away from the beater — then move the mic and see what changes.',
    credit: { scenarios: ['tri.place.1', 'tri.place.2', 'tri.place.3', 'tri.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the player, in two different suggested starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Begin about 30–60 cm away, aimed at the bars as a whole, away from the beater — never inside the triangle or the beater’s path. Change one thing at a time, and listen to light and strong strokes, a roll and the cutoff.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces a loud monitor — and know when the triangle needs its own mic at all.',
    credit: { scenarios: ['tri.ctx.1', 'tri.ctx.2', 'tri.ctx.studio', 'tri.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'On a quiet stage a shared percussion mic may be enough; on a loud one a closer directional spot, outside the beater’s path, with a null aimed at the loudest monitor. If a quiet passage is buried, fix the balance on stage before raising gain.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'Add a farther, wider mic to the spot: see what polarity does and does not change, and judge the pair in mono.',
    credit: { scenarios: ['tri.two.1', 'tri.two.2', 'tri.two.3', 'tri.two.4'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Polarity flips the sign; it does not remove a delay. A spot and a wider mic hear the triangle at different times — judge them together in mono, and keep the second only if it adds something.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Look at the instrument first — a freely hanging suspension, the beater and the playing spot, a rattling clip — then the mic’s angle and distance, other open mics and the monitors, before reaching for EQ or a gate.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second mic.',
    credit: { scenarios: ['tri.prac.order', 'tri.prac.gain', 'tri.prac.setup1', 'tri.prac.setup2', 'tri.prac.3', 'tri.mix.1', 'tri.mix.2', 'tri.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'A freely hanging, safe suspension, equipment clear of the whole gesture, the player’s tone told apart from the mic’s balance, and a studio or live setup that passes the real passage — more than one setup can pass.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L5-L8 · set L6, L10, L43 · mic L11, L14 · place L10-L12 ·
 * ctx L37-L41 · two L38 · prac L70-L75. */
const scenarios: MikingScenario[] = [
  {
    id: 'tri.snd.1',
    page: 'sound',
    prompt: 'Why does a triangle sound like a shimmer rather than one clear note?',
    options: ['Its bar rings in many shapes whose pitches are not whole-number steps apart', 'The open corner lets air rush out of the triangle and whistle at its own pitch', 'The beater bounces several times on each single stroke'],
    correct: 'Its bar rings in many shapes whose pitches are not whole-number steps apart',
    explain: 'A struck bar rings in many shapes at once. For a bar held at neither end their pitches sit about 1 : 2.76 : 5.40 … — not the 1 : 2 : 3 of a plain note — so the ear hears a bright shimmer with no single fixed pitch.',
    why: {
      'The open corner lets air rush out of the triangle and whistle at its own pitch': 'There is no air column: the metal bar itself vibrates. The open corner lets the bar ring freely round its bends.',
      'The beater bounces several times on each single stroke': 'One clean stroke still shimmers: the shimmer is in the bar’s own shapes.',
    },
  },
  {
    id: 'tri.snd.2',
    page: 'sound',
    prompt: 'The player holds the triangle by its metal instead of by the clip. What happens?',
    options: ['The hand damps the bar, so the ring dies away much sooner', 'Nothing changes: the hand is far too soft to affect steel', 'It rings longer, because the hand holds it steadier'],
    correct: 'The hand damps the bar, so the ring dies away much sooner',
    explain: 'A hand on the metal soaks up its motion: overtones and ring are lost. That is why it hangs freely from a clip and a thin line — and why players close their fingers round it to stop a note on purpose.',
    why: {
      'Nothing changes: the hand is far too soft to affect steel': 'A soft hand is exactly what damps: players stop the ring this way on purpose.',
      'It rings longer, because the hand holds it steadier': 'Holding the metal damps it; hanging freely lets it ring.',
    },
  },
  {
    id: 'tri.snd.3',
    page: 'sound',
    prompt: 'Where does a struck triangle’s sound leave from?',
    options: ['All along the rod, in many directions', 'Only from the spot where the beater hit', 'Mostly from the open corner, as from a pipe'],
    correct: 'All along the rod, in many directions',
    explain: 'The whole bent bar vibrates, so sound leaves all along it. A mic aimed at the bars as a whole hears the attack and the ring together.',
    why: {
      'Only from the spot where the beater hit': 'The stroke starts there, but the whole rod rings and radiates.',
      'Mostly from the open corner, as from a pipe': 'A triangle is not a pipe: the bar itself radiates, all along its length.',
    },
  },
  {
    id: 'tri.set.1',
    page: 'setting',
    prompt: 'Before you place a triangle mic, what do you ask the player to show you?',
    options: ['The whole passage: soft and strong strokes, rolls and cutoffs', 'Only the loudest stroke, so the gain can be set from it first', 'Nothing yet: put the mic up, then fit the player round it'],
    correct: 'The whole passage: soft and strong strokes, rolls and cutoffs',
    explain: 'The beater’s path, the damping hand and the cutoffs all decide where a mic can go — and the passage, not the mic, sets them.',
    why: {
      'Only the loudest stroke, so the gain can be set from it first': 'Gain needs the loudest AND the quietest strokes — and placement needs the whole gesture, rolls and cutoffs included.',
      'Nothing yet: put the mic up, then fit the player round it': 'Never fit the player round a mic; place the mic for the player’s motion.',
    },
  },
  hearingCheck(W),
  {
    id: 'tri.set.2',
    page: 'setting',
    prompt: 'Before the first stroke, what do you check on the triangle itself?',
    options: ['The clip, and both the main line and the catch line', 'That the triangle is held tightly by its metal', 'That the open corner faces the mic for the brightest sound'],
    correct: 'The clip, and both the main line and the catch line',
    explain: 'A worn line can drop the instrument; the catch line is the backup. Leave the instrument’s care to the player — just ask.',
    why: {
      'That the triangle is held tightly by its metal': 'Held by its metal, it is damped. It hangs from a clip and a thin line.',
      'That the open corner faces the mic for the brightest sound': 'The open corner’s side is the player’s technique (on the left for a right-handed player), not a mic choice.',
    },
  },
  {
    id: 'tri.mic.1',
    page: 'microphone',
    prompt: 'Through a condenser, strong strokes sound painfully sharp. What do you look at first?',
    options: ['The beater and the playing spot, then the mic’s angle', 'A bigger condenser, which will soften the attack of each stroke', 'Lower gain, so the sharpness goes away'],
    correct: 'The beater and the playing spot, then the mic’s angle',
    explain: 'Beater mass and where the bar is struck change the attack before the mic does. Then compare a safer off-axis or a slightly wider view, at matched level.',
    why: {
      'A bigger condenser, which will soften the attack of each stroke': 'Diaphragm size is not a tone control. Start with the source, then angle and distance.',
      'Lower gain, so the sharpness goes away': 'Gain changes the level, not the balance: the sharpness stays, only quieter.',
    },
  },
  {
    id: 'tri.mic.2',
    page: 'microphone',
    prompt: 'The meter looks modest, but the strongest strokes distort. Why can that happen?',
    options: ['A slow meter can miss the brief peaks that overload the input', 'The mic distorts when the meter reads too low', 'A modest meter reading means the mic is faulty somewhere inside'],
    correct: 'A slow meter can miss the brief peaks that overload the input',
    explain: 'A struck triangle’s attack is very brief; a slow average meter reads low while the peak overloads the input. Watch a peak meter, and check every stage.',
    why: {
      'The mic distorts when the meter reads too low': 'Low level does not cause distortion; brief peaks the meter misses do.',
      'A modest meter reading means the mic is faulty somewhere inside': 'Nothing is broken: the meter is too slow for the peaks.',
    },
  },
  {
    id: 'tri.mic.3',
    page: 'microphone',
    prompt: 'The spare channel has no phantom power. Which of this page’s mics can you use?',
    options: ['The small dynamic: it needs no power', 'The small condenser, if it sits farther back', 'Either, as long as the gain is turned up'],
    correct: 'The small dynamic: it needs no power',
    explain: 'A dynamic needs no power. A condenser needs phantom power wherever it is placed.',
    why: {
      'The small condenser, if it sits farther back': 'Distance does not change what a condenser needs: it still needs phantom.',
      'Either, as long as the gain is turned up': 'Gain cannot power a condenser.',
    },
  },
  {
    id: 'tri.mic.4',
    page: 'microphone',
    prompt: 'What does the mic’s pattern mostly change for a triangle spot?',
    options: ['How much of the room and the neighbours it hears', 'How long the triangle keeps ringing after each stroke', 'Which pitch the triangle sounds when struck'],
    correct: 'How much of the room and the neighbours it hears',
    explain: 'The pattern decides how much sound from other directions — the room, the drums, the monitors — reaches the mic. The ring and the pitch belong to the triangle.',
    why: {
      'How long the triangle keeps ringing after each stroke': 'The ring is the instrument’s; a mic can only hear more or less of it against the room.',
      'Which pitch the triangle sounds when struck': 'The mic does not change the triangle’s shapes or pitch.',
    },
  },
  {
    id: 'tri.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Why point the mic at the bars as a whole rather than at the beater’s spot?',
    options: ['The whole rod rings, so the ring comes from all of it', 'The beater’s spot is the only place sound comes from', 'Sound comes out of the open corner like a pipe'],
    correct: 'The whole rod rings, so the ring comes from all of it',
    explain: 'The attack starts where the beater lands, but the whole bent bar rings. Aimed at it all — and away from the beater’s path — the mic hears attack and ring together.',
    why: {
      'The beater’s spot is the only place sound comes from': 'The stroke starts there; the ring comes from the whole rod.',
      'Sound comes out of the open corner like a pipe': 'There is no air column: the metal radiates all along its length.',
    },
  },
  {
    id: 'tri.place.1',
    page: 'placement',
    prompt: 'A starting point says about 30–60 cm. What is it measured from?',
    options: ['The triangle itself, where it is played', 'The player’s chest, wherever the triangle hangs', 'The floor, so the stand height is set first'],
    correct: 'The triangle itself, where it is played',
    explain: 'The distance belongs to the instrument in its playing position — and the mic must still stay outside the beater’s path and the hands. The number is not a safety clearance.',
    why: {
      'The player’s chest, wherever the triangle hangs': 'The triangle hangs out in front of the chest; measure from the instrument as played.',
      'The floor, so the stand height is set first': 'The floor says nothing about the distance to the sound.',
    },
  },
  {
    id: 'tri.place.2',
    page: 'placement',
    prompt: 'For more level, could you put the mic inside the triangle’s open space?',
    options: ['No — it is in the beater’s path and the motion', 'Yes — inside, it hears all three sides equally', 'Yes, as long as the mic is a small one'],
    correct: 'No — it is in the beater’s path and the motion',
    explain: 'The beater, rolls and the damping hand all work round the bars. Get closer from outside the whole gesture — never inside the triangle or the beater’s path.',
    why: {
      'Yes — inside, it hears all three sides equally': 'Even if it did, the beater and the hands work there. Clearance comes first.',
      'Yes, as long as the mic is a small one': 'Size is not the question: the beater’s path is.',
    },
  },
  {
    id: 'tri.place.3',
    page: 'placement',
    prompt: 'You move the mic from 30 to 60 cm. What tends to change?',
    options: ['More room and blend, less isolation', 'A fuller attack with less of the room', 'Nothing: the ring stays the same'],
    correct: 'More room and blend, less isolation',
    explain: 'Farther away the attack and the ring blend with the room, and the neighbours come up too. Closer tends the other way. Tendencies to check by ear, at matched level.',
    why: {
      'A fuller attack with less of the room': 'That is the closer position’s tendency.',
      'Nothing: the ring stays the same': 'The triangle’s ring is the same; what the mic hears of it against the room changes.',
    },
  },
  {
    id: 'tri.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Your stand clears the triangle where it hangs. Is that enough?',
    options: ['No — it must clear the beater, the rolls and both hands', 'Yes — the triangle is so small that this is plenty of room', 'Yes, as long as the cable is taped down'],
    correct: 'No — it must clear the beater, the rolls and both hands',
    explain: 'The triangle is small; the gesture round it is not. Check the beater’s whole path, rolls, the damping hand and the clip hand with the player.',
    why: {
      'Yes — the triangle is so small that this is plenty of room': 'Small instrument, big gesture: the beater and the hands sweep much more space.',
      'Yes, as long as the cable is taped down': 'Taping the cable is good practice, but the stand must still clear the whole gesture.',
    },
  },
  {
    id: 'tri.ctx.1',
    page: 'context',
    prompt: 'A quiet stage with a percussion mic already up. Does the triangle need its own?',
    options: ['Listen first: the shared mic may already carry it', 'Yes — each small instrument needs its own spot mic', 'No — a triangle is too quiet for a PA to help'],
    correct: 'Listen first: the shared mic may already carry it',
    explain: 'On a quiet stage a shared percussion mic may give enough triangle. Add a spot only when it is needed — each open mic adds spill and feedback risk.',
    why: {
      'Yes — each small instrument needs its own spot mic': 'More open mics mean more spill and less gain before feedback. Listen first.',
      'No — a triangle is too quiet for a PA to help': 'A loud stage may need it reinforced; the point is to decide by listening.',
    },
  },
  {
    id: 'tri.ctx.2',
    page: 'context',
    prompt: 'On a loud stage a delicate triangle passage is buried by the drums. First move?',
    options: ['Fix the balance on stage — layout and levels — before gain', 'Turn the triangle mic up until it cuts through the whole band', 'Ask the player to hit each stroke much harder'],
    correct: 'Fix the balance on stage — layout and levels — before gain',
    explain: 'Changing the stage layout, competing levels or the musical balance helps more than gain, which raises the spill and the feedback risk too. Harder strokes change the music.',
    why: {
      'Turn the triangle mic up until it cuts through the whole band': 'More gain raises the drums in that mic as well, and brings feedback closer.',
      'Ask the player to hit each stroke much harder': 'The dynamics are the music; fix the balance instead.',
    },
  },
  {
    id: 'tri.ctx.studio',
    page: 'context',
    prompt: 'An ensemble recording in one room. When does the triangle earn its own spot?',
    options: ['When the main pair or overheads do not carry it well', 'As a habit, so it can be turned up later', 'When it is the loudest instrument anywhere in the room'],
    correct: 'When the main pair or overheads do not carry it well',
    explain: 'Hear the main pair or the percussion overheads first; add a spot only for independent level, then check it with the other mics, in mono.',
    why: {
      'As a habit, so it can be turned up later': 'A spot that is not needed adds spill and can colour the sum.',
      'When it is the loudest instrument anywhere in the room': 'Loudness is not the test; what the main mics miss is.',
    },
  },
  {
    id: 'tri.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Why is a live triangle spot kept out of the player’s wedge?',
    options: ['Its attack can feed back or sound too sharp in it', 'The triangle simply cannot be heard in a wedge at all', 'A wedge changes the triangle’s pitch as it rings'],
    correct: 'Its attack can feed back or sound too sharp in it',
    explain: 'The bright, brief attack is easy to hear acoustically nearby; in a wedge it raises the feedback risk and can sound uncomfortably sharp. Send only what the player needs.',
    why: {
      'The triangle simply cannot be heard in a wedge at all': 'It can — the question is whether it helps the player, and at what risk.',
      'A wedge changes the triangle’s pitch as it rings': 'Monitors do not change the instrument’s pitch; level and feedback are the concern.',
    },
  },
  polarityKeepsDelay(W),
  firstNotch(W),
  {
    id: 'tri.two.3',
    page: 'twoMic',
    prompt: 'A triangle spot and a wider room mic are both open. What do you check?',
    options: ['Both together in mono, at the intended levels', 'Only the spot, soloed, at a high level', 'Only the room mic, since it hears more'],
    correct: 'Both together in mono, at the intended levels',
    explain: 'The two mics hear the triangle at different times. Compare them together in mono; move, re-aim or rebalance before reaching for polarity.',
    why: {
      'Only the spot, soloed, at a high level': 'Soloed, the spot hides how it combines with the other mic.',
      'Only the room mic, since it hears more': 'The combination is the question: check both together.',
    },
  },
  louderIsNotBetter(W),
  gainCheck(W),
  {
    id: 'tri.prac.3',
    page: 'practice',
    prompt: 'What would justify a second triangle mic?',
    options: ['The best single mic misses something the music needs', 'Two mics are the usual standard for a triangle', 'The triangle needs more level than one mic can give it'],
    correct: 'The best single mic misses something the music needs',
    explain: 'One mic is often enough. A second has to earn its place — a deliberate stereo image or room in a good space — and adds spill, timing and feedback risk.',
    why: {
      'Two mics are the usual standard for a triangle': 'One well-placed mic is the usual start; a second has to earn its place.',
      'The triangle needs more level than one mic can give it': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'tri.mix.1',
    page: 'practice',
    prompt: 'The triangle sounds brighter this take. How do you tell if the player or the mic made it?',
    options: ['Keep the mic still and change one thing at the source', 'Move the mic and the beater at the same time', 'Add EQ until the two takes match each other'],
    correct: 'Keep the mic still and change one thing at the source',
    explain: 'Hold the mic steady and compare two beaters or two playing spots: if the brightness follows, it came from the player. Then compare mic positions with the source held the same.',
    why: {
      'Move the mic and the beater at the same time': 'Changing two things at once hides which one made the difference.',
      'Add EQ until the two takes match each other': 'EQ hides the cause; find whether the source or the mic changed first.',
    },
  },
  cardioidNull(W),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  {
    id: 'tri.s.dull',
    observation: 'Dull, short ring',
    firstChecks: 'Is the triangle touching a hand or a thick support? Is the line in good order?',
    options: ['Whether it hangs freely, and the line and grip', 'Turn the mic toward the triangle a little more', 'Add high-frequency EQ to bring the ring back'],
    correct: 'Whether it hangs freely, and the line and grip',
    explain: 'No mic position restores overtones a poor suspension has already damped. Let it hang freely again first.',
    why: {
      'Turn the mic toward the triangle a little more': 'The ring is missing at the source; aiming cannot bring it back.',
      'Add high-frequency EQ to bring the ring back': 'EQ cannot restore a ring the metal never made.',
    },
  },
  {
    id: 'tri.s.tick',
    observation: 'A sharp tick, little body',
    firstChecks: 'Is the beater or the playing spot making it — or is the mic too direct?',
    options: ['The beater and spot, then a safer mic angle', 'Push the mic closer to catch more of the body', 'Cut the treble on the desk straight away'],
    correct: 'The beater and spot, then a safer mic angle',
    explain: 'Compare suitable beaters and playing spots with the player, then a safe angle or distance — one change at a time.',
    why: {
      'Push the mic closer to catch more of the body': 'Closer tends to more attack, not more body.',
      'Cut the treble on the desk straight away': 'Find whether it starts at the source or the mic before EQ.',
    },
  },
  {
    id: 'tri.s.rattle',
    observation: 'Clip, stand or cable rattle',
    firstChecks: 'Does it happen with the mic out of use too?',
    options: ['Whether it happens with the mic out of use', 'Switch to a mic with a narrower pattern', 'Gate the channel so the rattle is cut off'],
    correct: 'Whether it happens with the mic out of use',
    explain: 'A rattle that happens anyway is mechanical: steady and isolate the support, and secure the cable without damping the triangle.',
    why: {
      'Switch to a mic with a narrower pattern': 'A rattle at the instrument is heard whatever the pattern.',
      'Gate the channel so the rattle is cut off': 'A gate would cut the ring too. Fix the mechanical cause.',
    },
  },
  {
    id: 'tri.s.roll',
    observation: 'A roll is uneven in level',
    firstChecks: 'Does the instrument swing toward and away from the mic, or do the strokes differ?',
    options: ['Whether it swings, or the strokes differ', 'Compress the channel until the roll is even', 'Ask the player to roll on one bar only'],
    correct: 'Whether it swings, or the strokes differ',
    explain: 'Rehearse the roll and cover both bars of the corner from a safe position.',
    why: {
      'Compress the channel until the roll is even': 'Processing hides a placement problem; find the physical cause first.',
      'Ask the player to roll on one bar only': 'The roll is the player’s technique: cover both bars instead.',
    },
  },
  tailSymptom(W),
  {
    id: 'tri.s.spill',
    observation: 'The spot mainly hears the cymbals',
    firstChecks: 'Is the triangle-to-spill ratio too low?',
    options: ['Move the player and mic, or re-aim the pattern', 'Turn the triangle spot up much louder', 'Ask the drummer to stop playing the cymbals'],
    correct: 'Move the player and mic, or re-aim the pattern',
    explain: 'Relocate the player and the mic, aim the pattern’s rejection at the cymbals — or use the main pickup only.',
    why: {
      'Turn the triangle spot up much louder': 'More gain raises the cymbals in that mic too.',
      'Ask the drummer to stop playing the cymbals': 'The music sets what is played; change the geometry.',
    },
  },
  monoSymptom(W),
  contactSymptom(W, 'the beater'),
];

const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a suggested starting point, about 30–60 cm from the triangle', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };

const setupTasks: SetupTask[] = [
  {
    id: 'tri.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A quiet studio overdub: one triangle part with soft strokes, a roll and a damped cutoff. The room sounds good. Phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser about 40 cm in front and to one side, a little above, aimed at the bars', ok: true, power: 'phantom', feedback: 'A suggested starting point, clear of the beater; it needs the phantom this channel has.' },
      { id: 'b', label: 'Small condenser about 70 cm away, seeing the whole triangle, in the good room', ok: true, power: 'phantom', feedback: 'A wider view for the shimmer — check the soft strokes and the cutoff stay clear.' },
      { id: 'c', label: 'A mic inside the triangle’s open space, for the most level', ok: false, power: 'phantom', feedback: 'That is in the beater’s path and the rolls.' },
      { id: 'd', label: 'Ask the player to hold the triangle by its metal so it stays still', ok: false, power: 'none', feedback: 'Holding the metal damps the ring — and the player’s technique is never changed for a mic.' },
      { id: 'e', label: 'A gate on the channel to cut the room between strokes', ok: false, power: 'phantom', feedback: 'A gate would cut the ring and the damped cutoff the music needs.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.peak', label: 'Gain is set from the strongest stroke, then checked on the soft ones', role: 'optional', feedback: 'A fair reason — and good practice.' }, BRAND_REASON, PLAYER_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point measured from the triangle, outside the whole gesture, with the power the mic needs.',
  },
  {
    id: 'tri.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud band: the percussionist plays a held triangle at a set station, with monitors on stage. The spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'Small dynamic about 35 cm in front and to one side, outside the beater’s path, its back to the wedge', ok: true, power: 'none', feedback: 'A closer directional spot, clear of the gesture; a dynamic needs no phantom.' },
      { id: 'b', label: 'No triangle spot: rely on the shared percussion mic, with the stage levels balanced', ok: true, power: 'none', feedback: 'Fair, if the shared mic carries it once the stage balance is fixed.' },
      { id: 'c', label: 'Small condenser in front of the triangle', ok: false, power: 'phantom', feedback: 'This input has no phantom, and a condenser needs it.' },
      { id: 'd', label: 'A mic in the beater’s path, as close as it can get', ok: false, power: 'none', feedback: 'Never in the beater’s path — clearance comes first.' },
      { id: 'e', label: 'Ask the player to strike much harder so the mic hears it', ok: false, power: 'none', feedback: 'Harder strokes change the music; fix the balance instead.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.null', label: 'The pattern’s rejection is aimed at the loudest monitor', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, PLAYER_REASON],
    explain: 'Two setups pass. What passes is the reasoning: coverage of the real station, outside the beater’s path, powered by what this input can supply — or no spot when the shared mic carries it.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: the beater strikes the base. Which part of the triangle rings?', options: ['The whole bent rod', 'Only the base', 'Only the corner by the beater'], after: 'Now STEP through the stroke (or PLAY ONCE), then try the bar’s shapes.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the mic from 30 cm to 60 cm. What changes most?', options: ['More room, less isolation', 'More attack', 'Nothing'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge sits downstage, behind the mic. Can a cardioid’s null reach it?', options: ['Yes — its back can face the wedge', 'No — only an omni can', 'It is already at the side'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'tri.q.1',
    covers: 'instrument',
    prompt: 'How is a concert triangle held so that it rings?',
    options: ['Hung freely from a clip by a thin line', 'Gripped firmly by one of its corners', 'Laid flat on a padded table'],
    correct: 'Hung freely from a clip by a thin line',
    explain: 'It hangs freely from a clip and a thin line (with a catch line as a backup); holding the metal damps it.',
    why: {
      'Gripped firmly by one of its corners': 'A hand on the metal damps the ring.',
      'Laid flat on a padded table': 'Padding damps it too; it hangs freely to ring.',
    },
  },
  {
    id: 'tri.q.2',
    covers: 'instrument',
    prompt: 'Where is a held triangle usually struck?',
    options: ['The base, or the outside of the side by the closed corner', 'Right beside the open corner, on either of the two straight bars', 'Inside the top corner, right where the clip holds it'],
    correct: 'The base, or the outside of the side by the closed corner',
    explain: 'The base and the outside of the side joined at the closed corner are common playing areas; players usually avoid the open corner for ordinary playing.',
    why: {
      'Right beside the open corner, on either of the two straight bars': 'That is the spot players usually avoid for ordinary playing.',
      'Inside the top corner, right where the clip holds it': 'The clip hand is there; the base and the closed-corner side are the usual areas.',
    },
  },
  {
    id: 'tri.q.3',
    covers: 'sound',
    prompt: 'Why has a triangle no single fixed pitch?',
    options: ['Its bar’s shapes ring at pitches not in whole-number steps', 'The open corner lets the pitch slowly leak away while it rings', 'It is retuned to a new note before each concert'],
    correct: 'Its bar’s shapes ring at pitches not in whole-number steps',
    explain: 'A struck bar rings in many shapes whose pitches are not 1 : 2 : 3 — the ear hears a shimmer, not a note.',
    why: {
      'The open corner lets the pitch slowly leak away while it rings': 'The open corner lets the bar ring freely; the shimmer comes from its shapes.',
      'It is retuned to a new note before each concert': 'It is not tuned to a note; the shimmer is the bar’s nature.',
    },
  },
  {
    id: 'tri.q.4',
    covers: 'sound',
    prompt: 'The player closes their fingers round the triangle after a note. What is that?',
    options: ['A played cutoff — part of the music', 'A mistake the mic should hide', 'A way to make the ring louder'],
    correct: 'A played cutoff — part of the music',
    explain: 'Letting the ring decay and damping it are different musical actions. The mic should reveal the ring and the release — so no gate that cuts the tail.',
    why: {
      'A mistake the mic should hide': 'The cutoff is played on purpose; the mic should let it be heard.',
      'A way to make the ring louder': 'Fingers on the metal stop the ring.',
    },
  },
  {
    id: 'tri.q.5',
    covers: 'setting',
    critical: true,
    prompt: 'Placing a mic near a held triangle, what comes before every distance?',
    options: ['The beater’s path, the rolls and both hands', 'The exact distance that the starting point names', 'The shortest cable run back to the stage box'],
    correct: 'The beater’s path, the rolls and both hands',
    explain: 'Clearance takes priority over every number: keep the capsule, stand and cable outside the whole gesture.',
    why: {
      'The exact distance that the starting point names': 'The numbers are starting points; the gesture’s clearance comes first.',
      'The shortest cable run back to the stage box': 'A tidy cable matters, but never before the player’s space.',
    },
  },
  quickHearing(W),
];

export const I06A_LESSON: Lesson = {
  id: 'I06a',
  labId: 'percussion',
  title: 'Triangle',
  subtitle: 'A bent steel bar hung freely: attack, a long ring and the cutoff',
  noun: { one: 'triangle', many: 'triangles' },
  model: TRI_MODEL,
  micTypeIds: ['sdcCard', 'smallDynCard'],
  zones: TRI_ZONES,
  setupPairs: [{ label: 'A spot mic and a wider mic', A: { zone: 'tri.A', typeId: 'sdcCard' }, B: { zone: 'tri.C', typeId: 'sdcCard' } }],
  pages,
  scenarios,
  symptoms,
  orderTasks: [setupOrder(W, { text: 'Watch the whole passage with the player: strokes, rolls, cutoffs', early: 'Start with the player and the music.' })],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A steel rod bent into a triangle, with one corner left open. It hangs freely from a clip by a thin line and is struck with a steel beater. The metal itself vibrates: an idiophone.', src: 'PAS-ECV01' },
    { title: 'WHERE YOU MEET IT', text: 'In orchestras, concert bands and percussion sections, in the studio and on stage — often one of several small instruments a percussionist moves between. (Whole percussion sections and the orchestra come later, in Lab 5.)', src: 'LESSON-TRI' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Bright accents, a long shimmering ring, rolls inside a closed corner — and cutoffs, when the player closes their fingers round it. The end of each note is played too.', src: 'PAS-1906' },
    { title: 'ITS SIZE', text: 'Concert triangles run from about 10 to 30 cm (4–12 in) a side; 15–23 cm (6–9 in) is typical. This lab draws an 8 in (20 cm) triangle of ½ in (13 mm) steel rod.', src: 'PAS-ECV01' },
  ],
  sound: {
    stages: [
      { title: 'The beater strikes', text: 'The steel beater strikes the base with a push away from the player. That brief contact is where the ATTACK begins.', byVariant: { mounted: 'A beater (or two) strikes a lower side of the mounted triangle. That brief contact is where the ATTACK begins.' } },
      { title: 'The bar bends', text: 'The rod bends in its lowest shapes — drawn here much larger than it really moves. The triangle is a bar, bent round two corners.' },
      { title: 'It rings in many shapes', text: 'The whole rod rings in many shapes at once. Their pitches are not whole-number steps apart, so the ear hears a bright shimmer — no single fixed pitch.' },
      { title: 'Sound leaves all round', text: 'Sound leaves all along the rod, in many directions. Hanging freely from its line, it rings on — until the player lets it fade or closes their fingers round it.' },
    ],
    attack: 'The start of each stroke: the steel beater’s brief contact with the bar. A mic close to where the beater lands, or aimed straight at it, tends to hear more of a metallic tick; the beater and the spot change it before the mic does.',
    body: 'The long ring after the stroke: the whole bent bar shimmering, from all along its length — until the player lets it fade or damps it. A mic aimed at the bars as a whole hears attack and ring together. Tendencies — triangles, beaters and players vary.',
    head: { diameterMm: 203.2, rods: 0, label: 'an 8 in triangle', strikeSrc: 'PAS-1906' },
  },
  setting: {
    items: [
      { id: 'triangle', label: 'the triangle, in front of the chest', short: 'TRIANGLE', note: 'Hung from its clip out in front of the player’s chest, the open corner on the player’s left. The beater works on the player’s right, the clip hand above.', prov: { kind: 'illustrative', reason: 'a typical hold: the posture is a drawing default' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'player', label: 'the player, the beater and both hands', short: 'PLAYER', note: 'The beater, rolls inside the closed corner, the damping fingers and the clip hand: their whole path is the player’s space. No mic, stand or cable in it.', prov: { kind: 'illustrative', reason: 'a standing player: a drawing default' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'wedge', label: 'a floor wedge downstage', short: 'WEDGE', note: 'Live, a floor monitor on the audience side, facing back toward the player — behind a mic that faces the triangle, where a pattern’s null can help.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'band', label: 'the drums and louder players', short: 'DRUMS · BAND', note: 'Cymbals and drums nearby are far louder than a triangle: the reason for a closer directional spot — or a better stage balance.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'stage' },
      { id: 'audience', label: 'the audience and the PA', short: 'AUDIENCE · PA', note: 'Listen from here first, without amplification. The mic usually comes from this side.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'MIC SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a good, quiet room, a wider mic can add the shimmer’s space. Record the pauses too: clip noises and the room show up there.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors, louder players and a PA. A quiet stage may need no triangle spot; a loud one a closer directional spot, outside the beater’s path, with its null toward the loudest wedge.',
    studio: 'STUDIO: time to compare, and a room that may add the shimmer’s space — one mic is often enough. Record the whole phrase, pauses included.',
  },
  diagnostic,
  practice: {
    task: 'Keep the suspension freely hanging and safe, keep the equipment clear of the whole gesture, tell the player’s tone from the mic’s balance, and choose a studio or live setup that passes the real passage. With a player’s agreement, log what you tried below.',
    fields: [
      { id: 'inst', label: 'Triangle (size, how it hung, beater)', kind: 'text' },
      { id: 'played', label: 'How it was played', kind: 'choice', choices: ['held', 'mounted', 'both in the piece'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser', 'small dynamic', 'other'] },
      { id: 'zone', label: 'Starting position you tried (distance, angle)', kind: 'text' },
      { id: 'peak', label: 'Headroom on the strongest stroke', kind: 'text' },
      { id: 'notes', label: 'What you heard: attack, ring, cutoff, room (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The open corner’s gap (15 mm), the held height (1250 mm, "in front of the chest"), eye level (1600 mm), the line’s length (40 mm) and a beater’s diameter (6 mm) — drawing defaults.', dims: ['gap', 'holdH', 'eyeH', 'line', 'beaterD'] },
    { text: 'The beater’s path, the clip hand and the player’s position are ILLUSTRATIVE keep-outs for the owner to check.', dims: [] },
    { text: 'The 30–60 cm starting range and the wider 60–100 cm view are the lesson’s own trials; the one published number is a general 30 cm floor for percussion.', dims: [] },
    { text: 'Held at the chest (one teaching source) or at eye level (another): both are players’ choices; the chest hold is drawn (owner TRI-D2).', dims: [] },
  ],
  live: {
    wedges: [
      { id: 'wedge', label: 'a floor wedge downstage, facing back toward the player', short: 'WEDGE', p: { x: 1600, y: 0, z: -350 }, lift: 150, faces: { x: -1, y: 0, z: 0.2 }, note: 'On the audience side, behind a mic that faces the triangle — the case a pattern’s null can help with.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
      { id: 'side', label: 'a side-fill monitor across the stage', short: 'SIDE FILL', p: { x: 300, y: 0, z: 1600 }, lift: 150, faces: { x: 0, y: 0, z: -1 }, note: 'Off to the player’s right, roughly beside the mic’s front: no pattern’s null reaches it. Distance and level do the work.', prov: { kind: 'illustrative', reason: 'a typical stage layout' } },
    ],
  },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. There is no single agreed triangle miking standard: these starting points come from how microphones behave and a general 30 cm floor for percussion, and every triangle, beater, player and room is different. Move the mic, experiment, and trust your ears. The lab is silent and draws a simplified picture: one 8 in triangle, a standing player, the bar’s shapes drawn on the straight bar it was bent from, motion drawn much larger, mic patterns as textbook shapes. Distances are rounded to about 5 mm and measured to the mic’s front. Keep clear of the beater and the hands.',
  copy: { words: metalWords('triangle', 'percussionist') },
};
