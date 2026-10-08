/**
 * M11 COMPLETE DRUM-KIT SETUPS — the lesson's pages as DATA (blueprint §7).
 * Words from the owner's lesson (docs/labs/miking/source_text/M11-Complete-
 * Drum-Kit-Setups-Miking-Technique.txt, "L<n>" in COMMENTS only), fixes in
 * docs/labs/miking/CORRECTIONS_LOG.md (C11-01 …). Owner ruling 2026-10-04:
 * starting points; no source, brand, model or person's name; no badges. The
 * channel counts describe plans — no number is a recommended count.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, LessonPages, PageContent, SourcePageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { CYMBAL_DRAWING_DEFAULTS } from '../shared/cymbals/cymbalSpec.ts';
import { DRUM_DRAWING_DEFAULTS } from '../shared/drums/drumSpec.ts';
import { M11_MODEL, M11_WEDGES, M11_ZONES } from './geometry.ts';
import { M11_COPY } from './copy.ts';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the whole kit',
    goal: 'Get to know the kit as a set of sources — every drum and cymbal, and the player’s space — before planning any channel.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A complete setup is a coordinated view of kick, snare, toms and cymbals, with any room sound chosen deliberately. The number of mics follows the music, the room and the system.',
  },
  sound: {
    title: 'How the kit reaches every mic',
    goal: 'See how a cymbal sends its sound out, and how every source on the kit reaches every close mic — sooner and louder for its own drum, later and quieter for the rest.',
    credit: { scenarios: ['kt.snd.1', 'kt.snd.2', 'kt.snd.3'], interactive: 'soundPath', note: 'Step the cymbal’s stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'Every open mic hears the whole kit: its own source first and loudest, the rest later and quieter. That bleed is part of every multi-mic setup — to use, or to reduce, never to erase.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the kit around every channel — the sources, the player’s space — and what a stage and a studio add.',
    credit: { scenarios: ['kt.set.1', 'kt.set.2', 'kt.set.3'], note: 'Answer the three checks.' },
    takeaway: 'Write a target before patching, fix the source with the player, and give every channel’s stand, cable and clamp clearance from the whole of the player’s movement.',
  },
  microphone: {
    title: 'Choose the microphones',
    goal: 'Choose a mic for each channel’s role by its properties — pattern, power, size and mount — not by brand.',
    credit: { scenarios: ['kt.mic.1', 'kt.mic.2', 'kt.mic.3', 'kt.mic.4', 'kt.rec.1'], note: 'Answer the five checks (one reaches back to how the kit sounds).' },
    takeaway: 'Each channel’s role sets its mic: a kick mic for weight, small dynamics close to drums; small condensers are common over the cymbals and in the room. Count whatever condensers you choose: each needs phantom power.',
  },
  placement: {
    title: 'Channel plans',
    goal: 'Build a plan in stages — from one whole-kit mic to an extensive setup — and see what each channel costs.',
    credit: { scenarios: ['kt.place.1', 'kt.place.2', 'kt.place.3', 'kt.rec.2'], interactive: 'twoPlans', note: 'Build a plan of four mics or fewer and one of eight or more, and answer the four checks. The worked plan earns nothing on its own.' },
    takeaway: 'Establish the picture first, then add each close mic for a purpose. Count channels, stands, inputs and bleed — an optional channel is not automatically an improvement, and the counts never grade a plan.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Route each channel to the PA, the monitors, the recording and the broadcast — and know why live plans use fewer open mics.',
    credit: { scenarios: ['kt.ctx.1', 'kt.ctx.2', 'kt.ctx.studio', 'kt.rec.3'], interactive: 'routing', note: 'LIVE: route the room pair to the recording only, with kick and snare in the PA. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A studio may keep every channel on its own track; live, open mics hear the PA and the monitors, so use the channels the audience needs and keep room feeds out of the PA and wedges.',
  },
  twoMic: {
    title: 'Close mic and overhead',
    goal: 'See how a close mic and an overhead hear the same drum at different times — and what polarity does and does not change.',
    credit: { scenarios: ['kt.two.1', 'kt.two.2', 'kt.two.3', 'kt.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'A close mic hears its drum first; the overheads a few milliseconds later. Bring close mics up one at a time and check mono. Polarity is a test that flips the sign; it does not remove the delay.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom in a multi-mic kit to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check one channel at a time against the picture, in mono, at a plausible level — position and balance before polarity, polarity before EQ.',
  },
  practice: {
    title: 'Practice',
    goal: 'Build a kit setup in the right order, choose and justify a plan for two briefs, and say when a channel earns its place.',
    credit: { scenarios: ['kt.prac.order', 'kt.prac.gain', 'kt.prac.setup1', 'kt.prac.setup2', 'kt.prac.3', 'kt.mix.1', 'kt.mix.2', 'kt.mix.3'], note: 'Put the build in order, answer the gain check, complete both briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real kit.' },
    takeaway: 'A coherent picture, each mic added for a stated need, safe clearance and gain, a mono check and a clear studio or live plan pass — a two-mic jazz plan and a fully spotted rock plan can both be right.',
  },
};

/* Source lines in comments only: kt.snd.* L51, L71 · kt.set.* L5-L6, L77-L78 ·
 * kt.mic.* L33-L45 · kt.place.* L11-L24, L57-L69 · kt.ctx.* L73-L75 ·
 * kt.two.* L71-L72 · kt.prac.* L79-L86. */
