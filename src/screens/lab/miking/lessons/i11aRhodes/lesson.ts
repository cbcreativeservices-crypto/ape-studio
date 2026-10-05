/**
 * I11a RHODES (TINE PIANO) (Lab 2, Percussion) — the lesson as DATA. Words
 * from the owner's lesson (docs/labs/miking/source_text/
 * Rhodes-Miking-Technique-Research.txt, "L<n>" in COMMENTS only), with the
 * fixes in CORRECTIONS_LOG.md (RH-01 …) applied. Research:
 * docs/labs/miking/rhodes/ (SOURCES.md, GEOMETRY_PROPOSAL.md).
 *
 * Owner ruling 2026-10-04: suggested starting points, never dogma; no
 * source, brand or model names, no badges, no Sources page. The internal
 * record lives in the code-only fields and in docs/. FULLY SILENT.
 *
 * The struck tine is the instrument; its useful sound comes from an
 * amplified speaker, so the lesson mics the speaker (the speaker family's
 * combo, reused) and draws the direct signal apart, as a comparison.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, PageContent, PageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { I11A_MODEL, I11A_ZONES } from './geometry.ts';
import { I11A_MICS } from './model.ts';

const FLOOR = I11A_MODEL.yFloor.mm;

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the tine piano and its amp',
    goal: 'Get to know the tine piano — keys, hammers, tines, tonebars and pickups — and find the speaker it plays through, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A hammer strikes a steel tine; a pickup turns its motion into a small signal; the amp and its speaker make the sound you mic. Find that speaker first — and never open the instrument to do it.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a struck tine becomes a signal and the signal becomes moving air — and why the spot on the cone matters. Shown, never played.',
    credit: { scenarios: ['rh.snd.1', 'rh.snd.2', 'rh.snd.3'], interactive: 'soundPath', note: 'Step the mechanism to the end and swing the tine by hand, step the cone through to the end, and answer the three checks.' },
    takeaway: 'The tine and its tonebar ring together; the pickup senses the tine’s tip. In the amp the cone pushes in front and pulls behind. Close in, the centre of the cone tends to sound brighter than the edge.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the path from the tines to the desk — which feeds hear the air and which are wires — what sits round the keyboard and its amp, and what to do before any mic.',
    credit: { scenarios: ['rh.set.1', 'rh.set.2', 'rh.set.3'], note: 'Answer the three checks.' },
    takeaway: 'A mic on the amp hears air; a DI is a separate electrical source. A speaker output goes only to a speaker. Keep the pedal foot and the amp’s vents clear, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the keyboard’s amp by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['rh.mic.1', 'rh.mic.2', 'rh.mic.3', 'rh.rec.1'], note: 'Answer the four checks (one reaches back to how it sounds).' },
    takeaway: 'No mic is “the electric-piano mic”. A directional dynamic is a practical first choice close up; a condenser or ribbon can suit a studio when its rating, power and handling allow. Compare at matched level.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin on the keyboard’s amp — close, at the dust cap’s edge, measured from the grille — then move across the cone and away from it, one change at a time.',
    credit: { scenarios: ['rh.place.1', 'rh.place.2', 'rh.place.3', 'rh.rec.2'], interactive: 'twoZones', note: 'Rest the mic in two different recommended starting points, clear of every part, and answer the four checks.' },
    takeaway: 'Measure from the grille, on the speaker that is sounding, and change one thing at a time: across the cone, OR away from it, OR the angle. Judge on chords, single notes, low and high, soft and hard.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the amp mic so its pattern’s rejection faces the player’s wedge — and know what a studio and a stage each ask of it.',
    credit: { scenarios: ['rh.ctx.1', 'rh.ctx.2', 'rh.ctx.3', 'rh.ctx.studio', 'rh.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the keyboard player’s wedge sits in the rejection. STUDIO: answer the decision card. Then the four checks.' },
    takeaway: 'A close, directional mic hears more of the amp and less of the stage. Aim by the mic’s real pattern; a farther mic for the room is a studio choice, rarely a live one. Real nulls are shallower than the picture.',
  },
  twoMic: {
    title: 'Two sources',
    goal: 'Blend a front and a rear mic on the open-backed combo — or a mic and the direct signal — and see what polarity does and does not change.',
    credit: { scenarios: ['rh.two.1', 'rh.two.2', 'rh.two.3'], interactive: 'polarityVsDelay', note: 'Flip the polarity both ways AND move a mic so the delay changes, then answer the three checks.' },
    takeaway: 'Hear each source alone, then together in mono, at matched levels. The direct signal arrives first and lacks the speaker and room. Move or rebalance before reaching for polarity or delay; polarity flips the sign, it does not remove a delay.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Move the mic before reaching for EQ, one change at a time. A clanking note, hum or a hot smell is not a mic problem: stop, and involve the owner or a technician.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one amp mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second channel.',
    credit: { scenarios: ['rh.prac.order', 'rh.prac.gain', 'rh.prac.setup1', 'rh.prac.setup2', 'rh.prac.3', 'rh.mix.1', 'rh.mix.2', 'rh.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real instrument.' },
    takeaway: 'Trace the signal, find the speaker, place the mic clear of the grille, set the gain on the strongest accents, compare one change at a time at matched level, check every blend in mono, and write it down.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only: rh.snd.* L4, L6-L7 + RH-SM79 ·
 * rh.set.* L6, L39, L47-L49 · rh.mic.* L13, L48 · rh.place.* L10-L11 ·
 * rh.ctx.* L16, L45-L46 · rh.two.* L15-L16, L39-L40 · rh.prac/mix L7, L9-L12, L76-L81.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'rh.snd.1',
    page: 'sound',
    prompt: 'What does the tonebar above each tine do?',
    options: ['It rings at the tine’s pitch and helps the note sustain', 'It is the pickup that senses the tine', 'It stops the tine from ringing as soon as the key is let go'],
    correct: 'It rings at the tine’s pitch and helps the note sustain',
    explain: 'The tine and the tonebar are joined at the block like the two prongs of a tuning fork: struck through the tine, the pair rings at one pitch, and the heavier tonebar keeps the note going. The pickup is a separate part at the tine’s tip.',
    why: {
      'It is the pickup that senses the tine': 'The pickup is a coil and magnet at the tine’s tip. The tonebar is steel, ringing with the tine.',
      'It stops the tine from ringing as soon as the key is let go': 'That is a damper’s job. The tonebar rings WITH the tine — it is part of the vibrating pair.',
    },
  },
  {
    id: 'rh.snd.2',
    page: 'sound',
    prompt: 'Where does the sound you will mic come from?',
    options: ['The speaker of the amp the piano plays through', 'The tines themselves, which are loud right next to the keys', 'The hammers, heard through the harp cover'],
    correct: 'The speaker of the amp the piano plays through',
    explain: 'The tines are faintly audible near the keys, but the instrument’s useful sound is electrical: the pickups’ signal goes to an amp, and its speaker moves the air. The mic hears the speaker — and with it, the amp, the effects and the cabinet.',
    why: {
      'The tines themselves, which are loud right next to the keys': 'The tines are very quiet in the air. Their motion is turned into a signal, and the speaker makes it loud.',
      'The hammers, heard through the harp cover': 'Key and hammer noise is a small by-product, not the sound you want. Mic the speaker.',
    },
  },
  {
    id: 'rh.snd.3',
    page: 'sound',
    prompt: 'Why does a close mic aimed at the middle of the amp’s speaker tend to sound brighter than one aimed toward its edge?',
    options: ['At higher pitches, the middle of the cone does more of the work', 'The outer part of the cone moves too slowly to make the high notes', 'The dust cap adds high notes of its own'],
    correct: 'At higher pitches, the middle of the cone does more of the work',
    explain: 'At low pitches the whole cone moves as one. Higher up, the cone flexes, and more of the high-frequency sound comes from the middle, near the voice coil. Close in, the spot the mic faces tilts the balance — a tendency to check on each speaker.',
    why: {
      'The outer part of the cone moves too slowly to make the high notes': 'Speed is not the reason: at higher pitches the middle of the cone simply does more of the work.',
      'The dust cap adds high notes of its own': 'The dust cap moves with the cone; it adds nothing. More of the highs come from the middle.',
    },
  },
  {
    id: 'rh.set.1',
    page: 'setting',
    prompt: 'A DI box sits between the keyboard and its amp. What does its output to the desk carry?',
    options: ['The keyboard’s signal before the amp — no speaker or room', 'The amp’s whole sound, with only the speaker’s colour taken out', 'A cleaner copy of what the mic hears'],
    correct: 'The keyboard’s signal before the amp — no speaker or room',
    explain: 'A DI before the amp taps the instrument’s own signal. It never passes through the amp, the speaker or the room — a separate source, useful to compare or blend, not a copy of the mic.',
    why: {
      'The amp’s whole sound, with only the speaker’s colour taken out': 'A DI BEFORE the amp has not been through the amp at all.',
      'A cleaner copy of what the mic hears': 'It never passes through the speaker or the room, so it is a different sound, not a copy.',
    },
  },
  {
    id: 'rh.set.2',
    page: 'setting',
    prompt: 'The keyboard has an XLR output. Can you assume it is line level?',
    options: ['No — check its manual; some are meant for mic-level inputs', 'Yes, an XLR output is line level by definition', 'Yes, as long as the cable you use is a balanced, shielded one'],
    correct: 'No — check its manual; some are meant for mic-level inputs',
    explain: 'A connector does not tell you the level. Some electric pianos have balanced XLR outputs made for mic-level inputs; a ¼-inch jack is not a speaker output either. Read the model’s own manual before you patch it.',
    why: {
      'Yes, an XLR output is line level by definition': 'The connector says nothing about the level. Check the model’s manual.',
      'Yes, as long as the cable you use is a balanced, shielded one': 'A balanced cable carries whatever level the output gives. Check the manual.',
    },
  },
  {
    id: 'rh.set.3',
    page: 'setting',
    prompt: 'Where does the amp mic’s cable go on stage?',
    options: ['Away from the pedal foot and the amp’s vents', 'Under the keyboard, next to the sustain pedal', 'Along the back of the amp, close to the vents'],
    correct: 'Away from the pedal foot and the amp’s vents',
    explain: 'The player works the sustain pedal with their foot all through the song, and the amp needs its vents clear to cool. Route the cable away from both, and away from the instrument’s legs.',
    why: {
      'Under the keyboard, next to the sustain pedal': 'That is where the player’s foot works: a cable there can snag the foot or the pedal.',
      'Along the back of the amp, close to the vents': 'The vents get hot and need open air. Keep cables and stands clear of them.',
    },
  },
  {
    id: 'rh.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · The tine itself vibrates. Why not mic the tines?',
    options: ['They are faint in the air; the sound is at the speaker', 'They are far too loud for a close mic to handle cleanly', 'Their sound is the same as the speaker’s'],
    correct: 'They are faint in the air; the sound is at the speaker',
    explain: 'The tines make little sound in the air — and reaching them means opening the instrument, which is never part of mic work. The pickup, the amp and the speaker make the sound the player chose.',
    why: {
      'They are far too loud for a close mic to handle cleanly': 'They are quiet, not loud. The speaker is what is loud.',
      'Their sound is the same as the speaker’s': 'The speaker adds the amp, the effects and the cabinet: the tines alone are a different, faint sound.',
    },
  },
  {
    id: 'rh.mic.1',
    page: 'microphone',
    prompt: 'Is there one microphone type that is “the right mic” for this amp?',
    options: ['No — compare suitable mics by ear at matched level', 'Yes — a condenser, to catch the instrument’s fine detail', 'Yes, a dynamic, because amps are loud'],
    correct: 'No — compare suitable mics by ear at matched level',
    explain: 'No type is inherently the electric-piano mic. A directional dynamic is a practical live start; a condenser or ribbon can suit a studio when its level rating, power and handling allow. Compare on the real amp.',
    why: {
      'Yes — a condenser, to catch the instrument’s fine detail': 'A condenser can suit, but so can others — compare by ear.',
      'Yes, a dynamic, because amps are loud': 'A dynamic is a practical start, not the only right answer. Check ratings and compare.',
    },
  },
  {
    id: 'rh.mic.2',
    page: 'microphone',
    prompt: 'You want to try a ribbon mic on the amp in a studio. What first?',
    options: ['Read its manual: level limits, mounting and phantom power', 'Turn the phantom power on so it is ready', 'Place it as close to the grille as you can, for the most detail'],
    correct: 'Read its manual: level limits, mounting and phantom power',
    explain: 'Ribbons vary: some must never see phantom power, some handle less level close up. Follow that mic’s own manual rather than a rule about all ribbons — then place it and compare.',
    why: {
      'Turn the phantom power on so it is ready': 'Some ribbons can be damaged by phantom power. Check its manual first.',
      'Place it as close to the grille as you can, for the most detail': 'Very close can exceed a fragile mic’s limit. Check its rating first.',
    },
  },
  {
    id: 'rh.mic.3',
    page: 'microphone',
    prompt: 'The channel has no phantom power. Which of this page’s mic types can you use?',
    options: ['The instrument dynamic: it needs no power', 'The small condenser, set a little farther back', 'The small condenser, if the amp is switched on'],
    correct: 'The instrument dynamic: it needs no power',
    explain: 'A dynamic needs no power. A condenser needs phantom power from the desk wherever it is placed — the amp powers its speaker, not the mic.',
    why: {
      'The small condenser, set a little farther back': 'Distance does not change what a condenser needs: phantom power.',
      'The small condenser, if the amp is switched on': 'The amp does not power the mic. The condenser needs phantom from the desk.',
    },
  },
  {
    id: 'rh.place.1',
    page: 'placement',
    prompt: 'A starting point says “about 2.5–15 cm (1–6 in)”. Measured from what?',
    options: ['From the grille cloth, in front of the speaker itself', 'From the middle of the grille, wherever the speaker is', 'From the keyboard, to the amp’s front'],
    correct: 'From the grille cloth, in front of the speaker itself',
    explain: 'The lab measures from the grille cloth — the surface you can see — and the number belongs to the speaker that is really sounding. On this combo the speaker sits off-centre, under the controls.',
    why: {
      'From the middle of the grille, wherever the speaker is': 'The middle of the grille is not the middle of the speaker on many amps. Find the speaker first.',
      'From the keyboard, to the amp’s front': 'The keyboard is not the sound source you mic. Measure from the grille in front of the speaker.',
    },
  },
  {
    id: 'rh.place.2',
    page: 'placement',
    prompt: 'Chords sound a little thin and bright at the dust cap’s edge. Which next try keeps the comparison fair?',
    options: ['Slide outward across the cone, keeping the distance', 'Move it farther back and outward across the cone in one go', 'Swap the mic and move it at the same time'],
    correct: 'Slide outward across the cone, keeping the distance',
    explain: 'One change at a time: slide across the cone at the same distance first — outward tends to be warmer. Then, if needed, a little more distance — compared at matched level, on the same phrase.',
    why: {
      'Move it farther back and outward across the cone in one go': 'Two changes at once: you cannot tell which one made the difference.',
      'Swap the mic and move it at the same time': 'Again two changes at once. A small move often matters more than a different mic.',
    },
  },
  {
    id: 'rh.place.3',
    page: 'placement',
    prompt: 'You compare two spots. What do you play to judge them?',
    options: ['Soft chords, hard accents, low and high notes, with pedal', 'One loud note, held for a long time, in the middle of the keyboard', 'Whatever the player is warming up with'],
    correct: 'Soft chords, hard accents, low and high notes, with pedal',
    explain: 'A tine piano changes a lot with touch and register: hard notes bark, soft ones are round, low notes are full. Judge whole phrases at the player’s real level, with the sustain pedal — not one isolated note.',
    why: {
      'One loud note, held for a long time, in the middle of the keyboard': 'One note hides how the spot treats soft chords, accents and the low and high ends.',
      'Whatever the player is warming up with': 'Ask for the real part, at its real level: soft, hard, low and high.',
    },
  },
  {
    id: 'rh.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Which of these does NOT hear the air from the amp?',
    options: ['A DI box between the keyboard and the amp', 'A mic a few centimetres in front of the grille', 'A mic behind the combo’s open back'],
    correct: 'A DI box between the keyboard and the amp',
    explain: 'A DI is an electrical tap taken before the amp. Both mics hear air from the speaker — the front and the back of the cone.',
    why: {
      'A mic a few centimetres in front of the grille': 'That mic hears the air in front of the cone — the amp’s own sound.',
      'A mic behind the combo’s open back': 'That mic hears the air behind the cone — still the amp’s air, opposite in polarity.',
    },
  },
  {
    id: 'rh.ctx.1',
    page: 'context',
    prompt: 'On a loud stage, what does one close, directional mic on the amp give you?',
    options: ['More amp, less stage, and more gain before feedback', 'A louder amp in the room for the whole audience to hear', 'The same sound as a mic far back'],
    correct: 'More amp, less stage, and more gain before feedback',
    explain: 'Close and directional favours the amp over the drums and the wedges — the usual live reasons. A farther room mic hears more of the stage, so it is rarely a live answer.',
    why: {
      'A louder amp in the room for the whole audience to hear': 'The mic does not change the amp’s level in the room; it changes what reaches the PA.',
      'The same sound as a mic far back': 'Far back hears more room and spill: a different sound, and less gain before feedback.',
    },
  },
  {
    id: 'rh.ctx.2',
    page: 'context',
    prompt: 'The player’s wedge is off to one side behind your cardioid amp mic. Turning the mic, where do you want the wedge?',
    options: ['Straight behind the mic, where a cardioid rejects most', 'Off to its side, about ninety degrees off its front axis', 'In front of the mic, beside the amp'],
    correct: 'Straight behind the mic, where a cardioid rejects most',
    explain: 'A cardioid rejects most at 180°. Turn the mic (it still faces the speaker) until the wedge sits behind it — or use a super- or hypercardioid, whose nulls sit off to each side of the rear. Real nulls are shallower than the picture.',
    why: {
      'Off to its side, about ninety degrees off its front axis': 'At 90° a cardioid still picks up about half (−6 dB). Its deepest rejection is directly behind.',
      'In front of the mic, beside the amp': 'That is where it picks up most. A wedge there feeds straight into it.',
    },
  },
  {
    id: 'rh.ctx.3',
    page: 'context',
    prompt: 'The player uses two amps for stereo panning, and the PA is mono. What do you do?',
    options: ['Mic each amp alike, then check the mono sum', 'Pan the two mics hard left and right anyway', 'Mic only the amp nearest the player'],
    correct: 'Mic each amp alike, then check the mono sum',
    explain: 'If the two amps really carry different signals, a comparable mic on each at a matched distance keeps their difference. In a mono PA, hear the sum: the movement heard at the keyboard may not reach the audience — a production decision after listening.',
    why: {
      'Pan the two mics hard left and right anyway': 'A mono PA cannot pan. Check what the sum sounds like first.',
      'Mic only the amp nearest the player': 'That may lose half of the effect. Hear both, and the sum, before deciding.',
    },
  },
  {
    id: 'rh.ctx.studio',
    page: 'context',
    prompt: 'Studio, a good-sounding room. What could justify a second mic farther back from the amp?',
    options: ['The room adds something useful to the sound', 'A farther mic hears more of the amp’s low end', 'It removes the need for a close mic'],
    correct: 'The room adds something useful to the sound',
    explain: 'A farther mic hears the amp and the room together: worth it when the room helps. Record the close mic first, bring the far one up under it, and check in mono — distance means delay.',
    why: {
      'A farther mic hears more of the amp’s low end': 'Farther back, a directional mic usually hears LESS low end (less proximity effect).',
      'It removes the need for a close mic': 'Often the two are blended. The far mic is a perspective, not a replacement.',
    },
  },
  {
    id: 'rh.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Why keep the stand clear of the space under the keyboard?',
    options: ['The player’s foot works the sustain pedal there', 'Stands placed there pick up electrical hum from the keys', 'The keyboard reflects the amp into the mic'],
    correct: 'The player’s foot works the sustain pedal there',
    explain: 'The sustain pedal is in use all through the song: a stand leg or cable there can trip the foot or move the pedal. Keep the stand compact and the cable routed away.',
    why: {
      'Stands placed there pick up electrical hum from the keys': 'The reason is the player’s foot and safety, not hum.',
      'The keyboard reflects the amp into the mic': 'The reason is the player’s space and the pedal, not reflections.',
    },
  },
  {
    id: 'rh.two.1',
    page: 'twoMic',
    prompt: 'A front mic and a rear mic on the open-backed combo sound thin together. What do you try first?',
    options: ['Flip the rear mic’s polarity, then check in mono', 'Turn the rear mic up until it matches the front mic', 'Move the front mic against the grille'],
    correct: 'Flip the rear mic’s polarity, then check in mono',
    explain: 'The back of the cone moves opposite to the front, so the rear mic starts out inverted. Flip it, then judge the pair in mono at matched levels — and move or rebalance if it is still thin.',
    why: {
      'Turn the rear mic up until it matches the front mic': 'More level deepens the cancellation. The rear signal is inverted: flip it first.',
      'Move the front mic against the grille': 'Touching the grille adds noise and does not fix the polarity.',
    },
  },
  {
    id: 'rh.two.2',
    page: 'twoMic',
    prompt: 'You blend the amp mic with the direct signal and the attack smears. What do you try first?',
    options: ['Each alone, then mono; move or rebalance, then polarity', 'Delay the direct signal by the amount shown on a diagram', 'Invert the direct signal and leave it'],
    correct: 'Each alone, then mono; move or rebalance, then polarity',
    explain: 'The direct signal arrives first; the mic, after the sound crosses the air, and the amp shapes it on the way. Hear each alone and the blend in mono; change the geometry or the balance before trying polarity or delay — and only by ear.',
    why: {
      'Delay the direct signal by the amount shown on a diagram': 'Delay or polarity is not set from a diagram: listen to the real blend first.',
      'Invert the direct signal and leave it': 'Try polarity both ways by ear, in mono — a switch cannot fix every frequency.',
    },
  },
  {
    id: 'rh.two.3',
    page: 'twoMic',
    prompt: 'You flip one source’s polarity. What happens to the arrival-time difference?',
    options: ['Nothing — polarity flips the sign, not the timing', 'It drops to zero, so the two arrivals line up exactly', 'It doubles, because the copy is inverted'],
    correct: 'Nothing — polarity flips the sign, not the timing',
    explain: 'Polarity reverses the signal’s sign. Only moving a mic changes when the sound arrives: the notches move, the delay does not.',
    why: {
      'It drops to zero, so the two arrivals line up exactly': 'The paths are unchanged, so the delay stays.',
      'It doubles, because the copy is inverted': 'Polarity has no time in it. Only a position changes the delay.',
    },
  },
  {
    id: 'rh.prac.gain',
    page: 'practice',
    prompt: 'Normal playing sits well below the overload light, but hard accents light it. What do you do?',
    options: ['Lower the input gain, or use a pad its manual allows, and re-check', 'Pull the channel fader down until the hard accents sound clean again', 'Ask the player to play the accents more softly'],
    correct: 'Lower the input gain, or use a pad its manual allows, and re-check',
    explain: 'Set the input gain with headroom for the strongest accents and any drive or effect surges, and watch the overload light. A lower fader does not undo clipping at the input — and the player’s touch is their sound.',
    why: {
      'Pull the channel fader down until the hard accents sound clean again': 'The overload happens at the input, before the fader.',
      'Ask the player to play the accents more softly': 'Set the gain for the playing they intend — the accents are part of the music.',
    },
  },
  {
    id: 'rh.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second channel on the keyboard’s amp?',
    options: ['Each works alone, the pair adds something, and it holds up in mono', 'Two channels simply give the mix engineer more options to use later', 'The keyboard needs more level in the mix'],
    correct: 'Each works alone, the pair adds something, and it holds up in mono',
    explain: 'A second mic — or the direct signal — should earn its place in the combined sound, for a stated goal. If the pair goes thin, move a mic, rebalance, compare polarity, or leave it out.',
    why: {
      'Two channels simply give the mix engineer more options to use later': 'More channels also add spill and interactions; a second source must improve the sound.',
      'The keyboard needs more level in the mix': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'rh.mix.1',
    page: 'practice',
    prompt: 'A starting point says “60–90 cm (2–3 ft) back, on the axis”. What else must you know before placing the mic?',
    options: ['Which speaker sounds, and that it is measured from the grille', 'The amp’s brand and model, so that the number matches its speaker', 'Nothing more — the number places the mic'],
    correct: 'Which speaker sounds, and that it is measured from the grille',
    explain: 'A distance belongs to its reference — the grille — and to the speaker that is really active. Clearance is a separate check again.',
    why: {
      'The amp’s brand and model, so that the number matches its speaker': 'The reference is the grille in front of the active speaker; a brand does not change that.',
      'Nothing more — the number places the mic': 'Without the speaker and the reference surface the number places nothing.',
    },
  },
  {
    id: 'rh.mix.2',
    page: 'practice',
    prompt: 'One note clanks, through the amp, whatever the mic does. What now?',
    options: ['Stop and refer it to the owner or a technician', 'Move that note’s pickup a little away from its tine', 'Move the mic until the clank is quieter'],
    correct: 'Stop and refer it to the owner or a technician',
    explain: 'A clank heard from the amp itself is the instrument — often a tine too close to its pickup. Mic work never opens the instrument or adjusts a pickup: that is a technician’s job.',
    why: {
      'Move that note’s pickup a little away from its tine': 'Pickup spacing is a technician’s adjustment, made inside the instrument — never part of miking.',
      'Move the mic until the clank is quieter': 'The clank is in the source; moving the mic only hides it for now.',
    },
  },
  {
    id: 'rh.mix.3',
    page: 'practice',
    prompt: 'What does the direct signal NOT include, compared with the amp mic?',
    options: ['The amp’s speaker, its cabinet and the room', 'The tine’s attack and the player’s touch on the keys', 'The notes the player chooses'],
    correct: 'The amp’s speaker, its cabinet and the room',
    explain: 'The direct signal is taken before the amp’s speaker: it carries the pickups’ signal, the touch and the notes, but not the speaker, the cabinet or the room — the part the mic is there to capture.',
    why: {
      'The tine’s attack and the player’s touch on the keys': 'Those are in the pickups’ signal, so the direct feed has them.',
      'The notes the player chooses': 'The notes are in every feed. What the direct signal lacks is the speaker and the room.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 's.bright',
    observation: 'Too bright or brittle',
    firstChecks: 'Is the amp’s tone or drive meant to be bright? Is the mic near the centre of the cone? Compare an outward spot at the same settings.',
    options: ['Compare an outward spot at the same distance and settings', 'Turn the amp’s treble control down before moving the mic at all', 'Push the mic against the grille to soften it'],
    correct: 'Compare an outward spot at the same distance and settings',
    explain: 'One variable at a time, at fixed settings: slide outward across the cone and listen on chords and accents. The amp’s settings are the player’s sound.',
    why: {
      'Turn the amp’s treble control down before moving the mic at all': 'The amp is the player’s sound. Move the mic first.',
      'Push the mic against the grille to soften it': 'Touching the grille adds noise and changes two things at once.',
    },
  },
  {
    id: 's.dull',
    observation: 'Dull or indistinct',
    firstChecks: 'Is the mic far toward the edge, or the amp’s tone very dark? Compare the dust cap’s edge and listen for note definition.',
    options: ['Compare the dust cap’s edge and listen for definition', 'Add treble on the channel before trying anything else at all', 'Move the mic to the middle of the grille'],
    correct: 'Compare the dust cap’s edge and listen for definition',
    explain: 'Return toward the dust cap’s edge of the speaker that is sounding, and listen in the full mix. EQ cannot restore articulation the mic is not hearing.',
    why: {
      'Add treble on the channel before trying anything else at all': 'Placement first: EQ cannot restore articulation the mic is not hearing.',
      'Move the mic to the middle of the grille': 'The middle of the grille may not be the speaker at all. Stay on the speaker.',
    },
  },
  {
    id: 's.clank',
    observation: 'One note clanks',
    firstChecks: 'Is it audible from the amp, whatever the mic does? Then it is the instrument: stop, and refer it to the owner or a technician.',
    options: ['Stop and refer it to the owner or a technician', 'Adjust that note’s pickup a little farther from the tine', 'Gate the channel so the clank is cut'],
    correct: 'Stop and refer it to the owner or a technician',
    explain: 'A clank heard from the amp is a source fault — often a tine touching or too close to its pickup. No pickup adjustment is ever part of miking.',
    why: {
      'Adjust that note’s pickup a little farther from the tine': 'Pickups are a technician’s adjustment inside the instrument — never mic work.',
      'Gate the channel so the clank is cut': 'A gate would chop the music too; the fault is in the instrument.',
    },
  },
  {
    id: 's.comb',
    observation: 'Comb-like tone on a blend',
    firstChecks: 'Does each mic, or the direct signal, sound normal alone? Hear the mono sum; change the geometry and the balance.',
    options: ['Hear each alone, then mono; change geometry or balance', 'Turn all the sources up until the sound fills out', 'Invert one source and keep that, whatever it sounds like'],
    correct: 'Hear each alone, then mono; change geometry or balance',
    explain: 'Judge the sources together: each alone, the mono sum at matched levels, then polarity both ways by ear. A rear mic on an open back starts out inverted.',
    why: {
      'Turn all the sources up until the sound fills out': 'More level does not fix a cancellation; it makes the hollow sound louder.',
      'Invert one source and keep that, whatever it sounds like': 'Compare BOTH polarity states by ear, in mono.',
    },
  },
  {
    id: 's.stereo',
    observation: 'The stereo panning disappears',
    firstChecks: 'Does the rig really send two different signals? Check each channel alone, the wiring, and what the mono sum does to the effect.',
    options: ['Check each channel alone, the wiring and the mono sum', 'Pan the two mics wider apart in the stereo mix to restore it', 'Add a third mic between the amps'],
    correct: 'Check each channel alone, the wiring and the mono sum',
    explain: 'Panning moves the level between two outputs: if both amps get the same signal, or the sum is mono, the movement is gone. Verify the channels before changing the mix.',
    why: {
      'Pan the two mics wider apart in the stereo mix to restore it': 'Wider panning cannot restore a movement that is not in the two signals.',
      'Add a third mic between the amps': 'A third mic hears both amps at once and blurs the movement further.',
    },
  },
  {
    id: 's.spill',
    observation: 'Feedback or heavy spill',
    firstChecks: 'Are the amp or a wedge inside the mic’s pickup? Reposition the amp or the mic, aim the rejection, and close unused channels.',
    options: ['Lower the level, then revise amp, wedge and mic aim', 'Turn the keyboard channel up so it covers the spill and feedback', 'Hang a cloth over the amp’s back'],
    correct: 'Lower the level, then revise amp, wedge and mic aim',
    explain: 'Make it safe first by lowering the level. Then close unused mics and aim the mic’s rejection at the loudest monitor — never cover an amp’s vents.',
    why: {
      'Turn the keyboard channel up so it covers the spill and feedback': 'More gain feeds the loop — it makes feedback MORE likely.',
      'Hang a cloth over the amp’s back': 'That blocks the amp’s ventilation. Change the placement instead.',
    },
  },
  {
    id: 's.clip',
    observation: 'Clipping on hard notes',
    firstChecks: 'Which stage distorts — the instrument, the amp, the mic or the desk input? Restore headroom without changing the drive the player wants.',
    options: ['Find which stage distorts, then restore its headroom', 'Ask the player to turn the amp right down', 'Lower the channel fader until the hard notes sound clean again'],
    correct: 'Find which stage distorts, then restore its headroom',
    explain: 'Drive the player chose in the amp is part of the sound; overload at the mic or the desk input is not. Check each stage, and fix the one that is overloading.',
    why: {
      'Ask the player to turn the amp right down': 'The amp’s drive may be the player’s sound. Find where the unwanted clipping is.',
      'Lower the channel fader until the hard notes sound clean again': 'Input clipping happens before the fader; a lower fader only makes it quieter.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'rh.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic setup on the keyboard’s amp in the order you would do them.',
    steps: [
      { text: 'Trace the signal: which instrument, which outputs, which amp and speaker', early: 'Start by knowing the real rig.' },
      { text: 'Ask the player to set the instrument, effects and amp as they will really play', early: 'Know the rig first, then fix the player’s sound.' },
      { text: 'With the amp muted, find the speaker behind the grille', early: 'Find the speaker once the player’s setup is fixed.' },
      { text: 'Place the mic on a stable stand near the dust cap’s edge, clear of the grille; route the cable away from the pedal foot', early: 'You need to know where the speaker is first.' },
      { text: 'Mute the outputs; switch phantom if the mic needs it', early: 'Power comes after the mic is mounted and connected — outputs muted first.' },
      { text: 'Set input gain on the strongest accents, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare centre, cap edge and outer cone at matched level, on chords and single notes', early: 'Compare once the level is set safely.' },
      { text: 'Write down the amp, the effects, the spot, distance and angle', early: 'Document last, once you have chosen.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before connecting, disconnecting or switching it, and follow your own equipment’s manual. Recheck after the amp is moved or the player changes a setting.',
  },
];

const POWER_REASON: SetupReason = { id: 'r.power', label: 'The channel gives the mic the power it needs (phantom, or none)', role: 'required', feedback: 'Say how the mic is powered: a condenser needs phantom; a dynamic needs none.' };
const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point, measured from the grille in front of the speaker', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };
const CLEAR_REASON: SetupReason = { id: 'r.clear', label: 'Mic, stand and cable stay clear of the grille, the vents and the pedal foot', role: 'required', feedback: 'Clearance is part of every passing setup.' };
const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the mic most engineers use on this instrument', role: 'wrong', feedback: 'A brand or a habit is not part of passing: choose by properties.' };
const DI_REASON: SetupReason = { id: 'r.di', label: 'The direct signal already sounds just like the miked amp', role: 'wrong', feedback: 'The direct signal lacks the speaker and the room — it is a different sound.' };

const setupTasks: SetupTask[] = [
  {
    id: 'rh.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A loud club stage: a tine piano through a 1 × 12 combo, a mono PA. One channel; phantom power is available.',
    setups: [
      { id: 'a', label: 'Instrument dynamic close to the grille, aimed at the dust cap’s edge', ok: true, power: 'none', feedback: 'A recommended start, close and directional for a loud stage; a dynamic needs no power.' },
      { id: 'b', label: 'Small condenser about 5–15 cm from the grille, on the speaker itself', ok: true, power: 'phantom', feedback: 'Close and directional, and this channel has phantom — check its level rating.' },
      { id: 'c', label: 'Instrument dynamic over the outer cone, the same distance', ok: true, power: 'none', feedback: 'Another good first listen — warmer comping — if it suits the player’s sound.' },
      { id: 'd', label: 'A mic 60–90 cm back from the amp, for the room', ok: false, power: 'none', feedback: 'On a loud stage that hears the drums and wedges, and lowers the margin before feedback.' },
      { id: 'e', label: 'A dynamic over the keys, for the tines', ok: false, power: 'none', feedback: 'The tines are quiet in the air; the sound is at the speaker — and the keys are the player’s space.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'Close, directional pickup helps against stage spill and feedback', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, DI_REASON],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible start measured from the grille, clearance, and power that matches the mic.',
  },
  {
    id: 'rh.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A studio, a good room, the same open-backed combo; the player wants more of the amp and the room. Two inputs, NO phantom power.',
    setups: [
      { id: 'a', label: 'A dynamic close at the cap’s edge, plus a dynamic 60–90 cm back for the room', ok: true, power: 'none', feedback: 'Close plus room in a good room — bring the room mic up under the close one, and check in mono.' },
      { id: 'b', label: 'A dynamic at the cap’s edge, plus a dynamic 15–30 cm behind the open back, polarity flipped', ok: true, power: 'none', feedback: 'A front-and-rear pair from outside, checked in mono — dynamics need no phantom.' },
      { id: 'c', label: 'A small condenser 60–90 cm back, and a dynamic close in', ok: false, power: 'phantom', feedback: 'These inputs have no phantom power for the condenser.' },
      { id: 'd', label: 'A dynamic inside the open back, by the valves', ok: false, power: 'none', feedback: 'Nothing goes inside the amp: the chassis and valves are hot and live.' },
      { id: 'e', label: 'The direct signal alone, labelled as the amp mic', ok: false, power: 'none', feedback: 'The direct signal has no amp, speaker or room — it cannot stand in for the mic the brief asks for.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.mono', label: 'Each mic is heard alone, then the pair is blended and checked in mono', role: 'optional', feedback: 'A good habit with any two-source pickup.' }, BRAND_REASON, DI_REASON],
    explain: 'Two pickups pass. What passes is the reasoning: two views of the amp, from outside, powered by what these inputs supply, checked in mono.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you begin: a hammer strikes a steel tine. Where does most of the sound you will mic come from?', options: ['The amp’s speaker', 'The tine itself', 'The hammer'], after: 'Now step through the five events.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Toward the rear, off to one side'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: keeping the distance, you slide the mic from the dust cap’s edge toward the cone’s edge. What changes?', options: ['Brighter', 'Warmer and rounder', 'It depends on this speaker'], after: 'Rest the mic in two zones and read what each suggests you listen for.' },
  context: { prompt: 'Where will this cardioid reject the player’s wedge best?', options: ['Straight behind the mic', 'At the sides of the mic', 'In front of the mic'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION.' },
  twoMic: { prompt: 'If you flip one source’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

/* THE QUICK CHECK: 6 items, two per foundation page; q.5 (a speaker output)
 * and q.6 (hearing) are critical. It opens the activities; it credits NOTHING. */
