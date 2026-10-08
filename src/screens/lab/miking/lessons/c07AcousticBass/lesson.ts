/**
 * C07 ACOUSTIC BASS GUITAR — the lesson's pages as DATA. Words from the
 * owner's lesson (docs/labs/miking/source_text/Acoustic-Bass-Guitar-Miking-
 * Technique.txt, "L<n>" in COMMENTS only) with the fixes AB-01 … applied
 * (CORRECTIONS_LOG.md). Starting-points voice; FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, LessonPages, PageContent, SourcePageId, SetupTask, Symptom } from '../../engine/model/types.ts';
import { ACCURACY, brandReason, clearReason, contextChecks, DOC_REASON, hearingCheck, hearingDiag, LOUD_REASON, micChecks, POWER_REASON, practiceChecks, setupOrder, sharedSymptoms, STRINGS_PREDICT, twoMicChecks } from '../shared/guitars/stringsContent.ts';
import { C07_MODEL, C07_WEDGES, C07_ZONES } from './geometry.ts';
import { BASS, C07_COPY } from './copy.ts';

const P = 'ab';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the acoustic bass guitar',
    goal: 'Get to know the acoustic bass guitar — a hollow-body bass played like a guitar — what it is, where you meet it, what it does in the music, and its parts, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Four heavy strings drive the bridge, the bridge drives the top, and the top and the air in the body make the sound. A pickup, if it has one, is a separate electrical path — not a microphone.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a pluck becomes sound — the string, the bridge, the top and the air in the body — and where the sound leaves the bass.',
    credit: { scenarios: [`${P}.snd.1`, `${P}.snd.2`, `${P}.snd.3`], interactive: 'soundPath', note: 'Step the pluck through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The top, driven through the bridge, does most of the work, and the air in the body breathes through the hole. The lowest notes are the hardest for a small body to radiate — listen for them.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the space round a bassist — both hands, the long neck, their voice — the other paths (pickup, DI, amp), what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: [`${P}.set.1`, `${P}.set.2`, `${P}.set.3`], note: 'Answer the three checks.' },
    takeaway: 'The space round the bass is the player’s. A pickup and a DI are another path, not a mic. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the acoustic bass by its properties — pattern, power, size and mount — not by its brand, and not by diaphragm size alone.',
    credit: { scenarios: [`${P}.mic.1`, `${P}.mic.2`, `${P}.mic.3`, `${P}.mic.4`, `${P}.rec.1`], note: 'Answer the five checks (one reaches back to how the bass sounds).' },
    takeaway: 'Pattern, power, size and mount decide what a mic can do here. A larger diaphragm does not by itself mean better bass — check the mic’s published response and listen. A mic’s maximum SPL is not a hearing limit.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — the upper body near the neck joint, measured from the point the starting point names, clear of the hands — then move the mic and see what changes.',
    credit: { scenarios: [`${P}.place.1`, `${P}.place.2`, `${P}.place.3`, `${P}.rec.2`], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin, measured from a named point — and for this instrument, borrowed from the guitar. Distance, position and angle are separate things to try; check the lowest notes every time.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the floor wedge — and know what a pattern cannot do, especially in the low end.',
    credit: { scenarios: [`${P}.ctx.1`, `${P}.ctx.2`, `${P}.ctx.studio`, `${P}.rec.3`], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Patterns reject least at low frequencies, and a bass is all low frequencies. On a loud stage the pickup often carries the level and a mic adds character. No mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why two paths on one bass can thin out the low end, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: [`${P}.two.1`, `${P}.two.2`, `${P}.two.3`, `${P}.two.4`], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two paths hear the bass at different times, so their sum combs — and the low end suffers first. Polarity flips the sign; it does not remove a delay. Judge the pair in mono at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — position, the room, the signal paths, gain, levels and polarity — and the monitoring, before reaching for EQ.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one bass mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second path.',
    credit: { scenarios: [`${P}.prac.order`, `${P}.prac.gain`, `${P}.prac.setup1`, `${P}.prac.setup2`, `${P}.prac.3`, `${P}.mix.1`, `${P}.mix.2`, `${P}.mix.3`], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real bass.' },
    takeaway: 'Safe clearance from the player, correct power and level checks, honest labels for every path, pattern reasoning and polarity versus delay pass. A brand or a “bigger diaphragm” reason do not.',
  },
};

const scenarios: MikingScenario[] = [
  {
    id: `${P}.snd.1`,
    page: 'sound',
    prompt: 'Where does most of an acoustic bass’s sound leave from?',
    options: ['The top and the sound hole, driven through the bridge', 'The heavy strings themselves, straight out into the room', 'The long neck, which vibrates along its whole length'],
    correct: 'The top and the sound hole, driven through the bridge',
    explain: 'Even heavy strings move little air. They rock the bridge, the bridge drives the top, and the top and the air breathing through the hole radiate most of the sound.',
    why: {
      'The heavy strings themselves, straight out into the room': 'Thicker strings still move little air on their own. They drive the bridge and the top.',
      'The long neck, which vibrates along its whole length': 'The neck carries the strings; the top and the body’s air make most of the sound.',
    },
  },
  {
    id: `${P}.snd.2`,
    page: 'sound',
    prompt: 'An open string is plucked exactly at its middle. Which of its shapes can that pluck set moving?',
    options: ['All of them equally, because the whole string moves', 'Only the even ones; the odd shapes stay silent', 'Only the odd ones; the even shapes stay silent'],
    correct: 'Only the odd ones; the even shapes stay silent',
    explain: 'A pluck drives a shape only as much as the string moves at the finger in that shape. Every even shape has a still point at the exact middle.',
    why: {
      'All of them equally, because the whole string moves': 'The finger touches one spot. A shape is driven only as much as the string moves there.',
      'Only the even ones; the odd shapes stay silent': 'The reverse: the even shapes have a still point at the middle.',
    },
  },
  {
    id: `${P}.snd.3`,
    page: 'sound',
    prompt: 'Why can the lowest notes of an acoustic bass seem weaker than the rest?',
    options: ['Its body radiates the deepest notes less strongly', 'The lowest string is plucked more softly than the rest', 'Low notes leave only through the headstock end'],
    correct: 'Its body radiates the deepest notes less strongly',
    explain: 'A body this size moves the air less efficiently at the lowest pitches, so they can sound weaker acoustically — check them in every position, and on monitors that can play them.',
    why: {
      'The lowest string is plucked more softly than the rest': 'The playing can be even; the body’s radiation is what thins the deepest notes.',
      'Low notes leave only through the headstock end': 'Low notes leave from the top and the hole like the rest — just less strongly.',
    },
  },
  hearingCheck(P, BASS),
  {
    id: `${P}.set.2`,
    page: 'setting',
    prompt: 'The bass has a pickup going to a DI. What is that path?',
    options: ['A microphone built into the bass for the stage', 'The same sound as the room mic, just louder', 'A separate electrical signal, not a microphone'],
    correct: 'A separate electrical signal, not a microphone',
    explain: 'A pickup turns string or top motion into an electrical signal; it does not hear the air round the bass. Label it as its own path — and an internal mic, if there is one, hears the inside of the body.',
    why: {
      'A microphone built into the bass for the stage': 'Some basses add an internal mic, but a pickup and its DI are an electrical path, not a mic.',
      'The same sound as the room mic, just louder': 'It hears something different from a mic outside: its own response and timing.',
    },
  },
  {
    id: `${P}.set.3`,
    page: 'setting',
    prompt: 'Before you place a stand mic for a seated bassist, what do you need from the player?',
    options: ['The make of the bass, so you can look up its single correct spot', 'Their whole motion — plucking, fretting, singing, any movement', 'Nothing: a starting point already says where the mic goes'],
    correct: 'Their whole motion — plucking, fretting, singing, any movement',
    explain: 'A starting point is valid only where the player cannot hit the mic or lose sight of the neck. Watch the whole part, including the lowest notes and any slaps or taps.',
    why: {
      'The make of the bass, so you can look up its single correct spot': 'No make sets a mic position. The player’s motion and the sound wanted do.',
      'Nothing: a starting point already says where the mic goes': 'A starting point says where to begin — and only where the player’s hands and view stay clear.',
    },
  },
  {
    id: `${P}.rec.1`,
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic close to the sound hole hears more of which part of the sound?',
    options: ['The fingers on the strings out on the neck', 'The air in the body, breathing through the hole', 'The tuners turning, way up at the far headstock end'],
    correct: 'The air in the body, breathing through the hole',
    explain: 'The air inside the body moves in and out through the hole — a big part of the low end. Close to it, a mic hears more of that, and boom that varies note to note.',
    why: {
      'The fingers on the strings out on the neck': 'That is nearer the neck. Over the hole, the body’s air dominates.',
      'The tuners turning, way up at the far headstock end': 'The headstock is far from the hole and makes little sound of its own.',
    },
  },
  {
    id: `${P}.mic.1`,
    page: 'microphone',
    prompt: 'Does a larger diaphragm mean a mic will capture the bass’s low notes better?',
    options: ['Yes: the bigger the diaphragm, the deeper the bass it hears', 'Not by itself: check its published response and listen', 'Yes, as long as it is a condenser and not a dynamic'],
    correct: 'Not by itself: check its published response and listen',
    explain: 'Diaphragm size alone does not settle it: the mic’s response, pattern, handling noise and the room all matter. Read the documentation, then listen on monitors that can reproduce the low notes.',
    why: {
      'Yes: the bigger the diaphragm, the deeper the bass it hears': 'Size alone does not decide low-frequency response. Check the published response.',
      'Yes, as long as it is a condenser and not a dynamic': 'The transducer type does not settle it either. Check and listen.',
    },
  },
  ...micChecks(P, BASS),
  {
    id: `${P}.place.1`,
    page: 'placement',
    prompt: 'A starting point says 20–45 cm from where the neck meets the body. Your readout says 30 cm out from the sound hole. Are you in it?',
    options: ['Yes: 30 cm falls inside the 20 to 45 cm band', 'Yes, as long as the mic is pointed straight at the top of the bass', 'Not necessarily: it is read from the neck joint, not the hole'],
    correct: 'Not necessarily: it is read from the neck joint, not the hole',
    explain: 'A distance means something only with its reference point. The neck joint and the sound hole are different places, so the same number puts the mic somewhere else.',
    why: {
      'Yes: 30 cm falls inside the 20 to 45 cm band': 'Same number, different point. The band is measured from the neck joint.',
      'Yes, as long as the mic is pointed straight at the top of the bass': 'Aim is a separate check. The distance is read from the point the starting point names.',
    },
  },
  {
    id: `${P}.place.2`,
    page: 'placement',
    prompt: 'You slide the mic from the neck joint toward the sound hole. What tends to change?',
    options: ['More string and finger detail, and less low end', 'More low-mid body, and boom that may vary by note', 'Only the level; the tone stays exactly the same'],
    correct: 'More low-mid body, and boom that may vary by note',
    explain: 'The hole is where the body’s air breathes: closer to it, more low-mid body — and some notes may boom while others do not. Compare across the range at matched levels.',
    why: {
      'More string and finger detail, and less low end': 'That is the move toward the neck. The hole adds body.',
      'Only the level; the tone stays exactly the same': 'Moving along the bass changes the balance, not only the level.',
    },
  },
  {
    id: `${P}.place.3`,
    page: 'placement',
    prompt: 'Why does this lesson call its starting distances “borrowed”?',
    options: ['The bass is too quiet to be miked from a distance at all', 'Little agreed guidance exists for this instrument', 'Its distances must match a guitar’s exactly to work'],
    correct: 'Little agreed guidance exists for this instrument',
    explain: 'The acoustic bass has little instrument-specific guidance, so these starting points borrow guitar positions as experiments — and say so. Verify them on the actual bass.',
    why: {
      'The bass is too quiet to be miked from a distance at all': 'It can be miked; the point is that the starting distances are borrowed and need checking.',
      'Its distances must match a guitar’s exactly to work': 'They are a place to begin, not a rule. The bass may want something else.',
    },
  },
  {
    id: `${P}.rec.2`,
    page: 'placement',
    prompt: 'FROM EARLIER · What must a stand mic and its boom stay out of, round a seated bassist?',
    options: ['The front of the bass, so that the audience can see it clearly', 'The floor by the chair, which belongs to the DI and its cable', 'Both hands, the long neck’s path and their view of it'],
    correct: 'Both hands, the long neck’s path and their view of it',
    explain: 'Clearance comes first: the plucking hand over the body, the fretting hand along a long neck, and the player’s view of it. Stop the player before anything moves.',
    why: {
      'The front of the bass, so that the audience can see it clearly': 'In front of the bass is usually where the mic goes. The space to protect is the player’s.',
      'The floor by the chair, which belongs to the DI and its cable': 'Cables need a safe route, but the safety question is the player’s hands and view.',
    },
  },
  ...contextChecks(P, BASS),
  {
    id: `${P}.ctx.studio`,
    page: 'context',
    prompt: 'In the studio one low note booms and another almost vanishes. What is a likely cause to check first?',
    options: ['The bass is broken and should go to a repairer', 'The mic is too good at hearing low notes overall', 'A room resonance at those pitches, or the mic’s spot'],
    correct: 'A room resonance at those pitches, or the mic’s spot',
    explain: 'Rooms build up some low pitches and cancel others at particular spots. Move the player or the mic and compare before reaching for EQ.',
    why: {
      'The bass is broken and should go to a repairer': 'Check the room and the position first; an uneven low end is usually the room.',
      'The mic is too good at hearing low notes overall': 'A good mic shows the room’s unevenness; the cause is where it and the bass sit.',
    },
  },
  {
    id: `${P}.rec.3`,
    page: 'context',
    prompt: 'FROM EARLIER · Why can a pattern’s rejection disappoint on a bass?',
    options: ['A bass makes no sound behind the mic at all', 'Real patterns reject least at low frequencies', 'Patterns only work on instruments with strings'],
    correct: 'Real patterns reject least at low frequencies',
    explain: 'A real mic’s rejection is weakest in the low end — exactly where a bass and a wedge carrying it are loudest. Use the null to aim, not to promise silence.',
    why: {
      'A bass makes no sound behind the mic at all': 'Sound reaches the mic from everywhere; the issue is how little a real null rejects low notes.',
      'Patterns only work on instruments with strings': 'Patterns work the same on any source; they reject least in the low end.',
    },
  },
  ...twoMicChecks(P, BASS),
  ...practiceChecks(P, BASS, {
    quote: '20–45 cm from the neck joint',
    right: 'The neck joint, not the sound hole or the bridge',
    wrong1: 'The sound hole, since that is the loudest place',
    wrong2: 'The back of the body, measured through the bass',
    explain: 'A distance belongs to the point it names: from the neck joint, from the hole and from the bridge are different places for the same number.',
  }),
];

const symptoms: Symptom[] = [
  {
    id: `${P}.sym.boom`,
    observation: 'Low notes boom or vary greatly from note to note',
    firstChecks: 'Is the mic on the hole, or in a room mode? Shift aim or the player’s position; compare notes and the room’s decay.',
    options: ['Boost the treble until the boom is no longer noticed', 'Shift the aim or the player; compare notes and the room', 'Swap to a different mic with a larger diaphragm instead'],
    correct: 'Shift the aim or the player; compare notes and the room',
    explain: 'Close to the hole, or at a room’s build-up spot, some notes pile up. Move first; EQ only for a specific problem.',
    why: {
      'Boost the treble until the boom is no longer noticed': 'EQ hides it without fixing it. Change the position first.',
      'Swap to a different mic with a larger diaphragm instead': 'A bigger diaphragm does not cure a room mode or a hole-bound position.',
    },
  },
  {
    id: `${P}.sym.thin`,
    observation: 'Attack without body',
    firstChecks: 'Is the mic too far toward the fingerboard? Include more of the top or the bridge region, or back up.',
    options: ['Turn the bass channel up until it sounds full', 'Include more of the top, or back up a little', 'Add a second mic aimed straight into the sound hole'],
    correct: 'Include more of the top, or back up a little',
    explain: 'A view mostly of the strings and neck lacks the body. Include more of the top, then judge in the mix.',
    why: {
      'Turn the bass channel up until it sounds full': 'Louder is not fuller: the balance comes from where the mic is.',
      'Add a second mic aimed straight into the sound hole': 'Fix the one mic first; a second brings its own combining problems.',
    },
  },
  {
    id: `${P}.sym.low`,
    observation: 'The lowest note seems absent',
    firstChecks: 'Is the mic, the room, a filter or the monitoring limiting it? Check the whole chain before an EQ boost.',
    options: ['Boost the sub-bass on the channel until you hear it', 'Ask the player to stop using the lowest string at all', 'Check the mic, room, any filter and the monitors first'],
    correct: 'Check the mic, room, any filter and the monitors first',
    explain: 'A high-pass filter, a small monitor or headphones, or a room null can all hide a low note that the bass is making. Find which before boosting.',
    why: {
      'Boost the sub-bass on the channel until you hear it': 'Boosting to make up for monitoring limits overloads the real system. Check the chain first.',
      'Ask the player to stop using the lowest string at all': 'The part is the player’s. Fix the chain, not the music.',
    },
  },
  ...sharedSymptoms(P, BASS),
];

const setupTasks: SetupTask[] = [
  {
    id: `${P}.prac.setup1`,
    page: 'practice',
    brief: 'BRIEF 1 · A loud stage with drums and a floor wedge. The acoustic bass has a pickup and a DI. One extra channel for a mic; phantom power is available.',
    setups: [
      { id: 'a', label: 'The pickup carries the level; a clip-on mini adds character, checked with it in mono', ok: true, power: 'phantom', feedback: 'A sensible live plan: dependable level from the pickup, a mic blended as far as feedback allows.' },
      { id: 'b', label: 'Instrument dynamic at the neck joint, its rear toward the wedge, blended with the pickup', ok: true, power: 'none', feedback: 'A recommended starting point, aimed against the wedge, checked against the pickup.' },
      { id: 'c', label: 'Small condenser near the neck joint, at the close end of the band, rear to the wedge', ok: true, power: 'phantom', feedback: 'A recommended starting point; on a loud stage keep it close and aimed.' },
      { id: 'd', label: 'Small condenser 3 cm into the sound hole, for the most low end', ok: false, power: 'phantom', feedback: 'At the hole it booms unevenly and invites feedback, and it is in the plucking hand’s path.' },
      { id: 'e', label: 'Small omni 1 m away, to hear the whole instrument naturally', ok: false, power: 'phantom', feedback: 'On a loud stage an omni that far out hears the drums and the wedge as much as the bass.' },
    ],
    reasons: [DOC_REASON, clearReason('both hands, the long neck and the player’s view'), POWER_REASON, { id: 'r.paths', label: 'The pickup and the mic are labelled as separate paths and checked together', role: 'optional', feedback: 'A fair reason: they interact, and they are not the same thing.' }, brandReason(BASS), { id: 'r.big', label: 'A large-diaphragm mic will capture the low end best', role: 'wrong', feedback: 'Diaphragm size alone does not decide low-end capture. Check the published response and listen.' }],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point from its named point, clearance from the player, power that matches the mic — and honest labels for the pickup path.',
  },
  {
    id: `${P}.prac.setup2`,
    page: 'practice',
    brief: 'BRIEF 2 · A quiet studio duet, bass and voice. The only spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'Instrument dynamic 20–45 cm out from the neck joint, angled to the top and strings', ok: true, power: 'none', feedback: 'A recommended starting point; a dynamic needs no phantom. Check the lowest notes.' },
      { id: 'b', label: 'Instrument dynamic about 30 cm from the treble side of the upper bout', ok: true, power: 'none', feedback: 'A borrowed starting point worth trying; it needs no phantom.' },
      { id: 'c', label: 'Small condenser at the neck joint, cardioid', ok: false, power: 'phantom', feedback: 'A fair position — but this input has no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'Clip-on mini between the neck joint and the hole', ok: false, power: 'phantom', feedback: 'A miniature condenser needs phantom power, which this input does not have.' },
      { id: 'e', label: 'Instrument dynamic pressed against the top under the bridge', ok: false, power: 'none', feedback: 'Never press a mic on the instrument: it rattles, damps the top and can mark the finish.' },
    ],
    reasons: [DOC_REASON, clearReason('both hands, the long neck and the player’s view'), POWER_REASON, { id: 'r.room', label: 'I will move the mic or the player if one low note booms in this room', role: 'optional', feedback: 'A fair studio reason: rooms are uneven in the low end.' }, brandReason(BASS), LOUD_REASON],
    explain: 'Two positions pass. What passes is the reasoning: a sensible starting point, clear of the player, powered by what this input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: what moves most of the air when a bass string is plucked?', options: ['The string itself', 'The top, driven by the bridge', 'The long neck'], after: 'Now STEP through the pluck (or PLAY ONCE) and watch what each event drives.' },
  placement: { prompt: 'Predict: you slide the mic from the neck joint toward the sound hole. What changes?', options: ['More string detail', 'More body and low end', 'It depends on this bass'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  ...STRINGS_PREDICT,
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'On this acoustic bass, where does the neck meet the body?',
    options: ['At the 12th fret, the same as a classical guitar', 'At the 17th fret — the 12th is far out on the neck', 'At the sound hole, where the fingerboard ends'],
    correct: 'At the 17th fret — the 12th is far out on the neck',
    explain: 'This cutaway body meets its 34 in neck at the 17th fret, so “the 12th fret” and “the neck joint” are far apart here.',
    why: {
      'At the 12th fret, the same as a classical guitar': 'That is a classical body. This bass joins at the 17th fret.',
      'At the sound hole, where the fingerboard ends': 'The fingerboard runs on over the body; the neck joins at the 17th fret.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'The bass has a pickup. What is it?',
    options: ['A microphone that hears the bass from outside', 'A part of the bridge that makes the top louder', 'A separate electrical path, not a microphone'],
    correct: 'A separate electrical path, not a microphone',
    explain: 'A pickup turns motion into an electrical signal; it does not hear the air round the bass. Label it as its own path.',
    why: {
      'A microphone that hears the bass from outside': 'A mic hears the air; a pickup senses the instrument electrically.',
      'A part of the bridge that makes the top louder': 'It does not change the acoustic sound; it is a separate output.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'A string plucked exactly at its middle drives which of its shapes?',
    options: ['All of its shapes, each one just as hard', 'Only the odd ones — the even ones stay silent', 'Only the even ones — the odd ones stay silent'],
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
    prompt: 'Why might a mic right at the sound hole make some low notes boom?',
    options: ['The strings are thickest and loudest over the hole', 'The hole is where the top moves least of all', 'The body’s air breathes there, piling up some notes'],
    correct: 'The body’s air breathes there, piling up some notes',
    explain: 'The body’s air moves through the hole; close to it, a directional mic’s proximity effect adds more — and some notes pile up more than others.',
    why: {
      'The strings are thickest and loudest over the hole': 'The strings are the same all along. The hole is where the body’s air moves.',
      'The hole is where the top moves least of all': 'The hole is an opening, not the top. The air through it is the point.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'What must a stand mic stay out of, round a seated bassist?',
    options: ['The front of the bass, so the audience can see it clearly', 'The space behind the chair, where the cables run', 'Both hands, the long neck and their view of it'],
    correct: 'Both hands, the long neck and their view of it',
    explain: 'The plucking hand works over the body, the fretting hand travels a long neck, and the player watches it. In front of the bass is usually where a mic comes in.',
    why: {
      'The front of the bass, so the audience can see it clearly': 'In front is usually where the mic goes. The player’s space is what to keep clear.',
      'The space behind the chair, where the cables run': 'Cables need a route, but the moving space is the player’s hands and view.',
    },
  },
  hearingDiag(BASS),
];

export const C07_LESSON: Lesson = {
  id: 'C07',
  labId: 'strings',
  title: 'Acoustic Bass Guitar',
  subtitle: 'A hollow-body bass: one mic, the pickup, and the lowest notes',
  noun: { one: 'bass', many: 'basses' },
  model: C07_MODEL,
  micTypeIds: ['sdcCard', 'instDynCard', 'clipCond'],
  zones: C07_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [setupOrder(P, BASS, 'Have the player stop; place it near the neck joint; check both hands and the sight line')],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A bass guitar with a hollow wooden body and a thin top, played horizontally like a guitar — not the upright double bass, and not a solid-body electric bass through an amp. Four heavy strings drive a bridge on the top; many also carry a pickup.', src: 'LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'Acoustic duos and bands, folk and unplugged sets, on stage and in the studio — often next to a guitar and a voice. This lesson covers studio recording and live sound.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'The low end and the pulse: roots, walking lines, sometimes slaps or taps on the body. Ask whether the part uses the lowest notes — on a standard tuning the open low string is E, about 41 Hz.', src: 'PHYS-ET' },
    { title: 'ITS SIZE', text: 'This lab draws a full-scale bass: a 34 in (86 cm) string length, the neck meeting a cutaway body at the 17th fret, a body about 51 cm long and 41 cm wide (drawn sizes). Smaller travel-size basses exist with much shorter strings.', src: 'MAR-BC16E' },
  ],
  sound: {
    stages: [
      { title: 'The finger pulls a string', text: 'A finger, a thumb or a pick pulls a heavy string aside and lets it go. That release is where the ATTACK — the thump or click at the start of the note — begins.' },
      { title: 'The string swings', text: 'Released, the string swings between its two still ends — the saddle and the nut (or a fret) — slowly, for a low note. Its lowest shape is drawn here many times larger than it really moves.' },
      { title: 'The bridge drives the top', text: 'Each swing tugs at the saddle, so the bridge rocks and drives the top. The top moves the air — inside the body too.' },
      { title: 'Sound leaves', text: 'Sound leaves from the top round the bridge and through the sound hole, where the body’s air breathes. A body this size radiates the deepest notes less strongly than the upper ones. The ringing that follows is the BODY of the note.' },
    ],
    attack: 'The start of the note: the finger, thumb or pick releasing a heavy string. It is heard most directly near the strings and the hands — a mic toward the neck hears more of it.',
    body: 'The note’s ring: the strings, the top and the body’s air together. Much of it leaves round the bridge and through the hole — a mic toward the hole hears more body, and boom close in. Both are tendencies, and basses vary.',
    head: { diameterMm: 105, rods: 0, label: 'the sound hole', strikeSrc: 'LESSON' },
  },
  setting: {
    items: [
      { id: 'player', label: 'the player and the bass', short: 'PLAYER', note: 'Seated, the bass on the thigh, a long neck to the player’s left. Both hands and their view of the neck are theirs.', prov: { kind: 'illustrative', reason: 'a typical seated posture' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'chair', label: 'the chair', short: 'CHAIR', note: 'Behind the player. Keep stand legs clear of the chair’s and the player’s feet.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'FLOOR SPACE', scene: 'kit' },
      { id: 'vocal', label: 'the vocal mic (a singing bassist)', short: 'VOCAL MIC', note: 'Above the bass, in front of the mouth. The voice reaches the bass mic and the bass reaches the vocal mic: plan both.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'di', label: 'DI box and pickup cable', short: 'DI', note: 'The pickup’s path: an electrical signal, not a microphone. On a loud stage it often carries the bass’s level. Route its cable clear of the feet.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SIGNAL PATH', scene: 'kit' },
      { id: 'wedge', label: 'the player’s floor wedge (monitor)', short: 'WEDGE', note: 'In front, facing back at the player. Its low end reaches a bass mic easily — patterns reject least in the lows.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'band', label: 'the band: amp and drums', short: 'BAND', note: 'Upstage. A kick drum and a bass share the low end: a mic on the acoustic bass hears the kick too.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'stage', planIds: ['bassAmp', 'kit'] },
      { id: 'pa', label: 'the PA', short: 'PA', note: 'At the front corners, facing the audience. Its low end fills the stage and can feed back through the bass’s body.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FEEDBACK', scene: 'stage', planIds: ['paL', 'paR'] },
      { id: 'audience', label: 'the audience', short: 'AUDIENCE', note: 'Beyond the stage edge. The stage level decides how close a mic must be — or whether the pickup carries the bass.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a studio the room builds up some low notes and thins others at particular spots: move the player or the mic before reaching for EQ.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM MODES', scene: 'studio' },
    ],
    stage: 'LIVE: a wedge in front, drums and amps behind, the PA facing out. On a loud stage the pickup often carries the level; a close mic adds what feedback allows.',
    studio: 'STUDIO: no wedges, repeated trials when the player stops, and a room whose low end is part of the sound — for better or worse.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic setup for a given bass, player and room, describe an alternative position, and explain what would justify a second path. With a real bass and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'bass', label: 'Bass (body, strings, pickup)', kind: 'text' },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser', 'dynamic', 'clip-on mini', 'other'] },
      { id: 'paths', label: 'Other paths (pickup, internal mic, amp)', kind: 'text' },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, and from which point', kind: 'text' },
      { id: 'notes', label: 'What you heard, low notes included (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The player’s posture and reach, and the seated height (the strings 65 cm above the floor): drawing defaults. No HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The body’s keep-off margins (top 8 mm, strings 10 mm, bridge 6 mm): illustrative.', dims: ['bass'] },
    { text: 'The body: length 510, lower bout 406, depth 115, waist and upper bout by the dreadnought’s ratios, bout stations by its proportions, the sound hole Ø 105 at 225 mm — drawing defaults (the maker page gives no body sizes).', dims: [] },
    { text: 'The 20–45 cm neck-joint start is the lesson’s teaching trial (no bass-specific source); the upper-bout start is a guitar engineer’s, used by analogy.', dims: [] },
    { text: 'The clip’s capsule height and reach, the mic sizes, the wedge and the band’s positions — drawing defaults.', dims: [] },
  ],
  live: { wedges: C07_WEDGES },
  accuracyDetail: ACCURACY(BASS, 'one typical cutaway body'),
  copy: C07_COPY,
};
