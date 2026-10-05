/**
 * C02 ELECTRIC GUITAR AND GUITAR AMPLIFIERS (Lab 4, Strings) — the lesson as
 * DATA. Words from the owner's lesson
 * (docs/labs/miking/source_text/Electric-Guitar-Amplifier-Miking-Technique.txt,
 * "L<n>" in COMMENTS only), with the fixes in CORRECTIONS_LOG.md (EG-01 …)
 * applied. Research: docs/labs/miking/electric_guitar_amp/.
 *
 * Owner ruling 2026-10-04: suggested starting points, never dogma; no
 * source, brand or model names, no badges, no Sources page. The internal
 * record lives in the code-only fields and in docs/. FULLY SILENT.
 *
 * The speaker itself — cone, cabinets, the beam — is taught in full in the
 * "Amplified speakers & Leslie" module (SPK); this lesson links to it and
 * keeps to the guitar's chain: string → pickup → pedals → amp → speaker → air.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, PageContent, PageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { OPPOSITE_SIDES_POLARITY, micRatingCheck } from '../../engine/model/sharedItems.ts';
import { C02_MODEL, C02_ZONES } from './geometry.ts';
import { C02_MICS } from './model.ts';

const FLOOR = C02_MODEL.yFloor.mm;

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the guitar and its amp',
    goal: 'Get to know the electric guitar’s chain — strings, pickups, pedals, amp and speaker — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The strings start the sound, the pickups turn it into a small signal, and the amp and its speaker make the sound you mic. Find the speaker itself — on a combo it is not in the middle of the grille.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a vibrating string becomes a signal and the signal becomes moving air — and why the spot on the cone matters. Shown, never played.',
    credit: { scenarios: ['eg.snd.1', 'eg.snd.2', 'eg.snd.3'], interactive: 'soundPath', note: 'Step through three harmonics and try two pickups, step the cone through to the end, and answer the three checks.' },
    takeaway: 'Each pickup senses its own spot on the string, so neck and bridge sound different. The cone pushes in front and pulls behind — an open back sounds out too, opposite in polarity. Close in, the centre of the cone tends to sound brighter than the edge.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the path from the strings to the desk — which feeds hear the air and which are wires — what sits round the amp on a stage and in a studio, and what to do before any mic.',
    credit: { scenarios: ['eg.set.1', 'eg.set.2', 'eg.set.3'], note: 'Answer the three checks.' },
    takeaway: 'A mic on the amp hears air; a DI or the amp’s direct output is a separate electrical source. A speaker output goes only to a speaker. Keep the player’s pedals and the amp’s vents clear, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for a guitar amp by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['eg.mic.1', 'eg.mic.2', 'eg.mic.3', 'eg.mic.4', 'eg.rec.1'], note: 'Answer the five checks (one reaches back to how it sounds).' },
    takeaway: 'Dynamics and condensers both work on a guitar amp; check the mic’s level rating and power, aim its correct face at the speaker, and compare by ear at matched level.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin on a guitar combo — close, at the dust cap’s edge, measured from the grille — then move across the cone and away from it, one change at a time.',
    credit: { scenarios: ['eg.place.1', 'eg.place.2', 'eg.place.3', 'eg.rec.2'], interactive: 'twoZones', note: 'Rest the mic in two different recommended starting points, clear of every part, and answer the four checks.' },
    takeaway: 'Measure from the grille, on the speaker that is sounding, and change one thing at a time: across the cone, OR away from it, OR the angle. A tiny move can matter more than changing the mic.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim a guitar-amp mic so its pattern’s rejection faces a monitor — and know what a studio and a stage each ask of an amp mic.',
    credit: { scenarios: ['eg.ctx.1', 'eg.ctx.2', 'eg.ctx.3', 'eg.ctx.studio', 'eg.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the guitarist’s wedge sits in the rejection. STUDIO: answer the decision card. Then the four checks.' },
    takeaway: 'A close, directional mic hears more of the amp and less of the stage. Aim by the mic’s real pattern: a cardioid rejects most behind, a super- or hypercardioid off to each side of the rear. Real nulls are shallower than the picture.',
  },
  twoMic: {
    title: 'Two sources',
    goal: 'Blend a front and a rear mic on an open-backed combo — or a mic and a DI — and see what polarity does and does not change.',
    credit: { scenarios: ['eg.two.1', 'eg.two.2', 'eg.two.3'], interactive: 'polarityVsDelay', note: 'Flip the polarity both ways AND move a mic so the delay changes, then answer the three checks.' },
    takeaway: 'The back of the cone is opposite in polarity to the front: flipping the rear mic is the first thing to try, never a rule — judge the pair in mono, at matched levels. A DI arrives before the mic. Polarity flips the sign; it does not remove a delay.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Move the mic before reaching for EQ: across the cone, toward or away from the grille, one change at a time. For anything hot, smoking or electrical: stop, keep clear, call a technician.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one amp mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second channel.',
    credit: { scenarios: ['eg.prac.order', 'eg.prac.gain', 'eg.prac.setup1', 'eg.prac.setup2', 'eg.prac.3', 'eg.mix.1', 'eg.mix.2', 'eg.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real amp.' },
    takeaway: 'Find the speaker, place the mic clear of the grille, set the gain on the loudest passage, compare one change at a time at matched level, check every blend in mono, and write it down. More than one setup passes; a brand never does.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only: eg.snd.* L5-L7 + stringModel ·
 * eg.set.* L6, L35, L39, L46-L47 · eg.mic.* L28, L31, L47 · eg.place.* L7,
 * L28, L32-L33 · eg.ctx.* L35, L44 · eg.two.* L37-L39 · eg.prac/mix L29-L34,
 * L75-L79.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'eg.snd.1',
    page: 'sound',
    prompt: 'A pickup sits exactly under a still point of one harmonic’s shape. How much of that harmonic does it sense?',
    options: ['Almost none — the string barely moves there', 'Most of it, since a still string is easy to sense', 'Twice as much, from the two halves of the string'],
    correct: 'Almost none — the string barely moves there',
    explain: 'A magnetic pickup senses the string moving over it. At a still point (a node) that harmonic does not move the string, so the pickup hears almost none of it. That is why each pickup position has its own sound.',
    why: {
      'Most of it, since a still string is easy to sense': 'The pickup senses MOTION. Where a shape is still, it has nothing to sense.',
      'Twice as much, from the two halves of the string': 'The halves move in opposite directions round the still point; the pickup only senses the string right above it, which is not moving.',
    },
  },
  {
    id: 'eg.snd.2',
    page: 'sound',
    prompt: 'An open-backed combo sounds out behind as well as in front. How does the sound from the back compare?',
    options: ['The same motion of the cone, opposite in polarity', 'A delayed echo of the front, in the same polarity', 'Nothing a mic placed behind it could pick up'],
    correct: 'The same motion of the cone, opposite in polarity',
    explain: 'When the cone moves forward it pushes the air in front and pulls the air behind at the same moment: the back radiates the same motion, opposite in polarity — usually thicker and duller, because the magnet and the chassis sit in the way.',
    why: {
      'A delayed echo of the front, in the same polarity': 'It leaves the back of the cone at the same moment — and opposite, because the back pulls while the front pushes.',
      'Nothing a mic placed behind it could pick up': 'With an open back the rear of the cone sounds straight out behind: a mic there hears it well.',
    },
  },
  {
    id: 'eg.snd.3',
    page: 'sound',
    prompt: 'Why does a close mic aimed at the middle of a guitar speaker tend to sound brighter than one aimed toward its edge?',
    options: ['At higher pitches, the middle of the cone does more of the work', 'The edge of the cone moves too fast for a close mic to follow it', 'The dust cap filters the bass out before the sound leaves it'],
    correct: 'At higher pitches, the middle of the cone does more of the work',
    explain: 'At low pitches the whole cone moves as one. Higher up, the cone flexes, and more of the high-frequency sound comes from the middle, near the voice coil. Close in, the spot the mic faces tilts the balance — a tendency to check on each speaker.',
    why: {
      'The edge of the cone moves too fast for a close mic to follow it': 'The edge does not outrun the mic. At higher pitches the middle of the cone does more of the work.',
      'The dust cap filters the bass out before the sound leaves it': 'The dust cap moves with the cone; it filters nothing. More of the highs simply come from the middle.',
    },
  },
  {
    id: 'eg.set.1',
    page: 'setting',
    prompt: 'A DI box sits between the guitar and the amp. What does its output to the desk carry?',
    options: ['The guitar’s signal before the amp — no amp, speaker or room', 'The amp’s full sound, with only the speaker’s colour taken out', 'A cleaner copy of what a mic on the speaker hears'],
    correct: 'The guitar’s signal before the amp — no amp, speaker or room',
    explain: 'A DI before the amp taps the guitar’s own signal (after any pedals in front of it). It never passes through the amp, the speaker or the room — a separate source with its own uses, not a copy of the mic.',
    why: {
      'The amp’s full sound, with only the speaker’s colour taken out': 'A DI BEFORE the amp has not been through the amp at all. Some amps have their own direct output — that one is taken inside the amp.',
      'A cleaner copy of what a mic on the speaker hears': 'It never passes through the speaker, the cabinet or the room, so it is a different sound, not a copy.',
    },
  },
  micRatingCheck({ id: 'eg.set.2', page: 'setting', mic: 'amp mic', loudest: 'the amp at full stage level' }),
  {
    id: 'eg.set.3',
    page: 'setting',
    prompt: 'On stage, where does the amp mic’s cable go?',
    options: ['Away from the player’s feet and the amp’s hot vents', 'Under the pedalboard, where nobody can see it', 'Along the back of the amp, tucked close to the vents'],
    correct: 'Away from the player’s feet and the amp’s hot vents',
    explain: 'The guitarist works the pedals with their feet while they play, and the amp needs its vents clear to cool. Route the cable away from both — and never drape anything over the vents to cut spill.',
    why: {
      'Under the pedalboard, where nobody can see it': 'The pedalboard is the player’s working space: a cable under it can snag a foot or move a pedal.',
      'Along the back of the amp, tucked close to the vents': 'The vents get hot and need open air round them. Keep cables and stands clear of them.',
    },
  },
  {
    id: 'eg.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Close to the speaker and aimed at the centre of the cone, a mic tends to hear…',
    options: ['a brighter, more forward sound than toward the edge', 'only the bass, because the middle of the cone moves most', 'the back of the cone, through the dust cap'],
    correct: 'a brighter, more forward sound than toward the edge',
    explain: 'At higher pitches the middle of the cone does more of the work, so a close mic aimed there tends to sound brighter — with distortion, sometimes fizzy. A tendency, and speakers vary.',
    why: {
      'only the bass, because the middle of the cone moves most': 'At low pitches the whole cone moves as one; it is the HIGHS that come more from the middle.',
      'the back of the cone, through the dust cap': 'The dust cap is part of the moving cone: in front of it, the mic hears the front of the cone.',
    },
  },
  {
    id: 'eg.mic.1',
    page: 'microphone',
    prompt: 'The guitar channel has no phantom power. Which of this page’s mic types can you still use?',
    options: ['The two dynamics: neither needs power to work', 'The small condenser, kept a little back from the grille', 'The small condenser, as long as the amp is switched on'],
    correct: 'The two dynamics: neither needs power to work',
    explain: 'Dynamic mics need no power. A condenser needs phantom power from the desk wherever it is placed. A ribbon mic needs its own maker’s rules about phantom — check them before connecting.',
    why: {
      'The small condenser, kept a little back from the grille': 'Distance does not change what a condenser needs: it still needs phantom power.',
      'The small condenser, as long as the amp is switched on': 'The amp powers the speaker, not the mic. The condenser needs phantom from the desk.',
    },
  },
  {
    id: 'eg.mic.2',
    page: 'microphone',
    prompt: 'Some engineers like a condenser on a guitar amp, others a dynamic. What does that tell you?',
    options: ['Both can suit; compare them by ear at matched level', 'A condenser is the more accurate choice for a guitar amp', 'A dynamic is required, because a guitar amp is loud'],
    correct: 'Both can suit; compare them by ear at matched level',
    explain: 'Different mics give different tones and both types are used on guitar amps. Check the mic’s level rating, mounting and power, then compare by ear at the same reproduced level.',
    why: {
      'A condenser is the more accurate choice for a guitar amp': 'Accuracy is not the only aim on a guitar amp; compare the two on this amp by ear.',
      'A dynamic is required, because a guitar amp is loud': 'Many condensers handle a loud amp — check the mic’s own rating rather than ruling a type out.',
    },
  },
  {
    id: 'eg.mic.3',
    page: 'microphone',
    prompt: 'Your mic is side-address: it picks up through its side, not its end. How do you aim it at the speaker?',
    options: ['Turn its marked front side toward the cone', 'Point its top end at the cone, as with an end-address mic', 'Either side will do, since the pattern faces both ways'],
    correct: 'Turn its marked front side toward the cone',
    explain: 'A side-address mic hears through the side its maker marks as the front. Face that side to the speaker, follow its own manual for mounting, and secure the cable.',
    why: {
      'Point its top end at the cone, as with an end-address mic': 'Its end is not where it listens: aimed end-on, the speaker sits off its axis.',
      'Either side will do, since the pattern faces both ways': 'A directional side-address mic has a front and a back like any other — check which side its maker marks.',
    },
  },
  {
    id: 'eg.mic.4',
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
    id: 'eg.place.1',
    page: 'placement',
    prompt: 'A starting point says “1.5–5 cm (½–2 in)”. Measured from what?',
    options: ['From the grille cloth, in front of the speaker itself', 'From the middle of the grille, wherever the speaker is', 'From the back of the cone, measured inside the amp'],
    correct: 'From the grille cloth, in front of the speaker itself',
    explain: 'The grille is the surface you can see and measure from — and the number belongs to the speaker that is really sounding. On a combo the speaker sits off-centre, so the middle of the grille is the wrong place to start.',
    why: {
      'From the middle of the grille, wherever the speaker is': 'The middle of the grille is not the middle of the speaker on many amps. Find the speaker first.',
      'From the back of the cone, measured inside the amp': 'Nothing is measured from inside the amp: you cannot see or reach it. The grille is the reference.',
    },
  },
  {
    id: 'eg.place.2',
    page: 'placement',
    prompt: 'You slide the mic from the dust cap’s edge toward the cone’s edge, keeping the same distance. What should you expect?',
    options: ['A smoother, darker sound, as a tendency to check', 'A louder sound, with a fixed and predictable lift in the bass', 'No change, since the distance has not moved'],
    correct: 'A smoother, darker sound, as a tendency to check',
    explain: 'Most often the edge sounds smoother or darker than the centre — speakers vary, so listen, and check the guitar keeps its definition in the band. Keeping the distance fixed means you hear only the move across the cone.',
    why: {
      'A louder sound, with a fixed and predictable lift in the bass': 'These are tendencies, not fixed amounts. Toward the edge most often sounds smoother, not louder.',
      'No change, since the distance has not moved': 'The spot on the cone matters as well as the distance: that is why you keep one fixed while changing the other.',
    },
  },
  {
    id: 'eg.place.3',
    page: 'placement',
    prompt: 'At the dust cap’s edge the sound is a little too bright. Which next try keeps the comparison fair?',
    options: ['Slide toward the edge, keeping the distance', 'Move it back and toward the edge, both in one go', 'Swap the mic and move it at the same time'],
    correct: 'Slide toward the edge, keeping the distance',
    explain: 'One change at a time: slide across the cone first. If it is still too bright, try a modest angle, then a little distance — and compare at matched level, on the same phrase.',
    why: {
      'Move it back and toward the edge, both in one go': 'Two changes at once: you cannot tell which one made the difference.',
      'Swap the mic and move it at the same time': 'Again two changes at once. A tiny move often matters more than a different mic.',
    },
  },
  {
    id: 'eg.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Which of these does NOT hear the air from the amp?',
    options: ['A DI box between the guitar and the amp', 'A mic a few centimetres in front of the grille', 'A mic behind the open back'],
    correct: 'A DI box between the guitar and the amp',
    explain: 'A DI is an electrical tap, taken before the amp. Both mics hear air from the speaker — the front and the back of the cone.',
    why: {
      'A mic a few centimetres in front of the grille': 'That mic hears the air in front of the cone — the amp’s own sound.',
      'A mic behind the open back': 'That mic hears the air behind the cone — still the amp’s air, opposite in polarity.',
    },
  },
  {
    id: 'eg.ctx.1',
    page: 'context',
    prompt: 'On a loud stage, why might you start with a close, directional mic on the guitar amp?',
    options: ['More of the amp, less of the stage, and more gain before feedback', 'A close mic makes the amp itself sound louder to the whole audience', 'A mic farther back could not pick up a guitar speaker'],
    correct: 'More of the amp, less of the stage, and more gain before feedback',
    explain: 'Close and directional favours the amp over the drums and the monitors — the usual live reasons — and the PA then adds only what the stage sound lacks. In a quiet studio a farther mic may add a useful room.',
    why: {
      'A close mic makes the amp itself sound louder to the whole audience': 'The mic does not change the amp’s own level in the room; it changes what reaches the PA.',
      'A mic farther back could not pick up a guitar speaker': 'It can — in a studio that is a common choice. On stage it would also hear the stage.',
    },
  },
  {
    id: 'eg.ctx.2',
    page: 'context',
    prompt: 'The guitarist’s wedge is downstage, facing back toward them — behind your cardioid amp mic. Where does a cardioid reject most?',
    options: ['Directly behind it, where that wedge sits', 'At its sides, about ninety degrees off its axis', 'In front of it, toward the speaker it faces'],
    correct: 'Directly behind it, where that wedge sits',
    explain: 'A cardioid rejects most at 180°. The mic faces the amp, so its back faces downstage — toward that wedge. Real nulls are shallower than the simplified pattern, and shallowest in the lows.',
    why: {
      'At its sides, about ninety degrees off its axis': 'At 90° a cardioid still picks up about half (−6 dB). Its deepest rejection is directly behind.',
      'In front of it, toward the speaker it faces': 'That is where it picks up MOST — the speaker it is aimed at.',
    },
  },
  {
    id: 'eg.ctx.3',
    page: 'context',
    prompt: 'Your amp mic is a supercardioid. Where does the loudest monitor ideally sit?',
    options: ['Off to one side of its rear, near its null', 'Directly behind it, just as for a cardioid mic', 'Straight in front of it, beside the amp'],
    correct: 'Off to one side of its rear, near its null',
    explain: 'A supercardioid rejects most at about 126° each side, and has a small lobe straight behind. So “put the monitor directly behind it” suits a cardioid, not this mic — aim by the mic’s real pattern.',
    why: {
      'Directly behind it, just as for a cardioid mic': 'A supercardioid picks up a little straight behind; its deepest rejection is off to each side of the rear.',
      'Straight in front of it, beside the amp': 'In front is where it picks up most — a monitor there feeds straight into it.',
    },
  },
  {
    id: 'eg.ctx.studio',
    page: 'context',
    prompt: 'Studio session, a good-sounding room, no monitors on the floor. What could justify a mic farther back from the amp?',
    options: ['The room adds something useful to the sound', 'A farther mic picks up more of the amp’s low end', 'It removes the need for a close mic'],
    correct: 'The room adds something useful to the sound',
    explain: 'A farther mic hears the amp and the room together: worth it when the room helps. Record the close mic alone first, then bring the far one up underneath, and check the blend in mono — distance means delay.',
    why: {
      'A farther mic picks up more of the amp’s low end': 'Farther back, a directional mic usually hears LESS low end (less proximity effect).',
      'It removes the need for a close mic': 'Often the two are blended, or the close mic is kept for isolation — the far mic is a perspective, not a replacement.',
    },
  },
  {
    id: 'eg.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Why keep the mic stand clear of the guitarist’s pedalboard?',
    options: ['The player works the pedals with their feet while playing', 'Pedals put hum into a nearby mic’s cable', 'The pedalboard reflects the amp’s sound straight back into the mic'],
    correct: 'The player works the pedals with their feet while playing',
    explain: 'The pedalboard is part of the player’s space: a stand or cable there can be kicked, move a pedal or trip someone. Keep the stand compact and the cable routed away.',
    why: {
      'Pedals put hum into a nearby mic’s cable': 'The reason is the player’s space and safety, not hum. Keep the area clear.',
      'The pedalboard reflects the amp’s sound straight back into the mic': 'It sits on the floor, away from the speaker’s axis. The reason is the player’s feet.',
    },
  },
  {
    id: 'eg.two.1',
    page: 'twoMic',
    prompt: 'A front mic and a rear mic on an open-backed combo sound thin together. What do you try first?',
    options: ['Flip the rear mic’s polarity, then check in mono', 'Turn the rear mic up until it matches the front mic', 'Move the front mic right up against the grille'],
    correct: 'Flip the rear mic’s polarity, then check in mono',
    explain: `${OPPOSITE_SIDES_POLARITY} Then move or rebalance if it is still thin: a switch cannot fix every frequency.`,
    why: {
      'Turn the rear mic up until it matches the front mic': 'More level deepens the cancellation. The rear mic starts opposite: try flipping its polarity first.',
      'Move the front mic right up against the grille': 'Touching the grille risks noise and does not fix the polarity: the back of the cone is still opposite.',
    },
  },
  {
    id: 'eg.two.2',
    page: 'twoMic',
    prompt: 'You flip one mic’s polarity. What happens to the arrival-time difference between the two?',
    options: ['Nothing — polarity flips the sign, not the timing', 'It drops to zero, so the two arrivals now line up exactly', 'It doubles, because the copy is now inverted'],
    correct: 'Nothing — polarity flips the sign, not the timing',
    explain: 'Polarity inversion reverses the signal’s sign. Only moving a mic changes when the sound arrives: the notches move, the delay does not.',
    why: {
      'It drops to zero, so the two arrivals now line up exactly': 'The mics are still the same distances from the cone: the delay stays.',
      'It doubles, because the copy is now inverted': 'Polarity has no time in it. Only a mic’s position changes the delay.',
    },
  },
  {
    id: 'eg.two.3',
    page: 'twoMic',
    prompt: 'You blend the amp mic with a DI and the low notes go hollow. What do you try first?',
    options: ['Each alone, then mono; move or rebalance, then polarity', 'Turn the DI up until the lows fully come back', 'Boost the lows on the mic channel, then leave the blend as it is'],
    correct: 'Each alone, then mono; move or rebalance, then polarity',
    explain: 'The DI arrives first; the mic, after the sound crosses the air, and the amp shapes it on the way. Hear each alone, then the blend in mono; move the mic or rebalance, then try polarity both ways. No single setting fixes every frequency.',
    why: {
      'Turn the DI up until the lows fully come back': 'More of one path does not undo a cancellation between them — it can hide it until the balance changes.',
      'Boost the lows on the mic channel, then leave the blend as it is': 'EQ cannot fill a notch made by two paths cancelling; find the cause first.',
    },
  },
  {
    id: 'eg.prac.gain',
    page: 'practice',
    prompt: 'Normal playing sits well below the overload light, but the solo’s loudest chords light it. What do you do?',
    options: ['Lower the input gain, or use a pad its manual allows, and re-check', 'Pull the channel fader down until the loudest chords sound clean again', 'Ask the player to turn the amp down for the solo only'],
    correct: 'Lower the input gain, or use a pad its manual allows, and re-check',
    explain: 'Set the input gain with headroom for the loudest passage the player really plays, and watch the overload light. A lower fader does not undo clipping at the input.',
    why: {
      'Pull the channel fader down until the loudest chords sound clean again': 'The overload happens at the input, before the fader; a lower fader only makes the clipped sound quieter.',
      'Ask the player to turn the amp down for the solo only': 'Set the gain for the passage the player intends — the amp’s level is part of their sound.',
    },
  },
  {
    id: 'eg.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second channel on a guitar amp?',
    options: ['Each mic works alone, the pair adds something, it holds up in mono', 'Two channels simply give the mix engineer more to work with later on', 'The guitar needs more level in the mix than one mic can give'],
    correct: 'Each mic works alone, the pair adds something, it holds up in mono',
    explain: 'A second mic — or a DI — should earn its place in the combined sound, for a stated goal. If the pair goes thin, move a mic, rebalance, compare polarity, or leave it out.',
    why: {
      'Two channels simply give the mix engineer more to work with later on': 'More channels also add spill and interactions; a second source must improve the combined sound.',
      'The guitar needs more level in the mix than one mic can give': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'eg.mix.1',
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
    id: 'eg.mix.2',
    page: 'practice',
    prompt: 'The amp gives off a hot smell and the cable at its back looks damaged. What now?',
    options: ['Stop, keep everyone clear, and get a qualified technician', 'Move the mic farther back and carry on with the soundcheck', 'Open the back panel and look for the loose wire yourself'],
    correct: 'Stop, keep everyone clear, and get a qualified technician',
    explain: 'Heat, smoke, a burning smell, damaged cable or a shock are stop conditions. Mic work never includes opening a chassis or touching amp wiring.',
    why: {
      'Move the mic farther back and carry on with the soundcheck': 'The mic is not the problem. A possible electrical fault comes first: stop.',
      'Open the back panel and look for the loose wire yourself': 'The inside of an amp is hot and carries dangerous voltages. That is a technician’s job.',
    },
  },
  {
    id: 'eg.mix.3',
    page: 'practice',
    prompt: 'Two amp mics sound thin together. Which change removes the arrival-time difference itself?',
    options: ['Moving a mic so that the two paths are closer to equal', 'Flipping the polarity switch on one of the two mics', 'Turning the later mic up until it matches the earlier one'],
    correct: 'Moving a mic so that the two paths are closer to equal',
    explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth; neither removes the delay.',
    why: {
      'Flipping the polarity switch on one of the two mics': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
      'Turning the later mic up until it matches the earlier one': 'Level changes the depth of the notches, not where they are or the delay behind them.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 's.fizz',
    observation: 'Too much fizz or harshness',
    firstChecks: 'Is the mic near the dust-cap centre? Slide toward the dust cap’s edge or the outer cone, then compare a small angle.',
    options: ['Slide toward the cap’s edge or the outer cone, then a small angle', 'Turn the amp’s treble control down first, before moving the mic at all', 'Push the mic right against the grille cloth'],
    correct: 'Slide toward the cap’s edge or the outer cone, then a small angle',
    explain: 'One variable at a time: the same distance, a move across the cone, then an angle. Listen to the fizz, the pick attack and the midrange in the full mix.',
    why: {
      'Turn the amp’s treble control down first, before moving the mic at all': 'The amp is the player’s sound. Move the mic first.',
      'Push the mic right against the grille cloth': 'Touching the grille adds noise and changes two things at once. Move across the cone instead.',
    },
  },
  {
    id: 's.dull',
    observation: 'The guitar sounds dull or buried in the mix',
    firstChecks: 'Is the mic toward the outer cone, or aimed away? Shift toward the dust cap’s edge; check with the band before reaching for EQ.',
    options: ['Shift toward the cap’s edge; check it with the band before EQ', 'Add treble on the channel first, and only then think about moving the mic', 'Move the mic over to the middle of the grille'],
    correct: 'Shift toward the cap’s edge; check it with the band before EQ',
    explain: 'Return toward the dust cap’s edge of the active speaker and listen in the full mix — a guitar that sounds fine alone can disappear in the band.',
    why: {
      'Add treble on the channel first, and only then think about moving the mic': 'Placement first: EQ cannot restore articulation the mic is not hearing.',
      'Move the mic over to the middle of the grille': 'The middle of the grille may not be the speaker at all. Stay on the active speaker.',
    },
  },
  {
    id: 's.boom',
    observation: 'The close sound is boomy',
    firstChecks: 'Is the mic extremely close, with the low end lifted by the closeness? Back it off a little, or try another position or pattern.',
    options: ['Back it off a little, or try another spot or pattern', 'Cut the lows hard with a filter on the channel and carry on playing', 'Move it right against the cloth to tighten it'],
    correct: 'Back it off a little, or try another spot or pattern',
    explain: 'A directional mic very close to a source lifts the low end (proximity effect). A little more distance, or another spot, often fixes it before any EQ.',
    why: {
      'Cut the lows hard with a filter on the channel and carry on playing': 'A filter can remove the guitar’s real body too. Try a small move first.',
      'Move it right against the cloth to tighten it': 'Closer makes the proximity lift WORSE, and touching the cloth adds noise.',
    },
  },
  {
    id: 's.hollow',
    observation: 'Two mics sound hollow together',
    firstChecks: 'Do the arrivals or polarities interact? Solo each, check the mono sum; move, rebalance, then compare polarity.',
    options: ['Solo each, then mono; move, rebalance, then polarity', 'Turn both channels up until the sound fills out', 'Invert one mic and keep that, whatever it sounds like'],
    correct: 'Solo each, then mono; move, rebalance, then polarity',
    explain: 'Judge the pair together: each mic alone, the mono sum at matched levels, both polarity states — and a rear mic on an open back starts out inverted.',
    why: {
      'Turn both channels up until the sound fills out': 'More level does not fix a cancellation; it makes the hollow sound louder.',
      'Invert one mic and keep that, whatever it sounds like': 'Compare BOTH polarity states by ear, in mono; a switch cannot fix every frequency.',
    },
  },
  {
    id: 's.wash',
    observation: 'The room mic sounds washy',
    firstChecks: 'Is the room, or stage spill, dominating? Start from the close mic alone; bring the room mic up underneath, or move it closer.',
    options: ['Start from the close mic; bring the room mic in under it', 'Turn the room mic up until it matches the close mic’s level', 'Add a second room mic to balance the first'],
    correct: 'Start from the close mic; bring the room mic in under it',
    explain: 'The close mic is the foundation. Raise the room mic only until it adds space, listen in stereo and in mono, or move it closer if the room or the stage takes over.',
    why: {
      'Turn the room mic up until it matches the close mic’s level': 'Matching levels makes the wash louder. The room mic sits underneath, by ear.',
      'Add a second room mic to balance the first': 'Another distant mic adds more room and spill, not less.',
    },
  },
  {
    id: 's.spill',
    observation: 'Feedback or spill in the PA',
    firstChecks: 'Are other mics open, or is an amp or wedge aimed into a live mic? Lower the level, then revise where the amp, the monitor and the mic point.',
    options: ['Lower the level, then revise amp, wedge and mic aim', 'Turn the guitar channel up so the guitar covers the spill', 'Hang a cloth over the amp’s back to stop it'],
    correct: 'Lower the level, then revise amp, wedge and mic aim',
    explain: 'Make it safe first by lowering the level. Then close unused mics and aim the mic’s rejection at the loudest monitor — never cover an amp’s vents to cut spill.',
    why: {
      'Turn the guitar channel up so the guitar covers the spill': 'More gain feeds the loop — it makes feedback MORE likely.',
      'Hang a cloth over the amp’s back to stop it': 'That blocks the amp’s ventilation. Change the placement instead.',
    },
  },
  {
    id: 's.danger',
    observation: 'Heat, a burning smell, or a damaged cable at the amp',
    firstChecks: 'Is the equipment faulty or its ventilation blocked? Stop, keep everyone clear, and use qualified service.',
    options: ['Stop, keep everyone clear, get qualified service', 'Turn the amp down a little and finish the soundcheck quickly', 'Open the chassis to find the hot part'],
    correct: 'Stop, keep everyone clear, get qualified service',
    explain: 'These are stop conditions. Never open a chassis, defeat a safety ground or change speaker wiring for mic work.',
    why: {
      'Turn the amp down a little and finish the soundcheck quickly': 'A possible fault is not fixed by a lower level. Stop first.',
      'Open the chassis to find the hot part': 'The inside is hot and live: only a qualified technician opens it.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'eg.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic guitar-amp setup in the order you would do them.',
    steps: [
      { text: 'Ask the player to set their guitar, pedals and amp as they will really play', early: 'Start with the player’s real sound.' },
      { text: 'With the amp off or muted, find the speaker behind the grille', early: 'Find the speaker once the player’s setup is fixed.' },
      { text: 'Place the mic on a stable stand near the dust cap’s edge, clear of the grille; route the cable', early: 'You need to know where the speaker is before you place the mic.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom if it is needed', early: 'Power comes after the mic is mounted and connected — with the outputs muted first.' },
      { text: 'Set input gain on the loudest playing, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare centre, cap edge and outer cone, one change at a time, at matched level', early: 'Compare only once the level is set safely — at matched levels, so louder does not win.' },
      { text: 'Write down the speaker, spot, distance, angle and the amp settings', early: 'Document last, once you have chosen.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before connecting, disconnecting or switching it, and follow your own equipment’s manual. Recheck after the amp is moved or the player changes channel or level.',
  },
];

const POWER_REASON: SetupReason = { id: 'r.power', label: 'The channel gives the mic the power it needs (phantom, or none)', role: 'required', feedback: 'Say how the mic is powered: a condenser needs phantom; a dynamic needs none.' };
const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point, measured from the grille in front of the speaker', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };
const CLEAR_REASON: SetupReason = { id: 'r.clear', label: 'Mic, stand and cable stay clear of the grille, the vents and the player’s pedals', role: 'required', feedback: 'Clearance is part of every passing setup.' };
const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand most engineers reach for on a guitar amp', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' };
const BASS_REASON: SetupReason = { id: 'r.bass', label: 'It will give the most bass of any position', role: 'wrong', feedback: 'Bass emphasis is not a passing reason, and no position gives the most bass on every amp.' };

const setupTasks: SetupTask[] = [
  {
    id: 'eg.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A loud club stage, a 1 × 12 combo, a mono PA. One channel; phantom power is available.',
    setups: [
      { id: 'a', label: 'Instrument dynamic close to the grille, aimed at the dust cap’s edge', ok: true, power: 'none', feedback: 'A recommended starting point, close and directional for a loud stage; a dynamic needs no power.' },
      { id: 'b', label: 'Small condenser about 5–15 cm from the grille, on the speaker itself', ok: true, power: 'phantom', feedback: 'Close and directional, and this channel has the phantom power it needs — check its level rating.' },
      { id: 'c', label: 'Instrument dynamic half-way out across the cone, turned a little toward the edge', ok: true, power: 'none', feedback: 'Another good first listen; fine if it suits the player’s tone.' },
      { id: 'd', label: 'A mic 60–90 cm back from the amp, for the room', ok: false, power: 'none', feedback: 'On a loud stage that hears the drums and monitors and lowers the margin before feedback.' },
      { id: 'e', label: 'A dynamic in the middle of the grille, wherever the speaker is', ok: false, power: 'none', feedback: 'On a combo the middle of the grille may not be the speaker. Find it first.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'Close, directional pickup helps against stage spill and feedback', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, BASS_REASON],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point measured from the grille, clearance, and power that matches the mic.',
  },
  {
    id: 'eg.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A studio, a good room, the same open-backed combo; the player wants a fuller, wider sound. Two inputs, NO phantom power.',
    setups: [
      { id: 'a', label: 'A dynamic at the dust cap’s edge, plus a dynamic 15–30 cm behind the open back, polarity flipped', ok: true, power: 'none', feedback: 'A front-and-rear pair from outside, checked in mono — dynamics need no phantom.' },
      { id: 'b', label: 'A dynamic close at the cap’s edge, plus a dynamic 60–90 cm back for the room', ok: true, power: 'none', feedback: 'Close plus room in a good room — bring the room mic up under the close one and check in mono.' },
      { id: 'c', label: 'A small condenser 60–90 cm back, and a dynamic close in', ok: false, power: 'phantom', feedback: 'These inputs have no phantom power for the condenser.' },
      { id: 'd', label: 'A dynamic inside the open back, by the valves', ok: false, power: 'none', feedback: 'Nothing goes inside the amp: the chassis and valves are hot and live.' },
      { id: 'e', label: 'Two dynamics side by side at the same spot on the cone', ok: false, power: 'none', feedback: 'Two mics hearing the same thing add little and can comb — give the second a different view.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.mono', label: 'Each mic is heard alone, then the pair is blended and checked in mono', role: 'optional', feedback: 'A good habit with any two-mic pickup.' }, BRAND_REASON, BASS_REASON],
    explain: 'Two pickups pass. What passes is the reasoning: two different views of the amp, from outside, powered by what these inputs supply, checked in mono.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you begin: an electric guitar’s strings vibrate over the pickups. Where does most of the sound you will mic come from?', options: ['The amp’s speaker', 'The strings themselves', 'The guitar’s body'], after: 'Now step through the harmonics and the pickups.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Toward the rear, off to one side'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: keeping the distance, you slide the mic from the dust cap’s edge toward the cone’s edge. What changes?', options: ['Brighter', 'Smoother and darker', 'It depends on this speaker'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'Where will this cardioid reject the guitarist’s wedge best?', options: ['Straight behind the mic', 'At the sides of the mic', 'In front of the mic'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION.' },
  twoMic: { prompt: 'If you flip one mic’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

/* THE QUICK CHECK: 6 items, two per foundation page; q.5 (a speaker output)
 * and q.6 (hearing) are critical. It opens the activities; it credits NOTHING. */
