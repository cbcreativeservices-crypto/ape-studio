/**
 * M07a CONCERT BASS DRUM — the lesson's pages as DATA (blueprint §7). Words
 * from the owner's lesson (docs/labs/miking/source_text/Concert-Bass-Drum-
 * Miking-Technique-Research.txt, "L<n>" in COMMENTS only) with the fixes in
 * CORRECTIONS_LOG.md (B-xx) applied. OWNER RULING 2026-10-04: starting
 * points; no source, brand or model in learner text; no badges; SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, PageContent, PageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, cardioidNull, CLEAR_REASON, contactSymptom, distortionSymptom, firstNotch, gainCheck, hearingCheck, louderIsNotBetter, monoSymptom, moveRemovesDelay, polarityKeepsDelay, POWER_REASON, quickHearing, setupOrder, type Words } from '../shared/concert/commonItems.ts';
import { CBD_MODEL } from './geometry.ts';
import { CBD_ZONES, FLOOR_Y } from './model.ts';
import { CBD_COPY } from './copy.ts';

const W: Words = { p: 'cbd', the: 'the bass drum', player: 'percussionist', loudest: 'the hardest hit in the score' };

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the concert bass drum',
    goal: 'Get to know the concert bass drum — what it is, where you meet it, what it does in the music, and its parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A large two-headed drum hanging in a tilting stand, its heads facing sideways. The player strikes and damps; the crew sets and locks the stand — nobody moves it for a mic.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a mallet stroke becomes sound — the playing head, the air, the far head — and where the sound leaves the drum. Shown, never played.',
    credit: { scenarios: ['cbd.snd.1', 'cbd.snd.2', 'cbd.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The transient starts where the mallet meets the playing head. The long low body — both heads, the air and the shell — leaves from both heads, sideways along the drum’s axis. Tendencies, and drums vary.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the concert bass drum sits in the orchestra — its neighbours, the player’s space, its stand, what an amplified stage and a recording add — and what to do before any mic.',
    credit: { scenarios: ['cbd.set.1', 'cbd.set.hear', 'cbd.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Listen to the main pickup first. The mallet’s swing and both damping hands are the player’s; the stand is the crew’s, locked and never moved for a mic. Protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for this drum by its properties — pattern, power, size, mount and peak level — not by its brand.',
    credit: { scenarios: ['cbd.mic.1', 'cbd.mic.2', 'cbd.mic.3', 'cbd.mic.4', 'cbd.rec.1'], note: 'Answer the five checks (one reaches back to how the drum sounds).' },
    takeaway: 'A cardioid spot can suit when the main pickup already carries the low end; a ribbon stays away from a bass drum’s air blast. No type is automatically too fragile or the only safe one.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — above the playing head, looking diagonally down at it, outside the mallet’s and the hands’ path — then move the mic and see what changes.',
    credit: { scenarios: ['cbd.place.1', 'cbd.place.2', 'cbd.place.3', 'cbd.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'A recommended zone is a place to begin, measured from the playing head — not a rule and not a safety distance. The drum and its stand never move; the mic does.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s real rejection faces a loud unwanted source — and know what the main pickup already carries.',
    credit: { scenarios: ['cbd.ctx.1', 'cbd.ctx.2', 'cbd.ctx.studio', 'cbd.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the downstage wedge sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Aim nulls by the real pattern; real nulls are shallowest in the lows, where a bass drum lives. Recorded, the main pickup carries much of the low end and a spot adds the transient.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See how the arrival-time difference between a spot and a farther mic places comb-filter notches — and what polarity does and does not change.',
    credit: { scenarios: ['cbd.two.1', 'cbd.two.2', 'cbd.two.3', 'cbd.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Polarity flips the sign; it does not remove a delay, and no fixed polarity rule fits a far-head mic. Judge spot and main together, in mono, at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — gain staging, the main/spot balance, clearance, the stand’s locks and polarity — before reaching for tone controls or asking the player to change.',
  },
  practice: {
    title: 'Practice',
    goal: 'Add one spot in the right order, choose and justify a setup for two different briefs, and say what would justify a second mic.',
    credit: { scenarios: ['cbd.prac.order', 'cbd.prac.gain', 'cbd.prac.setup1', 'cbd.prac.setup2', 'cbd.prac.3', 'cbd.mix.1', 'cbd.mix.2', 'cbd.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'An unobstructed one-spot or main-only choice, headroom for the loudest hit, an honest mono check and the stand left as the crew set it pass — and more than one setup can pass.',
  },
};

/* THE CHECKS. Lesson refs (comments only): cbd.snd.* L8-L10 · cbd.set.* L9-L11, L40-L44 ·
 * cbd.mic.* L22-L24 · cbd.place.* L13-L20 · cbd.ctx.* L26-L33 · cbd.two.* L34-L36 ·
 * cbd.prac.* / cbd.mix.* L45-L52. */
