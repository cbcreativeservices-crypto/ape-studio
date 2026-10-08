/**
 * F10 SPATIAL AND SPECIALIST FIELD PICKUP — the lesson as DATA, written to
 * the 2026-10-07 journey (MEET IT and STARTING SETUPS given here). Words from
 * the owner's lesson (docs/labs/miking/source_text/
 * F10-Spatial-and-Specialist-Field-Pickup-Miking-Technique.txt; "L<n>" in
 * comments only); research in docs/labs/miking/spatial_field/; corrections in
 * CORRECTIONS_LOG.md "Lab 6 · group 6" — the lightning wait said as "30
 * minutes after the last lightning or thunder" (L44), the hydrophone/contact
 * comparison left to F16/F04 (D-6B-4), the institutional wording stripped
 * (L2, L3, L45–L55). Owner ruling 2026-10-04: suggested starting points, no
 * sources, brands or badges on screen. FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, hollowSymptom, polarityDelay, removeDelay } from '../shared/bowed/bowedItems.ts';
import { F10_MODEL } from './geometry.ts';
import { F10_ZONES } from './model.ts';
import { F10_COPY } from './copy.ts';

const pages: LessonPages = {
  meet: {
    title: 'Meet it — where the sound comes from',
    goal: 'Meet the scene in brief — the listener’s point, the scene front, the sources and the place round them — see how sound arrives there from every side, and decide the deliverable first.',
    credit: { scenarios: ['sp.meet.1', 'sp.meet.2', 'sp.meet.3'], note: 'Answer the three checks on the listener’s point, the arriving sound and the deliverable.' },
    takeaway: 'Start from the listener: where they are, which way they face, what they will listen on. A spatial mic hears everything that reaches its place — it cannot later isolate one source.',
  },
  setups: {
    title: 'Starting setups',
    goal: 'See real spatial rigs drawn at the listener’s point — a binaural head, an Ambisonic mic with a close mic on the source, a five-channel array, Double M/S, a front pair with a rear add-on — each with its stand and its capsules’ aims. Then what to settle before any mic goes up.',
    credit: { scenarios: ['sp.set.1', 'sp.set.2', 'sp.set.3'], interactive: 'setupsSeen', note: 'Look at every main setup on the drawing, and answer the three checks.' },
    takeaway: 'Choose the rig by the deliverable, start at the listener’s point facing the scene front, record a close mic beside it when a source must be clear — and keep the way clear, the stand stable and everyone safe.',
  },
  microphone: {
    title: 'Choose the system',
    goal: 'Choose a spatial system by what it delivers — two ear channels for headphones, four A-format tracks for a turnable field, three Double M/S tracks, five channels for a speaker layout — not by a brand.',
    credit: { scenarios: ['sp.mic.1', 'sp.mic.2', 'sp.mic.3', 'sp.mic.4', 'sp.rec.1'], note: 'Answer the five checks (one reaches back to the scene).' },
    takeaway: 'Binaural for headphones; Ambisonics for a field that can be turned and rendered; Double M/S for a compact, adjustable surround; a spaced array for a speaker layout. None isolates a source; none is a calibrated measurement.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and move the rig yourself — its place, its height, its front — and see what changes: the distance to the source, how far its front is off the scene, whether it stands in the way.',
    credit: { scenarios: ['sp.place.1', 'sp.place.2', 'sp.place.3', 'sp.rec.2'], interactive: 'twoZones', note: 'Rest the rig, clear of the way, in two different suggested starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'A spatial rig is a point of view: where a listener would be, at their height, facing the scene front. Move it one change at a time, log the front and the height — and never in a public route.',
  },
  context: {
    title: 'Channels and destinations',
    goal: 'Keep four Ambisonic tracks right — in order, matched and linked, the output convention chosen, nothing full-range in the LFE — check each destination, and keep a spatial mic out of a live PA.',
    credit: { scenarios: ['sp.ctx.1', 'sp.ctx.2', 'sp.ctx.3', 'sp.rec.3'], interactive: 'aformatDrill', note: 'Put the four tracks right in the drill (it is done when nothing is left to fix), then answer the four checks.' },
    takeaway: 'The channel map is part of the recording: order, gain, mounting, front and output convention written down, the raw tracks kept, every destination checked on its real decoder — and the spatial mic never fed back into the PA.',
  },
  twoMic: {
    title: 'An array and a close mic',
    goal: 'An Ambisonic mic at the listener’s point and a close mic on the singer: see how much earlier the close mic hears the singer, what polarity does and does not change, and why the two stay separate layers.',
    credit: { scenarios: ['sp.two.1', 'sp.two.2', 'sp.two.3', 'sp.two.4'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'The close mic hears the source milliseconds before the array. Summed as they are, they comb or echo; kept as two layers, each does its job. Polarity flips the sign, never the time.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the channel map and the physical setup first — the track order, the gains, the front, the wind cover, the routing — before reaching for processing.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a spatial recording in order, choose and justify a setup for two briefs, and say what would justify a close mic beside the array.',
    credit: { scenarios: ['sp.prac.order', 'sp.prac.gain', 'sp.prac.setup1', 'sp.prac.setup2', 'sp.prac.3', 'sp.mix.1', 'sp.mix.2', 'sp.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The field sheet is optional — it needs a real place and permission.' },
    takeaway: 'The deliverable first, the listener’s point, the front logged, the channels kept right and recorded, the destinations checked, and the place and its people kept safe pass. A brand or a “bigger” array do not — and more than one setup can pass.',
  },
};

/* THE CHECKS. Lesson lines in comments only: sp.meet.* L4–L6 · sp.set.* L42–L44
 * (corrected) · sp.mic.* L11–L24 · sp.place.* L12, L26, L30 · sp.ctx.* L24,
 * L34–L41 · sp.two.* L6, L41 · sp.prac.* / sp.mix.* L45–L52. */