const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'On a combo amp, where is the speaker you will mic?',
    options: ['Behind the grille, wherever it really sits — find it first', 'In the exact middle of the grille cloth', 'Behind the control panel, at the very top of the amp’s front'],
    correct: 'Behind the grille, wherever it really sits — find it first',
    explain: 'On many combos the speaker sits off-centre, under the controls. Find it from outside the grille — with the amp off or muted — before you place a mic.',
    why: {
      'In the exact middle of the grille cloth': 'The middle of the grille is not necessarily the middle of the speaker.',
      'Behind the control panel, at the very top of the amp’s front': 'The control panel holds the knobs; the speaker sits below it, behind the grille.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What does an electric guitar’s pickup do?',
    options: ['Turns the strings’ motion into a small electrical signal', 'Picks up the sound of the room around it, like a tiny microphone', 'Makes the strings louder in the air around the guitar'],
    correct: 'Turns the strings’ motion into a small electrical signal',
    explain: 'A pickup is a magnet wound with fine wire: the steel string moving over it makes a small signal, which the amp turns into sound through its speaker.',
    why: {
      'Picks up the sound of the room around it, like a tiny microphone': 'It senses the steel strings’ motion magnetically, not the air.',
      'Makes the strings louder in the air around the guitar': 'It makes no sound itself; the amp and speaker do.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'Why does a bridge pickup tend to sound brighter than a neck pickup?',
    options: ['Near the bridge, the note itself barely moves the string', 'It sits nearer the output jack, so less of its signal is lost', 'The bridge vibrates and adds its own high notes'],
    correct: 'Near the bridge, the note itself barely moves the string',
    explain: 'Each pickup senses its own spot. Close to the bridge the fundamental moves the string very little while the higher harmonics still move it: a brighter, thinner balance.',
    why: {
      'It sits nearer the output jack, so less of its signal is lost': 'The wiring is a few centimetres either way; the pickup’s place on the string is what matters.',
      'The bridge vibrates and adds its own high notes': 'The pickup senses the steel string above it, not the bridge.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'A speaker cone moves forward. The air behind an open-backed combo is…',
    options: ['pulled — the back sounds opposite in polarity', 'pushed out of the open back at the same moment', 'still — only the front of a cone moves air'],
    correct: 'pulled — the back sounds opposite in polarity',
    explain: 'The cone pushes the air in front and pulls the air behind at the same moment: an open back radiates the same motion, opposite in polarity.',
    why: {
      'pushed out of the open back at the same moment': 'Moving forward, the cone pushes the FRONT air and pulls the back air.',
      'still — only the front of a cone moves air': 'Both faces of the cone move air; an open back lets the rear sound out.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'The desk is short of inputs. Can the amp’s speaker output go straight into a desk input?',
    options: ['No — a speaker output goes only to a speaker', 'Yes, through the input pad on the desk’s channel', 'Yes, if the amp is turned down low first'],
    correct: 'No — a speaker output goes only to a speaker',
    explain: 'A speaker output carries high power. It goes to a speaker, by a speaker cable — never to a mic, line or DI input. Use the amp’s own direct output only as its manual describes.',
    why: {
      'Yes, through the input pad on the desk’s channel': 'An input pad is not made for speaker-level power. The connection itself is the danger.',
      'Yes, if the amp is turned down low first': 'Turning down does not make the connection safe — and some amps must never run without their speaker.',
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

export const C02_LESSON: Lesson = {
  id: 'C02',
  labId: 'strings',
  title: 'Electric Guitar',
  subtitle: 'The guitar amp: across the cone, close or back, front and rear',
  noun: { one: 'guitar amp', many: 'guitar amps' },
  model: C02_MODEL,
  micTypeIds: [...C02_MICS],
  zones: C02_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A solid-body electric guitar and the amp it plays through. On its own the guitar is very quiet: its pickups turn the strings’ motion into a small electrical signal, and the amp and its speaker make the sound. The mic hears the speaker — not the guitar.', src: 'LESSON L4-L6' },
    { title: 'WHERE YOU MEET IT', text: 'Rock, pop, blues, jazz, country and worship bands, on stage and in the studio — through a combo (amp and speaker in one box) or a separate head and cabinet. The speaker itself is covered in full in the Amplified speakers & Leslie module.', src: 'LESSON L4' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Rhythm, riffs and solos. The player’s tone is the guitar, the pedals, the amp’s settings AND the speaker — clean, edge-of-breakup or heavily driven. Mic the amp they bring, as they set it.', src: 'LESSON L6' },
    { title: 'ITS SIZE', text: 'A common combo with one 12 in speaker is about 62 cm wide, 44.5 cm tall and 24 cm deep. The speaker often sits off-centre, under the controls; the back is often open.', src: 'FEN-65DR-MAN' },
  ],
  sound: {
    stages: [
      { title: 'The signal reaches the voice coil', text: 'The amp’s signal — the strings’ motion, shaped and made much stronger — flows through the voice coil, in the magnet’s gap behind the cone.' },
      { title: 'The cone moves as one', text: 'The coil pushes against the magnet’s field and drives the cone forward and back. At low pitches the whole cone moves together, like a piston — drawn here many times larger than it really moves.' },
      { title: 'Push in front, pull behind', text: 'As the cone moves forward it pushes the air in front of it and pulls the air behind it — at the same moment, opposite ways.' },
      { title: 'Sound leaves', text: 'Sound leaves the front, through the grille. With a closed back, the sound from the back of the cone stays in the box.', ported: 'Sound leaves the front, through the grille — and the back, through the open back, opposite in polarity: thicker and duller, with the chassis in the way.' },
    ],
    attack: 'The pick’s attack — the first instant of the note, rich in high harmonics — reaches the cone first. A close mic aimed near the middle of the cone tends to hear more of it: articulation, or fizz on a driven tone.',
    body: 'The held note and its sustain, with the cabinet’s own resonance and the room. A mic toward the edge of the cone, or farther back, tends to hear more of it. Both are tendencies, and speakers vary.',
    head: { diameterMm: 305, rods: 0, label: '12 in speaker, face-on', strikeSrc: 'CEL-V30' },
  },
  setting: {
    items: [
      { id: 'player', label: 'the guitarist and the guitar', short: 'GUITAR', note: 'The strings, the pickups and the guitar’s own controls start the sound. Ask which pickups, which pedals and which amp channel they will really use.', prov: { kind: 'illustrative', reason: 'a generic signal path and stage position' }, tag: 'ASK FIRST', scene: 'all' },
      { id: 'pedals', label: 'the pedals at the player’s feet', short: 'PEDALS', note: 'Effects the player switches with their feet while they play. Their sound is part of the tone — and the pedalboard is the player’s working space: no stand or cable in it.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'dibox', label: 'a DI box before the amp', short: 'DI BOX', note: 'Splits the guitar’s signal: one side on to the amp, a balanced output to the desk. It hears no amp, speaker or room — a separate, dry source, not a mic. If pedals come before it, it is no longer dry.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'NOT THE AIR', scene: 'all' },
      { id: 'amp', label: 'the combo amp', short: 'COMBO', note: 'The amplifier and its speaker in one box. Its settings and its level are the player’s sound. Keep its vents clear, and never change its speaker wiring.', prov: { kind: 'illustrative', reason: 'a generic signal path and stage position' }, tag: 'THE SOURCE', scene: 'all' },
      { id: 'cab', label: 'the speaker in the combo', short: 'SPEAKER', note: 'Connected to the amp inside the box — on many combos the amp must never be on without it. The cone moves the air: this is what the mic hears.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'WHAT A MIC HEARS', scene: 'all' },
      { id: 'mic', label: 'the microphone', short: 'MIC', note: 'An airborne pickup of the speaker, the box and the room. Close in, it hears mostly the speaker; farther back, more of the room and the stage.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'AIR PATH', scene: 'all' },
      { id: 'desk', label: 'the desk (mixing console)', short: 'DESK', note: 'Where every source arrives and the input gain is set — the mic, the DI and any direct output each on its own, labelled channel.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'GAIN HERE', scene: 'all' },
      { id: 'ampdi', label: 'the amp’s own direct output', short: 'AMP OUT', note: 'Some amps have a line or simulated-speaker output. Where it is taken, and whether it imitates a speaker, is in that amp’s manual. Still electrical — not the air.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'NOT THE AIR', scene: 'all' },
      { id: 'wedge', label: 'the guitarist’s wedge', short: 'WEDGE', note: 'A floor monitor downstage, facing back toward the player — behind an amp mic aimed at the speaker.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'drums', label: 'the drum kit', short: 'DRUMS', note: 'A loud neighbour. A close, directional amp mic hears more of the guitar and less of the kit.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'stage' },
      { id: 'otherAmp', label: 'the bass amp', short: 'BASS AMP', note: 'Another loud speaker on the backline. Aim the guitar mic so its rejection faces the loudest neighbour where you can.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'all' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'On a loud stage the amp is already heard in the room: the PA adds only what the audience needs.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a quiet studio a farther mic can add the room — when it sounds good.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: backline amps, wedges, a drum kit and a PA. A close, directional amp mic on a compact stand hears more of the guitar and less of the stage, with more gain before feedback; the PA supplements the stage sound rather than doubling it.',
    studio: 'STUDIO: time to compare positions, no wedges on the floor, and a room that may add something — a farther mic, or a front-and-rear pair on an open-backed amp.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic setup for a given amp and show, describe an alternative, and say what would justify a second channel. With a real amp and the player’s agreement, you can log what you tried below.',
    fields: [
      { id: 'source', label: 'Amp, speaker, open or closed back, the player’s settings', kind: 'text' },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['instrument dynamic', 'small condenser', 'large dynamic', 'other'] },
      { id: 'site', label: 'Spot on the cone, distance from the grille, angle', kind: 'text' },
      { id: 'tone', label: 'Clean and driven: what you heard (tendencies, in words)', kind: 'text' },
      { id: 'mono', label: 'Second mic or DI: alone, together, in mono', kind: 'text' },
      { id: 'notes', label: 'Stand, cable, vents checked; final choice and its limitation', kind: 'text' },
    ],
  },
  // INTERNAL record (never shown).
  unknowns: [
    { text: 'Whether the combo stands on the floor, raised or tilted back: drawn standing on the floor — so no HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The combo’s speaker position on the baffle (60 mm right of centre, 255 mm below the top), its open back, the control-panel band (90), the chassis (80) and the valves (70): drawing defaults — the maker’s manual has no drawing.', dims: [] },
    { text: 'The 12 in speaker’s dust-cap radius (50), the surround’s inner edge (128), cone depth and dome height: drawing defaults (the maker’s speaker drawn with a reference 12 in driver’s sizes).', dims: [] },
    { text: 'A rear-mic distance behind an open back: none in the research; 15–30 cm is a drawing default that starts outside the 6 in of clear air space the maker asks for behind the amp.', dims: [] },
    { text: 'The electric guitar’s dimensions, scale length (25.5 in) and pickup positions (41 / 100 / 160 mm from the bridge): drawing defaults; no electric-guitar geometry is in the research.', dims: [] },
    { text: 'The “half-way across the cone” position has no published distance: the lab uses its shared close band (½–2 in).', dims: [] },
  ],
  live: {
    wedges: [
      {
        id: 'guitarWedge',
        label: 'the guitarist’s wedge, downstage, facing back toward the player',
        short: 'WEDGE',
        p: { x: 1900, y: FLOOR, z: 0 },
        lift: 150,
        faces: { x: -1, y: 0, z: 0 },
        note: 'It sits downstage of the player, behind a mic that faces the amp — where a cardioid rejects most.',
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
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every guitar, amp, speaker, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: one combo with a 12 in speaker (its outer size is real; where the speaker sits, the open back and the controls are drawing choices), an ideal string, textbook mic patterns, and cone and string motion drawn larger. Distances are rounded to about 5 mm and measured from the grille to the mic’s front. Place mics with the amp off or muted, never open an amp, and send a speaker output only to a speaker.',
};
