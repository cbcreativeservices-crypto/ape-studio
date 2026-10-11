/**
 * SPEAKER CABINET & LESLIE MODULE (id SPK, Lab 1 "Amplified speakers &
 * Leslie") — the lesson as DATA. Words from the owner's module
 * (docs/labs/miking/source_text/Speaker-Cabinet-and-Leslie-Miking-Module.txt,
 * "L<n>" in COMMENTS only), with the fixes in CORRECTIONS_LOG.md (SPK-01 …)
 * applied. Research: docs/labs/miking/speaker_leslie/.
 *
 * Owner ruling 2026-10-04: suggested starting points, never dogma; no
 * source, brand or model names, no badges, no Sources page. The internal
 * record lives in the code-only fields and in docs/. FULLY SILENT.
 *
 * Other lessons link here: guitar, bass, harmonica and the two electric
 * pianos mic a speaker; the organ lessons mic a rotary cabinet.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, LessonPages, PageContent, SourcePageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { OPPOSITE_SIDES_POLARITY, micRatingCheck } from '../../engine/model/sharedItems.ts';
import { SPK_CABS } from './geometry.ts';
import { SPK_MICS } from './model.ts';
import { cabLayout } from '../shared/speakers/speakerModel.ts';
import { ROTORS } from '../shared/speakers/rotor.ts';

const CAB = SPK_CABS['1x12'];
const FLOOR = cabLayout('1x12').floorY;

const pages: LessonPages = {
  instrument: {
    title: 'Meet the speakers',
    goal: 'Get to know what a mic on a speaker really hears — the cone, the cabinet and the rotary cabinet — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A mic on a cabinet hears the AIR the speaker moves: one speaker, its box and the room. Find the speaker that is really sounding before you place anything. A rotary cabinet has a turning horn and a turning drum in one box, and it stays closed.',
  },
  sound: {
    title: 'How a speaker sounds',
    goal: 'See how a signal becomes moving air, how a speaker spreads its sound, and how a rotary cabinet makes it swirl.',
    credit: { scenarios: ['spk.snd.1', 'spk.snd.2', 'spk.snd.3'], interactive: 'soundPath', note: 'Step the cone through to the end, take the rotary cabinet to fast once (or step it there), and answer the three checks.' },
    takeaway: 'The cone pushes the air in front and pulls it behind — an open back sounds out too, opposite in polarity. The higher the pitch, the narrower the speaker beams. In a rotary cabinet the horn carries the highs and the drum the lows; they change speed at different rates.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the signal path from player to mic, what sits around a cabinet on a stage and in a studio — and what to do before any mic.',
    credit: { scenarios: ['spk.set.1', 'spk.set.2', 'spk.set.3'], note: 'Answer the three checks.' },
    takeaway: 'Ask what feeds the cabinet and which speaker is active. A direct output is a separate electrical path, not the cabinet’s air. A rotary cabinet stays closed: everything goes outside, clear of its openings, the pedals and the walkways. Protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for a speaker by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['spk.mic.1', 'spk.mic.2', 'spk.mic.3', 'spk.mic.4', 'spk.rec.1'], note: 'Answer the five checks (one reaches back to how a speaker sounds).' },
    takeaway: 'Pattern, power, size and mount decide what a mic can do in front of a speaker. Dynamics and condensers both work there; a condenser is not a feedback problem just because it is more sensitive. Compare by ear, at matched level.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin on a cabinet — measured from the grille, on the active speaker — then build a rotary cabinet’s pickup from outside, in stages.',
    credit: { scenarios: ['spk.place.1', 'spk.place.2', 'spk.place.3', 'spk.rec.2'], interactive: 'twoZones', note: 'Rest the mic in two different suggested starting points on a cabinet, build an upper-and-lower rotary-cabinet pickup with the cabinet switched off, and answer the four checks.' },
    takeaway: 'Measure from the grille, on the speaker that is sounding, and change one thing at a time: across the cone OR away from it. A rotary cabinet is miked from outside, upper and lower, in stages — never through a louver.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim a cabinet mic so its pattern’s rejection faces a monitor — and know what a studio and a stage each ask of a speaker and a rotary cabinet.',
    credit: { scenarios: ['spk.ctx.1', 'spk.ctx.2', 'spk.ctx.studio', 'spk.ctx.leslie', 'spk.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the guitarist’s wedge sits in the rejection. STUDIO: answer the decision card. Then the four checks.' },
    takeaway: 'A close, directional cabinet mic hears more of the amp and less of the stage. A cardioid rejects most directly behind; real nulls are shallower than the simplified picture. A rotary cabinet is already loud: reinforce only what the audience needs, and check the mono feed.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'Blend a front and a rear mic on an open-backed cabinet: see what polarity does and does not change — and how a rotary cabinet’s mics add up in mono.',
    credit: { scenarios: ['spk.two.1', 'spk.two.2', 'spk.two.3', 'spk.two.4'], interactive: 'polarityVsDelay', note: 'Flip the rear mic’s polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'The back of the cone is opposite in polarity to the front: flipping the rear mic is the first thing to try, never a rule — judge the pair in mono, at matched levels. Polarity flips the sign; it does not remove a delay. Spaced rotary-cabinet mics move against each other; an X/Y pair stays steadier in mono.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Move the mic before reaching for tone controls: across the cone, toward or away from the grille, one change at a time — and on a rotary cabinet, from outside.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one cabinet mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second channel.',
    credit: { scenarios: ['spk.prac.order', 'spk.prac.gain', 'spk.prac.setup1', 'spk.prac.setup2', 'spk.prac.3', 'spk.mix.1', 'spk.mix.2', 'spk.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real amp or cabinet.' },
    takeaway: 'Safe placement outside the cabinet, correct power and level checks, one change at a time, and a mono check of every blend pass. More than one setup can pass; a brand never does.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only: spk.snd.* L3, L8, L6 + 122H
 * rotor table · spk.set.* L5, L27-L28, L55-L56 · spk.mic.* L8, L25 ·
 * spk.place.* L8, L13, L27-L37 · spk.ctx.* L51-L53 · spk.two.* L22 + Mills
 * rear-mic note, L46-L49 · spk.prac.* / spk.mix.* L57-L64.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'spk.snd.1',
    page: 'sound',
    prompt: 'An open-backed cabinet sounds out behind as well as in front. How does the sound from the back compare?',
    options: ['The same motion of the cone, opposite in polarity', 'A delayed echo of the front, in the same polarity', 'Nothing a mic placed behind it could pick up'],
    correct: 'The same motion of the cone, opposite in polarity',
    explain: 'When the cone moves forward it pushes the air in front and pulls the air behind at the same moment: the back radiates the same motion, opposite in polarity. Its balance differs, because the magnet and frame sit in the way.',
    why: {
      'A delayed echo of the front, in the same polarity': 'It is not an echo: it leaves the back of the cone at the same moment — and opposite, because the back pulls while the front pushes.',
      'Nothing a mic placed behind it could pick up': 'With an open back the rear of the cone sounds straight out behind: a mic there hears it well.',
    },
  },
  {
    id: 'spk.snd.2',
    page: 'sound',
    prompt: 'Why does a mic aimed at the middle of a guitar speaker tend to sound brighter than one aimed toward its edge?',
    options: ['At higher pitches, the middle of the cone does more of the work', 'The edge of the cone moves too fast for the mic to follow', 'The dust cap filters the bass out before the sound can leave it'],
    correct: 'At higher pitches, the middle of the cone does more of the work',
    explain: 'At low pitches the whole cone moves as one. Higher up, the cone flexes, and more of the high-frequency sound comes from the middle, near the voice coil. Close in, the spot the mic faces tilts the balance — a tendency to check on each speaker.',
    why: {
      'The edge of the cone moves too fast for the mic to follow': 'The edge does not outrun the mic. At higher pitches the middle of the cone, near the voice coil, does more of the work.',
      'The dust cap filters the bass out before the sound can leave it': 'The dust cap moves with the cone; it filters nothing. More of the highs simply come from the middle.',
    },
  },
  {
    id: 'spk.snd.3',
    page: 'sound',
    prompt: 'You switch a rotary cabinet from slow to fast. Why can the upper and lower sound swirl at different rates for a while?',
    options: ['The horn and the low rotor speed up at different rates', 'The crossover sends the change of speed to the horn rotor only', 'The woofer itself turns more slowly than the horn'],
    correct: 'The horn and the low rotor speed up at different rates',
    explain: 'In the cabinet drawn here the horn reaches its fast speed in under two seconds; the heavier low rotor takes several seconds longer. The speed change itself is part of the performance.',
    why: {
      'The crossover sends the change of speed to the horn rotor only': 'The crossover splits the SOUND at 800 Hz; both rotors change speed, at different rates.',
      'The woofer itself turns more slowly than the horn': 'The woofer does not turn: it fires down into the turning drum below it.',
    },
  },
  {
    id: 'spk.set.1',
    page: 'setting',
    prompt: 'The guitarist’s amp has a direct (DI) output as well as its speaker. What is the DI channel?',
    options: ['A separate electrical path, not the air from the cabinet', 'A cleaner copy of exactly what a mic on the speaker would hear', 'A mic already built into the amplifier’s speaker'],
    correct: 'A separate electrical path, not the air from the cabinet',
    explain: 'A mic hears the air the speaker moves, with the cabinet and the room. A direct output is an electrical signal from inside the amp — label it as its own source, and do not assume it carries the speaker’s distortion or the cabinet’s tone.',
    why: {
      'A cleaner copy of exactly what a mic on the speaker would hear': 'It never passes through the speaker, the cabinet or the room, so it is a different sound, not a copy.',
      'A mic already built into the amplifier’s speaker': 'It is an electrical output, not a mic. Identify it by its actual connector and level.',
    },
  },
  micRatingCheck({ id: 'spk.set.2', page: 'setting', mic: 'amp mic', loudest: 'the amp at full stage level' }),
  {
    id: 'spk.set.3',
    page: 'setting',
    prompt: 'A rotary cabinet sounds dull from outside. A friend suggests pushing the mic in through a louver. What do you do?',
    options: ['Keep it outside, and move or angle it from there', 'Push it in a little, as long as the cable stays out', 'Take the back panel off, for this session only'],
    correct: 'Keep it outside, and move or angle it from there',
    explain: 'There are turning parts and hot parts inside, and the cabinet carries dangerous voltages. The mics stay on stands outside: try another distance, a side louver or a small angle change.',
    why: {
      'Push it in a little, as long as the cable stays out': 'Nothing goes through a louver — not a capsule, a cable, a finger or a tool: the rotors turn right behind it.',
      'Take the back panel off, for this session only': 'The cabinet stays assembled: panels and covers come off only for a qualified technician.',
    },
  },
  {
    id: 'spk.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Close to the speaker and aimed at the middle of the cone, a mic tends to hear…',
    options: ['a brighter, more present sound than toward the edge', 'only the bass, because the middle of the cone moves the most', 'the back of the cone, through the dust cap'],
    correct: 'a brighter, more present sound than toward the edge',
    explain: 'At higher pitches the middle of the cone does more of the work, so a close mic aimed there tends to sound brighter — a tendency, and speakers vary.',
    why: {
      'only the bass, because the middle of the cone moves the most': 'At low pitches the whole cone moves as one; it is the HIGHS that come more from the middle.',
      'the back of the cone, through the dust cap': 'The dust cap is part of the moving cone: in front of it, the mic hears the front of the cone.',
    },
  },
  {
    id: 'spk.mic.1',
    page: 'microphone',
    prompt: 'The guitar channel has no phantom power. Which of this page’s mic types can you still use?',
    options: ['The two dynamics: neither needs power to work', 'The small condenser, kept a little back from the grille', 'The small condenser, as long as the amp is switched on'],
    correct: 'The two dynamics: neither needs power to work',
    explain: 'Dynamic mics need no power. This condenser needs phantom power from the desk, wherever it is placed.',
    why: {
      'The small condenser, kept a little back from the grille': 'Distance does not change what this condenser needs: it still needs phantom power.',
      'The small condenser, as long as the amp is switched on': 'The amp powers the speaker, not the mic. The condenser needs phantom from the desk.',
    },
  },
  {
    id: 'spk.mic.2',
    page: 'microphone',
    prompt: 'A bass cabinet has four 10 in speakers and a small horn. What may a mic close to one cone miss?',
    options: ['The horn’s highs, and how the speakers add up together', 'Nothing at all, since the four speakers in it sound alike', 'Only the lowest notes, which the horn plays'],
    correct: 'The horn’s highs, and how the speakers add up together',
    explain: 'A single cone mic may not represent the whole cabinet: a horn adds the highest frequencies, and several speakers add up differently out in the room. Listen to what each part contributes.',
    why: {
      'Nothing at all, since the four speakers in it sound alike': 'Even matched speakers add up differently away from the cabinet, and the horn adds what no cone gives.',
      'Only the lowest notes, which the horn plays': 'A horn carries the HIGHEST frequencies, not the lowest.',
    },
  },
  {
    id: 'spk.mic.3',
    page: 'microphone',
    prompt: 'Some engineers like a condenser on a guitar cabinet, others a dynamic. What does that tell you?',
    options: ['Both can suit; compare them by ear at matched level', 'A condenser is the more accurate choice for a guitar amp', 'A dynamic is required, because a speaker is loud'],
    correct: 'Both can suit; compare them by ear at matched level',
    explain: 'Different mics give different tones and both types are used on speakers. Check the mic’s level rating and power, then compare by ear at the same reproduced level.',
    why: {
      'A condenser is the more accurate choice for a guitar amp': 'Accuracy is not the only aim on a guitar amp; compare the two on this cabinet by ear.',
      'A dynamic is required, because a speaker is loud': 'Many condensers handle a loud speaker — check the mic’s own rating rather than ruling a type out.',
    },
  },
  {
    id: 'spk.mic.4',
    page: 'microphone',
    prompt: 'On stage, does a condenser cause more feedback simply because it is more sensitive?',
    options: ['Not by itself — compare mics at the same useful level', 'Yes, since its higher output reaches the PA first', 'Only when it sits closer to the grille than a dynamic'],
    correct: 'Not by itself — compare mics at the same useful level',
    explain: 'Sensitivity alone does not decide feedback: at the same reproduced level, the pattern, the placement and the monitors decide it. The gain is simply set lower for a more sensitive mic.',
    why: {
      'Yes, since its higher output reaches the PA first': 'The gain is set for the same useful level, so the higher output is simply turned down at the desk.',
      'Only when it sits closer to the grille than a dynamic': 'Closer to the source usually HELPS gain before feedback. Pattern and monitors matter more.',
    },
  },
  {
    id: 'spk.place.1',
    page: 'placement',
    prompt: 'A starting point says “2.5–5 cm (1–2 in)”. Measured from what?',
    options: ['From the grille cloth, in front of the active speaker', 'From the back of the cone, measured inside the cabinet', 'From the cabinet’s top edge, measured downward'],
    correct: 'From the grille cloth, in front of the active speaker',
    explain: 'The grille is the surface you can see and measure from — and the number belongs to the speaker that is really sounding, not the middle of the cabinet.',
    why: {
      'From the back of the cone, measured inside the cabinet': 'Nothing is measured from inside the cabinet: you cannot see or reach it. The grille is the reference.',
      'From the cabinet’s top edge, measured downward': 'That gives a height, not the distance to the speaker. Measure out from the grille, on the speaker’s axis.',
    },
  },
  {
    id: 'spk.place.2',
    page: 'placement',
    prompt: 'You slide the mic from the centre of the cone toward its edge, keeping the same distance. What should you expect?',
    options: ['A mellower sound, as a tendency to check', 'A louder sound with a fixed lift in the bass', 'No change, since the distance has not moved'],
    correct: 'A mellower sound, as a tendency to check',
    explain: 'Most often the edge sounds mellower or warmer than the centre — speakers vary, so listen. Keeping the distance fixed means you hear the effect of the move across the cone, nothing else.',
    why: {
      'A louder sound with a fixed lift in the bass': 'These are tendencies, not fixed amounts. Toward the edge most often sounds mellower, not louder.',
      'No change, since the distance has not moved': 'The spot on the cone matters as well as the distance: that is why you keep one fixed while changing the other.',
    },
  },
  {
    id: 'spk.place.3',
    page: 'placement',
    prompt: 'You are placing mics on a rotary cabinet. When and where do they go?',
    options: ['On stands outside the louvers, with the cabinet off', 'Inside the top compartment, close to the turning horn', 'Clipped onto the louvers so that they cannot fall'],
    correct: 'On stands outside the louvers, with the cabinet off',
    explain: 'Plan the stands with the cabinet off, keep every mic and cable outside and clear of the openings, then ask for slow, fast and speed-change passages — without reaching toward the cabinet while it runs.',
    why: {
      'Inside the top compartment, close to the turning horn': 'The cabinet stays closed: the horn turns there, and there are hot and live parts.',
      'Clipped onto the louvers so that they cannot fall': 'Nothing is fixed to the openings: they must stay clear for the sound and the air.',
    },
  },
  {
    id: 'spk.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Which of these is NOT the air from the cabinet?',
    options: ['The amp’s direct (DI) output', 'A mic in front of the grille', 'A mic behind an open back'],
    correct: 'The amp’s direct (DI) output',
    explain: 'A direct output is a separate electrical path. Both mics hear air from the speaker — the front and the back of the cone.',
    why: {
      'A mic in front of the grille': 'That mic hears the air in front of the cone — the cabinet’s own sound.',
      'A mic behind an open back': 'That mic hears the air behind the cone — still the cabinet’s air, opposite in polarity.',
    },
  },
  {
    id: 'spk.ctx.1',
    page: 'context',
    prompt: 'On a loud stage, why might you start with a close, directional mic on a guitar cabinet?',
    options: ['More of the amp, less of the stage, and more gain before feedback', 'A close mic makes the amp itself sound louder out in the audience', 'A mic farther back could not pick up a guitar speaker'],
    correct: 'More of the amp, less of the stage, and more gain before feedback',
    explain: 'Close and directional favours the cabinet over the drums and the monitors — the usual live reasons. In a quiet studio a farther mic may add a useful room.',
    why: {
      'A close mic makes the amp itself sound louder out in the audience': 'The mic does not change the amp’s own level in the room; it changes what reaches the PA.',
      'A mic farther back could not pick up a guitar speaker': 'It can — in a studio that is a common choice. On stage it would also hear the stage.',
    },
  },
  {
    id: 'spk.ctx.2',
    page: 'context',
    prompt: 'The guitarist’s wedge is downstage, facing back toward them — behind your cardioid cabinet mic. Where does a cardioid reject most?',
    options: ['Directly behind it, where that wedge sits', 'At its sides, about ninety degrees off its axis', 'In front of it, toward the speaker it faces'],
    correct: 'Directly behind it, where that wedge sits',
    explain: 'A cardioid rejects most at 180°. The mic faces the cabinet, so its back faces downstage — toward that wedge. Real nulls are shallower than the simplified pattern, and often shallowest in the lows.',
    why: {
      'At its sides, about ninety degrees off its axis': 'At 90° a cardioid still picks up about half (−6 dB). Its deepest rejection is directly behind.',
      'In front of it, toward the speaker it faces': 'That is where it picks up MOST — the speaker it is aimed at.',
    },
  },
  {
    id: 'spk.ctx.studio',
    page: 'context',
    prompt: 'Studio session, a good-sounding room, no monitors on the floor. What could justify a mic farther back from the cabinet?',
    options: ['The room adds something useful to the sound', 'A farther mic picks up more of the low end', 'It removes the need for a close mic'],
    correct: 'The room adds something useful to the sound',
    explain: 'A farther mic hears the cabinet and the room together: worth it when the room helps. Compare at matched level, and keep a close option if the amp shares the room with other players.',
    why: {
      'A farther mic picks up more of the low end': 'Farther back, a directional mic usually hears LESS low end (less proximity effect).',
      'It removes the need for a close mic': 'Often the two are blended, or the close mic is kept for isolation — the far mic is a perspective, not a replacement.',
    },
  },
  {
    id: 'spk.ctx.leslie',
    page: 'context',
    prompt: 'Live, a mono PA, and a rotary cabinet on stage. Which pickup is a sensible start?',
    options: ['An upper and a lower mic outside, checked in mono', 'A spaced stereo pair, for the widest possible sound', 'A room pair, because the cabinet is loud already'],
    correct: 'An upper and a lower mic outside, checked in mono',
    explain: 'A mono PA can use one upper and one lower channel. Stereo upper mics are optional and must be checked in mono; distant room mics hear the PA and cut the feedback margin.',
    why: {
      'A spaced stereo pair, for the widest possible sound': 'A mono PA cannot show width, and a spaced pair can sound uneven when summed — start simpler.',
      'A room pair, because the cabinet is loud already': 'Room mics on stage hear the PA and the band; they reduce the margin before feedback.',
    },
  },
  {
    id: 'spk.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Why do a rotary cabinet’s upper louvers and lower openings sound different?',
    options: ['The horn carries the highs; the low rotor carries the lows', 'The upper louvers sit closer to the organist', 'The lower openings are partly blocked by the floor under them'],
    correct: 'The horn carries the highs; the low rotor carries the lows',
    explain: 'A crossover splits the sound: above about 800 Hz to the horn up top, below it to the woofer and the drum at the bottom. That is why one upper mic may lack the low register.',
    why: {
      'The upper louvers sit closer to the organist': 'The difference is inside the cabinet: the crossover sends highs up and lows down.',
      'The lower openings are partly blocked by the floor under them': 'The lower openings radiate fine; they carry the LOW part of the sound.',
    },
  },
  {
    id: 'spk.two.1',
    page: 'twoMic',
    prompt: 'A front mic and a rear mic on an open-backed cabinet sound thin together. What do you try first?',
    options: ['Flip the rear mic’s polarity, then check in mono', 'Turn the rear mic up until it matches the front', 'Move the front mic right up against the grille'],
    correct: 'Flip the rear mic’s polarity, then check in mono',
    explain: `${OPPOSITE_SIDES_POLARITY} Then adjust positions if it is still thin.`,
    why: {
      'Turn the rear mic up until it matches the front': 'More level deepens the cancellation. The rear mic starts opposite: try flipping its polarity first.',
      'Move the front mic right up against the grille': 'Touching the grille risks noise and does not fix the polarity: the back of the cone is still opposite.',
    },
  },
  {
    id: 'spk.two.2',
    page: 'twoMic',
    prompt: 'You flip the rear mic’s polarity. What happens to the arrival-time difference between the two mics?',
    options: ['Nothing — polarity flips the sign, not the timing', 'It drops to zero, so the two arrivals line up', 'It doubles, because the copy is now inverted'],
    correct: 'Nothing — polarity flips the sign, not the timing',
    explain: 'Polarity inversion reverses the signal’s sign: the notches move, the delay does not. Only moving a mic changes when the sound arrives.',
    why: {
      'It drops to zero, so the two arrivals line up': 'The mics are still the same distance from the cone: the delay stays.',
      'It doubles, because the copy is now inverted': 'Polarity has no time in it. Only a mic’s position changes the delay.',
    },
  },
  {
    id: 'spk.two.3',
    page: 'twoMic',
    prompt: 'Two upper mics, one each side of a rotary cabinet, are panned left and right. What should you check?',
    options: ['The sum in mono, through a full turn and a speed change', 'That both meters move together while it plays', 'That the horn faces one of the two side mics while it is at rest'],
    correct: 'The sum in mono, through a full turn and a speed change',
    explain: 'As the horn turns it faces one side mic, then the other: the two arrive at different times and levels. That can sound wide in stereo and uneven in mono — so listen in mono, across a whole rotation and a speed change.',
    why: {
      'That both meters move together while it plays': 'Moving meters say nothing about how the pair sums. Listen to the mono sum.',
      'That the horn faces one of the two side mics while it is at rest': 'The horn turns: what matters is the sum through the whole rotation, not one resting position.',
    },
  },
  {
    id: 'spk.two.4',
    page: 'twoMic',
    prompt: 'Why might an X/Y pair at the upper louvers hold up in mono better than two spaced side mics?',
    options: ['Its capsules sit at one point, so the arrivals line up', 'It has twice the output of a spaced pair at the same distance', 'Its mics face away from the turning horn'],
    correct: 'Its capsules sit at one point, so the arrivals line up',
    explain: 'In an X/Y pair the capsules are as close to coincident as the mounts allow, so there is little time difference between them: the mono sum stays steadier. Spaced mics can give a larger, more moving picture — check them in mono.',
    why: {
      'It has twice the output of a spaced pair at the same distance': 'Output is not the reason: the coincident capsules hear the sound at the same moment.',
      'Its mics face away from the turning horn': 'The X/Y pair faces the louvers; its advantage is that both capsules sit at one point.',
    },
  },
  {
    id: 'spk.prac.gain',
    page: 'practice',
    prompt: 'Normal playing sits well below the overload light, but the solo’s loudest chords light it. What do you do?',
    options: ['Lower the input gain, or use a pad its manual allows, and re-check', 'Pull the channel fader down until the loudest chords sound clean again', 'Ask the player to turn the amp down for the solo only'],
    correct: 'Lower the input gain, or use a pad its manual allows, and re-check',
    explain: 'Set the input gain with headroom for the loudest passage — on a rotary cabinet, the fastest speed change too — and watch the overload light. A lower fader does not undo clipping at the input.',
    why: {
      'Pull the channel fader down until the loudest chords sound clean again': 'The overload happens at the input, before the fader; a lower fader only makes the clipped sound quieter.',
      'Ask the player to turn the amp down for the solo only': 'Set the gain for the loudest passage the player intends — the amp is part of their sound.',
    },
  },
  {
    id: 'spk.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second channel on a guitar cabinet?',
    options: ['Each mic works alone, the pair adds something, it holds up in mono', 'Two channels simply give the mix engineer more to work with later on', 'The guitar needs more level in the mix than one mic gives'],
    correct: 'Each mic works alone, the pair adds something, it holds up in mono',
    explain: 'A second mic should earn its place in the combined sound. If the pair goes thin or uneven, move a mic, flip polarity where it belongs, or leave it out.',
    why: {
      'Two channels simply give the mix engineer more to work with later on': 'More channels also add spill and interactions; a second mic must improve the combined sound.',
      'The guitar needs more level in the mix than one mic gives': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'spk.mix.1',
    page: 'practice',
    prompt: 'A starting point says “15–30 cm (6–12 in), on the axis”. Before you place the mic, what else do you need to know?',
    options: ['Which speaker is sounding, and that it is measured from the grille', 'The amp’s brand, so the number matches its speaker', 'Nothing more: the number on its own tells you exactly where it goes'],
    correct: 'Which speaker is sounding, and that it is measured from the grille',
    explain: 'A distance belongs to its reference — the grille — and to the speaker that is really active. Clearance is a separate check again.',
    why: {
      'The amp’s brand, so the number matches its speaker': 'The reference is the grille in front of the active speaker; a brand does not change that.',
      'Nothing more: the number on its own tells you exactly where it goes': 'Without the speaker and the reference surface the number places nothing.',
    },
  },
  {
    id: 'spk.mix.2',
    page: 'practice',
    prompt: 'Live, the rotary cabinet already sounds big in the room. What do you send to the PA?',
    options: ['Only what the audience needs, often upper and lower', 'All the mics you have, so nothing is missed', 'A room pair, to capture the space and the band on stage'],
    correct: 'Only what the audience needs, often upper and lower',
    explain: 'The cabinet is already loud in the room: reinforce what the audience needs, and let the system operator route the PA, monitors and recording separately.',
    why: {
      'All the mics you have, so nothing is missed': 'Each open mic adds spill and lowers the feedback margin. Open only what is needed.',
      'A room pair, to capture the space and the band on stage': 'Room mics on stage hear the PA itself — keep them out of the PA, if they are used at all.',
    },
  },
  {
    id: 'spk.mix.3',
    page: 'practice',
    prompt: 'Two cabinet mics sound thin together. Which change removes the arrival-time difference itself?',
    options: ['Moving a mic so that the two paths are closer to equal', 'Flipping the polarity switch on one of the two mics', 'Turning the later mic up until it matches the earlier'],
    correct: 'Moving a mic so that the two paths are closer to equal',
    explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth; neither removes the delay.',
    why: {
      'Flipping the polarity switch on one of the two mics': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
      'Turning the later mic up until it matches the earlier': 'Level changes the depth of the notches, not where they are or the delay behind them.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 's.fizz',
    observation: 'Too bright or fizzy',
    firstChecks: 'Keep the distance; move from the inner cone toward the outer cone on the same speaker.',
    options: ['Keep the distance and move toward the outer cone, step by step', 'Turn the amp’s treble control down before you try moving the mic', 'Push the mic right against the grille cloth'],
    correct: 'Keep the distance and move toward the outer cone, step by step',
    explain: 'One variable at a time: the same distance, a move across the cone. Listen to presence, attack, hiss and the midrange.',
    why: {
      'Turn the amp’s treble control down before you try moving the mic': 'The amp is the player’s sound. Move the mic first.',
      'Push the mic right against the grille cloth': 'Touching the grille adds noise and changes two things at once. Move across the cone instead.',
    },
  },
  {
    id: 's.dull',
    observation: 'Too dull, missing articulation',
    firstChecks: 'Return toward the active cone’s inner region; compare a modest angle change without touching the grille.',
    options: ['Back toward the inner cone, then a small angle change', 'Add treble on the channel before moving the mic', 'Move the mic over to a different speaker in the same cabinet'],
    correct: 'Back toward the inner cone, then a small angle change',
    explain: 'Return toward the middle of the active speaker and try a modest angle change — and confirm the player’s actual tone at the cabinet.',
    why: {
      'Add treble on the channel before moving the mic': 'Placement first: EQ cannot restore articulation the mic is not hearing.',
      'Move the mic over to a different speaker in the same cabinet': 'Stay on the active speaker; a different one may not be the one sounding best — or at all.',
    },
  },
  {
    id: 's.dry',
    observation: 'Too dry or narrow',
    firstChecks: 'Move the mic farther back to a safe position, keeping its aim; audition the room.',
    options: ['Move it back, keeping its aim, and listen to the room', 'Add reverb on the channel before moving the mic or anything else', 'Put a second mic right next to the first one'],
    correct: 'Move it back, keeping its aim, and listen to the room',
    explain: 'Farther back the mic hears more of the cabinet and the room — check early reflections, the other players and PA spill.',
    why: {
      'Add reverb on the channel before moving the mic or anything else': 'Try the real room first: a farther mic may give the space you want.',
      'Put a second mic right next to the first one': 'Two mics side by side hear almost the same thing — and can comb. Move one back instead.',
    },
  },
  {
    id: 's.thin2',
    observation: 'Two mics sound thin together',
    firstChecks: 'Hear each mic alone, then the sum in mono; check polarity and the positions.',
    options: ['Each alone, then the mono sum; polarity and positions', 'Turn both channels up until the sound fills out', 'Invert one mic and keep that, whatever it sounds like'],
    correct: 'Each alone, then the mono sum; polarity and positions',
    explain: 'Judge the pair together: each mic alone, the mono sum at matched levels, both polarity states — and a rear mic on an open back starts out inverted.',
    why: {
      'Turn both channels up until the sound fills out': 'More level does not fix a cancellation; it makes the thin sound louder.',
      'Invert one mic and keep that, whatever it sounds like': 'Compare BOTH polarity states by ear, in mono; polarity is a diagnostic, not a fix for a delay.',
    },
  },
  {
    id: 's.buffet',
    observation: 'Low thumps on the rotary cabinet’s lower mic',
    firstChecks: 'Change its aim or position outside the cabinet; try a windscreen if the mic allows it.',
    options: ['Change its aim or position outside; try a windscreen', 'Take a cover off so the mic is out of the moving air', 'Cut the lows with a filter and carry on playing'],
    correct: 'Change its aim or position outside; try a windscreen',
    explain: 'The turning drum moves air: buffeting. Angle the mic so the air passes it, or move it, from outside — and use a windscreen if the mic is made for one.',
    why: {
      'Take a cover off so the mic is out of the moving air': 'The cabinet stays closed: covers come off only for a technician.',
      'Cut the lows with a filter and carry on playing': 'A filter cannot recover a signal the wind has already distorted. Move the mic first.',
    },
  },
  {
    id: 's.wrong',
    observation: 'The sound does not match what the player hears at the amp',
    firstChecks: 'Confirm which speaker is actually sounding, and the mic’s position on it.',
    options: ['Which speaker is really sounding, and where the mic is on it', 'Turn the amp up so that its sound reaches the mic more strongly', 'Swap in a condenser before checking anything else'],
    correct: 'Which speaker is really sounding, and where the mic is on it',
    explain: 'In a cabinet with several speakers they may not sound the same — or one may not work. Find the active one, then the spot on it.',
    why: {
      'Turn the amp up so that its sound reaches the mic more strongly': 'Level does not make the mic hear a different speaker. Check which one it is in front of.',
      'Swap in a condenser before checking anything else': 'No mic type fixes a mic on the wrong speaker. Check the speaker and the position first.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'spk.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic cabinet setup in the order you would do them.',
    steps: [
      { text: 'Ask the player what feeds the cabinet and which speaker is active', early: 'Start with the player and the cabinet.' },
      { text: 'With the amp off or muted, mark the dust cap and outer cone from outside the grille', early: 'Find the speaker once you know which one is active.' },
      { text: 'Mount the mic on a stand in front of that speaker, clear of the grille; route the cable', early: 'You need to know where the speaker is before you mount the mic.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom if it is needed', early: 'Power comes after the mic is mounted and connected — with the outputs muted first.' },
      { text: 'Set input gain on the loudest passage, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare positions one change at a time, at matched levels', early: 'Compare only once the level is set safely — at matched levels, so louder does not win.' },
      { text: 'Keep the simplest position that works, and log it', early: 'Decide last, after comparing.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before connecting, disconnecting or switching it, and follow your own equipment’s manual. On a rotary cabinet, place every mic outside with the cabinet off, then set the gain on the loudest passage and the fastest speed change.',
  },
];

const POWER_REASON: SetupReason = { id: 'r.power', label: 'The channel gives the mic the power it needs (phantom, or none)', role: 'required', feedback: 'Say how the mic is powered: the condensers here need phantom; a dynamic needs none.' };
const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a suggested starting point, measured from the right reference', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from — the grille, or the cabinet’s outside.' };
const CLEAR_REASON: SetupReason = { id: 'r.clear', label: 'Mic, stand and cable stay outside, clear of the grille, vents and walkways', role: 'required', feedback: 'Clearance is part of every passing setup — and nothing goes inside a cabinet.' };
const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand most engineers reach for on an amp', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' };
const BASS_REASON: SetupReason = { id: 'r.bass', label: 'It will give the most bass of any position', role: 'wrong', feedback: 'Bass emphasis is not a passing reason, and no position gives the most bass on every cabinet.' };

const setupTasks: SetupTask[] = [
  {
    id: 'spk.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A loud club stage, a guitar combo with one 12 in speaker, a mono PA. One channel; phantom power is available.',
    setups: [
      { id: 'a', label: 'Instrument dynamic close in front of the speaker, aimed at the dust-cap edge', ok: true, power: 'none', feedback: 'A suggested starting point, close and directional for a loud stage; a dynamic needs no power.' },
      { id: 'b', label: 'Small condenser about 5–15 cm from the grille, on the active speaker', ok: true, power: 'phantom', feedback: 'Close and directional, and this channel has the phantom power it needs.' },
      { id: 'c', label: 'Instrument dynamic right at the grille, on the centre of the cone', ok: true, power: 'none', feedback: 'A brighter starting point; fine if it suits the player’s tone — keep it off the cloth.' },
      { id: 'd', label: 'A mic 60–90 cm back from the cabinet, for the room', ok: false, power: 'none', feedback: 'On a loud stage that hears the drums and monitors and lowers the margin before feedback.' },
      { id: 'e', label: 'A dynamic pressed against the grille cloth so it cannot move', ok: false, power: 'none', feedback: 'Keep the mic off the cloth: contact adds noise and can damage both.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'Close, directional pickup helps against stage spill and feedback', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, BASS_REASON],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point measured from the grille, clearance, and power that matches the mic.',
  },
  {
    id: 'spk.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A rotary cabinet in a studio; the organist wants the bass notes to carry. Two inputs, and NO phantom power.',
    setups: [
      { id: 'a', label: 'One dynamic outside the upper louvers, one outside a lower opening (front)', ok: true, power: 'none', feedback: 'An upper-and-lower pickup from outside; dynamics need no phantom.' },
      { id: 'b', label: 'One dynamic outside the upper louvers, one about 7.5 cm outside the back lower opening', ok: true, power: 'none', feedback: 'The organist’s rear-opening variation, from outside, needing no phantom.' },
      { id: 'c', label: 'Two dynamics at the two upper sides, no lower mic', ok: false, power: 'none', feedback: 'Upper mics alone may leave the low register short — and this organist wants the bass notes.' },
      { id: 'd', label: 'A small-condenser X/Y pair on the upper louvers', ok: false, power: 'phantom', feedback: 'These inputs have no phantom power, and there is no lower channel left.' },
      { id: 'e', label: 'A dynamic inside the open back, close to the drum', ok: false, power: 'none', feedback: 'The cabinet stays closed: every mic goes outside.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.mono', label: 'Upper and lower are checked alone, then blended and checked in mono', role: 'optional', feedback: 'A good habit with any multi-mic pickup.' }, BRAND_REASON, BASS_REASON],
    explain: 'Two outside pickups pass. What passes is the reasoning: upper and lower from outside, clear of the openings, powered by what these inputs can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: when the cone moves forward, what does the air BEHIND it do?', options: ['It is pulled toward the cone', 'It is pushed away too', 'Nothing — only the front air moves'], after: 'Now STEP through (or PLAY ONCE), with the back open and closed.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Toward the rear, off to one side'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: keeping the distance, you slide the mic from the centre toward the edge. What changes?', options: ['Brighter', 'Mellower', 'It depends on this speaker'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'Where will this cardioid reject the guitarist’s wedge best?', options: ['Straight behind the mic', 'At the sides of the mic', 'In front of the mic'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION.' },
  twoMic: { prompt: 'If you flip the rear mic’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip REAR POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

/* THE QUICK CHECK: 6 items, two per foundation page; q.5 (a rotary cabinet's
 * openings) and q.6 (hearing) are critical. It opens the activities; it
 * credits NOTHING. */