const scenarios: MikingScenario[] = [
  {
    id: 'sp.meet.1',
    page: 'meet',
    prompt: 'Before choosing a spatial mic, what do you decide first?',
    options: ['What the listener will hear it on, and from where', 'Which of the mics has the most capsules in the case', 'How loud the loudest source in the place is'],
    correct: 'What the listener will hear it on, and from where',
    explain: 'Define the listening setup before the recording setup: headphones, a named speaker layout, a turnable scene, stereo or mono — and the listener’s point of view.',
    why: {
      'Which of the mics has the most capsules in the case': 'More capsules is not a deliverable. The destination decides the capture.',
      'How loud the loudest source in the place is': 'Level is set later with gain. The destination comes first.',
    },
  },
  {
    id: 'sp.meet.2',
    page: 'meet',
    prompt: 'Can a surround or Ambisonic capture later pull out one source on its own?',
    options: ['It cannot: it hears everything at its place', 'It can: each source has its own capsule in the array', 'It can, if the capture uses four or more channels'],
    correct: 'It cannot: it hears everything at its place',
    explain: 'A spatial mic records what arrives at that place: the traffic, the wind and the walls with the source. Record a separate close mic if a source must be clear.',
    why: {
      'It can: each source has its own capsule in the array': 'The capsules point in directions, not at sources: each hears the whole place.',
      'It can, if the capture uses four or more channels': 'More channels give direction, not isolation.',
    },
  },
  {
    id: 'sp.meet.3',
    page: 'meet',
    prompt: 'A walker passes on the listener’s left. What tells a listener’s ears where it is?',
    options: ['The left ear hears it a little earlier and louder', 'Only the right ear hears it, while the left is shaded', 'Both ears hear it at the same time and level'],
    correct: 'The left ear hears it a little earlier and louder',
    explain: 'Time and level differences between the ears, and the outer ears’ shaping, carry direction. A binaural head keeps those cues; a fixed head keeps one point of view.',
    why: {
      'Only the right ear hears it, while the left is shaded': 'The far ear still hears it — later and quieter, shaded by the head.',
      'Both ears hear it at the same time and level': 'That is a sound straight ahead or behind, not one to the side.',
    },
  },
  {
    id: 'sp.set.1',
    page: 'setups',
    prompt: 'You hear thunder while finishing an outdoor take. What now?',
    options: ['Stop and get inside a safe place at once', 'Finish the take first, then shelter the mics', 'Lower the stand and keep recording'],
    correct: 'Stop and get inside a safe place at once',
    explain: 'When thunder is heard, get inside a safe place immediately — no take is worth it. Wait 30 minutes after the last lightning or thunder before going back out.',
    why: {
      'Finish the take first, then shelter the mics': 'Thunder means lightning can strike now. People first, then the gear.',
      'Lower the stand and keep recording': 'A lower stand does not make outdoors safe in a storm.',
    },
  },
  {
    id: 'sp.set.2',
    page: 'setups',
    prompt: 'The best-sounding spot is in the middle of a public footpath. What do you do?',
    options: ['Find a place clear of the route', 'Set up there and stay beside the stand', 'Use a wider array so people see it'],
    correct: 'Find a place clear of the route',
    explain: 'Never block a public route with a stand or a wide array, and never leave stands unattended where people walk. Walk and listen at other places clear of the way.',
    why: {
      'Set up there and stay beside the stand': 'Standing beside it still blocks the way.',
      'Use a wider array so people see it': 'A wider array blocks more of the way.',
    },
  },
  {
    id: 'sp.set.3',
    page: 'setups',
    prompt: 'Why record a close mic on the singer beside the Ambisonic take?',
    options: ['The array cannot isolate the singer later', 'The array cannot be used without a second mic', 'The close mic makes the array sound wider'],
    correct: 'The array cannot isolate the singer later',
    explain: 'A spatial capture hears the singer with the whole place. A close mic on its own channel gives the clear voice a mix may need — a second layer, not a replacement.',
    why: {
      'The array cannot be used without a second mic': 'An array works on its own; the close mic is for a need.',
      'The close mic makes the array sound wider': 'A close mic adds clarity, not width.',
    },
  },
  {
    id: 'sp.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Where does a spatial mic start?',
    options: ['At the listener’s point, facing the scene front', 'As close as possible to the loudest source there', 'Wherever the stand fits most easily on the ground'],
    correct: 'At the listener’s point, facing the scene front',
    explain: 'A spatial capture is a point of view: start where a listener would be, at their height, facing the scene front — then walk and listen.',
    why: {
      'As close as possible to the loudest source there': 'That is a close mic’s job; a spatial mic is the listener’s view.',
      'Wherever the stand fits most easily on the ground': 'Convenience is not a point of view; the listener is.',
    },
  },
  {
    id: 'sp.mic.1',
    page: 'microphone',
    prompt: 'Which capture is made for headphones first?',
    options: ['A binaural head', 'A five-channel spaced array', 'A pair of omnis two metres apart'],
    correct: 'A binaural head',
    explain: 'Two ear mics in a model head keep the head’s and the outer ears’ cues for headphone listening. On speakers it depends on the head and the processing.',
    why: {
      'A five-channel spaced array': 'That is made for a five-speaker layout.',
      'A pair of omnis two metres apart': 'A spaced pair is for loudspeakers; it has no head cues.',
    },
  },
  {
    id: 'sp.mic.2',
    page: 'microphone',
    prompt: 'What are the four raw tracks of a first-order Ambisonic mic?',
    options: ['A-format capsules, to convert before use', 'Front-left, front-right, rear-left, rear-right', 'Four mono copies of the same sound field'],
    correct: 'A-format capsules, to convert before use',
    explain: 'They are the four capsules’ own signals (A-format). The mic’s own converter makes the field from them; only then is it turned and rendered.',
    why: {
      'Front-left, front-right, rear-left, rear-right': 'They are not speaker channels: playing them as such gives a wrong picture.',
      'Four mono copies of the same sound field': 'Each capsule hears its own direction; they only mean something together.',
    },
  },
  {
    id: 'sp.mic.3',
    page: 'microphone',
    prompt: 'A Double M/S rig is recorded. What must be known before decoding?',
    options: ['Which side of the figure-8 is positive', 'Which brand made each of the three mics', 'How many speakers the room has'],
    correct: 'Which side of the figure-8 is positive',
    explain: 'The decode adds and subtracts the Side: with its positive side unknown, left and right swap. Mark it before recording, and check the decode with a walker.',
    why: {
      'Which brand made each of the three mics': 'A brand does not set the decode. The Side’s polarity does.',
      'How many speakers the room has': 'The destination comes after; the decode needs the Side’s polarity.',
    },
  },
  {
    id: 'sp.mic.4',
    page: 'microphone',
    prompt: 'What does “.1” mean in a 5.1 delivery?',
    options: ['A separate low-frequency effects channel', 'A sixth mic for the room’s lowest sounds', 'A centre mic set one metre higher'],
    correct: 'A separate low-frequency effects channel',
    explain: '“.1” is a delivery channel for low-frequency effects — not a sixth full-range ambience mic and not a requirement for a subwoofer mic. Never send a full-range field channel to it.',
    why: {
      'A sixth mic for the room’s lowest sounds': 'No mic is required for it; some units derive it.',
      'A centre mic set one metre higher': '“.1” is a channel, not a mic position.',
    },
  },
  {
    id: 'sp.place.1',
    page: 'placement',
    prompt: 'At what height do you start a binaural head for a standing audience?',
    options: ['About 1.7 m — a standing listener’s ears', 'About 3 m — above the heads of the crowd', 'About 0.5 m — away from the wind up high'],
    correct: 'About 1.7 m — a standing listener’s ears',
    explain: 'Put the ears where a listener’s would be: about 1.7 m standing, about 1.2 m seated — then listen and adjust.',
    why: {
      'About 3 m — above the heads of the crowd': 'That is not a listener’s point of view.',
      'About 0.5 m — away from the wind up high': 'Low is not a listener’s height; protect it from wind with a cover instead.',
    },
  },
  {
    id: 'sp.place.2',
    page: 'placement',
    prompt: 'You turn the rig 40° away from the scene front. What changes?',
    options: ['The picture turns: front sounds land off to one side', 'Nothing: a spatial mic hears all the way round anyway', 'Only the level of the front source drops a little'],
    correct: 'The picture turns: front sounds land off to one side',
    explain: 'The rig’s front is the listener’s front: turned, the scene turns with it. Face the scene front and log it.',
    why: {
      'Nothing: a spatial mic hears all the way round anyway': 'It hears all round, but its front decides where each sound is placed.',
      'Only the level of the front source drops a little': 'Direction, not only level, moves.',
    },
  },
  {
    id: 'sp.place.3',
    page: 'placement',
    prompt: 'There is a power line overhead near your spot. How far must the stands and mics stay?',
    options: ['At least 3 m (10 ft), farther if unsure', 'About 1 m, as long as nothing is touching', 'Closer is fine if the stand is a short one'],
    correct: 'At least 3 m (10 ft), farther if unsure',
    explain: 'Keep poles, stands and every mic at least 3 m (10 ft) from overhead power lines — farther if you do not know the voltage.',
    why: {
      'About 1 m, as long as nothing is touching': 'Electricity can jump a gap. At least 3 m (10 ft).',
      'Closer is fine if the stand is a short one': 'A stand can be raised, tipped or carried: at least 3 m (10 ft).',
    },
  },
  {
    id: 'sp.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What should a spatial mic’s place never block?',
    options: ['A public route people need', 'The view of the nearest window', 'The sound of the nearest wall'],
    correct: 'A public route people need',
    explain: 'Never block a public route with a stand or a wide array, and never leave stands unattended where people walk.',
    why: {
      'The view of the nearest window': 'A view is not the safety question; the way is.',
      'The sound of the nearest wall': 'A wall’s reflection is part of the place, not a safety question.',
    },
  },
  {
    id: 'sp.ctx.1',
    page: 'context',
    prompt: 'Two of the four Ambisonic tracks are swapped. What happens to a source?',
    options: ['It lands in the wrong direction', 'It gets louder by the swapped amount', 'Nothing: the converter sorts the tracks'],
    correct: 'It lands in the wrong direction',
    explain: 'The converter reads each track as the capsule its slot expects: a swap turns or tilts the field. Label the tracks from the mic’s manual and check with a test source.',
    why: {
      'It gets louder by the swapped amount': 'A swap moves the image; it does not change the level that way.',
      'Nothing: the converter sorts the tracks': 'The converter cannot know which capsule is on which track.',
    },
  },
  {
    id: 'sp.ctx.2',
    page: 'context',
    prompt: 'A file has four channels named “ambi”. What do you need before playing it?',
    options: ['Its channel order and convention, from its log', 'Nothing: four channels means first-order B-format', 'Only the sample rate of the file'],
    correct: 'Its channel order and convention, from its log',
    explain: 'FuMa and ambiX order and scale the channels differently. Never infer the format from “four channels” or a file name: read the metadata or the log.',
    why: {
      'Nothing: four channels means first-order B-format': 'Four channels could be A-format, FuMa or ambiX — or something else.',
      'Only the sample rate of the file': 'The rate matters, but the order and convention decide the picture.',
    },
  },
  {
    id: 'sp.ctx.3',
    page: 'context',
    prompt: 'At a live event, should the field array feed the local PA?',
    options: ['Keep it on its own path, to the stream only', 'Feed it in: it makes the PA sound more spacious', 'Feed it in, as long as it is at a low level'],
    correct: 'Keep it on its own path, to the stream only',
    explain: 'An open array near a PA hears the PA: fed back into it, it can make a feedback path. Keep it for the stream or the recording; use close mics for the PA.',
    why: {
      'Feed it in: it makes the PA sound more spacious': 'It brings the PA back into itself — a feedback path.',
      'Feed it in, as long as it is at a low level': 'A low level still closes the loop unless the routing and margin have been worked out.',
    },
  },
  {
    id: 'sp.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · What decides which spatial capture you use?',
    options: ['The destination: headphones, speakers, a turnable scene', 'The number of capsules that the mic’s case can hold', 'Which one of them is the newest and most expensive model'],
    correct: 'The destination: headphones, speakers, a turnable scene',
    explain: 'The listening setup comes first: each capture serves a destination, then is checked on it.',
    why: {
      'The number of capsules that the mic’s case can hold': 'More capsules is not a destination.',
      'Which one of them is the newest and most expensive model': 'A model is not a reason: the destination is.',
    },
  },
  {
    id: 'sp.two.1',
    page: 'twoMic',
    prompt: 'The close mic and the Ambisonic take sound smeared together. Why?',
    options: ['The close mic hears the singer milliseconds earlier', 'The array reverses the polarity of the singer’s voice', 'The close mic is louder, so the two simply cancel'],
    correct: 'The close mic hears the singer milliseconds earlier',
    explain: 'About 6 m apart, the arrivals differ by about 17 ms: summed as they are, they comb or sound doubled. Keep them as layers, or align on purpose and judge by ear.',
    why: {
      'The array reverses the polarity of the singer’s voice': 'Distance delays; it does not flip the sign.',
      'The close mic is louder, so the two simply cancel': 'Level changes the notches’ depth; the delay makes them.',
    },
  },
  polarityDelay('sp.two.2'),
  {
    id: 'sp.two.3',
    page: 'twoMic',
    prompt: 'You flip the close mic’s polarity and the blend with the array sounds fuller. What is a fair next step?',
    options: ['Match the levels, then compare both states in mono', 'Keep it inverted for this singer in all scenes', 'Set it back, as normal polarity is the right one'],
    correct: 'Match the levels, then compare both states in mono',
    explain: 'A fuller sum can fool the ear. Match the levels and compare both states — and remember the 17 ms between them stays whatever the polarity.',
    why: {
      'Keep it inverted for this singer in all scenes': 'Distances change from place to place: judge each one, at matched levels.',
      'Set it back, as normal polarity is the right one': 'Neither state is right by rule: compare them at matched levels.',
    },
  },
  {
    id: 'sp.two.4',
    page: 'twoMic',
    prompt: 'What is a fair way to use the array and the close mic together?',
    options: ['Separate layers on their own channels', 'One channel with both mixed at the source', 'Keep only the louder of the two'],
    correct: 'Separate layers on their own channels',
    explain: 'The array is the place; the close mic the voice. Kept apart, each can be judged and blended on purpose.',
    why: {
      'One channel with both mixed at the source': 'A blend made at the source cannot be undone.',
      'Keep only the louder of the two': 'Louder is not better: each layer has its own job.',
    },
  },
  {
    id: 'sp.prac.gain',
    page: 'practice',
    prompt: 'One of the four Ambisonic tracks peaks higher. What do you do?',
    options: ['Keep the four gains matched and linked', 'Turn that one track down on its own', 'Normalise each track separately afterwards'],
    correct: 'Keep the four gains matched and linked',
    explain: 'Identical preamps, the same gain on all four, changed together. One track turned down alone pulls the field away from it; set the linked gain for the loudest moment.',
    why: {
      'Turn that one track down on its own': 'Unmatched gain moves the image.',
      'Normalise each track separately afterwards': 'Never process the four raw tracks one by one.',
    },
  },
  {
    id: 'sp.prac.3',
    page: 'practice',
    prompt: 'What would justify a close mic beside the array?',
    options: ['A source that must be clear in the mix', 'More channels give more choice, so add one', 'The array needs more level than it has'],
    correct: 'A source that must be clear in the mix',
    explain: 'A close mic earns its place when a source — speech, a performer — must be clear: the array cannot isolate it. On its own channel, timed and judged by ear.',
    why: {
      'More channels give more choice, so add one': 'Each extra mic adds a layer to manage; it should earn its place.',
      'The array needs more level than it has': 'Level comes from gain, not from another mic.',
    },
  },
  {
    id: 'sp.mix.1',
    page: 'practice',
    prompt: 'A binaural take sounds great on headphones. Does that prove every listener hears direction accurately?',
    options: ['It is not proof: check the real destinations', 'It proves it: headphones are the true test', 'It proves it if the head was at a listener’s height'],
    correct: 'It is not proof: check the real destinations',
    explain: 'A pleasing headphone image is not proof of accurate direction for everyone. Check the actual headphones, speakers and downmixes, and record a plain stereo or mono where needed.',
    why: {
      'It proves it: headphones are the true test': 'Headphones are the main reference, not a proof for every listener.',
      'It proves it if the head was at a listener’s height': 'Height helps the point of view; it does not prove accuracy.',
    },
  },
  removeDelay('sp.mix.2'),
  {
    id: 'sp.mix.3',
    page: 'practice',
    prompt: 'Is a spatial field recording a calibrated measurement of the place?',
    options: ['It is not: a measurement needs its own method', 'It is, because the four capsules are matched', 'It is, once the gain of all four has been linked'],
    correct: 'It is not: a measurement needs its own method',
    explain: 'A spatial capture records a perceptual scene. A level or acoustic measurement needs a calibrated instrument, a defined method and an uncertainty statement.',
    why: {
      'It is, because the four capsules are matched': 'Matched capsules are not a calibrated measurement chain.',
      'It is, once the gain of all four has been linked': 'Linked gain keeps the picture right; it does not calibrate it.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'sp.sym.turned',
    observation: 'The front source plays back off to one side',
    firstChecks: 'Was the rig’s front to the scene front? Is the front logged? Are the tracks in order?',
    options: ['Check the rig’s front and the track order', 'Pan the whole mix back round to the centre again', 'Turn the front source up in the mix instead'],
    correct: 'Check the rig’s front and the track order',
    explain: 'A rig facing away, or two tracks swapped, turns the picture. Check the log and the channel map; a decoder can turn a correct field, not repair a wrong one.',
    why: {
      'Pan the whole mix back round to the centre again': 'Panning hides the cause; check the front and the map first.',
      'Turn the front source up in the mix instead': 'Level does not move a direction.',
    },
  },
  {
    id: 'sp.sym.wind',
    observation: 'Rumble on one capsule outdoors',
    firstChecks: 'Is every exposed capsule covered? Is the cover right for the rig? Is the stand vibrating?',
    options: ['Cover every capsule; check the stand', 'Cut all the low end on each of the channels', 'Turn that capsule’s gain down alone'],
    correct: 'Cover every capsule; check the stand',
    explain: 'Wind on one exposed capsule makes rumble. Cover the whole array without disturbing its spacing; a deep low cut can remove wanted low ambience.',
    why: {
      'Cut all the low end on each of the channels': 'A deep cut removes wanted low sound and leaves the cause.',
      'Turn that capsule’s gain down alone': 'Unmatched gain moves the image.',
    },
  },
  {
    id: 'sp.sym.lr',
    observation: 'The Double M/S decode has left and right swapped',
    firstChecks: 'Was the figure-8’s positive side marked the right way? Check with a walker.',
    options: ['Check the Side’s positive lobe in the decode', 'Swap the front and the rear Mid tracks around', 'Re-record it all with a wider array of mics'],
    correct: 'Check the Side’s positive lobe in the decode',
    explain: 'With the Side’s polarity the wrong way round, left and right swap. Mark the positive side before recording; flip it in the decode only once you have checked.',
    why: {
      'Swap the front and the rear Mid tracks around': 'That swaps front and rear, not left and right.',
      'Re-record it all with a wider array of mics': 'The capture is fine; the decode needs the Side’s polarity.',
    },
  },
  {
    id: 'sp.sym.lfe',
    observation: 'A 5.1 delivery booms with ambience on the subwoofer',
    firstChecks: 'Is a full-range field channel going to the LFE bus?',
    options: ['Take the field channel off the LFE', 'Turn the subwoofer down in the room', 'Add a sixth mic for the low end'],
    correct: 'Take the field channel off the LFE',
    explain: '“.1” is a separate low-frequency effects channel. Never send a full-range field channel to it.',
    why: {
      'Turn the subwoofer down in the room': 'That hides the routing error in one room only.',
      'Add a sixth mic for the low end': 'No mic is needed for “.1”.',
    },
  },
  {
    id: 'sp.sym.feedback',
    observation: 'Live: the PA rings when the field array is up',
    firstChecks: 'Lower the level at once. Is the array routed into the PA?',
    options: ['Lower it, then take the array off the PA', 'Turn the array up so that it covers the ringing', 'Move the array closer to the PA'],
    correct: 'Lower it, then take the array off the PA',
    explain: 'An array near the PA, fed into it, makes a feedback path. Lower the level, then keep the array on the stream path only. Never provoke feedback.',
    why: {
      'Turn the array up so that it covers the ringing': 'More gain feeds the loop.',
      'Move the array closer to the PA': 'Closer hears more of the PA.',
    },
  },
  hollowSymptom('sp.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'sp.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of an Ambisonic field recording in the order you would do them.',
    steps: [
      { text: 'Decide the destinations: headphones, a speaker layout, stereo, mono', early: 'Start with the deliverable.' },
      { text: 'Get permission; check the route, the weather and the ground', early: 'Permission and safety come before any setup.' },
      { text: 'Walk and listen; choose the listener’s point and the scene front', early: 'Choose the place once you know the job and the site.' },
      { text: 'Mount the mic upright, its front mark to the front, wind cover on', early: 'Mount it once the place is chosen.' },
      { text: 'Label the four tracks from the manual; match and link the gain', early: 'The tracks are set once the mic is mounted.' },
      { text: 'Record; log the front, the mounting, the gain and the order', early: 'Record once the channels are right.' },
      { text: 'Convert with its own converter; check every destination', early: 'Convert and check after recording.' },
    ],
    explain: 'A sensible order. Phantom power: mute the outputs first and follow the equipment’s manual. Gain: identical preamps, set on the loudest moment, linked.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'sp.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A headphone documentary walk through a market: one listener’s point of view, people moving round, a footpath.',
    setups: [
      { id: 'a', label: 'A binaural head at a listener’s height, clear of the path', ok: true, power: 'phantom', feedback: 'A suggested start for headphones — check the take on the headphones it is for.' },
      { id: 'b', label: 'An Ambisonic mic upright, its front logged, rendered binaurally', ok: true, power: 'phantom', feedback: 'A suggested start: turnable later, rendered for headphones — keep the four tracks right.' },
      { id: 'c', label: 'A wide spaced array set up across the footpath', ok: false, power: 'phantom', feedback: 'Never block a public route.' },
      { id: 'd', label: 'In-ear mics fitted to a passer-by without asking', ok: false, power: 'phantom', feedback: 'Informed consent first, always.' },
      { id: 'e', label: 'A single close mic on one stall holder', ok: false, power: 'phantom', feedback: 'A close mic is not a listener’s point of view.' },
    ],
    reasons: [
      { id: 'r.dest', label: 'The destination is headphones, so the capture serves them', role: 'required', feedback: 'Say what the listener hears it on.' },
      { id: 'r.clear', label: 'The stand is clear of the footpath and attended', role: 'required', feedback: 'Keeping the way clear is part of passing.' },
      { id: 'r.front', label: 'The front is faced and logged', role: 'optional', feedback: 'A fair reason.' },
      BRAND_REASON('field recording'),
      { id: 'r.more', label: 'More capsules always give a better result', role: 'wrong', feedback: 'More capsules is not a reason: the destination is.' },
    ],
    explain: 'Two setups pass. What passes is the reasoning: the destination first, a listener’s point of view, the way kept clear, consent asked.',
  },
  {
    id: 'sp.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · An outdoor concert streamed in surround and stereo, a PA either side of the stage, a singer who must be clear.',
    setups: [
      { id: 'a', label: 'An Ambisonic mic in the audience, plus a close mic on the singer', ok: true, power: 'phantom', feedback: 'A suggested start: the place and the voice as two layers — keep the array off the PA.' },
      { id: 'b', label: 'A five-channel array in the audience, plus close mics for the PA', ok: true, power: 'phantom', feedback: 'A suggested start for a surround stream — check the stereo and mono downmix.' },
      { id: 'c', label: 'The audience array fed into the PA for more space', ok: false, power: 'phantom', feedback: 'That makes a feedback path.' },
      { id: 'd', label: 'Only the array, the singer taken from it later', ok: false, power: 'phantom', feedback: 'No array isolates the singer later.' },
      { id: 'e', label: 'Track 4 of the Ambisonic mic sent to the LFE', ok: false, power: 'phantom', feedback: 'Never a full-range field channel in the LFE.' },
    ],
    reasons: [
      { id: 'r.paths', label: 'The stream and the PA are separate paths', role: 'required', feedback: 'Say how the array stays off the PA.' },
      { id: 'r.close', label: 'A close mic gives the clear voice the array cannot', role: 'required', feedback: 'Say how the singer stays clear.' },
      { id: 'r.check', label: 'The surround, stereo and mono versions are checked', role: 'optional', feedback: 'A fair reason.' },
      BRAND_REASON('concert stream'),
      { id: 'r.loud', label: 'Turn the array up until the crowd is louder', role: 'wrong', feedback: 'Level is not a reason; the balance is decided by layers.' },
    ],
    explain: 'Two setups pass. What passes is the reasoning: separate stream and PA paths, a close mic for the voice, every version checked.',
  },
];

const predictions: Lesson['predictions'] = {
  meet: { prompt: 'Before you move the walker: as it passes on the left, which ear hears it first?', options: ['The left ear', 'The right ear', 'Both at once'], after: 'Now move WALK and watch the readout.' },
  microphone: { prompt: 'Which system would you choose for a listener on headphones?', options: ['A binaural head', 'A spaced five-channel array', 'Either one'], after: 'Now step through each SYSTEM.' },
  placement: { prompt: 'Predict: you move the rig 4 m toward the singer. What changes?', options: ['More singer, less square', 'More square', 'It depends on the place'], after: 'Rest the rig in two zones and read what each one suggests.' },
  twoMic: { prompt: 'If you flip the close mic’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'meet',
    prompt: 'What do you decide before choosing a spatial mic?',
    options: ['The destination and the listener’s point', 'The number of capsules to bring along to the site', 'The level of the loudest source in the place'],
    correct: 'The destination and the listener’s point',
    explain: 'The listening setup comes before the recording setup.',
    why: { 'The number of capsules to bring along to the site': 'Capsules serve a destination; decide that first.', 'The level of the loudest source in the place': 'Level is set with gain later.' },
  },
  {
    id: 'q.2',
    covers: 'meet',
    prompt: 'Can an Ambisonic capture later isolate one voice in a crowd?',
    options: ['It cannot: record a close mic for a clear voice', 'It can: the converter separates out the sources', 'It can, with enough capsules on the one mic'],
    correct: 'It cannot: record a close mic for a clear voice',
    explain: 'A spatial mic hears everything at its place; first order is enveloping, not separating.',
    why: { 'It can: the converter separates out the sources': 'The converter makes a field, not separate sources.', 'It can, with enough capsules on the one mic': 'Capsules give direction, not isolation.' },
  },
  {
    id: 'q.3',
    covers: 'meet',
    prompt: 'Which way does a spatial rig’s front point?',
    options: ['To the scene front, logged', 'At the loudest source, wherever it is', 'Toward the nearest wall'],
    correct: 'To the scene front, logged',
    explain: 'The rig’s front is the listener’s front: face it to the scene front and write it down.',
    why: { 'At the loudest source, wherever it is': 'The front follows the listener, not the loudest thing.', 'Toward the nearest wall': 'A wall is not a front.' },
  },
  {
    id: 'q.4',
    covers: 'setups',
    critical: true,
    prompt: 'You hear thunder during an outdoor take. When can you go back out?',
    options: ['30 minutes after the last lightning or thunder', 'As soon as the rain has stopped falling there', 'When the thunder starts to sound farther away'],
    correct: '30 minutes after the last lightning or thunder',
    explain: 'Get inside a safe place at once; wait 30 minutes after the last lightning or thunder.',
    why: { 'As soon as the rain has stopped falling there': 'Lightning can strike after the rain.', 'When the thunder starts to sound farther away': 'A distant storm can still strike.' },
  },
  {
    id: 'q.5',
    covers: 'setups',
    critical: true,
    prompt: 'How far must stands and mics stay from an overhead power line?',
    options: ['At least 3 m (10 ft), farther if unsure', 'About 1 m, as long as nothing is touching', 'Closer is fine for a short stand'],
    correct: 'At least 3 m (10 ft), farther if unsure',
    explain: 'At least 3 m (10 ft) — farther if you do not know the voltage.',
    why: { 'About 1 m, as long as nothing is touching': 'Electricity can jump a gap.', 'Closer is fine for a short stand': 'A stand can be raised or tipped.' },
  },
  {
    id: 'q.6',
    covers: 'setups',
    prompt: 'The best spot is on a public footpath. What do you do?',
    options: ['Choose a place clear of the route', 'Set up there anyway and guard the stand', 'Use a compact rig so that it fits there'],
    correct: 'Choose a place clear of the route',
    explain: 'Never block a public route with a stand or an array.',
    why: { 'Set up there anyway and guard the stand': 'Guarding it still blocks the way.', 'Use a compact rig so that it fits there': 'Any stand in the way blocks it.' },
  },
];

export const F10_LESSON: Lesson = {
  id: 'F10',
  labId: 'field',
  title: 'Spatial and Specialist Field Pickup',
  subtitle: 'The listener’s point first: a binaural head, an Ambisonic mic, a five-channel array — and the channel map that keeps them right',
  noun: { one: 'outdoor scene', many: 'outdoor scenes', subject: 'the scene' },
  model: F10_MODEL,
  micTypeIds: ['spHead', 'spFoa', 'spDms'],
  zones: F10_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Spatial pickup records a place as a listener there would hear it — sounds in front, at the sides and behind — for headphones, a surround speaker layout or a scene that can be turned and rendered later.', src: 'LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'Field recording, ambience for film and games, immersive and virtual-reality sound, broadcasts of events: a binaural head, a four-capsule Ambisonic mic, a surround array, a Double M/S rig.', src: 'LESSON' },
    { title: 'THE DELIVERABLE FIRST', text: 'Each method solves a different delivery problem. Decide what the listener will hear it on — and where they are — before the mic goes up.', src: 'LESSON' },
    { title: 'WHAT IT IS NOT', text: 'No spatial array isolates one distant source, and none is a calibrated measurement. Record a close mic beside it when a source must be clear. Experimentation is encouraged — walk, listen, and use your ears and the place.', src: 'LESSON' },
  ],
  sound: {
    stages: [
      { title: 'From every side', text: 'Sound reaches the listener’s point from the front source, the moving walker, the wall behind and the traffic beyond — each from its own direction.' },
      { title: 'Two ears, one head', text: 'The ear nearer a sound hears it a little earlier and louder; the outer ears shape it by direction. These cues tell a listener where things are.' },
      { title: 'The place itself', text: 'Reflections arrive milliseconds after the direct sound. A spatial capture keeps the place — and everything in it.' },
    ],
    attack: 'Short sounds — a footstep, a door — show direction most clearly.',
    body: 'Continuous sounds — a fountain, traffic, a crowd — make the surrounding bed of the place.',
    head: { diameterMm: 0, rods: 0, label: 'the listener’s point', strikeSrc: 'LESSON' },
  },
  setting: {
    items: [
      { id: 'traffic', label: 'traffic and wind', short: 'TRAFFIC · WIND', note: 'What reaches the place stays in the capture. Cover every exposed capsule against wind; a windscreen is not waterproofing.', prov: { kind: 'illustrative', reason: 'the lesson L6, L39' }, tag: 'SPILL', scene: 'all' },
      { id: 'walls', label: 'walls and hard surfaces', short: 'REFLECTIONS', note: 'They return the scene a few milliseconds late — part of the place. Note them in the log.', prov: { kind: 'illustrative', reason: 'the lesson L6' }, tag: 'ROOM SOUND', scene: 'all' },
      { id: 'speech', label: 'conversations nearby', short: 'PEOPLE', note: 'Speech that may be recognised needs the right permission for the place and the use.', prov: { kind: 'illustrative', reason: 'the lesson L6, L43' }, tag: 'PRIVACY', scene: 'all' },
      { id: 'route', label: 'the public footpath', short: 'THE WAY', note: 'Never block it with a stand or a wide array; never leave stands unattended where people walk.', prov: { kind: 'illustrative', reason: 'the lesson L43' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'pa', label: 'the PA at an event', short: 'PA', note: 'An open array near a PA hears it; fed back into it, a feedback path. Keep the array on the stream path.', prov: { kind: 'illustrative', reason: 'the lesson L41' }, tag: 'FEEDBACK', scene: 'stage' },
    ],
    stage: 'An array near a PA hears the PA: keep it out of local reinforcement unless the routing and the margin before feedback have been worked out; close mics for the PA; the stream checked in surround, stereo and mono, in time with the picture.',
    studio: 'Keep the raw channels and a record of the channel map, gain, mounting, front, converter and output convention; store renders separately; check every destination the job asks for.',
  },
  diagnostic,
  practice: {
    task: 'Choose a spatial setup for a headphone walk and for a surround stream, describe an alternative, and explain what would justify a close mic. With a real place and permission, you can record what you tried below.',
    fields: [
      { id: 'site', label: 'Site and permission', kind: 'text' },
      { id: 'capture', label: 'Capture', kind: 'choice', choices: ['binaural head', 'Ambisonic mic', 'Double M/S', 'five-channel array', 'other'] },
      { id: 'pos', label: 'Position, front and channel map', kind: 'text' },
      { id: 'dest', label: 'Destination, translation and limitation', kind: 'text' },
      { id: 'safety', label: 'Wind, weather and stand safety', kind: 'text' },
      { id: 'routing', label: 'Converter, output convention, stream and PA routing', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The ground under the listener’s point is the frame’s origin; the listener heights (1.7 m standing, 1.2 m seated) are a sound-system maker’s measurement-mic convention.', dims: [] },
    { text: 'The square, the singer, the walker’s path, the wall, the stage and the PA — places and sizes are drawing defaults.', dims: [] },
    { text: 'Every array spacing with no source (the five-channel array, the small and the wide squares) is drawn as an example layout, never a number; the model head’s ear spacing (150 mm) and the Ambisonic capsules’ radius (15 mm) are drawing defaults.', dims: [] },
    { text: 'The A-to-B conversion and the capsules’ cardioid shape in the drill are a simplified picture; a real converter corrects each capsule.', dims: [] },
    { text: 'The walker’s cues are straight paths with the speed of sound from the calculator; head shadow is said, not drawn.', dims: [] },
  ],
  live: { wedges: [] },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. Every place and listener is different: walk, listen, experiment, and trust your ears and the place. The lab is silent and draws a simplified picture: example scenes, example array layouts with no spacing claimed, the four-track conversion and capsule patterns as textbook shapes. Heights are read from the ground. Safety is exact: at least 3 m (10 ft) from overhead power lines, and 30 minutes after the last lightning or thunder. A spatial recording is not a calibrated measurement.',
  copy: F10_COPY,
};
