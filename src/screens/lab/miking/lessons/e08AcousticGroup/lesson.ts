/**
 * E08 ACOUSTIC DUOS AND SMALL GROUPS — the lesson as DATA (the 2026-10-07
 * journey). Words from the owner's lesson (docs/labs/miking/source_text/
 * Acoustic-Duos-and-Small-Groups-Miking-Technique.txt; "L<n>" in comments
 * only); research in docs/labs/miking/acoustic_small_group/; corrections
 * G4-E08-* in CORRECTIONS_LOG.md (the 3:1 example reworded to mic-to-mic;
 * the academy name and the institutional wording not carried; the
 * published equal-distance rule added). A thin lesson: the 3:1 and
 * equal-distance readouts are derived from the drawing (stagePlot.ts).
 * Suggested starting points; no sources on screen; FULLY SILENT.
 */
import type { DiagnosticItem, LessonPages, MikingScenario, SetupTask, Symptom } from '../../engine/model/types.ts';
import type { EnsembleLesson } from '../shared/ensemble/ensembleData.ts';
import { abHole, BRAND_REASON, ensembleWords, hearingCheck, msMono, noThreeToOne, ortfFixed, POWER_REASON } from '../shared/ensemble/ensembleItems.ts';
import { E08_MODEL, E08_PLACE, E08_SETUPS, E08_WEDGES, E08_ZONES, PAIR_C } from './geometry.ts';

