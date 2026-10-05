/**
 * C12 CLAVINET — the lesson's pages as DATA. Words from the owner's lesson
 * (docs/labs/miking/source_text/Clavinet-Miking-Technique.txt, "L<n>" in
 * COMMENTS only) with the fixes logged in docs/labs/miking/CORRECTIONS_LOG.md
 * applied: the mechanism (a tangent presses the string onto an anvil, L6),
 * the monitor null aimed TOWARD the loudest monitor (L41), a hearing line.
 *
 * The miked source is the amplifier the clavinet plays through, drawn
 * generically (ampSpec.ts); the direct (DI) path is the supporting option.
 * OWNER RULING 2026-10-04: starting points, never dogma; no source, brand or
 * model in learner text; no badges.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, PageContent, PageId, SetupReason, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { CLAV_MODEL } from './geometry.ts';
import { CLAV_ZONES } from './model.ts';
import { CLAV_COPY } from './copy.ts';

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the clavinet',
    goal: 'Get to know the clavinet and the amplifier it plays through: what it is, where you meet it, what it does in the music, and the amp’s parts — the speaker a mic actually hears — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The clavinet’s strings and pickups make a signal, not a sound in the air. A mic captures it only after an amplifier’s speaker turns it back into sound — so the speaker is the mic’s real source.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a key becomes a signal — the tangent, the anvil, the string, the pickups — and the two paths that signal can take to a recording: direct, or through the amp and a mic. Shown, never played.',
    credit: { scenarios: ['cv.snd.1', 'cv.snd.2', 'cv.snd.3'], interactive: 'soundPath', note: 'Step the key through to the end (or play it once), and answer the three checks.' },
    takeaway: 'A tangent presses the string onto an anvil; the pickups turn its motion into a small voltage; the yarn mutes it on release. Direct, the signal is captured as it is; miked, it is captured after the amp, the speaker and the room.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the clavinet’s surroundings — the keyboardist, the pedals, the amp, the cables and the power — what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['cv.set.1', 'cv.set.2', 'cv.set.3'], note: 'Answer the three checks.' },
    takeaway: 'Draw the whole signal path first. The clavinet’s output goes to a DI or a line input — never a mic input or phantom power. Keep cables, mains and a hot amp safe, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the amp by its properties — pattern, power, the level it can take, size and mount — not by its brand.',
    credit: { scenarios: ['cv.mic.1', 'cv.mic.2', 'cv.mic.3', 'cv.mic.4', 'cv.rec.1'], note: 'Answer the five checks (one reaches back to how the clavinet works).' },
    takeaway: 'A close directional dynamic is the common start: it takes the level and needs no power. A small condenser can work too — check its maximum level and the preamp’s headroom with the loudest pedals on.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — at the grille on the dust-cap line, the centre, the edge, turned off axis, a little farther back, or behind an open back — measured from the surface each names, then move the mic one thing at a time and see what changes.',
    credit: { scenarios: ['cv.place.1', 'cv.place.2', 'cv.place.3', 'cv.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin, measured from a named surface — not a rule. Centre to edge, angle and distance are separate things to try; mark each position so you can come back to it.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the amp mic so its pattern’s rejection points TOWARD the loudest monitor — and know when the direct signal is the better live path.',
    credit: { scenarios: ['cv.ctx.1', 'cv.ctx.2', 'cv.ctx.studio', 'cv.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Live, the direct signal usually gives more gain before feedback; a miked amp goes close, its null aimed at the loudest monitor. Real nulls are shallower than the picture, and no mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two mics, or mic and DI',
    goal: 'See why a close and a farther mic — or a mic and a direct track — can comb in mono, how the arrival-time difference places the notches, and what the polarity switch does and does not change.',
    credit: { scenarios: ['cv.two.1', 'cv.two.2', 'cv.two.3', 'cv.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two signals of the same speaker arrive at different times: in mono that can comb. Moving a mic or delaying a track changes the delay; the polarity switch does not. Keep both only if the blend helps the part.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Find the stage of the chain first — the clavinet, a pedal, the input, the amp, the mic position, the monitors — and fix it there. Hum and unsafe power belong to a qualified technician.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up a clavinet capture in the right order, choose and justify a setup for two different briefs, and say what would justify a second signal.',
    credit: { scenarios: ['cv.prac.order', 'cv.prac.gain', 'cv.prac.setup1', 'cv.prac.setup2', 'cv.prac.3', 'cv.mix.1', 'cv.mix.2', 'cv.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real clavinet and amp.' },
    takeaway: 'Knowing which part of the chain is captured, safe electrical practice, a repeatable position and correct level checks pass. A brand or the “closest” position do not — and more than one setup can pass.',
  },
};

/* THE CHECKS (lesson lines in comments only: cv.snd.* L4-L6 · cv.set.* L9,
 * L42-L43 · cv.mic.* L14, L37 · cv.place.* L14-L34 · cv.ctx.* L41-L43 ·
 * cv.two.* L38 · cv.prac.* L76-L81). */
