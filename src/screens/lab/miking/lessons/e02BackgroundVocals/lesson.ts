/**
 * E02 BACKGROUND AND HARMONY VOCALS — the lesson as DATA, on the ensemble
 * pages with the singers on frame V. Words from the owner's lesson
 * (docs/labs/miking/source_text/Background-Harmony-Vocal-Miking-Technique.txt;
 * "L<n>" in comments only); research in docs/labs/miking/background_vocals/;
 * corrections E2-* in CORRECTIONS_LOG.md — above all the 3:1 REWRITE (L30:
 * the lesson measured the neighbouring mic from the SINGER; the one
 * definition is mic to mic, at least three times each mic's distance to its
 * own singer), "about 4–8 cm (1.5–3 in)" for the handheld (L24, S-VOC-TIPS),
 * the duplicate reference merged, "Teaching exercise" → "Practice exercise"
 * (L72), the school's name stripped. Suggested starting points; no sources on
 * screen; FULLY SILENT.
 */
import type { DiagnosticItem, LessonPages, MikingScenario, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import type { EnsembleLesson } from '../shared/ensemble/ensembleData.ts';
import { ensembleWords } from '../shared/ensemble/ensembleItems.ts';
import { polarityDelay } from '../shared/bowed/bowedItems.ts';
import { feedbackSymptom, fewerMics, GROUP_BRAND, hearingCheck, NO_PROVOKE_REASON, noProvoke, ownMonitor, phaseySymptom, SAFE_REASON, stepBack, threeToOne, threeToOneWhy } from '../shared/ensemble/voiceGroupItems.ts';
import { SHARED_AT } from '../shared/ensemble/seatingVoices.ts';
import { E02_31, E02_MODEL, E02_PLACE, E02_SETUPS, E02_WEDGES, E02_ZONES, GROUP_AT } from './geometry.ts';

const pages: LessonPages = {
  meet: {
    title: 'Meet it — where the sound comes from',
    goal: 'Meet the backing group — three singers in a row, round one mic, or in a studio circle — and where each voice leaves: the mouth, forward.',
    credit: { scenarios: ['bv.meet.1', 'bv.meet.2', 'bv.meet.3'], note: 'Answer the three checks on where the sound leaves.' },
    takeaway: 'Every voice leaves its own mouth, forward. Close to a mic, a few centimetres change a voice’s level a lot; at a shared mic, each singer’s distance is their fader.',
  },
  setups: {
    title: 'Starting setups',
    goal: 'See real setups drawn on the singers — a close handheld, a handheld each along the row with the 3:1 spacing, a group mic, one shared mic, a pair, an omni circle, two cardioids back to back. Then what to settle before any mic goes up.',
    credit: { scenarios: ['bv.set.1', 'bv.31', 'bv.hear'], interactive: 'setupsSeen', note: 'Look at every main setup on the drawing, and answer the three checks.' },
    takeaway: 'Decide what the parts should sound like first — distinct, a matched stack, or one blend. A mic each gives control; one shared mic gives blend and needs choreography. Separate mics go at least three times their distance to their singers apart.',
  },
  microphone: {
    title: 'Choose the microphones',
    goal: 'Choose by what the part needs — a handheld dynamic for a loud stage, a tighter pattern beside the drums, a wide-range condenser for a shared mic — never by a label.',
    credit: { scenarios: ['bv.mic.1', 'bv.mic.2', 'bv.mic.3', 'bv.mic.4', 'bv.rec.1'], note: 'Answer the five checks (one reaches back to where the sound leaves).' },
    takeaway: 'A handheld dynamic, cardioid or supercardioid, for each live part; a large condenser on a stand for a group sharing one mic; an omni or two cardioids back to back for a studio circle. Matching mics does not match voices — listen.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and move the shared mic (or the group mic) yourself — nearer one singer, higher, back — and see what each singer’s distance does to the balance.',
    credit: { scenarios: ['bv.place.1', 'bv.place.2', 'bv.step', 'bv.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the singers, in two different suggested starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'At a shared mic the singers’ distances are the mix: matched for a blend, the loudest a step back. Move one thing at a time and mark what works on the floor.',
  },
  context: {
    title: 'Live and studio',
    goal: 'Aim a backing singer’s handheld so the wedge sits in its rejection — and know why a studio stack and a live row need different choices.',
    credit: { scenarios: ['bv.ctx.1', 'bv.mon', 'bv.ctx.studio', 'bv.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the handheld (or change its pattern) until the wedge sits in its rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Live, each part needs enough voice over the band with margin before feedback: close, directional, the wedge in the null, the fewest open mics. In the studio, a matched, repeatable stack — or one shared mic in a flattering room.',
  },
  twoMic: {
    title: 'Two singers, two mics',
    goal: 'Two handhelds in the row: see each singer reach the neighbouring mic later and quieter, what polarity changes and what it does not, and why spacing helps.',
    credit: { scenarios: ['bv.two.1', 'bv.two.2', 'bv.two.3'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the three checks.' },
    takeaway: 'Each voice reaches every open mic — its own first, the others later and quieter. Spaced 3:1 the late copies are quiet and the comb shallow; solo each mic and check the mono sum.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to its likely cause and the first change to try.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Distance, angle and spacing first — each singer to their mic, the mics to each other, the wedge to the pattern — then the arrangement, before EQ. Lower the level at the first ring.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a live backing-vocal setup in order, choose and justify a setup for a band stage and for a shared-mic trio, and say when a mic each is worth it.',
    credit: { scenarios: ['bv.prac.order', 'bv.prac.gain', 'bv.prac.setup1', 'bv.prac.setup2', 'bv.prac.3', 'bv.nom', 'bv.31why', 'bv.ring'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'Hear the group, choose the goal, keep stands and cables safe, place each mic at a matched distance from the lips and 3:1 apart — or rehearse a shared mic — set gain on the loudest phrase, and bring wedges up only to the agreed level.',
  },
};

/* THE CHECKS. Lesson refs (comments only): meet L22–L26 · set L5–L7, L30 · mic L24–L29, L33–L36 · place L26–L27 · ctx L35–L37 · two L23 · prac L71–L77. */
const scenarios: MikingScenario[] = [
  {
    id: 'bv.meet.1',
    page: 'meet',
    prompt: 'Where does each backing singer’s voice leave them?',
    options: ['From the mouth, forward', 'From the chest, through the shirt and ribs', 'From the top of the head, upward'],
    correct: 'From the mouth, forward',
    explain: 'Each voice leaves through the singer’s mouth, forward and round the head — so every distance here is read from the lips.',
    why: {
      'From the chest, through the shirt and ribs': 'The chest vibrates; the voice a mic hears leaves through the mouth.',
      'From the top of the head, upward': 'The head vibrates a little; the voice leaves through the mouth, ahead.',
    },
  },
  {
    id: 'bv.meet.2',
    page: 'meet',
    prompt: 'Three singers share one mic. What sets how loud each is in it?',
    options: ['Each singer’s distance and delivery', 'A separate fader for each of the singers', 'The order they stand in, left to right'],
    correct: 'Each singer’s distance and delivery',
    explain: 'One mic, one channel: the singers make the balance themselves — by how they sing and how far from the mic they stand.',
    why: {
      'A separate fader for each of the singers': 'One shared mic is one channel; there is no fader per voice.',
      'The order they stand in, left to right': 'Order alone changes little; distance and delivery set the balance.',
    },
  },
  {
    id: 'bv.meet.3',
    page: 'meet',
    prompt: 'Close to a handheld, why does a small step change a voice’s level so much?',
    options: ['A few cm is a large part of the distance', 'The handheld follows the loudest voice', 'Handhelds turn quiet singers up by design'],
    correct: 'A few cm is a large part of the distance',
    explain: 'At 6 cm, moving 6 cm doubles the distance — about 6 dB. That is why the backing singers keep a steady, rehearsed distance.',
    why: {
      'The handheld follows the loudest voice': 'A mic follows nothing; distance sets what it hears.',
      'Handhelds turn quiet singers up by design': 'There is no such design; close distance does the work.',
    },
  },
  {
    id: 'bv.set.1',
    page: 'setups',
    prompt: 'Before placing any mic for the backing group, what do you decide?',
    options: ['Distinct parts, a matched stack, or one blend', 'Which brand of mic the band likes the most of all', 'How many stands are left in the van'],
    correct: 'Distinct parts, a matched stack, or one blend',
    explain: 'Decide whether the parts should sound like distinct people, a matched stack, a small choir or one texture — the mic plan follows the arrangement and the room, not the stands available.',
    why: {
      'Which brand of mic the band likes the most of all': 'A brand is not a plan: the musical goal decides the approach.',
      'How many stands are left in the van': 'The plan follows the arrangement, not the stands available.',
    },
  },
  threeToOne('bv', 'setups', 'about 30 cm (1 ft)', '90 cm (3 ft)'),
  hearingCheck('bv', 'setups', 'a loud band and three vocals'),
  {
    id: 'bv.mic.1',
    page: 'microphone',
    prompt: 'Why a handheld dynamic for live backing vocals?',
    options: ['It takes loud voices close, with no power', 'It hears the room behind the singer best', 'It needs phantom power to work properly'],
    correct: 'It takes loud voices close, with no power',
    explain: 'A handheld dynamic is made for close, loud voices and handling; its ball grille is its windscreen, and it needs no phantom power.',
    why: {
      'It hears the room behind the singer best': 'A cardioid handheld rejects most behind it — the point on a loud stage.',
      'It needs phantom power to work properly': 'A dynamic makes its own signal; the condensers here need phantom power.',
    },
  },
  {
    id: 'bv.mic.2',
    page: 'microphone',
    prompt: 'A backing singer stands beside a loud drum kit. Why try a supercardioid?',
    options: ['Its tighter pattern rejects more of the stage', 'It makes the singer louder in the mix than the band', 'It has no proximity effect up close'],
    correct: 'Its tighter pattern rejects more of the stage',
    explain: 'A supercardioid hears less from the sides; its rejection sits off its rear, about 126° off the front — place the wedge there, from the real polar plot.',
    why: {
      'It makes the singer louder in the mix than the band': 'Level comes from distance and gain; the pattern changes what else it hears.',
      'It has no proximity effect up close': 'Directional mics all gain low end up close, supercardioids included.',
    },
  },
  {
    id: 'bv.mic.3',
    page: 'microphone',
    prompt: 'A trio will share one mic in a good room. What kind suits it?',
    options: ['A wide-range condenser that suits the room', 'A tiny clip-on mic on the middle singer', 'A handheld they pass between them, live'],
    correct: 'A wide-range condenser that suits the room',
    explain: 'A large-diaphragm condenser, or another wide-range mic, captures a natural group; a directional pattern keeps some stage sound out. The room has to reward it.',
    why: {
      'A tiny clip-on mic on the middle singer': 'A clip-on hears its own singer far more than the others — not a shared mic.',
      'A handheld they pass between them, live': 'A live mic passed around is handling noise and a risk; set one mic on a stand.',
    },
  },
  {
    id: 'bv.mic.4',
    page: 'microphone',
    prompt: 'Two cardioids back to back, a channel each. Why keep the singers in front of the mics, not at their sides?',
    options: ['A side voice lands equally in both mics', 'At the sides neither mic hears a voice', 'In front, the mics stop hearing the room'],
    correct: 'A side voice lands equally in both mics',
    explain: 'Each cardioid hears its own front best and is only about 6 dB down at its side. A singer at the side lands equally in both channels — summed in mono, about as loud as a singer in front, but on neither fader alone and in the middle of a stereo picture. In front of one mic, a voice sits mostly on that channel. Check stereo and mono.',
    why: {
      'At the sides neither mic hears a voice': 'A cardioid at 90° is only about 6 dB down: both mics still hear a singer at the side — and summed, the two together hear all round.',
      'In front, the mics stop hearing the room': 'Both mics hear the room wherever the singers stand; the point is which channel a voice lands in.',
    },
  },
  {
    id: 'bv.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · At a shared mic, what is each singer’s fader?',
    options: ['Their distance from the mic', 'The mic’s pattern switch', 'The order they stand in'],
    correct: 'Their distance from the mic',
    explain: 'One mic, one channel: the singers balance by stepping in for a quiet line and back for a loud one.',
    why: {
      'The mic’s pattern switch': 'The pattern changes what the mic hears all round, for everyone at once.',
      'The order they stand in': 'Order changes little; distance does the balancing.',
    },
  },
  {
    id: 'bv.place.1',
    page: 'placement',
    prompt: 'At the shared mic, one voice is too loud and a little boomy. Likely why?',
    options: ['That singer stands closest to the mic', 'The mic has been switched over to omni', 'That singer sings the lowest part'],
    correct: 'That singer stands closest to the mic',
    explain: 'Closest means loudest — and, at a directional mic, more low end from the proximity effect. Match the distances, or that singer steps back.',
    why: {
      'The mic has been switched over to omni': 'An omni has no proximity boost; closeness is the cause.',
      'That singer sings the lowest part': 'A low part is not boomy by itself; closeness adds the boom.',
    },
  },
  {
    id: 'bv.place.2',
    page: 'placement',
    prompt: 'Why mark the floor round a shared mic?',
    options: ['So each singer finds their distance again', 'So the stand stays perfectly upright on the floor', 'So the audience knows where to look'],
    correct: 'So each singer finds their distance again',
    explain: 'The shared mic works by rehearsed distances: marks on the floor (and the stand’s height noted) let the singers return to the balance they found.',
    why: {
      'So the stand stays perfectly upright on the floor': 'The marks are for the singers’ feet, not the stand.',
      'So the audience knows where to look': 'They are for the singers’ distances, not the audience.',
    },
  },
  stepBack('bv', 'placement'),
  {
    id: 'bv.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · The 3:1 guideline is measured between…',
    options: ['The two mics', 'A mic and the next singer', 'The singer and the floor'],
    correct: 'The two mics',
    explain: 'Mic to mic: at least three times each mic’s distance to its own singer. Measured from a mic to the neighbouring SINGER, it is a different number.',
    why: {
      'A mic and the next singer': 'That is not the guideline: it is measured between the mics.',
      'The singer and the floor': 'The floor plays no part in 3:1.',
    },
  },
  {
    id: 'bv.ctx.1',
    page: 'context',
    prompt: 'Backing singers beside a loud band. A good first step for each mic?',
    options: ['A close handheld, its rejection on the wedge', 'A condenser 1 m away for a natural, open blend', 'Turn them up until they cut through'],
    correct: 'A close handheld, its rejection on the wedge',
    explain: 'Close, each voice stays ahead of the band; the wedge sits where the pattern rejects most. More gain only raises the stage in the mic and brings feedback closer.',
    why: {
      'A condenser 1 m away for a natural, open blend': 'At a metre on a loud stage the mic hears the band almost as much as the voices.',
      'Turn them up until they cut through': 'More gain raises everything in the mic, and brings feedback closer.',
    },
  },
  ownMonitor('bv', 'context', 'group'),
  {
    id: 'bv.ctx.studio',
    page: 'context',
    prompt: 'STUDIO · A tight, controllable backing stack. Where do you start?',
    options: ['One part at a time, matched mic and distance', 'All of them round one omni, in one take', 'A spaced pair across the far side of the room'],
    correct: 'One part at a time, matched mic and distance',
    explain: 'For a tight stack, record each part on a suitable mic at a repeatable mouth distance — the same stand height, screen distance and room position — with a good headphone mix.',
    why: {
      'All of them round one omni, in one take': 'A circle gives a blend, not separate control of each part.',
      'A spaced pair across the far side of the room': 'A distant pair hears the room and the blend, not a controllable stack.',
    },
  },
  {
    id: 'bv.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Close to a handheld, a small step changes the level a lot. So?',
    options: ['Rehearse a steady distance', 'Compress it until it stops', 'Move the mic with the singer'],
    correct: 'Rehearse a steady distance',
    explain: 'Close in, a few centimetres is a big share of the distance. A rehearsed, steady distance — farther for loud lines, closer for quiet — beats heavy compression.',
    why: {
      'Compress it until it stops': 'Compression evens the level but not the changing tone, and brings the stage up.',
      'Move the mic with the singer': 'The singer keeps the distance; the mic stays on its stand.',
    },
  },
  {
    id: 'bv.two.1',
    page: 'twoMic',
    prompt: 'Two handhelds 1.1 m apart, each singer 6 cm from their own. Does the high singer reach the middle mic?',
    options: ['Yes, much quieter and later', 'No, a cardioid hears only its own singer', 'Yes, as loud as in their own mic'],
    correct: 'Yes, much quieter and later',
    explain: 'Every open mic hears every voice. At 1.1 m against 6 cm the neighbour’s copy is far quieter and a few milliseconds late: the comb in the sum is shallow.',
    why: {
      'No, a cardioid hears only its own singer': 'A cardioid favours its front; it still hears the singer beside it.',
      'Yes, as loud as in their own mic': 'About eighteen times farther away, it arrives far quieter.',
    },
  },
  polarityDelay('bv.two.2'),
  {
    id: 'bv.two.3',
    page: 'twoMic',
    prompt: 'The harmony stack sounds phasey. What do you check first?',
    options: ['Each mic alone, then the mono sum', 'Turn up the brightest singer', 'Pan the three parts hard apart'],
    correct: 'Each mic alone, then the mono sum',
    explain: 'Several mics hearing the same singer at different delays make a comb. Solo each mic, sum to mono, then adjust the spacing or the arrangement.',
    why: {
      'Turn up the brightest singer': 'More level on one mic does not remove the overlap behind the comb.',
      'Pan the three parts hard apart': 'Panning hides it in stereo; the mono sum still combs.',
    },
  },
  {
    id: 'bv.prac.gain',
    page: 'practice',
    prompt: 'How do you set gain for each backing singer?',
    options: ['On their loudest real phrase', 'On a quiet spoken check', 'On the lead singer’s level'],
    correct: 'On their loudest real phrase',
    explain: 'Set each input on that singer’s loudest real phrase — the loud chorus — with headroom. A spoken check hides the peaks.',
    why: {
      'On a quiet spoken check': 'Speech is far quieter than a sung chorus; it would overload later.',
      'On the lead singer’s level': 'Each singer has their own level and their own input.',
    },
  },
  {
    id: 'bv.prac.3',
    page: 'practice',
    prompt: 'When does a mic each beat one shared mic?',
    options: ['When parts need their own level or effects', 'When there are spare stands left over in the van', 'When the singers want to move less'],
    correct: 'When parts need their own level or effects',
    explain: 'Separate mics earn their stands, channels and phase paths when entries, singers or effects need different levels; a shared mic wins when the blend matters most.',
    why: {
      'When there are spare stands left over in the van': 'Spare stands are not a musical reason.',
      'When the singers want to move less': 'Movement is a choreography question; the musical goal decides.',
    },
  },
  fewerMics('bv', 'practice'),
  threeToOneWhy('bv', 'practice'),
  noProvoke('bv', 'practice'),
];

const symptoms: Symptom[] = [
  {
    id: 'bv.s.dom',
    observation: 'One backing singer dominates',
    firstChecks: 'Relative distance, delivery and the capsule’s angle? Rehearse the distance, or give that part its own control.',
    options: ['Rehearse the distance, or a mic each', 'Cut that singer with EQ on the bus', 'Ask the others to sing much louder'],
    correct: 'Rehearse the distance, or a mic each',
    explain: 'At a shared mic distance is the fader: match it or step back. With separate mics, set each one’s distance and angle the same.',
    why: { 'Cut that singer with EQ on the bus': 'EQ on a shared mic cuts everyone in that range.', 'Ask the others to sing much louder': 'Pushing voices changes the performance; fix the distances.' },
  },
  phaseySymptom('bv.s.phase', 'The harmony stack sounds phasey'),
  {
    id: 'bv.s.apart',
    observation: 'The group sounds disconnected',
    firstChecks: 'Too much separate close miking, or mismatched rooms? Match the distances and the room, or try a shared or area mic.',
    options: ['Match distance and room, or share a mic', 'Add reverb to each singer differently', 'Move each mic in even closer to the lips'],
    correct: 'Match distance and room, or share a mic',
    explain: 'Close, separate mics can sound like strangers. Matched distances, a common room, or one shared mic bring the group together.',
    why: { 'Add reverb to each singer differently': 'Different reverbs push them further apart.', 'Move each mic in even closer to the lips': 'Closer separates them more.' },
  },
  {
    id: 'bv.s.lost',
    observation: 'The shared mic loses a singer',
    firstChecks: 'Is that singer outside the pattern, or too far away? Mark the working zone and rehearse the moves.',
    options: ['Mark the zone; rehearse the moves', 'Turn the whole group up to find them', 'Point the mic at that singer alone'],
    correct: 'Mark the zone; rehearse the moves',
    explain: 'At a shared mic each singer needs a known working zone — in front of the pattern, at the rehearsed distance. Marks on the floor bring them back.',
    why: { 'Turn the whole group up to find them': 'More gain raises the others and the stage too.', 'Point the mic at that singer alone': 'The others then fall off the front; fix the positions.' },
  },
  {
    id: 'bv.s.cons',
    observation: 'The consonants jump out',
    firstChecks: 'A singer too close or straight on the axis? A screen or windscreen, a little angle or distance, and matched diction.',
    options: ['A screen, a little angle or distance', 'Boost the treble so the words cut', 'Ask that singer to drop the S sounds'],
    correct: 'A screen, a little angle or distance',
    explain: 'A singer close and on axis makes an S or T stand out. Angle, distance or a screen first — and agree the consonants together.',
    why: { 'Boost the treble so the words cut': 'More treble makes the jumping consonants worse.', 'Ask that singer to drop the S sounds': 'The words are the song; agree the diction instead.' },
  },
  feedbackSymptom('bv.s.ring'),
  {
    id: 'bv.s.muffle',
    observation: 'A live handheld sounds muffled',
    firstChecks: 'Is the singer cupping the grille or covering the rear ports? Rehearse a proper grip; keep the grille clear.',
    options: ['Rehearse the grip; keep the grille open', 'Boost the highs on the channel until it sounds clear', 'Swap it for a brighter-sounding mic'],
    correct: 'Rehearse the grip; keep the grille open',
    explain: 'A cupped grille changes the pattern, dulls the sound and brings feedback closer. Hold the handle, grille open.',
    why: { 'Boost the highs on the channel until it sounds clear': 'EQ on a cupped mic is harsh and still feedback-prone.', 'Swap it for a brighter-sounding mic': 'Any mic muffles when cupped; fix the grip.' },
  },
];

const DIST_REASON: SetupReason = { id: 'r.dist', label: 'Each mic measured from its singer’s lips, at a matched distance', role: 'required', feedback: 'Say what the distance is measured from — the lips — and keep the parts matched.' };
const R31: SetupReason = { id: 'r.31', label: 'The mics at least three times their distance apart', role: 'optional', feedback: 'A fair reason: mic to mic, 3:1 keeps the neighbours’ copies quiet.' };
const MATCH_REASON: SetupReason = { id: 'r.match', label: 'Every mouth at a matched distance; the loudest steps back', role: 'required', feedback: 'Say how the balance is made at a shared mic: distance.' };
const REHEARSE_REASON: SetupReason = { id: 'r.rehearse', label: 'The moves rehearsed with the real song, the floor marked', role: 'required', feedback: 'A shared mic needs choreography: say how it is rehearsed.' };

const setupTasks: SetupTask[] = [
  {
    id: 'bv.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A pop band: three backing singers beside the drums, a wedge in front of each, harmony entries that need their own levels.',
    setups: [
      { id: 'a', label: 'A handheld each, 4–8 cm from the lips, the wedge behind it', ok: true, power: 'none', feedback: 'A suggested start: close, separate, each part on its own fader; check the wedge against the pattern.' },
      { id: 'b', label: 'A supercardioid handheld each, the wedge well to one side of its rear', ok: true, power: 'none', feedback: 'Fair beside loud drums, with the wedge near its null.' },
      { id: 'c', label: 'One condenser a metre in front of all three', ok: false, power: 'phantom', feedback: 'It hears the drums almost as much as the voices, and no part has its own level.' },
      { id: 'd', label: 'Handhelds the singers cup to sound louder', ok: false, power: 'none', feedback: 'Cupping muffles the voice and brings feedback closer.' },
      { id: 'e', label: 'Wedges up until it rings, then back a little', ok: false, power: 'none', feedback: 'Never provoke feedback; bring them up only to the agreed level.' },
    ],
    reasons: [DIST_REASON, SAFE_REASON, R31, NO_PROVOKE_REASON, GROUP_BRAND],
    explain: 'Two setups pass. What passes is the reasoning: close mics measured from the lips, matched, 3:1 apart, the wedges in the rejection — and no provoked feedback.',
  },
  {
    id: 'bv.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A bluegrass trio in a small room; few or no monitors; one channel for the voices. Phantom power is available.',
    setups: [
      { id: 'a', label: 'One large condenser, the trio round its front, the floor marked', ok: true, power: 'phantom', feedback: 'The shared-mic way: they mix themselves by distance.' },
      { id: 'b', label: 'An X/Y pair in the middle, the trio across its front', ok: true, power: 'phantom', feedback: 'Fair: the same self-balanced group, in stereo; check mono.' },
      { id: 'c', label: 'Three handhelds passed around while live', ok: false, power: 'none', feedback: 'A live mic passed around is handling noise and a risk — and three are not one channel.' },
      { id: 'd', label: 'One mic, the loudest singer standing closest', ok: false, power: 'phantom', feedback: 'The loudest steps BACK; closest makes them louder still.' },
      { id: 'e', label: 'An omni in the middle of a loud stage with wedges', ok: false, power: 'phantom', feedback: 'An omni hears the wedges and the stage as much as the voices.' },
    ],
    reasons: [MATCH_REASON, REHEARSE_REASON, SAFE_REASON, GROUP_BRAND],
    explain: 'Two setups pass. What passes is the reasoning: matched distances, the loudest a step back, the moves rehearsed and marked, and the stage kept safe.',
  },
];

const predictions: EnsembleLesson['predictions'] = {
  microphone: { prompt: 'Before you look: which pattern rejects most of the drums beside the singer?', options: ['Supercardioid', 'Omni', 'They reject the same'], after: 'Now sweep SOURCE ANGLE round the pattern and watch PICKUP.' },
  placement: { prompt: 'Predict: the shared mic moves 10 cm toward the middle singer. What changes most?', options: ['The middle singer gets louder', 'Nothing: the others balance it', 'All three get louder equally'], after: 'Watch NEAR / FAR and NEAREST: one singer’s distance is that singer’s level.' },
  context: { prompt: 'The wedge is on the floor in front of the singer. Where will a supercardioid aimed at the mouth reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'Two handhelds on two singers. If you flip B’s polarity, what happens to Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE to the other singer.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'bv.q.1',
    covers: 'meet',
    prompt: 'Where is a backing singer’s mic distance measured from?',
    options: ['The lips, to the front of the mic', 'The chin, to the stand’s clip', 'The chest, to the mic’s handle'],
    correct: 'The lips, to the front of the mic',
    explain: 'The voice leaves through the mouth, so every distance runs from the lips to the mic’s front.',
    why: { 'The chin, to the stand’s clip': 'The chin is not where the sound leaves.', 'The chest, to the mic’s handle': 'The voice a mic hears leaves from the mouth.' },
  },
  {
    id: 'bv.q.2',
    covers: 'meet',
    prompt: 'At a shared mic, how does a singer get quieter in the mix?',
    options: ['Step back a little', 'Turn to face the room', 'Sing straight into the top'],
    correct: 'Step back a little',
    explain: 'One mic, one channel: distance is each singer’s fader.',
    why: { 'Turn to face the room': 'Turning away changes the tone and loses the words.', 'Sing straight into the top': 'That changes the tone, not the balance you want.' },
  },
  {
    id: 'bv.q.3',
    covers: 'setups',
    prompt: 'Each singer is 30 cm from their mic. As a start, how far apart go the mics?',
    options: ['At least 90 cm apart', 'At least 90 cm from the next singer', 'About 30 cm apart'],
    correct: 'At least 90 cm apart',
    explain: 'The 3:1 guideline is mic to mic: at least three times each mic’s distance to its own singer.',
    why: { 'At least 90 cm from the next singer': 'It is measured between the mics, not from a mic to a singer.', 'About 30 cm apart': 'At 1:1 the neighbouring voice arrives almost as loud: a deep comb.' },
  },
  {
    id: 'bv.q.4',
    covers: 'setups',
    prompt: 'Which approach gives each part its own level later?',
    options: ['A mic per singer', 'One shared mic', 'One area mic above'],
    correct: 'A mic per singer',
    explain: 'Separate mics give level, pan and effects per part — at the cost of stands, channels and phase paths.',
    why: { 'One shared mic': 'One mic is one channel: the balance is set by the singers.', 'One area mic above': 'An area mic captures the group as one texture.' },
  },
  {
    id: 'bv.q.5',
    covers: 'setups',
    critical: true,
    prompt: 'The singers move during a song. What must the stands and cables keep clear of?',
    options: ['Their feet, faces and moves', 'The audience’s view of the band', 'The lead singer’s spotlight'],
    correct: 'Their feet, faces and moves',
    explain: 'Stable stands and secured cables so the singers can move without tripping or striking a mic — rehearse the moves and the approach and exit paths.',
    why: { 'The audience’s view of the band': 'Sight lines matter, but safety is about the singers’ bodies.', 'The lead singer’s spotlight': 'Lighting is not the safety question; the singers’ movement is.' },
  },
  {
    id: 'bv.q.6',
    covers: 'setups',
    critical: true,
    prompt: 'You monitor three loud vocals and a band on headphones all day. What protects your ears?',
    options: ['Sensible levels and short breaks', 'The mics’ highest level rating', 'Turning up to hear the detail'],
    correct: 'Sensible levels and short breaks',
    explain: 'A widely used guideline: no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — a limit for people where they listen.',
    why: { 'The mics’ highest level rating': 'That is about the mic, not your ears.', 'Turning up to hear the detail': 'Louder raises your exposure; detail comes from placement.' },
  },
];

export const E02_LESSON: EnsembleLesson = {
  id: 'E02',
  labId: 'ensembles',
  title: 'Background and Harmony Vocals',
  subtitle: 'A handheld each about 4–8 cm from the lips and 3:1 apart, or one shared mic the singers balance by distance',
  noun: { one: 'backing group', many: 'backing groups' },
  model: E02_MODEL,
  micTypeIds: ['vocDynCard', 'vocDynSuper', 'grpLdc', 'arrCard'],
  zones: E02_ZONES,
  setupPairs: [{ label: 'Two handhelds on two singers', A: { zone: 'bv.hand', typeId: 'vocDynCard', pattern: 'cardioid' }, B: { zone: 'bv.hand2', typeId: 'vocDynCard', pattern: 'cardioid' }, variants: ['live'], line: 'Each part on its own mic, far more than 3:1 apart; check the sum in mono.' }],
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    {
      id: 'bv.prac.order',
      page: 'practice',
      prompt: 'Live backing vocals, in order:',
      steps: [
        { text: 'Hear the group: loudest chorus, quietest entrance, consonants', early: 'Start with the singers and the song.' },
        { text: 'Decide: distinct parts, a matched stack, or one blend', early: 'Choose the goal once you have heard them.' },
        { text: 'Set stable stands and secure the cables for their moves', early: 'Make the stage safe before the mics go up.' },
        { text: 'Place each mic at a matched distance from the lips, 3:1 apart', early: 'Place the mics once the stands are safe.' },
        { text: 'Set gain on each singer’s loudest real phrase', early: 'Gain comes once the mics are placed.' },
        { text: 'Bring the wedges up only to the agreed level', early: 'Monitors last, and only as loud as needed.' },
      ],
      explain: 'Hear the group and choose the goal, make the stage safe, place the mics matched and 3:1 apart, set gain on the loudest phrase — and bring the wedges up only to the agreed level.',
    },
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Backing and harmony vocals: a few singers supporting the lead — a tight stack, a natural group blend, or a texture that follows the arrangement.', src: 'LESSON-BV' },
    { title: 'THREE WAYS', text: 'A mic per singer for control; one shared mic for a natural blend the singers make by distance; one or more area mics for a larger group.', src: 'LESSON-BV' },
    { title: 'WHERE YOU MEET IT', text: 'Beside the band on a stage, round one mic at a bluegrass show, in a circle or a stack in the studio.', src: 'S-BLUEGRASS' },
    { title: 'THE SINGERS', text: 'Each part has its own voice: a harmony singer may be quieter, brighter or breathier than the lead. Hear the actual group before choosing mics.', src: 'LESSON-BV' },
  ],
  sound: {
    stages: [
      { title: 'Every mouth, forward', text: 'Each singer’s voice leaves the mouth, forward and round the head — every distance here is read from the lips.' },
      { title: 'Distance is level', text: 'Close to a mic a few centimetres change a voice a lot; at a shared mic, each singer’s distance is their fader.' },
      { title: 'Every mic hears every voice', text: 'An open mic hears the singer beside it too — later and quieter. That is why separate mics are spaced 3:1.' },
    ],
    attack: 'Consonants — P, B, S, T — reach a close mic sharp and early; a singer close and on the axis makes them jump out of the blend. A little angle, distance or a screen keeps them in line.',
    body: 'The sustained vowels of the parts, blended by the singers. Close mics hear each part separately; a shared mic hears the blend they make. Tendencies — voices and rooms vary.',
    head: { diameterMm: 0, rods: 0, label: 'the mouths', strikeSrc: 'LESSON-BV' },
  },
  setting: {
    items: [
      { id: 'singers', label: 'the singers’ feet, faces and moves', short: 'SINGERS', note: 'Stable stands and secured cables so the singers can move without tripping or striking a mic; known approach and exit paths at a shared mic.', prov: { kind: 'sourced', src: 'LESSON-BV', quote: 'Use stable stands and secure cables so singers can move without tripping (L71)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'neighbour', label: 'the singer beside each mic', short: 'NEIGHBOURS', note: 'Every open mic hears the next singer too — later and quieter. Space separate mics at least three times their distance to their own singers apart.', prov: { kind: 'sourced', src: 'S-CHOIR', quote: 'a second microphone should be placed three times the distance from the first microphone as the first microphone distance is from the sound source' }, tag: 'SPILL', scene: 'all' },
      { id: 'wedge', label: 'the wedges', short: 'WEDGES', note: 'In front of each singer, facing back: behind a handheld aimed at the mouth — a cardioid rejects it straight behind, a supercardioid well to one side of its rear.', prov: { kind: 'sourced', src: 'S-VOC-TIPS', quote: 'monitor directly in front of the vocalist (cardioid); slightly to one side (hypercardioid)' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'band', label: 'the band and the PA', short: 'BAND · PA', note: 'The drums and amps reach every backing mic: close, directional mics keep the voices ahead of them.', prov: { kind: 'sourced', src: 'LESSON-BV', quote: 'Live backing vocals need enough direct-to-stage ratio to compete with instruments while preserving feedback margin (L36)' }, tag: 'SPILL', scene: 'stage' },
      { id: 'phones', label: 'the headphone mix', short: 'HEADPHONES', note: 'The same reference for every singer, loud enough to stay in tune without shouting — and not leaking into a close mic.', prov: { kind: 'sourced', src: 'LESSON-BV', quote: 'Give each singer the same reference track and enough headphone level to stay in tune without shouting (L32)' }, tag: 'SPILL', scene: 'studio' },
      { id: 'room', label: 'the room', short: 'ROOM', note: 'A shared mic or an omni circle hears the room as much as the singers: use one that flatters them, quiet.', prov: { kind: 'sourced', src: 'LESSON-BV', quote: 'Use a quiet, flattering room (L33)' }, tag: 'PART OF THE SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: close, directional mics, matched, 3:1 apart, the wedges where the patterns reject most; the fewest open mics; mute and unmute to compare the natural group with the reinforced one — and never provoke feedback.',
    studio: 'A STUDIO: a matched, repeatable stack — the same mic, distance, screen and position for each part — or one shared mic or circle in a quiet, flattering room.',
  },
  diagnostic,
  practice: {
    task: 'With a trio: compare a mic each with one shared mic on the same passage, and check the mono sum. Rehearse a shared-mic movement plan — back for a loud line, in for a quiet one — keeping the grille and the cable safe. With the singers’ agreement, log what you tried below.',
    fields: [
      { id: 'group', label: 'The group and the goal: distinct, stack, or blend', kind: 'text' },
      { id: 'way', label: 'Approach', kind: 'choice', choices: ['a mic each', 'one shared mic', 'an area mic', 'an omni circle', 'two cardioids back to back'] },
      { id: 'dist', label: 'Distances from the lips, and the mics’ spacing (3:1?)', kind: 'text' },
      { id: 'moves', label: 'The moves rehearsed, and the marks on the floor', kind: 'text' },
      { id: 'notes', label: 'What you heard: balance, blend, mono (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'Three singers 1.1 m apart in the row, the shared arc’s radius 40 cm and the studio circle’s 50 cm are drawing defaults (no source gives them).', dims: [] },
    { text: `The handhelds are drawn about ${Math.round(E02_31.rA / 10)} cm from the lips (inside 1.5–3 in); the row’s mics ${(E02_31.d / 1000).toFixed(1)} m apart, so 3:1 holds with a wide margin (≈ ${E02_31.ratio.toFixed(0)}:1).`, dims: [] },
    { text: 'The group mic over the row is drawn 0.75 m in front and 0.45 m above the heads (inside the 2–4 ft and 1–3 ft choral rows); the shared mic’s height within ±10 cm of the mouths is the lab’s drawing.', dims: [] },
    { text: 'The singers are the shared adult figure (lips 1550 mm above the floor); a wedge 0.9 m in front of the middle singer is a drawing default.', dims: [] },
  ],
  live: { wedges: E02_WEDGES },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. Decide first what the backing parts should sound like; a mic each gives control, one shared mic gives a blend the singers make by distance. Every group, song and room is different: rehearse, experiment and trust your ears. The lab is silent and draws a simplified picture: typical standing singers, ideal patterns, straight paths and distances read from the drawing, measured from the lips. Move a real mic near someone’s face only with their agreement.',
  copy: { words: { ...ensembleWords('backing group'), player: 'singers', reference: 'LIPS', inside: 'among the singers', outside: 'clear of the singers', axis: 'the mouth’s axis', facing: 'facing the singers', shield: 'singers in path' } },
  ensemble: {
    seatings: { live: 'vocal.line', shared: 'vocal.shared', studio: 'vocal.circle' },
    setups: E02_SETUPS,
    placeZones: E02_PLACE,
    worked: { live: 'group', shared: 'shared', studio: 'omni' },
    meet: {
      figureTitle: 'BACKING SINGERS',
      figureBadge: 'From above, as the audience faces them · a typical layout',
      sectionsNote: 'Three backing singers: a high harmony, a middle part and a low harmony. Switch SEATING for a shared mic or a studio circle. Tap a singer.',
      soundNote: 'The arcs show WHERE each voice leaves — the mouth, forward — never how loud. At a shared mic, each singer’s distance from it is their level.',
      mainAt: SHARED_AT['vocal.shared'],
      mainAtBy: { live: GROUP_AT, shared: SHARED_AT['vocal.shared'], studio: SHARED_AT['vocal.circle'] },
      mainRig: { id: 'one', face: 0, tilt: 0, label: 'shared mic' },
    },
    before: [
      { title: 'DECIDE THE SOUND', text: 'Distinct people, a matched stack, a small choir or one texture? The mic plan follows the arrangement and the room, not the stands available.' },
      { title: 'HEAR THE REAL SONG', text: 'The loudest chorus, the quietest entrance, unison consonants, sustained vowels, any moves — who dominates, who turns their head, who also plays.' },
      { title: 'A SAFE, REHEARSED STAGE', text: 'Stable stands, secured cables, room to move; at a shared mic a known working zone with approach and exit paths, rehearsed with the real song.' },
    ],
    safety: 'Stable stands and secured cables so the singers can move without tripping or striking a mic. Lower the channel before moving a live mic; never pass a live handheld. Keep monitors and headphones comfortable — never ask singers to shout over unsafe levels — and never provoke feedback.',
    workedWords: {
      begin: 'After our research, this is where we suggest you begin when singers share a mic: one large condenser at their mouth height, every mouth about the same distance from it — a place to start and rehearse, not a rule. For a row of singers, the group mic sits a little above their heads instead.',
      clearance: 'The stand’s base clear of the singers’ feet and their way in and out; its cable dressed flat, out of the moves.',
      height: 'A shared mic sits at the singers’ mouth height, so every mouth meets its front at the same distance; a little higher, angled down, keeps it out of the breath. A group mic over a row sits a little above the heads, aimed down at the middle singer.',
      forward: 'In the middle of the group, each mouth about the same distance away — 40 cm in this drawing; set the real distance in rehearsal and mark the floor. Nearer one singer, that voice gets louder and bassier.',
      aim: 'Its front toward the middle singer: a cardioid hears the singers round its front, an omni every side. Move the mic or the singers — not just the angle — to change the balance.',
    },
    learnZones: [
      'What you just did, in words. After our research, the blue zones are where we suggest you begin — for a shared mic, in the middle at the mouths’ height or a little higher; for a group mic over a row, about 0.6–1.2 m (2–4 ft) in front and a little above the heads. Places to start and rehearse, not a best place.',
      'At a shared mic, every centimetre toward one singer is level for that singer: the NEAR / FAR readout is the balance the mic hears. Match the distances, then let the singers do the mixing.',
      'Change one thing at a time — the height, then the distance — and mark the stand height and the singers’ places on the floor once it works.',
    ],
  },
};
