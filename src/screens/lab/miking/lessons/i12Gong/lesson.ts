/**
 * I12 GONG — the lesson as DATA. Words from the owner's lesson
 * (docs/labs/miking/source_text/Gong-Miking-Technique.txt; "L<n>" in
 * comments only), research in docs/labs/miking/gong/, corrections in
 * CORRECTIONS_LOG.md (GG-01 …). Owner ruling 2026-10-04: suggested starting
 * points, no sources, brands or badges on screen. FULLY SILENT: the gong's
 * build-up is shown as stepped pictures, never played. The orchestra and its
 * percussion section (Lab 5, later) are named in words only.
 *
 * First identify the instrument — an orchestral tam-tam or a bossed gong —
 * then choose an approach (the selector on every page). The A/B distances
 * are the lesson's own classroom trials; no maker prescribes them.
 */
import type { DiagnosticItem, Lesson, MikingScenario, PageContent, PageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, cardioidNull, CLEAR_REASON, contactSymptom, firstNotch, gainCheck, hearingCheck, louderIsNotBetter, monoSymptom, moveRemovesDelay, PLAYER_REASON, polarityKeepsDelay, POWER_REASON, quickHearing, setupOrder, type MetalWords } from '../shared/metal/metalItems.ts';
import { metalWords } from '../shared/metal/metalCopy.ts';
import { GONG_MODEL, GONG_ZONES } from './geometry.ts';

