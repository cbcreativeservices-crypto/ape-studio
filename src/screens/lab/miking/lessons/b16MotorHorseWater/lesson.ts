/**
 * B16 MOTORSPORT, EQUESTRIAN AND AQUATIC EVENTS — the lesson as DATA, written
 * to the 2026-10-07 journey (MEET IT and STARTING SETUPS given here). Words
 * from the owner's lesson (docs/labs/miking/source_text/B16-Motorsport-
 * Equestrian-and-Aquatic-Events-Miking-Technique.txt; "L<n>" in comments
 * only); research in docs/labs/miking/motorsport_equestrian_aquatic/;
 * corrections in CORRECTIONS_LOG.md "Lab 7b · group 3" — institutional
 * wording stripped (R-07), brands, models, federations and rule numbers kept
 * off the screen (R-08), the lightning rule and the rain-cover caution kept
 * as the one sports safety card (R-09), the practice room shared with B15
 * (B15-01), the water and air dB references kept internal (B16-01) and the
 * hydrophone's sensitivity unit recorded (B16-02). Owner ruling 2026-10-04:
 * suggested starting points, no sources, brands or badges on screen. FULLY
 * SILENT. No pitch or speed number anywhere (L257).
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, removeDelay } from '../shared/bowed/bowedItems.ts';
import { B16_MODEL } from './geometry.ts';
import { B16_ZONES } from './model.ts';
import { B16_COPY } from './copy.ts';

const pages: LessonPages = {
  meet: {
    title: 'Meet it — where the sound comes from',
    goal: 'Meet motorsport, equestrian and aquatic events from a microphone’s point of view: a source that moves past a fixed place, what keeps a mic out of its way, and how distance and angle change along its path.',
    credit: { scenarios: ['mo.meet.1', 'mo.meet.2', 'mo.meet.3'], note: 'Answer the three checks on approval, a passing source and a closed arena.' },
    takeaway: 'The source moves; the mic does not. Its distance, its angle and its own state change together — and the usable places are the approved ones.',
  },
  setups: {
    title: 'Starting setups',
    goal: 'See real starting setups drawn on the plans — a fixed shotgun at a circuit’s media point, two mics on one walking source, a perimeter mic on a landing region, a stereo pair across a pool, and the optional hydrophone — then what to settle before any mic goes up.',
    credit: { scenarios: ['mo.set.1', 'mo.set.2', 'mo.set.3'], interactive: 'setupsSeen', note: 'Look at every main setup on the drawing, and answer the three checks.' },
    takeaway: 'Start from the organizer’s approved places with one fixed sector and a stable ambience; no mic on an animal, a barrier or the officiating systems.',
  },
  microphone: {
    title: 'The pickup methods',
    goal: 'Choose a pickup method by the perspective it gives — a fixed directional, mono ambience, coincident or spaced stereo, an optional hydrophone — and know what each costs.',
    credit: { scenarios: ['mo.mic.1', 'mo.mic.2', 'mo.mic.3', 'mo.rec.1'], note: 'Answer the four checks (one reaches back to the venues).' },
    takeaway: 'Choose a complete system for the target: response, pattern, output and the next stage’s limit — and a medium (air or water) on purpose.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and work the mic yourself in the practice room — its place, its height, and its aim across the walk or along it — and see the range and the angle change.',
    credit: { scenarios: ['mo.place.1', 'mo.place.2', 'mo.place.3', 'mo.rec.2'], interactive: 'twoZones', note: 'Rest the mic, in its equipment area, in two different suggested starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Aimed across, a short strong sector; aimed along, a longer one with more of what lies beyond. Change one thing at a time from an approved place.',
  },
  context: {
    title: 'Live checks',
    goal: 'Plan the coverage of a moving source with honest gaps and handoffs, then check the headroom of the whole chain for the nearest pass.',
    credit: { scenarios: ['mo.ctx.1', 'mo.ctx.2', 'mo.ctx.3', 'mo.rec.3'], interactive: 'liveChecks', note: 'Tag every zone fairly on the coverage map AND set a chain with room for every event, then answer the four checks.' },
    takeaway: 'Name what each sector covers and who takes over; give the nearest pass its headroom at every stage — never approach a source to test it.',
  },
  twoMic: {
    title: 'A source passing by',
    goal: 'Walk one source past two fixed mics: see each mic’s level rise and fall along the path, the aim across or along it, and the delay between the mics change from point to point.',
    credit: { scenarios: ['mo.two.1', 'mo.two.2', 'mo.two.3'], interactive: 'passBy', note: 'Walk the source from end to end AND try both aims, then answer the three checks.' },
    takeaway: 'A fixed mic covers a moving source well over part of its path; two mics stay in time only where their paths are equal. Choose a dominant feed per sector — not one delay for every point.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the stage that overloads, the mount, the overlap and the path first — then reach for processing.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a practice session in order, choose and justify setups for two briefs, and say what would justify another detail channel.',
    credit: { scenarios: ['mo.prac.order', 'mo.prac.gain', 'mo.prac.setup1', 'mo.prac.setup2', 'mo.prac.3', 'mo.mix.1', 'mo.mix.2', 'mo.mix.3'], note: 'Put the session in order, answer the gain check, complete both briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real, approved practice.' },
    takeaway: 'Approved places, a fixed sector and a stable ambience, headroom for the nearest pass, dry connectors and calm around animals pass. A closer position or a louder test do not.',
  },
};

/* THE CHECKS. Lesson lines in comments only: mo.meet.* L61, L59, L114 · mo.set.*
 * L240, L134, L167–L168 · mo.mic.* L55, L55, L192 · mo.place.* L63, L63, L269 ·
 * mo.ctx.* L90, L69, L122 · mo.two.* L255, L257, L271 · mo.prac.* / mo.mix.*
 * L267, L196, L133. */