const pages: LessonPages = {
  meet: {
    title: 'Meet it — where the sound comes from',
    goal: 'Meet an acoustic duo and a small group — guitar and mandolin; guitar, fiddle and bass — and see where each sound leaves: the guitar’s top, the mandolin’s bright opening, the fiddle up from under the chin, the bass low at its bridge.',
    credit: { scenarios: ['ac.meet.1', 'ac.meet.2', 'ac.meet.3'], note: 'Answer the three checks on where the sound leaves.' },
    takeaway: 'Quiet groups make their sound in the room. Where each player sits — and how far from a main mic — is part of the mix before any mic is chosen.',
  },
  setups: {
    title: 'Starting setups',
    goal: 'See real setups drawn on the group — an X/Y and a 17 cm pair where the players are equally far, a spot for the quieter instrument, two or three spots kept far enough apart, a pickup through a DI.',
    credit: { scenarios: ['ac.set.1', 'ac.set.2', 'ac.hear'], interactive: 'setupsSeen', note: 'Look at every main setup on the drawing, and answer the three checks.' },
    takeaway: 'Ensemble-first or individual control — neither is more professional. Seat the players about the same distance from a main pair, change the seating before the EQ, and add a spot only for a clear reason.',
  },
  microphone: {
    title: 'Choose the microphones',
    goal: 'Compare coincident, near-coincident and spaced pairs by what they do for a small group, and choose spots by their pattern.',
    credit: { scenarios: ['ac.mic.1', 'ac.ortf', 'ac.ms', 'ac.rec.1'], note: 'Answer the four checks (one reaches back to where the sound leaves).' },
    takeaway: 'X/Y and M/S stay stable in mono; a near-coincident pair gives width with directionality; a spaced pair only in a quiet, useful room.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and move the pair yourself — closer, farther, higher — and watch the players’ distances to it: the equal-distance idea, read from the drawing.',
    credit: { scenarios: ['ac.place.1', 'ac.place.2', 'ac.31', 'ac.rec.2'], interactive: 'twoZones', note: 'Rest the pair’s centre, clear of the players, in two different suggested starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Move the pair in small steps and judge the blend, the room, the width and the mono sum. When the players sit about equally far from it, they arrive about equally — moving a player is often the simplest balance control.',
  },
  context: {
    title: 'Reinforcement and recording',
    goal: 'Turn the guitar spot so the guitarist’s wedge sits in its rejection — and decide what a small room really needs from a PA.',
    credit: { scenarios: ['ac.ctx.1', 'ac.ctx.2', 'ac.ctx.studio', 'ac.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: turn the guitar spot (or change its pattern) until the wedge sits in its rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Live favours close directional mics, pickups or DIs, a stereo pair only where it is safe. In a small room, less reinforcement may sound more natural. Stop the group before moving equipment; never chase feedback.',
  },
  twoMic: {
    title: 'The pair and a spot',
    goal: 'The main pair and the guitar spot: see how much earlier the spot hears the guitar, what polarity changes and what it does not, and judge the sum in mono.',
    credit: { scenarios: ['ac.first', 'ac.two.1', 'ac.two.2'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the three checks.' },
    takeaway: 'The relevant distance is the difference in paths from the player to each mic. Polarity changes the sign, never the time. Do not assume a polarity switch or a delay fixes poor geometry.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to its likely cause and the first change to try.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'The players first — their seating, angle and dynamics — then the pair, then the spots; EQ last. A thin mono sum is a geometry question before a processing one.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a small-group recording in order, choose and justify a setup for two briefs, and say what 3:1 can and cannot do.',
    credit: { scenarios: ['ac.prac.order', 'ac.prac.gain', 'ac.prac.setup1', 'ac.prac.setup2', 'ac.prac.3', 'ac.hole', 'ac.prac.4'], note: 'Put the steps in order, answer the gain check, complete both briefs, and answer the three reasoning cards. The observation sheet is optional.' },
    takeaway: 'Seat the group, capture it with the simplest credible pair, move the pair in small steps, change the players before the EQ, add one spot at a time for a reason, and check polarity and mono with everything on.',
  },
};

/* THE CHECKS. Lesson refs (comments only): meet L4–L6, L16, L20 · set L5–L7, L16–L17 · mic L9–L13 · place L10, L16–L17 · ctx L36–L39 · two L31–L32 · prac L27–L35, L107–L112. */
const scenarios: MikingScenario[] = [
  {
    id: 'ac.meet.1',
    page: 'meet',
    prompt: 'How does a mic aimed straight into a guitar’s sound hole tend to sound?',
    options: ['Boomy, heavy in the low end', 'Thin, with little of the body', 'Exactly like the guitar in the room'],
    correct: 'Boomy, heavy in the low end',
    explain: 'Straight at the hole a mic hears the air resonance and sounds boomy; toward the 12th fret or the bridge area it is usually more balanced.',
    why: {
      'Thin, with little of the body': 'The hole is where the low end is strongest, not weakest.',
      'Exactly like the guitar in the room': 'Close in, a mic hears one part of the instrument, not the whole.',
    },
  },
  {
    id: 'ac.meet.2',
    page: 'meet',
    prompt: 'Why can a mandolin or fiddle dominate a guitar’s mic?',
    options: ['Its bright highs carry along its axis', 'It is the loudest instrument in the group, by far', 'It radiates mostly into the floor'],
    correct: 'Its bright highs carry along its axis',
    explain: 'High-frequency sources like a mandolin or fiddle project bright highs in a narrow beam; keep them off a neighbour mic’s axis.',
    why: {
      'It is the loudest instrument in the group, by far': 'It need not be loud; its brightness is what cuts through.',
      'It radiates mostly into the floor': 'That is the upright bass, through its endpin.',
    },
  },
  {
    id: 'ac.meet.3',
    page: 'meet',
    prompt: 'What does an upright bass add through the floor?',
    options: ['Low vibration a stand can carry', 'Bright detail from the strings and the bow', 'Nothing the mics can pick up'],
    correct: 'Low vibration a stand can carry',
    explain: 'Low instruments and an upright bass excite room modes and floor vibration; isolate stands and mark the positions.',
    why: {
      'Bright detail from the strings and the bow': 'Detail comes from the top and strings; the floor carries the lows.',
      'Nothing the mics can pick up': 'A stand on the same floor can pass the vibration to a mic.',
    },
  },
  {
    id: 'ac.set.1',
    page: 'setups',
    prompt: 'One instrument dominates the pair. What do you try first?',
    options: ['Move the player or change their angle', 'Add a spot to the quieter one, and bring it up loud', 'EQ the louder one down in the mix'],
    correct: 'Move the player or change their angle',
    explain: 'Physical arrangement is part of the mix: move a loud instrument farther, raise a quiet one, rotate a directional source — before EQ or spots.',
    why: {
      'Add a spot to the quieter one, and bring it up loud': 'A loud spot detaches the line; balance the players first.',
      'EQ the louder one down in the mix': 'In a pair, both players share the same channels — EQ moves both.',
    },
  },
  {
    id: 'ac.set.2',
    page: 'setups',
    prompt: 'Which approach is the more professional one for a small group?',
    options: ['Neither: it depends on the room and the aim', 'Close mics on each player, for the most control', 'One pair, because fewer mics sound purer'],
    correct: 'Neither: it depends on the room and the aim',
    explain: 'Neither approach is automatically more professional. Ensemble-first keeps the interaction and the room; individual control lets you adjust each source later.',
    why: {
      'Close mics on each player, for the most control': 'More mics also bring more bleed, phase pairs and stands.',
      'One pair, because fewer mics sound purer': 'A pair can be right — but for the room and the aim, not as a rule.',
    },
  },
  hearingCheck('ac', 'setups', 'a loud strummed chorus'),
  {
    id: 'ac.mic.1',
    page: 'microphone',
    prompt: 'Which pair keeps the most stable image and mono sum?',
    options: ['A coincident X/Y pair', 'A spaced pair of omnis', 'Two spots, one on each player'],
    correct: 'A coincident X/Y pair',
    explain: 'With the capsules at the same point, the pair hears each player at the same time: stable localisation and a dependable mono sum.',
    why: {
      'A spaced pair of omnis': 'Spacing adds timing differences that can blur the image and change the tone in mono.',
      'Two spots, one on each player': 'Two spots are separate mics, not a stereo pair.',
    },
  },
  ortfFixed('ac', 'microphone'),
  msMono('ac', 'microphone'),
  {
    id: 'ac.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Where does a fiddle’s sound leave?',
    options: ['Up and out from the top, under the chin', 'Straight down from the back plate into the floor', 'From the scroll at the end of the neck'],
    correct: 'Up and out from the top, under the chin',
    explain: 'The top plate and f-holes radiate up and out — bright along the bow’s line — so a spot sits in front and a little above.',
    why: {
      'Straight down from the back plate into the floor': 'The back radiates too, but much less toward a front mic.',
      'From the scroll at the end of the neck': 'The scroll radiates very little.',
    },
  },
  {
    id: 'ac.place.1',
    page: 'placement',
    prompt: 'The outer player is weak in the pair. First change?',
    options: ['Seat the group to fill the pair’s angle', 'Turn the outer player up in the mix to compensate', 'Add a spot on the outer player'],
    correct: 'Seat the group to fill the pair’s angle',
    explain: 'If the group does not fill the pair’s pickup angle, widen or move the array — or rearrange the players — before adding mics.',
    why: {
      'Turn the outer player up in the mix to compensate': 'In a pair the outer player has no fader of their own.',
      'Add a spot on the outer player': 'A spot can help later; placement and seating come first.',
    },
  },
  {
    id: 'ac.place.2',
    page: 'placement',
    prompt: 'Why seat the players about the same distance from the main mic?',
    options: ['So they arrive at about the same level', 'So the mic needs less phantom power to run', 'So the 3:1 rule is met for the pair'],
    correct: 'So they arrive at about the same level',
    explain: 'For a small string or horn group, arranging the players at an equal distance from the mic lets them arrive about equally — the balance then comes from their playing.',
    why: {
      'So the mic needs less phantom power to run': 'Phantom power does not depend on the players’ distances.',
      'So the 3:1 rule is met for the pair': '3:1 is for separate mics, never the spacing of one pair.',
    },
  },
  noThreeToOne('ac', 'placement'),
  {
    id: 'ac.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Where should a guitar spot start?',
    options: ['Toward the 12th fret or the bridge area', 'Straight into the sound hole, as close as possible', 'Behind the guitar, at its back'],
    correct: 'Toward the 12th fret or the bridge area',
    explain: 'Aim a guitar spot near the 12th fret or the bridge area rather than straight into the sound hole.',
    why: {
      'Straight into the sound hole, as close as possible': 'That tends to sound boomy.',
      'Behind the guitar, at its back': 'The back radiates far less than the top.',
    },
  },
  {
    id: 'ac.ctx.1',
    page: 'context',
    prompt: 'A duo plays a small room through a mono PA. Which approach?',
    options: ['A close or narrowly compatible one', 'A wide spaced pair, for a bigger sound', 'Two mics spaced as wide as the stage'],
    correct: 'A close or narrowly compatible one',
    explain: 'In a mono PA, do not build a wide stereo array just because two mics are available; use a mono or narrowly compatible approach when it is safer and clearer.',
    why: {
      'A wide spaced pair, for a bigger sound': 'Summed to mono, a wide pair can thin out — and feed back sooner.',
      'Two mics spaced as wide as the stage': 'Wider spacing makes the mono sum worse.',
    },
  },
  {
    id: 'ac.ctx.2',
    page: 'context',
    prompt: 'The guitar has a pickup. What does it give a live set?',
    options: ['A stable source with strong gain margin', 'The exact sound of the guitar in the room', 'Nothing a microphone does not already give'],
    correct: 'A stable source with strong gain margin',
    explain: 'For an acoustic-electric instrument, a pickup or DI often gives the stable foundation, with a microphone blended for natural detail when the stage allows.',
    why: {
      'The exact sound of the guitar in the room': 'A direct tone may not match the acoustic picture.',
      'Nothing a microphone does not already give': 'It hears no stage spill and feeds back far less.',
    },
  },
  {
    id: 'ac.ctx.studio',
    page: 'context',
    prompt: 'STUDIO · A duo in a good-sounding room. Where do you start?',
    options: ['The simplest credible pair, then listen', 'A close mic on each player first', 'Two room mics, the pair added later'],
    correct: 'The simplest credible pair, then listen',
    explain: 'Seat the musicians in their performance arrangement and capture a rehearsal with the simplest credible stereo array; then move it in small steps.',
    why: {
      'A close mic on each player first': 'Close mics first lose the shared picture.',
      'Two room mics, the pair added later': 'The room comes after a usable direct image.',
    },
  },
  {
    id: 'ac.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Where does a fiddle’s bright sound carry?',
    options: ['Along its own axis, into nearby mics', 'Only to the player’s own ear, nearby', 'Down into the floor under the player'],
    correct: 'Along its own axis, into nearby mics',
    explain: 'Keep the brighter instrument off a neighbour mic’s axis — out of the most aggressive bow or pick line.',
    why: {
      'Only to the player’s own ear, nearby': 'It reaches every mic in its path.',
      'Down into the floor under the player': 'The fiddle radiates up and out; the bass reaches the floor.',
    },
  },
  {
    id: 'ac.first',
    page: 'twoMic',
    prompt: 'The guitar spot is 1.3 m closer to the guitar than the pair. What happens?',
    options: ['It hears the guitar about 4 ms earlier', 'Both mics hear it at the same time', 'The pair hears the guitar earlier'],
    correct: 'It hears the guitar about 4 ms earlier',
    explain: 'Sound travels about 1 m in 2.9 ms: 1.3 m is close to 4 ms. Summed, the early spot changes the tone and the image — compare the pair alone, the spot alone and both.',
    why: {
      'Both mics hear it at the same time': 'They are at different distances, so the arrivals differ.',
      'The pair hears the guitar earlier': 'The spot is closer, so it hears the guitar first.',
    },
  },
  {
    id: 'ac.two.1',
    page: 'twoMic',
    prompt: 'The guitar DI and its mic sound hollow together. First check?',
    options: ['Each path alone, then the polarity', 'More low end on both of the channels to fill it', 'Pan them wide to hide it'],
    correct: 'Each path alone, then the polarity',
    explain: 'Mute-check each path, compare the polarity, move the mic, and use the smallest correction necessary.',
    why: {
      'More low end on both of the channels to fill it': 'A boost cannot fill a cancellation.',
      'Pan them wide to hide it': 'In mono the cancellation returns.',
    },
  },
  {
    id: 'ac.two.2',
    page: 'twoMic',
    prompt: 'A polarity switch makes the guitar fuller. What has it shown?',
    options: ['That one relationship sums better', 'That the delay between them is gone', 'That each note now sums well in mono'],
    correct: 'That one relationship sums better',
    explain: 'Do not assume a polarity switch or a digital delay fixes poor geometry; check with all mics on, in mono.',
    why: {
      'That the delay between them is gone': 'A polarity flip never moves an arrival in time.',
      'That each note now sums well in mono': 'A comb filter’s notches move with the notes; one flip suits some, not all.',
    },
  },
  {
    id: 'ac.prac.gain',
    page: 'practice',
    prompt: 'How do you set the gain for a small group?',
    options: ['On the loudest complete passage', 'On the quietest instrument’s solo', 'On a single strummed chord'],
    correct: 'On the loudest complete passage',
    explain: 'Set gain from the loudest complete passage and leave conservative headroom; listen for chair noise, page turns and the room too.',
    why: {
      'On the quietest instrument’s solo': 'The first loud chorus would overload.',
      'On a single strummed chord': 'One chord says nothing about the full group’s peaks.',
    },
  },
  {
    id: 'ac.prac.3',
    page: 'practice',
    prompt: 'Two spots are 50 cm apart, each 30 cm from its player. What does 3:1 suggest?',
    options: ['Move them to at least about 90 cm apart', 'Nothing: the 3:1 idea is only meant for vocals', 'Move each mic farther from its player'],
    correct: 'Move them to at least about 90 cm apart',
    explain: 'Keep the mics at least about 3 times farther apart than each is from its source: 3 × 30 cm = 90 cm. It reduces correlated leakage — it does not guarantee phase alignment.',
    why: {
      'Nothing: the 3:1 idea is only meant for vocals': '3:1 applies to any separate mics on adjacent sources.',
      'Move each mic farther from its player': 'Farther from the source raises the distance 3:1 asks for.',
    },
  },
  abHole('ac', 'practice'),
  {
    id: 'ac.prac.4',
    page: 'practice',
    prompt: 'The space makes 3:1 impossible. What are your options?',
    options: ['Fewer mics, a coherent pair, or accept bleed', 'Turn the leaking mics up so they cover the leakage', 'Add a mic between the two players'],
    correct: 'Fewer mics, a coherent pair, or accept bleed',
    explain: 'When space makes the rule impossible, reduce the number of mics, move the sources, use a coherent stereo pair, or accept the bleed as part of the ensemble.',
    why: {
      'Turn the leaking mics up so they cover the leakage': 'More level raises the leakage too.',
      'Add a mic between the two players': 'Another mic adds more correlated leakage.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'ac.s.disconnected',
    observation: 'The group sounds disconnected',
    firstChecks: 'Too many close spots, or spots too loud? Lower the spots, restore the main pair, rebalance the players physically.',
    options: ['Lower the spots; restore the pair', 'Add reverb to glue it together', 'Add one more spot per player'],
    correct: 'Lower the spots; restore the pair',
    explain: 'Spots that are too loud detach the players; the pair is the shared picture.',
    why: { 'Add reverb to glue it together': 'Reverb masks it; the spots are the cause.', 'Add one more spot per player': 'More spots detach it further.' },
  },
  {
    id: 'ac.s.thin',
    observation: 'The mono mix becomes thin',
    firstChecks: 'Timing and off-axis differences between mics? Change the spacing or angle, reduce mics, check the array in mono.',
    options: ['Change spacing or angle; fewer mics', 'Boost the low end on the master', 'Pan everything to the centre'],
    correct: 'Change spacing or angle; fewer mics',
    explain: 'Something cancels when summed: fix the geometry, then check in mono.',
    why: { 'Boost the low end on the master': 'A boost cannot fill a cancellation.', 'Pan everything to the centre': 'Panning does not change what cancels.' },
  },
  {
    id: 'ac.s.dominates',
    observation: 'One instrument dominates',
    firstChecks: 'Too close, too loud, or aimed at the array? Move the player, change the angle or the arrangement before EQ.',
    options: ['Move the player or change the angle', 'Cut that instrument with EQ', 'Raise the others with loud spots'],
    correct: 'Move the player or change the angle',
    explain: 'The balance is physical first: distance and angle to the pair.',
    why: { 'Cut that instrument with EQ': 'In a pair, EQ changes everyone in that range.', 'Raise the others with loud spots': 'Spots first hide a seating problem.' },
  },
  {
    id: 'ac.s.outer',
    observation: 'An outer player is weak',
    firstChecks: 'Does the group fill the pair’s pickup angle? Widen or move the array, or rearrange the players.',
    options: ['Widen or move the pair; reseat', 'Turn the pair toward the weak player', 'Add an outrigger on that side'],
    correct: 'Widen or move the pair; reseat',
    explain: 'Fill the pair’s angle with the group, or move the pair so the group fits it.',
    why: { 'Turn the pair toward the weak player': 'That pulls the whole image sideways.', 'Add an outrigger on that side': 'An extra far mic adds timing problems in a small group.' },
  },
  {
    id: 'ac.s.boomy',
    observation: 'The acoustic guitar sounds boomy',
    firstChecks: 'Aimed at the sound hole, or a room mode? Move toward the 12th fret or the bridge area and reassess the distance.',
    options: ['Move toward the 12th fret or bridge', 'Cut the lows hard on the guitar', 'Move the mic closer to the hole'],
    correct: 'Move toward the 12th fret or bridge',
    explain: 'Placement first: off the hole, toward the fret or bridge, then the distance.',
    why: { 'Cut the lows hard on the guitar': 'EQ treats the symptom; the aim causes it.', 'Move the mic closer to the hole': 'Closer to the hole is boomier still.' },
  },
  {
    id: 'ac.s.harsh',
    observation: 'The bright instrument sounds harsh',
    firstChecks: 'On-axis pickup or too much proximity? Move off-axis, change the height or distance.',
    options: ['Move off its axis; change the height', 'Add a de-esser and a high cut to that channel', 'Bring the mic in closer'],
    correct: 'Move off its axis; change the height',
    explain: 'Off the bright axis, a little higher or farther: the edge softens before any processing.',
    why: { 'Add a de-esser and a high cut to that channel': 'Processing first hides a placement problem.', 'Bring the mic in closer': 'Closer is brighter and harsher.' },
  },
  {
    id: 'ac.s.rumble',
    observation: 'Mechanical rumble or chair noise',
    firstChecks: 'The stand, the floor or the player moving? Isolate the stands, secure the cables, change the chair, a gentle low cut if needed.',
    options: ['Isolate stands; secure the cables', 'Turn the whole mix down', 'Ask the players to stop moving while they play'],
    correct: 'Isolate stands; secure the cables',
    explain: 'Decouple the stands from the floor and the cables from movement first; a conservative low cut only if still needed.',
    why: { 'Turn the whole mix down': 'The rumble stays in the same proportion.', 'Ask the players to stop moving while they play': 'Movement is part of playing; fix the mounting instead.' },
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'ac.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A guitar-and-fiddle duo records in a quiet, good-sounding room; they want a natural, together sound. Phantom power available.',
    setups: [
      { id: 'a', label: 'An X/Y pair where both are about equally far, then listen', ok: true, power: 'phantom', feedback: 'Ensemble-first: the simplest credible pair, the players balancing.' },
      { id: 'b', label: 'A 17 cm pair, plus one low guitar spot raised from silence', ok: true, power: 'phantom', feedback: 'Fair: a pair first, one spot for a clear reason.' },
      { id: 'c', label: 'Two spots 40 cm apart, each 30 cm from its player, no pair', ok: false, power: 'phantom', feedback: 'Under 3:1 and no shared picture: combing and a detached sound.' },
      { id: 'd', label: 'A mic straight into the guitar’s sound hole', ok: false, power: 'phantom', feedback: 'Boomy, and it hears none of the duo as one.' },
      { id: 'e', label: 'A spaced pair 2 m apart right in front of them', ok: false, power: 'phantom', feedback: 'Too wide and too close: a hole in the middle.' },
    ],
    reasons: [
      { id: 'r.pair', label: 'One pair first, the players equally far', role: 'required', feedback: 'Say why: the balance comes from the players.' },
      { id: 'r.safe', label: 'Stands clear of the bow, the hands and the walkways', role: 'required', feedback: 'Safe placement is part of every passing setup.' },
      POWER_REASON,
      BRAND_REASON,
    ],
    explain: 'More than one setup passes. What passes is the reasoning: one pair first with the players about equally far, a spot only for a reason, nothing in the bow’s way.',
  },
  {
    id: 'ac.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · The same duo plays a small bar through a mono PA with one wedge; the guitar has a pickup. Phantom power available.',
    setups: [
      { id: 'a', label: 'The guitar by DI, a close spot on the fiddle, the wedge in its null', ok: true, power: 'phantom', feedback: 'Stable reinforcement: the DI for the guitar, a close spot for the fiddle.' },
      { id: 'b', label: 'Two close spots at least 3:1 apart, the guitar DI blended under its mic', ok: true, power: 'phantom', feedback: 'Fair, with the DI and the mic checked in polarity and mono.' },
      { id: 'c', label: 'A wide spaced pair into the mono PA', ok: false, power: 'phantom', feedback: 'Thin in mono and short of gain before feedback.' },
      { id: 'd', label: 'Push the wedge until it rings, then back off', ok: false, power: 'phantom', feedback: 'Never chase feedback; start low.' },
      { id: 'e', label: 'A stand where the bow and the walkway cross', ok: false, power: 'phantom', feedback: 'Never place a stand where a performer or a bow can strike it.' },
    ],
    reasons: [
      { id: 'r.close', label: 'Close mics or the pickup for gain before feedback', role: 'required', feedback: 'Say why: live favours stable gain.' },
      { id: 'r.null', label: 'The wedge where each mic rejects most', role: 'required', feedback: 'Check the real polar plot.' },
      POWER_REASON,
      BRAND_REASON,
    ],
    explain: 'Two setups pass. What passes is the reasoning: close pickup or a DI for gain, the wedge in each mic’s null, nothing provoked, nothing in the players’ way.',
  },
];

const predictions: EnsembleLesson['predictions'] = {
  microphone: { prompt: 'Before you look: which pattern rejects most of the room behind it?', options: ['Cardioid', 'Omni', 'They reject the same'], after: 'Now sweep SOURCE ANGLE round the pattern and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the pair from the arc’s centre toward the guitarist. What changes most?', options: ['The guitar gets louder than the rest', 'Only the overall level', 'Every player gets louder equally'], after: 'Off the centre, the players are no longer equally far: SPREAD grows, and the nearest one leads. Compare at matched level.' },
  context: { prompt: 'The wedge sits in front of the guitarist, below the guitar spot. Can the spot’s rejection reach it?', options: ['Yes — aim the mic’s back toward it', 'No — only an omni can', 'It already sits in the null'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'A main pair and a guitar spot. If you flip B’s polarity, what happens to Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE to the other player.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'ac.q.1',
    covers: 'meet',
    prompt: 'A spot aimed into a guitar’s sound hole tends to sound…',
    options: ['Boomy', 'Thin', 'Distant'],
    correct: 'Boomy',
    explain: 'Straight at the hole a mic hears the air resonance; toward the 12th fret or bridge is more balanced.',
    why: { Thin: 'The hole is where the low end is strongest.', Distant: 'Close to the hole sounds close and heavy.' },
  },
  {
    id: 'ac.q.2',
    covers: 'meet',
    prompt: 'Which instrument most easily sends bright sound into a neighbour’s mic?',
    options: ['A mandolin or fiddle', 'An upright bass', 'A nylon-string guitar'],
    correct: 'A mandolin or fiddle',
    explain: 'High-frequency sources project bright highs along their axis; keep them off a neighbour mic’s axis.',
    why: { 'An upright bass': 'The bass sends lows round and into the floor.', 'A nylon-string guitar': 'It is warmer and quieter than a mandolin or fiddle.' },
  },
  {
    id: 'ac.q.3',
    covers: 'setups',
    prompt: 'Two spots are each 30 cm from their players. How far apart might they start?',
    options: ['At least about 90 cm', 'About 30 cm', 'It does not matter for spots'],
    correct: 'At least about 90 cm',
    explain: 'The 3:1 starting point: mic-to-mic at least 3 times each mic’s distance to its own source.',
    why: { 'About 30 cm': 'That is the distance to the source; 3:1 asks three times it between the mics.', 'It does not matter for spots': 'Closer spots hear each other’s player and comb.' },
  },
  {
    id: 'ac.q.4',
    covers: 'setups',
    prompt: 'One player dominates the pair. First move?',
    options: ['Reseat or turn that player', 'EQ them down in the mix', 'Spot the others loudly'],
    correct: 'Reseat or turn that player',
    explain: 'Physical arrangement is part of the mix; change the seating before EQ or spots.',
    why: { 'EQ them down in the mix': 'In a pair everyone shares the channels.', 'Spot the others loudly': 'Loud spots detach the group.' },
  },
  {
    id: 'ac.q.5',
    covers: 'setups',
    prompt: 'A mono PA in a small room: which pair approach?',
    options: ['Close or narrow, for safety', 'A wide spaced pair, for size', 'A wide pair of omnis'],
    correct: 'Close or narrow, for safety',
    explain: 'Do not build a wide stereo array just because two mics are available; a mono or narrowly compatible approach is safer and clearer.',
    why: { 'A wide spaced pair, for size': 'Summed to mono it can thin out and feed back sooner.', 'A wide pair of omnis': 'Omnis hear even more of the PA.' },
  },
  {
    id: 'ac.q.6',
    covers: 'setups',
    critical: true,
    prompt: 'You need to move a mic stand during the set. What do you do?',
    options: ['Stop the group first, then move it', 'Reach in between the songs quickly', 'Slide it while they keep playing'],
    correct: 'Stop the group first, then move it',
    explain: 'Never place a stand where a performer, a bow, a case or a stagehand can strike it — and stop the group before moving equipment.',
    why: { 'Reach in between the songs quickly': 'A quick reach near bows and hands is how accidents happen.', 'Slide it while they keep playing': 'A moving stand near a bow or a hand is a hazard.' },
  },
];

export const E08_LESSON: EnsembleLesson = {
  id: 'E08',
  labId: 'ensembles',
  title: 'Acoustic Duos and Small Groups',
  subtitle: 'Players about equally far from one pair; a spot only for a reason, 3:1 between spots',
  noun: { one: 'small acoustic group', many: 'small acoustic groups' },
  model: E08_MODEL,
  micTypeIds: ['arrCard', 'arrOmni', 'sdcCard'],
  zones: E08_ZONES,
  setupPairs: [{ label: 'The main pair and a guitar spot', A: { zone: 'ac.main', typeId: 'arrCard', pattern: 'cardioid' }, B: { zone: 'ac.ag', typeId: 'sdcCard', pattern: 'cardioid' }, line: 'The quieter instrument defined under the pair; check the sum in mono.' }],
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    {
      id: 'ac.prac.order',
      page: 'practice',
      prompt: 'A small-group recording, in order:',
      steps: [
        { text: 'Hear the group unamplified; seat them in their arrangement', early: 'Start by listening, with the players where they play.' },
        { text: 'Capture a pass with the simplest credible pair', early: 'The pair comes once the group is seated.' },
        { text: 'Move the pair in small steps; reseat before the EQ', early: 'Adjust the pair before adding mics.' },
        { text: 'Add one spot at a time, for a clear reason', early: 'Spots come after the pair is right.' },
        { text: 'Check polarity and mono with every mic on', early: 'Checks come with everything up.' },
      ],
      explain: 'Seat the group, capture the simplest credible pair, move it in small steps and reseat before the EQ, add one spot at a time — then check polarity and mono with every mic on.',
    },
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Acoustic duos and small groups — guitar and mandolin, voice and strings, folk trios, jazz duos, small string groups — quiet ensembles whose sound is made in the room.', src: 'LESSON-ACOUSTIC' },
    { title: 'WHAT IT ASKS OF YOU', text: 'A coherent musical picture with enough control to solve real balance problems: ensemble-first stereo, spots, DI support — in a studio or on a small stage.', src: 'LESSON-ACOUSTIC' },
    { title: 'HOW IT IS SEATED', text: 'This lab seats the players on an arc round a point in front of them — where a main pair hears each of them at about the same distance.', src: 'LESSON-ACOUSTIC' },
    { title: 'ITS SIZE', text: 'About 2–3 m across, the players 1.5 m from the arc’s centre. A typical seating, not a particular group.', src: 'LESSON-ACOUSTIC' },
  ],
  sound: {
    stages: [
      { title: 'Each instrument its own way', text: 'The guitar from its top and hole, the mandolin bright from its opening, the fiddle up from under the chin, the bass low at its bridge and into the floor.' },
      { title: 'The room joins them', text: 'In a quiet group the room’s reflections blend the players into one sound — what a main pair hears.' },
      { title: 'A close mic hears a part', text: 'Close in, a spot hears one region of one instrument — and its brighter neighbours, if they point at it.' },
    ],
    attack: 'Picks and bows reach a close spot first and clearest; a main pair hears them softened by distance and the room.',
    body: 'The sustained group sound blended in the room. A pair hears the blend; a spot, more of one player. Tendencies — groups and rooms vary.',
    head: { diameterMm: 2500, rods: 0, label: 'a small acoustic group', strikeSrc: 'LESSON-ACOUSTIC' },
  },
  setting: {
    items: [
      { id: 'seating', label: 'the seating and each player’s angle', short: 'SEATING', note: 'Move a loud instrument farther, raise a quiet one, rotate a directional source — before EQ or compression. Mark chairs, stands and mic bases so a second take returns to the same geometry.', prov: { kind: 'sourced', src: 'LESSON-ACOUSTIC', quote: 'Physical arrangement is part of the mix (L6); Mark chairs, stands, and microphone bases (L16)' }, tag: 'BALANCE', scene: 'all' },
      { id: 'bright', label: 'the bright instruments', short: 'BRIGHT', note: 'Keep a mandolin, fiddle or cymbal from dominating a guitar or vocal mic: out of its direct line, or a little farther away.', prov: { kind: 'sourced', src: 'LESSON-ACOUSTIC', quote: 'Keep high-frequency sources such as mandolin, violin, or cymbals from dominating a guitar or vocal microphone (L16)' }, tag: 'SPILL', scene: 'all' },
      { id: 'floor', label: 'the floor and the bass', short: 'FLOOR', note: 'An upright bass excites room modes and floor vibration: isolate the stands from the floor.', prov: { kind: 'sourced', src: 'LESSON-ACOUSTIC', quote: 'Low instruments and upright bass often need more attention to room modes and floor vibration (L16)' }, tag: 'NOISE', scene: 'all' },
      { id: 'stands', label: 'bows, hands, cases and walkways', short: 'KEEP CLEAR', note: 'Never place a stand where a performer, a bow, a case or a stagehand can strike it — and stop the group before moving equipment.', prov: { kind: 'sourced', src: 'LESSON-ACOUSTIC', quote: 'Never place a microphone stand where a performer, bow, instrument case, or stagehand can strike it (L38)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'pa', label: 'the PA and the wedges', short: 'PA', note: 'Close directional mics, pickups or DIs for gain; a stereo pair only where the PA is stereo, the group small and the pair close enough. Monitors in each mic’s real null.', prov: { kind: 'sourced', src: 'LESSON-ACOUSTIC', quote: 'Use a stereo pair only when the PA is stereo, the group is small enough for useful coverage (L37)' }, tag: 'FEEDBACK', scene: 'stage' },
      { id: 'pickup', label: 'pickups and DI boxes', short: 'DI', note: 'A pickup or DI often gives the stable live foundation, with a mic blended for detail — each path useful alone before they are blended.', prov: { kind: 'sourced', src: 'LESSON-ACOUSTIC', quote: 'a pickup or DI often provides the stable foundation (L39)' }, tag: 'ROLES', scene: 'stage' },
      { id: 'noise', label: 'chairs, pages and the room', short: 'NOISE', note: 'Listen for chair noise, page turns, foot movement, ventilation and the room’s reflections when you set the gain.', prov: { kind: 'sourced', src: 'LESSON-ACOUSTIC', quote: 'Monitor chair noise, page turns, foot movement, HVAC, and room reflections (L34)' }, tag: 'LISTEN', scene: 'studio' },
    ],
    stage: 'LIVE: favour stable gain before feedback — close directional mics, pickups or DIs; a stereo pair only where it is safe. Turn the monitors and the stage down before any feedback suppression; in a small room, less reinforcement may sound more natural.',
    studio: 'A RECORDING: seat the group as they play, capture the simplest credible pair, move it in small steps, change the players before the EQ, then add one spot at a time for a clear reason.',
  },
  diagnostic,
  practice: {
    task: 'With the players’ agreement, seat the group, capture it with one pair where the players are about equally far, move the pair in small steps, reseat before the EQ, add one spot at a time with a reason (3:1 between spots), and check polarity and mono. Log what you tried below.',
    fields: [
      { id: 'group', label: 'The group and its seating', kind: 'text' },
      { id: 'goal', label: 'What it is for', kind: 'choice', choices: ['recording', 'small PA', 'both'] },
      { id: 'pair', label: 'The pair: method, distance, the players’ distances', kind: 'text' },
      { id: 'spots', label: 'Spots or DIs, and the reason for each', kind: 'text' },
      { id: 'change', label: 'Which seating change helped most', kind: 'text' },
      { id: 'notes', label: 'What you heard: blend, width, room, mono (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The seating is a drawing default: the players on an arc 1.5 m round a point 0.7 m in front of the band’s front line, the guitarist in the same place in the duo and the trio, a wedge 1 m in front of the guitarist.', dims: [] },
    { text: 'The pair sits at the arc’s centre 1.3 m up (inside the published 30 cm–2 m band for a small string group; the height is a drawing default), on a boom stand from the audience side.', dims: [] },
    { text: 'The spots borrow their distances from the instrument lessons (guitar 22.5 cm, mandolin 35 cm, fiddle 30 cm, bass 22 cm).', dims: [] },
  ],
  live: { wedges: E08_WEDGES },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. A small group has no single right setup: seat the players, start with one pair where they are about equally far, and add a spot only for a clear reason, 3:1 between spots. The readouts are calculated from the drawing — straight paths, ideal patterns, no room — to compare setups, not to measure a room. Every group, room and production is different: experiment, compare at matched level, and trust your ears. Keep stands clear of bows, hands and walkways; protect your hearing; never chase feedback.',
  copy: { words: ensembleWords('group') },
  ensemble: {
    seatings: { duo: 'acoustic.duo', trio: 'acoustic.trio' },
    setups: E08_SETUPS,
    placeZones: E08_PLACE,
    worked: { duo: 'xy', trio: 'xy' },
    meet: {
      figureTitle: 'A SMALL ACOUSTIC GROUP',
      figureBadge: 'From above, as the audience sees it · a typical seating, not a particular group',
      sectionsNote: 'A seated guitar and mandolin on an arc round a point in front of them. Switch SEATING for the guitar, fiddle and bass trio. Tap a player.',
      soundNote: 'The arcs show WHERE each sound leaves — never how loud. The guitar from its top, the mandolin bright from its opening: a main pair at the arc’s centre hears them at about the same distance.',
      mainAt: PAIR_C,
    },
    before: [
      { title: 'LISTEN UNAMPLIFIED', text: 'From the listener’s position: the loudest and softest sections, unison and harmony, sustained notes, rhythmic passages and any solos.' },
      { title: 'CHOOSE THE GOAL', text: 'Ensemble-first — the group as one acoustic instrument — or individual control with spots and direct outputs. Neither is automatically more professional.' },
      { title: 'SEAT THEM', text: 'About the same distance from where the main pair will go; a loud instrument farther, a quiet one nearer; bright instruments off their neighbours’ mics.' },
      { title: 'MARK IT', text: 'Mark the chairs, stands and mic bases so a second take or the interval returns to the same geometry.' },
    ],
    safety: 'Never place a stand where a performer, a bow, a case or a stagehand can strike it; stop the group before moving equipment. Keep cables secured and walkways clear. Protect your hearing; never chase feedback.',
    workedWords: {
      begin: 'After our research, this is where we suggest you begin with a small group: one pair where the players are about equally far from it — a place to start and compare, not a rule.',
      clearance: 'The boom stand reaches in from the audience side, its base clear of the players’ feet, the bows and the walkway; its cable dressed flat.',
      height: 'About 1.3 m up — a little above the instruments, so it hears each one over the others’ hands and bows.',
      forward: 'At the point the players sit round, about 1.5 m from each: every player about equally far. Move it closer and the nearest player leads; farther, more blend and more room.',
    },
    learnZones: [
      'What you just did, in words. After our research, the blue zones are where we suggest you begin with the pair — about 1–2 m from the players, a little above the instruments, where they are about equally far. Places to start and compare, not measurements of a best place.',
      'Watch SPREAD: how far apart the players’ distances to the pair are. Near zero, they arrive about equally; moving a player is often simpler than moving the mics.',
      'Change one thing at a time and compare at matched level; keep the pair’s own geometry as you move it.',
    ],
    plot: true,
    ring: true,
  },
};
