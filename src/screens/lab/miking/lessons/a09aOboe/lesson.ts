/**
 * A09a OBOE — the lesson's pages as DATA (blueprint §7). The words come from
 * the owner's lesson (docs/labs/miking/source_text/Oboe-Miking-Technique.txt,
 * "L<n>" in COMMENTS only) with the fixes in CORRECTIONS_LOG.md (A9A-01 …):
 * DPA's table lists C4 as the lowest note but the modern oboe reaches B♭3 —
 * filters are set from the player's part (D-OB1); MDAT's 2–4 ft added; the
 * oboe's small tone holes (about 2 mm the smallest) said in the parts.
 *
 * OWNER RULING 2026-10-04: suggested starting points, never dogma; no
 * source, brand or model in learner text; no badges.
 */
import type { DiagnosticItem, MikingScenario, OrderTask, LessonPages, PageContent, SourcePageId, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import type { LessonCopy } from '../../engine/model/copy.ts';
import { BRAND_REASON, LOUD_REASON, POWER_REASON, bellBoomSymptom, bellOnlyCheck, clearReason, clipThreatSymptom, colourSymptom, docReason, feedbackSymptom, filterSymptom, firstHoleCheck, gainCheck, hearingCheck, hearingDiag, keyNoiseSymptom, matchedLevels, nullOnPaper, polarityDelay, removeDelay, superNull, type WindWords } from '../shared/woodwinds/windItems.ts';
import { windExtra, type WindLesson } from '../shared/woodwinds/windLesson.ts';
import { OBOE_MODEL, SEATED, SPEC } from './geometry.ts';
import { OBOE_ZONES } from './model.ts';

const W: WindWords = { noun: 'oboe', player: 'oboist', end: 'the bell', exciter: 'the reed', moving: 'the hands, the keys and the oboe’s pivot' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the oboe',
    goal: 'Get to know the oboe — what it is, where you meet it, what it does in the music, and its parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A double reed drives the air in a narrow conical tube. Small tone holes along the body and the bell at the end let the sound out; the player holds it out in front and a little higher than a clarinet.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a breath becomes an oboe note — the double reed, the air column, the first open hole — and where the sound leaves.',
    credit: { scenarios: ['ob.snd.1', 'ob.snd.2', 'ob.snd.3'], interactive: 'soundPath', note: 'Step the sequence through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The two blades let air in in puffs; the cone of air rings; most of each note leaves from the first open hole, the lowest from the bell; up an octave with the octave key. A mic sees one part of a moving picture.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the oboe sits — the reed at the lips, the hands and keys, the pivot, the section around it — what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['ob.set.1', 'ob.set.2', 'ob.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The reed, the face, the hands and the oboe’s pivot stay clear. Ask the player first, hear the whole range, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the oboe by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['ob.mic.1', 'ob.mic.2', 'ob.mic.3', 'ob.rec.1'], note: 'Answer the four checks (one reaches back to how the oboe sounds).' },
    takeaway: 'A small condenser on a stand hears the oboe whole; a miniature on a clip moves with it. Both need phantom power. An omni blends where the room allows; a cardioid separates.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — facing the holes a third of the way up from the bell — then move the mic and see what changes.',
    credit: { scenarios: ['ob.place.1', 'ob.place.2', 'ob.place.3', 'ob.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different suggested starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'Each starting point serves a goal: close for a natural spot, a foot away for balance, near the bell for a bright live sound, farther for the room. Distance, height and angle are separate things to try; clearance comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the player’s wedge — and know what a pattern cannot do, and why a studio solo and a loud stage need different choices.',
    credit: { scenarios: ['ob.ctx.1', 'ob.ctx.2', 'ob.ctx.studio', 'ob.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A cardioid rejects most behind; a supercardioid toward the rear near 125°, with a small lobe straight behind. Real nulls are shallower than the picture, and no mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a close spot and the main pair on one oboe can sound hollow together, and what the polarity switch does and does not change.',
    credit: { scenarios: ['ob.two.1', 'ob.two.2', 'ob.two.3', 'ob.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two mics at different distances hear the oboe at different times: some pitches cancel in the sum. Move or rebalance first; polarity flips the sign and never removes a delay. Judge in mono, at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — where the mic looks, its distance, the pattern, the player’s movement, the mount, the filter — before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one oboe mic in the right order, choose and justify a setup for a studio solo and a loud stage, and say what would justify a second mic.',
    credit: { scenarios: ['ob.prac.order', 'ob.prac.gain', 'ob.prac.setup1', 'ob.prac.setup2', 'ob.prac.3', 'ob.mix.1', 'ob.mix.2', 'ob.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real oboe.' },
    takeaway: 'Clearance from the reed, the hands and the keys, the right power and level, a view of the holes and the bell, and an accurate account of polarity versus delay pass. A brand or a bell-only habit do not — and more than one setup can pass.',
  },
};

/* THE CHECKS. Lesson lines in comments only: ob.snd.* L6 · ob.set.* L7 ·
 * ob.mic.* L30, L38 · ob.place.* L13, L25 · ob.ctx.* L37 · ob.two.* L34, L35 ·
 * ob.prac.* / ob.mix.* L70-L74. */
const scenarios: MikingScenario[] = [
  firstHoleCheck('ob.snd.1', W),
  {
    id: 'ob.snd.2',
    page: 'sound',
    prompt: 'The oboe’s bore is a narrow cone. What does that do to its upper register?',
    options: ['It overblows a twelfth, like the clarinet’s straight tube', 'It overblows an octave, like a pipe open at both ends', 'It cannot overblow, so each note needs its own hole'],
    correct: 'It overblows an octave, like a pipe open at both ends',
    explain: 'A cone from the reed resonates at every whole-number multiple of its lowest note, as a pipe open at both ends does: the next resonance is ×2, an octave — so the octave keys lift the same fingerings an octave.',
    why: {
      'It overblows a twelfth, like the clarinet’s straight tube': 'The twelfth belongs to a cylinder closed at the reed. A cone keeps every multiple, so the octave comes first.',
      'It cannot overblow, so each note needs its own hole': 'The oboe overblows readily: the octave keys help it into the next resonance.',
    },
  },
  bellOnlyCheck('ob.snd.3', W),
  hearingCheck('ob.set.1', W),
  {
    id: 'ob.set.2',
    page: 'setting',
    prompt: 'Which parts must a stand mic and its boom stay clear of around an oboist?',
    options: ['The music stand, so the music stays readable', 'The audience’s view of the oboe’s bell and keys', 'The reed and face, the hands, the oboe’s pivot'],
    correct: 'The reed and face, the hands, the oboe’s pivot',
    explain: 'Clearance comes first: the reed at the lips and the face, the fingers on the keys, and the bell as the oboe pivots with the player’s breathing and reading.',
    why: {
      'The music stand, so the music stays readable': 'Sight lines matter, but the safety question is what moves near the mic.',
      'The audience’s view of the oboe’s bell and keys': 'The view matters less than the reed, the hands and the pivot.',
    },
  },
  {
    id: 'ob.set.3',
    page: 'setting',
    prompt: 'Before placing any mic on an oboe, what do you ask for?',
    options: ['One long tuning A, as loud as the player can play it', 'Nothing yet: the starting point already says where to go', 'The real part: lowest and highest notes, soft and strong'],
    correct: 'The real part: lowest and highest notes, soft and strong',
    explain: 'Where the sound leaves moves with every note, so test the actual part — the lowest note the part uses, the top, soft entries, tongued notes, fast fingering — and watch how the player moves.',
    why: {
      'One long tuning A, as loud as the player can play it': 'One note leaves from one place; the music moves the sound along the oboe.',
      'Nothing yet: the starting point already says where to go': 'A starting point says where to begin; the player’s part says whether it works.',
    },
  },
  {
    id: 'ob.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · On an oboe, where does most of a middle note’s sound leave?',
    options: ['The bell, where the notes come out', 'The reed, back toward the player’s mouth', 'The first open tone holes on the body'],
    correct: 'The first open tone holes on the body',
    explain: 'The air column behaves as if the tube ended just past the first open hole; only the lowest notes — every hole closed — leave mainly from the bell.',
    why: {
      'The bell, where the notes come out': 'Only the lowest notes come mainly from the bell.',
      'The reed, back toward the player’s mouth': 'The reed is closed by the lips; it starts the sound but does not let it out.',
    },
  },
  {
    id: 'ob.mic.1',
    page: 'microphone',
    prompt: 'In a quiet, good room, is an omni a fair first try on a solo oboe?',
    options: ['No — an omni hears only the bell, not the open holes', 'No — an omni works only more than a metre away', 'Yes — a broad, even pickup that lets the oboe blend'],
    correct: 'Yes — a broad, even pickup that lets the oboe blend',
    explain: 'An omni hears all round with no directional proximity effect — welcome when the room adds to the sound. As separation matters more, a wide cardioid or a cardioid; a very narrow pickup can make a woodwind less natural.',
    why: {
      'No — an omni hears only the bell, not the open holes': 'An omni hears the holes, the bell and the room together.',
      'No — an omni works only more than a metre away': 'An omni works at any distance; up close it also has no directional proximity bass.',
    },
  },
  {
    id: 'ob.mic.2',
    page: 'microphone',
    prompt: 'A miniature on a clip near the bell — where should its capsule point?',
    options: ['Straight down into the bell’s opening', 'Back up the oboe toward the keys', 'At the reed, to hear the double reed close up'],
    correct: 'Back up the oboe toward the keys',
    explain: 'Aimed back toward the keys, the capsule hears the open holes and some bell; into the bell it hears mostly the lowest notes. With a longer gooseneck, looking toward the upper joint tends to even out the range.',
    why: {
      'Straight down into the bell’s opening': 'Into the bell, the mic favours the lowest notes and misses the open holes.',
      'At the reed, to hear the double reed close up': 'Never near the reed: it is at the player’s lips, and the sound leaves lower down.',
    },
  },
  {
    id: 'ob.mic.3',
    page: 'microphone',
    prompt: 'Your only spare input has no phantom power. Can you use the clip miniature there?',
    options: ['Yes — a clip mic takes its power from the strap', 'Yes, if its cable is short enough to keep the signal up', 'No — like the stand condenser, it needs phantom power'],
    correct: 'No — like the stand condenser, it needs phantom power',
    explain: 'Both of this page’s mics are condensers: the stand mic needs phantom power, and the miniature needs it through its adapter. Find a powered input, or a different kind of mic.',
    why: {
      'Yes — a clip mic takes its power from the strap': 'A clip is a mount. The miniature still needs phantom power through its adapter.',
      'Yes, if its cable is short enough to keep the signal up': 'Cable length does not power a condenser.',
    },
  },
  {
    id: 'ob.place.1',
    page: 'placement',
    prompt: 'One starting point is “about a foot from the sound holes”, another “a few inches from the bell”. Why both?',
    options: ['They serve different goals: balance, or bright isolation', 'Two engineers disagree, so one of them must be wrong', 'The bell is for studio work, and the holes for live work'],
    correct: 'They serve different goals: balance, or bright isolation',
    explain: 'A foot from the holes tends to give a balanced oboe; a few inches from the bell, a brighter, more isolated sound that helps live. Different goals, not a contradiction — try both on the actual part.',
    why: {
      'Two engineers disagree, so one of them must be wrong': 'Each serves its own goal; neither is a universal rule.',
      'The bell is for studio work, and the holes for live work': 'It is closer to the other way round: near the bell tends to suit a live stage’s isolation.',
    },
  },
  {
    id: 'ob.place.2',
    page: 'placement',
    prompt: 'You move from 15–20 cm to about a metre in front. What tends to change?',
    options: ['Only the level drops; the tone stays exactly the same', 'The reed gets louder, because the mic is now above it', 'More of the room and the blend; less key detail'],
    correct: 'More of the room and the blend; less key detail',
    explain: 'Farther away, the reed, holes and bell blend, the key clicks fall back and more room arrives. Closer, a directional mic adds low end (proximity effect).',
    why: {
      'Only the level drops; the tone stays exactly the same': 'Distance changes the balance too: more room, more blend, fewer clicks.',
      'The reed gets louder, because the mic is now above it': 'Farther away hears less of any one part, the reed included.',
    },
  },
  {
    id: 'ob.place.3',
    page: 'placement',
    prompt: 'Is a mic a few centimetres from the oboe’s reed a good first choice?',
    options: ['Not usually: it is in the way and hears mostly reed', 'Yes — that is where all of the oboe’s sound is made', 'Yes, as long as it is a small condenser on a stand'],
    correct: 'Not usually: it is in the way and hears mostly reed',
    explain: 'The reed starts the sound, but it leaves from the holes and the bell. A mic at the mouth sits in the player’s way and hears the reed’s edge and breath; the starting points look at the body.',
    why: {
      'Yes — that is where all of the oboe’s sound is made': 'Made there, yes — but it leaves from the holes and the bell, lower down.',
      'Yes, as long as it is a small condenser on a stand': 'The type does not change where the sound leaves, or the player’s space.',
    },
  },
  {
    id: 'ob.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What must an oboe mic, its boom and its cable stay clear of?',
    options: ['The music stand and the conductor’s line', 'The front of the oboe, so it can project', 'The reed and face, the hands and the pivot'],
    correct: 'The reed and face, the hands and the pivot',
    explain: 'Clearance comes first: the reed at the lips, the face, the fingers on the keys and the bell as the oboe pivots. Stop the player before anything is moved near them.',
    why: {
      'The music stand and the conductor’s line': 'Sight lines matter too, but the safety question is what moves.',
      'The front of the oboe, so it can project': 'In front is where a stand mic usually goes; what must stay clear is what moves.',
    },
  },
  {
    id: 'ob.ctx.1',
    page: 'context',
    prompt: 'An oboe solo over a loud band, a wedge in front. A good first step?',
    options: ['A farther mic, so the band blends with the oboe', 'Closer and aimed — near the bell, or a clip', 'Turn the oboe channel up above the band'],
    correct: 'Closer and aimed — near the bell, or a clip',
    explain: 'On a loud stage, a closer mic with its rejection toward the wedge, a bell-near position, or a miniature that moves with the oboe gives more oboe relative to the stage. More gain raises the band too.',
    why: {
      'A farther mic, so the band blends with the oboe': 'Farther brings in more band and monitor — the opposite of what a loud stage needs.',
      'Turn the oboe channel up above the band': 'More gain raises everything that mic hears and brings feedback closer.',
    },
  },
  superNull('ob.ctx.2', 'context', 'wedge'),
  {
    id: 'ob.ctx.studio',
    page: 'context',
    prompt: 'A solo oboe in a good, quiet studio: is one stand mic facing the holes a fair first choice?',
    options: ['No — a mic at the reed captures the oboe best', 'No — it needs a second mic at the bell as well', 'Yes — then small changes of distance and angle'],
    correct: 'Yes — then small changes of distance and angle',
    explain: 'One stand mic facing the holes — close, or a foot away, or farther in a good room — gives a coherent oboe. Adjust distance, height and angle by ear.',
    why: {
      'No — a mic at the reed captures the oboe best': 'At the reed it hears breath and edge, and sits in the player’s way.',
      'No — it needs a second mic at the bell as well': 'A second close mic adds a delay and a combining check. One good position usually works better.',
    },
  },
  {
    id: 'ob.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Why can a bell-near mic tilt an oboe’s balance?',
    options: ['The bell blocks the oboe’s high notes', 'The lowest notes leave mainly there', 'The bell is louder than the reed'],
    correct: 'The lowest notes leave mainly there',
    explain: 'With every hole closed the sound leaves the bell; most other notes leave from the open holes. So a bell-near mic can favour the lowest notes — compare a hole-facing view.',
    why: {
      'The bell blocks the oboe’s high notes': 'Nothing is blocked; most notes simply leave earlier, from the holes.',
      'The bell is louder than the reed': 'Loudness is not the point: the place each note leaves from is.',
    },
  },
  {
    id: 'ob.two.1',
    page: 'twoMic',
    prompt: 'An oboe spot and the main pair sound hollow together. Why?',
    options: ['The main pair inverts the oboe’s sound on its way to it, so it cancels', 'Two mics on one oboe cancel its low notes between them', 'The sound reaches them at different times, so pitches cancel'],
    correct: 'The sound reaches them at different times, so pitches cancel',
    explain: 'The farther mic hears each note a little later; summed, some pitches arrive out of step and dip — a comb. Move or rebalance first, then check polarity at matched levels.',
    why: {
      'The main pair inverts the oboe’s sound on its way to it, so it cancels': 'Distance delays a sound; it does not flip its sign.',
      'Two mics on one oboe cancel its low notes between them': 'Cancellation depends on the delay and the levels: some pitches dip, others add.',
    },
  },
  polarityDelay('ob.two.2'),
  matchedLevels('ob.two.3'),
  {
    id: 'ob.two.4',
    page: 'twoMic',
    prompt: 'In an orchestra recording with the main pair up, how do you use an oboe spot?',
    options: ['Bring it up only for a stated balance, and check it in mono', 'Make it the loudest channel whenever the oboe has the tune', 'Leave the main pair out while the oboe plays its solo'],
    correct: 'Bring it up only for a stated balance, and check it in mono',
    explain: 'The main pair carries the ensemble image; a spot supports it. Bring it in gently, watch that the oboe does not leap ahead of the woodwinds, and check the mono sum.',
    why: {
      'Make it the loudest channel whenever the oboe has the tune': 'A loud spot pulls the oboe unnaturally forward.',
      'Leave the main pair out while the oboe plays its solo': 'The main pair is the picture of the orchestra; the spot only supports it.',
    },
  },
  gainCheck('ob.prac.gain', W),
  {
    id: 'ob.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second oboe mic?',
    options: ['More channels give the mix engineer more options to choose from later', 'The first works alone, the pair adds something, it holds in mono', 'The oboe needs more level than one mic on its own can give it'],
    correct: 'The first works alone, the pair adds something, it holds in mono',
    explain: 'A second mic adds a perspective — and a delay. If the pair loses body, move or rebalance it, check polarity, or leave it out.',
    why: {
      'More channels give the mix engineer more options to choose from later': 'More channels add spill, a cable and a combining check. A second mic should earn its place.',
      'The oboe needs more level than one mic on its own can give it': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'ob.mix.1',
    page: 'practice',
    prompt: 'A reference table lists the oboe’s lowest note as C4. How do you set a high-pass filter?',
    options: ['Just below C4, since the reference table says so', 'At a fixed 200 Hz, whatever the oboe', 'By ear, on the lowest note of the real part'],
    correct: 'By ear, on the lowest note of the real part',
    explain: 'The modern oboe reaches B♭3, below the table’s C4, and parts differ. Set the filter while the lowest note the part uses is played — no fixed number suits every oboe.',
    why: {
      'Just below C4, since the reference table says so': 'A table is context, not the part: the oboe can go below C4.',
      'At a fixed 200 Hz, whatever the oboe': 'No fixed cutoff suits every part. Listen to the lowest note actually played.',
    },
  },
  nullOnPaper('ob.mix.2', 'wedge'),
  removeDelay('ob.mix.3'),
];

const symptoms: Symptom[] = [colourSymptom('ob.sym.colour', W), keyNoiseSymptom('ob.sym.keys', W), bellBoomSymptom('ob.sym.bell', W), filterSymptom('ob.sym.filter', W), clipThreatSymptom('ob.sym.clip', W), feedbackSymptom('ob.sym.feedback', W)];

const orderTasks: OrderTask[] = [
  {
    id: 'ob.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic oboe setup in the order you would do them.',
    steps: [
      { text: 'Ask the player for the part: lowest and highest notes, soft and strong, how they move', early: 'Start with the player and the music.' },
      { text: 'Hear the oboe unamplified in the room, through the whole range', early: 'Listen before choosing a mic.' },
      { text: 'Choose the mic and a stand (or an approved clip)', early: 'Choose once you know the part and the room.' },
      { text: 'With the player stopped, place it facing the holes, clear of the reed, hands and pivot', early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom power on', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set input gain on the quietest AND loudest passages, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare distance and angle one change at a time, at matched levels', early: 'Compare only once the level is set safely.' },
      { text: 'Secure the stand and cable; recheck the lowest note through any filter', early: 'Secure it last, then check the whole range again.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before switching it, and follow your own equipment’s manual. Gain: headroom for the strongest accent.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'ob.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Studio, a solo oboe, a good quiet room. One channel, phantom power available.',
    setups: [
      { id: 'a', label: 'Small condenser 15–20 cm from the holes, a third of the way up from the bell', ok: true, power: 'phantom', feedback: 'A suggested starting point for a natural spot sound — then small changes by ear.' },
      { id: 'b', label: 'Small condenser about a foot from the sound holes, facing them', ok: true, power: 'phantom', feedback: 'A suggested starting point for a balanced oboe.' },
      { id: 'c', label: 'A mic a few centimetres from the reed, where the sound is made', ok: false, power: 'phantom', feedback: 'At the reed it hears breath and edge and sits in the player’s way.' },
      { id: 'd', label: 'A mic pointed straight into the bell from close up', ok: false, power: 'phantom', feedback: 'A bell-only view favours the lowest notes and misses the holes.' },
      { id: 'e', label: 'Two close mics, at the bell and the upper joint, for stereo', ok: false, power: 'phantom', feedback: 'Stereo is not needed for one oboe; two close views move as the player moves.' },
    ],
    reasons: [docReason('the holes'), clearReason('the reed and face, the hands and the oboe’s pivot'), POWER_REASON, { id: 'r.blend', label: 'It hears the open holes and the bell together', role: 'optional', feedback: 'A fair reason: most notes leave from the holes, the lowest from the bell.' }, BRAND_REASON('oboe'), LOUD_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a sensible starting point from its named part, clearance from what moves, and the power the mic needs.',
  },
  {
    id: 'ob.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage: an oboist in a band with drums and amps, a wedge in front. Phantom power available.',
    setups: [
      { id: 'a', label: 'A small condenser a few centimetres from the bell, a little off its axis', ok: true, power: 'phantom', feedback: 'A suggested starting point for a bright, isolated live sound — check the low notes against the rest.' },
      { id: 'b', label: 'A miniature on a clip above the bell, aimed back up at the keys', ok: true, power: 'phantom', feedback: 'A suggested starting point that moves with the oboe — check the clip’s fit and the cable.' },
      { id: 'c', label: 'A small condenser a metre in front, for a natural blend', ok: false, power: 'phantom', feedback: 'On a loud stage a metre away hears the band and the wedge more than the oboe.' },
      { id: 'd', label: 'A clip on the reed’s staple, as close as the sound gets', ok: false, power: 'phantom', feedback: 'Nothing goes on the reed: it is at the player’s lips and is fragile.' },
      { id: 'e', label: 'An omni by the holes, turned up until it clears the band', ok: false, power: 'phantom', feedback: 'An omni rejects nothing; turned up, it brings the stage and feedback with it.' },
    ],
    reasons: [docReason('the bell or the bell joint'), clearReason('the reed, the hands, the ring keys and the cable path'), POWER_REASON, { id: 'r.iso', label: 'Close to the oboe it hears more oboe than stage', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON('oboe'), { id: 'r.loudest', label: 'Turn it up until the oboe is louder than the band', role: 'wrong', feedback: 'More gain raises the stage in that mic too, and brings feedback closer.' }],
    explain: 'Two setups pass. What passes is the reasoning: a bell-near stand mic or a clip made for the oboe, clearance from what moves, the power it needs — and the low notes checked against the rest.',
  },
];

const predictions: WindLesson['predictions'] = {
  sound: { prompt: 'Before you step through: where does most of a middle note’s sound leave the oboe?', options: ['The bell', 'An open hole on the body', 'The reed'], after: 'Now STEP through (or PLAY ONCE), then try the notes on the next step.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the mic from 15–20 cm to a few centimetres from the bell. What changes?', options: ['Brighter, more isolated', 'Darker, more room', 'It depends on the notes'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge is on the floor in front. Where will a supercardioid aimed back at the oboe reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What sets the oboe’s air column vibrating?',
    options: ['One cane reed against a mouthpiece', 'Two cane blades against each other', 'An air jet across the edge of a hole'],
    correct: 'Two cane blades against each other',
    explain: 'The oboe is a double-reed instrument: two thin cane blades tied on a small tube, held in the lips.',
    why: {
      'One cane reed against a mouthpiece': 'That is the clarinet’s single reed.',
      'An air jet across the edge of a hole': 'That is the flute’s way: no reed at all.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'Where on the oboe is “a third of the way up from the bell”?',
    options: ['At the reed, where the measurement starts', 'On the lower joint, among its holes', 'Inside the bell, a third of its depth'],
    correct: 'On the lower joint, among its holes',
    explain: 'One third of the body’s length, measured from the bell toward the reed, lands on the lower joint.',
    why: {
      'At the reed, where the measurement starts': 'The measurement starts at the bell, not the reed.',
      'Inside the bell, a third of its depth': 'The third is measured along the whole instrument, not into the bell.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'A middle-register note: where does most of its sound leave the oboe?',
    options: ['Near the first open tone hole', 'From the bell, like the lowest note', 'Back through the reed'],
    correct: 'Near the first open tone hole',
    explain: 'The air column behaves as if the tube ended just past the first open hole; only the lowest notes come mainly from the bell.',
    why: {
      'From the bell, like the lowest note': 'Only notes with every hole closed come mainly from the bell.',
      'Back through the reed': 'The reed is closed by the lips.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'The oboe’s octave key lifts a fingering by an octave. Why an octave?',
    options: ['Its bore is a cone: every multiple fits', 'The key halves the length of the tube', 'The double reed vibrates twice as fast on its own'],
    correct: 'Its bore is a cone: every multiple fits',
    explain: 'A cone from the reed resonates at ×1, ×2, ×3 …: the next resonance up is ×2, an octave. The octave key helps the tube into it.',
    why: {
      'The key halves the length of the tube': 'The octave key opens a small vent; the tube stays the same length.',
      'The double reed vibrates twice as fast on its own': 'The air column sets the reed’s pace; the key changes which resonance the column sounds.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'What must a stand mic and its cable stay clear of around an oboist?',
    options: ['The music stand, so the part stays readable', 'The reed and face, the hands, the oboe’s pivot', 'The audience’s view of the instrument'],
    correct: 'The reed and face, the hands, the oboe’s pivot',
    explain: 'Clearance comes first: the reed at the lips, the face, the fingers and the bell as the oboe pivots.',
    why: {
      'The music stand, so the part stays readable': 'Sight lines matter, but safety is about what moves.',
      'The audience’s view of the instrument': 'The view matters less than the player’s movement.',
    },
  },
  hearingDiag('q.6', W),
];

const floorY = SEATED.body.floorY;
const wedges: Wedge[] = [
  { id: 'wedge', label: 'the player’s floor wedge, in front, facing back at them', short: 'WEDGE', p: { x: 0, y: floorY, z: 1450 }, lift: 150, faces: { x: 0, y: 0, z: -1 }, note: 'On the floor in front, facing back at the player: below and behind a mic aimed back at the oboe — tilting the mic matters as much as turning it.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
  { id: 'side', label: 'another player’s wedge, off to the oboist’s left', short: 'SIDE WEDGE', p: { x: 1350, y: floorY, z: 900 }, lift: 150, faces: { x: -0.8, y: 0, z: -0.6 }, note: 'Off to one side, facing another player: well off the mic’s axis.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
];

const copy: Partial<LessonCopy> = {
  variantKey: 'POSTURE',
  variantShort: { seated: 'seated', standing: 'standing' },
  sceneSubject: { seated: 'an oboe held by a seated player', standing: 'an oboe held by a standing player' },
  viewTag: { side: 'FRONT · FROM THE AUDIENCE', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'to player’s left', minus: 'to player’s right', label: 'ACROSS', blurb: 'Toward the player’s left or right (x). Distances are read from the part the starting point names.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The oboe points down and out from the mouth.' },
    z: { plus: 'toward the audience', minus: 'toward the player', label: 'FRONT–BACK', blurb: 'Toward the audience or toward the player (z).' },
  },
  instrument: {
    figureBadge: 'An oboe, its keys toward you · every part named',
    figureLabel: 'An oboe seen from the side, keys toward you.',
    partsBadge: 'An oboist from the audience · tap a part to name it',
    partsLooking: { side: 'Front view · from the audience', top: 'Top view · from above' },
    partsIdle: 'The double reed starts the sound; the air in the narrow cone rings; the open holes and the bell let it out — the next page shows how. The player holds it out in front, the hands on the keys.',
    variantNotes: { standing: 'STANDING: the same hold — the floor and the legs farther from a stand’s base. Switch POSTURE to sit the player down.' },
  },
  placement: {
    workedZone: { seated: 'ob.dpa', standing: 'ob.dpa' },
    workedLine: 'This starting point also reads how far the mic is from {line}.',
    workedAim: 'Aim it at the holes on the lower joint — the lab counts it while the mic points within about {tol}° of them. Distance, height and angle are separate things to try.',
    workedClear: 'Clear of every part — the reed and the face, the hands and thumbs, the keys, the bell as the oboe pivots. Clearance comes first, before any number, and the player stops before a real mic moves.',
    blocked: {},
    reveal: 'Near the bell tends to sound brighter and more isolated, with the lowest notes leaning forward; a foot from the holes, more balanced; farther, more room. Each zone’s LISTEN FOR line is an idea to check by ear.',
    typeNotes: {
      sdcCard: 'Ideas to try: begin facing the holes a third of the way up; then a foot away for balance, or near the bell for a bright live sound — one change at a time, the whole range each time.',
      wwMini: 'Ideas to try with a miniature: keep its strap just above the bell; change only the capsule’s angle — farther up toward the upper joint for a more even range.',
    },
    note: 'Clearance comes first: stop the player before moving a real mic. A mic, clip or cable anywhere the reed, the hands or the bell can reach is in the wrong place, whatever the number says.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we suggest you begin with that kind of mic, measured from the part it names — the holes a third of the way up, the hole field, the bell, or the middle of the oboe. They are starting points for different goals, not rules. Move from there and listen: there is no single right answer.',
      separate: 'Distance, height and the angle toward the bell are separate variables: change one at a time, and play the lowest note of the part, the top and a fast passage each time. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm — a mic’s acoustic centre is not the visible end of its grille.',
      clearance: 'Clearance comes first. Stop the player before moving a mic; keep the mic, stand, clip and cable clear of the reed and face, the fingers, the keys and the bell as it pivots. The engine stops the mic and names what it would touch.',
      tendencies: 'Facing the holes tends to give a natural balance; near the bell, brighter and more isolated with the lowest notes forward; very close to the keys, clicks; farther, more room. A directional mic up close also lifts the lows. These are tendencies, and oboes vary.',
    },
  },
  context: {
    variant: 'seated',
    zone: 'ob.dpa',
    typeId: 'sdcCard',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'sdcCard' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'sdcCard' },
      { id: 'hypercardioid', label: 'hypercardioid', typeId: 'sdcCard' },
    ],
    micNoun: 'A small condenser',
    shield: ['ww.lower', 'ww.lower.1', 'ww.lower.2', 'ww.bell', 'ww.upper'],
    azMax: 60,
    elMax: 60,
    aimBlurb: 'Swing the front up to 60° either way — it still faces the oboe.',
    plan: { u0: -1200, u1: 1700, v0: -500, v1: 1750 },
    side: { u0: -1200, u1: 1700, v0: -400, v1: 1300 },
    target: 'wedge',
    frontIds: [],
    targetWord: 'wedge',
    looking: 'Top view · mic in front of the oboe',
    prompt: 'The player’s wedge stays where they need it. Turn the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — while the mic still points at the oboe.',
    activityDone: 'done — the wedge sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies. Use the null to aim, not to promise silence.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). In front of the player and aimed back at the oboe, its rear faces the audience side — the wedge, down on the floor, sits below that line, so tilting the mic matters as much as turning it.',
    shieldNote: 'The player’s body and the oboe can reflect stage sound into the front of a mic aimed at them — the free-field pattern cannot show that. Listen with the monitors on.',
    studioId: 'ob.ctx.studio',
    studioPrompt: 'A studio session, a solo oboe, a good room: what is the mic’s job?',
    studioNote: 'In the studio, a mic facing the holes — or a foot away, or farther — can carry the whole oboe and some room. Repeated trials are practical when the player stops. Switch back to LIVE for the monitor exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not restrictions.',
      points: [
        { title: 'PERSPECTIVE', text: 'Studio: a solo may want the room and a blend of reed, holes and bell. Live: an oboe among drums and amps needs a closer or bell-near sound.' },
        { title: 'SPILL AND FEEDBACK', text: 'Studio: the room and the neighbours. Live: monitors, the PA and the band. A closer mic, the right pattern and aim help — nothing alone prevents feedback.' },
        { title: 'MOVEMENT', text: 'An oboe pivots as the player breathes and reads. A stand mic has a working zone; a miniature on a clip keeps one distance as the player moves.' },
        { title: 'IN A SECTION', text: 'With a main pair up, an oboe mic is a spot: bring it up only for a stated balance, and check it in mono. A section spot can sit between two oboes at about head height.' },
      ],
      body: 'With a wedge in front of the player, a pattern’s rejection is a tool to aim — tilting as well as turning. Some stage sound in an oboe mic is normal; the question is how much the music can take.',
      warn: 'No mic position alone prevents feedback: the pattern, the other open mics, the monitors, the system level and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
    },
  },
  twoMic: {
    variant: 'seated',
    A: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'ob.dpa' },
    B: { typeId: 'sdcCard', pattern: 'omni', zone: 'ob.front' },
    learn: [
      'A second mic — a room mic, or the main pair the oboe plays into — is a choice for a reason, not a requirement for stereo: one oboe is a small source, and two close mics can move the image as the player moves.',
      'When it goes in: hear each mic alone, then the pair in MONO at the intended levels. Move or rebalance a mic first; check both polarity states at matched levels only after that — a polarity switch cannot line up every pitch.',
    ],
    warn: 'This simplified graph treats the oboe as one point and both mics as hearing the same sound. Real mics at different distances hear different mixes of holes, bell and room, so read the notch POSITIONS and treat their depths as illustrative. Judge by ear, in mono, at matched levels.',
  },
  practice: {
    gain: 'ob.prac.gain',
    second: 'ob.prac.3',
    mixed: ['ob.mix.1', 'ob.mix.2', 'ob.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: setting a filter from the real part, a pattern’s null, and polarity versus delay.',
  },
  terms: {
    instrument: 'the oboe',
    aimRef: 'its reference',
    startIntro: 'This lesson is about putting a microphone on an oboe. First the oboe itself: what it is, how the double reed and the air column make its sound, where that sound leaves, and where the player sits. Then the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
    startNew: 'Good — NEXT takes you through the oboe first. You can change how you started here at any time.',
    refTitle: 'MEASURED FROM',
    otherRef: 'The same number measured from another part of the oboe — the bell, the reed, the middle — would put the mic somewhere else.',
    noAim: 'This starting point gives no aim, so the mic simply faces the oboe. Distance, height and angle are still separate things to try.',
    clipMount: 'Mount: a clip made for this oboe, on a strap just above the bell, with the player’s agreement',
    standMount: 'Mount: a stand placed clear of the reed, the hands, the keys and the oboe’s pivot',
    inPath: 'oboe in path',
    facing: 'facing the oboe',
    observation: 'For a real oboe, with the player’s agreement, and the player stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
  },
};

export const A09A_LESSON: WindLesson = {
  id: 'A09a',
  labId: 'winds',
  title: 'Oboe',
  subtitle: 'Facing the holes a third up from the bell, a foot away, near the bell, or a clip',
  noun: { one: 'oboe', many: 'oboes' },
  model: OBOE_MODEL,
  micTypeIds: ['sdcCard', 'wwMini'],
  zones: OBOE_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A woodwind with a double reed — two thin blades of cane — on a narrow conical wooden tube with small tone holes, a dense keywork and a small flared bell. Octave keys lift its fingerings an octave.', src: 'Y-OB-MECH2' },
    { title: 'WHERE YOU MEET IT', text: 'Orchestras, wind bands and chamber groups, film scores and studio sessions; the English horn and the oboe d’amore are its larger relatives and take the same approach. This lesson covers one oboe: a studio solo, a loud stage and a spot in a section.', src: 'DPA-OB' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'It carries focused, singing melodies — the orchestra tunes to it — and its tone cuts through. Ask what the music needs: a natural orchestral colour, an intimate solo, or a separated line over a band.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'About 55 cm without its reed, the bell about 6 cm across. Its lowest note, B♭3, is about 233 Hz. This lab draws an oboe about that size, held 40° out from the body — seated, or standing.', src: 'MET-OB' },
  ],
  sound: {
    stages: [
      { title: 'Breath on the double reed', text: 'The player’s lips hold the two cane blades; the breath pushes them together, narrowing the slit the air comes through.' },
      { title: 'The blades open and close', text: 'The blades snap shut and spring open again, letting the air in in puffs — and the air column sets the timing, so the reed keeps in step with it.' },
      { title: 'The air column rings', text: 'A pressure wave runs down the narrow cone, reflects where it meets the open air — at the first open hole — and comes back: a standing wave, strongest at the reed end, still at the open end.' },
      { title: 'Sound leaves the oboe', text: 'Sound leaves from the first open holes, and from the bell for the lowest notes and for high partials of every note. Which place leads changes with every note — a mic sees a moving picture.' },
    ],
    attack: 'The start of a note: the tongue releasing the reed and the reed’s edge — strongest close to the reed. A mic close to the reed or the keys hears more of it, and of the clicks.',
    body: 'The sustained tone: the narrow cone ringing, leaving from the open holes and the bell in a pattern that changes with every note. A little distance tends to blend those outlets with the room. Both are tendencies, and oboes vary.',
    head: { diameterMm: 0, rods: 0, label: 'the air column', strikeSrc: 'Y-OB-MECH2' },
  },
  setting: {
    items: [
      { id: 'self', label: 'the oboe and its player', short: 'OBOE', note: 'Held out in front, 40° from the body, the reed at the lips. Ringed in amber: the instrument this lesson mics.', prov: { kind: 'illustrative', reason: 'oboe/GEOMETRY_PROPOSAL.md posture (drawing default)' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'reed', label: 'the reed, the face and the hands', short: 'REED · HANDS', note: 'The reed is at the lips and fragile; the fingers work the keys the whole time; the oboe pivots as the player breathes and reads. No mic, stand or cable goes there.', prov: { kind: 'illustrative', reason: 'the proposal’s keep-outs' }, tag: 'KEEP CLEAR', scene: 'kit', planIds: ['self'] },
      { id: 'stand', label: 'the music stand', short: 'MUSIC STAND', note: 'In front of the player, shared with the second oboe. They must see the music and the conductor: a mic stand should not block that line.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SIGHT LINE', scene: 'kit', planIds: ['stand.ob'] },
      { id: 'ob2', label: 'the second oboe beside', short: 'OBOE 2', note: 'In a section another oboe sits close by; a spot between the two at about head height can hear both.', prov: { kind: 'illustrative', reason: 'a typical seating' }, tag: 'SPILL · SECTION', scene: 'kit' },
      { id: 'flutes', label: 'the flutes beside, in the front row', short: 'FLUTES', note: 'The other half of the front row: an oboe mic hears them too.', prov: { kind: 'illustrative', reason: 'a typical seating' }, tag: 'SPILL', scene: 'kit', planIds: ['fl1', 'fl2', 'picc'] },
      { id: 'bassoons', label: 'the bassoons behind', short: 'BASSOONS', note: 'Right behind the oboes: their bells rise above the players’ heads, close to an oboe mic’s rear.', prov: { kind: 'illustrative', reason: 'a typical seating' }, tag: 'SPILL', scene: 'kit', planIds: ['bsn1', 'bsn2'] },
      { id: 'wedge', label: 'the player’s wedge (monitor)', short: 'WEDGE', note: 'On a stage, a floor monitor in front, facing back at the player — loud, and close to an oboe mic.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'side', label: 'another player’s wedge', short: 'SIDE WEDGE', note: 'Off to one side, facing another player.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Live, the audience already hears the acoustic oboe; the PA adds what the room needs.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage', planIds: ['audience', 'pa'] },
      { id: 'main', label: 'a main pair for the ensemble', short: 'MAIN PAIR', note: 'In a recording of a group, a main pair hears the whole ensemble; an oboe mic is a spot that supports it.', prov: { kind: 'illustrative', reason: 'a generic main pair' }, tag: 'MAIN PAIR', scene: 'studio' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'No wedges on the floor; a good room is part of an oboe’s sound.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors on the floor feed the players, the PA faces the audience, and a band can be loud. A closer, aimed mic — near the bell, or a miniature that moves with the oboe — helps against the stage and feedback.',
    studio: 'STUDIO: no wedges, a room that may sound good, and repeated trials when the player stops. A modest distance can carry the whole oboe and some room; in an ensemble, a main pair may carry it already.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic oboe setup for a studio solo and for a loud stage, describe an alternative position, and explain what would justify a second mic. With a real oboe and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'room', label: 'Room or stage', kind: 'text' },
      { id: 'posture', label: 'Player', kind: 'choice', choices: ['seated', 'standing'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser, cardioid', 'small condenser, omni', 'miniature on a clip', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, from the holes (or which part)', kind: 'text' },
      { id: 'notes', label: 'What you heard: lowest and top notes, keys, reed, room', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The player’s height above the floor and the 40° hold — drawing defaults — so no HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The 545 mm body and Ø 57 bell are a museum oboe of about 1900 used as a modern size; the reed (45 mm out), the joint split and the key layout are drawing defaults; the tone holes sit where the semitone rule puts them (a simplified picture).', dims: [] },
    { text: 'The hands, arms, head and the oboe’s pivot — illustrative keep-outs (a 20 mm margin round the oboe).', dims: [] },
    { text: '“A few inches from the bell” drawn 5–11 cm; the clip’s 3–13 cm and the miniature’s size and reach — drawing defaults to check on the real instrument.', dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. Every oboe, reed, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: one player in a typical hold, tone holes where the semitone rule puts them, the air column as an ideal cone, mic patterns and the two-mic comb as textbook shapes. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped, and only with their agreement.',
  copy,
  wind: windExtra(SPEC, {
    soundSubject: 'An oboe on its side, keys toward you, its air column drawn open',
    breath: 'Breath and reed edge are heard close to the reed; the oboe sends little air out of its holes, so wind noise at a body-facing mic is rarely a problem.',
    keys: 'The oboe’s dense keywork — rings, plates, pads closing — is easy to hear within a few centimetres of the body: back off, or change the angle.',
    directivity: 'Measured round a player in a quiet room: below about 400 Hz the oboe spreads its sound fairly evenly; above about 1 kHz the sound narrows into a beam toward the bell, and it is more than 12 dB quieter behind the player than in front.',
    noteDefault: 9,
  }),
};
