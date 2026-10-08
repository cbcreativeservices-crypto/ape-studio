/**
 * F07 WILDLIFE AND DISTANT SOURCES — the lesson as DATA (Miking Lab 6, group
 * 2, branch lab6-g2). Words from the owner's lesson (docs/labs/miking/
 * source_text/F07-Wildlife-and-Distant-Sources-Miking-Technique.txt, "L<n>"
 * in comments only) with field_wildlife_distant/SOURCES.md §c applied and
 * logged in CORRECTIONS_LOG.md (Lab 6 · group 2): no institutional wording
 * (F07-C1); the US-park distances as examples, local rules first (F07-C2);
 * the dish–wavelength relation taught, with the threshold computed for the
 * drawn dish — little help below about c / D (F07-C3); the dish-rustle line
 * kept as practice, uncited (F07-C4).
 *
 * Owner rulings: suggested starting points; no source, brand or authority on
 * screen; safety exact in plain words; no dish gain curve (O-9 default);
 * FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom } from '../../engine/model/types.ts';
import { fieldLog, logChoice, logText } from '../shared/field/fieldLog.ts';
import { F07_MODEL } from './geometry.ts';
import { F07_PAIRS, F07_ZONES } from './model.ts';
import { F07_COPY } from './copy.ts';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the distant source',
    goal: 'Meet a distant source as something to record: one bird, a flock, a low call far away — and the safe, permitted point you work from.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A distant source is heard from a permitted observation point, outside the animal’s setback. The target, its movement and its surroundings decide the pickup.',
  },
  sound: {
    title: 'The target and its surroundings',
    goal: 'See how a few metres toward the target — never past its setback — and away from a brook change the call against its background, and why no mic makes distance disappear.',
    credit: { scenarios: ['wl.snd.1', 'wl.snd.2', 'wl.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'Position chooses the balance: the quietest permitted spot helps more than any gain. A directional mic changes the balance; it never removes the distance.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Settle the target, the purpose and a permitted observation point before setting up — and keep the animals, the trails and yourself safe.',
    credit: { scenarios: ['wl.set.1', 'wl.set.2', 'wl.set.3'], note: 'Answer the three checks.' },
    takeaway: 'Local rules first; if an animal reacts you are too close. No calls, playback or lures; trails clear; indoors when thunder is heard.',
  },
  microphone: {
    title: 'Shotgun, dish or wide',
    goal: 'See why a dish helps only where the wavelength is shorter than the dish, why it needs to be aimed precisely, and what a shotgun and an omni do instead.',
    credit: { scenarios: ['wl.mic.1', 'wl.mic.2', 'wl.mic.3', 'wl.rec.1'], interactive: 'dishTried', note: 'Move the pitch below and above the dish’s line, and answer the four checks.' },
    takeaway: 'A dish gathers mid and high pitches at its focus while the aim holds, and gives little help below about c / D for its size. A shotgun narrows in the highs and follows movement more easily; an omni keeps the place.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — a shotgun at a permitted point outside the setback ring, aimed at the call — then try the dish, the habitat mic or a wider view.',
    credit: { scenarios: ['wl.place.1', 'wl.place.2', 'wl.place.3', 'wl.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the ring and the trail, in two different starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'An observation point is a place to begin, outside the ring — not a rule. Aim is the dish’s main control; for a shotgun, aim and a quiet position.',
  },
  context: {
    title: 'Wind, live and science',
    goal: 'Protect the mic from wind before reaching for a filter, leave headroom for the strongest call, and know what live coverage and a monitoring survey each need.',
    credit: { scenarios: ['wl.ctx.1', 'wl.ctx.2', 'wl.ctx.3', 'wl.rec.3'], interactive: 'windTried', note: 'Try the wind layers at the forest and in the open, and answer the four checks.' },
    takeaway: 'Foam in a sheltered forest, fur and a basket in the open; a dish catches the wind too. Keep the raw take and label any processing; for a survey, keep the method the same.',
  },
  twoMic: {
    title: 'A moving flock',
    goal: 'Move a flock across a field and compare a shotgun held still, a shotgun re-aimed smoothly and a wide omni — and keep a focused channel and a habitat channel apart.',
    credit: { scenarios: ['wl.two.1', 'wl.two.2', 'wl.two.3', 'wl.two.4'], interactive: 'flockScrubbed', note: 'Move the flock across the field, and answer the four checks.' },
    takeaway: 'A fixed narrow mic loses a moving flock off its axis; a smooth re-aim keeps it; a wide mic gives steadier coverage with less isolation. A focused channel and a habitat channel are two labelled paths.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the aim, the position, the wind protection and the handling first — never close the distance to an animal, and never chase a lost target with gain.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a wildlife session in order, choose and justify setups for a single bird and a flock, and say what one take can and cannot prove.',
    credit: { scenarios: ['wl.prac.order', 'wl.prac.gain', 'wl.prac.setup1', 'wl.prac.setup2', 'wl.prac.3', 'wl.mix.1', 'wl.mix.2', 'wl.mix.3'], note: 'Put the session in order, answer the level check, complete both briefs, and answer the four reasoning cards. The field log is optional — it needs a real site.' },
    takeaway: 'A permitted point outside the ring, the right tool for the target, steady aim, protection from the wind, headroom for the strongest call — and a log that says what is known and what is not. More than one setup can pass.',
  },
};

/* THE CHECKS. Lesson lines in comments only: snd L3, L5–L6 · set L5–L6, L36–L38 · mic L11–L28 ·
 * place L26–L29 · ctx L30–L35 · two L28–L29 · prac L39–L46. */
