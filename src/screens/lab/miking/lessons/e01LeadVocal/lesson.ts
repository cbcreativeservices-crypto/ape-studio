/**
 * E01 LEAD VOCAL — the lesson's pages as DATA (blueprint §7). The words come
 * from the owner's lesson (docs/labs/miking/source_text/
 * Lead-Vocal-Miking-Technique.txt, cited "L<n>" in COMMENTS only) with the
 * fixes logged in docs/labs/miking/CORRECTIONS_LOG.md (E1-01 … E1-08)
 * applied — among them "within 10 cm" (was "about 10 cm", L91), "about 10 dB
 * of headroom (peaks near −10 dBFS)" (was "10 dBFS of headroom", L38) and
 * the monitor placed "in front of the singer — behind the mic" in one
 * picture (L42 and E07 L27 are the same place).
 *
 * One singer with the SET-UP as its variant (WHERE: STUDIO / ON STAGE), on
 * the shared voice family (lessons/shared/voice, "frame V").
 * OWNER RULING 2026-10-04 — learner-facing presentation: suggested starting
 * points, never dogma; no source, brand or model in learner text; no badges.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, LOUD_REASON, clearReason, docReason, hearingCheck, hearingDiag, hollowSymptom, matchedLevels, nullOnPaper, polarityDelay, removeDelay, superNull, type Words } from '../shared/bowed/bowedItems.ts';
import { VOICE_DIMS } from '../shared/voice/voiceSpec.ts';
import { E01_MODEL } from './geometry.ts';
import { E01_ZONES } from './model.ts';
import { E01_COPY } from './copy.ts';

const W: Words = { noun: 'vocal', player: 'singer', moving: 'the head, the hands and the feet' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the voice',
    goal: 'Get to know the voice as an instrument — where its sound is made, how it is shaped, and where it leaves the singer — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Breath from the lungs sets the vocal folds buzzing; the throat, the tongue and the mouth shape the buzz into vowels and words; almost all of it leaves through the open mouth.',
  },
  sound: {
    title: 'Where the voice comes from',
    goal: 'See how breath becomes a voice and where it leaves — the mouth, and on m, n and ng the nose — and what else comes out with it: a puff of air on P and B, a hiss on S.',
    credit: { scenarios: ['lv.snd.1', 'lv.snd.2', 'lv.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'The voice leaves through the mouth, so every distance is read from the lips. The air of a P or B and the hiss of an S travel straight out along the mouth’s axis — a little angle, distance or a screen keeps them off a capsule. Tendencies, and voices vary.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Know what else reaches a vocal mic — the headphone mix, the room, the wedge and the band — what the mic and its stand keep clear of, and what to settle before any mic goes up.',
    credit: { scenarios: ['lv.set.1', 'lv.set.2', 'lv.set.3'], note: 'Answer the three checks.' },
    takeaway: 'Hear the real song first. In the studio: closed-back headphones, the loudspeakers off. On stage: the wedge goes where the pattern rejects most. Nothing touches the singer, and hearing comes first.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a vocal mic by its properties — pattern, power, the level it can take, a screen or a grille — and by the singer and the style, not by a brand or by whether the voice is male or female.',
    credit: { scenarios: ['lv.mic.1', 'lv.mic.2', 'lv.mic.3', 'lv.mic.4', 'lv.rec.1'], note: 'Answer the five checks (one reaches back to where the voice comes from).' },
    takeaway: 'A screened studio condenser for detail in a quiet room; a handheld dynamic for loud voices and the stage; a supercardioid when the wedge needs its null; a headset when the singer moves. Audition with the singer’s real performance.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — a screened condenser about 15 cm from the lips on the mouth’s axis in the studio, a handheld within about 10 cm on stage — then move the mic and see what changes.',
    credit: { scenarios: ['lv.place.1', 'lv.place.2', 'lv.place.3', 'lv.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the singer, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin, measured from the lips — not a rule. Distance, height and the angle off the mouth’s axis are separate tone controls, and clearance from the face comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the vocal mic so its pattern’s rejection faces the singer’s wedge — and know why a lead vocal in a studio and on a loud stage need different choices.',
    credit: { scenarios: ['lv.ctx.1', 'lv.ctx.2', 'lv.ctx.studio', 'lv.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A cardioid rejects most behind; a supercardioid off to each side of its rear. A wedge in front of the singer sits below a level mic — tilt and pattern both matter, real nulls are shallower than the picture, and no mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why two mics on one voice can sound thin together, how the arrival-time difference places comb notches, and why a fair comparison of two mics is made one at a time at matched distance and level.',
    credit: { scenarios: ['lv.two.1', 'lv.two.2', 'lv.two.3', 'lv.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two mics at different distances hear the voice at different times: some pitches cancel in the sum. Move or rebalance first; polarity flips the sign and never removes a delay. Compare mics one at a time, matched.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — the distance, the angle to the mouth, the screen, the singer’s movement, the wedge, the gain — before reaching for EQ or compression.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up a lead vocal mic in the right order, choose and justify a setup for a studio take and a loud stage, and say what would justify a second mic.',
    credit: { scenarios: ['lv.prac.order', 'lv.prac.gain', 'lv.prac.setup1', 'lv.prac.setup2', 'lv.prac.3', 'lv.mix.1', 'lv.mix.2', 'lv.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real singer.' },
    takeaway: 'Distance from the lips, clearance from the face, headroom for the loudest note, pattern reasoning and an accurate account of polarity versus delay pass. A brand, a “hotter” signal or a male-versus-female rule do not — and more than one setup can pass.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only: lv.snd.* L6, L34–L36 and DPA-VOICE ·
 * lv.set.* L5–L7, L82 · lv.mic.* L30–L33, L42–L43 · lv.place.* L9–L10, L35 ·
 * lv.ctx.* L40–L42 · lv.two.* L85 · lv.prac.* / lv.mix.* L37–L38, L84–L88.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'lv.snd.1',
    page: 'sound',
    prompt: 'Where does almost all of a singer’s sound leave the body?',
    options: ['Through the open mouth', 'Through the chest and the ribs', 'Through the top of the head'],
    correct: 'Through the open mouth',
    explain: 'The folds’ buzz is shaped by the throat and the mouth and leaves through the mouth — on m, n and ng partly through the nose. That is why every starting point here is measured from the lips.',
    why: {
      'Through the chest and the ribs': 'The chest vibrates as the singer sings, but the sound a mic hears leaves through the mouth.',
      'Through the top of the head': 'The head vibrates a little, but the voice a mic hears comes out of the mouth.',
    },
  },
  {
    id: 'lv.snd.2',
    page: 'sound',
    prompt: 'A singer sings a P. What reaches a mic straight in front of the lips, besides the sound?',
    options: ['A puff of air along the mouth’s axis', 'Nothing else: a P is only a sound', 'A puff of air sideways, off the axis'],
    correct: 'A puff of air along the mouth’s axis',
    explain: 'P and B release a burst of air straight out of the lips. A capsule in its path hears a thump — a pop. A screen, a small angle or a little more distance keeps it off the capsule.',
    why: {
      'Nothing else: a P is only a sound': 'A P is made by releasing held air: the air comes out with the sound.',
      'A puff of air sideways, off the axis': 'The puff goes straight ahead, along the mouth’s axis — off the axis there is much less of it.',
    },
  },
  {
    id: 'lv.snd.3',
    page: 'sound',
    prompt: 'Why can moving the mic a little below the mouth line soften harsh S sounds?',
    options: ['The hiss of an S travels forward along the axis', 'An S sound comes out of the nose, not the mouth', 'A lower mic turns the whole voice down evenly'],
    correct: 'The hiss of an S travels forward along the axis',
    explain: 'An S or T sends a narrow hiss straight ahead. Out of that straight line, the mic hears less of it while the vowels still reach it — a tendency to check by ear.',
    why: {
      'An S sound comes out of the nose, not the mouth': 'S is made with the tongue and the teeth: it leaves through the mouth, ahead.',
      'A lower mic turns the whole voice down evenly': 'A small move changes the balance — less hiss, much the same vowels — not just the level.',
    },
  },
  hearingCheck('lv.set.1', W),
  {
    id: 'lv.set.2',
    page: 'setting',
    prompt: 'In the studio, why closed-back headphones with the loudspeakers off?',
    options: ['So the mic hears the voice, not the track', 'So the singer sings louder into the mic', 'Because open-back headphones are too heavy'],
    correct: 'So the mic hears the voice, not the track',
    explain: 'A close vocal mic hears whatever plays near it: loudspeakers, or a loud mix leaking from open-back phones. Closed-back phones at a comfortable level keep the track out of the vocal.',
    why: {
      'So the singer sings louder into the mic': 'The reason is spill, not effort — and a singer forced to push changes the performance.',
      'Because open-back headphones are too heavy': 'Weight is not the point: open-back phones leak the mix into the mic.',
    },
  },
  {
    id: 'lv.set.3',
    page: 'setting',
    prompt: 'Before choosing a mic, what do you ask the singer for?',
    options: ['The real song: its quiet and loudest lines', 'Whether they are a male or a female voice', 'A single held note, to set the input level'],
    correct: 'The real song: its quiet and loudest lines',
    explain: 'Hear the actual delivery: the quietest close phrase, the strongest note, a line full of consonants, a breathy line, the loudest chorus. One held note says nothing about the peaks or the pops.',
    why: {
      'Whether they are a male or a female voice': 'Gender alone does not choose a mic: the individual voice, the style and the room do.',
      'A single held note, to set the input level': 'A polite held note hides the peaks and the consonants. Use the real song.',
    },
  },
  {
    id: 'lv.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Which way does the puff of air from a P or B go?',
    options: ['Straight out along the mouth’s axis', 'Up and out toward the singer’s nose', 'Out to all sides of the mouth evenly'],
    correct: 'Straight out along the mouth’s axis',
    explain: 'The puff goes straight ahead out of the lips. That is why a screen sits in front of a studio vocal mic, and why a small angle or a little distance helps.',
    why: {
      'Up and out toward the singer’s nose': 'The nose carries m, n and ng — the puff of a P goes straight out of the lips.',
      'Out to all sides of the mouth evenly': 'Sound spreads round the front; the air of a P goes straight ahead.',
    },
  },
  {
    id: 'lv.mic.1',
    page: 'microphone',
    prompt: 'Your only spare input has no phantom power. Which of this page’s mics will work?',
    options: ['The handheld dynamic: it needs no power', 'The studio condenser, with a short cable', 'The headset, since its capsule is so tiny'],
    correct: 'The handheld dynamic: it needs no power',
    explain: 'A dynamic makes its own signal. The studio condenser needs phantom power; the headset’s capsule needs phantom power through its adapter, or a wireless pack.',
    why: {
      'The studio condenser, with a short cable': 'Cable length does not power a condenser.',
      'The headset, since its capsule is so tiny': 'Size does not power a condenser: the headset needs phantom power or a pack.',
    },
  },
  {
    id: 'lv.mic.2',
    page: 'microphone',
    prompt: 'What does the screen in front of the studio condenser do?',
    options: ['Breaks up puffs of air before the capsule', 'Turns the mic’s pattern into an omni', 'Stops the sound of the room reaching the mic'],
    correct: 'Breaks up puffs of air before the capsule',
    explain: 'The screen breaks up the air of P and B before it reaches the capsule. Keep it at least 10 cm from the mic, angled a little off parallel.',
    why: {
      'Turns the mic’s pattern into an omni': 'A screen is a mesh in the air path: it does not change the pattern.',
      'Stops the sound of the room reaching the mic': 'Sound passes through the screen easily; only the air of a P or B is slowed.',
    },
  },
  {
    id: 'lv.mic.3',
    page: 'microphone',
    prompt: 'A singer belts hard rock and the studio condenser sounds harsh. A fair idea to try?',
    options: ['Audition a dynamic, a type made for loud voices', 'Turn the condenser to face away from the singer', 'Add a second condenser to smooth the sound'],
    correct: 'Audition a dynamic, a type made for loud voices',
    explain: 'A dynamic is often a good choice for aggressive rock, metal or rap, or a voice whose highs turn hard. Audition it with the real performance, at matched level.',
    why: {
      'Turn the condenser to face away from the singer': 'A mic facing away hears the room, not a better voice.',
      'Add a second condenser to smooth the sound': 'A second mic adds spill and a combining check; it does not smooth the first.',
    },
  },
  {
    id: 'lv.mic.4',
    page: 'microphone',
    prompt: 'Why might a supercardioid suit a singer with a wedge in front?',
    options: ['Its nulls sit off its rear, where a wedge can go', 'It picks up less of the singer’s own voice up close', 'It makes a floor wedge unnecessary on a stage'],
    correct: 'Its nulls sit off its rear, where a wedge can go',
    explain: 'A supercardioid rejects most about 125° off its front, off to each side of its rear. A wedge on the floor in front of the singer often sits near there — check the actual pattern.',
    why: {
      'It picks up less of the singer’s own voice up close': 'Aimed at the mouth, it hears the voice fully; it rejects the sides and the rear.',
      'It makes a floor wedge unnecessary on a stage': 'The pattern does not replace the singer’s monitoring; it helps the wedge and the mic coexist.',
    },
  },
  {
    id: 'lv.place.1',
    page: 'placement',
    prompt: 'A starting point says “10–20 cm”. What is that measured from?',
    options: ['The lips, to the front of the mic', 'The singer’s chin, to the mic’s grille', 'The pop screen, to the singer’s nose'],
    correct: 'The lips, to the front of the mic',
    explain: 'The voice leaves at the mouth, so these distances start at the lips and end at the mic’s front. The same number from the chin or from the screen would put the mic somewhere else.',
    why: {
      'The singer’s chin, to the mic’s grille': 'The chin is not where the sound leaves. Measure from the lips.',
      'The pop screen, to the singer’s nose': 'The screen sits between: the distance is lips to mic.',
    },
  },
  {
    id: 'lv.place.2',
    page: 'placement',
    prompt: 'You move a screened mic from 25 cm to 15 cm, on the axis. What tends to change?',
    options: ['More low end and less of the room', 'More of the room, and less low end', 'Only the level, not the tone at all'],
    correct: 'More low end and less of the room',
    explain: 'Closer, a directional mic lifts the lows (the proximity effect) and hears the voice louder against the room. Farther brings more room and a steadier level.',
    why: {
      'More of the room, and less low end': 'That is what moving farther away tends to do.',
      'Only the level, not the tone at all': 'Distance changes the balance — the lows and the room — not just the level.',
    },
  },
  {
    id: 'lv.place.3',
    page: 'placement',
    prompt: 'Can the screened condenser start 10 cm from the lips?',
    options: ['No — its screen, 10 cm ahead, would reach the face', 'Yes — the screen can rest against the singer’s lips', 'Yes — as long as the boom reaches far enough'],
    correct: 'No — its screen, 10 cm ahead, would reach the face',
    explain: 'The screen sits at least 10 cm in front of the mic, so the mic itself starts about 15 cm out. Closer than that, use a mic with its own windscreen — the handheld’s ball grille is one.',
    why: {
      'Yes — the screen can rest against the singer’s lips': 'Nothing touches the face — and a screen on the lips would block the voice it is there to protect.',
      'Yes — as long as the boom reaches far enough': 'A boom reaches easily; it is the screen in front that runs out of room.',
    },
  },
  {
    id: 'lv.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What must a vocal mic, its stand and its cable stay clear of?',
    options: ['The singer’s face, hands and feet as they move', 'The music stand, so the lyrics can be read', 'The front of the singer, for the audience’s view'],
    correct: 'The singer’s face, hands and feet as they move',
    explain: 'Clearance comes first: nothing touches the face as the head moves, the hands have room, and the stand’s base and the cable stay clear of the feet.',
    why: {
      'The music stand, so the lyrics can be read': 'Sight lines matter, but the safety question is the singer’s body as it moves.',
      'The front of the singer, for the audience’s view': 'In front of the singer is where a vocal mic goes. What must stay clear is the body.',
    },
  },
  {
    id: 'lv.ctx.1',
    page: 'context',
    prompt: 'A singer on a loud stage, a wedge in front. A good first step for the vocal mic?',
    options: ['A close handheld, its null aimed at the wedge', 'A condenser at 30 cm for a natural sound', 'Turn the vocal channel up until it cuts through'],
    correct: 'A close handheld, its null aimed at the wedge',
    explain: 'Close, the voice stays ahead of the band and the monitors; aim the pattern’s rejection at the wedge. More gain raises the stage in that mic too, and brings feedback closer.',
    why: {
      'A condenser at 30 cm for a natural sound': 'At 30 cm on a loud stage the mic hears the band and the wedge almost as much as the voice.',
      'Turn the vocal channel up until it cuts through': 'More gain raises everything the mic hears, and brings feedback closer.',
    },
  },
  superNull('lv.ctx.2', 'context', 'wedge'),
  {
    id: 'lv.ctx.studio',
    page: 'context',
    prompt: 'A lead vocal overdub in a quiet studio. What is a fair first choice?',
    options: ['A screened condenser about 15 cm from the lips', 'A handheld, the singer cupping the grille close', 'Two mics side by side, summed together'],
    correct: 'A screened condenser about 15 cm from the lips',
    explain: 'A screened condenser on the mouth’s axis, about 10–20 cm out, is a place to begin — then compare small changes at matched level, the singer performing the real song.',
    why: {
      'A handheld, the singer cupping the grille close': 'Cupping the grille changes the pattern and colours the voice.',
      'Two mics side by side, summed together': 'Two mics summed on one voice comb-filter; compare them one at a time instead.',
    },
  },
  {
    id: 'lv.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Where does the hiss of an S mostly go?',
    options: ['Forward, along the mouth’s axis', 'Up and out through the nose', 'Down and toward the singer’s chest'],
    correct: 'Forward, along the mouth’s axis',
    explain: 'The hiss travels straight ahead. A mic on the axis hears the most of it — a reason to try a little angle or a little lower.',
    why: {
      'Up and out through the nose': 'S is shaped by the tongue and teeth: it leaves through the mouth.',
      'Down and toward the singer’s chest': 'It goes ahead along the axis, not down.',
    },
  },
  {
    id: 'lv.two.1',
    page: 'twoMic',
    prompt: 'Two vocal mics, one 15 cm and one 25 cm from the lips, sound thin together. Why?',
    options: ['The voice reaches them at different times', 'The farther mic reverses the polarity of the voice', 'The closer mic is louder, so it cancels'],
    correct: 'The voice reaches them at different times',
    explain: 'The farther mic hears each sound later. Summed, some pitches arrive out of step and cancel — a comb of notches. Move or rebalance first, then check polarity at matched levels.',
    why: {
      'The farther mic reverses the polarity of the voice': 'Distance delays a sound; it does not flip its sign.',
      'The closer mic is louder, so it cancels': 'A level difference changes the notches’ depth; the delay makes them.',
    },
  },
  polarityDelay('lv.two.2'),
  matchedLevels('lv.two.3'),
  {
    id: 'lv.two.4',
    page: 'twoMic',
    prompt: 'You want to compare two vocal mics fairly. How?',
    options: ['Matched distance and level, then one at a time', 'Turn both on together and keep the louder of them', 'Choose whichever mic has the larger capsule'],
    correct: 'Matched distance and level, then one at a time',
    explain: 'Same singer, same distance, same level — and listen to each alone. A louder mic sounds “better” at first; a summed pair adds a comb of its own.',
    why: {
      'Turn both on together and keep the louder of them': 'Louder is not better: match the levels first, and do not sum them.',
      'Choose whichever mic has the larger capsule': 'Capsule size is one property; the singer and the room decide.',
    },
  },
  {
    id: 'lv.prac.gain',
    page: 'practice',
    prompt: 'The verses sit well below the overload light, but the singer’s loudest chorus lights it. What do you do?',
    options: ['Lower the input gain, then re-check the chorus', 'Pull the channel fader down until it sounds clean', 'Ask the singer to sing the chorus more softly'],
    correct: 'Lower the input gain, then re-check the chorus',
    explain: 'Set input gain on the loudest real passage, with about 10 dB of headroom (peaks near −10 dBFS) in a digital recording. The fader comes after the overload; the first full take is often louder than the soundcheck.',
    why: {
      'Pull the channel fader down until it sounds clean': 'The overload happens at the input, before the fader. A lower fader only makes the clipped sound quieter.',
      'Ask the singer to sing the chorus more softly': 'The singer’s healthy technique is the performance. Set the gain for it — do not ask the singer to hold back.',
    },
  },
  {
    id: 'lv.prac.3',
    page: 'practice',
    prompt: 'What would justify a second vocal mic?',
    options: ['The first works alone, the pair adds, mono holds', 'Two channels give the mixer more to choose from', 'The voice needs more level than one mic gives'],
    correct: 'The first works alone, the pair adds, mono holds',
    explain: 'A second mic — a different perspective, or a different mic to blend — adds a delay and the room. If the pair loses body, move or rebalance, check polarity — or leave it out.',
    why: {
      'Two channels give the mixer more to choose from': 'More channels add spill and a combining check. A second mic should earn its place.',
      'The voice needs more level than one mic gives': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'lv.mix.1',
    page: 'practice',
    prompt: 'Both 15 cm from the lips: one mic on the mouth’s axis, one 30° below it. Why might the S sounds differ?',
    options: ['The hiss travels along the axis; below it, less', 'The lower mic is closer to the singer’s chest', 'They cannot: the same distance sounds the same'],
    correct: 'The hiss travels along the axis; below it, less',
    explain: 'Same distance, different angle: the S hiss and the air favour the mouth’s axis. Angle and distance are separate tone controls.',
    why: {
      'The lower mic is closer to the singer’s chest': 'Both are 15 cm from the lips; the chest is not where the hiss leaves.',
      'They cannot: the same distance sounds the same': 'Distance is one variable; the angle off the mouth’s axis changes the hiss and the air.',
    },
  },
  nullOnPaper('lv.mix.2', 'wedge'),
  removeDelay('lv.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'lv.sym.pops',
    observation: 'Pops on every P and B',
    firstChecks: 'Is the capsule in the air path, too close? A screen, a small angle or a little more distance — and the singer’s consonant technique.',
    options: ['A screen, a small angle or a little more distance', 'Cut the low end on the channel until it stops', 'Ask the singer to change the words with P in them'],
    correct: 'A screen, a small angle or a little more distance',
    explain: 'The puff of a P goes straight out of the lips. Break it up with a screen, move the capsule off the axis a little, or back off — before a severe low cut that thins the voice.',
    why: {
      'Cut the low end on the channel until it stops': 'A deep cut removes the voice’s weight and still lets the capsule overload. Fix the air path first.',
      'Ask the singer to change the words with P in them': 'The lyric is the song. Change the mic’s place, not the words.',
    },
  },
  {
    id: 'lv.sym.boomy',
    observation: 'The voice sounds boomy and heavy',
    firstChecks: 'Proximity effect from a directional mic too close, or a room corner? Move back a little, change the angle or the pattern.',
    options: ['Move back a little, or change the angle or pattern', 'Boost the treble on the channel until it clears', 'Move the mic right up to the singer’s lips'],
    correct: 'Move back a little, or change the angle or pattern',
    explain: 'Close to a directional mic the lows rise (the proximity effect). A little more distance, or an omni pattern, eases it; check the room too.',
    why: {
      'Boost the treble on the channel until it clears': 'EQ on top of boom makes the voice harsh. Fix the distance first.',
      'Move the mic right up to the singer’s lips': 'Closer makes the proximity effect stronger, not weaker.',
    },
  },
  {
    id: 'lv.sym.sibilance',
    observation: 'S sounds are harsh',
    firstChecks: 'Is the mic dead on the mouth’s axis? Try it a little lower or angled; audition another capsule.',
    options: ['Lower or angle the mic a little, then compare', 'Ask the singer to soften the S sounds of the song', 'Turn the treble up to brighten the voice'],
    correct: 'Lower or angle the mic a little, then compare',
    explain: 'The hiss of an S travels along the axis. Out of that line, the mic hears less of it; compare at matched level, and audition another mic if it persists.',
    why: {
      'Ask the singer to soften the S sounds of the song': 'Keep the singer’s natural diction; move the mic instead.',
      'Turn the treble up to brighten the voice': 'More treble makes harsh S sounds worse.',
    },
  },
  {
    id: 'lv.sym.level',
    observation: 'The level changes on every phrase',
    firstChecks: 'Is the singer changing distance or angle? Rehearse a working zone; mark a place to stand.',
    options: ['Rehearse a working zone; mark a place to stand', 'Compress it hard until the level stops moving around', 'Ask the singer to stand completely still'],
    correct: 'Rehearse a working zone; mark a place to stand',
    explain: 'Small distance changes are big level changes close up. A rehearsed working zone and a mark on the floor keep it steady — compression cannot fix a moving tone.',
    why: {
      'Compress it hard until the level stops moving around': 'Compression evens the level but not the changing tone and room — and it brings the room up.',
      'Ask the singer to stand completely still': 'Movement is part of singing; agree a zone instead.',
    },
  },
  {
    id: 'lv.sym.feedback',
    observation: 'Feedback on stage, or the wedge rings',
    firstChecks: 'Is the wedge in a sensitive direction of the pattern? Lower the level at once, then use the mic’s actual null and change the geometry.',
    options: ['Lower the level, then put the wedge in the null', 'Turn the vocal up so it covers the ringing', 'Cup the grille so the sound stays inside it'],
    correct: 'Lower the level, then put the wedge in the null',
    explain: 'Feedback is a sound-system condition: lower that send first, then aim the pattern’s rejection at the wedge and reduce open mics. Never provoke feedback on purpose.',
    why: {
      'Turn the vocal up so it covers the ringing': 'More gain feeds the loop. Lower the level first.',
      'Cup the grille so the sound stays inside it': 'Cupping changes the pattern and usually makes feedback more likely.',
    },
  },
  hollowSymptom('lv.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'lv.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a studio lead-vocal setup in the order you would do them.',
    steps: [
      { text: 'Hear the singer’s real song: quiet lines, loud notes, consonants', early: 'Start with the singer and the song.' },
      { text: 'Quiet the room; closed-back headphones on, loudspeakers off', early: 'Settle the room and the monitoring before the mic.' },
      { text: 'Choose a mic for this voice and style, on a sturdy stand', early: 'Choose once you have heard the voice.' },
      { text: 'Place it about 10–20 cm from the lips, a screen in front, clear of the face', early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs; then switch phantom on if the mic needs it', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set input gain on the loudest real passage, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare distance and angle one change at a time, at matched levels', early: 'Compare only once the level is set safely.' },
      { text: 'Check the first full take — singers often sing harder than at the soundcheck', early: 'Check the take last, once the setup is in place.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before switching it, and follow your own equipment’s manual. Gain: set it on the loudest real passage with headroom — about 10 dB (peaks near −10 dBFS) in a digital recording.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'lv.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Studio, a soul ballad: breathy verses, a big chorus. A quiet room, phantom power available, the singer on headphones.',
    setups: [
      { id: 'a', label: 'Condenser about 15 cm from the lips, on the axis, a screen in front', ok: true, power: 'phantom', feedback: 'A recommended starting point: clear and direct — check the chorus for headroom and pops.' },
      { id: 'b', label: 'Condenser about 25 cm out, on the axis, the room joining in', ok: true, power: 'phantom', feedback: 'A recommended starting point for a more blended sound in a good room — check breath and level changes.' },
      { id: 'c', label: 'A condenser 2 cm from the lips, no screen', ok: false, power: 'phantom', feedback: 'Right in the air path: pops, heavy proximity and breath. Give it distance and a screen.' },
      { id: 'd', label: 'Monitor on loudspeakers so the singer feels the track', ok: false, power: 'phantom', feedback: 'Loudspeakers leak the track into the vocal mic. Closed-back headphones, speakers off.' },
      { id: 'e', label: 'A mic aimed at the chest, because the voice is low', ok: false, power: 'none', feedback: 'The voice leaves through the mouth. Aim at the mouth; try the chest only as a deliberate idea.' },
    ],
    reasons: [docReason('the lips'), clearReason('the singer’s face, hands and feet'), { id: 'r.power', label: 'The channel gives the condenser the phantom power it needs', role: 'required', feedback: 'Say how the mic is powered: a condenser needs phantom power.' }, { id: 'r.screen', label: 'A screen at least 10 cm from the mic breaks up the air of P and B', role: 'optional', feedback: 'A fair studio reason.' }, BRAND_REASON('voice'), LOUD_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point measured from the lips, clearance from the singer, the power the mic needs, and a way to keep the air off the capsule.',
  },
  {
    id: 'lv.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud rock stage: the singer moves, a floor wedge in front, drums and amps close by. Phantom power available.',
    setups: [
      { id: 'a', label: 'A handheld dynamic within about 10 cm, its rejection toward the wedge', ok: true, power: 'none', feedback: 'A recommended starting point: close enough to stay ahead of the band — check the wedge against the actual pattern.' },
      { id: 'b', label: 'A supercardioid handheld, the wedge a little to one side of its rear', ok: true, power: 'none', feedback: 'A recommended starting point if the wedge can sit near its null — check the pattern.' },
      { id: 'c', label: 'A studio condenser 30 cm away for a natural sound', ok: false, power: 'phantom', feedback: 'At 30 cm on a loud stage it hears the band and the wedge almost as much as the voice.' },
      { id: 'd', label: 'A handheld the singer cups to keep the sound in', ok: false, power: 'none', feedback: 'Cupping changes the pattern and brings feedback closer. Keep the grille open.' },
      { id: 'e', label: 'An omni handheld so the singer can move anywhere', ok: false, power: 'none', feedback: 'An omni rejects nothing: on a loud stage it hears the wedge and the band as much as the voice.' },
    ],
    reasons: [docReason('the lips'), clearReason('the singer’s face, hands and feet, and the cable path'), { id: 'r.dyn', label: 'A dynamic needs no phantom power and takes a loud voice close up', role: 'optional', feedback: 'A fair live reason.' }, { id: 'r.null', label: 'The pattern’s rejection faces the wedge', role: 'required', feedback: 'Say where the wedge sits against the pattern.' }, BRAND_REASON('voice'), { id: 'r.loudest', label: 'Turn it up until the voice is louder than the drums', role: 'wrong', feedback: 'More gain raises the stage in that mic too, and brings feedback closer.' }],
    explain: 'Two setups pass. What passes is the reasoning: a close start measured from the lips, the wedge placed against the actual pattern, clearance for a moving singer, and no cupping.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: where is the raw sound of a voice made?', options: ['In the chest', 'At the vocal folds in the throat', 'At the lips'], after: 'Now STEP through (or PLAY ONCE) and watch the breath, the folds, the throat and the mouth.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move a screened mic from 25 cm to 15 cm on the mouth’s axis. What changes?', options: ['More low end', 'More room', 'It depends on this voice'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge is on the floor in front of the singer. Where will a supercardioid aimed at the mouth reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'Where in the body is the raw sound of a voice made?',
    options: ['At the vocal folds, low in the throat', 'In the chest, just behind the breastbone', 'At the lips, as the mouth opens'],
    correct: 'At the vocal folds, low in the throat',
    explain: 'Breath from the lungs sets the vocal folds buzzing in the voice box; the throat and the mouth shape that buzz, and it leaves through the mouth.',
    why: {
      'In the chest, just behind the breastbone': 'The chest supplies the breath and vibrates a little; the buzz is made at the folds.',
      'At the lips, as the mouth opens': 'The lips shape consonants and let the sound out; the raw buzz is made lower down.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What does a singer’s gender tell you about which mic to use?',
    options: ['Nothing on its own: hear the actual voice', 'Use a dynamic for low voices, a condenser for high', 'Use a brighter mic for a lower voice'],
    correct: 'Nothing on its own: hear the actual voice',
    explain: 'The individual singer, the style, the mic, the distance and the room decide. Audition with the real performance.',
    why: {
      'Use a dynamic for low voices, a condenser for high': 'There is no male-versus-female or low-versus-high mic rule: hear the voice.',
      'Use a brighter mic for a lower voice': 'Brightness is a matter for the individual voice, judged by ear.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'A P or B sends a puff of air…',
    options: ['Straight out along the mouth’s axis', 'Upward and out toward the singer’s nose', 'Out to the sides of the mouth'],
    correct: 'Straight out along the mouth’s axis',
    explain: 'The puff goes straight ahead out of the lips — a screen, a small angle or more distance keeps it off a capsule.',
    why: {
      'Upward and out toward the singer’s nose': 'The nose carries m, n and ng. The puff of a P goes straight out.',
      'Out to the sides of the mouth': 'Sound spreads round the front; the air of a P goes straight ahead.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Why do many vocal mics sit a little off the straight line of the mouth?',
    options: ['To keep the air and the S hiss off the capsule', 'Because the voice is much louder off to one side', 'To hear more of the chest and the throat'],
    correct: 'To keep the air and the S hiss off the capsule',
    explain: 'The puff of a P and the hiss of an S travel along the mouth’s axis. A little off it, the mic hears less of them while the voice still reaches it.',
    why: {
      'Because the voice is much louder off to one side': 'The voice is strongest ahead; a small angle trades a little level for fewer pops and less hiss.',
      'To hear more of the chest and the throat': 'The voice a mic hears leaves through the mouth, not the chest.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'What must a vocal mic, its screen and its stand keep clear of?',
    options: ['The singer’s face, hands and feet as they move', 'The lyric sheet, so the singer can read it', 'The audience’s view of the singer’s face'],
    correct: 'The singer’s face, hands and feet as they move',
    explain: 'Clearance comes first: nothing touches the face as the head moves, the hands have room, and the stand’s base and cable stay clear of the feet.',
    why: {
      'The lyric sheet, so the singer can read it': 'Sight lines matter, but safety is about the singer’s body.',
      'The audience’s view of the singer’s face': 'The view matters less than the singer’s movement and safety.',
    },
  },
  hearingDiag('q.6', W),
];

const wedges: Wedge[] = [
  {
    id: 'wedge',
    label: 'the singer’s floor wedge, in front, facing back at them',
    short: 'WEDGE',
    p: { x: 1000, y: VOICE_DIMS.lipStanding.mm, z: 0 },
    lift: 250,
    faces: { x: -1, y: 0, z: 0 },
    note: 'On the floor about a metre in front of the singer, facing back at them: behind a mic aimed at the mouth, and well below it — so the pattern and the tilt both decide how much it hears.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout: in front of the singer (S-VOC-TIPS) = behind the mic (S-SM58-UG); its distance and size are drawing defaults' },
  },
];

export const E01_LESSON: Lesson = {
  id: 'E01',
  labId: 'ensembles',
  title: 'Lead Vocal',
  subtitle: 'Any voice, any style: about 15 cm in the studio, within 10 cm on stage — measured from the lips',
  noun: { one: 'lead vocal', many: 'lead vocals', subject: 'singer', person: true },
  model: E01_MODEL,
  micTypeIds: ['vocLdc', 'vocDynCard', 'vocDynSuper', 'vocLdcOpen', 'vocHeadset'],
  zones: E01_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'The voice is an instrument you cannot see: breath from the lungs sets two small vocal folds in the throat buzzing, and the throat, the tongue and the mouth shape that buzz into vowels and words. Almost all of it leaves through the open mouth — on m, n and ng partly through the nose.', src: 'LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'The lead vocal of every style — pop, rock, soul, jazz, classical, rap — in the studio and on stage. Intimate, breathy, belted, shouted or whispered: each asks something different of the mic.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'It carries the words and the melody, often the most important sound in the mix. Its range is huge: from a whisper to a belt that can top 135 dB right at the lips — and the singer moves.', src: 'DPA-VOICE' },
    { title: 'EVERY VOICE IS DIFFERENT', text: 'A low male voice, a high female voice, a mixed voice or falsetto each have their own balance and level — but none of that is a rule for choosing a mic. Hear the singer’s actual delivery first.', src: 'LESSON' },
  ],
  sound: {
    stages: [
      { title: 'Breath from the lungs', text: 'The lungs push air up the windpipe — the power behind every note, soft or loud.' },
      { title: 'The vocal folds buzz', text: 'In the voice box, low in the throat, two small folds come together and the breath sets them buzzing — many times a second for a sung note. That buzz is the raw sound.' },
      { title: 'The throat and mouth shape it', text: 'The throat, the tongue, the lips and the open mouth shape the buzz into vowels and words; the tongue, the teeth and the lips add the consonants.' },
      { title: 'It leaves the mouth', text: 'Almost all of it leaves through the open mouth — on m, n and ng partly through the nose. That is where every starting point here is measured from: the lips.' },
    ],
    attack: 'P, B, T, K, S and F are short and sharp. A P or B releases a puff of air straight out of the lips; an S or T sends a narrow hiss forward. A mic in their path hears pops and harsh S sounds — a little angle, a little distance or a screen keeps them off the capsule.',
    body: 'The vowels carry the melody and most of the level — from a whisper to a belt. Close to a directional mic they gain low end (the proximity effect); farther away, more of the room joins in. Tendencies, to check by ear.',
    head: { diameterMm: 0, rods: 0, label: 'the mouth', strikeSrc: 'DPA-VOICE' },
  },
  setting: {
    items: [
      { id: 'singer', label: 'the singer', short: 'SINGER', note: 'Standing, the mouth at the lip point every distance is read from. The head moves as they sing.', prov: { kind: 'illustrative', reason: 'the shared figure (drawing default)' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'space', label: 'the singer’s face, hands and feet', short: 'THE SINGER’S SPACE', note: 'Nothing touches the face as the head moves; the hands have room; the stand’s base and the cable stay clear of the feet.', prov: { kind: 'illustrative', reason: 'the shared figure (drawing default)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'phones', label: 'the headphone mix', short: 'HEADPHONES', note: 'Open-back phones, or a loud mix, leak the track into a close vocal mic. Closed-back, at a comfortable level — and never set down on or beside a live mic.', prov: { kind: 'illustrative', reason: 'the lesson L7, L78–L82' }, tag: 'SPILL', scene: 'studio' },
      { id: 'room', label: 'the room and the music stand', short: 'THE ROOM', note: 'Hard walls, and a music stand just below the mouth, reflect the voice back into the mic. Tame the strongest reflections; check the stand’s reflection.', prov: { kind: 'illustrative', reason: 'the lesson L7, L10' }, tag: 'ROOM SOUND', scene: 'studio' },
      { id: 'wedge', label: 'the singer’s floor wedge', short: 'WEDGE', note: 'In front of the singer, facing back at them: behind a mic aimed at the mouth. Straight behind suits a cardioid; a supercardioid’s rejection sits a little to one side of its rear.', prov: { kind: 'illustrative', reason: 'S-VOC-TIPS, S-SM58-UG, S-LIVE' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'band', label: 'the band and the PA', short: 'BAND · PA', note: 'Drums, amps and the PA all reach a vocal mic. A close mic keeps the voice ahead of them; a pattern aimed well keeps more of them out.', prov: { kind: 'illustrative', reason: 'a typical stage' }, tag: 'SPILL', scene: 'stage' },
    ],
    stage: 'LIVE: a handheld vocal mic within about 10 cm, the wedge where the pattern rejects most, the band and the PA loud. Never cup the grille, and never raise the level to find feedback.',
    studio: 'STUDIO: a quiet room, closed-back headphones, the loudspeakers off, a screened condenser about 10–30 cm from the lips. Repeated takes are practical; the room can be part of the sound.',
  },
  diagnostic,
  practice: {
    task: 'Choose a lead-vocal setup for a studio take and for a loud stage, describe an alternative position, and explain what would justify a second mic. With a real singer and their agreement, you can record what you tried below.',
    fields: [
      { id: 'room', label: 'Room or stage', kind: 'text' },
      { id: 'voice', label: 'The voice and the style (in your words)', kind: 'text' },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['studio condenser with a screen', 'handheld dynamic, cardioid', 'handheld dynamic, supercardioid', 'headset', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance from the lips, and the angle off the mouth’s axis', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The lip height above the floor (1550 mm standing) and the singer’s whole figure — drawing defaults (the head, the shoulders and the stance are the shared adult figure’s), so no HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The head’s size and shape (the IEC / ANSI head-and-torso numbers were not read): the shared figure’s profile head, its mouth placed on the lip point; the nose, chin, ear and eye level read off that drawing.', dims: [] },
    { text: 'The handheld vocal dynamic’s size (16 cm, a 5 cm ball grille), the pop screen’s hoop (15 cm) and its 10° tilt, the headset’s capsule place and boom reach — drawing defaults; the screen’s 10 cm gap is the maker’s.', dims: [] },
    { text: 'The angles of “slightly lower” (20–40°), “slightly off to one side” (10–30°), “just above nose height” (6–20°) and “about eye level” (10–25°), and the ± 5 cm band round “around 12 inches” — the lab’s drawing.', dims: [] },
    { text: 'The puff of air and the S hiss on the MEET IT page: their angle and reach are drawn as illustrative shapes; no source gives them.', dims: [] },
    { text: 'The wedge’s distance (1 m) and height on the stage — a drawing default; that it sits in front of the singer, behind the mic, is sourced.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every singer, song and room is different: move the mic, experiment, and trust your ears. The lab is silent and draws a simplified picture: one singer in a typical standing pose, the airway as a simplified cut, the puff of air and the S hiss as shapes, mic patterns and the two-mic comb as textbook shapes. Distances are rounded to about 5 mm and measured from the lips to the mic’s front. Move a real mic near someone’s face only with their agreement.',
  copy: E01_COPY,
};
