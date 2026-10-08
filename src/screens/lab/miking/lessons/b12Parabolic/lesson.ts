/**
 * B12 PARABOLIC AND TRACKED ACTION PICKUP — the lesson as DATA, written to
 * the 2026-10-07 journey (MEET IT and STARTING SETUPS given here). Words from
 * the owner's lesson (docs/labs/miking/source_text/B12-Parabolic-and-Tracked-
 * Action-Pickup-Miking-Technique.txt; "L<n>" in comments only); research in
 * docs/labs/miking/parabolic/; corrections in CORRECTIONS_LOG.md "Lab 7b ·
 * group 2" — the maker's FAQ remark that wavelength is "not relevant in the
 * same way" is never shown: the wave-acoustic reading is taught (B12-01); the
 * dish is drawn from DERIVED dimensions, a simplified picture (B12-02); the
 * institutional wording stripped (R-07); brands and models kept off the
 * screen (R-08). Owner ruling 2026-10-04: suggested starting points, no
 * sources, brands or badges on screen. FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, polarityDelay, removeDelay } from '../shared/bowed/bowedItems.ts';
import { B12_MODEL } from './geometry.ts';
import { B12_ZONES } from './model.ts';
import { B12_COPY } from './copy.ts';

const pages: LessonPages = {
  meet: {
    title: 'Meet it — where the sound comes from',
    goal: 'Meet the parabolic dish: its parts, how the bowl gathers sound arriving along its axis onto the element at its focus — and why it helps the high frequencies most and the low ones hardly at all.',
    credit: { scenarios: ['pb.meet.1', 'pb.meet.2', 'pb.meet.3'], note: 'Answer the three checks on the bowl, the frequencies and the focus.' },
    takeaway: 'A dish favours the high frequencies of whatever is on its axis. Low sound reaching the element directly is not dish gain — and nothing it does turns a distance into a reliable working range.',
  },
  setups: {
    title: 'Starting setups',
    goal: 'See real dish setups drawn on the practice field — a dish from the operator’s place, the dish with a fixed fallback, a close perimeter mic indoors, an ambience pair, a low aim to try, a second dish — then what to settle before any mic goes up.',
    credit: { scenarios: ['pb.set.1', 'pb.set.2', 'pb.set.3'], interactive: 'setupsSeen', note: 'Look at every main setup on the drawing, and answer the three checks.' },
    takeaway: 'Choose the target before the dish, work from an approved place inside a marked arc, and plan what takes over when the dish cannot.',
  },
  microphone: {
    title: 'The dish and its alternatives',
    goal: 'Choose the dish — or an alternative — by what each gives and what limits it: a perimeter shotgun, a fixed boundary or effect mic, a wider ambience pair, a second dish.',
    credit: { scenarios: ['pb.mic.1', 'pb.mic.2', 'pb.mic.3', 'pb.rec.1'], note: 'Answer the four checks (one reaches back to the bowl).' },
    takeaway: 'The dish is often a supplement: decide by what you hear — the target against the background, and its tone — not by the equipment’s label.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and work the dish yourself from the operator’s place — its aim on A, B or C, inside the arc — and the fixed shotgun it hands off to.',
    credit: { scenarios: ['pb.place.1', 'pb.place.2', 'pb.place.3', 'pb.rec.2'], interactive: 'twoZones', note: 'Rest a mic, on an approved place and inside the arc, in two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'From an approved place, small turns inside the arc: the target on the axis, the focus right — and the plan, not the operator’s feet, covers the rest.',
  },
  context: {
    title: 'Tracking and headroom',
    goal: 'Track a moving source from the approved place, stop at the arc’s edge and hand off; then check the whole chain’s headroom for the nearest, loudest event.',
    credit: { scenarios: ['pb.ctx.1', 'pb.ctx.2', 'pb.ctx.3', 'pb.rec.3'], interactive: 'liveChecks', note: 'Track the source out of the arc and hand off, AND set a chain with room for every event, then answer the four checks.' },
    takeaway: 'Track by ear as well as by sight, inside the arc; hand off at a rehearsed cue; leave headroom for the nearest, loudest event — a filter cannot repair overload.',
  },
  twoMic: {
    title: 'The dish and a fixed mic',
    goal: 'The dish at M and a fixed shotgun at F hear one source at different times: watch the delay and the comb change as the source walks, and what polarity does and does not change.',
    credit: { scenarios: ['pb.two.1', 'pb.two.2', 'pb.two.3'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND walk the source, then answer the three checks.' },
    takeaway: 'A delay that fits one point is wrong at the next: hand off rather than blend, and check the sum in mono. Polarity flips the sign; it never removes the delay.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the aim, the focus, the grip and cable, the cover and the chain first — then reach for processing.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a dish session in order, choose and justify setups for two briefs, and say what would justify a second dish.',
    credit: { scenarios: ['pb.prac.order', 'pb.prac.gain', 'pb.prac.setup1', 'pb.prac.setup2', 'pb.prac.3', 'pb.mix.1', 'pb.mix.2', 'pb.mix.3'], note: 'Put the session in order, answer the gain check, complete both briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real, approved practice.' },
    takeaway: 'The target first, the maker’s assembly and focus, an approved place and arc, a planned handoff and headroom pass. A bigger dish or more gain do not — and more than one setup can pass.',
  },
};

/* THE CHECKS. Lesson lines in comments only: pb.meet.* L8–L9, L15 · pb.set.*
 * L5, L27 · pb.mic.* L18, L28, L34–L45 · pb.place.* L8, L15, L27 · pb.ctx.*
 * L28–L29 · pb.two.* L29 · pb.prac.* / pb.mix.* L8, L15, L29, L45. */
