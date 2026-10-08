/**
 * B13 FIELD AND DIAMOND SPORTS — the lesson as DATA, written to the
 * 2026-10-07 journey (MEET IT and STARTING SETUPS given here). Words from the
 * owner's lesson (docs/labs/miking/source_text/B13-Field-and-Diamond-Sports-
 * Miking-Technique.txt; "L<n>" in comments only); research in
 * docs/labs/miking/field_diamond/; corrections in CORRECTIONS_LOG.md "Lab 7b ·
 * group 2" — institutional wording stripped (R-07: the lesson’s school words →
 * "you", "practice", "the safety observer"), brands, models,
 * leagues and rule numbers kept off the screen (R-08: "check your event’s
 * rules"), the lightning rule and the rain-cover caution kept as one card
 * (R-09), the IFAB locator recorded internally (B13-01). Owner ruling
 * 2026-10-04: suggested starting points, no sources, brands or badges on
 * screen. FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, polarityDelay, removeDelay } from '../shared/bowed/bowedItems.ts';
import { B13_MODEL } from './geometry.ts';
import { B13_ZONES } from './model.ts';
import { B13_COPY } from './copy.ts';

const pages: LessonPages = {
  meet: {
    title: 'Meet it — where the sound comes from',
    goal: 'Meet field and diamond sports from a microphone’s point of view: where the action is, what keeps a mic out of it, and how distance and angle change what reaches a mic from an approved place.',
    credit: { scenarios: ['fd.meet.1', 'fd.meet.2', 'fd.meet.3'], note: 'Answer the three checks on approval, range and angle, and what a mic cannot do.' },
    takeaway: 'The action is brief and moving; the usable places are the approved ones. From there, distance and angle decide how much detail reaches a mic — no mic zooms.',
  },
  setups: {
    title: 'Starting setups',
    goal: 'See real starting setups drawn on the field and the diamond — a perimeter shotgun, an action mic over a fixed ambience bed, a plate-area shotgun behind the backstop, an ambience pair, a tracked dish — then what to settle before any mic goes up.',
    credit: { scenarios: ['fd.set.1', 'fd.set.2', 'fd.set.3'], interactive: 'setupsSeen', note: 'Look at every main setup on the drawing, and answer the three checks.' },
    takeaway: 'Start with a stable ambience bed and one prioritized action zone, each mic on an approved place with its axis on a named zone — and add a channel only for a tested gap.',
  },
  microphone: {
    title: 'The pickup methods',
    goal: 'Choose a pickup method by what it contributes and what limits it — a perimeter shotgun, a parabolic dish, fixed ambience, an approved structure mic — not by a label or a brand.',
    credit: { scenarios: ['fd.mic.1', 'fd.mic.2', 'fd.mic.3', 'fd.rec.1'], note: 'Answer the four checks (one reaches back to the sports).' },
    takeaway: 'Shotguns and dishes favour selected action; fixed pickup favours continuity. Each has a gap, and the plan names who covers it.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and work the mic yourself on the practice field — along the crew strip, its height and its aim — and see the range and the angle change as you move between A, B and C.',
    credit: { scenarios: ['fd.place.1', 'fd.place.2', 'fd.place.3', 'fd.rec.2'], interactive: 'twoZones', note: 'Rest the mic, on an approved place, in two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'From one approved mark, the targets differ in range and angle: aim into a named zone, change one thing at a time, and never move into the offset to get closer.',
  },
  context: {
    title: 'Live checks',
    goal: 'Plan the coverage — which zones get useful detail, which only ambience, which nothing, and who takes each handoff — then check the headroom of the whole chain, stage by stage.',
    credit: { scenarios: ['fd.ctx.1', 'fd.ctx.2', 'fd.ctx.3', 'fd.rec.3'], interactive: 'liveChecks', note: 'Tag every zone fairly on the coverage map AND set a chain with room for every event, then answer the four checks.' },
    takeaway: 'A coverage map with honest gaps and named handoffs, and a chain checked at every stage: the loudest safe rehearsal peak near −12 dBFS is a starting point, with more margin when the event can surprise you.',
  },
  twoMic: {
    title: 'Two mics, one moving play',
    goal: 'An action mic at M and the ambience at E hear the same play at different times: watch the delay and the comb change as the source walks from A to C, and what polarity does and does not change.',
    credit: { scenarios: ['fd.two.1', 'fd.two.2', 'fd.two.3'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND walk the source, then answer the three checks.' },
    takeaway: 'A delay set for one point is wrong at the next. Choose a dominant mic per zone or hand off smoothly, and check the sum in mono — polarity is not time alignment.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the aim, the range, the mount and the chain first — then reach for processing.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a practice session in order, choose and justify setups for two briefs, and say what would justify a second action mic.',
    credit: { scenarios: ['fd.prac.order', 'fd.prac.gain', 'fd.prac.setup1', 'fd.prac.setup2', 'fd.prac.3', 'fd.mix.1', 'fd.mix.2', 'fd.mix.3'], note: 'Put the session in order, answer the gain check, complete both briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real, approved practice.' },
    takeaway: 'Approved places, named zones, an ambience bed, honest gaps with handoffs, and a chain with room pass. A bigger dish or a higher gain do not — and more than one setup can pass.',
  },
};

/* THE CHECKS. Lesson lines in comments only: fd.meet.* L9, L35, L52 · fd.set.*
 * L114, L118, L52 · fd.mic.* L35–L44, L48–L49 · fd.place.* L141–L144 ·
 * fd.ctx.* L104–L106, L51 · fd.two.* L108 · fd.prac.* / fd.mix.* L96, L143. */
