/**
 * M12 TONBAK — the lesson as DATA. Words from the owner's lesson
 * (docs/labs/miking/source_text/Tonbak-Miking-Technique.txt; "L<n>" in
 * comments only), research in docs/labs/miking/tonbak/, corrections in
 * CORRECTIONS_LOG.md (TB-01 …). Owner ruling 2026-10-04: suggested starting
 * points, no sources, brands or badges on screen. FULLY SILENT.
 *
 * Every tonbak position is the lesson's own trial; there is no published
 * tonbak miking standard (the lesson says so). On screen they are simply
 * recommended starting points, with the honest note that every player and
 * drum differ.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, LessonPages, PageContent, SourcePageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { OPPOSITE_SIDES_POLARITY, micRatingCheck } from '../../engine/model/sharedItems.ts';
import { TONBAK_MODEL, TONBAK_ZONES } from './geometry.ts';
import { T_R } from './model.ts';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the tonbak',
    goal: 'Get to know the tonbak — what it is, where you meet it, what it does in the music, and its parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A single skin head on a goblet-shaped body, open at the bottom, played with the fingers and hands across the lap. Deep strokes near the middle, bright strokes at the edge, and quiet finger work all belong to the player’s sound.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a stroke becomes sound, why the middle sounds deep and the edge bright, and where the sound leaves the drum. Shown, never played.',
    credit: { scenarios: ['tb.snd.1', 'tb.snd.2', 'tb.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'A stroke drives the head in the shapes it can reach from where it lands: near the middle mostly the low, ring-shaped ones; at the edge many more. Most of the sound leaves the head; some leaves the open lower end.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know how the player holds the tonbak, where the hands move, what a stage and a studio add — and what to do before any mic.',
    credit: { scenarios: ['tb.set.1', 'tb.set.2', 'tb.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The player’s posture, hands and movement come first: the mic fits round them, never the other way. Ask for their strokes and terms, listen from the audience side, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the tonbak by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['tb.mic.1', 'tb.mic.2', 'tb.mic.3', 'tb.mic.4', 'tb.rec.1'], note: 'Answer the five checks (one reaches back to how the tonbak sounds).' },
    takeaway: 'Try what you have first. A small condenser for detail, a dynamic for a compact stage pickup, an omni to compare in a quiet room. A stand is the default: a clip made for a drum hoop may not suit a tonbak.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — measured from the head, from the audience side, clear of the hands — then move the mic and see what changes.',
    credit: { scenarios: ['tb.place.1', 'tb.place.2', 'tb.place.3', 'tb.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the player, in two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Distance, viewpoint and angle are separate things to try, one at a time. If one hand or the edge takes over, move to a new viewpoint rather than only turning the mic. The hands’ path comes before every number.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the player’s wedge — and know what a pattern cannot do.',
    credit: { scenarios: ['tb.ctx.1', 'tb.ctx.2', 'tb.ctx.studio', 'tb.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A cardioid rejects most behind; a supercardioid rejects most toward the rear sides and hears a little straight behind. Check the real pattern before you place a wedge. Start with one mic and only the monitor level the player needs.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'Add a mic at the lower opening to the head mic: see what polarity does and does not change, and judge the pair in mono.',
    credit: { scenarios: ['tb.two.1', 'tb.two.2', 'tb.two.3', 'tb.two.4'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'The opening mic supports the head mic; it never replaces it. Polarity flips the sign; it does not remove a delay. Bring the second mic in quietly, in mono, and keep it only if it survives ordinary movement.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Move the mic before reaching for EQ: target, viewpoint and distance first; a filter only after you know what it removes.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second mic.',
    credit: { scenarios: ['tb.prac.order', 'tb.prac.gain', 'tb.prac.setup1', 'tb.prac.setup2', 'tb.prac.3', 'tb.mix.1', 'tb.mix.2', 'tb.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real tonbak and player.' },
    takeaway: 'Safe clearance, clean loudest strokes, recognisable quiet gestures, a reasoned comparison and a sensible number of mics pass — and more than one setup can pass.',
  },
};

/* Lesson lines in comments only: tb.snd.* L14-L16 · tb.set.* L15-L16, L42 ·
 * tb.mic.* L23-L42 · tb.place.* L44-L58 · tb.ctx.* L67-L72 · tb.two.* L59-L66 ·
 * tb.prac.* / tb.mix.* L101-L111. */
