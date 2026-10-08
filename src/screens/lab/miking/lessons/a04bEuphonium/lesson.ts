/**
 * A04b EUPHONIUM — the lesson's pages as DATA (blueprint §7). The words come
 * from the owner's lesson (docs/labs/miking/source_text/Euphonium-Miking-
 * Technique-Research.txt), with the family's fixes logged in
 * docs/labs/miking/CORRECTIONS_LOG.md applied.
 *
 * OWNER RULING 2026-10-04 — learner-facing presentation: suggested starting
 * points, never dogma; no source, brand or model in learner text; no badges.
 * FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, LessonPages, PageContent, SourcePageId, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, LOUD_REASON, POWER_REASON, clearReason, distortSymptom, docReason, feedbackFirst, gainCheck, hearingCheck, hearingDiag, hollowSymptom, matchedLevels, nullOnPaper, polarityDelay, removeDelay, superNull, type Words } from '../shared/lowbrass/lowBrassItems.ts';
import { EUPH_MODEL } from './geometry.ts';
import { EUPH_ZONES } from './model.ts';
import { EUPH_COPY } from './copy.ts';

const W: Words = { noun: 'euphonium', player: 'euphonium player', moving: 'the bell’s tilt and both valve hands' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the euphonium',
    goal: 'Get to know the euphonium — what it is, where you meet it, what it does in the music, and its parts, from the mouthpiece to the bell — and which way its bell points, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The lips buzz; the air in a widening tube vibrates; the round sound leaves from the bell — up on most euphoniums, to the front on a bell-front model. Find the bell before anything else.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how buzzing lips become a euphonium note — the pulse down the tube, the standing wave, the bell — and where the bell sends the sound.',
    credit: { scenarios: ['eu.snd.1', 'eu.snd.2', 'eu.snd.3'], interactive: 'soundPath', note: 'Step the sequence through to the end (or play it once), and answer the three checks.' },
    takeaway: 'Nearly all of the sound leaves from the bell. The low notes spread nearly all round; the attacks and upper overtones go where the bell points — up, or to the front. Tendencies: euphoniums and rooms vary.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the euphonium’s surroundings — the chair and the path to stand, both valve hands, the bell’s tilt, the neighbours — what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['eu.set.1', 'eu.set.2', 'eu.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The bell, both valve hands and the player’s path to stand are the player’s space: no mic, boom or cable goes there. Identify the horn and its bell, hear the line, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the euphonium by its properties — pattern, headroom, airflow and mount — not by its brand or its diaphragm size.',
    credit: { scenarios: ['eu.mic.1', 'eu.mic.2', 'eu.mic.3', 'eu.mic.4', 'eu.rec.1'], note: 'Answer the five checks (one reaches back to how the euphonium sounds).' },
    takeaway: 'A dynamic, a condenser or a ribbon can all be auditioned within their specifications. A larger diaphragm is no promise of roundness; headroom, the pattern, a ribbon’s airflow rule and a confirmed mount matter more.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — about two feet above an upright bell aimed toward its edge, or a foot or two from the bell slightly off axis — clear of the bell’s tilt and the path to stand; then move the mic and see what changes.',
    credit: { scenarios: ['eu.place.1', 'eu.place.2', 'eu.place.3', 'eu.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different suggested starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A suggested zone is a place to begin, measured from a named part — the bell, or the euphonium — not a rule. Aim toward the edge of an upright bell, never down into it. Clearance comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim a mic in front of a bell-front euphonium so its rejection faces the player’s wedge — and know what a pattern cannot do, and when a close mic is not needed.',
    credit: { scenarios: ['eu.ctx.1', 'eu.ctx.2', 'eu.ctx.studio', 'eu.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A cardioid rejects most behind; a supercardioid off to each side of the rear. Test with the full band: a mic that sounds good solo may be full of drums. Real nulls are shallower than the picture.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a spot and a farther mic on one euphonium can sound hollow together, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: ['eu.two.1', 'eu.two.2', 'eu.two.3', 'eu.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two mics at different distances hear the euphonium at different times: some pitches cancel in the sum. Move or rebalance first; polarity flips the sign and never removes a delay. Judge the pair in mono, at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — the angle and distance, the gain stages, a filter, the room, the balance with the ensemble and the mount — before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one euphonium mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second mic.',
    credit: { scenarios: ['eu.prac.order', 'eu.prac.gain', 'eu.prac.setup1', 'eu.prac.setup2', 'eu.prac.3', 'eu.mix.1', 'eu.mix.2', 'eu.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real euphonium.' },
    takeaway: 'The horn identified and its bell found, safe clearance from the tilt, the hands and the path to stand, headroom, pattern reasoning and an accurate account of polarity versus delay pass. A brand or a diaphragm size do not — and more than one setup can pass.',
  },
};

/* THE CHECKS (lesson paragraphs in comments only): eu.snd.* ¶6-¶7; eu.set.*
 * ¶6-¶7, ¶12; eu.mic.* ¶10, ¶15-¶16, ¶23; eu.place.* ¶9-¶14, ¶20; eu.ctx.*
 * ¶18, ¶22; eu.two.* ¶19; eu.prac.* ¶12-¶15, ¶23-¶24. */
