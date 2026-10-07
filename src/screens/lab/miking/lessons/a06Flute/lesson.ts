/**
 * A06 FLUTE (metal and wooden) — the lesson's pages as DATA (blueprint §7).
 * The words come from the owner's lesson (docs/labs/miking/source_text/
 * Flute-Miking-Technique-Metal-and-Wooden.txt, "L<n>" in COMMENTS only) with
 * the fixes in CORRECTIONS_LOG.md (A6-01 …) applied: DPA's aim is "halfway
 * between the mouthpiece and the left hand" (the lesson's "embouchure" is the
 * same point); Shure's behind-head row and MDAT's 2–4 ft added; the open foot
 * and the open holes radiate as well as the embouchure (PL-2010).
 *
 * "Identify the design first" (L80): the variant is the DESIGN — a metal
 * concert flute, a wooden keyed concert flute, a simple-system wooden flute.
 *
 * OWNER RULING 2026-10-04: suggested starting points, never dogma; no
 * source, brand or model in learner text; no badges.
 */
import type { DiagnosticItem, MikingScenario, OrderTask, LessonPages, PageContent, SourcePageId, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import type { LessonCopy } from '../../engine/model/copy.ts';
import { BRAND_REASON, LOUD_REASON, POWER_REASON, clearReason, clipThreatSymptom, colourSymptom, docReason, feedbackSymptom, firstHoleCheck, gainCheck, hearingCheck, hearingDiag, keyNoiseSymptom, matchedLevels, nullOnPaper, polarityDelay, removeDelay, superNull, type WindWords } from '../shared/woodwinds/windItems.ts';
import { windExtra, type WindLesson } from '../shared/woodwinds/windLesson.ts';
import { FLUTE_MODEL, LAYOUTS, SPEC } from './geometry.ts';
import { FLUTE_ZONES } from './model.ts';

const W: WindWords = { noun: 'flute', player: 'flutist', end: 'the foot', exciter: 'the embouchure hole', moving: 'the hands, the head’s turn and the flute’s swing' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the flute',
    goal: 'Get to know the transverse flute — metal or wooden, and which design — what it is, where you meet it, what it does in the music, and its parts, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The player blows an air jet across the embouchure hole; the air column rings; the sound leaves from the embouchure hole and the first open holes. Identify the design first: a keyed metal or wooden concert flute, or a simple-system flute with open finger holes.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how an air jet becomes a flute note — the jet, the edge, the air column, the first open hole — and where the sound and the air leave. Shown, never played.',
    credit: { scenarios: ['fl.snd.1', 'fl.snd.2', 'fl.snd.3'], interactive: 'soundPath', note: 'Step the sequence through to the end (or play it once), and answer the three checks.' },
    takeaway: 'Sound leaves from the embouchure hole for every note and from the first open hole, which moves as the fingering changes; the air jet blows straight out past the lips. A mic in the jet hears wind — tendencies, and flutes vary.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the flute sits — out to the player’s right, the head’s turn, the hands, the air jet, the music stand and the section — what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['fl.set.1', 'fl.set.2', 'fl.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The flute reaches out to the player’s right and moves with the head; the jet blows out past the lips. Keep the mic clear of all of it, ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the flute by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['fl.mic.1', 'fl.mic.2', 'fl.mic.3', 'fl.rec.1'], note: 'Answer the four checks (one reaches back to how the flute sounds).' },
    takeaway: 'A small condenser on a stand hears the flute from a chosen place; a headset or a clip on the foot moves with the player. All three need phantom power. An omni can be less sensitive to wind up close.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — close, between the lip plate and the left hand, off the air jet — then move the mic and see what changes.',
    credit: { scenarios: ['fl.place.1', 'fl.place.2', 'fl.place.3', 'fl.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'Close for detail, behind the head for less breath, a metre in front for the room, a headset or a clip for a moving player — each a place to begin, not a rule. Keep the capsule out of the air jet.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the player’s wedge — and know what a pattern cannot do, and why a studio solo and a loud stage need different choices.',
    credit: { scenarios: ['fl.ctx.1', 'fl.ctx.2', 'fl.ctx.studio', 'fl.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A cardioid rejects most behind; a supercardioid toward the rear near 125°. Real nulls are shallower than the picture, and no mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a close flute mic and a farther one (or a main pair) can sound hollow together, and what the polarity switch does and does not change.',
    credit: { scenarios: ['fl.two.1', 'fl.two.2', 'fl.two.3', 'fl.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two mics at different distances hear the flute at different times: some pitches cancel in the sum. Move or rebalance first; polarity flips the sign and never removes a delay. Judge in mono, at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — the air jet, where the mic looks, its distance, the pattern, the mount — before reaching for tone controls or a windscreen.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one flute mic in the right order, choose and justify a setup for a studio solo and a moving player on a loud stage, and say what would justify a second mic.',
    credit: { scenarios: ['fl.prac.order', 'fl.prac.gain', 'fl.prac.setup1', 'fl.prac.setup2', 'fl.prac.3', 'fl.mix.1', 'fl.mix.2', 'fl.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real flute.' },
    takeaway: 'The design identified, the capsule off the air jet, clearance from the head, hands and flute, the right power and level, and an accurate account of polarity versus delay pass. A material stereotype or a brand do not — and more than one setup can pass.',
  },
};

/* THE CHECKS. Lesson lines in comments only: fl.snd.* L6, PL-2010 ·
 * fl.set.* L7, L11, L12 · fl.mic.* L23, L28 · fl.place.* L14-L16 · fl.ctx.*
 * L27 · fl.two.* L25 · fl.prac.* / fl.mix.* L80-L84. */
const scenarios: MikingScenario[] = [
  {
    id: 'fl.snd.1',
    page: 'sound',
    prompt: 'Where does a flute’s sound leave the instrument?',
    options: ['Only from the foot, the open far end of the flute', 'The embouchure hole and the first open holes', 'Only from the lip plate, where the player blows'],
    correct: 'The embouchure hole and the first open holes',
    explain: 'The embouchure hole radiates for every note, and the air column lets the sound out at the first open holes — which move as the fingering changes. With every hole closed, the open foot joins in.',
    why: {
      'Only from the foot, the open far end of the flute': 'The foot leads only for the lowest notes, every hole closed; most notes leave from the open holes and the embouchure.',
      'Only from the lip plate, where the player blows': 'The embouchure hole radiates — but so do the open holes along the body.',
    },
  },
  {
    id: 'fl.snd.2',
    page: 'sound',
    prompt: 'A mic sits right in front of the player’s lips, in the air jet. What will it catch most?',
    options: ['Only the high notes, as the jet carries no low ones', 'Nothing unusual: the jet is part of the tone', 'Wind gusts and pops along with the tone'],
    correct: 'Wind gusts and pops along with the tone',
    explain: 'The jet blows out past the lips across the embouchure hole; a capsule in it hears the turbulence as rumble and pops. Some breath is part of the flute’s character — the aim is to choose it, by angle and distance.',
    why: {
      'Only the high notes, as the jet carries no low ones': 'The jet is moving air, not a pitch: in a capsule it sounds as wind and pops across the range.',
      'Nothing unusual: the jet is part of the tone': 'Breathy articulation is part of the sound; a jet blowing straight into a capsule is not.',
    },
  },
  firstHoleCheck('fl.snd.3', W),
  hearingCheck('fl.set.1', W),
  {
    id: 'fl.set.2',
    page: 'setting',
    prompt: 'On a simple-system wooden flute, can a clip go over a finger hole if it holds firmly?',
    options: ['Yes — a firm grip keeps the clip from slipping', 'Yes, if it is padded so it cannot scratch the wood', 'No — it would cover the hole the finger plays'],
    correct: 'No — it would cover the hole the finger plays',
    explain: 'A simple-system flute’s finger holes are open — the finger is the key. Nothing may cover one, bridge a joint or press the wood; with any doubt about the fit, use a stand.',
    why: {
      'Yes — a firm grip keeps the clip from slipping': 'A firm grip over an open hole stops the note. The fit is not the question; the hole is.',
      'Yes, if it is padded so it cannot scratch the wood': 'Padding does not uncover the hole. Nothing goes over an open finger hole.',
    },
  },
  {
    id: 'fl.set.3',
    page: 'setting',
    prompt: 'Before placing any mic, what do you note about a flutist?',
    options: ['Only the colour of the flute, to choose the right EQ', 'The design, the jet, the hands and how the head moves', 'Nothing yet: the starting point already says where it goes'],
    correct: 'The design, the jet, the hands and how the head moves',
    explain: 'Identify the design (keyed metal, keyed wood or simple-system), then mark the embouchure, the air jet, both hands, the foot, the head’s turn and the music stand — and hear the whole part, quiet and strong.',
    why: {
      'Only the colour of the flute, to choose the right EQ': 'A silver colour says nothing reliable about the metal — or the sound. Listen to the player.',
      'Nothing yet: the starting point already says where it goes': 'A starting point says where to begin — only where the jet, the hands and the head cannot reach it.',
    },
  },
  {
    id: 'fl.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Why can a mic aimed at one small spot on a flute change colour across a phrase?',
    options: ['The open hole that sounds moves with every note', 'The metal body changes temperature as it plays', 'The embouchure hole closes up on the high notes'],
    correct: 'The open hole that sounds moves with every note',
    explain: 'Each fingering opens a different first hole, so the place much of the sound leaves moves along the flute. A narrowly aimed mic hears that movement as changes in colour.',
    why: {
      'The metal body changes temperature as it plays': 'Warming tunes the flute slightly; it does not move where the sound leaves.',
      'The embouchure hole closes up on the high notes': 'The embouchure hole stays open for every note — the player blows across it.',
    },
  },
  {
    id: 'fl.mic.1',
    page: 'microphone',
    prompt: 'Close to a flute, why might an omni be worth a try?',
    options: ['It rejects the room better than a cardioid does', 'It needs no phantom power, unlike a cardioid', 'It can be less sensitive to wind and pops'],
    correct: 'It can be less sensitive to wind and pops',
    explain: 'With no directional design, an omni has no proximity boost and tends to handle breath better up close. It does hear more room and stage — it rejects nothing.',
    why: {
      'It rejects the room better than a cardioid does': 'An omni rejects nothing: it hears more room, not less.',
      'It needs no phantom power, unlike a cardioid': 'A condenser needs phantom power whatever its pattern.',
    },
  },
  {
    id: 'fl.mic.2',
    page: 'microphone',
    prompt: 'A flutist walks the stage. Which mounts keep one distance as they move?',
    options: ['A stand mic in front, carefully aimed at the flute', 'A headset, or a clip on the foot of a keyed flute', 'A mic on the music stand, pointing at the player'],
    correct: 'A headset, or a clip on the foot of a keyed flute',
    explain: 'A headset follows the head (it favours the embouchure); a clip round the foot follows the flute (it favours the holes and keys). Neither sounds exactly like a stand mic — test the whole register.',
    why: {
      'A stand mic in front, carefully aimed at the flute': 'A stand mic has a working zone; a walking player leaves it.',
      'A mic on the music stand, pointing at the player': 'The music stand stays put while the player moves — and its desk reflects sound.',
    },
  },
  {
    id: 'fl.mic.3',
    page: 'microphone',
    prompt: 'Your only spare input has no phantom power. Can the headset run from it?',
    options: ['Yes — a headset is powered by the player’s battery pack', 'No — like the stand condenser, it needs phantom power', 'Yes, if the cable is kept short enough'],
    correct: 'No — like the stand condenser, it needs phantom power',
    explain: 'The stand condenser, the clip miniature and the headset are all condensers that need phantom power (the miniatures through their adapters). Find a powered input.',
    why: {
      'Yes — a headset is powered by the player’s battery pack': 'A wireless pack powers its own link; on a cable, the headset needs phantom power through its adapter.',
      'Yes, if the cable is kept short enough': 'Cable length does not power a condenser.',
    },
  },
  {
    id: 'fl.place.1',
    page: 'placement',
    prompt: 'The close starting point is aimed halfway between the lip plate and the left hand. Why not straight at the lips?',
    options: ['The lips are too quiet for a close mic to hear', 'The left hand plays the loudest notes', 'At the lips, the capsule sits in the jet'],
    correct: 'At the lips, the capsule sits in the jet',
    explain: 'Halfway along hears the embouchure and the first holes together, with the capsule angled out of the breath stream. At the lips, wind and pops take over.',
    why: {
      'The lips are too quiet for a close mic to hear': 'The lips are not quiet: the jet there is loud — as wind.',
      'The left hand plays the loudest notes': 'No hand plays louder notes; the point is the jet and the blend.',
    },
  },
  {
    id: 'fl.place.2',
    page: 'placement',
    prompt: 'Is a mic behind and slightly above the player’s head aimed at the flute?',
    options: ['No — it hears only the back of the head', 'Yes — past the head, at the finger holes', 'No — it points at the ceiling to hear the room'],
    correct: 'Yes — past the head, at the finger holes',
    explain: 'It looks over the shoulder, past the head, at the finger holes — the jet blows away from it, so it tends to hear less breath. Check the head’s movement and the neighbours.',
    why: {
      'No — it hears only the back of the head': 'Placed a little above and to the side, it sees past the head to the flute.',
      'No — it points at the ceiling to hear the room': 'It is aimed at the finger holes, not the ceiling.',
    },
  },
  {
    id: 'fl.place.3',
    page: 'placement',
    prompt: 'You move from 5–10 cm to about a metre in front, at head height. What tends to change?',
    options: ['Only the level drops; the tone stays just the same', 'More breath, as the mic now faces the lips', 'More of the room; key clicks and gusts fall back'],
    correct: 'More of the room; key clicks and gusts fall back',
    explain: 'Farther away the flute integrates with the room, and the mechanical sounds and breath fall back — with more spill and more change as the player moves.',
    why: {
      'Only the level drops; the tone stays just the same': 'Distance changes the balance: more room, less mechanism and breath.',
      'More breath, as the mic now faces the lips': 'At a metre the jet has spread out; breath is less, not more.',
    },
  },
  {
    id: 'fl.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What must a flute mic, its boom and its cable stay clear of?',
    options: ['The music stand and the line of sight to the conductor', 'The air jet, the head’s turn, the hands and the flute', 'The audience’s view of the flute and its keys'],
    correct: 'The air jet, the head’s turn, the hands and the flute',
    explain: 'Clearance comes first: the flute reaches out to the right and moves with the head; the hands work the keys; the jet blows out past the lips. Stop the player before anything moves near them.',
    why: {
      'The music stand and the line of sight to the conductor': 'Sight lines matter too, but the safety question is what moves.',
      'The audience’s view of the flute and its keys': 'The view matters less than the player’s movement and breath.',
    },
  },
  {
    id: 'fl.ctx.1',
    page: 'context',
    prompt: 'A flute solo in a loud band, a wedge in front. A good first step?',
    options: ['A farther mic, so the band blends with the flute', 'Closer, off the jet, rejection toward the wedge', 'Turn the flute channel up until it is above the band'],
    correct: 'Closer, off the jet, rejection toward the wedge',
    explain: 'On a loud stage, a closer mic with its rejection toward the wedge gives more flute relative to the band — or a headset or foot clip for a moving player. More gain raises the band too.',
    why: {
      'A farther mic, so the band blends with the flute': 'Farther brings in more band and monitor — the opposite of what a loud stage needs.',
      'Turn the flute channel up until it is above the band': 'More gain raises everything the mic hears and brings feedback closer.',
    },
  },
  superNull('fl.ctx.2', 'context', 'wedge'),
  {
    id: 'fl.ctx.studio',
    page: 'context',
    prompt: 'A flute overdub in a good, quiet room: is it fair to compare a mic about a metre in front?',
    options: ['No — a metre away is too far for a flute', 'Yes — it adds room and softens the keys', 'No — a front mic hears only the foot'],
    correct: 'Yes — it adds room and softens the keys',
    explain: 'In a good room, about a metre in front at head height can integrate the flute and the room and soften the key clicks — then compare it with the close and behind-the-head positions at matched level.',
    why: {
      'No — a metre away is too far for a flute': 'In a quiet, good room a metre is a fair studio trial; on a loud stage it would not be.',
      'No — a front mic hears only the foot': 'From in front, at head height, the mic hears the whole flute — the embouchure, the holes and the foot.',
    },
  },
  {
    id: 'fl.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Wooden or metal: does the material tell you where to put the mic?',
    options: ['Yes — wood needs a closer, darker mic', 'No — start from the same geometry and listen', 'Yes — metal needs a treble cut before testing'],
    correct: 'No — start from the same geometry and listen',
    explain: 'A wooden concert flute works like a metal one: the embouchure and the open holes. Begin with the same positions, then move for what you actually hear — not for a material stereotype.',
    why: {
      'Yes — wood needs a closer, darker mic': 'No source shows a fixed material sound. Start from the geometry and listen.',
      'Yes — metal needs a treble cut before testing': 'A silver colour is not a recipe. Test first, at matched level.',
    },
  },
  {
    id: 'fl.two.1',
    page: 'twoMic',
    prompt: 'A close flute mic and a farther one sound hollow together. Why?',
    options: ['The farther mic inverts the flute’s sound on its way there', 'The sound reaches them at different times, so pitches cancel', 'Two mics on one flute cancel its low notes between them'],
    correct: 'The sound reaches them at different times, so pitches cancel',
    explain: 'The farther mic hears each note a little later; summed, some pitches arrive out of step and dip — a comb. Move or rebalance first, then check polarity at matched levels.',
    why: {
      'The farther mic inverts the flute’s sound on its way there': 'Distance delays a sound; it does not flip its sign.',
      'Two mics on one flute cancel its low notes between them': 'Cancellation depends on the delay and the levels: some pitches dip, others add.',
    },
  },
  polarityDelay('fl.two.2'),
  matchedLevels('fl.two.3'),
  {
    id: 'fl.two.4',
    page: 'twoMic',
    prompt: 'In a chamber recording with the main pair up, how do you use a flute spot?',
    options: ['Make it the loudest channel whenever the flute leads', 'Leave the main pair out while the flute plays its solo', 'Hear the main first; add the spot gently, in mono too'],
    correct: 'Hear the main first; add the spot gently, in mono too',
    explain: 'The main pair carries the ensemble; a close spot can make the flute unnaturally forward. Add it only for a stated balance, and check the mono sum.',
    why: {
      'Make it the loudest channel whenever the flute leads': 'A loud spot pulls the flute unnaturally forward.',
      'Leave the main pair out while the flute plays its solo': 'The main pair is the picture of the ensemble; the spot only supports it.',
    },
  },
  gainCheck('fl.prac.gain', W),
  {
    id: 'fl.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second flute mic?',
    options: ['More channels give the mix more choices later on', 'The flute needs more level than one mic can give it', 'The first works alone, the pair adds, it holds in mono'],
    correct: 'The first works alone, the pair adds, it holds in mono',
    explain: 'A second mic adds a perspective — and a delay. If the pair loses body, move or rebalance it, check polarity, or leave it out.',
    why: {
      'More channels give the mix more choices later on': 'More channels add spill, a cable and a combining check. A second mic should earn its place.',
      'The flute needs more level than one mic can give it': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'fl.mix.1',
    page: 'practice',
    prompt: 'A silver-coloured flute: what does its colour tell you about the mic choice?',
    options: ['That it is solid silver, so it will sound brighter', 'That it needs a darker mic to tame the bright metal', 'Nothing reliable — listen to the player and the flute'],
    correct: 'Nothing reliable — listen to the player and the flute',
    explain: 'A silver colour can be plating, nickel-silver or solid silver, and the material is not a sound recipe. The player, the head joint and the room decide what the mic hears.',
    why: {
      'That it is solid silver, so it will sound brighter': 'The look does not tell you the metal — and the metal is not a sound recipe.',
      'That it needs a darker mic to tame the bright metal': 'Choose by what you hear, at matched level — not by the finish.',
    },
  },
  nullOnPaper('fl.mix.2', 'wedge'),
  removeDelay('fl.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'fl.sym.gusts',
    observation: 'Large gusts or popping',
    firstChecks: 'Is the capsule in the player’s air jet? Re-aim or move it out of the jet; then, if needed, a suitable windscreen.',
    options: ['Cut the low frequencies until the gusts are gone', 'Move it out of the jet, then a windscreen', 'Ask the player to blow more gently'],
    correct: 'Move it out of the jet, then a windscreen',
    explain: 'The jet blows out past the lips; a capsule in it hears wind. Aim and distance are the first controls; a windscreen helps after that — and listen that the breathy character you want is still there.',
    why: {
      'Cut the low frequencies until the gusts are gone': 'A filter thins the flute and leaves the turbulence. Move the capsule first.',
      'Ask the player to blow more gently': 'The breath is the player’s art. The mic’s place is yours to change.',
    },
  },
  {
    id: 'fl.sym.noair',
    observation: 'The breath sounds unnaturally absent',
    firstChecks: 'Was the air the player wants removed by placement or processing? Compare untreated positions through the full phrase.',
    options: ['Compare untreated positions over the phrase', 'Add a heavy de-esser to clean the flute more', 'Close the mic on the lips to bring the air back'],
    correct: 'Compare untreated positions over the phrase',
    explain: 'Some breath is part of a flute’s expression. If it has vanished, compare positions without processing — a closer or angled view can bring the intended air back without the jet’s gusts.',
    why: {
      'Add a heavy de-esser to clean the flute more': 'More processing removes more air. Compare untreated positions first.',
      'Close the mic on the lips to bring the air back': 'At the lips the capsule is in the jet: gusts, not breath.',
    },
  },
  colourSymptom('fl.sym.colour', W),
  keyNoiseSymptom('fl.sym.keys', W),
  clipThreatSymptom('fl.sym.clip', W),
  feedbackSymptom('fl.sym.feedback', W),
];

const orderTasks: OrderTask[] = [
  {
    id: 'fl.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic flute setup in the order you would do them.',
    steps: [
      { text: 'Identify the design and ask for the part: low and high, soft and strong, how the player moves', early: 'Start with the flute and the music.' },
      { text: 'Watch the air jet, the hands, the head’s turn and the flute’s swing', early: 'Map where the air and the movement go before choosing a place.' },
      { text: 'Choose the mic and a stand (or a headset or approved clip)', early: 'Choose once you know the design and the movement.' },
      { text: 'With the player stopped, place it between the lip plate and the left hand, off the jet', early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom power on', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set input gain on the quietest AND strongest passages, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare close, behind-the-head and a farther view at matched levels', early: 'Compare only once the level is set safely.' },
      { text: 'Secure the stand and cable; recheck the head’s turn and the lowest note through any filter', early: 'Secure it last, then watch the whole motion again.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before switching it, and follow your own equipment’s manual. Gain: headroom for the strongest accent.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'fl.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Studio, a solo flute overdub, a good quiet room. One channel, phantom power available.',
    setups: [
      { id: 'a', label: 'Small condenser 5–10 cm from the flute, between the lip plate and the left hand, off the jet', ok: true, power: 'phantom', feedback: 'A recommended starting point for detail — listen for breath and keys.' },
      { id: 'b', label: 'Small condenser behind and a little above the head, aimed at the finger holes', ok: true, power: 'phantom', feedback: 'A recommended starting point with less breath — check the head’s movement.' },
      { id: 'c', label: 'A mic straight in front of the lips, in the air jet', ok: false, power: 'phantom', feedback: 'In the jet the capsule hears wind and pops.' },
      { id: 'd', label: 'A mic aimed at the end of the foot joint only', ok: false, power: 'phantom', feedback: 'The foot leads only for the lowest notes; most of the sound leaves from the embouchure and the holes.' },
      { id: 'e', label: 'A darker mic because the flute is silver-coloured', ok: false, power: 'phantom', feedback: 'The colour is not a recipe — choose by what you hear.' },
    ],
    reasons: [docReason('the flute between the lip plate and the left hand, or the head'), clearReason('the air jet, the head’s turn, the hands and the flute'), POWER_REASON, { id: 'r.jet', label: 'The capsule stays out of the air jet', role: 'optional', feedback: 'A fair reason: in the jet the mic hears wind.' }, BRAND_REASON('flute'), LOUD_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a sensible starting point from its named part, out of the jet, clear of what moves, and the power the mic needs.',
  },
  {
    id: 'fl.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage: a flutist (metal concert flute) who walks and turns in a band with drums. Phantom power available.',
    setups: [
      { id: 'a', label: 'A headset the player agrees to wear, the capsule beside the lips, out of the jet', ok: true, power: 'phantom', feedback: 'A recommended starting point that follows the head — check the air and the register.' },
      { id: 'b', label: 'A miniature on an approved strap round the foot, aimed back at the keys', ok: true, power: 'phantom', feedback: 'A recommended starting point that follows the flute — check the fit and the cable.' },
      { id: 'c', label: 'A stand mic a metre in front, for a natural blend', ok: false, power: 'phantom', feedback: 'On a loud stage, and with a walking player, a metre away hears the band more than the flute.' },
      { id: 'd', label: 'A clip squeezed over the keys of the body', ok: false, power: 'phantom', feedback: 'Nothing over the keys, rods or pads: it stops the notes and risks the flute.' },
      { id: 'e', label: 'An omni close in front of the lips, turned up', ok: false, power: 'phantom', feedback: 'In the jet it hears wind; an omni rejects nothing, so turned up it brings the stage and feedback.' },
    ],
    reasons: [docReason('the embouchure or the foot’s keys'), clearReason('the air jet, the keys and the cable path'), POWER_REASON, { id: 'r.move', label: 'A mic that moves with the player keeps one distance', role: 'optional', feedback: 'A fair live reason for a headset or a clip.' }, BRAND_REASON('flute'), { id: 'r.loudest', label: 'Turn it up until the flute is louder than the drums', role: 'wrong', feedback: 'More gain raises the stage in that mic too, and brings feedback closer.' }],
    explain: 'Two setups pass. What passes is the reasoning: a mount that moves with the player, out of the jet, clear of the keys, the power it needs — and the whole register tested.',
  },
];

const predictions: WindLesson['predictions'] = {
  sound: { prompt: 'Before you step through: where does a flute’s sound leave?', options: ['Only the foot', 'The embouchure and the open holes', 'Only the lip plate'], after: 'Now STEP through (or PLAY ONCE), then try the notes on the next step.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the mic from close to behind the player’s head. What changes?', options: ['Less breath', 'More breath', 'It depends on the player'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge is on the floor in front. Where will a supercardioid aimed back at the flute reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'A wooden flute with six open finger holes and no keywork is…',
    options: ['A wooden concert flute with its keys taken off', 'A piccolo, the flute’s smaller relative', 'A simple-system flute — a different design'],
    correct: 'A simple-system flute — a different design',
    explain: 'A simple-system flute has open finger holes and few or no keys — not a keyed concert flute in wood. Identify the design first: its holes and hands are where the mic and any clip must work round.',
    why: {
      'A wooden concert flute with its keys taken off': 'A wooden concert flute keeps the full modern keywork; this is a different design.',
      'A piccolo, the flute’s smaller relative': 'A piccolo is about half a flute’s length, usually keyed.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What makes a flute’s sound start?',
    options: ['A cane reed vibrating against the lip plate', 'The player’s lips buzzing into a cup mouthpiece', 'An air jet across the embouchure hole’s edge'],
    correct: 'An air jet across the embouchure hole’s edge',
    explain: 'The flutist blows a jet across the embouchure hole; it strikes the far edge and flips in and out, driving the air column. No reed is involved.',
    why: {
      'A cane reed vibrating against the lip plate': 'The flute has no reed: the jet and the edge do the work.',
      'The player’s lips buzzing into a cup mouthpiece': 'That is a brass instrument’s way.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'Where does a flute’s sound leave?',
    options: ['From the open foot only', 'The embouchure hole and the open holes', 'From the lip plate only, where the player blows'],
    correct: 'The embouchure hole and the open holes',
    explain: 'The embouchure hole radiates for every note; the first open holes let the rest out, and the open foot joins in for the lowest notes.',
    why: {
      'From the open foot only': 'The foot leads only when every hole is closed.',
      'From the lip plate only, where the player blows': 'The open holes along the body radiate too.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Why keep a close flute mic out of the air jet?',
    options: ['Its turbulence sounds as wind and pops', 'The jet cools the capsule and detunes it', 'The jet blocks the sound from the holes'],
    correct: 'Its turbulence sounds as wind and pops',
    explain: 'The jet blows out past the lips; a capsule in it hears rumble and pops. Angle and distance are the first controls.',
    why: {
      'The jet cools the capsule and detunes it': 'A mic is not tuned; the problem is the moving air it hears.',
      'The jet blocks the sound from the holes': 'Air does not block sound; it adds noise at the capsule.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'What must a stand mic and its boom stay clear of around a flutist?',
    options: ['The head, the jet, the hands, the flute’s reach', 'The music stand, so the music can be read', 'The audience’s view of the whole flute'],
    correct: 'The head, the jet, the hands, the flute’s reach',
    explain: 'Clearance comes first: the flute reaches out to the right and moves with the head; a boom where a turning head or the flute can strike it is in the wrong place.',
    why: {
      'The music stand, so the music can be read': 'Sight lines matter, but safety is about what moves.',
      'The audience’s view of the whole flute': 'The view matters less than the player’s movement.',
    },
  },
  hearingDiag('q.6', W),
];

const floorY = LAYOUTS.metal.body.floorY;
const wedges: Wedge[] = [
  { id: 'wedge', label: 'the player’s floor wedge, in front, facing back at them', short: 'WEDGE', p: { x: -250, y: floorY, z: 1450 }, lift: 150, faces: { x: 0.15, y: 0, z: -1 }, note: 'On the floor in front, facing back at the player: below and behind a mic aimed back at the flute — tilting the mic matters as much as turning it.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
  { id: 'side', label: 'another player’s wedge, off to the flutist’s right', short: 'SIDE WEDGE', p: { x: -1500, y: floorY, z: 800 }, lift: 150, faces: { x: 0.8, y: 0, z: -0.6 }, note: 'Off to one side, facing another player: well off the mic’s axis.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
];

const copy: Partial<LessonCopy> = {
  variantKey: 'DESIGN',
  variantShort: { metal: 'metal concert flute', wooden: 'wooden concert flute', simple: 'simple-system wooden flute' },
  sceneSubject: { metal: 'a metal concert flute held by a standing player', wooden: 'a wooden concert flute held by a standing player', simple: 'a simple-system wooden flute held by a standing player' },
  viewTag: { side: 'FRONT · FROM THE AUDIENCE', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'to player’s left', minus: 'to player’s right', label: 'ACROSS', blurb: 'Toward the player’s left or right (x) — the flute reaches out to the right.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The flute sits at the lips, about head height.' },
    z: { plus: 'toward the audience', minus: 'toward the player', label: 'FRONT–BACK', blurb: 'Toward the audience or toward the player (z).' },
  },
  instrument: {
    figureBadge: 'A flute from above, keys toward you · every part named',
    figureLabel: 'A flute seen from above.',
    partsBadge: 'A flutist from the audience · tap a part to name it',
    partsLooking: { side: 'Front view · from the audience', top: 'Top view · from above' },
    partsIdle: 'The air jet starts the sound at the embouchure hole; the air column rings; the embouchure and the open holes let it out — the next page shows how. Switch DESIGN to compare a metal flute, a wooden keyed flute and a simple-system flute.',
    variantNotes: {
      wooden: 'WOODEN, KEYED: the same keywork and tone holes in dark wood. Begin with the same positions — and ask the player and maker before attaching anything to the wood.',
      simple: 'SIMPLE-SYSTEM: open finger holes and a conical wooden body — the fingers are the keys. Nothing may cover a hole: no clip on this design here; use a stand.',
    },
  },
  placement: {
    workedZone: { metal: 'fl.close', wooden: 'fl.close', simple: 'fl.close' },
    workedLine: 'This starting point also reads how far the mic is from {line}.',
    workedAim: 'Aim it halfway between the lip plate and the left hand — the lab counts it while the mic points within about {tol}° of that spot — and keep the capsule angled out of the air jet.',
    workedClear: 'Clear of every part — the air jet, the head’s turn, both hands and the flute’s reach to the right. Clearance comes first, before any number, and the player stops before a real mic moves.',
    blocked: {},
    reveal: 'Behind the head tends to bring less breath — the jet blows the other way; close in front, more detail and more air. Players vary, so “it depends on the player” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear.',
    typeNotes: {
      sdcCard: 'Ideas to try: begin close, between the lip plate and the left hand, angled off the jet; then behind and above the head, or a metre in front in a good room — one change at a time, low and high passages each time.',
      wwMini: 'Ideas to try with a miniature: on a keyed flute only, keep its strap round the foot end; change only the capsule’s angle along the keys.',
      wwHeadset: 'Ideas to try with a headset: keep the capsule beside the lips, out of the jet; change only its angle toward the embouchure.',
    },
    note: 'Clearance comes first: stop the player before moving a real mic. A mic, boom or cable anywhere the flute, the hands or a turning head can reach — or in the air jet — is in the wrong place, whatever the number says.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we recommend you begin with that kind of mic, measured from the part it names — the flute between the lip plate and the left hand, the player’s head, the middle of the flute, the foot’s keys, the embouchure hole. They are starting points, not rules — move from there and listen.',
      separate: 'Distance, height and angle are separate variables: change one at a time, and play low, high, soft, strong, tongued and legato phrases each time — one held note is not a test. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.',
      clearance: 'Clearance comes first. Stop the player before moving a mic; keep the mic, stand and cable clear of the flute’s reach, the hands, the head’s turn and the air jet. The engine stops the mic and names what it would touch.',
      tendencies: 'Close tends to bring detail, air and keys; behind the head, less breath; a metre in front, more room and fewer clicks; a headset favours the embouchure, a foot clip the holes and keys. These are tendencies, and flutes and players vary.',
    },
  },
  context: {
    variant: 'metal',
    zone: 'fl.close',
    typeId: 'sdcCard',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'sdcCard' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'sdcCard' },
      { id: 'hypercardioid', label: 'hypercardioid', typeId: 'sdcCard' },
    ],
    micNoun: 'A small condenser',
    shield: ['ww.body', 'ww.body.1', 'ww.body.2', 'ww.body.3', 'ww.body.4', 'ww.headjoint'],
    azMax: 60,
    elMax: 70,
    aimBlurb: 'Swing the front up to 60° either way — it still faces the flute.',
    plan: { u0: -1900, u1: 900, v0: -600, v1: 1750 },
    side: { u0: -1900, u1: 900, v0: -500, v1: 1700 },
    target: 'wedge',
    frontIds: [],
    targetWord: 'wedge',
    looking: 'Top view · mic close above the flute',
    prompt: 'The player’s wedge stays where they need it. Turn the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — while the mic still points at the flute.',
    activityDone: 'done — the wedge sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies. Use the null to aim, not to promise silence.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). Close above the flute and aimed down at it, its rear points up and away — the wedge down on the floor in front is off that line, so turning and tilting the mic both matter.',
    shieldNote: 'The player and the flute can reflect stage sound into a mic aimed at them — the free-field pattern cannot show that. Listen with the monitors on.',
    studioId: 'fl.ctx.studio',
    studioPrompt: 'A studio session, a solo flute, a good room: what is the mic’s job?',
    studioNote: 'In the studio, close, behind the head and a metre in front are all fair trials — repeated takes are practical when the player stops. Switch back to LIVE for the monitor exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not restrictions.',
      points: [
        { title: 'PERSPECTIVE', text: 'Studio: a solo may want the room, a softer view of the keys and the chosen amount of breath. Live: a flute among drums needs a closer, separated sound.' },
        { title: 'SPILL AND FEEDBACK', text: 'Studio: the room and the neighbours. Live: monitors, the PA and the band. Closer, the right pattern and aim help — and a windscreen helps only once the capsule is off the jet.' },
        { title: 'MOVEMENT', text: 'Flutists turn with the head and the music. A stand mic has a working zone; a headset follows the head, a foot clip the flute.' },
        { title: 'IN A SECTION', text: 'With a main pair up, a flute mic is a spot: bring it up only for a stated balance, and check it in mono.' },
      ],
      body: 'With a wedge in front of the player, a pattern’s rejection is a tool to aim — tilting as well as turning. Some stage sound in a flute mic is normal; the question is how much the music can take.',
      warn: 'No mic position alone prevents feedback: the pattern, the other open mics, the monitors, the system level and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
    },
  },
  twoMic: {
    variant: 'metal',
    A: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'fl.close' },
    B: { typeId: 'sdcCard', pattern: 'omni', zone: 'fl.front' },
    learn: [
      'A second mic — a room mic, or the main pair the flute plays into — is a choice for a reason, not a requirement for stereo: one flute is a small source, and two close mics can move the image as the player turns.',
      'When it goes in: hear each mic alone, then the pair in MONO at the intended levels. Move or rebalance a mic first; check both polarity states at matched levels only after that.',
    ],
    warn: 'This simplified graph treats the flute as one point and both mics as hearing the same sound. Real mics at different distances hear different mixes of embouchure, holes and room, so read the notch POSITIONS and treat their depths as illustrative. Judge by ear, in mono, at matched levels.',
  },
  practice: {
    gain: 'fl.prac.gain',
    second: 'fl.prac.3',
    mixed: ['fl.mix.1', 'fl.mix.2', 'fl.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: what a flute’s colour tells you, a pattern’s null, and polarity versus delay.',
  },
  terms: {
    instrument: 'the flute',
    aimRef: 'its reference',
    startIntro: 'This lesson is about putting a microphone on a transverse flute — metal or wooden. First the flute itself: which design it is, how the air jet and the air column make its sound, where the sound and the air leave, and where the player stands. Then the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
    startNew: 'Good — NEXT takes you through the flute first. You can change how you started here at any time.',
    refTitle: 'MEASURED FROM',
    otherRef: 'The same number measured from another part — the lips, the foot, the player’s head — would put the mic somewhere else.',
    noAim: 'This starting point gives no aim, so the mic simply faces the flute. Distance, height and angle are still separate things to try.',
    clipMount: 'Mount: on a keyed flute, a strap made for it round the foot end; or a headset the player wears — with their agreement',
    standMount: 'Mount: a stand placed clear of the flute’s reach, the hands, a turning head and the air jet',
    inPath: 'flute in path',
    facing: 'facing the flute',
    observation: 'For a real flute, with the player’s agreement, and the player stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
  },
};

export const A06_LESSON: WindLesson = {
  id: 'A06',
  labId: 'winds',
  title: 'Flute',
  subtitle: 'Metal or wooden — identify the design, then close, behind the head, in front, or a headset',
  noun: { one: 'flute', many: 'flutes' },
  model: FLUTE_MODEL,
  micTypeIds: ['sdcCard', 'wwMini', 'wwHeadset'],
  zones: FLUTE_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A transverse flute: a tube open at both ends, held out to the player’s right. The player blows an air jet across the embouchure hole; there is no reed. Identify the design first: a keyed concert flute — metal, or the same design in wood — or a simple-system wooden flute with open finger holes.', src: 'Y-FL-MECH2' },
    { title: 'WHERE YOU MEET IT', text: 'Orchestras and wind bands, chamber music, jazz, folk and traditional music (often the simple-system flute), studio sessions and stages. This lesson covers one flute: a studio solo, a moving player on a loud stage, and a spot in a group.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'It sings melodies and fast runs with a breathy, airy character the player shapes. Ask what the music needs: an intimate, airy close sound, a natural room sound, or a separated line over a band.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'A concert flute is about 66 cm long and about 19 mm across; its lowest note is about 262 Hz (C4). The simple-system flute drawn here is about 60 cm. This lab draws a standing player, the flute at the lips.', src: 'PL-2010' },
  ],
  sound: {
    stages: [
      { title: 'The air jet', text: 'The player blows a thin jet of air from the lips across the embouchure hole, aimed at its far edge.' },
      { title: 'The jet flips at the edge', text: 'The jet strikes the edge and flips in and out of the hole, again and again — pushed in time by the air column inside.' },
      { title: 'The air column rings', text: 'The air inside rings as a standing wave between the embouchure hole and the first open hole — both open, so the pressure stays still at both ends.' },
      { title: 'Sound and air leave', text: 'Sound leaves from the embouchure hole for every note and from the first open hole; the open foot joins in for the lowest notes. The jet’s air blows out past the lips — breath and wind for a mic in its way.' },
    ],
    attack: 'The start of a note: the tongue releasing the jet and a brief rush of air — strongest at the lips and the embouchure. A mic close to the lips hears more of it, and of the breath.',
    body: 'The sustained tone: the air column ringing, leaving from the embouchure and the open holes in a pattern that changes with every note. A little distance tends to blend those outlets with the room. Both are tendencies, and flutes vary.',
    head: { diameterMm: 0, rods: 0, label: 'the air column', strikeSrc: 'UNSW-FLUTE' },
  },
  setting: {
    items: [
      { id: 'self', label: 'the flute and its player', short: 'FLUTE', note: 'Held out to the player’s right, the embouchure under the lower lip, the head turned a little. Ringed in amber: the instrument this lesson mics.', prov: { kind: 'illustrative', reason: 'flute/GEOMETRY_PROPOSAL.md frame F (drawing default)' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'jet', label: 'the air jet', short: 'AIR JET', note: 'The breath blows out across the embouchure hole and on past the lips. A capsule in it hears wind and pops.', prov: { kind: 'illustrative', reason: 'env.fl.jet: 150 mm, 15° (drawing default)' }, tag: 'KEEP THE MIC OUT', scene: 'kit', planIds: ['self'] },
      { id: 'reach', label: 'the flute’s reach, the hands and the head', short: 'REACH · HANDS', note: 'The flute reaches out to the right and moves with the head; the hands work the keys. No stand, boom or cable where they can strike it.', prov: { kind: 'illustrative', reason: 'the proposal’s envelopes' }, tag: 'KEEP CLEAR', scene: 'kit', planIds: ['self'] },
      { id: 'stand', label: 'the music stand', short: 'MUSIC STAND', note: 'In front, shared with the second flute. The player must see the music and the conductor.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SIGHT LINE', scene: 'kit', planIds: ['stand.fl'] },
      { id: 'fl2', label: 'the second flute and the piccolo', short: 'FLUTE 2 · PICCOLO', note: 'Beside the flute in the front row; their feet point the same way. A flute mic hears them too.', prov: { kind: 'illustrative', reason: 'a typical seating' }, tag: 'SPILL · SECTION', scene: 'kit', planIds: ['fl2', 'picc'] },
      { id: 'behind', label: 'the clarinets behind', short: 'CLARINETS', note: 'Right behind the flutes — close to a mic behind the flutist’s head.', prov: { kind: 'illustrative', reason: 'a typical seating' }, tag: 'SPILL', scene: 'kit', planIds: ['cl1', 'cl2', 'bcl'] },
      { id: 'wedge', label: 'the player’s wedge (monitor)', short: 'WEDGE', note: 'On a stage, a floor monitor in front, facing back at the player — loud, and close to a flute mic.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'side', label: 'another player’s wedge', short: 'SIDE WEDGE', note: 'Off to one side, facing another player.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Live, the audience already hears the acoustic flute; the PA adds what the room needs.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage', planIds: ['audience', 'pa'] },
      { id: 'main', label: 'a main pair for the ensemble', short: 'MAIN PAIR', note: 'In a recording of a group, a main pair hears the whole ensemble; a flute mic is a spot that supports it.', prov: { kind: 'illustrative', reason: 'a generic main pair' }, tag: 'MAIN PAIR', scene: 'studio' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'No wedges on the floor; a good room can carry a flute a metre away.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors on the floor feed the players, the PA faces the audience, and a band can be loud. A closer mic off the jet, its rejection aimed — or a headset or foot clip for a moving player — helps against the stage and feedback.',
    studio: 'STUDIO: no wedges, a room that may sound good, and repeated trials when the player stops. Close, behind the head and a metre in front are all fair comparisons; in an ensemble, a main pair may carry the flute already.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic flute setup for a studio solo and for a moving player on a loud stage, describe an alternative position, and explain what would justify a second mic. With a real flute and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'room', label: 'Room or stage', kind: 'text' },
      { id: 'design', label: 'Flute', kind: 'choice', choices: ['metal concert flute', 'wooden concert flute', 'simple-system wooden flute'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser, cardioid', 'small condenser, omni', 'headset', 'miniature on a foot clip', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, from the flute (or which part)', kind: 'text' },
      { id: 'notes', label: 'What you heard: breath, keys, low and high notes, room', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The player’s height above the floor and the flute’s hold (10° forward, 8° down at the foot) — drawing defaults — so no HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The simple-system flute’s 600 mm length, its bore and its holes are drawing defaults (one maker’s design); the concert flute’s joint split, key layout and hand positions are drawing defaults; the tone holes sit where the semitone rule puts them (a simplified picture).', dims: [] },
    { text: 'The air jet (150 mm, 15°), the hands, arms and head — illustrative; a 20 mm margin round the flute for its movement.', dims: [] },
    { text: '“A few inches” behind the head drawn 8–22 cm; the clip’s 3–11 cm, the headset’s 4–9 cm and the miniatures’ sizes and reaches — drawing defaults to check on the real instrument.', dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every flute, player and room is different, and the material alone is not a sound recipe: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: one player in a typical hold, tone holes where the semitone rule puts them, the air column as an ideal pipe, the air jet as a cone, mic patterns and the two-mic comb as textbook shapes. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped, and only with their agreement.',
  copy,
  wind: windExtra(SPEC, {
    soundSubject: 'A flute stood on end, keys toward you, its air column drawn open',
    breath: 'The air jet blows out across the embouchure hole and on past the lips: a capsule in its path hears wind and pops. Some breath is part of a flute’s voice — choose how much with angle and distance.',
    keys: 'Key clicks and pads: loud within a few centimetres of the body; a mic a metre away, or behind the head, hears them less.',
    directivity: 'Measured round a player in a quiet room: the strongest sound goes to the front and downward, and to the player’s right — and different notes radiate in noticeably different directions.',
    noteDefault: 9,
  }),
};
