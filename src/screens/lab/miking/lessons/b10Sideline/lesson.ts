/**
 * B10 SIDELINE AND POST-EVENT INTERVIEWS — the lesson's pages as DATA
 * (blueprint §7). The words come from the owner's lesson (docs/labs/miking/
 * source_text/B10-Sideline-and-Post-Event-Interviews-Miking-Technique.txt,
 * cited "L<n>" in COMMENTS only) with the fixes logged in docs/labs/miking/
 * CORRECTIONS_LOG.md ("L7B-G1") applied — the press releases behind refs
 * [5]/[6] kept internal (B10-01/02), no brand named, "you" for the learner
 * (R-07), and the safety lines exact and plain: never into play or a
 * medical, official, athlete or security route; approval before anything
 * goes on a person; lightning from the one sports safety card.
 *
 * The guest at the origin (frame V) with the reporter beside them, the SET-UP
 * as the variant (WHERE: SIDELINE / TWO HANDHELDS / POST-EVENT). OWNER RULING
 * 2026-10-04 — suggested starting points, never dogma; no source, brand or
 * model in learner text; no badges.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, LOUD_REASON, clearReason, docReason, hearingCheck, hollowSymptom, polarityDelay, removeDelay, superNull, type Words } from '../shared/bowed/bowedItems.ts';
import { B10_MODEL, FLOOR, PA_C } from './geometry.ts';
import { B10_ZONES } from './model.ts';
import { B10_COPY } from './copy.ts';

const W: Words = { noun: 'interview', player: 'guest', moving: 'the heads, the hands and the camera' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the interview and the place',
    goal: 'Get to know a sports interview — the guest and the reporter, where each voice leaves, the camera, the play area behind the touchline, the exit route, the crowd and the PA — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Two voices leave through two mouths; the handoff, the camera, the crowd, the wind and the approved area decide where a mic can be.',
  },
  sound: {
    title: 'Where the voices come from',
    goal: 'See where speech leaves each person, why one handheld must reach the speaking mouth before the answer starts, and what every open mic hears.',
    credit: { scenarios: ['b10.snd.1', 'b10.snd.2', 'b10.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'Every distance is read from the lips. A mic left between two people hears both of them far away; moved before the answer, it catches the first words. Each open mic hears the other voice too — later and lower.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Know where each interview mic goes — the program, the recorder, the reporter’s earpiece — and what to settle before any mic goes up: the approved area, the exit, approval for a body mic, the weather.',
    credit: { scenarios: ['b10.set.1', 'b10.set.2', 'b10.set.3', 'b10.set.4'], note: 'Answer the four checks.' },
    takeaway: 'Plan the position before the handoff, keep every route clear, ask before anything goes on a person, check the real destination, and give the guest no uncontrolled return.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose an interview mic by how it will be used — a handheld moved between two people, a headset for a regular reporter, a body mic or a boom when there is time — and its pattern by the noise around it.',
    credit: { scenarios: ['b10.mic.1', 'b10.mic.2', 'b10.mic.3', 'b10.mic.4', 'b10.rec.1'], note: 'Answer the five checks (one reaches back to the handoff).' },
    takeaway: 'A controllable handheld for a sudden sideline exchange; an omni forgives aim, a directional pattern needs it; a headset holds the reporter’s distance but not the guest’s; no pattern makes up for distance.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — the handheld under about 15 cm from the speaking mouth, a little below the breath — then move it and see what changes.',
    credit: { scenarios: ['b10.place.1', 'b10.place.2', 'b10.place.3', 'b10.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of both people, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin, measured from the lips — not a rule. Close to the speaking mouth, out of the breath, clear of faces and the lens; the approved area and the exit come first.',
  },
  context: {
    title: 'Sideline or post-event',
    goal: 'Aim an interview handheld so its rejection faces the PA at the sideline — and know why a sudden sideline exchange and a scheduled post-event mark need different choices.',
    credit: { scenarios: ['b10.ctx.1', 'b10.ctx.2', 'b10.ctx.studio', 'b10.rec.3'], interactive: 'wedgeInNull', note: 'SIDELINE: aim the handheld (or change its pattern) until the PA sits in the rejection. POST-EVENT: answer the decision card. Then the three checks.' },
    takeaway: 'At the sideline a controllable handheld close to the speaking mouth, its rejection toward the PA where the mouth allows; at a post-event mark, time for an approved body mic or a boom outside the frame.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why two open interview mics can make a voice sound hollow, how the arrival-time difference places comb notches, and why each mic stays on its own channel.',
    credit: { scenarios: ['b10.two.1', 'b10.two.2', 'b10.two.3', 'b10.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Each voice reaches the other mic later and lower: the sum cancels some pitches. A mic each close to its own mouth, the unused one down, each on its own channel — and never a body mic and a handheld open on one person by accident.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — where the mic is when the answer starts, the wind, the hand, the open mics, the radio path — before reaching for EQ or more gain.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up an interview in the right order, choose and justify a setup for a sudden sideline exchange and a scheduled post-event guest, and say what would justify a second mic.',
    credit: { scenarios: ['b10.prac.order', 'b10.prac.gain', 'b10.prac.setup1', 'b10.prac.setup2', 'b10.prac.3', 'b10.mix.1', 'b10.mix.2', 'b10.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The interview sheet is optional — it needs a real interview.' },
    takeaway: 'A mic at the speaking mouth before the answer, a channel per voice, the real destination checked, a fallback ready — inside the approved area with the exit clear. A brand, a long shotgun from far away or a hotter signal do not pass.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only: b10.snd.* L12, L13, L27, L34 ·
 * b10.set.* L5, L6, L34 · b10.mic.* L12, L21, L28, L32 · b10.place.* L27,
 * L29, L34 · b10.ctx.* L5, L28, L31 · b10.two.* L15, L34 · b10.prac.* /
 * b10.mix.* L28, L32, L35–L43.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'b10.snd.1',
    page: 'sound',
    prompt: 'After the question the reporter leaves the mic halfway between the two mouths. What happens to the answer?',
    options: ['The guest sounds distant; the crowd rises with gain', 'Both voices are caught equally and clearly', 'The mic picks the louder voice and ignores the other'],
    correct: 'The guest sounds distant; the crowd rises with gain',
    explain: 'Halfway, the mic is far from both mouths: the guest arrives several dB lower than at their mouth, and raising the gain raises the crowd with them.',
    why: {
      'Both voices are caught equally and clearly': 'Equally, perhaps — but both distant, with the crowd close behind.',
      'The mic picks the louder voice and ignores the other': 'A mic does not choose: it hears whatever reaches it, by distance and pattern.',
    },
  },
  {
    id: 'b10.snd.2',
    page: 'sound',
    prompt: 'When should the handheld reach the guest’s mouth?',
    options: ['Before the answer starts: move, then pause', 'Once the guest has said the first few words', 'At the end of the answer, ready to hand back'],
    correct: 'Before the answer starts: move, then pause',
    explain: 'Finish the question, move the mic, pause — the answer’s first words land at the guest’s mouth. The first words of an answer are often the ones that matter.',
    why: {
      'Once the guest has said the first few words': 'Those first words are then heard from the reporter’s side, distant.',
      'At the end of the answer, ready to hand back': 'The whole answer would be distant. The mic goes to the guest before they speak.',
    },
  },
  {
    id: 'b10.snd.3',
    page: 'sound',
    prompt: 'The reporter’s headset and the guest’s handheld are both open. The guest answers. Where is the guest’s voice?',
    options: ['In both mics, the headset’s copy later and lower', 'Only in the handheld, since that one is aimed at them', 'Only in the headset, since it is nearer the ear'],
    correct: 'In both mics, the headset’s copy later and lower',
    explain: 'Each voice reaches every open mic — its own first, the other later and lower. Keep the mic not in use down.',
    why: {
      'Only in the handheld, since that one is aimed at them': 'Aim reduces some directions; the guest still reaches the reporter’s open mic.',
      'Only in the headset, since it is nearer the ear': 'The headset is near the reporter’s mouth, not the guest’s.',
    },
  },
  hearingCheck('b10.set.1', W),
  {
    id: 'b10.set.2',
    page: 'setting',
    prompt: 'A body mic would sound better on the guest. What comes first?',
    options: ['The guest’s and the event’s approval', 'Clipping it on quickly before the shot', 'Asking the camera operator whether it shows'],
    correct: 'The guest’s and the event’s approval',
    explain: 'Use the event’s approval process before attaching anything to a person or a uniform — and nothing on regulated gear.',
    why: {
      'Clipping it on quickly before the shot': 'Nothing goes on a person without their and the event’s approval.',
      'Asking the camera operator whether it shows': 'How it looks matters later; approval comes first.',
    },
  },
  {
    id: 'b10.set.3',
    page: 'setting',
    prompt: 'A better angle would mean standing in a medical route for a minute. What do you do?',
    options: ['Keep the route clear and work from where you are', 'Stand there briefly, just while the play is stopped', 'Ask the guest to step into the route with you'],
    correct: 'Keep the route clear and work from where you are',
    explain: 'Never step into play or block a medical, official, athlete or security route to improve sound. Work inside the approved area.',
    why: {
      'Stand there briefly, just while the play is stopped': 'A stoppage does not open a route to the crew.',
      'Ask the guest to step into the route with you': 'Moving the guest into a route blocks it just the same.',
    },
  },
  {
    id: 'b10.set.4',
    page: 'setting',
    prompt: 'The guest hears the program played back on a small loudspeaker beside them. What is wrong?',
    options: ['The open mics pick it up again, delayed', 'Nothing: the guest can follow the show', 'The program is too quiet for the guest to hear'],
    correct: 'The open mics pick it up again, delayed',
    explain: 'A loudspeaker near an open mic sends the program back into it — and the guest hears an uncontrolled delayed return. Cues and returns go to the reporter’s earpiece.',
    why: {
      'Nothing: the guest can follow the show': 'The program would loop into the open mics, delayed.',
      'The program is too quiet for the guest to hear': 'Turning it up makes the loop worse.',
    },
  },
  {
    id: 'b10.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · The answer begins before the mic arrives. What is lost?',
    options: ['The first words, heard from too far away', 'The last words, cut off by the next question', 'Nothing: the gain makes up the difference'],
    correct: 'The first words, heard from too far away',
    explain: 'Until the mic reaches the mouth the answer is distant. Move first, pause, then the answer.',
    why: {
      'The last words, cut off by the next question': 'The late move costs the beginning of the answer, not the end.',
      'Nothing: the gain makes up the difference': 'Gain raises the crowd with the distant words.',
    },
  },
  {
    id: 'b10.mic.1',
    page: 'microphone',
    prompt: 'The reporter cannot always aim precisely as the guest turns. Which handheld is more forgiving?',
    options: ['An omni: small aiming errors matter less', 'A supercardioid: it hears only the mouth', 'A shotgun: it reaches the mouth from farther'],
    correct: 'An omni: small aiming errors matter less',
    explain: 'An omni hears much the same in every direction, so a mouth a little off its front is not much duller. It also hears the crowd from every side — keep it close.',
    why: {
      'A supercardioid: it hears only the mouth': 'A supercardioid needs MORE accurate aim, and it hears more than the mouth.',
      'A shotgun: it reaches the mouth from farther': 'A shotgun does not reach farther; distance still decides.',
    },
  },
  {
    id: 'b10.mic.2',
    page: 'microphone',
    prompt: 'You switch to a supercardioid handheld in heavy crowd noise. What must you check?',
    options: ['Where the PA sits against its rear lobe', 'That it is held a long way from the mouth', 'Nothing: a tighter pattern isolates the voice'],
    correct: 'Where the PA sits against its rear lobe',
    explain: 'A supercardioid hears less from the sides but has a small lobe behind; its quietest directions are off to the rear sides. Aim it carefully at the mouth and check the PA.',
    why: {
      'That it is held a long way from the mouth': 'Distance is never the fix: keep it close.',
      'Nothing: a tighter pattern isolates the voice': 'No pattern isolates a voice in a stadium.',
    },
  },
  {
    id: 'b10.mic.3',
    page: 'microphone',
    prompt: 'A handheld is held far from the mouth. What can a narrow pattern do about it?',
    options: ['Little: distance decides the voice', 'Reach the voice from farther, like a telescope', 'Make up for it once the gain is turned up to match'],
    correct: 'Little: distance decides the voice',
    explain: 'A pattern trims some directions; it cannot pull a distant voice ahead of a crowd. Close to the speaking mouth comes first.',
    why: {
      'Reach the voice from farther, like a telescope': 'A pattern does not reach; it only hears less from some directions.',
      'Make up for it once the gain is turned up to match': 'Gain raises the crowd by the same amount.',
    },
  },
  {
    id: 'b10.mic.4',
    page: 'microphone',
    prompt: 'The reporter wears a headset boom. What still needs a mic?',
    options: ['The guest: the headset hears the reporter', 'Nothing: the headset hears both of them clearly', 'The crowd: the headset cancels it'],
    correct: 'The guest: the headset hears the reporter',
    explain: 'A headset steadies the reporter’s questions at one distance; the guest still needs a handheld, a body mic or a boom.',
    why: {
      'Nothing: the headset hears both of them clearly': 'The guest is far from the reporter’s mouth corner: distant and crowd-heavy.',
      'The crowd: the headset cancels it': 'The crowd has its own mics; a headset cancels nothing.',
    },
  },
  {
    id: 'b10.place.1',
    page: 'placement',
    prompt: 'A starting point says “under 15 cm from the speaking mouth”. What is it measured from?',
    options: ['The speaker’s lips, to the front of the mic', 'The reporter’s hand, to the guest’s chin below it', 'The camera’s lens, to the mic’s flag'],
    correct: 'The speaker’s lips, to the front of the mic',
    explain: 'The voice leaves at the mouth, so the distance starts at the speaking person’s lips and ends at the mic’s grille.',
    why: {
      'The reporter’s hand, to the guest’s chin below it': 'Neither is where the voice leaves or the mic hears.',
      'The camera’s lens, to the mic’s flag': 'The camera decides what shows, not the distance that matters.',
    },
  },
  {
    id: 'b10.place.2',
    page: 'placement',
    prompt: 'A gusty wind rumbles in the handheld. A first idea to try?',
    options: ['A wind cover for the conditions; turn out of it', 'A deep low cut on the channel, and nothing else', 'Press the foam windscreen against the mouth'],
    correct: 'A wind cover for the conditions; turn out of it',
    explain: 'Use wind protection fit for the conditions, and turn the bodies or move to a sheltered, permitted spot. A filter cannot repair wind overload; a foam screen is not waterproof.',
    why: {
      'A deep low cut on the channel, and nothing else': 'A filter cannot repair an input the wind has already overloaded.',
      'Press the foam windscreen against the mouth': 'Pressed to the mouth it adds breath and handling, and it is not hygienic.',
    },
  },
  {
    id: 'b10.place.3',
    page: 'placement',
    prompt: 'The guest wears an approved body mic and also answers into the handheld, both open. What can happen?',
    options: ['The two copies of one voice comb', 'The voice gets twice as clear', 'The body mic switches off by itself'],
    correct: 'The two copies of one voice comb',
    explain: 'One voice at two distances arrives twice, a little apart: summed, some pitches cancel. Choose one, or make a deliberate transition between them.',
    why: {
      'The voice gets twice as clear': 'Two copies at different delays sound hollower, not clearer.',
      'The body mic switches off by itself': 'Nothing switches by itself: choose the mic on purpose.',
    },
  },
  {
    id: 'b10.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Where does almost all of the guest’s voice leave?',
    options: ['The mouth — distances start at the lips', 'The throat, low in the neck where the folds are', 'The chest, behind the breastbone, where it resonates'],
    correct: 'The mouth — distances start at the lips',
    explain: 'The voice is made in the throat but leaves through the mouth (on m, n and ng partly the nose). Distances are read from the lips.',
    why: {
      'The throat, low in the neck where the folds are': 'The folds start the sound; it leaves through the mouth.',
      'The chest, behind the breastbone, where it resonates': 'The chest is not where the voice leaves a talker.',
    },
  },
  {
    id: 'b10.ctx.1',
    page: 'context',
    prompt: 'A loud sideline, the PA high beyond the camera. A fair first step for the handheld?',
    options: ['Close to the speaking mouth, rejection to the PA', 'Farther from the mouth, for a cleaner-sounding answer', 'Turned up until the voice is louder than the PA'],
    correct: 'Close to the speaking mouth, rejection to the PA',
    explain: 'Close keeps the voice ahead of the crowd and the PA; then let the pattern’s rejection face the PA where the mouth allows.',
    why: {
      'Farther from the mouth, for a cleaner-sounding answer': 'Farther brings the crowd and the PA up against the voice.',
      'Turned up until the voice is louder than the PA': 'Gain raises the PA with the voice.',
    },
  },
  superNull('b10.ctx.2', 'context', 'PA'),
  {
    id: 'b10.ctx.studio',
    page: 'context',
    prompt: 'A scheduled post-event guest in front of a backdrop, time to prepare. What is a fair first setup?',
    options: ['An approved body mic, or a boom outside the frame', 'A handheld left on a stand right beside the backdrop', 'A camera-top mic, since the camera is close by'],
    correct: 'An approved body mic, or a boom outside the frame',
    explain: 'With time and approval, a body mic or a boom at a controlled mark gives a steady, repeatable voice — each on its own channel.',
    why: {
      'A handheld left on a stand right beside the backdrop': 'A mic on a stand is not at the mouth, and the guest will move.',
      'A camera-top mic, since the camera is close by': 'The camera is metres away: distant and crowd-heavy.',
    },
  },
  {
    id: 'b10.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Before anything is attached to a guest’s uniform, what is needed?',
    options: ['Their approval and the event’s', 'A quick check that it fits them well', 'The camera operator’s say-so'],
    correct: 'Their approval and the event’s',
    explain: 'Approval first — the guest’s and the event’s — and nothing on regulated gear.',
    why: {
      'A quick check that it fits them well': 'Fit comes after approval.',
      'The camera operator’s say-so': 'The camera does not approve a mount on a person.',
    },
  },
  {
    id: 'b10.two.1',
    page: 'twoMic',
    prompt: 'With two handhelds open, the reporter’s voice sounds hollow. Why?',
    options: ['It reaches the guest’s mic later', 'The guest’s mic reverses its polarity', 'The closer mic is louder, so it cancels'],
    correct: 'It reaches the guest’s mic later',
    explain: 'The reporter’s voice reaches their own mic first and the guest’s later. Summed, some pitches arrive out of step and cancel — a comb.',
    why: {
      'The guest’s mic reverses its polarity': 'Distance delays a sound; it does not flip its sign.',
      'The closer mic is louder, so it cancels': 'A level difference changes how deep the notches are; the delay makes them.',
    },
  },
  polarityDelay('b10.two.2'),
  {
    id: 'b10.two.3',
    page: 'twoMic',
    prompt: 'The guest lowers their mic to the waist in the excitement. What happens?',
    options: ['Their voice drops; the crowd and the other mic rise', 'Nothing much, since the mic is still in their own hand', 'The voice gets clearer away from the breath'],
    correct: 'Their voice drops; the crowd and the other mic rise',
    explain: 'At the waist the mic is far from the mouth: the guest drops against the crowd and the reporter’s voice. Coach a steady mouth-level hold, or use the handoff.',
    why: {
      'Nothing much, since the mic is still in their own hand': 'In the hand, but far from the mouth — the distance counts.',
      'The voice gets clearer away from the breath': 'Away from the breath, yes — and away from the voice too.',
    },
  },
  {
    id: 'b10.two.4',
    page: 'twoMic',
    prompt: 'Why keep the reporter and the guest on separate labelled channels?',
    options: ['Each can be checked and balanced alone', 'Two channels make both of the voices louder', 'So the two mics form a stereo pair'],
    correct: 'Each can be checked and balanced alone',
    explain: 'On separate channels each voice can be soloed, levelled, pulled down when unused and checked in mono. A sum made at the source cannot be undone.',
    why: {
      'Two channels make both of the voices louder': 'Level comes from gain, not from channels.',
      'So the two mics form a stereo pair': 'They are two close voice mics, not a stereo pair.',
    },
  },
  {
    id: 'b10.prac.gain',
    page: 'practice',
    prompt: 'A close cheer behind the guest lights the overload light; the answers sit well below it. What do you do?',
    options: ['Lower the input gain; leave headroom for peaks', 'Pull the channel fader down until the cheer is clean', 'Ask the crowd to cheer more quietly'],
    correct: 'Lower the input gain; leave headroom for peaks',
    explain: 'Set gain with headroom for a shout or a close cheer, at every stage. A lower fader does not undo clipping at the input.',
    why: {
      'Pull the channel fader down until the cheer is clean': 'The overload is at the input, before the fader.',
      'Ask the crowd to cheer more quietly': 'The crowd is the event; set gain for it.',
    },
  },
  {
    id: 'b10.prac.3',
    page: 'practice',
    prompt: 'What would justify a second handheld at a sideline interview?',
    options: ['A handoff that cannot work, both on own channels', 'More mics make the interview sound bigger', 'The guest’s voice needs more level than one gives'],
    correct: 'A handoff that cannot work, both on own channels',
    explain: 'Separate handhelds earn their place when a handoff is impractical and both know how to use one — each on its own channel, the unused one down.',
    why: {
      'More mics make the interview sound bigger': 'More open mics mean more crowd and more comb.',
      'The guest’s voice needs more level than one gives': 'Level comes from distance and gain, not from another mic.',
    },
  },
  {
    id: 'b10.mix.1',
    page: 'practice',
    prompt: 'Someone suggests a long shotgun from the stands instead of a handheld. A fair answer?',
    options: ['It will not isolate a distant voice in a stadium', 'It will, since a shotgun reaches much farther than a handheld', 'It will, if the crowd stays quiet enough'],
    correct: 'It will not isolate a distant voice in a stadium',
    explain: 'A shotgun’s narrow pickup does not turn a distant sideline into an isolated voice: distance still decides.',
    why: {
      'It will, since a shotgun reaches much farther than a handheld': 'A shotgun does not reach; its pickup narrows only at higher pitches.',
      'It will, if the crowd stays quiet enough': 'The crowd is the event; plan for it.',
    },
  },
  {
    id: 'b10.mix.2',
    page: 'practice',
    prompt: 'The radio mic drops out at one interview mark. Who decides a new frequency?',
    options: ['The venue’s radio coordinator', 'You, on the receiver straight away', 'The guest’s team, on the day'],
    correct: 'The venue’s radio coordinator',
    explain: 'The radio coordinator owns the frequencies. Walk the marks and the route, listen for dropouts, and use the cabled fallback while it is fixed.',
    why: {
      'You, on the receiver straight away': 'Changing a frequency alone can collide with other systems.',
      'The guest’s team, on the day': 'Frequencies are coordinated for the whole venue.',
    },
  },
  removeDelay('b10.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'b10.sym.first',
    observation: 'The first words of each answer sound distant',
    firstChecks: 'Where is the mic when the answer starts? Is it left between the mouths, or lowered after the question?',
    options: ['Move the mic first, then pause for the answer', 'Raise the gain on the first words of each answer', 'Ask the guest to start their answers more loudly'],
    correct: 'Move the mic first, then pause for the answer',
    explain: 'Question, move, pause, answer: the mic is at the guest’s mouth before the first word.',
    why: {
      'Raise the gain on the first words of each answer': 'Gain raises the crowd with the distant words.',
      'Ask the guest to start their answers more loudly': 'The answer is the guest’s; fix the timing of the move.',
    },
  },
  {
    id: 'b10.sym.wind',
    observation: 'Wind rumble and overload in gusts',
    firstChecks: 'Is the wind cover right for the conditions? Can the bodies turn, or the interview move to shelter inside the approved area?',
    options: ['A proper wind cover; turn or move out of it', 'A deep low cut on the channel and carry on', 'Cup the grille with the hand to shield it from the wind'],
    correct: 'A proper wind cover; turn or move out of it',
    explain: 'Protect the mic from the wind and change the angle to it. A filter cannot repair wind overload; a cupped grille changes the pattern.',
    why: {
      'A deep low cut on the channel and carry on': 'A filter after the overload cannot undo it.',
      'Cup the grille with the hand to shield it from the wind': 'Cupping changes the mic’s pattern and adds handling noise.',
    },
  },
  {
    id: 'b10.sym.crowd',
    observation: 'The crowd swamps the answers',
    firstChecks: 'How far is the mic from the speaking mouth? Is it aimed at the mouth? Are unused mics open?',
    options: ['Bring the mic closer, aimed at the mouth', 'Turn the gain up until the voice is on top', 'Swap to a long shotgun held farther away'],
    correct: 'Bring the mic closer, aimed at the mouth',
    explain: 'Distance and aim decide the voice against the crowd; pull the unused mics down. A directional pattern helps only if it is aimed and close.',
    why: {
      'Turn the gain up until the voice is on top': 'Gain raises the crowd by the same amount.',
      'Swap to a long shotgun held farther away': 'Farther is worse; a shotgun does not reach.',
    },
  },
  {
    id: 'b10.sym.handling',
    observation: 'Thumps and rubbing on the handheld',
    firstChecks: 'Is the grip changing? Is the cable pulling? Is the flag knocking anything?',
    options: ['A steady grip, the cable slack, the flag clear', 'Cut the low end hard on the channel and carry on', 'Hand the mic over to the guest to hold themselves'],
    correct: 'A steady grip, the cable slack, the flag clear',
    explain: 'Handling noise starts at the hand: a steady grip, a cable with slack, a flag that touches nothing.',
    why: {
      'Cut the low end hard on the channel and carry on': 'A filter thins the voice and leaves the knocks.',
      'Hand the mic over to the guest to hold themselves': 'An untrained hand usually adds more handling, and the mic drops away.',
    },
  },
  {
    id: 'b10.sym.dropout',
    observation: 'The radio mic drops out at one mark',
    firstChecks: 'Is the receiver in line of sight? Batteries? Is the frequency coordinated? Is the fallback ready?',
    options: ['Tell the radio coordinator; use the fallback', 'Change the frequency yourself on the spot', 'Turn the receiver’s output up until it comes back'],
    correct: 'Tell the radio coordinator; use the fallback',
    explain: 'The radio coordinator owns the frequencies and the antenna plan; switch to the tested cabled mic or another channel meanwhile.',
    why: {
      'Change the frequency yourself on the spot': 'An uncoordinated change can collide with other systems.',
      'Turn the receiver’s output up until it comes back': 'Level does not fix a lost radio signal.',
    },
  },
  hollowSymptom('b10.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'b10.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of an interview setup in the order you would do them.',
    steps: [
      { text: 'Confirm the approved zone, the camera, the feed and the exit', early: 'Start with where you may work, before any equipment.' },
      { text: 'Assign who moves the mic, who runs the camera, who monitors', early: 'Name the people before you rehearse.' },
      { text: 'Choose the mic and its wind cover for the conditions', early: 'Choose the mic once you know the place.' },
      { text: 'Rehearse the handoff: question, move, pause, answer', early: 'Rehearse once the mic is chosen.' },
      { text: 'Set gain with headroom for a shout or a cheer', early: 'Gain comes once the handoff works.' },
      { text: 'Check the speech at the real program; the return and cues', early: 'Check the destination once the level is set.' },
      { text: 'Test the radio path along the route; ready the fallback', early: 'The radio path and the fallback close the setup.' },
    ],
    explain: 'A sensible order. Nothing on a person without approval; nobody in play or a route.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'b10.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A sudden sideline interview seconds after play: one reporter, one guest out of breath, a loud crowd, a gusty wind.',
    setups: [
      { id: 'a', label: 'One omni handheld with a wind cover, moved to each mouth', ok: true, power: 'none', feedback: 'A recommended start: forgiving of aim — move it before each answer and check the wind.' },
      { id: 'b', label: 'A cardioid handheld, kept close and aimed at each mouth', ok: true, power: 'none', feedback: 'A recommended start in heavy noise — if the reporter aims well and keeps it close.' },
      { id: 'c', label: 'One handheld held still halfway between the two', ok: false, power: 'none', feedback: 'Far from both mouths: distant answers and the crowd close behind.' },
      { id: 'd', label: 'A body mic clipped on the guest as they walk up', ok: false, power: 'none', feedback: 'No time for approval or a proper fit — and nothing goes on a person without it.' },
      { id: 'e', label: 'A long shotgun from behind the camera', ok: false, power: 'phantom', feedback: 'Distance still decides; it will not isolate the voice in a stadium.' },
    ],
    reasons: [docReason('the speaking person’s lips'), clearReason('the faces, the lens and the routes'), { id: 'r.handoff', label: 'The mic reaches each mouth before they speak', role: 'required', feedback: 'Say how the first words are caught.' }, { id: 'r.pattern', label: 'The pattern isolates the voice from the crowd', role: 'wrong', feedback: 'No pattern isolates a voice in a stadium.' }, BRAND_REASON('reporter'), LOUD_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a mic close to the speaking mouth, moved before the answer, clear of faces, the lens and the routes — and no promise that a pattern removes the crowd.',
  },
  {
    id: 'b10.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A scheduled post-event guest at a mark in front of a backdrop; time to prepare; the guest agrees to be fitted.',
    setups: [
      { id: 'a', label: 'An approved body mic at the breastbone, its own channel', ok: true, power: 'none', feedback: 'A recommended start: steady, with nothing in the hands — check rub, sweat and the radio path.' },
      { id: 'b', label: 'A boom held outside the frame, aimed down at the mouth', ok: true, power: 'phantom', feedback: 'A recommended start: nothing on the body — keep it close and re-aimed.' },
      { id: 'c', label: 'The body mic and a handheld both open, to be safe', ok: false, power: 'none', feedback: 'Two open mics on one voice comb. Choose one, or switch on purpose.' },
      { id: 'd', label: 'A mic on the camera, since the shot is close', ok: false, power: 'none', feedback: 'The camera is metres away: distant and crowd-heavy.' },
      { id: 'e', label: 'A mic taped to the guest’s protective gear', ok: false, power: 'none', feedback: 'Never improvise a mount on regulated or protective gear.' },
    ],
    reasons: [docReason('the lips'), clearReason('the faces, the frame and the walkway'), { id: 'r.approval', label: 'The guest and the event approved the fit', role: 'required', feedback: 'Say who approved anything on the guest.' }, { id: 'r.radio', label: 'The radio channel is coordinated and a fallback is ready', role: 'optional', feedback: 'A fair post-event reason.' }, BRAND_REASON('post-event interview'), { id: 'r.both', label: 'Two open mics on the guest give a fuller voice', role: 'wrong', feedback: 'Two open mics on one voice sound hollower.' }],
    explain: 'Two setups pass. What passes is the reasoning: a steady mic close to the mouth, approved, on its own channel, with a fallback — and never two open mics on one voice by accident.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: where does the guest’s voice leave the body?', options: ['The chest', 'The mouth (and the nose)', 'The throat'], after: 'Now STEP through (or PLAY ONCE), then move the handheld between the two and open the mics.' },
  microphone: { prompt: 'Before you move anything: which handheld forgives a little aim?', options: ['An omni', 'A supercardioid', 'Neither of them'], after: 'Now choose each TYPE and see where it starts.' },
  placement: { prompt: 'Predict: you leave the handheld halfway between the two mouths. What changes?', options: ['More crowd against the voice', 'A closer voice', 'It depends on this guest'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The PA is high beyond the camera. Where will a supercardioid aimed at the guest reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip the guest’s mic polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'sound',
    prompt: 'A handheld is left halfway between the reporter and the guest. What does the answer sound like?',
    options: ['Distant, the crowd close behind it', 'Clear, since both are within reach', 'Louder, since the mic is in the middle'],
    correct: 'Distant, the crowd close behind it',
    explain: 'Halfway is far from both mouths: the voice drops and gain raises the crowd with it.',
    why: {
      'Clear, since both are within reach': 'Within reach is not at the mouth; the distance counts.',
      'Louder, since the mic is in the middle': 'The middle is farther from the speaker than their own mouth.',
    },
  },
  {
    id: 'q.2',
    covers: 'sound',
    prompt: 'When does the handheld reach the guest?',
    options: ['Before the answer: move, pause, answer', 'After the guest’s first few words are out', 'Halfway through the answer, when it settles'],
    correct: 'Before the answer: move, pause, answer',
    explain: 'The mic arrives before the answer starts, so the first words land at the mouth.',
    why: {
      'After the guest’s first few words are out': 'Those words would be distant.',
      'Halfway through the answer, when it settles': 'Half the answer would be distant.',
    },
  },
  {
    id: 'q.3',
    covers: 'setting',
    critical: true,
    prompt: 'A better angle means standing in an athletes’ route for a moment. What do you do?',
    options: ['Keep the route clear; work from where you are', 'Step in quickly while the play is stopped for a moment', 'Ask a steward to hold the route open for you'],
    correct: 'Keep the route clear; work from where you are',
    explain: 'Never step into play or block a medical, official, athlete or security route for a better sound.',
    why: {
      'Step in quickly while the play is stopped for a moment': 'A stoppage does not open a route to the crew.',
      'Ask a steward to hold the route open for you': 'The route is for the athletes and the medical staff, not the crew.',
    },
  },
  {
    id: 'q.4',
    covers: 'setting',
    prompt: 'Before a body mic goes on a guest, what is needed?',
    options: ['The guest’s and the event’s approval', 'A quick fit while the camera rolls', 'The reporter’s go-ahead, and nothing more'],
    correct: 'The guest’s and the event’s approval',
    explain: 'Approval first, through the event’s process — and nothing on regulated gear.',
    why: {
      'A quick fit while the camera rolls': 'Approval and a proper fit come before the shot.',
      'The reporter’s go-ahead, and nothing more': 'The guest and the event approve, not the crew alone.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'Where do the producer’s cues and the program return go?',
    options: ['The reporter’s earpiece only', 'A loudspeaker beside the interview', 'Into the program, so viewers hear them'],
    correct: 'The reporter’s earpiece only',
    explain: 'Cues and the return go to the reporter’s earpiece. A loudspeaker loops into the open mics; cues on air are a routing fault.',
    why: {
      'A loudspeaker beside the interview': 'The open mics would pick it up again, delayed.',
      'Into the program, so viewers hear them': 'Cues are for the reporter, kept off the air.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    prompt: 'Thunder is heard during an outdoor interview. What now?',
    options: ['Stop and get to a safe shelter at once', 'Finish the answer, then go inside', 'Wait in the dugout until the storm passes'],
    correct: 'Stop and get to a safe shelter at once',
    explain: 'Stop and get into a safe shelter — a substantial building or a hard-topped vehicle — and wait 30 minutes after the last thunder. Dugouts and open rain shelters are not safe.',
    why: {
      'Finish the answer, then go inside': 'Do not stay to finish: stop at once.',
      'Wait in the dugout until the storm passes': 'Dugouts and open rain shelters are not safe.',
    },
  },
];

const wedges: Wedge[] = [
  {
    id: 'pa',
    label: 'the PA high beyond the camera',
    short: 'PA',
    p: { x: PA_C.x, y: FLOOR, z: PA_C.z },
    lift: FLOOR - PA_C.y,
    faces: { x: -1, y: 0, z: 0 },
    note: 'High beyond the camera, to the front-right: it reaches the handheld from in front and above — where the pattern’s rejection can be aimed only so far while the mic still faces the mouth.',
    prov: { kind: 'illustrative', reason: 'a typical stadium sideline: the PA’s place and height are drawing defaults' },
    glyph: 'none',
  },
];

export const B10_LESSON: Lesson = {
  id: 'B10',
  labId: 'broadcast',
  title: 'Sideline and Post-Event Interviews',
  subtitle: 'One handheld moved to the mouth before the answer starts — a body mic or a boom when there is time, inside the approved area',
  noun: { one: 'interview', many: 'interviews', subject: 'guest' },
  model: B10_MODEL,
  micTypeIds: ['bcFlagOmni', 'bcFlagCard', 'bcFlagSuper', 'bcHeadsetBoom', 'locLav', 'locBoomSg'],
  zones: B10_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A sports interview: a reporter and a guest — an athlete, a coach — seconds after play at the sideline, or at a post-event mark. One or more moving speakers, a loud crowd, a PA, wind, cameras and limited access.', src: 'LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'Sidelines, mixed zones and post-event backdrops: a handheld with a flag in the reporter’s hand, a headset on a regular reporter, a body mic or a boom for a scheduled guest.', src: 'LESSON' },
    { title: 'WHAT IT DOES', text: 'It keeps the question and the answer intelligible on the program — the first words of the answer included — while everyone stays inside the approved area.', src: 'LESSON' },
    { title: 'NO SINGLE RIGHT DISTANCE', text: 'The capsule, the windscreen, the voice and the framing all change the right place. Begin close to the speaking mouth, move with the conversation, and adjust by listening. Experimentation is encouraged.', src: 'LESSON' },
  ],
  sound: {
    stages: [
      { title: 'Breath from the lungs', text: 'The lungs push air up the windpipe — after play, often out of breath, in short bursts.' },
      { title: 'The vocal folds buzz', text: 'In the voice box, low in the throat, two small folds come together and the breath sets them buzzing. That buzz is the raw sound of the voice.' },
      { title: 'The throat and mouth shape it', text: 'The throat, the tongue, the lips and the open mouth shape the buzz into vowels and words; the tongue, the teeth and the lips add the consonants.' },
      { title: 'It leaves the mouth', text: 'Almost all of it leaves through the open mouth — on m, n and ng partly through the nose. That is where every distance here is measured from: the speaking person’s lips.' },
    ],
    attack: 'P and B push a puff of air straight out of the lips, and a breathless guest pushes harder. A handheld a little below the mouth, still aimed at it, keeps the capsule out of the worst of it.',
    body: 'The vowels carry most of the level and the tone. Close to a directional mic they gain low end (the proximity effect); farther, more of the crowd, the wind and the other voice join in. Tendencies, to check by ear.',
    head: { diameterMm: 0, rods: 0, label: 'the mouth', strikeSrc: 'LESSON' },
  },
  setting: {
    items: [
      { id: 'guest', label: 'the guest', short: 'GUEST', note: 'Standing, the mouth at the point every distance is read from. Out of breath, turning to the reporter and the camera.', prov: { kind: 'illustrative', reason: 'the shared figure standing (drawing default)' }, tag: 'THE SOURCE', scene: 'all' },
      { id: 'reporter', label: 'the reporter', short: 'REPORTER', note: 'Beside the guest, holding the mic and moving it to whoever speaks — or with their own headset.', prov: { kind: 'illustrative', reason: 'the lesson L12, L21; the place a drawing default' }, tag: 'THE OTHER VOICE', scene: 'all' },
      { id: 'play', label: 'the play area and the routes', short: 'KEEP CLEAR', note: 'Nobody steps into play or blocks a medical, official, athlete or security route; the exit stays clear.', prov: { kind: 'illustrative', reason: 'the lesson L5, L35' }, tag: 'SAFETY', scene: 'stage' },
      { id: 'crowd', label: 'the crowd and the PA', short: 'CROWD · PA', note: 'Every open mic hears them: close to the speaking mouth, the pattern’s rejection toward the PA.', prov: { kind: 'illustrative', reason: 'the lesson L3, L28' }, tag: 'NOISE', scene: 'all' },
      { id: 'wind', label: 'the wind', short: 'WIND', note: 'A wind cover for the conditions; turn the bodies or move to a sheltered, permitted spot.', prov: { kind: 'illustrative', reason: 'the lesson L29' }, tag: 'WIND', scene: 'stage' },
      { id: 'camera', label: 'the camera', short: 'CAMERA', note: 'The mic and its flag stay close without hiding the face or hitting the lens; a nice shot is no reason for a distant mic.', prov: { kind: 'illustrative', reason: 'the lesson L6' }, tag: 'FRAME', scene: 'all' },
    ],
    stage: 'SIDELINE: one handheld close to the speaking mouth, moved before each answer, a wind cover on, inside the approved area with the exit clear.',
    studio: 'POST-EVENT: a body mic on a scheduled guest with approval, or a boom outside the frame — each on its own channel, a fallback ready.',
  },
  diagnostic,
  practice: {
    task: 'Choose a setup for a sudden sideline interview and for a scheduled post-event guest, describe an alternative, and explain what would justify a second mic. In an approved area, with real people and their agreement, you can record what you tried below.',
    fields: [
      { id: 'approval', label: 'Approved zone, camera, exit — approved by whom', kind: 'text' },
      { id: 'people', label: 'Who moves the mic, who runs the camera, who monitors', kind: 'text' },
      { id: 'mic', label: 'Mic and pattern', kind: 'choice', choices: ['handheld, omni', 'handheld, cardioid', 'handheld, supercardioid', 'reporter headset + guest handheld', 'body mic (approved)', 'boom', 'other'] },
      { id: 'wind', label: 'Wind cover, radio channel, the fallback', kind: 'text' },
      { id: 'routes', label: 'The program, the return and the cues', kind: 'text' },
      { id: 'notes', label: 'First words, crowd, handling (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The standing guest and reporter: the lips 1550 mm above the ground, the reporter 0.65 m to the guest’s left, both facing the camera’s way (the research’s “about 60° apart” is said in words) — drawing defaults; the heads are the voice family’s.', dims: ['yFloor'] },
    { text: 'The handheld: under 15 cm and a little below the breath is frame V’s close handheld row as a suggested start (the lesson gives no distance); its size and the flag are drawing defaults. The arm holding it is the shared figure’s (upper arm 30 cm, forearm 29 cm).', dims: [] },
    { text: 'The camera (2.5 m out), the touchline (1.3 m behind), the exit route, the PA (high beyond the camera), the backdrop, the boom operator and the boom’s 0.5–1 m trial band — drawing defaults.', dims: [] },
    { text: 'The handoff’s timeline is a strip of phases, not a clock; the levels it implies are by distance alone from point mouths (a simplified picture).', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every voice, wind and stadium is different: move the mic, experiment, and trust your ears and the place. The lab is silent and draws a simplified picture: two people standing side by side, mic patterns and the two-mic comb as textbook shapes, levels by distance alone. Distances are rounded to about 5 mm and measured from the lips to the mic’s front. Never into play or a route; approval before anything goes on a person.',
  copy: B10_COPY,
};
