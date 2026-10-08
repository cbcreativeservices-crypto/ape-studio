/**
 * B08 BROADCAST AUDIENCE AND EVENT SPACE — the lesson as DATA, written to the
 * 2026-10-07 journey (MEET IT and STARTING SETUPS given here). Words from the
 * owner's lesson (docs/labs/miking/source_text/B08-Broadcast-Audience-and-
 * Event-Space-Miking-Technique.txt; "L<n>" in comments only); research in
 * docs/labs/miking/audience_ambience/; corrections in CORRECTIONS_LOG.md
 * "L7G3": the institutional words gone (B-INST: L2, L47 → "you", an optional
 * placement card), no in-app link (B-XLINK: L66 "later sports sound pickup"
 * — not linked; the other cross-links said in words), no brand or model on
 * screen (L12–L36: the makers become types). Safety exact and plain: crowd
 * mics never into the main PA, never an audience mic opened into the PA to
 * make feedback, nothing flown over people without a qualified rigger,
 * stands and cables outside exits and aisles. Owner ruling 2026-10-04:
 * suggested starting points, no sources, brands or badges on screen. FULLY
 * SILENT.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, polarityDelay } from '../shared/bowed/bowedItems.ts';
import { removeDelayVoice } from '../shared/broadcast/sportItems.ts';
import { B08_MODEL } from './geometry.ts';
import { B08_ZONES } from './model.ts';
import { B08_COPY } from './copy.ts';

const pages: LessonPages = {
  meet: {
    title: 'Meet it — where the sound comes from',
    goal: 'Meet an audience from a microphone’s point of view: where the people, the PA, the cameras and the routes are, and why one nearby person can drown out a whole section.',
    credit: { scenarios: ['b8.meet.1', 'b8.meet.2', 'b8.meet.3'], note: 'Answer the three checks on the nearest seat, the PA and the routes.' },
    takeaway: 'The sound comes from everywhere in the seats; the PA covers the same seats. A crowd mic starts raised and aimed at the faces, so the section arrives together and the PA sits off its front.',
  },
  setups: {
    title: 'Starting setups',
    goal: 'See real starting setups drawn on a studio audience and a larger event — one crowd mic, an XY pair, a spaced pair over the hall, two zones, a zone per section — then what to settle before any mic goes up.',
    credit: { scenarios: ['b8.set.1', 'b8.set.2', 'b8.set.3'], interactive: 'setupsSeen', note: 'Look at every main setup on the drawing, and answer the three checks.' },
    takeaway: 'Start from the fewest zones the brief needs, each raised on an approved place, aimed at faces, the PA off its front — and every crowd mic on its own path to the broadcast, never the PA.',
  },
  microphone: {
    title: 'The coverage methods',
    goal: 'Choose how to cover an audience by what each method gives and what limits it — one mono mic, two zones, a coincident pair, a spaced pair, a surround or Ambisonic mic — not by a label.',
    credit: { scenarios: ['b8.mic.1', 'b8.mic.2', 'b8.mic.3', 'b8.rec.1'], note: 'Answer the four checks (one reaches back to the venue).' },
    takeaway: 'Mono is simplest and gives no width; two zones are not a stereo pair; XY sums to mono predictably; spaced pairs comb in mono; surround and Ambisonic mics are different formats, each with its own front.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and work the crowd mic yourself on the studio plan — where on the approved places, how high, where it aims — and see the faces and the PA change.',
    credit: { scenarios: ['b8.place.1', 'b8.place.2', 'b8.place.3', 'b8.rec.2'], interactive: 'twoZones', note: 'Rest the mic, on an approved place, in two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'On an approved place, raised, aimed at the faces of a section: change one thing at a time — the place, the height, the aim — and never into an aisle, an exit or the space over people unless a rigger hung it.',
  },
  context: {
    title: 'Live checks',
    goal: 'Aim a crowd mic at the faces with the PA toward its rejection — then route the crowd mics to the broadcast and the recording, never the PA, and give the audience question its own close mic.',
    credit: { scenarios: ['b8.ctx.1', 'b8.ctx.2', 'b8.ctx.3', 'b8.rec.3'], interactive: 'liveChecks', note: 'Put the PA well toward the crowd mic’s rejection with the faces in front, then answer the four checks.' },
    takeaway: 'Faces in front, the PA toward the back of the pattern; the crowd mics on their own broadcast paths; the question on a close mic. A pattern’s label never removes a loudspeaker.',
  },
  twoMic: {
    title: 'A pair or two zones',
    goal: 'Two zone mics hear the same laugh at different times: watch the delay and the comb change as it moves across the seats, and see why a coincident pair does not.',
    credit: { scenarios: ['b8.two.1', 'b8.two.2', 'b8.two.3'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND walk the source, then answer the three checks.' },
    takeaway: 'Two zones are not a stereo pair: the delay changes from seat to seat, so no single time alignment fixes it. Check the mono sum; polarity is not time alignment.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the place, the aim, the PA’s angle, the routing and the mono sum first — then reach for EQ.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put an audience setup in order, choose and justify setups for a studio audience and an arena event, and say what would justify another zone.',
    credit: { scenarios: ['b8.prac.order', 'b8.prac.gain', 'b8.prac.setup1', 'b8.prac.setup2', 'b8.prac.3', 'b8.mix.1', 'b8.mix.2', 'b8.mix.3'], note: 'Put the setup in order, answer the gain check, complete both briefs, and answer the four reasoning cards. The placement card is optional — it needs a real venue.' },
    takeaway: 'A crowd-led pickup for the brief, the PA and the nearest seat named, a stereo pair told from two zones, the mono output checked, and the audience question on its own path. More than one setup can pass.',
  },
};

/* THE CHECKS. Lesson lines in comments only: b8.meet.* L6–L8, L23–L24 ·
 * b8.set.* L37–L40 · b8.mic.* L12–L25, L35–L36 · b8.place.* L23–L24, L27 ·
 * b8.ctx.* L23, L27–L28, L31 · b8.two.* L19, L32 · b8.prac.* / b8.mix.*
 * L39–L46. */
