/**
 * A04a TUBA — the lesson's pages as DATA (blueprint §7). The words come from
 * the owner's lesson (docs/labs/miking/source_text/Tuba-Miking-Technique-
 * Research.txt), with the fixes logged in docs/labs/miking/CORRECTIONS_LOG.md
 * (LB-06, LB-07 and the family rows) applied — the unsourced ribbon-on-solo-
 * tuba example is dropped.
 *
 * OWNER RULING 2026-10-04 — learner-facing presentation: suggested starting
 * points, never dogma; no source, brand or model in learner text; no badges.
 * FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, LessonPages, PageContent, SourcePageId, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, LOUD_REASON, POWER_REASON, clearReason, distortSymptom, docReason, feedbackFirst, gainCheck, hearingCheck, hearingDiag, hollowSymptom, matchedLevels, nullOnPaper, polarityDelay, removeDelay, superNull, type Words } from '../shared/lowbrass/lowBrassItems.ts';
import { TUBA_MODEL } from './geometry.ts';
import { TUBA_ZONES } from './model.ts';
import { TUBA_COPY } from './copy.ts';

const W: Words = { noun: 'tuba', player: 'tuba player', moving: 'the bell’s sway and the valve hand' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the tuba',
    goal: 'Get to know the tuba — what it is, where you meet it, what it does in the music, and its parts, from the mouthpiece to the bell — and which way its bell points, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The lips buzz; the air in a long, widening tube vibrates; the sound leaves from the bell — up on most concert tubas, to the front on some. Find the bell before anything else.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how buzzing lips become a tuba note — the pulse down the tube, the standing wave, the bell — and where the bell sends the sound. Shown, never played.',
    credit: { scenarios: ['tu.snd.1', 'tu.snd.2', 'tu.snd.3'], interactive: 'soundPath', note: 'Step the sequence through to the end (or play it once), and answer the three checks.' },
    takeaway: 'Nearly all of the sound leaves from the bell. The lowest notes spread nearly all round; the attacks and upper overtones go where the bell points — up, or to the front. Tendencies: tubas and rooms vary.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the tuba’s surroundings — the player’s chair and support, the bell’s sway, the slides, the neighbours — what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['tu.set.1', 'tu.set.2', 'tu.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The bell, the valve hand and the slides are the player’s space: no mic, boom or cable goes there, and no slide ever holds anything. Find the bell, hear the lowest written note, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the tuba by its properties — pattern, low-end response, headroom, airflow and mount — not by its brand.',
    credit: { scenarios: ['tu.mic.1', 'tu.mic.2', 'tu.mic.3', 'tu.mic.4', 'tu.rec.1'], note: 'Answer the five checks (one reaches back to how the tuba sounds).' },
    takeaway: 'A dynamic, a condenser or a ribbon can all work. Check that the mic and the channel keep the lowest written note, that it has headroom for the loudest phrase, and — for a ribbon — that it stays out of the bell’s air.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — about two feet above an upward bell aimed at its edge, or a foot or two from the bell a little off its axis — clear of the bell’s sway; then move the mic and see what changes.',
    credit: { scenarios: ['tu.place.1', 'tu.place.2', 'tu.place.3', 'tu.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin, measured from a named part — the bell, or the tuba — not a rule. Aim across an upward bell, never down into it. Clearance comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim a mic in front of a front bell so its rejection faces the player’s wedge — and know what a pattern cannot do in the lowest octaves, and when a close mic is not needed.',
    credit: { scenarios: ['tu.ctx.1', 'tu.ctx.2', 'tu.ctx.studio', 'tu.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A cardioid rejects most behind; a supercardioid off to each side of the rear. In the tuba’s lowest octaves every pattern widens toward omni — check the subwoofers and the stage with the player silent.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a close and a farther mic on one tuba can sound hollow together, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: ['tu.two.1', 'tu.two.2', 'tu.two.3', 'tu.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two mics at different distances hear the tuba at different times: some pitches cancel in the sum. Move or rebalance first; polarity flips the sign and never removes a delay. Judge the pair in mono, at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — a filter, the room, the distance, the stand, the gain stages and the mount — before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one tuba mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second mic.',
    credit: { scenarios: ['tu.prac.order', 'tu.prac.gain', 'tu.prac.setup1', 'tu.prac.setup2', 'tu.prac.3', 'tu.mix.1', 'tu.mix.2', 'tu.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real tuba.' },
    takeaway: 'The bell found first, safe clearance from the sway, the hands and the slides, the lowest note kept, headroom, pattern reasoning and an accurate account of polarity versus delay pass. A brand or the brightest spot do not — and more than one setup can pass.',
  },
};

/* THE CHECKS (lesson paragraphs in comments only): tu.snd.* ¶7-¶8; tu.set.*
 * ¶6, ¶10, ¶21; tu.mic.* ¶7-¶8, ¶12-¶14, ¶21; tu.place.* ¶11-¶12; tu.ctx.*
 * ¶16, ¶20-¶22; tu.two.* ¶17; tu.prac.* ¶10-¶14, ¶20-¶22. */