const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'A cabinet holds four speakers. Which one does a close mic hear most?',
    options: ['The one it is in front of — so find the active one first', 'All four equally, wherever the mic sits', 'The loudest of the four, wherever in front the mic happens to sit'],
    correct: 'The one it is in front of — so find the active one first',
    explain: 'Close in, a mic hears mostly the speaker in front of it. Speakers in one cabinet may differ, or one may not be working: find the active one first.',
    why: {
      'All four equally, wherever the mic sits': 'Close to the grille the mic hears mostly the speaker it faces; between speakers it can hear strong phase effects.',
      'The loudest of the four, wherever in front the mic happens to sit': 'Distance decides more than loudness this close: it is the speaker in front of the mic.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What is a speaker’s dust cap?',
    options: ['The dome in the middle of the cone, over the coil', 'The cloth stretched over the front of the cabinet', 'The flexible ring round the edge of the cone'],
    correct: 'The dome in the middle of the cone, over the coil',
    explain: 'The dust cap covers the voice coil at the middle of the cone; its edge is a common first aiming point.',
    why: {
      'The cloth stretched over the front of the cabinet': 'That is the grille cloth — the surface the distances are measured from.',
      'The flexible ring round the edge of the cone': 'That is the surround, which lets the cone move.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'In a rotary cabinet, what carries the high notes?',
    options: ['The horn rotor in the upper compartment', 'The low rotor’s turning drum, in the bottom', 'The woofer, firing straight up at the louvers'],
    correct: 'The horn rotor in the upper compartment',
    explain: 'A crossover sends the highs (above about 800 Hz) to the horn rotor at the top, and the lows to the woofer and the turning drum at the bottom.',
    why: {
      'The low rotor’s turning drum, in the bottom': 'The drum carries the LOWS, from the woofer above it.',
      'The woofer, firing straight up at the louvers': 'The woofer fires DOWN into the drum, and it carries the lows.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'A speaker cone moves forward. The air behind it is…',
    options: ['pulled — the back sounds opposite in polarity', 'pushed out of the back too, at the same moment', 'still — only the front of a cone moves air'],
    correct: 'pulled — the back sounds opposite in polarity',
    explain: 'The cone pushes the air in front and pulls the air behind at the same moment: an open back radiates the same motion, opposite in polarity.',
    why: {
      'pushed out of the back too, at the same moment': 'Moving forward, the cone pushes the FRONT air and pulls the back air.',
      'still — only the front of a cone moves air': 'Both faces of the cone move air; an open back lets the rear sound out.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'A rotary cabinet is running. Where may a mic or its cable go?',
    options: ['Outside on a stand, clear of the openings and pedals', 'Through a louver, while the cabinet is on slow', 'Just inside the back, held well clear of the rotor'],
    correct: 'Outside on a stand, clear of the openings and pedals',
    explain: 'There are turning parts, hot parts and dangerous voltages inside. Everything stays outside, clear of the openings, the organ pedals and the walkways.',
    why: {
      'Through a louver, while the cabinet is on slow': 'Nothing goes through a louver at any speed: the rotors turn right behind it.',
      'Just inside the back, held well clear of the rotor': 'The cabinet stays closed; panels come off only for a qualified technician.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: 'Your mic is rated for a very high SPL. What does that tell you about standing by a loud amp all through soundcheck?',
    options: ['Nothing — it is the mic’s distortion limit, not a hearing limit', 'It is safe for a while, as long as the amp stays below the level of the mic’s rating', 'It is safe as long as the mic is closer than you are'],
    correct: 'Nothing — it is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'It is safe for a while, as long as the amp stays below the level of the mic’s rating': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      'It is safe as long as the mic is closer than you are': 'Where the mic sits says nothing about your ears. Measure where the person listens.',
    },
  },
];

const h = ROTORS.horn;
const d = ROTORS.drum;

export const SPK_LESSON: Lesson = {
  id: 'SPK',
  labId: 'drums',
  title: 'Amplified speakers & Leslie',
  subtitle: 'Guitar and bass cabinets, and the rotary cabinet — from outside',
  noun: { one: 'speaker cabinet', many: 'speaker cabinets' },
  model: CAB.model,
  micTypeIds: [...SPK_MICS],
  zones: CAB.zones,
  setupPairs: [{ label: 'A front mic and a mic behind the open back', A: { zone: 'cab.boundary' }, B: { zone: 'cab.rear', polarity: -1 }, variants: ['open'] }],
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A loudspeaker in a box. The amplifier drives a paper cone that pushes the air. A mic on a cabinet hears that air — the speaker, the box and the room — not the instrument’s electrical signal.', src: 'LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'Guitar and bass amps, amplified harmonica and electric pianos, and organs played through a rotary cabinet (the Leslie) — on stage and in the studio. Those lessons all send you here for the speaker itself.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'The speaker and its box are part of the instrument’s sound: a guitarist’s tone is the amp AND the speaker. In a rotary cabinet the turning horn and drum make the sound swirl — the motion is part of the performance.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'A 12 in speaker is about 31 cm across. A 1×12 cabinet is about 50 cm wide, a 4×12 about 77 cm and a 4×10 bass cabinet about 76 cm; the rotary cabinet drawn here is about 74 × 52 × 104 cm. This lab draws one of each.', src: 'MAR-MX112 / MAR-1960A / AMP-410 / HAM-122H / CEL-V30' },
  ],
  sound: {
    stages: [
      { title: 'The signal reaches the voice coil', text: 'The amplifier’s signal flows through the voice coil, which sits in the magnet’s gap behind the cone.' },
      { title: 'The cone moves as one', text: 'The coil pushes against the magnet’s field and drives the cone forward and back. At low pitches the whole cone moves together, like a piston — drawn here many times larger than it really moves.' },
      { title: 'Push in front, pull behind', text: 'As the cone moves forward it pushes the air in front of it and pulls the air behind it — at the same moment, opposite ways.' },
      { title: 'Sound leaves', text: 'Sound leaves the front, through the grille. With a closed back, the sound from the back of the cone stays in the box.', ported: 'Sound leaves the front, through the grille — and the back, through the open back, opposite in polarity. A mic behind the cabinet hears it inverted.' },
    ],
    attack: 'The start of each note — the pick, the key or the reed — reaches the cone as its first push. A close mic aimed at the middle of the cone tends to hear more of that edge and brightness.',
    body: 'The held tone, with the cabinet’s own resonance and the room. A mic toward the edge of the cone, or farther back, tends to hear more of it. Both are tendencies, and speakers vary.',
    head: { diameterMm: 305, rods: 0, label: '12 in speaker, face-on', strikeSrc: 'CEL-V30' },
  },
  setting: {
    items: [
      { id: 'player', label: 'the player and the instrument', short: 'PLAYER', note: 'Guitar, bass, harmonica, an electric piano or an organ. Ask what feeds the cabinet, and how they want it to sound.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'ASK FIRST', scene: 'kit' },
      { id: 'amp', label: 'the amplifier (or the organ)', short: 'AMP', note: 'It turns the instrument’s small signal into the power that moves the speaker — and shapes the tone. Its settings are the player’s.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'PLAYER’S TONE', scene: 'kit' },
      { id: 'cab', label: 'the speaker cabinet', short: 'CABINET', note: 'The speaker turns the power into moving air. Find the speaker that is really sounding: in a multi-speaker cabinet they may not all sound the same.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'THE SOURCE', scene: 'kit' },
      { id: 'air', label: 'the air and the room', short: 'AIR', note: 'The mic hears the air: the speaker, the box and the room together. Closer means more speaker; farther means more room.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'WHAT A MIC HEARS', scene: 'kit' },
      { id: 'mic', label: 'the microphone and the desk', short: 'MIC → DESK', note: 'An airborne pickup: what the mic hears goes to the desk, where the gain is set.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'AIR PATH', scene: 'kit' },
      { id: 'di', label: 'a direct (DI) output', short: 'DIRECT OUT', note: 'A separate ELECTRICAL path from inside the amp or organ. Label it as its own source; it may lack the speaker’s and the room’s sound — or carry a simulated cabinet.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'NOT THE AIR', scene: 'kit' },
      { id: 'wedge', label: 'the guitarist’s wedge', short: 'WEDGE', note: 'A floor monitor downstage, facing back toward the player — behind a cabinet mic aimed at the speaker.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'drums', label: 'the drum kit', short: 'DRUMS', note: 'A loud neighbour. A close, directional cabinet mic hears more of the amp and less of the kit.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'stage' },
      { id: 'organ', label: 'the organ, its bench and pedals', short: 'ORGAN', note: 'The organist sits here; the pedals and the walkway stay clear of stands and cables. The rotary cabinet stands beside, stable on the floor.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'leslie', label: 'the rotary cabinet', short: 'ROTARY CAB', note: 'Closed, with its openings clear. Mics on stands outside; cables away from the vents and the turning parts.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'OUTSIDE ONLY', scene: 'all' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'The cabinets are already loud in the room: the PA adds only what the audience needs.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a quiet studio a farther mic or a pair can add the room — when it sounds good.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: backline amps, monitors on the floor, a drum kit and a PA. Close, directional pickup hears more of each amp and less of the stage, with more gain before feedback.',
    studio: 'STUDIO: no wedges on the floor, time to compare positions, and a room that may add something — a farther mic or a pair can help.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic cabinet setup for a given amp and show, describe an alternative, and say what would justify a second channel — then build a rotary cabinet’s pickup from outside. With a real amp and the player’s agreement, you can log what you tried below.',
    fields: [
      { id: 'source', label: 'Source and channel (which speaker, or upper / lower)', kind: 'text' },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['instrument dynamic', 'small condenser', 'large dynamic', 'other'] },
      { id: 'site', label: 'Capsule site, distance from the grille, angle', kind: 'text' },
      { id: 'pattern', label: 'Pattern', kind: 'text' },
      { id: 'tone', label: 'Tone and any issue heard (tendencies, in words)', kind: 'text' },
      { id: 'speeds', label: 'Rotor speeds tested (rotary cabinet)', kind: 'text' },
      { id: 'mono', label: 'Stereo and mono check', kind: 'text' },
      { id: 'notes', label: 'Stands, cables, covers checked; final choice and its limitation', kind: 'text' },
    ],
  },
  // INTERNAL record (never shown).
  unknowns: [
    { text: 'Whether each cabinet stands on the floor, raised or tilted: drawn standing on the floor — so no HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The 12 in speaker’s dust-cap radius (50), the surround’s inner edge (128), the cone depth (58) and dome height (16): drawing defaults (not on the datasheet).', dims: [] },
    { text: 'The grille cloth’s distance proud of the baffle (15) and the panel thickness (18): drawing defaults.', dims: [] },
    { text: 'Driver layout on the 4×12 and bass baffles, the 4×12’s angle (8°), the bass horn’s position and size: drawing defaults. Back type of the 1×12 and 4×12: not stated.', dims: [] },
    { text: 'A rear-mic distance behind an open back: none in the research; 5–15 cm is a drawing default.', dims: [] },
    { text: 'The rotary cabinet: rotor sizes and heights, the louver and opening layout, the drum’s scoop shape, which face is the front, and the DIRECTION of rotation — drawing defaults (rotation drawn counter-clockwise from above, never taught). On the classic cabinet one horn bell sounds and the other is a blocked balance bell (review Lab 1 M7): the second bell is drawn capped and the mic light follows the sounding bell only.', dims: [] },
    { text: `Rotor speeds and ramp times are one adjustable cabinet’s defaults: horn ${h.slowRpm}/${h.fastRpm} rpm, ${h.riseS} s up, ${h.fallS} s down; low rotor ${d.slowRpm}/${d.fastRpm} rpm, ${d.riseS} s up, ${d.fallS} s down; the ramps are drawn linear.`, dims: [] },
  ],
  // The stage's monitors (ILLUSTRATIVE positions): the guitarist's wedge
  // downstage facing upstage (behind a cabinet mic), and a side fill across
  // the stage (no null reaches it).
  live: {
    wedges: [
      {
        id: 'guitarWedge',
        label: 'the guitarist’s wedge, downstage, facing back toward the player',
        short: 'WEDGE',
        p: { x: 1900, y: FLOOR, z: 0 },
        lift: 150,
        faces: { x: -1, y: 0, z: 0 },
        note: 'It sits downstage of the player, behind a mic that faces the cabinet — where a cardioid rejects most.',
        prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
      },
      {
        id: 'sideFill',
        label: 'a side-fill monitor at the side of the stage',
        short: 'SIDE FILL',
        p: { x: 700, y: FLOOR, z: -1500 },
        lift: 150,
        faces: { x: 0, y: 0, z: 1 },
        note: 'It sits off to the side, about ninety degrees off the mic’s axis: no cardioid null reaches it. Distance and level do the work there.',
        prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
      },
    ],
  },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. Every speaker, cabinet, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: one 12 in speaker as the reference, three cabinets, and one classic two-rotor cabinet — its rotor sizes, openings and direction of turning are drawing choices, while its speeds and the times it takes to change speed are the maker’s own figures. Cone motion is drawn larger, mic patterns are textbook shapes, and distances are rounded to about 5 mm and measured to the mic’s front. Never open a rotary cabinet; place mics with the amp off or muted.',
};
