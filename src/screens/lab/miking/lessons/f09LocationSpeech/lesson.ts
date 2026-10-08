/**
 * F09 LOCATION SPEECH AND PRACTICAL SOUNDS — the lesson's pages as DATA
 * (blueprint §7). The words come from the owner's lesson (docs/labs/miking/
 * source_text/F09-Location-Speech-and-Practical-Sounds-Miking-Technique.txt,
 * cited "L<n>" in COMMENTS only) with the fixes logged in
 * docs/labs/miking/CORRECTIONS_LOG.md ("Lab 6 · group 6") applied — among
 * them the power-line clearance the lesson left out (at least 3 m / 10 ft,
 * L30/L42), the lightning wait (30 minutes after the last lightning or
 * thunder, L42), and the institutional wording (L2, L3, L44–L53).
 *
 * One talker with the SET-UP as its variant (WHERE: ON SET / OUTDOORS /
 * LIVE), on the voice family (frame V) and the location kit
 * (lessons/shared/field/location.ts). OWNER RULING 2026-10-04 —
 * learner-facing presentation: suggested starting points, never dogma; no
 * source, brand or model in learner text; no badges.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, LOUD_REASON, clearReason, docReason, hearingDiag, hollowSymptom, nullOnPaper, polarityDelay, removeDelay, superNull, type Words } from '../shared/bowed/bowedItems.ts';
import { F09_MODEL, WEDGE_P } from './geometry.ts';
import { F09_ZONES } from './model.ts';
import { F09_COPY } from './copy.ts';

const W: Words = { noun: 'speech', player: 'talker', moving: 'the head, the hands and the walking path' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the scene',
    goal: 'Get to know the talker and the scene round them — where the voice leaves, what the camera sees, who holds the boom and where the practical action happens — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The voice leaves through the mouth; the camera’s frame, the head’s movement and the action on the counter decide where a mic can go.',
  },
  sound: {
    title: 'Where the voice and the action come from',
    goal: 'See where speech leaves the talker, how the camera’s frame decides how close a boom can come, and what a head turn does to each mic.',
    credit: { scenarios: ['loc.snd.1', 'loc.snd.2', 'loc.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'Every distance is read from the lips. A wider shot pushes the boom away; a body mic keeps its distance but stays on the chest; a turning head takes the voice off a mic that does not follow. Tendencies, and scenes vary.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Know what to settle before any mic goes up on location: the scene map, permission and privacy, asking before touching anyone, separate channels, power lines and weather.',
    credit: { scenarios: ['loc.set.1', 'loc.set.2', 'loc.set.3', 'loc.set.4'], note: 'Answer the four checks.' },
    takeaway: 'Map the scene, ask first, keep each mic on its own channel, never hide a mic to record anyone secretly, keep at least 3 m (10 ft) from power lines, and stop for lightning.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a location mic by access, movement and destination — a boom, a body mic, a planted mic, a handheld or a camera mic — by its properties, never by a brand.',
    credit: { scenarios: ['loc.mic.1', 'loc.mic.2', 'loc.mic.3', 'loc.mic.4', 'loc.rec.1'], note: 'Answer the five checks (one reaches back to the scene).' },
    takeaway: 'A boom for a natural voice when the frame allows; a body mic when the shot is wide or the blocking busy; a planted mic for one place; a handheld when it can be seen; a camera mic as a reference. There is no universal winner.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — a boom just above the frame line, aimed at the mouth, on set; a handheld within about 10 cm live — then move the mic and see what changes.',
    credit: { scenarios: ['loc.place.1', 'loc.place.2', 'loc.place.3', 'loc.rec.2'], interactive: 'twoZones', note: 'Rest the mic, out of the shot and clear of the talker, inside two different suggested starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A suggested zone is a place to begin, measured from the lips — not a rule. The frame, the head turns and the place change the answer during a take; clearance and safety come first.',
  },
  context: {
    title: 'On set or live',
    goal: 'Aim a live presenter’s mic so its pattern’s rejection faces the wedge — and know why on-set and live speech need different choices.',
    credit: { scenarios: ['loc.ctx.1', 'loc.ctx.2', 'loc.ctx.set', 'loc.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. ON SET: answer the decision card. Then the three checks.' },
    takeaway: 'On set the frame and the room decide; live, the audience hears the PA as it happens — close mics, the fewest open, the wedge in the pattern’s rejection, and no mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a boom and a body mic on the same voice can sound hollow together, how their arrival-time difference places comb notches, and why each stays on its own channel.',
    credit: { scenarios: ['loc.two.1', 'loc.two.2', 'loc.two.3', 'loc.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two mics at different distances hear the voice at different times: some pitches cancel in the sum. Keep separate channels, favour the one that serves the scene; polarity flips the sign and never removes a delay.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — the distance, the frame, the head’s turn, the clothing, the wind, the open mics — before reaching for noise reduction or EQ.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up location speech in the right order, choose and justify a setup for a wide shot and for a live presenter, and say what would justify a second mic.',
    credit: { scenarios: ['loc.prac.order', 'loc.prac.gain', 'loc.prac.setup1', 'loc.prac.setup2', 'loc.prac.3', 'loc.mix.1', 'loc.mix.2', 'loc.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real scene and permission.' },
    takeaway: 'Placement before processing, separate channels, the frame respected, consent asked, power lines and weather respected, and an honest account of polarity versus delay pass. A brand or a “hotter” signal do not — and more than one setup can pass.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only: loc.snd.* L3, L5, L29 · loc.set.*
 * L5–L6, L41–L43 (corrected) · loc.mic.* L11–L27 · loc.place.* L29–L34 ·
 * loc.ctx.* L33, L40 · loc.two.* L6, L37 · loc.prac.* / loc.mix.* L44–L51.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'loc.snd.1',
    page: 'sound',
    prompt: 'On a set, what is every distance in this lesson measured from?',
    options: ['The talker’s lips, to the mic’s capsule', 'The camera’s lens, to the mic’s capsule', 'The talker’s chest, where a body mic goes'],
    correct: 'The talker’s lips, to the mic’s capsule',
    explain: 'Speech leaves through the mouth, so the distances start at the lips. The camera decides where a mic may go, but the voice is measured from the mouth.',
    why: {
      'The camera’s lens, to the mic’s capsule': 'The lens decides the frame, not the voice. A mic near the camera is as far from the mouth as the camera is.',
      'The talker’s chest, where a body mic goes': 'The chest is where a body mic sits; the voice still leaves through the mouth.',
    },
  },
  {
    id: 'loc.snd.2',
    page: 'sound',
    prompt: 'The director changes from a medium shot to a wide one. What tends to happen to the boom?',
    options: ['It moves farther from the mouth to stay out of shot', 'It can come closer, since the talker now looks smaller', 'Nothing changes: the shot does not affect the boom'],
    correct: 'It moves farther from the mouth to stay out of shot',
    explain: 'A wider shot raises the top of the frame above the head, and the boom must stay above it — farther from the mouth, with more room and noise against the voice. A body mic keeps its distance.',
    why: {
      'It can come closer, since the talker now looks smaller': 'The talker looks smaller because the frame is bigger: the top edge rises, and the boom with it.',
      'Nothing changes: the shot does not affect the boom': 'The frame’s top edge is exactly what limits a boom.',
    },
  },
  {
    id: 'loc.snd.3',
    page: 'sound',
    prompt: 'The talker turns the head well to one side during the line. Which mic needs re-aiming?',
    options: ['The boom above — the body mic stays on the chest', 'The body mic, which turns along with the head', 'Neither of them: a head turn leaves both mics unchanged'],
    correct: 'The boom above — the body mic stays on the chest',
    explain: 'The mouth’s axis swings with the head. A boom left where it was ends up off the axis, hearing a duller voice; the operator turns it with the talker. A body mic is on the chest: it does not follow the head.',
    why: {
      'The body mic, which turns along with the head': 'A body mic is clipped to the chest, which stays put while the head turns.',
      'Neither of them: a head turn leaves both mics unchanged': 'The voice’s highs go out ahead of the mouth: a turn away from a fixed mic dulls it.',
    },
  },
  {
    id: 'loc.set.1',
    page: 'setting',
    prompt: 'A storm builds while you finish an outdoor take, and you hear thunder. What do you do?',
    options: ['Stop and get inside a safe place now', 'Finish the take, then pack up the stands', 'Lower the boom pole and carry on recording'],
    correct: 'Stop and get inside a safe place now',
    explain: 'When thunder is heard, stop and get inside a safe place at once — do not stay to finish a take. Wait 30 minutes after the last lightning or thunder before going back out.',
    why: {
      'Finish the take, then pack up the stands': 'No take is worth the risk: thunder means lightning is close enough to strike. Shelter first.',
      'Lower the boom pole and carry on recording': 'A lower pole does not make outdoors safe in a storm. Get inside a safe place.',
    },
  },
  {
    id: 'loc.set.2',
    page: 'setting',
    prompt: 'A mic can be hidden in a prop, out of the camera’s view. Does that let you record anyone there?',
    options: ['Permission and the privacy rules still decide', 'Out of view, it needs no further permission at all', 'It is allowed as long as no one sees its cable'],
    correct: 'Permission and the privacy rules still decide',
    explain: 'A mic hidden from the camera is not automatically allowed to record people. Confirm the production’s permission and the privacy rules that apply, and never hide a mic to record anyone secretly.',
    why: {
      'Out of view, it needs no further permission at all': 'Hidden from the camera is a picture decision, not a permission.',
      'It is allowed as long as no one sees its cable': 'Whether the cable shows has nothing to do with permission or privacy.',
    },
  },
  {
    id: 'loc.set.3',
    page: 'setting',
    prompt: 'Why keep the boom, the body mic and the plant each on its own labelled channel?',
    options: ['So each perspective can be heard, chosen and blended', 'So the three mics can be summed into one louder voice track', 'So the boom and the body mic make a stereo pair'],
    correct: 'So each perspective can be heard, chosen and blended',
    explain: 'Each mic is a different perspective with its own distance, room and timing. On separate channels they can be soloed, compared and blended on purpose — or one chosen.',
    why: {
      'So the three mics can be summed into one louder voice track': 'Summing mics at different distances can sound hollow; level comes from gain, not from more mics.',
      'So the boom and the body mic make a stereo pair': 'They are two perspectives on one voice, not the left and right of a stereo picture.',
    },
  },
  {
    id: 'loc.set.4',
    page: 'setting',
    prompt: 'The boom mic is rated to a very high maximum level. What does that say about a long, loud day on location?',
    options: ['Nothing about ears: it is the mic’s limit', 'The crew is safe up to the mic’s rated level', 'The crew is safe while the mic is nearer the noise'],
    correct: 'Nothing about ears: it is the mic’s limit',
    explain: 'A mic’s maximum level says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'The crew is safe up to the mic’s rated level': 'A mic rating is not a hearing limit.',
      'The crew is safe while the mic is nearer the noise': 'Where the mic sits says nothing about your ears.',
    },
  },
  {
    id: 'loc.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · What limits how close a boom can come on a set?',
    options: ['The top edge of the camera’s frame', 'The length of the boom operator’s arms', 'The loudest word the talker says'],
    correct: 'The top edge of the camera’s frame',
    explain: 'The boom stays just above the frame — no mic, pole or shadow in the shot. A wider shot moves that edge up, and the boom with it.',
    why: {
      'The length of the boom operator’s arms': 'The pole gives the reach; the frame decides how close the mic may come.',
      'The loudest word the talker says': 'Level is set with gain. The frame decides the distance.',
    },
  },
  {
    id: 'loc.mic.1',
    page: 'microphone',
    prompt: 'Why does a shotgun on the camera not replace a boom near the talker?',
    options: ['It points the right way but stays as far away as the camera', 'A shotgun picks up only the sounds straight behind the camera', 'A camera mic records only after the camera starts rolling'],
    correct: 'It points the right way but stays as far away as the camera',
    explain: 'A directional pattern narrows the pickup; it does not shorten the distance. At the camera the voice is weaker against the room and the noise — move a mic closer instead of raising its gain.',
    why: {
      'A shotgun picks up only the sounds straight behind the camera': 'It faces the talker. The problem is its distance, not its direction.',
      'A camera mic records only after the camera starts rolling': 'Timing is not the issue: distance is.',
    },
  },
  {
    id: 'loc.mic.2',
    page: 'microphone',
    prompt: 'Indoors, among hard walls, which boom mic is worth comparing with the shotgun?',
    options: ['A short hypercardioid, at the same distance', 'A longer shotgun, so the room drops away more', 'An omni, for a more focused voice'],
    correct: 'A short hypercardioid, at the same distance',
    explain: 'Indoors, reflections reach a shotgun from all round; a short directional mic with a smoother off-axis sound often does as well or better. Compare the two at the same distance.',
    why: {
      'A longer shotgun, so the room drops away more': 'A longer tube narrows only the higher frequencies; it does not make reflections drop away indoors.',
      'An omni, for a more focused voice': 'An omni hears the room from every side — the opposite of focus.',
    },
  },
  {
    id: 'loc.mic.3',
    page: 'microphone',
    prompt: 'What is a body mic (lav) good for on location?',
    options: ['One steady distance from the mouth in a wide shot', 'A fuller, more natural voice than a boom can give', 'Hearing the whole room around the talker evenly'],
    correct: 'One steady distance from the mouth in a wide shot',
    explain: 'A body mic stays the same distance from the mouth however wide the shot. The trade-offs: a chest-heavy tone, clothing noise, and it does not turn with the head.',
    why: {
      'A fuller, more natural voice than a boom can give': 'A well-placed boom often sounds more natural; a body mic can sound of the chest and the clothes.',
      'Hearing the whole room around the talker evenly': 'Close to the voice, it hears much less of the room than a boom does.',
    },
  },
  {
    id: 'loc.mic.4',
    page: 'microphone',
    prompt: 'What does a fur windshield over the boom do outdoors?',
    options: ['It slows the wind at the capsule; it is not rainproof', 'It keeps the rain off the mic, the cable and the pole', 'It turns the shotgun into a narrower, longer-reaching mic'],
    correct: 'It slows the wind at the capsule; it is not rainproof',
    explain: 'Foam helps in light wind; a basket and fur outdoors. Neither keeps water out, and neither changes the pattern.',
    why: {
      'It keeps the rain off the mic, the cable and the pole': 'Wind protection is not waterproofing.',
      'It turns the shotgun into a narrower, longer-reaching mic': 'The windshield does not change the pattern; it slows the air.',
    },
  },
  {
    id: 'loc.place.1',
    page: 'placement',
    prompt: 'You lower the boom until the shot shows its tip. What is the first fix?',
    options: ['Raise it above the frame, still aimed at the mouth', 'Keep it there and have the picture cropped later on', 'Raise the gain on the camera mic instead'],
    correct: 'Raise it above the frame, still aimed at the mouth',
    explain: 'No mic, pole or shadow in the shot: the boom stays just above the frame’s top edge, aimed down at the mouth. If it cannot get close enough for the shot, a body mic often takes over.',
    why: {
      'Keep it there and have the picture cropped later on': 'The picture is not yours to crop. Keep the mic out of the shot.',
      'Raise the gain on the camera mic instead': 'More gain on a distant mic raises the room and the noise too. Move a mic closer.',
    },
  },
  {
    id: 'loc.place.2',
    page: 'placement',
    prompt: 'Where does a body mic tend to go on a shirt, as a starting point?',
    options: ['Just above the breastbone, clear of rubbing fabric', 'Deep under two layers, where nothing can see it', 'On the collar at the back of the neck, out of view'],
    correct: 'Just above the breastbone, clear of rubbing fabric',
    explain: 'Just above the breastbone is a usual start, with the wearer’s agreement; the clothing decides the details. Hiding deeper is not an improvement in itself — it can muffle the voice and add rubbing.',
    why: {
      'Deep under two layers, where nothing can see it': 'Deeper often means muffled and noisier. Hide only as much as the shot needs.',
      'On the collar at the back of the neck, out of view': 'Behind the neck the mic faces away from the mouth.',
    },
  },
  {
    id: 'loc.place.3',
    page: 'placement',
    prompt: 'Outdoors there is a power line overhead behind the talker. How far must the pole stay?',
    options: ['At least 3 m (10 ft) — farther if unsure', 'About 1 m, so long as the pole is not touching', 'Closer is fine, while the mic is not raised high'],
    correct: 'At least 3 m (10 ft) — farther if unsure',
    explain: 'Keep the pole, the stands and every mic at least 3 m (10 ft) from overhead power lines — farther if you do not know the voltage. If you cannot be sure of the clearance, do not raise the pole.',
    why: {
      'About 1 m, so long as the pole is not touching': 'Electricity can jump a gap: 1 m is far too close. At least 3 m (10 ft).',
      'Closer is fine, while the mic is not raised high': 'The pole’s whole length counts. At least 3 m (10 ft) from the line, and if unsure, keep it down.',
    },
  },
  {
    id: 'loc.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Before clipping a mic to a performer’s costume, what comes first?',
    options: ['Asking them, and following the costume practice', 'Testing whether the clip holds firmly on their skin', 'Hiding the cable so the camera cannot see it'],
    correct: 'Asking them, and following the costume practice',
    explain: 'Ask before touching a performer or attaching anything to clothing or skin, and follow the production’s costume and hygiene practice.',
    why: {
      'Testing whether the clip holds firmly on their skin': 'Nothing touches a person before they agree — and tape or clips on skin only if they have explicitly agreed.',
      'Hiding the cable so the camera cannot see it': 'The cable comes later. Consent comes first.',
    },
  },
  {
    id: 'loc.ctx.1',
    page: 'context',
    prompt: 'A presenter on a stage, a wedge in front. A fair first step for the speech mic?',
    options: ['A close handheld, its rejection toward the wedge', 'A planted mic at the back of the stage', 'The camera mic, turned up until the voice cuts through'],
    correct: 'A close handheld, its rejection toward the wedge',
    explain: 'Live, the audience hears the PA as it happens. A close mic keeps the voice ahead of the PA and the room; aim its rejection at the wedge. A distant plant or camera mic brings more PA and room into the system.',
    why: {
      'A planted mic at the back of the stage': 'Far from the mouth, it hears the PA and the room almost as much as the voice — less margin before feedback.',
      'The camera mic, turned up until the voice cuts through': 'More gain on a distant mic brings feedback closer.',
    },
  },
  superNull('loc.ctx.2', 'context', 'wedge'),
  {
    id: 'loc.ctx.set',
    page: 'context',
    prompt: 'On a quiet indoor set, a medium shot, the talker moving between two marks. A fair first setup?',
    options: ['A boom above the frame, a body mic on its own channel', 'Only the camera mic, for a natural sound of the room', 'Two body mics on the talker, summed together on one track'],
    correct: 'A boom above the frame, a body mic on its own channel',
    explain: 'A boom just above the frame, aimed at the mouth and following the head, is a place to begin; a body mic on its own channel covers the wide moments. The editor chooses.',
    why: {
      'Only the camera mic, for a natural sound of the room': 'At the camera the voice is weak against the room. Use it as a reference.',
      'Two body mics on the talker, summed together on one track': 'Two mics summed on one voice can sound hollow; keep separate channels instead.',
    },
  },
  {
    id: 'loc.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · What does a body mic on the chest do when the head turns?',
    options: ['Stays put: it moves with the chest, not the head', 'Turns with the head, so the voice stays on its axis', 'Moves farther from the mouth than a boom'],
    correct: 'Stays put: it moves with the chest, not the head',
    explain: 'A body mic follows the torso. Its distance from the mouth barely changes; the boom is the mic that is turned with the head.',
    why: {
      'Turns with the head, so the voice stays on its axis': 'It is clipped to the chest; the head turns above it.',
      'Moves farther from the mouth than a boom': 'It stays close — usually closer than the boom.',
    },
  },
  {
    id: 'loc.two.1',
    page: 'twoMic',
    prompt: 'The boom and the body mic sound hollow when blended. Why?',
    options: ['The voice reaches them at different times', 'The body mic reverses the voice’s polarity', 'The closer mic is louder, so it cancels'],
    correct: 'The voice reaches them at different times',
    explain: 'The body mic is nearer the mouth, so it hears each word first; the boom a little later. Summed, some pitches arrive out of step and cancel — a comb of notches. Favour one channel or rebalance first.',
    why: {
      'The body mic reverses the voice’s polarity': 'Distance delays a sound; it does not flip its sign.',
      'The closer mic is louder, so it cancels': 'A level difference changes the notches’ depth; the delay makes them.',
    },
  },
  polarityDelay('loc.two.2'),
  {
    id: 'loc.two.3',
    page: 'twoMic',
    prompt: 'You flip the body mic’s polarity and the blend sounds fuller. What is a fair next step?',
    options: ['Match the levels, then compare both states in mono', 'Keep it inverted for this talker in all scenes', 'Set it back, as normal polarity is the right one'],
    correct: 'Match the levels, then compare both states in mono',
    explain: 'A louder or fuller sum can fool the ear. Match the levels, compare both polarity states in mono — and remember polarity does not remove the delay between the two mics.',
    why: {
      'Keep it inverted for this talker in all scenes': 'The talker moves and the distances change: judge each scene, at matched levels.',
      'Set it back, as normal polarity is the right one': 'Neither state is right by rule: compare them at matched levels.',
    },
  },
  {
    id: 'loc.two.4',
    page: 'twoMic',
    prompt: 'What is a fair way to use a boom and a body mic on the same take?',
    options: ['Separate channels; choose or blend on purpose', 'One channel with both mics mixed at the source', 'Record only the louder of the two mics'],
    correct: 'Separate channels; choose or blend on purpose',
    explain: 'They are two perspectives. Kept apart, each can be soloed, compared in mono and chosen moment by moment — or blended on purpose.',
    why: {
      'One channel with both mics mixed at the source': 'A blend made at the source cannot be undone; a hollow sum stays hollow.',
      'Record only the louder of the two mics': 'Louder is not better: level comes from gain. Keep both perspectives.',
    },
  },
  {
    id: 'loc.prac.gain',
    page: 'practice',
    prompt: 'On the camera reference track the voice is faint. What do you do first?',
    options: ['Move a mic closer, then check the level', 'Raise the camera input until it sounds full', 'Ask the talker to shout the whole scene'],
    correct: 'Move a mic closer, then check the level',
    explain: 'Do not raise gain as a substitute for moving a mic closer: more gain raises the room, the noise and the camera’s own sounds as much as the voice.',
    why: {
      'Raise the camera input until it sounds full': 'Gain lifts everything the mic hears, not only the voice.',
      'Ask the talker to shout the whole scene': 'The performance is the scene. Move the mic, not the talker’s voice.',
    },
  },
  {
    id: 'loc.prac.3',
    page: 'practice',
    prompt: 'What would justify a second mic on the talker?',
    options: ['A need the first cannot meet, each on its own channel', 'More channels give the editor more to use, so add one', 'The voice needs more level than one mic can give'],
    correct: 'A need the first cannot meet, each on its own channel',
    explain: 'A body mic for the wide moments, a plant for the action — each earns its place for a reason, on its own channel, checked solo and in mono.',
    why: {
      'More channels give the editor more to use, so add one': 'Each extra mic adds noise, room and a combining check. It should earn its place.',
      'The voice needs more level than one mic can give': 'Level comes from gain and placement, not from another mic.',
    },
  },
  {
    id: 'loc.mix.1',
    page: 'practice',
    prompt: 'A wide shot puts the boom’s capsule 110 cm away; the body mic is 21 cm away. What tends to follow?',
    options: ['The boom hears more room against the voice', 'The boom hears the voice exactly as well', 'The body mic hears more room than the boom'],
    correct: 'The boom hears more room against the voice',
    explain: 'By distance alone the boom hears the voice about 14 dB weaker than the body mic, with the room much the same — so more room against the voice. A tendency, judged by ear.',
    why: {
      'The boom hears the voice exactly as well': 'About five times as far: the voice arrives weaker at the boom.',
      'The body mic hears more room than the boom': 'Close to the mouth, the body mic hears the voice strongly against the room.',
    },
  },
  nullOnPaper('loc.mix.2', 'wedge'),
  removeDelay('loc.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'loc.sym.room',
    observation: 'The boom track sounds distant and roomy',
    firstChecks: 'Is the boom as close as the frame allows? Is it aimed at the mouth through the whole line? A wider shot may need the body mic.',
    options: ['Bring it as close as the frame allows', 'Turn the boom channel up in the mix', 'Swap it for a longer shotgun from farther'],
    correct: 'Bring it as close as the frame allows',
    explain: 'Distance decides the voice against the room. Close the gap the frame allows; if the shot is too wide for that, the body mic takes over those moments.',
    why: {
      'Turn the boom channel up in the mix': 'Gain raises the room as much as the voice.',
      'Swap it for a longer shotgun from farther': 'A longer tube narrows the highs only; it does not reach farther.',
    },
  },
  {
    id: 'loc.sym.rub',
    observation: 'Rustling and scratching on the body mic',
    firstChecks: 'Is fabric rubbing the capsule or the cable? Is the cable loop secured? Test turning, sitting and the arms moving.',
    options: ['Clear the capsule of the fabric; secure the loop', 'Hide the capsule deeper under another layer of cloth', 'Add heavy noise reduction to the track later'],
    correct: 'Clear the capsule of the fabric; secure the loop',
    explain: 'Clothing noise starts where fabric touches the capsule or pulls the cable. Fix the placement and the strain relief first; deeper is not quieter.',
    why: {
      'Hide the capsule deeper under another layer of cloth': 'More layers usually add rubbing and muffle the voice.',
      'Add heavy noise reduction to the track later': 'Fix it at the source first: processing cannot rebuild a covered word.',
    },
  },
  {
    id: 'loc.sym.wind',
    observation: 'Rumbling thumps on the boom outdoors',
    firstChecks: 'Is the fur cover on? Is the cable slapping the pole? Is the operator’s handling quiet?',
    options: ['The fur on, the cable secured, quiet handling', 'Cut all of the low end on the channel to remove it', 'Point the mic down at the ground, out of the wind'],
    correct: 'The fur on, the cable secured, quiet handling',
    explain: 'Wind and handling make thumps. A basket and fur slow the wind; a secured cable and a quiet rehearsal stop the slaps. A deep low cut can remove the voice’s body too.',
    why: {
      'Cut all of the low end on the channel to remove it': 'A deep cut thins the voice and leaves the cause in place.',
      'Point the mic down at the ground, out of the wind': 'Off the mouth, the voice drops; the wind stays.',
    },
  },
  {
    id: 'loc.sym.turn',
    observation: 'The voice dulls whenever the talker turns',
    firstChecks: 'Does the boom follow the head through the line? Was the rehearsal done with the turns?',
    options: ['Rehearse the turns; re-aim the boom with the head', 'Boost the treble on the boom track afterwards to match', 'Ask the talker to keep facing the camera'],
    correct: 'Rehearse the turns; re-aim the boom with the head',
    explain: 'The voice’s highs go ahead of the mouth. A boom that stays put ends up off the axis; rehearse and follow the head — or have a body mic for those moments.',
    why: {
      'Boost the treble on the boom track afterwards to match': 'EQ cannot put back what an off-axis mic missed — and it raises the hiss.',
      'Ask the talker to keep facing the camera': 'The blocking is the scene. Follow it.',
    },
  },
  {
    id: 'loc.sym.feedback',
    observation: 'Live: the PA rings when the presenter walks forward',
    firstChecks: 'Lower the level at once. Is the mic now near the PA or the wedge? Too many open mics?',
    options: ['Lower the level, then fix the mic and the open mics', 'Turn the voice up so it covers up the ringing sound', 'Cup the handheld so the sound stays inside the grille'],
    correct: 'Lower the level, then fix the mic and the open mics',
    explain: 'Feedback is a sound-system condition: lower the send first, then close unused mics and change the geometry — the wedge in the rejection, the presenter clear of the PA. Never provoke feedback on purpose.',
    why: {
      'Turn the voice up so it covers up the ringing sound': 'More gain feeds the loop.',
      'Cup the handheld so the sound stays inside the grille': 'Cupping changes the pattern and usually brings feedback closer.',
    },
  },
  hollowSymptom('loc.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'loc.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of an on-set speech setup in the order you would do them.',
    steps: [
      { text: 'Map the scene: marks, head turns, frame, action, noise', early: 'Start with the scene before any equipment.' },
      { text: 'Confirm permission; ask before any mic goes on a person', early: 'Consent and permission come before placing anything on anyone.' },
      { text: 'Rehearse the widest movement and the widest shot', early: 'Rehearse once you know the scene and have permission.' },
      { text: 'Boom just above the frame, aimed at the mouth', early: 'Place the boom once the frame and movement are known.' },
      { text: 'A body mic or a plant only for a need, each on its own channel', early: 'Add a second mic after the first is placed.' },
      { text: 'Set gain on the loudest real line, with headroom', early: 'Gain comes once the mics are placed and connected.' },
      { text: 'Solo each channel, then check any blend in mono', early: 'Check the channels once they are recording.' },
    ],
    explain: 'A sensible order. Phantom power: mute the outputs first and follow your own equipment’s manual. Gain: set it on the loudest real line with headroom — the first full take is often louder than the rehearsal.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'loc.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A documentary interview outdoors: a wide shot opening to a medium, light wind, a power line along the street behind.',
    setups: [
      { id: 'a', label: 'A body mic on the chest, plus a boom in fur above the medium shot', ok: true, power: 'phantom', feedback: 'A suggested start: the body mic holds the wide shot, the boom the medium — each on its own channel, the pole well away from the line.' },
      { id: 'b', label: 'A boom in fur just above the frame, the pole kept clear of the line', ok: true, power: 'phantom', feedback: 'A suggested start if the frame lets it come close enough — check the wide shot and the clearance from the line.' },
      { id: 'c', label: 'The camera mic alone, turned up for the wide shot', ok: false, power: 'none', feedback: 'At the camera the voice is weak against the wind and the street. Get a mic closer.' },
      { id: 'd', label: 'A boom raised high over the talker toward the line', ok: false, power: 'phantom', feedback: 'Never near a power line: at least 3 m (10 ft) from the pole and the mic, and if unsure, keep it down.' },
      { id: 'e', label: 'A body mic hidden without the guest knowing', ok: false, power: 'pack', feedback: 'Never hide a mic to record anyone secretly. Ask, and fit it with their agreement.' },
    ],
    reasons: [docReason('the lips'), clearReason('the shot, the talker and the power line (at least 3 m)'), { id: 'r.consent', label: 'The guest agreed before the body mic was fitted', role: 'required', feedback: 'Say how consent was handled: ask first.' }, { id: 'r.wind', label: 'The fur slows the wind; it does not keep rain out', role: 'optional', feedback: 'A fair outdoor reason.' }, BRAND_REASON('location shoot'), LOUD_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point measured from the lips, out of the shot, clear of the power line, consent asked, and each mic on its own channel.',
  },
  {
    id: 'loc.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A presenter walks a small stage with a PA, a wedge in front, a live stream and a recorder.',
    setups: [
      { id: 'a', label: 'A handheld within about 10 cm, its rejection toward the wedge', ok: true, power: 'none', feedback: 'A suggested start: close enough to stay ahead of the PA — check the wedge against the actual pattern.' },
      { id: 'b', label: 'A headset or a body mic fitted well, the fewest open mics', ok: true, power: 'pack', feedback: 'A suggested start for a presenter who moves — check the margin before feedback with the PA on.' },
      { id: 'c', label: 'A planted mic at the back of the stage for the whole talk', ok: false, power: 'phantom', feedback: 'Far from the mouth it hears the PA and the room: less margin before feedback.' },
      { id: 'd', label: 'The handheld, cupped by the presenter for more level', ok: false, power: 'none', feedback: 'Cupping changes the pattern and brings feedback closer.' },
      { id: 'e', label: 'Every spare mic left open in case it helps', ok: false, power: 'phantom', feedback: 'Each open mic adds room and lowers the margin before feedback. Close the unused ones.' },
    ],
    reasons: [docReason('the lips'), clearReason('the presenter’s face, hands and walking path'), { id: 'r.paths', label: 'The stream, the recorder and the PA are checked as separate paths', role: 'required', feedback: 'Say how the feeds are kept apart.' }, { id: 'r.null', label: 'The pattern’s rejection faces the wedge', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON('presenter'), { id: 'r.loudest', label: 'Turn it up until the voice is louder than the PA', role: 'wrong', feedback: 'More gain brings feedback closer.' }],
    explain: 'Two setups pass. What passes is the reasoning: a close mic measured from the lips, the fewest open mics, the wedge against the actual pattern, and separate paths for the stream, the recorder and the PA.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: where does a talker’s voice leave the body?', options: ['The chest', 'The mouth (and the nose)', 'The throat'], after: 'Now STEP through (or PLAY ONCE) and watch the breath, the folds, the throat and the mouth.' },
  microphone: { prompt: 'Before you move anything: which mic keeps one distance from the mouth in a wide shot?', options: ['The boom', 'The body mic', 'The camera mic'], after: 'Now choose each TYPE and see where it starts.' },
  placement: { prompt: 'Predict: you bring the boom’s capsule from 110 cm to 80 cm from the lips. What changes?', options: ['More voice, less room', 'More room', 'It depends on this scene'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge is on the floor in front of the presenter. Where will a supercardioid aimed at the mouth reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip the body mic’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'sound',
    prompt: 'A wider shot is called. What tends to happen to the boom?',
    options: ['It moves farther from the mouth', 'It can come closer to the mouth', 'Nothing: the shot does not limit a boom'],
    correct: 'It moves farther from the mouth',
    explain: 'The frame’s top edge rises with a wider shot, and the boom stays above it — farther from the mouth.',
    why: {
      'It can come closer to the mouth': 'A wider frame takes more space above the head, not less.',
      'Nothing: the shot does not limit a boom': 'The frame is exactly what limits a boom.',
    },
  },
  {
    id: 'q.2',
    covers: 'sound',
    prompt: 'The talker turns the head. Which mic stays at the same place relative to the chest?',
    options: ['The body mic on the chest', 'The boom held above the head', 'The mic on top of the camera'],
    correct: 'The body mic on the chest',
    explain: 'A body mic is clipped to the chest; it does not follow the head. The boom is re-aimed with the head.',
    why: {
      'The boom held above the head': 'The boom is held by an operator, who follows the head.',
      'The mic on top of the camera': 'It stays on the camera, far from the talker.',
    },
  },
  {
    id: 'q.3',
    covers: 'setting',
    critical: true,
    prompt: 'Outdoors, how far must the boom pole and mic stay from an overhead power line?',
    options: ['At least 3 m (10 ft), farther if unsure', 'About 1 m, as long as nothing is touching', 'Only clear enough to avoid the wires'],
    correct: 'At least 3 m (10 ft), farther if unsure',
    explain: 'Keep the pole, the stands and every mic at least 3 m (10 ft) from overhead power lines — farther if you do not know the voltage; if you cannot be sure, keep the pole down.',
    why: {
      'About 1 m, as long as nothing is touching': 'Electricity can jump a gap. At least 3 m (10 ft).',
      'Only clear enough to avoid the wires': 'Clear of the wires is not enough: at least 3 m (10 ft).',
    },
  },
  {
    id: 'q.4',
    covers: 'setting',
    critical: true,
    prompt: 'You hear thunder during an outdoor take. When can you go back out?',
    options: ['30 minutes after the last lightning or thunder', 'As soon as the rain has stopped falling there', 'When the thunder starts to sound farther away'],
    correct: '30 minutes after the last lightning or thunder',
    explain: 'Get inside a safe place at once when thunder is heard; wait 30 minutes after the last lightning or thunder before going back out.',
    why: {
      'As soon as the rain has stopped falling there': 'Lightning can strike after the rain stops. Wait 30 minutes after the last lightning or thunder.',
      'When the thunder starts to sound farther away': 'A distant storm can still strike. Wait 30 minutes after the last lightning or thunder.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'A mic is hidden in a prop, out of the camera’s view. What does that change about permission?',
    options: ['Nothing — permission and privacy still decide', 'It removes the need to ask the people who are there', 'It is fine for as long as the cable stays hidden'],
    correct: 'Nothing — permission and privacy still decide',
    explain: 'Hidden from the camera is a picture decision. Permission and the privacy rules decide what may be recorded — never hide a mic to record anyone secretly.',
    why: {
      'It removes the need to ask the people who are there': 'Out of view is not permission.',
      'It is fine for as long as the cable stays hidden': 'The cable has nothing to do with permission.',
    },
  },
  hearingDiag('q.6', W),
];

const wedges: Wedge[] = [
  {
    id: 'wedge',
    label: 'the presenter’s floor wedge, in front, facing back at them',
    short: 'WEDGE',
    p: WEDGE_P,
    lift: 250,
    faces: { x: -1, y: 0, z: 0 },
    note: 'On the floor about a metre in front of the presenter, facing back at them: behind a handheld aimed at the mouth, and well below it — so the pattern and the tilt both decide how much it hears.',
    prov: { kind: 'illustrative', reason: 'Lab 5’s wedge (E01): in front of the talker = behind the mic; its distance and size are drawing defaults' },
  },
];

export const F09_LESSON: Lesson = {
  id: 'F09',
  labId: 'field',
  title: 'Location Speech and Practical Sounds',
  subtitle: 'A boom just above the frame, a body mic on the chest, a plant for the action — each on its own channel',
  noun: { one: 'talker on location', many: 'talkers on location', subject: 'talker', person: true },
  model: F09_MODEL,
  micTypeIds: ['locBoomSgCap', 'locBoomHyper', 'locBoomFurCap', 'locLav', 'locPlant', 'locCamCap', 'vocDynCard', 'vocDynSuper', 'vocHeadset'],
  zones: F09_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  // Outdoors the boom + body-mic pair is the same pair as on set (the two-mic
  // copy is the set's): the lesson's own zones, logged (CORRECTIONS_LOG G6).
  setupPairs: [{ label: 'Boom + body mic, each on its own channel', A: { zone: 'loc.boom.out' }, B: { zone: 'loc.lav.out' }, variants: ['outdoor'] }],
  orient: [
    { title: 'WHAT IT IS', text: 'Speech recorded where it happens — on a set, on a street, on a stage — and the practical sounds of the scene: keys on a counter, a door, a switch. The voice leaves through the mouth; the camera, the movement and the place decide where a mic can be.', src: 'LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'Film and documentary sets, interviews, presentations and live events: a boom held just outside the frame, a body mic on the chest, a mic planted in the set, a handheld in view, a mic on the camera.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE STORY', text: 'It carries the words — intelligible, at the right perspective for the picture — and the actions that make a scene feel real. Words and actions take turns at being the most important sound.', src: 'LESSON' },
    { title: 'NO UNIVERSAL WINNER', text: 'A boom can keep a natural voice when it can get close; a body mic keeps one distance in wide shots but can sound of the chest and the clothes. Many crews record both, each on its own channel. Experimentation is encouraged.', src: 'LESSON' },
  ],
  sound: {
    stages: [
      { title: 'Breath from the lungs', text: 'The lungs push air up the windpipe — the power behind every word, quiet or loud.' },
      { title: 'The vocal folds buzz', text: 'In the voice box, low in the throat, two small folds come together and the breath sets them buzzing. That buzz is the raw sound of the voice.' },
      { title: 'The throat and mouth shape it', text: 'The throat, the tongue, the lips and the open mouth shape the buzz into vowels and words; the tongue, the teeth and the lips add the consonants.' },
      { title: 'It leaves the mouth', text: 'Almost all of it leaves through the open mouth — on m, n and ng partly through the nose. That is where every distance here is measured from: the lips.' },
    ],
    attack: 'P, B, T, K, S and F are short and sharp: a P or B pushes a puff of air straight out of the lips, an S sends a narrow hiss forward. A mic close in their path — a handheld, a headset — hears pops and harsh S sounds; a boom above the frame is out of their way.',
    body: 'The vowels carry most of the level and the tone. The voice’s highest frequencies go out ahead of the mouth, so a mic off the mouth’s axis — or a head turned away — hears a duller voice. Tendencies, to check by ear.',
    head: { diameterMm: 0, rods: 0, label: 'the mouth', strikeSrc: 'LESSON' },
  },
  setting: {
    items: [
      { id: 'talker', label: 'the talker', short: 'TALKER', note: 'Standing at the counter, the mouth at the point every distance is read from. The head turns and the talker walks between marks.', prov: { kind: 'illustrative', reason: 'the shared figure (drawing default)' }, tag: 'THE SOURCE', scene: 'all' },
      { id: 'frame', label: 'the camera’s frame', short: 'THE FRAME', note: 'No mic, pole or shadow in the shot: the boom stays just above the frame’s top edge. A wider shot pushes it away.', prov: { kind: 'illustrative', reason: 'location.ts SHOTS (drawing defaults)' }, tag: 'KEEP OUT', scene: 'all' },
      { id: 'keys', label: 'the keys on the counter', short: 'KEYS', note: 'A practical sound with its own moment. A planted mic can cover it on its own channel; it may need priority over the words for a second.', prov: { kind: 'illustrative', reason: 'the lesson’s exercise (L45): keys on a table' }, tag: 'THE ACTION', scene: 'studio' },
      { id: 'noise', label: 'air conditioning, traffic and hard walls', short: 'NOISE · ROOM', note: 'What else the mics hear. Change what you can at the source — switch off, move away, soften — before relying on noise reduction later.', prov: { kind: 'illustrative', reason: 'the lesson L5' }, tag: 'SPILL', scene: 'all' },
      { id: 'line', label: 'an overhead power line', short: 'POWER LINE', note: 'Outdoors: the pole and every mic at least 3 m (10 ft) away — farther if unsure; if you cannot be sure, the pole stays down.', prov: { kind: 'sourced', src: 'OSHA-ELEC', quote: 'Stay at least 10 feet away from overhead power lines.' }, tag: 'SAFETY', scene: 'all' },
      { id: 'pa', label: 'the PA and the wedge', short: 'PA · WEDGE', note: 'Live: the audience hears the loudspeakers as it happens, and every open mic hears them too. The fewest open mics; the wedge in the pattern’s rejection.', prov: { kind: 'illustrative', reason: 'a typical small stage' }, tag: 'FEEDBACK', scene: 'stage' },
    ],
    stage: 'LIVE: a close handheld, a headset or a well-fitted body mic; the wedge where the pattern rejects most; the fewest open mics; the stream, the recorder and the PA checked as separate paths. Never provoke feedback.',
    studio: 'ON SET: a boom just above the frame, aimed at the mouth and following the head; a body mic and a plant only for a need, each on its own channel; the camera mic as a reference.',
  },
  diagnostic,
  practice: {
    task: 'Choose a speech setup for a wide outdoor shot and for a live presenter, describe an alternative, and explain what would justify a second mic. With a real scene, the talker’s agreement and the production’s permission, you can record what you tried below.',
    fields: [
      { id: 'scene', label: 'Scene and permission', kind: 'text' },
      { id: 'mic', label: 'Mic', kind: 'choice', choices: ['boom', 'body mic (lav)', 'planted mic', 'handheld', 'camera reference', 'other'] },
      { id: 'place', label: 'Placement, angle and channel', kind: 'text' },
      { id: 'distance', label: 'Distance from the lips (and the shot size)', kind: 'text' },
      { id: 'notes', label: 'Speech, action, noise and decision (tendencies, in words)', kind: 'text' },
      { id: 'final', label: 'Final source choice and its limitation', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The talker’s lip height (1550 mm standing) and whole figure — the shared adult figure’s drawing defaults.', dims: ['yFloor'] },
    { text: 'The camera’s distance (2.5 m) and height, and the three shot sizes (close, medium, wide: where the frame’s edges cross the talker) — drawing defaults; no source gives a lens or a shot.', dims: [] },
    { text: 'The boom’s distance: no source gives one. The start is 15 cm above the frame’s top edge (the proposal’s drawing default) and 45° above the mouth’s axis (the lab’s); the zone runs 35–120 cm from the lips.', dims: [] },
    { text: 'The body mic’s distance from the mouth: no source gives one ("above the sternum" is sourced) — read from the drawing (about 21 cm).', dims: [] },
    { text: 'The pole’s reach (2.5 m) and thickness, the operator’s stance and grip, the counter, the keys, the jar and the planted mic’s place — drawing defaults.', dims: [] },
    { text: 'The power line’s height (5.2 m) and place (1.2 m behind the talker) — drawing defaults; its 3 m (10 ft) keep-out is sourced and drawn exact.', dims: [] },
    { text: 'The short shotgun is drawn as a supercardioid (a simplified picture: its tube narrows only the higher frequencies). The head turns about the head’s centre (a drawing default).', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. Every talker, place and shot is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: one talker in a typical standing pose, a camera with three example shot sizes, mic patterns and the two-mic comb as textbook shapes, the shotgun drawn as a supercardioid. Distances are rounded to about 5 mm below 1 m and more coarsely above it, with feet from 3 m and measured from the lips to the mic’s capsule. Safety is exact: at least 3 m (10 ft) from overhead power lines, and 30 minutes after the last lightning or thunder. Put a mic on a person only with their agreement, and never record anyone secretly.',
  copy: F09_COPY,
};
