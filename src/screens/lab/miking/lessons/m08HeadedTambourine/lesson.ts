/**
 * M08 HEADED TAMBOURINE — the lesson's pages as DATA (blueprint §7). Words
 * from the owner's lesson (docs/labs/miking/source_text/Headed-Tambourine-
 * Miking-Technique-Research.txt, "L<n>" in COMMENTS only) with the fixes in
 * CORRECTIONS_LOG.md (TB-xx) applied. It cross-links the headless tambourine
 * and jingles lesson (I04, Lab 2 — later): named in words only until it
 * exists (no placeholder rows). OWNER RULING 2026-10-04: starting points; no
 * source, brand or model in learner text; no badges; FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, PageContent, PageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, cardioidNull, CLEAR_REASON, contactSymptom, firstNotch, gainCheck, hearingCheck, louderIsNotBetter, monoSymptom, moveRemovesDelay, polarityKeepsDelay, POWER_REASON, quickHearing, setupOrder, type Words } from '../shared/concert/commonItems.ts';
import { TAMB_MODEL } from './geometry.ts';
import { TAMB_ZONES } from './model.ts';
import { TAMB_COPY } from './copy.ts';

const W: Words = { p: 'tb', the: 'the tambourine', player: 'percussionist', loudest: 'the loudest shake' };

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the headed tambourine',
    goal: 'Get to know the headed tambourine — what it is, where you meet it, what it does in the music, its parts and how it is played — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A drum and a set of jingles in one instrument: a skin head on a wooden frame, with pairs of metal jingles round it. Held and struck, shaken, or mounted — and it moves while it plays.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a stroke or a shake becomes sound — the head, the frame, the jingles — and where the sound leaves. Shown, never played.',
    credit: { scenarios: ['tb.snd.1', 'tb.snd.2', 'tb.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'Striking drives the head’s low and mid body (from both faces — the back is open) and jostles the jingles; shaking drives the jingles’ bright clash and barely moves the head. A mic hears more of what it is closer to and faces.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the tambourine sits in the orchestra — its neighbours, the player’s space and moves, what an amplified stage and a recording add — and what to do before any mic.',
    credit: { scenarios: ['tb.set.1', 'tb.set.hear', 'tb.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Ask for the whole phrase and every station the player uses. The player’s motion sets the clearance; nothing is clipped to the instrument. Protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the tambourine by its properties — pattern, power, size, mount and peak handling — not by its brand.',
    credit: { scenarios: ['tb.mic.1', 'tb.mic.2', 'tb.mic.3', 'tb.mic.4', 'tb.rec.1'], note: 'Answer the five checks (one reaches back to how the tambourine sounds).' },
    takeaway: 'Condensers, dynamics and ribbons can all work; the real response, pattern, peak handling and coverage of the motion matter more than a type’s reputation. Watch peaks, not averages.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — about 15–30 cm from the tambourine, outside the whole motion — then aim at the head or the rim and see what changes.',
    credit: { scenarios: ['tb.place.1', 'tb.place.2', 'tb.place.3', 'tb.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'One mic outside the whole motion, about 15–30 cm away, is the place to begin — then the head for body or the rim for jingle. It is a starting point, not a safety clearance, and the player’s motion is never changed for it.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s real rejection faces a loud unwanted source — and know when one mic serves a whole percussion station.',
    credit: { scenarios: ['tb.ctx.1', 'tb.ctx.2', 'tb.ctx.studio', 'tb.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the downstage wedge sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Aim nulls by the real pattern. A fixed directional mic covers a fixed station; a wider one covers movement but hears more of the stage. No universal filter or limiter suits every tambourine.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See how the arrival-time difference between two mics places comb-filter notches — and what polarity does and does not change.',
    credit: { scenarios: ['tb.two.1', 'tb.two.2', 'tb.two.3', 'tb.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Polarity flips the sign; it does not remove a delay — and a moving tambourine changes the delay with every shake. If the best single mic conveys the part, a second is usually unnecessary.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — aim, distance, the frame’s motion toward the mic, peak headroom, clearance and other open mics — before reaching for tone controls or asking the player to change.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second mic.',
    credit: { scenarios: ['tb.prac.order', 'tb.prac.gain', 'tb.prac.setup1', 'tb.prac.setup2', 'tb.prac.3', 'tb.mix.1', 'tb.mix.2', 'tb.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'Naming head and jingles, one mic that covers the real motion, two tonal perspectives explained, no transient overload, and studio and live checks in mono pass — and more than one setup can pass.',
  },
};

/* THE CHECKS. Lesson refs (comments only): tb.snd.* L8, L36-L37 · tb.set.* L9-L10, L60 ·
 * tb.mic.* L38 · tb.place.* L15-L37 · tb.ctx.* L41-L56 · tb.two.* L59 · tb.prac.* / tb.mix.*
 * L58-L68. */
