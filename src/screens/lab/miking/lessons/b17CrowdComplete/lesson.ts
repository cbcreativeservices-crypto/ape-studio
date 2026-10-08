/**
 * B17 CROWD AND COMPLETE SPORTS COVERAGE — the lesson as DATA, written to the
 * 2026-10-07 journey (MEET IT and STARTING SETUPS given here). Words from the
 * owner's lesson (docs/labs/miking/source_text/B17-Crowd-and-Complete-
 * Sports-Coverage-Miking-Technique.txt; "L<n>" in comments only); research in
 * docs/labs/miking/crowd_complete/; corrections in CORRECTIONS_LOG.md
 * "Lab 7b · group 3" — institutional wording stripped (R-07), brands, models,
 * standards and rule numbers kept off the screen (R-08: the delivery numbers
 * said as "one delivery example — use your broadcaster's"), the lightning
 * rule and the rain-cover caution kept as the one sports safety card (R-09),
 * every channel count COMPUTED from the coverage planner's role table, never
 * typed (B17-01). Owner ruling 2026-10-04: suggested starting points, no
 * sources, brands or badges on screen. FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, polarityDelay, removeDelay } from '../shared/bowed/bowedItems.ts';
import { channelCount } from '../shared/sports/coverage.ts';
import { B17_MODEL } from './geometry.ts';
import { B17_ZONES } from './model.ts';
import { B17_COPY } from './copy.ts';

/** The minimal layout's mic channels — computed from the role table. */
const N_MIN = channelCount('minimal');

