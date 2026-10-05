/**
 * A07 PICCOLO — the lesson's pages as DATA (blueprint §7). The words come
 * from the owner's lesson (docs/labs/miking/source_text/Piccolo-Miking-
 * Technique.txt, "L<n>" in COMMENTS only) with the fixes in CORRECTIONS_LOG.md
 * (A7-01 …) applied: the supercardioid's nulls sit toward the rear near
 * 125°, not at its sides (L38); every distance is the flute's, transferred
 * (L26, kept); the measured trend — "around 2 kHz the piccolo exhibits a
 * fairly strong radiation at the front" — added in words.
 *
 * OWNER RULING 2026-10-04: suggested starting points, never dogma; no
 * source, brand or model in learner text; no badges.
 */
import type { DiagnosticItem, MikingScenario, OrderTask, PageContent, PageId, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import type { LessonCopy } from '../../engine/model/copy.ts';
import { BRAND_REASON, LOUD_REASON, POWER_REASON, clearReason, clipThreatSymptom, colourSymptom, docReason, feedbackSymptom, firstHoleCheck, gainCheck, hearingCheck, hearingDiag, keyNoiseSymptom, matchedLevels, nullOnPaper, polarityDelay, removeDelay, superNull, type WindWords } from '../shared/woodwinds/windItems.ts';
import { windExtra, type WindLesson } from '../shared/woodwinds/windLesson.ts';
import { PICCOLO_MODEL, SEATED, SPEC } from './geometry.ts';
import { PICCOLO_ZONES } from './model.ts';

const W: WindWords = { noun: 'piccolo', player: 'piccolo player', end: 'the open end', exciter: 'the embouchure hole', moving: 'the hands, the head’s turn and the piccolo' };

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the piccolo',
    goal: 'Get to know the piccolo — half a flute, sounding an octave higher — what it is, where you meet it, what it does in the music, and its parts, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'An edge-blown flute about half as long as a concert flute, sounding an octave above its written notes. Its sound leaves from the embouchure hole and the open holes — there is no single bell.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how an air jet becomes a piccolo note, where the sound leaves, and where the air goes. Shown, never played.',
    credit: { scenarios: ['pc.snd.1', 'pc.snd.2', 'pc.snd.3'], interactive: 'soundPath', note: 'Step the sequence through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The same physics as the flute in half the length: the embouchure hole and the first open hole radiate; the jet blows out past the lips. Much of its energy sits where vocal mics add presence — compare responses.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the piccolo sits — by the player’s right ear, the hands, the jet, the flute section — what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['pc.set.1', 'pc.set.2', 'pc.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The piccolo is small and loud, right by the player’s ear. Keep clear of the jet, the hands and a turning head; manage hearing exposure; hear the ensemble pickup first.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the piccolo by its properties — response, pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['pc.mic.1', 'pc.mic.2', 'pc.mic.3', 'pc.rec.1'], note: 'Answer the four checks (one reaches back to how the piccolo sounds).' },
    takeaway: 'Compare responses at matched level — a presence peak can turn a piccolo shrill. A small condenser on a stand, or a fitted headset for a moving player; both need phantom power.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — the flute’s close position, between the lip plate and the left hand, off the jet — then compare behind the head and farther in front.',
    credit: { scenarios: ['pc.place.1', 'pc.place.2', 'pc.place.3', 'pc.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'The flute’s starting points are places to begin on a piccolo, not measured optimums. Copy the relationship, test the whole phrase, and keep the capsule out of the jet.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the player’s wedge — and know what a pattern cannot do, and why an ensemble pickup may already be enough.',
    credit: { scenarios: ['pc.ctx.1', 'pc.ctx.2', 'pc.ctx.studio', 'pc.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A cardioid rejects most behind; a supercardioid toward the rear near 125°, with a rear lobe — not at its sides. No mic position alone prevents feedback, and a small instrument does not need a louder channel.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a piccolo spot and the main pair can sound hollow together, and what the polarity switch does and does not change.',
    credit: { scenarios: ['pc.two.1', 'pc.two.2', 'pc.two.3', 'pc.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'A spot and the main pair hear the piccolo at different times: some pitches cancel in the sum. Move or rebalance first; polarity flips the sign and never removes a delay. Multiple close mics are seldom needed.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — the jet, the mic’s response and angle, the distance, the mount — before EQ or a louder channel.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one piccolo mic in the right order, choose and justify a setup for an ensemble recording and a loud stage, and say when a spot is needed at all.',
    credit: { scenarios: ['pc.prac.order', 'pc.prac.gain', 'pc.prac.setup1', 'pc.prac.setup2', 'pc.prac.3', 'pc.mix.1', 'pc.mix.2', 'pc.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real piccolo.' },
    takeaway: 'The ensemble pickup checked first, the capsule off the jet, clearance from the head and hands, the response compared at matched level, safe listening levels, and an accurate account of polarity versus delay pass — and more than one setup can pass.',
  },
};

/* THE CHECKS. Lesson lines in comments only: pc.snd.* L6-L8 · pc.set.* L7,
 * L40, L42 · pc.mic.* L8, L39, L43 · pc.place.* L26-L30 · pc.ctx.* L38-L40 ·
 * pc.two.* L35 · pc.prac.* / pc.mix.* L74-L78. */
const scenarios: MikingScenario[] = [
  {
    id: 'pc.snd.1',
    page: 'sound',
    prompt: 'A piccolo is about half a flute’s length. What does that do to its pitch?',
    options: ['It sounds an octave above its written notes', 'It sounds a fifth below the concert flute’s notes', 'It sounds the same, only louder'],
    correct: 'It sounds an octave above its written notes',
    explain: 'Half the length, half the wavelength: twice the frequency. A piccolo sounds an octave above its written pitch.',
    why: {
      'It sounds a fifth below the concert flute’s notes': 'A shorter tube sounds higher, not lower.',
      'It sounds the same, only louder': 'Length sets the pitch; the piccolo sounds an octave up.',
    },
  },
  firstHoleCheck('pc.snd.2', W),
  {
    id: 'pc.snd.3',
    page: 'sound',
    prompt: 'Is there a bell on a piccolo that carries its whole sound?',
    options: ['Yes — the open end at the far tip carries nearly all of it', 'No — the embouchure and the open holes radiate', 'Yes — the lip plate works as its bell'],
    correct: 'No — the embouchure and the open holes radiate',
    explain: 'There is no single bell: the embouchure hole radiates for every note and the first open holes let the rest out, changing with the fingering. A mic aimed at one small spot hears that change.',
    why: {
      'Yes — the open end at the far tip carries nearly all of it': 'The end leads only when every hole is closed.',
      'Yes — the lip plate works as its bell': 'The lip plate holds the embouchure hole; it is not a bell, and the holes radiate too.',
    },
  },
  hearingCheck('pc.set.1', W),
  {
    id: 'pc.set.2',
    page: 'setting',
    prompt: 'Why does the piccolo player’s own hearing need care?',
    options: ['The loud piccolo sits right beside their ear', 'The piccolo’s sound reaches the audience first', 'Their earplugs change the pitch of the piccolo'],
    correct: 'The loud piccolo sits right beside their ear',
    explain: 'The piccolo is held right by the player’s right ear, and its top register is loud. Manage rehearsal and show exposure, use hearing protection where it helps, and keep monitor and in-ear levels comfortable.',
    why: {
      'The piccolo’s sound reaches the audience first': 'The audience is far away; the player’s ear is centimetres from the instrument.',
      'Their earplugs change the pitch of the piccolo': 'Hearing protection changes what the player hears, not the piccolo’s pitch.',
    },
  },
  {
    id: 'pc.set.3',
    page: 'setting',
    prompt: 'A clip made for a concert flute: can it go on a piccolo?',
    options: ['Yes — the piccolo is the same family, so the clip fits', 'Only if it fits this piccolo; if unsure, use a stand', 'Yes, if you squeeze it tighter to make it hold'],
    correct: 'Only if it fits this piccolo; if unsure, use a stand',
    explain: 'A piccolo is much smaller: a flute clip of the wrong size or pressure can slip, cover a hole or press the body. Only a mount that truly fits, with the player’s approval — else a stand.',
    why: {
      'Yes — the piccolo is the same family, so the clip fits': 'Same family, different size: the fit has to be checked, not assumed.',
      'Yes, if you squeeze it tighter to make it hold': 'More pressure risks the body and the keys. Use a stand instead.',
    },
  },
  {
    id: 'pc.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Where does a piccolo’s sound leave?',
    options: ['From a flared bell at the far end of the tube', 'The embouchure hole and the open holes', 'From the player’s lips and the air jet'],
    correct: 'The embouchure hole and the open holes',
    explain: 'Like the flute: the embouchure hole for every note, the first open holes for the rest, the open end only for the lowest notes.',
    why: {
      'From a flared bell at the far end of the tube': 'A piccolo has no bell; the open end leads only for the lowest notes.',
      'From the player’s lips and the air jet': 'The lips send the jet; the instrument’s openings send the sound.',
    },
  },
  {
    id: 'pc.mic.1',
    page: 'microphone',
    prompt: 'A vocal mic with a presence peak sounds shrill on the piccolo. What do you do?',
    options: ['Cut the top end hard on the piccolo’s own channel', 'Compare a neutral mic and angle at matched level', 'Keep it — a piccolo sounds shrill on most mics'],
    correct: 'Compare a neutral mic and angle at matched level',
    explain: 'The piccolo already has strong energy where many vocal mics add presence. Compare a more neutral response and angle at matched level before any EQ — a reason to audition, not a ban on a type.',
    why: {
      'Cut the top end hard on the piccolo’s own channel': 'Heavy EQ dulls the piccolo along with the edge. Compare mics and angles first.',
      'Keep it — a piccolo sounds shrill on most mics': 'Shrillness can come from the mic’s peak and the angle; compare before accepting it.',
    },
  },
  {
    id: 'pc.mic.2',
    page: 'microphone',
    prompt: 'A piccolo player moves around a dense stage. Which mount keeps one distance?',
    options: ['A stand mic in front, carefully aimed', 'A properly fitted headset', 'A mic on the music stand'],
    correct: 'A properly fitted headset',
    explain: 'A fitted headset follows the head — it favours the head joint, so test the whole register. If no mount truly fits, a stand is the safe choice.',
    why: {
      'A stand mic in front, carefully aimed': 'A stand mic has a working zone; a moving player leaves it.',
      'A mic on the music stand': 'The music stand stays put, and its desk reflects sound into the mic.',
    },
  },
  {
    id: 'pc.mic.3',
    page: 'microphone',
    prompt: 'Your only spare input has no phantom power. Can the headset run from it?',
    options: ['Yes — a headset needs no power', 'Yes, if its cable is short enough', 'No — it needs phantom power too'],
    correct: 'No — it needs phantom power too',
    explain: 'The stand condenser and the headset miniature both need phantom power (the headset through its adapter). Find a powered input.',
    why: {
      'Yes — a headset needs no power': 'A headset miniature is a condenser: it needs phantom power through its adapter.',
      'Yes, if its cable is short enough': 'Cable length does not power a condenser.',
    },
  },
  {
    id: 'pc.place.1',
    page: 'placement',
    prompt: 'The flute’s 5–10 cm starting point on a piccolo is…',
    options: ['A measured optimum for the piccolo itself', 'A useful comparison to begin with', 'Too close to work at all on a piccolo'],
    correct: 'A useful comparison to begin with',
    explain: 'The flute-family positions are recommended for variants too, but they were not measured on a piccolo. Copy the relationship — between the lip plate and the first keys, off the jet — and test the whole phrase.',
    why: {
      'A measured optimum for the piccolo itself': 'It is the flute’s figure, transferred; no piccolo-specific measurement exists.',
      'Too close to work at all on a piccolo': 'It works as a start; listen for breath and keys and adjust.',
    },
  },
  {
    id: 'pc.place.2',
    page: 'placement',
    prompt: 'Is a mic behind and slightly above the player’s head aimed at the piccolo?',
    options: ['No — it hears only the back of the head', 'Yes — past the head, at the finger holes', 'No — it points up to hear the room'],
    correct: 'Yes — past the head, at the finger holes',
    explain: 'It looks over the shoulder at the finger holes; the jet blows away from it, so it tends to hear less breath. Check the head’s movement and the neighbours.',
    why: {
      'No — it hears only the back of the head': 'Placed a little above and to the side, it sees past the head.',
      'No — it points up to hear the room': 'It is aimed at the finger holes, not the ceiling.',
    },
  },
  {
    id: 'pc.place.3',
    page: 'placement',
    prompt: 'You move from close to about a metre in front. What tends to change?',
    options: ['More room; key clicks and gusts fall back', 'Only the level drops; nothing else changes', 'More breath, as the mic faces the lips'],
    correct: 'More room; key clicks and gusts fall back',
    explain: 'Farther away the clicks and breath fall back and more room and ensemble arrive — with less isolation and more change as the player moves.',
    why: {
      'Only the level drops; nothing else changes': 'Distance changes the balance: more room, less mechanism and breath.',
      'More breath, as the mic faces the lips': 'At a metre the jet has spread out; breath is less, not more.',
    },
  },
  {
    id: 'pc.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What must a piccolo mic, its boom and its cable stay clear of?',
    options: ['The music stand and the conductor’s line of sight', 'The air jet, the head’s turn, the hands', 'The audience’s view of the piccolo'],
    correct: 'The air jet, the head’s turn, the hands',
    explain: 'Clearance comes first: the jet out past the lips, a turning head, the hands close together on the short body. Stop the player before anything moves near them.',
    why: {
      'The music stand and the conductor’s line of sight': 'Sight lines matter too, but the safety question is what moves.',
      'The audience’s view of the piccolo': 'The view matters less than the player’s movement and breath.',
    },
  },
  {
    id: 'pc.ctx.1',
    page: 'context',
    prompt: 'The piccolo disappears under a loud band. A good first step?',
    options: ['Move safely closer and adjust the pattern', 'Turn the piccolo channel up a lot', 'Move the mic farther away for a blend'],
    correct: 'Move safely closer and adjust the pattern',
    explain: 'Spill and masking at a distant mic bury the piccolo. Move closer (off the jet), aim the pattern and revise the stage layout — then the fader. Raising a channel because the instrument looks small brings feedback closer.',
    why: {
      'Turn the piccolo channel up a lot': 'More gain raises the band in that mic too, and brings feedback closer.',
      'Move the mic farther away for a blend': 'Farther brings in more band — the opposite of what a loud stage needs.',
    },
  },
  superNull('pc.ctx.2', 'context', 'wedge'),
  {
    id: 'pc.ctx.studio',
    page: 'context',
    prompt: 'An orchestra recording: the piccolo sits naturally in the main pair. Do you add a spot anyway?',
    options: ['Yes — each instrument in an orchestra needs its own spot', 'No — a spot by habit adds nothing here', 'Yes — a close spot sounds clearer'],
    correct: 'No — a spot by habit adds nothing here',
    explain: 'Hear the main pickup first. If the piccolo is audible and sits naturally, a spot adds a delay and a combining check for nothing. Add one only for a stated balance.',
    why: {
      'Yes — each instrument in an orchestra needs its own spot': 'A spot should earn its place; the main pair may carry the piccolo already.',
      'Yes — a close spot sounds clearer': 'A close spot can pull the piccolo unnaturally forward.',
    },
  },
  {
    id: 'pc.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Why can the piccolo player’s hearing be at risk on a stage?',
    options: ['The loud instrument is right by their ear', 'The PA speakers point straight back at them', 'The mic is louder than the instrument'],
    correct: 'The loud instrument is right by their ear',
    explain: 'The piccolo sits centimetres from the player’s right ear. Manage the exposure under the venue’s hearing practice, and keep monitor and in-ear levels comfortable.',
    why: {
      'The PA speakers point straight back at them': 'The PA faces the audience; the risk is the instrument beside the ear.',
      'The mic is louder than the instrument': 'A mic makes no sound of its own; the instrument and the monitors do.',
    },
  },
  {
    id: 'pc.two.1',
    page: 'twoMic',
    prompt: 'A piccolo spot and the main pair sound hollow together. Why?',
    options: ['The main pair inverts the piccolo’s sound', 'They hear each note at different times', 'The piccolo is too high for two mics'],
    correct: 'They hear each note at different times',
    explain: 'The main pair hears each note a little later; summed, some pitches arrive out of step and dip — a comb. Move or rebalance first, then check polarity at matched levels.',
    why: {
      'The main pair inverts the piccolo’s sound': 'Distance delays a sound; it does not flip its sign.',
      'The piccolo is too high for two mics': 'Pitch is not the problem; the arrival-time difference is.',
    },
  },
  polarityDelay('pc.two.2'),
  matchedLevels('pc.two.3'),
  {
    id: 'pc.two.4',
    page: 'twoMic',
    prompt: 'How many close mics does one piccolo usually need?',
    options: ['Two — one for each hand on the body', 'One — multiple close mics are seldom needed', 'Three — one for each register, low, middle and top'],
    correct: 'One — multiple close mics are seldom needed',
    explain: 'One well-placed mic gives a coherent piccolo; more close mics add delays and combining checks for little gain.',
    why: {
      'Two — one for each hand on the body': 'The hands are a few centimetres apart; two close mics only add a delay.',
      'Three — one for each register, low, middle and top': 'One mic hears the whole register; place it well instead.',
    },
  },
  gainCheck('pc.prac.gain', W),
  {
    id: 'pc.prac.3',
    page: 'practice',
    prompt: 'When is a piccolo spot justified in an ensemble recording?',
    options: ['Whenever the piccolo plays, as a rule', 'When the balance needs it and it holds in mono', 'When the piccolo is quieter than the flutes'],
    correct: 'When the balance needs it and it holds in mono',
    explain: 'Hear the main pickup first. A spot earns its place by a stated balance need — then bring it in gently and check the mono sum and the depth.',
    why: {
      'Whenever the piccolo plays, as a rule': 'A spot by habit adds a delay and a combining check for nothing.',
      'When the piccolo is quieter than the flutes': 'The piccolo is rarely quiet — and level comes from the balance, not another mic.',
    },
  },
  {
    id: 'pc.mix.1',
    page: 'practice',
    prompt: 'Wood, plastic or metal: does the piccolo’s material set the mic position?',
    options: ['Yes — a wooden piccolo needs a closer mic', 'No — begin with the same geometry and listen', 'Yes — a metal piccolo needs a darker-sounding mic'],
    correct: 'No — begin with the same geometry and listen',
    explain: 'The material is not a position prescription. Keep comparable geometry when comparing instruments, then adjust from what you actually hear.',
    why: {
      'Yes — a wooden piccolo needs a closer mic': 'No source shows a fixed material sound; start from the geometry.',
      'Yes — a metal piccolo needs a darker-sounding mic': 'Choose by what you hear at matched level, not by the material.',
    },
  },
  nullOnPaper('pc.mix.2', 'wedge'),
  removeDelay('pc.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'pc.sym.harsh',
    observation: 'Harsh or piercing sound',
    firstChecks: 'A presence peak, an on-axis angle, added EQ, or the channel or monitor level? Compare a neutral angle and response at matched level.',
    options: ['Compare a neutral angle and response, matched level', 'Cut a wide band of the high end on the channel', 'Ask the player to play softer through the loud passages'],
    correct: 'Compare a neutral angle and response, matched level',
    explain: 'The piccolo is naturally strong where many mics add presence. Compare the angle and the mic’s response at matched level, then lower the level or adjust carefully — not a blanket cut.',
    why: {
      'Cut a wide band of the high end on the channel': 'A wide cut dulls the piccolo. Find the cause first.',
      'Ask the player to play softer through the loud passages': 'The player’s dynamics are the music; the mic choice and angle are yours to change.',
    },
  },
  {
    id: 'pc.sym.gusts',
    observation: 'Gusts and low-frequency bursts',
    firstChecks: 'Is the capsule in the direct breath stream? Re-aim or move it off the jet; then test a suitable windscreen.',
    options: ['Move it off the jet, then a windscreen', 'Cut the low frequencies hard on the channel', 'Ask the player to blow more gently'],
    correct: 'Move it off the jet, then a windscreen',
    explain: 'In the jet a capsule hears wind. Aim and distance are the first controls; a windscreen helps after that.',
    why: {
      'Cut the low frequencies hard on the channel': 'A filter leaves the turbulence’s upper part and thins the piccolo. Move the capsule.',
      'Ask the player to blow more gently': 'The breath is the player’s art; the mic’s place is yours.',
    },
  },
  colourSymptom('pc.sym.colour', W),
  keyNoiseSymptom('pc.sym.keys', W),
  clipThreatSymptom('pc.sym.clip', W),
  feedbackSymptom('pc.sym.feedback', W),
];

const orderTasks: OrderTask[] = [
  {
    id: 'pc.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic piccolo setup in the order you would do them.',
    steps: [
      { text: 'Start from the arrangement: hear the ensemble pickup first, if there is one', early: 'Start with the music and what already hears the piccolo.' },
      { text: 'Map the jet, the open-hole side, the head’s movement and the music stand', early: 'Map the air and the movement before choosing a place.' },
      { text: 'Choose the mic and a stand (or a fitted headset)', early: 'Choose once you know the arrangement and the movement.' },
      { text: 'With the player stopped, place it near head height, off the breath jet', early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom power on', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set input gain on the strongest passage, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare close, behind-the-head and a farther view at matched levels', early: 'Compare only once the level is set safely.' },
      { text: 'Secure the stand and cable; check listening levels and the lowest note through any filter', early: 'Secure it last, then check the levels and the lowest note.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before switching it, and follow your own equipment’s manual. Keep headphone and in-ear levels comfortable.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'pc.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · An orchestra recording in a good hall. The main pair hears the piccolo but a little distant. Phantom power available.',
    setups: [
      { id: 'a', label: 'A small condenser near head height, close and off the jet, brought in gently under the main pair', ok: true, power: 'phantom', feedback: 'A recommended starting point for a restrained spot — check mono and depth.' },
      { id: 'b', label: 'A small condenser behind and a little above the head, aimed at the finger holes', ok: true, power: 'phantom', feedback: 'A recommended starting point with less breath — check the neighbours’ spill.' },
      { id: 'c', label: 'Three close mics on the piccolo, one per register', ok: false, power: 'phantom', feedback: 'Multiple close mics on one piccolo add delays for nothing.' },
      { id: 'd', label: 'A presence-peak vocal mic close to the lips', ok: false, power: 'phantom', feedback: 'In the jet, and a presence peak can turn the piccolo shrill.' },
      { id: 'e', label: 'Make the spot the loudest channel in the piccolo passages', ok: false, power: 'phantom', feedback: 'A loud spot pulls the piccolo unnaturally forward of the orchestra.' },
    ],
    reasons: [docReason('the piccolo between the lip plate and the left hand, or the player’s head'), clearReason('the jet, the head’s turn and the hands'), POWER_REASON, { id: 'r.main', label: 'The main pair is heard first; the spot only supports it', role: 'optional', feedback: 'A strong reason in an ensemble recording.' }, BRAND_REASON('piccolo'), LOUD_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: the main pickup first, a sensible starting point off the jet, clearance, and the power the mic needs.',
  },
  {
    id: 'pc.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage: a piccolo player who moves, in a band with drums and a wedge. Phantom power available.',
    setups: [
      { id: 'a', label: 'A properly fitted headset, the capsule beside the lips, out of the jet', ok: true, power: 'phantom', feedback: 'A recommended starting point that follows the head — check the register and feedback.' },
      { id: 'b', label: 'A stand mic close, off the jet, its rejection aimed at the wedge — the player stays on a mark', ok: true, power: 'phantom', feedback: 'A recommended starting point if the player agrees to a working zone.' },
      { id: 'c', label: 'A concert-flute clip squeezed onto the piccolo', ok: false, power: 'phantom', feedback: 'A clip of the wrong size or pressure can slip, cover a hole or press the body.' },
      { id: 'd', label: 'A mic a metre away, turned up to clear the band', ok: false, power: 'phantom', feedback: 'Far away on a loud stage it hears the band; turned up, it brings feedback.' },
      { id: 'e', label: 'Raise the piccolo channel because the instrument is small', ok: false, power: 'phantom', feedback: 'A small instrument is not a quiet one — and more gain brings feedback closer.' },
    ],
    reasons: [docReason('the embouchure or the piccolo’s close position'), clearReason('the jet, the head’s turn, the hands and the cable path'), POWER_REASON, { id: 'r.ears', label: 'Monitor and in-ear levels kept comfortable for the player', role: 'optional', feedback: 'A fair reason — the piccolo is already loud at their ear.' }, BRAND_REASON('piccolo'), { id: 'r.loudest', label: 'Turn it up until the piccolo is louder than the drums', role: 'wrong', feedback: 'More gain raises the stage in that mic too, and brings feedback closer.' }],
    explain: 'Two setups pass. What passes is the reasoning: a mount that fits or a close aimed stand mic, off the jet, clearance, the power it needs — and safe listening levels.',
  },
];

const predictions: WindLesson['predictions'] = {
  sound: { prompt: 'Before you step through: half a flute’s length — how high does a piccolo sound?', options: ['An octave higher', 'A fifth higher', 'The same'], after: 'Now STEP through (or PLAY ONCE), then try the notes on the next step.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the mic from close to a metre in front. What changes?', options: ['Fewer clicks, more room', 'More breath', 'Nothing'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge is on the floor in front. Where will a supercardioid aimed back at the piccolo reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'How does a piccolo’s pitch compare with its written notes?',
    options: ['An octave above them', 'A fifth below them', 'Exactly as written'],
    correct: 'An octave above them',
    explain: 'About half a flute’s length, the piccolo sounds an octave above its written pitch.',
    why: {
      'A fifth below them': 'A shorter tube sounds higher, not lower.',
      'Exactly as written': 'The piccolo is written an octave below how it sounds.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What starts a piccolo’s sound?',
    options: ['A small cane reed against the lip plate', 'An air jet across the hole’s edge', 'The player’s lips buzzing against the lip plate'],
    correct: 'An air jet across the hole’s edge',
    explain: 'Like the flute: an edge-blown jet across the embouchure hole drives the air column. No reed.',
    why: {
      'A small cane reed against the lip plate': 'The piccolo has no reed.',
      'The player’s lips buzzing against the lip plate': 'That is how a brass instrument starts.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'Where does a piccolo’s sound leave?',
    options: ['A small bell at the end of the body', 'The embouchure and the open holes', 'The lip plate and nothing else'],
    correct: 'The embouchure and the open holes',
    explain: 'There is no single bell: the embouchure hole and the open holes radiate, changing with the fingering.',
    why: {
      'A small bell at the end of the body': 'A piccolo has no bell.',
      'The lip plate and nothing else': 'The open holes radiate too.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Why can a presence-peak vocal mic sound shrill on a piccolo?',
    options: ['It adds level where the piccolo is already strong', 'It cuts the piccolo’s high notes off completely', 'It turns the player’s breath noise into a loud whistle'],
    correct: 'It adds level where the piccolo is already strong',
    explain: 'The piccolo has strong energy where such mics add presence. Compare responses at matched level.',
    why: {
      'It cuts the piccolo’s high notes off completely': 'A presence peak boosts, it does not cut.',
      'It turns the player’s breath noise into a loud whistle': 'The mic does not change the breath; the peak adds edge.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'What must a stand and its boom stay clear of around a piccolo player?',
    options: ['The music stand, so the part is readable', 'The jet, a turning head and the hands', 'The audience’s view of the piccolo'],
    correct: 'The jet, a turning head and the hands',
    explain: 'Clearance comes first: the air jet past the lips, the head’s movement, the hands on the short body.',
    why: {
      'The music stand, so the part is readable': 'Sight lines matter, but safety is about what moves.',
      'The audience’s view of the piccolo': 'The view matters less than the player’s movement.',
    },
  },
  hearingDiag('q.6', W),
];

const floorY = SEATED.body.floorY;
const wedges: Wedge[] = [
  { id: 'wedge', label: 'the player’s floor wedge, in front, facing back at them', short: 'WEDGE', p: { x: -150, y: floorY, z: 1450 }, lift: 150, faces: { x: 0.1, y: 0, z: -1 }, note: 'On the floor in front, facing back at the player — below and behind a mic aimed back at the piccolo.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
  { id: 'side', label: 'another player’s wedge, off to the right', short: 'SIDE WEDGE', p: { x: -1400, y: floorY, z: 800 }, lift: 150, faces: { x: 0.8, y: 0, z: -0.6 }, note: 'Off to one side, facing another player: well off the mic’s axis.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
];

const copy: Partial<LessonCopy> = {
  variantKey: 'POSTURE',
  variantShort: { standing: 'standing', seated: 'seated' },
  sceneSubject: { standing: 'a piccolo held by a standing player', seated: 'a piccolo held by a seated player' },
  viewTag: { side: 'FRONT · FROM THE AUDIENCE', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'to player’s left', minus: 'to player’s right', label: 'ACROSS', blurb: 'Toward the player’s left or right (x) — the piccolo reaches out to the right.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The piccolo sits at the lips.' },
    z: { plus: 'toward the audience', minus: 'toward the player', label: 'FRONT–BACK', blurb: 'Toward the audience or toward the player (z).' },
  },
  instrument: {
    figureBadge: 'A piccolo, its keys toward you · every part named',
    figureLabel: 'A piccolo seen from the side.',
    partsBadge: 'A piccolo player from the audience · tap a part to name it',
    partsLooking: { side: 'Front view · from the audience', top: 'Top view · from above' },
    partsIdle: 'The air jet starts the sound at the small embouchure hole; the short air column rings; the embouchure and the open holes let it out — the next page shows how. The piccolo sits right by the player’s right ear.',
    variantNotes: { seated: 'SEATED: the same hold at the end of the flute row — the floor and the chair closer to a stand’s base.' },
  },
  placement: {
    workedZone: { standing: 'pc.close', seated: 'pc.close' },
    workedLine: 'This starting point also reads how far the mic is from {line}.',
    workedAim: 'Aim between the lip plate and the first keys — the lab counts it while the mic points within about {tol}° of that spot — angled out of the air jet. It is the flute’s figure, a comparison to begin with.',
    workedClear: 'Clear of every part — the air jet, the head’s turn and the hands. Clearance comes first, before any number, and the player stops before a real mic moves.',
    blocked: {},
    reveal: 'Farther tends to bring more room with fewer clicks and gusts; closer, more detail, breath and key action. Players vary, so “nothing changes” is the one answer to rule out. Each zone’s LISTEN FOR line is an idea to check by ear.',
    typeNotes: {
      sdcCard: 'Ideas to try: begin close, between the lip plate and the first keys, off the jet; then behind the head, or farther in front in a good room — at matched level, low to high.',
      wwHeadset: 'Ideas to try with a headset: keep the capsule beside the lips, out of the jet; change only its angle — and check the whole register.',
    },
    note: 'Clearance comes first: stop the player before moving a real mic. A mic, boom or cable anywhere a turning head, the hands or the piccolo can reach — or in the air jet — is in the wrong place.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we recommend you begin — the flute’s starting points, transferred: the piccolo between the lip plate and the left hand, the player’s head, the middle of the piccolo, the embouchure hole. Places to begin and compare, not piccolo-specific optimums.',
      separate: 'Distance, height and angle are separate variables: change one at a time, and play low, high, soft, strong and fast passages each time. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.',
      clearance: 'Clearance comes first. Stop the player before moving a mic; keep the mic, stand and cable clear of the air jet, a turning head and the hands. The engine stops the mic and names what it would touch.',
      tendencies: 'Close tends to bring detail, breath and keys; behind the head, less breath; a metre in front, more room. A presence peak can turn a piccolo shrill. These are tendencies, and piccolos vary.',
    },
  },
  context: {
    variant: 'standing',
    zone: 'pc.close',
    typeId: 'sdcCard',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'sdcCard' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'sdcCard' },
      { id: 'hypercardioid', label: 'hypercardioid', typeId: 'sdcCard' },
    ],
    micNoun: 'A small condenser',
    shield: ['ww.body', 'ww.body.1', 'ww.body.2', 'ww.headjoint'],
    azMax: 60,
    elMax: 70,
    aimBlurb: 'Swing the front up to 60° either way — it still faces the piccolo.',
    plan: { u0: -1700, u1: 900, v0: -600, v1: 1750 },
    side: { u0: -1700, u1: 900, v0: -500, v1: 1700 },
    target: 'wedge',
    frontIds: [],
    targetWord: 'wedge',
    looking: 'Top view · mic close above the piccolo',
    prompt: 'The player’s wedge stays where they need it. Turn the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — while the mic still points at the piccolo.',
    activityDone: 'done — the wedge sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies. Use the null to aim, not to promise silence.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). Close above the piccolo and aimed down at it, its rear points up and away — the wedge down on the floor in front is off that line, so turning and tilting both matter.',
    shieldNote: 'The player and the piccolo can reflect stage sound into a mic aimed at them — the free-field pattern cannot show that. Listen with the monitors on.',
    studioId: 'pc.ctx.studio',
    studioPrompt: 'An orchestra session, the main pair up: does the piccolo need its own mic?',
    studioNote: 'In an ensemble recording, hear the main pickup first; a piccolo spot earns its place by a stated balance need. Switch back to LIVE for the monitor exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not restrictions.',
      points: [
        { title: 'PERSPECTIVE', text: 'Orchestra: the main pair first, a restrained spot only if needed. Solo: a stand mic near head height, off the jet. Loud stage: close, a fitted headset or an approved mount.' },
        { title: 'SPILL AND FEEDBACK', text: 'Monitors, the PA and the band. Place wedges for the actual pattern — a supercardioid has a rear lobe — and bring levels up deliberately, listening for piercing pickup.' },
        { title: 'MOVEMENT', text: 'A fitted headset follows the head and favours the head joint; a stand mic has a working zone.' },
        { title: 'HEARING', text: 'The piccolo is loud at the player’s ear: manage rehearsal and show exposure, and keep monitor and in-ear levels comfortable.' },
      ],
      body: 'With a wedge in front of the player, a pattern’s rejection is a tool to aim — tilting as well as turning. A small instrument does not need a louder channel.',
      warn: 'No mic position alone prevents feedback: the pattern, the other open mics, the monitors, the system level and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
    },
  },
  twoMic: {
    variant: 'standing',
    A: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'pc.close' },
    B: { typeId: 'sdcCard', pattern: 'omni', zone: 'pc.front' },
    learn: [
      'A second mic — or the main pair the piccolo plays into — is a choice for a reason: multiple close mics are seldom needed for one piccolo.',
      'When it goes in: hear each mic alone, then the pair in MONO at the intended levels. Move or rebalance a mic first; check both polarity states only after that.',
    ],
    warn: 'This simplified graph treats the piccolo as one point and both mics as hearing the same sound. Real mics at different distances hear different mixes, so read the notch POSITIONS and treat their depths as illustrative. Judge by ear, in mono, at matched levels.',
  },
  practice: {
    gain: 'pc.prac.gain',
    second: 'pc.prac.3',
    mixed: ['pc.mix.1', 'pc.mix.2', 'pc.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: what the material tells you, a pattern’s null, and polarity versus delay.',
  },
  terms: {
    instrument: 'the piccolo',
    aimRef: 'its reference',
    startIntro: 'This lesson is about putting a microphone on a piccolo — after the flute lesson. First the piccolo itself: what it is, how the air jet makes its sound an octave above the flute’s, where the sound and the air leave, and where the player stands or sits. Then the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
    startNew: 'Good — NEXT takes you through the piccolo first. You can change how you started here at any time.',
    refTitle: 'MEASURED FROM',
    otherRef: 'The same number measured from another part — the lips, the end, the head — would put the mic somewhere else.',
    noAim: 'This starting point gives no aim, so the mic simply faces the piccolo. Distance, height and angle are still separate things to try.',
    clipMount: 'Mount: a headset the player agrees to wear, properly fitted — or a mount made for this piccolo',
    standMount: 'Mount: a stand placed clear of the air jet, a turning head and the hands',
    inPath: 'piccolo in path',
    facing: 'facing the piccolo',
    observation: 'For a real piccolo, with the player’s agreement, and the player stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
  },
};

export const A07_LESSON: WindLesson = {
  id: 'A07',
  labId: 'winds',
  title: 'Piccolo',
  subtitle: 'Half a flute, an octave up: the flute’s starting points, the ensemble first, your ears protected',
  noun: { one: 'piccolo', many: 'piccolos' },
  model: PICCOLO_MODEL,
  micTypeIds: ['sdcCard', 'wwHeadset'],
  zones: PICCOLO_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'The flute’s small relative: an edge-blown transverse flute about half a concert flute’s length, sounding an octave above its written notes. It may be wood, plastic or metal — the material is not a mic recipe.', src: 'Y-HUB-PICC' },
    { title: 'WHERE YOU MEET IT', text: 'Orchestras, wind and marching bands, chamber groups, film sessions and stages. This lesson covers one piccolo: an ensemble recording, a solo in a room, and a moving player on a loud stage.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'It sparkles above the whole ensemble — and it carries. Ask what the music needs, and whether the ensemble pickup already hears it.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'About 33 cm long; its lowest note is about 587 Hz (D5) and it reaches past 4 kHz. This lab draws a wooden piccolo with a silver head joint and keys, held at the lips — standing, or seated.', src: 'Y-HUB-PICC' },
  ],
  sound: {
    stages: [
      { title: 'The air jet', text: 'The player blows a thin jet of air across the small embouchure hole, aimed at its far edge.' },
      { title: 'The jet flips at the edge', text: 'The jet strikes the edge and flips in and out of the hole, again and again — pushed in time by the short air column inside.' },
      { title: 'The air column rings', text: 'The air inside rings as a standing wave between the embouchure hole and the first open hole — both open, so the pressure stays still at both ends — half a flute’s length, an octave higher.' },
      { title: 'Sound and air leave', text: 'Sound leaves from the embouchure hole for every note and from the first open hole; the open end joins in for the lowest notes. The jet’s air blows out past the lips.' },
    ],
    attack: 'The start of a note: the tongue releasing the jet and a quick rush of air at the lips. A mic close to the lips hears more of it, and of the breath.',
    body: 'The sustained tone: the short air column ringing, leaving from the embouchure and the open holes. Around 2 kHz the piccolo sends a fairly strong share to the front. Both are tendencies, and piccolos vary.',
    head: { diameterMm: 0, rods: 0, label: 'the air column', strikeSrc: 'PL-2010' },
  },
  setting: {
    items: [
      { id: 'self', label: 'the piccolo and its player', short: 'PICCOLO', note: 'Held like a flute, out to the right, the embouchure under the lower lip — right by the player’s right ear. Ringed in amber: the instrument this lesson mics.', prov: { kind: 'illustrative', reason: 'piccolo/GEOMETRY_PROPOSAL.md (drawing defaults)' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'jet', label: 'the air jet and a turning head', short: 'JET · HEAD', note: 'The breath blows out past the lips; the head turns with the music. No capsule in the jet, no boom where the head can strike it.', prov: { kind: 'illustrative', reason: 'the flute family’s jet cone (drawing default)' }, tag: 'KEEP CLEAR', scene: 'kit', planIds: ['self'] },
      { id: 'ear', label: 'the player’s right ear', short: 'THE EAR', note: 'The loud piccolo is centimetres from the player’s ear: hearing exposure matters for them most of all.', prov: { kind: 'illustrative', reason: 'the posture' }, tag: 'HEARING', scene: 'kit', planIds: ['self'] },
      { id: 'stand', label: 'the music stand', short: 'MUSIC STAND', note: 'In front of the player. They must see the music and the conductor.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SIGHT LINE', scene: 'kit', planIds: ['stand.picc'] },
      { id: 'flutes', label: 'the flutes beside', short: 'FLUTES', note: 'The piccolo usually sits at the end of the flute row; a piccolo mic hears them too.', prov: { kind: 'illustrative', reason: 'a typical seating' }, tag: 'SPILL', scene: 'kit', planIds: ['fl1', 'fl2'] },
      { id: 'behind', label: 'the clarinets behind', short: 'CLARINETS', note: 'Behind the front row — close to a mic behind the player’s head.', prov: { kind: 'illustrative', reason: 'a typical seating' }, tag: 'SPILL', scene: 'kit', planIds: ['bcl', 'cl2', 'cl1'] },
      { id: 'wedge', label: 'the player’s wedge (monitor)', short: 'WEDGE', note: 'On a stage, a floor monitor in front, facing back at the player.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'side', label: 'another player’s wedge', short: 'SIDE WEDGE', note: 'Off to one side, facing another player.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Live, the audience already hears the piccolo; the PA adds what the room needs.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage', planIds: ['audience', 'pa'] },
      { id: 'main', label: 'a main pair for the ensemble', short: 'MAIN PAIR', note: 'In an ensemble recording, hear the main pair first — it may carry the piccolo already.', prov: { kind: 'illustrative', reason: 'a generic main pair' }, tag: 'MAIN PAIR', scene: 'studio' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'No wedges on the floor; a good room carries a piccolo a metre away.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors on the floor feed the players, the PA faces the audience, and a band can be loud. A close mic off the jet, its pattern aimed — or a fitted headset — helps; bring levels up deliberately and listen for piercing pickup.',
    studio: 'STUDIO: no wedges, a room that may sound good. In an ensemble the main pair may carry the piccolo; for a solo, a stand mic near head height off the jet, compared with behind the head and farther in front.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic piccolo setup for an ensemble recording and for a loud stage, describe an alternative position, and explain when a spot is needed at all. With a real piccolo and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'room', label: 'Room or stage', kind: 'text' },
      { id: 'posture', label: 'Player', kind: 'choice', choices: ['standing', 'seated'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser, cardioid', 'small condenser, omni', 'headset', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, from the piccolo (or which part)', kind: 'text' },
      { id: 'notes', label: 'What you heard: breath, keys, edge, low and high, room', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The player’s height above the floor and the hold — drawing defaults — so no HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The 330 mm length is sourced; the 17 mm cork offset is the flute’s, the joint split, the bore and the keys are drawing defaults; the tone holes sit where the semitone rule puts them (a simplified picture).', dims: [] },
    { text: 'The air jet, the hands, arms and head — illustrative; a 20 mm margin round the piccolo.', dims: [] },
    { text: 'Every distance is the flute’s, transferred; the headset’s 4–9 cm and its size and reach are drawing defaults.', dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules; on the piccolo they are the flute’s starting points, carried over. Every piccolo, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: one player in a typical hold, tone holes where the semitone rule puts them, the air column as an ideal pipe, mic patterns and the two-mic comb as textbook shapes. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped, and only with their agreement.',
  copy,
  wind: windExtra(SPEC, {
    soundSubject: 'A piccolo stood on end, keys toward you, its air column drawn open',
    breath: 'The jet blows out across the embouchure hole and past the lips: a capsule in it hears wind and pops. Keep the capsule off the jet; a windscreen helps after that.',
    keys: 'Small keys close together: clicks are loud within a few centimetres; a farther view or behind the head hears them less.',
    directivity: 'Measured round a player in a quiet room: the lowest notes spread in much the same directions as the flute’s, and around 2 kHz the piccolo sends a fairly strong share to the front.',
    noteDefault: 9,
  }),
};
