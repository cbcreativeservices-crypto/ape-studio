/**
 * E05 CHOIRS, CHORUSES AND A CAPPELLA GROUPS — the lesson as DATA (the
 * 2026-10-07 journey, on the ensemble pages). Words from the owner's lesson
 * (docs/labs/miking/source_text/Choirs-Choruses-A-Cappella-Miking-Technique.txt;
 * "L<n>" in comments only); research in docs/labs/miking/choir/; corrections
 * E5-* in CORRECTIONS_LOG.md — the 6–9 ft lateral section re-cited to the
 * recording booklet (L11), 3:1 as mic-to-mic with the 2 ft → 6 ft example
 * (L22), the church spacing shown against 3:1 (D-CH1), hanging mics "in front
 * of the mouths, never over the heads" (L37), the school words → "you" (L4)
 * and "Practice exercise" (L97). Suggested starting points;
 * no sources on screen; FULLY SILENT.
 */
import type { DiagnosticItem, LessonPages, MikingScenario, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import type { EnsembleLesson } from '../shared/ensemble/ensembleData.ts';
import { ensembleWords, msMono, ortfFixed, PAIR_REASON, POWER_REASON } from '../shared/ensemble/ensembleItems.ts';
import { feedbackSymptom, fewerMics, FEWEST_REASON, GROUP_BRAND, hangDiag, hearingCheck, NO_PROVOKE_REASON, noProvoke, overHeads, ownMonitor, phaseySymptom, SAFE_REASON, threeToOne, threeToOneWhy } from '../shared/ensemble/voiceGroupItems.ts';
import { E05_31, E05_MODEL, E05_PLACE, E05_SETUPS, E05_WEDGES, E05_ZONES, PAIR_FAR } from './geometry.ts';

const pages: LessonPages = {
  meet: {
    title: 'Meet it — where the sound comes from',
    goal: 'Meet the choir as one instrument — its sections, its rows and risers, and where its sound leaves: every mouth at once, toward the conductor.',
    credit: { scenarios: ['ch.meet.1', 'ch.meet.2', 'ch.meet.3'], note: 'Answer the three checks on where the sound leaves.' },
    takeaway: 'A choir sings from dozens of mouths in rows: the risers lift the back rows over the heads in front, and the room joins every voice into one sound. A mic a few feet away hears that blend; the nearest row always arrives a little louder.',
  },
  setups: {
    title: 'Starting setups',
    goal: 'See real setups drawn on the choir — two area mics spaced 3:1, three at the closer spacing that misses it, an X/Y and a 17 cm pair, a pair with section spots; for a chamber choir, one mic aimed at the back row and three pairs. Then what to settle before any mic goes up.',
    credit: { scenarios: ['ch.set.1', 'ch.hang', 'ch.hear'], interactive: 'setupsSeen', note: 'Look at every main setup on the drawing, and answer the three checks.' },
    takeaway: 'Listen to the choir first and fix the balance with the director. Use the fewest mics that cover the group, a few feet out and a little above the heads, aimed at the middle or back rows, spaced 3:1. Nothing hangs over the singers.',
  },
  microphone: {
    title: 'Choose the microphones',
    goal: 'Choose area mics and a main pair by what they do — condensers that work from a few feet, a tighter pattern for a loud stage, a pair for a recording — and keep each method’s geometry.',
    credit: { scenarios: ['ch.mic.1', 'ch.ortf', 'ch.ms', 'ch.mic.2', 'ch.rec.1'], note: 'Answer the five checks (one reaches back to where the sound leaves).' },
    takeaway: 'Directional condensers on tall stands for area mics; a tighter pattern where the PA is loud; a coincident or near-coincident pair for a recording; spaced omnis only in a fine, quiet room.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and move the main pair yourself — nearer, farther, higher — and see what changes for the first and back rows and across the width.',
    credit: { scenarios: ['ch.place.1', 'ch.place.2', 'ch.31', 'ch.rec.2'], interactive: 'twoZones', note: 'Rest the pair’s centre, clear of the singers, in two different suggested starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Choose the array, then move it toward or away and listen. Nearer favours the first rows and diction; farther, the blend and the room — and the whole choir inside the pair’s angle. Move the pair as a unit.',
  },
  context: {
    title: 'Live and recording',
    goal: 'Tilt an area mic so the floor monitor sits in its rejection — and know why a live choir needs the fewest open mics and no choir mics in the choir’s own monitor.',
    credit: { scenarios: ['ch.ctx.1', 'ch.mon', 'ch.ctx.studio', 'ch.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: tilt the area mic (or change its pattern) until the monitor sits in its rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Live, a choir is a feedback problem as much as a balance one: the fewest open mics, the monitors in their nulls, the choir mics never in the choir’s monitor. A small, lively room may need little or no reinforcement — compare by muting.',
  },
  twoMic: {
    title: 'A main pair and a spot',
    goal: 'The main pair and a soprano spot: see how much earlier the spot hears its section, what polarity changes and what it does not, and why a spot can pull the image.',
    credit: { scenarios: ['ch.first', 'ch.two.1', 'ch.two.2'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the three checks.' },
    takeaway: 'A spot is closer, so it hears its section first: brought up too far it pulls the image toward it and can comb with the pair. Keep spots low, pan them where the pair places the section, and judge in mono.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to its likely cause and the first change to try.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Layout and placement first: the array’s angle and distance, the spacing between mics, the spots’ level, the monitors’ nulls, the stands and risers — before EQ. Lower the gain at the first sign of ringing.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a live choir setup in order, choose and justify a setup for a recording and for a concert with a PA, and say what earns a spot.',
    credit: { scenarios: ['ch.prac.order', 'ch.prac.gain', 'ch.prac.setup1', 'ch.prac.setup2', 'ch.prac.3', 'ch.nom', 'ch.31why', 'ch.ring'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'Hear the choir first, fix the layout with the director, use the fewest mics a few feet out and 3:1 apart, set gain on the loudest passage, mute-check and listen in mono — and bring monitors up only to the agreed level.',
  },
};

/* THE CHECKS. Lesson refs (comments only): meet L5–L6, L20–L21 · set L6–L7, L37 · mic L9–L19 · place L13–L14, L22 · ctx L34–L37 · two L15–L17 · prac L26–L33, L97–L103. */
const scenarios: MikingScenario[] = [
  {
    id: 'ch.meet.1',
    page: 'meet',
    prompt: 'Where does a choir’s sound leave the singers?',
    options: ['From every mouth, toward the conductor', 'From the chest and ribs of each singer as they breathe', 'From the risers under their feet'],
    correct: 'From every mouth, toward the conductor',
    explain: 'Each voice leaves through the singer’s mouth, forward. A choir is dozens of mouths at once, facing the conductor — a mic a few feet away hears them blended with the room.',
    why: {
      'From the chest and ribs of each singer as they breathe': 'The chest vibrates as they sing, but the voice a mic hears leaves through the mouth.',
      'From the risers under their feet': 'Risers can add thumps and creaks; the voices leave from the mouths.',
    },
  },
  {
    id: 'ch.meet.2',
    page: 'meet',
    prompt: 'Why do risers help a mic in front hear the back rows?',
    options: ['They lift the back rows above the heads', 'They make the back rows sing louder than the front', 'They turn the voices to the ceiling'],
    correct: 'They lift the back rows above the heads',
    explain: 'Each step lifts a row about 20 cm (8 in): the back rows sing over the heads in front instead of into them, so a mic a little above the first row hears them more directly.',
    why: {
      'They make the back rows sing louder than the front': 'Height does not change how loud they sing; it clears the path to the mic.',
      'They turn the voices to the ceiling': 'The singers still face the conductor; the risers only lift them.',
    },
  },
  {
    id: 'ch.meet.3',
    page: 'meet',
    prompt: 'A mic a metre in front of the first row. Why is the back row quieter in it?',
    options: ['It is farther away, behind other singers', 'The back row sings more quietly than the others', 'The back row faces the ceiling'],
    correct: 'It is farther away, behind other singers',
    explain: 'The back row is farther from the mic and sings past the heads in front. Raising the mic, aiming at the back rows, or moving back evens the distances out.',
    why: {
      'The back row sings more quietly than the others': 'They may sing as loud as anyone; distance makes the difference at the mic.',
      'The back row faces the ceiling': 'Every row faces the conductor; the risers lift them, not turn them.',
    },
  },
  {
    id: 'ch.set.1',
    page: 'setups',
    prompt: 'The altos are lost behind the sopranos. What do you try first?',
    options: ['Ask the director about the layout', 'Add a close spot and raise it high', 'Boost the altos’ range on the bus'],
    correct: 'Ask the director about the layout',
    explain: 'Ask the director to correct section balance and layout first — who stands where, the riser height, the spacing — before repairing it with faders.',
    why: {
      'Add a close spot and raise it high': 'A loud close spot turns the altos into soloists; fix the balance at its source.',
      'Boost the altos’ range on the bus': 'EQ lifts the other sections in that range too.',
    },
  },
  overHeads('ch', 'setups', 'the choir'),
  hearingCheck('ch', 'setups', 'a full choir and organ'),
  {
    id: 'ch.mic.1',
    page: 'microphone',
    prompt: 'Why are area mics usually condensers on tall stands?',
    options: ['They hear well from a few feet away', 'They need no power on a stage', 'They reject the whole of the room behind them'],
    correct: 'They hear well from a few feet away',
    explain: 'A directional condenser has the sensitivity and detail to cover a section from a few feet away; the tall stand puts it a little above the heads. It needs phantom power.',
    why: {
      'They need no power on a stage': 'Condensers need phantom power; dynamics are the ones that do not.',
      'They reject the whole of the room behind them': 'A directional pattern rejects some of the room behind — never all of it.',
    },
  },
  ortfFixed('ch', 'microphone'),
  msMono('ch', 'microphone'),
  {
    id: 'ch.mic.2',
    page: 'microphone',
    prompt: 'On a loud stage with a PA, why try a supercardioid area mic?',
    options: ['Its tighter pattern rejects more of the PA', 'It hears more of the room around it', 'It reaches farther into the back rows of the choir'],
    correct: 'Its tighter pattern rejects more of the PA',
    explain: 'A supercardioid or hypercardioid trades some room for more rejection: more margin before feedback. Its null sits off its rear — place the monitor there, from the real polar plot.',
    why: {
      'It hears more of the room around it': 'A tighter pattern hears LESS of the room; that is the trade.',
      'It reaches farther into the back rows of the choir': 'A pattern does not reach farther; distance and height decide the rows.',
    },
  },
  {
    id: 'ch.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · What do the risers change for a mic in front?',
    options: ['The back rows sing over the front heads', 'The front row moves farther from the mic', 'The voices point up into the ceiling'],
    correct: 'The back rows sing over the front heads',
    explain: 'The steps lift each row: the back rows’ voices pass over the heads in front toward a mic a little above the first row.',
    why: {
      'The front row moves farther from the mic': 'The front row stays on the floor; the risers lift the rows behind it.',
      'The voices point up into the ceiling': 'The singers face the conductor; only their height changes.',
    },
  },
  {
    id: 'ch.place.1',
    page: 'placement',
    prompt: 'The pair is close and the first row dominates. First change?',
    options: ['Raise it or move it farther back', 'Add a spot for each of the back rows instead', 'Turn the whole choir down'],
    correct: 'Raise it or move it farther back',
    explain: 'Close in, the first row is much nearer than the back rows. Raise the pair or move it back to even the distances — one change at a time, compared at matched level.',
    why: {
      'Add a spot for each of the back rows instead': 'Spots first hide a placement problem behind overlap.',
      'Turn the whole choir down': 'Level changes everyone equally; the distances still differ.',
    },
  },
  {
    id: 'ch.place.2',
    page: 'placement',
    prompt: 'The outer sections sound weak in the 17 cm pair. A likely reason?',
    options: ['They sit outside its 95° angle', 'The pair is too high above them', 'The pair has no phantom power'],
    correct: 'They sit outside its 95° angle',
    explain: 'The 17 cm pair images what lies inside its 95° recording angle. Close in, the outer sections fall outside it: move the pair back until the choir fills the angle, or bring the group in.',
    why: {
      'The pair is too high above them': 'Height changes the rows’ balance; the width the pair takes in is set by its distance.',
      'The pair has no phantom power': 'Then nothing would be heard — the outer sections would not stand out.',
    },
  },
  threeToOne('ch', 'placement', 'about 60 cm (2 ft)', '1.8 m (6 ft)'),
  {
    id: 'ch.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Where is a choir’s area mic aimed?',
    options: ['At the middle or back rows', 'At the tops of the front heads', 'At the floor in front of them'],
    correct: 'At the middle or back rows',
    explain: 'Aim at the vocal area — the middle rows, or the back row for a deep choir — not at the tops of heads. Aiming back evens the distances to the rows.',
    why: {
      'At the tops of the front heads': 'Heads do not sing: aim at the mouths of the rows you want to even out.',
      'At the floor in front of them': 'The floor reflects; the voices leave from the mouths, higher up.',
    },
  },
  {
    id: 'ch.ctx.1',
    page: 'context',
    prompt: 'A choir sings with a band and a PA. A good first step for the choir mics?',
    options: ['The fewest mics that cover the choir', 'A close mic on each of the singers', 'A spaced omni pair into the PA'],
    correct: 'The fewest mics that cover the choir',
    explain: 'Live, a choir is a feedback problem: every doubling of open mics costs about 3 dB of margin. The fewest directional mics that cover the group, a few feet out, aimed at the singers.',
    why: {
      'A close mic on each of the singers': 'Dozens of open mics eat the margin before feedback and add overlap.',
      'A spaced omni pair into the PA': 'Omnis hear the PA and the room as much as the choir — rarely a live choice.',
    },
  },
  ownMonitor('ch', 'context', 'choir'),
  {
    id: 'ch.ctx.studio',
    page: 'context',
    prompt: 'STUDIO · A choir in a good church, no PA. Where do you start?',
    options: ['One main pair alone, then listen', 'A close mic on each singer first', 'Section spots first, the pair last'],
    correct: 'One main pair alone, then listen',
    explain: 'Capture a rehearsal with the simplest credible stereo setup; move it in small steps while listening on loudspeakers. Add spots only if the pair cannot carry a section.',
    why: {
      'A close mic on each singer first': 'Close mics expose breath and timing differences and lose the blend.',
      'Section spots first, the pair last': 'The pair is the reference; spots only support it.',
    },
  },
  {
    id: 'ch.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Why aim an area mic at the back row of a deep choir?',
    options: ['It evens the distances to the rows', 'The back row is louder than the front', 'It keeps the mic off the floor'],
    correct: 'It evens the distances to the rows',
    explain: 'Aimed back, the front row sits off the mic’s axis while the back row is on it: the farther row gets the mic’s front, the nearer row a little less.',
    why: {
      'The back row is louder than the front': 'Usually the reverse at the mic: the back row is farther away.',
      'It keeps the mic off the floor': 'The stand keeps it off the floor; the aim is about the rows.',
    },
  },
  {
    id: 'ch.first',
    page: 'twoMic',
    prompt: 'The soprano spot is about 1 m closer to them than the pair. What happens?',
    options: ['It hears them about 3 ms earlier', 'Both mics hear them at the same time', 'The pair hears them before the spot'],
    correct: 'It hears them about 3 ms earlier',
    explain: 'Sound travels about 1 m in 2.9 ms. The spot hears the sopranos first; summed with the pair, that earlier copy can comb and can pull the image toward the spot.',
    why: {
      'Both mics hear them at the same time': 'They are at different distances, so the arrivals differ.',
      'The pair hears them before the spot': 'The spot is closer, so it hears them first.',
    },
  },
  {
    id: 'ch.two.1',
    page: 'twoMic',
    prompt: 'The image moves toward the sopranos as their spot comes up. Why?',
    options: ['The spot is earlier and closer', 'The spot’s polarity is reversed', 'The pair has stopped hearing them'],
    correct: 'The spot is earlier and closer',
    explain: 'A closer spot arrives first and can dominate where we hear the section, even at a low level. Keep spots low, pan them where the pair places the section, and compare with the pair alone.',
    why: {
      'The spot’s polarity is reversed': 'Polarity changes the tone of the sum, not where the section seems to be.',
      'The pair has stopped hearing them': 'The pair still hears them — later than the spot.',
    },
  },
  {
    id: 'ch.two.2',
    page: 'twoMic',
    prompt: 'The pair plus spots sound hollow in mono. First change?',
    options: ['Lower or move the spots, then compare', 'Flip the polarity until it sounds full', 'Add a delay set from the distance'],
    correct: 'Lower or move the spots, then compare',
    explain: 'Mute-check each mic, then the sum. Physical placement and balance come first; polarity only tests one relationship, and a delay is a trial judged by ear.',
    why: {
      'Flip the polarity until it sounds full': 'A flip changes the sign, not the time difference behind the hollowness.',
      'Add a delay set from the distance': 'Distance alone sets no universal delay; level and placement come first.',
    },
  },
  {
    id: 'ch.prac.gain',
    page: 'practice',
    prompt: 'How do you set gain for a choir recording?',
    options: ['On the loudest full-choir passage', 'On the quietest solo in the piece', 'On the conductor’s spoken count-in'],
    correct: 'On the loudest full-choir passage',
    explain: 'Set gain on the loudest full-ensemble passage with conservative headroom — and do not let a count-in, applause or a sudden solo peak clip the preamp.',
    why: {
      'On the quietest solo in the piece': 'The first full chord would then overload.',
      'On the conductor’s spoken count-in': 'A spoken count says nothing about the choir’s peaks.',
    },
  },
  {
    id: 'ch.prac.3',
    page: 'practice',
    prompt: 'What earns a section spot under the main pair?',
    options: ['A section the pair cannot carry', 'One for each section, as a rule', 'Spare inputs on the desk'],
    correct: 'A section the pair cannot carry',
    explain: 'A strong pair carries the choir. Add a spot only where the room, the arrangement or the accompaniment leaves a section unclear — raise it until clear, then lower it until the choir is one group again.',
    why: {
      'One for each section, as a rule': 'Spots everywhere turn the choir into separate soloists and add overlap.',
      'Spare inputs on the desk': 'A spare input is not a musical reason.',
    },
  },
  fewerMics('ch', 'practice'),
  threeToOneWhy('ch', 'practice'),
  noProvoke('ch', 'practice'),
];

const symptoms: Symptom[] = [
  {
    id: 'ch.s.outer',
    observation: 'The outer sections are weak',
    firstChecks: 'Does the choir fill the array’s angle? Move the pair back, widen it, or bring the group in — before adding level.',
    options: ['Move the pair back or bring the group in', 'Raise the outer sections with EQ on the bus', 'Add a spot on each outer singer'],
    correct: 'Move the pair back or bring the group in',
    explain: 'Close in, the outer sections sit outside the pair’s angle. Move back, widen the pair, or rearrange the group so it fills the angle.',
    why: { 'Raise the outer sections with EQ on the bus': 'EQ cannot separate one section from another in a pair.', 'Add a spot on each outer singer': 'Spots first add overlap; fix the coverage.' },
  },
  {
    id: 'ch.s.solo',
    observation: 'The choir sounds like separate soloists',
    firstChecks: 'Are the spots too close or too loud? Lower them, move them back, and restore the pair as the reference.',
    options: ['Lower the spots; the pair as reference', 'Move the spots closer to the mouths', 'Add reverb to all of the channels'],
    correct: 'Lower the spots; the pair as reference',
    explain: 'Close, loud spots pull singers forward of the group. Lower them and listen to the pair alone, then bring spots up only until a section is clear.',
    why: { 'Move the spots closer to the mouths': 'Closer makes each singer more separate.', 'Add reverb to all of the channels': 'Reverb hides the symptom; the spots’ level is the cause.' },
  },
  phaseySymptom('ch.s.hollow', 'A hollow or swishing tone'),
  feedbackSymptom('ch.s.ring'),
  {
    id: 'ch.s.words',
    observation: 'The consonants are unclear',
    firstChecks: 'Too far, off axis, or a masking room? Improve the layout and aim, move the pair a little closer, or add a restrained spot.',
    options: ['Better aim; the pair a little closer', 'Boost the treble on the whole mix', 'Ask the choir to shout the words'],
    correct: 'Better aim; the pair a little closer',
    explain: 'Distance and the room blur consonants. Aim at the mouths, bring the pair modestly closer, or support a weak section — before EQ.',
    why: { 'Boost the treble on the whole mix': 'Treble raises the room and the noise along with the words.', 'Ask the choir to shout the words': 'The performance is theirs; fix the capture.' },
  },
  {
    id: 'ch.s.rumble',
    observation: 'Low rumble or thumps',
    firstChecks: 'Stands, risers, air handling, feet or handling? Secure the stands and cables, isolate the vibration, a gentle low cut if needed.',
    options: ['Secure stands; isolate; gentle low cut', 'Boost the lows to cover the thumps', 'Move the mics up onto the risers'],
    correct: 'Secure stands; isolate; gentle low cut',
    explain: 'Riser and foot noise travel up stands. Secure and isolate first; a conservative low cut only if it spares the basses’ fundamentals.',
    why: { 'Boost the lows to cover the thumps': 'That makes the thumps louder.', 'Move the mics up onto the risers': 'On the risers the mics hear every footstep.' },
  },
  {
    id: 'ch.s.image',
    observation: 'The image moves when a spot comes up',
    firstChecks: 'Is the spot’s earlier arrival taking over? Keep spots low, pan them conservatively, compare with the pair.',
    options: ['Keep spots low; pan them conservatively', 'Pan the spot hard over to the opposite side', 'Flip the spot’s polarity'],
    correct: 'Keep spots low; pan them conservatively',
    explain: 'An earlier, closer arrival tends to dominate where we hear a section. Low spots, panned where the pair places the section, keep the picture still.',
    why: { 'Pan the spot hard over to the opposite side': 'That moves the section across the picture.', 'Flip the spot’s polarity': 'Polarity does not change the arrival time.' },
  },
];

const SPOTS_EVERY: SetupReason = { id: 'r.spots', label: 'A close mic on every singer gives the most control', role: 'wrong', feedback: 'Close mics everywhere lose the blend and pile up open mics; spots only for a named need.' };
const R31: SetupReason = { id: 'r.31', label: 'The area mics at least three times their distance apart', role: 'required', feedback: 'Say how far apart the mics are: 3:1 keeps the comb shallow.' };
const RMON: SetupReason = { id: 'r.mon', label: 'The choir mics kept out of the choir’s own monitor', role: 'required', feedback: 'Choir mics in the choir monitor are a sure path to feedback.' };

const setupTasks: SetupTask[] = [
  {
    id: 'ch.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A recording of a 38-voice choir on risers in a good, quiet church; no PA. Phantom power on every input.',
    setups: [
      { id: 'a', label: 'A 17 cm pair, centred, the choir filling its angle', ok: true, power: 'phantom', feedback: 'The choir and the room as one picture; check the edges and mono.' },
      { id: 'b', label: 'An X/Y pair a few feet out, plus a spot for a weak section', ok: true, power: 'phantom', feedback: 'Fair: a main pair, one spot for a stated need.' },
      { id: 'c', label: 'A close mic on every singer', ok: false, power: 'phantom', feedback: 'Dozens of channels, breath and timing exposed, no shared blend.' },
      { id: 'd', label: 'A spaced pair 2 m apart right at the first row', ok: false, power: 'phantom', feedback: 'Too close and too wide: the first row on top, a hole in the middle.' },
      { id: 'e', label: 'One mic hung straight over the middle rows', ok: false, power: 'phantom', feedback: 'Never over the heads: in front of the mouths, and only on the venue’s rigging.' },
    ],
    reasons: [PAIR_REASON, SAFE_REASON, POWER_REASON, GROUP_BRAND, SPOTS_EVERY],
    explain: 'More than one setup passes. What passes is the reasoning: a main pair first, safely placed, spots only for a stated need.',
  },
  {
    id: 'ch.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · The same choir in concert with a band and a PA; a floor monitor in front carries the piano. Phantom power is available.',
    setups: [
      { id: 'a', label: 'Two area mics 2.7 m apart, 0.6 m out, aimed at the middle rows', ok: true, power: 'phantom', feedback: 'The fewest mics that cover the width, spaced 3:1; check the monitor against the patterns.' },
      { id: 'b', label: 'Two supercardioid area mics, the monitor in their rejection', ok: true, power: 'phantom', feedback: 'Fair: tighter patterns for a loud stage, the monitor where they reject most.' },
      { id: 'c', label: 'Six area mics 1 m apart for even coverage', ok: false, power: 'phantom', feedback: 'Far under 3:1, and six open mics eat the margin before feedback.' },
      { id: 'd', label: 'The choir mics sent to the choir’s monitor', ok: false, power: 'phantom', feedback: 'A sure way to feedback: the monitor plays into the mics feeding it.' },
      { id: 'e', label: 'Raise the PA until it rings, then back off a little', ok: false, power: 'phantom', feedback: 'Never provoke feedback; bring it up only to the agreed level.' },
    ],
    reasons: [FEWEST_REASON, SAFE_REASON, R31, RMON, NO_PROVOKE_REASON, GROUP_BRAND],
    explain: 'Two setups pass. What passes is the reasoning: the fewest mics, spaced 3:1, the monitor in their nulls and out of the choir mics, and no provoked feedback.',
  },
];

const predictions: EnsembleLesson['predictions'] = {
  microphone: { prompt: 'Before you look: which pattern rejects most of the PA behind it?', options: ['Cardioid', 'Omni', 'They reject the same'], after: 'Now sweep SOURCE ANGLE round the pattern and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the pair from 1 m to 2 m in front. What changes most?', options: ['More blend and more room', 'Only the level', 'The first row dominates more'], after: 'Farther back, the distances to the first and back rows even out: the NEAR / FAR readout shrinks, and more sections fall inside the pair’s angle.' },
  context: { prompt: 'The floor monitor sits in front of the choir, below the area mic. Can the mic’s rejection reach it?', options: ['Yes — tilt the mic or tighten its pattern', 'No — only an omni can', 'It is already in the null'], after: 'Now tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'A main pair and a soprano spot. If you flip B’s polarity, what happens to Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE to another section.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'ch.q.1',
    covers: 'meet',
    prompt: 'Where does a choir’s sound leave the singers?',
    options: ['From every mouth, forward', 'From the risers under them', 'From the chest of each singer'],
    correct: 'From every mouth, forward',
    explain: 'Each voice leaves through the mouth, toward the conductor; the room blends them.',
    why: { 'From the risers under them': 'Risers add thumps, not voices.', 'From the chest of each singer': 'The chest vibrates; the voice leaves from the mouth.' },
  },
  {
    id: 'ch.q.2',
    covers: 'meet',
    prompt: 'What do the risers do for a mic in front?',
    options: ['Lift the back rows above the front heads', 'Make the back rows sing louder than the front', 'Turn the voices toward the ceiling'],
    correct: 'Lift the back rows above the front heads',
    explain: 'Each step lifts a row, so its voices pass over the heads in front.',
    why: { 'Make the back rows sing louder than the front': 'Height clears the path; it does not add level.', 'Turn the voices toward the ceiling': 'The singers still face the conductor.' },
  },
  {
    id: 'ch.q.3',
    covers: 'meet',
    prompt: 'Why is the first row a little louder in a mic in front?',
    options: ['It is the closest to the mic', 'It sings louder than the rest', 'It stands on the highest step'],
    correct: 'It is the closest to the mic',
    explain: 'Distance alone makes the nearest row louder at the mic; height and aim even it out.',
    why: { 'It sings louder than the rest': 'Distance, not effort, makes the difference.', 'It stands on the highest step': 'The first row stands on the floor; the back rows are higher.' },
  },
  {
    id: 'ch.q.4',
    covers: 'setups',
    prompt: 'Where might a first area mic go for a choir on risers?',
    options: ['A few feet out, a little above the heads', 'Among the front row, at the singers’ chest height', 'At the back wall, behind the choir'],
    correct: 'A few feet out, a little above the heads',
    explain: 'Try about 0.6–1.2 m (2–4 ft) in front and 0.3–0.9 m (1–3 ft) above the first row’s heads, aimed at the middle rows.',
    why: { 'Among the front row, at the singers’ chest height': 'Among the singers it hears whoever is nearest — and is in their way.', 'At the back wall, behind the choir': 'Behind the choir it hears their backs and the room.' },
  },
  {
    id: 'ch.q.5',
    covers: 'setups',
    prompt: 'Two area mics, each 60 cm from the nearest singers. How far apart to start?',
    options: ['At least 1.8 m apart', 'About 60 cm apart', 'As close as their stands allow'],
    correct: 'At least 1.8 m apart',
    explain: 'The 3:1 guideline: the mics at least three times their distance to the singers apart from each other — here 1.8 m (6 ft).',
    why: { 'About 60 cm apart': 'That is 1:1: both mics hear the same voices almost equally, and comb.', 'As close as their stands allow': 'Close mics hear the same voices twice; spread them 3:1.' },
  },
  hangDiag('ch', 'the choir'),
];

export const E05_LESSON: EnsembleLesson = {
  id: 'E05',
  labId: 'ensembles',
  title: 'Choirs, Choruses and A Cappella',
  subtitle: 'A few feet out and a little above, aimed at the rows: the fewest area mics, 3:1 apart — or one main pair',
  noun: { one: 'choir', many: 'choirs' },
  model: E05_MODEL,
  micTypeIds: ['arrCard', 'arrOmni', 'arrFig8'],
  zones: E05_ZONES,
  setupPairs: [{ label: 'The main pair and a soprano spot', A: { zone: 'ch.pair', typeId: 'arrCard', pattern: 'cardioid' }, B: { zone: 'ch.spot', typeId: 'arrCard', pattern: 'cardioid' }, variants: ['risers'], line: 'A weak section supported under the pair; keep the spot low and check the sum in mono.' }],
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    {
      id: 'ch.prac.order',
      page: 'practice',
      prompt: 'Live choir mics, in order:',
      steps: [
        { text: 'Listen to the choir unamplified; agree the layout with the director', early: 'Start with the choir and its balance.' },
        { text: 'Check stands, cables and the singers’ way on and off the risers', early: 'Safety and movement come before sound.' },
        { text: 'Place the fewest area mics: a few feet out, above the heads, 3:1 apart', early: 'Place the mics once the layout and the paths are set.' },
        { text: 'Set gain on the loudest full-choir passage', early: 'Gain comes once the mics are up and powered.' },
        { text: 'Mute-check each mic, then listen to the sum in mono', early: 'Check the mics once their gain is set.' },
        { text: 'Bring the monitors up only to the agreed level', early: 'Monitors come last, and only as loud as needed.' },
      ],
      explain: 'Listen and agree the layout first, make the stage safe, place the fewest mics 3:1 apart, set gain on the loudest passage, mute-check in mono — and bring monitors up only to the agreed level.',
    },
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A choir, chorus or a cappella group: many voices singing together, in sections — sopranos, altos, tenors and basses — with or without instruments.', src: 'LESSON-CHOIR' },
    { title: 'WHAT IT ASKS OF YOU', text: 'To capture or reinforce one balanced ensemble, not a pile of separate soloists — with the fewest mics that cover it.', src: 'LESSON-CHOIR' },
    { title: 'HOW IT IS LAID OUT', text: 'In rows facing the conductor: a floor row, then risers that lift each row about 20 cm (8 in) on steps about 46 cm (18 in) deep. This lab draws sopranos and altos in front, tenors and basses behind.', src: 'WENGER-SIG' },
    { title: 'ITS SIZE', text: 'This choir is 38 singers, about 5.5 m wide; the chamber choir, twelve singers on a shallow arc. Typical layouts, not particular choirs.', src: 'LESSON-CHOIR' },
  ],
  sound: {
    stages: [
      { title: 'Every mouth at once', text: 'Each singer’s voice leaves through the mouth, forward and round the head — dozens of them, all facing the conductor.' },
      { title: 'Rows and risers', text: 'The risers lift each row so its voices pass over the heads in front: a mic a little above the first row hears the back rows more directly.' },
      { title: 'The room joins them', text: 'Reflections blend every voice into one sound — the blend a main pair or area mic hears from a few feet away.' },
    ],
    attack: 'Consonants reach a close mic first and sharpest; a mic a few feet away hears them softened by distance and the room — clear diction comes from aim and distance as much as from the choir.',
    body: 'The sustained vowels of the whole choir, blended in the room. A main pair hears more of the blend; a spot, more of one section. Tendencies — choirs and rooms vary.',
    head: { diameterMm: 5500, rods: 0, label: 'a choir', strikeSrc: 'LESSON-CHOIR' },
  },
  setting: {
    items: [
      { id: 'singers', label: 'the singers, their feet and the riser edges', short: 'SINGERS', note: 'Stands and cables clear of the risers’ edges, the singers’ feet and their way on and off; stop the choir before moving any mic.', prov: { kind: 'sourced', src: 'LESSON-CHOIR', quote: 'Stop the ensemble before moving any microphone (L37)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'director', label: 'the conductor and the sightlines', short: 'CONDUCTOR', note: 'Every singer must see the conductor: no stand or mic in that line, none where the conductor or a stagehand can strike it.', prov: { kind: 'sourced', src: 'LESSON-CHOIR', quote: 'Keep the conductor visible and do not place a stand where a singer, conductor, instrument, or stagehand can strike it (L21)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'balance', label: 'the sections’ balance', short: 'BALANCE', note: 'Fix a weak or hidden section with the director — layout, riser height, spacing — before any spot gain.', prov: { kind: 'sourced', src: 'LESSON-CHOIR', quote: 'Ask the director to correct section balance and physical layout before trying to repair everything with faders (L6)' }, tag: 'BALANCE', scene: 'all' },
      { id: 'noise', label: 'risers, feet, page turns and air handling', short: 'NOISE', note: 'Risers creak and thump up stands; air handling, page turns and feet add noise a distant mic hears.', prov: { kind: 'sourced', src: 'LESSON-CHOIR', quote: 'Monitor room noise, HVAC, foot movement, riser vibration, page turns (L32)' }, tag: 'SPILL', scene: 'all' },
      { id: 'rig', label: 'anything hung above the stage', short: 'RIGGING', note: 'A hanging choir mic goes in front of the mouths, aimed at the back row — never over the heads — and only on the venue’s approved rigging.', prov: { kind: 'sourced', src: 'S-CHURCH', quote: 'not to hang the mics over the heads of the singers, rather than 2’-3’ in front of their mouths, aimed at the back row' }, tag: 'VENUE ONLY', scene: 'all' },
      { id: 'monitor', label: 'the choir’s monitor', short: 'MONITOR', note: 'Low, in the mics’ rejection from their real polar plots, carrying the piano or the band — never the choir’s own mics.', prov: { kind: 'sourced', src: 'S-CHOIR', quote: 'never mix choir mic channels into the choir monitors; it’s a sure way to cause feedback' }, tag: 'FEEDBACK', scene: 'stage' },
      { id: 'pa', label: 'the PA and the band', short: 'PA · BAND', note: 'Live, the choir mics hear the band and the PA too: the fewest open mics, tighter patterns, and a mute check of the natural level.', prov: { kind: 'sourced', src: 'S-CHOIR', quote: 'tighter patterns such as supercardioid or hypercardioid; use the minimum number of microphones' }, tag: 'SPILL', scene: 'stage' },
      { id: 'room', label: 'the room’s own sound', short: 'ROOM', note: 'Judge the pair’s distance on loudspeakers: headphones can misjudge the room’s width and tone.', prov: { kind: 'sourced', src: 'LESSON-CHOIR', quote: 'Headphones can misrepresent room width and tonal balance (L14)' }, tag: 'PART OF THE SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: a gain-before-feedback problem as much as a balance one. The fewest open choir mics, a few feet out and a little above, aimed at the singers; monitors low and in the mics’ rejection; never the choir mics in the choir monitor — and never provoke feedback.',
    studio: 'A RECORDING: the simplest credible stereo setup first, moved in small steps and judged on loudspeakers; spots only where the pair cannot carry a section; check mono.',
  },
  diagnostic,
  practice: {
    task: 'Arrange a small chorus in two rows and capture it with one pair; move the pair toward and away. Add two area mics 3:1 apart, mute-check each and listen in mono. With the choir’s and the venue’s agreement, log what you tried below.',
    fields: [
      { id: 'choir', label: 'The choir: size, rows, risers', kind: 'text' },
      { id: 'goal', label: 'What it is for', kind: 'choice', choices: ['recording', 'reinforcement', 'both'] },
      { id: 'pair', label: 'Main pair: method, distance, height', kind: 'text' },
      { id: 'area', label: 'Area mics: how many, how far apart, the 3:1 check', kind: 'text' },
      { id: 'notes', label: 'What you heard: rows, sections, diction, mono (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The choir on risers is a drawing default: 38 adults at a 56 cm pitch in rows of 10, 9, 10 and 9; the floor row, then three steps — their 8 in rise and 18 in tread, the 42 in back rail and the 6 ft units are the maker’s; sopranos and altos in front, tenors and basses behind; a conductor 3 m in front.', dims: [] },
    { text: 'The chamber choir: twelve singers in two rows on a shallow arc (a drawing default).', dims: [] },
    { text: `The two area mics are drawn 9 ft (2.74 m) apart, 0.65 m in front and 0.33 m above the front heads (inside the 2–4 ft and 1–3 ft rows); their nearest singers are about ${(E05_31.two.rA / 1000).toFixed(2)} m away, so 3:1 holds (≈ ${E05_31.two.ratio.toFixed(1)}:1). Three mics 6 ft apart give ≈ ${E05_31.three.ratio.toFixed(1)}:1.`, dims: [] },
    { text: '"A few feet" for the main pair is drawn 0.6–2.2 m out and 0.3–1.3 m above the heads; the spots 1–2 m from their sections. Drawing defaults.', dims: [] },
  ],
  live: { wedges: E05_WEDGES },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. A choir has no single right setup: listen to it first, fix the balance with the director, then use the fewest mics that cover it — a few feet out and a little above, aimed at the singers, spaced 3:1, or one main pair. Every choir, room and production is different: experiment, compare at matched level, and trust your ears. The lab is silent and draws a simplified picture: typical layouts, ideal patterns, straight paths and distances read from the drawing. Nothing hangs over the singers; protect your hearing.',
  copy: { words: { ...ensembleWords('choir'), player: 'singers', inside: 'among the singers', outside: 'clear of the singers', axis: 'the line toward the singers', facing: 'facing the singers', shield: 'singers in path' } },
  ensemble: {
    seatings: { risers: 'choir.risers', arc: 'choir.arc' },
    setups: E05_SETUPS,
    placeZones: E05_PLACE,
    worked: { risers: 'xy', arc: 'axy' },
    meet: {
      figureTitle: 'A CHOIR ON RISERS',
      figureBadge: 'From above, as the conductor faces it · a typical layout, not a particular choir',
      sectionsNote: 'Sopranos front left, altos front right, tenors behind the sopranos, basses behind the altos — four rows, three of them on steps. Switch SEATING for a chamber choir. Tap a section.',
      soundNote: 'The arcs show WHERE each voice leaves — the mouth, forward — never how loud. The risers lift the back rows over the heads in front; a mic a little above the first row hears the rows more evenly.',
      mainAt: PAIR_FAR,
    },
    before: [
      { title: 'LISTEN FIRST', text: 'From the audience or the recording position, with the choir unamplified: section strength, riser height, spacing, the room and the conductor all shape the balance.' },
      { title: 'BALANCE AT THE SOURCE', text: 'Ask the director to fix a weak or hidden section — layout, risers, spacing — before reaching for faders.' },
      { title: 'THE REAL MUSIC', text: 'Rehearse the loudest and softest passages, unison and divided harmony, consonant-heavy words, sustained vowels and any soloists. Mark the layout.' },
      { title: 'THE FEWEST MICS', text: 'Decide what the mics are for — a recording, reinforcement or both — and use the fewest open mics that cover the choir.' },
    ],
    safety: 'Stable stands with wide bases and protected cable paths, clear of the risers’ edges and the singers’ way on and off. Nothing hangs over the singers’ heads: anything hung is the venue’s, on approved rigging. Stop the choir before moving a mic. Protect your hearing; never provoke feedback.',
    workedWords: {
      begin: 'After our research, this is where we suggest you begin a choir recording: one main pair, centred, a few feet in front and a little above the first row’s heads — a place to start and compare, not a rule.',
      clearance: 'The stand in front of the first row, clear of the singers’ feet and sightlines to the conductor; its cable dressed flat and away from the way on and off the risers.',
      height: `A little above the first row’s heads, so it sees past them to the rows on the steps behind. Higher hears more of the back rows and the room; lower, more of the first row and its diction.`,
    },
    learnZones: [
      'What you just did, in words. After our research, the blue zones are where we suggest you begin with the main pair’s centre — near, about 0.6–1.2 m (2–4 ft) in front and 0.3–0.9 m (1–3 ft) above the first row’s heads; or farther and higher, where the whole choir fills the pair’s angle. Places to start and compare, not a best place.',
      'Change one variable at a time — distance, height, then the angle — and compare at a consistent level on the same passage, on loudspeakers.',
      'Area mics follow the same idea: a few feet out, a little above, aimed at the middle or back rows, and at least three times their distance to the singers apart from each other.',
    ],
  },
};