const scenarios: MikingScenario[] = [
  {
    id: 'pb.meet.1',
    page: 'meet',
    prompt: 'You hear plenty of low sound through the dish. What does that show?',
    options: ['Low sound can reach the element directly', 'The bowl gathers the bass as well as it can', 'The dish is focused for the low notes'],
    correct: 'Low sound can reach the element directly',
    explain: 'Hearing bass at the element is not dish gain: low sound reaches it directly. The bowl gathers only what is shorter in wavelength than the dish is wide.',
    why: {
      'The bowl gathers the bass as well as it can': 'A practical dish is too small to gather long wavelengths.',
      'The dish is focused for the low notes': 'Focus helps the high frequencies; the low ones arrive directly either way.',
    },
  },
  {
    id: 'pb.meet.2',
    page: 'meet',
    prompt: 'Which sound does a hand-held dish help most?',
    options: ['The higher frequencies on its axis', 'The lowest frequencies of a distant target', 'All frequencies equally, if it is aimed well'],
    correct: 'The higher frequencies on its axis',
    explain: 'The bowl gathers sound whose wavelength is shorter than its width — the higher frequencies — arriving along its axis.',
    why: {
      'The lowest frequencies of a distant target': 'The lows are the ones a practical dish helps least.',
      'All frequencies equally, if it is aimed well': 'Aim matters, but the bowl still favours the highs.',
    },
  },
  {
    id: 'pb.meet.3',
    page: 'meet',
    prompt: 'Where does the dish’s element go?',
    options: ['At the focus the maker specifies', 'Right in the middle of the bowl', 'Wherever it sounds loudest today'],
    correct: 'At the focus the maker specifies',
    explain: 'Place the element at the collector’s focal position, measured from the surface the maker names — and recheck it after travel.',
    why: {
      'Right in the middle of the bowl': 'An estimated centre is not the focus.',
      'Wherever it sounds loudest today': 'Louder is not focused; the maker’s reference is.',
    },
  },
  {
    id: 'pb.set.1',
    page: 'setups',
    prompt: 'Following the play would take you past the edge of your operating place. What now?',
    options: ['Stay inside and hand off to a fixed mic', 'Step past the edge while play is far off', 'Follow it, keeping your eyes on the dish'],
    correct: 'Stay inside and hand off to a fixed mic',
    explain: 'A good angle never justifies an unsafe or unapproved place: stay in the operating place and hand off at a rehearsed cue.',
    why: {
      'Step past the edge while play is far off': 'Play turns in a moment; the edge stays the edge.',
      'Follow it, keeping your eyes on the dish': 'Moving while looking into the dish is how collisions happen.',
    },
  },
  {
    id: 'pb.set.2',
    page: 'setups',
    prompt: 'Why does a crew member watch the surroundings while you track?',
    options: ['Your eyes and ears are on the dish', 'To tell you when the play is loudest', 'Because the rules ask for two people'],
    correct: 'Your eyes and ears are on the dish',
    explain: 'Tracking by ear and eye takes your attention; another crew member watches for play, people and hazards near you.',
    why: {
      'To tell you when the play is loudest': 'The headphones tell you that; the watcher is for safety.',
      'Because the rules ask for two people': 'It is a safety practice, not a rule count.',
    },
  },
  {
    id: 'pb.set.3',
    page: 'setups',
    prompt: 'Before tracking, how loud should the headphones start?',
    options: ['Low, then raised with care', 'As loud as the dish can make it', 'Loud enough to hear the crowd well'],
    correct: 'Low, then raised with care',
    explain: 'A dish can make a nearby shout or whistle very loud in the headphones: start low, isolated headphones at a safe level.',
    why: {
      'As loud as the dish can make it': 'A sudden nearby peak at that level can harm hearing.',
      'Loud enough to hear the crowd well': 'The crowd is not the target; the level stays safe.',
    },
  },
  {
    id: 'pb.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Below about the speed of sound ÷ the dish’s width, what does the bowl do?',
    options: ['It adds little to the pickup', 'It gathers the most sound of all', 'It cancels the sound completely'],
    correct: 'It adds little to the pickup',
    explain: 'There the wavelength is longer than the dish is wide: the bowl adds little, and the element hears the sound directly.',
    why: {
      'It gathers the most sound of all': 'Long wavelengths are the ones a small bowl cannot gather.',
      'It cancels the sound completely': 'It still reaches the element directly — just without help.',
    },
  },
  {
    id: 'pb.mic.1',
    page: 'microphone',
    prompt: 'A shotgun would fit the dish’s mount. Why not use it?',
    options: ['The dish is made for its own capsule', 'A shotgun is far too quiet inside a dish', 'A shotgun would make the pickup too narrow'],
    correct: 'The dish is made for its own capsule',
    explain: 'Follow the collector’s design: its capsule type, orientation and focal reference. A narrow shotgun by assumption is not that design.',
    why: {
      'A shotgun is far too quiet inside a dish': 'Level is not the reason; the design is.',
      'A shotgun would make the pickup too narrow': 'The point is the dish’s design, not a guess about width.',
    },
  },
  {
    id: 'pb.mic.2',
    page: 'microphone',
    prompt: 'In a reflective indoor venue, which may give more natural detail?',
    options: ['A close permitted perimeter mic', 'The largest dish you can carry in', 'Two dishes aimed at the same play'],
    correct: 'A close permitted perimeter mic',
    explain: 'Indoors a close permitted perimeter mic can sound more natural than a long-distance dish. Decide by the target against the background, and the tone.',
    why: {
      'The largest dish you can carry in': 'A bigger dish still hears the reflective room on its axis.',
      'Two dishes aimed at the same play': 'Two on one source can double the attack.',
    },
  },
  {
    id: 'pb.mic.3',
    page: 'microphone',
    prompt: 'Tracking fails, or atmosphere is the goal. A fair fallback?',
    options: ['A wider ambience pair, labelled so', 'More gain on the dish until it carries', 'A second dish aimed at the crowd'],
    correct: 'A wider ambience pair, labelled so',
    explain: 'A wider ambience pair gives a clearer venue perspective with less isolated action — labelled as ambience.',
    why: {
      'More gain on the dish until it carries': 'Gain raises the background with the target.',
      'A second dish aimed at the crowd': 'A dish narrows; atmosphere wants a wider view.',
    },
  },
  {
    id: 'pb.place.1',
    page: 'placement',
    prompt: 'You aim 10° off the target. What fades first?',
    options: ['The target’s high-frequency detail', 'The low-frequency body of the target', 'Nothing at all until about 45° off'],
    correct: 'The target’s high-frequency detail',
    explain: 'Off the axis the reflections no longer meet at the element: the target’s high-frequency definition goes first.',
    why: {
      'The low-frequency body of the target': 'The lows arrive directly; they change least.',
      'Nothing at all until about 45° off': 'Even a small aim error loses high-frequency detail.',
    },
  },
  {
    id: 'pb.place.2',
    page: 'placement',
    prompt: 'The element has slid 20 mm off the focus in transit. What do you do?',
    options: ['Re-set it from the maker’s reference', 'Leave it: 20 mm is too small to matter', 'Boost the treble to make up for it'],
    correct: 'Re-set it from the maker’s reference',
    explain: 'A small focus error may weaken the higher frequencies. Re-set it from the surface the maker names, without touching a sensitive capsule.',
    why: {
      'Leave it: 20 mm is too small to matter': 'A small focus error can weaken the high frequencies.',
      'Boost the treble to make up for it': 'EQ cannot put the reflections back on the element.',
    },
  },
  {
    id: 'pb.place.3',
    page: 'placement',
    prompt: 'An idea to try with some dishes: where do you aim at a distant player?',
    options: ['A little low, toward the feet', 'Well above the head, at the crowd', 'At the head, whatever the dish'],
    correct: 'A little low, toward the feet',
    explain: 'One maker suggests aiming a little below a distant player so the pickup takes in less of the crowd beyond — to test with your own dish and geometry, raising the aim as the player approaches.',
    why: {
      'Well above the head, at the crowd': 'That puts the crowd on the axis.',
      'At the head, whatever the dish': 'Aim at the sound you want — and test it for your dish.',
    },
  },
  {
    id: 'pb.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What is the dish’s turn arc?',
    options: ['The approved turning range', 'The shape of the dish’s pickup pattern', 'How far away the dish can hear clearly'],
    correct: 'The approved turning range',
    explain: 'The arc is the range of aim you may turn through from the approved place. Past it, stop and hand off.',
    why: {
      'The shape of the dish’s pickup pattern': 'The arc is about safe turning, not the pickup.',
      'How far away the dish can hear clearly': 'No arc or drawing turns a distance into a working range.',
    },
  },
  {
    id: 'pb.ctx.1',
    page: 'context',
    prompt: 'The target leaves the turn arc. What does the operator do?',
    options: ['Stop at the edge and hand off', 'Step out to keep it on the axis', 'Turn on, and lean past the edge'],
    correct: 'Stop at the edge and hand off',
    explain: 'Stop at the arc’s edge and hand off at the rehearsed cue — to a fixed mic, another operator or the ambience.',
    why: {
      'Step out to keep it on the axis': 'The operator stays in the approved place.',
      'Turn on, and lean past the edge': 'The dish then reaches beyond the approved arc.',
    },
  },
  {
    id: 'pb.ctx.2',
    page: 'context',
    prompt: 'A celebration erupts right beside the dish. What should the gain have allowed for?',
    options: ['The nearest, loudest event', 'Only the quiet distant target', 'The average level of the play'],
    correct: 'The nearest, loudest event',
    explain: 'Leave headroom for the nearest or loudest event — impacts, whistles, celebrations, nearby shouting.',
    why: {
      'Only the quiet distant target': 'Set for the quiet target, the near peak clips.',
      'The average level of the play': 'Peaks, not averages, overload a stage.',
    },
  },
  {
    id: 'pb.ctx.3',
    page: 'context',
    prompt: 'A nearby shout clipped the dish’s transmitter input. What can a high-pass filter on the channel do about it?',
    options: ['Nothing for the clip itself', 'Remove the distortion it caused', 'Bring back the lost peak'],
    correct: 'Nothing for the clip itself',
    explain: 'A high-pass filter can tame wind rumble and low handling thumps; it cannot repair a clip that already happened upstream, or give the dish low-frequency gain it never had. Lower the gain where it clipped.',
    why: {
      'Remove the distortion it caused': 'Clipping adds distortion right across the spectrum; a filter that only cuts the lows leaves it in.',
      'Bring back the lost peak': 'What the clip flattened is gone; no filter after it can restore it.',
    },
  },
  {
    id: 'pb.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · The dish hears the crowd behind the player. Why?',
    options: ['The crowd is on its axis too', 'The bowl is focused on the crowd', 'The dish hears behind itself best'],
    correct: 'The crowd is on its axis too',
    explain: 'A dish favours what is along its axis — the crowd beyond the target included. Re-aim, or use another angle.',
    why: {
      'The bowl is focused on the crowd': 'It is focused along an axis, not at a distance.',
      'The dish hears behind itself best': 'Behind the bowl is where it hears least.',
    },
  },
  {
    id: 'pb.two.1',
    page: 'twoMic',
    prompt: 'The dish and the fixed shotgun both hear one kick. Why can it sound doubled?',
    options: ['They hear it at different times', 'The dish flips the polarity', 'The shotgun adds an echo of its own'],
    correct: 'They hear it at different times',
    explain: 'Two mics at different distances hear one transient at different times: summed, a double attack or a comb.',
    why: {
      'The dish flips the polarity': 'A reflector does not flip the signal’s sign.',
      'The shotgun adds an echo of its own': 'The second arrival is the other mic’s path.',
    },
  },
  polarityDelay('pb.two.2'),
  {
    id: 'pb.two.3',
    page: 'twoMic',
    prompt: 'You align the two mics for a kick at A. The play moves to C. Then?',
    options: ['It no longer fits the new paths', 'It still fits: the mics did not move', 'It fits better, as C is farther'],
    correct: 'It no longer fits the new paths',
    explain: 'The paths change as the source moves, so the delay that fits changes. Hand off, or keep one dominant mic per zone.',
    why: {
      'It still fits: the mics did not move': 'The source moved; the paths changed.',
      'It fits better, as C is farther': 'Farther changes the difference; it does not fix it.',
    },
  },
  {
    id: 'pb.prac.gain',
    page: 'practice',
    prompt: 'For which event do you set the dish’s gain?',
    options: ['The nearest, loudest one, with margin', 'The quietest distant call that you want', 'A typical moment in the middle of play'],
    correct: 'The nearest, loudest one, with margin',
    explain: 'Set the gain for the nearest, loudest credible event you can test safely, the loudest safe rehearsal peak near −12 dBFS, and keep margin.',
    why: {
      'The quietest distant call that you want': 'Then the first near shout clips.',
      'A typical moment in the middle of play': 'The peaks, not the typical moments, overload a stage.',
    },
  },
  {
    id: 'pb.prac.3',
    page: 'practice',
    prompt: 'What would justify a second dish?',
    options: ['A separate zone one dish cannot reach', 'Two dishes make a bigger, wider sound', 'The first dish is getting too heavy to hold'],
    correct: 'A separate zone one dish cannot reach',
    explain: 'A second authorized position for a separate action zone — with crew and radio capacity, and a handoff to avoid doubled transients.',
    why: {
      'Two dishes make a bigger, wider sound': 'Two dishes narrow two zones; they do not widen the picture.',
      'The first dish is getting too heavy to hold': 'Fatigue is solved by support and rotation, not a second dish.',
    },
  },
  {
    id: 'pb.mix.1',
    page: 'practice',
    prompt: 'Low sound comes through the dish loud and clear. What has the bowl done for it?',
    options: ['Little: it arrives directly', 'Focused it, as it does the highs', 'Turned it into a narrow beam'],
    correct: 'Little: it arrives directly',
    explain: 'Do not infer dish gain from hearing bass: the low sound reaches the element directly.',
    why: {
      'Focused it, as it does the highs': 'A small bowl cannot gather long wavelengths.',
      'Turned it into a narrow beam': 'Long wavelengths are not narrowed by a small dish.',
    },
  },
  removeDelay('pb.mix.2'),
  {
    id: 'pb.mix.3',
    page: 'practice',
    prompt: 'What decides where the element sits in the dish?',
    options: ['The maker’s focal reference', 'The loudest result on the day', 'The middle of the bowl, by eye'],
    correct: 'The maker’s focal reference',
    explain: 'Measured from the surface the maker names, not an estimated centre — and rechecked after travel.',
    why: {
      'The loudest result on the day': 'Louder is not focused.',
      'The middle of the bowl, by eye': 'The focus is not at the bowl’s middle.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'pb.sym.dull',
    observation: 'The target sounds dull and distant',
    firstChecks: 'Is the axis on the target? Is the element at the maker’s focal reference?',
    options: ['Check the aim and the focus', 'Boost the top end on the dish', 'Raise the gain until it is bright'],
    correct: 'Check the aim and the focus',
    explain: 'An aim error or a focus error loses the high frequencies first. Fix the dish; EQ and gain do not put the reflections back.',
    why: { 'Boost the top end on the dish': 'EQ cannot replace the missing reflections.', 'Raise the gain until it is bright': 'Gain raises the background too.' },
  },
  {
    id: 'pb.sym.crowd',
    observation: 'The crowd beyond the player swamps the target',
    firstChecks: 'What else is on the axis? Is there a better approved angle?',
    options: ['Re-aim, or use another angle', 'Turn the dish gain up a long way', 'Aim the dish higher, over the play'],
    correct: 'Re-aim, or use another angle',
    explain: 'The dish favours whatever is on its axis: re-aim (a little low may help with some dishes) or use another approved angle.',
    why: { 'Turn the dish gain up a long way': 'Gain raises the crowd with the target.', 'Aim the dish higher, over the play': 'That puts more of the crowd on the axis.' },
  },
  {
    id: 'pb.sym.handling',
    observation: 'Squeaks and bumps while turning',
    firstChecks: 'The grip, the handle, the cable touching the dish, dish flex.',
    options: ['Check the grip and the cable', 'Turn faster so it is over sooner', 'Filter out everything below 1 kHz'],
    correct: 'Check the grip and the cable',
    explain: 'Hand and handle squeaks, cable bumps and dish flex: the intended handle, a short secured cable clear of the dish, smooth turns.',
    why: { 'Turn faster so it is over sooner': 'Faster turns make more handling noise.', 'Filter out everything below 1 kHz': 'That removes the action’s body and leaves the cause.' },
  },
  {
    id: 'pb.sym.wind',
    observation: 'Rumble in the wind',
    firstChecks: 'Is the dish’s own wind cover fitted, clear of the element?',
    options: ['Fit the dish’s own wind cover', 'Hold the dish closer to the body', 'Cut all the low end in the mix'],
    correct: 'Fit the dish’s own wind cover',
    explain: 'A cover made for the dish and its element — tested in the real wind, never shifting the focus or touching the element.',
    why: { 'Hold the dish closer to the body': 'That does not stop wind on the element.', 'Cut all the low end in the mix': 'A deep cut leaves the wind overload in place.' },
  },
  {
    id: 'pb.sym.clip',
    observation: 'A nearby shout distorts',
    firstChecks: 'Which stage overloads first: the element, the transmitter, the preamp?',
    options: ['Find the stage that overloaded', 'Lower the output fader a long way', 'Add a high-pass filter to the dish'],
    correct: 'Find the stage that overloaded',
    explain: 'Leave headroom for the nearest, loudest event; lower the gain at the first overloaded stage. A filter cannot restore overload.',
    why: { 'Lower the output fader a long way': 'A low output fader does not undo upstream clipping.', 'Add a high-pass filter to the dish': 'A filter cannot repair a clip.' },
  },
  {
    id: 'pb.sym.double',
    observation: 'A doubled attack with the dish and the fixed mic both open',
    firstChecks: 'Do both hear the same transient? Which one leads this zone?',
    options: ['Hand off smoothly, one at a time', 'Flip the dish’s polarity for good', 'Set one delay for the whole match'],
    correct: 'Hand off smoothly, one at a time',
    explain: 'Two arrivals of one transient double it. Hand off with a smooth, modest crossfade; a fixed delay fits one point only.',
    why: { 'Flip the dish’s polarity for good': 'Polarity does not remove the second arrival.', 'Set one delay for the whole match': 'The play moves; the delay that fits changes.' },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'pb.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a dish session in the order you would do them.',
    steps: [
      { text: 'Choose the target sound; draw the operating place and its no-entry edge', early: 'The target and the place come first.' },
      { text: 'Assemble the dish by its manual; check the element at its focus', early: 'Assemble once the job and the place are known.' },
      { text: 'Fit the cover; route a short cable clear of the dish and the walkway', early: 'Protection and cable once it is assembled.' },
      { text: 'Headphones low; set the gain for the loudest safe event', early: 'Levels come once the dish is ready.' },
      { text: 'Compare on the axis, a small aim error and an off-axis target', early: 'Compare once the levels are set.' },
      { text: 'Rehearse tracking inside the arc, and the handoff', early: 'Tracking comes after the fixed comparisons.' },
    ],
    explain: 'A sensible order: the target and the place, the maker’s assembly and focus, the cover and the cable, safe levels, the comparisons, then tracking and the handoff.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'pb.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · An outdoor field match: kicks and calls wanted from the far side, one operator at an approved place, wind expected.',
    setups: [
      { id: 'a', label: 'The dish from the approved place, with a fixed fallback and ambience', ok: true, power: 'phantom', feedback: 'A recommended start: tracked detail inside the arc, a planned handoff, the bed under both.' },
      { id: 'b', label: 'Fixed perimeter mics into the far sectors, plus ambience', ok: true, power: 'phantom', feedback: 'A recommended start where tracking is not possible — less isolated detail.' },
      { id: 'c', label: 'The operator walks the touchline to follow the play', ok: false, power: 'phantom', feedback: 'Stay in the approved place; never chase play.' },
      { id: 'd', label: 'A shotgun mounted at the dish’s focus for more reach', ok: false, power: 'phantom', feedback: 'Use the dish’s own capsule and design.' },
      { id: 'e', label: 'The dish with no cover, the gain turned right up', ok: false, power: 'phantom', feedback: 'Wind overload and no headroom.' },
    ],
    reasons: [
      { id: 'r.place', label: 'The operator stays in the approved place and arc', role: 'required', feedback: 'Say where the operator stays.' },
      { id: 'r.hand', label: 'A fixed source takes over when tracking fails', role: 'required', feedback: 'Say what covers the gaps.' },
      { id: 'r.wind', label: 'The dish’s own cover is fitted and tested', role: 'optional', feedback: 'A fair reason.' },
      BRAND_REASON('sports field'),
      { id: 'r.reach', label: 'A dish turns a long distance into a reliable range', role: 'wrong', feedback: 'No dish turns a distance into a reliable working range.' },
    ],
    explain: 'Two setups pass. What passes is the reasoning: the approved place and arc, a planned handoff, the dish’s own assembly and cover.',
  },
  {
    id: 'pb.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · An indoor arena with hard walls: shoe and ball detail near one end, a close perimeter position approved.',
    setups: [
      { id: 'a', label: 'A close perimeter mic at the approved position, plus ambience', ok: true, power: 'phantom', feedback: 'A recommended start: indoors a close mic can sound more natural than a long-distance dish.' },
      { id: 'b', label: 'A dish from the approved end place, compared with the close mic', ok: true, power: 'phantom', feedback: 'A fair start — keep whichever gives the better target against the room.' },
      { id: 'c', label: 'The largest dish, because it is the most directional', ok: false, power: 'phantom', feedback: 'Decide by what you hear, not the label.' },
      { id: 'd', label: 'The dish carried onto the court’s edge between plays', ok: false, power: 'phantom', feedback: 'Never into the playing area or its clear space.' },
      { id: 'e', label: 'Two dishes on the same end, both open', ok: false, power: 'phantom', feedback: 'Doubled transients and hollow tone.' },
    ],
    reasons: [
      { id: 'r.hear', label: 'Chosen by the target against the room, by ear', role: 'required', feedback: 'Say how you will decide.' },
      { id: 'r.approved', label: 'Every position is the approved one', role: 'required', feedback: 'Say where each mic stands.' },
      { id: 'r.amb', label: 'An ambience source keeps the continuity', role: 'optional', feedback: 'A fair reason.' },
      BRAND_REASON('arena'),
      { id: 'r.bigger', label: 'The bigger the dish, the better indoors', role: 'wrong', feedback: 'A bigger dish still hears the hard room on its axis.' },
    ],
    explain: 'Two setups pass. What passes is the reasoning: judged by ear against the room, approved positions only.',
  },
];

const predictions: Lesson['predictions'] = {
  meet: { prompt: 'Before you try it: which does the bowl help more — the highs or the lows?', options: ['The highs', 'The lows', 'Both equally'], after: 'Now try each AIM ERROR and each SIZE.' },
  microphone: { prompt: 'In a hard-walled indoor venue, which might sound more natural?', options: ['A close perimeter mic', 'A long-distance dish', 'No difference'], after: 'Now step through each METHOD.' },
  placement: { prompt: 'Predict: you turn the dish from A to B. What must stay true?', options: ['The aim stays inside the arc', 'The gain goes up', 'Nothing'], after: 'Rest a mic in two zones and read what each one suggests.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then walk the source.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'meet',
    prompt: 'What does a dish’s bowl help most?',
    options: ['High frequencies on its axis', 'Low frequencies from far away', 'All frequencies the same'],
    correct: 'High frequencies on its axis',
    explain: 'The bowl gathers wavelengths shorter than its width — the highs — along its axis.',
    why: { 'Low frequencies from far away': 'The lows are what a small dish helps least.', 'All frequencies the same': 'The bowl favours the highs.' },
  },
  {
    id: 'q.2',
    covers: 'meet',
    prompt: 'What goes at the dish’s focus?',
    options: ['The maker’s specified capsule', 'A short shotgun for more reach', 'A cardioid that happens to fit'],
    correct: 'The maker’s specified capsule',
    explain: 'The collector’s own capsule, focal reference and mount.',
    why: { 'A short shotgun for more reach': 'A shotgun is not the dish’s design.', 'A cardioid that happens to fit': 'Fitting is not the test.' },
  },
  {
    id: 'q.3',
    covers: 'meet',
    prompt: 'Low sound is loud through the dish. What does that show?',
    options: ['It may arrive directly', 'The bowl focuses the bass', 'The dish is badly aimed'],
    correct: 'It may arrive directly',
    explain: 'Low sound reaches the element directly; that is not dish gain.',
    why: { 'The bowl focuses the bass': 'A small bowl cannot gather long wavelengths.', 'The dish is badly aimed': 'Aim changes the highs; the lows arrive anyway.' },
  },
  {
    id: 'q.4',
    covers: 'setups',
    critical: true,
    prompt: 'The play leaves your operating place’s arc. You:',
    options: ['Stay in and hand off', 'Step out to follow it', 'Lean out to keep it'],
    correct: 'Stay in and hand off',
    explain: 'The operator stays in the approved place and hands off at the cue.',
    why: { 'Step out to follow it': 'Never chase play out of the approved place.', 'Lean out to keep it': 'The dish then reaches into the space.' },
  },
  {
    id: 'q.5',
    covers: 'setups',
    critical: true,
    prompt: 'How do the headphones start before tracking?',
    options: ['Low, raised with care', 'At full level', 'Loud enough for the crowd'],
    correct: 'Low, raised with care',
    explain: 'A dish can make a nearby peak very loud: start low.',
    why: { 'At full level': 'A sudden near peak at full level can harm hearing.', 'Loud enough for the crowd': 'The level stays safe, whatever the crowd.' },
  },
  {
    id: 'q.6',
    covers: 'setups',
    prompt: 'Why plan a fixed mic beside the dish?',
    options: ['It covers what the dish lets go', 'It makes the dish sound louder', 'Two mics are the rule at a match'],
    correct: 'It covers what the dish lets go',
    explain: 'When the target leaves the arc, the fixed mic takes over at a rehearsed cue.',
    why: { 'It makes the dish sound louder': 'It is a fallback, not a boost.', 'Two mics are the rule at a match': 'It is a plan, not a rule.' },
  },
];

export const B12_LESSON: Lesson = {
  id: 'B12',
  labId: 'broadcast',
  title: 'Parabolic and Tracked Action Pickup',
  subtitle: 'The bowl helps the highs on its axis: the maker’s focus, small turns inside an approved arc, and a planned handoff',
  noun: { one: 'dish', many: 'dishes', subject: 'the dish' },
  model: B12_MODEL,
  micTypeIds: ['spDish', 'shotgunShort', 'arrCard'],
  zones: B12_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A curved bowl that gathers sound arriving along its axis onto a small element at its focus. Operators use it to follow distant action — a kick, a call, a contact — from an approved place.', src: 'LESSON-B12' },
    { title: 'WHAT IT DOES', text: 'It narrows and lifts the HIGH frequencies of whatever is on its axis. Low sound can still reach the element directly — that is not the bowl helping.', src: 'LESSON-B12' },
    { title: 'ITS OWN SYSTEM', text: 'Each dish has its own capsule, focal reference, mount and cover. Use the maker’s, and measure the focus from the surface the maker names — never a shotgun swapped in by assumption.', src: 'LESSON-B12' },
    { title: 'THE PRACTICE', text: 'Here you practise from mark M on a practice field. These are suggested starting points — experimentation is encouraged; your ears and the venue decide.', src: 'LESSON-B12' },
  ],
  sound: {
    stages: [
      { title: 'Along the axis', text: 'Sound from the target arrives along the axis and reflects off the bowl toward the focus — where the element is.' },
      { title: 'The wavelength', text: 'Only sound whose wavelength is shorter than the dish is wide is gathered well: the bigger the dish, the lower that reaches.' },
      { title: 'Off the axis', text: 'A target off the axis is no longer gathered at the element: its high-frequency detail fades first.' },
    ],
    attack: 'Transients — a kick, a contact, a call — are what a dish brings forward best.',
    body: 'The low body of the action reaches the element mostly directly, as it would any small mic.',
    head: { diameterMm: 0, rods: 0, label: 'the dish', strikeSrc: 'LESSON-B12' },
  },
  setting: {
    items: [
      { id: 'beyond', label: 'the crowd beyond the target', short: 'ON THE AXIS', note: 'Whatever is on the axis is favoured with the play — the crowd behind the player too. Re-aim, or use another angle.', prov: { kind: 'illustrative', reason: 'the lesson L9, L27' }, tag: 'SPILL', scene: 'all' },
      { id: 'pa', label: 'the PA', short: 'PA', note: 'A PA in the target’s direction is gathered with it. Keep effects out of the PA’s own feed.', prov: { kind: 'illustrative', reason: 'the lesson L9' }, tag: 'SPILL', scene: 'all' },
      { id: 'near', label: 'loud events near the operator', short: 'NEARBY PEAKS', note: 'Impacts, whistles, celebrations and shouting close by: headroom for the nearest, loudest event — and headphones that start low.', prov: { kind: 'illustrative', reason: 'the lesson L29' }, tag: 'HEADROOM', scene: 'all' },
      { id: 'people', label: 'crew, cameras and walkways', short: 'PEOPLE', note: 'Assigned zones, routes and exits: the dish, its support and its cable stay out of them; a short cable, never dragging in a walkway.', prov: { kind: 'illustrative', reason: 'the lesson L5, L21' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'wind', label: 'wind and weather', short: 'WEATHER', note: 'A cover made for the dish and element; wet connectors and electronics paused when exposure passes the ratings.', prov: { kind: 'illustrative', reason: 'the lesson L24–L25' }, tag: 'WIND', scene: 'all' },
    ],
    stage: 'The dish is often a supplementary action mic: commentary, fixed effects and ambience stay on separate controllable channels. Compare the tracked dish with a fixed mic and the ambience at a normal moment and a crowd peak.',
    studio: 'A quiet practice lets you hear the dish’s aim and focus clearly — but no distance it reaches on a quiet day is a reliable working range at a real event.',
  },
  diagnostic,
  practice: {
    task: 'Put a dish session in order, choose and justify setups for an outdoor field and an indoor arena, and say what would justify a second dish. With an approved practice, you can record what you tried below.',
    fields: [
      { id: 'dish', label: 'Dish, capsule and focal reference', kind: 'text' },
      { id: 'target', label: 'Target sound and operating place', kind: 'text' },
      { id: 'aim', label: 'Aim errors tried and what changed', kind: 'text' },
      { id: 'compare', label: 'Compared with', kind: 'choice', choices: ['perimeter shotgun', 'fixed boundary mic', 'ambience pair', 'second dish', 'other'] },
      { id: 'wind', label: 'Wind, handling and cable', kind: 'text' },
      { id: 'handoff', label: 'Arc, handoff and coverage gaps', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The dish’s shape is drawn from derived dimensions (a 660 mm rim, 224 mm deep, focus 122 mm; a 406 mm rim, 122 mm deep, focus 84 mm) — not read from a maker’s drawing.', dims: [] },
    { text: 'The rays are a simplified picture: an ideal paraboloid, straight rays, no diffraction at the rim.', dims: [] },
    { text: 'The dish’s axis at 1.3 m, the fixed mic’s place F, the ambience mark E, the turn arc and the walk past the arc are drawing defaults; the practice field and its targets are the B13 lesson’s own layout.', dims: [] },
    { text: 'The headroom chain’s event sizes and stage limits are an example, not a measurement of any equipment.', dims: [] },
  ],
  live: { wedges: [] },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every dish, venue and sport is different: follow your dish’s own manual, listen, experiment, and trust your ears and the venue. The lab is silent and draws a simplified picture: an ideal bowl drawn from derived sizes, straight rays, the lowest helped frequency as the speed of sound ÷ the dish’s width; ranges and delays are calculated from the drawing; the headroom chain is an example. No drawing turns a distance into a working range. Safety is exact: stay in the approved place, start the headphones low, and never chase play.',
  copy: B12_COPY,
};
