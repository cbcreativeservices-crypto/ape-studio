/**
 * A03 FRENCH HORN — the lesson's pages as DATA (blueprint §7). The words come
 * from the owner's lesson (docs/labs/miking/source_text/French-Horn-Miking-
 * Technique-Research.txt), with the fixes logged in docs/labs/miking/
 * CORRECTIONS_LOG.md (LB-01 … LB-08) applied.
 *
 * OWNER RULING 2026-10-04 — learner-facing presentation: suggested starting
 * points, never dogma; no source, brand or model in learner text; no badges.
 * The research stays in docs/labs/miking/french_horn/ and the code-only
 * fields. FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, LessonPages, PageContent, SourcePageId, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, LOUD_REASON, POWER_REASON, clearReason, distortSymptom, docReason, feedbackFirst, gainCheck, hearingCheck, hearingDiag, hollowSymptom, matchedLevels, nullOnPaper, polarityDelay, removeDelay, superNull, type Words } from '../shared/lowbrass/lowBrassItems.ts';
import { HORN_MODEL } from './geometry.ts';
import { HORN_ZONES } from './model.ts';
import { HORN_COPY } from './copy.ts';

const W: Words = { noun: 'horn', player: 'horn player', moving: 'the bell’s rise and the right hand' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the horn',
    goal: 'Get to know the horn — what it is, where you meet it, what it does in the music, and its parts, from the mouthpiece to the rear-facing bell — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The lips buzz; the air in a long, coiled tube vibrates; the sound leaves from a bell that points BEHIND the player, with the right hand inside it.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how the player’s buzzing lips become sound — the pulse down the tube, the standing wave, the bell — and why the wall behind the player is part of a horn’s sound.',
    credit: { scenarios: ['hn.snd.1', 'hn.snd.2', 'hn.snd.3'], interactive: 'soundPath', note: 'Step the sequence through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The lips buzz, the air column rings, and the sound leaves a bell that points back. In front you hear more of the room’s reflection; behind the bell, the direct and more forceful sound — tendencies, and rooms vary.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the horn’s surroundings — the bell behind the player, the wall or shell it faces, the hands, the neighbours — what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['hn.set.1', 'hn.set.2', 'hn.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The bell, the right hand and the bell’s rise in “bells up” passages are the player’s space: no mic, stand or cable goes there. Listen from in front and from behind first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the horn by its properties — pattern, power, headroom and mount — not by its brand.',
    credit: { scenarios: ['hn.mic.1', 'hn.mic.2', 'hn.mic.3', 'hn.mic.4', 'hn.rec.1'], note: 'Answer the five checks (one reaches back to how the horn sounds).' },
    takeaway: 'A dynamic, a condenser or a ribbon can all work. What decides is the pattern and where its nulls point, the power it needs, headroom for the strongest accent, and a mount that respects the horn and the player.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — behind and beside the bell, aimed toward it, or in front of the player — clear of the bell’s rise and the right hand; then move the mic and see what changes.',
    credit: { scenarios: ['hn.place.1', 'hn.place.2', 'hn.place.3', 'hn.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different suggested starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A suggested zone is a place to begin, measured from a named part — the bell, or the horn — not a rule. Behind the bell is direct; in front is the horn with its room. Clearance comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim a mic behind the horn so its rejection faces a side-fill at the back of the stage — and know what a pattern cannot do, and when the room makes a rear mic unnecessary.',
    credit: { scenarios: ['hn.ctx.1', 'hn.ctx.2', 'hn.ctx.studio', 'hn.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the side-fill sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A cardioid rejects most behind; a supercardioid off to each side of the rear. A mic behind the horn has the back of the stage behind it — and the player’s own wedge in front of it, where no null reaches. Real nulls are shallower than the picture.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a spot behind the bell and a front mic can sound hollow together, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: ['hn.two.1', 'hn.two.2', 'hn.two.3', 'hn.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two mics hear the horn at different times — and the front one mostly after the wall. Move or rebalance first; polarity flips the sign and never removes a delay. Judge the pair in mono, at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — the balance between front and rear, the gain stages, the player’s technique, the mount and the combination — before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one horn mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second mic.',
    credit: { scenarios: ['hn.prac.order', 'hn.prac.gain', 'hn.prac.setup1', 'hn.prac.setup2', 'hn.prac.3', 'hn.mix.1', 'hn.mix.2', 'hn.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real horn.' },
    takeaway: 'Safe clearance from the bell and the hand, correct power and headroom, pattern reasoning, the room’s part in the sound, and an accurate account of polarity versus delay pass. A brand or the brightest on-axis spot do not — and more than one setup can pass.',
  },
};

/*
 * THE CHECKS (lesson paragraphs in comments only): hn.snd.* ¶6 (rear bell,
 * wall), ¶7 (hand); hn.set.* ¶7, ¶12, ¶43; hn.mic.* ¶9-¶10, ¶14, ¶20, ¶41;
 * hn.place.* ¶10, ¶14; hn.ctx.* ¶18-¶19; hn.two.* ¶15; hn.prac.* ¶12-¶15,
 * ¶20, ¶72-¶76.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'hn.snd.1',
    page: 'sound',
    prompt: 'Why does a horn sound softer and rounder in front of the player than behind the bell?',
    options: ['The bell points back; in front you hear more of it via the room', 'The valves send a softer copy of the sound forward to the audience', 'The player’s body muffles the sound as it passes through to the front'],
    correct: 'The bell points back; in front you hear more of it via the room',
    explain: 'The bell faces the rear, and the high overtones go mostly where it points. A listener in front hears the horn largely after the wall or shell behind the player has reflected it — softer and blended. Behind the bell, the sound is direct and more forceful.',
    why: {
      'The valves send a softer copy of the sound forward to the audience': 'The valves only switch lengths of tube in or out. Nearly all of the sound leaves from the bell.',
      'The player’s body muffles the sound as it passes through to the front': 'Sound does not pass through the player. It goes round, and — for the overtones — mostly by way of the room.',
    },
  },
  {
    id: 'hn.snd.2',
    page: 'sound',
    prompt: 'In the horn’s air column, where does the pressure swing most, whatever the note?',
    options: ['At the lips, where the mouthpiece closes the tube', 'At the bell, where the tube opens out widest', 'Halfway round the coil, at the middle of the tube'],
    correct: 'At the lips, where the mouthpiece closes the tube',
    explain: 'The mouthpiece end is closed by the lips, so every standing wave has its biggest pressure swing there; the open bell end is a pressure still point. That is why the lips can lock onto the tube’s resonances.',
    why: {
      'At the bell, where the tube opens out widest': 'The open bell is where the pressure stands still. The pressure swings most at the closed, lip end.',
      'Halfway round the coil, at the middle of the tube': 'The middle can be a still point or a peak, depending on the shape. Only the lip end is a peak for every shape.',
    },
  },
  {
    id: 'hn.snd.3',
    page: 'sound',
    prompt: 'The horn plays a loud, high note. Where do its high overtones mostly go?',
    options: ['Out along the bell’s axis, behind the player', 'Evenly all round the player, like the lowest notes', 'Forward to the audience, past the player’s chest'],
    correct: 'Out along the bell’s axis, behind the player',
    explain: 'High overtones leave mostly in the direction the bell points — for the horn, behind and out to the right. The lowest notes spread nearly all round. A mic on the bell’s axis hears the most edge.',
    why: {
      'Evenly all round the player, like the lowest notes': 'Only the low notes spread nearly all round. The higher the overtone, the more it follows the bell.',
      'Forward to the audience, past the player’s chest': 'The bell points back, so the high overtones go back first, and reach the front mostly by the wall.',
    },
  },
  hearingCheck('hn.set.1', W),
  {
    id: 'hn.set.2',
    page: 'setting',
    prompt: 'You plan a stand behind the horn player. What must its mic, boom and base stay clear of?',
    options: ['The bell rising in “bells up”, the right hand and the player’s turn', 'Only the bell itself — the player’s movements are their own business', 'The music stand in front, so the player can read the part clearly'],
    correct: 'The bell rising in “bells up”, the right hand and the player’s turn',
    explain: 'A rear mic must not collide when the player turns or raises the horn: leave a buffer round the whole expected movement, the right hand’s way into the bell, and a mute going in and out.',
    why: {
      'Only the bell itself — the player’s movements are their own business': 'The player’s movement is exactly what a rear stand can hit. Clearance covers all of it.',
      'The music stand in front, so the player can read the part clearly': 'Sight lines matter, but a rear stand’s risk is the bell, the hand and the player turning.',
    },
  },
  {
    id: 'hn.set.3',
    page: 'setting',
    prompt: 'Before placing any mic, what do you ask the horn player?',
    options: ['To show open, stopped, muted and “bells up” passages', 'To move the right hand out of the bell for the mic', 'Nothing: the bell’s direction says where the mic goes'],
    correct: 'To show open, stopped, muted and “bells up” passages',
    explain: 'Each of these changes the sound or the space the horn needs. Let the player demonstrate them; never reposition their hand or their horn to fit a mic.',
    why: {
      'To move the right hand out of the bell for the mic': 'The hand in the bell is part of how the horn is played. The mic fits round it, never the other way.',
      'Nothing: the bell’s direction says where the mic goes': 'The bell says where the sound goes. The passages say how much room the horn and the hand need.',
    },
  },
  {
    id: 'hn.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · In a good hall, a mic in front of the horn player mostly hears…',
    options: ['The horn by way of the room — softer and blended', 'The bell’s direct sound — the brightest and hardest', 'Mostly the valves’ clicks, as the bell points away'],
    correct: 'The horn by way of the room — softer and blended',
    explain: 'The bell points back, so a front mic hears the low notes directly and the overtones mostly after the wall. That is the familiar concert horn — if the room is good.',
    why: {
      'The bell’s direct sound — the brightest and hardest': 'That is what a mic behind the bell, on its axis, tends to hear.',
      'Mostly the valves’ clicks, as the bell points away': 'A front mic hears plenty of horn — mostly by the room. Valve noise is a close-mic detail.',
    },
  },
  {
    id: 'hn.mic.1',
    page: 'microphone',
    prompt: 'A horn-and-piano session puts a figure-8 above the horn. What makes that pattern useful there?',
    options: ['Its sides reject, so a side can face the piano', 'Its back is silent, so the room stays out of it', 'It hears only straight down, so nothing else gets in'],
    correct: 'Its sides reject, so a side can face the piano',
    explain: 'A figure-8 hears its front and its back equally and rejects its sides. Aimed at the horn with a side toward the piano, it favours the horn without a deep cut of the room.',
    why: {
      'Its back is silent, so the room stays out of it': 'A figure-8’s back hears as strongly as its front. Its nulls are at the sides.',
      'It hears only straight down, so nothing else gets in': 'It hears front and back; only the sides are rejected — and real nulls are shallower than the picture.',
    },
  },
  {
    id: 'hn.mic.2',
    page: 'microphone',
    prompt: 'You plan a ribbon spot for the horn. Can you switch on phantom power for the channel without a check?',
    options: ['No — read that ribbon’s manual on phantom first', 'Yes — a ribbon needs phantom power to work at all', 'Yes — phantom power has no effect on a ribbon'],
    correct: 'No — read that ribbon’s manual on phantom first',
    explain: 'Ribbons differ: some passive ribbons must not get phantom power (or a faulty cable with it), others need it for their electronics. Follow the model’s own manual — and keep it out of any blast of air.',
    why: {
      'Yes — a ribbon needs phantom power to work at all': 'Many passive ribbons need no power, and some can be harmed by it. Check the model.',
      'Yes — phantom power has no effect on a ribbon': 'It can matter a great deal for some ribbons. The manual decides.',
    },
  },
  {
    id: 'hn.mic.3',
    page: 'microphone',
    prompt: 'The horn’s strongest accents swing the meter hard. Which property matters most in your choice?',
    options: ['Headroom for the strongest accent at that distance', 'The largest diaphragm, for the roundest horn sound', 'The pattern that hears the bell’s axis the brightest'],
    correct: 'Headroom for the strongest accent at that distance',
    explain: 'Brass peaks can overload a mic’s own electronics or a wireless pack before the desk shows it. Check the mic’s maximum level at the distance you use, and set gain on the strongest real accent.',
    why: {
      'The largest diaphragm, for the roundest horn sound': 'A larger diaphragm is not a promise of a rounder sound — and it says nothing about overload.',
      'The pattern that hears the bell’s axis the brightest': 'Brightness is a placement choice. The accents’ level is a headroom question.',
    },
  },
  {
    id: 'hn.mic.4',
    page: 'microphone',
    prompt: 'A bell clip works well on a trumpet. What makes a clip acceptable on a horn?',
    options: ['Its maker confirms it fits this horn — with the player’s agreement', 'It fits a trumpet’s bell, so it will fit the larger horn bell as well', 'It clamps the detachable bell joint, the strongest part'],
    correct: 'Its maker confirms it fits this horn — with the player’s agreement',
    explain: 'A general brass clip is not proof of a fit on a horn. Only a clip its maker confirms for this horn and finish, never on the detachable bell joint or where the hand goes — else use a stand.',
    why: {
      'It fits a trumpet’s bell, so it will fit the larger horn bell as well': 'A different bell size and finish — and the hand inside it. A fit must be confirmed for this horn.',
      'It clamps the detachable bell joint, the strongest part': 'Never load the detachable joint. Nothing clamps there.',
    },
  },
  {
    id: 'hn.place.1',
    page: 'placement',
    prompt: 'A starting point reads “50 cm–1 m from the bell”. Your readout says 70 cm from the horn’s coil. Are you in it?',
    options: ['Not necessarily — measure from the bell, as it names', 'Yes: 70 cm falls inside 50 cm–1 m wherever it is', 'Yes, as long as the mic is aimed at the horn'],
    correct: 'Not necessarily — measure from the bell, as it names',
    explain: 'A distance means something only with the part it is measured from. On a horn the coil and the bell are far apart — and point different ways — so 70 cm from the coil can be anywhere relative to the bell.',
    why: {
      'Yes: 70 cm falls inside 50 cm–1 m wherever it is': 'Same number, different place. The starting point is measured from the bell.',
      'Yes, as long as the mic is aimed at the horn': 'Aim is a separate check. The distance is read from the part the starting point names.',
    },
  },
  {
    id: 'hn.place.2',
    page: 'placement',
    prompt: 'Your rear mic is 75 cm from the bell, about 20° off its axis, low, aimed toward it and clear of the bell’s rise. Is that a sensible place to begin?',
    options: ['Yes — then move off axis or farther if it sounds hard', 'No — a horn is only ever miked from in front of the player', 'No — the mic belongs right on the bell’s axis'],
    correct: 'Yes — then move off axis or farther if it sounds hard',
    explain: 'That is the bell-side starting point: behind and beside the bell, low, aimed toward it a little off axis. From there, listen and move one thing at a time.',
    why: {
      'No — a horn is only ever miked from in front of the player': 'Both schools are in use: the front view for the horn with its room, the bell side for control. Neither is the only way.',
      'No — the mic belongs right on the bell’s axis': 'Right on the axis is the brightest, hardest view. Off axis is where we suggest you begin.',
    },
  },
  {
    id: 'hn.place.3',
    page: 'placement',
    prompt: 'You move the rear mic from off axis onto the bell’s axis. What tends to change?',
    options: ['More edge and brightness, and bigger level swings', 'A rounder, more distant horn, with more of the room', 'Nothing much — a horn sounds alike from all angles'],
    correct: 'More edge and brightness, and bigger level swings',
    explain: 'The bell beams its high overtones along its axis. On axis a mic hears the most edge — and the hand and bell detail — while off axis softens it. Compare at matched level.',
    why: {
      'A rounder, more distant horn, with more of the room': 'That is what moving off axis, farther, or to the front tends to do.',
      'Nothing much — a horn sounds alike from all angles': 'The bell makes the higher overtones directional: the angle matters a lot.',
    },
  },
  {
    id: 'hn.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What must a mic behind the horn, its stand and its cable stay clear of?',
    options: ['The bell’s rise, the right hand and the player’s turn', 'The music stand, so the player can still read the part', 'The audience’s view of the horn player’s face'],
    correct: 'The bell’s rise, the right hand and the player’s turn',
    explain: 'Clearance comes first: the bell lifting for “bells up”, the right hand and a mute at the bell, and the player turning. Stop the player before anything moves.',
    why: {
      'The music stand, so the player can still read the part': 'Sight lines matter, but the safety question is what moves: the bell, the hand and the player.',
      'The audience’s view of the horn player’s face': 'The view matters less than the movement a rear mic can be hit by.',
    },
  },
  feedbackFirst('hn.ctx.1', 'horn'),
  superNull('hn.ctx.2', 'context', 'side-fill'),
  {
    id: 'hn.ctx.studio',
    page: 'context',
    prompt: 'A horn and piano in a good hall. What could justify front spots and a main pair, and no mic behind the bell?',
    options: ['The room’s reflection is part of the horn sound wanted', 'A mic behind the bell cannot pick up a horn at all', 'Mics behind the bell suit live work only, not a hall'],
    correct: 'The room’s reflection is part of the horn sound wanted',
    explain: 'In a good room, the reflected sound from in front is the horn most listeners know. A rear spot adds control when the music or the stage needs it.',
    why: {
      'A mic behind the bell cannot pick up a horn at all': 'A rear mic hears the horn very directly. The question is whether that is the sound wanted.',
      'Mics behind the bell suit live work only, not a hall': 'A rear spot can help a featured line in a studio too. It depends on the goal and the room.',
    },
  },
  {
    id: 'hn.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Why is the wall behind a horn player part of the horn’s sound?',
    options: ['The bell points at it, and it reflects to the front', 'It stops the valve noise from reaching the audience', 'The low notes leave the tube there, not at the bell'],
    correct: 'The bell points at it, and it reflects to the front',
    explain: 'The bell faces the rear, so the wall or shell behind sends the horn’s overtones on toward the audience — brightly if it is hard, softly if it is a curtain.',
    why: {
      'It stops the valve noise from reaching the audience': 'The wall reflects the horn’s sound; it is not a shield for the valves.',
      'The low notes leave the tube there, not at the bell': 'All the notes leave from the bell. The low ones simply spread all round.',
    },
  },
  {
    id: 'hn.two.1',
    page: 'twoMic',
    prompt: 'Why can a spot behind the bell and a front mic sound hollow together?',
    options: ['They hear the horn at different times, so some pitches cancel', 'The front mic inverts the sound, because the bell faces away from it', 'Two mics on one horn cancel each other’s low end in the sum'],
    correct: 'They hear the horn at different times, so some pitches cancel',
    explain: 'The front mic hears each note later — and mostly by the wall. Summed, some pitches arrive out of step and cancel: a comb of notches. Move or rebalance first, then check polarity at matched levels.',
    why: {
      'The front mic inverts the sound, because the bell faces away from it': 'Facing away changes the tone and the timing, not the sign of the sound.',
      'Two mics on one horn cancel each other’s low end in the sum': 'Cancellation depends on the delay and the levels: some pitches dip, others add.',
    },
  },
  polarityDelay('hn.two.2'),
  matchedLevels('hn.two.3', 'horn'),
  {
    id: 'hn.two.4',
    page: 'twoMic',
    prompt: 'A horn section plays in a good hall with a main pair up. Does the horn need a spot?',
    options: ['Only if its line is not carried at the audience position', 'Yes: each horn line in the section needs a spot mic of its own', 'Yes, one for the bell and one more for the valves'],
    correct: 'Only if its line is not carried at the audience position',
    explain: 'Start by listening to the main or section mics. Add a horn spot only if the line is missing at the audience position — and check it in mono with the main pair.',
    why: {
      'Yes: each horn line in the section needs a spot mic of its own': 'A good main pickup often carries the horn with its room. A spot should earn its place.',
      'Yes, one for the bell and one more for the valves': 'The sound leaves from the bell; a valve mic adds noise, not horn.',
    },
  },
  gainCheck('hn.prac.gain', W),
  {
    id: 'hn.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second horn channel?',
    options: ['The first works alone, the pair adds something, it holds in mono', 'Two channels give the mix engineer more options to choose from later on', 'The horn needs more level in the mix than one mic can give'],
    correct: 'The first works alone, the pair adds something, it holds in mono',
    explain: 'A second mic blends a different perspective — and a delay. If the pair loses body, move or rebalance it, check polarity — or leave it out.',
    why: {
      'Two channels give the mix engineer more options to choose from later on': 'More channels add spill, a cable and a combining check. A second mic should earn its place.',
      'The horn needs more level in the mix than one mic can give': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'hn.mix.1',
    page: 'practice',
    prompt: 'A starting point reads “40–80 cm in front of the horn, above it”. What is it measured from?',
    options: ['The horn itself — its coil, where the player holds it', 'The bell’s rim, the part where the sound leaves the horn', 'The player’s lips, at the mouthpiece, where it starts'],
    correct: 'The horn itself — its coil, where the player holds it',
    explain: 'A distance belongs to the part it names. The front spots are measured from the horn in the player’s hands; the rear spot from the bell — two places far apart on a horn.',
    why: {
      'The bell’s rim, the part where the sound leaves the horn': 'That is the rear starting point’s reference. This one names the horn, in front of the player.',
      'The player’s lips, at the mouthpiece, where it starts': 'Nothing is measured from the player’s face; the starting point names the horn.',
    },
  },
  nullOnPaper('hn.mix.2', 'side-fill'),
  removeDelay('hn.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'hn.sym.hard',
    observation: 'The horn sounds like a hard, direct brass source',
    firstChecks: 'A rear spot dominating the reflected sound: compare the front or main view, rebalance, or move the spot off axis.',
    options: ['Compare the front view and rebalance, or move off axis', 'Cut the high frequencies on the horn channel first, before anything else', 'Ask the player to take the hand out of the bell'],
    correct: 'Compare the front view and rebalance, or move off axis',
    explain: 'Behind the bell, on its axis, a mic hears the most edge. Bring in the front view, rebalance, or move the spot off axis or farther before reaching for EQ.',
    why: {
      'Cut the high frequencies on the horn channel first, before anything else': 'EQ dulls the whole horn. The cause is the spot’s view of the bell.',
      'Ask the player to take the hand out of the bell': 'The hand is part of the horn’s sound and technique. Never ask to change it for a mic.',
    },
  },
  {
    id: 'hn.sym.lost',
    observation: 'The horn seems distant or lost',
    firstChecks: 'The main mic hears too much room or too many players: move or aim a safe spot and rebalance at the audience position.',
    options: ['Move or aim a safe spot, and rebalance as heard out front', 'Push the main pair’s level up until the horn comes forward', 'Add reverb to the horn, so it seems bigger in the mix'],
    correct: 'Move or aim a safe spot, and rebalance as heard out front',
    explain: 'A main pickup can carry too much room or too many neighbours for a horn line. A spot — front or rear — gives control; judge the balance where the audience listens.',
    why: {
      'Push the main pair’s level up until the horn comes forward': 'That raises everything else too. The horn needs its own share, not more of the room.',
      'Add reverb to the horn, so it seems bigger in the mix': 'More room makes a distant horn more distant. Add direct sound first.',
    },
  },
  distortSymptom('hn.sym.distort'),
  {
    id: 'hn.sym.stopped',
    observation: 'A hand-stopped passage jumps in colour and level',
    firstChecks: 'That may be the player’s intended change: hear it acoustically, then adjust the spot’s balance only as needed.',
    options: ['Hear it without the mic first; adjust balance only if needed', 'Compress the channel hard so the stopped notes even out with the rest', 'Ask the player to avoid stopping the notes on stage'],
    correct: 'Hear it without the mic first; adjust balance only if needed',
    explain: 'Hand-stopping gives a keen, metallic sound on purpose. Check what the player intends before treating it as a fault; preserve the technique.',
    why: {
      'Compress the channel hard so the stopped notes even out with the rest': 'That flattens a colour the music asks for. Find out what is intended first.',
      'Ask the player to avoid stopping the notes on stage': 'The technique is the music. The mic setup should allow for it.',
    },
  },
  {
    id: 'hn.sym.hit',
    observation: 'The mute or the hand hits the mic hardware',
    firstChecks: 'The real mute path and hand movement were not checked: stop, move the mic or clip, and let the player demonstrate again.',
    options: ['Stop, move the mic or clip, and let the player show it again', 'Ask the player to keep the hand still during the concert', 'Tape the cable to the bell so it cannot swing into the hand'],
    correct: 'Stop, move the mic or clip, and let the player show it again',
    explain: 'The hand, the mute and the bell’s rise need room. Stop, reposition, and recheck the whole movement with the player demonstrating it.',
    why: {
      'Ask the player to keep the hand still during the concert': 'The hand moves to play. The mic gives way, not the player.',
      'Tape the cable to the bell so it cannot swing into the hand': 'Nothing goes on the bell’s finish, and a taped cable can still meet the hand.',
    },
  },
  hollowSymptom('hn.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'hn.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic horn setup in the order you would do them.',
    steps: [
      { text: 'Ask the player to show soft, loud, stopped, muted and “bells up” passages', early: 'Start with the player and the music.' },
      { text: 'Listen from an audience seat in front and from beside the bell', early: 'Listen before choosing a mic or a side.' },
      { text: 'Choose front or bell side, the mic and a stand (or an approved clip)', early: 'Choose once you have heard both sides.' },
      { text: 'With the player stopped, place it clear of the bell’s rise and the hand', early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom on if needed', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set gain on the strongest real accent, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare distance and angle one change at a time, matched levels', early: 'Compare only once the level is set safely.' },
      { text: 'Secure the stand and cable; recheck the player’s full movement', early: 'Secure it last, then watch the bell rise and the player turn again.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before switching it — and check a ribbon’s manual first. Gain: set it with headroom for the strongest accent.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'hn.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A loud stage with a rock band. One channel for a featured horn; the drums and a side-fill sit behind the horn section.',
    setups: [
      { id: 'a', label: 'Small dynamic behind and beside the bell, low, aimed toward it a little off axis, its rear toward the fill', ok: true, power: 'none', feedback: 'A suggested starting point: close, directional, its rejection aimed at the back of the stage — clear of the bell’s rise.' },
      { id: 'b', label: 'A clip its maker confirms for this horn, on the bell rim (not the joint), checked for noise and feedback', ok: true, power: 'phantom', feedback: 'A suggested option when a confirmed clip exists: it moves with the bell. Check the fit, the finish and the cable.' },
      { id: 'c', label: 'One small condenser 2 m in front of the player, for the natural reflected sound', ok: false, power: 'phantom', feedback: 'A good hall view — but on a loud stage it hears the band far more than the horn.' },
      { id: 'd', label: 'A trumpet clip on the detachable bell joint, for the strongest grip', ok: false, power: 'phantom', feedback: 'Never load the detachable joint, and a trumpet clip is not a confirmed horn fit.' },
      { id: 'e', label: 'A mic pushed into the bell beside the hand, for the most level', ok: false, power: 'none', feedback: 'Nothing goes into the bell or where the hand works. Level comes from gain, not from the hand’s space.' },
    ],
    reasons: [docReason('the bell'), clearReason('the bell’s rise, the right hand and the player’s turn'), POWER_REASON, { id: 'r.null', label: 'The mic’s rejection points at the side-fill and the drums behind', role: 'optional', feedback: 'A fair live reason: aim the null at the loudest source behind.' }, BRAND_REASON('horn'), LOUD_REASON],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point from its named part, clearance from the bell and the hand, and the power the mic needs.',
  },
  {
    id: 'hn.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · Studio. A horn and piano recital in a good-sounding hall, a main pair already up; the producer wants a little more horn definition.',
    setups: [
      { id: 'a', label: 'A figure-8 in front, above the horn, a side toward the piano, raised under the main pair and checked in mono', ok: true, power: 'none', feedback: 'A suggested starting point: a front spot that keeps the room in the horn, its side null on the piano.' },
      { id: 'b', label: 'A small dynamic behind and beside the bell, off axis, at a modest level under the main pair', ok: true, power: 'none', feedback: 'A suggested starting point for control — keep it low in the balance so the reflected sound still leads; check it in mono.' },
      { id: 'c', label: 'A mic right on the bell’s axis, 15 cm away, for maximum clarity', ok: false, power: 'none', feedback: 'That is the hardest, brightest view, with the biggest level swings — and far from the recital sound.' },
      { id: 'd', label: 'A reflective panel behind the player, every time, to brighten the horn', ok: false, power: 'none', feedback: 'Not an automatic fix: a panel changes the tone, raises spill and can add a sharp early reflection.' },
      { id: 'e', label: 'Turn the main pair up until the horn is clear enough', ok: false, power: 'phantom', feedback: 'That raises the piano and the room with it. Definition needs a little direct horn, not more of everything.' },
    ],
    reasons: [docReason('the horn or the bell'), clearReason('the bell’s rise, the right hand and the piano'), POWER_REASON, { id: 'r.mono', label: 'I will raise it gradually and check it with the main pair in mono', role: 'optional', feedback: 'A fair reason: a spot supports the main pair, it does not replace it.' }, BRAND_REASON('horn'), { id: 'r.panel', label: 'A panel behind the player always makes a horn better', role: 'wrong', feedback: 'A panel is not an automatic fix — let the room and the player decide.' }],
    explain: 'Two spots pass. What passes is the reasoning: a sensible starting point, clearance, the right power — and a spot that supports the main pair and the room rather than replacing them.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: where does a horn’s sound leave the instrument?', options: ['From the bell, pointing back', 'From the whole coil at once', 'From the valves, forward'], after: 'Now STEP through (or PLAY ONCE) and follow the sound from the lips to the room.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move a mic from behind the bell to in front of the player. What changes?', options: ['More edge and level swings', 'More of the room, softer and blended', 'It depends on this horn and room'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'A side-fill sits on the floor behind the horn section. Where will a cardioid behind the horn, aimed toward the bell, reject it best?', options: ['Straight behind the mic', 'Off to the mic’s side', 'In front of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'Which way does a horn’s bell point while it is played?',
    options: ['Back, behind the player', 'Forward, at the audience', 'Straight up, over the player'],
    correct: 'Back, behind the player',
    explain: 'The horn’s bell faces the rear, beside the player’s right hip — which is why the room behind the player is part of its sound.',
    why: {
      'Forward, at the audience': 'A trumpet’s bell does. The horn’s points back.',
      'Straight up, over the player': 'A tuba or a euphonium usually does. The horn’s points back.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What is the player’s right hand doing in the bell?',
    options: ['Supporting the horn and shading its tone and pitch', 'Covering the bell so the sound goes forward instead', 'Working the valves, which are inside the bell'],
    correct: 'Supporting the horn and shading its tone and pitch',
    explain: 'The right hand holds the horn and shapes its tone and pitch; pushed further in, it stops the note. Never move it to fit a mic.',
    why: {
      'Covering the bell so the sound goes forward instead': 'The hand shades the sound; it does not send it forward. The bell still points back.',
      'Working the valves, which are inside the bell': 'The valves are under the LEFT hand, on the coil.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'What sets the air in the horn’s tube vibrating?',
    options: ['The lips buzzing in the mouthpiece', 'The valves opening and closing quickly', 'The bell ringing like a cymbal'],
    correct: 'The lips buzzing in the mouthpiece',
    explain: 'The player’s lips buzz against the mouthpiece; the air column in the tube rings, and the lips lock onto it.',
    why: {
      'The valves opening and closing quickly': 'The valves choose the tube’s length; they do not make the vibration.',
      'The bell ringing like a cymbal': 'The bell radiates the air’s vibration. The metal itself gives off very little.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'A mic in front of the horn player, compared with one behind the bell, tends to hear…',
    options: ['More of the room — softer and blended', 'More bell edge and bigger level swings', 'Nothing of the horn’s higher notes'],
    correct: 'More of the room — softer and blended',
    explain: 'In front, the overtones arrive mostly by way of the wall; behind the bell, directly. A tendency, to check by ear.',
    why: {
      'More bell edge and bigger level swings': 'That is what a mic behind the bell tends to hear.',
      'Nothing of the horn’s higher notes': 'The higher notes reach a front mic too — mostly by way of the room.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'What must a stand behind the horn player stay clear of?',
    options: ['The bell’s rise, the right hand and the player’s turn', 'The music stand, so the player can read the part', 'The audience’s view of the horn player’s face'],
    correct: 'The bell’s rise, the right hand and the player’s turn',
    explain: 'Clearance comes first: whatever moves — the bell lifting, the hand and mute, the player turning.',
    why: {
      'The music stand, so the player can read the part': 'Sight lines matter, but safety is about what moves.',
      'The audience’s view of the horn player’s face': 'The view matters less than the movement a rear stand can be hit by.',
    },
  },
  hearingDiag('q.6', W),
];

const wedges: Wedge[] = [
  {
    id: 'fill',
    label: 'a side-fill on the floor behind the horn section, facing across the stage',
    short: 'SIDE-FILL',
    p: { x: -1100, y: 0, z: 1600 },
    lift: 150,
    faces: { x: 0.2, y: 0, z: -0.98 },
    note: 'Behind and to the right of the player, facing across the stage: behind a mic that faces toward the horn’s bell — the case a pattern’s rejection can help with.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
  },
  {
    id: 'wedge',
    label: 'the horn player’s own wedge, in front, facing back',
    short: 'WEDGE',
    p: { x: 1400, y: 0, z: 250 },
    lift: 150,
    faces: { x: -0.97, y: 0, z: -0.24 },
    note: 'In front of the player, facing back at them — in FRONT of a mic that faces toward the bell, so no null reaches it. Keep the horn low in this wedge.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
  },
];

export const A03_LESSON: Lesson = {
  id: 'A03',
  labId: 'winds',
  title: 'French Horn',
  subtitle: 'A bell that faces back: the room in front, or a mic beside the bell',
  noun: { one: 'horn', many: 'horns' },
  model: HORN_MODEL,
  micTypeIds: ['smallDynCard', 'sdcCard', 'lbRibbon', 'lbLdc'],
  zones: HORN_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'The horn — often called the French horn — is a brass instrument played by buzzing the lips into a small mouthpiece. Its long, narrow tube is wound into a circle that the player holds in front of the right side of the chest; four rotary valves under the left hand add or remove lengths of tube. Its bell points BEHIND the player, with the right hand inside it.', src: 'Y-HRN-MECH' },
    { title: 'WHERE YOU MEET IT', text: 'Orchestras and wind bands, brass and wind quintets, film and game scores, solo recitals with piano — and, now and then, a horn section on a pop or rock stage. This lesson covers one horn, seated, in the studio and live.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'It blends with the woodwinds and the brass, carries warm melodies and holds the harmony together. Players change its colour with the right hand — open, shaded or “stopped” — and with mutes, and sometimes raise the bell for a brassier “bells up” sound. Ask which of these the music needs.', src: 'Y-HRN-PLAY' },
    { title: 'ITS SIZE', text: 'On the F side of a double horn the tube is about 3.75 m long, coiled into a circle you can hold; its lowest notes reach down to about 62 Hz. This lab draws a double horn held by a seated player, the bell resting behind the right hip.', src: 'PL-2010' },
  ],
  sound: {
    stages: [
      { title: 'The lips buzz', text: 'The player’s lips, pressed to the mouthpiece rim, buzz: they open and close quickly, letting puffs of air into the tube.' },
      { title: 'A pulse runs down the tube', text: 'Each puff sends a pressure pulse along the coiled tube — about 3.75 m of it on the F side. The valves switch extra loops in or out to change its length.' },
      { title: 'The bell turns some of it back', text: 'At the flaring bell, much of the pulse turns back up the tube. Going to and fro, it sets up a standing wave in the air column, and the lips lock onto it — that is what holds the note’s pitch.' },
      { title: 'Sound leaves the bell — backward', text: 'What escapes leaves from the bell, which points behind the player and out to the right. The right hand inside the bell shades the higher overtones and helps set the pitch.' },
      { title: 'The room sends it on', text: 'Behind the player a wall or a shell reflects the sound back toward the audience — brightly if it is hard, softly if it is a curtain. Much of what a listener in front hears has come this way; behind the bell it sounds more forceful.' },
    ],
    attack: 'The start of each note: the tongue releasing the air and the lips starting to buzz — a short edge, carried out of the bell. A mic near the bell’s axis tends to hear more of it; a mic in front, less.',
    body: 'The sustained note: the standing wave in the tube, leaving the bell — the high overtones mostly along the bell’s axis, toward the back, the low notes all round — and then the room. A mic in front hears more of the room’s version; behind the bell, the direct one. Tendencies: horns, hands and rooms vary.',
    head: { diameterMm: 0, rods: 0, label: 'the air column', strikeSrc: 'UNSW-BRASS' },
  },
  setting: {
    items: [
      { id: 'horn', label: 'the horn and the player', short: 'HORN', note: 'The player sits facing the audience, the horn in front of the right side of the chest, the bell behind the right hip pointing back with the right hand inside it. Ringed in amber: the instrument this lesson mics.', prov: { kind: 'illustrative', reason: 'french_horn/GEOMETRY_PROPOSAL.md §1 (drawing defaults, moved clear of the body: LB-02)' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'wall', label: 'the wall or shell behind', short: 'WALL', note: 'The bell points at it. A hard wall or stage shell sends the horn on toward the audience brightly; a curtain or an open stage swallows some of it. It is part of the horn’s sound — walk the room before placing a mic.', prov: { kind: 'sourced', src: 'Y-HRN-MECH', quote: 'it loses its edge when it reflects off of the wall' }, tag: 'PART OF THE SOUND', scene: 'all' },
      { id: 'stand', label: 'the music stand', short: 'MUSIC STAND', note: 'In front of the player. The player must see the part and the conductor: a front mic should not block that line.', prov: { kind: 'illustrative', reason: 'a typical seat' }, tag: 'SIGHT LINE', scene: 'kit' },
      { id: 'horn2', label: 'a second horn beside', short: 'HORN 2', note: 'Horns often sit in a section, side by side. A mic behind one bell hears the next bell too — aim and distance decide how much.', prov: { kind: 'illustrative', reason: 'a typical section seating' }, tag: 'SPILL', scene: 'kit' },
      { id: 'tuba', label: 'low brass beside', short: 'LOW BRASS', note: 'The low brass often sits close by. Its sound reaches a horn mic, and its bell can point near the same space behind.', prov: { kind: 'illustrative', reason: 'a typical wind-band seating' }, tag: 'SPILL', scene: 'kit' },
      { id: 'fill', label: 'a side-fill behind the section', short: 'SIDE-FILL', note: 'On a loud stage a fill speaker, or the drums, can sit behind the horns — right behind a mic that faces the bell. The next pages aim a pattern’s rejection at it.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'wedge', label: 'the horn player’s wedge', short: 'WEDGE', note: 'In front of the player, facing back at them: loud, and in FRONT of a mic behind the horn, where no null can reach it.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Live, the audience hears the horn mostly by way of the stage and the room; the PA adds what the room needs.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'piano', label: 'the piano (a recital)', short: 'PIANO', note: 'For a horn-and-piano recital, the piano sits close by. A front spot can turn a figure-8’s side toward it.', prov: { kind: 'sourced', src: 'IHS-ROSTRUP', quote: 'One figure-8 microphone side-rejecting the piano sound from above the horn' }, tag: 'SPILL', scene: 'studio' },
      { id: 'main', label: 'a main pair in front', short: 'MAIN PAIR', note: 'A main pair in front of the players hears the horn with its reflection — the sound most listeners know. A horn spot supports it.', prov: { kind: 'sourced', src: 'IHS-ROSTRUP', quote: 'a quasi ORTF some four meters from the piano' }, tag: 'MAIN PAIR', scene: 'studio' },
    ],
    stage: 'LIVE: monitors and fills feed the players, the PA faces the audience, and the band reaches every open mic. A featured horn on a loud stage pushes toward a close, aimed mic beside the bell — or a clip made for this horn.',
    studio: 'STUDIO: no monitors, a room that may sound good, and repeated trials when the player stops. In a good room, a main pair and front spots carry the horn with its reflection; a rear spot adds control if the music needs it.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic horn setup for a given room and performance — front view or bell side — describe an alternative, and explain what would justify a second mic. With a real horn and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'room', label: 'Room or stage, and the wall behind the player', kind: 'text' },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small dynamic, cardioid', 'small condenser', 'ribbon, figure-8', 'large condenser', 'other'] },
      { id: 'zone', label: 'Starting position you tried (front or bell side)', kind: 'text' },
      { id: 'distance', label: 'Distance, from the bell or the horn', kind: 'text' },
      { id: 'aim', label: 'Aim, and where the monitors sit off it', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The horn’s bell diameter (the maker prints a size letter only): drawn 310 mm — a drawing default, never a readout (LB-01).', dims: [] },
    { text: 'The horn’s overall height as held, the coil’s diameter (260 mm), the rotary valves’ size and the tuning slides — drawing defaults.', dims: [] },
    { text: 'The seated pose: where the bell rests (behind and right of the right hip, moved clear of the body: LB-02), its angle (back, 26° out, 10° down), the right arm bent back to the bell, the left hand on the levers, the chair (seat 460 mm) — drawing defaults.', dims: [] },
    { text: 'The keep-outs: the bell’s opening (11 cm beyond the rim), the right hand’s way into the bell, the bell rising about 40° for “bells up” — illustrative.', dims: [] },
    { text: 'Every starting point’s distance: no published horn number — behind the bell 50–100 cm, the front spots 40–80 cm (above) and 40–70 cm (below) are drawing defaults (LB-04, LB-05).', dims: [] },
    { text: 'The wall behind the player (0.8–2.5 m on the sound page) and the listener in front (2.2 m) — illustrative; the paths are straight lines with one reflection.', dims: [] },
    { text: 'The ribbon’s and the large condenser’s body sizes — drawing defaults.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. Two schools are in use for the horn: a front view that hears it with the room, and a mic beside the bell for control; both are places to begin. Every horn, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: one player in a typical posture, the bell and the hands’ space shown as keep-outs, mic patterns and the two-mic comb as textbook shapes, and sound paths as straight lines. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped, and only with their agreement.',
  copy: HORN_COPY,
};
