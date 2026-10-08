/**
 * E13 MIXED CLASSICAL ENSEMBLES — the lesson as DATA (the 2026-10-07
 * journey). Words from the owner's lesson (docs/labs/miking/source_text/
 * Mixed-Acoustic-and-Classical-Ensembles-Miking-Technique.txt; "L<n>" in
 * comments only); research in docs/labs/miking/mixed_classical_ensemble/ and
 * full_orchestra/SOURCES.md §A; corrections E13-* in CORRECTIONS_LOG.md (the
 * false "final item" sentence is not carried). Suggested starting points; no
 * sources on screen; FULLY SILENT.
 */
import type { DiagnosticItem, LessonPages, MikingScenario, SetupTask, Symptom } from '../../engine/model/types.ts';
import type { EnsembleLesson } from '../shared/ensemble/ensembleData.ts';
import { abHole, BRAND_REASON, ensembleWords, hearingCheck, msMono, noThreeToOne, ortfFixed, PAIR_REASON, POWER_REASON, riggingCheck, riggingDiag, SAFE_REASON, SPOTS_REASON, supportFirst, supportNeed, treeCentre } from '../shared/ensemble/ensembleItems.ts';
import { CH_C, E13_MODEL, E13_PLACE, E13_SETUPS, E13_WEDGES, E13_ZONES } from './geometry.ts';

