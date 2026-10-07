/**
 * E12 PERCUSSION ENSEMBLES — the lesson as DATA (the 2026-10-07 journey).
 * Words from the owner's lesson (docs/labs/miking/source_text/Percussion-
 * Ensembles-Miking-Technique.txt; "L<n>" in comments only); research in
 * docs/labs/miking/percussion_ensemble/ and the Lab 1–2 instrument lessons;
 * corrections G5-E12-* in CORRECTIONS_LOG.md (the institutional wording →
 * "suggested starting point" / "suggested trial"; the near-coincident pair
 * named for what it is). Suggested starting points; no
 * sources on screen; FULLY SILENT.
 */
import type { DiagnosticItem, LessonPages, MikingScenario, SetupTask, Symptom } from '../../engine/model/types.ts';
import type { EnsembleLesson } from '../shared/ensemble/ensembleData.ts';
import { abHole, BRAND_REASON, ensembleWords, hearingCheck, msMono, noThreeToOne, ortfFixed, PAIR_REASON, POWER_REASON, SAFE_REASON, SPOTS_REASON, supportNeed } from '../shared/ensemble/ensembleItems.ts';
import { lab5Worksheet } from '../shared/ensemble/worksheet.ts';
import { E12_MODEL, E12_PLACE, E12_SEATS, E12_SETUPS, E12_WEDGES, E12_ZONES, TR_C } from './geometry.ts';