const scenarios: MikingScenario[] = [
  {
    id: 'cbd.snd.1',
    page: 'sound',
    prompt: 'The mallet pushes the playing head in. What does the air inside do to the far head?',
    options: ['Pushes it outward, away from the player', 'Pulls it inward, toward the playing head', 'Nothing: the air escapes through the shell wall'],
    correct: 'Pushes it outward, away from the player',
    explain: 'The playing head squeezes the air inside, and the air pushes the far head out: the two heads are coupled through the air, and both radiate.',
    why: {
      'Pulls it inward, toward the playing head': 'The playing head moving in squeezes the air; squeezed air pushes on the far head, so it moves outward.',
      'Nothing: the air escapes through the shell wall': 'The shell is closed wood. The air is squeezed and pushes the far head out.',
    },
  },
  {
    id: 'cbd.snd.2',
    page: 'sound',
    prompt: 'The drum’s heads face sideways along the stage. Where does much of its sound leave?',
    options: ['From both heads, sideways along the drum’s axis', 'Mostly upward, from the top of the shell', 'Only from the playing head, toward the player'],
    correct: 'From both heads, sideways along the drum’s axis',
    explain: 'Both heads ring and radiate, along the drum’s axis — which is why the drum’s orientation changes how direct it sounds out front.',
    why: {
      'Mostly upward, from the top of the shell': 'The shell shapes the ring; the heads move the most air, sideways along the axis.',
      'Only from the playing head, toward the player': 'The far head is driven by the air inside and radiates too, on the far side.',
    },
  },
  {
    id: 'cbd.snd.3',
    page: 'sound',
    prompt: 'The mallet strikes the exact centre of the head. Which of its vibration shapes can it set moving?',
    options: ['Only the ring-shaped ones; the rest have a still line there', 'All of them equally, because the whole of the head is struck', 'Only the shapes that have a still line across the centre'],
    correct: 'Only the ring-shaped ones; the rest have a still line there',
    explain: 'A strike drives a shape in proportion to how much the head moves at the strike point in that shape. Shapes with a still line across the head are still at the centre — which is one reason players choose their strike area for colour.',
    why: {
      'All of them equally, because the whole of the head is struck': 'The mallet touches one area. A shape is driven only as much as the head moves there.',
      'Only the shapes that have a still line across the centre': 'The reverse: a still line through the centre means the head does not move there in that shape.',
    },
  },
  {
    id: 'cbd.set.1',
    page: 'setting',
    prompt: 'The bass drum’s angle looks awkward for your mic. What do you do?',
    options: ['Move the mic; the drum stays as the crew set and locked it', 'Loosen the wing bolts and tilt the drum to suit the mic', 'Roll the stand a little closer, then lock the brakes again'],
    correct: 'Move the mic; the drum stays as the crew set and locked it',
    explain: 'Never unlock, tilt, rotate or lift the drum for a mic. The stand’s brakes and pivot bolts are set by the percussion crew, following its manual — a falling bass drum can injure someone.',
    why: {
      'Loosen the wing bolts and tilt the drum to suit the mic': 'Never adjust the stand: only the crew does that, following its manual. Move the mic instead.',
      'Roll the stand a little closer, then lock the brakes again': 'Moving the stand is the crew’s job, not the engineer’s. Move the mic.',
    },
  },
  hearingCheck(W, 'setting', 'cbd.set.hear'),
  {
    id: 'cbd.set.2',
    page: 'setting',
    prompt: 'Where must a bass-drum spot’s stand and cable stay out of?',
    options: ['The mallet’s swing, both damping hands, and the casters', 'The front of the drum, so the audience can see the head', 'The brass row, so that the mic hears less of the brass'],
    correct: 'The mallet’s swing, both damping hands, and the casters',
    explain: 'The player strikes with one hand and damps with the other — on either head. Route stands and cables clear of all of it, and of the stand’s casters and the walking path.',
    why: {
      'The front of the drum, so the audience can see the head': 'How it looks is not the safety question; the player’s motion and the stand are.',
      'The brass row, so that the mic hears less of the brass': 'Spill matters, but the stand and cable must first stay out of the player’s space.',
    },
  },
  {
    id: 'cbd.mic.1',
    page: 'microphone',
    prompt: 'Someone suggests a ribbon mic close to the concert bass drum. What is the concern?',
    options: ['Each hit moves a lot of air, which can damage a ribbon', 'Ribbons cannot pick up a bass drum’s low frequencies at all', 'Ribbons need more phantom power than a desk supplies'],
    correct: 'Each hit moves a lot of air, which can damage a ribbon',
    explain: 'Close to a bass drum, the air moved by each hit can distort or tear a delicate ribbon. Keep ribbons well away from the blast, and follow the maker’s own limits for any ribbon.',
    why: {
      'Ribbons cannot pick up a bass drum’s low frequencies at all': 'Ribbons can pick up lows; the concern here is the air blast damaging the ribbon.',
      'Ribbons need more phantom power than a desk supplies': 'Most ribbons need no phantom at all; the concern is the air blast.',
    },
  },
  {
    id: 'cbd.mic.2',
    page: 'microphone',
    prompt: 'A kick-drum mic is on hand. Is it the obvious choice for an orchestral bass drum?',
    options: ['Not automatically: its shaped response may not suit the music', 'Yes: to a microphone, one bass drum is much the same as another', 'No: kick mics cannot take an orchestra’s levels'],
    correct: 'Not automatically: its shaped response may not suit the music',
    explain: 'A kick mic may be voiced for a modern kick. If orchestral realism matters, compare it with a more neutral mic by ear.',
    why: {
      'Yes: to a microphone, one bass drum is much the same as another': 'A concert bass drum and a kick differ in size, setup and musical job; the mic’s voicing matters.',
      'No: kick mics cannot take an orchestra’s levels': 'Kick mics handle high levels; the question is their shaped response.',
    },
  },
  {
    id: 'cbd.mic.3',
    page: 'microphone',
    prompt: 'The channel you are given has no phantom power. Which of this page’s mics can you use?',
    options: ['The small dynamic: it needs no power to work', 'The small condenser, if it sits farther from the head', 'Either one, as long as the channel gain is turned up'],
    correct: 'The small dynamic: it needs no power to work',
    explain: 'Dynamic mics need no power. The small condenser needs phantom power wherever it is placed.',
    why: {
      'The small condenser, if it sits farther from the head': 'Distance does not change what a condenser needs: it still needs phantom power.',
      'Either one, as long as the channel gain is turned up': 'Gain cannot power a condenser. It needs phantom power from the desk.',
    },
  },
  {
    id: 'cbd.mic.4',
    page: 'microphone',
    prompt: 'Why can a cardioid spot be enough on a recorded orchestra’s bass drum?',
    options: ['The main pickup already carries much of the low end', 'Cardioids pick up a lot more low end than omnis ever do', 'A cardioid cancels the hall’s sound completely'],
    correct: 'The main pickup already carries much of the low end',
    explain: 'With an omni main pickup carrying the low end, the spot mostly adds the transient — a cardioid can do that. An omni spot is possible, but it changes the ensemble image more.',
    why: {
      'Cardioids pick up a lot more low end than omnis ever do': 'Not as a rule; the point is that the main pickup carries the lows.',
      'A cardioid cancels the hall’s sound completely': 'A pattern rejects only part of the room; the main pickup is the reason a cardioid suffices.',
    },
  },
  {
    id: 'cbd.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A spot above the playing head, looking down at it, hears more of what?',
    options: ['The mallet’s transient on the playing head', 'The far head’s ring on the other side', 'The hall’s reverberation around the drum'],
    correct: 'The mallet’s transient on the playing head',
    explain: 'The transient starts where the mallet meets the playing head, so a spot near it tends to hear more of it. The long low body leaves both heads and fills the hall.',
    why: {
      'The far head’s ring on the other side': 'The far head radiates on the far side, away from this spot.',
      'The hall’s reverberation around the drum': 'Close to the head, the drum is far louder than the hall.',
    },
  },
  {
    id: 'cbd.place.1',
    page: 'placement',
    prompt: 'A starting point says about 45 cm from the playing head. Your readout says 45 cm from the far head. Are you in it?',
    options: ['No — the number counts from the head it names', 'Yes — 45 cm is the distance the start asks for', 'Yes, as long as the mic looks down at the drum'],
    correct: 'No — the number counts from the head it names',
    explain: 'A distance only means something with its reference head. 45 cm from the far head is on the other side of the drum.',
    why: {
      'Yes — 45 cm is the distance the start asks for': 'Same number, wrong head: that puts the mic beyond the far head.',
      'Yes, as long as the mic looks down at the drum': 'Aim is a separate variable; the distance counts from the playing head.',
    },
  },
  {
    id: 'cbd.place.2',
    page: 'placement',
    prompt: 'About 45 cm from the head: is that a safe clearance for the player?',
    options: ['No — it is a starting point; the player’s motion sets clearance', 'Yes — 45 cm is outside a mallet’s reach on a drum this size', 'Yes, provided the mic is a small condenser rather than a small dynamic'],
    correct: 'No — it is a starting point; the player’s motion sets clearance',
    explain: 'The 45 cm figure is an example placement, not a safety boundary. Map the real mallet arc and both damping hands with the player first.',
    why: {
      'Yes — 45 cm is outside a mallet’s reach on a drum this size': 'Players, mallets and strokes differ; only the real motion sets the clearance.',
      'Yes, provided the mic is a small condenser rather than a small dynamic': 'The mic type does not change the player’s reach.',
    },
  },
  {
    id: 'cbd.place.3',
    page: 'placement',
    prompt: 'You move the spot closer to the playing head. What tends to change?',
    options: ['More of the drum and the mallet; less room and less bleed', 'The low end disappears and only the attack is left', 'Nothing, as long as the mic is aimed at the head'],
    correct: 'More of the drum and the mallet; less room and less bleed',
    explain: 'Closer usually raises the direct drum against the room and the neighbours, and makes the exact head area and the mallet more prominent — a tendency to check with rolls, big strokes and damping.',
    why: {
      'The low end disappears and only the attack is left': 'Closer shifts the balance; it does not remove the low end. Check by ear.',
      'Nothing, as long as the mic is aimed at the head': 'Distance changes the balance of drum, room and spill even at the same aim.',
    },
  },
  {
    id: 'cbd.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Before your stand goes in, what do you ask the player to show you?',
    options: ['The full mallet arc and both hands damping both heads', 'The make of the drum and the age of its heads', 'How loud the drum can play, in one single hard hit at full force'],
    correct: 'The full mallet arc and both hands damping both heads',
    explain: 'The player’s whole motion — the mallet, rolls, other mallets and the damping on both heads — sets where nothing of yours may go.',
    why: {
      'The make of the drum and the age of its heads': 'Those do not tell you where the player’s hands and mallet go.',
      'How loud the drum can play, in one single hard hit at full force': 'Level matters for gain, but clearance comes from the player’s motion.',
    },
  },
  {
    id: 'cbd.ctx.1',
    page: 'context',
    prompt: 'An amplified concert band. Why can a farther, more open bass-drum mic be impractical?',
    options: ['More bleed and less gain before feedback on a loud stage', 'A farther mic makes the bass drum itself sound quieter', 'The PA cannot reproduce the bass drum from a far mic'],
    correct: 'More bleed and less gain before feedback on a loud stage',
    explain: 'Live, a farther mic hears more of the stage and the PA, so less of it can be used before feedback. A stable, directional spot near the playing head is the usual start.',
    why: {
      'A farther mic makes the bass drum itself sound quieter': 'The drum is as loud as ever; the mic hears more of everything else.',
      'The PA cannot reproduce the bass drum from a far mic': 'The PA can; the problem is bleed and feedback margin.',
    },
  },
  {
    id: 'cbd.ctx.2',
    page: 'context',
    prompt: 'The downstage wedge sits in a null on paper. What should you expect from a bass drum’s lowest notes?',
    options: ['Less rejection than the picture shows, least in the lows', 'Complete silence from the wedge, low and high alike', 'More rejection in the low notes than in the high ones, by far'],
    correct: 'Less rejection than the picture shows, least in the lows',
    explain: 'A null is infinitely deep only on paper. Real mics reject far less there, and least at low frequencies — where low-frequency feedback lives.',
    why: {
      'Complete silence from the wedge, low and high alike': 'A null is infinitely deep only on paper; real rejection is partial.',
      'More rejection in the low notes than in the high ones, by far': 'The reverse: real patterns usually reject least at low frequencies.',
    },
  },
  {
    id: 'cbd.ctx.studio',
    page: 'context',
    prompt: 'No mic can go near the bass drum. Someone suggests turning the drum toward the conductor. What do you say?',
    options: ['Only the player and crew may decide that, under the stand’s manual', 'Loosen the bolts and turn it yourself, carefully and quickly, then lock it', 'Fine — orientation makes no difference to a bass drum'],
    correct: 'Only the player and crew may decide that, under the stand’s manual',
    explain: 'Turning the drum changes how direct it sounds, and the stand has its own locking procedure. It is a musical and safety decision for the player and crew — not an engineering shortcut.',
    why: {
      'Loosen the bolts and turn it yourself, carefully and quickly, then lock it': 'Never adjust the stand yourself: a falling bass drum can injure someone.',
      'Fine — orientation makes no difference to a bass drum': 'Orientation does change how direct the drum sounds; that is why it is the player’s call.',
    },
  },
  {
    id: 'cbd.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · The player damps the far head with their other hand. What changes?',
    options: ['The ring is shorter — the player’s musical choice', 'Nothing: only the playing head makes the sound', 'The transient grows louder at the spot mic'],
    correct: 'The ring is shorter — the player’s musical choice',
    explain: 'Both heads ring together; damping either one shortens the body. It is part of the music — the mic captures it, it does not fix it.',
    why: {
      'Nothing: only the playing head makes the sound': 'The far head is driven by the air inside and rings too.',
      'The transient grows louder at the spot mic': 'Damping shortens the ring; the mallet’s transient is unchanged.',
    },
  },
  polarityKeepsDelay(W),
  firstNotch(W),
  {
    id: 'cbd.two.3',
    page: 'twoMic',
    prompt: 'You try a second mic on the far head. Should its polarity be inverted as a rule?',
    options: ['No fixed rule: compare both states in mono, at matched level', 'Yes — a far-head mic is wired the wrong way round by nature', 'Yes, and delay it too, so both mics line up exactly in time again'],
    correct: 'No fixed rule: compare both states in mono, at matched level',
    explain: 'A fixed automatic reversal for the far head is unjustified. Check both spots together, then against the main pickup; remove the far-head mic if it adds little.',
    why: {
      'Yes — a far-head mic is wired the wrong way round by nature': 'Nothing is “wrong” by nature: positions and arrival times decide the sum. Compare both states.',
      'Yes, and delay it too, so both mics line up exactly in time again': 'One source in a hall cannot line up at every frequency and every reflection; judge by ear.',
    },
  },
  louderIsNotBetter(W),
  gainCheck(W),
  {
    id: 'cbd.prac.3',
    page: 'practice',
    prompt: 'What would justify a second bass-drum mic (a far-head or room mic)?',
    options: ['It reveals useful sustain, works alone, and holds up in mono', 'The far head should have a mic of its very own, as a rule', 'The drum needs more level than one single spot can ever give it'],
    correct: 'It reveals useful sustain, works alone, and holds up in mono',
    explain: 'A second view is an experiment: compare it alone and together in mono at useful levels, and discard it if it adds bleed, phase problems or risk.',
    why: {
      'The far head should have a mic of its very own, as a rule': 'No source establishes such a rule; the second mic has to earn its place.',
      'The drum needs more level than one single spot can ever give it': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'cbd.mix.1',
    page: 'practice',
    prompt: 'A starting point says “about 45 cm, looking diagonally down”. What else do you need before placing the mic?',
    options: ['Which head it is measured from, and the player’s clearance', 'The brand of the drum, so the number matches its size', 'Nothing more: the number already tells you exactly where it goes'],
    correct: 'Which head it is measured from, and the player’s clearance',
    explain: 'A distance belongs to its named head (the playing head); the player’s motion sets the clearance. The aim is part of the starting point.',
    why: {
      'The brand of the drum, so the number matches its size': 'The brand does not change the reference head.',
      'Nothing more: the number already tells you exactly where it goes': 'A distance means nothing without its head; clearance is a separate check.',
    },
  },
  cardioidNull(W),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  {
    id: 'cbd.s.clip',
    observation: 'A loud hit clips although the average level is quiet',
    firstChecks: 'The mic, the preamp, the pad position, the main pickup’s inputs and the meter.',
    options: ['Mic, preamp, pad position, the main inputs and the meter', 'Turn the channel fader down until the clipping finally stops', 'Ask the player to hold back on the loudest hits'],
    correct: 'Mic, preamp, pad position, the main inputs and the meter',
    explain: 'Lower the gain or pad at the stage that overloads; leave headroom for the score’s loudest hit and recheck the quiet passages.',
    why: {
      'Turn the channel fader down until the clipping finally stops': 'The fader comes after the overload; it only makes the clipped sound quieter.',
      'Ask the player to hold back on the loudest hits': 'The score sets the dynamics; set the gain for them.',
    },
  },
  {
    id: 'cbd.s.thump',
    observation: 'A low thump without definition',
    firstChecks: 'The spot’s aim and level; the player’s intended mallet and playing area.',
    options: ['The spot’s aim and level, then the playing-side diagonal start', 'Ask the player to use a harder mallet for the mic', 'Boost the highs on the channel until the thump sounds clear again'],
    correct: 'The spot’s aim and level, then the playing-side diagonal start',
    explain: 'Try the diagonal playing-side starting point and a gentle blend; the mallet and the playing area are the player’s choices.',
    why: {
      'Ask the player to use a harder mallet for the mic': 'Mallets are a musical choice; change the mic first.',
      'Boost the highs on the channel until the thump sounds clear again': 'EQ cannot add a transient the mic does not hear; aim and level first.',
    },
  },
  {
    id: 'cbd.s.stand',
    observation: 'The drum’s stand moves, or its angle seems loose',
    firstChecks: 'Stop work around the drum; the percussion crew checks the casters and the pivot locks.',
    options: ['Stop work there; the crew checks the brakes and pivots', 'Tighten the wing bolts yourself, then carry on', 'Wedge the casters with something you find on the stage'],
    correct: 'Stop work there; the crew checks the brakes and pivots',
    explain: 'A falling bass drum can injure someone. Stop, and let the authorised percussion crew follow the stand’s own manual.',
    why: {
      'Tighten the wing bolts yourself, then carry on': 'The stand is the crew’s to adjust, following its manual.',
      'Wedge the casters with something you find on the stage': 'Improvised fixes are not safe; stop and call the crew.',
    },
  },
  distortionSymptom(W),
  monoSymptom(W),
  contactSymptom(W),
];

const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point, measured from the playing head', role: 'required', feedback: 'Say why it is a good place to begin, and which head it is measured from.' };
const STAND_REASON: SetupReason = { id: 'r.stand', label: 'The drum and its stand stay exactly as the crew set them', role: 'required', feedback: 'The drum never moves for a mic.' };
const LOW_REASON: SetupReason = { id: 'r.low', label: 'It will give the most low end of any position', role: 'wrong', feedback: 'No position always gives the most low end — and the main pickup carries much of it.' };

const setupTasks: SetupTask[] = [
  {
    id: 'cbd.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A symphony recording in a good hall. The bass drum’s hits sound woolly in the main pair. One spot channel; phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser above the playing head, about 45 cm away, looking diagonally down, blended low', ok: true, power: 'phantom', feedback: 'The recommended starting point for the transient; it needs the phantom power this channel has.' },
      { id: 'b', label: 'Small dynamic a little closer, above the playing head and looking down at it, blended low', ok: true, power: 'none', feedback: 'A closer variant of the same idea; check the mallet and hands, and blend it under the main pair.' },
      { id: 'c', label: 'A ribbon mic close to the playing head for a warm sound', ok: false, power: 'none', feedback: 'A bass drum’s air blast can damage a ribbon close up.' },
      { id: 'd', label: 'Turn the drum to face the main pair instead of adding a mic', ok: false, power: 'none', feedback: 'The drum is not turned to suit the mics; that is the player’s and crew’s decision.' },
      { id: 'e', label: 'A mic in the middle of the playing head’s area, 10 cm away', ok: false, power: 'phantom', feedback: 'That is in the mallet’s path. Stay outside the whole swing.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, STAND_REASON, BRAND_REASON, LOW_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point from the playing head, clear of the mallet and hands, the drum left as set, and power that matches the mic.',
  },
  {
    id: 'cbd.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · An amplified concert band, monitors on stage. The operator needs a usable bass-drum channel. The spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'Small dynamic above the playing head, closer than 45 cm, looking down at it', ok: true, power: 'none', feedback: 'A stable, directional spot as near as safely useful; a dynamic needs no phantom.' },
      { id: 'b', label: 'Small dynamic about 45 cm from the playing head, looking diagonally down', ok: true, power: 'none', feedback: 'The recommended starting point; check its gain before feedback with the operator.' },
      { id: 'c', label: 'Small condenser at the 45 cm spot', ok: false, power: 'phantom', feedback: 'This input has no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'A room mic two metres away to catch the whole drum', ok: false, power: 'none', feedback: 'On a loud amplified stage a far mic hears more bleed and gives less gain before feedback.' },
      { id: 'e', label: 'Tilt the drum toward the audience so it needs no mic', ok: false, power: 'none', feedback: 'The drum is not moved for sound; that is the player’s and crew’s call, under the stand’s manual.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, STAND_REASON, BRAND_REASON, LOW_REASON],
    explain: 'Two playing-side positions pass. What passes is the reasoning: a starting point from the playing head, clear of the player, the drum left as set, and powered by what this input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: when the mallet pushes the playing head in, what does the FAR head do?', options: ['It moves outward, away from the player', 'It moves inward, toward the playing head', 'It stays still — only the struck head moves'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch both heads.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the spot from about 45 cm to closer and steeper. What changes?', options: ['More of the room', 'More of the mallet and the head', 'It depends on this drum and room'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge sits off to the side of a mic looking down at the drum. Which pattern can turn a null toward it?', options: ['Only a cardioid', 'A supercardioid or hypercardioid', 'None of them'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'cbd.q.1',
    covers: 'instrument',
    prompt: 'How does a concert bass drum usually sit in an orchestra?',
    options: ['In a tilting stand, its heads facing sideways', 'On the floor, its heads facing out to the audience', 'Lying flat on a table, one head facing up'],
    correct: 'In a tilting stand, its heads facing sideways',
    explain: 'It hangs on pivots in a tilting stand on locking casters, its heads usually facing sideways along the stage; the crew sets and locks its angle.',
    why: {
      'On the floor, its heads facing out to the audience': 'That is closer to a kit’s kick drum. A concert bass drum hangs in a stand, heads sideways.',
      'Lying flat on a table, one head facing up': 'It hangs in a stand on pivots, its heads facing sideways.',
    },
  },
  {
    id: 'cbd.q.2',
    covers: 'instrument',
    prompt: 'Who may unlock, tilt or move the drum in its stand?',
    options: ['The percussion crew, following the stand’s manual', 'The sound engineer, whenever a mic needs a bit more room', 'Anyone, once all four casters are unlocked'],
    correct: 'The percussion crew, following the stand’s manual',
    explain: 'The stand’s brakes and pivot bolts are set by the crew following its manual (two people to lift). The engineer moves the mic, never the drum.',
    why: {
      'The sound engineer, whenever a mic needs a bit more room': 'Never: move the mic, not the drum.',
      'Anyone, once all four casters are unlocked': 'Unlocking is itself the crew’s job; a falling drum can injure someone.',
    },
  },
  {
    id: 'cbd.q.3',
    covers: 'sound',
    prompt: 'The mallet pushes the playing head in. What happens to the far head?',
    options: ['The air pushes it outward — the heads are coupled', 'It is pulled inward together with the playing head', 'Nothing — only the struck head moves'],
    correct: 'The air pushes it outward — the heads are coupled',
    explain: 'The playing head squeezes the air inside, and the air pushes the far head out: both heads ring and radiate.',
    why: {
      'It is pulled inward together with the playing head': 'Squeezed air pushes the far head out, not in.',
      'Nothing — only the struck head moves': 'The air couples the heads; the far head moves and radiates too.',
    },
  },
  {
    id: 'cbd.q.4',
    covers: 'sound',
    prompt: 'Where does a concert bass drum’s sound mostly leave?',
    options: ['From both heads, sideways along its axis', 'From the top of the shell, straight up to the roof', 'From the stand’s pivots into the floor'],
    correct: 'From both heads, sideways along its axis',
    explain: 'Both heads radiate along the drum’s axis — sideways along the stage when the heads face sideways.',
    why: {
      'From the top of the shell, straight up to the roof': 'The heads move the most air, along the axis.',
      'From the stand’s pivots into the floor': 'The stand holds the drum; the heads radiate the sound.',
    },
  },
  {
    id: 'cbd.q.5',
    covers: 'setting',
    prompt: 'Recording an orchestra: before you add a bass-drum spot, what comes first?',
    options: ['Hear the passage through the main pickup', 'Turn the drum toward the main pair', 'Ask the player to hit harder for the mics'],
    correct: 'Hear the passage through the main pickup',
    explain: 'The main pickup often carries much of the low end already; a spot adds what is missing — usually the transient.',
    why: {
      'Turn the drum toward the main pair': 'The drum is not turned for the mics; that is the player’s and crew’s call.',
      'Ask the player to hit harder for the mics': 'The score sets the dynamics; the mics serve the music.',
    },
  },
  quickHearing(W),
];

export const M07A_LESSON: Lesson = {
  id: 'M07a',
  labId: 'drums',
  title: 'Concert Bass Drum',
  subtitle: 'Orchestral bass drum on its stand: main pickup, one spot, never move the drum',
  noun: { one: 'concert bass drum', many: 'concert bass drums' },
  model: CBD_MODEL,
  micTypeIds: ['orchSdc', 'smallDynCard'],
  zones: CBD_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    setupOrder(W, { text: 'Inspect with the player: playing side, mallets, rolls, both damping hands — do not move the drum', early: 'Start with the player and the drum as it is set.' }, { text: 'Listen to the main pickup and decide what, if anything, is missing', early: 'Hear what the main pickup gives before you add a mic.' }),
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A large, two-headed bass drum for orchestras and concert bands — distinct from a drum kit’s kick. It hangs on pivots in a tilting stand on locking casters, and is played with a large felt mallet.', src: 'YMH-CB9-STAND' },
    { title: 'WHERE YOU MEET IT', text: 'In the percussion section of an orchestra or band, usually with its heads facing sideways along the stage — recorded in halls and studios, and amplified on stage.', src: 'LESSON-CBD' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Single big strokes, soft rolls, and notes left to bloom or damped by hand on either head. Few notes — but a lot of low-frequency energy and a fast start.', src: 'LESSON-CBD' },
    { title: 'ITS SIZE', text: 'Concert bass drums are often 32 to 40 in across and 16 to 22 in deep. This lab draws a 36 × 16 in drum.', src: 'YMH-CPCAT' },
  ],
  sound: {
    stages: [
      { title: 'The mallet strikes', text: 'A large felt mallet strikes the playing head, usually in the middle region between the centre and the edge. That brief contact is where the transient — the ATTACK — begins.' },
      { title: 'The playing head is pushed in', text: 'The head bows into the drum — most at the centre, not at all at the hoop: its lowest vibration shape, drawn here much larger than it really moves. Then it springs back and rings.' },
      { title: 'The air pushes the far head', text: 'The playing head squeezes the air inside, and the air pushes the far head outward. The two heads are coupled through the air.' },
      { title: 'Sound leaves the drum', text: 'Sound leaves from both heads, sideways along the drum’s axis — across the stage when the heads face sideways. The heads, the air and the shell ringing together are the long, low BODY of the sound.' },
    ],
    attack: 'The start of each stroke: the mallet’s contact with the playing head. A spot near the playing head, looking down at it, tends to hear more of it.',
    body: 'The long low bloom after: both heads, the air inside and the shell, leaving from both heads into the hall. The main pickup tends to carry much of it already. Tendencies — and damping, mallets and tuning are the player’s.',
    head: { diameterMm: 36 * 25.4, rods: 12, label: '36 in playing head, seen from the player’s side', strikeSrc: 'LESSON-CBD', hoop: 'wood' },
  },
  setting: {
    items: [
      { id: 'bassDrum', label: 'the concert bass drum (in its stand)', short: 'BASS DRUM', note: 'In the percussion row, hanging in its tilting stand, its heads facing along the stage; the player stands at the playing head. The drawing every page of this lesson uses.', prov: { kind: 'illustrative', reason: 'a typical concert layout; no source gives positions' }, tag: 'THE DRUM', scene: 'all' },
      { id: 'timpani', label: 'the timpani', short: 'TIMPANI', note: 'Big and low, along the row. A bass-drum spot hears them, and their spots hear the bass drum.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'snare', label: 'the concert snare', short: 'SNARE', note: 'Beside the bass drum, often played by a neighbouring percussionist. Its player’s space and yours must not cross.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'cymbal', label: 'a suspended cymbal', short: 'CYMBAL', note: 'Bright and loud nearby. A directional spot rejects only part of it.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'table', label: 'the trap table', short: 'TABLE', note: 'Mallets and small instruments wait here; players reach for them between passages. Keep stands and cables out of that path — and away from the drum’s casters.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'KEEP CLEAR', scene: 'kit' },
      { id: 'brass', label: 'the brass row in front', short: 'BRASS', note: 'Loud, just downstage of the percussion. A farther bass-drum mic hears much more of it.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'downstage', label: 'a floor wedge downstage, on the conductor’s side of the drum', short: 'WEDGE', note: 'Off to the side of a spot looking down at the playing head — a loud source a pattern’s null can be turned toward.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'fill', label: 'the percussion section’s own monitor', short: 'SECTION MON.', note: 'Upstage, beyond the drum, facing the players: in FRONT of a spot looking at the drum, where no pattern rejects it.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'conductor', label: 'the conductor', short: 'CONDUCTOR', note: 'Off to the side of the drum (its heads face along the stage). The player needs a clear sightline: no boom across it.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SIGHTLINE', scene: 'stage' },
      { id: 'pa', label: 'the PA', short: 'PA', note: 'At the front corners, facing the audience. Low-frequency feedback is the bass drum’s particular risk — every open mic hears the PA.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'FEEDBACK PATH', scene: 'stage' },
      { id: 'main', label: 'the main pair over the conductor', short: 'MAIN PAIR', note: 'Two mics on a tall stand, hearing the whole orchestra. Recording, it often carries the bass drum’s low end — the spot adds the transient.', prov: { kind: 'illustrative', reason: 'a typical recording layout' }, tag: 'MAIN PICKUP', scene: 'studio' },
      { id: 'hall', label: 'the hall', short: 'THE HALL', note: 'In a quiet, good hall a little more distance can blend the two heads and the room; a raised spot can pull the drum out of its place.', prov: { kind: 'illustrative', reason: 'a generic hall; no source gives its size' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: an amplified orchestra or band — monitors on stage, the PA facing the audience. Low-frequency feedback, bleed and the gain before feedback favour one stable, directional spot near the playing head, worked out with the operator.',
    studio: 'RECORDING: the main pickup carries the orchestra and much of the bass drum’s low end; a spot adds the transient, low in the mix. A quiet hall can reward a little more distance.',
  },
  diagnostic,
  practice: {
    task: 'Justify an unobstructed one-spot or main-only setup, show headroom for the loudest hit, compare main and spot in mono, and explain the live and safety differences. With a real drum and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'drum', label: 'Drum (size, stand, playing side)', kind: 'text' },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser', 'small dynamic', 'main pickup only', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance from the playing head, aim', kind: 'text' },
      { id: 'gain', label: 'Gain and pad on the loudest hit', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The drum’s centre height on its stand (drawn at 800 mm) — so no height above the floor is shown.', dims: ['yFloor', 'centreH'] },
    { text: 'The spot’s elevation: the source says “just above … looking diagonally downwards … about 45 cm”; the lab draws 45° above the head centre (a drawing default) and counts 20–70° off the head’s axis.', dims: ['deccaElev'] },
    { text: 'The stand’s width and footprint, pivots, casters, the hoop material and size, the rod count (drawn 12) — drawing defaults.', dims: ['standHalfZ', 'standHalfX'] },
    { text: 'The mallet’s swing, both damping hands and the player’s position — ILLUSTRATIVE.', dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: {
    wedges: [
      {
        id: 'downstage',
        label: 'a floor wedge downstage, on the conductor’s side of the drum, facing back toward it',
        short: 'DOWNSTAGE',
        p: { x: 200, y: FLOOR_Y, z: 1000 },
        lift: 150,
        faces: { x: 0, y: 0, z: -1 },
        note: 'It sits off to the side of a spot looking down at the playing head — a case a pattern’s null can help with.',
        prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
      },
      {
        id: 'fill',
        label: 'the percussion section’s own monitor, upstage beyond the drum, facing the players',
        short: 'SECTION MON.',
        p: { x: -1250, y: FLOOR_Y, z: -1050 },
        lift: 150,
        faces: { x: 0.6, y: 0, z: 0.8 },
        note: 'It sits in FRONT of a spot looking at the drum: no pattern null reaches it. The drum itself lies in much of the path.',
        prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
      },
    ],
  },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. In an orchestra the main pickup often carries the bass drum’s low end already; when a spot helps, every drum, player and hall is different: move the mic, experiment, and trust your ears and the room. The drum and its stand never move for a mic. The lab is silent and draws a simplified picture: a 36 × 16 in drum, mic patterns and the two-mic comb as textbook shapes, and head motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.',
  copy: CBD_COPY,
};