const scenarios: MikingScenario[] = [
  {
    id: 'kt.snd.1',
    page: 'sound',
    prompt: 'A close mic sits over the 12 in tom. What else does it hear?',
    options: ['The rest of the kit, later and quieter', 'Nothing else at all, at that short a distance', 'Only the cymbal right above it'],
    correct: 'The rest of the kit, later and quieter',
    explain: 'Every open mic hears every source — its own drum first and loudest, the rest later and quieter. That is bleed.',
    why: {
      'Nothing else at all, at that short a distance': 'Close is not sealed: the rest of the kit still reaches the mic, just later and quieter.',
      'Only the cymbal right above it': 'The cymbal is a big part of it, but the snare, kick and hi-hat arrive too.',
    },
  },
  {
    id: 'kt.snd.2',
    page: 'sound',
    prompt: 'Why does a close snare mic still hear the hi-hat clearly?',
    options: ['The hi-hat sits close by and sends sound from both faces', 'The snare mic is aimed at the hi-hat on purpose', 'The hi-hat is simply the loudest part of a drum kit, whatever the song'],
    correct: 'The hi-hat sits close by and sends sound from both faces',
    explain: 'The hi-hat is a neighbour of the snare and its plates radiate up and down: some of it reaches the snare mic. Aim and position change how much — they cannot remove it.',
    why: {
      'The snare mic is aimed at the hi-hat on purpose': 'Usually it is aimed away from the hi-hat — and still hears it, because it is so close.',
      'The hi-hat is simply the loudest part of a drum kit, whatever the song': 'It is not always the loudest; it is close to the snare mic, which is what matters here.',
    },
  },
  {
    id: 'kt.snd.3',
    page: 'sound',
    prompt: 'A snare stroke reaches the snare mic and an overhead. Which hears it first?',
    options: ['The snare mic, which is much closer', 'The overhead, which faces the kit', 'Both together, as it is one stroke'],
    correct: 'The snare mic, which is much closer',
    explain: 'Only the distance sets the arrival time: the close mic first, the overhead a few milliseconds later — the source of the comb when they are summed.',
    why: {
      'The overhead, which faces the kit': 'Facing the kit changes how much it hears, not when. The close mic is nearer, so it hears it first.',
      'Both together, as it is one stroke': 'One stroke, two distances: two arrival times.',
    },
  },
  {
    id: 'kt.set.1',
    page: 'setting',
    prompt: 'Before patching a single channel, what do you write down?',
    options: ['A target: the kit picture this music needs', 'The largest channel count the desk allows', 'The brand and model of each mic you plan to use'],
    correct: 'A target: the kit picture this music needs',
    explain: 'An open jazz picture, a dry pop kit with separate toms, a live stage needing kick and snare definition, a stereo recording with natural room — the target decides the plan.',
    why: {
      'The largest channel count the desk allows': 'More channels is not a target; the music sets how many you need.',
      'The brand and model of each mic you plan to use': 'Brands are not the target; the picture the music needs is.',
    },
  },
  {
    id: 'kt.set.2',
    page: 'setting',
    prompt: 'The floor tom’s hardware rattles in every mic. What do you do first?',
    options: ['Fix it with the player before working on the mics', 'Add a mic nearer the floor tom to cover the rattle', 'Gate the floor-tom channel so the rattle disappears'],
    correct: 'Fix it with the player before working on the mics',
    explain: 'Check tuning, rattling heads or hardware and the playing balance with the drummer before trying to repair a physical problem with microphones.',
    why: {
      'Add a mic nearer the floor tom to cover the rattle': 'A closer mic hears the rattle better. Fix the source first.',
      'Gate the floor-tom channel so the rattle disappears': 'The rattle is in every mic; a gate on one channel hides little. Fix the source with the player.',
    },
  },
  {
    id: 'kt.set.3',
    page: 'setting',
    prompt: 'Twelve channels means many full-kit passes at soundcheck. What protects your hearing?',
    options: ['Limiting level and time where you are, and hearing protection', 'The desk’s meters, which show when it is too loud for people', 'Nothing more — the mics’ maximum SPL keeps things in a safe range'],
    correct: 'Limiting level and time where you are, and hearing protection',
    explain: 'Hearing risk depends on the level where you are and for how long: a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more. Limit unnecessary loud repetitions.',
    why: {
      'The desk’s meters, which show when it is too loud for people': 'Desk meters show signal level, not the level at your ears.',
      'Nothing more — the mics’ maximum SPL keeps things in a safe range': 'Maximum SPL says when a MIC distorts. It says nothing about your ears.',
    },
  },
  {
    id: 'kt.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Which mic hears the snare FIRST: a close snare mic or the overhead?',
    options: ['The close snare mic', 'The overhead above it', 'Whichever of the two mics is turned up louder'],
    correct: 'The close snare mic',
    explain: 'The nearer mic hears it first — the overhead a few milliseconds later.',
    why: {
      'The overhead above it': 'The overhead is farther away, so it hears the snare later.',
      'Whichever of the two mics is turned up louder': 'Level does not set the arrival time; distance does.',
    },
  },
  {
    id: 'kt.mic.1',
    page: 'microphone',
    prompt: 'Your plan has two small-condenser overheads, a pair of condenser room mics and a hi-hat condenser. How many inputs need phantom power?',
    options: ['Five — every condenser in the plan', 'Two — only the overheads use it', 'None — phantom is for the PA only'],
    correct: 'Five — every condenser in the plan',
    explain: 'Each condenser needs phantom power: count them when you plan the inputs, and mute the outputs before switching it.',
    why: {
      'Two — only the overheads use it': 'The room mics and the hi-hat mic are condensers too.',
      'None — phantom is for the PA only': 'Phantom power feeds condenser microphones through their cables.',
    },
  },
  {
    id: 'kt.mic.2',
    page: 'microphone',
    prompt: 'A tom spot must sit low under a crash, need no phantom power, and stay out of the sticks’ path. Which suits it?',
    options: ['A small cardioid dynamic on a short boom', 'A large condenser on a tall stand, above the crash', 'A boundary plate resting on the floor tom’s head'],
    correct: 'A small cardioid dynamic on a short boom',
    explain: 'Small, low and unpowered: a small dynamic close to the drum, out of the sticks’ path, fits all three needs — the toms lesson has the starting points. Other mics can work when their properties fit.',
    why: {
      'A large condenser on a tall stand, above the crash': 'It needs phantom power, and above the crash it hears the cymbals more than the tom.',
      'A boundary plate resting on the floor tom’s head': 'Nothing rests on a played head: it would rattle and be struck.',
    },
  },
  {
    id: 'kt.mic.3',
    page: 'microphone',
    prompt: 'Your phantom-powered inputs are all used up. Which channels can still be added?',
    options: ['Dynamic spot mics, which need no power', 'More condenser overheads, which use little', 'Room condensers, as long as they stand far enough away'],
    correct: 'Dynamic spot mics, which need no power',
    explain: 'Dynamics need no power. Every condenser needs phantom, wherever it stands.',
    why: {
      'More condenser overheads, which use little': 'Little is not none: a condenser needs phantom power.',
      'Room condensers, as long as they stand far enough away': 'Distance does not change what a condenser needs.',
    },
  },
  {
    id: 'kt.mic.4',
    page: 'microphone',
    prompt: 'A rim clamp holds a small mic on the snare. What do you check besides the mic?',
    options: ['The clamp’s fit and the stress on the drum’s hardware', 'Nothing — a clamp is safer than a stand in each and all cases', 'That the clamp touches the head, to steady it'],
    correct: 'The clamp’s fit and the stress on the drum’s hardware',
    explain: 'Check any rim-mounted clip for fit and for stress on the drum’s hardware, not just the mic’s stability — and keep it out of the sticks’ path.',
    why: {
      'Nothing — a clamp is safer than a stand in each and all cases': 'A clamp brings its own risks: fit, hardware stress and the sticks’ path.',
      'That the clamp touches the head, to steady it': 'Nothing touches a played head: it would deaden it and be struck.',
    },
  },
  {
    id: 'kt.place.1',
    page: 'placement',
    prompt: 'A one-mic plan is missing the kick. What do you try first?',
    options: ['Moving or re-aiming the one mic', 'Adding a kick mic straight away', 'Turning the whole channel up'],
    correct: 'Moving or re-aiming the one mic',
    explain: 'If the kick is missing, test the position before adding a spot — then add a kick mic if the music still needs it.',
    why: {
      'Adding a kick mic straight away': 'A second channel may be right, but try the position first: it may already fix it.',
      'Turning the whole channel up': 'Louder keeps the same balance: the kick stays missing relative to the rest.',
    },
  },
  {
    id: 'kt.place.2',
    page: 'placement',
    prompt: 'You add a hi-hat spot to an expanded plan. When has it earned its channel?',
    options: ['When the hi-hat needs its own balance, and the bleed is acceptable', 'Whenever there is a spare input left over on the stage box tonight', 'When the overheads already carry the hi-hat well'],
    correct: 'When the hi-hat needs its own balance, and the bleed is acceptable',
    explain: 'Add a channel for a distinct, useful control — and reject it if it brings more harmful spill than control.',
    why: {
      'Whenever there is a spare input left over on the stage box tonight': 'A spare input is not a reason: each open mic adds spill and arrival differences.',
      'When the overheads already carry the hi-hat well': 'Then the spot adds little but bleed — it may not be needed.',
    },
  },
  {
    id: 'kt.place.3',
    page: 'placement',
    prompt: 'Two overheads plus kick and snare: what is a fair name for that plan?',
    options: ['A four-mic plan with a stereo overhead pair', 'The floor-tom method, with two mics over the kit', 'An extensive plan for a fully spotted kit'],
    correct: 'A four-mic plan with a stereo overhead pair',
    explain: 'It is a common four-channel base. The floor-tom method is a different family — a mic over the snare and one beside the floor tom — taught in the overheads lesson.',
    why: {
      'The floor-tom method, with two mics over the kit': 'An ordinary overhead pair is not the floor-tom method: that pairs a mic over the snare with a side mic by the floor tom.',
      'An extensive plan for a fully spotted kit': 'Four channels with no tom or cymbal spots is a compact plan, not an extensive one.',
    },
  },
  {
    id: 'kt.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Twelve mics on a kit: where may their stands and cables go?',
    options: ['Clear of the player’s whole movement and the pedals', 'Wherever the shortest cable run reaches the stage box on the floor', 'Across the hi-hat pedal, taped flat to the floor'],
    correct: 'Clear of the player’s whole movement and the pedals',
    explain: 'Every channel is another stand and cable near a moving player: clear the sticks, cymbals, pedals and the player’s reach.',
    why: {
      'Wherever the shortest cable run reaches the stage box on the floor': 'A short run is no reason to cross the player’s space.',
      'Across the hi-hat pedal, taped flat to the floor': 'The pedal moves all the time; keep cables away from it.',
    },
  },
  {
    id: 'kt.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · On a stage, what do the kit’s open mics hear besides the kit?',
    options: ['The monitors and the PA', 'Nothing else, if they face the drums', 'Only the other players’ amplifiers'],
    correct: 'The monitors and the PA',
    explain: 'Every open mic hears the monitors and the PA too — which is why live plans use the channels the audience needs.',
    why: {
      'Nothing else, if they face the drums': 'Facing the drums reduces other sources; it does not remove them.',
      'Only the other players’ amplifiers': 'Amplifiers too — and the monitors and the PA.',
    },
  },
  {
    id: 'kt.ctx.1',
    page: 'context',
    prompt: 'A small, loud stage. The audience already hears the cymbals from the kit. Which channels go to the PA first?',
    options: ['What the audience cannot already hear — often kick and snare', 'All the channels you have, so that the mix keeps all its options open', 'The overheads, since they hear the whole kit at once'],
    correct: 'What the audience cannot already hear — often kick and snare',
    explain: 'Start with what the audience cannot already hear; add an overhead or a shared tom and cymbal mic only if needed.',
    why: {
      'All the channels you have, so that the mix keeps all its options open': 'Every open mic in the PA hears the monitors and the PA, and costs gain before feedback.',
      'The overheads, since they hear the whole kit at once': 'On a loud stage the audience already hears the cymbals; overheads add spill first.',
    },
  },
  {
    id: 'kt.ctx.2',
    page: 'context',
    prompt: 'A broadcast wants a room mic on the drums. Where should it go?',
    options: ['A separate broadcast feed, out of the PA and wedges', 'Into the PA, so that the hall sounds bigger to the audience', 'Into the drummer’s monitor, so they hear it'],
    correct: 'A separate broadcast feed, out of the PA and wedges',
    explain: 'An audience or room mic for a recording or broadcast can stay out of the PA and the monitor mixes — test every routing path.',
    why: {
      'Into the PA, so that the hall sounds bigger to the audience': 'In the PA, a distant mic costs gain before feedback and feeds the PA back into itself.',
      'Into the drummer’s monitor, so they hear it': 'A distant open mic in a loud wedge is a feedback risk for little gain.',
    },
  },
  {
    id: 'kt.ctx.studio',
    page: 'context',
    prompt: 'Studio session: the blend uses five channels. Why might you still record twelve?',
    options: ['Separate tracks keep later decisions open', 'More tracks make the kit sound louder', 'A proper studio session needs twelve mics on the kit'],
    correct: 'Separate tracks keep later decisions open',
    explain: 'A studio may preserve separate tracks even when the current blend uses few — as long as every mic is safe and earns its place in the final choice.',
    why: {
      'More tracks make the kit sound louder': 'Level comes from the balance, not the track count.',
      'A proper studio session needs twelve mics on the kit': 'No session needs a fixed count: the music and the room decide.',
    },
  },
  {
    id: 'kt.two.1',
    page: 'twoMic',
    prompt: 'The kick mic and the overhead hear the kick about 2.7 ms apart. Summed, what happens?',
    options: ['A comb: notches where the delay is half a period', 'Nothing — two mics on one drum simply add up to more level', 'Only a level change, louder by a few decibels'],
    correct: 'A comb: notches where the delay is half a period',
    explain: 'Two arrivals summed make a comb: the first notch where the delay is half a period (about 185 Hz for 2.7 ms), then odd multiples.',
    why: {
      'Nothing — two mics on one drum simply add up to more level': 'They add only where the arrivals are in step; between, they cancel.',
      'Only a level change, louder by a few decibels': 'The level rises at some frequencies and falls at others: a comb.',
    },
  },
  {
    id: 'kt.two.2',
    page: 'twoMic',
    prompt: 'The kick sounds fuller with the overhead’s polarity flipped. Has the delay gone?',
    options: ['No: the sign flipped; the delay is still there', 'Yes: the two mics are now lined up in time', 'Yes, but only for the low notes of the kick'],
    correct: 'No: the sign flipped; the delay is still there',
    explain: 'Polarity flips the sign; it does not remove a delay. Compare both states at matched levels — and check the rest of the kit too.',
    why: {
      'Yes: the two mics are now lined up in time': 'Polarity is not a time alignment.',
      'Yes, but only for the low notes of the kick': 'The delay is the same at every pitch; polarity moves the notches.',
    },
  },
  {
    id: 'kt.two.3',
    page: 'twoMic',
    prompt: 'In what order do you bring up close mics against the overheads?',
    options: ['One at a time, at a plausible level, checked in mono', 'All at once, then adjust each one’s fader until the kit sounds right', 'Loudest first, so the quieter ones sit under it'],
    correct: 'One at a time, at a plausible level, checked in mono',
    explain: 'Build the picture first, then each close mic one at a time — so a hollow or weak hit can be traced to the mic that caused it.',
    why: {
      'All at once, then adjust each one’s fader until the kit sounds right': 'All at once, you cannot tell which mic caused a problem.',
      'Loudest first, so the quieter ones sit under it': 'Order by role, not loudness: the picture first, then each spot.',
    },
  },
  {
    id: 'kt.two.4',
    page: 'twoMic',
    prompt: 'Two kick mics and a snare top and bottom are in the plan. What do you check?',
    options: ['Each pair alone and together, in mono, before the balance', 'Nothing more — the pairs were set by the kick and snare lessons', 'Only the loudest mic of each pair'],
    correct: 'Each pair alone and together, in mono, before the balance',
    explain: 'If two kick or snare mics are used, hear them alone and together — including any snare bottom mic — before committing their balance.',
    why: {
      'Nothing more — the pairs were set by the kick and snare lessons': 'Each pair still meets the overheads and the rest of the kit here: check them in the whole.',
      'Only the loudest mic of each pair': 'The quieter mic still changes the sum; hear both.',
    },
  },
  {
    id: 'kt.prac.gain',
    page: 'practice',
    prompt: 'Rimshots overload the snare channel’s input, but the fader is low. What do you do?',
    options: ['Lower the input gain or use a pad the manual allows, and re-check', 'Nothing — the fader is low, so the channel is fine', 'Pull the fader lower still until the rimshots sound clean again'],
    correct: 'Lower the input gain or use a pad the manual allows, and re-check',
    explain: 'Set gain and any pad for the loudest hits — rimshots and crashes included. A lowered fader does not undo overload at the input.',
    why: {
      'Nothing — the fader is low, so the channel is fine': 'The overload happens before the fader; a low fader hides it.',
      'Pull the fader lower still until the rimshots sound clean again': 'The fader comes after the overload; it cannot clean it.',
    },
  },
  {
    id: 'kt.prac.3',
    page: 'practice',
    prompt: 'When does an optional channel — a ride spot, a room pair — earn its place?',
    options: ['When it gives a distinct, useful control that holds up in mono', 'When the stage box still has inputs left over after the main plan is in', 'When the drummer has an expensive cymbal on that side'],
    correct: 'When it gives a distinct, useful control that holds up in mono',
    explain: 'Reject a channel that brings more harmful spill than control. An optional channel is not automatically an improvement.',
    why: {
      'When the stage box still has inputs left over after the main plan is in': 'Spare inputs are not a reason: each open mic adds spill.',
      'When the drummer has an expensive cymbal on that side': 'The price of a cymbal is not a musical reason.',
    },
  },
  {
    id: 'kt.mix.1',
    page: 'practice',
    prompt: 'A close snare mic in a full kit: what else is in it?',
    options: ['Bleed from the rest of the kit', 'Only the snare, if it is close', 'Only the snare’s wires'],
    correct: 'Bleed from the rest of the kit',
    explain: 'Even an apparently isolated snare or hi-hat mic hears plenty of bleed — use it, or reposition, rather than assume it can be erased.',
    why: {
      'Only the snare, if it is close': 'Close is not sealed: the hi-hat, kick and cymbals reach it too.',
      'Only the snare’s wires': 'A top mic hears the head and the wires — and the rest of the kit.',
    },
  },
  {
    id: 'kt.mix.2',
    page: 'practice',
    prompt: 'A tom hit turns hollow when its close mic comes up with the overheads. What do you try first?',
    options: ['The close mic’s position or level, then polarity as a test', 'A deep cut in the tom channel’s low-mids until the hollow sound goes', 'Taking the overheads out of the mix'],
    correct: 'The close mic’s position or level, then polarity as a test',
    explain: 'Alter the position or the balance, and try polarity reversal as a diagnostic — a switch changes the sign; it does not remove a time difference.',
    why: {
      'A deep cut in the tom channel’s low-mids until the hollow sound goes': 'EQ cannot fill notches set by arrival times.',
      'Taking the overheads out of the mix': 'The overheads are the picture; fix the close mic against them.',
    },
  },
  {
    id: 'kt.mix.3',
    page: 'practice',
    prompt: 'Live, where does the room pair usually go?',
    options: ['The recording or broadcast feed, not the PA', 'The PA, to make the kit sound bigger', 'The drummer’s own monitor mix, so they can hear the room'],
    correct: 'The recording or broadcast feed, not the PA',
    explain: 'A room feed is usually a recording or broadcast choice, kept out of the PA and the wedge mixes.',
    why: {
      'The PA, to make the kit sound bigger': 'In the PA a distant mic costs gain before feedback.',
      'The drummer’s own monitor mix, so they can hear the room': 'A distant open mic in a loud wedge is a feedback risk.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 's.hollow',
    observation: 'An impact turns hollow or weak when a close mic comes up',
    firstChecks: 'Alter the position or balance; try polarity reversal as a diagnostic; check several strokes.',
    options: ['That mic’s position and level against the picture; polarity as a test', 'Boost that channel’s low end until the hit sounds full and solid again', 'Mute the overheads whenever that drum plays in the song'],
    correct: 'That mic’s position and level against the picture; polarity as a test',
    explain: 'Find the mic that causes it, in mono; move it or change its level; try polarity as a test, over several strokes.',
    why: {
      'Boost that channel’s low end until the hit sounds full and solid again': 'EQ cannot fill notches set by arrival times.',
      'Mute the overheads whenever that drum plays in the song': 'That breaks the kit picture; fix the close mic against it.',
    },
  },
  {
    id: 's.shift',
    observation: 'A drum shifts sideways in the stereo image when its mic comes up',
    firstChecks: 'Pan the close mic consistently with the overhead image; check the overheads’ centre.',
    options: ['Its pan against where the overheads put that drum', 'Pan all the close mics to the centre to keep things steady', 'Swap the overheads’ left and right channels around'],
    correct: 'Its pan against where the overheads put that drum',
    explain: 'Pan close toms and the hi-hat to match the overheads’ picture — from the drummer’s or the audience’s side, consistently.',
    why: {
      'Pan all the close mics to the centre to keep things steady': 'Centring a tom that the overheads put to one side makes it jump; match the picture.',
      'Swap the overheads’ left and right channels around': 'That flips the whole kit; match each close mic to the picture you chose.',
    },
  },
  {
    id: 's.bleed',
    observation: 'The hi-hat is loud in the snare channel',
    firstChecks: 'Reposition or re-aim the snare mic; use the bleed creatively or reduce it — it cannot be erased.',
    options: ['The snare mic’s aim and position against the hi-hat', 'Gate the snare channel hard so only the hits get through', 'Ask the drummer to stop playing the hi-hat during takes'],
    correct: 'The snare mic’s aim and position against the hi-hat',
    explain: 'Aim the snare mic away from the hi-hat and keep it out of the sticks’ path; some bleed will remain — use it or reduce it.',
    why: {
      'Gate the snare channel hard so only the hits get through': 'The hi-hat is still in it during each hit; start with the mic itself.',
      'Ask the drummer to stop playing the hi-hat during takes': 'The music sets the playing; the mic moves.',
    },
  },
  {
    id: 's.mono',
    observation: 'The kit thins out when the mix is summed to mono',
    firstChecks: 'Check the spaced pair and each close mic in mono; consider a coincident pair.',
    options: ['Each channel in mono with the overheads; the overhead spacing', 'Widen the stereo panning so the mono sum has more room', 'Add a room pair to fill the mono sum back out again with more space'],
    correct: 'Each channel in mono with the overheads; the overhead spacing',
    explain: 'A wide spaced pair can change the tone or the centre in mono. Find which channels combine badly, and change spacing or position.',
    why: {
      'Widen the stereo panning so the mono sum has more room': 'Mono ignores panning; the arrival differences remain.',
      'Add a room pair to fill the mono sum back out again with more space': 'More distant mics add more arrival differences, not fewer.',
    },
  },
  {
    id: 's.feedback',
    observation: 'Feedback or a harsh live kit as more drum channels open',
    firstChecks: 'Use only channels that serve the audience; check gain before feedback with the operator.',
    options: ['Which channels the audience needs; gain before feedback with the operator', 'Open all the drum channels and pull the master fader down a little', 'Turn the monitors up so the drummer can hear the whole kit more clearly'],
    correct: 'Which channels the audience needs; gain before feedback with the operator',
    explain: 'Every open mic hears the monitors and the PA. Close the channels the PA does not need, and check the margin with the operator — never provoke feedback.',
    why: {
      'Open all the drum channels and pull the master fader down a little': 'More open mics, less margin: the master hides the problem.',
      'Turn the monitors up so the drummer can hear the whole kit more clearly': 'Louder monitors bring feedback closer.',
    },
  },
  {
    id: 's.stand',
    observation: 'A stand or a cable is in a drummer’s path',
    firstChecks: 'Stop; secure and reposition; reroute; repeat the full-movement check.',
    options: ['Stop the drummer; move it and reroute; check the movement again', 'Leave it — the drummer will work around the stand during the set', 'Tape the cable to the pedal so that it cannot shift about'],
    correct: 'Stop the drummer; move it and reroute; check the movement again',
    explain: 'Clearance comes first: a safe resting position is not the whole movement. Stop, fix it, and have the drummer show their full movement.',
    why: {
      'Leave it — the drummer will work around the stand during the set': 'A player should not have to work around hardware.',
      'Tape the cable to the pedal so that it cannot shift about': 'The pedal moves all the time; keep cables away from it.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'kt.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of building a kit setup in the order you would do them.',
    steps: [
      { text: 'Hear the passage at show level; write the target picture', early: 'Start with the music and the target.' },
      { text: 'Set one safe whole-kit mic or pair; note what is underrepresented', early: 'Set the picture once you know the target.' },
      { text: 'Label every channel; mute the outputs; switch phantom where needed', early: 'Power and labels come once the mics are set and cabled — with the outputs muted first.' },
      { text: 'Set gain and pads on the loudest hits, rimshots and crashes included', early: 'Gain is set once everything is powered.' },
      { text: 'Add the kick, then each spot only for a stated need, checked in mono', early: 'Spots come after the picture and safe levels.' },
      { text: 'Trace the PA, monitor, record and broadcast routing with the operator', early: 'Route once the channels exist and work.' },
      { text: 'Re-check clearance with full movement; log what you left out and why', early: 'The final check comes last.' },
    ],
    explain: 'A sensible order: the target, the picture, power and gain, each spot for a reason, routing, then a last clearance check — and a note of what you left out.',
  },
];

const CLEAR: SetupReason = { id: 'r.clear', label: 'Every stand, cable and clamp stays clear of the player’s whole movement', role: 'required', feedback: 'Clearance is part of every passing plan.' };
const NEED: SetupReason = { id: 'r.need', label: 'Each channel is there for a stated need of this music', role: 'required', feedback: 'Say what each channel adds.' };
const BRAND: SetupReason = { id: 'r.brand', label: 'It uses the drum mic kit most engineers own', role: 'wrong', feedback: 'A brand or a packaged kit is not part of passing: choose by role.' };
const MORE: SetupReason = { id: 'r.more', label: 'More channels give a better drum sound', role: 'wrong', feedback: 'An optional channel is not automatically an improvement.' };

const setupTasks: SetupTask[] = [
  {
    id: 'kt.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Studio, a small jazz group in a good room. The drummer balances the kit beautifully; the producer wants an open, natural kit. Plenty of inputs; phantom power is available.',
    setups: [
      { id: 'a', label: 'An overhead pair over the kit, with a kick mic added after listening', ok: true, power: 'phantom', feedback: 'An open picture from the pair; the kick only if the music needs its weight.' },
      { id: 'b', label: 'One whole-kit mic, plus kick and snare spots kept low in the blend', ok: true, power: 'phantom', feedback: 'A whole-kit picture with a little focus — fine if the spots hold up in mono.' },
      { id: 'c', label: 'The floor-tom method: a mic over the snare, a side mic, a kick spot', ok: true, power: 'phantom', feedback: 'A whole-kit family from few mics — the snare distances matched, checked in mono.' },
      { id: 'd', label: 'Every drum and cymbal spotted, the overheads only for cymbals', ok: false, power: 'phantom', feedback: 'Overheads used only for cymbals give up the open whole-kit picture this brief asks for — spot mics can be recorded, but the picture comes from the overheads first.' },
      { id: 'e', label: 'Room mics only, far in the corners, no kit picture', ok: false, power: 'phantom', feedback: 'Corners alone give mostly room: the kit picture comes first.' },
    ],
    reasons: [CLEAR, NEED, { id: 'r.picture', label: 'The whole-kit picture comes first; spots only add what is missing', role: 'required', feedback: 'Say how the picture is set before the spots.' }, { id: 'r.room', label: 'The good room adds to the open sound', role: 'optional', feedback: 'A fair studio reason.' }, BRAND, MORE],
    explain: 'More than one plan passes. What passes is the reasoning: the picture first, each channel for a need, and clearance.',
  },
  {
    id: 'kt.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud rock club. The audience hears the cymbals from the kit; gain before feedback is tight; the show is also recorded. Eight inputs for drums.',
    setups: [
      { id: 'a', label: 'Kick, snare and toms in the PA; overheads and a room mic to the recording only', ok: true, power: 'phantom', feedback: 'What the audience cannot hear goes to the PA; the room and overheads serve the recording.' },
      { id: 'b', label: 'Kick and snare in the PA; one overhead and the toms to the recording', ok: true, power: 'phantom', feedback: 'A lean PA plan with a fuller recording — check gain before feedback with the operator.' },
      { id: 'c', label: 'All eight channels in the PA and the monitors', ok: false, power: 'phantom', feedback: 'Every open mic in the PA and the wedges costs gain before feedback.' },
      { id: 'd', label: 'A room pair in the PA to make the kit bigger in the club', ok: false, power: 'phantom', feedback: 'Distant mics in the PA hear the PA itself: little gain, much feedback risk.' },
      { id: 'e', label: 'Cymbal spots in the PA so the crashes cut through', ok: false, power: 'phantom', feedback: 'The audience already hears the cymbals; an open cymbal mic can make the PA harsher.' },
    ],
    reasons: [CLEAR, NEED, { id: 'r.route', label: 'The PA gets what the audience cannot already hear; the rest feeds the recording', role: 'required', feedback: 'Say what goes to the PA and what to the recording.' }, { id: 'r.op', label: 'The system operator checks the routing and margin at show level', role: 'optional', feedback: 'A fair live reason.' }, BRAND, MORE],
    explain: 'Two plans pass. What passes is the reasoning: the PA gets what the audience needs, the recording gets the rest, and every channel is clear and has a reason.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: a close snare mic. Does it hear the hi-hat?', options: ['No — it is too close to the snare', 'Yes, a little later and quieter', 'Only if it is aimed at the hi-hat'], after: 'Now STEP through the cymbal’s stroke (or PLAY ONCE), then see who arrives first at each mic.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'In front, close up'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you add a close tom mic to a four-mic base. What else gets louder in that new channel?', options: ['The rest of the kit, later and quieter', 'Only the tom it is aimed at', 'It depends on the tom’s tuning'], after: 'Now build the two plans and count what each added channel costs.' },
  context: { prompt: 'Predict: on a loud small stage, which drum channels does the PA need first?', options: ['The ones the audience cannot already hear', 'Every drum and cymbal, all equally', 'Only the overhead pair'], after: 'Now route each channel and read where it goes.' },
  twoMic: { prompt: 'If you flip the overhead’s polarity, what happens to its delay behind the kick mic?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What is a complete drum-kit setup?',
    options: ['A coordinated set of channels for the kit, room chosen deliberately', 'One mic on each drum and each cymbal, whatever the music', 'Whatever channels a stage box has unused on the night of the show'],
    correct: 'A coordinated set of channels for the kit, room chosen deliberately',
    explain: 'A coordinated view of kick, snare, toms and cymbals, with any room sound chosen on purpose — the count follows the music, the room and the system.',
    why: {
      'One mic on each drum and each cymbal, whatever the music': 'A complete setup can be one mic or many: the music decides.',
      'Whatever channels a stage box has unused on the night of the show': 'Unused inputs are not a plan; the music and the system are.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'On this right-handed kit, which drum sits on the player’s right, under the ride?',
    options: ['The floor tom', 'The snare', 'The 10 in tom'],
    correct: 'The floor tom',
    explain: 'The floor tom stands on its legs at the player’s right, under the ride; the snare is between the knees.',
    why: {
      'The snare': 'The snare sits between the player’s knees, by the hi-hat.',
      'The 10 in tom': 'The rack toms sit on the holder over the kick.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'A close tom mic: what else reaches it?',
    options: ['The rest of the kit, later and quieter', 'Nothing, at that distance', 'Only the floor and the stand right beneath it'],
    correct: 'The rest of the kit, later and quieter',
    explain: 'Every open mic hears every source: its own drum first and loudest, the rest later and quieter.',
    why: {
      'Nothing, at that distance': 'Close is not sealed: the rest of the kit still arrives.',
      'Only the floor and the stand right beneath it': 'The floor reflects sound, but the other drums and cymbals reach the mic directly.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Which hears a snare stroke first: a close snare mic or the overhead?',
    options: ['The close snare mic', 'The overhead', 'Both at the same moment'],
    correct: 'The close snare mic',
    explain: 'Only the distance sets the arrival time: the nearer mic hears it first.',
    why: {
      'The overhead': 'The overhead is farther away, so it hears the snare later.',
      'Both at the same moment': 'Two distances, two arrival times.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'What do you do before patching any channel?',
    options: ['Write a target picture for this music', 'Patch the largest plan possible, then trim it down later', 'Choose a brand for each mic first'],
    correct: 'Write a target picture for this music',
    explain: 'The target — open jazz, dry pop, a loud live stage, a natural recording — decides the plan.',
    why: {
      'Patch the largest plan possible, then trim it down later': 'Start from the target; add each channel for a need.',
      'Choose a brand for each mic first': 'Brands come last, if at all; the target comes first.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: 'Your kit mics are rated to 140 dB SPL or more. What does that tell you about standing by the kit through a long soundcheck?',
    options: ['Nothing — it is the mics’ distortion limit, not a hearing limit', 'It is safe for a while, as long as the kit stays below the mics’ rating', 'It is safe as long as the mics are between you and the kit'],
    correct: 'Nothing — it is the mics’ distortion limit, not a hearing limit',
    explain: 'Max SPL says when a MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'It is safe for a while, as long as the kit stays below the mics’ rating': 'A mic’s rating is about the mic. Hearing risk depends on the level where you are and for how long.',
      'It is safe as long as the mics are between you and the kit': 'Mics do not shield your ears. Limit the level and the time, and use hearing protection.',
    },
  },
];

export const M11_LESSON: Lesson = {
  id: 'M11',
  labId: 'drums',
  title: 'Complete Kit Setups',
  subtitle: 'From one mic to every channel — plans, bleed, mono and routing',
  noun: { one: 'whole kit', many: 'whole kits', subject: 'drum kit' },
  model: M11_MODEL,
  micTypeIds: ['kickDynSuper', 'smallDynCard', 'ohPencil', 'roomPencil'],
  zones: M11_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A complete setup is a coordinated view of the kit — kick, snare, toms and cymbals — with any room sound chosen deliberately. It can be one mic or many.', src: 'M11-LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'Every drum recording and every reinforced kit has one, written down or not: from a single mic in a jazz club to a fully spotted rock kit with a room pair for the recording.', src: 'DPA-KIT' },
    { title: 'ITS JOB', text: 'To give the music the control it needs — and no more. A whole-kit picture first; then each close mic for a stated purpose; room channels as options. Studio and live plans can differ for the same kit.', src: 'S-REC1' },
    { title: 'THE KIT HERE', text: 'A typical 5-piece: a 22 in kick, a 14 in snare, 10 and 12 in rack toms, a 16 in floor tom, 14 in hi-hats, 16 and 18 in crashes and a 20 in ride — in a right-handed layout. A plan here can run from 1 to 12 channels.', src: 'ZIL-K' },
  ],
  sound: {
    stages: [{ title: 'The stick meets the bow', text: 'The stick strikes the cymbal on its bow.' }, { title: 'The plate bends', text: 'The plate bends under the stick.' }, { title: 'It rings and rocks', text: 'The whole plate rings and rocks on its felts.' }, { title: 'Sound leaves both faces', text: 'Up toward the overheads and down toward the drums.' }],
    attack: 'Every stroke starts with the stick or the beater meeting a head or a cymbal — a short, bright attack, loudest in the mic closest to it.',
    body: 'Then each drum rings from its heads and each cymbal from its whole plate, both faces. Every open mic hears all of it: its own source first and loudest, the rest later and quieter — the bleed every multi-mic plan lives with.',
    head: { diameterMm: 16 * 25.4, rods: 0, label: '16 in crash', strikeSrc: 'ZIL-K', hoop: 'metal' },
  },
  setting: {
    items: [
      { id: 'kick', label: 'the kick', short: 'KICK', tag: 'OFTEN FIRST', note: 'Often the first spot added: a whole-kit mic can leave the kick light. Air puffs from a port, the pedal’s action and the bass player share its space.', scene: 'all', prov: { kind: 'illustrative', reason: 'kit plan' } },
      { id: 'snare', label: 'the snare', short: 'SNARE', tag: 'TOP, MAYBE BOTTOM', note: 'A top mic from outside the sticks’ path; a bottom mic for the wires is optional. The hi-hat beside it bleeds in.', scene: 'all', prov: { kind: 'illustrative', reason: 'kit plan' } },
      { id: 'hihat', label: 'the hi-hats', short: 'HI-HATS', tag: 'SPOT IF NEEDED', note: 'Loud in the snare mic and the overheads. A spot only when its pattern needs its own balance — away from the air that puffs out as it closes.', scene: 'all', prov: { kind: 'illustrative', reason: 'kit plan' } },
      { id: 'toms', label: 'the rack toms', short: 'TOMS', planIds: ['tom1', 'tom2'], tag: 'ONE EACH OR SHARED', note: 'A mic per tom, or one shared mic where the coverage and the bleed allow. Their fills may already be clear in the overheads.', scene: 'all', prov: { kind: 'illustrative', reason: 'kit plan' } },
      { id: 'floor', label: 'the floor tom', short: 'FLOOR TOM', tag: 'SPOT OR NOT', note: 'Its own spot, or left to the overheads — the music decides.', scene: 'all', prov: { kind: 'illustrative', reason: 'kit plan' } },
      { id: 'cymbals', label: 'the crashes and the ride', short: 'CYMBALS', planIds: ['crash1', 'crash2', 'ride'], tag: 'OVERHEADS FIRST', note: 'Hear the overheads first. A dedicated cymbal mic only for a clear balance or staging need — they swing, and their peaks are fast.', scene: 'all', prov: { kind: 'illustrative', reason: 'kit plan' } },
      { id: 'throne', label: 'the player’s space', short: 'PLAYER', tag: 'KEEP OUT', note: 'More channels mean more stands, cables and clamps near a moving player: clear the sticks, the cymbals’ swing, the pedals and the player’s reach.', scene: 'all', prov: { kind: 'illustrative', reason: 'drawing defaults for the drummer’s envelope' } },
      { id: 'fill', label: 'the drummer’s fill monitor', short: 'DRUM FILL', tag: 'IN EVERY MIC', note: 'Beside the throne. Every open drum mic hears it, which is one reason a live plan uses fewer channels.', scene: 'stage', prov: { kind: 'illustrative', reason: 'M01’s stage position' } },
      { id: 'downstage', label: 'another player’s wedge', short: 'DOWNSTAGE', tag: 'SPILL', note: 'Downstage of the kit: loud, and heard by the kick mic and the overheads.', scene: 'stage', prov: { kind: 'illustrative', reason: 'M01’s stage position' } },
      { id: 'audience', label: 'the audience and the PA', short: 'AUDIENCE', tag: 'WHAT IS NEEDED', note: 'Start from what the audience cannot already hear — often the kick and the snare. Recording and broadcast feeds can carry more.', scene: 'stage', prov: { kind: 'illustrative', reason: 'a typical stage' } },
      { id: 'room', label: 'the studio room', short: 'ROOM', tag: 'OPTIONAL', note: 'A good room can add to the kit as its own channels; a poor one argues for closer pickup. A shared room adds other players’ bleed.', scene: 'studio', prov: { kind: 'illustrative', reason: 'a typical room' } },
    ],
    stage: 'A stage adds monitors on the floor and a PA facing the audience: every open drum mic hears them.',
    studio: 'A studio has no monitors on the floor; separate tracks keep later decisions open.',
  },
  diagnostic,
  practice: {
    task: 'Choose a channel plan for each brief. More than one plan can pass when its reasoning and safety checks are sound.',
    fields: [
      { id: 'kit', label: 'Kit, room and performance', kind: 'text' },
      { id: 'target', label: 'Target picture', kind: 'text' },
      { id: 'count', label: 'Channels and why each one', kind: 'text' },
      { id: 'mono', label: 'Stereo picture and mono result', kind: 'text' },
      { id: 'checks', label: 'Peak and clearance checks', kind: 'text' },
      { id: 'routes', label: 'PA, monitor, recording and broadcast feeds', kind: 'text' },
      { id: 'notes', label: 'One mic left out or moved, and why', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'Kit positions, heights and tilts; the drummer’s envelope — drawing defaults.', dims: [] },
    { text: 'Each channel’s mic position in a plan — illustrative starting places; each drum’s own lesson has its numbers.', dims: [] },
    { text: 'The stage monitors’ positions — ILLUSTRATIVE (M01’s).', dims: [] },
    { text: 'Every keep-out clearance, including each cymbal’s swing — ILLUSTRATIVE values for the owner to approve.', dims: ['cym.hihat', 'cym.crash1', 'cym.crash2', 'cym.ride'] },
    { text: 'The floor line (M01’s floor).', dims: ['yFloor'] },
    { text: `The cymbal family’s drawing defaults: ${CYMBAL_DRAWING_DEFAULTS.join('; ')}.`, dims: [] },
    { text: `The drum family’s drawing defaults: ${DRUM_DRAWING_DEFAULTS.join('; ')}.`, dims: [] },
  ],
  live: { wedges: M11_WEDGES },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every kit, room and show is different: move the mics, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a typical 5-piece kit in a right-handed layout, mics at illustrative starting places (each drum’s own lesson has its numbers), straight-line arrival times at 20 °C and mic patterns as textbook shapes. The channel counts describe a plan — they never grade it. Place real mics with the drummer stopped.',
  copy: M11_COPY,
};