const scenarios: MikingScenario[] = [
  {
    id: 'mo.meet.1',
    page: 'meet',
    prompt: 'A pass-by sounds better 20 m past your assigned media point. What do you do?',
    options: ['Stay at the assigned point', 'Move there between two cars', 'Go once a marshal nods it through'],
    correct: 'Stay at the assigned point',
    explain: 'Use the organizer’s assigned positions and follow the marshals. A better-sounding pass-by never justifies a self-chosen trackside place or movement.',
    why: {
      'Move there between two cars': 'A gap between cars is not a released period — the track is live.',
      'Go once a marshal nods it through': 'A nod is not an approved installation; the plan assigns the places.',
    },
  },
  {
    id: 'mo.meet.2',
    page: 'meet',
    prompt: 'A fixed mic hears a car’s tone change as it passes. What is the likeliest reason?',
    options: ['Distance, angle and engine state all change', 'The mic is faulty and needs replacing now', 'Ignition noise getting into the mic’s cable'],
    correct: 'Distance, angle and engine state all change',
    explain: 'A stationary mic hears the distance and the angle change, the Doppler drop in pitch as the car passes, and the engine’s operating state: an apparent tone change is not automatically a mic fault.',
    why: {
      'The mic is faulty and needs replacing now': 'The change is expected from the geometry and the engine — check those first.',
      'Ignition noise getting into the mic’s cable': 'Interference is possible but is not the first explanation for a passing tone change.',
    },
  },
  {
    id: 'mo.meet.3',
    page: 'meet',
    prompt: 'A horse is competing in the jumping arena. Where may the crew be?',
    options: ['Outside the closed arena', 'At the gate, holding it open', 'Inside, beside a quiet fence'],
    correct: 'Outside the closed arena',
    explain: 'The arena is closed while a horse competes; its gates stay shut and clear. Equipment never blocks a gate, and nobody enters to adjust a mic.',
    why: {
      'At the gate, holding it open': 'The entrances and exits stay closed while a horse competes.',
      'Inside, beside a quiet fence': 'No fence is quiet: the course plan sends the horse everywhere.',
    },
  },
  {
    id: 'mo.set.1',
    page: 'setups',
    prompt: 'Thunder at an outdoor circuit. Where do you go?',
    options: ['A substantial building or hard-topped car', 'Under the open canopy over the media point', 'Beside the barrier, away from the cars'],
    correct: 'A substantial building or hard-topped car',
    explain: 'Shelter at once in a substantial building or a hard-topped vehicle; open shelters are not safe. Leave the equipment, follow the event’s stoppage, and wait 30 minutes after the last thunder.',
    why: {
      'Under the open canopy over the media point': 'An open canopy is not a safe lightning shelter.',
      'Beside the barrier, away from the cars': 'Being away from the cars is not shelter from lightning.',
    },
  },
  {
    id: 'mo.set.2',
    page: 'setups',
    prompt: 'A plant near the fence was refused. Someone suggests a mic on the bridle. What then?',
    options: ['Use a perimeter feed instead', 'A small clip mic on the bridle', 'A mic on the rider’s jacket'],
    correct: 'Use a perimeter feed instead',
    explain: 'Never a mic on a horse, its tack or its rider as a stand-in for a refused plant. Use an approved perimeter feed or the wider coverage.',
    why: {
      'A small clip mic on the bridle': 'No mic goes on a horse or its tack.',
      'A mic on the rider’s jacket': 'No mic goes on the rider either — tack and athlete devices have their own restrictions.',
    },
  },
  {
    id: 'mo.set.3',
    page: 'setups',
    prompt: 'Your mic needs mains power on a wet pool deck. Who sets it up?',
    options: ['The venue’s qualified electrical authority', 'You, with a splash-proof extension lead', 'A crew member, if the plug sits high'],
    correct: 'The venue’s qualified electrical authority',
    explain: 'Wet-area electrics are reviewed and approved by a qualified person; mains equipment stays out of splash and immersion. If protection cannot be verified, use an approved dry perimeter feed.',
    why: {
      'You, with a splash-proof extension lead': 'A splash-proof lead does not make the whole installation safe.',
      'A crew member, if the plug sits high': 'A dry-looking plug is not an electrical review.',
    },
  },
  {
    id: 'mo.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A red flag stops the race near your remote mic. What do you do?',
    options: ['Mute the feed and follow race control', 'Fetch the mic while the cars are stopped', 'Leave it up to catch the incident'],
    correct: 'Mute the feed and follow race control',
    explain: 'Mute the affected remote feed and follow race control; no gear is retrieved until the area is released.',
    why: {
      'Fetch the mic while the cars are stopped': 'Stopped cars are not a released area — rescue crews need the space.',
      'Leave it up to catch the incident': 'An incident is not a sound opportunity; mute it and follow instructions.',
    },
  },
  {
    id: 'mo.mic.1',
    page: 'microphone',
    prompt: 'Can a dynamic mic’s chain overload beside a very loud car?',
    options: ['Yes: no type is immune by itself', 'No: dynamics cannot be overloaded', 'Only if its preamp gain is too low'],
    correct: 'Yes: no type is immune by itself',
    explain: 'A dynamic mic is not automatically immune to overload, and a condenser is not automatically unsuitable for loud events. Check the stated limits of the whole chain.',
    why: {
      'No: dynamics cannot be overloaded': 'Any capsule has a limit; dynamic is not a guarantee.',
      'Only if its preamp gain is too low': 'Low gain does not overload a capsule; the sound pressure does.',
    },
  },
  {
    id: 'mo.mic.2',
    page: 'microphone',
    prompt: 'A low-sensitivity mic feeds a transmitter. What does its low output protect?',
    options: ['The transmitter input after it', 'Its own capsule from overload', 'Each stage of the whole chain'],
    correct: 'The transmitter input after it',
    explain: 'Lower output presents less voltage to the next stage; it cannot stop its own capsule from overloading. Protection belongs at the stage that needs it.',
    why: {
      'Its own capsule from overload': 'Its output level does not change what its capsule can take.',
      'Each stage of the whole chain': 'Each stage has its own limit; check them one by one.',
    },
  },
  {
    id: 'mo.mic.3',
    page: 'microphone',
    prompt: 'A reading under water and a reading in air both say “120 dB”. Is the sound pressure the same?',
    options: ['No: the two media use different dB references', 'Yes: the same dB number means the same pressure', 'It depends only on the two recorders’ gain settings'],
    correct: 'No: the two media use different dB references',
    explain: 'Underwater decibels are counted from a much smaller reference pressure than airborne ones, so the same number means less pressure under water. Equal recorded levels prove nothing either: the hydrophone, the mic and their gains all differ. Compare readings only within one medium.',
    why: {
      'Yes: the same dB number means the same pressure': 'Only when both use the same reference — water and air do not.',
      'It depends only on the two recorders’ gain settings': 'Gain changes a recording’s level, not the reference a quoted dB figure is counted from.',
    },
  },
  {
    id: 'mo.place.1',
    page: 'placement',
    prompt: 'You turn mic 1 from across the walk to along it, toward the approach. What do you gain?',
    options: ['A longer sector on the approach', 'A louder sound at the closest point', 'Less of whatever lies beyond'],
    correct: 'A longer sector on the approach',
    explain: 'Aimed along the segment, the approach stays on the axis longer — and so does whatever lies beyond it, a crowd or a loudspeaker. Aimed across, a short contact region is the detail.',
    why: {
      'A louder sound at the closest point': 'At the closest point the source is now off the axis — a little quieter.',
      'Less of whatever lies beyond': 'Aiming along the path puts more of what lies beyond on the axis, not less.',
    },
  },
  {
    id: 'mo.place.2',
    page: 'placement',
    prompt: 'What capsule height does a trackside mic need?',
    options: ['What the assigned place and its protection allow', 'About one metre, the usual trackside height', 'As high as possible, so it can see over the barrier'],
    correct: 'What the assigned place and its protection allow',
    explain: 'There is no universal one-metre trackside height: the height follows the assigned access and the protection from projectiles — capsule, windshield, stand and cable inside the authorized envelope.',
    why: {
      'About one metre, the usual trackside height': 'No height is universal; the practice’s 1 m is for a quiet room only.',
      'As high as possible, so it can see over the barrier': 'Height is set by the approved envelope, not by the view.',
    },
  },
  {
    id: 'mo.place.3',
    page: 'placement',
    prompt: 'Mic 1 moves from 2 m to 4 m from the walk. What happens to the change in level along it?',
    options: ['It gets gentler', 'It gets steeper', 'It stays the same'],
    correct: 'It gets gentler',
    explain: 'From farther back, the ends of the walk are not much farther away than its closest point, so the level changes less along the walk — with about 6 dB less source against the room.',
    why: {
      'It gets steeper': 'Moving back evens the distances out; the change gets smaller.',
      'It stays the same': 'The ratio of the far and near distances changes when the mic moves back.',
    },
  },
  {
    id: 'mo.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What are the practice room’s distances for?',
    options: ['A quiet, dry practice — not a clearance', 'The safe distance from a passing car', 'The minimum distance between a horse and a mic'],
    correct: 'A quiet, dry practice — not a clearance',
    explain: 'They are mock coordinates for a quiet room with a walking person. A live course, arena or pool sets its own places in its approved plan.',
    why: {
      'The safe distance from a passing car': 'No practice distance is a motorsport clearance.',
      'The minimum distance between a horse and a mic': 'No practice distance says anything about horses.',
    },
  },
  {
    id: 'mo.ctx.1',
    page: 'context',
    prompt: 'The nearest pass distorts. Where do you look first?',
    options: ['Each stage’s overload indicator', 'The output fader on the mixing desk', 'A filter to smooth the peaks'],
    correct: 'Each stage’s overload indicator',
    explain: 'Check the capsule, the transmitter, the receiver, the preamp, the converter and the bus; lower the gain at the stage that overloads, or use suitable approved hardware.',
    why: {
      'The output fader on the mixing desk': 'A lower output fader cannot protect an earlier stage.',
      'A filter to smooth the peaks': 'A filter cannot repair a clipped waveform.',
    },
  },
  {
    id: 'mo.ctx.2',
    page: 'context',
    prompt: 'The nearest pass throws grit and spray at the mic’s place. A fair response?',
    options: ['A protected permitted feed, more margin', 'Step in closer between passes to check', 'Wrap the mic tightly in a plastic bag'],
    correct: 'A protected permitted feed, more margin',
    explain: 'Use a protected permitted feed and more input margin; never approach the course to test. A cover can change the sound and is not proof of protection.',
    why: {
      'Step in closer between passes to check': 'Between passes is not a released period.',
      'Wrap the mic tightly in a plastic bag': 'An improvised cover changes the sound and protects nothing reliably.',
    },
  },
  {
    id: 'mo.ctx.3',
    page: 'context',
    prompt: 'On soft footing the hooves are barely there. What then?',
    options: ['Lean on the wider, stable coverage', 'Move closer each time the horse turns', 'Ask the rider for a firmer canter'],
    correct: 'Lean on the wider, stable coverage',
    explain: 'A quiet soft surface is not a failed mic. Keep the operator still and use the wider coverage — never move closer, and never ask for a faster or louder round for a test.',
    why: {
      'Move closer each time the horse turns': 'The operator stays still and outside every envelope.',
      'Ask the rider for a firmer canter': 'Riding is never changed to improve a mic test.',
    },
  },
  {
    id: 'mo.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · May a pool mic be clipped to a starting block?',
    options: ['Only with its specialist’s approval', 'If it sits well clear of the swimmer', 'On the side of the block away from the water'],
    correct: 'Only with its specialist’s approval',
    explain: 'The blocks, the touch panels and the start loudspeakers are officiating systems: no attaching, patching or loading without the responsible specialist. Use an approved dry deck position.',
    why: {
      'If it sits well clear of the swimmer': 'Clear of the swimmer is not approval of the officiating system.',
      'On the side of the block away from the water': 'The side does not matter; the block is not a mount.',
    },
  },
  {
    id: 'mo.two.1',
    page: 'twoMic',
    prompt: 'You align two mics with a delay at the closest point of a pass-by. What happens elsewhere?',
    options: ['It is off at other points', 'It holds along the whole path', 'It improves as the source leaves'],
    correct: 'It is off at other points',
    explain: 'A moving source changes its path difference to two fixed mics, so an alignment at one pass-by point does not hold everywhere. Choose a dominant feed per sector first.',
    why: {
      'It holds along the whole path': 'The path difference changes as the source moves.',
      'It improves as the source leaves': 'Nothing about leaving brings the paths back into line.',
    },
  },
  {
    id: 'mo.two.2',
    page: 'twoMic',
    prompt: 'The walking source seems to rise in pitch as it comes closer. What can you conclude?',
    options: ['Nothing about its speed', 'Its exact walking speed', 'The mic is out of tune'],
    correct: 'Nothing about its speed',
    explain: 'A walk is not a speed measurement, and a change in pitch can also come from the source itself, reflections and the mic’s off-axis tone. The lab draws no pitch number.',
    why: {
      'Its exact walking speed': 'A walk in a practice room is not a speed measurement.',
      'The mic is out of tune': 'A mic has no tuning; the change is in what reaches it.',
    },
  },
  {
    id: 'mo.two.3',
    page: 'twoMic',
    prompt: 'M1 and M2 stand 2 m either side of the walk. When do they hear the source in time?',
    options: ['Everywhere on the walking line', 'Only at the closest point, B', 'Nowhere along the walk at all'],
    correct: 'Everywhere on the walking line',
    explain: 'Placed as mirror images, every point of the line is equally far from both. Move one mic back and the paths stop being equal — then the delay changes from point to point.',
    why: {
      'Only at the closest point, B': 'Every point on the line is equally far from both mirror places, not only B.',
      'Nowhere along the walk at all': 'Equal paths mean equal arrival times all along the line.',
    },
  },
  {
    id: 'mo.prac.gain',
    page: 'practice',
    prompt: 'A gentle clap peaks at −28 dBFS; the real pass-by will be far louder. Your gain?',
    options: ['The loudest safe peak near −12 dBFS', 'Bring the gentle clap right up to −6 dBFS', 'Leave it as it is and normalise it later'],
    correct: 'The loudest safe peak near −12 dBFS',
    explain: 'In this quiet practice the loudest safe peak is your strongest repeatable gentle clap: near −12 dBFS is a trial starting point, with more margin for live peaks. No practice gain certifies a real pass-by.',
    why: {
      'Bring the gentle clap right up to −6 dBFS': 'With a gentle clap already at −6 dBFS, the first real pass clips.',
      'Leave it as it is and normalise it later': 'Normalising cannot fix a clip, or the noise of a gain set too low.',
    },
  },
  {
    id: 'mo.prac.3',
    page: 'practice',
    prompt: 'What would justify a second detail channel on the course?',
    options: ['A tested gap the first one leaves', 'A spare input on the mixing desk', 'More channels for a bigger sound'],
    correct: 'A tested gap the first one leaves',
    explain: 'A channel earns its place by covering a sector you tested and named — with its handoff and its own headroom.',
    why: {
      'A spare input on the mixing desk': 'An unused input is not a reason to fill it.',
      'More channels for a bigger sound': 'More channels add overlap and peaks, not size.',
    },
  },
  {
    id: 'mo.mix.1',
    page: 'practice',
    prompt: 'In the optional hydrophone trial, where do the recorder and connectors go?',
    options: ['On the dry side, cable strain-relieved', 'Beside the container, within easy reach', 'In the water too, to keep cables short'],
    correct: 'On the dry side, cable strain-relieved',
    explain: 'Keep the recorder and every connector dry, the sensor placed gently, the cable strain-relieved. Never lift it by a damaged cable; replace a damaged cable before use. No people or animals in the water.',
    why: {
      'Beside the container, within easy reach': 'Beside the container is the splash zone; connectors stay on the dry side.',
      'In the water too, to keep cables short': 'Connectors and the recorder never go in the water.',
    },
  },
  removeDelay('mo.mix.2'),
  {
    id: 'mo.mix.3',
    page: 'practice',
    prompt: 'You want to check the level near a horse before the round. How?',
    options: ['From the perimeter feed, quietly', 'With a loud test tone by the horse', 'By asking the rider for extra jumps'],
    correct: 'From the perimeter feed, quietly',
    explain: 'No flash, no loud test tones, no abrupt movement near horses — and never faster riding or extra jumps for a test. Check from the approved perimeter feed during normal warm-up.',
    why: {
      'With a loud test tone by the horse': 'Loud test tones can startle a horse.',
      'By asking the rider for extra jumps': 'Riding is never changed to improve a mic test.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'mo.sym.dist',
    observation: 'Distortion on the nearest action',
    firstChecks: 'The mic and every downstream overload indicator — which stage first?',
    options: ['Find the stage that overloads first', 'Pull the output fader down a little further', 'Add a soft limiter on the mix bus'],
    correct: 'Find the stage that overloads first',
    explain: 'Lower the gain at the affected stage, or select suitable approved hardware; a later fader or limiter cannot undo it.',
    why: {
      'Pull the output fader down a little further': 'The output fader only scales what already clipped.',
      'Add a soft limiter on the mix bus': 'A limiter after the clip cannot repair it.',
    },
  },
  {
    id: 'mo.sym.rumble',
    observation: 'Rumble or pumping under the action',
    firstChecks: 'Wind, structure, the cable — or water flowing past a hydrophone?',
    options: ['Check wind, mount, cable and flow apart', 'Cut all of the low end below 200 Hz', 'Turn the whole feed down and simply carry on'],
    correct: 'Check wind, mount, cable and flow apart',
    explain: 'Separate the causes, then improve compatible protection or isolation from an approved place. A deep cut removes the event’s body too.',
    why: {
      'Cut all of the low end below 200 Hz': 'A deep cut removes the engine and the hooves along with the rumble.',
      'Turn the whole feed down and simply carry on': 'Lower level keeps the cause and loses the detail.',
    },
  },
  {
    id: 'mo.sym.thin',
    observation: 'The combined sound turns thin as the source passes',
    firstChecks: 'Correlated feeds, and a path difference that moves with the source?',
    options: ['Solo, check mono, reduce the overlap', 'Boost the low end on both channels', 'Delay one mic for the whole event'],
    correct: 'Solo, check mono, reduce the overlap',
    explain: 'Solo each feed and check the mono sum; reduce redundant feeds or change the dominant one. One delay fits one point only.',
    why: {
      'Boost the low end on both channels': 'EQ cannot remove a comb that moves with the source.',
      'Delay one mic for the whole event': 'The source moves; a fixed delay fits one point.',
    },
  },
  {
    id: 'mo.sym.lost',
    observation: 'The target is lost behind an obstruction',
    firstChecks: 'Bodies, fences, barriers, reflections — and the axis?',
    options: ['Hand off or use the wider view', 'Move the stand past the barrier', 'Raise the gain to dig it out'],
    correct: 'Hand off or use the wider view',
    explain: 'Hand off to another approved sector or a wider perspective; never an unapproved advance past a barrier or fence.',
    why: {
      'Move the stand past the barrier': 'Past the barrier is the course or the run-off.',
      'Raise the gain to dig it out': 'Gain raises everything else along with it.',
    },
  },
  {
    id: 'mo.sym.smear',
    observation: 'The music or the cue sounds smeared',
    firstChecks: 'Room pickup plus a delayed supplied feed?',
    options: ['Keep them separate, timing known', 'Sum all the copies at equal level', 'Turn the action mics up a lot instead'],
    correct: 'Keep them separate, timing known',
    explain: 'Keep the supplied feed and the room pickup separately controllable, and know the feed’s delay against the room.',
    why: {
      'Sum all the copies at equal level': 'Equal-level delayed copies are what smear it.',
      'Turn the action mics up a lot instead': 'The action mics carry the room’s late copy of the music.',
    },
  },
  {
    id: 'mo.sym.wet',
    observation: 'A mic got soaked, or its approval was withdrawn',
    firstChecks: 'Exposure, access and the electrical review?',
    options: ['Mute it; use the prepared alternative', 'Dry it off on the deck and carry on', 'Keep it up until the session ends'],
    correct: 'Mute it; use the prepared alternative',
    explain: 'Mute or withdraw the affected feed and use the prepared safe alternative; retrieve it only when released.',
    why: {
      'Dry it off on the deck and carry on': 'A wet mic and its connections need review before use, not a towel.',
      'Keep it up until the session ends': 'A withdrawn approval means the feed comes down now.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'mo.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of the practice session in the order you would do them.',
    steps: [
      { text: 'Map the points, equipment areas, operator arc and routes', early: 'The map comes first.' },
      { text: 'Set up and test the wider fallback before any detail', early: 'The fallback comes before the detail.' },
      { text: 'Three gentle claps and a phrase at A, B and C, gain fixed', early: 'Compare once the fallback is ready.' },
      { text: 'Walk slowly from A through B to C with the mic fixed', early: 'The pass-by comes after the fixed points.' },
      { text: 'Try 30° off the axis, then twice the range', early: 'Aim and range come after the pass-by.' },
      { text: 'Compare M1 and M2 solo and summed', early: 'The overlap comes after the single-mic trials.' },
      { text: 'Mute the detail, move to the wider view, repeat the B trial', early: 'The fallback and the repeat come last.' },
    ],
    explain: 'A sensible order: the map, the fallback, the fixed points, the pass-by, the aim and range, the overlap, then the fallback test and the repeat.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'mo.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A circuit: one approved media point behind the barrier, two channels, the nearest cars very loud.',
    setups: [
      { id: 'a', label: 'A shotgun aimed along the straight, plus a mono ambience', ok: true, power: 'phantom', feedback: 'A suggested start: the approach on the axis, the event carried by the ambience, generous input margin.' },
      { id: 'b', label: 'A coincident stereo pair at the media point', ok: true, power: 'phantom', feedback: 'A suggested start where the trajectory matters: check its orientation and the mono downmix.' },
      { id: 'c', label: 'A stand inside the run-off for a closer pass', ok: false, power: 'phantom', feedback: 'Nobody stands in the run-off, at any time.' },
      { id: 'd', label: 'A mic taped to the safety barrier', ok: false, power: 'phantom', feedback: 'Nothing is attached to a safety barrier or a flag post by default.' },
      { id: 'e', label: 'Gain set on a distant car, peaks left to chance', ok: false, power: 'phantom', feedback: 'The nearest pass needs its headroom at every stage.' },
    ],
    reasons: [
      { id: 'r.assigned', label: 'Everything stays inside the assigned media point', role: 'required', feedback: 'Say where it is approved to be.' },
      { id: 'r.headroom', label: 'The nearest pass has room at every stage', role: 'required', feedback: 'Say how the loud pass is handled.' },
      { id: 'r.barrier', label: 'Whether the barrier screens the path is noted', role: 'optional', feedback: 'A fair reason.' },
      BRAND_REASON('race circuit'),
      { id: 'r.closer', label: 'Closer to the track is always better', role: 'wrong', feedback: 'Closer means the run-off and the projectiles.' },
    ],
    explain: 'Two setups pass. What passes is the reasoning: the assigned place, the aim chosen on purpose, the ambience and the headroom for the nearest pass.',
  },
  {
    id: 'mo.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · Show jumping: two assigned perimeter positions, a soft sand footing, the arena closed during each round.',
    setups: [
      { id: 'a', label: 'A directional on a selected landing, plus a wider stereo view', ok: true, power: 'phantom', feedback: 'A suggested start: selected landings and the round’s rhythm, both from outside the arena.' },
      { id: 'b', label: 'A wider mono or stereo view only, from the perimeter', ok: true, power: 'phantom', feedback: 'A suggested start when soft footing or distance masks the detail.' },
      { id: 'c', label: 'A small mic on a fence’s rail for the touches', ok: false, power: 'phantom', feedback: 'Nothing that changes a fence; an approved remote plant belongs in the technical plan.' },
      { id: 'd', label: 'A clip mic on the horse’s bridle', ok: false, power: 'phantom', feedback: 'Never a mic on a horse, its tack or its rider.' },
      { id: 'e', label: 'A stand by the in-gate for the best angle', ok: false, power: 'phantom', feedback: 'Equipment never blocks a gate.' },
    ],
    reasons: [
      { id: 'r.perimeter', label: 'Every mic stays outside the arena and its envelopes', role: 'required', feedback: 'Say where each mic is.' },
      { id: 'r.welfare', label: 'Nothing on the horse, nothing that startles it', role: 'required', feedback: 'Say how the horse is protected.' },
      { id: 'r.music', label: 'Any music feed stays separately controllable', role: 'optional', feedback: 'A fair reason.' },
      BRAND_REASON('jumping arena'),
      { id: 'r.louder', label: 'A louder round makes a better test', role: 'wrong', feedback: 'Never ask for faster riding or louder impacts for a test.' },
    ],
    explain: 'Two setups pass. What passes is the reasoning: outside the arena and its envelopes, nothing on the horse, the wider view carrying what the footing hides.',
  },
];

const predictions: Lesson['predictions'] = {
  meet: { prompt: 'Before you look: a mic at M1 aimed at B. Where on the walk is the source strongest?', options: ['At B, the closest point', 'At A, the start', 'The same everywhere'], after: 'Now step through TARGET.' },
  microphone: { prompt: 'Which method gives the steadiest sense of the venue?', options: ['Mono ambience', 'The fixed shotgun', 'The hydrophone'], after: 'Now step through each METHOD.' },
  placement: { prompt: 'Predict: you aim mic 1 along the walk instead of across it. What happens at the approach?', options: ['It stays on the axis longer', 'It gets quieter', 'Nothing changes'], after: 'Rest the mic in two zones and read what each one suggests.' },
  context: { prompt: 'The converter reads −8 dBFS on the nearest pass. Is the chain safe?', options: ['It may not be', 'It is safe', 'Only with a low fader'], after: 'Now find the first overloaded stage.' },
  twoMic: { prompt: 'M1 and M2 sit either side of the walk, 2 m from it. Where do they hear the source in time?', options: ['All along the line', 'Only at B', 'Nowhere'], after: 'Walk the source end to end, then try the other aim and the farther place.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'meet',
    prompt: 'What decides where a trackside mic may stand?',
    options: ['The organizer’s assigned positions', 'Wherever the pass-by sounds the very best', 'A marshal’s nod on the day'],
    correct: 'The organizer’s assigned positions',
    explain: 'Use the assigned audio and media positions and follow the marshals; a better sound never justifies moving.',
    why: { 'Wherever the pass-by sounds the very best': 'Sound is not permission.', 'A marshal’s nod on the day': 'A nod is not an approved installation.' },
  },
  {
    id: 'q.2',
    covers: 'meet',
    prompt: 'A source passes a fixed mic. Which of these changes along its path?',
    options: ['Its distance and its angle', 'Only its loudness', 'Nothing, if the mic is fixed'],
    correct: 'Its distance and its angle',
    explain: 'Distance and angle change together — and so may the source’s own state.',
    why: { 'Only its loudness': 'The angle, and so the tone, changes too.', 'Nothing, if the mic is fixed': 'The mic is fixed; the source is not.' },
  },
  {
    id: 'q.3',
    covers: 'meet',
    prompt: 'What does a passing source’s pitch tell you in a walking practice?',
    options: ['Nothing about its speed', 'Exactly how fast it walked', 'The pattern of the mic'],
    correct: 'Nothing about its speed',
    explain: 'A walk is not a speed measurement; pitch changes can come from the source, reflections and off-axis tone.',
    why: { 'Exactly how fast it walked': 'A walk in a practice room is not a speed measurement.', 'The pattern of the mic': 'Pitch does not reveal the pattern.' },
  },
  {
    id: 'q.4',
    covers: 'setups',
    critical: true,
    prompt: 'Is a mic on a horse’s bridle an option when a plant is refused?',
    options: ['No: nothing on a horse or its tack', 'Yes, if it is small and very light', 'Only with the rider’s consent'],
    correct: 'No: nothing on a horse or its tack',
    explain: 'No mic on a horse, its tack or its rider; rider consent alone does not establish access.',
    why: { 'Yes, if it is small and very light': 'Size does not matter: nothing goes on the horse.', 'Only with the rider’s consent': 'A rider’s consent does not make the horse or its tack a mount.' },
  },
  {
    id: 'q.5',
    covers: 'setups',
    critical: true,
    prompt: 'Thunder during an outdoor event. When do you go back out?',
    options: ['30 minutes after the last thunder', 'As soon as the rain stops', 'When the lightning looks far enough off'],
    correct: '30 minutes after the last thunder',
    explain: 'Shelter at once in a substantial building or hard-topped vehicle, and wait 30 minutes after the last thunder — under the event’s plan.',
    why: { 'As soon as the rain stops': 'Lightning can strike after the rain stops.', 'When the lightning looks far enough off': 'Distant-looking lightning can still strike.' },
  },
  {
    id: 'q.6',
    covers: 'setups',
    prompt: 'Who reviews mains power on a wet pool deck?',
    options: ['A qualified electrical person', 'The audio crew, working carefully', 'Nobody, if it is battery-run'],
    correct: 'A qualified electrical person',
    explain: 'The venue’s qualified electrical authority reviews and approves wet-area electrics; battery power alone is not a review.',
    why: { 'The audio crew, working carefully': 'Care is not a qualification for wet-area electrics.', 'Nobody, if it is battery-run': 'Battery power does not make an installation safe by itself.' },
  },
];

export const B16_LESSON: Lesson = {
  id: 'B16',
  labId: 'broadcast',
  title: 'Motorsport, Equestrian and Aquatic Events',
  subtitle: 'A source that moves past a fixed mic: approved places, the aim across or along the path, headroom for the nearest pass — and nothing on a horse',
  noun: { one: 'venue', many: 'venues', subject: 'the venue' },
  model: B16_MODEL,
  micTypeIds: ['shotgunShort', 'scSupercard'],
  zones: B16_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Moving action, selected detail and the venue’s atmosphere at motorsport, equestrian and aquatic events — from safe, permitted places. Underwater pickup is a separate, optional extension.', src: 'LESSON-B16' },
    { title: 'PERMISSION DEFINES THE PLACE', text: 'Every location, mount, cable route and operator movement is approved. Athletes, animals, officials, medical and emergency access are preserved — and approval never overrides the rules.', src: 'LESSON-B16' },
    { title: 'A MOVING SOURCE', text: 'A fixed mic hears the source come and go: its distance, its angle and its own state change together. Fixed sectors, stereo trajectories and a stable ambience each serve a different perspective.', src: 'LESSON-B16' },
    { title: 'THE PRACTICE ROOM', text: 'Here you practise with a person walking past two fixed mics — no vehicles, horses or water. These are suggested starting points — experimentation is encouraged; your ears and the room decide.', src: 'LESSON-B16' },
  ],
  sound: {
    stages: [
      { title: 'Coming and going', text: 'A passing source grows louder and brighter on its approach, then fades. One fixed mic hears it well over part of the path only.' },
      { title: 'Different sources', text: 'An engine, a hoof and a splash differ in length, spectrum and direction. A loud source may be heard from far away; a soft one can stay masked even on a narrow mic.' },
      { title: 'Everything else', text: 'Crowds, commentary loudspeakers, wind and water, and the venue’s own reflections — on the same axis as the action.' },
    ],
    attack: 'An engine passing, a landing, an entry splash — the moment the source is closest.',
    body: 'The venue and its crowd — the continuous bed under every pass.',
    head: { diameterMm: 0, rods: 0, label: 'the practice room', strikeSrc: 'LESSON-B16' },
  },
  setting: {
    items: [
      { id: 'pass', label: 'the nearest pass', short: 'NEAREST PASS', note: 'The loudest, windiest moment, with grit or spray: give it input margin at every stage, from a protected permitted place — never approach to test it.', prov: { kind: 'illustrative', reason: 'the lesson L67–L69, L90' }, tag: 'PEAKS', scene: 'all' },
      { id: 'barrier', label: 'barriers, fences and obstacles', short: 'BARRIERS', note: 'They screen the path, reflect sound and carry vibration. Nothing projects through a safety barrier, and nothing changes a fence.', prov: { kind: 'illustrative', reason: 'the lesson L73–L75, L128' }, tag: 'IN THE WAY', scene: 'all' },
      { id: 'animals', label: 'horses', short: 'HORSES', note: 'No mic on a horse, its tack or its rider; no flash, loud test tones or abrupt movement nearby. Follow the stewards.', prov: { kind: 'illustrative', reason: 'the lesson L133–L134' }, tag: 'WELFARE', scene: 'all' },
      { id: 'water', label: 'water, splash and wet decks', short: 'WATER', note: 'Splash can overload a mic or wet its protection; the deck’s officiating systems come first. Wet-area electrics are a qualified person’s review.', prov: { kind: 'illustrative', reason: 'the lesson L167–L169, L238' }, tag: 'WET', scene: 'all' },
      { id: 'pa', label: 'commentary loudspeakers and music', short: 'PA · MUSIC', note: 'A loudspeaker on the axis is heard with the action; a supplied music feed stays separately controllable, its delay known.', prov: { kind: 'illustrative', reason: 'the lesson L71, L137' }, tag: 'SPILL', scene: 'all' },
      { id: 'weather', label: 'wind, rain, heat and dust', short: 'WEATHER', note: 'A windscreen is not waterproofing; a rain cover meant for between takes is not for recording. Check each component’s limits.', prov: { kind: 'illustrative', reason: 'the lesson L217–L218' }, tag: 'WIND', scene: 'all' },
    ],
    stage: 'Commentary, approved cues and music, action and the audience stay separately controllable; action and ambience reach a venue loudspeaker only when required and reviewed. Meter the program sum and check the picture’s sync through the real chain.',
    studio: 'A walking person in a quiet room is not a racing car, a horse or a swimmer: the practice teaches the geometry of a pass, not the peaks or the speed of a real one.',
  },
  diagnostic,
  practice: {
    task: 'Put a practice session in order, choose and justify setups for a circuit and a jumping arena, and say what would justify another detail channel. With an approved practice, you can record what you tried below.',
    fields: [
      { id: 'event', label: 'Event, approving contact and footprint', kind: 'text' },
      { id: 'target', label: 'Target sound and desired perspective', kind: 'text' },
      { id: 'method', label: 'Method', kind: 'choice', choices: ['fixed directional', 'mono ambience', 'coincident stereo', 'spaced stereo', 'hydrophone (optional)', 'other'] },
      { id: 'pos', label: 'Model, pattern, heights, range and aim', kind: 'text' },
      { id: 'pass', label: 'Approach, closest pass and departure', kind: 'text' },
      { id: 'peak', label: 'Peak, margin and overload indications', kind: 'text' },
      { id: 'fallback', label: 'Strongest region, gap and fallback', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The practice room’s points A, B and C, M1 and M2, the 1 m capsule and clap height and the double-range place are the lesson’s own; the extents of the areas, the clearance bands and the way out are drawing defaults.', dims: [] },
    { text: 'The venue plans (a circuit, a jumping arena, a pool) are typical layouts at common dimensions, not read from any rulebook; the car and the horse are plan silhouettes only; the hydrophone’s container, its water and sensor depths are drawing defaults.', dims: [] },
    { text: 'The headroom chain’s event sizes and each stage’s limit are an example, not a measurement of any equipment.', dims: [] },
  ],
  live: { wedges: [] },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. Every course, arena and pool is different: get approval, listen, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: the practice room and its marks are the lesson’s own; the venue plans, the car and the horse are typical drawings; ranges, levels and delays along the walk are calculated from the drawing, and no pitch or speed is ever calculated. Safety is exact: never into a course, a run-off, an arena or a deck route; hearing protection near loud engines; no mic on a horse, its tack or its rider; wet-area electrics by a qualified person; with thunder, shelter at once and wait 30 minutes after the last thunder.',
  copy: B16_COPY,
};
