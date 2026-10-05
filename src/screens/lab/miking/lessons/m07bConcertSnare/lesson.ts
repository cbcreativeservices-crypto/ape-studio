/**
 * M07b CONCERT SNARE — the lesson's pages as DATA (blueprint §7). The words
 * come from the owner's lesson (docs/labs/miking/source_text/Concert-Snare-
 * Miking-Technique-Research.txt, "L<n>" in COMMENTS only) with the fixes in
 * docs/labs/miking/CORRECTIONS_LOG.md (CS-xx) applied.
 *
 * OWNER RULING 2026-10-04: suggested starting points, never dogma; no source,
 * brand or model in learner text; no badges. FULLY SILENT. The research
 * record lives in docs/labs/miking/concert_snare/ and the code-only fields.
 */
import type { DiagnosticItem, Lesson, MikingScenario, PageContent, PageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, cardioidNull, CLEAR_REASON, contactSymptom, distortionSymptom, firstNotch, gainCheck, hearingCheck, louderIsNotBetter, monoSymptom, moveRemovesDelay, polarityKeepsDelay, POWER_REASON, quickHearing, setupOrder, type Words } from '../shared/concert/commonItems.ts';
import { CSN_MODEL } from './geometry.ts';
import { CSN_DIMS, CSN_ZONES, D, FLOOR_Y } from './model.ts';
import { CSN_COPY } from './copy.ts';