const scenarios: MikingScenario[] = [
  {
    id: 'tb.snd.1',
    page: 'sound',
    prompt: 'A stroke lands in the middle of the head. Which of the head’s vibration shapes can it set moving?',
    options: ['Mostly the ring-shaped ones; the rest are still there', 'All of them equally, since the whole head moves when it is struck', 'Only the shapes with a still line running across the middle'],
    correct: 'Mostly the ring-shaped ones; the rest are still there',
    explain: 'A stroke drives a shape only as much as the head moves where it lands. Shapes with a still line across the head do not move at the middle, so a middle stroke drives mainly the ring-shaped, lower ones — the deep sound.',
    why: {
      'All of them equally, since the whole head moves when it is struck': 'The hand touches one area. A shape is driven only as much as the head moves there — not at all on a still line.',
      'Only the shapes with a still line running across the middle': 'The reverse: a still line through the middle means the head does not move there in that shape.',
    },
  },
  {
    id: 'tb.snd.2',
    page: 'sound',
    prompt: 'Why does a stroke at the edge sound brighter than one near the middle?',
    options: ['It reaches many higher shapes that a middle stroke barely drives', 'The edge of the head is made of a thinner skin than the middle is', 'The wooden bowl rings louder when the hand lands near its rim'],
    correct: 'It reaches many higher shapes that a middle stroke barely drives',
    explain: 'Near the edge, many of the higher vibration shapes move, so an edge stroke sets more of them going — a brighter sound. Near the middle, mostly the low ring-shaped ones answer.',
    why: {
      'The edge of the head is made of a thinner skin than the middle is': 'The skin is one piece. What changes is which vibration shapes the stroke can reach.',
      'The wooden bowl rings louder when the hand lands near its rim': 'The body shapes the resonance, but the brightness comes from the higher shapes of the head that the edge stroke drives.',
    },
  },
  {
    id: 'tb.snd.3',
    page: 'sound',
    prompt: 'What is the open lower end of the tonbak, for a mic?',
    options: ['Another place sound and air leave — a possible extra pickup', 'A second drumhead that gives the drum its whole bass', 'A vent that a mic should be pushed into to get closer'],
    correct: 'Another place sound and air leave — a possible extra pickup',
    explain: 'The head radiates most of the sound; some also leaves the open lower end. It can support a head mic — it is not a second head and not a sure source of bass, and nothing goes inside it.',
    why: {
      'A second drumhead that gives the drum its whole bass': 'There is no skin there: it is an opening. Some resonance leaves it, but not the whole bass.',
      'A vent that a mic should be pushed into to get closer': 'Begin outside the instrument: no mic goes in the opening or rests against the shell.',
    },
  },
  {
    id: 'tb.set.1',
    page: 'setting',
    prompt: 'The player settles in with the drum across the lap, head to the right. The mic would be easier with the drum turned. What do you do?',
    options: ['Leave the drum where the player holds it; fit the mic round them', 'Ask the player to turn the drum so its head faces the mic stand squarely', 'Clamp the drum to a stand so that it cannot move while playing'],
    correct: 'Leave the drum where the player holds it; fit the mic round them',
    explain: 'Note the head’s orientation, the hands’ paths and the normal movement — and do not move the drum just to suit a microphone.',
    why: {
      'Ask the player to turn the drum so its head faces the mic stand squarely': 'The posture is part of the playing. The mic fits round the player, not the other way.',
      'Clamp the drum to a stand so that it cannot move while playing': 'Do not clamp a delicate rim, skin or decorated shell; the drum moves with the player.',
    },
  },
  micRatingCheck({ id: 'tb.set.2', page: 'setting', mic: 'small condenser', loudest: 'the loudest stroke' }),
  {
    id: 'tb.set.3',
    page: 'setting',
    prompt: 'Before any mic goes up, what do you ask the player to play?',
    options: ['Their deep, edge and quiet strokes, rolls, and a real passage', 'The loudest stroke only, to find the highest level the mic will see', 'A steady pulse on the middle of the head, to set an even tone'],
    correct: 'Their deep, edge and quiet strokes, rolls, and a real passage',
    explain: 'Hear the whole vocabulary — in the player’s own terms — alone and in a normal passage, at normal and strongest levels, from a comfortable audience position. Then write down what must stay audible.',
    why: {
      'The loudest stroke only, to find the highest level the mic will see': 'The loudest stroke matters for gain, but the quiet finger work and the edge strokes must survive too.',
      'A steady pulse on the middle of the head, to set an even tone': 'One stroke shows one corner of the drum. The player’s full vocabulary decides the placement.',
    },
  },
  {
    id: 'tb.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic close to the edge of the head tends to hear more of what?',
    options: ['The bright edge strokes and the finger work', 'The deep middle strokes, since the edge moves the most', 'The open lower end, through the wood of the bowl'],
    correct: 'The bright edge strokes and the finger work',
    explain: 'The edge strokes and much of the finger work land near the rim, and they drive the brighter shapes — a mic close to the edge tends to hear more of them. A tendency: drums and players vary.',
    why: {
      'The deep middle strokes, since the edge moves the most': 'The deep strokes are near the middle; near the edge the head is held, and the bright shapes dominate.',
      'The open lower end, through the wood of the bowl': 'The opening is at the far end of the drum; a mic near the edge hears the head.',
    },
  },
  {
    id: 'tb.mic.1',
    page: 'microphone',
    prompt: 'You have only a dynamic and a small condenser. What do you do?',
    options: ['Try them as they are and compare at matched loudness', 'Buy a special tonbak mic before the session can start', 'Use the condenser only, because condensers suit drums'],
    correct: 'Try them as they are and compare at matched loudness',
    explain: 'Use what you have before assuming a purchase. Compare the two on this player’s drum, at the same useful level — the louder one should not win just for being louder.',
    why: {
      'Buy a special tonbak mic before the session can start': 'No mic is required for a tonbak. Compare the mics you have by ear.',
      'Use the condenser only, because condensers suit drums': 'A dynamic is a workable choice too — compact on stage, with a different character. Compare them.',
    },
  },
  {
    id: 'tb.mic.2',
    page: 'microphone',
    prompt: 'A clip that fits a drum’s metal hoop would hold the mic close. Should you clip it to the tonbak?',
    options: ['Not unless it is made for it and the player agrees', 'Yes, as long as the clip is padded where it grips', 'Yes, on the rim, since the head will not mind it'],
    correct: 'Not unless it is made for it and the player agrees',
    explain: 'A clamp for a tension hoop may not fit a tonbak, and a rim, skin or decorated shell can be damaged. A stand is the default; a mount on the instrument needs the player’s approval and the maker’s instructions.',
    why: {
      'Yes, as long as the clip is padded where it grips': 'Padding does not make a hoop clamp suitable: the tonbak has no hoop, and its rim and skin are delicate.',
      'Yes, on the rim, since the head will not mind it': 'The rim and skin are what the player plays — and they can be damaged. Use a stand.',
    },
  },
  {
    id: 'tb.mic.3',
    page: 'microphone',
    prompt: 'Close in, the sound gets thicker. Is that always proximity effect?',
    options: ['Not necessarily — the target, the body and the room matter too', 'Yes, extra bass up close is the mic’s proximity effect in each case', 'Yes, unless the mic you are using happens to be a condenser'],
    correct: 'Not necessarily — the target, the body and the room matter too',
    explain: 'A directional mic can lift its lows close to a source, but it depends on the mic and the source; an omni has no such effect. A different target or the room can also thicken the sound.',
    why: {
      'Yes, extra bass up close is the mic’s proximity effect in each case': 'Other parts of the drum and the room can change the bass too; and a pressure omni has no proximity effect.',
      'Yes, unless the mic you are using happens to be a condenser': 'Proximity effect depends on the pattern (pressure-gradient), not on whether the mic is a condenser.',
    },
  },
  {
    id: 'tb.mic.4',
    page: 'microphone',
    prompt: 'On stage, does a small condenser cause more feedback just because it is more sensitive?',
    options: ['Not by itself — compare mics at the same useful level', 'Yes, its higher output reaches the PA and the wedges first', 'Only if you place it closer than you would a dynamic'],
    correct: 'Not by itself — compare mics at the same useful level',
    explain: 'At the same reproduced level, the pattern, the placement and the monitors decide feedback; the gain for a more sensitive mic is simply set lower.',
    why: {
      'Yes, its higher output reaches the PA and the wedges first': 'The gain is set for the same useful level, so the extra output is turned down at the desk.',
      'Only if you place it closer than you would a dynamic': 'Closer to the source usually helps gain before feedback. Pattern and monitors matter more.',
    },
  },
  {
    id: 'tb.place.1',
    page: 'placement',
    prompt: 'A starting point says “25–40 cm, 30–45° off the head’s centre line”. What is the angle measured from?',
    options: ['The head’s own centre line, not the floor', 'The floor, as on a level stand', 'The player’s shoulders, toward the audience'],
    correct: 'The head’s own centre line, not the floor',
    explain: 'Angles here are from the line straight out of the head (its normal). The head is tilted, so the same angle from the floor would put the mic somewhere else.',
    why: {
      'The floor, as on a level stand': 'The head is tilted; an angle from the floor would not match the drum. It is measured from the head’s own line.',
      'The player’s shoulders, toward the audience': 'The reference is the head, not the player’s body — the drum’s angle in the lap can change.',
    },
  },
  {
    id: 'tb.place.2',
    page: 'placement',
    prompt: 'One hand dominates the sound from your first position. What is the first thing to try?',
    options: ['Move the mic to a different viewpoint, not only turn it', 'Turn the mic away from that hand, staying in the same spot', 'Ask the player to play that hand a little more softly'],
    correct: 'Move the mic to a different viewpoint, not only turn it',
    explain: 'If one hand or the edge dominates, move the capsule to a different viewpoint rather than simply turning it — and keep the distance and target as separate changes.',
    why: {
      'Turn the mic away from that hand, staying in the same spot': 'Turning in place changes the balance only a little; a new viewpoint changes what the mic sees.',
      'Ask the player to play that hand a little more softly': 'The player’s balance is the goal; the mic adapts to it.',
    },
  },
  {
    id: 'tb.place.3',
    page: 'placement',
    prompt: 'Closer pickup (10–20 cm) sounds tighter, but quiet strokes disappear. What do you check first?',
    options: ['The target and how consistently the player is playing', 'The EQ: add top end until the quiet strokes return', 'The level: turn the channel up for the quiet passages'],
    correct: 'The target and how consistently the player is playing',
    explain: 'If quieter strokes vanish, first check the target and the performance. If the sound turns thick, compare a greater distance or another mic before a large bass cut.',
    why: {
      'The EQ: add top end until the quiet strokes return': 'Placement first: EQ cannot bring back strokes the mic is not hearing well.',
      'The level: turn the channel up for the quiet passages': 'More level raises everything; the balance between strokes is a placement question.',
    },
  },
  {
    id: 'tb.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Moving your mic stand closer, what must it stay clear of?',
    options: ['The hands’ full path, the player’s legs and their movement', 'The open lower end, so the drum can breathe freely as it rings', 'The floor under the drum, so the stand cannot tip'],
    correct: 'The hands’ full path, the player’s legs and their movement',
    explain: 'Hand clearance comes before every number — vigorous passages included — and the stand stays clear of the legs and the player’s normal movement.',
    why: {
      'The open lower end, so the drum can breathe freely as it rings': 'Keeping the opening clear matters, but the hands and the player’s movement come first.',
      'The floor under the drum, so the stand cannot tip': 'A steady stand matters, but the space to protect is the player’s.',
    },
  },
  {
    id: 'tb.ctx.1',
    page: 'context',
    prompt: 'Live, what is a sensible way to start on a tonbak?',
    options: ['One directional mic and only the monitor level the player needs', 'Two mics from the start, so there is a spare sound ready for the mix', 'An omni near the head, for the most natural stage sound'],
    correct: 'One directional mic and only the monitor level the player needs',
    explain: 'Begin with one workable directional mic. A second mic must justify its extra spill and monitor interaction.',
    why: {
      'Two mics from the start, so there is a spare sound ready for the mix': 'Each open mic adds spill and lowers the feedback margin. Start with one.',
      'An omni near the head, for the most natural stage sound': 'An omni rejects nothing — on a stage with monitors it is rarely the first choice.',
    },
  },
  {
    id: 'tb.ctx.2',
    page: 'context',
    prompt: 'Your stage mic is a supercardioid. Where should the wedge NOT go?',
    options: ['Straight behind it — that pattern hears a little there', 'Toward its rear sides, where it rejects most of all', 'Anywhere except straight in front of the mic’s grille'],
    correct: 'Straight behind it — that pattern hears a little there',
    explain: 'A supercardioid rejects most toward the rear sides and has a small pickup directly behind. Check the real pattern of the mic in use before placing the wedge.',
    why: {
      'Toward its rear sides, where it rejects most of all': 'That is where it rejects MOST — a good place for a wedge.',
      'Anywhere except straight in front of the mic’s grille': 'A supercardioid still picks up well at its sides; only its rear sides reject strongly.',
    },
  },
  {
    id: 'tb.ctx.studio',
    page: 'context',
    prompt: 'Solo tonbak in a good, quiet studio. What could justify a mic farther back (60–100 cm)?',
    options: ['The room adds something the music wants', 'A farther mic picks up more bass than a close one', 'It removes the need for the player to play evenly'],
    correct: 'The room adds something the music wants',
    explain: 'A farther, room-inclusive view can suit a solo in a good room. Compare at matched loudness, and keep the pattern and the distance as separate changes.',
    why: {
      'A farther mic picks up more bass than a close one': 'Farther back a directional mic usually hears LESS low end. The reason to go back is the room.',
      'It removes the need for the player to play evenly': 'The player’s dynamics are the music; no mic position changes that.',
    },
  },
  {
    id: 'tb.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Where does most of the tonbak’s sound leave the drum?',
    options: ['The head, with some from the open lower end', 'The open lower end, with a little from the head', 'The wooden bowl, which rings out around the head'],
    correct: 'The head, with some from the open lower end',
    explain: 'The head radiates most of the sound; the opening adds some resonance — which is why the main mic looks at the head.',
    why: {
      'The open lower end, with a little from the head': 'The other way round: the head is the main source; the opening is a support.',
      'The wooden bowl, which rings out around the head': 'The body shapes the resonance; the head is what moves the most air.',
    },
  },
  {
    id: 'tb.two.1',
    page: 'twoMic',
    prompt: 'You flip the opening mic’s polarity. What happens to the arrival-time difference?',
    options: ['Nothing: polarity flips the sign; the delay stays', 'It drops to zero, so the two arrivals line up again', 'It doubles, because the inverted copy arrives later'],
    correct: 'Nothing: polarity flips the sign; the delay stays',
    explain: 'Inverting a channel changes its sign; it does not remove a difference in arrival time. Only moving a mic changes the delay.',
    why: {
      'It drops to zero, so the two arrivals line up again': 'The mics are still at the same distances: the delay is unchanged.',
      'It doubles, because the inverted copy arrives later': 'Polarity has no time in it. Only a mic’s position changes the delay.',
    },
  },
  {
    id: 'tb.two.2',
    page: 'twoMic',
    prompt: 'How do you bring in the opening mic?',
    options: ['Hear each alone, then add it quietly in mono while the player plays', 'Set both to the same level, so that neither of them dominates', 'Invert it and leave it: a second mic on a drum must be flipped'],
    correct: 'Hear each alone, then add it quietly in mono while the player plays',
    explain: `Identify what each mic contributes alone, then introduce the support channel gradually in mono while the player alternates deep, edge and roll strokes. ${OPPOSITE_SIDES_POLARITY}`,
    why: {
      'Set both to the same level, so that neither of them dominates': 'Equal levels are not a goal; the opening mic is a support, usually lower.',
      'Invert it and leave it: a second mic on a drum must be flipped': 'Flipping it is a common first thing to try, never a rule: compare both states by ear, in mono.',
    },
  },
  {
    id: 'tb.two.3',
    page: 'twoMic',
    prompt: 'Does the 3:1 guideline make a head-and-opening pair sum correctly?',
    options: ['No — it is about spill between sources; judge this pair by ear', 'Yes, once the opening mic sits three times farther from the drum', 'Yes, as long as both mics share the same pattern'],
    correct: 'No — it is about spill between sources; judge this pair by ear',
    explain: 'The 3:1 guideline manages leakage between mics on DIFFERENT sources. A tonbak pair hears overlapping parts of one instrument on purpose — judge the actual combination.',
    why: {
      'Yes, once the opening mic sits three times farther from the drum': '3:1 is about spill between separate sources; it guarantees nothing for two views of one drum.',
      'Yes, as long as both mics share the same pattern': 'Matching patterns does not line up arrival times. Judge the pair in mono.',
    },
  },
  {
    id: 'tb.two.4',
    page: 'twoMic',
    prompt: 'The pair sounds better — until the player moves normally. What then?',
    options: ['Lower the support mic or remove it: the benefit is too fragile', 'Ask the player to keep still for the rest of the session, if they can', 'Time-align the two by lining up the peaks of one stroke'],
    correct: 'Lower the support mic or remove it: the benefit is too fragile',
    explain: 'If the useful balance depends on an unrealistically fixed posture, use less of the second mic or none. Delay changes only for a measured, understood timing problem.',
    why: {
      'Ask the player to keep still for the rest of the session, if they can': 'A setup that needs the player to freeze is not practical.',
      'Time-align the two by lining up the peaks of one stroke': 'Aligning one stroke’s peaks does not correct the whole instrument; keep delay for a measured timing problem.',
    },
  },
  {
    id: 'tb.prac.gain',
    page: 'practice',
    prompt: 'Normal strokes sit well below the overload light, but the strongest passage lights it. What do you do?',
    options: ['Lower the input gain, or a pad its manual allows, then re-check', 'Pull the channel fader down until the loud strokes sound clean', 'Ask the player to keep the loudest passage a little softer'],
    correct: 'Lower the input gain, or a pad its manual allows, then re-check',
    explain: 'Set gain while the player shows the strongest intended passage, with room for variation. A lower fader does not undo clipping at the input.',
    why: {
      'Pull the channel fader down until the loud strokes sound clean': 'The overload is at the input, before the fader; a lower fader only makes it quieter.',
      'Ask the player to keep the loudest passage a little softer': 'Set the gain for what the player intends to play.',
    },
  },
  {
    id: 'tb.prac.3',
    page: 'practice',
    prompt: 'What would justify a second mic on the tonbak?',
    options: ['It adds something useful and survives mono and normal movement', 'It gives the mix engineer one more channel to choose from later', 'The tonbak needs more level than one mic can give'],
    correct: 'It adds something useful and survives mono and normal movement',
    explain: 'A narrow source does not automatically benefit from two mics. Keep the simpler setup unless the second channel adds a useful perspective that holds up.',
    why: {
      'It gives the mix engineer one more channel to choose from later': 'More channels also add spill and interactions; the second mic must improve the sound.',
      'The tonbak needs more level than one mic can give': 'Level comes from gain, not from another mic.',
    },
  },
  {
    id: 'tb.mix.1',
    page: 'practice',
    prompt: 'A starting point says “10–20 cm”. Before you place the mic, what else do you need?',
    options: ['The head area it aims at, and the hands’ clearance', 'The drum maker’s name, so the number fits the drum', 'Nothing more: that number already places the mic'],
    correct: 'The head area it aims at, and the hands’ clearance',
    explain: 'A distance means nothing without its target, and hand clearance takes priority over every number.',
    why: {
      'The drum maker’s name, so the number fits the drum': 'The reference is the head area you aim at; a maker’s name changes nothing.',
      'Nothing more: that number already places the mic': 'Without a target and a clearance check the number places nothing.',
    },
  },
  {
    id: 'tb.mix.2',
    page: 'practice',
    prompt: 'Live, your wedge sits about 120° off a supercardioid’s front. What can you expect?',
    options: ['Strong rejection on paper; less in reality, least in the lows', 'Silence from the wedge, because it sits right in the null', 'More pickup than straight behind, where it rejects most'],
    correct: 'Strong rejection on paper; less in reality, least in the lows',
    explain: 'A null is infinitely deep only on paper. Real mics reject far less there, and least at low frequencies — use the null to aim, not to promise silence.',
    why: {
      'Silence from the wedge, because it sits right in the null': 'Real nulls are shallow, and shallowest in the lows.',
      'More pickup than straight behind, where it rejects most': 'Straight behind, a supercardioid has a small rear lobe; it rejects most toward the rear sides.',
    },
  },
  {
    id: 'tb.mix.3',
    page: 'practice',
    prompt: 'The head and opening mics sound hollow together. Which change removes the arrival-time difference?',
    options: ['Moving a mic so the two paths are closer to equal', 'Flipping the polarity switch on the opening mic', 'Turning the opening mic up until it matches the head'],
    correct: 'Moving a mic so the two paths are closer to equal',
    explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth.',
    why: {
      'Flipping the polarity switch on the opening mic': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
      'Turning the opening mic up until it matches the head': 'Level changes the depth of the notches, not the delay.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 's.edge',
    observation: 'Too much hard edge or finger contact',
    firstChecks: 'Change the target or viewpoint; compare a greater distance.',
    options: ['Change the target or viewpoint, then compare more distance', 'Cut the top end with EQ until the contact sound softens', 'Ask the player to use softer strokes on the edge of the head'],
    correct: 'Change the target or viewpoint, then compare more distance',
    explain: 'Keep the change only if the deep strokes and the quiet details still speak.',
    why: {
      'Cut the top end with EQ until the contact sound softens': 'Placement first; EQ also dulls the quiet details you want to keep.',
      'Ask the player to use softer strokes on the edge of the head': 'The player’s sound is the goal: move the mic.',
    },
  },
  {
    id: 's.weak',
    observation: 'Weak deep stroke',
    firstChecks: 'Compare target and distance; hear the unamplified drum again.',
    options: ['Compare target and distance; hear the drum unamplified again', 'Boost the lows on the channel until the deep stroke returns', 'Move the mic straight into the open lower end of the drum'],
    correct: 'Compare target and distance; hear the drum unamplified again',
    explain: 'Tell the source’s own balance from the mic’s or the room’s colour before changing anything.',
    why: {
      'Boost the lows on the channel until the deep stroke returns': 'First find out whether the drum itself is weak there; EQ can thicken everything else.',
      'Move the mic straight into the open lower end of the drum': 'Nothing goes inside the drum; the opening is an optional support from outside.',
    },
  },
  {
    id: 's.thick',
    observation: 'Too much resonance or thickness',
    firstChecks: 'Move the mic; compare less of the opening mic.',
    options: ['Move the mic, and compare less of the opening mic', 'Add a large bass cut before trying other changes', 'Damp the head with tape so it rings less'],
    correct: 'Move the mic, and compare less of the opening mic',
    explain: 'Avoid removing the drum’s intended body; the heads and their treatment are the player’s.',
    why: {
      'Add a large bass cut before trying other changes': 'A big cut can remove the deep stroke the player wants. Move first.',
      'Damp the head with tape so it rings less': 'The drum and its treatment are the player’s: never alter it to suit a mic.',
    },
  },
  {
    id: 's.rolls',
    observation: 'Quiet rolls disappear',
    firstChecks: 'Revisit position and spill before adding processing.',
    options: ['Position and spill first, before any processing', 'A compressor, to lift the quiet rolls automatically', 'A gate, so that only the rolls come through clean'],
    correct: 'Position and spill first, before any processing',
    explain: 'Keep the change only if the player and engineer agree the quiet gestures stay identifiable.',
    why: {
      'A compressor, to lift the quiet rolls automatically': 'Compression can hide the dynamics; first make the pickup hear the rolls.',
      'A gate, so that only the rolls come through clean': 'A gate can cut quiet strokes off entirely — the opposite of what you want.',
    },
  },
  {
    id: 's.hollow',
    observation: 'The two mics sound hollow together',
    firstChecks: 'Test the support level, polarity and position, in mono, with several strokes and normal movement.',
    options: ['Support level, polarity and position — in mono, with movement', 'Turn both channels up until the combined sound fills out', 'Invert the opening mic and keep it that way from now on'],
    correct: 'Support level, polarity and position — in mono, with movement',
    explain: 'Check several gestures and ordinary movement in mono; keep the second mic only if the gain survives.',
    why: {
      'Turn both channels up until the combined sound fills out': 'More level does not fix a cancellation.',
      'Invert the opening mic and keep it that way from now on': 'No polarity is correct by rule; compare both states.',
    },
  },
  {
    id: 's.ring',
    observation: 'Live ringing or too much spill',
    firstChecks: 'Lower the relevant send, then revisit the mic and monitor geometry.',
    options: ['Lower the send, then rethink the mic and monitor geometry', 'Keep the level and let the ring settle on its own', 'Turn the wedge up so the player can hear through the ringing'],
    correct: 'Lower the send, then rethink the mic and monitor geometry',
    explain: 'Reduce the send or output promptly, then correct the placement or the system balance. Never sustain feedback.',
    why: {
      'Keep the level and let the ring settle on its own': 'Ringing grows; reduce the send at once.',
      'Turn the wedge up so the player can hear through the ringing': 'Louder monitors feed the ring: less margin, more feedback.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'tb.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic tonbak setup in the order you would do them.',
    steps: [
      { text: 'Note the drum, the player’s posture and role, and agree a repeatable passage', early: 'Start with the player and the drum.' },
      { text: 'Choose a mic and a stand that suit the drum and the room', early: 'Choose once you know the drum, the posture and the role.' },
      { text: 'Place it about 25–40 cm from the audience side; check the hands’ full paths', early: 'You need a chosen mic before you place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom if needed', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set gain on the strongest passage, with room for variation', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare two targets, then two distances — one change at a time', early: 'Compare once the level is safe, at matched loudness.' },
      { text: 'Ask the player which position keeps their sound; log it', early: 'Decide last, with the player.' },
    ],
    explain: 'A sensible order. Mute and lower monitoring before switching phantom; set gain on the strongest intended passage; compare at matched levels; decide with the player.',
  },
];

const POWER_REASON: SetupReason = { id: 'r.power', label: 'The channel gives the mic the power it needs (phantom, or none)', role: 'required', feedback: 'Say how the mic is powered: a condenser needs phantom; a dynamic needs none.' };
const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point, measured from the head', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };
const CLEAR_REASON: SetupReason = { id: 'r.clear', label: 'Mic, stand and cable stay clear of the hands, legs and movement', role: 'required', feedback: 'Clearance is part of every passing setup.' };
const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand most engineers use on hand drums', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' };
const BASS_REASON: SetupReason = { id: 'r.bass', label: 'It will give the most bass of any position', role: 'wrong', feedback: 'Bass emphasis is not a passing reason — the player’s balance is.' };

const setupTasks: SetupTask[] = [
  {
    id: 'tb.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Solo tonbak in a good, quiet studio; the player wants the quiet finger work to carry. One channel; phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser, cardioid, about 25–40 cm from the audience side, angled at the head', ok: true, power: 'phantom', feedback: 'A balanced starting point that hears the whole vocabulary; it has the phantom it needs.' },
      { id: 'b', label: 'Small condenser with an omni capsule, about 60–100 cm away, for the room', ok: true, power: 'phantom', feedback: 'In a good quiet room, a fair comparison — check that the quiet strokes still speak.' },
      { id: 'c', label: 'Dynamic, cardioid, about 25–40 cm from the audience side', ok: true, power: 'none', feedback: 'A workable choice; compare its detail on the quiet strokes.' },
      { id: 'd', label: 'Mic pushed inside the lower opening for a fuller sound', ok: false, power: 'phantom', feedback: 'Nothing goes inside the drum; the opening is an optional support from outside.' },
      { id: 'e', label: 'A drum hoop clip clamped to the tonbak’s rim', ok: false, power: 'phantom', feedback: 'A hoop clamp may not fit and can damage the rim or skin. Use a stand.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.room', label: 'In a quiet room, the room can add something useful', role: 'optional', feedback: 'A fair studio reason.' }, BRAND_REASON, BASS_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a sensible starting point measured from the head, clearance, and power that matches the mic.',
  },
  {
    id: 'tb.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage with monitors; the tonbak must carry over a band. The only spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'Dynamic, cardioid, about 10–20 cm, beside the hands’ path, aimed at the head', ok: true, power: 'none', feedback: 'Closer and directional for a loud stage; a dynamic needs no phantom.' },
      { id: 'b', label: 'Dynamic, supercardioid, about 25–40 cm from the audience side, wedge at its rear sides', ok: true, power: 'none', feedback: 'Directional, its rejection aimed at the wedge; no phantom needed.' },
      { id: 'c', label: 'Small condenser, cardioid, about 25–40 cm from the audience side', ok: false, power: 'phantom', feedback: 'A fair position — but this input has no phantom power.' },
      { id: 'd', label: 'Omni about 1 m away, to hear the whole drum', ok: false, power: 'phantom', feedback: 'Far and omni on a loud stage hears the band and the monitors — and this input has no phantom.' },
      { id: 'e', label: 'Dynamic right against the head so the hands work round it', ok: false, power: 'none', feedback: 'The hands’ path comes first: never in the way of the playing.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'Close, directional pickup helps against stage spill and feedback', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, BASS_REASON],
    explain: 'Two dynamic setups pass. What passes is the reasoning: a sensible starting point, clear of the hands, powered by what this input supplies.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: which stroke sets more of the head’s higher shapes moving?', options: ['A stroke at the edge', 'A stroke in the middle', 'Both the same'], after: 'Now STEP through the stroke (or PLAY ONCE), then try STROKE at the middle and at the edge.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the mic from 30 cm to 15 cm from the head. What changes most?', options: ['More isolation and detail', 'More of the room', 'Nothing'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'Where will this supercardioid reject the wedge best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION.' },
  twoMic: { prompt: 'If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What is the tonbak?',
    options: ['A goblet drum with one skin head, open at the bottom', 'A pair of small drums tuned to two different pitches', 'A frame drum with jingles set into its wooden rim'],
    correct: 'A goblet drum with one skin head, open at the bottom',
    explain: 'The tonbak (also tombak) is an Iranian single-headed goblet drum, open at its narrow lower end.',
    why: {
      'A pair of small drums tuned to two different pitches': 'That describes a pair like the tabla. The tonbak is one goblet drum.',
      'A frame drum with jingles set into its wooden rim': 'That is a tambourine family drum. The tonbak has a goblet body and no jingles.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'How is the tonbak usually played?',
    options: ['Held across the lap, struck with the fingers and hands', 'Set on a stand and struck with a pair of sticks', 'Held upright between the knees and struck with a beater'],
    correct: 'Held across the lap, struck with the fingers and hands',
    explain: 'The player holds it across the lap and plays it with the fingers and hands — deep strokes, edge strokes, rolls and quiet finger work. Ask the player how they hold it.',
    why: {
      'Set on a stand and struck with a pair of sticks': 'It is a hand drum; the fingers and hands make its whole vocabulary.',
      'Held upright between the knees and struck with a beater': 'It rests across the lap and is played with the hands.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'A stroke near the middle of the head sounds deeper than one at the edge. Why?',
    options: ['It drives mostly the low, ring-shaped vibrations', 'The middle of the skin is thicker than the edge', 'It pushes air out of the bottom faster than the edge'],
    correct: 'It drives mostly the low, ring-shaped vibrations',
    explain: 'A stroke drives each shape by how much the head moves where it lands: near the middle, mostly the low ring-shaped ones; at the edge, many higher ones too.',
    why: {
      'The middle of the skin is thicker than the edge': 'The skin is one piece; the difference is which vibration shapes the stroke reaches.',
      'It pushes air out of the bottom faster than the edge': 'The air at the opening is part of the body sound; the depth comes from the head’s low shapes.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Where does most of the tonbak’s sound leave the drum?',
    options: ['From the head, with some from the open lower end', 'From the open lower end, with a little from the head', 'From the wooden body, evenly all round the drum'],
    correct: 'From the head, with some from the open lower end',
    explain: 'The head radiates most; some resonance leaves the opening — a possible extra pickup, not a second head.',
    why: {
      'From the open lower end, with a little from the head': 'The other way round: the head is the main source.',
      'From the wooden body, evenly all round the drum': 'The body shapes the sound, but the head moves the most air.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'Placing a mic close to the tonbak, what comes before every distance?',
    options: ['The hands’ full paths and the player’s movement', 'The exact distance that the starting point names', 'The shortest cable run from the stand to the desk'],
    correct: 'The hands’ full paths and the player’s movement',
    explain: 'Hand clearance takes priority over every number: keep the capsule and stand outside the whole playing envelope, vigorous passages included.',
    why: {
      'The exact distance that the starting point names': 'The numbers are starting points; the hands’ clearance comes first.',
      'The shortest cable run from the stand to the desk': 'A tidy cable matters, but never before the player’s space.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: 'Your mic is rated for a very high SPL. What does that tell you about sitting by the drum through a long soundcheck?',
    options: ['Nothing — it is the mic’s distortion limit, not a hearing limit', 'It is safe for as long as the drum stays below the mic’s rated level', 'It is safe as long as the mic sits closer than you do'],
    correct: 'Nothing — it is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more.',
    why: {
      'It is safe for as long as the drum stays below the mic’s rated level': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA over 8 hours.',
      'It is safe as long as the mic sits closer than you do': 'Where the mic sits says nothing about your ears.',
    },
  },
];

export const M12_LESSON: Lesson = {
  id: 'M12',
  labId: 'drums',
  title: 'Tonbak',
  subtitle: 'The Persian goblet drum: one head, many strokes',
  noun: { one: 'tonbak', many: 'tonbaks' },
  model: TONBAK_MODEL,
  micTypeIds: ['sdcCard', 'instDynCard'],
  zones: TONBAK_ZONES,
  setupPairs: [{ label: 'A head mic and a mic at the lower opening', A: { zone: 'tb.A', typeId: 'sdcCard' }, B: { zone: 'tb.D', typeId: 'sdcCard' } }],
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'The tonbak (also spelled tombak) is an Iranian goblet drum: one skin head stretched over a wide bowl, a narrow neck, and a flared foot that is open at the bottom.', src: 'MET-89.4.304' },
    { title: 'WHERE YOU MEET IT', text: 'In Persian classical and folk music, solo and with other instruments and voices — on stage and in the studio. Tonbaks vary: wooden and other materials exist, so look at the drum in front of you.', src: 'MET-89.4.304 / MET-89.4.332' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'A wide vocabulary from one head: deep strokes near the middle, bright strokes at the edge, rolls and quiet finger work. Let the player name their strokes, and ask what must stay audible.', src: 'LESSON' },
    { title: 'ITS SIZE', text: `The wooden example drawn here is about 41 cm (16 in) long with a 25.4 cm (10 in) head — about ${Math.round((T_R * 2) / 10)} cm across. Held across the lap, the head here faces the player’s right, tilted up: a drawing choice — players differ.`, src: 'MET-89.4.304' },
  ],
  sound: {
    stages: [
      { title: 'A stroke lands', text: 'The fingers or hand strike the head. Near the middle: the deep sound. At the edge: the bright sound.' },
      { title: 'The head moves', text: 'The head moves in the shapes the stroke can reach from where it landed — drawn here much larger than it really moves.' },
      { title: 'The air inside moves', text: 'The moving head pushes and pulls the air inside the bowl; through the narrow neck some air and sound reach the open lower end. As the head moves in, the air just outside it thins while air is pushed out of the opening: a mic at the head and a mic at the opening hear opposite pushes.' },
      { title: 'Sound leaves', text: 'Most of the sound leaves the head, toward the player’s right and up; some leaves the open lower end. The bowl and the air inside shape how it rings.' },
    ],
    attack: 'The start of each stroke: the hand’s brief contact with the head. A mic close to where the stroke lands tends to hear more of it — and more contact and finger sound.',
    body: 'The ring after the stroke: the head, the air inside and the body together. It leaves mostly from the head, some from the open end. Both are tendencies; drums and players vary.',
    head: { diameterMm: T_R * 2, rods: 0, label: '25.4 cm (10 in) head, seen from the player’s right', strikeSrc: 'MET-89.4.304' },
  },
  setting: {
    items: [
      { id: 'drum', label: 'the tonbak, across the lap', short: 'TONBAK', note: 'Held across the lap, head to the player’s right in this drawing. Note how the player really holds it — and do not move the drum to suit a mic.', prov: { kind: 'illustrative', reason: 'posture: a drawing default the owner checks' }, tag: 'THE DRUM', scene: 'all' },
      { id: 'player', label: 'the player and their hands', short: 'PLAYER', note: 'The hands move over the head and its edge, sometimes vigorously. Their whole path is the player’s space: no mic, stand or cable in it.', prov: { kind: 'illustrative', reason: 'a seated player: a drawing default' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'chair', label: 'the chair and the legs', short: 'LEGS', note: 'The drum rests on the lap: the legs and feet move too. Stands go clear of them.', prov: { kind: 'illustrative', reason: 'a drawing default' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'wedge', label: 'the player’s wedge', short: 'WEDGE', note: 'Live, a floor monitor downstage, facing back toward the player. Check the mic’s real pattern before placing it.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'band', label: 'other players', short: 'BAND', note: 'Louder neighbours on a stage — the reason to start close and directional.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Listen from here first, without amplification. The mic usually comes from this side.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'MIC SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a quiet studio, a farther mic or a room mic can add the space — when the room sounds good.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors, louder neighbours and a PA. Start with one directional mic and only the monitor level the player needs; check the mic’s real pattern before placing a wedge.',
    studio: 'STUDIO: headphones instead of monitor speakers, time to compare, and a room that may add something — compare positions at matched loudness.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic setup for a given tonbak, player and room, describe an alternative, and say what would justify a second mic. With a real player’s agreement, log what you tried below.',
    fields: [
      { id: 'mic', label: 'Mic and pattern', kind: 'text' },
      { id: 'target', label: 'Target, approximate distance and angle', kind: 'text' },
      { id: 'posture', label: 'The player’s posture', kind: 'text' },
      { id: 'gain', label: 'Input gain or pad', kind: 'text' },
      { id: 'balance', label: 'Balance of deep, edge and quiet strokes', kind: 'text' },
      { id: 'second', label: 'Second mic: what it added, polarity result', kind: 'text' },
      { id: 'notes', label: 'Monitoring, player feedback, your revision', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The player’s posture and the head’s orientation (across the lap, head to the right, tilted 15° up, 620 mm high): drawing defaults — a player’s check is needed.', dims: [] },
    { text: 'The waist and foot diameters come from a brass example’s proportions scaled to the wooden head; the opening (110 mm) and the bowl’s shape are drawing defaults.', dims: [] },
    { text: 'The hands’ reach, the body and the lap: ILLUSTRATIVE keep-outs for the owner to check.', dims: [] },
    { text: 'Every tonbak position is the lesson’s own trial: no published tonbak miking figure exists.', dims: [] },
  ],
  live: {
    wedges: [
      { id: 'wedge', label: 'the player’s wedge, downstage, facing back toward the player', short: 'WEDGE', p: { x: 1500, y: 0, z: 350 }, lift: 150, faces: { x: -1, y: 0, z: -0.2 }, note: 'Downstage of the player, on the audience side — where a mic aimed back at the drum points its rear.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
      { id: 'side', label: 'a side-fill monitor across the stage', short: 'SIDE FILL', p: { x: 300, y: 0, z: 1500 }, lift: 150, faces: { x: 0, y: 0, z: -1 }, note: 'Off to the player’s right, roughly beside the mic’s front: no pattern’s null reaches it. Distance and level do the work.', prov: { kind: 'illustrative', reason: 'a typical stage layout' } },
    ],
  },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. We could not find a recommended way to mic the tonbak: these starting points are adapted from how microphones behave, and every drum, player and room is different. Move the mic, experiment, and trust your ears and the player. The lab is silent and draws a simplified picture: one wooden tonbak, a seated posture the player may not use, head motion drawn larger, mic patterns as textbook shapes. Distances are rounded to about 5 mm and measured to the mic’s front. Keep clear of the hands.',
};
