/**
 * F06 NATURAL AND URBAN AMBIENCE — the lesson as DATA (Miking Lab 6, group
 * 2, branch lab6-g2). Words from the owner's lesson (docs/labs/miking/
 * source_text/F06-Natural-and-Urban-Ambience-Miking-Technique.txt, "L<n>"
 * in comments only) with field_ambience/SOURCES.md §c applied and logged in
 * CORRECTIONS_LOG.md (Lab 6 · group 2): no institutional wording (F06-C1);
 * X/Y at 90° (F06-C2); the US-park wildlife distances as examples, local
 * rules first (F06-C3); the 5 m/s wind line as one monitoring protocol's,
 * not a rule for creative takes (F06-C4); "30 minutes after the last
 * lightning or thunder", unsafe shelters named (F06-C5); cross-links to
 * unbuilt lessons dropped (F06-C6).
 *
 * Owner rulings: suggested starting points ("your ears and the place
 * decide"); no source, brand or authority on screen; safety exact in plain
 * words; FULLY SILENT. O-8 (A/B omni spacing 600 mm), O-11, O-12 (the field
 * log typed only, no location), O-14 (role names that fit) — defaults.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom } from '../../engine/model/types.ts';
import { fieldLog, logChoice, logText } from '../shared/field/fieldLog.ts';
import { F06_MODEL } from './geometry.ts';
import { F06_PAIRS, F06_ZONES } from './model.ts';
import { F06_COPY } from './copy.ts';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the place',
    goal: 'Meet an ambience as a sound source: a place at a time — a steady bed with events on top — and the listening point you choose in it, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'An ambience is a place at a time. Its sound depends on where you listen from, when, and the weather — so the listening point is the first decision.',
  },
  sound: {
    title: 'Where the ambience comes from',
    goal: 'See how a few steps toward or away from the main bed — a stream, a road — change its balance with the events around it.',
    credit: { scenarios: ['amb.snd.1', 'amb.snd.2', 'amb.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'The listening point chooses the balance: near moving water or traffic a small move changes it a lot. Move the array to choose the balance, not to make the meters louder.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Know what to settle before a stand goes up: listen first, name the destination, check permission — and the safety of the place itself.',
    credit: { scenarios: ['amb.set.1', 'amb.set.2', 'amb.set.3'], note: 'Answer the three checks.' },
    takeaway: 'Listen, name the listener and the format, check permission and privacy — and safety: off paths and lanes, away from wildlife, indoors when thunder is heard.',
  },
  microphone: {
    title: 'Choose the microphones',
    goal: 'Choose by properties — an omni for the whole place, a cardioid to lean toward a region, a figure-8 for the Side of an M/S pair — and see what a pattern can and cannot reject.',
    credit: { scenarios: ['amb.mic.1', 'amb.mic.2', 'amb.mic.3', 'amb.rec.1'], note: 'Answer the four checks (one reaches back to where you listen).' },
    takeaway: 'An omni hears the whole place; a directional mic leans toward a region but no pattern erases the city or the wind. Choose by the job, not the name.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — one mic about 1.5 m up at the listening point, off every path — then try a second position and see what changes.',
    credit: { scenarios: ['amb.place.1', 'amb.place.2', 'amb.place.3', 'amb.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every keep-out, in two different starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A listening point is a place to begin, measured from the main bed — not a rule. Distance and height change the balance; paths, lanes and water stay clear.',
  },
  context: {
    title: 'Wind, levels and live',
    goal: 'Protect the mic from wind before reaching for a filter, set levels for the loudest likely event, keep a field log — and know why a live feed is a different job.',
    credit: { scenarios: ['amb.ctx.1', 'amb.ctx.2', 'amb.ctx.3', 'amb.rec.3'], interactive: 'windTried', note: 'Try the wind layers at more than one site, and answer the four checks.' },
    takeaway: 'Protection first: foam for sheltered air, fur and a basket for open ground. A filter cannot rescue a buffeted take. Headroom for the loudest event, a log of what really happened — and no open ambience mic near a PA without a plan.',
  },
  twoMic: {
    title: 'A pair and its image',
    goal: 'Compare X/Y, ORTF, spaced omnis and M/S on the same source: how each places it between the speakers, and what happens when the pair is folded to mono.',
    credit: { scenarios: ['amb.two.1', 'amb.two.2', 'amb.two.3', 'amb.two.4'], interactive: 'imageSwept', note: 'Sweep the source with two different pairs, and answer the four checks.' },
    takeaway: 'Coincident pairs place a source by level and hold in mono; spaced pairs add time — wider, with a comb to check in mono. Width is not depth, and the geometry is part of the take: write it down.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — the position, the wind protection, the stand, the geometry, the routing — before reaching for a filter or more gain.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put an ambience session in order, choose and justify setups for a woodland bed and a city plaza, and say what one take can honestly be called.',
    credit: { scenarios: ['amb.prac.order', 'amb.prac.gain', 'amb.prac.setup1', 'amb.prac.setup2', 'amb.prac.3', 'amb.mix.1', 'amb.mix.2', 'amb.mix.3'], note: 'Put the session in order, answer the level check, complete both briefs, and answer the four reasoning cards. The field log is optional — it needs a real site.' },
    takeaway: 'A listening point chosen by ear, the geometry and the protection written down, headroom for the loudest event, mono checked — and a take labelled for what it is. More than one setup can pass.',
  },
};

/* THE CHECKS. Lesson lines in comments only: snd L5–L6, L32–L34 · set L5–L6, L45–L46 · mic L12–L28 ·
 * place L32–L34 · ctx L36–L43 · two L14–L30, L43 · prac L48–L54. */