const scenarios: MikingScenario[] = [
  {
    id: 'cv.snd.1',
    page: 'sound',
    prompt: 'A mic is placed in front of a clavinet’s amp. What does it actually hear?',
    options: ['The clavinet’s strings, carried through the air and the amp’s grille', 'The pickups directly, picked up by their magnetism', 'The speaker, turning the clavinet’s signal back into sound'],
    correct: 'The speaker, turning the clavinet’s signal back into sound',
    explain: 'The strings make almost no sound in the air; the pickups make a signal. Only a speaker turns that signal back into sound — and that is all a mic can hear.',
    why: {
      'The clavinet’s strings, carried through the air and the amp’s grille': 'The strings are in the clavinet, not the amp. The amp’s speaker reproduces their signal.',
      'The pickups directly, picked up by their magnetism': 'A mic responds to sound in the air, not to a magnetic field.',
    },
  },
  {
    id: 'cv.snd.2',
    page: 'sound',
    prompt: 'A clavinet key goes down. What makes the string sound?',
    options: ['A felt hammer strikes it once and falls back, as in a piano', 'A tangent presses it onto an anvil, and it rings past that point', 'A small plectrum plucks it, as in a harpsichord'],
    correct: 'A tangent presses it onto an anvil, and it rings past that point',
    explain: 'A small plunger — the tangent — under the string presses it onto an anvil; the string rings between the anvil and the bridge, where the pickups are.',
    why: {
      'A felt hammer strikes it once and falls back, as in a piano': 'There is no felt hammer: the tangent stays pressed while the key is down.',
      'A small plectrum plucks it, as in a harpsichord': 'Nothing plucks it: the tangent presses it onto the anvil.',
    },
  },
  {
    id: 'cv.snd.3',
    page: 'sound',
    prompt: 'What stops the note when the key comes up?',
    options: ['A felt damper that falls back onto the string', 'The yarn-wound part of the string, freed as the tangent drops', 'The pickups, which switch off for a moment until the next key is played'],
    correct: 'The yarn-wound part of the string, freed as the tangent drops',
    explain: 'Part of each string is wound with yarn. While the tangent holds the string on the anvil, that part is cut off; when it drops, the yarn mutes the string at once.',
    why: {
      'A felt damper that falls back onto the string': 'That is a piano. On a clavinet the yarn on the string itself mutes it.',
      'The pickups, which switch off for a moment until the next key is played': 'The pickups stay on; the string stops moving.',
    },
  },
  {
    id: 'cv.set.1',
    page: 'setting',
    prompt: 'You want a direct signal from the clavinet. Where does its output go?',
    options: ['A mic input with phantom power switched on, which gives it more level', 'A DI or a line or instrument input, never a mic input with phantom', 'Straight into the speaker cabinet, bypassing the amp'],
    correct: 'A DI or a line or instrument input, never a mic input with phantom',
    explain: 'Use a DI or a suitable line or instrument input, following the interface’s specifications. Never connect a mic input or phantom power to the clavinet’s output.',
    why: {
      'A mic input with phantom power switched on, which gives it more level': 'Phantom power and a mic input do not belong on an instrument output.',
      'Straight into the speaker cabinet, bypassing the amp': 'A speaker needs an amplifier’s power; the clavinet’s output is a small signal.',
    },
  },
  {
    id: 'cv.set.2',
    page: 'setting',
    prompt: 'Your amp mic is rated to a very high maximum SPL. What does that tell you about a long, loud soundcheck at the amp?',
    options: ['Everyone is safe while the amp stays below the mic’s rated level', 'Nothing — a mic’s max SPL is a distortion limit, not a hearing limit', 'You are safe as long as the mic is nearer the amp than you'],
    correct: 'Nothing — a mic’s max SPL is a distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, and every 3 dBA more halves the time — and a stage amp is loud.',
    why: {
      'Everyone is safe while the amp stays below the mic’s rated level': 'Max SPL tells you when the mic distorts, not what your ears can take. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      'You are safe as long as the mic is nearer the amp than you': 'A mic is not a hearing meter. Measure where the person listens, and keep levels and time down.',
    },
  },
  {
    id: 'cv.set.3',
    page: 'setting',
    prompt: 'A tube combo is hot and loud. How do you mount the close mic?',
    options: ['Tape it to the grille cloth, so that it cannot move at all during the set', 'Rest it on top of the amp, pointing down the front', 'A low, stable stand, clear of the speaker and the hot amp'],
    correct: 'A low, stable stand, clear of the speaker and the hot amp',
    explain: 'A low-profile stand or an approved cabinet clip, secure, clear of the grille and of a hot tube chassis — and the cable secured so nobody trips over it.',
    why: {
      'Tape it to the grille cloth, so that it cannot move at all during the set': 'The mic should not touch the grille, and tape can come loose into the speaker.',
      'Rest it on top of the amp, pointing down the front': 'The top of a tube amp is hot and the mic can slide off. Use a stand.',
    },
  },
  {
    id: 'cv.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · What do the clavinet’s pickups turn the string’s motion into?',
    options: ['Sound in the air, which a mic can pick up right beside the clavinet', 'A small voltage, which the amp turns back into sound', 'Light, which a sensor reads under each key'],
    correct: 'A small voltage, which the amp turns back into sound',
    explain: 'Magnetic pickups make a small voltage from the moving string; the amplifier and speaker turn it back into sound.',
    why: {
      'Sound in the air, which a mic can pick up right beside the clavinet': 'The pickups make a signal; only a speaker makes sound from it.',
      'Light, which a sensor reads under each key': 'The pickups are magnetic: they make a voltage.',
    },
  },
  {
    id: 'cv.mic.1',
    page: 'microphone',
    prompt: 'Why is a directional dynamic a common close mic on an amp?',
    options: ['It hears only the speaker, nothing else on stage', 'It is the only kind that can face a speaker', 'It takes high sound levels and needs no power'],
    correct: 'It takes high sound levels and needs no power',
    explain: 'Close to a loud speaker, a dynamic copes with the level and needs no phantom power. A small condenser can work too, if its maximum level suits.',
    why: {
      'It hears only the speaker, nothing else on stage': 'It favours what it faces; it still hears the stage.',
      'It is the only kind that can face a speaker': 'Condensers and ribbons are used on amps too, with care over the level.',
    },
  },
  {
    id: 'cv.mic.2',
    page: 'microphone',
    prompt: 'A cardioid right at the grille sounds bass-heavy. Which property is a likely part of it?',
    options: ['A cardioid hears less bass than an omni, whatever the distance', 'Proximity effect: a directional mic up close lifts the lows', 'The speaker sends its bass straight down the mic’s axis'],
    correct: 'Proximity effect: a directional mic up close lifts the lows',
    explain: 'Directional mics gain low end close to a source. Move back a little, or try another position, and compare at matched level.',
    why: {
      'A cardioid hears less bass than an omni, whatever the distance': 'Up close, a cardioid often hears MORE low end than an omni: proximity effect.',
      'The speaker sends its bass straight down the mic’s axis': 'Low frequencies spread widely; the lift comes from being close with a directional mic.',
    },
  },
  {
    id: 'cv.mic.3',
    page: 'microphone',
    prompt: 'Where does a supercardioid reject the most?',
    options: ['Straight behind it, right on its rear axis', 'At its sides, square to its front', 'Off to each side of the rear, near 125°'],
    correct: 'Off to each side of the rear, near 125°',
    explain: 'A supercardioid has a small rear lobe; its deepest rejection is toward the rear but off the axis.',
    why: {
      'Straight behind it, right on its rear axis': 'That is a cardioid. A supercardioid picks up a little straight behind.',
      'At its sides, square to its front': 'At 90° a supercardioid still picks up a fair amount; its deepest rejection is near 125°.',
    },
  },
  {
    id: 'cv.mic.4',
    page: 'microphone',
    prompt: 'You try a small condenser at the grille, with a fuzz pedal on. What do you check first?',
    options: ['Nothing: a condenser stays cleaner than a dynamic at high levels', 'Its maximum level, and the preamp’s headroom on the loudest peaks', 'That phantom power is off, since the speaker powers it'],
    correct: 'Its maximum level, and the preamp’s headroom on the loudest peaks',
    explain: 'Fuzz and boost pedals raise the level at the speaker; check the mic’s and the preamp’s headroom on the strongest playing. A condenser still needs its phantom power.',
    why: {
      'Nothing: a condenser stays cleaner than a dynamic at high levels': 'A condenser has its own maximum level, and the preamp can clip too.',
      'That phantom power is off, since the speaker powers it': 'A speaker powers nothing: a condenser needs its phantom power.',
    },
  },
  {
    id: 'cv.place.1',
    page: 'placement',
    prompt: 'You move the close mic from the centre of the speaker toward the edge of the cone. What tends to change?',
    options: ['More bite and upper-mid edge come in', 'Only the level changes, not the tone', 'The attack and the brightness soften'],
    correct: 'The attack and the brightness soften',
    explain: 'Toward the centre tends to bring more bite; toward the edge, a rounder sound — which may lose the percussive bite the part needs.',
    why: {
      'More bite and upper-mid edge come in': 'That is the move toward the centre.',
      'Only the level changes, not the tone': 'Across the cone the tone changes too: centre brighter, edge rounder.',
    },
  },
  {
    id: 'cv.place.2',
    page: 'placement',
    prompt: 'The cabinet has several speakers. Where does the close mic go?',
    options: ['Between two speakers, to catch both of them at once', 'Wherever the grille cloth looks the brightest', 'On one chosen speaker, noted down — not between two'],
    correct: 'On one chosen speaker, noted down — not between two',
    explain: 'Between speakers the mic hears several sources at different distances — an uneven result. Choose one, and write down which.',
    why: {
      'Between two speakers, to catch both of them at once': 'Two speakers at different distances can comb. Choose one.',
      'Wherever the grille cloth looks the brightest': 'Do not place a close mic by sight alone: listen, at matched level.',
    },
  },
  {
    id: 'cv.place.3',
    page: 'placement',
    prompt: 'Why move a close amp mic one thing at a time — across the cone, then the angle, then the distance?',
    options: ['So you can tell which change made the difference', 'Because a mic stand can only move in one direction', 'So the level stays exactly the same throughout'],
    correct: 'So you can tell which change made the difference',
    explain: 'Change one variable, listen to a repeated riff at matched level, and mark the position before the next change.',
    why: {
      'Because a mic stand can only move in one direction': 'A stand moves every way; the method is about knowing what changed.',
      'So the level stays exactly the same throughout': 'Levels change as you move; match them when you compare.',
    },
  },
  {
    id: 'cv.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Why does a mic right next to the clavinet itself capture little of its sound?',
    options: ['Its case blocks a mic from hearing the strings at all', 'Its pickups cancel the sound that comes near them, like a noise gate', 'Its strings make almost no sound in the air; the speaker does'],
    correct: 'Its strings make almost no sound in the air; the speaker does',
    explain: 'The clavinet is electro-mechanical: its sound reaches the air through an amplifier and a speaker.',
    why: {
      'Its case blocks a mic from hearing the strings at all': 'The strings are simply very quiet in the air; the sound is made by the speaker.',
      'Its pickups cancel the sound that comes near them, like a noise gate': 'Pickups do not cancel sound; they turn string motion into a signal.',
    },
  },
  {
    id: 'cv.ctx.1',
    page: 'context',
    prompt: 'The keyboardist’s wedge is loud in the amp mic. Which way do you aim the mic’s rejection?',
    options: ['Away from the wedge, so the mic’s back is clear', 'Toward the wedge, by the mic’s actual pattern', 'Straight up, away from the stage and its monitors'],
    correct: 'Toward the wedge, by the mic’s actual pattern',
    explain: 'The rejection — the null — is where the mic hears least: point it AT the loudest monitor, while the front still faces the speaker. Lower the level before you move it.',
    why: {
      'Away from the wedge, so the mic’s back is clear': 'That points the mic’s pickup toward the wedge. The null goes TOWARD the monitor.',
      'Straight up, away from the stage and its monitors': 'The null should face the monitor it is meant to reject.',
    },
  },
  {
    id: 'cv.ctx.2',
    page: 'context',
    prompt: 'With a cardioid facing the speaker, where should the wedge sit for the most rejection?',
    options: ['Off to one side of the rear, near 125°', 'Straight behind the mic, on its rear axis', 'Beside the mic, square to its front'],
    correct: 'Straight behind the mic, on its rear axis',
    explain: 'A cardioid rejects most directly behind (180°). A supercardioid’s deepest rejection is off the rear axis, near 125°. Aim by the actual pattern.',
    why: {
      'Off to one side of the rear, near 125°': 'That is a supercardioid. A cardioid rejects most straight behind.',
      'Beside the mic, square to its front': 'At 90° a cardioid still picks up half as much as on axis.',
    },
  },
  {
    id: 'cv.ctx.studio',
    page: 'context',
    prompt: 'In the studio, what does a clean direct track add next to the amp mic?',
    options: ['The sound of the amplifier, the speaker and the room around them', 'More level, so the amp mic can be turned down', 'A precise, low-spill signal that can be re-amped later'],
    correct: 'A precise, low-spill signal that can be re-amped later',
    explain: 'A direct track is clean and repeatable, and can be processed or re-amped later. It does not include the amp, the speaker, the room or the mic.',
    why: {
      'The sound of the amplifier, the speaker and the room around them': 'That is what the MIC adds. The direct track has none of it.',
      'More level, so the amp mic can be turned down': 'Level comes from gain. The direct track adds a different signal.',
    },
  },
  {
    id: 'cv.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · A direct signal taken BEFORE the pedals: what does it leave out?',
    options: ['Nothing: it is the same as a direct signal after them', 'The effects the player was hearing, and the amp', 'The clavinet’s own pickup and switch settings'],
    correct: 'The effects the player was hearing, and the amp',
    explain: 'A pre-pedal DI is clean and open to later processing, but does not document the sound the player was monitoring. Label it pre or post.',
    why: {
      'Nothing: it is the same as a direct signal after them': 'Before and after a distortion pedal are different signals.',
      'The clavinet’s own pickup and switch settings': 'Those are in the clavinet’s output, before any pedal.',
    },
  },
  {
    id: 'cv.two.1',
    page: 'twoMic',
    prompt: 'A close mic and a second one 25 cm back on the same speaker. Why can they sound hollow in mono?',
    options: ['The farther mic hears the speaker in reverse polarity', 'Two mics on one speaker cancel completely in mono', 'The speaker reaches the two mics at different times'],
    correct: 'The speaker reaches the two mics at different times',
    explain: 'The farther mic hears the speaker later. Summed in mono, the delayed copy cancels at some frequencies — a comb.',
    why: {
      'The farther mic hears the speaker in reverse polarity': 'Both face the front of the speaker: the issue is arrival TIME.',
      'Two mics on one speaker cancel completely in mono': 'They comb at some frequencies and add at others.',
    },
  },
  {
    id: 'cv.two.2',
    page: 'twoMic',
    prompt: 'You flip the farther mic’s polarity. What happens to the arrival-time difference?',
    options: ['It drops to zero, so the two arrivals line up again in time', 'Nothing: polarity flips the sign; the delay stays the same', 'It doubles, because the inverted copy arrives later'],
    correct: 'Nothing: polarity flips the sign; the delay stays the same',
    explain: 'Polarity reverses the signal’s sign; it does not remove a delay. The notches move; Δt does not.',
    why: {
      'It drops to zero, so the two arrivals line up again in time': 'Flipping polarity changes the sign, not when the sound arrives.',
      'It doubles, because the inverted copy arrives later': 'Polarity has no time in it. Only moving a mic, or delaying a track, changes when it arrives.',
    },
  },
  {
    id: 'cv.two.3',
    page: 'twoMic',
    prompt: 'A DI track and the amp mic sound thin together in mono. What is a likely cause?',
    options: ['The DI track carries the room’s reflections', 'The DI is wired in reverse polarity by design', 'The mic’s signal arrives later than the DI’s'],
    correct: 'The mic’s signal arrives later than the DI’s',
    explain: 'The direct signal is instant; the mic hears the speaker a little later. Adjust the distance, the track delay or the blend first; then test polarity.',
    why: {
      'The DI track carries the room’s reflections': 'A direct track has no room in it: that is the mic’s.',
      'The DI is wired in reverse polarity by design': 'A DI is not reversed by design; the timing is the usual cause.',
    },
  },
  {
    id: 'cv.two.4',
    page: 'twoMic',
    prompt: 'Should a close amp mic and a room mic be panned hard apart?',
    options: ['Hard apart: a close mic and a room mic on one amp make a stereo pair', 'Not necessarily: they need not be panned apart to sound larger', 'Hard apart, so that they cannot comb in mono'],
    correct: 'Not necessarily: they need not be panned apart to sound larger',
    explain: 'A close and a room mic are two perspectives, not a stereo pair. Panning does not change the mono sum — check it either way.',
    why: {
      'Hard apart: a close mic and a room mic on one amp make a stereo pair': 'Two perspectives on one speaker are not automatically a stereo pair.',
      'Hard apart, so that they cannot comb in mono': 'Panning does not change the mono sum.',
    },
  },
  {
    id: 'cv.prac.gain',
    page: 'practice',
    prompt: 'The direct signal is clean on soft playing but distorts when the boost pedal comes on. What do you do?',
    options: ['Pull the channel fader down until the boost sounds clean', 'Lower the stage that clips — the boost or the input — and re-check', 'Ask the player not to use the boost pedal in the show at all'],
    correct: 'Lower the stage that clips — the boost or the input — and re-check',
    explain: 'Find the stage that clips — the clavinet’s output, a pedal or the input — and restore headroom there. A lowered fader does not undo clipping before it.',
    why: {
      'Pull the channel fader down until the boost sounds clean': 'The clipping happens before the fader.',
      'Ask the player not to use the boost pedal in the show at all': 'Set the levels for the playing the music needs.',
    },
  },
  {
    id: 'cv.prac.3',
    page: 'practice',
    prompt: 'What would justify keeping both a DI track and the amp mic?',
    options: ['Two tracks give the mix engineer more to choose from later', 'The amp mic alone is too quiet to use', 'Together they improve the part, and they hold up in mono'],
    correct: 'Together they improve the part, and they hold up in mono',
    explain: 'Keep both only when the combination helps the part in context — aligned, and checked in mono.',
    why: {
      'Two tracks give the mix engineer more to choose from later': 'More tracks add a timing and combining check. The reason must be the part.',
      'The amp mic alone is too quiet to use': 'Level comes from gain, not from another track.',
    },
  },
  {
    id: 'cv.mix.1',
    page: 'practice',
    prompt: 'Which part of the chain does a close amp mic capture?',
    options: ['The clavinet’s pickups, before the pedals and the amp have shaped it', 'Only the pedals, between the clavinet and the amp', 'The speaker, after the clavinet, the pedals and the amp'],
    correct: 'The speaker, after the clavinet, the pedals and the amp',
    explain: 'The mic is the last link: it hears everything before it, through the speaker — and the room around it.',
    why: {
      'The clavinet’s pickups, before the pedals and the amp have shaped it': 'That is a pre-pedal direct signal, not a mic.',
      'Only the pedals, between the clavinet and the amp': 'The mic hears the speaker, after the whole chain.',
    },
  },
  {
    id: 'cv.mix.2',
    page: 'practice',
    prompt: 'A wedge sits about 125° off a supercardioid’s front axis. What can you expect?',
    options: ['Silence from the wedge, because it sits in the null', 'More wedge than straight behind the mic, where it rejects the most', 'Strong rejection on paper; in reality less, and least in the lows'],
    correct: 'Strong rejection on paper; in reality less, and least in the lows',
    explain: 'A null is infinitely deep only on paper. Real mics reject far less, and least at low frequencies.',
    why: {
      'Silence from the wedge, because it sits in the null': 'A null is infinitely deep only on paper.',
      'More wedge than straight behind the mic, where it rejects the most': 'A supercardioid has a small rear lobe; its deepest rejection is off the rear axis.',
    },
  },
  {
    id: 'cv.mix.3',
    page: 'practice',
    prompt: 'A DI and the amp mic sound thin in mono. Which change removes the arrival-time difference itself?',
    options: ['Delaying the DI track, or moving the mic', 'Flipping the polarity switch on one of them', 'Turning one up until it matches the other'],
    correct: 'Delaying the DI track, or moving the mic',
    explain: 'Only the timing sets the delay. Polarity moves the notches; level changes their depth.',
    why: {
      'Flipping the polarity switch on one of them': 'Polarity flips the sign; it does not remove the delay.',
      'Turning one up until it matches the other': 'Level changes the notches’ depth, not the delay.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'cv.sym.dist',
    observation: 'The direct signal is distorted',
    firstChecks: 'The clavinet’s output, a pedal’s boost or the input gain: lower the offending stage and restore headroom.',
    options: ['Each stage’s level: lower the one that clips', 'Lower the channel fader until the distortion sounds clean', 'Add a second mic to cover the distortion'],
    correct: 'Each stage’s level: lower the one that clips',
    explain: 'Clipping happens at a stage: the instrument, a pedal or the input. Lower that stage and re-check on the strongest playing.',
    why: {
      'Lower the channel fader until the distortion sounds clean': 'The clipping is before the fader.',
      'Add a second mic to cover the distortion': 'A mic does not fix a distorted direct signal.',
    },
  },
  {
    id: 'cv.sym.bright',
    observation: 'The amp mic is too bright',
    firstChecks: 'The capsule on the speaker’s centre or straight on axis: move toward the edge or angle it off axis.',
    options: ['Position across the cone and the angle; move out or turn', 'Cut the treble on the channel until it is dull enough to sit right', 'Turn the amp down until the brightness goes'],
    correct: 'Position across the cone and the angle; move out or turn',
    explain: 'At the centre, on axis, tends to be brightest. Move toward the edge, or turn the mic off axis, one change at a time.',
    why: {
      'Cut the treble on the channel until it is dull enough to sit right': 'EQ hides the cause. Move the mic first.',
      'Turn the amp down until the brightness goes': 'Level is not tone. Change the position.',
    },
  },
  {
    id: 'cv.sym.dull',
    observation: 'The amp mic is dull or lacks attack',
    firstChecks: 'The capsule too far off axis or at the edge: move slightly toward the centre; compare the distance.',
    options: ['Move slightly toward the centre and compare the distance', 'Boost the treble until the attack comes back', 'Change to a different amplifier straight away, before the next take'],
    correct: 'Move slightly toward the centre and compare the distance',
    explain: 'At the edge or turned away, the bite softens. Move back toward the centre a little at a time.',
    why: {
      'Boost the treble until the attack comes back': 'EQ before position hides the cause.',
      'Change to a different amplifier straight away, before the next take': 'The amp is the player’s sound. Move the mic first.',
    },
  },
  {
    id: 'cv.sym.hollow',
    observation: 'The DI and the mic sound hollow together',
    firstChecks: 'Arrival time or polarity: solo each, sum in mono, adjust the distance or delay, then the polarity.',
    options: ['Solo each, then mono; adjust delay or distance, then polarity', 'Flip the mic’s polarity and leave it that way for good', 'Pan the DI and the mic hard apart, so they cannot meet in mono'],
    correct: 'Solo each, then mono; adjust delay or distance, then polarity',
    explain: 'The mic arrives later than the DI. Align the timing first; a polarity flip does not fix every frequency.',
    why: {
      'Flip the mic’s polarity and leave it that way for good': 'Polarity does not remove a delay.',
      'Pan the DI and the mic hard apart, so they cannot meet in mono': 'Panning does not change the mono sum.',
    },
  },
  {
    id: 'cv.sym.hum',
    observation: 'Hum appears in the direct path',
    firstChecks: 'Power, a cable, the DI or modified wiring: stop and isolate safely; use a qualified technician.',
    options: ['Stop, isolate safely, and get a qualified diagnosis', 'Open the clavinet and check its wiring while it is on', 'Turn the gain up so the music covers the hum'],
    correct: 'Stop, isolate safely, and get a qualified diagnosis',
    explain: 'Swap one cable or the DI at a time with power handled safely; unsafe power or modified wiring is a technician’s job.',
    why: {
      'Open the clavinet and check its wiring while it is on': 'Never open a powered instrument or amp.',
      'Turn the gain up so the music covers the hum': 'More gain raises the hum too.',
    },
  },
  {
    id: 'cv.sym.feedback',
    observation: 'Feedback on stage',
    firstChecks: 'A monitor or the PA entering the mic: lower the level, change the geometry, use the direct path as needed.',
    options: ['Lower the level; then the geometry and the direct path', 'Keep raising the clavinet’s output over the ringing', 'Move the mic closer to the wedge to monitor it'],
    correct: 'Lower the level; then the geometry and the direct path',
    explain: 'Bring the offending monitor or channel down first; then aim the null at the monitor, move it, or lean on the direct signal. Never provoke feedback.',
    why: {
      'Keep raising the clavinet’s output over the ringing': 'More level feeds the loop.',
      'Move the mic closer to the wedge to monitor it': 'That feeds more of the wedge into the mic.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'cv.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a clavinet capture — direct and amp mic — in the order you would do them.',
    steps: [
      { text: 'Draw the signal path: clavinet, pedals, amp, speaker, mic, console', early: 'Start by knowing which parts of the chain exist.' },
      { text: 'Write down the switches, the pedal order and the amp settings', early: 'Document the source once you know the chain.' },
      { text: 'Connect the direct path to a DI or line input — no mic input, no phantom', early: 'The direct path comes once the chain is known.' },
      { text: 'Set the direct level with headroom for the hardest playing and boosts', early: 'Set its level once it is connected.' },
      { text: 'Mute the mic channel; place the close mic on one chosen speaker', early: 'Place the mic once the direct path is safe.' },
      { text: 'Set the mic gain on the loudest passages and effects', early: 'Gain is set once the mic is placed and connected.' },
      { text: 'Compare positions one change at a time, then the blend in mono', early: 'Compare only once both levels are set safely.' },
    ],
    explain: 'A sensible order. The direct path is safe and repeatable; the mic adds the amp. Mute or lower a channel before moving its mic, and follow your own equipment’s manuals.',
  },
];

const POWER_REASON: SetupReason = { id: 'r.power', label: 'Each input gets the right connection and power (a DI or line input; phantom only where a mic needs it)', role: 'required', feedback: 'Say how each path connects: the clavinet’s output never gets a mic input or phantom.' };
const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point, measured from the right surface — or a labelled direct path', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };
const CLEAR_REASON: SetupReason = { id: 'r.clear', label: 'The mic, stand and cables are safe: off the grille, clear of a hot amp and the player’s feet', role: 'required', feedback: 'Safety and clearance are part of every passing setup.' };
const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand most engineers reach for on an amp', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' };
const CLOSE_REASON: SetupReason = { id: 'r.closest', label: 'Right on the centre, closest, always gives the best clavinet', role: 'wrong', feedback: 'The centre tends to be brightest, not best; the part decides.' };

const setupTasks: SetupTask[] = [
  {
    id: 'cv.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A funk session: the player wants their amp’s sound, with a wah pedal. Two channels; a passive DI is available.',
    setups: [
      { id: 'a', label: 'A passive DI after the pedals, plus a close dynamic at the grille on the dust-cap line', ok: true, power: 'none', feedback: 'A recommended pairing: the effects in both, the amp in the mic — aligned in mono.' },
      { id: 'b', label: 'One close dynamic at the grille, between the centre and the edge', ok: true, power: 'none', feedback: 'A recommended single-mic start: the player’s amp sound.' },
      { id: 'c', label: 'A condenser 30 cm from the clavinet’s strings, with no amp', ok: false, power: 'phantom', feedback: 'The strings make almost no sound in the air: the clavinet needs its amp or a direct path.' },
      { id: 'd', label: 'The clavinet’s output into a mic input with phantom on', ok: false, power: 'phantom', feedback: 'Never a mic input or phantom on the clavinet’s output: use a DI or line input.' },
      { id: 'e', label: 'A close mic placed between two speakers of a 2×12 cabinet', ok: false, power: 'none', feedback: 'Between speakers it hears two sources at different distances. Choose one.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.mono', label: 'I will align the DI and the mic in mono', role: 'optional', feedback: 'A fair reason whenever two paths are blended.' }, BRAND_REASON, CLOSE_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: the right part of the chain, a sensible start from its named surface, safe connections and clearance.',
  },
  {
    id: 'cv.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud club stage: the clavinet’s amp sits behind the player, a wedge in front of them. One or two channels.',
    setups: [
      { id: 'a', label: 'The direct signal (a DI after the pedals) to the PA', ok: true, power: 'none', feedback: 'A recommended live path: more gain before feedback, less spill.' },
      { id: 'b', label: 'A close dynamic at the grille, its null aimed toward the wedge, plus the DI', ok: true, power: 'none', feedback: 'A recommended combination, with the null pointed at the loudest monitor.' },
      { id: 'c', label: 'A close mic with its null aimed away from the wedge', ok: false, power: 'none', feedback: 'That points the pickup at the wedge. The null goes TOWARD the loudest monitor.' },
      { id: 'd', label: 'A room mic 2 m in front of the amp', ok: false, power: 'none', feedback: 'On a loud stage a distant mic hears the band and the monitors more than the amp.' },
      { id: 'e', label: 'A mic taped to the grille cloth', ok: false, power: 'none', feedback: 'The mic never touches the grille; use a stand or an approved clip.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.null', label: 'The mic’s null points toward the loudest monitor', role: 'optional', feedback: 'A fair live reason — with the level down before any move.' }, BRAND_REASON, CLOSE_REASON],
    explain: 'Two setups pass. What passes is the reasoning: the direct path where it serves, a close mic with its null toward the monitor, safe connections and clearance.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: what makes the clavinet’s sound reach a microphone?', options: ['The strings themselves', 'The pickups, through a speaker', 'The keys hitting the case'], after: 'Now STEP through the key (or PLAY ONCE) and watch where the signal goes.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the close mic from the centre of the speaker to its edge. What changes?', options: ['More bite', 'A rounder sound', 'It depends on this amp'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'Which way should the mic’s rejection point?', options: ['Toward the loudest monitor', 'Away from the loudest monitor', 'Straight up'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION.' },
  twoMic: { prompt: 'If you flip one mic’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What does a clavinet need before a microphone can capture it?',
    options: ['An amplifier and speaker to turn its signal into sound', 'A quiet room, since its strings are very quiet', 'Its lid opened, to let the quiet strings be heard in the room'],
    correct: 'An amplifier and speaker to turn its signal into sound',
    explain: 'Its strings and pickups make a signal. A mic hears it only through a speaker; otherwise the direct path captures it.',
    why: {
      'A quiet room, since its strings are very quiet': 'Quiet or not, the strings barely sound in the air. The sound comes from a speaker.',
      'Its lid opened, to let the quiet strings be heard in the room': 'Opening it does not help: the sound is made by a speaker.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'Where are the clavinet’s pickups?',
    options: ['At the end of the strings away from the anvil', 'Under each key, right where the player presses it down', 'Inside the amplifier, beside the speaker'],
    correct: 'At the end of the strings away from the anvil',
    explain: 'The tangent presses each string onto an anvil at one end; magnetic pickups sit at the other end.',
    why: {
      'Under each key, right where the player presses it down': 'The keys move the tangents; the pickups are under the strings’ far end.',
      'Inside the amplifier, beside the speaker': 'The pickups are in the clavinet; the amp only amplifies.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'What makes a clavinet string sound when its key goes down?',
    options: ['A tangent presses it onto an anvil', 'A felt hammer strikes it once', 'A plectrum plucks it on the way up'],
    correct: 'A tangent presses it onto an anvil',
    explain: 'The tangent presses the string onto the anvil and holds it there while the key is down.',
    why: {
      'A felt hammer strikes it once': 'That is a piano; a clavinet’s tangent stays pressed.',
      'A plectrum plucks it on the way up': 'That is a harpsichord; nothing plucks a clavinet string.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'A pickup sits on one of a string’s still points for a shape. What does it hear of that shape?',
    options: ['Nothing: the string does not move there in that shape', 'All of it: a pickup hears all the shapes the same', 'Twice as much as anywhere else along the string'],
    correct: 'Nothing: the string does not move there in that shape',
    explain: 'A pickup hears a shape only as much as the string moves under it — nothing at a still point.',
    why: {
      'All of it: a pickup hears all the shapes the same': 'Where it sits matters: the string moves differently there in each shape.',
      'Twice as much as anywhere else along the string': 'A still point is where the string does not move.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'Where must the clavinet’s output NOT be connected?',
    options: ['A mic input with phantom power', 'A DI box, before or after the pedals', 'The amplifier’s instrument input'],
    correct: 'A mic input with phantom power',
    explain: 'The output goes to a DI or a line or instrument input — never a mic input or phantom power.',
    why: {
      'A DI box, before or after the pedals': 'A DI is the right way to take a direct signal.',
      'The amplifier’s instrument input': 'That is the amp path the clavinet is made for.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: 'Your amp mic is rated to a very high maximum SPL. What does that tell you about a long, loud soundcheck at the amp?',
    options: ['Nothing — that is the mic’s distortion limit, not a hearing limit', 'It is safe for as long as the amp stays below the mic’s rated level', 'It is safe as long as the mic is nearer the amp than you'],
    correct: 'Nothing — that is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'It is safe for as long as the amp stays below the mic’s rated level': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      'It is safe as long as the mic is nearer the amp than you': 'Where the mic sits says nothing about your ears.',
    },
  },
];

const wedges: Wedge[] = [
  {
    id: 'wedge.keys',
    label: 'the keyboardist’s wedge, in front of them',
    short: 'KEYS WEDGE',
    p: { x: 2100, y: 190, z: -1400 },
    lift: 150,
    faces: { x: -1, y: 0, z: 0 },
    note: 'On the floor in front of the keyboardist, facing back at them — and toward the amp behind them: out on the mic’s rear side, off to one side. Turn the mic so its null points at it.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
  },
  {
    id: 'wedge.band',
    label: 'the band’s monitor, beside the amp',
    short: 'BAND WEDGE',
    p: { x: -600, y: 190, z: 1100 },
    lift: 150,
    faces: { x: 0, y: 0, z: 1 },
    note: 'Beside and a little behind the amp, facing another player: about 60° off the close mic’s front, on its open side — a pattern does little for it. Lower it or move it.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout' },
  },
];

export const C12_LESSON: Lesson = {
  id: 'C12',
  labId: 'strings',
  title: 'Clavinet',
  subtitle: 'The direct signal and the miked amp: two capture paths',
  noun: { one: 'amp', many: 'amps' },
  model: CLAV_MODEL,
  micTypeIds: ['instDynCard', 'sdcCard'],
  zones: CLAV_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'An electro-mechanical keyboard: 60 keys from contra F to e′′′ (about 44 Hz to 1.3 kHz), one string per note. A key presses its string onto an anvil, and magnetic pickups turn the string’s motion into a small signal at the output (marked 100 mV).', src: 'HOH-D6' },
    { title: 'WHERE YOU MEET IT', text: 'Funk, soul, rock and pop, on stage and in the studio — often through a guitar-style amp and pedals such as wah or fuzz. A clavinet with other performers belongs to the ensembles lab.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Short, percussive, rhythmic parts with a sharp attack; its pickup switches and filters change the tone. Ask for the real parts and settings before choosing a capture.', src: 'LESSON' },
    { title: 'WHAT A MIC HEARS', text: 'Only a speaker: the clavinet’s strings make almost no sound in the air. So there are two capture paths — the direct signal, and a mic on the amp — and this lesson teaches both.', src: 'LESSON' },
  ],
  sound: {
    stages: [
      { title: 'The key goes down', text: 'The key is a lever: its front goes down and, behind the pivot, a small plunger — the tangent — rises toward the string.' },
      { title: 'The tangent presses the string onto the anvil', text: 'The tangent presses the string up onto a metal anvil and holds it there while the key is down. The anvil marks one end of the sounding string.' },
      { title: 'The string rings', text: 'Between the anvil and the bridge at the far end, the string rings (drawn many times larger). It makes almost no sound in the air on its own.' },
      { title: 'The pickups make a signal', text: 'Magnetic pickups at the bridge end turn the string’s motion into a small voltage: out of the clavinet, through any pedals, to the amp — and only its speaker makes a sound a mic can hear.' },
      { title: 'The key comes up — the yarn mutes it', text: 'The tangent drops away. The yarn-wound part of the string, held off while the string was pressed, can move again, and mutes it at once: a short, percussive note.' },
    ],
    attack: 'The start of the sound: the tangent pressing the string onto the anvil — a sharp, percussive attack. A direct signal keeps it most precisely; a close mic near the speaker’s centre tends to hear it brightest.',
    body: 'The rest: the string ringing until the key comes up and the yarn mutes it, shaped by the pickup switches, the pedals, the amp and the speaker — and, for a mic, the cabinet and the room. These are tendencies; every chain differs.',
    head: { diameterMm: 0, rods: 0, label: 'not a drum: see the string’s shapes', strikeSrc: 'PHYS-STRING' },
  },
  setting: {
    items: [
      { id: 'amp', label: 'the amplifier (what a mic hears)', short: 'AMP', note: 'Ringed in amber: the amp the clavinet plays through, behind the keyboardist. Its speaker is the only thing a mic can hear of the clavinet.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'THE SOURCE', scene: 'all' },
      { id: 'clav', label: 'the clavinet and the keyboardist', short: 'CLAVINET', note: 'The keyboardist stands at the clavinet, facing the audience. Keep stands and cables out of their way and off their feet.', prov: { kind: 'sourced', src: 'HOH-D6', quote: '60 piano keys with a range from contra F to e\'\'\'' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'pedals', label: 'the pedals and the cables', short: 'PEDALS', note: 'Between the clavinet and the amp: part of the sound, and part of the path. Note their order; tape the cables down where the player walks.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'IN THE PATH', scene: 'kit' },
      { id: 'wedge.keys', label: 'the keyboardist’s wedge (monitor)', short: 'KEYS WEDGE', note: 'In front of the keyboardist, facing them — and toward the amp behind them. Aim the amp mic’s null TOWARD it.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'wedge.band', label: 'the band’s monitor', short: 'BAND WEDGE', note: 'Beside the amp, facing another player: loud, and on the open side of the amp mic.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'band', label: 'the rest of the band', short: 'BAND', note: 'Loud, close by: its sound reaches every open mic. The direct path hears none of it.', prov: { kind: 'illustrative', reason: 'a generic band area' }, tag: 'SPILL', scene: 'stage' },
      { id: 'pa', label: 'the audience and the PA', short: 'AUDIENCE · PA', note: 'Live, the direct signal usually feeds the PA; the amp is miked when it is part of the sound.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'di', label: 'a DI box', short: 'DI', note: 'Takes the direct signal — label it before or after the pedals — to a line or mic-level input on the console. Never a mic input or phantom straight on the clavinet’s output.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'DIRECT PATH', scene: 'studio' },
      { id: 'room', label: 'a room mic', short: 'ROOM MIC', note: 'Add room distance only when the room contributes something useful; each added mic adds spill and a timing check.', prov: { kind: 'illustrative', reason: 'a typical layout; the lesson gives no distance' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: the direct signal usually gives more gain before feedback and less spill. Mic the amp when it is part of the player’s sound — close, its null aimed at the loudest monitor, the amp’s volume under control.',
    studio: 'STUDIO: keep a clean direct track, labelled pre or post the pedals, and a close mic on one chosen speaker; add a room mic only when the room helps. Align them in mono.',
  },
  diagnostic,
  practice: {
    task: 'Draw the clavinet’s signal path, choose a capture — direct, miked or both — for a given session or stage, and explain what would justify the second path. With a real clavinet and amp and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'chain', label: 'The signal path (and where the DI sits)', kind: 'text' },
      { id: 'settings', label: 'Pickup and filter switches, pedals, amp settings', kind: 'text' },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['instrument dynamic, cardioid', 'small condenser', 'other', 'none (direct only)'] },
      { id: 'zone', label: 'Mic position (centre, line, edge, angle, distance)', kind: 'text' },
      { id: 'blend', label: 'The DI and mic blend, and the mono check', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The clearance kept from the grille and the cabinet (5 mm) — ILLUSTRATIVE, for the owner to approve.', dims: ['co', 'cb'] },
    { text: 'The amplifier is drawn generically: the cabinet sizes come from a real open-backed combo and a real closed 1×12 cabinet, not from the lesson; the speaker’s position on the baffle, the open back’s opening and the chassis are drawing defaults.', dims: [] },
    { text: 'The speaker’s dust cap (radius 5 cm) and surround (12.8 cm) are drawing defaults; the cone’s size comes from a real 12-inch speaker.', dims: [] },
    { text: 'The clavinet’s case (100 × 45 cm), the stage layout and the keyboardist’s position are drawing defaults: the leaflet gives no dimensions. The mechanism is drawn as one straight string, not to scale.', dims: [] },
    { text: 'The bands round the guides’ figures (at the grille 0.5–5 cm, the dust-cap line ±2 cm, the edge 9–14 cm off the centre, behind the open back 5–15 cm) — the lab’s drawing. No source gives a distance behind an open back.', dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every clavinet, pedal, amp, speaker and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a generic combo and a closed 1×12 cabinet with typical sizes, one string of the clavinet drawn straight, mic patterns and the two-mic comb as textbook shapes, and motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Electrical faults are for a qualified technician.',
  copy: CLAV_COPY,
};
