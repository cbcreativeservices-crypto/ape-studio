/**
 * C04 PEDAL STEEL AND LAP STEEL (Lab 4, Strings) — the lesson as DATA. Words
 * from the owner's lesson
 * (docs/labs/miking/source_text/Pedal-Steel-and-Lap-Steel-Miking-Technique.txt,
 * "L<n>" in COMMENTS only), with the fixes in CORRECTIONS_LOG.md (PS-01 …)
 * applied: the steel amp's manual cannot be reached today, so its
 * model-specific claims (a "microphone-simulated" XLR, the tilt foot, running
 * without a speaker, its speaker-cable note) are taught generically.
 *
 * Owner ruling 2026-10-04: suggested starting points; no source, brand or
 * model names; no badges; FULLY SILENT. The miked source is the AMP; the
 * instrument is drawn to name its parts and keep the player's pedals and knee
 * levers clear.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, LessonPages, PageContent, SourcePageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { OPPOSITE_SIDES_POLARITY } from '../../engine/model/sharedItems.ts';
import { C04_MODEL, C04_ZONES } from './geometry.ts';
import { C04_MICS } from './model.ts';

const FLOOR = C04_MODEL.yFloor.mm;

const pages: LessonPages = {
  instrument: {
    title: 'Meet the steel and its amp',
    goal: 'Get to know the pedal steel and the lap steel — the bar, the pedals, the knee levers, the changer, the pickup — and the amp they play through, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The strings start the sound; the bar, the pedals and the knee levers change the pitches; the pickup makes the signal; the volume pedal and the amp shape it. The mic hears the amp’s speaker.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how the bar, a pedal and the pickup shape a steel string’s signal, and how the signal becomes moving air. Shown, never played.',
    credit: { scenarios: ['ps.snd.1', 'ps.snd.2', 'ps.snd.3'], interactive: 'soundPath', note: 'Step through three harmonics and move the bar, step the cone through to the end, and answer the three checks.' },
    takeaway: 'The bar is a movable fret: the shorter the sounding length, the higher the note. A pedal or knee lever changes a string’s tension at the changer. The pickup senses its own spot on the string; the speaker does the rest.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the path from the strings to the desk — the volume pedal, the amp, the direct taps — the player’s keep-clear space, and what to do before any mic.',
    credit: { scenarios: ['ps.set.1', 'ps.set.2', 'ps.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The player’s feet and knees work the pedals, knee levers and volume pedal while they play: no stand or cable there. A direct output is electrical, its own source. A speaker output goes only to a speaker.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for a steel amp by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['ps.mic.1', 'ps.mic.2', 'ps.mic.3', 'ps.mic.4', 'ps.rec.1'], note: 'Answer the five checks (one reaches back to how it sounds).' },
    takeaway: 'A dynamic is robust close up on a stage; a condenser can be tried where its rating, pad, mounting and spill suit. Neither guarantees a tone: compare by ear, at matched level.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin on the steel’s amp — close, at the dust cap’s edge — then move across the cone or away from it, one change at a time.',
    credit: { scenarios: ['ps.place.1', 'ps.place.2', 'ps.place.3', 'ps.rec.2'], interactive: 'twoZones', note: 'Rest the mic in two different recommended starting points, clear of every part, and answer the four checks.' },
    takeaway: 'General amp practice, tested on a steel amp: measure from the grille on the real speaker, change one thing at a time, and set the gain for the biggest attack and the volume pedal’s full travel.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim a steel-amp mic so its rejection faces the loudest monitor — by the mic’s real pattern — and keep the stage safe for the player.',
    credit: { scenarios: ['ps.ctx.1', 'ps.ctx.2', 'ps.ctx.3', 'ps.ctx.studio', 'ps.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the steel player’s wedge sits in the rejection. STUDIO: answer the decision card. Then the four checks.' },
    takeaway: 'Aim by the mic’s real pattern: a supercardioid’s rear lobe makes “monitor directly behind” unreliable. Keep the stand low, stable and out of the pedal and knee-lever zone; a tilted amp must stand firm.',
  },
  twoMic: {
    title: 'Two sources',
    goal: 'Blend a front and a rear mic on an open-backed amp — or a mic and a direct path — and see what polarity does and does not change.',
    credit: { scenarios: ['ps.two.1', 'ps.two.2', 'ps.two.3'], interactive: 'polarityVsDelay', note: 'Flip the polarity both ways AND move a mic so the delay changes, then answer the three checks.' },
    takeaway: 'Capture one good close mic first. A rear mic needs a real open back; a direct path arrives before the mic. Solo each, sum in mono, move or rebalance, then try polarity — a test, not a fix.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all eight symptoms (a retry is explained, never penalised).' },
    takeaway: 'Small moves across the cone before EQ; gain for the loudest realistic passage; for anything electrical you are unsure of, stop.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one amp mic for a steel player in the right order, choose and justify a setup for two briefs, and say what would justify a second channel.',
    credit: { scenarios: ['ps.prac.order', 'ps.prac.gain', 'ps.prac.setup1', 'ps.prac.setup2', 'ps.prac.3', 'ps.mix.1', 'ps.mix.2', 'ps.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real rig.' },
    takeaway: 'Find the speaker, keep the pedal and knee-lever zone clear, set the gain for the swell’s peak and the hardest attack, compare at matched level, and check every blend in mono.',
  },
};

/* THE CHECKS. Lesson lines in comments only: ps.snd.* L6-L7 + stringModel ·
 * ps.set.* L6, L36, L39, L44-L45 · ps.mic.* L31 · ps.place.* L9, L29 ·
 * ps.ctx.* L39-L40 · ps.two.* L35-L37 · ps.prac/mix L29, L44, L72-L77. */