const scenarios: MikingScenario[] = [
  {
    id: 'amb.snd.1',
    page: 'sound',
    prompt: 'By a stream, you move the stand two metres nearer the water. What tends to change most?',
    options: ['The water grows against the birds', 'The birds grow against the water', 'Only the overall level, nothing else'],
    correct: 'The water grows against the birds',
    explain: 'Near moving water a small move changes its distance a lot, while the birds, farther off, barely change: the balance tips toward the water. Choose the point for the balance, not for the meters.',
    why: {
      'The birds grow against the water': 'The water is the nearer source, so its distance changes most: it grows, the birds do not.',
      'Only the overall level, nothing else': 'Each source changes by a different amount — the balance moves, not just the level.',
    },
  },
  {
    id: 'amb.snd.2',
    page: 'sound',
    prompt: 'A plaza: traffic all the time, a bus and a siren now and then. Which is the bed?',
    options: ['The traffic’s steady sound', 'The bus as it pulls away again', 'The siren as it passes by'],
    correct: 'The traffic’s steady sound',
    explain: 'The bed is the continuous layer of a place; the bus and the siren are events on top of it. A take needs long enough to hold a normal cycle of both.',
    why: {
      'The bus as it pulls away again': 'A bus is an event: it comes and goes over the steady bed.',
      'The siren as it passes by': 'A siren is an intermittent event — note it in the log; it is not the bed.',
    },
  },
  {
    id: 'amb.snd.3',
    page: 'sound',
    prompt: 'For a film bed, a stray shout spoils a take. For a documentary record of the site, it is…',
    options: ['Part of what really happened there', 'A fault to cut out of the take', 'Proof the mic stood in the wrong place'],
    correct: 'Part of what really happened there',
    explain: 'What the track is for decides what is unwanted. An event that spoils a dramatic bed may be the evidence in an honest record — so name the purpose before recording.',
    why: {
      'A fault to cut out of the take': 'For an honest site record, removing real events changes what the take claims to be.',
      'Proof the mic stood in the wrong place': 'People shout wherever the mic is; the purpose decides whether it belongs.',
    },
  },
  {
    id: 'amb.set.1',
    page: 'setting',
    prompt: 'You arrive at a new site. What comes before the stand goes up?',
    options: ['Standing still and listening', 'Setting the input gain high', 'Fitting the widest pair you have'],
    correct: 'Standing still and listening',
    explain: 'Listen first: the main sources and where they move, the wind, the reflecting surfaces, how far the scene reaches, and whether speech could be understood. Then choose a listening point.',
    why: {
      'Setting the input gain high': 'Gain is set on the loudest likely event once the mic is placed, not first.',
      'Fitting the widest pair you have': 'The pair follows the destination and what you heard — not the other way round.',
    },
  },
  {
    id: 'amb.set.2',
    page: 'setting',
    prompt: 'Thunder rumbles while a storm ambience records. Where do you go?',
    options: ['A substantial building or a hard-topped car', 'Under the rain shelter beside the mic', 'Into a small shed beside the stand'],
    correct: 'A substantial building or a hard-topped car',
    explain: 'If you hear thunder you are likely within striking distance: go into a substantial building or a hard-topped vehicle — rain shelters, small sheds and open vehicles are not safe. Wait 30 minutes after the last lightning or thunder.',
    why: {
      'Under the rain shelter beside the mic': 'A rain shelter is not safe in lightning. Go into a substantial building or a hard-topped vehicle.',
      'Into a small shed beside the stand': 'Small sheds are not safe in lightning. A substantial building or a hard-topped vehicle is.',
    },
  },
  {
    id: 'amb.set.3',
    page: 'setting',
    prompt: 'A deer looks up and moves away as you set the stand. What does that tell you?',
    options: ['You are too close — back away', 'It is used to people — carry on', 'The stand needs to be a bit taller'],
    correct: 'You are too close — back away',
    explain: 'If an animal reacts to you, you are too close. Back away, follow the local distances, and never lure or call it for a cleaner track.',
    why: {
      'It is used to people — carry on': 'It just reacted to you: that means too close, whatever it usually does.',
      'The stand needs to be a bit taller': 'Height is not the issue: your distance from the animal is.',
    },
  },
  {
    id: 'amb.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Near moving water, what does a few steps’ move change?',
    options: ['The balance of water and birds', 'Only how loud the meters will read', 'Nothing a listener could hear'],
    correct: 'The balance of water and birds',
    explain: 'The nearer source changes distance most, so the balance between it and the rest moves. That is why the listening point is chosen by ear.',
    why: {
      'Only how loud the meters will read': 'Each source changes by a different amount: the balance moves, not only the level.',
      'Nothing a listener could hear': 'Near water a small move is clearly audible: the water grows or recedes against the birds.',
    },
  },
  {
    id: 'amb.mic.1',
    page: 'microphone',
    prompt: 'You want the whole place, all round you, in one mono track. A fair first choice?',
    options: ['An omni at the listening point', 'A cardioid aimed at the ground', 'A figure-8 alone, decoded as stereo'],
    correct: 'An omni at the listening point',
    explain: 'An omni hears about equally all round: the whole place in one track. A directional mic aimed at a region is the other fair choice — when one region matters more.',
    why: {
      'A cardioid aimed at the ground': 'Aimed at the ground it favours the ground; for the whole place an omni is the simple start.',
      'A figure-8 alone, decoded as stereo': 'A figure-8 alone is not stereo: it is the Side of an M/S pair and needs a Mid.',
    },
  },
  {
    id: 'amb.mic.2',
    page: 'microphone',
    prompt: 'A cardioid faces a quiet courtyard, its back to a busy street. What tends to happen?',
    options: ['Less street, but still some of it', 'The street disappears from the take', 'More street than an omni would hear'],
    correct: 'Less street, but still some of it',
    explain: 'A directional mic leans toward a region; its rear rejection depends on pitch and on the reflections round it. No pattern erases the city.',
    why: {
      'The street disappears from the take': 'Rejection is partial and changes with pitch; reflections bring the street round to the front too.',
      'More street than an omni would hear': 'Facing away, a cardioid hears less of the street than an omni at the same spot.',
    },
  },
  {
    id: 'amb.mic.3',
    page: 'microphone',
    prompt: 'What is the figure-8 for in an M/S pair?',
    options: ['The Side, facing left and right', 'The Mid, facing toward the scene', 'A spare, in case the Mid fails'],
    correct: 'The Side, facing left and right',
    explain: 'The forward Mid is usually a cardioid; the figure-8 faces sideways as the Side. Left = Mid + Side, Right = Mid − Side — and in mono the Side cancels.',
    why: {
      'The Mid, facing toward the scene': 'The Mid is the forward-facing mic; the figure-8 faces the sides.',
      'A spare, in case the Mid fails': 'It is half of the pair: without it there is no width at all.',
    },
  },
  {
    id: 'amb.place.1',
    page: 'placement',
    prompt: 'Where does the stand go at the woodland stream?',
    options: ['Just off the path, on firm ground', 'On the path, where the view is clear', 'On the bank, right at the water'],
    correct: 'Just off the path, on firm ground',
    explain: 'Off the walking path, on firm ground, away from the bank — where nobody trips on it and nothing falls in. Then choose the balance by moving along that safe ground.',
    why: {
      'On the path, where the view is clear': 'People walk the path: a stand or cable there is a trip hazard.',
      'On the bank, right at the water': 'Banks can be unstable, and the water would take over the balance. Stay back.',
    },
  },
  {
    id: 'amb.place.2',
    page: 'placement',
    prompt: 'You compare a second position. What do you keep the same?',
    options: ['The mic, its height and protection', 'Only the time of day, nothing else', 'Nothing — change all of it at once'],
    correct: 'The mic, its height and protection',
    explain: 'Keep the mic, the pattern, the height and the wind protection the same, and move only the position: then what you hear is the place, not the change of gear.',
    why: {
      'Only the time of day, nothing else': 'The time matters too, but so do the mic and its height: keep them the same.',
      'Nothing — change all of it at once': 'Change several things at once and you cannot tell which one made the difference.',
    },
  },
  {
    id: 'amb.place.3',
    page: 'placement',
    prompt: 'In the plaza, the best-sounding spot is in the middle of the walkway. What now?',
    options: ['Find the nearest spot off the walkway', 'Use it while the walkway is quiet', 'Put a cone beside the stand and use it'],
    correct: 'Find the nearest spot off the walkway',
    explain: 'Walkways, sidewalks and access routes stay clear. Find the nearest safe spot and compare it by ear — a cone does not make a walkway safe for a stand.',
    why: {
      'Use it while the walkway is quiet': 'Someone will walk through sooner or later: the route stays clear the whole time.',
      'Put a cone beside the stand and use it': 'A cone does not make a stand in a walking route safe. Move off it.',
    },
  },
  {
    id: 'amb.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Who should be told before you record identifiable conversation?',
    options: ['Check the permissions and privacy rules', 'Nobody, as long as it is recorded outdoors', 'Only the venue, after the take'],
    correct: 'Check the permissions and privacy rules',
    explain: 'Check access, permissions and the privacy rules for the place before capturing identifiable conversation or publishing a take — they vary from place to place.',
    why: {
      'Nobody, as long as it is recorded outdoors': 'Being outdoors does not remove privacy rules: check them first.',
      'Only the venue, after the take': 'Check before you record, not after.',
    },
  },
  {
    id: 'amb.ctx.1',
    page: 'context',
    prompt: 'Open grassland, a steady breeze, a mic in foam. You hear low thumps. First move?',
    options: ['Add fur, then a basket', 'Turn on a steep low cut', 'Raise the gain to cover it'],
    correct: 'Add fur, then a basket',
    explain: 'Foam is enough in sheltered air but not on windy open ground: add a fur cover, then a basket with its suspension. A filter cannot undo a buffeted take.',
    why: {
      'Turn on a steep low cut': 'A filter takes some rumble — and real low sound with it. Protect the capsule first.',
      'Raise the gain to cover it': 'Gain raises the thumps as much as the place.',
    },
  },
  {
    id: 'amb.ctx.2',
    page: 'context',
    prompt: 'One sound-monitoring protocol leaves out wind above about 5 m/s. For a creative bed, that means…',
    options: ['Its own rule — listen to your take', 'Throw out the windy creative takes', 'The protocol applies to all recording'],
    correct: 'Its own rule — listen to your take',
    explain: 'That limit belongs to a measurement protocol. A windy creative take is judged by ear — protected well, logged, and kept if it serves the scene.',
    why: {
      'Throw out the windy creative takes': 'That is a measurement rule; a protected, logged creative take can be fine.',
      'The protocol applies to all recording': 'It applies to that monitoring method, not to every recording.',
    },
  },
  {
    id: 'amb.ctx.3',
    page: 'context',
    prompt: 'A live broadcast wants the crowd’s ambience near a PA. What is a fair first plan?',
    options: ['Few open mics, placed off the PA', 'All the ambience mics open and loud', 'Raise it until it starts to ring'],
    correct: 'Few open mics, placed off the PA',
    explain: 'Every open mic near a loudspeaker takes away gain before feedback. Place it for useful pickup with little PA in it, route it on purpose, and mute unused channels.',
    why: {
      'All the ambience mics open and loud': 'Each open mic adds PA spill and takes away margin. Keep only what you need open.',
      'Raise it until it starts to ring': 'Feedback is never provoked — not even to find the limit.',
    },
  },
  {
    id: 'amb.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · When must you stop and get indoors?',
    options: ['When thunder is heard', 'When the rain starts', 'When the light fades'],
    correct: 'When thunder is heard',
    explain: 'Thunder means you are likely within striking distance: go indoors at once and wait 30 minutes after the last lightning or thunder.',
    why: {
      'When the rain starts': 'Lightning can strike before the rain arrives: thunder is the signal.',
      'When the light fades': 'Fading light is not the signal: thunder is.',
    },
  },
  {
    id: 'amb.two.1',
    page: 'twoMic',
    prompt: 'An X/Y pair: how does it place a source left or right?',
    options: ['By level between the two cardioids', 'By the time between distant capsules', 'By the stand’s height off the ground'],
    correct: 'By level between the two cardioids',
    explain: 'The two capsules are together, angled apart: a source to one side is louder in the cardioid that faces it. No time difference — so no comb in mono.',
    why: {
      'By the time between distant capsules': 'That is a spaced pair. X/Y capsules are together: the image is level only.',
      'By the stand’s height off the ground': 'Height changes the view, not left and right in the image.',
    },
  },
  {
    id: 'amb.two.2',
    page: 'twoMic',
    prompt: 'ORTF is “17 cm and 110°”. What is the 110°?',
    options: ['The angle between the two axes', 'The angle of each capsule from ahead', 'The spread of the source in front'],
    correct: 'The angle between the two axes',
    explain: '110° is the included angle between the capsules’ axes — 55° each side of the front — with the capsules 17 cm apart. Move the whole pair, never the geometry.',
    why: {
      'The angle of each capsule from ahead': 'That would be 220° between them. Each capsule is 55° off the front.',
      'The spread of the source in front': 'That is the pair’s recording angle (about 95°), not its 110°.',
    },
  },
  {
    id: 'amb.two.3',
    page: 'twoMic',
    prompt: 'Spaced omnis sound wide and open. Folded to mono, what do you listen for?',
    options: ['A comb from their time difference', 'The Side cancelling to silence', 'Nothing: two omnis sum as one clean mic'],
    correct: 'A comb from their time difference',
    explain: 'A source off to one side reaches the two omnis at different times; summed, some pitches cancel. Compare each channel too — two spaced mics are not one omni.',
    why: {
      'The Side cancelling to silence': 'That is M/S. Spaced omnis have no Side: their difference is time.',
      'Nothing: two omnis sum as one clean mic': 'Their time difference stays in the sum as a comb.',
    },
  },
  {
    id: 'amb.two.4',
    page: 'twoMic',
    prompt: 'An M/S take is summed to mono for a phone. What remains?',
    options: ['The Mid alone', 'The Side alone', 'Both, doubled'],
    correct: 'The Mid alone',
    explain: 'Left = Mid + Side, Right = Mid − Side: added together the Side cancels and the Mid remains — the centre holds.',
    why: {
      'The Side alone': 'It is the Side that cancels in the sum.',
      'Both, doubled': 'The Side’s plus and minus cancel each other in the sum.',
    },
  },
  {
    id: 'amb.prac.gain',
    page: 'practice',
    prompt: 'Where do you set the input gain for a plaza ambience?',
    options: ['On the loudest likely event, with headroom', 'On the quiet bed, as loud as it goes', 'On one fixed level used at all sites'],
    correct: 'On the loudest likely event, with headroom',
    explain: 'Test on the loudest likely event — a bus, a shout — and leave room so it does not clip. There is no one correct level for every ambience.',
    why: {
      'On the quiet bed, as loud as it goes': 'The next bus would clip. Leave headroom for the loudest event.',
      'On one fixed level used at all sites': 'Each scene and recorder decides its practical headroom.',
    },
  },
  {
    id: 'amb.prac.3',
    page: 'practice',
    prompt: 'What would justify a second ambience position?',
    options: ['It adds a clear editorial option', 'Two takes are better than one take', 'The first position felt too quiet'],
    correct: 'It adds a clear editorial option',
    explain: 'A second labelled position or a foreground detail earns its place when it gives a clear choice the first does not — logged with its own geometry.',
    why: {
      'Two takes are better than one take': 'More takes are more to sort; add one for a reason.',
      'The first position felt too quiet': 'Quiet is fixed by placement and gain — a second position is for a different picture.',
    },
  },
  {
    id: 'amb.mix.1',
    page: 'practice',
    prompt: 'You moved the stand toward the stream and the birds faded. Why?',
    options: ['The water grew against them', 'The birds flew farther away', 'The mic’s pattern changed'],
    correct: 'The water grew against them',
    explain: 'Nearer the water, the water grows much more than the distant birds: the balance tips. Move back to bring the birds forward.',
    why: {
      'The birds flew farther away': 'The birds may not have moved at all; your distance to the water changed.',
      'The mic’s pattern changed': 'The pattern is the same; the distances changed.',
    },
  },
  {
    id: 'amb.mix.2',
    page: 'practice',
    prompt: 'A windy take thumps. Can a high-pass filter rescue it?',
    options: ['Only partly — the damage is at the mic', 'Fully — it takes out the wind completely', 'Fully — and it keeps the low end intact'],
    correct: 'Only partly — the damage is at the mic',
    explain: 'A filter may reduce some rumble, but it also removes real low sound, and a buffeted, distorted take stays damaged. Protect the mic before recording.',
    why: {
      'Fully — it takes out the wind completely': 'Buffeting can overload the input; no filter undoes that.',
      'Fully — and it keeps the low end intact': 'A high-pass removes the low end too — real thunder, traffic or surf with the rumble.',
    },
  },
  {
    id: 'amb.mix.3',
    page: 'practice',
    prompt: 'A take is denoised, looped and layered from two spots. How is it labelled?',
    options: ['As an assembled bed, with its sources', 'As one unaltered recording of the site', 'As a calibrated measurement of the site'],
    correct: 'As an assembled bed, with its sources',
    explain: 'Keep raw channels apart from assembled deliverables: say where each layer came from and what was done to it. Never claim a built bed is one unaltered place.',
    why: {
      'As one unaltered recording of the site': 'It was altered and assembled: the label must say so.',
      'As a calibrated measurement of the site': 'An ordinary recording is not calibrated sound-pressure data.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'amb.sym.wind',
    observation: 'Low thumps and rumble come and go with the gusts',
    firstChecks: 'The wind protection for this site — fur, a basket and its suspension — and the position out of the gusts; then the cable and stand.',
    options: ['The protection and the position', 'A steep low cut in the mix', 'More gain to bury the thumps under it'],
    correct: 'The protection and the position',
    explain: 'Air on the capsule makes its own rumble. Add the next layer of protection or find shelter; a filter takes real low sound with it.',
    why: {
      'A steep low cut in the mix': 'It removes real low sound too, and cannot undo a buffeted capsule.',
      'More gain to bury the thumps under it': 'Gain raises the thumps with everything else.',
    },
  },
  {
    id: 'amb.sym.hole',
    observation: 'A spaced pair sounds thin and hollow when folded to mono',
    firstChecks: 'The spacing and the time difference between the capsules; compare each channel alone, and a coincident pair for a mono delivery.',
    options: ['The spacing and the mono fold-down', 'The battery charge in the recorder', 'The height of the tripod legs'],
    correct: 'The spacing and the mono fold-down',
    explain: 'Spaced capsules hear a side source at different times; summed, some pitches cancel. For a mono destination a coincident pair or M/S holds better.',
    why: {
      'The battery charge in the recorder': 'A battery does not cause a comb in the mono sum.',
      'The height of the tripod legs': 'Height is not the cause: the time between the capsules is.',
    },
  },
  {
    id: 'amb.sym.side',
    observation: 'An M/S take sounds hollow and the centre wanders',
    firstChecks: 'The matrix routing and the Side’s orientation — is the raw Side being used as a right channel?',
    options: ['The matrix routing and the Side', 'The windscreen’s colour and fit', 'The length of the take'],
    correct: 'The matrix routing and the Side',
    explain: 'The raw Side is not a right channel. Decode Left = Mid + Side and Right = Mid − Side, and check the Side faces left–right.',
    why: {
      'The windscreen’s colour and fit': 'A windscreen does not move the centre; the decoding does.',
      'The length of the take': 'Length does not cause it: check the matrix.',
    },
  },
  {
    id: 'amb.sym.handling',
    observation: 'Rattles and knocks the scene did not make',
    firstChecks: 'The stand, the suspension, the cable and the recorder — secure them and keep hands off during the take.',
    options: ['The stand, suspension and cable', 'The weather forecast for the day', 'The array’s spacing and angle'],
    correct: 'The stand, suspension and cable',
    explain: 'Handling and loose cables travel up the stand. Secure the recorder and cable, use the suspension, and do not move the stand during a take.',
    why: {
      'The weather forecast for the day': 'The rattle is mechanical: the stand and cable first.',
      'The array’s spacing and angle': 'Geometry changes the image, not knocks.',
    },
  },
  {
    id: 'amb.sym.lr',
    observation: 'Birds heard on the left appear on the right',
    firstChecks: 'The channel labels and the array’s orientation at the start, middle and end.',
    options: ['The channel labels and orientation', 'The mic’s pattern switch setting', 'The recorder’s sample rate'],
    correct: 'The channel labels and orientation',
    explain: 'Check left and right with a known source at the start, middle and end of a take, and keep the labels with the files.',
    why: {
      'The mic’s pattern switch setting': 'A pattern does not swap sides; labels and orientation do.',
      'The recorder’s sample rate': 'The sample rate does not swap channels.',
    },
  },
  {
    id: 'amb.sym.speech',
    observation: 'Conversations at the café can be understood',
    firstChecks: 'The position and the permission: move farther, aim away, or check privacy rules before using it.',
    options: ['Where it is, and permission', 'A louder recording level', 'A wider stereo pair set up'],
    correct: 'Where it is, and permission',
    explain: 'Identifiable speech needs permission under the place’s rules. Move or aim away, or check permissions before keeping or publishing it.',
    why: {
      'A louder recording level': 'Louder makes the speech clearer, not less of a problem.',
      'A wider stereo pair set up': 'Width does not make speech less intelligible.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'amb.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of an ambience session in the order you would do them.',
    steps: [
      { text: 'Name the listener and the format; check permission and the weather', early: 'Start with what the take is for, and whether you may — and safely can — be there.' },
      { text: 'Scout silently: the bed, the events, the wind, the reflectors', early: 'Listen before choosing anything.' },
      { text: 'Choose a listening point off every path; mount and protect the mic', early: 'Choose the point once you know the place.' },
      { text: 'Set gain on the loudest likely event, with headroom', early: 'Gain comes once the mic is up and protected.' },
      { text: 'Record a full normal cycle without moving the stand', early: 'Record once the level is safe.' },
      { text: 'Check left, right and mono; write the field log', early: 'Check and log once there is a take.' },
    ],
    explain: 'A sensible order: purpose and safety, listening, a protected mic at a safe point, headroom, an undisturbed take, then the checks and the log.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'amb.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A film bed for a quiet woodland scene: a stream off camera, birds, a light breeze. Stereo delivery that must also play in mono.',
    setups: [
      { id: 'a', label: 'An X/Y pair at the listening point, 1.5 m up, in fur over a basket', ok: true, power: 'phantom', feedback: 'A suggested starting point: compact and dependable in mono — check what lands in the middle.' },
      { id: 'b', label: 'An M/S pair just off the path, its Side and Mid kept labelled', ok: true, power: 'phantom', feedback: 'A fair choice: width set later, the Mid holds in mono — keep the raw tracks labelled.' },
      { id: 'c', label: 'Spaced omnis 3 m apart right on the bank', ok: false, power: 'phantom', feedback: 'The bank may be unstable, the water would take over, and wide spacing combs in mono.' },
      { id: 'd', label: 'One cardioid on the path, aimed at the birds', ok: false, power: 'phantom', feedback: 'The path stays clear — and one mic gives no stereo.' },
      { id: 'e', label: 'An X/Y pair in bare foam, a filter on to stop the wind', ok: false, power: 'phantom', feedback: 'Foam alone may not be enough in a breeze, and a filter cannot rescue buffeting.' },
    ],
    reasons: [
      { id: 'r.point', label: 'The listening point gives the balance the scene needs', role: 'required', feedback: 'Say why this point — the balance of water and birds is the main choice.' },
      { id: 'r.mono', label: 'The pair holds up in mono', role: 'required', feedback: 'The brief needs mono: say how the pair handles it.' },
      { id: 'r.wind', label: 'The protection suits the wind', role: 'optional', feedback: 'A fair reason on any outdoor site.' },
      { id: 'r.brand', label: 'It is the brand nature recordists use', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties and by ear.' },
      { id: 'r.loud', label: 'It gives the loudest signal', role: 'wrong', feedback: 'Loudness is not a reason — level comes from gain and the balance from position.' },
    ],
    explain: 'More than one setup passes. What passes is the reasoning: a listening point chosen for the balance, a pair that holds in mono, and protection that suits the day.',
  },
  {
    id: 'amb.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A live stream from a city plaza: the square’s atmosphere under a presenter, a small PA nearby.',
    setups: [
      { id: 'a', label: 'One protected omni in the open square, off the PA’s front', ok: true, power: 'phantom', feedback: 'A suggested starting point for live: one stable open channel, little PA in it — check at show level.' },
      { id: 'b', label: 'One cardioid facing the square, its back to the PA', ok: true, power: 'phantom', feedback: 'A fair live choice: the rear toward the PA — check the margin with the operator.' },
      { id: 'c', label: 'Four ambience mics open round the PA', ok: false, power: 'phantom', feedback: 'Each open mic takes margin away and adds spill. Start with one.' },
      { id: 'd', label: 'A stand on the sidewalk, nearest the road', ok: false, power: 'phantom', feedback: 'The sidewalk stays clear. Find a safe spot off it.' },
      { id: 'e', label: 'Raise the ambience until it rings, then back off', ok: false, power: 'phantom', feedback: 'Feedback is never provoked — not even to find the edge.' },
    ],
    reasons: [
      { id: 'r.pa', label: 'Little of the PA reaches it', role: 'required', feedback: 'Say where the PA is against the mic.' },
      { id: 'r.clear', label: 'The stand is off every path and route', role: 'required', feedback: 'Clearance is part of every passing setup.' },
      { id: 'r.mono', label: 'The stream’s mono path is checked', role: 'optional', feedback: 'A fair live reason.' },
      { id: 'r.ring', label: 'Find the edge of feedback, then back off', role: 'wrong', feedback: 'Feedback is never provoked.' },
    ],
    explain: 'Two setups pass. What passes is the reasoning: one open channel with little PA in it, the stand clear of every route, and the gain checked with the operator — never by making it ring.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you move it: two metres nearer the stream, what grows most?', options: ['The water', 'The birds', 'Both the same'], after: 'Now move LISTEN AT toward the water and back, and watch SINCE THE START.' },
  microphone: { prompt: 'Before you move anything: where does a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'In front of it'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the mic 6 m back from the stream. What changes?', options: ['More birds and wood, less water', 'More water', 'Nothing you could hear'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'Open grassland, a breeze: is foam enough?', options: ['Usually not', 'Yes, it is enough', 'Only at night'], after: 'Now add the layers with COVER and change SITE.' },
  twoMic: { prompt: 'Which pair places a source by level alone?', options: ['X/Y', 'Spaced omnis', 'ORTF'], after: 'Now sweep BEARING with each PAIR and watch TIME.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'amb.q.1',
    covers: 'setting',
    critical: true,
    prompt: 'Thunder is heard. When may you go back out?',
    options: ['30 min after the last lightning or thunder', 'As soon as the rain has eased off', 'When the sky over the site looks brighter'],
    correct: '30 min after the last lightning or thunder',
    explain: 'Get into a substantial building or a hard-topped vehicle at once; wait 30 minutes after the last lightning or thunder.',
    why: { 'As soon as the rain has eased off': 'Lightning can strike after the rain: wait 30 minutes.', 'When the sky over the site looks brighter': 'A brighter sky is not the signal: wait 30 minutes after the last lightning or thunder.' },
  },
  {
    id: 'amb.q.2',
    covers: 'setting',
    critical: true,
    prompt: 'An animal reacts to you while you set up. What does it mean?',
    options: ['You are too close: back away', 'It is curious: keep working', 'It is calm: set up a bit nearer'],
    correct: 'You are too close: back away',
    explain: 'If an animal reacts to you, you are too close. Follow local distances — never lure or feed it.',
    why: { 'It is curious: keep working': 'A reaction means too close, whatever the reason.', 'It is calm: set up a bit nearer': 'It has just reacted to you: that means too close. Increase the distance, never close it.' },
  },
  {
    id: 'amb.q.3',
    covers: 'sound',
    prompt: 'Near a stream, what does a few steps’ move change most?',
    options: ['The water against the rest', 'The birds against the rest', 'Nothing much at all'],
    correct: 'The water against the rest',
    explain: 'The nearest source changes distance most: near water, the water’s share of the balance changes most.',
    why: { 'The birds against the rest': 'The birds are farther: their distance changes least.', 'Nothing much at all': 'Near water a small move is clearly heard.' },
  },
  {
    id: 'amb.q.4',
    covers: 'sound',
    prompt: 'In a city ambience, the steady traffic is…',
    options: ['The bed', 'An event', 'Noise to remove'],
    correct: 'The bed',
    explain: 'The steady layer of a place is its bed; buses, sirens and voices are events on top.',
    why: { 'An event': 'Events come and go; the traffic is continuous.', 'Noise to remove': 'In a city ambience the traffic is part of the place.' },
  },
  {
    id: 'amb.q.5',
    covers: 'setting',
    prompt: 'Where do stands go in a plaza?',
    options: ['Off lanes, walks and routes', 'Beside the kerb, on the road', 'In the walkway, coned off'],
    correct: 'Off lanes, walks and routes',
    explain: 'Keep stands and cables off vehicle lanes, walking paths and access routes — a cone does not make a route safe.',
    why: { 'Beside the kerb, on the road': 'Nothing goes on the road.', 'In the walkway, coned off': 'A cone does not make a walkway safe for a stand.' },
  },
  {
    id: 'amb.q.6',
    covers: 'setting',
    prompt: 'Rain starts on a mic in a basket and fur. What does the windscreen do about it?',
    options: ['Little: shelter the mic and plugs', 'It keeps the capsule dry for the take', 'Enough, if the fur is thick and long'],
    correct: 'Little: shelter the mic and plugs',
    explain: 'A windscreen is not waterproofing: shelter outdoor mics from rain, sleet and snow, and protect the connectors.',
    why: { 'It keeps the capsule dry for the take': 'It slows the wind; water still gets through to the mic.', 'Enough, if the fur is thick and long': 'Thicker fur slows more wind — and soaks up water. Shelter the mic.' },
  },
];

export const F06_LESSON: Lesson = {
  id: 'F06',
  labId: 'field',
  title: 'Natural and Urban Ambience',
  subtitle: 'A listening point chosen by ear, about 1.5 m up and off every path — one mic or a pair, protected from the wind, checked in mono',
  noun: { one: 'ambience', many: 'ambiences', subject: 'place' },
  model: F06_MODEL,
  micTypeIds: ['arrOmni', 'arrCard', 'arrFig8'],
  zones: F06_ZONES,
  setupPairs: F06_PAIRS,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'An ambience is the sound of a place at a time: a woodland’s birds, water and leaves; a city’s traffic, voices and footsteps — a steady bed with events on top.', src: 'LESSON-F06' },
    { title: 'WHAT IT IS FOR', text: 'An honest record of a site, a background under a picture, a live feed for remote listeners — or a measurement, which is a different job with its own method.', src: 'LESSON-F06' },
    { title: 'WHERE YOU LISTEN', text: 'The listening point decides the balance. Site, time, weather, wind and people all change what is there — so you listen first, then choose.', src: 'NPS-RM47' },
    { title: 'WHAT THIS LAB DRAWS', text: 'Two illustrated places — a woodland stream and a city plaza — with a listening point, paths and lanes kept clear, and birds — and the mics on the site plan — drawn larger than life so you can find them.', src: 'LESSON-F06' },
  ],
  sound: {
    stages: [
      { title: 'The bed', text: 'The steady layer of the place: water, wind in the trees, traffic.' },
      { title: 'The events', text: 'Calls, voices, vehicles that come and go over the bed.' },
      { title: 'The place', text: 'Reflections off walls and ground; the wind itself.' },
    ],
    attack: 'Events arrive as separate sounds over the bed.',
    body: 'The bed carries on: the place itself.',
    head: { diameterMm: 0, rods: 0, label: 'the place', strikeSrc: 'LESSON-F06' },
  },
  setting: {
    items: [
      { id: 'paths', label: 'paths, lanes and access routes', short: 'PATHS', note: 'Stands, cables and crew stay off them.', prov: { kind: 'sourced', src: 'LESSON-F06', quote: 'Keep microphones and stands off vehicle lanes, walking paths and access routes (L33)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'water', label: 'water and banks', short: 'WATER', note: 'Stay off unstable banks; a windscreen is not waterproofing.', prov: { kind: 'sourced', src: 'S-SM63', quote: 'must still be sheltered from rain, sleet, snow, and other precipitation' }, tag: 'SAFETY', scene: 'all' },
      { id: 'wildlife', label: 'wildlife', short: 'WILDLIFE', note: 'Local distances first; if an animal reacts, you are too close.', prov: { kind: 'sourced', src: 'NPS-WILD', quote: 'If animals react to your presence you are too close' }, tag: 'SETBACK', scene: 'all' },
    ],
    stage: 'LIVE: one open ambience channel off the PA, routed on purpose, checked at a controlled level — never by making it ring.',
    studio: 'FILM OR STUDIO: an identifiable bed and separate foreground options, each labelled with its place and time.',
  },
  diagnostic,
  practice: {
    task: 'Choose setups for a woodland bed and a city plaza, and say what one take can honestly be called. With permission on a real site and every position safe, you can keep a field log below.',
    fields: fieldLog([logText('dest', 'Listener, delivery format and mono need'), logChoice('array', 'Pickup', ['One mic', 'X/Y', 'ORTF', 'Spaced omnis', 'M/S', 'Other'])]),
  },
  unknowns: [
    { text: 'Both sites — the stream, the path, the trees, the plaza, the road, the café and the facade — are illustrated drawings, not measured places.', dims: [] },
    { text: 'The 1.5 m mic height, the 5–7 m and 11–14 m distances from the water, the 7–11 m and 12.5–15.5 m distances from the kerb — drawing defaults (no source gives an ambience height or distance).', dims: [] },
    { text: 'The spaced-omni spacing of 60 cm (O-8): no source gives one for ambience.', dims: [] },
    { text: 'The image position drawn from level and time differences (full side at 15 dB or 1.1 ms) — a simplified picture; the balance readout treats each source as a point in a free field.', dims: [] },
    { text: 'Birds are drawn about a metre across so they can be found; the wind curls at the capsule are a cue, not a level.', dims: [] },
  ],
  live: { wedges: [] },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — possible starting points and ideas to consider, not rules. Every place, day and weather is different: listen first, move the mic, experiment, and trust your ears and the room around you. Experimentation is encouraged. The lab is silent and draws a simplified picture: two illustrated sites, birds and mics drawn larger than life on the plans, textbook mic patterns, each source as a point in open air, and an image position that is a simplified picture of level and time. An ordinary recording is not a calibrated measurement.',
  copy: F06_COPY,
};
