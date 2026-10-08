/**
 * B03 FIELD REPORTERS AND HANDHELD INTERVIEWS — the lesson's pages as DATA
 * (blueprint §7). The words come from the owner's lesson (docs/labs/miking/
 * source_text/B03-Field-Reporters-and-Handheld-Interviews-Miking-
 * Technique.txt, cited "L<n>" in COMMENTS only) with the fixes logged in
 * docs/labs/miking/CORRECTIONS_LOG.md ("L7G3") applied: "you" for the learner
 * (B-INST: L2, L40 — the institutional words), no in-app link to another lesson (B-XLINK:
 * L85 — the ideas said in words), no brand on screen (L20, L21, L27: the
 * makers become types; a maker's "impervious to wind" becomes a monitored
 * test), and the safety lines exact and plain (L6: thunder → a substantial
 * building or a hard-topped vehicle, at least 30 minutes after the last
 * thunder; a windscreen does not make an outdoor interview safe; a stop/
 * relocate signal agreed before going live; L68 electronics out of the rain).
 *
 * The guest at the origin (frame V) with the reporter facing them, the
 * SET-UP as the variant (WHERE: STREET / TWO MICS / LIVE EVENT). OWNER RULING
 * 2026-10-04 — suggested starting points, never dogma; no source, brand or
 * model in learner text; no badges.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, clearReason, docReason, hearingDiag, polarityDelay, superNull, type Words } from '../shared/bowed/bowedItems.ts';
import { LOUD_VOICE, removeDelayVoice } from '../shared/broadcast/sportItems.ts';
import { hollowVoiceSymptom, personMeet, voiceRatingCheck } from '../shared/broadcast/voiceItems.ts';
import { B03_MODEL, FLOOR, PA_C } from './geometry.ts';
import { B03_ZONES } from './model.ts';
import { B03_COPY } from './copy.ts';

const W: Words = { noun: 'interview', player: 'guest', moving: 'the heads, the hands and the camera' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the interview and the place',
    goal: 'Get to know an interview on location — the guest and the reporter, where each voice leaves, the camera beside them, the street behind, the wind — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Two voices leave through two mouths; where one mic sits between them, the wind, the street and the camera decide what reaches it.',
  },
  sound: {
    title: 'Where the voices come from',
    goal: 'See where speech leaves each person, what one mic hears shared between them or moved to whoever speaks, why a directional mic needs to point at the speaking mouth, and what wind does at the capsule.',
    credit: { scenarios: ['b3.snd.1', 'b3.snd.2', 'b3.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'Every distance is read from the lips. A shared omni favours neither voice and hears the street all round; moved to the speaker, the voice comes up. A directional mic pointed between two people serves neither. Check wind at the capsule.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Know where the interview mic goes — the program, the recorder, the reporter’s earpiece, a local PA — and what to settle before any mic goes up: a safe spot, a stop signal, the weather, the guest’s agreement.',
    credit: { scenarios: ['b3.set.1', 'b3.set.2', 'b3.set.3', 'b3.set.4'], note: 'Answer the four checks.' },
    takeaway: 'A safe, permitted spot out of traffic; a stop signal agreed before going live; shelter at the first thunder; electronics out of the rain; the program checked at the program; the guest asked first.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose an interview mic by how it will be used — one rugged handheld moved between two people, or a mic each — and its pattern by the noise around it, without expecting a dynamic or an omni to pick out a voice.',
    credit: { scenarios: ['b3.mic.1', 'b3.mic.2', 'b3.mic.3', 'b3.mic.4', 'b3.rec.1'], note: 'Answer the five checks (one reaches back to the two voices).' },
    takeaway: 'An omni forgives aim and hears every side; a directional handheld favours the voice only when its front is on the mouth, close. A mic each avoids the handoff and adds channels to route. No pattern makes up for distance.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — the omni at chest height between the two in a quiet place, or close to the speaking mouth when it is loud — then move it and see what changes.',
    credit: { scenarios: ['b3.place.1', 'b3.place.2', 'b3.place.3', 'b3.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of both people, inside two different suggested starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A suggested zone is a place to begin, measured from the lips — not a rule. The shared place is an easy start; the louder the place, the closer the mic goes to whoever is speaking. Clearance from faces and the lens comes first.',
  },
  context: {
    title: 'Street or live event',
    goal: 'Aim a directional handheld so its rejection faces a local loudspeaker at a live event — and know why a quick street report and a controlled studio interview need different choices.',
    credit: { scenarios: ['b3.ctx.1', 'b3.ctx.2', 'b3.ctx.studio', 'b3.rec.3'], interactive: 'wedgeInNull', note: 'LIVE EVENT: aim the handheld (or change its pattern) until the loudspeaker sits in the rejection. STREET: answer the decision card. Then the three checks.' },
    takeaway: 'A pattern’s rejection is a tool to aim, not a promise; closeness does more. Know what goes to the program, the PA and the earpiece, and mute what you do not use.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why the reporter’s handheld and the guest’s lav, both open, comb in the mix — the other voice arriving later in each — and why the unused one is pulled down.',
    credit: { scenarios: ['b3.two.1', 'b3.two.2', 'b3.two.3', 'b3.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Each voice reaches both open mics at two times: some pitches cancel. Keep each mic close to its own mouth, pull down the one not in use, and check in mono — polarity never removes a delay.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the distance to the speaking mouth, the aim, the wind cover, the grip and the route first — then reach for gain or processing.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up an interview on location in the right order, choose and justify a setup for a windy street and for a live event, and say what would justify a second mic.',
    credit: { scenarios: ['b3.prac.order', 'b3.prac.gain', 'b3.prac.setup1', 'b3.prac.setup2', 'b3.prac.3', 'b3.mix.1', 'b3.mix.2', 'b3.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The placement card is optional — it needs a real interview.' },
    takeaway: 'A deliberate handoff, the omni-or-directional trade-off named, wind and handling controlled without promising silence, a safe spot written down and the live program checked. More than one setup can pass.',
  },
};
/** MEET IT in person words (review 2026-10-08, L7G2-18 / L7G3-17): the engine's goal calls the subject "it". */
pages.meet = personMeet(pages, 'the reporter and the guest');