const pages: LessonPages = {
  meet: {
    title: 'Meet it — where the sound comes from',
    goal: 'Meet a whole sports picture from a microphone’s point of view: the action, the audience all round, the PA and the commentary — and how a viewpoint decides what each mic hears.',
    credit: { scenarios: ['cc.meet.1', 'cc.meet.2', 'cc.meet.3'], note: 'Answer the three checks on the viewpoint, one loud voice and a sport’s clearance.' },
    takeaway: 'Choose a stable viewpoint first, then the action that deserves detail. Crowd, PA and commentary reach every mic — the plan decides what each one is for.',
  },
  setups: {
    title: 'Starting setups',
    goal: 'See real starting setups drawn on the plans — a mono audience mic, an XY pair, a closer audience spot, an arena’s main ambience with its spots, Mid-Side — then what to settle before any mic goes up.',
    credit: { scenarios: ['cc.set.1', 'cc.set.2', 'cc.set.3'], interactive: 'setupsSeen', note: 'Look at every main setup on the drawing, and answer the three checks.' },
    takeaway: 'Commentary, action and audience as separately controllable feeds, from approved places — the audience bed first, spots only for a named gap.',
  },
  microphone: {
    title: 'The audience arrays',
    goal: 'Compare the audience pickups — one mono mic, XY, a near-coincident pair, spaced omnis, Mid-Side — and set a Mid-Side width while the mono sum stays put.',
    credit: { scenarios: ['cc.mic.1', 'cc.mic.2', 'cc.mic.3', 'cc.rec.1'], interactive: 'msWidth', note: 'Take the Mid-Side width from none to wide from two sources, and answer the four checks.' },
    takeaway: 'Each array trades width, mono safety and nearby noise differently. Choose by the coverage you need — and listen to every output.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and work the audience pair yourself in the mock venue — its viewpoint, its height and its aim — and hear the broad and the close perspective apart.',
    credit: { scenarios: ['cc.place.1', 'cc.place.2', 'cc.place.3', 'cc.rec.2'], interactive: 'twoZones', note: 'Rest the pair, in its footprint, in two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'A broad viewpoint carries the venue; a closer or lower one picks out nearby voices. Move only the pair’s centre, keep the source the same, and listen in mono too.',
  },
  context: {
    title: 'Live checks',
    goal: 'Plan the coverage — the roles, the minimal and extensive layouts, what survives each loss — route every feed where it belongs, and check the downmix and the delivery.',
    credit: { scenarios: ['cc.ctx.1', 'cc.ctx.2', 'cc.ctx.3', 'cc.rec.3'], interactive: 'liveChecks', note: 'Compare both layouts and run the failure drill, AND try every downmix, then answer the four checks.' },
    takeaway: 'Count channels from the roles, earn every extra input with a gap, keep the audience out of the PA, and hear every output — stereo, mono and downmix — before the event.',
  },
  twoMic: {
    title: 'Action and audience together',
    goal: 'The action mic and the audience pair hear one gentle clap at different times: watch the delay and the comb change as the clap moves 1 m, and what polarity does and does not change.',
    credit: { scenarios: ['cc.two.1', 'cc.two.2', 'cc.two.3'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND walk the clap, then answer the three checks.' },
    takeaway: 'A delay set for one point is wrong at the next; the room’s later arrival can be the perspective you want. Use a delay for a named, stationary problem only.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the viewpoint, the routing, the overlap and every stage first — then reach for processing.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a complete-coverage session in order, choose and justify a layout for two briefs, and say what earns an extensive layout its extra channels.',
    credit: { scenarios: ['cc.prac.order', 'cc.prac.gain', 'cc.prac.setup1', 'cc.prac.setup2', 'cc.prac.3', 'cc.mix.1', 'cc.mix.2', 'cc.mix.3'], note: 'Put the session in order, answer the gain check, complete both briefs, and answer the four reasoning cards. The worksheet is optional — it needs a real, approved practice.' },
    takeaway: 'Separately controllable roles, a stable audience bed, extra inputs only for tested gaps, every output heard and a fallback for every loss pass. More mics for their own sake do not.',
  },
};

/* THE CHECKS. Lesson lines in comments only: cc.meet.* L11, L41, L62 · cc.set.*
 * L216, L51, L105 · cc.mic.* L103, L102, L111–L112 · cc.place.* L227, L42, L85 ·
 * cc.ctx.* L16, L33, L147 · cc.two.* L229, L177 · cc.prac.* / cc.mix.* L225,
 * L35, L181, L231. */
const scenarios: MikingScenario[] = [
  {
    id: 'cc.meet.1',
    page: 'meet',
    prompt: 'Planning a whole sports picture, what do you settle first?',
    options: ['A stable viewpoint for the audience', 'The closest possible action detail', 'How many spare inputs the mixing desk has'],
    correct: 'A stable viewpoint for the audience',
    explain: 'Choose a stable main viewpoint first, then decide which action deserves closer detail. The close effect and the distant ambience need not match in distance — but together they should stay believable.',
    why: {
      'The closest possible action detail': 'Detail sits on top of a picture; it is not the picture.',
      'How many spare inputs the mixing desk has': 'Spare inputs are not a plan; roles are.',
    },
  },
  {
    id: 'cc.meet.2',
    page: 'meet',
    prompt: 'One loud spectator dominates the audience pair. What is the likeliest cause?',
    options: ['The pair is aimed at one nearby person', 'The pair is too far from the crowd', 'The pair’s gain has been set much too low'],
    correct: 'The pair is aimed at one nearby person',
    explain: 'Aim across a useful audience region rather than at the nearest person, from a broad enough viewpoint; keep the side and rear lobes in mind.',
    why: {
      'The pair is too far from the crowd': 'Farther away, one voice dominates less, not more.',
      'The pair’s gain has been set much too low': 'Gain raises every voice equally; it does not pick one out.',
    },
  },
  {
    id: 'cc.meet.3',
    page: 'meet',
    prompt: 'A court’s rules keep obstructions about 2 m from the playing area. What is that 2 m?',
    options: ['A sport’s clearance, not a mic place', 'The best distance for an action mic', 'A distance the event will then approve'],
    correct: 'A sport’s clearance, not a mic place',
    explain: 'A rule value is not a microphone permission: it is a clearance, not a recommended capsule distance — and the event may set larger ones. Every mount is still approved on its own.',
    why: {
      'The best distance for an action mic': 'A clearance says where nothing may be, not where a mic sounds best.',
      'A distance the event will then approve': 'Each event approves its own places; the rule is only a minimum.',
    },
  },
  {
    id: 'cc.set.1',
    page: 'setups',
    prompt: 'Thunder at an open stadium during setup. Where do you go?',
    options: ['A substantial building or hard-topped car', 'Under the open stand’s overhanging roof', 'Beside the camera platform’s scaffold'],
    correct: 'A substantial building or hard-topped car',
    explain: 'Shelter at once in a substantial building or a hard-topped vehicle. Follow the event’s stoppage, never delay to recover equipment, and wait 30 minutes after the last thunder.',
    why: {
      'Under the open stand’s overhanging roof': 'An open stand is not a safe lightning shelter.',
      'Beside the camera platform’s scaffold': 'A scaffold is not shelter — it can draw a strike.',
    },
  },
  {
    id: 'cc.set.2',
    page: 'setups',
    prompt: 'The best place for an audience spot blocks part of an aisle. What do you do?',
    options: ['Find another approved place', 'Keep it there, but tape the legs', 'Keep it there until the crowd arrives'],
    correct: 'Find another approved place',
    explain: 'No blocked seats, aisles, exits, accessibility routes, camera or advertising sightlines. A spot goes only where the venue approves it.',
    why: {
      'Keep it there, but tape the legs': 'Tape does not clear an aisle.',
      'Keep it there until the crowd arrives': 'An aisle must be clear whenever people can use it.',
    },
  },
  {
    id: 'cc.set.3',
    page: 'setups',
    prompt: 'The live crowd sounds thin. Someone suggests adding recorded cheers. In factual live coverage?',
    options: ['Leave them out: it is not the event', 'Add them quietly under the real crowd', 'Add them only at the big moments'],
    correct: 'Leave them out: it is not the event',
    explain: 'Never add invented cheers or unrelated audience reactions to factual live coverage. Improve the real pickup: the viewpoint, a justified spot, the balance.',
    why: {
      'Add them quietly under the real crowd': 'Quiet or not, it presents a reaction that did not happen.',
      'Add them only at the big moments': 'Those are the moments viewers trust most.',
    },
  },
  {
    id: 'cc.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · In the arena, what is the band round the court?',
    options: ['A clear band, not a crew strip', 'The place for the audience spots', 'Spare room for the commentary desk'],
    correct: 'A clear band, not a crew strip',
    explain: 'The clear band belongs to benches, officials and players chasing a ball. Audience spots and commentary have their own approved places.',
    why: {
      'The place for the audience spots': 'Spots go to approved places in the bowl, not on the floor’s edge.',
      'Spare room for the commentary desk': 'The commentary position is its own approved place.',
    },
  },
  {
    id: 'cc.mic.1',
    page: 'microphone',
    prompt: 'Which pair is likeliest to colour a PA announcement in the mono sum?',
    options: ['Spaced omnis', 'A coincident XY pair', 'A single mono mic'],
    correct: 'Spaced omnis',
    explain: 'Spaced mics hear a shared source at different times, so their mono sum can comb. A coincident pair has no arrival difference — check it anyway.',
    why: {
      'A coincident XY pair': 'Coincident capsules hear a source together: no arrival difference to comb.',
      'A single mono mic': 'One mic has nothing to sum with.',
    },
  },
  {
    id: 'cc.mic.2',
    page: 'microphone',
    prompt: 'You widen an M/S pair’s Side. What happens to the mono sum?',
    options: ['It stays the Mid alone', 'It gets louder and wider', 'It loses the centre'],
    correct: 'It stays the Mid alone',
    explain: 'Left = Mid + k × Side and Right = Mid − k × Side: halve their sum and the Side cancels — (L + R) ÷ 2 = Mid, whatever the width. With matched paths and opposite signs.',
    why: {
      'It gets louder and wider': 'Mono has no width, and the Side cancels in the sum.',
      'It loses the centre': 'The Mid is the centre, and it is all the sum keeps.',
    },
  },
  {
    id: 'cc.mic.3',
    page: 'microphone',
    prompt: 'A four-capsule surround mic gives four tracks. Do they need converting before playback?',
    options: ['Yes: they are not speaker feeds', 'No: each track is one loudspeaker', 'Only if the event is in stereo'],
    correct: 'Yes: they are not speaker feeds',
    explain: 'The four capsule signals need their own conversion before they map to loudspeakers; keep them on separate, matched tracks with linked gain, and keep the original labels.',
    why: {
      'No: each track is one loudspeaker': 'The raw capsule tracks are not left, right and surround channels.',
      'Only if the event is in stereo': 'Every delivery format needs the conversion first.',
    },
  },
  {
    id: 'cc.place.1',
    page: 'placement',
    prompt: 'You move the pair from S to S′, 1 m closer to U2. What do you expect?',
    options: ['Nearby voices come forward', 'A wider, calmer venue sound', 'No change, only louder'],
    correct: 'Nearby voices come forward',
    explain: 'A closer viewpoint picks out a local sector — the nearest voice, seat noise, movement — against the venue’s scale. Compare at matched loudness.',
    why: {
      'A wider, calmer venue sound': 'The broad, calm view is the farther one.',
      'No change, only louder': 'The balance changes, not only the level.',
    },
  },
  {
    id: 'cc.place.2',
    page: 'placement',
    prompt: 'You lower the pair from 1.5 m to about 1 m. A fair concern?',
    options: ['Heads block the far audience', 'It can no longer hear the PA', 'It hears the venue’s scale better'],
    correct: 'Heads block the far audience',
    explain: 'A lower position may bring the nearest voices forward and let bodies block the rest; a higher one hears a broader area but needs approved access.',
    why: {
      'It can no longer hear the PA': 'Lower does not hide the PA from it.',
      'It hears the venue’s scale better': 'A broader view usually comes from higher, not lower.',
    },
  },
  {
    id: 'cc.place.3',
    page: 'placement',
    prompt: 'The director cuts to a camera facing the other way. Do the audience channels swap?',
    options: ['Not by default: keep one perspective', 'They swap at each reverse-angle cut', 'They swap only for the replays'],
    correct: 'Not by default: keep one perspective',
    explain: 'Label left and right from the chosen viewpoint and agree on one production perspective; a reverse camera does not automatically require swapping the audience channels.',
    why: {
      'They swap at each reverse-angle cut': 'Swapping at every cut throws the audience back and forth.',
      'They swap only for the replays': 'Replays keep the agreed perspective too.',
    },
  },
  {
    id: 'cc.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What are the mock venue’s 2 m and 4 m?',
    options: ['The practice’s own layout', 'A stadium’s audience distance', 'The rule for a crowd mic'],
    correct: 'The practice’s own layout',
    explain: 'They are mock coordinates for a dry room; a real venue’s viewpoints come from its own approved plan.',
    why: {
      'A stadium’s audience distance': 'No practice distance carries into a stadium.',
      'The rule for a crowd mic': 'There is no universal crowd distance or stand height.',
    },
  },
  {
    id: 'cc.ctx.1',
    page: 'context',
    prompt: 'The minimal stereo example: one commentary mic, one action mic, one stereo audience pair. How many mic channels?',
    options: [`${N_MIN} mic channels`, `${N_MIN - 1} mic channels`, `${N_MIN + 2} mic channels`],
    correct: `${N_MIN} mic channels`,
    explain: 'Count by role: one for commentary, one for the action, two for the stereo pair. Line feeds, communications and spares are counted separately.',
    why: {
      [`${N_MIN - 1} mic channels`]: 'A stereo pair is two channels, not one.',
      [`${N_MIN + 2} mic channels`]: 'Only the mics count here; line feeds and spares are separate.',
    },
  },
  {
    id: 'cc.ctx.2',
    page: 'context',
    prompt: 'In the minimal layout, the action mic fails. What carries the event?',
    options: ['The audience pair', 'The commentary mic', 'Nothing until it is fixed'],
    correct: 'The audience pair',
    explain: 'The audience pair carries the venue’s identity when the action is lost. Plan the level so the change is not a jump — and never an unapproved plant as a stand-in.',
    why: {
      'The commentary mic': 'Commentary spill is not a venue bed.',
      'Nothing until it is fixed': 'The audience pair is there exactly for this.',
    },
  },
  {
    id: 'cc.ctx.3',
    page: 'context',
    prompt: 'Should the audience pair feed the venue’s PA?',
    options: ['Not by default: it is for broadcast', 'It should, to lift the room’s energy', 'Only during the quietest moments'],
    correct: 'Not by default: it is for broadcast',
    explain: 'Broadcast ambience does not enter a loudspeaker loop by default; any reinforcement is reviewed by the venue engineer at a safe level — never a feedback test.',
    why: {
      'It should, to lift the room’s energy': 'A crowd mic in the PA risks a loop and is not its job.',
      'Only during the quietest moments': 'Quiet moments are when a loop is easiest to start.',
    },
  },
  {
    id: 'cc.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · −23 LUFS is a measure of what?',
    options: ['The whole program’s loudness', 'A single input’s peak level', 'The crowd’s sound level in the air'],
    correct: 'The whole program’s loudness',
    explain: 'A delivery figure like −23 LUFS measures the program, not a single input; an input’s peak at a converter is a different meter, and neither is a hearing measurement.',
    why: {
      'A single input’s peak level': 'Input peaks are read in dBFS at the converter.',
      'The crowd’s sound level in the air': 'It measures the program, not the air in the venue.',
    },
  },
  {
    id: 'cc.two.1',
    page: 'twoMic',
    prompt: 'You align D and the pair on the clap at A, then the clap moves 1 m. What happens?',
    options: ['The alignment no longer fits', 'It still fits, as nothing moved', 'It improves as the clap moves'],
    correct: 'The alignment no longer fits',
    explain: 'The clap’s paths to D and to S change by different amounts, so a delay set at A is wrong 1 m away. Record why one-point compensation may not transfer.',
    why: {
      'It still fits, as nothing moved': 'The mics did not move; the clap did.',
      'It improves as the clap moves': 'Nothing brings the paths back into line by itself.',
    },
  },
  polarityDelay('cc.two.2'),
  {
    id: 'cc.two.3',
    page: 'twoMic',
    prompt: 'Should the whole audience bed be delayed to line up with one action transient?',
    options: ['Not usually: its later arrival is the room', 'It should, so each clap sounds tight', 'It should, by the largest delay found'],
    correct: 'Not usually: its later arrival is the room',
    explain: 'Do not delay all the ambience to make a local transient coincide: the later room arrival may be part of the intended perspective. Use a delay for a named, stationary problem.',
    why: {
      'It should, so each clap sounds tight': 'Tightening one clap loses the room’s perspective for the rest.',
      'It should, by the largest delay found': 'The largest delay fits one point and is wrong everywhere else.',
    },
  },
  {
    id: 'cc.prac.gain',
    page: 'practice',
    prompt: 'A gentle collective clap peaks at −26 dBFS; the real crowd will roar. Your gain?',
    options: ['The strongest gentle peak near −12 dBFS', 'The gentle clap brought right up to −3 dBFS', 'Left as it is, the files normalised later'],
    correct: 'The strongest gentle peak near −12 dBFS',
    explain: 'Strongest repeatable gentle input peaks near −12 dBFS is a trial, with more margin for the reactions a rehearsal cannot make. It is not a loudness target.',
    why: {
      'The gentle clap brought right up to −3 dBFS': 'Set on a gentle clap, the first real roar clips.',
      'Left as it is, the files normalised later': 'Normalising cannot fix a clip, or the noise of a gain set too low.',
    },
  },
  {
    id: 'cc.prac.3',
    page: 'practice',
    prompt: 'When does the extensive layout earn its extra channels?',
    options: ['When it covers a gap the minimal one lacks', 'Whenever the desk has enough unused inputs', 'When the event is a high-profile final'],
    correct: 'When it covers a gap the minimal one lacks',
    explain: 'Extra inputs earn their place through coverage the smaller layout demonstrably lacks — and bring more spill, peaks, cables and timing differences to manage.',
    why: {
      'Whenever the desk has enough unused inputs': 'Unused inputs are not a gap.',
      'When the event is a high-profile final': 'Profile is not a coverage gap.',
    },
  },
  {
    id: 'cc.mix.1',
    page: 'practice',
    prompt: 'A cheer sits only in the left channel. How does it come out in the mono sum M = (L + R) ÷ 2?',
    options: ['About 6 dB lower', 'At the same level', 'About 6 dB louder'],
    correct: 'About 6 dB lower',
    explain: 'Halving a sum where only one side carries the sound halves its level: about 6 dB down. Centre speech keeps its level — listen to what the mono version loses.',
    why: {
      'At the same level': 'Only a source equal in both channels keeps its level.',
      'About 6 dB louder': 'Summing one side with silence cannot make it louder.',
    },
  },
  removeDelay('cc.mix.2'),
  {
    id: 'cc.mix.3',
    page: 'practice',
    prompt: 'One side of the stereo audience pair fails mid-event. What do you send?',
    options: ['A known-good mono version', 'The one side, panned to centre', 'Nothing until the pair is fixed'],
    correct: 'A known-good mono version',
    explain: 'Use the verified mono or stereo fallback, and say which version failed; do not present one failed side of a pair as a stereo mix.',
    why: {
      'The one side, panned to centre': 'One side of a pair is a lopsided picture, not a verified version.',
      'Nothing until the pair is fixed': 'The bed has to continue; that is what the fallback is for.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'cc.sym.shout',
    observation: 'One shout dominates the audience',
    firstChecks: 'A local voice, the axis, the distance?',
    options: ['Lean on the broad ambience', 'Turn the whole audience bed down', 'Aim the spot straight at the shouter'],
    correct: 'Lean on the broad ambience',
    explain: 'Use the broad ambience, and revise the spot from an approved position — across a region, not at one person.',
    why: {
      'Turn the whole audience bed down': 'Then the venue goes with the shout.',
      'Aim the spot straight at the shouter': 'That makes the one voice the whole picture.',
    },
  },
  {
    id: 'cc.sym.gone',
    observation: 'The crowd disappears whenever the commentator speaks',
    firstChecks: 'Commentary spill, or an aggressive gate or compressor?',
    options: ['Keep an independent ambience bed', 'Gate the crowd harder still', 'Raise the commentary fader higher'],
    correct: 'Keep an independent ambience bed',
    explain: 'Keep the ambience independent of the speech, and review the speech pickup and its processing; a fast crowd gate makes the venue vanish between phrases.',
    why: {
      'Gate the crowd harder still': 'A harder gate makes the venue drop out more.',
      'Raise the commentary fader higher': 'More speech hides the crowd further.',
    },
  },
  {
    id: 'cc.sym.thin',
    observation: 'A thin mono, or a doubled PA announcement',
    firstChecks: 'Overlap, polarity, arrival differences, the decoder settings?',
    options: ['Reduce redundant feeds first', 'Boost the lows on the mix bus', 'Delay the whole audience bed'],
    correct: 'Reduce redundant feeds first',
    explain: 'Reduce redundant feeds and restore the known-good mapping; check the decoder and the polarity before anything else.',
    why: {
      'Boost the lows on the mix bus': 'EQ cannot undo a comb between feeds.',
      'Delay the whole audience bed': 'That fits one point and moves the room away from the picture.',
    },
  },
  {
    id: 'cc.sym.peak',
    observation: 'Peaks distort when the crowd erupts',
    firstChecks: 'Every input stage, and the summed and downmix buses?',
    options: ['Check each stage and the buses', 'Pull the master fader down a lot', 'Add a limiter on the output'],
    correct: 'Check each stage and the buses',
    explain: 'Reduce the gain where it overloads, or use suitable hardware and the fallback; a downmix can make new peaks, and a limiter cannot undo a clipped preamp.',
    why: {
      'Pull the master fader down a lot': 'The master fader cannot undo an input clip.',
      'Add a limiter on the output': 'A limiter after the clip cannot repair it.',
    },
  },
  {
    id: 'cc.sym.rumble',
    observation: 'Rumble from the wind, a rail or a cable',
    firstChecks: 'The protection, the mount, a cable bridging the isolation?',
    options: ['Check the protection and the mount', 'Cut all the lows below 150 Hz', 'Move the pair onto the rail itself'],
    correct: 'Check the protection and the mount',
    explain: 'Use sheltered, independent coverage; keep the cable from bridging the suspension. Processing is secondary — the crowd’s body lives in the lows.',
    why: {
      'Cut all the lows below 150 Hz': 'A deep cut removes the crowd’s body with the rumble.',
      'Move the pair onto the rail itself': 'A rail carries structure noise straight into the mic.',
    },
  },
  {
    id: 'cc.sym.lost',
    observation: 'An immersive channel goes silent',
    firstChecks: 'The cable labels, the powering, the converter inputs?',
    options: ['Switch to the verified fallback', 'Relabel another channel to fill it', 'Send the three channels left'],
    correct: 'Switch to the verified fallback',
    explain: 'Use the verified stereo or mono fallback and identify the failed version; do not silently relabel a channel or send an unverified subset.',
    why: {
      'Relabel another channel to fill it': 'A relabelled channel sends sound to the wrong place.',
      'Send the three channels left': 'An unverified subset is not a known-good version.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'cc.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of the practice session in the order you would do them.',
    steps: [
      { text: 'Draw the map, the footprints, the camera view and the access route', early: 'The map comes first.' },
      { text: 'Set up speech and the audience pair as the fallback', early: 'The fallback comes before the detail.' },
      { text: 'Gentle claps and a phrase at U1, U2, U3, then A, gain fixed', early: 'The baseline comes once the fallback is ready.' },
      { text: 'Compare XY and the near-coincident pair from the same centre', early: 'The arrays come after the baseline.' },
      { text: 'Try the closer viewpoint, then build the combined balance', early: 'The viewpoint and the mix come after the arrays.' },
      { text: 'Check the arrival and polarity between D and the pair', early: 'Arrival comes once the mix is built.' },
      { text: 'Listen to every output, fail each role, repeat the U2 baseline', early: 'The outputs, the failures and the repeat come last.' },
    ],
    explain: 'A sensible order: the map, the fallback, the baseline, the arrays, the viewpoint and the mix, the arrival — then every output, the failure drill and the repeat.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'cc.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A regional match in stereo: one commentator, one approved action place, few inputs, a small crew.',
    setups: [
      { id: 'a', label: 'A commentary mic, one action mic, one stereo audience pair', ok: true, power: 'phantom', feedback: 'A recommended start: the minimal stereo layout — speech, action and ambience each on its own fader.' },
      { id: 'b', label: 'A commentary mic, one action mic, one mono audience mic', ok: true, power: 'phantom', feedback: 'A recommended start for a mono production: less spatial information, the same separate roles.' },
      { id: 'c', label: 'The commentary mic alone, its spill as the crowd', ok: false, power: 'phantom', feedback: 'Commentary spill is not a venue bed: the crowd vanishes when the speech stops.' },
      { id: 'd', label: 'Two audience spots aimed at the loudest fans', ok: false, power: 'phantom', feedback: 'Aim across a region, not at the nearest people — and a main bed first.' },
      { id: 'e', label: 'A plant on the goal when the action place is refused', ok: false, power: 'phantom', feedback: 'If action pickup is denied, the wider venue feed is the fallback — never an unapproved plant.' },
    ],
    reasons: [
      { id: 'r.roles', label: 'Speech, action and audience are separately controllable', role: 'required', feedback: 'Say how each role stays on its own fader.' },
      { id: 'r.fallback', label: 'The audience pickup carries the event if the action is lost', role: 'required', feedback: 'Say what survives a loss.' },
      { id: 'r.mono', label: 'The stereo pair is checked in mono', role: 'optional', feedback: 'A fair reason.' },
      BRAND_REASON('stadium broadcast'),
      { id: 'r.more', label: 'More mics always make a fuller picture', role: 'wrong', feedback: 'More mics add spill, peaks and timing to manage.' },
    ],
    explain: 'Two setups pass. What passes is the reasoning: separate roles, a real audience bed, and a fallback that does not need an unapproved plant.',
  },
  {
    id: 'cc.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · An arena final: a large bowl, two commentators, a team to monitor the sums, approved high platforms.',
    setups: [
      { id: 'a', label: 'Two commentary inputs, four action sectors, a main ambience and two spots', ok: true, power: 'phantom', feedback: 'A recommended start: the extensive layout — where each extra input fills a gap the minimal one lacks, and an operator watches the sums.' },
      { id: 'b', label: 'The minimal layout plus one audience spot for a named gap', ok: true, power: 'phantom', feedback: 'A recommended start: grow the minimal layout only where listening found a gap.' },
      { id: 'c', label: 'A mic on every row of seats for the fullest crowd', ok: false, power: 'phantom', feedback: 'Mics everywhere add overlap and single points of failure, not coverage.' },
      { id: 'd', label: 'The four capsule tracks sent straight to four loudspeakers', ok: false, power: 'phantom', feedback: 'Capsule tracks need their conversion; they are not speaker feeds.' },
      { id: 'e', label: 'A main array hung by the crew from the roof truss', ok: false, power: 'phantom', feedback: 'Overhead rigging is an engineered installation by qualified venue staff — never improvised.' },
    ],
    reasons: [
      { id: 'r.gap', label: 'Every extra input fills a gap you can name', role: 'required', feedback: 'Say what each extra input covers.' },
      { id: 'r.survive', label: 'A surviving subset is planned for every loss', role: 'required', feedback: 'Say what survives each failure.' },
      { id: 'r.outputs', label: 'Stereo, mono and every downmix are heard', role: 'optional', feedback: 'A fair reason.' },
      BRAND_REASON('arena'),
      { id: 'r.cheers', label: 'Recorded cheers can fill a quiet bowl', role: 'wrong', feedback: 'Never add invented cheers to factual live coverage.' },
    ],
    explain: 'Two setups pass. What passes is the reasoning: each input earning its place, a surviving subset for every loss, and every output heard.',
  },
];

const predictions: Lesson['predictions'] = {
  meet: { prompt: 'Before you look: from S, which is farthest — the action or the audience?', options: ['The action at A', 'The audience', 'All the same'], after: 'Now step through TARGET.' },
  microphone: { prompt: 'Which pair keeps the mono sum the most solid?', options: ['A coincident XY pair', 'Spaced omnis', 'All the same'], after: 'Now step through each METHOD.' },
  placement: { prompt: 'Predict: the pair moves 1 m closer to the audience. What comes forward?', options: ['Nearby voices', 'The venue’s scale', 'Nothing'], after: 'Rest the pair in two zones and read what each one suggests.' },
  context: { prompt: 'In the minimal layout the action mic fails. What carries the event?', options: ['The audience pair', 'The commentary', 'Nothing'], after: 'Now run the failure drill.' },
  twoMic: { prompt: 'If you flip the pair’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then walk the clap.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'meet',
    prompt: 'What comes first in a complete sports picture?',
    options: ['A stable audience viewpoint', 'The closest action detail', 'The highest channel count'],
    correct: 'A stable audience viewpoint',
    explain: 'The viewpoint first; then the action that deserves detail, each role separately controllable.',
    why: { 'The closest action detail': 'Detail sits on a picture; it is not the picture.', 'The highest channel count': 'Channels follow roles and gaps, not the other way round.' },
  },
  {
    id: 'q.2',
    covers: 'meet',
    prompt: 'A sport’s 2 m obstruction clearance means what for a mic?',
    options: ['Nothing about where it goes', 'It is the best place for it', 'It is approved at 2 m'],
    correct: 'Nothing about where it goes',
    explain: 'A rule value is a clearance, not a mic distance or a permission.',
    why: { 'It is the best place for it': 'A clearance says where nothing goes.', 'It is approved at 2 m': 'Approval is the event’s, mount by mount.' },
  },
  {
    id: 'q.3',
    covers: 'meet',
    prompt: 'A source only in the left channel, summed to mono as (L + R) ÷ 2, comes out how?',
    options: ['About 6 dB lower', 'At the same level', 'Silent in mono'],
    correct: 'About 6 dB lower',
    explain: 'Halving a one-sided sum halves its level: about 6 dB down.',
    why: { 'At the same level': 'Only a centred source keeps its level.', 'Silent in mono': 'It is still there — just lower.' },
  },
  {
    id: 'q.4',
    covers: 'setups',
    critical: true,
    prompt: 'Thunder during an open-stadium setup. When do you go back out?',
    options: ['30 minutes after the last thunder', 'Once the rain has eased right off', 'When the strikes look far away'],
    correct: '30 minutes after the last thunder',
    explain: 'Shelter at once in a substantial building or a hard-topped vehicle; wait 30 minutes after the last thunder, under the event’s plan.',
    why: { 'Once the rain has eased right off': 'Lightning can strike after the rain eases.', 'When the strikes look far away': 'Distant-looking lightning can still strike.' },
  },
  {
    id: 'q.5',
    covers: 'setups',
    critical: true,
    prompt: 'An audience spot would block an emergency exit. What then?',
    options: ['Another approved place', 'Keep it, but tape it down', 'Keep it until the doors open'],
    correct: 'Another approved place',
    explain: 'No blocked seats, aisles, exits or accessibility routes — a spot goes only where the venue approves it.',
    why: { 'Keep it, but tape it down': 'Tape does not clear an exit.', 'Keep it until the doors open': 'An exit must be clear whenever people can be in the venue.' },
  },
  {
    id: 'q.6',
    covers: 'setups',
    prompt: 'Why keep commentary, action and audience on separate faders?',
    options: ['Each can be balanced alone', 'It halves the feedback risk', 'The rules ask for three'],
    correct: 'Each can be balanced alone',
    explain: 'Separate feeds let each be balanced, muted or replaced on its own — and a failure in one does not take the others down.',
    why: { 'It halves the feedback risk': 'Feedback is about routing, not fader count.', 'The rules ask for three': 'It is a production choice, not a rule.' },
  },
];

export const B17_LESSON: Lesson = {
  id: 'B17',
  labId: 'broadcast',
  title: 'Crowd and Complete Sports Coverage',
  subtitle: 'Commentary, action and audience as separate feeds: a stable audience bed, extra inputs only for real gaps, every output heard — and a fallback for every loss',
  noun: { one: 'venue', many: 'venues', subject: 'the venue' },
  model: B17_MODEL,
  micTypeIds: ['arrCard', 'shotgunShort'],
  zones: B17_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A complete sports sound picture from separately controllable commentary, action and audience feeds — minimal and extensive layouts, stereo and the outputs that come from it, and what survives the loss of detail.', src: 'LESSON-B17' },
    { title: 'ROLES, NOT A MIC COUNT', text: 'A main audience bed, audience spots where it leaves a gap, action detail from approved sectors, commentary on its own inputs. A layout earns its extra channels only by covering what a smaller one lacks.', src: 'LESSON-B17' },
    { title: 'EVERY OUTPUT HEARD', text: 'Stereo, the declared mono and every downmix get their own listen; input peaks are kept apart from program loudness; every event still needs its own rules, venue plan and approvals.', src: 'LESSON-B17' },
    { title: 'THE MOCK VENUE', text: 'Here you practise in a dry room laid out as a small venue: an action point, three audience places, the stereo centre and an action mic. These are suggested starting points — experimentation is encouraged; your ears and the room decide.', src: 'LESSON-B17' },
  ],
  sound: {
    stages: [
      { title: 'Many sources', text: 'Conversation, nearby voices, chants, applause and sudden reactions — plus the PA and music, strongly the same in every mic.' },
      { title: 'Near and far', text: 'The same pair hears the room’s diffuse tail and one clear nearby spectator. A full audience absorbs, adds noise and peaks in ways an empty room cannot.' },
      { title: 'Everything together', text: 'Commentary, action and audience need to stay intelligible and believable together — through quiet speech, excited speech, a crowd rise and a cue.' },
    ],
    attack: 'A collective reaction, a cue, an action transient — the peaks the program has to survive.',
    body: 'The audience bed — the venue’s identity under everything else.',
    head: { diameterMm: 0, rods: 0, label: 'the mock venue', strikeSrc: 'LESSON-B17' },
  },
  setting: {
    items: [
      { id: 'pa', label: 'the PA and music', short: 'PA · MUSIC', note: 'Announcements and music arrive in every mic at different times. Reduce redundant paths, re-aim from permitted points — and keep broadcast ambience out of the PA.', prov: { kind: 'illustrative', reason: 'the lesson L10, L147, L164–L166' }, tag: 'SPILL', scene: 'all' },
      { id: 'near', label: 'one nearby spectator', short: 'NEAR VOICE', note: 'A close voice, drinks, seats, an aisle: a closer or lower mic brings them forward. Aim across a region, not at a person.', prov: { kind: 'illustrative', reason: 'the lesson L41' }, tag: 'SPILL', scene: 'all' },
      { id: 'comm', label: 'commentary spill', short: 'COMMENTARY', note: 'The commentators reach the audience mics, and the crowd reaches theirs: keep the bed independent, so muting speech does not change the room.', prov: { kind: 'illustrative', reason: 'the lesson L129, L170–L172' }, tag: 'SPILL', scene: 'all' },
      { id: 'access', label: 'seats, aisles, exits and cameras', short: 'KEEP CLEAR', note: 'No blocked seats, aisles, exits, accessibility routes, camera or advertising sightlines — every platform and cable approved.', prov: { kind: 'illustrative', reason: 'the lesson L51, L152' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'speech', label: 'private and team speech', short: 'PRIVATE', note: 'A mic’s reach does not create permission to broadcast speech: protect private, medical and team communications.', prov: { kind: 'illustrative', reason: 'the lesson L152' }, tag: 'EDITORIAL', scene: 'all' },
      { id: 'weather', label: 'wind, rain and rails', short: 'WEATHER', note: 'Wind and handling eat headroom; a rail carries structure noise; a windscreen is not waterproofing, and a between-takes rain cover is not for recording.', prov: { kind: 'illustrative', reason: 'the lesson L190–L191' }, tag: 'WIND', scene: 'all' },
    ],
    stage: 'Speech at a conservative level first, then a stable ambience, then the action detail — checked through quiet narration, excited narration, a crowd rise and a cue. No fixed speech-to-crowd ratio: the audience, the venue and the delivery decide.',
    studio: 'An empty or quiet room cannot predict a full audience’s absorption, noise and reactions: the practice teaches the geometry and the routing, not the real crowd’s peaks.',
  },
  diagnostic,
  practice: {
    task: 'Put a complete-coverage session in order, choose and justify a layout for a regional match and an arena final, and say what earns the extensive layout its channels. With an approved practice, you can record what you tried below.',
    fields: [
      { id: 'view', label: 'Listening viewpoint, target and event approval', kind: 'text' },
      { id: 'array', label: 'Audience pickup', kind: 'choice', choices: ['mono mic', 'XY pair', 'near-coincident pair', 'spaced pair', 'Mid-Side', 'other'] },
      { id: 'geom', label: 'Heights, ranges, axes, spacing and angle', kind: 'text' },
      { id: 'peak', label: 'Peaks and spill', kind: 'text' },
      { id: 'image', label: 'Image, mono result and decision', kind: 'text' },
      { id: 'layout', label: 'Minimal or extensive plan, and its fallback', kind: 'text' },
      { id: 'outputs', label: 'Each output: heard, or only planned', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The mock venue’s action point, audience places, stereo centre, closer viewpoint, action mic and their heights are the lesson’s own; the footprints, the commentary station, the camera view, the access route and the audience’s 1.5 m mouth height are drawing defaults.', dims: [] },
    { text: 'The arena (court, bowl, PA cluster, platforms and spots) is a typical layout drawn at common dimensions, not read from any rulebook.', dims: [] },
    { text: 'The downmix and delivery figures are labelled examples; the coverage planner’s two layouts are the lesson’s own examples, their counts calculated.', dims: [] },
  ],
  live: { wedges: [] },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every venue, audience and broadcaster is different: get approval, listen to every output, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: the mock venue and its marks are the lesson’s own; the arena is a typical layout; ranges, delays, the M/S patterns and the downmix levels are calculated from the drawing and ideal patterns; the delivery card is one example — use your broadcaster’s. Safety is exact: no blocked seat, aisle or exit; no improvised overhead rigging; never provoke feedback; with thunder, shelter at once and wait 30 minutes after the last thunder.',
  copy: B17_COPY,
};
