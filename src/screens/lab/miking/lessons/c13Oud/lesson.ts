/**
 * C13 OUD — the lesson's pages as DATA. Words from the owner's lesson
 * (docs/labs/miking/source_text/Oud-Miking-Technique.txt) with the research
 * fixes C13-01 … applied (CORRECTIONS_LOG.md): the starting points are the
 * oud's own (no longer the veena's copied trials), the far view has no
 * invented number, the hearing line is added. Starting-points voice; FULLY
 * SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, LessonPages, PageContent, SourcePageId, SetupTask, Symptom } from '../../engine/model/types.ts';
import { ACCURACY, brandReason, clearReason, contextChecks, DOC_REASON, hearingCheck, hearingDiag, LOUD_REASON, micChecks, POWER_REASON, practiceChecks, setupOrder, sharedSymptoms, STRINGS_PREDICT, twoMicChecks } from '../shared/guitars/stringsContent.ts';
import { C13_MODEL, C13_WEDGES, C13_ZONES } from './geometry.ts';
import { C13_COPY, OUD_N } from './copy.ts';
import { OUD } from '../shared/lutes/luteSpec.ts';

const P = 'oud';
const CLEAR = 'the risha’s arc, the left hand, the pegbox and the player’s view';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the oud',
    goal: 'Get to know the oud — a short-necked, fretless lute with a deep rounded bowl — what it is, where you meet it, what it does in the music, and its parts, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The risha plucks paired strings; the strings drive the bridge; the bridge drives the thin face; the face, the bowl’s air and three rosettes make the sound. No frets: the left hand’s slides are part of it.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a risha stroke becomes sound — the string, the bridge, the face and the air in the bowl — and where the sound leaves the oud.',
    credit: { scenarios: [`${P}.snd.1`, `${P}.snd.2`, `${P}.snd.3`], interactive: 'soundPath', note: 'Step the pluck through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The face, driven through the bridge, does most of the work; the bowl’s air breathes through the rosettes. The risha’s click starts each note; the bloom follows.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the space round an oud player — the risha arc, the left hand, the swinging pegbox, their voice — the other paths (a pickup), what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: [`${P}.set.1`, `${P}.set.2`, `${P}.set.3`], note: 'Answer the three checks.' },
    takeaway: 'The space round the oud is the player’s. A clip-on vibration pickup is a separate path, not a mic. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the oud by its properties — pattern, power, response, headroom and mount — not by its brand, and not by capsule size alone.',
    credit: { scenarios: [`${P}.mic.1`, `${P}.mic.3`, `${P}.mic.4`, `${P}.rec.1`], note: 'Answer the four checks (one reaches back to how the oud sounds).' },
    takeaway: 'A small condenser is a practical focused start, and a dynamic a fair stage choice — options, not a ranking. Choose by response, pattern, headroom and support.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — the upper face, between the main rose and the neck — measured from the point the starting point names, clear of the player, then move the mic and see what changes.',
    credit: { scenarios: [`${P}.place.1`, `${P}.place.2`, `${P}.place.3`, `${P}.rec.2`], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different suggested starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A suggested zone is a place to begin, measured from a named point. Distance, position and angle are separate things to try; listen to whole phrases, quiet and loud.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the floor wedge — and know what a pattern cannot do, and when a pickup earns its place.',
    credit: { scenarios: [`${P}.ctx.1`, `${P}.ctx.2`, `${P}.ctx.studio`, `${P}.rec.3`], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Aim a rejection at the monitor by the mic’s actual pattern. Players differ on air mics and pickups for loud stages — test the level the room needs. No mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why two paths on one oud can thin out the attack and the warmth, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: [`${P}.two.1`, `${P}.two.2`, `${P}.two.3`, `${P}.two.4`], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two paths hear the oud at different times, so their sum combs. Polarity flips the sign; it does not remove a delay. Judge the pair in mono at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — aim, distance, the room, the signal paths, gain, levels and polarity — before reaching for EQ.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one oud mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second path.',
    credit: { scenarios: [`${P}.prac.order`, `${P}.prac.gain`, `${P}.prac.setup1`, `${P}.prac.setup2`, `${P}.prac.3`, `${P}.mix.1`, `${P}.mix.2`, `${P}.mix.3`], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real oud.' },
    takeaway: 'Safe clearance from the player, correct power and level checks, honest labels for a pickup, pattern reasoning and polarity versus delay pass. A brand or a capsule size do not.',
  },
};

const scenarios: MikingScenario[] = [
  {
    id: `${P}.snd.1`,
    page: 'sound',
    prompt: 'Where does most of an oud’s sound leave from?',
    options: ['The face and the rosettes, driven through the bridge', 'The paired strings themselves, straight out into the room', 'The bent-back pegbox, which rings along with the strings'],
    correct: 'The face and the rosettes, driven through the bridge',
    explain: 'The strings move little air. They rock the bridge, the bridge drives the thin face, and the face and the bowl’s air breathing through the rosettes radiate most of the sound.',
    why: {
      'The paired strings themselves, straight out into the room': 'Strings are too thin to move much air on their own. They drive the bridge and the face.',
      'The bent-back pegbox, which rings along with the strings': 'The pegbox holds the strings; it makes little sound of its own.',
    },
  },
  {
    id: `${P}.snd.2`,
    page: 'sound',
    prompt: 'An open course is plucked exactly at its middle. Which of its shapes can that pluck set moving?',
    options: ['All of them equally, because the whole string moves', 'Only the even ones; the odd shapes stay silent', 'Only the odd ones; the even shapes stay silent'],
    correct: 'Only the odd ones; the even shapes stay silent',
    explain: 'A pluck drives a shape only as much as the string moves under the risha in that shape. Each even shape has a still point at the exact middle.',
    why: {
      'All of them equally, because the whole string moves': 'The risha touches one spot. A shape is driven only as much as the string moves there.',
      'Only the even ones; the odd shapes stay silent': 'The reverse: the even shapes have a still point at the middle.',
    },
  },
  {
    id: `${P}.snd.3`,
    page: 'sound',
    prompt: 'What does the oud’s deep, rounded bowl do for its sound?',
    options: ['It radiates most of the sound out toward the audience', 'It closes in the air that breathes out through the rosettes', 'It sets the pitch of each open string as it is tuned'],
    correct: 'It closes in the air that breathes out through the rosettes',
    explain: 'The bowl encloses the air that the face pumps in and out through the rosettes — a big part of the warm, low bloom. The face does most of the radiating; the strings’ tension and length set the pitch.',
    why: {
      'It radiates most of the sound out toward the audience': 'The bowl is stiff and rests against the player; the thin face does most of the radiating.',
      'It sets the pitch of each open string as it is tuned': 'Pitch comes from each string’s length, tension and weight — the pegs, not the bowl.',
    },
  },
  hearingCheck(P, OUD_N),
  {
    id: `${P}.set.2`,
    page: 'setting',
    prompt: 'A player clips a small capsule to the oud and calls it “my mic”. What do you check first?',
    options: ['Nothing: anything the player calls a mic is a mic for this lesson', 'Whether it hears the air or senses vibration, and how it is powered', 'Whether it is louder than a stand mic, so it can replace that mic'],
    correct: 'Whether it hears the air or senses vibration, and how it is powered',
    explain: 'Some clip-on devices are vibration pickups: they sense the instrument, not the air, and represent it differently. Label the path for what it is, and follow its own manual for power.',
    why: {
      'Nothing: anything the player calls a mic is a mic for this lesson': 'Players often say “mic” for a pickup. The maker’s description decides what the path is.',
      'Whether it is louder than a stand mic, so it can replace that mic': 'Level is not the question. A pickup is a different path, with its own tone and timing.',
    },
  },
  {
    id: `${P}.set.3`,
    page: 'setting',
    prompt: 'Before you place a stand mic for a seated oud player, what do you need from them?',
    options: ['The make of the oud, so you can look up its single correct spot', 'Their whole motion: the risha arc, the slides, the pegbox swing', 'Nothing yet: a starting point already says where the mic goes'],
    correct: 'Their whole motion: the risha arc, the slides, the pegbox swing',
    explain: 'A starting point is valid only where the player cannot hit the mic. Watch the whole phrase — risha strokes, tremolo, the left hand’s slides and how the pegbox moves.',
    why: {
      'The make of the oud, so you can look up its single correct spot': 'No make sets a mic position. The player’s motion and the sound wanted do.',
      'Nothing yet: a starting point already says where the mic goes': 'A starting point says where to begin — and only where the player stays clear.',
    },
  },
  {
    id: `${P}.rec.1`,
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic close to the main rosette hears more of which part of the sound?',
    options: ['The left hand’s slides, out at the end of the neck', 'The bowl’s air, breathing in and out through the rose', 'The pegs turning, up at the far end of the pegbox'],
    correct: 'The bowl’s air, breathing in and out through the rose',
    explain: 'The air inside the bowl moves through the rosettes — a big part of the bloom. Close to the main rose, a mic hears more of it, and some notes can bloom or hum.',
    why: {
      'The left hand’s slides, out at the end of the neck': 'That is toward the neck. At the rose, the bowl’s air dominates.',
      'The pegs turning, up at the far end of the pegbox': 'The pegbox is far from the rose and makes little sound of its own.',
    },
  },
  {
    id: `${P}.mic.1`,
    page: 'microphone',
    prompt: 'Which choice is a sound way to pick a mic for the oud?',
    options: ['By its capsule size: a larger one captures more of the body', 'By the brand most oud players are said to prefer for this', 'By its response, pattern, headroom and how it is held'],
    correct: 'By its response, pattern, headroom and how it is held',
    explain: 'A small condenser is a practical focused start; a large one, an omni in a quiet room and a dynamic on a stage are options, not a ranking. Read the response and pattern, check headroom, and listen.',
    why: {
      'By its capsule size: a larger one captures more of the body': 'Capsule size alone does not decide the tone. The complete response and pattern do — check and listen.',
      'By the brand most oud players are said to prefer for this': 'A brand is not a property. Choose by response, pattern, power and support.',
    },
  },
  {
    id: `${P}.mic.3`,
    page: 'microphone',
    prompt: 'The only spare input has no phantom power. Which of this page’s mics can you use?',
    options: ['The small condenser, if its cable run is kept short', 'The instrument dynamic: it needs no power at all', 'Either one, as long as the gain is turned up high'],
    correct: 'The instrument dynamic: it needs no power at all',
    explain: 'Dynamic mics need no power. The small condenser needs phantom power, whatever its cable or the gain setting.',
    why: {
      'The small condenser, if its cable run is kept short': 'Cable length does not power a condenser. Only the dynamic works without phantom.',
      'Either one, as long as the gain is turned up high': 'Gain cannot power a condenser. It needs phantom power to work at all.',
    },
  },
  ...micChecks(P, OUD_N).filter((s) => s.id === `${P}.mic.4`),
  {
    id: `${P}.place.1`,
    page: 'placement',
    prompt: 'A starting point says 30–45 cm out from the upper face. Your readout says 38 cm out from the main rose. Are you in it?',
    options: ['Yes: 38 cm falls inside the 30 to 45 cm band', 'Yes, as long as the mic is pointed straight at the oud’s face', 'Not necessarily: it is read from the upper face, not the rose'],
    correct: 'Not necessarily: it is read from the upper face, not the rose',
    explain: 'A distance means something only with its reference point. The upper face and the main rose are different places, so the same number puts the mic somewhere else.',
    why: {
      'Yes: 38 cm falls inside the 30 to 45 cm band': 'Same number, different point. The band is measured from the upper face.',
      'Yes, as long as the mic is pointed straight at the oud’s face': 'Aim is a separate check. The distance is read from the point the starting point names.',
    },
  },
  {
    id: `${P}.place.2`,
    page: 'placement',
    prompt: 'You turn the mic from the upper face further toward the neck. What tends to change?',
    options: ['More of the bowl’s bloom and the warm low notes', 'Only the level; the tone stays the same as before', 'More slides and finger noise, and less of the body'],
    correct: 'More slides and finger noise, and less of the body',
    explain: 'Toward the neck, a mic hears more of the left hand — slides, fingers — and less of the face and the bowl’s air. A little can be musical; too much takes over.',
    why: {
      'More of the bowl’s bloom and the warm low notes': 'That is the move toward the rose. The neck adds string and finger detail.',
      'Only the level; the tone stays the same as before': 'Turning toward a different part of the oud changes the balance, not only the level.',
    },
  },
  {
    id: `${P}.place.3`,
    page: 'placement',
    prompt: 'Why does this lesson give a farther room view no number?',
    options: ['The oud is too quiet to be miked from farther away', 'No oud research gives one: try it by ear in a good room', 'A far mic sounds much the same wherever in the room it is placed'],
    correct: 'No oud research gives one: try it by ear in a good room',
    explain: 'The oud-specific starting points are close-in ones. Farther back is worth trying where the room is pleasing and quiet — move back from the first start and listen for the oud and the room together.',
    why: {
      'The oud is too quiet to be miked from farther away': 'It can be — in a quiet, pleasing room. There is simply no researched distance to give.',
      'A far mic sounds much the same wherever in the room it is placed': 'Distance and the room change the sound a lot; that is why it is tried by ear.',
    },
  },
  {
    id: `${P}.rec.2`,
    page: 'placement',
    prompt: 'FROM EARLIER · What must a stand mic and its boom stay out of, round a seated oud player?',
    options: ['The front of the oud, so that the audience can see it clearly', 'The floor by the chair, which belongs to the vocal mic stand', 'The risha’s arc, the left hand, the pegbox and their view'],
    correct: 'The risha’s arc, the left hand, the pegbox and their view',
    explain: 'Clearance comes first: the risha hand over the face, the left hand along the neck, the pegbox that swings as the player moves, and the player’s view. Stop the player before anything moves.',
    why: {
      'The front of the oud, so that the audience can see it clearly': 'In front of the oud is usually where the mic goes. The space to protect is the player’s.',
      'The floor by the chair, which belongs to the vocal mic stand': 'Stands need a route, but the safety question is the player’s hands, the pegbox and their view.',
    },
  },
  ...contextChecks(P, OUD_N),
  {
    id: `${P}.ctx.studio`,
    page: 'context',
    prompt: 'A quiet studio with a pleasing room. What is a fair next step after the upper-face start?',
    options: ['Move in to 5 cm from the rose for the most detail possible', 'Try farther back and compare: the room may add to the oud', 'Add three more mics at once and choose later in the mix'],
    correct: 'Try farther back and compare: the room may add to the oud',
    explain: 'In a quiet, pleasing room, a farther position blends the oud with the room. Compare at matched levels, one change at a time — and check quiet notes and the direct-to-room balance.',
    why: {
      'Move in to 5 cm from the rose for the most detail possible': 'That close, the rose tends to boom and the tone changes with every move. Detail is not the only aim.',
      'Add three more mics at once and choose later in the mix': 'Several changes at once hide what each one does. Add a mic only for a stated purpose.',
    },
  },
  {
    id: `${P}.rec.3`,
    page: 'context',
    prompt: 'FROM EARLIER · Live, you move the mic close to the main rose for more level. What can come with it?',
    options: ['A thinner sound with less of the oud’s low end in it', 'More bloom and boom on some notes, from the bowl’s air', 'A drier attack, because the rose has no strings over it'],
    correct: 'More bloom and boom on some notes, from the bowl’s air',
    explain: 'The rose is where the bowl’s air breathes. Close to it, some notes bloom or hum — and a directional mic adds proximity bass on top. Angle off the rose if one booms.',
    why: {
      'A thinner sound with less of the oud’s low end in it': 'The reverse: close to the rose tends to bring more low end, not less.',
      'A drier attack, because the rose has no strings over it': 'The strings run over the main rose; the issue there is the bowl’s air.',
    },
  },
  ...twoMicChecks(P, OUD_N),
  ...practiceChecks(P, OUD_N, {
    quote: '30–45 cm from the upper face',
    right: 'The upper face, between the main rose and the neck',
    wrong1: 'The main rose, since that is the loudest place on the oud',
    wrong2: 'The bowl, measured round the back of the oud',
    explain: 'A distance belongs to the point it names: from the upper face, from the main rose and from the bridge are different places for the same number.',
  }),
];

const symptoms: Symptom[] = [
  {
    id: `${P}.sym.click`,
    observation: 'Too much risha click',
    firstChecks: 'Is the mic aimed straight at the plucking area, or very close? Aim less directly at it, or move a little farther back — and confirm the click is not musically intended.',
    options: ['Cut the high frequencies hard on the oud channel', 'Ask the player to change to a softer risha', 'Aim off the plucking area or back away a little'],
    correct: 'Aim off the plucking area or back away a little',
    explain: 'A close view of the risha region magnifies its click. Change the aim or distance first — and ask whether the articulation is part of the music.',
    why: {
      'Cut the high frequencies hard on the oud channel': 'EQ also dulls the oud itself. Fix the position first.',
      'Ask the player to change to a softer risha': 'The risha and the playing are the player’s. Change the mic, not the music.',
    },
  },
  {
    id: `${P}.sym.thin`,
    observation: 'Thin — all strings, no body',
    firstChecks: 'Is the mic aimed too far toward the neck? Turn toward more of the face, or move modestly toward the body, keeping clearance.',
    options: ['Turn toward more of the face, keeping the clearance', 'Turn the oud channel up until it sounds full', 'Add a second mic pointed straight into the main rose'],
    correct: 'Turn toward more of the face, keeping the clearance',
    explain: 'A view mostly of the strings and neck lacks the face and the bowl’s air. Include more of the face, then judge the whole phrase.',
    why: {
      'Turn the oud channel up until it sounds full': 'Louder is not fuller: the balance comes from where the mic is.',
      'Add a second mic pointed straight into the main rose': 'Fix the one mic first; a second brings its own combining problems — and the rose can boom.',
    },
  },
  {
    id: `${P}.sym.boom`,
    observation: 'Boomy low notes',
    firstChecks: 'Is the mic on the rose’s axis, or very close? Move off the rose, compare a little more distance, and check proximity effect and the room.',
    options: ['Boost the treble until the boom is no longer noticed', 'Move off the rose’s axis and compare a bit farther back', 'Swap to a mic with a much larger capsule instead'],
    correct: 'Move off the rose’s axis and compare a bit farther back',
    explain: 'Close to the rose, the bowl’s air and proximity effect pile up some notes. Move first; EQ only for a specific problem that is left.',
    why: {
      'Boost the treble until the boom is no longer noticed': 'EQ hides it without fixing it. Change the position first.',
      'Swap to a mic with a much larger capsule instead': 'Capsule size does not cure a position on the rose or a room’s build-up.',
    },
  },
  {
    id: `${P}.sym.finger`,
    observation: 'Finger noise dominates',
    firstChecks: 'Is the mic pointed at the neck? Redirect it toward the body, and compare whole phrases — not one note.',
    options: ['Gate the channel so it closes between the notes', 'Ask the player to stop sliding between the notes', 'Redirect toward the body and compare whole phrases'],
    correct: 'Redirect toward the body and compare whole phrases',
    explain: 'A mic aimed toward the neck hears the left hand most. Turn it toward the body; judge on whole phrases, where the slides belong to the music.',
    why: {
      'Gate the channel so it closes between the notes': 'A gate cuts the oud’s decay and the ornaments too. Fix the aim.',
      'Ask the player to stop sliding between the notes': 'The slides are the music on a fretless neck. Change the mic, not the playing.',
    },
  },
  ...sharedSymptoms(P, OUD_N),
];

const setupTasks: SetupTask[] = [
  {
    id: `${P}.prac.setup1`,
    page: 'practice',
    brief: 'BRIEF 1 · A small stage with a frame drum beside the oud and a floor wedge in front. One channel for the oud; phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser on the upper face, near the close end of the band, rear to the wedge', ok: true, power: 'phantom', feedback: 'A suggested starting point, aimed against the wedge, close enough to stand out from the drum.' },
      { id: 'b', label: 'Instrument dynamic close by the main rose, angled down, rear to the wedge', ok: true, power: 'none', feedback: 'A suggested stage start; watch the rose’s boom, and keep clear of the risha.' },
      { id: 'c', label: 'Small condenser closer to the face, about 20 cm, rear toward the wedge', ok: true, power: 'phantom', feedback: 'A suggested closer start: more definition against the drum, more risha click.' },
      { id: 'd', label: 'Small condenser 2 cm into the main rose, for the most low end', ok: false, power: 'phantom', feedback: 'That close, the rose booms unevenly, invites feedback — and the mic is in the risha’s way.' },
      { id: 'e', label: 'Small omni 1.5 m away, to hear the whole oud naturally', ok: false, power: 'phantom', feedback: 'On a stage beside a drum, an omni that far out hears the drum and the wedge as much as the oud.' },
    ],
    reasons: [DOC_REASON, clearReason(CLEAR), POWER_REASON, { id: 'r.paths', label: 'Any pickup the oud has is labelled as a separate path and checked with the mic', role: 'optional', feedback: 'A fair reason: they interact, and they are not the same thing.' }, brandReason(OUD_N), { id: 'r.big', label: 'A large capsule will capture the oud’s body best', role: 'wrong', feedback: 'Capsule size alone does not decide the tone. Check the response and listen.' }],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point from its named point, clearance from the player, power that matches the mic — and honest labels for any pickup.',
  },
  {
    id: `${P}.prac.setup2`,
    page: 'practice',
    brief: 'BRIEF 2 · A quiet studio, solo oud, a pleasing room. The only spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'Instrument dynamic 30–45 cm out from the upper face, aimed between the rose and the neck', ok: true, power: 'none', feedback: 'A suggested starting point; a dynamic needs no phantom. Then try a little farther back.' },
      { id: 'b', label: 'Instrument dynamic about 20 cm from the face, between the roses', ok: true, power: 'none', feedback: 'A suggested closer start; it needs no phantom. Watch the proximity bass.' },
      { id: 'c', label: 'Small condenser on the upper face, cardioid', ok: false, power: 'phantom', feedback: 'A fair position — but this input has no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'Small condenser with an omni capsule, farther back in the room', ok: false, power: 'phantom', feedback: 'A nice idea in this room — but a condenser needs phantom power, which this input does not have.' },
      { id: 'e', label: 'Instrument dynamic resting on the face under the strings', ok: false, power: 'none', feedback: 'Never rest a mic on the instrument: it damps the face, rattles and can mark the finish.' },
    ],
    reasons: [DOC_REASON, clearReason(CLEAR), POWER_REASON, { id: 'r.room', label: 'I will also try farther back, since the room is pleasing', role: 'optional', feedback: 'A fair studio reason: a good room can add to the oud.' }, brandReason(OUD_N), LOUD_REASON],
    explain: 'Two positions pass. What passes is the reasoning: a sensible starting point, clear of the player, powered by what this input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: what moves most of the air when an oud string is plucked?', options: ['The string itself', 'The face, driven by the bridge', 'The bowl’s outer shell'], after: 'Now STEP through the pluck (or PLAY ONCE) and watch what each event drives.' },
  placement: { prompt: 'Predict: you turn the mic from the upper face toward the main rose. What changes?', options: ['More finger detail', 'More body and bloom', 'It depends on this oud'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  ...STRINGS_PREDICT,
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'The oud’s neck has no frets. What does that mean for the sound a mic hears?',
    options: ['The oud can play only the notes of its open strings, one at a time', 'The strings are stopped by pegs along the neck instead of frets', 'The left hand’s slides, between the semitones too, are part of it'],
    correct: 'The left hand’s slides, between the semitones too, are part of it',
    explain: 'A fretless neck lets the left hand stop the string anywhere and slide between notes. Those slides and the fingers are part of the music — a mic toward the neck hears more of them.',
    why: {
      'The oud can play only the notes of its open strings, one at a time': 'The left hand stops the strings along the neck — any pitch, not only the open ones.',
      'The strings are stopped by pegs along the neck instead of frets': 'The pegs only tune the strings. The fingers stop them, directly on the fingerboard.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What are the oud’s three carved rosettes?',
    options: ['Decorations only, glued onto a solid and fully closed face', 'Openings that let the bowl’s air breathe in and out', 'Supports for the bridge, under the strings’ pull'],
    correct: 'Openings that let the bowl’s air breathe in and out',
    explain: 'The rosettes are carved lattices over sound holes: the bowl’s air moves through them, a big part of the warm bloom.',
    why: {
      'Decorations only, glued onto a solid and fully closed face': 'They are carved lattices over real openings in the face.',
      'Supports for the bridge, under the strings’ pull': 'The bridge sits low on the face; the rosettes are openings, not supports.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'A string plucked exactly at its middle drives which of its shapes?',
    options: ['All of its shapes, each one just as hard', 'Only the even ones — the odd ones stay silent', 'Only the odd ones — the even ones stay silent'],
    correct: 'Only the odd ones — the even ones stay silent',
    explain: 'A pluck drives a shape only as much as the string moves under the risha; each even shape has a still point at the middle.',
    why: {
      'All of its shapes, each one just as hard': 'The risha touches one spot; a shape with a still point there is not driven at all.',
      'Only the even ones — the odd ones stay silent': 'The reverse: the even ones are still at the middle.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Why might a mic right by the main rose make some notes boom?',
    options: ['The strings are thickest and loudest right over the rose', 'The bowl’s air breathes there, piling up some notes', 'The rose is where the face moves the most of all'],
    correct: 'The bowl’s air breathes there, piling up some notes',
    explain: 'The bowl’s air moves through the rose; close to it — with a directional mic’s proximity effect on top — some notes pile up more than others.',
    why: {
      'The strings are thickest and loudest right over the rose': 'The strings are the same all along. The rose is where the bowl’s air moves.',
      'The rose is where the face moves the most of all': 'The rose is an opening; the face moves most round the bridge.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'What must a stand mic stay out of, round a seated oud player?',
    options: ['The front of the oud, so the audience can see it clearly', 'The risha’s arc, the left hand, the pegbox and their view', 'The space behind the chair, where all of the cables are run'],
    correct: 'The risha’s arc, the left hand, the pegbox and their view',
    explain: 'The risha works over the face, the left hand along the neck, the pegbox swings as the player moves, and the player watches. In front of the oud is usually where a mic comes in.',
    why: {
      'The front of the oud, so the audience can see it clearly': 'In front is usually where the mic goes. The player’s space is what to keep clear.',
      'The space behind the chair, where all of the cables are run': 'Cables need a route, but the moving space is the player’s hands, the pegbox and their view.',
    },
  },
  hearingDiag(OUD_N),
];

export const C13_LESSON: Lesson = {
  id: 'C13',
  labId: 'strings',
  title: 'Oud',
  subtitle: 'A fretless lute with a deep bowl — the upper face, the face, the rose',
  noun: { one: 'oud', many: 'ouds' },
  model: C13_MODEL,
  micTypeIds: ['sdcCard', 'instDynCard'],
  zones: C13_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [setupOrder(P, OUD_N, 'Have the player stop; place it on the upper face; check the risha arc, the pegbox and the sight line')],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A plucked, short-necked lute: a thin wooden face with carved rosettes over a deep, rounded bowl built of thin staves, a bridge low on the face, and a fretless neck with its pegbox bent sharply back. It is played with a long plectrum, the risha.', src: 'MFA-NAHAT' },
    { title: 'WHERE YOU MEET IT', text: 'Across the music of the Middle East, North Africa and beyond — solo, with a singer, with frame drums and in larger ensembles; on stage and in the studio. This lesson covers studio recording and live sound.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Melody and ornament: quick risha strokes, tremolo, slides between notes — including notes between the semitones — and a warm, blooming low end. Ask how much risha click and finger movement belong in the sound.', src: 'MFA-NAHAT' },
    { title: 'ITS SIZE', text: 'This lab draws one typical oud: a face about 49 cm long and 36 cm wide, a bowl about 18 cm deep, a string length of about 60 cm, eleven strings in six courses (drawn sizes). Ouds, course counts and strings vary — check the one in front of you.', src: 'LESSON' },
  ],
  sound: {
    stages: [
      { title: 'The risha plucks', text: 'The risha pulls a course aside and lets it go — near the bridge, over the small roses. That release is where the ATTACK, the click at the start of the note, begins.' },
      { title: 'The string swings', text: 'Released, the string swings between its two still ends — the bridge and the nut, or the finger on the fretless neck. Its lowest shape is drawn here many times larger than it really moves.' },
      { title: 'The bridge drives the face', text: 'Each swing tugs at the bridge, so it rocks and drives the thin face. The face moves the air — the air inside the bowl too.' },
      { title: 'Sound leaves', text: 'Sound leaves from the face round the bridge and through the three rosettes, where the bowl’s air breathes in and out. The ringing that follows is the BODY of the note — the bloom.' },
    ],
    attack: 'The start of the note: the risha releasing a string — a click that can be quick and percussive. It is heard most directly near the plucking area; a very close mic there can make the attacks too percussive.',
    body: 'The note’s ring: the strings, the face and the bowl’s air together, leaving the face and the rosettes. A mic toward the main rose hears more bloom — and boom close in; toward the neck, more strings and slides. Tendencies; ouds vary.',
    head: { diameterMm: OUD.roseMainD.mm, rods: 0, label: 'the main rose', strikeSrc: 'MFA-NAHAT' },
  },
  setting: {
    items: [
      { id: 'player', label: 'the player and the oud', short: 'PLAYER', note: 'Seated, the bowl on the right thigh, the face to the audience, the neck to the left. The risha arc, the left hand, the swinging pegbox and the player’s view are theirs.', prov: { kind: 'illustrative', reason: 'a typical seated posture' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'chair', label: 'the chair', short: 'CHAIR', note: 'Behind the player. Keep stand legs clear of the chair and the player’s feet; mark its place and angle for a repeatable session.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'FLOOR SPACE', scene: 'kit' },
      { id: 'vocal', label: 'the vocal mic (a singing oud player)', short: 'VOCAL MIC', note: 'Above the oud, in front of the mouth. The voice reaches the oud mic and the oud reaches the vocal mic: plan both together.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'riq', label: 'the frame-drum player', short: 'FRAME DRUM', note: 'Beside the oud player. A riq’s jingles and a frame drum are loud and bright next to an oud — closer oud placement and the drum’s own mic help the balance.', prov: { kind: 'illustrative', reason: 'a typical small ensemble' }, tag: 'SPILL', scene: 'kit' },
      { id: 'wedge', label: 'the player’s floor wedge (monitor)', short: 'WEDGE', note: 'In front, facing back at the player. A mic aimed at the oud has it behind and below — aim a rejection at it.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'pa', label: 'the PA', short: 'PA', note: 'At the front corners, facing the audience. Its sound fills the stage and can ring through the oud’s body into a close mic.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FEEDBACK', scene: 'stage', planIds: ['paL', 'paR'] },
      { id: 'audience', label: 'the audience', short: 'AUDIENCE', note: 'Beyond the stage edge. The level the room needs decides how close a mic must be — or whether a pickup helps.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a quiet, pleasing room a farther mic blends the oud with the space. Listen to the room before you decide.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM', scene: 'studio' },
    ],
    stage: 'LIVE: a wedge in front, percussion beside, the PA facing out. Keep unneeded monitor sends low, and test the level the audience and the player need.',
    studio: 'STUDIO: no wedges, repeated trials when the player stops, and a room that can be part of the sound.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic setup for a given oud, player and room, describe an alternative position, and explain what would justify a second path. With a real oud and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'oud', label: 'Oud (courses, strings, risha)', kind: 'text' },
      { id: 'mic', label: 'Mic type and pattern', kind: 'choice', choices: ['small condenser', 'dynamic', 'large condenser', 'other'] },
      { id: 'paths', label: 'Other paths (a pickup)', kind: 'text' },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, and from which point', kind: 'text' },
      { id: 'notes', label: 'What you heard: risha, slides, bloom (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'Every oud dimension — face 490 × 360, bowl 180, string length 600, neck 200, pegbox 190 at 60°, the rosettes’ places and sizes — is a drawing default (oud/GEOMETRY_PROPOSAL.md: no oud dimension was read).', dims: [] },
    { text: 'The player’s posture and reach, and the seated height (the face’s centre line 70 cm above the floor): drawing defaults. No HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The keep-off margins (face 8 mm, strings 10 mm, bridge 6 mm) and the pegbox’s 25 cm swing: illustrative.', dims: ['oud'] },
    { text: 'The 20 cm face start is drawn ± 5 cm from “maybe 8 inches … more or less”; the stage start’s 6 cm nearest edge is the lab’s clearance.', dims: [] },
    { text: 'The wedge, the frame-drum player and the PA positions — a typical layout.', dims: [] },
  ],
  live: { wedges: C13_WEDGES },
  accuracyDetail: ACCURACY(OUD_N, 'one typical oud, every size drawn rather than measured'),
  copy: C13_COPY,
};