/*
 * THE CHECKS. Lesson lines in comments only: b3.snd.* L12–L13, L20, L24 ·
 * b3.set.* L5–L6, L28–L29, L37 · b3.mic.* L12–L21 · b3.place.* L20, L24–L25 ·
 * b3.ctx.* L35–L36 · b3.two.* L18–L19 · b3.prac.* / b3.mix.* L25–L33, L44.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'b3.snd.1',
    page: 'sound',
    prompt: 'One omni sits at chest height midway between the reporter and the guest. Whose voice does it favour?',
    options: ['Neither: both are about as far away', 'The guest, because they answer for longer', 'The reporter, because they hold the mic'],
    correct: 'Neither: both are about as far away',
    explain: 'Midway, the two mouths are about the same distance away, so by distance neither voice is favoured — and an omni adds no preference of its own.',
    why: {
      'The guest, because they answer for longer': 'Talking longer does not move the mic; distance and pattern decide the balance.',
      'The reporter, because they hold the mic': 'Holding it does not bring it nearer their own mouth: midway is midway.',
    },
  },
  {
    id: 'b3.snd.2',
    page: 'sound',
    prompt: 'A cardioid handheld is pointed at the gap between two people talking in turn. What does it do?',
    options: ['Neither: both mouths are off its front', 'Catches both of them evenly and fully', 'Rejects the street noise behind them both'],
    correct: 'Neither: both mouths are off its front',
    explain: 'A directional mic hears best along its front. Aimed between two mouths, both arrive off the front — duller and lower. Turn it to whoever is speaking.',
    why: {
      'Catches both of them evenly and fully': 'Evenly, perhaps — but both off its front, so neither fully.',
      'Rejects the street noise behind them both': 'Its rejection is behind the mic, not behind the people.',
    },
  },
  {
    id: 'b3.snd.3',
    page: 'sound',
    prompt: 'A loud street is behind the pair. Why move the omni toward whoever is speaking?',
    options: ['The voice comes up against the street', 'The omni starts to hear only one side', 'The street gets farther from the mic'],
    correct: 'The voice comes up against the street',
    explain: 'Closer to the speaking mouth, the voice rises by distance while the distant street barely changes: more voice against the background. The omni still hears all round.',
    why: {
      'The omni starts to hear only one side': 'Its pattern does not change: an omni hears every side wherever it is.',
      'The street gets farther from the mic': 'A few centimetres hardly change the distance to the street; the mouth is what comes closer.',
    },
  },
  voiceRatingCheck('b3.set.1', 'the guest'),
  {
    id: 'b3.set.2',
    page: 'setting',
    prompt: 'Thunder is heard during an outdoor interview. What now?',
    options: ['Stop; get into a building or hard-topped car', 'Finish the answer first, then head indoors', 'Keep going, since the mic has a windscreen on'],
    correct: 'Stop; get into a building or hard-topped car',
    explain: 'Stop, and move everyone to a substantial building or a hard-topped vehicle; stay there at least 30 minutes after the last thunder. A windscreen does not make an outdoor interview safe in a storm.',
    why: {
      'Finish the answer first, then head indoors': 'Do not stay to finish: stop at once.',
      'Keep going, since the mic has a windscreen on': 'A windscreen is about wind, not safety: it does nothing about lightning.',
    },
  },
  {
    id: 'b3.set.3',
    page: 'setting',
    prompt: 'The quietest spot for the interview is on the edge of the road. What do you do?',
    options: ['Stay on the pavement; turn the pair instead', 'Use it, with the camera watching the traffic', 'A short interview there is fine'],
    correct: 'Stay on the pavement; turn the pair instead',
    explain: 'Nobody stands in a vehicle path for a quieter background. Turn the pair so the loudest source is less intrusive, move along the pavement, or bring the mic closer to the speaker.',
    why: {
      'Use it, with the camera watching the traffic': 'Watching traffic does not make a road a safe place to stand.',
      'A short interview there is fine': 'A short time in a vehicle path is still in a vehicle path.',
    },
  },
  {
    id: 'b3.set.4',
    page: 'setting',
    prompt: 'Before a live report from a busy place, what should the crew agree first?',
    options: ['A clear signal to stop or move', 'Which word starts the first answer', 'The order of the questions'],
    correct: 'A clear signal to stop or move',
    explain: 'Agree a clear stop or relocate signal before going on air: if the place becomes unsafe, everyone knows what it looks like.',
    why: {
      'Which word starts the first answer': 'The words can change; the safety signal must not.',
      'The order of the questions': 'Questions change on air as the story moves; the stop signal is the one thing to settle first.',
    },
  },
  {
    id: 'b3.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · The omni is moved from the shared place to the guest’s mouth. What changes most?',
    options: ['The guest’s voice comes up by distance', 'The omni turns into a directional mic', 'The street noise drops away completely'],
    correct: 'The guest’s voice comes up by distance',
    explain: 'Closer to the mouth, the voice rises; the pattern stays omni and the street stays where it is.',
    why: {
      'The omni turns into a directional mic': 'A pattern does not change with position.',
      'The street noise drops away completely': 'It drops only relative to the voice; it never disappears.',
    },
  },
  {
    id: 'b3.mic.1',
    page: 'microphone',
    prompt: 'The reporter’s mic is an omni dynamic. What helps it favour one voice in a crowd?',
    options: ['Being close to the speaking mouth', 'Its dynamic capsule, which rejects distant sound', 'Being held up high, above the crowd'],
    correct: 'Being close to the speaking mouth',
    explain: 'Dynamic is how it turns sound into a signal; omni is how it hears. An omni dynamic hears the crowd, the traffic and the PA from every side — closeness is what favours the voice.',
    why: {
      'Its dynamic capsule, which rejects distant sound': 'A dynamic capsule is not a pattern: an omni dynamic hears all round.',
      'Being held up high, above the crowd': 'Height changes the distances a little, not the pattern — and it takes the mic away from the mouth.',
    },
  },
  {
    id: 'b3.mic.2',
    page: 'microphone',
    prompt: 'A busy street, one handheld, and a reporter who can re-aim quickly. What can a cardioid offer?',
    options: ['More voice over side and rear noise', 'A voice that stays even as heads turn', 'Freedom from wind and handling noise'],
    correct: 'More voice over side and rear noise',
    explain: 'With its front on the speaking mouth, a cardioid hears less from the side and behind. A missed aim, a turned head or a changing distance costs more than with an omni.',
    why: {
      'A voice that stays even as heads turn': 'That is the omni’s strength; a cardioid changes more with aim.',
      'Freedom from wind and handling noise': 'Directional mics are often more sensitive to wind, pops and handling.',
    },
  },
  {
    id: 'b3.mic.3',
    page: 'microphone',
    prompt: 'How should the reporter hold a handheld with a flag?',
    options: ['Below the flag, fingers off the grille', 'By the flag, so it stays upright', 'Around the grille, to keep the wind out'],
    correct: 'Below the flag, fingers off the grille',
    explain: 'Hold the body below the grille without covering its ports, and do not grip or strike the flag: a covered grille changes the pattern and a knock on the flag is handling noise.',
    why: {
      'By the flag, so it stays upright': 'Gripping the flag passes every knock into the mic.',
      'Around the grille, to keep the wind out': 'A cupped grille changes the pattern and muffles the voice.',
    },
  },
  {
    id: 'b3.mic.4',
    page: 'microphone',
    prompt: 'When is a mic each — a handheld and a lav — a fair choice?',
    options: ['When there are channels, time and access', 'Whenever the guest happens to talk quietly', 'When the street is quiet and calm'],
    correct: 'When there are channels, time and access',
    explain: 'A mic each avoids the rushed handoff, but needs channels, a fit with the guest’s agreement, and routing — and two open mics spill into each other.',
    why: {
      'Whenever the guest happens to talk quietly': 'A quiet guest can be served by moving the handheld closer.',
      'When the street is quiet and calm': 'A quiet street is when one shared mic works best.',
    },
  },
  {
    id: 'b3.place.1',
    page: 'placement',
    prompt: 'Where can one omni start, as an idea, in a quiet place?',
    options: ['At chest height, midway between them', 'Right at the guest’s lips the whole time', 'Low by the belt, out of the camera’s shot'],
    correct: 'At chest height, midway between them',
    explain: 'After our research, about chest height between the two is a place to begin in a quiet or moderate place: it favours neither voice and needs no rushed aiming. Listen, and move toward the speaker when it is loud.',
    why: {
      'Right at the guest’s lips the whole time': 'Then the reporter’s questions are far away; and close to a face, ask first.',
      'Low by the belt, out of the camera’s shot': 'Far from both mouths: more street, less voice.',
    },
  },
  {
    id: 'b3.place.2',
    page: 'placement',
    prompt: 'When does the reporter move the mic to the guest?',
    options: ['Just before the answer begins', 'Once the guest has said a few words', 'Only when the camera turns to them'],
    correct: 'Just before the answer begins',
    explain: 'The mic arrives before the first words, then returns for the next question. Watch the mouth and listen to the words, not the camera.',
    why: {
      'Once the guest has said a few words': 'The first words are often the ones that matter.',
      'Only when the camera turns to them': 'The camera can lag the conversation: follow the speaker.',
    },
  },
  {
    id: 'b3.place.3',
    page: 'placement',
    prompt: 'The guest turns to an interpreter beside them. A fair step with a cardioid?',
    options: ['Re-aim at the mouth, keeping a safe distance', 'Leave it and turn the channel up a little', 'Ask the guest to face the mic, not the interpreter'],
    correct: 'Re-aim at the mouth, keeping a safe distance',
    explain: 'Follow the mouth: re-aim and adjust the reach without crowding the face — and with the guest’s agreement before coming close.',
    why: {
      'Leave it and turn the channel up a little': 'More gain raises the street with the voice.',
      'Ask the guest to face the mic, not the interpreter': 'Move the mic to the person, not the person to the mic.',
    },
  },
  {
    id: 'b3.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Where does the program hear the interview?',
    options: ['Through what is routed to the program', 'Through the camera operator’s headphones', 'The loudest mic in the place'],
    correct: 'Through what is routed to the program',
    explain: 'The program carries only what is routed into it: check the speech channel at the actual program, not only on a meter.',
    why: {
      'Through the camera operator’s headphones': 'Headphones are for monitoring; the program is a route.',
      'The loudest mic in the place': 'Loudness is not a route.',
    },
  },
  {
    id: 'b3.ctx.1',
    page: 'context',
    prompt: 'At a live event the handheld also feeds a local loudspeaker. A fair first step?',
    options: ['Close to the mouth, its rejection toward the PA', 'Farther from the mouth, so it covers both people', 'Turned up until it is louder than the PA'],
    correct: 'Close to the mouth, its rejection toward the PA',
    explain: 'Keep it close to the speaking mouth and aim the pattern’s rejection toward the loudspeaker. Bring it up only to its working level.',
    why: {
      'Farther from the mouth, so it covers both people': 'Farther away, it hears more PA and less voice: less margin.',
      'Turned up until it is louder than the PA': 'More gain brings feedback closer.',
    },
  },
  superNull('b3.ctx.2', 'context', 'loudspeaker'),
  {
    id: 'b3.ctx.studio',
    page: 'context',
    prompt: 'A controlled studio interview, two people seated, time to prepare. A fair first setup?',
    options: ['A lav or a boom each, on its own channel', 'One omni shared at chest height between them', 'A camera-top mic for the whole room'],
    correct: 'A lav or a boom each, on its own channel',
    explain: 'With time and access, separate seated lavs or a boom give each person a channel and remove the handoff. A field report often has neither — then a rugged handheld earns its place.',
    why: {
      'One omni shared at chest height between them': 'It works, but a studio offers better control: a channel each.',
      'A camera-top mic for the whole room': 'Far from both voices: more room, less voice.',
    },
  },
  {
    id: 'b3.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · A strong wind picks up at the interview. What is the first fix?',
    options: ['A fitted foam or fur, then shelter', 'A high-pass filter turned right up', 'Turning the input gain up higher'],
    correct: 'A fitted foam or fur, then shelter',
    explain: 'Protect the capsule first: a fitted foam for light air, a fitted fur for stronger wind, then turn the pair or move to a sheltered, permitted spot. A filter cannot undo an overloaded capsule.',
    why: {
      'A high-pass filter turned right up': 'A filter thins the voice and cannot reverse overload.',
      'Turning the input gain up higher': 'More gain makes the wind rumble louder and overload sooner.',
    },
  },
  {
    id: 'b3.two.1',
    page: 'twoMic',
    prompt: 'The reporter’s handheld and the guest’s lav are both open. Why does the guest sound hollow?',
    options: ['It reaches the handheld later, too', 'The lav reverses the guest’s polarity', 'The handheld is louder, so it cancels'],
    correct: 'It reaches the handheld later, too',
    explain: 'The lav is close; the reporter’s handheld is farther. One voice, two arrival times: summed, some pitches cancel.',
    why: {
      'The lav reverses the guest’s polarity': 'Distance delays a sound; it does not flip its sign.',
      'The handheld is louder, so it cancels': 'Level changes the notches’ depth; the delay makes them.',
    },
  },
  polarityDelay('b3.two.2'),
  {
    id: 'b3.two.3',
    page: 'twoMic',
    prompt: 'What is the fair plan for a mic each in a live report?',
    options: ['Pull down the mic of whoever is not speaking', 'Both open the whole time, at the same level', 'One polarity flipped, both left open'],
    correct: 'Pull down the mic of whoever is not speaking',
    explain: 'Keep each mic close to its own mouth and lower the unused one; name which channel carries which voice.',
    why: {
      'Both open the whole time, at the same level': 'Both open, each voice arrives twice: hollow, and more street.',
      'One polarity flipped, both left open': 'Polarity cannot remove the delay between them.',
    },
  },
  {
    id: 'b3.two.4',
    page: 'twoMic',
    prompt: 'The guest interrupts and both talk at once. What decides which channel leads?',
    options: ['Which voice matters for the program', 'Whichever mic is physically the closer one', 'The channel that was opened first'],
    correct: 'Which voice matters for the program',
    explain: 'Decide which voice the live program needs; if overlap is regular in the format, keep a separate feed for each voice.',
    why: {
      'Whichever mic is physically the closer one': 'Closeness serves the mic’s own talker, not the program’s choice.',
      'The channel that was opened first': 'Order of opening says nothing about what the listener needs.',
    },
  },
  {
    id: 'b3.prac.gain',
    page: 'practice',
    prompt: 'The guest suddenly shouts and the recorder clips. What should have been done first?',
    options: ['Gain set on the loudest likely speech', 'A compressor added afterwards to fix it', 'The automatic level switched on'],
    correct: 'Gain set on the loudest likely speech',
    explain: 'Set gain with the loudest likely speech or reaction, leaving headroom at the transmitter, the receiver, the preamp and the recorder. A later compressor or an automatic level cannot repair an overloaded input.',
    why: {
      'A compressor added afterwards to fix it': 'A compressor after the input cannot undo the clipping.',
      'The automatic level switched on': 'An automatic level does not rescue an overloaded input.',
    },
  },
  {
    id: 'b3.prac.3',
    page: 'practice',
    prompt: 'What would justify a second mic at a field interview?',
    options: ['Regular overlap, or a tested fallback', 'A fuller sound from two open mics', 'More level for a quiet, softly spoken guest'],
    correct: 'Regular overlap, or a tested fallback',
    explain: 'A second mic earns its place for a format with regular overlap (a feed each) or as a tested, separately routed fallback — not as a second open capsule on one voice.',
    why: {
      'A fuller sound from two open mics': 'Two open mics on one voice comb.',
      'More level for a quiet, softly spoken guest': 'Level comes from distance and gain: move the handheld closer.',
    },
  },
  {
    id: 'b3.mix.1',
    page: 'practice',
    prompt: 'A wireless handheld drops out as the crowd moves past. What should have been checked?',
    options: ['The radio range through the actual place', 'The receiver’s output level at the mixer', 'A fresh battery in the mic, and nothing else'],
    correct: 'The radio range through the actual place',
    explain: 'Check the radio coordination, the battery and the usable range in the actual place with the responsible technician. A clean meter at setup is not proof through a moving crowd.',
    why: {
      'The receiver’s output level at the mixer': 'The output level matters once a signal arrives; a dropout is the radio path failing before that.',
      'A fresh battery in the mic, and nothing else': 'A battery helps; the range and the coordination still need checking.',
    },
  },
  {
    id: 'b3.mix.2',
    page: 'practice',
    prompt: 'The street’s rumble and some wind are in every answer. A fair plan?',
    options: ['Protect the mic first, then filter gently', 'A strong high-pass filter, which removes both', 'Leave it: a filter later rescues the take'],
    correct: 'Protect the mic first, then filter gently',
    explain: 'A high-pass filter can reduce low rumble and also thin the voice; it cannot reverse capsule or input overload. Wind protection, closeness and the spot come first.',
    why: {
      'A strong high-pass filter, which removes both': 'It reduces some rumble and thins the voice; turbulence at the capsule remains.',
      'Leave it: a filter later rescues the take': 'An overloaded take cannot be undone afterwards.',
    },
  },
  removeDelayVoice('b3.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'b3.sym.street',
    observation: 'The voices sink into the traffic',
    firstChecks: 'Where is the mic — shared or at the speaker? Which way does the pair face? A wind cover?',
    options: ['Move the mic to the speaker; turn the pair', 'Turn the channel up until the voices lead', 'Point the mic at the traffic to measure it'],
    correct: 'Move the mic to the speaker; turn the pair',
    explain: 'In a loud place, bring the mic to whoever is speaking just before they start, turn the pair so the traffic is less intrusive, or move along the pavement.',
    why: {
      'Turn the channel up until the voices lead': 'Gain raises the traffic with the voices.',
      'Point the mic at the traffic to measure it': 'That favours the traffic, not the voices.',
    },
  },
  {
    id: 'b3.sym.firstWords',
    observation: 'The first words of each answer sound distant',
    firstChecks: 'When does the mic move — before or after the answer starts?',
    options: ['Move it just before the answer begins', 'Raise the gain at the start of each answer', 'Ask the guest to repeat the first words'],
    correct: 'Move it just before the answer begins',
    explain: 'Rehearse the handoff: question, move, a short pause, answer. Watch the mouth, not the camera.',
    why: {
      'Raise the gain at the start of each answer': 'Gain cannot bring a mic closer; it raises the street too.',
      'Ask the guest to repeat the first words': 'Fix the move, not the guest.',
    },
  },
  {
    id: 'b3.sym.wind',
    observation: 'Thumps and rumble whenever the wind gusts',
    firstChecks: 'What is on the capsule? Is it fitted? Can the pair turn or move to shelter?',
    options: ['A fitted foam or fur; then turn or shelter', 'A strong high-pass filter, and carry on', 'Hold the mic farther away from the guest’s mouth'],
    correct: 'A fitted foam or fur; then turn or shelter',
    explain: 'Check the wind at the capsule: a fitted foam for light air, a fitted fur for stronger wind, then turn the bodies or move to a sheltered, permitted spot. If it keeps overloading, pause and relocate.',
    why: {
      'A strong high-pass filter, and carry on': 'A filter thins the voice and cannot undo overload.',
      'Hold the mic farther away from the guest’s mouth': 'Farther adds street and still leaves the wind on the capsule.',
    },
  },
  {
    id: 'b3.sym.handling',
    observation: 'Knocks and rustles in the quiet moments',
    firstChecks: 'Is the grip steady, below the flag? Is the cable tapping the handle?',
    options: ['A steady grip; secure the loose cable', 'A different brand of handheld mic', 'Hold the mic by the grille instead'],
    correct: 'A steady grip; secure the loose cable',
    explain: 'Even internally isolated mics pick up finger movement, bumps and cable taps. Hold steady below the flag and stop the cable from tapping.',
    why: {
      'A different brand of handheld mic': 'Handling noise is about the grip and the cable first.',
      'Hold the mic by the grille instead': 'A covered grille changes the pattern and the tone.',
    },
  },
  {
    id: 'b3.sym.feedback',
    observation: 'The local PA rings when the handheld is up',
    firstChecks: 'Lower the level at once. Where is the PA against the pattern? How close is the mic to the mouth?',
    options: ['Lower it, then close and re-aim the mic', 'Turn the handheld up over the ring', 'Swap to an omni held farther away'],
    correct: 'Lower it, then close and re-aim the mic',
    explain: 'Feedback is a sound-system condition: lower the send, then bring the mic close to the mouth with its rejection toward the loudspeaker. Never provoke feedback on purpose.',
    why: {
      'Turn the handheld up over the ring': 'More gain feeds the loop.',
      'Swap to an omni held farther away': 'An omni held far hears the PA from every side: feedback sooner.',
    },
  },
  hollowVoiceSymptom('b3.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'b3.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a live field interview in the order you would do them.',
    steps: [
      { text: 'Get permission; pick a safe spot out of traffic', early: 'Start with where it is safe and permitted to stand.' },
      { text: 'Agree the shot, the route and a stop signal', early: 'Agree the plan once the spot is chosen.' },
      { text: 'Choose the mic and fit its wind cover', early: 'Choose the mic once the plan is known.' },
      { text: 'Set gain on the loudest likely speech', early: 'Set gain once the mic is chosen.' },
      { text: 'Rehearse the handoff with the guest', early: 'Rehearse once the gain is set.' },
      { text: 'Check the program and the fallback', early: 'Check the destination last, before going live.' },
    ],
    explain: 'A sensible order. If thunder is heard at any point, stop and shelter — the interview waits at least 30 minutes after the last thunder.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'b3.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A recorded interview on a windy city street, one camera, the guest standing, ten minutes to set up.',
    setups: [
      { id: 'a', label: 'The omni with a fitted fur, moved to whoever speaks', ok: true, power: 'none', feedback: 'A suggested start: close to each speaker, the wind covered — rehearse the handoff.' },
      { id: 'b', label: 'A cardioid handheld with a foam, re-aimed each turn', ok: true, power: 'none', feedback: 'A start that can pass if the reporter aims well — check wind and pops at that distance.' },
      { id: 'c', label: 'The camera’s own mic, from the tripod', ok: false, power: 'none', feedback: 'Far from both voices on a windy street: the street wins.' },
      { id: 'd', label: 'The omni shared, the bare grille only', ok: false, power: 'none', feedback: 'On a windy street a bare grille rumbles and the shared place hears the street.' },
      { id: 'e', label: 'A cardioid pointed between the two', ok: false, power: 'none', feedback: 'Pointed between them, it serves neither voice.' },
    ],
    reasons: [docReason('the lips'), clearReason('the faces, the lens and the road'), { id: 'r.wind', label: 'The wind cover fits the wind at the capsule', role: 'required', feedback: 'Say how the capsule is protected.' }, { id: 'r.immune', label: 'A dynamic mic does not pick up wind', role: 'wrong', feedback: 'No mic is immune: test it, monitored.' }, BRAND_REASON('field interview'), LOUD_VOICE],
    explain: 'More than one setup passes. What passes is the reasoning: close to the speaking mouth, measured from the lips, the wind covered and tested, and everyone out of the road.',
  },
  {
    id: 'b3.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A live interview at an outdoor event, a local PA on a pole nearby, the program on air.',
    setups: [
      { id: 'a', label: 'A cardioid handheld close, its rejection toward the PA', ok: true, power: 'none', feedback: 'A suggested start: close and aimed — bring it up only to its working level.' },
      { id: 'b', label: 'The omni close to whoever speaks, kept out of the PA', ok: true, power: 'none', feedback: 'A fair start for the broadcast if the PA does not need it — check the routing.' },
      { id: 'c', label: 'The omni shared, fed loud into the PA', ok: false, power: 'none', feedback: 'Far from each mouth and loud in the PA: feedback comes first.' },
      { id: 'd', label: 'The return on a speaker beside the pair', ok: false, power: 'none', feedback: 'The open mic hears it again: use an earpiece.' },
      { id: 'e', label: 'The producer’s cues sent on air', ok: false, power: 'none', feedback: 'Cues are for the reporter, kept off the air.' },
    ],
    reasons: [docReason('the lips'), clearReason('the faces, the lens and the crowd’s path'), { id: 'r.route', label: 'The program, the PA and the earpiece each carry what they should', role: 'required', feedback: 'Say what goes where — and what is muted.' }, { id: 'r.signal', label: 'A stop signal is agreed before going live', role: 'optional', feedback: 'A fair reason: safety first.' }, BRAND_REASON('field interview'), LOUD_VOICE],
    explain: 'Two setups pass. What passes is the reasoning: close to the speaking mouth, the routes chosen on purpose, the PA toward the rejection, and a stop signal agreed.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: one omni sits midway between two people. Whose voice will it favour?', options: ['The guest’s', 'The reporter’s', 'Neither'], after: 'Now STEP through (or PLAY ONCE), then slide the mic between them.' },
  microphone: { prompt: 'Before you move anything: does a dynamic mic pick out one voice from a crowd?', options: ['Yes', 'No', 'Only when held close'], after: 'Now choose each TYPE and see where it starts.' },
  placement: { prompt: 'Predict: the omni moves from the shared place to 20 cm from the guest. What changes?', options: ['More of the guest, less of the street', 'More of the street', 'It depends on this street'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The loudspeaker is beyond the reporter. Where will a cardioid held at the guest’s mouth reject it best?', options: ['Straight behind the mic', 'In front of the mic', 'At the mic’s sides'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip the lav’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'sound',
    prompt: 'A cardioid handheld is pointed between two talkers. What happens?',
    options: ['Neither voice is on its front', 'Both are caught fully and evenly', 'The street behind them is rejected'],
    correct: 'Neither voice is on its front',
    explain: 'A directional mic hears best along its front, so it is turned to the speaking mouth; between two mouths it serves neither.',
    why: {
      'Both are caught fully and evenly': 'Evenly, perhaps — but both off its front.',
      'The street behind them is rejected': 'The rejection is behind the mic, not the people.',
    },
  },
  {
    id: 'q.2',
    covers: 'sound',
    prompt: 'An omni dynamic in a crowd. How does it hear the people around it?',
    options: ['From every side alike', 'Less from far away, as a dynamic', 'Mostly from above, once it is held high'],
    correct: 'From every side alike',
    explain: 'Omni is how it hears; dynamic is how it makes a signal. Closeness to the speaking mouth favours the voice, not the capsule type.',
    why: {
      'Less from far away, as a dynamic': 'Dynamic is the transducer, not the pattern.',
      'Mostly from above, once it is held high': 'Height does not change the pattern.',
    },
  },
  {
    id: 'q.3',
    covers: 'setting',
    critical: true,
    prompt: 'Thunder is heard during an outdoor interview. What do you do?',
    options: ['Stop; get into a building or hard-topped car', 'Finish the answer first, then go indoors', 'Carry on, since the mic has its windscreen on'],
    correct: 'Stop; get into a building or hard-topped car',
    explain: 'Stop and shelter in a substantial building or a hard-topped vehicle; stay at least 30 minutes after the last thunder. A windscreen does not make an outdoor interview safe.',
    why: {
      'Finish the answer first, then go indoors': 'Do not stay to finish: stop at once.',
      'Carry on, since the mic has its windscreen on': 'A windscreen does nothing about lightning.',
    },
  },
  {
    id: 'q.4',
    covers: 'setting',
    critical: true,
    prompt: 'The quietest spot is at the edge of the road. What do you do?',
    options: ['Stay off the road; turn the pair', 'Use it while the traffic is light', 'Fine with a spotter watching the cars'],
    correct: 'Stay off the road; turn the pair',
    explain: 'Never put people in a vehicle path for a quieter background: turn the pair or move along the pavement.',
    why: {
      'Use it while the traffic is light': 'Light traffic is still traffic.',
      'Fine with a spotter watching the cars': 'A spotter does not make a road a safe place to stand.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'Where do the producer’s cues and the program return go?',
    options: ['The reporter’s earpiece only', 'A speaker beside the interview', 'Into the program, for viewers'],
    correct: 'The reporter’s earpiece only',
    explain: 'A loudspeaker loops into the open mic; cues on air are a routing fault.',
    why: {
      'A speaker beside the interview': 'The open mic picks it up again, delayed.',
      'Into the program, for viewers': 'Cues are kept off the air.',
    },
  },
  hearingDiag('q.6', W),
];

const wedges: Wedge[] = [
  {
    id: 'pa',
    label: 'the local loudspeaker beyond the reporter',
    short: 'PA',
    p: { x: PA_C.x, y: FLOOR, z: PA_C.z },
    lift: FLOOR - PA_C.y,
    faces: { x: 1, y: 0, z: 0 },
    note: 'On a pole beyond the reporter, facing the crowd: its back and side reach the handheld from in front of the guest and above.',
    prov: { kind: 'illustrative', reason: 'a typical outdoor event: the loudspeaker’s place and height are drawing defaults' },
    glyph: 'none',
  },
];

export const B03_LESSON: Lesson = {
  id: 'B03',
  labId: 'broadcast',
  title: 'Field Reporters and Handheld Interviews',
  subtitle: 'One handheld at chest height between two people, moved to whoever speaks when it is loud — the wind covered, everyone out of the traffic',
  noun: { one: 'interview', many: 'interviews', subject: 'guest', person: true },
  model: B03_MODEL,
  micTypeIds: ['repOmni', 'bcFlagCard', 'bcFlagSuper', 'locLav'],
  zones: B03_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'An interview on location: a reporter and the person they question, one handheld mic between them — on a street, at an event, wherever the story is. Wind, traffic, a camera and little time to set up.', src: 'LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'News reports and quick interviews: a rugged handheld with a flag, a foam or a fur on it, the reporter moving it between two mouths — or, with more time, a mic each.', src: 'LESSON' },
    { title: 'THE JOB', text: 'Both voices intelligible on the program, the speaking turns clear, the wind and the handling under control — and everyone safe, out of traffic and weather.', src: 'LESSON' },
    { title: 'NO SINGLE RIGHT PLACE', text: 'A shared place between the two works in a quiet spot; a loud street calls for the mic at whoever is speaking. Begin there, listen, and adjust. Experimentation is encouraged.', src: 'LESSON' },
  ],
  sound: {
    stages: [
      { title: 'Breath from the lungs', text: 'The lungs push air up the windpipe — the power behind every word.' },
      { title: 'The vocal folds buzz', text: 'In the voice box, low in the throat, two small folds come together and the breath sets them buzzing. That buzz is the raw sound of the voice.' },
      { title: 'The throat and mouth shape it', text: 'The throat, the tongue, the lips and the open mouth shape the buzz into vowels and words; the tongue, the teeth and the lips add the consonants.' },
      { title: 'It leaves the mouth', text: 'Almost all of it leaves through the open mouth — on m, n and ng partly through the nose. That is where every distance here is measured from: the speaking person’s lips.' },
    ],
    attack: 'P and B push a puff of air straight out of the lips; wind adds its own push across the grille. A handheld a little below the mouth, still aimed at it, keeps the capsule out of the worst of the breath.',
    body: 'The vowels carry most of the level and the tone. Close to a directional mic they gain low end (the proximity effect); farther, more of the street, the wind and the other voice join in. Tendencies, to check by ear.',
    head: { diameterMm: 0, rods: 0, label: 'the mouth', strikeSrc: 'LESSON' },
  },
  setting: {
    items: [
      { id: 'guest', label: 'the guest', short: 'GUEST', note: 'Standing, facing the reporter; turns to the camera, leans back, turns to an interpreter. Every distance is read from their lips.', prov: { kind: 'illustrative', reason: 'the shared figure standing (drawing default)' }, tag: 'THE SOURCE', scene: 'all' },
      { id: 'reporter', label: 'the reporter', short: 'REPORTER', note: 'Facing the guest, holding the mic and moving it to whoever speaks — the arm relaxed, the flag and grille clear of faces and the lens.', prov: { kind: 'illustrative', reason: 'the lesson L24–L25; the place a drawing default' }, tag: 'THE OTHER VOICE', scene: 'all' },
      { id: 'street', label: 'the traffic', short: 'TRAFFIC', note: 'The loudest thing on a street, from every side for an omni. Turn the pair, bring the mic to the speaker — and keep everyone off the road.', prov: { kind: 'illustrative', reason: 'the lesson L5–L6' }, tag: 'NOISE', scene: 'all' },
      { id: 'wind', label: 'the wind', short: 'WIND', note: 'Check it at the capsule, not the forecast: a fitted foam for light air, a fitted fur for stronger wind, shelter when even that buffets.', prov: { kind: 'illustrative', reason: 'the lesson L27–L29' }, tag: 'WIND', scene: 'all' },
      { id: 'camera', label: 'the camera', short: 'CAMERA', note: 'A visible handheld makes the speaking turns clear on screen: coordinate its flag, reach and side with the operator, out of the lens’s way.', prov: { kind: 'illustrative', reason: 'the lesson L32' }, tag: 'FRAME', scene: 'all' },
      { id: 'pa', label: 'a local loudspeaker', short: 'PA', note: 'At a live event, every open mic hears it: what goes to it, and where a directional mic’s rejection points, decide how close it gets to feedback.', prov: { kind: 'illustrative', reason: 'the lesson L35' }, tag: 'FEEDBACK', scene: 'stage' },
    ],
    stage: 'LIVE EVENT: the handheld close to the speaking mouth, its rejection toward the loudspeaker, brought up only to its working level; the return and the cues in the earpiece only.',
    studio: 'STREET: one omni shared at chest height in a quiet spot, moved to whoever speaks when it is loud, a fitted foam or fur on — or a mic each when there is time.',
  },
  diagnostic,
  practice: {
    task: 'Choose a setup for a windy street and for a live event, describe an alternative, and explain what would justify a second mic. In a permitted, safe place, with the guest’s agreement, you can record what you tried below.',
    fields: [
      { id: 'place', label: 'Location, permission and the camera’s position', kind: 'text' },
      { id: 'mic', label: 'Mic and pattern', kind: 'choice', choices: ['omni, shared', 'omni, handoff', 'cardioid, handoff', 'a mic each', 'other'] },
      { id: 'wind', label: 'Wind cover, weather and the noise around', kind: 'text' },
      { id: 'gain', label: 'Gain and headroom, the radio or cable check', kind: 'text' },
      { id: 'routes', label: 'Program, PA, earpiece and talkback routes', kind: 'text' },
      { id: 'notes', label: 'Method chosen and one remaining limitation', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The standing guest and reporter: the lips 1550 mm above the ground, 75 cm apart mouth to mouth, face to face (the research’s 60–90° in plan is said in words) — drawing defaults; the heads are the voice family’s.', dims: ['yFloor'] },
    { text: 'The shared place: chest height 28 cm below the mouths, midway — a drawing default (“around chest height between”, no number). The handoff band 15–30 cm and the close end 10 cm below the breath are the lab’s drawing.', dims: [] },
    { text: 'The reporter’s handheld (23 cm, a flag) and the arm holding it (upper arm 30 cm, forearm 29 cm) are drawing defaults; the camera beside the reporter, the kerb, the loudspeaker and the loud source’s 2 m are drawing defaults.', dims: [] },
    { text: 'The levels on the one-mic tool are by distance and an ideal first-order pattern only (a simplified picture); the wind marks are illustrative, never a level.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. Every voice, street and wind is different: move the mic, experiment, and trust your ears and the place. The lab is silent and draws a simplified picture: two people standing face to face, mic patterns as textbook shapes, levels by distance alone, wind as marks rather than levels. Distances are rounded to about 5 mm below 1 m and more coarsely above it, with feet from 3 m and measured from the lips to the mic’s front. Safety is exact: off the road, a stop signal agreed, shelter at the first thunder and wait at least 30 minutes after the last.',
  copy: B03_COPY,
};
