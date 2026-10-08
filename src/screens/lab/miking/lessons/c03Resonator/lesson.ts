/**
 * C03 RESONATOR GUITAR — the lesson's pages as DATA. Words from the owner's
 * lesson (docs/labs/miking/source_text/Resonator-Guitar-Dobro-Miking-
 * Technique.txt, "L<n>" in COMMENTS only) with the fixes RS-01 … applied
 * (CORRECTIONS_LOG.md). Starting-points voice; FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, LessonPages, PageContent, SourcePageId, SetupTask, Symptom } from '../../engine/model/types.ts';
import { ACCURACY, brandReason, clearReason, contextChecks, DOC_REASON, hearingCheck, hearingDiag, LOUD_REASON, micChecks, POWER_REASON, practiceChecks, setupOrder, sharedSymptoms, STRINGS_PREDICT, twoMicChecks } from '../shared/guitars/stringsContent.ts';
import { C03_MODEL, C03_WEDGES, C03_ZONES } from './geometry.ts';
import { C03_COPY, RESO } from './copy.ts';

const P = 'rs';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the resonator guitar',
    goal: 'Get to know the resonator guitar — square-neck played lap style, and round-neck played upright — what it is, where you meet it, its job, and its parts, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The strings drive a bridge on a thin metal cone, and the cone radiates through the coverplate and the ports. Look at the instrument — never open it — and ask how it will be played.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a pluck becomes sound — the string, the bridge, the cone under the coverplate — and where the sound leaves.',
    credit: { scenarios: [`${P}.snd.1`, `${P}.snd.2`, `${P}.snd.3`], interactive: 'soundPath', note: 'Step the pluck through to the end (or play it once), and answer the three checks.' },
    takeaway: 'It is still a string instrument: the strings start it. But a metal cone, not a wooden top, does most of the radiating — through the coverplate and the ports — and that is the resonator’s voice.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the space round a resonator player — the bar, the picking hand, the posture — what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: [`${P}.set.1`, `${P}.set.2`, `${P}.set.3`], note: 'Answer the three checks.' },
    takeaway: 'The bar, the picking hand and the player’s posture set the keep-clear space. Never touch the cone or the coverplate. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the resonator by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: [`${P}.mic.1`, `${P}.mic.2`, `${P}.mic.3`, `${P}.mic.4`, `${P}.rec.1`], note: 'Answer the five checks (one reaches back to how the resonator sounds).' },
    takeaway: 'A condenser can reveal detail; a dynamic is a robust close option; a clip-on mini moves with the instrument — never mounted on the cone or the coverplate. A mic’s maximum SPL is not a hearing limit.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — facing the coverplate and upper body, a little off the picking hand — then move the mic and see what changes.',
    credit: { scenarios: [`${P}.place.1`, `${P}.place.2`, `${P}.place.3`, `${P}.rec.2`], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin, read from the coverplate — there is no flat-top sound hole here. Move a few centimetres at a time, then change distance; the bar’s and the hand’s clearance comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the floor wedge — with the instrument face up in the lap — and know what a pattern cannot do.',
    credit: { scenarios: [`${P}.ctx.1`, `${P}.ctx.2`, `${P}.ctx.studio`, `${P}.rec.3`], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Aim the rejection by the actual pattern; a supercardioid has a small rear lobe. On a loud stage the pickup may carry the level. No mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why two views of one resonator can sound hollow together, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: [`${P}.two.1`, `${P}.two.2`, `${P}.two.3`, `${P}.two.4`], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two views hear the instrument at different times, so their sum combs. Polarity flips the sign; it does not remove a delay. One reliable mic first; a second only for a defined purpose.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — position, aim, the player’s movement, the paths, gain and polarity — and never the cone: a rattle goes to the owner or a repairer.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one resonator mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second channel.',
    credit: { scenarios: [`${P}.prac.order`, `${P}.prac.gain`, `${P}.prac.setup1`, `${P}.prac.setup2`, `${P}.prac.3`, `${P}.mix.1`, `${P}.mix.2`, `${P}.mix.3`], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real instrument.' },
    takeaway: 'A stable, playable position, power and level checks, a mono check of any blend, and no contact with the resonator hardware pass. A brand or a “loudest spot” do not.',
  },
};

const scenarios: MikingScenario[] = [
  {
    id: `${P}.snd.1`,
    page: 'sound',
    prompt: 'What does most of the radiating on a resonator guitar?',
    options: ['A metal cone under the coverplate, driven by the bridge', 'The strings themselves, straight out into the whole room', 'The wooden back, against the player’s body'],
    correct: 'A metal cone under the coverplate, driven by the bridge',
    explain: 'The bridge sits on a thin spun-metal cone; the cone works like a loudspeaker, and its sound leaves through the coverplate and the ports. The strings still start it all.',
    why: {
      'The strings themselves, straight out into the whole room': 'Strings move little air. They drive the bridge and the cone.',
      'The wooden back, against the player’s body': 'The back is closed off by the player; the cone, under the coverplate, radiates most.',
    },
  },
  {
    id: `${P}.snd.2`,
    page: 'sound',
    prompt: 'An open string is plucked exactly at its middle. Which of its shapes can that pluck set moving?',
    options: ['All of them equally, because the whole string moves', 'Only the even ones; the odd shapes stay silent', 'Only the odd ones; the even shapes stay silent'],
    correct: 'Only the odd ones; the even shapes stay silent',
    explain: 'A pluck drives a shape only as much as the string moves at the pick in that shape. Every even shape has a still point at the exact middle.',
    why: {
      'All of them equally, because the whole string moves': 'The pick touches one spot. A shape is driven only as much as the string moves there.',
      'Only the even ones; the odd shapes stay silent': 'The reverse: the even shapes have a still point at the middle.',
    },
  },
  {
    id: `${P}.snd.3`,
    page: 'sound',
    prompt: 'Is a resonator with one cone the same sound source as one with three?',
    options: ['Yes: resonators all radiate in exactly the same way', 'Yes, as long as the coverplates look the same', 'No: one cone and three cones radiate differently'],
    correct: 'No: one cone and three cones radiate differently',
    explain: 'A spider-bridge single cone, a biscuit-bridge single cone and a three-cone design do not present the same sound field. Look at the instrument — without opening it — and test by ear.',
    why: {
      'Yes: resonators all radiate in exactly the same way': 'Designs differ: one cone or three, spider or biscuit bridge, the body and its ports.',
      'Yes, as long as the coverplates look the same': 'What is under the coverplate decides it. Listen round the instrument first.',
    },
  },
  hearingCheck(P, RESO),
  {
    id: `${P}.set.2`,
    page: 'setting',
    prompt: 'Lap style, the coverplate faces up. Where does the mic’s stand come from?',
    options: ['Straight down from above, right over the middle of the cone', 'A boom from the side, clear of the bar and the picking hand', 'Clamped to the coverplate, so it moves with the instrument'],
    correct: 'A boom from the side, clear of the bar and the picking hand',
    explain: 'Bring a boom in from the side so the capsule sees the instrument without crossing the bar’s path, the picking hand or the player leaning over it. Confirm their full reach first.',
    why: {
      'Straight down from above, right over the middle of the cone': 'That puts the stand in the player’s space, and aiming at the cone’s centre is one experiment, not a rule.',
      'Clamped to the coverplate, so it moves with the instrument': 'Never clamp to the coverplate or the cone: they are delicate, and part of the sound.',
    },
  },
  {
    id: `${P}.set.3`,
    page: 'setting',
    prompt: 'You hear a rattle from the coverplate during soundcheck. What do you do?',
    options: ['Open the coverplate and tighten the cone’s screw', 'Stop, and ask the owner or a qualified repairer', 'Move the mic closer to hear where the rattle is'],
    correct: 'Stop, and ask the owner or a qualified repairer',
    explain: 'Check whether it persists with the mic muted; if it does, it belongs to the instrument. Never open the coverplate or adjust the cone, bridge or screws for a mic problem.',
    why: {
      'Open the coverplate and tighten the cone’s screw': 'The cone is delicate and its setup is model-specific. That is never a miking step.',
      'Move the mic closer to hear where the rattle is': 'A rattle is the instrument’s to fix, not the mic’s. Stop and hand it over.',
    },
  },
  {
    id: `${P}.rec.1`,
    page: 'microphone',
    prompt: 'FROM EARLIER · Where does the cone’s sound leave the instrument?',
    options: ['Through a round sound hole, just under the strings', 'Through the headstock, at the end of the neck', 'Through the coverplate’s holes and the sound ports'],
    correct: 'Through the coverplate’s holes and the sound ports',
    explain: 'There is no flat-top sound hole here: the cone radiates through the perforated coverplate, and the air inside also leaves through the ports on the upper body.',
    why: {
      'Through a round sound hole, just under the strings': 'That is a flat-top guitar. A resonator has a coverplate and ports instead.',
      'Through the headstock, at the end of the neck': 'The headstock holds the tuners; the cone radiates through the coverplate.',
    },
  },
  {
    id: `${P}.mic.1`,
    page: 'microphone',
    prompt: 'A cardioid condenser or a dynamic on the resonator: how do you choose?',
    options: ['Only a condenser: a dynamic cannot hear a metal cone properly', 'By the job: detail in a quiet room, robustness on a loud stage', 'By the brand most players use, since it suits the cone best of all'],
    correct: 'By the job: detail in a quiet room, robustness on a loud stage',
    explain: 'A cardioid condenser can reveal detail; a dynamic can be a robust close option. Choose for sensitivity, pattern, stage level and the tone wanted.',
    why: {
      'Only a condenser: a dynamic cannot hear a metal cone properly': 'Dynamics are used close on resonators too. Choose by the job.',
      'By the brand most players use, since it suits the cone best of all': 'Choose by properties and listening, not by a brand.',
    },
  },
  ...micChecks(P, RESO),
  {
    id: `${P}.place.1`,
    page: 'placement',
    prompt: 'The guitar starting points say “near the sound hole”. Why can’t you copy that onto a resonator as it is?',
    options: ['Resonators are much too loud to be miked with a stand at all', 'It has a coverplate over a cone, not a flat-top sound hole', 'Its sound leaves only from the back, toward the player'],
    correct: 'It has a coverplate over a cone, not a flat-top sound hole',
    explain: 'A flat-top’s sound-hole picture does not transfer literally: the cone radiates through the coverplate and the ports. Listen round the instrument, then begin at the coverplate and upper body.',
    why: {
      'Resonators are much too loud to be miked with a stand at all': 'They are miked with stands all the time; the reference point is the coverplate.',
      'Its sound leaves only from the back, toward the player': 'Most of it leaves through the coverplate and the ports, toward the listener.',
    },
  },
  {
    id: `${P}.place.2`,
    page: 'placement',
    prompt: 'The sound is piercing and metallic. What is a good first move?',
    options: ['Cut the treble hard on the channel until the sound softens', 'Move off that coverplate spot, change angle, or step back', 'Move even closer, right onto the middle of the cone'],
    correct: 'Move off that coverplate spot, change angle, or step back',
    explain: 'Very close to one spot of the coverplate hears a narrow, sharp view. Move off it a few centimetres, change the angle, or take a broader view.',
    why: {
      'Cut the treble hard on the channel until the sound softens': 'EQ hides the symptom; the position is the cause. Move first.',
      'Move even closer, right onto the middle of the cone': 'Closer to one spot makes it narrower still.',
    },
  },
  {
    id: `${P}.place.3`,
    page: 'placement',
    prompt: 'The sound is thin and all pick. What is the mic probably hearing?',
    options: ['Too much of the cone and too little of the strings', 'Mostly the strings and neck, too little of the cone', 'The room only, because it is much too far away'],
    correct: 'Mostly the strings and neck, too little of the cone',
    explain: 'A view dominated by the strings and the neck misses the cone. Include more of the off-centre coverplate region, or move back slightly.',
    why: {
      'Too much of the cone and too little of the strings': 'That tends to sound metallic and sharp, not thin and all pick.',
      'The room only, because it is much too far away': 'A distant mic sounds roomy, not all pick. The view is the problem.',
    },
  },
  {
    id: `${P}.rec.2`,
    page: 'placement',
    prompt: 'FROM EARLIER · What must the mic and its boom stay out of, lap style?',
    options: ['The front of the instrument, so the audience can see it', 'The floor by the chair, which belongs to the DI box', 'The bar’s path, the picking hand and the leaning player'],
    correct: 'The bar’s path, the picking hand and the leaning player',
    explain: 'The bar travels the whole neck, the picking hand works over the coverplate, and the player leans over the instrument. A bar or an arm must never be able to hit the mic.',
    why: {
      'The front of the instrument, so the audience can see it': 'The front side is usually where the boom comes in. The space to protect is the player’s.',
      'The floor by the chair, which belongs to the DI box': 'Cables need a route, but the safety question is the bar, the hand and the player.',
    },
  },
  ...contextChecks(P, RESO),
  {
    id: `${P}.ctx.studio`,
    page: 'context',
    prompt: 'In the studio, when does a second mic make sense on the resonator?',
    options: ['Whenever the room is large enough to hold two mic stands', 'When the first mic is quieter than the other channels', 'When it adds a distinct view, such as a farther overall one'],
    correct: 'When it adds a distinct view, such as a farther overall one',
    explain: 'One reliable mic first. A second earns its place with a distinct purpose — a closer cone view plus a farther overall view — and a check in mono.',
    why: {
      'Whenever the room is large enough to hold two mic stands': 'Room for a stand is not a reason. A second view needs a purpose.',
      'When the first mic is quieter than the other channels': 'Level comes from gain, not from another mic.',
    },
  },
  {
    id: `${P}.rec.3`,
    page: 'context',
    prompt: 'FROM EARLIER · The pickup and the mic are both live. What is the pickup?',
    options: ['A second microphone hidden inside the coverplate', 'A separate electrical path, not a microphone hearing air', 'The same signal as the mic, sent along a cable'],
    correct: 'A separate electrical path, not a microphone hearing air',
    explain: 'A cone or bridge pickup, or an imaging pedal’s output, is an electrical source — not a capsule hearing the air. Label it, and check it with the mic in mono.',
    why: {
      'A second microphone hidden inside the coverplate': 'A pickup senses the instrument electrically; it does not hear the air.',
      'The same signal as the mic, sent along a cable': 'It has its own response and timing — which is why the blend needs a mono check.',
    },
  },
  ...twoMicChecks(P, RESO),
  ...practiceChecks(P, RESO, {
    quote: '20–45 cm from the coverplate',
    right: 'The coverplate, facing it and the upper body',
    wrong1: 'The headstock, since that is easy to see',
    wrong2: 'The back of the body, under the player',
    explain: 'A distance belongs to the point it names: here the coverplate. On a resonator there is no flat-top sound hole to read from.',
  }),
];

const symptoms: Symptom[] = [
  {
    id: `${P}.sym.thin`,
    observation: 'A thin, all-pick sound',
    firstChecks: 'Is the mic dominated by the strings and neck? Include more of the off-centre resonator area, or move back slightly.',
    options: ['Turn the channel up until the thin sound feels full again', 'Include more of the off-centre coverplate, or move back', 'Add a second mic aimed at the strings near the neck'],
    correct: 'Include more of the off-centre coverplate, or move back',
    explain: 'A view of the strings and neck misses the cone. Change the view first.',
    why: {
      'Turn the channel up until the thin sound feels full again': 'Louder is not fuller: the balance comes from where the mic is.',
      'Add a second mic aimed at the strings near the neck': 'That adds more of what is already too much. Fix the one mic first.',
    },
  },
  {
    id: `${P}.sym.metal`,
    observation: 'A piercing, metallic tone',
    firstChecks: 'Is the mic extremely close to one coverplate region? Move off that spot, change angle, or take a broader view.',
    options: ['Cut the high frequencies hard until it is quite dull', 'Move the mic right onto the cone’s centre', 'Move off that spot, change the angle, or step back'],
    correct: 'Move off that spot, change the angle, or step back',
    explain: 'One close spot gives a narrow, sharp view. Move, then judge.',
    why: {
      'Cut the high frequencies hard until it is quite dull': 'EQ dulls the whole instrument; the position is the cause.',
      'Move the mic right onto the cone’s centre': 'Closer to one spot is narrower still — and never touch the coverplate.',
    },
  },
  {
    id: `${P}.sym.move`,
    observation: 'The tone changes while the player plays',
    firstChecks: 'Does the instrument rotate or slide away? Work with the player’s normal movement; use a suitable clip or the pickup if needed.',
    options: ['Ask the player to sit completely still for the whole of the set', 'Turn the mic up whenever they turn away from it', 'Work with their movement; try a suitable clip or the pickup'],
    correct: 'Work with their movement; try a suitable clip or the pickup',
    explain: 'Players move. Mark a comfortable playing zone, or use a mount that moves with the instrument.',
    why: {
      'Ask the player to sit completely still for the whole of the set': 'The performance comes first. Adapt the mic to it.',
      'Turn the mic up whenever they turn away from it': 'Riding the fader cannot follow every move; change the mount or the zone.',
    },
  },
  ...sharedSymptoms(P, RESO),
];

const setupTasks: SetupTask[] = [
  {
    id: `${P}.prac.setup1`,
    page: 'practice',
    brief: 'BRIEF 1 · A square-neck resonator played lap style on a fairly loud bluegrass stage, a wedge in front. One channel; phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser on a boom from the side, 20–45 cm from the coverplate, rear toward the wedge', ok: true, power: 'phantom', feedback: 'A recommended starting point, from the side, clear of the bar and hand, aimed against the wedge.' },
      { id: 'b', label: 'Instrument dynamic on a side boom, about 20 cm from the coverplate, off the picking hand', ok: true, power: 'none', feedback: 'A robust close option at a recommended starting point.' },
      { id: 'c', label: 'Clip-on mini on a suitable body clip, capsule toward the coverplate’s edge', ok: true, power: 'phantom', feedback: 'A recommended starting point that moves with the instrument — never on the cone.' },
      { id: 'd', label: 'Mic stand straight up over the cone, 5 cm above its centre', ok: false, power: 'phantom', feedback: 'In the player’s and the bar’s space, and one close spot sounds narrow. Come in from the side.' },
      { id: 'e', label: 'Clip the mini onto the coverplate itself, aimed at the cone', ok: false, power: 'phantom', feedback: 'Never mount on the coverplate or the cone: they are delicate and part of the sound.' },
    ],
    reasons: [DOC_REASON, clearReason('the bar, the picking hand and the leaning player'), POWER_REASON, { id: 'r.null', label: 'Aiming its rejection toward the wedge helps against feedback', role: 'optional', feedback: 'A fair live reason — though no position alone prevents feedback.' }, brandReason(RESO), LOUD_REASON],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point from the coverplate, clearance from the bar and the hands, power that matches the mic — and nothing on the resonator hardware.',
  },
  {
    id: `${P}.prac.setup2`,
    page: 'practice',
    brief: 'BRIEF 2 · A quiet studio, a round-neck resonator played upright. The only spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'Instrument dynamic 20–45 cm from the coverplate and upper body, a little off the picking hand', ok: true, power: 'none', feedback: 'A recommended starting point; a dynamic needs no phantom.' },
      { id: 'b', label: 'Instrument dynamic about 20 cm from the coverplate, compared with a broader view', ok: true, power: 'none', feedback: 'A recommended starting point; it needs no phantom.' },
      { id: 'c', label: 'Small condenser facing the coverplate', ok: false, power: 'phantom', feedback: 'A fair position — but this input has no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'Clip-on mini near the coverplate’s edge', ok: false, power: 'phantom', feedback: 'A miniature condenser needs phantom power, which this input does not have.' },
      { id: 'e', label: 'Instrument dynamic resting on the coverplate, aimed into its holes', ok: false, power: 'none', feedback: 'Never rest anything on the coverplate. Keep the mic off the hardware.' },
    ],
    reasons: [DOC_REASON, clearReason('the bar or slide, the picking hand and the player’s turn'), POWER_REASON, { id: 'r.listen', label: 'I will listen round the instrument before committing to a spot', role: 'optional', feedback: 'A fair reason: the cone and the ports radiate differently.' }, brandReason(RESO), LOUD_REASON],
    explain: 'Two positions pass. What passes is the reasoning: a sensible starting point from the coverplate, clear of the player, powered by what this input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: what moves most of the air on a resonator?', options: ['The strings themselves', 'A metal cone, driven by the bridge', 'The wooden back'], after: 'Now STEP through the pluck (or PLAY ONCE) and watch what each event drives.' },
  placement: { prompt: 'Predict: you move the mic from about 30 cm out to about 20 cm from the coverplate. What changes?', options: ['More of the cone’s metallic voice', 'More of the room', 'It depends on this resonator'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  ...STRINGS_PREDICT,
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What is under a resonator guitar’s coverplate?',
    options: ['A round sound hole like a flat-top guitar', 'A thin metal cone the bridge sits on', 'A pickup that makes the instrument louder'],
    correct: 'A thin metal cone the bridge sits on',
    explain: 'The bridge sits on one or more spun-metal cones; the coverplate protects them and lets their sound out.',
    why: {
      'A round sound hole like a flat-top guitar': 'A resonator has a coverplate and ports, not a flat-top sound hole.',
      'A pickup that makes the instrument louder': 'Some have a pickup, but the cone is what is under every coverplate.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'How is a square-neck resonator usually played?',
    options: ['Face up across the lap, the strings stopped with a bar', 'Upright like a guitar, fretted with the fingers', 'Standing on the floor, bowed like a cello'],
    correct: 'Face up across the lap, the strings stopped with a bar',
    explain: 'Square-neck resonators are built for lap style: face up, a steel bar on the strings. Round-neck ones are played upright.',
    why: {
      'Upright like a guitar, fretted with the fingers': 'That is the round-neck kind. The square neck is for lap style.',
      'Standing on the floor, bowed like a cello': 'It is plucked, not bowed — and it lies in the lap.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'A string plucked exactly at its middle drives which of its shapes?',
    options: ['All of its shapes, each one just as hard', 'Only the odd ones — the even ones stay silent', 'Only the even ones — the odd ones stay silent'],
    correct: 'Only the odd ones — the even ones stay silent',
    explain: 'A pluck drives a shape only as much as the string moves at the pick; every even shape has a still point at the middle.',
    why: {
      'All of its shapes, each one just as hard': 'The pick touches one spot; a shape with a still point there is not driven at all.',
      'Only the even ones — the odd ones stay silent': 'The reverse: the even ones are still at the middle.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Where does a resonator’s sound mostly leave from?',
    options: ['A round sound hole between the bridge and neck', 'The back, toward the player’s body', 'The coverplate’s holes and the sound ports'],
    correct: 'The coverplate’s holes and the sound ports',
    explain: 'The cone radiates through the perforated coverplate; the ports let the body’s air out too.',
    why: {
      'A round sound hole between the bridge and neck': 'That is a flat-top. A resonator radiates through its coverplate and ports.',
      'The back, toward the player’s body': 'The back faces the player and radiates little.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'You notice a loose screw on the cone during setup. What do you do?',
    options: ['Tighten it a little, so it stops rattling into the mic', 'Tape the coverplate down so the rattle is muffled', 'Leave it, and tell the owner or a qualified repairer'],
    correct: 'Leave it, and tell the owner or a qualified repairer',
    explain: 'The cone and its hardware are delicate and model-specific. Never adjust them as part of miking.',
    why: {
      'Tighten it a little, so it stops rattling into the mic': 'Cone setup is not a miking step. Hand it to the owner or a repairer.',
      'Tape the coverplate down so the rattle is muffled': 'Taping or blocking the coverplate damps the sound and can mark the finish.',
    },
  },
  hearingDiag(RESO),
];

export const C03_LESSON: Lesson = {
  id: 'C03',
  labId: 'strings',
  title: 'Resonator Guitar',
  subtitle: 'Square neck in the lap, round neck upright — the cone under the coverplate',
  noun: { one: 'resonator', many: 'resonators' },
  model: C03_MODEL,
  micTypeIds: ['sdcCard', 'instDynCard', 'clipCond'],
  zones: C03_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [setupOrder(P, RESO, 'Have the player stop; place it facing the coverplate from the side; check the bar and hands')],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A guitar whose strings drive a bridge on a thin metal cone — one cone, or three — under a perforated metal coverplate. The cone radiates like a loudspeaker, giving a bright, metallic, cutting voice. It is still a string instrument: the strings start it.', src: 'NAT-TECH' },
    { title: 'WHERE YOU MEET IT', text: 'Bluegrass, blues, country and roots music, on stage and in the studio — the square-neck kind played face up in the lap with a steel bar, the round-neck kind upright, fretted or with a slide.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Slide melodies and fills that cut through a band, rolls and chords. Ask how it will be played — bar or fingers, picks, how loud — and how the player moves or turns.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'This lab draws a single 9.5 in (24 cm) cone under the coverplate, in a guitar-sized body (the dreadnought’s drawing: resonator bodies vary).', src: 'NAT-TECH' },
  ],
  sound: {
    stages: [
      { title: 'The pick pulls a string', text: 'A pick, a finger or a fingerpick pulls a string aside and lets it go — lap style, against a steel bar that sets the length. That release is where the ATTACK begins.' },
      { title: 'The string swings', text: 'Released, the string swings between its two still ends — the bridge and the nut, the bar or a fret. Its lowest shape is drawn here many times larger than it really moves.' },
      { title: 'The bridge drives the cone', text: 'The bridge sits on a thin metal cone. Each swing rocks the bridge and drives the cone, like a loudspeaker cone under the coverplate.' },
      { title: 'Sound leaves', text: 'The cone’s sound leaves through the coverplate’s holes and the ports on the upper body, with a little from the strings. The cone, the body and the strings ringing together are the BODY of the sound.' },
    ],
    attack: 'The start of the note: the pick and the bar on the strings. It is heard most directly near the strings and the neck — a mic there hears more pick and slide.',
    body: 'The ring: the cone and the body. It leaves through the coverplate and the ports — a mic toward the cone region hears more of the resonator’s character. Both are tendencies; resonators differ.',
    head: { diameterMm: 241.3, rods: 0, label: 'the cone', strikeSrc: 'NAT-TECH' },
  },
  setting: {
    items: [
      { id: 'player', label: 'the player and the resonator', short: 'PLAYER', note: 'Lap style the player sits behind the instrument and leans over it; the bar travels the neck, the picking hand works over the coverplate. All of it is theirs.', prov: { kind: 'illustrative', reason: 'a typical posture' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'chair', label: 'the chair', short: 'CHAIR', note: 'Behind the player. A side boom’s stand shares the floor with the chair and the player’s feet.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'FLOOR SPACE', scene: 'kit' },
      { id: 'di', label: 'DI box and pickup cable', short: 'DI', note: 'A cone or bridge pickup is an electrical path, not a microphone. Route its cable clear of the feet.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SIGNAL PATH', scene: 'kit' },
      { id: 'wedge', label: 'the player’s floor wedge (monitor)', short: 'WEDGE', note: 'In front of the player, facing back. Lap style, a mic over the coverplate has it out in front and below.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'band', label: 'the band: bass amp and drums', short: 'BAND', note: 'Upstage. In a bluegrass band the banjo, the bass and the voices are the neighbours.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'stage', planIds: ['bassAmp', 'kit'] },
      { id: 'pa', label: 'the PA', short: 'PA', note: 'At the front corners, facing the audience. A bright resonator mic can feed back if the PA reaches it.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FEEDBACK', scene: 'stage', planIds: ['paL', 'paR'] },
      { id: 'audience', label: 'the audience', short: 'AUDIENCE', note: 'Beyond the stage edge.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a studio, the room and a reflective floor change both the direct sound and its reflections as the mic or the instrument moves.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: a wedge in front, the band and its voices round the player, the PA facing out. Close positions give more gain before feedback; a pickup may carry the level.',
    studio: 'STUDIO: no wedges, repeated trials when the player stops; check the room, the floor and the neighbours before committing.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic setup for a given resonator, posture and room, describe an alternative view, and explain what would justify a second channel. With a real instrument and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'inst', label: 'Instrument (cones, neck, pickup)', kind: 'text' },
      { id: 'posture', label: 'Posture', kind: 'choice', choices: ['lap style', 'upright'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser', 'dynamic', 'clip-on mini', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, and from which point', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The player’s posture and reach (lap style and upright), and the heights above the floor: drawing defaults. No HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The body’s keep-off margins, and the coverplate’s (15 mm): illustrative.', dims: ['lap', 'round'] },
    { text: 'The body (the steel dreadnought’s outline), the coverplate (Ø 270, its hole pattern), the cone’s position, the ports, the scale and the neck joint — drawing defaults; only the 9.5 in cone is sourced.', dims: [] },
    { text: 'The 20–45 cm start is the lesson’s teaching trial; the 20 cm start reads Shure’s “8 in from the sound hole” guitar row as “from the cone’s centre”.', dims: [] },
    { text: 'The clip’s capsule height and reach, the mic sizes, the wedge and the band’s positions — drawing defaults.', dims: [] },
  ],
  live: { wedges: C03_WEDGES },
  accuracyDetail: ACCURACY(RESO, 'one typical single-cone body, lap style or upright'),
  copy: C03_COPY,
};