const scenarios: MikingScenario[] = [
  {
    id: 'wl.snd.1',
    page: 'sound',
    prompt: 'A shotgun is aimed at a bird 26 m away. Does the bird now sound as if it were close?',
    options: ['The distance is still there', 'The tube brings it much closer', 'It will, if the gain is high enough'],
    correct: 'The distance is still there',
    explain: 'A directional mic changes the balance between the target and its surroundings; it does not make distance disappear or amplify the target.',
    why: {
      'The tube brings it much closer': 'The tube reduces some off-axis sound; it does not bring the bird nearer.',
      'It will, if the gain is high enough': 'Gain raises the bird and everything around it together.',
    },
  },
  {
    id: 'wl.snd.2',
    page: 'sound',
    prompt: 'A brook behind you competes with the call. What helps most?',
    options: ['A permitted spot farther from the brook', 'More gain on the recorder’s input stage', 'A low-cut filter on the recorder channel'],
    correct: 'A permitted spot farther from the brook',
    explain: 'Choose the time and the position before adding gain: a quieter spot away from water improves the call against its background more than the recorder can.',
    why: {
      'More gain on the recorder’s input stage': 'Gain raises the brook as much as the call.',
      'A low-cut filter on the recorder channel': 'Running water is broadband: a filter barely touches it and may thin the call.',
    },
  },
  {
    id: 'wl.snd.3',
    page: 'sound',
    prompt: 'You hear a call you think you know. How do you write it in the log?',
    options: ['Confirmed, provisional or unknown', 'As the species you expected to hear', 'Only if an expert is on hand to check'],
    correct: 'Confirmed, provisional or unknown',
    explain: 'Do not promise an identification from sound alone: write it as confirmed, provisional or unknown, by the evidence you have.',
    why: {
      'As the species you expected to hear': 'Expectation is not evidence: say how sure you are.',
      'Only if an expert is on hand to check': 'Log it either way — with the confidence you really have.',
    },
  },
  {
    id: 'wl.set.1',
    page: 'setting',
    prompt: 'An elk lifts its head and steps away as you set up. What now?',
    options: ['Back away — you are too close', 'Stay still until it settles down again', 'Move closer before it leaves'],
    correct: 'Back away — you are too close',
    explain: 'If an animal reacts to you, you are too close: back away and leave it room to move.',
    why: {
      'Stay still until it settles down again': 'It has already reacted: increase the distance.',
      'Move closer before it leaves': 'Never close the distance for a cleaner take.',
    },
  },
  {
    id: 'wl.set.2',
    page: 'setting',
    prompt: 'The bird has gone quiet. Can you play its call to bring it back?',
    options: ['No — never play calls or use lures', 'Yes — but only quietly, from far off', 'Yes — if it is a common species'],
    correct: 'No — never play calls or use lures',
    explain: 'No recorded calls, playback, lures or attractants. Wait, or come back at another time.',
    why: {
      'Yes — but only quietly, from far off': 'Playback at any level disturbs the animal.',
      'Yes — if it is a common species': 'The rule is the same for every species.',
    },
  },
  {
    id: 'wl.set.3',
    page: 'setting',
    prompt: 'US national parks give 25 yards for most wildlife. In a different park, you…',
    options: ['Follow that place’s own rules first', 'Use 25 yards wherever you happen to be', 'Use whatever distance feels safe'],
    correct: 'Follow that place’s own rules first',
    explain: 'Those distances are one example. Local rules come first — some parks ask for more, and bears and wolves need 100 yards in that example.',
    why: {
      'Use 25 yards wherever you happen to be': 'It is an example, not a universal rule: check the local rules.',
      'Use whatever distance feels safe': 'The place’s rules decide, and an animal’s reaction can tell you it is too close.',
    },
  },
  {
    id: 'wl.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · What improves a call against a noisy background most?',
    options: ['A quieter permitted position', 'More gain on the input stage', 'A narrower recording format for it'],
    correct: 'A quieter permitted position',
    explain: 'Position first: time and place decide the balance before any gain is added.',
    why: {
      'More gain on the input stage': 'Gain lifts the background with the call.',
      'A narrower recording format for it': 'The format does not change what reaches the mic.',
    },
  },
  {
    id: 'wl.mic.1',
    page: 'microphone',
    prompt: 'A 57 cm dish. Which call gets the most help from it?',
    options: ['A thin, high call', 'A deep, low call', 'Both get the same'],
    correct: 'A thin, high call',
    explain: 'A high call’s wavelength is far shorter than the dish, so the bowl gathers it at the focus; below about 600 Hz for this size the dish gives little help.',
    why: {
      'A deep, low call': 'Its wavelength is longer than the dish: little help — the capsule hears it directly.',
      'Both get the same': 'The help depends on the wavelength against the dish: the high call gets more.',
    },
  },
  {
    id: 'wl.mic.2',
    page: 'microphone',
    prompt: 'Which way does the capsule face in a parabolic dish?',
    options: ['Back toward the dish, at its focus', 'Out toward the bird, at the dish’s rim', 'Sideways, along the dish’s rim'],
    correct: 'Back toward the dish, at its focus',
    explain: 'The capsule sits at the focus facing the dish, as its maker specifies — the bowl sends the sound back to it. Never move it to another product’s focus.',
    why: {
      'Out toward the bird, at the dish’s rim': 'The bowl gathers the sound at the focus; the capsule faces the bowl.',
      'Sideways, along the dish’s rim': 'At the focus, facing the dish — the maker’s position.',
    },
  },
  {
    id: 'wl.mic.3',
    page: 'microphone',
    prompt: 'The dish’s “gain” at the focus is…',
    options: ['Sound concentrated by the bowl', 'Electrical gain in the capsule', 'A filter that boosts the highs'],
    correct: 'Sound concentrated by the bowl',
    explain: 'The bowl gathers sound to the focus: acoustic concentration, not preamp gain — and only where the wavelength is shorter than the dish.',
    why: {
      'Electrical gain in the capsule': 'The capsule is an ordinary mic: the bowl does the concentrating.',
      'A filter that boosts the highs': 'No filter: the bowl’s size against the wavelength favours the highs.',
    },
  },
  {
    id: 'wl.place.1',
    page: 'placement',
    prompt: 'The best-sounding spot is inside the bird’s setback ring. What now?',
    options: ['Stay outside it and aim carefully', 'Step in for one quick take only', 'Move in slowly so it does not notice'],
    correct: 'Stay outside it and aim carefully',
    explain: 'The ring is never crossed for a cleaner take. Work from a permitted point outside it — aim, position and a quiet spot are your tools.',
    why: {
      'Step in for one quick take only': 'Even briefly, inside the ring is too close.',
      'Move in slowly so it does not notice': 'Slowly is still too close: stay outside the ring.',
    },
  },
  {
    id: 'wl.place.2',
    page: 'placement',
    prompt: 'With a dish, what do you do before recording a phrase?',
    options: ['Sweep slowly on headphones to aim', 'Raise the gain as far as it goes', 'Point it roughly toward the trees'],
    correct: 'Sweep slowly on headphones to aim',
    explain: 'A narrow dish needs to be aimed precisely: sweep slowly, find where the call is clearest, and hold it steady through the phrase.',
    why: {
      'Raise the gain as far as it goes': 'Gain does not aim: find the clearest direction first.',
      'Point it roughly toward the trees': 'Roughly loses the high pitches first — aim precisely.',
    },
  },
  {
    id: 'wl.place.3',
    page: 'placement',
    prompt: 'The bird flies to another tree as you record with a dish. What do you do?',
    options: ['Pause, re-aim between phrases', 'Boost the gain to keep it there', 'Walk after it with the dish aimed'],
    correct: 'Pause, re-aim between phrases',
    explain: 'Re-aim smoothly between phrases from where you stand — or pause. Never chase it with gain, and never step off your point while aiming.',
    why: {
      'Boost the gain to keep it there': 'Off the axis you would only raise what is there now.',
      'Walk after it with the dish aimed': 'Feet stay planted: watch your footing and the trail.',
    },
  },
  {
    id: 'wl.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Below about what pitch does a 57 cm dish give little help?',
    options: ['About 600 Hz', 'About 60 Hertz', 'About 6 kHz'],
    correct: 'About 600 Hz',
    explain: 'Where the wavelength matches the dish: c / D ≈ 343 / 0.57 ≈ 600 Hz for this size. It belongs to this dish, not to every dish.',
    why: {
      'About 60 Hertz': 'That would need a dish about 6 m across.',
      'About 6 kHz': 'That would be a dish under 6 cm across.',
    },
  },
  {
    id: 'wl.ctx.1',
    page: 'context',
    prompt: 'Open grassland, a breeze, a shotgun in foam. Low thumps. First move?',
    options: ['Fur, then a basket and suspension', 'A steep low-cut filter, then record on', 'Hold the mic lower to the ground'],
    correct: 'Fur, then a basket and suspension',
    explain: 'Foam may do in a sheltered forest but not on windy open ground: add fur, a basket and its suspension, and quiet the cable.',
    why: {
      'A steep low-cut filter, then record on': 'It may take a real low call with the rumble — protect first, and note any filter.',
      'Hold the mic lower to the ground': 'Lower is not the cure: the capsule needs protection.',
    },
  },
  {
    id: 'wl.ctx.2',
    page: 'context',
    prompt: 'For a nature film, after cleaning up a call, you keep…',
    options: ['The raw take, and a labelled cleaned copy', 'Only the cleaned copy, kept as the original', 'Only the loudest part of the call'],
    correct: 'The raw take, and a labelled cleaned copy',
    explain: 'Keep the unaltered original; label any processed version, with the species or its uncertainty and the place.',
    why: {
      'Only the cleaned copy, kept as the original': 'A processed copy is not the original: keep both, labelled.',
      'Only the loudest part of the call': 'The whole raw take keeps the context and the evidence.',
    },
  },
  {
    id: 'wl.ctx.3',
    page: 'context',
    prompt: 'A survey compares two sites. What must stay the same?',
    options: ['The mic, settings, place and method', 'Only the time of day of the two visits', 'Nothing, if both takes sound good'],
    correct: 'The mic, settings, place and method',
    explain: 'For a comparison, keep the mic and its settings, orientation, place, dates, schedule and weather notes the same, as the method asks.',
    why: {
      'Only the time of day of the two visits': 'Time matters — so do the mic, the settings and the method.',
      'Nothing, if both takes sound good': 'Sounding good is not a comparison: the method must match.',
    },
  },
  {
    id: 'wl.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Thunder is heard during a dawn chorus. You…',
    options: ['Get inside a safe place at once', 'Finish the phrase first, then leave', 'Shelter under the tallest tree'],
    correct: 'Get inside a safe place at once',
    explain: 'Go into a substantial building or a hard-topped vehicle at once, and wait 30 minutes after the last lightning or thunder.',
    why: {
      'Finish the phrase first, then leave': 'A recording is never a reason to stay out.',
      'Shelter under the tallest tree': 'A tree is not shelter from lightning.',
    },
  },
  {
    id: 'wl.two.1',
    page: 'twoMic',
    prompt: 'A flock crosses fast and wide. Is a shotgun easier to use here than a dish?',
    options: ['Yes — its wider angle copes better', 'No — a dish follows a flock better', 'No — neither can follow a flock'],
    correct: 'Yes — its wider angle copes better',
    explain: 'A shotgun’s broader useful angle copes with fast, wide movement better than a narrow dish; re-aim smoothly with your feet planted.',
    why: {
      'No — a dish follows a flock better': 'A narrow dish loses fast, wide movement: aiming it precisely at moving birds is hard.',
      'No — neither can follow a flock': 'A shotgun re-aimed smoothly, feet planted, can follow a flock well.',
    },
  },
  {
    id: 'wl.two.2',
    page: 'twoMic',
    prompt: 'A shotgun held still: the flock crosses its axis. What happens?',
    options: ['Strong on the axis, then it fades', 'Even, from one end of it to the other', 'Louder as it leaves the axis'],
    correct: 'Strong on the axis, then it fades',
    explain: 'As the flock leaves the axis the pickup falls and the tone changes. Note where it crosses the edge of the useful angle.',
    why: {
      'Even, from one end of it to the other': 'Only an omni follows distance alone; a shotgun adds its own off-axis fall.',
      'Louder as it leaves the axis': 'Off the axis a shotgun hears less, not more.',
    },
  },
  {
    id: 'wl.two.3',
    page: 'twoMic',
    prompt: 'A shotgun on the bird and an omni for the habitat. How are they kept?',
    options: ['As two labelled channels', 'Summed at once into one', 'The omni deleted later on'],
    correct: 'As two labelled channels',
    explain: 'They are two paths with two jobs: label each, blend later if the scene needs it, and keep the raw focused take.',
    why: {
      'Summed at once into one': 'Summing at once removes the choice later — and the two hear different things.',
      'The omni deleted later on': 'The habitat channel may be what the scene needs: keep it labelled.',
    },
  },
  {
    id: 'wl.two.4',
    page: 'twoMic',
    prompt: 'The flock leaves the beam mid-phrase. What do you avoid?',
    options: ['Turning the gain up to keep it', 'Pausing until it comes back', 'Moving to another permitted spot'],
    correct: 'Turning the gain up to keep it',
    explain: 'Off the beam, more gain only raises what is now on the axis. Pause, re-aim between phrases, or move to another permitted point.',
    why: {
      'Pausing until it comes back': 'Pausing is a fair choice.',
      'Moving to another permitted spot': 'That is a fair choice too, if it is permitted and safe.',
    },
  },
  {
    id: 'wl.prac.gain',
    page: 'practice',
    prompt: 'Where do you set the level for a bird recording?',
    options: ['For the strongest likely call', 'For the quietest note heard', 'At one fixed setting each time'],
    correct: 'For the strongest likely call',
    explain: 'Listen for the strongest likely call or transient and leave headroom; there is no one safe setting for every animal and distance.',
    why: {
      'For the quietest note heard': 'The next strong call would clip.',
      'At one fixed setting each time': 'Each animal, recorder and distance is different.',
    },
  },
  {
    id: 'wl.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a wide habitat channel?',
    options: ['The surroundings matter to the scene', 'More channels will sound better', 'The focused take is too quiet'],
    correct: 'The surroundings matter to the scene',
    explain: 'A habitat channel earns its place when the place matters to the deliverable — labelled as such.',
    why: {
      'More channels will sound better': 'More channels are more to manage: add one for a reason.',
      'The focused take is too quiet': 'Level is fixed by position and gain, not by another channel.',
    },
  },
  {
    id: 'wl.mix.1',
    page: 'practice',
    prompt: 'A low rumble from a large animal, a 57 cm dish. What do you expect?',
    options: ['Little help from the dish', 'A strong boost of the rumble', 'Silence from the capsule'],
    correct: 'Little help from the dish',
    explain: 'The rumble’s wavelength is longer than the dish: little help — the capsule still hears it directly. A shotgun or a wide mic may serve better.',
    why: {
      'A strong boost of the rumble': 'Long wavelengths are not gathered by a small dish.',
      'Silence from the capsule': 'The capsule still hears the sound directly — just without the dish’s help.',
    },
  },
  {
    id: 'wl.mix.2',
    page: 'practice',
    prompt: 'One clear call is on the recording. What does it prove?',
    options: ['That a call happened then', 'How many birds were there', 'That none called elsewhere'],
    correct: 'That a call happened then',
    explain: 'A single clear call proves an event was captured — not abundance, absence elsewhere or an exact distance.',
    why: {
      'How many birds were there': 'One call cannot count the birds.',
      'That none called elsewhere': 'Absence elsewhere needs a structured survey.',
    },
  },
  {
    id: 'wl.mix.3',
    page: 'practice',
    prompt: 'Two takes, a dish and a shotgun, one day. Which one is better?',
    options: ['It depends on the call and the conditions', 'The dish, for each call and on each day', 'The shotgun, for each call on each day'],
    correct: 'It depends on the call and the conditions',
    explain: 'Two uncontrolled takes cannot prove one tool better in general: the call, the movement and the day decide.',
    why: {
      'The dish, for each call and on each day': 'A dish suits a localized high call — not a flock or a low rumble.',
      'The shotgun, for each call on each day': 'A shotgun suits movement — a dish may beat it on a fixed high call.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'wl.sym.dull',
    observation: 'The dish take sounds dull and distant',
    firstChecks: 'The aim — sweep on headphones for the clearest direction — and the capsule at the maker’s focus.',
    options: ['The aim and the capsule at its focus', 'More gain on the recorder’s input channel', 'A brighter EQ setting at once'],
    correct: 'The aim and the capsule at its focus',
    explain: 'A small aim error loses the high pitches first; a capsule off its focus loses the dish’s help. Aim precisely, as the maker mounts it.',
    why: { 'More gain on the recorder’s input channel': 'Gain raises everything, dull or not.', 'A brighter EQ setting at once': 'EQ cannot replace a precise aim.' },
  },
  {
    id: 'wl.sym.wind',
    observation: 'Low thumps come and go with the gusts',
    firstChecks: 'The wind protection — fur, a basket and its suspension — and a more sheltered permitted spot; the dish as a surface in the wind.',
    options: ['Protection and a sheltered spot', 'A high-pass filter on its own, and go', 'Moving nearer the animal'],
    correct: 'Protection and a sheltered spot',
    explain: 'Protect the capsule first; a filter may remove a real low call. A dish is a large surface in the wind too.',
    why: { 'A high-pass filter on its own, and go': 'It can take a real low call with the rumble.', 'Moving nearer the animal': 'Never close the distance to an animal.' },
  },
  {
    id: 'wl.sym.lost',
    observation: 'The bird keeps fading in and out of the take',
    firstChecks: 'Whether it is moving off the beam — re-aim between phrases, or a shotgun or wider mic for a moving bird.',
    options: ['Its movement off the beam', 'The recorder’s battery', 'The cable’s length'],
    correct: 'Its movement off the beam',
    explain: 'A moving bird leaves a narrow beam: re-aim smoothly between phrases, or use a broader tool.',
    why: { 'The recorder’s battery': 'A battery does not follow the bird.', 'The cable’s length': 'Length does not make a call fade in and out.' },
  },
  {
    id: 'wl.sym.handling',
    observation: 'Rubs and clicks from the grip during the take',
    firstChecks: 'The suspension, the grip and the cable — and a steady hold through the phrase.',
    options: ['Suspension, grip and cable', 'A narrower dish or a longer tube', 'A louder bird to cover it'],
    correct: 'Suspension, grip and cable',
    explain: 'Handling travels up the grip: use the suspension, secure the cable and hold steady during a phrase.',
    why: { 'A narrower dish or a longer tube': 'Narrower pickup does not stop handling noise.', 'A louder bird to cover it': 'You cannot make a bird louder — and should not try.' },
  },
  {
    id: 'wl.sym.hiss',
    observation: 'A quiet call is buried in hiss',
    firstChecks: 'A quieter, closer permitted position and a low-noise mic and recorder — before more gain.',
    options: ['Position and low-noise gear first', 'Maximum gain on the recorder input', 'Stepping just inside the ring'],
    correct: 'Position and low-noise gear first',
    explain: 'Raising the gain raises the mic’s and the place’s noise too; a better permitted position and quieter gear help more.',
    why: { 'Maximum gain on the recorder input': 'It raises the hiss with the call.', 'Stepping just inside the ring': 'Never: the ring is not crossed.' },
  },
  {
    id: 'wl.sym.reacts',
    observation: 'The animal keeps looking toward you',
    firstChecks: 'Your distance — back away; it is reacting to you.',
    options: ['Your distance: back away', 'The dish’s colour', 'The recorder’s settings'],
    correct: 'Your distance: back away',
    explain: 'If an animal reacts to you, you are too close. Increase the distance and let it behave naturally.',
    why: { 'The dish’s colour': 'Distance first — the animal is reacting to you being there.', 'The recorder’s settings': 'Settings do not disturb animals; your presence does.' },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'wl.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a wildlife session in the order you would do them.',
    steps: [
      { text: 'Check the rules, the setbacks and the weather for the site', early: 'Start with what is permitted and safe.' },
      { text: 'Choose a permitted point outside the ring, away from noise', early: 'Choose the point once you know the rules.' },
      { text: 'Mount the capsule as the maker says; fit wind protection', early: 'Set up once the point is chosen.' },
      { text: 'Find the target by ear, then aim on headphones', early: 'Aim once the mic is ready.' },
      { text: 'Set levels for the strongest call; record steadily', early: 'Record once aimed and the level is safe.' },
      { text: 'Log the take, the ID confidence and the conditions', early: 'Log once there is a take.' },
    ],
    explain: 'A sensible order: rules and safety, a permitted point, the mic mounted and protected, the aim, the level, then an honest log.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'wl.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · One bird calling from a fixed perch in a sheltered wood, for a sound library. The bird’s ring is clear of the trail.',
    setups: [
      { id: 'a', label: 'A dish from outside the ring, aimed by sweeping on headphones', ok: true, power: 'phantom', feedback: 'A suggested starting point: a localized high call at a fixed direction — the dish’s best case.' },
      { id: 'b', label: 'A shotgun in a basket from outside the ring, aimed at the call', ok: true, power: 'phantom', feedback: 'A fair choice: compact and easy to aim — some off-axis help in the highs.' },
      { id: 'c', label: 'A dish set up inside the ring for more level', ok: false, power: 'phantom', feedback: 'The ring is never crossed for a cleaner take.' },
      { id: 'd', label: 'A shotgun and recorded calls to keep it singing', ok: false, power: 'phantom', feedback: 'No playback, calls or lures — ever.' },
      { id: 'e', label: 'A dish on the trail, the best line of sight', ok: false, power: 'phantom', feedback: 'Trails stay clear of tripods and dishes.' },
    ],
    reasons: [
      { id: 'r.ring', label: 'The point is outside the setback ring', role: 'required', feedback: 'Say where you stand against the ring.' },
      { id: 'r.tool', label: 'The tool suits a fixed, high call', role: 'required', feedback: 'Say why this tool suits the call.' },
      { id: 'r.log', label: 'The ID is logged with its confidence', role: 'optional', feedback: 'A fair reason for a library take.' },
      { id: 'r.gain', label: 'The dish adds electrical gain', role: 'wrong', feedback: 'A dish concentrates sound acoustically — it is not electrical gain.' },
    ],
    explain: 'More than one setup passes. What passes is the reasoning: outside the ring, a tool that suits the call, an honest log.',
  },
  {
    id: 'wl.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A flock crossing open grassland in a breeze, for a nature documentary.',
    setups: [
      { id: 'a', label: 'A shotgun in fur and a basket, re-aimed smoothly, feet planted', ok: true, power: 'phantom', feedback: 'A suggested starting point: a shotgun copes with fast, wide movement.' },
      { id: 'b', label: 'A wide stereo pair in fur and baskets, plus notes on the flight', ok: true, power: 'phantom', feedback: 'A fair choice: steady coverage of the group with its place.' },
      { id: 'c', label: 'A dish held on the middle of the field', ok: false, power: 'phantom', feedback: 'A narrow dish loses fast, wide movement.' },
      { id: 'd', label: 'A shotgun in bare foam, a filter for the wind', ok: false, power: 'phantom', feedback: 'Foam is not enough in the open; a filter cannot rescue buffeting.' },
      { id: 'e', label: 'Walk after the flock with the mic aimed', ok: false, power: 'phantom', feedback: 'Feet planted: watch the ground and the trail, not just the birds.' },
    ],
    reasons: [
      { id: 'r.move', label: 'The pickup copes with fast, wide movement', role: 'required', feedback: 'Say how the tool handles a moving group.' },
      { id: 'r.wind', label: 'The protection suits open ground', role: 'required', feedback: 'Open grassland needs more than foam.' },
      { id: 'r.habitat', label: 'A habitat channel, labelled, if the place matters', role: 'optional', feedback: 'A fair reason.' },
      { id: 'r.zoom', label: 'The mic zooms in on the flock', role: 'wrong', feedback: 'No mic is a zoom lens for sound.' },
    ],
    explain: 'Two setups pass. What passes is the reasoning: a pickup that copes with movement, protection for open ground, and feet planted.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you move it: will a few metres toward the bird make it sound close?', options: ['No — still far', 'Yes — very close', 'Only with more gain'], after: 'Now move LISTEN AT toward the bird and back, and watch SINCE THE START.' },
  microphone: { prompt: 'Before you move anything: which pitch does a 57 cm dish help most?', options: ['A high call', 'A low rumble', 'All the same'], after: 'Now move PITCH and watch the rays reach the focus — or not.' },
  placement: { prompt: 'Predict: you swing a dish 10° off the bird. What goes first?', options: ['The high pitches', 'The low pitches', 'Nothing'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'Open grassland, a breeze: is foam enough?', options: ['Usually not', 'Yes, it is enough', 'Only at dawn'], after: 'Now add the layers with COVER and change SITE.' },
  twoMic: { prompt: 'A flock crosses a shotgun held still. What happens off its axis?', options: ['It fades', 'It grows', 'No change'], after: 'Now drag SOURCE and compare FIXED, FOLLOWED and OMNI.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'wl.q.1',
    covers: 'setting',
    critical: true,
    prompt: 'An animal reacts to you. What does it mean?',
    options: ['You are too close: back away', 'It is curious: keep on going', 'It is calm: move closer'],
    correct: 'You are too close: back away',
    explain: 'If an animal reacts to your presence, you are too close: back away.',
    why: { 'It is curious: keep on going': 'A reaction means too close.', 'It is calm: move closer': 'Never close the distance to an animal.' },
  },
  {
    id: 'wl.q.2',
    covers: 'setting',
    critical: true,
    prompt: 'May you play a call to attract a bird?',
    options: ['Never: no calls or lures', 'Quietly, if it is rare', 'Once, to start it singing'],
    correct: 'Never: no calls or lures',
    explain: 'No recorded calls, playback, lures or attractants.',
    why: { 'Quietly, if it is rare': 'Not at any level, for any species.', 'Once, to start it singing': 'Not even once, for any reason.' },
  },
  {
    id: 'wl.q.3',
    covers: 'sound',
    prompt: 'Does a shotgun make a far bird sound near?',
    options: ['No: distance stays', 'Yes: it brings it in', 'Only with a dish'],
    correct: 'No: distance stays',
    explain: 'Directionality changes the balance; it does not make distance disappear.',
    why: { 'Yes: it brings it in': 'It changes the balance, not the distance.', 'Only with a dish': 'A dish concentrates sound — the distance is still there.' },
  },
  {
    id: 'wl.q.4',
    covers: 'sound',
    prompt: 'What helps a call against a brook most?',
    options: ['A quieter permitted spot', 'More gain on the input stage', 'A brighter EQ setting'],
    correct: 'A quieter permitted spot',
    explain: 'Position first: time and place before any gain.',
    why: { 'More gain on the input stage': 'It raises the brook too.', 'A brighter EQ setting': 'EQ shapes both; position changes the balance.' },
  },
  {
    id: 'wl.q.5',
    covers: 'setting',
    prompt: 'Thunder is heard. Where do you go?',
    options: ['A building or hard-topped car', 'Under a big tree that is nearby', 'Into a rain shelter by you'],
    correct: 'A building or hard-topped car',
    explain: 'A substantial building or a hard-topped vehicle; wait 30 minutes after the last lightning or thunder.',
    why: { 'Under a big tree that is nearby': 'A tree is not shelter from lightning.', 'Into a rain shelter by you': 'Rain shelters are not safe in lightning.' },
  },
  {
    id: 'wl.q.6',
    covers: 'sound',
    prompt: 'How do you log an ID from sound alone?',
    options: ['With its confidence', 'As certain, in each case', 'Leave it out'],
    correct: 'With its confidence',
    explain: 'Confirmed, provisional or unknown — by the evidence you have.',
    why: { 'As certain, in each case': 'Sound alone may not be certain: say how sure you are.', 'Leave it out': 'Log it — with its confidence.' },
  },
];

export const F07_LESSON: Lesson = {
  id: 'F07',
  labId: 'field',
  title: 'Wildlife and Distant Sounds',
  subtitle: 'From a permitted point outside the setback ring: a shotgun aimed at the call, a dish for one high caller, a wider view for a group',
  noun: { one: 'distant source', many: 'distant sources', subject: 'observation point' },
  model: F07_MODEL,
  micTypeIds: ['shotgunShort', 'dishMic', 'arrOmni', 'arrCard'],
  zones: F07_ZONES,
  setupPairs: F07_PAIRS,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A wildlife call or another distant, localized sound, heard from a safe and permitted observation point: one bird in a canopy, a flock crossing a field, a low call far away.', src: 'LESSON-F07' },
    { title: 'DISTANCE STAYS', text: 'A directional mic or a dish changes the balance between the target and its surroundings — at the pitches it can. It never makes the distance disappear.', src: 'CORNELL-MIC' },
    { title: 'THE ANIMAL FIRST', text: 'Local rules decide the distance; as one example, US national parks ask for 25 yards from most wildlife and 100 yards from bears and wolves. If an animal reacts, you are too close.', src: 'NPS-WILD' },
    { title: 'WHAT THIS LAB DRAWS', text: 'Three illustrated sites with the setback rings drawn, a 57 cm dish at its own true shape, and birds and mics drawn larger than life on the plans so you can find them.', src: 'LESSON-F07' },
  ],
  sound: {
    stages: [
      { title: 'The call', text: 'The target’s sound, from one direction.' },
      { title: 'The surroundings', text: 'Water, wind, leaves and roads arriving from everywhere.' },
      { title: 'The balance', text: 'Position and pickup choose how the two compare.' },
    ],
    attack: 'The call arrives from one direction.',
    body: 'The surroundings arrive from everywhere.',
    head: { diameterMm: 0, rods: 0, label: 'the call', strikeSrc: 'LESSON-F07' },
  },
  setting: {
    items: [
      { id: 'ring', label: 'the setback ring', short: 'RING', note: 'Local rules first; if an animal reacts you are too close.', prov: { kind: 'sourced', src: 'NPS-WILD', quote: 'If animals react to your presence you are too close' }, tag: 'SETBACK', scene: 'all' },
      { id: 'trail', label: 'trails and roads', short: 'TRAILS', note: 'Tripods, poles and dishes stay off them.', prov: { kind: 'sourced', src: 'LESSON-F07', quote: 'Keep tripods, poles and dishes out of roads, trails and public circulation (L38)' }, tag: 'KEEP CLEAR', scene: 'all' },
    ],
    stage: 'LIVE: an approved, secure mount, weather protection, routing only to the feeds that need it — a narrow moving beam makes level jumps.',
    studio: 'LIBRARY OR FILM: the raw targeted take kept, the species or its uncertainty logged, a separate habitat bed if needed.',
  },
  diagnostic,
  practice: {
    task: 'Choose setups for a single bird and a flock, and say what one take can and cannot prove. With permission at a real site and the animals’ distances respected, you can keep a field log below.',
    fields: fieldLog([logText('target', 'Target, its ID and how sure you are (confirmed, provisional, unknown)'), logText('setback', 'Distance kept, the local rule, and the animal’s behaviour'), logChoice('tool', 'Pickup', ['Shotgun', 'Parabolic dish', 'Omni or cardioid', 'Stereo pair', 'Fixed recorder'])]),
  },
  unknowns: [
    { text: 'The sites — the woodland edge, the brook, the meadow and its hedgerow, the far animal — and their ranges (26 m, about 30 m, 70 m) are drawings; the 25-yard rings are the sourced example.', dims: [] },
    { text: 'The 57 cm dish’s focus at 0.36·D (205 mm) is derived from one maker’s ratio; its handle (150 mm) and the capsule ahead of the focus (60 mm) are drawing defaults.', dims: [] },
    { text: 'The beam per pitch band is drawn from an aperture’s spread (about λ / D) — an illustrative picture, never a number; no dish gain curve is drawn (O-9).', dims: [] },
    { text: 'The mic height (1.5 m), the observation box and the flock’s speed (about 8 m/s) — drawing defaults.', dims: [] },
  ],
  live: { wedges: [] },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — possible starting points and ideas to consider, not rules. Every animal, place and day is different: respect the local rules, move only within what is permitted, experiment, and trust your ears and the room around you. Experimentation is encouraged. The lab is silent and draws a simplified picture: illustrated sites, birds and mics drawn larger than life on the plans, textbook patterns, each source as a point in open air, and the dish’s beam as an illustrative shape. The dish’s line is computed for the dish drawn — it belongs to that dish, not to every dish.',
  copy: F07_COPY,
};