const scenarios: MikingScenario[] = [
  {
    id: 'ps.snd.1',
    page: 'sound',
    prompt: 'The player slides the bar to half-way along the sounding length. What happens to the pitch?',
    options: ['It falls an octave, since less string is left to vibrate', 'It rises an octave — half the length, twice the pitch', 'It stays the same: the bar only changes the tone'],
    correct: 'It rises an octave — half the length, twice the pitch',
    explain: 'The bar is a movable fret: only the string between the bar and the bridge vibrates. Half the length sounds twice the frequency — an octave up.',
    why: {
      'It falls an octave, since less string is left to vibrate': 'A shorter vibrating length sounds HIGHER, not lower.',
      'It stays the same: the bar only changes the tone': 'The bar sets the vibrating length, and with it the pitch.',
    },
  },
  {
    id: 'ps.snd.2',
    page: 'sound',
    prompt: 'A pedal raises one string by a whole tone. What does it change at the changer?',
    options: ['The string’s length, by moving the bridge along', 'The pickup’s position under that string', 'The string’s tension — about a quarter more'],
    correct: 'The string’s tension — about a quarter more',
    explain: 'Pitch rises with the square root of tension: a whole tone (× 1.12 in frequency) needs about × 1.26 the tension. The pedal rods pull the changer’s fingers to do it.',
    why: {
      'The string’s length, by moving the bridge along': 'The changer pulls the string tighter; the sounding length stays.',
      'The pickup’s position under that string': 'The pickup does not move; the string’s tension does.',
    },
  },
  {
    id: 'ps.snd.3',
    page: 'sound',
    prompt: 'Where does most of the sound you will mic come from?',
    options: ['The strings themselves, through the air just above the steel’s neck', 'The pedals and knee levers, as the player moves them', 'The amp’s speaker, fed by the pickup and the volume pedal'],
    correct: 'The amp’s speaker, fed by the pickup and the volume pedal',
    explain: 'The strings start the sound; the pickup turns their motion into a signal; the volume pedal and effects shape it; the amp and speaker make what you mic. No mic goes near the hands or under the instrument.',
    why: {
      'The strings themselves, through the air just above the steel’s neck': 'An electric steel is quiet in the air; the speaker makes the sound you mic.',
      'The pedals and knee levers, as the player moves them': 'They change pitches mechanically; they make no sound to mic.',
    },
  },
  {
    id: 'ps.set.1',
    page: 'setting',
    prompt: 'Where may the amp mic’s stand and cable go?',
    options: ['Under the steel, between the pedal rods', 'Clear of the pedals, knee levers and volume pedal', 'Against the player’s knees, where it has a steady base to lean on'],
    correct: 'Clear of the pedals, knee levers and volume pedal',
    explain: 'The player’s feet and knees work while they play. A stand or cable in that zone can block a pedal or a knee lever, or trip someone. Keep the mic at the amp.',
    why: {
      'Under the steel, between the pedal rods': 'That is exactly the player’s working zone — nothing goes there.',
      'Against the player’s knees, where it has a steady base to lean on': 'The knees work the knee levers; keep everything clear.',
    },
  },
  {
    id: 'ps.set.2',
    page: 'setting',
    prompt: 'Some steel amps have an XLR output that imitates a miked speaker. What is it?',
    options: ['A microphone built into the amp, aimed at the speaker', 'An electrical output — its own source, not a mic', 'The same signal a mic on the speaker would capture'],
    correct: 'An electrical output — its own source, not a mic',
    explain: 'A “simulated mic” output is still electrical: it never passes through the air. Where it is taken and what it imitates are in that amp’s own manual. Label it as its own channel.',
    why: {
      'A microphone built into the amp, aimed at the speaker': 'There is no capsule: it is a filtered electrical copy.',
      'The same signal a mic on the speaker would capture': 'It may resemble it, but it hears no speaker, cabinet or room.',
    },
  },
  {
    id: 'ps.set.3',
    page: 'setting',
    prompt: 'The steel amp is tilted back on a stand for the player. What do you check?',
    options: ['That the mic touches its grille to steady it', 'That it stands firm and cannot tip if bumped', 'That the tilt points the speaker at the wedge'],
    correct: 'That it stands firm and cannot tip if bumped',
    explain: 'A tilted amp must be mechanically stable — follow its own manual for any tilt foot or stand. A falling amp is a danger to people and equipment.',
    why: {
      'That the mic touches its grille to steady it': 'A mic never touches the grille, and it is no support.',
      'That the tilt points the speaker at the wedge': 'An amp aimed at a monitor or open mic raises spill and feedback.',
    },
  },
  {
    id: 'ps.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Why might the steel’s quiet swells and its sharp attacks need careful gain?',
    options: ['A steel amp has no volume control of its own to set the level', 'The pickup gets louder as the bar moves up', 'The volume pedal can take a quiet note to a loud peak'],
    correct: 'The volume pedal can take a quiet note to a loud peak',
    explain: 'A smooth swell can end in a much louder peak, and a picked attack can jump above the sustain. Set the gain for the loudest realistic moment.',
    why: {
      'A steel amp has no volume control of its own to set the level': 'It does; the player’s volume pedal moves the level during the music.',
      'The pickup gets louder as the bar moves up': 'Bar position changes the pitch, not the pickup’s output in that way.',
    },
  },
  {
    id: 'ps.mic.1',
    page: 'microphone',
    prompt: 'A dynamic or a condenser on the steel amp: what decides it?',
    options: ['A condenser, because a steel is a gentle instrument', 'Its rating, pad, mount and spill — then your ears', 'A dynamic, because a condenser cannot sit near an amp'],
    correct: 'Its rating, pad, mount and spill — then your ears',
    explain: 'A dynamic is robust on a stage; a condenser can be tried when its level rating, pad, mounting and spill suit. Neither guarantees a tone — compare at matched level.',
    why: {
      'A condenser, because a steel is a gentle instrument': 'The mic hears the amp, which can be loud; choose by properties.',
      'A dynamic, because a condenser cannot sit near an amp': 'Many condensers handle a loud amp; check its own rating.',
    },
  },
  {
    id: 'ps.mic.2',
    page: 'microphone',
    prompt: 'The channel has no phantom power. Which of this page’s mic types can you still use?',
    options: ['The small condenser, kept a little farther back', 'The two dynamics: neither needs power', 'The small condenser, while the amp is switched on'],
    correct: 'The two dynamics: neither needs power',
    explain: 'Dynamics need no power; a condenser needs phantom from the desk wherever it is placed.',
    why: {
      'The small condenser, kept a little farther back': 'Distance does not change what a condenser needs.',
      'The small condenser, while the amp is switched on': 'The amp powers its speaker, not the mic.',
    },
  },
  {
    id: 'ps.mic.3',
    page: 'microphone',
    prompt: 'Next to vocal mics on a busy stage, which pattern habit helps the steel mic?',
    options: ['Point its front straight at the vocal mic to cancel it out', 'Aim its rejection at the loudest competing source', 'Choose an omni so that all the sources are balanced'],
    correct: 'Aim its rejection at the loudest competing source',
    explain: 'Use the mic’s real pattern: face the speaker, and turn its rejection toward the loudest neighbour or monitor.',
    why: {
      'Point its front straight at the vocal mic to cancel it out': 'The front is where a mic picks up most.',
      'Choose an omni so that all the sources are balanced': 'An omni hears the stage all round — more spill, not less.',
    },
  },
  {
    id: 'ps.mic.4',
    page: 'microphone',
    prompt: 'Does a condenser cause feedback just because it is more sensitive?',
    options: ['Yes, since its higher output reaches the PA first', 'Only when it sits closer to the grille than a dynamic', 'Not by itself — compare at the same useful level'],
    correct: 'Not by itself — compare at the same useful level',
    explain: 'At the same reproduced level, pattern, placement and monitors decide feedback; the gain is simply set lower for a more sensitive mic.',
    why: {
      'Yes, since its higher output reaches the PA first': 'The gain is set for the same useful level.',
      'Only when it sits closer to the grille than a dynamic': 'Closer usually HELPS gain before feedback.',
    },
  },
  {
    id: 'ps.place.1',
    page: 'placement',
    prompt: 'Where do these amp starting points come from, for a steel?',
    options: ['Measurements made on one famous steel player’s rig', 'Fixed rules that hold for all steel amps ever made', 'General amp practice, to test on the steel’s amp'],
    correct: 'General amp practice, to test on the steel’s amp',
    explain: 'After our research, these are general starting points for miking an amp’s speaker — an informed experiment on a steel rig, checked by ear.',
    why: {
      'Measurements made on one famous steel player’s rig': 'They are general speaker practice, not one player’s numbers.',
      'Fixed rules that hold for all steel amps ever made': 'They are starting points, not rules; every amp differs.',
    },
  },
  {
    id: 'ps.place.2',
    page: 'placement',
    prompt: 'High notes and bar attacks sound sharp and brittle at the dust cap’s centre. What first?',
    options: ['Cut the treble on the amp first, before moving the mic or anything else', 'Move the mic back and change its angle in one go', 'Slide toward the cap’s edge or outer cone, same distance'],
    correct: 'Slide toward the cap’s edge or outer cone, same distance',
    explain: 'One change at a time: slide across the cone first, compare at matched level, then try an angle.',
    why: {
      'Cut the treble on the amp first, before moving the mic or anything else': 'The amp is the player’s sound; move the mic first.',
      'Move the mic back and change its angle in one go': 'Two changes at once: you cannot tell which helped.',
    },
  },
  {
    id: 'ps.place.3',
    page: 'placement',
    prompt: 'The steel loses definition in the full band. What do you try?',
    options: ['Move the mic farther back for more of the room around the steel amp', 'Turn the steel amp up until it cuts through the band', 'Shift back toward the cap’s edge, then judge it in the band'],
    correct: 'Shift back toward the cap’s edge, then judge it in the band',
    explain: 'The outer cone or a farther position can soften the steel too much in a dense mix. Return toward the cap’s edge and listen with the band.',
    why: {
      'Move the mic farther back for more of the room around the steel amp': 'More room usually blurs definition further.',
      'Turn the steel amp up until it cuts through the band': 'That raises exposure and spill; move the mic first.',
    },
  },
  {
    id: 'ps.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Which of these hears the air from the steel’s amp?',
    options: ['The amp’s simulated-mic output', 'A mic in front of the speaker', 'A DI box before the amp'],
    correct: 'A mic in front of the speaker',
    explain: 'Only a mic hears the speaker’s air. The other two are electrical paths — separate sources.',
    why: {
      'The amp’s simulated-mic output': 'Electrical, even when it imitates a mic.',
      'A DI box before the amp': 'Electrical, taken before the amp and the speaker.',
    },
  },
  {
    id: 'ps.ctx.1',
    page: 'context',
    prompt: 'On stage, why a close mic on a low, stable stand?',
    options: ['A low stand makes the amp sound warmer in the room', 'Because a taller stand would pick up the knee levers moving nearby', 'Isolation from drums and wedges, and nothing in the way'],
    correct: 'Isolation from drums and wedges, and nothing in the way',
    explain: 'Close and directional hears more of the steel and less of the stage; low and stable stays out of the player’s reach and cannot tip into the speaker.',
    why: {
      'A low stand makes the amp sound warmer in the room': 'The stand does not change the amp’s sound in the room.',
      'Because a taller stand would pick up the knee levers moving nearby': 'The knee levers make no sound; the reason is isolation and safety.',
    },
  },
  {
    id: 'ps.ctx.2',
    page: 'context',
    prompt: 'Your mic is a supercardioid. Is its deepest rejection off to each side of the rear, rather than straight behind?',
    options: ['No — a directional mic rejects most of all straight behind itself', 'No, it rejects the same all the way round the back', 'Yes — near 125° each side; a small lobe sits straight behind'],
    correct: 'Yes — near 125° each side; a small lobe sits straight behind',
    explain: 'A supercardioid rejects most near 125° each side, with a small lobe straight behind. Aim by the mic’s real pattern.',
    why: {
      'No — a directional mic rejects most of all straight behind itself': 'Only a cardioid rejects most at 180°. So “put the monitor directly behind it” suits a cardioid, not this mic.',
      'No, it rejects the same all the way round the back': 'The rejection changes with angle: deepest near 125° each side, with a small lobe straight behind.',
    },
  },
  {
    id: 'ps.ctx.3',
    page: 'context',
    prompt: 'The steel mic is bleeding into a nearby vocal channel. What first?',
    options: ['Raise the steel amp until the vocal mic is drowned out in the mix', 'Turn the vocal mic toward the steel amp to match', 'Lower the amp level a little, then rework mic and amp aim'],
    correct: 'Lower the amp level a little, then rework mic and amp aim',
    explain: 'Coordinate the amp and the PA: a steel amp pushed loud for its mic tone masks others and bleeds into vocals. Lower, then revise the geometry.',
    why: {
      'Raise the steel amp until the vocal mic is drowned out in the mix': 'Louder makes the bleed worse.',
      'Turn the vocal mic toward the steel amp to match': 'That puts even more steel in the vocal channel.',
    },
  },
  {
    id: 'ps.ctx.studio',
    page: 'context',
    prompt: 'Studio, a good room. What could justify a farther mic on the steel’s amp?',
    options: ['A farther mic sounds more like the steel itself', 'The room adds space the close mic lacks', 'It removes the need for the close mic'],
    correct: 'The room adds space the close mic lacks',
    explain: 'Capture a good close mic first; add a farther mic only if the room helps, and check the blend in mono — distance means delay.',
    why: {
      'A farther mic sounds more like the steel itself': 'It hears more room, not necessarily more of the steel.',
      'It removes the need for the close mic': 'It is a perspective to blend, not a replacement.',
    },
  },
  {
    id: 'ps.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Why must the mic stand stay out of the zone under the pedal steel?',
    options: ['The pedal rods put a hum into a mic cable that runs nearby', 'The player’s feet and knees work there while playing', 'The steel’s body shades the mic from its amp'],
    correct: 'The player’s feet and knees work there while playing',
    explain: 'Pedals, knee levers and the volume pedal are played continuously. Nothing may block them or trip the player.',
    why: {
      'The pedal rods put a hum into a mic cable that runs nearby': 'The reason is the player’s space and safety.',
      'The steel’s body shades the mic from its amp': 'The mic is at the amp, not under the steel.',
    },
  },
  {
    id: 'ps.two.1',
    page: 'twoMic',
    prompt: 'When is a rear mic on the steel’s amp worth trying?',
    options: ['On a closed-back amp just as on an open one', 'Only on a cabinet with a real open back', 'Only when the amp is tilted back'],
    correct: 'Only on a cabinet with a real open back',
    explain: `A rear mic needs sound coming out of the back. On a closed cabinet, there is little to hear behind it. On an open back: ${OPPOSITE_SIDES_POLARITY}`,
    why: {
      'On a closed-back amp just as on an open one': 'A closed back keeps the rear sound in the box.',
      'Only when the amp is tilted back': 'Tilt has nothing to do with an open back.',
    },
  },
  {
    id: 'ps.two.2',
    page: 'twoMic',
    prompt: 'You flip one source’s polarity. What happens to the arrival-time difference?',
    options: ['It drops to zero, so the two arrivals now line up exactly', 'It doubles, because one copy is now inverted', 'Nothing — polarity flips the sign, not the timing'],
    correct: 'Nothing — polarity flips the sign, not the timing',
    explain: 'Only moving a mic (or delaying a direct path) changes the timing. Polarity moves the notches.',
    why: {
      'It drops to zero, so the two arrivals now line up exactly': 'The paths are unchanged: so is the delay.',
      'It doubles, because one copy is now inverted': 'Polarity has no time in it.',
    },
  },
  {
    id: 'ps.two.3',
    page: 'twoMic',
    prompt: 'You split a passive steel pickup into several inputs for a direct path. What is the risk?',
    options: ['The pickup’s signal turns into speaker-level power', 'Nothing: a passive pickup sounds the same anywhere', 'Loading the pickup can change its tone and level'],
    correct: 'Loading the pickup can change its tone and level',
    explain: 'A passive pickup is sensitive to what it feeds. Use a proper instrument-level splitter or DI that preserves its loading — not several unknown inputs in parallel.',
    why: {
      'The pickup’s signal turns into speaker-level power': 'A pickup’s signal is small; the risk is loading, not power.',
      'Nothing: a passive pickup sounds the same anywhere': 'What a passive pickup feeds changes how it sounds.',
    },
  },
  {
    id: 'ps.prac.gain',
    page: 'practice',
    prompt: 'The sustain sits well under the overload light, but the swell’s peak and a hard bar attack light it. What do you do?',
    options: ['Pull the channel fader down until the swell peaks sound clean again', 'Lower the input gain, or use a pad its manual allows, and re-check', 'Ask the player to keep the volume pedal half-way for the gig'],
    correct: 'Lower the input gain, or use a pad its manual allows, and re-check',
    explain: 'Set the gain for the loudest realistic moment — the full volume-pedal travel and the hardest attack. A lower fader does not undo input clipping.',
    why: {
      'Pull the channel fader down until the swell peaks sound clean again': 'The overload is at the input, before the fader.',
      'Ask the player to keep the volume pedal half-way for the gig': 'The volume pedal is part of how they play; set the gain for it.',
    },
  },
  {
    id: 'ps.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second source on the steel’s amp?',
    options: ['Two channels simply give the mix engineer more to work with later', 'The steel needs more level in the mix than one mic can give', 'Each works alone, the blend adds something, and it holds in mono'],
    correct: 'Each works alone, the blend adds something, and it holds in mono',
    explain: 'A second mic or direct path must earn its place, for a stated goal; otherwise keep the one good close mic.',
    why: {
      'Two channels simply give the mix engineer more to work with later': 'More channels also add spill and interactions.',
      'The steel needs more level in the mix than one mic can give': 'Level comes from gain and the fader.',
    },
  },
  {
    id: 'ps.mix.1',
    page: 'practice',
    prompt: 'Before you place the amp mic, what else do you need besides a distance?',
    options: ['The amp’s brand and model, so that the number fits its speaker', 'Nothing more: the number places the mic by itself', 'The real speaker’s position, and the grille as reference'],
    correct: 'The real speaker’s position, and the grille as reference',
    explain: 'A distance belongs to its reference — the grille — and to the speaker that is really there. Clearance is a separate check.',
    why: {
      'The amp’s brand and model, so that the number fits its speaker': 'A brand changes nothing about the reference.',
      'Nothing more: the number places the mic by itself': 'Without the speaker and the reference the number places nothing.',
    },
  },
  {
    id: 'ps.mix.2',
    page: 'practice',
    prompt: 'A cable at the amp is damaged and the amp smells hot. What now?',
    options: ['Finish the soundcheck at a lower level first, then deal with it', 'Stop, keep clear, and call a qualified technician', 'Open the amp and look for the problem yourself'],
    correct: 'Stop, keep clear, and call a qualified technician',
    explain: 'Damaged cable, abnormal heat, smoke or a shock are stop conditions. Never open a chassis or change wiring for mic work.',
    why: {
      'Finish the soundcheck at a lower level first, then deal with it': 'A possible fault comes first: stop.',
      'Open the amp and look for the problem yourself': 'The inside is hot and live: a technician’s job.',
    },
  },
  {
    id: 'ps.mix.3',
    page: 'practice',
    prompt: 'Which change removes the arrival-time difference between the amp mic and a direct path?',
    options: ['Delaying the direct path to line up with the mic', 'Flipping the polarity switch on one channel', 'Turning the later source up until it matches the earlier one'],
    correct: 'Delaying the direct path to line up with the mic',
    explain: 'Only the paths — or a deliberate delay — set the timing. Moving the mic closer only shrinks the gap: the speaker and the amp add their own lag. Polarity moves the notches; level changes their depth.',
    why: {
      'Flipping the polarity switch on one channel': 'Polarity flips the sign; the delay stays.',
      'Turning the later source up until it matches the earlier one': 'Level changes the notches’ depth, not the delay.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 's.hum',
    observation: 'Hum or buzz on the DI channel',
    firstChecks: 'Is it a cable, a shared power circuit, or the DI’s audio ground? Swap one cable at a time; then try the DI’s ground-lift switch, as its manual describes.',
    options: ['Swap one cable at a time, then try the DI’s ground lift', 'Pull the earth pin off the amp’s mains plug to break the loop', 'Turn the DI channel up so the steel playing covers the hum'],
    correct: 'Swap one cable at a time, then try the DI’s ground lift',
    explain: 'A DI’s ground-lift switch breaks only the audio ground at its XLR output; the amp’s mains earth stays connected. If one cable at a time and the lift do not cure it, stop and get a qualified technician.',
    why: {
      'Pull the earth pin off the amp’s mains plug to break the loop': 'Never. The mains earth is the safety path that stops a fault becoming a shock. Only a qualified technician deals with mains wiring.',
      'Turn the DI channel up so the steel playing covers the hum': 'More gain raises the hum with the instrument.',
    },
  },
  {
    id: 's.brittle',
    observation: 'Upper notes sound sharp or brittle',
    firstChecks: 'Is the mic near the dust-cap centre? Move toward the cap’s edge or outer cone; compare on real playing.',
    options: ['Toward the cap’s edge or outer cone; compare on real playing', 'Cut the amp’s treble before moving the mic at all', 'Push the mic right up against the grille cloth to tame the highs'],
    correct: 'Toward the cap’s edge or outer cone; compare on real playing',
    explain: 'The centre tends to be brightest. Slide outward at the same distance, and judge it on the player’s real phrases.',
    why: {
      'Cut the amp’s treble before moving the mic at all': 'The amp is the player’s sound; move the mic first.',
      'Push the mic right up against the grille cloth to tame the highs': 'Touching the grille adds noise; move across the cone instead.',
    },
  },
  {
    id: 's.lost',
    observation: 'The steel loses definition',
    firstChecks: 'Is the mic too far toward the outer cone, or the steel masked in the mix? Shift toward the cap’s edge, then judge it in the full band.',
    options: ['Shift toward the cap’s edge, then judge it in the full band', 'Move the mic farther back to hear more of the room', 'Turn the steel amp up on stage until it cuts through the band again'],
    correct: 'Shift toward the cap’s edge, then judge it in the full band',
    explain: 'Return toward the cap’s edge and listen with the band; definition is judged in context.',
    why: {
      'Move the mic farther back to hear more of the room': 'More room usually blurs definition.',
      'Turn the steel amp up on stage until it cuts through the band again': 'Louder raises exposure and spill; move the mic first.',
    },
  },
  {
    id: 's.clip',
    observation: 'One note or passage clips',
    firstChecks: 'Did the volume pedal or the picking change? Set the gain on the loudest realistic performance.',
    options: ['Reset the gain on the loudest realistic passage', 'Ask the player to avoid the volume pedal’s top end', 'Pull the fader down to hide the clipping'],
    correct: 'Reset the gain on the loudest realistic passage',
    explain: 'A swell or a hard attack can rise far above the sustain. Set the input gain with headroom for the real peak.',
    why: {
      'Ask the player to avoid the volume pedal’s top end': 'The pedal is part of how they play.',
      'Pull the fader down to hide the clipping': 'The clipping happens at the input, before the fader.',
    },
  },
  {
    id: 's.hollow',
    observation: 'Mic plus direct path sounds hollow',
    firstChecks: 'Do path timing and filtering interact? Solo, mono-sum, move or rebalance, then test polarity or timing.',
    options: ['Solo, mono-sum, move or rebalance, then polarity', 'Turn both channels up until the sound fills out', 'Keep one polarity setting whatever it sounds like'],
    correct: 'Solo, mono-sum, move or rebalance, then polarity',
    explain: 'The direct path arrives first; the amp and the air shape the mic. Judge alone and together, in mono, at matched levels.',
    why: {
      'Turn both channels up until the sound fills out': 'More level does not fix a cancellation.',
      'Keep one polarity setting whatever it sounds like': 'Compare both settings by ear, in mono.',
    },
  },
  {
    id: 's.differs',
    observation: 'The direct output sounds different from the amp',
    firstChecks: 'At what point in the circuit is it tapped? Check the output’s manual; label it preamp, simulated or dry.',
    options: ['Check where it is tapped; label it preamp, simulated or dry', 'Assume the direct output is faulty, and swap it for another amp’s', 'EQ the mic until it matches the direct output'],
    correct: 'Check where it is tapped; label it preamp, simulated or dry',
    explain: 'A direct path is taken at a particular point and may omit the power stage, the speaker and the room. That difference is expected — label it.',
    why: {
      'Assume the direct output is faulty, and swap it for another amp’s': 'It is meant to differ: it never hears the speaker.',
      'EQ the mic until it matches the direct output': 'They are different sources; keep each for its purpose.',
    },
  },
  {
    id: 's.rattle',
    observation: 'Rattle or feedback on stage',
    firstChecks: 'Is the stand stable, and the amp or wedge aimed safely? Reduce the level, secure the geometry, then recheck.',
    options: ['Reduce level, secure the stand and the aim, then recheck', 'Turn the steel channel up to cover the rattle', 'Lean the mic stand against the amp’s cabinet so that it stops moving'],
    correct: 'Reduce level, secure the stand and the aim, then recheck',
    explain: 'Make it safe first; then a stable stand, a firm amp, and the amp and wedge aimed away from open mics.',
    why: {
      'Turn the steel channel up to cover the rattle': 'More gain feeds feedback.',
      'Lean the mic stand against the amp’s cabinet so that it stops moving': 'The stand would carry the amp’s vibration into the mic.',
    },
  },
  {
    id: 's.load',
    observation: 'You are unsure about a speaker connection or the load the amp needs',
    firstChecks: 'Is the jack speaker level, and what load is required? Stop patching; consult the model’s manual or a qualified technician.',
    options: ['Stop patching; the manual or a qualified technician', 'Plug it into the desk at low gain and listen', 'Run the amp without its speaker connected, just to check'],
    correct: 'Stop patching; the manual or a qualified technician',
    explain: 'Some amps allow running without a speaker under stated conditions; others need their load. Only the model’s manual says which.',
    why: {
      'Plug it into the desk at low gain and listen': 'If it is a speaker output the connection itself is the danger.',
      'Run the amp without its speaker connected, just to check': 'Some amps are damaged running without their load.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'ps.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic steel-amp setup in the order you would do them.',
    steps: [
      { text: 'Ask the player which neck and pickup, the volume-pedal range, the effects and the amp settings', early: 'Start with the player’s real setup.' },
      { text: 'Mark the player’s pedal, knee-lever and volume-pedal zone as keep-clear', early: 'Know the player’s space before placing anything.' },
      { text: 'With the amp off or muted, find the speaker and place the mic near the cap’s edge, clear of the grille', early: 'Place the mic once the keep-clear zone is known.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom if it is needed', early: 'Power comes after connecting — outputs muted first.' },
      { text: 'Set the gain on the loudest realistic passage: the swell’s peak and the hardest attack', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare centre, cap edge and outer cone at matched level', early: 'Compare once the level is set safely.' },
      { text: 'Write down the speaker, spot, distance, angle and the player’s settings', early: 'Document last.' },
    ],
    explain: 'A sensible order. Keep the player’s working zone clear throughout; follow each device’s manual for phantom power and connections.',
  },
];

const POWER_REASON: SetupReason = { id: 'r.power', label: 'The channel gives the mic the power it needs (phantom, or none)', role: 'required', feedback: 'Say how the mic is powered.' };
const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point, measured from the grille in front of the speaker', role: 'required', feedback: 'Say where it begins and what it is measured from.' };
const CLEAR_REASON: SetupReason = { id: 'r.clear', label: 'Stand and cable stay clear of the pedals, knee levers and volume pedal', role: 'required', feedback: 'The player’s working zone is part of every passing setup.' };
const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand most steel players use', role: 'wrong', feedback: 'A brand is not part of passing.' };
const BRIGHT_REASON: SetupReason = { id: 'r.bright', label: 'It gives the brightest steel sound possible', role: 'wrong', feedback: 'Brightest is not a passing reason; the brief decides.' };

const setupTasks: SetupTask[] = [
  {
    id: 'ps.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A country club stage: a pedal steel through a 1 × 12 combo beside the drums; a mono PA. One channel; phantom power is available.',
    setups: [
      { id: 'a', label: 'Instrument dynamic close to the grille at the dust cap’s edge, on a low stand', ok: true, power: 'none', feedback: 'Close, directional, low and stable — a dynamic needs no power.' },
      { id: 'b', label: 'Small condenser 5–15 cm from the grille on the speaker, its level rating checked', ok: true, power: 'phantom', feedback: 'Close and directional, with the phantom it needs.' },
      { id: 'c', label: 'A mic on a stand among the pedals, aimed up at the strings', ok: false, power: 'none', feedback: 'That blocks the player’s zone — and the sound to mic is the amp.' },
      { id: 'd', label: 'A mic 60–90 cm back from the amp, for the room', ok: false, power: 'none', feedback: 'On a stage beside the drums that hears more stage than steel.' },
      { id: 'e', label: 'The amp’s speaker output into the desk', ok: false, power: 'none', feedback: 'Never: a speaker output goes only to a speaker.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'Close, directional pickup helps against drum spill and feedback', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, BRIGHT_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a sensible starting point, the player’s space kept clear, and power that matches the mic.',
  },
  {
    id: 'ps.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A studio, a lap steel through an open-backed combo; the player wants a rounder sound. Two inputs, NO phantom power; the amp has a simulated-mic XLR.',
    setups: [
      { id: 'a', label: 'A dynamic toward the outer cone, plus the amp’s simulated-mic output on its own labelled channel', ok: true, power: 'none', feedback: 'A rounder mic position and a labelled electrical source, checked together in mono.' },
      { id: 'b', label: 'A dynamic at the cap’s edge, plus a dynamic behind the open back, polarity flipped', ok: true, power: 'none', feedback: 'A front-and-rear pair on a real open back — judged in mono.' },
      { id: 'c', label: 'A small condenser farther back, alone', ok: false, power: 'phantom', feedback: 'No phantom here for the condenser.' },
      { id: 'd', label: 'The simulated-mic output alone, labelled as the amp mic', ok: false, power: 'none', feedback: 'It is electrical, not a mic — and the brief asks for the amp’s sound.' },
      { id: 'e', label: 'A dynamic inside the open back, near the valves', ok: false, power: 'none', feedback: 'Nothing goes inside the amp.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.mono', label: 'Each source heard alone, then together in mono', role: 'optional', feedback: 'A good habit with any blend.' }, BRAND_REASON, BRIGHT_REASON],
    explain: 'Two setups pass. What passes is the reasoning: a deliberate position, sources that work without phantom, labelled electrical paths, a mono check.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you begin: the player slides the bar from the open string to half-way along. What happens to the pitch?', options: ['It rises an octave', 'It falls an octave', 'It stays the same'], after: 'Now move the BAR, step HARMONIC, and press the PEDAL.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Toward the rear, off to one side'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: keeping the distance, you slide the mic from the dust cap’s edge toward the cone’s edge. What changes?', options: ['Brighter', 'Smoother and less bright', 'It depends on this speaker'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'Where will this cardioid reject the steel player’s wedge best?', options: ['Straight behind the mic', 'At the sides of the mic', 'Wherever its rejection actually points'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION.' },
  twoMic: { prompt: 'If you flip one source’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What do a pedal steel’s pedals and knee levers do?',
    options: ['Change string pitches, by changing tension', 'Turn the amp’s volume up and down while playing', 'Switch between the instrument’s two pickups'],
    correct: 'Change string pitches, by changing tension',
    explain: 'Through rods to the changer, they tighten or slacken chosen strings, raising or lowering their pitch. The volume pedal is separate.',
    why: {
      'Turn the amp’s volume up and down while playing': 'That is the VOLUME pedal; the others change pitches.',
      'Switch between the instrument’s two pickups': 'They change pitches mechanically, not the pickups.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What does the steel player’s bar do?',
    options: ['Stops the strings like a movable fret', 'Plucks the strings close to the changer end', 'Mutes the amp between notes'],
    correct: 'Stops the strings like a movable fret',
    explain: 'The bar rests on the strings: only the length between it and the bridge vibrates. Sliding it bends the pitch smoothly.',
    why: {
      'Plucks the strings close to the changer end': 'The other hand picks; the bar sets the pitch.',
      'Mutes the amp between notes': 'It sets the vibrating length, it does not touch the amp.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'A pedal raises a string by a whole tone. Roughly how much tighter is it pulled?',
    options: ['About a quarter tighter (× 1.26)', 'About twice as tight', 'About one-tenth tighter than before'],
    correct: 'About a quarter tighter (× 1.26)',
    explain: 'Pitch goes with the square root of tension: a whole tone (× 1.12) needs about × 1.26 the tension.',
    why: {
      'About twice as tight': 'Twice the tension raises the pitch by about six semitones, not two.',
      'About one-tenth tighter than before': 'That is closer to a semitone’s change in frequency than a whole tone’s tension.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Where does the sound you mic come from?',
    options: ['The amp’s speaker', 'The strings in the air', 'The changer and the pedal rods'],
    correct: 'The amp’s speaker',
    explain: 'The pickup turns the strings’ motion into a signal; the amp and speaker make the sound you mic.',
    why: {
      'The strings in the air': 'An electric steel is quiet in the air.',
      'The changer and the pedal rods': 'They change pitch mechanically; they make nothing to mic.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'Where may the mic stand and cable go round a pedal steel?',
    options: ['Clear of the pedals, knee levers and volume pedal', 'Between the pedal rods, under the instrument', 'Against the player’s knees, out of sight'],
    correct: 'Clear of the pedals, knee levers and volume pedal',
    explain: 'The player’s feet and knees work there while they play. Nothing may block them or trip anyone.',
    why: {
      'Between the pedal rods, under the instrument': 'That is the player’s working zone.',
      'Against the player’s knees, out of sight': 'The knees work the knee levers.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: 'Your mic is rated for a very high SPL. What does that tell you about sitting by a loud steel amp all through soundcheck?',
    options: ['Nothing — it is the mic’s distortion limit, not a hearing limit', 'It is safe for a while, as long as the amp stays below the level of the mic’s rating', 'It is safe as long as the mic is closer to the amp than you are'],
    correct: 'Nothing — it is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — and below it is not a promise. Measure where the person listens.',
    why: {
      'It is safe for a while, as long as the amp stays below the level of the mic’s rating': 'A mic rating is not a hearing limit.',
      'It is safe as long as the mic is closer to the amp than you are': 'Where the mic sits says nothing about your ears.',
    },
  },
];

export const C04_LESSON: Lesson = {
  id: 'C04',
  labId: 'strings',
  title: 'Pedal Steel and Lap Steel',
  subtitle: 'Mic the amp; keep the pedals and knee levers clear',
  noun: { one: 'steel guitar', many: 'steel guitars' },
  model: C04_MODEL,
  micTypeIds: [...C04_MICS],
  zones: C04_ZONES,
  setupPairs: [{ label: 'A front mic and a mic behind the open back', A: { zone: 'eg.boundary' }, B: { zone: 'eg.rear', polarity: -1 }, variants: ['open'] }],
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'The pedal steel: strings over a neck on legs, played seated with a steel bar, with floor pedals and knee levers that change chosen strings’ pitch. The lap steel: a simpler instrument across the knees, played with a bar, usually without pedals. Both are electric: a pickup feeds an amp.', src: 'SGF-MAP / LESSON L6-L7' },
    { title: 'WHERE YOU MEET IT', text: 'Country, western swing, gospel, Hawaiian, blues and rock — on stage and in the studio, through an amp the player brings.', src: 'LESSON L4' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Gliding melodies, swelling chords and bends no fretted guitar can make: the bar slides, the pedals and knee levers move notes within a chord, and the volume pedal swells the sound.', src: 'LESSON L7' },
    { title: 'ITS PARTS', text: 'The neck or necks and their strings, the changer at the bridge end, the pickup, the bar, the pedals and their rods, the knee levers and the volume pedal. The sound you mic comes from the amp’s speaker.', src: 'SGF-MAP' },
  ],
  sound: {
    stages: [
      { title: 'The signal reaches the voice coil', text: 'The amp’s signal — the strings’ motion through the pickup, the volume pedal and any effects — flows through the voice coil, in the magnet’s gap.' },
      { title: 'The cone moves as one', text: 'At low pitches the whole cone moves together, like a piston — drawn here many times larger than it really moves.' },
      { title: 'Push in front, pull behind', text: 'Moving forward, the cone pushes the air in front and pulls the air behind — at the same moment, opposite ways.' },
      { title: 'Sound leaves', text: 'Sound leaves the front through the grille; with a closed back, the back of the cone sounds into the box.', ported: 'Sound leaves the front through the grille — and through the open back, opposite in polarity.' },
    ],
    attack: 'The picked attack and the bar’s contact reach the cone first. A close mic aimed toward the centre of the cone tends to hear more of them — sometimes too sharp on high notes.',
    body: 'The long sustain and the swells, with the amp’s reverb, the cabinet and the room. Toward the edge, or a little farther back, a mic tends to hear more of it. Tendencies to check.',
    head: { diameterMm: 305, rods: 0, label: '12 in speaker, face-on', strikeSrc: 'CEL-V30' },
  },
  setting: {
    items: [
      { id: 'player', label: 'the steel player and the instrument', short: 'STEEL', note: 'Seated behind a pedal steel, or with a lap steel across the knees. Ask which neck and pickup, the volume-pedal range and the effects that make their sound.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'ASK FIRST', scene: 'all' },
      { id: 'pedals', label: 'the pedals, knee levers and volume pedal', short: 'KEEP CLEAR', note: 'The player’s feet and knees work these continuously while playing. No stand, cable or amp in this zone.', prov: { kind: 'illustrative', reason: 'a typical working zone; drawing default size' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'dibox', label: 'a DI or splitter before the amp', short: 'DI BOX', note: 'Preserves a dry electrical path — without the amp’s reverb, EQ, power stage or speaker. Use a proper instrument-level splitter that does not load the pickup.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'NOT THE AIR', scene: 'all' },
      { id: 'amp', label: 'the steel amp', short: 'AMP', note: 'The player’s amp, often a combo, sometimes tilted back toward them. Its settings and reverb are their sound; it must stand firm.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'THE SOURCE', scene: 'all' },
      { id: 'cab', label: 'the speaker', short: 'SPEAKER', note: 'The cone moves the air: what the mic hears. Find it behind the grille before placing the mic.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'WHAT A MIC HEARS', scene: 'all' },
      { id: 'mic', label: 'the microphone', short: 'MIC', note: 'An airborne pickup of the speaker, the box and the room — on a low, stable stand at the amp, away from the player.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'AIR PATH', scene: 'all' },
      { id: 'desk', label: 'the desk (mixing console)', short: 'DESK', note: 'Each source on its own labelled channel. Set the gain for the loudest swell and attack.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'GAIN HERE', scene: 'all' },
      { id: 'ampdi', label: 'the amp’s direct output', short: 'AMP OUT', note: 'Some steel amps have an XLR that imitates a miked speaker, beside other line outputs. Where each is taken is in that amp’s manual. Still electrical — not the air.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'NOT THE AIR', scene: 'all' },
      { id: 'wedge', label: 'the steel player’s wedge', short: 'WEDGE', note: 'A floor monitor in front of the steel, facing back toward the player — off the amp mic’s rear, toward one side.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'drums', label: 'the drum kit', short: 'DRUMS', note: 'A loud neighbour; a close, directional amp mic hears more of the steel.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'stage' },
      { id: 'otherAmp', label: 'the bass amp', short: 'BASS AMP', note: 'Another loud speaker on the backline.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'all' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Coordinate the amp and the PA so the player hears themselves and the audience hears the steel — without pushing the amp.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a good studio room, a farther mic can add space once the close mic is right.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: the steel player seated with pedals, knee levers and a volume pedal at their feet; the amp beside or behind them, a wedge in front, drums close by. A close mic on a low, stable stand at the amp; the player’s zone kept clear.',
    studio: 'STUDIO: one good close mic first; a second mic, a room mic or a direct path only for a stated goal, each heard alone and in mono.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic setup for a steel player’s amp, describe an alternative, and say what would justify a second source. With a real rig and the player’s agreement, you can log what you tried below.',
    fields: [
      { id: 'source', label: 'Pedal or lap steel, neck and pickup, amp and its settings', kind: 'text' },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['instrument dynamic', 'small condenser', 'large dynamic', 'other'] },
      { id: 'site', label: 'Spot on the cone, distance from the grille, angle', kind: 'text' },
      { id: 'zone', label: 'Stand and cable route; the pedal and knee-lever zone kept clear', kind: 'text' },
      { id: 'tone', label: 'Swells, attacks, sustain: what you heard (tendencies)', kind: 'text' },
      { id: 'notes', label: 'Second source, mono check; hum checked (the DI’s ground lift as its manual says — the mains earth never touched); final choice and its limitation', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'Whether the amp stands on the floor or is tilted back: drawn on the floor — no HEIGHT readout.', dims: ['yFloor'] },
    { text: 'The steel amp itself: its maker’s manual is unreachable today, so the guitar lesson’s combo (outer size from its own maker’s manual; speaker position, open back, panel and chassis drawing defaults) stands in for it.', dims: [] },
    { text: 'Every pedal-steel and lap-steel dimension — body 900 × 300 × 90, top 700 above the floor, 10 strings, 3 pedals, 4 knee levers hanging 150, seat 550, scale 24 in, the keep-clear zone 1000 × 600 — and the 10-string tuning: drawing defaults.', dims: [] },
    { text: 'A rear-mic distance: none in the research; 15–30 cm is a drawing default outside the amp’s vent clearance.', dims: [] },
  ],
  live: {
    wedges: [
      { id: 'steelWedge', label: 'the steel player’s wedge, in front of the steel, facing back toward the player', short: 'WEDGE', p: { x: 1800, y: FLOOR, z: 720 }, lift: 150, faces: { x: -1, y: 0, z: 0 }, note: 'In front of the steel and to one side of the amp: off the mic’s rear axis — aim by the mic’s real pattern.', prov: { kind: 'illustrative', reason: 'a typical stage layout' } },
      { id: 'sideFill', label: 'a side-fill monitor at the side of the stage', short: 'SIDE FILL', p: { x: 700, y: FLOOR, z: -1500 }, lift: 150, faces: { x: 0, y: 0, z: 1 }, note: 'Off to the side, about ninety degrees off the mic’s axis: no cardioid null reaches it.', prov: { kind: 'illustrative', reason: 'a typical stage layout' } },
    ],
  },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. These are general amp-miking practices to experiment with on a steel player’s amp, not steel-specific coordinates: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: the instruments with typical proportions, one combo standing in for the steel amp, an ideal string, textbook mic patterns, motion drawn larger. Keep the player’s pedals and knee levers clear, never open an amp, and send a speaker output only to a speaker.',
};