const pages: LessonPages = {
  meet: {
    title: 'Meet it — where the sound comes from',
    goal: 'Meet a percussion ensemble in brief — hand drums, mallet keyboards, small percussion, timpani and concert drums at their stations — and see where each instrument’s sound leaves it. Shown, never played.',
    credit: { scenarios: ['pe.meet.1', 'pe.meet.2', 'pe.meet.3'], note: 'Answer the three checks on where the sound leaves.' },
    takeaway: 'A percussion ensemble is an extended source: drums speak from their heads, mallet keyboards from their bars and tubes, metal from its edges, shakers from wherever they move. A mic that favours one cymbal or one end of a marimba misrepresents the group.',
  },
  setups: {
    title: 'Starting setups',
    goal: 'See real setups drawn on the stations — one main mic, a main pair, the pair with two supports, a pair over the marimba; for two rows, area mics. Then what to settle before any mic goes up.',
    credit: { scenarios: ['pe.set.1', 'pe.set.2', 'pe.hear'], interactive: 'setupsSeen', note: 'Look at every main setup on the drawing, and answer the three checks.' },
    takeaway: 'Rehearse the balance acoustically first; make a stage plot with every station, change and walking route. Start with one main pickup; add at most two supports, each for a named problem.',
  },
  microphone: {
    title: 'Choose the microphones',
    goal: 'Compare a single main mic, coincident, near-coincident and spaced pairs and M/S by what they do — and choose supports by their pattern and the movement they must cover.',
    credit: { scenarios: ['pe.mic.1', 'pe.ortf', 'pe.ms', 'pe.rec.1'], note: 'Answer the four checks (one reaches back to where the sound leaves).' },
    takeaway: 'Choose the main pickup for the perspective and the room; check every array in mono. Check each device’s overload on the strongest accent — mic, adapter, preamp and converter.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and move the main array yourself — closer, farther, higher — and see what changes between the front and back instruments and across the width.',
    credit: { scenarios: ['pe.place.1', 'pe.place.2', 'pe.31', 'pe.rec.2'], interactive: 'twoZones', note: 'Rest the array’s centre, clear of the players, in two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Move the complete array to change the direct-to-room ratio and the front–back balance. Raising it changes which surfaces dominate — not always a better blend. Compare at a consistent, moderate level.',
  },
  context: {
    title: 'Live sound and recording',
    goal: 'Turn the conga mic so a floor wedge sits in its rejection — and decide what really needs reinforcing.',
    credit: { scenarios: ['pe.ctx.1', 'pe.ctx.2', 'pe.ctx.studio', 'pe.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: turn the conga mic (or change its pattern) until the wedge sits in its rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Reinforce missing detail or balance, not every loud instrument. Close directional mics on a loud stage, monitors by the real polar diagrams, and stereo that still serves listeners off the centre.',
  },
  twoMic: {
    title: 'The main pair and a support',
    goal: 'The main pair and the conga mic: see how much earlier the support hears the drums, what polarity changes and what it does not, and judge the sum in mono.',
    credit: { scenarios: ['pe.two.0', 'pe.two.1', 'pe.two.2'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the three checks.' },
    takeaway: 'One strike reaching several mics at different times changes the attack and tone. Change position, angle or the support’s level first; never align every spot to one strike by reflex.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to its likely cause and the first change to try.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Placement and coverage before gain: the acoustic balance, the register a mic favours, distance and angle on metal, the supports’ overlap, the clipping stage, the open channels, and anything touching a stand.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a percussion setup in order, choose and justify a setup for two briefs, and say what earns a support.',
    credit: { scenarios: ['pe.prac.order', 'pe.prac.gain', 'pe.prac.setup1', 'pe.prac.setup2', 'pe.prac.3', 'pe.need', 'pe.hole', 'pe.mix.1'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The worksheet is optional.' },
    takeaway: 'Rehearse the balance, plot the stage and the movement, set gain on the strongest accent, establish one main pickup, add at most two supports for named problems — and keep the essential parts audible from the quietest moment to the loudest.',
  },
};

/* THE CHECKS. Lesson refs (comments only): meet L13–L14, L50 · set L15, L54–L56, L61 · mic L42–L44 · place L39–L40 · ctx L59–L61 · two L63–L64 · prac L91–L98. */
const scenarios: MikingScenario[] = [
  {
    id: 'pe.meet.1',
    page: 'meet',
    prompt: 'A mic sits close over one end of the marimba. What does it misrepresent?',
    options: ['The rest of the keyboard’s range', 'Nothing: the marimba is one source', 'Only the player’s mallet noise'],
    correct: 'The rest of the keyboard’s range',
    explain: 'A long keyboard is an extended source: a close mic favours the bars nearest it. Play low, middle and high registers at comparable dynamics and move the mics until no bars disappear.',
    why: {
      'Nothing: the marimba is one source': 'It is over two metres long: each end is a different distance from the mic.',
      'Only the player’s mallet noise': 'It hears the notes too — mostly those nearest it.',
    },
  },
  {
    id: 'pe.meet.2',
    page: 'meet',
    prompt: 'Where do a conga’s deep tones partly leave from?',
    options: ['The open lower end, near the floor', 'The tuning lugs all along the shell', 'Only the very centre of the head'],
    correct: 'The open lower end, near the floor',
    explain: 'The hands strike the heads, and the open bottom lets out a deeper part of the sound. Add lower support only if the music needs it.',
    why: {
      'The tuning lugs all along the shell': 'The lugs hold the head; the sound leaves the head and the open end.',
      'Only the very centre of the head': 'The whole head moves, and the open end radiates too.',
    },
  },
  {
    id: 'pe.meet.3',
    page: 'meet',
    prompt: 'Why can a channel count based on the number of players miss sources?',
    options: ['One player may play several stations', 'Percussionists play only one instrument', 'Quiet instruments need no channel at all'],
    correct: 'One player may play several stations',
    explain: 'Players change instruments and some stations sound at once — a roll continuing while another instrument is struck. Plan for the sources sounding together, not an average moment.',
    why: {
      'Percussionists play only one instrument': 'Many move between several stations in one piece.',
      'Quiet instruments need no channel at all': 'The quietest part may be the one that most needs help.',
    },
  },
  {
    id: 'pe.set.1',
    page: 'setups',
    prompt: 'A loud metal part covers a quiet shaker. What do you try first?',
    options: ['Move the metal away, with the players', 'Turn the shaker’s own close mic up more', 'Cut the metal’s high end with EQ'],
    correct: 'Move the metal away, with the players',
    explain: 'Rehearse the balance acoustically before placing mics: moving a loud metal source away from a quiet shaker can do more than raising a mic that hears both. Agree changes with the performers.',
    why: {
      'Turn the shaker’s own close mic up more': 'That mic hears the metal too — both come up.',
      'Cut the metal’s high end with EQ': 'EQ dulls the metal everywhere without uncovering the shaker.',
    },
  },
  {
    id: 'pe.set.2',
    page: 'setups',
    prompt: 'One player moves between three stations. Where do you start?',
    options: ['Watch the whole choreography first', 'One close mic on each instrument at once', 'Ask the player to stay at one station'],
    correct: 'Watch the whole choreography first',
    explain: 'Have the player demonstrate the reaches, turns, pedals and transitions; place area mics round the useful playing zones, then a dedicated mic only where a source stays poorly covered.',
    why: {
      'One close mic on each instrument at once': 'That adds channels before you know what is covered.',
      'Ask the player to stay at one station': 'The music decides the stations; the mics follow the player.',
    },
  },
  hearingCheck('pe', 'setups', 'close percussion strikes'),
  {
    id: 'pe.mic.1',
    page: 'microphone',
    prompt: 'Which main pair relies on level differences, with almost no time differences?',
    options: ['An X/Y pair, capsules together', 'A pair of omni mics spaced apart', 'A 17 cm, 110° pair of mics'],
    correct: 'An X/Y pair, capsules together',
    explain: 'With the capsules as nearly coincident as practical, the X/Y pair minimises arrival-time differences: its picture comes from the level differences between two angled cardioids.',
    why: {
      'A pair of omni mics spaced apart': 'Spacing adds time differences — its main cue.',
      'A 17 cm, 110° pair of mics': 'Near-coincident: it uses time and level differences.',
    },
  },
  ortfFixed('pe', 'microphone'),
  msMono('pe', 'microphone'),
  {
    id: 'pe.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Why can a close mic over a cymbal sound harsh?',
    options: ['It favours the local attack and the axis', 'Cymbals are far too quiet for close mics', 'Its pattern changes near loud metal'],
    correct: 'It favours the local attack and the axis',
    explain: 'Close in, a mic hears the local attack and its own on-axis response. Increase the distance or change the angle, keeping the part audible.',
    why: {
      'Cymbals are far too quiet for close mics': 'They are loud; the closeness is the problem.',
      'Its pattern changes near loud metal': 'The pattern is the mic’s own; the view is what changes.',
    },
  },
  {
    id: 'pe.place.1',
    page: 'placement',
    prompt: 'From the main pair the back row sounds distant. First change?',
    options: ['Move the whole array: higher or back', 'Add a close mic on each back-row drum', 'Turn the back row up with the faders'],
    correct: 'Move the whole array: higher or back',
    explain: 'Move the complete array to change the front–back balance and the direct-to-room ratio — then listen, at a consistent level. Raising it is not always a better blend: compare.',
    why: {
      'Add a close mic on each back-row drum': 'Supports first hide a placement problem with more overlap.',
      'Turn the back row up with the faders': 'There is no back-row fader on a main pair.',
    },
  },
  {
    id: 'pe.place.2',
    page: 'placement',
    prompt: 'You compare two array positions. How do you keep it fair?',
    options: ['The same passage, at matched level', 'The louder position, since it sounds best', 'Different passages, to hear more of each'],
    correct: 'The same passage, at matched level',
    explain: 'Evaluate at a consistent, moderate monitoring level so a louder comparison does not win by itself.',
    why: {
      'The louder position, since it sounds best': 'Louder tends to sound better at first — an unfair test.',
      'Different passages, to hear more of each': 'Different music changes the balance; compare like with like.',
    },
  },
  noThreeToOne('pe', 'placement'),
  {
    id: 'pe.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Quiet instruments sit at the edges of a wide image. Check what?',
    options: ['That they stay audible at the edges', 'That they are panned dead centre', 'Nothing: a wider picture helps them more'],
    correct: 'That they stay audible at the edges',
    explain: 'A wide image can make the spatial pattern clear, but width is a production decision: check that quiet instruments at the edges do not become too soft.',
    why: {
      'That they are panned dead centre': 'The array places them; check their level where they are.',
      'Nothing: a wider picture helps them more': 'Width can leave them too soft.',
    },
  },
  {
    id: 'pe.ctx.1',
    page: 'context',
    prompt: 'Live, the timpani already reach the audience well. What do you reinforce?',
    options: ['The missing detail, not the timpani', 'The timpani first, as the loudest', 'Each instrument by the same amount'],
    correct: 'The missing detail, not the timpani',
    explain: 'First find what already reaches the audience; reinforce missing detail or balance rather than automatically amplifying every loud instrument.',
    why: {
      'The timpani first, as the loudest': 'They already carry; reinforcement is for what does not.',
      'Each instrument by the same amount': 'That raises the loud ones and the spill too.',
    },
  },
  {
    id: 'pe.ctx.2',
    page: 'context',
    prompt: 'Stereo reinforcement: an essential bell part sits in one speaker only. Problem?',
    options: ['Listeners off centre may lose it', 'It is fine: stereo sounds wider to them', 'It is fine: everyone sits in the middle'],
    correct: 'Listeners off centre may lose it',
    explain: 'Stereo reinforcement must serve listeners away from the centre: avoid putting an essential instrument only in one loudspeaker feed.',
    why: {
      'It is fine: stereo sounds wider to them': 'Width does not help a listener far from that speaker.',
      'It is fine: everyone sits in the middle': 'Most of the audience sits off the centre line.',
    },
  },
  {
    id: 'pe.ctx.studio',
    page: 'context',
    prompt: 'STUDIO · A quiet recital recording. Where do you start?',
    options: ['The main array alone, then spots if needed', 'A close mic on each instrument first', 'Room mics first, the main array last of all'],
    correct: 'The main array alone, then spots if needed',
    explain: 'In a quiet studio or recital the main array may give the complete sound: add spots from silence only until the needed line becomes intelligible.',
    why: {
      'A close mic on each instrument first': 'That is a production choice for a dry, separate sound — state it first.',
      'Room mics first, the main array last of all': 'Room mics only when their decay helps the music, after the main picture.',
    },
  },
  {
    id: 'pe.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Turning up a distant mic to hear a masked part also raises what?',
    options: ['The spill that masked it', 'Only the part you want', 'Nothing else in the room'],
    correct: 'The spill that masked it',
    explain: 'A distant mic hears the whole stage: turning it up turns up the spill that caused the masking. Closer, directional pickup or a rehearsed balance helps more.',
    why: {
      'Only the part you want': 'The mic cannot choose; it hears everything at its distance.',
      'Nothing else in the room': 'It raises the whole stage with the part.',
    },
  },
  {
    id: 'pe.two.0',
    page: 'twoMic',
    prompt: 'A strike reaches the conga mic 1 m nearer than the pair. What is the gap?',
    options: ['About 2.9 ms', 'About 29 ms', 'About 0.29 ms'],
    correct: 'About 2.9 ms',
    explain: 'At 343 m/s, 1 m of path difference is about 2.9 ms (1 ÷ 343 s) — an illustrative estimate, not a delay setting.',
    why: {
      'About 29 ms': 'That would be about 10 m of path.',
      'About 0.29 ms': 'That would be about 10 cm of path.',
    },
  },
  {
    id: 'pe.two.1',
    page: 'twoMic',
    prompt: 'The pair and the support sound hollow together. First change?',
    options: ['The support’s position, angle or level', 'Invert the support and keep it so', 'Delay the support to the nearest capsule'],
    correct: 'The support’s position, angle or level',
    explain: 'Compare the main pickup alone, the support alone and both. Change position, angle or support level first; polarity changes the sign, not arbitrary arrival times.',
    why: {
      'Invert the support and keep it so': 'An inversion is a test of one relationship, not a fix for timing.',
      'Delay the support to the nearest capsule': 'Every instrument has its own path difference; one delay fits one at most.',
    },
  },
  {
    id: 'pe.two.2',
    page: 'twoMic',
    prompt: 'Should every spot be aligned to one strike?',
    options: ['Only as a trial: each has its own delay', 'Align them to the single loudest strike', 'Align them to the pair’s nearest capsule'],
    correct: 'Only as a trial: each has its own delay',
    explain: 'Each player and instrument has its own path difference, and reflections add more. A deliberate delay needs checking across several sources, registers and listening positions; keep the original tracks.',
    why: {
      'Align them to the single loudest strike': 'That suits one strike and misaligns the rest.',
      'Align them to the pair’s nearest capsule': 'Aligning to one capsule ignores the others and the room.',
    },
  },
  {
    id: 'pe.prac.gain',
    page: 'practice',
    prompt: 'How do you set gain for a percussion ensemble?',
    options: ['On the strongest passage they will play', 'On the quietest shaker part, then add', 'On one cymbal tap before they warm up'],
    correct: 'On the strongest passage they will play',
    explain: 'Ask for the individual accents and the full ensemble; check the mic, any adapter or transmitter, the preamp and the converter. A console pad cannot repair distortion made upstream.',
    why: {
      'On the quietest shaker part, then add': 'The first loud accent would then overload.',
      'On one cymbal tap before they warm up': 'One tap says nothing about the full ensemble’s peaks.',
    },
  },
  {
    id: 'pe.prac.3',
    page: 'practice',
    prompt: 'How many supports at first, and what earns each one?',
    options: ['At most two, each for a named problem', 'One for each player in the group, to be safe', 'As many as the inputs allow'],
    correct: 'At most two, each for a named problem',
    explain: 'Add no more than two support channels initially; name the musical problem each solves, and compare the main pickup alone with the whole arrangement at matched level.',
    why: {
      'One for each player in the group, to be safe': 'Supports without a reason add overlap and noise.',
      'As many as the inputs allow': 'Spare inputs are not a musical reason.',
    },
  },
  supportNeed('pe', 'practice', 'a quiet part'),
  abHole('pe', 'practice'),
  {
    id: 'pe.mix.1',
    page: 'practice',
    prompt: 'A more sensitive mic on the marimba: does it reduce spill?',
    options: ['It does not: sensitivity is output', 'It does: higher output means less spill', 'It does, once the fader is pulled down'],
    correct: 'It does not: sensitivity is output',
    explain: 'Sensitivity is electrical output per unit of sound pressure; it does not by itself decide how much spill remains once the channels are level-matched. Pattern, distance and aim do.',
    why: {
      'It does: higher output means less spill': 'The spill rises with the output too.',
      'It does, once the fader is pulled down': 'Pulling the fader lowers the part and its spill together.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'pe.s.quiet',
    observation: 'Quiet percussion disappears',
    firstChecks: 'Masking or poor coverage? Check the acoustic balance and the mic position before adding gain.',
    options: ['Balance and coverage, before gain', 'Raise its mic until it comes through', 'Compress the whole ensemble hard'],
    correct: 'Balance and coverage, before gain',
    explain: 'A quiet part lost in the group is usually balance or coverage: rehearse it, then aim or move a mic.',
    why: { 'Raise its mic until it comes through': 'That mic hears the loud parts too.', 'Compress the whole ensemble hard': 'Compression changes the dynamics the piece depends on.' },
  },
  {
    id: 'pe.s.notes',
    observation: 'A pitched instrument has uneven notes',
    firstChecks: 'Does the pickup favour one part of the bars? Test the full register and revise the coverage.',
    options: ['Test the full range; revise coverage', 'EQ out the loud notes one at a time', 'Ask the player to play the low notes louder'],
    correct: 'Test the full range; revise coverage',
    explain: 'A close mic favours the bars nearest it: play the whole register and move or add a mic until the range is even.',
    why: { 'EQ out the loud notes one at a time': 'EQ cannot follow every note across the range.', 'Ask the player to play the low notes louder': 'The player plays the music; fix the coverage.' },
  },
  {
    id: 'pe.s.harsh',
    observation: 'Metal accents are harsh',
    firstChecks: 'Local attack or the axis dominating? Increase the distance or change the angle, then reassess.',
    options: ['More distance or a new angle', 'Cut the treble on the cymbal mic hard', 'Ask for softer strikes on accents'],
    correct: 'More distance or a new angle',
    explain: 'A close mic over-emphasises the attack; a little more distance or another angle keeps the part and softens the edge.',
    why: { 'Cut the treble on the cymbal mic hard': 'That dulls the cymbal, not just its harshness.', 'Ask for softer strikes on accents': 'The accents are the music; fix the view.' },
  },
  {
    id: 'pe.s.hollow',
    observation: 'The blend becomes hollow with the spots in',
    firstChecks: 'Overlap with different arrival times? Reduce the spots, and compare positions and polarity.',
    options: ['Lower the spots; compare positions', 'Add more spots to fill the hole in', 'Boost the low mids on the main pair'],
    correct: 'Lower the spots; compare positions',
    explain: 'Spots arriving early comb with the main pickup: reduce them, then compare positions and polarity by ear.',
    why: { 'Add more spots to fill the hole in': 'More spots add more arrivals and more combing.', 'Boost the low mids on the main pair': 'EQ cannot fill comb notches.' },
  },
  {
    id: 'pe.s.clip',
    observation: 'Strong accents distort',
    firstChecks: 'Overload somewhere in the chain? Locate the clipping stage and correct it there.',
    options: ['Find the clipping stage; fix it there', 'Pull the channel fader down a little', 'Put a limiter on the main bus'],
    correct: 'Find the clipping stage; fix it there',
    explain: 'Check the mic, any adapter or transmitter, the preamp and the converter: a later control cannot repair overload upstream.',
    why: { 'Pull the channel fader down a little': 'The fader comes after the overload.', 'Put a limiter on the main bus': 'A limiter cannot repair clipping that already happened.' },
  },
  {
    id: 'pe.s.fb',
    observation: 'Feedback begins in quiet passages',
    firstChecks: 'Too much reinforcement or too many open channels? Lower the gain, then revise the mic and monitor geometry.',
    options: ['Lower gain; fix geometry and open mics', 'Push the quiet parts up even further', 'Turn the wedges toward the area mics'],
    correct: 'Lower gain; fix geometry and open mics',
    explain: 'Lower the gain at once; revise placement, monitor geometry and the open channels before EQ. Never provoke sustained feedback.',
    why: { 'Push the quiet parts up even further': 'More gain is what started the ring.', 'Turn the wedges toward the area mics': 'That points the loop straight at the mics.' },
  },
  {
    id: 'pe.s.rumble',
    observation: 'Clicks or rumbles follow movement',
    firstChecks: 'Stand, cable, frame or mechanical noise? Remove the contact, isolate the mount and secure the cable slack.',
    options: ['Remove contact; isolate; secure cables', 'High-pass the mic as far as it goes', 'Ask the players not to move about'],
    correct: 'Remove contact; isolate; secure cables',
    explain: 'Movement noise travels through stands, frames and cables: break the contact, use an isolating mount, dress the slack clear of paths and pedals.',
    why: { 'High-pass the mic as far as it goes': 'That thins the instruments and leaves the clicks.', 'Ask the players not to move about': 'The stations need movement; secure the hardware.' },
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'pe.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A recital recording of a compact trio (congas, marimba, small percussion) in a good room. Phantom power on every input.',
    setups: [
      { id: 'a', label: 'An X/Y pair about 2.5 m in front and 2.2 m up', ok: true, power: 'phantom', feedback: 'The group as one picture with the room, a dependable mono sum.' },
      { id: 'b', label: 'The pair plus one support over the congas for a named need', ok: true, power: 'phantom', feedback: 'Fair: one main pickup, one support with a reason.' },
      { id: 'c', label: 'A close mic on each instrument and no main pickup', ok: false, power: 'phantom', feedback: 'No shared perspective; many overlapping arrivals.' },
      { id: 'd', label: 'A pair 30 cm over one end of the marimba', ok: false, power: 'phantom', feedback: 'It favours a few bars and ignores the rest of the group.' },
      { id: 'e', label: 'A tall stand leaning into the players’ path', ok: false, power: 'phantom', feedback: 'Stands stay clear of paths, pedals and changes.' },
    ],
    reasons: [PAIR_REASON, SAFE_REASON, POWER_REASON, BRAND_REASON, SPOTS_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: one main pickup first, supports for a stated need, clear paths.',
  },
  {
    id: 'pe.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage with a band: the percussion ensemble is reinforced; one player moves between stations. Wedges in front.',
    setups: [
      { id: 'a', label: 'Close directional mics on the stations that need it, wedges in their rejection', ok: true, power: 'phantom', feedback: 'Gain before feedback where it is needed; the monitors where the mics hear least.' },
      { id: 'b', label: 'Two area mics round the moving player’s stations, plus the congas', ok: true, power: 'phantom', feedback: 'Fair: the movement covered with few channels, checked for overlap.' },
      { id: 'c', label: 'A distant spaced pair turned up for the PA', ok: false, power: 'phantom', feedback: 'It raises the stage spill and the PA with the percussion.' },
      { id: 'd', label: 'A fixed mic where the shaker started, nothing else', ok: false, power: 'none', feedback: 'A fixed capsule cannot follow an instrument moved out of its pickup.' },
      { id: 'e', label: 'Ring out the wedges by pushing them to feedback', ok: false, power: 'none', feedback: 'Never provoke feedback.' },
    ],
    reasons: [{ id: 'r.need', label: 'Reinforce only what does not already reach the audience', role: 'required', feedback: 'Say why: loud instruments may need nothing; the missing detail does.' }, SAFE_REASON, POWER_REASON, BRAND_REASON, { id: 'r.all', label: 'Every loud instrument needs its own close mic', role: 'wrong', feedback: 'Loud instruments may already carry; more open mics cost margin.' }],
    explain: 'Two setups pass. What passes is the reasoning: reinforce what is missing, cover the movement, wedges in the rejection, no provoked feedback.',
  },
];

const predictions: EnsembleLesson['predictions'] = {
  microphone: { prompt: 'Before you look: which pattern rejects most of what is behind the conga mic?', options: ['Cardioid', 'Omni', 'They reject the same'], after: 'Now sweep SOURCE ANGLE round the pattern and watch PICKUP.' },
  placement: { prompt: 'Predict: you raise the pair from 2 m to 2.5 m. What changes?', options: ['Which surfaces and instruments dominate', 'Only the level', 'Nothing a listener would notice'], after: 'Higher, the distances to the front and back instruments change — and so do the surfaces the pair hears. Compare at matched level; higher is not automatically better.' },
  context: { prompt: 'The wedge sits in front of the congas on the floor. Can the conga mic’s rejection reach it?', options: ['Yes — turn the mic’s back toward it', 'No — only an omni can', 'It is already in the null'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'The pair and the conga mic. If you flip B’s polarity, what happens to Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE to another instrument.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'pe.q.1',
    covers: 'meet',
    prompt: 'Why is a percussion ensemble an “extended source”?',
    options: ['Its instruments spread over the stage', 'It plays only very loud notes, all the time', 'It is heard from one single spot on stage'],
    correct: 'Its instruments spread over the stage',
    explain: 'The group spreads over width and depth: a mic near one part misrepresents the rest.',
    why: { 'It plays only very loud notes, all the time': 'It plays the quietest shakers too.', 'It is heard from one single spot on stage': 'It is heard from many spots at once.' },
  },
  {
    id: 'pe.q.2',
    covers: 'meet',
    prompt: 'Where do a marimba’s low notes leave from?',
    options: ['The bars and the long tubes', 'The metal frame and its wheels', 'The mallets themselves'],
    correct: 'The bars and the long tubes',
    explain: 'The bars vibrate and the tubes under them reinforce each note — longest at the low end.',
    why: { 'The metal frame and its wheels': 'The frame holds the bars; it is not the sound.', 'The mallets themselves': 'The mallets strike; the bars sound.' },
  },
  {
    id: 'pe.q.3',
    covers: 'meet',
    prompt: 'A shaker swings out of a fixed mic’s pickup. What helps?',
    options: ['A station mic for its whole movement', 'A brighter mic on the same spot', 'Asking the player for a smaller movement'],
    correct: 'A station mic for its whole movement',
    explain: 'Cover the actual movement envelope: a station mic and a repeatable working position.',
    why: { 'A brighter mic on the same spot': 'Tone does not follow the movement.', 'Asking the player for a smaller movement': 'The movement is part of the performance.' },
  },
  {
    id: 'pe.q.4',
    covers: 'setups',
    prompt: 'For a compact group about 3 m wide, where might a first main pair go?',
    options: ['About 2.5 m out, 2.2 m up', 'Among the players, chest high', 'On the floor at the front'],
    correct: 'About 2.5 m out, 2.2 m up',
    explain: 'Try about 2–3 m in front and 2–2.5 m up — a suggested start, then move the whole array and listen.',
    why: { 'Among the players, chest high': 'It would hear whoever is nearest — and be in their way.', 'On the floor at the front': 'Low and close, it hears the front instruments and the floor.' },
  },
  {
    id: 'pe.q.5',
    covers: 'setups',
    prompt: 'How many supports at first?',
    options: ['At most two, each named', 'One for each instrument', 'None: one main pickup is enough'],
    correct: 'At most two, each named',
    explain: 'Add no more than two at first, each for a stated musical problem.',
    why: { 'One for each instrument': 'That adds overlap before there is a reason.', 'None: one main pickup is enough': 'A named need can earn a support.' },
  },
  {
    id: 'pe.q.safe',
    covers: 'setups',
    critical: true,
    prompt: 'A player walks between stations during the piece. Where do stands and cables go?',
    options: ['Clear of the paths, pedals and changes', 'Across the path, taped down flat', 'Wherever the very best sound happens to be'],
    correct: 'Clear of the paths, pedals and changes',
    explain: 'Secure stands and cables without interfering with player paths, pedals or instrument changes; keep overhead hardware out of reach, and ears away from close strikes.',
    why: { 'Across the path, taped down flat': 'A taped cable in the walking path is still a trip hazard and a noise source.', 'Wherever the very best sound happens to be': 'No sound is worth a fall or a knocked stand.' },
  },
];

export const E12_LESSON: EnsembleLesson = {
  id: 'E12',
  labId: 'ensembles',
  title: 'Percussion Ensembles',
  subtitle: 'Stations of drums, mallets and small percussion: one main pickup first, at most two supports, the movement covered',
  noun: { one: 'percussion ensemble', many: 'percussion ensembles' },
  model: E12_MODEL,
  micTypeIds: ['arrCard', 'arrOmni', 'arrFig8', 'hdDynCard', 'hdDynHyper', 'mlSdc', 'mlDynCard'],
  zones: E12_ZONES,
  setupPairs: [
    { label: 'The main pair and the conga mic', A: { zone: 'pc.main', typeId: 'arrCard', pattern: 'cardioid' }, B: { zone: 'pc.conga', typeId: 'hdDynCard', pattern: 'cardioid' }, variants: ['trio'], line: 'The group with the drums’ strokes clearer; check the sum in mono.' },
  ],
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    {
      id: 'pe.prac.order',
      page: 'practice',
      prompt: 'A percussion setup, in order:',
      steps: [
        { text: 'Find the quiet part, the sustained gesture, the changes and the loudest accent', early: 'Start with the music and the players.' },
        { text: 'Make a stage plot; check every path and stand', early: 'Plot the stations and the movement before mics.' },
        { text: 'Set gain and monitoring conservatively; rehearse the balance', early: 'Gain once the mics are safely placed.' },
        { text: 'Establish one main pickup; check it in mono', early: 'The main pickup comes before any support.' },
        { text: 'Add at most two supports, each for a named problem', early: 'Supports come after the main picture.' },
      ],
      explain: 'Know the music, plot the stage and the movement, set conservative gain, establish one main pickup — and only then add a support for a stated reason.',
    },
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Groups of the instruments in the drum and percussion lessons — hand drums, concert drums, timpani, cymbals, small percussion and mallet keyboards — and one percussionist moving among several of them.', src: 'LESSON-PERC' },
    { title: 'WHAT IT ASKS OF YOU', text: 'Keep the rhythms, the pitched parts and the changes of texture intelligible, from the softest detail to the loudest accent — for a recording, for reinforcement, or both.', src: 'LESSON-PERC' },
    { title: 'HOW IT IS SET OUT', text: 'Players at stations, often moving between instruments; this lab draws a compact group of three stations, and a larger group in two rows.', src: 'LESSON-PERC' },
    { title: 'ITS SIZE', text: 'The three stations drawn here are about 4 m wide; the two rows about 6 m wide and 3 m deep. Typical layouts, not particular groups.', src: 'LESSON-PERC' },
  ],
  sound: {
    stages: [
      { title: 'Heads, bars and edges', text: 'Drums speak from their heads (a conga also from its open lower end), mallet keyboards from their bars and the tubes under them, cymbals from their edges.' },
      { title: 'An extended source', text: 'The instruments spread over the stage, near and far, loud and quiet: a mic hears the nearest ones most.' },
      { title: 'Movement', text: 'Shakers, maracas and a moving player change where the sound comes from during the piece — a fixed mic cannot follow an instrument swung out of its pickup.' },
    ],
    attack: 'Strikes reach a close mic first and hardest; a main array hears them softened by distance and the room. A close mic can over-emphasise the attack.',
    body: 'The rolls, rings and resonances blended in the room. A main pickup hears the group’s balance; a support, one part with its neighbours. Tendencies — groups and rooms vary.',
    head: { diameterMm: 4000, rods: 0, label: 'a percussion ensemble', strikeSrc: 'LESSON-PERC' },
  },
  setting: {
    items: [
      { id: 'paths', label: 'the players’ paths, pedals and changes', short: 'PATHS', note: 'Stands and cables clear of the walking routes, the pedals and the instrument changes; overhead hardware out of reach.', prov: { kind: 'sourced', src: 'LESSON-PERC', quote: 'Secure stands and cables without interfering with player paths, pedals or instrument changes (L61)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'moves', label: 'one player at several stations', short: 'MOVEMENT', note: 'Watch the whole choreography; area mics round the useful playing zones, a dedicated mic only where a source stays poorly covered. Avoid covering one loud cymbal equally with every area mic.', prov: { kind: 'sourced', src: 'LESSON-PERC', quote: 'Place area microphones around useful playing zones (L55); Avoid covering the same loud cymbal equally with every area microphone (L56)' }, tag: 'COVERAGE', scene: 'all' },
      { id: 'metal', label: 'loud metal near quiet parts', short: 'METAL', note: 'A loud cymbal next to a quiet shaker reaches the shaker’s mic too: move the source, with the players, before raising a mic that hears both.', prov: { kind: 'sourced', src: 'LESSON-PERC', quote: 'Moving a loud metal source away from a quiet shaker can be more effective (L15)' }, tag: 'SPILL', scene: 'all' },
      { id: 'res', label: 'resonators and vibrating bars', short: 'BARS', note: 'Never block a resonator opening or touch a vibrating bar; keep the mallets’ path above the bars clear.', prov: { kind: 'sourced', src: 'LESSON-PERC', quote: 'Never block resonator openings or touch vibrating bars (L50)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'mon', label: 'the wedges and the PA', short: 'MONITORS', note: 'Monitors by each mic’s real polar diagram, rechecked after any move; fewer unnecessary open mics.', prov: { kind: 'sourced', src: 'LESSON-PERC', quote: 'Use the actual model’s polar diagrams to position monitors (L60)' }, tag: 'FEEDBACK', scene: 'stage' },
      { id: 'scenes', label: 'mutes and scene changes', short: 'SCENES', note: 'Label channels by station; any mute or scene change keeps the tails and overlaps the piece intends.', prov: { kind: 'sourced', src: 'LESSON-PERC', quote: 'Any scene changes must preserve the tails and overlaps intended by the piece (L56)' }, tag: 'ROLES', scene: 'stage' },
      { id: 'room', label: 'the room’s decay', short: 'ROOM', note: 'Room mics only when their decay helps the music; for a dry, separately processed sound, state that goal before choosing placements.', prov: { kind: 'sourced', src: 'LESSON-PERC', quote: 'use room microphones only when their decay helps the music (L58)' }, tag: 'LATER', scene: 'studio' },
    ],
    stage: 'LIVE: find which parts already reach the audience; reinforce missing detail or balance, not every loud instrument. Stronger stage levels may need closer directional pickup; stereo reinforcement must serve listeners off the centre. Lower the gain at once if ringing starts.',
    studio: 'A RECORDING: in a quiet room the main array may give the whole sound; add spots from silence until the needed line is intelligible, and keep the ensemble’s place in the stereo picture consistent.',
  },
  diagnostic,
  practice: {
    task: 'Choose a compact group with a hand-drum station, a mallet instrument and small percussion. Make a stage plot and check the movement and stands; set gain and monitoring conservatively; establish one main pickup and check it in mono; add no more than two supports, each for a named problem; adapt for reinforcement without inducing feedback. With the players’ agreement, log what you tried below.',
    fields: lab5Worksheet({ seating: E12_SEATS.trio, noun: 'group' }),
  },
  unknowns: [
    { text: 'The stations are drawing defaults: congas, a 4.3-octave marimba and a small-percussion table on a shallow arc about 4 m wide; the larger group in two rows. The instruments’ sizes are their own lessons’ (the congas’ 30 in height, the marimba’s and vibraphone’s frames).', dims: [] },
    { text: 'The station mic over the table (60 cm out, in front and above) and the area mics’ directions are drawing defaults; the area mics’ 1.25 m follows the 1–1.5 m section-support rule.', dims: [] },
    { text: 'One player moving between stations is taught in words; the lab does not draw the walking path.', dims: [] },
  ],
  live: { wedges: E12_WEDGES },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. A percussion ensemble has no single right setup: rehearse the balance, establish one main pickup, then add a support only for a named problem. Every group, room and production is different: experiment, compare at matched level, and trust your ears. The lab is silent and draws a simplified picture: typical layouts, ideal patterns, straight paths and distances read from the drawing. Keep your ears away from close strikes.',
  copy: { words: ensembleWords('percussion ensemble') },
  ensemble: {
    seatings: { trio: 'perc.trio', large: 'perc.large' },
    setups: E12_SETUPS,
    placeZones: E12_PLACE,
    worked: { trio: 'pcXY', large: 'plXY' },
    meet: {
      figureTitle: 'A PERCUSSION ENSEMBLE',
      figureBadge: 'From above, as the audience faces it · a typical layout, not a particular group',
      sectionsNote: 'A hand-drum station, a marimba and a small-percussion table with a cymbal. Switch SEATING for two rows with vibraphone, timpani and concert drums. Tap a station.',
      soundNote: 'The arcs show WHERE each instrument’s sound leaves it — never how loud. Heads up and out, bars and tubes, metal from its edges; a main array hears the blend the room makes of them.',
      mainAt: TR_C,
    },
    before: [
      { title: 'KNOW THE PIECE', text: 'The quietest instrument, the loudest accent, the low notes, the sustained rolls, the instrument changes and the walking routes.' },
      { title: 'REHEARSE THE BALANCE', text: 'Acoustically, before any mic: quiet parts where the main pickup can hear them, sightlines and technique kept — agreed with the performers.' },
      { title: 'PLOT THE STAGE', text: 'Instruments, players, changes, wedges, mains and safe cable routes; each mic labelled by the source or area it serves, with its pattern, power, pad, height, distance, angle and routing.' },
      { title: 'PLAN THE INPUTS', text: 'Enough channels for the sources sounding together, not for an average moment of the piece.' },
    ],
    safety: 'Suitably rated stands, secured, with overhead hardware out of reach; cables clear of paths, pedals and instrument changes. Never block a resonator or touch a vibrating bar. Keep ears away from close strikes and use hearing protection when the exposure warrants it. Never provoke feedback.',
    workedWords: {
      begin: 'After our research, this is where we recommend you begin with a compact percussion group: one main pair in front and a little above — a suggested trial to start from and compare, not a rule.',
      clearance: 'The stand in front of the group, clear of the players’ paths and the audience’s way; its cable dressed flat and out of the walkways.',
    },
    learnZones: [
      'What you just did, in words. After our research, the blue zones are where we recommend you begin with the main array — about 2–3 m in front and 2–2.5 m up for a compact group. A wide or deep group may need a different approach: compare.',
      'Move the complete array to change the direct-to-room ratio and the front–back balance; raising it changes which surfaces and instruments dominate. Compare at a consistent, moderate level.',
      'Keep the array’s own geometry as you move it; a different spacing is a different method, chosen on purpose.',
    ],
  },
};