const W: MetalWords = { p: 'gg', the: 'the gong', player: 'player', loudest: 'the strongest stroke', tail: 'the decay' };

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the gong',
    goal: 'Get to know the gong — which kind you have (an orchestral tam-tam or a bossed gong), where you meet it, what it does in the music, and its parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A large bronze plate hanging free on cords in a frame, struck with a soft mallet. A tam-tam has no boss and blooms; a bossed gong is struck on its raised centre for a more pitch-centred sound. Identify it first.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a stroke becomes sound — broad shapes first, then the build-up into many finer ones on a tam-tam, or the boss’s steadier tone — and where it leaves. Shown, never played.',
    credit: { scenarios: ['gg.snd.1', 'gg.snd.2', 'gg.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'A gong rings in many shapes at once; where it is struck decides which. On a tam-tam the energy spreads after the stroke into finer shapes — the sound swells. A stroke on the boss drives mostly the ring-shaped ones. Both faces radiate.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the gong sits — its frame and free swing, the player and the mallet, its neighbours, what a stage and a studio add — and what to do before any mic.',
    credit: { scenarios: ['gg.set.1', 'gg.set.hear', 'gg.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Ask for quiet and forceful strokes, rolls, the intended decay and damping. Mark the full swing and the mallet’s arc; never attach a mic to the gong, its cords or the frame without the owner’s approval. Protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the gong by its properties — pattern, power, headroom, size and mount — for the perspective you want, not by its brand.',
    credit: { scenarios: ['gg.mic.1', 'gg.mic.2', 'gg.mic.3', 'gg.mic.4', 'gg.rec.1'], note: 'Answer the five checks (one reaches back to how the gong sounds).' },
    takeaway: 'A directional condenser for detail and focus, a dynamic for a robust stage pickup, an omni for room and body in a quiet space, a ribbon for another perspective — each with its own checks. Headroom for the strongest stroke comes first.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — about 60–120 cm in front of the face, or 30–60 cm off to a clear outer part — measured from the face at rest, outside the swing and the mallet; then compare.',
    credit: { scenarios: ['gg.place.1', 'gg.place.2', 'gg.place.3', 'gg.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the swing, the mallet and the player, in two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Begin about 60–120 cm in front, facing the broad face; or 30–60 cm off to a clear outer part. Back away for bloom and room, come closer for presence. Distances are from the face at rest — the swing comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces a loud monitor — and know what a studio adds: a main view first, then perhaps a pair or a room layer.',
    credit: { scenarios: ['gg.ctx.1', 'gg.ctx.2', 'gg.ctx.studio', 'gg.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Live: one directional mic first, as close as practical outside the swing, its null toward the loudest wedge; bring monitors up cautiously. Studio: one clear main view, then a coincident pair or a room layer if the room is part of the music.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'Add a room mic to the front mic: see the long delay between them, what polarity does and does not change, and judge the blend in mono through the whole decay.',
    credit: { scenarios: ['gg.two.1', 'gg.two.2', 'gg.two.3', 'gg.two.4'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two spaced mics hear the gong at different times — whatever their patterns. Polarity flips the sign; it does not remove a delay. Collapse to mono and compare the attack and the decay; a coincident pair keeps the timing together.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Placement and the source first: move off a dominant local area, compare a broader view, check the mallet and the stroke, mind proximity effect and the swing — before EQ, and never restrain the gong to protect a mic.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second mic.',
    credit: { scenarios: ['gg.prac.order', 'gg.prac.gain', 'gg.prac.setup1', 'gg.prac.setup2', 'gg.prac.3', 'gg.mix.1', 'gg.mix.2', 'gg.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'Identify the gong, keep the swing and the mallet clear, choose a perspective on purpose, leave headroom for the strongest stroke, and judge any second mic in mono through the whole decay. More than one setup can pass.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L4-L5, L33 · set L6, L49-L51 · mic L7-L23 · place L24-L31, L33 ·
 * ctx L36-L45 · two L35, L46 · prac L53-L60. */
const scenarios: MikingScenario[] = [
  {
    id: 'gg.snd.1',
    page: 'sound',
    prompt: 'A tam-tam is struck once. What happens to its sound just after the stroke?',
    options: ['It can swell, as energy spreads into many finer shapes', 'It starts at its very loudest and then only fades from there', 'It falls silent until the gong stops swinging'],
    correct: 'It can swell, as energy spreads into many finer shapes',
    explain: 'A tam-tam blooms: after the stroke the energy moves from a few broad shapes into many finer, higher ones and the sound swells before it decays. Keep the whole rise and decay in your evaluation.',
    why: {
      'It starts at its very loudest and then only fades from there': 'That is closer to a struck bar. A tam-tam’s energy spreads after the stroke, and the sound can swell.',
      'It falls silent until the gong stops swinging': 'The swing is slow motion of the whole gong; the face rings throughout.',
    },
  },
  {
    id: 'gg.snd.2',
    page: 'sound',
    prompt: 'Why can a stroke on a bossed gong’s boss sound more like one pitch?',
    options: ['A centre stroke drives mostly the ring-shaped shapes', 'The boss is tuned so that it makes no other sounds at all', 'The boss stops the rest of the face moving'],
    correct: 'A centre stroke drives mostly the ring-shaped shapes',
    explain: 'A stroke drives a shape only as much as the face moves where it lands. At the centre, every shape with a still line across it stands still — so fewer shapes ring, and the sound centres on a pitch. (The boss shapes it further.)',
    why: {
      'The boss is tuned so that it makes no other sounds at all': 'The face still rings in several shapes; the centre stroke favours fewer of them.',
      'The boss stops the rest of the face moving': 'The whole face still moves; it is which shapes are driven that changes.',
    },
  },
  {
    id: 'gg.snd.3',
    page: 'sound',
    prompt: 'Where does a gong’s sound leave from?',
    options: ['Both faces, front and back', 'Only the struck front face', 'Mostly from the cords and frame'],
    correct: 'Both faces, front and back',
    explain: 'The thin plate pushes air on both sides as it rings. Do not assume both faces sound the same — a rear mic is an experiment, not the default.',
    why: {
      'Only the struck front face': 'The plate moves as a whole; its back pushes on the air too.',
      'Mostly from the cords and frame': 'The cords and frame hold it; the bronze face radiates.',
    },
  },
  {
    id: 'gg.set.1',
    page: 'setting',
    prompt: 'Before placing a gong mic, what do you ask the player to show you?',
    options: ['Quiet and forceful strokes, rolls, and the decay or damping', 'Only the loudest stroke, so the gain can be set from it first', 'Nothing yet: set the mic first, then fit the strokes round it'],
    correct: 'Quiet and forceful strokes, rolls, and the decay or damping',
    explain: 'The whole dynamic range and the endings decide the gain and the perspective; the swing and the mallet’s arc decide where a mic can go.',
    why: {
      'Only the loudest stroke, so the gain can be set from it first': 'Gain needs the loudest AND the quietest — and the bloom and the decay matter as much as the stroke.',
      'Nothing yet: set the mic first, then fit the strokes round it': 'Never fit the player round a mic; place the mic for the gong and the strokes.',
    },
  },
  hearingCheck(W),
  {
    id: 'gg.set.2',
    page: 'setting',
    prompt: 'A clamp would hold a mic right on the gong’s frame. Is that a good idea?',
    options: ['Only with the maker’s and the owner’s approval', 'Yes — on the frame the mic stays at the same distance', 'Yes, if the clamp is small and light'],
    correct: 'Only with the maker’s and the owner’s approval',
    explain: 'A mic stand must be separately stable; nothing is attached to the gong, its cords or the frame without the maker’s and the owner’s approval — and the gong must still hang free.',
    why: {
      'Yes — on the frame the mic stays at the same distance': 'Approval comes first, and a clamp can add noise or load the frame.',
      'Yes, if the clamp is small and light': 'Size is not the question: approval and the free swing are.',
    },
  },
  {
    id: 'gg.mic.1',
    page: 'microphone',
    prompt: 'A close directional mic makes the gong sound artificially heavy in the lows. First thought?',
    options: ['Proximity effect: compare more distance and angle', 'The gong is far too bass-rich, so cut the low end', 'The mic is faulty and needs replacing'],
    correct: 'Proximity effect: compare more distance and angle',
    explain: 'Directional mics rise in the lows when close. Compare distance and angle before assuming the gong itself is too bass-rich.',
    why: {
      'The gong is far too bass-rich, so cut the low end': 'Check the mic’s distance first — closeness can add that low end.',
      'The mic is faulty and needs replacing': 'Nothing is broken: a directional mic close to a source boosts the lows.',
    },
  },
  {
    id: 'gg.mic.2',
    page: 'microphone',
    prompt: 'Before the first forceful stroke, what do you check on a condenser?',
    options: ['Its maximum SPL, its pad and its phantom supply', 'Its colour, so it matches the gong on camera', 'Nothing: condensers handle huge levels with ease'],
    correct: 'Its maximum SPL, its pad and its phantom supply',
    explain: 'Verify the mic’s headroom for the strongest planned stroke, any pad it offers, and its power — for the exact model.',
    why: {
      'Its colour, so it matches the gong on camera': 'Looks do not matter here; headroom and power do.',
      'Nothing: condensers handle huge levels with ease': 'Every mic has a limit; check it against the strongest stroke.',
    },
  },
  {
    id: 'gg.mic.3',
    page: 'microphone',
    prompt: 'Why is an omni mic less practical on a loud stage, even if it sounds full in a quiet hall?',
    options: ['It hears the stage and monitors from all sides', 'It cannot hear the gong’s low body well at all', 'It needs a special preamp that stages lack'],
    correct: 'It hears the stage and monitors from all sides',
    explain: 'An omni can give room and low body in a suitable quiet space — and picks up more of everything around it, which makes loud monitoring harder.',
    why: {
      'It cannot hear the gong’s low body well at all': 'An omni is often good for body; its problem live is spill and feedback.',
      'It needs a special preamp that stages lack': 'An omni plugs in like any mic; the issue is what it hears.',
    },
  },
  {
    id: 'gg.mic.4',
    page: 'microphone',
    prompt: 'A figure-eight ribbon faces the gong. What else does it hear?',
    options: ['The room behind it, as strongly as the front', 'Nothing: ribbons only hear straight ahead', 'Only the gong’s back face, through the frame'],
    correct: 'The room behind it, as strongly as the front',
    explain: 'A figure-eight has two lobes: what is behind it matters as much as what is in front. Mind the stand position and wind, and follow the maker’s power and wiring instructions.',
    why: {
      'Nothing: ribbons only hear straight ahead': 'A figure-eight hears its rear as strongly as its front.',
      'Only the gong’s back face, through the frame': 'Its rear lobe hears whatever is behind the mic, not the gong’s back.',
    },
  },
  {
    id: 'gg.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A tam-tam swells after the stroke. What does that ask of the gain?',
    options: ['Headroom for the swell, not only the stroke', 'Set it from the first instant of the stroke', 'Nothing: the swell is quieter than the stroke'],
    correct: 'Headroom for the swell, not only the stroke',
    explain: 'Set input gain during the strongest planned passage — the bloom included — then allow headroom.',
    why: {
      'Set it from the first instant of the stroke': 'The sound can grow after the stroke; the gain must allow for that.',
      'Nothing: the swell is quieter than the stroke': 'A forceful stroke’s bloom can be loud; check the whole passage.',
    },
  },
  {
    id: 'gg.place.1',
    page: 'placement',
    prompt: 'A starting point says about 60–120 cm. What is it measured from?',
    options: ['The gong’s surface while it hangs at rest', 'The frame’s nearest post or foot', 'The player, wherever they stand to strike'],
    correct: 'The gong’s surface while it hangs at rest',
    explain: 'The distance is from the capsule to the face at rest — and the mic must still stay outside the whole swing and the mallet’s arc.',
    why: {
      'The frame’s nearest post or foot': 'The frame holds the gong; measure from the face itself.',
      'The player, wherever they stand to strike': 'The player moves; the gong’s face at rest is the reference.',
    },
  },
  {
    id: 'gg.place.2',
    page: 'placement',
    prompt: 'The level jumps with each swing of the gong. What do you do?',
    options: ['Move outside the swing and aim at a wider region', 'Tie the gong so that it cannot swing toward the mic', 'Compress the channel hard to hide it'],
    correct: 'Move outside the swing and aim at a wider region',
    explain: 'The gong must hang free — never restrain it to protect a mic. Move outside the swing envelope and aim at a wider part of the face.',
    why: {
      'Tie the gong so that it cannot swing toward the mic': 'Never restrain the gong: it must swing freely, and restraint changes its sound.',
      'Compress the channel hard to hide it': 'Processing hides a placement problem; move the mic.',
    },
  },
  {
    id: 'gg.place.3',
    page: 'placement',
    prompt: 'A bossed gong: you put the mic very close, right on the boss’s line. What may happen?',
    options: ['The mallet’s impact is exaggerated', 'You hear the purest pitch the gong can make', 'Nothing changes from a broader view'],
    correct: 'The mallet’s impact is exaggerated',
    explain: 'Very close on the centre may exaggerate the mallet’s impact; it is not automatically the most faithful pitch. Aim at the boss from a safe offset and compare a broader front view.',
    why: {
      'You hear the purest pitch the gong can make': 'Closest is not purest: compare a safe offset and a broader view.',
      'Nothing changes from a broader view': 'Distance and angle change the balance a lot at a gong.',
    },
  },
  {
    id: 'gg.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Your stand clears the gong at rest. Is that enough?',
    options: ['No — it must clear the swing and the mallet’s arc', 'Yes — the gong hangs quite still once it has been struck', 'Yes, as long as the cable is taped down'],
    correct: 'No — it must clear the swing and the mallet’s arc',
    explain: 'The gong swings forward, back and sideways after a stroke, and the mallet follows through. Mark a safe area for both.',
    why: {
      'Yes — the gong hangs quite still once it has been struck': 'It swings freely after a stroke — by design.',
      'Yes, as long as the cable is taped down': 'Taping helps, but the stand must still clear the swing and the mallet.',
    },
  },
  {
    id: 'gg.ctx.1',
    page: 'context',
    prompt: 'Live, with isolation and feedback a concern. Where do you start?',
    options: ['One directional mic, as close as practical outside the swing', 'A stereo pair and a room mic, for the gong’s full size and space', 'An omni close to the face, for the low body'],
    correct: 'One directional mic, as close as practical outside the swing',
    explain: 'Start with one directional mic; keep it as close as practical without entering the mallet or swing path, and put a loud monitor in its rejection.',
    why: {
      'A stereo pair and a room mic, for the gong’s full size and space': 'More open mics mean more spill and less gain before feedback; start with one.',
      'An omni close to the face, for the low body': 'An omni hears the whole stage: less isolation, more feedback risk.',
    },
  },
  {
    id: 'gg.ctx.2',
    page: 'context',
    prompt: 'A gong mic helps the house. Should it go to the player’s wedge too?',
    options: ['Little or none — coordinate with the operator', 'Yes, loud, so the player hears each stroke', 'Yes — the wedge stops the gong from feeding back'],
    correct: 'Little or none — coordinate with the operator',
    explain: 'A mic that is useful in the house may feed little or no gong to the player’s wedge; every extra open mic and send increases spill and feedback risk.',
    why: {
      'Yes, loud, so the player hears each stroke': 'The player is beside the gong; a loud send raises the feedback risk.',
      'Yes — the wedge stops the gong from feeding back': 'Monitors are where feedback starts, not a cure for it.',
    },
  },
  {
    id: 'gg.ctx.studio',
    page: 'context',
    prompt: 'An orchestra recording with a main array. How much gong spot?',
    options: ['Start with the main array; add only as much spot as needed', 'As much as possible, so that the gong can be turned up later on', 'None — a gong does not need a spot mic'],
    correct: 'Start with the main array; add only as much spot as needed',
    explain: 'Begin with the main array and use only as much gong spot as needed — then check the blend through the whole phrase, in mono.',
    why: {
      'As much as possible, so that the gong can be turned up later on': 'A loud spot pulls the gong out of the ensemble and colours the sum.',
      'None — a gong does not need a spot mic': 'Sometimes it does — for definition the main array misses.',
    },
  },
  {
    id: 'gg.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Which kind of gong is a broad, blooming wash with no clear note?',
    options: ['An orchestral tam-tam, without a boss', 'A bossed gong struck on its boss', 'A gong of either kind, if it is large'],
    correct: 'An orchestral tam-tam, without a boss',
    explain: 'A tam-tam blooms into a broad, complex sound; a bossed gong struck on its boss is more pitch-centred. Identify the gong before choosing an approach.',
    why: {
      'A bossed gong struck on its boss': 'That is the more pitch-centred kind.',
      'A gong of either kind, if it is large': 'Size alone does not decide it; the kind of gong does.',
    },
  },
  polarityKeepsDelay(W),
  firstNotch(W),
  {
    id: 'gg.two.3',
    page: 'twoMic',
    prompt: 'Someone says a ribbon’s pattern means two spaced mics will have no phasing. True?',
    options: ['No — spaced mics still hear it at different times', 'Yes — a figure-eight pattern cancels out the phasing', 'Yes, as long as both mics are ribbons'],
    correct: 'No — spaced mics still hear it at different times',
    explain: 'Two differently placed mics receive the shared sound at different times, whatever their patterns. Verify the combination in mono and adjust placement and balance.',
    why: {
      'Yes — a figure-eight pattern cancels out the phasing': 'A pattern sets how much each mic hears from each direction, not when the sound arrives.',
      'Yes, as long as both mics are ribbons': 'Matched mics do not remove different arrival times.',
    },
  },
  louderIsNotBetter(W),
  gainCheck(W),
  {
    id: 'gg.prac.3',
    page: 'practice',
    prompt: 'What would justify a second gong mic?',
    options: ['Size or room the front mic alone cannot give', 'Two mics are the usual standard for a gong', 'The gong needs more level than one mic can give'],
    correct: 'Size or room the front mic alone cannot give',
    explain: 'A coincident pair for size and room, or a room layer for decay — once the front mic works on its own. Live, spill and feedback often limit it.',
    why: {
      'Two mics are the usual standard for a gong': 'One clear main view is the usual start; a second has to earn its place.',
      'The gong needs more level than one mic can give': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'gg.mix.1',
    page: 'practice',
    prompt: 'You want a stereo image that stays solid in mono. Which pair do you try first?',
    options: ['A coincident pair, the capsules together', 'A widely spaced pair, far apart', 'Two mics on either face of the gong'],
    correct: 'A coincident pair, the capsules together',
    explain: 'A coincident (XY) pair hears the gong at almost the same time in both mics, so its mono sum stays stable; a spaced pair can comb in mono.',
    why: {
      'A widely spaced pair, far apart': 'Spacing adds time differences that can comb-filter in mono.',
      'Two mics on either face of the gong': 'The faces do not sound the same, and the paths differ: an experiment, not a mono-safe pair.',
    },
  },
  cardioidNull(W),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  {
    id: 'gg.s.harsh',
    observation: 'Harsh, narrow or clangy',
    firstChecks: 'Move off the locally dominant struck area or farther back; check the mallet and the stroke are the intended ones.',
    options: ['Off the dominant area or farther back; the mallet', 'Cut the upper mids with EQ until it calms down', 'Ask the player to strike much more softly'],
    correct: 'Off the dominant area or farther back; the mallet',
    explain: 'A close mic can favour one local area of the face. Move off it or back, and confirm the mallet and stroke with the player.',
    why: {
      'Cut the upper mids with EQ until it calms down': 'Find the placement or source cause before EQ.',
      'Ask the player to strike much more softly': 'The dynamics are the music; move the mic first.',
    },
  },
  {
    id: 'gg.s.thin',
    observation: 'Weak bloom or thin low body',
    firstChecks: 'A broader, a little more distant front position; the stand and nearby reflective surfaces; the high-pass setting.',
    options: ['A broader view, the surfaces and the high-pass', 'Push the mic right up to the centre of the face', 'Add a big low-shelf boost on the desk'],
    correct: 'A broader view, the surfaces and the high-pass',
    explain: 'Compare a broader, modestly more distant front position; inspect the stand and nearby surfaces; check a high-pass is not cutting the body.',
    why: {
      'Push the mic right up to the centre of the face': 'Too close favours one area; a broader view hears the bloom.',
      'Add a big low-shelf boost on the desk': 'Check the placement and the filter before EQ.',
    },
  },
  {
    id: 'gg.s.muddy',
    observation: 'Muddy or overblown',
    firstChecks: 'Less proximity effect, another room position — and whether this gong and passage naturally decay that way.',
    options: ['Proximity effect and the room position first', 'Gate the decay so the mud is cut off', 'Swap to a mic with a larger diaphragm'],
    correct: 'Proximity effect and the room position first',
    explain: 'A close directional mic adds low end; the room adds decay. Compare, and check whether the gong itself sounds that way.',
    why: {
      'Gate the decay so the mud is cut off': 'A gate cuts the decay the gong is meant to have.',
      'Swap to a mic with a larger diaphragm': 'Diaphragm size is not a cure; distance and angle are.',
    },
  },
  {
    id: 'gg.s.swing',
    observation: 'The level changes as the gong swings',
    firstChecks: 'Is the mic inside or near the swing? Move outside it and aim at a wider region.',
    options: ['Move outside the swing; aim at a wider region', 'Restrain the gong so it swings less', 'Compress hard so the level stays even'],
    correct: 'Move outside the swing; aim at a wider region',
    explain: 'Do not restrain the gong to protect a mic: it must hang free. Move outside the swing envelope.',
    why: {
      'Restrain the gong so it swings less': 'Never restrain it: it must swing freely, and restraint changes its sound.',
      'Compress hard so the level stays even': 'Processing hides a placement problem.',
    },
  },
  monoSymptom(W),
  {
    id: 'gg.s.feedback',
    observation: 'Live feedback or heavy spill',
    firstChecks: 'Reduce the send or output; revisit the pattern and the loudspeaker geometry; use fewer open mics.',
    options: ['Lower the send; fix the pattern and geometry', 'Raise the gong mic so it beats the spill', 'Add a second gong mic to cover more'],
    correct: 'Lower the send; fix the pattern and geometry',
    explain: 'Reduce the level promptly when ringing starts, then aim the null at the loudspeaker and cut open mics.',
    why: {
      'Raise the gong mic so it beats the spill': 'More gain brings feedback closer.',
      'Add a second gong mic to cover more': 'Another open mic adds spill and feedback risk.',
    },
  },
  contactSymptom(W, 'the swinging gong or the mallet'),
];

const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point, measured from the face at rest', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };
const KIND_REASON: SetupReason = { id: 'r.kind', label: 'The gong was identified first — tam-tam or bossed', role: 'optional', feedback: 'A fair reason: the approach follows the kind of gong.' };

const setupTasks: SetupTask[] = [
  {
    id: 'gg.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A studio overdub: one orchestral tam-tam, soft rolls and one forceful stroke with a long decay, in a good room. Phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser about 90 cm in front of the face, facing it, outside the swing and the mallet', ok: true, power: 'phantom', feedback: 'The broad front view; it needs the phantom this channel has.' },
      { id: 'b', label: 'A coincident pair at the front, compared with one mic, in the good room', ok: true, power: 'phantom', feedback: 'A fair studio choice for size, if it stays solid in mono.' },
      { id: 'c', label: 'A mic 5 cm from the face, at its centre', ok: false, power: 'phantom', feedback: 'Inside the swing, against the gong — never.' },
      { id: 'd', label: 'A clamp on the frame holding the mic, without asking', ok: false, power: 'phantom', feedback: 'Nothing is attached to the frame without the owner’s approval.' },
      { id: 'e', label: 'Tie the gong still so the level does not change', ok: false, power: 'none', feedback: 'The gong must hang free.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, KIND_REASON, BRAND_REASON, PLAYER_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point from the face at rest, outside the swing and the mallet, with the power the mic needs.',
  },
  {
    id: 'gg.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud show: a bossed gong on stage, monitors in front. The spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'Small dynamic about 40 cm from the boss, at a safe offset, its back to the wedge', ok: true, power: 'none', feedback: 'A directional view toward the boss from outside the swing; a dynamic needs no phantom.' },
      { id: 'b', label: 'Small dynamic about 80 cm in front of the face, its null toward the wedge', ok: true, power: 'none', feedback: 'A broader front view; check feedback with the operator.' },
      { id: 'c', label: 'Small condenser in front of the face', ok: false, power: 'phantom', feedback: 'This input has no phantom, and a condenser needs it.' },
      { id: 'd', label: 'A mic right on the boss, as close as possible', ok: false, power: 'none', feedback: 'Inside the swing and the mallet’s path — and it exaggerates the impact.' },
      { id: 'e', label: 'An omni and a room pair, all open on stage', ok: false, power: 'none', feedback: 'Too many open mics, and an omni hears the whole stage.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.null', label: 'The pattern’s rejection is aimed at the loudest monitor', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, PLAYER_REASON],
    explain: 'Two setups pass. What passes is the reasoning: a view chosen for this gong, outside the swing and the mallet, powered by what this input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: a tam-tam is struck once. What happens just after the stroke?', options: ['The sound can swell', 'It only fades', 'It goes silent'], after: 'Now STEP through the stroke (or PLAY ONCE), then try the face’s shapes — and switch GONG.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you back the mic away from 60 cm to 120 cm. What changes most?', options: ['More bloom and room', 'More presence', 'Nothing'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge sits downstage, behind the mic. Can a cardioid’s null reach it?', options: ['Yes — its back can face the wedge', 'No — only an omni can', 'It is already at the side'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'A front mic and a room mic about 2 m apart. If you flip B’s polarity, what happens to Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'gg.q.1',
    covers: 'instrument',
    prompt: 'What tells an orchestral tam-tam from a bossed gong?',
    options: ['A tam-tam has no raised boss in the middle', 'A tam-tam is usually the smaller of the two', 'A bossed gong is struck at its rim'],
    correct: 'A tam-tam has no raised boss in the middle',
    explain: 'A bossed gong has a raised centre that is struck; a tam-tam’s face has no boss. Identify the gong before choosing an approach.',
    why: {
      'A tam-tam is usually the smaller of the two': 'Tam-tams are often large; size is not the tell.',
      'A bossed gong is struck at its rim': 'It is struck on or near its boss.',
    },
  },
  {
    id: 'gg.q.2',
    covers: 'instrument',
    prompt: 'How should a gong hang in its frame?',
    options: ['Free to swing without touching the stand', 'Clamped firmly so it cannot move', 'Resting on the frame’s bottom bar'],
    correct: 'Free to swing without touching the stand',
    explain: 'It hangs on cords and swings freely forward, back and sideways without touching the stand — inspect the cords before playing.',
    why: {
      'Clamped firmly so it cannot move': 'A clamped gong is damped; it must hang free.',
      'Resting on the frame’s bottom bar': 'Touching the frame damps it and transfers vibration.',
    },
  },
  {
    id: 'gg.q.3',
    covers: 'sound',
    prompt: 'A tam-tam is struck. What should your evaluation include?',
    options: ['The whole rise and decay, not only the stroke', 'Only the first instant of the stroke', 'Only the end of the decay'],
    correct: 'The whole rise and decay, not only the stroke',
    explain: 'A tam-tam can swell after the stroke as the energy spreads into finer shapes; judge the whole rise and decay.',
    why: {
      'Only the first instant of the stroke': 'The bloom comes after; the stroke alone misses it.',
      'Only the end of the decay': 'The rise and the peak of the bloom matter too.',
    },
  },
  {
    id: 'gg.q.4',
    covers: 'sound',
    prompt: 'Why does a stroke on the boss favour fewer vibration shapes?',
    options: ['At the centre, the shapes with still lines stand still', 'The boss is far too thick to vibrate at all, so it stays still', 'The two cords hold the centre of the face still'],
    correct: 'At the centre, the shapes with still lines stand still',
    explain: 'A stroke drives a shape only as much as the face moves there; at the centre only the ring-shaped ones move.',
    why: {
      'The boss is far too thick to vibrate at all, so it stays still': 'The boss vibrates with the face; it is which shapes are driven.',
      'The two cords hold the centre of the face still': 'The cords hold the rim, not the centre.',
    },
  },
  {
    id: 'gg.q.5',
    covers: 'setting',
    critical: true,
    prompt: 'Placing a mic near a gong, what comes before every distance?',
    options: ['The full swing and the mallet’s arc', 'The exact distance the starting point gives', 'The shortest cable run back to the stage box'],
    correct: 'The full swing and the mallet’s arc',
    explain: 'Mark a safe working area for the full swing and the mallet’s arc; the stand stays separately stable and outside both.',
    why: {
      'The exact distance the starting point gives': 'The numbers are starting points; clearance comes first.',
      'The shortest cable run back to the stage box': 'A tidy cable matters, but never before the swing and the player’s space.',
    },
  },
  quickHearing(W),
];

export const I12_LESSON: Lesson = {
  id: 'I12',
  labId: 'percussion',
  title: 'Gong',
  subtitle: 'Tam-tam or bossed gong: identify it, then a front view, a closer spot or the room',
  noun: { one: 'gong', many: 'gongs' },
  model: GONG_MODEL,
  micTypeIds: ['sdcCard', 'smallDynCard'],
  zones: GONG_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [setupOrder(W, { text: 'Identify the gong; watch the strokes, the decay and the swing with the player', early: 'Start with the instrument and the player.' })],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A large bronze plate hanging on cords in a frame, struck with a soft mallet — the metal itself vibrates. Two kinds matter here: an orchestral tam-tam (no boss) and a bossed gong (a raised centre that is struck). Identify which you have first.', src: 'PAI-GONG' },
    { title: 'WHERE YOU MEET IT', text: 'At the back of orchestras and percussion sections, in film and concert music, in many gong traditions — in the studio and on stage. (The whole orchestra and its percussion section come later, in Lab 5.)', src: 'LESSON-GONG' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'A swelling wash at a climax, a soft roll, a single stroke left to decay — or damped on purpose. Mallet, stroke and where it lands all change the sound.', src: 'PAI-GONG' },
    { title: 'ITS SIZE', text: 'Orchestral gongs run from about 50 cm (20 in) to 1 m (40 in) and beyond; bossed gongs often 30–60 cm (12–24 in). This lab draws an 81 cm (32 in) tam-tam and a 46 cm (18 in) bossed gong.', src: 'PAI-GONG' },
  ],
  sound: {
    stages: [
      { title: 'The mallet lands', text: 'The soft mallet strikes the face a little off centre. That contact is the ATTACK — softened by the mallet’s felt.', byVariant: { bossed: 'The soft mallet strikes the boss. That contact is the ATTACK — softened by the mallet’s felt.' } },
      { title: 'Broad shapes first', text: 'The face moves first in a few broad shapes — drawn here, much larger than life, as blue and amber regions.' },
      { title: 'The build-up', text: 'Then the energy spreads into many finer shapes across the face: the sound SWELLS after the stroke — the bloom. The order of events, not their speed.', byVariant: { bossed: 'Struck on the boss, the face rings mostly in its ring-shaped shapes, round the boss: a steadier, more pitch-centred tone.' } },
      { title: 'Front and back', text: 'The plate pushes air from both faces as it rings, and the whole gong swings gently on its cords. It decays slowly unless the player damps it.' },
    ],
    attack: 'The mallet’s contact: soft and broad with a felt mallet, harder with a harder one. A close mic near the struck area tends to hear more of the impact and of that local area of the face.',
    body: 'The bloom and the long decay: on a tam-tam the sound can swell after the stroke as finer shapes take over; a bossed gong rings more steadily round its boss. Both faces radiate. A farther, broader view hears more of the bloom and the room. Tendencies — gongs, mallets and players vary.',
    head: { diameterMm: 812.8, rods: 0, label: 'a 32 in tam-tam', strikeSrc: 'PAI-GONG' },
  },
  setting: {
    items: [
      { id: 'gong', label: 'the gong in its frame', short: 'GONG', note: 'Hanging on cords in a frame stand, free to swing. Leave the gong and its suspension to the owner or the venue’s technician.', prov: { kind: 'illustrative', reason: 'a typical position: a drawing default' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'player', label: 'the player and the mallet', short: 'PLAYER', note: 'Beside the struck face, with the mallet’s whole arc and follow-through. Their space, and the gong’s swing, come before any mic.', prov: { kind: 'illustrative', reason: 'a standing player: a drawing default' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'wedge', label: 'a floor wedge downstage', short: 'WEDGE', note: 'Live, a floor monitor in front, facing back toward the player — behind a mic that faces the gong, where a pattern’s null can help.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'band', label: 'the rest of the percussion and the band', short: 'BAND', note: 'Loud neighbours: a closer directional mic outside the swing helps more than gain.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'stage' },
      { id: 'audience', label: 'the audience and the PA', short: 'AUDIENCE · PA', note: 'Listen first from an ordinary audience position, safely, before choosing a target.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'MIC SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'Walls nearby change the bloom; in a good room, a room layer can carry the decay.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: one directional mic first, as close as practical outside the swing, its null toward the loudest wedge; bring monitor sends up cautiously and stop if ringing begins.',
    studio: 'STUDIO: one clear main view first; then a coincident pair, a wider pair or a room layer only if the room is part of the music. Keep the whole rise and decay in every comparison.',
  },
  diagnostic,
  practice: {
    task: 'Identify the gong, keep the swing and the mallet clear, choose a perspective on purpose, leave headroom for the strongest stroke, and judge any second mic in mono through the whole decay. With the owner’s agreement, log what you tried below.',
    fields: [
      { id: 'inst', label: 'Instrument type and diameter (if known), mallet', kind: 'text' },
      { id: 'kind', label: 'Which gong', kind: 'choice', choices: ['tam-tam', 'bossed gong', 'other'] },
      { id: 'mic', label: 'Mic and pattern', kind: 'text' },
      { id: 'zone', label: 'Distance (capsule to face at rest), target, angle', kind: 'text' },
      { id: 'clear', label: 'Stand clearance from the swing and the mallet', kind: 'text' },
      { id: 'notes', label: 'What you heard: attack, bloom, decay, room (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The boss (Ø 90 × 35 mm), the rim’s depth (40 mm), the face’s dome (8 mm), the centre height (1300 mm) and the swing (±80 mm) — drawing defaults.', dims: ['bossD', 'bossH', 'rim', 'dome', 'centreH', 'swing'] },
    { text: 'The mallet (head Ø 120 mm, handle 400 mm) and the frame (feet 600 mm, posts 40 mm, the inner width) — drawing defaults; the stand type is a rated frame for gongs up to 100 cm.', dims: ['malletHead', 'malletHandle', 'feet', 'post'] },
    { text: 'Where a tam-tam is struck: a little off centre (0.25 R) is a drawing default — a maker’s figure shows an ideal point that was not read as text. The build-up is drawn as which shapes hold the energy, never as a time or a level.', dims: [] },
    { text: 'The 60–120 cm and 30–60 cm starting points and the room mic are the lesson’s own classroom trials; no maker prescribes them. One recording account placed mics about 30 cm from the gongs in a large room — specific to that room.', dims: [] },
  ],
  live: {
    wedges: [
      { id: 'wedge', label: 'a floor wedge downstage, facing back toward the player', short: 'WEDGE', p: { x: 1700, y: 0, z: -200 }, lift: 150, faces: { x: -1, y: 0, z: -0.1 }, note: 'In front of the gong, behind a mic that faces it — the case a pattern’s null can help with.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
      { id: 'side', label: 'a side-fill monitor across the stage', short: 'SIDE FILL', p: { x: 300, y: 0, z: 1700 }, lift: 150, faces: { x: 0, y: 0, z: -1 }, note: 'Off to the side, roughly beside the mic’s front: no pattern’s null reaches it. Distance and level do the work.', prov: { kind: 'illustrative', reason: 'a typical stage layout' } },
    ],
  },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. No gong maker prescribes a mic position: these starting points come from how microphones behave and source-focused versus room-focused pickup, and every gong, mallet, player and room is different. Move the mic, experiment, and trust your ears. The lab is silent and draws a simplified picture: a 32 in tam-tam and an 18 in bossed gong, the face’s shapes on a flat disc free at its edge, the build-up as which shapes hold the energy (never a speed or a level), mic patterns as textbook shapes. Distances are rounded to about 5 mm and measured from the face at rest to the mic’s front. Keep clear of the swing and the mallet.',
  copy: { words: metalWords('gong', 'player') },
};
