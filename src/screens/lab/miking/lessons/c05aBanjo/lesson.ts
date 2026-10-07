/**
 * C05a BANJO — the lesson's pages as DATA. Words from the owner's lesson
 * (docs/labs/miking/source_text/Banjo-Miking-Technique.txt, "L<n>" in
 * COMMENTS only) with the fixes BJ-01 … applied (CORRECTIONS_LOG.md) — the
 * banjo correction above all: about 3 in from the head's centre or edge, not
 * "about 1 ft from the bridge". Starting-points voice; FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, LessonPages, PageContent, SourcePageId, SetupTask, Symptom } from '../../engine/model/types.ts';
import { ACCURACY, brandReason, clearReason, contextChecks, DOC_REASON, hearingCheck, hearingDiag, LOUD_REASON, micChecks, POWER_REASON, practiceChecks, setupOrder, sharedSymptoms, STRINGS_PREDICT, twoMicChecks } from '../shared/guitars/stringsContent.ts';
import { C05A_MODEL, C05A_WEDGES, C05A_ZONES } from './geometry.ts';
import { BANJO, C05A_COPY } from './copy.ts';

const P = 'bj';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the banjo',
    goal: 'Get to know the five-string banjo — resonator or open back — what it is, where you meet it, its job in the music, and its parts, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The strings press a floating bridge onto a tensioned head; the head, a drumhead, radiates most of the sound. A resonator throws it forward; an open back lets more go behind.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a pluck becomes sound — the string, the bridge, the head and its shapes — and where the sound leaves the banjo. Shown, never played.',
    credit: { scenarios: [`${P}.snd.1`, `${P}.snd.2`, `${P}.snd.3`], interactive: 'soundPath', note: 'Step the pluck through to the end (or play it once), and answer the three checks.' },
    takeaway: 'Strings start it; the bridge drives a drumhead off-centre, so many of its shapes ring — bright and quick. A mic near the head hears more attack and projection; nearer the neck, more strings and fingers.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the space round a banjo player — the picking forearm on the rim, the long neck, their voice — a bluegrass stage and a studio, and what to do before any mic.',
    credit: { scenarios: [`${P}.set.1`, `${P}.set.2`, `${P}.set.3`], note: 'Answer the three checks.' },
    takeaway: 'The space round the banjo is the player’s, and the setup is theirs too. A bluegrass band may share mics — an ensemble technique. Ask the player first, and protect your hearing: a banjo is loud up close.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the banjo by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: [`${P}.mic.1`, `${P}.mic.2`, `${P}.mic.3`, `${P}.mic.4`, `${P}.rec.1`], note: 'Answer the five checks (one reaches back to how the banjo sounds).' },
    takeaway: 'An omni suits a quiet, good room; a cardioid controls the room and the band; a clip-on moves with the banjo. A figure-8 hears its back too — check the monitors first. A mic’s maximum SPL is not a hearing limit.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — aimed at where the neck meets the pot, or close in front of the head — then move the mic and see what changes.',
    credit: { scenarios: [`${P}.place.1`, `${P}.place.2`, `${P}.place.3`, `${P}.rec.2`], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'Different starting points are different places for different jobs: the neck junction for a blend, about 3 in from the head for attack and projection. Change one thing at a time, and keep clear of both hands.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the floor wedge — and know when close miking, a shared mic or a pickup suits the stage.',
    credit: { scenarios: [`${P}.ctx.1`, `${P}.ctx.2`, `${P}.ctx.studio`, `${P}.rec.3`], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Aim the rejection by the actual pattern; a figure-8 hears behind too. Close mics give more gain before feedback; shared mics need choreography. No mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why two views of one banjo can thin out together, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: [`${P}.two.1`, `${P}.two.2`, `${P}.two.3`, `${P}.two.4`], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two views hear the banjo at different times, so their sum combs. Polarity flips the sign; it does not remove a delay. One good mic first; check any pair in mono, with the player moving.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — position, aim, the room, the player’s movement, gain and polarity — and never the banjo’s setup: a buzz goes to the player.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one banjo mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second mic.',
    credit: { scenarios: [`${P}.prac.order`, `${P}.prac.gain`, `${P}.prac.setup1`, `${P}.prac.setup2`, `${P}.prac.3`, `${P}.mix.1`, `${P}.mix.2`, `${P}.mix.3`], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real banjo.' },
    takeaway: 'A reproducible, balanced one-mic position, power and level checks, a mono check of any pair, and hands, hardware and hearing kept safe pass. A brand or a “loudest spot” do not.',
  },
};

const scenarios: MikingScenario[] = [
  {
    id: `${P}.snd.1`,
    page: 'sound',
    prompt: 'How do a banjo’s strings make the head move?',
    options: ['They press the bridge, and the bridge drives the head', 'They touch the head directly, slapping it as they swing', 'They drive the neck, which shakes the whole pot'],
    correct: 'They press the bridge, and the bridge drives the head',
    explain: 'The strings never touch the head. They press a light floating bridge onto it; the bridge rocks with them and drives the head, a tensioned membrane.',
    why: {
      'They touch the head directly, slapping it as they swing': 'The strings ride above the head on the bridge; only the bridge’s feet touch it.',
      'They drive the neck, which shakes the whole pot': 'The neck carries the strings; the bridge on the head is the path.',
    },
  },
  {
    id: `${P}.snd.2`,
    page: 'sound',
    prompt: 'The bridge stands off the head’s centre. What does that mean for the head’s shapes?',
    options: ['Most of them move under the bridge, so most are driven', 'Only the lowest shape is driven; the rest stay still', 'None are driven, because the bridge is not at the centre'],
    correct: 'Most of them move under the bridge, so most are driven',
    explain: 'A shape is driven only as much as the head moves under the driving point. Off centre, few shapes have a still line there — so many ring together: bright and quick.',
    why: {
      'Only the lowest shape is driven; the rest stay still': 'That would be closer to a centre strike. Off centre, many shapes are driven.',
      'None are driven, because the bridge is not at the centre': 'A drive anywhere off a still line sets a shape moving.',
    },
  },
  {
    id: `${P}.snd.3`,
    page: 'sound',
    prompt: 'What does a resonator back do, compared with an open back?',
    options: ['Makes the head vibrate in completely different shapes', 'Reflects more of the sound forward, away from the player', 'Stops the sound from leaving the front of the head at all'],
    correct: 'Reflects more of the sound forward, away from the player',
    explain: 'The resonator is a bowl behind the pot that reflects sound forward. An open back lets more go behind, into the player — whose body then shapes it.',
    why: {
      'Makes the head vibrate in completely different shapes': 'The head’s shapes come from the head; the resonator changes where the sound goes.',
      'Stops the sound from leaving the front of the head at all': 'The front still radiates; the resonator sends more of the back’s sound forward too.',
    },
  },
  hearingCheck(P, BANJO),
  {
    id: `${P}.set.2`,
    page: 'setting',
    prompt: 'The bluegrass band works around one shared mic. What is that?',
    options: ['A way to avoid miking the banjo at all, whatever the room', 'The same as close miking, only with fewer cables', 'An ensemble technique: players step in and out to balance'],
    correct: 'An ensemble technique: players step in and out to balance',
    explain: 'With one or two shared mics, players move in for solos and back for balance. It needs choreography, restrained monitors and a kind room — an ensemble technique.',
    why: {
      'A way to avoid miking the banjo at all, whatever the room': 'The banjo is still miked — by the shared mic — and the room has to suit it.',
      'The same as close miking, only with fewer cables': 'It is the opposite: a broad, shared pickup that depends on the players’ movement.',
    },
  },
  {
    id: `${P}.set.3`,
    page: 'setting',
    prompt: 'You hear a buzz from the bridge area. What do you do first?',
    options: ['Nudge the bridge a little along the head to stop it buzzing', 'Tighten the head’s hooks until the buzz is gone', 'Check it with the mic muted, then hand it to the player'],
    correct: 'Check it with the mic muted, then hand it to the player',
    explain: 'If it is there acoustically, it belongs to the banjo. The bridge and the head tension are the player’s — never a miking step.',
    why: {
      'Nudge the bridge a little along the head to stop it buzzing': 'Moving the bridge changes the banjo’s tuning and setup. It is not yours to touch.',
      'Tighten the head’s hooks until the buzz is gone': 'Head tension is the player’s setup, not a mic fix.',
    },
  },
  {
    id: `${P}.rec.1`,
    page: 'microphone',
    prompt: 'FROM EARLIER · What radiates most of a banjo’s sound?',
    options: ['The strings, straight into the room', 'The head, driven by the bridge', 'The neck, along its whole length'],
    correct: 'The head, driven by the bridge',
    explain: 'The head is a tensioned membrane driven by the bridge: it radiates most of the sound, toward a mic in front.',
    why: {
      'The strings, straight into the room': 'Strings move little air; they press the bridge, which drives the head.',
      'The neck, along its whole length': 'The neck carries the strings; the head does the radiating.',
    },
  },
  {
    id: `${P}.mic.1`,
    page: 'microphone',
    prompt: 'A figure-8 ribbon can smooth a banjo’s attack. What must you check before using one live?',
    options: ['That the banjo has a resonator, or it will not work', 'Nothing: a ribbon rejects the other sources on a stage', 'Where the monitors are: a figure-8 hears its back as well'],
    correct: 'Where the monitors are: a figure-8 hears its back as well',
    explain: 'A figure-8 picks up equally from the rear. With floor monitors behind it, it can be unsuitable — rule it out for exactly that reason.',
    why: {
      'That the banjo has a resonator, or it will not work': 'The back of the banjo is not the issue; the back of the MIC is.',
      'Nothing: a ribbon rejects the other sources on a stage': 'A figure-8 rejects only at its sides; its back hears as well as its front.',
    },
  },
  ...micChecks(P, BANJO),
  {
    id: `${P}.place.1`,
    page: 'placement',
    prompt: 'One starting point says about 3 in from the head’s centre, another 30–40 cm from the neck junction. Are they the same position?',
    options: ['Yes: both are measured from the banjo’s bridge', 'Yes, as long as the mic faces the banjo', 'No: different places, for different jobs'],
    correct: 'No: different places, for different jobs',
    explain: 'Close in front of the head gives attack and projection; the neck junction a blend of strings, fingers and head. Move between them by ear — they are not one coordinate.',
    why: {
      'Yes: both are measured from the banjo’s bridge': 'One is read from the head’s centre, the other from the neck junction — neither from the bridge.',
      'Yes, as long as the mic faces the banjo': 'Aim is a separate thing. These are different points and distances.',
    },
  },
  {
    id: `${P}.place.2`,
    page: 'placement',
    prompt: 'The banjo sounds thin and all fingers. What is a good first move?',
    options: ['Move closer in to the strings, out along the neck', 'Include more of the head and pot, at a modest distance', 'Turn the channel up until it sounds fuller'],
    correct: 'Include more of the head and pot, at a modest distance',
    explain: 'A view aimed mainly at the neck, or too close to the picking, misses the head. Bring more of the head and pot in.',
    why: {
      'Move closer in to the strings, out along the neck': 'That adds more of what is already too much.',
      'Turn the channel up until it sounds fuller': 'Louder is not fuller: the balance comes from where the mic is.',
    },
  },
  {
    id: `${P}.place.3`,
    page: 'placement',
    prompt: 'Why would you try a mic behind an open-back banjo only as an audition?',
    options: ['Nothing much comes out of the back of an open-back banjo', 'The player’s body, reflections and spill can dominate it', 'A rear mic is the one correct place on an open back'],
    correct: 'The player’s body, reflections and spill can dominate it',
    explain: 'Sound does leave the open back — straight into the player. Their body obstructs and colours it, so a rear view is something to audition, not to assume.',
    why: {
      'Nothing much comes out of the back of an open-back banjo': 'Plenty does — that is what an open back means. The player is in the way.',
      'A rear mic is the one correct place on an open back': 'No single place is correct; a rear view is an experiment.',
    },
  },
  {
    id: `${P}.rec.2`,
    page: 'placement',
    prompt: 'FROM EARLIER · What must a stand mic and its boom stay out of, round a banjo player?',
    options: ['The front of the banjo, so the audience can see the head', 'The floor round the player’s feet, which is kept for the DI', 'The picking hand and forearm, the fretting hand and the neck'],
    correct: 'The picking hand and forearm, the fretting hand and the neck',
    explain: 'The picking forearm rests on the rim, the hand works over the head, the fretting hand travels the neck — and the neck swings as the player moves. Stop the player before anything moves.',
    why: {
      'The front of the banjo, so the audience can see the head': 'In front of the banjo is usually where the mic goes. Protect the player’s space.',
      'The floor round the player’s feet, which is kept for the DI': 'Cables need a route, but the safety question is the hands and the neck.',
    },
  },
  ...contextChecks(P, BANJO),
  {
    id: `${P}.ctx.studio`,
    page: 'context',
    prompt: 'A quiet studio, a good room, solo banjo. When could an omni be the right choice?',
    options: ['When the room is noisy and its sound needs rejecting', 'When the banjo must be isolated from a band', 'When the room is good and its sound is wanted'],
    correct: 'When the room is good and its sound is wanted',
    explain: 'An omni near the neck junction gives a detailed, broad view — and hears the room and any neighbours. Choose it when that contribution is wanted.',
    why: {
      'When the room is noisy and its sound needs rejecting': 'An omni rejects nothing; a cardioid helps there.',
      'When the banjo must be isolated from a band': 'Isolation calls for a directional mic, closer in.',
    },
  },
  {
    id: `${P}.rec.3`,
    page: 'context',
    prompt: 'FROM EARLIER · An open-back banjo on a loud stage: where does some of its sound go?',
    options: ['Only out of the front, toward the audience', 'Out of the back, into the player’s body', 'Down through the neck into the floor'],
    correct: 'Out of the back, into the player’s body',
    explain: 'Without a resonator, sound leaves behind the pot too — into the player, who obstructs and colours it.',
    why: {
      'Only out of the front, toward the audience': 'That is closer to what a resonator does. An open back lets sound out behind.',
      'Down through the neck into the floor': 'The neck carries the strings; the head and the open back radiate.',
    },
  },
  ...twoMicChecks(P, BANJO),
  ...practiceChecks(P, BANJO, {
    quote: 'about 3 in from the centre of the head',
    right: 'The head’s centre, not the bridge or the neck',
    wrong1: 'The bridge, since the strings cross it there',
    wrong2: 'The back of the pot, through the resonator',
    explain: 'A distance belongs to the point it names: from the head’s centre, from the bridge and from the neck junction are different places for the same number.',
  }),
];

const symptoms: Symptom[] = [
  {
    id: `${P}.sym.thin`,
    observation: 'A thin, all-fingers sound',
    firstChecks: 'Is the mic aimed mainly at the neck, or too close to the picking? Include more head and pot, at a modest distance.',
    options: ['Move closer in to the strings, out along the neck', 'Include more of the head and pot, at a modest distance', 'Turn the channel up until the banjo sounds full'],
    correct: 'Include more of the head and pot, at a modest distance',
    explain: 'A view mostly of the strings and fingers misses the head. Change the view first.',
    why: {
      'Move closer in to the strings, out along the neck': 'That adds more of what is already too much.',
      'Turn the channel up until the banjo sounds full': 'Louder is not fuller: the balance comes from where the mic is.',
    },
  },
  {
    id: `${P}.sym.papery`,
    observation: 'A hard, papery head sound',
    firstChecks: 'Is a close mic aimed at one spot of the head? Move toward the neck-junction blend, or step back.',
    options: ['Cut the high frequencies until the head sounds soft', 'Move toward the neck junction, or step back a little', 'Move even closer in, right onto the head’s centre'],
    correct: 'Move toward the neck junction, or step back a little',
    explain: 'One close spot on the head magnifies it. A broader view balances it.',
    why: {
      'Cut the high frequencies until the head sounds soft': 'EQ dulls the whole banjo; the position is the cause.',
      'Move even closer in, right onto the head’s centre': 'Closer to one spot makes it harder still.',
    },
  },
  {
    id: `${P}.sym.lost`,
    observation: 'The banjo disappears in the band',
    firstChecks: 'Is the room or bleed masking it? Bring a directional mic closer and check with the ensemble.',
    options: ['Turn the banjo channel up until it is the loudest thing', 'Bring a directional mic closer and check with the band', 'Swap to an omni so it hears more of the stage'],
    correct: 'Bring a directional mic closer and check with the band',
    explain: 'Closer, with a pattern aimed against the neighbours, the banjo gains on the band. Judge it in the ensemble.',
    why: {
      'Turn the banjo channel up until it is the loudest thing': 'More gain raises the bleed too, and brings feedback closer.',
      'Swap to an omni so it hears more of the stage': 'An omni hears more of everything else — the opposite of what is needed.',
    },
  },
  ...sharedSymptoms(P, BANJO),
];

const setupTasks: SetupTask[] = [
  {
    id: `${P}.prac.setup1`,
    page: 'practice',
    brief: 'BRIEF 1 · A bluegrass band on a stage with floor wedges. The banjo gets its own channel; phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser, cardioid, about 3 in from the head’s centre, rear toward the wedge', ok: true, power: 'phantom', feedback: 'A recommended starting point, close for gain before feedback, its rejection toward the wedge.' },
      { id: 'b', label: 'Instrument dynamic aimed at the neck junction, at the close end, rear to the wedge', ok: true, power: 'none', feedback: 'A recommended target, brought closer for the stage.' },
      { id: 'c', label: 'Clip-on mini on an approved clip by the tailpiece, aimed at the bridge', ok: true, power: 'phantom', feedback: 'A recommended starting point that moves with the banjo.' },
      { id: 'd', label: 'Figure-8 ribbon in front of the banjo, the wedge right behind it', ok: false, power: 'none', feedback: 'A figure-8 hears its back as well as its front: with the wedge behind it, it invites feedback.' },
      { id: 'e', label: 'Clip the mini to a string, right over the head’s centre', ok: false, power: 'phantom', feedback: 'Never clip to a string, the bridge or the head. Use an approved mount.' },
    ],
    reasons: [DOC_REASON, clearReason('the picking hand and forearm, the fretting hand and the neck'), POWER_REASON, { id: 'r.null', label: 'Aiming its rejection toward the wedge helps against feedback', role: 'optional', feedback: 'A fair live reason — though no position alone prevents feedback.' }, brandReason(BANJO), LOUD_REASON],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point from its named point, clearance from the player, power that matches the mic — and nothing on the banjo’s setup.',
  },
  {
    id: `${P}.prac.setup2`,
    page: 'practice',
    brief: 'BRIEF 2 · A quiet studio, a good room, a clawhammer piece on an open-back banjo. The only spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'Instrument dynamic 30–40 cm out, aimed at the neck junction', ok: true, power: 'none', feedback: 'A recommended starting point; a dynamic needs no phantom.' },
      { id: 'b', label: 'Instrument dynamic about 3 in from the head’s edge, compared with the junction', ok: true, power: 'none', feedback: 'A recommended starting point; it needs no phantom.' },
      { id: 'c', label: 'Small omni condenser near the neck junction, for the room', ok: false, power: 'phantom', feedback: 'A fair idea in a good room — but this input has no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'Clip-on mini by the tailpiece', ok: false, power: 'phantom', feedback: 'A miniature condenser needs phantom power, which this input does not have.' },
      { id: 'e', label: 'Instrument dynamic behind the open back, assumed to give the deepest tone', ok: false, power: 'none', feedback: 'Behind, the player’s body obstructs it: audition a rear view, never assume it.' },
    ],
    reasons: [DOC_REASON, clearReason('the picking hand and forearm, the fretting hand and the neck'), POWER_REASON, { id: 'r.compare', label: 'I will compare the junction and the head with the same phrase', role: 'optional', feedback: 'A fair reason: change one thing at a time.' }, brandReason(BANJO), LOUD_REASON],
    explain: 'Two positions pass. What passes is the reasoning: a sensible starting point, clear of the player, powered by what this input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: what moves most of the air on a banjo?', options: ['The strings themselves', 'The head, driven by the bridge', 'The long neck'], after: 'Now STEP through the pluck (or PLAY ONCE) and watch what each event drives.' },
  placement: { prompt: 'Predict: you move from the neck junction to about 3 in in front of the head. What changes?', options: ['More attack and head projection', 'More of the room', 'It depends on this banjo'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  ...STRINGS_PREDICT,
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What is a banjo’s head?',
    options: ['The peghead at the far end of the neck, with the tuners', 'A wooden top with a round sound hole cut in it', 'A tensioned membrane, like a drumhead, over the pot'],
    correct: 'A tensioned membrane, like a drumhead, over the pot',
    explain: 'The head is stretched over the round pot by a hoop and hooks — a drumhead. The bridge stands on it.',
    why: {
      'The peghead at the far end of the neck, with the tuners': 'That holds the tuners. The head is the membrane on the pot.',
      'A wooden top with a round sound hole cut in it': 'That is a guitar. A banjo has a membrane head instead.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'Where does a five-string banjo’s short string start?',
    options: ['At the tailpiece, behind the bridge', 'At a peg partway up the neck', 'At a tuner on the resonator'],
    correct: 'At a peg partway up the neck',
    explain: 'The fifth string is short: it starts at its own peg partway up the neck.',
    why: {
      'At the tailpiece, behind the bridge': 'All strings anchor at the tailpiece; the fifth one’s other end is the peg up the neck.',
      'At a tuner on the resonator': 'There are no tuners on the resonator; the fifth peg is on the neck.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'The strings press the bridge onto the head off its centre. What follows?',
    options: ['Only the lowest shape is driven: a deep, long note', 'None are driven, because the strings do not touch it', 'Many of the head’s shapes are driven: bright and quick'],
    correct: 'Many of the head’s shapes are driven: bright and quick',
    explain: 'Off centre, few shapes have a still line under the bridge, so many ring together. A drumhead also damps fast.',
    why: {
      'Only the lowest shape is driven: a deep, long note': 'That is nearer a centre strike on a large drum, not a banjo bridge off centre.',
      'None are driven, because the strings do not touch it': 'The strings drive the head through the bridge.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'What does an open back change?',
    options: ['The head stops vibrating altogether, so it goes quiet', 'More sound leaves behind the pot, into the player', 'The strings sound an octave lower than with a resonator'],
    correct: 'More sound leaves behind the pot, into the player',
    explain: 'Without a resonator, the back of the head radiates straight into the player, whose body colours it.',
    why: {
      'The head stops vibrating altogether, so it goes quiet': 'The head vibrates the same; where the sound goes changes.',
      'The strings sound an octave lower than with a resonator': 'Pitch is set by the strings. The back changes where sound goes.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'What must a stand mic stay out of, round a banjo player?',
    options: ['The front of the banjo, so the audience can see the head clearly', 'The space behind the player, where the cables run', 'The picking hand and forearm, the fretting hand and the neck'],
    correct: 'The picking hand and forearm, the fretting hand and the neck',
    explain: 'The forearm rests on the rim, the hand picks over the head, the other hand travels the neck. In front of the head is usually where a mic comes in.',
    why: {
      'The front of the banjo, so the audience can see the head clearly': 'In front is usually where the mic goes. The player’s space is what to keep clear.',
      'The space behind the player, where the cables run': 'Cables need a route, but the moving space is the player’s hands and the neck.',
    },
  },
  hearingDiag(BANJO),
];

export const C05A_LESSON: Lesson = {
  id: 'C05A',
  labId: 'strings',
  title: 'Banjo',
  subtitle: 'A drumhead driven by a bridge — head, neck junction, or a clip',
  noun: { one: 'banjo', many: 'banjos' },
  model: C05A_MODEL,
  micTypeIds: ['sdcCard', 'instDynCard', 'clipCond'],
  zones: C05A_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [setupOrder(P, BANJO, 'Have the player stop; place it at the neck junction; check both hands and the neck’s swing')],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A string instrument whose top is a drumhead: a thin membrane stretched over a round pot. Five strings press a light bridge onto the head, and the head radiates the sound. A resonator bowl behind the pot throws sound forward; an open back does not.', src: 'DEERING' },
    { title: 'WHERE YOU MEET IT', text: 'Bluegrass, old-time and folk music, and beyond — on stage, often in a band sharing one or two mics, and in the studio.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Fast rolls with fingerpicks, or the gentler clawhammer stroke on an open back; bright, cutting fills. Ask how they play, whether they use a mute, and whether they step in to a shared mic.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'This lab draws a head about 28.5 cm (11.25 in) across, a 72 cm long string from bridge to nut, and the short fifth string about 55.5 cm long.', src: 'MET-BANJO' },
  ],
  sound: {
    stages: [
      { title: 'The pick pulls a string', text: 'A fingerpick, a finger or the back of a nail (clawhammer) pulls a string aside and lets it go. That release is where the ATTACK begins.' },
      { title: 'The string swings', text: 'Released, the string swings between its two still ends — the bridge on the head and the nut (or a fret). Its lowest shape is drawn here many times larger than it really moves.' },
      { title: 'The bridge drives the head', text: 'The strings never touch the head: they press a light bridge onto it. Each swing rocks the bridge, and the bridge drives the head — off its centre.' },
      { title: 'Sound leaves', text: 'The head radiates most of the sound toward the front. A resonator reflects the back’s sound forward too; an open back lets it go behind, into the player. The ring that follows — brief, on a drumhead — is the BODY of the sound.' },
    ],
    attack: 'The start of the note: the pick or nail on the string, and the head’s quick response. Close in front of the head a mic hears more of it — and of the playing noises.',
    body: 'The ring: the head and the strings, short-lived. At the neck junction a mic hears a blend of it with the strings and fingers. Both are tendencies, and banjos vary.',
    head: { diameterMm: 285, rods: 24, label: 'banjo head, from the front', strikeSrc: 'MET-BANJO', hoop: 'metal' },
  },
  setting: {
    items: [
      { id: 'player', label: 'the player and the banjo', short: 'PLAYER', note: 'Standing on a strap, the neck to the player’s left; the picking forearm rests on the rim, the fretting hand travels the neck, and the neck swings as they move.', prov: { kind: 'illustrative', reason: 'a typical standing posture' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'vocal', label: 'the vocal mic (a singing player)', short: 'VOCAL MIC', note: 'Above the banjo, in front of the mouth. The voice reaches the banjo mic and the banjo reaches the vocal mic: plan both.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'shared', label: 'a shared band mic', short: 'SHARED MIC', note: 'A bluegrass band may share one or two mics, stepping in for solos and back for balance — an ensemble technique that needs choreography and a kind room.', prov: { kind: 'illustrative', reason: 'a typical bluegrass stage' }, tag: 'ENSEMBLE', scene: 'stage' },
      { id: 'wedge', label: 'the player’s floor wedge (monitor)', short: 'WEDGE', note: 'In front of the player, facing back. Wedges and overlapping mics can harm both tone and isolation.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'band', label: 'the band: bass and drums', short: 'BAND', note: 'Upstage. On a loud stage individual close mics, or a pickup-equipped banjo, give more control.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'stage', planIds: ['bassAmp', 'kit'] },
      { id: 'pa', label: 'the PA', short: 'PA', note: 'At the front corners, facing the audience.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FEEDBACK', scene: 'stage', planIds: ['paL', 'paR'] },
      { id: 'audience', label: 'the audience', short: 'AUDIENCE', note: 'Beyond the stage edge.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a quiet, good studio room, an omni can be worth trying; a distant pair is useful only if the room serves the piece.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: a wedge in front, the band behind, the PA facing out — or a shared mic the band works. Close mics give more gain before feedback.',
    studio: 'STUDIO: no wedges, repeated trials when the player stops, and a room that can be part of the sound.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic setup for a given banjo, player and room, describe an alternative position, and explain what would justify a second mic. With a real banjo and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'banjo', label: 'Banjo (resonator or open back, style)', kind: 'text' },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser', 'dynamic', 'clip-on mini', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, and from which point', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The player’s standing posture and reach, and the height on the strap (the strings 1.08 m above the floor): drawing defaults. No HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The head’s, the strings’ and the bridge’s keep-off margins: illustrative.', dims: ['reso', 'open'] },
    { text: 'The pot’s depth (70 mm), the resonator (Ø 330, 40 mm deep), the bridge’s place on the head (0.33 × Ø from the centre), the hooks (24), the tailpiece, the peghead and the fingerboard — drawing defaults; the head Ø 285 and the string lengths are a museum banjo’s.', dims: [] },
    { text: 'The 30–40 cm neck-junction start reads DPA’s two-omni “distance” as a one-mic distance (it may mean the spacing); the 3 in rows are drawn as 6–9.5 cm; which head edge is not stated.', dims: [] },
    { text: 'The clip’s capsule height and reach, the mic sizes, the wedge, the shared mic and the band’s positions — drawing defaults.', dims: [] },
  ],
  live: { wedges: C05A_WEDGES },
  accuracyDetail: ACCURACY(BANJO, 'one typical five-string banjo with a resonator or an open back, the head’s shapes as an ideal membrane'),
  copy: C05A_COPY,
};
