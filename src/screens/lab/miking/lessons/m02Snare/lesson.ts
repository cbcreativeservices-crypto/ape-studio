/**
 * M02 SNARE DRUM — the lesson's pages as DATA (blueprint §7). The words come
 * from the owner's lesson (docs/labs/miking/source_text/Snare-Drum-Miking-
 * Technique-Research.txt, cited "L<n>" in COMMENTS only) with the fixes
 * logged in docs/labs/miking/CORRECTIONS_LOG.md (S-01 … S-09) applied.
 *
 * OWNER RULING 2026-10-04 — learner-facing presentation: suggested starting
 * points, never dogma; no source, brand or model in learner text; no badges.
 * The research stays in docs/labs/miking/snare/ and the code-only fields.
 * Pinned by test/mikingLearnerText.test.ts and test/mikingModelM02.test.ts.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, LessonPages, PageContent, SourcePageId, SetupReason, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { OPPOSITE_SIDES_POLARITY, micRatingCheck } from '../../engine/model/sharedItems.ts';
import { KIT_FLOOR_Y } from '../shared/kitPlanModel.ts';
import { SNARE_MODEL } from './geometry.ts';
import { NEIGHBOURS, S0_KIT, SNARE_ZONES } from './model.ts';
import { SNARE_COPY } from './copy.ts';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the snare drum',
    goal: 'Get to know the snare — what it is, where you meet it, what it does in the music, and its parts, from the batter head to the wires — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The sticks strike the batter head on top; the wires lie across the thin snare-side head underneath, and the strainer turns them on or off. Work with the drum as the player brings it.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a stroke becomes sound — the stick, both heads, the air inside and the wires — and where the sound leaves the drum.',
    credit: { scenarios: ['sn.snd.1', 'sn.snd.2', 'sn.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The crack starts where the stick meets the batter head; the buzz comes from the wires slapping the snare-side head. A mic above hears more of the first, a mic below more of the second — tendencies, and drums vary.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the snare’s neighbours on the kit — the hi-hat above all — the player’s space and the sticks’ path, what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['sn.set.1', 'sn.set.2', 'sn.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The near half of the snare is the sticks’ path: no mic, stand or cable goes there. The hi-hat sits just behind and above it. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the snare by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['sn.mic.1', 'sn.mic.2', 'sn.mic.3', 'sn.mic.4', 'sn.rec.1'], note: 'Answer the five checks (one reaches back to how the snare sounds).' },
    takeaway: 'Pattern, power, size and mount decide what a mic can do here. A clamp or a small body keeps it out of the sticks’ way; a condenser can work when its rating and mount suit. A mic’s maximum SPL is not a hearing limit.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — over the rim, measured from the rim or the head the starting point names, aimed at the head, clear of the sticks — then move the mic and see what changes.',
    credit: { scenarios: ['sn.place.1', 'sn.place.2', 'sn.place.3', 'sn.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different suggested starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A suggested zone is a place to begin, measured from a named surface — the rim or a head — not a rule. Rim position, height and angle are separate things to try, and the sticks’ clearance comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the hi-hat — and know what a pattern cannot do, and when some spill is fine.',
    credit: { scenarios: ['sn.ctx.1', 'sn.ctx.2', 'sn.ctx.studio', 'sn.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the hi-hat sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A cardioid rejects most behind; a supercardioid off to each side of the rear. Real nulls are shallower than the picture. Hi-hat spill is not automatically a defect, and no mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Top and bottom',
    goal: 'See why a top and a bottom snare mic start out of step, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: ['sn.two.1', 'sn.two.2', 'sn.two.3', 'sn.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'The heads move the same way, so a top and a bottom mic start opposite; flipping one is a common first thing to try, never a rule — check both states. Polarity flips the sign; it does not remove a delay. Judge the pair in mono, at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — clearance, aim, the pattern, gain staging, levels and polarity — and the drum itself, before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one snare mic in the right order, choose and justify a setup for two different briefs, and say what would justify a bottom mic.',
    credit: { scenarios: ['sn.prac.order', 'sn.prac.gain', 'sn.prac.setup1', 'sn.prac.setup2', 'sn.prac.3', 'sn.mix.1', 'sn.mix.2', 'sn.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real drum.' },
    takeaway: 'Safe clearance from the sticks, correct power and level checks, pattern reasoning and an accurate account of polarity versus delay pass. A brand or a “loudest” position do not — and more than one setup can pass.',
  },
};

/*
 * THE CHECKS. Every item tests reasoning; every wrong option is a real
 * misconception of about the same length, with its own explanation. Lesson
 * lines in comments only: sn.snd.* L7 · sn.set.* L10-L11 (hearing), L41 ·
 * sn.mic.* L14-L16 · sn.place.* L22-L38 · sn.ctx.* L39, L50-L67 · sn.two.*
 * L47-L49 · sn.prac.* / sn.mix.* L12, L40-L46, L84.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'sn.snd.1',
    page: 'sound',
    prompt: 'What makes the snare’s buzz?',
    options: ['The wires slapping the snare-side head as it moves', 'The batter head ringing on after the stick has left it', 'The shell walls rattling against the metal hoops'],
    correct: 'The wires slapping the snare-side head as it moves',
    explain: 'The air inside drives the snare-side head; when the head moves faster than the wires can follow, they lose contact and slap back against it — again and again. That rattle is the buzz.',
    why: {
      'The batter head ringing on after the stick has left it': 'The batter head rings too, but on its own that is a drum’s ring — the buzz comes from the wires on the snare-side head.',
      'The shell walls rattling against the metal hoops': 'A rattle there would be a fault for the player to fix. The buzz is the wires slapping the snare-side head.',
    },
  },
  {
    id: 'sn.snd.2',
    page: 'sound',
    prompt: 'The stick strikes the exact centre of the batter head. Which of its vibration shapes can it set moving?',
    options: ['Only the ring-shaped ones; the rest have a still line there', 'All of them equally, because the whole of the head is struck', 'Only the shapes that have a still line across the centre'],
    correct: 'Only the ring-shaped ones; the rest have a still line there',
    explain: 'A strike sets a shape moving in proportion to how much the head moves at the strike point in that shape. Every shape with a still line across the head is still at the centre — so a centre strike drives only the ring-shaped ones; off centre, more join in.',
    why: {
      'All of them equally, because the whole of the head is struck': 'The stick touches one small spot. A shape is driven only as much as the head moves at that spot — not at all on a still line.',
      'Only the shapes that have a still line across the centre': 'The reverse: a still line through the centre means the head does not move there, so a centre strike cannot push that shape.',
    },
  },
  {
    id: 'sn.snd.3',
    page: 'sound',
    prompt: 'The player releases the throw-off (snares off). What changes?',
    options: ['The wires hang clear of the head, so the buzz stops', 'The two heads stop being coupled through the air inside', 'The stick now strikes the snare-side head instead'],
    correct: 'The wires hang clear of the head, so the buzz stops',
    explain: 'The strainer lets the wires drop just clear of the snare-side head: nothing slaps the head, so the drum rings like a tom. The heads are still coupled through the air.',
    why: {
      'The two heads stop being coupled through the air inside': 'The air inside still couples the heads; only the wires stop touching the snare-side head.',
      'The stick now strikes the snare-side head instead': 'The sticks still strike the batter head on top. The throw-off only moves the wires.',
    },
  },
  micRatingCheck({ id: 'sn.set.1', page: 'setting', mic: 'snare mic', loudest: 'the hardest rimshot' }),
  {
    id: 'sn.set.2',
    page: 'setting',
    prompt: 'Before you place a top snare mic, what do you need to know from the player?',
    options: ['Where their sticks go — rimshots, cross-stick — and the sound they want', 'The make of their drum, so you can look up its one correct mic position', 'Nothing: a starting point already tells you where the mic goes'],
    correct: 'Where their sticks go — rimshots, cross-stick — and the sound they want',
    explain: 'A starting point is only valid if this player cannot hit the mic. Their strokes set the clearance; the sound they want sets the aim. Ask whether the snares are on for the passage, too.',
    why: {
      'The make of their drum, so you can look up its one correct mic position': 'No drum make sets a mic position. The player’s strokes and the sound they want do.',
      'Nothing: a starting point already tells you where the mic goes': 'A starting point says where to begin — but only where the player’s sticks cannot reach it.',
    },
  },
  {
    id: 'sn.set.3',
    page: 'setting',
    prompt: 'On a typical right-handed kit, where is the hi-hat relative to the snare?',
    options: ['Just behind and above it, to the player’s left', 'In front of it, out toward the audience side', 'Below it, down beside the snare stand on the floor'],
    correct: 'Just behind and above it, to the player’s left',
    explain: 'The hi-hat sits close, a little behind and above the snare on the player’s left — which is why it is the loudest neighbour a snare mic hears, and why a top mic usually comes in from the front, between the hi-hat and the rack tom.',
    why: {
      'In front of it, out toward the audience side': 'The audience side, in front of the snare, is usually where a top mic comes in. The hi-hat is behind and to the left.',
      'Below it, down beside the snare stand on the floor': 'Its pedal is on the floor, but its cymbals sit above the snare, just behind it.',
    },
  },
  {
    id: 'sn.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic just below the snare-side head hears more of which part of the sound?',
    options: ['The wires’ buzz from the snare-side head', 'The stick’s crack on the batter head', 'The hoop’s ring each time the drum is struck'],
    correct: 'The wires’ buzz from the snare-side head',
    explain: 'Much of the buzz leaves downward from the snare-side head and the wires, so a mic below hears more of it — a tendency, and drums vary.',
    why: {
      'The stick’s crack on the batter head': 'The crack starts on the batter head, on the far side of the drum from a bottom mic: a top mic hears more of it.',
      'The hoop’s ring each time the drum is struck': 'The heads and the wires carry the sound; a bottom mic faces the snare-side head and the wires.',
    },
  },
  {
    id: 'sn.mic.1',
    page: 'microphone',
    prompt: 'Why might a clip-on mic suit a crowded snare?',
    options: ['It rides the hoop low, leaving room for sticks and stands', 'Its clamp stops it hearing the hi-hat beside the snare', 'It needs no stand, so the sticks’ clearance stops mattering'],
    correct: 'It rides the hoop low, leaving room for sticks and stands',
    explain: 'A clip-on keeps a low profile on the rim and takes no floor space. It still has to sit clear of the sticks, and the clamp has to suit the hoop — with the player’s agreement.',
    why: {
      'Its clamp stops it hearing the hi-hat beside the snare': 'A clamp is a mount, not a pattern: it changes where the mic sits, not what it rejects.',
      'It needs no stand, so the sticks’ clearance stops mattering': 'Clearance always matters: a clip-on can still be struck if it sits in the sticks’ path.',
    },
  },
  {
    id: 'sn.mic.2',
    page: 'microphone',
    prompt: 'You want to try a condenser on the snare. What do you check first?',
    options: ['Its rated level, the power it needs, and a mount that fits', 'Nothing: a condenser cannot take a snare drum’s level at all', 'That it is placed farther away than a dynamic would be'],
    correct: 'Its rated level, the power it needs, and a mount that fits',
    explain: 'Condensers are used above and below snares. What matters is this model’s rated level, its power (phantom) and a safe mount — and its rating is still not a hearing limit.',
    why: {
      'Nothing: a condenser cannot take a snare drum’s level at all': 'Some condensers are rated for close drum use. Level handling belongs to the model, not to every condenser.',
      'That it is placed farther away than a dynamic would be': 'Distance is a choice for the sound and clearance, not a rule for condensers. Check its rating and power first.',
    },
  },
  {
    id: 'sn.mic.3',
    page: 'microphone',
    prompt: 'Where does a supercardioid reject the most?',
    options: ['Off to each side of the rear, near 125°', 'Straight behind it, right on its rear axis', 'At its sides, square to its front'],
    correct: 'Off to each side of the rear, near 125°',
    explain: 'A supercardioid has a small rear lobe; its deepest rejection is toward the rear but off the axis. Aim the hi-hat into that region, not straight behind.',
    why: {
      'Straight behind it, right on its rear axis': 'That is a cardioid. A supercardioid picks up a little straight behind.',
      'At its sides, square to its front': 'At 90° a supercardioid still picks up a fair amount; its deepest rejection is farther round, near 125°.',
    },
  },
  {
    id: 'sn.mic.4',
    page: 'microphone',
    prompt: 'The only spare input has no phantom power. Which of this page’s mic types can you use?',
    options: ['The three dynamics: none of them needs power', 'The rim condenser, as long as it is clamped on', 'All of them, provided the cable run is short'],
    correct: 'The three dynamics: none of them needs power',
    explain: 'Dynamic mics need no power. The rim condenser is a condenser: it needs phantom power, wherever it is mounted.',
    why: {
      'The rim condenser, as long as it is clamped on': 'How it is mounted does not change what it needs: this condenser needs phantom power.',
      'All of them, provided the cable run is short': 'Cable length does not power a condenser. Only the dynamics work without phantom.',
    },
  },
  {
    id: 'sn.place.1',
    page: 'placement',
    prompt: 'A starting point says 2.5–7.5 cm above the RIM. On this drum the rim stands about 1 cm above the head, and your readout says 5 cm above the batter HEAD. Are you in it?',
    options: ['Yes — measured from the rim, that is about 4 cm: inside the band', 'Yes — 5 cm is inside the band, whichever surface it is read from', 'No — a reading from the head cannot be checked against a rim band'],
    correct: 'Yes — measured from the rim, that is about 4 cm: inside the band',
    explain: 'A distance means something only with its reference surface. The rim stands about 1 cm above the head here, so 5 cm above the head is about 4 cm above the rim — inside 2.5–7.5 cm. Had the readout said 2 cm above the head, the mic would be only 1 cm above the rim: under the start, and close to the sticks.',
    why: {
      'Yes — 5 cm is inside the band, whichever surface it is read from': 'Right verdict, wrong reason. The surface matters: 2 cm above the head would be only 1 cm above the rim — outside the band.',
      'No — a reading from the head cannot be checked against a rim band': 'It can: add or take away the step between the two surfaces. Here the rim is about 1 cm above the head.',
    },
  },
  {
    id: 'sn.place.2',
    page: 'placement',
    prompt: 'You lift the mic from about 5 cm to about 12 cm above the rim. What tends to change?',
    options: ['More of the whole drum and the kit around it; less close snap', 'Only the level drops; the tone stays exactly as it was', 'More low end, because the mic is now farther from the batter head'],
    correct: 'More of the whole drum and the kit around it; less close snap',
    explain: 'A little more distance tends to take in more of the drum’s body and buzz — and more of the hi-hat and the kit. Compare at matched levels; drums vary.',
    why: {
      'Only the level drops; the tone stays exactly as it was': 'Distance changes the balance too: more of the whole drum, more of the kit, and less proximity effect (with a directional mic).',
      'More low end, because the mic is now farther from the batter head': 'With a directional mic, moving away tends to reduce proximity effect’s low-end lift, not add to it.',
    },
  },
  {
    id: 'sn.place.3',
    page: 'placement',
    prompt: 'Why does the top mic’s stand usually come in from the front, between the hi-hat and the rack tom?',
    options: ['The player’s side is the sticks’ path; the front keeps it clear', 'The front of the snare is where the head rings the loudest', 'Starting points are all measured from the front edge of the drum'],
    correct: 'The player’s side is the sticks’ path; the front keeps it clear',
    explain: 'The near half of the snare is where the sticks, rimshots and cross-stick work. From the front, the mic and its stand stay out of that path and out of the hi-hat’s travel.',
    why: {
      'The front of the snare is where the head rings the loudest': 'The reason is clearance, not loudness: the player’s side belongs to the sticks.',
      'Starting points are all measured from the front edge of the drum': 'Starting points are measured from the rim or a head, anywhere round the drum that is clear.',
    },
  },
  {
    id: 'sn.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What must a top mic, its stand and its cable stay out of?',
    options: ['The sticks’ path, rimshots and the hi-hat’s travel', 'The front of the drum, so the audience can see it clearly', 'The kick drum’s shell, which rings in sympathy'],
    correct: 'The sticks’ path, rimshots and the hi-hat’s travel',
    explain: 'Clearance comes first: the player’s side of the snare, the rim the sticks hit, and the hi-hat moving above it. Stop the drummer before anything moves.',
    why: {
      'The front of the drum, so the audience can see it clearly': 'The front is usually where a top mic comes in. The space to protect is the sticks’ and the hi-hat’s.',
      'The kick drum’s shell, which rings in sympathy': 'Neighbours matter for spill, but the safety question is the sticks’ path and the hi-hat’s travel.',
    },
  },
  {
    id: 'sn.ctx.1',
    page: 'context',
    prompt: 'The hi-hat is loud in the snare mic. What is a good first move to try?',
    options: ['Turn the mic so the hi-hat falls in its rejection', 'Turn the snare channel up so the snare drum covers it', 'Move the mic onto the player’s side of the drum'],
    correct: 'Turn the mic so the hi-hat falls in its rejection',
    explain: 'Aim the pattern’s rejection at the hi-hat, by its actual pattern, while the mic still faces the drum and stays clear of the sticks. Then judge how much hi-hat is fine for the music.',
    why: {
      'Turn the snare channel up so the snare drum covers it': 'More gain raises the hi-hat in that channel too. Aim the rejection first.',
      'Move the mic onto the player’s side of the drum': 'That side is the sticks’ path. Turn the mic instead, from a safe position.',
    },
  },
  {
    id: 'sn.ctx.2',
    page: 'context',
    prompt: 'With a supercardioid on the snare, where should the hi-hat sit for the most rejection?',
    options: ['Toward the rear, off to one side of the axis', 'Directly behind the mic, right on its rear axis', 'Beside the mic, square to its front'],
    correct: 'Toward the rear, off to one side of the axis',
    explain: 'A supercardioid’s deepest rejection is off the rear axis (near 125°); straight behind it has a small rear lobe. Aim by the actual pattern.',
    why: {
      'Directly behind the mic, right on its rear axis': 'A cardioid rejects most straight behind; a supercardioid has a small rear lobe there.',
      'Beside the mic, square to its front': 'At 90° the pickup is still fair. The rejection deepens toward the rear, off the axis.',
    },
  },
  {
    id: 'sn.ctx.studio',
    page: 'context',
    prompt: 'Studio session, a good room, overheads already up. What could justify no close snare mic at all?',
    options: ['The overheads already give the snare the crack and level it needs', 'A close snare mic would pick up far more spill than the overheads do', 'Close snare mics suit live work only, not a studio session'],
    correct: 'The overheads already give the snare the crack and level it needs',
    explain: 'If the kit image already carries the snare’s articulation and level, another channel may add nothing. Judge it before opening a mic you do not need.',
    why: {
      'A close snare mic would pick up far more spill than the overheads do': 'A close mic usually hears more snare relative to the rest, not less. The question is whether it adds anything.',
      'Close snare mics suit live work only, not a studio session': 'Close mics are used in studios too. The decision is what the overheads already give.',
    },
  },
  {
    id: 'sn.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · A mic above the batter head, aimed at it, hears more of which part of the sound?',
    options: ['The stick’s crack on the batter head', 'The wires’ buzz from underneath the drum', 'The air leaving through the shell'],
    correct: 'The stick’s crack on the batter head',
    explain: 'The crack starts where the stick meets the batter head, so a top mic aimed at it tends to hear more of it; the buzz leaves mostly downward.',
    why: {
      'The wires’ buzz from underneath the drum': 'The buzz leaves mostly downward, from the snare-side head: a bottom mic hears more of it.',
      'The air leaving through the shell': 'Apart from a small vent hole, the shell is closed; the heads move the air. Above the drum, it is the batter head’s crack.',
    },
  },
  {
    id: 'sn.two.1',
    page: 'twoMic',
    prompt: 'Why do a top and a bottom snare mic usually start out of step?',
    options: ['The heads move the same way: one mic hears a push, one a pull', 'The bottom mic is farther from the stick, which inverts it', 'The wires invert the sound before it can reach the bottom mic'],
    correct: 'The heads move the same way: one mic hears a push, one a pull',
    explain: 'As the batter head moves down, away from the top mic, the snare-side head moves down, toward the bottom mic: they start with opposite pressure. Distance adds a delay on top — a separate thing.',
    why: {
      'The bottom mic is farther from the stick, which inverts it': 'Distance delays a sound; it does not flip its sign. The opposite start comes from facing heads that move the same way.',
      'The wires invert the sound before it can reach the bottom mic': 'The wires add the buzz; the opposite start comes from the two heads moving the same way.',
    },
  },
  {
    id: 'sn.two.2',
    page: 'twoMic',
    prompt: 'You flip the bottom mic’s polarity. What happens to the arrival-time difference?',
    options: ['Nothing: polarity flips the sign; the delay stays the same', 'It drops to zero, so both of the arrivals now line up again', 'Cut in half: the flipped copy cancels half of it'],
    correct: 'Nothing: polarity flips the sign; the delay stays the same',
    explain: 'Polarity reverses the signal’s sign; it does not remove a delay caused by sound reaching the mics at different times. The notches move; Δt does not.',
    why: {
      'It drops to zero, so both of the arrivals now line up again': 'Flipping polarity changes the sign, not when the sound arrives — the mics are still where they were.',
      'Cut in half: the flipped copy cancels half of it': 'Polarity has no time in it. Only moving a mic changes when the sound arrives.',
    },
  },
  {
    id: 'sn.two.3',
    page: 'twoMic',
    prompt: 'With the bottom mic inverted, the snare sounds fuller and reads 2 dB louder. What do you conclude?',
    options: ['Not yet: match the levels, then compare both states in mono', 'Inverted is the correct setting for snare drums, so keep it', 'Normal polarity was wrong, because it was quieter'],
    correct: 'Not yet: match the levels, then compare both states in mono',
    explain: `${OPPOSITE_SIDES_POLARITY} A louder state sounds “better” at first: compare at matched level, with the kit.`,
    why: {
      'Inverted is the correct setting for snare drums, so keep it': 'Flipping is a common first thing to try, not a law: the heads’ opposite start and the delay between the mics together decide which state is better.',
      'Normal polarity was wrong, because it was quieter': 'Quieter is not wrong. Match levels, then judge which state keeps the snare’s body.',
    },
  },
  {
    id: 'sn.two.4',
    page: 'twoMic',
    prompt: 'The top mic alone sounds right in the kit, but the producer wants more wire detail. Is a bottom mic worth trying?',
    options: ['Yes — if it adds the wires and the pair holds up in mono', 'No — a top mic hears the wires just as well as a bottom one', 'Yes — and once it is flipped, the pair needs no more checks'],
    correct: 'Yes — if it adds the wires and the pair holds up in mono',
    explain: 'A bottom mic is a choice for more control of the wires, not a requirement. Add it at a modest level, compare both polarity states in mono at matched level, and keep it only if it helps the whole kit.',
    why: {
      'No — a top mic hears the wires just as well as a bottom one': 'A top mic hears the wires too, but less of them: they lie against the head underneath. The bottom mic adds that detail, if it helps.',
      'Yes — and once it is flipped, the pair needs no more checks': 'Flipping is the first thing to try, not a setting to trust: compare both states by ear, at matched level, in mono.',
    },
  },
  {
    id: 'sn.prac.gain',
    page: 'practice',
    prompt: 'Typical strokes sit well below the overload light, but the drummer’s rimshots light it. What do you do?',
    options: ['Lower the input gain, or use a pad its manual allows, and re-check', 'Pull the channel fader down until the rimshots sound clean', 'Ask the drummer to play all the rimshots more softly during the show'],
    correct: 'Lower the input gain, or use a pad its manual allows, and re-check',
    explain: 'Set input gain with headroom for the strongest intended strokes and watch the overload indicator. A lowered fader does not undo clipping at the input; use a pad only as the manual permits.',
    why: {
      'Pull the channel fader down until the rimshots sound clean': 'The overload happens at the input, before the fader. A lower fader only makes the clipped sound quieter.',
      'Ask the drummer to play all the rimshots more softly during the show': 'Set gain for the strongest strokes the player intends to play — not for a gentler soundcheck.',
    },
  },
  {
    id: 'sn.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a bottom snare channel?',
    options: ['The top mic works alone, the pair adds wire detail, it holds in mono', 'Two channels give the mix engineer more options to work with later on', 'The snare needs more level in the mix than one mic can give'],
    correct: 'The top mic works alone, the pair adds wire detail, it holds in mono',
    explain: 'A bottom mic blends a different perspective. If the pair loses body or turns uneven, adjust position, level and polarity — or leave the bottom mic out.',
    why: {
      'Two channels give the mix engineer more options to work with later on': 'More channels also add spill, a cable and a combining check. A second mic should earn its place.',
      'The snare needs more level in the mix than one mic can give': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'sn.mix.1',
    page: 'practice',
    prompt: 'A starting point says “3–5 cm above the drumhead”. Where do you measure from?',
    options: ['The batter head’s surface, not the rim above it', 'The top of the rim, since it is the easier to see', 'The middle of the shell, halfway down the drum'],
    correct: 'The batter head’s surface, not the rim above it',
    explain: 'A distance belongs to the surface it names: “above the drumhead” is from the head, “above the rim” from the rim — different numbers for the same spot.',
    why: {
      'The top of the rim, since it is the easier to see': 'Easier to see, but not what this starting point names. Measure from the head.',
      'The middle of the shell, halfway down the drum': 'Nothing is measured from inside the drum here. The head is the named surface.',
    },
  },
  {
    id: 'sn.mix.2',
    page: 'practice',
    prompt: 'The hi-hat sits about 125° off a supercardioid’s front axis. What can you expect?',
    options: ['Strong rejection on paper; in reality less, and often least in the lows', 'Silence from the hi-hat, because it sits in the null', 'More hi-hat than straight behind it, which is where it rejects most'],
    correct: 'Strong rejection on paper; in reality less, and often least in the lows',
    explain: 'A null is infinitely deep only on paper. Real mics reject far less there, and often least at low frequencies — use the null to aim, not to promise silence.',
    why: {
      'Silence from the hi-hat, because it sits in the null': 'A null is infinitely deep only on paper. Real mics reject far less.',
      'More hi-hat than straight behind it, which is where it rejects most': 'Straight behind, a supercardioid has a small rear lobe; its deepest rejection is off the rear axis.',
    },
  },
  {
    id: 'sn.mix.3',
    page: 'practice',
    prompt: 'Top and bottom snare mics sound thin together. Which change removes the arrival-time difference itself?',
    options: ['Moving a mic so the two paths are closer to equal', 'Flipping the polarity switch on the bottom mic', 'Turning the bottom mic up until it matches the top'],
    correct: 'Moving a mic so the two paths are closer to equal',
    explain: 'Only the paths set the delay. Polarity moves the notches (and answers the heads’ opposite start); level changes their depth; neither removes the delay.',
    why: {
      'Flipping the polarity switch on the bottom mic': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
      'Turning the bottom mic up until it matches the top': 'Level changes the depth of the notches, not where they are or the delay behind them.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'sn.sym.contact',
    observation: 'A mic, clip or cable is inside a stick or rimshot path',
    firstChecks: 'Stop the drummer; remount and reroute before continuing. Check the full playing motion again.',
    options: ['Stop the drummer, remount and reroute; recheck the whole motion', 'Keep playing carefully, and move it after the song has finished', 'Tape the cable to the hoop so that it cannot move about'],
    correct: 'Stop the drummer, remount and reroute; recheck the whole motion',
    explain: 'Clearance comes first: have the drummer stop before any mic moves, then check every stroke again — accents, fills, rimshots, cross-stick.',
    why: {
      'Keep playing carefully, and move it after the song has finished': 'Clearance comes first: stop the drummer now, before a stick or a rimshot finds it.',
      'Tape the cable to the hoop so that it cannot move about': 'The hoop is struck. Route and secure the cable away from the sticks and the pedals.',
    },
  },
  {
    id: 'sn.sym.hihat',
    observation: 'The snare close channel is dominated by hi-hat',
    firstChecks: 'Inspect aim and the mic’s actual pattern, choose a safe position relative to the hi-hat, then decide how much bleed is musically acceptable.',
    options: ['The aim and actual pattern, a safe angle, then how much is fine', 'Turn the snare channel up until the snare covers the hi-hat', 'Swap to a condenser, which hears less of the hi-hat'],
    correct: 'The aim and actual pattern, a safe angle, then how much is fine',
    explain: 'Aim the rejection by the actual pattern from a safe position — and remember some hi-hat in a snare mic is not automatically a defect.',
    why: {
      'Turn the snare channel up until the snare covers the hi-hat': 'More gain raises the hi-hat in that channel too. Aim first.',
      'Swap to a condenser, which hears less of the hi-hat': 'Spill depends on pattern, aim and distance, not on the transducer type.',
    },
  },
  {
    id: 'sn.sym.body',
    observation: 'The close snare lacks body when added to the overheads',
    firstChecks: 'Compare levels and both polarity states in mono; evaluate placement and arrival-time interaction.',
    options: ['Levels and both polarity states in mono, then position and timing', 'Boost the low end on the snare channel first, before anything else', 'Mute the overheads, since they are causing the problem'],
    correct: 'Levels and both polarity states in mono, then position and timing',
    explain: 'Two mics hearing the same stroke at different times can cancel. Compare in mono at matched levels before reaching for EQ — no switch cures every case.',
    why: {
      'Boost the low end on the snare channel first, before anything else': 'EQ cannot undo a cancellation between mics. Check the combination first.',
      'Mute the overheads, since they are causing the problem': 'The overheads are part of the kit sound. Check how the two combine.',
    },
  },
  {
    id: 'sn.sym.bottom',
    observation: 'Adding the bottom mic makes the snare thin or inconsistent',
    firstChecks: 'Recheck channel identity, relative level, both polarity states, locations, and the complete kit; omit it if it does not help.',
    options: ['Channel identity, level, both polarity states, positions — or omit it', 'Invert the bottom mic and leave it, since that one is wrong', 'Turn the bottom mic up until the snare sounds full again'],
    correct: 'Channel identity, level, both polarity states, positions — or omit it',
    explain: 'Check which channel is which, then the pair at matched levels in both polarity states, with the kit. If it still does not help, leave it out.',
    why: {
      'Invert the bottom mic and leave it, since that one is wrong': 'Flipping it is a common first thing to try, never a rule: compare both states at matched level, in mono.',
      'Turn the bottom mic up until the snare sounds full again': 'More level does not fix a cancellation; it makes the thin sound louder.',
    },
  },
  {
    id: 'sn.sym.rattle',
    observation: 'The snare sounds buzzy or rattly even before miking',
    firstChecks: 'Ask the player to inspect wires, head, stand and nearby hardware; solve source issues before prescribing a mic change.',
    options: ['Ask the player to check the wires, head, stand and hardware', 'Move the mic closer to hear where the rattle comes from', 'Cut the high frequencies on the snare channel'],
    correct: 'Ask the player to check the wires, head, stand and hardware',
    explain: 'A mic cannot repair a drum. A rattle that is there unamplified belongs to the player and the drum (the Drum Tuning Lab covers tuning).',
    why: {
      'Move the mic closer to hear where the rattle comes from': 'The rattle is in the drum or its hardware. Find it at the source, with the player.',
      'Cut the high frequencies on the snare channel': 'EQ hides the symptom and dulls the snare. Fix the source first.',
    },
  },
  {
    id: 'sn.sym.dist',
    observation: 'Strong strokes distort',
    firstChecks: 'Determine whether the microphone, input stage, or vibrating hardware is responsible; set suitable gain, check overload indicators and specifications.',
    options: ['Where it starts — mic, input or rattling hardware — then gain', 'Pull the channel fader down until the hits sound cleaner', 'Cut the low end with EQ so the channel has more headroom'],
    correct: 'Where it starts — mic, input or rattling hardware — then gain',
    explain: 'A lowered fader does not undo clipping at the input, and EQ after an overloaded mic cannot restore it. Find where it starts.',
    why: {
      'Pull the channel fader down until the hits sound cleaner': 'The fader comes after the input; a clipped input stays clipped, only quieter.',
      'Cut the low end with EQ so the channel has more headroom': 'EQ after the input cannot undo clipping at the input. Lower gain there first.',
    },
  },
];

/** The one-mic setup (L40-L46), with L12's power and gain rules. */
const orderTasks: OrderTask[] = [
  {
    id: 'sn.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic snare setup in the order you would do them.',
    steps: [
      { text: 'Ask the drummer: strokes, stick and rimshot paths, snares on or off, the sound wanted', early: 'Start with the player and the drum.' },
      { text: 'Choose a mic whose specs suit, and a secure stand or an approved clamp', early: 'Choose the mic once you know the strokes and the sound the player wants.' },
      { text: 'Have the drummer stop; mount near the top rim; check every part against the sticks', early: 'You need a chosen mic before you can mount it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom if it is needed', early: 'Power comes after the mic is mounted and connected — with the outputs muted first.' },
      { text: 'Set input gain on typical AND strongest strokes, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare height and aim one change at a time, at matched levels', early: 'Compare only once the level is set safely — and at matched levels, so louder does not win.' },
      { text: 'Secure the position and cable; recheck clearance with the full performance', early: 'Secure it last, then watch the player’s whole motion again.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before connecting, disconnecting or switching it, and follow your own equipment’s manual. Gain: set it with headroom for the strongest strokes, rimshots included.',
  },
];

const POWER_REASON: SetupReason = { id: 'r.power', label: 'This channel gives the mic the power it needs (phantom, or none)', role: 'required', feedback: 'Say how the mic is powered: the condensers here need phantom; a dynamic needs none.' };
const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a suggested starting point for this kind of mic, from the right surface', role: 'required', feedback: 'Say why it is a good place to begin, and whether it is measured from the rim or a head.' };
const CLEAR_REASON: SetupReason = { id: 'r.clear', label: 'The mic, mount and cable stay out of the sticks’ path, rimshots and the hi-hat', role: 'required', feedback: 'Clearance is part of every passing setup.' };
const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand most engineers reach for on a snare', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' };
const LOUD_REASON: SetupReason = { id: 'r.loud', label: 'It will give the loudest snare of any position on the drum', role: 'wrong', feedback: 'Loudness is not a passing reason — level comes from gain — and no position is “the loudest” on every drum.' };

/** The final task (L84): several setups pass; the reasons are graded. */
const setupTasks: SetupTask[] = [
  {
    id: 'sn.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A loud club stage. The hi-hat sits close above the snare, and the drummer plays lots of rimshots. One channel; phantom power is available.',
    setups: [
      { id: 'a', label: 'Small cardioid dynamic over the rim, 2.5 to 7.5 cm above it, aimed at the head, its rear toward the hi-hat', ok: true, power: 'none', feedback: 'A suggested starting point, clear of the sticks, its rejection turned toward the hi-hat.' },
      { id: 'b', label: 'Supercardioid dynamic over the rim, aimed at the head, the hi-hat off to one side of its rear', ok: true, power: 'none', feedback: 'A suggested starting point; the hi-hat sits where a supercardioid rejects most.' },
      { id: 'c', label: 'Clip-on dynamic clamped to the rim, 3 to 5 cm above the head, angled 30 to 60° from straight down', ok: true, power: 'none', feedback: 'A suggested starting point, low and clear of the rimshots — with a clamp that suits the hoop.' },
      { id: 'd', label: 'Small dynamic 3 cm over the middle of the head, for the most crack', ok: false, power: 'none', feedback: 'The middle of the head is the sticks’ path: the mic would be struck. Stay over the rim.' },
      { id: 'e', label: 'Rim condenser laid flat on the head so that it cannot move', ok: false, power: 'phantom', feedback: 'Never on the head: it touches a moving part, and its head should be angled, not flat to the drum.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.null', label: 'Aiming its rejection toward the hi-hat helps separation', role: 'optional', feedback: 'A fair live reason — though some hi-hat is not automatically a defect.' }, BRAND_REASON, LOUD_REASON],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point from its named surface, clearance from the sticks and the hi-hat, and power that matches the mic.',
  },
  {
    id: 'sn.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · Studio session. The top mic is up; the producer wants more of the wires. The second input has NO phantom power.',
    setups: [
      { id: 'a', label: 'Small dynamic just below the bottom rim, aimed up at the head and wires, then check polarity with the top mic', ok: true, power: 'none', feedback: 'A suggested starting point below the drum; a dynamic needs no phantom; the polarity check follows.' },
      { id: 'b', label: 'Clip-on dynamic on the bottom hoop, aimed up, then check polarity with the top mic', ok: true, power: 'none', feedback: 'A suggested starting point, clear of the stand; a dynamic needs no phantom.' },
      { id: 'c', label: 'Rim condenser on the bottom hoop, aimed up at the wires', ok: false, power: 'phantom', feedback: 'A fair position — but this input has no phantom power, and this condenser needs it.' },
      { id: 'd', label: 'Small dynamic pressed against the wires, for the most sizzle', ok: false, power: 'none', feedback: 'The wires move: a mic touching them rattles and damps them. Keep it clear.' },
      { id: 'e', label: 'A second top mic just above the first, aimed at the wires through the head', ok: false, power: 'none', feedback: 'A top mic faces the batter head; the wires’ sound leaves mostly downward. A bottom mic is the way to get more of it.' },
    ],
    reasons: [DOC_REASON, { ...CLEAR_REASON, label: 'The mic, mount and cable stay clear of the wires, strainer, stand and feet' }, POWER_REASON, { id: 'r.mono', label: 'I will compare both polarity states with the top mic, in mono', role: 'optional', feedback: 'A fair reason: a top and bottom pair needs that check.' }, BRAND_REASON, { id: 'r.auto', label: 'Invert the bottom mic and leave it: that is the rule for a snare', role: 'wrong', feedback: 'Inversion usually helps, but it is a check made by ear, not a rule.' }],
    explain: 'Two bottom positions pass. What passes is the reasoning: a sensible starting point, clear of the wires and the stand, powered by what this input can supply — and checked against the top mic.',
  },
];

/** One ungraded prediction before each rack activity (try before tell). */
const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: when the stick pushes the batter head down, what does the snare-side head do?', options: ['It moves down too, pushed by the air', 'It moves up, toward the batter head', 'It stays still — only the struck head moves'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch both heads and the wires.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you raise the mic from close over the rim to a little farther away. What changes?', options: ['More snap from the stick', 'More of the whole drum and the kit', 'It depends on this drum'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'Where will this supercardioid reject the hi-hat best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION.' },
  twoMic: { prompt: 'If you flip the bottom mic’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

/* THE QUICK CHECK (LESSON_JOURNEY §2.5): two items per foundation page;
 * q.6 (hearing) is critical. It opens the activities; it credits nothing. */
const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'Which head carries the snare wires?',
    options: ['The bottom (snare-side) head, under the drum', 'The batter head, on top where the sticks land', 'Neither: the wires hang inside the shell'],
    correct: 'The bottom (snare-side) head, under the drum',
    explain: 'The wires are stretched across the thin snare-side head, underneath; the sticks strike the batter head on top.',
    why: {
      'The batter head, on top where the sticks land': 'The sticks land on the batter head; the wires lie across the snare-side head underneath.',
      'Neither: the wires hang inside the shell': 'The wires are outside the drum, stretched across the snare-side head.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What does the strainer (the throw-off) do?',
    options: ['Pulls the wires against the head, or lets them drop', 'Tightens the batter head, raising the drum’s pitch a little', 'Holds the snare drum firmly in its stand'],
    correct: 'Pulls the wires against the head, or lets them drop',
    explain: 'The strainer is the lever on the shell that turns the snares on (wires pulled up against the head) or off (wires dropped clear).',
    why: {
      'Tightens the batter head, raising the drum’s pitch a little': 'The tension rods tune the heads. The strainer only moves the wires.',
      'Holds the snare drum firmly in its stand': 'The stand’s basket holds the drum. The strainer turns the wires on or off.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'A stroke exactly at the centre of a drumhead drives which of its vibration shapes?',
    options: ['Only the ring-shaped ones — the rest are still there', 'All of the shapes, each one just as hard', 'Only the shapes split by a line through the centre'],
    correct: 'Only the ring-shaped ones — the rest are still there',
    explain: 'A strike drives a shape only as much as the head moves at the strike point in that shape; a shape with a still line through the centre does not move there.',
    why: {
      'All of the shapes, each one just as hard': 'The stick touches one spot. A shape is driven only as much as the head moves there — not at all on a still line.',
      'Only the shapes split by a line through the centre': 'The reverse: those shapes are still at the centre, so a centre strike cannot drive them.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Why does the snare buzz?',
    options: ['The wires lose contact with the moving head, then slap back', 'The batter head rubs against the metal hoop each time it moves', 'The air inside the drum rattles against the shell'],
    correct: 'The wires lose contact with the moving head, then slap back',
    explain: 'The snare-side head moves faster than the wires can follow: they leave it and slap back, again and again — the buzz.',
    why: {
      'The batter head rubs against the metal hoop each time it moves': 'That would be a fault. The buzz is the wires slapping the snare-side head.',
      'The air inside the drum rattles against the shell': 'The air drives the heads; it is the wires on the snare-side head that rattle.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'What must a top snare mic and its stand stay out of?',
    options: ['The sticks’ path, rimshots and the hi-hat’s travel', 'The front of the drum, so the audience can see it clearly', 'The floor tom’s space on the far side of the kit'],
    correct: 'The sticks’ path, rimshots and the hi-hat’s travel',
    explain: 'The near half of the snare belongs to the sticks — strokes, rimshots, cross-stick — and the hi-hat moves just above. The front usually stays clear for a mic.',
    why: {
      'The front of the drum, so the audience can see it clearly': 'The front is usually where a top mic comes in. The sticks’ path is what to keep clear.',
      'The floor tom’s space on the far side of the kit': 'Neighbours matter, but the space that moves all the time is the sticks’ and the hi-hat’s.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: 'Your snare mic is rated to a very high maximum SPL. What does that tell you about standing by the kit through a long soundcheck?',
    options: ['Nothing — that is the mic’s distortion limit, not a hearing limit', 'It is safe for a while, as long as the snare stays below the mic’s rating', 'It is safe as long as the mic is nearer the drum than you'],
    correct: 'Nothing — that is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'It is safe for a while, as long as the snare stays below the mic’s rating': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      'It is safe as long as the mic is nearer the drum than you': 'Where the mic sits says nothing about your ears. Measure where the person listens, and keep levels and time down.',
    },
  },
];

/* ── the stage, from the shared kit, in the lesson frame ── */
const toLesson = (x: number, y: number, z: number) => ({ x: x - S0_KIT.x, y: y - S0_KIT.y, z: z - S0_KIT.z });
const wedges: Wedge[] = [
  {
    id: 'hihat',
    label: 'the hi-hat, just behind and above the snare',
    short: 'HI-HAT',
    p: NEIGHBOURS.hihat.c,
    lift: 0,
    faces: { x: 0, y: -1, z: 0 },
    note: 'It sits close to the snare, a little behind and above it — the case a pattern’s rejection can help with.',
    prov: { kind: 'illustrative', reason: 'the shared 5-piece kit (kit/GEOMETRY_PROPOSAL.md §2)' },
    glyph: 'none',
  },
  {
    id: 'fill',
    label: 'the drummer’s own fill, on the floor beside the throne',
    short: 'DRUM FILL',
    p: toLesson(-450, KIT_FLOOR_Y, 750),
    lift: 150,
    faces: { x: -0.2, y: 0, z: -1 },
    note: 'It sits on the drummer’s side of the kit. Aimed down at the snare, the mic’s front half faces that way: little of a null reaches it — the drum and the player block part of its path.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout (the kick lesson’s same monitor); no source gives the position' },
  },
  {
    id: 'downstage',
    label: 'a floor wedge for another player, downstage of the drums, facing upstage',
    short: 'DOWNSTAGE',
    p: toLesson(457.2 + 900, KIT_FLOOR_Y, -450),
    lift: 150,
    faces: { x: -1, y: 0, z: 0 },
    note: 'Out on the audience side, facing back at the kit: far from the snare, and well off its mic’s axis.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout (the kick lesson’s same monitor); no source gives the position' },
  },
];

export const M02_LESSON: Lesson = {
  id: 'M02',
  labId: 'drums',
  title: 'Snare Drum',
  subtitle: 'Top, bottom, clamp or stand — and the hi-hat beside it',
  noun: { one: 'snare', many: 'snares' },
  model: SNARE_MODEL,
  micTypeIds: ['smallDynCard', 'tomDynSuper', 'clipDynCard', 'rimCondenser'],
  zones: SNARE_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'The snare is the drum between the player’s knees, struck with sticks. Its top (batter) head takes the strokes; across its thin bottom (snare-side) head lie the snare wires — coiled steel strands that buzz against it. A lever on the shell, the strainer, turns the wires on or off.', src: 'DPA-KIT' },
    { title: 'WHERE YOU MEET IT', text: 'In almost every drum kit, on stage and in the studio, close to the player and to the hi-hat. This lesson covers studio recording and live sound.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Crisp accents and the drive of the beat — and the player may use rimshots, cross-stick, brushes, ghost notes and fills. Ask which strokes they use: they decide where the sticks go, and so where a mic cannot.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'Kit snares are commonly 14 in across and about 5 to 8 in deep. This lab draws a 14 × 5.5 in drum, cut open so you can see the wires.', src: 'YMH-TCS' },
  ],
  sound: {
    stages: [
      { title: 'The stick strikes', text: 'The tip of the stick strikes the batter head. That brief contact is where the ATTACK — the crack at the start of the sound — begins.' },
      { title: 'The batter head is pushed in', text: 'The head bows into the drum — most at the centre, not at all at the hoop: its lowest vibration shape, drawn here many times larger than it really moves.' },
      { title: 'The air pushes the snare-side head', text: 'The batter head squeezes the air inside, and the air pushes the snare-side head down. The two heads are coupled through the air — and the snare-side head carries the wires with it.' },
      {
        title: 'The wires buzz',
        text: 'The snare-side head springs back faster than the wires can follow: they lose contact with it, then slap back against it — again and again. That rattle is the snare’s buzz.',
        byVariant: { off: 'With the snares off, the wires hang just clear of the head. The head springs back and rings, but nothing slaps it: no buzz, and the drum rings like a tom.' },
      },
      {
        title: 'Sound leaves the drum',
        text: 'Sound leaves from both heads — the batter head upward, toward the player and a top mic; the snare-side head and the wires downward, toward the floor and a bottom mic. The heads, the air, the shell and the wires together are the BODY of the sound.',
        byVariant: { off: 'Sound leaves from both heads — the batter head upward, toward the player and a top mic; the snare-side head downward, toward the floor and a bottom mic. With the snares off, the heads, the air and the shell are the BODY of the sound.' },
      },
    ],
    attack: 'The start of the sound: the stick’s brief contact with the batter head — the crack. It begins at the strike, so a mic above the batter head and aimed at it tends to hear more of it.',
    body: 'The ring and the buzz: both heads, the air inside and the shell ringing together, with the wires rattling against the snare-side head. Much of the buzz leaves downward, so a mic below the drum tends to hear more of it. Both are tendencies, and drums vary. Tuning and the wires’ tension change how the drum rings — the Drum Tuning Lab covers tuning.',
    head: { diameterMm: 14 * 25.4, rods: 10, label: '14 in batter head, seen from above', strikeSrc: 'LESSON', hoop: 'metal' },
  },
  setting: {
    items: [
      { id: 'snare', label: 'the snare drum (on its stand)', short: 'SNARE', note: 'Between the player’s knees, on its own stand, drawn flat. Ringed in amber: the drum this lesson mics.', prov: { kind: 'sourced', src: 'YMH-TCS', quote: 'TMS-1455 14"×5.5"' }, tag: 'THE DRUM', scene: 'all' },
      { id: 'hihat', label: 'hi-hat', short: 'HI-HAT', note: 'Just behind and above the snare, to the player’s left — the loudest neighbour a snare mic hears. Its cymbals open and close, and air bursts out of their edges: keep a mic clear of both.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'SPILL', scene: 'kit' },
      { id: 'throne', label: 'drum throne (the player’s seat)', short: 'THRONE', note: 'The player sits behind the snare. Their hands and sticks work over its near half — the sticks’ path — so no mic, stand or cable goes there.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'toms', label: 'two rack toms', short: 'RACK TOMS', note: 'Up and to the snare’s right, over the kick. A top mic’s stand usually comes in between the small tom and the hi-hat.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'MIC PATH', scene: 'kit', planIds: ['tom1', 'tom2'] },
      { id: 'cymbals', label: 'crash and ride cymbals', short: 'CYMBALS', note: 'A crash above, just in front of the snare; another crash and the ride across the kit. Loud, and they swing when struck: a top mic’s stand passes under the near crash.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'SPILL', scene: 'kit', planIds: ['crash1', 'crash2', 'ride'] },
      { id: 'kick', label: 'kick drum and its pedal', short: 'KICK', note: 'On the floor to the snare’s right. A bottom mic’s stand and cable share the floor with the kick and hi-hat pedals: route them away from both.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'FLOOR SPACE', scene: 'kit', planIds: ['kick', 'pedal'] },
      { id: 'floor', label: 'floor tom', short: 'FLOOR TOM', note: 'Across the kit on the player’s right — farther from the snare, but still heard by its mics.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'SPILL', scene: 'kit' },
      { id: 'fill', label: 'the drummer’s fill (monitor)', short: 'DRUM FILL', note: 'A floor monitor beside the throne so the drummer can hear the band — loud, close to the kit.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'downstage', label: 'a downstage wedge (another player’s monitor)', short: 'WEDGE', note: 'Out on the audience side, facing back toward the stage.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Live, the audience already hears the acoustic snare; the PA adds what the room needs.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a studio there are no wedges on the floor; the room and the overheads may already carry much of the snare.', prov: { kind: 'illustrative', reason: 'a generic room; no source gives its size' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors on the floor feed the players, the PA faces the audience, and the stage is loud. Stage spill, the hi-hat and the gain available before feedback push toward close, aimed pickup.',
    studio: 'STUDIO: no wedges on the floor, repeated trials are practical when the drummer stops, and the overheads or the room may already carry the snare — a close mic adds control when it helps.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic snare setup for a given drum and performance, describe an alternative position, and explain what would justify a bottom mic. With a real drum and the drummer’s agreement, you can record what you tried below.',
    fields: [
      { id: 'drum', label: 'Drum (size, heads, wires)', kind: 'text' },
      { id: 'snares', label: 'Snares', kind: 'choice', choices: ['on', 'off'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small dynamic, cardioid', 'dynamic, supercardioid', 'clip-on dynamic', 'condenser', 'other'] },
      { id: 'pattern', label: 'Pattern', kind: 'text' },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, from the rim or which head', kind: 'text' },
      { id: 'aim', label: 'Aim, and where the hi-hat sits off it', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  // INTERNAL record (never shown): the unknowns in words; `dims` ties each to
  // the placeholders it covers (validateLesson checks every one is listed).
  unknowns: [
    { text: 'The snare’s height above the floor and its tilt (drawn flat, batter 640 mm up) — so no HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'Head and wire motion clearances, and the hi-hat’s and the crash’s keep-outs — ILLUSTRATIVE values for the owner to approve.', dims: ['snare.batter', 'snare.reso', 'snare.wiresOn', 'snare.wiresOff', 'hihat', 'crash1'] },
    { text: 'Hoop height above the head (10 mm), the hoop skirt, the shell-to-hoop gap, the lug size and the rod phase — drawing defaults.', dims: [] },
    { text: 'The wire set’s size (320 × 75 mm), how far released wires drop (6 mm), and the strainer’s side (drawn on the player’s side so the cutaway shows the wires’ length; the proposal’s 270° is equally a default).', dims: [] },
    { text: 'The sticks’ and rimshots’ envelope (the player’s half, 40 cm up, 6 cm past the edge) and the player’s reach — drawn illustratively.', dims: [] },
    { text: 'The bottom-mic distance (3–8 cm below the snare-side head): the source gives a position only.', dims: [] },
    { text: 'The snare stand’s basket and legs, and a clamp’s reach from the hoop.', dims: [] },
    { text: 'The supercardioid drum dynamic’s outline (not published) and the rim condenser’s head length — drawing defaults.', dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. Every drum, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a 14 × 5.5 in snare in a typical kit layout, mic patterns and the two-mic comb as textbook shapes, and head and wire motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the drummer stopped.',
  copy: SNARE_COPY,
};
