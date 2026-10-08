/**
 * E04 DUETS AND SMALL VOCAL GROUPS — the lesson as DATA, on the ensemble
 * pages with the singers on frame V. Words from the owner's lesson
 * (docs/labs/miking/source_text/Duets-Small-Vocal-Groups-Miking-Technique.txt;
 * "L<n>" in comments only); research in docs/labs/miking/duets_small_vocal/;
 * corrections E4-* in CORRECTIONS_LOG.md — above all EXERCISE 4 REWRITTEN to
 * the no-provocation rule (L111: "raise monitors gradually … Stop at the
 * first sign of ringing" → monitors up in small steps only to the agreed
 * level; at any ring, lower that send at once and fix the geometry; never
 * raise level to find the feedback point), the 3:1 example kept mic to mic
 * (L17), the lesson's uncited claims mapped to their sources internally,
 * the school words → "you" (L4) and "Practice exercise" (L107).
 * Suggested starting points; no sources on screen; FULLY SILENT.
 */
import type { DiagnosticItem, LessonPages, MikingScenario, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import type { EnsembleLesson } from '../shared/ensemble/ensembleData.ts';
import { ensembleWords, msMono, ortfFixed } from '../shared/ensemble/ensembleItems.ts';
import { polarityDelay } from '../shared/bowed/bowedItems.ts';
import { feedbackSymptom, fewerMics, GROUP_BRAND, hearingCheck, NO_PROVOKE_REASON, noProvoke, phaseySymptom, SAFE_REASON, threeToOne, threeToOneWhy } from '../shared/ensemble/voiceGroupItems.ts';
import { SHARED_AT } from '../shared/ensemble/seatingVoices.ts';
import { E04_30_31, E04_HANDS_31, E04_IND_31, E04_MODEL, E04_PLACE, E04_SETUPS, E04_WEDGES, E04_ZONES, QU_PAIR, SIX_IN_DB } from './geometry.ts';

/** Exercise 4, rewritten (the no-provocation rule). */
export const EX4 = 'In a live-style test, bring the monitors up in small steps only to the agreed performance level while the singers perform the loudest passage. If any ring is heard, lower that send at once, then correct the placement or the monitor’s angle before going on — never raise the level to find the feedback point.';

const pages: LessonPages = {
  meet: {
    title: 'Meet it — where the sound comes from',
    goal: 'Meet the duet and the small group — two singers at one mic, two face to face, a quartet on an arc — and where each voice leaves: the mouth, forward.',
    credit: { scenarios: ['du.meet.1', 'du.meet.2', 'du.meet.3'], note: 'Answer the three checks on where the sound leaves.' },
    takeaway: 'Each voice leaves its own mouth, forward. At one mic the nearer singer is louder and, at a directional mic, bassier; matched distances make a matched duet.',
  },
  setups: {
    title: 'Starting setups',
    goal: 'See real setups drawn on the singers — one cardioid or omni with the duet on a semicircle, a handheld each, a figure-8 between two singers, two cardioids back to back, a pair at a quartet’s centre, a cardioid each at 3:1 and at a distance that misses it. Then what to settle first.',
    credit: { scenarios: ['du.set.1', 'du.31', 'du.hear'], interactive: 'setupsSeen', note: 'Look at every main setup on the drawing, and answer the three checks.' },
    takeaway: 'Decide first: one blended ensemble, or separately controllable voices. One mic or a pair keeps the blend; a mic each gives control and costs stands, bleed and phase. Separate mics go at least three times their distance to their singers apart.',
  },
  microphone: {
    title: 'Choose the microphones',
    goal: 'Choose by the pattern and the job — cardioid or omni for a shared mic, a figure-8 for two facing singers, a coincident or 17 cm pair for a group, handhelds for a live duet — never by a model name.',
    credit: { scenarios: ['du.mic.1', 'du.mic.2', 'du.ortf', 'du.ms', 'du.rec.1'], note: 'Answer the five checks (one reaches back to where the sound leaves).' },
    takeaway: 'The pattern and the room matter more than a model: a shared cardioid or omni for a blend, a figure-8 for two matched voices in a controlled room, a pair for a group in a good room, directional handhelds for a live duet.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and move the mic yourself — toward one singer, higher, back — and see what each singer’s distance does to the duet.',
    credit: { scenarios: ['du.place.1', 'du.place.2', 'du.place.3', 'du.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the singers, in two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'At one mic, distance is balance: matched for a matched duet; 15 cm closer is a clear jump. Move the singers before adding mics, and keep both on the same acoustic plane.',
  },
  context: {
    title: 'Live and studio',
    goal: 'Aim a duet singer’s handheld so the wedge sits in its rejection — and know why stereo and figure-8 setups are studio choices first.',
    credit: { scenarios: ['du.ctx.1', 'du.ctx.2', 'du.ctx.studio', 'du.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the handheld (or change its pattern) until the wedge sits in its rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Live: the fewest open mics, directional handhelds, wedges in their nulls, no ensemble mic in a monitor that can excite it — and monitors brought up only to the agreed level. Stereo pairs and figure-8s are recording choices first.',
  },
  twoMic: {
    title: 'Two singers, two mics',
    goal: 'A handheld each: see each singer reach the other mic later and quieter, what polarity changes and what it does not, and why spacing helps.',
    credit: { scenarios: ['du.two.1', 'du.two.2', 'du.two.3'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the three checks.' },
    takeaway: 'Every open mic hears both singers — its own first. Mute-check each channel, listen in stereo and in mono, and move a mic until the sum is stable and clear.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to its likely cause and the first change to try.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Distance, angle and spacing first — the semicircle, the mics to each other, the wedges to the patterns — before EQ or compression. Lower the level at the first ring.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a live duet setup in order, choose and justify a setup for a studio duet and a live one, and run a monitor check that never provokes feedback.',
    credit: { scenarios: ['du.prac.order', 'du.prac.gain', 'du.prac.setup1', 'du.prac.setup2', 'du.prac.3', 'du.nom', 'du.31why', 'du.ring'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'Decide blend or control, place the singers before adding mics, match the distances, space separate mics 3:1, set gain on the loudest passage, check mono — and bring monitors up only to the agreed level.',
  },
};

/* THE CHECKS. Lesson refs (comments only): meet L6–L11 · set L5–L7, L17 · mic L10–L14 · place L10, L47, L108 · ctx L51–L54 · two L16–L17, L109 · prac L45–L50, L107–L112. */
const scenarios: MikingScenario[] = [
  {
    id: 'du.meet.1',
    page: 'meet',
    prompt: 'Two singers at one cardioid. One stands closer. What do you hear?',
    options: ['That voice louder and bassier', 'Both voices exactly the same', 'The farther voice louder'],
    correct: 'That voice louder and bassier',
    explain: 'The nearer singer is louder by distance and, at a directional mic, gains low end from the proximity effect. Matched distances make a matched duet.',
    why: {
      'Both voices exactly the same': 'The mic hears distance: closer is louder.',
      'The farther voice louder': 'Farther is quieter, unless that singer sings much harder.',
    },
  },
  {
    id: 'du.meet.2',
    page: 'meet',
    prompt: 'Where is each duet singer’s distance measured from?',
    options: ['The lips, to the front of the mic', 'The singer’s feet, to the stand’s base', 'The chin, to the mic’s clip on the stand'],
    correct: 'The lips, to the front of the mic',
    explain: 'The voice leaves at the mouth, so every distance runs from the lips to the mic’s front.',
    why: {
      'The singer’s feet, to the stand’s base': 'The feet do not sing: the mouth is where the voice leaves.',
      'The chin, to the mic’s clip on the stand': 'Neither the chin nor the clip is where sound leaves or is heard.',
    },
  },
  {
    id: 'du.meet.3',
    page: 'meet',
    prompt: 'Two singers face each other across a figure-8. Why can it work?',
    options: ['Its front and back both hear well', 'It hears best from its two sides', 'It hears equally all round itself'],
    correct: 'Its front and back both hear well',
    explain: 'A figure-8 hears front and back equally (the back with opposite polarity) and rejects its sides: one singer in each lobe, the room at the dead sides.',
    why: {
      'It hears best from its two sides': 'The sides are its nulls — where it hears least.',
      'It hears equally all round itself': 'That is an omni; a figure-8 has two lobes and two dead sides.',
    },
  },
  {
    id: 'du.set.1',
    page: 'setups',
    prompt: 'Before choosing any mic for a duet, what do you decide?',
    options: ['One blended ensemble, or separate voices', 'Whether both voices need the same model', 'How many channels the desk has left over'],
    correct: 'One blended ensemble, or separate voices',
    explain: 'A single mic or pair keeps the blend and the room but gives little correction later; a mic each gives level, pan and edits, with more stands, bleed and phase.',
    why: {
      'Whether both voices need the same model': 'Matching models does not match voices; the goal comes first.',
      'How many channels the desk has left over': 'Channels follow the plan, not the other way round.',
    },
  },
  threeToOne('du', 'setups', 'about 30 cm (1 ft)', '90 cm (3 ft)'),
  hearingCheck('du', 'setups', 'a duet over a loud band'),
  {
    id: 'du.mic.1',
    page: 'microphone',
    prompt: 'Why is a figure-8 usually a poor live choice for a duet?',
    options: ['Its back lobe hears the stage and monitors', 'It cannot pick up two voices at once', 'It needs no power, so it is too quiet'],
    correct: 'Its back lobe hears the stage and monitors',
    explain: 'A figure-8 hears behind as strongly as in front: on a stage that is the band and the monitors. It is a studio choice, in a controlled room.',
    why: {
      'It cannot pick up two voices at once': 'Two voices, one in each lobe, is exactly what it does well.',
      'It needs no power, so it is too quiet': 'Power is not the issue; the rear lobe is.',
    },
  },
  {
    id: 'du.mic.2',
    page: 'microphone',
    prompt: 'A duet will share one mic in a good room. Which patterns suit it?',
    options: ['Cardioid or omni, the duo in a semicircle', 'A supercardioid aimed at only one of the singers', 'A figure-8 turned side-on to both'],
    correct: 'Cardioid or omni, the duo in a semicircle',
    explain: 'With the singers on a semicircle in front, a cardioid or an omni hears both; the pattern and the room matter more than the model.',
    why: {
      'A supercardioid aimed at only one of the singers': 'Aimed at one, the other sits off its narrow front.',
      'A figure-8 turned side-on to both': 'Side-on puts both singers in its dead sides.',
    },
  },
  ortfFixed('du', 'microphone'),
  msMono('du', 'microphone'),
  {
    id: 'du.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · At one mic, why does the nearer singer sound bassier?',
    options: ['The proximity effect lifts the lows up close', 'Lower voices tend to stand nearer the mic', 'The farther singer’s highs are boosted'],
    correct: 'The proximity effect lifts the lows up close',
    explain: 'Close to a directional mic the low end rises (the proximity effect) — another reason to match the distances.',
    why: {
      'Lower voices tend to stand nearer the mic': 'Where a singer stands is a choice; closeness adds the lows, whoever it is.',
      'The farther singer’s highs are boosted': 'Distance takes level away; it boosts nothing.',
    },
  },
  {
    id: 'du.place.1',
    page: 'placement',
    prompt: `One singer moves 15 cm (6 in) closer to a mic 40 cm away. About how much louder, by distance alone?`,
    options: [`About ${SIX_IN_DB.toFixed(0)} dB louder`, 'No change at all', 'About 1 dB louder'],
    correct: `About ${SIX_IN_DB.toFixed(0)} dB louder`,
    explain: `From 40 cm to 25 cm is about ${SIX_IN_DB.toFixed(1)} dB by the inverse-square law (calculated) — and a little bassier at a directional mic. Restore the arrangement and listen for the change.`,
    why: {
      'No change at all': 'Closer is louder: the distance shrank by more than a third.',
      'About 1 dB louder': 'A third less distance is far more than 1 dB.',
    },
  },
  {
    id: 'du.place.2',
    page: 'placement',
    prompt: 'At a figure-8 between two singers, one voice is too weak. A first move?',
    options: ['That singer steps a little closer', 'Turn the mic side-on to both of them', 'Boost the weak voice with EQ'],
    correct: 'That singer steps a little closer',
    explain: 'Both voices share one channel: balance them by distance. A figure-8’s proximity effect is strong, so a small step does a lot — turn or angle it only while listening to both.',
    why: {
      'Turn the mic side-on to both of them': 'Side-on puts both voices in its nulls.',
      'Boost the weak voice with EQ': 'One channel: EQ changes both voices.',
    },
  },
  {
    id: 'du.place.3',
    page: 'placement',
    prompt: 'The quartet’s pair is close and the outer singers fade. First change?',
    options: ['Move the pair back, or bring them in', 'Add a spot on each of the outer singers', 'Turn the pair toward one outer singer'],
    correct: 'Move the pair back, or bring them in',
    explain: 'Close in, the outer singers fall outside the pair’s angle. Move it back until the group fills the angle, or arrange the singers to fill it.',
    why: {
      'Add a spot on each of the outer singers': 'Spots first add bleed and phase; fix the coverage.',
      'Turn the pair toward one outer singer': 'Then the other side falls out; the pair aims at the centre.',
    },
  },
  {
    id: 'du.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · The 3:1 guideline is measured between…',
    options: ['The two mics', 'A mic and the other singer', 'The two singers'],
    correct: 'The two mics',
    explain: 'Mic to mic: at least three times each mic’s distance to its own singer — 1 ft to the singer, 3 ft between the mics.',
    why: {
      'A mic and the other singer': 'That is a different distance: 3:1 is measured between the mics.',
      'The two singers': 'The singers’ spacing limits where the mics can go; the rule is mic to mic.',
    },
  },
  {
    id: 'du.ctx.1',
    page: 'context',
    prompt: 'A live duet over a band, a wedge in front. A good first step?',
    options: ['A handheld each, rejection toward the wedge', 'A figure-8 between them for a natural blend', 'A spaced pair of omnis into the PA'],
    correct: 'A handheld each, rejection toward the wedge',
    explain: 'Directional handhelds reject more stage sound and give margin before feedback; aim each pattern’s rejection at the wedge, from the real polar plot.',
    why: {
      'A figure-8 between them for a natural blend': 'Its rear lobe hears the stage and the monitors: a studio choice.',
      'A spaced pair of omnis into the PA': 'Omnis hear the PA and the band as much as the voices.',
    },
  },
  {
    id: 'du.ctx.2',
    page: 'context',
    prompt: 'Why keep the duet’s shared mic out of their own monitor?',
    options: ['That monitor can excite the mic: feedback', 'Their monitor is meant for the band only', 'A shared mic cannot feed a monitor'],
    correct: 'That monitor can excite the mic: feedback',
    explain: 'Never send an ensemble mic into a monitor that can excite it: the monitor plays into the mic feeding it. Keep monitors low, carrying what the singers need.',
    why: {
      'Their monitor is meant for the band only': 'A monitor carries what the singers need — just not the mic it can feed back into.',
      'A shared mic cannot feed a monitor': 'It can — that is exactly the loop to avoid.',
    },
  },
  {
    id: 'du.ctx.studio',
    page: 'context',
    prompt: 'STUDIO · An intimate, unified duet in a controlled room. Where do you start?',
    options: ['One mic or a figure-8, matched distance', 'Two handhelds, each cupped close to the lips', 'A spaced pair far across the room'],
    correct: 'One mic or a figure-8, matched distance',
    explain: 'For an intimate duet, try one mic or a figure-8 in a controlled room: both singers on the same acoustic plane, small distance changes rehearsed for dynamics.',
    why: {
      'Two handhelds, each cupped close to the lips': 'Cupping muffles the voice; separate close mics also separate the duet.',
      'A spaced pair far across the room': 'Far away, the room takes over the intimate sound.',
    },
  },
  {
    id: 'du.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · A figure-8’s dead sides face…',
    options: ['The room, left and right', 'The two singers', 'The floor and the ceiling only'],
    correct: 'The room, left and right',
    explain: 'With a singer in each lobe, the figure-8’s nulls face the room at its sides — what lets it reject the room there.',
    why: {
      'The two singers': 'The singers sit in the lobes, front and back.',
      'The floor and the ceiling only': 'Its nulls are all round its sides, not just up and down.',
    },
  },
  {
    id: 'du.two.1',
    page: 'twoMic',
    prompt: 'A handheld each. Does the high singer reach the low singer’s mic?',
    options: ['Yes, later and much quieter', 'No, a cardioid hears only its own singer', 'Yes, as loud as in their own mic'],
    correct: 'Yes, later and much quieter',
    explain: 'Every open mic hears both voices. Spaced well past 3:1, the other singer’s copy is far quieter and a little late — a shallow comb in the sum.',
    why: {
      'No, a cardioid hears only its own singer': 'A cardioid favours its front; it still hears the singer beside it.',
      'Yes, as loud as in their own mic': 'Several times farther away, it arrives far quieter.',
    },
  },
  polarityDelay('du.two.2'),
  {
    id: 'du.two.3',
    page: 'twoMic',
    prompt: 'The two vocal mics sound thin together. What first?',
    options: ['Mute-check each, then move a mic', 'Flip one polarity until it sounds full', 'Add a delay set from the distance'],
    correct: 'Mute-check each, then move a mic',
    explain: 'Mute and unmute each channel, listen in stereo and mono, then move one mic until the combined sound is stable and intelligible.',
    why: {
      'Flip one polarity until it sounds full': 'A flip changes the sign, not the time difference behind the thinness.',
      'Add a delay set from the distance': 'Distance alone sets no universal delay; placement comes first.',
    },
  },
  {
    id: 'du.prac.gain',
    page: 'practice',
    prompt: 'How do you set preamp gain for a duet?',
    options: ['From the loudest singer’s loudest passage', 'From the quietest line anywhere in the song', 'From a single spoken word each'],
    correct: 'From the loudest singer’s loudest passage',
    explain: 'Set gain from the loudest singer and the loudest passage, with conservative headroom; compression is not a fix for clipping before the preamp.',
    why: {
      'From the quietest line anywhere in the song': 'The first loud chorus would then clip.',
      'From a single spoken word each': 'Speech hides the sung peaks.',
    },
  },
  {
    id: 'du.prac.3',
    page: 'practice',
    prompt: 'When does a mic each beat one shared mic for a duet?',
    options: ['When each voice needs its own control', 'Whenever a second stand is available', 'When the singers like different mics'],
    correct: 'When each voice needs its own control',
    explain: 'Individual mics earn their stands, bleed and phase paths when the arrangement needs independent level, pan, effects or editing.',
    why: {
      'Whenever a second stand is available': 'A spare stand is not a musical reason.',
      'When the singers like different mics': 'Preference matters, but the musical goal decides the approach.',
    },
  },
  fewerMics('du', 'practice'),
  threeToOneWhy('du', 'practice'),
  noProvoke('du', 'practice'),
];

const symptoms: Symptom[] = [
  {
    id: 'du.s.dom',
    observation: 'One singer dominates the shared mic',
    firstChecks: 'Unequal distance or an off-axis angle? Re-form the semicircle and match the distances before changing EQ.',
    options: ['Re-form the semicircle; match distances', 'Cut the louder singer with EQ on the bus', 'Turn the mic away from the louder one'],
    correct: 'Re-form the semicircle; match distances',
    explain: 'At one mic, distance and angle set the balance: re-form the semicircle and match the mouths’ distances before anything else.',
    why: { 'Cut the louder singer with EQ on the bus': 'One channel: EQ changes both voices.', 'Turn the mic away from the louder one': 'That puts them off axis and changes their tone; match the distances.' },
  },
  phaseySymptom('du.s.hollow', 'A thin or hollow combined sound'),
  feedbackSymptom('du.s.ring'),
  {
    id: 'du.s.pops',
    observation: 'Plosives or breath bursts',
    firstChecks: 'Is a capsule in the breath path, or a singer too close? A screen or windscreen, a small angle, and a rehearsed distance.',
    options: ['A screen, a small angle, a set distance', 'Cut the low end until the pops stop', 'Ask them to avoid the P sounds'],
    correct: 'A screen, a small angle, a set distance',
    explain: 'Get the capsule out of the direct breath and rehearse a controlled distance; a screen breaks up the air — it does not fix a poorly aimed mic.',
    why: { 'Cut the low end until the pops stop': 'A deep cut thins the voices and still lets the capsule overload.', 'Ask them to avoid the P sounds': 'The words are the song: move the mic.' },
  },
  {
    id: 'du.s.words',
    observation: 'The harmony words disappear',
    firstChecks: 'Is the group too far from the mic, at a poor angle, or masked by the room? Move the pair closer or higher, improve the arrangement.',
    options: ['Move the pair closer or higher', 'Raise the treble on the whole group', 'Add reverb so the words carry'],
    correct: 'Move the pair closer or higher',
    explain: 'Distance and the room blur the words. Bring the pair closer or higher, improve the arrangement, or add restrained spot support.',
    why: { 'Raise the treble on the whole group': 'Treble raises the room and the noise along with the words.', 'Add reverb so the words carry': 'More room is the problem, not the fix.' },
  },
  {
    id: 'du.s.detach',
    observation: 'The individual mics sound detached',
    firstChecks: 'Too close, too dry, or the distances inconsistent? Pull back carefully and keep a shared ensemble reference.',
    options: ['Pull back a little; share some room', 'Move the mics even closer still', 'Pan the two voices hard apart'],
    correct: 'Pull back a little; share some room',
    explain: 'Very close mics separate the singers. Pull back carefully, match the distances, and keep a common room or ensemble reference.',
    why: { 'Move the mics even closer still': 'Closer separates the voices more.', 'Pan the two voices hard apart': 'Wide panning makes them sound further apart still.' },
  },
  {
    id: 'du.s.comp',
    observation: 'The live level jumps after compression',
    firstChecks: 'Heavy gain reduction lifting the level between phrases? Reduce the compression; steady the mic technique first.',
    options: ['Less compression; steady technique', 'More compression to hold it still', 'Raise the gain to fill the gaps'],
    correct: 'Less compression; steady technique',
    explain: 'Heavy compression brings the stage up between phrases. Ease it off and rehearse steady distances before adding gain.',
    why: { 'More compression to hold it still': 'More compression pumps the stage up more between phrases.', 'Raise the gain to fill the gaps': 'More gain brings feedback closer.' },
  },
];

const BLEND_REASON: SetupReason = { id: 'r.blend', label: 'Both mouths at a matched distance from the mic', role: 'required', feedback: 'Say how the balance is made at one mic: matched distances.' };
const ROOM_REASON: SetupReason = { id: 'r.room', label: 'A quiet, controlled room for a figure-8 or one mic', role: 'optional', feedback: 'A fair reason: the room is part of a one-mic duet.' };
const DIST_REASON: SetupReason = { id: 'r.dist', label: 'Each handheld measured from its singer’s lips, steady and close', role: 'required', feedback: 'Say what the distance is measured from and how it stays steady.' };
const R31: SetupReason = { id: 'r.31', label: 'The mics at least three times their distance apart', role: 'optional', feedback: 'A fair reason: mic to mic, 3:1 keeps the other voice quiet in each mic.' };

const setupTasks: SetupTask[] = [
  {
    id: 'du.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A studio duet, intimate and unified, two similar voices in a controlled room. Phantom power available.',
    setups: [
      { id: 'a', label: 'One cardioid, the two on a semicircle in front, matched', ok: true, power: 'phantom', feedback: 'A coherent blend; rehearse small distance changes for dynamics.' },
      { id: 'b', label: 'A figure-8 between them, one in each lobe', ok: true, power: 'phantom', feedback: 'Efficient and matched in a controlled room; every move counts.' },
      { id: 'c', label: 'One mic, the louder singer standing closer', ok: false, power: 'phantom', feedback: 'The nearer voice dominates and turns bassy; the louder one steps back.' },
      { id: 'd', label: 'A figure-8 turned side-on to both singers', ok: false, power: 'phantom', feedback: 'Side-on puts both voices in its dead sides.' },
      { id: 'e', label: 'Two handhelds the singers cup closely', ok: false, power: 'none', feedback: 'Cupping muffles the voices; nothing intimate about it.' },
    ],
    reasons: [BLEND_REASON, ROOM_REASON, SAFE_REASON, GROUP_BRAND],
    explain: 'Two setups pass. What passes is the reasoning: matched distances, a room that suits one mic, and the stage kept safe.',
  },
  {
    id: 'du.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A live duet beside a band; a wedge in front of the singers; both voices need their own level.',
    setups: [
      { id: 'a', label: 'A handheld each, within 10 cm, the wedge behind them', ok: true, power: 'none', feedback: 'Control and margin; check the wedge against each pattern.' },
      { id: 'b', label: 'Supercardioid handhelds, the wedge a little to one side', ok: true, power: 'none', feedback: 'Fair beside a loud band, with the wedge near the nulls.' },
      { id: 'c', label: 'A figure-8 between them on the stage', ok: false, power: 'phantom', feedback: 'Its back lobe hears the band and the wedge: a studio choice.' },
      { id: 'd', label: 'One handheld passed between them, live', ok: false, power: 'none', feedback: 'A live mic passed around is handling noise and a risk.' },
      { id: 'e', label: 'Monitors up until it rings, then down a bit', ok: false, power: 'none', feedback: 'Never provoke feedback: up only to the agreed level.' },
    ],
    reasons: [DIST_REASON, SAFE_REASON, R31, NO_PROVOKE_REASON, GROUP_BRAND],
    explain: 'Two setups pass. What passes is the reasoning: close handhelds measured from the lips, the wedge in the rejection, the mics well apart — and no provoked feedback.',
  },
];

const predictions: EnsembleLesson['predictions'] = {
  microphone: { prompt: 'Before you look: which pattern hears its front and back equally?', options: ['Figure-8', 'Cardioid', 'Omni'], after: 'Now sweep SOURCE ANGLE round the pattern and watch PICKUP.' },
  placement: { prompt: 'Predict: the shared mic moves 10 cm toward one singer. What changes most?', options: ['That singer gets louder', 'Nothing: the other balances it', 'Both get louder equally'], after: 'Watch NEAR / FAR and NEAREST: one singer’s distance is that singer’s level.' },
  context: { prompt: 'The wedge sits on the floor in front of the duet. Where will a supercardioid aimed at a mouth reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'A handheld each. If you flip B’s polarity, what happens to Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE to the other singer.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'du.q.1',
    covers: 'meet',
    prompt: 'Two singers share one mic. How do you make them even?',
    options: ['Match their mouths’ distances', 'Turn the mic toward the quieter one', 'Use a brighter mic for the lower voice'],
    correct: 'Match their mouths’ distances',
    explain: 'At one mic the nearer singer dominates: match the distances, then let them balance by small moves.',
    why: { 'Turn the mic toward the quieter one': 'That puts the other off axis; distance does the balancing.', 'Use a brighter mic for the lower voice': 'One shared mic: the distance, not a model, balances them.' },
  },
  {
    id: 'du.q.2',
    covers: 'meet',
    prompt: 'Where does a figure-8 hear least?',
    options: ['At its two sides', 'Straight in front', 'Straight behind'],
    correct: 'At its two sides',
    explain: 'A figure-8 hears front and back and rejects its sides — where the room goes when two singers face each other across it.',
    why: { 'Straight in front': 'In front is one of its two lobes.', 'Straight behind': 'Behind is its other lobe, as strong as the front.' },
  },
  {
    id: 'du.q.3',
    covers: 'setups',
    prompt: 'Each singer is 1 ft from their own mic. As a start, how far apart go the mics?',
    options: ['At least 3 ft from each other', 'At least 3 ft from the other singer', 'About 1 ft from each other'],
    correct: 'At least 3 ft from each other',
    explain: 'The 3:1 guideline is mic to mic — 1 ft from the singer, 3 ft between the mics — then listen and adjust.',
    why: { 'At least 3 ft from the other singer': 'It is measured between the mics, not from a mic to the other singer.', 'About 1 ft from each other': 'At 1:1 the other voice arrives almost as loud: a deep comb.' },
  },
  {
    id: 'du.q.4',
    covers: 'setups',
    prompt: 'Which approach keeps a duet’s blend and room, with little to fix later?',
    options: ['One mic or a stereo pair', 'A close mic on each singer', 'A spot plus a mic each'],
    correct: 'One mic or a stereo pair',
    explain: 'A single mic or pair preserves the interaction, blend and room — with limited correction afterwards.',
    why: { 'A close mic on each singer': 'Separate mics give control at the cost of blend, bleed and phase.', 'A spot plus a mic each': 'More mics give more control, not more blend.' },
  },
  {
    id: 'du.q.5',
    covers: 'setups',
    critical: true,
    prompt: 'You check the monitors for a live duet. How far do you raise them?',
    options: ['Only to the agreed level, down at any ring', 'Until it starts to ring, then back a little', 'As loud as the singers ask for'],
    correct: 'Only to the agreed level, down at any ring',
    explain: EX4,
    why: { 'Until it starts to ring, then back a little': 'Never provoke feedback: it risks the singers’ hearing and the speakers.', 'As loud as the singers ask for': 'Agree a level that lets them hear — and keep it there; loud monitors bring feedback closer.' },
  },
  {
    id: 'du.q.6',
    covers: 'setups',
    critical: true,
    prompt: 'The duet moves while singing. What must stands and cables keep clear of?',
    options: ['Their feet, faces and moves', 'The audience’s view of them', 'The lighting on the stage'],
    correct: 'Their feet, faces and moves',
    explain: 'Stable stands, secure cable paths, clear movement areas — and nobody pointing a handheld at a monitor or covering the grille.',
    why: { 'The audience’s view of them': 'Sight lines matter, but safety is about the singers’ bodies.', 'The lighting on the stage': 'Lighting is not the safety question; the singers’ movement is.' },
  },
];

export const E04_LESSON: EnsembleLesson = {
  id: 'E04',
  labId: 'ensembles',
  title: 'Duets and Small Vocal Groups',
  subtitle: 'One mic with the singers matched, a figure-8 between two, a pair for a group — or a mic each, 3:1 apart',
  noun: { one: 'duet', many: 'duets' },
  model: E04_MODEL,
  micTypeIds: ['grpLdc', 'vocDynCard', 'vocDynSuper', 'arrCard', 'arrOmni', 'arrFig8'],
  zones: E04_ZONES,
  setupPairs: [
    { label: 'A handheld each', A: { zone: 'du.hand', typeId: 'vocDynCard', pattern: 'cardioid' }, B: { zone: 'du.hand2', typeId: 'vocDynCard', pattern: 'cardioid' }, variants: ['shared'], line: 'Each voice on its own mic, far past 3:1; check the sum in mono.' },
    { label: 'A cardioid each', A: { zone: 'du.ind', typeId: 'arrCard', pattern: 'cardioid' }, B: { zone: 'du.ind2', typeId: 'arrCard', pattern: 'cardioid' }, variants: ['quartet'], line: 'Two of the quartet on their own mics, 3:1 apart; mute-check and listen in mono.' },
  ],
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    {
      id: 'du.prac.order',
      page: 'practice',
      prompt: 'A live duet, in order:',
      steps: [
        { text: 'Hear the loudest, softest, unison and harmony passages', early: 'Start with the singers and the song.' },
        { text: 'Decide: one blended sound, or a voice each', early: 'Choose the goal once you have heard them.' },
        { text: 'Set the singers and stable stands; secure the cables', early: 'Place the singers and make the stage safe before the mics.' },
        { text: 'Place the mics: matched distances, 3:1 apart', early: 'Place the mics once the singers are set.' },
        { text: 'Set gain from the loudest singer’s loudest passage', early: 'Gain comes once the mics are placed.' },
        { text: 'Bring monitors up only to the agreed level', early: 'Monitors last — and down at once at any ring.' },
      ],
      explain: `Hear them, choose the goal, set the singers and a safe stage, place the mics matched and 3:1 apart, set gain from the loudest passage — then the monitors. ${EX4}`,
    },
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Duets, trios, quartets and other small vocal groups singing together at the same time.', src: 'LESSON-DUET' },
    { title: 'THE CHOICE', text: 'One blended ensemble, or separately controllable voices: one mic or a pair keeps the blend; a mic each gives control and costs bleed and phase.', src: 'LESSON-DUET' },
    { title: 'THE SHAPES', text: 'Two singers on a semicircle in front of one mic; two face to face across a figure-8; a quartet on a shallow arc in front of a pair.', src: 'AKG-C414' },
    { title: 'THE ROOM AND THE MOVES', text: 'The arrangement, the room, how the singers move and the monitoring are part of the miking — not afterthoughts.', src: 'LESSON-DUET' },
  ],
  sound: {
    stages: [
      { title: 'Each mouth, forward', text: 'Each voice leaves its singer’s mouth, forward and round the head — every distance here is read from the lips.' },
      { title: 'Distance is balance', text: 'At one mic the nearer singer is louder and, at a directional mic, bassier. Matched distances make a matched duet.' },
      { title: 'Every mic hears both', text: 'With a mic each, every mic hears both singers — its own first, the other later and quieter. Spacing keeps that copy quiet.' },
    ],
    attack: 'Plosives and S sounds reach a close mic sharply; a capsule in a singer’s breath stream pops. A small angle, a screen or a rehearsed distance keeps them in line.',
    body: 'The two voices’ vowels, blended by the singers. One mic or a pair hears the blend they make; separate mics hear each voice and need matching. Tendencies — voices and rooms vary.',
    head: { diameterMm: 0, rods: 0, label: 'the mouths', strikeSrc: 'LESSON-DUET' },
  },
  setting: {
    items: [
      { id: 'singers', label: 'the singers’ feet, faces and moves', short: 'SINGERS', note: 'Stable stands, secure cable paths and clear movement areas; nobody covering a grille, pointing a handheld at a monitor or passing a live mic.', prov: { kind: 'sourced', src: 'LESSON-DUET', quote: 'Do not allow singers to cover the grille, point a handheld capsule toward a monitor, or share a microphone by passing it while the channel is live (L54)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'other', label: 'the other singer', short: 'THE OTHER VOICE', note: 'Each open mic hears the other singer too — later and quieter. Keep separate mics at least three times their distance to their singers apart, and check mono.', prov: { kind: 'sourced', src: 'S-LIVE', quote: 'if two microphones are each placed one foot from their sound sources, the distance between the microphones should be at least three feet' }, tag: 'SPILL', scene: 'all' },
      { id: 'wedge', label: 'the wedges', short: 'WEDGES', note: 'Out of each mic’s most sensitive direction: a cardioid tolerates a wedge straight in front of the singer, a supercardioid a little to one side — from the real polar plot.', prov: { kind: 'sourced', src: 'S-VOC-TIPS', quote: 'monitor directly in front of the vocalist (cardioid); slightly to one side (hypercardioid)' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'band', label: 'the band and the PA', short: 'BAND · PA', note: 'The fewest open mics that give the clarity needed; directional handhelds reject more of the band.', prov: { kind: 'sourced', src: 'LESSON-DUET', quote: 'begin with the minimum number of open microphones that achieves the required clarity (L52)' }, tag: 'SPILL', scene: 'stage' },
      { id: 'phones', label: 'the headphones', short: 'HEADPHONES', note: 'Each singer’s mix low enough that the mic does not capture the headphone spill.', prov: { kind: 'sourced', src: 'LESSON-DUET', quote: 'Keep each singer’s monitor level low enough that the microphone does not capture loud headphone spill (L46)' }, tag: 'SPILL', scene: 'studio' },
      { id: 'room', label: 'the room', short: 'ROOM', note: 'One mic, a figure-8 or a pair hears the room as part of the duet: a controlled, flattering room.', prov: { kind: 'sourced', src: 'LESSON-DUET', quote: 'when the room is suitable and a coherent blend is wanted (L10)' }, tag: 'PART OF THE SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: the fewest open mics — directional handhelds for a moving or loud duet, the wedges where each pattern rejects most, no ensemble mic in a monitor that can excite it — and monitors brought up only to the agreed level, never to find the feedback point.',
    studio: 'A STUDIO: place the singers first, then one mic, a figure-8 or a pair in a controlled room; a mic each with screens and matched distances when each voice needs its own control.',
  },
  diagnostic,
  practice: {
    task: `Set up a duet at one shared cardioid on a semicircle and match the distances; move one singer 15 cm (6 in) closer and back, and name the change (about ${SIX_IN_DB.toFixed(0)} dB by distance alone). Capture the same passage on two directional mics, mute-check each, listen in stereo and mono. ${EX4} With the singers’ agreement, log what you tried below.`,
    fields: [
      { id: 'goal', label: 'The goal: one blend, or separate voices', kind: 'choice', choices: ['one blend', 'separate voices'] },
      { id: 'way', label: 'Approach', kind: 'choice', choices: ['one mic', 'a figure-8', 'a stereo pair', 'a mic each'] },
      { id: 'dist', label: 'Distances from the lips, and the mics’ spacing (3:1?)', kind: 'text' },
      { id: 'mon', label: 'Monitors: where, and the agreed level', kind: 'text' },
      { id: 'notes', label: 'What you heard: balance, blend, mono (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The semicircle’s radius (40 cm), the figure-8 duet’s 30 cm each side and the quartet’s 75 cm spacing are drawing defaults (no source gives them).', dims: [] },
    { text: `The duet’s handhelds are drawn about ${Math.round(E04_HANDS_31.rA / 10)} cm from the lips (within 10 cm), ${(E04_HANDS_31.d / 100).toFixed(0)} cm apart. The quartet’s cardioids at 22 cm are ≈ ${E04_IND_31.ratio.toFixed(1)}:1 apart; at 30 cm only ≈ ${E04_30_31.ratio.toFixed(1)}:1.`, dims: [] },
    { text: 'The quartet’s pair is drawn about 0.95 m in front and 0.25 m above the mouths; from about 0.9 m the group fills a 17 cm pair’s 95° angle (calculated from the drawing).', dims: [] },
    { text: 'The singers are the shared adult figure (lips 1550 mm above the floor); the wedge 0.7 m in front of the duet is a drawing default.', dims: [] },
  ],
  live: { wedges: E04_WEDGES },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Decide first: one blended ensemble or separately controllable voices; then place the singers before adding mics. Every duet, group and room is different: rehearse, experiment, compare at matched level, and trust your ears. The lab is silent and draws a simplified picture: typical standing singers, ideal patterns, straight paths, distances measured from the lips. Move a real mic near someone’s face only with their agreement; never provoke feedback.',
  copy: { words: { ...ensembleWords('duet'), player: 'singers', reference: 'LIPS', inside: 'among the singers', outside: 'clear of the singers', axis: 'the mouth’s axis', facing: 'facing the singers', shield: 'singers in path' } },
  ensemble: {
    seatings: { shared: 'duo.shared', fig8: 'duo.fig8', quartet: 'vocal.quartet' },
    setups: E04_SETUPS,
    placeZones: E04_PLACE,
    worked: { shared: 'one', fig8: 'fig8', quartet: 'xy' },
    meet: {
      figureTitle: 'A DUET',
      figureBadge: 'From above · a typical layout, not particular singers',
      sectionsNote: 'Two singers on a semicircle in front of one mic. Switch SEATING for two face to face, or an a cappella quartet. Tap a singer.',
      soundNote: 'The arcs show WHERE each voice leaves — the mouth, forward — never how loud. At one mic, each singer’s distance from it is their level.',
      mainAt: SHARED_AT['duo.shared'],
      mainAtBy: { shared: SHARED_AT['duo.shared'], fig8: SHARED_AT['duo.fig8'], quartet: QU_PAIR },
      mainRig: { id: 'one', face: 0, tilt: 0, label: 'shared mic' },
    },
    before: [
      { title: 'BLEND OR CONTROL', text: 'Should the voices behave as one ensemble or as independent sources? One mic or a pair keeps interaction, blend and room; a mic each gives level, pan and edits.' },
      { title: 'HEAR THE REAL MUSIC', text: 'The loudest and softest passages, unison and harmony, words with strong plosives or S sounds — before final placement.' },
      { title: 'PLACE THE SINGERS FIRST', text: 'In the performance arrangement: place the main mic or pair, then move the singers before adding mics. Both on the same acoustic plane for an intimate duet.' },
    ],
    safety: 'Stable stands, secure cable paths, clear movement areas. Nobody covers a grille, points a handheld at a monitor or passes a live mic. Hearing protection for high-level checks. Monitors up in small steps only to the agreed level — down at once at any ring; never provoke feedback.',
    workedWords: {
      begin: 'After our research, this is where we recommend you begin with a duet in a good room: one mic at their mouth height, the two singers on a semicircle in front, each mouth the same distance away — a place to start and rehearse, not a rule.',
      clearance: 'The stand’s base clear of both singers’ feet, its boom running away from them; the cable dressed flat, out of their moves.',
      height: 'At the singers’ mouth height, so both mouths meet its front at the same distance; a little higher, angled down, keeps it out of the breath. A pair for a group sits a little above the mouths.',
      forward: 'In the middle, each mouth about the same distance away — 40 cm in this drawing; nearer one singer, that voice gets louder and bassier. 15 cm (6 in) closer is a clear jump.',
      aim: 'Its front between the two singers: a cardioid hears the semicircle in front, an omni all round, a figure-8 its front and back. Turn or angle it only while listening to both.',
    },
    learnZones: [
      'What you just did, in words. After our research, the blue zones are where we recommend you begin — for one shared mic, in the middle at the mouths’ height or a little higher; for a figure-8, halfway between the mouths; for a quartet’s pair, 0.6–1.8 m in front. Places to start and rehearse, not a best place.',
      'At one mic, every centimetre toward a singer is level for that singer — the NEAR / FAR readout is the balance the mic hears. Match the distances first.',
      'Move the singers before adding mics; change one thing at a time and compare at matched level.',
    ],
  },
};