const scenarios: MikingScenario[] = [
  {
    id: 'tb.snd.1',
    page: 'sound',
    prompt: 'What makes a headed tambourine different from a headless one?',
    options: ['The head adds a low and mid body to the jingles’ bright edge', 'The head makes the jingles louder by holding them more tightly', 'Nothing: the jingles make all of the sound a tambourine makes'],
    correct: 'The head adds a low and mid body to the jingles’ bright edge',
    explain: 'A headed tambourine is a drum (the head) and a set of jingles in one: the head brings low and mid frequencies as well as the jingles’ highs.',
    why: {
      'The head makes the jingles louder by holding them more tightly': 'The jingles sit loose on pins in the frame; the head is a separate source with its own body.',
      'Nothing: the jingles make all of the sound a tambourine makes': 'That is closer to a headless tambourine. The head adds its own low and mid body.',
    },
  },
  {
    id: 'tb.snd.2',
    page: 'sound',
    prompt: 'The player shakes the tambourine instead of striking it. What leads the sound?',
    options: ['The jingles, thrown against each other; the head barely moves', 'The head, pushed in and out by each change of direction', 'The frame’s wood, ringing like the shell of a snare drum'],
    correct: 'The jingles, thrown against each other; the head barely moves',
    explain: 'Shaking moves the frame; the loose jingles lag and clash. The head hardly moves, so shaking favours the bright metallic part of the sound.',
    why: {
      'The head, pushed in and out by each change of direction': 'A shake moves the whole frame; the head barely bends. The jingles clash.',
      'The frame’s wood, ringing like the shell of a snare drum': 'The thin frame is mostly a holder; the jingles carry a shake’s sound.',
    },
  },
  {
    id: 'tb.snd.3',
    page: 'sound',
    prompt: 'Why does a tambourine’s head radiate from its back face as well as its front?',
    options: ['The frame is open at the back, so both faces meet the air', 'The jingles carry the head’s sound round to the back', 'A second, thinner head is fixed inside the frame'],
    correct: 'The frame is open at the back, so both faces meet the air',
    explain: 'There is only one head and no shell closing the back: as the head moves, both its faces push on the air.',
    why: {
      'The jingles carry the head’s sound round to the back': 'The jingles are their own source; the head radiates from both faces because the back is open.',
      'A second, thinner head is fixed inside the frame': 'A tambourine has one head; the back is open.',
    },
  },
  {
    id: 'tb.set.1',
    page: 'setting',
    prompt: 'Before you place a tambourine mic, what do you ask the player to show you?',
    options: ['The whole phrase: strikes, shakes, rolls and moves between stations', 'Just the loudest single hit, so that the gain can be set from it first of all', 'Nothing yet: put the mic up, then adjust the player to fit it'],
    correct: 'The whole phrase: strikes, shakes, rolls and moves between stations',
    explain: 'The motion, the loudest and quietest moments and the moves between stations all decide where a mic can go — and the music, not the mic, sets them.',
    why: {
      'Just the loudest single hit, so that the gain can be set from it first of all': 'Gain needs the loudest AND the quietest moments — and placement needs the whole motion.',
      'Nothing yet: put the mic up, then adjust the player to fit it': 'Never adjust the player to fit a mic; place the mic for the player’s motion.',
    },
  },
  hearingCheck(W, 'setting', 'tb.set.hear'),
  {
    id: 'tb.set.2',
    page: 'setting',
    prompt: 'A clip would hold a mic right on the tambourine’s frame. Is that a good idea?',
    options: ['Only with hardware made for it and the owner’s agreement', 'Yes — on the frame, the mic moves with the instrument', 'Yes, as long as the clip is small and light enough'],
    correct: 'Only with hardware made for it and the owner’s agreement',
    explain: 'Nothing is attached to the instrument, or touches the head or the jingles, unless the hardware is expressly compatible and the owner agrees.',
    why: {
      'Yes — on the frame, the mic moves with the instrument': 'It might, but an unsuitable clip can damage the frame or mute the jingles. Compatibility and permission come first.',
      'Yes, as long as the clip is small and light enough': 'Size is not the question: compatibility and the owner’s agreement are.',
    },
  },
  {
    id: 'tb.mic.1',
    page: 'microphone',
    prompt: 'Through a condenser, the jingles sound too cutting. What could you try?',
    options: ['Distance and angle first, then perhaps a gentler-sounding mic', 'A bigger condenser, which will make the jingles softer', 'Turn the gain down until the jingles stop sounding quite so harsh'],
    correct: 'Distance and angle first, then perhaps a gentler-sounding mic',
    explain: 'Moving back or angling away often tames brightness; a dynamic or a ribbon (kept well out of the swing) can give a different balance — judged by ear.',
    why: {
      'A bigger condenser, which will make the jingles softer': 'Diaphragm size is not a tone control. Try distance and angle first.',
      'Turn the gain down until the jingles stop sounding quite so harsh': 'Gain changes the level, not the balance; the jingles stay just as harsh, only quieter.',
    },
  },
  {
    id: 'tb.mic.2',
    page: 'microphone',
    prompt: 'The meter on the channel looks modest, but the shakes distort. Why can that happen?',
    options: ['A slow meter can miss the brief peaks that overload the input', 'The mic distorts when the level is too low on the meter', 'A modest meter reading means the mic is broken somewhere inside it'],
    correct: 'A slow meter can miss the brief peaks that overload the input',
    explain: 'Hand percussion makes very brief peaks; a slow average (VU-style) meter can read low while they overload the input. Use a peak meter.',
    why: {
      'The mic distorts when the level is too low on the meter': 'Low level does not cause distortion; brief peaks the meter misses do.',
      'A modest meter reading means the mic is broken somewhere inside it': 'Nothing is broken: the meter is too slow for the peaks.',
    },
  },
  {
    id: 'tb.mic.3',
    page: 'microphone',
    prompt: 'The channel you are given has no phantom power. Which of this page’s mics can you use?',
    options: ['The small dynamic: it needs no power to work', 'The small condenser, if it sits farther back', 'Either one, as long as the channel gain is turned up'],
    correct: 'The small dynamic: it needs no power to work',
    explain: 'Dynamic mics need no power. The small condenser needs phantom power wherever it is placed.',
    why: {
      'The small condenser, if it sits farther back': 'Distance does not change what a condenser needs: it still needs phantom power.',
      'Either one, as long as the channel gain is turned up': 'Gain cannot power a condenser. It needs phantom power from the desk.',
    },
  },
  {
    id: 'tb.mic.4',
    page: 'microphone',
    prompt: 'A player moves round a station while playing. Why might a wider pattern help — and cost?',
    options: ['It covers the moving instrument but hears more of the stage', 'It rejects the stage better because it hears more of the player', 'It costs nothing: a wider pattern simply hears the player better'],
    correct: 'It covers the moving instrument but hears more of the stage',
    explain: 'A cardioid helps against some spill; a wider pattern covers more movement but hears more of everything around it — a trade-off to choose for the room and the show.',
    why: {
      'It rejects the stage better because it hears more of the player': 'A wider pattern rejects less, not more; it hears more of the stage.',
      'It costs nothing: a wider pattern simply hears the player better': 'The cost is spill — and on a loud stage, less gain before feedback.',
    },
  },
  {
    id: 'tb.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic aimed at the rim and jingles, edge-on, hears more of what?',
    options: ['The jingles’ bright, metallic attack', 'The head’s low and mid body', 'The room around the player and the stage'],
    correct: 'The jingles’ bright, metallic attack',
    explain: 'The jingles sit round the frame; edge-on and close, the mic hears more of them. The head’s body leaves from its faces — a tendency to check by ear.',
    why: {
      'The head’s low and mid body': 'The head radiates from its faces; aimed at it, a mic hears more body.',
      'The room around the player and the stage': 'Close to the instrument, the tambourine is far louder than the room.',
    },
  },
  {
    id: 'tb.place.1',
    page: 'placement',
    prompt: 'A starting point says about 15–30 cm. What is it measured from?',
    options: ['The tambourine itself, as it is actually held and played', 'The player’s chest, wherever the tambourine happens to be', 'The floor, so that the mic stand can be set first'],
    correct: 'The tambourine itself, as it is actually held and played',
    explain: 'The distance belongs to the instrument in its playing position — and the mic must still stay outside the whole motion. The number is not a safety clearance.',
    why: {
      'The player’s chest, wherever the tambourine happens to be': 'The tambourine sits in front of the chest; measure from the instrument as played.',
      'The floor, so that the mic stand can be set first': 'The floor says nothing about the distance to the sound source.',
    },
  },
  {
    id: 'tb.place.2',
    page: 'placement',
    prompt: 'Alternate beats jump up and down in level. What is the likely physical cause?',
    options: ['The frame moving toward and away from the mic', 'The jingles wearing out after a few strokes', 'The mic’s pattern changing between beats'],
    correct: 'The frame moving toward and away from the mic',
    explain: 'A held tambourine that swings toward the mic on one stroke and away on the next changes level a lot. Place for the whole arc; a sideways motion can be steadier — if the player chooses it.',
    why: {
      'The jingles wearing out after a few strokes': 'Jingles do not wear out in a phrase; the distance to the mic is changing.',
      'The mic’s pattern changing between beats': 'A mic’s pattern is fixed; the instrument’s position is what changes.',
    },
  },
  {
    id: 'tb.place.3',
    page: 'placement',
    prompt: 'You want more of the head and less jingle. What do you change?',
    options: ['The mic’s aim and distance, toward the head — not the grip', 'Ask the player to hold the tambourine at a flatter angle', 'Turn the mic away from it and add some low-mid boost on the desk'],
    correct: 'The mic’s aim and distance, toward the head — not the grip',
    explain: 'Aim toward the head as it is presented during strikes, keeping clear of the hand. The 45° hold is the player’s technique, not a mic angle.',
    why: {
      'Ask the player to hold the tambourine at a flatter angle': 'Never change the player’s technique for a mic; move the mic.',
      'Turn the mic away from it and add some low-mid boost on the desk': 'EQ cannot add a head the mic does not hear; aim at it first.',
    },
  },
  {
    id: 'tb.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Your stand clears the tambourine at rest. Is that enough?',
    options: ['No — it must clear the whole arm, hand and shake motion', 'Yes — a tambourine is small, so a spot clear at rest is safe enough', 'Yes, provided the cable is taped down to the floor'],
    correct: 'No — it must clear the whole arm, hand and shake motion',
    explain: 'The rest position says little: strikes, shakes and moves sweep a much bigger space. Check the whole motion with the player.',
    why: {
      'Yes — a tambourine is small, so a spot clear at rest is safe enough': 'Small instrument, big motion: the arm and the shake sweep far more space.',
      'Yes, provided the cable is taped down to the floor': 'A taped cable is good practice, but the stand must still clear the whole motion.',
    },
  },
  {
    id: 'tb.ctx.1',
    page: 'context',
    prompt: 'A live tour: the percussionist plays shakers and tambourine at one station. A common approach?',
    options: ['One directional mic for the station, plus wider section mics', 'A separate close mic on each of the small instruments they hold', 'No mic at all, because hand percussion is quiet'],
    correct: 'One directional mic for the station, plus wider section mics',
    explain: 'One directional mic can serve a whole station of small instruments, with broader mics over the section — fewer open mics, less spill.',
    why: {
      'A separate close mic on each of the small instruments they hold': 'Each open mic adds spill and feedback risk; one station mic often covers them.',
      'No mic at all, because hand percussion is quiet': 'Quiet against a loud band, yes — that is why a station mic helps live.',
    },
  },
  {
    id: 'tb.ctx.2',
    page: 'context',
    prompt: 'Live, would a fixed high-pass filter for every headed tambourine be a good rule?',
    options: ['No — the head carries useful low and mid; judge each one', 'Yes — tambourines make no sound below the jingles', 'Yes, and add a hard limiter for all of the jingle peaks too'],
    correct: 'No — the head carries useful low and mid; judge each one',
    explain: 'A headed tambourine’s head may carry musically important low and mid. Any live filter is judged by the full sound and the feedback behaviour at the intended level.',
    why: {
      'Yes — tambourines make no sound below the jingles': 'A headed tambourine’s head makes low and mid sound; a blanket filter can remove it.',
      'Yes, and add a hard limiter for all of the jingle peaks too': 'No universal limiter setting suits every tambourine; set gain for the peaks first.',
    },
  },
  {
    id: 'tb.ctx.studio',
    page: 'context',
    prompt: 'An ensemble recording in one room. When does the tambourine earn its own spot?',
    options: ['When the room mics miss its rhythmic definition or head body', 'As a habit, so that it can be turned up in the mix later on', 'When it is the loudest instrument heard anywhere in the room'],
    correct: 'When the room mics miss its rhythmic definition or head body',
    explain: 'Listen to the existing mics first; add a single spot only for what is missing — a spot can pull the tambourine too close in the image.',
    why: {
      'As a habit, so that it can be turned up in the mix later on': 'A spot that is not needed adds spill and image problems.',
      'When it is the loudest instrument heard anywhere in the room': 'Loudness is not the test; what the room mics miss is.',
    },
  },
  {
    id: 'tb.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · The player switches from striking to shaking. What does a fixed mic hear change?',
    options: ['Less head body, more jingle — and a moving distance', 'Nothing: the same instrument makes the same sound', 'More head body, because the frame now moves more'],
    correct: 'Less head body, more jingle — and a moving distance',
    explain: 'Shaking barely moves the head and drives the jingles — and the frame now swings toward and away from the mic.',
    why: {
      'Nothing: the same instrument makes the same sound': 'Striking and shaking drive different parts: head versus jingles.',
      'More head body, because the frame now moves more': 'The frame moving does not bend the head; the jingles lead a shake.',
    },
  },
  polarityKeepsDelay(W),
  firstNotch(W),
  {
    id: 'tb.two.3',
    page: 'twoMic',
    prompt: 'A percussion overhead also hears the tambourine spot’s source. What do you check?',
    options: ['Both mics together in mono, at the intended levels', 'Only the spot, soloed, at a comfortably high level', 'Only the overhead, since it hears the whole section'],
    correct: 'Both mics together in mono, at the intended levels',
    explain: 'Overlapping mics hear the tambourine at different times. Compare them together in mono; move, re-aim or rebalance before reaching for polarity.',
    why: {
      'Only the spot, soloed, at a comfortably high level': 'Soloed, the spot hides how it combines with the overhead.',
      'Only the overhead, since it hears the whole section': 'The combination is the question: check both together.',
    },
  },
  louderIsNotBetter(W),
  gainCheck(W),
  {
    id: 'tb.prac.3',
    page: 'practice',
    prompt: 'What would justify a second, close tambourine mic?',
    options: ['The best single mic misses something the music needs', 'Two close mics are the usual standard for a tambourine', 'The tambourine needs more level than one mic gives it'],
    correct: 'The best single mic misses something the music needs',
    explain: 'If the best integrated mic already conveys the part, a second close mic is generally unnecessary — and it adds spill, timing and feedback risk.',
    why: {
      'Two close mics are the usual standard for a tambourine': 'One well-placed mic is the usual start; a second has to earn its place.',
      'The tambourine needs more level than one mic gives it': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'tb.mix.1',
    page: 'practice',
    prompt: 'A starting point says “about 15–30 cm”. What else do you need before placing the mic?',
    options: ['Where the instrument actually moves, and how to aim the mic', 'The brand of the tambourine, so the number fits its size', 'Nothing more: the number already tells you exactly where it goes'],
    correct: 'Where the instrument actually moves, and how to aim the mic',
    explain: 'The distance is from the instrument as played; the mic must clear the whole motion, and its aim (head, rim, or both) sets the balance.',
    why: {
      'The brand of the tambourine, so the number fits its size': 'The brand does not change the reference or the motion.',
      'Nothing more: the number already tells you exactly where it goes': 'A distance means nothing without the motion and the aim.',
    },
  },
  cardioidNull(W),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  {
    id: 'tb.s.bright',
    observation: 'The jingles are piercing and the head is missing',
    firstChecks: 'Is the mic aimed at the rim and metal, too close — or is the head not actually played in this passage?',
    options: ['The aim and the distance — or whether the head is played', 'Ask the player to hit the head harder for the mic', 'Cut the highs with EQ until the jingles sit back in the mix'],
    correct: 'The aim and the distance — or whether the head is played',
    explain: 'Re-aim toward an integrated head-and-rim view or back off, and check the whole passage.',
    why: {
      'Ask the player to hit the head harder for the mic': 'The music sets the strokes; aim the mic first.',
      'Cut the highs with EQ until the jingles sit back in the mix': 'EQ cannot add a head the mic does not hear; aim and distance first.',
    },
  },
  {
    id: 'tb.s.thump',
    observation: 'The head’s thump swamps the jingles’ articulation',
    firstChecks: 'The mic’s angle, and the actual hand and strike dynamics.',
    options: ['The mic’s angle: try a broader, more rim-facing view', 'Ask the player to strike the head more softly, just for the mic', 'Add a second mic aimed only at the jingles'],
    correct: 'The mic’s angle: try a broader, more rim-facing view',
    explain: 'A broader or slightly more rim-facing placement, outside the playing path, rebalances head and jingles.',
    why: {
      'Ask the player to strike the head more softly, just for the mic': 'The strokes are the music; change the mic’s angle.',
      'Add a second mic aimed only at the jingles': 'Move the one mic first; a second adds spill and timing problems.',
    },
  },
  {
    id: 'tb.s.level',
    observation: 'Alternate beats jump in level',
    firstChecks: 'Does the frame move toward and away from the mic?',
    options: ['Whether the frame swings toward and away from the mic', 'The cable, since level jumps usually sound electrical', 'A compressor setting, before looking at the player'],
    correct: 'Whether the frame swings toward and away from the mic',
    explain: 'Place the mic for the entire arc; discuss a sideways motion with the player only if it is musically acceptable to them.',
    why: {
      'The cable, since level jumps usually sound electrical': 'Watch the player first: a moving frame is the common cause.',
      'A compressor setting, before looking at the player': 'Processing hides a placement problem; find the physical cause first.',
    },
  },
  {
    id: 'tb.s.peak',
    observation: 'The quiet roll disappears but the loud shake clips',
    firstChecks: 'The peak meter and the input stage, the mic’s distance, the source’s dynamics.',
    options: ['A peak meter and the input stage, then the distance', 'Turn the fader up for the roll and down for the shake', 'Ask the player to make the roll louder and the shake softer'],
    correct: 'A peak meter and the input stage, then the distance',
    explain: 'Keep headroom for the peaks on a peak meter, adjust a safe placement, and reassess the roll at the intended level.',
    why: {
      'Turn the fader up for the roll and down for the shake': 'The clipping happens before the fader; set the input with headroom first.',
      'Ask the player to make the roll louder and the shake softer': 'The dynamics are the music; set the gain for them.',
    },
  },
  monoSymptom(W),
  contactSymptom(W),
];

const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point, about 15–30 cm from the instrument as played', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };
const GRIP_REASON: SetupReason = { id: 'r.grip', label: 'The player can change their grip to suit the mic', role: 'wrong', feedback: 'The player’s technique is never changed for a mic.' };

const setupTasks: SetupTask[] = [
  {
    id: 'tb.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A studio overdub: the player strikes and shakes a headed tambourine at one spot. The producer wants both the head and the jingles. Phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser about 20 cm in front of the tambourine, level with it, facing it', ok: true, power: 'phantom', feedback: 'The integrated starting point: head and jingles together, outside the motion; it needs the phantom this channel has.' },
      { id: 'b', label: 'Small dynamic about 25 cm along the head’s axis, beyond the striking hand', ok: true, power: 'none', feedback: 'More head body; check that the jingles are still there and the hand never nears the mic.' },
      { id: 'c', label: 'A mic 5 cm from the jingles, inside the shake’s swing', ok: false, power: 'phantom', feedback: 'That is inside the motion: the frame and the jingles would hit it.' },
      { id: 'd', label: 'A clip-on mic pressed against the head', ok: false, power: 'phantom', feedback: 'Nothing touches or mutes the head, and nothing is clipped on without compatible hardware and permission.' },
      { id: 'e', label: 'Ask the player to hold the tambourine flat and still for the mic', ok: false, power: 'none', feedback: 'The player’s grip and motion are never changed to suit a mic.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.peak', label: 'Gain is set on a peak meter, from the loudest shake and the quietest roll', role: 'optional', feedback: 'A fair reason — and good practice.' }, BRAND_REASON, GRIP_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point from the instrument as played, outside the whole motion, power that matches the mic.',
  },
  {
    id: 'tb.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A live show: the percussionist plays shakers and a headed tambourine at one station, with monitors on stage. The spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'One small dynamic for the station, aimed where the tambourine is played, outside the motion', ok: true, power: 'none', feedback: 'One directional station mic; a dynamic needs no phantom. Check spill and feedback with the operator.' },
      { id: 'b', label: 'Small dynamic about 25 cm in front of the tambourine, level with it', ok: true, power: 'none', feedback: 'The integrated starting point; a dynamic needs no phantom.' },
      { id: 'c', label: 'Small condenser in front of the tambourine', ok: false, power: 'phantom', feedback: 'This input has no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'A close mic on each small instrument at the station', ok: false, power: 'none', feedback: 'Each extra open mic adds spill and feedback risk; one station mic can cover them.' },
      { id: 'e', label: 'A fixed mic, and ask the player not to move between instruments', ok: false, power: 'none', feedback: 'The player’s movement is the music; choose coverage that fits it.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'One directional mic keeps spill and open channels down', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, GRIP_REASON],
    explain: 'Two setups pass. What passes is the reasoning: coverage of the real station and motion, outside every swing, and powered by what this input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: the hand strikes the head. What else starts to sound?', options: ['The jingles, jolted against each other', 'Nothing else — only the head sounds', 'The player’s other hand on the frame'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch the head and the jingles.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you aim the mic from straight at the instrument to edge-on at the rim. What changes?', options: ['More head body', 'More bright jingle', 'It depends on this tambourine'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge sits behind the mic and off to one side. Can a cardioid’s null reach it?', options: ['Yes — with a tilt of the mic', 'No — only an omni can', 'It is already in the null'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'tb.q.1',
    covers: 'instrument',
    prompt: 'A headed tambourine is two kinds of instrument in one. Which two?',
    options: ['A drum (the head) and jingles (metal)', 'A drum and a small cymbal on a stand', 'A shaker and a woodblock in one frame'],
    correct: 'A drum (the head) and jingles (metal)',
    explain: 'The head is a membrane, like a drum; the jingles are metal idiophones. The headless tambourine and the jingles have their own lesson in Lab 2.',
    why: {
      'A drum and a small cymbal on a stand': 'The metal parts are pairs of small jingles in slots round the frame, not a cymbal.',
      'A shaker and a woodblock in one frame': 'It is a skin head and metal jingles on a wooden frame.',
    },
  },
  {
    id: 'tb.q.2',
    covers: 'instrument',
    prompt: 'A teacher describes holding the tambourine at about 45°. What is that angle?',
    options: ['A playing technique — not a mic angle', 'The angle the mic should be set at', 'The angle of the jingles in their slots'],
    correct: 'A playing technique — not a mic angle',
    explain: 'The 45° hold blends the head and the jingles for the player. The mic is placed for the motion and the sound, not set to that angle.',
    why: {
      'The angle the mic should be set at': 'It is how the player holds the instrument; the mic angle is a separate choice.',
      'The angle of the jingles in their slots': 'It is the angle of the whole tambourine in the player’s hand.',
    },
  },
  {
    id: 'tb.q.3',
    covers: 'sound',
    prompt: 'The player shakes rather than strikes. What leads the sound?',
    options: ['The jingles clashing — the head barely moves', 'The head, which moves more than when struck', 'The frame’s wood, ringing out like a drum shell'],
    correct: 'The jingles clashing — the head barely moves',
    explain: 'A shake moves the frame; the jingles lag and clash. A strike drives the head (and jostles the jingles).',
    why: {
      'The head, which moves more than when struck': 'A shake hardly bends the head; striking does.',
      'The frame’s wood, ringing out like a drum shell': 'The jingles carry a shake’s sound.',
    },
  },
  {
    id: 'tb.q.4',
    covers: 'sound',
    prompt: 'A held tambourine swings toward a fixed mic and back on alternate strokes. What happens?',
    options: ['The level jumps between strokes', 'Nothing — the mic hears the same', 'The pitch of the head changes'],
    correct: 'The level jumps between strokes',
    explain: 'Nearer means louder at the mic; a frame moving toward and away makes alternate strokes jump in level.',
    why: {
      'Nothing — the mic hears the same': 'Distance changes level; a swinging frame changes it every stroke.',
      'The pitch of the head changes': 'The distance changes the level, not the head’s pitch.',
    },
  },
  {
    id: 'tb.q.5',
    covers: 'setting',
    prompt: 'The player moves between the tambourine and other instruments at the trap table. What does that mean for a mic?',
    options: ['Place for the real station and moves, or use wider coverage', 'Ask the player to stay at one single spot, just for the mic', 'Clip a mic to the tambourine so it follows the player'],
    correct: 'Place for the real station and moves, or use wider coverage',
    explain: 'A fixed point cannot capture a roving instrument; cover the actual station or choose wider coverage, at the cost of more spill.',
    why: {
      'Ask the player to stay at one single spot, just for the mic': 'Never require the musician to stop moving for one spot.',
      'Clip a mic to the tambourine so it follows the player': 'Nothing is clipped to the instrument without compatible hardware and permission.',
    },
  },
  quickHearing(W),
];

export const M08_LESSON: Lesson = {
  id: 'M08',
  labId: 'drums',
  title: 'Headed Tambourine',
  subtitle: 'Head and jingles: held, shaken or mounted — one mic that covers the motion',
  noun: { one: 'tambourine', many: 'tambourines' },
  model: TAMB_MODEL,
  micTypeIds: ['orchSdc', 'orchDyn'],
  zones: TAMB_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    setupOrder(W, { text: 'Watch the whole phrase with the player: strikes, shakes, rolls, moves', early: 'Start with the player and the music.' }, { text: 'Decide whether the existing mics already carry it, or one mic is needed', early: 'Hear what the existing mics give before you add one.' }),
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A frame drum and a set of jingles in one: a skin head on one face of a wooden frame, with pairs of thin metal jingles loose on pins in slots round it — here, a staggered double row. (The headless tambourine and the jingles on their own come in Lab 2.)', src: 'YMH-CPCAT' },
    { title: 'WHERE YOU MEET IT', text: 'In orchestras and concert bands, in percussion sections and on band stages — recorded close or in a room, and amplified live. It is often one of several instruments a percussionist moves between.', src: 'LESSON-TAMB' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Fingertip strikes, loud accents, shakes, thumb or finger rolls, knee-and-fist rhythms. Striking favours the head; shaking favours the jingles — and the player’s hold, often about 45°, blends the two.', src: 'PAS-ROD' },
    { title: 'ITS SIZE', text: 'Concert tambourines are often about 10 in across. This lab draws a 10 in tambourine with a skin head and a staggered double row of jingles.', src: 'YMH-CPCAT' },
  ],
  sound: {
    stages: [
      { title: 'The hand strikes', text: 'Fingertips, a hand or a fist strike the head. That brief contact is where the ATTACK begins.', byVariant: { shaken: 'The hand shakes the whole frame, or rolls a thumb or finger along the head’s edge. The ATTACK comes from the jingles.', mounted: 'A stick (or a hand) strikes the head of the mounted tambourine. That brief contact is where the ATTACK begins.' } },
      { title: 'The head is pushed in', text: 'The head bows in — its lowest shape, drawn here much larger than it really moves — then rings briefly: the low and mid BODY.', byVariant: { shaken: 'Shaken, the head barely bends: the frame moves as a whole, and the head goes with it.' } },
      { title: 'The jingles are thrown together', text: 'The frame jolts, and the loose jingle pairs are thrown against each other and their pins: a bright, metallic clash.' },
      { title: 'Sound leaves all round', text: 'The head radiates from BOTH faces — the back is open — and the jingles from all round the frame. A mic hears more of whichever it is closer to and faces.' },
    ],
    attack: 'The start of each stroke or shake: the hand on the head, and the jingles’ clash. Close to the rim and jingles, a mic tends to hear more of the bright, metallic attack.',
    body: 'The head’s brief low and mid ring, from both its faces, and the jingles’ shimmer. Aimed at the head, a mic tends to hear more body; a little farther away, the two blend with the room. Tendencies — and heads, jingles and players vary.',
    head: { diameterMm: 10 * 25.4, rods: 0, label: '10 in head, seen face-on', strikeSrc: 'LESSON-TAMB', hoop: 'wood' },
  },
  setting: {
    items: [
      { id: 'tambourine', label: 'the headed tambourine (and its player)', short: 'TAMBOURINE', note: 'Held by its player in the percussion row, often next to the trap table. The drawing every page of this lesson uses.', prov: { kind: 'illustrative', reason: 'a typical concert layout; no source gives positions' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'table', label: 'the trap table', short: 'TABLE', note: 'Where the tambourine and the other small instruments wait. The player turns and moves between them: a mic placed for one spot may miss the next.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'STATIONS', scene: 'kit' },
      { id: 'cymbal', label: 'a suspended cymbal', short: 'CYMBAL', note: 'Bright and loud, close by. Its bleed into a tambourine mic adds to the jingles’ brightness.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'snare', label: 'the concert snare', short: 'SNARE', note: 'Crisp and loud along the row; its player’s space and the tambourine player’s meet here.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'bassDrum', label: 'the concert bass drum', short: 'BASS DRUM', note: 'Low and loud further along; its low end reaches every percussion mic.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'brass', label: 'the brass row in front', short: 'BRASS', note: 'Loud, just downstage of the percussion. A wider pattern that covers a moving player also hears more of it.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'downstage', label: 'a floor wedge downstage of the percussion', short: 'WEDGE', note: 'On the audience side, behind a mic facing the tambourine and off to one side — a case a pattern’s null can help with.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'fill', label: 'the percussion section’s own monitor', short: 'SECTION MON.', note: 'Behind the players, facing them: in FRONT of a mic facing the tambourine, where no pattern rejects it.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'conductor', label: 'the conductor', short: 'CONDUCTOR', note: 'At the front, facing the orchestra: the player watches for entries. No stand across that sightline.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SIGHTLINE', scene: 'stage' },
      { id: 'pa', label: 'the PA', short: 'PA', note: 'At the front corners, facing the audience. Every extra open mic hears it — one reason to keep the mic count down.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'FEEDBACK PATH', scene: 'stage' },
      { id: 'main', label: 'the main pair over the conductor', short: 'MAIN PAIR', note: 'Two mics on a tall stand, hearing the whole ensemble — the tambourine included. Recording, a spot is added only for what they miss.', prov: { kind: 'illustrative', reason: 'a typical recording layout' }, tag: 'MAIN PICKUP', scene: 'studio' },
      { id: 'hall', label: 'the hall', short: 'THE HALL', note: 'In a good room, a broader pickup gives more air and an integrated tone — and less isolation.', prov: { kind: 'illustrative', reason: 'a generic hall; no source gives its size' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors on stage, the PA facing the audience. A stable, directional mic aligned to the real station and monitors, chosen with the system operator — and the player able to move as the music needs.',
    studio: 'RECORDING: the ensemble mics often carry the tambourine already; a single spot adds rhythmic definition or head body only if they miss it. A quiet room may allow a little more distance.',
  },
  diagnostic,
  practice: {
    task: 'Name the head and the jingles, place one mic that covers the real motion, explain two tonal perspectives, avoid transient overload, and check studio and live combinations in mono. With a real tambourine and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'inst', label: 'Tambourine (head, jingles, rows)', kind: 'text' },
      { id: 'played', label: 'How it was played', kind: 'choice', choices: ['held and struck', 'shaken / rolled', 'mounted', 'a mix'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser', 'small dynamic', 'ribbon (well clear)', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'peak', label: 'Peak headroom (loudest shake, quietest roll)', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The frame depth (55 mm), frame thickness, jingle slots per row (8) and jingle size (Ø 50 mm) — drawing defaults.', dims: ['depth', 'frameT', 'slots', 'jingleD'] },
    { text: 'The held height (1150 mm) and the mounted height (900 mm) — drawing defaults; no height above the floor is shown.', dims: ['holdH', 'mountH'] },
    { text: 'The reference point for 15–30 cm: the lab measures from the nearest part of the instrument in its playing position (front plane, head or rim), a drawing default.', dims: [] },
    { text: 'The striking hand’s path, the shake’s sweep (±150 mm), the sticks’ reach and the player’s position — ILLUSTRATIVE.', dims: [] },
  ],
  live: {
    wedges: [
      {
        id: 'downstage',
        label: 'a floor wedge downstage of the percussion, facing back toward it',
        short: 'DOWNSTAGE',
        p: { x: 1400, y: 0, z: -600 },
        lift: 150,
        faces: { x: -1, y: 0, z: 0.3 },
        note: 'It sits on the audience side, behind the mic and off to one side — the case a pattern’s null can help with.',
        prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
      },
      {
        id: 'fill',
        label: 'the percussion section’s own monitor, behind the players, facing them',
        short: 'SECTION MON.',
        p: { x: -1100, y: 0, z: 0 },
        lift: 150,
        faces: { x: 1, y: 0, z: 0 },
        note: 'It sits behind the player, in FRONT of a mic facing the tambourine: no pattern null reaches it.',
        prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
      },
    ],
  },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every tambourine, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a 10 in headed tambourine in three ways of playing, mic patterns and the two-mic comb as textbook shapes, and head and jingle motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.',
  copy: TAMB_COPY,
};
