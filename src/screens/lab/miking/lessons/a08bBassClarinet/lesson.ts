/**
 * A08b BASS CLARINET — the lesson's pages as DATA (blueprint §7). The words
 * come from the owner's lesson (docs/labs/miking/source_text/Bass-Clarinet-
 * Miking-Technique.txt, "L<n>" in COMMENTS only) with the fixes in
 * CORRECTIONS_LOG.md (A8B-01 …) applied: MDAT's 2–4 ft replaces "no sourced
 * bass-clarinet number" (L14, L28); the supercardioid's nulls sit toward the
 * rear near 125°, not at the sides (L39); the soprano clarinet's 15–20 cm is
 * not transferred (L26, kept); the clip's angle stays a testable inference.
 *
 * OWNER RULING 2026-10-04: suggested starting points, never dogma; no
 * source, brand or model in learner text; no badges.
 */
import type { DiagnosticItem, MikingScenario, OrderTask, LessonPages, PageContent, SourcePageId, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import type { LessonCopy } from '../../engine/model/copy.ts';
import { BRAND_REASON, LOUD_REASON, POWER_REASON, bellBoomSymptom, clearReason, clipThreatSymptom, docReason, feedbackSymptom, filterSymptom, firstHoleCheck, gainCheck, hearingCheck, hearingDiag, keyNoiseSymptom, matchedLevels, nullOnPaper, polarityDelay, removeDelay, superNull, type WindWords } from '../shared/woodwinds/windItems.ts';
import { windExtra, type WindLesson } from '../shared/woodwinds/windLesson.ts';
import { BASS_CLARINET_MODEL, LAYOUTS, SPEC } from './geometry.ts';
import { BASS_CLARINET_ZONES } from './model.ts';

const W: WindWords = { noun: 'bass clarinet', player: 'bass clarinettist', end: 'the bell', exciter: 'the reed', moving: 'the hands, the bell and the floor peg' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the bass clarinet',
    goal: 'Get to know the bass clarinet — to low E♭ or extended to low C — what it is, where you meet it, what it does in the music, and its parts, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A single reed on a curved neck drives a long cylindrical tube that bends at the bottom into an upturned bell. Its sound is a blend of the bell and the open holes; the player sits with it between the knees on a floor peg.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a breath becomes a bass clarinet note — the reed, the long air column, the first open hole, the upturned bell — and where the sound leaves.',
    credit: { scenarios: ['bcl.snd.1', 'bcl.snd.2', 'bcl.snd.3'], interactive: 'soundPath', note: 'Step the sequence through to the end (or play it once), and answer the three checks.' },
    takeaway: 'Like a saxophone, the bass clarinet radiates a blend of bell and tone holes; which leads changes with the note and the player’s angle. Up a twelfth for the upper register, like the clarinet.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the bass clarinet sits — between the knees, the peg, the neck, the hands, the bell — the section around it, what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['bcl.set.1', 'bcl.set.2', 'bcl.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The peg, the chair, the neck, the hands and the bell stay clear of stands and cables. Ask which model and which lowest note the part uses, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the bass clarinet by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['bcl.mic.1', 'bcl.mic.2', 'bcl.mic.3', 'bcl.rec.1'], note: 'Answer the four checks (one reaches back to how the bass clarinet sounds).' },
    takeaway: 'A smooth-response condenser on a stand hears the bell-and-holes blend; a miniature on a clip made for the instrument moves with it. Both need phantom power. A very narrow pattern can make the blend uneven.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — 0.6–1.2 m in front, aimed at the middle — then compare the body-and-bell blend and a bell-favouring view.',
    credit: { scenarios: ['bcl.place.1', 'bcl.place.2', 'bcl.place.3', 'bcl.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different suggested starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'Begin far enough away to hear the whole instrument, then move in. A body-and-bell blend, a bell-favouring view and a clip are comparisons for different goals — and the lowest note decides a lot.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the player’s wedge — and know what a pattern cannot do, especially in the low register.',
    credit: { scenarios: ['bcl.ctx.1', 'bcl.ctx.2', 'bcl.ctx.studio', 'bcl.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A cardioid rejects most behind; a supercardioid toward the rear near 125°, not at its sides. Real nulls are shallow, and often shallowest in the lows the bass clarinet plays. No mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a bell mic and a keywork mic — or a spot and the main pair — can sound hollow together, and what the polarity switch does and does not change.',
    credit: { scenarios: ['bcl.two.1', 'bcl.two.2', 'bcl.two.3', 'bcl.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two mics hear the bass clarinet at different times, and moving either changes the interaction. Move or rebalance first; polarity flips the sign and never removes a delay. Judge in mono, at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — where the mic looks, its distance, the filter, the peg and the stand, the mount — before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one bass clarinet mic in the right order, choose and justify a setup for a studio overdub and a loud stage, and say what would justify a second mic.',
    credit: { scenarios: ['bcl.prac.order', 'bcl.prac.gain', 'bcl.prac.setup1', 'bcl.prac.setup2', 'bcl.prac.3', 'bcl.mix.1', 'bcl.mix.2', 'bcl.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real bass clarinet.' },
    takeaway: 'The model and its lowest note checked, a view of the bell AND the holes, clearance from the peg, neck, hands and bell, the right power and level, and an accurate account of polarity versus delay pass — and more than one setup can pass.',
  },
};

/* THE CHECKS. Lesson lines in comments only: bcl.snd.* L6 · bcl.set.* L7, L8
 * · bcl.mic.* L26, L40 · bcl.place.* L28-L31 · bcl.ctx.* L39 · bcl.two.* L35 ·
 * bcl.prac.* / bcl.mix.* L73-L77. */
const scenarios: MikingScenario[] = [
  {
    id: 'bcl.snd.1',
    page: 'sound',
    prompt: 'How does a bass clarinet’s sound leave, compared with a soprano clarinet’s?',
    options: ['Only from the bell, which points up at the player', 'A blend of the bell and the tone holes, like a saxophone', 'Only from the holes, as the bell is too wide to radiate'],
    correct: 'A blend of the bell and the tone holes, like a saxophone',
    explain: 'Its bell and its holes both contribute, and which leads changes with the note and the player’s angle — so treat the two as one source, and test the whole part.',
    why: {
      'Only from the bell, which points up at the player': 'The bell is one part of the blend; the open holes carry much of each note.',
      'Only from the holes, as the bell is too wide to radiate': 'A wide bell radiates well; the lowest notes leave mainly there.',
    },
  },
  firstHoleCheck('bcl.snd.2', W),
  {
    id: 'bcl.snd.3',
    page: 'sound',
    prompt: 'A low C model reaches three semitones lower than a low E♭ model. What makes that possible?',
    options: ['More tube: a longer lower joint and a deeper bow', 'A thicker reed that vibrates more slowly', 'A wider bell that lowers each of its notes by itself'],
    correct: 'More tube: a longer lower joint and a deeper bow',
    explain: 'A lower note needs a longer sounding tube; three semitones lower needs about a fifth more. The extension holds its own keys — so the mic and the filter must keep that lowest note.',
    why: {
      'A thicker reed that vibrates more slowly': 'The air column sets the pitch; the reed follows it.',
      'A wider bell that lowers each of its notes by itself': 'The bell shapes the lowest notes; their pitch comes from the tube’s length.',
    },
  },
  hearingCheck('bcl.set.1', W),
  {
    id: 'bcl.set.2',
    page: 'setting',
    prompt: 'Which part of the bass clarinet can carry thumps to a mic through the floor?',
    options: ['The curved metal neck at the top', 'The floor peg under the bow', 'The reed in the player’s mouth'],
    correct: 'The floor peg under the bow',
    explain: 'The peg rests on the floor: a stand or a foot on the same floor — or the peg itself knocked — can carry thumps up to a mic. Keep stands and cables off the peg’s path, and isolate the stand.',
    why: {
      'The curved metal neck at the top': 'The neck is at the player’s mouth, nowhere near the floor.',
      'The reed in the player’s mouth': 'The reed makes the note; the thumps come up through the floor.',
    },
  },
  {
    id: 'bcl.set.3',
    page: 'setting',
    prompt: 'Before placing any mic, what do you ask a bass clarinettist?',
    options: ['Which model, and the lowest note the part really uses', 'Only how loud the loudest passage of the part will be', 'Nothing yet: the starting point already says where'],
    correct: 'Which model, and the lowest note the part really uses',
    explain: 'Some models reach low C, others stop at E♭. The lowest note of the part decides where the mic must hear the bell and how low any filter may go.',
    why: {
      'Only how loud the loudest passage of the part will be': 'Level matters for gain, but the model and the lowest note decide placement and filtering.',
      'Nothing yet: the starting point already says where': 'A starting point says where to begin; the model and the part say whether it works.',
    },
  },
  {
    id: 'bcl.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Where does a bass clarinet’s sound leave?',
    options: ['A blend of the bell and the open holes', 'The reed, back toward the player', 'The neck, where it curves to the lips'],
    correct: 'A blend of the bell and the open holes',
    explain: 'The upturned bell and the open holes both radiate, and their balance changes with the note — so a mic aims at the blend.',
    why: {
      'The reed, back toward the player': 'The reed starts the sound; it leaves from the bell and the open holes.',
      'The neck, where it curves to the lips': 'The neck carries the air column; it has no open holes to let the sound out.',
    },
  },
  {
    id: 'bcl.mic.1',
    page: 'microphone',
    prompt: 'Why can a very narrow pattern sound uneven on a bass clarinet?',
    options: ['It narrows its view to one part as the source moves', 'It cannot hear frequencies below 100 Hz', 'It needs much more gain than the other patterns need'],
    correct: 'It narrows its view to one part as the source moves',
    explain: 'The sound leaves from the bell and from holes along the body, and the leader changes note by note; a narrow pickup hears one part at a time, so the timbre shifts.',
    why: {
      'It cannot hear frequencies below 100 Hz': 'A pattern does not cut the lows away; it chooses directions.',
      'It needs much more gain than the other patterns need': 'Pattern and gain are separate; the issue is what it sees.',
    },
  },
  {
    id: 'bcl.mic.2',
    page: 'microphone',
    prompt: 'Does a soprano clarinet’s 15–20 cm starting point carry over to a bass clarinet?',
    options: ['Yes — the whole clarinet family shares one distance', 'No — begin farther back and compare bell and holes', 'Yes, if it is measured from the bell instead'],
    correct: 'No — begin farther back and compare bell and holes',
    explain: 'That figure is for the straight soprano clarinet. A bass clarinet radiates differently: begin far enough away to hear the whole instrument, then move in while comparing the bell and the holes.',
    why: {
      'Yes — the whole clarinet family shares one distance': 'The bass clarinet is larger and radiates like a saxophone; the soprano’s number does not transfer.',
      'Yes, if it is measured from the bell instead': 'Measuring from the bell gives a bell-only view, not the blend.',
    },
  },
  {
    id: 'bcl.mic.3',
    page: 'microphone',
    prompt: 'Your only spare input has no phantom power. Can you use the clip miniature there?',
    options: ['Yes — the bell clip carries its power', 'No — it needs phantom power too', 'Yes, if the cable is kept short enough'],
    correct: 'No — it needs phantom power too',
    explain: 'Both of this page’s mics are condensers: the stand mic needs phantom power, and the miniature needs it through its adapter. Find a powered input.',
    why: {
      'Yes — the bell clip carries its power': 'A clip is a mount. The miniature still needs phantom power through its adapter.',
      'Yes, if the cable is kept short enough': 'Cable length does not power a condenser.',
    },
  },
  {
    id: 'bcl.place.1',
    page: 'placement',
    prompt: 'Where is a body-and-bell blend mic aimed?',
    options: ['Straight down the bell’s throat, from above', 'At the span from the lower body to the bell', 'At the curved neck, near the player’s mouth'],
    correct: 'At the span from the lower body to the bell',
    explain: 'In front and a little to the side, aimed into the space between the lower keys and the bell, the mic hears both parts of the blend — then move in or out by ear.',
    why: {
      'Straight down the bell’s throat, from above': 'Down the throat it hears mostly the bell and the lowest notes.',
      'At the curved neck, near the player’s mouth': 'The neck has no holes; the sound leaves lower down.',
    },
  },
  {
    id: 'bcl.place.2',
    page: 'placement',
    prompt: 'Moving toward the bell, the low notes jump forward and the high passages thin. What do you try?',
    options: ['Turn the high frequencies up to match the lows', 'Aim toward the keys, or back off a little', 'Ask the player to play the low notes softer'],
    correct: 'Aim toward the keys, or back off a little',
    explain: 'A bell-favouring view is one tonal option. If it unbalances the range, aim toward the keywork or add distance so the holes join in again — then replay the whole part.',
    why: {
      'Turn the high frequencies up to match the lows': 'EQ cannot put the holes back into a bell-only view. Move the mic.',
      'Ask the player to play the low notes softer': 'The dynamics are the music; the mic’s view is yours to change.',
    },
  },
  {
    id: 'bcl.place.3',
    page: 'placement',
    prompt: 'Can the bass clarinet’s neck hold a clip for a close mic?',
    options: ['Yes — the bow is metal, so it can take a clamp', 'Yes, if the clamp is padded with foam', 'No — use only a mount made for the instrument'],
    correct: 'No — use only a mount made for the instrument',
    explain: 'The neck, rods, pads, tenons and finish are never improvised mounts. Use a clip confirmed for this instrument, with the player’s agreement — or a stand.',
    why: {
      'Yes — the bow is metal, so it can take a clamp': 'Metal is not the question: a clamp on the neck can bend it or move the mouthpiece.',
      'Yes, if the clamp is padded with foam': 'Padding does not make the neck a mount. Use a clip made for the instrument.',
    },
  },
  {
    id: 'bcl.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What must a bass clarinet mic, its stand and its cable stay clear of?',
    options: ['The music stand and the conductor’s whole line of sight', 'The peg and chair, the neck, the hands and the bell', 'The front of the bell, so the sound can project'],
    correct: 'The peg and chair, the neck, the hands and the bell',
    explain: 'Clearance comes first: the peg and its path, the chair and the feet, the neck at the lips, the hands and thumbs, and the bell as the player moves.',
    why: {
      'The music stand and the conductor’s whole line of sight': 'Sight lines matter too, but the safety question is what moves or can be knocked.',
      'The front of the bell, so the sound can project': 'A mic can face the bell from a distance; what must stay clear is what moves.',
    },
  },
  {
    id: 'bcl.ctx.1',
    page: 'context',
    prompt: 'A bass clarinet part in a loud band, a wedge in front. A good first step?',
    options: ['A farther mic, so the band blends with it', 'Closer, aimed, or a clip made for the instrument', 'Turn the channel up until it sits well above the band'],
    correct: 'Closer, aimed, or a clip made for the instrument',
    explain: 'On a loud stage, a closer mic with its rejection toward the wedge — or a confirmed clip — gives more bass clarinet relative to the stage. Re-test every register and the low extension at show level.',
    why: {
      'A farther mic, so the band blends with it': 'Farther brings in more band and monitor — and less gain before feedback.',
      'Turn the channel up until it sits well above the band': 'More gain raises everything that mic hears and brings feedback closer.',
    },
  },
  superNull('bcl.ctx.2', 'context', 'wedge'),
  {
    id: 'bcl.ctx.studio',
    page: 'context',
    prompt: 'A bass clarinet overdub in a good room: is one well-placed mic usually enough?',
    options: ['No — it needs a bell mic and a key mic', 'Yes — often one mic gives a coherent instrument', 'No — it needs a second mic on the floor by the peg'],
    correct: 'Yes — often one mic gives a coherent instrument',
    explain: 'In a solo overdub one well-placed mic often gives a coherent bass clarinet. A second close mic for the bell is an option with a combining check — not a starting rule.',
    why: {
      'No — it needs a bell mic and a key mic': 'Two close mics change their interaction as either moves. One good position is the simpler start.',
      'No — it needs a second mic on the floor by the peg': 'By the peg a mic hears floor thumps, not the bell-and-holes blend.',
    },
  },
  {
    id: 'bcl.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Why can a high-pass filter defeat a bass clarinet part?',
    options: ['Its lowest notes can sit below a routine cutoff', 'The filter adds a hiss to the reed’s whole sound', 'The filter moves the bell’s radiation'],
    correct: 'Its lowest notes can sit below a routine cutoff',
    explain: 'A low E♭ model sounds about 69 Hz, a low C model about 58 Hz. Set any filter while the lowest note of the actual part plays.',
    why: {
      'The filter adds a hiss to the reed’s whole sound': 'A filter removes low frequencies; it adds no hiss.',
      'The filter moves the bell’s radiation': 'Filters change the signal, not the instrument.',
    },
  },
  {
    id: 'bcl.two.1',
    page: 'twoMic',
    prompt: 'A bell mic and a keywork mic on one bass clarinet sound hollow together. Why?',
    options: ['The bell mic inverts the sound on its way to it', 'They hear each note at different times, so pitches cancel', 'Two close mics cancel all of the low register between them'],
    correct: 'They hear each note at different times, so pitches cancel',
    explain: 'The two capsules are at different distances; summed, some pitches arrive out of step and dip. Moving either capsule changes the interaction — hear each alone and in mono.',
    why: {
      'The bell mic inverts the sound on its way to it': 'Distance delays a sound; it does not flip its sign.',
      'Two close mics cancel all of the low register between them': 'Cancellation depends on the delay and the levels: some pitches dip, others add.',
    },
  },
  polarityDelay('bcl.two.2'),
  matchedLevels('bcl.two.3'),
  {
    id: 'bcl.two.4',
    page: 'twoMic',
    prompt: 'In an ensemble recording with the main pair up, how do you use a bass clarinet spot?',
    options: ['Make it loud enough to hear each of the key clicks clearly', 'Bring it up for a stated balance, check it in mono', 'Leave the main pair out while it plays'],
    correct: 'Bring it up for a stated balance, check it in mono',
    explain: 'The main pair carries the ensemble; a spot supports it. Bring it in cautiously so the bass clarinet does not sound detached from the woodwinds, and check the mono sum.',
    why: {
      'Make it loud enough to hear each of the key clicks clearly': 'A loud spot pulls the instrument forward and exposes the mechanism.',
      'Leave the main pair out while it plays': 'The main pair is the picture of the ensemble; the spot only supports it.',
    },
  },
  gainCheck('bcl.prac.gain', W),
  {
    id: 'bcl.prac.3',
    page: 'practice',
    prompt: 'What would justify a separate close mic for the bell?',
    options: ['The goal needs it, and it holds in mono', 'The bell is too quiet for the stand mic', 'More channels give the mix more choices'],
    correct: 'The goal needs it, and it holds in mono',
    explain: 'Only for a stated musical goal — then hear each mic alone and together in mono. Moving either capsule changes the result; a polarity switch alone does not fix every cancellation.',
    why: {
      'The bell is too quiet for the stand mic': 'Level comes from gain and placement, not from another mic.',
      'More channels give the mix more choices': 'More channels add spill, cables and a combining check. A second mic should earn its place.',
    },
  },
  {
    id: 'bcl.mix.1',
    page: 'practice',
    prompt: 'A starting point reads “0.6–1.2 m in front, aimed at the center”. The center of what?',
    options: ['The bell’s mouth, where it opens upward', 'The bass clarinet itself, its middle', 'The player’s chest, behind the instrument'],
    correct: 'The bass clarinet itself, its middle',
    explain: 'Aimed at the middle of the instrument, from a little distance, the mic hears the holes and the bell blending. Aimed into the bell, it would miss the rest of the notes.',
    why: {
      'The bell’s mouth, where it opens upward': 'Aimed into the bell, the mic would miss much of the holes’ sound.',
      'The player’s chest, behind the instrument': 'The reference is the instrument, not the player.',
    },
  },
  nullOnPaper('bcl.mix.2', 'wedge'),
  removeDelay('bcl.mix.3'),
];

const symptoms: Symptom[] = [
  bellBoomSymptom('bcl.sym.bell', W),
  filterSymptom('bcl.sym.filter', W),
  keyNoiseSymptom('bcl.sym.keys', W),
  {
    id: 'bcl.sym.thump',
    observation: 'Floor thumps enter the channel',
    firstChecks: 'Is the peg, the stand or the stage carrying the knocks? Secure and isolate the stand; keep it and the cable off the peg’s path.',
    options: ['Cut the low frequencies hard until the thumps have stopped', 'Secure and isolate the stand; keep off the peg’s path', 'Ask the player to take the peg off the floor'],
    correct: 'Secure and isolate the stand; keep off the peg’s path',
    explain: 'The peg rests on the floor; knocks travel up a stand on the same floor. Isolate the stand (a shock mount), move it off the peg’s path — and keep the low register the music needs.',
    why: {
      'Cut the low frequencies hard until the thumps have stopped': 'A filter that kills the thumps can kill the bass clarinet’s low notes too. Fix the path first.',
      'Ask the player to take the peg off the floor': 'The peg carries the instrument’s weight; the stand is yours to change.',
    },
  },
  clipThreatSymptom('bcl.sym.clip', W),
  feedbackSymptom('bcl.sym.feedback', W),
];

const orderTasks: OrderTask[] = [
  {
    id: 'bcl.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic bass clarinet setup in the order you would do them.',
    steps: [
      { text: 'Ask which model and the lowest note the part uses; hear soft, strong, low and high', early: 'Start with the instrument and the music.' },
      { text: 'Mark the bell, the keys, the peg and the chair; watch the player move', early: 'Map the instrument before choosing a place.' },
      { text: 'Choose the mic and a stable stand (or a confirmed clip)', early: 'Choose once you know the model and the part.' },
      { text: 'With the player stopped, place it 0.6–1.2 m in front, aimed at the middle, off the peg’s path', early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom power on', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set input gain on the quietest AND strongest notes, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare a blend view and a bell-favouring view, at matched levels', early: 'Compare only once the level is set safely.' },
      { text: 'Secure the stand; play the lowest note through any filter', early: 'Secure it last, then check the lowest note again.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before switching it, and follow your own equipment’s manual. Gain: headroom for the strongest notes; the filter must keep the lowest one.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'bcl.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Studio overdub, a bass clarinet to low C, a good quiet room. One channel, phantom power available.',
    setups: [
      { id: 'a', label: 'Small condenser 0.6–1.2 m in front, aimed at the middle of the instrument', ok: true, power: 'phantom', feedback: 'A suggested starting point that hears the whole instrument — then move in by ear.' },
      { id: 'b', label: 'Small condenser 25–55 cm in front and a little to the side, at the lower body and bell', ok: true, power: 'phantom', feedback: 'A suggested starting point for the blend — check the lowest note and the keys.' },
      { id: 'c', label: 'A mic pointed straight down the bell’s throat from close above', ok: false, power: 'phantom', feedback: 'Down the throat, the bell’s lowest notes lead and the holes fall away.' },
      { id: 'd', label: 'The soprano clarinet’s 15–20 cm, a third up from the bell', ok: false, power: 'phantom', feedback: 'That figure is for the soprano clarinet; it does not transfer to the bass.' },
      { id: 'e', label: 'A mic clamped to the curved neck', ok: false, power: 'phantom', feedback: 'The neck is never a mount — and the sound leaves lower down.' },
    ],
    reasons: [docReason('the middle of the instrument, or the lower body and bell'), clearReason('the peg, the chair, the neck, the hands and the bell'), POWER_REASON, { id: 'r.low', label: 'The lowest note (low C) is heard and kept through any filter', role: 'optional', feedback: 'A strong reason for this model.' }, BRAND_REASON('bass clarinet'), LOUD_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a view of the bell AND the holes, clearance, the power the mic needs — and the low C kept.',
  },
  {
    id: 'bcl.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage: a bass clarinettist in a band, a wedge in front, seated. Phantom power available.',
    setups: [
      { id: 'a', label: 'A clip confirmed for this instrument on the bell’s rim, aimed between the bell and the keys', ok: true, power: 'phantom', feedback: 'A suggested starting point that moves with the instrument — re-test every register.' },
      { id: 'b', label: 'A cardioid on a weighted stand close in front, its rear toward the wedge', ok: true, power: 'phantom', feedback: 'A suggested starting point with the rejection aimed — check the peg and the floor.' },
      { id: 'c', label: 'An omni a metre away, for a natural blend', ok: false, power: 'phantom', feedback: 'On a loud stage an omni a metre away hears the band and the wedge more than the instrument.' },
      { id: 'd', label: 'A mic on the floor beside the peg, aimed up at the bell', ok: false, power: 'phantom', feedback: 'By the peg it hears floor thumps, and the stand sits in the peg’s path.' },
      { id: 'e', label: 'A mic straight into the bell, turned up until it clears the band', ok: false, power: 'phantom', feedback: 'A bell-only view loses the holes; turned up, it brings the stage and feedback.' },
    ],
    reasons: [docReason('the bell’s rim or the middle of the instrument'), clearReason('the peg, the neck, the hands and the cable path'), POWER_REASON, { id: 'r.move', label: 'A mic on the instrument holds its distance as the player moves', role: 'optional', feedback: 'A fair live reason for a clip.' }, BRAND_REASON('bass clarinet'), { id: 'r.loudest', label: 'Turn it up until the bass clarinet is louder than the band', role: 'wrong', feedback: 'More gain raises the stage in that mic too, and brings feedback closer.' }],
    explain: 'Two setups pass. What passes is the reasoning: a confirmed clip or a close aimed stand mic, clearance from the peg and the hands, the power it needs — and every register re-tested at show level.',
  },
];

const predictions: WindLesson['predictions'] = {
  sound: { prompt: 'Before you step through: where does most of a bass clarinet’s middle note leave?', options: ['The bell only', 'The holes and the bell together', 'The neck'], after: 'Now STEP through (or PLAY ONCE), then try the notes on the next step.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move from the blend view toward the bell. What changes?', options: ['More low-note weight', 'More key detail', 'Nothing'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge is on the floor in front. Where will a supercardioid aimed back at the instrument reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What holds the bass clarinet up when the player is seated?',
    options: ['A seat strap under the bell', 'A floor peg under the bow', 'The player’s knees alone'],
    correct: 'A floor peg under the bow',
    explain: 'A metal peg from the bow to the floor carries the weight; the instrument stands between the knees.',
    why: {
      'A seat strap under the bell': 'A seat strap is the bassoon’s way.',
      'The player’s knees alone': 'The knees steady it; the peg carries it.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'Which way does a bass clarinet’s bell point?',
    options: ['Up and forward, at the bottom of the bow', 'Straight down at the floor, beside the peg', 'Back toward the player’s chest'],
    correct: 'Up and forward, at the bottom of the bow',
    explain: 'The tube turns at the bottom bow and the metal bell rises up and forward, in front of the player’s knees.',
    why: {
      'Straight down at the floor, beside the peg': 'That is a soprano clarinet’s bell, roughly; the bass clarinet’s is turned up.',
      'Back toward the player’s chest': 'The bell turns up and away from the player.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'Where does a bass clarinet’s sound leave?',
    options: ['Only the upturned bell at the top', 'A blend of the bell and the open holes', 'Only the open tone holes on the lower joint'],
    correct: 'A blend of the bell and the open holes',
    explain: 'Like a saxophone, it radiates from the bell and the holes together, and the balance changes with the note.',
    why: {
      'Only the upturned bell at the top': 'The open holes carry much of each note.',
      'Only the open tone holes on the lower joint': 'The bell carries the lowest notes and adds to many others.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Why check the lowest note before setting a high-pass filter?',
    options: ['The part may reach about 58–69 Hz', 'The filter will only cut the highs', 'The lowest note makes the most key noise'],
    correct: 'The part may reach about 58–69 Hz',
    explain: 'A low E♭ model sounds about 69 Hz, a low C model about 58 Hz — below many routine filter settings.',
    why: {
      'The filter will only cut the highs': 'A high-pass filter cuts the lows — the bass clarinet’s home.',
      'The lowest note makes the most key noise': 'Key noise is not the reason; the note itself is.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'What must a stand and its cable stay clear of around a bass clarinettist?',
    options: ['The music stand, so the whole part stays readable', 'The peg and chair, the neck, the hands, the bell', 'The audience’s view of the instrument'],
    correct: 'The peg and chair, the neck, the hands, the bell',
    explain: 'Clearance comes first: the peg and its path, the chair and the feet, the neck at the lips, the hands and the bell.',
    why: {
      'The music stand, so the whole part stays readable': 'Sight lines matter, but safety is about what moves or can be knocked.',
      'The audience’s view of the instrument': 'The view matters less than the peg, the hands and the bell.',
    },
  },
  hearingDiag('q.6', W),
];

const floorY = LAYOUTS.eflat.body.floorY;
const wedges: Wedge[] = [
  { id: 'wedge', label: 'the player’s floor wedge, in front, facing back at them', short: 'WEDGE', p: { x: 0, y: floorY, z: 1550 }, lift: 150, faces: { x: 0, y: 0, z: -1 }, note: 'On the floor in front, facing back at the player — below and behind a mic aimed back at the instrument.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
  { id: 'side', label: 'another player’s wedge, off to the right', short: 'SIDE WEDGE', p: { x: -1400, y: floorY, z: 900 }, lift: 150, faces: { x: 0.8, y: 0, z: -0.6 }, note: 'Off to one side, facing another player: well off the mic’s axis.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
];

const copy: Partial<LessonCopy> = {
  variantKey: 'MODEL',
  variantShort: { eflat: 'low E♭ model', lowc: 'low C model' },
  sceneSubject: { eflat: 'a bass clarinet to low E♭, held by a seated player', lowc: 'a bass clarinet extended to low C, held by a seated player' },
  viewTag: { side: 'FRONT · FROM THE AUDIENCE', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'to player’s left', minus: 'to player’s right', label: 'ACROSS', blurb: 'Toward the player’s left or right (x).' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The instrument reaches from the lips to near the floor.' },
    z: { plus: 'toward the audience', minus: 'toward the player', label: 'FRONT–BACK', blurb: 'Toward the audience or toward the player (z).' },
  },
  instrument: {
    figureBadge: 'A bass clarinet, keys toward you · every part named',
    figureLabel: 'A bass clarinet seen from the side.',
    partsBadge: 'A bass clarinettist from the audience · tap a part to name it',
    partsLooking: { side: 'Front view · from the audience', top: 'Top view · from above' },
    partsIdle: 'The reed on the curved neck starts the sound; the long tube rings; the open holes and the upturned bell let it out together — the next page shows how. Switch MODEL to compare a low E♭ and a low C instrument.',
    variantNotes: { lowc: 'LOW C: a longer lower joint and a deeper bow, three more semitones down to about 58 Hz — the instrument sits lower and leans a little more; check the lowest note through any filter.' },
  },
  placement: {
    workedZone: { eflat: 'bcl.front', lowc: 'bcl.front' },
    workedLine: 'This starting point also reads how far the mic is from {line}.',
    workedAim: 'Aim it at the middle of the instrument — the lab counts it while the mic points within about {tol}° of it — so the holes and the bell are heard together.',
    workedClear: 'Clear of every part — the peg and its path, the chair and the feet, the neck, the hands and the bell. Clearance comes first, before any number, and the player stops before a real mic moves.',
    blocked: {},
    reveal: 'Toward the bell tends to bring more low-note weight; toward the keys, more articulation and clicks; the blend view, both. Each zone’s LISTEN FOR line is an idea to check by ear.',
    typeNotes: {
      sdcCard: 'Ideas to try: begin 0.6–1.2 m in front at the middle; then the blend view and the bell view — one change at a time, low, middle and high phrases each time.',
      wwMini: 'Ideas to try with a miniature: keep its clip on the bell’s rim; change only the capsule’s angle between the bell and the keys while the player plays the whole part.',
    },
    note: 'Clearance comes first: stop the player before moving a real mic. A stand, clip or cable anywhere the peg, the hands or the bell can reach is in the wrong place, whatever the number says.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we suggest you begin with that kind of mic, measured from the part it names — the middle of the instrument, the span from the lower body to the bell, the bell, the lowest keys. They are starting points and comparisons, not rules.',
      separate: 'Distance, height and the side angle are separate variables: change one at a time, and play the lowest note of the part, the middle and the top each time. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.',
      clearance: 'Clearance comes first. Stop the player before moving a mic; keep the mic, stand, clip and cable clear of the peg and its path, the chair, the neck, the hands and the bell. The engine stops the mic and names what it would touch.',
      tendencies: 'Farther tends to blend the bell and the holes; toward the bell, more low-note weight; toward the keys, articulation and clicks. A directional mic up close also lifts the lows. These are tendencies, and instruments vary.',
    },
  },
  context: {
    variant: 'eflat',
    zone: 'bcl.blend',
    typeId: 'sdcCard',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'sdcCard' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'sdcCard' },
      { id: 'hypercardioid', label: 'hypercardioid', typeId: 'sdcCard' },
    ],
    micNoun: 'A small condenser',
    shield: ['ww.lower', 'ww.lower.1', 'ww.lower.2', 'ww.bow', 'ww.bell', 'ww.upper'],
    azMax: 60,
    elMax: 60,
    aimBlurb: 'Swing the front up to 60° either way — it still faces the instrument.',
    plan: { u0: -1700, u1: 1200, v0: -500, v1: 1850 },
    side: { u0: -1700, u1: 1200, v0: -400, v1: 1300 },
    target: 'wedge',
    frontIds: [],
    targetWord: 'wedge',
    looking: 'Top view · mic in front of the bass clarinet',
    prompt: 'The player’s wedge stays where they need it. Turn the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — while the mic still points at the instrument.',
    activityDone: 'done — the wedge sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and often least at low frequencies — the bass clarinet’s range. Use the null to aim, not to promise silence.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). In front of the player and aimed back at the instrument, its rear faces the audience side — the wedge, down on the floor, sits below that line, so tilting the mic matters as much as turning it.',
    shieldNote: 'The player’s body and the instrument can reflect stage sound into a mic aimed at them — the free-field pattern cannot show that. Listen with the monitors on.',
    studioId: 'bcl.ctx.studio',
    studioPrompt: 'A studio overdub, a bass clarinet, a good room: what is the mic’s job?',
    studioNote: 'In the studio one well-placed mic often gives a coherent bass clarinet; compare the blend and the bell views. Repeated trials are practical when the player stops. Switch back to LIVE for the monitor exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not restrictions.',
      points: [
        { title: 'PERSPECTIVE', text: 'Studio: a solo may want the whole instrument and some room. Live: a bass clarinet among drums and amps needs a closer view or a confirmed clip.' },
        { title: 'SPILL AND FEEDBACK', text: 'Studio: the room and its modes. Live: monitors, the PA and the band — and a pattern often rejects least in the lows. Nothing alone prevents feedback.' },
        { title: 'THE FLOOR', text: 'The peg rests on the floor: isolate the stand and keep cables out of the peg’s path, or thumps reach the mic.' },
        { title: 'IN A SECTION', text: 'With a main pair up, a bass clarinet mic is a spot: bring it up only for a stated balance, and check it in mono.' },
      ],
      body: 'With a wedge in front of the player, a pattern’s rejection is a tool to aim — tilting as well as turning. Some stage sound in the mic is normal; the question is how much the music can take.',
      warn: 'No mic position alone prevents feedback: the pattern, the other open mics, the monitors, the system level and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
    },
  },
  twoMic: {
    variant: 'eflat',
    A: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'bcl.blend' },
    B: { typeId: 'sdcCard', pattern: 'omni', zone: 'bcl.front' },
    learn: [
      'A second mic is a choice for a reason, not a requirement: one well-placed mic often gives a coherent instrument, and a separate bell mic changes its balance with the keywork note by note.',
      'When it goes in: hear each mic alone, then the pair in MONO at the intended levels. Moving either capsule changes the interaction; check both polarity states only after moving or rebalancing.',
    ],
    warn: 'This simplified graph treats the bass clarinet as one point and both mics as hearing the same sound. Real mics hear different mixes of bell, holes and room, so read the notch POSITIONS and treat their depths as illustrative. Judge by ear, in mono, at matched levels.',
  },
  practice: {
    gain: 'bcl.prac.gain',
    second: 'bcl.prac.3',
    mixed: ['bcl.mix.1', 'bcl.mix.2', 'bcl.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: what a distance is aimed at, a pattern’s null, and polarity versus delay.',
  },
  terms: {
    instrument: 'the bass clarinet',
    aimRef: 'its reference',
    startIntro: 'This lesson is about putting a microphone on a bass clarinet. First the instrument itself: which model it is, how the reed and the long air column make its sound, why the bell and the holes blend, and where the player sits. Then the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
    startNew: 'Good — NEXT takes you through the bass clarinet first. You can change how you started here at any time.',
    refTitle: 'MEASURED FROM',
    otherRef: 'The same number measured from another part — the bell, the reed, the peg — would put the mic somewhere else.',
    noAim: 'This starting point gives no aim, so the mic simply faces the instrument. Distance, height and angle are still separate things to try.',
    clipMount: 'Mount: a clip confirmed for this bass clarinet, on the bell’s rim — never the neck — with the player’s agreement',
    standMount: 'Mount: a stable, isolated stand clear of the peg’s path, the chair, the hands and the bell',
    inPath: 'instrument in path',
    facing: 'facing the instrument',
    observation: 'For a real bass clarinet, with the player’s agreement, and the player stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
  },
};

export const A08B_LESSON: WindLesson = {
  id: 'A08b',
  labId: 'winds',
  title: 'Bass Clarinet',
  subtitle: 'Bell and holes together: in front, the body-and-bell blend, the bell to compare, or a clip',
  noun: { one: 'bass clarinet', many: 'bass clarinets' },
  model: BASS_CLARINET_MODEL,
  micTypeIds: ['sdcCard', 'wwMini'],
  zones: BASS_CLARINET_ZONES,
  // The low-C instrument's TWO MICS (review 2026-10-07, CORRECTIONS_LOG
  // RV34-09): the two-mic page's pair is written for the E-flat instrument;
  // the same pair on the low-C one is its own blend zone and the front mic.
  setupPairs: [{ label: 'In front, a little to the side, at the lower body and bell + in front, aimed at the middle', A: { zone: 'bcl.blend.c', typeId: 'sdcCard', pattern: 'cardioid' }, B: { zone: 'bcl.front', typeId: 'sdcCard', pattern: 'omni' }, variants: ['lowc'], line: 'The whole instrument — the open holes and the bell blending — with some of the room. Two mics give more to blend — check the pair together in mono.' }],
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'The clarinet an octave down: a single reed on a curved metal neck, a long cylindrical body with keys and covered holes, a metal bow at the bottom and an upturned bell. Some models stop at low E♭, others extend to low C.', src: 'Y-YCL622' },
    { title: 'WHERE YOU MEET IT', text: 'Orchestras and wind bands, film and studio work, jazz and contemporary music. This lesson covers one bass clarinet: a studio overdub, a loud stage and a spot in an ensemble.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Dark bass lines, low colour under the woodwinds, and agile solos high up. Ask what the music needs — and which lowest note the part uses.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'About 1.35 m of tube to low E♭ (lowest note about 69 Hz), more for a low C model (about 58 Hz) — drawn here at about that size, seated, between the knees on its peg. Its exact dimensions vary by maker.', src: 'Y-YCL622' },
  ],
  sound: {
    stages: [
      { title: 'Breath on the reed', text: 'The player blows into the mouthpiece; the breath pushes the reed toward it, narrowing the gap the air comes through.' },
      { title: 'The reed opens and closes', text: 'The reed swings shut and springs open, letting air in in puffs — in step with the long air column behind it.' },
      { title: 'The long air column rings', text: 'A pressure wave runs down the neck and the body, reflects at the first open hole and comes back: a standing wave, strongest at the reed end.' },
      { title: 'Sound leaves — bell and holes', text: 'Sound leaves from the first open holes and from the upturned bell together — a blend whose balance changes with the note and the player’s angle.' },
    ],
    attack: 'The start of a note: the tongue releasing the reed and a little reed edge, heard most near the mouthpiece; the keys’ clicks near the body.',
    body: 'The sustained tone: the long air column ringing, leaving from the open holes and the bell together. A little distance blends them with the room. Both are tendencies, and instruments vary.',
    head: { diameterMm: 0, rods: 0, label: 'the air column', strikeSrc: 'DPA-CL' },
  },
  setting: {
    items: [
      { id: 'self', label: 'the bass clarinet and its player', short: 'BASS CLARINET', note: 'Seated, the instrument between the knees on its peg, the neck to the lips, the bell turned up in front. Ringed in amber: the instrument this lesson mics.', prov: { kind: 'illustrative', reason: 'bass_clarinet/GEOMETRY_PROPOSAL.md (drawing defaults)' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'peg', label: 'the floor peg and the chair', short: 'PEG · CHAIR', note: 'The peg carries the instrument’s weight on the floor. Keep stand bases and cables off its path — a knock reaches the mic as a thump.', prov: { kind: 'illustrative', reason: 'a 120 mm keep-out round the peg’s foot (drawing default)' }, tag: 'KEEP CLEAR', scene: 'kit', planIds: ['self'] },
      { id: 'hands', label: 'the neck, the hands and the bell', short: 'NECK · HANDS', note: 'The curved neck at the lips is never a mount; the hands and thumbs work the keys; the bell moves with the player. No mic, stand or cable there.', prov: { kind: 'illustrative', reason: 'the proposal’s keep-outs' }, tag: 'KEEP CLEAR', scene: 'kit', planIds: ['self'] },
      { id: 'stand', label: 'the music stand', short: 'MUSIC STAND', note: 'In front of the player. They must see the music and the conductor.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SIGHT LINE', scene: 'kit', planIds: ['stand.bcl'] },
      { id: 'clarinets', label: 'the clarinets beside', short: 'CLARINETS', note: 'The bass clarinet usually sits at the end of the clarinets; a close mic hears them too.', prov: { kind: 'illustrative', reason: 'a typical seating' }, tag: 'SPILL', scene: 'kit', planIds: ['cl1', 'cl2'] },
      { id: 'front', label: 'the flutes and piccolo in front', short: 'FLUTES', note: 'The front row: in front of a bass clarinet mic aimed back at the player.', prov: { kind: 'illustrative', reason: 'a typical seating' }, tag: 'SPILL', scene: 'kit', planIds: ['picc', 'fl1', 'fl2'] },
      { id: 'wedge', label: 'the player’s wedge (monitor)', short: 'WEDGE', note: 'On a stage, a floor monitor in front, facing back at the player.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'side', label: 'another player’s wedge', short: 'SIDE WEDGE', note: 'Off to one side, facing another player.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Live, the audience already hears the acoustic instrument; the PA adds what the room needs.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage', planIds: ['audience', 'pa'] },
      { id: 'main', label: 'a main pair for the ensemble', short: 'MAIN PAIR', note: 'In an ensemble recording, a main pair hears the whole group; a bass clarinet mic is a spot that supports it.', prov: { kind: 'illustrative', reason: 'a generic main pair' }, tag: 'MAIN PAIR', scene: 'studio' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'No wedges on the floor — but the room’s low resonances and the floor carry the bass clarinet’s lows.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors on the floor feed the players, the PA faces the audience, and a band can be loud. A closer aimed mic or a confirmed clip helps; a pattern often rejects least in the lows, and the floor carries thumps.',
    studio: 'STUDIO: no wedges, a room that may sound good, and repeated trials when the player stops. One well-placed mic often gives a coherent bass clarinet; in an ensemble, a main pair may carry it already.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic bass clarinet setup for a studio overdub and for a loud stage, describe an alternative position, and explain what would justify a second mic. With a real bass clarinet and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'room', label: 'Room or stage', kind: 'text' },
      { id: 'model', label: 'Model', kind: 'choice', choices: ['to low E♭', 'to low C'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser, cardioid', 'small condenser, omni', 'miniature on a clip', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, from the instrument (or which part)', kind: 'text' },
      { id: 'notes', label: 'What you heard: lowest note, middle, top, keys, floor', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The player’s height above the floor and the instrument’s lean between the knees — drawing defaults — so no HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'Every bass clarinet dimension is a drawing default (1350 mm of tube incl. the neck, bell Ø 110, the peg); the low C model’s extra 250 mm is three semitones of tube (derived); the holes sit where the semitone rule puts them (a simplified picture).', dims: [] },
    { text: 'The hands, arms, head, the peg’s foot and the bell’s movement — illustrative keep-outs (a 20 mm margin round the instrument).', dims: [] },
    { text: 'The blend view’s 25–55 cm, the bell view’s 15–35 cm and the clip’s 6–24 cm — drawing defaults: no published bass-clarinet number exists for them.', dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules; for the bass clarinet, most close distances are our own drawings of good practice. Every instrument, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: one player in a typical hold, tone holes where the semitone rule puts them, the air column as an ideal tube, mic patterns and the two-mic comb as textbook shapes. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped, and only with their agreement.',
  copy,
  wind: windExtra(SPEC, {
    soundSubject: 'A bass clarinet on its side, keys toward you, its air column drawn open',
    breath: 'Breath and the reed are heard close to the mouthpiece, high on the instrument; a body-facing mic hears little wind.',
    keys: 'Long keys, thumb keys and pads closing: loud within a few centimetres of the keywork — back off, or change the angle.',
    directivity: 'Unlike the other woodwinds in this lab, the bass clarinet’s pattern round the player is not drawn here from a measurement — it is expected to differ from the soprano clarinet’s, with its larger size and upturned bell. Test positions by ear.',
    noteDefault: 9,
  }),
};
