/**
 * C05c UKULELE — the lesson's pages as DATA. Words from the owner's lesson
 * (docs/labs/miking/source_text/Ukulele-Miking-Technique.txt, "L<n>" in
 * COMMENTS only) with the fixes UK-01 … applied (CORRECTIONS_LOG.md).
 * Starting-points voice; FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, LessonPages, PageContent, SourcePageId, SetupTask, Symptom } from '../../engine/model/types.ts';
import { ACCURACY, brandReason, clearReason, contextChecks, DOC_REASON, hearingCheck, hearingDiag, LOUD_REASON, micChecks, POWER_REASON, practiceChecks, setupOrder, sharedSymptoms, STRINGS_PREDICT, twoMicChecks } from '../shared/guitars/stringsContent.ts';
import { C05C_MODEL, C05C_WEDGES, C05C_ZONES } from './geometry.ts';
import { C05C_COPY, UKE } from './copy.ts';

const P = 'uk';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the ukulele',
    goal: 'Get to know the ukulele — soprano, concert, tenor and baritone — what it is, where you meet it, its job in the music, and its parts, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Four nylon strings drive a bridge on a small top; the top and the small body’s air make the sound. The sizes differ in more than size — do not assume they behave alike.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a strum or pluck becomes sound — the string, the bridge, the small top and the air in the body — and where it leaves.',
    credit: { scenarios: [`${P}.snd.1`, `${P}.snd.2`, `${P}.snd.3`], interactive: 'soundPath', note: 'Step the pluck through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The sound hole is not the whole instrument: the top radiates too, and the strings carry the detail. A close mic hears the small part it faces.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the space round a ukulele player — the strumming arc, the short neck, their voice above — what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: [`${P}.set.1`, `${P}.set.2`, `${P}.set.3`], note: 'Answer the three checks.' },
    takeaway: 'The strumming arc and the voice above the ukulele shape everything. Nothing goes on or in the instrument without the owner. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the ukulele by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: [`${P}.mic.1`, `${P}.mic.2`, `${P}.mic.3`, `${P}.mic.4`, `${P}.rec.1`], note: 'Answer the five checks (one reaches back to how the ukulele sounds).' },
    takeaway: 'An omni suits a quiet, good room; a cardioid isolates; a clip-on moves with the player if its range fits the body. A condenser does not guarantee a sound. A mic’s maximum SPL is not a hearing limit.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — the upper body and neck joint, off the strumming arc — then move the mic and see what changes.',
    credit: { scenarios: [`${P}.place.1`, `${P}.place.2`, `${P}.place.3`, `${P}.rec.2`], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin — this one borrowed from the guitar, and said so. Compare three regions one change at a time, and keep the strumming arc clear.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the floor wedge — and plan for the voice right above the ukulele.',
    credit: { scenarios: [`${P}.ctx.1`, `${P}.ctx.2`, `${P}.ctx.studio`, `${P}.rec.3`], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Aim the rejection by the actual pattern; the voice above is in front of any ukulele mic. On a loud stage a pickup may carry it. No mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why two views of a small instrument can thin out together, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: [`${P}.two.1`, `${P}.two.2`, `${P}.two.3`, `${P}.two.4`], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two views hear the ukulele at different times, so their sum combs. Polarity flips the sign; it does not remove a delay. A small instrument does not need to be made wide.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — position, aim, the strumming hand, the voice, gain and polarity — before reaching for EQ.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one ukulele mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second mic.',
    credit: { scenarios: [`${P}.prac.order`, `${P}.prac.gain`, `${P}.prac.setup1`, `${P}.prac.setup2`, `${P}.prac.3`, `${P}.mix.1`, `${P}.mix.2`, `${P}.mix.3`], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real ukulele.' },
    takeaway: 'A balanced position off the strumming arc, power and level checks, a plan for the voice, and nothing pressed on or into the ukulele pass. A brand does not.',
  },
};

const scenarios: MikingScenario[] = [
  {
    id: `${P}.snd.1`,
    page: 'sound',
    prompt: 'Is the sound hole where all of a ukulele’s sound comes from?',
    options: ['No: the top radiates too, and the strings carry detail', 'Yes: everything leaves through the little round sound hole', 'Yes, as long as the player strums right over it'],
    correct: 'No: the top radiates too, and the strings carry detail',
    explain: 'The bridge drives the top, which radiates; the air breathes through the hole; the strings and fingers carry detail. A mic close to the hole hears only part of it.',
    why: {
      'Yes: everything leaves through the little round sound hole': 'The hole carries the body’s air; the top and the strings radiate too.',
      'Yes, as long as the player strums right over it': 'Where they strum changes the attack, not where the sound leaves.',
    },
  },
  {
    id: `${P}.snd.2`,
    page: 'sound',
    prompt: 'On a soprano, the neck meets the body at the 12th fret. A strum right there drives which shapes of the open string?',
    options: ['All of them equally, because the whole string moves', 'Only the even ones; the odd shapes stay silent', 'Only the odd ones; the even shapes stay silent'],
    correct: 'Only the odd ones; the even shapes stay silent',
    explain: 'The 12th fret is the exact middle of the open string, where every even shape has a still point — a rounder, softer tone there.',
    why: {
      'All of them equally, because the whole string moves': 'The finger touches one spot. A shape is driven only as much as the string moves there.',
      'Only the even ones; the odd shapes stay silent': 'The reverse: the even shapes have a still point at the middle.',
    },
  },
  {
    id: `${P}.snd.3`,
    page: 'sound',
    prompt: 'Soprano, concert, tenor and baritone ukuleles — do they behave alike for a mic?',
    options: ['Alike: a ukulele is a ukulele, whatever its size', 'Alike, as long as they all use nylon strings', 'Not necessarily: sizes and tunings differ'],
    correct: 'Not necessarily: sizes and tunings differ',
    explain: 'Body sizes, scale lengths, tunings and where the neck joins all differ. Use the player’s instrument, not a memorised position.',
    why: {
      'Alike: a ukulele is a ukulele, whatever its size': 'The sizes differ in body, scale and tuning — enough to change what a mic hears.',
      'Alike, as long as they all use nylon strings': 'Strings are one factor; body and scale differ too.',
    },
  },
  hearingCheck(P, UKE),
  {
    id: `${P}.set.2`,
    page: 'setting',
    prompt: 'The player also sings. What do you decide before chasing isolation?',
    options: ['Nothing: the vocal mic hardly hears the ukulele from that distance', 'To ask the player to stop singing while the ukulele is recorded', 'Whether a combined performance or separate control matters more'],
    correct: 'Whether a combined performance or separate control matters more',
    explain: 'Spill between the vocal and ukulele mics is expected. Decide the priority — a coherent performance or separate tracks — then set the geometry.',
    why: {
      'Nothing: the vocal mic hardly hears the ukulele from that distance': 'It does: the two are close. Spill is expected; plan for it.',
      'To ask the player to stop singing while the ukulele is recorded': 'The performance is theirs. Plan the mics round it.',
    },
  },
  {
    id: `${P}.set.3`,
    page: 'setting',
    prompt: 'You want to use a clip-on mini. What do you check first?',
    options: ['Nothing: a ukulele is small enough for a guitar’s clip', 'Only that the cable reaches the stage box and the desk', 'The body’s real depth against the clip’s range, and the finish'],
    correct: 'The body’s real depth against the clip’s range, and the finish',
    explain: 'Each clip fits a range of body depths. Measure this ukulele, check the edge and the finish, and ask the owner.',
    why: {
      'Nothing: a ukulele is small enough for a guitar’s clip': 'Clips have depth ranges. Measure before assuming a fit.',
      'Only that the cable reaches the stage box and the desk': 'The cable matters, but the fit and the finish come first.',
    },
  },
  {
    id: `${P}.rec.1`,
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic very close to the sound hole tends to hear what?',
    options: ['The whole ukulele in a perfect, even balance', 'One local low-mid resonance, and less of the strings', 'Mostly the fingers on the fretboard, up near the nut'],
    correct: 'One local low-mid resonance, and less of the strings',
    explain: 'Very close to the hole favours one local resonance and underrepresents the strings and the top.',
    why: {
      'The whole ukulele in a perfect, even balance': 'Close to one spot hears a small part, not the whole.',
      'Mostly the fingers on the fretboard, up near the nut': 'That would be a mic near the neck. Over the hole, the body’s air dominates.',
    },
  },
  {
    id: `${P}.mic.1`,
    page: 'microphone',
    prompt: 'Does choosing a condenser guarantee a good ukulele sound?',
    options: ['It does: condensers are more detailed than the other mic types', 'No: its pattern, response, placement and the room matter', 'It does, as long as it is placed right at the sound hole'],
    correct: 'No: its pattern, response, placement and the room matter',
    explain: 'A condenser is one property among several. Pattern, response, placement and the room decide what you hear.',
    why: {
      'It does: condensers are more detailed than the other mic types': 'Mics differ model by model. Choose by properties and listening.',
      'It does, as long as it is placed right at the sound hole': 'Right at the hole favours one resonance. Placement is the bigger question.',
    },
  },
  ...micChecks(P, UKE),
  {
    id: `${P}.place.1`,
    page: 'placement',
    prompt: 'Why does this lesson say its upper-body aim comes “from the guitar”?',
    options: ['Ukuleles can only be miked the way that guitars are miked', 'The ukulele guide gives no sweet spot; the aim is borrowed', 'A ukulele is a small guitar, so the rules are the same'],
    correct: 'The ukulele guide gives no sweet spot; the aim is borrowed',
    explain: 'The guitar’s neck-joint view is applied to the ukulele as an experiment, not a ukulele rule — and the lesson says so. Verify it on the actual instrument.',
    why: {
      'Ukuleles can only be miked the way that guitars are miked': 'They can be miked many ways; this starting point is borrowed and to be tested.',
      'A ukulele is a small guitar, so the rules are the same': 'Its body, neck joint and sound differ. The borrowing is an experiment.',
    },
  },
  {
    id: `${P}.place.2`,
    page: 'placement',
    prompt: 'The strum is harsh, all transient. What is a good first move?',
    options: ['Move closer to the strings to catch more detail', 'Move away from the hand and take in more of the body', 'Cut the treble hard until the strum has softened'],
    correct: 'Move away from the hand and take in more of the body',
    explain: 'A mic on the strumming arc or very near the bridge magnifies the transient. Change the aim or distance, and check the technique and gain.',
    why: {
      'Move closer to the strings to catch more detail': 'That adds more of the harsh transient.',
      'Cut the treble hard until the strum has softened': 'EQ hides it without fixing the view. Move first.',
    },
  },
  {
    id: `${P}.place.3`,
    page: 'placement',
    prompt: 'A starting point says 20–40 cm from the neck joint. Your readout says 25 cm out from the sound hole. Are you in it?',
    options: ['Yes: 25 cm falls inside the 20 to 40 cm band', 'Not necessarily: it is read from the neck joint', 'Yes, as long as the mic is facing the ukulele’s top'],
    correct: 'Not necessarily: it is read from the neck joint',
    explain: 'A distance means something only with its reference point. The joint and the hole are different places, so the same number puts the mic somewhere else.',
    why: {
      'Yes: 25 cm falls inside the 20 to 40 cm band': 'Same number, different point. The band is read from the joint.',
      'Yes, as long as the mic is facing the ukulele’s top': 'Aim is a separate check. The distance is read from the named point.',
    },
  },
  {
    id: `${P}.rec.2`,
    page: 'placement',
    prompt: 'FROM EARLIER · What must a stand mic and its boom stay out of, round a singing ukulele player?',
    options: ['The front of the ukulele, so the audience can see it', 'The strumming arc, the fretting hand and the vocal mic', 'The floor by the chair, which belongs to the DI box'],
    correct: 'The strumming arc, the fretting hand and the vocal mic',
    explain: 'The strumming hand sweeps over a small body, the fretting hand moves on a short neck, and the vocal mic sits just above. Keep the boom clear of all three.',
    why: {
      'The front of the ukulele, so the audience can see it': 'In front is usually where the mic goes. The player’s space is what to protect.',
      'The floor by the chair, which belongs to the DI box': 'Cables need a route, but the safety question is the hands and the vocal mic.',
    },
  },
  ...contextChecks(P, UKE),
  {
    id: `${P}.ctx.studio`,
    page: 'context',
    prompt: 'A quiet, intimate solo in a good room. What often shows a small body better?',
    options: ['Two very close mics on small spots', 'A mic right inside the sound hole', 'One broad position, a little back'],
    correct: 'One broad position, a little back',
    explain: 'A broad position often gives a better picture of a small body than two extremely close spots — in a room worth hearing.',
    why: {
      'Two very close mics on small spots': 'Two local views add combining problems and miss the whole.',
      'A mic right inside the sound hole': 'Never insert a mic into the hole; it hears one resonance.',
    },
  },
  {
    id: `${P}.rec.3`,
    page: 'context',
    prompt: 'FROM EARLIER · Where does the singer-player’s voice reach the ukulele mic from?',
    options: ['From directly behind the mic, where it rejects most', 'From above and in front of its rear: no null reaches it', 'It does not reach the ukulele mic at all, from up there'],
    correct: 'From above and in front of its rear: no null reaches it',
    explain: 'The mouth is just above the instrument, in the front half of any pattern aimed at the ukulele. Plan the balance instead of relying on rejection.',
    why: {
      'From directly behind the mic, where it rejects most': 'The voice is above the ukulele, toward the mic’s front, not behind it.',
      'It does not reach the ukulele mic at all, from up there': 'It does, strongly. Spill between the two is expected.',
    },
  },
  ...twoMicChecks(P, UKE),
  ...practiceChecks(P, UKE, {
    quote: '20–40 cm from the neck joint',
    right: 'The neck joint, not the sound hole or the bridge',
    wrong1: 'The sound hole, since that is the loudest place',
    wrong2: 'The back of the body, measured through it',
    explain: 'A distance belongs to the point it names: from the neck joint, from the hole and from the bridge are different places for the same number.',
  }),
];

const symptoms: Symptom[] = [
  {
    id: `${P}.sym.boom`,
    observation: 'A boomy or hollow body note',
    firstChecks: 'Is the mic close and aimed straight into the hole? Move toward the upper body or back; compare the lowest notes.',
    options: ['Boost the treble until the boom is masked by it', 'Move toward the upper body or back; compare low notes', 'Move even closer in to the sound hole to find it'],
    correct: 'Move toward the upper body or back; compare low notes',
    explain: 'Close and straight into the hole favours one resonance. Change the view first.',
    why: {
      'Boost the treble until the boom is masked by it': 'EQ hides it without fixing it.',
      'Move even closer in to the sound hole to find it': 'Closer makes that one resonance stronger.',
    },
  },
  {
    id: `${P}.sym.thin`,
    observation: 'A thin, all-string sound',
    firstChecks: 'Is the mic too near the fretboard or hand? Include the bridge and top, and more of the whole body.',
    options: ['Turn the channel up until the sound feels full', 'Add a second mic on the strings, up near the nut', 'Include the bridge and top, and more of the body'],
    correct: 'Include the bridge and top, and more of the body',
    explain: 'A view mostly of the strings misses the body. Broaden it.',
    why: {
      'Turn the channel up until the sound feels full': 'Louder is not fuller: the balance comes from where the mic is.',
      'Add a second mic on the strings, up near the nut': 'That adds more strings. Fix the one view first.',
    },
  },
  {
    id: `${P}.sym.vocal`,
    observation: 'Vocal bleed dominates the ukulele channel',
    firstChecks: 'Are the singer and instrument mics facing one another? Revise geometry and pattern; decide whether the bleed is acceptable.',
    options: ['Turn the ukulele channel up until it covers the voice in it', 'Ask the player to sing much more quietly for the show', 'Revise the geometry and pattern; decide what bleed is fine'],
    correct: 'Revise the geometry and pattern; decide what bleed is fine',
    explain: 'Some bleed is expected. Change the angles so the mics do not face each other, then judge it in the performance.',
    why: {
      'Turn the ukulele channel up until it covers the voice in it': 'More gain raises the voice in that channel too.',
      'Ask the player to sing much more quietly for the show': 'The performance is theirs. Change the mics.',
    },
  },
  ...sharedSymptoms(P, UKE),
];

const setupTasks: SetupTask[] = [
  {
    id: `${P}.prac.setup1`,
    page: 'practice',
    brief: 'BRIEF 1 · A singer-player on a small stage, a floor wedge in front. One channel for the ukulele; phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser, cardioid, 20–40 cm from the neck joint, off the strumming arc, rear to the wedge', ok: true, power: 'phantom', feedback: 'A recommended starting point, clear of the hands, its rejection toward the wedge.' },
      { id: 'b', label: 'Instrument dynamic at the upper body, close end of the band, clear of the vocal mic', ok: true, power: 'none', feedback: 'A robust close option at a recommended starting point.' },
      { id: 'c', label: 'Clip-on mini on a clip whose range fits the measured body', ok: true, power: 'phantom', feedback: 'A recommended starting point that moves with the player — with the owner’s OK.' },
      { id: 'd', label: 'Small condenser pushed into the sound hole for the most level', ok: false, power: 'phantom', feedback: 'Never insert a mic into the hole: it favours one resonance and risks the instrument.' },
      { id: 'e', label: 'Rely on the vocal mic’s bleed as the ukulele’s only mic', ok: false, power: 'phantom', feedback: 'A vocal mic’s bleed is not a reliable dedicated ukulele mic.' },
    ],
    reasons: [DOC_REASON, clearReason('the strumming arc, the fretting hand and the vocal mic'), POWER_REASON, { id: 'r.null', label: 'Aiming its rejection toward the wedge helps against feedback', role: 'optional', feedback: 'A fair live reason — though no position alone prevents feedback.' }, brandReason(UKE), LOUD_REASON],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point from its named point, clearance from the player and the vocal mic, power that matches the mic.',
  },
  {
    id: `${P}.prac.setup2`,
    page: 'practice',
    brief: 'BRIEF 2 · A quiet studio, a fingerpicked melody on a soprano. The only spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'Instrument dynamic 20–40 cm from the neck joint, a little off the hole’s axis', ok: true, power: 'none', feedback: 'A recommended starting point; a dynamic needs no phantom.' },
      { id: 'b', label: 'Instrument dynamic about 20 cm toward the sound hole, compared with the joint', ok: true, power: 'none', feedback: 'A recommended starting point; it needs no phantom. Listen for one booming note.' },
      { id: 'c', label: 'Small omni condenser a little back, for the room', ok: false, power: 'phantom', feedback: 'A fair idea in a good room — but this input has no phantom power.' },
      { id: 'd', label: 'Clip-on mini between the hole and the joint', ok: false, power: 'phantom', feedback: 'A miniature condenser needs phantom power, which this input does not have.' },
      { id: 'e', label: 'Instrument dynamic resting against the top for isolation', ok: false, power: 'none', feedback: 'Never press a mic against the instrument: it rattles, damps it and can mark it.' },
    ],
    reasons: [DOC_REASON, clearReason('the fingers, the fretting hand and the player’s view'), POWER_REASON, { id: 'r.noise', label: 'I will check finger squeaks and fret noise at this distance', role: 'optional', feedback: 'A fair reason for a fingerpicked piece.' }, brandReason(UKE), LOUD_REASON],
    explain: 'Two positions pass. What passes is the reasoning: a sensible starting point, clear of the player, powered by what this input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: what moves most of the air on a ukulele?', options: ['The nylon strings', 'The small top, driven by the bridge', 'The headstock'], after: 'Now STEP through the pluck (or PLAY ONCE) and watch what each event drives.' },
  placement: { prompt: 'Predict: you move the mic from the upper body toward the sound hole. What changes?', options: ['More string definition', 'More body and low-mid', 'It depends on this ukulele'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  ...STRINGS_PREDICT,
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'On a soprano ukulele, where does the neck meet the body?',
    options: ['At the 14th fret, like a steel-string guitar', 'At the sound hole, where the fingerboard ends', 'At the 12th fret — the middle of the open string'],
    correct: 'At the 12th fret — the middle of the open string',
    explain: 'This soprano’s neck joins at the 12th fret. Other sizes join at different places: use the actual instrument.',
    why: {
      'At the 14th fret, like a steel-string guitar': 'That is a steel-string dreadnought. This soprano joins at the 12th.',
      'At the sound hole, where the fingerboard ends': 'The neck joins the body at the 12th fret, short of the hole.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'Which ukulele sizes are common?',
    options: ['Only soprano: the others are guitars', 'Soprano, concert, tenor and baritone', 'Small and large, with the same tuning'],
    correct: 'Soprano, concert, tenor and baritone',
    explain: 'Four common sizes, from the small soprano to the baritone — with different bodies, scales and, for the baritone, often a different tuning.',
    why: {
      'Only soprano: the others are guitars': 'All four are ukuleles; they differ in body and scale.',
      'Small and large, with the same tuning': 'There are four common sizes, and tunings can differ.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'A string plucked exactly at its middle drives which of its shapes?',
    options: ['All of its shapes, each one just as hard', 'Only the even ones — the odd ones stay silent', 'Only the odd ones — the even ones stay silent'],
    correct: 'Only the odd ones — the even ones stay silent',
    explain: 'A pluck drives a shape only as much as the string moves at the finger; every even shape has a still point at the middle.',
    why: {
      'All of its shapes, each one just as hard': 'The finger touches one spot; a shape with a still point there is not driven at all.',
      'Only the even ones — the odd ones stay silent': 'The reverse: the even ones are still at the middle.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Why is the sound hole not the whole instrument?',
    options: ['The sound hole radiates nothing at all', 'The top radiates too, and the strings carry detail', 'Only the headstock makes the ukulele’s sound'],
    correct: 'The top radiates too, and the strings carry detail',
    explain: 'The top, driven by the bridge, radiates; the hole carries the body’s air; the strings and fingers add detail.',
    why: {
      'The sound hole radiates nothing at all': 'It carries the body’s air — part of the sound, not all of it.',
      'Only the headstock makes the ukulele’s sound': 'The headstock holds the tuners; the top and the body make the sound.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'What must a stand mic stay out of, round a singing ukulele player?',
    options: ['The strumming arc, the fretting hand and the vocal mic', 'The front of the ukulele, so the audience can see it clearly', 'The space behind the chair, where the cables run'],
    correct: 'The strumming arc, the fretting hand and the vocal mic',
    explain: 'The hand strums over a small body, the other hand frets a short neck, and the vocal mic is just above.',
    why: {
      'The front of the ukulele, so the audience can see it clearly': 'In front is usually where the mic goes. The player’s space is what to keep clear.',
      'The space behind the chair, where the cables run': 'Cables need a route, but the moving space is the player’s hands and the vocal mic.',
    },
  },
  hearingDiag(UKE),
];

export const C05C_LESSON: Lesson = {
  id: 'C05C',
  labId: 'strings',
  title: 'Ukulele',
  subtitle: 'A small body, a voice above — the upper body, the hole, or a clip',
  noun: { one: 'ukulele', many: 'ukuleles' },
  model: C05C_MODEL,
  micTypeIds: ['sdcCard', 'instDynCard', 'clipCond'],
  zones: C05C_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [setupOrder(P, UKE, 'Have the player stop; place it at the upper body; check the strumming arc and the vocal mic')],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A small four-string instrument with nylon strings, a wooden body and a round sound hole. The strings drive a bridge on the top; the top and the small body make the sound.', src: 'LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'Pop, folk and Hawaiian music, solo or with a singer — often the player sings too. This lesson covers studio recording and live sound.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Strummed rhythm, picked melodies and chord-melody. Ask about fingertips or a pick, a strap, singing and movement.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'This lab draws a soprano: a 34.5 cm (13.6 in) string length and a body about 24 cm long (drawn sizes). Concert, tenor and baritone ukuleles are larger, with longer strings — and the baritone often tuned differently.', src: 'MET-UKE' },
  ],
  sound: {
    stages: [
      { title: 'The finger pulls a string', text: 'A fingertip, a nail or a pick pulls a nylon string aside — or strums all four. That release is where the ATTACK begins.' },
      { title: 'The string swings', text: 'Released, the string swings between its two still ends — the saddle and the nut (or a fret). Its lowest shape is drawn here many times larger than it really moves.' },
      { title: 'The bridge drives the top', text: 'Each swing tugs at the saddle, so the bridge rocks and drives the small top.' },
      { title: 'Sound leaves', text: 'Sound leaves from the top and through the sound hole, where the small body’s air breathes. The ring that follows is the BODY of the sound.' },
    ],
    attack: 'The start of the note: the fingertip, nail or pick on the strings. Near the bridge and the strumming hand a mic hears more of it — and of fingernail noise.',
    body: 'The ring: the top and the body’s air. Toward the hole a mic hears more body; too close, one resonance. Both are tendencies; ukuleles vary.',
    head: { diameterMm: 50, rods: 0, label: 'the sound hole', strikeSrc: 'LESSON' },
  },
  setting: {
    items: [
      { id: 'player', label: 'the player and the ukulele', short: 'PLAYER', note: 'Seated, the ukulele held against the body; the strumming hand sweeps over it and the other hand frets a short neck.', prov: { kind: 'illustrative', reason: 'a typical seated posture' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'chair', label: 'the chair', short: 'CHAIR', note: 'Behind the player. Keep stand legs clear of the chair and the feet.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'FLOOR SPACE', scene: 'kit' },
      { id: 'vocal', label: 'the vocal mic (a singing player)', short: 'VOCAL MIC', note: 'Just above the ukulele, in front of the mouth. Spill between the two mics is expected: decide what matters more.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'di', label: 'DI box and pickup cable', short: 'DI', note: 'An installed pickup is an electrical path, not a mic. Use the input its instructions call for.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SIGNAL PATH', scene: 'kit' },
      { id: 'wedge', label: 'the player’s floor wedge (monitor)', short: 'WEDGE', note: 'In front of the player, facing back. A small, quiet instrument against a wedge: aim the rejection, and keep levels sane.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'band', label: 'the band: bass amp and drums', short: 'BAND', note: 'Upstage. A ukulele is quiet beside them: a close mic, a clip or the pickup gives control.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'stage', planIds: ['bassAmp', 'kit'] },
      { id: 'pa', label: 'the PA', short: 'PA', note: 'At the front corners, facing the audience.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FEEDBACK', scene: 'stage', planIds: ['paL', 'paR'] },
      { id: 'audience', label: 'the audience', short: 'AUDIENCE', note: 'Beyond the stage edge.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a quiet, good room one omni or a well-placed directional mic can present the ukulele naturally.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: a wedge in front, the band behind, the PA facing out — and the player’s voice right above. A close directional mic, a clip or the pickup gives control.',
    studio: 'STUDIO: no wedges, repeated trials when the player stops, and a good room that can show a small body well.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic setup for a given ukulele, player and room, describe an alternative position, and explain what would justify a second mic. With a real ukulele and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'uke', label: 'Ukulele (size, strings, pickup)', kind: 'text' },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser', 'dynamic', 'clip-on mini', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, aim, pattern and size', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The player’s posture and reach, and the seated height: drawing defaults. No HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The top’s, the strings’ and the bridge’s keep-off margins: illustrative.', dims: ['soprano'] },
    { text: 'The soprano body (240 long, bouts 160 / 115 / 130, depth 60), the sound hole (Ø 50 at 120) and the bout stations by the dreadnought’s proportions — drawing defaults; only the 34.5 cm string length is a museum soprano’s. The other sizes are named, not drawn.', dims: [] },
    { text: 'The 20–40 cm start is the lesson’s teaching trial (the cited guide gives no distance); the 20 cm hole start is the recording guide’s guitar row, which lists the ukulele.', dims: [] },
    { text: 'The body depth is a drawing default, so the app does not say which clip fits; the clip’s capsule height and reach, the mic sizes, the wedge and the band’s positions — drawing defaults.', dims: [] },
  ],
  live: { wedges: C05C_WEDGES },
  accuracyDetail: ACCURACY(UKE, 'one typical soprano ukulele'),
  copy: C05C_COPY,
};
