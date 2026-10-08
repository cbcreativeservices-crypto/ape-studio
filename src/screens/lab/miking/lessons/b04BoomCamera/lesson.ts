/**
 * B04 BOOM AND CAMERA-MOUNTED PICKUP — the lesson's pages as DATA (blueprint
 * §7). The words come from the owner's lesson (docs/labs/miking/source_text/
 * B04-Boom-and-Camera-Mounted-Pickup-Miking-Technique.txt, cited "L<n>" in
 * COMMENTS only) with the fixes logged in docs/labs/miking/CORRECTIONS_LOG.md
 * ("L7G2") applied — the institutional wording (B-INST: L2, L41, L42) and no
 * links to unbuilt lessons (B-XLINK: L83's F13). D-SG1 (a maker's "four to
 * five times an omni's distance") is never shown: the lesson's own "a
 * shotgun does not zoom" stands.
 *
 * One talker with the SHOT as its variant (CLOSE / WIDE / LIVE), on the
 * voice family's standing figure, the camera frame and the boom (shared/
 * broadcast/cameraFrame.ts, boomPole.ts). O-SG (owner item): the shotgun is
 * drawn as its base supercardioid with the narrower high-frequency lobe —
 * "a simplified picture"; the real pattern narrows and changes with pitch.
 * Safety exact, in plain words: never swing gear over people, overhead rigs
 * by qualified crew, no conductive pole near overhead power lines, never
 * provoke feedback.
 * OWNER RULING 2026-10-04 — learner-facing presentation: suggested starting
 * points, never dogma; no source, brand or model in learner text; no badges.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, clearReason, docReason, hearingDiag, polarityDelay, type Words } from '../shared/bowed/bowedItems.ts';
import { LOUD_VOICE, removeDelayVoice } from '../shared/broadcast/sportItems.ts';
import { hollowVoiceSymptom, personMeet, voiceRatingCheck } from '../shared/broadcast/voiceItems.ts';
import { B04_MODEL, FLOOR, PA_C } from './geometry.ts';
import { B04_ZONES } from './model.ts';
import { B04_COPY } from './copy.ts';

const W: Words = { noun: 'talker', player: 'talker', moving: 'the head, the hands and the body' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the talker and the shot',
    goal: 'Get to know a talker on camera — where the voice leaves, the camera and the edges of its frame, the boom operator outside it, and the PA on a stage — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The voice leaves through the mouth; the camera’s frame decides how close a boom may come; the camera’s own mic is as far away as the camera.',
  },
  sound: {
    title: 'Where the voice comes from',
    goal: 'See where speech leaves the talker, how the frame sets the boom’s distance — above, below or beside it — what a head turn does to a boom held still, and what a second talker means for one boom.',
    credit: { scenarios: ['b4.snd.1', 'b4.snd.2', 'b4.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'The boom goes as close as the picture allows; a wider shot pushes it away. Held still, it drifts off a turning mouth; aimed at one talker, it hears the other off its axis. A shotgun does not zoom. Tendencies, and rooms vary.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Know where each mic goes — the program, the recorder, the earpiece, a PA — and what to settle before any boom goes up: the widest frame, the light, safe rigging, power lines and weather, and a live check without feedback.',
    credit: { scenarios: ['b4.set.1', 'b4.set.2', 'b4.set.3', 'b4.set.4'], note: 'Answer the four checks.' },
    takeaway: 'Ask for the widest frame, never swing gear over people, leave overhead rigs to qualified crew, keep a pole away from power lines, put one mic on air per voice, and bring live mics up to their working level only.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a boom mic by the room, not by its length: a short shotgun or a compact directional mic, a windscreen for the weather, a suspension — and know what the camera’s own mic can and cannot do.',
    credit: { scenarios: ['b4.mic.1', 'b4.mic.2', 'b4.mic.3', 'b4.mic.4', 'b4.rec.1'], note: 'Answer the five checks (one reaches back to the talker and the frame).' },
    takeaway: 'A shotgun narrows its pickup higher up but does not reach farther; indoors a compact directional mic may sound smoother; foam for mild wind, a basket and fur for strong — none waterproof. Closeness decides the voice against the room.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — the boom just above the frame, aimed at the mouth — then move it below or beside the frame, or to the camera, and see what changes.',
    credit: { scenarios: ['b4.place.1', 'b4.place.2', 'b4.place.3', 'b4.rec.2'], interactive: 'twoZones', note: 'Rest the mic, outside the frame, inside two different suggested starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A suggested zone is a place to begin, measured from the lips — not a rule. The side the boom comes from, its distance and its aim are separate controls; the frame and people’s safety come first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim a boom mic so its rejection faces a stage’s PA — and know why a quiet studio and a public event call for different checks.',
    credit: { scenarios: ['b4.ctx.1', 'b4.ctx.2', 'b4.ctx.studio', 'b4.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the boom mic (or change its pattern) until the PA sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'In a studio with headphones and no PA, the room and the frame are the limits; at a public event, the boom hears the PA too — its place and pattern checked with the system’s operator, the fewest open mics.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a boom and a safety lav summed on one talker can sound hollow, how the arrival-time difference places comb notches, and why one is chosen for the program.',
    credit: { scenarios: ['b4.two.1', 'b4.two.2', 'b4.two.3', 'b4.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'The lav hears the voice first, the boom later: summed, some pitches cancel. Choose the intended feed and keep the other on its own track; polarity flips the sign and never removes a delay.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — the distance the frame allows, the aim, the room behind the talker, the wind, the pole and its cable, the route — before reaching for EQ or noise reduction.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up a boom in the right order, choose and justify a setup for a studio interview and a live event, and say what would justify a second mic.',
    credit: { scenarios: ['b4.prac.order', 'b4.prac.gain', 'b4.prac.setup1', 'b4.prac.setup2', 'b4.prac.3', 'b4.mix.1', 'b4.mix.2', 'b4.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The placement sheet is optional — it needs a real shoot.' },
    takeaway: 'Outside every frame, as close as it allows, aimed and re-aimed, safe for people, one mic on air per voice and a tested fallback pass. A longer tube or a “hotter” camera gain do not — and more than one setup can pass.',
  },
};
/** MEET IT in person words (review 2026-10-08, L7G2-18 / L7G3-17): the engine's goal calls the subject "it". */
pages.meet = personMeet(pages, 'the talker');

