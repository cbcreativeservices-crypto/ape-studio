/**
 * B14 COURT, RACKET AND ICE SPORTS — the lesson as DATA, written to the
 * 2026-10-07 journey (MEET IT and STARTING SETUPS given here). Words from the
 * owner's lesson (docs/labs/miking/source_text/B14-Court-Racket-and-Ice-
 * Sports-Miking-Technique.txt; "L<n>" in comments only); research in
 * docs/labs/miking/court_ice/; corrections in CORRECTIONS_LOG.md "Lab 7b ·
 * group 2" — the basketball clearance said as an obstruction clearance, not a
 * crew strip (B14-01); institutional wording stripped (R-07); brands, models,
 * leagues and rule numbers kept off the screen (R-08); the lightning rule and
 * the rain-cover caution one card (R-09). Owner ruling 2026-10-04: suggested
 * starting points, no sources, brands or badges on screen. FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, polarityDelay, removeDelay } from '../shared/bowed/bowedItems.ts';
import { B14_MODEL } from './geometry.ts';
import { B14_ZONES } from './model.ts';
import { B14_COPY } from './copy.ts';

const pages: LessonPages = {
  meet: {
    title: 'Meet it — where the sound comes from',
    goal: 'Meet court, racket and ice sports from a microphone’s point of view: the clear space round each, the routes and fixtures — and how distance changes what reaches a mic from outside the line.',
    credit: { scenarios: ['cl.meet.1', 'cl.meet.2', 'cl.meet.3'], note: 'Answer the three checks on the clear band, the floor and the structure.' },
    takeaway: 'Contacts happen at different heights and move across the court; the mic stays outside the clear space. Air and structure are two different things for a mic to hear.',
  },
  setups: {
    title: 'Starting setups',
    goal: 'See real starting setups drawn on the practice line and the court — a short shotgun outside the line, a second position overlapping it, an approved floor boundary, an ambience pair, a compact mic, a plant — then what to settle before any mic goes up.',
    credit: { scenarios: ['cl.set.1', 'cl.set.2', 'cl.set.3'], interactive: 'setupsSeen', note: 'Look at every main setup on the drawing, and answer the three checks.' },
    takeaway: 'Start with one action feed and ambience; add end sectors or approved plants only when they fill a tested gap — and every one stays clear of athletes, routes and cameras.',
  },
  microphone: {
    title: 'The pickup methods',
    goal: 'Choose a method by what it gives and what limits it — a compact directional, a perimeter shotgun, a floor boundary, an approved plant, a contact sensor, fixed ambience — not by its name.',
    credit: { scenarios: ['cl.mic.1', 'cl.mic.2', 'cl.mic.3', 'cl.rec.1'], note: 'Answer the four checks (one reaches back to the floor).' },
    takeaway: 'Pattern names alone do not settle isolation: audition with the crowd and the PA running. A contact sensor hears the structure, not the air.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and work the mic yourself at the practice line — the shotgun, the compact mic, the boundary on the floor — and see the range and angle change between A, B and C.',
    credit: { scenarios: ['cl.place.1', 'cl.place.2', 'cl.place.3', 'cl.rec.2'], interactive: 'twoZones', note: 'Rest a mic, in the outside zone, in two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'From outside the line, aimed at the contact height: one variable at a time, the gain unchanged across A, B and C.',
  },
  context: {
    title: 'Floor, structure and headroom',
    goal: 'See why a capsule at a hard floor avoids the comb a raised mic hears, how a structure carries vibration into a clamped mic, and check the whole chain’s headroom.',
    credit: { scenarios: ['cl.ctx.1', 'cl.ctx.2', 'cl.ctx.3', 'cl.rec.3'], interactive: 'liveChecks', note: 'Try every floor height, compare every mount, AND set a chain with room for every event, then answer the four checks.' },
    takeaway: 'At the surface, the comb leaves the audio band; on a rigid clamp, the structure arrives with the air. Headroom is checked at every stage — a fader cannot undo a clip.',
  },
  twoMic: {
    title: 'Two positions, one moving source',
    goal: 'A shotgun at M and a second at M2 overlap at B: watch the delay and the comb change as the source walks from A to C, and what polarity does and does not change.',
    credit: { scenarios: ['cl.two.1', 'cl.two.2', 'cl.two.3'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND walk the source, then answer the three checks.' },
    takeaway: 'An alignment that helps at one point can worsen another: choose a dominant feed per sector, or hand off smoothly — and check mono.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the mount, the geometry, the overlap and the chain first — then reach for processing.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a practice session in order, choose and justify setups for two briefs, and say what would justify an end sector or a plant.',
    credit: { scenarios: ['cl.prac.order', 'cl.prac.gain', 'cl.prac.setup1', 'cl.prac.setup2', 'cl.prac.3', 'cl.mix.1', 'cl.mix.2', 'cl.mix.3'], note: 'Put the session in order, answer the gain check, complete both briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real, approved practice.' },
    takeaway: 'Approved positions, the contact height, air kept apart from structure, a dominant feed per sector and a chain with room pass — and more than one setup can pass.',
  },
};

/* THE CHECKS. Lesson lines in comments only: cl.meet.* L14, L55, L66 · cl.set.*
 * L63–L64, L127–L129 · cl.mic.* L33–L48, L131 · cl.place.* L182–L183 ·
 * cl.ctx.* L55, L66, L172 · cl.two.* L174–L175 · cl.prac.* / cl.mix.* L172,
 * L125, L147. */