const pages: LessonPages = {
  meet: {
    title: 'Meet it — where the sound comes from',
    goal: 'Meet a mixed ensemble in brief — strings, winds, a horn and a piano, and the orchestra it grows into — and see where each instrument’s sound leaves it.',
    credit: { scenarios: ['mix.meet.1', 'mix.meet.2', 'mix.meet.3'], note: 'Answer the three checks on where the sound leaves.' },
    takeaway: 'Every family sends its sound its own way — strings up and out, the horn backward, the piano under its open lid — and the room joins them into one sound. A main array hears that blend; a close mic hears only part of one instrument.',
  },
  setups: {
    title: 'Starting setups',
    goal: 'See real setups drawn on the stage — an X/Y, a 17 cm and a spaced pair in front of a chamber group, a featured spot, a support; at orchestra size, the pair over the podium and the three-omni tree with its outriggers. Then what to settle before any mic goes up.',
    credit: { scenarios: ['mix.set.1', 'mix.rig', 'mix.hear'], interactive: 'setupsSeen', note: 'Look at every main setup on the drawing, and answer the three checks.' },
    takeaway: 'Start with one main array alone if the room and the music allow it; add at most two supports at first, each for a reason. Agree the balance with the players before any spot gain; keep sightlines, breathing, bowing, slides and pedals clear.',
  },
  microphone: {
    title: 'Choose the microphones',
    goal: 'Compare coincident, near-coincident and spaced main arrays, M/S and the tree by what they do — none of them best everywhere — and choose supports by their pattern.',
    credit: { scenarios: ['mix.mic.1', 'mix.ortf', 'mix.ms', 'mix.mic.2', 'mix.rec.1'], note: 'Answer the five checks (one reaches back to where the sound leaves).' },
    takeaway: 'Choose by the result: the internal balance, a stable image, the amount of room, the tone in mono and the playback. Keep each method’s geometry; a different spacing is a different method.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and move the main array yourself — closer, farther, higher — and see what changes for the front and back players and across the width.',
    credit: { scenarios: ['mix.place.1', 'mix.place.2', 'mix.31', 'mix.rec.2'], interactive: 'twoZones', note: 'Rest the array’s centre, clear of the players, in two different suggested starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Change one variable at a time and compare at a consistent level. Closer favours the front players; farther back, more blend and room. The array moves as a unit.',
  },
  context: {
    title: 'Reinforcement and recording',
    goal: 'Turn a spot so a monitor sits in its rejection — and give every mic a role: capture, PA, or both.',
    credit: { scenarios: ['mix.ctx.1', 'mix.ctx.2', 'mix.ctx.studio', 'mix.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: turn the cello spot (or change its pattern) until the monitor sits in its rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'A quiet chamber event may need little reinforcement; a big room or loud accompaniment may need close directional support. A beautiful distant array may be wrong for the PA. Give each mic a role, and never provoke feedback.',
  },
  twoMic: {
    title: 'Main array and a spot',
    goal: 'The main pair and the cello spot: see how much earlier the spot hears the cello, what polarity changes and what it does not, and judge the sum in mono.',
    credit: { scenarios: ['mix.first', 'mix.two.1', 'mix.two.2'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the three checks.' },
    takeaway: 'The relevant distance is the difference in paths from the player to each mic, not the distance between the mics. Polarity changes the sign, never the time. Try level, placement or angle before a delay; judge any delay by ear.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to its likely cause and the first change to try.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Placement and balance first: the array’s height and distance, the spacing and centre, the supports’ level, the clipping stage, the PA’s geometry — before EQ. Lower the gain at the first sign of ringing.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a main-array setup in order, choose and justify a setup for two briefs, and say when a spot is worth it.',
    credit: { scenarios: ['mix.prac.order', 'mix.prac.gain', 'mix.prac.setup1', 'mix.prac.setup2', 'mix.prac.3', 'mix.hole', 'mix.tree', 'mix.need'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'Agree the balance, check stands and cables, set gain on the peaks, build the sound with one main array, add at most two supports for stated reasons, and keep capture and reinforcement roles clear.',
  },
};

/* THE CHECKS. Lesson refs (comments only): meet L13–L15 · set L13–L14, L49 · mic L39–L47 · place L36–L37 · ctx L85–L88 · two L80–L82 · prac L119–L125. */
const scenarios: MikingScenario[] = [
  {
    id: 'mix.meet.1',
    page: 'meet',
    prompt: 'A grand piano’s lid is open. Where does much of its sound go?',
    options: ['Off the lid toward the open side', 'Straight down into the floor beneath it', 'Back toward the pianist only'],
    correct: 'Off the lid toward the open side',
    explain: 'The soundboard and strings radiate under the lid, and the open lid throws much of it toward the open side — usually the hall. Lid height changes the balance before any mic does.',
    why: {
      'Straight down into the floor beneath it': 'Some goes down, but the lid sends much of it out to the side.',
      'Back toward the pianist only': 'The pianist hears it, but the open side carries most of it.',
    },
  },
  {
    id: 'mix.meet.2',
    page: 'meet',
    prompt: 'Why can one close mic not stand for the whole cello?',
    options: ['It hears one part of a large body', 'Cellos are too quiet for a close mic', 'A close mic hears only the bow noise'],
    correct: 'It hears one part of a large body',
    explain: 'A close mic hears the part of the instrument nearest it — one region of the body, the bow, an f-hole. The full sound forms a little farther away, with the room.',
    why: {
      'Cellos are too quiet for a close mic': 'Level is not the issue; a close mic hears a local part.',
      'A close mic hears only the bow noise': 'It hears much more than bow noise — but from one place.',
    },
  },
  {
    id: 'mix.meet.3',
    page: 'meet',
    prompt: 'The horn plays behind the strings. What reaches a main pair in front?',
    options: ['Much of it off the wall behind', 'Its bell sound, straight at the pair', 'Nothing until the strings stop'],
    correct: 'Much of it off the wall behind',
    explain: 'A horn’s bell points back past the player: much of what the room hears comes off the surface behind. Reflective walls and seating depth shape its balance.',
    why: {
      'Its bell sound, straight at the pair': 'The bell faces away from the pair.',
      'Nothing until the strings stop': 'The pair hears everyone at once, the horn largely by reflection.',
    },
  },
  {
    id: 'mix.set.1',
    page: 'setups',
    prompt: 'A quiet line is lost against the others. What do you try first?',
    options: ['Ask the players about the balance', 'Add a close spot and raise it up high', 'Boost that range with EQ on the bus'],
    correct: 'Ask the players about the balance',
    explain: 'Resolve an avoidable acoustic imbalance with the musicians first — orientation, seating depth, reflective walls, the piano lid — with the players’ and the conductor’s approval, before any spot gain.',
    why: {
      'Add a close spot and raise it up high': 'A loud spot detaches the line; the balance is the players’ first.',
      'Boost that range with EQ on the bus': 'EQ lifts the others in that range too; fix the balance at its source.',
    },
  },
  riggingCheck('mix', 'setups'),
  hearingCheck('mix', 'setups', 'the full ensemble’s peaks'),
  {
    id: 'mix.mic.1',
    page: 'microphone',
    prompt: 'Which pair relies mainly on level differences between its mics?',
    options: ['A coincident X/Y pair', 'A spaced pair of omnis', 'A three-omni tree array'],
    correct: 'A coincident X/Y pair',
    explain: 'With the capsules together, both mics hear each player at the same instant: the image comes from the level differences of the two angled cardioids.',
    why: {
      'A spaced pair of omnis': 'Spacing adds time differences — that is its main cue.',
      'A three-omni tree array': 'Three spaced omnis: time differences again, with a centre mic.',
    },
  },
  ortfFixed('mix', 'microphone'),
  msMono('mix', 'microphone'),
  {
    id: 'mix.mic.2',
    page: 'microphone',
    prompt: 'What do sphere attachments on a tree’s omnis change?',
    options: ['Their directivity a little, by frequency', 'Their power: they need no phantom power then', 'Nothing a listener could hear'],
    correct: 'Their directivity a little, by frequency',
    explain: 'A compatible sphere makes an omni a little more directional at higher frequencies and adds some presence. It is optional — follow the maker’s fitting instructions.',
    why: {
      'Their power: they need no phantom power then': 'An attachment does not change how the mic is powered.',
      'Nothing a listener could hear': 'They change the frequency-dependent directivity — a real, if modest, change.',
    },
  },
  {
    id: 'mix.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Where does a grand piano with its lid open send much of its sound?',
    options: ['Toward the open side, off the lid', 'Straight up into the air, away from the lid', 'Under the piano, onto the floor'],
    correct: 'Toward the open side, off the lid',
    explain: 'The lid reflects the soundboard’s sound toward its open side: a main array often hears the piano well from there.',
    why: {
      'Straight up into the air, away from the lid': 'The lid is above the strings; it turns the sound sideways.',
      'Under the piano, onto the floor': 'Some goes down, but most leaves on the open side.',
    },
  },
  {
    id: 'mix.place.1',
    page: 'placement',
    prompt: 'The pair is close and the violin and cello in front dominate. First change?',
    options: ['Raise it or move it farther back', 'Add spots for the players behind', 'Turn the whole group down at once'],
    correct: 'Raise it or move it farther back',
    explain: 'Close in, the front players are much nearer than the back ones. Raise the array or move it back to even the distances — one change at a time, compared at matched level.',
    why: {
      'Add spots for the players behind': 'Spots first hides a placement problem with overlap.',
      'Turn the whole group down at once': 'Level changes everyone equally; the distances still differ.',
    },
  },
  {
    id: 'mix.place.2',
    page: 'placement',
    prompt: 'You must compare two pair positions. How do you judge them fairly?',
    options: ['Same passage, matched listening level', 'Whichever one sounds louder at first hearing', 'Two different pieces, for variety'],
    correct: 'Same passage, matched listening level',
    explain: 'Compare at a consistent level on the same music, so louder never wins by itself; change one placement variable at a time.',
    why: {
      'Whichever one sounds louder at first hearing': 'Louder tends to sound better at first — the comparison is unfair.',
      'Two different pieces, for variety': 'Different music changes the balance; compare like with like.',
    },
  },
  noThreeToOne('mix', 'placement'),
  {
    id: 'mix.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Why does a support mic hear only part of an instrument?',
    options: ['It is close to one part of a large body', 'Supports are a different kind of microphone', 'It is aimed away from that player'],
    correct: 'It is close to one part of a large body',
    explain: 'Close in, a mic favours the part of the instrument nearest it. The pair hears the whole instrument with the room; a support adds one local view.',
    why: {
      'Supports are a different kind of microphone': 'They can be the same kind; closeness is what changes the view.',
      'It is aimed away from that player': 'A support aims at its players; distance sets how local its view is.',
    },
  },
  {
    id: 'mix.ctx.1',
    page: 'context',
    prompt: 'A concert is recorded and reinforced. Should the ambience pair feed the PA?',
    options: ['Keep it for the recording only', 'Send it: it sounds the most natural of them all', 'Send it, but only into the wedges'],
    correct: 'Keep it for the recording only',
    explain: 'Give every mic a role. An ambience or main recording pair need not feed the PA or the wedges; reinforcement comes from close, aimed mics.',
    why: {
      'Send it: it sounds the most natural of them all': 'Natural for a recording, but a distant pair in the PA hears the PA back.',
      'Send it, but only into the wedges': 'Wedges are where feedback starts; a distant pair is the last thing to send there.',
    },
  },
  {
    id: 'mix.ctx.2',
    page: 'context',
    prompt: 'A shared digital split: you lower one input’s gain for the PA. What else changes?',
    options: ['Every feed that depends on that preamp', 'Only the PA’s own mix, and nothing else at all', 'Nothing until the show starts'],
    correct: 'Every feed that depends on that preamp',
    explain: 'With a shared preamp, one gain change reaches every dependent feed — the recording too — unless a gain-compensation system intervenes. Agree who controls gain and phantom power.',
    why: {
      'Only the PA’s own mix, and nothing else at all': 'A shared preamp feeds every path at once.',
      'Nothing until the show starts': 'The change happens at once, for every feed on it.',
    },
  },
  {
    id: 'mix.ctx.studio',
    page: 'context',
    prompt: 'STUDIO · A chamber group in a good room, no PA. Where do you start?',
    options: ['One main array alone, then listen', 'A close mic on each player first', 'Ambience mics first, the pair last'],
    correct: 'One main array alone, then listen',
    explain: 'Build the sound with one main array first if the room and the music allow it; add a support only for a named problem.',
    why: {
      'A close mic on each player first': 'Close mics first lose the shared picture and add overlap.',
      'Ambience mics first, the pair last': 'Ambience is added after a usable direct image.',
    },
  },
  {
    id: 'mix.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · The horn’s bell points back. Where does a monitor near it reach?',
    options: ['Into the mics on the stage, too', 'Only the horn player’s own ears', 'Nowhere: monitors are directional'],
    correct: 'Into the mics on the stage, too',
    explain: 'A monitor radiates into every nearby mic, not only the player’s ears. Place it with the mics’ rejection in mind, and keep its level to what the players need.',
    why: {
      'Only the horn player’s own ears': 'Its sound reaches every mic near it as well.',
      'Nowhere: monitors are directional': 'Directional, not exclusive: nearby mics still hear it.',
    },
  },
  supportFirst('mix', 'twoMic'),
  {
    id: 'mix.two.1',
    page: 'twoMic',
    prompt: 'What sets the delay between the pair and the cello spot?',
    options: ['The path difference from the cello', 'The distance between the two microphones', 'The polarity switch on the spot'],
    correct: 'The path difference from the cello',
    explain: 'The relevant distance is the difference in paths from the source to each mic, not the separation between the mics: 1 m of path difference is about 2.9 ms.',
    why: {
      'The distance between the two microphones': 'Two mics can be far apart yet equally distant from a player.',
      'The polarity switch on the spot': 'Polarity flips the sign; it does not move the arrival.',
    },
  },
  {
    id: 'mix.two.2',
    page: 'twoMic',
    prompt: 'The pair plus the spot sound thin in the low notes. First change?',
    options: ['Lower the spot or move it, then compare', 'Flip the polarity until it sounds fuller', 'Add a fixed delay from the distance'],
    correct: 'Lower the spot or move it, then compare',
    explain: 'Compare main alone, spot alone and both. Try the spot’s level, placement or angle first; a polarity flip only tests one relationship, and a delay is a trial judged by ear.',
    why: {
      'Flip the polarity until it sounds fuller': 'A flip changes the sign, not the time difference behind the thinness.',
      'Add a fixed delay from the distance': 'Distance alone sets no universal delay; level and placement come first.',
    },
  },
  {
    id: 'mix.prac.gain',
    page: 'practice',
    prompt: 'How do you set conservative gain for a mixed ensemble?',
    options: ['On the expected performance peaks', 'On the quietest solo passage in the piece', 'On the piano’s tuning note alone'],
    correct: 'On the expected performance peaks',
    explain: 'Set gain on the full ensemble’s peaks with headroom; one loud excerpt is not the whole piece — check quiet entrances too.',
    why: {
      'On the quietest solo passage in the piece': 'The first loud chord would then overload.',
      'On the piano’s tuning note alone': 'One quiet note says nothing about the ensemble’s peaks.',
    },
  },
  {
    id: 'mix.prac.3',
    page: 'practice',
    prompt: 'You may add up to two supports at first. What earns each one?',
    options: ['A musical reason you can state', 'One for each instrument family on stage', 'Spare inputs on the split'],
    correct: 'A musical reason you can state',
    explain: 'Explain the musical reason for each support, compare the main sound with the combination at matched level, and test for noise and changes in perspective.',
    why: {
      'One for each instrument family on stage': 'A support per family adds overlap without a reason.',
      'Spare inputs on the split': 'Spare inputs are not a musical reason.',
    },
  },
  abHole('mix', 'practice'),
  treeCentre('mix', 'practice'),
  supportNeed('mix', 'practice', 'a featured line'),
];

const symptoms: Symptom[] = [
  {
    id: 'mix.s.front',
    observation: 'The front row dominates',
    firstChecks: 'Does the main placement favour the nearby players? Adjust the array’s height or distance and rehearse the balance.',
    options: ['Adjust height or distance; rehearse', 'Add a spot on each of the back-row players', 'Cut the front players with EQ'],
    correct: 'Adjust height or distance; rehearse',
    explain: 'Even the distances with height or distance, one change at a time, and rehearse the balance with the players.',
    why: { 'Add a spot on each of the back-row players': 'Spots first add overlap; move the array.', 'Cut the front players with EQ': 'EQ cannot separate players who share a range.' },
  },
  {
    id: 'mix.s.winds',
    observation: 'The winds disappear when the strings play',
    firstChecks: 'Coverage or musical masking? Check the seating and the main balance, then a targeted support.',
    options: ['Check seating and balance, then a support', 'Raise the whole mix until the winds appear', 'Pan the winds hard to one side'],
    correct: 'Check seating and balance, then a support',
    explain: 'Seating depth and the main balance come first; a support for a named line follows.',
    why: { 'Raise the whole mix until the winds appear': 'Raising everything keeps the strings on top.', 'Pan the winds hard to one side': 'Panning moves them; it does not uncover them.' },
  },
  {
    id: 'mix.s.detach',
    observation: 'The soloist seems detached from the group',
    firstChecks: 'Is the spot too close or too loud? Reduce the support and reassess the perspective.',
    options: ['Lower the spot; reassess the perspective', 'Move the spot in closer to the soloist still', 'Add reverb only to the soloist'],
    correct: 'Lower the spot; reassess the perspective',
    explain: 'A spot that is too loud or too close pulls the soloist forward of the group: lower it until the line is clear but belongs.',
    why: { 'Move the spot in closer to the soloist still': 'Closer detaches it further.', 'Add reverb only to the soloist': 'Reverb masks the symptom; the spot’s level is the cause.' },
  },
  {
    id: 'mix.s.middle',
    observation: 'The middle is weak',
    firstChecks: 'Main-array geometry or panning? Check the spacing and the centre contribution before adding more channels.',
    options: ['Check spacing and the centre feed', 'Add two more mics out at the far sides', 'Pan the pair wider still'],
    correct: 'Check spacing and the centre feed',
    explain: 'A spaced pair too wide, or a tree’s centre too low, thins the middle: check those before adding channels.',
    why: { 'Add two more mics out at the far sides': 'More side mics widen it further.', 'Pan the pair wider still': 'Wider panning deepens the hole.' },
  },
  {
    id: 'mix.s.hollow',
    observation: 'Low notes become hollow',
    firstChecks: 'Overlapping paths or a polarity issue? Compare the channels separately, then reduce or reposition a support.',
    options: ['Compare channels; reduce or move a support', 'Boost the low end on the bus until it fills', 'Add a sub to the recording mix'],
    correct: 'Compare channels; reduce or move a support',
    explain: 'Hollow lows are often a support combing with the main array: compare each channel, then lower or move the support.',
    why: { 'Boost the low end on the bus until it fills': 'A boost cannot fill a comb notch.', 'Add a sub to the recording mix': 'A loudspeaker does not fix a combing in the capture.' },
  },
  {
    id: 'mix.s.clip',
    observation: 'Accents distort',
    firstChecks: 'An overload in a mic, an adapter, a preamp or a converter? Find the clipping stage and correct it.',
    options: ['Find the clipping stage; fix its gain', 'Soften the accents with EQ and a limiter', 'Move all of the mics farther back'],
    correct: 'Find the clipping stage; fix its gain',
    explain: 'Distortion on accents is overload somewhere in the chain: find which stage clips, then its pad or gain.',
    why: { 'Soften the accents with EQ and a limiter': 'EQ cannot repair clipping.', 'Move all of the mics farther back': 'That changes the perspective; the clipping stage is still clipping.' },
  },
  {
    id: 'mix.s.ring',
    observation: 'The PA rings before it is loud enough',
    firstChecks: 'Poor rejection or too many open mics? Lower the gain, then revise the source and loudspeaker geometry.',
    options: ['Lower gain; revise the geometry', 'Notch the ring and push the level', 'Send the main pair to the PA too'],
    correct: 'Lower gain; revise the geometry',
    explain: 'Lower the gain at once; then aim the mics with the loudspeakers in mind and close the mics that are not needed.',
    why: { 'Notch the ring and push the level': 'Never work at the edge of feedback.', 'Send the main pair to the PA too': 'A distant pair in the PA makes ringing likelier.' },
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'mix.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A recording of a mixed chamber group (strings, winds, piano) in a good room; no PA. Phantom power on every input.',
    setups: [
      { id: 'a', label: 'An X/Y pair about 2 m in front and 2.2 m up, on a tall stand', ok: true, power: 'phantom', feedback: 'The group and the room as one picture, a dependable mono sum.' },
      { id: 'b', label: 'A 17 cm, 110° pair in the same place, plus one support for a quiet line', ok: true, power: 'phantom', feedback: 'Fair: one main array, one support for a stated need.' },
      { id: 'c', label: 'A close mic on each player and no main array', ok: false, power: 'phantom', feedback: 'No shared perspective, and many overlapping paths.' },
      { id: 'd', label: 'A spaced pair 3 m apart, right in front of the players', ok: false, power: 'phantom', feedback: 'Too wide and too close: a hole in the middle, the front players on top.' },
      { id: 'e', label: 'A pair on the floor at the players’ feet', ok: false, power: 'phantom', feedback: 'Too low and too close: the front players hide the others.' },
    ],
    reasons: [PAIR_REASON, SAFE_REASON, POWER_REASON, BRAND_REASON, SPOTS_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: one main array first, safely mounted, supports only for a stated need.',
  },
  {
    id: 'mix.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · The same group in a large hall, recorded and lightly reinforced. Phantom power is available on the split.',
    setups: [
      { id: 'a', label: 'The main pair for the recording only; close aimed mics for the PA', ok: true, power: 'phantom', feedback: 'Roles kept apart: capture from the pair, reinforcement from close mics.' },
      { id: 'b', label: 'A pair for the recording, one shared support feeding both, gain agreed', ok: true, power: 'phantom', feedback: 'Fair, with the shared-gain consequences agreed.' },
      { id: 'c', label: 'The ambience pair sent to the wedges', ok: false, power: 'phantom', feedback: 'A distant pair in the wedges invites feedback.' },
      { id: 'd', label: 'A boom over the players, untested, to reach the piano', ok: false, power: 'phantom', feedback: 'Nothing over the players without a safe, rated mount.' },
      { id: 'e', label: 'Turn the PA up until it rings, then back off a little', ok: false, power: 'phantom', feedback: 'Never provoke feedback; start conservative.' },
    ],
    reasons: [PAIR_REASON, SAFE_REASON, { id: 'r.roles', label: 'Each mic has a role: capture, PA, or both', role: 'required', feedback: 'Explicit roles keep the recording pair out of the PA.' }, POWER_REASON, BRAND_REASON],
    explain: 'Two setups pass. What passes is the reasoning: clear roles, a main array for the recording, safe mounts and no provoked feedback.',
  },
];

const predictions: EnsembleLesson['predictions'] = {
  microphone: { prompt: 'Before you look: which pattern rejects most of the room behind it?', options: ['Cardioid', 'Omni', 'They reject the same'], after: 'Now sweep SOURCE ANGLE round the pattern and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the pair from 1.5 m to 3 m in front. What changes most?', options: ['More blend and more room', 'Only the level', 'The front players dominate more'], after: 'Farther back, the distances to the front and back players even out: the NEAR / FAR readout shrinks, and the room comes up. Compare at matched level.' },
  context: { prompt: 'The monitor sits in front of the cello spot, a little to the side. Can its rejection reach it?', options: ['Yes — turn the mic’s back toward it', 'No — only an omni can', 'It is already in the null'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'A main pair and a cello spot. If you flip B’s polarity, what happens to Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE to another player.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'mix.q.1',
    covers: 'meet',
    prompt: 'Where does a horn’s sound mostly reach the room from?',
    options: ['Off the wall behind it', 'Straight out of the front', 'Up from the player’s hands'],
    correct: 'Off the wall behind it',
    explain: 'The bell points back past the player; the surface behind shapes what the room hears.',
    why: { 'Straight out of the front': 'The bell faces backward.', 'Up from the player’s hands': 'The right hand sits in the bell; the bell points back.' },
  },
  {
    id: 'mix.q.2',
    covers: 'meet',
    prompt: 'What does an open piano lid do to its sound?',
    options: ['Throws it toward the open side', 'Keeps the sound inside the case', 'Points it at the pianist'],
    correct: 'Throws it toward the open side',
    explain: 'The lid reflects the soundboard’s sound toward its open side — usually the hall.',
    why: { 'Keeps the sound inside the case': 'Open, the lid sends the sound out.', 'Points it at the pianist': 'The pianist sits at the keyboard end; the lid opens to the side.' },
  },
  {
    id: 'mix.q.3',
    covers: 'meet',
    prompt: 'Why does a main array hear the ensemble as one sound?',
    options: ['It hears every player with the room', 'It is aimed straight at the loudest player', 'It is closest to the strings'],
    correct: 'It hears every player with the room',
    explain: 'From a little distance the array hears every instrument and the room’s reflections together — the blend a close mic cannot hear.',
    why: { 'It is aimed straight at the loudest player': 'It is aimed at the whole group.', 'It is closest to the strings': 'Its distance evens out the players; that is the point.' },
  },
  {
    id: 'mix.q.4',
    covers: 'setups',
    prompt: 'For a group 3–4 m wide, where might a first main pair go?',
    options: ['In front, about 2 m up', 'Among the players, at chest height', 'At the back wall, near the floor'],
    correct: 'In front, about 2 m up',
    explain: 'Try it about 1.5–3 m in front and 2–2.5 m up — a place to start, then one change at a time.',
    why: { 'Among the players, at chest height': 'Among the players it hears whoever is nearest — and blocks them.', 'At the back wall, near the floor': 'Low and far, it hears the room more than the group.' },
  },
  {
    id: 'mix.q.5',
    covers: 'setups',
    prompt: 'How many supports might you add at first, and why?',
    options: ['At most two, each with a reason', 'One for each player, to be safe', 'None: a pair is enough'],
    correct: 'At most two, each with a reason',
    explain: 'Start with the main array; add at most two supports at first, each for a musical reason you can state.',
    why: { 'One for each player, to be safe': 'Many supports add overlap without a reason.', 'None: a pair is enough': 'Sometimes a line needs help; a stated reason earns a support.' },
  },
  riggingDiag('mix'),
];

export const E13_LESSON: EnsembleLesson = {
  id: 'E13',
  labId: 'ensembles',
  title: 'Mixed Classical Ensembles',
  subtitle: 'A chamber group or an orchestra: one main array first, the tree and its centre, supports for a named need',
  noun: { one: 'mixed ensemble', many: 'mixed ensembles' },
  model: E13_MODEL,
  micTypeIds: ['arrCard', 'arrOmni', 'arrFig8'],
  zones: E13_ZONES,
  setupPairs: [
    { label: 'The main pair and a cello spot', A: { zone: 'ch.main', typeId: 'arrCard', pattern: 'cardioid' }, B: { zone: 'ch.spot', typeId: 'arrCard', pattern: 'cardioid' }, variants: ['chamber'], line: 'A featured line supported under the pair; check the sum in mono.' },
    { label: 'The main pair and a woodwind support', A: { zone: 'orc.main', typeId: 'arrOmni', pattern: 'omni' }, B: { zone: 'orc.sup', typeId: 'arrCard', pattern: 'cardioid' }, variants: ['orchestra'], line: 'A named need met under the pair; check the sum in mono.' },
  ],
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    {
      id: 'mix.prac.order',
      page: 'practice',
      prompt: 'A main array for a mixed ensemble, in order:',
      steps: [
        { text: 'Get the seating, the music and the players’ intended balance', early: 'Start with the plan and what the musicians want.' },
        { text: 'Check stands, cables and the players’ movement', early: 'Safety and movement come before sound.' },
        { text: 'Set conservative gain on the expected peaks', early: 'Gain comes once the mics are safely up.' },
        { text: 'Build the sound with one main array; check mono', early: 'The main array comes before any support.' },
        { text: 'Add at most two supports, each with a reason', early: 'Supports come after the main picture, for stated needs.' },
      ],
      explain: 'Plan with the players, check the safety of every stand and cable, set conservative gain, build the sound with one main array — and only then add a support for a stated reason.',
    },
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Chamber groups that combine strings, winds, brass, piano, harp, bass and percussion — and, at its largest, a chamber or full orchestra with a choir or soloist.', src: 'LESSON-MIXED' },
    { title: 'WHAT IT ASKS OF YOU', text: 'A purpose first: natural capture, production with independent control, reinforcement — or reinforcement and recording at once, each needing a different balance of main mics and supports.', src: 'LESSON-MIXED' },
    { title: 'HOW IT IS SEATED', text: 'Without a conductor, the players face each other and the hall; this lab draws strings in front, flute, clarinet and horn behind, the piano across the back.', src: 'LESSON-MIXED' },
    { title: 'ITS SIZE', text: 'This chamber group is about 3.5 m wide; the orchestra the methods grow into, about 10 m. Typical layouts, not particular ensembles.', src: 'LESSON-MIXED' },
  ],
  sound: {
    stages: [
      { title: 'Each family its own way', text: 'Strings radiate up and out from their top plates, the winds from their open holes and bells, the horn backward, the piano off its open lid.' },
      { title: 'The room answers', text: 'Reflections and reverberation join the instruments into one sound — the blend a main array hears.' },
      { title: 'A close mic hears a part', text: 'Close in, a mic hears the part of one instrument nearest it: useful control, but only part of its sound.' },
    ],
    attack: 'Bow, breath and hammer attacks reach a close mic first and clearest; a main array hears them softened by distance and the room.',
    body: 'The sustained sound of the instruments blended in the room. A main array hears more of the blend; a support or spot, more of one player. Tendencies — groups and rooms vary.',
    head: { diameterMm: 3500, rods: 0, label: 'a mixed ensemble', strikeSrc: 'LESSON-MIXED' },
  },
  setting: {
    items: [
      { id: 'players', label: 'the players’ sightlines, breathing, bowing, slides and pedals', short: 'PLAYERS', note: 'Every change with the players’ and the conductor’s approval; stands and cables clear of bows, slides, pedals and the players’ way in and out.', prov: { kind: 'sourced', src: 'LESSON-MIXED', quote: 'preserving sightlines, breathing, bowing, slides, pedals and instrument access (L14)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'piano', label: 'the piano’s lid', short: 'PIANO LID', note: 'The lid’s height changes the piano’s balance for everyone, including the main array: agree it before any spot gain.', prov: { kind: 'sourced', src: 'LESSON-MIXED', quote: 'Consider instrument orientation, seating depth, reflective walls and the piano lid (L14)' }, tag: 'BALANCE', scene: 'all' },
      { id: 'walls', label: 'reflective walls and seating depth', short: 'THE ROOM', note: 'A wall behind the horn, a deep stage behind the strings: the room shapes the balance the array hears.', prov: { kind: 'sourced', src: 'LESSON-MIXED', quote: 'reflective walls (L14)' }, tag: 'PART OF THE SOUND', scene: 'all' },
      { id: 'amps', label: 'any amplified instrument', short: 'AMP', note: 'Agree the amplifier’s level and orientation before placing nearby mics; a direct signal is a supplementary channel.', prov: { kind: 'sourced', src: 'LESSON-MIXED', quote: 'agree on the amplifier level and orientation before placing nearby microphones (L75)' }, tag: 'SPILL', scene: 'all' },
      { id: 'rig', label: 'anything over the players', short: 'RIGGING', note: 'A tree’s span and forward reach need safe support: manufacturer-rated hardware and qualified venue personnel for anything suspended.', prov: { kind: 'sourced', src: 'LESSON-MIXED', quote: 'Use manufacturer-rated mounting equipment and qualified venue personnel (L49)' }, tag: 'VENUE ONLY', scene: 'all' },
      { id: 'pa', label: 'the PA and the monitors', short: 'PA', note: 'Use the mics’ real polar diagrams to place monitors; recheck after any move. Only the monitor level and sources the performers need.', prov: { kind: 'sourced', src: 'LESSON-MIXED', quote: 'Use the actual polar diagrams to position monitors (L86)' }, tag: 'FEEDBACK', scene: 'stage' },
      { id: 'split', label: 'the split and shared preamps', short: 'SPLIT', note: 'A shared digital preamp’s gain change reaches every feed on it; agree who controls gain and phantom power.', prov: { kind: 'sourced', src: 'LESSON-MIXED', quote: 'Shared digital preamp gain changes affect all dependent feeds (L88)' }, tag: 'ROLES', scene: 'stage' },
      { id: 'room', label: 'the room’s own sound', short: 'AMBIENCE', note: 'Separate ambience mics only after a usable direct image, brought in from silence.', prov: { kind: 'sourced', src: 'LESSON-MIXED', quote: 'add separate ambience microphones only after establishing a usable direct ensemble image (L77)' }, tag: 'LATER', scene: 'studio' },
    ],
    stage: 'LIVE: find out what already reaches the audience clearly. A quiet chamber event may need little reinforcement; a big room or loud accompaniment, close directional support. Give each mic a role — capture, PA, or both — and never provoke feedback.',
    studio: 'A RECORDING: build the sound with a main array alone first; compare positions at matched level; add at most two supports for stated reasons; ambience later, from silence.',
  },
  diagnostic,
  practice: {
    task: 'With the musicians’ intended balance agreed, check stands and cables, set conservative gain, build the sound with one main array, add at most two supports with stated reasons, and adapt for reinforcement without provoking feedback. With their agreement, log what you tried below.',
    fields: [
      { id: 'ens', label: 'The ensemble and its seating', kind: 'text' },
      { id: 'goal', label: 'What it is for', kind: 'choice', choices: ['recording', 'reinforcement', 'both'] },
      { id: 'array', label: 'Main array: method, spacing, height, distance', kind: 'text' },
      { id: 'supports', label: 'Supports, and the reason for each', kind: 'text' },
      { id: 'roles', label: 'Which mics feed the PA, which only the recording', kind: 'text' },
      { id: 'notes', label: 'What you heard: balance, width, room, mono (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The chamber group is a drawing default: violin, viola, cello and double bass on an arc 1.6 m round a point 1.5 m in front, flute, clarinet and horn 1.5 m behind the front line, a 2.1 m grand across the back — about 3.5 m wide.', dims: [] },
    { text: 'The chamber pair is drawn 2.2 m in front and 2.2 m up (inside the suggested 1.5–3 m and 2–2.5 m trial). The cello spot is drawn 0.9 m out (inside the cello lesson’s 0.6–1.2 m).', dims: [] },
    { text: 'The orchestra, its tree (2 m × 1.5 m, one maker’s example) and its outriggers (≈ 6.1 m apart, 1.5 m in front of the outer strings: practice) are the Full Orchestra lesson’s drawing.', dims: [] },
  ],
  live: { wedges: E13_WEDGES },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. A mixed ensemble has no single right setup: agree the balance with the players, build the sound with one main array, then add a support only for a stated reason. Every ensemble, room and production is different: experiment, compare at matched level, and trust your ears. The lab is silent and draws a simplified picture: typical seatings, ideal patterns, straight paths and distances read from the drawing. Anything suspended is the venue’s, by qualified personnel; protect your hearing.',
  copy: { words: ensembleWords('ensemble') },
  ensemble: {
    seatings: { chamber: 'chamber.mixed', orchestra: 'orch.american' },
    setups: E13_SETUPS,
    placeZones: E13_PLACE,
    worked: { chamber: 'xy', orchestra: 'oab' },
    meet: {
      figureTitle: 'A MIXED CHAMBER GROUP',
      figureBadge: 'From above, as the audience faces it · a typical layout, not a particular group',
      sectionsNote: 'Strings on an arc in front, flute, clarinet and horn behind them, the grand piano across the back with its lid open toward the hall. Switch SEATING for the orchestra. Tap a player.',
      soundNote: 'The arcs show WHERE each instrument’s sound leaves it — never how loud. The horn points back, the piano off its lid, the strings up and out: a main array hears the blend the room makes of them.',
      mainAt: CH_C,
    },
    before: [
      { title: 'GET THE PLAN', text: 'The seating plan, the instrumentation, the score or set list, the expected dynamics and the conductor’s or players’ priorities — and the passages where a quiet line must carry.' },
      { title: 'LISTEN', text: 'From several sensible positions at safe levels while the players rehearse; a mic position need not be the best audience seat.' },
      { title: 'DEFINE THE PERSPECTIVE', text: 'Blended and spacious, closer and more articulate, dry and individually controlled, or just enough reinforcement — in plain words, before choosing mics.' },
      { title: 'BALANCE AT THE SOURCE', text: 'Resolve avoidable imbalance with the musicians first: orientation, seating depth, reflective walls, the piano lid — with their approval.' },
    ],
    safety: 'Stable stands, protected cable routes and the players’ movement come first. A tree needs safe support for its span and reach: manufacturer-rated hardware and qualified venue personnel for anything suspended — never ordinary cable as suspension. Protect your hearing; never provoke feedback.',
    workedWords: {
      begin: 'After our research, this is where we suggest you begin with a chamber group: one main pair in front and a little above — a place to start and compare, not a rule.',
      clearance: 'The stand in front of the group, clear of the players’ sightlines, bows and slides, and of the audience’s way; its cable dressed flat and out of the walkways.',
    },
    learnZones: [
      'What you just did, in words. After our research, the blue zones are where we suggest you begin with the main array’s centre — for a chamber group, 1.5–3 m in front and 2–2.5 m up; for an orchestra, over or just behind the podium, 3–4 m up. Places to start and compare, not measurements of a best place.',
      'Change one variable at a time — distance, height, then the spacing or angle — and compare at a consistent monitoring level on the same passage.',
      'Keep the array’s own geometry as you move it; a different spacing is a different method, chosen on purpose.',
    ],
  },
};