/*
 * THE CHECKS. Lesson lines in comments only: b4.snd.* L5, L12, L22 · b4.set.*
 * L6, L26–L27, L48 · b4.mic.* L23–L27, L41–L47 · b4.place.* L12–L20 ·
 * b4.ctx.* L48 · b4.two.* L48 · b4.prac.* / b4.mix.* L51–L60.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'b4.snd.1',
    page: 'sound',
    prompt: 'The camera reframes from a close shot to a wide one. What happens to the boom?',
    options: ['It moves farther away, out of the bigger frame', 'It stays put: the boom is above the shot anyway', 'It can come closer, since the talker looks smaller'],
    correct: 'It moves farther away, out of the bigger frame',
    explain: 'A wider picture shows more room above and round the talker. The boom stays just outside it — farther from the mouth, so more room against the voice.',
    why: {
      'It stays put: the boom is above the shot anyway': 'The wider frame’s top is higher: where the boom was is now in the picture.',
      'It can come closer, since the talker looks smaller': 'The talker only looks smaller; the frame’s edge moved farther out.',
    },
  },
  {
    id: 'b4.snd.2',
    page: 'sound',
    prompt: 'The talker turns while the boom is held still. What happens?',
    options: ['The mouth turns off the mic’s axis', 'The mic turns to follow the mouth', 'Nothing: a shotgun hears all round it'],
    correct: 'The mouth turns off the mic’s axis',
    explain: 'Held still, the boom keeps pointing where the mouth was. The operator re-aims it through the whole line, rehearsed.',
    why: {
      'The mic turns to follow the mouth': 'Only the operator turns it. Held still, it stays aimed at the old place.',
      'Nothing: a shotgun hears all round it': 'A shotgun is directional: off its axis the voice dulls.',
    },
  },
  {
    id: 'b4.snd.3',
    page: 'sound',
    prompt: 'A boom aimed at the talker; the interviewer asks a question. What does the boom hear?',
    options: ['The question well off its axis', 'Both voices equally well, as before', 'The question louder than the talker'],
    correct: 'The question well off its axis',
    explain: 'Aimed at one mouth, the boom hears the other well off its axis — duller and quieter. Cue the boom before each turn, or give each person their own mic.',
    why: {
      'Both voices equally well, as before': 'A narrow pickup favours where it points; the other voice is off its axis.',
      'The question louder than the talker': 'The talker is on the axis; the interviewer is not.',
    },
  },
  voiceRatingCheck('b4.set.1', 'the talker'),
  {
    id: 'b4.set.2',
    page: 'setting',
    prompt: 'The boom has to pass over the audience to reach the talker. What do you do?',
    options: ['Find another path — never swing gear over people', 'Move it quickly so it is over them only briefly', 'Hold the cable tight so nothing can fall'],
    correct: 'Find another path — never swing gear over people',
    explain: 'Never let a mic, a clamp or a cable swing above people. Find a path round them; an overhead rig is set and secured by qualified crew before anyone sits beneath it.',
    why: {
      'Move it quickly so it is over them only briefly': 'Speed adds risk; a dropped part falls just the same.',
      'Hold the cable tight so nothing can fall': 'A tight cable does not secure a clamp, a joint or the mic.',
    },
  },
  {
    id: 'b4.set.3',
    page: 'setting',
    prompt: 'Outdoors, an overhead power line runs near where the boom would go. What then?',
    options: ['Keep the pole down; ask the site’s qualified people', 'Raise it slowly and watch the line closely all along', 'Use a short pole so it reaches less high'],
    correct: 'Keep the pole down; ask the site’s qualified people',
    explain: 'Never hold or raise a conductive pole near overhead power lines. If you are unsure of the clearance, the pole stays down.',
    why: {
      'Raise it slowly and watch the line closely all along': 'Care does not make the clearance safe: keep the pole down.',
      'Use a short pole so it reaches less high': 'Any pole raised near a line is a risk; ask the qualified people.',
    },
  },
  {
    id: 'b4.set.4',
    page: 'setting',
    prompt: 'The boom is the program mic; the lav is the safety track. Where does the lav go?',
    options: ['Its own recorder track, out of the program', 'Into the program with the boom, a bit lower', 'The earpiece, so the talker hears it'],
    correct: 'Its own recorder track, out of the program',
    explain: 'Summed with the boom, the lav’s earlier copy combs the voice. Kept on its own track it is a fallback ready to choose.',
    why: {
      'Into the program with the boom, a bit lower': 'Lower or not, it is a second open mic on one voice.',
      'The earpiece, so the talker hears it': 'The earpiece carries cues and the program, not a spare mic.',
    },
  },
  {
    id: 'b4.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Why can the boom come closer in a close shot than in a wide one?',
    options: ['The frame’s edge is nearer the talker', 'The camera’s mic covers the rest', 'The talker speaks louder in a close shot'],
    correct: 'The frame’s edge is nearer the talker',
    explain: 'In a close shot the frame ends just above the head: the boom can sit nearer the mouth and still stay out of the picture.',
    why: {
      'The camera’s mic covers the rest': 'The camera’s mic is a separate, far mic — not part of the boom’s place.',
      'The talker speaks louder in a close shot': 'The shot does not change the voice; it changes where the frame ends.',
    },
  },
  {
    id: 'b4.mic.1',
    page: 'microphone',
    prompt: 'A voice sounds distant on a shotgun. What makes it sound close?',
    options: ['Moving the mic closer to the mouth', 'A longer tube, which is made to reach', 'Aiming the tube more precisely'],
    correct: 'Moving the mic closer to the mouth',
    explain: 'A shotgun narrows its pickup at higher frequencies; it does not bring the voice nearer against the room. Distance decides that.',
    why: {
      'A longer tube, which is made to reach': 'The tube narrows the high-frequency pickup; it does not reach farther.',
      'Aiming the tube more precisely': 'Aim keeps it on the voice; it does not shorten the distance.',
    },
  },
  {
    id: 'b4.mic.2',
    page: 'microphone',
    prompt: 'A reflective room indoors. What is a fair comparison to make?',
    options: ['A shotgun and a compact directional mic, same place', 'Two shotguns of different lengths, one of them far off', 'The camera’s mic against the boom, gain matched'],
    correct: 'A shotgun and a compact directional mic, same place',
    explain: 'Among reflections a shotgun’s off-axis colour can show; a compact directional mic may sound smoother. Compare at the same place and loudness — neither is best everywhere.',
    why: {
      'Two shotguns of different lengths, one of them far off': 'A longer tube does not fix the room, and distance is a different test.',
      'The camera’s mic against the boom, gain matched': 'That compares distances, not the boom mics for this room.',
    },
  },
  {
    id: 'b4.mic.3',
    page: 'microphone',
    prompt: 'Light wind outdoors, then a stronger gust. What windscreen?',
    options: ['Foam for light wind; a basket and fur for strong', 'A foam cover, since it also keeps all the rain out', 'None — a shotgun is not bothered by wind'],
    correct: 'Foam for light wind; a basket and fur for strong',
    explain: 'Foam may do in mild wind; a fitted basket with fur does more in stronger wind. Neither is waterproof, and neither can repair an overloaded take.',
    why: {
      'A foam cover, since it also keeps all the rain out': 'No windscreen is waterproof; keep unrated gear out of rain.',
      'None — a shotgun is not bothered by wind': 'Wind at the capsule makes low rumble on any mic.',
    },
  },
  {
    id: 'b4.mic.4',
    page: 'microphone',
    prompt: 'The camera moves back for a wider shot. Its own mic?',
    options: ['Goes back too — farther from the voice', 'Stays as close as before, since it zooms', 'Gets louder, since it points the same way'],
    correct: 'Goes back too — farther from the voice',
    explain: 'A camera mic is on the camera: move the camera back and the mic goes with it — more room and noise against the voice. Raising its gain is not the same as moving closer.',
    why: {
      'Stays as close as before, since it zooms': 'The lens zooms; the mic does not.',
      'Gets louder, since it points the same way': 'Pointing the same way does not shorten the distance.',
    },
  },
  {
    id: 'b4.place.1',
    page: 'placement',
    prompt: 'The boom’s starting point gives a distance from the lips. Where does it come from?',
    options: ['The frame: as close as the picture allows', 'A fixed rule for each boom on a talker, whatever the shot', 'The length of the operator’s pole'],
    correct: 'The frame: as close as the picture allows',
    explain: 'No single boom distance fits every shot. The starting point is the nearest place just outside the widest frame — measured from the lips.',
    why: {
      'A fixed rule for each boom on a talker, whatever the shot': 'Each shot gives a different edge: there is no one number.',
      'The length of the operator’s pole': 'The pole reaches the place; the frame decides where the place is.',
    },
  },
  {
    id: 'b4.place.2',
    page: 'placement',
    prompt: 'The light blocks the overhead place. A fair next idea?',
    options: ['Below the frame, aimed up at the mouth', 'Overhead anyway, inside the top of the shot', 'Farther back, overhead, out of the light'],
    correct: 'Below the frame, aimed up at the mouth',
    explain: 'When the top of the frame, the light or the set blocks overhead, bring the boom from below, aimed up — it will sound different, so compare.',
    why: {
      'Overhead anyway, inside the top of the shot': 'In the shot is not an option: the mic and its shadow show.',
      'Farther back, overhead, out of the light': 'Farther back hears more room; try another side first.',
    },
  },
  {
    id: 'b4.place.3',
    page: 'placement',
    prompt: 'When does the side of the frame make sense?',
    options: ['When above and below are blocked or sound worse', 'It is the first choice for most shots', 'When the talker is about to turn away from it'],
    correct: 'When above and below are blocked or sound worse',
    explain: 'Beside the frame can hear more of the room at head height, and a turn away loses the voice. A conditional start: audition it rather than impose or ban it.',
    why: {
      'It is the first choice for most shots': 'Above is the usual first place; the side is for when it is blocked.',
      'When the talker is about to turn away from it': 'A turn away from a side mic loses the voice fast.',
    },
  },
  {
    id: 'b4.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Before placing the boom, what do you ask the camera operator?',
    options: ['The widest frame, every angle and the moves', 'Only what lens is on the camera today', 'Whether the camera’s own mic is switched on'],
    correct: 'The widest frame, every angle and the moves',
    explain: 'The boom must stay out of every frame, including reframes and moves. The widest one sets how close it can be.',
    why: {
      'Only what lens is on the camera today': 'The lens is part of it; the widest frame and the moves decide.',
      'Whether the camera’s own mic is switched on': 'That is a separate track; it does not place the boom.',
    },
  },
  {
    id: 'b4.ctx.1',
    page: 'context',
    prompt: 'A public event with a PA, and a boom on the talker. A fair first step?',
    options: ['Check its place and pattern with the operator', 'Turn the boom up so its voice beats the PA’s sound', 'Aim it at the PA so it hears the room'],
    correct: 'Check its place and pattern with the operator',
    explain: 'A boom near a public PA hears it too. Agree its working place, pattern and level with the system’s operator; keep the fewest mics open.',
    why: {
      'Turn the boom up so its voice beats the PA’s sound': 'More gain feeds the PA’s sound back round the loop.',
      'Aim it at the PA so it hears the room': 'The boom is for the talker; aim the rejection at the PA instead.',
    },
  },
  {
    id: 'b4.ctx.2',
    page: 'context',
    prompt: 'Where should the PA sit for a hypercardioid boom mic’s most rejection?',
    options: ['Off to the rear, near 110° from the front', 'Directly in front of the boom mic', 'Square to its side, at 90° to the front exactly'],
    correct: 'Off to the rear, near 110° from the front',
    explain: 'A hypercardioid rejects most about 110° off its front, with a rear lobe behind. Aim by the actual pattern — and a real null is shallower than the drawing.',
    why: {
      'Directly in front of the boom mic': 'In front is its pickup, not its rejection.',
      'Square to its side, at 90° to the front exactly': 'At 90° it still hears well; the deepest dip lies farther round.',
    },
  },
  {
    id: 'b4.ctx.studio',
    page: 'context',
    prompt: 'A recorded studio interview, no loudspeakers, a close shot. A fair first setup?',
    options: ['The boom close above the frame, its own channel', 'The camera’s mic, turned well up for the talker’s voice', 'A boom far back so the frame stops mattering'],
    correct: 'The boom close above the frame, its own channel',
    explain: 'With no PA, the room and the frame are the limits: the boom as close as the picture allows, on its own channel — a safety lav on its own track if the talker agrees.',
    why: {
      'The camera’s mic, turned well up for the talker’s voice': 'Gain does not bring the voice closer; the room comes up with it.',
      'A boom far back so the frame stops mattering': 'Far back hears more room. Stay as close as the frame allows.',
    },
  },
  {
    id: 'b4.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Why does one boom struggle with two people talking over each other?',
    options: ['It can aim at only one mouth at a time', 'Two voices are too loud for one mic', 'The boom hears neither voice when both of them talk'],
    correct: 'It can aim at only one mouth at a time',
    explain: 'Aimed at one, the other is well off its axis. For frequent overlap, give each person their own mic and test the program.',
    why: {
      'Two voices are too loud for one mic': 'Level is not the problem; the other voice is off the axis.',
      'The boom hears neither voice when both of them talk': 'It hears the one it points at best, the other duller.',
    },
  },
  {
    id: 'b4.two.1',
    page: 'twoMic',
    prompt: 'The boom and the lav summed on one talker sound hollow. Why?',
    options: ['The voice reaches the lav first, the boom later', 'The boom reverses the voice’s polarity', 'The lav is closer, so it simply cancels the boom'],
    correct: 'The voice reaches the lav first, the boom later',
    explain: 'Two arrival times of one voice, summed: some pitches arrive out of step and cancel — a comb.',
    why: {
      'The boom reverses the voice’s polarity': 'Distance delays a sound; it does not flip its sign.',
      'The lav is closer, so it simply cancels the boom': 'A level difference changes how deep the notches are; the delay makes them.',
    },
  },
  polarityDelay('b4.two.2'),
  {
    id: 'b4.two.3',
    page: 'twoMic',
    prompt: 'A fair way to use a boom and a safety lav together?',
    options: ['Choose one for the program; the other on its track', 'Sum both at equal level in the program', 'Delay the lav once, then sum both of them for good'],
    correct: 'Choose one for the program; the other on its track',
    explain: 'Use the intended channel and keep the other ready on its own track. Summing combs; a fixed delay lines up one position only.',
    why: {
      'Sum both at equal level in the program': 'Equal levels make the deepest comb.',
      'Delay the lav once, then sum both of them for good': 'The talker moves: one delay fits one position.',
    },
  },
  {
    id: 'b4.two.4',
    page: 'twoMic',
    prompt: 'Why keep the camera’s mic on its own track?',
    options: ['A reference to check against, not a second voice', 'It makes the voice fuller and warmer when it is summed in', 'So it can be used as one side of a stereo pair'],
    correct: 'A reference to check against, not a second voice',
    explain: 'The camera’s mic is far: summed in, it adds room and a late copy of the voice. On its own track it is a reference or a backup.',
    why: {
      'It makes the voice fuller and warmer when it is summed in': 'A far copy adds room and a comb, not fullness.',
      'So it can be used as one side of a stereo pair': 'A camera mic and a boom are not a stereo pair.',
    },
  },
  {
    id: 'b4.prac.gain',
    page: 'practice',
    prompt: 'The camera’s automatic gain pumps up the room between lines. What do you do?',
    options: ['Set the camera’s gain by hand, then check it', 'Talk more quietly so the camera gains up a little less', 'Add noise reduction to the track afterwards'],
    correct: 'Set the camera’s gain by hand, then check it',
    explain: 'Automatic gain raises the background in the pauses. A tested manual setting, with headroom, and a check on headphones and playback.',
    why: {
      'Talk more quietly so the camera gains up a little less': 'Quieter speech makes the automatic gain push harder.',
      'Add noise reduction to the track afterwards': 'Processing cannot cleanly remove a pumping background.',
    },
  },
  {
    id: 'b4.prac.3',
    page: 'practice',
    prompt: 'What would justify a second mic on the talker besides the boom?',
    options: ['A tested fallback, on its own track', 'A fuller voice from two mics summed', 'More level than the boom alone gives'],
    correct: 'A tested fallback, on its own track',
    explain: 'A safety lav earns its place on its own track, chosen only if the boom fails. Two mics summed on one voice comb.',
    why: {
      'A fuller voice from two mics summed': 'Two copies of one voice usually sound hollower.',
      'More level than the boom alone gives': 'Level comes from gain and closeness, not from another mic.',
    },
  },
  {
    id: 'b4.mix.1',
    page: 'practice',
    prompt: 'The talker sounds distant and roomy on the boom. A first idea to try?',
    options: ['Bring it closer, to the frame’s edge', 'Swap to a longer shotgun, same place', 'Raise the gain until the voice is up front'],
    correct: 'Bring it closer, to the frame’s edge',
    explain: 'Closeness decides the voice against the room. Go as close as the frame allows; a longer tube does not reach farther.',
    why: {
      'Swap to a longer shotgun, same place': 'A longer tube narrows the highs; it does not bring the voice closer.',
      'Raise the gain until the voice is up front': 'Gain raises the room as much as the voice.',
    },
  },
  {
    id: 'b4.mix.2',
    page: 'practice',
    prompt: 'A thump each time the operator adjusts the pole. A first idea to try?',
    options: ['Check the suspension and the cable on the pole', 'Cut the low end hard on the boom’s channel, then hope', 'Hold the pole tighter for the whole take'],
    correct: 'Check the suspension and the cable on the pole',
    explain: 'Handling travels down the pole: a suitable suspension, a cable wrapped so it cannot rattle, and a quiet grip stop it at the source.',
    why: {
      'Cut the low end hard on the boom’s channel, then hope': 'A deep cut thins the voice and leaves the handling.',
      'Hold the pole tighter for the whole take': 'A tight grip tires the arm and passes more handling noise.',
    },
  },
  removeDelayVoice('b4.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'b4.sym.inshot',
    observation: 'The boom dips into the top of the picture',
    firstChecks: 'Which frame is widest? Did the camera reframe? Is the operator tired?',
    options: ['Recheck the widest frame; mark a safe height', 'Ask the camera to zoom in a little more', 'Pull the boom back toward the operator a lot'],
    correct: 'Recheck the widest frame; mark a safe height',
    explain: 'Check the widest active frame before every take and mark a clearance. A tired arm drifts: plan relief and shorten the reach.',
    why: {
      'Ask the camera to zoom in a little more': 'The picture is the camera’s decision; the boom works round it.',
      'Pull the boom back toward the operator a lot': 'Farther back hears more room — just stay out of the frame.',
    },
  },
  {
    id: 'b4.sym.room',
    observation: 'Indoors, the voice sounds hollow and coloured',
    firstChecks: 'What is behind the talker along the mic’s axis? Is a shotgun hearing reflections off its axis? How far is the mic?',
    options: ['Move closer; try a compact directional mic', 'Swap to a longer shotgun, same place', 'Raise the treble on the boom to bring back the clarity'],
    correct: 'Move closer; try a compact directional mic',
    explain: 'Indoors, reflections reach a shotgun off its axis and colour the voice. Closer helps most; a compact directional mic may sound smoother — compare.',
    why: {
      'Swap to a longer shotgun, same place': 'A longer tube does not fix the room.',
      'Raise the treble on the boom to bring back the clarity': 'EQ cannot remove the reflections it is mixed with.',
    },
  },
  {
    id: 'b4.sym.wind',
    observation: 'Outdoors, a low rumble and bursts in the wind',
    firstChecks: 'Is there a windscreen? Foam or basket and fur? Is the mic in the gusts?',
    options: ['A basket and fur; shelter the mic', 'Cut all of the lows on the channel', 'Turn the boom’s gain up a little'],
    correct: 'A basket and fur; shelter the mic',
    explain: 'Foam may do for mild wind; a fitted basket with fur does more. Keep the mic out of direct gusts. A filter cannot repair an overloaded burst.',
    why: {
      'Cut all of the lows on the channel': 'A deep cut thins the voice and leaves the bursts.',
      'Turn the boom’s gain up a little': 'More gain makes the rumble louder.',
    },
  },
  {
    id: 'b4.sym.camera',
    observation: 'The camera’s mic track is thin and roomy',
    firstChecks: 'How far is the camera? Is its automatic gain on? Is it hearing the camera’s own motors?',
    options: ['Use it as a reference; mic the voice closer', 'Turn the camera’s mic gain all the way up for the voice', 'Swap it for a longer camera shotgun'],
    correct: 'Use it as a reference; mic the voice closer',
    explain: 'A camera mic is as far as the camera. Keep it as a reference or a fallback and put a boom or a lav near the talker for the voice.',
    why: {
      'Turn the camera’s mic gain all the way up for the voice': 'Gain raises the room with the voice; it does not shorten the distance.',
      'Swap it for a longer camera shotgun': 'A longer tube does not bring a distant voice closer.',
    },
  },
  {
    id: 'b4.sym.feedback',
    observation: 'Live: the PA rings when the boom is opened',
    firstChecks: 'Lower the level at once. Is the boom far from the mouth? Is its rear toward the PA? Too many open mics?',
    options: ['Lower it, then fix the place and open mics', 'Turn the boom up so the voice stays over the ring', 'Swap the boom for an omni nearer the PA'],
    correct: 'Lower it, then fix the place and open mics',
    explain: 'Pull the level down first, then bring the boom closer, aim its rejection at the PA and close unused mics — with the system’s operator. Never provoke feedback.',
    why: {
      'Turn the boom up so the voice stays over the ring': 'More gain feeds the loop.',
      'Swap the boom for an omni nearer the PA': 'An omni nearer the PA hears it from every side.',
    },
  },
  hollowVoiceSymptom('b4.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'b4.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of setting up a boom for a shot in the order you would do them.',
    steps: [
      { text: 'Ask for the widest frame, the angles, the moves and the light', early: 'Start with the picture, before any equipment.' },
      { text: 'Check the route, the power and the recorder’s inputs', early: 'Know the signal path before the boom goes up.' },
      { text: 'Rig the boom safely; a clear path, nothing over people', early: 'Rig once the path and the picture are known.' },
      { text: 'Place it just outside the widest frame, aimed at the mouth', early: 'Place the mic once the rig is safe.' },
      { text: 'Set gain on the loudest real speech, with headroom', early: 'Gain comes once the mic is placed.' },
      { text: 'Rehearse turns, the second talker and a reframe', early: 'Check the movement once the level is set.' },
      { text: 'Trace every route; keep a tested fallback', early: 'Routing and the fallback come last.' },
    ],
    explain: 'A sensible order. Never swing gear over people; no conductive pole near power lines; live, never raise a level to find feedback.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'b4.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A seated interview in a reflective room, a close shot, no loudspeakers.',
    setups: [
      { id: 'a', label: 'A boom just above the frame, aimed at the mouth', ok: true, power: 'phantom', feedback: 'A suggested start: as close as the picture allows — check the room behind the talker.' },
      { id: 'b', label: 'A compact directional mic in the same place, compared', ok: true, power: 'phantom', feedback: 'A suggested start for a reflective room — compare it with the shotgun at matched loudness.' },
      { id: 'c', label: 'The camera’s mic only, its gain turned well up', ok: false, power: 'phantom', feedback: 'As far as the camera, with the room turned up too.' },
      { id: 'd', label: 'A long shotgun far back, so the frame never matters', ok: false, power: 'phantom', feedback: 'Far back hears more room; a longer tube does not reach farther.' },
      { id: 'e', label: 'A boom dipped into the top of the frame for more voice', ok: false, power: 'phantom', feedback: 'In the picture is not an option: the mic and its shadow show.' },
    ],
    reasons: [docReason('the lips, as close as the frame allows'), clearReason('every frame, the light and the talker'), { id: 'r.room', label: 'The room behind the talker along the mic’s axis is checked', role: 'required', feedback: 'Say what the mic’s axis points at past the talker.' }, { id: 'r.zoom', label: 'A shotgun brings a distant voice close', role: 'wrong', feedback: 'A shotgun does not zoom: distance decides.' }, BRAND_REASON('talker'), LOUD_VOICE],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point measured from the lips, as close as the frame allows, outside every frame, the room behind the talker checked — and no claim that a shotgun zooms.',
  },
  {
    id: 'b4.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A live public event: a talker on a stage, a PA, a broadcast camera close on them.',
    setups: [
      { id: 'a', label: 'A boom above the frame, its rejection toward the PA', ok: true, power: 'phantom', feedback: 'A suggested start — checked with the system’s operator at a safe level.' },
      { id: 'b', label: 'A boom for the broadcast, a lav on its own track', ok: true, power: 'phantom', feedback: 'A suggested start: one mic on air, a tested fallback.' },
      { id: 'c', label: 'The boom and the lav summed in the program', ok: false, power: 'phantom', feedback: 'Two mics on one voice comb. Choose one.' },
      { id: 'd', label: 'The boom swung out over the audience to reach', ok: false, power: 'phantom', feedback: 'Never swing gear over people.' },
      { id: 'e', label: 'Raise the boom until it rings, then back off', ok: false, power: 'phantom', feedback: 'Never provoke feedback. Bring it up to its working level only.' },
    ],
    reasons: [docReason('the lips'), clearReason('the frame and the audience'), { id: 'r.one', label: 'One mic on air per voice; the other on its own track', role: 'required', feedback: 'Say how the boom and any other mic on the voice are used.' }, { id: 'r.op', label: 'The place and pattern checked with the system’s operator', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON('talker'), { id: 'r.loudest', label: 'Turn the boom up until it is louder than the PA', role: 'wrong', feedback: 'More gain brings feedback closer.' }],
    explain: 'Two setups pass. What passes is the reasoning: a boom as close as the frame allows, its rejection toward the PA, one mic on air, a tested fallback, nothing over people — and no feedback provoked.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: the camera goes to a wider shot. The boom…', options: ['Comes closer', 'Stays the same', 'Moves farther away'], after: 'Now STEP through (or PLAY ONCE), then switch the shot, turn the head and cue the second talker.' },
  microphone: { prompt: 'Before you choose: which mic is as far from the talker as the camera?', options: ['The boom', 'The camera’s own mic', 'The lav'], after: 'Now choose each TYPE and see where it starts.' },
  placement: { prompt: 'Predict: you move the boom from above the frame to below it. What changes?', options: ['A different perspective', 'Nothing at all', 'It depends on this room'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The PA is at the stage’s front corner. Where will a hypercardioid boom mic reject it best?', options: ['Straight in front', 'Off to the rear, about 110°', 'At its side'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip the lav’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'sound',
    prompt: 'What decides how close the boom can come to the talker?',
    options: ['The widest frame the camera uses', 'The length of the shotgun’s tube', 'How loud the talker speaks on air'],
    correct: 'The widest frame the camera uses',
    explain: 'The boom stays just outside the widest active frame: the wider the shot, the farther away it must be.',
    why: {
      'The length of the shotgun’s tube': 'A tube changes the pickup higher up, not where the frame ends.',
      'How loud the talker speaks on air': 'Loudness does not move the frame’s edge.',
    },
  },
  {
    id: 'q.2',
    covers: 'sound',
    prompt: 'The camera moves back for a wider shot. Its own mic now hears…',
    options: ['More room against the voice', 'The voice closer than before', 'Exactly what it heard before'],
    correct: 'More room against the voice',
    explain: 'The camera’s mic moves back with the camera: farther from the mouth, the room and noise grow against the voice.',
    why: {
      'The voice closer than before': 'The lens zooms; the mic does not come closer.',
      'Exactly what it heard before': 'Its distance changed, so the balance changed.',
    },
  },
  {
    id: 'q.3',
    covers: 'setting',
    critical: true,
    prompt: 'The quickest boom path crosses above seated people. What do you do?',
    options: ['Take another path — never over people', 'Go over quickly while they are seated', 'Hold the pole high so nothing touches them'],
    correct: 'Take another path — never over people',
    explain: 'Never swing a mic, a clamp or a cable above people. An overhead rig is set by qualified crew before anyone sits beneath it.',
    why: {
      'Go over quickly while they are seated': 'Seated or not, a dropped part falls on them.',
      'Hold the pole high so nothing touches them': 'Height is not safety: a dropped part falls farther.',
    },
  },
  {
    id: 'q.4',
    covers: 'setting',
    critical: true,
    prompt: 'Outdoors, near overhead power lines. The boom pole?',
    options: ['Stays down unless the clearance is sure', 'Goes up slowly, angled away from the lines', 'Up, if it is a carbon pole'],
    correct: 'Stays down unless the clearance is sure',
    explain: 'Never hold or raise a conductive pole near overhead power lines; if you are unsure, the pole stays down and the site’s qualified people decide.',
    why: {
      'Goes up slowly, angled away from the lines': 'Slowly is not safe if the clearance is unknown.',
      'Up, if it is a carbon pole': 'Carbon conducts too: the pole stays down.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'The boom and a safety lav on one talker. The program gets…',
    options: ['One of them; the other on its own track', 'Both of them, summed at an even level', 'The lav, with the boom tucked under it'],
    correct: 'One of them; the other on its own track',
    explain: 'Summed, the two arrival times comb. Choose the intended channel; keep the other ready as the fallback.',
    why: {
      'Both of them, summed at an even level': 'Even levels make the deepest comb.',
      'The lav, with the boom tucked under it': 'Tucked under or not, a second open mic on one voice still combs.',
    },
  },
  hearingDiag('q.6', W),
];

const wedges: Wedge[] = [
  {
    id: 'pa',
    label: 'the PA loudspeaker at the stage’s front corner, on the talker’s left',
    short: 'PA',
    p: { x: PA_C.x, y: FLOOR, z: PA_C.z },
    lift: FLOOR - PA_C.y,
    faces: { x: 1, y: 0, z: 0 },
    note: 'On a pole at the stage’s front corner, facing the audience: its back and side spill toward the stage — off the rear of a boom aimed down at the talker from that side.',
    prov: { kind: 'illustrative', reason: 'a typical small stage: the PA’s place and height are drawing defaults' },
    glyph: 'none',
  },
];

export const B04_LESSON: Lesson = {
  id: 'B04',
  labId: 'broadcast',
  title: 'Boom and Camera-Mounted Pickup',
  subtitle: 'A boom just outside the widest frame, aimed at the mouth — and the camera’s own mic, as far away as the camera',
  noun: { one: 'talker', many: 'talkers', subject: 'talker', person: true },
  model: B04_MODEL,
  micTypeIds: ['locBoomSg', 'locBoomHyper', 'camMic', 'locLav'],
  zones: B04_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A microphone held close to a talker but out of the picture — on a boom pole or stand just outside the frame — and the microphone that rides on the camera itself.', src: 'LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'Film and television dialogue, interviews on location and in the studio, documentaries, live events filmed for broadcast.', src: 'LESSON' },
    { title: 'WHAT IT DOES', text: 'It puts the mic as near the mouth as the shot allows, with no clothing noise and no hardware in the picture.', src: 'LESSON' },
    { title: 'NO SINGLE RIGHT DISTANCE', text: 'Every shot gives the boom a different edge to work to. Begin just outside the widest frame, aimed at the mouth, and adjust by listening. Experimentation is encouraged.', src: 'LESSON' },
  ],
  sound: {
    stages: [
      { title: 'Breath from the lungs', text: 'The lungs push air up the windpipe — the power behind every word, quiet or emphatic.' },
      { title: 'The vocal folds buzz', text: 'In the voice box, low in the throat, two small folds come together and the breath sets them buzzing. That buzz is the raw sound of the voice.' },
      { title: 'The throat and mouth shape it', text: 'The throat, the tongue, the lips and the open mouth shape the buzz into vowels and words; the tongue, the teeth and the lips add the consonants.' },
      { title: 'It leaves the mouth', text: 'Almost all of it leaves through the open mouth — on m, n and ng partly through the nose. That is where every distance here is measured from: the lips.' },
    ],
    attack: 'P and B push a puff of air straight out of the lips; S and T send a narrow hiss forward. A boom above and in front is out of that path; wind at the capsule outdoors is a bigger enemy.',
    body: 'The vowels carry most of the level and the tone. A boom above hears a natural voice with the room around it; the farther the frame pushes it, the more room. Tendencies, to check by ear.',
    head: { diameterMm: 0, rods: 0, label: 'the mouth', strikeSrc: 'LESSON' },
  },
  setting: {
    items: [
      { id: 'talker', label: 'the talker', short: 'TALKER', note: 'Standing, the mouth at the point every distance is read from. The head turns, reads down and answers.', prov: { kind: 'illustrative', reason: 'the shared figure standing (drawing default)' }, tag: 'THE SOURCE', scene: 'all' },
      { id: 'frame', label: 'the camera’s frame', short: 'FRAME', note: 'The boom stays just outside the widest frame — a wider shot pushes it farther away.', prov: { kind: 'illustrative', reason: 'the lesson L12' }, tag: 'PICTURE', scene: 'all' },
      { id: 'light', label: 'the light and its shadows', short: 'LIGHT', note: 'A boom can throw a shadow into the picture: ask the lighting crew before each new place.', prov: { kind: 'illustrative', reason: 'the lesson L12, L26' }, tag: 'PICTURE', scene: 'all' },
      { id: 'room', label: 'the room behind the talker', short: 'ROOM', note: 'Along the mic’s axis past the talker: a hard floor, a window or a crowd can reach the mic.', prov: { kind: 'illustrative', reason: 'the lesson L24' }, tag: 'REFLECTION', scene: 'studio' },
      { id: 'operator', label: 'the boom operator', short: 'OPERATOR', note: 'Outside every frame, on a clear path; a tired arm drifts — plan relief.', prov: { kind: 'illustrative', reason: 'the lesson L28' }, tag: 'CREW', scene: 'all' },
      { id: 'pa', label: 'the PA', short: 'PA', note: 'Live: every open mic on the stage hears it. The boom’s place and pattern are checked with the system’s operator.', prov: { kind: 'illustrative', reason: 'a typical small stage' }, tag: 'FEEDBACK', scene: 'stage' },
    ],
    stage: 'LIVE: the boom as close as the frame allows, its rejection toward the PA, one mic on air, every route traced. Never provoke feedback.',
    studio: 'STUDIO: the boom just outside the widest frame, aimed at the mouth, on its own channel — a compact directional mic compared if the room is reflective.',
  },
  diagnostic,
  practice: {
    task: 'Choose a boom setup for a studio interview and for a live event, describe an alternative, and explain what would justify a second mic. On a real shoot, with the crew’s agreement, you can record what you tried below.',
    fields: [
      { id: 'scene', label: 'Scene, room and the widest frame', kind: 'text' },
      { id: 'mic', label: 'Mic and where the boom comes from', kind: 'choice', choices: ['short shotgun, above', 'short shotgun, below', 'short shotgun, beside', 'compact directional mic', 'camera’s own mic', 'other'] },
      { id: 'distance', label: 'Distance from the lips and the aim', kind: 'text' },
      { id: 'mount', label: 'Pole or stand, suspension, windscreen', kind: 'text' },
      { id: 'routes', label: 'Program, recorder, earpiece and PA', kind: 'text' },
      { id: 'notes', label: 'Voice, room, noise, picture and decision (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The standing talker: the voice family’s figure, the lips 1550 mm above the floor — a drawing default.', dims: ['yFloor'] },
    { text: 'The cameras (2.2 m out for the close shot, 3.6 m for the wide one, at eye level) and the two shots (head and shoulders; to the waist with room round them) — drawing defaults: no lens is specified.', dims: [] },
    { text: 'Each boom start is calculated from the drawing: the nearest place 15 cm outside the frame on its line, aimed at the mouth — the 15 cm margin, the 45° and 40° lines and the 25° and 70° turns are the lab’s drawing.', dims: [] },
    { text: 'The operator’s place and grip, the pole’s 2.5 m reach, the camera’s shoe, the PA’s place (2 m out, 1.9 m to the left, 1.7 m up) — drawing defaults. The frame’s keep-outs are as wide at the camera as at the talker (a simplified picture).', dims: [] },
    { text: 'The short shotgun is drawn as its supercardioid base with a narrower lobe higher up — a simplified picture: the real pattern narrows and changes with pitch.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. Every shot, room, mic and voice is different: move the boom, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a talker in a typical standing pose, the cameras and their shots as drawing defaults, each boom start calculated from the frame, the shotgun’s pattern as a simplified shape, the two-mic comb as a textbook graph. Distances are rounded to about 5 mm and measured from the lips to the mic’s front. Never swing gear over people; no pole near power lines; never provoke feedback.',
  copy: B04_COPY,
};