const scenarios: MikingScenario[] = [
  {
    id: 'b8.meet.1',
    page: 'meet',
    prompt: 'A crowd mic hangs low, just over the front row. What is it likely to favour?',
    options: ['The nearest few people in the front row', 'The middle of the section, evenly', 'The back rows, because there are more of them'],
    correct: 'The nearest few people in the front row',
    explain: 'Low, the front row is much nearer than everyone else: one clapper or talker can be several dB louder than the middle. Raised and a little in front, the section arrives together.',
    why: {
      'The middle of the section, evenly': 'The middle is farther away than the front row: it arrives quieter.',
      'The back rows, because there are more of them': 'More people farther away still arrive quieter than the nearest few.',
    },
  },
  {
    id: 'b8.meet.2',
    page: 'meet',
    prompt: 'The PA is aimed at the seats. What does that mean for a crowd mic over those seats?',
    options: ['It hears the PA as well as the people', 'It hears only the people below it', 'It is kept safe from feedback by its height'],
    correct: 'It hears the PA as well as the people',
    explain: 'The PA covers the very places the audience sits. Put the PA well off the crowd mic’s front, and keep the crowd mic out of the PA.',
    why: {
      'It hears only the people below it': 'Sound from the PA reaches it too, directly and reflected.',
      'It is kept safe from feedback by its height': 'Routed into the PA, a distant audience mic can feed back.',
    },
  },
  {
    id: 'b8.meet.3',
    page: 'meet',
    prompt: 'The best-sounding spot for a crowd mic stand is in the side aisle. What do you do?',
    options: ['Keep the aisle clear; use an approved place', 'Use it, with the cable taped to the floor', 'Use it for the show, then move it at the end'],
    correct: 'Keep the aisle clear; use an approved place',
    explain: 'Stands and cables stay outside aisles, exits and walkways. A good sound never justifies blocking a route.',
    why: {
      'Use it, with the cable taped to the floor': 'Tape does not clear the aisle: the stand still blocks it.',
      'Use it for the show, then move it at the end': 'The aisle must be clear during the show, when people use it.',
    },
  },
  {
    id: 'b8.set.1',
    page: 'setups',
    prompt: 'A crowd mic would sound best hung over the middle of the seats. Who may hang it?',
    options: ['A qualified rigger, with approved hardware', 'Anyone at all, as long as it is tied on with care', 'The audio crew, if the venue is quiet'],
    correct: 'A qualified rigger, with approved hardware',
    explain: 'Nothing is flown or hung above people without a qualified rigger and approved hardware.',
    why: {
      'Anyone at all, as long as it is tied on with care': 'Care is not a qualification: a falling mic over people is a serious hazard.',
      'The audio crew, if the venue is quiet': 'A quiet venue changes nothing about rigging over people.',
    },
  },
  {
    id: 'b8.set.2',
    page: 'setups',
    prompt: 'The presenter wants the crowd mics in the PA “to make the room feel bigger.” What do you say?',
    options: ['They go to broadcast and record only', 'They can go in at a low level for the room', 'They can go in during the loudest applause'],
    correct: 'They go to broadcast and record only',
    explain: 'Keep crowd mics out of the main PA: a distant audience mic in nearby loudspeakers can feed back, and it will not make a question intelligible.',
    why: {
      'They can go in at a low level for the room': 'Even low, a distant mic in nearby loudspeakers can feed back.',
      'They can go in during the loudest applause': 'Feedback does not wait for the applause to start.',
    },
  },
  {
    id: 'b8.set.3',
    page: 'setups',
    prompt: 'Why start with the fewest audience zones the brief needs?',
    options: ['Each zone is a channel to monitor and blend', 'More zones would make the PA louder there', 'One single zone can stand in for all the sections'],
    correct: 'Each zone is a channel to monitor and blend',
    explain: 'Select the minimum useful zones, name each by location, and build the blend from independently monitored inputs. An arena may need several; a studio, one or two.',
    why: {
      'More zones would make the PA louder there': 'Zones do not drive the PA: crowd mics stay out of it.',
      'One single zone can stand in for all the sections': 'In a large venue one capsule cannot represent every section.',
    },
  },
  {
    id: 'b8.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Why raise a crowd mic above and a little in front of a section?',
    options: ['So the section arrives at about the same level', 'So that it hears the stage more than the seats', 'So that the cameras can see it more clearly'],
    correct: 'So the section arrives at about the same level',
    explain: 'Raised, the front row is not much nearer than the middle: no single person dominates.',
    why: {
      'So that it hears the stage more than the seats': 'It is there for the audience, aimed at faces, not the stage.',
      'So that the cameras can see it more clearly': 'A crowd mic stays out of the pictures where it can.',
    },
  },
  {
    id: 'b8.mic.1',
    page: 'microphone',
    prompt: 'Two crowd mics stand far apart, one each side of the stage. What are they?',
    options: ['Two zones, not a coherent pair', 'A stereo pair, as two mics make one', 'A stereo pair, once level-matched'],
    correct: 'Two zones, not a coherent pair',
    explain: 'Two distant zone mics hear different local events at different times. The image can wander and the mono sum can colour — check each one and the sum.',
    why: {
      'A stereo pair, as two mics make one': 'Two channels are not a stereo image: the geometry decides.',
      'A stereo pair, once level-matched': 'Matching levels does not remove the timing differences between them.',
    },
  },
  {
    id: 'b8.mic.2',
    page: 'microphone',
    prompt: 'The program goes out in mono as well as stereo. Which pair is the most predictable?',
    options: ['A coincident XY pair', 'A spaced pair of omnis', 'Two zones far apart'],
    correct: 'A coincident XY pair',
    explain: 'In XY both capsules hear each source at the same moment, so the mono sum is predictable. Spaced capsules comb when summed: check the downmix.',
    why: {
      'A spaced pair of omnis': 'Spaced capsules hear a source at different times: the mono sum combs.',
      'Two zones far apart': 'Far apart, the timing differences are larger still.',
    },
  },
  {
    id: 'b8.mic.3',
    page: 'microphone',
    prompt: 'A five-capsule surround mic and a four-capsule Ambisonic mic: how do their signals compare?',
    options: ['Different formats, each with its own front', 'The same signals under different names', 'Both give five ready-made loudspeaker feeds'],
    correct: 'Different formats, each with its own front',
    explain: 'A surround mic gives one channel per loudspeaker of a five-channel layout; an Ambisonic mic gives four matched capsule tracks for its maker’s conversion. Keep each one’s orientation and channel identity.',
    why: {
      'The same signals under different names': 'Four capsule tracks are not five loudspeaker channels.',
      'Both give five ready-made loudspeaker feeds': 'The Ambisonic mic’s four tracks need the maker’s conversion first.',
    },
  },
  {
    id: 'b8.place.1',
    page: 'placement',
    prompt: 'Where can one crowd mic start, as an idea?',
    options: ['Raised over the section’s front, at the faces', 'On the stage’s edge, aimed back at the stage', 'Low in the front row, aimed up at the ceiling'],
    correct: 'Raised over the section’s front, at the faces',
    explain: 'After our research, above and somewhat in front of a representative section, aimed at the faces with the PA off its front, is a place to begin — then listen and adjust.',
    why: {
      'On the stage’s edge, aimed back at the stage': 'Aimed at the stage it hears the show and the PA, not the people.',
      'Low in the front row, aimed up at the ceiling': 'Low, the nearest people dominate; at the ceiling, the room.',
    },
  },
  {
    id: 'b8.place.2',
    page: 'placement',
    prompt: 'One person laughing right under the crowd mic dominates it. A fair first step?',
    options: ['Raise or move it to another section', 'Turn the whole crowd channel down', 'Ask that person to laugh more quietly'],
    correct: 'Raise or move it to another section',
    explain: 'Try another section or height if one spectator, a clap right under the mic, the stage wash or the seats moving dominates.',
    why: {
      'Turn the whole crowd channel down': 'Lower gain keeps the same balance, just quieter.',
      'Ask that person to laugh more quietly': 'The audience is the audience: move the mic.',
    },
  },
  {
    id: 'b8.place.3',
    page: 'placement',
    prompt: 'The crowd mic hears a lot of PA. What do you try before reaching for EQ?',
    options: ['Move or re-aim the mic away from the PA', 'Cut the mid frequencies of the crowd mic', 'Turn the PA up to cover the problem'],
    correct: 'Move or re-aim the mic away from the PA',
    explain: 'Move or re-aim to reduce loudspeaker dominance before trying to fix it with EQ.',
    why: {
      'Cut the mid frequencies of the crowd mic': 'EQ also cuts the audience: fix the geometry first.',
      'Turn the PA up to cover the problem': 'A louder PA puts more of it into the crowd mic.',
    },
  },
  {
    id: 'b8.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Where may a crowd mic stand go in this hall?',
    options: ['Only on an approved place, out of the aisles', 'Anywhere the sound is best for the mic', 'In an aisle, if the show is a short one tonight'],
    correct: 'Only on an approved place, out of the aisles',
    explain: 'Only approved places: aisles, exits and walkways stay clear.',
    why: {
      'Anywhere the sound is best for the mic': 'A good sound does not approve a place.',
      'In an aisle, if the show is a short one tonight': 'A short show still needs clear aisles.',
    },
  },
  {
    id: 'b8.ctx.1',
    page: 'context',
    prompt: 'A cardioid crowd mic hears the PA strongly. Where should the PA sit against its pattern?',
    options: ['Toward its back, the faces in front', 'Straight in front, the faces behind', 'Beside it, square to its front'],
    correct: 'Toward its back, the faces in front',
    explain: 'Aim at the faces with the PA well toward the pattern’s rejection — and remember the room reflects the PA from every side.',
    why: {
      'Straight in front, the faces behind': 'Then it hears the PA first and the people last.',
      'Beside it, square to its front': 'At the side a cardioid still hears about half as much.',
    },
  },
  {
    id: 'b8.ctx.2',
    page: 'context',
    prompt: 'An audience member asks a question. What makes it clear on the stream?',
    options: ['A close question mic routed to the stream', 'The crowd mics turned up for the question', 'The presenter repeating it into the PA'],
    correct: 'A close question mic routed to the stream',
    explain: 'A distant ambience mic will not make a question intelligible: give the questioner a close handheld or aisle mic, routed to every feed.',
    why: {
      'The crowd mics turned up for the question': 'Far from the questioner, they bring up the room, not the words.',
      'The presenter repeating it into the PA': 'That helps the room, not the stream’s copy of the question.',
    },
  },
  {
    id: 'b8.ctx.3',
    page: 'context',
    prompt: 'An outdoor event, a steady breeze across the crowd mic. A fair first step?',
    options: ['A designed windshield on a secure mount', 'A strong high-pass filter on the mic', 'The bare mic, turned to face straight into the wind'],
    correct: 'A designed windshield on a secure mount',
    explain: 'A foam is for light wind; stronger exposure may need a designed windshield, on a secure mount within the mic’s weather rating. Wind can overload before a filter helps.',
    why: {
      'A strong high-pass filter on the mic': 'A blanket filter removes useful crowd low end and cannot undo overload.',
      'The bare mic, turned to face straight into the wind': 'Wind straight on a bare capsule is the worst case.',
    },
  },
  {
    id: 'b8.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Low over the front row, one clapper dominates. What helps most?',
    options: ['Raising the mic above the section', 'A stronger pattern on the same mic', 'Turning the channel up for the others'],
    correct: 'Raising the mic above the section',
    explain: 'Height evens the distances to the section: the nearest person is no longer so much nearer than the middle.',
    why: {
      'A stronger pattern on the same mic': 'The clapper is in front of the mic: a pattern cannot reject them.',
      'Turning the channel up for the others': 'Gain lifts the clapper just as much.',
    },
  },
  {
    id: 'b8.two.1',
    page: 'twoMic',
    prompt: 'A laugh at one side reaches two zone mics. Why does the mono sum sound hollow?',
    options: ['It reaches the far mic a few ms later', 'One mic reverses the laugh’s polarity', 'The near mic is louder, so it cancels'],
    correct: 'It reaches the far mic a few ms later',
    explain: 'One sound, two arrival times: summed, some pitches cancel. The delay depends on where the sound is, so it differs from seat to seat.',
    why: {
      'One mic reverses the laugh’s polarity': 'Distance delays a sound; it does not flip its sign.',
      'The near mic is louder, so it cancels': 'Level changes the depth of the notches; the delay makes them.',
    },
  },
  polarityDelay('b8.two.2'),
  {
    id: 'b8.two.3',
    page: 'twoMic',
    prompt: 'You time-align two distant zone mics to one laugh. Where does that alignment hold?',
    options: ['At that one seat only', 'Across the whole section', 'Wherever the crowd is loudest'],
    correct: 'At that one seat only',
    explain: 'Alignment is right for one source position only. With an audience spread over the seats, do not time-align blindly: listen to the blend and the mono sum.',
    why: {
      'Across the whole section': 'The next laugh comes from another seat, with another delay.',
      'Wherever the crowd is loudest': 'Loudness does not change the paths: the delay is set by where the sound starts.',
    },
  },
  {
    id: 'b8.prac.gain',
    page: 'practice',
    prompt: 'The crowd channel clips on the biggest cheer. What should have been done first?',
    options: ['Gain set with room for the loudest moment', 'A limiter added afterwards to save the take', 'The crowd mic placed nearer the seats'],
    correct: 'Gain set with room for the loudest moment',
    explain: 'Leave headroom for a sudden cheer or a clap right under the mic, and lower headphone gain before testing the loudest moment.',
    why: {
      'A limiter added afterwards to save the take': 'Clipping at the input cannot be undone afterwards.',
      'The crowd mic placed nearer the seats': 'Nearer makes the loudest moments louder still.',
    },
  },
  {
    id: 'b8.prac.3',
    page: 'practice',
    prompt: 'What would justify another audience zone?',
    options: ['A section the others do not represent', 'More level for the whole audience at once', 'A wider image from more open mics'],
    correct: 'A section the others do not represent',
    explain: 'Add a zone for a part of the audience no other mic carries — named by location and monitored on its own.',
    why: {
      'More level for the whole audience at once': 'Level comes from gain and placement, not more mics.',
      'A wider image from more open mics': 'More open zones add timing differences, not a coherent image.',
    },
  },
  {
    id: 'b8.mix.1',
    page: 'practice',
    prompt: 'A crowd mic sounds spacious alone but smears the speech in the mix. Why?',
    options: ['It adds late copies of the PA’s speech', 'Its pattern is too narrow for the room', 'Its cable run is longer than all the others'],
    correct: 'It adds late copies of the PA’s speech',
    explain: 'Check each channel in solo and in context: a crowd mic can add delayed PA copies of speech or music to the main mix.',
    why: {
      'Its pattern is too narrow for the room': 'A narrower pattern hears less of the PA, not more: the late PA copies are the smear.',
      'Its cable run is longer than all the others': 'Cable length does not delay sound you can hear.',
    },
  },
  {
    id: 'b8.mix.2',
    page: 'practice',
    prompt: 'Which output do you check before the event, besides stereo?',
    options: ['The mono output, by ear', 'Only the loudest channel', 'Only the surround layout'],
    correct: 'The mono output, by ear',
    explain: 'Evaluate headphones, stereo loudspeakers and the actual mono path: a pair or two zones can colour the mono sum.',
    why: {
      'Only the loudest channel': 'One channel tells you nothing about the sum.',
      'Only the surround layout': 'Optional deliverables never replace the mono and stereo check.',
    },
  },
  removeDelayVoice('b8.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'b8.sym.one',
    observation: 'One person’s laugh dominates the audience',
    firstChecks: 'How high is the mic? Who sits right under it?',
    options: ['Raise it, or move to another section', 'Turn the crowd channel right down', 'Add EQ to cut out that one person’s laugh'],
    correct: 'Raise it, or move to another section',
    explain: 'Height evens the distances; another section or height avoids one nearby person.',
    why: {
      'Turn the crowd channel right down': 'The balance inside the channel stays the same.',
      'Add EQ to cut out that one person’s laugh': 'EQ cannot pick out one person.',
    },
  },
  {
    id: 'b8.sym.pa',
    observation: 'The crowd mic is mostly PA',
    firstChecks: 'Where is the PA against its pattern? Is it aimed at faces?',
    options: ['Re-aim at faces, the PA toward the back', 'Cut the crowd mic’s mids to remove it', 'Raise the PA so the crowd sounds smaller'],
    correct: 'Re-aim at faces, the PA toward the back',
    explain: 'Move or re-aim before EQ: faces in front, the PA toward the rejection.',
    why: {
      'Cut the crowd mic’s mids to remove it': 'EQ cuts the audience with the PA.',
      'Raise the PA so the crowd sounds smaller': 'A louder PA puts more of it in the mic.',
    },
  },
  {
    id: 'b8.sym.feedback',
    observation: 'The PA rings when the crowd mics come up',
    firstChecks: 'Lower the level at once. Are the crowd mics routed into the PA?',
    options: ['Lower it; take crowd mics out of the PA', 'Keep them in and turn the PA louder', 'Swap all of the crowd mics for omni mics'],
    correct: 'Lower it; take crowd mics out of the PA',
    explain: 'Crowd mics go to broadcast and record only. Never open an audience mic into the PA to make feedback.',
    why: {
      'Keep them in and turn the PA louder': 'More gain feeds the loop.',
      'Swap all of the crowd mics for omni mics': 'Omnis hear the PA from every side: feedback sooner.',
    },
  },
  {
    id: 'b8.sym.mono',
    observation: 'The audience sounds hollow on the mono feed',
    firstChecks: 'Two zones or a spaced pair summed? Listen to one channel alone.',
    options: ['Check the sum; use one channel or XY', 'Flip one zone’s polarity for good', 'Boost the low end on both of the channels'],
    correct: 'Check the sum; use one channel or XY',
    explain: 'For mono, one crowd mic or one channel of a spaced pair can be clearer than an unchecked sum; XY keeps a stable centre.',
    why: {
      'Flip one zone’s polarity for good': 'Polarity cannot remove the delays between distant mics.',
      'Boost the low end on both of the channels': 'EQ cannot fill a comb’s notches.',
    },
  },
  {
    id: 'b8.sym.question',
    observation: 'Viewers cannot hear the audience questions',
    firstChecks: 'Is there a close question mic? Is it routed to the stream?',
    options: ['A close question mic routed to the stream', 'Turn the crowd mics up during questions', 'Ask the presenter to speak much louder for it'],
    correct: 'A close question mic routed to the stream',
    explain: 'An ambience mic is not a question mic: give the questioner a close mic and route it to every feed.',
    why: {
      'Turn the crowd mics up during questions': 'They bring up the room, not the words.',
      'Ask the presenter to speak much louder for it': 'The missing voice is the questioner’s.',
    },
  },
  {
    id: 'b8.sym.wind',
    observation: 'Rumble on the outdoor crowd mic',
    firstChecks: 'What wind protection is on it? Is the mount secure?',
    options: ['A designed windshield, a secure mount', 'A blanket high-pass on all the channels', 'Turn the crowd mic into the wind'],
    correct: 'A designed windshield, a secure mount',
    explain: 'A foam is for light wind; stronger exposure needs a designed windshield. Wind can overload before a filter helps.',
    why: {
      'A blanket high-pass on all the channels': 'It removes useful crowd low end and cannot undo overload.',
      'Turn the crowd mic into the wind': 'Straight into the wind is the worst place.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'b8.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of an audience setup in the order you would do them.',
    steps: [
      { text: 'List what the remote listener needs from the room', early: 'Start with what the broadcast needs.' },
      { text: 'Walk the venue: the PA, the sections, routes, cameras', early: 'Map the venue once the need is known.' },
      { text: 'Choose the fewest zones and their approved places', early: 'Choose zones once the venue is mapped.' },
      { text: 'Mount them safely; route them to broadcast only', early: 'Mount and route once the places are chosen.' },
      { text: 'Rehearse quiet speech, applause and the full PA', early: 'Rehearse once the mics are routed.' },
      { text: 'Check the mono sum and write the placement card', early: 'Check the outputs last.' },
    ],
    explain: 'A sensible order. Nothing over people without a qualified rigger; never open an audience mic into the PA to make feedback.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'b8.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A studio audience of about sixty, one section, a PA at the stage’s corners, a stereo stream that is also heard in mono.',
    setups: [
      { id: 'a', label: 'An XY pair raised over the section’s front, aimed at faces', ok: true, power: 'phantom', feedback: 'A recommended start: width, a predictable mono sum — check the PA in its middle.' },
      { id: 'b', label: 'One mono crowd mic raised and aimed at faces', ok: true, power: 'phantom', feedback: 'A fair start: simple and mono-safe — no width.' },
      { id: 'c', label: 'Two zone mics treated as a stereo pair', ok: false, power: 'phantom', feedback: 'Two zones are not a coherent pair: the mono sum combs.' },
      { id: 'd', label: 'A crowd mic low in the front row', ok: false, power: 'phantom', feedback: 'The nearest people dominate.' },
      { id: 'e', label: 'The crowd mics also fed to the PA', ok: false, power: 'phantom', feedback: 'Crowd mics never go to the main PA.' },
    ],
    reasons: [
      { id: 'r.doc', label: 'A recommended starting point: raised, aimed at the faces', role: 'required', feedback: 'Say why it is a good place to begin.' },
      { id: 'r.route', label: 'The crowd mics go to the stream and recording only', role: 'required', feedback: 'Say where the crowd mics go — and where they do not.' },
      { id: 'r.mono', label: 'The mono sum is checked by ear', role: 'optional', feedback: 'A fair reason for a pair.' },
      { id: 'r.align', label: 'Time-aligning two zones fixes their sum', role: 'wrong', feedback: 'Alignment fits one seat only.' },
      BRAND_REASON('studio audience'),
    ],
    explain: 'Two setups pass. What passes is the reasoning: raised and aimed at faces, the PA off the front, out of the PA, the mono sum checked.',
  },
  {
    id: 'b8.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · An arena event, three sections, PA clusters high at the stage’s corners, a stereo broadcast.',
    setups: [
      { id: 'a', label: 'A zone per section on its rail, each named and monitored', ok: true, power: 'phantom', feedback: 'A recommended start: each section represented, each on its own channel.' },
      { id: 'b', label: 'A spaced pair on the truss plus a zone per side section', ok: true, power: 'phantom', feedback: 'A start that can pass — rigged by a qualified rigger, the mono sum checked.' },
      { id: 'c', label: 'One mono mic in the middle for the whole arena', ok: false, power: 'phantom', feedback: 'One capsule cannot represent every section of an arena.' },
      { id: 'd', label: 'Crowd mics clamped over the seats by the audio crew', ok: false, power: 'phantom', feedback: 'Nothing over people without a qualified rigger.' },
      { id: 'e', label: 'Every zone time-aligned to the centre seat', ok: false, power: 'phantom', feedback: 'Alignment fits one seat; the audience is everywhere.' },
    ],
    reasons: [
      { id: 'r.doc', label: 'Each zone raised on an approved place, aimed at faces', role: 'required', feedback: 'Say where each zone starts and why.' },
      { id: 'r.rig', label: 'Anything over people is rigged by a qualified rigger', role: 'required', feedback: 'Say who rigs it.' },
      { id: 'r.fewest', label: 'The fewest zones that represent the sections', role: 'optional', feedback: 'A fair reason.' },
      { id: 'r.pa', label: 'The crowd mics also feed the PA for the room', role: 'wrong', feedback: 'Crowd mics never go to the main PA.' },
      BRAND_REASON('crowd in an arena'),
    ],
    explain: 'Two setups pass. What passes is the reasoning: the sections represented, each zone on an approved place, rigged safely, out of the PA, monitored on its own.',
  },
];

const predictions: Lesson['predictions'] = {
  meet: { prompt: 'Before you move it: a crowd mic comes down low over the front row. What will it hear most?', options: ['The nearest few people', 'The whole section evenly', 'The PA'], after: 'Now slide HEIGHT down and up.' },
  microphone: { prompt: 'Which coverage gives the most predictable mono sum?', options: ['A coincident XY pair', 'Two zones far apart', 'A spaced pair'], after: 'Now step through each METHOD.' },
  placement: { prompt: 'Predict: the crowd mic moves from the bar to the stage’s corner. What changes?', options: ['More of one side, and the PA beside it', 'Nothing', 'Only the height'], after: 'Rest the mic in two zones and read what each one suggests.' },
  context: { prompt: 'Where should the PA cluster sit against a crowd mic’s cardioid pattern?', options: ['Toward its back', 'In front of it', 'At its side'], after: 'Now TURN and TILT the crowd mic.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then walk the source.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'meet',
    prompt: 'Low over the front row, what does a crowd mic favour?',
    options: ['The nearest few people', 'The whole section evenly', 'The back rows of seats'],
    correct: 'The nearest few people',
    explain: 'Low, the front row is much nearer than the rest: raise it above and a little in front.',
    why: { 'The whole section evenly': 'The middle is farther away than the front row.', 'The back rows of seats': 'Farther away, they arrive quieter.' },
  },
  {
    id: 'q.2',
    covers: 'meet',
    prompt: 'Two zone mics far apart, summed to mono. What can you expect?',
    options: ['A comb that moves seat to seat', 'A stable centre, like an XY pair', 'Nothing, once they are level-matched'],
    correct: 'A comb that moves seat to seat',
    explain: 'Different local events reach the two at different times: the image can wander and the mono sum colours — differently for each seat.',
    why: { 'A stable centre, like an XY pair': 'XY capsules hear a source at the same moment; far-apart zones do not.', 'Nothing, once they are level-matched': 'Levels do not remove the timing differences.' },
  },
  {
    id: 'q.3',
    covers: 'setups',
    critical: true,
    prompt: 'Where do the crowd mics go?',
    options: ['Broadcast and record only', 'The main PA, kept quiet', 'The PA during the applause'],
    correct: 'Broadcast and record only',
    explain: 'Never into the main PA: a distant audience mic in nearby loudspeakers can feed back.',
    why: { 'The main PA, kept quiet': 'Even quietly, it can feed back.', 'The PA during the applause': 'Feedback does not wait for applause.' },
  },
  {
    id: 'q.4',
    covers: 'setups',
    critical: true,
    prompt: 'Who may hang a crowd mic over the seats?',
    options: ['A qualified rigger', 'Careful audio crew', 'Whoever is on hand'],
    correct: 'A qualified rigger',
    explain: 'Nothing is flown above people without a qualified rigger and approved hardware.',
    why: { 'Careful audio crew': 'Care is not a qualification for rigging over people.', 'Whoever is on hand': 'Rigging over people needs a qualified rigger.' },
  },
  {
    id: 'q.5',
    covers: 'setups',
    prompt: 'The best spot for a stand is in an aisle. What now?',
    options: ['Keep it clear; another place', 'Use it and tape the cable', 'Use it only while the show runs'],
    correct: 'Keep it clear; another place',
    explain: 'Aisles, exits and walkways stay clear.',
    why: { 'Use it and tape the cable': 'Tape does not clear the aisle.', 'Use it only while the show runs': 'The show is when people use the aisle.' },
  },
  {
    id: 'q.6',
    covers: 'setups',
    prompt: 'How do you test the crowd mics with the PA on?',
    options: ['Working level; pull down at a ring', 'Raise them until the PA starts to ring', 'Open them all at once, and loud'],
    correct: 'Working level; pull down at a ring',
    explain: 'Bring each up only to its working level with the PA operator; at any ring pull it down. Never open an audience mic into the PA to make feedback.',
    why: { 'Raise them until the PA starts to ring': 'Provoking feedback risks ears and loudspeakers.', 'Open them all at once, and loud': 'Many open mics at a high level invite feedback.' },
  },
];

export const B08_LESSON: Lesson = {
  id: 'B08',
  labId: 'broadcast',
  title: 'Broadcast Audience and Event Space',
  subtitle: 'A crowd mic raised over a section, aimed at faces with the PA off its front — a pair told from two zones, and never into the PA',
  noun: { one: 'audience', many: 'audiences', subject: 'the audience' },
  model: B08_MODEL,
  micTypeIds: ['arrCard', 'arrOmni'],
  zones: B08_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Microphones for an audience — applause, laughter, cheering, singing and the size of a room — for listeners who are not there. They carry the crowd; the speech and the performance have their own close mics.', src: 'LESSON-B08' },
    { title: 'WHERE YOU MEET IT', text: 'Studio audiences, conferences, concerts and worship streams, arenas: crowd mics raised over sections, a pair for width, sometimes a surround or Ambisonic mic.', src: 'LESSON-B08' },
    { title: 'THE JOB', text: 'Represent the intended crowd without letting one nearby spectator, a loudspeaker or a camera position dominate — and keep the crowd mics out of the PA.', src: 'LESSON-B08' },
    { title: 'FROM ONE ZONE OUTWARD', text: 'Start with one well-placed mic for a representative section, then add a zone or a pair only where the brief needs it. Suggested starting points — experimentation is encouraged; your ears and the room decide.', src: 'LESSON-B08' },
  ],
  sound: {
    stages: [
      { title: 'From everywhere in the seats', text: 'Applause and laughter come from every seat at once — the nearest seats loudest at any mic.' },
      { title: 'The PA covers the same seats', text: 'The loudspeakers are aimed at the audience: a crowd mic over the seats hears them too.' },
      { title: 'The room adds its own', text: 'Reflections, the stage’s wash, ventilation and seats moving all reach a distant mic.' },
    ],
    attack: 'A clap or a laugh — short and sharp, loudest from the people nearest the mic.',
    body: 'The crowd’s swell and the room — the continuous bed under the show.',
    head: { diameterMm: 0, rods: 0, label: 'the audience', strikeSrc: 'LESSON-B08' },
  },
  setting: {
    items: [
      { id: 'near', label: 'the nearest people', short: 'NEAREST SEAT', note: 'A clap, a laugh or a conversation right under a crowd mic can dominate it: raise it, or move to another section.', prov: { kind: 'illustrative', reason: 'the lesson L13, L28' }, tag: 'BIAS', scene: 'all' },
      { id: 'pa', label: 'the PA and the fills', short: 'PA', note: 'Aimed at the seats: keep it well off the crowd mic’s front, and the crowd mic out of the PA.', prov: { kind: 'illustrative', reason: 'the lesson L12, L27' }, tag: 'SPILL', scene: 'all' },
      { id: 'stage', label: 'the stage and the performers', short: 'STAGE', note: 'Their close mics carry the speech and the music; the crowd mic is for the audience — and a crowd mic can add delayed copies of the show.', prov: { kind: 'illustrative', reason: 'the lesson L6, L31' }, tag: 'SPILL', scene: 'all' },
      { id: 'routes', label: 'the aisles and exits', short: 'ROUTES', note: 'Stands and cables stay outside them; any floor crossing is protected.', prov: { kind: 'illustrative', reason: 'the lesson L37' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'cameras', label: 'the cameras and the lights', short: 'CAMERAS', note: 'A hung mic or a stand stays out of the sight lines and the pictures; confirm the clearance.', prov: { kind: 'illustrative', reason: 'the lesson L9, L37' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'hvac', label: 'the air handling and the room', short: 'ROOM', note: 'Ventilation, the stage wash and reflective walls reach a distant mic — listen at several approved places.', prov: { kind: 'illustrative', reason: 'the lesson L9, L28' }, tag: 'NOISE', scene: 'all' },
    ],
    stage: 'Crowd mics on their own paths to the broadcast and the recording, never the main PA; the speech anchored by its close mics; the audience question on a close mic of its own.',
    studio: 'A small studio audience may need one well-placed mic or a pair; an arena needs several zones. Rehearse quiet speech, applause, a loud peak and an audience question with the PA at its agreed level.',
  },
  diagnostic,
  practice: {
    task: 'Put an audience setup in order, choose and justify setups for a studio audience and an arena, and say what would justify another zone. With a real venue’s permission, you can record what you tried below.',
    fields: [
      { id: 'venue', label: 'Venue, sections, PA and routes', kind: 'text' },
      { id: 'method', label: 'Coverage', kind: 'choice', choices: ['one mono mic', 'two zones', 'XY pair', 'near-coincident pair', 'spaced pair', 'zone per section', 'surround or Ambisonic', 'other'] },
      { id: 'places', label: 'Places, heights, aims and who rigged them', kind: 'text' },
      { id: 'map', label: 'Zone and channel map', kind: 'text' },
      { id: 'checks', label: 'PA spill, nearest seat, mono sum', kind: 'text' },
      { id: 'notes', label: 'Fallback and one remaining limitation', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The studio audience (one section 9 × 6 m, an aisle each side, a PA at each front corner of the stage 2.8 m up, a rigging bar above the front rows, a camera at the back) and the event (three sections round a 15 m stage, PA clusters 7 m up and a front fill, rails and a truss) are drawing defaults.', dims: [] },
    { text: 'The crowd mics’ heights (3.2 m on the bar, 2.4 m at the stage’s corners, 3.5 m on a rail, 6 m on the truss) and the faces’ height (1.2 m) are drawing defaults; no source gives a crowd mic’s height, distance or angle.', dims: [] },
    { text: 'The PA’s coverage wedges are a simplified picture of where it points, not a measured dispersion; the patterns are ideal first-order shapes; levels by distance alone; delays from straight paths.', dims: [] },
    { text: 'The surround and Ambisonic mics are drawn as tokens with their fronts and channel labels; no decode or fold-down is drawn.', dims: [] },
  ],
  live: { wedges: [] },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every audience, room and PA is different: listen at several approved places, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: the two venues are typical layouts; the PA’s wedges show where it points, not how it spreads; patterns are textbook shapes; levels and delays are calculated from the drawing. Safety is exact: crowd mics never into the main PA, nothing hung over people without a qualified rigger, aisles and exits clear.',
  copy: B08_COPY,
};
