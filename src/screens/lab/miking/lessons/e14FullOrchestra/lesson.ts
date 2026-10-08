/**
 * E14 FULL ORCHESTRA — the lesson as DATA, written to the 2026-10-07 journey
 * (MEET IT and STARTING SETUPS given here). Words from the owner's lesson
 * (docs/labs/miking/source_text/Full-Orchestra-Miking-Technique.txt; "L<n>"
 * in comments only); research in docs/labs/miking/full_orchestra/;
 * corrections E14-* in CORRECTIONS_LOG.md. Owner ruling 2026-10-04:
 * suggested starting points, no sources, brands or badges on screen. FULLY
 * SILENT: the orchestra and its hall are shown, never played.
 */
import type { DiagnosticItem, LessonPages, MikingScenario, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import type { EnsembleLesson } from '../shared/ensemble/ensembleData.ts';
import { abHole, BRAND_REASON, ensembleWords, hearingCheck, msMono, noThreeToOne, ortfFixed, PAIR_REASON, POWER_REASON, riggingCheck, riggingDiag, SAFE_REASON, SPOTS_REASON, supportFirst, supportNeed, treeCentre } from '../shared/ensemble/ensembleItems.ts';
import { E14_MODEL, E14_PLACE, E14_SETUPS, E14_WEDGES, E14_ZONES, MAIN_C } from './geometry.ts';

const pages: LessonPages = {
  meet: {
    title: 'Meet it — where the sound comes from',
    goal: 'Meet the orchestra in brief — its sections and where each sits as the conductor faces them — and see where each section’s sound leaves its instruments.',
    credit: { scenarios: ['orc.meet.1', 'orc.meet.2', 'orc.meet.3'], note: 'Answer the three checks on the sections and where the sound leaves.' },
    takeaway: 'Strings in front, winds behind them, brass and percussion at the back; every section sends its sound its own way — the horns backward, the trumpets forward, the strings up and out. A main pair hears the balance they make in the hall.',
  },
  setups: {
    title: 'Starting setups',
    goal: 'See real main arrays and supports drawn on the stage — a spaced pair, a near-coincident pair, a three-omni tree with and without outriggers, a section support — each with its stand, its aim, its height and its distance. Then what to settle before any mic goes up.',
    credit: { scenarios: ['orc.set.1', 'orc.rig', 'orc.hear'], interactive: 'setupsSeen', note: 'Look at every main setup on the drawing, and answer the three checks.' },
    takeaway: 'Start with one main perspective over or just behind the podium; supports come later, for a named need. Get the seating, the score and the venue’s rules first; anything flown is the venue’s.',
  },
  microphone: {
    title: 'Choose the microphones',
    goal: 'Choose the main array by its method and patterns — spaced omnis, a near-coincident or coincident pair, M/S, a tree — and a support by its pattern, not by brand.',
    credit: { scenarios: ['orc.mic.1', 'orc.ortf', 'orc.ms', 'orc.mic.2', 'orc.rec.1'], note: 'Answer the five checks (one reaches back to where the sound leaves).' },
    takeaway: 'Omnis for a spaced pair, a tree and outriggers; cardioids for X/Y, the 17 cm pair and supports; M/S when the width should be set later. Each method has its own geometry — keep it, and move the array as a unit.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and move the main array yourself — height, distance and across — and see what changes: the front-to-back balance, the time differences, what the recording angle takes in.',
    credit: { scenarios: ['orc.place.1', 'orc.place.2', 'orc.31', 'orc.rec.2'], interactive: 'twoZones', note: 'Rest the array’s centre, clear of the players and the conductor, in two different suggested starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'The main array is a perspective: higher hears more of the back rows and the hall, closer more of the front desks. Move the whole array, one change at a time, at matched level — and keep every sightline and walkway clear.',
  },
  context: {
    title: 'Recording, broadcast or live',
    goal: 'Aim a support so a monitor sits in its rejection — and know what a hall recording, a broadcast and live reinforcement each ask of the mics.',
    credit: { scenarios: ['orc.ctx.1', 'orc.ctx.2', 'orc.ctx.studio', 'orc.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: turn the support (or change its pattern) until the side-fill monitor sits in its rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'A recording: one main perspective, supports for named needs. A broadcast: the same, with close detail for the pictures on separate channels. Live: closer pickup and fewer open mics; the distant pair stays on its own bus.',
  },
  twoMic: {
    title: 'Main pair and a support',
    goal: 'A main pair and a woodwind support: see how much earlier the support hears its players, what polarity does and does not change, and judge the sum in mono.',
    credit: { scenarios: ['orc.first', 'orc.two.1', 'orc.two.2'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the three checks.' },
    takeaway: 'A support hears its players first; the main pair later. Polarity flips the sign, never the time. Bring a support up only as far as the need asks; a delay is a trial judged by ear, never set by distance alone.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Listen to the main pair alone first. Move it, change one thing at a time, check mono — and reach for gain, a pad or EQ only after the placement. Lower the level at the first sign of feedback.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a main-pair setup in order, choose and justify a setup for two briefs, and say what would justify a support.',
    credit: { scenarios: ['orc.prac.order', 'orc.prac.gain', 'orc.prac.setup1', 'orc.prac.setup2', 'orc.prac.3', 'orc.hole', 'orc.tree', 'orc.need'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'Map the ensemble, hear it, place one main perspective safely, set gain on the loudest passage, add a support only for a named need, and keep recording and reinforcement on their own paths.',
  },
};

/* THE CHECKS. Lesson refs (comments only): meet L5 · set L5, L54 · mic L11–L22 · place L6, L24 · ctx L46–L52 · two L49 · prac L71–L76. */
const scenarios: MikingScenario[] = [
  {
    id: 'orc.meet.1',
    page: 'meet',
    prompt: 'Which section’s sound reaches the hall mostly off the wall behind it?',
    options: ['The horns', 'The trumpets', 'The first violins'],
    correct: 'The horns',
    explain: 'A horn’s bell points back, past the player’s right: much of what the hall hears comes off the surface behind the section. A mic in front of the horns hears less of them than you might expect.',
    why: {
      'The trumpets': 'Trumpet bells point forward, toward the conductor and the hall.',
      'The first violins': 'Violins radiate up and out from the top plate, toward the room.',
    },
  },
  {
    id: 'orc.meet.2',
    page: 'meet',
    prompt: 'Seen from the conductor, which strings sit on the left in both layouts?',
    options: ['The first violins', 'The viola section', 'The double basses'],
    correct: 'The first violins',
    explain: 'In the modern layout the violins sit together on the conductor’s left; in the layout with the violins facing each other the firsts are still on the left and the seconds move to the right.',
    why: {
      'The viola section': 'The violas sit to the right of centre in both layouts.',
      'The double basses': 'The basses sit behind the cellos — on the right in the modern layout, left of centre in the other.',
    },
  },
  {
    id: 'orc.meet.3',
    page: 'meet',
    prompt: 'At a main pair over the podium, why do the front desks arrive loudest?',
    options: ['They are much closer to the pair', 'Front players simply play louder', 'The back rows face away from it'],
    correct: 'They are much closer to the pair',
    explain: 'Level falls with distance: the front desks may be a third of the distance of the back rows. Height evens the distances out a little — one reason the main pair goes 3–4 m up.',
    why: {
      'Front players simply play louder': 'The players balance for the hall; the pair’s distances do the rest.',
      'The back rows face away from it': 'Every player faces the conductor; distance is what differs.',
    },
  },
  {
    id: 'orc.set.1',
    page: 'setups',
    prompt: 'Before choosing an array, what do you get first?',
    options: ['The seating, the score and the hall’s rules', 'A matched pair of the most costly microphones', 'A spare input channel for each desk of players'],
    correct: 'The seating, the score and the hall’s rules',
    explain: 'Get the seating chart, the score or cue list, the hall’s restrictions, the audience and camera positions, the loudspeaker plan and whether a choir or soloist joins — then listen through a quiet and a loud passage.',
    why: {
      'A matched pair of the most costly microphones': 'The mics come after the plan; no brand replaces knowing the ensemble and the hall.',
      'A spare input channel for each desk of players': 'Channels follow needs; the main perspective comes first.',
    },
  },
  riggingCheck('orc', 'setups'),
  hearingCheck('orc', 'setups'),
  {
    id: 'orc.mic.1',
    page: 'microphone',
    prompt: 'Why is a spaced main pair usually two omnis?',
    options: ['They hear the hall with the orchestra', 'They reject the audience behind them', 'They need no phantom power to work at all'],
    correct: 'They hear the hall with the orchestra',
    explain: 'Omnis hear all round: the orchestra with the hall’s sound, and an even low end at a distance. Their spacing makes the stereo image from time differences.',
    why: {
      'They reject the audience behind them': 'An omni rejects nothing; it hears the audience too.',
      'They need no phantom power to work at all': 'Power depends on the mic, not its pattern; most need phantom power.',
    },
  },
  ortfFixed('orc', 'microphone'),
  msMono('orc', 'microphone'),
  {
    id: 'orc.mic.2',
    page: 'microphone',
    prompt: 'Which main pair keeps the most dependable mono sum?',
    options: ['Coincident: the capsules together', 'Spaced: two omnis 2 m apart', 'Two outriggers on their own, 6 m apart'],
    correct: 'Coincident: the capsules together',
    explain: 'With the capsules together, every player reaches both mics at the same instant: no time differences to comb in mono. A spaced pair is wider and needs a mono check.',
    why: {
      'Spaced: two omnis 2 m apart': 'Wide spacing adds time differences that comb in mono — and can thin the middle.',
      'Two outriggers on their own, 6 m apart': 'Outriggers are extra side perspectives, not a main pair.',
    },
  },
  {
    id: 'orc.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Where does a cello section’s sound leave the instruments?',
    options: ['Forward from the top plates, low', 'Up from the scrolls at the top', 'Back past the players’ shoulders'],
    correct: 'Forward from the top plates, low',
    explain: 'Each cello sits between the player’s knees: its top plate faces forward, low, and the floor it stands on joins in. A support aims across that region, not at the scrolls.',
    why: {
      'Up from the scrolls at the top': 'The scroll is the tuning end; the body radiates.',
      'Back past the players’ shoulders': 'That is a horn’s bell; the cello radiates forward.',
    },
  },
  {
    id: 'orc.place.1',
    page: 'placement',
    prompt: 'You raise the main pair from 3 m to 4 m. What tends to change?',
    options: ['More of the back rows and the hall', 'Only the level: nothing else moves', 'The pair hears the front desks more'],
    correct: 'More of the back rows and the hall',
    explain: 'Higher, the distances to the front and back rows even out and the pair sees past the front players — more back rows and hall, less front-desk weight. Compare at matched level.',
    why: {
      'Only the level: nothing else moves': 'Height changes the balance of rows and the room, not only the level.',
      'The pair hears the front desks more': 'It is the other way round: higher favours them less.',
    },
  },
  {
    id: 'orc.place.2',
    page: 'placement',
    prompt: 'Your best-sounding pair position blocks the conductor’s view. Next?',
    options: ['Find the nearest clear spot and compare', 'Keep it: the sound matters most here', 'Ask the players to move their chairs back'],
    correct: 'Find the nearest clear spot and compare',
    explain: 'Sightlines, bows, breathing, music stands, exits and audience access come first. Find the nearest clear position and compare it at matched level — the best mic position may not be the best seat for a person.',
    why: {
      'Keep it: the sound matters most here': 'A blocked sightline is not yours to trade for sound.',
      'Ask the players to move their chairs back': 'The seating is the conductor’s and the players’; move the mic.',
    },
  },
  noThreeToOne('orc', 'placement'),
  {
    id: 'orc.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · In the modern layout, which section sits behind the cellos?',
    options: ['The double basses', 'The second violins', 'The horn section'],
    correct: 'The double basses',
    explain: 'Strings run high to low, left to right as the conductor faces them, with the basses behind the cellos on the right. A support for the low strings covers that corner.',
    why: {
      'The second violins': 'In that layout the seconds sit beside the firsts, on the left.',
      'The horn section': 'The horns sit behind the woodwinds, farther back.',
    },
  },
  {
    id: 'orc.ctx.1',
    page: 'context',
    prompt: 'Live in a large hall: should the distant main pair feed the PA?',
    options: ['Keep it for the recording instead', 'Send it: it carries the whole orchestra', 'Send it, as loud as the room will allow it'],
    correct: 'Keep it for the recording instead',
    explain: 'A distant pair hears the PA too, and its stereo image will not reach every seat. Keep it on its own bus for the recording or stream; reinforce from closer section mics, only as much as needed.',
    why: {
      'Send it: it carries the whole orchestra': 'It also carries the hall and the PA — a feedback loop and a wash at high gain.',
      'Send it, as loud as the room will allow it': 'Never work at the edge of feedback; lower the send at the first ring.',
    },
  },
  {
    id: 'orc.ctx.2',
    page: 'context',
    prompt: 'For reinforcement in a big hall, which pickup helps most?',
    options: ['Closer section mics, fewer open', 'A wider spaced main pair, higher up', 'More room mics, turned up louder'],
    correct: 'Closer section mics, fewer open',
    explain: 'Closer pickup hears the players strongly against the loudspeakers: more gain before feedback. Fewer open mics, each aimed with the loudspeakers and monitors in mind.',
    why: {
      'A wider spaced main pair, higher up': 'A distant pair hears more of the hall and the PA, not less.',
      'More room mics, turned up louder': 'Room mics hear the PA most of all.',
    },
  },
  {
    id: 'orc.ctx.studio',
    page: 'context',
    prompt: 'STUDIO · A recording in a good hall. Where do you start?',
    options: ['One main pair or tree, then listen', 'A spot on each section, then blend', 'Room mics first, the main pair last'],
    correct: 'One main pair or tree, then listen',
    explain: 'Capture a complete picture from the main pair or tree first; add named supports only after a gap is heard. Record every channel separately when you can, with a channel map.',
    why: {
      'A spot on each section, then blend': 'Spots first loses the shared perspective and adds overlap.',
      'Room mics first, the main pair last': 'The room is judged against the main image, not before it.',
    },
  },
  {
    id: 'orc.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · The horns’ bells point back. What does a mic in front of them hear?',
    options: ['Much of them off the wall behind', 'Their bells directly, at full level', 'Nothing at all from the horns'],
    correct: 'Much of them off the wall behind',
    explain: 'With the bells facing back, a mic in front hears the horns largely by reflection — softer and later. Their sound in the hall depends on the surface behind them.',
    why: {
      'Their bells directly, at full level': 'The bells face away from it.',
      'Nothing at all from the horns': 'It still hears them, by the reflections and round the players.',
    },
  },
  supportFirst('orc', 'twoMic'),
  {
    id: 'orc.two.1',
    page: 'twoMic',
    prompt: 'You flip the support’s polarity. What happens to its 15 ms lead?',
    options: ['Nothing: polarity does not move time', 'It turns into a 15 ms lag behind the pair', 'It shrinks to nothing on long notes'],
    correct: 'Nothing: polarity does not move time',
    explain: 'Polarity flips the sign of the signal; the arrival time stays. The comb in the sum moves; the delay does not. Only moving a mic — or a measured delay — changes the time.',
    why: {
      'It turns into a 15 ms lag behind the pair': 'Time is set by distance, not by the polarity switch.',
      'It shrinks to nothing on long notes': 'A sign flip cannot remove a time difference.',
    },
  },
  {
    id: 'orc.two.2',
    page: 'twoMic',
    prompt: 'A delay on the woodwind support helps the flute but not the oboe. Why?',
    options: ['Each player is a different distance', 'Delays only suit the metal instruments', 'The oboe’s polarity is reversed'],
    correct: 'Each player is a different distance',
    explain: 'Every player has its own path difference between the support and the main pair, so one delay suits one player at best — and players move. Judge by ear, against the version with no delay.',
    why: {
      'Delays only suit the metal instruments': 'A delay acts on everything equally; the distances differ.',
      'The oboe’s polarity is reversed': 'Polarity does not change from player to player; the arrival times do.',
    },
  },
  {
    id: 'orc.prac.gain',
    page: 'practice',
    prompt: 'Which passage do you set the main pair’s gain on?',
    options: ['The loudest tutti, brass and drums', 'A quiet string passage, to start', 'The tuning note before the concert'],
    correct: 'The loudest tutti, brass and drums',
    explain: 'Set input gain on a loud tutti with the brass and percussion peaks, leaving headroom: a quiet rehearsal passage cannot show the peak.',
    why: {
      'A quiet string passage, to start': 'The first loud chord would then overload the inputs.',
      'The tuning note before the concert': 'Tuning is quiet and steady; the music peaks far higher.',
    },
  },
  {
    id: 'orc.prac.3',
    page: 'practice',
    prompt: 'What justifies adding a support to the main pair?',
    options: ['A named line the pair does not carry', 'Supports are the usual standard setup', 'More level than the pair can give'],
    correct: 'A named line the pair does not carry',
    explain: 'A support addresses a specific need — an inner line, a solo, a quiet harp, a broadcast close-up. Bring it up from silence just until the need is met, then check the image and mono.',
    why: {
      'Supports are the usual standard setup': 'Each support must earn its place with a stated need.',
      'More level than the pair can give': 'Level comes from gain; a support changes the perspective.',
    },
  },
  abHole('orc', 'practice'),
  treeCentre('orc', 'practice'),
  supportNeed('orc', 'practice'),
];

const symptoms: Symptom[] = [
  {
    id: 'orc.s.front',
    observation: 'Strings too close, winds far away',
    firstChecks: 'Is the main pair too low or too far forward for this seating? Listen to the seating first, then raise or move the main perspective, one change at a time.',
    options: ['Raise or move the main pair; compare', 'Add a support on each of the woodwinds', 'Turn the strings down with EQ'],
    correct: 'Raise or move the main pair; compare',
    explain: 'The pair is a perspective: higher or farther back evens the rows. Compare one move at a time, at matched level.',
    why: {
      'Add a support on each of the woodwinds': 'Supports first hides a perspective problem with overlap.',
      'Turn the strings down with EQ': 'EQ changes tone, not distance; move the pair.',
    },
  },
  {
    id: 'orc.s.centre',
    observation: 'Weak centre, exaggerated width',
    firstChecks: 'Is the spaced pair too wide? Reduce the spacing, check the centre mic if there is one, or compare a coincident or near-coincident pair; confirm in mono.',
    options: ['Reduce the spacing; compare; check mono', 'Pan the two mics wider still, hard left and right', 'Raise only the left mic’s level'],
    correct: 'Reduce the spacing; compare; check mono',
    explain: 'Past about 1 m a spaced pair can lose its middle. Narrow it, check a centre mic, or try a closer-spaced method — and listen in mono.',
    why: {
      'Pan the two mics wider still, hard left and right': 'Wider panning deepens the hole in the middle.',
      'Raise only the left mic’s level': 'That shifts the image; it does not fill the centre.',
    },
  },
  {
    id: 'orc.s.thin',
    observation: 'A support makes the orchestra thin',
    firstChecks: 'Is the support too loud or combing with the pair? Lower it and listen in mono; change its placement or timing only with a before-and-after comparison.',
    options: ['Lower it; listen in mono; compare', 'Flip the polarity of the main pair', 'Raise the support until it fills'],
    correct: 'Lower it; listen in mono; compare',
    explain: 'An early, loud support combs with the main pair. Lower it first; then compare placement or a trial delay against the plain version.',
    why: {
      'Flip the polarity of the main pair': 'A flip moves the comb; it does not remove the time difference.',
      'Raise the support until it fills': 'More of the support deepens the overlap problem.',
    },
  },
  {
    id: 'orc.s.peaks',
    observation: 'Brass and drum peaks distort',
    firstChecks: 'Is a mic, a preamp or a converter overloading at forte? Check the pad and the gain on the loudest passage before any EQ.',
    options: ['Check pads and gain at forte', 'Add EQ to soften the brass', 'Move the pair closer to the brass'],
    correct: 'Check pads and gain at forte',
    explain: 'Distortion on peaks is overload: find the stage that clips — capsule, preamp, converter — and fix its gain or pad.',
    why: {
      'Add EQ to soften the brass': 'EQ cannot repair clipping.',
      'Move the pair closer to the brass': 'Closer makes the peaks louder at the pair.',
    },
  },
  {
    id: 'orc.s.fb',
    observation: 'Feedback in the reinforcement',
    firstChecks: 'Lower the affected send at once; check the loudspeaker and mic orientation and how many mics are open. Never demonstrate feedback.',
    options: ['Lower the send; check aim and open mics', 'Notch the ringing tone and turn it back up', 'Add the main pair to the PA as well'],
    correct: 'Lower the send; check aim and open mics',
    explain: 'Bring the level down first; then fix the geometry — mic aim against loudspeakers and monitors — and close the mics that are not needed.',
    why: {
      'Notch the ringing tone and turn it back up': 'A notch is not a substitute for geometry and fewer open mics.',
      'Add the main pair to the PA as well': 'A distant pair feeding the PA makes feedback likelier.',
    },
  },
  {
    id: 'orc.s.noise',
    observation: 'Audience or ventilation noise dominates',
    firstChecks: 'Is it the main pair or the room mics? Compare them, and consider a closer perspective only if the musical balance survives.',
    options: ['Compare the pair and the room mics', 'Gate the main pair between phrases', 'High-pass everything well above the cellos'],
    correct: 'Compare the pair and the room mics',
    explain: 'Find which mics carry the noise; lower the room mics, or move the main pair a little closer, checking the balance survives.',
    why: {
      'Gate the main pair between phrases': 'A gate cuts the hall’s decay — part of the orchestra’s sound.',
      'High-pass everything well above the cellos': 'That removes the orchestra’s low end, and the noise is not only low.',
    },
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'orc.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A concert recording in a good hall; no PA. Phantom power on every input; the venue allows a tall stand behind the podium.',
    setups: [
      { id: 'a', label: 'A spaced omni pair 50 cm apart, about 3.2 m up just behind the podium', ok: true, power: 'phantom', feedback: 'The orchestra and the hall as one picture, from a safe stand.' },
      { id: 'b', label: 'A three-omni tree over the podium on a tall boom stand, centre a few dB down', ok: true, power: 'phantom', feedback: 'A fair choice where there is room and a safe mount.' },
      { id: 'c', label: 'A close mic on every desk and no main pair', ok: false, power: 'phantom', feedback: 'No shared picture, and many overlapping paths.' },
      { id: 'd', label: 'A pair tied to a lighting bar over the strings', ok: false, power: 'phantom', feedback: 'Flying anything is the venue’s crew’s job, to a rated plan.' },
      { id: 'e', label: 'A pair on the floor in the front row of seats', ok: false, power: 'phantom', feedback: 'Too low: the front desks hide the rows behind.' },
    ],
    reasons: [PAIR_REASON, SAFE_REASON, POWER_REASON, BRAND_REASON, SPOTS_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: one main perspective first, safely mounted, with the power the condensers need.',
  },
  {
    id: 'orc.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A broadcast concert with a light PA for a soloist. Phantom power is available; cameras need clear sightlines.',
    setups: [
      { id: 'a', label: 'The main pair for the broadcast, plus a woodwind support; the PA fed only from the soloist’s close mic', ok: true, power: 'phantom', feedback: 'Scale from the pair, a named support, and the PA kept apart.' },
      { id: 'b', label: 'A tree for the broadcast, nothing from it to the PA, section mics kept below the camera lines', ok: true, power: 'phantom', feedback: 'Fair: the broadcast gets its picture, the PA stays separate.' },
      { id: 'c', label: 'The main pair sent to the PA at high level', ok: false, power: 'phantom', feedback: 'A distant pair in the PA invites feedback and a wash.' },
      { id: 'd', label: 'Stands in the aisles, out of the cameras’ shot', ok: false, power: 'phantom', feedback: 'Aisles and exits stay clear.' },
      { id: 'e', label: 'A boom stand reaching over the violins at full extension', ok: false, power: 'phantom', feedback: 'Never route a boom over players without the venue’s plan.' },
    ],
    reasons: [PAIR_REASON, SAFE_REASON, { id: 'r.sep', label: 'Broadcast and PA paths kept on separate channels', role: 'required', feedback: 'Separate paths keep the distant pair out of the PA.' }, POWER_REASON, BRAND_REASON],
    explain: 'Two setups pass. What passes is the reasoning: a main perspective, safe sightlines and walkways, and the broadcast and the PA kept apart.',
  },
];

const predictions: EnsembleLesson['predictions'] = {
  microphone: { prompt: 'Before you look: which pattern hears the most of the hall?', options: ['Omni', 'Cardioid', 'Figure-8'], after: 'Now sweep SOURCE ANGLE round the pattern and watch PICKUP.' },
  placement: { prompt: 'Predict: you raise the main pair from 3 m to 4 m. What changes most?', options: ['The back rows come forward', 'Only the level', 'The front desks get louder'], after: 'Higher, the distances to the rows even out: the NEAR / FAR readout shrinks, and the back rows and the hall come up against the front desks. Compare at matched level.' },
  context: { prompt: 'The side-fill monitor sits in front of the support, off to the side. Can its rejection reach it?', options: ['Yes — turn the mic’s back toward it', 'No — only an omni can', 'It is already in the null'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'A main pair and a woodwind support. If you flip B’s polarity, what happens to Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE to another section.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'orc.q.1',
    covers: 'meet',
    prompt: 'Which brass section points its bells away from the hall?',
    options: ['The horns', 'The trumpets', 'The trombones'],
    correct: 'The horns',
    explain: 'Horn bells point back past the players’ right; the hall hears much of them off the wall behind.',
    why: { 'The trumpets': 'Trumpet bells point forward.', 'The trombones': 'Trombone bells point forward, over the slides.' },
  },
  {
    id: 'orc.q.2',
    covers: 'meet',
    prompt: 'In the modern layout, where are the cellos as the conductor faces them?',
    options: ['Right, the basses behind', 'Left, beside the violins', 'Centre, behind the winds'],
    correct: 'Right, the basses behind',
    explain: 'High to low, left to right: the cellos on the outside right, the basses behind them.',
    why: { 'Left, beside the violins': 'That is the other layout, with the violins facing each other.', 'Centre, behind the winds': 'Behind the winds sit the brass and percussion.' },
  },
  {
    id: 'orc.q.3',
    covers: 'meet',
    prompt: 'Why does height help a main pair over the podium?',
    options: ['It evens the near and far rows', 'It removes the hall from the sound', 'It makes the pair louder overall'],
    correct: 'It evens the near and far rows',
    explain: 'From higher up the front desks are less dominant and the pair sees past them to the rows behind.',
    why: { 'It removes the hall from the sound': 'Higher tends to hear more of the hall, not less.', 'It makes the pair louder overall': 'Level comes from gain; height changes the balance.' },
  },
  {
    id: 'orc.q.4',
    covers: 'setups',
    prompt: 'Which main array keeps every pair of its mics at least 1.5 m apart?',
    options: ['The three-omni tree', 'The 17 cm cardioid pair', 'The coincident X/Y pair'],
    correct: 'The three-omni tree',
    explain: 'The tree’s left and right are 2 m apart and the centre 1.5 m ahead: every pair at least 1.5 m apart.',
    why: { 'The 17 cm cardioid pair': 'Its capsules are 17 cm apart.', 'The coincident X/Y pair': 'Its capsules are together.' },
  },
  {
    id: 'orc.q.5',
    covers: 'setups',
    prompt: 'Where does an orchestra’s main pair often begin?',
    options: ['Over or just behind the podium', 'At the front desk, at chair height', 'At the back of the hall, low'],
    correct: 'Over or just behind the podium',
    explain: 'Above or just behind the conductor, 3–4 m up, so no player hides the ones behind — a place to start, then compare.',
    why: { 'At the front desk, at chair height': 'Low and close, the front desks hide everyone behind them.', 'At the back of the hall, low': 'That is a room perspective, far from the orchestra’s detail.' },
  },
  riggingDiag('orc'),
];

export const E14_LESSON: EnsembleLesson = {
  id: 'E14',
  labId: 'ensembles',
  title: 'Full Orchestra',
  subtitle: 'A main pair or a tree over the podium first — supports only where something is missing',
  noun: { one: 'orchestra', many: 'orchestras' },
  model: E14_MODEL,
  micTypeIds: ['arrOmni', 'arrCard', 'arrFig8'],
  zones: E14_ZONES,
  setupPairs: [{ label: 'The main pair and a woodwind support', A: { zone: 'orch.main', typeId: 'arrOmni', pattern: 'omni' }, B: { zone: 'sup.ww', typeId: 'arrCard', pattern: 'cardioid' }, line: 'Detail for a named need from the support; the main pair keeps the picture. Check the pair together in mono.' }],
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    {
      id: 'orc.prac.order',
      page: 'practice',
      prompt: 'A main pair for an orchestra recording, in order:',
      steps: [
        { text: 'Get the seating, the score and the venue’s rules; mark the sections', early: 'Start with the plan: where everyone sits and what the venue allows.' },
        { text: 'Listen from several places through a quiet and a loud passage', early: 'Hear the orchestra before choosing an array.' },
        { text: 'Place one main pair safely over or just behind the podium', early: 'The main perspective comes before any support.' },
        { text: 'Set gain on the loudest tutti, leaving headroom', early: 'Gain is set once the pair is up.' },
        { text: 'Change one thing at a time; compare at matched level', early: 'Adjust only once you have a first picture and safe gain.' },
        { text: 'Add a support only for a named need; check mono', early: 'Supports come last, for something the pair lacks.' },
      ],
      explain: 'Plan, listen, place the main perspective safely, set gain on the peaks, adjust one thing at a time — and only then add a support for a stated need.',
    },
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Strings, woodwinds, brass, percussion and often a harp and keyboards — fifty or more players sounding as one ensemble, led by a conductor.', src: 'LESSON-ORCH' },
    { title: 'WHERE YOU MEET IT', text: 'In concert halls and theatres — for concerts, recordings, broadcasts and, in large spaces, with some reinforcement.', src: 'LESSON-ORCH' },
    { title: 'HOW IT IS SEATED', text: 'Strings at the front, woodwinds behind them, brass and percussion at the back; the layouts vary — this lab draws two, as the conductor faces the players.', src: 'JAX-SEAT' },
    { title: 'ITS SIZE', text: 'Stage-sized: this drawing is about 10 m wide and 9 m deep, 57 players. A typical layout, not a particular orchestra.', src: 'ABSIL' },
  ],
  sound: {
    stages: [
      { title: 'Each section its own way', text: 'Strings radiate up and out from their top plates, woodwinds from their open holes and bells, trumpets and trombones forward, horns backward, timpani up from their heads.' },
      { title: 'The hall answers', text: 'Reflections and reverberation join every section into one sound — part of what the audience, and a main pair, hear.' },
      { title: 'A main pair hears the blend', text: 'From over the podium, the pair hears the sections at different distances: the front desks nearest, the percussion farthest.' },
      { title: 'A support hears a few players', text: 'A mic 1–1.5 m from three or four players hears them first and clearest — a local view, added under the main pair.' },
    ],
    attack: 'The start of each note — bows, tonguing, mallets — reaches a closer mic first and clearest; a distant pair hears it softened by distance and the hall.',
    body: 'The sustained sound of the sections blended in the hall. A main pair hears more of the blend and the decay; a support, more of its few players. Tendencies — orchestras and halls vary.',
    head: { diameterMm: 10000, rods: 0, label: 'an orchestra on its stage', strikeSrc: 'LESSON-ORCH' },
  },
  setting: {
    items: [
      { id: 'cond', label: 'the conductor and the sightlines', short: 'CONDUCTOR', note: 'No stand, boom or mic between the conductor and the players, or in a camera’s view where there is a broadcast. Confirm sightlines with the conductor and the stage manager.', prov: { kind: 'sourced', src: 'LESSON-ORCH', quote: 'confirm sightlines with the conductor and stage manager (L5)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'bows', label: 'bows, slides, music stands and breathing room', short: 'PLAYERS', note: 'Every stand and cable stays clear of the bows’ sweep, the trombone slides, the music stands and the players’ way in and out.', prov: { kind: 'sourced', src: 'LESSON-ORCH', quote: 'Never block the conductor, players’ bows, breathing, music stands, exits or audience access (L54)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'brass', label: 'the brass and percussion behind', short: 'BRASS', note: 'Loud sections reach every mic on stage: a support on the woodwinds hears the brass behind them too.', prov: { kind: 'illustrative', reason: 'the seating: a drawing default' }, tag: 'SPILL', scene: 'all' },
      { id: 'hall', label: 'the audience and the ventilation', short: 'HALL', note: 'A distant pair hears the audience and the air handling: check the quiet passages for both.', prov: { kind: 'sourced', src: 'LESSON-ORCH', quote: 'Audience or HVAC noise dominates (L67)' }, tag: 'NOISE', scene: 'all' },
      { id: 'rig', label: 'anything flown over the stage', short: 'RIGGING', note: 'A flown array, anything attached to the building or reached over players is the venue’s: an approved plan, rated hardware and qualified crew.', prov: { kind: 'sourced', src: 'LESSON-ORCH', quote: 'no one should fly a main array … without the venue’s approved rigging plan and qualified crew (L54, wording per the house rule)' }, tag: 'VENUE ONLY', scene: 'all' },
      { id: 'pa', label: 'the PA loudspeakers and monitors', short: 'PA', note: 'Live, every directional mic is aimed with the loudspeakers and monitors in mind; the distant pair stays on its own bus.', prov: { kind: 'sourced', src: 'S-LIVE', quote: 'aim each directional microphone with the actual loudspeaker and monitor locations in mind (L51)' }, tag: 'FEEDBACK', scene: 'stage' },
      { id: 'cams', label: 'the cameras', short: 'CAMERAS', note: 'A broadcast needs clear camera lines: stands placed where a camera does not look, cables dressed flat and away from walkways.', prov: { kind: 'sourced', src: 'LESSON-ORCH', quote: 'Camera sightlines and stage resets may constrain a broadcast setup (L48)' }, tag: 'SIGHTLINES', scene: 'stage' },
      { id: 'room', label: 'the hall’s own sound', short: 'THE ROOM', note: 'In a good hall the room is part of the music: the main pair’s height and distance set how much of it you hear.', prov: { kind: 'sourced', src: 'DPA-AB-ORCH', quote: 'the main position balances ensemble coverage and hall sound' }, tag: 'PART OF THE SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: decide first whether the orchestra needs reinforcement at all. If it does, closer section or solo pickup, fewer open mics, each aimed with the loudspeakers in mind; build from the sound already in the room; the distant pair feeds the recording or stream on its own bus.',
    studio: 'A RECORDING: one complete picture from a main pair or tree first, then named supports only after a gap is heard. Record the channels separately, keep a channel map, and set gain on the loudest tutti.',
  },
  diagnostic,
  practice: {
    task: 'Map the ensemble, listen through a quiet and a loud passage, place one main perspective safely, set gain on the loudest tutti, change one thing at a time, and add a support only for a named need. With the players’, the conductor’s and the venue’s agreement, log what you tried below.',
    fields: [
      { id: 'seating', label: 'Seating and the sections you marked', kind: 'text' },
      { id: 'goal', label: 'What it is for', kind: 'choice', choices: ['hall recording', 'broadcast', 'live reinforcement'] },
      { id: 'array', label: 'Main array: method, patterns, spacing', kind: 'text' },
      { id: 'pos', label: 'Height, distance from the front row, across', kind: 'text' },
      { id: 'support', label: 'Any support, and the need it met', kind: 'text' },
      { id: 'notes', label: 'What you heard: centre, rows, hall, mono (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The orchestra is a typical layout, not a particular one: 57 players (strings 10-8-6-6-4, double winds, four horns, two trumpets, three trombones and tuba, timpani, two percussion, harp, celesta); the string desks on arcs 1.6, 2.7 and 3.8 m from the podium; winds on a 0.2 m riser, brass on 0.4 m, timpani and percussion on 0.6 m — every position, count and riser a drawing default.', dims: [] },
    { text: 'The podium (0.9 m square, 0.2 m high, 1.3 m in front of the front row) and the main pair’s boom stand (1.5 m behind the bar) are drawing defaults.', dims: [] },
    { text: 'The main pair is drawn 3.2 m up (inside the 3–4 m example; the height practice reports). The tree is drawn 2 m wide with its centre 1.5 m ahead (one maker’s example); a compact tree from practice is offered too.', dims: [] },
    { text: 'The outriggers are drawn about 6.1 m apart, about 1.5 m in front of the outer strings, at the tree’s height — practice, not a standard; no maker gives their dimensions.', dims: [] },
    { text: 'Section supports are drawn 1.25 m from the four nearest players (inside the 1–1.5 m example); the stands’ places are drawing defaults.', dims: [] },
  ],
  live: { wedges: E14_WEDGES },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. An orchestra has no single right setup: start with one main perspective above or just behind the podium, listen, move it one change at a time, and add a support only for a named need. Every orchestra, hall and production is different: experiment, compare at matched level, and trust your ears. The lab is silent and draws a simplified picture: a typical seating, ideal patterns, straight paths and distances read from the drawing. Anything flown or reached over players is the venue’s rigging, by qualified crew; protect your hearing.',
  copy: { words: ensembleWords('orchestra') },
  ensemble: {
    seatings: { american: 'orch.american', german: 'orch.german' },
    setups: E14_SETUPS,
    placeZones: E14_PLACE,
    worked: { american: 'ab', german: 'ab' },
    meet: {
      figureTitle: 'FULL ORCHESTRA',
      figureBadge: 'From above, as the conductor sees it · a typical layout, not a particular orchestra',
      sectionsNote: 'Strings at the front in arcs round the podium, woodwinds behind them on a low riser, then brass, with timpani and percussion at the back. Tap a section.',
      soundNote: 'The arcs show WHERE each instrument’s sound leaves it — never how loud. The horns point back, the trumpets and trombones forward, the strings up and out: a main pair hears the blend the hall makes of them.',
      mainAt: MAIN_C,
    },
    before: [
      { title: 'GET THE PLAN', text: 'The seating chart, the score or cue list, the hall’s restrictions, the audience and camera positions, the loudspeaker and monitor plan, and whether a choir or soloist joins.' },
      { title: 'HEAR IT', text: 'Listen from several places through a quiet and a loud passage; note whether the balance, the audience’s perspective and the hall’s decay serve the production.' },
      { title: 'DECIDE WHAT IT IS FOR', text: 'A hall recording, a broadcast, live reinforcement — or several at once, each with its own path.' },
      { title: 'SAFE PLACES', text: 'Ground-supported stands with stable bases and protected cable routes; anything flown or attached to the building is the venue’s, by its crew.' },
    ],
    safety: 'No one flies a main array, attaches anything to the venue’s structure, climbs above the ensemble or routes a boom over players without the venue’s approved rigging plan and qualified crew. Stands need stable bases and protected cable routes; exits, aisles and sightlines stay clear. Protect your hearing during loud passages.',
    workedWords: {
      begin: 'After our research, this is where we suggest you begin with an orchestra: one main perspective over or just behind the podium — a place to start and compare, not a rule.',
      clearance: 'The stand behind the podium, out of the conductor’s and the players’ way and off the walkways; nothing over the players. Higher and safer is fine — a flown array is the venue’s rigging, by qualified crew.',
    },
    learnZones: [
      'What you just did, in words. After our research, each blue zone is where we suggest you begin with the main array’s centre: over the podium, or just behind it, about 3–4 m up. They are places to start and compare — the best place for a mic need not be the best seat for a person.',
      'Change one thing at a time — height, then distance, then spacing — and compare at matched level, on the same passage, so louder never wins by itself. Restore the setting you prefer and say why.',
      'The array moves as a unit: its own geometry (17 cm and 110°, or the tree’s 2 m and 1.5 m) stays as it is. A different spacing is a different method, chosen on purpose.',
    ],
  },
};