const scenarios: MikingScenario[] = [
  {
    id: 'fd.meet.1',
    page: 'meet',
    prompt: 'At a real match, what decides where a mic may go?',
    options: ['The event’s approval for that exact spot', 'The spot with the clearest view of the play', 'A spot your media credential lets you reach'],
    correct: 'The event’s approval for that exact spot',
    explain: 'Each position, mount and cable route is approved by the event. A credential does not approve a mount, and a rule still applies even if someone at the venue likes the spot.',
    why: {
      'The spot with the clearest view of the play': 'A good view is not permission — the best view is often in play or a route.',
      'A spot your media credential lets you reach': 'A credential lets you in; it does not approve a mount.',
    },
  },
  {
    id: 'fd.meet.2',
    page: 'meet',
    prompt: 'A shotgun at M is aimed at A (10 m ahead). The source moves to B (18.9 m, 32° left). What changes?',
    options: ['It is farther and well off the mic’s axis', 'It gets louder, because B is out to the side', 'Nothing, as long as the gain stays the same'],
    correct: 'It is farther and well off the mic’s axis',
    explain: 'Farther means quieter against the background; off the axis the tone changes, the higher frequencies first. Re-aim, or let another mic cover B.',
    why: {
      'It gets louder, because B is out to the side': 'A source off the axis is picked up less, not more.',
      'Nothing, as long as the gain stays the same': 'The gain is the same; the distance and the angle are not.',
    },
  },
  {
    id: 'fd.meet.3',
    page: 'meet',
    prompt: 'Can a dish or a shotgun make a far target sound close?',
    options: ['It cannot: neither one zooms the sound', 'It can, if the gain is raised enough', 'It can, once the mic is aimed exactly'],
    correct: 'It cannot: neither one zooms the sound',
    explain: 'Directional mics favour what is on their axis; they do not bring it closer. Raising the gain raises the background too.',
    why: {
      'It can, if the gain is raised enough': 'Gain raises the target and the background together.',
      'It can, once the mic is aimed exactly': 'Aim helps the balance; it does not change the distance.',
    },
  },
  {
    id: 'fd.set.1',
    page: 'setups',
    prompt: 'You hear thunder during the practice. Where do you go?',
    options: ['A substantial building or a hard-topped car', 'Under the team dugout until it has passed', 'The open rain shelter by the field'],
    correct: 'A substantial building or a hard-topped car',
    explain: 'Shelter at once in a substantial building or a hard-topped vehicle — dugouts and open rain shelters are not safe. Leave the equipment, and wait 30 minutes after the last thunder.',
    why: {
      'Under the team dugout until it has passed': 'A dugout is not a safe lightning shelter.',
      'The open rain shelter by the field': 'An open rain shelter is not a safe lightning shelter.',
    },
  },
  {
    id: 'fd.set.2',
    page: 'setups',
    prompt: 'The best-sounding spot for the dish is inside the 6 m practice offset. What do you do?',
    options: ['Stay on the crew strip and turn within the arc', 'Step in for a moment while play is on the far side', 'Move in, as long as a spotter stands beside you'],
    correct: 'Stay on the crew strip and turn within the arc',
    explain: 'Nothing goes into the offset: the operator stays on the approved place and turns only inside the marked arc. A better angle never justifies an unapproved position.',
    why: {
      'Step in for a moment while play is on the far side': 'Play changes direction in a moment; the offset stays clear.',
      'Move in, as long as a spotter stands beside you': 'A spotter does not make an unapproved place approved.',
    },
  },
  {
    id: 'fd.set.3',
    page: 'setups',
    prompt: 'Why start with an ambience bed plus one action zone?',
    options: ['Add channels only when a tested gap needs one', 'More fixed mics would only add feedback risk', 'A single action mic can cover the whole field well'],
    correct: 'Add channels only when a tested gap needs one',
    explain: 'Start with a stable ambience source and one prioritized action zone; add a channel when a tested gap justifies it. Raising gain does not repair an unfavourable place.',
    why: {
      'More fixed mics would only add feedback risk': 'Effects mics normally stay off the venue PA; the reason is the plan, not feedback.',
      'A single action mic can cover the whole field well': 'A view of the whole field is not coverage of it.',
    },
  },
  {
    id: 'fd.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic is wanted on a soccer goal’s net. What applies?',
    options: ['Nothing may be attached to it', 'It is fine if the clip is small', 'Only with the referee’s nod'],
    correct: 'Nothing may be attached to it',
    explain: 'Goals, nets and flagposts carry nothing extra — no mic, no camera. A goal-area pickup needs a separately approved place.',
    why: {
      'It is fine if the clip is small': 'Size does not matter: nothing is attached there.',
      'Only with the referee’s nod': 'A nod is not the rule; the rule says no attachments.',
    },
  },
  {
    id: 'fd.mic.1',
    page: 'microphone',
    prompt: 'Below the upper mids, how does a short shotgun’s pickup compare with its capsule’s own?',
    options: ['About the same as the capsule alone', 'Far narrower than the capsule alone', 'Wider than the capsule on its own'],
    correct: 'About the same as the capsule alone',
    explain: 'Through the lows and mids the tube does little: the shotgun hears like its capsule. Higher up its pickup narrows — so its rejection depends on frequency, and off the axis the tone changes.',
    why: {
      'Far narrower than the capsule alone': 'Only at higher frequencies does the tube narrow the pickup.',
      'Wider than the capsule on its own': 'The tube never widens the capsule’s pattern.',
    },
  },
  {
    id: 'fd.mic.2',
    page: 'microphone',
    prompt: 'Which capsule goes at a dish’s focus?',
    options: ['The one the dish’s maker specifies', 'A short shotgun, for the extra reach', 'A small cardioid that fits the mount'],
    correct: 'The one the dish’s maker specifies',
    explain: 'Use the collector’s own capsule type, focal reference and mount — some call for an omni. A shotgun at the focus by assumption is not the dish’s design.',
    why: {
      'A short shotgun, for the extra reach': 'A shotgun is not a dish element; follow the dish’s design.',
      'A small cardioid that fits the mount': 'Fitting is not the test; the maker’s specification is.',
    },
  },
  {
    id: 'fd.mic.3',
    page: 'microphone',
    prompt: 'What does a fixed ambience pair give that an action mic does not?',
    options: ['A steady sense of the venue', 'Sharper detail of each kick and call', 'Rejection of the PA from the sides'],
    correct: 'A steady sense of the venue',
    explain: 'Fixed ambience carries the venue and its audience through every play — continuity, with less action isolation.',
    why: {
      'Sharper detail of each kick and call': 'Detail is the action mics’ job.',
      'Rejection of the PA from the sides': 'A nearby PA can dominate an ambience pair.',
    },
  },
  {
    id: 'fd.place.1',
    page: 'placement',
    prompt: 'Going from A to C with the gain fixed, what do you expect?',
    options: ['Less target against more background', 'The same balance, only a bit quieter', 'More target, because C is straight ahead'],
    correct: 'Less target against more background',
    explain: 'C is more than twice as far as A: its direct sound is weaker against the same background. Compare at similar monitoring loudness, so louder is not mistaken for better.',
    why: {
      'The same balance, only a bit quieter': 'The target drops; the background does not drop with it.',
      'More target, because C is straight ahead': 'Straight ahead keeps it on the axis; it is still much farther.',
    },
  },
  {
    id: 'fd.place.2',
    page: 'placement',
    prompt: 'You lower the shotgun from about 1.2 m to about 0.6 m. What else needs to change?',
    options: ['Re-aim the axis at the same source', 'Nothing: the aim carries over unchanged', 'Raise the gain to make up for the height'],
    correct: 'Re-aim the axis at the same source',
    explain: 'A new height is a new angle to the source: re-aim at the same target, keep the support out of the source path, and change one thing at a time.',
    why: {
      'Nothing: the aim carries over unchanged': 'Lower, the old aim points over or past the source.',
      'Raise the gain to make up for the height': 'Height changes the angle; re-aim before touching gain.',
    },
  },
  {
    id: 'fd.place.3',
    page: 'placement',
    prompt: 'The dish is on the target, but turning further would leave the marked arc. What now?',
    options: ['Hand off to the fixed mic at the cue', 'Step out of the box for just that play', 'Lean out over the line to keep it on'],
    correct: 'Hand off to the fixed mic at the cue',
    explain: 'Stop at the arc’s edge and hand off at the rehearsed cue — to a fixed mic or the ambience. The operator stays in the assigned place.',
    why: {
      'Step out of the box for just that play': 'Leaving the box puts the operator in the way of play.',
      'Lean out over the line to keep it on': 'Leaning out still puts the dish into the space.',
    },
  },
  {
    id: 'fd.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What is the 6 m offset on the practice field?',
    options: ['The practice’s own layout, not a rule', 'The safe distance a sport’s rules set', 'The smallest distance a dish may work at'],
    correct: 'The practice’s own layout, not a rule',
    explain: 'It is this practice’s hypothetical layout — it may be made larger. A real event’s clearances come from its own rules and plan.',
    why: {
      'The safe distance a sport’s rules set': 'No sport’s rule is behind the 6 m.',
      'The smallest distance a dish may work at': 'It is not a dish limit; it is a training layout.',
    },
  },
  {
    id: 'fd.ctx.1',
    page: 'context',
    prompt: 'The converter’s meter looks fine, but the transmitter input clipped. What then?',
    options: ['The sound is already clipped', 'It is fine, as the meter shows', 'Lowering the fader will fix it'],
    correct: 'The sound is already clipped',
    explain: 'A clip upstream travels on: a later meter can look fine. Find the first overloaded stage and lower the gain there — the fader cannot undo it.',
    why: {
      'It is fine, as the meter shows': 'The last meter does not show an earlier clip.',
      'Lowering the fader will fix it': 'A low output fader does not undo upstream clipping.',
    },
  },
  {
    id: 'fd.ctx.2',
    page: 'context',
    prompt: 'As a starting point, where do you set the loudest safe rehearsal peak?',
    options: ['Near −12 dBFS, more margin if needed', 'Right at 0 dBFS, for the most signal', 'At −12 dBFS for the gentlest test clap'],
    correct: 'Near −12 dBFS, more margin if needed',
    explain: 'The loudest safe rehearsal peak near −12 dBFS at the digital input, with more margin when the event could be louder — a starting point, not a delivery standard.',
    why: {
      'Right at 0 dBFS, for the most signal': 'At 0 dBFS the first surprise clips.',
      'At −12 dBFS for the gentlest test clap': 'Set it on the loudest safe peak, not the gentlest.',
    },
  },
  {
    id: 'fd.ctx.3',
    page: 'context',
    prompt: 'On the coverage map, the far corner is outside the dish’s arc. How is it tagged?',
    options: ['Ambience only, its handoff noted', 'Useful detail, if the operator leans', 'Unavailable, so it needs no handoff'],
    correct: 'Ambience only, its handoff noted',
    explain: 'Mark what you cannot reach honestly — ambience only or unavailable — and name the source that covers it. Never step out of the arc to chase it.',
    why: {
      'Useful detail, if the operator leans': 'Leaning out of the arc is not an approved place.',
      'Unavailable, so it needs no handoff': 'Unavailable can be a fair tag — but every zone still names who covers it.',
    },
  },
  {
    id: 'fd.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Where may a dish operator stand?',
    options: ['On the approved place, clear of routes', 'Wherever the view of the play is easiest', 'Inside the run-off, if it looks quiet'],
    correct: 'On the approved place, clear of routes',
    explain: 'The operator, the dish, its support and its cable stay on the approved place — out of the play, the run-off and every route.',
    why: {
      'Wherever the view of the play is easiest': 'A view is not an approval.',
      'Inside the run-off, if it looks quiet': 'The run-off belongs to the players, quiet or not.',
    },
  },
  {
    id: 'fd.two.1',
    page: 'twoMic',
    prompt: 'The source walks from A toward C. What happens to the delay between M and E?',
    options: ['It changes as the source moves', 'It stays fixed once it is set', 'It goes to zero at the far end'],
    correct: 'It changes as the source moves',
    explain: 'The paths to the two mics change differently as the source moves, so the arrival difference changes too. A delay set for one point is wrong at the next.',
    why: {
      'It stays fixed once it is set': 'The mics stay put; the source does not.',
      'It goes to zero at the far end': 'Only a source equally far from both mics arrives together.',
    },
  },
  polarityDelay('fd.two.2'),
  {
    id: 'fd.two.3',
    page: 'twoMic',
    prompt: 'Both action channels are open and the attack sounds doubled. A fair first move?',
    options: ['Pick a dominant mic for that zone', 'Flip one mic’s polarity and leave it', 'Add a fixed delay for the whole match'],
    correct: 'Pick a dominant mic for that zone',
    explain: 'Prefer one dominant zone mic or a controlled handoff; check the sum in mono. Polarity is not time alignment, and a fixed delay is right at one point only.',
    why: {
      'Flip one mic’s polarity and leave it': 'Polarity flips the sign; the doubled arrival stays.',
      'Add a fixed delay for the whole match': 'The play moves; a fixed delay fits one point.',
    },
  },
  {
    id: 'fd.prac.gain',
    page: 'practice',
    prompt: 'A quiet rehearsal peaks at −30 dBFS; the match will be far louder. What do you do?',
    options: ['Set the loudest safe peak near −12 dBFS', 'Turn it up until the quiet peak hits −6', 'Leave it, and normalise the files later'],
    correct: 'Set the loudest safe peak near −12 dBFS',
    explain: 'Set the gain on the nearest, loudest credible event you can make safely, near −12 dBFS, and keep more margin for what the match adds. Never make a hazardous peak to test.',
    why: {
      'Turn it up until the quiet peak hits −6': 'Set on the quiet peak, the first loud one clips.',
      'Leave it, and normalise the files later': 'Normalising later cannot fix a clip — or the noise of a gain set too low.',
    },
  },
  {
    id: 'fd.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second action mic?',
    options: ['A tested gap in the coverage map', 'More channels make a bigger sound', 'The other crew has two of them'],
    correct: 'A tested gap in the coverage map',
    explain: 'A channel earns its place by filling a gap you tested — named on the coverage map, with its handoff.',
    why: {
      'More channels make a bigger sound': 'More channels add overlap to manage, not size.',
      'The other crew has two of them': 'Another crew’s plan answers another problem.',
    },
  },
  {
    id: 'fd.mix.1',
    page: 'practice',
    prompt: 'Why is foul territory on a diamond marked “may be live”?',
    options: ['A ball can arrive there in play', 'It is where the crew may set up', 'Only the umpire may walk there'],
    correct: 'A ball can arrive there in play',
    explain: 'Foul territory can still be in play: foul balls and throws arrive there. Check the park’s ground rules and every possible ball path.',
    why: {
      'It is where the crew may set up': 'Crew positions are approved separately — foul territory can be live.',
      'Only the umpire may walk there': 'It is about the ball, not who walks there.',
    },
  },
  removeDelay('fd.mix.2'),
  {
    id: 'fd.mix.3',
    page: 'practice',
    prompt: 'The shotgun is lowered to about 0.6 m. What is a fair concern?',
    options: ['It is easier to strike and hears grass', 'It can no longer hear the target at all', 'It becomes a boundary mic at that height'],
    correct: 'It is easier to strike and hears grass',
    explain: 'Low hardware is easier to strike and can collect splash or grass noise; it may also favour shoe and ball detail. Height is a trial.',
    why: {
      'It can no longer hear the target at all': 'Re-aimed, it still hears the target — from a new angle.',
      'It becomes a boundary mic at that height': 'A boundary mic needs its capsule at a large hard surface.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'fd.sym.thin',
    observation: 'The action sounds thin and distant',
    firstChecks: 'Is the axis on the target? Is the range what you think? Is the dish element at its focus?',
    options: ['Check the aim, the range and the focus', 'Boost the low end to restore the body', 'Turn the gain up until it sounds close'],
    correct: 'Check the aim, the range and the focus',
    explain: 'Off the axis, too far, or off the focus: each loses the high-frequency detail first. Fix the placement; gain raises the background too.',
    why: {
      'Boost the low end to restore the body': 'EQ cannot restore what the placement lost.',
      'Turn the gain up until it sounds close': 'Gain raises the background with the target.',
    },
  },
  {
    id: 'fd.sym.crowd',
    observation: 'One nearby spectator dominates the ambience',
    firstChecks: 'Is the pair at a place that represents the listening side? Is one voice or loudspeaker close to it?',
    options: ['Move the pair to an approved quieter spot', 'Turn the whole ambience bed down to zero', 'Point the action mic at the crowd instead'],
    correct: 'Move the pair to an approved quieter spot',
    explain: 'Choose an approved, protected place where no single spectator or loudspeaker dominates.',
    why: {
      'Turn the whole ambience bed down to zero': 'Then the continuity is gone too.',
      'Point the action mic at the crowd instead': 'The action mic’s job is the action.',
    },
  },
  {
    id: 'fd.sym.clip',
    observation: 'Peaks distort, though the output fader is low',
    firstChecks: 'Which stage overloads first: the capsule, the transmitter, the preamp, the converter?',
    options: ['Find the first stage that overloads', 'Lower the output fader a little further', 'Add a high-pass filter after the mixer'],
    correct: 'Find the first stage that overloads',
    explain: 'A clip upstream travels on; the fader only scales what already happened. Lower the gain at the first overloaded stage.',
    why: {
      'Lower the output fader a little further': 'A low output fader does not undo upstream clipping.',
      'Add a high-pass filter after the mixer': 'A filter cannot repair clipped audio.',
    },
  },
  {
    id: 'fd.sym.double',
    observation: 'A doubled attack with both action mics open',
    firstChecks: 'Do two mics hear the same transient at different times? Which one is dominant for this zone?',
    options: ['Pick one mic per zone, or hand off', 'Flip one mic’s polarity and keep it so', 'Set one fixed delay and leave it there'],
    correct: 'Pick one mic per zone, or hand off',
    explain: 'Two arrivals of one transient make a double attack or a hollow tone. Prefer a dominant zone mic or a controlled handoff; a fixed delay fits one point only.',
    why: {
      'Flip one mic’s polarity and keep it so': 'Polarity flips the sign; the two arrivals stay.',
      'Set one fixed delay and leave it there': 'The play moves; the delay that fits changes.',
    },
  },
  {
    id: 'fd.sym.wind',
    observation: 'Rumble and wind noise on the perimeter shotgun',
    firstChecks: 'Is the basket and fur fitted? Is the suspension working, the cable clear of it?',
    options: ['Check the windshield and its mount', 'Cut all the low end with a deep filter', 'Tape over the slots in the tube'],
    correct: 'Check the windshield and its mount',
    explain: 'Fit the basket and fur, keep the suspension working and the cable off it. Never tape over the tube’s slots — that changes the mic.',
    why: {
      'Cut all the low end with a deep filter': 'A deep cut removes the action’s body and leaves the cause.',
      'Tape over the slots in the tube': 'Covering the slots changes how the shotgun works.',
    },
  },
  {
    id: 'fd.sym.struck',
    observation: 'A perimeter mic was struck by the ball',
    firstChecks: 'Mute or withdraw it. Who can order withdrawal? When is there authorized safe access?',
    options: ['Mute it; inspect only in safe access', 'Walk out and fix it at the next stoppage', 'Leave it on and raise the other mics'],
    correct: 'Mute it; inspect only in safe access',
    explain: 'Its aim, mount and tone may have changed: mute or withdraw it, and inspect only during authorized safe access. A stoppage does not open the field to crew.',
    why: {
      'Walk out and fix it at the next stoppage': 'A stoppage does not authorize entering the field.',
      'Leave it on and raise the other mics': 'A moved mic may now point anywhere — mute it.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'fd.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of the practice session in the order you would do them.',
    steps: [
      { text: 'Confirm the rules, the approving person and each mark', early: 'Approval comes first.' },
      { text: 'Draw the no-entry areas, the arc, the camera, the PA and the way out', early: 'The plan comes before the equipment.' },
      { text: 'Build three feeds: a shotgun, the dish, the ambience', early: 'Build the feeds once the plan is drawn.' },
      { text: 'Set each gain on the loudest safe peak; log height, range, aim', early: 'Gain comes once the feeds are built.' },
      { text: 'Compare A, then B and C, then the aim offsets', early: 'Compare once the gains are set and logged.' },
      { text: 'Rehearse the walk from A to C and the handoff', early: 'The moving source comes after the fixed comparisons.' },
      { text: 'Rehearse a failure and announce the remaining gap', early: 'The failure drill comes last.' },
    ],
    explain: 'A sensible order: approval, the plan, the feeds, the gain, the comparisons, the movement, the failure. Phantom power: mute first and follow each item’s manual.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'fd.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A school soccer match: one operator, three channels, and the goal-area position refused.',
    setups: [
      { id: 'a', label: 'Fixed perimeter mics into the near and goal sectors, plus ambience', ok: true, power: 'phantom', feedback: 'A recommended start: overlapping fixed sectors and a bed — accept less isolated goal detail.' },
      { id: 'b', label: 'A dish from an approved place, plus a fixed ambience pair', ok: true, power: 'phantom', feedback: 'A recommended start, where the operator stays clear of officials, players and cameras.' },
      { id: 'c', label: 'A mic clipped to the goal net for the goalmouth', ok: false, power: 'phantom', feedback: 'Nothing is attached to goals, nets or flagposts.' },
      { id: 'd', label: 'The operator follows play along the touchline', ok: false, power: 'phantom', feedback: 'That is the officials’ and players’ space: stay on the approved place.' },
      { id: 'e', label: 'One shotgun aimed broadly at the whole pitch', ok: false, power: 'phantom', feedback: 'Aim into a named sector; a view of the field is not coverage of it.' },
    ],
    reasons: [
      { id: 'r.approved', label: 'Each mic stands on an approved place', role: 'required', feedback: 'Say where each mic is approved to be.' },
      { id: 'r.bed', label: 'The ambience carries what the action mics miss', role: 'required', feedback: 'Say what covers the gaps.' },
      { id: 'r.overlap', label: 'The sectors overlap a little', role: 'optional', feedback: 'A fair reason — check the overlap in mono.' },
      BRAND_REASON('soccer pitch'),
      { id: 'r.gain', label: 'More gain makes up for the distance', role: 'wrong', feedback: 'Gain raises the background too; it does not repair placement.' },
    ],
    explain: 'Two setups pass. What passes is the reasoning: approved places, named sectors, a bed under them, and the refused goal area accepted.',
  },
  {
    id: 'fd.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A baseball broadcast: bat contact wanted, with the backstop screening and foul territory to respect.',
    setups: [
      { id: 'a', label: 'A plate-area shotgun behind the backstop, plus ambience', ok: true, power: 'phantom', feedback: 'A recommended start: the capsule and support entirely on the protected side of the screen.' },
      { id: 'b', label: 'A dish from a protected place, chosen before the pitch', ok: true, power: 'phantom', feedback: 'A recommended start: choose the plate before the pitch, and hand off after contact.' },
      { id: 'c', label: 'A mic pushed through the netting toward the plate', ok: false, power: 'phantom', feedback: 'Never pass equipment through screening into live-ball space.' },
      { id: 'd', label: 'A stand in foul territory near first base', ok: false, power: 'phantom', feedback: 'Foul territory can be live: balls and throws arrive there.' },
      { id: 'e', label: 'Swing the dish after contact to catch the bat', ok: false, power: 'phantom', feedback: 'The bat’s transient has gone by then: choose before the pitch.' },
    ],
    reasons: [
      { id: 'r.protected', label: 'The mic and its support stay on the protected side', role: 'required', feedback: 'Say how it stays out of live-ball space.' },
      { id: 'r.both', label: 'Both batters’ sides and the catcher are tested', role: 'required', feedback: 'Say what you test.' },
      { id: 'r.amb', label: 'A separate ambience source keeps the atmosphere', role: 'optional', feedback: 'A fair reason.' },
      BRAND_REASON('baseball broadcast'),
      { id: 'r.close', label: 'Closer is always better for bat contact', role: 'wrong', feedback: 'Closer can mean live-ball space; the protected place comes first.' },
    ],
    explain: 'Two setups pass. What passes is the reasoning: the protected side, the plate chosen before the pitch, both batters tested, the atmosphere kept.',
  },
];

const predictions: Lesson['predictions'] = {
  meet: { prompt: 'Before you look: aimed at A, which target will the shotgun at M hear least clearly?', options: ['C, the farthest', 'B, off to the left', 'All three the same'], after: 'Now step through TARGET.' },
  microphone: { prompt: 'Which method gives the steadiest sense of the venue?', options: ['The fixed ambience pair', 'The tracked dish', 'The perimeter shotgun'], after: 'Now step through each METHOD.' },
  placement: { prompt: 'Predict: you lower the shotgun to about 0.6 m. What else do you change?', options: ['The aim', 'The gain', 'Nothing'], after: 'Rest the mic in two zones and read what each one suggests.' },
  context: { prompt: 'The converter reads −6 dBFS on the loudest peak. Is the chain safe?', options: ['It may not be', 'It is safe', 'Only with a low fader'], after: 'Now find the first overloaded stage.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then walk the source.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'meet',
    prompt: 'What decides whether a mic may stand at a spot at a match?',
    options: ['The event’s approval for that spot', 'A clear view of the play from it', 'Your media credential for the venue'],
    correct: 'The event’s approval for that spot',
    explain: 'Each position, mount and cable route is approved by the event; a credential does not approve a mount.',
    why: { 'A clear view of the play from it': 'A view is not permission.', 'Your media credential for the venue': 'A credential lets you in; it does not approve a mount.' },
  },
  {
    id: 'q.2',
    covers: 'meet',
    prompt: 'A target moves from 10 m to 20 m from the mic. About how much weaker is its direct sound?',
    options: ['About 6 dB weaker', 'About 20 dB weaker', 'No change at all'],
    correct: 'About 6 dB weaker',
    explain: 'Twice the distance, about 6 dB less direct sound in the open — while the background stays.',
    why: { 'About 20 dB weaker': 'Doubling the distance costs about 6 dB, not 20.', 'No change at all': 'Distance always matters to the direct sound; the gain is not the distance.' },
  },
  {
    id: 'q.3',
    covers: 'meet',
    prompt: 'How does a shotgun’s rejection behave?',
    options: ['It changes with frequency and angle', 'It is the same at all frequencies', 'It is strongest for the lowest notes'],
    correct: 'It changes with frequency and angle',
    explain: 'Through the lows and mids it hears like its capsule; higher up it narrows — so rejection and tone change with frequency and angle.',
    why: { 'It is the same at all frequencies': 'The tube matters only at higher frequencies.', 'It is strongest for the lowest notes': 'The lows are where the tube does least.' },
  },
  {
    id: 'q.4',
    covers: 'setups',
    critical: true,
    prompt: 'You hear thunder at the practice field. Where is safe?',
    options: ['A substantial building or hard-topped car', 'The dugout beside the practice field', 'An open rain shelter by the crew strip'],
    correct: 'A substantial building or hard-topped car',
    explain: 'Shelter at once; dugouts and open rain shelters are not safe. Wait 30 minutes after the last thunder.',
    why: { 'The dugout beside the practice field': 'A dugout is not a safe lightning shelter.', 'An open rain shelter by the crew strip': 'An open shelter is not a safe lightning shelter.' },
  },
  {
    id: 'q.5',
    covers: 'setups',
    critical: true,
    prompt: 'The play leaves the dish’s marked arc. What does the operator do?',
    options: ['Hand off, and stay in the box', 'Step out of the box for a moment', 'Lean past the line to keep it on'],
    correct: 'Hand off, and stay in the box',
    explain: 'The operator stays in the approved place and hands off at the rehearsed cue.',
    why: { 'Step out of the box for a moment': 'Leaving the box puts the operator in the way of play.', 'Lean past the line to keep it on': 'The dish then reaches into the space.' },
  },
  {
    id: 'q.6',
    covers: 'setups',
    prompt: 'Why keep commentary, action and ambience on separate channels?',
    options: ['Each can be balanced on its own', 'It halves the risk of feedback there', 'The rules ask for three channels'],
    correct: 'Each can be balanced on its own',
    explain: 'Independent channels let each be balanced, muted or handed off on its own.',
    why: { 'It halves the risk of feedback there': 'Feedback is about routing, not the number of channels.', 'The rules ask for three channels': 'It is a production choice, not a rule.' },
  },
];

export const B13_LESSON: Lesson = {
  id: 'B13',
  labId: 'broadcast',
  title: 'Field and Diamond Sports',
  subtitle: 'From an approved place: a perimeter shotgun on a named zone, a tracked dish, a fixed ambience bed — and an honest coverage map',
  noun: { one: 'field', many: 'fields', subject: 'the field' },
  model: B13_MODEL,
  micTypeIds: ['shotgunShort', 'spDish', 'arrCard'],
  zones: B13_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Action sound at field and diamond sports — kicks, contact, calls, bat and glove — picked up without putting a mic, a stand or an operator in the path of play: American football, soccer, rugby union, baseball and softball.', src: 'LESSON-B13' },
    { title: 'APPROVAL FIRST', text: 'At a real event the usable places come from the event’s approval, not from the best view. A credential does not approve a mount; a sport’s rule still applies if someone at the venue likes the spot.', src: 'LESSON-B13' },
    { title: 'THE METHODS', text: 'Approved perimeter shotguns aimed into named zones, a tracked dish for distant detail, fixed ambience for continuity — each covers some zones and hands off the rest. Commentary, interviews and players’ mics are separate sources.', src: 'LESSON-B13' },
    { title: 'THE PRACTICE FIELD', text: 'Here you practise on an inactive training field, with a comparison mark outside a 30 × 20 m rectangle and three targets inside. These are suggested starting points — experimentation is encouraged; your ears and the venue decide.', src: 'LESSON-B13' },
  ],
  sound: {
    stages: [
      { title: 'Brief and moving', text: 'Kicks, contact and calls are short, and they move. A mic aimed at one zone hears the next zone farther away and off its axis.' },
      { title: 'Distance and angle', text: 'Farther means weaker against the background; off the axis a directional mic’s tone changes, the higher frequencies first. No mic zooms.' },
      { title: 'Everything else', text: 'The crowd, the PA, benches and officials sound too. A mic hears whatever sits on its axis — the crowd beyond the player included.' },
    ],
    attack: 'Bat contact, a kick, a glove — short transients, the clearest cue of where the action is.',
    body: 'The crowd and the venue — the continuous bed under every play.',
    head: { diameterMm: 0, rods: 0, label: 'the practice field', strikeSrc: 'LESSON-B13' },
  },
  setting: {
    items: [
      { id: 'crowd', label: 'the crowd and nearby spectators', short: 'CROWD', note: 'Crowd sound reaches every mic. Put the loudest sector off a shotgun’s axis where an approved angle allows; one nearby spectator can dominate an ambience pair.', prov: { kind: 'illustrative', reason: 'the lesson L46, L49' }, tag: 'SPILL', scene: 'all' },
      { id: 'pa', label: 'the venue PA', short: 'PA', note: 'Announcements and music arrive from the loudspeakers. Keep the PA off the axis where you can, and keep broadcast effects out of the PA’s own feed.', prov: { kind: 'illustrative', reason: 'the lesson L46, L110' }, tag: 'SPILL', scene: 'all' },
      { id: 'bench', label: 'benches, officials and crews', short: 'PEOPLE', note: 'They block the view and the sound, and their routes are never a place for a stand or a cable. Intelligible tactical speech is not automatically for broadcast.', prov: { kind: 'illustrative', reason: 'the lesson L55, L66' }, tag: 'IN THE WAY', scene: 'all' },
      { id: 'camera', label: 'the cameras', short: 'CAMERAS', note: 'A mic hidden from one camera may sit in another’s frame. Camera positions are assigned facilities, not general audio access.', prov: { kind: 'illustrative', reason: 'the lesson L113' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'ball', label: 'the ball', short: 'THE BALL', note: 'A low or close mic can be struck. Foul territory can be live; nothing goes through screening into live-ball space.', prov: { kind: 'illustrative', reason: 'the lesson L47, L94–L96' }, tag: 'STRIKE RISK', scene: 'all' },
      { id: 'weather', label: 'wind and rain', short: 'WEATHER', note: 'A basket and fur with a working suspension; the cable clear of it; never tape over a shotgun’s slots. A windscreen is not waterproof.', prov: { kind: 'illustrative', reason: 'the lesson L112–L113' }, tag: 'WIND', scene: 'all' },
    ],
    stage: 'Commentary, action and ambience stay on separate channels, each controllable on its own; effects normally stay off the venue PA and the team and officials’ communications. Check the action’s sync at the real program destination after camera cuts and replays.',
    studio: 'A quiet practice allows repeatable sources and one change at a time — but it never proves stadium isolation: a match adds peaks, crowd and PA spill, camera cuts and restricted movement.',
  },
  diagnostic,
  practice: {
    task: 'Put a practice session in order, choose and justify setups for a soccer match and a baseball broadcast, and say what would justify a second action mic. With an approved practice, you can record what you tried below.',
    fields: [
      { id: 'event', label: 'Event or layout, rules and approving person', kind: 'text' },
      { id: 'target', label: 'Target sound and intended perspective', kind: 'text' },
      { id: 'method', label: 'Method', kind: 'choice', choices: ['perimeter shotgun', 'parabolic dish', 'fixed ambience', 'approved structure mic', 'other'] },
      { id: 'pos', label: 'Position, range, height and aim', kind: 'text' },
      { id: 'balance', label: 'Detail against background, and tone', kind: 'text' },
      { id: 'peak', label: 'Peak, headroom and fallback', kind: 'text' },
      { id: 'coverage', label: 'Coverage map and handoffs', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The practice field (30 × 20 m), the mark M (15, −6), the targets A, B and C and the shotgun’s two heights are the lesson’s own; the crew strip, the ambience mark E, the crowd mark, the camera, the cable route, the way out and the turn arc are drawing defaults.', dims: [] },
    { text: 'The targets stand at a talker’s mouth height (1.55 m), the dish’s axis at 1.3 m and the ambience at 1.5 m — drawing defaults; the lesson asks you to measure the slant range to the real source height.', dims: [] },
    { text: 'The sport outlines (fields, diamonds, run-off, routes, approved places, cameras, crowds) are typical layouts drawn at common dimensions — not read from any rulebook; only the rugby perimeter and the soccer no-attaching rule come from the rules read.', dims: [] },
    { text: 'The headroom chain’s event sizes and each stage’s limit are an example, not a measurement of any equipment.', dims: [] },
    { text: 'The dish is drawn from derived dimensions (a 660 mm rim); its pattern is not drawn as a lobe.', dims: [] },
  ],
  live: { wedges: [] },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every venue and event is different: get approval, listen, experiment, and trust your ears and the venue. The lab is silent and draws a simplified picture: the practice field and its marks are the lesson’s own; the sport outlines, the crew strip, the ambience mark and the camera are typical layouts; ranges and delays are calculated from the drawing; the headroom chain is an example. A sport’s clear zone is typical — check your event’s rules. Safety is exact: never into play, the run-off or a route; with thunder, shelter at once — dugouts and open rain shelters are not safe — and wait 30 minutes after the last thunder.',
  copy: B13_COPY,
};
