/**
 * A01 TRUMPET AND FLUGELHORN — the lesson's pages as DATA (blueprint §7).
 * The words come from the owner's lessons (docs/labs/miking/source_text/
 * Trumpet-Miking-Technique-Research.txt and Flugelhorn-…, cited "L<n>" in
 * COMMENTS only) with the fixes logged in docs/labs/miking/CORRECTIONS_LOG.md
 * (A1-01 … A1-08) applied — among them the distant view "about 3 m" (was
 * "several-meter", L14), the practice guide's 2–4 ft trumpet start (ADD),
 * the flugelhorn pickup mute's 3–4 cm reach and the 80 Hz wireless low-cut.
 *
 * One lesson with the instrument as its variant (HORN: TRUMPET /
 * FLUGELHORN), as the research groups them (Batch 3 §4: brass I).
 * OWNER RULING 2026-10-04 — learner-facing presentation: suggested starting
 * points, never dogma; no source, brand or model in learner text; no badges.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, LessonPages, PageContent, SourcePageId, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, LOUD_REASON, clearReason, docReason, gainCheck, hearingCheck, hearingDiag, hollowSymptom, matchedLevels, nullOnPaper, polarityDelay, removeDelay, superNull, type Words } from '../shared/bowed/bowedItems.ts';
import { overloadCheck, brassFeedback, DYN_POWER_REASON, CLIP_POWER_REASON } from '../shared/brass/brassItems.ts';
import { A01_MODEL, TP } from './geometry.ts';
import { A01_ZONES } from './model.ts';
import { A01_COPY } from './copy.ts';

const W: Words = { noun: 'trumpet', player: 'trumpeter', moving: 'the bell, the valve hands and the mutes' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the trumpet',
    goal: 'Get to know the trumpet and the flugelhorn — what they are, where you meet them, what they do in the music, and their parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The lips buzz in the mouthpiece, the tube sets the note, the valves add tube, and the bell sends the sound out. The flugelhorn is the same idea with a wider, more conical tube and a larger bell.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how buzzing lips become a note — the air column, the standing wave, the bell — and where the sound goes: spread all round low down, beamed ahead up high.',
    credit: { scenarios: ['tp.snd.1', 'tp.snd.2', 'tp.snd.3'], interactive: 'soundPath', note: 'Step the sequence through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The lips buzz, the tube’s standing wave sets the note, and the bell lets the sound out: the lows spread round, the highs beam along the bell’s axis. So the angle to the bell is a tone control — tendencies, and horns vary.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the horn sits — the player, the bell’s movement, the valve hands and the mutes, the music stand and the neighbours — what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['tp.set.1', 'tp.set.2', 'tp.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The bell points wherever the player turns, mutes go in and out, and the valve hands never stop. No mic, stand or cable goes there. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the horn by its properties — pattern, power, the level it can take, and its mount — not by its brand.',
    credit: { scenarios: ['tp.mic.1', 'tp.mic.2', 'tp.mic.3', 'tp.mic.4', 'tp.rec.1'], note: 'Answer the five checks (one reaches back to how the horn sounds).' },
    takeaway: 'Pattern, power, the level the mic can take and its mount decide what it can do here. A stand mic in front gives the horn and some room; a bell clip keeps one distance as the player moves. Check the mic can take the horn’s peaks.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — in front of the bell, a little off its axis, aimed toward it, clear of the player — then move the mic and see what changes.',
    credit: { scenarios: ['tp.place.1', 'tp.place.2', 'tp.place.3', 'tp.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin, measured from the bell rim’s centre — not a rule. The angle to the bell’s axis and the distance are separate tone controls, and clearance from the bell, the mutes and the hands comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the player’s wedge — and know what a pattern cannot do, and why a horn on a loud stage and an overdub in a good room need different choices.',
    credit: { scenarios: ['tp.ctx.1', 'tp.ctx.2', 'tp.ctx.studio', 'tp.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A cardioid rejects most behind; a supercardioid off to each side of the rear. Real nulls are shallower than the picture, and no mic position alone prevents feedback. Live, a closer mic or a bell clip; in the studio, a balanced main mic and maybe the room.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a close mic and a farther room mic on one horn can sound thin together, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: ['tp.two.1', 'tp.two.2', 'tp.two.3', 'tp.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two mics at different distances hear the horn at different times: some pitches cancel in the sum. Move or rebalance first; polarity flips the sign and never removes a delay. Judge the pair in mono, at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — the angle to the bell, the distance, overload in the mic itself, the player’s movement, a mute, the combination — before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one trumpet mic in the right order, choose and justify a setup for a studio overdub and a loud stage, and say what would justify a second mic.',
    credit: { scenarios: ['tp.prac.order', 'tp.prac.gain', 'tp.prac.setup1', 'tp.prac.setup2', 'tp.prac.3', 'tp.mix.1', 'tp.mix.2', 'tp.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real horn.' },
    takeaway: 'Safe clearance from the bell, the mutes and the hands, headroom for the loudest accent, pattern reasoning and an accurate account of polarity versus delay pass. A brand or a “loudest” position do not — and more than one setup can pass.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only: tp.snd.* L4, L6 and the brass
 * physics of trumpet/SOURCES.md §b · tp.set.* L4, L13–L15, L49 · tp.mic.*
 * L8, L17, L28 · tp.place.* L7, L17, L28 · tp.ctx.* L16, L46 · tp.two.* L14,
 * L42 · tp.prac.* / tp.mix.* L54–L59 · flugelhorn L20 (switching), L21.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'tp.snd.1',
    page: 'sound',
    prompt: 'The player buzzes into the mouthpiece. What decides which note comes out?',
    options: ['The tube’s standing wave, which the lips lock to', 'Only how hard the player buzzes the lips into the cup', 'The size of the bell at the front of the horn'],
    correct: 'The tube’s standing wave, which the lips lock to',
    explain: 'The buzzing lips start the sound, but the air column in the tube has its own resonances: a standing wave builds, and the lips lock to one of them. Valves add tube and move the resonances down.',
    why: {
      'Only how hard the player buzzes the lips into the cup': 'The lips choose WHICH resonance by their tension; the tube decides where the resonances are.',
      'The size of the bell at the front of the horn': 'The bell shapes the resonances and where the sound goes, but the whole tube sets the notes.',
    },
  },
  {
    id: 'tp.snd.2',
    page: 'sound',
    prompt: 'Where does most of a trumpet’s high-frequency sound go?',
    options: ['Straight ahead, along the bell’s axis', 'Evenly all round the bell, front and back', 'Back toward the player, from the valves'],
    correct: 'Straight ahead, along the bell’s axis',
    explain: 'The bell beams the highs forward, more so as the pitch rises; the lows spread out nearly all round. That is why a mic on the axis sounds brighter and one off to the side softer.',
    why: {
      'Evenly all round the bell, front and back': 'That is the low notes. The highs gather along the axis.',
      'Back toward the player, from the valves': 'The valves only change the tube. The sound leaves at the bell, and the highs go forward.',
    },
  },
  {
    id: 'tp.snd.3',
    page: 'sound',
    prompt: 'Why does the player hear their own horn differently from the audience?',
    options: ['They hear it from behind the bell, off its beam', 'Their ears are closer, so it sounds the same, only louder', 'The mouthpiece blocks the sound from reaching their ears'],
    correct: 'They hear it from behind the bell, off its beam',
    explain: 'The player sits behind the bell, where mostly the lows reach: the bright beam goes the other way. So ask what the horn should sound like — and listen from the audience’s side too.',
    why: {
      'Their ears are closer, so it sounds the same, only louder': 'Closer, but behind the bell — the balance is different, not just the level.',
      'The mouthpiece blocks the sound from reaching their ears': 'The sound leaves the bell and reaches the player round its side; it is the angle, not a block.',
    },
  },
  hearingCheck('tp.set.1', W),
  {
    id: 'tp.set.2',
    page: 'setting',
    prompt: 'A stand mic clears the open bell. The player then fits a cup mute. What do you do?',
    options: ['Stop, and re-check clearance with the mute in', 'Nothing: a mute sits inside the bell, behind the rim', 'Move the mic straight onto the bell’s axis'],
    correct: 'Stop, and re-check clearance with the mute in',
    explain: 'A mute is a different source: it reaches past the rim, changes the tone and the direction, and a plunger brings the hand in front. Play the whole mute passage and check clearance again — the player fits their own mute.',
    why: {
      'Nothing: a mute sits inside the bell, behind the rim': 'A cup mute reaches past the rim — what cleared the open bell may not clear the mute.',
      'Move the mic straight onto the bell’s axis': 'The tone is a separate question. First check that nothing collides.',
    },
  },
  {
    id: 'tp.set.3',
    page: 'setting',
    prompt: 'Before placing any mic, what do you ask the trumpeter for?',
    options: ['The real part: quiet notes, loud accents, mutes', 'Whether it is a B♭ or a C trumpet, for the mic', 'A single held middle note, to set the input level'],
    correct: 'The real part: quiet notes, loud accents, mutes',
    explain: 'Hear the actual music: the softest endings, the strongest high attacks, falls and shakes, every mute change — and watch how far the bell moves. One held note says nothing about the peaks.',
    why: {
      'Whether it is a B♭ or a C trumpet, for the mic': 'The pitch of the horn does not choose the mic. The part and its dynamics do.',
      'A single held middle note, to set the input level': 'A polite middle note hides the peaks and the movement. Use the real part.',
    },
  },
  {
    id: 'tp.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic sits on the bell’s axis, close. Compared with one off to the side, it tends to hear…',
    options: ['More brightness and bite', 'Less of the highs than off axis', 'Mostly the room around the horn'],
    correct: 'More brightness and bite',
    explain: 'The highs beam along the axis, so a mic on it hears more of them: brighter and more defined. Off to the side the top softens. A tendency, to check by ear.',
    why: {
      'Less of the highs than off axis': 'The highs are strongest on the axis, not weakest.',
      'Mostly the room around the horn': 'Close on the axis, the direct horn dominates — the room is far down.',
    },
  },
  overloadCheck('tp.mic.1', 'trumpet'),
  {
    id: 'tp.mic.2',
    page: 'microphone',
    prompt: 'Why might a miniature on a bell clip suit a player who moves a lot?',
    options: ['It rides on the bell, so the distance holds', 'Its clip stops it hearing the rest of the band', 'It needs no power, so a spare input will do'],
    correct: 'It rides on the bell, so the distance holds',
    explain: 'On the bell, the capsule keeps one distance however the player turns — a stand mic has a working zone the bell can leave. It still hears the stage, and its close view is more coloured.',
    why: {
      'Its clip stops it hearing the rest of the band': 'A clip is a mount, not a pattern: the mic still hears the stage.',
      'It needs no power, so a spare input will do': 'A miniature condenser needs phantom power, through its adapter.',
    },
  },
  {
    id: 'tp.mic.3',
    page: 'microphone',
    prompt: 'Your only spare input has no phantom power. Which of this page’s mics will work?',
    options: ['The dynamic: it needs no power', 'The bell clip, since it is so small', 'The condenser, if its cable is short'],
    correct: 'The dynamic: it needs no power',
    explain: 'A dynamic makes its own signal. Both condensers — the stand mic and the bell clip — need phantom power (the miniature through its adapter).',
    why: {
      'The bell clip, since it is so small': 'Size does not power a condenser. The miniature still needs phantom power through its adapter.',
      'The condenser, if its cable is short': 'Cable length does not power a condenser.',
    },
  },
  {
    id: 'tp.mic.4',
    page: 'microphone',
    prompt: 'A player switches from trumpet to flugelhorn in the set. What about the trumpet’s clip and level?',
    options: ['Check the clip’s fit, the position and the level', 'Keep both: the two horns are built the same way', 'Keep both, as long as the mute stays the same'],
    correct: 'Check the clip’s fit, the position and the level',
    explain: 'The flugelhorn’s bell is wider and shaped differently, so a trumpet clip may not fit; it is held differently and plays at its own level. Check the clip’s range, mark a place for each horn and soundcheck both.',
    why: {
      'Keep both: the two horns are built the same way': 'Their bells and tubes differ: the flugelhorn’s bell is wider and its tube more conical.',
      'Keep both, as long as the mute stays the same': 'The mute is a separate question; the bell’s size and the level still change.',
    },
  },
  {
    id: 'tp.place.1',
    page: 'placement',
    prompt: 'A starting point says “30–50 cm from the bell”. What is that measured from?',
    options: ['The centre of the bell’s rim', 'The player’s lips, at the cup', 'The valves, mid-way along'],
    correct: 'The centre of the bell’s rim',
    explain: 'The sound leaves at the bell, so these distances start at the centre of the rim. The same number from the mouthpiece or the valves would put the mic somewhere else.',
    why: {
      'The player’s lips, at the cup': 'The cup is where the sound starts, not where it leaves. Measure from the bell.',
      'The valves, mid-way along': 'The valves change the tube; they do not radiate the sound.',
    },
  },
  {
    id: 'tp.place.2',
    page: 'placement',
    prompt: 'You move the mic from on the bell’s axis to well off to one side, same distance. What tends to change?',
    options: ['A softer top, with less bite', 'More highs and more edge', 'Only the level, not the tone'],
    correct: 'A softer top, with less bite',
    explain: 'Off the axis the mic sits beside the highs’ beam: a softer, mellower top. Toward the axis brings back brightness and edge — check the attacks still read.',
    why: {
      'More highs and more edge': 'That is what moving TOWARD the axis tends to do.',
      'Only the level, not the tone': 'The angle changes the balance of highs to lows, not just the level.',
    },
  },
  {
    id: 'tp.place.3',
    page: 'placement',
    prompt: 'Where should a bell clip’s capsule point?',
    options: ['Between the bell’s centre and its edge', 'Straight down the middle of the bell', 'Back at the valves, away from the rim'],
    correct: 'Between the bell’s centre and its edge',
    explain: 'Aimed between the centre and the edge, the close capsule hears a smoother horn than dead centre. If it is too bright, move the aim further from the centre.',
    why: {
      'Straight down the middle of the bell': 'Dead centre takes the full blast and brightness; a little off it is smoother.',
      'Back at the valves, away from the rim': 'The sound leaves the bell, not the valves — and the valves bring clicks.',
    },
  },
  {
    id: 'tp.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Besides the player, what must a trumpet mic, stand and cable stay clear of?',
    options: ['The bell’s movement, the mutes and the valve hands', 'The music stand, so the player can see the part', 'The front of the bell, so the audience can see it'],
    correct: 'The bell’s movement, the mutes and the valve hands',
    explain: 'Clearance comes first: whatever moves — the bell as the player turns, a mute or plunger going in and out, the hands on the valves. Stop the player before anything moves.',
    why: {
      'The music stand, so the player can see the part': 'Sight lines matter, but the safety question is what moves.',
      'The front of the bell, so the audience can see it': 'In front of the bell is where a stand mic usually goes. What must stay clear is what moves.',
    },
  },
  {
    id: 'tp.ctx.1',
    page: 'context',
    prompt: 'A trumpet solo on a loud stage, the player moving. A good first step for the mic?',
    options: ['A closer mic or a bell clip, pattern aimed', 'A farther mic, for a natural blend with the band', 'Turn the trumpet channel up until it cuts through'],
    correct: 'A closer mic or a bell clip, pattern aimed',
    explain: 'On a loud stage, a closer mic or a bell clip gives more horn relative to the band and the monitors; aim the pattern’s rejection. More gain raises the band in that channel too.',
    why: {
      'A farther mic, for a natural blend with the band': 'Farther brings in more band and monitors — the opposite of what a loud stage needs.',
      'Turn the trumpet channel up until it cuts through': 'More gain raises everything that mic hears, and brings feedback closer.',
    },
  },
  superNull('tp.ctx.2', 'context', 'wedge'),
  {
    id: 'tp.ctx.studio',
    page: 'context',
    prompt: 'A trumpet overdub in a good, quiet studio. What is a fair first choice?',
    options: ['One mic a little off axis, then small moves', 'A mic right in the bell for the most detail', 'Two close mics either side, to make it stereo'],
    correct: 'One mic a little off axis, then small moves',
    explain: 'A balanced main mic first — about 30–50 cm, a little off the axis — then compare small changes at matched level. In a good room, a farther mic can add depth; check it in mono.',
    why: {
      'A mic right in the bell for the most detail': 'No mic belongs in the bell: it takes the full blast, risks overload and blocks mutes.',
      'Two close mics either side, to make it stereo': 'Stereo is not a requirement for one horn, and two close mics move the image.',
    },
  },
  {
    id: 'tp.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Where does a trumpet send its low notes?',
    options: ['Nearly all round, even behind', 'Only straight ahead, on the axis', 'Mostly down toward the floor'],
    correct: 'Nearly all round, even behind',
    explain: 'Low down the bell spreads the sound nearly all round. So even a mic behind or beside the horn hears its lows — and so does every other open mic on the stage.',
    why: {
      'Only straight ahead, on the axis': 'That is the highs. The lows spread round.',
      'Mostly down toward the floor': 'The bell points ahead; the lows spread all round it, not down.',
    },
  },
  {
    id: 'tp.two.1',
    page: 'twoMic',
    prompt: 'A close trumpet mic and a room mic about 3 m away sound thin together. Why?',
    options: ['The sound reaches them at different times', 'The room mic flips the sound’s polarity', 'The close mic is louder, so it cancels'],
    correct: 'The sound reaches them at different times',
    explain: 'The room mic hears each note later. Summed, some pitches arrive out of step and cancel — a comb of notches. Move or rebalance first, then check polarity at matched levels.',
    why: {
      'The room mic flips the sound’s polarity': 'Distance delays a sound; it does not flip its sign.',
      'The close mic is louder, so it cancels': 'A level difference changes the notches’ depth; the delay makes them.',
    },
  },
  polarityDelay('tp.two.2'),
  matchedLevels('tp.two.3'),
  {
    id: 'tp.two.4',
    page: 'twoMic',
    prompt: 'The trumpet plays in a horn section with a section mic up. How do you use its spot mic?',
    options: ['Raise it only for a stated balance; check mono', 'Make it the loudest channel, as it has the lead', 'Mute the section mic whenever the trumpet plays'],
    correct: 'Raise it only for a stated balance; check mono',
    explain: 'Hear the section mic first: the spot supports it. Bring the spot up only as the music needs, and check the blend in stereo and mono — spill and different arrival times colour it.',
    why: {
      'Make it the loudest channel, as it has the lead': 'A loud spot pulls the trumpet out of the section and brings its neighbours’ spill up too.',
      'Mute the section mic whenever the trumpet plays': 'The section mic is the picture of the group; the spot only supports it.',
    },
  },
  gainCheck('tp.prac.gain', W),
  {
    id: 'tp.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second trumpet mic?',
    options: ['The main mic works alone, the pair adds, mono holds', 'Two channels give the mixer more choices later on', 'The trumpet needs more level than one mic gives'],
    correct: 'The main mic works alone, the pair adds, mono holds',
    explain: 'A second mic — the room, or a different view — blends a perspective and a delay. If the pair loses body, move or rebalance it, check polarity — or leave it out.',
    why: {
      'Two channels give the mixer more choices later on': 'More channels add spill, a cable and a combining check. A second mic should earn its place.',
      'The trumpet needs more level than one mic gives': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'tp.mix.1',
    page: 'practice',
    prompt: 'Two mics, both 40 cm from the bell: one on its axis, one 45° off. Why do they sound different?',
    options: ['The highs beam along the axis; 45° off gets less', 'The farther mic of the two hears more of the room', 'They cannot: the same distance gives the same sound'],
    correct: 'The highs beam along the axis; 45° off gets less',
    explain: 'Same distance, different angle: the bell’s high-frequency beam favours the axis. Angle and distance are separate tone controls.',
    why: {
      'The farther mic of the two hears more of the room': 'They are the same distance. It is the angle that differs.',
      'They cannot: the same distance gives the same sound': 'Distance is only one variable. The angle to the bell’s axis changes the brightness.',
    },
  },
  nullOnPaper('tp.mix.2', 'wedge'),
  removeDelay('tp.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'tp.sym.harsh',
    observation: 'Harsh or spitty tone',
    firstChecks: 'Is the mic on the bell’s axis — or overloading? Compare a little off axis at matched level; check the mic’s headroom.',
    options: ['Compare off axis at matched level; check headroom', 'Cut the treble on the channel until it smooths out', 'Ask the player to play everything more softly'],
    correct: 'Compare off axis at matched level; check headroom',
    explain: 'On the axis the mic hears the bright beam; an overloaded capsule smears too. Move the angle first, then check the mic can take the peaks — before EQ.',
    why: {
      'Cut the treble on the channel until it smooths out': 'EQ dulls the horn and cannot undo overload. Fix the angle and the headroom first.',
      'Ask the player to play everything more softly': 'The dynamics are the music. The mic should take them.',
    },
  },
  {
    id: 'tp.sym.turn',
    observation: 'The sound vanishes as the player turns',
    firstChecks: 'Does the bell leave the stand mic’s pickup? Agree a playing zone, or try an approved bell clip.',
    options: ['Agree a playing zone, or try an approved bell clip', 'Compress the channel hard until the level stays put', 'Ask the player to stand completely still all night'],
    correct: 'Agree a playing zone, or try an approved bell clip',
    explain: 'A stand mic hears the bell from one place. Mark a comfortable zone with the player, or use a clip that rides on the bell.',
    why: {
      'Compress the channel hard until the level stays put': 'Compression evens the level but not the changing tone, and it brings up the stage.',
      'Ask the player to stand completely still all night': 'Movement is part of playing; the setup should allow for it.',
    },
  },
  {
    id: 'tp.sym.mute',
    observation: 'The muted sound is thin or strange — or the mute touches the mic',
    firstChecks: 'Is that the mute’s intended colour, or a collision? Hear it acoustically; stop and reposition safely for that mute.',
    options: ['Hear it unmiked; then reposition for that mute', 'Boost the low end until the muted sound fills out', 'Push the mic into the mute to catch more of it'],
    correct: 'Hear it unmiked; then reposition for that mute',
    explain: 'A mute is meant to change the colour. If something touches, stop: the mute reaches past the rim and a plunger brings the hand in front. Reposition for every mute the piece uses.',
    why: {
      'Boost the low end until the muted sound fills out': 'The thin colour may be exactly what the player wants. Check that first.',
      'Push the mic into the mute to catch more of it': 'No mic goes into or against a mute. Move it safely instead.',
    },
  },
  {
    id: 'tp.sym.distort',
    observation: 'Strong notes distort, though the desk meter looks fine',
    firstChecks: 'Which stage clips — the mic’s capsule, the preamp, the converter? Check the mic’s rating and pad; reset gain on the loud passage.',
    options: ['Check the mic’s rating and pad, then the gain', 'Pull the channel fader down until it sounds clean', 'Add a limiter set to a standard trumpet level'],
    correct: 'Check the mic’s rating and pad, then the gain',
    explain: 'A trumpet’s peaks can overload the mic itself before the desk shows it. Use a mic and a pad that take the level, then set gain on the strongest real passage.',
    why: {
      'Pull the channel fader down until it sounds clean': 'The fader comes after the overload — it only makes the distortion quieter.',
      'Add a limiter set to a standard trumpet level': 'There is no standard trumpet level, and a limiter cannot undo distortion before it.',
    },
  },
  brassFeedback('tp.sym.feedback', 'trumpet'),
  hollowSymptom('tp.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'tp.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic trumpet setup in the order you would do them.',
    steps: [
      { text: 'Ask the player for the real part: dynamics, movement, every mute', early: 'Start with the player and the music.' },
      { text: 'Hear the horn unamplified, from where the audience would be', early: 'Listen before choosing a mic.' },
      { text: 'Choose a mic that can take the peaks, and a stand or approved clip', early: 'Choose once you know the part and the level.' },
      { text: 'With the player stopped, place it a little off the bell’s axis, clear of everything', early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom if it is needed', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set input gain on the loudest accent AND the softest ending, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare angle and distance one change at a time, at matched levels', early: 'Compare only once the level is set safely.' },
      { text: 'Secure the stand and cable; recheck every mute and the player’s movement', early: 'Secure it last, then watch the whole part again.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before switching it, and follow your own equipment’s manual. Gain: set it with headroom for the loudest accent — the mic’s own limit counts too.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'tp.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Studio, a trumpet overdub, a good quiet room. One channel, phantom power available.',
    setups: [
      { id: 'a', label: 'Dynamic about 30–50 cm from the bell, a little off its axis', ok: true, power: 'none', feedback: 'A recommended starting point: a balanced horn — then small changes by ear.' },
      { id: 'b', label: 'Condenser about 60–120 cm in front, aimed at the bell’s edge', ok: true, power: 'phantom', feedback: 'A recommended starting point for a more open view in a good room — check it takes the peaks.' },
      { id: 'c', label: 'A mic right inside the bell, for the most detail', ok: false, power: 'none', feedback: 'No mic goes in the bell: it takes the full blast, risks overload and blocks the mutes.' },
      { id: 'd', label: 'Two close mics either side of the bell, for stereo', ok: false, power: 'phantom', feedback: 'Stereo is not a requirement for one horn; two close mics move the image as it turns.' },
      { id: 'e', label: 'A mic beside the valves, out of the bell’s way', ok: false, power: 'none', feedback: 'The valves are where the hands work — and the sound leaves the bell, not the valves.' },
    ],
    reasons: [docReason('the centre of the bell’s rim'), clearReason('the bell’s movement, the mutes and the valve hands'), DYN_POWER_REASON, { id: 'r.room', label: 'In a good room, a little distance lets the room join the sound', role: 'optional', feedback: 'A fair studio reason.' }, BRAND_REASON('trumpet'), LOUD_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a sensible starting point measured from the bell, clearance from what moves, and the power the mic needs (a dynamic needs none; a condenser needs phantom).',
  },
  {
    id: 'tp.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage: a trumpet soloist with drums and a singer, moving and turning, with a cup mute in one tune. Phantom power available.',
    setups: [
      { id: 'a', label: 'A miniature on a bell clip, aimed between centre and edge', ok: true, power: 'phantom', feedback: 'A recommended starting point that rides on the bell — check the fit, the cup mute and the cable.' },
      { id: 'b', label: 'Dynamic about 30 cm away, a little off axis, pattern aimed at the wedge', ok: true, power: 'none', feedback: 'A recommended starting point if the player keeps to an agreed zone — check the cup mute clears it.' },
      { id: 'c', label: 'Condenser 1 m in front, for a natural blend', ok: false, power: 'phantom', feedback: 'On a loud stage a metre away hears the band and the monitors more than the horn.' },
      { id: 'd', label: 'A generic clamp tightened onto the bell, then taped', ok: false, power: 'phantom', feedback: 'Never an unapproved clamp on a bell or its finish: use a clip made for it, with the player’s agreement.' },
      { id: 'e', label: 'A mic aimed straight at the singer’s mic, to share it', ok: false, power: 'none', feedback: 'That puts the bell at the singer’s ear and mic — a layout problem, not a mic choice.' },
    ],
    reasons: [docReason('the centre of the bell’s rim'), clearReason('the bell’s movement, the cup mute, the hands and the singer'), CLIP_POWER_REASON, { id: 'r.move', label: 'A clip that rides on the bell holds the sound as the player turns', role: 'optional', feedback: 'A fair live reason for a clip.' }, BRAND_REASON('trumpet'), { id: 'r.loudest', label: 'Turn it up until the trumpet is louder than the drums', role: 'wrong', feedback: 'More gain raises the stage in that mic too, and brings feedback closer.' }],
    explain: 'Two setups pass. What passes is the reasoning: a mount and a place that keep the horn steady, clearance from the mute, the hands and the singer, and the power each mic needs.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: what decides the note a trumpet plays?', options: ['How hard the lips buzz', 'The tube’s air column', 'The bell alone'], after: 'Now STEP through (or PLAY ONCE) and watch the lips, the tube and the bell.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you swing the mic from on the bell’s axis to well off to one side. What changes?', options: ['A brighter sound', 'A softer top', 'It depends on this horn'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge is on the floor in front of the player. Where will a supercardioid aimed at the bell reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What mainly sets a flugelhorn apart from a trumpet?',
    options: ['A wider, more conical tube and a larger bell', 'It has five valves where a trumpet has three', 'It is played with a reed in the mouthpiece'],
    correct: 'A wider, more conical tube and a larger bell',
    explain: 'Both are buzzed-lip brass with three valves; the flugelhorn’s tube widens more gradually and its bell is larger — part of its mellower, rounder sound.',
    why: {
      'It has five valves where a trumpet has three': 'A flugelhorn has three valves, like a trumpet.',
      'It is played with a reed in the mouthpiece': 'No brass instrument has a reed: the lips buzz.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'From which part does nearly all of a trumpet’s sound leave?',
    options: ['The bell', 'The valves', 'The tuning slide'],
    correct: 'The bell',
    explain: 'The air column’s sound leaves at the bell, which is why every starting point here is measured from the bell rim’s centre.',
    why: {
      'The valves': 'The valves route the air through extra tube; they make clicks, not the note.',
      'The tuning slide': 'The tuning slide sets the tube’s length for tuning; the sound leaves the bell.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'A trumpet’s highest frequencies leave the bell…',
    options: ['Beamed forward along its axis', 'Evenly all round the bell', 'Mostly back toward the player'],
    correct: 'Beamed forward along its axis',
    explain: 'The bell beams the highs ahead, more as the pitch rises; the lows spread round. So the angle to the axis is a tone control.',
    why: {
      'Evenly all round the bell': 'That is closer to the lows. The highs beam ahead.',
      'Mostly back toward the player': 'The player hears mostly the lows from behind the bell.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Pressing a valve on a trumpet…',
    options: ['Adds a loop of tube, lowering the note', 'Opens a hole to let the sound out sooner', 'Changes how hard the lips must buzz'],
    correct: 'Adds a loop of tube, lowering the note',
    explain: 'Each valve sends the air round an extra loop: a longer tube plays lower. The sound still leaves at the bell.',
    why: {
      'Opens a hole to let the sound out sooner': 'That is how a woodwind’s keys work. A brass valve adds tube.',
      'Changes how hard the lips must buzz': 'The lips still buzz; the valve changes the tube they buzz into.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'What must a stand mic and its cable stay clear of around a trumpeter?',
    options: ['The bell’s movement, the mutes and the hands', 'The music stand, so the player can read the part', 'The audience’s view of the bell and the player'],
    correct: 'The bell’s movement, the mutes and the hands',
    explain: 'Clearance comes first: the bell as the player turns, a mute or plunger going in and out, the valve hands — and the player’s face.',
    why: {
      'The music stand, so the player can read the part': 'Sight lines matter, but safety is about what moves.',
      'The audience’s view of the bell and the player': 'The view matters less than the player’s movement.',
    },
  },
  hearingDiag('q.6', W),
];

const floorY = TP.floorY;
const wedges: Wedge[] = [
  {
    id: 'wedge',
    label: 'the player’s floor wedge, in front, facing back at them',
    short: 'WEDGE',
    p: { x: 1500, y: floorY, z: 150 },
    lift: 150,
    faces: { x: -1, y: 0, z: 0 },
    note: 'On the floor in front, facing back at the player: below and behind a mic aimed back at the bell — tilting the mic matters as much as turning it.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
  },
  {
    id: 'swedge',
    label: 'the singer’s wedge, off to the player’s left',
    short: 'SINGER WEDGE',
    p: { x: 1700, y: floorY, z: -1400 },
    lift: 150,
    faces: { x: -1, y: 0, z: 0 },
    note: 'In front of the singer, facing back at them: off to the side of the trumpet mic.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
  },
];

export const A01_LESSON: Lesson = {
  id: 'A01',
  labId: 'winds',
  title: 'Trumpet and Flugelhorn',
  subtitle: 'A little off the bell’s axis, a more open view, or a clip on the bell',
  noun: { one: 'trumpet', many: 'trumpets' },
  model: A01_MODEL,
  micTypeIds: ['instDynCard', 'sdcCard', 'brClip'],
  zones: A01_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'The trumpet is a brass instrument: the player buzzes their lips into a cup mouthpiece, and the air column in about 1.4 m of tube, wound into a loop, sets the note. Three valves add extra loops of tube for the notes between. The flugelhorn is its close relative: the same three valves, a wider, more gradually widening tube and a larger bell — a rounder, mellower sound.', src: 'PL-2010' },
    { title: 'WHERE YOU MEET IT', text: 'Jazz and big bands, horn sections in pop, soul, funk and Latin music, orchestras and brass bands, solos and studio overdubs — and players often switch between trumpet and flugelhorn within one set. This lesson covers one horn: a studio overdub, a live solo, and a spot in a section.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'It carries melodies and bright accents and can be very loud. Ask what the part needs: a focused solo, more edge, a softer blend, a muted colour — and remember the player moves and turns with the music.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'A trumpet’s bell is about 12 cm across; a flugelhorn’s about 15 cm. A trumpet’s lowest note is around 165 Hz, but its sound reaches far higher — and its peaks close to the bell are very loud. This lab draws both horns about that size, played standing.', src: 'Y-YTR2330' },
  ],
  sound: {
    stages: [
      { title: 'The lips buzz', text: 'The player’s breath pushes the lips apart; they spring shut; the breath opens them again — a buzz, puffing air into the mouthpiece’s cup each time.' },
      { title: 'A wave runs down the tube', text: 'Each puff starts a pressure wave travelling down the tube toward the bell — drawn here as if the tube were unwound.' },
      { title: 'The tube answers', text: 'At the bell, most of the wave reflects back up the tube. The reflections build a standing wave in the air column, and its pressure locks the lips to the tube’s own rhythm: that sets the note. The valves change the tube’s length, and so the notes.', byVariant: { flugelhorn: 'At the bell, most of the wave reflects back up the tube. The reflections build a standing wave in the air column, and its pressure locks the lips to the tube’s own rhythm: that sets the note. The flugelhorn’s tube widens gradually along most of its length.' } },
      { title: 'Sound leaves the bell', text: 'Part of the wave escapes at every cycle — almost all of it at the bell. The low notes spread out nearly all round; the higher the pitch, the more it beams straight ahead along the bell’s axis.' },
    ],
    attack: 'The start of a note: the lips catching, the tongue releasing the air — the bite and the edge, strongest in the beam along the bell’s axis. A mic on the axis tends to hear more of it; close and centred, it can also hear breath.',
    body: 'The sustained tone: the standing wave in the tube, leaving through the bell — the lows all round, the highs ahead. A mic off to the side tends to hear a softer top; a farther one, more of the room. Both are tendencies, and horns vary.',
    head: { diameterMm: 0, rods: 0, label: 'the bell', strikeSrc: 'PL-2010' },
  },
  setting: {
    items: [
      { id: 'horn', label: 'the trumpet and the trumpeter', short: 'TRUMPET', note: 'The player stands, the horn level at the lips, the bell pointing out toward the audience — and wherever they turn. Ringed in amber: the instrument this lesson mics.', prov: { kind: 'illustrative', reason: 'trumpet/GEOMETRY_PROPOSAL.md §4 (drawing defaults)' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'stand', label: 'the music stand', short: 'MUSIC STAND', note: 'Beside the player. They must see the music — and the band or a conductor: a mic stand should not block that line.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SIGHT LINE', scene: 'kit' },
      { id: 'tp2', label: 'a second trumpet beside', short: 'TRUMPET 2', note: 'In a horn section another trumpet stands close by; a trumpet spot hears it too — and its bell may point at your mic.', prov: { kind: 'illustrative', reason: 'a typical section layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'tb', label: 'a trombone in the section', short: 'TROMBONE', note: 'Farther along the section, its slide reaching forward. Its sound reaches the trumpet mic too.', prov: { kind: 'illustrative', reason: 'a typical section layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'singer', label: 'a singer at a mic', short: 'SINGER', note: 'A singer close by: keep the bell from firing at their ear or into their mic. It is a layout decision — turn the horn or move the players — not a fixed distance.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'DON’T AIM HERE', scene: 'kit' },
      { id: 'kit', label: 'the drum kit', short: 'DRUMS', note: 'Behind the horns: loud, and in every open mic on the stage.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'wedge', label: 'the player’s wedge (monitor)', short: 'WEDGE', note: 'On a stage, a floor monitor in front, facing back at the player — loud, and close to a trumpet mic.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'swedge', label: 'the singer’s wedge', short: 'SINGER WEDGE', note: 'Off to one side, facing the singer.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Live, the audience already hears the acoustic trumpet — in a quiet venue it may need little help. The PA adds what the room needs.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'main', label: 'a main pair for the section', short: 'MAIN PAIR', note: 'In a recording of a section or a band, a main pair hears the whole group; a trumpet mic is a spot that supports it.', prov: { kind: 'illustrative', reason: 'a generic main pair' }, tag: 'MAIN PAIR', scene: 'studio' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'No wedges on the floor; a good room can be part of the sound — in a large one, a farther mic about 3 m away is an idea to try.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors on the floor feed the players, the PA faces the audience, and a band is loud. The player moves and turns: a closer, aimed mic — or a clip that rides on the bell — helps against the stage and feedback. Keep the bell away from a singer’s ear and mic.',
    studio: 'STUDIO: no wedges, a room that may sound good, and repeated trials when the player stops. A balanced main mic first; in a large, good room a farther mic about 3 m away can add depth — check the pair in mono.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic trumpet setup for a studio overdub and for a loud stage, describe an alternative position, and explain what would justify a second mic. With a real horn and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'room', label: 'Room or stage', kind: 'text' },
      { id: 'horn', label: 'Horn', kind: 'choice', choices: ['trumpet', 'flugelhorn'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['dynamic, cardioid', 'dynamic, supercardioid', 'condenser', 'miniature on a bell clip', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance from the bell, and the angle off its axis', kind: 'text' },
      { id: 'mutes', label: 'Mutes checked', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The bell’s height above the floor (the lips 1550 mm up, standing) — a drawing default, so no HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The trumpet’s overall length (480), flare (200), valve block and tube routing; the flugelhorn’s overall length (a museum instrument’s 34 cm), flare (280) and 10° dip — drawing defaults; the bells’ diameters (123 and 151.8 mm) are the makers’.', dims: [] },
    { text: 'The bell’s travel as the player moves, the valve hands’ box and the mutes’ reach past the rim — illustrative; the mutes are drawn as typical shapes.', dims: [] },
    { text: 'The off-axis bands of each starting point (5–20°, 25–55°, …), the close-behind-the-bell distance (10–22 cm) and the clip capsule’s 4–13 cm — drawing defaults; the clip’s fit on a flugelhorn bell is not known.', dims: [] },
    { text: 'The radiation shapes on HOW IT SOUNDS — a simplified picture of the measured trend (no flugelhorn was measured on its own); the valve loops’ lengths are the ideal ones.', dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every horn, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: one player in a typical standing hold, the tube drawn unwound, the bell’s spread of sound as a simplified shape, mic patterns and the two-mic comb as textbook shapes, and waves drawn larger so you can see them. Distances are rounded to about 5 mm and measured from the bell rim’s centre to the mic’s front. Place real mics with the player stopped, and only with their agreement.',
  copy: A01_COPY,
};