const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'A passive tine piano has one output jack. Where can it go?',
    options: ['To an amp, a DI box or a preamp', 'Straight into a speaker cabinet', 'Only to a mic input, by an XLR cable'],
    correct: 'To an amp, a DI box or a preamp',
    explain: 'A passive model needs no power and is made to feed an amplifier, a DI box or a preamp. It cannot drive a speaker on its own.',
    why: {
      'Straight into a speaker cabinet': 'Its signal is tiny: it needs an amp to drive a speaker.',
      'Only to a mic input, by an XLR cable': 'It has a jack, made for an amp, DI or preamp — not a mic input.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What turns the tine’s motion into a signal?',
    options: ['A pickup — a magnet and coil — at each tine', 'A small microphone under the harp cover', 'The tonebar, touching a contact as it rings'],
    correct: 'A pickup — a magnet and coil — at each tine',
    explain: 'Each note has its own pickup facing the tine’s tip: the moving steel changes the magnetic field and makes a small signal in the coil.',
    why: {
      'A small microphone under the harp cover': 'There is no microphone inside. The pickups sense the tines magnetically.',
      'The tonebar, touching a contact as it rings': 'The tonebar rings with the tine; the pickup senses the tine without touching it.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'Close to the amp’s speaker, a mic aimed at the centre of the cone tends to sound…',
    options: ['brighter than one aimed toward the edge', 'darker and warmer than one aimed toward the edge', 'the same, at the same distance'],
    correct: 'brighter than one aimed toward the edge',
    explain: 'At higher pitches more of the sound comes from the middle of the cone, so close in the centre tends to sound brighter and the edge warmer — a tendency to check on each speaker.',
    why: {
      'darker and warmer than one aimed toward the edge': 'It is the other way round, most often: the centre brighter, the edge warmer.',
      'the same, at the same distance': 'Close in, the spot on the cone matters as well as the distance.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'An open-backed combo: as the cone moves forward, the air behind it is…',
    options: ['pulled — the back sounds opposite in polarity', 'pushed out of the open back at exactly the same moment', 'still — only the front moves air'],
    correct: 'pulled — the back sounds opposite in polarity',
    explain: 'The cone pushes the air in front and pulls the air behind at the same moment: an open back radiates the same motion, opposite in polarity.',
    why: {
      'pushed out of the open back at exactly the same moment': 'Moving forward, the cone pushes the FRONT air and pulls the back air.',
      'still — only the front moves air': 'Both faces of the cone move air; an open back lets the rear sound out.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'The desk is short of inputs. Can the amp’s speaker output go into a desk input or a DI?',
    options: ['No — a speaker output goes only to a speaker', 'Yes, through the channel’s input pad, switched in first', 'Yes, if the amp is turned down first'],
    correct: 'No — a speaker output goes only to a speaker',
    explain: 'A speaker output carries high power. It goes to a speaker, by a speaker cable — never to a mic, line or ordinary DI input. Only a device rated for it, fitted as its maker says, takes that level.',
    why: {
      'Yes, through the channel’s input pad, switched in first': 'An input pad is not made for speaker-level power. The connection itself is the danger.',
      'Yes, if the amp is turned down first': 'Turning down does not make the connection safe.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: 'Your mic is rated for a very high SPL. What does that tell you about standing by a loud amp all through soundcheck?',
    options: ['Nothing — it is the mic’s distortion limit, not a hearing limit', 'It is safe while the amp stays below the level of the mic’s rating', 'It is safe as long as the mic is closer than you are'],
    correct: 'Nothing — it is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'It is safe while the amp stays below the level of the mic’s rating': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      'It is safe as long as the mic is closer than you are': 'Where the mic sits says nothing about your ears. Measure where the person listens.',
    },
  },
];

export const I11A_LESSON: Lesson = {
  id: 'I11a',
  labId: 'percussion',
  title: 'Rhodes (Tine Piano)',
  subtitle: 'Mic the speaker it plays through — the direct signal compared alongside',
  noun: { one: 'tine piano', many: 'tine pianos' },
  model: I11A_MODEL,
  micTypeIds: [...I11A_MICS],
  zones: I11A_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'An electric piano with a steel TINE for every note. A hammer strikes the tine; a heavier tonebar above it rings at the same pitch, like a tuning fork; a pickup facing the tine’s tip turns the motion into a small electrical signal. The amp and its speaker make the sound you mic.', src: 'RH-SM79, RH-MK8-UG' },
    { title: 'WHERE YOU MEET IT', text: 'Soul, jazz, funk, pop, gospel and rock, on stage and in the studio — a passive model through a combo amp or a DI, an active model with its own preamp, effects and stereo outputs, or a suitcase model standing on its own amplifier and speakers.', src: 'RH-S61, RH-MK8' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Warm, bell-like comping and chords; a bright, barking edge when it is played hard. The player’s touch, the instrument’s controls, the effects, the amp and the speaker are all part of the sound — mic the rig they bring, as they set it.', src: 'LESSON L7' },
    { title: 'ITS SIZE', text: 'A 73-key active model is about 115 cm wide, 56 cm deep and 22.5 cm high, and weighs about 34 kg; this lesson draws a 61-key passive model a little narrower. The combo amp it plays through here is about 62 cm wide and 44.5 cm tall.', src: 'RH-MK8-UG, FEN-65DR-MAN' },
  ],
  sound: {
    stages: [
      { title: 'The signal reaches the voice coil', text: 'The amp’s signal — the tine’s motion, sensed by the pickup and made much stronger — flows through the voice coil, in the magnet’s gap behind the cone.' },
      { title: 'The cone moves as one', text: 'The coil pushes against the magnet’s field and drives the cone forward and back. At low pitches the whole cone moves together, like a piston — drawn here many times larger than it really moves.' },
      { title: 'Push in front, pull behind', text: 'As the cone moves forward it pushes the air in front of it and pulls the air behind it — at the same moment, opposite ways.' },
      { title: 'Sound leaves', text: 'Sound leaves the front, through the grille. With a closed back, the sound from the back of the cone stays in the box.', ported: 'Sound leaves the front, through the grille — and the back, through the open back, opposite in polarity: thicker and duller, with the chassis in the way.' },
    ],
    attack: 'The hammer’s strike — the first instant of the note, strongest on hard playing — reaches the cone first. A close mic aimed near the middle of the cone tends to hear more of it: the bark of a hard note.',
    body: 'The ringing tine and tonebar, the sustain pedal’s tail, the amp’s own colour and the room. A mic toward the edge of the cone, or farther back, tends to hear more of it. Both are tendencies, and speakers vary.',
    head: { diameterMm: 305, rods: 0, label: '12 in speaker, face-on', strikeSrc: 'CEL-V30' },
  },
  setting: {
    items: [
      { id: 'player', label: 'the tine piano and the player', short: 'KEYS', note: 'The tines, the pickups and the instrument’s controls start the sound. Ask which outputs, effects and amp they will really use, and how they play — soft, hard, with the pedal.', prov: { kind: 'illustrative', reason: 'a generic signal path and stage position' }, tag: 'ASK FIRST', scene: 'all' },
      { id: 'keys', label: 'the keyboard on its legs', short: 'KEYBOARD', note: 'Heavy, on its own legs. The keys and the player’s hands are their space: no stand leans on the instrument.', prov: { kind: 'illustrative', reason: 'a typical stage layout; the keyboard 1500 mm to the amp’s side is a drawing default' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'musician', label: 'the player, seated at the keys', short: 'PLAYER', note: 'Hands on the keys, a foot on the sustain pedal: the dashed area is their working space. No stand, cable or mic in it.', prov: { kind: 'illustrative', reason: 'a typical seated position' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'pedal', label: 'the sustain pedal', short: 'PEDAL', note: 'Under the player’s right foot, in use all through the song. No stand leg or cable near it.', prov: { kind: 'illustrative', reason: 'a typical position' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'dibox', label: 'a DI box before the amp', short: 'DI BOX', note: 'Splits the keyboard’s signal: one side on to the amp, a balanced output to the desk. It hears no amp, speaker or room — a separate source to compare or blend, not a mic.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'NOT THE AIR', scene: 'all' },
      { id: 'amp', label: 'the combo amp', short: 'COMBO', note: 'The amplifier and its speaker in one box. Its settings and level are part of the player’s sound. Keep its vents clear, and never change its speaker wiring.', prov: { kind: 'illustrative', reason: 'a generic signal path and stage position' }, tag: 'THE SOURCE', scene: 'all' },
      { id: 'cab', label: 'the speaker in the combo', short: 'SPEAKER', note: 'The cone moves the air: this is what the mic hears. On many amps a speaker must always be connected while the amp is on.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'WHAT A MIC HEARS', scene: 'all' },
      { id: 'mic', label: 'the microphone', short: 'MIC', note: 'An airborne pickup of the speaker, the box and the room. Close in, mostly the speaker; farther back, more of the room and the stage.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'AIR PATH', scene: 'all' },
      { id: 'desk', label: 'the desk (mixing console)', short: 'DESK', note: 'Where every source arrives and the input gain is set — the mic and the direct signal each on its own, labelled channel.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'GAIN HERE', scene: 'all' },
      { id: 'wedge', label: 'the keyboard player’s wedge', short: 'WEDGE', note: 'A floor monitor downstage of the player, facing back toward them.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'drums', label: 'the drum kit', short: 'DRUMS', note: 'A loud neighbour. A close, directional amp mic hears more of the keyboard and less of the kit.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'stage' },
      { id: 'otherAmp', label: 'the guitar amp', short: 'GUITAR AMP', note: 'Another loud speaker on the backline. Aim the keyboard’s mic so its rejection faces the loudest neighbour where you can.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'all' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Ask whether the amp is the player’s monitor, the audience’s source, or both: the PA adds only what the audience needs.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a quiet studio a farther mic can add the room — when it sounds good.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: the combo beside the keyboard, wedges, a drum kit and a PA. One close, directional mic on the amp hears more of the keyboard and less of the stage, with more gain before feedback. Keep the pedal foot, the cables and the amp’s vents clear.',
    studio: 'STUDIO: time to compare positions on the amp, and a room that may add something — a farther mic, or a front-and-rear pair on the open back. Record whole phrases, with the pedal, and write the settings down.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic setup for a given rig and show it, describe an alternative, and say what would justify a second channel. With a real instrument and the player’s agreement, you can log what you tried below.',
    fields: [
      { id: 'source', label: 'Instrument, outputs, amp and speaker; the player’s settings and effects', kind: 'text' },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['instrument dynamic', 'small condenser', 'ribbon (per its manual)', 'other'] },
      { id: 'site', label: 'Spot on the cone, distance from the grille, angle', kind: 'text' },
      { id: 'tone', label: 'Soft and hard, low and high: what you heard (tendencies, in words)', kind: 'text' },
      { id: 'mono', label: 'Second mic or direct signal: alone, together, in mono', kind: 'text' },
      { id: 'notes', label: 'Stand, cable, pedal and vents checked; final choice and its limitation', kind: 'text' },
    ],
  },
  // INTERNAL record (never shown).
  unknowns: [
    { text: 'Whether the combo stands on the floor, raised or tilted back: drawn standing on the floor — so no HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The combo’s speaker position (60 mm right of centre, 255 mm below the top), open back, control-panel band (90), chassis (80) and valves (70): drawing defaults from the speaker family (electric_guitar_amp GEOMETRY §2).', dims: [] },
    { text: 'The 61-key passive model’s size: UNKNOWN — drawn with the 73-key model’s footprint, seven white keys narrower (988.5 × 563 × 225); key-top height 720 and the white-key width 23.5 are drawing defaults.', dims: [] },
    { text: 'The mechanism (inside view): the tine’s 111.125 mm is ONE replacement tine’s length (real tines vary by note); the tonebar (95), the tine’s diameter, the pickup head (13) and its 3 mm gap, the key and hammer proportions are drawing defaults. The escapement (1/32 in) and the hammer tip (1/4 in) are the maker’s service figures.', dims: [] },
    { text: 'The suitcase model’s speakers (count, size, facing): Low confidence (retailer listings only) — NOT drawn, a text note only.', dims: [] },
    { text: 'A rear-mic distance behind the open back: none in the research; 15–30 cm is the speaker family’s drawing default, starting outside the 6 in the amp’s maker asks for.', dims: [] },
    { text: 'The stage plan (the keyboard 1500 mm to the amp’s side, the wedge, the kit, the other amp): a typical layout, drawing defaults.', dims: [] },
  ],
  live: {
    wedges: [
      {
        id: 'keysWedge',
        label: 'the keyboard player’s wedge, downstage of them, facing back toward them',
        short: 'WEDGE',
        p: { x: 1300, y: FLOOR, z: 1500 },
        lift: 150,
        faces: { x: -1, y: 0, z: 0 },
        note: 'It sits in front of the keyboard player, off to the side of the amp mic and toward its rear — turn the mic, or choose a pattern whose null points there.',
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
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every instrument, amp, speaker, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: one combo amp with a 12 in speaker (its outer size is real; where the speaker sits, the open back and the controls are drawing choices), a 61-key tine piano drawn at a typical size, one note of its mechanism as an inside view, textbook mic patterns, and motion drawn larger. The close distances are general amplifier starting points, measured here from the grille cloth to the mic’s front and rounded to about 5 mm. Place mics with the amp muted, never open the instrument or the amp, and send a speaker output only to a speaker.',
};