const scenarios: MikingScenario[] = [
  {
    id: 'tu.snd.1',
    page: 'sound',
    prompt: 'Which part of the tuba gives off almost all of its sound?',
    options: ['The bell’s opening, where the air column meets the room', 'The whole metal body, ringing like a large bell would', 'The valves, where the air is switched between the tubes'],
    correct: 'The bell’s opening, where the air column meets the room',
    explain: 'The air inside the tube vibrates; the sound escapes at the open end — the bell. The metal walls give off very little. That is why a mic’s distance is read from the bell.',
    why: {
      'The whole metal body, ringing like a large bell would': 'The body’s metal moves very little. The air inside does the work, and leaves at the bell.',
      'The valves, where the air is switched between the tubes': 'The valves only change the tube’s length. Close up they add mechanical noise, not the note.',
    },
  },
  {
    id: 'tu.snd.2',
    page: 'sound',
    prompt: 'An upward bell plays a short, loud phrase. Where do its upper overtones mostly go?',
    options: ['Up, round the bell’s axis — toward the ceiling', 'Evenly all round, just like the lowest notes do', 'Straight out to the audience, past the player'],
    correct: 'Up, round the bell’s axis — toward the ceiling',
    explain: 'The higher the overtone, the more it follows the bell’s axis. An upward bell sends them up; the lowest notes spread nearly all round. A mic aimed across the bell’s edge catches some of each.',
    why: {
      'Evenly all round, just like the lowest notes do': 'Only the lowest notes spread nearly all round. The overtones follow the bell.',
      'Straight out to the audience, past the player': 'That is a front bell. An upward bell sends its overtones up first.',
    },
  },
  {
    id: 'tu.snd.3',
    page: 'sound',
    prompt: 'Why do a low tuba note’s attack and upper harmonics matter to a mic?',
    options: ['They help listeners follow the low pitch in a mix', 'They are noise a good tuba mic is meant to remove', 'They matter only for the tuba’s highest notes'],
    correct: 'They help listeners follow the low pitch in a mix',
    explain: 'Among a kick drum, a bass guitar and other low brass, a low note is identified partly by its attack and upper harmonics. Keep them, without forcing a bright on-axis sound.',
    why: {
      'They are noise a good tuba mic is meant to remove': 'They are part of the note — and part of how a listener hears its pitch.',
      'They matter only for the tuba’s highest notes': 'They matter most for the LOW notes, whose fundamentals are hard to hear on their own.',
    },
  },
  hearingCheck('tu.set.1', W),
  {
    id: 'tu.set.2',
    page: 'setting',
    prompt: 'You need something to hold a mic near the tuba. Which is a safe choice?',
    options: ['A stable stand or boom of its own, clear of the sway', 'A tuning slide, which sticks out just where it is needed', 'The bell rim, with whichever trumpet clip happens to fit'],
    correct: 'A stable stand or boom of its own, clear of the sway',
    explain: 'Tuba slides bend easily and must never hold the instrument or a mic; a bell clip only if its maker confirms it fits this bell. A stand of its own, outside the bell’s sway, is the safe default.',
    why: {
      'A tuning slide, which sticks out just where it is needed': 'Slides bend easily. Never use one as a handle or a mount.',
      'The bell rim, with whichever trumpet clip happens to fit': 'A trumpet clip is not proof it grips a tuba bell safely. The fit must be confirmed for this bell.',
    },
  },
  {
    id: 'tu.set.3',
    page: 'setting',
    prompt: 'Before placing a mic, what do you find out first?',
    options: ['Which tuba it is and where its bell points while playing', 'Its brand, to look up the one correct mic position', 'Nothing: concert tubas all point their bells the same way'],
    correct: 'Which tuba it is and where its bell points while playing',
    explain: '“Tuba” is not one geometry: bells point up, to the front or — on older military tubas — back. Find the bell in playing position, and whether the player uses a stand or support.',
    why: {
      'Its brand, to look up the one correct mic position': 'No brand sets a mic position. The bell’s direction and the player’s movement do.',
      'Nothing: concert tubas all point their bells the same way': 'Concert tubas are made with bells up and bells front. Look before you place.',
    },
  },
  {
    id: 'tu.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic close over the centre of an upward bell tends to hear…',
    options: ['One local part of the bell, plus air and valve noise', 'The whole tuba and the room around it, evenly', 'The neighbouring players more than the tuba right beneath it'],
    correct: 'One local part of the bell, plus air and valve noise',
    explain: 'Very close over the opening, one part of a large bell — and the air stream and mechanical noise — dominate. Aiming across the edge from farther away hears more of the whole tuba.',
    why: {
      'The whole tuba and the room around it, evenly': 'That is what a farther mic tends to hear. Up close, one region dominates.',
      'The neighbouring players more than the tuba right beneath it': 'Close over the bell, the tuba is by far the loudest thing the mic hears.',
    },
  },
  {
    id: 'tu.mic.1',
    page: 'microphone',
    prompt: 'The tuba’s lowest notes sit far below most instruments’. What do you check?',
    options: ['That the mic and channel keep the lowest written note', 'Nothing: microphones all hear down to the lowest notes', 'That it is a kick-drum mic, since those are made for lows'],
    correct: 'That the mic and channel keep the lowest written note',
    explain: 'Mics and filters differ in the lows. Check the actual mic’s response and any low-cut filter with the lowest written note playing — a “kick mic” label is no promise of a good tuba sound.',
    why: {
      'Nothing: microphones all hear down to the lowest notes': 'Mics and filters differ at the bottom; a filter set from a table can thin the lowest note.',
      'That it is a kick-drum mic, since those are made for lows': 'A kick mic is shaped for a kick. Any suitable mic with the right response and headroom can be tried.',
    },
  },
  {
    id: 'tu.mic.2',
    page: 'microphone',
    prompt: 'A cardioid close to the bell makes the tuba sound huge but blurred. A likely reason?',
    options: ['Proximity effect: up close, a directional mic lifts the lows', 'Its omni pattern is collecting the room’s low end', 'The bell is too quiet up close, so the gain has been set far too high'],
    correct: 'Proximity effect: up close, a directional mic lifts the lows',
    explain: 'A directional mic lifts the low end as it gets close — it can make a line seem larger while blurring its articulation. Compare a little farther or more off axis at matched level.',
    why: {
      'Its omni pattern is collecting the room’s low end': 'The mic in the question is a cardioid. Close-up bass lift is a directional mic’s proximity effect.',
      'The bell is too quiet up close, so the gain has been set far too high': 'Close to the bell the tuba is loud. The blur is the proximity lift, not the gain.',
    },
  },
  {
    id: 'tu.mic.3',
    page: 'microphone',
    prompt: 'You hang a ribbon right over an upward bell. What is the risk?',
    options: ['The stream of air from the bell can harm the ribbon', 'A ribbon cannot pick up the tuba’s low notes at all', 'Its figure-8 back will reject the tuba completely'],
    correct: 'The stream of air from the bell can harm the ribbon',
    explain: 'An upward bell blows air at a mic placed close over its opening, and a ribbon is delicate. Follow the ribbon’s own guidance on airflow and mounting — and aim across the edge from a safe distance.',
    why: {
      'A ribbon cannot pick up the tuba’s low notes at all': 'Ribbons are used on low brass. The risk is the air, not the pitch.',
      'Its figure-8 back will reject the tuba completely': 'A figure-8 hears its back as strongly as its front; its nulls are at the sides.',
    },
  },
  {
    id: 'tu.mic.4',
    page: 'microphone',
    prompt: 'A clip’s maker confirms it fits this tuba’s bell, and the player agrees. Can you use it?',
    options: ['Yes — then check the cable, the finish and its noise', 'No — tubas can only be miked from a stand', 'No — clips are made for trumpets and trombones only'],
    correct: 'Yes — then check the cable, the finish and its noise',
    explain: 'A confirmed mount, fitted with the player managing the horn, can suit a player who turns the bell. Add strain relief, keep the cable from the valves and the slides, and listen for clip noise.',
    why: {
      'No — tubas can only be miked from a stand': 'A stand is the safe default, not the only way. A confirmed mount is fine with the player’s agreement.',
      'No — clips are made for trumpets and trombones only': 'Some mounts are made for large bells. The question is whether its maker confirms THIS bell.',
    },
  },
  {
    id: 'tu.place.1',
    page: 'placement',
    prompt: 'A starting point reads “about 60 cm above the bell”. Your readout says 60 cm above the valves. Are you in it?',
    options: ['Not necessarily — measure from the bell, as it names', 'Yes: 60 cm is 60 cm, whatever part of the tuba it is read from', 'Yes, as long as the mic points down at the tuba'],
    correct: 'Not necessarily — measure from the bell, as it names',
    explain: 'A distance means something only with the part it is measured from. The valves sit well below the bell’s rim — 60 cm above them is nowhere near 60 cm above the bell.',
    why: {
      'Yes: 60 cm is 60 cm, whatever part of the tuba it is read from': 'Same number, different place. The starting point is measured from the bell.',
      'Yes, as long as the mic points down at the tuba': 'Aim is a separate check. The distance is read from the part the starting point names.',
    },
  },
  {
    id: 'tu.place.2',
    page: 'placement',
    prompt: 'Your mic is about 60 cm above an upward bell, aimed at its edge, its boom outside the space above the bell. A sensible place to begin?',
    options: ['Yes — then compare a closer spot, a little off axis', 'No — lower it into the bell for the fullest sound', 'No — aim it straight down at the bell’s centre'],
    correct: 'Yes — then compare a closer spot, a little off axis',
    explain: 'That is the above-the-bell starting point: open, rounded, with some room. From there, compare a closer view off the axis at matched level, and keep clear of the sway.',
    why: {
      'No — lower it into the bell for the fullest sound': 'A mic never goes into the bell: it hears one local part, the air stream and the valves — and risks the instrument.',
      'No — aim it straight down at the bell’s centre': 'Aiming at the edge is the suggestion: straight down is the most direct, local view.',
    },
  },
  {
    id: 'tu.place.3',
    page: 'placement',
    prompt: 'You move the mic from off the bell’s axis toward it. What tends to change?',
    options: ['More attack and bite, less of the rounded sound', 'A softer, rounder tuba with more of the room', 'Only the level; the tone stays exactly the same'],
    correct: 'More attack and bite, less of the rounded sound',
    explain: 'Toward the axis tends to give more articulation and upper-harmonic bite; off axis, softer. Compare at matched level with the whole phrase.',
    why: {
      'A softer, rounder tuba with more of the room': 'That is what moving off axis or farther tends to do.',
      'Only the level; the tone stays exactly the same': 'The bell makes the overtones directional: the angle changes the tone too.',
    },
  },
  {
    id: 'tu.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What must a tuba mic, its boom and its cable stay clear of?',
    options: ['The bell’s sway, the valve hand and the slides', 'The music stand, so the player can read the part', 'The audience’s view of the tuba’s bright bell'],
    correct: 'The bell’s sway, the valve hand and the slides',
    explain: 'Clearance comes first: the bell moves as the player breathes and plays, the right hand works the valves, and the slides and water keys stick out. Stop the player before anything moves.',
    why: {
      'The music stand, so the player can read the part': 'Sight lines matter, but the safety question is what moves and what bends.',
      'The audience’s view of the tuba’s bright bell': 'The view matters less than the movement a stand can be hit by.',
    },
  },
  feedbackFirst('tu.ctx.1', 'tuba'),
  superNull('tu.ctx.2', 'context', 'wedge'),
  {
    id: 'tu.ctx.studio',
    page: 'context',
    prompt: 'A featured tuba overdub in a good room. What could justify one farther mic and no close one?',
    options: ['The room adds size, and nothing needs separating', 'A close mic cannot capture a tuba’s lowest notes', 'Close tuba mics suit live work only, not studios'],
    correct: 'The room adds size, and nothing needs separating',
    explain: 'In a good room, a farther mic can carry the tuba’s size, its sustained lows and their decay. A close mic adds definition when a dense arrangement needs it.',
    why: {
      'A close mic cannot capture a tuba’s lowest notes': 'A close mic hears the lows well — often too well, with proximity lift. The question is the balance wanted.',
      'Close tuba mics suit live work only, not studios': 'Close mics are used in studios too — for a dense arrangement, say. It depends on the goal.',
    },
  },
  {
    id: 'tu.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Where do a tuba’s lowest notes spread?',
    options: ['Nearly all round, a little weaker away from the bell', 'Only straight along the bell’s axis, nowhere else', 'Only forward, toward the audience and the PA'],
    correct: 'Nearly all round, a little weaker away from the bell',
    explain: 'In the lowest octaves the tuba radiates nearly all round — which is also where a mic’s pattern rejects least. Expect the low end of the stage in an open tuba mic.',
    why: {
      'Only straight along the bell’s axis, nowhere else': 'That is the trend for the upper overtones. The lowest notes spread nearly all round.',
      'Only forward, toward the audience and the PA': 'The lowest notes go every way, the stage and the mics included.',
    },
  },
  {
    id: 'tu.two.1',
    page: 'twoMic',
    prompt: 'Why can a close and a farther mic on one tuba sound hollow together?',
    options: ['The sound reaches them at different times, so some pitches cancel', 'The farther mic inverts the sound on its way there, so it cancels', 'Two mics on one tuba cancel each other’s low end in the sum'],
    correct: 'The sound reaches them at different times, so some pitches cancel',
    explain: 'The farther mic hears each note a little later. Summed, some pitches arrive out of step and cancel — a comb of notches. Move or rebalance first, then check polarity at matched levels.',
    why: {
      'The farther mic inverts the sound on its way there, so it cancels': 'Distance delays a sound; it does not flip its sign.',
      'Two mics on one tuba cancel each other’s low end in the sum': 'Cancellation depends on the delay and the levels: some pitches dip, others add.',
    },
  },
  polarityDelay('tu.two.2'),
  matchedLevels('tu.two.3', 'tuba'),
  {
    id: 'tu.two.4',
    page: 'twoMic',
    prompt: 'A tuba spot under an orchestra’s main pair makes some notes hollow. What is the first move?',
    options: ['Move or rebalance the spot, then check it in mono', 'Delay the spot to the main pair, automatically', 'Flip the spot’s polarity and leave it flipped'],
    correct: 'Move or rebalance the spot, then check it in mono',
    explain: 'Hear the spot alone and with the main pair, in mono, at the real blend; move or rebalance it before reaching for delay or polarity — neither is an automatic fix.',
    why: {
      'Delay the spot to the main pair, automatically': 'Delay can help, but not by reflex: move or rebalance first and judge by ear.',
      'Flip the spot’s polarity and leave it flipped': 'Polarity flips the sign; it does not remove the delay behind the hollow notes.',
    },
  },
  gainCheck('tu.prac.gain', W),
  {
    id: 'tu.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second tuba channel?',
    options: ['The first works alone, the pair adds something, it holds in mono', 'Two channels give the mix engineer more options to choose from later on', 'The tuba needs more low end than one mic can give'],
    correct: 'The first works alone, the pair adds something, it holds in mono',
    explain: 'A second mic blends a different perspective — and a delay. If the pair loses body, move or rebalance it, check polarity — or leave it out.',
    why: {
      'Two channels give the mix engineer more options to choose from later on': 'More channels add spill, a cable and a combining check. A second mic should earn its place.',
      'The tuba needs more low end than one mic can give': 'Low end comes from placement, the filter and the room — not from adding a mic.',
    },
  },
  {
    id: 'tu.mix.1',
    page: 'practice',
    prompt: 'A starting point reads “1–1.4 m in front of the tuba”. What is it measured from?',
    options: ['The tuba itself, where the player holds it', 'The bell’s rim, where the sound leaves it', 'The player’s lips, at the mouthpiece'],
    correct: 'The tuba itself, where the player holds it',
    explain: 'A distance belongs to the part it names. The farther view is measured from the tuba; the closer ones from the bell — two places a long way apart on an upright tuba.',
    why: {
      'The bell’s rim, where the sound leaves it': 'That is the closer starting points’ reference. This one names the tuba.',
      'The player’s lips, at the mouthpiece': 'Nothing is measured from the player’s face; the starting point names the tuba.',
    },
  },
  nullOnPaper('tu.mix.2', 'wedge'),
  removeDelay('tu.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'tu.sym.lowest',
    observation: 'The lowest note disappears',
    firstChecks: 'A filter, a room cancellation or the arrangement masking it: bypass the filter, hear the actual written note, then reposition or rebalance.',
    options: ['Bypass the filter, hear the note, then move or rebalance', 'Boost the lowest frequencies on the channel first', 'Swap to a kick-drum mic, since it is made for lows'],
    correct: 'Bypass the filter, hear the note, then move or rebalance',
    explain: 'A filter set from a table, a room that cancels a low note, or a bass guitar on the same note can each hide it. Find which before reaching for EQ.',
    why: {
      'Boost the lowest frequencies on the channel first': 'EQ cannot put back what a filter or a cancellation removed. Find the cause first.',
      'Swap to a kick-drum mic, since it is made for lows': 'A kick mic is no promise for a tuba; the cause is usually the filter, the room or the mix.',
    },
  },
  {
    id: 'tu.sym.boom',
    observation: 'Boomy but indistinct',
    firstChecks: 'Close proximity lift, or the room or the stand vibrating: compare a farther, off-axis view, and listen to the mic with the player silent and the stage playing.',
    options: ['Compare a farther, off-axis view; test with the player silent', 'Cut all of the low end until the boom goes away', 'Move the mic right over the bell’s centre for a more focused sound'],
    correct: 'Compare a farther, off-axis view; test with the player silent',
    explain: 'A close directional mic lifts the lows, and stage or riser vibration can pass for tuba. Compare, and listen with the player silent — then reposition or isolate the stand before filtering.',
    why: {
      'Cut all of the low end until the boom goes away': 'A broad cut thins every note to fix a few. Find the cause.',
      'Move the mic right over the bell’s centre for a more focused sound': 'Closer and on axis usually adds more proximity lift and local noise.',
    },
  },
  distortSymptom('tu.sym.distort'),
  {
    id: 'tu.sym.hit',
    observation: 'The bell hits the mic or the boom',
    firstChecks: 'The normal tilt, standing up or a mute path was missed: stop, and let the player steady the horn while the stand is moved.',
    options: ['Stop, and move the stand while the player steadies the horn', 'Ask the player to keep the tuba still for the show', 'Tape the boom to the bell so the two move together'],
    correct: 'Stop, and move the stand while the player steadies the horn',
    explain: 'The bell sways and tilts with playing. Stop, let the player hold the tuba safely, move the stand, and recheck the whole movement.',
    why: {
      'Ask the player to keep the tuba still for the show': 'Movement is part of playing. The mic gives way, not the player.',
      'Tape the boom to the bell so the two move together': 'Nothing goes on the bell’s finish, and a boom tied to it can pull the tuba.',
    },
  },
  {
    id: 'tu.sym.clip',
    observation: 'A clip slips or marks the bell',
    firstChecks: 'Remove it; confirm the exact mount for this bell with its maker, or use a stand.',
    options: ['Remove it; confirm the mount for this bell, or use a stand', 'Tighten the clip harder so that it cannot slip off the bell again', 'Pad it with tape and leave it in place for the show'],
    correct: 'Remove it; confirm the mount for this bell, or use a stand',
    explain: 'A slipping or marking clip is not made for this bell. Take it off, check the maker’s confirmed fit and finish protection — or use a stand.',
    why: {
      'Tighten the clip harder so that it cannot slip off the bell again': 'More force on a wrong clip risks the bell and its finish.',
      'Pad it with tape and leave it in place for the show': 'Tape on a valuable finish, on a clip that does not fit, is still the wrong mount.',
    },
  },
  hollowSymptom('tu.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'tu.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic tuba setup in the order you would do them.',
    steps: [
      { text: 'Ask which tuba it is, where its bell points, and about the part', early: 'Start with the player and the instrument.' },
      { text: 'Hear the lowest written note, short notes and a loud phrase in the room', early: 'Listen before choosing a mic.' },
      { text: 'Choose the mic and a stand or boom (or a confirmed mount)', early: 'Choose once you know the bell and the sound.' },
      { text: 'With the player stopped, place it for the real bell, clear of the sway', early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom on if needed', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set gain on the loudest real phrase; check any filter against the lowest note', early: 'Gain and filters come once the mic is connected and powered.' },
      { text: 'Compare distance and angle one change at a time, matched levels', early: 'Compare only once the level is set safely.' },
      { text: 'Secure the stand and cable; recheck the player’s full movement', early: 'Secure it last, then watch the bell sway again.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before switching it — and check a ribbon’s manual first. Gain: set it with headroom for the loudest phrase; filters only against the lowest written note.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'tu.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A loud stage with a brass band and a drummer. One channel for a bell-up tuba; a sub-heavy PA.',
    setups: [
      { id: 'a', label: 'Small dynamic a foot or two from the bell, above and to the side, aimed across the opening', ok: true, power: 'none', feedback: 'A recommended starting point: close, directional, clear of the sway — check it with the player silent for subwoofer spill.' },
      { id: 'b', label: 'A mount its maker confirms for this bell, the cable kept from the valves and slides', ok: true, power: 'phantom', feedback: 'A recommended option when a confirmed mount exists: it moves with the bell.' },
      { id: 'c', label: 'A small condenser 1.2 m in front, for the whole tuba and the room', ok: false, power: 'phantom', feedback: 'A good studio view — on a loud stage it hears the band and the subwoofers more than the tuba.' },
      { id: 'd', label: 'A mic lowered into the bell, for the strongest signal', ok: false, power: 'none', feedback: 'Never into the bell: one local part, the air stream and the valves — and a risk to the tuba.' },
      { id: 'e', label: 'A clip on a tuning slide, close to the valves', ok: false, power: 'phantom', feedback: 'Slides bend easily and must never hold anything — and the valves are noise, not tuba.' },
    ],
    reasons: [docReason('the bell'), clearReason('the bell’s sway, the valve hand and the slides'), POWER_REASON, { id: 'r.sub', label: 'I will listen with the player silent for the PA’s low end in the mic', role: 'optional', feedback: 'A fair live reason: the lowest octaves get past every pattern.' }, BRAND_REASON('tuba'), LOUD_REASON],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point from its named part, clearance from the bell and the hands, and the power the mic needs.',
  },
  {
    id: 'tu.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · Studio. A wind ensemble is recorded with a main pair already up; the producer wants a little more tuba definition.',
    setups: [
      { id: 'a', label: 'A small condenser about 60 cm above the bell, aimed at its edge, raised under the main pair and checked in mono', ok: true, power: 'phantom', feedback: 'A recommended starting point used as a spot: open and rounded, raised just enough.' },
      { id: 'b', label: 'A small dynamic a foot or two from the bell, off axis, at a modest level under the main pair', ok: true, power: 'none', feedback: 'A recommended starting point — closer and more defined; check it with the main pair in mono.' },
      { id: 'c', label: 'A spot on the bell’s axis, as close as it goes, with a big low boost', ok: false, power: 'none', feedback: 'That turns a supporting bass line into an oversized source — and proximity already lifts the lows.' },
      { id: 'd', label: 'Delay the spot to the main pair and flip its polarity, as a matter of course', ok: false, power: 'phantom', feedback: 'Neither is automatic: move or rebalance first, then judge both in mono.' },
      { id: 'e', label: 'Turn the main pair up until the tuba is clear', ok: false, power: 'phantom', feedback: 'That raises everything else too. Definition needs a little direct tuba, not more of everything.' },
    ],
    reasons: [docReason('the bell'), clearReason('the bell’s sway, the valve hand and the neighbours'), POWER_REASON, { id: 'r.mono', label: 'I will raise it gradually and check it with the main pair in mono', role: 'optional', feedback: 'A fair reason: a spot supports the main pair, it does not replace it.' }, BRAND_REASON('tuba'), { id: 'r.boost', label: 'A tuba spot needs a big low-end boost to work', role: 'wrong', feedback: 'Close spots already lift the lows. Keep the line supportive.' }],
    explain: 'Two spots pass. What passes is the reasoning: a sensible starting point, clearance, the right power — and a spot that supports the main pair rather than pulling the tuba forward.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: where does a tuba’s sound leave the instrument?', options: ['From the bell’s opening', 'From the whole body at once', 'From the valves'], after: 'Now STEP through (or PLAY ONCE) and follow the sound from the lips to the bell.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move a mic from about 30 cm to about 60 cm from the bell. What changes?', options: ['More attack and valve noise', 'More of the whole tuba and the room', 'It depends on this tuba'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge is on the floor in front of the player. Where will a supercardioid facing back at a front bell reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'Where does nearly all of a tuba’s sound leave the instrument?',
    options: ['From the bell’s opening', 'From the whole metal body', 'From the four valves'],
    correct: 'From the bell’s opening',
    explain: 'The air in the tube vibrates and escapes at the bell; the metal itself gives off very little.',
    why: {
      'From the whole metal body': 'The metal moves very little. The air leaves at the bell.',
      'From the four valves': 'The valves change the tube’s length; up close they add mechanical noise.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'Which way does a concert tuba’s bell point?',
    options: ['Up or to the front — it depends on the tuba', 'Only up, on concert and band tubas alike', 'Only forward, toward the audience'],
    correct: 'Up or to the front — it depends on the tuba',
    explain: 'Orchestral tubas usually point up; tubas made for recording point to the front; older military ones pointed back. Find the bell before placing a mic.',
    why: {
      'Only up, on concert and band tubas alike': 'Up is the usual orchestral form, but bell-front tubas are made too.',
      'Only forward, toward the audience': 'Front is one form; the usual concert tuba points up.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'What sets the air in the tuba vibrating?',
    options: ['The lips buzzing in the mouthpiece', 'The valves opening and closing quickly', 'The body ringing when it is blown'],
    correct: 'The lips buzzing in the mouthpiece',
    explain: 'The player’s lips buzz; the long air column rings, and the lips lock onto it.',
    why: {
      'The valves opening and closing quickly': 'The valves choose the tube’s length; they do not make the vibration.',
      'The body ringing when it is blown': 'The metal body gives off very little. The air inside does the work.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Where do the tuba’s lowest notes spread?',
    options: ['Nearly all round the player', 'Only along the bell’s own axis', 'Only toward the audience'],
    correct: 'Nearly all round the player',
    explain: 'The lowest notes spread nearly all round — a little weaker away from the bell. The overtones follow the bell.',
    why: {
      'Only along the bell’s own axis': 'That is the trend for the upper overtones, not the lowest notes.',
      'Only toward the audience': 'The lowest notes go every way, the stage included.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'Which of these may hold a mic near a tuba?',
    options: ['A stand of its own, clear of the sway', 'A tuning slide that sticks out nearby', 'A trumpet clip that happens to fit the rim'],
    correct: 'A stand of its own, clear of the sway',
    explain: 'Slides bend and never hold anything; a bell clip only if its maker confirms the fit. A stand of its own is the safe default.',
    why: {
      'A tuning slide that sticks out nearby': 'Slides bend easily. They never hold the tuba or a mic.',
      'A trumpet clip that happens to fit the rim': 'A clip must be confirmed for this bell — a trumpet clip is no proof.',
    },
  },
  hearingDiag('q.6', W),
];

const wedges: Wedge[] = [
  {
    id: 'wedge',
    label: 'the tuba player’s floor wedge, in front, facing back',
    short: 'WEDGE',
    p: { x: 1600, y: 0, z: 0 },
    lift: 150,
    faces: { x: -1, y: 0, z: 0 },
    note: 'On the floor in front, facing back at the player: below and behind a mic that faces back at a front bell — the case a pattern’s rejection can help with, tilting as well as turning.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
  },
  {
    id: 'side',
    label: 'another player’s wedge, off to the tuba player’s left',
    short: 'SIDE WEDGE',
    p: { x: 900, y: 0, z: -1300 },
    lift: 150,
    faces: { x: -0.5, y: 0, z: 0.86 },
    note: 'Off to one side, facing another player: well off the mic’s axis — and in the lowest octaves no pattern rejects it much.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
  },
];

export const A04A_LESSON: Lesson = {
  id: 'A04a',
  labId: 'winds',
  title: 'Tuba',
  subtitle: 'Bell up or bell front: above the bell, a little off to the side, or farther back',
  noun: { one: 'tuba', many: 'tubas' },
  model: TUBA_MODEL,
  micTypeIds: ['smallDynCard', 'sdcCard', 'lbRibbon', 'lbLdc'],
  zones: TUBA_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'The tuba is the largest and lowest brass instrument, played by buzzing the lips into a large mouthpiece. Its long, widening tube is folded into a big body that rests on the player’s lap; four piston valves under the right hand add lengths of tube. Tubas are built in B♭, C, E♭ and F, and with the bell pointing up, to the front, or — on older military tubas — back.', src: 'Y-HUB-TUBA' },
    { title: 'WHERE YOU MEET IT', text: 'Orchestras, wind and brass bands, brass quintets, jazz and second-line bands (often on the sousaphone, whose bell wraps round to face forward), film sessions and studio overdubs. This lesson covers one seated concert tuba, in the studio and live.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'It is the bass foundation: long notes under the ensemble, rhythmic bass lines, and now and then a featured solo. Its attacks and upper harmonics are what let a listener follow its low notes among a kick drum, a bass guitar or other low brass.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'A B♭ tuba has about 5.5 m of tube; this lab draws one with a 44 cm bell. Its lowest notes reach below 40 Hz — but the part, not a table, decides the lowest note a mic must keep.', src: 'Y-YBB321' },
  ],
  sound: {
    stages: [
      { title: 'The lips buzz', text: 'The player’s lips, pressed into the large mouthpiece, buzz slowly — puffs of air into the tube, fewer per second the lower the note.' },
      { title: 'A pulse runs down the tube', text: 'Each puff sends a pressure pulse along the folded tube — about 5.5 m of it in a B♭ tuba. The valves add extra loops to lower the pitch.' },
      { title: 'The bell turns some of it back', text: 'At the flaring bell, much of the pulse turns back up the tube. Going to and fro, it sets up a standing wave in the air column, and the lips lock onto it — that holds the note’s pitch.' },
      {
        title: 'Sound leaves the bell',
        text: 'What escapes leaves from the bell — pointing up here. The lowest notes spread nearly all round; the attacks and upper overtones go mostly up, round the bell’s axis.',
        byVariant: { front: 'What escapes leaves from the bell — facing the audience here. The lowest notes spread nearly all round; the attacks and upper overtones go mostly forward, round the bell’s axis.' },
      },
    ],
    attack: 'The start of each note: the tongue releasing the air and the lips starting to buzz — the edge that tells a listener where a low note begins. It leaves the bell, so a mic nearer the bell’s axis tends to hear more of it.',
    body: 'The sustained note: the standing wave in the tube, leaving the bell — the lowest notes nearly all round, the overtones along the bell’s axis — and the room’s low end. A mic farther away tends to hear more of the whole tuba and the room. Tendencies: tubas vary.',
    head: { diameterMm: 0, rods: 0, label: 'the air column', strikeSrc: 'UNSW-BRASS' },
  },
  setting: {
    items: [
      { id: 'tuba', label: 'the tuba and the player', short: 'TUBA', note: 'The player sits facing the audience, the tuba on the lap leaning against them, the right hand on the valves, the bell beside the head. Ringed in amber: the instrument this lesson mics.', prov: { kind: 'illustrative', reason: 'tuba/GEOMETRY_PROPOSAL.md (drawing defaults)' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'stand', label: 'the music stand', short: 'MUSIC STAND', note: 'In front of the player. The player must see the part and the conductor: a mic stand should not block that line.', prov: { kind: 'illustrative', reason: 'a typical seat' }, tag: 'SIGHT LINE', scene: 'kit' },
      { id: 'euph', label: 'a euphonium beside', short: 'EUPHONIUM', note: 'The euphonium often sits beside the tuba. A tuba mic hears it too — aim, pattern and distance decide how much.', prov: { kind: 'illustrative', reason: 'a typical band seating' }, tag: 'SPILL', scene: 'kit' },
      { id: 'wedge', label: 'the tuba player’s wedge', short: 'WEDGE', note: 'On a stage, a floor monitor in front of the player, facing back at them — loud, and close to a mic in front of a front bell.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'side', label: 'another player’s wedge', short: 'SIDE WEDGE', note: 'Off to one side, facing another player.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'audience, the PA and its subwoofers', short: 'AUDIENCE · PA', note: 'The PA’s subwoofers put a lot of low end on stage — the very range a tuba mic is open to. Check the mic with the player silent.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'LOW END', scene: 'stage' },
      { id: 'main', label: 'a main pair for the ensemble', short: 'MAIN PAIR', note: 'In a studio recording of a group, a main pair hears the whole ensemble; a tuba mic is a spot that supports it.', prov: { kind: 'illustrative', reason: 'a generic main pair' }, tag: 'MAIN PAIR', scene: 'studio' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a studio there are no wedges; a good room carries the tuba’s size — and its low notes can be uneven where the room’s modes sit.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors feed the players, the PA (with its subwoofers) faces the audience, and the band reaches every open mic. A loud stage pushes toward a close, aimed mic — and a check of the lowest octaves with the player silent.',
    studio: 'STUDIO: no wedges, a room that may sound good, and repeated trials when the player stops. A farther mic can carry the tuba’s size; in a group, a main pair may carry it already.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic tuba setup for a given room, bell and performance, describe an alternative position, and explain what would justify a second mic. With a real tuba and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'room', label: 'Room or stage', kind: 'text' },
      { id: 'bell', label: 'Where the bell points', kind: 'choice', choices: ['up', 'front', 'back', 'sousaphone'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small dynamic, cardioid', 'small condenser', 'ribbon', 'large condenser', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, from the bell (or which part)', kind: 'text' },
      { id: 'notes', label: 'What you heard, the lowest note included (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The tuba’s body: its height from the lowest bow to the bell (900 mm), the bows, branches, valve block and slides — drawing defaults; the 443 mm bell and the four top pistons are the sourced facts.', dims: [] },
    { text: 'The seated pose: the tuba on the lap leaning back, the bell beside the head on the player’s right, the right hand on the valves, the left on the body, the chair (seat 460 mm) — drawing defaults (LB-02).', dims: [] },
    { text: 'The front bell’s position (turned forward at head height) — a drawing default.', dims: [] },
    { text: 'The keep-outs: the bell’s opening (11 cm beyond the rim), the bell’s sway, the valve hand — illustrative.', dims: [] },
    { text: 'The farther view’s distance (1.0–1.4 m from the tuba) — no number in the lesson; the above-the-bell band drawn ±5 cm round 61 cm.', dims: [] },
    { text: 'The ribbon’s and the large condenser’s body sizes — drawing defaults.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every tuba, player and room is different: find the bell, move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: one player in a typical posture, the bell and the hands’ space shown as keep-outs, mic patterns and the two-mic comb as textbook shapes. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped, and only with their agreement.',
  copy: TUBA_COPY,
};