const scenarios: MikingScenario[] = [
  {
    id: 'cl.meet.1',
    page: 'meet',
    prompt: 'What is the clear band round a basketball court for?',
    options: ['Clearance — no obstruction inside it', 'A strip where the crew may set up stands', 'A good place for the floor mics to sit'],
    correct: 'Clearance — no obstruction inside it',
    explain: 'It is a typical clear zone of about 2 m with no obstruction — a clearance, not a crew strip. Check your event’s rules and its assigned positions.',
    why: {
      'A strip where the crew may set up stands': 'A clearance is not a crew strip.',
      'A good place for the floor mics to sit': 'A floor mic and its cable go beyond the band, where approved.',
    },
  },
  {
    id: 'cl.meet.2',
    page: 'meet',
    prompt: 'A boundary mic and a mic raised a little above the floor hear one clap. What does the raised one also get?',
    options: ['A floor reflection a moment later', 'A cleaner sound, with no room at all', 'Less of the clap, but no change in tone'],
    correct: 'A floor reflection a moment later',
    explain: 'The raised capsule hears the clap straight and off the floor a moment later: summed, a comb. At the surface the two paths are equal.',
    why: {
      'A cleaner sound, with no room at all': 'Raising it adds a reflection; it does not remove the room.',
      'Less of the clap, but no change in tone': 'The reflection changes the tone — a comb of notches.',
    },
  },
  {
    id: 'cl.meet.3',
    page: 'meet',
    prompt: 'A mic is clamped rigidly to a basket’s backstop. What can it pick up?',
    options: ['The structure’s rattles as well as the air', 'Only the air, as a clamp blocks vibration', 'Nothing until the ball hits the rim'],
    correct: 'The structure’s rattles as well as the air',
    explain: 'A rigid clamp passes the structure’s rattles and impacts straight to the mic. A compatible suspension or an independent support keeps them out.',
    why: {
      'Only the air, as a clamp blocks vibration': 'A rigid clamp carries vibration; isolation blocks it.',
      'Nothing until the ball hits the rim': 'It hears the air and the structure all the time.',
    },
  },
  {
    id: 'cl.set.1',
    page: 'setups',
    prompt: 'An approved-looking floor spot is routinely crossed by substitutes and cleaners. What now?',
    options: ['Reject it and use the perimeter feed', 'Tape the cable down well and keep it', 'Use it, since the housing is small'],
    correct: 'Reject it and use the perimeter feed',
    explain: 'Reject a spot people routinely cross. A taped cable can still change traction or catch a shoe; low profile is not safe for contact.',
    why: {
      'Tape the cable down well and keep it': 'Taped cable can still catch a shoe.',
      'Use it, since the housing is small': 'Small is not safe for a foot.',
    },
  },
  {
    id: 'cl.set.2',
    page: 'setups',
    prompt: 'Who installs a mic on a basket assembly?',
    options: ['Qualified venue staff, with approval', 'Your crew, if it can be done quickly', 'The players, as they know the hoop'],
    correct: 'Qualified venue staff, with approval',
    explain: 'Only with express approval, on a reviewed fixture, installed by qualified venue personnel — never on the rim, the net or the breakaway by default.',
    why: {
      'Your crew, if it can be done quickly': 'Speed is not approval; elevated work is the venue’s.',
      'The players, as they know the hoop': 'Players do not install equipment.',
    },
  },
  {
    id: 'cl.set.3',
    page: 'setups',
    prompt: 'A mic is wanted on the ice-facing side of the boards. What applies?',
    options: ['No hardware faces the ice', 'It is fine if it is low enough', 'It is fine if it is padded well'],
    correct: 'No hardware faces the ice',
    explain: 'The ice-facing surface stays smooth and unobstructed. Mics go at approved places outside the enclosure.',
    why: {
      'It is fine if it is low enough': 'Low hardware still faces the play.',
      'It is fine if it is padded well': 'Padding does not make an obstruction approved.',
    },
  },
  {
    id: 'cl.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · What is a shotgun laid on foam on the floor?',
    options: ['Not a boundary mic', 'A boundary mic, more or less', 'A better boundary mic'],
    correct: 'Not a boundary mic',
    explain: 'A boundary mic is a capsule in its intended geometry at a surface. A shotgun on foam is neither.',
    why: {
      'A boundary mic, more or less': 'Its capsule is not at the surface in a boundary geometry.',
      'A better boundary mic': 'It is not a boundary mic at all.',
    },
  },
  {
    id: 'cl.mic.1',
    page: 'microphone',
    prompt: 'Compared with many shotguns, a compact supercardioid gives you…',
    options: ['Broader aim tolerance, more spill', 'A narrower aim and much less spill', 'The same pattern at all frequencies'],
    correct: 'Broader aim tolerance, more spill',
    explain: 'A workable compromise when the contact point moves: easier to keep on target, more of the room. Check its real nulls and rear lobe.',
    why: {
      'A narrower aim and much less spill': 'That is closer to a shotgun at high frequencies.',
      'The same pattern at all frequencies': 'No real mic keeps one pattern at every frequency.',
    },
  },
  {
    id: 'cl.mic.2',
    page: 'microphone',
    prompt: 'A contact sensor on the boards records…',
    options: ['The structure’s vibration, not the air', 'The air near the boards, as an airborne mic would', 'The crowd behind the glass most of all'],
    correct: 'The structure’s vibration, not the air',
    explain: 'It hears the structure: thuds and resonance, exaggerated. Label it as such and compare it with an airborne feed.',
    why: {
      'The air near the boards, as an airborne mic would': 'It is not an airborne mic.',
      'The crowd behind the glass most of all': 'It hears what shakes the boards.',
    },
  },
  {
    id: 'cl.mic.3',
    page: 'microphone',
    prompt: 'What do you check before connecting a contact sensor?',
    options: ['Its input impedance and powering', 'Only that the connector fits', 'That phantom power is switched on'],
    correct: 'Its input impedance and powering',
    explain: 'Its documentation gives the interface and powering; no phantom power unless that documentation specifies it.',
    why: {
      'Only that the connector fits': 'A connector that fits does not prove compatibility.',
      'That phantom power is switched on': 'Not unless its documentation specifies it.',
    },
  },
  {
    id: 'cl.place.1',
    page: 'placement',
    prompt: 'From A to C with the gain unchanged, what changes most?',
    options: ['More room against the clap', 'Nothing but the meter reading', 'The clap gets brighter'],
    correct: 'More room against the clap',
    explain: 'C is more than twice as far as A: the clap is weaker against the same room. Compare at similar loudness, not by level.',
    why: {
      'Nothing but the meter reading': 'The balance of clap and room changes too.',
      'The clap gets brighter': 'Farther tends to be duller, not brighter.',
    },
  },
  {
    id: 'cl.place.2',
    page: 'placement',
    prompt: 'At B you turn the shotgun 30° off its axis. What do you note?',
    options: ['The tone and the spill, then re-aim', 'Nothing, as 30° is inside the lobe', 'A louder clap, then leave it there'],
    correct: 'The tone and the spill, then re-aim',
    explain: 'Note the tonal change, the coverage and the spill, then restore the aim — and draw no universal pattern from one frequency or voice.',
    why: {
      'Nothing, as 30° is inside the lobe': 'Off the axis the tone changes even inside a lobe.',
      'A louder clap, then leave it there': 'Off the axis is quieter, not louder.',
    },
  },
  {
    id: 'cl.place.3',
    page: 'placement',
    prompt: 'At a court, where is a perimeter mic aimed?',
    options: ['At the contact height', 'Straight at the floor', 'Over the players’ heads'],
    correct: 'At the contact height',
    explain: 'Point at the contact height of the named lane or basket area — not automatically at the floor.',
    why: {
      'Straight at the floor': 'The floor is only one of the contact heights.',
      'Over the players’ heads': 'That points at the crowd beyond.',
    },
  },
  {
    id: 'cl.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Where do the mics and observers stay in the practice?',
    options: ['Outside the line', 'Just inside the line', 'Wherever they can see'],
    correct: 'Outside the line',
    explain: 'Mics and observers in the outside zone; the source participant walks only in the cleared inside area.',
    why: {
      'Just inside the line': 'Inside is the source area.',
      'Wherever they can see': 'A view is not the rule; the zone is.',
    },
  },
  {
    id: 'cl.ctx.1',
    page: 'context',
    prompt: 'The capsule goes from 30 cm above a hard floor to the surface. The first notch…',
    options: ['Rises out of the audio band', 'Drops to a lower frequency', 'Stays exactly where it was'],
    correct: 'Rises out of the audio band',
    explain: 'The extra path shrinks to nothing at the surface, so the first notch climbs out of the audio band.',
    why: {
      'Drops to a lower frequency': 'A lower capsule has a shorter extra path — a higher notch.',
      'Stays exactly where it was': 'The notch follows the height.',
    },
  },
  {
    id: 'cl.ctx.2',
    page: 'context',
    prompt: 'Vibration dominates a rigidly clamped plant. A fair fix?',
    options: ['An isolated or independent mount', 'A steep high-pass filter on the plant', 'More gain, so the air sound wins'],
    correct: 'An isolated or independent mount',
    explain: 'A compatible suspension with a controlled cable loop, or an independently supported approved point. A filter cannot give back the missing perspective.',
    why: {
      'A steep high-pass filter on the plant': 'It removes body and leaves the vibration path.',
      'More gain, so the air sound wins': 'Gain raises the vibration too.',
    },
  },
  {
    id: 'cl.ctx.3',
    page: 'context',
    prompt: 'Peaks clip at the transmitter, but the converter reads −8 dBFS. What then?',
    options: ['Lower the gain where it clipped', 'Nothing: the converter has room', 'Pull the output fader down'],
    correct: 'Lower the gain where it clipped',
    explain: 'Inspect every stage separately. A fader, compressor, limiter or 32-bit file cannot repair clipping that already happened upstream.',
    why: {
      'Nothing: the converter has room': 'The clip happened before the converter.',
      'Pull the output fader down': 'A fader cannot undo an upstream clip.',
    },
  },
  {
    id: 'cl.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Why is a floor position a safety decision too?',
    options: ['Players can step on or trip on it', 'Floor mics are louder than others', 'The rules ban all floor mics'],
    correct: 'Players can step on or trip on it',
    explain: 'A floor mic and its cable sit where feet go. Only an authorized, protected place, beyond the required clearance.',
    why: {
      'Floor mics are louder than others': 'Level is not the safety question.',
      'The rules ban all floor mics': 'They are possible where expressly approved.',
    },
  },
  {
    id: 'cl.two.1',
    page: 'twoMic',
    prompt: 'Two mics overlap at B. Summed in mono it sounds hollow. Why?',
    options: ['Two arrival times make a comb', 'One mic is simply too loud', 'The mics are different brands'],
    correct: 'Two arrival times make a comb',
    explain: 'Each mic hears B at its own time; summed, a comb of notches — a hollow tone. Choose a dominant feed, or lower the redundant one.',
    why: {
      'One mic is simply too loud': 'Level sets the depth; the delay makes the notches.',
      'The mics are different brands': 'Identical mics comb just the same.',
    },
  },
  polarityDelay('cl.two.2'),
  {
    id: 'cl.two.3',
    page: 'twoMic',
    prompt: 'You align the pair for a clap at B. The play moves to A. Then?',
    options: ['The alignment no longer fits', 'It still fits: the mics did not move', 'It fits better: A is nearer'],
    correct: 'The alignment no longer fits',
    explain: 'A moving source changes the difference between paths; an alignment that helps at one point may worsen another. Document any static target you align.',
    why: {
      'It still fits: the mics did not move': 'The source moved; the paths changed.',
      'It fits better: A is nearer': 'Nearer changes the difference; it does not fix it.',
    },
  },
  {
    id: 'cl.prac.gain',
    page: 'practice',
    prompt: 'Where do you set the loudest repeatable test transient, as a starting point?',
    options: ['Around −12 dBFS, more margin if needed', 'Right at 0 dBFS, for the most signal level', 'Wherever the meter looks busy'],
    correct: 'Around −12 dBFS, more margin if needed',
    explain: 'Around −12 dBFS, then more margin when the real event is less predictable — a starting point, not a delivery standard.',
    why: {
      'Right at 0 dBFS, for the most signal level': 'The first real peak clips.',
      'Wherever the meter looks busy': 'Set it on the loudest repeatable transient.',
    },
  },
  {
    id: 'cl.prac.3',
    page: 'practice',
    prompt: 'What would justify an end sector or a plant?',
    options: ['A tested gap in the coverage', 'More mics will give a much bigger sound', 'Other venues use one there'],
    correct: 'A tested gap in the coverage',
    explain: 'Start with one action feed and ambience; add end sectors or approved plants only to fill a tested gap.',
    why: {
      'More mics will give a much bigger sound': 'More mics add overlap to manage.',
      'Other venues use one there': 'Another venue’s plan answers another venue’s gap.',
    },
  },
  {
    id: 'cl.mix.1',
    page: 'practice',
    prompt: 'Why might a floor boundary mic overstate footfalls?',
    options: ['The floor shakes with each step', 'It is aimed straight at the feet', 'Footfalls are the loudest sound'],
    correct: 'The floor shakes with each step',
    explain: 'Footfalls and impacts excite the mounting surface: the mic hears the floor’s vibration with the air.',
    why: {
      'It is aimed straight at the feet': 'A boundary mic is not aimed like that.',
      'Footfalls are the loudest sound': 'Contacts are louder; the floor carries the steps.',
    },
  },
  removeDelay('cl.mix.2'),
  {
    id: 'cl.mix.3',
    page: 'practice',
    prompt: 'The rink’s glass stands between the mic and the play. What do you assume?',
    options: ['Nothing — listen to what it does', 'It passes sound just like open air', 'It blocks the sound almost completely'],
    correct: 'Nothing — listen to what it does',
    explain: 'Glass can screen airborne sound and make reflections; a mic pressed to it may hear local vibration or crowd spill. Listen to the real installation.',
    why: {
      'It passes sound just like open air': 'Transparent to the eye is not transparent to sound.',
      'It blocks the sound almost completely': 'Check by listening — it screens, it does not silence.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'cl.sym.thud',
    observation: 'Thuds and rattles on the basket plant',
    firstChecks: 'Is the mount rigid? Is the cable bypassing the suspension?',
    options: ['Check the mount’s isolation', 'Raise the high-pass very high', 'Turn the plant up to hear more'],
    correct: 'Check the mount’s isolation',
    explain: 'A rigid clamp passes rattles and impacts. A compatible suspension, a controlled cable loop — or an independent approved support.',
    why: { 'Raise the high-pass very high': 'It removes body and leaves the vibration.', 'Turn the plant up to hear more': 'Gain raises the rattles too.' },
  },
  {
    id: 'cl.sym.comb',
    observation: 'A hollow tone when both sector mics are open',
    firstChecks: 'Do two open mics hear the same point at different times?',
    options: ['Choose a dominant feed per sector', 'Flip one mic’s polarity and leave it', 'Add more mics to fill it in'],
    correct: 'Choose a dominant feed per sector',
    explain: 'Overlapping feeds comb. Choose a dominant feed per sector, lower the redundant one, or hand off smoothly; check mono.',
    why: { 'Flip one mic’s polarity and leave it': 'Polarity does not remove the delay.', 'Add more mics to fill it in': 'More open mics, more combs.' },
  },
  {
    id: 'cl.sym.raised',
    observation: 'A comb-like colour on a mic just above the floor',
    firstChecks: 'How high is the capsule above the hard surface? Is it meant to be a boundary mic?',
    options: ['Use a true boundary, or raise it', 'EQ the notch out at the console', 'Turn the mic up to cover it'],
    correct: 'Use a true boundary, or raise it',
    explain: 'A capsule a little above the floor combs with its reflection. At the surface, in its intended geometry, the notch leaves the audio band.',
    why: { 'EQ the notch out at the console': 'The notches move with the source; EQ cannot follow them.', 'Turn the mic up to cover it': 'Gain keeps the comb in place.' },
  },
  {
    id: 'cl.sym.far',
    observation: 'The far end sounds distant and roomy',
    firstChecks: 'Which sector feed is nearest the action?',
    options: ['Use the other end’s sector feed', 'Turn the near mic up much more', 'Aim the near mic at the far end'],
    correct: 'Use the other end’s sector feed',
    explain: 'An end mic sounds close at one end and distant at the other: hand off to the other sector, with ambience under both.',
    why: { 'Turn the near mic up much more': 'Gain brings up the room with it.', 'Aim the near mic at the far end': 'It is still far away.' },
  },
  {
    id: 'cl.sym.cold',
    observation: 'No signal from the rink mics after load-in',
    firstChecks: 'Cold ratings for the capsule, battery, receiver and cables; condensation from warm, moist air.',
    options: ['Check cold ratings and condensation', 'Turn all the gains right up to maximum', 'Swap the mic for a louder one'],
    correct: 'Check cold ratings and condensation',
    explain: 'Confirm cold ratings and manage condensation by the equipment’s instructions; let equipment acclimate. A humidity claim is not waterproofing.',
    why: { 'Turn all the gains right up to maximum': 'Gain does not restore a dead link.', 'Swap the mic for a louder one': 'The cold or condensation would still be there.' },
  },
  {
    id: 'cl.sym.wind',
    observation: 'Outdoor tennis: rumble on the perimeter shotgun',
    firstChecks: 'Is the basket and fur fitted? Is the suspension working?',
    options: ['Fit the basket and fur', 'Tape over the tube’s side slots', 'Cut the low end hard in the mix'],
    correct: 'Fit the basket and fur',
    explain: 'A compatible wind suspension; never tape over the slots. Wind protection is not water resistance.',
    why: { 'Tape over the tube’s side slots': 'Covering the slots changes the mic.', 'Cut the low end hard in the mix': 'A deep cut leaves the wind overload.' },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'cl.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of the practice session in the order you would do them.',
    steps: [
      { text: 'Brief: roles, a stop command, the walking route and the exit', early: 'The brief and the survey come first.' },
      { text: 'Mark the line, A, B and C inside, M outside', early: 'Mark the geometry once everyone is briefed.' },
      { text: 'Compare the shotgun and compact mic at A, B and C', early: 'Compare once the marks are down.' },
      { text: 'Try 30° off the axis at B, and the walk from A to C', early: 'Angle and movement after the fixed comparison.' },
      { text: 'Compare the boundary mic on the floor', early: 'The floor comparison after the airborne one.' },
      { text: 'Compare a rigid and an isolated mount on the mock fixture', early: 'The fixture test comes later.' },
      { text: 'Test the overlap, a polarity check and the fallback', early: 'The overlap and fallback come last.' },
    ],
    explain: 'A sensible order: brief, geometry, airborne patterns, angle and movement, the floor, the fixture, then the overlap and fallback.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'cl.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A basketball broadcast: approved corner and end positions, the floor position refused, the basket plant not approved.',
    setups: [
      { id: 'a', label: 'Approved corner shotguns on the two baskets, plus ambience', ok: true, power: 'phantom', feedback: 'A recommended start: an end sector each, handed off as the attack moves.' },
      { id: 'b', label: 'One compact mic at an approved end, plus ambience', ok: true, power: 'phantom', feedback: 'A recommended start with fewer channels — the far end will be distant.' },
      { id: 'c', label: 'A small mic taped to the rim', ok: false, power: 'phantom', feedback: 'Not on the rim, the net or the breakaway — and the plant was not approved.' },
      { id: 'd', label: 'A boundary mic in the 2 m clear band', ok: false, power: 'phantom', feedback: 'The band is a clearance, and the floor position was refused.' },
      { id: 'e', label: 'A dish carried along the sideline', ok: false, power: 'phantom', feedback: 'A dish is bulky courtside, and moving along the line is not an approved place.' },
    ],
    reasons: [
      { id: 'r.approved', label: 'Every position is an approved one', role: 'required', feedback: 'Say where each mic is approved to be.' },
      { id: 'r.sector', label: 'Each end has its feed; the mix hands off', role: 'required', feedback: 'Say how the far end is covered.' },
      { id: 'r.amb', label: 'Ambience keeps the perspective between attacks', role: 'optional', feedback: 'A fair reason.' },
      BRAND_REASON('basketball court'),
      { id: 'r.floor', label: 'A low housing is safe in the band', role: 'wrong', feedback: 'Low profile does not mean safe for contact.' },
    ],
    explain: 'Two setups pass. What passes is the reasoning: approved positions, a feed per end, ambience between them — and the refused positions accepted.',
  },
  {
    id: 'cl.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · An ice hockey game: approved fixed positions outside the enclosure, the glass and boards to respect.',
    setups: [
      { id: 'a', label: 'Fixed mics at approved end and side places outside the glass', ok: true, power: 'phantom', feedback: 'A recommended start: sectors distributed round the rink, the glass checked by listening.' },
      { id: 'b', label: 'An approved elevated feed, plus ambience', ok: true, power: 'phantom', feedback: 'A fair start where the glass screens a low position — with qualified approval of the whole installation.' },
      { id: 'c', label: 'A handheld mic through a camera opening', ok: false, power: 'phantom', feedback: 'Camera openings are assigned facilities, not audio access.' },
      { id: 'd', label: 'A mic screwed to the ice-facing boards', ok: false, power: 'phantom', feedback: 'No exposed hardware faces the ice; never drill the boards.' },
      { id: 'e', label: 'A contact sensor as the only action feed', ok: false, power: 'phantom', feedback: 'It hears the structure, not the puck and skates in the air.' },
    ],
    reasons: [
      { id: 'r.outside', label: 'Everything stays outside the enclosure, approved', role: 'required', feedback: 'Say where each mic stands.' },
      { id: 'r.listen', label: 'The glass’s effect is checked by listening', role: 'required', feedback: 'Say how you check the glass.' },
      { id: 'r.cold', label: 'Cold ratings and condensation are managed', role: 'optional', feedback: 'A fair reason.' },
      BRAND_REASON('ice rink'),
      { id: 'r.glass', label: 'Clear glass passes sound like open air', role: 'wrong', feedback: 'Glass can screen sound and add reflections.' },
    ],
    explain: 'Two setups pass. What passes is the reasoning: outside the enclosure, approved, the glass judged by ear.',
  },
];

const predictions: Lesson['predictions'] = {
  meet: { prompt: 'Before you look: from M, how much farther is C than A?', options: ['More than twice as far', 'About the same', 'A little farther'], after: 'Now step through TARGET.' },
  microphone: { prompt: 'Which hears the boards’ vibration rather than the air?', options: ['A contact sensor', 'A short shotgun', 'An ambience pair'], after: 'Now step through each METHOD.' },
  placement: { prompt: 'Predict: you aim the shotgun at the floor in front of B instead of at the clap’s height. What changes?', options: ['It points under the source', 'Nothing', 'It gets louder'], after: 'Rest a mic in two zones and read what each one suggests.' },
  context: { prompt: 'A capsule 1 cm above a hard floor: where is the first notch for sound from straight above?', options: ['High in the treble', 'In the low bass', 'There is none'], after: 'Now try each HEIGHT.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then walk the source.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'meet',
    prompt: 'What is the 2 m band round a basketball court?',
    options: ['A clearance, not a crew strip', 'A crew strip beside the court', 'Space for floor mics only'],
    correct: 'A clearance, not a crew strip',
    explain: 'No obstruction within about 2 m — check your event’s rules.',
    why: { 'A crew strip beside the court': 'It is a clearance, not a place to set up.', 'Space for floor mics only': 'Floor mics go beyond it, where approved.' },
  },
  {
    id: 'q.2',
    covers: 'meet',
    prompt: 'Why does a capsule at the floor avoid the comb a raised mic gets?',
    options: ['Its two paths are equal', 'The floor absorbs the reflection', 'It hears only the direct sound'],
    correct: 'Its two paths are equal',
    explain: 'At the surface the direct and reflected paths are the same length.',
    why: { 'The floor absorbs the reflection': 'A hard floor reflects.', 'It hears only the direct sound': 'It hears both — arriving together.' },
  },
  {
    id: 'q.3',
    covers: 'meet',
    prompt: 'What does a rigid clamp on a structure add?',
    options: ['The structure’s vibration', 'Nothing beyond the air', 'Better high frequencies'],
    correct: 'The structure’s vibration',
    explain: 'Rattles and transmitted impacts come straight through a rigid clamp.',
    why: { 'Nothing beyond the air': 'A rigid clamp carries vibration.', 'Better high frequencies': 'It adds rattles, not detail.' },
  },
  {
    id: 'q.4',
    covers: 'setups',
    critical: true,
    prompt: 'Players and cleaners often cross a floor spot. You:',
    options: ['Reject it for the perimeter feed', 'Tape the cable and keep the spot', 'Keep it, as the housing is small'],
    correct: 'Reject it for the perimeter feed',
    explain: 'Reject a spot people routinely cross; low profile is not safe for contact.',
    why: { 'Tape the cable and keep the spot': 'Tape can still catch a shoe.', 'Keep it, as the housing is small': 'Small is not safe for a foot.' },
  },
  {
    id: 'q.5',
    covers: 'setups',
    critical: true,
    prompt: 'What may a mic be attached to on a basket?',
    options: ['Only an approved part, by venue staff', 'The rim, since it is solid and close', 'The net, since it is soft and light'],
    correct: 'Only an approved part, by venue staff',
    explain: 'Only an expressly approved part, on a reviewed fixture, installed by qualified venue personnel.',
    why: { 'The rim, since it is solid and close': 'Not the rim by default.', 'The net, since it is soft and light': 'Not the net by default.' },
  },
  {
    id: 'q.6',
    covers: 'setups',
    prompt: 'Before connecting a contact sensor you check:',
    options: ['Its impedance and powering', 'That the plug simply fits in', 'That the phantom power is on'],
    correct: 'Its impedance and powering',
    explain: 'From its documentation; no phantom power unless it says so.',
    why: { 'That the plug simply fits in': 'Fitting is not compatibility.', 'That the phantom power is on': 'Only if its documentation says so.' },
  },
];

export const B14_LESSON: Lesson = {
  id: 'B14',
  labId: 'broadcast',
  title: 'Court, Racket and Ice Sports',
  subtitle: 'Outside the clear space, aimed at the contact height: perimeter and compact mics, the floor boundary, approved plants — air kept apart from structure',
  noun: { one: 'court', many: 'courts', subject: 'the court' },
  model: B14_MODEL,
  micTypeIds: ['shotgunShort', 'scSupercard'],
  zones: B14_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Action sound at court, racket and ice sports — ball and racket contact, shoes, the puck and stick, skates, board impacts — followed without putting mics, cables or operators in the athletes’ way: basketball, indoor volleyball, tennis, badminton and ice hockey.', src: 'LESSON-B14' },
    { title: 'APPROVAL FIRST', text: 'Every position, mount and cable route is approved by the event. A credential, a low-profile housing or a photo of another broadcast is not approval; local permission cannot override a rule.', src: 'LESSON-B14' },
    { title: 'AIR AND STRUCTURE', text: 'Perimeter and compact mics, a floor boundary and approved plants hear the air; a contact sensor hears the structure. They are different perspectives — kept apart and labelled.', src: 'LESSON-B14' },
    { title: 'THE PRACTICE LINE', text: 'Here you practise at a mock boundary on an inactive dry floor: three source points inside, the mic mark outside. These are suggested starting points — experimentation is encouraged; your ears and the venue decide.', src: 'LESSON-B14' },
  ],
  sound: {
    stages: [
      { title: 'Heights and places', text: 'Contacts happen high and low — a serve or an attack above, shoes and bounces at the floor — and move across the court.' },
      { title: 'Distance', text: 'An end mic sounds close at one end and distant at the other: farther means more room against the action.' },
      { title: 'Air and structure', text: 'Floors, boards, posts and glass carry vibration as well as reflecting sound. A mic on them can hear the structure as much as the air.' },
    ],
    attack: 'Contacts — a bounce, a racket, a puck — are short: the clearest cue of where the action is.',
    body: 'The room, the crowd, the PA and the ventilation — the continuous bed under every rally.',
    head: { diameterMm: 0, rods: 0, label: 'the practice line', strikeSrc: 'LESSON-B14' },
  },
  setting: {
    items: [
      { id: 'room', label: 'the room, the crowd and the PA', short: 'ROOM · PA', note: 'Indoors, reflections and the PA reach every mic; audition the intended mic with the crowd and the PA running.', prov: { kind: 'illustrative', reason: 'the lesson L53, L110' }, tag: 'SPILL', scene: 'all' },
      { id: 'routes', label: 'benches, officials, ball persons, cleaners', short: 'PEOPLE', note: 'Their routes and places are occupied space: no stand, cable or plant in them — and keep the camera lines clear too.', prov: { kind: 'illustrative', reason: 'the lesson L85, L150' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'floor', label: 'the floor', short: 'FLOOR', note: 'A boundary position is an acoustic and a safety decision: an approved protected place on a suitable surface, beyond the clearance.', prov: { kind: 'illustrative', reason: 'the lesson L54–L63' }, tag: 'SAFETY', scene: 'all' },
      { id: 'structure', label: 'posts, baskets, boards and glass', short: 'STRUCTURE', note: 'They carry vibration and can screen sound; a plant needs express approval and an isolated, reviewed fixture.', prov: { kind: 'illustrative', reason: 'the lesson L64–L66, L125' }, tag: 'VIBRATION', scene: 'all' },
      { id: 'climate', label: 'cold, damp and outdoor weather', short: 'CLIMATE', note: 'At a rink, cold ratings and condensation; outdoors, a basket and fur — never tape over a shotgun’s slots.', prov: { kind: 'illustrative', reason: 'the lesson L144, L154–L156' }, tag: 'WEATHER', scene: 'all' },
    ],
    stage: 'Meter the real program output as well as the inputs — summing can make new peaks. Route only needed feeds to the PA, keep distant action and ambience out of loudspeaker loops, and verify the feedback margin with the venue engineer.',
    studio: 'A quiet, controlled session lets you change one placement variable at a time; a live venue fixes your access and overlaps crowd, PA and action. Prioritize secure, permitted positions and reliable handoffs.',
  },
  diagnostic,
  practice: {
    task: 'Put a practice session in order, choose and justify setups for a basketball broadcast and an ice hockey game, and say what would justify an end sector or a plant. With an approved practice, you can record what you tried below.',
    fields: [
      { id: 'sport', label: 'Sport, venue or mock area, rules', kind: 'text' },
      { id: 'target', label: 'Target sound and perspective', kind: 'text' },
      { id: 'mic', label: 'Mic', kind: 'choice', choices: ['short shotgun', 'compact directional', 'boundary', 'approved plant', 'contact sensor', 'ambience pair'] },
      { id: 'geom', label: 'Pattern and geometry (range, height, aim)', kind: 'text' },
      { id: 'peak', label: 'Peak and noise', kind: 'text' },
      { id: 'tone', label: 'Tone, coverage and choice', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The practice line (A, B and C 2, 5 and 8 m inside, M 3 m outside, about 1 m capsule and clap height) is the lesson’s own; the outside zone’s extent, the second mic place M2, the walking route and the ambience place are drawing defaults.', dims: [] },
    { text: 'The court and rink outlines are typical layouts drawn at common dimensions — not read from any rulebook; only the basketball band and the volleyball zone come from the rules read, said as typical clear zones.', dims: [] },
    { text: 'The boundary tool is a simplified picture: a perfectly hard, large floor, equal arrivals, no edges; the plant’s vibration path is drawn, never measured.', dims: [] },
    { text: 'The headroom chain’s event sizes and stage limits are an example, not a measurement of any equipment.', dims: [] },
  ],
  live: { wedges: [] },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every court, rink and event is different: get approval, listen, experiment, and trust your ears and the venue. The lab is silent and draws a simplified picture: the practice line is the lesson’s own; the courts are typical layouts; the floor reflection is an ideal hard floor; ranges and delays are calculated from the drawing; the headroom chain is an example. A sport’s clear zone is typical — check your event’s rules. Safety is exact: never into play or its clear space, only approved fixtures installed by qualified venue people, and never alter padding, glass, boards or nets.',
  copy: B14_COPY,
};
