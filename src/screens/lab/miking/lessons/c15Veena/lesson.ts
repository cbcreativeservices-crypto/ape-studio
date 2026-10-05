/**
 * C15 SARASWATI VEENA — the lesson's pages as DATA. Words from the owner's
 * lesson (docs/labs/miking/source_text/Saraswati-Veena-Miking-Technique.txt)
 * with the research fixes C15-01 … applied (CORRECTIONS_LOG.md): the starting
 * distances derived from the veena's own research and geometry (no longer
 * the oud's copied trials), the 25 cm study radius kept as a study radius,
 * the two-gourd veena named without calling it what its museum title does
 * not, the hearing line added. The rudra veena is a short note only.
 * Starting-points voice; FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, PageContent, PageId, SetupTask, Symptom } from '../../engine/model/types.ts';
import { ACCURACY, brandReason, clearReason, DOC_REASON, hearingCheck, hearingDiag, LOUD_REASON, micChecks, POWER_REASON, practiceChecks, setupOrder, sharedSymptoms, STRINGS_PREDICT, twoMicChecks } from '../shared/guitars/stringsContent.ts';
import { C15_MODEL, C15_WEDGES, C15_ZONES } from './geometry.ts';
import { C15_COPY, VEENA_N } from './copy.ts';

const P = 'vn';
const CLEAR = 'the plucking hand, the left hand, the gourd, the yali and the player’s view';

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the Saraswati veena',
    goal: 'Get to know the Saraswati veena — a South Indian fretted lute with a large carved resonator, a long neck with frets on wax, and drone strings — what it is, where you meet it, what it does in the music, and its parts, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Fingers pluck the melody strings over a broad, flat bridge; the bridge drives the top plate over the big resonator; the tala strings add drone and rhythm. The gourd under the neck is a support.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a pluck becomes sound — the string against the broad bridge, the top plate, the resonator’s air — and where the sound leaves the veena. Shown, never played.',
    credit: { scenarios: [`${P}.snd.1`, `${P}.snd.2`, `${P}.snd.3`], interactive: 'soundPath', note: 'Step the pluck through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The top plate, driven through the bridge, does most of the work, and its pattern changes with pitch, direction and distance. The gourd under the neck is a support, not a second soundboard.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the space round a veena player on the floor — the plucking hand, the long neck and its gamakas, the gourd on the thigh — the neighbours (mridangam, tanpura), what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: [`${P}.set.1`, `${P}.set.2`, `${P}.set.3`], note: 'Answer the three checks.' },
    takeaway: 'The posture is the player’s — the mic adapts to it, never the reverse. Know which veena it is. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the veena by its properties — pattern, power, response, maximum level and mount — not by its brand, and not by its label as a “vocal mic”.',
    credit: { scenarios: [`${P}.mic.1`, `${P}.mic.3`, `${P}.mic.4`, `${P}.rec.1`], note: 'Answer the four checks (one reaches back to how the veena sounds).' },
    takeaway: 'One cardioid condenser on a stable stand is a useful first air mic; a dynamic is plausible too. Keep a mic’s protective parts on. A pickup is a separate path.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — over the top plate, 30–50 cm out, out of the plucking hand’s reach — measured from the point the starting point names, then move the mic and see what changes.',
    credit: { scenarios: [`${P}.place.1`, `${P}.place.2`, `${P}.place.3`, `${P}.rec.2`], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin, measured from a named point. A broad view of the plate first; toward the bridge for articulation; move in small steps and compare at matched levels.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim a mic that looks down at the veena so its rejection faces the side-fill monitor — and see why a floor wedge in front is beyond any null.',
    credit: { scenarios: [`${P}.ctx.1`, `${P}.ctx.2`, `${P}.ctx.studio`, `${P}.rec.3`], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the side-fill sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Where a mic’s rear points decides which monitor a null can reach. Use only the monitor level the player needs; no mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why two mics on one veena can hollow out the body when combined, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: [`${P}.two.1`, `${P}.two.2`, `${P}.two.3`, `${P}.two.4`], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two paths hear the veena at different times, so their sum combs. Polarity flips the sign; it does not remove a delay. Judge the pair in mono at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — aim, distance, the player’s space, the signal paths, levels and polarity — before reaching for EQ. Never ask the player to change the instrument or the posture for the mic.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one veena mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second path.',
    credit: { scenarios: [`${P}.prac.order`, `${P}.prac.gain`, `${P}.prac.setup1`, `${P}.prac.setup2`, `${P}.prac.3`, `${P}.mix.1`, `${P}.mix.2`, `${P}.mix.3`], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real veena.' },
    takeaway: 'Safe clearance from a player on the floor, correct power and level checks, honest labels for a pickup, pattern reasoning and polarity versus delay pass. A brand or a “vocal mic” label do not.',
  },
};

const scenarios: MikingScenario[] = [
  {
    id: `${P}.snd.1`,
    page: 'sound',
    prompt: 'Where does most of a Saraswati veena’s sound leave from?',
    options: ['The top plate over the resonator, driven through the bridge', 'The gourd under the neck, which works as a second soundboard', 'The carved yali, which rings like a bell at the neck’s end'],
    correct: 'The top plate over the resonator, driven through the bridge',
    explain: 'The strings move little air. They drive the broad bridge, the bridge drives the top plate, and the plate over the resonator radiates most of the sound — in the measured radiation it mattered most.',
    why: {
      'The gourd under the neck, which works as a second soundboard': 'The gourd mainly supports the neck on the thigh. Do not expect it to radiate like the top plate.',
      'The carved yali, which rings like a bell at the neck’s end': 'The yali is a carved head — decoration and a handhold, not a radiator.',
    },
  },
  {
    id: `${P}.snd.2`,
    page: 'sound',
    prompt: 'You hear a bright buzz from the veena’s bridge. What is it, most likely?',
    options: ['The strings vibrating against the flat bridge, as intended', 'A fault in the mic, which a different mic would then cure', 'A crack in the plate, which the engineer should report now'],
    correct: 'The strings vibrating against the flat bridge, as intended',
    explain: 'The veena’s broad, flat bridge lets the strings vibrate against it: that buzz is part of the instrument, set by the player. Ask what is intended; a mic close to the bridge hears more of it.',
    why: {
      'A fault in the mic, which a different mic would then cure': 'The buzz is in the instrument. A mic close to the bridge just hears more of it.',
      'A crack in the plate, which the engineer should report now': 'The buzz comes from the bridge, by design. The instrument is the player’s to assess.',
    },
  },
  {
    id: `${P}.snd.3`,
    page: 'sound',
    prompt: 'An open melody string is plucked exactly at its middle. Which of its shapes can that pluck set moving?',
    options: ['Only the odd ones; each even shape is still there', 'All of them equally, because the whole string moves', 'Only the even ones; the odd shapes are still there'],
    correct: 'Only the odd ones; each even shape is still there',
    explain: 'A pluck drives a shape only as much as the string moves under the finger in that shape. Each even shape has a still point at the exact middle.',
    why: {
      'All of them equally, because the whole string moves': 'The finger touches one spot. A shape is driven only as much as the string moves there.',
      'Only the even ones; the odd shapes are still there': 'The reverse: the even shapes have a still point at the middle.',
    },
  },
  hearingCheck(P, VEENA_N),
  {
    id: `${P}.set.2`,
    page: 'setting',
    prompt: 'The player arrives with a veena that has two large gourds on a long tube. What do you do with this lesson’s starting points?',
    options: ['Set them aside: work out this veena’s own geometry with the player', 'Use them as they are: all veenas look alike to a microphone, really', 'Aim at the larger gourd as if it were the Saraswati top plate'],
    correct: 'Set them aside: work out this veena’s own geometry with the player',
    explain: 'A two-gourd veena such as the rudra veena is a different instrument, held differently, with no Saraswati-style main face. Any target or distance for it is developed with that player, in its own trial.',
    why: {
      'Use them as they are: all veenas look alike to a microphone, really': 'Veenas differ in form and posture. These starting points are for the Saraswati veena.',
      'Aim at the larger gourd as if it were the Saraswati top plate': 'There is no Saraswati-style main face to transfer to. Work it out with the player.',
    },
  },
  {
    id: `${P}.set.3`,
    page: 'setting',
    prompt: 'The mic would be easier to place if the player turned the veena a little. What do you do?',
    options: ['Leave the posture as theirs, and fit the mic round it', 'Ask them to turn it, since the mic position matters most', 'Turn the veena yourself while the player is resting'],
    correct: 'Leave the posture as theirs, and fit the mic round it',
    explain: 'Inspect how the face actually points in the player’s normal posture — never ask them to rotate the instrument or give up normal bends to hold an angle for a mic.',
    why: {
      'Ask them to turn it, since the mic position matters most': 'The player’s posture and playing come first. The mic adapts to them.',
      'Turn the veena yourself while the player is resting': 'Never handle the player’s instrument. Fit the mic round their posture.',
    },
  },
  {
    id: `${P}.rec.1`,
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic aimed at the gourd under the neck hears what, mostly?',
    options: ['Not the main source: the gourd is a support, not the soundboard', 'The richest part of the sound, since the gourd is the main resonator', 'The tala strings, which run right through the gourd'],
    correct: 'Not the main source: the gourd is a support, not the soundboard',
    explain: 'The gourd under the neck mainly supports it on the thigh. Do not treat it as a second main soundboard — and never obstruct the supporting knee.',
    why: {
      'The richest part of the sound, since the gourd is the main resonator': 'The main resonator is the large bowl under the top plate. The neck’s gourd is a support.',
      'The tala strings, which run right through the gourd': 'The tala strings run along the side of the neck, above the gourd.',
    },
  },
  {
    id: `${P}.mic.1`,
    page: 'microphone',
    prompt: 'An engineer’s notes say they took the windscreen and grille off their dynamics for a veena session. Should you copy that?',
    options: ['No: keep a mic’s protective parts unless its maker allows it', 'Yes: removing the grille is how veenas are usually miked on a stage', 'Yes, as long as the mic is a dynamic and not a condenser'],
    correct: 'No: keep a mic’s protective parts unless its maker allows it',
    explain: 'One session’s notes are not an instruction. A mic’s windscreen and grille protect it; leave them on unless its manufacturer explicitly authorises a change.',
    why: {
      'Yes: removing the grille is how veenas are usually miked on a stage': 'One engineer’s session is not a norm. Keep the protective parts on.',
      'Yes, as long as the mic is a dynamic and not a condenser': 'The type does not make it safe. Follow the maker’s instructions.',
    },
  },
  {
    id: `${P}.mic.3`,
    page: 'microphone',
    prompt: 'The only spare input has no phantom power. Which of this page’s mics can you use?',
    options: ['The instrument dynamic: it needs no power at all', 'The small condenser, if its cable run is kept short', 'Either one, as long as the gain is turned up high'],
    correct: 'The instrument dynamic: it needs no power at all',
    explain: 'Dynamic mics need no power. The small condenser needs phantom power, whatever its cable or the gain setting.',
    why: {
      'The small condenser, if its cable run is kept short': 'Cable length does not power a condenser. Only the dynamic works without phantom.',
      'Either one, as long as the gain is turned up high': 'Gain cannot power a condenser. It needs phantom power to work at all.',
    },
  },
  ...micChecks(P, VEENA_N).filter((s) => s.id === `${P}.mic.4`),
  {
    id: `${P}.place.1`,
    page: 'placement',
    prompt: 'A starting point says 30–50 cm from the top plate, between the bridge and the body. Your readout says 40 cm, square to the plate. Are you in it?',
    options: ['Only if the mic is also aimed at that broad area of the plate', 'Yes: 40 cm falls well inside the 30 to 50 cm band, so it must be in it', 'No: the distance is read from the yali, not the plate'],
    correct: 'Only if the mic is also aimed at that broad area of the plate',
    explain: 'The distance is read square to the plate, from the point the zone names — and this zone also asks for the aim: a broad area of the plate between the bridge and the body, out of the hand’s reach.',
    why: {
      'Yes: 40 cm falls well inside the 30 to 50 cm band, so it must be in it': 'The distance is right, but this zone also names an aim. Check where the mic points.',
      'No: the distance is read from the yali, not the plate': 'The zone names the top plate. The yali is at the far end of the neck.',
    },
  },
  {
    id: `${P}.place.2`,
    page: 'placement',
    prompt: 'At the same distance, you turn the mic toward the main bridge and the plucking area. What tends to change?',
    options: ['More of each note’s start — maybe more click or buzz', 'More of the resonator’s body and the deepest notes, too', 'Only the level; the tone stays the same as before'],
    correct: 'More of each note’s start — maybe more click or buzz',
    explain: 'Toward the bridge, a mic hears more of the onset, and possibly pick click or buzz beyond what the music wants. Tell the instrument’s intended buzz apart from what the aim adds.',
    why: {
      'More of the resonator’s body and the deepest notes, too': 'That is the broad view of the plate. The bridge adds articulation.',
      'Only the level; the tone stays the same as before': 'Aiming at a different part of the veena changes the balance, not only the level.',
    },
  },
  {
    id: `${P}.place.3`,
    page: 'placement',
    prompt: 'A study measured a veena’s radiation with mics 25 cm from the top plate. Does that make 25 cm the place to put your mic?',
    options: ['No: it was where the study measured, not a recommendation', 'Yes: the study found 25 cm is the best musical distance', 'Yes, but only for a mic of exactly the same model as the study’s'],
    correct: 'No: it was where the study measured, not a recommendation',
    explain: 'The study mapped the plate’s radiation at 25, 50 and 75 cm and found it changes with pitch, direction and distance. It supports comparing positions around the face — not one best distance.',
    why: {
      'Yes: the study found 25 cm is the best musical distance': 'The study names no best musical distance; it measured at several radii.',
      'Yes, but only for a mic of exactly the same model as the study’s': 'Measurement radius is not a musical recommendation, whatever the mic.',
    },
  },
  {
    id: `${P}.rec.2`,
    page: 'placement',
    prompt: 'FROM EARLIER · What must a stand mic and its boom stay out of, round a veena player on the floor?',
    options: ['The plucking hand, the left hand, the gourd and their view', 'The space above the plate, which belongs to the audience’s view', 'The rug at the front, which belongs to the floor wedge'],
    correct: 'The plucking hand, the left hand, the gourd and their view',
    explain: 'Clearance comes first: the plucking hand and arm over the plate, the left hand along the neck and its gamakas, the gourd on the thigh, the yali, and the player’s view. Stop the player before anything moves.',
    why: {
      'The space above the plate, which belongs to the audience’s view': 'Above the plate, out of the hand’s reach, is where the mic starts. The space to protect is the player’s.',
      'The rug at the front, which belongs to the floor wedge': 'Stands and cables need a route, but the safety question is the player’s hands, the gourd and their view.',
    },
  },
  {
    id: `${P}.ctx.1`,
    page: 'context',
    prompt: 'A floor wedge in front is loud in the mic that looks down at the veena. What is a sound first step?',
    options: ['Lower that send; a null of this mic cannot reach the floor in front', 'Turn the veena channel up so that it covers the sound of the floor wedge', 'Tilt the mic until its rear points straight down at the floor'],
    correct: 'Lower that send; a null of this mic cannot reach the floor in front',
    explain: 'Looking down at the veena, the mic’s rear faces the ceiling; a floor wedge in front sits at its side, where no null reaches. Bring the level down, and use a side-fill whose position a null can reach.',
    why: {
      'Turn the veena channel up so that it covers the sound of the floor wedge': 'More gain raises the wedge in that channel too — and brings feedback closer.',
      'Tilt the mic until its rear points straight down at the floor': 'Then it no longer faces the veena. Keep the mic on the plate and fix the monitor instead.',
    },
  },
  {
    id: `${P}.ctx.2`,
    page: 'context',
    prompt: 'A supercardioid looks down at the plate. Where can a monitor sit in its deepest rejection?',
    options: ['Toward its rear and off to one side: up and beside the player', 'On the floor right in front of the veena, where floor wedges usually go', 'Directly below the mic, under the veena on the floor'],
    correct: 'Toward its rear and off to one side: up and beside the player',
    explain: 'A supercardioid rejects most off its rear axis (near 125°). Looking down, its rear points up — so a side-fill at head height, beside the player, can sit there.',
    why: {
      'On the floor right in front of the veena, where floor wedges usually go': 'For a mic looking down, the floor in front is off to its side — in its pickup, not a null.',
      'Directly below the mic, under the veena on the floor': 'Below the mic is where it points: the front of the pattern.',
    },
  },
  {
    id: `${P}.ctx.studio`,
    page: 'context',
    prompt: 'A quiet studio, solo veena. What do you hear before adding a second mic?',
    options: ['The plate start alone, through melody, gamakas and drone', 'Only the lowest note, since it shows the resonator best', 'Nothing: start with three mics and choose in the mix'],
    correct: 'The plate start alone, through melody, gamakas and drone',
    explain: 'Hear the main start before adding channels, across the whole range — a single bass note does not represent the instrument. Compare a farther view if the room contributes.',
    why: {
      'Only the lowest note, since it shows the resonator best': 'One note does not represent the veena. Include melody and drone gestures.',
      'Nothing: start with three mics and choose in the mix': 'Several mics at once hide what each one adds. Build from one.',
    },
  },
  {
    id: `${P}.rec.3`,
    page: 'context',
    prompt: 'FROM EARLIER · The plate’s measured radiation changed with pitch, direction and distance. What does that suggest for a live mic?',
    options: ['Compare a few positions round the face; one spot may favour some notes', 'Each spot on the plate gives a similar sound, so just pick one of them', 'The mic must sit exactly where the study measured, 25 cm out'],
    correct: 'Compare a few positions round the face; one spot may favour some notes',
    explain: 'Because the pattern changes with pitch and direction, a single close spot can favour some notes or a local resonance. Compare positions round the main face at matched levels.',
    why: {
      'Each spot on the plate gives a similar sound, so just pick one of them': 'The measurements show the opposite: the radiation varies with direction.',
      'The mic must sit exactly where the study measured, 25 cm out': 'That was a measurement radius, not a placement rule.',
    },
  },
  ...twoMicChecks(P, VEENA_N),
  ...practiceChecks(P, VEENA_N, {
    quote: '30–50 cm from the top plate, between the bridge and the body',
    right: 'The top plate, square to it, aimed between the bridge and the body',
    wrong1: 'The gourd under the neck, since it works as a second main resonator',
    wrong2: 'The yali, measured along the neck from its carved head',
    explain: 'A distance belongs to the point it names: the top plate between the bridge and the body. The gourd and the yali are elsewhere — and the gourd is a support.',
  }),
];

const symptoms: Symptom[] = [
  {
    id: `${P}.sym.buzz`,
    observation: 'Too much sharp bridge buzz',
    firstChecks: 'Is the buzz intended? Then move the aim off the local bridge region, or step back.',
    options: ['Ask if it is intended, then aim off the bridge or step back', 'Ask the player to adjust the bridge so that it buzzes less', 'Cut the high frequencies hard until the buzz is gone'],
    correct: 'Ask if it is intended, then aim off the bridge or step back',
    explain: 'The buzz is part of the veena. If the mic exaggerates it, change the aim or distance; the bridge itself is never adjusted for a mic.',
    why: {
      'Ask the player to adjust the bridge so that it buzzes less': 'The bridge is the player’s instrument and sound. Never ask for it to change for a mic.',
      'Cut the high frequencies hard until the buzz is gone': 'EQ dulls the whole veena. Fix the aim first.',
    },
  },
  {
    id: `${P}.sym.thin`,
    observation: 'Weak melody or a thin body',
    firstChecks: 'Is the mic on one small spot? Change the angle toward a broader view of the top plate; confirm it sounds that way acoustically.',
    options: ['Turn toward a broader view of the plate; listen acoustically', 'Aim at the gourd under the neck for more of the veena’s body', 'Boost the low end on the channel until it sounds full'],
    correct: 'Turn toward a broader view of the plate; listen acoustically',
    explain: 'A view of one small spot misses the plate. Take in more of it — and listen to the veena unamplified to know what it gives.',
    why: {
      'Aim at the gourd under the neck for more of the veena’s body': 'The gourd is a support, not the soundboard. The plate carries the body.',
      'Boost the low end on the channel until it sounds full': 'EQ cannot add a body the position misses. Move first.',
    },
  },
  {
    id: `${P}.sym.drone`,
    observation: 'The drone strings overpower the melody',
    firstChecks: 'Is the mic aimed at the tala side? Shift the aim away from it, and judge on whole phrases.',
    options: ['Aim away from the tala side and judge whole phrases', 'Ask the player to stop using the tala strings', 'Gate the channel so the drone is cut between notes'],
    correct: 'Aim away from the tala side and judge whole phrases',
    explain: 'A mic toward the side the tala strings run along hears more of them. Shift the aim and judge whole phrases — the drone belongs in the music.',
    why: {
      'Ask the player to stop using the tala strings': 'The drone is the music. Change the mic, not the playing.',
      'Gate the channel so the drone is cut between notes': 'A gate cuts the decays too, and the drone sounds under the notes anyway.',
    },
  },
  {
    id: `${P}.sym.hit`,
    observation: 'The player hits the mic, or has to change posture',
    firstChecks: 'Stop. Move the stand or boom outside the whole hand and knee envelope.',
    options: ['Stop, then move the stand out of the hands’ and knee’s reach', 'Ask the player to keep their hands a little narrower while playing', 'Tape the boom to the stand so that it cannot move'],
    correct: 'Stop, then move the stand out of the hands’ and knee’s reach',
    explain: 'The player’s full motion comes first. Move the mic out of the hands’ and knee’s reach, then rebuild the position from there.',
    why: {
      'Ask the player to keep their hands a little narrower while playing': 'Never ask the player to change their playing for the mic.',
      'Tape the boom to the stand so that it cannot move': 'The mic is still in the player’s way. Move it out of reach.',
    },
  },
  ...sharedSymptoms(P, VEENA_N),
];

const setupTasks: SetupTask[] = [
  {
    id: `${P}.prac.setup1`,
    page: 'practice',
    brief: 'BRIEF 1 · A concert stage: the veena on a rug, a mridangam beside, a side-fill monitor on a stand at the player’s right. One channel for the veena; phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser, cardioid, 30–50 cm over the plate, rear toward the side-fill', ok: true, power: 'phantom', feedback: 'A recommended starting point, its rejection toward the side-fill.' },
      { id: 'b', label: 'Instrument dynamic over the plate, out of the hand’s reach, rear toward the side-fill', ok: true, power: 'none', feedback: 'A recommended starting point; a robust stage choice.' },
      { id: 'c', label: 'Small condenser at the same distance, turned toward the bridge, rear toward the side-fill', ok: true, power: 'phantom', feedback: 'A recommended start for more articulation; watch the buzz.' },
      { id: 'd', label: 'Small condenser taped to the top plate beside the bridge', ok: false, power: 'phantom', feedback: 'Nothing is taped to the plate or bridge without the owner’s consent and an approved attachment.' },
      { id: 'e', label: 'Small omni 1 m in front, to hear the whole veena naturally', ok: false, power: 'phantom', feedback: 'On a stage beside a mridangam, an omni that far out hears the drum and the monitor as much as the veena.' },
    ],
    reasons: [DOC_REASON, clearReason(CLEAR), POWER_REASON, { id: 'r.monitor', label: 'The side-fill sits toward the mic’s rear, where a null can reach', role: 'optional', feedback: 'A fair live reason: the monitor’s place decides what a pattern can do.' }, brandReason(VEENA_N), { id: 'r.vocal', label: 'A “vocal mic” is the right kind for a veena on stage', role: 'wrong', feedback: 'A label is not a property. Choose by pattern, response and power.' }],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point from its named point, clearance from the player, power that matches the mic.',
  },
  {
    id: `${P}.prac.setup2`,
    page: 'practice',
    brief: 'BRIEF 2 · A quiet studio, solo veena. The only spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'Instrument dynamic 30–50 cm over the plate, aimed between the bridge and the body', ok: true, power: 'none', feedback: 'A recommended starting point; a dynamic needs no phantom.' },
      { id: 'b', label: 'Instrument dynamic at the same distance, turned toward the bridge', ok: true, power: 'none', feedback: 'A recommended start for articulation; it needs no phantom.' },
      { id: 'c', label: 'Small condenser over the plate, cardioid', ok: false, power: 'phantom', feedback: 'A fair position — but this input has no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'Instrument dynamic with its grille removed, 25 cm from the plate', ok: false, power: 'none', feedback: 'Keep a mic’s protective parts on unless its maker allows otherwise — and 25 cm was a study’s radius, not a rule.' },
      { id: 'e', label: 'Instrument dynamic resting against the gourd under the neck', ok: false, power: 'none', feedback: 'The gourd is a support on the player’s thigh: nothing rests on it, and it is not the soundboard.' },
    ],
    reasons: [DOC_REASON, clearReason(CLEAR), POWER_REASON, { id: 'r.phrases', label: 'I will judge melody, a gamaka, a tala stroke and the decay', role: 'optional', feedback: 'A fair studio reason: one note does not represent the veena.' }, brandReason(VEENA_N), LOUD_REASON],
    explain: 'Two positions pass. What passes is the reasoning: a sensible starting point, clear of the player, powered by what this input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: what moves most of the air when a veena string is plucked?', options: ['The string itself', 'The top plate, driven by the bridge', 'The gourd under the neck'], after: 'Now STEP through the pluck (or PLAY ONCE) and watch what each event drives.' },
  placement: { prompt: 'Predict: at the same distance, you turn the mic toward the bridge. What changes?', options: ['More body', 'More articulation and buzz', 'It depends on this veena'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  ...STRINGS_PREDICT,
  context: { prompt: 'This mic looks DOWN at the veena. Where can its rejection reach a monitor?', options: ['A floor wedge in front', 'A side-fill at head height', 'Anywhere, by turning the mic'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION — try both monitors.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What is the small gourd under the Saraswati veena’s neck, mainly?',
    options: ['A support for the neck on the left thigh', 'A second main soundboard, as loud as the plate', 'The tuning chamber that sets the strings’ pitch'],
    correct: 'A support for the neck on the left thigh',
    explain: 'It mainly supports the neck. Do not treat it as an interchangeable second main soundboard — and never obstruct the supporting knee.',
    why: {
      'A second main soundboard, as loud as the plate': 'The top plate over the big resonator is the main radiator.',
      'The tuning chamber that sets the strings’ pitch': 'The pegs and the strings set the pitch; the gourd is a support.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What are the veena’s three tala strings?',
    options: ['Open drone strings along the side, struck for rhythm', 'Extra melody strings pressed on the frets for high notes', 'Strings under the frets that ring by sympathy alone'],
    correct: 'Open drone strings along the side, struck for rhythm',
    explain: 'The tala strings run along the side of the neck and are struck open for drone and rhythm — one more thing a mic balances against the melody.',
    why: {
      'Extra melody strings pressed on the frets for high notes': 'The four melody strings are fretted; the tala strings are played open.',
      'Strings under the frets that ring by sympathy alone': 'That describes a sitar’s sympathetic strings. The tala strings are struck.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'The veena’s measured radiation changed with pitch, direction and distance. What does that suggest?',
    options: ['Compare a few positions round the face before settling', 'The positions all sound alike, so the first one will do fine', 'Only the 25 cm study radius gives a true sound'],
    correct: 'Compare a few positions round the face before settling',
    explain: 'A pattern that changes with pitch and direction means one spot can favour some notes. Compare positions round the main face at matched levels.',
    why: {
      'The positions all sound alike, so the first one will do fine': 'The measurements show the opposite: the sound varies round the face.',
      'Only the 25 cm study radius gives a true sound': 'That was where the study measured, not a placement rule.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'A string plucked exactly at its middle drives which of its shapes?',
    options: ['Only the odd ones — the even ones are still there', 'All of its shapes, each one just as hard', 'Only the even ones — the odd ones are still there'],
    correct: 'Only the odd ones — the even ones are still there',
    explain: 'A pluck drives a shape only as much as the string moves under the finger; each even shape has a still point at the middle.',
    why: {
      'All of its shapes, each one just as hard': 'The finger touches one spot; a shape that is still there is not driven.',
      'Only the even ones — the odd ones are still there': 'The reverse: the even ones are still at the middle.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'What must a stand mic stay out of, round a veena player on the floor?',
    options: ['The hands, the gourd on the thigh, the yali and their view', 'The space above the plate, where the audience looks', 'The space behind the player, where the tanpura sits'],
    correct: 'The hands, the gourd on the thigh, the yali and their view',
    explain: 'The plucking hand works over the plate, the left hand travels the neck with its gamakas, the gourd rests on the thigh, and the player watches. Above the plate, out of reach, is where a mic comes in.',
    why: {
      'The space above the plate, where the audience looks': 'Above the plate, out of the hand’s reach, is where the mic starts. The player’s space is what to keep clear.',
      'The space behind the player, where the tanpura sits': 'The tanpura’s place matters, but the moving space is the veena player’s hands, gourd and view.',
    },
  },
  hearingDiag(VEENA_N),
];

export const C15_LESSON: Lesson = {
  id: 'C15',
  labId: 'strings',
  title: 'Saraswati Veena',
  subtitle: 'Over the top plate, out of the hand’s reach — the resonator, the drone, the yali',
  noun: { one: 'veena', many: 'veenas' },
  model: C15_MODEL,
  micTypeIds: ['sdcCard', 'instDynCard'],
  zones: C15_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [setupOrder(P, VEENA_N, 'Have the player stop; place it over the plate, out of reach; check both hands, the gourd and the sight line')],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A South Indian plucked, fretted lute: a large carved wooden resonator with a top plate, a broad flat bridge, and a long neck with twenty-four brass frets set in black wax — four melody strings and three open tala strings, a small gourd under the neck, and a carved yali head at its end.', src: 'MET-505701' },
    { title: 'WHERE YOU MEET IT', text: 'South Indian classical (Carnatic) music — solo and with mridangam, a tanpura drone, violin and voice — on concert stages and in studios. This lesson covers studio recording and live sound.', src: 'MET-505819' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Melody, shaped by gamakas — bends and slides pulled along the frets — with tala strokes for drone and rhythm, and a characteristic buzz from the flat bridge. Ask which buzz and which drone balance are intended.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'This lab draws a veena the size of one real instrument: about 121.5 cm long, its resonator about 34 cm across. The posture is drawn as a common horizontal one — the resonator on the floor at the right, the neck across the lap — check the player’s own.', src: 'MET-506151' },
  ],
  sound: {
    stages: [
      { title: 'A finger plucks', text: 'A finger pulls a melody string aside near where the plate meets the neck, and lets it go — the ATTACK. The little finger can strike the tala strings beside it.' },
      { title: 'The string swings — against the bridge', text: 'Released, the string swings between its still ends — the broad flat bridge and the nut, or the fret it is pressed to — and vibrates against the bridge’s flat top: the buzz the player intends. Motion drawn many times larger.' },
      { title: 'The bridge drives the top plate', text: 'Each swing works the bridge, and the bridge drives the top plate over the big resonator. The plate moves the air — the air inside the resonator too.' },
      { title: 'Sound leaves', text: 'Sound leaves mostly from the top plate. In measured radiation the plate mattered most, and the pattern changed with pitch, direction and distance — so it pays to compare positions round the face. The gourd under the neck is a support.' },
    ],
    attack: 'The start of the note: the finger releasing the string against the broad, flat bridge — a buzzing, bright onset. It is heard most directly toward the bridge; aimed there, a mic hears more click and buzz.',
    body: 'The note’s ring: the strings, the plate and the resonator’s air together, with the drone of the tala strings. A broad view of the plate carries it; farther back adds the room. Tendencies; veenas vary.',
    head: { diameterMm: 330, rods: 0, label: 'the top plate', strikeSrc: 'EXT-23505' },
  },
  setting: {
    items: [
      { id: 'player', label: 'the player and the veena', short: 'PLAYER', note: 'Seated cross-legged, the resonator on the floor at the right, the neck across the lap to the left thigh, the face tilted up and partly toward the player. The hands, the gamakas, the gourd on the thigh and the player’s view are theirs.', prov: { kind: 'illustrative', reason: 'the proposal’s posture (holding guide unread)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'rug', label: 'the rug or riser', short: 'RUG', note: 'The performers sit on a rug, often on a low riser. Keep cables clear of the crossed legs, the instrument’s support and the way on and off.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'FLOOR SPACE', scene: 'all' },
      { id: 'mridangam', label: 'the mridangam', short: 'MRIDANGAM', note: 'Beside the veena: a loud two-headed drum. Its sound reaches the veena mic — distance, balance and the drum’s own mics do more than a null.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'tanpura', label: 'the tanpura (the drone)', short: 'TANPURA', note: 'Behind, sustaining the drone. Quiet but continuous; it belongs in the blend.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'sidefill', label: 'the side-fill monitor on a stand', short: 'SIDE-FILL', note: 'At the player’s right, its box about head height. A mic looking down at the veena has its rear toward the ceiling and that side — a null can reach it.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'wedge', label: 'a floor wedge in front', short: 'FLOOR WEDGE', note: 'Low and in front. For a mic looking down at the veena it sits off to the side — beyond any null. Keep its level down.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'pa', label: 'the PA', short: 'PA', note: 'At the front corners, facing the audience. Its sound fills the stage and can ring through the veena’s body into a close mic.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FEEDBACK', scene: 'stage', planIds: ['paL', 'paR'] },
      { id: 'audience', label: 'the audience', short: 'AUDIENCE', note: 'Beyond the stage edge. The level the room needs decides how close a mic must be.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a quiet room a farther view blends the veena with the space — the decay and the drone with it.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM', scene: 'studio' },
    ],
    stage: 'LIVE: a side-fill on a stand, a floor wedge in front, a mridangam beside, the PA facing out. Use only the monitor level the player needs; pull it down at the first ring.',
    studio: 'STUDIO: no monitors, repeated trials when the player stops, and a room that can carry the decay.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic setup for a given veena, player and room, describe an alternative position, and explain what would justify a second path. With a real veena and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'veena', label: 'Veena (form, posture, face orientation)', kind: 'text' },
      { id: 'mic', label: 'Mic type and pattern', kind: 'choice', choices: ['small condenser', 'dynamic', 'large condenser', 'other'] },
      { id: 'paths', label: 'Other paths (a pickup or contact sensor)', kind: 'text' },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, and from which point', kind: 'text' },
      { id: 'notes', label: 'What you heard: melody, gamaka, tala, decay (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The overall length (121.5 cm) and the resonator’s width (34 cm) are one museum veena’s; its depth 30 cm is the proposal’s (Medium). The resonator’s centre, the plate, the neck (75 wide, 70 deep), the nut at 86 cm, the frets (24, equal-tempered), the bridge, the pegs, the gourd (Ø 18 cm, moved to +700 inside the sourced length) and the yali are drawing defaults.', dims: [] },
    { text: 'The posture — the face tilted 20° up toward the player, the neck rising 7° to the left thigh — is the proposal’s drawing default from a holding guide whose text could not be read. No HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The keep-off margins (plate 8 mm, strings 10 mm, bridge 6 mm, resonator 10 mm): illustrative.', dims: ['veena'] },
    { text: 'The 30–50 cm start is DERIVED (a cardioid’s ±30° taking in the Ø 34 cm plate; a radius the plate’s radiation was mapped at), not a published recommendation.', dims: [] },
    { text: 'The side-fill, wedge, mridangam, tanpura and PA positions — a typical layout. The rudra veena is not drawn: a short note only.', dims: [] },
  ],
  live: { wedges: C15_WEDGES },
  accuracyDetail: ACCURACY(VEENA_N, 'one Saraswati veena in a common horizontal posture — check the player’s own'),
  copy: {
    ...C15_COPY,
    instrument: {
      ...C15_COPY.instrument!,
      variantNotes: { veena: 'RUDRA VEENA — a different instrument: two large gourds on a long tube, held at an angle. None of these starting points transfer to it; work out its geometry with its player, in its own trial.' },
    },
  },
};
