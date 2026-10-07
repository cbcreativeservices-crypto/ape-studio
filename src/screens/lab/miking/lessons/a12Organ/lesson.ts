/**
 * A12 ACOUSTIC PIPE ORGAN — the lesson as DATA. Words from the owner's
 * lesson (docs/labs/miking/source_text/Acoustic-Pipe-Organ-Miking-
 * Technique.txt; "L<n>" in comments only), research in
 * docs/labs/miking/pipe_organ/, corrections in CORRECTIONS_LOG.md (ORG-01 …).
 * Owner ruling 2026-10-04: suggested starting points, no sources, brands or
 * badges on screen. FULLY SILENT: the pipes and the room are shown, never
 * played. The electronic organ and its rotary speaker are the Amplified
 * speakers & Leslie module's (a link, no copy); the full choir-and-organ
 * setup belongs to Lab 5 (named in words only).
 */
import type { DiagnosticItem, Lesson, MikingScenario, LessonPages, PageContent, SourcePageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, cardioidNull, POWER_REASON, polarityKeepsDelay } from '../shared/metal/metalItems.ts';
import { metalWords } from '../shared/metal/metalCopy.ts';
import { firstNotch, gainCheck, hearingCheck, louderIsNotBetter, monoSymptom, moveRemovesDelay, quickHearing, setupOrder, type ReedWords } from '../shared/freereed/freeReedItems.ts';
import { A12_MODEL, A12_WEDGES, A12_ZONES } from './geometry.ts';