const scenarios: MikingScenario[] = [
  {
    id: 'eu.snd.1',
    page: 'sound',
    prompt: 'A euphonium and a baritone horn share a pitch. What gives the euphonium its fuller, rounder sound?',
    options: ['A more conical tube and a larger bell', 'A fourth valve, which adds the roundness', 'A much longer tube, a full octave lower'],
    correct: 'A more conical tube and a larger bell',
    explain: 'Its widening (conical) tube and larger bell give the euphonium its rounder tone. Both instruments come with three or four valves, and they share the same B♭ pitch.',
    why: {
      'A fourth valve, which adds the roundness': 'A fourth valve extends the range downward; both instruments come with three or four.',
      'A much longer tube, a full octave lower': 'They share the same B♭ pitch. The bore and the bell make the difference.',
    },
  },
  {
    id: 'eu.snd.2',
    page: 'sound',
    prompt: 'A bell-front euphonium plays a loud phrase. Where do its upper overtones mostly go?',
    options: ['Forward, round the bell’s axis — toward the audience', 'Straight up, the same way as from an upright bell', 'Evenly all round, just like its lowest notes'],
    correct: 'Forward, round the bell’s axis — toward the audience',
    explain: 'The overtones follow the bell’s axis. A front bell sends them forward — toward the audience and any mic in front; an upright bell sends them up.',
    why: {
      'Straight up, the same way as from an upright bell': 'That is the upright model. Turning the bell forward turns the overtones with it.',
      'Evenly all round, just like its lowest notes': 'Only the lowest notes spread nearly all round. The overtones follow the bell.',
    },
  },
  {
    id: 'eu.snd.3',
    page: 'sound',
    prompt: 'In the euphonium’s air column, where does the pressure swing most, whatever the note?',
    options: ['At the lips, where the mouthpiece closes the tube', 'At the bell, where the tube is open and widest', 'At the valves, where the tube’s length is switched'],
    correct: 'At the lips, where the mouthpiece closes the tube',
    explain: 'The lips close the mouthpiece end, so every standing wave has its biggest pressure swing there; the open bell is a pressure still point. The lips lock onto the tube’s resonances.',
    why: {
      'At the bell, where the tube is open and widest': 'The open bell is where the pressure stands still.',
      'At the valves, where the tube’s length is switched': 'The valves change the length of the column; the swing is greatest at the closed, lip end.',
    },
  },
  hearingCheck('eu.set.1', W),
  {
    id: 'eu.set.2',
    page: 'setting',
    prompt: 'A mic was set “in front of the player” for an upright euphonium. A bell-front model arrives instead. What changes?',
    options: ['Where the bell is — re-place the mic for the new bell', 'Nothing: the player still sits in the same place', 'Only the gain, since a front bell is a little louder'],
    correct: 'Where the bell is — re-place the mic for the new bell',
    explain: '“In front of the player” has a different relationship to each bell. Point the stand in the new bell’s real direction, and recheck the clearance and the player’s path to stand.',
    why: {
      'Nothing: the player still sits in the same place': 'The player may not move — the bell does. The mic follows the bell.',
      'Only the gain, since a front bell is a little louder': 'The whole relationship changes: direction, distance and what the mic hears.',
    },
  },
  {
    id: 'eu.set.3',
    page: 'setting',
    prompt: 'Before placing any mic, what do you ask the euphonium player?',
    options: ['The model, where its bell points, and whether they stand', 'Whether it is really a baritone, to choose a brand of mic', 'Nothing: euphoniums all point their bells upward'],
    correct: 'The model, where its bell points, and whether they stand',
    explain: 'Names vary and some bell-front models are called baritones: look at the actual horn and its bell. Ask about the line, the lowest note needed, any mute — and whether the player rises to stand.',
    why: {
      'Whether it is really a baritone, to choose a brand of mic': 'The name does not choose a mic. The bell’s direction and the player’s movement decide the placement.',
      'Nothing: euphoniums all point their bells upward': 'Most do, but bell-front models are made for forward projection. Look first.',
    },
  },
  {
    id: 'eu.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · An upright euphonium’s upper overtones leave mostly…',
    options: ['Up, round the bell’s axis', 'Forward, past the player', 'Evenly in all directions'],
    correct: 'Up, round the bell’s axis',
    explain: 'The overtones follow the bell. From an upright bell they go up — which is why a mic above the bell, aimed toward its edge, hears them.',
    why: {
      'Forward, past the player': 'That is a bell-front euphonium.',
      'Evenly in all directions': 'Only the lowest notes spread nearly all round.',
    },
  },
  {
    id: 'eu.mic.1',
    page: 'microphone',
    prompt: 'Why keep a ribbon away from, and off the axis of, an upright euphonium’s bell?',
    options: ['The bell’s air can reach a ribbon placed close over it', 'A ribbon cannot hear a euphonium’s low notes at all', 'Its figure-8 back would cancel the bell’s sound'],
    correct: 'The bell’s air can reach a ribbon placed close over it',
    explain: 'An upward bell can direct air at a mic very close over its opening, and a ribbon is delicate. Follow that ribbon’s protection guidance; keep it farther away and off the axis.',
    why: {
      'A ribbon cannot hear a euphonium’s low notes at all': 'Ribbons are used on low brass. The risk is the air, not the pitch.',
      'Its figure-8 back would cancel the bell’s sound': 'A figure-8 hears its back as strongly as its front; nothing cancels the bell.',
    },
  },
  {
    id: 'eu.mic.2',
    page: 'microphone',
    prompt: 'Does a larger diaphragm guarantee a round euphonium sound?',
    options: ['No — the actual mic, its pattern and placement decide', 'Yes — a larger diaphragm gives a rounder, fuller tone', 'Yes, as long as it is a condenser and not a dynamic'],
    correct: 'No — the actual mic, its pattern and placement decide',
    explain: 'A larger diaphragm is no guarantee. The model’s pattern, its maximum level, its handling and power — and where it sits — matter more.',
    why: {
      'Yes — a larger diaphragm gives a rounder, fuller tone': 'Diaphragm size alone does not decide the tone. Placement and the actual mic do.',
      'Yes, as long as it is a condenser and not a dynamic': 'Dynamics, condensers and ribbons can all be auditioned. None is round by type.',
    },
  },
  {
    id: 'eu.mic.3',
    page: 'microphone',
    prompt: 'The euphonium’s strongest attacks are loud close to the bell. What do you check on the mic?',
    options: ['Its maximum level at that distance, and each gain stage', 'Only the desk meter, since it shows each overload as it happens', 'Its brand’s good standing among brass players'],
    correct: 'Its maximum level at that distance, and each gain stage',
    explain: 'Strong brass peaks can overload a mic stage even when a console meter has headroom. Check the mic, any wireless stage and the preamp at the loudest real passage.',
    why: {
      'Only the desk meter, since it shows each overload as it happens': 'The meter comes after the mic and a wireless pack; they can clip before it shows.',
      'Its brand’s good standing among brass players': 'A brand is no measure of headroom. Check the mic’s own specification.',
    },
  },
  {
    id: 'eu.mic.4',
    page: 'microphone',
    prompt: 'A clip its maker confirms for this euphonium’s bell; the player agrees; the cable avoids both valve hands. A fair choice for a moving player on a loud stage?',
    options: ['Yes — then check its noise, the fit and the mute path', 'No — a euphonium can only be miked on a stand', 'No — clips are made for trumpet bells only'],
    correct: 'Yes — then check its noise, the fit and the mute path',
    explain: 'A confirmed clip keeps the mic at one place on a moving bell. Add strain relief, keep the cable from the valves, slides, mouthpiece and mute, and have the player demonstrate the whole movement.',
    why: {
      'No — a euphonium can only be miked on a stand': 'A stand is the safe default, not the only way. A confirmed clip is fine with the player’s agreement.',
      'No — clips are made for trumpet bells only': 'Some clips are made for larger bells. The question is whether its maker confirms THIS bell.',
    },
  },
  {
    id: 'eu.place.1',
    page: 'placement',
    prompt: 'A starting point reads “about 60 cm above the bell”. Your readout says 60 cm from the player’s face. Are you in it?',
    options: ['Not necessarily — measure from the bell, as it names', 'Yes: 60 cm is 60 cm, whichever part it is measured from', 'Yes, as long as the mic points at the euphonium'],
    correct: 'Not necessarily — measure from the bell, as it names',
    explain: 'A distance means something only with the part it is measured from. Never measure from the player’s face or the valve block: the bell is what the starting point names.',
    why: {
      'Yes: 60 cm is 60 cm, whichever part it is measured from': 'Same number, different place. The starting point is measured from the bell.',
      'Yes, as long as the mic points at the euphonium': 'Aim is a separate check. The distance is read from the part the starting point names.',
    },
  },
  {
    id: 'eu.place.2',
    page: 'placement',
    prompt: 'For a lyrical line, your mic is about 60 cm above an upright bell, aimed toward its edge, clear of the player rising. A sensible place to begin?',
    options: ['Yes — then compare a closer, slightly off-axis spot', 'No — it belongs right over the bell’s centre', 'No — lower it into the bell for more warmth'],
    correct: 'Yes — then compare a closer, slightly off-axis spot',
    explain: 'That is the above-the-bell starting point: open and rounded, with the room and the section. Compare a closer view at matched level before deciding.',
    why: {
      'No — it belongs right over the bell’s centre': 'Directly over the centre emphasises one local, direct sound. Toward the edge is the suggestion.',
      'No — lower it into the bell for more warmth': 'A mic never goes into the bell — and a ribbon there would meet the bell’s air.',
    },
  },
  {
    id: 'eu.place.3',
    page: 'placement',
    prompt: 'In a dense score the euphonium’s articulation is masked. What do you try first?',
    options: ['A closer spot, a little more toward the axis, matched level', 'A farther mic, for more of the room and the whole section', 'A big low-end boost, so the line sits fuller under the band'],
    correct: 'A closer spot, a little more toward the axis, matched level',
    explain: 'For masked articulation, compare the closer position and a modestly more central axis at matched level — without forcing a brittle sound.',
    why: {
      'A farther mic, for more of the room and the whole section': 'That blends the line further into the band — the opposite of what a masked line needs.',
      'A big low-end boost, so the line sits fuller under the band': 'Articulation lives in the attacks and upper harmonics, not in more low end.',
    },
  },
  {
    id: 'eu.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What must a euphonium mic, its boom and its cable stay clear of?',
    options: ['The bell’s tilt, both valve hands and the path to stand', 'The music stand, so the player can still read the part clearly', 'The audience’s view of the euphonium’s bright bell'],
    correct: 'The bell’s tilt, both valve hands and the path to stand',
    explain: 'Clearance comes first: the bell tilts, both hands work valves, and the player may rise to stand. Stop the player before anything moves.',
    why: {
      'The music stand, so the player can still read the part clearly': 'Sight lines matter, but the safety question is what moves.',
      'The audience’s view of the euphonium’s bright bell': 'The view matters less than the movement a boom can be hit by.',
    },
  },
  feedbackFirst('eu.ctx.1', 'euphonium'),
  superNull('eu.ctx.2', 'context', 'wedge'),
  {
    id: 'eu.ctx.studio',
    page: 'context',
    prompt: 'A lyrical euphonium solo in a good room. What could justify one farther mic and no close one?',
    options: ['The room carries the phrase and nothing needs separating', 'A close mic cannot pick up a euphonium’s round tone', 'Close euphonium mics suit live work only, not a studio'],
    correct: 'The room carries the phrase and nothing needs separating',
    explain: 'In a good room, a more distant view can convey the size and the phrase naturally. A controlled spot supplies articulation when the arrangement needs it.',
    why: {
      'A close mic cannot pick up a euphonium’s round tone': 'A close mic hears plenty of tone — with more local detail. The question is the perspective wanted.',
      'Close euphonium mics suit live work only, not a studio': 'Close mics are used in studios too — for a dense score, say. It depends on the goal.',
    },
  },
  {
    id: 'eu.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Why does a mic “in front of the player” hear an upright and a bell-front euphonium so differently?',
    options: ['The bell points elsewhere, so the overtones go elsewhere too', 'The bell-front model’s valves face the audience instead of up', 'The upright model is quieter, so it needs a closer mic'],
    correct: 'The bell points elsewhere, so the overtones go elsewhere too',
    explain: 'The overtones follow the bell: up from an upright bell, forward from a front one. The same stand position meets a different part of the sound.',
    why: {
      'The bell-front model’s valves face the audience instead of up': 'The valves sit in much the same place. The bell is what turns.',
      'The upright model is quieter, so it needs a closer mic': 'It is not quieter — its overtones go up instead of forward.',
    },
  },
  {
    id: 'eu.two.1',
    page: 'twoMic',
    prompt: 'Why can a spot and a farther mic on one euphonium sound hollow together?',
    options: ['The sound reaches them at different times, so some pitches cancel', 'The farther mic inverts the sound on its way there, so it cancels', 'Two mics on one euphonium cancel each other’s low end in the sum'],
    correct: 'The sound reaches them at different times, so some pitches cancel',
    explain: 'The farther mic hears each note a little later. Summed, some pitches arrive out of step and cancel — a comb of notches. Move or rebalance first, then check polarity at matched levels.',
    why: {
      'The farther mic inverts the sound on its way there, so it cancels': 'Distance delays a sound; it does not flip its sign.',
      'Two mics on one euphonium cancel each other’s low end in the sum': 'Cancellation depends on the delay and the levels: some pitches dip, others add.',
    },
  },
  polarityDelay('eu.two.2'),
  matchedLevels('eu.two.3', 'euphonium'),
  {
    id: 'eu.two.4',
    page: 'twoMic',
    prompt: 'A euphonium countermelody plays under an ensemble’s main pair. Does it need a spot?',
    options: ['Only if the line is masked at the real balance', 'Yes: each countermelody needs a spot mic of its own', 'Yes, a stereo pair, to make the line wider'],
    correct: 'Only if the line is masked at the real balance',
    explain: 'Listen to the main or section mics first. A spot should support the ensemble image, not pull one player forward — add it only if the line needs it, and check it in mono.',
    why: {
      'Yes: each countermelody needs a spot mic of its own': 'A good main pickup often carries it. A spot should earn its place.',
      'Yes, a stereo pair, to make the line wider': 'One player inside an ensemble does not need a stereo pair; it can pull the image apart.',
    },
  },
  gainCheck('eu.prac.gain', W),
  {
    id: 'eu.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second euphonium channel?',
    options: ['The first works alone, the pair adds something, it holds in mono', 'Two channels give the mix engineer more options to choose from later on', 'The euphonium needs more level than one mic can give'],
    correct: 'The first works alone, the pair adds something, it holds in mono',
    explain: 'A second mic blends a different perspective — and a delay. If the pair loses body, move or rebalance it, check polarity — or leave it out.',
    why: {
      'Two channels give the mix engineer more options to choose from later on': 'More channels add spill, a cable and a combining check. A second mic should earn its place.',
      'The euphonium needs more level than one mic can give': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'eu.mix.1',
    page: 'practice',
    prompt: 'A starting point reads “0.9–1.3 m in front of the euphonium”. What is it measured from?',
    options: ['The euphonium itself, in the player’s lap', 'The bell’s rim, where the sound leaves it', 'The player’s face, at the mouthpiece'],
    correct: 'The euphonium itself, in the player’s lap',
    explain: 'A distance belongs to the part it names. The farther view is measured from the euphonium; the closer ones from the bell — and none from the player’s face.',
    why: {
      'The bell’s rim, where the sound leaves it': 'That is the closer starting points’ reference. This one names the euphonium.',
      'The player’s face, at the mouthpiece': 'Nothing is measured from the player’s face; the starting point names the euphonium.',
    },
  },
  nullOnPaper('eu.mix.2', 'wedge'),
  removeDelay('eu.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'eu.sym.thin',
    observation: 'The line sounds thin or sharp',
    firstChecks: 'The mic too central or too close, an overload, or the player and the room: compare toward the edge or off axis at matched level, and check the gain stages.',
    options: ['Compare edge or off axis at matched level; check the gain stages', 'Boost the low end on the channel until the whole line fills out again', 'Ask the player to play more softly for a rounder tone'],
    correct: 'Compare edge or off axis at matched level; check the gain stages',
    explain: 'Right over the bell’s centre, or overloaded, a euphonium can sound thin and brittle. Move toward the edge or off axis, and check that no stage clips.',
    why: {
      'Boost the low end on the channel until the whole line fills out again': 'EQ hides the cause. Check the angle, the distance and the gain first.',
      'Ask the player to play more softly for a rounder tone': 'The player’s sound is theirs. The mic’s view and the gain are yours to change.',
    },
  },
  {
    id: 'eu.sym.masked',
    observation: 'The melody disappears in the ensemble',
    firstChecks: 'The main pickup masks the inner line: try a safe spot and the musical balance before broad EQ.',
    options: ['Try a safe spot and rebalance before reaching for EQ', 'Boost the euphonium’s mids across the whole ensemble mix', 'Turn the main pair up until the melody can be heard'],
    correct: 'Try a safe spot and rebalance before reaching for EQ',
    explain: 'A spot gives the line its own share; balance it with the main pickup in mono. Broad EQ or a louder main pair lifts everything else too.',
    why: {
      'Boost the euphonium’s mids across the whole ensemble mix': 'Broad EQ changes everything the main pickup hears, not just the euphonium.',
      'Turn the main pair up until the melody can be heard': 'That raises the rest of the ensemble with it.',
    },
  },
  {
    id: 'eu.sym.low',
    observation: 'The low notes lose body',
    firstChecks: 'A high-pass corner or a room cancellation: bypass the filter, play the actual written low phrase, then move the mic or the player.',
    options: ['Bypass the filter, test the low phrase, move the mic', 'Boost the lowest frequencies on the channel first', 'Swap to the largest mic you have, for its bigger diaphragm'],
    correct: 'Bypass the filter, test the low phrase, move the mic',
    explain: 'A filter set from the word “euphonium”, or a room that cancels the low notes, can thin the bottom. Find which before reaching for EQ.',
    why: {
      'Boost the lowest frequencies on the channel first': 'EQ cannot put back what a filter or a cancellation removed.',
      'Swap to the largest mic you have, for its bigger diaphragm': 'A larger diaphragm is no promise of low end. The filter and the room come first.',
    },
  },
  {
    id: 'eu.sym.hit',
    observation: 'The bell hits a hanging mic',
    firstChecks: 'The posture, the player rising or a bell tilt was missed: stop; let the player steady the horn, and reposition the boom.',
    options: ['Stop; the player steadies the horn while the boom moves', 'Ask the player to keep the bell perfectly still', 'Lower the mic so it hangs just inside the bell'],
    correct: 'Stop; the player steadies the horn while the boom moves',
    explain: 'Players rise, tilt and breathe. Stop, let the player hold the euphonium safely, move the boom, and recheck the whole movement.',
    why: {
      'Ask the player to keep the bell perfectly still': 'Movement is part of playing. The mic gives way, not the player.',
      'Lower the mic so it hangs just inside the bell': 'Never into the bell — and it would be hit even more easily there.',
    },
  },
  distortSymptom('eu.sym.distort'),
  hollowSymptom('eu.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'eu.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic euphonium setup in the order you would do them.',
    steps: [
      { text: 'Identify the horn, where its bell points, and whether the player stands', early: 'Start with the player and the instrument.' },
      { text: 'Hear quiet and loud phrases, the lowest needed note and the attacks', early: 'Listen before choosing a mic.' },
      { text: 'Choose the mic and a stand or boom (or a confirmed clip)', early: 'Choose once you know the bell and the line.' },
      { text: 'With the player stopped, place it for the real bell, clear of the tilt', early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom on if needed', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set gain on the loudest real passage, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare distance and angle one change at a time, matched levels', early: 'Compare only once the level is set safely.' },
      { text: 'Secure the boom and cable; recheck rising, tilting and the mute', early: 'Secure it last, then watch the player’s whole movement again.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before switching it — and check a ribbon’s manual first. Gain: set it with headroom for the loudest passage.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'eu.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A loud stage with a big band. One channel for a bell-front euphonium; the player stands for solos.',
    setups: [
      { id: 'a', label: 'Small dynamic a foot or two in front of the bell, slightly off axis, the stand clear of the path to stand', ok: true, power: 'none', feedback: 'A suggested starting point: close, directional, set for the real bell — check the wedges round its rejection.' },
      { id: 'b', label: 'A clip its maker confirms for this bell, the cable away from both valve hands and the mute', ok: true, power: 'phantom', feedback: 'A suggested option when a confirmed clip exists: it follows the player who stands for solos.' },
      { id: 'c', label: 'A mic 60 cm above where an upright bell would be', ok: false, power: 'phantom', feedback: 'That suits an upright bell. This one faces the front: point the stand in its real direction.' },
      { id: 'd', label: 'A trumpet clip taped to the bell, for a quick fit', ok: false, power: 'phantom', feedback: 'A trumpet clip may not fit, and tape on a valuable finish is never the answer.' },
      { id: 'e', label: 'A mic on the bell’s axis, as close as it goes, for the most level', ok: false, power: 'none', feedback: 'The brightest, hardest view — and level comes from gain, not from crowding the bell.' },
    ],
    reasons: [docReason('the bell'), clearReason('the bell, both valve hands and the path to stand'), POWER_REASON, { id: 'r.band', label: 'I will test it at performance level with the whole band', role: 'optional', feedback: 'A fair live reason: a mic that sounds good solo may be full of drums.' }, BRAND_REASON('euphonium'), LOUD_REASON],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point from its named part, clearance from the bell, the hands and the path to stand, and the power the mic needs.',
  },
  {
    id: 'eu.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · Studio. A brass band with a main pair up; an upright euphonium plays a lyrical solo in a good room.',
    setups: [
      { id: 'a', label: 'A small condenser about 60 cm above the bell, aimed toward its edge, raised under the main pair and checked in mono', ok: true, power: 'phantom', feedback: 'A suggested starting point: open and rounded, with the room — raised just enough.' },
      { id: 'b', label: 'A ribbon a little farther back and off the axis, out of the bell’s air, at a modest level under the main pair', ok: true, power: 'none', feedback: 'A suggested option: a softer view, kept out of the bell’s air — follow its manual on power.' },
      { id: 'c', label: 'A ribbon 10 cm over the centre of the bell, for warmth', ok: false, power: 'none', feedback: 'Right in the bell’s stream of air: a risk to a ribbon, and a local, direct sound.' },
      { id: 'd', label: 'A stereo pair on the euphonium alone, to make the solo wider', ok: false, power: 'phantom', feedback: 'One player inside the band does not need a stereo pair; it pulls the image apart.' },
      { id: 'e', label: 'Turn the main pair up until the solo stands out', ok: false, power: 'phantom', feedback: 'That raises the whole band with it. A gentle spot gives the line its own share.' },
    ],
    reasons: [docReason('the bell'), clearReason('the bell’s tilt, both valve hands and the neighbours'), POWER_REASON, { id: 'r.mono', label: 'I will raise it gradually and check it with the main pair in mono', role: 'optional', feedback: 'A fair reason: a spot supports the main pair, it does not replace it.' }, BRAND_REASON('euphonium'), { id: 'r.size', label: 'A larger diaphragm will make the solo rounder', role: 'wrong', feedback: 'No guarantee: the actual mic and its placement decide.' }],
    explain: 'Two spots pass. What passes is the reasoning: a sensible starting point, clearance, the right power and a ribbon kept out of the air — and a spot that supports the main pair rather than replacing it.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: where does a euphonium’s sound leave the instrument?', options: ['From the bell’s opening', 'From the whole body at once', 'From the fourth valve'], after: 'Now STEP through (or PLAY ONCE) and follow the sound from the lips to the bell.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move a mic from about 30 cm to about 60 cm from the bell. What changes?', options: ['More valve and breath detail', 'More of the room and the section', 'It depends on this euphonium'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge is on the floor in front of the player. Where will a supercardioid facing back at a front bell reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'Which way does a euphonium’s bell point?',
    options: ['Up on most; forward on a bell-front model', 'Only up, on concert and band models alike', 'Back, behind the player, like a horn’s'],
    correct: 'Up on most; forward on a bell-front model',
    explain: 'Most concert setups have the bell up; bell-front models are made for forward projection. Find the bell before placing a mic.',
    why: {
      'Only up, on concert and band models alike': 'Up is the usual form, but bell-front models are made too.',
      'Back, behind the player, like a horn’s': 'That is the horn. A euphonium’s bell points up or forward.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What sets a euphonium apart from a baritone horn of the same pitch?',
    options: ['A more conical tube and a larger bell', 'Fewer valves than a baritone horn has', 'A higher pitch, a fourth above it'],
    correct: 'A more conical tube and a larger bell',
    explain: 'The euphonium’s more conical tube and larger bell give it a fuller, rounder sound. Both share the B♭ pitch, and both come with three or four valves.',
    why: {
      'Fewer valves than a baritone horn has': 'Both come with three or four valves.',
      'A higher pitch, a fourth above it': 'They share the same B♭ pitch.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'What sets the air in the euphonium vibrating?',
    options: ['The lips buzzing in the mouthpiece', 'The valves opening and closing quickly', 'The bell ringing as it is blown'],
    correct: 'The lips buzzing in the mouthpiece',
    explain: 'The player’s lips buzz; the air column rings, and the lips lock onto it.',
    why: {
      'The valves opening and closing quickly': 'The valves choose the tube’s length; they do not make the vibration.',
      'The bell ringing as it is blown': 'The bell radiates the air’s vibration; the metal itself gives off little.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'A mic farther from the bell, compared with a close one, tends to hear…',
    options: ['More of the room and the section', 'More valve and breath detail', 'None of the euphonium’s overtones'],
    correct: 'More of the room and the section',
    explain: 'Farther away, the bell, the room and the neighbours blend; close up, local bell, valve and breath detail dominate.',
    why: {
      'More valve and breath detail': 'That is what a close mic tends to hear.',
      'None of the euphonium’s overtones': 'A farther mic still hears the overtones — blended with the room.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'What must a boom over an upright euphonium stay clear of?',
    options: ['The bell’s tilt, the hands and the path to stand', 'The music stand, so the player can still read the part clearly', 'The audience’s view of the instrument’s bell'],
    correct: 'The bell’s tilt, the hands and the path to stand',
    explain: 'Clearance comes first: the bell tilts, both hands work valves, and the player may rise to stand.',
    why: {
      'The music stand, so the player can still read the part clearly': 'Sight lines matter, but safety is about what moves.',
      'The audience’s view of the instrument’s bell': 'The view matters less than the movement a boom can be hit by.',
    },
  },
  hearingDiag('q.6', W),
];

const wedges: Wedge[] = [
  {
    id: 'wedge',
    label: 'the euphonium player’s floor wedge, in front, facing back',
    short: 'WEDGE',
    p: { x: 1550, y: 0, z: 0 },
    lift: 150,
    faces: { x: -1, y: 0, z: 0 },
    note: 'On the floor in front, facing back at the player: below and behind a mic that faces back at a front bell — the case a pattern’s rejection can help with, tilting as well as turning.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
  },
  {
    id: 'side',
    label: 'another player’s wedge, off to the euphonium player’s left',
    short: 'SIDE WEDGE',
    p: { x: 900, y: 0, z: -1300 },
    lift: 150,
    faces: { x: -0.5, y: 0, z: 0.86 },
    note: 'Off to one side, facing another player: well off the mic’s axis.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
  },
];

export const A04B_LESSON: Lesson = {
  id: 'A04b',
  labId: 'winds',
  title: 'Euphonium',
  subtitle: 'Bell up or bell front: above the bell toward its edge, a little off axis, or farther back',
  noun: { one: 'euphonium', many: 'euphoniums' },
  model: EUPH_MODEL,
  micTypeIds: ['smallDynCard', 'sdcCard', 'lbRibbon', 'lbLdc'],
  zones: EUPH_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'The euphonium is a tenor-voiced brass instrument in B♭, played by buzzing the lips into a mouthpiece. Its widening (conical) tube and large bell give it a fuller, rounder sound than the baritone horn it shares a pitch with. Euphoniums come with three or four valves; compensating models add tubing to keep the low notes in tune.', src: 'Y-HUB-EUPH' },
    { title: 'WHERE YOU MEET IT', text: 'Concert and military bands, brass bands, wind ensembles, solo recitals, and now and then jazz and studio sessions. Names vary by country — some bell-front models are informally called baritones — so look at the actual horn. This lesson covers one seated euphonium, in the studio and live.', src: 'Y-HUB-EUPH' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'It sings lyrical melodies and countermelodies, fills inner harmony, and doubles the low foundation. Ask which the line is — it decides whether the mic should catch the rounded line with its room, or the articulation up close.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'This lab draws a four-valve compensating euphonium with a 30 cm bell, held on the lap of a seated player. Most concert setups point the bell up; a bell-front model turns it toward the audience.', src: 'Y-YEP642' },
  ],
  sound: {
    stages: [
      { title: 'The lips buzz', text: 'The player’s lips, pressed into the mouthpiece, buzz — puffs of air into the tube, fewer per second the lower the note.' },
      { title: 'A pulse runs down the tube', text: 'Each puff sends a pressure pulse along the folded, widening tube. The valves add extra loops to lower the pitch.' },
      { title: 'The bell turns some of it back', text: 'At the flaring bell, much of the pulse turns back up the tube. Going to and fro, it sets up a standing wave in the air column, and the lips lock onto it — that holds the note’s pitch.' },
      {
        title: 'Sound leaves the bell',
        text: 'What escapes leaves from the bell — pointing up here. The low notes spread nearly all round; the attacks and upper overtones go mostly up, round the bell’s axis.',
        byVariant: { front: 'What escapes leaves from the bell — facing the audience here. The low notes spread nearly all round; the attacks and upper overtones go mostly forward, round the bell’s axis.' },
      },
    ],
    attack: 'The start of each note: the tongue releasing the air and the lips starting to buzz — an edge that can carry strong upper harmonics. It leaves the bell, so a mic nearer the bell’s axis tends to hear more of it.',
    body: 'The sustained, rounded tone: the standing wave in the tube, leaving the bell — the low notes nearly all round, the overtones along the bell’s axis — and the room. A mic farther away tends to hear more of the whole euphonium, the room and the section. Tendencies: euphoniums vary.',
    head: { diameterMm: 0, rods: 0, label: 'the air column', strikeSrc: 'UNSW-BRASS' },
  },
  setting: {
    items: [
      { id: 'euph', label: 'the euphonium and the player', short: 'EUPHONIUM', note: 'The player sits facing the audience, the euphonium on the lap, the right hand on the top valves, the left on the fourth valve, the bell beside the head. Ringed in amber: the instrument this lesson mics.', prov: { kind: 'illustrative', reason: 'euphonium/GEOMETRY_PROPOSAL.md (drawing defaults)' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'stand', label: 'the music stand', short: 'MUSIC STAND', note: 'In front of the player. The player must see the part and the conductor — and needs room to stand up past it.', prov: { kind: 'illustrative', reason: 'a typical seat' }, tag: 'SIGHT LINE', scene: 'kit' },
      { id: 'tuba', label: 'a tuba beside', short: 'TUBA', note: 'The tuba often sits beside the euphonium. A euphonium mic hears it — and its low end reaches past any pattern.', prov: { kind: 'illustrative', reason: 'a typical band seating' }, tag: 'SPILL', scene: 'kit' },
      { id: 'wedge', label: 'the euphonium player’s wedge', short: 'WEDGE', note: 'On a stage, a floor monitor in front of the player, facing back at them — loud, and close to a mic in front of a front bell.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'side', label: 'another player’s wedge', short: 'SIDE WEDGE', note: 'Off to one side, facing another player.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Live, the section mics may already carry the euphonium; the PA adds what the room needs.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'main', label: 'a main pair for the ensemble', short: 'MAIN PAIR', note: 'In a studio recording of a band, a main pair hears the whole ensemble; a euphonium mic is a spot that supports it.', prov: { kind: 'illustrative', reason: 'a generic main pair' }, tag: 'MAIN PAIR', scene: 'studio' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a studio there are no wedges; a good room carries the euphonium’s size and its phrase.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors feed the players, the PA faces the audience, and the band reaches every open mic. A loud stage pushes toward a closer, directional mic with the wedges round its rejection — tested with the whole band.',
    studio: 'STUDIO: no wedges, a room that may sound good, and repeated trials when the player stops. A farther view can carry a lyrical line; in a band, a main pair may carry it already.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic euphonium setup for a given room, bell and line, describe an alternative position, and explain what would justify a second mic. With a real euphonium and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'room', label: 'Room or stage', kind: 'text' },
      { id: 'bell', label: 'Where the bell points', kind: 'choice', choices: ['up', 'front'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small dynamic, cardioid', 'small condenser', 'ribbon', 'large condenser', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, from the bell (or which part)', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The euphonium’s body: its height from the lowest bow to the bell (650 mm), the bows, branches, valve block and slides — drawing defaults; the 300 mm bell and the 3 + 1 compensating valves are the sourced facts.', dims: [] },
    { text: 'The seated pose: the euphonium on the lap, the bell beside the head on the player’s right, the hands on the valves, the chair (seat 460 mm) — drawing defaults (LB-02).', dims: [] },
    { text: 'The bell-front position (turned forward at head height) — a drawing default.', dims: [] },
    { text: 'The keep-outs: the bell’s opening, the bell’s tilt, the valve hand, the path to stand (a box 600 mm deep in front of the chair) — illustrative.', dims: [] },
    { text: 'The farther view’s distance (0.9–1.3 m) — no number in the lesson; the above-the-bell band drawn ±5 cm round 61 cm.', dims: [] },
    { text: 'No euphonium directivity is published: the brass trend (the tuba’s and the trumpet’s) is drawn.', dims: [] },
    { text: 'The ribbon’s and the large condenser’s body sizes — drawing defaults.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. Every euphonium, player and room is different: find the bell, move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: one player in a typical posture, the bell, the hands and the path to stand shown as keep-outs, mic patterns and the two-mic comb as textbook shapes. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped, and only with their agreement.',
  copy: EUPH_COPY,
};
