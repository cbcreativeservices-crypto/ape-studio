/**
 * I11b WURLITZER (REED PIANO) (Lab 2, Percussion) — the lesson as DATA. Words
 * from the owner's lesson (docs/labs/miking/source_text/
 * Wurlitzer-Miking-Technique-Research.txt, "L<n>" in COMMENTS only), with the
 * fixes in CORRECTIONS_LOG.md (WU-01 …) applied. Research:
 * docs/labs/miking/wurlitzer/ (SOURCES.md, GEOMETRY_PROPOSAL.md).
 *
 * Owner ruling 2026-10-04: suggested starting points, never dogma; no
 * source, brand or model names, no badges, no Sources page. FULLY SILENT.
 *
 * The case size and the grille positions are UNKNOWN in the research: the
 * drawing uses the geometry proposal's defaults and never shows them as
 * readouts. The speakers face the PLAYER — the lesson's hard part.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, LessonPages, PageContent, SourcePageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { wurliWedges } from '../shared/keys/wurliModel.ts';
import { micRatingCheck } from '../../engine/model/sharedItems.ts';
import { I11B_MODEL, I11B_ZONES } from './geometry.ts';
import { I11B_MICS } from './model.ts';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the reed piano',
    goal: 'Get to know the reed piano — keys, hammers, reeds, its pickup, its built-in amplifier and its two oval speakers — and find the speakers before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A hammer strikes a steel reed; a charged pickup turns its motion into a small signal; the instrument’s own amplifier drives two small oval speakers that face the player. Find them from outside — never lift the lid.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a struck reed becomes a signal and the signal becomes moving air — what the “vibrato” really does, and why the spot on the speaker matters.',
    credit: { scenarios: ['wu.snd.1', 'wu.snd.2', 'wu.snd.3'], interactive: 'soundPath', note: 'Step the mechanism to the end and swing the reed by hand, step the cone through to the end, and answer the three checks.' },
    takeaway: 'The pickup senses the reed much as a condenser microphone senses its diaphragm. The “vibrato” is a pulse in level, not pitch. Close in, the centre of the speaker tends to sound brighter than its outer end.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the path from the reeds to the desk — which feeds hear the air and which are wires — what sits round the instrument, and what to do before any mic.',
    credit: { scenarios: ['wu.set.1', 'wu.set.2', 'wu.set.3'], note: 'Answer the three checks.' },
    takeaway: 'A mic at a grille hears air; the auxiliary output is a separate electrical source. A speaker output never goes to a desk input. Keep the case closed, the player’s hands, knees and pedal clear, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the small speakers by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['wu.mic.1', 'wu.mic.2', 'wu.mic.3', 'wu.rec.1'], note: 'Answer the four checks (one reaches back to how it sounds).' },
    takeaway: 'A compact directional dynamic is a practical start close to the grille; a condenser or ribbon can suit a studio when its limits are respected. Size and mounting matter here: the gap is narrow.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — about an inch from a grille, off-centre, at a slight angle — then compare the centre, the outer end, a little more distance and the other grille, one change at a time.',
    credit: { scenarios: ['wu.place.1', 'wu.place.2', 'wu.place.3', 'wu.rec.2'], interactive: 'twoZones', note: 'Rest the mic in two different recommended starting points, clear of every part and the player, and answer the four checks.' },
    takeaway: 'Measure from the grille of the speaker that sounds best, keep clear of the lid, the keys and the player, and change one thing at a time: across the speaker, OR away from it, OR the angle — OR the other grille.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the close mic so its rejection faces the player’s wedge — and know what a studio and a stage each ask of a speaker that faces the player.',
    credit: { scenarios: ['wu.ctx.1', 'wu.ctx.2', 'wu.ctx.3', 'wu.ctx.studio', 'wu.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the player’s wedge sits in the rejection. STUDIO: answer the decision card. Then the four checks.' },
    takeaway: 'The speakers face the player, so the close mic hears the player’s side of the stage. One close mic on the best grille is the live start; a room mic is a studio choice. Real nulls are shallower than the picture.',
  },
  twoMic: {
    title: 'Two sources',
    goal: 'Blend the close mic with the auxiliary output, and see what polarity does and does not change — then weigh two grilles or a room mic.',
    credit: { scenarios: ['wu.two.1', 'wu.two.2', 'wu.two.3'], interactive: 'polarityVsDelay', note: 'Flip the polarity both ways AND move the mic so the delay changes, then answer the three checks.' },
    takeaway: 'Hear each source alone, then together in mono, at matched levels. The auxiliary output arrives first and lacks the speaker and the lid. Change the geometry or keep one source before reaching for polarity or delay.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all eight symptoms (a retry is explained, never penalised).' },
    takeaway: 'Move the mic, or try the other grille, before reaching for EQ. A rattle, hum, a shock or a hot smell is not a mic problem: stop, and involve the owner or a technician.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one close mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second channel.',
    credit: { scenarios: ['wu.prac.order', 'wu.prac.gain', 'wu.prac.setup1', 'wu.prac.setup2', 'wu.prac.3', 'wu.mix.1', 'wu.mix.2', 'wu.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real instrument.' },
    takeaway: 'Identify the model and its speakers, hear the whole instrument, place one mic clear of everything, set gain on the hardest chords and the vibrato peak, compare one change at a time, check every blend in mono, and write it down.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only: wu.snd.* L4, L7-L8 + TF-REC ·
 * wu.set.* L41-L42, L49-L51 · wu.mic.* L10, L13, L15 · wu.place.* L10-L13 ·
 * wu.ctx.* L15, L46-L48 · wu.two.* L17-L18, L41-L42 · wu.prac/mix L6, L11-L14, L82-L86.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'wu.snd.1',
    page: 'sound',
    prompt: 'How does the reed piano’s pickup sense the reed?',
    options: ['The reed moves past a charged plate, changing the charge', 'A magnet wound with a fine coil sits under each of the reeds', 'A tiny microphone listens to each reed'],
    correct: 'The reed moves past a charged plate, changing the charge',
    explain: 'It is an electrostatic pickup: a charged plate with slots, the reeds’ tips moving past it. As each reed swings, the charge between them changes and a small signal appears — much like a condenser microphone. It runs at a high voltage: a technician’s area.',
    why: {
      'A magnet wound with a fine coil sits under each of the reeds': 'That is how a tine piano or a guitar pickup works. This pickup is electrostatic.',
      'A tiny microphone listens to each reed': 'Nothing listens to the air inside: the plate senses the reeds’ motion directly.',
    },
  },
  {
    id: 'wu.snd.2',
    page: 'sound',
    prompt: 'The player turns on the “vibrato”. What changes?',
    options: ['The level pulses up and down; the pitch stays', 'The pitch wavers up and down, like a singer’s', 'The sound moves between the two speakers'],
    correct: 'The level pulses up and down; the pitch stays',
    explain: 'On these instruments the “vibrato” is a tremolo: a slow pulse in level. It is not a pitch change, and not left-to-right movement — so two grilles do not make it a stereo effect.',
    why: {
      'The pitch wavers up and down, like a singer’s': 'Despite its name it changes the LEVEL, not the pitch.',
      'The sound moves between the two speakers': 'It is a mono level pulse. Check what feeds each speaker before panning anything.',
    },
  },
  {
    id: 'wu.snd.3',
    page: 'sound',
    prompt: 'Close to one of the oval speakers, how does the centre tend to compare with the outer end?',
    options: ['Brighter at the centre, rounder toward the end', 'Rounder at the centre, brighter toward the end', 'The same, as the speaker is so small'],
    correct: 'Brighter at the centre, rounder toward the end',
    explain: 'As on most speakers, more of the highs come from the middle of the cone, so close in the centre tends to be brighter and the outer end rounder. A small oval in a lid may behave differently — a tendency to test by ear.',
    why: {
      'Rounder at the centre, brighter toward the end': 'Most often it is the other way round — check on the real speaker.',
      'The same, as the speaker is so small': 'Even a small speaker changes with the spot, close in. Test it.',
    },
  },
  {
    id: 'wu.set.1',
    page: 'setting',
    prompt: 'What does the instrument’s auxiliary output give the desk?',
    options: ['An electrical signal without the speakers or the lid', 'The speakers’ sound, picked up by a sensor inside the case', 'The same sound a close mic would hear'],
    correct: 'An electrical signal without the speakers or the lid',
    explain: 'The auxiliary output is an electrical path: it carries the reeds, the pickup and the preamp, but not the small speakers, the lid or the room. A useful comparison or blend — not miking.',
    why: {
      'The speakers’ sound, picked up by a sensor inside the case': 'Nothing picks up air inside. It is taken from the electronics.',
      'The same sound a close mic would hear': 'It lacks the speakers, the lid and the room — a different sound.',
    },
  },
  {
    id: 'wu.set.2',
    page: 'setting',
    prompt: 'The desk is short of inputs. Can you plug the instrument’s speaker output into a line input?',
    options: ['No — only a rated device, fitted by a technician', 'Yes, with the channel’s pad switched in to drop the level', 'Yes, if the volume is turned down first'],
    correct: 'No — only a rated device, fitted by a technician',
    explain: 'A speaker output never goes into a mic, line or ordinary DI input. A specially rated load device can take it, but fitting one is technician work, outside mic work. Use the auxiliary output — if the model really has a usable one — or a mic.',
    why: {
      'Yes, with the channel’s pad switched in to drop the level': 'A pad is not made for speaker-level power. The connection itself is the danger.',
      'Yes, if the volume is turned down first': 'Turning down does not make the connection safe.',
    },
  },
  micRatingCheck({ id: 'wu.set.3', page: 'setting', mic: 'mic', loudest: 'the instrument’s loudest chord' }),
  {
    id: 'wu.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Where do the two oval speakers face?',
    options: ['Toward the player', 'Toward the audience', 'Down toward the floor'],
    correct: 'Toward the player',
    explain: 'They sit in the lid’s front slope, facing the player. So a close mic sits between the lid and the player — and hears what is near the player too.',
    why: {
      'Toward the audience': 'They face the player. The audience hears them from behind the instrument.',
      'Down toward the floor': 'They face the player from the lid’s front slope.',
    },
  },
  {
    id: 'wu.mic.1',
    page: 'microphone',
    prompt: 'Why does a mic’s SIZE matter more than usual on this instrument?',
    options: ['The gap between the lid and the player’s hands is narrow', 'Small mics hear small speakers more accurately than big ones', 'Large mics overload on the small speakers'],
    correct: 'The gap between the lid and the player’s hands is narrow',
    explain: 'A close mic sits just in front of a grille, above the keys and close to the player’s hands and forearms. A compact mic on a low-profile stand fits the gap without getting in the way.',
    why: {
      'Small mics hear small speakers more accurately than big ones': 'Size is about fitting the space, not about hearing better.',
      'Large mics overload on the small speakers': 'The level is modest; the problem is space for the player.',
    },
  },
  {
    id: 'wu.mic.2',
    page: 'microphone',
    prompt: 'In a studio you want a wider sound than a dynamic gives. What could you try?',
    options: ['A condenser, if its level and power suit', 'A second dynamic, placed on the very same spot', 'More treble on the dynamic’s channel'],
    correct: 'A condenser, if its level and power suit',
    explain: 'A condenser can give a wider, more detailed picture of the speaker — or a ribbon, where its maker allows. Check its rating, its power and how it mounts, then compare at matched level.',
    why: {
      'A second dynamic, placed on the very same spot': 'Two mics hearing the same thing add little and can comb.',
      'More treble on the dynamic’s channel': 'EQ changes the balance; it does not change what the mic captures. Try another mic first.',
    },
  },
  {
    id: 'wu.mic.3',
    page: 'microphone',
    prompt: 'How do you mount the close mic?',
    options: ['On a stable stand of its own, off the instrument', 'On a small clamp fixed firmly to the edge of the lid', 'Resting on the lid, facing the grille'],
    correct: 'On a stable stand of its own, off the instrument',
    explain: 'A stand independent of the case: a clamp or a stand touching the old lid can rattle it, scratch it, or bridge metal to a fault. Never clamp to the lid or the grille.',
    why: {
      'On a small clamp fixed firmly to the edge of the lid': 'Nothing is clamped to the lid or the grille: it can rattle or damage them.',
      'Resting on the lid, facing the grille': 'It would pick up the lid’s vibration and can fall into the player’s hands.',
    },
  },
  {
    id: 'wu.place.1',
    page: 'placement',
    prompt: 'A starting point says “about 2.5 cm (1 in), off-centre, at a slight angle”. What else matters before you place it?',
    options: ['Which grille sounds best, and that the mic is clear', 'Only the distance — the rest is detail', 'The instrument’s brand and model, for its exact spot'],
    correct: 'Which grille sounds best, and that the mic is clear',
    explain: 'The number is a start, measured from a grille. Choose the grille by ear, and check clearance: the lid, the keys’ travel, the hands, the forearms and the pedal foot.',
    why: {
      'Only the distance — the rest is detail': 'Without the right grille and clearance the number places nothing well.',
      'The instrument’s brand and model, for its exact spot': 'Grille positions vary even within one model; find them on the real instrument.',
    },
  },
  {
    id: 'wu.place.2',
    page: 'placement',
    prompt: 'At the close start the sound is a little too sharp and clicky. Which next try keeps the comparison fair?',
    options: ['Move farther off-centre, keeping the distance', 'Move the mic back and swap it for another in one go', 'Turn the player’s volume down'],
    correct: 'Move farther off-centre, keeping the distance',
    explain: 'One change at a time: slide toward the outer end at the same distance — it tends to be rounder. Then, if needed, a little more distance, compared at matched level on the same phrase.',
    why: {
      'Move the mic back and swap it for another in one go': 'Two changes at once: you cannot tell which one made the difference.',
      'Turn the player’s volume down': 'The level is the player’s sound. Move the mic first.',
    },
  },
  {
    id: 'wu.place.3',
    page: 'placement',
    prompt: 'The two grilles sound a little different. What do you do?',
    options: ['Compare both at matched level, and keep the better one', 'Mic both grilles and pan them hard left and right in the mix', 'Use the grille nearer the treble keys'],
    correct: 'Compare both at matched level, and keep the better one',
    explain: 'The two speakers can differ a little. Compare the same close start on each, at matched level, and keep the one that sounds best. Two grilles are not stereo: pan only with a musical reason, after checking mono.',
    why: {
      'Mic both grilles and pan them hard left and right in the mix': 'The two grilles usually carry the same signal: panning them is not stereo.',
      'Use the grille nearer the treble keys': 'Neither grille is right by position: choose by ear.',
    },
  },
  {
    id: 'wu.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What does the “vibrato” mean for your gain?',
    options: ['Set it on the vibrato’s peaks and the hardest chords', 'Nothing — the vibrato changes only pitch', 'Set it with the vibrato switched off, on the steady notes'],
    correct: 'Set it on the vibrato’s peaks and the hardest chords',
    explain: 'The tremolo pulses the level, so its peaks are louder than the steady note. Set the gain for the strongest intended attack and the tremolo’s peaks, then listen through the note’s decay.',
    why: {
      'Nothing — the vibrato changes only pitch': 'It changes the LEVEL. Its peaks need headroom.',
      'Set it with the vibrato switched off, on the steady notes': 'If the player uses it, its peaks are part of the real level.',
    },
  },
  {
    id: 'wu.ctx.1',
    page: 'context',
    prompt: 'On a loud stage, what is a sensible first choice?',
    options: ['One close directional mic on the best-sounding grille', 'Two close mics, one on each grille, panned left and right', 'A room mic out in front of the instrument'],
    correct: 'One close directional mic on the best-sounding grille',
    explain: 'One close mic brings the speaker’s character to the PA with the least spill and the most gain before feedback. Two mics cost feedback margin and double the spill; a room mic hears the whole stage.',
    why: {
      'Two close mics, one on each grille, panned left and right': 'Two mics double the spill and cost gain before feedback — and the grilles are not stereo.',
      'A room mic out in front of the instrument': 'On a loud stage it hears the band more than the instrument.',
    },
  },
  {
    id: 'wu.ctx.2',
    page: 'context',
    prompt: 'The speakers face the player. What does that mean for spill into the close mic?',
    options: ['It hears what is near the player, like their wedge', 'It hears only the instrument, because it faces the grille', 'It hears the audience side most'],
    correct: 'It hears what is near the player, like their wedge',
    explain: 'The close mic faces the grille, so its back points toward the player — and their wedge. Aim its rejection at the wedge, or move the wedge, and watch gain before feedback.',
    why: {
      'It hears only the instrument, because it faces the grille': 'A directional mic still hears behind and around it — shallower than the picture.',
      'It hears the audience side most': 'It faces the instrument; its rear faces the player’s side of the stage.',
    },
  },
  {
    id: 'wu.ctx.3',
    page: 'context',
    prompt: 'Your close mic is a supercardioid. Where does the wedge ideally sit?',
    options: ['Off to one side of its rear, near its null', 'Straight behind it, just as for a cardioid mic', 'In front of it, past the instrument'],
    correct: 'Off to one side of its rear, near its null',
    explain: 'A supercardioid rejects most at about 126° each side and picks up a little straight behind. Aim by the mic’s real pattern, not one rule.',
    why: {
      'Straight behind it, just as for a cardioid mic': 'A supercardioid picks up a little straight behind; its deepest rejection is off to each side.',
      'In front of it, past the instrument': 'In front is where it picks up most.',
    },
  },
  {
    id: 'wu.ctx.studio',
    page: 'context',
    prompt: 'Studio, a good room. What could justify a second mic farther away?',
    options: ['The room adds something useful to the sound', 'It makes the instrument sound like a stereo one', 'It removes key and pedal noise'],
    correct: 'The room adds something useful to the sound',
    explain: 'A farther mic hears the instrument and the room — and more key, pedal and mechanical noise. Worth it when the room helps; blend it under the close mic and check in mono.',
    why: {
      'It makes the instrument sound like a stereo one': 'A room mic adds space, not stereo — check the blend in mono.',
      'It removes key and pedal noise': 'Farther away, those noises are usually MORE noticeable, not less.',
    },
  },
  {
    id: 'wu.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Why must the close mic’s stand stay clear of the lid?',
    options: ['Touching the lid, it can rattle it or bridge to a fault', 'The lid reflects the speakers’ sound away from the mic', 'The lid gets too hot to touch during a long set'],
    correct: 'Touching the lid, it can rattle it or bridge to a fault',
    explain: 'On the later model the lid is the speakers’ baffle: a stand against it adds rattles and stand noise, and metal touching an old instrument can bridge to an electrical fault. Keep the stand independent.',
    why: {
      'The lid reflects the speakers’ sound away from the mic': 'The reason is rattle and safety, not reflections.',
      'The lid gets too hot to touch during a long set': 'The reason is rattle and an electrical path, not heat.',
    },
  },
  {
    id: 'wu.two.1',
    page: 'twoMic',
    prompt: 'You blend the close mic with the auxiliary output and the low notes go hollow. What do you try first?',
    options: ['Each alone, then mono; move the mic or rebalance', 'Delay the auxiliary output by a fixed, standard amount', 'Turn the auxiliary output up until it fills out'],
    correct: 'Each alone, then mono; move the mic or rebalance',
    explain: 'The auxiliary output arrives first; the mic, after the sound crosses the air — and the speaker and lid shape it. Hear each alone and the blend in mono; change the geometry or the balance before trying polarity or delay, by ear.',
    why: {
      'Delay the auxiliary output by a fixed, standard amount': 'A delay is chosen by ear on the real blend, not by a set number.',
      'Turn the auxiliary output up until it fills out': 'More of one source does not undo a cancellation between them.',
    },
  },
  {
    id: 'wu.two.2',
    page: 'twoMic',
    prompt: 'You flip the auxiliary output’s polarity. What happens to the arrival-time difference?',
    options: ['Nothing — polarity flips the sign, not the timing', 'It drops to zero, so the two arrivals line up exactly', 'It doubles, because the copy is inverted'],
    correct: 'Nothing — polarity flips the sign, not the timing',
    explain: 'Polarity reverses the sign. Only moving the mic changes when the sound arrives: the notches move, the delay does not.',
    why: {
      'It drops to zero, so the two arrivals line up exactly': 'The paths are unchanged, so the delay stays.',
      'It doubles, because the copy is inverted': 'Polarity has no time in it. Only a position changes the delay.',
    },
  },
  {
    id: 'wu.two.3',
    page: 'twoMic',
    prompt: 'Two close mics, one on each grille, sound hollow together. What do you do?',
    options: ['Hear each alone, check mono, then move one or keep one', 'Pan the two of them apart until the hollowness goes away', 'Turn both up until the sound fills out'],
    correct: 'Hear each alone, check mono, then move one or keep one',
    explain: 'Both mics hear much of the same source at different times, so the blend can comb. Change the geometry, or choose the better single mic — panning hides it only until the mix is heard in mono.',
    why: {
      'Pan the two of them apart until the hollowness goes away': 'Panning hides the problem only until the sum is heard in mono.',
      'Turn both up until the sound fills out': 'More level makes the hollow sound louder, not fuller.',
    },
  },
  {
    id: 'wu.prac.gain',
    page: 'practice',
    prompt: 'Normal playing sits below the overload light, but hard chords with the vibrato light it. What do you do?',
    options: ['Lower the input gain, or use a pad its manual allows, and re-check', 'Pull the channel fader down until the hard chords sound clean again', 'Ask the player to switch the vibrato off'],
    correct: 'Lower the input gain, or use a pad its manual allows, and re-check',
    explain: 'Set the input gain with headroom for the strongest chords and the tremolo’s peaks. A lower fader does not undo clipping at the input — and the vibrato is part of the player’s sound.',
    why: {
      'Pull the channel fader down until the hard chords sound clean again': 'The overload happens at the input, before the fader.',
      'Ask the player to switch the vibrato off': 'The vibrato is their sound. Make room for it with the gain.',
    },
  },
  {
    id: 'wu.prac.3',
    page: 'practice',
    prompt: 'What would justify a second channel — the other grille, a room mic or the auxiliary output?',
    options: ['Each works alone, the pair adds something, and it holds up in mono', 'Two grilles on the instrument deserve a channel each, as a basic rule', 'The instrument needs more level in the mix'],
    correct: 'Each works alone, the pair adds something, and it holds up in mono',
    explain: 'A second source should earn its channel: a stated goal, each source good alone, the blend better in mono — and, live, without costing too much gain before feedback.',
    why: {
      'Two grilles on the instrument deserve a channel each, as a basic rule': 'Two grilles usually carry the same signal; a second mic must earn its place.',
      'The instrument needs more level in the mix': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'wu.mix.1',
    page: 'practice',
    prompt: 'The player plugs the auxiliary output into an external amp on stage. What is the source now?',
    options: ['That amp’s speaker — mic and judge it on its own', 'Still the instrument’s own two speakers in the lid', 'The auxiliary cable itself, at the plug'],
    correct: 'That amp’s speaker — mic and judge it on its own',
    explain: 'An external amp is a new source: repeat the speaker placement on its cabinet, and do not assume it sounds like the instrument’s own speakers. Document it separately from a mic move.',
    why: {
      'Still the instrument’s own two speakers in the lid': 'Check whether the built-in speakers still play — but the amp the player chose is now the sound.',
      'The auxiliary cable itself, at the plug': 'A cable carries a signal; the sound comes from the amp’s speaker.',
    },
  },
  {
    id: 'wu.mix.2',
    page: 'practice',
    prompt: 'A speaker buzzes on loud notes, heard without the PA. What now?',
    options: ['Stop and refer it to the owner or a technician', 'Tighten the speaker’s screws through the grille', 'Move the mic until the buzz is quieter'],
    correct: 'Stop and refer it to the owner or a technician',
    explain: 'A rattle heard from the instrument itself is a source fault — on the later model, often a loose speaker on the lid. Never loosen or tighten old hardware yourself: that is the owner’s or a technician’s job.',
    why: {
      'Tighten the speaker’s screws through the grille': 'That is work on the instrument, not mic work — and the case stays closed.',
      'Move the mic until the buzz is quieter': 'The buzz is in the source; moving the mic only hides it.',
    },
  },
  {
    id: 'wu.mix.3',
    page: 'practice',
    prompt: 'You plan to blend the auxiliary output with the close mic. What do you confirm first?',
    options: ['The model, the labelled jack and its level, with the owner', 'That the headphone jack can stand in for it', 'That whichever jack sits nearest on the case will do the job'],
    correct: 'The model, the labelled jack and its level, with the owner',
    explain: 'Not every model has a usable auxiliary output, and a headphone, auxiliary or speaker jack are not interchangeable. Confirm the jack and its level with the owner or the manual before connecting.',
    why: {
      'That the headphone jack can stand in for it': 'Headphone, auxiliary and speaker outputs differ: confirm the right one.',
      'That whichever jack sits nearest on the case will do the job': 'A jack can be a speaker output. Confirm what it is before plugging in.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 's.click',
    observation: 'Too much click',
    firstChecks: 'Is it in the speaker’s sound, or only in a close mic? Compare the other grille, the angle and the distance; check the source with the player.',
    options: ['Compare the other grille, the angle and the distance', 'Cut the highs hard with an EQ on the keyboard’s channel', 'Move the mic down over the keys, nearer the hammers'],
    correct: 'Compare the other grille, the angle and the distance',
    explain: 'One change at a time: another grille, a slightly larger angle, or a little more distance. If the click is in the instrument itself, it is the source — talk to the player.',
    why: {
      'Cut the highs hard with an EQ on the keyboard’s channel': 'EQ takes the reeds’ brightness too. Try the placement first.',
      'Move the mic down over the keys, nearer the hammers': 'Over the keys it hears MORE key noise — and gets in the player’s way.',
    },
  },
  {
    id: 's.rattle',
    observation: 'Lid buzz or rattle',
    firstChecks: 'Is it audible without the PA, at the intended level? Then it is the instrument: stop, and refer it to the owner or a technician.',
    options: ['Stop and refer it to the owner or a technician', 'Press the lid down firmly with the weight of a mic stand', 'Gate the channel to cut the rattle'],
    correct: 'Stop and refer it to the owner or a technician',
    explain: 'A rattle from the lid is a source fault — often a loose speaker. Nothing presses on or clamps to the lid, and a gate would chop the music too.',
    why: {
      'Press the lid down firmly with the weight of a mic stand': 'Nothing rests on or presses the lid: it adds noise and risks damage.',
      'Gate the channel to cut the rattle': 'A gate cuts the music’s tail too; the fault is in the instrument.',
    },
  },
  {
    id: 's.weak',
    observation: 'Weak low or high notes',
    firstChecks: 'Does the source itself differ between registers? Hear each grille and the auxiliary output separately; do not diagnose by EQ alone.',
    options: ['Hear each grille and the auxiliary output separately', 'Boost the weak range with EQ on the keyboard’s channel', 'Swap to a bigger mic straight away'],
    correct: 'Hear each grille and the auxiliary output separately',
    explain: 'Find where the weakness lives: if it is in the auxiliary output too, it is the instrument. If only at one grille, try the other, or another spot.',
    why: {
      'Boost the weak range with EQ on the keyboard’s channel': 'EQ cannot fix a weak note in the instrument; find the cause first.',
      'Swap to a bigger mic straight away': 'Check the source first, then change one thing at a time.',
    },
  },
  {
    id: 's.pump',
    observation: 'The vibrato pumps unnaturally',
    firstChecks: 'Is a gate or compressor reacting to the level pulse? Bypass the processing; confirm the depth at the source.',
    options: ['Bypass the gate or compressor; check the source depth', 'Turn the vibrato’s depth further up on the instrument itself', 'Add a second mic to smooth it'],
    correct: 'Bypass the gate or compressor; check the source depth',
    explain: 'The tremolo pulses the level; a gate or compressor can chase it and pump. Bypass them, hear the source, then set any processing gently, if at all.',
    why: {
      'Turn the vibrato’s depth further up on the instrument itself': 'The depth is the player’s setting; the pumping comes from processing.',
      'Add a second mic to smooth it': 'Another mic hears the same pulse — and adds its own problems.',
    },
  },
  {
    id: 's.hollow',
    observation: 'Two mics sound hollow',
    firstChecks: 'Do they sum poorly in mono? Hear each alone; change the geometry, or use one.',
    options: ['Hear each alone; change geometry or keep one', 'Pan the two mics further apart until it clears', 'Turn both up until it fills out'],
    correct: 'Hear each alone; change geometry or keep one',
    explain: 'Two mics hearing the same source at different times comb in the blend. Move one, rebalance, or keep the better single mic.',
    why: {
      'Pan the two mics further apart until it clears': 'Panning hides the comb until the mix is heard in mono.',
      'Turn both up until it fills out': 'More level does not fix a cancellation.',
    },
  },
  {
    id: 's.hum',
    observation: 'Hum, or any electrical concern',
    firstChecks: 'Is it there at the source and the auxiliary output with every mic muted? Stop if unsafe; a qualified technician — no ground defeat.',
    options: ['Mute the mics, check the source; stop and call a technician', 'Lift the mains ground with an adapter so the hum stops at once', 'Open the case carefully to find the loose wire'],
    correct: 'Mute the mics, check the source; stop and call a technician',
    explain: 'Hum on an old instrument with a high-voltage pickup is a technician’s problem. Never lift the ground or open the case; stop using it if it shocks, smells hot or arcs.',
    why: {
      'Lift the mains ground with an adapter so the hum stops at once': 'That removes a safety path and can make a fault dangerous.',
      'Open the case carefully to find the loose wire': 'The case stays closed: mains power and high voltage inside.',
    },
  },
  {
    id: 's.spill',
    observation: 'Feedback or spill',
    firstChecks: 'Does the mic face the player’s wedge or a nearby amp? Improve the layout, the aim and the number of open channels.',
    options: ['Lower the level, then revise layout, aim and open mics', 'Turn the keyboard channel up so it covers the spill and feedback', 'Add a second close mic on the other grille'],
    correct: 'Lower the level, then revise layout, aim and open mics',
    explain: 'Make it safe first by lowering the level. Then move the wedge or the instrument, aim the mic’s rejection at the wedge, and close unused channels.',
    why: {
      'Turn the keyboard channel up so it covers the spill and feedback': 'More gain feeds the loop — feedback becomes MORE likely.',
      'Add a second close mic on the other grille': 'Another open mic costs more gain before feedback.',
    },
  },
  {
    id: 's.clip',
    observation: 'Amp breakup or clipping',
    firstChecks: 'Which stage distorts, and is it musical? Ask the player; restore the mic and preamp headroom without erasing the tone they chose.',
    options: ['Ask the player; find the stage and restore its headroom', 'Turn the instrument’s volume right down', 'Lower the channel fader until the hard chords sound clean'],
    correct: 'Ask the player; find the stage and restore its headroom',
    explain: 'Breakup in the instrument’s amplifier may be the sound the player wants; overload at the mic or the desk input is not. Find which stage it is, then fix that one.',
    why: {
      'Turn the instrument’s volume right down': 'The breakup may be the player’s sound. Ask, then find the unwanted stage.',
      'Lower the channel fader until the hard chords sound clean': 'Input clipping happens before the fader.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'wu.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic setup on the reed piano in the order you would do them.',
    steps: [
      { text: 'Identify the model, where its speakers are and which outputs it really has', early: 'Start by knowing the real instrument.' },
      { text: 'Ask the player for their normal level, vibrato and pedal use; listen near them and from the room', early: 'Know the instrument first, then hear the player’s real sound.' },
      { text: 'Choose the grille that sounds best, from outside, without lifting the lid', early: 'Choose the grille once you have heard the instrument.' },
      { text: 'Place the mic about an inch off a grille, off-centre, at a slight angle, on its own stand — clear of the lid, keys, hands and pedal', early: 'You need to know which grille first.' },
      { text: 'Mute the outputs; switch phantom only if the mic needs it', early: 'Power comes after the mic is mounted and connected — outputs muted first.' },
      { text: 'Set input gain on the hardest chords and the vibrato’s peaks', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare small moves and the other grille, at matched level, one change at a time', early: 'Compare once the level is set safely.' },
      { text: 'Write down the grille, the spot, distance, angle, and the player’s settings', early: 'Document last, once you have chosen.' },
    ],
    explain: 'A sensible order. Keep the case closed throughout; mute the outputs and lower monitoring before connecting, disconnecting or switching phantom, and follow your own equipment’s manual.',
  },
];

const POWER_REASON: SetupReason = { id: 'r.power', label: 'The channel gives the mic the power it needs (phantom, or none)', role: 'required', feedback: 'Say how the mic is powered: a condenser needs phantom; a dynamic needs none.' };
const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point, measured from the grille of the speaker that sounds best', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };
const CLEAR_REASON: SetupReason = { id: 'r.clear', label: 'Mic, stand and cable stay off the lid and clear of the keys, the player and the pedal', role: 'required', feedback: 'Clearance — of the instrument and the player — is part of every passing setup.' };
const STEREO_REASON: SetupReason = { id: 'r.stereo', label: 'Two grilles make it a stereo instrument', role: 'wrong', feedback: 'Two grilles usually carry the same signal: not stereo.' };
const CLAMP_REASON: SetupReason = { id: 'r.clamp', label: 'A clamp on the lid keeps the mic steady', role: 'wrong', feedback: 'Nothing is clamped to the lid: it rattles and can be damaged.' };

const setupTasks: SetupTask[] = [
  {
    id: 'wu.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A loud stage, a reed piano played through its own speakers, a mono PA. One channel; phantom power is available.',
    setups: [
      { id: 'a', label: 'Compact dynamic about an inch off the better grille, off-centre, at a slight angle', ok: true, power: 'none', feedback: 'The recommended close start: directional and close for a loud stage; a dynamic needs no power.' },
      { id: 'b', label: 'Small condenser a few centimetres off the better grille, on its own stand', ok: true, power: 'phantom', feedback: 'Close and directional, and this channel has phantom — check its level rating and the space.' },
      { id: 'c', label: 'The auxiliary output, through a DI, if the owner confirms the jack', ok: true, power: 'none', feedback: 'A fair live answer when the stage is very loud — it changes the captured path: no speaker, no lid.' },
      { id: 'd', label: 'A mic 60–90 cm from the back of the case, for the room', ok: false, power: 'none', feedback: 'On a loud stage that hears the band, not the instrument.' },
      { id: 'e', label: 'A clip-on mic fixed to the lid’s edge', ok: false, power: 'none', feedback: 'Nothing is clamped to the lid or the grille.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'Close, directional pickup helps against stage spill and feedback', role: 'optional', feedback: 'A fair live reason.' }, STEREO_REASON, CLAMP_REASON],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible start measured from the grille, clearance of the instrument and the player, and power that matches.',
  },
  {
    id: 'wu.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A studio, a good room; the player wants a wider picture of the instrument. Two inputs, NO phantom power.',
    setups: [
      { id: 'a', label: 'A dynamic close at the better grille, plus a dynamic 60–90 cm from the case for the room', ok: true, power: 'none', feedback: 'Close plus room in a good room — bring the room mic up under the close one and check in mono.' },
      { id: 'b', label: 'A dynamic close at each grille, compared alone and in mono before keeping both', ok: true, power: 'none', feedback: 'Two grilles can give options — checked in mono, and kept only if the pair adds something.' },
      { id: 'c', label: 'A small condenser close in, and a dynamic for the room', ok: false, power: 'phantom', feedback: 'These inputs have no phantom power for the condenser.' },
      { id: 'd', label: 'A dynamic inside the case, by the reeds', ok: false, power: 'none', feedback: 'The case stays closed: mains power and high voltage inside.' },
      { id: 'e', label: 'Two dynamics at the same grille, side by side', ok: false, power: 'none', feedback: 'Two mics hearing the same spot add little and can comb.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.mono', label: 'Each mic is heard alone, then the pair is blended and checked in mono', role: 'optional', feedback: 'A good habit with any two-source pickup.' }, STEREO_REASON, CLAMP_REASON],
    explain: 'Two pickups pass. What passes is the reasoning: two different views of the instrument, from outside and off the lid, powered by what these inputs supply, checked in mono.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you begin: a hammer strikes a steel reed. Where does most of the sound you will mic come from?', options: ['The instrument’s speakers', 'The reed itself', 'The hammer'], after: 'Now step through the five events.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Toward the rear, off to one side'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: keeping the distance, you slide the mic from the centre toward the oval’s outer end. What changes?', options: ['Brighter', 'Rounder and warmer', 'It depends on this speaker'], after: 'Rest the mic in two zones and read what each suggests you listen for.' },
  context: { prompt: 'The speakers face the player. Where will the close mic’s rear point?', options: ['Toward the player and their wedge', 'Toward the audience', 'Down at the floor'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION.' },
  twoMic: { prompt: 'If you flip the auxiliary output’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip POLARITY both ways, then move the mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'On the later model, where are the two oval speakers fixed?',
    options: ['To the lid, which becomes their baffle', 'To the floor of the case, facing down at the floor', 'In a separate amp beside the keyboard'],
    correct: 'To the lid, which becomes their baffle',
    explain: 'The later model screws its speakers to the plastic lid, so the lid is their baffle — part of the sound, and a possible rattle. The earlier model fixes them to the amplifier’s rail.',
    why: {
      'To the floor of the case, facing down at the floor': 'They face the player from the lid’s front slope.',
      'In a separate amp beside the keyboard': 'They are built into the instrument. An external amp is an option, not the built-in speakers.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'Two grilles, two speakers. Is it a stereo instrument?',
    options: ['Not by itself — check what feeds each speaker', 'Yes — one grille for each of the player’s hands', 'Yes, whenever the vibrato is on'],
    correct: 'Not by itself — check what feeds each speaker',
    explain: 'Two grilles do not prove stereo. Identify the signal feeding each speaker before panning anything; the vibrato is a level pulse, not left-to-right movement.',
    why: {
      'Yes — one grille for each of the player’s hands': 'The speakers are not split by hand. Check what feeds each.',
      'Yes, whenever the vibrato is on': 'The vibrato pulses the level; it does not move the sound between speakers.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'The pickup senses the reeds…',
    options: ['electrostatically, much like a condenser microphone', 'magnetically, with a magnet and coil under each reed', 'by touch, as each reed hits a contact'],
    correct: 'electrostatically, much like a condenser microphone',
    explain: 'A charged plate sits at the reeds’ tips; their motion changes the charge and makes a small signal. It runs at high voltage — a technician’s area.',
    why: {
      'magnetically, with a magnet and coil under each reed': 'That is the tine piano’s and the guitar’s way. This one is electrostatic.',
      'by touch, as each reed hits a contact': 'Nothing touches: the reed moves past the charged plate.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'The “vibrato” switch changes…',
    options: ['the level, in a slow pulse', 'the pitch, up and down like a singer', 'which speaker plays'],
    correct: 'the level, in a slow pulse',
    explain: 'Despite its name it is a tremolo: the level pulses; the pitch does not change.',
    why: {
      'the pitch, up and down like a singer': 'Its name says vibrato, but it changes the LEVEL.',
      'which speaker plays': 'Both speakers pulse together: it is a mono level effect.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'Can the instrument’s speaker output go into a desk input, through a pad?',
    options: ['No — a speaker output never goes to a desk input', 'Yes, as long as the channel’s pad is switched in first', 'Yes, if the volume is turned down low'],
    correct: 'No — a speaker output never goes to a desk input',
    explain: 'A speaker output carries high power. It never goes into a mic, line or ordinary DI input; a rated load device is technician work. Use a mic, or a confirmed auxiliary output.',
    why: {
      'Yes, as long as the channel’s pad is switched in first': 'A pad is not made for speaker-level power.',
      'Yes, if the volume is turned down low': 'Turning down does not make the connection safe.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: 'Is it safe to open the case to see where the speakers are?',
    options: ['No — keep it closed; there is high voltage inside', 'Yes, once it has been unplugged from the wall', 'Yes, as long as you touch only the speakers'],
    correct: 'No — keep it closed; there is high voltage inside',
    explain: 'Old reed pianos combine mains power with a high-voltage pickup, and stored charge can remain after unplugging. Find the grilles from outside; leave the inside to a qualified technician.',
    why: {
      'Yes, once it has been unplugged from the wall': 'Unplugging alone does not make it safe: charge can remain.',
      'Yes, as long as you touch only the speakers': 'Speaker terminals and wiring are inside, near the high voltage. Keep it closed.',
    },
  },
];

export const I11B_LESSON: Lesson = {
  id: 'I11b',
  labId: 'percussion',
  title: 'Wurlitzer (Reed Piano)',
  subtitle: 'Two small oval speakers that face the player — a close mic in a narrow gap',
  noun: { one: 'reed piano', many: 'reed pianos' },
  model: I11B_MODEL,
  micTypeIds: [...I11B_MICS],
  zones: I11B_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A portable electric piano with a steel REED for every note. A hammer strikes the reed; a charged pickup plate senses its motion, much like a condenser microphone; the instrument’s own amplifier drives two small oval speakers built into it.', src: 'TF-REC, VV-200A' },
    { title: 'THE TWO MODELS IN THIS LESSON', text: 'The earlier model fixes its two 4 × 8 in speakers to the amplifier’s rail, behind the grilles. The later model screws them to the plastic lid, which becomes their baffle — closer to the player, and able to rattle if a speaker works loose. Other models differ: identify the one in front of you.', src: 'TF-DIFF, VV-200A' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'A warm, reedy electric piano with a characteristic bark when played hard — soul, pop, rock and jazz. Its “vibrato” is a tremolo: a pulse in level. The player’s touch, level and vibrato are part of the sound.', src: 'TF-DIFF' },
    { title: 'WHERE THE SOUND COMES OUT', text: 'Both grilles sit in the lid’s front slope and face the PLAYER, not the room. A close mic lives between the lid and the player’s hands — a narrow gap. A usable auxiliary output on many of these instruments is a separate, electrical path.', src: 'TF-DIFF, TF-REC' },
  ],
  sound: {
    stages: [
      { title: 'The signal reaches the voice coil', text: 'The instrument’s amplifier sends the reed’s signal — sensed by the pickup and made much stronger — through the voice coil, in the magnet’s gap behind the cone.' },
      { title: 'The cone moves as one', text: 'The coil pushes against the magnet’s field and drives the cone forward and back. At low pitches the whole cone moves together — drawn here many times larger than it really moves.' },
      { title: 'Push in front, pull behind', text: 'As the cone moves forward it pushes the air in front of it and pulls the air behind it — at the same moment, opposite ways.' },
      { title: 'Sound leaves', text: 'Sound leaves the front, through the grille, toward the player. The back of the cone sounds into the instrument’s case — on the later model the lid itself is the baffle.' },
    ],
    attack: 'The hammer’s strike — the first instant of the note, with its bark on hard playing and a little key click — reaches the cone first. A close mic near the middle of the speaker tends to hear more of it.',
    body: 'The ringing reed, the tremolo’s pulse if it is on, the small speaker and the lid, and the room. A mic toward the outer end, or a little farther back, tends to hear more of it. Both are tendencies, and instruments vary.',
    head: { diameterMm: 203, rods: 0, label: '4 × 8 in oval speaker, face-on', strikeSrc: 'VV-200A' },
  },
  setting: {
    items: [
      { id: 'player', label: 'the reeds and the pickup', short: 'REEDS', note: 'The struck reeds and the charged pickup start the sound — inside the closed case. Ask for the player’s level, vibrato setting and pedal use.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'ASK FIRST', scene: 'all' },
      { id: 'amp', label: 'the reed piano, its amplifier inside', short: 'AMP INSIDE', note: 'The preamp, the vibrato and the amplifier are built into the instrument, with mains power and a high-voltage pickup. It stays closed. Its level and vibrato are the player’s sound.', prov: { kind: 'illustrative', reason: 'a generic signal path and stage position' }, tag: 'THE SOURCE', scene: 'all' },
      { id: 'cab', label: 'the two oval speakers in the lid', short: 'SPEAKERS', note: 'Two small 4 × 8 in speakers behind the grilles, facing the player. This is what the mic hears. Two grilles do not prove stereo.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'WHAT A MIC HEARS', scene: 'all' },
      { id: 'mic', label: 'the microphone', short: 'MIC', note: 'An airborne pickup of one speaker, the lid and the room — and, because the speakers face the player, of what is near the player too.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'AIR PATH', scene: 'all' },
      { id: 'desk', label: 'the desk (mixing console)', short: 'DESK', note: 'Where every source arrives and the input gain is set — the mic and the auxiliary output each on its own, labelled channel.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'GAIN HERE', scene: 'all' },
      { id: 'ampdi', label: 'the auxiliary output (through a DI box)', short: 'AUX OUT', note: 'A usable auxiliary output on many of these instruments; on the later model a small trim sets its level. Confirm the labelled jack with the owner: headphone, auxiliary and speaker jacks are not interchangeable. Still electrical — not the air.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'NOT THE AIR', scene: 'all' },
      { id: 'musician', label: 'the player, seated, facing the audience', short: 'PLAYER', note: 'Seated behind the instrument, facing the audience over it — and facing the speakers. Hands, forearms, knees and the pedal foot are their working space: the close mic fits in the narrow gap that leaves.', prov: { kind: 'illustrative', reason: 'a typical seated position' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'pedal', label: 'the sustain pedal', short: 'PEDAL', note: 'Under the player’s foot, in use all through the song. No stand leg or cable near it.', prov: { kind: 'illustrative', reason: 'a typical position' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'dibox', label: 'a DI box for the auxiliary output', short: 'DI BOX', note: 'Takes the auxiliary output to a balanced line for the desk — the electrical path, drawn apart from the air path.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'NOT THE AIR', scene: 'all' },
      { id: 'wedge', label: 'the player’s wedge', short: 'WEDGE', note: 'Beside the player, facing them — on the same side as the speakers face. Behind a mic that faces the grille.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'drums', label: 'the drum kit', short: 'DRUMS', note: 'A loud neighbour. A close, directional mic at a grille hears more of the instrument and less of the kit.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'stage' },
      { id: 'otherAmp', label: 'the bass amp', short: 'BASS AMP', note: 'Another loud speaker on the stage. Aim the close mic’s rejection at the loudest neighbour where you can.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'all' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'The speakers face the player, so the audience hears the instrument from behind it: the PA usually does the work out front.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a quiet studio a farther mic can add the room — and more key and pedal noise.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: the player behind the instrument, facing the audience, with the speakers facing them. One close, directional mic on the best grille, clear of the hands and the pedal; aim its rejection at the player’s wedge. On a very loud stage, the auxiliary output can help — as a different, electrical path.',
    studio: 'STUDIO: time to hear both grilles, compare small moves, and try a room mic when the room helps. Listen for speaker rasp, lid rattle, key clicks and pedal noise before placing anything.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic setup for a given brief and show it, describe an alternative, and say what would justify a second channel. With a real instrument and the player’s agreement, you can log what you tried below.',
    fields: [
      { id: 'source', label: 'Model, where its speakers are fixed, its outputs; the player’s level and vibrato', kind: 'text' },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['compact dynamic', 'small condenser', 'ribbon (per its manual)', 'other'] },
      { id: 'site', label: 'Grille, spot, distance from the grille, angle', kind: 'text' },
      { id: 'tone', label: 'Soft and hard, low and high, vibrato: what you heard (tendencies, in words)', kind: 'text' },
      { id: 'mono', label: 'Second grille, room mic or auxiliary output: alone, together, in mono', kind: 'text' },
      { id: 'notes', label: 'Lid, keys, hands, pedal clear; final choice and its limitation', kind: 'text' },
    ],
  },
  // INTERNAL record (never shown).
  unknowns: [
    { text: 'The instrument stands on its own legs: the key-top height (720) is a drawing default — so no HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The case (1020 × 500 × 230), the keys’ visible length (140), the lid’s setback (150) and panel (6), the legs (±470): drawing defaults — instrument size UNKNOWN (the service manual has no text layer). Measure a real one.', dims: [] },
    { text: 'The grille positions (±260 mm) and the speakers’ 20° tilt in the lid’s front slope: drawing defaults (GEOMETRY_PROPOSAL frame W).', dims: [] },
    { text: 'The oval speaker’s cone depth, dust cap and magnet: drawn with the 12 in reference’s proportions, scaled on each axis separately (depths on the mean scale). Only the 4 × 8 in size is sourced.', dims: [] },
    { text: 'The key count (64, Low): drawn as a keyboard pattern, never stated.', dims: [] },
    { text: 'The close band 2–4 cm round the research’s 1 in, the off-centre amount (half the long semi-axis) and the slight angle (5–30°): the lab’s drawing defaults round the practitioner’s method.', dims: [] },
    { text: 'The farther band (5–15 cm) and the room position (60–90 cm from the back of the case, about the lid’s height): drawing defaults — no number in the research.', dims: [] },
    { text: 'The seated player (torso, head, forearms, hands, knees, legs, sustain pedal): an ILLUSTRATIVE keep-clear envelope; no source gives one.', dims: [] },
    { text: 'The mechanism (inside view): the reed (60), its width, the solder, the pickup plate and its gap, the key and hammer: drawing defaults — no reed dimension was read.', dims: [] },
    { text: 'The high-voltage safety wording cites the service manual, which has no text layer: kept as a conservative rule until the pages are read as images (WU-04).', dims: [] },
  ],
  live: { wedges: wurliWedges() },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every instrument, speaker, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a reed piano at typical proportions (its two 4 × 8 in oval speakers are real; the case size, the grille positions and their tilt are drawing choices — measure the real one), a seated player as a keep-clear outline, one note of the mechanism as an inside view, textbook mic patterns, and motion drawn larger. Distances are measured from the grille to the mic’s front and rounded to about 5 mm. Keep the case closed, keep stands off the lid, and send a speaker output only to a speaker.',
};