const W: Words = { p: 'cs', the: 'the concert snare', player: 'percussionist', loudest: 'the loudest accent' };

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the concert snare',
    goal: 'Get to know the concert snare — what it is, where you meet it, what it does in the music, and its parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The sticks strike the batter head on top; the snares lie against the thin head underneath, and the throw-off puts them on or off. Work with the drum as the player brings it.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a stroke becomes sound — the stick, both heads, the air, the snares — and where the sound leaves the drum. Shown, never played.',
    credit: { scenarios: ['cs.snd.1', 'cs.snd.2', 'cs.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'Attack starts where the stick meets the batter head, on top. The body — both heads, the air and the snares’ buzz — leaves from both heads, the buzz mostly downward. A mic hears more of whichever it is closer to and faces: a tendency, and drums vary.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the concert snare sits in the orchestra — its neighbours, the player’s space, what an amplified stage and a recording add — and what to do before any mic.',
    credit: { scenarios: ['cs.set.1', 'cs.set.hear', 'cs.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Listen to what the main pickup already gives before adding a spot. The sticks’ whole motion, the throw-off and the path to the trap table are the player’s; protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for this drum by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['cs.mic.1', 'cs.mic.2', 'cs.mic.3', 'cs.mic.4', 'cs.rec.1'], note: 'Answer the five checks (one reaches back to how the snare sounds).' },
    takeaway: 'Dynamic or condenser can both work: response, pattern, maximum level, power and mount decide. A real pattern rejects only part of a neighbour, and a mic’s maximum SPL is not a hearing limit.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — measured from the rim or head it names, angled at the head, outside the sticks’ reach — then move the mic and see what changes.',
    credit: { scenarios: ['cs.place.1', 'cs.place.2', 'cs.place.3', 'cs.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'A recommended zone is a place to begin, measured from a named rim or head — not a rule, and not a safety clearance. Distance, height and angle are separate things to try, and the player’s whole motion comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s real rejection faces a loud unwanted source — and know when a concert snare needs no spot at all.',
    credit: { scenarios: ['cs.ctx.1', 'cs.ctx.2', 'cs.ctx.studio', 'cs.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the downstage wedge sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'A cardioid rejects most directly behind; a supercardioid rejects most off the rear axis. Real nulls are shallower than the picture. Live or recorded, “no spot” can be the right choice.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See how the arrival-time difference between two mics places comb-filter notches — and what polarity does and does not change, top and bottom.',
    credit: { scenarios: ['cs.two.1', 'cs.two.2', 'cs.two.3', 'cs.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Polarity flips the sign; it does not remove a delay. Top and bottom mics face heads that move the same way, so try both polarity states — in mono, at matched levels — and keep the bottom mic only if it earns its channel.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — distance, level against the main pickup, clearance, gain staging and polarity — before reaching for tone controls or asking the player to change.',
  },
  practice: {
    title: 'Practice',
    goal: 'Add one spot in the right order, choose and justify a setup for two different briefs, and say what would justify a bottom mic.',
    credit: { scenarios: ['cs.prac.order', 'cs.prac.gain', 'cs.prac.setup1', 'cs.prac.setup2', 'cs.prac.3', 'cs.mix.1', 'cs.mix.2', 'cs.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'A justified main-only or one-spot choice, safe clearance through the whole passage, headroom for the loudest accent and an honest mono check pass. A brand or a fixed recipe does not — and more than one setup can pass.',
  },
};

/* THE CHECKS. Lesson refs in comments only: cs.snd.* L8, L35-36 · cs.set.* L11-12,
 * L58-59 · cs.mic.* L37 · cs.place.* L20-35 · cs.ctx.* L11, L39-53 · cs.two.* L54-56 ·
 * cs.prac.* / cs.mix.* L59-67. */
const scenarios: MikingScenario[] = [
  {
    id: 'cs.snd.1',
    page: 'sound',
    prompt: 'With the snares on, where does the snare drum’s buzz come from?',
    options: ['The bottom head throws the snares off, and they slap back', 'The batter head rattles against the top rim with each stroke', 'The shell vibrates hardest where the snares are fixed to it'],
    correct: 'The bottom head throws the snares off, and they slap back',
    explain: 'Each stroke squeezes the air inside, which pushes the thin bottom head out against the snares; they are thrown off and slap back. With the snares off, the buzz is gone and the drum rings like a small tom.',
    why: {
      'The batter head rattles against the top rim with each stroke': 'The batter head is held tight by the rim. The buzz is the snares against the bottom head.',
      'The shell vibrates hardest where the snares are fixed to it': 'The snares are fixed at the throw-off and the butt plate, but they buzz where they touch the bottom head.',
    },
  },
  {
    id: 'cs.snd.2',
    page: 'sound',
    prompt: 'The stick strikes the exact centre of the head. Which of the head’s vibration shapes can it set moving?',
    options: ['Only the ring-shaped ones; the rest have a still line there', 'All of them equally, because the whole of the head is struck', 'Only the shapes that have a still line across the centre'],
    correct: 'Only the ring-shaped ones; the rest have a still line there',
    explain: 'A strike sets a shape moving in proportion to how much the head moves at the strike point in that shape. Every shape with a still line across the head is still at the centre, so a centre strike drives only the ring-shaped ones.',
    why: {
      'All of them equally, because the whole of the head is struck': 'The stick touches one small spot. A shape is driven only as much as the head moves at that spot — not at all on a still line.',
      'Only the shapes that have a still line across the centre': 'The reverse: a still line through the centre means the head does not move there in that shape, so a centre strike cannot push it.',
    },
  },
  {
    id: 'cs.snd.3',
    page: 'sound',
    prompt: 'One mic sits just above the rim, another under the drum. Which tends to hear more of the snares’ buzz?',
    options: ['The one under the drum, nearer the snares', 'The one above, since the stick starts each sound', 'Neither: the buzz leaves only through the shell'],
    correct: 'The one under the drum, nearer the snares',
    explain: 'The snares buzz against the bottom head, and that sound leaves mostly downward and out to the sides — so a mic underneath tends to hear more of it. A tendency, and drums vary.',
    why: {
      'The one above, since the stick starts each sound': 'The stick starts the stroke, but the buzz happens under the drum; the top mic hears more attack.',
      'Neither: the buzz leaves only through the shell': 'The bottom head and the snares radiate directly; the shell is not the main path.',
    },
  },
  {
    id: 'cs.set.1',
    page: 'setting',
    prompt: 'Before adding a spot to an orchestra’s concert snare, what do you listen to first?',
    options: ['The main pickup and section mics, with the real passage', 'The drum on its own, close and soloed, at a high level', 'Nothing yet: a concert snare in an orchestra needs its spot'],
    correct: 'The main pickup and section mics, with the real passage',
    explain: 'Other mics may already carry the snare — even an amplified orchestra has left it without a spot. Hear the passage through the main pickup first, and add a spot only for what is missing.',
    why: {
      'The drum on its own, close and soloed, at a high level': 'Soloed and close tells you least about the orchestra. Start with the main pickup, at the intended level.',
      'Nothing yet: a concert snare in an orchestra needs its spot': 'Not necessarily: the main pickup and the section mics can carry it. A spot is an option, not a default.',
    },
  },
  hearingCheck(W, 'setting'),
  {
    id: 'cs.set.2',
    page: 'setting',
    prompt: 'You need a stand for a concert-snare mic. What must its base, boom and cable stay out of?',
    options: ['The sticks’ widest motion, the throw-off and the player’s path', 'The front of the drum, so the audience can see the batter head', 'The cymbal stand nearby, so the mic hears less of the cymbal'],
    correct: 'The sticks’ widest motion, the throw-off and the player’s path',
    explain: 'The player’s space moves: the highest and widest strokes, the reach for the throw-off and the turn to the trap table. Route stands and cables clear of it, and stop the player before anything moves.',
    why: {
      'The front of the drum, so the audience can see the batter head': 'How the drum looks is not the safety question. The space to protect is the player’s: sticks, throw-off, path.',
      'The cymbal stand nearby, so the mic hears less of the cymbal': 'Spill matters, but the base and cable must first stay out of the player’s space.',
    },
  },
  {
    id: 'cs.mic.1',
    page: 'microphone',
    prompt: 'Dynamic or condenser for a concert-snare spot?',
    options: ['Either can work: choose by response, pattern, level and mount', 'A condenser, as the only type that can hear a soft roll', 'A dynamic, as condensers cannot take a snare’s accents'],
    correct: 'Either can work: choose by response, pattern, level and mount',
    explain: 'Suitable dynamics and condensers both capture snare. Blanket rules about types are too broad: compare the specified response, pattern, maximum level, power and mount — and listen.',
    why: {
      'A condenser, as the only type that can hear a soft roll': 'A suitable dynamic can capture a soft roll too. Compare the real mics at matched level.',
      'A dynamic, as condensers cannot take a snare’s accents': 'Many condensers handle a snare’s level; check the specified maximum level of the actual mic and preamp.',
    },
  },
  {
    id: 'cs.mic.2',
    page: 'microphone',
    prompt: 'A spec sheet lists a very high maximum SPL for a mic. What does that tell you?',
    options: ['When that mic distorts, under its maker’s test conditions', 'How loud it is safe for the player to play beside it', 'That it will sound better on accents than other mics'],
    correct: 'When that mic distorts, under its maker’s test conditions',
    explain: 'Maximum SPL is the mic’s distortion limit, measured under each maker’s own conditions — not a hearing limit, and not a tone.',
    why: {
      'How loud it is safe for the player to play beside it': 'A mic rating says nothing about people’s hearing; that is a separate guideline, measured where they listen.',
      'That it will sound better on accents than other mics': 'A higher limit means it distorts later, not that it sounds better.',
    },
  },
  {
    id: 'cs.mic.3',
    page: 'microphone',
    prompt: 'The channel you are given has no phantom power. Which of this page’s mics can you still use?',
    options: ['The small dynamic: it needs no power to work', 'The small condenser, if it stays well back from the drum', 'Either one, as long as the channel gain is turned up'],
    correct: 'The small dynamic: it needs no power to work',
    explain: 'Dynamic mics need no power. The small condenser needs phantom power wherever it is placed.',
    why: {
      'The small condenser, if it stays well back from the drum': 'Distance does not change what a condenser needs: it still needs phantom power.',
      'Either one, as long as the channel gain is turned up': 'Gain cannot power a condenser. It needs phantom power from the desk.',
    },
  },
  {
    id: 'cs.mic.4',
    page: 'microphone',
    prompt: 'A cardioid spot is aimed at the snare. Why does it still hear the cymbal beside it?',
    options: ['Real patterns reject only partly, and differently at each pitch', 'A cardioid picks up equally well from all around, front and back', 'The cymbal is louder than the mic’s maximum rating'],
    correct: 'Real patterns reject only partly, and differently at each pitch',
    explain: 'A directional pattern reduces some spill; it cannot remove everything off-axis, and how much it rejects depends on the real pattern and the frequency.',
    why: {
      'A cardioid picks up equally well from all around, front and back': 'That is an omni. A cardioid rejects most behind — but only partly, and less at some pitches.',
      'The cymbal is louder than the mic’s maximum rating': 'Spill is not overload: the mic hears the cymbal because no pattern rejects completely.',
    },
  },
  {
    id: 'cs.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic just outside the rim, close to the batter head, hears more of which part of the sound?',
    options: ['The stick’s attack on the head', 'The snares’ buzz under the drum', 'The hall around the orchestra'],
    correct: 'The stick’s attack on the head',
    explain: 'Attack starts where the stick meets the batter head, so a close top mic tends to hear more of it — and less of the room. A tendency; drums vary.',
    why: {
      'The snares’ buzz under the drum': 'The buzz leaves mostly downward, from the bottom head: a mic under the drum hears more of it.',
      'The hall around the orchestra': 'Close to the head, the drum is much louder than the hall: a close mic hears less room.',
    },
  },
  {
    id: 'cs.place.1',
    page: 'placement',
    prompt: 'A starting point says 2.5 to 7.5 cm above the rim. Your readout says 5 cm below the snare-side head. Are you in it?',
    options: ['No — the number only counts from the rim it names', 'Yes — 5 cm falls inside the 2.5 to 7.5 cm band', 'Yes, as long as the mic is angled at the drum'],
    correct: 'No — the number only counts from the rim it names',
    explain: 'A distance only means something with its reference — which is why every readout here names the rim or head it is measured from.',
    why: {
      'Yes — 5 cm falls inside the 2.5 to 7.5 cm band': 'Same number, wrong reference: 5 cm under the drum is a different position from 5 cm above the rim.',
      'Yes, as long as the mic is angled at the drum': 'Aim is a separate variable. The distance is measured from the rim the starting point names.',
    },
  },
  {
    id: 'cs.place.2',
    page: 'placement',
    prompt: 'You move the mic from just outside the rim to a broader spot above and to one side. What should you expect?',
    options: ['More of the whole drum and the room, as a tendency to check', 'A steady loss of the highs with each centimetre that you move it', 'A fixed drop in level that you can read off a chart'],
    correct: 'More of the whole drum and the room, as a tendency to check',
    explain: 'Farther usually brings more of the whole drum, the room and the neighbours, and less isolation — a tendency to check with the real passage.',
    why: {
      'A steady loss of the highs with each centimetre that you move it': 'Distance does not cut the highs in steady steps; the balance of drum, room and neighbours shifts.',
      'A fixed drop in level that you can read off a chart': 'These are tendencies, not fixed amounts. Drums, rooms and players vary — check it.',
    },
  },
  {
    id: 'cs.place.3',
    page: 'placement',
    prompt: 'Your close spot makes the roll sound like separate clicks. What is a sensible first change?',
    options: ['Back the mic off safely, or blend it lower under the main pickup', 'Ask the player to roll with more bounce, just for the mic', 'Add a bottom mic so that it fills the roll back in'],
    correct: 'Back the mic off safely, or blend it lower under the main pickup',
    explain: 'A very close or loud spot can exaggerate each stroke. Rebalance toward the main pickup or move back safely — and ask the player what the roll should sound like before suggesting any change to the drum.',
    why: {
      'Ask the player to roll with more bounce, just for the mic': 'The roll is the player’s music. Change the mic, not the technique.',
      'Add a bottom mic so that it fills the roll back in': 'Another channel adds spill and another arrival time; the close spot is the thing to adjust first.',
    },
  },
  {
    id: 'cs.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · You move the stand to reach a new zone. What must the stand and cable stay clear of?',
    options: ['The sticks’ reach, the throw-off and the player’s path', 'The front of the drum, so that the audience can still see it', 'The bass drum, so that the mic hears less of it'],
    correct: 'The sticks’ reach, the throw-off and the player’s path',
    explain: 'The player’s space moves all the time. Stop the player, move the stand, and route the cable away from the sticks, the throw-off and the path to the trap table.',
    why: {
      'The front of the drum, so that the audience can still see it': 'How it looks is not the safety question; the player’s space is.',
      'The bass drum, so that the mic hears less of it': 'Spill matters, but the stand and cable must first stay out of the player’s space.',
    },
  },
  {
    id: 'cs.ctx.1',
    page: 'context',
    prompt: 'On an amplified stage, what can favour a closer, directional concert-snare spot?',
    options: ['Monitor and PA spill, and the gain available before feedback', 'A closer mic makes the snare itself louder in the hall', 'The hall’s sound is usually more useful on a loud stage'],
    correct: 'Monitor and PA spill, and the gain available before feedback',
    explain: 'Those are the usual live reasons — worked out with the system operator. In a quiet hall, a broader spot or no spot may serve the music better.',
    why: {
      'A closer mic makes the snare itself louder in the hall': 'A mic does not change how loud the drum is; it changes what the channel hears.',
      'The hall’s sound is usually more useful on a loud stage': 'That is the recording case: a broader pickup helps when the hall adds something useful.',
    },
  },
  {
    id: 'cs.ctx.2',
    page: 'context',
    prompt: 'A downstage wedge sits behind and below a supercardioid aimed down at the snare. Is straight behind its best rejection?',
    options: ['No — its deepest rejection is off the rear axis', 'Yes — a directional mic rejects most at its back', 'Yes, as long as the mic is close to the drum'],
    correct: 'No — its deepest rejection is off the rear axis',
    explain: 'A supercardioid has a small rear lobe; its deepest rejection is toward the rear but off the axis. Aim nulls by the actual pattern.',
    why: {
      'Yes — a directional mic rejects most at its back': 'Only a cardioid rejects most directly behind. A supercardioid has a small rear lobe.',
      'Yes, as long as the mic is close to the drum': 'Distance does not move a pattern’s nulls; aim and pattern do.',
    },
  },
  {
    id: 'cs.ctx.studio',
    page: 'context',
    prompt: 'Recording in a good hall, no wedges. What could justify leaving the concert snare without a spot?',
    options: ['The main pickup already carries its rolls and accents', 'A spot would hear more of the snare than the main pair does', 'Spots are meant for live concerts rather than recordings'],
    correct: 'The main pickup already carries its rolls and accents',
    explain: 'If the main array and section mics already convey the roll shape, the soft strokes and the accents, a spot adds spill and image problems for nothing.',
    why: {
      'A spot would hear more of the snare than the main pair does': 'It would — that is its point. The question is whether anything is missing.',
      'Spots are meant for live concerts rather than recordings': 'Recordings use spots too, blended under the main pickup when detail is missing.',
    },
  },
  {
    id: 'cs.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · A mic under the drum, aimed up at the snares, hears more of what?',
    options: ['The snares’ buzz from the bottom head', 'The stick’s attack on the batter head', 'The hall, because the drum shields it'],
    correct: 'The snares’ buzz from the bottom head',
    explain: 'The buzz leaves mostly downward from the bottom head and the snares. A bottom mic also hears the stand, the throw-off and the floor.',
    why: {
      'The stick’s attack on the batter head': 'The attack starts on top; a top mic hears more of it.',
      'The hall, because the drum shields it': 'Close to the bottom head, the drum is far louder than the hall.',
    },
  },
  polarityKeepsDelay(W),
  firstNotch(W),
  {
    id: 'cs.two.3',
    page: 'twoMic',
    prompt: 'Top and bottom mics on the concert snare sound thin together. What is a sensible check?',
    options: ['Compare both polarity states in mono, at matched level', 'Invert the bottom mic and leave it: that setting is a rule', 'Raise the bottom mic until the sum sounds full again'],
    correct: 'Compare both polarity states in mono, at matched level',
    explain: 'The two heads move the same way, so the mics often start opposite — but the arrival times and the positions matter too. Compare both states; do not mark one as always right.',
    why: {
      'Invert the bottom mic and leave it: that setting is a rule': 'Inverting the bottom mic is a common thing to TRY; it is not a rule. Compare both states.',
      'Raise the bottom mic until the sum sounds full again': 'More level does not fix a cancellation; it can make the thin sum louder.',
    },
  },
  louderIsNotBetter(W),
  gainCheck(W),
  {
    id: 'cs.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a bottom mic to the concert snare?',
    options: ['It adds needed snare detail, works alone, and holds up in mono', 'Two channels give the mix engineer much more to work with later on', 'The snare needs more level than a single mic can give it'],
    correct: 'It adds needed snare detail, works alone, and holds up in mono',
    explain: 'A second mic should earn its channel: something the top mic and the main pickup lack, a sound that works alone, and a sum that holds up in mono. Otherwise leave it out.',
    why: {
      'Two channels give the mix engineer much more to work with later on': 'More channels also add spill, hiss and arrival times. A second mic has to earn its place.',
      'The snare needs more level than a single mic can give it': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'cs.mix.1',
    page: 'practice',
    prompt: 'A starting point says “about 10 cm (4 in)”. Before you place the mic, what else do you need?',
    options: ['What it is measured from, and how the mic should be angled', 'The brand of the drum, so the number matches its size', 'Nothing more: the number already tells you exactly where it goes'],
    correct: 'What it is measured from, and how the mic should be angled',
    explain: 'A distance belongs to its reference (the rim, a head), and a starting point may name an angle (“toward the centre”). Clearance is a separate check again.',
    why: {
      'The brand of the drum, so the number matches its size': 'A starting point’s distance belongs to its reference; the drum’s brand does not change that.',
      'Nothing more: the number already tells you exactly where it goes': 'A distance means nothing without its reference; aim and clearance are separate checks.',
    },
  },
  cardioidNull(W),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  {
    id: 'cs.s.roll',
    observation: 'The roll sounds like disconnected stick clicks',
    firstChecks: 'Is the spot too close or too loud against the main pickup? Is the roll itself what the music intends?',
    options: ['The spot’s distance and level against the main pickup', 'Ask the player to press the roll harder into the head', 'Add a second mic underneath to fill the roll in'],
    correct: 'The spot’s distance and level against the main pickup',
    explain: 'Rebalance toward the main pickup or back the mic off safely; ask the player what the roll should sound like before suggesting any change to it.',
    why: {
      'Ask the player to press the roll harder into the head': 'The roll is the player’s music. Change the mic’s distance or level first.',
      'Add a second mic underneath to fill the roll in': 'Another channel adds spill and timing problems; the close spot is the first thing to adjust.',
    },
  },
  {
    id: 'cs.s.rattle',
    observation: 'Too much snare rattle',
    firstChecks: 'The bottom mic’s level and aim — or the snares buzzing in sympathy with other instruments; check the snares with the player.',
    options: ['The bottom mic’s level and aim, then the snares with the player', 'Tighten the snares yourself until the rattle goes away completely', 'Gate the top mic so it opens only on the strokes'],
    correct: 'The bottom mic’s level and aim, then the snares with the player',
    explain: 'Reduce or remove the bottom mic first. Snares can also buzz when other instruments play — the player decides whether and how to change them.',
    why: {
      'Tighten the snares yourself until the rattle goes away completely': 'The snares are the player’s instrument: never adjust them yourself. Ask.',
      'Gate the top mic so it opens only on the strokes': 'A gate can chop soft rolls and decays. Find where the rattle comes from first.',
    },
  },
  {
    id: 'cs.s.front',
    observation: 'The snare sounds unnaturally in front of the orchestra',
    firstChecks: 'The spot’s level and distance against the main pickup.',
    options: ['Lower the spot, or choose a broader position', 'Raise the main pair until it matches the spot', 'Pan the spot hard to one side to separate it'],
    correct: 'Lower the spot, or choose a broader position',
    explain: 'A spot raised too far, or placed very close, pulls the drum forward in the image. Blend it under the main pickup and judge the whole score.',
    why: {
      'Raise the main pair until it matches the spot': 'That raises the whole orchestra; the spot is still too far forward against it.',
      'Pan the spot hard to one side to separate it': 'Panning moves it sideways; it is still too close and too loud in depth.',
    },
  },
  distortionSymptom(W),
  monoSymptom(W),
  contactSymptom(W),
];

const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point, measured from the rim or head it names', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };
const LOUD_REASON: SetupReason = { id: 'r.loud', label: 'It will make the snare the loudest thing in the orchestra', role: 'wrong', feedback: 'A spot is blended to serve the music, not to win.' };

const setupTasks: SetupTask[] = [
  {
    id: 'cs.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A symphony recording in a good hall. In a quiet passage the snare roll gets lost; a main pair is already up. One spot channel; phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser above and to one side, aimed across the head, blended low under the main pair', ok: true, power: 'phantom', feedback: 'A broader spot keeps the drum in its place in the orchestra; it needs the phantom power this channel has.' },
      { id: 'b', label: 'Small dynamic about 10 cm from the drum, angled toward the centre, blended low', ok: true, power: 'none', feedback: 'A recommended starting point that hears the whole drum; blend it under the main pair.' },
      { id: 'c', label: 'Small condenser clamped to the rim, without asking the player', ok: false, power: 'phantom', feedback: 'Nothing is clamped to the instrument without a compatible mount and the owner’s agreement.' },
      { id: 'd', label: 'A mic 3 cm over the middle of the head, where the sticks land', ok: false, power: 'none', feedback: 'That is in the sticks’ path. Stay outside the whole stick motion.' },
      { id: 'e', label: 'No spot: raise the main pair until the roll comes through', ok: false, power: 'none', feedback: 'The brief says the roll is lost in the main pickup; raising the whole pair does not single out the snare.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.blend', label: 'Blended under the main pair, it keeps the drum in its place', role: 'optional', feedback: 'A fair recording reason.' }, BRAND_REASON, LOUD_REASON],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point from its reference, clearance of the whole stick motion, power that matches the mic, and a gentle blend.',
  },
  {
    id: 'cs.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · An amplified outdoor concert. Monitors on stage; the PA operator needs a usable snare channel. The spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'Small dynamic just outside the rim, 2.5–7.5 cm above it, aimed across the head', ok: true, power: 'none', feedback: 'Close and directional for a loud stage; a dynamic needs no phantom.' },
      { id: 'b', label: 'Small dynamic about 10 cm from the drum, angled toward the centre', ok: true, power: 'none', feedback: 'A recommended starting point; a dynamic needs no phantom. Check its gain before feedback with the operator.' },
      { id: 'c', label: 'Small condenser above and to one side, well back from the drum', ok: false, power: 'phantom', feedback: 'This input has no phantom power, and a broad spot hears much more of a loud stage.' },
      { id: 'd', label: 'A dynamic resting on the edge of the batter head', ok: false, power: 'none', feedback: 'Keep the mic off the head: it is a moving part, and the sticks can hit it.' },
      { id: 'e', label: 'No spot: the open-air stage will carry the snare by itself', ok: false, power: 'none', feedback: 'The operator needs a channel; outdoors, the hall does not help, and spill and wind work against a distant pickup.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'Close, directional pickup helps against stage spill and feedback', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, LOUD_REASON],
    explain: 'Two close positions pass. What passes is the reasoning: a sensible starting point, clear of the sticks, and powered by what this input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: when the stick pushes the batter head down, what does the snare-side head do?', options: ['It moves down, away from the batter', 'It moves up, toward the batter', 'It stays still — only the struck head moves'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch both heads.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the mic from just outside the rim to a broader spot above and to one side. What changes?', options: ['More direct detail', 'More of the whole drum and the room', 'It depends on this drum and room'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'Where will a supercardioid reject the downstage wedge best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'cs.q.1',
    covers: 'instrument',
    prompt: 'Where are the snares on a concert snare drum?',
    options: ['Against the bottom (snare-side) head', 'Inside the shell, between the two heads', 'On top of the batter head, under the sticks'],
    correct: 'Against the bottom (snare-side) head',
    explain: 'The snares lie against the thin bottom head; the throw-off puts them on or off.',
    why: {
      'Inside the shell, between the two heads': 'They sit outside the drum, against the bottom head, held by the throw-off and the butt plate.',
      'On top of the batter head, under the sticks': 'The sticks strike the batter head on top; the snares are underneath.',
    },
  },
  {
    id: 'cs.q.2',
    covers: 'instrument',
    prompt: 'What does the throw-off lever do?',
    options: ['Puts the snares on or off the bottom head', 'Tightens the batter head to raise its pitch', 'Holds the drum firmly in the stand’s basket'],
    correct: 'Puts the snares on or off the bottom head',
    explain: 'The throw-off (strainer) engages or releases the snares — players switch during a piece, so keep its lever clear.',
    why: {
      'Tightens the batter head to raise its pitch': 'The tension rods tune the heads; the throw-off works the snares.',
      'Holds the drum firmly in the stand’s basket': 'The basket arms grip the bottom rim; the throw-off works the snares.',
    },
  },
  {
    id: 'cs.q.3',
    covers: 'sound',
    prompt: 'A stroke exactly at the centre of a drumhead drives which of its vibration shapes?',
    options: ['Only the ring-shaped ones — the rest are still there', 'All of the shapes, each one just as hard', 'Only the shapes that are split by a line through the centre'],
    correct: 'Only the ring-shaped ones — the rest are still there',
    explain: 'A strike drives a shape only as much as the head moves at the strike point in that shape; a shape with a still line through the centre does not move there.',
    why: {
      'All of the shapes, each one just as hard': 'The stick touches one spot. A shape is driven only as much as the head moves there.',
      'Only the shapes that are split by a line through the centre': 'The reverse: those shapes are still at the centre, so a centre strike cannot drive them.',
    },
  },
  {
    id: 'cs.q.4',
    covers: 'sound',
    prompt: 'The stick pushes the batter head into the drum. What does the air inside do to the snare-side head?',
    options: ['Pushes it out, away from the batter', 'Pulls it in, toward the batter', 'Nothing — the air escapes through the shell'],
    correct: 'Pushes it out, away from the batter',
    explain: 'The batter head squeezes the air inside, and the air pushes the bottom head out against the snares: the heads are coupled through the air.',
    why: {
      'Pulls it in, toward the batter': 'The batter head moving in squeezes the air; squeezed air pushes the bottom head outward.',
      'Nothing — the air escapes through the shell': 'The air is squeezed between the heads and pushes the bottom head out.',
    },
  },
  {
    id: 'cs.q.5',
    covers: 'setting',
    prompt: 'Before you add a spot to an orchestra’s concert snare, what comes first?',
    options: ['Hear the passage through the main pickup', 'Put a close mic on it in case it is needed', 'Ask the player to play louder for the mics'],
    correct: 'Hear the passage through the main pickup',
    explain: 'The main pickup and section mics may already carry the snare. Add a spot only for what is missing.',
    why: {
      'Put a close mic on it in case it is needed': 'A spot is an option, not a default: it adds spill and can pull the drum forward.',
      'Ask the player to play louder for the mics': 'The score sets the dynamics; the mics serve the music.',
    },
  },
  quickHearing(W),
];

export const M07B_LESSON: Lesson = {
  id: 'M07b',
  labId: 'drums',
  title: 'Concert Snare',
  subtitle: 'Orchestra and band snare: no spot, one spot, or a bottom mic',
  noun: { one: 'concert snare', many: 'concert snares' },
  model: CSN_MODEL,
  micTypeIds: ['smallDynCard', 'orchSdc'],
  zones: CSN_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    setupOrder(W, { text: 'Watch the whole passage with the player: soft rolls, accents, snare changes', early: 'Start with the player and the music.' }, { text: 'Listen to the main pickup and decide what, if anything, is missing', early: 'Hear what the main pickup gives before you add a mic.' }),
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A snare drum played in orchestras and concert bands: a batter head on top, a thin snare-side head underneath, and snares — strands of cable, wire or gut — against that bottom head. A throw-off lever puts them on or off.', src: 'YMH-CPCAT' },
    { title: 'WHERE YOU MEET IT', text: 'In the percussion section of an orchestra or concert band, on a stand at about waist height for a standing player — recorded in halls and studios, and sometimes amplified on stage.', src: 'LESSON-CSN' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Rolls that sustain like a held note, crisp rhythms, soft detail and loud accents — often in the same piece. The player’s sticks, snares and tuning shape that sound; the mic only captures it.', src: 'LESSON-CSN' },
    { title: 'ITS SIZE', text: 'Concert snares are often 14 in across and 5½ to 6½ in deep, with smaller drums too. This lab draws a 14 × 6½ in drum with ten tension rods per head and cable snares.', src: 'YMH-CPCAT' },
  ],
  sound: {
    stages: [
      { title: 'The stick strikes', text: 'A stick strikes the batter head. That brief contact is where the ATTACK — the start of each stroke — begins. A roll is many strokes so close together that they blend into one sustained sound.' },
      { title: 'The batter head is pushed in', text: 'The head bows down into the drum — most at the centre, not at all at the rim: its lowest vibration shape, drawn here much larger than it really moves. Then it springs back and rings.' },
      {
        title: 'The air pushes the snare-side head',
        text: 'The batter head squeezes the air inside, and the air pushes the thin bottom head outward — down, onto the snares. The snares are thrown off the head and slap back against it.',
        byVariant: { off: 'The batter head squeezes the air inside, and the air pushes the thin bottom head outward — down. With the snares off, nothing rests against it: the drum rings more like a small tom.' },
      },
      {
        title: 'Sound leaves the drum',
        text: 'Sound leaves from both heads: the batter head upward, the bottom head and the buzzing snares downward and out to the sides. The heads, the air, the shell and the snares together are the BODY of the sound.',
        byVariant: { off: 'Sound leaves from both heads: the batter head upward, the bottom head downward and out to the sides. The heads, the air and the shell together are the BODY of the sound — without the snares’ buzz.' },
      },
    ],
    attack: 'The start of each stroke: the stick’s brief contact with the batter head. It begins on top of the drum, so a mic near the batter head, outside the sticks’ reach, tends to hear more of it.',
    body: 'Everything that rings after: both heads, the air inside, the shell and — snares on — their buzz against the bottom head, which leaves mostly downward and out to the sides. A mic under the drum tends to hear more of the snares; a mic farther away hears the whole drum and more of the room. Both are tendencies, and drums vary. Cable or gut snares tend toward a more articulate sound, wire snares toward a more resonant wash — the player’s choice.',
    head: { diameterMm: 14 * 25.4, rods: 10, label: '14 in batter head, seen from above', strikeSrc: 'LESSON-CSN', hoop: 'metal' },
  },
  setting: {
    items: [
      { id: 'snare', label: 'the concert snare (on its stand)', short: 'SNARE', note: 'In the percussion row at the back of the orchestra, on a stand, its player behind it facing the conductor. The drawing every page of this lesson uses.', prov: { kind: 'illustrative', reason: 'a typical concert layout; no source gives positions' }, tag: 'THE DRUM', scene: 'all' },
      { id: 'bassDrum', label: 'the concert bass drum', short: 'BASS DRUM', note: 'A loud neighbour beside the snare. A snare spot hears it too — one reason to keep a spot close and aimed, or to blend it low.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'timpani', label: 'the timpani', short: 'TIMPANI', note: 'Loud and low, a few metres along the row. A snare mic hears them — and the timpani spot hears the snare.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'cymbal', label: 'a suspended cymbal', short: 'CYMBAL', note: 'Bright and loud, close to the snare. A directional spot rejects only part of it.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'table', label: 'the trap table', short: 'TABLE', note: 'Where the sticks, mallets and small instruments wait. The player turns to it between passages: keep stands and cables out of that path.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'KEEP CLEAR', scene: 'kit' },
      { id: 'brass', label: 'the brass row in front', short: 'BRASS', note: 'Trombones and tuba just downstage of the percussion, bells toward the conductor. Loud, and heard by every percussion mic.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'downstage', label: 'a floor wedge downstage of the percussion', short: 'WEDGE', note: 'On the audience side of the drum, facing back toward the percussion. A loud source a spot can turn its rejection toward.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'fill', label: 'the percussion section’s own monitor', short: 'SECTION MON.', note: 'Behind the players, facing them. A spot aimed at the drum faces it — no pattern rejects it there; the drum itself lies in the way.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'conductor', label: 'the conductor', short: 'CONDUCTOR', note: 'At the front, facing the orchestra. The player needs a clear sightline to the conductor: no stand or boom across it.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SIGHTLINE', scene: 'stage' },
      { id: 'pa', label: 'the PA', short: 'PA', note: 'At the front corners, facing the audience. Live, it adds to what the audience already hears from the stage; every open mic also hears it.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'FEEDBACK PATH', scene: 'stage' },
      { id: 'main', label: 'the main pair over the conductor', short: 'MAIN PAIR', note: 'Two mics on a tall stand, hearing the whole orchestra — the snare included. Recording, this is the picture a snare spot is blended into.', prov: { kind: 'illustrative', reason: 'a typical recording layout' }, tag: 'MAIN PICKUP', scene: 'studio' },
      { id: 'hall', label: 'the hall', short: 'THE HALL', note: 'In a good hall, the room is part of the orchestra’s sound — one reason a spot is blended low, or left out.', prov: { kind: 'illustrative', reason: 'a generic hall; no source gives its size' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: an amplified orchestra — monitors on stage, the PA facing the audience. Monitor and PA spill and the gain before feedback can push toward a closer, directional spot, worked out with the system operator.',
    studio: 'RECORDING: the main pair and section mics carry the orchestra, the hall is part of the sound, and there are no monitors. A snare spot is blended under them only if detail is missing.',
  },
  diagnostic,
  practice: {
    task: 'Choose a main-only or one-spot setup for a given passage and setting, describe an alternative, and explain what would justify a bottom mic. With a real drum and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'drum', label: 'Drum (size, snares, heads)', kind: 'text' },
      { id: 'snares', label: 'Snares', kind: 'choice', choices: ['on', 'off', 'both in the passage'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small dynamic', 'small condenser', 'no spot (main pickup)', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, from which rim or head', kind: 'text' },
      { id: 'blend', label: 'How it sat under the main pickup', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  // INTERNAL record (never shown): the unknowns; `dims` names the placeholders.
  unknowns: [
    { text: 'The batter height on a concert stand for a standing player — drawn at a drawing default (800 mm), so no height readout is shown.', dims: ['yFloor'] },
    { text: 'The concert snare’s shell thickness, hoop height and skirt, lug size, rod phase, snare-set size and strainer side — drawing defaults in the shared concert spec.', dims: [] },
    { text: 'The stand’s legs and basket, the sticks’ reach (450 mm above the head on the player’s side) and the player’s position — ILLUSTRATIVE.', dims: [] },
    { text: 'No source gives a concert-snare mic distance: the close zones borrow the kit-snare figures; the broad zone has no number at all.', dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: {
    wedges: [
      {
        id: 'downstage',
        label: 'a floor wedge downstage of the percussion, facing back toward it',
        short: 'DOWNSTAGE',
        p: { x: 1500, y: FLOOR_Y, z: -400 },
        lift: 150,
        faces: { x: -1, y: 0, z: 0 },
        note: 'It sits on the audience side, behind and below a spot angled down at the drum — the case a pattern’s null can help with.',
        prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
      },
      {
        id: 'fill',
        label: 'the percussion section’s own monitor, behind the players, facing them',
        short: 'SECTION MON.',
        p: { x: -1100, y: FLOOR_Y, z: 0 },
        lift: 150,
        faces: { x: 1, y: 0, z: 0 },
        note: 'It sits behind the player, in FRONT of a spot aimed at the drum: no pattern null reaches it. The drum itself — its shell and heads — lies in the path.',
        prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
      },
    ],
  },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. A concert snare may need no spot at all; when it does, every drum, player and hall is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a 14 × 6½ in concert snare, mic patterns and the two-mic comb as textbook shapes, and head motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.',
  copy: CSN_COPY,
};

/** Re-exported for the model test. */
export const CSN_FACTS = { D, stickH: CSN_DIMS.stickH.mm };