const W: ReedWords = { p: 'org', the: 'the organ', player: 'organist', loudest: 'full organ' };
const MW = { ...W, tail: 'the decay' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the pipe organ',
    goal: 'Get to know the pipe organ — its divisions, where you meet it, what it does in the music and how big it is — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A room-sized instrument: ranks of pipes grouped into divisions — Great, Swell, Pedal, Positive, sometimes one far away — played from a console. A distributed source, heard together with its room.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how pipes speak — why an open and a stopped pipe differ, and why 16′ and 32′ name a pitch — how the divisions arrive at a listener at different times, and how the room shapes the pedal notes. Shown, never played.',
    credit: { scenarios: ['org.snd.1', 'org.snd.2', 'org.snd.3'], interactive: 'soundPath', note: 'Listen from all three positions on the second step, and answer the three checks.' },
    takeaway: 'Each pipe is an air column: open sounds about c ÷ 2L, stopped an octave lower. The divisions sound from different places and arrive at different times; the room’s low resonances make the pedal change over a short move.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the room — the case, the console, the pews, the aisles and exits kept clear, a far gallery, the PA in a service — and what to do before any mic.',
    credit: { scenarios: ['org.set.1', 'org.set.hear', 'org.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Meet the organist and the venue first; hear soft stops, full organ and the lowest pedal; decide whether it is a recording, a stream or local PA. Floor stands where nobody walks; anything elevated is the venue’s installation. Protect hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose mics and a stereo method by their properties for the room and the pipes’ spread — omni or wide cardioid, coincident, near-coincident or spaced — not by brand.',
    credit: { scenarios: ['org.mic.1', 'org.mic.2', 'org.mic.3', 'org.mic.4', 'org.rec.1'], note: 'Answer the five checks (one reaches back to how the organ sounds).' },
    takeaway: 'Omni takes in the room with the organ; a wide cardioid helps when the room or the bass is less favourable. A coincident pair keeps the mono sum robust; a spaced pair is wider and needs a mono check. Headroom for full organ first.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — a main pair over the congregation aimed at the main ranks — then compare a case study’s position and a division spot, all from safe floor stands.',
    credit: { scenarios: ['org.place.1', 'org.place.2', 'org.place.3', 'org.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the aisles, the exits and the organ, in two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'The main pair in the body of the room is the organ’s sound; walk, listen and compare positions — the pedal changes over short moves. A division spot is a local view for a stated need, under the pair. No universal distances.',
  },
  context: {
    title: 'Stream, PA or recording',
    goal: 'Aim a division spot so its rejection faces a PA loudspeaker — and know what a stream, local PA and a recording each ask of the mics.',
    credit: { scenarios: ['org.ctx.1', 'org.ctx.2', 'org.ctx.studio', 'org.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the spot (or change its pattern) until the PA loudspeaker sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Recording: one coherent main pair. Stream: a room pair for scale, separate closer feeds for control. Local PA: only if needed, from local spots, never a distant room pair at high gain. Keep the feeds on separate channels.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'A main pair and a division spot: see each division’s delay between them, what polarity does and does not change, and judge the pair in mono.',
    credit: { scenarios: ['org.two.1', 'org.two.2', 'org.two.3', 'org.two.4'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Mains and spots hear each division at different times: a polarity flip or a fixed delay may help one registration and hurt another. Move or rebalance first; check soft and full registrations in mono.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Position and the room first: the pedal’s peaks and dips, the divisions’ balance, room against attack, a spot over the pair, noise sources, PA routing — before EQ. Lower the level at the first sign of feedback.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up a main pair in the right order, choose and justify a setup for two different briefs, and say what would justify a spot.',
    credit: { scenarios: ['org.prac.order', 'org.prac.gain', 'org.prac.setup1', 'org.prac.setup2', 'org.prac.3', 'org.mix.1', 'org.mix.2', 'org.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'Meet the organist and the venue, walk and listen, place one coherent main pair from a safe floor stand, leave headroom for full organ, add a spot only for a stated need, and keep stream and PA routing apart.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L6-L7, L27 · set L7, L39-L40 · mic L28, L30 · place L27, L33-L35, L40 ·
 * ctx L36-L38 · two L35 · prac L30-L35, L68-L71. */
const scenarios: MikingScenario[] = [
  {
    id: 'org.snd.1',
    page: 'sound',
    prompt: 'A stop is labelled 16′. What does that tell you for sure?',
    options: ['Its pitch: the pipes may be shorter than 16 ft', 'Each one of its pipes is exactly 16 feet long', 'It is the loudest stop that the whole organ has'],
    correct: 'Its pitch: the pipes may be shorter than 16 ft',
    explain: 'The label names the pitch of an open pipe of that length. A stopped pipe sounds an octave lower than an open one of the same length, so a stopped 16′ stop is only about 8 ft long. Verify the real low range by ear.',
    why: {
      'Each one of its pipes is exactly 16 feet long': 'Only the lowest open pipe would be near that; stopped pipes are about half as long.',
      'It is the loudest stop that the whole organ has': 'The label is about pitch, not loudness.',
    },
  },
  {
    id: 'org.snd.2',
    page: 'sound',
    prompt: 'Why can’t a mic a few centimetres from one pipe stand for the organ?',
    options: ['It hears that pipe, not the divisions and room', 'Pipes are far too loud for a mic placed that close', 'A pipe makes no sound near its own mouth'],
    correct: 'It hears that pipe, not the divisions and room',
    explain: 'The organ sounds from many ranks in several places, and a listener hears them with the room. A mic beside one pipe hears a local view.',
    why: {
      'Pipes are far too loud for a mic placed that close': 'Level is not the issue; a close mic hears one local source.',
      'A pipe makes no sound near its own mouth': 'The mouth is where it speaks — that is exactly why a close mic hears only it.',
    },
  },
  {
    id: 'org.snd.3',
    page: 'sound',
    prompt: 'Moving the pair two steps, the pedal notes nearly vanish. Most likely?',
    options: ['A low-frequency peak or dip of the room', 'The mic itself is faulty in the lowest notes', 'The organist changed the registration'],
    correct: 'A low-frequency peak or dip of the room',
    explain: 'The room’s low resonances make the pedal swing strongly in some places and stay still in others; a short move can change it a lot. Compare nearby safe positions.',
    why: {
      'The mic itself is faulty in the lowest notes': 'It worked two steps away: the room changed, not the mic.',
      'The organist changed the registration': 'Keep the same registration while you compare positions.',
    },
  },
  {
    id: 'org.set.1',
    page: 'setting',
    prompt: 'Before placing any mic, who do you meet?',
    options: ['The organist and the venue’s staff', 'Only the sound team for the stream', 'Nobody: floor stands need no approval'],
    correct: 'The organist and the venue’s staff',
    explain: 'The organist knows the stops, divisions and routing; the venue controls the lofts, galleries, chambers and historic fixtures — and when the room is in use.',
    why: {
      'Only the sound team for the stream': 'The organist and the venue hold the knowledge and the access.',
      'Nobody: floor stands need no approval': 'Stand positions, aisles and exits are the venue’s to agree.',
    },
  },
  hearingCheck(W),
  {
    id: 'org.set.2',
    page: 'setting',
    prompt: 'A beam above the nave looks perfect for hanging a pair. What do you do?',
    options: ['Ask the venue: competent people, rated supports', 'Hang it carefully from the beam yourself', 'Tie it to the organ case instead, which is strong'],
    correct: 'Ask the venue: competent people, rated supports',
    explain: 'Any suspended mic or work at height needs venue approval and competent people using the site’s rated supports and fall protection. Never an unverified beam, never the organ.',
    why: {
      'Hang it carefully from the beam yourself': 'An unverified beam and work at height are not yours to decide.',
      'Tie it to the organ case instead, which is strong': 'Never hang anything from pipes, the case or its ornament.',
    },
  },
  {
    id: 'org.mic.1',
    page: 'microphone',
    prompt: 'Which stereo method keeps the most robust mono sum?',
    options: ['A coincident pair, the capsules together', 'A widely spaced pair of omni mics on stands', 'Two spots on the opposite Pedal towers'],
    correct: 'A coincident pair, the capsules together',
    explain: 'A coincident pair (X/Y or M/S) hears each source at almost the same instant in both mics: a clear centre and a robust mono sum. A spaced pair is wider and needs a mono check.',
    why: {
      'A widely spaced pair of omni mics on stands': 'Spacing adds time differences that can comb in mono.',
      'Two spots on the opposite Pedal towers': 'Two far-apart spots are not a stereo pair, and they comb in mono.',
    },
  },
  {
    id: 'org.mic.2',
    page: 'microphone',
    prompt: 'Why choose omni for the main pair in a fine-sounding room?',
    options: ['It includes the room with the organ', 'It rejects the congregation’s noise', 'It needs no phantom power at all'],
    correct: 'It includes the room with the organ',
    explain: 'Omni includes the room’s sound with the organ — useful when the room is part of the music. It also hears the congregation and the ventilation.',
    why: {
      'It rejects the congregation’s noise': 'An omni rejects nothing; it hears all round.',
      'It needs no phantom power at all': 'Power depends on the transducer, not the pattern.',
    },
  },
  {
    id: 'org.mic.3',
    page: 'microphone',
    prompt: 'The room, or its bass balance, is less favourable. What pattern might help?',
    options: ['A wide cardioid, taking in less of the room', 'An omni, to hear even more of the room', 'A figure-eight pair, facing the two side walls'],
    correct: 'A wide cardioid, taking in less of the room',
    explain: 'A wide cardioid narrows the view a little — less room, a different low balance — when the room is not helping.',
    why: {
      'An omni, to hear even more of the room': 'More room is the opposite of what a poor room needs.',
      'A figure-eight pair, facing the two side walls': 'Its lobes would hear the walls’ reflections, not the organ.',
    },
  },
  {
    id: 'org.mic.4',
    page: 'microphone',
    prompt: 'Before the first full-organ chord, what do you check?',
    options: ['Max SPL, pad and phantom for the exact mics', 'That the mics match the colour of the case', 'Nothing: an organ is quiet at a distance'],
    correct: 'Max SPL, pad and phantom for the exact mics',
    explain: 'Set input gain with full organ and the most forceful attack, leaving headroom — and check each mic’s rating, pad and power for the exact model.',
    why: {
      'That the mics match the colour of the case': 'Looks do not matter; headroom and power do.',
      'Nothing: an organ is quiet at a distance': 'Full organ is loud even far down the nave; check the headroom.',
    },
  },
  {
    id: 'org.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Close to the Great, how do the other divisions arrive?',
    options: ['Later and quieter than the Great', 'At the same instant as the Great', 'Before the Great, because they are taller'],
    correct: 'Later and quieter than the Great',
    explain: 'A spot near one division hears it first and loudest; the others arrive later, from farther away — a narrower view of the organ.',
    why: {
      'At the same instant as the Great': 'They are farther away, so their sound takes longer.',
      'Before the Great, because they are taller': 'Height does not speed sound up; distance sets the time.',
    },
  },
  {
    id: 'org.place.1',
    page: 'placement',
    prompt: 'The case study’s fourth-pew position: how do you use it?',
    options: ['As a case study: walk and listen in your room', 'As the distance to use for each organ you mic', 'As the place where pedal notes are strongest'],
    correct: 'As a case study: walk and listen in your room',
    explain: 'It is where one search ended, for one organ and one room, after many moves. It shows the method — walk, listen, compare — not a distance.',
    why: {
      'As the distance to use for each organ you mic': 'Every organ and room differs; it is a case study, not a placement rule.',
      'As the place where pedal notes are strongest': 'The pedal changes over short moves in any room; check it where you are.',
    },
  },
  {
    id: 'org.place.2',
    page: 'placement',
    prompt: 'Your best pair position is in the middle of an aisle. What now?',
    options: ['Move to a clear pew row, and compare', 'Use it, with a sign asking people to step round', 'Tape the stand’s legs down and keep it there'],
    correct: 'Move to a clear pew row, and compare',
    explain: 'Aisles, exits and the wheelchair route stay clear. Find the nearest clear position and compare it — or arrange a qualified elevated installation with the venue.',
    why: {
      'Use it, with a sign asking people to step round': 'A stand in an aisle blocks an exit route; a sign does not make it clear.',
      'Tape the stand’s legs down and keep it there': 'Taped down, it still blocks the aisle.',
    },
  },
  {
    id: 'org.place.3',
    page: 'placement',
    prompt: 'When does a division spot earn its place?',
    options: ['To solve a stated balance or separation need', 'At each service, with one per division', 'Whenever there are spare channels on the desk'],
    correct: 'To solve a stated balance or separation need',
    explain: 'Bring spots up under the main pair only enough to solve the stated problem, then recheck both sides, soft and full registrations and the mono sum.',
    why: {
      'At each service, with one per division': 'More spots mean more delays and noise; each must have a reason.',
      'Whenever there are spare channels on the desk': 'A spare channel is not a reason; a balance problem is.',
    },
  },
  {
    id: 'org.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · An antiphonal division sits at the far end. Can the main pair still hear it?',
    options: ['Yes — from the body of the room, it can', 'No — only a spot beside it can hear it', 'No, the main pair hears only the façade'],
    correct: 'Yes — from the body of the room, it can',
    explain: 'A pair in the body of the room hears the organ from wherever it sounds — including a far division. A spot on the main case cannot.',
    why: {
      'No — only a spot beside it can hear it': 'A spot would add control, but the main pair hears it too.',
      'No, the main pair hears only the façade': 'The pair hears the whole room, divisions far and near.',
    },
  },
  {
    id: 'org.ctx.1',
    page: 'context',
    prompt: 'A service: should the distant room pair feed the room’s own PA?',
    options: ['Not at high gain: it is for the stream or recording', 'Yes — it carries the organ to the whole room', 'Yes, as loud as the PA allows before feedback'],
    correct: 'Not at high gain: it is for the stream or recording',
    explain: 'A distant room pair hears the PA too; sending it back into the same room at high gain invites feedback and wash. Keep it for the stream or recording; reinforce only if needed, from local spots.',
    why: {
      'Yes — it carries the organ to the whole room': 'The organ already fills the room; the pair would feed the PA back to itself.',
      'Yes, as loud as the PA allows before feedback': 'Never work at the edge of feedback; lower levels and fix the routing.',
    },
  },
  {
    id: 'org.ctx.2',
    page: 'context',
    prompt: 'For local PA, why use division spots rather than the room pair?',
    options: ['More gain before feedback, from closer pickup', 'They capture a much wider view of the whole organ', 'They need no feedback checks at all'],
    correct: 'More gain before feedback, from closer pickup',
    explain: 'Local spots hear the organ strongly relative to the PA, giving more gain before feedback — at the cost of a narrower view.',
    why: {
      'They capture a much wider view of the whole organ': 'It is the other way round: a spot’s view is narrower.',
      'They need no feedback checks at all': 'Every PA feed needs a careful, low start and a check through the audience area.',
    },
  },
  {
    id: 'org.ctx.studio',
    page: 'context',
    prompt: 'STUDIO · A solo organ recording. Where do you start?',
    options: ['One coherent main pair at a listening position', 'A spot on each division, all mixed together', 'A single mic placed inside the Swell’s box'],
    correct: 'One coherent main pair at a listening position',
    explain: 'A balanced main pair is the organ’s sound; adjust it for the pipes’ layout and the room. Add spots only for a stated need.',
    why: {
      'A spot on each division, all mixed together': 'Many spots mean many delays, and no room; the pair comes first.',
      'A single mic placed inside the Swell’s box': 'Inside the organ needs the technician’s authorisation — and it hears one division.',
    },
  },
  {
    id: 'org.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Is a stop’s 32′ label a promise of a 32-foot pipe?',
    options: ['No — it names the pitch, not always the length', 'Yes — the label is that pipe’s real, measured length', 'Yes, for each pipe in the Pedal division'],
    correct: 'No — it names the pitch, not always the length',
    explain: 'The labels are pitch conventions: a stopped pipe of half the length sounds the same pitch. Check the real lowest notes by ear before setting any filter.',
    why: {
      'Yes — the label is that pipe’s real, measured length': 'A stopped pipe sounds an octave lower than its length suggests.',
      'Yes, for each pipe in the Pedal division': 'Pedal stops can be stopped pipes too.',
    },
  },
  polarityKeepsDelay(MW),
  firstNotch(W),
  {
    id: 'org.two.3',
    page: 'twoMic',
    prompt: 'A delay on the Great spot helps one registration and hurts another. Why?',
    options: ['Each division reaches the mics at its own times', 'A delay can only work on one note at a time', 'The spot’s polarity is reversed on some stops'],
    correct: 'Each division reaches the mics at its own times',
    explain: 'Every division has its own path difference between the main pair and the spot, so one delay suits one division at best. Move or rebalance first.',
    why: {
      'A delay can only work on one note at a time': 'A delay works on everything; the paths differ per division.',
      'The spot’s polarity is reversed on some stops': 'Polarity does not change with the stops; the arrival times do.',
    },
  },
  louderIsNotBetter(W),
  gainCheck(W),
  {
    id: 'org.prac.3',
    page: 'practice',
    prompt: 'What would justify adding an organ spot to a service stream?',
    options: ['Independent control the room pair cannot give', 'Spots are the usual standard for a stream', 'More level than the pair can give the stream'],
    correct: 'Independent control the room pair cannot give',
    explain: 'The room pair conveys scale; a closer feed gives independent control for scenes — organ solo, accompaniment, speech — on its own channel.',
    why: {
      'Spots are the usual standard for a stream': 'A spot has to earn its place with a defined need.',
      'More level than the pair can give the stream': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'org.mix.1',
    page: 'practice',
    prompt: 'Choir and organ together: where does the organ’s balance start?',
    options: ['The ensemble’s main pickup, then a modest spot', 'A spot on each division first, then the choir', 'The organ alone, set before the choir arrives'],
    correct: 'The ensemble’s main pickup, then a modest spot',
    explain: 'Start with the ensemble’s main pickup; add a modest organ spot only if the accompaniment needs it, and check the spatial match and the mono sum. (The full setup belongs to the Ensembles Lab.)',
    why: {
      'A spot on each division first, then the choir': 'Spots first loses the shared perspective; the main pickup comes first.',
      'The organ alone, set before the choir arrives': 'The balance is the ensemble’s; set it with everyone playing.',
    },
  },
  cardioidNull(MW),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  {
    id: 'org.s.pedal',
    observation: 'Pedal notes vanish or boom',
    firstChecks: 'Is the position in a low-frequency peak or dip of the room, or is a filter active? Compare nearby safe floor positions; verify the filter, a full passage and the monitoring.',
    options: ['Compare nearby positions; check the filter', 'Boost the lows on the desk until they return', 'Ask the organist to add more pedal stops'],
    correct: 'Compare nearby positions; check the filter',
    explain: 'The room’s low resonances change the pedal over short moves; a filter may be removing it. Compare and verify before EQ.',
    why: {
      'Boost the lows on the desk until they return': 'A boost fights a room dip and makes peaks boom; move first.',
      'Ask the organist to add more pedal stops': 'The registration is the music; the position is the problem.',
    },
  },
  {
    id: 'org.s.div',
    observation: 'One division dominates',
    firstChecks: 'Is a mic too close to that pipe group or aimed away from the others? Map the divisions; move the main pair or add a restrained, targeted spot.',
    options: ['Map the divisions; move the pair, or a spot', 'Ask the organist to play that division less', 'Cut that division’s range with EQ'],
    correct: 'Map the divisions; move the pair, or a spot',
    explain: 'Find where each division sounds; a pair too near one favours it. Move the pair, or add a restrained spot for the one that is missing.',
    why: {
      'Ask the organist to play that division less': 'The registration is the music; fix the balance in the placement.',
      'Cut that division’s range with EQ': 'EQ cannot separate divisions that share a range.',
    },
  },
  {
    id: 'org.s.distant',
    observation: 'Distant and indistinct',
    firstChecks: 'Is the room’s decay obscuring the attacks? Move the main pair cautiously closer, or compare a more directional pattern.',
    options: ['Move the pair cautiously closer; compare pattern', 'Add reverb so that the organ sounds bigger', 'Raise the gain until the attacks come through'],
    correct: 'Move the pair cautiously closer; compare pattern',
    explain: 'Closer, or a more directional pattern, gives the attacks more weight against the room’s decay.',
    why: {
      'Add reverb so that the organ sounds bigger': 'It is already too much room; reverb adds more.',
      'Raise the gain until the attacks come through': 'Gain raises the decay as much as the attack.',
    },
  },
  {
    id: 'org.s.dry',
    observation: 'Dry or local',
    firstChecks: 'Is a spot dominating the main pair? Restore the room perspective and rebalance.',
    options: ['Bring the room back: lower the spot', 'Move the spot even closer to the pipes', 'Add a short delay to the main pair'],
    correct: 'Bring the room back: lower the spot',
    explain: 'The main pair is the organ’s sound; spots only add to it. Lower the spot until the room returns.',
    why: {
      'Move the spot even closer to the pipes': 'Closer makes it drier still.',
      'Add a short delay to the main pair': 'A delay does not restore the room’s perspective; the balance does.',
    },
  },
  monoSymptom(W),
  {
    id: 'org.s.noise',
    observation: 'Blower or traffic audible',
    firstChecks: 'Does the noise come from the room or a local outlet? Identify the source with the organist; adjust the position, and schedule where possible.',
    options: ['Find the source; adjust position or timing', 'Gate the room pair between the phrases', 'High-pass everything well above the pedal'],
    correct: 'Find the source; adjust position or timing',
    explain: 'Find where the noise comes from — the blower, the action, the street — with the organist; move away from it or schedule round it.',
    why: {
      'Gate the room pair between the phrases': 'A gate cuts the room’s decay — the organ’s own sound.',
      'High-pass everything well above the pedal': 'That removes the pedal, and blower noise is not only low.',
    },
  },
  {
    id: 'org.s.pa',
    observation: 'PA feedback or wash',
    firstChecks: 'Are room mics routed to the local PA too loudly? Lower the level immediately; revise the routing and the geometry.',
    options: ['Lower the level; revise routing and geometry', 'Add the room pair to the PA for more organ', 'Notch the ringing frequency and turn it up'],
    correct: 'Lower the level; revise routing and geometry',
    explain: 'Lower the level at once; keep the distant room pair out of the room’s PA, and fix the loudspeaker and mic geometry.',
    why: {
      'Add the room pair to the PA for more organ': 'A distant pair feeding the same room’s PA is a feedback loop.',
      'Notch the ringing frequency and turn it up': 'A notch is not a substitute for routing and geometry.',
    },
  },
];

const PAIR_REASON: SetupReason = { id: 'r.pair', label: 'It is the listener’s perspective: a main pair in the body of the room', role: 'required', feedback: 'Say why it represents the organ: all divisions with the room.' };
const ACCESS_REASON: SetupReason = { id: 'r.access', label: 'A safe floor stand, clear of aisles, exits and the organ', role: 'required', feedback: 'Safe access is part of every passing setup.' };
const ROUTE_REASON: SetupReason = { id: 'r.route', label: 'Stream and PA feeds are kept apart', role: 'optional', feedback: 'A fair reason: the room pair for the stream, local spots only for a PA.' };
const TOUCH_REASON: SetupReason = { id: 'r.touch', label: 'A mic among the pipes is closest to the real sound', role: 'wrong', feedback: 'Inside the organ is a local view — and needs the technician’s authorisation.' };

const setupTasks: SetupTask[] = [
  {
    id: 'org.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A solo organ recording in an empty church with a fine acoustic. Phantom power is available.',
    setups: [
      { id: 'a', label: 'An omni pair in a clear pew row about 11 m out, aimed at the main ranks, after listening', ok: true, power: 'phantom', feedback: 'The listener’s perspective with the room; it needs the phantom this channel has.' },
      { id: 'b', label: 'A coincident cardioid pair over the congregation, compared at two positions', ok: true, power: 'phantom', feedback: 'A robust stereo image; fair if the room is less helpful.' },
      { id: 'c', label: 'A mic hung from the façade’s ornament', ok: false, power: 'phantom', feedback: 'Never hang anything from the organ.' },
      { id: 'd', label: 'A stand in the middle of the main aisle', ok: false, power: 'phantom', feedback: 'Aisles and exits stay clear.' },
      { id: 'e', label: 'A spot on every division and no main pair', ok: false, power: 'phantom', feedback: 'No room, many delays: the main pair comes first.' },
    ],
    reasons: [PAIR_REASON, ACCESS_REASON, POWER_REASON, ROUTE_REASON, BRAND_REASON, TOUCH_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: the listener’s perspective, from a safe floor stand, with the power the mics need.',
  },
  {
    id: 'org.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A streamed service with a PA for speech; the congregation fills the pews. Every input has phantom power.',
    setups: [
      { id: 'a', label: 'A room pair for the stream only, plus a Great spot on its own channel', ok: true, power: 'phantom', feedback: 'Scale from the pair, control from the spot — each on its own channel.' },
      { id: 'b', label: 'A room pair for the stream, the organ kept out of the PA', ok: true, power: 'phantom', feedback: 'Fair: the organ fills the room; the PA carries speech.' },
      { id: 'c', label: 'The distant room pair sent to the PA at high gain', ok: false, power: 'phantom', feedback: 'A feedback loop and a wash: never at high gain.' },
      { id: 'd', label: 'Stands in the aisles for a better view', ok: false, power: 'phantom', feedback: 'The aisles and exits are in use during a service.' },
      { id: 'e', label: 'A pair suspended from a ceiling hook, put up by yourself', ok: false, power: 'phantom', feedback: 'Elevated rigging is the venue’s installation, by competent people.' },
    ],
    reasons: [PAIR_REASON, ACCESS_REASON, { id: 'r.sep', label: 'Stream and PA feeds are kept on separate channels', role: 'required', feedback: 'Separate channels let you build scenes and keep the room pair out of the PA.' }, POWER_REASON, BRAND_REASON, TOUCH_REASON],
    explain: 'Two setups pass. What passes is the reasoning: the room pair for scale, safe access, and stream and PA kept apart.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you look: close to the Great, how do the other divisions arrive?', options: ['Later', 'At the same moment', 'Earlier'], after: 'Now try the pipes, then LISTEN AT all three positions and watch the arrival times.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the pair from the fourth pew to the back. What changes most?', options: ['More room, a blended organ', 'More attack', 'Nothing'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The PA sits high on the arch, behind the spot mic. Can a pattern’s null reach it?', options: ['Yes — aim the rejection toward it', 'No — only an omni can', 'It is directly in front'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'A main pair and a Great spot. If you flip B’s polarity, what happens to Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE to another division.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'org.q.1',
    covers: 'instrument',
    prompt: 'Why is a pipe organ called a distributed source?',
    options: ['Its divisions sound from different places', 'Its sound spreads out from the console', 'Its pipes take turns to sound, one by one'],
    correct: 'Its divisions sound from different places',
    explain: 'Ranks grouped into divisions stand in towers, boxes, galleries — sometimes at opposite ends of the room. A single close mic hears one of them.',
    why: {
      'Its sound spreads out from the console': 'The console is where it is played; the pipes are where it sounds.',
      'Its pipes take turns to sound, one by one': 'Many pipes sound at once; the point is that they are in many places.',
    },
  },
  {
    id: 'org.q.2',
    covers: 'instrument',
    prompt: 'What do the Swell’s shutters do?',
    options: ['Open and close to make it louder or softer', 'Keep the dust out while the organ is switched off', 'Turn the pipes toward the congregation'],
    correct: 'Open and close to make it louder or softer',
    explain: 'The Swell’s pipes stand in a box; the organist opens and closes its shutters to swell and soften it. Note where a swell shutter opens before aiming anything.',
    why: {
      'Keep the dust out while the organ is switched off': 'They move while it plays — that is the swell.',
      'Turn the pipes toward the congregation': 'The pipes stay put; the shutters open the box.',
    },
  },
  {
    id: 'org.q.3',
    covers: 'sound',
    prompt: 'Two pipes of the same length: one open, one stopped. What do you hear?',
    options: ['The stopped one an octave lower', 'The same pitch from both of them', 'The stopped one an octave higher'],
    correct: 'The stopped one an octave lower',
    explain: 'An open pipe sounds about c ÷ 2L, a stopped one about c ÷ 4L — an octave lower for the same length.',
    why: {
      'The same pitch from both of them': 'The cap changes the air column: the stopped pipe sounds lower.',
      'The stopped one an octave higher': 'It is the other way round: lower.',
    },
  },
  {
    id: 'org.q.4',
    covers: 'sound',
    prompt: 'Why can a short move change the pedal notes a lot?',
    options: ['The room’s low resonances vary from place to place', 'Pedal pipes aim their sound in one narrow, tight beam', 'The organist changes the pedal stops as you move'],
    correct: 'The room’s low resonances vary from place to place',
    explain: 'Near a low note the room swings strongly in some places and stays still in others; a couple of steps can change the pedal a lot.',
    why: {
      'Pedal pipes aim their sound in one narrow, tight beam': 'Low notes spread widely; it is the room that varies.',
      'The organist changes the pedal stops as you move': 'Keep the registration the same while you compare.',
    },
  },
  {
    id: 'org.q.5',
    covers: 'setting',
    critical: true,
    prompt: 'A good position can’t be reached safely from the floor. What do you do?',
    options: ['Use a floor position or a qualified install', 'Climb the case carefully to reach the spot', 'Hang the mic from the nearest pipe or ornament'],
    correct: 'Use a floor position or a qualified install',
    explain: 'Stop if a placement cannot be achieved safely: choose a floor position, or arrange a qualified installation with the venue later. Never climb or hang anything from the organ.',
    why: {
      'Climb the case carefully to reach the spot': 'Work at height needs approval, competent people and rated supports — and never the organ.',
      'Hang the mic from the nearest pipe or ornament': 'Never hang anything from pipes or ornament.',
    },
  },
  quickHearing(W),
];

export const A12_LESSON: Lesson = {
  id: 'A12',
  labId: 'winds',
  title: 'Acoustic Pipe Organ',
  subtitle: 'A room-sized instrument: the main pair, a division spot, the stream and the PA',
  noun: { one: 'pipe organ', many: 'pipe organs' },
  model: A12_MODEL,
  micTypeIds: ['sdcCard', 'sdc'],
  zones: A12_ZONES,
  setupPairs: [{ label: 'The main pair and a spot on one division', A: { zone: 'org.cong', typeId: 'sdcCard' }, B: { zone: 'org.div', typeId: 'sdcCard' } }],
  pages,
  scenarios,
  symptoms,
  orderTasks: [setupOrder(W, { text: 'Meet the organist and the venue; hear the stops, full organ and the pedal', early: 'Start with the people who know the organ and the room.' })],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Many sets of pipes — ranks — grouped into divisions, played from the console’s keyboards and pedals and blown by a wind supply. A distributed source: it sounds from several places at once.', src: 'OHS-RANK' },
    { title: 'WHERE YOU MEET IT', text: 'In churches, concert halls and other large rooms — for services, concerts, recordings and streams. It is usually recorded or broadcast rather than amplified in the same room.', src: 'S-HOW' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Everything from the softest single stop to full organ, with pedal notes far below the voices; it plays alone, or accompanies choirs, congregations and instruments.', src: 'LESSON-ORG' },
    { title: 'ITS SIZE', text: 'Room-sized. This lab draws a stylised case 8 m wide and 10 m high in a 30 m nave. Stop labels such as 16′ and 32′ name a pitch, not always a pipe’s length.', src: 'OHS-PIPES' },
  ],
  sound: {
    stages: [
      { title: 'Wind', text: 'A blower fills the wind chests; pressing a key with a stop drawn lets the wind into one pipe of each chosen rank.' },
      { title: 'The pipe speaks', text: 'At the mouth, the wind sets the air column inside the pipe swinging: its length sets the pitch — open about c ÷ 2L, stopped about c ÷ 4L.' },
      { title: 'Many places', text: 'The divisions stand in different places — towers, a shuttered box, a division in front, sometimes one far away — so their sounds arrive at a listener at different times.' },
      { title: 'The room answers', text: 'The direct sound, the early reflections and the long reverberation together are what a listener hears — and the room’s low resonances shape the pedal.' },
    ],
    attack: 'A pipe’s speech: the brief start as its air column builds up — crisp on some stops, soft on others — then the room’s first reflections. A closer view hears more of it.',
    body: 'The sustained sound of every division blended in the room, and the long decay after the last chord. A distant pair hears more of the blend and the decay; a spot, more of one division. Tendencies — organs and rooms vary.',
    head: { diameterMm: 8000, rods: 0, label: 'a stylised organ case', strikeSrc: 'S-HOW' },
  },
  setting: {
    items: [
      { id: 'case', label: 'the organ case and its divisions', short: 'ORGAN', note: 'The main case with its divisions. Never touch the pipes, the shutters, the panels, the wiring or the blower; never hang anything from it. Access to the loft and the chambers is the venue’s to give.', prov: { kind: 'illustrative', reason: 'a stylised layout' }, tag: 'NEVER TOUCH', scene: 'all' },
      { id: 'console', label: 'the console and the organist', short: 'CONSOLE', note: 'The organist’s keyboards and stops, in the chancel. Keep stands and cables clear of the console, the organist and their way in and out.', prov: { kind: 'illustrative', reason: 'a detached console: a drawing default' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'pews', label: 'the pews', short: 'PEWS', note: 'Where the congregation sits — and where a main pair usually listens from, on a stand in a clear row. In a service, only where the venue agrees.', prov: { kind: 'illustrative', reason: 'a drawing default' }, tag: 'LISTENING POSITIONS', scene: 'all' },
      { id: 'aisles', label: 'the aisles', short: 'AISLES', note: 'The ways in and out: never a stand or a cable across them.', prov: { kind: 'illustrative', reason: 'a drawing default' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'exits', label: 'the side passages, exits and wheelchair route', short: 'EXITS', note: 'Kept clear at all times, and especially during a service.', prov: { kind: 'illustrative', reason: 'a drawing default' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'gallery', label: 'the rear gallery and its antiphonal division', short: 'GALLERY', note: 'A division at the far end of the room: a spot on the main case cannot hear it; the main pair may. The gallery is the venue’s to open.', prov: { kind: 'sourced', src: 'S-HOW', quote: 'located on opposite sides of the worship facility, as is the case with antiphonal ranks' }, tag: 'A FAR DIVISION', scene: 'all' },
      { id: 'pa', label: 'the PA loudspeakers on the chancel arch', short: 'PA', note: 'In a service the PA carries speech. Room mics hear it too: never send a distant room pair back into it at high gain.', prov: { kind: 'illustrative', reason: 'a typical position: a drawing default' }, tag: 'FEEDBACK', scene: 'stage' },
    ],
    stage: 'A SERVICE: the congregation in the pews, the aisles and exits in use, the PA on. A room pair for the stream, separate closer feeds for control; the organ kept out of the PA unless the room needs it.',
    studio: 'AN EMPTY ROOM: time to walk and listen. Compare main-pair positions over soft, bright and full registrations and the lowest pedal; check the quiet stops against ventilation and traffic.',
  },
  diagnostic,
  practice: {
    task: 'Meet the organist and the venue, walk and listen, place one coherent main pair from a safe floor stand, leave headroom for full organ, add a spot only for a stated need, and keep stream and PA routing apart. With their agreement, log what you tried below.',
    fields: [
      { id: 'inst', label: 'Organ, divisions and any far division; the room', kind: 'text' },
      { id: 'goal', label: 'What it is for', kind: 'choice', choices: ['recording', 'stream', 'local PA'] },
      { id: 'mic', label: 'Mics, patterns and the stereo method', kind: 'text' },
      { id: 'zone', label: 'Main pair position: distance from the façade, height, across', kind: 'text' },
      { id: 'clear', label: 'Access: aisles, exits, the console, anything elevated', kind: 'text' },
      { id: 'notes', label: 'What you heard: divisions, pedal, room, noise (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The whole organ is a stylised drawing: the case 8 × 10 × 2.5 m, its divisions’ places, the console in the chancel — no particular organ is drawn.', dims: ['caseW', 'caseH', 'caseD'] },
    { text: 'The room is a drawing default: a nave 30 × 15 × 14 m, pews every 1 m from 7.7 m (so the fourth pew is the case study’s 35 ft), aisles at 2.8–3.8 m either side, side passages from 7 m, a rear gallery.', dims: ['naveL', 'naveW', 'naveH', 'firstPew', 'pewPitch', 'pewRows', 'aisleZ0', 'aisleZ1', 'sideZ'] },
    { text: 'Only the case study has numbers (about 35 ft from the pipework, about 8 ft up, midway between the walls). The congregation pair’s band (the pew area, 1.5–3.5 m up) and the division spot’s 3–6 m are the drawing’s own; no universal distance exists.', dims: [] },
    { text: 'The room picture is one lengthwise resonance of an ideal hard-walled nave — illustrative; real rooms mix many, in every direction.', dims: [] },
    { text: 'A near-coincident pair is drawn as 17 cm and 110°; one guide rounds the spacing to six inches (CORRECTIONS_LOG ORG-02).', dims: [] },
  ],
  live: { wedges: A12_WEDGES },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. A pipe organ has no universal mic distance: start with a main pair in the body of the room aimed at the main ranks, walk, listen and compare; the fourth-pew position is one search’s result in one room, shown as a case study. Every organ and room is different: experiment, compare at matched level, and trust your ears. The lab is silent and draws a simplified picture: a stylised organ and church, ideal pipes, straight paths, one ideal room resonance, mic patterns as textbook shapes. Distances are rounded. Floor stands only where people do not walk; anything elevated is the venue’s installation by competent people; never touch or hang anything from the organ; protect hearing.',
  copy: { words: metalWords('organ', 'organist') },
};
