/**
 * B05 LAVALIER, HEADSET AND CONCEALED PICKUP — the lesson's pages as DATA
 * (blueprint §7). The words come from the owner's lesson (docs/labs/miking/
 * source_text/B05-Lavalier-Headset-and-Concealed-Pickup-Miking-Technique.txt,
 * cited "L<n>" in COMMENTS only) with the fixes logged in docs/labs/miking/
 * CORRECTIONS_LOG.md ("L7G2") applied — among them the re-cited lav distance
 * (B05-1, L23: the 5–8 in figure belongs to the worship-speaker article; on
 * screen only the union band, no source), the institutional wording (B-INST:
 * L2, L47, L48) and no links to unbuilt lessons (B-XLINK: L93's B11).
 *
 * One presenter with the SET-UP as its variant (WHERE: STUDIO / LIVE), on
 * the voice family's standing figure and the body-worn family
 * (shared/broadcast/bodyWorn.ts). Safety exact, in plain words: consent,
 * wardrobe, skin-safe adhesive only on skin, no bodypack lav into 48 V
 * phantom except through its own adapter, the wearer can remove it, never
 * provoke feedback (L39, aligned: "lower at once").
 * OWNER RULING 2026-10-04 — learner-facing presentation: suggested starting
 * points, never dogma; no source, brand or model in learner text; no badges.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, LOUD_REASON, clearReason, docReason, hearingCheck, hearingDiag, hollowSymptom, polarityDelay, removeDelay, type Words } from '../shared/bowed/bowedItems.ts';
import { B05_MODEL, FLOOR, PA_C } from './geometry.ts';
import { B05_ZONES } from './model.ts';
import { B05_COPY } from './copy.ts';

const W: Words = { noun: 'presenter', player: 'presenter', moving: 'the head, the hands and the clothes' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the presenter',
    goal: 'Get to know a presenter who wears the mic — where the voice leaves, the chest a lav clips to, the clothes over it, the pack on the belt, and the camera or the lectern around them — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The voice leaves through the mouth; a lav sits on the chest below it, a headset beside it. The clothes, the cable and the head’s turns decide what else a body mic hears.',
  },
  sound: {
    title: 'Where the voice comes from',
    goal: 'See where speech leaves the presenter, what a head turn does to a mic on the chest and to one on the head, how the cable’s loops take a tug, and where the breath goes.',
    credit: { scenarios: ['b5.snd.1', 'b5.snd.2', 'b5.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'A chest mic stays put while the mouth turns away; a headset turns with it. Loops at the clip and lower down keep a tug off the capsule. Beside the corner of the mouth, the puffs of breath go past. Tendencies, and people vary.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Know where each mic goes — the PA, the stream, the recorder, the earpiece — and what to settle before any mic goes on a person: their agreement, the clothes, the skin, the right adapter, and a live check without feedback.',
    credit: { scenarios: ['b5.set.1', 'b5.set.2', 'b5.set.3', 'b5.set.4'], note: 'Answer the four checks.' },
    takeaway: 'Ask first, let wardrobe approve, use only skin-safe adhesive on skin, never a bodypack lav straight into phantom power, mute a second mic on the same voice, and bring live mics up to their working level only.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a body mic by its properties — where it is worn, its pattern, its power and its fit — and by the program: a quiet recording or a loud room with a PA.',
    credit: { scenarios: ['b5.mic.1', 'b5.mic.2', 'b5.mic.3', 'b5.mic.4', 'b5.rec.1'], note: 'Answer the five checks (one reaches back to the presenter).' },
    takeaway: 'An omni lav is forgiving and discreet; a directional lav rejects more only when it is aimed well; a headset keeps one distance as the head moves — the closest to the mouth for a loud room. Choose for the program, not for a brand.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — a lav on the sternum in the studio, a headset by the corner of the mouth live — then move the mic and see what changes.',
    credit: { scenarios: ['b5.place.1', 'b5.place.2', 'b5.place.3', 'b5.rec.2'], note: 'Rest the mic in two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin, measured from the lips — not a rule. The place on the body, the distance and the angle off the mouth are separate controls; comfort, the clothes and the cable come first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim a directional headset so its rejection faces the PA — and know why a quiet recording and a loud room with a PA call for different body mics.',
    credit: { scenarios: ['b5.ctx.1', 'b5.ctx.2', 'b5.ctx.studio', 'b5.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the headset until the PA sits in its rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'In a quiet studio, a clean lav that fits the picture; with a PA, a capsule close to the mouth, the fewest open mics, and a rejection aimed at the loudspeaker. A headset is not a license to raise the PA.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a headset and a lectern mic open on the same voice can sound hollow, how the arrival-time difference places comb notches, and why one of them is muted.',
    credit: { scenarios: ['b5.two.1', 'b5.two.2', 'b5.two.3', 'b5.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'One voice into two open mics arrives twice: the sum cancels some pitches. Mute the one not in use; keep a backup on its own track; polarity flips the sign and never removes a delay.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — the place on the body, the fabric, the cable, the breath, the open mics, the radio path — before reaching for EQ or noise reduction.',
  },
  practice: {
    title: 'Practice',
    goal: 'Fit a body mic in the right order, choose and justify a setup for a studio interview and for a live talk, and say what would justify a second mic.',
    credit: { scenarios: ['b5.prac.order', 'b5.prac.gain', 'b5.prac.setup1', 'b5.prac.setup2', 'b5.prac.3', 'b5.mix.1', 'b5.mix.2', 'b5.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The placement sheet is optional — it needs a real, agreeing presenter.' },
    takeaway: 'Consent, a centred place measured from the lips, loops that take the tug, the right adapter, one open mic per voice and a tested fallback pass. A brand or a “hotter” signal do not — and more than one setup can pass.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only: b5.snd.* L5, L24–L25, L31–L32 ·
 * b5.set.* L28, L35, L33 · b5.mic.* L5–L13 · b5.place.* L23–L27 · b5.ctx.*
 * L37–L39 · b5.two.* L33, L38 · b5.prac.* / b5.mix.* L41–L47.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'b5.snd.1',
    page: 'sound',
    prompt: 'The presenter turns to a guest. What happens at a lav on the chest?',
    options: ['The mouth moves off it; it stays put', 'It turns with the head and keeps aim', 'It comes nearer to the turned mouth'],
    correct: 'The mouth moves off it; it stays put',
    explain: 'A lav is fixed to the clothes on the chest. The head turns about its centre, so the mouth swings away from the lav’s line — a little farther and well off the mouth’s axis.',
    why: {
      'It turns with the head and keeps aim': 'Only a headset turns with the head. A lav moves with the chest.',
      'It comes nearer to the turned mouth': 'The mouth swings sideways, away from the middle of the chest.',
    },
  },
  {
    id: 'b5.snd.2',
    page: 'sound',
    prompt: 'What does a small loop of cable just under the lav’s clip do?',
    options: ['Gives spare cable so a tug misses the capsule', 'Hides the cable from view on a close camera shot', 'Stops radio noise reaching the capsule'],
    correct: 'Gives spare cable so a tug misses the capsule',
    explain: 'When the wearer sits, turns or gestures, the path from the clip to the pack grows. A loop of spare cable gives first — and a second loop taped lower down stops the pull before the clip.',
    why: {
      'Hides the cable from view on a close camera shot': 'The loop is about strain, not looks — the cable is routed out of sight anyway.',
      'Stops radio noise reaching the capsule': 'A loop does nothing for radio interference; it takes the strain.',
    },
  },
  {
    id: 'b5.snd.3',
    page: 'sound',
    prompt: 'Why does a headset’s capsule sit beside the corner of the mouth?',
    options: ['Out of the breath, at one steady distance', 'To be as loud as possible, in the breath', 'Because it hears only from the side, not the front'],
    correct: 'Out of the breath, at one steady distance',
    explain: 'P and B push a puff straight out of the lips. Beside the corner of the mouth the capsule is out of that puff and turns with the head, so its distance holds.',
    why: {
      'To be as loud as possible, in the breath': 'In the breath it hears pops and blasts. Level comes from closeness and gain.',
      'Because it hears only from the side, not the front': 'Most headsets are omni or cardioid; the place is about breath and steadiness.',
    },
  },
  hearingCheck('b5.set.1', W),
  {
    id: 'b5.set.2',
    page: 'setting',
    prompt: 'The lav needs to sit on skin under a light top. What do you use?',
    options: ['An adhesive made for skin, after asking', 'Gaffer tape, since it holds best through a long day', 'Whatever tape the camera kit has'],
    correct: 'An adhesive made for skin, after asking',
    explain: 'Ask first, and ask about sensitivities. On skin, use only an adhesive made for skin; tape made for fabric or cameras is not skin-safe. The wearer can take it off at any time.',
    why: {
      'Gaffer tape, since it holds best through a long day': 'Tape made for fabric and gear is not made for skin — and holding hard is not the point.',
      'Whatever tape the camera kit has': 'Camera tape is not skin-safe. Use a product made for skin, with the wearer’s agreement.',
    },
  },
  {
    id: 'b5.set.3',
    page: 'setting',
    prompt: 'A bodypack lav’s plug fits a 48 V phantom input. May you plug it in?',
    options: ['Only through its own specified adapter', 'Straight in — a plug that fits is wired right', 'Straight in, once the phantom is set to 24 V'],
    correct: 'Only through its own specified adapter',
    explain: 'A miniature mic needs the right bias, wiring and level. Never plug a bodypack lav straight into a phantom-powered input — only through the adapter or power module made for it.',
    why: {
      'Straight in — a plug that fits is wired right': 'The same plug shape can carry different wiring and bias. Check the model’s adapter.',
      'Straight in, once the phantom is set to 24 V': 'Lowering the phantom voltage is not the answer. Use its own adapter or module.',
    },
  },
  {
    id: 'b5.set.4',
    page: 'setting',
    prompt: 'The presenter’s headset is live; they still stand at the lectern. The lectern mic?',
    options: ['Muted, so one voice has one open mic', 'Open as well, for a fuller and warmer voice', 'Up a little, to back up the headset'],
    correct: 'Muted, so one voice has one open mic',
    explain: 'Two open mics on one voice hear it at two times: the sum combs, and the PA has another mic to feed back through. Agree who mutes which.',
    why: {
      'Open as well, for a fuller and warmer voice': 'Two copies of one voice sound hollower, not fuller.',
      'Up a little, to back up the headset': 'A backup is a tested fallback you switch to — not a second open mic in the mix.',
    },
  },
  {
    id: 'b5.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A lav clipped to a lapel, off the middle. What changes?',
    options: ['A turn one way sounds unlike the other', 'Nothing — one place on the chest is like another', 'It turns with the head, as a headset does'],
    correct: 'A turn one way sounds unlike the other',
    explain: 'Off the middle, turning toward the lapel keeps the mouth nearer; turning away takes it farther. A centred lav reads both turns alike.',
    why: {
      'Nothing — one place on the chest is like another': 'Distance and angle to the mouth change with the place, and with each turn.',
      'It turns with the head, as a headset does': 'A lapel is part of the jacket: it moves with the chest, not the head.',
    },
  },
  {
    id: 'b5.mic.1',
    page: 'microphone',
    prompt: 'A loud room with a PA. Which body mic gives the voice the most margin?',
    options: ['A headset by the corner of the mouth', 'An omni lav clipped low on the chest', 'A lav hidden under two layers of the shirt'],
    correct: 'A headset by the corner of the mouth',
    explain: 'The closer the capsule is to the mouth, the more voice it hears against the PA and the room. A headset is closest — and still not a license to raise the PA.',
    why: {
      'An omni lav clipped low on the chest': 'Lower on the chest is farther from the mouth: more PA and room against the voice.',
      'A lav hidden under two layers of the shirt': 'Cloth dulls and rubs; it does not bring the capsule nearer.',
    },
  },
  {
    id: 'b5.mic.2',
    page: 'microphone',
    prompt: 'When does a directional lav help?',
    options: ['When it is aimed at the mouth and stays so', 'When the wearer turns their head often, both ways', 'When it is hidden under thick cloth'],
    correct: 'When it is aimed at the mouth and stays so',
    explain: 'A directional lav rejects more of the room only in a useful geometry — aimed at the mouth. Turns take the voice off its axis faster than with an omni.',
    why: {
      'When the wearer turns their head often, both ways': 'Turns take the voice off its axis: an omni forgives that better.',
      'When it is hidden under thick cloth': 'Cloth dulls any capsule; a pattern does not fix it.',
    },
  },
  {
    id: 'b5.mic.3',
    page: 'microphone',
    prompt: 'Why does an omni headset not get boomy as it comes close?',
    options: ['An omni has no proximity bass lift', 'Its thin boom soaks up the low end', 'It is too small to pick up the bass at all'],
    correct: 'An omni has no proximity bass lift',
    explain: 'The proximity effect belongs to directional mics. An omni close to the mouth stays even in the low end; a cardioid headset gains bass as it comes closer.',
    why: {
      'Its thin boom soaks up the low end': 'The thin boom holds the capsule; it does not filter it.',
      'It is too small to pick up the bass at all': 'Small capsules hear the voice’s lows well. The pattern decides the proximity effect.',
    },
  },
  {
    id: 'b5.mic.4',
    page: 'microphone',
    prompt: 'A cap on a hidden lav makes it brighter. Does that fix fabric rubbing?',
    options: ['No — move it or change the mount', 'Yes — brighter covers the rubbing', 'Yes, as long as the cap fits snugly'],
    correct: 'No — move it or change the mount',
    explain: 'A model’s own bright cap can make up for some of the cloth’s dulling — for that model only. It does nothing for a capsule that rubs: fix the place and the mount.',
    why: {
      'Yes — brighter covers the rubbing': 'A brighter tone makes rubbing more obvious, if anything.',
      'Yes, as long as the cap fits snugly': 'A cap changes the tone, not the movement of cloth on the capsule.',
    },
  },
  {
    id: 'b5.place.1',
    page: 'placement',
    prompt: 'A starting point says “12–25 cm”. What is it measured from?',
    options: ['The lips, to the capsule’s front', 'The chin, to the clip on the shirt', 'The collar, to the pack on the belt'],
    correct: 'The lips, to the capsule’s front',
    explain: 'The voice leaves at the mouth, so every distance here starts at the lips and ends at the capsule — wherever on the body it is worn.',
    why: {
      'The chin, to the clip on the shirt': 'The chin is not where the voice leaves; measure from the lips.',
      'The collar, to the pack on the belt': 'The pack transmits; the capsule hears. Measure from the lips to the capsule.',
    },
  },
  {
    id: 'b5.place.2',
    page: 'placement',
    prompt: 'You move a lav from the middle of the chest up to the collar. What tends to change?',
    options: ['More voice, but nearer the chin and the jaw', 'Less voice, since it is farther from the mouth', 'Only the look in the picture, not the sound'],
    correct: 'More voice, but nearer the chin and the jaw',
    explain: 'Nearer the mouth it hears more voice against the room — and more of the chin, the jaw’s movement and the collar. Listen and compare at matched loudness.',
    why: {
      'Less voice, since it is farther from the mouth': 'The collar is nearer the mouth than the sternum is.',
      'Only the look in the picture, not the sound': 'The place changes the distance and what rubs: the sound changes too.',
    },
  },
  {
    id: 'b5.place.3',
    page: 'placement',
    prompt: 'The hidden lav sounds dull and scratchy. A first idea to try?',
    options: ['Go back to the visible place and compare', 'Boost the treble until it sounds clear', 'Add a second hidden lav beside it, both open'],
    correct: 'Go back to the visible place and compare',
    explain: 'Hide a lav only after a visible place works. Compare the two at matched loudness; if the hidden one fails, use the visible lav or a boom the shot allows.',
    why: {
      'Boost the treble until it sounds clear': 'More treble makes the scratching louder too; it does not stop the cloth.',
      'Add a second hidden lav beside it, both open': 'Two lavs on one voice comb, and both hear the cloth.',
    },
  },
  {
    id: 'b5.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Where does the tug from a sit or a gesture end up with both loops in?',
    options: ['At the lower, taped loop', 'At the capsule, as a thump', 'At the transmitter’s antenna'],
    correct: 'At the lower, taped loop',
    explain: 'The secondary loop is taped to the garment: the pull stops there, and the broadcast loop at the clip keeps a little spare as well. The capsule stays still.',
    why: {
      'At the capsule, as a thump': 'That is what happens with no loops: the pull runs up to the clip.',
      'At the transmitter’s antenna': 'The antenna hangs from the pack; the cable’s pull runs the other way, up the chest.',
    },
  },
  {
    id: 'b5.ctx.1',
    page: 'context',
    prompt: 'A live talk with a PA. A fair first body mic for the presenter?',
    options: ['A headset, the lectern mic muted', 'A lav on the chest, with the PA turned up', 'A hidden lav under the jacket'],
    correct: 'A headset, the lectern mic muted',
    explain: 'A capsule close to the mouth keeps the voice ahead of the PA; one open mic on that voice keeps the margin. Check the system level with the operator.',
    why: {
      'A lav on the chest, with the PA turned up': 'A lav on the chest is farther away: turning the PA up brings feedback closer.',
      'A hidden lav under the jacket': 'Hidden adds cloth noise and dulling — and it is still on the chest.',
    },
  },
  {
    id: 'b5.ctx.2',
    page: 'context',
    prompt: 'Where should the PA sit for a directional headset’s most rejection?',
    options: ['Behind the capsule, past the cheek', 'Straight in front of the presenter', 'Anywhere — a headset is too close to care'],
    correct: 'Behind the capsule, past the cheek',
    explain: 'A cardioid rejects most behind it. Aimed in at the lips from beside the mouth, its rear points out past the cheek — so the PA on that side sits nearest the rejection.',
    why: {
      'Straight in front of the presenter': 'In front is near the capsule’s pickup, not its rear.',
      'Anywhere — a headset is too close to care': 'Closeness helps a lot, but the pattern still decides how much PA it hears.',
    },
  },
  {
    id: 'b5.ctx.studio',
    page: 'context',
    prompt: 'A recorded studio interview, no loudspeakers, a close shot. A fair first mic?',
    options: ['A clean, centred lav that fits the shot', 'A headset turned up as far as it goes', 'Two lavs on one jacket, both left open at once'],
    correct: 'A clean, centred lav that fits the shot',
    explain: 'With no PA there is nothing to reject: a natural voice, low clothing noise and the picture come first. A headset, a hidden lav or a boom can work too, each for a reason.',
    why: {
      'A headset turned up as far as it goes': 'Gain does not make a voice better; and a headset may not suit the picture.',
      'Two lavs on one jacket, both left open at once': 'Two open mics on one voice comb. One mic, with a tested backup on its own track.',
    },
  },
  {
    id: 'b5.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · The presenter reads down. Which mic’s distance to the mouth holds?',
    options: ['The headset', 'The lav on the sternum', 'The lav on the lapel'],
    correct: 'The headset',
    explain: 'A headset is worn on the head and tips with it. A lav stays on the chest while the mouth tips down and away.',
    why: {
      'The lav on the sternum': 'It stays on the chest while the mouth tips down: the distance and angle change.',
      'The lav on the lapel': 'A lapel is part of the jacket — it stays put as the head tips.',
    },
  },
  {
    id: 'b5.two.1',
    page: 'twoMic',
    prompt: 'Headset and lectern mic both open on the presenter. Why can it sound hollow?',
    options: ['One voice arrives twice, a little apart in time', 'The lectern mic flips the voice’s polarity', 'Two mics make the voice too loud to hear'],
    correct: 'One voice arrives twice, a little apart in time',
    explain: 'The headset hears the voice first and the lectern mic a little later. Summed, some pitches arrive out of step and cancel — a comb.',
    why: {
      'The lectern mic flips the voice’s polarity': 'Distance delays a sound; it does not flip its sign.',
      'Two mics make the voice too loud to hear': 'The second copy colours the sound more than it adds level.',
    },
  },
  polarityDelay('b5.two.2'),
  {
    id: 'b5.two.3',
    page: 'twoMic',
    prompt: 'You want a backup for the headset. Where does the backup lav go?',
    options: ['On its own recorder track, muted in the live mix', 'Summed into the stream with the headset', 'Into the PA, a little lower than the headset'],
    correct: 'On its own recorder track, muted in the live mix',
    explain: 'A backup is a tested fallback you switch to. Kept on its own track it is ready; summed with the headset it is a second open mic on one voice.',
    why: {
      'Summed into the stream with the headset': 'Summed, it combs with the headset and costs margin.',
      'Into the PA, a little lower than the headset': 'In the PA it is another open mic on the same voice.',
    },
  },
  {
    id: 'b5.two.4',
    page: 'twoMic',
    prompt: 'Can delaying the headset fix the comb with the lectern mic for good?',
    options: ['No — it suits one place, and they move', 'Yes — once lined up it stays lined up', 'Yes, if the delay is set a little longer'],
    correct: 'No — it suits one place, and they move',
    explain: 'A delay lines the two arrivals up for one position of the mouth. As the presenter moves, the gap changes again. Muting one is the reliable step.',
    why: {
      'Yes — once lined up it stays lined up': 'The gap depends on where the mouth is: it changes as they move.',
      'Yes, if the delay is set a little longer': 'A wrong delay makes a new comb; it does not remove one.',
    },
  },
  {
    id: 'b5.prac.gain',
    page: 'practice',
    prompt: 'The presenter’s laugh lights the transmitter’s overload light. What do you do?',
    options: ['Lower the transmitter’s input gain, then check', 'Pull the channel fader down at the mixing desk', 'Ask the presenter not to laugh on air'],
    correct: 'Lower the transmitter’s input gain, then check',
    explain: 'Set gain on the loudest real speech and laughter, with headroom at the transmitter, the receiver and every stage after. A lower fader does not undo clipping before it.',
    why: {
      'Pull the channel fader down at the mixing desk': 'The overload is at the transmitter’s input: the fader only makes the clipped sound quieter.',
      'Ask the presenter not to laugh on air': 'The show is theirs; set gain for what they really do.',
    },
  },
  {
    id: 'b5.prac.3',
    page: 'practice',
    prompt: 'What would justify a second body mic for one presenter?',
    options: ['A tested backup, on its own track', 'A fuller voice from two open mics', 'More level than one mic gives'],
    correct: 'A tested backup, on its own track',
    explain: 'A backup earns its place for a live show, on its own track, switched to only when needed. Two open mics on one voice comb.',
    why: {
      'A fuller voice from two open mics': 'Two open mics on one voice usually sound hollower, not fuller.',
      'More level than one mic gives': 'Level comes from gain and closeness, not from another mic.',
    },
  },
  {
    id: 'b5.mix.1',
    page: 'practice',
    prompt: 'A thump every time the presenter sits down. A first idea to try?',
    options: ['Add the loops; secure the cable lower down', 'Cut the low end hard on the presenter’s channel', 'Clip the lav lower on the chest'],
    correct: 'Add the loops; secure the cable lower down',
    explain: 'A thump on a move is the cable tugging the capsule. A broadcast loop and a taped loop lower down take the pull before it reaches the clip.',
    why: {
      'Cut the low end hard on the presenter’s channel': 'A deep cut thins the voice and leaves the tug.',
      'Clip the lav lower on the chest': 'Lower is farther from the mouth, and the cable still pulls.',
    },
  },
  {
    id: 'b5.mix.2',
    page: 'practice',
    prompt: 'Pops on P and B from the headset. A first idea to try?',
    options: ['Set the capsule back beside the mouth’s corner', 'Turn the gain on the headset up a little more', 'Swap the headset for a lav up on the shirt collar'],
    correct: 'Set the capsule back beside the mouth’s corner',
    explain: 'In front of the lips the capsule sits in the puffs. Beside the corner of the mouth, where its maker puts it — and with its own windscreen — the puffs go past.',
    why: {
      'Turn the gain on the headset up a little more': 'More gain makes the pops louder.',
      'Swap the headset for a lav up on the shirt collar': 'That gives up the headset’s steadiness; fix the capsule’s place first.',
    },
  },
  removeDelay('b5.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'b5.sym.rub',
    observation: 'Scratching and rustling as the presenter moves',
    firstChecks: 'Is cloth, a tie, hair or jewellery touching the capsule? Is the cable rubbing on a seam?',
    options: ['Lift the capsule off the cloth; reroute the cable', 'Add noise reduction to the presenter’s channel later', 'Clip the lav a little lower down on the shirt'],
    correct: 'Lift the capsule off the cloth; reroute the cable',
    explain: 'Rubbing is contact: give the capsule a little space from the cloth (a mount made for it), keep the cable off moving seams, and secure it in more than one place.',
    why: {
      'Add noise reduction to the presenter’s channel later': 'Processing cannot cleanly remove a rub that is mixed with the voice.',
      'Clip the lav a little lower down on the shirt': 'Lower is farther from the mouth — and the cloth can rub there too.',
    },
  },
  {
    id: 'b5.sym.dull',
    observation: 'The hidden lav sounds dull',
    firstChecks: 'Is the opening covered? How many layers? Does the visible place sound clear?',
    options: ['Clear the opening; compare with the visible lav', 'Turn the presenter’s headset up', 'Boost all the treble on the presenter’s channel'],
    correct: 'Clear the opening; compare with the visible lav',
    explain: 'Cloth over the capsule dulls the top end. Keep an opening, use a concealer made for it, compare with the visible place at matched loudness — or go visible.',
    why: {
      'Turn the presenter’s headset up': 'A headset is a different mic; this is the hidden lav’s cover.',
      'Boost all the treble on the presenter’s channel': 'Boosting brings up the rustle with the voice; fix the cover first.',
    },
  },
  {
    id: 'b5.sym.turn',
    observation: 'The voice drops when the presenter turns to the guest',
    firstChecks: 'Is the lav off the middle, on the side away from the guest? Would a centred place or a headset hold better?',
    options: ['Centre the lav, or try a headset', 'Turn the presenter’s channel up a little', 'Ask the presenter to face front'],
    correct: 'Centre the lav, or try a headset',
    explain: 'A turn takes the mouth away from a chest mic — more so from one off to the far side. A centred lav reads both turns alike; a headset turns with the head.',
    why: {
      'Turn the presenter’s channel up a little': 'More gain lifts the room with the voice and does not follow the turn.',
      'Ask the presenter to face front': 'The program needs them to turn. Choose the mic for it.',
    },
  },
  {
    id: 'b5.sym.pops',
    observation: 'Pops on P and B from the headset',
    firstChecks: 'Is the capsule in front of the lips? Is its windscreen on? Did the boom get bent forward?',
    options: ['Set the capsule back by the corner of the mouth', 'Cut the low end hard on the presenter’s channel', 'Turn the PA down a little for the presenter'],
    correct: 'Set the capsule back by the corner of the mouth',
    explain: 'The puffs go straight out of the lips. Beside the corner of the mouth, as its maker says, with its windscreen on, they go past.',
    why: {
      'Cut the low end hard on the presenter’s channel': 'A deep cut thins the voice and leaves the blast on the capsule.',
      'Turn the PA down a little for the presenter': 'The PA level does not move the breath.',
    },
  },
  {
    id: 'b5.sym.dropout',
    observation: 'The voice drops out at one end of the stage',
    firstChecks: 'Batteries? Frequencies coordinated? Was the radio checked along the whole path the presenter walks?',
    options: ['Check the radio along the whole walk', 'Turn the receiver’s output up a little', 'Clip the lav up nearer to the mouth'],
    correct: 'Check the radio along the whole walk',
    explain: 'A clean check at one spot does not prove the walk. With the responsible operator: batteries, coordinated frequencies, antenna placement and coverage along the whole path.',
    why: {
      'Turn the receiver’s output up a little': 'A dropout is the radio link failing; more output does not restore it.',
      'Clip the lav up nearer to the mouth': 'The capsule’s place does not fix the radio path.',
    },
  },
  hollowSymptom('b5.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'b5.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of fitting a body mic in the order you would do them.',
    steps: [
      { text: 'Ask the wearer; learn the shot, the clothes and the moves', early: 'Start with the person and the program, before any equipment.' },
      { text: 'Check the mic, its adapter and the transmitter match', early: 'Know the electrical path before fitting anything.' },
      { text: 'Clip it visibly, centred, with a loop and the cable secured', early: 'Fit the mic once the path is right.' },
      { text: 'Set gain on the loudest real speech and laughter', early: 'Gain comes once the mic is fitted.' },
      { text: 'Rehearse turns, sitting, standing and gestures', early: 'Check the movement once the level is set.' },
      { text: 'Hide it only if the shot needs it; compare again', early: 'Conceal after the visible place works.' },
      { text: 'Trace every route; live, working level only', early: 'Routing and the live check come last.' },
    ],
    explain: 'A sensible order. Never plug a bodypack lav straight into phantom power; let the wearer remove it at any time; live, never raise a level to find feedback.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'b5.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A recorded studio interview, no loudspeakers, a close shot; the presenter in a jacket, agreeing to a body mic.',
    setups: [
      { id: 'a', label: 'An omni lav on the sternum, a loop at the clip and one lower down', ok: true, power: 'phantom', feedback: 'A recommended start: centred, steady, quiet cable — check turns and the clothes.' },
      { id: 'b', label: 'A lav hidden under the shirt, after the visible place was checked', ok: true, power: 'phantom', feedback: 'A recommended start if the shot needs it — compare it with the visible place.' },
      { id: 'c', label: 'A lav on the far lapel, untested with turns', ok: false, power: 'phantom', feedback: 'Off the middle and untested: a turn away from it will drop the voice.' },
      { id: 'd', label: 'A lav taped to the skin with camera tape', ok: false, power: 'phantom', feedback: 'Camera tape is not skin-safe. Use an adhesive made for skin, after asking.' },
      { id: 'e', label: 'The bodypack lav plugged straight into a phantom input', ok: false, power: 'phantom', feedback: 'Never — only through its own specified adapter.' },
    ],
    reasons: [docReason('the lips'), clearReason('the clothes, the hair and the jewellery'), { id: 'r.consent', label: 'The wearer agreed, and wardrobe approved the mount', role: 'required', feedback: 'Say how the person and their clothes were asked first.' }, { id: 'r.hidden', label: 'Hiding a lav always sounds as good as a visible one', role: 'wrong', feedback: 'Cloth over a capsule can dull and rub: compare them.' }, BRAND_REASON('presenter'), LOUD_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point measured from the lips, the capsule clear of the clothes, the wearer’s agreement — and no promise that hidden sounds the same.',
  },
  {
    id: 'b5.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A live talk on a stage with a PA: the presenter walks away from a lectern that has its own mic.',
    setups: [
      { id: 'a', label: 'An omni headset beside the mouth, the lectern mic muted', ok: true, power: 'phantom', feedback: 'A recommended start: close to the mouth, one open mic — check the PA with the operator.' },
      { id: 'b', label: 'A directional headset, its rear toward the PA, the lectern muted', ok: true, power: 'phantom', feedback: 'A recommended start — check its actual pattern against the PA’s place.' },
      { id: 'c', label: 'A lav low on the chest with the PA turned up', ok: false, power: 'phantom', feedback: 'Farther from the mouth, and more PA level: less margin before feedback.' },
      { id: 'd', label: 'The headset and the lectern mic both open', ok: false, power: 'phantom', feedback: 'Two open mics on one voice comb and cost margin. Mute one.' },
      { id: 'e', label: 'Raise the headset until it rings, then back off', ok: false, power: 'phantom', feedback: 'Never provoke feedback. Bring each mic to its working level only.' },
    ],
    reasons: [docReason('the lips'), clearReason('the presenter’s face and the headband’s fit'), { id: 'r.mute', label: 'One open mic on the voice; the lectern muted, a backup on its own track', role: 'required', feedback: 'Say how the two mics on one voice are handled.' }, { id: 'r.rf', label: 'The radio checked along the whole walk, with the operator', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON('presenter'), { id: 'r.loudest', label: 'Turn the PA up so the voice stays on top', role: 'wrong', feedback: 'More PA level brings feedback closer.' }],
    explain: 'Two setups pass. What passes is the reasoning: a capsule close to the mouth, one open mic on the voice, the PA toward the rejection, the radio checked — and no feedback provoked.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: the presenter turns to a guest. Which mic keeps its distance?', options: ['A lav on the chest', 'A headset', 'Both the same'], after: 'Now STEP through (or PLAY ONCE), then turn the head, try the loops and the breath.' },
  microphone: { prompt: 'Before you choose: which body mic sits closest to the mouth?', options: ['An omni lav', 'A headset', 'A hidden lav'], after: 'Now choose each TYPE and see where it starts.' },
  placement: { prompt: 'Predict: you move the lav from the sternum to the lapel. What changes?', options: ['Turns one way sound different', 'Nothing much', 'It depends on this presenter'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The PA is at the stage’s front corner on the presenter’s right. Where will a directional headset reject it best?', options: ['Straight in front', 'Behind the capsule, past the cheek', 'Above the head'], after: 'Now turn the capsule with AIM and watch REJECTION.' },
  twoMic: { prompt: 'If you flip the lectern mic’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'sound',
    prompt: 'The presenter reads down. What happens at a lav on the chest?',
    options: ['The mouth tips away from it; the lav stays put', 'It tips down with the head and keeps aim', 'Nothing changes: it is fixed to the shirt'],
    correct: 'The mouth tips away from it; the lav stays put',
    explain: 'The lav moves with the chest. As the head tips down, the mouth moves and its axis turns away: the distance and the angle change.',
    why: {
      'It tips down with the head and keeps aim': 'Only a headset moves with the head.',
      'Nothing changes: it is fixed to the shirt': 'The lav is fixed — the mouth is not. Its distance and angle change.',
    },
  },
  {
    id: 'q.2',
    covers: 'sound',
    prompt: 'What stops a sit-down from tugging the lav’s capsule?',
    options: ['A loop at the clip and one taped lower down', 'Clipping the lav as tightly as it will go', 'Running the cable straight and pulled tight'],
    correct: 'A loop at the clip and one taped lower down',
    explain: 'Moves lengthen the path from the clip to the pack. Spare cable at the clip gives first; a loop taped lower down stops the pull before the clip.',
    why: {
      'Clipping the lav as tightly as it will go': 'A tight clip does not stop the cable pulling on it.',
      'Running the cable straight and pulled tight': 'A tight cable passes every move straight to the capsule.',
    },
  },
  {
    id: 'q.3',
    covers: 'setting',
    critical: true,
    prompt: 'A bodypack lav and a 48 V phantom input. What is safe?',
    options: ['Only through the mic’s own specified adapter', 'Straight in, if the plug fits the input socket', 'Straight in, with the gain turned down low'],
    correct: 'Only through the mic’s own specified adapter',
    explain: 'Never plug a bodypack lav straight into phantom power: only through the adapter or power module made for it. A fitting plug is not proof of the right wiring or bias.',
    why: {
      'Straight in, if the plug fits the input socket': 'The same plug shape can carry different wiring and bias.',
      'Straight in, with the gain turned down low': 'Gain does nothing about the phantom voltage on the mic.',
    },
  },
  {
    id: 'q.4',
    covers: 'setting',
    critical: true,
    prompt: 'Before clipping a lav to someone, what comes first?',
    options: ['Their agreement, and wardrobe’s on the clothes', 'The camera’s shot first, then the mic itself', 'Testing the radio link from each spot on the stage'],
    correct: 'Their agreement, and wardrobe’s on the clothes',
    explain: 'A mic goes on a person only with their agreement; wardrobe approves any change to the clothes; the wearer can take it off at any time.',
    why: {
      'The camera’s shot first, then the mic itself': 'The shot matters, but the person comes first.',
      'Testing the radio link from each spot on the stage': 'The radio check comes later, once the mic is fitted with agreement.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'The headset is live at the lectern. The lectern mic should be…',
    options: ['Muted, so the voice has one open mic', 'Open, so that the voice sounds a little fuller', 'Open but lower, as a backup'],
    correct: 'Muted, so the voice has one open mic',
    explain: 'Two open mics on one voice comb and cost margin before feedback. Mute the one not in use; keep any backup on its own track.',
    why: {
      'Open, so that the voice sounds a little fuller': 'Two copies of one voice sound hollower, not fuller.',
      'Open but lower, as a backup': 'A backup is switched to, not left open in the mix.',
    },
  },
  hearingDiag('q.6', W),
];

const wedges: Wedge[] = [
  {
    id: 'pa',
    label: 'the PA loudspeaker at the stage’s front corner, on the presenter’s right',
    short: 'PA',
    p: { x: PA_C.x, y: FLOOR, z: PA_C.z },
    lift: FLOOR - PA_C.y,
    faces: { x: 1, y: 0, z: 0 },
    note: 'On a pole at the stage’s front corner, facing the audience: its back and side spill toward the stage — past the presenter’s right cheek.',
    prov: { kind: 'illustrative', reason: 'a typical small stage: the PA’s place and height are drawing defaults' },
    glyph: 'none',
  },
];

export const B05_LESSON: Lesson = {
  id: 'B05',
  labId: 'broadcast',
  title: 'Lavalier, Headset and Concealed Pickup',
  subtitle: 'A lav on the sternum about 12–25 cm from the lips, or a headset by the corner of the mouth — fitted with the wearer’s agreement',
  noun: { one: 'presenter', many: 'presenters', subject: 'presenter' },
  model: B05_MODEL,
  micTypeIds: ['locLav', 'lavCard', 'vocHeadset', 'hsCard', 'bcGoose'],
  zones: B05_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A microphone the presenter wears: a lavalier clipped to the clothes on the chest, one hidden under them, or a headset with its capsule beside the mouth.', src: 'LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'Studio interviews and news, location shoots, talks and presentations on a stage, theatre — wherever a person moves, turns or needs both hands.', src: 'LESSON' },
    { title: 'WHAT IT DOES', text: 'It keeps the voice usable while the person turns, reads, walks and changes posture — and fits the picture or the stage.', src: 'LESSON' },
    { title: 'NO SINGLE RIGHT PLACE', text: 'Different mics, clothes, voices and rooms call for different places. Begin with a centred, visible lav or a headset where its maker says, rehearse the real moves, and adjust by listening. Experimentation is encouraged.', src: 'LESSON' },
  ],
  sound: {
    stages: [
      { title: 'Breath from the lungs', text: 'The lungs push air up the windpipe — the power behind every word, quiet or emphatic.' },
      { title: 'The vocal folds buzz', text: 'In the voice box, low in the throat, two small folds come together and the breath sets them buzzing. That buzz is the raw sound of the voice.' },
      { title: 'The throat and mouth shape it', text: 'The throat, the tongue, the lips and the open mouth shape the buzz into vowels and words; the tongue, the teeth and the lips add the consonants.' },
      { title: 'It leaves the mouth', text: 'Almost all of it leaves through the open mouth — on m, n and ng partly through the nose. That is where every distance here is measured from: the lips.' },
    ],
    attack: 'P and B push a puff of air straight out of the lips; S and T send a narrow hiss forward. A capsule in that path hears pops and harsh S sounds — beside the corner of the mouth, or down on the chest, it is out of it.',
    body: 'The vowels carry most of the level and the tone. A lav on the chest hears them from below the chin — a little chest-heavy and quieter when the head turns; a headset hears them from beside the mouth, steady as the head moves. Tendencies, to check by ear.',
    head: { diameterMm: 0, rods: 0, label: 'the mouth', strikeSrc: 'LESSON' },
  },
  setting: {
    items: [
      { id: 'presenter', label: 'the presenter', short: 'PRESENTER', note: 'Standing, the mouth at the point every distance is read from. The head turns, reads down and smiles; the body sits, stands and gestures.', prov: { kind: 'illustrative', reason: 'the shared figure standing (drawing default)' }, tag: 'THE SOURCE', scene: 'all' },
      { id: 'clothes', label: 'the clothes', short: 'CLOTHES', note: 'The jacket, the shirt, a tie, a scarf or jewellery: they hold the clip, and they can rub, tap and cover the capsule. Wardrobe approves any change.', prov: { kind: 'illustrative', reason: 'the lesson L6, L21' }, tag: 'NOISE', scene: 'all' },
      { id: 'cable', label: 'the cable and the pack', short: 'CABLE', note: 'From the capsule down the chest to the bodypack on the belt: loops and a second fixing take the tug of a move.', prov: { kind: 'illustrative', reason: 'the lesson L24' }, tag: 'STRAIN', scene: 'all' },
      { id: 'camera', label: 'the camera', short: 'CAMERA', note: 'The shot decides between a visible lav, a hidden one and a headset.', prov: { kind: 'illustrative', reason: 'the lesson L6' }, tag: 'PICTURE', scene: 'studio' },
      { id: 'lectern', label: 'the lectern mic', short: 'LECTERN', note: 'A second mic on the same voice: muted whenever the body mic is live.', prov: { kind: 'illustrative', reason: 'the lesson L33' }, tag: 'BLEED', scene: 'stage' },
      { id: 'pa', label: 'the PA', short: 'PA', note: 'Live: it faces the audience, but every open mic on the stage hears it. A capsule close to the mouth and the fewest open mics keep the margin.', prov: { kind: 'illustrative', reason: 'a typical small stage' }, tag: 'FEEDBACK', scene: 'stage' },
    ],
    stage: 'LIVE: a headset beside the mouth, its rear toward the PA where it is directional, the lectern muted, every route traced. Never provoke feedback.',
    studio: 'STUDIO: a centred lav, about 12–25 cm from the lips, a loop at the clip and the cable secured lower down — hidden only after the visible place works.',
  },
  diagnostic,
  practice: {
    task: 'Choose a body mic for a studio interview and for a live talk, describe an alternative, and explain what would justify a second mic. With a real, agreeing presenter, you can record what you tried below.',
    fields: [
      { id: 'consent', label: 'Agreement, wardrobe and the scene', kind: 'text' },
      { id: 'mic', label: 'Mic, pattern and where it is worn', kind: 'choice', choices: ['omni lav, visible', 'omni lav, hidden', 'directional lav', 'omni headset', 'directional headset', 'other'] },
      { id: 'distance', label: 'Distance from the lips and orientation', kind: 'text' },
      { id: 'cable', label: 'Clip, loops, adapter and pack', kind: 'text' },
      { id: 'routes', label: 'Radio, PA, stream, recorder and earpiece', kind: 'text' },
      { id: 'notes', label: 'Turns, noise, tone and decision (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The standing presenter: the voice family’s figure, the lips 1550 mm above the floor; the jacket and shirt drawn over its chest — drawing defaults.', dims: ['yFloor'] },
    { text: 'The clip points on the clothes (sternum, lapel 75 mm off the middle, collar, tie, neckline) and a capsule 6 mm off the garment — drawing defaults on the shared figure; the distances they give (about 13–24 cm) fall inside the researched 12.5–25 cm band.', dims: [] },
    { text: 'The headset’s capsule 14 mm ahead of the lips and 34 mm to the side — about 24 mm from the mouth’s corner, inside the 2–3 cm a headset maker gives; the corner itself is a drawing default.', dims: [] },
    { text: 'The cable’s spare in each loop (60 and 50 mm) and how much a sit, a turn or a gesture lengthens the path (45, 30, 55 mm) — drawing defaults for a simplified picture. The breath jet’s angle and reach — the voice family’s illustrative cone.', dims: [] },
    { text: 'The studio camera (2.5 m out, a close shot), the lectern (as the panels lesson’s), the PA’s place (1.5 m out, 1.5 m to the right, 1.7 m up) — drawing defaults. The head turns about its centre (a simplified picture).', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every presenter, garment, mic and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a presenter in a typical standing pose, the clip points and the cable’s give as drawing defaults, the breath as a cone, mic patterns and the two-mic comb as textbook shapes. Distances are rounded to about 5 mm and measured from the lips to the capsule. Ask first; skin-safe adhesive only on skin; never a bodypack lav straight into phantom power; never provoke feedback.',
  copy: B05_COPY,
};
