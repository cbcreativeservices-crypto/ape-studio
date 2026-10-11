/**
 * M03 RACK AND FLOOR TOMS — the lesson's pages as DATA (blueprint §7). The
 * words come from the owner's lesson (docs/labs/miking/source_text/Rack-and-
 * Floor-Tom-Miking-Technique-Research.txt, cited "L<n>" in COMMENTS only)
 * with the fixes logged in docs/labs/miking/CORRECTIONS_LOG.md (T-01 …).
 *
 * OWNER RULING 2026-10-04 — learner-facing presentation: suggested starting
 * points, never dogma; no source, brand or model in learner text; no badges.
 * Pinned by test/mikingLearnerText.test.ts and test/mikingModelM03.test.ts.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, LessonPages, PageContent, SourcePageId, SetupReason, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { OPPOSITE_SIDES_POLARITY, micRatingCheck } from '../../engine/model/sharedItems.ts';
import { KIT_CYMBALS, KIT_FLOOR_Y } from '../shared/kitPlanModel.ts';
import { TOMS_MODEL } from './geometry.ts';
import { TOM_ZONES } from './model.ts';
import { TOMS_COPY } from './copy.ts';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the toms',
    goal: 'Get to know the rack and floor toms — what they are, where you meet them, what they do in the music, and their parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Two rack toms sit over the kick on a holder; the floor tom stands on its legs. Each has a batter head on top and a resonant head below — no wires. Work with the drums as the player brings them.',
  },
  sound: {
    title: 'How they make their sound',
    goal: 'See how a stroke becomes sound in a tom — the stick, both heads, the air inside — and how the drums’ sizes set their pitch order.',
    credit: { scenarios: ['tm.snd.1', 'tm.snd.2', 'tm.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The attack starts where the stick meets the batter head; both heads and the air ring on as the body — often a clear pitch. Bigger toms ring lower. A mic hears more of what it is closer to and faces: tendencies, and drums vary.',
  },
  setting: {
    title: 'Where they sit',
    goal: 'Know the toms’ places on the kit — over the kick, beside the player’s leg, under the cymbals — the sticks’ path across them, what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['tm.set.1', 'tm.set.2', 'tm.set.3'], note: 'Answer the three checks.' },
    takeaway: 'Tom fills sweep the sticks across every drum, and the cymbals hang above: mics, clamps and stands stay out of both. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a tom mic by its properties — pattern, power, size and mount — not by its brand, and not by the drum’s name.',
    credit: { scenarios: ['tm.mic.1', 'tm.mic.2', 'tm.mic.3', 'tm.mic.4', 'tm.rec.1'], note: 'Answer the five checks (one reaches back to how the toms sound).' },
    takeaway: 'Dynamics and condensers both serve toms; pattern, mount and the mic’s own response matter more than its type. A tight pattern helps isolate one tom; one mic covering two wants a wider one. Max SPL is not a hearing limit.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — over a tom’s rim, measured square to its head, aimed at it, clear of the sticks and cymbals — then move the mic and see what changes.',
    credit: { scenarios: ['tm.place.1', 'tm.place.2', 'tm.place.3', 'tm.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different suggested starting points (switch DRUM for the floor tom’s), and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'A suggested zone is a place to begin, measured from a named head — not a rule. Rim distance, height and aim are separate things to try, one mic can cover two toms, and clearance comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim a tom mic so its pattern’s rejection faces the crash above — and know what a pattern cannot do, and when cymbal in a tom mic is fine.',
    credit: { scenarios: ['tm.ctx.1', 'tm.ctx.2', 'tm.ctx.studio', 'tm.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the crash sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Pointing down at a tom puts a mic’s rear toward the cymbals; the actual pattern decides where it rejects most. Real nulls are shallow, cymbals are loud, and no mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Top and bottom',
    goal: 'See how a top and a bottom tom mic start out of step, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: ['tm.two.1', 'tm.two.2', 'tm.two.3', 'tm.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'A tom’s bottom mic hears its resonant head, not wires. Two mics on one drum start opposite when they face opposite heads; polarity flips the sign, it does not remove a delay. Check both states in mono — no setting is required.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — clearance, aim, the pattern, gain staging, levels and polarity — and the drums themselves, before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up tom mics in the right order, choose and justify a plan for two briefs (from no tom mics to three), and say what would justify a bottom mic.',
    credit: { scenarios: ['tm.prac.order', 'tm.prac.gain', 'tm.prac.setup1', 'tm.prac.setup2', 'tm.prac.3', 'tm.mix.1', 'tm.mix.2', 'tm.mix.3'], note: 'Put the setup in order, answer the gain check, complete both briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real kit.' },
    takeaway: 'Safe clearance, correct power and level checks, pattern reasoning and an accurate account of polarity versus delay pass. A brand, a drum’s name or a genre do not decide it — and more than one plan can pass.',
  },
};

/*
 * THE CHECKS. Reasoning, not recall; every wrong option a real misconception
 * of about the same length, with its own explanation. Lesson lines in
 * comments only: tm.snd.* L7, S-REC · tm.set.* L9-L13 · tm.mic.* L15-L18 ·
 * tm.place.* L23-L43 · tm.ctx.* L43, L55-L72 · tm.two.* L52-L54 ·
 * tm.prac.* / tm.mix.* L14, L44-L51, L89.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'tm.snd.1',
    page: 'sound',
    prompt: 'What does a tom’s bottom (resonant) head add to its sound?',
    options: ['Ring and low end, driven by the air inside', 'A buzz from wires stretched across it', 'Nothing, unless a stick strikes it from below too'],
    correct: 'Ring and low end, driven by the air inside',
    explain: 'The batter head squeezes the air, and the air drives the resonant head: together they ring as the body of the tom. A tom has no wires — that is a snare.',
    why: {
      'A buzz from wires stretched across it': 'That is a snare. A tom’s bottom head has no wires; it adds ring and low end.',
      'Nothing, unless a stick strikes it from below too': 'The air inside drives it on every stroke: the two heads are coupled.',
    },
  },
  {
    id: 'tm.snd.2',
    page: 'sound',
    prompt: 'Two toms are tuned at a similar tension. Which one rings lower?',
    options: ['The larger one, with the bigger head', 'The smaller one, because it is tighter', 'Neither: pitch depends only on the stick'],
    correct: 'The larger one, with the bigger head',
    explain: 'At a similar tension, a bigger head vibrates more slowly — which is why toms run from high to low, small to large, between the snare and the kick.',
    why: {
      'The smaller one, because it is tighter': 'At a similar tension, the smaller head vibrates faster: it rings higher.',
      'Neither: pitch depends only on the stick': 'The stick starts the sound; the head’s size and tension set its pitch.',
    },
  },
  {
    id: 'tm.snd.3',
    page: 'sound',
    prompt: 'The stick strikes the exact centre of a tom’s batter head. Which of its vibration shapes can it set moving?',
    options: ['Only the ring-shaped ones; the rest have a still line there', 'All of them equally, because the whole of the head is struck', 'Only the shapes that have a still line across the centre'],
    correct: 'Only the ring-shaped ones; the rest have a still line there',
    explain: 'A strike drives a shape only as much as the head moves at the strike point in that shape; off centre, more shapes join in.',
    why: {
      'All of them equally, because the whole of the head is struck': 'The stick touches one small spot. A shape is driven only as much as the head moves there.',
      'Only the shapes that have a still line across the centre': 'The reverse: a still line through the centre means the head does not move there.',
    },
  },
  micRatingCheck({ id: 'tm.set.1', page: 'setting', mic: 'tom mic', loudest: 'the hardest tom hit' }),
  {
    id: 'tm.set.2',
    page: 'setting',
    prompt: 'Where do a tom mic and its mount have to stay clear of, beyond the head itself?',
    options: ['The sticks’ path across every tom, and the cymbals’ swing', 'The front of the kick, so the audience can see its head', 'Only the tom it is aimed at — the others are not its business'],
    correct: 'The sticks’ path across every tom, and the cymbals’ swing',
    explain: 'Fills sweep the sticks across all the toms, and the cymbals above them swing when struck. A floor tom mic also keeps clear of the player’s leg and the legs of the drum.',
    why: {
      'The front of the kick, so the audience can see its head': 'How the kit looks is not the safety question: the sticks’ path and the cymbals are.',
      'Only the tom it is aimed at — the others are not its business': 'A fill crosses every tom: a mic over one tom can sit in the path to the next.',
    },
  },
  {
    id: 'tm.set.3',
    page: 'setting',
    prompt: 'On a typical right-handed kit, where is the floor tom?',
    options: ['On the player’s right, standing on its legs beside their leg', 'Over the kick, on a holder arm, right beside the small rack tom', 'On the player’s left, just behind the hi-hat'],
    correct: 'On the player’s right, standing on its legs beside their leg',
    explain: 'The floor tom stands on its own legs at the player’s right, low and close to their right leg — so a floor-tom mic and its cable keep clear of the leg and the drum’s legs.',
    why: {
      'Over the kick, on a holder arm, right beside the small rack tom': 'That is where the rack toms sit. The floor tom stands on its own legs.',
      'On the player’s left, just behind the hi-hat': 'The hi-hat and the snare are on the left. The floor tom is on the right.',
    },
  },
  {
    id: 'tm.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic above a tom, aimed at its batter head, hears more of which part of its sound?',
    options: ['The stick’s attack on the batter head', 'The ring leaving through the bottom head', 'The air leaking out between the lugs'],
    correct: 'The stick’s attack on the batter head',
    explain: 'The attack starts where the stick meets the batter head, so a mic above it tends to hear more of it; the bottom head carries more of the ring downward.',
    why: {
      'The ring leaving through the bottom head': 'That leaves downward, from the resonant head: a bottom mic hears more of it.',
      'The air leaking out between the lugs': 'The shell is closed; the heads move the air. Above, it is the batter head’s attack.',
    },
  },
  {
    id: 'tm.mic.1',
    page: 'microphone',
    prompt: 'One mic is to cover two rack toms. What kind of pattern suits it?',
    options: ['A wider one, so both toms are picked up evenly', 'The tightest available, so it hears only one tom', 'Whichever pattern, because both toms are equally loud'],
    correct: 'A wider one, so both toms are picked up evenly',
    explain: 'Tight patterns help isolate one tom; a mic covering two wants a wider pattern so both toms come through at useful levels — at the cost of more surrounding sound.',
    why: {
      'The tightest available, so it hears only one tom': 'A tight pattern would favour one tom. Covering two calls for a wider one.',
      'Whichever pattern, because both toms are equally loud': 'The pattern sets how evenly the two are heard, whatever their level.',
    },
  },
  {
    id: 'tm.mic.2',
    page: 'microphone',
    prompt: 'A friend says condensers always pick up more cymbal than dynamics on toms. What is a better way to think about it?',
    options: ['Spill depends on the mic’s pattern, aim and distance', 'They are right: condensers hear more of the cymbals above', 'They are wrong: condensers hear no cymbal at all'],
    correct: 'Spill depends on the mic’s pattern, aim and distance',
    explain: 'Bleed depends on the angle, the distance, the actual pattern, its response off axis and how loud the cymbals are — not on the transducer type alone.',
    why: {
      'They are right: condensers hear more of the cymbals above': 'Some may, some may not: spill depends on pattern, aim, distance and the mic itself.',
      'They are wrong: condensers hear no cymbal at all': 'Every mic hears some cymbal; how much depends on its pattern and where it points.',
    },
  },
  {
    id: 'tm.mic.3',
    page: 'microphone',
    prompt: 'Should the floor tom get a different mic from the rack toms because it is the floor tom?',
    options: ['Choose by what it needs — low end, room to mount — not its name', 'Yes: floor toms need a condenser; the rack toms need a dynamic mic', 'No: all the toms on a kit use the same mic, whatever happens'],
    correct: 'Choose by what it needs — low end, room to mount — not its name',
    explain: 'A lower tom may suit a mic with good low-frequency response and room to place it — but nothing makes one model compulsory for a “floor tom”.',
    why: {
      'Yes: floor toms need a condenser; the rack toms need a dynamic mic': 'No drum name sets the transducer. Choose by the drum’s needs and the mount.',
      'No: all the toms on a kit use the same mic, whatever happens': 'Matching mics can be tidy, but a lower tom may be served by a different choice.',
    },
  },
  {
    id: 'tm.mic.4',
    page: 'microphone',
    prompt: 'The only spare input has no phantom power. Which of this page’s mic types can you use on a tom?',
    options: ['The three dynamics: none of them needs power', 'The rim condenser, as long as it is clamped on', 'All of them, provided the cable run is short'],
    correct: 'The three dynamics: none of them needs power',
    explain: 'Dynamic mics need no power. The rim condenser needs phantom power, wherever it is mounted.',
    why: {
      'The rim condenser, as long as it is clamped on': 'How it is mounted does not change what it needs: this condenser needs phantom power.',
      'All of them, provided the cable run is short': 'Cable length does not power a condenser. Only the dynamics work without phantom.',
    },
  },
  {
    id: 'tm.place.1',
    page: 'placement',
    prompt: 'A rack tom is tilted toward the player. A starting point says 2.5–7.5 cm above the head. How do you measure it?',
    options: ['Square to the tilted head, from its surface', 'Straight up from the floor to the mic', 'From the top of the kick drum underneath it'],
    correct: 'Square to the tilted head, from its surface',
    explain: '“Above the head” means away from the head’s surface, along its straight-on line. On a tilted tom that is not straight up.',
    why: {
      'Straight up from the floor to the mic': 'The floor is not the reference. Measure from the head, square to it.',
      'From the top of the kick drum underneath it': 'The kick is a neighbour, not the reference: measure from the tom’s own head.',
    },
  },
  {
    id: 'tm.place.2',
    page: 'placement',
    prompt: 'You swing the mic’s aim from the rim toward the centre of the head. What tends to change?',
    options: ['More low end and body; less of the rim’s higher-pitched attack', 'Only the level drops; the tone stays exactly the same', 'A fixed amount of bass boost that you can read off a chart'],
    correct: 'More low end and body; less of the rim’s higher-pitched attack',
    explain: 'Pointing toward the rim tends to bring a higher-pitched attack; toward the centre a fuller low end. “Attack” here is that higher-pitched edge near the rim, not the stick’s strike itself. Tendencies, checked on the drum.',
    why: {
      'Only the level drops; the tone stays exactly the same': 'Aim changes the balance too — attack toward the rim, body toward the centre.',
      'A fixed amount of bass boost that you can read off a chart': 'These are tendencies, not fixed amounts. Drums vary — check it on this drum.',
    },
  },
  {
    id: 'tm.place.3',
    page: 'placement',
    prompt: 'You use one mic between the two rack toms. What can you no longer do later?',
    options: ['Change the balance of the two toms on a fader', 'Hear either tom at all through that channel', 'Use that channel with the overheads in the mix'],
    correct: 'Change the balance of the two toms on a fader',
    explain: 'A shared mic keeps one combined perspective: the balance between the two toms is set by where the mic sits, not by a fader. With a mic on each tom instead, the two mics are on different sources — where 3:1 applies: 3:1 can reduce interacting pickup between mics on different sources (each mic at least three times nearer its own tom than the other mic is).',
    why: {
      'Hear either tom at all through that channel': 'Both toms come through the shared mic — that is its point.',
      'Use that channel with the overheads in the mix': 'It mixes with the overheads like any tom channel. What it cannot do is balance the two toms separately.',
    },
  },
  {
    id: 'tm.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · A floor-tom mic’s stand and cable: what else must they keep clear of?',
    options: ['The player’s right leg and the floor tom’s own legs', 'The front of the kick, so its front head stays in view', 'The hi-hat pedal, across the kit on the left'],
    correct: 'The player’s right leg and the floor tom’s own legs',
    explain: 'The floor tom stands beside the player’s right leg, on its own legs: a mic, stand and cable keep clear of both, as well as the sticks.',
    why: {
      'The front of the kick, so its front head stays in view': 'How the kit looks is not the question. The leg and the drum’s legs are.',
      'The hi-hat pedal, across the kit on the left': 'That is the other side of the kit. Beside the floor tom it is the player’s leg.',
    },
  },
  {
    id: 'tm.ctx.1',
    page: 'context',
    prompt: 'A rack-tom mic hears a lot of the crash above it. What is a good first move to try?',
    options: ['Turn the mic so the crash falls in its rejection', 'Turn the tom channel up so the tom drum covers it', 'Raise the mic closer to the cymbal’s edge'],
    correct: 'Turn the mic so the crash falls in its rejection',
    explain: 'Aim the pattern’s rejection at the crash, by the actual pattern, while the mic still faces the tom and stays clear of the sticks. Then decide how much cymbal belongs in the kit sound.',
    why: {
      'Turn the tom channel up so the tom drum covers it': 'More gain raises the crash in that channel too. Aim first.',
      'Raise the mic closer to the cymbal’s edge': 'That brings more cymbal, and the cymbal swings — keep clear of it.',
    },
  },
  {
    id: 'tm.ctx.2',
    page: 'context',
    prompt: 'A supercardioid points down at a tom. Where should the crash above sit for the most rejection?',
    options: ['Toward the mic’s rear, off to one side of its axis', 'Directly on its rear axis, straight behind the mic', 'Square to its front, level with its sides'],
    correct: 'Toward the mic’s rear, off to one side of its axis',
    explain: 'A supercardioid rejects most off the rear axis (near 125°); straight behind it has a small rear lobe. Aim by the actual pattern.',
    why: {
      'Directly on its rear axis, straight behind the mic': 'That is a cardioid’s deepest rejection. A supercardioid has a small rear lobe there.',
      'Square to its front, level with its sides': 'At 90° the pickup is still fair; the rejection deepens toward the rear, off the axis.',
    },
  },
  {
    id: 'tm.ctx.studio',
    page: 'context',
    prompt: 'Studio session, good room, overheads up and sounding full. What could justify no tom mics at all?',
    options: ['The overheads already carry the toms clearly and in balance', 'Tom mics are a live-sound tool, not a studio one', 'Close tom mics would add far more spill than the overheads do'],
    correct: 'The overheads already carry the toms clearly and in balance',
    explain: 'If the kit image already gives the tom passages clarity and balance, tom channels may add nothing — and fewer open mics are simpler.',
    why: {
      'Tom mics are a live-sound tool, not a studio one': 'Tom mics are used in studios too; the question is what the overheads already give.',
      'Close tom mics would add far more spill than the overheads do': 'Close tom mics usually hear more tom relative to the rest; the question is whether they add anything.',
    },
  },
  {
    id: 'tm.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Why does a mic pointed down at a rack tom often face its rear toward the cymbals?',
    options: ['The cymbals hang above the toms, behind a downward mic', 'The cymbals are mounted on the same holder as the toms', 'The cymbals sit below the toms, in front of the mic'],
    correct: 'The cymbals hang above the toms, behind a downward mic',
    explain: 'Rack toms usually sit under crash or ride cymbals: a mic aimed down at the head has its rear pointing up toward them.',
    why: {
      'The cymbals are mounted on the same holder as the toms': 'They stand on their own boom stands; what matters is that they hang above.',
      'The cymbals sit below the toms, in front of the mic': 'Cymbals hang above the drums, not below them.',
    },
  },
  {
    id: 'tm.two.1',
    page: 'twoMic',
    prompt: 'A top and a bottom mic on a floor tom: why might they start out of step?',
    options: ['The heads move the same way: one mic hears a push, one a pull', 'The bottom mic is farther from the stick, and that inverts it', 'The legs of the drum invert the sound under it'],
    correct: 'The heads move the same way: one mic hears a push, one a pull',
    explain: 'As the batter head moves down, away from the top mic, the bottom head moves down, toward the bottom mic. Distance adds a delay on top — a separate thing.',
    why: {
      'The bottom mic is farther from the stick, and that inverts it': 'Distance delays a sound; it does not flip its sign.',
      'The legs of the drum invert the sound under it': 'The legs hold the drum up; the opposite start comes from the two heads.',
    },
  },
  {
    id: 'tm.two.2',
    page: 'twoMic',
    prompt: 'You flip the bottom mic’s polarity. What happens to the arrival-time difference?',
    options: ['Nothing: polarity flips the sign; the delay stays the same', 'It drops to zero, so both of the arrivals now line up again', 'Cut in half: the flipped copy cancels half of it'],
    correct: 'Nothing: polarity flips the sign; the delay stays the same',
    explain: 'Polarity reverses the sign; it does not remove a delay caused by sound reaching the mics at different times.',
    why: {
      'It drops to zero, so both of the arrivals now line up again': 'Flipping polarity changes the sign, not when the sound arrives.',
      'Cut in half: the flipped copy cancels half of it': 'Polarity has no time in it. Only moving a mic changes when the sound arrives.',
    },
  },
  {
    id: 'tm.two.3',
    page: 'twoMic',
    prompt: 'A floor tom has a top mic and a bottom mic, facing each other across the drum. Is flipping the bottom mic a sensible first thing to try?',
    options: ['Yes — they start opposite; then compare both states by ear', 'No — a tom’s bottom mic stays at normal polarity, unlike a snare’s', 'Yes — and from then on it is the correct setting for this tom'],
    correct: 'Yes — they start opposite; then compare both states by ear',
    explain: `${OPPOSITE_SIDES_POLARITY} Judge it with the overheads up — and reposition or leave out a mic if neither state serves the kit.`,
    why: {
      'No — a tom’s bottom mic stays at normal polarity, unlike a snare’s': 'A tom’s heads move together just like a snare’s, so the pair starts opposite. Nothing fixes the setting either way — check both states.',
      'Yes — and from then on it is the correct setting for this tom': 'Flipping is where to start, never a rule: the delay between the mics can make either state the better one. Check both by ear.',
    },
  },
  {
    id: 'tm.two.4',
    page: 'twoMic',
    prompt: 'A close tom mic sounds thin once the overheads are up. What do you check first?',
    options: ['Levels and both polarity states in mono, then position', 'Boost the tom’s low end until it sounds full again', 'Mute the overheads, since they are causing the problem'],
    correct: 'Levels and both polarity states in mono, then position',
    explain: 'The overheads hear the same stroke later and from another angle. Compare the combination in mono at matched levels before reaching for EQ — no switch cures every case.',
    why: {
      'Boost the tom’s low end until it sounds full again': 'EQ cannot undo a cancellation between mics. Check the combination first.',
      'Mute the overheads, since they are causing the problem': 'The overheads are part of the kit sound. Check how the two combine.',
    },
  },
  {
    id: 'tm.prac.gain',
    page: 'practice',
    prompt: 'Typical tom strokes sit well below the overload light, but the drummer’s hardest fills light it. What do you do?',
    options: ['Lower the input gain, or use a pad its manual allows, and re-check', 'Pull the channel fader down until the fills sound clean', 'Ask the drummer to play the hardest fills more softly during the show'],
    correct: 'Lower the input gain, or use a pad its manual allows, and re-check',
    explain: 'Set input gain with headroom for the strongest intended strokes and watch the overload indicator. A lowered fader does not undo clipping at the input.',
    why: {
      'Pull the channel fader down until the fills sound clean': 'The overload happens at the input, before the fader. A lower fader only makes the clipped sound quieter.',
      'Ask the drummer to play the hardest fills more softly during the show': 'Set gain for the strongest strokes the player intends to play.',
    },
  },
  {
    id: 'tm.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a bottom mic on the floor tom?',
    options: ['The top mic works alone, the pair adds ring, it holds in mono', 'Toms on a professional kit have a bottom mic as standard practice', 'The floor tom needs more level than one mic can give'],
    correct: 'The top mic works alone, the pair adds ring, it holds in mono',
    explain: 'A bottom mic blends the resonant head’s perspective. If the pair loses body or turns uneven, adjust position, level and polarity — or leave it out.',
    why: {
      'Toms on a professional kit have a bottom mic as standard practice': 'No standard requires it. A second mic should earn its place in the kit sound.',
      'The floor tom needs more level than one mic can give': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'tm.mix.1',
    page: 'practice',
    prompt: 'A starting point says “2.5–7.5 cm above the drum heads”. What else do you need before placing the mic?',
    options: ['Which head, measured square to it, and where to aim', 'The make of the tom, so the number matches its size', 'Nothing more: the number places the mic exactly'],
    correct: 'Which head, measured square to it, and where to aim',
    explain: 'A distance belongs to its named head — on a tilted tom, square to it — and the starting point also says to aim at the head. Clearance is a separate check again.',
    why: {
      'The make of the tom, so the number matches its size': 'A starting point’s distance belongs to its head; the make does not change that.',
      'Nothing more: the number places the mic exactly': 'A distance needs its reference head and an aim; clearance comes on top.',
    },
  },
  {
    id: 'tm.mix.2',
    page: 'practice',
    prompt: 'The crash sits about 125° off a supercardioid tom mic’s axis. What can you expect?',
    options: ['Strong rejection on paper; in reality less, and often least in the lows', 'Silence from the crash, because it sits in the null', 'More crash than straight behind it, which is where it rejects most'],
    correct: 'Strong rejection on paper; in reality less, and often least in the lows',
    explain: 'A null is infinitely deep only on paper. Real mics reject far less there — and a crash is loud. Use the null to aim, not to promise silence.',
    why: {
      'Silence from the crash, because it sits in the null': 'A null is infinitely deep only on paper. Real mics reject far less.',
      'More crash than straight behind it, which is where it rejects most': 'Straight behind, a supercardioid has a small rear lobe; its deepest rejection is off the rear axis.',
    },
  },
  {
    id: 'tm.mix.3',
    page: 'practice',
    prompt: 'Top and bottom floor-tom mics sound thin together. Which change removes the arrival-time difference itself?',
    options: ['Moving a mic so the two paths are closer to equal', 'Flipping the polarity switch on the bottom mic', 'Turning the bottom mic up until it matches the top'],
    correct: 'Moving a mic so the two paths are closer to equal',
    explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth; neither removes the delay.',
    why: {
      'Flipping the polarity switch on the bottom mic': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
      'Turning the bottom mic up until it matches the top': 'Level changes the depth of the notches, not where they are.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'tm.sym.contact',
    observation: 'A mic, mount or cable can be struck or snagged',
    firstChecks: 'Stop playing; move or remount and reroute. Recheck the entire fill and cymbal path.',
    options: ['Stop the drummer, remount and reroute; recheck the whole fill', 'Keep playing carefully, and move it after the song has finished', 'Tape the cable to the hoop so that it cannot move about'],
    correct: 'Stop the drummer, remount and reroute; recheck the whole fill',
    explain: 'Clearance comes first: stop before any mic moves, then check every fill across the toms and every cymbal swing.',
    why: {
      'Keep playing carefully, and move it after the song has finished': 'Clearance comes first: stop now, before a stick or a cymbal finds it.',
      'Tape the cable to the hoop so that it cannot move about': 'Hoops are struck. Route and secure the cable away from the sticks and the pedals.',
    },
  },
  {
    id: 'tm.sym.spill',
    observation: 'Excessive cymbal or snare spill in a tom channel',
    firstChecks: 'Check safe mic height, aim, actual pattern and neighbouring source levels; decide whether some spill belongs in the kit sound.',
    options: ['Height, aim and the actual pattern — then how much is fine', 'Turn the tom channel up until the tom covers the spill', 'Swap to a condenser, which hears less of the cymbals'],
    correct: 'Height, aim and the actual pattern — then how much is fine',
    explain: 'Aim the rejection by the actual pattern from a safe position, and decide how much cymbal belongs in the kit sound.',
    why: {
      'Turn the tom channel up until the tom covers the spill': 'More gain raises the spill in that channel too. Aim first.',
      'Swap to a condenser, which hears less of the cymbals': 'Spill depends on pattern, aim and distance, not on the transducer type.',
    },
  },
  {
    id: 'tm.sym.shared',
    observation: 'Two toms on one mic are unequal',
    firstChecks: 'Inspect drum positions, mic axis and pattern, the source dynamics, and whether independent channels are needed.',
    options: ['The mic’s position, axis and pattern — or give each its own mic', 'Turn the shared channel up until the quieter tom is loud enough', 'Ask the drummer to play the louder tom more softly all night'],
    correct: 'The mic’s position, axis and pattern — or give each its own mic',
    explain: 'One mic’s balance is set by where it sits and points, and by its pattern. If the balance cannot be found, independent channels may be needed.',
    why: {
      'Turn the shared channel up until the quieter tom is loud enough': 'Gain raises both toms together; it cannot change their balance.',
      'Ask the drummer to play the louder tom more softly all night': 'Set the mic for the playing, not the playing for the mic.',
    },
  },
  {
    id: 'tm.sym.thin',
    observation: 'A close tom becomes thin with the overheads',
    firstChecks: 'Compare levels and polarity settings in mono, then position and arrival times; do not assume a switch solves all cancellation.',
    options: ['Levels and both polarity states in mono, then position and timing', 'Boost the low end on the tom channel first, before doing anything else', 'Mute the overheads, since they are causing the problem'],
    correct: 'Levels and both polarity states in mono, then position and timing',
    explain: 'Two mics hearing one stroke at different times can cancel. Compare in mono at matched levels; no switch cures every case.',
    why: {
      'Boost the low end on the tom channel first, before doing anything else': 'EQ cannot undo a cancellation between mics.',
      'Mute the overheads, since they are causing the problem': 'The overheads are part of the kit sound. Check how they combine.',
    },
  },
  {
    id: 'tm.sym.ring',
    observation: 'A ring or buzz exists before any reinforcement',
    firstChecks: 'Ask the player to inspect tuning, head, damping, and hardware; avoid treating mic placement as a mechanical fix.',
    options: ['Ask the player to check tuning, heads, damping and hardware', 'Move the mic closer to hear where the ring comes from', 'Cut the ringing frequency on the tom channel first'],
    correct: 'Ask the player to check tuning, heads, damping and hardware',
    explain: 'A mic cannot repair a drum. A ring or buzz that is there unamplified belongs to the player and the drum (the Drum Tuning Lab covers tuning).',
    why: {
      'Move the mic closer to hear where the ring comes from': 'The ring is in the drum or its hardware. Find it at the source, with the player.',
      'Cut the ringing frequency on the tom channel first': 'EQ hides the symptom. Fix the source first.',
    },
  },
  {
    id: 'tm.sym.dist',
    observation: 'A hard stroke distorts',
    firstChecks: 'Check mic and input headroom, physical contact and hardware noise, then model specifications and gain.',
    options: ['Where it starts — mic, input or rattling hardware — then gain', 'Pull the channel fader down until the hits sound cleaner', 'Cut the low end with EQ so the channel has more headroom'],
    correct: 'Where it starts — mic, input or rattling hardware — then gain',
    explain: 'A lowered fader does not undo clipping at the input, and EQ after an overloaded mic cannot restore it. Find where it starts.',
    why: {
      'Pull the channel fader down until the hits sound cleaner': 'The fader comes after the input; a clipped input stays clipped.',
      'Cut the low end with EQ so the channel has more headroom': 'EQ after the input cannot undo clipping at the input.',
    },
  },
];

/** The setup procedure (L44-L51), with L14's power and gain rules. */
const orderTasks: OrderTask[] = [
  {
    id: 'tm.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a tom setup in the order you would do them.',
    steps: [
      { text: 'Hear the full kit and the tom passages; decide what the overheads are missing', early: 'Start with what the kit already gives.' },
      { text: 'Choose a plan: overhead-led, one mic per tom, or a shared mic', early: 'Choose the plan once you know what is missing.' },
      { text: 'Have the drummer stop; mount each mic clear of every stick and cymbal path', early: 'You need a plan before you can mount the mics.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom where it is needed', early: 'Power comes after the mics are mounted and connected — with the outputs muted first.' },
      { text: 'Set input gain on typical AND strongest strokes, with headroom', early: 'Gain is set once the mics are connected and powered.' },
      { text: 'Compare distance, rim position and angle one at a time; then the toms with the overheads in mono', early: 'Compare only once levels are set safely — at matched levels.' },
      { text: 'Secure cables and mounts; recheck the full motion with the drummer playing', early: 'Secure it last, then watch the whole fill again.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before connecting, disconnecting or switching it, and follow your own equipment’s manual. Gain: set it with headroom for the hardest fills.',
  },
];

const POWER_REASON: SetupReason = { id: 'r.power', label: 'Each channel gives its mic the power it needs (phantom, or none)', role: 'required', feedback: 'Say how each mic is powered: the condensers here need phantom; a dynamic needs none.' };
const DOC_REASON: SetupReason = { id: 'r.doc', label: 'Each mic starts at a suggested starting point, from its own head', role: 'required', feedback: 'Say why each position is a good place to begin, and which head it is measured from.' };
const CLEAR_REASON: SetupReason = { id: 'r.clear', label: 'Mics, mounts and cables stay out of the sticks’ path and the cymbals’ swing', role: 'required', feedback: 'Clearance is part of every passing setup.' };
const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand of tom mic most engineers use', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' };
const NAME_REASON: SetupReason = { id: 'r.name', label: 'A floor tom needs a different kind of mic because it is a floor tom', role: 'wrong', feedback: 'A drum’s name does not decide the mic. Its sound, its place and the mount do.' };

/** The final task (L89): several plans pass; the reasons are graded. */
const setupTasks: SetupTask[] = [
  {
    id: 'tm.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A loud rock stage. Crashes hang low over the rack toms. Three spare channels; phantom power is available on all of them.',
    setups: [
      { id: 'a', label: 'A supercardioid dynamic over each tom, 2.5 to 7.5 cm above its head, aimed at it, the crash off its rear axis', ok: true, power: 'none', feedback: 'Three suggested starting points, tight patterns for isolation, rejection turned toward the crash.' },
      { id: 'b', label: 'A clip-on dynamic on each tom’s rim, 3 to 5 cm above the head, angled 30 to 60°', ok: true, power: 'none', feedback: 'Suggested starting points, low and out of the cymbals’ way — with clamps that suit the hoops.' },
      { id: 'c', label: 'A rim condenser on each tom, its head angled at the drumhead, phantom on', ok: true, power: 'phantom', feedback: 'A suggested starting point with the power it needs — check how much crash it hears.' },
      { id: 'd', label: 'One mic raised up level with the crashes, to catch all three toms at once', ok: false, power: 'none', feedback: 'Up among the cymbals it hears mostly cymbal — and the cymbals swing. Stay close over the toms.' },
      { id: 'e', label: 'A mic resting on each head, so nothing can move', ok: false, power: 'none', feedback: 'Never on the head: it is a moving part, and the sticks land there.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.iso', label: 'Close, tight patterns help against the loud crashes and the stage', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, NAME_REASON],
    explain: 'More than one plan passes this brief. What passes is the reasoning: sensible starting points from each head, clearance from the sticks and cymbals, and power that matches each mic.',
  },
  {
    id: 'tm.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A studio jazz trio in a good room. The overheads sound full. ONE spare channel, with NO phantom power.',
    setups: [
      { id: 'a', label: 'No tom mics: the overheads already carry the toms clearly', ok: true, power: 'none', feedback: 'A fair plan when the overheads carry the toms — fewer open mics, nothing to power.' },
      { id: 'b', label: 'One dynamic between the two rack toms, 2.5 to 7.5 cm above them, the floor tom left to the overheads', ok: true, power: 'none', feedback: 'A suggested shared position, powered by what this input can supply.' },
      { id: 'c', label: 'A rim condenser on the floor tom for detail', ok: false, power: 'phantom', feedback: 'A fair position — but this input has no phantom power, and this condenser needs it.' },
      { id: 'd', label: 'Three tom mics, one per drum, on the one spare channel', ok: false, power: 'none', feedback: 'Three mics need three channels. One channel means none, or a shared mic.' },
      { id: 'e', label: 'Remove the floor tom’s bottom head so a mic can go inside', ok: false, power: 'none', feedback: 'That changes the drum. Never take a head off to suit a mic plan — it is the player’s call.' },
    ],
    reasons: [{ ...DOC_REASON, label: 'The plan starts from what the overheads give, and any mic from a suggested starting point' }, CLEAR_REASON, POWER_REASON, { id: 'r.room', label: 'In a good room, the overheads and the room are part of the kit sound', role: 'optional', feedback: 'A fair studio reason.' }, BRAND_REASON, NAME_REASON],
    explain: 'Two plans pass: no tom mics, or one shared mic. What passes is the reasoning: start from the overheads, keep clear, and power what this input can supply.',
  },
];

/** One ungraded prediction before each rack activity (try before tell). */
const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: when the stick pushes a tom’s batter head down, what does its bottom head do?', options: ['It moves down too, pushed by the air', 'It moves up, toward the batter head', 'It stays still — only the struck head moves'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch both heads.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you swing the mic’s aim from the rim toward the centre of the head. What changes?', options: ['More attack', 'More low end and body', 'It depends on this drum'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The crash hangs above the tom mic. Where will this supercardioid reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION.' },
  twoMic: { prompt: 'If you flip the bottom mic’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

/* THE QUICK CHECK (LESSON_JOURNEY §2.5): two per foundation; q.6 critical. */
const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What is under a tom’s bottom head that a snare has and a tom does not?',
    options: ['Nothing: a tom has no snare wires under it', 'Wires, just like a snare’s, but looser', 'A strainer that turns the low end on and off'],
    correct: 'Nothing: a tom has no snare wires under it',
    explain: 'A tom has a batter head and a resonant head, with no wire assembly: its bottom head adds ring, not buzz.',
    why: {
      'Wires, just like a snare’s, but looser': 'Wires belong to the snare. A tom’s bottom head has none.',
      'A strainer that turns the low end on and off': 'A strainer moves a snare’s wires. A tom has no wires and no strainer.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What holds the rack toms up on a typical kit?',
    options: ['A holder standing on the kick, with an arm to each tom', 'Their own three legs, each standing on the floor below', 'Straps hanging down from the cymbal stands above them'],
    correct: 'A holder standing on the kick, with an arm to each tom',
    explain: 'The rack toms ride on a holder mounted on the kick (or a stand); the floor tom stands on its own legs.',
    why: {
      'Their own three legs, each standing on the floor below': 'That is the floor tom. The rack toms ride on a holder.',
      'Straps hanging down from the cymbal stands above them': 'Cymbal stands carry cymbals. The toms ride on a holder.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'Two toms at a similar tension: which rings lower?',
    options: ['The bigger one', 'The smaller one', 'The one struck harder'],
    correct: 'The bigger one',
    explain: 'At a similar tension, a bigger head vibrates more slowly: toms run high to low, small to large.',
    why: {
      'The smaller one': 'At a similar tension, a smaller head vibrates faster: higher.',
      'The one struck harder': 'A harder stroke is louder; size and tension set the pitch.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'The stick pushes a tom’s batter head in. What does the air inside do to the bottom head?',
    options: ['Pushes it outward, away from the batter', 'Pulls it inward, toward the batter', 'Nothing — the air escapes through the shell'],
    correct: 'Pushes it outward, away from the batter',
    explain: 'The batter head squeezes the air, and the air pushes the bottom head out: the heads are coupled through the air.',
    why: {
      'Pulls it inward, toward the batter': 'Squeezed air pushes, it does not pull: the bottom head moves outward.',
      'Nothing — the air escapes through the shell': 'The shell is closed. The air pushes the bottom head outward.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'What must a rack-tom mic and its mount stay clear of?',
    options: ['The sticks’ path across the toms, and the crash above', 'The kick’s front head, so the audience can still see it', 'The floor tom’s space on the far side of the kit'],
    correct: 'The sticks’ path across the toms, and the crash above',
    explain: 'Fills sweep across all the toms, and the crashes above swing when struck.',
    why: {
      'The kick’s front head, so the audience can still see it': 'How the kit looks is not the safety question.',
      'The floor tom’s space on the far side of the kit': 'Neighbours matter, but the sticks and the cymbals above are what move.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: 'Your tom mic is rated to a very high maximum SPL. What does that tell you about standing by the kit through a long soundcheck?',
    options: ['Nothing — that is the mic’s distortion limit, not a hearing limit', 'It is safe for a while, as long as the toms stay below the mic’s rating', 'It is safe as long as the mic is nearer the drum than you'],
    correct: 'Nothing — that is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'It is safe for a while, as long as the toms stay below the mic’s rating': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      'It is safe as long as the mic is nearer the drum than you': 'Where the mic sits says nothing about your ears. Measure where the person listens.',
    },
  },
];

const wedges: Wedge[] = [
  {
    id: 'crash1',
    label: 'the 16 in crash, above and beside the 10 in tom',
    short: 'CRASH',
    p: KIT_CYMBALS.crash1.c,
    lift: 0,
    faces: { x: 0, y: 1, z: 0 },
    note: 'It hangs above the 10 in tom, toward the hi-hat side — the case a pattern’s rejection can help with.',
    prov: { kind: 'illustrative', reason: 'the shared 5-piece kit (kit/GEOMETRY_PROPOSAL.md §2)' },
    glyph: 'none',
  },
  {
    id: 'fill',
    label: 'the drummer’s own fill, on the floor beside the throne',
    short: 'DRUM FILL',
    p: { x: -450, y: KIT_FLOOR_Y, z: 750 },
    lift: 150,
    faces: { x: -0.2, y: 0, z: -1 },
    note: 'It sits on the drummer’s side of the kit, below and behind the toms: a mic pointed down at a tom faces partly toward it, and no null reaches it.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout (the kick lesson’s same monitor); no source gives the position' },
  },
  {
    id: 'downstage',
    label: 'a floor wedge for another player, downstage of the drums, facing upstage',
    short: 'DOWNSTAGE',
    p: { x: 457.2 + 900, y: KIT_FLOOR_Y, z: -450 },
    lift: 150,
    faces: { x: -1, y: 0, z: 0 },
    note: 'Out on the audience side, facing back at the kit.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout (the kick lesson’s same monitor); no source gives the position' },
  },
];

export const M03_LESSON: Lesson = {
  id: 'M03',
  labId: 'drums',
  title: 'Rack and Floor Toms',
  subtitle: 'One mic each, one for two, or none — under the cymbals',
  noun: { one: 'tom', many: 'toms' },
  model: TOMS_MODEL,
  micTypeIds: ['tomDynSuper', 'smallDynCard', 'clipDynCard', 'rimCondenser'],
  zones: TOM_ZONES,
  setupPairs: [{ label: 'One mic on each rack tom', A: { zone: 'tom2.top' }, B: { zone: 'tom1.top' }, variants: ['rack'] }],
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT THEY ARE', text: 'Toms are the kit’s drums tuned from high to low: two rack toms on a holder over the kick, and a floor tom standing on its own legs at the player’s right. Each has a batter head on top, struck with sticks, and a resonant head below — no wires.', src: 'S-REC' },
    { title: 'WHERE YOU MEET THEM', text: 'In most drum kits, on stage and in the studio — though some styles leave them to the overhead mics. This lesson covers studio recording and live sound.', src: 'DPA-TOMS' },
    { title: 'WHAT THEY DO IN THE MUSIC', text: 'Fills and accents, tuned from high to low between the snare and the kick. Ask the player: should the toms blend into a natural kit picture, or stand out with their own channels?', src: 'S-REC' },
    { title: 'THEIR SIZES', text: 'A common 5-piece kit pairs a 10 × 7 in and a 12 × 8 in rack tom with a 16 in floor tom (16 × 16 in here; some are 15 in deep). This lab draws that kit.', src: 'YMH-TC' },
  ],
  sound: {
    stages: [
      { title: 'The stick strikes', text: 'The tip of the stick strikes the batter head. That brief contact is where the ATTACK begins.' },
      { title: 'The batter head is pushed in', text: 'The head bows into the drum — most at the centre, not at all at the hoop: its lowest vibration shape, drawn many times larger than it really moves.' },
      {
        title: 'The air pushes the bottom head',
        text: 'The batter head squeezes the air inside, and the air pushes the bottom (resonant) head out. The two heads are coupled through the air.',
        byVariant: { open: 'With the bottom head off, the squeezed air has nothing to push: it leaves straight out of the open end. The drum rings differently — and a mic can go inside.' },
      },
      {
        title: 'Sound leaves the drum',
        text: 'Sound leaves from both heads — the batter head upward, toward the player and a top mic; the bottom head downward. The heads, the air and the shell ringing together are the BODY: often a clear pitch, lower on a bigger tom.',
        byVariant: { open: 'Sound leaves from the batter head upward and from the open end downward. With one head, the body is shorter and the drum sounds different — a choice for the player.' },
      },
    ],
    attack: 'The start of the sound: the stick’s brief contact with the batter head. It begins at the strike, so a mic above the batter head and aimed at it tends to hear more of it — and pointed toward the rim, more of a higher-pitched attack.',
    body: 'The ring: both heads, the air inside and the shell ringing together after the stroke — often a clear pitch, lower on a bigger drum. Pointed toward the centre, a mic tends to hear more of the low end. Both are tendencies, and drums vary. Tuning and damping change how long a tom rings — the Drum Tuning Lab covers that.',
    head: { diameterMm: 12 * 25.4, rods: 6, label: '12 in batter head, seen from above', strikeSrc: 'LESSON', hoop: 'metal' },
  },
  setting: {
    items: [
      { id: 'toms', label: 'the toms (rack pair and floor tom)', short: 'TOMS', note: 'Ringed in amber: the 10 in and 12 in rack toms over the kick, and the 16 in floor tom at the player’s right. The drums this lesson mics.', prov: { kind: 'sourced', src: 'YMH-TC', quote: 'TMT-1007, TMT-1208; TAMA 16"x16" Floor Tom' }, tag: 'THE DRUMS', scene: 'all', planIds: ['tom2', 'tom1', 'floor'] },
      { id: 'cymbals', label: 'crash and ride cymbals', short: 'CYMBALS', note: 'A crash over each rack tom and the ride over the floor tom: the loudest neighbours a tom mic hears — and they swing when struck, so mics keep clear of them.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'SPILL', scene: 'kit', planIds: ['crash2', 'crash1', 'ride'] },
      { id: 'kick', label: 'kick drum (and the tom holder on it)', short: 'KICK', note: 'The rack toms’ holder stands on the kick’s shell. A boom reaching over the rack toms passes above the kick — and the holder takes room there.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'BOOM PATH', scene: 'kit', planIds: ['kick', 'pedal'] },
      { id: 'throne', label: 'drum throne (the player’s seat)', short: 'THRONE', note: 'The player sits behind the kit; fills sweep the sticks across every tom, and the right leg sits right beside the floor tom.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'snare', label: 'snare and hi-hat', short: 'SNARE · HI-HAT', note: 'Across the kit on the player’s left: loud neighbours a rack-tom mic can hear.', prov: { kind: 'illustrative', reason: 'the shared 5-piece kit' }, tag: 'SPILL', scene: 'kit', planIds: ['snare', 'hihat'] },
      { id: 'fill', label: 'the drummer’s fill (monitor)', short: 'DRUM FILL', note: 'A floor monitor beside the throne so the drummer can hear the band — loud, close to the floor tom.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'downstage', label: 'a downstage wedge (another player’s monitor)', short: 'WEDGE', note: 'Out on the audience side, facing back toward the stage.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Live, the audience already hears the acoustic toms; the PA adds what the room needs.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a studio there are no wedges on the floor; the overheads and the room may already carry the toms.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors feed the players, the PA faces the audience, and the cymbals are loud. Stage spill and the gain available before feedback push toward close, aimed pickup — with as few open mics as the music needs.',
    studio: 'STUDIO: no wedges on the floor, repeated trials are practical when the drummer stops, and the overheads or the room may already carry the toms.',
  },
  diagnostic,
  practice: {
    task: 'Choose a tom plan — none, one shared mic, or one per tom — for a given kit and performance, place each mic safely, and explain what would justify a bottom mic. With a real kit and the drummer’s agreement, you can record what you tried below.',
    fields: [
      { id: 'drum', label: 'Tom (size, heads, how mounted)', kind: 'text' },
      { id: 'plan', label: 'Plan', kind: 'choice', choices: ['no tom mics', 'shared mic', 'one per tom', 'with a bottom mic'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['dynamic, supercardioid', 'small dynamic, cardioid', 'clip-on dynamic', 'condenser', 'other'] },
      { id: 'pattern', label: 'Pattern', kind: 'text' },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, from which head', kind: 'text' },
      { id: 'aim', label: 'Aim (rim or centre), and where the cymbals sit off it', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The rack toms’ heights (850 mm), their tilt (15°) and the holder; the floor tom’s height (620 mm) and legs — drawing defaults, so no HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'Head motion clearances and the cymbals’ swing keep-outs — ILLUSTRATIVE values for the owner to approve.', dims: ['tom2.batter', 'tom2.reso', 'tom1.batter', 'tom1.reso', 'floor.batter', 'floor.reso', 'crash1', 'crash2', 'ride'] },
    { text: 'The rack toms’ rod count (drawn 6; the maker’s table is not usable), every rod phase, the hoop height and the lug size — drawing defaults.', dims: [] },
    { text: 'The sticks’ envelope over each tom (the drummer-facing half, 40 cm up) and the player’s right leg beside the floor tom — drawn illustratively.', dims: [] },
    { text: 'The bottom-mic distance (3–8 cm) and where inside a head-off floor tom a mic sits — the sources give positions only.', dims: [] },
    { text: 'The supercardioid drum dynamic’s outline (not published), the condenser head’s length and a clamp’s reach.', dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. Every drum, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a typical 5-piece kit’s toms and cymbals, mic patterns and the two-mic comb as textbook shapes, and head motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the drummer stopped.',
  copy: TOMS_COPY,
};
