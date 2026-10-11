/**
 * A08a B♭ CLARINET — the lesson's pages as DATA (blueprint §7). The words
 * come from the owner's lesson (docs/labs/miking/source_text/Soprano-
 * Clarinet-Miking-Technique.txt, cited "L<n>" in COMMENTS only) with the
 * fixes logged in docs/labs/miking/CORRECTIONS_LOG.md (A8A-01 …) applied:
 * the bell's low-note role is physics (L6, re-cited), the supercardioid's
 * nulls sit toward the rear near 125° (L36), MDAT's 2–4 ft front position
 * added beside DPA's 15–20 cm.
 *
 * OWNER RULING 2026-10-04 — learner-facing presentation: suggested starting
 * points, never dogma; no source, brand or model in learner text; no badges.
 */
import type { DiagnosticItem, MikingScenario, OrderTask, LessonPages, PageContent, SourcePageId, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import type { LessonCopy } from '../../engine/model/copy.ts';
import { BRAND_REASON, LOUD_REASON, POWER_REASON, bellBoomSymptom, bellOnlyCheck, clearReason, clipThreatSymptom, colourSymptom, docReason, feedbackSymptom, filterSymptom, firstHoleCheck, gainCheck, hearingCheck, hearingDiag, keyNoiseSymptom, matchedLevels, nullOnPaper, polarityDelay, removeDelay, superNull, type WindWords } from '../shared/woodwinds/windItems.ts';
import { windExtra, type WindLesson } from '../shared/woodwinds/windLesson.ts';
import { CLARINET_MODEL, SEATED, SPEC } from './geometry.ts';
import { CLARINET_ZONES } from './model.ts';

const W: WindWords = { noun: 'clarinet', player: 'clarinettist', end: 'the bell', exciter: 'the reed', moving: 'the hands, the keys and the bell’s swing' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the clarinet',
    goal: 'Get to know the B♭ clarinet — what it is, where you meet it, what it does in the music, and its parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A single reed on a mouthpiece drives the air in a long cylindrical tube. Tone holes along the body and the bell at the end let the sound out; the player holds it out in front, the bell at about knee height when seated.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a breath becomes a clarinet note — the reed, the air column, the first open hole — and where the sound leaves the instrument.',
    credit: { scenarios: ['cl.snd.1', 'cl.snd.2', 'cl.snd.3'], interactive: 'soundPath', note: 'Step the sequence through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The reed lets air in in puffs; the air column rings; most of each note leaves from the first open hole, and only the lowest notes from the bell. Up a twelfth for the upper register. A mic sees one part of a moving picture — tendencies, and clarinets vary.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the clarinet sits — the hands and the bell, the chair and the music stand, the neighbours in a section — what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['cl.set.1', 'cl.set.2', 'cl.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The hands, the keys and the bell move; the player breathes and phrases. Ask the player first, hear the whole range, keep the mic clear — and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the clarinet by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['cl.mic.1', 'cl.mic.2', 'cl.mic.3', 'cl.rec.1'], note: 'Answer the four checks (one reaches back to how the clarinet sounds).' },
    takeaway: 'A small condenser on a stand hears the clarinet whole; a miniature on a clip moves with it. Both need phantom power. An omni blends; a cardioid separates.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — facing the holes a third of the way up from the bell — then move the mic and see what changes.',
    credit: { scenarios: ['cl.place.1', 'cl.place.2', 'cl.place.3', 'cl.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different suggested starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A suggested zone is a place to begin, measured from a named part of the clarinet — not a rule. Distance, height and angle are separate things to try; clearance from the hands and the bell comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the player’s wedge — and know what a pattern cannot do, and why a studio solo and a loud stage need different choices.',
    credit: { scenarios: ['cl.ctx.1', 'cl.ctx.2', 'cl.ctx.studio', 'cl.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A cardioid rejects most behind; a supercardioid toward the rear near 125°. Real nulls are shallower than the picture, and no mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a close mic and a farther mic (or a main pair) on one clarinet can sound hollow together, and what the polarity switch does and does not change.',
    credit: { scenarios: ['cl.two.1', 'cl.two.2', 'cl.two.3', 'cl.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two mics at different distances hear the clarinet at different times: some pitches cancel in the sum. Move or rebalance first; polarity flips the sign and never removes a delay. Judge in mono, at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — where the mic looks, its distance, the pattern, the player’s movement, the mount, the filter — before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one clarinet mic in the right order, choose and justify a setup for a studio solo and a loud stage, and say what would justify a second mic.',
    credit: { scenarios: ['cl.prac.order', 'cl.prac.gain', 'cl.prac.setup1', 'cl.prac.setup2', 'cl.prac.3', 'cl.mix.1', 'cl.mix.2', 'cl.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real clarinet.' },
    takeaway: 'Clearance from the hands, the keys and the bell, the right power and level, a view of the holes AND the bell, and an accurate account of polarity versus delay pass. A brand or a bell-only aim do not — and more than one setup can pass.',
  },
};

/* THE CHECKS. Lesson lines in comments only: cl.snd.* L6 + UNSW-CL ·
 * cl.set.* L7 · cl.mic.* L29, L37 · cl.place.* L13, L25, L37 · cl.ctx.* L36 ·
 * cl.two.* L31, L34 · cl.prac.* / cl.mix.* L74-L78. */
const scenarios: MikingScenario[] = [
  firstHoleCheck('cl.snd.1', W),
  {
    id: 'cl.snd.2',
    page: 'sound',
    prompt: 'The clarinet plays its lowest note, then the same fingering with the register key. What happens?',
    options: ['It jumps up an octave, the same as on a flute', 'It stays the same note, only a little louder', 'It jumps up a twelfth — the tube’s next resonance'],
    correct: 'It jumps up a twelfth — the tube’s next resonance',
    explain: 'A cylinder closed at the reed end has resonances at 1, 3, 5 … times its lowest: the next one up is three times the pitch — an octave and a fifth, a twelfth. That is why the clarinet’s fingerings repeat a twelfth apart.',
    why: {
      'It jumps up an octave, the same as on a flute': 'A flute is open at both ends and overblows an octave. The clarinet, closed at the reed, skips the octave.',
      'It stays the same note, only a little louder': 'The register key opens a small hole that kills the lowest resonance: the tube sounds its next one.',
    },
  },
  bellOnlyCheck('cl.snd.3', W),
  hearingCheck('cl.set.1', W),
  {
    id: 'cl.set.2',
    page: 'setting',
    prompt: 'Which parts must a stand mic and its boom stay clear of around a clarinettist?',
    options: ['The music stand, so the player can still read', 'The hands, the keys and the bell as it moves', 'The audience’s view of the clarinet’s bell'],
    correct: 'The hands, the keys and the bell as it moves',
    explain: 'Clearance comes first: the fingers, the keys and the thumbs, the bell as the player breathes and phrases — and the face. Stop the player before anything moves near them.',
    why: {
      'The music stand, so the player can still read': 'Sight lines matter, but the safety question is what moves: the hands, the keys and the bell.',
      'The audience’s view of the clarinet’s bell': 'The view matters less than what the player moves.',
    },
  },
  {
    id: 'cl.set.3',
    page: 'setting',
    prompt: 'Before placing any mic on a clarinet, what do you ask for?',
    options: ['One long tuning note, played as loud as the player can', 'The lowest and highest notes, quiet and strong passages', 'Nothing yet: the starting point already says where to go'],
    correct: 'The lowest and highest notes, quiet and strong passages',
    explain: 'The place the sound leaves moves with every note, so test the actual part — the low notes, the throat notes, the top register, soft entries and the loudest accents — and watch how the player moves.',
    why: {
      'One long tuning note, played as loud as the player can': 'One note leaves from one place. The music moves the sound along the clarinet.',
      'Nothing yet: the starting point already says where to go': 'A starting point says where to begin; the player’s part says whether it works.',
    },
  },
  {
    id: 'cl.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic pointed straight into the bell tends to hear…',
    options: ['All the notes equally, so it is the safest choice', 'Only the key clicks and the breath, not the tone', 'The lowest notes strongly, the rest less'],
    correct: 'The lowest notes strongly, the rest less',
    explain: 'The lowest notes leave mainly from the bell; most others leave from open holes up the body. A bell-only view favours a few notes.',
    why: {
      'All the notes equally, so it is the safest choice': 'Most notes leave from the open holes, not the bell. A bell-only view is uneven.',
      'Only the key clicks and the breath, not the tone': 'The bell carries real tone — mostly of the lowest notes.',
    },
  },
  {
    id: 'cl.mic.1',
    page: 'microphone',
    prompt: 'In a quiet, good-sounding room, is an omni a fair first try on a solo clarinet?',
    options: ['No — an omni hears too much of the bell on its own', 'No — an omni works only more than a metre away', 'Yes — a broad pickup that lets holes and bell blend'],
    correct: 'Yes — a broad pickup that lets holes and bell blend',
    explain: 'An omni hears all round with no directional proximity effect — welcome when the room adds to the sound and nothing loud is near. As separation matters more, a wide cardioid or cardioid helps.',
    why: {
      'No — an omni hears too much of the bell on its own': 'An omni hears all round — the holes, the bell and the room together; it does not single out the bell.',
      'No — an omni works only more than a metre away': 'An omni works at any distance; up close it also has no directional proximity bass.',
    },
  },
  {
    id: 'cl.mic.2',
    page: 'microphone',
    prompt: 'A miniature on a clip near the bell — where should its capsule point?',
    options: ['Straight down into the bell’s opening', 'At the player’s mouth, to hear the reed', 'Back up the clarinet toward the keys'],
    correct: 'Back up the clarinet toward the keys',
    explain: 'Aimed back toward the keys, the capsule hears the open holes and some bell; into the bell it hears mostly the lowest notes. With a longer gooseneck, looking back toward the upper joint tends to even out the range.',
    why: {
      'Straight down into the bell’s opening': 'Into the bell, the mic favours the lowest notes and misses the open holes.',
      'At the player’s mouth, to hear the reed': 'Near the mouth it hears breath and reed edge; the sound leaves lower down.',
    },
  },
  {
    id: 'cl.mic.3',
    page: 'microphone',
    prompt: 'Your only spare input has no phantom power. Can you use the clip miniature there?',
    options: ['Yes — a clip mic takes its power from the strap', 'No — like the stand condenser, it needs phantom power', 'Yes, if its cable is short enough to keep the signal up'],
    correct: 'No — like the stand condenser, it needs phantom power',
    explain: 'Both of this page’s mics are condensers: the stand mic needs phantom power, and the miniature needs it through its adapter. Find a powered input, or use a different kind of mic.',
    why: {
      'Yes — a clip mic takes its power from the strap': 'A clip is a mount. The miniature still needs phantom power through its adapter.',
      'Yes, if its cable is short enough to keep the signal up': 'Cable length does not power a condenser.',
    },
  },
  {
    id: 'cl.place.1',
    page: 'placement',
    prompt: 'A starting point says “a third of the way up from the bell”. On a clarinet, where is that?',
    options: ['On the barrel, just below the mouthpiece', 'On the lower joint, above the bell', 'Inside the bell, a third of the way in'],
    correct: 'On the lower joint, above the bell',
    explain: 'Measure along the instrument from the bell end toward the reed: one third of the body’s length lands on the lower joint, among the lower tone holes — a place where the holes and the bell can both be heard.',
    why: {
      'On the barrel, just below the mouthpiece': 'That is nearly the whole length up from the bell, not a third of it.',
      'Inside the bell, a third of the way in': 'The third is measured along the whole instrument, not into the bell.',
    },
  },
  {
    id: 'cl.place.2',
    page: 'placement',
    prompt: 'You move the mic from 15–20 cm to about a metre in front. What tends to change?',
    options: ['Only the level drops; the tone stays the same', 'More of the room and the blend; less key detail', 'Less low end, because the bell is now farther off'],
    correct: 'More of the room and the blend; less key detail',
    explain: 'Farther away, the holes and the bell blend, the key clicks fall back, and more of the room and the neighbours arrive. Closer, a directional mic adds low end (proximity effect).',
    why: {
      'Only the level drops; the tone stays the same': 'Distance changes the balance too: more room, more blend, fewer clicks.',
      'Less low end, because the bell is now farther off': 'Moving a directional mic away tends to lose proximity bass — not because of the bell.',
    },
  },
  {
    id: 'cl.place.3',
    page: 'placement',
    prompt: 'Is a mic a few centimetres from the lower joint’s keys a good first choice?',
    options: ['Yes — the closer the mic, the clearer the tone', 'Yes, if you cut the high end to hide the clicks', 'Not usually: keys and fingers can take over'],
    correct: 'Not usually: keys and fingers can take over',
    explain: 'Very close to the mechanism, the clicks and pads can rival the notes, and one hole dominates. The suggested start keeps 15–20 cm, facing the holes, so the holes and the bell blend.',
    why: {
      'Yes — the closer the mic, the clearer the tone': 'Closer brings more of one spot and more mechanism — not a clearer whole clarinet.',
      'Yes, if you cut the high end to hide the clicks': 'EQ dulls the clarinet along with the clicks. Distance is the first fix.',
    },
  },
  {
    id: 'cl.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What must a clarinet mic, its boom and its cable stay clear of?',
    options: ['The music stand and the conductor’s sightline', 'The front of the clarinet, so it can project', 'The hands, the keys, the bell and the player’s face'],
    correct: 'The hands, the keys, the bell and the player’s face',
    explain: 'Clearance comes first: the fingers and thumbs, the keys, the bell as the player moves, and the face. Stop the player before anything is moved near them.',
    why: {
      'The music stand and the conductor’s sightline': 'Sight lines matter too, but the safety question is what moves.',
      'The front of the clarinet, so it can project': 'In front is where a stand mic usually goes. What must stay clear is what moves.',
    },
  },
  {
    id: 'cl.ctx.1',
    page: 'context',
    prompt: 'A clarinet solo over a loud band, with a wedge in front. A good first step?',
    options: ['Closer, an aimed pattern, or an approved clip mic', 'A farther mic, so the band blends with the clarinet', 'Turn the clarinet channel up above the band'],
    correct: 'Closer, an aimed pattern, or an approved clip mic',
    explain: 'On a loud stage, a closer mic with its rejection toward the wedge — or a miniature that moves with the clarinet — gives more clarinet relative to the stage. More gain raises the band in that channel too.',
    why: {
      'A farther mic, so the band blends with the clarinet': 'Farther brings in more band and monitor — the opposite of what a loud stage needs.',
      'Turn the clarinet channel up above the band': 'More gain raises everything the mic hears and brings feedback closer.',
    },
  },
  superNull('cl.ctx.2', 'context', 'wedge'),
  {
    id: 'cl.ctx.studio',
    page: 'context',
    prompt: 'A solo clarinet in a good, quiet studio: is one stand mic facing the holes a fair first choice?',
    options: ['No — a clip on the bell isolates it better there', 'Yes — then small changes of distance and angle', 'No — it needs a second mic at the reed as well'],
    correct: 'Yes — then small changes of distance and angle',
    explain: 'One stand mic facing the holes a third of the way up — or a little farther back in a good room — gives a coherent clarinet. Adjust distance, height and angle by ear.',
    why: {
      'No — a clip on the bell isolates it better there': 'A quiet studio does not need stage isolation, and a very close view can be uneven.',
      'No — it needs a second mic at the reed as well': 'A second close mic adds a delay and a combining check. One good position usually works better.',
    },
  },
  {
    id: 'cl.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Why do the clarinet’s fingerings repeat a twelfth apart?',
    options: ['Its tube is closed at the reed end, so its next resonance is ×3', 'The register key shortens the tube by exactly two thirds', 'The bell flare lifts the upper notes by a fifth'],
    correct: 'Its tube is closed at the reed end, so its next resonance is ×3',
    explain: 'A cylinder closed at one end resonates at 1, 3, 5 … times its lowest note; the register key picks the ×3 resonance — a twelfth up.',
    why: {
      'The register key shortens the tube by exactly two thirds': 'The register key opens a small vent; the tube length stays the same.',
      'The bell flare lifts the upper notes by a fifth': 'The bell shapes the lowest notes; the twelfth comes from the closed tube.',
    },
  },
  {
    id: 'cl.two.1',
    page: 'twoMic',
    prompt: 'A close clarinet spot and the main pair sound hollow together. Why?',
    options: ['The main pair inverts the clarinet on its way there, so it cancels', 'Two mics on one clarinet cancel the low notes between them', 'The sound reaches them at different times, so some pitches cancel'],
    correct: 'The sound reaches them at different times, so some pitches cancel',
    explain: 'The farther mic hears each note a little later; summed, some pitches arrive out of step and dip — a comb. Move or rebalance first, then check polarity at matched levels.',
    why: {
      'The main pair inverts the clarinet on its way there, so it cancels': 'Distance delays a sound; it does not flip its sign.',
      'Two mics on one clarinet cancel the low notes between them': 'Cancellation depends on the delay and the levels: some pitches dip, others add.',
    },
  },
  polarityDelay('cl.two.2'),
  matchedLevels('cl.two.3'),
  {
    id: 'cl.two.4',
    page: 'twoMic',
    prompt: 'In an orchestra recording with the main pair up, how do you use a clarinet spot?',
    options: ['Make it the loudest channel whenever the clarinet has the tune', 'Bring it up only for a stated balance, and check it in mono', 'Leave the main pair out whenever the clarinet plays a solo'],
    correct: 'Bring it up only for a stated balance, and check it in mono',
    explain: 'The main pair carries the ensemble image; a spot supports it. Bring it in gently, watch that the clarinet does not leap ahead of its neighbours, and check the mono sum.',
    why: {
      'Make it the loudest channel whenever the clarinet has the tune': 'A loud spot pulls the clarinet unnaturally forward of the other woodwinds.',
      'Leave the main pair out whenever the clarinet plays a solo': 'The main pair is the picture of the orchestra; the spot only supports it.',
    },
  },
  gainCheck('cl.prac.gain', W),
  {
    id: 'cl.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second clarinet mic?',
    options: ['Two channels give the mix more options to choose from later', 'The first works alone, the pair adds something, it holds in mono', 'The clarinet needs more level than one mic can give it'],
    correct: 'The first works alone, the pair adds something, it holds in mono',
    explain: 'A second mic adds a perspective — and a delay. If the pair loses body, move or rebalance it, check polarity, or leave it out.',
    why: {
      'Two channels give the mix more options to choose from later': 'More channels add spill, a cable and a combining check. A second mic should earn its place.',
      'The clarinet needs more level than one mic can give it': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'cl.mix.1',
    page: 'practice',
    prompt: 'A starting point reads “15–20 cm from the holes”. What is it measured from?',
    options: ['The bell’s rim, which is the end the sound leaves from', 'The reed, where the player’s breath goes in', 'The tone holes on the lower joint, facing them'],
    correct: 'The tone holes on the lower joint, facing them',
    explain: 'A distance belongs to the part it names: here the holes a third of the way up from the bell. The same number from the bell or the reed would put the mic somewhere else.',
    why: {
      'The bell’s rim, which is the end the sound leaves from': 'Most notes leave from the holes; this starting point names them.',
      'The reed, where the player’s breath goes in': 'The reed is at the player’s mouth — a different place, well away from the holes.',
    },
  },
  nullOnPaper('cl.mix.2', 'wedge'),
  removeDelay('cl.mix.3'),
];

const symptoms: Symptom[] = [bellBoomSymptom('cl.sym.bell', W), colourSymptom('cl.sym.colour', W), keyNoiseSymptom('cl.sym.keys', W), filterSymptom('cl.sym.filter', W), clipThreatSymptom('cl.sym.clip', W), feedbackSymptom('cl.sym.feedback', W)];

const orderTasks: OrderTask[] = [
  {
    id: 'cl.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic clarinet setup in the order you would do them.',
    steps: [
      { text: 'Ask the player for the part: lowest and highest notes, quiet and loud, how they move', early: 'Start with the player and the music.' },
      { text: 'Hear the clarinet unamplified in the room, through the whole range', early: 'Listen before choosing a mic.' },
      { text: 'Choose the mic and a stand (or an approved clip)', early: 'Choose once you know the part and the room.' },
      { text: 'With the player stopped, place it facing the holes a third of the way up, clear of the hands and the bell', early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom power on', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set input gain on the quietest AND loudest passages, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare distance and angle one change at a time, at matched levels', early: 'Compare only once the level is set safely.' },
      { text: 'Secure the stand and cable; recheck the player’s movement and the lowest note through any filter', early: 'Secure it last, then watch the player’s whole motion again.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before switching it, and follow your own equipment’s manual. Gain: headroom for the loudest accent.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'cl.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Studio, a solo clarinet, a good quiet room. One channel, phantom power available.',
    setups: [
      { id: 'a', label: 'Small condenser 15–20 cm from the holes, a third of the way up from the bell', ok: true, power: 'phantom', feedback: 'A suggested starting point that hears the holes and the bell — then small changes by ear.' },
      { id: 'b', label: 'Small condenser about 0.6–1 m in front, aimed at the middle of the clarinet', ok: true, power: 'phantom', feedback: 'A suggested starting point that blends the clarinet and the good room.' },
      { id: 'c', label: 'A mic pointed straight into the bell from a few centimetres', ok: false, power: 'phantom', feedback: 'A bell-only view favours the lowest notes and misses the holes.' },
      { id: 'd', label: 'A mic beside the mouthpiece, to hear the reed', ok: false, power: 'phantom', feedback: 'By the mouth it hears breath and reed edge, and sits in the player’s face.' },
      { id: 'e', label: 'Two clip mics, one at the bell and one on the barrel, for stereo', ok: false, power: 'phantom', feedback: 'Stereo is not needed for a small solo source, and two close views move as the player moves.' },
    ],
    reasons: [docReason('the holes or the middle of the clarinet'), clearReason('the hands, the keys, the bell and the player’s face'), POWER_REASON, { id: 'r.blend', label: 'It hears the open holes and the bell together', role: 'optional', feedback: 'A fair reason: most notes leave from the holes, the lowest from the bell.' }, BRAND_REASON('clarinet'), LOUD_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a sensible starting point from its named part, clearance from what moves, and the power the mic needs.',
  },
  {
    id: 'cl.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage: a clarinettist in a band with drums and amps, a wedge in front, moving a little in solos. Phantom power available.',
    setups: [
      { id: 'a', label: 'A miniature on a clip above the bell, aimed back up at the keys', ok: true, power: 'phantom', feedback: 'A suggested starting point that moves with the clarinet — check the clip’s fit and the cable.' },
      { id: 'b', label: 'A cardioid on a stand close in front of the holes, its rear toward the wedge', ok: true, power: 'phantom', feedback: 'A suggested starting point with the rejection aimed — mark the spot with the player.' },
      { id: 'c', label: 'Small condenser a metre in front, for a natural blend', ok: false, power: 'phantom', feedback: 'On a loud stage a metre away hears the band and the wedge more than the clarinet.' },
      { id: 'd', label: 'A clip squeezed over the ring keys of the lower joint', ok: false, power: 'phantom', feedback: 'Nothing goes on the ring keys, rods or pads: it stops the notes and risks the instrument.' },
      { id: 'e', label: 'An omni close to the bell, turned up until it clears the band', ok: false, power: 'phantom', feedback: 'An omni rejects nothing; turned up, it brings the stage and feedback with it.' },
    ],
    reasons: [docReason('the bell joint or the holes'), clearReason('the hands, the ring keys, the bell and the cable path'), POWER_REASON, { id: 'r.move', label: 'A mic on the clarinet holds its distance as the player moves', role: 'optional', feedback: 'A fair live reason for a clip mic.' }, BRAND_REASON('clarinet'), { id: 'r.loudest', label: 'Turn it up until the clarinet is louder than the band', role: 'wrong', feedback: 'More gain raises the stage in that mic too, and brings feedback closer.' }],
    explain: 'Two setups pass. What passes is the reasoning: a mount made for the clarinet or a close aimed stand mic, clearance from what moves, the power it needs — and the rejection aimed at the wedge.',
  },
];

const predictions: WindLesson['predictions'] = {
  sound: { prompt: 'Before you step through: where does most of a middle note’s sound leave the clarinet?', options: ['The bell', 'An open hole on the body', 'The mouthpiece'], after: 'Now STEP through (or PLAY ONCE), then try the notes on the next step.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the mic from 15–20 cm out to about a metre. What changes?', options: ['More room and blend', 'More key clicks', 'It depends on this room'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge is on the floor in front. Where will a supercardioid aimed back at the clarinet reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What sets the clarinet’s air column vibrating?',
    options: ['Two cane blades pressed together, as on an oboe', 'One cane reed against the mouthpiece', 'An air jet across the edge of a hole'],
    correct: 'One cane reed against the mouthpiece',
    explain: 'The clarinet is a single-reed instrument: one cane reed, held on the mouthpiece by the ligature, vibrates against it.',
    why: {
      'Two cane blades pressed together, as on an oboe': 'That is a double reed — the oboe’s and the bassoon’s.',
      'An air jet across the edge of a hole': 'That is the flute’s way: no reed at all.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'Where on the clarinet is “a third of the way up from the bell”?',
    options: ['On the lower joint, among its holes', 'On the barrel, under the mouthpiece', 'At the rim of the bell, at the very end'],
    correct: 'On the lower joint, among its holes',
    explain: 'One third of the body’s length, measured from the bell toward the reed, lands on the lower joint.',
    why: {
      'On the barrel, under the mouthpiece': 'That is nearly the whole length up, not a third.',
      'At the rim of the bell, at the very end': 'The rim is where the measurement starts.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'A middle-register note: where does most of its sound leave the clarinet?',
    options: ['From the bell, like the lowest note', 'Through the mouthpiece, back past the reed', 'Near the first open tone hole'],
    correct: 'Near the first open tone hole',
    explain: 'The air column behaves as if the tube ended just past the first open hole; only the lowest notes come mainly from the bell.',
    why: {
      'From the bell, like the lowest note': 'Only notes with every hole closed come mainly from the bell.',
      'Through the mouthpiece, back past the reed': 'The mouthpiece is closed by the reed and the player’s lips.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Why can a mic aimed only into the bell sound uneven?',
    options: ['The bell blocks the high notes coming out', 'The bell is too loud for a stand mic', 'Each note leaves from a different place'],
    correct: 'Each note leaves from a different place',
    explain: 'The bell carries mostly the lowest notes; the rest leave from open holes up the body. A bell-only view favours a few notes.',
    why: {
      'The bell blocks the high notes coming out': 'Nothing is blocked; most notes simply leave earlier, from the holes.',
      'The bell is too loud for a stand mic': 'Level is not the issue: the place each note leaves from is.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'What must a stand mic and its cable stay clear of around a clarinettist?',
    options: ['The music stand, so the music can be read', 'The hands, the keys, the bell and the face', 'The audience’s view of the instrument'],
    correct: 'The hands, the keys, the bell and the face',
    explain: 'Clearance comes first: whatever moves — the fingers, the keys, the bell as the player breathes — and the face.',
    why: {
      'The music stand, so the music can be read': 'Sight lines matter, but safety is about what moves.',
      'The audience’s view of the instrument': 'The view matters less than the player’s movement.',
    },
  },
  hearingDiag('q.6', W),
];

const floorY = SEATED.body.floorY;
const wedges: Wedge[] = [
  {
    id: 'wedge',
    label: 'the player’s floor wedge, in front, facing back at them',
    short: 'WEDGE',
    p: { x: 0, y: floorY, z: 1450 },
    lift: 150,
    faces: { x: 0, y: 0, z: -1 },
    note: 'On the floor in front, facing back at the player: below and behind a mic aimed back at the clarinet — tilting the mic matters as much as turning it.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
  },
  {
    id: 'side',
    label: 'another player’s wedge, off to the clarinettist’s right',
    short: 'SIDE WEDGE',
    p: { x: -1350, y: floorY, z: 900 },
    lift: 150,
    faces: { x: 0.8, y: 0, z: -0.6 },
    note: 'Off to one side, facing another player: well off the mic’s axis.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
  },
];

const copy: Partial<LessonCopy> = {
  variantKey: 'POSTURE',
  variantShort: { seated: 'seated', standing: 'standing' },
  sceneSubject: { seated: 'a B♭ clarinet held by a seated player', standing: 'a B♭ clarinet held by a standing player' },
  viewTag: { side: 'FRONT · FROM THE AUDIENCE', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'to player’s left', minus: 'to player’s right', label: 'ACROSS', blurb: 'Toward the player’s left or right (x). Distances are read from the part the starting point names.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The clarinet points down and out from the mouth.' },
    z: { plus: 'toward the audience', minus: 'toward the player', label: 'FRONT–BACK', blurb: 'Toward the audience or toward the player (z).' },
  },
  instrument: {
    figureBadge: 'A B♭ clarinet, its keys toward you · every part named',
    figureLabel: 'A B♭ clarinet seen from the side, keys toward you.',
    partsBadge: 'A clarinettist from the audience · tap a part to name it',
    partsLooking: { side: 'Front view · from the audience', top: 'Top view · from above' },
    partsIdle: 'The reed starts the sound; the air column inside the long wooden tube rings; the open holes and the bell let it out — the next page shows how. The player holds it out in front, the hands on the keys.',
    variantNotes: { standing: 'STANDING: the same hold — the floor and the legs farther from the mic stand’s base. Switch POSTURE to sit the player down.' },
  },
  placement: {
    workedZone: { seated: 'cl.dpa', standing: 'cl.dpa' },
    workedLine: 'This starting point also reads how far the mic is from {line}.',
    workedAim: 'Aim it at the holes on the lower joint — the lab counts it while the mic points within about {tol}° of them, so the bell is heard too. Distance, height and angle are separate things to try.',
    workedClear: 'Clear of every part — the hands and thumbs, the keys, the bell as the player moves, the player’s face and knees. Clearance comes first, before any number, and the player stops before a real mic moves.',
    blocked: {},
    reveal: 'Farther tends to bring more of the room and a better blend of holes and bell; closer, more key detail and more of one spot. Rooms vary, so “it depends on this room” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear.',
    typeNotes: {
      sdcCard: 'Ideas to try: begin facing the holes a third of the way up from the bell; then move one thing at a time — the distance, the height, the angle toward the bell — and play the low, throat and high notes each time.',
      wwMini: 'Ideas to try with a miniature: keep its strap where it is made to go, just above the bell; change only the capsule’s angle — farther up toward the upper joint for a more even range.',
    },
    note: 'Clearance comes first: stop the player before moving a real mic. A mic, clip or cable anywhere the hands, the keys or the bell can reach is in the wrong place, whatever the number says.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we suggest you begin with that kind of mic, measured from the part it names — the holes a third of the way up, the middle of the clarinet, or the top of the bell. They are starting points, not rules. Move from there and listen: there is no single right answer, and every clarinet and room is different.',
      separate: 'Distance, height and the angle toward the bell are separate variables: change one at a time, and play the low notes, the throat notes and the top register each time. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm — a mic’s acoustic centre is not the visible end of its grille, so no millimetre claim is made.',
      clearance: 'Clearance comes first. Stop the player before moving a mic; keep the mic, stand, clip and cable clear of the fingers and thumbs, the keys, the bell as it moves, and the face. The engine stops the mic and names what it would touch.',
      tendencies: 'Facing the holes tends to give a balance of holes and bell; into the bell, the lowest notes stand out; very close to the keys, the clicks; farther, more room and blend. A directional mic up close also lifts the lows (proximity effect). These are tendencies, and clarinets vary.',
    },
  },
  context: {
    variant: 'seated',
    zone: 'cl.dpa',
    typeId: 'sdcCard',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'sdcCard' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'sdcCard' },
      { id: 'hypercardioid', label: 'hypercardioid', typeId: 'sdcCard' },
    ],
    micNoun: 'A small condenser',
    shield: ['ww.lower', 'ww.lower.1', 'ww.lower.2', 'ww.lower.3', 'ww.bell', 'ww.upper'],
    azMax: 60,
    elMax: 60,
    aimBlurb: 'Swing the front up to 60° either way — it still faces the clarinet.',
    plan: { u0: -1700, u1: 1200, v0: -500, v1: 1750 },
    side: { u0: -1700, u1: 1200, v0: -400, v1: 1300 },
    target: 'wedge',
    frontIds: [],
    targetWord: 'wedge',
    looking: 'Top view · mic in front of the clarinet',
    prompt: 'The player’s wedge stays where they need it. Turn the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — while the mic still points at the clarinet.',
    activityDone: 'done — the wedge sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and often least at low frequencies. Use the null to aim, not to promise silence.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). In front of the player and aimed back at the clarinet, its rear faces the audience side — the wedge, down on the floor, sits below that line, so tilting the mic matters as much as turning it.',
    shieldNote: 'The player’s body and the clarinet can reflect stage sound into the front of a mic aimed at them — the free-field pattern cannot show that. Listen with the monitors on.',
    studioId: 'cl.ctx.studio',
    studioPrompt: 'A studio session, a solo clarinet, a good room: what is the mic’s job?',
    studioNote: 'In the studio, a mic facing the holes — or a little farther back — can carry the whole clarinet and some room. Repeated trials are practical when the player stops. Switch back to LIVE for the monitor exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not restrictions.',
      points: [
        { title: 'PERSPECTIVE', text: 'Studio: a solo may want the room and a blend of holes and bell. Live: a clarinet among drums and amps needs a closer, separated sound.' },
        { title: 'SPILL AND FEEDBACK', text: 'Studio: the room and the neighbours. Live: monitors, the PA and the band. A closer mic, the right pattern and aim help — and nothing alone prevents feedback.' },
        { title: 'MOVEMENT', text: 'Clarinettists move as they breathe and phrase. A stand mic has a working zone — mark it; a miniature on a clip keeps one distance as the player moves.' },
        { title: 'IN A SECTION', text: 'With a main pair up, a clarinet mic is a spot: bring it up only for a stated balance, and check it in mono. A section spot can sit between two players, pointing down.' },
      ],
      body: 'With a wedge in front of the player, a pattern’s rejection is a tool to aim — tilting as well as turning. Some stage sound in a clarinet mic is normal; the question is how much the music can take.',
      warn: 'No mic position alone prevents feedback: the pattern, the other open mics, the monitors, the system level and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
    },
  },
  twoMic: {
    variant: 'seated',
    A: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'cl.dpa' },
    B: { typeId: 'sdcCard', pattern: 'omni', zone: 'cl.front' },
    learn: [
      'A second mic — a room mic, or the main pair the clarinet plays into — is a choice for a reason, not a requirement for stereo: one clarinet is a small source, and two close mics can move the image as the player moves.',
      'When it goes in: hear each mic alone, then the pair in MONO at the intended levels. Move or rebalance a mic first; check both polarity states at matched levels only after that — a polarity switch cannot line up every pitch.',
    ],
    warn: 'This simplified graph treats the clarinet as one point and both mics as hearing the same sound. Real mics at different distances hear different mixes of holes, bell and room, so read the notch POSITIONS (they follow from the arrival-time difference) and treat their depths as illustrative. Judge by ear, in mono, at matched levels.',
  },
  practice: {
    gain: 'cl.prac.gain',
    second: 'cl.prac.3',
    mixed: ['cl.mix.1', 'cl.mix.2', 'cl.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: what a distance is measured from, a pattern’s null, and polarity versus delay.',
  },
  terms: {
    instrument: 'the clarinet',
    aimRef: 'its reference',
    startIntro: 'This lesson is about putting a microphone on a B♭ clarinet. First the clarinet itself: what it is, how the reed and the air column make its sound, where that sound leaves, and where the player sits. Then the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
    startNew: 'Good — NEXT takes you through the clarinet first. You can change how you started here at any time.',
    refTitle: 'MEASURED FROM',
    otherRef: 'The same number measured from another part of the clarinet — the bell, the reed, the middle — would put the mic somewhere else.',
    noAim: 'This starting point gives no aim, so the mic simply faces the clarinet. Distance, height and angle are still separate things to try.',
    clipMount: 'Mount: a clip made for this clarinet, on a strap just above the bell, with the player’s agreement',
    standMount: 'Mount: a stand placed clear of the hands, the keys, the bell’s swing and the player',
    inPath: 'clarinet in path',
    facing: 'facing the clarinet',
    observation: 'For a real clarinet, with the player’s agreement, and the player stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
  },
};

export const A08A_LESSON: WindLesson = {
  id: 'A08a',
  labId: 'winds',
  title: 'Clarinet',
  subtitle: 'The B♭ clarinet: facing the holes a third up from the bell, farther back, or a clip',
  noun: { one: 'clarinet', many: 'clarinets' },
  model: CLARINET_MODEL,
  micTypeIds: ['sdcCard', 'wwMini'],
  zones: CLARINET_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A woodwind with a single cane reed on a mouthpiece, a long, nearly cylindrical wooden tube with about twenty tone holes and a flared bell. Its keys let the fingers open and close the holes; a register key lifts every fingering a twelfth.', src: 'Y-CL-MECH' },
    { title: 'WHERE YOU MEET IT', text: 'Orchestras, wind bands, chamber groups, jazz and klezmer bands, studio sessions. This lesson covers one B♭ clarinet (the A clarinet is the same in every way that matters here): a studio solo, a loud stage and a spot in a section.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'It sings melodies and runs over a wide range — dark low notes, bright high ones, very soft entries. Ask what the music needs: a blended orchestral colour, an intimate solo, or a separated line over a band.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'About 63 cm without its mouthpiece, about 66 cm with it. Its lowest note sounds at about 147 Hz. This lab draws a clarinet about that size, held 35° out from the body — seated, or standing.', src: 'MET-CL' },
  ],
  sound: {
    stages: [
      { title: 'Breath on the reed', text: 'The player blows into the mouthpiece. The pressure in the mouth pushes the thin end of the reed toward the mouthpiece, narrowing the gap the air comes through.' },
      { title: 'The reed opens and closes', text: 'The reed swings shut and springs open again, letting the air in in puffs — and the air column inside sets the timing, so the reed keeps in step with it.' },
      { title: 'The air column rings', text: 'A pressure wave runs down the bore, reflects where the tube meets the open air — at the first open hole — and comes back: a standing wave, strongest at the reed end, quiet at the open end.' },
      { title: 'Sound leaves the clarinet', text: 'Sound leaves from the first open holes, and from the bell for the lowest notes and for high partials of every note. Which place leads changes with every note — so a mic sees a moving picture.' },
    ],
    attack: 'The start of a note: the tongue releasing the reed, the breath, a little reed edge — strongest near the mouthpiece. A mic close to the reed or the keys hears more of it, and of the key clicks.',
    body: 'The sustained tone: the air column ringing, leaving from the open holes and the bell in a pattern that changes with every note. A little distance tends to blend those outlets with the room. Both are tendencies, and clarinets vary.',
    head: { diameterMm: 0, rods: 0, label: 'the air column', strikeSrc: 'UNSW-CL' },
  },
  setting: {
    items: [
      { id: 'self', label: 'the clarinet and its player', short: 'CLARINET', note: 'Held out in front, 35° from the body, the bell near the knees when seated. Ringed in amber: the instrument this lesson mics.', prov: { kind: 'illustrative', reason: 'soprano_clarinet/GEOMETRY_PROPOSAL.md §2 posture (drawing default)' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'hands', label: 'the hands, the keys and the bell', short: 'HANDS · BELL', note: 'The fingers and thumbs work the holes and keys the whole time; the bell moves as the player breathes and phrases. No mic, stand or cable goes there.', prov: { kind: 'illustrative', reason: 'the proposal’s keep-outs' }, tag: 'KEEP CLEAR', scene: 'kit', planIds: ['self'] },
      { id: 'stand', label: 'the music stand', short: 'MUSIC STAND', note: 'In front of the player. They must see the music and the conductor: a mic stand should not block that line.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SIGHT LINE', scene: 'kit', planIds: ['stand.cl'] },
      { id: 'cl2', label: 'the second clarinet beside', short: 'CLARINET 2', note: 'In a section another clarinet sits close by; a spot between the two can hear both — pointing down at a hard floor.', prov: { kind: 'illustrative', reason: 'a typical seating' }, tag: 'SPILL · SECTION', scene: 'kit' },
      { id: 'flutes', label: 'the flutes and oboes in front', short: 'FLUTES · OBOES', note: 'The front row of the woodwinds: a clarinet mic hears them too.', prov: { kind: 'illustrative', reason: 'a typical seating' }, tag: 'SPILL', scene: 'kit', planIds: ['fl1', 'fl2', 'picc', 'ob1', 'ob2'] },
      { id: 'bassoons', label: 'the bassoons beside', short: 'BASSOONS', note: 'The other half of the back row; their bells rise above the players’ heads.', prov: { kind: 'illustrative', reason: 'a typical seating' }, tag: 'SPILL', scene: 'kit', planIds: ['bsn1', 'bsn2'] },
      { id: 'wedge', label: 'the player’s wedge (monitor)', short: 'WEDGE', note: 'On a stage, a floor monitor in front, facing back at the player — loud, and close to a clarinet mic.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'side', label: 'another player’s wedge', short: 'SIDE WEDGE', note: 'Off to one side, facing another player.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Live, the audience already hears the acoustic clarinet; the PA adds what the room needs.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage', planIds: ['audience', 'pa'] },
      { id: 'main', label: 'a main pair for the ensemble', short: 'MAIN PAIR', note: 'In a recording of a group, a main pair hears the whole ensemble; a clarinet mic is a spot that supports it.', prov: { kind: 'illustrative', reason: 'a generic main pair' }, tag: 'MAIN PAIR', scene: 'studio' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'No wedges on the floor; a good room is part of a clarinet’s sound — and a hard floor reflects it.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors on the floor feed the players, the PA faces the audience, and a band can be loud. A closer, aimed mic — or a miniature that moves with the clarinet — helps against the stage and feedback.',
    studio: 'STUDIO: no wedges, a room that may sound good, and repeated trials when the player stops. A modest distance can carry the whole clarinet and some room; in an ensemble, a main pair may carry it already.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic clarinet setup for a studio solo and for a loud stage, describe an alternative position, and explain what would justify a second mic. With a real clarinet and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'room', label: 'Room or stage', kind: 'text' },
      { id: 'posture', label: 'Player', kind: 'choice', choices: ['seated', 'standing'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser, cardioid', 'small condenser, omni', 'miniature on a clip', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, from the holes (or which part)', kind: 'text' },
      { id: 'notes', label: 'What you heard: low, throat and high notes, keys, room', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The player’s height above the floor and the 35° hold — drawing defaults — so no HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The 629 mm body is a 1924 museum clarinet used as a modern size; the mouthpiece (88 mm), barrel, joint split, bell Ø 65 and key layout are drawing defaults; the tone holes sit where the semitone rule puts them (a simplified picture).', dims: [] },
    { text: 'The hands, arms, head and the bell’s movement — illustrative keep-outs (a 20 mm margin round the clarinet).', dims: [] },
    { text: 'The section spot’s box beside the player, the clip’s 3–13 cm and the miniature’s size and reach — drawing defaults to check on the real instrument.', dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. Every clarinet, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: one player in a typical hold, tone holes where the semitone rule puts them, the air column as an ideal tube, mic patterns and the two-mic comb as textbook shapes. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped, and only with their agreement.',
  copy,
  wind: windExtra(SPEC, {
    soundSubject: 'A B♭ clarinet held by a seated player, seen from the audience, its bore drawn open',
    breath: 'The player’s breath and the tonguing are heard close to the mouthpiece; a clarinet sends little air out of its holes, so wind noise is rarely the problem a flute’s jet is.',
    keys: 'Key clicks, pads closing and the thumbs on the register key and the rings: strongest within a few centimetres of the keywork.',
    directivity: 'Measured round a player in an anechoic (echoless) room: up to about 1 kHz the sound spreads fairly evenly, strongest toward the front; by 2 kHz more of it beams out of the bell, and behind the player it is about 13 dB quieter than in front.',
    noteDefault: 9,
  }),
};
